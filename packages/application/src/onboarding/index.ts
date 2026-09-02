import {
  ONBOARDING_STEPS,
  isListStep,
  onboardingTranscriptSchema,
  type OnboardingExtraction,
  onboardingAnswerSchema,
  splitList,
  type OnboardingAnswer,
  type OnboardingState,
  type OnboardingStepKey,
  type TenantContext,
} from "@zerocorp/contracts";
import type { UnitOfWork } from "../ports";

/** The port. One read, one write, one completion. */
export interface OnboardingRepository<TTx = unknown> {
  read(tx: TTx, ctx: TenantContext): Promise<OnboardingState>;
  saveAnswer(tx: TTx, ctx: TenantContext, step: OnboardingStepKey, values: string[], transcript?: string): Promise<void>;
  complete(tx: TTx, ctx: TenantContext): Promise<void>;
}

/** Transcript in, eight fields out. Implemented by a model or by a deterministic stub. */
export interface OnboardingExtractor {
  extract(transcript: string): Promise<OnboardingExtraction & { costMicros: number; model: string }>;
}

export interface OnboardingService {
  state(ctx: TenantContext): Promise<OnboardingState>;
  /** The voice path: talk once, and the form comes back full. */
  fromTranscript(ctx: TenantContext, input: unknown): Promise<{ state: OnboardingState; heard: OnboardingStepKey[] }>;
  answer(ctx: TenantContext, input: unknown): Promise<OnboardingState>;
  finish(ctx: TenantContext): Promise<OnboardingState>;
}

/**
 * Launch your business.
 *
 * Every answer is written the moment it is given, not batched to the end. A founder who
 * closes the tab on step six has six answers and resumes at seven; a wizard that keeps
 * everything in memory until a final submit loses all of it, and this is the longest
 * form in the product.
 */
export function createOnboardingService(deps: {
  uow: UnitOfWork;
  repository: OnboardingRepository;
  extractor: OnboardingExtractor;
}): OnboardingService {
  const { uow, repository, extractor } = deps;

  return {
    state: (ctx) => uow.withTenant(ctx, (tx) => repository.read(tx, ctx)),

    /**
     * The voice path.
     *
     * A founder describes their business out loud once, and the eight fields come back
     * filled. Only fields the extractor reports as HEARD are written: a model that
     * guessed an industry from the description produced a plausible sentence the founder
     * would half-agree with and ship, which is worse than an empty field they have to
     * fill. The reveal then asks for whatever was not heard.
     */
    async fromTranscript(ctx, input) {
      const { transcript } = onboardingTranscriptSchema.parse(input);
      const extraction = await extractor.extract(transcript);

      return uow.withTenant(ctx, async (tx) => {
        for (const step of extraction.heard) {
          const values = isListStep(step)
            ? (step === "target_keywords" ? extraction.target_keywords : extraction.unique_selling_points)
            : [extraction[step as Exclude<OnboardingStepKey, "target_keywords" | "unique_selling_points">]].filter(
                (v): v is string => typeof v === "string" && v.length > 0,
              );
          if (values.length === 0) continue;
          // The transcript is stored once, with the first field written from it, as
          // provenance for every answer that came out of the same recording.
          await repository.saveAnswer(tx, ctx, step, values, transcript);
        }
        return { state: await repository.read(tx, ctx), heard: extraction.heard };
      });
    },

    async answer(ctx, input) {
      const parsed: OnboardingAnswer = onboardingAnswerSchema.parse(input);
      // A list step stores many values, a sentence step stores exactly one. Storing a
      // sentence as a one-element list keeps the read shape uniform, so the screen has
      // one branch instead of eight.
      const values = isListStep(parsed.step) ? splitList(parsed.text) : [parsed.text];
      if (values.length === 0) throw new Error("An answer cannot be empty");

      return uow.withTenant(ctx, async (tx) => {
        await repository.saveAnswer(tx, ctx, parsed.step, values, parsed.transcript);
        return repository.read(tx, ctx);
      });
    },

    async finish(ctx) {
      return uow.withTenant(ctx, async (tx) => {
        const state = await repository.read(tx, ctx);
        // Completion is a claim about the record, so it is checked against the record
        // rather than against a step counter the client sent.
        const missing = ONBOARDING_STEPS.filter((s) => (state.answers[s] ?? []).length === 0);
        if (missing.length > 0) {
          throw new Error(`Onboarding is not finished: ${missing.join(", ")} still empty`);
        }
        await repository.complete(tx, ctx);
        return repository.read(tx, ctx);
      });
    },
  };
}
