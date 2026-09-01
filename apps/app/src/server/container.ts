import "server-only";
import {
  createAssessmentRepository,
  createBlocksRepository,
  createConversionRepository,
  createDashboardRepository,
  createSettingsRepository,
  createFormationCatalog,
  createIdentityRepository,
  createSystemUnitOfWork,
  createUnitOfWork,
} from "@zerocorp/db";
import {
  createAssessmentService,
  createConversionService,
  createInterviewService,
  type AssessmentService as Service,
  type ConversionService as Conversion,
  type BlocksRepository,
  type DashboardRepository,
  type FormationCatalog,
  type SettingsRepository,
  type IdentityRepository,
  type InterviewService as Interview,
  type SystemUnitOfWork,
  type UnitOfWork as Uow,
} from "@zerocorp/application";
import {
  DeterministicArchitect,
  DeterministicInterviewer,
  FallbackArchitect,
  FallbackInterviewer,
  ModelBusinessArchitect,
  ModelInterviewer,
  OpenRouterTextProvider,
  assertModelSupportsStructuredOutput,
} from "@zerocorp/ai";
import { evaluateEligibility } from "@zerocorp/domain";
import { tokenService } from "@zerocorp/security";
import type { ArchitectInput, AssessmentAnswers } from "@zerocorp/contracts";

/**
 * Composition root for apps/app — the ONLY file in this app allowed to import
 * @zerocorp/db. Enforced by .dependency-cruiser.cjs and by ESLint.
 *
 * Read-write, because this app owns the back-office and the admin console.
 */
export type UnitOfWork = Uow;
export type AssessmentService = Service;
export type InterviewService = Interview;
export type ConversionService = Conversion;

function databaseUrl(): string {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is required");
  return url;
}

let unitOfWork: UnitOfWork | undefined;
export function getUnitOfWork(): UnitOfWork {
  unitOfWork ??= createUnitOfWork(databaseUrl());
  return unitOfWork;
}

let catalog: FormationCatalog | undefined;
export function getFormationCatalog(): FormationCatalog {
  catalog ??= createFormationCatalog(databaseUrl());
  return catalog;
}

/**
 * OpenRouter, with the model chosen in configuration — D19.
 *
 * Two agents, two models, because they have different demands: the interviewer runs on
 * every turn and decides little, the architect runs once and decides everything.
 *
 * `require_parameters` is sent on every request by the adapter, so OpenRouter routes
 * only to an endpoint that actually supports structured outputs. Support is per
 * ENDPOINT, not per model, and without that flag a provider that ignores the schema
 * returns prose — which parses as invalid and quietly burns a retry.
 */
function openRouter(model: string) {
  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) return null;
  return new OpenRouterTextProvider({
    apiKey,
    model,
    ...(process.env["APP_URL"] ? { appUrl: process.env["APP_URL"] } : {}),
    appName: "ZeroCorp",
  });
}

/**
 * Verifies the configured models at boot.
 *
 * A model that cannot do structured outputs makes ADR 0002's "reject, never repair"
 * rule collapse silently. Checked once, loudly, rather than discovered by the first
 * real visitor. Called from instrumentation, not from a request path.
 */
export async function verifyModels(): Promise<void> {
  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) return;
  for (const model of [MODEL_INTERVIEW, MODEL_ARCHITECT]) {
    await assertModelSupportsStructuredOutput({ apiKey, model });
  }
}

const MODEL_INTERVIEW = process.env["OPENROUTER_MODEL_INTERVIEW"] ?? "anthropic/claude-haiku-4.5";
const MODEL_ARCHITECT = process.env["OPENROUTER_MODEL_ARCHITECT"] ?? "anthropic/claude-sonnet-4.6";

/**
 * The Business Architect.
 *
 * With a key: the model, with the deterministic architect behind it, so a provider
 * outage degrades the answer instead of losing the visitor.
 *
 * Without one: the deterministic architect alone. A real path with real tests, and every
 * run it produces is labelled so the UI can say what it is. ADR 0002.
 */
function buildArchitect() {
  const deterministic = new DeterministicArchitect();
  const provider = openRouter(MODEL_ARCHITECT);
  if (!provider) return deterministic;

  return new FallbackArchitect(new ModelBusinessArchitect({ provider }), deterministic, (reason) => {
    console.warn(`[architect] fell back to the rules path: ${reason}`);
  });
}

function buildInterviewer() {
  const deterministic = new DeterministicInterviewer();
  const provider = openRouter(MODEL_INTERVIEW);
  if (!provider) return deterministic;

  return new FallbackInterviewer(new ModelInterviewer({ provider }), deterministic, (reason) => {
    console.warn(`[interviewer] fell back to the rules path: ${reason}`);
  });
}

/**
 * The catalog slice the architect may see, with THIS founder's eligibility already
 * decided. The model reports an automation level; it never decides one, and it never
 * sees an entity the eligibility policy has refused without being told it was refused.
 */
export async function evaluateEligibilityForCatalog(
  answers: AssessmentAnswers,
): Promise<ArchitectInput["catalog"]> {
  const c = getFormationCatalog();
  const entities = await c.listEntityTypes();
  const founder = {
    residencyCountry: answers.target_markets[0] ?? "US",
    targetMarkets: answers.target_markets,
    hasUsTaxId: false,
    ownerCount: 1,
    wantsExternalInvestment: false,
  };

  const out: ArchitectInput["catalog"] = [];
  for (const entity of entities) {
    const rules = await c.listEligibilityRules(entity.code);
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
}

let interview: InterviewService | undefined;
export function getInterviewService(): InterviewService {
  interview ??= createInterviewService({
    suow: createSystemUnitOfWork(databaseUrl()),
    repository: createAssessmentRepository(),
    interviewer: buildInterviewer(),
    clock: { now: () => new Date() },
    tokens: tokenService,
  });
  return interview;
}

let assessments: AssessmentService | undefined;
export function getAssessmentService(): AssessmentService {
  assessments ??= createAssessmentService({
    suow: createSystemUnitOfWork(databaseUrl()),
    repository: createAssessmentRepository(),
    architect: buildArchitect(),
    buildCatalog: evaluateEligibilityForCatalog,
    clock: { now: () => new Date() },
    tokens: tokenService,
  });
  return assessments;
}

/* ── Identity ───────────────────────────────────────────────────────────────
 *
 * Exposed as repositories rather than as a service, because the session helper needs to
 * read a session and its memberships on every request and has no business logic to run
 * around them. Everything that DOES have business logic goes through a use case.
 */

let systemUow: SystemUnitOfWork | undefined;
export function getSystemUnitOfWork(): SystemUnitOfWork {
  systemUow ??= createSystemUnitOfWork(databaseUrl());
  return systemUow;
}

let identity: IdentityRepository | undefined;
export function getIdentityRepository(): IdentityRepository {
  identity ??= createIdentityRepository();
  return identity;
}

let conversion: ConversionService | undefined;
export function getConversionService(): ConversionService {
  conversion ??= createConversionService({
    suow: createSystemUnitOfWork(databaseUrl()),
    uow: getUnitOfWork(),
    identity: createIdentityRepository(),
    assessments: createAssessmentRepository(),
    conversion: createConversionRepository(),
    clock: { now: () => new Date() },
    tokens: tokenService,
  });
  return conversion;
}

let dashboard: DashboardRepository | undefined;
export function getDashboardRepository(): DashboardRepository {
  dashboard ??= createDashboardRepository();
  return dashboard;
}

let blocks: BlocksRepository | undefined;
export function getBlocksRepository(): BlocksRepository {
  blocks ??= createBlocksRepository();
  return blocks;
}

let settings: SettingsRepository | undefined;
export function getSettingsRepository(): SettingsRepository {
  settings ??= createSettingsRepository();
  return settings;
}
