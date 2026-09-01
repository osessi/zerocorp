import { z } from "zod";

/**
 * Commercial configuration.
 *
 * PRODUCT_SPEC.md §3 marks every price as a hypothesis to validate, and §29.3
 * requires the activation setup price to be "configurable, never hard-coded".
 * So prices live here, as data, with the defaults the spec states today.
 *
 * Money is integer minor units plus a currency, everywhere, with no exceptions.
 */

export const SETUP_PATHS = ["launch", "activation"] as const;
export type SetupPath = (typeof SETUP_PATHS)[number];

export const SUBSCRIPTION_PLANS = ["launch", "growth", "autopilot"] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const priceSchema = z.object({
  amountCents: z.number().int().nonnegative(),
  currency: z.literal("USD"),
});
export type Price = z.infer<typeof priceSchema>;

export const pricingSchema = z.object({
  setup: z.record(z.enum(SETUP_PATHS), priceSchema),
  subscription: z.record(z.enum(SUBSCRIPTION_PLANS), priceSchema),
});
export type Pricing = z.infer<typeof pricingSchema>;

/**
 * PRODUCT_SPEC.md §3 and §29.3. The activation setup price is explicitly marked
 * 🟠 TO CONFIRM there; it is a default here precisely so confirming it is an edit
 * to configuration rather than a code change.
 */
export const DEFAULT_PRICING: Pricing = {
  setup: {
    launch: { amountCents: 99_700, currency: "USD" },
    activation: { amountCents: 49_700, currency: "USD" },
  },
  subscription: {
    launch: { amountCents: 9_900, currency: "USD" },
    growth: { amountCents: 39_900, currency: "USD" },
    autopilot: { amountCents: 79_900, currency: "USD" },
  },
};

/** Presentation only. Never use the result to compute anything. */
export function formatPrice(price: Price): string {
  const whole = Math.trunc(price.amountCents / 100);
  const cents = price.amountCents % 100;
  const body = cents === 0 ? whole.toLocaleString("en-US") : (price.amountCents / 100).toFixed(2);
  return `$${body}`;
}
