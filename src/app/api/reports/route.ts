import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

const EmailQuerySchema = z.string().email();

export async function GET(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, { limit: 20, windowSecs: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  const emailParam = req.nextUrl.searchParams.get("email");
  const parsed = EmailQuerySchema.safeParse(emailParam);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }
  const email = parsed.data;

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
