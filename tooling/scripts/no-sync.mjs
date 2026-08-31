#!/usr/bin/env node
/**
 * Keeps the build directories out of iCloud Drive.
 *
 * This repository lives under ~/Documents, which macOS syncs to iCloud Drive when
 * "Desktop & Documents Folders" is on. iCloud cannot reconcile files a build tool
 * rewrites constantly, so it forks them: `cache-life.d 2.ts`, `cache-life.d 3.ts`.
 * Those forks land inside tsconfig's include and break `pnpm typecheck` with duplicate
 * identifier errors that have nothing to do with the code.
 *
 * Two things happen here, before every dev run and every build:
 *   1. any existing conflict fork is deleted;
 *   2. the build directories are marked with the FileProvider ignore attribute, which
 *      tells iCloud to leave them alone. The marker has to be re-applied because the
 *      directories are recreated.
 *
 * This is a mitigation, not the fix. The fix is to move the repository out of the
 * synced folder, or to turn Documents sync off.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const IGNORED = [".next", ".turbo", "node_modules", "dist"];
const SKIP = new Set(["node_modules", ".git"]);

/** iCloud conflict forks: "name 2.ts", "name 3.json". */
const FORK = /\s[2-9]\d*(\.[^.]+)?$/;

let removed = 0;
function sweep(dir, depth = 0) {
  if (depth > 6) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const full = join(dir, e.name);
    if (FORK.test(e.name)) {
      rmSync(full, { recursive: true, force: true });
      removed += 1;
      continue;
    }
    if (e.isDirectory()) sweep(full, depth + 1);
  }
}

function markIgnored(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  try {
    execFileSync("xattr", ["-w", "com.apple.fileprovider.ignore#P", "1", dir], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

sweep(ROOT);

let marked = 0;
if (process.platform === "darwin") {
  for (const name of IGNORED) {
    const dir = join(ROOT, name);
    if (markIgnored(dir)) marked += 1;
  }
  for (const app of ["apps/app", "apps/sites", "apps/worker"]) {
    if (!existsSync(join(ROOT, app))) continue;
    for (const name of IGNORED) {
      const dir = join(ROOT, app, name);
      if (existsSync(dir) || name === ".next") {
        if (markIgnored(dir)) marked += 1;
      }
    }
  }
}

const parts = [];
if (removed) parts.push(`${removed} iCloud conflict fork${removed > 1 ? "s" : ""} removed`);
if (marked) parts.push(`${marked} build director${marked > 1 ? "ies" : "y"} marked no-sync`);
if (parts.length) console.log(`[no-sync] ${parts.join(" · ")}`);
