import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * No em dash reaches a customer.
 *
 * Standing rule since 2026-09-01, restated on 2026-09-03 after it had been broken again:
 * "je ne veux plus ces tirets quadratins". It is not a stylistic preference. The em dash
 * is the single most reliable tell that a sentence was generated, and ZeroCorp is sold to
 * founders who read a lot of generated copy and have learned to spot it. A product whose
 * writing reads as machine output undermines the price before anyone reaches the price.
 *
 * A rule stated ten times and broken on the eleventh screen is not a rule, it is a hope.
 * So it is a gate.
 *
 * COMMENTS ARE STRIPPED FIRST. What is checked is what ships: JSX text, string literals,
 * template literals. A docblock is prose for the people working here, and holding it to
 * the same line would make this rule expensive enough that someone eventually deletes it.
 *
 * The replacement is almost never another dash. A sentence reaching for an em dash wants
 * a full stop (the clause was doing two jobs), a comma (a light aside), or a colon (what
 * follows explains what precedes). The full stop is usually right, and it is the one that
 * most changes the rhythm away from generated prose.
 *
 * §32b demonstration, restoring the onboarding line gives:
 *   AssertionError: apps/app/src/app/(product)/onboarding/Talk.tsx:95 em dash in shipped
 *   copy: "…why they pick you. Ramble — it is easier to"
 */

const ROOT = resolve(__dirname, "../..");

/**
 * Surfaces a customer can actually open.
 *
 * `apps/app/src/app/design-system` is the internal gallery and is excluded by name, the
 * same exemption the weld rule takes and for the same reason. Tests are excluded because
 * a test title is read by whoever is fixing the test.
 */
const SHIPPED = [
  "apps/app/src/app/(product)",
  "apps/app/src/app/assessment",
  "apps/app/src/app/welcome",
  "apps/app/src/app/signin",
  "apps/app/src/app/operator",
  "apps/sites/src",
  "packages/ui/src",
  "packages/site-renderer/src",
];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(path));
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

/** Comments out, so a docblock explaining the rule does not trip it. */
function shipped(source: string): string[] {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/^\s*\/\/.*$/gm, "")
    .split("\n");
}

describe("copy", () => {
  it("never ships an em dash", () => {
    const files = SHIPPED.flatMap((dir) => sourceFiles(join(ROOT, dir)));
    expect(files.length).toBeGreaterThan(60);

    const offenders: string[] = [];
    for (const file of files) {
      shipped(readFileSync(file, "utf8")).forEach((line, i) => {
        if (!line.includes("—")) return;
        offenders.push(
          `${file.slice(ROOT.length + 1)}:${i + 1} em dash in shipped copy: ${JSON.stringify(line.trim().slice(0, 90))}`,
        );
      });
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
