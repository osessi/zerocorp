/**
 * Migration CLI.
 *
 *   pnpm db:migrate          apply pending migrations to DATABASE_URL
 *   pnpm db:migrate <url>    apply them somewhere else
 *
 * Deliberately tiny. A migration tool that does more than "apply the files in
 * order and record what it applied" is a tool that can surprise you at 2am.
 */
import { runMigrations } from "../src/migrate";

const url = process.argv[2] ?? process.env["DATABASE_URL"];
if (!url) {
  console.error("usage: db:migrate [DATABASE_URL]");
  process.exit(1);
}

const applied = await runMigrations(url);
if (applied.length === 0) console.log("[db] nothing to apply, schema is current");
for (const m of applied) console.log(`[db] applied ${m.name}`);
process.exit(0);
