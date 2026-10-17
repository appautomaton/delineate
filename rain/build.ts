// Builds Rain into a folder laid out as a site's root: its own page as index.html, and under
// rain/ the stage's modules, compiled from TypeScript a module to a file, with its stylesheets.
// The stage draws itself in the browser, so a host page needs only rain/show.js and
// rain/stage.css.
//
//   node rain/build.ts [<out>]        (npm run rain:build; writes rain/dist)

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL("./", import.meta.url));
export const DIST = join(HERE, "dist");
const TSC = fileURLToPath(new URL("../node_modules/.bin/tsc", import.meta.url));

/** Into `out`: out/rain/ always; out/index.html, the stage's own page, unless `page` is false. */
export function build(out = DIST, { page = true } = {}): void {
  const assets = join(out, "rain");
  rmSync(assets, { recursive: true, force: true });
  mkdirSync(assets, { recursive: true });
  execFileSync(TSC, ["-p", HERE, "--noEmit", "false", "--outDir", assets], { stdio: "inherit" });
  cpSync(join(HERE, "stage.css"), join(assets, "stage.css"));
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
  if (!out) console.log("built rain/dist");
}
