/**
 * @zerocorp/billing — Layer 3
 *
 * Subscriptions, the append-only credit ledger, usage events and plan
 * entitlements. Money is integer minor units plus currency, never floating point.
 * Balance is always derived from the ledger, never stored as authoritative state.
 */
export const BILLING_PACKAGE = "@zerocorp/billing" as const;
export * from "./stripe";
