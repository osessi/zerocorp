import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { getClient } from "./internal/client";

/**
 * Migration runner.
 *
 * Ordered, reproducible, and recorded — DATABASE.md §23. Each file runs inside its
 * own transaction, so a failure leaves the database at the last complete migration
 * rather than halfway through one.
 *
 * The checksum is stored so an ALREADY APPLIED file that later changes is an error
 * rather than a silent divergence between what the database has and what the
 * repository says it has. That divergence is the one migration bug you cannot debug
 * from the code.
 */

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

export interface AppliedMigration {
  readonly name: string;
  readonly checksum: string;
}

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function listMigrationFiles(dir: string = MIGRATIONS_DIR): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort(); // 0001_, 0002_ — lexicographic order is the intended order.
}

export class MigrationChecksumError extends Error {
  override readonly name = "MigrationChecksumError";
  constructor(migration: string) {
    super(
      `Migration "${migration}" was already applied but its file has changed. ` +
        `Edit a migration only before it has run anywhere. Add a new one instead.`,
    );
  }
}

export async function runMigrations(
  databaseUrl: string,
  dir: string = MIGRATIONS_DIR,
): Promise<AppliedMigration[]> {
  const db = getClient(databaseUrl);

  await db.execute(sql`
    create table if not exists schema_migrations (
      name       text primary key,
      checksum   text not null,
      applied_at timestamptz not null default now()
    )
  `);

  const existing = await db.execute<{ name: string; checksum: string }>(
    sql`select name, checksum from schema_migrations`,
  );
  const applied = new Map<string, string>();
  for (const row of existing as unknown as Array<{ name: string; checksum: string }>) {
    applied.set(row.name, row.checksum);
  }

  const ran: AppliedMigration[] = [];
  for (const name of listMigrationFiles(dir)) {
    const body = readFileSync(join(dir, name), "utf8");
    const checksum = await sha256(body);
    const previous = applied.get(name);

    if (previous !== undefined) {
      if (previous !== checksum) throw new MigrationChecksumError(name);
      continue;
    }

    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(body));
      await tx.execute(
        sql`insert into schema_migrations (name, checksum) values (${name}, ${checksum})`,
      );
    });
    ran.push({ name, checksum });
  }
  return ran;
}
