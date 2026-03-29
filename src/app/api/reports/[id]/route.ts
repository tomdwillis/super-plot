import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const rows = await query(
      `SELECT id, email, tier, parcel_input, input_type, status, title, pdf_url,
              price_cents, created_at, updated_at
       FROM report_orders
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report: rows[0] });
  } catch (err) {
    console.error(`GET /api/reports/${id} error:`, err);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}
