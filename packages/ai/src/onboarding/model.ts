import { zodToJsonSchema } from "zod-to-json-schema";
import { onboardingExtractionSchema, type OnboardingExtraction } from "@zerocorp/contracts";
import { ArchitectFailedError, type AITextProvider } from "@zerocorp/application";
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionMessage } from "./prompt";

const MAX_ATTEMPTS = 2;
const MAX_OUTPUT_TOKENS = 1400;

export interface ModelExtractorOptions {
  readonly provider: AITextProvider;
  readonly task?: string;
}

/**
 * Transcript in, eight fields out.
 *
 * Same discipline as the architect and the interviewer (ADR 0002): schema derived from
 * Zod, one retry with the validation errors fed back, reject rather than repair.
 */
export class ModelExtractor {
  readonly kind = "model" as const;

  private readonly jsonSchema = zodToJsonSchema(onboardingExtractionSchema, {
    name: "onboarding_extraction",
    $refStrategy: "none",
  }) as Record<string, unknown>;

  constructor(private readonly options: ModelExtractorOptions) {}

  async extract(transcript: string): Promise<OnboardingExtraction & { costMicros: number; model: string }> {
    let corrections = "";
    let lastDetail = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const response = await this.options.provider
        .generateStructured({
          task: this.options.task ?? "onboarding.extract",
          system: EXTRACTION_SYSTEM_PROMPT,
          user: buildExtractionMessage(transcript) + corrections,
          jsonSchema: this.jsonSchema,
          schemaName: "onboarding_extraction",
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        })
        .catch((cause: unknown) => {
          throw new ArchitectFailedError("provider_unavailable", String(cause), attempt);
        });

      const parsed = onboardingExtractionSchema.safeParse(response.json);
      if (!parsed.success) {
        lastDetail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).slice(0, 10).join("; ");
        corrections = `\n\nYOUR PREVIOUS ANSWER WAS REJECTED. Fix exactly these problems:\n${lastDetail}`;
        continue;
      }

      return { ...enforceHeard(parsed.data), costMicros: response.costMicros ?? 0, model: response.model };
    }

    throw new ArchitectFailedError("invalid_output", lastDetail, MAX_ATTEMPTS);
  }
}

/**
 * `heard` cannot claim a field that came back empty.
 *
 * Enforced in code, not asked for in the prompt, because a model can return perfectly
 * valid JSON that claims to have heard a field it left null — and `heard` is what the
 * reveal uses to decide whether to present a line as understood or to ask for it. A
 * wrong `heard` shows a founder an empty field labelled "understood".
 */
export function enforceHeard(out: OnboardingExtraction): OnboardingExtraction {
  const filled = (k: (typeof out.heard)[number]): boolean => {
    if (k === "unique_selling_points") return out.unique_selling_points.length > 0;
    if (k === "target_keywords") return out.target_keywords.length > 0;
    return out[k] !== null;
  };
  return { ...out, heard: out.heard.filter(filled) };
}
