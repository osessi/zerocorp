import { eq } from "drizzle-orm";
import type {
  EligibilityRule,
  EntityType,
  Jurisdiction,
  ProviderCapabilities,
} from "@zerocorp/contracts";
import {
  eligibilityRuleSchema,
  entityTypeSchema,
  jurisdictionSchema,
  providerCapabilitiesSchema,
} from "@zerocorp/contracts";
import type { FormationCatalog } from "@zerocorp/application";
import { withSystem } from "../system";
import { entityTypes, jurisdictions, eligibilityRules, formationProviders, formationProviderCoverage } from "../schema/formation";

/**
 * The catalog, read from PostgreSQL.
 *
 * Global reference data, so it goes through withSystem() rather than withTenant():
 * every tenant sees the same catalog. withSystem clears app.tenant_id, so this
 * connection can also see nothing in any tenant-owned table — the door is safe by
 * construction rather than by discipline.
 *
 * Every row is parsed through its contract schema on the way out. A catalog row is
 * data an operator can edit, and data an operator can edit is data that can be wrong;
 * parsing here means a malformed row fails at the boundary instead of halfway through
 * a recommendation.
 */
export function createFormationCatalog(databaseUrl: string): FormationCatalog {
  const read = <T>(fn: Parameters<typeof withSystem<T>>[2]) => withSystem(databaseUrl, "catalog", fn);

  function toEntityType(row: typeof entityTypes.$inferSelect): EntityType {
    return entityTypeSchema.parse({
      code: row.code,
      jurisdictionCode: row.jurisdictionCode,
      name: row.name,
      customerLabel: row.customerLabel,
      liabilityModel: row.liabilityModel,
      taxTreatment: row.taxTreatment,
      automationLevel: row.automationLevel,
      // Null means unverified, which is not the same as free.
      governmentFee:
        row.governmentFeeMinor === null || row.governmentFeeCurrency === null
          ? null
          : { amountMinor: row.governmentFeeMinor, currency: row.governmentFeeCurrency },
      typicalDaysMin: row.typicalDaysMin,
      typicalDaysMax: row.typicalDaysMax,
      requiredRegistrations: row.requiredRegistrations,
      notes: row.notes,
    });
  }

  return {
    async listJurisdictions(): Promise<readonly Jurisdiction[]> {
      const rows = await read((tx) => tx.select().from(jurisdictions));
      return rows.map((r) =>
        jurisdictionSchema.parse({
          code: r.code,
          countryCode: r.countryCode,
          subdivisionCode: r.subdivisionCode,
          name: r.name,
          status: r.status,
        }),
      );
    },

    async listEntityTypes(jurisdictionCode?: string): Promise<readonly EntityType[]> {
      const rows = await read((tx) =>
        jurisdictionCode === undefined
          ? tx.select().from(entityTypes)
          : tx.select().from(entityTypes).where(eq(entityTypes.jurisdictionCode, jurisdictionCode)),
      );
      return rows.map(toEntityType);
    },

    async getEntityType(code: string, jurisdictionCode: string): Promise<EntityType | null> {
      const rows = await read((tx) =>
        tx
          .select()
          .from(entityTypes)
          .where(eq(entityTypes.code, code))
          .then((all) => all.filter((r) => r.jurisdictionCode === jurisdictionCode)),
      );
      const row = rows[0];
      return row ? toEntityType(row) : null;
    },

    async listEligibilityRules(entityTypeCode: string): Promise<readonly EligibilityRule[]> {
      const rows = await read((tx) =>
        tx
          .select({ rule: eligibilityRules, entity: entityTypes })
          .from(eligibilityRules)
          .innerJoin(entityTypes, eq(eligibilityRules.entityTypeId, entityTypes.id))
          .where(eq(entityTypes.code, entityTypeCode)),
      );
      return rows.map(({ rule, entity }) =>
        eligibilityRuleSchema.parse({
          code: rule.code,
          entityTypeCode: entity.code,
          predicate: rule.predicate,
          effect: rule.effect,
          messageKey: rule.messageKey,
          ...(rule.requires === null ? {} : { requires: rule.requires }),
        }),
      );
    },

    async listProviderCapabilities(): Promise<readonly ProviderCapabilities[]> {
      const [providers, coverage] = await read(async (tx) => [
        await tx.select().from(formationProviders),
        await tx
          .select({ c: formationProviderCoverage, entityCode: entityTypes.code })
          .from(formationProviderCoverage)
          .innerJoin(entityTypes, eq(formationProviderCoverage.entityTypeId, entityTypes.id)),
      ]);

      return providers.map((p) =>
        providerCapabilitiesSchema.parse({
          code: p.code,
          name: p.name,
          status: p.status,
          features: p.features,
          reliabilityScore: Number(p.reliabilityScore),
          coverage: coverage
            .filter(({ c }) => c.providerCode === p.code)
            .map(({ c, entityCode }) => ({
              entityTypeCode: entityCode,
              automationLevel: c.automationLevel,
              supportsNonResident: c.supportsNonResident,
              wholesaleFee:
                c.wholesaleFeeMinor === null || c.wholesaleFeeCurrency === null
                  ? null
                  : { amountMinor: c.wholesaleFeeMinor, currency: c.wholesaleFeeCurrency },
              typicalDaysMin: c.typicalDaysMin,
              typicalDaysMax: c.typicalDaysMax,
              verified: c.verified,
              verifiedAt: c.verifiedAt,
              verificationNote: c.verificationNote,
            })),
        }),
      );
    },
  };
}
