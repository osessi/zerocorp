/**
 * Model prices, in micro-dollars per token.
 *
 * List prices verified 2026-09-01. NOT contracted rates, and they move: this table is
 * the one place to update when they do, and `usage_events.cost_micros` records what a
 * run actually cost so a stale table shows up as a margin drift rather than as silence.
 *
 * Micro-dollars because a single call costs a fraction of a cent — migration 0006.
 */
export interface ModelPrice {
  readonly inputMicrosPerToken: number;
  readonly outputMicrosPerToken: number;
}

/** $ per 1M tokens ÷ 1e6 tokens × 1e6 micros = the dollar figure itself, in micros. */
const perMillion = (inputUsd: number, outputUsd: number): ModelPrice => ({
  inputMicrosPerToken: inputUsd,
  outputMicrosPerToken: outputUsd,
});

export const MODEL_PRICES: Record<string, ModelPrice> = {
  "claude-haiku-4-5-20251001": perMillion(1, 5),
  "claude-sonnet-5": perMillion(3, 15),
  "claude-opus-5": perMillion(5, 25),
};

/**
 * An unknown model costs an unknown amount, and recording zero would quietly report
 * 100% margin on it. Reported as null so the caller decides what to do with a gap
 * rather than inheriting a wrong number.
 */
export function costMicros(model: string, inputTokens: number, outputTokens: number): number | null {
  const price = MODEL_PRICES[model];
  if (!price) return null;
  return Math.round(inputTokens * price.inputMicrosPerToken + outputTokens * price.outputMicrosPerToken);
}

/**
 * Which model runs which task — ADR 0002 §6.
 *
 * The free assessment runs for strangers who mostly will not convert, so it runs on the
 * cheap model. A plan revision happens after the visitor has engaged, is rarer, and is
 * the moment they are arguing with the output.
 */
export const TASK_MODELS: Record<string, string> = {
  "assessment.analyze": "claude-haiku-4-5-20251001",
  "assessment.revise": "claude-sonnet-5",
  "onboarding.compile": "claude-sonnet-5",
};

export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
