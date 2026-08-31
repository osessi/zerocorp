// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * Second net over .dependency-cruiser.cjs. dependency-cruiser owns the module
 * graph; ESLint catches the same violations in the editor, before CI.
 */
const FRAMEWORK_FREE = {
  files: ["packages/domain/**/*.ts", "packages/application/**/*.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        { group: ["next", "next/*", "react", "react-dom", "@nestjs/*"],
          message: "NN-1 — domain and application are framework-free. Inject a port instead." },
        { group: ["node:*", "fs", "path", "crypto", "http", "https"],
          message: "NN-1 — no IO in domain or application. Inject a Clock, IdGenerator or repository port." },
        { group: ["@zerocorp/db", "@zerocorp/ai", "@zerocorp/integrations", "@zerocorp/storage",
                  "@zerocorp/notifications", "@zerocorp/billing", "@zerocorp/auth", "@zerocorp/tenancy"],
          message: "NN-1 — dependencies point inward. Define a port here; let infrastructure implement it." },
      ],
    }],
  },
};

const NO_DB_OUTSIDE_COMPOSITION_ROOT = {
  files: ["apps/**/*.ts", "apps/**/*.tsx"],
  ignores: ["apps/*/src/server/container.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        { group: ["@zerocorp/db", "@zerocorp/db/*", "drizzle-orm", "drizzle-orm/*", "postgres"],
          message: "NN-2 — reach the database through a use case. Only src/server/container.ts wires @zerocorp/db." },
      ],
    }],
  },
};

/** Repository tooling runs in Node, not in a browser. */
const TOOLING_NODE = {
  files: ["tooling/**/*.mjs", "tooling/**/*.js"],
  languageOptions: {
    globals: { process: "readonly", console: "readonly", __dirname: "readonly", URL: "readonly" },
  },
};

/** Tooling config files run in CommonJS under Node. */
const TOOLING_CJS = {
  files: ["**/*.cjs"],
  languageOptions: {
    sourceType: "commonjs",
    globals: { module: "writable", require: "readonly", __dirname: "readonly", process: "readonly" },
  },
};

export default tseslint.config(
  { ignores: ["**/dist/**", "**/.next/**", "**/.turbo/**", "**/node_modules/**", ".claude/**", "**/next-env.d.ts"] },
  TOOLING_CJS,
  TOOLING_NODE,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  FRAMEWORK_FREE,
  NO_DB_OUTSIDE_COMPOSITION_ROOT,
);
