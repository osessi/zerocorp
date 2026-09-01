import { z } from "zod";

/** Branded identifiers. A TenantId can never be passed where a UserId is expected. */
export const tenantIdSchema = z.string().uuid().brand<"TenantId">();
export type TenantId = z.infer<typeof tenantIdSchema>;

export const userIdSchema = z.string().uuid().brand<"UserId">();
export type UserId = z.infer<typeof userIdSchema>;

export const requestIdSchema = z.string().min(1).brand<"RequestId">();
export type RequestId = z.infer<typeof requestIdSchema>;

export const assessmentIdSchema = z.string().uuid().brand<"AssessmentId">();
export type AssessmentId = z.infer<typeof assessmentIdSchema>;

export const planIdSchema = z.string().uuid().brand<"PlanId">();
export type PlanId = z.infer<typeof planIdSchema>;

export const checkoutSessionIdSchema = z.string().uuid().brand<"CheckoutSessionId">();
export type CheckoutSessionId = z.infer<typeof checkoutSessionIdSchema>;

/**
 * The secret a visitor holds instead of a session.
 *
 * The assessment is anonymous by design, so this token IS the authorization. It
 * is generated with a CSPRNG, never derived from anything guessable, and only its
 * SHA-256 digest is stored — a database leak must not hand over live assessments.
 */
export const assessmentTokenSchema = z
  .string()
  .regex(/^[0-9a-f]{64}$/, "must be 64 lowercase hex characters")
  .brand<"AssessmentToken">();
export type AssessmentToken = z.infer<typeof assessmentTokenSchema>;
