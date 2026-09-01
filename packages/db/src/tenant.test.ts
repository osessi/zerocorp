import { describe, it, expect, beforeEach } from "vitest";
import type { TenantContext } from "@zerocorp/contracts";
import { withTenant } from "./tenant";
import { __setClientForTesting } from "./internal/client";

/** Walks any object graph and collects every string, without depending on Drizzle internals. */
function collectStrings(value: unknown, out: string[] = [], depth = 0): string[] {
  if (depth > 8 || value == null) return out;
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, out, depth + 1);
  else if (typeof value === "object") for (const v of Object.values(value)) collectStrings(v, out, depth + 1);
  return out;
}

interface Recorded { transactions: number; statements: unknown[] }

function fakeClient(): { recorded: Recorded; client: unknown } {
  const recorded: Recorded = { transactions: 0, statements: [] };
  const tx = { execute: async (q: unknown) => { recorded.statements.push(q); } };
  const client = {
    transaction: async (fn: (t: typeof tx) => Promise<unknown>) => {
      recorded.transactions += 1;
      return fn(tx);
    },
  };
  return { recorded, client };
}

const TENANT_A = "11111111-1111-4111-8111-111111111111";

function ctx(accessMode: TenantContext["accessMode"]): TenantContext {
  return {
    tenantId: TENANT_A as TenantContext["tenantId"],
    requestId: "req-test" as TenantContext["requestId"],
    accessMode,
  };
}

describe("withTenant — the tenant choke point", () => {
  beforeEach(() => __setClientForTesting(undefined));

  it("always runs inside a transaction", async () => {
    const { recorded, client } = fakeClient();
    __setClientForTesting(client as never);
    await withTenant("postgres://fake", ctx("read-write"), async () => "ok");
    expect(recorded.transactions).toBe(1);
  });

  it("pins the tenant id for Row Level Security", async () => {
    const { recorded, client } = fakeClient();
    __setClientForTesting(client as never);
    await withTenant("postgres://fake", ctx("read-write"), async () => "ok");
    const emitted = collectStrings(recorded.statements);
    expect(emitted.some((s) => s.includes("app.tenant_id"))).toBe(true);
    expect(emitted).toContain(TENANT_A);
  });

  it("marks the transaction READ ONLY when the context is read-only", async () => {
    const { recorded, client } = fakeClient();
    __setClientForTesting(client as never);
    await withTenant("postgres://fake", ctx("read-only"), async () => "ok");
    const emitted = collectStrings(recorded.statements).join(" ").toLowerCase();
    expect(emitted).toContain("transaction read only");
  });

  it("does NOT mark the transaction read only for a read-write context", async () => {
    const { recorded, client } = fakeClient();
    __setClientForTesting(client as never);
    await withTenant("postgres://fake", ctx("read-write"), async () => "ok");
    const emitted = collectStrings(recorded.statements).join(" ").toLowerCase();
    expect(emitted).not.toContain("transaction read only");
  });

  it("returns the callback result and gives it the transaction", async () => {
    const { client } = fakeClient();
    __setClientForTesting(client as never);
    const result = await withTenant("postgres://fake", ctx("read-write"), async (tx) => {
      expect(tx).toBeDefined();
      return 42;
    });
    expect(result).toBe(42);
  });
});
