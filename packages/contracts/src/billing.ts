import { z } from "zod";
import { SETUP_PATH_VALUES, SUBSCRIPTION_PLAN_VALUES } from "./plan";

/**
 * Billing vocabulary.
 *
 * Money is integer minor units plus a currency, with no exceptions — a ZeroCorp
 * invariant and CLAUDE_CODE_RULES.md §20. There is no `number` of dollars
 * anywhere in this repository, and no float arithmetic on money.
 */

export const moneySchema = z.object({
  amountCents: z.number().int(),
  currency: z.literal("USD"),
});
export type Money = z.infer<typeof moneySchema>;

export const CHECKOUT_STATUSES = ["pending", "completed", "expired", "failed"] as const;
export const checkoutStatusSchema = z.enum(CHECKOUT_STATUSES);
export type CheckoutStatus = z.infer<typeof checkoutStatusSchema>;

export const CHECKOUT_TRANSITIONS = {
  pending: ["completed", "expired", "failed"],
  completed: [],
  expired: [],
  failed: ["pending"],
} as const satisfies Record<CheckoutStatus, readonly CheckoutStatus[]>;

export const SUBSCRIPTION_STATUSES = ["incomplete", "active", "past_due", "canceled"] as const;
export const subscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

/** What a checkout is FOR. One setup fee plus one subscription, per PRODUCT_SPEC.md §29.3. */
export const checkoutIntentSchema = z.object({
  setupPath: z.enum(SETUP_PATH_VALUES),
  subscriptionPlan: z.enum(SUBSCRIPTION_PLAN_VALUES),
});
export type CheckoutIntent = z.infer<typeof checkoutIntentSchema>;

/** What the payment provider hands back. Provider-neutral on purpose. */
export const checkoutHandoffSchema = z.object({
  providerRef: z.string().min(1),
  redirectUrl: z.string().url(),
  expiresAt: z.date(),
});
export type CheckoutHandoff = z.infer<typeof checkoutHandoffSchema>;

/**
 * A webhook that has been verified, not merely received.
 *
 * `externalEventId` is unique per provider, which is what makes replay
 * harmless — DATABASE.md §13.
 */
export const providerEventSchema = z.object({
  provider: z.enum(["stripe"]),
  externalEventId: z.string().min(1),
  eventType: z.string().min(1),
  payloadHash: z.string().length(64),
});
export type ProviderEvent = z.infer<typeof providerEventSchema>;
