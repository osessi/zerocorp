import {
  requestIdSchema,
  tenantIdSchema,
  userIdSchema,
  type TenantContext,
} from "@zerocorp/contracts";
import type { Clock, SystemUnitOfWork, UnitOfWork } from "../ports";
import type { AssessmentRepository } from "../assessment/ports";
import type { ConversionRepository, IdentityRepository } from "./ports";

/**
 * Turning an approved assessment into a tenant.
 *
 * This is the moment ZeroCorp acquires a customer, and everything downstream assumes it
 * happened exactly once. Stripe does not do this: Stripe TRIGGERS it. The distinction
 * matters because the same function has to be callable from a webhook, from an operator
 * console, and from a test, and only one of those has a payment attached.
 *
 * Three properties it must have, in order of how badly they hurt when missing:
 *
 *   IDEMPOTENT   a webhook is delivered more than once, always. `convertedTenantId` on
 *                the assessment is the guard: set it once, and every later call returns
 *                the tenant that already exists instead of creating a second one.
 *   ATOMIC       a tenant with no owner is a customer nobody can sign in as, and a
 *                membership with no tenant is a broken foreign key. Global writes happen
 *                in ONE system transaction.
 *   TRACEABLE    the plan the customer approved is copied in, not referenced across the
 *                boundary. Tenant-owned data has to be reachable through withTenant, and
 *                a plan read through a second door is the second door NN-2 forbids.
 */

export interface ConvertDeps<TTx> {
  readonly suow: SystemUnitOfWork<TTx>;
  readonly uow: UnitOfWork<TTx>;
  readonly identity: IdentityRepository<TTx>;
  readonly assessments: AssessmentRepository<TTx>;
  readonly conversion: ConversionRepository<TTx>;
  readonly clock: Clock;
  readonly tokens: { hash(token: string): string };
}

export class AssessmentNotApprovedError extends Error {
  override readonly name = "AssessmentNotApprovedError";
  constructor(status: string) {
    super(`An assessment must be approved before it becomes a tenant. This one is "${status}".`);
  }
}

export interface ConversionResult {
  readonly tenantId: string;
  readonly userId: string;
  readonly businessPlanId: string;
  /** False when the assessment had already been converted. */
  readonly created: boolean;
}

export function createConversionService<TTx>(deps: ConvertDeps<TTx>) {
  const requestId = () => `convert-${deps.clock.now().getTime()}`;

  /**
   * A readable, unique slug.
   *
   * Derived from the business name, then suffixed until it is free. Random slugs are
   * unique and unreadable; a name-derived one appears in URLs the founder will read out
   * loud.
   */
  async function uniqueSlug(tx: TTx, name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "business";

    if (!(await deps.identity.slugTaken(tx, base))) return base;
    for (let i = 2; i < 100; i += 1) {
      const candidate = `${base}-${i}`;
      if (!(await deps.identity.slugTaken(tx, candidate))) return candidate;
    }
    // A hundred businesses with the same name is not a collision, it is a bug elsewhere.
    return `${base}-${deps.clock.now().getTime()}`;
  }

  return {
    async convert(input: { token: string; email: string; name?: string }): Promise<ConversionResult> {
      const email = input.email.trim().toLowerCase();

      // Everything global in one transaction. A tenant with no owner is a customer
      // nobody can sign in as.
      const created = await deps.suow.withSystem(requestId(), async (tx) => {
        const assessment = await deps.assessments.findByTokenHash(tx, deps.tokens.hash(input.token));
        if (!assessment) throw new Error("No assessment for that token");

        // Delivered twice, always. The guard is the assessment's own record of what it
        // already produced, not a lock and not a dedup table.
        if (assessment.convertedTenantId) {
          const user = await deps.identity.findUserByEmail(tx, email);
          return {
            tenantId: assessment.convertedTenantId,
            userId: user?.id ?? "",
            alreadyConverted: true as const,
            plan: null,
            assessmentId: assessment.id,
            businessName: "",
          };
        }

        if (assessment.status !== "approved") throw new AssessmentNotApprovedError(assessment.status);

        const plan = await deps.assessments.latestPlan(tx, assessment.id);
        if (!plan) throw new Error("An approved assessment with no plan");

        // The analysis headline, not the plan title.
        //
        // The plan is called "ZeroCorp plan for X"; using it as the business name puts
        // our own product name inside the customer's company name, and then repeats it
        // in the sidebar, the page header and the subtitle. The headline is written to
        // be "one line the visitor recognises as their own business", which is exactly
        // what a business name has to be.
        const businessName = (assessment.analysis?.headline ?? plan.proposal.title).slice(0, 120);
        const tenantId = await deps.identity.createTenant(tx, {
          name: businessName,
          slug: await uniqueSlug(tx, businessName),
          plan: plan.proposal.recommendedSubscriptionPlan,
        });

        // An existing account is reused rather than duplicated. Two rows for one email
        // is two people holding one company's documents.
        const existing = await deps.identity.findUserByEmail(tx, email);
        const userId =
          existing?.id ??
          (await deps.identity.createUser(tx, { email, name: input.name ?? null, passwordHash: null }));

        await deps.identity.createMembership(tx, { userId, tenantId, role: "owner" });
        await deps.assessments.setStatus(tx, assessment.id, "converted", null);
        await deps.assessments.setContactEmail(tx, assessment.id, email);
        await deps.assessments.setConvertedTenant(tx, assessment.id, tenantId);

        return { tenantId, userId, alreadyConverted: false as const, plan, assessmentId: assessment.id, businessName };
      });

      if (created.alreadyConverted) {
        return { tenantId: created.tenantId, userId: created.userId, businessPlanId: "", created: false };
      }

      const plan = created.plan!;
      const ctx: TenantContext = {
        tenantId: tenantIdSchema.parse(created.tenantId),
        userId: userIdSchema.parse(created.userId),
        role: "owner",
        requestId: requestIdSchema.parse(requestId()),
        accessMode: "read-write",
      };

      // Tenant-owned rows, through withTenant like everything else. The plan is COPIED,
      // not referenced: a plan the product had to read through a second door is exactly
      // the second door NN-2 forbids.
      const businessPlanId = await deps.uow.withTenant(ctx, async (tx) => {
        await deps.conversion.createBusinessProfile(tx, ctx, {
          businessName: created.businessName,
          description: plan.proposal.summary,
          sourceAssessmentId: created.assessmentId,
        });

        const planId = await deps.conversion.createBusinessPlan(tx, ctx, {
          sourcePlanId: plan.id,
          title: plan.proposal.title,
          summary: plan.proposal.summary,
          setupPath: plan.proposal.recommendedSetupPath,
          subscriptionPlan: plan.proposal.recommendedSubscriptionPlan,
          approvedByUserId: created.userId,
          approvedAt: plan.approvedAt ?? deps.clock.now(),
        });

        // Excluded steps are copied too, marked excluded. A step the customer dropped is
        // part of what they approved, and losing it means a regeneration could bring it
        // back as if it had never been considered.
        await deps.conversion.createBusinessPlanSteps(
          tx,
          ctx,
          planId,
          plan.proposal.steps.map((step, position) => ({
            stepKey: step.key,
            position,
            title: step.title,
            outcome: step.outcome,
            rationale: step.rationale,
            phase: step.phase,
            category: step.category,
            priority: step.priority,
            included: step.included,
          })),
        );

        await deps.conversion.recordActivity(tx, ctx, {
          eventType: "tenant.created",
          actorType: "system",
          payload: { assessmentId: created.assessmentId, setupPath: plan.proposal.recommendedSetupPath },
        });

        return planId;
      });

      return { tenantId: created.tenantId, userId: created.userId, businessPlanId, created: true };
    },
  };
}

export type ConversionService<TTx = unknown> = ReturnType<typeof createConversionService<TTx>>;
