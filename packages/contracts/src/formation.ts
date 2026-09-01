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
 * hold the order open for weeks after the company legally exists. See `RegistrationStatus`.
 *
 * Two states were added 2026-09-01 with D14, because both already happened in reality
 * and had nowhere to go:
 *
 *   awaiting_provider      an order handed to a provider that has not yet reached the
 *                          authority. It is not `filed` — nothing has been filed — and
 *                          it is still cancellable, which `filed` is not.
 *   information_requested  an RFI. Not a rejection: nothing was refused, something was
 *                          asked. Collapsing the two loses the difference between "fix
 *                          this and resubmit" and "answer this and we continue".
 *
 * Neither name mentions a provider's own vocabulary. `ProviderOrderStatus` holds the
 * raw string and the adapter translates it; that string never crosses this boundary.
 */
export const FORMATION_ORDER_STATUSES = [
  "draft",
  "collecting_documents",
  "verifying_identity",
  "operator_review",
  "ready_to_file",
  "awaiting_provider",
  "information_requested",
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
  // Handed to a provider. Not yet with the authority, so still cancellable.
  ready_to_file: ["awaiting_provider", "operator_review", "cancelled"],
  awaiting_provider: ["filed", "information_requested", "rejected", "cancelled"],
  // An RFI returns to the provider, never straight to filed: a filing that needed
  // more information is not a filing that has happened.
  information_requested: ["awaiting_provider", "cancelled"],
  // Once it is with the authority, the outcome is theirs to give.
  filed: ["formed", "rejected", "information_requested"],
  // Reparable: fix what the authority objected to and go round again.
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
   Post-incorporation registrations — each on its own track
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * A registration a company obtains AFTER it legally exists.
 *
 * An EIN from the IRS. A UTR from HMRC. A VAT number. A payroll registration.
 *
 * Generalised 2026-09-01 with D14. The machine is byte-for-byte the one the EIN had —
 * only the name was US-specific — and that is the point: four `ein_*` columns on
 * `companies` made a US filing part of the shape of every company in the world.
 * Modelling it as rows means the next country adds data, not a migration.
 *
 * Separate from the order because each is a separate filing, with a separate
 * authority, on a separate clock, that fails separately. A company is `active` the
 * moment the authority forms it; its tax id may still be weeks away, and the founder
 * needs both facts at once rather than one blocking the other.
 *
 * `not_started` is a real state, not a null: a registration is not requested until the
 * company exists, so "we have not asked yet" and "we asked and are waiting" are
 * different things to show a founder.
 */
export const REGISTRATION_STATUSES = [
  "not_started",
  "requested",
  "issued",
  "rejected",
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const REGISTRATION_TRANSITIONS = {
  not_started: ["requested"],
  requested: ["issued", "rejected"],
  // Reparable, like an authority rejection.
  rejected: ["requested"],
  issued: [],
} as const satisfies Record<RegistrationStatus, readonly RegistrationStatus[]>;

export const REGISTRATION_TERMINAL: readonly RegistrationStatus[] = ["issued"];

export function canTransitionRegistration(
  from: RegistrationStatus,
  to: RegistrationStatus,
): boolean {
  return (REGISTRATION_TRANSITIONS[from] as readonly RegistrationStatus[]).includes(to);
}

/* ── EIN — the US instance of the above ───────────────────────────────────────
 *
 * Kept as aliases rather than deleted. The EIN is still a real, named thing the
 * product talks about, D2 decided its lifecycle, and removing a working export to
 * make a rename look tidy is exactly what CLAUDE_CODE_RULES.md §36 forbids.
 *
 * They are the SAME values, so a `RegistrationStatus` and an `EinStatus` can never
 * drift apart the way three formation lists once did.
 */

/** @deprecated Use REGISTRATION_STATUSES. An EIN is one registration kind among several. */
export const EIN_STATUSES = REGISTRATION_STATUSES;
/** @deprecated Use RegistrationStatus. */
export type EinStatus = RegistrationStatus;
/** @deprecated Use REGISTRATION_TRANSITIONS. */
export const EIN_TRANSITIONS = REGISTRATION_TRANSITIONS;
/** @deprecated Use REGISTRATION_TERMINAL. */
export const EIN_TERMINAL = REGISTRATION_TERMINAL;
/** @deprecated Use canTransitionRegistration. */
export const canTransitionEin = canTransitionRegistration;
