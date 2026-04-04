import { z } from "zod";
import { query } from "@/lib/db";

interface ReportOrder {
  id: string;
  email: string;
  tier: "free" | "basic" | "professional" | "premium";
  parcel_input: string;
  input_type: "apn" | "address";
}

// M-2: Zod schemas for pipeline responses
const ParcelDataSchema = z.object({
  parcelId: z.string(),
  apn: z.string(),
  address: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const PipelineResultSchema = z.object({
  pdfUrl: z
    .string()
    .url()
    .regex(/^https:\/\/storage\.superplot\.com\/reports\//, {
      message: "pdf_url must be an HTTPS URL matching https://storage.superplot.com/reports/*",
    }),
  title: z.string(),
});

type ParcelData = z.infer<typeof ParcelDataSchema>;
type PipelineResult = z.infer<typeof PipelineResultSchema>;

// M-3: Parcel input validation regexes
const APN_PATTERN = /^[\d-]+$/;

async function resolveParcel(
  parcelInput: string,
  inputType: "apn" | "address"
): Promise<ParcelData> {
  // M-3: Validate input before passing to external services
  if (inputType === "apn") {
    if (!APN_PATTERN.test(parcelInput) || parcelInput.length > 30) {
      throw new Error("Invalid APN: must contain only digits and hyphens and be ≤ 30 characters");
    }
  } else {
    if (!parcelInput || parcelInput.length > 200) {
      throw new Error("Invalid address: must be a non-empty string ≤ 200 characters");
    }
  }

  const geocodeUrl = process.env.GEOCODE_SERVICE_URL;
  const parcelLookupUrl = process.env.PARCEL_LOOKUP_URL;

  if (inputType === "apn") {
    if (!parcelLookupUrl) {
      // Stub: return synthetic parcel until APN service is wired
      const stub = {
        parcelId: `parcel-${parcelInput}`,
        apn: parcelInput,
        address: `Parcel ${parcelInput}`,
      };
      return ParcelDataSchema.parse(stub);
    }
    const res = await fetch(`${parcelLookupUrl}?apn=${encodeURIComponent(parcelInput)}`);
    if (!res.ok) throw new Error(`APN lookup failed: ${res.status}`);
    return ParcelDataSchema.parse(await res.json());
  } else {
    if (!geocodeUrl) {
      // Stub: return synthetic parcel until geocode service is wired
      const stub = {
        parcelId: `parcel-${Buffer.from(parcelInput).toString("base64").slice(0, 12)}`,
        apn: "UNKNOWN",
        address: parcelInput,
      };
      return ParcelDataSchema.parse(stub);
    }
    const res = await fetch(`${geocodeUrl}?address=${encodeURIComponent(parcelInput)}`);
    if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
    return ParcelDataSchema.parse(await res.json());
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
    return PipelineResultSchema.parse({
      pdfUrl: placeholderUrl,
      title: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Report — ${parcel.address}`,
    });
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

  // M-2: Validate pipeline response before storing
  return PipelineResultSchema.parse(await res.json());
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
