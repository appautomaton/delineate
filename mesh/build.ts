// Builds Mesh Gradient into a folder laid out as a site's root: its own page as index.html, and
// under mesh/ the stage's modules compiled from TypeScript, with its stylesheets.
//
//   node mesh/build.ts [<out>]        (npm run mesh:build; writes mesh/dist)

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL("./", import.meta.url));
export const DIST = join(HERE, "dist");

/** Locate node_modules/.bin/tsc whether invoked from the main checkout or a git worktree. */
function findTsc(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, "node_modules", ".bin", "tsc");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return fileURLToPath(new URL("../node_modules/.bin/tsc", import.meta.url));
}

const TSC = findTsc(HERE);

/** Into `out`: out/mesh/ always; out/index.html, the stage's own page, unless `page` is false. */
export function build(out = DIST, { page = true } = {}): void {
  const assets = join(out, "mesh");
  rmSync(assets, { recursive: true, force: true });
  mkdirSync(assets, { recursive: true });
  execFileSync(TSC, ["-p", HERE, "--noEmit", "false", "--outDir", assets], { stdio: "inherit" });
  cpSync(join(HERE, "stage.css"), join(assets, "stage.css"));
  cpSync(join(HERE, "card.css"), join(assets, "card.css"));
  if (page) {
    cpSync(join(HERE, "style.css"), join(assets, "style.css"));
    const html = readFileSync(join(HERE, "index.html"), "utf8").replace(/(<script\b[^>]*\bsrc="[^"]+)\.ts"/g, '$1.js"');
    writeFileSync(join(out, "index.html"), html);
  }
}

if (import.meta.main) {
  const out = process.argv[2];
  if (!out) rmSync(DIST, { recursive: true, force: true });
  build(out);
  if (!out) console.log("built mesh/dist");
}
