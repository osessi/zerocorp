import type {
  CompanyRegistration,
  EligibilityRule,
  EntityType,
  FormationDocument,
  FormationEvent,
  FormationRequest,
  FormationRfi,
  FormationOrderStatus,
  Jurisdiction,
  ProviderCapabilities,
  ProviderOrderStatus,
  TenantContext,
} from "@zerocorp/contracts";

/**
 * The FormationProvider port — D14.
 *
 * ZeroCorp owns the abstraction; a provider implements it. The business layer talks
 * only to this interface and never imports a provider SDK, which is enforced by
 * dependency-cruiser and by ESLint, not by memory.
 *
 * The rule that makes the abstraction hold rather than leak: `translateStatus` is the
 * ONLY place a provider's own vocabulary is allowed, and it converts it into a
 * FormationOrderStatus. A provider's raw string never crosses this boundary in any
 * other direction, and never reaches a customer at all.
 */

/** An opaque handle to whatever the provider calls this formation on its side. */
export interface ProviderFormationRef {
  readonly providerCode: string;
  readonly externalId: string;
}

export interface ProviderPackage {
  readonly code: string;
  readonly name: string;
  readonly includes: readonly string[];
  readonly priceMinor: number;
  readonly priceCurrency: string;
}

export interface DocumentUpload {
  readonly type: FormationDocument["type"];
  readonly filename: string;
  readonly contentType: string;
  readonly bytes: Uint8Array;
}

export interface RfiAnswer {
  readonly rfiId: string;
  readonly answer: string;
  readonly documents: readonly DocumentUpload[];
}

export interface FormationProvider {
  readonly code: string;

  getCapabilities(): Promise<ProviderCapabilities>;
  getEligibleEntities(founder: FormationRequest["founder"]): Promise<readonly string[]>;
  getPackages(entityTypeCode: string): Promise<readonly ProviderPackage[]>;

  createFormation(request: FormationRequest): Promise<ProviderFormationRef>;
  submitFormation(ref: ProviderFormationRef): Promise<void>;
  getFormationStatus(ref: ProviderFormationRef): Promise<ProviderOrderStatus>;

  uploadDocument(ref: ProviderFormationRef, document: DocumentUpload): Promise<void>;
  getDocuments(ref: ProviderFormationRef): Promise<readonly FormationDocument[]>;

  handleRfi(ref: ProviderFormationRef, answer: RfiAnswer): Promise<void>;
  cancelFormation(ref: ProviderFormationRef, reason: string): Promise<void>;

  /**
   * Events since a point in time. A provider WITHOUT webhooks is driven by polling
   * this; a provider with them delivers the same shape. Nothing upstream changes,
   * which is why `features.webhooks` is a flag rather than two code paths.
   */
  getEvents(since: Date): Promise<readonly FormationEvent[]>;

  /**
   * The one place a provider's vocabulary is allowed.
   *
   * Returning null means "this status has no ZeroCorp equivalent" — which is
   * information, not a failure. It is logged as an event and the order stays where it
   * is, rather than being moved to a state someone guessed at.
   */
  translateStatus(raw: string): FormationOrderStatus | null;
}

/** Reads the catalog. Implemented by @zerocorp/db. */
export interface FormationCatalog {
  listJurisdictions(): Promise<readonly Jurisdiction[]>;
  listEntityTypes(jurisdictionCode?: string): Promise<readonly EntityType[]>;
  getEntityType(code: string, jurisdictionCode: string): Promise<EntityType | null>;
  listEligibilityRules(entityTypeCode: string): Promise<readonly EligibilityRule[]>;
  listProviderCapabilities(): Promise<readonly ProviderCapabilities[]>;
}

/** Tenant-owned formation state. Every method takes a TenantContext; there is no other door. */
export interface FormationRepository<TTx = unknown> {
  createRequest(tx: TTx, ctx: TenantContext, request: FormationRequest): Promise<string>;
  getRequest(tx: TTx, ctx: TenantContext, requestId: string): Promise<FormationRequest | null>;
  updateRequest(tx: TTx, ctx: TenantContext, requestId: string, patch: Partial<FormationRequest>): Promise<void>;

  createOrder(tx: TTx, ctx: TenantContext, input: {
    requestId: string;
    providerCode: string;
    status: FormationOrderStatus;
  }): Promise<string>;
  setOrderStatus(tx: TTx, ctx: TenantContext, orderId: string, status: FormationOrderStatus, reason?: string): Promise<void>;
  setOrderProviderRef(tx: TTx, ctx: TenantContext, orderId: string, providerRef: string): Promise<void>;

  appendEvent(tx: TTx, ctx: TenantContext, orderId: string, event: FormationEvent): Promise<void>;
  openRfi(tx: TTx, ctx: TenantContext, orderId: string, rfi: FormationRfi): Promise<string>;
  answerRfi(tx: TTx, ctx: TenantContext, rfiId: string, answer: string): Promise<void>;

  recordDocument(tx: TTx, ctx: TenantContext, document: FormationDocument & { orderId?: string; companyId?: string }): Promise<string>;
  createCompany(tx: TTx, ctx: TenantContext, input: {
    legalName: string;
    jurisdictionCode: string;
    entityTypeCode: string | null;
    origin: "formed_by_zerocorp" | "imported";
    status: "pending" | "active";
  }): Promise<string>;
  upsertRegistration(tx: TTx, ctx: TenantContext, companyId: string, registration: CompanyRegistration): Promise<void>;
}

/** Resolves a provider code to its adapter. Implemented in each app's composition root. */
export interface FormationProviderRegistry {
  get(code: string): FormationProvider;
  all(): readonly FormationProvider[];
}
