import { createUnitOfWork } from "@zerocorp/db";
import type { UnitOfWork } from "@zerocorp/application";

/**
 * Composition root for apps/app — the ONLY file in this app allowed to import
 * @zerocorp/db. Enforced by .dependency-cruiser.cjs and by ESLint.
 *
 * Read-write, because this app owns the back-office and the admin console.
 */
let unitOfWork: UnitOfWork | undefined;

export function getUnitOfWork(): UnitOfWork {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is required");
  unitOfWork ??= createUnitOfWork(url);
  return unitOfWork;
}
