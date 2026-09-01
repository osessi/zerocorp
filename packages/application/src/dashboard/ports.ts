import type { TenantContext } from "@zerocorp/contracts";

/**
 * What the Command Center reads.
 *
 * PRODUCT_SPEC.md §19: the dashboard answers one question, "what is ZeroCorp doing for
 * me". Every method here exists to answer part of that and nothing else — a read port
 * that grows to "everything about a tenant" is a repository, and the screen stops having
 * a subject.
 */

export interface PlanStepRow {
  readonly id: string;
  readonly stepKey: string;
  readonly position: number;
  readonly title: string;
  readonly outcome: string;
  readonly rationale: string;
  readonly phase: string;
  readonly category: string;
  readonly priority: number;
  readonly included: boolean;
  readonly status: string;
}

export interface ActivityRow {
  readonly id: string;
  readonly eventType: string;
  readonly actorType: string;
  readonly payload: Record<string, unknown>;
  readonly createdAt: Date;
}

export interface BusinessOverview {
  readonly businessName: string;
  readonly description: string | null;
  readonly status: string;
  readonly planTitle: string | null;
  readonly planSummary: string | null;
  readonly setupPath: string | null;
  readonly subscriptionPlan: string | null;
  readonly steps: readonly PlanStepRow[];
  readonly activity: readonly ActivityRow[];
  readonly companyStatus: string | null;
  readonly companyName: string | null;
}

export interface DashboardRepository<TTx = unknown> {
  overview(tx: TTx, ctx: TenantContext): Promise<BusinessOverview | null>;
  setStepStatus(tx: TTx, ctx: TenantContext, stepId: string, status: string): Promise<void>;
}
