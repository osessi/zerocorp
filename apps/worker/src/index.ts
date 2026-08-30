import { inngest } from "./client.js";
import { functions } from "./functions/index.js";

/**
 * apps/worker — durable jobs, scheduled workflows and agent runs.
 *
 * Every function is a thin adapter: it reconstructs a TenantContext, invokes a
 * use case from @zerocorp/application, and records the outcome. Business logic
 * never lives in a job definition.
 */
export { inngest, functions };
