import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  try {
    const reports = await query(
      `SELECT id, email, tier, parcel_input, input_type, status, title, pdf_url,
              price_cents, stripe_payment_intent_id, created_at, updated_at
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
