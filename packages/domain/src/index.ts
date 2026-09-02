/**
 * @zerocorp/domain — Layer 1
 *
 * Entities, value objects, invariants, state machines and domain events.
 *
 * HARD RULES (mechanically enforced, see ARCHITECTURE.md "Boundary enforcement"):
 *   - no framework imports (next, react, @nestjs/*) — not in package.json, unresolvable under pnpm
 *   - no Node built-ins — tsconfig sets "types": []
 *   - no DOM — tsconfig sets "lib": ["ES2022"]
 *   - no IO of any kind: no database, no HTTP, no filesystem, no clock, no randomness
 *
 * Anything non-deterministic is injected as a port by @zerocorp/application.
 */
export * from "./errors";
export * from "./state-machine";
export * from "./formation";
export * from "./architect";
export * from "./interview";
export * from "./generation";
export * from "./formation/residency";
