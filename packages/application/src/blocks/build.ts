import type { TenantContext } from "@zerocorp/contracts";
import {
  dnsRecordsFor,
  generateBrand,
  generateCalendar,
  generateKeywords,
  generatePages,
  warmupLimit,
  type GeneratedBrand,
} from "@zerocorp/domain";
import type { Clock, UnitOfWork } from "../ports";
import type { BlocksRepository } from "./ports";

/**
 * Building each block from the Business Brain.
 *
 * Every one of these is idempotent in the way that matters to a founder: running it
 * twice does not produce two brands or twice the articles. It replaces what it made
 * before, because "regenerate" is a thing people press when they did not like the first
 * answer, and finding both answers side by side is not what they meant.
 *
 * The generators are pure and live in @zerocorp/domain, so what each block produces is a
 * unit test rather than something you have to run the product to see.
 */

export interface BlocksWriteRepository<TTx = unknown> {
  brandSource(tx: TTx, ctx: TenantContext): Promise<{
    businessName: string;
    description: string | null;
    situation: string | null;
    goal: string | null;
    markets: readonly string[];
  } | null>;

  replaceBrand(tx: TTx, ctx: TenantContext, brand: GeneratedBrand): Promise<void>;

  replaceWebsite(tx: TTx, ctx: TenantContext, input: {
    pages: readonly { slug: string; title: string; type: string; blocks: unknown }[];
  }): Promise<void>;

  setUpEmail(tx: TTx, ctx: TenantContext, input: {
    hostname: string;
    dailyLimit: number;
    mailboxes: readonly { address: string; displayName: string }[];
  }): Promise<void>;

  replaceContent(tx: TTx, ctx: TenantContext, input: {
    keywords: readonly { keyword: string; intent: string }[];
    posts: readonly { title: string; slug: string; scheduledFor: Date }[];
  }): Promise<void>;

  replaceTargetList(tx: TTx, ctx: TenantContext, input: {
    name: string;
    filters: Record<string, unknown>;
  }): Promise<void>;

  recordActivity(tx: TTx, ctx: TenantContext, eventType: string, payload: Record<string, unknown>): Promise<void>;
  markStepDone(tx: TTx, ctx: TenantContext, category: string): Promise<void>;
}

export class NothingToBuildFromError extends Error {
  override readonly name = "NothingToBuildFromError";
  constructor(what: string) {
    super(`There is not enough in your Business Brain to build ${what} yet.`);
  }
}

export interface BuildDeps<TTx> {
  readonly uow: UnitOfWork<TTx>;
  readonly repository: BlocksWriteRepository<TTx>;
  readonly reads: BlocksRepository<TTx>;
  readonly clock: Clock;
}

export function createBuildService<TTx>(deps: BuildDeps<TTx>) {
  async function brandFor(tx: TTx, ctx: TenantContext): Promise<GeneratedBrand> {
    const source = await deps.repository.brandSource(tx, ctx);
    if (!source || !source.description) throw new NothingToBuildFromError("your brand");
    return generateBrand({
      businessName: source.businessName,
      description: source.description,
      situation: source.situation ?? "",
      goal: source.goal ?? "",
      markets: source.markets,
    });
  }

  return {
    async buildBrand(ctx: TenantContext): Promise<void> {
      await deps.uow.withTenant(ctx, async (tx) => {
        const brand = await brandFor(tx, ctx);
        await deps.repository.replaceBrand(tx, ctx, brand);
        await deps.repository.markStepDone(tx, ctx, "brand");
        await deps.repository.recordActivity(tx, ctx, "brand.built", { name: brand.name });
      });
    },

    async buildWebsite(ctx: TenantContext): Promise<void> {
      await deps.uow.withTenant(ctx, async (tx) => {
        const source = await deps.repository.brandSource(tx, ctx);
        if (!source?.description) throw new NothingToBuildFromError("your website");
        const brand = await brandFor(tx, ctx);
        const pages = generatePages(brand, source.description);

        await deps.repository.replaceWebsite(tx, ctx, {
          pages: pages.map((p) => ({ slug: p.slug, title: p.title, type: p.type, blocks: p.blocks })),
        });
        await deps.repository.markStepDone(tx, ctx, "website");
        await deps.repository.recordActivity(tx, ctx, "website.built", { pages: pages.length });
      });
    },

    async setUpEmail(ctx: TenantContext, hostname: string): Promise<void> {
      const host = hostname.trim().toLowerCase();
      if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) throw new NothingToBuildFromError("your email");

      await deps.uow.withTenant(ctx, async (tx) => {
        await deps.repository.setUpEmail(tx, ctx, {
          hostname: host,
          // Day one of the ramp. Starting at the target volume is what gets a new domain
          // filtered, and no amount of correct SPF repairs a reputation earned that way.
          dailyLimit: warmupLimit(1),
          mailboxes: [
            { address: `hello@${host}`, displayName: "Hello" },
            { address: `founder@${host}`, displayName: "Founder" },
          ],
        });
        await deps.repository.markStepDone(tx, ctx, "email");
        await deps.repository.recordActivity(tx, ctx, "email.configured", {
          hostname: host,
          records: dnsRecordsFor(host).length,
        });
      });
    },

    async buildContentPlan(ctx: TenantContext): Promise<void> {
      await deps.uow.withTenant(ctx, async (tx) => {
        const source = await deps.repository.brandSource(tx, ctx);
        if (!source?.description) throw new NothingToBuildFromError("a content plan");

        const brand = await brandFor(tx, ctx);
        const keywords = generateKeywords(source.description, brand.icp);
        if (keywords.length === 0) throw new NothingToBuildFromError("a content plan");

        const calendar = generateCalendar(keywords, brand);
        const now = deps.clock.now();

        await deps.repository.replaceContent(tx, ctx, {
          keywords: keywords.map((k) => ({ keyword: k.keyword, intent: k.intent })),
          posts: calendar.map((a) => ({
            title: a.title,
            slug: a.slug,
            scheduledFor: new Date(now.getTime() + a.offsetDays * 86_400_000),
          })),
        });
        await deps.repository.markStepDone(tx, ctx, "content");
        await deps.repository.recordActivity(tx, ctx, "content.planned", {
          keywords: keywords.length,
          articles: calendar.length,
        });
      });
    },

    /**
     * Defines who to look for. It does NOT invent prospects.
     *
     * Discovery needs a data provider, and none is connected. Seeding plausible company
     * names would give a founder a list they might contact, made of businesses that do
     * not exist — which is worse than an empty list by a wide margin.
     */
    async defineTarget(ctx: TenantContext): Promise<void> {
      await deps.uow.withTenant(ctx, async (tx) => {
        const source = await deps.repository.brandSource(tx, ctx);
        if (!source?.description) throw new NothingToBuildFromError("a target");
        const brand = await brandFor(tx, ctx);

        await deps.repository.replaceTargetList(tx, ctx, {
          name: brand.icp.split(".")[0]?.slice(0, 80) ?? "Your ideal customer",
          filters: { icp: brand.icp, markets: source.markets },
        });
        await deps.repository.recordActivity(tx, ctx, "target.defined", { markets: source.markets });
      });
    },
  };
}

export type BuildService<TTx = unknown> = ReturnType<typeof createBuildService<TTx>>;
