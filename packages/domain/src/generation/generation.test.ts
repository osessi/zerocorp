import { describe, it, expect } from "vitest";
import { generateBrand, generatePalette } from "./brand";
import { generateCalendar, generateKeywords } from "./content";
import { generatePages } from "./website";
import { dnsRecordsFor, warmupLimit, warmupSchedule, WARMUP_DAYS } from "./email";

const INPUT = {
  businessName: "A solo brand designer billing three US clients",
  description: "I design brand identities for early-stage software companies.",
  situation: "Three clients, invoiced personally, no company.",
  goal: "Ten retained clients and a site that sells while I sleep.",
  markets: ["US", "GB"],
};

describe("brand", () => {
  it("reuses the founder's own words rather than inventing", () => {
    // A generator that fills gaps with plausible language produces a brand that reads
    // well and belongs to nobody, which is worse than an empty field: nobody notices.
    const brand = generateBrand(INPUT);
    expect(brand.positioning).toContain("brand identities");
    // The ICP opens a sentence, so it is capitalised. The words are what matters.
    expect(brand.icp.toLowerCase()).toContain("early-stage software companies");
    expect(brand.valueProposition).toContain("Ten retained clients");
  });

  it("names the markets in words rather than codes", () => {
    expect(generateBrand(INPUT).positioning).toContain("the United States and the United Kingdom");
  });

  it("says so when the description names no buyer", () => {
    // "I build things" describes the work, not the customer, and the plan needs a
    // customer. Pretending otherwise hands them a confident wrong answer.
    const vague = generateBrand({ ...INPUT, description: "I build things." });
    expect(vague.icp).toContain("Not yet specific enough");
  });

  it("reads the tone from how they wrote, not from a list", () => {
    const terse = generateBrand({ ...INPUT, description: "I make logos." });
    const considered = generateBrand({ ...INPUT, description: "x".repeat(120) });
    expect(terse.toneOfVoice).toContain("Direct");
    expect(considered.toneOfVoice).toContain("Considered");
  });
});

describe("palette", () => {
  it("is stable, so a regeneration does not reshuffle a brand they recognise", () => {
    expect(generatePalette("Acme")).toEqual(generatePalette("Acme"));
  });

  it("differs between businesses", () => {
    expect(generatePalette("Acme")).not.toEqual(generatePalette("Umbrella"));
  });

  it("produces five valid hex colours", () => {
    for (const colour of generatePalette("Acme")) expect(colour).toMatch(/^#[0-9a-f]{6}$/);
    expect(generatePalette("Acme")).toHaveLength(5);
  });
});

describe("keywords", () => {
  const brand = generateBrand(INPUT);

  it("builds from the founder's nouns", () => {
    const keywords = generateKeywords(INPUT.description, brand.icp);
    expect(keywords.some((k) => k.keyword.includes("identities") || k.keyword.includes("brand"))).toBe(true);
  });

  it("never invents a volume or a difficulty", () => {
    // A made-up search volume is a number someone makes a decision with, and there is no
    // defensible way to guess it without a provider.
    for (const keyword of generateKeywords(INPUT.description, brand.icp)) {
      expect(keyword.volume).toBeNull();
      expect(keyword.difficulty).toBeNull();
    }
  });

  it("returns nothing rather than filler when there is nothing to work from", () => {
    expect(generateKeywords("I do.", brand.icp)).toEqual([]);
  });

  it("never repeats a keyword", () => {
    const keywords = generateKeywords(INPUT.description, brand.icp).map((k) => k.keyword);
    expect(new Set(keywords).size).toBe(keywords.length);
  });
});

describe("calendar", () => {
  it("spaces posts instead of piling them up", () => {
    // Five a day is a ceiling the customer can move, not an opening position. A plan
    // that starts at the ceiling is a plan nobody keeps.
    const brand = generateBrand(INPUT);
    const calendar = generateCalendar(generateKeywords(INPUT.description, brand.icp), brand);
    const offsets = calendar.map((a) => a.offsetDays);
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    expect(new Set(offsets).size).toBe(offsets.length);
  });

  it("gives every article a usable slug", () => {
    const brand = generateBrand(INPUT);
    const calendar = generateCalendar(generateKeywords(INPUT.description, brand.icp), brand);
    for (const article of calendar) expect(article.slug).toMatch(/^[a-z0-9-]+$/);
  });
});

describe("website", () => {
  it("returns block DATA, never markup", () => {
    // CLAUDE_CODE_RULES.md §16 and a ZeroCorp invariant: the renderer takes data, and
    // nothing generates HTML, React or CSS.
    const pages = generatePages(generateBrand(INPUT), INPUT.description);
    const serialised = JSON.stringify(pages);
    expect(serialised).not.toMatch(/<[a-z]+[\s>]/i);
    expect(serialised).not.toContain("className");
  });

  it("gives every block a type, a variant and a version", () => {
    // The registry decides whether a block is renderable, and it needs all three.
    for (const page of generatePages(generateBrand(INPUT), INPUT.description)) {
      for (const block of page.blocks) {
        expect(block.type).toBeTruthy();
        expect(block.variant).toBeTruthy();
        expect(block.version).toBeGreaterThan(0);
      }
    }
  });

  it("always produces a home page", () => {
    const pages = generatePages(generateBrand(INPUT), INPUT.description);
    expect(pages.filter((p) => p.type === "home")).toHaveLength(1);
  });
});

describe("email", () => {
  it("writes SPF, DKIM and DMARC for the domain", () => {
    const records = dnsRecordsFor("acme.example");
    expect(records.map((r) => r.purpose).sort()).toEqual(["dkim", "dmarc", "spf"]);
  });

  it("marks the DKIM key as not yet issued rather than inventing one", () => {
    // A founder pasting a plausible fake key into DNS gets a domain that authenticates
    // against nothing, and no error to tell them.
    const dkim = dnsRecordsFor("acme.example").find((r) => r.purpose === "dkim");
    expect(dkim!.value).toBe("ISSUED_BY_PROVIDER");
  });

  it("starts DMARC at p=none", () => {
    // Quarantining before you can read a report is how legitimate mail gets dropped by
    // your own policy.
    const dmarc = dnsRecordsFor("acme.example").find((r) => r.purpose === "dmarc");
    expect(dmarc!.value).toContain("p=none");
  });

  it("ramps rather than starting at the target", () => {
    expect(warmupLimit(1)).toBe(5);
    expect(warmupLimit(28)).toBeGreaterThan(200);
    const schedule = warmupSchedule();
    expect(schedule).toHaveLength(WARMUP_DAYS);
    for (let i = 1; i < schedule.length; i += 1) {
      expect(schedule[i]!.limit).toBeGreaterThanOrEqual(schedule[i - 1]!.limit);
    }
  });

  it("sends nothing on day zero", () => {
    expect(warmupLimit(0)).toBe(0);
  });
});
