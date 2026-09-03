import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The token layer COMPILES.
 *
 * Every other rule in tests/architecture reads the stylesheet as text: no arbitrary
 * values, no single-side toned borders, no bare tints, no comment closed mid-line. All of
 * them assume the file is valid CSS, and none of them would notice if it were not.
 *
 * It was not, on 2026-09-03:
 *
 *   Syntax error: tailwindcss: .../tokens.css:1:36: Invalid custom property, expected a value
 *
 * Every route in the product went down behind a build error, and the whole suite stayed
 * green, because a text rule cannot fail on a file the parser refuses. The gap is not
 * theoretical — it was the difference between 687 passing tests and a product nobody
 * could open.
 *
 * So this compiles the real thing with the real compiler: the app's own entry stylesheet,
 * through the same Tailwind the dev server and the production build use. If the token
 * layer will not parse, this fails first and says so in the same words the build does.
 *
 * Two assertions ride along, both about failures Tailwind itself does NOT reject:
 *
 *   an EMPTY declaration       `--foo: ;` parses. The utility then resolves to nothing
 *                              and the colour is simply absent from the screen.
 *   a DANGLING reference       a utility resolving `var(--x)` where `--x` never reached
 *                              the light `:root`. The browser resolves it to nothing and
 *                              the element paints transparent — this is exactly how
 *                              --journey-build-wash disappeared, and it was found by
 *                              reading getComputedStyle in a browser because no build,
 *                              type check or diff shows it.
 *
 * Both are invisible to a build, to a type check, and to a person reading the diff.
 */

const ROOT = resolve(__dirname, "../..");
const ENTRY = join(ROOT, "apps/app/src/app/globals.css");
const TOKENS = join(ROOT, "packages/design-system/src/tokens.css");

/**
 * Resolved from apps/app, not from the repository root.
 *
 * pnpm does not hoist, so `tailwindcss` exists only where it is declared. Hard-coding a
 * path into node_modules/.pnpm would pin the version and rot at the next upgrade.
 */
const appRequire = createRequire(join(ROOT, "apps/app/package.json"));

/** Mirrors what the bundler does with `@import`, for the two ids this entry uses. */
function loadStylesheet(id: string, base: string) {
  const path =
    id === "tailwindcss"
      ? appRequire.resolve("tailwindcss/index.css")
      : id === "@zerocorp/design-system/tokens.css"
        ? TOKENS
        : id.startsWith(".")
          ? resolve(base, id)
          : appRequire.resolve(id);
  return { path, base: dirname(path), content: readFileSync(path, "utf8") };
}

/**
 * Every LIGHT root-scoped rule in the compiled output, concatenated.
 *
 * There are two, and taking only the first one found was wrong: Tailwind emits its own
 * `@theme` into `:root, :host`, and the ZeroCorp token layer emits into `:root`. Missing
 * the former made `--font-sans` look undeclared. `.dark` is deliberately excluded — it
 * only overrides, and a token that exists solely there is a token the light theme lost.
 *
 * Brace matching rather than a regex, because a regex cannot count.
 */
function lightRootDeclarations(css: string): string {
  const blocks: string[] = [];
  for (const m of css.matchAll(/(?:^|\n)([ \t]*)([^\n{}]*[^\s{}])\s*\{/g)) {
    if (!/^:root(\s*,\s*:host)?$/.test(m[2]!.trim())) continue;
    let depth = 0;
    for (let i = css.indexOf("{", m.index); i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) {
        blocks.push(css.slice(m.index, i));
        break;
      }
    }
  }
  if (blocks.length === 0) throw new Error("compiled output has no light :root block");
  return blocks.join("\n");
}

/** Every .ts/.tsx under a directory, recursively. */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...sourceFiles(p));
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

describe("the token layer compiles", () => {
  it("builds the app's entry stylesheet with the real Tailwind compiler", async () => {
    const { compile } = (await import(appRequire.resolve("tailwindcss"))) as {
      compile: (
        css: string,
        opts: {
          base: string;
          loadStylesheet: (id: string, base: string) => ReturnType<typeof loadStylesheet>;
        },
      ) => Promise<{ build: (candidates: string[]) => string }>;
    };

    const compiler = await compile(readFileSync(ENTRY, "utf8"), {
      base: dirname(ENTRY),
      loadStylesheet,
    });

    /*
      Every colour token is asked for by name.

      `build([])` was the first version, and it is a check that cannot fail: Tailwind only
      emits the theme variables a candidate actually uses, so with no candidates the
      `--color-*` aliases never appear in the output and the assertion below had nothing
      to look at. Verified by deleting a token and watching the test stay green.

      One `bg-<name>` per `--color-<name>` declared in the theme forces every alias to be
      emitted, which is what makes "does this resolve to anything" a real question.
    */
    const themeColours = [
      ...readFileSync(TOKENS, "utf8").matchAll(/^\s*--color-([a-z0-9-]+)\s*:/gm),
    ].map((m) => `bg-${m[1]}`);
    expect(themeColours.length).toBeGreaterThan(40);

    const css = compiler.build(themeColours);
    expect(css.length).toBeGreaterThan(1000);

    // A declaration with no value parses, and then renders nothing.
    const empty = [...css.matchAll(/--([a-z0-9-]+):\s*(?=[;}])/g)].map((m) => m[1]);
    expect(empty, `declared with no value: ${empty.join(", ")}`).toEqual([]);

    /*
      Read from the compiled `:root` block, never from the source file and never from the
      whole output.

      Two wrong versions of this check, both caught by injecting the bug and watching the
      test stay green:

        SOURCE TEXT   a declaration swallowed by an early comment close is still there in
                      the source. The set contained a token the browser would never see.
        WHOLE OUTPUT  every token is declared twice, once in `:root` and once in `.dark`.
                      Losing the light one leaves the dark one, and the set still had it —
                      which is exactly how --journey-build-wash survived every check and
                      was found by reading getComputedStyle in a browser.

      `:root` is the light theme and the base every token must reach. `.dark` only
      overrides. So the honest question is "did this survive compilation INTO :root", and
      that is the only place worth looking.
    */
    const declared = new Set([...lightRootDeclarations(css).matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]!));

    /*
      Some variables are supplied at RUNTIME, and the exemption is derived rather than
      listed.

      Two legitimate sources, and both are proved from the source tree instead of trusted:

        next/font   hashes each face at build time, so the value cannot exist in a static
                    file; `GeistSans.variable` puts it on <html>. Asserted below, so if
                    the root layout ever stops applying those classes the exemption goes
                    with it.
        inline      `style={{ "--zc-highlight": … }}` on a component sets a variable per
                    element. Collected by scanning for exactly that shape.

      A hand-written exemption list nobody re-derives is how the next --journey-build-wash
      gets in. Everything here is recomputed on every run.
    */
    const layout = readFileSync(join(ROOT, "apps/app/src/app/layout.tsx"), "utf8");
    expect(layout).toContain("GeistSans.variable");
    expect(layout).toContain("GeistMono.variable");

    const setAtRuntime = new Set(["--font-geist-sans", "--font-geist-mono"]);
    for (const dir of ["packages/ui/src", "apps/app/src", "apps/sites/src"]) {
      for (const file of sourceFiles(join(ROOT, dir))) {
        for (const m of readFileSync(file, "utf8").matchAll(/["'](--[a-z0-9-]+)["']\s*:/g)) {
          setAtRuntime.add(m[1]!);
        }
      }
    }

    /*
      Every var() REFERENCE, not every alias.

      The first version looked for `--alias: var(--target)` pairs, which do not survive:
      Tailwind flattens `--color-journey-build-wash: var(--journey-build-wash)` straight
      into `background-color: var(--journey-build-wash)` and never emits the alias. So the
      regex matched nothing, and deleting a token left the test green. Verified.

      A reference is a reference wherever it appears. `--tw-*` are Tailwind's own,
      declared through @property rather than in a rule, so they are excluded by prefix and
      not by name.
    */
    /*
      Only BARE references. `var(--x, something)` states outright that absence is fine,
      and Tailwind's own preflight relies on that for --default-font-feature-settings and
      three siblings. A fallback is a decision; a bare var() is a promise.
    */
    const referenced = [...css.matchAll(/var\((--[a-z0-9-]+)\s*\)/g)].map((m) => m[1]!);
    const dangling = [
      ...new Set(
        referenced.filter(
          (t) => !t.startsWith("--tw-") && !declared.has(t) && !setAtRuntime.has(t),
        ),
      ),
    ].map((t) => `${t} is referenced but never declared in the light :root`);
    expect(dangling, dangling.join("\n")).toEqual([]);
  });
});
