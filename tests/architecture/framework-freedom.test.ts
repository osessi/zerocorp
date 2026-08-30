import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const FRAMEWORKS = ["next", "react", "react-dom", "@nestjs/core", "@nestjs/common"];
const INFRA = ["@zerocorp/db", "@zerocorp/ai", "@zerocorp/integrations", "@zerocorp/storage",
  "@zerocorp/notifications", "@zerocorp/billing", "@zerocorp/auth", "@zerocorp/tenancy", "@zerocorp/security"];

const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

/**
 * NN-1 asserted structurally, not by convention.
 *
 * Under pnpm's isolated node_modules, a package can only import what it declares.
 * If domain never declares next or react, `import "next"` cannot resolve — this
 * test guards the declaration itself.
 */
describe("NN-1 — domain and application are framework-free", () => {
  for (const pkg of ["domain", "application"]) {
    const manifest = read(`packages/${pkg}/package.json`);
    const deps = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies };

    it(`packages/${pkg} declares no framework dependency`, () => {
      for (const framework of FRAMEWORKS) expect(Object.keys(deps)).not.toContain(framework);
    });

    it(`packages/${pkg} declares no infrastructure dependency (dependencies point inward)`, () => {
      for (const infra of INFRA) expect(Object.keys(deps)).not.toContain(infra);
    });

    it(`packages/${pkg} compiles without DOM and without Node types`, () => {
      const tsconfig = read(`packages/${pkg}/tsconfig.json`);
      expect(tsconfig.compilerOptions.types).toEqual([]);
      expect(tsconfig.compilerOptions.lib).not.toContain("DOM");
    });
  }

  it("packages/domain depends only on @zerocorp/contracts", () => {
    const deps = Object.keys(read("packages/domain/package.json").dependencies ?? {});
    expect(deps.filter((d) => d.startsWith("@zerocorp/"))).toEqual(["@zerocorp/contracts"]);
  });
});

/** NN-2 — the raw client cannot be reached from outside @zerocorp/db. */
describe("NN-2 — packages/db exposes only its public surface", () => {
  it('maps only "." in its exports field, making subpaths unresolvable', () => {
    const exportsField = read("packages/db/package.json").exports;
    expect(Object.keys(exportsField)).toEqual(["."]);
  });

  it("never re-exports the raw client from its entrypoint", () => {
    const raw = readFileSync(join(ROOT, "packages/db/src/index.ts"), "utf8");
    // Comments legitimately mention the private module; only real statements matter.
    const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code).not.toMatch(/from\s+["'][^"']*internal\//);
    expect(code).not.toMatch(/\bgetClient\b/);
  });
});

/** NN-6 — apps are peers. apps/api, when it arrives, is the public API, not a BFF. */
describe("architecture — apps do not depend on each other", () => {
  for (const app of ["sites", "app", "worker"]) {
    it(`apps/${app} declares no dependency on another app`, () => {
      const deps = Object.keys(read(`apps/${app}/package.json`).dependencies ?? {});
      for (const other of ["sites", "app", "worker"]) {
        if (other !== app) expect(deps).not.toContain(`@zerocorp/${other}`);
      }
    });
  }

  it("apps/sites is wired read-only and never receives the read-write DATABASE_URL", () => {
    const container = readFileSync(join(ROOT, "apps/sites/src/server/container.ts"), "utf8");
    expect(container).toContain("SITES_DATABASE_URL");
    expect(container).not.toMatch(/process\.env\[?"?DATABASE_URL/);
  });
});
