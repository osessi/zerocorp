import type { Role } from "@zerocorp/contracts";

export interface SessionRecord {
  readonly userId: string;
  /** Joined in the same query. A second round trip for one column is a second round trip. */
  readonly email: string;
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
