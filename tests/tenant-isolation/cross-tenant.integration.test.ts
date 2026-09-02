import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { TENANT_OWNED_TABLES, APPEND_ONLY_TABLES, closeAllConnections } from "@zerocorp/db";
import { readCatalog, seedTenants, setupTestDatabase, type TestUrls } from "./harness";
import { fixtures, type Fixture } from "./fixtures";

/**
 * Cross-tenant isolation, executed against a real PostgreSQL as a real application role.
 *
 * The release gate required by ARCHITECTURE.md and CLAUDE_CODE_RULES.md NN-3.
 *
 * It does NOT skip when the database is missing. The previous version did, and reported
 * the fact in a console warning — which meant the honest answer to "is tenant isolation
 * verified" was "only if someone read the log". A gate that can silently not run is not
 * a gate. Start the database with `docker compose up -d`.
 */

let urls: TestUrls;
let tenants: { a: string; b: string };
let table: Record<string, Fixture>;

/** Runs a block with the tenant pinned exactly the way withTenant() does in production. */
async function asTenant<T>(
  url: string,
  tenantId: string | null,
  accessMode: "read-write" | "read-only",
  fn: (sql: postgres.Sql) => Promise<T>,
): Promise<T> {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    return await sql.begin(async (tx) => {
      if (accessMode === "read-only") await tx.unsafe("set local transaction read only");
      await tx.unsafe(`select set_config('app.tenant_id', $1, true)`, [tenantId ?? ""]);
      return fn(tx as unknown as postgres.Sql);
    }) as T;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

let seq = 0;

async function insertRow(url: string, tenantId: string, name: string, f: Fixture): Promise<string> {
  const values = f.columns((seq += 1));
  const cols = ["tenant_id", ...Object.keys(values)];
  // postgres.js parameters are typed narrowly; a fixture value is deliberately `unknown`
  // because the point of the matrix is that it does not care what a column holds.
  const vals = [tenantId, ...Object.values(values)] as postgres.ParameterOrJSON<never>[];
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  return asTenant(url, tenantId, "read-write", async (tx) => {
    const rows = await tx.unsafe<Array<{ id: string }>>(
      `insert into ${name} (${cols.join(", ")}) values (${placeholders}) returning id`,
      vals,
    );
    const row = rows[0];
    if (!row) throw new Error(`insert into ${name} returned nothing`);
    return row.id;
  });
}

beforeAll(async () => {
  urls = await setupTestDatabase();
  tenants = await seedTenants(urls.admin);
  table = fixtures(await readCatalog(urls.admin));
}, 60_000);

afterAll(async () => {
  await closeAllConnections();
});

/* ── The gate itself ──────────────────────────────────────────────────────── */

describe("the isolation matrix covers everything", () => {
  it("has a fixture for every table declared through tenantTable()", () => {
    // Adding a tenant-owned table without an isolation case must fail the build. This
    // is the assertion that makes the rest of the file self-maintaining.
    const declared = [...TENANT_OWNED_TABLES].filter((t) => !t.startsWith("scaffold_probe")).sort();
    expect(Object.keys(table).sort()).toEqual(declared);
  });

  it("covers a meaningful number of tables, so an empty registry cannot pass", () => {
    expect(Object.keys(table).length).toBeGreaterThanOrEqual(15);
  });
});

/* ── Row Level Security, per table ────────────────────────────────────────── */

describe("every tenant-owned table is protected by PostgreSQL", () => {
  it("has RLS enabled AND forced AND a policy on every one", async () => {
    // FORCE matters as much as ENABLE: without it the table owner bypasses the policy,
    // and a migration or a job connecting as the owner would read every tenant.
    const sql = postgres(urls.admin, { max: 1, onnotice: () => {} });
    const rows = await sql<Array<{ relname: string; rls: boolean; forced: boolean; policies: number }>>`
      select c.relname, c.relrowsecurity as rls, c.relforcerowsecurity as forced,
             (select count(*)::int from pg_policies p where p.tablename = c.relname) as policies
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and c.relname = any(${Object.keys(table)})
    `;
    await sql.end({ timeout: 5 });

    expect(rows.length).toBe(Object.keys(table).length);
    const unprotected = rows.filter((r) => !r.rls || !r.forced || r.policies < 1);
    expect(unprotected.map((r) => r.relname)).toEqual([]);
  });
});

const TABLE_NAMES = Object.keys(fixtures({ entityTypeId: "" }));

describe.each(TABLE_NAMES)("%s — cross-tenant access", (name) => {
  it("lets each tenant see exactly its own row and nothing else", async () => {
    const f = table[name]!;
    const idA = await insertRow(urls.app, tenants.a, name, f);
    const idB = await insertRow(urls.app, tenants.b, name, f);

    const seenByA = await asTenant(urls.app, tenants.a, "read-write", (tx) =>
      tx.unsafe<Array<{ id: string; tenant_id: string }>>(`select id, tenant_id from ${name}`),
    );
    const seenByB = await asTenant(urls.app, tenants.b, "read-write", (tx) =>
      tx.unsafe<Array<{ id: string; tenant_id: string }>>(`select id, tenant_id from ${name}`),
    );

    expect(seenByA.map((r) => r.id)).toContain(idA);
    expect(seenByA.map((r) => r.id)).not.toContain(idB);
    expect(new Set(seenByA.map((r) => r.tenant_id))).toEqual(new Set([tenants.a]));

    expect(seenByB.map((r) => r.id)).toContain(idB);
    expect(seenByB.map((r) => r.id)).not.toContain(idA);
  });

  it("cannot read another tenant's row even by asking for it by id", async () => {
    const f = table[name]!;
    const idB = await insertRow(urls.app, tenants.b, name, f);
    const rows = await asTenant(urls.app, tenants.a, "read-write", (tx) =>
      tx.unsafe<Array<{ id: string }>>(`select id from ${name} where id = $1`, [idB]),
    );
    // A forgotten WHERE clause returns zero rows, not another tenant's rows.
    expect(rows).toEqual([]);
  });

  it("cannot delete across tenants", async () => {
    const f = table[name]!;
    const idB = await insertRow(urls.app, tenants.b, name, f);
    if ((APPEND_ONLY_TABLES as readonly string[]).includes(name)) return;

    const deleted = await asTenant(urls.app, tenants.a, "read-write", (tx) =>
      tx.unsafe<Array<{ id: string }>>(`delete from ${name} where id = $1 returning id`, [idB]),
    );
    expect(deleted).toEqual([]);

    // And it is still there, seen by its owner.
    const still = await asTenant(urls.app, tenants.b, "read-write", (tx) =>
      tx.unsafe<Array<{ id: string }>>(`select id from ${name} where id = $1`, [idB]),
    );
    expect(still.map((r) => r.id)).toEqual([idB]);
  });

  it("cannot update across tenants", async () => {
    const f = table[name]!;
    if ((APPEND_ONLY_TABLES as readonly string[]).includes(name)) return;
    const idB = await insertRow(urls.app, tenants.b, name, f);
    const updated = await asTenant(urls.app, tenants.a, "read-write", (tx) =>
      tx.unsafe<Array<{ id: string }>>(
        `update ${name} set updated_at = now() where id = $1 returning id`,
        [idB],
      ),
    );
    expect(updated).toEqual([]);
  });

  it("cannot insert a row belonging to another tenant", async () => {
    // WITH CHECK, not just USING. Reading is protected; so is writing.
    const values = table[name]!.columns((seq += 1));
    const cols = ["tenant_id", ...Object.keys(values)];
    const vals = [tenants.b, ...Object.values(values)] as postgres.ParameterOrJSON<never>[];
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    await expect(
      asTenant(urls.app, tenants.a, "read-write", (tx) =>
        tx.unsafe(`insert into ${name} (${cols.join(", ")}) values (${placeholders})`, vals),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("shows nothing at all to a transaction with no tenant context", async () => {
    // withSystem() clears app.tenant_id. This is what makes the global-table door safe:
    // it is not trusted to stay out of tenant tables, it is unable to enter them.
    await insertRow(urls.app, tenants.a, name, table[name]!);
    const rows = await asTenant(urls.app, null, "read-write", (tx) =>
      tx.unsafe<Array<{ id: string }>>(`select id from ${name}`),
    );
    expect(rows).toEqual([]);
  });
});

/* ── The read-only role ───────────────────────────────────────────────────── */

describe("apps/sites cannot write, structurally", () => {
  it("raises 25006 when a read-only transaction attempts a write", async () => {
    // SET LOCAL TRANSACTION READ ONLY. The first of two independent barriers.
    await expect(
      asTenant(urls.app, tenants.a, "read-only", (tx) =>
        tx.unsafe(`insert into business_profiles (tenant_id, business_name) values ($1, $2)`, [
          tenants.a,
          "Should not exist",
        ]),
      ),
    ).rejects.toMatchObject({ code: "25006" });
  });

  it("raises 42501 for the sites ROLE even in a read-write transaction", async () => {
    // The second barrier: the grant. A bug that dropped the read-only transaction flag
    // would still not give apps/sites a write.
    await expect(
      asTenant(urls.sites, tenants.a, "read-write", (tx) =>
        tx.unsafe(`insert into business_profiles (tenant_id, business_name) values ($1, $2)`, [
          tenants.a,
          "Should not exist",
        ]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("still reads its own tenant's rows", async () => {
    const id = await insertRow(urls.app, tenants.a, "business_profiles", table["business_profiles"]!);
    const rows = await asTenant(urls.sites, tenants.a, "read-only", (tx) =>
      tx.unsafe<Array<{ id: string }>>(`select id from business_profiles where id = $1`, [id]),
    );
    expect(rows.map((r) => r.id)).toEqual([id]);
  });

  it("cannot read another tenant's rows either", async () => {
    const idB = await insertRow(urls.app, tenants.b, "business_profiles", table["business_profiles"]!);
    const rows = await asTenant(urls.sites, tenants.a, "read-only", (tx) =>
      tx.unsafe<Array<{ id: string }>>(`select id from business_profiles where id = $1`, [idB]),
    );
    expect(rows).toEqual([]);
  });
});

/* ── Append-only ──────────────────────────────────────────────────────────── */

// describe.each([]) registers zero tests and reports a pass. The append-only guarantee is
// enforced by the database and verified only here, so an empty table would silently retire
// it. §32b.
describe("the append-only table list is populated", () => {
  it("has tables in it, or every check below registered nothing", () => {
    expect(APPEND_ONLY_TABLES.length).toBeGreaterThan(0);
    // Not everything can be append-only, or the general isolation checks at lines above
    // skip every table and also pass.
    expect(APPEND_ONLY_TABLES.length).toBeLessThan(TABLE_NAMES.length);
  });
});

describe.each(APPEND_ONLY_TABLES)("%s is append-only, enforced by the database", (name) => {
  it("refuses an UPDATE", async () => {
    // The credit balance is SUM(delta) and is never stored. That only holds if the
    // ledger cannot be edited, so the ledger is made uneditable in the migration
    // rather than in a code review.
    const id = await insertRow(urls.app, tenants.a, name, table[name]!);
    await expect(
      asTenant(urls.app, tenants.a, "read-write", (tx) =>
        tx.unsafe(`update ${name} set updated_at = now() where id = $1`, [id]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("refuses a DELETE", async () => {
    const id = await insertRow(urls.app, tenants.a, name, table[name]!);
    await expect(
      asTenant(urls.app, tenants.a, "read-write", (tx) =>
        tx.unsafe(`delete from ${name} where id = $1`, [id]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
});
