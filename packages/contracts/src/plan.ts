import { z } from "zod";
import { companyRecommendationSchema } from "./assessment";
import { entityTypeCodeSchema } from "./jurisdiction";

/**
 * The Business Architect's output — PRODUCT_SPEC.md §29.3 block 3, "the heart of V1".
 *
 * This schema is the contract the model has to satisfy, and it is deliberately
 * tight. Every string has a maximum length and every array has a maximum size,
 * because an unbounded model response is an unbounded database row, an unbounded
 * render and an unbounded bill. Validation failure is a rejected generation, not
 * a degraded one — ARCHITECTURE.md §12, "invalid outputs must be rejected or
 * quarantined".
 */

/* ── Analysis ─────────────────────────────────────────────────────────────────
 *
 * Three panels, exactly as the funnel promises the visitor:
 * where you are · where you want to go · what is missing.
 */

const paragraph = z.string().trim().min(1).max(900);
const line = z.string().trim().min(1).max(160);

export const analysisGapSchema = z.object({
  title: line,
  /** Why this gap matters to THIS business. A generic reason is a failed generation. */
  why: paragraph,
  severity: z.enum(["blocking", "important", "nice_to_have"]),
});
export type AnalysisGap = z.infer<typeof analysisGapSchema>;

export const businessAnalysisSchema = z.object({
  /** One line the visitor should recognise as their own business. */
  headline: line,
  whereYouAre: paragraph,
  whereYouWantToGo: paragraph,
  whatIsMissing: z.array(analysisGapSchema).min(2).max(6),
});
export type BusinessAnalysis = z.infer<typeof businessAnalysisSchema>;

/* ── Plan ─────────────────────────────────────────────────────────────────── */

/**
 * The five stages of the single V1 journey — PRODUCT_SPEC.md §29.3.
 * "Anyone reading them as a feature list will build twelve disconnected tools."
 */
export const PLAN_PHASES = ["understand", "plan", "build", "launch", "find_customers"] as const;
export const planPhaseSchema = z.enum(PLAN_PHASES);
export type PlanPhase = z.infer<typeof planPhaseSchema>;

/** The V1 delivery blocks a step can belong to. Not free text: a step ZeroCorp cannot execute is not a step. */
export const PLAN_CATEGORIES = [
  "company",
  "brand",
  "website",
  "domain",
  "email",
  "content",
  "seo",
  "leads",
  "operations",
] as const;
export const planCategorySchema = z.enum(PLAN_CATEGORIES);
export type PlanCategory = z.infer<typeof planCategorySchema>;

export const planStepSchema = z.object({
  /** Stable across regenerations so the customer's edits survive a new proposal. */
  key: z.string().regex(/^[a-z0-9_]{3,48}$/, "lowercase snake_case, 3 to 48 characters"),
  title: line,
  /** What the customer gets. Not what ZeroCorp does. */
  outcome: line,
  rationale: paragraph,
  phase: planPhaseSchema,
  category: planCategorySchema,
  /** The customer can drop a step without deleting it, so a regeneration does not resurrect it. */
  included: z.boolean().default(true),
  priority: z.number().int().min(1).max(3),
});
export type PlanStep = z.infer<typeof planStepSchema>;

export const PLAN_STATUSES = ["proposed", "approved", "superseded"] as const;
export const planStatusSchema = z.enum(PLAN_STATUSES);
export type PlanStatus = z.infer<typeof planStatusSchema>;

export const SETUP_PATH_VALUES = ["launch", "activation"] as const;
export const SUBSCRIPTION_PLAN_VALUES = ["launch", "growth", "autopilot"] as const;

/* ── Constraints and decisions ────────────────────────────────────────────────
 *
 * "I don't want a Delaware company." "Focus on France." "I already have a website."
 * "Skip branding." "Ten articles a week."
 *
 * These are the sentences that make a plan theirs, and they must SURVIVE a
 * regeneration. A constraint that lives only in the chat transcript gets re-argued
 * every time the customer asks for another proposal, which is the fastest way to make
 * an AI planner feel like it is not listening.
 *
 * The union is closed for everything the planner can act on, and has one `free_text`
 * arm for everything else. That arm is deliberate honesty: it captures the sentence
 * and shows it back, without pretending the planner can honour it.
 */
export const planConstraintSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("exclude_jurisdiction"), jurisdictionCode: z.string().min(1) }),
  z.object({ kind: z.literal("prefer_jurisdiction"), jurisdictionCode: z.string().min(1) }),
  z.object({ kind: z.literal("skip_category"), category: planCategorySchema }),
  z.object({ kind: z.literal("already_have"), category: planCategorySchema, detail: line.optional() }),
  z.object({ kind: z.literal("publication_cadence"), articlesPerWeek: z.number().int().min(0).max(70) }),
  z.object({ kind: z.literal("free_text"), text: line }),
]);
export type PlanConstraint = z.infer<typeof planConstraintSchema>;

/** A choice the plan embodies, and the reason for it. */
export const planDecisionSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]{3,48}$/),
  question: line,
  chosen: line,
  rationale: paragraph,
  decidedBy: z.enum(["customer", "architect"]),
});
export type PlanDecision = z.infer<typeof planDecisionSchema>;

/**
 * What the model is asked to produce, and nothing else.
 *
 * Note what is NOT here: prices. The model recommends a plan and a path; the
 * price of that path comes from configuration (@zerocorp/config). A model that
 * can quote a price is a model that can quote the wrong price.
 */
export const planProposalFieldsSchema = z.object({
  title: line,
  summary: paragraph,
  /**
   * What ZeroCorp concluded about the company question. `none_needed` is a real,
   * permitted answer — recommending a new entity to everybody is forbidden as default
   * product logic (D14).
   */
  companyRecommendation: companyRecommendationSchema,
  /**
   * Only when companyRecommendation is `form_new`. Null otherwise, and a null here is
   * a stronger statement than an omitted field: it says the question was considered.
   */
  recommendedJurisdictionCode: z.string().min(1).nullable(),
  recommendedEntityTypeCode: entityTypeCodeSchema.nullable(),
  recommendedSetupPath: z.enum(SETUP_PATH_VALUES),
  recommendedSubscriptionPlan: z.enum(SUBSCRIPTION_PLAN_VALUES),
  /** Why this plan and not a cheaper one. The customer is about to be shown a price. */
  recommendationReason: paragraph,
  steps: z.array(planStepSchema).min(4).max(14),
  /** What the customer has ruled in or out. Survives regeneration — see below. */
  constraints: z.array(planConstraintSchema).max(20).default([]),
  /** What was decided and why, so an approved plan can be read back months later. */
  decisions: z.array(planDecisionSchema).max(20).default([]),
});

/**
 * The refined schema. `planProposalFieldsSchema` stays exported because `.refine()`
 * returns a ZodEffects, which has no `.shape` — and the field list is something the
 * repository asserts on.
 */
export const planProposalSchema = planProposalFieldsSchema
  .refine(
    (p) => p.companyRecommendation === "form_new"
      ? p.recommendedEntityTypeCode !== null && p.recommendedJurisdictionCode !== null
      : p.recommendedEntityTypeCode === null && p.recommendedJurisdictionCode === null,
    {
      // "Form a new company" with no entity named is not a recommendation, it is a
      // gesture. And naming an entity while recommending against forming one is the
      // upsell this rule exists to make impossible.
      message: "form_new requires an entity type and a jurisdiction; every other recommendation forbids both",
      path: ["recommendedEntityTypeCode"],
    },
  );
export type PlanProposal = z.infer<typeof planProposalSchema>;

/** The whole artefact one Business Architect run produces. */
export const architectOutputSchema = z.object({
  analysis: businessAnalysisSchema,
  plan: planProposalSchema,
});
export type ArchitectOutput = z.infer<typeof architectOutputSchema>;

/* ── Conversation ─────────────────────────────────────────────────────────────
 *
 * "discuter avec l'IA" is a conversation about a plan, not an open chat. Every
 * turn is stored so a regeneration can be grounded in what the customer already
 * asked for, and so the approved plan has an auditable provenance.
 */

export const PLAN_MESSAGE_ROLES = ["customer", "architect"] as const;
export const planMessageRoleSchema = z.enum(PLAN_MESSAGE_ROLES);
export type PlanMessageRole = z.infer<typeof planMessageRoleSchema>;

export const planMessageSchema = z.object({
  role: planMessageRoleSchema,
  content: z.string().trim().min(1).max(4_000),
});
export type PlanMessage = z.infer<typeof planMessageSchema>;

/** The edits a customer may make directly, without asking the model. */
export const planEditSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("include_step"), key: z.string() }),
  z.object({ kind: z.literal("exclude_step"), key: z.string() }),
  z.object({ kind: z.literal("set_priority"), key: z.string(), priority: z.number().int().min(1).max(3) }),
  z.object({ kind: z.literal("rename_step"), key: z.string(), title: line }),
]);
export type PlanEdit = z.infer<typeof planEditSchema>;
