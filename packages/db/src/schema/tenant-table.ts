import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";

/**
 * Registry of every tenant-owned table.
 *
 * The tenant-isolation suite reads this registry and fails the build if a table
 * declared here is missing its tenant_id column. A tenant-owned table that is
 * not declared through tenantTable() is a boundary violation.
 */
export const TENANT_OWNED_TABLES = new Set<string>();

/**
 * Declares a tenant-owned table. tenant_id, id and timestamps are not optional
 * and cannot be omitted by the caller.
 *
 * Every table created with this helper also requires an RLS policy in its
 * migration. See DATABASE.md.
 */
export function tenantTable<TName extends string, TColumns extends Record<string, unknown>>(
  name: TName,
  columns: TColumns,
) {
  TENANT_OWNED_TABLES.add(name);
  return pgTable(name, {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ...(columns as Record<string, never>),
  });
}
