/**
 * @zerocorp/application — Layer 2
 *
 * Use cases, ports and transaction boundaries. This is the layer every adapter
 * calls: apps/app route handlers, apps/sites, apps/worker jobs, and — when it
 * arrives — apps/api controllers. All of them call the SAME use case.
 *
 * That is what makes apps/api an addition rather than a rewrite.
 *
 * HARD RULES:
 *   - depends only on @zerocorp/domain and @zerocorp/contracts
 *   - no framework, no Node built-ins, no DOM (same tsconfig lockdown as domain)
 *   - never imports an infrastructure package; it DEFINES ports, adapters implement them
 */
export * from "./ports.js";
export * from "./use-case.js";
