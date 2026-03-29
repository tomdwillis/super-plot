import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { query } from "@/lib/db";
import { processGeneratingOrders } from "@/lib/pipeline";
import Stripe from "stripe";

// Stripe requires raw body for signature verification
export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { reportId, tier, parcelInput, inputType, email } = session.metadata ?? {};

    if (!reportId) {
      console.error("Webhook: missing reportId in session metadata");
      return NextResponse.json({ received: true });
    }

    try {
      // Mark payment confirmed, transition to 'generating'
      await query(
        `UPDATE report_orders
         SET status = 'generating',
             stripe_payment_intent_id = $2,
             stripe_session_id = $3,
             updated_at = now()
         WHERE id = $1`,
        [reportId, session.payment_intent as string, session.id]
      );

      console.log(
        `[webhook] Report ${reportId} confirmed. Tier=${tier}, ` +
          `Parcel=${parcelInput} (${inputType}), Email=${email}. Triggering pipeline.`
      );

      // Fire-and-forget: process this order (and any other queued generating orders).
      // Errors are caught inside processGeneratingOrders so they don't affect the webhook response.
      processGeneratingOrders().catch((err) =>
        console.error("[webhook] Pipeline trigger failed:", err)
      );
    } catch (err) {
      console.error("Webhook: DB update failed:", err);
      // Return 200 anyway so Stripe doesn't retry; alert should fire from DB monitoring
    }
  }

  return NextResponse.json({ received: true });
}
