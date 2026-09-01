import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * NOT part of the package's public surface — see package.json "exports", which
 * maps only ".". Importing this from outside @zerocorp/db fails module
 * resolution, and dependency-cruiser reports it as a boundary violation.
 *
 * Keyed by URL, not a single global.
 *
 * The previous version was `client ??= drizzle(...)`, which returns the FIRST
 * connection to every later caller regardless of the URL they passed. In production
 * that is invisible, because each app is its own process with one URL. It is not
 * invisible in a worker holding both roles, or in the isolation suite, which
 * connects as the read-write role, the read-only role and the migrator at once —
 * and would have silently tested one role three times.
 */
type Client = ReturnType<typeof drizzle>;

const clients = new Map<string, Client>();

export function getClient(databaseUrl: string): Client {
  let client = clients.get(databaseUrl);
  if (!client) {
    client = drizzle(
      postgres(databaseUrl, {
        max: 10,
        // PostgreSQL NOTICEs are informational, and migrations emit one per
        // `drop ... if exists`. Left on the default handler they bury the actual
        // output of a migration run under a hundred lines of "does not exist,
        // skipping". Real problems arrive as exceptions, not notices.
        onnotice: () => {},
      }),
    );
    clients.set(databaseUrl, client);
  }
  return client;
}

/** Test seam: lets the isolation suite assert on emitted statements without a server. */
export function __setClientForTesting(fake: Client | undefined, databaseUrl = "postgres://fake"): void {
  if (fake === undefined) clients.delete(databaseUrl);
  else clients.set(databaseUrl, fake);
}

/** Closes every pool. Used by integration suites so vitest can exit. */
export async function __closeAllClients(): Promise<void> {
  const open = [...clients.values()];
  clients.clear();
  await Promise.all(
    open.map(async (c) => {
      const session = (c as unknown as { $client?: { end?: () => Promise<void> } }).$client;
      await session?.end?.();
    }),
  );
}
