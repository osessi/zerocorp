/**
 * @zerocorp/config — Layer 0
 *
 * Typed, validated runtime configuration. Environment variables are parsed once
 * through a Zod schema and fail fast at boot. Secrets never appear in source.
 *
 * Each app loads only the configuration it is entitled to: apps/sites receives a
 * read-only DATABASE_URL, apps/app and apps/worker receive the read-write one.
 */
export * from "./env";
export * from "./pricing";
