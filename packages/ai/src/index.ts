/**
 * @zerocorp/ai — Layer 3
 *
 * Text, image and transcription providers behind the ports @zerocorp/application
 * defines, plus task-based model routing and cost accounting.
 *
 * Every structured model output is schema-validated against @zerocorp/contracts and
 * then business-validated before it can reach a domain service. An LLM is never a
 * database writer — CLAUDE_CODE_RULES.md §15, ADR 0002.
 */
export { AnthropicTextProvider, AnthropicProviderError } from "./anthropic";
export { OpenRouterTextProvider, OpenRouterError, UnsupportedModelError, assertModelSupportsStructuredOutput } from "./openrouter";
export type { OpenRouterOptions } from "./openrouter";
export type { AnthropicOptions } from "./anthropic";
export { ModelBusinessArchitect, FallbackArchitect } from "./architect/model";
export { DeterministicArchitect } from "./architect/deterministic";
export { ARCHITECT_SYSTEM_PROMPT, buildUserMessage } from "./architect/prompt";
export { MODEL_PRICES, TASK_MODELS, DEFAULT_MODEL, costMicros } from "./pricing";
export type { ModelPrice } from "./pricing";
export { DeterministicInterviewer, extractDeterministically, openingCard } from "./interview/deterministic";
export { ModelInterviewer, FallbackInterviewer, enforceLimits } from "./interview/model";
export { INTERVIEW_SYSTEM_PROMPT, buildInterviewMessage } from "./interview/prompt";
export * from "./onboarding/index";
