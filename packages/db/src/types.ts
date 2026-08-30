import type { drizzle } from "drizzle-orm/postgres-js";

/**
 * The transaction handle handed to a withTenant() callback.
 *
 * Public on purpose — callers need it to type their queries — and deliberately
 * NOT declared in src/internal/, so @zerocorp/db's entrypoint never references
 * the private client module. See tests/architecture/framework-freedom.test.ts.
 */
export type Tx = Parameters<Parameters<ReturnType<typeof drizzle>["transaction"]>[0]>[0];
