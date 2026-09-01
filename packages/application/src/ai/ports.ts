import type { ArchitectInput, ArchitectRun } from "@zerocorp/contracts";

/**
 * AI ports. Defined here, implemented in @zerocorp/ai.
 *
 * ARCHITECTURE.md §12: the product must not couple domain logic to a single model
 * vendor. Nothing above this line knows which model ran.
 */

export interface StructuredRequest {
  /** Routes to a model. Configuration, not code — ADR 0002 §6. */
  readonly task: string;
  readonly system: string;
  readonly user: string;
  /** The shape the model must return, as JSON Schema derived from the Zod contract. */
  readonly jsonSchema: Record<string, unknown>;
  readonly schemaName: string;
  readonly maxOutputTokens: number;
}

export interface StructuredResponse {
  /** Raw, unvalidated. The caller parses it against the Zod schema; this port does not. */
  readonly json: unknown;
  readonly provider: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface AITextProvider {
  readonly provider: string;
  generateStructured(request: StructuredRequest): Promise<StructuredResponse>;
}

export interface AITranscriptionProvider {
  readonly provider: string;
  /** Batch, not streaming. Nothing in the funnel needs a live transcript — ADR 0002. */
  transcribe(input: { audio: Uint8Array; contentType: string; durationMs: number }): Promise<{
    text: string;
    provider: string;
    model: string;
    costMicros: number;
  }>;
}

/**
 * The Business Architect — ADR 0002.
 *
 * A pure function from a closed input to a validated result. It is given no
 * repository, no tenant context and no tools, which is what makes "could the model
 * reach a passport number" answerable by reading a type.
 */
export interface BusinessArchitect {
  readonly kind: "model" | "deterministic";
  analyze(input: ArchitectInput): Promise<ArchitectRun>;
}

export class ArchitectFailedError extends Error {
  override readonly name = "ArchitectFailedError";
  constructor(
    readonly reason: "provider_unavailable" | "invalid_output" | "business_validation_failed" | "timeout",
    readonly detail: string,
    readonly attempts: number,
  ) {
    super(`Business Architect failed after ${attempts} attempt(s): ${reason} — ${detail}`);
  }
}
