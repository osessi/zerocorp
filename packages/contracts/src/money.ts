import { z } from "zod";

/**
 * Money. D15, decided 2026-09-01.
 *
 * Two models, because they answer different questions:
 *
 *   CUSTOMER MONEY  what we quote, charge, refund and record in the credit ledger.
 *                   V1: USD only, and a schema enforces it.
 *   COST MONEY      what a government or a provider charges US, in ITS currency.
 *                   GBP for a Companies House filing. Never enters the ledger
 *                   without an explicit, recorded conversion.
 *
 * The type carries a currency in both cases, so adding a second customer currency
 * later changes an allow-list rather than a schema. The alternative — keeping
 * `literal("USD")` — would have forced every cost record to lie about its currency,
 * and the first GBP invoice would have meant a migration through the ledger.
 *
 * Integer minor units, always. There is no float arithmetic on money anywhere in
 * this repository — CLAUDE_CODE_RULES.md §20.
 */

export const CURRENCIES = ["USD", "GBP", "EUR", "CAD", "AUD"] as const;
export const currencySchema = z.enum(CURRENCIES);
export type Currency = z.infer<typeof currencySchema>;

/**
 * Minor units per currency. Not always two — JPY has none, and a hard-coded 100
 * is the classic way to overcharge someone by a factor of a hundred.
 *
 * Every currency in CURRENCIES must appear here; a test asserts it, so adding a
 * currency without its exponent fails the build rather than the invoice.
 */
export const CURRENCY_MINOR_UNITS: Record<Currency, number> = {
  USD: 2,
  GBP: 2,
  EUR: 2,
  CAD: 2,
  AUD: 2,
};

export const moneySchema = z.object({
  /** Signed. A refund is negative; the ledger needs both directions. */
  amountMinor: z.number().int(),
  currency: currencySchema,
});
export type Money = z.infer<typeof moneySchema>;

/**
 * What a customer may be shown, charged or refunded.
 *
 * V1 is USD only. This is the ONE place that fact lives; widening it is an edit here
 * plus whatever the review of that edit demands.
 */
export const CUSTOMER_CURRENCIES = ["USD"] as const satisfies readonly Currency[];
export type CustomerCurrency = (typeof CUSTOMER_CURRENCIES)[number];

export const customerMoneySchema = moneySchema.extend({
  currency: z.enum(CUSTOMER_CURRENCIES),
});
export type CustomerMoney = z.infer<typeof customerMoneySchema>;

/**
 * A cost in its own currency: a government filing fee, a provider's wholesale rate.
 *
 * Deliberately a distinct type from CustomerMoney rather than the same one with a
 * different value, so a cost cannot be handed to a function expecting a price
 * without going through convert() and leaving a record.
 */
export const costMoneySchema = moneySchema;
export type CostMoney = z.infer<typeof costMoneySchema>;

/**
 * A conversion that happened, not a rate table.
 *
 * A foreign fee paid against a USD price IS an FX position. Recording the source
 * amount, the target amount and the rate used is what makes that exposure
 * measurable instead of discoverable.
 */
export const conversionSchema = z.object({
  from: costMoneySchema,
  to: customerMoneySchema,
  /** Units of `to` per one unit of `from`, as a decimal string. Never a float. */
  rate: z.string().regex(/^\d+\.\d{1,10}$/),
  at: z.date(),
  source: z.string().min(1),
});
export type Conversion = z.infer<typeof conversionSchema>;

export function money(amountMinor: number, currency: Currency = "USD"): Money {
  return { amountMinor, currency };
}

export class CurrencyMismatchError extends Error {
  override readonly name = "CurrencyMismatchError";
  constructor(a: Currency, b: Currency) {
    super(`Cannot combine ${a} and ${b}. Convert explicitly and record the conversion.`);
  }
}

/** Addition refuses to guess. Two currencies do not silently become one. */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

export function sumMoney(items: readonly Money[], currency: Currency): Money {
  return items.reduce<Money>(addMoney, { amountMinor: 0, currency });
}

/** Presentation only. Never use the result to compute anything. */
export function formatMoney(m: Money, locale = "en-US"): string {
  const exponent = CURRENCY_MINOR_UNITS[m.currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: m.currency,
    minimumFractionDigits: m.amountMinor % 10 ** exponent === 0 ? 0 : exponent,
    maximumFractionDigits: exponent,
  }).format(m.amountMinor / 10 ** exponent);
}
