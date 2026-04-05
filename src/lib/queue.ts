import { query } from "@/lib/db";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "retry";
export type PipelineStage =
  | "parcel_lookup"
  | "environmental"
  | "market_data"
  | "valuation"
  | "report_assembly"
  | "pdf_generation";

export const STAGE_ORDER: PipelineStage[] = [
  "parcel_lookup",
  "environmental",
  "market_data",
  "valuation",
  "report_assembly",
  "pdf_generation",
];

export interface ReportJob {
  id: string;
  report_order_id: string;
  status: JobStatus;
  stage: PipelineStage;
  stage_data: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  error: string | null;
  locked_at: Date | null;
  locked_by: string | null;
  scheduled_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Enqueue a new report processing job.
 */
export async function enqueueJob(reportOrderId: string): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO report_jobs (report_order_id, status, stage, scheduled_at)
     VALUES ($1, 'pending', 'parcel_lookup', now())
     RETURNING id`,
    [reportOrderId]
  );
  return rows[0].id;
}

/**
 * Claim the next available job using SELECT ... FOR UPDATE SKIP LOCKED
 * to prevent double-processing.
 */
export async function claimNextJob(workerId: string): Promise<ReportJob | null> {
  const staleThreshold = new Date(Date.now() - LOCK_TIMEOUT_MS).toISOString();

  const rows = await query<ReportJob>(
    `UPDATE report_jobs
     SET status = 'running',
         locked_at = now(),
         locked_by = $1,
         started_at = COALESCE(started_at, now()),
         attempts = attempts + 1
     WHERE id = (
       SELECT id FROM report_jobs
       WHERE (status = 'pending' OR status = 'retry'
              OR (status = 'running' AND locked_at < $2))
         AND scheduled_at <= now()
       ORDER BY scheduled_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [workerId, staleThreshold]
  );

  return rows[0] ?? null;
}

/**
 * Advance a job to the next stage and store intermediate data.
 */
export async function advanceJob(
  jobId: string,
  nextStage: PipelineStage,
  stageData: Record<string, unknown>
): Promise<void> {
  await query(
    `UPDATE report_jobs
     SET stage = $2,
         stage_data = stage_data || $3::jsonb
     WHERE id = $1`,
    [jobId, nextStage, JSON.stringify(stageData)]
  );
}

/**
 * Mark a job as completed.
 */
export async function completeJob(
  jobId: string,
  stageData: Record<string, unknown>
): Promise<void> {
  await query(
    `UPDATE report_jobs
     SET status = 'completed',
         stage_data = stage_data || $2::jsonb,
         completed_at = now(),
         locked_at = NULL,
         locked_by = NULL
     WHERE id = $1`,
    [jobId, JSON.stringify(stageData)]
  );
}

/**
 * Mark a job as failed. If under max_attempts, schedule for retry.
 */
export async function failJob(jobId: string, error: string): Promise<void> {
  await query(
    `UPDATE report_jobs
     SET status = CASE WHEN attempts < max_attempts THEN 'retry' ELSE 'failed' END,
         error = $2,
         locked_at = NULL,
         locked_by = NULL,
         scheduled_at = CASE
           WHEN attempts < max_attempts
           THEN now() + (interval '30 seconds' * attempts)
           ELSE scheduled_at
         END
     WHERE id = $1`,
    [jobId, error]
  );
}
