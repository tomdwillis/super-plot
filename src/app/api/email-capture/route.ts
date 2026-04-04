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

    // Upsert — idempotent if they sign up multiple times
    await query(
      `INSERT INTO email_captures (email, created_at)
       VALUES ($1, now())
       ON CONFLICT (email) DO NOTHING`,
      [email.toLowerCase().trim()]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/email-capture error:", err);
    // Non-fatal — always return 200 to avoid blocking the user
    return NextResponse.json({ success: true });
  }
}
