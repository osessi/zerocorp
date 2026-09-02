import { sql } from "drizzle-orm";
import type { PaymentRiskSignal } from "@zerocorp/contracts";
import { createSystemUnitOfWork } from "../system";

/**
 * The payment event ledger.
 *
 * A webhook arrives before the tenant exists, so these reads and writes cannot go through
 * `withTenant`. They go through the SYSTEM door instead, which is the other legitimate
 * one — never a raw client.
 *
 * `payment_events` is UNIQUE on (tenant_id, provider, external_event_id). It was once
 * unique on (provider, external_event_id) with no tenant, which made it a cross-tenant
 * existence oracle; migration 0005 scoped it. The consequence here is that a duplicate
 * check by event id alone must look across tenants, which is exactly what the system door
 * exists for.
 */
export interface PaymentLedger {
  alreadyProcessed(provider: string, externalEventId: string): Promise<boolean>;
  record(input: {
    tenantId: string;
    provider: string;
    externalEventId: string;
    eventType: string;
    status: "processed" | "needs_review" | "failed";
    risk: PaymentRiskSignal;
  }): Promise<void>;
}

export function createPaymentLedger(databaseUrl: string): PaymentLedger {
  const suow = createSystemUnitOfWork(databaseUrl);

  return {
    async alreadyProcessed(provider, externalEventId) {
      const rows = (await suow.withSystem("stripe-webhook", (tx) =>
        tx.execute(sql`
          select 1 from payment_events
          where provider = ${provider} and external_event_id = ${externalEventId}
          limit 1`),
      )) as unknown as unknown[];
      return rows.length > 0;
    },

    async record(input) {
      await suow.withSystem("stripe-webhook", (tx) =>
        tx.execute(sql`
          insert into payment_events
            (tenant_id, provider, external_event_id, event_type, payload_hash, status, processed_at)
          values
            (${input.tenantId}, ${input.provider}, ${input.externalEventId}, ${input.eventType},
             ${describeRisk(input.risk)}, ${input.status}, now())
          on conflict do nothing`),
      );
    },
  };
}

/**
 * The risk signal, recorded as a readable digest.
 *
 * Three country codes are not sensitive on their own, but the column is called
 * `payload_hash`, and putting a payload in it because it happens to be short is how a
 * column ends up holding a card number six months later.
 */
function describeRisk(risk: PaymentRiskSignal): string {
  return `residency=${risk.declaredResidency ?? "-"} card=${risk.cardCountry ?? "-"} ip=${risk.ipCountry ?? "-"}`;
}
