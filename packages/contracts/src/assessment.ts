import { z } from "zod";

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

/** The question that decides the whole path — PRODUCT_SPEC.md §29.3 block 1. */
export const BUSINESS_KINDS = ["new", "existing"] as const;
export const businessKindSchema = z.enum(BUSINESS_KINDS);
export type BusinessKind = z.infer<typeof businessKindSchema>;

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
  "business_kind",
  "business_description",
  "current_situation",
  "twelve_month_goal",
  "biggest_obstacle",
] as const;
export type AssessmentQuestionId = (typeof ASSESSMENT_QUESTION_IDS)[number];

/** Free-text answers are capped so a paste bomb cannot become a prompt bomb. */
const answerText = z.string().trim().min(1).max(2_000);

export const assessmentAnswersSchema = z.object({
  business_kind: businessKindSchema,
  business_description: answerText,
  current_situation: answerText,
  twelve_month_goal: answerText,
  biggest_obstacle: answerText.optional(),
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
