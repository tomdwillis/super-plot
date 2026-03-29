import { query } from "@/lib/db";

interface ReportOrder {
  id: string;
  email: string;
  tier: "free" | "basic" | "professional" | "premium";
  parcel_input: string;
  input_type: "apn" | "address";
}

interface ParcelData {
  parcelId: string;
  apn: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface PipelineResult {
  pdfUrl: string;
  title: string;
}

async function resolveParcel(
  parcelInput: string,
  inputType: "apn" | "address"
): Promise<ParcelData> {
  const geocodeUrl = process.env.GEOCODE_SERVICE_URL;
  const parcelLookupUrl = process.env.PARCEL_LOOKUP_URL;

  if (inputType === "apn") {
    if (!parcelLookupUrl) {
      // Stub: return synthetic parcel until APN service is wired
      return {
        parcelId: `parcel-${parcelInput}`,
        apn: parcelInput,
        address: `Parcel ${parcelInput}`,
      };
    }
    const res = await fetch(`${parcelLookupUrl}?apn=${encodeURIComponent(parcelInput)}`);
    if (!res.ok) throw new Error(`APN lookup failed: ${res.status}`);
    return res.json();
  } else {
    if (!geocodeUrl) {
      // Stub: return synthetic parcel until geocode service is wired
      return {
        parcelId: `parcel-${Buffer.from(parcelInput).toString("base64").slice(0, 12)}`,
        apn: "UNKNOWN",
        address: parcelInput,
      };
    }
    const res = await fetch(`${geocodeUrl}?address=${encodeURIComponent(parcelInput)}`);
    if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
    return res.json();
  }
}

async function runReportPipeline(
  parcel: ParcelData,
  tier: ReportOrder["tier"],
  orderId: string
): Promise<PipelineResult> {
  const pipelineServiceUrl = process.env.PIPELINE_SERVICE_URL;

  if (!pipelineServiceUrl) {
    // Stub: placeholder PDF URL until pipeline service is wired
    const placeholderUrl = `https://storage.superplot.com/reports/${orderId}/report.pdf`;
    return {
      pdfUrl: placeholderUrl,
      title: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Report — ${parcel.address}`,
    };
  }

  const res = await fetch(`${pipelineServiceUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, parcel, tier }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Pipeline service error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function processGeneratingOrders(): Promise<{
  processed: number;
  failed: number;
}> {
  const orders = await query<ReportOrder>(
    `SELECT id, email, tier, parcel_input, input_type
     FROM report_orders
     WHERE status = 'generating'
     ORDER BY created_at ASC
     LIMIT 10`
  );

  let processed = 0;
  let failed = 0;

  for (const order of orders) {
    try {
      const parcel = await resolveParcel(order.parcel_input, order.input_type);
      const result = await runReportPipeline(parcel, order.tier, order.id);

      await query(
        `UPDATE report_orders
         SET status = 'ready',
             pdf_url = $2,
             title = $3,
             updated_at = now()
         WHERE id = $1`,
        [order.id, result.pdfUrl, result.title]
      );

      console.log(`[pipeline] Order ${order.id} ready: ${result.pdfUrl}`);
      processed++;
    } catch (err) {
      console.error(`[pipeline] Order ${order.id} failed:`, err);

      await query(
        `UPDATE report_orders
         SET status = 'failed',
             updated_at = now()
         WHERE id = $1`,
        [order.id]
      ).catch((dbErr) =>
        console.error(`[pipeline] Failed to mark order ${order.id} as failed:`, dbErr)
      );

      failed++;
    }
  }

  return { processed, failed };
}
