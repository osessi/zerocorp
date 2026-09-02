import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import {
  closeAllConnections,
  createAssessmentRepository,
  createConversionRepository,
  createDashboardRepository,
  createFormationCatalog,
  createIdentityRepository,
  createSystemUnitOfWork,
  createUnitOfWork,
  runMigrations,
} from "@zerocorp/db";
import {
  createAssessmentService,
  createConversionService,
  createInterviewService,
} from "@zerocorp/application";
import { DeterministicArchitect, DeterministicInterviewer } from "@zerocorp/ai";
import { buildTenantContext, hashPassword, verifyPassword } from "@zerocorp/auth";
import { evaluateEligibility } from "@zerocorp/domain";
import { tokenService } from "@zerocorp/security";
import {
  MAX_INTERVIEW_TURNS,
  type ArchitectInput,
  type AssessmentAnswers,
  type QuestionCard,
} from "@zerocorp/contracts";

/**
 * Assessment → approved plan → tenant → dashboard, against a real PostgreSQL.
 *
 * This is the moment ZeroCorp acquires a customer. Everything downstream assumes it
 * happened exactly once, so the test asserts that as hard as it asserts the happy path.
 */

const ADMIN_URL =
  process.env["ZEROCORP_TEST_ADMIN_URL"] ?? "postgresql://postgres:postgres@localhost:55432/postgres";
const DB = "zerocorp_conversion_test";

let url: string;
let interview: ReturnType<typeof createInterviewService>;
let assessment: ReturnType<typeof createAssessmentService>;
let conversion: ReturnType<typeof createConversionService>;

beforeAll(async () => {
  const admin = postgres(ADMIN_URL, { max: 1, onnotice: () => {} });
  await admin.unsafe(`drop database if exists ${DB} with (force)`);
  await admin.unsafe(`create database ${DB}`);
  await admin.end({ timeout: 5 });

  const parsed = new URL(ADMIN_URL);
  parsed.pathname = `/${DB}`;
  url = parsed.toString();
  await runMigrations(url);

  const suow = createSystemUnitOfWork(url);
  const uow = createUnitOfWork(url);
  const repository = createAssessmentRepository();
  const clock = { now: () => new Date() };
  const catalog = createFormationCatalog(url);

  interview = createInterviewService({
    suow, repository, interviewer: new DeterministicInterviewer(), clock, tokens: tokenService,
  });

  assessment = createAssessmentService({
    suow, repository, architect: new DeterministicArchitect(), clock, tokens: tokenService,
    buildCatalog: async (answers: AssessmentAnswers): Promise<ArchitectInput["catalog"]> => {
      const entities = await catalog.listEntityTypes();
      const founder = {
        residencyCountry: answers.target_markets[0] ?? "US",
        targetMarkets: answers.target_markets,
        hasUsTaxId: false, ownerCount: 1, wantsExternalInvestment: false,
      };
      const out: ArchitectInput["catalog"] = [];
      for (const e of entities) {
        const rules = await catalog.listEligibilityRules(e.code);
        out.push({
          entityTypeCode: e.code, jurisdictionCode: e.jurisdictionCode, customerLabel: e.customerLabel,
          automationLevel: e.automationLevel, typicalDaysMin: e.typicalDaysMin, typicalDaysMax: e.typicalDaysMax,
          eligible: evaluateEligibility(e.code, rules, founder).eligible, notes: e.notes,
        });
      }
      return out;
    },
  });

  conversion = createConversionService({
    suow, uow,
    identity: createIdentityRepository(),
    assessments: repository,
    conversion: createConversionRepository(),
    clock, tokens: tokenService,
  });
}, 60_000);

afterAll(async () => {
  await closeAllConnections();
});

function answerFor(card: QuestionCard): { text: string; values: string[] } {
  switch (card.slot) {
    case "business_description": return { text: "I design brand identities for early-stage software companies.", values: [] };
    case "current_situation": return { text: "Three clients, invoiced personally, no company.", values: [] };
    case "company_situation": return { text: "No, I do not have one", values: ["none"] };
    case "twelve_month_goal": return { text: "Ten retained clients and a site that sells while I sleep.", values: [] };
    case "target_markets": return { text: "United States, United Kingdom", values: ["us", "gb"] };
    default: return { text: "Yes, that is right.", values: ["confirmed"] };
  }
}

/** A full funnel: interview, analysis, approval. Returns the token. */
async function approvedAssessment(): Promise<string> {
  const { token, card } = await interview.start("en");
  let current: QuestionCard | null = card;
  let guard = 0;
  while (current) {
    if (guard++ > MAX_INTERVIEW_TURNS + 2) throw new Error("the interview did not stop");
    const { text, values } = answerFor(current);
    current = (await interview.answer(token, current, text, values)).card;
  }
  await assessment.analyze(token);
  await assessment.approve(token);
  return token;
}

describe("an approved assessment becomes a tenant", () => {
  it("creates the tenant, the owner, the brain and the plan", async () => {
    const token = await approvedAssessment();
    const result = await conversion.convert({ token, email: "Founder@Example.com" });

    expect(result.created).toBe(true);
    expect(result.tenantId).toMatch(/^[0-9a-f-]{36}$/);

    const sql = postgres(url, { max: 1, onnotice: () => {} });
    const [tenant] = await sql<Array<{ name: string; slug: string; plan: string }>>`
      select name, slug, plan from tenants where id = ${result.tenantId}
    `;
    const [membership] = await sql<Array<{ role: string; status: string }>>`
      select role, status from memberships where tenant_id = ${result.tenantId}
    `;
    const [profile] = await sql<Array<{ n: number }>>`
      select count(*)::int as n from business_profiles where tenant_id = ${result.tenantId}
    `;
    const [steps] = await sql<Array<{ n: number }>>`
      select count(*)::int as n from business_plan_steps where tenant_id = ${result.tenantId}
    `;
    await sql.end({ timeout: 5 });

    expect(tenant!.slug).toMatch(/^[a-z0-9-]+$/);
    expect(membership).toEqual({ role: "owner", status: "active" });
    expect(profile!.n).toBe(1);
    expect(steps!.n).toBeGreaterThanOrEqual(4);
  });

  it("is idempotent, because a webhook is delivered more than once", async () => {
    const token = await approvedAssessment();
    const first = await conversion.convert({ token, email: "twice@example.com" });
    const second = await conversion.convert({ token, email: "twice@example.com" });

    expect(second.created).toBe(false);
    expect(second.tenantId).toBe(first.tenantId);

    const sql = postgres(url, { max: 1, onnotice: () => {} });
    const [count] = await sql<Array<{ n: number }>>`
      select count(*)::int as n from tenants where id = ${first.tenantId}
    `;
    const [profiles] = await sql<Array<{ n: number }>>`
      select count(*)::int as n from business_profiles where tenant_id = ${first.tenantId}
    `;
    await sql.end({ timeout: 5 });
    expect(count!.n).toBe(1);
    // The second call must not have written a second brain.
    expect(profiles!.n).toBe(1);
  });

  it("refuses to convert an assessment nobody approved", async () => {
    const { token, card } = await interview.start("en");
    await interview.answer(token, card, "I sell candles.", []);
    await expect(conversion.convert({ token, email: "early@example.com" })).rejects.toMatchObject({
      name: "AssessmentNotApprovedError",
    });
  });

  it("reuses an existing account rather than creating a second one for the same email", async () => {
    // Two rows for one email is two people holding one company's documents.
    const a = await approvedAssessment();
    const b = await approvedAssessment();
    await conversion.convert({ token: a, email: "shared@example.com" });
    const second = await conversion.convert({ token: b, email: "shared@example.com" });

    const sql = postgres(url, { max: 1, onnotice: () => {} });
    const [users] = await sql<Array<{ n: number }>>`select count(*)::int as n from users where email = 'shared@example.com'`;
    const [memberships] = await sql<Array<{ n: number }>>`
      select count(*)::int as n from memberships where user_id = ${second.userId}
    `;
    await sql.end({ timeout: 5 });

    expect(users!.n).toBe(1);
    // One account, two businesses.
    expect(memberships!.n).toBe(2);
  });

  it("gives the dashboard something real to read, through withTenant", async () => {
    const token = await approvedAssessment();
    const result = await conversion.convert({ token, email: "dash@example.com" });

    const identity = createIdentityRepository();
    const memberships = await createSystemUnitOfWork(url).withSystem("t", (tx) =>
      identity.listMemberships(tx, result.userId),
    );

    const ctx = buildTenantContext({
      session: { userId: result.userId, email: "dash@example.com", activeTenantId: result.tenantId, expiresAt: new Date(Date.now() + 86_400_000), lastSeenAt: new Date() },
      memberships,
      requestId: "test",
      accessMode: "read-write",
    });

    const overview = await createUnitOfWork(url).withTenant(ctx, (tx) =>
      createDashboardRepository().overview(tx, ctx),
    );

    expect(overview).not.toBeNull();
    expect(overview!.steps.length).toBeGreaterThanOrEqual(4);
    expect(overview!.planTitle).not.toBeNull();
    // The conversion recorded that it happened.
    expect(overview!.activity.some((a) => a.eventType === "tenant.created")).toBe(true);
  });

  it("stores a password that verifies and is not the password", async () => {
    const hash = await hashPassword("a long enough passphrase");
    expect(hash).not.toContain("a long enough passphrase");
    expect(await verifyPassword("a long enough passphrase", hash)).toBe(true);
  });
});
