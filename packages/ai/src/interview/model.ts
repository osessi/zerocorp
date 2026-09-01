import { zodToJsonSchema } from "zod-to-json-schema";
import {
  MAX_INTERVIEW_TURNS,
  interviewOutputSchema,
  type InterviewInput,
  type InterviewOutput,
} from "@zerocorp/contracts";
import { ArchitectFailedError, type AITextProvider } from "@zerocorp/application";
import { INTERVIEW_SYSTEM_PROMPT, buildInterviewMessage } from "./prompt";
import { DeterministicInterviewer } from "./deterministic";

/**
 * The model-backed interviewer.
 *
 * Same discipline as the architect (ADR 0002): schema derived from Zod, one retry with
 * the errors appended, then failure. Never repaired.
 *
 * Two guards that only this agent needs, because only this agent can loop:
 *
 *   1. The turn cap is enforced HERE, after the model answers. A model told it has zero
 *      turns left can still return a question, and a cap that depends on the model
 *      obeying it is not a cap.
 *   2. A question about an already-filled slot is dropped. Re-asking is the single most
 *      damaging thing this agent can do to the experience, and it is cheap to prevent.
 */

const MAX_OUTPUT_TOKENS = 1_200;
const MAX_ATTEMPTS = 2;

export interface ModelInterviewerOptions {
  readonly provider: AITextProvider;
  readonly task?: string;
}

export class ModelInterviewer {
  readonly kind = "model" as const;

  private readonly jsonSchema = zodToJsonSchema(interviewOutputSchema, {
    name: "interview_output",
    $refStrategy: "none",
  }) as Record<string, unknown>;

  constructor(private readonly options: ModelInterviewerOptions) {}

  async next(input: InterviewInput): Promise<InterviewOutput & { costMicros: number; model: string }> {
    let corrections = "";
    let lastDetail = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const response = await this.options.provider
        .generateStructured({
          task: this.options.task ?? "assessment.interview",
          system: INTERVIEW_SYSTEM_PROMPT,
          user: buildInterviewMessage(input) + corrections,
          jsonSchema: this.jsonSchema,
          schemaName: "interview_output",
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        })
        .catch((cause: unknown) => {
          throw new ArchitectFailedError("provider_unavailable", String(cause), attempt);
        });

      const parsed = interviewOutputSchema.safeParse(response.json);
      if (!parsed.success) {
        lastDetail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).slice(0, 10).join("; ");
        corrections = `\n\nYOUR PREVIOUS ANSWER WAS REJECTED. Fix exactly these problems:\n${lastDetail}`;
        continue;
      }

      return {
        ...enforceLimits(parsed.data, input),
        costMicros: response.costMicros ?? 0,
        model: response.model,
      };
    }

    throw new ArchitectFailedError("invalid_output", lastDetail, MAX_ATTEMPTS);
  }
}

/**
 * The cap and the no-repeat rule, applied to whatever the model returned.
 *
 * Both are enforced in code because both are rules the model can violate while producing
 * perfectly valid JSON, and a limit that depends on the model choosing to respect it is
 * not a limit.
 */
export function enforceLimits(output: InterviewOutput, input: InterviewInput): InterviewOutput {
  if (output.next === null) return output;

  if (input.turnsRemaining <= 0 || input.transcript.length >= MAX_INTERVIEW_TURNS) {
    return { ...output, next: null };
  }

  const slot = output.next.slot;
  if (slot !== null && input.slots[slot]?.filled && input.slots[slot]?.source !== "inferred") {
    // Asking again for something already answered is the most damaging thing this agent
    // can do to the experience. Dropped rather than shown.
    return { ...output, next: null };
  }

  return output;
}

/** Model first, rules behind it, so a provider outage degrades the interview rather than ending it. */
export class FallbackInterviewer {
  readonly kind = "model" as const;

  constructor(
    private readonly primary: ModelInterviewer,
    private readonly fallback = new DeterministicInterviewer(),
    private readonly onFallback?: (reason: string) => void,
  ) {}

  async next(input: InterviewInput): Promise<InterviewOutput & { costMicros: number; model: string }> {
    try {
      return await this.primary.next(input);
    } catch (cause) {
      const reason = cause instanceof ArchitectFailedError ? cause.reason : "unknown";
      this.onFallback?.(reason);
      return this.fallback.next(input);
    }
  }
}
