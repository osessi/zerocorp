import { z } from "zod";
import { entityTypeCodeSchema, founderProfileSchema, registrationKindSchema } from "./jurisdiction";
import { eligibilityResultSchema } from "./eligibility";
import { countryCodeSchema } from "./country";
import { routingDecisionSchema, providerCodeSchema } from "./provider";
import { customerMoneySchema, costMoneySchema } from "./money";

/**
 * The request / order split — D14.
 *
 * A FORMATION REQUEST is what the customer asked for. It is provider-independent and
 * it survives every attempt to fulfil it.
 *
 * A FORMATION ORDER is one attempt to execute that request against ONE provider.
 *
 * The old schema had only the order, which meant a provider rejection had two bad
 * options: retry against the same provider, or invent a second order that pretended
 * to be a second customer request. Neither is true, and the audit trail carried the
 * lie. With the split, a rejected order stays as the record of a failed attempt and
 * the request is routed again.
 */

export const FORMATION_REQUEST_STATUSES = [
  "draft",
  "eligibility_checked",
  "routed",
  "executing",
  "fulfilled",
  "unfulfillable",
  "cancelled",
] as const;
export const formationRequestStatusSchema = z.enum(FORMATION_REQUEST_STATUSES);
export type FormationRequestStatus = z.infer<typeof formationRequestStatusSchema>;

export const FORMATION_REQUEST_TRANSITIONS = {
  draft: ["eligibility_checked", "cancelled"],
  eligibility_checked: ["routed", "unfulfillable", "draft", "cancelled"],
  // Re-routing is normal: a provider goes down, a fallback takes over.
  routed: ["executing", "eligibility_checked", "cancelled"],
  executing: ["fulfilled", "routed", "unfulfillable", "cancelled"],
  fulfilled: [],
  // Not terminal. "No provider can do this today" is a fact about today.
  unfulfillable: ["eligibility_checked", "cancelled"],
  cancelled: [],
} as const satisfies Record<FormationRequestStatus, readonly FormationRequestStatus[]>;

export const FORMATION_REQUEST_TERMINAL: readonly FormationRequestStatus[] = [
  "fulfilled",
  "cancelled",
];

export function canTransitionRequest(
  from: FormationRequestStatus,
  to: FormationRequestStatus,
): boolean {
  return (FORMATION_REQUEST_TRANSITIONS[from] as readonly FormationRequestStatus[]).includes(to);
}

export const formationRequestSchema = z.object({
  entityTypeCode: entityTypeCodeSchema,
  jurisdictionCode: z.string().min(1),
  proposedNames: z.array(z.string().min(1).max(160)).min(1).max(3),
  founder: founderProfileSchema,
  status: formationRequestStatusSchema,
  eligibility: z.array(eligibilityResultSchema).default([]),
  routing: routingDecisionSchema.nullable().default(null),
  /** What we quote the customer. USD in V1 — D15. */
  price: customerMoneySchema.nullable().default(null),
  /** What it costs us, in the currency the authority or provider bills. */
  governmentFee: costMoneySchema.nullable().default(null),
  providerFee: costMoneySchema.nullable().default(null),
});
export type FormationRequest = z.infer<typeof formationRequestSchema>;

/* ── Events ───────────────────────────────────────────────────────────────── */

/**
 * Everything that happened to an order, from any source.
 *
 * `externalEventId` is unique per provider, so a webhook replay and a polling loop
 * that both see the same transition write one row, not two. That property is what
 * lets a provider without webhooks be driven by polling with no change upstream.
 */
export const FORMATION_EVENT_SOURCES = ["provider", "operator", "system", "authority"] as const;
export const formationEventSourceSchema = z.enum(FORMATION_EVENT_SOURCES);

export const formationEventSchema = z.object({
  source: formationEventSourceSchema,
  providerCode: providerCodeSchema.nullable().default(null),
  externalEventId: z.string().max(200).nullable().default(null),
  kind: z.string().min(1).max(64),
  /**
   * The provider's own payload, kept for diagnosis. It is never rendered to a
   * customer and never used to derive a customer-facing status.
   */
  payload: z.record(z.unknown()).default({}),
  occurredAt: z.date(),
});
export type FormationEvent = z.infer<typeof formationEventSchema>;

/* ── Requests for information ─────────────────────────────────────────────── */

export const FORMATION_RFI_STATUSES = ["open", "answered", "withdrawn", "expired"] as const;
export const formationRfiStatusSchema = z.enum(FORMATION_RFI_STATUSES);
export type FormationRfiStatus = z.infer<typeof formationRfiStatusSchema>;

/**
 * An RFI, restated in ZeroCorp's words.
 *
 * `question` is what WE ask the customer. A provider's raw wording goes in the event
 * log, not here: it names the provider, uses its internal vocabulary, and is often
 * written for a filing agent rather than a founder.
 */
export const formationRfiSchema = z.object({
  question: z.string().min(1).max(1_000),
  requiredDocuments: z.array(z.string().max(64)).max(8).default([]),
  status: formationRfiStatusSchema,
  dueAt: z.date().nullable().default(null),
});
export type FormationRfi = z.infer<typeof formationRfiSchema>;

/* ── Documents ────────────────────────────────────────────────────────────── */

/**
 * Document types, jurisdiction-neutral by intent.
 *
 * `certificate_of_formation` covers a US certificate and a UK certificate of
 * incorporation. `governing_document` covers an operating agreement, articles of
 * association and an LLP agreement. The customer sees a localised label; the code
 * branches on the role the document plays, which is the same everywhere.
 */
export const FORMATION_DOCUMENT_TYPES = [
  "certificate_of_formation",
  "governing_document",
  "registration_certificate",
  "identity_document",
  "proof_of_address",
  "signature",
  "authority_correspondence",
] as const;
export const formationDocumentTypeSchema = z.enum(FORMATION_DOCUMENT_TYPES);
export type FormationDocumentType = z.infer<typeof formationDocumentTypeSchema>;

export const formationDocumentSchema = z.object({
  type: formationDocumentTypeSchema,
  /** A key in a PRIVATE bucket. Never a public URL, never a signed URL at rest. */
  storageKey: z.string().min(1),
  issuedAt: z.date().nullable().default(null),
  retentionUntil: z.date().nullable().default(null),
});
export type FormationDocument = z.infer<typeof formationDocumentSchema>;

/* ── Company registrations ────────────────────────────────────────────────── */

export const companyRegistrationSchema = z.object({
  kind: registrationKindSchema,
  authority: z.string().min(1).max(80),
  /** The EIN, the UTR, the VAT number. Sensitive: never logged. */
  identifier: z.string().max(64).nullable().default(null),
  requestedAt: z.date().nullable().default(null),
  issuedAt: z.date().nullable().default(null),
});
export type CompanyRegistration = z.infer<typeof companyRegistrationSchema>;

/**
 * The formation intake, as a founder fills it.
 *
 * Five questions the product had never asked. Residency leads because it gates: it
 * decides sanctions screening, which EIN path applies, which jurisdiction is recommended,
 * and it is the primary fraud signal when it disagrees with the card and IP country.
 *
 * It lives in contracts, not in the app, because an app is a thin adapter and a schema in
 * a route handler is a schema no other caller can reuse.
 */
export const formationIntakeSchema = z.object({
  entityTypeCode: z.string().min(1).max(40),
  jurisdictionCode: z.string().min(2).max(8),
  /** Where the founder LIVES. Never inferred from where they sell. */
  residencyCountry: countryCodeSchema,
  proposedNames: z.array(z.string().trim().min(1).max(120)).min(1).max(3),
  ownerCount: z.coerce.number().int().min(1).max(50),
  /** An SSN or ITIN. Decides whether the EIN takes a day or two months. */
  hasUsTaxId: z.boolean(),
  wantsExternalInvestment: z.boolean(),
  targetMarkets: z.array(countryCodeSchema).min(1).max(12),
});
export type FormationIntake = z.infer<typeof formationIntakeSchema>;
