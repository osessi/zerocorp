import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Opaque bearer tokens — the assessment token, the session token.
 *
 * Two properties, both non-negotiable:
 *
 *   1. Generated from a CSPRNG, never from a timestamp, a counter or a uuid. 32 bytes
 *      is 256 bits of entropy, which is not guessable at any rate an attacker can reach.
 *   2. Only the SHA-256 DIGEST is stored. A dump of the database hands an attacker
 *      nothing they can present as a token.
 *
 * SHA-256 rather than a password hash on purpose. A password is low-entropy and needs
 * to be slow to attack; a 256-bit random token is not brute-forceable, and making the
 * lookup slow would only make every request slow.
 */

const TOKEN_BYTES = 32;

export interface IssuedToken {
  /** Returned to the caller exactly once. Never stored, never logged. */
  readonly token: string;
  /** What goes in the database. */
  readonly hash: string;
}

export function generateToken(): IssuedToken {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Constant-time comparison, for the rare case where two digests are compared in
 * application code rather than by an indexed lookup.
 */
export function tokensMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** The shape the application layer asks for, so it never imports node:crypto. */
export const tokenService = {
  generate: generateToken,
  hash: hashToken,
};
