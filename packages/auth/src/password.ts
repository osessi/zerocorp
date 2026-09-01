import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * Password hashing, with scrypt from node:crypto.
 *
 * scrypt rather than a native argon2 binding, deliberately. Argon2id is the better
 * algorithm on paper; every JavaScript binding for it is a native module that has to
 * compile on every machine and in every container, and a login that breaks on a
 * deployment is worse than a KDF that is merely very good. scrypt is memory-hard, is in
 * the standard library, and is what OWASP names as the acceptable alternative.
 *
 * N = 2^16, r = 8, p = 1. Roughly 64MB and about 100ms per hash on a modern server,
 * which is the point: the cost is what makes a stolen hash table expensive to attack.
 *
 * The stored form carries its own parameters, so raising N later does not invalidate
 * every existing password. Old hashes keep verifying with the parameters they were made
 * with, and are upgraded the next time their owner signs in.
 */

const PARAMS = { N: 1 << 16, r: 8, p: 1, maxmem: 128 * 1024 * 1024 } as const;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

/**
 * Verifies a password.
 *
 * Returns false rather than throwing on a malformed stored hash. A corrupted row is an
 * operational problem; turning it into a 500 on the sign-in path tells an attacker which
 * accounts are broken.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, salt, key] = parts;
  const params = { N: Number(n), r: Number(r), p: Number(p), maxmem: PARAMS.maxmem };
  if (!Number.isInteger(params.N) || !Number.isInteger(params.r) || !Number.isInteger(params.p)) return false;

  const expected = Buffer.from(key ?? "", "base64");
  if (expected.length !== KEY_LENGTH) return false;

  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(salt ?? "", "base64"), KEY_LENGTH, params);
  return timingSafeEqual(actual, expected);
}

/** True when a hash was made with weaker parameters than the current ones. */
export function needsRehash(stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return true;
  return Number(parts[1]) < PARAMS.N;
}

/**
 * The minimum a password must clear.
 *
 * Length only, and that is a decision rather than laziness. Composition rules push
 * people toward "Password1!" and away from length, which is the property that actually
 * matters. NIST dropped them for the same reason.
 */
export const MIN_PASSWORD_LENGTH = 12;

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters. Length beats punctuation.`;
  }
  if (password.length > 512) return "That is longer than we can hash.";
  return null;
}
