import { and, desc, eq, sql } from "drizzle-orm";
import type { TenantContext } from "@zerocorp/contracts";
import type { BlocksRepository, SettingsRepository } from "@zerocorp/application";
import {
  brandIdentities, contentKeywords, domains, emailDomains, leadLists, leads,
  mailboxes, pages, posts, sites,
} from "../schema/blocks";
import { businessProfiles, creditLedger, subscriptions } from "../schema/tenant";
import { companies, companyRegistrations, entityTypes, formationDocuments, formationOrders, formationRequests, formationRfis } from "../schema/formation";
import { memberships, tenants, users } from "../schema/global";
import type { Tx } from "../types";

/**
 * Every block's reads.
 *
 * All of them run inside withTenant, so RLS is the second barrier under an explicit
 * tenant filter. The explicit filter is still written on every query: the application
 * never relies on RLS as its only protection, which is the point of having two.
 */
/** Resolves an entity type id back to the code a founder recognises. */
async function entityTypeCodeOf(tx: Tx, id: string): Promise<string | null> {
  const [row] = await tx.select({ code: entityTypes.code }).from(entityTypes).where(eq(entityTypes.id, id)).limit(1);
  return row?.code ?? null;
}

export function createBlocksRepository(): BlocksRepository<Tx> {
  return {
    async company(tx, ctx: TenantContext) {
      const [company] = await tx
        .select()
        .from(companies)
        .where(eq(companies.tenantId, ctx.tenantId))
        .orderBy(desc(companies.createdAt))
        .limit(1);

      const [request] = await tx
        .select()
        .from(formationRequests)
        .where(eq(formationRequests.tenantId, ctx.tenantId))
        .orderBy(desc(formationRequests.createdAt))
        .limit(1);

      const registrations = company
        ? await tx
            .select()
            .from(companyRegistrations)
            .where(and(eq(companyRegistrations.tenantId, ctx.tenantId), eq(companyRegistrations.companyId, company.id)))
        : [];

      const orders = request
        ? await tx
            .select()
            .from(formationOrders)
            .where(and(eq(formationOrders.tenantId, ctx.tenantId), eq(formationOrders.requestId, request.id)))
            .orderBy(desc(formationOrders.createdAt))
        : [];

      const documents = await tx
        .select()
        .from(formationDocuments)
        .where(eq(formationDocuments.tenantId, ctx.tenantId))
        .orderBy(desc(formationDocuments.createdAt));

      const openRfis = await tx
        .select()
        .from(formationRfis)
        .where(and(eq(formationRfis.tenantId, ctx.tenantId), eq(formationRfis.status, "open")));

      return {
        company: company
          ? {
              id: company.id,
              legalName: company.legalName,
              jurisdictionCode: company.jurisdictionCode,
              status: company.status,
              origin: company.origin,
              formationDate: company.formationDate,
            }
          : null,
        registrations: registrations.map((r) => ({
          kind: r.kind, authority: r.authority, identifier: r.identifier, status: r.status,
        })),
        request: request
          ? {
              id: request.id,
              status: request.status,
              jurisdictionCode: request.jurisdictionCode,
              entityTypeId: request.entityTypeId,
              // The names the founder proposed and the structure they chose. The screen
              // showed neither, so during formation — the period where a customer checks
              // this page daily — it could not name what was being formed.
              proposedNames: (request.proposedNames as string[] | null) ?? [],
              entityTypeCode: request.entityTypeId ? await entityTypeCodeOf(tx, request.entityTypeId) : null,
            }
          : null,
        orders: orders.map((o) => ({
          id: o.id, status: o.status, providerCode: o.providerCode, rejectionReason: o.rejectionReason,
        })),
        documents: documents.map((d) => ({ id: d.id, type: d.type, issuedAt: d.issuedAt })),
        openRfis: openRfis.map((r) => ({ id: r.id, question: r.question, dueAt: r.dueAt })),
      };
    },

    async brand(tx, ctx: TenantContext) {
      const [profile] = await tx
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.tenantId, ctx.tenantId))
        .orderBy(desc(businessProfiles.createdAt))
        .limit(1);
      if (!profile) return null;

      const [identity] = await tx
        .select()
        .from(brandIdentities)
        .where(eq(brandIdentities.tenantId, ctx.tenantId))
        .orderBy(desc(brandIdentities.createdAt))
        .limit(1);

      return {
        businessName: profile.businessName,
        description: profile.description,
        identity: identity
          ? {
              name: identity.name,
              positioning: identity.positioning,
              icp: identity.icp,
              valueProposition: identity.valueProposition,
              toneOfVoice: identity.toneOfVoice,
              colors: identity.colors as string[],
              status: identity.status,
            }
          : null,
      };
    },

    async website(tx, ctx: TenantContext) {
      const [site] = await tx
        .select()
        .from(sites)
        .where(eq(sites.tenantId, ctx.tenantId))
        .orderBy(desc(sites.createdAt))
        .limit(1);

      const [domain] = await tx
        .select()
        .from(domains)
        .where(eq(domains.tenantId, ctx.tenantId))
        .orderBy(desc(domains.createdAt))
        .limit(1);

      const pageRows = site
        ? await tx
            .select()
            .from(pages)
            .where(and(eq(pages.tenantId, ctx.tenantId), eq(pages.siteId, site.id)))
            .orderBy(pages.slug)
        : [];

      return {
        site: site ? { id: site.id, status: site.status, publishedAt: site.publishedAt } : null,
        domain: domain
          ? { hostname: domain.hostname, status: domain.status, dnsStatus: domain.dnsStatus, sslStatus: domain.sslStatus }
          : null,
        pages: pageRows.map((p) => ({ id: p.id, slug: p.slug, title: p.title, type: p.type, status: p.status })),
      };
    },

    async email(tx, ctx: TenantContext) {
      const [domain] = await tx
        .select()
        .from(emailDomains)
        .where(eq(emailDomains.tenantId, ctx.tenantId))
        .orderBy(desc(emailDomains.createdAt))
        .limit(1);

      const boxes = await tx
        .select()
        .from(mailboxes)
        .where(eq(mailboxes.tenantId, ctx.tenantId))
        .orderBy(mailboxes.address);

      return {
        domain: domain
          ? {
              hostname: domain.hostname,
              spfStatus: domain.spfStatus,
              dkimStatus: domain.dkimStatus,
              dmarcStatus: domain.dmarcStatus,
              warmupStatus: domain.warmupStatus,
              warmupDay: domain.warmupDay,
              dailyLimit: domain.dailyLimit,
              reputationScore: domain.reputationScore,
            }
          : null,
        mailboxes: boxes.map((m) => ({ id: m.id, address: m.address, status: m.status, dailyLimit: m.dailyLimit })),
      };
    },

    async content(tx, ctx: TenantContext) {
      const keywords = await tx
        .select()
        .from(contentKeywords)
        .where(eq(contentKeywords.tenantId, ctx.tenantId))
        .orderBy(desc(contentKeywords.volume))
        .limit(50);

      const postRows = await tx
        .select()
        .from(posts)
        .where(eq(posts.tenantId, ctx.tenantId))
        .orderBy(desc(posts.createdAt))
        .limit(50);

      return {
        keywords: keywords.map((k) => ({
          id: k.id, keyword: k.keyword, intent: k.intent, volume: k.volume, difficulty: k.difficulty, status: k.status,
        })),
        posts: postRows.map((p) => ({
          id: p.id, title: p.title, slug: p.slug, status: p.status, scheduledFor: p.scheduledFor, publishedAt: p.publishedAt,
        })),
      };
    },

    async customers(tx, ctx: TenantContext) {
      const lists = await tx
        .select()
        .from(leadLists)
        .where(eq(leadLists.tenantId, ctx.tenantId))
        .orderBy(desc(leadLists.createdAt));

      const recent = await tx
        .select()
        .from(leads)
        .where(eq(leads.tenantId, ctx.tenantId))
        .orderBy(desc(leads.createdAt))
        .limit(25);

      const [count] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(leads)
        .where(eq(leads.tenantId, ctx.tenantId));

      return {
        lists: lists.map((l) => ({ id: l.id, name: l.name, source: l.source, leadCount: l.leadCount })),
        recent: recent.map((l) => ({
          id: l.id, companyName: l.companyName, domain: l.domain, email: l.email, country: l.country,
          industry: l.industry, status: l.status, consentBasis: l.consentBasis,
        })),
        total: count?.n ?? 0,
      };
    },
  };
}

/**
 * Settings spans both doors.
 *
 * The plan and the members live in GLOBAL tables; the subscription and the credit ledger
 * are tenant-owned. Two transactions rather than one, because there is no single door
 * that reaches both — and inventing one would be inventing the second door NN-2 forbids.
 */
export function createSettingsRepository(): SettingsRepository<Tx> {
  return {
    async settings(systemTx, tenantTx, ctx: TenantContext) {
      const [tenant] = await systemTx
        .select({ name: tenants.name, plan: tenants.plan })
        .from(tenants)
        .where(eq(tenants.id, ctx.tenantId))
        .limit(1);

      const members = await systemTx
        .select({ email: users.email, role: memberships.role, status: memberships.status })
        .from(memberships)
        .innerJoin(users, eq(memberships.userId, users.id))
        .where(eq(memberships.tenantId, ctx.tenantId));

      const [subscription] = await tenantTx
        .select({ status: subscriptions.status })
        .from(subscriptions)
        .where(eq(subscriptions.tenantId, ctx.tenantId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      // SUM(delta), never a stored balance — DATABASE.md §14. The ledger is the only
      // authority, and a projection that drifts from it is worse than a slow query.
      const [balance] = await tenantTx
        .select({ total: sql<number>`coalesce(sum(${creditLedger.delta}), 0)::int` })
        .from(creditLedger)
        .where(eq(creditLedger.tenantId, ctx.tenantId));

      return {
        tenantName: tenant?.name ?? "Your business",
        plan: tenant?.plan ?? "launch",
        subscriptionStatus: subscription?.status ?? null,
        creditBalance: balance?.total ?? 0,
        members: members.map((m) => ({ email: m.email, role: m.role, status: m.status })),
      };
    },
  };
}
