import { and, desc, eq } from "drizzle-orm";
import type { TenantContext } from "@zerocorp/contracts";
import type { ActivityRow, BusinessOverview, DashboardRepository, PlanStepRow } from "@zerocorp/application";
import { sql } from "drizzle-orm";
import { activityEvents, businessPlanSteps, businessPlans, businessProfiles } from "../schema/tenant";
import { companies, formationOrders, formationRfis } from "../schema/formation";
import { brandIdentities, emailDomains, sites } from "../schema/blocks";
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

      /**
       * The tenant's state, in one round trip.
       *
       * Counts by status rather than rows: the dashboard shows "12 published, 3
       * scheduled", never the articles themselves — Content owns those. Eight counts in
       * one query beats eight queries, and a Command Center that fans out to eight round
       * trips is a Command Center nobody keeps open.
       */
      const [counts] = (await tx.execute(sql`
        select
          (select count(*) from posts where tenant_id = ${ctx.tenantId} and status = 'published') as posts_published,
          (select count(*) from posts where tenant_id = ${ctx.tenantId} and status = 'scheduled') as posts_scheduled,
          (select count(*) from posts where tenant_id = ${ctx.tenantId} and status = 'draft')     as posts_draft,
          (select count(*) from leads where tenant_id = ${ctx.tenantId})                          as leads_total,
          (select count(*) from leads where tenant_id = ${ctx.tenantId} and status = 'replied')   as leads_replied,
          (select count(*) from leads where tenant_id = ${ctx.tenantId} and status = 'qualified') as leads_qualified,
          (select count(*) from content_keywords where tenant_id = ${ctx.tenantId})               as keywords,
          (select count(*) from mailboxes where tenant_id = ${ctx.tenantId})                      as mailboxes,
          (select count(*) from pages where tenant_id = ${ctx.tenantId})                          as pages,
          (select count(*) from pages where tenant_id = ${ctx.tenantId} and status = 'published') as pages_published
      `)) as unknown as Record<string, unknown>[];

      const [emailDomain] = await tx
        .select({ day: emailDomains.warmupDay, status: emailDomains.warmupStatus })
        .from(emailDomains)
        .where(eq(emailDomains.tenantId, ctx.tenantId))
        .limit(1);

      const [site] = await tx
        .select({ status: sites.status })
        .from(sites)
        .where(eq(sites.tenantId, ctx.tenantId))
        .limit(1);

      const [brand] = await tx
        .select()
        .from(brandIdentities)
        .where(eq(brandIdentities.tenantId, ctx.tenantId))
        .orderBy(desc(brandIdentities.createdAt))
        .limit(1);

      const [order] = await tx
        .select({ status: formationOrders.status, id: formationOrders.id })
        .from(formationOrders)
        .where(eq(formationOrders.tenantId, ctx.tenantId))
        .orderBy(desc(formationOrders.createdAt))
        .limit(1);

      const [rfi] = order
        ? await tx
            .select({ question: formationRfis.question })
            .from(formationRfis)
            .where(and(eq(formationRfis.tenantId, ctx.tenantId), eq(formationRfis.orderId, order.id), eq(formationRfis.status, "open")))
            .limit(1)
        : [];

      const n = (k: string) => Number(counts?.[k] ?? 0);
      const brandFields = brand
        ? [brand.name, brand.positioning, brand.icp, brand.valueProposition, brand.toneOfVoice].filter(Boolean).length
        : 0;

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
        state: {
          postsPublished: n("posts_published"),
          postsScheduled: n("posts_scheduled"),
          postsDraft: n("posts_draft"),
          leadsTotal: n("leads_total"),
          leadsReplied: n("leads_replied"),
          leadsQualified: n("leads_qualified"),
          keywords: n("keywords"),
          mailboxes: n("mailboxes"),
          warmupDay: emailDomain && emailDomain.status !== "not_started" ? emailDomain.day : null,
          warmupTotal: 28,
          pages: n("pages"),
          pagesPublished: n("pages_published"),
          siteStatus: site?.status ?? null,
          brandName: brand?.name ?? null,
          brandColors: (brand?.colors as string[] | null) ?? [],
          brandComplete: brandFields,
          businessNamed: (((profile.onboardingAnswered as string[] | null) ?? []).includes("business_name")),
          formationStatus: order?.status ?? null,
          openRfi: rfi?.question ?? null,
        },
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
