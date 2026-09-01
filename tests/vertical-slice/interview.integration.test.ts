import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import {
  closeAllConnections,
  createAssessmentRepository,
  createFormationCatalog,
  createSystemUnitOfWork,
  runMigrations,
} from "@zerocorp/db";
import { createAssessmentService, createInterviewService } from "@zerocorp/application";
import { DeterministicArchitect, DeterministicInterviewer } from "@zerocorp/ai";
import { evaluateEligibility } from "@zerocorp/domain";
import { tokenService } from "@zerocorp/security";
import {
  MAX_INTERVIEW_TURNS,
  OPENING_QUESTION,
  type ArchitectInput,
  type AssessmentAnswers,
  type QuestionCard,
} from "@zerocorp/contracts";

/**
 * The adaptive interview, end to end, against a real PostgreSQL.
 *
 * Landing answer → turns → slots filled → analysis → plan.
 *
 * Nothing is stubbed except the model, and the substitute is the DeterministicInterviewer
 * and DeterministicArchitect, which are production fallbacks rather than test doubles.
 */

const ADMIN_URL =
  process.env["ZEROCORP_TEST_ADMIN_URL"] ?? "postgresql://postgres:postgres@localhost:55432/postgres";
const DB = "zerocorp_interview_test";

let url: string;
let interview: ReturnType<typeof createInterviewService>;
let assessment: ReturnType<typeof createAssessmentService>;

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
  const repository = createAssessmentRepository();
  const clock = { now: () => new Date() };

  interview = createInterviewService({
    suow, repository, interviewer: new DeterministicInterviewer(), clock, tokens: tokenService,
  });

  const catalog = createFormationCatalog(url);
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
}, 60_000);

afterAll(async () => {
  await closeAllConnections();
});

/** Answers whatever is asked, the way the UI would. */
function answerFor(card: QuestionCard): { text: string; values: string[] } {
  switch (card.slot) {
    case "business_description":
      return { text: "I design brand identities for early-stage software companies.", values: [] };
    case "current_situation":
      return { text: "Three clients, invoiced personally, no company.", values: [] };
    case "company_situation":
      return { text: "No, I do not have one", values: ["none"] };
    case "twelve_month_goal":
      return { text: "Ten retained clients and a site that sells while I sleep.", values: [] };
    case "target_markets":
      return { text: "United States, United Kingdom", values: ["us", "gb"] };
    default:
      return { text: "Yes, that is right.", values: ["confirmed"] };
  }
}

async function runInterview(): Promise<string> {
  const { token, card } = await interview.start("en");
  let current: QuestionCard | null = card;
  // A guard, not a limit: the interview has its own cap. If this one ever trips, the
  // service failed to stop and the test should say so rather than loop.
  let guard = 0;
  while (current) {
    if (guard++ > MAX_INTERVIEW_TURNS + 2) throw new Error("the interview did not stop");
    const { text, values } = answerFor(current);
    const result = await interview.answer(token, current, text, values);
    current = result.card;
  }
  return token;
}

describe("the interview persists and completes", () => {
  it("starts on the fixed opening question, with no model call", async () => {
    const { card } = await interview.start("en");
    expect(card).toEqual(OPENING_QUESTION);
  });

  it("fills every slot and then stops asking", async () => {
    const token = await runInterview();
    const state = await interview.state(token);
    expect(state.card).toBeNull();
    expect(state.complete).toBe(true);
    expect(Object.values(state.slots).every((s) => s.filled)).toBe(true);
  });

  it("stores every turn, in order, with the question it asked", async () => {
    const token = await runInterview();
    const state = await interview.state(token);
    expect(state.turns.length).toBeGreaterThanOrEqual(5);
    expect(state.turns.map((t) => t.position)).toEqual(state.turns.map((_, i) => i));
    // The whole card, not its text: replaying needs to know it was a three-option choice.
    expect(state.turns.some((t) => t.question.kind === "single_choice")).toBe(true);
  });

  it("survives a reload, because the pending question is stored rather than guessed", async () => {
    const { token, card } = await interview.start("en");
    await interview.answer(token, card, "I build websites for restaurants.", []);
    const reloaded = await interview.state(token);
    expect(reloaded.card).not.toBeNull();
    // Not the opening question again, and not a guess from the first empty slot.
    expect(reloaded.card?.question).not.toBe(OPENING_QUESTION.question);
  });

  it("refuses an answer to a question it did not ask", async () => {
    // Taking the card from the client means the client decides which slot its answer
    // lands in, and could reach the analysis with answers nobody was asked for.
    const { token, card } = await interview.start("en");
    const forged: QuestionCard = {
      kind: "free_text",
      slot: "target_markets",
      question: "Where do you sell?",
      suggestions: [],
    };
    await expect(interview.answer(token, forged, "Everywhere", [])).rejects.toMatchObject({
      name: "UnexpectedAnswerError",
    });
    // And the real question is still pending.
    expect((await interview.state(token)).card?.question).toBe(card.question);
  });

  it("changes an answer without discarding anything after it", async () => {
    const token = await runInterview();
    const before = await interview.state(token);
    await interview.editTurn(token, 1, "Actually, eight clients and growing.", []);
    const after = await interview.state(token);

    expect(after.turns.length).toBe(before.turns.length);
    expect(after.turns[1]!.answer).toBe("Actually, eight clients and growing.");
    // Everything after it is exactly as it was.
    expect(after.turns.slice(2).map((t) => t.answer)).toEqual(before.turns.slice(2).map((t) => t.answer));
  });

  it("produces an analysis and a plan from what the interview gathered", async () => {
    const token = await runInterview();
    const { analysis, plan } = await assessment.analyze(token);

    expect(analysis.whatIsMissing.length).toBeGreaterThanOrEqual(2);
    expect(plan.proposal.steps.length).toBeGreaterThanOrEqual(4);
    expect(plan.proposal.companyRecommendation).toBe("form_new");
    // From the seeded catalog, not from anywhere else.
    expect(["us_llc", "us_c_corp", "gb_ltd", "gb_llp"]).toContain(plan.proposal.recommendedEntityTypeCode);
  });

  it("records what each turn cost", async () => {
    // Zero here, because the rules interviewer is free. The column exists so the model
    // path is measurable rather than surprising: a free tier whose spend nobody can see
    // is a free tier nobody can cap.
    await runInterview();
    const sql = postgres(url, { max: 1, onnotice: () => {} });
    const rows = await sql<Array<{ n: number; total: number }>>`
      select count(*)::int as n, coalesce(sum(cost_micros), 0)::int as total
      from assessment_turns where cost_micros is not null
    `;
    await sql.end({ timeout: 5 });
    expect(rows[0]!.n).toBeGreaterThan(0);
    expect(rows[0]!.total).toBe(0);
  });
});
