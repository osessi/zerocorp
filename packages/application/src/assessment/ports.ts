import type {
  AssessmentAnswers,
  AssessmentStatus,
  BusinessAnalysis,
  Enrichment,
  PartialAssessmentAnswers,
  PlanConstraint,
  PlanMessage,
  PlanProposal,
  QuestionCard,
  SlotId,
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
  readonly enrichment: Enrichment;
  readonly turnsUsed: number;
  /** The question the server last asked. What an incoming answer is checked against. */
  readonly pendingQuestion: QuestionCard | null;
}

/**
 * One question asked and the answer given — D18.
 *
 * `patch` is what the answer wrote into the slots, kept beside the turn rather than
 * derived later. That is what makes going back exact: replace an entry and recompute,
 * instead of guessing which later turn touched which slot.
 */
export interface StoredTurn {
  readonly position: number;
  readonly question: QuestionCard;
  readonly answer: string;
  readonly patch: PartialAssessmentAnswers;
  readonly statedSlot: SlotId | null;
  readonly inferredSlots: readonly SlotId[];
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

  /* ── The interview ──────────────────────────────────────────────────────── */

  appendTurn(tx: TTx, id: string, turn: StoredTurn & { costMicros?: number; model?: string }): Promise<void>;
  /** Replaces an answered turn in place. Everything after it is left alone — D18. */
  replaceTurn(tx: TTx, id: string, position: number, turn: StoredTurn): Promise<void>;
  listTurns(tx: TTx, id: string): Promise<readonly StoredTurn[]>;
  setEnrichment(tx: TTx, id: string, enrichment: Enrichment): Promise<void>;
  setTurnsUsed(tx: TTx, id: string, turnsUsed: number): Promise<void>;
  setPendingQuestion(tx: TTx, id: string, question: QuestionCard | null): Promise<void>;

  /** Set exactly once, when payment converts this assessment into a tenant. */
  setConvertedTenant(tx: TTx, id: string, tenantId: string): Promise<void>;
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
