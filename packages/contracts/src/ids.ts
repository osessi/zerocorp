import { z } from "zod";

/** Branded identifiers. A TenantId can never be passed where a UserId is expected. */
export const tenantIdSchema = z.string().uuid().brand<"TenantId">();
export type TenantId = z.infer<typeof tenantIdSchema>;

export const userIdSchema = z.string().uuid().brand<"UserId">();
export type UserId = z.infer<typeof userIdSchema>;

export const requestIdSchema = z.string().min(1).brand<"RequestId">();
export type RequestId = z.infer<typeof requestIdSchema>;
