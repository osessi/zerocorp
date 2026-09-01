/**
 * The Business Formation Engine, domain layer — D14.
 *
 * Pure. No IO, no framework, no provider SDK. Everything here is a function of its
 * arguments, which is what makes "why did we route there" and "why was this founder
 * blocked" answerable by a unit test rather than by reading production logs.
 */
export * from "./eligibility";
export * from "./routing";
