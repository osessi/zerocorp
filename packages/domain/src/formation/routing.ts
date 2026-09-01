import type {
  FounderProfile,
  ProviderCapabilities,
  ProviderCoverage,
  RoutingCandidate,
  RoutingDecision,
} from "@zerocorp/contracts";

/**
 * Provider routing. Pure: scoring only, no IO, no provider SDK.
 *
 * "Why did we route to provider B" has to be answerable months later, when the
 * provider's behaviour has changed and the code no longer reproduces the decision. So
 * the policy is a pure function of its inputs, the weights are versioned, and the
 * decision is stored with the reasons attached.
 *
 * The exclusions are hard rules and run BEFORE scoring. A provider that cannot legally
 * or technically do the work does not get a low score, it gets excluded with a reason:
 * a low score can still win when it is the only candidate, which is exactly how an
 * unverified provider ends up filing someone's company.
 */

export const ROUTING_POLICY_VERSION = "v1";

/**
 * Weights. They sum to 1 so a score reads as a fraction, which makes two decisions
 * comparable without knowing the weights.
 */
export const ROUTING_WEIGHTS = {
  automation: 0.35,
  reliability: 0.30,
  speed: 0.20,
  cost: 0.15,
} as const;

/** Beyond this, faster stops being a differentiator. */
const SPEED_CEILING_DAYS = 30;
/** Beyond this, cheaper stops being a differentiator. Minor units. */
const COST_CEILING_MINOR = 50_000;

export interface RoutingInput {
  readonly entityTypeCode: string;
  readonly founder: FounderProfile;
  readonly providers: readonly ProviderCapabilities[];
  readonly now: Date;
  /**
   * In production an unverified coverage is never selected. A staging environment may
   * relax it to exercise an adapter before its contract is signed.
   */
  readonly allowUnverified?: boolean;
}

function coverageFor(p: ProviderCapabilities, entityTypeCode: string): ProviderCoverage | undefined {
  return p.coverage.find((c) => c.entityTypeCode === entityTypeCode);
}

/** Returns the reason this provider cannot be used, or null if it can. */
function exclusionReason(
  p: ProviderCapabilities,
  input: RoutingInput,
): string | null {
  if (p.status === "disabled") return "provider is disabled";

  const coverage = coverageFor(p, input.entityTypeCode);
  if (!coverage) return `no coverage for ${input.entityTypeCode}`;
  if (coverage.automationLevel === "unavailable") return "coverage marked unavailable";

  // The fourth architecture rule. A capability is not real until it has been confirmed
  // technically AND contractually, and a public marketing page is not confirmation.
  if (!coverage.verified && input.allowUnverified !== true) {
    return "coverage not verified technically and contractually";
  }

  const isNonResident = !input.founder.targetMarkets.includes(input.founder.residencyCountry);
  if (isNonResident && !coverage.supportsNonResident) {
    return "does not support a non-resident founder";
  }

  return null;
}

function scoreOf(p: ProviderCapabilities, coverage: ProviderCoverage): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  const automation = coverage.automationLevel === "automated" ? 1 : 0.4;
  reasons.push(coverage.automationLevel === "automated" ? "automated filing" : "operator assisted");

  const reliability = p.reliabilityScore;
  if (p.status === "degraded") reasons.push("provider is degraded");

  const midDays = (coverage.typicalDaysMin + coverage.typicalDaysMax) / 2;
  const speed = Math.max(0, 1 - Math.min(midDays, SPEED_CEILING_DAYS) / SPEED_CEILING_DAYS);
  reasons.push(`typically ${coverage.typicalDaysMin} to ${coverage.typicalDaysMax} days`);

  // No wholesale price is not free, it is unknown. Scoring it as free would make every
  // provider we have not negotiated with look like the cheapest option.
  const feeMinor = coverage.wholesaleFee?.amountMinor;
  const cost = feeMinor === undefined || feeMinor === null
    ? 0.5
    : Math.max(0, 1 - Math.min(feeMinor, COST_CEILING_MINOR) / COST_CEILING_MINOR);
  if (feeMinor === undefined || feeMinor === null) reasons.push("wholesale price unknown");

  const degradedPenalty = p.status === "degraded" ? 0.5 : 1;

  const score =
    (ROUTING_WEIGHTS.automation * automation +
      ROUTING_WEIGHTS.reliability * reliability +
      ROUTING_WEIGHTS.speed * speed +
      ROUTING_WEIGHTS.cost * cost) *
    degradedPenalty;

  return { score: Math.round(score * 10_000) / 10_000, reasons };
}

export function selectProvider(input: RoutingInput): RoutingDecision {
  const candidates: RoutingCandidate[] = [];

  for (const p of input.providers) {
    const excluded = exclusionReason(p, input);
    if (excluded !== null) {
      candidates.push({ providerCode: p.code, score: 0, reasons: [], excludedBecause: excluded });
      continue;
    }
    const coverage = coverageFor(p, input.entityTypeCode)!;
    const { score, reasons } = scoreOf(p, coverage);
    candidates.push({ providerCode: p.code, score, reasons, excludedBecause: null });
  }

  const eligible = candidates
    .filter((c) => c.excludedBecause === null)
    // Ties break on provider code so the same inputs always produce the same decision.
    // A non-deterministic router is a router whose past decisions cannot be explained.
    .sort((a, b) => b.score - a.score || a.providerCode.localeCompare(b.providerCode));

  return {
    entityTypeCode: input.entityTypeCode,
    candidates,
    selected: eligible[0]?.providerCode ?? null,
    fallbacks: eligible.slice(1).map((c) => c.providerCode),
    decidedAt: input.now,
    policyVersion: ROUTING_POLICY_VERSION,
  };
}
