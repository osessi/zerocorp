/**
 * Mints a session cookie for the demo founder, so a screen can be fetched and read.
 *
 *   pnpm vite-node tooling/scripts/dev-session.ts
 *
 * Development only. It refuses anything that is not a local database.
 */
import { closeAllConnections, createIdentityRepository, createSystemUnitOfWork } from "@zerocorp/db";
import { generateToken } from "@zerocorp/security";

const url = process.env["DATABASE_URL"] ?? "";
if (!/localhost|127\.0\.0\.1/.test(url)) throw new Error("dev-session refuses a non-local database");

const identity = createIdentityRepository();
const uow = createSystemUnitOfWork();
const { token, hash } = generateToken();

await uow.withSystem("dev-session", async (tx) => {
  const user = await identity.findUserByEmail(tx, "founder@zerocorp.test");
  if (!user) throw new Error("no demo founder; run pnpm seed:populated");
  const memberships = await identity.listMemberships(tx, user.id);
  const active = memberships.find((m) => m.status === "active")?.tenantId ?? null;
  await identity.createSession(tx, {
    userId: user.id,
    tokenHash: hash,
    activeTenantId: active,
    expiresAt: new Date(Date.now() + 3_600_000),
  });
});

console.log(token);
await closeAllConnections();
