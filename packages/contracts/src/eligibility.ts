import { z } from "zod";
import { countryCodeSchema, entityTypeCodeSchema, registrationKindSchema } from "./jurisdiction";

/**
 * Eligibility.
 *
 * The predicate language is CLOSED — a discriminated union, not free-form JSON.
 *
 * "predicate_json" is the obvious design and it is a trap: an eligibility rule that
 * can express anything can also express something the evaluator does not implement,
 * and the failure is silent. A closed union means every rule that parses is a rule
 * that runs, and adding a predicate kind forces the evaluator to handle it or fail to
 * compile.
 *
 * These rules encode PRODUCT eligibility, not legal advice. `CLAUDE_CODE_RULES.md`
 * and §19 of the new direction both hold: ZeroCorp must never present a rule or a
 * model output as counsel from a lawyer.
 */

export const eligibilityPredicateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("residency_in"), countries: z.array(countryCodeSchema).min(1) }),
  z.object({ kind: z.literal("residency_not_in"), countries: z.array(countryCodeSchema).min(1) }),
  z.object({ kind: z.literal("nationality_not_in"), countries: z.array(countryCodeSchema).min(1) }),
  z.object({ kind: z.literal("owner_count_min"), value: z.number().int().min(1) }),
  z.object({ kind: z.literal("owner_count_max"), value: z.number().int().min(1) }),
  z.object({ kind: z.literal("requires_us_tax_id") }),
  z.object({ kind: z.literal("target_market_includes"), countries: z.array(countryCodeSchema).min(1) }),
  z.object({ kind: z.literal("wants_external_investment") }),
]);
export type EligibilityPredicate = z.infer<typeof eligibilityPredicateSchema>;

/**
 * What a matching rule does.
 *
 *   deny     the entity is not available to this founder. Blocking.
 *   warn     available, but the founder must see something first.
 *   require  available, and something extra becomes mandatory — an ITIN, a
 *            registered agent, an identity verification step.
 */
export const ELIGIBILITY_EFFECTS = ["deny", "warn", "require"] as const;
export const eligibilityEffectSchema = z.enum(ELIGIBILITY_EFFECTS);
export type EligibilityEffect = z.infer<typeof eligibilityEffectSchema>;

export const eligibilityRuleSchema = z.object({
  code: z.string().regex(/^[a-z0-9_]{3,64}$/),
  entityTypeCode: entityTypeCodeSchema,
  predicate: eligibilityPredicateSchema,
  effect: eligibilityEffectSchema,
  /** An i18n key. Never a rendered sentence — every user-facing string goes through i18n. */
  messageKey: z.string().min(1).max(120),
  /** For effect = "require": what becomes mandatory. */
  requires: z
    .object({
      registration: registrationKindSchema.optional(),
      document: z.string().max(64).optional(),
      identityVerification: z.boolean().optional(),
    })
    .optional(),
});
export type EligibilityRule = z.infer<typeof eligibilityRuleSchema>;

export const eligibilityFindingSchema = z.object({
  ruleCode: z.string(),
  effect: eligibilityEffectSchema,
  messageKey: z.string(),
  requires: eligibilityRuleSchema.shape.requires,
});
export type EligibilityFinding = z.infer<typeof eligibilityFindingSchema>;

/**
 * The verdict for one entity type and one founder.
 *
 * `eligible` is derived, never stored as an independent fact: it is true exactly when
 * no `deny` fired. Storing it separately is how a rule change silently leaves stale
 * verdicts behind.
 */
export const eligibilityResultSchema = z.object({
  entityTypeCode: entityTypeCodeSchema,
  eligible: z.boolean(),
  findings: z.array(eligibilityFindingSchema),
});
export type EligibilityResult = z.infer<typeof eligibilityResultSchema>;
