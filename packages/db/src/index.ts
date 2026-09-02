/**
 * @zerocorp/db — Layer 3
 *
 * THE tenant choke point. This package's "exports" field maps only ".", so
 * `@zerocorp/db/internal/client` is not resolvable from anywhere else in the
 * repository. The raw Drizzle client physically cannot leave this package.
 *
 * Everything tenant-owned goes through withTenant(). Global tables — the ones that
 * DEFINE tenancy, and the pre-payment funnel that exists before a tenant does — go
 * through withSystem(), which clears the tenant setting and therefore sees zero
 * rows in every tenant-owned table. There is no third door.
 */
export { withTenant, createUnitOfWork } from "./tenant";
export { withSystem, createSystemUnitOfWork } from "./system";
export { runMigrations, listMigrationFiles, MigrationChecksumError } from "./migrate";
export type { AppliedMigration } from "./migrate";
export * from "./schema";
export { createFormationCatalog } from "./formation/catalog";
export { createAssessmentRepository } from "./assessment/repository";
export { createIdentityRepository, createConversionRepository } from "./identity/repository";
export { createDashboardRepository } from "./dashboard/repository";
export { createBlocksRepository, createSettingsRepository } from "./blocks/repository";
export { createBlocksWriteRepository } from "./blocks/write";
export type { Tx } from "./types";

/** Integration suites only. See lifecycle.ts for why it is not re-exported directly. */
export { closeAllConnections } from "./lifecycle";
export { seedPopulatedTenant, findTenantIdForUser } from "./seed/populated";
export { createOnboardingRepository } from "./onboarding/repository";
export { createFormationRepository } from "./formation/repository";
export { createPaymentLedger, type PaymentLedger } from "./billing/ledger";
export { createOperatorRepository, type OperatorRepository, type QueueRow } from "./operator/repository";
