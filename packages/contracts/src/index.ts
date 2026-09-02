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
export * from "./tenant-context";
export * from "./ids";
export * from "./country";
export * from "./money";
export * from "./jurisdiction";
export * from "./eligibility";
export * from "./provider";
export * from "./formation";
export * from "./formation-request";
export * from "./assessment";
export * from "./plan";
export * from "./architect";
export * from "./interview";
export * from "./billing";
export * from "./onboarding";
export * from "./pricing";
