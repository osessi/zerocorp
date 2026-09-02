import { and, eq } from "drizzle-orm";
import type { TenantContext } from "@zerocorp/contracts";
import type { BlocksWriteRepository } from "@zerocorp/application";
import type { GeneratedBrand } from "@zerocorp/domain";
import {
  brandIdentities, contentKeywords, emailDomains, leadLists, mailboxes,
  pageVersions, pages, posts, sites,
} from "../schema/blocks";
import { activityEvents, businessPlanSteps, businessProfiles } from "../schema/tenant";
import { assessments } from "../schema/global";
import type { Tx } from "../types";

/**
 * The writes each block's build produces.
 *
 * "Replace" rather than "append", everywhere. Regenerate is a thing people press when
 * they did not like the first answer, and finding both answers side by side is not what
 * they meant. The one exception is page_versions, which is append-only by grant because
 * a published version has to stay readable for as long as its URL exists.
 */
export function createBlocksWriteRepository(): BlocksWriteRepository<Tx> {
  return {
    /**
     * What the generators read.
     *
     * The founder's own answers, from the assessment that created this tenant. The
     * profile holds the name and the description; the assessment holds the situation,
     * the goal and the markets, which is why both are read.
     */
    async brandSource(tx, ctx: TenantContext) {
      const [profile] = await tx
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.tenantId, ctx.tenantId))
        .limit(1);
      if (!profile) return null;

      // The assessment is a GLOBAL row and this transaction is tenant-scoped, so it is
      // reachable only by its id, which the profile recorded as provenance. RLS does not
      // apply to it; the join is by a key we already hold rather than by a tenant filter.
      const [assessment] = profile.sourceAssessmentId
        ? await tx.select().from(assessments).where(eq(assessments.id, profile.sourceAssessmentId)).limit(1)
        : [];

      const answers = (assessment?.answers ?? {}) as Record<string, unknown>;

      return {
        businessName: profile.businessName,
        description: profile.description ?? (answers["business_description"] as string | undefined) ?? null,
        situation: (answers["current_situation"] as string | undefined) ?? null,
        goal: (answers["twelve_month_goal"] as string | undefined) ?? null,
        markets: (answers["target_markets"] as string[] | undefined) ?? [],
      };
    },

    async replaceBrand(tx, ctx: TenantContext, brand: GeneratedBrand) {
      await tx.delete(brandIdentities).where(eq(brandIdentities.tenantId, ctx.tenantId));
      await tx.insert(brandIdentities).values({
        tenantId: ctx.tenantId,
        name: brand.name,
        positioning: brand.positioning,
        icp: brand.icp,
        valueProposition: brand.valueProposition,
        toneOfVoice: brand.toneOfVoice,
        colors: brand.colors,
        status: "draft",
      });
    },

    async replaceWebsite(tx, ctx: TenantContext, input) {
      const [existing] = await tx.select().from(sites).where(eq(sites.tenantId, ctx.tenantId)).limit(1);

      const siteId =
        existing?.id ??
        (
          await tx
            .insert(sites)
            .values({ tenantId: ctx.tenantId, status: "draft" })
            .returning({ id: sites.id })
        )[0]!.id;

      // Pages are replaced; their versions are not deleted, because page_versions is
      // append-only by grant. A published version stays readable for as long as its URL
      // exists, and a rebuild that deleted them would break every link already shared.
      await tx.delete(pages).where(and(eq(pages.tenantId, ctx.tenantId), eq(pages.siteId, siteId)));

      for (const page of input.pages) {
        const [row] = await tx
          .insert(pages)
          .values({
            tenantId: ctx.tenantId,
            siteId,
            slug: page.slug,
            title: page.title,
            type: page.type,
            status: "draft",
          })
          .returning({ id: pages.id });

        const [version] = await tx
          .select({ n: pageVersions.version })
          .from(pageVersions)
          .where(and(eq(pageVersions.tenantId, ctx.tenantId), eq(pageVersions.pageId, row!.id)))
          .orderBy(pageVersions.version);

        await tx.insert(pageVersions).values({
          tenantId: ctx.tenantId,
          pageId: row!.id,
          version: (version?.n ?? 0) + 1,
          content: page.blocks,
        });
      }
    },

    async setUpEmail(tx, ctx: TenantContext, input) {
      await tx.delete(emailDomains).where(eq(emailDomains.tenantId, ctx.tenantId));
      await tx.delete(mailboxes).where(eq(mailboxes.tenantId, ctx.tenantId));

      await tx.insert(emailDomains).values({
        tenantId: ctx.tenantId,
        hostname: input.hostname,
        // Every record starts pending. Nothing here has been checked against real DNS,
        // and marking them verified because we wrote them down is how a domain reports
        // healthy while its mail goes to spam.
        warmupStatus: "warming",
        warmupDay: 1,
        dailyLimit: input.dailyLimit,
      });

      if (input.mailboxes.length > 0) {
        await tx.insert(mailboxes).values(
          input.mailboxes.map((box) => ({
            tenantId: ctx.tenantId,
            address: box.address,
            displayName: box.displayName,
            status: "pending",
            dailyLimit: input.dailyLimit,
          })),
        );
      }
    },

    async replaceContent(tx, ctx: TenantContext, input) {
      await tx.delete(contentKeywords).where(eq(contentKeywords.tenantId, ctx.tenantId));
      await tx.delete(posts).where(eq(posts.tenantId, ctx.tenantId));

      if (input.keywords.length > 0) {
        await tx.insert(contentKeywords).values(
          input.keywords.map((k) => ({
            tenantId: ctx.tenantId,
            keyword: k.keyword,
            intent: k.intent,
            status: "targeting",
          })),
        );
      }

      if (input.posts.length > 0) {
        await tx.insert(posts).values(
          input.posts.map((p) => ({
            tenantId: ctx.tenantId,
            title: p.title,
            slug: p.slug,
            status: "scheduled",
            scheduledFor: p.scheduledFor,
          })),
        );
      }
    },

    async replaceTargetList(tx, ctx: TenantContext, input) {
      await tx.delete(leadLists).where(eq(leadLists.tenantId, ctx.tenantId));
      await tx.insert(leadLists).values({
        tenantId: ctx.tenantId,
        name: input.name,
        source: "zerocorp_target",
        filters: input.filters,
        // Zero, and it stays zero until a discovery provider is connected. Seeding
        // plausible company names would hand a founder a list of businesses that do not
        // exist, which is worse than an empty list by a wide margin.
        leadCount: 0,
      });
    },

    async recordActivity(tx, ctx: TenantContext, eventType, payload) {
      await tx.insert(activityEvents).values({
        tenantId: ctx.tenantId,
        eventType,
        actorType: "system",
        payload,
      });
    },

    async markStepDone(tx, ctx: TenantContext, category) {
      await tx
        .update(businessPlanSteps)
        .set({ status: "done", updatedAt: new Date() })
        .where(and(eq(businessPlanSteps.tenantId, ctx.tenantId), eq(businessPlanSteps.category, category)));
    },
  };
}
