import type { AccessMode, Role, TenantContext } from "@zerocorp/contracts";
import { requestIdSchema, tenantIdSchema, userIdSchema } from "@zerocorp/contracts";

/**
 * Sessions.
 *
 * The cookie carries an opaque 256-bit token; only its SHA-256 digest is stored, so a
 * database dump hands an attacker nothing they can present. Token generation and hashing
 * live in @zerocorp/security, which is the one place those primitives are written.
 *
 * A session names a user. It does NOT name what that user may do: the role is read from
 * `memberships` on every request. A role baked into a cookie survives being revoked,
 * which is the whole problem with putting authorisation in a token.
 */

export const SESSION_COOKIE = "zc_session";
export const SESSION_TTL_DAYS = 30;
/** Re-issued when the session is older than this, so an active user is never signed out. */
export const SESSION_REFRESH_DAYS = 7;

export interface SessionRecord {
  readonly userId: string;
  readonly activeTenantId: string | null;
  readonly expiresAt: Date;
  readonly lastSeenAt: Date;
}

export interface Membership {
  readonly tenantId: string;
  readonly role: Role;
  readonly status: string;
}

export class NotAuthenticatedError extends Error {
  override readonly name = "NotAuthenticatedError";
  constructor() {
    super("Sign in to continue");
  }
}

export class NoAccessError extends Error {
  override readonly name = "NoAccessError";
  constructor() {
    // Says nothing about whether the tenant exists. "You do not have access to tenant X"
    // confirms that tenant X exists, which is a fact worth not confirming.
    super("Not found");
  }
}

/**
 * Builds the TenantContext from a session and the memberships that session actually has.
 *
 * The tenant id is never taken from a URL, a header or a form. It is resolved from the
 * session's active tenant and then checked against a membership read in this request.
 * NN-2: never pass a client-controlled tenant id into a privileged operation.
 */
export function buildTenantContext(input: {
  session: SessionRecord;
  memberships: readonly Membership[];
  requestId: string;
  accessMode: AccessMode;
  /** A tenant the user asked to switch to. Checked, never trusted. */
  requestedTenantId?: string;
}): TenantContext {
  const wanted = input.requestedTenantId ?? input.session.activeTenantId;
  if (!wanted) throw new NoAccessError();

  const membership = input.memberships.find((m) => m.tenantId === wanted && m.status === "active");
  if (!membership) throw new NoAccessError();

  return {
    tenantId: tenantIdSchema.parse(membership.tenantId),
    userId: userIdSchema.parse(input.session.userId),
    role: membership.role,
    requestId: requestIdSchema.parse(input.requestId),
    accessMode: input.accessMode,
  };
}

export function isExpired(session: SessionRecord, now: Date): boolean {
  return session.expiresAt.getTime() <= now.getTime();
}

export function shouldRefresh(session: SessionRecord, now: Date): boolean {
  const age = now.getTime() - session.lastSeenAt.getTime();
  return age > SESSION_REFRESH_DAYS * 86_400_000;
}

/**
 * Who may do what.
 *
 * Four roles, and the ladder is total: an owner can do anything an admin can, and so on
 * down. Privileges that do not fit a ladder are not roles, they are separate grants, and
 * inventing a fifth role to express one is how permission models rot.
 */
const RANK: Record<Role, number> = { owner: 3, admin: 2, member: 1, viewer: 0 };

export function atLeast(role: Role | undefined, required: Role): boolean {
  if (!role) return false;
  return RANK[role] >= RANK[required];
}
