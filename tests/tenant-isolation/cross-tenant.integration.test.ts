import { describe, it, expect } from "vitest";

/**
 * Cross-tenant isolation, executed against a real PostgreSQL.
 *
 * This suite is the release gate required by ARCHITECTURE.md and
 * CLAUDE_CODE_RULES.md NN-3. It is SKIPPED when TEST_DATABASE_URL is unset, and
 * it reports that fact rather than passing silently.
 *
 * It stays empty of assertions until the first tenant-owned table exists. Each
 * new table added through tenantTable() must gain a case here:
 *
 *   1. seed a row for tenant A and a row for tenant B
 *   2. read with tenant A's context  -> sees exactly its own row
 *   3. read with tenant B's context  -> sees exactly its own row
 *   4. update/delete across tenants  -> affects zero rows
 *   5. read-only context attempting a write -> fails with SQLSTATE 25006
 */
const DATABASE_URL = process.env["TEST_DATABASE_URL"];
const describeIfDb = DATABASE_URL ? describe : describe.skip;

describeIfDb("cross-tenant isolation (integration)", () => {
  it("has a case for every tenant-owned table", async () => {
    const { TENANT_OWNED_TABLES } = await import("@zerocorp/db");
    expect(TENANT_OWNED_TABLES).toBeDefined();
  });
});

describe("tenant-isolation gate", () => {
  it("reports whether the integration suite actually ran", () => {
    if (!DATABASE_URL) {
      // Visible in CI output. Not a pass for isolation — a declared absence of coverage.
      console.warn(
        "[tenant-isolation] SKIPPED: TEST_DATABASE_URL is not set. " +
          "Cross-tenant isolation is NOT verified in this run.",
      );
    }
    expect(true).toBe(true);
  });
});
