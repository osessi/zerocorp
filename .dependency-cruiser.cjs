/**
 * ZeroCorp dependency boundaries — mechanical enforcement.
 *
 * These rules are the reason Option C survives to V2/V3 without a structural
 * rewrite. They are release-blocking: `pnpm boundaries` runs in CI.
 *
 * See docs/adr/0001-runtime-topology.md and ARCHITECTURE.md "Boundary enforcement".
 */
const FRAMEWORKS = "^(next|react|react-dom|@nestjs)($|/)";
const INFRA = "^packages/(db|tenancy|auth|billing|ai|integrations|storage|notifications|security)/";
const COMPOSITION_ROOT = "^apps/[^/]+/src/server/container\\.ts$";

module.exports = {
  forbidden: [
    {
      name: "domain-is-framework-free",
      severity: "error",
      comment:
        "NN-1 — packages/domain must not import any framework. It is also blocked by " +
        "pnpm isolation (not a declared dependency) and by tsconfig lib/types lockdown.",
      from: { path: "^packages/domain/" },
      to: { path: FRAMEWORKS, dependencyTypes: ["npm", "npm-dev", "npm-peer"] },
    },
    {
      name: "application-is-framework-free",
      severity: "error",
      comment: "NN-1 — packages/application must not import any framework.",
      from: { path: "^packages/application/" },
      to: { path: FRAMEWORKS, dependencyTypes: ["npm", "npm-dev", "npm-peer"] },
    },
    {
      name: "domain-has-no-io",
      severity: "error",
      comment:
        "NN-1 — the domain performs no IO. Node built-ins are unavailable by design; " +
        "anything non-deterministic is injected as an application port.",
      from: { path: "^packages/(domain|application)/" },
      to: { dependencyTypes: ["core"] },
    },
    {
      name: "domain-depends-only-on-contracts",
      severity: "error",
      comment: "NN-1 — packages/domain may only depend on @zerocorp/contracts.",
      from: { path: "^packages/domain/" },
      to: { path: "^packages/(?!domain/|contracts/)" },
    },
    {
      name: "application-depends-only-on-domain-and-contracts",
      severity: "error",
      comment:
        "NN-1 — packages/application defines ports; infrastructure implements them. " +
        "Dependencies point inward. application must never import db, ai, integrations, etc.",
      from: { path: "^packages/application/" },
      to: { path: "^packages/(?!application/|domain/|contracts/)" },
    },
    {
      name: "db-is-reached-only-from-composition-roots",
      severity: "error",
      comment:
        "NN-2 — an app reaches the database only through its composition root, which " +
        "wires the read-only or read-write unit of work. Route handlers, Server " +
        "Components and Server Actions call use cases, never the database.",
      from: { path: "^apps/", pathNot: COMPOSITION_ROOT },
      to: { path: "^packages/db/" },
    },
    {
      name: "db-internals-are-private",
      severity: "error",
      comment:
        "NN-2 — the raw Drizzle client never leaves @zerocorp/db. The package's " +
        "\"exports\" field already makes this unresolvable; this rule is the second net.",
      from: { pathNot: "^packages/db/" },
      to: { path: "^packages/db/src/internal/" },
    },
    {
      name: "infrastructure-never-imports-presentation",
      severity: "error",
      comment: "Layer 3 must not depend on Layer 4. Infrastructure knows nothing about UI.",
      from: { path: INFRA },
      to: { path: "^packages/(ui|site-renderer|design-system)/" },
    },
    {
      name: "packages-never-import-apps",
      severity: "error",
      comment: "Packages are reusable; apps are deployment shells. Dependencies point inward.",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "apps-never-import-each-other",
      severity: "error",
      comment:
        "apps/app, apps/sites and apps/worker are peers. They share packages, never code. " +
        "NN-6 — when apps/api arrives it will be the public API, not a BFF for apps/app.",
      from: { path: "^apps/([^/]+)/" },
      to: { path: "^apps/", pathNot: "^apps/$1/" },
    },
    {
      name: "not-to-unresolvable",
      severity: "error",
      comment:
        "An import that cannot be resolved is usually a boundary violation, not a typo: " +
        "under pnpm's isolated node_modules a package can only import what it declares. " +
        "This is the net that makes NN-1 visible in the module graph, not just in tsc.",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies break the layering and the build graph.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment:
        "Unreachable module — dead code or missing wiring. Package entrypoints " +
        "(src/index.ts), composition roots and Next.js convention files are public " +
        "surfaces reached by the framework, not by imports, so they are exempt.",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)src/index\\.ts$",
          "(^|/)src/server/container\\.ts$",
          "(^|/)(layout|page|route|middleware|error|loading|not-found)\\.tsx?$",
          "\\.(test|spec)\\.tsx?$",
          "(^|/)(next|eslint|vitest|turbo)\\.config\\.",
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // next-env.d.ts is generated by Next and git-ignored; it is not authored code.
    exclude: { path: "(node_modules|dist|\\.next|\\.turbo|next-env\\.d\\.ts)" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      // "types" is deliberately absent: it would resolve workspace imports to
      // dist/*.d.ts, which the exclude filter drops, hiding real violations.
      conditionNames: ["import", "require", "node", "default"],
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
