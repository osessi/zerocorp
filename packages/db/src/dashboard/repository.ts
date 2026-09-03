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

      /*
        Six weeks of publishing, bucketed in SQL.

        `date_trunc('week', ...)` is Monday-first in Postgres, which matches the editorial
        calendar. A week with nothing in it still appears, because a gap in a time series
        that silently closes up tells the wrong story about cadence.
      */
      const weekRows = (await tx.execute(sql`
        with weeks as (
          select generate_series(
            date_trunc('week', now()) - interval '5 weeks',
            date_trunc('week', now()),
            interval '1 week'
          ) as w
        )
        select
          to_char(weeks.w, 'DD Mon') as week,
          coalesce(count(*) filter (where p.status = 'published'), 0) as published,
          coalesce(count(*) filter (where p.status = 'scheduled'), 0) as scheduled
        from weeks
        left join posts p
          on p.tenant_id = ${ctx.tenantId}
         and date_trunc('week', coalesce(p.published_at, p.scheduled_for)) = weeks.w
        group by weeks.w
        order by weeks.w`)) as unknown as Record<string, unknown>[];

      const stageRows = (await tx.execute(sql`
        select status as stage, count(*) as count
        from leads where tenant_id = ${ctx.tenantId}
        group by status`)) as unknown as Record<string, unknown>[];

      // The five stages in journey order, so the chart reads left to right as progress
      // rather than in whatever order the group by returned.
      const STAGE_ORDER = ["discovered", "enriched", "qualified", "contacted", "replied"];
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
          publishingByWeek: weekRows.map((r) => ({
            week: String(r["week"]),
            published: Number(r["published"] ?? 0),
            scheduled: Number(r["scheduled"] ?? 0),
          })),
          leadsByStage: STAGE_ORDER.map((stage, i) => ({
            stage,
            count: Number(stageRows.find((r) => r["stage"] === stage)?.["count"] ?? 0),
            slot: (i % 5) + 1,
          })),
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
