import type { ArchitectInput, ArchitectOutput } from "@zerocorp/contracts";

/**
 * Business validation, after the schema — ADR 0002 §3.
 *
 * A well-formed plan can still be wrong. The Zod schema proves the SHAPE; these checks
 * prove the plan is one ZeroCorp can actually honour, and they are pure so each one is
 * a unit test rather than an incident.
 */

export interface ValidationProblem {
  readonly code: string;
  readonly detail: string;
}

export function validateArchitectOutput(
  output: ArchitectOutput,
  input: ArchitectInput,
): ValidationProblem[] {
  const problems: ValidationProblem[] = [];
  const plan = output.plan;

  // 1. A model may name a plausible entity we do not offer. "Nevada LLC" reads fine and
  //    is not in the catalog, and a customer cannot buy it.
  if (plan.recommendedEntityTypeCode !== null) {
    const known = input.catalog.find((c) => c.entityTypeCode === plan.recommendedEntityTypeCode);
    if (!known) {
      problems.push({
        code: "entity_not_in_catalog",
        detail: `"${plan.recommendedEntityTypeCode}" is not an entity ZeroCorp offers`,
      });
    } else if (!known.eligible) {
      // Recommending something the eligibility policy already refused this founder is
      // worse than recommending nothing: they will try to buy it.
      problems.push({
        code: "entity_not_eligible",
        detail: `"${plan.recommendedEntityTypeCode}" is not available to this founder`,
      });
    } else if (known.jurisdictionCode !== plan.recommendedJurisdictionCode) {
      problems.push({
        code: "jurisdiction_mismatch",
        detail: `"${plan.recommendedEntityTypeCode}" belongs to "${known.jurisdictionCode}", not "${plan.recommendedJurisdictionCode}"`,
      });
    }
  }

  // 2. "I don't want a Delaware company" has to survive a regeneration. A constraint
  //    that only lives in the chat transcript gets re-argued every time.
  for (const constraint of input.constraints) {
    if (constraint.kind === "exclude_jurisdiction" && plan.recommendedJurisdictionCode === constraint.jurisdictionCode) {
      problems.push({
        code: "excluded_jurisdiction_recommended",
        detail: `The customer excluded "${constraint.jurisdictionCode}" and it was recommended anyway`,
      });
    }
    if (constraint.kind === "skip_category" && plan.steps.some((s) => s.included && s.category === constraint.category)) {
      problems.push({
        code: "skipped_category_included",
        detail: `The customer asked to skip "${constraint.category}" and it is still in the plan`,
      });
    }
  }

  // 3. Two steps with the same key means the customer's edits cannot be applied: an
  //    exclusion would hit one of them and nobody could say which.
  const keys = plan.steps.map((s) => s.key);
  const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (duplicates.length > 0) {
    problems.push({ code: "duplicate_step_keys", detail: `repeated: ${[...new Set(duplicates)].join(", ")}` });
  }

  // 4. A plan whose every step is excluded is not a plan.
  if (plan.steps.every((s) => !s.included)) {
    problems.push({ code: "empty_plan", detail: "every step is excluded" });
  }

  return problems;
}
