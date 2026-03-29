import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

export const TIER_PRICES: Record<string, { cents: number; name: string }> = {
  basic: { cents: 2900, name: "Super Plot Basic Report" },
  professional: { cents: 5900, name: "Super Plot Professional Report" },
  premium: { cents: 9900, name: "Super Plot Premium Report" },
};
