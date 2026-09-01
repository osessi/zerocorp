import { z } from "zod";
import { customerMoneySchema, type CustomerMoney } from "@zerocorp/contracts";

/**
 * Commercial configuration.
 *
 * PRODUCT_SPEC.md §3 marks every price as a hypothesis to validate, and §29.3 requires
 * the activation setup price to be "configurable, never hard-coded". So prices live
 * here, as data, with the defaults decided on 2026-09-01.
 *
 * D15: everything a customer sees is CustomerMoney, which is USD in V1. Government and
 * provider fees are CostMoney in their own currency and live in the catalog, not here —
 * a cost is not a price, and putting them in the same file is how they get added
 * together by accident.
 */

export const SETUP_PATHS = ["launch", "activation"] as const;
export type SetupPath = (typeof SETUP_PATHS)[number];

export const SUBSCRIPTION_PLANS = ["launch", "growth", "autopilot"] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const pricingSchema = z.object({
  setup: z.record(z.enum(SETUP_PATHS), customerMoneySchema),
  subscription: z.record(z.enum(SUBSCRIPTION_PLANS), customerMoneySchema),
});
export type Pricing = z.infer<typeof pricingSchema>;

/**
 * PRODUCT_SPEC.md §3 and §29.3, with D16 for the activation price.
 *
 * Every one of these is a HYPOTHESIS. They are defaults precisely so that validating
 * one is an edit to configuration rather than a change to code.
 */
export const DEFAULT_PRICING: Pricing = {
  setup: {
    launch: { amountMinor: 99_700, currency: "USD" },
    // D16, 2026-09-01. Supersedes the "~$497 TO CONFIRM" marker and the $497-$697 range.
    // Validate against willingness to pay and against the operator time a digital audit
    // actually costs, which is the number most likely to move it.
    activation: { amountMinor: 49_700, currency: "USD" },
  },
  subscription: {
    launch: { amountMinor: 9_900, currency: "USD" },
    growth: { amountMinor: 39_900, currency: "USD" },
    autopilot: { amountMinor: 79_900, currency: "USD" },
  },
};

export function setupPrice(pricing: Pricing, path: SetupPath): CustomerMoney {
  const price = pricing.setup[path];
  if (!price) throw new Error(`No setup price configured for "${path}"`);
  return price;
}

export function subscriptionPrice(pricing: Pricing, plan: SubscriptionPlan): CustomerMoney {
  const price = pricing.subscription[plan];
  if (!price) throw new Error(`No subscription price configured for "${plan}"`);
  return price;
}
