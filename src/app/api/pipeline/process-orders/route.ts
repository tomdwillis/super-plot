import { NextRequest, NextResponse } from "next/server";
import { processGeneratingOrders } from "@/lib/pipeline";
import { checkRateLimit } from "@/lib/ratelimit";

/**
 * GET|POST /api/pipeline/process-orders
 *
 * Internal endpoint invoked by:
 *   - Vercel cron (every 5 minutes, via vercel.json) — catches any orders the
 *     webhook fire-and-forget may have missed.
 *   - Manual calls during development/ops.
 *
 * Protected by PIPELINE_SECRET bearer token.
 */
async function handle(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, { limit: 10, windowSecs: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  const acceptedSecrets = [process.env.PIPELINE_SECRET, process.env.CRON_SECRET].filter(
    (value): value is string => Boolean(value)
  );
  if (acceptedSecrets.length === 0) {
    console.error("[process-orders] Neither PIPELINE_SECRET nor CRON_SECRET is set — refusing all requests");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth = req.headers.get("authorization");
  const isAuthorized = acceptedSecrets.some((secret) => auth === `Bearer ${secret}`);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processGeneratingOrders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[process-orders] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
