import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Session is guaranteed by middleware (401 if missing).
  // Verify report ownership here (403 if email mismatch).
  const sessionEmail = await getSession(req);

  try {
    const rows = await query<{ id: string; email: string; tier: string; parcel_input: string; input_type: string; status: string; title: string | null; pdf_url: string | null; price_cents: number; created_at: Date; updated_at: Date }>(
      `SELECT id, email, tier, parcel_input, input_type, status, title, pdf_url,
              price_cents, created_at, updated_at
       FROM report_orders
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const report = rows[0];

    if (sessionEmail && report.email.toLowerCase() !== sessionEmail.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error(`GET /api/reports/${id} error:`, err);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}
