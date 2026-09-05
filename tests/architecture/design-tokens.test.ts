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
/**
 * Walks a directory for source files.
 *
 * `nonEmpty` is not optional politeness. The first version of the class-name rule below
 * called this with no argument, the throw was swallowed here, and it iterated ZERO files
 * and passed. A helper that returns [] on a missing directory is fine; a caller that never
 * checks is not. CLAUDE_CODE_RULES.md §32b.
 */
function sourceFiles(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(join(ROOT, dir));
  } catch (cause) {
    // Silence here is what made three separate checks pass without running.
    throw new Error(`sourceFiles(${JSON.stringify(dir)}) could not be read`, { cause });
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

  it("never gives a panel a bare left bar", () => {
    /*
      DESIGN_SYSTEM.md §21.27. A coloured left bar is never a panel's only edge.

      Said twice in review and never written down, so it was built a third time. A quote
      bar with no box is the house style of every AI chat product, and it does not
      enclose anything: no right edge means no shape, and a stack of them reads as one
      ragged column rather than as separate things.

      The check is per CLASS STRING, not per file, and that precision is what removes the
      need for an exception list. `border border-l-2` is allowed and always was: a
      heavier edge on a box that already exists. `border-l-2` alone is not. Alert and
      Toast pass on their own merits rather than by being named here, which means the
      rule describes the actual principle instead of the current violations.
    */
    const BARE_LEFT_BAR = /\bborder-l-(?:2|4|8)\b/;
    // A standalone `border`, not `border-something`.
    const FULL_BORDER = /\bborder(?=[\s"'`]|$)/;

    const offenders: string[] = [];
    for (const file of UI_SOURCES) {
      const raw = readFileSync(file, "utf8");
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      for (const [literal] of code.matchAll(/["'`][^"'`\n]*["'`]/g)) {
        if (!BARE_LEFT_BAR.test(literal)) continue;
        if (FULL_BORDER.test(literal)) continue;
        offenders.push(`${relative(ROOT, file)} → ${literal.slice(0, 60)}`);
      }
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

  it("never closes a CSS comment in the middle of a line", () => {
    /*
      The comment terminator is the comment terminator wherever it appears, prose or not.

      A docblock explaining that the journey tints are not aliases of the success and info
      families spelled those families as globs, with a slash between them. That slash
      followed a star, so the comment CLOSED there. Everything after it became garbage,
      the parser discarded until it could recover, and it swallowed exactly one
      declaration: `--journey-build-wash`. The token was undefined, the utility resolved to
      transparent, and NOTHING saw it — the file parses, the build is green, every test
      passes, and the colour is simply absent from the screen. Found by reading
      getComputedStyle in a browser on 2026-09-03, which is the only place it was visible.

      A legitimate terminator is the last thing on its line. That is the whole rule, and in
      a stylesheet it has no exceptions.

      Same trap, one language over: writing this docblock with the offending spelling in it
      broke the TEST FILE, which is as good a demonstration as §32b ever gets.
    */
    const offenders: string[] = [];
    const END = "*" + "/";
    for (const file of [TOKEN_LAYER, ...UI_SOURCES].filter((f) => f.endsWith(".css"))) {
      readFileSync(join(ROOT, file), "utf8")
        .split("\n")
        .forEach((line, i) => {
          /*
            The FIRST terminator must be the last thing on the line.

            `endsWith` alone had the same kind of hole the rules above kept growing: a line
            that closes a comment early AND happens to close again at its end passes it,
            which is precisely the shape a prose glob followed by more prose produces.
            Checking the first occurrence has nowhere to hide.
          */
          const at = line.indexOf(END);
          if (at !== -1 && at + END.length !== line.trimEnd().length) {
            offenders.push(`${file}:${i + 1} closes a comment mid-line: ${JSON.stringify(line.trim().slice(0, 70))}`);
          }
        });
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
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
    const scanned = [...sourceFiles("packages"), ...sourceFiles("apps")];
    expect(scanned.length).toBeGreaterThan(100);
    for (const file of scanned) {
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
    const rendererFiles = sourceFiles("packages/site-renderer/src");
    expect(rendererFiles.length).toBeGreaterThan(0);
    for (const file of rendererFiles) {
      expect(code(file)).not.toMatch(/@zerocorp\/ui/);
    }
  });

  it("ui never imports the customer website renderer", () => {
    const uiFiles = sourceFiles("packages/ui/src");
    expect(uiFiles.length).toBeGreaterThan(20);
    for (const file of uiFiles) {
      expect(code(file)).not.toMatch(/@zerocorp\/site-renderer/);
    }
  });

  /**
   * A tint with no tone-coloured edge is the SOLE carrier, and the 1.10 perceptibility
   * floor applies to it with full force (§4.5). A tint composed with `border-{tone}` or
   * `border-l-{tone}` is the fourth channel of four -- border, ink, glyph, fill -- and is
   * exempt, because measured on --accent the light tints reach 1.01-1.06 and inside a
   * StatusBadge that is both true and irrelevant.
   *
   * FILE-scoped, not line-scoped. The first version checked one line and flagged Alert and
   * Toast, which compose TONE_EDGE and TONE_SURFACE on ADJACENT lines. A line-based rule
   * cannot see composition, and a rule that reports correct code is a rule people delete.
   *
   * §32b demonstration -- removing `border-success` from Avatar.tsx gives:
   *   AssertionError: packages/ui/src/avatar/Avatar.tsx uses bg-success-subtle with no
   *   border-success / border-l-success / TONE_EDGE anywhere in the file
   */
  it("never uses a -subtle tint without a tone-coloured edge somewhere in the same file", () => {
    expect(UI_SOURCES.length).toBeGreaterThan(20);
    const TONES = ["success", "warning", "info", "processing", "destructive", "ai"] as const;
    const offenders: string[] = [];

    for (const file of UI_SOURCES) {
      const body = code(file);
      // TONE_EDGE is the shared `border-l-{tone}` map; a file that composes it has an edge.
      if (body.includes("TONE_EDGE")) continue;
      for (const tone of TONES) {
        if (!new RegExp(`bg-${tone}-subtle`).test(body)) continue;
        if (new RegExp(`border-(l-)?${tone}\\b`).test(body)) continue;
        offenders.push(`${file} uses bg-${tone}-subtle with no border-${tone} anywhere in the file`);
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  /**
   * No accent bar on one edge. Ever.
   *
   * A 2px coloured rule down the left of a panel, or across its top, was rejected three
   * separate times — §21.27 for the left, and again when the same shape came back rotated
   * ninety degrees on a fact card. A border is on all four sides or on none.
   *
   * The rule targets a SIDED border carrying a TONE, not `border-b` on a header: a
   * hairline dividing two regions is structure and always has been. What is banned is
   * decoration pretending to be structure.
   *
   * §32b demonstration — restoring `border-l-2 border-warning` on Alert gives:
   *   AssertionError: packages/ui/src/feedback/Alert.tsx: border-l-2 ... border-warning
   */
  it("never puts a tone-coloured border on a single edge", () => {
    expect(UI_SOURCES.length).toBeGreaterThan(20);
    const TONES = "success|warning|info|processing|destructive|ai|primary";
    const offenders: string[] = [];

    for (const file of UI_SOURCES) {
      /*
        One className AT A TIME, however many lines it spans.

        Three holes, each found only after the rule reported green while the banned shape
        was on screen:

          1. requiring a WIDTH or a tone SUFFIX, so `border-b` beside `border-warning`
             matched neither
          2. reading a single line, so a cx() call splitting the sided border and the tone
             across two lines matched neither
          3. reading a WINDOW of lines, which then flagged a neutral `border-t` because an
             unrelated sibling five lines away carried a tone

        The unit that matters is one element's class list. Extracting each `className` and
        testing it alone has no window to be wrong about.

        A rule with a hole is worse than no rule — CLAUDE_CODE_RULES §32b.
      */
      const body = code(file);
      const classLists = [
        ...body.matchAll(/className=\{cx\(([\s\S]*?)\)\}/g),
        ...body.matchAll(/className="([^"]*)"/g),
        ...body.matchAll(/className=\{`([^`]*)`\}/g),
      ].map((m) => m[1] ?? "");

      for (const list of classLists) {
        /*
          Two shapes, two tests.

          A THICKENED single edge — `border-l-2`, `border-t-4` — is the banned shape on
          its own, whatever colour it ends up being. That is what makes it read as an
          accent bar rather than a divider, and it is flagged unconditionally.

          Why unconditionally: the fourth hole in this rule was Alert, whose tone arrives
          as `TONE_EDGE[tone]` — a variable. No amount of reading the class list finds a
          colour that is not written in it. The width is the part that is always literal.

          A HAIRLINE single edge (`border-b`) is a divider and legitimate, so it is only
          an offence when a tone is written beside it.
        */
        // -0 is a RESET, not an accent: `lg:border-t-0` removes a border at a breakpoint.
        if (/\bborder-[tblr]-[1-9]/.test(list)) {
          offenders.push(`${file}: ${list.replace(/\s+/g, " ").trim().slice(0, 90)}`);
          continue;
        }
        if (!/\bborder-[tblr]\b|\bborder-[tblr]-/.test(list)) continue;
        if (!new RegExp(`\\bborder-(?:[tblr]-)?(?:${TONES})\\b`).test(list)) continue;
        offenders.push(`${file}: ${list.replace(/\s+/g, " ").trim().slice(0, 90)}`);
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  /**
   * No cards welded together.
   *
   * Three idioms build the same slab, and all three have shipped and been rejected:
   *
   *   `gap-px` over a border-coloured ground   a grid whose gutters are drawn as seams
   *   `last:border-b-0`                        rows sharing a divider inside one box
   *   `divide-y` / `divide-x`                  the same, spelled with a plugin
   *
   * The standing rule, given for the third time on 2026-09-03: "je ne veux plus non plus
   * des cartes de donnees collees a 4, chaque bloc doit etre separe". A block is its own
   * object with an edge on four sides, and the SPACE between them is what says so.
   *
   * Not a taste question. A welded grid is also where single-side borders come back:
   * every seam in it is a `border-b` or a `divide-y` by another name, which is why this
   * rule and the one above it keep catching the same commit.
   *
   * The calendar was the one honest candidate for a mesh and it was measured against the
   * rule anyway: separated cells read as days, welded cells read as a spreadsheet.
   *
   * §32b demonstration -- restoring `divide-y` on MetricGrid gives:
   *   AssertionError: packages/ui/src/panels/panels.tsx: divide-y welds blocks together
   */
  it("never welds blocks into one slab", () => {
    expect(UI_SOURCES.length).toBeGreaterThan(20);
    const WELDS = [
      [/\bgap-px\b/, "gap-px"],
      [/\blast:border-[tblr]-0\b/, "last:border-b-0"],
      [/\bdivide-[xy]\b/, "divide-x/y"],
    ] as const;
    const offenders: string[] = [];

    /*
      SHIPPED surfaces only, and the exemption is named rather than implied.

      `apps/app/src/app/design-system` is the internal gallery: pages whose job is to
      show what a component looked like, including prototypes kept deliberately as a
      record of rejected directions. Holding a museum to the rule would mean editing the
      exhibits. Nothing under it is reachable by a customer.

      Everything a founder can open is in scope, packages/ui included.
    */
    const SHIPPED = UI_SOURCES.filter((f) => !f.includes("/app/design-system/"));
    expect(SHIPPED.length).toBeGreaterThan(20);

    for (const file of SHIPPED) {
      const body = code(file);
      const classLists = [
        ...body.matchAll(/className=\{cx\(([\s\S]*?)\)\}/g),
        ...body.matchAll(/className="([^"]*)"/g),
        ...body.matchAll(/className=\{`([^`]*)`\}/g),
      ].map((m) => m[1] ?? "");

      for (const list of classLists) {
        for (const [pattern, name] of WELDS) {
          if (pattern.test(list)) offenders.push(`${file}: ${name} welds blocks together`);
        }
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  /**
   * One yellow, four steps, no fifth.
   *
   * `--accent-highlight` #FACC15 is the product mark, and the warning ramp is the same
   * hue at three other lightnesses: --warning-wash, --warning-subtle, --warning. Asked
   * for on 2026-09-03: "il faut utiliser ce jaune partout ou il y a du jaune sur le
   * logiciel".
   *
   * An OPACITY of the mark is what breaks that. `bg-accent-highlight/15` composites to a
   * colour nobody chose, which changes with whatever is behind it, and cannot be measured
   * against a ground because it has no fixed value. The calendar had one and it read as a
   * washed-out yellow beside a saturated one. If a lighter step is wanted, the ramp has
   * two.
   *
   * §32b demonstration -- restoring bg-accent-highlight/15 on the calendar gives:
   *   AssertionError: .../content/Calendar.tsx: accent-highlight/15 is a fifth yellow
   */
  /**
   * §11 / §25.3 — the icon scale, ENFORCED.
   *
   * The rule this test exists to prove, written after the 2026-09-04 audit:
   *
   *   > A standard nothing enforces is not locked, it is decorative.
   *   > Every locked decision needs a mechanism that makes violating it fail.
   *
   * The `IconSize` union has existed since the icon layer was written and enforced
   * nothing, because nothing was required to pass through it. Counted on 2026-09-04:
   * 56 of 178 call sites (31%) used a size not on the scale, and the "locked" 20px
   * standard was the fifth most common value in its own product. The dominant size was
   * 16, followed by 14, which is not on the scale at all.
   *
   * A type is not a mechanism when every call site can route around it.
   */
  it("uses only sizes on the §11 icon scale", () => {
    const SCALE = new Set([12, 16, 20, 24, 32, 40]);
    const offenders: string[] = [];
    for (const file of UI_SOURCES) {
      for (const hit of code(file).match(/size=\{(\d+)\}/g) ?? []) {
        const value = Number(hit.replace(/\D/g, ""));
        if (!SCALE.has(value)) offenders.push(`${relative(ROOT, file)} → ${hit}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("never dilutes the mark into a fifth yellow", () => {
    const SHIPPED = UI_SOURCES.filter((f) => !f.includes("/app/design-system/"));
    expect(SHIPPED.length).toBeGreaterThan(20);
    const offenders: string[] = [];

    for (const file of SHIPPED) {
      for (const m of code(file).matchAll(/accent-highlight(-ink)?\/(\[?[\w.%]+\]?)/g)) {
        offenders.push(`${file}: accent-highlight/${m[2]} is a fifth yellow`);
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
