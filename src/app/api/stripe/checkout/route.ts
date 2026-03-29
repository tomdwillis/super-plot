import { NextRequest, NextResponse } from "next/server";
import { stripe, TIER_PRICES } from "@/lib/stripe";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier, parcelInput, inputType, email } = body;

    if (!tier || !parcelInput || !email) {
      return NextResponse.json(
        { error: "tier, parcelInput, and email are required" },
        { status: 400 }
      );
    }

    const tierConfig = TIER_PRICES[tier];
    if (!tierConfig) {
      return NextResponse.json({ error: "Invalid report tier" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create a pending report row to reference in the Stripe session
    const rows = await query<{ id: string }>(
      `INSERT INTO report_orders
         (email, tier, parcel_input, input_type, status, price_cents, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, now(), now())
       RETURNING id`,
      [email, tier, parcelInput, inputType, tierConfig.cents]
    );
    const reportId = rows[0].id;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: tierConfig.name,
              description:
                inputType === "apn"
                  ? `APN: ${parcelInput}`
                  : `Address: ${parcelInput}`,
            },
            unit_amount: tierConfig.cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        reportId,
        tier,
        parcelInput,
        inputType,
        email,
      },
      success_url: `${appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/order`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
