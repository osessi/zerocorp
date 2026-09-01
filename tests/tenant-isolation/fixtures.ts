/**
 * One row per tenant-owned table.
 *
 * Every table declared through tenantTable() must appear here. The suite asserts that,
 * so adding a tenant-owned table without an isolation case fails the build rather than
 * shipping an unprotected table.
 *
 * Columns are written as raw SQL rather than through Drizzle on purpose: this suite is
 * checking what POSTGRES does, and going through the ORM would test our query builder
 * as much as the policy.
 */
export interface Fixture {
  /**
   * Columns beyond tenant_id, for insert number `seq`.
   *
   * A function rather than a literal because several tables carry unique constraints,
   * and a fixture that inserts the same values twice fails for a reason that has
   * nothing to do with tenancy — which is exactly the kind of noise that gets an
   * isolation failure dismissed as "just the fixture".
   */
  readonly columns: (seq: number) => Record<string, unknown>;
}

/** Deterministic, distinct uuid per sequence number. */
function uuidFor(seq: number): string {
  return `00000000-0000-4000-8000-${String(seq).padStart(12, "0")}`;
}

export function fixtures(catalog: { entityTypeId: string }): Record<string, Fixture> {
  const col = (fn: (seq: number) => Record<string, unknown>): Fixture => ({ columns: fn });
  return {
    business_profiles: col(() => ({ business_name: "Acme" })),
    business_plans: col(() => ({ title: "Launch plan", summary: "Do the thing.", setup_path: "launch", subscription_plan: "growth" })),
    business_plan_steps: col((seq) => ({
        plan_id: uuidFor(seq), step_key: `form_company_${seq}`, position: 1, title: "Form",
        outcome: "A company", rationale: "Because", phase: "build", category: "company",
      })),
    subscriptions: col(() => ({ plan: "growth", status: "active" })),
    payment_events: col((seq) => ({ provider: "stripe", external_event_id: `evt_${seq}`, event_type: "invoice.paid", payload_hash: "h", status: "processed" })),
    credit_ledger: col(() => ({ delta: 100, reason: "signup_grant" })),
    usage_events: col(() => ({ feature: "business_architect" })),
    agent_runs: col(() => ({ agent_type: "business_architect", trigger: "assessment", status: "succeeded" })),
    activity_events: col(() => ({ event_type: "company.formed", actor_type: "system" })),
    audit_logs: col(() => ({ actor_type: "user", action: "document.viewed" })),

    companies: col(() => ({ legal_name: "Acme LLC", jurisdiction_code: "us-wy", entity_type_id: catalog.entityTypeId })),
    company_registrations: col((seq) => ({ company_id: uuidFor(seq), kind: "tax_id", authority: "IRS" })),
    formation_requests: col(() => ({ entity_type_id: catalog.entityTypeId, jurisdiction_code: "us-wy" })),
    formation_orders: col((seq) => ({ request_id: uuidFor(seq), provider_code: "manual_operator" })),
    formation_events: col((seq) => ({ order_id: uuidFor(seq), source: "system", kind: "order.created" })),
    formation_documents: col(() => ({ type: "certificate_of_formation", storage_key: "identity/a/cert.pdf" })),
    formation_rfis: col((seq) => ({ order_id: uuidFor(seq), question: "Please confirm your address." })),
  };
}
