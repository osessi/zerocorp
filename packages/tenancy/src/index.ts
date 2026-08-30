/**
 * @zerocorp/tenancy — Layer 3
 *
 * Tenant resolution and context propagation.
 *
 * Resolves host -> tenant from a cached map at the edge, never from the database
 * on the hot path, and never from a client-supplied value. Builds the
 * TenantContext that @zerocorp/db requires.
 */
export const TENANCY_PACKAGE = "@zerocorp/tenancy" as const;
