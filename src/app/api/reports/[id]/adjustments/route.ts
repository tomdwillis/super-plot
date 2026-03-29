import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  validateAdjustmentPayload,
  ValuationAdjustmentPayload,
  ValuationAdjustmentRow,
} from "@/lib/adjustments";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fire-and-forget re-valuation job.
 * Posts to PIPELINE_SERVICE_URL/revaluate with the adjustment id.
 * Errors are logged but never bubble up to the caller.
 */
function triggerRevaluation(adjustmentId: string, reportOrderId: string): void {
  const pipelineServiceUrl = process.env.PIPELINE_SERVICE_URL;
  if (!pipelineServiceUrl) {
    console.log(
      `[adjustments] PIPELINE_SERVICE_URL not set — skipping re-valuation trigger for adjustment ${adjustmentId}`
    );
    return;
  }

  fetch(`${pipelineServiceUrl}/revaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adjustmentId, reportOrderId }),
  }).catch((err) => {
    console.error(
      `[adjustments] Re-valuation trigger failed for adjustment ${adjustmentId}:`,
      err
    );
  });
}

// ---------------------------------------------------------------------------
// GET /api/reports/[id]/adjustments
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: reportOrderId } = params;

  try {
    // Verify the report exists
    const reportRows = await query(
      `SELECT id FROM report_orders WHERE id = $1`,
      [reportOrderId]
    );
    if (reportRows.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const adjustments = await query<ValuationAdjustmentRow>(
      `SELECT id, report_order_id, septic, road_access, wetlands_pct,
              utility_electric, utility_water, utility_sewer, utility_gas,
              topography, zoning_confirmed, flood_zone,
              timber_known, minerals_known, notes, raw_payload, status,
              created_at, updated_at
       FROM valuation_adjustments
       WHERE report_order_id = $1
       ORDER BY created_at DESC`,
      [reportOrderId]
    );

    return NextResponse.json({ adjustments });
  } catch (err) {
    console.error(`GET /api/reports/${reportOrderId}/adjustments error:`, err);
    return NextResponse.json(
      { error: "Failed to load adjustments" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/reports/[id]/adjustments
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: reportOrderId } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Inject reportOrderId from the URL so callers don't have to duplicate it,
  // but also validate that if provided it matches.
  if (
    typeof body === "object" &&
    body !== null &&
    "reportOrderId" in body &&
    (body as Record<string, unknown>).reportOrderId !== reportOrderId
  ) {
    return NextResponse.json(
      { error: "reportOrderId in body does not match report id in URL" },
      { status: 400 }
    );
  }

  const payload: unknown =
    typeof body === "object" && body !== null
      ? { ...(body as Record<string, unknown>), reportOrderId }
      : body;

  const errors = validateAdjustmentPayload(payload);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const p = payload as ValuationAdjustmentPayload;

  try {
    // Verify the report exists
    const reportRows = await query(
      `SELECT id FROM report_orders WHERE id = $1`,
      [reportOrderId]
    );
    if (reportRows.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const rows = await query<ValuationAdjustmentRow>(
      `INSERT INTO valuation_adjustments (
         report_order_id, septic, road_access, wetlands_pct,
         utility_electric, utility_water, utility_sewer, utility_gas,
         topography, zoning_confirmed, flood_zone,
         timber_known, minerals_known, notes, raw_payload
       ) VALUES (
         $1, $2, $3, $4,
         $5, $6, $7, $8,
         $9, $10, $11,
         $12, $13, $14, $15
       )
       RETURNING id, report_order_id, septic, road_access, wetlands_pct,
                 utility_electric, utility_water, utility_sewer, utility_gas,
                 topography, zoning_confirmed, flood_zone,
                 timber_known, minerals_known, notes, raw_payload, status,
                 created_at, updated_at`,
      [
        reportOrderId,
        p.septic ?? null,
        p.roadAccess ?? null,
        p.wetlandsPercentage ?? null,
        p.utilities?.electric ?? null,
        p.utilities?.water ?? null,
        p.utilities?.sewer ?? null,
        p.utilities?.gas ?? null,
        p.topography ?? null,
        p.zoningConfirmed ?? null,
        p.floodZone ?? null,
        p.timberMinerals?.timber ?? null,
        p.timberMinerals?.minerals ?? null,
        p.notes ?? null,
        JSON.stringify(p),
      ]
    );

    const adjustment = rows[0];
    triggerRevaluation(adjustment.id, reportOrderId);

    return NextResponse.json({ adjustment }, { status: 201 });
  } catch (err) {
    console.error(`POST /api/reports/${reportOrderId}/adjustments error:`, err);
    return NextResponse.json(
      { error: "Failed to save adjustment" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/reports/[id]/adjustments
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: reportOrderId } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Same reportOrderId merge + mismatch check as POST
  if (
    typeof body === "object" &&
    body !== null &&
    "reportOrderId" in body &&
    (body as Record<string, unknown>).reportOrderId !== reportOrderId
  ) {
    return NextResponse.json(
      { error: "reportOrderId in body does not match report id in URL" },
      { status: 400 }
    );
  }

  const payload: unknown =
    typeof body === "object" && body !== null
      ? { ...(body as Record<string, unknown>), reportOrderId }
      : body;

  const errors = validateAdjustmentPayload(payload);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const p = payload as ValuationAdjustmentPayload;

  try {
    // Verify the report exists
    const reportRows = await query(
      `SELECT id FROM report_orders WHERE id = $1`,
      [reportOrderId]
    );
    if (reportRows.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Find the most recent pending (or any) adjustment for this report
    const existing = await query<{ id: string }>(
      `SELECT id FROM valuation_adjustments
       WHERE report_order_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [reportOrderId]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "No existing adjustment found for this report. Use POST to create one." },
        { status: 404 }
      );
    }

    const adjustmentId = existing[0].id;

    const rows = await query<ValuationAdjustmentRow>(
      `UPDATE valuation_adjustments
       SET septic            = $2,
           road_access       = $3,
           wetlands_pct      = $4,
           utility_electric  = $5,
           utility_water     = $6,
           utility_sewer     = $7,
           utility_gas       = $8,
           topography        = $9,
           zoning_confirmed  = $10,
           flood_zone        = $11,
           timber_known      = $12,
           minerals_known    = $13,
           notes             = $14,
           raw_payload       = $15,
           status            = 'pending'
       WHERE id = $1
       RETURNING id, report_order_id, septic, road_access, wetlands_pct,
                 utility_electric, utility_water, utility_sewer, utility_gas,
                 topography, zoning_confirmed, flood_zone,
                 timber_known, minerals_known, notes, raw_payload, status,
                 created_at, updated_at`,
      [
        adjustmentId,
        p.septic ?? null,
        p.roadAccess ?? null,
        p.wetlandsPercentage ?? null,
        p.utilities?.electric ?? null,
        p.utilities?.water ?? null,
        p.utilities?.sewer ?? null,
        p.utilities?.gas ?? null,
        p.topography ?? null,
        p.zoningConfirmed ?? null,
        p.floodZone ?? null,
        p.timberMinerals?.timber ?? null,
        p.timberMinerals?.minerals ?? null,
        p.notes ?? null,
        JSON.stringify(p),
      ]
    );

    const adjustment = rows[0];
    triggerRevaluation(adjustment.id, reportOrderId);

    return NextResponse.json({ adjustment });
  } catch (err) {
    console.error(`PUT /api/reports/${reportOrderId}/adjustments error:`, err);
    return NextResponse.json(
      { error: "Failed to update adjustment" },
      { status: 500 }
    );
  }
}
