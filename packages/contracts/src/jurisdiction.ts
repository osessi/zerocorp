import { z } from "zod";
import { costMoneySchema } from "./money";
import { countryCodeSchema } from "./country";

export { countryCodeSchema, isCountryCode, ISO_3166_1_ALPHA_2 } from "./country";
export type { CountryCode } from "./country";

/**
 * Jurisdictions and entity types — the ZeroCorp catalog.
 *
 * D14: ZeroCorp owns the formation abstraction. This file is the vocabulary that
 * makes that true, and it draws one line very deliberately:
 *
 *   DATA IS OPEN        entity type codes, jurisdictions, fees and timelines are
 *                       rows in a table. Adding Singapore is a seed, not a deploy.
 *   BEHAVIOUR IS CLOSED  the things product logic BRANCHES on — automation level,
 *                       liability model, registration kind — are enums here, because
 *                       a screen that renders "operator_assisted" differently from
 *                       "automated" must never be handed a fourth value it has never
 *                       seen.
 *
 * That split is what "supporting a new jurisdiction must be additive" actually means
 * in code. A country adds rows. Only a genuinely new KIND of thing adds an enum value.
 */

/* ── Jurisdiction ─────────────────────────────────────────────────────────── */


/**
 * The subdivision part of ISO 3166-2, without the country prefix: "WY", "DE", "CA".
 * Null for a country that forms companies nationally, which is most of the world —
 * the US is the unusual one, and the model must not be shaped around it.
 */
export const subdivisionCodeSchema = z.string().regex(/^[A-Z0-9]{1,3}$/);

export const jurisdictionSchema = z.object({
  code: z.string().regex(/^[a-z]{2}(-[a-z0-9]{1,3})?$/, "e.g. us-wy, us-de, gb"),
  countryCode: countryCodeSchema,
  subdivisionCode: subdivisionCodeSchema.nullable(),
  name: z.string().min(1).max(120),
  /** Whether ZeroCorp offers it at all. Not whether a provider covers it. */
  status: z.enum(["available", "coming_soon", "unavailable"]),
});
export type Jurisdiction = z.infer<typeof jurisdictionSchema>;

/* ── Automation level — the honesty field ─────────────────────────────────── */

/**
 * How a formation in this entity type is actually executed today.
 *
 * There is **no default**. A catalog row must state it, because the failure mode is
 * selling automation that does not exist. D17 is exactly this: UK Ltd and LLP ship in
 * V1 as `operator_assisted`, because Companies House has no incorporation API and the
 * ACSP route runs through a partner.
 *
 * The UI renders this. A customer is never told a filing is automatic when a human
 * does it.
 */
export const AUTOMATION_LEVELS = ["automated", "operator_assisted", "unavailable"] as const;
export const automationLevelSchema = z.enum(AUTOMATION_LEVELS);
export type AutomationLevel = z.infer<typeof automationLevelSchema>;

/* ── Entity type ──────────────────────────────────────────────────────────── */

/**
 * Open by design: a lowercase country prefix and a local name. `us_llc`, `gb_ltd`.
 * A new country invents new codes without touching this file.
 */
export const entityTypeCodeSchema = z
  .string()
  .regex(/^[a-z]{2}_[a-z0-9_]{2,24}$/, "e.g. us_llc, gb_ltd");
export type EntityTypeCode = z.infer<typeof entityTypeCodeSchema>;

/** Closed: the product reasons about these. Pass-through and separate are not the same risk. */
export const LIABILITY_MODELS = ["limited", "limited_partnership", "unlimited"] as const;
export const liabilityModelSchema = z.enum(LIABILITY_MODELS);
export type LiabilityModel = z.infer<typeof liabilityModelSchema>;

/** Closed: it drives what the founder must be told, and what filings follow. */
export const TAX_TREATMENTS = ["pass_through", "corporate", "partnership", "elective"] as const;
export const taxTreatmentSchema = z.enum(TAX_TREATMENTS);
export type TaxTreatment = z.infer<typeof taxTreatmentSchema>;

/**
 * Post-incorporation registrations, generalised.
 *
 * `tax_id` is an EIN in the US and a UTR in the UK: one concept, two authorities,
 * two clocks. Modelling it as a kind rather than as four `ein_*` columns is what stops
 * the next country from being a migration.
 */
export const REGISTRATION_KINDS = ["tax_id", "vat", "payroll", "state_registration"] as const;
export const registrationKindSchema = z.enum(REGISTRATION_KINDS);
export type RegistrationKind = z.infer<typeof registrationKindSchema>;

export const requiredRegistrationSchema = z.object({
  kind: registrationKindSchema,
  /** "IRS", "HMRC", "Companies House". Free text: it is a label, not a branch. */
  authority: z.string().min(1).max(80),
  required: z.boolean(),
  typicalDaysMin: z.number().int().nonnegative(),
  typicalDaysMax: z.number().int().nonnegative(),
});
export type RequiredRegistration = z.infer<typeof requiredRegistrationSchema>;

export const entityTypeSchema = z.object({
  code: entityTypeCodeSchema,
  jurisdictionCode: z.string().min(1),
  /** The legal name. "Limited Liability Company". */
  name: z.string().min(1).max(120),
  /** What a founder is shown. Never an acronym on its own. */
  customerLabel: z.string().min(1).max(80),
  liabilityModel: liabilityModelSchema,
  taxTreatment: taxTreatmentSchema,
  automationLevel: automationLevelSchema,
  /**
   * In the authority's own currency. D15: cost money, never customer money.
   *
   * Null means the fee has not been verified against the authority, which is a
   * different statement from zero. Quoting must fail loudly on a null rather than
   * treat an unchecked entity as free.
   */
  governmentFee: costMoneySchema.nullable(),
  typicalDaysMin: z.number().int().nonnegative(),
  typicalDaysMax: z.number().int().nonnegative(),
  requiredRegistrations: z.array(requiredRegistrationSchema),
  /**
   * Shown to the founder as context, never as advice. The product must not present
   * an AI or a catalog row as legal counsel.
   */
  notes: z.array(z.string().max(300)).max(8),
});
export type EntityType = z.infer<typeof entityTypeSchema>;

/* ── The founder, as the catalog needs to see them ────────────────────────── */

/**
 * The inputs eligibility and routing actually depend on. Deliberately small: every
 * field here is a question someone has to answer before they can be told anything.
 */
export const founderProfileSchema = z.object({
  /** Where they live. Drives non-resident rules and identity verification. */
  residencyCountry: countryCodeSchema,
  /** Citizenship, which is a different question and occasionally the deciding one. */
  nationalityCountry: countryCodeSchema.optional(),
  /** Where the business will operate and sell. Drives the jurisdiction recommendation. */
  targetMarkets: z.array(countryCodeSchema).min(1).max(12),
  hasUsTaxId: z.boolean().default(false),
  ownerCount: z.number().int().min(1).max(50).default(1),
  wantsExternalInvestment: z.boolean().default(false),
});
export type FounderProfile = z.infer<typeof founderProfileSchema>;
