/**
 * A demo customer, for looking at the product without walking the funnel.
 *
 *   pnpm seed:demo
 *
 * It runs the REAL services: the interview, the architect, the conversion. Nothing here
 * writes a row the product could not have written itself, so what you see is what a
 * customer sees rather than a fixture that resembles one.
 *
 * Refuses to run against production. A seed script that can reach a real database is a
 * seed script that eventually does.
 */
import {
  closeAllConnections,
  createAssessmentRepository,
  createConversionRepository,
  createFormationCatalog,
  createIdentityRepository,
  createSystemUnitOfWork,
  createUnitOfWork,
} from "@zerocorp/db";
import {
  createAssessmentService,
  createConversionService,
  createInterviewService,
} from "@zerocorp/application";
import { DeterministicArchitect, DeterministicInterviewer } from "@zerocorp/ai";
import { hashPassword } from "@zerocorp/auth";
import { evaluateEligibility } from "@zerocorp/domain";
import { tokenService } from "@zerocorp/security";
import {
  MAX_INTERVIEW_TURNS,
  type ArchitectInput,
  type AssessmentAnswers,
  type QuestionCard,
} from "@zerocorp/contracts";

const DEMO_EMAIL = "founder@zerocorp.test";
const DEMO_PASSWORD = "zerocorp-demo-2026";

const url = process.env["DATABASE_URL"] ?? "postgresql://postgres:postgres@localhost:55432/zerocorp";

if (process.env["NODE_ENV"] === "production" || !/localhost|127\.0\.0\.1/.test(url)) {
  console.error("seed:demo refuses to run against anything that is not local.");
  process.exit(1);
}

const suow = createSystemUnitOfWork(url);
const uow = createUnitOfWork(url);
const repository = createAssessmentRepository();
const identity = createIdentityRepository();
const catalog = createFormationCatalog(url);
const clock = { now: () => new Date() };

const interview = createInterviewService({
  suow, repository, interviewer: new DeterministicInterviewer(), clock, tokens: tokenService,
});

const assessment = createAssessmentService({
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

const conversion = createConversionService({
  suow, uow, identity, assessments: repository,
  conversion: createConversionRepository(), clock, tokens: tokenService,
});

function answerFor(card: QuestionCard): { text: string; values: string[] } {
  switch (card.slot) {
    case "business_description":
      return { text: "I design brand identities for early-stage software companies.", values: [] };
    case "current_situation":
      return { text: "Three clients, invoiced personally, no company and no website.", values: [] };
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

const existing = await suow.withSystem("seed", (tx) => identity.findUserByEmail(tx, DEMO_EMAIL));
if (existing) {
  // Re-runnable. The password is reset rather than the account duplicated, because two
  // rows for one email is two people holding one company's documents.
  await suow.withSystem("seed", async (tx) =>
    identity.setPasswordHash(tx, existing.id, await hashPassword(DEMO_PASSWORD)),
  );
  console.log(`\n  Demo account already exists. Password reset.\n`);
} else {
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

  const result = await conversion.convert({ token, email: DEMO_EMAIL });
  await suow.withSystem("seed", async (tx) =>
    identity.setPasswordHash(tx, result.userId, await hashPassword(DEMO_PASSWORD)),
  );
  console.log(`\n  Demo customer created.\n`);
}

console.log(`  Sign in at  http://localhost:3000/signin`);
console.log(`  Email       ${DEMO_EMAIL}`);
console.log(`  Password    ${DEMO_PASSWORD}\n`);

await closeAllConnections();
process.exit(0);
