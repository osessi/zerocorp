"use server";

import { redirect } from "next/navigation";
import { passwordProblem, hashPassword } from "@zerocorp/auth";
import { getConversionService, getIdentityRepository, getSystemUnitOfWork } from "../../../server/container";
import { startSession } from "../../../server/session";

/**
 * Creating the account that owns the new tenant.
 *
 * The conversion itself is idempotent and lives in @zerocorp/application, so the same
 * function serves this form, a Stripe webhook and an operator console. Only one of those
 * has a payment attached, which is exactly why the conversion does not know about
 * payments.
 */
export interface WelcomeResult {
  readonly ok: boolean;
  readonly error?: string;
}

export async function createAccount(token: string, email: string, password: string): Promise<WelcomeResult | never> {
  const address = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address)) {
    return { ok: false, error: "That does not look like an email address." };
  }

  const problem = passwordProblem(password);
  if (problem) return { ok: false, error: problem };

  let result;
  try {
    result = await getConversionService().convert({ token, email: address });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AssessmentNotApprovedError") {
      return { ok: false, error: "Approve your plan first." };
    }
    console.error("[welcome] conversion failed", cause);
    return { ok: false, error: "We could not set up your account. Nothing was charged." };
  }

  // Hashed here rather than inside the conversion, because a password is a fact about a
  // sign-in method and the conversion is about a business. It is also set AFTER the
  // tenant exists, so a failure here leaves an account that can be recovered by email
  // rather than a half-built tenant.
  const hash = await hashPassword(password);
  await getSystemUnitOfWork().withSystem(`welcome-${Date.now()}`, (tx) =>
    getIdentityRepository().setPasswordHash(tx, result.userId, hash),
  );

  await startSession(result.userId, result.tenantId);
  redirect("/dashboard");
}
