import { z } from "zod";
import { requestIdSchema, tenantIdSchema, userIdSchema } from "./ids.js";

export const roleSchema = z.enum(["owner", "admin", "member", "viewer"]);
export type Role = z.infer<typeof roleSchema>;

/**
 * Access mode is decided by the composing application, never by a caller.
 *
 *   apps/sites  -> "read-only"   enforced physically by SET LOCAL TRANSACTION READ ONLY
 *   apps/app    -> "read-write"
 *   apps/worker -> "read-write"
 */
export const accessModeSchema = z.enum(["read-only", "read-write"]);
export type AccessMode = z.infer<typeof accessModeSchema>;

/**
 * The only legitimate way to reach tenant-owned data.
 *
 * Resolved at the request or job boundary, never accepted from a client payload.
 * See ARCHITECTURE.md "Boundary enforcement" and CLAUDE_CODE_RULES.md NN-2.
 */
export const tenantContextSchema = z.object({
  tenantId: tenantIdSchema,
  userId: userIdSchema.optional(),
  role: roleSchema.optional(),
  requestId: requestIdSchema,
  accessMode: accessModeSchema,
});
export type TenantContext = z.infer<typeof tenantContextSchema>;
