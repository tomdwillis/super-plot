import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { enqueueJob } from "@/lib/queue";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";

// ─── POST /api/reports ───────────────────────────────────────────────────────

const CreateByParcelId = z.object({
  parcelId: z.string().min(1).max(50),
  tier: z.enum(["free", "standard", "premium"]).default("free"),
  email: z.string().email().optional(),
});

const CreateByAddress = z.object({
  address: z.string().min(1).max(200),
  county: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(50).optional(),
  tier: z.enum(["free", "standard", "premium"]).default("free"),
  email: z.string().email().optional(),
});

const CreateReportSchema = z.union([CreateByParcelId, CreateByAddress]);

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, { limit: 10, windowSecs: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const parsed = CreateReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Resolve email: prefer body, fall back to session
    const sessionEmail = await getSession(req);
    const email = ("email" in data && data.email) ? data.email : sessionEmail;
    if (!email) {
      return NextResponse.json(
        { error: "Email is required (provide in body or authenticate)" },
        { status: 400 }
      );
    }

    // Determine parcel input and type
    let parcelInput: string;
    let inputType: "apn" | "address";

    if ("parcelId" in data) {
      parcelInput = data.parcelId;
      inputType = "apn";
    } else {
      const parts = [data.address, data.county, data.state].filter(Boolean);
      parcelInput = parts.join(", ");
      inputType = "address";
    }

    const tier = data.tier;

    // Paid tiers must go through /api/stripe/checkout to enforce payment
    if (tier !== "free") {
      return NextResponse.json(
        { error: "Paid reports must be purchased through /api/stripe/checkout" },
        { status: 400 }
      );
    }

    // Create the report order
    const rows = await query<{ id: string }>(
      `INSERT INTO report_orders
         (email, tier, parcel_input, input_type, status, price_cents, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'pending', 0, now(), now())
       RETURNING id`,
      [email, tier, parcelInput, inputType]
    );

    const reportId = rows[0].id;

    // Enqueue the job for async processing
    const jobId = await enqueueJob(reportId);

    return NextResponse.json({ reportId, jobId, status: "pending" }, { status: 201 });
  } catch (err) {
    console.error("POST /api/reports error:", err);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}

// ─── GET /api/reports ─────────────���──────────────────────────────────────────

const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  email: z.string().email().optional(),
});

export async function GET(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, { limit: 20, windowSecs: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = ListQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { page, limit } = parsed.data;

  // Resolve email: prefer query param, fall back to session
  const sessionEmail = await getSession(req);
  const email = parsed.data.email ?? sessionEmail;
  if (!email) {
    return NextResponse.json(
      { error: "Email query param or authentication required" },
      { status: 400 }
    );
  }

  try {
    const offset = (page - 1) * limit;

    const [reports, countResult] = await Promise.all([
      query(
        `SELECT id, email, tier, parcel_input, input_type, status, title, pdf_url,
                price_cents, created_at, updated_at
         FROM report_orders
         WHERE email = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [email, limit, offset]
      ),
      query<{ count: string }>(
        `SELECT count(*)::text as count FROM report_orders WHERE email = $1`,
        [email]
      ),
    ]);

    const total = parseInt(countResult[0].count, 10);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/reports error:", err);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
