import { describe, it, expect } from "vitest";
import { screenResidency, einPath, isNonResident } from "./residency";

describe("residency screening — the gate that runs before payment", () => {
  it("blocks comprehensively sanctioned countries outright", () => {
    for (const c of ["CU", "IR", "KP", "SY", "RU", "BY"] as const) {
      expect(screenResidency(c).outcome, c).toBe("blocked");
    }
  });

  it("sends Ukraine to review rather than blocking or clearing it", () => {
    // The embargo is territorial and shares the UA country code, so a code-level answer
    // is genuinely not available. Review is the honest outcome, not a hedge.
    expect(screenResidency("UA").outcome).toBe("review");
  });

  it("clears the countries ZeroCorp actually sells to", () => {
    for (const c of ["NG", "IN", "BR", "GB", "DE", "US", "PK", "PH"] as const) {
      expect(screenResidency(c).outcome, c).toBe("clear");
    }
  });
});

describe("the EIN path — told before payment, not after", () => {
  it("is same-day with an SSN or ITIN", () => {
    const p = einPath(true);
    expect(p.path).toBe("online");
    expect(p.typicalDaysMax).toBeLessThanOrEqual(1);
  });

  it("is four to eight weeks without one, and says so", () => {
    const p = einPath(false);
    expect(p.path).toBe("fax_or_mail");
    expect(p.typicalDaysMin).toBeGreaterThanOrEqual(28);
    // The wording matters as much as the number: the company exists and can trade; it is
    // the bank account that waits. A founder told only "8 weeks" assumes nothing works.
    expect(p.summary).toMatch(/bank account/i);
  });

  it("never reports the fast path for a founder without a US tax id", () => {
    // The failure that matters commercially: promising minutes and delivering weeks.
    expect(einPath(false).typicalDaysMax).toBeGreaterThan(einPath(true).typicalDaysMax);
  });
});

describe("non-residency", () => {
  it("is everyone outside the US, which is the whole customer base", () => {
    expect(isNonResident("US")).toBe(false);
    expect(isNonResident("NG")).toBe(true);
  });
});
