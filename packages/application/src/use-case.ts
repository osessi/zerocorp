import type { TenantContext } from "@zerocorp/contracts";

/**
 * Every use case has the same shape, so every adapter calls it the same way.
 *
 * An HTTP handler stays thin: parse, authenticate, authorize, invoke a use case,
 * serialize the result. Business logic must never live in an HTTP handler,
 * a Server Component or a Server Action.
 */
export interface UseCase<TInput, TOutput> {
  readonly name: string;
  execute(ctx: TenantContext, input: TInput): Promise<TOutput>;
}

export function defineUseCase<TInput, TOutput>(
  name: string,
  execute: (ctx: TenantContext, input: TInput) => Promise<TOutput>,
): UseCase<TInput, TOutput> {
  return { name, execute };
}
