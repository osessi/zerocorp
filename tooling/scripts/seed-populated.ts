/**
 * Fills the demo tenant with the data a working business actually has.
 *
 *   ZEROCORP_SEED_POPULATED=1 pnpm seed:populated
 *
 * Why this exists: every product screen was designed against four stacked empty states.
 * A product with no data cannot look like a product with data, and no token fixes that.
 * Empty states get designed deliberately, as their own case — not as the state the
 * product happens to launch in.
 *
 * Deliberately NOT `_prototype/data`. That file is fixtures nothing but the prototype
 * reads. This writes real rows, through `withTenant`, into the real tables, so what a
 * screen renders here is what it renders for a customer.
 *
 * Two independent locks, because a seed that can reach production eventually does:
 *   1. ZEROCORP_SEED_POPULATED must be set
 *   2. DATABASE_URL must be localhost, and NODE_ENV must not be production
 */
import {
  closeAllConnections,
  createIdentityRepository,
  createSystemUnitOfWork,
  findTenantIdForUser,
  seedPopulatedTenant,
} from "@zerocorp/db";

const DEMO_EMAIL = "founder@zerocorp.test";
const url = process.env["DATABASE_URL"] ?? "postgresql://postgres:postgres@localhost:55432/zerocorp";

if (process.env["ZEROCORP_SEED_POPULATED"] !== "1") {
  console.error("Refusing to run. Set ZEROCORP_SEED_POPULATED=1 to confirm this is a development database.");
  process.exit(1);
}
if (process.env["NODE_ENV"] === "production" || !/localhost|127\.0\.0\.1/.test(url)) {
  console.error("seed:populated refuses to run against anything that is not local.");
  process.exit(1);
}

const suow = createSystemUnitOfWork(url);
const identity = createIdentityRepository();

const user = await suow.withSystem("seed", (tx) => identity.findUserByEmail(tx, DEMO_EMAIL));
if (!user) {
  console.error("No demo customer. Run `pnpm seed:demo` first.");
  process.exit(1);
}

const tenantId = await suow.withSystem("seed", (tx) => findTenantIdForUser(tx, user.id));
if (!tenantId) {
  console.error("The demo user has no membership.");
  process.exit(1);
}

await seedPopulatedTenant(url, tenantId);

console.log(`
  Demo tenant populated.

    15 leads in 1 list
    20 articles across published, scheduled and draft
    10 keywords being targeted
    1 email domain warming, 2 mailboxes
    9 activity entries across 3 days

  Sign in at  http://localhost:3000/signin  ·  ${DEMO_EMAIL}
`);

await closeAllConnections();
process.exit(0);
