"use server";

import { redirect } from "next/navigation";
import { needsRehash, hashPassword, verifyPassword } from "@zerocorp/auth";
import { getIdentityRepository, getSystemUnitOfWork } from "../../server/container";
import { startSession } from "../../server/session";

/**
 * Signing in.
 *
 * The failure message is the same whether the email is unknown or the password is wrong.
 * Two different messages turn the form into an account enumerator, and an attacker who
 * knows which addresses have accounts has half of a credential-stuffing run already done.
 *
 * A password is verified even when no user was found, against a throwaway hash, so the
 * response takes the same time either way. Without it the timing says what the message
 * refuses to.
 */
const SAME_ANSWER = "That email and password do not match.";

let decoyHash: string | null = null;
async function decoy(): Promise<string> {
  decoyHash ??= await hashPassword("a password nobody has, used only to burn the same time");
  return decoyHash;
}

export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string } | never> {
  const address = email.trim().toLowerCase();
  const identity = getIdentityRepository();

  const found = await getSystemUnitOfWork().withSystem(`signin-${Date.now()}`, async (tx) => {
    const user = await identity.findUserByEmail(tx, address);
    if (!user || !user.passwordHash) return null;
    return { user, memberships: await identity.listMemberships(tx, user.id) };
  });

  if (!found) {
    await verifyPassword(password, await decoy());
    return { ok: false, error: SAME_ANSWER };
  }

  if (!(await verifyPassword(password, found.user.passwordHash!))) {
    return { ok: false, error: SAME_ANSWER };
  }

  // Upgraded on the way past, so raising the cost never locks anyone out and never
  // requires a migration.
  if (needsRehash(found.user.passwordHash!)) {
    const upgraded = await hashPassword(password);
    await getSystemUnitOfWork().withSystem(`rehash-${Date.now()}`, (tx) =>
      identity.setPasswordHash(tx, found.user.id, upgraded),
    );
  }

  const active = found.memberships.find((m) => m.status === "active")?.tenantId ?? null;
  await startSession(found.user.id, active);
  redirect(active ? "/dashboard" : "/");
}
