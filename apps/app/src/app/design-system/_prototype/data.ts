/**
 * Invented ZeroCorp data for the pattern prototypes.
 *
 * Not fixtures, not seeds, not product code. It exists so the layout patterns can be
 * reviewed against realistic ZeroCorp content — formation states, plans, documents and
 * agent activity — rather than against lorem ipsum, which hides density problems.
 */
import type { FormationOrderStatus } from "@zerocorp/contracts";

/*
  The formation states are IMPORTED, never re-declared.

  This file used to spell out its own eight-state list, and it silently contradicted the
  new machine the moment D2 was decided — a prototype quietly teaching a state that no
  longer exists. Found by the contradiction sweep, 2026-08-31.

  packages/contracts/src/formation.ts is the source of truth. A CI rule now forbids
  hard-coding these strings anywhere else.
*/
export type FormationState = FormationOrderStatus;

export const FORMATION_LABEL: Record<FormationState, string> = {
  draft: "Draft",
  collecting_documents: "Collecting documents",
  verifying_identity: "Verifying identity",
  operator_review: "In review",
  ready_to_file: "Ready to file",
  filed: "Filed",
  formed: "Formed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "processing";

export const FORMATION_TONE: Record<FormationState, Tone> = {
  draft: "neutral",
  collecting_documents: "info",
  verifying_identity: "processing",
  operator_review: "processing",
  ready_to_file: "info",
  filed: "processing",
  formed: "success",
  // Reparable, not terminal — but it needs the founder to act, so it reads as danger.
  rejected: "danger",
  cancelled: "neutral",
};

export type Plan = "Launch" | "Growth" | "Autopilot";

export interface Business {
  id: string;
  name: string;
  founder: string;
  email: string;
  phone: string;
  state: "Wyoming" | "Delaware" | "New Mexico" | "Florida";
  plan: Plan;
  mrrCents: number;
  progress: number;
  formation: FormationState;
  owners: string[];
}

export const BUSINESSES: Business[] = [
  { id: "b1", name: "Northbridge Studio LLC", founder: "Amara Osei", email: "amara@northbridge.studio", phone: "+234 803 555 0142", state: "Wyoming", plan: "Growth", mrrCents: 39900, progress: 82, formation: "filed", owners: ["AO", "TK"] },
  { id: "b2", name: "Kaya Collective LLC", founder: "Rafael Duarte", email: "rafael@kayacollective.co", phone: "+55 11 95555 0118", state: "Delaware", plan: "Autopilot", mrrCents: 79900, progress: 100, formation: "formed", owners: ["RD"] },
  { id: "b3", name: "Meridian Advisory LLC", founder: "Priya Raghunathan", email: "priya@meridian.advisory", phone: "+91 98 5555 0173", state: "Wyoming", plan: "Launch", mrrCents: 9900, progress: 34, formation: "collecting_documents", owners: ["PR", "SM", "JL"] },
  { id: "b4", name: "Atlas Freight Partners LLC", founder: "Deniz Yilmaz", email: "deniz@atlasfreight.io", phone: "+90 532 555 0190", state: "New Mexico", plan: "Growth", mrrCents: 39900, progress: 61, formation: "filed", owners: ["DY", "MK"] },
  { id: "b5", name: "Sable & Vine LLC", founder: "Chiara Bellini", email: "chiara@sableandvine.com", phone: "+39 340 555 0126", state: "Florida", plan: "Launch", mrrCents: 9900, progress: 12, formation: "draft", owners: ["CB"] },
  { id: "b6", name: "Halcyon Labs LLC", founder: "Tobias Lindqvist", email: "tobias@halcyonlabs.dev", phone: "+46 70 555 0155", state: "Delaware", plan: "Autopilot", mrrCents: 79900, progress: 94, formation: "formed", owners: ["TL", "AO"] },
  { id: "b7", name: "Verano Trading LLC", founder: "Lucía Fernández", email: "lucia@veranotrading.mx", phone: "+52 55 5555 0134", state: "Wyoming", plan: "Growth", mrrCents: 39900, progress: 47, formation: "operator_review", owners: ["LF", "RD"] },
];

export interface ActivityEvent {
  id: string;
  actor: string;
  action: string;
  object?: string;
  at: string;
  kind: "person" | "agent" | "system";
  chip?: string;
  transition?: [string, string];
}

export const ACTIVITY: ActivityEvent[] = [
  { id: "a1", actor: "Writer agent", action: "published", object: "3 articles to the blog", at: "Today 09:12", kind: "agent", chip: "Auto-published" },
  { id: "a2", actor: "Formation", action: "moved the company forward", at: "Today 08:40", kind: "system", transition: ["Filed", "EIN pending"] },
  { id: "a3", actor: "Amara Osei", action: "uploaded", object: "Proof of address", at: "Yesterday 17:26", kind: "person" },
  { id: "a4", actor: "Domain", action: "verified", object: "northbridge.studio", at: "Yesterday 11:03", kind: "system", chip: "DNS propagated" },
];

export interface TaskItem {
  id: string;
  title: string;
  detail: string;
  due: string;
  creator: string;
  done: boolean;
  priority?: string;
}

export const TASKS: TaskItem[] = [
  { id: "t1", title: "Collect passport scan", detail: "Required before the Wyoming filing can be submitted.", due: "Today 12:00", creator: "You", done: true },
  { id: "t2", title: "Submit Wyoming articles of organization", detail: "Registered agent confirmed. Filing fee $100.", due: "Today 17:00", creator: "Operations", done: false, priority: "Blocking" },
  { id: "t3", title: "Request EIN from the IRS", detail: "Form SS-4 for a foreign-owned single-member LLC.", due: "3 Sep, 09:00", creator: "Operations", done: false },
];

export const TASK_HISTORY: TaskItem[] = [
  { id: "h1", title: "Verify founder identity documents", detail: "Passport and proof of address matched.", due: "28 Aug 14:20", creator: "Operations", done: true },
];

export interface DocumentItem {
  id: string;
  kind: DocumentKind;
  title: string;
  file: string;
  size: string;
  date: string;
  state: "accepted" | "pending" | "owed";
}

/**
 * A document has a KIND, and the kind decides its icon and its colour.
 *
 * Every row used the same grey FileText tile, so a passport, a utility bill and a
 * certificate of formation were visually one thing. These are the five most consequential
 * pieces of paper a founder hands over, and the eye should be able to find the passport
 * without reading.
 */
export type DocumentKind = "identity" | "address" | "formation" | "agreement" | "tax";

export const DOCUMENTS: DocumentItem[] = [
  { id: "d1", kind: "identity", title: "Passport, founder", file: "passport.pdf", size: "2.4 MB", date: "24 Aug, 2026", state: "accepted" },
  { id: "d2", kind: "address", title: "Proof of address", file: "utility-bill.pdf", size: "1.1 MB", date: "26 Aug, 2026", state: "accepted" },
  { id: "d3", kind: "formation", title: "Articles of organization", file: "articles-wy.pdf", size: "480 KB", date: "29 Aug, 2026", state: "pending" },
  { id: "d4", kind: "agreement", title: "Operating agreement", file: "operating-agreement.pdf", size: "820 KB", date: "29 Aug, 2026", state: "pending" },
  { id: "d5", kind: "tax", title: "EIN confirmation letter (CP 575)", file: "not yet issued", size: "", date: "Awaiting IRS", state: "owed" },
];

/** Kind to tile. Violet is identity, which is also the hue the product uses for machines,
    so identity gets it here only because nothing else on this screen competes. */
export const DOCUMENT_TILE: Record<DocumentKind, string> = {
  identity: "bg-ai-subtle border-ai text-ai-ink",
  address: "bg-info-subtle border-info text-info-ink",
  formation: "bg-processing-subtle border-processing text-processing-ink",
  agreement: "bg-warning-subtle border-warning text-warning-ink",
  tax: "bg-success-subtle border-success text-success-ink",
};

/**
 * A document's state, and the tone it reads as.
 *
 * `pending` was --processing, the brand teal, which said "we are working" when it means
 * "this is waiting on a human". Yellow is the honest colour for that. `owed` was warning;
 * a document we do not have is what blocks a filing, so it is danger.
 */
export const DOCUMENT_STATE: Record<string, { tone: Tone; label: string }> = {
  accepted: { tone: "success", label: "Accepted" },
  pending: { tone: "warning", label: "In review" },
  owed: { tone: "danger", label: "Owed" },
};

export const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ── Record vocabulary ────────────────────────────────────────────────────────
   These live here, not in a screen, because the table and the drawer must agree.
   A founder who learns "Wyoming is violet" in the list and finds it grey in the drawer
   has learned nothing; the mapping is only worth having if it is the same everywhere.  */

/** Four states, four colours. Stable per state, so the mapping is learnable. */
export const STATE_TONE: Record<string, string> = {
  Wyoming: "bg-ai-subtle border-ai text-ai-ink",
  Delaware: "bg-info-subtle border-info text-info-ink",
  "New Mexico": "bg-warning-subtle border-warning text-warning-ink",
  Florida: "bg-success-subtle border-success text-success-ink",
};

/** The plans ladder from quiet to loud, matching what each tier actually does. */
export const PLAN_TONE: Record<string, string> = {
  Launch: "border-border text-muted-foreground",
  Growth: "bg-processing-subtle border-processing text-processing-ink",
  Autopilot: "bg-ai-subtle border-ai text-ai-ink",
};

/** The ink each record field uses, so a heading and a drawer label agree. */
export const FIELD_INK: Record<string, string> = {
  Business: "text-foreground",
  Founder: "text-info-on-muted",
  State: "text-ai-ink",
  Plan: "text-processing-ink",
  MRR: "text-success-ink",
  Team: "text-warning-ink",
  Progress: "text-destructive-on-muted",
  Formation: "text-muted-foreground",
};

/**
 * The progress thresholds, in one place because two screens draw this bar.
 *
 *   under 50   this is behind
 *   under 75   this is moving
 *   75 and up  this will land
 *
 * The drawer had its own bar filled with --primary at every value, so a formation at 12%
 * and one at 94% looked equally healthy. A rule copied into two files is a rule that will
 * disagree with itself.
 */
export function progressTone(value: number): "danger" | "warning" | "success" {
  return value < 50 ? "danger" : value < 75 ? "warning" : "success";
}

export const PROGRESS_FILL: Record<"danger" | "warning" | "success", string> = {
  danger: "bg-destructive",
  warning: "bg-warning",
  success: "bg-success",
};

export const PROGRESS_INK: Record<"danger" | "warning" | "success", string> = {
  danger: "text-destructive-ink",
  warning: "text-warning-ink",
  success: "text-success-ink",
};
