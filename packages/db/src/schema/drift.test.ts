import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { getTableConfig } from "drizzle-orm/pg-core";
import { runMigrations } from "../migrate";
import { TENANT_OWNED_TABLES } from "./tenant-table";
import * as tenant from "./tenant";
import * as global_ from "./global";
import * as formation from "./formation";
import { closeAllConnections } from "../index";

/**
 * Schema drift.
 *
 * The migrations are hand written, because the security properties of this schema are
 * not expressible in a table definition. The cost of that choice is exactly one risk:
 * the Drizzle objects the application queries through, and the SQL the database
 * actually ran, can disagree.
 *
 * This test removes that risk by reading the LIVE catalog and comparing it to the
 * Drizzle definitions. It does not read the migration files — a test that compares a
 * file to a file proves nothing about the database.
 */

const ADMIN_URL =
  process.env["ZEROCORP_TEST_ADMIN_URL"] ?? "postgresql://postgres:postgres@localhost:55432/postgres";
const DB = "zerocorp_drift_test";

interface LiveColumn { table_name: string; column_name: string; is_nullable: string; data_type: string }

let live: Map<string, Map<string, LiveColumn>>;

/** Every table object we declare, keyed by its SQL name. */
function declaredTables() {
  const modules = [tenant, global_, formation] as Array<Record<string, unknown>>;
  const out = new Map<string, ReturnType<typeof getTableConfig>>();
  for (const m of modules) {
    for (const value of Object.values(m)) {
      if (value === null || typeof value !== "object") continue;
      let config;
      try {
        config = getTableConfig(value as Parameters<typeof getTableConfig>[0]);
      } catch {
        continue; // not a table
      }
      if (config.name.startsWith("scaffold_probe")) continue;
      out.set(config.name, config);
    }
  }
  return out;
}

beforeAll(async () => {
  const admin = postgres(ADMIN_URL, { max: 1, onnotice: () => {} });
  await admin.unsafe(`drop database if exists ${DB} with (force)`);
  await admin.unsafe(`create database ${DB}`);
  await admin.end({ timeout: 5 });

  const url = (() => {
    const u = new URL(ADMIN_URL);
    u.pathname = `/${DB}`;
    return u.toString();
  })();
  await runMigrations(url);

  const sql = postgres(url, { max: 1, onnotice: () => {} });
  const rows = await sql<LiveColumn[]>`
    select table_name, column_name, is_nullable, data_type
    from information_schema.columns
    where table_schema = 'public'
  `;
  await sql.end({ timeout: 5 });

  live = new Map();
  for (const r of rows) {
    if (!live.has(r.table_name)) live.set(r.table_name, new Map());
    live.get(r.table_name)!.set(r.column_name, r);
  }
}, 60_000);

afterAll(async () => {
  await closeAllConnections();
});

describe("the Drizzle schema matches the database the migrations built", () => {
  it("finds every declared table in the live catalog", () => {
    const missing = [...declaredTables().keys()].filter((t) => !live.has(t));
    expect(missing).toEqual([]);
  });

  it("finds every declared column, with the nullability it declares", () => {
    const problems: string[] = [];
    for (const [name, config] of declaredTables()) {
      const columns = live.get(name);
      if (!columns) continue;
      for (const column of config.columns) {
        const found = columns.get(column.name);
        if (!found) {
          problems.push(`${name}.${column.name} is declared and does not exist`);
          continue;
        }
        const declaredNullable = !column.notNull;
        const liveNullable = found.is_nullable === "YES";
        if (declaredNullable !== liveNullable) {
          problems.push(
            `${name}.${column.name} is ${declaredNullable ? "nullable" : "not null"} in the schema ` +
              `and ${liveNullable ? "nullable" : "not null"} in the database`,
          );
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("declares every tenant-owned column the database has", () => {
    // The other direction. A column added by a migration and never declared is a column
    // the application cannot read, and nobody notices until someone needs it.
    const problems: string[] = [];
    for (const [name, config] of declaredTables()) {
      const columns = live.get(name);
      if (!columns) continue;
      const declared = new Set(config.columns.map((c) => c.name));
      for (const columnName of columns.keys()) {
        if (!declared.has(columnName)) problems.push(`${name}.${columnName} exists and is not declared`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("every tenant-owned table is actually protected", () => {
  it("carries tenant_id", () => {
    const declared = [...TENANT_OWNED_TABLES].filter((t) => !t.startsWith("scaffold_probe"));
    const without = declared.filter((t) => !live.get(t)?.has("tenant_id"));
    expect(without).toEqual([]);
  });

  it("has RLS enabled and forced, read from the live catalog", async () => {
    const url = (() => {
      const u = new URL(ADMIN_URL);
      u.pathname = `/${DB}`;
      return u.toString();
    })();
    const sql = postgres(url, { max: 1, onnotice: () => {} });
    const declared = [...TENANT_OWNED_TABLES].filter((t) => !t.startsWith("scaffold_probe"));
    const rows = await sql<Array<{ relname: string; rls: boolean; forced: boolean }>>`
      select relname, relrowsecurity as rls, relforcerowsecurity as forced
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = any(${declared})
    `;
    await sql.end({ timeout: 5 });
    expect(rows.length).toBe(declared.length);
    expect(rows.filter((r) => !r.rls || !r.forced).map((r) => r.relname)).toEqual([]);
  });
});
