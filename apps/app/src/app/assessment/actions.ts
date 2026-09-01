"use server";

import { redirect } from "next/navigation";
import {
  planEditSchema,
  questionCardSchema,
  type PlanEdit,
  type QuestionCard,
  type SlotId,
  type SlotState,
} from "@zerocorp/contracts";
import { getAssessmentService, getInterviewService } from "../../server/container";

/**
 * Server Actions for the funnel.
 *
 * Thin adapters, per ARCHITECTURE.md §3: parse, invoke a use case, serialise. No
 * business logic and no database access — every one calls a use case in
 * @zerocorp/application, and none imports @zerocorp/db.
 *
 * Every input is parsed against its contract on arrival. A Server Action is a public
 * HTTP endpoint wearing a function signature, and treating its argument as trusted
 * because it came from our own form is how the first hole gets made.
 */

export interface TurnResult {
  readonly ok: boolean;
  readonly card?: QuestionCard | null;
  readonly slots?: Record<SlotId, SlotState>;
  readonly deterministic?: boolean;
  readonly error?: string;
}

/**
 * The landing IS the first question — D18.
 *
 * The opening question is fixed and costs no model call, so the visitor answers it in
 * the hero and arrives here already committed. Nothing was spent on anyone who bounced.
 */
export async function startInterview(text: string): Promise<never> {
  const answer = text.trim();
  if (answer.length === 0 || answer.length > 2_000) redirect("/");

  const { token, card } = await getInterviewService().start("en");
  await getInterviewService().answer(token, card, answer, []);
  redirect(`/assessment/${token}`);
}

export async function answerQuestion(
  token: string,
  card: unknown,
  text: string,
  values: string[] = [],
): Promise<TurnResult> {
  const parsed = questionCardSchema.safeParse(card);
  if (!parsed.success) return { ok: false, error: "That question is not one we recognise." };

  const answer = text.trim();
  if (answer.length === 0 || answer.length > 4_000) {
    return { ok: false, error: "Say a little more, and under 4000 characters." };
  }

  try {
    const result = await getInterviewService().answer(token, parsed.data, answer, values);
    return { ok: true, ...result };
  } catch (cause) {
    return { ok: false, error: messageFor(cause) };
  }
}

export async function editAnswer(
  token: string,
  position: number,
  text: string,
  values: string[] = [],
): Promise<TurnResult> {
  if (!Number.isInteger(position) || position < 0) return { ok: false, error: "Unknown answer." };
  const answer = text.trim();
  if (answer.length === 0) return { ok: false, error: "An answer cannot be empty." };

  try {
    const result = await getInterviewService().editTurn(token, position, answer, values);
    return { ok: true, ...result };
  } catch (cause) {
    return { ok: false, error: messageFor(cause) };
  }
}

export async function runAnalysis(token: string): Promise<TurnResult> {
  try {
    await getAssessmentService().analyze(token);
  } catch (cause) {
    return { ok: false, error: messageFor(cause) };
  }
  redirect(`/assessment/${token}/plan`);
}

export async function applyPlanEdits(token: string, edits: PlanEdit[]): Promise<TurnResult> {
  const parsed = edits.map((e) => planEditSchema.safeParse(e));
  const bad = parsed.find((p) => !p.success);
  if (bad && !bad.success) return { ok: false, error: bad.error.issues[0]?.message ?? "Invalid edit" };

  try {
    await getAssessmentService().applyEdits(token, parsed.flatMap((p) => (p.success ? [p.data] : [])));
    return { ok: true };
  } catch (cause) {
    return { ok: false, error: messageFor(cause) };
  }
}

export async function discussPlan(token: string, message: string): Promise<TurnResult> {
  const text = message.trim();
  if (text.length === 0 || text.length > 4_000) {
    return { ok: false, error: "Say a little more, and under 4000 characters." };
  }
  try {
    await getAssessmentService().discuss(token, text);
    await getAssessmentService().analyze(token);
    return { ok: true };
  } catch (cause) {
    return { ok: false, error: messageFor(cause) };
  }
}

export async function setContactEmail(token: string, email: string): Promise<TurnResult> {
  const value = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return { ok: false, error: "That does not look like an email address." };
  }
  try {
    await getAssessmentService().setContactEmail(token, value);
    return { ok: true };
  } catch (cause) {
    return { ok: false, error: messageFor(cause) };
  }
}

export async function approvePlan(token: string): Promise<TurnResult> {
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
 * Named errors carry a message written for them. Anything else becomes one sentence: an
 * unexpected error's text is for us, and a stack trace or a constraint name on a public
 * page is how internals leak.
 */
function messageFor(cause: unknown): string {
  if (cause instanceof Error) {
    switch (cause.name) {
      case "InterviewNotFoundError":
      case "AssessmentNotFoundError":
        return "We could not find that assessment. It may have expired.";
      case "UnexpectedAnswerError":
        return "That is not the question we asked. Reload and try again.";
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
