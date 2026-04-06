import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";
import { sendDripEmail, DRIP_SEQUENCE } from "@/lib/drip-emails";

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
    const inserted = await query<{ email: string }>(
      `INSERT INTO email_captures (email, created_at)
       VALUES ($1, now())
       ON CONFLICT (email) DO NOTHING
       RETURNING email`,
      [normalizedEmail]
    );

    // Only trigger drip for genuinely new email captures
    const isNew = inserted.length > 0;

    if (isNew) {
      // Schedule all 5 drip emails (idempotent via unique index on email+sequence)
      const now = new Date();
      for (const config of DRIP_SEQUENCE) {
        const scheduledAt = new Date(now.getTime() + config.delayDays * 24 * 60 * 60 * 1000);
        await query(
          `INSERT INTO drip_emails (email, sequence, scheduled_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (email, sequence) DO NOTHING`,
          [normalizedEmail, config.sequence, scheduledAt.toISOString()]
        );
      }

      // Send the welcome email (sequence 1) immediately — fire and forget
      sendDripEmail(normalizedEmail, 1)
        .then(() => {
          // Mark seq 1 as sent so the cron job skips it
          return query(
            `UPDATE drip_emails SET status = 'sent', sent_at = now()
             WHERE email = $1 AND sequence = 1`,
            [normalizedEmail]
          );
        })
        .catch((err) => {
          console.error("[drip] Failed to send welcome email:", err);
          // Mark as failed so it can be retried by the cron job
          query(
            `UPDATE drip_emails SET status = 'failed', error = $2
             WHERE email = $1 AND sequence = 1`,
            [normalizedEmail, String(err)]
          ).catch(() => {});
        });
    }

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
