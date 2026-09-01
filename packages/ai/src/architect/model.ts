import { zodToJsonSchema } from "zod-to-json-schema";
import {
  architectOutputSchema,
  type ArchitectInput,
  type ArchitectOutput,
  type ArchitectRun,
} from "@zerocorp/contracts";
import { validateArchitectOutput } from "@zerocorp/domain";
import {
  ArchitectFailedError,
  type AITextProvider,
  type BusinessArchitect,
} from "@zerocorp/application";
import { ARCHITECT_SYSTEM_PROMPT, buildUserMessage } from "./prompt";
import { costMicros } from "../pricing";

/**
 * The model-backed Business Architect — ADR 0002.
 *
 * The JSON Schema handed to the model is DERIVED from the Zod contract, so the shape
 * the model is asked for and the shape the code accepts cannot drift. Writing it twice
 * is how they disagree.
 *
 * On an invalid output it retries ONCE, with the validation errors appended, and then
 * fails. It never repairs. Repairing usually works, which is the problem: it turns a
 * loud failure into a quiet one and produces a plan nobody specified.
 */

const MAX_OUTPUT_TOKENS = 4_000;
const MAX_ATTEMPTS = 2;

export interface ModelArchitectOptions {
  readonly provider: AITextProvider;
  readonly task?: string;
  readonly now?: () => number;
}

export class ModelBusinessArchitect implements BusinessArchitect {
  readonly kind = "model" as const;

  /** Computed once: the schema does not change between calls. */
  private readonly jsonSchema = zodToJsonSchema(architectOutputSchema, {
    name: "architect_output",
    $refStrategy: "none",
  }) as Record<string, unknown>;

  constructor(private readonly options: ModelArchitectOptions) {}

  async analyze(input: ArchitectInput): Promise<ArchitectRun> {
    const clock = this.options.now ?? (() => Date.now());
    const startedAt = clock();
    let corrections = "";
    let lastDetail = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const response = await this.options.provider
        .generateStructured({
          task: this.options.task ?? "assessment.analyze",
          system: ARCHITECT_SYSTEM_PROMPT,
          user: buildUserMessage(input) + corrections,
          jsonSchema: this.jsonSchema,
          schemaName: "architect_output",
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        })
        .catch((cause: unknown) => {
          // A provider that is down is not an invalid output, and retrying a schema
          // correction against a dead endpoint wastes the visitor's time.
          throw new ArchitectFailedError("provider_unavailable", String(cause), attempt);
        });

      const parsed = architectOutputSchema.safeParse(response.json);
      if (!parsed.success) {
        lastDetail = parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .slice(0, 12)
          .join("; ");
        corrections = `\n\nYOUR PREVIOUS ANSWER WAS REJECTED. Fix exactly these problems:\n${lastDetail}`;
        continue;
      }

      const problems = validateArchitectOutput(parsed.data as ArchitectOutput, input);
      if (problems.length > 0) {
        lastDetail = problems.map((p) => `${p.code}: ${p.detail}`).join("; ");
        corrections = `\n\nYOUR PREVIOUS ANSWER WAS REJECTED. Fix exactly these problems:\n${lastDetail}`;
        continue;
      }

      const cost = costMicros(response.model, response.inputTokens, response.outputTokens);
      return {
        output: parsed.data,
        usage: {
          provider: response.provider,
          model: response.model,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          // An unpriced model records zero cost and is visible as a model with no price
          // in the pricing table, rather than as a run that looks free.
          costMinor: cost ?? 0,
          durationMs: clock() - startedAt,
        },
        attempts: attempt,
        deterministic: false,
      };
    }

    throw new ArchitectFailedError("invalid_output", lastDetail, MAX_ATTEMPTS);
  }
}

/**
 * Runs the model architect, and falls back to another one when it fails.
 *
 * The fallback is not a smaller model. A visitor whose analysis failed twice needs an
 * answer, not a third chance at the same failure mode.
 */
export class FallbackArchitect implements BusinessArchitect {
  readonly kind = "model" as const;

  constructor(
    private readonly primary: BusinessArchitect,
    private readonly fallback: BusinessArchitect,
    private readonly onFallback?: (reason: string) => void,
  ) {}

  async analyze(input: ArchitectInput): Promise<ArchitectRun> {
    try {
      return await this.primary.analyze(input);
    } catch (cause) {
      const reason = cause instanceof ArchitectFailedError ? cause.reason : "unknown";
      this.onFallback?.(reason);
      return this.fallback.analyze(input);
    }
  }
}
