import type { CountryCode } from "@zerocorp/contracts";

/**
 * Residency is not a detail of eligibility. It is the input almost everything downstream
 * depends on, and until now the product never asked for it.
 *
 * The assessment asks where a founder SELLS. It has never asked where they LIVE, and the
 * seed script papered over the gap by using the first target market as residency — which
 * is wrong in exactly the case ZeroCorp exists for: a non-resident founder selling into
 * the United States. Inferring one from the other is the specific error this module
 * exists to make impossible.
 *
 * What residency decides:
 *
 *   sanctions      whether we may serve them AT ALL. A hard gate before payment
 *   the EIN path   with an SSN, minutes online. Without, a separate filing on a
 *                  separate clock, measured in weeks. The founder must know which
 *                  path they are on BEFORE they pay, not discover it after
 *   jurisdiction   which state is actually recommended
 *   payment risk   card country vs IP country vs declared residency is the primary
 *                  fraud signal on a $997 international ticket
 */

/**
 * Comprehensively sanctioned jurisdictions: no service, at all.
 *
 * This is the OFAC comprehensive-embargo list, not the full SDN programme, and it is
 * deliberately a short hard list rather than a nuanced score. A screening decision that
 * requires interpretation is a screening decision that gets interpreted generously by
 * whoever wants the sale.
 *
 * NOT legal advice and NOT a complete compliance programme: a real one screens the
 * PERSON against SDN and the entity against ownership rules. This blocks the countries
 * where no amount of screening would make the answer yes. Recorded as a known limit —
 * see the open decision on lead and customer compliance.
 */
const COMPREHENSIVELY_SANCTIONED = new Set<string>(["CU", "IR", "KP", "SY", "RU", "BY"]);

/** Regions under territorial embargo that share a parent country code. */
export const EMBARGOED_REGION_NOTE =
  "Parts of Ukraine under occupation (Crimea, Donetsk, Luhansk) are embargoed even though UA is not.";

export type ResidencyDecision =
  | { outcome: "blocked"; reason: string }
  | { outcome: "review"; reason: string }
  | { outcome: "clear" };

/**
 * The gate. Run BEFORE payment, never after.
 *
 * Taking $997 from someone we cannot serve and refunding it later is worse than declining
 * at the door: it is a sanctions exposure, a chargeback, and a founder who was told yes.
 */
export function screenResidency(country: CountryCode): ResidencyDecision {
  if (COMPREHENSIVELY_SANCTIONED.has(country)) {
    return {
      outcome: "blocked",
      reason: "ZeroCorp cannot form companies for residents of this country under US sanctions rules.",
    };
  }
  if (country === "UA") {
    return { outcome: "review", reason: EMBARGOED_REGION_NOTE };
  }
  return { outcome: "clear" };
}

/**
 * Which EIN path a founder is on, and how long it actually takes.
 *
 * Told BEFORE payment. "Your EIN takes four to eight weeks" is a fine thing to hear while
 * deciding; it is a terrible thing to discover afterwards, and it is the single most
 * common complaint about every competitor in this market.
 */
export interface EinPath {
  readonly path: "online" | "fax_or_mail";
  readonly typicalDaysMin: number;
  readonly typicalDaysMax: number;
  readonly summary: string;
}

export function einPath(hasUsTaxId: boolean): EinPath {
  if (hasUsTaxId) {
    return {
      path: "online",
      typicalDaysMin: 0,
      typicalDaysMax: 1,
      summary: "You have an SSN or ITIN, so the EIN is issued online, usually the same day.",
    };
  }
  return {
    path: "fax_or_mail",
    typicalDaysMin: 28,
    typicalDaysMax: 56,
    summary:
      "Without an SSN or ITIN the EIN is a separate filing to the IRS, typically four to eight weeks. Your company exists and can trade long before it arrives; a US bank account is what waits on it.",
  };
}

/**
 * Whether the founder is a non-resident for US formation purposes.
 *
 * A separate question from residency itself, because it is the one that changes the
 * filing, and writing `country !== "US"` at each call site is how a rule ends up
 * disagreeing with itself.
 */
export function isNonResident(country: CountryCode): boolean {
  return country !== "US";
}
