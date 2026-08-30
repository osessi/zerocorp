import type { InngestFunction } from "inngest";

/**
 * Workflow registry. Content generation, publication, formation status polling,
 * email warm-up, token refresh and agent runs register here.
 *
 * Empty by design: this step scaffolds architecture, not product features.
 */
export const functions: InngestFunction.Any[] = [];
