import { z } from "zod";

/**
 * Launch your business — the deep onboarding.
 *
 * The pre-payment assessment establishes WHETHER to build and WHAT to build. This
 * establishes HOW it should sound, who it is for, and what makes it worth choosing. It
 * runs once, after payment, and it is the input every generator reads: the brand, the
 * website copy, the articles, the outreach. A thin answer here produces a thin business.
 *
 * Eight steps, because eight is what the Business Brain actually needs (§DATABASE
 * `business_profiles`) — not a number picked for the progress bar. Each step writes one
 * column, so a founder who abandons after four has four real answers rather than a
 * half-parsed blob.
 */
export const ONBOARDING_STEPS = [
  "business_name",
  "description",
  "industry",
  "icp_description",
  "positioning",
  "unique_selling_points",
  "target_keywords",
  "tone_of_voice",
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number];

/** The steps whose answer is a list rather than a sentence. */
export const LIST_STEPS = ["unique_selling_points", "target_keywords"] as const satisfies readonly OnboardingStepKey[];

export function isListStep(key: OnboardingStepKey): boolean {
  return (LIST_STEPS as readonly string[]).includes(key);
}

/**
 * The reveal groups.
 *
 * The last screen is the one that has to earn the price: it shows the founder that
 * something listened. Four headings, because four is what a person can take in at a
 * glance, and because these are the four things they would want to check.
 */
export const REVEAL_GROUPS = {
  business: ["business_name", "description", "industry"],
  clients: ["icp_description"],
  markets: ["target_keywords"],
  voice: ["tone_of_voice", "positioning", "unique_selling_points"],
} as const satisfies Record<string, readonly OnboardingStepKey[]>;

export type RevealGroup = keyof typeof REVEAL_GROUPS;

/**
 * One answer, on its way in.
 *
 * Validated at the boundary rather than trusted: this is a public form on an
 * authenticated route, and "the user typed it" is not a schema.
 */
export const onboardingAnswerSchema = z.object({
  step: z.enum(ONBOARDING_STEPS),
  /** Free text for a sentence step; one entry per line for a list step. */
  text: z.string().trim().min(1, "An answer cannot be empty").max(2000),
  /** What the microphone heard, when it was used. Kept for provenance, never rendered. */
  transcript: z.string().max(8000).optional(),
});

export type OnboardingAnswer = z.infer<typeof onboardingAnswerSchema>;

/** What the screen needs to render: the answers so far and where the founder is. */
export const onboardingStateSchema = z.object({
  answers: z.record(z.enum(ONBOARDING_STEPS), z.array(z.string())),
  completedAt: z.date().nullable(),
});

export type OnboardingState = z.infer<typeof onboardingStateSchema>;

/** Splits a list answer. One per line, blanks dropped, order preserved. */
export function splitList(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}
