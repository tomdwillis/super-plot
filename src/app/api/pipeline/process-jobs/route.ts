import { NextRequest, NextResponse } from "next/server";
import { runWorker } from "@/lib/worker";
import { checkRateLimit } from "@/lib/ratelimit";

/**
 * GET|POST /api/pipeline/process-jobs
 *
 * Processes pending report jobs through the enrichment pipeline.
 * Invoked by:
 *   - Vercel cron (every 5 minutes)
 *   - Manual calls during development/ops
 *
 * Protected by PIPELINE_SECRET bearer token.
 */
async function handle(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, { limit: 10, windowSecs: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  const secret = process.env.PIPELINE_SECRET ?? process.env.CRON_SECRET;
  if (!secret) {
    console.error("[process-jobs] Neither PIPELINE_SECRET nor CRON_SECRET is set — refusing all requests");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWorker(10);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[process-jobs] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
