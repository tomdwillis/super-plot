/**
 * GET|POST /api/drip/process
 *
 * Cron endpoint — processes pending drip emails that are due now.
 * Called by a Paperclip routine on an hourly schedule.
 *
 * Exit conditions enforced:
 *   - Skip sequence 2–5 for users who have purchased a Standard or Premium report
 *   - Skip sequence 5 for users tagged as buyers/investors (future: use leads.status)
 *
 * Secured by CRON_SECRET env var (must match Authorization header).
 * Set CRON_SECRET to a random string and configure the Paperclip routine to send it.
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendDripEmail } from "@/lib/drip-emails";

interface PendingDrip {
  id: string;
  email: string;
  sequence: number;
}

const BATCH_SIZE = 50;

async function handle(req: NextRequest) {
  const acceptedSecrets = [process.env.PIPELINE_SECRET, process.env.CRON_SECRET].filter(
    (value): value is string => Boolean(value)
  );
  if (acceptedSecrets.length === 0) {
    console.error("[drip] Neither PIPELINE_SECRET nor CRON_SECRET is set — refusing all requests");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth = req.headers.get("authorization");
  const isAuthorized = acceptedSecrets.some((secret) => auth === `Bearer ${secret}`);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch a batch of pending drip emails that are due
    const pending = await query<PendingDrip>(
      `SELECT id, email, sequence
       FROM drip_emails
       WHERE status = 'pending'
         AND scheduled_at <= now()
       ORDER BY scheduled_at ASC
       LIMIT $1`,
      [BATCH_SIZE]
    );

    if (pending.length === 0) {
      return NextResponse.json({ processed: 0, skipped: 0, failed: 0 });
    }

    // Fetch emails that have purchased paid reports (exit condition)
    const emailsWithPaidReports = await query<{ email: string }>(
      `SELECT DISTINCT email
       FROM report_orders
       WHERE tier IN ('standard', 'premium')
         AND status = 'ready'
         AND email = ANY($1)`,
      [pending.map((r) => r.email)]
    );
    const paidSet = new Set(emailsWithPaidReports.map((r) => r.email));

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of pending) {
      const { id, email, sequence } = row;

      // Skip sequences 2–5 for converted (paid) users
      if (sequence > 1 && paidSet.has(email)) {
        await query(
          `UPDATE drip_emails SET status = 'skipped' WHERE id = $1`,
          [id]
        );
        skipped++;
        continue;
      }

      try {
        await sendDripEmail(email, sequence as 1 | 2 | 3 | 4 | 5);
        await query(
          `UPDATE drip_emails SET status = 'sent', sent_at = now() WHERE id = $1`,
          [id]
        );
        processed++;
      } catch (err) {
        console.error(`[drip] Failed seq ${sequence} to ${email}:`, err);
        await query(
          `UPDATE drip_emails SET status = 'failed', error = $2 WHERE id = $1`,
          [id, String(err)]
        );
        failed++;
      }
    }

    console.log(`[drip] processed=${processed} skipped=${skipped} failed=${failed}`);
    return NextResponse.json({ processed, skipped, failed });
  } catch (err) {
    console.error("[drip] process error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
