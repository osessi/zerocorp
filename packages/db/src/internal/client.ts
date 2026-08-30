import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * NOT part of the package's public surface — see package.json "exports", which
 * maps only ".". Importing this from outside @zerocorp/db fails module
 * resolution, and dependency-cruiser reports it as a boundary violation.
 */
let client: ReturnType<typeof drizzle> | undefined;

export function getClient(databaseUrl: string): ReturnType<typeof drizzle> {
  client ??= drizzle(postgres(databaseUrl, { max: 10 }));
  return client;
}

/** Test seam: lets the isolation suite assert on emitted statements without a server. */
export function __setClientForTesting(fake: ReturnType<typeof drizzle> | undefined): void {
  client = fake;
}
