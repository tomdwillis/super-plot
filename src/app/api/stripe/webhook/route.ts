import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { stripe } from "@/lib/stripe";
import { query } from "@/lib/db";
import { processGeneratingOrders } from "@/lib/pipeline";
import { generateMagicToken } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import Stripe from "stripe";

// Stripe requires raw body for signature verification
export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  const receivedAt = Date.now();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.log(JSON.stringify({ event: "stripe_webhook_received", result: "missing_signature" }));
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    Sentry.captureException(new Error("STRIPE_WEBHOOK_SECRET is not configured"), {
      tags: { component: "stripe_webhook" },
    });
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(
      JSON.stringify({
        event: "stripe_webhook_signature_failed",
        error: err instanceof Error ? err.message : String(err),
      })
    );
    Sentry.captureException(err, {
      tags: {
        component: "stripe_webhook",
        stripeEventType: "unknown",
        stripeEventId: "unknown",
      },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(
    JSON.stringify({
      event: "stripe_webhook_received",
      stripeEventType: event.type,
      stripeEventId: event.id,
      result: "signature_valid",
    })
  );

  // Record last webhook received timestamp for /api/stripe/health
  query(
    `INSERT INTO stripe_webhook_health (id, last_received_at, last_event_type, last_event_id)
     VALUES (1, now(), $1, $2)
     ON CONFLICT (id) DO UPDATE
       SET last_received_at = now(),
           last_event_type  = EXCLUDED.last_event_type,
           last_event_id    = EXCLUDED.last_event_id`,
    [event.type, event.id]
  ).catch((err) =>
    console.error(
      JSON.stringify({
        event: "stripe_webhook_health_update_failed",
        stripeEventType: event.type,
        stripeEventId: event.id,
        error: err instanceof Error ? err.message : String(err),
      })
    )
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { reportId, tier, parcelInput, inputType, email } = session.metadata ?? {};

    if (!reportId) {
      const missingMetaErr = new Error("Webhook: missing reportId in session metadata");
      console.error(
        JSON.stringify({
          event: "stripe_webhook_missing_metadata",
          stripeEventType: event.type,
          stripeEventId: event.id,
          sessionId: session.id,
        })
      );
      Sentry.captureException(missingMetaErr, {
        tags: { stripeEventType: event.type, stripeEventId: event.id },
        extra: { sessionId: session.id, metadata: session.metadata },
      });
      return NextResponse.json({ received: true });
    }

    try {
      const dbStart = Date.now();
      await query(
        `UPDATE report_orders
         SET status = 'generating',
             stripe_payment_intent_id = $2,
             stripe_session_id = $3,
             updated_at = now()
         WHERE id = $1`,
        [reportId, session.payment_intent as string, session.id]
      );
      const dbMs = Date.now() - dbStart;

      // Trigger pipeline (fire-and-forget)
      const pipelineStart = Date.now();
      processGeneratingOrders()
        .then(() => {
          const triggerMs = Date.now() - pipelineStart;
          console.log(
            JSON.stringify({
              event: "stripe_webhook_pipeline_triggered",
              stripeEventType: event.type,
              stripeEventId: event.id,
              reportId,
              tier,
              parcelInput,
              inputType,
              totalWebhookLatencyMs: Date.now() - receivedAt,
              dbUpdateMs: dbMs,
              pipelineTriggerMs: triggerMs,
            })
          );
        })
        .catch((err) => {
          console.error(
            JSON.stringify({
              event: "stripe_webhook_pipeline_trigger_failed",
              stripeEventType: event.type,
              stripeEventId: event.id,
              reportId,
              error: err instanceof Error ? err.message : String(err),
            })
          );
          Sentry.captureException(err, {
            tags: { stripeEventType: event.type, stripeEventId: event.id },
            extra: { reportId, tier, parcelInput },
          });
        });

      // Send magic link so the purchaser can access their report
      if (email) {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const token = await generateMagicToken(email);
          const magicLinkUrl = `${appUrl}/api/auth/magic-link?token=${token}`;
          await sendMagicLinkEmail(email, magicLinkUrl);
          console.log(
            JSON.stringify({
              event: "stripe_webhook_magic_link_sent",
              stripeEventType: event.type,
              stripeEventId: event.id,
              reportId,
            })
          );
        } catch (emailErr) {
          console.error(
            JSON.stringify({
              event: "stripe_webhook_magic_link_failed",
              stripeEventType: event.type,
              stripeEventId: event.id,
              reportId,
              error: emailErr instanceof Error ? emailErr.message : String(emailErr),
            })
          );
          Sentry.captureException(emailErr, {
            tags: { stripeEventType: event.type, stripeEventId: event.id },
            extra: { reportId },
          });
        }
      }
    } catch (err) {
      console.error(
        JSON.stringify({
          event: "stripe_webhook_db_update_failed",
          stripeEventType: event.type,
          stripeEventId: event.id,
          reportId,
          error: err instanceof Error ? err.message : String(err),
        })
      );
      Sentry.captureException(err, {
        tags: { stripeEventType: event.type, stripeEventId: event.id },
        extra: { reportId, sessionId: session.id },
      });
      // Return 200 anyway so Stripe doesn't retry
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    console.log(
      JSON.stringify({
        event: "stripe_webhook_payment_failed",
        stripeEventType: event.type,
        stripeEventId: event.id,
        paymentIntentId: intent.id,
        lastPaymentErrorCode: intent.last_payment_error?.code,
      })
    );

    // Clean up any pending order for this payment intent
    try {
      await query(
        `UPDATE report_orders
         SET status = 'failed', updated_at = now()
         WHERE stripe_payment_intent_id = $1 AND status = 'pending'`,
        [intent.id]
      );
    } catch (err) {
      console.error(
        JSON.stringify({
          event: "stripe_webhook_payment_failed_cleanup_error",
          stripeEventType: event.type,
          stripeEventId: event.id,
          paymentIntentId: intent.id,
          error: err instanceof Error ? err.message : String(err),
        })
      );
      Sentry.captureException(err, {
        tags: { stripeEventType: event.type, stripeEventId: event.id },
        extra: { paymentIntentId: intent.id },
      });
    }
  } else {
    console.log(
      JSON.stringify({
        event: "stripe_webhook_unhandled_event_type",
        stripeEventType: event.type,
        stripeEventId: event.id,
      })
    );
  }

  return NextResponse.json({ received: true });
}
