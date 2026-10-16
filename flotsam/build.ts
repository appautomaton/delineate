// Builds Flotsam into a folder laid out as a site's root: the page as 404.html, which GitHub Pages serves for every
// address that leads nowhere, and its scripts and stylesheet under flotsam/, compiled from TypeScript a module
// to a file. The page names them from the root, since it is served at any depth.
//
//   node flotsam/build.ts        (npm run flotsam:build; writes flotsam/dist)

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL("./", import.meta.url));
export const DIST = join(HERE, "dist");
const TSC = fileURLToPath(new URL("../node_modules/.bin/tsc", import.meta.url));

// Into `out`, as its root: out/404.html and out/flotsam/. Clears only what it writes, so a site can build into
// its own root.
export function build(out = DIST): void {
  const assets = join(out, "flotsam");
  rmSync(assets, { recursive: true, force: true });
  mkdirSync(assets, { recursive: true });
  execFileSync(TSC, ["-p", HERE, "--noEmit", "false", "--outDir", assets], { stdio: "inherit" });
  cpSync(join(HERE, "style.css"), join(assets, "style.css"));
  const page = readFileSync(join(HERE, "index.html"), "utf8").replace(/(<script\b[^>]*\bsrc="[^"]+)\.ts"/g, '$1.js"');
  writeFileSync(join(out, "404.html"), page);
}

if (import.meta.main) {
  rmSync(DIST, { recursive: true, force: true });
  build();
  console.log("built flotsam/dist");
}
