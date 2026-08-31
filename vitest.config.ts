import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx", "apps/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**", ".claude/**"],
    // Node by default; component suites opt in with @vitest-environment happy-dom.
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
  },
  esbuild: { jsx: "automatic" },
});
