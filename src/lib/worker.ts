import { query } from "@/lib/db";
import {
  claimNextJob,
  advanceJob,
  completeJob,
  failJob,
  STAGE_ORDER,
  type ReportJob,
  type PipelineStage,
} from "@/lib/queue";
import {
  assembleReport,
  type AssemblyInput,
  type ParcelData,
  type EnvironmentalData,
  type MarketData,
  type ValuationData,
} from "@/lib/services/report-assembly";
import { generatePdf } from "@/lib/services/pdf-generator";
import { findSeedParcel, generatePlausibleData } from "@/lib/seed-data";

interface ReportOrder {
  id: string;
  email: string;
  tier: "free" | "standard" | "premium";
  parcel_input: string;
  input_type: "apn" | "address";
}

type StageResult = Record<string, unknown>;
type StageHandler = (
  order: ReportOrder,
  job: ReportJob
) => Promise<StageResult>;

// ─── Stage handlers ──────────────────────────────────────────────────────────

async function parcelLookup(order: ReportOrder): Promise<StageResult> {
  const geocodeUrl = process.env.GEOCODE_SERVICE_URL;
  const parcelLookupUrl = process.env.PARCEL_LOOKUP_URL;

  if (order.input_type === "apn") {
    if (parcelLookupUrl) {
      const res = await fetch(
        `${parcelLookupUrl}?apn=${encodeURIComponent(order.parcel_input)}`
      );
      if (!res.ok) throw new Error(`APN lookup failed: ${res.status}`);
      return { parcel: await res.json() };
    }
  } else if (geocodeUrl) {
    const res = await fetch(
      `${geocodeUrl}?address=${encodeURIComponent(order.parcel_input)}`
    );
    if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
    return { parcel: await res.json() };
  }

  // Seed data fallback: known parcels get real data, unknown get plausible generated data
  const seed = findSeedParcel(order.parcel_input, order.input_type);
  if (seed) {
    return { parcel: seed.parcel, _seedData: seed };
  }

  const generated = generatePlausibleData(order.parcel_input, order.input_type);
  return { parcel: generated.parcel, _seedData: generated };
}

async function environmentalScreening(
  _order: ReportOrder,
  job: ReportJob
): Promise<StageResult> {
  const envServiceUrl = process.env.ENVIRONMENTAL_SERVICE_URL;
  const parcel = job.stage_data.parcel as Record<string, unknown>;

  if (envServiceUrl) {
    const res = await fetch(`${envServiceUrl}/screen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parcelId: parcel.parcelId }),
    });
    if (!res.ok) throw new Error(`Environmental screening failed: ${res.status}`);
    return { environmental: await res.json() };
  }

  // Use seed data if available from parcel lookup stage
  const seedData = job.stage_data._seedData as { environmental: EnvironmentalData } | undefined;
  if (seedData) {
    return { environmental: seedData.environmental };
  }

  return {
    environmental: {
      floodZone: "X",
      wetlands: false,
      contamination: "none",
      endangered_species: false,
    },
  };
}

async function marketData(
  _order: ReportOrder,
  job: ReportJob
): Promise<StageResult> {
  const marketServiceUrl = process.env.MARKET_DATA_SERVICE_URL;
  const parcel = job.stage_data.parcel as Record<string, unknown>;

  if (marketServiceUrl) {
    const res = await fetch(`${marketServiceUrl}/comps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parcelId: parcel.parcelId, address: parcel.address }),
    });
    if (!res.ok) throw new Error(`Market data fetch failed: ${res.status}`);
    return { market: await res.json() };
  }

  // Use seed data if available from parcel lookup stage
  const seedData = job.stage_data._seedData as { market: MarketData } | undefined;
  if (seedData) {
    return { market: seedData.market };
  }

  return {
    market: {
      comparables: [],
      medianPricePerAcre: 5000,
      trendDirection: "stable",
    },
  };
}

async function valuation(
  order: ReportOrder,
  job: ReportJob
): Promise<StageResult> {
  const valuationServiceUrl = process.env.VALUATION_SERVICE_URL;
  const parcel = job.stage_data.parcel as Record<string, unknown>;
  const market = job.stage_data.market as Record<string, unknown>;
  const environmental = job.stage_data.environmental as Record<string, unknown>;

  if (valuationServiceUrl) {
    const res = await fetch(`${valuationServiceUrl}/value`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parcel, market, environmental, tier: order.tier }),
    });
    if (!res.ok) throw new Error(`Valuation failed: ${res.status}`);
    return { valuation: await res.json() };
  }

  // Use seed data if available from parcel lookup stage
  const seedData = job.stage_data._seedData as { valuation: ValuationData } | undefined;
  if (seedData) {
    return { valuation: seedData.valuation };
  }

  return {
    valuation: {
      estimatedValue: 25000,
      confidenceScore: 0.72,
      methodology: "comparable_sales",
      pricePerAcre: 5000,
    },
  };
}

async function reportAssembly(
  order: ReportOrder,
  job: ReportJob
): Promise<StageResult> {
  const parcel = job.stage_data.parcel as ParcelData;
  const environmental = job.stage_data.environmental as EnvironmentalData;
  const market = job.stage_data.market as MarketData;
  const valuation = job.stage_data.valuation as ValuationData;
  const isSeedData = !!job.stage_data._seedData;

  const input: AssemblyInput = {
    orderId: job.report_order_id,
    tier: order.tier,
    parcelInput: order.parcel_input,
    parcel,
    environmental,
    market,
    valuation,
  };

  const report = await assembleReport(input);

  // Add "Beta Preview" label when running on seed/generated data
  if (isSeedData) {
    report.title = `[Beta Preview] ${report.title}`;
  }

  return { report };
}

async function pdfGeneration(
  _order: ReportOrder,
  job: ReportJob
): Promise<StageResult> {
  const pdfServiceUrl = process.env.PDF_SERVICE_URL;
  const report = job.stage_data.report as Record<string, unknown>;

  // If an external PDF service is configured, delegate to it
  if (pdfServiceUrl) {
    const res = await fetch(`${pdfServiceUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report, orderId: job.report_order_id }),
    });
    if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`);
    const data = await res.json();
    return { pdfUrl: data.pdfUrl, filePath: data.filePath, fileSize: data.fileSize };
  }

  // Local PDF generation using @react-pdf/renderer
  const assembledReport = report as unknown as import("@/lib/services/report-assembly").AssembledReport;
  const result = await generatePdf(assembledReport);

  return {
    pdfUrl: result.pdfUrl,
    filePath: result.filePath,
    fileSize: result.fileSize,
  };
}

const STAGE_HANDLERS: Record<PipelineStage, StageHandler> = {
  parcel_lookup: parcelLookup,
  environmental: environmentalScreening,
  market_data: marketData,
  valuation,
  report_assembly: reportAssembly,
  pdf_generation: pdfGeneration,
};

// ─── Worker ──────────────────────────────────────────────────────────────────

async function updateReportStatus(
  orderId: string,
  status: string,
  extra?: { pdf_url?: string; title?: string }
): Promise<void> {
  const sets = ["status = $2", "updated_at = now()"];
  const params: unknown[] = [orderId, status];
  let idx = 3;

  if (extra?.pdf_url) {
    sets.push(`pdf_url = $${idx}`);
    params.push(extra.pdf_url);
    idx++;
  }
  if (extra?.title) {
    sets.push(`title = $${idx}`);
    params.push(extra.title);
    idx++;
  }

  await query(`UPDATE report_orders SET ${sets.join(", ")} WHERE id = $1`, params);
}

async function processJob(job: ReportJob): Promise<void> {
  const pipelineStart = Date.now();
  const stageDurations: Record<string, number> = {};

  const orders = await query<ReportOrder>(
    `SELECT id, email, tier, parcel_input, input_type
     FROM report_orders WHERE id = $1`,
    [job.report_order_id]
  );

  if (orders.length === 0) {
    throw new Error(`Report order ${job.report_order_id} not found`);
  }

  const order = orders[0];
  await updateReportStatus(order.id, "enriching");

  // Find current stage index and run remaining stages
  const startIdx = STAGE_ORDER.indexOf(job.stage);

  for (let i = startIdx; i < STAGE_ORDER.length; i++) {
    const stage = STAGE_ORDER[i];
    const stageStart = Date.now();
    console.log(`[worker] Job ${job.id}: running stage ${stage}`);

    const handler = STAGE_HANDLERS[stage];
    const result = await handler(order, job);

    stageDurations[stage] = Date.now() - stageStart;

    // Merge result into job stage_data for subsequent stages
    Object.assign(job.stage_data, result);

    if (i < STAGE_ORDER.length - 1) {
      await advanceJob(job.id, STAGE_ORDER[i + 1], result);
    }
  }

  // All stages complete
  const pdfUrl = job.stage_data.pdfUrl as string | undefined;
  const report = job.stage_data.report as Record<string, unknown> | undefined;
  const title = report?.title as string | undefined;
  const totalDuration = Date.now() - pipelineStart;

  await completeJob(job.id, { pdfUrl: pdfUrl ?? null });
  await updateReportStatus(order.id, "ready", {
    pdf_url: pdfUrl,
    title,
  });

  console.log(
    `[worker] Job ${job.id} completed for order ${order.id} in ${totalDuration}ms | ` +
    `stages: ${Object.entries(stageDurations).map(([s, d]) => `${s}=${d}ms`).join(", ")}`
  );
}

/**
 * Process up to `batchSize` jobs from the queue.
 * Returns counts of processed/failed jobs.
 */
export async function runWorker(
  batchSize = 5,
  workerId = `worker-${Date.now()}`
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < batchSize; i++) {
    const job = await claimNextJob(workerId);
    if (!job) break;

    try {
      await processJob(job);
      processed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[worker] Job ${job.id} failed:`, message);

      await failJob(job.id, message);

      // If max retries exhausted, mark the report as failed
      if (job.attempts >= job.max_attempts) {
        await updateReportStatus(job.report_order_id, "failed");
      }

      failed++;
    }
  }

  return { processed, failed };
}
