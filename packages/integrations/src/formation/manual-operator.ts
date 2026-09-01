import {
  FORMATION_ORDER_STATUSES,
  type FormationEvent,
  type FormationOrderStatus,
  type ProviderCapabilities,
  type ProviderOrderStatus,
} from "@zerocorp/contracts";
import type {
  DocumentUpload,
  FormationProvider,
  ProviderFormationRef,
  ProviderPackage,
  RfiAnswer,
} from "@zerocorp/application";

/**
 * The operator provider.
 *
 * A first-class provider, not a mock and not a fallback hack. It represents the case
 * where a ZeroCorp operator does the filing by hand, which is what
 * PRODUCT_SPEC.md §21 says V1 actually is, and what D17 says the UK is until a partner
 * is contracted.
 *
 * Modelling it as a provider rather than as a special case has one large consequence:
 * every jurisdiction can ship the day its catalog row exists. Routing, orders, events,
 * RFIs and documents all work; only the execution is human. When an API adapter
 * arrives, it slots into the same port and the code above it does not change.
 *
 * It is also the only provider whose capabilities we can VERIFY without a contract,
 * because it depends on nobody else. That is why it is the only verified coverage in
 * the seeded catalog.
 */

const VALID = new Set<string>(FORMATION_ORDER_STATUSES);

export interface OperatorQueue {
  /** Puts the order in front of a human. Implemented by @zerocorp/notifications. */
  enqueue(input: { orderId: string; kind: string; detail: Record<string, unknown> }): Promise<void>;
}

export interface ManualOperatorOptions {
  readonly queue: OperatorQueue;
  readonly idGenerator: { next(): string };
}

export class ManualOperatorProvider implements FormationProvider {
  readonly code = "manual_operator";

  constructor(private readonly options: ManualOperatorOptions) {}

  async getCapabilities(): Promise<ProviderCapabilities> {
    return {
      code: this.code,
      name: "ZeroCorp operator",
      status: "active",
      features: {
        // No webhooks and no polling: there is no external system to poll. The operator
        // moves the order, and saying so honestly is what stops a worker from spinning
        // on an endpoint that does not exist.
        webhooks: false,
        sandbox: false,
        statusPolling: false,
        documentRetrieval: true,
        rfi: true,
        cancellation: true,
        registeredAgent: false,
        taxIdFiling: true,
        identityVerification: false,
      },
      // A human either does the work or does not. There is no third party to be flaky.
      reliabilityScore: 1,
      coverage: [],
    };
  }

  /** The catalog decides. An operator can file anything ZeroCorp lists. */
  async getEligibleEntities(): Promise<readonly string[]> {
    return [];
  }

  /** No wholesale packages: the price is ZeroCorp's own. */
  async getPackages(): Promise<readonly ProviderPackage[]> {
    return [];
  }

  async createFormation(): Promise<ProviderFormationRef> {
    return { providerCode: this.code, externalId: `op_${this.options.idGenerator.next()}` };
  }

  async submitFormation(ref: ProviderFormationRef): Promise<void> {
    await this.options.queue.enqueue({
      orderId: ref.externalId,
      kind: "formation.file",
      detail: { instruction: "File this formation with the authority." },
    });
  }

  /**
   * There is no external system holding a status.
   *
   * Returning a fabricated "pending" would be a lie the order machine then acts on.
   * The order's own status is authoritative for this provider, and the caller already
   * has it.
   */
  async getFormationStatus(): Promise<ProviderOrderStatus> {
    return { raw: "", observedAt: new Date() };
  }

  async uploadDocument(ref: ProviderFormationRef, document: DocumentUpload): Promise<void> {
    await this.options.queue.enqueue({
      orderId: ref.externalId,
      kind: "formation.document.received",
      // The bytes are NOT put on the queue. They are already in the private bucket, and
      // a document body in a queue payload is a document body in a log.
      detail: { type: document.type, filename: document.filename },
    });
  }

  async getDocuments(): Promise<readonly never[]> {
    return [];
  }

  async handleRfi(ref: ProviderFormationRef, answer: RfiAnswer): Promise<void> {
    await this.options.queue.enqueue({
      orderId: ref.externalId,
      kind: "formation.rfi.answered",
      detail: { rfiId: answer.rfiId, documentCount: answer.documents.length },
    });
  }

  async cancelFormation(ref: ProviderFormationRef, reason: string): Promise<void> {
    await this.options.queue.enqueue({
      orderId: ref.externalId,
      kind: "formation.cancel",
      detail: { reason },
    });
  }

  /** Nothing arrives on its own. An operator's actions are recorded where they happen. */
  async getEvents(): Promise<readonly FormationEvent[]> {
    return [];
  }

  /**
   * The operator works in ZeroCorp's own vocabulary, so translation is the identity
   * function over valid statuses — and null for anything else.
   *
   * The null branch is not dead code. It is what stops a typo in an admin form from
   * setting an order to a state that does not exist.
   */
  translateStatus(raw: string): FormationOrderStatus | null {
    return VALID.has(raw) ? (raw as FormationOrderStatus) : null;
  }
}
