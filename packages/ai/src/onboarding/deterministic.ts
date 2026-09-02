import type { OnboardingExtraction } from "@zerocorp/contracts";

/**
 * The extractor used in tests and when no model is configured.
 *
 * It does the one thing that can be done honestly without a model: takes the first
 * sentence as the description and admits it heard nothing else. It never guesses, which
 * makes it a correct, if thin, implementation of the same contract.
 */
export class DeterministicExtractor {
  readonly kind = "deterministic" as const;

  async extract(transcript: string): Promise<OnboardingExtraction & { costMicros: number; model: string }> {
    const first = transcript.split(/[.!?]/)[0]?.trim() ?? "";
    return {
      business_name: null,
      description: first.length >= 10 ? first.slice(0, 600) : null,
      industry: null,
      icp_description: null,
      positioning: null,
      unique_selling_points: [],
      target_keywords: [],
      tone_of_voice: null,
      heard: first.length >= 10 ? ["description"] : [],
      costMicros: 0,
      model: "deterministic",
    };
  }
}
