import "server-only";
import { createAssessmentRepository, createFormationCatalog, createSystemUnitOfWork, createUnitOfWork } from "@zerocorp/db";
import {
  createAssessmentService,
  type AssessmentService as Service,
  type FormationCatalog,
  type UnitOfWork as Uow,
} from "@zerocorp/application";
import { DeterministicArchitect, FallbackArchitect, ModelBusinessArchitect, AnthropicTextProvider, TASK_MODELS } from "@zerocorp/ai";
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
 * The Business Architect.
 *
 * With a key: the model, with the deterministic architect behind it as a fallback, so
 * a provider outage degrades the answer instead of losing the visitor.
 *
 * Without one: the deterministic architect alone. It is a real path with real tests,
 * and every run it produces is labelled so the UI can say what it is. ADR 0002.
 */
function buildArchitect() {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  const deterministic = new DeterministicArchitect();
  if (!apiKey) return deterministic;

  const model = new ModelBusinessArchitect({
    provider: new AnthropicTextProvider({
      apiKey,
      model: process.env["ANTHROPIC_MODEL"] ?? TASK_MODELS["assessment.analyze"] ?? "claude-haiku-4-5-20251001",
    }),
  });
  return new FallbackArchitect(model, deterministic, (reason) => {
    console.warn(`[architect] fell back to deterministic: ${reason}`);
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
