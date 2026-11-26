// Builds Zoom into a standalone folder laid out as a site root:
//   out/index.html + out/zoom/*.js + out/zoom/scenes/*.js + out/zoom/style.css
//
//   node zoom/build.ts [<out>]        (default: zoom/dist)

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL("./", import.meta.url));
export const DIST = join(HERE, "dist");
const TSC = fileURLToPath(new URL("../node_modules/.bin/tsc", import.meta.url));

export function build(out = DIST): void {
  const assets = join(out, "zoom");
  rmSync(assets, { recursive: true, force: true });
  mkdirSync(assets, { recursive: true });
  execFileSync(TSC, ["-p", HERE, "--noEmit", "false", "--outDir", assets], { stdio: "inherit" });
  cpSync(join(HERE, "style.css"), join(assets, "style.css"));
  cpSync(join(HERE, "card.css"), join(assets, "card.css"));
  const html = readFileSync(join(HERE, "index.html"), "utf8").replace(/(<script\b[^>]*\bsrc="[^"]+)\.ts"/g, '$1.js"');
  writeFileSync(join(out, "index.html"), html);
}

if (import.meta.main) {
  const out = process.argv[2];
  if (!out) rmSync(DIST, { recursive: true, force: true });
  build(out);
  if (!out) console.log("built zoom/dist");
}
