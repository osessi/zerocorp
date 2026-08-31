/**
 * @zerocorp/contracts — Layer 0 (leaf)
 *
 * Everything that crosses a boundary is typed here: HTTP payloads, use-case
 * inputs and outputs, domain events, provider responses, LLM output shapes.
 *
 * This package has no internal dependencies and never imports a framework.
 * It is the vocabulary that lets `apps/api` be generated later without
 * reinventing a single contract.
 */
export * from "./tenant-context.js";
export * from "./ids.js";
export * from "./formation.js";
