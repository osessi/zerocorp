/**
 * @zerocorp/auth — Layer 3
 *
 * Sessions, identity and authorization policies. Implements the application layer's
 * authorization ports.
 *
 * Two rules this package exists to hold:
 *
 *   A session names a USER. It never names what that user may do — the role is read
 *   from memberships on every request, because a role baked into a cookie survives
 *   being revoked.
 *
 *   A tenant id never comes from a URL, a header or a form. It is resolved from the
 *   session and checked against a membership read in the same request (NN-2).
 */
export { hashPassword, verifyPassword, needsRehash, passwordProblem, MIN_PASSWORD_LENGTH } from "./password";
export {
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
  SESSION_REFRESH_DAYS,
  NotAuthenticatedError,
  NoAccessError,
  buildTenantContext,
  isExpired,
  shouldRefresh,
  atLeast,
  type SessionRecord,
  type Membership,
} from "./session";
