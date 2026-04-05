import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, parcel_input, input_type } = body;

    if (!email || !parcel_input) {
      return NextResponse.json(
        { error: "email and parcel_input are required" },
        { status: 400 }
      );
    }

    const rows = await query<{ id: string }>(
      `INSERT INTO report_orders
         (email, tier, parcel_input, input_type, status, price_cents, created_at, updated_at)
       VALUES ($1, 'free', $2, $3, 'generating', 0, now(), now())
       RETURNING id`,
      [email, parcel_input, input_type ?? "apn"]
    );

    const reportId = rows[0].id;

    return NextResponse.json({ reportId });
  } catch (err) {
    console.error("POST /api/reports/free error:", err);
    return NextResponse.json({ error: "Failed to create free report" }, { status: 500 });
  }
}
