import { and, desc, eq } from "drizzle-orm";
import type { TenantContext } from "@zerocorp/contracts";
import type { ActivityRow, BusinessOverview, DashboardRepository, PlanStepRow } from "@zerocorp/application";
import { activityEvents, businessPlanSteps, businessPlans, businessProfiles } from "../schema/tenant";
import { companies } from "../schema/formation";
import type { Tx } from "../types";

/**
 * The Command Center's reads.
 *
 * Every query runs inside withTenant, so RLS is the floor rather than the ceiling: a
 * forgotten WHERE returns zero rows instead of someone else's business. The explicit
 * tenant filters are still written, because the application never relies on RLS as its
 * only barrier — it is the second one.
 */
export function createDashboardRepository(): DashboardRepository<Tx> {
  return {
    async overview(tx, ctx: TenantContext): Promise<BusinessOverview | null> {
      const [profile] = await tx
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.tenantId, ctx.tenantId))
        .orderBy(desc(businessProfiles.createdAt))
        .limit(1);
      if (!profile) return null;

      const [plan] = await tx
        .select()
        .from(businessPlans)
        .where(eq(businessPlans.tenantId, ctx.tenantId))
        .orderBy(desc(businessPlans.createdAt))
        .limit(1);

      const steps: PlanStepRow[] = plan
        ? (
            await tx
              .select()
              .from(businessPlanSteps)
              .where(and(eq(businessPlanSteps.tenantId, ctx.tenantId), eq(businessPlanSteps.planId, plan.id)))
              .orderBy(businessPlanSteps.position)
          ).map((s) => ({
            id: s.id,
            stepKey: s.stepKey,
            position: s.position,
            title: s.title,
            outcome: s.outcome,
            rationale: s.rationale,
            phase: s.phase,
            category: s.category,
            priority: s.priority,
            included: s.included,
            status: s.status,
          }))
        : [];

      const activity: ActivityRow[] = (
        await tx
          .select()
          .from(activityEvents)
          .where(eq(activityEvents.tenantId, ctx.tenantId))
          .orderBy(desc(activityEvents.createdAt))
          .limit(20)
      ).map((a) => ({
        id: a.id,
        eventType: a.eventType,
        actorType: a.actorType,
        payload: a.payload as Record<string, unknown>,
        createdAt: a.createdAt,
      }));

      const [company] = await tx
        .select({ legalName: companies.legalName, status: companies.status })
        .from(companies)
        .where(eq(companies.tenantId, ctx.tenantId))
        .limit(1);

      return {
        businessName: profile.businessName,
        description: profile.description,
        status: profile.status,
        planTitle: plan?.title ?? null,
        planSummary: plan?.summary ?? null,
        setupPath: plan?.setupPath ?? null,
        subscriptionPlan: plan?.subscriptionPlan ?? null,
        steps,
        activity,
        companyStatus: company?.status ?? null,
        companyName: company?.legalName ?? null,
      };
    },

    async setStepStatus(tx, ctx: TenantContext, stepId, status) {
      await tx
        .update(businessPlanSteps)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(businessPlanSteps.tenantId, ctx.tenantId), eq(businessPlanSteps.id, stepId)));
    },
  };
}
