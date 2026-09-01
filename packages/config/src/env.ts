import { z } from "zod";

/**
 * Runtime configuration, parsed once and validated at boot.
 *
 * Three schemas, not one, because each application is entitled to different
 * credentials. apps/sites must not be able to read the read-write DATABASE_URL
 * even by accident: it is not in its schema, so it is not in its config object.
 * That is a security boundary expressed as a type, not a comment.
 *
 * Nothing here reads process.env on import. Configuration is loaded explicitly by
 * a composition root, so a test can pass its own record and a build can succeed
 * without secrets.
 */

const postgresUrl = z
  .string()
  .min(1)
  .refine((v) => v.startsWith("postgres://") || v.startsWith("postgresql://"), {
    message: "must be a postgres:// or postgresql:// URL",
  });

/** Secrets must be long enough that a leaked one is not brute-forceable. */
const secret = z.string().min(32, "must be at least 32 characters");

const nodeEnv = z.enum(["development", "test", "production"]).default("development");

/**
 * apps/app and apps/worker — the read-write role.
 *
 * Provider credentials are optional at the schema level and required by the
 * adapter that needs them. A missing Stripe key must break checkout at the point
 * of use with a clear message, not break `next build` on a machine that will
 * never take a payment.
 */
export const appEnvSchema = z.object({
  NODE_ENV: nodeEnv,
  DATABASE_URL: postgresUrl,
  SESSION_SECRET: secret,
  APP_URL: z.string().url(),

  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_LAUNCH_SETUP: z.string().min(1).optional(),
  STRIPE_PRICE_ACTIVATION_SETUP: z.string().min(1).optional(),
  STRIPE_PRICE_SUBSCRIPTION_LAUNCH: z.string().min(1).optional(),
  STRIPE_PRICE_SUBSCRIPTION_GROWTH: z.string().min(1).optional(),
  STRIPE_PRICE_SUBSCRIPTION_AUTOPILOT: z.string().min(1).optional(),

  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5"),

  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_REGION: z.string().min(1).default("auto"),
  STORAGE_ACCESS_KEY_ID: z.string().min(1).optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  STORAGE_BUCKET_IDENTITY: z.string().min(1).default("zerocorp-identity"),
});
export type AppEnv = z.infer<typeof appEnvSchema>;

/**
 * apps/sites — the READ-ONLY role, and nothing else.
 *
 * No session secret, no payment key, no model key. The public renderer reads
 * published pages; every capability beyond that is a capability it cannot be
 * tricked into using.
 */
export const sitesEnvSchema = z.object({
  NODE_ENV: nodeEnv,
  SITES_DATABASE_URL: postgresUrl,
});
export type SitesEnv = z.infer<typeof sitesEnvSchema>;

/** apps/worker — read-write, plus the provider credentials jobs actually need. */
export const workerEnvSchema = appEnvSchema;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

/**
 * Thrown at boot, never caught. A process with invalid configuration must not
 * start: a half-configured server is how a "temporary" fallback reaches production.
 */
export class ConfigError extends Error {
  override readonly name = "ConfigError";
  constructor(readonly issues: readonly string[]) {
    super(`Invalid configuration:\n  ${issues.join("\n  ")}`);
  }
}

export function parseEnv<T extends z.ZodTypeAny>(schema: T, source: Record<string, unknown>): z.infer<T> {
  const result = schema.safeParse(source);
  if (result.success) return result.data;
  // Only the variable NAME and the rule it broke. Never the value: an invalid
  // DATABASE_URL still contains a password.
  throw new ConfigError(result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`));
}
