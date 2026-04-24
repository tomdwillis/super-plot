import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { enqueueJob } from "@/lib/queue";
import { checkRateLimit } from "@/lib/ratelimit";
import { createSession } from "@/lib/auth";

const VALID_INPUT_TYPES = ["apn", "address"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, { limit: 5, windowSecs: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const { email, parcel_input, input_type } = body;

    if (!email || !parcel_input) {
      return NextResponse.json(
        { error: "email and parcel_input are required" },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const resolvedInputType = VALID_INPUT_TYPES.includes(input_type) ? input_type : "apn";

    const rows = await query<{ id: string }>(
      `INSERT INTO report_orders
         (email, tier, parcel_input, input_type, status, price_cents, created_at, updated_at)
       VALUES ($1, 'free', $2, $3, 'generating', 0, now(), now())
       RETURNING id`,
      [email, parcel_input, resolvedInputType]
    );

    const reportId = rows[0].id;

    // Enqueue the pipeline job so the report actually gets generated
    await enqueueJob(reportId);

    // Free checkouts happen without prior auth, so establish a dashboard session now.
    await createSession(email);

    return NextResponse.json({ reportId });
  } catch (err) {
    console.error("POST /api/reports/free error:", err);
    return NextResponse.json({ error: "Failed to create free report" }, { status: 500 });
  }
}
