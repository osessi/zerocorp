import {
  assessmentAnswersSchema,
  canTransitionAssessment,
  partialAssessmentAnswersSchema,
  planEditSchema,
  setupPathFor,
  type ArchitectInput,
  type AssessmentStatus,
  type PartialAssessmentAnswers,
  type PlanConstraint,
  type PlanEdit,
  type PlanProposal,
} from "@zerocorp/contracts";
import type { BusinessArchitect } from "../ai/ports";
import type { Clock, SystemUnitOfWork } from "../ports";
import type { AssessmentRepository, AssessmentUsageRecorder, StoredAssessment, StoredPlan } from "./ports";

/**
 * The Free Business Assessment — PRODUCT_SPEC.md §29.3 block 0.
 *
 * Everything here runs BEFORE payment, for strangers, so the limits are part of the
 * design rather than an operational afterthought. ADR 0002 sets them: one analysis plus
 * three regenerations, and the cost of every run is recorded.
 */

export const MAX_ANALYSES_PER_ASSESSMENT = 4; // one, plus three regenerations
export const ASSESSMENT_TTL_DAYS = 30;

export interface AssessmentDeps<TTx> {
  readonly suow: SystemUnitOfWork<TTx>;
  readonly repository: AssessmentRepository<TTx>;
  readonly architect: BusinessArchitect;
  /** Builds the catalog slice the architect is allowed to see, for this founder. */
  readonly buildCatalog: (answers: ArchitectInput["answers"]) => Promise<ArchitectInput["catalog"]>;
  readonly clock: Clock;
  readonly tokens: { generate(): { token: string; hash: string }; hash(token: string): string };
  readonly usage?: AssessmentUsageRecorder;
}

export class AssessmentNotFoundError extends Error {
  override readonly name = "AssessmentNotFoundError";
  constructor() {
    // Deliberately says nothing about whether the token existed and expired, or never
    // existed. A different message for each is an oracle for guessing tokens.
    super("No assessment for that token");
  }
}

export class AssessmentIncompleteError extends Error {
  override readonly name = "AssessmentIncompleteError";
  constructor(readonly missing: string[]) {
    super(`Cannot analyse yet: ${missing.join(", ")}`);
  }
}

export class AnalysisLimitReachedError extends Error {
  override readonly name = "AnalysisLimitReachedError";
  constructor(readonly limit: number) {
    super(`This assessment has already been analysed ${limit} times`);
  }
}

export class IllegalAssessmentTransitionError extends Error {
  override readonly name = "IllegalAssessmentTransitionError";
  constructor(from: AssessmentStatus, to: AssessmentStatus) {
    super(`An assessment cannot go from "${from}" to "${to}"`);
  }
}

function assertTransition(from: AssessmentStatus, to: AssessmentStatus): void {
  if (from === to) return;
  if (!canTransitionAssessment(from, to)) throw new IllegalAssessmentTransitionError(from, to);
}

export function createAssessmentService<TTx>(deps: AssessmentDeps<TTx>) {
  const requestId = () => `assessment-${deps.clock.now().getTime()}`;

  async function load(tx: TTx, token: string): Promise<StoredAssessment> {
    const found = await deps.repository.findByTokenHash(tx, deps.tokens.hash(token));
    if (!found) throw new AssessmentNotFoundError();
    if (found.expiresAt.getTime() < deps.clock.now().getTime()) throw new AssessmentNotFoundError();
    return found;
  }

  /** Constraints the customer has stated, rebuilt from the latest plan. */
  function constraintsOf(plan: StoredPlan | null): readonly PlanConstraint[] {
    return plan?.proposal.constraints ?? [];
  }

  return {
    /** Starts an assessment. The token is returned ONCE; only its digest is stored. */
    async start(locale = "en"): Promise<{ token: string; assessmentId: string }> {
      const { token, hash } = deps.tokens.generate();
      const expiresAt = new Date(deps.clock.now().getTime() + ASSESSMENT_TTL_DAYS * 86_400_000);
      const assessmentId = await deps.suow.withSystem(requestId(), (tx) =>
        deps.repository.create(tx, { tokenHash: hash, locale, expiresAt }),
      );
      return { token, assessmentId };
    },

    async get(token: string): Promise<{ assessment: StoredAssessment; plan: StoredPlan | null }> {
      return deps.suow.withSystem(requestId(), async (tx) => {
        const assessment = await load(tx, token);
        return { assessment, plan: await deps.repository.latestPlan(tx, assessment.id) };
      });
    },

    /** Saves whatever the visitor has answered so far. Partial by design: they leave and come back. */
    async saveAnswers(token: string, patch: PartialAssessmentAnswers): Promise<PartialAssessmentAnswers> {
      const validated = partialAssessmentAnswersSchema.parse(patch);
      return deps.suow.withSystem(requestId(), async (tx) => {
        const assessment = await load(tx, token);
        const merged = { ...assessment.answers, ...validated };
        await deps.repository.saveAnswers(tx, assessment.id, merged);
        return merged;
      });
    },

    /**
     * Runs the Business Architect and stores the analysis plus a plan version.
     *
     * The status moves to `analyzing` FIRST and in its own transaction. A second
     * request arriving while the model is running sees `analyzing` and is refused,
     * which is what stops a visitor double-clicking into two paid model calls.
     */
    async analyze(token: string): Promise<{ analysis: NonNullable<StoredAssessment["analysis"]>; plan: StoredPlan }> {
      const prepared = await deps.suow.withSystem(requestId(), async (tx) => {
        const assessment = await load(tx, token);

        const parsed = assessmentAnswersSchema.safeParse(assessment.answers);
        if (!parsed.success) {
          throw new AssessmentIncompleteError(
            parsed.error.issues.map((i) => String(i.path[0] ?? "unknown")),
          );
        }

        const runs = await deps.repository.countAnalyses(tx, assessment.id);
        if (runs >= MAX_ANALYSES_PER_ASSESSMENT) throw new AnalysisLimitReachedError(MAX_ANALYSES_PER_ASSESSMENT);

        assertTransition(assessment.status, "analyzing");
        await deps.repository.setStatus(tx, assessment.id, "analyzing", null);

        return {
          id: assessment.id,
          answers: parsed.data,
          locale: assessment.locale,
          constraints: constraintsOf(await deps.repository.latestPlan(tx, assessment.id)),
          conversation: await deps.repository.listMessages(tx, assessment.id),
        };
      });

      let run;
      try {
        run = await deps.architect.analyze({
          answers: prepared.answers,
          transcripts: {},
          catalog: await deps.buildCatalog(prepared.answers),
          constraints: [...prepared.constraints],
          conversation: [...prepared.conversation],
          locale: prepared.locale,
        });
      } catch (cause) {
        // `failed` is reparable, and the answers survive. The visitor loses a minute,
        // not their work.
        await deps.suow.withSystem(requestId(), (tx) =>
          deps.repository.setStatus(tx, prepared.id, "failed", String(cause).slice(0, 500)),
        );
        throw cause;
      }

      await deps.usage?.record({
        assessmentId: prepared.id,
        feature: "business_architect",
        provider: run.usage.provider,
        model: run.usage.model,
        costMicros: run.usage.costMinor,
        durationMs: run.usage.durationMs,
        deterministic: run.deterministic,
      });

      return deps.suow.withSystem(requestId(), async (tx) => {
        await deps.repository.setAnalysis(tx, prepared.id, run.output.analysis);
        const plan = await deps.repository.addPlanVersion(tx, prepared.id, run.output.plan);
        await deps.repository.setStatus(tx, prepared.id, "analyzed", null);
        return { analysis: run.output.analysis, plan };
      });
    },

    /**
     * Applies the customer's direct edits. No model call: including a step, excluding
     * one or changing a priority is arithmetic, and spending money on a model to do it
     * would be absurd.
     */
    async applyEdits(token: string, edits: PlanEdit[]): Promise<StoredPlan> {
      const validated = edits.map((e) => planEditSchema.parse(e));
      return deps.suow.withSystem(requestId(), async (tx) => {
        const assessment = await load(tx, token);
        const plan = await deps.repository.latestPlan(tx, assessment.id);
        if (!plan) throw new AssessmentIncompleteError(["analysis"]);

        const proposal: PlanProposal = {
          ...plan.proposal,
          steps: plan.proposal.steps.map((step) => {
            let next = step;
            for (const edit of validated) {
              if (edit.key !== step.key) continue;
              if (edit.kind === "include_step") next = { ...next, included: true };
              if (edit.kind === "exclude_step") next = { ...next, included: false };
              if (edit.kind === "set_priority") next = { ...next, priority: edit.priority };
              if (edit.kind === "rename_step") next = { ...next, title: edit.title };
            }
            return next;
          }),
        };

        await deps.repository.updatePlanProposal(tx, plan.id, proposal);
        return { ...plan, proposal };
      });
    },

    /** The customer says something. Stored, then used to ground the next regeneration. */
    async discuss(token: string, message: string): Promise<void> {
      await deps.suow.withSystem(requestId(), async (tx) => {
        const assessment = await load(tx, token);
        await deps.repository.appendMessage(tx, assessment.id, { role: "customer", content: message });
      });
    },

    /**
     * Approve. The setup path is DERIVED from the recommendation, never sent by the
     * client: a price the browser can choose is a price the browser can lower.
     */
    async approve(token: string): Promise<{ plan: StoredPlan; setupPath: "launch" | "activation" }> {
      return deps.suow.withSystem(requestId(), async (tx) => {
        const assessment = await load(tx, token);
        const plan = await deps.repository.latestPlan(tx, assessment.id);
        if (!plan) throw new AssessmentIncompleteError(["analysis"]);

        assertTransition(assessment.status, "approved");
        await deps.repository.approvePlan(tx, plan.id, deps.clock.now());
        await deps.repository.setStatus(tx, assessment.id, "approved", null);

        return {
          plan: { ...plan, status: "approved", approvedAt: deps.clock.now() },
          setupPath: setupPathFor(plan.proposal.companyRecommendation),
        };
      });
    },

    /** Contact details are asked for late, at the point they are needed. */
    async setContactEmail(token: string, email: string): Promise<void> {
      await deps.suow.withSystem(requestId(), async (tx) => {
        const assessment = await load(tx, token);
        await deps.repository.setContactEmail(tx, assessment.id, email);
      });
    },
  };
}

export type AssessmentService<TTx = unknown> = ReturnType<typeof createAssessmentService<TTx>>;
