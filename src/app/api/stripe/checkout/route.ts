import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, TIER_PRICES } from "@/lib/stripe";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

const CheckoutSchema = z.object({
  tier: z.string().min(1),
  parcelInput: z.string().min(1),
  inputType: z.string().default("address"),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, { limit: 5, windowSecs: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      const emailError = parsed.error.issues.find((i) => i.path.includes("email"));
      const error = emailError ? "Invalid email format" : "tier, parcelInput, and email are required";
      return NextResponse.json({ error }, { status: 400 });
    }
    const { tier, parcelInput, inputType, email } = parsed.data;

    const tierConfig = TIER_PRICES[tier];
    if (!tierConfig || tierConfig.cents === 0) {
      return NextResponse.json({ error: "Invalid report tier for checkout" }, { status: 400 });
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

    const priceId = tierConfig.priceEnvVar ? process.env[tierConfig.priceEnvVar] : undefined;

    const lineItem =
      typeof priceId === "string" && priceId.length > 0
        ? { price: priceId, quantity: 1 }
        : {
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
          };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [lineItem],
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
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe checkout error:", message, err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
