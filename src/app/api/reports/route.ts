import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, { limit: 20, windowSecs: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  try {
    const reports = await query(
      `SELECT id, email, tier, parcel_input, input_type, status, title, pdf_url,
              price_cents, created_at, updated_at
       FROM report_orders
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [email]
    );

    return NextResponse.json({ reports });
  } catch (err) {
    console.error("GET /api/reports error:", err);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
