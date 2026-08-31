import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

/**
 * Mechanical enforcement of DESIGN_SYSTEM.md §11 and CLAUDE_CODE_RULES.md §11:
 *
 *   "Never introduce arbitrary colors, typography, spacing, radius or shadows.
 *    If the value is not a token, it is a defect."
 *
 * A convention nobody can measure is not a rule. This is the rule.
 *
 * The token layer itself (packages/design-system/src/tokens.css) is the one file allowed
 * to hold raw values — it is where they are decided.
 */
function sourceFiles(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(join(ROOT, dir));
  } catch {
    return out;
  }
  for (const entry of entries) {
    const rel = join(dir, entry);
    if (entry === "node_modules" || entry === "dist") continue;
    if (statSync(join(ROOT, rel)).isDirectory()) sourceFiles(rel, out);
    else if (/\.(ts|tsx|css)$/.test(entry)) out.push(rel);
  }
  return out;
}

const TOKEN_LAYER = "packages/design-system/src/tokens.css";

const UI_SOURCES = [
  ...sourceFiles("packages/ui/src"),
  ...sourceFiles("packages/site-renderer/src"),
].filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"));

/** Strips comments so a hex quoted in documentation is not reported as code. */
function code(file: string): string {
  return readFileSync(join(ROOT, file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("design tokens — no arbitrary visual values", () => {
  it("finds component sources to check", () => {
    expect(UI_SOURCES.length).toBeGreaterThan(0);
  });

  it("declares no hard-coded hex colour outside the token layer", () => {
    const offenders: string[] = [];
    for (const file of UI_SOURCES) {
      const hits = code(file).match(/#[0-9a-fA-F]{3,8}\b/g);
      if (hits) offenders.push(`${relative(ROOT, file)} → ${hits.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });

  it("uses no arbitrary Tailwind bracket value", () => {
    // Catches className="mt-[17px] bg-[#00786F] text-[13px]" — the exact defect
    // CLAUDE_CODE_RULES.md §11 names.
    const offenders: string[] = [];
    for (const file of UI_SOURCES) {
      const hits = code(file).match(/\b[a-z-]+-\[[^\]]+\]/g);
      if (hits) offenders.push(`${relative(ROOT, file)} → ${hits.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });

  it("sets no inline pixel style", () => {
    const offenders: string[] = [];
    for (const file of UI_SOURCES) {
      const hits = code(file).match(/style=\{\{[^}]*\d+px/g);
      if (hits) offenders.push(`${relative(ROOT, file)} → ${hits.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });

  it("keeps every raw value inside the token layer", () => {
    const tokens = readFileSync(join(ROOT, TOKEN_LAYER), "utf8");
    // Sanity: the validated palette really is where it claims to be.
    for (const value of ["#00786f", "#949494", "#15803d", "#b45309", "#2563eb", "#dc2626"]) {
      expect(tokens.toLowerCase()).toContain(value);
    }
  });
});

describe("design tokens — the two systems stay separate", () => {
  it("site-renderer never imports the ZeroCorp product component library", () => {
    // DESIGN_SYSTEM.md §15/§16: a customer website theme must never alter the ZeroCorp
    // product UI, and the product UI must never leak into customer sites.
    for (const file of sourceFiles("packages/site-renderer/src")) {
      expect(code(file)).not.toMatch(/@zerocorp\/ui/);
    }
  });

  it("ui never imports the customer website renderer", () => {
    for (const file of sourceFiles("packages/ui/src")) {
      expect(code(file)).not.toMatch(/@zerocorp\/site-renderer/);
    }
  });
});
