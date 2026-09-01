import type { Role } from "@zerocorp/contracts";

export interface SessionRecord {
  readonly userId: string;
  readonly activeTenantId: string | null;
  readonly expiresAt: Date;
  readonly lastSeenAt: Date;
}

export interface Membership {
  readonly tenantId: string;
  readonly tenantName: string;
  readonly role: Role;
  readonly status: string;
}
