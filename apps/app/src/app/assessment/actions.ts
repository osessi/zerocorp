"use server";

import { redirect } from "next/navigation";
import {
  partialAssessmentAnswersSchema,
  planEditSchema,
  type PartialAssessmentAnswers,
  type PlanEdit,
} from "@zerocorp/contracts";
import { getAssessmentService } from "../../server/container";

/**
 * Server Actions for the funnel.
 *
 * Thin adapters, per ARCHITECTURE.md §3: parse, invoke a use case, serialise. No
 * business logic and no database access — every one of these calls a use case in
 * @zerocorp/application, and none imports @zerocorp/db.
 *
 * Every input is parsed against its contract schema on arrival. A Server Action is a
 * public HTTP endpoint wearing a function signature, and treating its argument as
 * trusted because it came from our own form is how the first hole gets made.
 */

export interface FunnelResult {
  readonly ok: boolean;
  readonly token?: string;
  readonly error?: string;
}

export async function startAssessment(): Promise<{ token: string }> {
  const { token } = await getAssessmentService().start("en");
  return { token };
}

export async function saveAnswers(token: string, patch: PartialAssessmentAnswers): Promise<FunnelResult> {
  const parsed = partialAssessmentAnswersSchema.safeParse(patch);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  try {
    await getAssessmentService().saveAnswers(token, parsed.data);
    return { ok: true, token };
  } catch (cause) {
    return { ok: false, error: messageFor(cause) };
  }
}

export async function analyzeAssessment(token: string): Promise<FunnelResult> {
  try {
    await getAssessmentService().analyze(token);
  } catch (cause) {
    return { ok: false, error: messageFor(cause) };
  }
  redirect(`/assessment/${token}/analysis`);
}

export async function applyPlanEdits(token: string, edits: PlanEdit[]): Promise<FunnelResult> {
  const parsed = edits.map((e) => planEditSchema.safeParse(e));
  const bad = parsed.find((p) => !p.success);
  if (bad && !bad.success) return { ok: false, error: bad.error.issues[0]?.message ?? "Invalid edit" };

  try {
    await getAssessmentService().applyEdits(
      token,
      parsed.flatMap((p) => (p.success ? [p.data] : [])),
    );
    return { ok: true, token };
  } catch (cause) {
    return { ok: false, error: messageFor(cause) };
  }
}

export async function discussPlan(token: string, message: string): Promise<FunnelResult> {
  const text = message.trim();
  if (text.length === 0 || text.length > 4_000) return { ok: false, error: "Say a little more, and under 4000 characters." };
  try {
    await getAssessmentService().discuss(token, text);
    return { ok: true, token };
  } catch (cause) {
    return { ok: false, error: messageFor(cause) };
  }
}

export async function regeneratePlan(token: string): Promise<FunnelResult> {
  try {
    await getAssessmentService().analyze(token);
    return { ok: true, token };
  } catch (cause) {
    return { ok: false, error: messageFor(cause) };
  }
}

export async function approvePlan(token: string): Promise<FunnelResult> {
  try {
    await getAssessmentService().approve(token);
  } catch (cause) {
    return { ok: false, error: messageFor(cause) };
  }
  redirect(`/assessment/${token}/pricing`);
}

/**
 * What the visitor is told.
 *
 * Named errors carry a message written for them. Anything else becomes one sentence:
 * an unexpected error's text is for us, and putting a stack trace or a database
 * constraint name on a public page is how internals leak.
 */
function messageFor(cause: unknown): string {
  if (cause instanceof Error) {
    switch (cause.name) {
      case "AssessmentNotFoundError":
        return "We could not find that assessment. It may have expired.";
      case "AssessmentIncompleteError":
        return "A few answers are still missing.";
      case "AnalysisLimitReachedError":
        return "You have reached the limit for free proposals. Approve a plan to continue.";
      case "ArchitectFailedError":
        return "We could not finish your assessment just now. Your answers are saved. Try again.";
      case "IllegalAssessmentTransitionError":
        return "That step has already been taken.";
    }
  }
  console.error("[assessment] unexpected failure", cause);
  return "Something went wrong. Your answers are saved.";
}
