import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
  }
  return _stripe;
}

/** @deprecated Use getStripe() instead */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const TIER_PRICES: Record<string, { cents: number; name: string; priceEnvVar?: string }> = {
  free: { cents: 0, name: "Super Plot Free Report" },
  standard: { cents: 5900, name: "Super Plot Standard Report", priceEnvVar: "STRIPE_PRICE_STANDARD" },
  premium: { cents: 9900, name: "Super Plot Premium Report", priceEnvVar: "STRIPE_PRICE_PREMIUM" },
};
