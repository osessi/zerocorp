import { describe, it, expect } from "vitest";
import { tenantTable, TENANT_OWNED_TABLES } from "./tenant-table";
import { text } from "drizzle-orm/pg-core";

describe("tenantTable — tenant_id is not optional", () => {
  it("adds tenant_id to every tenant-owned table", () => {
    const table = tenantTable("scaffold_probe", { label: text("label") });
    expect(Object.keys(table)).toContain("tenantId");
  });

  it("adds id and audit timestamps", () => {
    const table = tenantTable("scaffold_probe_2", {});
    const columns = Object.keys(table);
    expect(columns).toEqual(expect.arrayContaining(["id", "tenantId", "createdAt", "updatedAt"]));
  });

  it("registers the table so the isolation suite can enumerate it", () => {
    tenantTable("scaffold_probe_3", {});
    expect(TENANT_OWNED_TABLES.has("scaffold_probe_3")).toBe(true);
  });
});
