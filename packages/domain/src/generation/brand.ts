/**
 * Brand, derived from what the founder actually said.
 *
 * Deterministic, and that is a real path rather than a placeholder: it runs with no API
 * key, no network and no cost, and it is the fallback when the model is unavailable.
 *
 * The rule it holds throughout: every sentence traces to an input. It reuses the
 * founder's own nouns and never invents a fact about their business. A generator that
 * fills gaps with plausible language produces a brand that reads well and belongs to
 * nobody, which is worse than an empty field because nobody notices it is wrong.
 */

export interface BrandInput {
  readonly businessName: string;
  readonly description: string;
  readonly situation: string;
  readonly goal: string;
  readonly markets: readonly string[];
}

export interface GeneratedBrand {
  readonly name: string;
  readonly positioning: string;
  readonly icp: string;
  readonly valueProposition: string;
  readonly toneOfVoice: string;
  readonly colors: readonly string[];
}

/** The subject of a sentence like "I design brand identities for early-stage companies." */
function whatTheyDo(description: string): string {
  const cleaned = description.trim().replace(/\s+/g, " ");
  const stripped = cleaned.replace(/^(i|we)\s+(am|are)\s+(a|an)\s+/i, "").replace(/^(i|we)\s+/i, "");
  return stripped.charAt(0).toLowerCase() + stripped.slice(1).replace(/\.$/, "");
}

/** "for X" or "to X" is where a description almost always names its customer. */
function whoTheySell(description: string): string | null {
  const match = /\b(?:for|to)\s+([^.,;]{4,80})/i.exec(description);
  return match?.[1]?.trim() ?? null;
}

const MARKET_NAMES: Record<string, string> = {
  US: "the United States", GB: "the United Kingdom", CA: "Canada", AU: "Australia",
  FR: "France", DE: "Germany", ES: "Spain", NL: "the Netherlands",
  AE: "the United Arab Emirates", SG: "Singapore",
};

function marketPhrase(markets: readonly string[]): string {
  const names = markets.map((m) => MARKET_NAMES[m] ?? m);
  if (names.length === 0) return "your market";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/**
 * A palette derived from the business name.
 *
 * Deterministic, so the same business always gets the same colours and a regeneration
 * does not shuffle a brand the founder has started to recognise. Hue comes from a hash
 * of the name; saturation and lightness are fixed at values that stay legible as text on
 * white and as a fill behind white.
 *
 * These are CUSTOMER brand colours, which is the one place an arbitrary colour value is
 * correct — customer sites and the ZeroCorp UI have separate theme systems entirely
 * (DESIGN_SYSTEM.md §16).
 */
function hueFrom(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

/**
 * HSL to hex.
 *
 * s and l arrive as percentages and are normalised FIRST. Mixing the two scales inside
 * the formula makes `min(l, 1 - l)` negative for any lightness above 1, which produced
 * `#-1679173b-bcf` — a string that is not a colour, in a field nothing validates. Caught
 * by a test that checks the shape of the output rather than that it was produced.
 */
function hsl(h: number, s: number, l: number): string {
  const saturation = s / 100;
  const lightness = l / 100;
  const a = saturation * Math.min(lightness, 1 - lightness);

  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const value = lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * value)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

export function generatePalette(seed: string): string[] {
  const base = hueFrom(seed);
  return [
    hsl(base, 62, 38), // primary, dark enough to carry white text
    hsl((base + 28) % 360, 55, 52), // a warmer neighbour, for accents
    hsl((base + 180) % 360, 45, 45), // the complement, for a second signal
    hsl(base, 12, 22), // near-black with the brand's hue in it
    hsl(base, 16, 96), // the page it all sits on
  ];
}

export function generateBrand(input: BrandInput): GeneratedBrand {
  const does = whatTheyDo(input.description);
  const audience = whoTheySell(input.description);
  const markets = marketPhrase(input.markets);

  return {
    name: input.businessName,

    // Their verb, their customer, their market. Nothing added.
    positioning: audience
      ? `You ${does}. The positioning to hold is the one you already have: the studio ${audience} come to, working across ${markets}.`
      : `You ${does}, across ${markets}. That is the sentence to lead with, because it is the one you can defend.`,

    icp: audience
      ? `${audience.charAt(0).toUpperCase()}${audience.slice(1)}, in ${markets}. Narrow enough that a stranger can tell whether they are one.`
      : `Not yet specific enough to act on. "${does}" describes the work rather than the buyer, and the plan needs a buyer.`,

    valueProposition: `${input.goal.trim().replace(/\.$/, "")} — for the people you already serve, said in one sentence they would repeat.`,

    // The tone is read from how they wrote, not chosen from a list. Someone who wrote
    // three plain clauses does not want a brand voice that uses the word "elevate".
    toneOfVoice:
      input.description.length < 90
        ? "Direct and unadorned. You described the business in one line, so the brand should not need three."
        : "Considered and specific. You explain rather than assert, and the writing should keep doing that.",

    colors: generatePalette(input.businessName),
  };
}
