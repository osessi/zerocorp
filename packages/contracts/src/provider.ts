import { z } from "zod";
import { automationLevelSchema, entityTypeCodeSchema } from "./jurisdiction";
import { costMoneySchema } from "./money";

/**
 * The provider abstraction — D14.
 *
 * A provider is an execution adapter. The customer never sees its name, its status
 * strings or its errors. The port lives in @zerocorp/application; this file is the
 * vocabulary that crosses the boundary.
 */

export const providerCodeSchema = z.string().regex(/^[a-z0-9_]{2,32}$/);
export type ProviderCode = z.infer<typeof providerCodeSchema>;

export const PROVIDER_STATUSES = ["active", "degraded", "disabled"] as const;
export const providerStatusSchema = z.enum(PROVIDER_STATUSES);
export type ProviderStatus = z.infer<typeof providerStatusSchema>;

/**
 * What a provider can do MECHANICALLY. Each flag is a thing our code either can or
 * cannot rely on, so each one changes how the order is driven: no webhooks means we
 * poll, no RFI support means an information request has to reach an operator.
 */
export const providerFeaturesSchema = z.object({
  webhooks: z.boolean(),
  sandbox: z.boolean(),
  statusPolling: z.boolean(),
  documentRetrieval: z.boolean(),
  rfi: z.boolean(),
  cancellation: z.boolean(),
  registeredAgent: z.boolean(),
  taxIdFiling: z.boolean(),
  identityVerification: z.boolean(),
});
export type ProviderFeatures = z.infer<typeof providerFeaturesSchema>;

/**
 * What a provider covers for ONE entity type.
 *
 * `verified` is the fourth architecture rule made into a field: a capability is not
 * real until it has been confirmed technically AND contractually. It defaults to
 * false and the router refuses to select an unverified coverage in production.
 *
 * A public marketing page claiming an API is not verification. `verifiedAt` and
 * `verificationNote` say who checked and what they saw.
 */
export const providerCoverageSchema = z.object({
  entityTypeCode: entityTypeCodeSchema,
  automationLevel: automationLevelSchema,
  supportsNonResident: z.boolean(),
  wholesaleFee: costMoneySchema.nullable(),
  typicalDaysMin: z.number().int().nonnegative(),
  typicalDaysMax: z.number().int().nonnegative(),
  verified: z.boolean().default(false),
  verifiedAt: z.date().nullable().default(null),
  verificationNote: z.string().max(500).nullable().default(null),
});
export type ProviderCoverage = z.infer<typeof providerCoverageSchema>;

export const providerCapabilitiesSchema = z.object({
  code: providerCodeSchema,
  name: z.string().min(1).max(80),
  status: providerStatusSchema,
  features: providerFeaturesSchema,
  coverage: z.array(providerCoverageSchema),
  /** 0 to 1. Observed, not claimed: updated from real order outcomes. */
  reliabilityScore: z.number().min(0).max(1).default(0.5),
});
export type ProviderCapabilities = z.infer<typeof providerCapabilitiesSchema>;

/* ── Routing ──────────────────────────────────────────────────────────────── */

/**
 * Why a provider was or was not chosen.
 *
 * Stored with the formation request. "Why did we route to provider B" has to be
 * answerable from the record months later, when the provider's behaviour has changed
 * and the code no longer reproduces the decision.
 */
export const routingCandidateSchema = z.object({
  providerCode: providerCodeSchema,
  score: z.number(),
  reasons: z.array(z.string().max(160)).max(12),
  excludedBecause: z.string().max(160).nullable().default(null),
});
export type RoutingCandidate = z.infer<typeof routingCandidateSchema>;

export const routingDecisionSchema = z.object({
  entityTypeCode: entityTypeCodeSchema,
  candidates: z.array(routingCandidateSchema),
  selected: providerCodeSchema.nullable(),
  /** In order. Used when the selected provider fails and a retry is legal. */
  fallbacks: z.array(providerCodeSchema),
  decidedAt: z.date(),
  /** The weights in force when this decision was made, so it can be replayed. */
  policyVersion: z.string().min(1),
});
export type RoutingDecision = z.infer<typeof routingDecisionSchema>;

/**
 * A provider's own status, before translation.
 *
 * This type exists so the adapter has somewhere to put the raw value, and so a
 * reviewer can see exactly where the translation happens. `raw` NEVER crosses into
 * the customer-facing model — a test asserts no provider string reaches a customer
 * surface.
 */
export const providerOrderStatusSchema = z.object({
  raw: z.string().max(120),
  observedAt: z.date(),
});
export type ProviderOrderStatus = z.infer<typeof providerOrderStatusSchema>;
