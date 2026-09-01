import type {
  AssessmentAnswers,
  AssessmentStatus,
  BusinessAnalysis,
  PartialAssessmentAnswers,
  PlanConstraint,
  PlanMessage,
  PlanProposal,
} from "@zerocorp/contracts";

/**
 * The pre-payment funnel's storage.
 *
 * Every method here touches GLOBAL tables. There is no TenantContext because there is
 * no tenant: a visitor who has paid nothing owns nothing. Authorization is the
 * assessment token, and only its SHA-256 digest is ever stored.
 */

export interface StoredAssessment {
  readonly id: string;
  readonly status: AssessmentStatus;
  readonly answers: PartialAssessmentAnswers;
  readonly analysis: BusinessAnalysis | null;
  readonly locale: string;
  readonly contactEmail: string | null;
  readonly failureReason: string | null;
  readonly expiresAt: Date;
  readonly convertedTenantId: string | null;
}

export interface StoredPlan {
  readonly id: string;
  readonly version: number;
  readonly status: "proposed" | "approved" | "superseded";
  readonly proposal: PlanProposal;
  readonly approvedAt: Date | null;
}

export interface AssessmentRepository<TTx = unknown> {
  create(tx: TTx, input: { tokenHash: string; locale: string; expiresAt: Date }): Promise<string>;
  /** Lookup is by DIGEST. The plaintext token never reaches the database. */
  findByTokenHash(tx: TTx, tokenHash: string): Promise<StoredAssessment | null>;
  saveAnswers(tx: TTx, id: string, answers: PartialAssessmentAnswers): Promise<void>;
  setStatus(tx: TTx, id: string, status: AssessmentStatus, failureReason?: string | null): Promise<void>;
  setAnalysis(tx: TTx, id: string, analysis: BusinessAnalysis): Promise<void>;
  setContactEmail(tx: TTx, id: string, email: string): Promise<void>;

  /** Never overwrites. A new proposal is a new version and supersedes the last. */
  addPlanVersion(tx: TTx, id: string, proposal: PlanProposal): Promise<StoredPlan>;
  latestPlan(tx: TTx, id: string): Promise<StoredPlan | null>;
  listPlans(tx: TTx, id: string): Promise<readonly StoredPlan[]>;
  approvePlan(tx: TTx, planId: string, at: Date): Promise<void>;
  updatePlanProposal(tx: TTx, planId: string, proposal: PlanProposal): Promise<void>;

  appendMessage(tx: TTx, id: string, message: PlanMessage): Promise<void>;
  listMessages(tx: TTx, id: string): Promise<readonly PlanMessage[]>;

  /** How many analyses have run. The regeneration cap is enforced on this. */
  countAnalyses(tx: TTx, id: string): Promise<number>;
}

/** Records what a run cost, so free-tier spend is measurable rather than surprising. */
export interface AssessmentUsageRecorder {
  record(input: {
    assessmentId: string;
    feature: string;
    provider: string;
    model: string;
    costMicros: number;
    durationMs: number;
    deterministic: boolean;
  }): Promise<void>;
}

/** Answers, before they were typed. */
export interface AssessmentAnswersComplete {
  readonly complete: true;
  readonly answers: AssessmentAnswers;
  readonly constraints: readonly PlanConstraint[];
}
