import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  businessAnalysisSchema,
  enrichmentSchema,
  planProposalSchema,
  partialAssessmentAnswersSchema,
  questionCardSchema,
  type AssessmentStatus,
  type BusinessAnalysis,
  type PartialAssessmentAnswers,
  type PlanMessage,
  type PlanProposal,
} from "@zerocorp/contracts";
import type { AssessmentRepository, StoredAssessment, StoredPlan, StoredTurn } from "@zerocorp/application";
import { assessmentTurns, assessments, planMessages, plans } from "../schema/global";
import type { Tx } from "../types";

/**
 * The pre-payment funnel, in PostgreSQL.
 *
 * Every table here is GLOBAL. There is no tenant context because there is no tenant,
 * and the transaction these methods run in has app.tenant_id cleared, so it can see
 * nothing in any tenant-owned table even if a query tried.
 *
 * Rows are parsed through their contract schemas on the way out. A jsonb column will
 * hold whatever was written into it, including whatever an older version of the code
 * wrote; parsing here means a shape change fails at the boundary rather than three
 * screens later.
 */
export function createAssessmentRepository(): AssessmentRepository<Tx> {
  function toStored(row: typeof assessments.$inferSelect): StoredAssessment {
    return {
      id: row.id,
      status: row.status as AssessmentStatus,
      answers: partialAssessmentAnswersSchema.parse(row.answers),
      analysis: row.analysis === null ? null : businessAnalysisSchema.parse(row.analysis),
      locale: row.locale,
      contactEmail: row.contactEmail,
      failureReason: row.failureReason,
      expiresAt: row.expiresAt,
      convertedTenantId: row.convertedTenantId,
      enrichment: enrichmentSchema.parse(row.enrichment),
      turnsUsed: row.turnsUsed,
      pendingQuestion: row.pendingQuestion === null ? null : questionCardSchema.parse(row.pendingQuestion),
    };
  }



  return {
    async create(tx, input) {
      const [row] = await tx
        .insert(assessments)
        .values({ tokenHash: input.tokenHash, locale: input.locale, expiresAt: input.expiresAt })
        .returning({ id: assessments.id });
      if (!row) throw new Error("insert into assessments returned nothing");
      return row.id;
    },

    async findByTokenHash(tx, tokenHash) {
      // By DIGEST, on a unique index. The plaintext token never reaches the database.
      const rows = await tx.select().from(assessments).where(eq(assessments.tokenHash, tokenHash)).limit(1);
      return rows[0] ? toStored(rows[0]) : null;
    },

    async saveAnswers(tx, id, answers: PartialAssessmentAnswers) {
      await tx.update(assessments).set({ answers, updatedAt: new Date() }).where(eq(assessments.id, id));
    },

    async setStatus(tx, id, status, failureReason = null) {
      await tx
        .update(assessments)
        .set({ status, failureReason, updatedAt: new Date() })
        .where(eq(assessments.id, id));
    },

    async setAnalysis(tx, id, analysis: BusinessAnalysis) {
      await tx.update(assessments).set({ analysis, updatedAt: new Date() }).where(eq(assessments.id, id));
    },

    async setContactEmail(tx, id, email) {
      await tx.update(assessments).set({ contactEmail: email, updatedAt: new Date() }).where(eq(assessments.id, id));
    },

    async addPlanVersion(tx, id, proposal: PlanProposal) {
      // A new proposal never overwrites the last one. The customer can be shown what
      // changed, and an approved version has a provenance.
      await tx
        .update(plans)
        .set({ status: "superseded", updatedAt: new Date() })
        .where(and(eq(plans.assessmentId, id), eq(plans.status, "proposed")));

      const [next] = await tx
        .select({ version: sql<number>`coalesce(max(${plans.version}), 0) + 1` })
        .from(plans)
        .where(eq(plans.assessmentId, id));

      const [row] = await tx
        .insert(plans)
        .values({
          assessmentId: id,
          version: next?.version ?? 1,
          status: "proposed",
          title: proposal.title,
          summary: proposal.summary,
          recommendedSetupPath: proposal.recommendedSetupPath,
          recommendedSubscriptionPlan: proposal.recommendedSubscriptionPlan,
          recommendationReason: proposal.recommendationReason,
          // The whole proposal, so nothing is lost to the column projection above.
          steps: proposal,
        })
        .returning();
      if (!row) throw new Error("insert into plans returned nothing");
      return { id: row.id, version: row.version, status: "proposed", proposal, approvedAt: null };
    },

    async latestPlan(tx, id) {
      const rows = await tx
        .select()
        .from(plans)
        .where(eq(plans.assessmentId, id))
        .orderBy(desc(plans.version))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        version: row.version,
        status: row.status as StoredPlan["status"],
        proposal: planProposalSchema.parse(row.steps),
        approvedAt: row.approvedAt,
      };
    },

    async listPlans(tx, id) {
      const rows = await tx.select().from(plans).where(eq(plans.assessmentId, id)).orderBy(asc(plans.version));
      return rows.map((row) => ({
        id: row.id,
        version: row.version,
        status: row.status as StoredPlan["status"],
        proposal: planProposalSchema.parse(row.steps),
        approvedAt: row.approvedAt,
      }));
    },

    async approvePlan(tx, planId, at) {
      await tx.update(plans).set({ status: "approved", approvedAt: at, updatedAt: at }).where(eq(plans.id, planId));
    },

    async updatePlanProposal(tx, planId, proposal) {
      // Direct customer edits amend the CURRENT version rather than creating a new one.
      // Excluding a step is not a new proposal; asking the model for one is.
      await tx.update(plans).set({ steps: proposal, updatedAt: new Date() }).where(eq(plans.id, planId));
    },

    async appendMessage(tx, id, message: PlanMessage) {
      await tx.insert(planMessages).values({ assessmentId: id, role: message.role, content: message.content });
    },

    async listMessages(tx, id) {
      const rows = await tx
        .select()
        .from(planMessages)
        .where(eq(planMessages.assessmentId, id))
        .orderBy(asc(planMessages.createdAt));
      return rows.map((r) => ({ role: r.role as PlanMessage["role"], content: r.content }));
    },

    async countAnalyses(tx, id) {
      // Plan versions ARE analyses: one is written per successful run. Counting them
      // needs no second counter to keep in step.
      const [row] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(plans)
        .where(eq(plans.assessmentId, id));
      return row?.n ?? 0;
    },

    /* ── The interview ────────────────────────────────────────────────────── */

    async appendTurn(tx, id, turn) {
      await tx.insert(assessmentTurns).values({
        assessmentId: id,
        position: turn.position,
        question: turn.question,
        answer: turn.answer,
        patch: turn.patch,
        statedSlot: turn.statedSlot,
        inferredSlots: turn.inferredSlots,
        ...(turn.costMicros !== undefined ? { costMicros: turn.costMicros } : {}),
        ...(turn.model !== undefined ? { model: turn.model } : {}),
      });
    },

    async replaceTurn(tx, id, position, turn) {
      // In place, by position. Everything after it is untouched — D18.
      await tx
        .update(assessmentTurns)
        .set({ answer: turn.answer, patch: turn.patch, updatedAt: new Date() })
        .where(and(eq(assessmentTurns.assessmentId, id), eq(assessmentTurns.position, position)));
    },

    async listTurns(tx, id) {
      const rows = await tx
        .select()
        .from(assessmentTurns)
        .where(eq(assessmentTurns.assessmentId, id))
        .orderBy(asc(assessmentTurns.position));
      return rows.map((row) => ({
        position: row.position,
        // Parsed back through the contract. A jsonb column holds whatever was written
        // into it, including whatever an older version of the code wrote.
        question: questionCardSchema.parse(row.question),
        answer: row.answer,
        patch: partialAssessmentAnswersSchema.parse(row.patch),
        statedSlot: row.statedSlot as StoredTurn["statedSlot"],
        inferredSlots: row.inferredSlots as StoredTurn["inferredSlots"],
      }));
    },

    async setEnrichment(tx, id, enrichment) {
      await tx.update(assessments).set({ enrichment, updatedAt: new Date() }).where(eq(assessments.id, id));
    },

    async setTurnsUsed(tx, id, turnsUsed) {
      await tx.update(assessments).set({ turnsUsed, updatedAt: new Date() }).where(eq(assessments.id, id));
    },

    async setPendingQuestion(tx, id, question) {
      await tx
        .update(assessments)
        .set({ pendingQuestion: question, updatedAt: new Date() })
        .where(eq(assessments.id, id));
    },
  };
}
