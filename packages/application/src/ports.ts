import type { TenantContext } from "@zerocorp/contracts";

/**
 * Ports are defined here and implemented by Layer 3 packages.
 * Dependencies point inward: db/ai/integrations depend on application, never the reverse.
 */

/** Injected so use cases stay deterministic and testable. */
export interface Clock {
  now(): Date;
}

/** Injected so use cases never call crypto directly. */
export interface IdGenerator {
  next(): string;
}

/**
 * The tenant-scoped unit of work. Implemented by @zerocorp/db.
 *
 * There is no other sanctioned way to reach tenant-owned data. The implementation
 * opens a transaction, pins the tenant for Row Level Security, and marks the
 * transaction read-only when the context says so.
 */
export interface UnitOfWork<TTx = unknown> {
  withTenant<T>(ctx: TenantContext, fn: (tx: TTx) => Promise<T>): Promise<T>;
}

/** Domain events leave the transaction through here; the worker consumes them. */
export interface EventPublisher {
  publish(event: { name: string; tenantId: string; payload: unknown }): Promise<void>;
}

/** Structured, tenant-attributed logging. */
export interface Logger {
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}
