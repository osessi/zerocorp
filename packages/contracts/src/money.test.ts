import { describe, it, expect } from "vitest";
import {
  CURRENCIES,
  CURRENCY_MINOR_UNITS,
  CUSTOMER_CURRENCIES,
  CurrencyMismatchError,
  addMoney,
  costMoneySchema,
  customerMoneySchema,
  formatMoney,
  money,
  sumMoney,
} from "./money";

describe("currency table", () => {
  it("gives every currency a minor-unit exponent", () => {
    // A hard-coded 100 is the classic way to overcharge someone by a factor of a
    // hundred. Adding a currency without its exponent must fail the build, not the
    // invoice.
    for (const c of CURRENCIES) expect(CURRENCY_MINOR_UNITS[c]).toBeTypeOf("number");
  });

  it("lists no exponent for a currency that does not exist", () => {
    expect(Object.keys(CURRENCY_MINOR_UNITS).sort()).toEqual([...CURRENCIES].sort());
  });
});

describe("customer money — D15, USD only in V1", () => {
  it("accepts USD", () => {
    expect(customerMoneySchema.safeParse(money(99_700, "USD")).success).toBe(true);
  });

  it("refuses a currency we have not decided to show a customer", () => {
    expect(customerMoneySchema.safeParse(money(10_000, "GBP")).success).toBe(false);
  });

  it("keeps the allow-list in one place", () => {
    expect(CUSTOMER_CURRENCIES).toEqual(["USD"]);
  });

  it("accepts a negative amount, because a refund is money too", () => {
    expect(customerMoneySchema.safeParse(money(-99_700)).success).toBe(true);
  });

  it("refuses a fractional minor unit", () => {
    expect(customerMoneySchema.safeParse({ amountMinor: 1.5, currency: "USD" }).success).toBe(false);
  });
});

describe("cost money — what an authority charges us", () => {
  it("accepts GBP, which is what a Companies House filing costs", () => {
    // £100 from 1 February 2026. The reason the USD-only model had to widen.
    expect(costMoneySchema.safeParse(money(10_000, "GBP")).success).toBe(true);
  });
});

describe("arithmetic refuses to guess", () => {
  it("adds two amounts in the same currency", () => {
    expect(addMoney(money(100), money(250))).toEqual({ amountMinor: 350, currency: "USD" });
  });

  it("throws rather than silently combining two currencies", () => {
    // The alternative is an invoice that is wrong by an exchange rate and looks right.
    expect(() => addMoney(money(100, "USD"), money(100, "GBP"))).toThrow(CurrencyMismatchError);
  });

  it("sums an empty list to zero in the stated currency", () => {
    expect(sumMoney([], "GBP")).toEqual({ amountMinor: 0, currency: "GBP" });
  });
});

describe("formatting", () => {
  it("drops the decimals on a whole amount", () => {
    expect(formatMoney(money(99_700))).toBe("$997");
  });

  it("keeps them when there are cents", () => {
    expect(formatMoney(money(99_750))).toBe("$997.50");
  });

  it("formats a foreign cost in its own currency", () => {
    expect(formatMoney(money(10_000, "GBP"), "en-GB")).toBe("£100");
  });
});
