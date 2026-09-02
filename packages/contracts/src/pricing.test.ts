import { describe, it, expect } from "vitest";
import { needsManualReview, distinctCountries, formatActivationPrice, ACTIVATION_PRICE_MINOR } from "./pricing";

describe("payment risk — the signal that matters on a four-figure international ticket", () => {
  it("does not flag a non-resident paying with their own card from home", () => {
    // The normal case, and the reason a naive "card issued outside the US" rule is
    // useless here: almost every legitimate ZeroCorp customer is a non-resident.
    expect(needsManualReview({ declaredResidency: "NG", cardCountry: "NG", ipCountry: "NG" })).toBe(false);
  });

  it("does not flag a traveller: two countries is normal", () => {
    // A Nigerian founder in London with a Nigerian card is a real customer.
    expect(needsManualReview({ declaredResidency: "NG", cardCountry: "NG", ipCountry: "GB" })).toBe(false);
  });

  it("flags three distinct countries for review", () => {
    expect(needsManualReview({ declaredResidency: "NG", cardCountry: "US", ipCountry: "GB" })).toBe(true);
  });

  it("ignores missing signals rather than counting them as disagreement", () => {
    // Stripe does not always return a card country. An absent signal must not manufacture
    // a review, or every payment with incomplete metadata queues for a human.
    expect(distinctCountries({ declaredResidency: "NG", cardCountry: null, ipCountry: null })).toBe(1);
    expect(needsManualReview({ declaredResidency: "NG", cardCountry: null, ipCountry: null })).toBe(false);
  });
});

describe("the activation price", () => {
  it("is money in integer minor units", () => {
    expect(Number.isInteger(ACTIVATION_PRICE_MINOR)).toBe(true);
  });

  it("formats without floating point arithmetic", () => {
    expect(formatActivationPrice(99_700)).toBe("$997");
    expect(formatActivationPrice(49_700)).toBe("$497");
  });
});
