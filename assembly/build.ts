// Builds Assembly into a folder, to serve as it stands at a domain's root or under any path: the page, the studies
// beside it, their scripts compiled from TypeScript a module to a file, their stylesheets, and the crayon drawings
// from drawings.ts filled into the pages' {{NAME}} holes.
//
//   node assembly/build.ts        (npm run assembly:build; writes assembly/dist)

import { execFileSync } from "node:child_process";
import { cpSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { EMBLEMS, bouquet, underline } from "./drawings.ts";

const HERE = fileURLToPath(new URL("./", import.meta.url));
export const DIST = join(HERE, "dist");
const TSC = fileURLToPath(new URL("../node_modules/.bin/tsc", import.meta.url));

// The drawings, made once: they are seeded, so every build draws them the same. The page also says how many
// strands of wax the still life takes, counted from the drawing itself.
let drawings: Record<string, string> | undefined;
function drawn(): Record<string, string> {
  if (drawings) return drawings;
  const still = bouquet();
  return (drawings = {
    BOUQUET: still,
    STRANDS: (still.match(/<path /g) ?? []).length.toLocaleString("en"),
    UNDERLINE: underline(),
    ...Object.fromEntries(Object.entries(EMBLEMS).map(([k, draw]) => [`EMBLEM_${k.toUpperCase()}`, draw()])),
  });
}

// A page with its scripts pointing at the compiled modules and its holes filled.
function page(path: string) {
  const html = readFileSync(path, "utf8")
    .replace(/(<script\b[^>]*\bsrc="[^"]+)\.ts"/g, '$1.js"')
    .replace(/\{\{([A-Z_]+)\}\}/g, (hole, name: string) => drawn()[name] ?? hole);
  writeFileSync(path, html);
}

export function build(out = DIST): void {
  rmSync(out, { recursive: true, force: true });
  execFileSync(TSC, ["-p", HERE, "--noEmit", "false", "--outDir", out], { stdio: "inherit" });
  const assets = (path: string) => statSync(path).isDirectory() || /\.(html|css|svg)$/.test(path);
  for (const dir of ["hand", "studies"]) cpSync(join(HERE, dir), join(out, dir), { recursive: true, filter: assets });
  // The page, and the sheet another page shows (show.ts).
  for (const file of ["index.html", "style.css", "show.html", "show.css"]) cpSync(join(HERE, file), join(out, file));
  page(join(out, "index.html"));
  page(join(out, "show.html"));
  for (const s of readdirSync(join(HERE, "studies"))) page(join(out, "studies", s, "index.html"));
}

if (import.meta.main) {
  build();
  console.log("built assembly/dist");
}
