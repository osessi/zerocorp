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
    if (entry === "node_modules" || entry === "dist" || entry === ".next") continue;
    if (statSync(join(ROOT, rel)).isDirectory()) sourceFiles(rel, out);
    else if (/\.(ts|tsx|css)$/.test(entry)) out.push(rel);
  }
  return out;
}

const TOKEN_LAYER = "packages/design-system/src/tokens.css";

const UI_SOURCES = [
  ...sourceFiles("packages/ui/src"),
  ...sourceFiles("packages/site-renderer/src"),
  // apps render UI too. The prototype screens under apps/app are held to the same
  // discipline as the component library — a token rule that stops at a package
  // boundary is not a rule.
  ...sourceFiles("apps/app/src"),
  ...sourceFiles("apps/sites/src"),
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

  it("declares no hard-coded hex colour in a className or an inline style", () => {
    // Scoped to styling. A hex quoted in visible copy — the review page labels its own
    // token values — is documentation, not a style. Narrowed 2026-08-31 after the rule
    // fired on its own documentation.
    const offenders: string[] = [];
    for (const file of UI_SOURCES) {
      const styling = code(file).match(/className=(?:"[^"]*"|\{[^}]*\})|style=\{\{[^}]*\}\}/g) ?? [];
      const hits = styling.join(" ").match(/#[0-9a-fA-F]{3,8}\b/g);
      if (hits) offenders.push(`${relative(ROOT, file)} → ${hits.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });

  it("never builds a Tailwind class name at runtime", () => {
    /*
      Tailwind scans source files for LITERAL class names.

      `ACCENT_EDGE[n].replace("border-", "hover:border-")` produces a string that exists
      nowhere in the source, so the utility is never generated. It typechecks, it
      renders, the element gets the class, and the colour simply never appears. Found on
      2026-09-01 in the assessment accent scale, where every hover border was silently
      inert.

      A template literal has the same problem: `bg-${tone}-subtle` is invisible to the
      scanner. Write the variants out; a five-line map is cheaper than a bug you can only
      see by looking.
    */
    /*
      The prefix must be GLUED to the interpolation.

      `text-caption border px-2 ${tone}` is fine and common: every class in it is a
      literal, and the variable holds another complete class. `bg-${tone}` and
      `bg-chart-${n}` are not: the utility name only exists once the code runs, which is
      after Tailwind has finished looking. The space is the whole difference, so the
      pattern requires none.
    */
    /*
      `fill` and `stroke` are absent on purpose. They are Tailwind prefixes AND SVG
      attribute names, and a recharts gradient id of `fill-${series.key}` is neither a
      class nor a bug. An exception list for that one case would be a rule with a hole
      in it; dropping two rarely-dynamic prefixes is a rule with a smaller mouth.
    */
    const PREFIXES = "bg|text|border|ring|outline|from|via|to|shadow";
    const CONSTRUCTED = [
      new RegExp(`\\.replace\\(\\s*["'\`](?:${PREFIXES})[-:]`),
      new RegExp("\\b(?:" + PREFIXES + ")-[a-z0-9-]*\\$\\{"),
    ];

    // UI_SOURCES, not sourceFiles(): that helper takes a directory and swallows its
    // own failure, so calling it wrong iterates nothing and the test passes for no
    // reason. Which is exactly what happened when this was first written.
    expect(UI_SOURCES.length).toBeGreaterThan(20);

    const offenders: string[] = [];
    for (const file of UI_SOURCES) {
      const raw = readFileSync(file, "utf8");
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      for (const pattern of CONSTRUCTED) {
        const hit = pattern.exec(code);
        if (hit) offenders.push(`${relative(ROOT, file)} → ${hit[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("uses no arbitrary colour or pixel value in a Tailwind bracket", () => {
    // Catches className="mt-[17px] bg-[#00786F] text-[13px]" — the defect
    // CLAUDE_CODE_RULES.md §11 names: values the token scales govern.
    //
    // Structural brackets are allowed: percentages, fr units, rem, grid templates and
    // transitioned property names. DESIGN_SYSTEM.md §21 specifies proportions — a 30%
    // context column, a 40% drawer — and a proportion is not a design token.
    // Narrowed 2026-08-31 while building the dashboard prototypes.
    const offenders: string[] = [];
    for (const file of UI_SOURCES) {
      const hits = (code(file).match(/\b[a-z-]+-\[[^\]]+\]/g) ?? []).filter(
        (h) => /#[0-9a-fA-F]{3,8}/.test(h) || /\d+px/.test(h),
      );
      if (hits.length) offenders.push(`${relative(ROOT, file)} → ${hits.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });

  it("never uses outline-none, which silently removes the focus indicator", () => {
    // Found by visual review on 2026-08-31: `outline-none` sets outline-style: none, so
    // `focus-visible:outline-2 outline-ring` produced a ring with width and colour but
    // no style. The indicator was invisible and no unit test could see it.
    const offenders: string[] = [];
    for (const file of UI_SOURCES) {
      if (/\boutline-none\b/.test(code(file))) offenders.push(relative(ROOT, file));
    }
    expect(offenders).toEqual([]);
  });

  it("never uses transition-colors, which animates the focus ring", () => {
    // Found by visual review on 2026-08-31: Tailwind v4 includes outline-color in the
    // `transition-colors` shorthand, so a focused control carried its LABEL colour at
    // 0ms and only reached --ring at ~150ms. Always visible, so not a WCAG failure, but
    // a focus indicator is the one signal a keyboard user navigates by.
    //
    // packages/ui/src/motion.ts exports COLOR_TRANSITION, which names the properties.
    const offenders: string[] = [];
    for (const file of UI_SOURCES) {
      if (/\btransition-colors\b/.test(code(file))) offenders.push(relative(ROOT, file));
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

describe("module resolution — the bundler has to agree with the compiler", () => {
  /**
   * `tsconfig.base.json` sets `moduleResolution: "Bundler"`, under which a relative
   * import must NOT carry a file extension.
   *
   * Four packages wrote `./ids.js` anyway. TypeScript tolerates it — it maps `.js` back
   * to `.ts` — so `pnpm typecheck` was green. Webpack cannot: the file on disk is
   * `ids.ts`, so it resolves nothing.
   *
   * It stayed latent because no app imported those packages. The moment `apps/app`
   * imported `@zerocorp/contracts` for the D2 state machines, EVERY design-system route
   * returned 500 while `pnpm verify` still passed. Found by restarting the dev server,
   * 2026-08-31.
   *
   * > A green typecheck is not a running app. The compiler and the bundler resolve
   * > modules differently, and only one of them serves the page.
   */
  it("uses no file extension on a relative import", () => {
    const offenders: string[] = [];
    for (const file of [...sourceFiles("packages"), ...sourceFiles("apps")]) {
      const hits = code(file).match(/from\s+"\.\.?\/[^"]*\.(js|ts|tsx|mjs|cjs)"/g);
      if (hits) offenders.push(`${relative(ROOT, file)} → ${hits.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("formation states — one source of truth", () => {
  /**
   * D2, 2026-08-31. The repository carried three different formation state lists for
   * months, and a fourth was hiding in a dashboard prototype that quietly contradicted
   * the decision the moment it was made.
   *
   * `packages/contracts/src/formation.ts` owns these strings. Nothing else may spell out
   * a state that no longer exists.
   */
  const RETIRED = [
    "documents_collected",
    "kyc_passed",
    "kyc_or_identity_check",
    "ready_to_submit",
    "ein_pending",
    "ein_issued",
    "verification_complete",
  ];

  it("names no retired formation state anywhere in the source", () => {
    const sources = [
      ...sourceFiles("packages"),
      ...sourceFiles("apps"),
      ...sourceFiles("tests"),
    ].filter(
      (f) =>
        // Three files legitimately name the retired states: the contract's own docblock
        // explaining why they went, its test, and this rule's own list.
        !f.includes("formation.test.ts") &&
        !f.includes("contracts/src/formation.ts") &&
        !f.includes("design-tokens.test.ts"),
    );
    const offenders: string[] = [];
    for (const file of sources) {
      const hits = RETIRED.filter((r) => new RegExp(`["'\`]${r}["'\`]`).test(code(file)));
      if (hits.length) offenders.push(`${relative(ROOT, file)} → ${hits.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });

  it("declares the state unions only in contracts", () => {
    // A second declaration is a second machine, and it will drift.
    const sources = [...sourceFiles("packages"), ...sourceFiles("apps")].filter(
      (f) => !f.startsWith("packages/contracts"),
    );
    const offenders: string[] = [];
    for (const file of sources) {
      if (/["'`]collecting_documents["'`]\s*\|/.test(code(file))) offenders.push(relative(ROOT, file));
    }
    expect(offenders).toEqual([]);
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
