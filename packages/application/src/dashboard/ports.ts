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
  /**
   * The tenant's actual state.
   *
   * The Command Center answers "what is ZeroCorp doing for me", and it could not: the
   * query fetched the plan and the activity feed and nothing else. A tenant with twenty
   * articles, fifteen leads, ten keywords and two mailboxes warming saw none of it,
   * because the dashboard never asked. That is not a layout problem.
   */
  readonly state: BusinessState;
}

export interface BusinessState {
  readonly postsPublished: number;
  readonly postsScheduled: number;
  readonly postsDraft: number;
  readonly leadsTotal: number;
  readonly leadsReplied: number;
  readonly leadsQualified: number;
  readonly keywords: number;
  /** Prospects with no lawful basis. A liability rather than a lead — C2, §29.3 block 9. */
  readonly leadsNoBasis: number;
  readonly mailboxes: number;
  readonly warmupDay: number | null;
  readonly warmupTotal: number;
  readonly pages: number;
  readonly pagesPublished: number;
  readonly siteStatus: string | null;
  /** Which of the brand's five fields are filled. The rail shows completeness. */
  readonly brandName: string | null;
  readonly brandColors: readonly string[];
  readonly brandComplete: number;
  /**
   * Whether the founder has actually NAMED the business.
   *
   * `business_profiles.business_name` is seeded at conversion from the assessment
   * headline — a positioning sentence, not a name — because the free assessment never
   * asks what the business is called. Onboarding step 1 does. Until it is answered the
   * "name" is a 60-character sentence, and printing it as a heading is how "I design
   * brand identities for early-stage software companies." becomes a brand name.
   */
  readonly businessNamed: boolean;
  /**
   * Output over time, and the pipeline right now.
   *
   * Two series, computed in SQL rather than by pulling every row and grouping in JS: a
   * dashboard that fetches twenty articles to count them will fetch two thousand later.
   */
  readonly publishingByWeek: readonly { readonly week: string; readonly published: number; readonly scheduled: number }[];
  readonly leadsByStage: readonly { readonly stage: string; readonly count: number; readonly slot: number }[];
  /** The formation order in flight, and what it is waiting on. */
  readonly formationStatus: string | null;
  readonly openRfi: string | null;
}

export interface DashboardRepository<TTx = unknown> {
  overview(tx: TTx, ctx: TenantContext): Promise<BusinessOverview | null>;
  setStepStatus(tx: TTx, ctx: TenantContext, stepId: string, status: string): Promise<void>;
}
