import postgres from "postgres";
import { runMigrations } from "@zerocorp/db";

/**
 * Brings up a real PostgreSQL for the isolation suite.
 *
 * These tests connect as `zerocorp_app`, NOT as the superuser, and that is the whole
 * point. A superuser bypasses row level security entirely, so an isolation suite run as
 * one would pass against a database with no policies at all — the most reassuring green
 * build it is possible to have, and completely meaningless.
 *
 * `docker compose up -d` provides the server. See docker-compose.yml.
 */

const ADMIN_URL =
  process.env["ZEROCORP_TEST_ADMIN_URL"] ?? "postgresql://postgres:postgres@localhost:55432/postgres";
const TEST_DB = process.env["ZEROCORP_TEST_DB"] ?? "zerocorp_test";
const ROLE_PASSWORD = "isolation-test";

export interface TestUrls {
  readonly admin: string;
  /** Read-write role, subject to RLS. What apps/app and apps/worker use. */
  readonly app: string;
  /** SELECT-only role, subject to RLS. What apps/sites uses. */
  readonly sites: string;
}

function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

function withCredentials(url: string, user: string, password: string): string {
  const parsed = new URL(url);
  parsed.username = user;
  parsed.password = password;
  return parsed.toString();
}

export class TestDatabaseUnavailableError extends Error {
  override readonly name = "TestDatabaseUnavailableError";
  constructor(cause: unknown) {
    super(
      `Cross-tenant isolation could not run: no PostgreSQL at ${ADMIN_URL}.\n` +
        `  Start it with:  docker compose up -d\n` +
        `  This suite is a release gate (NN-3). It FAILS rather than skipping, because a\n` +
        `  gate that silently skips is not a gate.\n` +
        `  Cause: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }
}

/**
 * Creates a throwaway database, migrates it, and gives the two application roles a
 * login. The roles themselves are created by migration 0001 as NOLOGIN, because
 * granting a login is a deployment concern and does not belong in a migration.
 */
export async function setupTestDatabase(): Promise<TestUrls> {
  const admin = postgres(ADMIN_URL, { max: 1, onnotice: () => {} });
  try {
    await admin`select 1`;
  } catch (cause) {
    await admin.end({ timeout: 1 }).catch(() => {});
    throw new TestDatabaseUnavailableError(cause);
  }

  await admin.unsafe(`drop database if exists ${TEST_DB} with (force)`);
  await admin.unsafe(`create database ${TEST_DB}`);
  await admin.end({ timeout: 5 });

  const adminOnTest = withDatabase(ADMIN_URL, TEST_DB);
  await runMigrations(adminOnTest);

  const grants = postgres(adminOnTest, { max: 1, onnotice: () => {} });
  for (const role of ["zerocorp_app", "zerocorp_sites"]) {
    await grants.unsafe(`alter role ${role} with login password '${ROLE_PASSWORD}'`);
    await grants.unsafe(`grant connect on database ${TEST_DB} to ${role}`);
  }
  await grants.end({ timeout: 5 });

  return {
    admin: adminOnTest,
    app: withCredentials(adminOnTest, "zerocorp_app", ROLE_PASSWORD),
    sites: withCredentials(adminOnTest, "zerocorp_sites", ROLE_PASSWORD),
  };
}

/** Two tenants, created with admin rights because `tenants` is a global table. */
export async function seedTenants(adminUrl: string): Promise<{ a: string; b: string }> {
  const sql = postgres(adminUrl, { max: 1, onnotice: () => {} });
  const rows = await sql<Array<{ id: string }>>`
    insert into tenants (name, slug, plan) values
      ('Tenant A', 'tenant-a', 'launch'),
      ('Tenant B', 'tenant-b', 'launch')
    returning id
  `;
  await sql.end({ timeout: 5 });
  const [a, b] = rows;
  if (!a || !b) throw new Error("seedTenants: expected two tenants");
  return { a: a.id, b: b.id };
}

/** The catalog ids the fixtures need. Read once rather than hard-coded. */
export async function readCatalog(adminUrl: string): Promise<{ entityTypeId: string }> {
  const sql = postgres(adminUrl, { max: 1, onnotice: () => {} });
  const rows = await sql<Array<{ id: string }>>`
    select id from entity_types where code = 'us_llc' limit 1
  `;
  await sql.end({ timeout: 5 });
  const row = rows[0];
  if (!row) throw new Error("readCatalog: migration 0004 did not seed us_llc");
  return { entityTypeId: row.id };
}
