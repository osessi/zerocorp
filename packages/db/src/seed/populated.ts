import { sql } from "drizzle-orm";
import { tenantContextSchema } from "@zerocorp/contracts";
import { withTenant } from "../tenant";

/**
 * Fills a tenant with the data a working business actually has.
 *
 * The SQL lives here, in the only layer allowed to know about the ORM, rather than in a
 * script at the repository root. The script owns the guards; this owns the writes.
 *
 * Every insert goes through `withTenant`, so the seed is subject to the same RLS as the
 * product. A seed that bypassed tenant context would be seeding a system the product does
 * not have.
 */
export async function seedPopulatedTenant(
  databaseUrl: string,
  tenantId: string,
  operatorUserId?: string,
): Promise<void> {
  // Parsed, not cast. The ids are branded, and a seed that casts past the brand is a
  // seed that can write a malformed tenant id the product would have rejected.
  const ctx = tenantContextSchema.parse({
    tenantId,
    requestId: "00000000-0000-4000-8000-000000000001",
    accessMode: "read-write",
  });

/** Days ago, as a timestamp. The feed needs a spread, not twenty rows at one instant. */
const ago = (days: number, hours = 0) =>
  new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString();

const COMPANIES = [
  "Northwind Studio", "Basalt Labs", "Cardinal & Co", "Driftwood Systems", "Ember Analytics",
  "Fathom Digital", "Granite Peak", "Harbourline", "Ironwood Group", "Juniper Data",
  "Keystone Collective", "Lumen Works", "Meridian Craft", "Nimbus Retail", "Orchard Software",
];
const LEAD_STATUS = ["discovered", "discovered", "enriched", "enriched", "qualified", "contacted", "replied"];

const ARTICLES = [
  "What a US LLC actually costs a non-resident founder",
  "Registered agent, explained without the jargon",
  "EIN without an SSN: the honest timeline",
  "Wyoming or Delaware for a solo software business",
  "The five documents a US bank will ask you for",
  "Why your invoice needs a company behind it",
  "Sales tax nexus for a one-person studio",
  "Form 5472, and who actually has to file it",
  "Pricing your first retainer in USD",
  "A brand system you can run without a designer",
  "Domain, DNS and email in one afternoon",
  "Cold email that does not get you blocked",
  "What SPF, DKIM and DMARC are protecting",
  "Warming a mailbox without burning the domain",
  "The content cadence a solo founder can keep",
  "Choosing keywords you can realistically rank for",
  "How to write a case study nobody skims",
  "Turning three clients into ten",
  "When to hire before you can afford to",
  "The operating rhythm of a one-person company",
];
const POST_STATUS = ["published", "published", "published", "published", "scheduled", "draft", "draft"];

const KEYWORDS: [string, string, number, number][] = [
  ["us llc for non residents", "commercial", 2400, 41],
  ["form llc without ssn", "commercial", 1300, 38],
  ["wyoming llc cost", "commercial", 3600, 45],
  ["ein for foreign owner", "informational", 1900, 33],
  ["registered agent wyoming", "commercial", 2900, 52],
  ["delaware vs wyoming llc", "informational", 4400, 58],
  ["form 5472 instructions", "informational", 880, 29],
  ["us business bank account non resident", "commercial", 1600, 61],
  ["brand identity for startups", "commercial", 720, 47],
  ["cold email deliverability", "informational", 1100, 44],
];

  await withTenant(databaseUrl, ctx, async (tx) => {
  // Replace, never append. Running the seed twice should give you the same product, not
  // two of everything — the same rule the build services follow.
  for (const t of ["leads", "lead_lists", "posts", "content_keywords", "mailboxes", "email_domains", "notifications"]) {
    await tx.execute(sql.raw(`delete from ${t} where tenant_id = '${tenantId}'`));
  }

  const list = await tx.execute(sql`
    insert into lead_lists (tenant_id, name, source, lead_count)
    values (${tenantId}, 'Design-led SaaS, US + UK', 'prospector', ${COMPANIES.length})
    returning id`);
  const listId = (list as unknown as { id: string }[])[0]!.id;

  for (const [i, name] of COMPANIES.entries()) {
    const slug = name.toLowerCase().replace(/[^a-z]+/g, "");
    await tx.execute(sql`
      insert into leads (tenant_id, list_id, company_name, domain, email, country, industry, status, consent_basis, created_at)
      values (${tenantId}, ${listId}, ${name}, ${slug + ".com"}, ${"hello@" + slug + ".com"},
              ${i % 3 === 0 ? "GB" : "US"}, 'Software', ${LEAD_STATUS[i % LEAD_STATUS.length]!},
              'legitimate_interest', ${ago(i % 3, i)})`);
  }

  for (const [i, title] of ARTICLES.entries()) {
    const status = POST_STATUS[i % POST_STATUS.length]!;
    await tx.execute(sql`
      insert into posts (tenant_id, slug, title, status, content_md, created_at, published_at, scheduled_for)
      values (${tenantId}, ${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}, ${title}, ${status},
              ${"## " + title + "\n\nDrafted by ZeroCorp Writer."}, ${ago(i % 3, i)},
              ${status === "published" ? ago(i % 3, i) : null},
              ${status === "scheduled" ? ago(-2, -i) : null})`);
  }

  for (const [kw, intent, volume, difficulty] of KEYWORDS) {
    await tx.execute(sql`
      insert into content_keywords (tenant_id, keyword, intent, volume, difficulty, status)
      values (${tenantId}, ${kw}, ${intent}, ${volume}, ${difficulty}, 'targeting')`);
  }

  const ed = await tx.execute(sql`
    insert into email_domains (tenant_id, hostname, spf_status, dkim_status, dmarc_status,
                               warmup_status, warmup_day, daily_limit, reputation_score)
    values (${tenantId}, 'northwindstudio.com', 'verified', 'verified', 'pending', 'warming', 9, 24, 82)
    returning id`);
  const edId = (ed as unknown as { id: string }[])[0]!.id;

  for (const [address, day, limit] of [["hello", 9, 24], ["olivier", 4, 12]] as const) {
    await tx.execute(sql`
      insert into mailboxes (tenant_id, email_domain_id, address, display_name, provider, status, daily_limit)
      values (${tenantId}, ${edId}, ${address + "@northwindstudio.com"}, 'Northwind Studio',
              'google', ${day > 7 ? "warming" : "warming"}, ${limit})`);
  }

  const FEED: [string, string, string, string, number][] = [
    ["content.published", "ZeroCorp Writer published \"Wyoming or Delaware for a solo software business\"", "info", "writer", 0],
    ["leads.enriched", "ZeroCorp Prospector enriched 6 leads in Design-led SaaS, US + UK", "info", "prospector", 0],
    ["email.warmup", "ZeroCorp Assistant advanced warm-up to day 9 · 24 sends a day", "info", "assistant", 0],
    ["formation.filed", "Your Wyoming LLC was filed with the Secretary of State", "info", "assistant", 1],
    ["content.published", "ZeroCorp Writer published \"The five documents a US bank will ask you for\"", "info", "writer", 1],
    ["leads.replied", "ZeroCorp Prospector logged a reply from Cardinal & Co", "info", "prospector", 1],
    ["analytics.weekly", "ZeroCorp Analyst reported 41 sessions and 3 enquiries this week", "info", "analyst", 2],
    ["social.posted", "ZeroCorp Community posted to LinkedIn and replied to 4 comments", "info", "community", 2],
    ["domain.verified", "ZeroCorp Assistant verified DNS for northwindstudio.com", "info", "assistant", 2],
  ];
  await tx.execute(sql.raw(`delete from activity_events where tenant_id = '${tenantId}'`));

  // A formation in flight, so Company and the operator queue show a real filing rather
  // than an empty state. Written through the same tables the intake writes to.
  const et = (await tx.execute(sql`
    select id from entity_types where code = 'us_llc' and jurisdiction_code = 'us-wy' limit 1`)) as unknown as { id: string }[];
  if (et[0]) {
    await tx.execute(sql.raw(`delete from formation_orders where tenant_id = '${tenantId}'`));
    await tx.execute(sql.raw(`delete from formation_requests where tenant_id = '${tenantId}'`));
    const req = (await tx.execute(sql`
      insert into formation_requests
        (tenant_id, entity_type_id, jurisdiction_code, proposed_names, founder_profile, status, eligibility)
      values (${tenantId}, ${et[0].id}, 'us-wy',
              ${JSON.stringify(["Northwind Studio LLC", "Northwind Design LLC"])}::jsonb,
              ${JSON.stringify({ residencyCountry: "NG", targetMarkets: ["US", "GB"], hasUsTaxId: false, ownerCount: 1, wantsExternalInvestment: false })}::jsonb,
              'routed', '[]'::jsonb)
      returning id`)) as unknown as { id: string }[];

    const order = (await tx.execute(sql`
      insert into formation_orders (tenant_id, request_id, provider_code, status, created_at)
      values (${tenantId}, ${req[0]!.id}, 'manual_operator', 'operator_review', ${ago(6)})
      returning id`)) as unknown as { id: string }[];

    await tx.execute(sql`
      insert into formation_rfis (tenant_id, order_id, question, status)
      values (${tenantId}, ${order[0]!.id},
              'We need a photo page of your passport to verify your identity with the registered agent.',
              'open')`);
  }

  for (const [i, [type, title, severity, agent, days]] of FEED.entries()) {
    await tx.execute(sql`
      insert into notifications (tenant_id, type, title, body, severity, channel, created_at)
      values (${tenantId}, ${type}, ${title}, ${agent}, ${severity}, 'in_app', ${ago(days, i + 1)})`);

    // The dashboard feed reads activity_events, not notifications, and the two want
    // different shapes of the same sentence.
    //
    // A notification is read alone, so it carries the whole sentence: "ZeroCorp Writer
    // published X". The feed renders the actor as the subject itself, so the payload
    // carries only the PREDICATE — storing the full sentence there printed the actor
    // twice on every row. The agent key travels separately, because the feed names its
    // actor and a feed that cannot say who acted is describing weather.
    await tx.execute(sql`
      insert into activity_events (tenant_id, event_type, actor_type, payload, created_at)
      values (${tenantId}, ${type}, 'agent',
              ${JSON.stringify({ agent, title: title.replace(/^ZeroCorp \w+ /, "") })}::jsonb, ${ago(days, i + 1)})`);
  }
  });



  // The demo account becomes a ZeroCorp OPERATOR, so /operator is reachable locally.
  //
  // A platform grant, not a tenant role. `memberships.role` says what someone may do
  // inside one business; this says they work for ZeroCorp and may see every filing.
  if (operatorUserId) {
    const { withSystem } = await import("../system");
    await withSystem(databaseUrl, "seed", (tx) =>
      tx.execute(sql`
        insert into platform_operators (user_id, role)
        values (${operatorUserId}, 'admin')
        on conflict do nothing`),
    );
  }
}

/** The tenant a user belongs to. Used by the seed, which has a user and needs a tenant. */
export async function findTenantIdForUser(tx: { execute: (q: unknown) => Promise<unknown> }, userId: string): Promise<string | null> {
  const rows = (await tx.execute(sql`select tenant_id from memberships where user_id = ${userId} limit 1`)) as unknown as { tenant_id: string }[];
  return rows[0]?.tenant_id ?? null;
}
