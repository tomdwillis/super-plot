import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

const EmailSchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, { limit: 10, windowSecs: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const parsed = EmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    const { email } = parsed.data;

    const normalizedEmail = email.toLowerCase().trim();

    // Upsert email capture — idempotent if they sign up multiple times
    await query(
      `INSERT INTO email_captures (email, created_at)
       VALUES ($1, now())
       ON CONFLICT (email) DO NOTHING`,
      [normalizedEmail]
    );

    // Also add to CRM leads pipeline for follow-up (skip if already exists)
    await query(
      `INSERT INTO leads (id, email, source, status, created_at, updated_at)
       SELECT gen_random_uuid(), $1, 'landing_page', 'new', now(), now()
       WHERE NOT EXISTS (
         SELECT 1 FROM leads WHERE email = $1 AND (apn IS NULL OR apn = '')
       )`,
      [normalizedEmail]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/email-capture error:", err);
    // Non-fatal — always return 200 to avoid blocking the user
    return NextResponse.json({ success: true });
  }
}
