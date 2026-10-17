// Builds Glass into a folder laid out as a site's root: its own page as index.html, and under glass/ the
// stage's modules, compiled from TypeScript a module to a file, with its stylesheets and, under glass/pictures/,
// the Garden drawings its pages show (drawn by npm run draw; without them, the pages keep to words).
//
//   node glass/build.ts [<out>]        (npm run glass:build; writes glass/dist)

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PICTURES } from "./pages.ts";

const HERE = fileURLToPath(new URL("./", import.meta.url));
export const DIST = join(HERE, "dist");
const TSC = fileURLToPath(new URL("../node_modules/.bin/tsc", import.meta.url));
const GARDEN = fileURLToPath(new URL("../garden/public/garden/", import.meta.url));

/** Into `out`: out/glass/, and out/index.html, the stage's own page. */
export function build(out = DIST): void {
  const assets = join(out, "glass");
  rmSync(assets, { recursive: true, force: true });
  mkdirSync(assets, { recursive: true });
  execFileSync(TSC, ["-p", HERE, "--noEmit", "false", "--outDir", assets], { stdio: "inherit" });
  for (const file of ["stage.css", "style.css"]) cpSync(join(HERE, file), join(assets, file));
  const missing = PICTURES.filter((name) => !existsSync(join(GARDEN, `${name}.svg`)));
  if (missing.length) console.warn(`glass: no Garden drawing of ${missing.join(", ")} (run npm run draw); the pages pass over them`);
  mkdirSync(join(assets, "pictures"));
  for (const name of PICTURES) if (!missing.includes(name)) cpSync(join(GARDEN, `${name}.svg`), join(assets, "pictures", `${name}.svg`));
  const html = readFileSync(join(HERE, "index.html"), "utf8").replace(/(<script\b[^>]*\bsrc="[^"]+)\.ts"/g, '$1.js"');
  writeFileSync(join(out, "index.html"), html);
}

if (import.meta.main) {
  const out = process.argv[2];
  if (!out) rmSync(DIST, { recursive: true, force: true });
  build(out);
  if (!out) console.log("built glass/dist");
}
