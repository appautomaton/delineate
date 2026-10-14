// Builds the Garden into garden/dist, to serve from a domain's root as it stands: its two pages, their scripts
// compiled from TypeScript a module to a file, their stylesheets, and the plants as drawn.
//
//   node garden/build.ts        (npm run build, after npm run check; dev and look build first too)

import { execFileSync } from "node:child_process";
import { cpSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const GARDEN = fileURLToPath(new URL("./", import.meta.url));
export const DIST = `${GARDEN}dist/`;
const TSC = fileURLToPath(new URL("../node_modules/.bin/tsc", import.meta.url));

// A page with its scripts pointing at the compiled modules.
const page = (html: string) => html.replace(/(<script\b[^>]*\bsrc="[^"]+)\.ts"/g, '$1.js"');

// One empty bed per plant in plants.json, in paint order and marked with its garden, where the page says <!-- garden -->.
function beds(html: string): string {
  const plants: { name: string; garden: string }[] = JSON.parse(readFileSync(`${GARDEN}src/garden/plants.json`, "utf8"));
  const markup = plants.map(({ name, garden }) => `<div class="plant g-${name}" data-plant="${name}" data-garden="${garden}"></div>`).join("\n      ");
  return html.replace("<!-- garden -->", () => markup);
}

export function build(): void {
  rmSync(DIST, { recursive: true, force: true });
  // Each module compiled where it stands, its imports turned from .ts to .js; plants.json comes along.
  execFileSync(TSC, ["-p", GARDEN, "--noEmit", "false", "--outDir", DIST], { stdio: "inherit" });
  // Beside them, the stylesheets and the gallery's close studies; at /garden/, the plants.
  const assets = (path: string) => statSync(path).isDirectory() || /\.(css|svg)$/.test(path);
  cpSync(`${GARDEN}src`, `${DIST}src`, { recursive: true, filter: assets });
  cpSync(`${GARDEN}gallery`, `${DIST}gallery`, { recursive: true, filter: assets });
  cpSync(`${GARDEN}public`, DIST, { recursive: true, filter: (path) => !path.endsWith(".DS_Store") });
  writeFileSync(`${DIST}index.html`, page(beds(readFileSync(`${GARDEN}index.html`, "utf8"))));
  writeFileSync(`${DIST}gallery/index.html`, page(readFileSync(`${GARDEN}gallery/index.html`, "utf8")));
}

if (import.meta.main) {
  build();
  console.log("built garden/dist");
}
