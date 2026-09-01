import type {
  EligibilityFinding,
  EligibilityPredicate,
  EligibilityResult,
  EligibilityRule,
  FounderProfile,
} from "@zerocorp/contracts";

/**
 * Eligibility evaluation. Pure: no IO, no clock, no provider.
 *
 * THREE-VALUED LOGIC, and this is the part that matters.
 *
 * A predicate is true, false, or UNKNOWN. Unknown happens whenever the founder has
 * not told us something the rule depends on — nationality, most often, which is
 * optional because asking for it up front costs conversions.
 *
 * Two-valued logic has no honest answer here. If an unknown predicate reads as false,
 * a `deny` rule silently allows and a `require` rule silently drops a requirement:
 * both fail OPEN, which in a compliance rule is the wrong direction. If it reads as
 * true, every founder who skipped an optional question gets blocked by rules that may
 * not apply to them.
 *
 * So unknown is neither. It produces a `warn` finding that names the missing input,
 * and the product asks for it rather than guessing.
 */

export type Truth = "true" | "false" | "unknown";

export function evaluatePredicate(p: EligibilityPredicate, f: FounderProfile): Truth {
  switch (p.kind) {
    case "residency_in":
      return p.countries.includes(f.residencyCountry) ? "true" : "false";
    case "residency_not_in":
      return p.countries.includes(f.residencyCountry) ? "false" : "true";
    case "nationality_not_in":
      // Optional on the founder profile, so genuinely unknowable rather than absent.
      if (f.nationalityCountry === undefined) return "unknown";
      return p.countries.includes(f.nationalityCountry) ? "false" : "true";
    case "owner_count_min":
      return f.ownerCount >= p.value ? "true" : "false";
    case "owner_count_max":
      return f.ownerCount <= p.value ? "true" : "false";
    case "requires_us_tax_id":
      return f.hasUsTaxId ? "false" : "true";
    case "target_market_includes":
      return p.countries.some((c) => f.targetMarkets.includes(c)) ? "true" : "false";
    case "wants_external_investment":
      return f.wantsExternalInvestment ? "true" : "false";
  }
}

/** The i18n key a warning uses when a rule could not be decided. */
export const INDETERMINATE_MESSAGE_KEY = "eligibility.indeterminate";

/** Which founder field an indeterminate predicate was missing. */
function missingInput(p: EligibilityPredicate): string | null {
  return p.kind === "nationality_not_in" ? "nationalityCountry" : null;
}

export function evaluateEligibility(
  entityTypeCode: string,
  rules: readonly EligibilityRule[],
  founder: FounderProfile,
): EligibilityResult {
  const findings: EligibilityFinding[] = [];

  for (const rule of rules) {
    if (rule.entityTypeCode !== entityTypeCode) continue;
    const truth = evaluatePredicate(rule.predicate, founder);

    if (truth === "true") {
      findings.push({
        ruleCode: rule.code,
        effect: rule.effect,
        messageKey: rule.messageKey,
        ...(rule.requires !== undefined ? { requires: rule.requires } : {}),
      });
      continue;
    }

    if (truth === "unknown" && rule.effect !== "warn") {
      // A rule that could have blocked or added a requirement, and we cannot tell.
      // Downgraded to a warning that names what is missing, never dropped silently.
      const field = missingInput(rule.predicate);
      findings.push({
        ruleCode: rule.code,
        effect: "warn",
        messageKey: field ? `${INDETERMINATE_MESSAGE_KEY}.${field}` : INDETERMINATE_MESSAGE_KEY,
      });
    }
  }

  return {
    entityTypeCode,
    // Derived, never stored as an independent fact: true exactly when no deny fired.
    eligible: !findings.some((f) => f.effect === "deny"),
    findings,
  };
}

/** Everything that became mandatory because a `require` rule fired. */
export function requirementsFrom(result: EligibilityResult): {
  registrations: string[];
  documents: string[];
  identityVerification: boolean;
} {
  const registrations = new Set<string>();
  const documents = new Set<string>();
  let identityVerification = false;

  for (const f of result.findings) {
    if (f.effect !== "require" || f.requires === undefined) continue;
    if (f.requires.registration) registrations.add(f.requires.registration);
    if (f.requires.document) documents.add(f.requires.document);
    if (f.requires.identityVerification) identityVerification = true;
  }

  return { registrations: [...registrations], documents: [...documents], identityVerification };
}
