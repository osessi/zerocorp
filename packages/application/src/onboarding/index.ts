import {
  ONBOARDING_STEPS,
  isListStep,
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

export interface OnboardingService {
  state(ctx: TenantContext): Promise<OnboardingState>;
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
}): OnboardingService {
  const { uow, repository } = deps;

  return {
    state: (ctx) => uow.withTenant(ctx, (tx) => repository.read(tx, ctx)),

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
