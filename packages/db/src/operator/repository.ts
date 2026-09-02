import { sql } from "drizzle-orm";
import { createSystemUnitOfWork } from "../system";

/**
 * The operator console's data access.
 *
 * This is the ONE place in the product that reads across tenants, and every call goes
 * through the system door with an explicit reason. It is not a convenience: the formation
 * queue is inherently cross-tenant, because a ZeroCorp operator files for everybody.
 *
 * Two things keep that honest:
 *
 *   1. `isOperator` checks `platform_operators`, never a tenant role. A customer's
 *      "admin" is an admin of THEIR business, and conflating the two would grant them
 *      visibility into other customers.
 *   2. Every transition writes `operator_actions`, which has UPDATE and DELETE revoked.
 *      Acting on a founder's filing is exactly the access that must leave a trail.
 */
export interface QueueRow {
  orderId: string;
  tenantId: string;
  businessName: string | null;
  legalNames: string[];
  jurisdictionCode: string;
  status: string;
  providerCode: string;
  openRfis: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatorRepository {
  isOperator(userId: string): Promise<boolean>;
  queue(): Promise<QueueRow[]>;
  transition(input: { operatorId: string; tenantId: string; orderId: string; to: string; note?: string }): Promise<void>;
  recentActions(limit?: number): Promise<{ at: Date; action: string; detail: string | null; tenantId: string }[]>;
}

export function createOperatorRepository(databaseUrl: string): OperatorRepository {
  const suow = createSystemUnitOfWork(databaseUrl);

  return {
    async isOperator(userId) {
      const rows = (await suow.withSystem("operator-auth", (tx) =>
        tx.execute(sql`
          select 1 from platform_operators
          where user_id = ${userId} and revoked_at is null limit 1`),
      )) as unknown as unknown[];
      return rows.length > 0;
    },

    async queue() {
      // Oldest first. A filing that has waited nine days is more urgent than one from
      // this morning, and a queue sorted newest-first is one where the oldest is never
      // reached.
      const rows = (await suow.withSystem("operator-queue", (tx) =>
        tx.execute(sql`
          select o.id as order_id, o.tenant_id, bp.business_name,
                 r.proposed_names as legal_names, r.jurisdiction_code,
                 o.status, o.provider_code, o.created_at, o.updated_at,
                 (select count(*) from formation_rfis f
                   where f.order_id = o.id and f.status = 'open') as open_rfis
          from formation_orders o
          join formation_requests r on r.id = o.request_id
          left join business_profiles bp on bp.tenant_id = o.tenant_id
          where o.status not in ('formed', 'cancelled')
          order by o.created_at asc limit 200`),
      )) as unknown as Record<string, unknown>[];

      return rows.map((r) => ({
        orderId: String(r["order_id"]),
        tenantId: String(r["tenant_id"]),
        businessName: (r["business_name"] as string | null) ?? null,
        legalNames: (r["legal_names"] as string[] | null) ?? [],
        jurisdictionCode: String(r["jurisdiction_code"]),
        status: String(r["status"]),
        providerCode: String(r["provider_code"]),
        openRfis: Number(r["open_rfis"] ?? 0),
        createdAt: new Date(String(r["created_at"])),
        updatedAt: new Date(String(r["updated_at"])),
      }));
    },

    async transition(input) {
      await suow.withSystem("operator-transition", async (tx) => {
        // The status column has a CHECK constraint listing the eleven legal states, so an
        // invalid target is rejected by the DATABASE rather than by trusting this code.
        await tx.execute(sql`
          update formation_orders
          set status = ${input.to}, updated_at = now(),
              submitted_at = case when ${input.to} = 'awaiting_provider' then now() else submitted_at end,
              completed_at = case when ${input.to} in ('formed','rejected','cancelled') then now() else completed_at end
          where id = ${input.orderId} and tenant_id = ${input.tenantId}`);

        // The CUSTOMER's timeline. source='operator' is the honesty field: a founder sees
        // that a person moved this, not a machine.
        await tx.execute(sql`
          insert into formation_events (tenant_id, order_id, source, kind, payload)
          values (${input.tenantId}, ${input.orderId}, 'operator', ${"status." + input.to},
                  ${JSON.stringify({ note: input.note ?? null })}::jsonb)`);

        // The INTERNAL trail. Separate on purpose: one is a product surface, the other an
        // audit record, and merging them means leaking internal notes or losing the audit.
        await tx.execute(sql`
          insert into operator_actions (operator_id, tenant_id, action, subject_id, detail)
          values (${input.operatorId}, ${input.tenantId}, ${"formation.transition." + input.to},
                  ${input.orderId}, ${input.note ?? null})`);
      });
    },

    async recentActions(limit = 30) {
      const rows = (await suow.withSystem("operator-audit", (tx) =>
        tx.execute(sql`
          select created_at, action, detail, tenant_id
          from operator_actions order by created_at desc limit ${limit}`),
      )) as unknown as Record<string, unknown>[];
      return rows.map((r) => ({
        at: new Date(String(r["created_at"])),
        action: String(r["action"]),
        detail: (r["detail"] as string | null) ?? null,
        tenantId: String(r["tenant_id"]),
      }));
    },
  };
}
