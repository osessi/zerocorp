import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import {
  closeAllConnections,
  createAssessmentRepository,
  createFormationCatalog,
  createSystemUnitOfWork,
  runMigrations,
} from "@zerocorp/db";
import { createAssessmentService, MAX_ANALYSES_PER_ASSESSMENT } from "@zerocorp/application";
import { DeterministicArchitect } from "@zerocorp/ai";
import { evaluateEligibility } from "@zerocorp/domain";
import { tokenService } from "@zerocorp/security";
import type { ArchitectInput, AssessmentAnswers } from "@zerocorp/contracts";

/**
 * The Free Business Assessment, end to end, against a real PostgreSQL.
 *
 * Landing → five answers → analysis → plan → edit → approve.
 *
 * Nothing is stubbed except the model, and the substitute is the DeterministicArchitect,
 * which is a real production fallback rather than a test double. The database, the
 * catalog, the eligibility policy, the repository and every use case are the ones that
 * ship.
 *
 * This is the test that answers "does the vertical slice actually work", which no
 * amount of unit testing does.
 */

const ADMIN_URL =
  process.env["ZEROCORP_TEST_ADMIN_URL"] ?? "postgresql://postgres:postgres@localhost:55432/postgres";
const DB = "zerocorp_slice_test";

const ANSWERS: AssessmentAnswers = {
  business_description: "I design brand identities for early-stage software companies.",
  current_situation: "Three clients, invoiced personally, no company and no website.",
  company_situation: "none",
  twelve_month_goal: "Ten retained clients and a site that sells while I sleep.",
  target_markets: ["US", "GB"],
};

let url: string;
let service: ReturnType<typeof createAssessmentService>;

beforeAll(async () => {
  const admin = postgres(ADMIN_URL, { max: 1, onnotice: () => {} });
  await admin.unsafe(`drop database if exists ${DB} with (force)`);
  await admin.unsafe(`create database ${DB}`);
  await admin.end({ timeout: 5 });

  const parsed = new URL(ADMIN_URL);
  parsed.pathname = `/${DB}`;
  url = parsed.toString();
  await runMigrations(url);

  const catalog = createFormationCatalog(url);

  const buildCatalog = async (answers: AssessmentAnswers): Promise<ArchitectInput["catalog"]> => {
    const entities = await catalog.listEntityTypes();
    const founder = {
      residencyCountry: answers.target_markets[0] ?? "US",
      targetMarkets: answers.target_markets,
      hasUsTaxId: false,
      ownerCount: 1,
      wantsExternalInvestment: false,
    };
    const out: ArchitectInput["catalog"] = [];
    for (const entity of entities) {
      const rules = await catalog.listEligibilityRules(entity.code);
      out.push({
        entityTypeCode: entity.code,
        jurisdictionCode: entity.jurisdictionCode,
        customerLabel: entity.customerLabel,
        automationLevel: entity.automationLevel,
        typicalDaysMin: entity.typicalDaysMin,
        typicalDaysMax: entity.typicalDaysMax,
        eligible: evaluateEligibility(entity.code, rules, founder).eligible,
        notes: entity.notes,
      });
    }
    return out;
  };

  service = createAssessmentService({
    suow: createSystemUnitOfWork(url),
    repository: createAssessmentRepository(),
    architect: new DeterministicArchitect(),
    buildCatalog,
    clock: { now: () => new Date() },
    tokens: tokenService,
  });
}, 60_000);

afterAll(async () => {
  await closeAllConnections();
});

describe("the catalog the migrations seeded", () => {
  it("holds the four V1 entities", async () => {
    const entities = await createFormationCatalog(url).listEntityTypes();
    expect(entities.map((e) => e.code).sort()).toEqual(["gb_llp", "gb_ltd", "us_c_corp", "us_llc"]);
  });

  it("says every one is operator assisted, because none is automated", async () => {
    // Not one provider integration is contracted. The catalog says so rather than
    // implying an automation that does not exist.
    const entities = await createFormationCatalog(url).listEntityTypes();
    expect(entities.every((e) => e.automationLevel === "operator_assisted")).toBe(true);
  });

  it("leaves an unverified fee null rather than guessing it", async () => {
    const entities = await createFormationCatalog(url).listEntityTypes();
    const wyoming = entities.find((e) => e.code === "us_llc");
    const uk = entities.find((e) => e.code === "gb_ltd");
    expect(wyoming!.governmentFee).toBeNull();
    // The one fee researched on 2026-09-01: GBP 100 from 1 February 2026.
    expect(uk!.governmentFee).toEqual({ amountMinor: 10_000, currency: "GBP" });
  });
});

describe("landing → assessment → analysis → plan → approve", () => {
  it("walks the whole slice", async () => {
    const { token } = await service.start("en");
    expect(token).toMatch(/^[0-9a-f]{64}$/);

    // One question at a time, exactly as the funnel saves them.
    await service.saveAnswers(token, { business_description: ANSWERS.business_description });
    await service.saveAnswers(token, { current_situation: ANSWERS.current_situation });
    await service.saveAnswers(token, { company_situation: ANSWERS.company_situation });
    await service.saveAnswers(token, { twelve_month_goal: ANSWERS.twelve_month_goal });
    await service.saveAnswers(token, { target_markets: ANSWERS.target_markets });

    const { analysis, plan } = await service.analyze(token);

    expect(analysis.headline.length).toBeGreaterThan(0);
    expect(analysis.whatIsMissing.length).toBeGreaterThanOrEqual(2);
    expect(plan.version).toBe(1);
    expect(plan.proposal.steps.length).toBeGreaterThanOrEqual(4);

    // The founder has no company and sells into US and GB, so an entity is recommended,
    // and it comes from the seeded catalog rather than from anywhere else.
    expect(plan.proposal.companyRecommendation).toBe("form_new");
    expect(["us_llc", "gb_ltd", "gb_llp", "us_c_corp"]).toContain(plan.proposal.recommendedEntityTypeCode);

    const state = await service.get(token);
    expect(state.assessment.status).toBe("analyzed");
    expect(state.assessment.analysis).not.toBeNull();

    // Excluding a step costs no model call.
    const target = plan.proposal.steps[1]!;
    const edited = await service.applyEdits(token, [{ kind: "exclude_step", key: target.key }]);
    expect(edited.proposal.steps.find((s) => s.key === target.key)!.included).toBe(false);
    // And it persisted.
    const reread = await service.get(token);
    expect(reread.plan!.proposal.steps.find((s) => s.key === target.key)!.included).toBe(false);

    const approved = await service.approve(token);
    expect(approved.plan.status).toBe("approved");
    // Derived on the server from the recommendation, never sent by the client.
    expect(approved.setupPath).toBe("launch");
    expect((await service.get(token)).assessment.status).toBe("approved");
  });

  it("refuses to analyse before every question is answered", async () => {
    const { token } = await service.start("en");
    await service.saveAnswers(token, { business_description: ANSWERS.business_description });
    await expect(service.analyze(token)).rejects.toMatchObject({ name: "AssessmentIncompleteError" });
  });

  it("keeps every plan version instead of overwriting", async () => {
    // "Ask for another proposal" has to be auditable: the approved version needs a
    // provenance, and the customer should be able to see what changed.
    const { token } = await service.start("en");
    await service.saveAnswers(token, ANSWERS);
    await service.analyze(token);
    await service.discuss(token, "Skip branding, I already have a logo I like.");
    const second = await service.analyze(token);
    expect(second.plan.version).toBe(2);
  });

  it("caps free proposals, because the free tier runs for strangers", async () => {
    const { token } = await service.start("en");
    await service.saveAnswers(token, ANSWERS);
    for (let i = 0; i < MAX_ANALYSES_PER_ASSESSMENT; i += 1) await service.analyze(token);
    await expect(service.analyze(token)).rejects.toMatchObject({ name: "AnalysisLimitReachedError" });
  });

  it("tells an unknown token nothing about whether it ever existed", async () => {
    // A different message for "expired" and "never existed" is an oracle for guessing.
    await expect(service.get("0".repeat(64))).rejects.toMatchObject({ name: "AssessmentNotFoundError" });
  });

  it("never re-forms a company that already exists", async () => {
    const { token } = await service.start("en");
    await service.saveAnswers(token, { ...ANSWERS, company_situation: "existing" });
    const { plan } = await service.analyze(token);
    expect(plan.proposal.companyRecommendation).toBe("use_existing");
    expect(plan.proposal.recommendedEntityTypeCode).toBeNull();
    expect((await service.approve(token)).setupPath).toBe("activation");
  });
});
