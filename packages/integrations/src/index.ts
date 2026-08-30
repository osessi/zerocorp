/**
 * @zerocorp/integrations — Layer 3
 *
 * Every external SDK lives here and nowhere else: payments, company formation,
 * domains and DNS, email infrastructure, social publishers, identity verification.
 *
 * The rest of the codebase depends on the application-layer port, never on a
 * vendor SDK, so a provider can be replaced without touching the domain.
 */
export const INTEGRATIONS_PACKAGE = "@zerocorp/integrations" as const;
