import { z } from "zod";
import { assessmentAnswersSchema, ASSESSMENT_QUESTION_IDS } from "./assessment";
import { architectOutputSchema, planConstraintSchema, planMessageSchema } from "./plan";
import { automationLevelSchema, entityTypeCodeSchema } from "./jurisdiction";

/**
 * The Business Architect's input — ADR 0002.
 *
 * A CLOSED type. The architect is not given a repository, a tenant context, a database
 * handle or a tool: it is a pure function from this object to a validated result. That
 * is what makes "could the model see a passport number" answerable by reading a type
 * rather than by auditing a prompt.
 *
 * What is deliberately absent, and must stay absent:
 *
 *   identity documents, or any field extracted from one
 *   passport, national id, tax id, date of birth
 *   payment details, Stripe ids, card data
 *   email, phone, postal address
 *   other tenants' data, raw database rows
 *
 * Contact details are excluded even though we hold them. The analysis does not get
 * better because the model knows the visitor's name, and every field added to a prompt
 * is a field that can end up in a provider's logs.
 */

/** The catalog, flattened to what a recommendation actually needs. */
export const architectEntityOptionSchema = z.object({
  entityTypeCode: entityTypeCodeSchema,
  jurisdictionCode: z.string().min(1),
  customerLabel: z.string().min(1),
  /** The model reports this; it never decides it. The catalog is the source. */
  automationLevel: automationLevelSchema,
  typicalDaysMin: z.number().int().nonnegative(),
  typicalDaysMax: z.number().int().nonnegative(),
  /** Whether THIS founder may choose it, already decided by the eligibility policy. */
  eligible: z.boolean(),
  notes: z.array(z.string().max(300)).max(8),
});
export type ArchitectEntityOption = z.infer<typeof architectEntityOptionSchema>;

export const architectInputSchema = z.object({
  answers: assessmentAnswersSchema,
  /** Per question, when the visitor spoke instead of typing. */
  transcripts: z.record(z.enum(ASSESSMENT_QUESTION_IDS), z.string().max(8_000)).default({}),
  catalog: z.array(architectEntityOptionSchema).max(50),
  constraints: z.array(planConstraintSchema).max(20).default([]),
  /** Prior turns, so a regeneration is grounded in what was already asked for. */
  conversation: z.array(planMessageSchema).max(40).default([]),
  locale: z.string().min(2).max(10).default("en"),
});
export type ArchitectInput = z.infer<typeof architectInputSchema>;

/**
 * Field names that must never appear anywhere in a serialised architect input.
 *
 * Asserted by a test that walks the whole object graph. A closed type stops a field
 * being ADDED; this stops one being smuggled inside a free-text value or a nested
 * record that the type does not look into.
 */
export const FORBIDDEN_INPUT_KEYS = [
  "passport", "passportNumber", "nationalId", "ssn", "taxId", "ein", "utr",
  "dateOfBirth", "dob", "email", "phone", "address", "postalCode",
  "stripeCustomerId", "stripeSubscriptionId", "cardNumber", "iban",
  "tenantId", "userId", "storageKey", "identifier",
] as const;

/* ── The run ──────────────────────────────────────────────────────────────── */

export const architectUsageSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  /** Our cost, in USD minor units. Recorded per run, so margin is measurable. */
  costMinor: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
});
export type ArchitectUsage = z.infer<typeof architectUsageSchema>;

export const architectRunSchema = z.object({
  output: architectOutputSchema,
  usage: architectUsageSchema,
  /** How many model calls it took. More than one means the first output was invalid. */
  attempts: z.number().int().min(1),
  /** True when the deterministic fallback produced this. The UI must say so. */
  deterministic: z.boolean(),
});
export type ArchitectRun = z.infer<typeof architectRunSchema>;

/** Why a run failed, in terms the funnel can act on. */
export const ARCHITECT_FAILURE_REASONS = [
  "provider_unavailable",
  "invalid_output",
  "business_validation_failed",
  "timeout",
] as const;
export type ArchitectFailureReason = (typeof ARCHITECT_FAILURE_REASONS)[number];
