import { z } from "zod";
import { countryCodeSchema } from "./country";

/**
 * The Free Business Assessment — PRODUCT_SPEC.md §29.3 block 0.
 *
 * It exists BEFORE payment and therefore before a tenant. That is not an
 * oversight in the tenancy model, it is the point: a visitor who has paid nothing
 * owns nothing, and giving them a tenant would put unpaid prospects in the same
 * table as customers. See ARCHITECTURE.md §7 rule 6 on documented global tables.
 *
 * Enumerations live in code, not only in prose — CLAUDE_CODE_RULES.md rule 43b.
 */

/**
 * A FACT the visitor states, kept separate from the RECOMMENDATION ZeroCorp makes.
 *
 * Conflating the two is what made "form a new LLC" the default for everybody. A
 * visitor with no company has not thereby asked for one, and a visitor with a company
 * has not thereby ruled one out. The question captures the situation; the Business
 * Architect decides what follows, and one of its permitted conclusions is that no new
 * company is needed at all.
 */
export const COMPANY_SITUATIONS = ["none", "existing", "in_progress"] as const;
export const companySituationSchema = z.enum(COMPANY_SITUATIONS);
export type CompanySituation = z.infer<typeof companySituationSchema>;

/**
 * What the Business Architect concludes. Not what the visitor said.
 *
 * `none_needed` exists because it has to be sayable. An architect that can only
 * recommend forming or importing a company will always recommend one of the two,
 * and "you do not need a company for this yet" is often the honest answer.
 */
export const COMPANY_RECOMMENDATIONS = ["form_new", "use_existing", "none_needed"] as const;
export const companyRecommendationSchema = z.enum(COMPANY_RECOMMENDATIONS);
export type CompanyRecommendation = z.infer<typeof companyRecommendationSchema>;

/**
 * @deprecated Use CompanySituation for what the visitor said, or CompanyRecommendation
 * for what ZeroCorp concluded. Kept so nothing that imported it breaks.
 */
export const BUSINESS_KINDS = ["new", "existing"] as const;
export const businessKindSchema = z.enum(BUSINESS_KINDS);
export type BusinessKind = z.infer<typeof businessKindSchema>;

/** Which setup a recommendation implies. `none_needed` still has a path: activation. */
export function setupPathFor(recommendation: CompanyRecommendation): "launch" | "activation" {
  return recommendation === "form_new" ? "launch" : "activation";
}

export const ASSESSMENT_STATUSES = [
  "draft",
  "analyzing",
  "analyzed",
  "failed",
  "approved",
  "converted",
  "abandoned",
] as const;
export const assessmentStatusSchema = z.enum(ASSESSMENT_STATUSES);
export type AssessmentStatus = z.infer<typeof assessmentStatusSchema>;

/**
 * Allowed transitions, not just a union of names.
 *
 * `failed` is reparable rather than terminal, for the same reason `rejected` is
 * in the formation machine: a model call that times out is ordinary, and a
 * visitor who answered five questions should not have to answer them again.
 *
 * `approved` returns to `analyzed` because changing your mind before paying is
 * not an error state. Only `converted` and `abandoned` are terminal.
 */
export const ASSESSMENT_TRANSITIONS = {
  draft: ["analyzing", "abandoned"],
  analyzing: ["analyzed", "failed"],
  failed: ["analyzing", "abandoned"],
  analyzed: ["analyzing", "approved", "abandoned"],
  approved: ["analyzed", "converted", "abandoned"],
  converted: [],
  abandoned: [],
} as const satisfies Record<AssessmentStatus, readonly AssessmentStatus[]>;

export const ASSESSMENT_TERMINAL_STATUSES = ["converted", "abandoned"] as const;

export function canTransitionAssessment(from: AssessmentStatus, to: AssessmentStatus): boolean {
  return (ASSESSMENT_TRANSITIONS[from] as readonly AssessmentStatus[]).includes(to);
}

/* ── The questions ─────────────────────────────────────────────────────────────
 *
 * Three to five, and no more. PRODUCT_SPEC.md §29.3: "no expensive free
 * onboarding". Every question added here is a question asked before any money
 * has changed hands, so each one has to earn its place.
 */

export const ASSESSMENT_QUESTION_IDS = [
  "business_description",   // what do you do?
  "current_situation",      // where are you today?
  "company_situation",      // do you already have a company?
  "twelve_month_goal",      // where do you want to go?
  "target_markets",         // where do you want to operate and sell?
] as const;
export type AssessmentQuestionId = (typeof ASSESSMENT_QUESTION_IDS)[number];

/** Free-text answers are capped so a paste bomb cannot become a prompt bomb. */
const answerText = z.string().trim().min(1).max(2_000);

/**
 * `target_markets` replaced `biggest_obstacle` on 2026-09-01 with D14.
 *
 * The cap is five questions and it is a hard cap, so adding one meant removing one.
 * Where a founder wants to operate and sell is the input jurisdiction routing cannot
 * work without; the biggest obstacle is interesting and derivable from the other four.
 * A question that is merely interesting does not survive a hard cap.
 */
export const assessmentAnswersSchema = z.object({
  business_description: answerText,
  current_situation: answerText,
  company_situation: companySituationSchema,
  twelve_month_goal: answerText,
  /** ISO 3166-1 alpha-2, validated against the real list. At least one: "everywhere" is not a market. */
  target_markets: z.array(countryCodeSchema).min(1).max(12),
});
export type AssessmentAnswers = z.infer<typeof assessmentAnswersSchema>;

/** Partial answers, for a visitor mid-flow. The full schema gates the analysis. */
export const partialAssessmentAnswersSchema = assessmentAnswersSchema.partial();
export type PartialAssessmentAnswers = z.infer<typeof partialAssessmentAnswersSchema>;

/**
 * Voice is optional and transcribed to text before anything else reads it.
 * The transcript is the answer; the audio is a document with a retention policy.
 */
export const voiceCaptureSchema = z.object({
  questionId: z.enum(ASSESSMENT_QUESTION_IDS),
  storageKey: z.string().min(1),
  durationMs: z.number().int().positive().max(5 * 60 * 1_000),
  transcript: z.string().max(8_000).optional(),
});
export type VoiceCapture = z.infer<typeof voiceCaptureSchema>;
