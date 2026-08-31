/**
 * Company formation — the state machines.
 *
 * THIS FILE IS THE SOURCE OF TRUTH. Decided 2026-08-31 (D2). `DATABASE.md` documents the
 * model and every other document references it rather than restating the list — three
 * restatements is exactly how the repository ended up with three different lists.
 *
 * Two machines, not one. The nine-state list everyone kept re-deriving was a single list
 * trying to be two: `draft → … → formed` describes the ORDER, while `ein_issued →
 * complete` describes the COMPANY. Nobody could settle it because it had no single
 * subject.
 */

/* ────────────────────────────────────────────────────────────────────────────
   formation_orders.status — the filing job
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * The work of getting a company filed.
 *
 * `rejected` is REPARABLE, not terminal. A state rejecting a filing is ordinary — a PO
 * box given as the registered agent address, a name already taken — and the order must be
 * able to go back and be fixed. None of the three earlier lists had this state at all,
 * which meant a rejection had nowhere to go.
 *
 * `operator_review` exists because `PRODUCT_SPEC.md` §21 says V1 is a manually assisted
 * operator workflow. It is where the work actually happens in V1, and it was dropped when
 * §21 shortened the earlier list.
 *
 * EIN is deliberately absent. It is an IRS filing, not a state filing, it usually lands
 * two to six weeks after formation, and it can fail on its own. Keeping it here would
 * hold the order open for weeks after the company legally exists. See `EinStatus`.
 */
export const FORMATION_ORDER_STATUSES = [
  "draft",
  "collecting_documents",
  "verifying_identity",
  "operator_review",
  "ready_to_file",
  "filed",
  "formed",
  "rejected",
  "cancelled",
] as const;

export type FormationOrderStatus = (typeof FORMATION_ORDER_STATUSES)[number];

/**
 * Allowed transitions. A union type stops a typo; it does not stop `formed → draft`.
 *
 * An empty array means terminal. `cancelled` is reachable from anywhere the work has not
 * finished — a founder may abandon a formation at any point before it is filed with the
 * state, and after filing it is no longer ours to cancel.
 */
export const FORMATION_ORDER_TRANSITIONS = {
  draft: ["collecting_documents", "cancelled"],
  collecting_documents: ["verifying_identity", "cancelled"],
  verifying_identity: ["operator_review", "collecting_documents", "cancelled"],
  operator_review: ["ready_to_file", "collecting_documents", "cancelled"],
  ready_to_file: ["filed", "operator_review", "cancelled"],
  // Once it is with the state, the outcome is theirs to give.
  filed: ["formed", "rejected"],
  // Reparable: fix what the state objected to and go round again.
  rejected: ["collecting_documents", "cancelled"],
  formed: [],
  cancelled: [],
} as const satisfies Record<FormationOrderStatus, readonly FormationOrderStatus[]>;

/** Terminal states. Nothing leaves them. */
export const FORMATION_ORDER_TERMINAL: readonly FormationOrderStatus[] = ["formed", "cancelled"];

export function canTransitionOrder(
  from: FormationOrderStatus,
  to: FormationOrderStatus,
): boolean {
  return (FORMATION_ORDER_TRANSITIONS[from] as readonly FormationOrderStatus[]).includes(to);
}

/* ────────────────────────────────────────────────────────────────────────────
   companies.status — the legal entity
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Whether the company exists and is in good standing. A different question from "how is
 * the filing going", and it outlives the order by years.
 *
 * `delinquent` is a real US concept, not a soft warning: miss an annual report and the
 * state marks the entity delinquent, then administratively dissolves it. The product has
 * to be able to say so.
 */
export const COMPANY_STATUSES = ["pending", "active", "delinquent", "dissolved"] as const;

export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export const COMPANY_TRANSITIONS = {
  // `pending` until the formation order reaches `formed`.
  pending: ["active", "dissolved"],
  active: ["delinquent", "dissolved"],
  // Reinstatement is real: pay the fee, file the report, the state restores it.
  delinquent: ["active", "dissolved"],
  dissolved: [],
} as const satisfies Record<CompanyStatus, readonly CompanyStatus[]>;

export const COMPANY_TERMINAL: readonly CompanyStatus[] = ["dissolved"];

export function canTransitionCompany(from: CompanyStatus, to: CompanyStatus): boolean {
  return (COMPANY_TRANSITIONS[from] as readonly CompanyStatus[]).includes(to);
}

/* ────────────────────────────────────────────────────────────────────────────
   EIN — its own track
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * The IRS employer identification number.
 *
 * Separate because it is a separate filing, with a separate authority, on a separate
 * clock, that fails separately. A company is `active` the moment the state forms it; the
 * EIN may still be weeks away, and the founder needs to see both facts at once rather
 * than one blocking the other.
 *
 * `not_started` is a real state, not a null: an EIN is not requested until the company
 * exists, so "we have not asked yet" and "we asked and are waiting" are different things
 * to show a founder.
 */
export const EIN_STATUSES = [
  "not_started",
  "requested",
  "issued",
  "rejected",
] as const;

export type EinStatus = (typeof EIN_STATUSES)[number];

export const EIN_TRANSITIONS = {
  not_started: ["requested"],
  requested: ["issued", "rejected"],
  // Reparable, like a state rejection.
  rejected: ["requested"],
  issued: [],
} as const satisfies Record<EinStatus, readonly EinStatus[]>;

export const EIN_TERMINAL: readonly EinStatus[] = ["issued"];

export function canTransitionEin(from: EinStatus, to: EinStatus): boolean {
  return (EIN_TRANSITIONS[from] as readonly EinStatus[]).includes(to);
}
