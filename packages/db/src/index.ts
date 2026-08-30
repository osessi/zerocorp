/**
 * @zerocorp/db — Layer 3
 *
 * THE tenant choke point. This package's "exports" field maps only ".", so
 * `@zerocorp/db/internal/client` is not resolvable from anywhere else in the
 * repository. The raw Drizzle client physically cannot leave this package.
 *
 * Everything tenant-owned goes through withTenant(). There is no second door.
 */
export { withTenant, createUnitOfWork } from "./tenant.js";
export { tenantTable, TENANT_OWNED_TABLES } from "./schema/tenant-table.js";
export type { Tx } from "./types.js";
