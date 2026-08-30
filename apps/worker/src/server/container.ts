import { createUnitOfWork } from "@zerocorp/db";
import type { UnitOfWork } from "@zerocorp/application";

/**
 * Composition root for apps/worker — the ONLY file in this app allowed to import
 * @zerocorp/db. Enforced by .dependency-cruiser.cjs and by ESLint.
 */
let unitOfWork: UnitOfWork | undefined;

export function getUnitOfWork(): UnitOfWork {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is required");
  unitOfWork ??= createUnitOfWork(url);
  return unitOfWork;
}
