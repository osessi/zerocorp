/**
 * @zerocorp/integrations — Layer 3
 *
 * Provider adapters. Every external SDK usage is concentrated here, behind a port
 * defined in @zerocorp/application. The business layer never imports a vendor SDK,
 * which dependency-cruiser and ESLint both enforce.
 *
 * D14: ZeroCorp owns the formation abstraction; these are replaceable execution
 * adapters.
 */
export { ManualOperatorProvider } from "./formation/manual-operator";
export type { OperatorQueue, ManualOperatorOptions } from "./formation/manual-operator";
