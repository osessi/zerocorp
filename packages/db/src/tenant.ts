import { sql } from "drizzle-orm";
import type { TenantContext } from "@zerocorp/contracts";
import type { UnitOfWork } from "@zerocorp/application";
import { getClient } from "./internal/client";
import type { Tx } from "./types";

/**
 * The only sanctioned path to tenant-owned data.
 *
 * Three guarantees, all enforced by PostgreSQL rather than by convention:
 *
 *   1. `app.tenant_id` is pinned for the transaction, so every RLS policy resolves
 *      to this tenant. A forgotten WHERE clause returns zero rows, not another
 *      tenant's rows.
 *   2. A read-only context issues SET LOCAL TRANSACTION READ ONLY. Any write
 *      raises error 25006 at the database. This is what makes apps/sites unable
 *      to write, structurally, even if its code tried.
 *   3. Settings are LOCAL, so they disappear with the transaction and cannot
 *      leak across pooled connections.
 */
export async function withTenant<T>(
  databaseUrl: string,
  ctx: TenantContext,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  const db = getClient(databaseUrl);
  return db.transaction(async (tx) => {
    if (ctx.accessMode === "read-only") {
      await tx.execute(sql`set local transaction read only`);
    }
    await tx.execute(sql`select set_config('app.tenant_id', ${ctx.tenantId}, true)`);
    await tx.execute(sql`select set_config('app.access_mode', ${ctx.accessMode}, true)`);
    await tx.execute(sql`select set_config('app.request_id', ${ctx.requestId}, true)`);
    return fn(tx);
  });
}

/** Adapter for the application-layer port. Wired in each app's composition root. */
export function createUnitOfWork(databaseUrl: string): UnitOfWork<Tx> {
  return { withTenant: (ctx, fn) => withTenant(databaseUrl, ctx, fn) };
}
