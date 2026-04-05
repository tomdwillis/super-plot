import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface OfferRequestBody {
  reportOrderId?: string;
  parcelApn?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  valuationSnapshot?: Record<string, unknown>;
}

function validateBody(body: unknown): { errors: string[] } {
  const errors: string[] = [];
  if (typeof body !== "object" || body === null) {
    return { errors: ["Request body must be a JSON object"] };
  }
  const b = body as Record<string, unknown>;

  if (!b.contactName || typeof b.contactName !== "string" || !b.contactName.trim()) {
    errors.push("contactName is required");
  }
  if (!b.contactEmail || typeof b.contactEmail !== "string" || !b.contactEmail.includes("@")) {
    errors.push("contactEmail must be a valid email address");
  }
  if (!b.contactPhone || typeof b.contactPhone !== "string" || !b.contactPhone.trim()) {
    errors.push("contactPhone is required");
  }
  if (b.reportOrderId !== undefined && typeof b.reportOrderId !== "string") {
    errors.push("reportOrderId must be a string");
  }

  return { errors };
}

// ---------------------------------------------------------------------------
// POST /api/wilco-land/offer-request
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { errors } = validateBody(body);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const b = body as OfferRequestBody;

  // If a reportOrderId was provided, verify it exists
  if (b.reportOrderId) {
    const reportRows = await query(
      `SELECT id FROM report_orders WHERE id = $1`,
      [b.reportOrderId]
    ).catch(() => []);

    if (reportRows.length === 0) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }
  }

  try {
    const rows = await query<{ id: string; created_at: string }>(
      `INSERT INTO wilco_land_leads (
         report_order_id,
         parcel_apn,
         contact_name,
         contact_email,
         contact_phone,
         valuation_snapshot
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [
        b.reportOrderId ?? null,
        b.parcelApn ?? null,
        b.contactName.trim(),
        b.contactEmail.trim().toLowerCase(),
        b.contactPhone.trim(),
        b.valuationSnapshot ? JSON.stringify(b.valuationSnapshot) : null,
      ]
    );

    const lead = rows[0];

    return NextResponse.json(
      {
        success: true,
        leadId: lead.id,
        message: "Thank you for your interest. We'll review your property details and follow up within a few business days — no obligation.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/wilco-land/offer-request error:", err);
    return NextResponse.json(
      { error: "Failed to submit offer request" },
      { status: 500 }
    );
  }
}
