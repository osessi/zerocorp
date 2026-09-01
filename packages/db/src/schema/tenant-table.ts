import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import type { PgColumnBuilderBase } from "drizzle-orm/pg-core";

/**
 * Registry of every tenant-owned table.
 *
 * The tenant-isolation suite reads this registry and fails the build if a table
 * declared here is missing its tenant_id column, its RLS policy, or a case in the
 * isolation matrix. A tenant-owned table that is not declared through tenantTable()
 * is a boundary violation.
 */
export const TENANT_OWNED_TABLES = new Set<string>();

/** The four columns every tenant-owned table has, whatever else it has. */
const BASE_COLUMNS = {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
} as const;

/**
 * Declares a tenant-owned table. tenant_id, id and timestamps are not optional
 * and cannot be omitted by the caller.
 *
 * Every table created with this helper also requires an RLS policy in its
 * migration. See DATABASE.md.
 *
 * The generic is constrained to PgColumnBuilderBase rather than `unknown` so the
 * caller's columns keep their types. An earlier version spread the columns through
 * `as Record<string, never>`, which compiled but erased every column type — so
 * `businessProfiles.businessName` typed as `never` and every query against it had
 * to be written with a cast. A schema whose types are all `never` is a schema the
 * compiler cannot check.
 */
export function tenantTable<TName extends string, TColumns extends Record<string, PgColumnBuilderBase>>(
  name: TName,
  columns: TColumns,
) {
  TENANT_OWNED_TABLES.add(name);
  return pgTable(name, { ...BASE_COLUMNS, ...columns });
}
