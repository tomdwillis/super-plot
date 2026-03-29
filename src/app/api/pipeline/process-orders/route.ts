import { NextRequest, NextResponse } from "next/server";
import { processGeneratingOrders } from "@/lib/pipeline";

/**
 * POST /api/pipeline/process-orders
 *
 * Internal endpoint invoked by:
 *   - Vercel cron (every 5 minutes, via vercel.json) — catches any orders the
 *     webhook fire-and-forget may have missed.
 *   - Manual calls during development/ops.
 *
 * Protected by PIPELINE_SECRET bearer token.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.PIPELINE_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processGeneratingOrders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[process-orders] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
