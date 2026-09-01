import { z } from "zod";
import { ASSESSMENT_QUESTION_IDS, companySituationSchema } from "./assessment";
import { countryCodeSchema } from "./country";

/**
 * The adaptive interview — D18.
 *
 * The interviewer does NOT replace the Business Architect. It fills the same five slots
 * `assessmentAnswersSchema` already requires, one question at a time, choosing each
 * question from what it already understands.
 *
 * That framing is what keeps ADR 0002 intact and what makes this testable: the job is
 * not "have a good conversation", it is "fill five slots in as few turns as possible",
 * and both halves of that are measurable.
 */

/* ── Slots ────────────────────────────────────────────────────────────────── */

/** The five required slots are exactly the assessment's five answers. */
export const SLOT_IDS = ASSESSMENT_QUESTION_IDS;
export type SlotId = (typeof SLOT_IDS)[number];

/**
 * What a slot holds, and how we came to hold it.
 *
 * `confidence` exists because "they told us" and "we inferred it from a sentence" are
 * different facts. An inferred slot is confirmed with one click rather than re-asked,
 * which is the difference between an interview and an interrogation.
 */
export const slotStateSchema = z.object({
  filled: z.boolean(),
  source: z.enum(["stated", "inferred", "confirmed"]).nullable(),
});
export type SlotState = z.infer<typeof slotStateSchema>;

/** Human labels for the "Understanding you" checklist. i18n keys, not sentences. */
export const SLOT_LABEL_KEYS: Record<SlotId, string> = {
  business_description: "interview.slot.business",
  current_situation: "interview.slot.situation",
  company_situation: "interview.slot.company",
  twelve_month_goal: "interview.slot.goal",
  target_markets: "interview.slot.markets",
};

/* ── Question cards ───────────────────────────────────────────────────────── */

const line = z.string().trim().min(1).max(160);
const helpLine = z.string().trim().min(1).max(220);

export const questionOptionSchema = z.object({
  /** Stable, so an answer can be recorded without storing the label. */
  value: z.string().regex(/^[a-z0-9_]{1,48}$/),
  label: line,
  /** One clarifying line under the label. Optional and usually absent. */
  hint: z.string().trim().max(120).optional(),
});
export type QuestionOption = z.infer<typeof questionOptionSchema>;

/**
 * What the interviewer returns. A closed union, validated by Zod, never free text.
 *
 * The UI renders exactly four shapes. A fifth would be a design decision, so the model
 * cannot invent one: an unknown `kind` fails to parse and the turn is rejected.
 */
export const questionCardSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("single_choice"),
    slot: z.enum(SLOT_IDS).nullable(),
    question: line,
    help: helpLine.optional(),
    options: z.array(questionOptionSchema).min(2).max(8),
    /** Whether "something else" opens the free-text dock. Almost always true. */
    allowsOther: z.boolean().default(true),
  }),
  z.object({
    kind: z.literal("multi_choice"),
    slot: z.enum(SLOT_IDS).nullable(),
    question: line,
    help: helpLine.optional(),
    options: z.array(questionOptionSchema).min(2).max(10),
    min: z.number().int().min(0).max(10).default(1),
    max: z.number().int().min(1).max(10).default(10),
  }),
  z.object({
    kind: z.literal("free_text"),
    slot: z.enum(SLOT_IDS).nullable(),
    question: line,
    help: helpLine.optional(),
    placeholder: line.optional(),
    /**
     * Likely answers, offered as chips. The visitor can always write their own —
     * a suggestion that cannot be refused is a closed choice wearing a disguise.
     */
    suggestions: z.array(line).max(6).default([]),
  }),
  z.object({
    kind: z.literal("confirm"),
    slot: z.enum(SLOT_IDS),
    question: line,
    /** What we believe, in their words where possible. They confirm or correct it. */
    statement: helpLine,
  }),
]);
export type QuestionCard = z.infer<typeof questionCardSchema>;

export const QUESTION_KINDS = ["single_choice", "multi_choice", "free_text", "confirm"] as const;

/* ── What the interviewer is given, and what it returns ───────────────────── */

/**
 * The interviewer's input. Closed, exactly like the architect's — ADR 0002 §2.
 *
 * It sees the slots, the transcript of the interview so far, and the turn budget. It
 * does NOT see the catalog, the pricing, the tenant or anything else: choosing the next
 * question needs none of it, and every field withheld is a field that cannot leak.
 */
export const interviewTurnSchema = z.object({
  question: questionCardSchema,
  /** What the visitor said or chose, as plain text. */
  answer: z.string().max(4_000),
});
export type InterviewTurn = z.infer<typeof interviewTurnSchema>;

export const interviewInputSchema = z.object({
  slots: z.record(z.enum(SLOT_IDS), slotStateSchema),
  transcript: z.array(interviewTurnSchema).max(16),
  /** How many questions may still be asked. Zero means: conclude with what you have. */
  turnsRemaining: z.number().int().min(0).max(16),
  locale: z.string().min(2).max(10).default("en"),
});
export type InterviewInput = z.infer<typeof interviewInputSchema>;

/**
 * The interviewer's output.
 *
 * `extracted` is the point of the whole design: one sentence can fill three slots, and
 * the interviewer reporting that is what lets it skip three questions. It is validated
 * against the SAME schemas the assessment uses, so nothing enters a slot that the
 * assessment would have refused.
 */
export const extractedSlotsSchema = z.object({
  business_description: z.string().trim().max(2_000).optional(),
  current_situation: z.string().trim().max(2_000).optional(),
  company_situation: companySituationSchema.optional(),
  twelve_month_goal: z.string().trim().max(2_000).optional(),
  target_markets: z.array(countryCodeSchema).max(12).optional(),
});
export type ExtractedSlots = z.infer<typeof extractedSlotsSchema>;

/** Extras the interview picks up. The architect may use them; it never depends on them. */
export const enrichmentSchema = z.object({
  businessType: z.enum(["agency", "saas", "ecommerce", "consulting", "creator", "other"]).optional(),
  wants: z.array(z.enum(["company", "website", "customers", "automation", "other"])).max(5).optional(),
  stage: z.enum(["idea", "first_clients", "growing", "changing_direction"]).optional(),
});
export type Enrichment = z.infer<typeof enrichmentSchema>;

export const interviewOutputSchema = z.object({
  /** What the last answer told us. Empty on the first call. */
  extracted: extractedSlotsSchema.default({}),
  enrichment: enrichmentSchema.default({}),
  /**
   * Null means: we have enough, stop asking. The interviewer decides this, and the
   * turn cap overrides it — nothing may ask a ninth question.
   */
  next: questionCardSchema.nullable(),
  /** One line shown while the next card animates in. Never a paragraph. */
  acknowledgement: line.optional(),
});
export type InterviewOutput = z.infer<typeof interviewOutputSchema>;

/** D18: eight questions, and the cap is a control rather than a preference. */
export const MAX_INTERVIEW_TURNS = 8;

/**
 * The first question is fixed and costs no model call — D18.
 *
 * The visitor commits before we spend, the page has no first-turn latency, and a
 * visitor who closes the tab has cost nothing. By turn two the interviewer has real
 * context, which is the first moment it can be adaptive at all.
 */
export const OPENING_QUESTION: QuestionCard = {
  kind: "free_text",
  slot: "business_description",
  question: "What are you building?",
  help: "A sentence or two. Say it the way you would to a friend.",
  placeholder: "I design brand identities for early-stage software companies.",
  suggestions: [],
};
