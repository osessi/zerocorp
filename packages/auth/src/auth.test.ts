import { describe, it, expect } from "vitest";
import { hashPassword, needsRehash, passwordProblem, verifyPassword } from "./password";
import { NoAccessError, atLeast, buildTenantContext, isExpired, shouldRefresh } from "./session";

const NOW = new Date("2026-09-01T12:00:00Z");
const USER = "11111111-1111-4111-8111-111111111111";
const TENANT_A = "22222222-2222-4222-8222-222222222222";
const TENANT_B = "33333333-3333-4333-8333-333333333333";

describe("passwords", () => {
  it("verifies what it hashed", async () => {
    const stored = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", stored)).toBe(true);
  });

  it("refuses a wrong password", async () => {
    const stored = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery stapl", stored)).toBe(false);
  });

  it("never produces the same hash twice for the same password", async () => {
    // A per-password salt. Without it, two people with the same password are visibly
    // the same person in a dump.
    const a = await hashPassword("correct horse battery staple");
    const b = await hashPassword("correct horse battery staple");
    expect(a).not.toBe(b);
  });

  it("normalises unicode, so an accent typed two ways is one password", async () => {
    const composed = "café-au-lait-2026";
    const decomposed = "café-au-lait-2026";
    const stored = await hashPassword(composed);
    expect(await verifyPassword(decomposed, stored)).toBe(true);
  });

  it("carries its own parameters, so raising the cost does not lock everyone out", async () => {
    const stored = await hashPassword("correct horse battery staple");
    expect(stored.startsWith("scrypt$65536$8$1$")).toBe(true);
    expect(needsRehash(stored)).toBe(false);
    expect(needsRehash("scrypt$16384$8$1$c2FsdA==$a2V5")).toBe(true);
  });

  it("returns false on a malformed stored hash instead of throwing", async () => {
    // A corrupted row is an operational problem. A 500 on the sign-in path tells an
    // attacker which accounts are broken.
    for (const bad of ["", "nonsense", "scrypt$x$8$1$a$b", "argon2$1$2$3$4$5"]) {
      expect(await verifyPassword("anything", bad)).toBe(false);
    }
  });

  it("asks for length rather than punctuation", async () => {
    // Composition rules push people toward "Password1!" and away from length, which is
    // the property that actually matters.
    expect(passwordProblem("Sh0rt!")).toContain("12 characters");
    expect(passwordProblem("all lowercase and long enough")).toBeNull();
  });
});

const SESSION = { userId: USER, email: "founder@example.com", activeTenantId: TENANT_A, expiresAt: new Date("2026-10-01T00:00:00Z"), lastSeenAt: NOW };
const MEMBERSHIPS = [{ tenantId: TENANT_A, role: "owner" as const, status: "active" }];

describe("tenant context", () => {
  it("builds from the session's active tenant and a live membership", () => {
    const ctx = buildTenantContext({ session: SESSION, memberships: MEMBERSHIPS, requestId: "r", accessMode: "read-write" });
    expect(ctx.tenantId).toBe(TENANT_A);
    expect(ctx.role).toBe("owner");
  });

  it("refuses a tenant the user is not a member of", () => {
    // NN-2. The requested id is checked against a membership read in this request, never
    // trusted because it arrived in a URL.
    expect(() =>
      buildTenantContext({
        session: SESSION, memberships: MEMBERSHIPS, requestId: "r", accessMode: "read-write",
        requestedTenantId: TENANT_B,
      }),
    ).toThrow(NoAccessError);
  });

  it("refuses a membership that is no longer active", () => {
    expect(() =>
      buildTenantContext({
        session: SESSION,
        memberships: [{ tenantId: TENANT_A, role: "owner", status: "revoked" }],
        requestId: "r", accessMode: "read-write",
      }),
    ).toThrow(NoAccessError);
  });

  it("says the same thing whether the tenant exists or not", () => {
    // "You do not have access to tenant X" confirms that tenant X exists.
    const error = (() => {
      try {
        buildTenantContext({ session: SESSION, memberships: [], requestId: "r", accessMode: "read-write" });
      } catch (e) {
        return e as Error;
      }
      return null;
    })();
    expect(error?.message).toBe("Not found");
  });

  it("takes the role from the membership, never from the session", () => {
    // A role baked into a cookie survives being revoked.
    const ctx = buildTenantContext({
      session: SESSION,
      memberships: [{ tenantId: TENANT_A, role: "viewer", status: "active" }],
      requestId: "r", accessMode: "read-write",
    });
    expect(ctx.role).toBe("viewer");
  });
});

describe("session lifetime", () => {
  it("expires", () => {
    expect(isExpired(SESSION, NOW)).toBe(false);
    expect(isExpired(SESSION, new Date("2026-11-01T00:00:00Z"))).toBe(true);
  });

  it("refreshes an active session rather than signing it out", () => {
    expect(shouldRefresh(SESSION, NOW)).toBe(false);
    expect(shouldRefresh(SESSION, new Date("2026-09-15T00:00:00Z"))).toBe(true);
  });
});

describe("roles are a ladder", () => {
  it("lets a higher role do a lower role's work", () => {
    expect(atLeast("owner", "viewer")).toBe(true);
    expect(atLeast("admin", "member")).toBe(true);
    expect(atLeast("member", "admin")).toBe(false);
    expect(atLeast("viewer", "member")).toBe(false);
  });

  it("refuses when there is no role at all", () => {
    expect(atLeast(undefined, "viewer")).toBe(false);
  });
});
