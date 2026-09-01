import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import {
  NoAccessError,
  NotAuthenticatedError,
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
  buildTenantContext,
  isExpired,
  shouldRefresh,
} from "@zerocorp/auth";
import { generateToken, hashToken } from "@zerocorp/security";
import type { TenantContext } from "@zerocorp/contracts";
import { getIdentityRepository, getSystemUnitOfWork } from "./container";

/**
 * The session, per request.
 *
 * Two rules this file exists to hold, and both are cheap to break by accident:
 *
 *   The cookie names a USER. The role comes from `memberships`, read here, on every
 *   request. A role baked into a cookie survives being revoked.
 *
 *   The tenant id never arrives from a URL, a header or a form. It is resolved from the
 *   session and checked against a membership read in the same request — NN-2.
 *
 * The cookie is httpOnly, sameSite lax and secure outside development. Lax rather than
 * strict because a founder following a link from their own email should not land signed
 * out, and every state-changing path here is a POST that a cross-site GET cannot reach.
 */

const DAY_MS = 86_400_000;

export interface Viewer {
  readonly ctx: TenantContext;
  readonly memberships: readonly { tenantId: string; tenantName: string; role: string }[];
}

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    expires: expiresAt,
  };
}

/** Issues a session and sets the cookie. Called after a sign-in or a conversion. */
export async function startSession(userId: string, activeTenantId: string | null): Promise<void> {
  const { token, hash } = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * DAY_MS);

  await getSystemUnitOfWork().withSystem(`session-${Date.now()}`, (tx) =>
    getIdentityRepository().createSession(tx, { userId, tokenHash: hash, activeTenantId, expiresAt }),
  );

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await getSystemUnitOfWork().withSystem(`signout-${Date.now()}`, (tx) =>
      getIdentityRepository().deleteSession(tx, hashToken(token)),
    );
  }
  jar.delete(SESSION_COOKIE);
}

/**
 * The current viewer, or null.
 *
 * Returns null rather than throwing, so a page can decide between redirecting and
 * rendering a signed-out view. `requireViewer` is the throwing version.
 */
export async function getViewer(): Promise<Viewer | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const now = new Date();
  const identity = getIdentityRepository();

  const found = await getSystemUnitOfWork().withSystem(`viewer-${Date.now()}`, async (tx) => {
    const session = await identity.findSessionByTokenHash(tx, tokenHash);
    if (!session) return null;
    if (isExpired(session, now)) {
      // Cleaned up on the way past. An expired row that nobody deletes is a row that
      // stays in the table forever.
      await identity.deleteSession(tx, tokenHash);
      return null;
    }
    if (shouldRefresh(session, now)) {
      await identity.touchSession(tx, tokenHash, {
        expiresAt: new Date(now.getTime() + SESSION_TTL_DAYS * DAY_MS),
        lastSeenAt: now,
      });
    }
    return { session, memberships: await identity.listMemberships(tx, session.userId) };
  });

  if (!found) return null;

  // A user with a session but no active tenant yet — mid-conversion, or every membership
  // revoked. Not an error, just nothing to show.
  const active = found.session.activeTenantId ?? found.memberships[0]?.tenantId ?? null;
  if (!active) return null;

  try {
    const ctx = buildTenantContext({
      session: found.session,
      memberships: found.memberships,
      requestId: randomUUID(),
      accessMode: "read-write",
      requestedTenantId: active,
    });
    return { ctx, memberships: found.memberships };
  } catch (cause) {
    if (cause instanceof NoAccessError) return null;
    throw cause;
  }
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new NotAuthenticatedError();
  return viewer;
}
