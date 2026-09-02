import { z } from "zod";

/**
 * What ZeroCorp charges to activate a business.
 *
 * ONE constant, env-overridable, because the price is not settled. `OPEN_DECISIONS.md`
 * carries a live contradiction:
 *
 *   D16       $497 as the configured default for Business Activation Setup
 *   B1        $997 + $99/mo, from PRODUCT_VISION §0 and §5, marked unresolved
 *
 * Both are written down and they disagree. A price hard-coded into a checkout route while
 * that is open is a price that ends up in three files at two values, and the one nobody
 * updates is the one that charges the customer.
 *
 * The default here is $997 because that is the most recent explicit instruction and it
 * matches PRODUCT_VISION. D16 has NOT been rewritten — resolving it is a pricing decision,
 * not an engineering one.
 *
 * No env read here: contracts is layer 0 and has no environment. The override happens in
 * the composition root, which is the layer allowed to know what a deployment is.
 */
export const ACTIVATION_PRICE_MINOR = 99_700;
export const ACTIVATION_CURRENCY = "USD" as const;

export const activationPriceSchema = z.object({
  amountMinor: z.number().int().min(1),
  currency: z.literal("USD"),
});

/** Formatted for a human, from minor units. Never floating point arithmetic on money. */
export function formatActivationPrice(minor = ACTIVATION_PRICE_MINOR): string {
  return `$${Math.floor(minor / 100).toLocaleString("en-US")}`;
}

/**
 * The fraud signals that matter on a four-figure international ticket.
 *
 * Card country, IP country and declared residency diverging is the primary signal, and it
 * is specific to this product: almost every legitimate customer is a non-resident, so
 * "card issued outside the US" is normal and useless on its own. What is NOT normal is a
 * founder who declares residence in one country, browses from a second and pays with a
 * card from a third.
 *
 * Recorded on the payment so a human can review it. Never used to auto-decline: a
 * traveller with a foreign card is a real customer, and this product's customers travel.
 */
export const paymentRiskSignalSchema = z.object({
  declaredResidency: z.string().length(2).nullable(),
  cardCountry: z.string().length(2).nullable(),
  ipCountry: z.string().length(2).nullable(),
});
export type PaymentRiskSignal = z.infer<typeof paymentRiskSignalSchema>;

/** How many of the three disagree. Two distinct countries is normal; three is not. */
export function distinctCountries(signal: PaymentRiskSignal): number {
  return new Set([signal.declaredResidency, signal.cardCountry, signal.ipCountry].filter(Boolean)).size;
}

export function needsManualReview(signal: PaymentRiskSignal): boolean {
  return distinctCountries(signal) >= 3;
}
