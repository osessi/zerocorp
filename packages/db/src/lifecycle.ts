import { __closeAllClients } from "./internal/client";

/**
 * Closes every connection pool.
 *
 * Integration suites only. A long-lived process keeps its pool for its lifetime; a
 * vitest run does not, and an open pool keeps the process alive after the last
 * assertion.
 *
 * It lives here rather than being re-exported straight from index.ts because the
 * entrypoint must not name the private client module — NN-2, asserted by
 * tests/architecture/framework-freedom.test.ts. Nothing about the raw client escapes
 * through this function: it takes nothing and returns void.
 */
export async function closeAllConnections(): Promise<void> {
  await __closeAllClients();
}
