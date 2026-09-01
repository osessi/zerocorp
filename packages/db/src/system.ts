import { sql } from "drizzle-orm";
import { getClient } from "./internal/client";
import type { Tx } from "./types";

/**
 * The door to GLOBAL tables — tenants, users, memberships, sessions, and the whole
 * pre-payment funnel. See schema/global.ts for why those tables exist.
 *
 * This is not a back door around withTenant(). It cannot be: every tenant-owned
 * table has a policy comparing tenant_id to app.tenant_id, and this function
 * deliberately clears that setting. A system transaction therefore sees ZERO rows
 * in every tenant-owned table, enforced by PostgreSQL rather than by review.
 *
 * The explicit clear is not redundant with LOCAL scoping. Settings written with
 * set_config(..., false) survive on a pooled connection, and one such call anywhere
 * in the codebase would otherwise leak a tenant into every later system transaction.
 * Clearing costs one round trip and removes the whole class.
 */
export async function withSystem<T>(
  databaseUrl: string,
  requestId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  const db = getClient(databaseUrl);
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', '', true)`);
    await tx.execute(sql`select set_config('app.access_mode', 'system', true)`);
    await tx.execute(sql`select set_config('app.request_id', ${requestId}, true)`);
    return fn(tx);
  });
}

/** Adapter for the application-layer port. Wired in each app's composition root. */
export function createSystemUnitOfWork(databaseUrl: string): {
  withSystem<T>(requestId: string, fn: (tx: Tx) => Promise<T>): Promise<T>;
} {
  return { withSystem: (requestId, fn) => withSystem(databaseUrl, requestId, fn) };
}
