import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/stripe/health
 *
 * Internal endpoint returning the last Stripe webhook received timestamp.
 * Useful for detecting silent webhook delivery failures.
 *
 * Protected by PIPELINE_SECRET bearer token (same as /api/pipeline/process-orders).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.PIPELINE_SECRET;
  if (!secret) {
    console.error("[stripe/health] PIPELINE_SECRET is not set — refusing all requests");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await query<{
      last_received_at: string;
      last_event_type: string | null;
      last_event_id: string | null;
    }>(
      `SELECT last_received_at, last_event_type, last_event_id
       FROM stripe_webhook_health
       WHERE id = 1`
    );

    if (rows.length === 0) {
      return NextResponse.json({
        ok: true,
        lastReceivedAt: null,
        lastEventType: null,
        lastEventId: null,
        secondsSinceLastWebhook: null,
        message: "No webhook received yet",
      });
    }

    const { last_received_at, last_event_type, last_event_id } = rows[0];
    const secondsSince = Math.floor(
      (Date.now() - new Date(last_received_at).getTime()) / 1000
    );

    return NextResponse.json({
      ok: true,
      lastReceivedAt: last_received_at,
      lastEventType: last_event_type,
      lastEventId: last_event_id,
      secondsSinceLastWebhook: secondsSince,
    });
  } catch (err) {
    console.error("[stripe/health] DB query failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
