import { createUnitOfWork } from "@zerocorp/db";
import type { UnitOfWork } from "@zerocorp/application";

/**
 * Composition root for apps/sites — the ONLY file in this app allowed to import
 * @zerocorp/db. Enforced by .dependency-cruiser.cjs and by ESLint.
 *
 * This app composes a READ-ONLY unit of work. Combined with the read-only
 * PostgreSQL role in SITES_DATABASE_URL and SET LOCAL TRANSACTION READ ONLY in
 * withTenant(), a write from the public renderer fails at the database.
 */
let unitOfWork: UnitOfWork | undefined;

export function getUnitOfWork(): UnitOfWork {
  const url = process.env["SITES_DATABASE_URL"];
  if (!url) throw new Error("SITES_DATABASE_URL is required (read-only role)");
  unitOfWork ??= createUnitOfWork(url);
  return unitOfWork;
}
