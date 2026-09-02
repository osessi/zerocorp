import type { GeneratedBrand } from "./brand";

/**
 * A keyword strategy and an editorial calendar, derived from the brand.
 *
 * Deterministic. Every keyword is built from words the founder used, so the plan is
 * theirs rather than a template with their name substituted in. Volume and difficulty
 * are NOT invented: a made-up search volume is a number someone will make a decision
 * with, and there is no defensible way to guess it without a data provider.
 */

export interface KeywordIdea {
  readonly keyword: string;
  readonly intent: "informational" | "commercial" | "transactional";
  /** Null until a real provider supplies it. Never guessed. */
  readonly volume: null;
  readonly difficulty: null;
}

export interface ArticleIdea {
  readonly title: string;
  readonly slug: string;
  readonly keyword: string;
  /** Days from now. A calendar rather than a pile. */
  readonly offsetDays: number;
}

/** The two or three nouns a description is actually about. */
function subjects(description: string): string[] {
  const stop = new Set([
    "i", "we", "a", "an", "the", "for", "to", "and", "of", "in", "on", "with", "my", "our",
    "design", "build", "make", "help", "work", "do", "am", "are", "is", "that", "who", "companies",
  ]);
  const words = description
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w));

  const seen = new Set<string>();
  return words.filter((w) => (seen.has(w) ? false : seen.add(w))).slice(0, 4);
}

const SHAPES: Array<{ template: (topic: string, audience: string) => string; intent: KeywordIdea["intent"] }> = [
  { template: (t) => `${t} for early-stage companies`, intent: "commercial" },
  { template: (t) => `how much does ${t} cost`, intent: "commercial" },
  { template: (t) => `${t} checklist`, intent: "informational" },
  { template: (t, a) => `best ${t} for ${a}`, intent: "commercial" },
  { template: (t) => `when to hire for ${t}`, intent: "informational" },
  { template: (t) => `${t} process explained`, intent: "informational" },
  { template: (t, a) => `${t} agency for ${a}`, intent: "transactional" },
  { template: (t) => `${t} mistakes to avoid`, intent: "informational" },
];

export function generateKeywords(description: string, icp: string): KeywordIdea[] {
  const topics = subjects(description);
  if (topics.length === 0) return [];

  const audience = subjects(icp)[0] ?? "founders";
  const out: KeywordIdea[] = [];
  const seen = new Set<string>();

  for (const topic of topics) {
    for (const shape of SHAPES) {
      const keyword = shape.template(topic, audience);
      if (seen.has(keyword)) continue;
      seen.add(keyword);
      out.push({ keyword, intent: shape.intent, volume: null, difficulty: null });
      if (out.length >= 24) return out;
    }
  }
  return out;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * An editorial calendar.
 *
 * Twice a week, not five a day. Five a day is the ceiling the product SHIPS with and the
 * customer can move it, but a plan that opens at the ceiling is a plan nobody keeps, and
 * search results follow consistency far more than volume.
 */
const DAYS_BETWEEN_POSTS = 3;

export function generateCalendar(keywords: readonly KeywordIdea[], brand: GeneratedBrand): ArticleIdea[] {
  return keywords.slice(0, 12).map((keyword, i) => {
    const title = titleFor(keyword, brand);
    return {
      title,
      slug: slugify(title),
      keyword: keyword.keyword,
      offsetDays: (i + 1) * DAYS_BETWEEN_POSTS,
    };
  });
}

function titleFor(keyword: KeywordIdea, brand: GeneratedBrand): string {
  const subject = keyword.keyword.replace(/^(how much does|best|when to hire for)\s+/i, "");
  switch (keyword.intent) {
    case "commercial":
      return `What ${subject} actually costs, and what changes the number`;
    case "transactional":
      return `Choosing a partner for ${subject}`;
    default:
      return `${subject.charAt(0).toUpperCase()}${subject.slice(1)}: what ${brand.name} does and why`;
  }
}
