// The wavy-line engraving: a young man in a leather jacket in a city street, printed from its
// layers back to front, each drawn in a folder of its own (see sheet.ts): the sky, the buildings,
// the street's trees, the ground, him, and the leaves overhead.
//
//   node portraits/pieces/wavy-line-engraving/build.ts          the whole
//   node portraits/pieces/wavy-line-engraving/<layer>/build.ts  one layer alone

import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { svgOf } from "./sheet.ts";
import { MAP } from "./subject/scene.ts";

const LAYERS = ["sky", "building", "tree", "ground", "subject", "leaves"];

const started = Date.now();
const body: string[] = [];
for (const name of LAYERS) {
  const file = new URL(`./${name}/build.ts`, import.meta.url);
  if (!existsSync(file)) continue;
  const { draw } = await import(file.href);
  const markup: string = await draw();
  // He is drawn in his plate's frame; MAP brings it into the whole's (x' = a x + b y + c, ...).
  const [a, b, c, d, e, f] = MAP;
  body.push(name === "subject" ? `<g id="${name}" transform="matrix(${a} ${d} ${b} ${e} ${c} ${f})">${markup}</g>` : `<g id="${name}">${markup}</g>`);
}
const svg = svgOf("A young man in a leather jacket in a city street, as a wavy-line engraving", body.join("\n"));
writeFileSync(process.env.OUT ?? fileURLToPath(new URL("wavy-line-engraving.svg", import.meta.url)), svg);
console.log(`whole: ${(svg.length / 1024).toFixed(0)} KB in ${((Date.now() - started) / 1000).toFixed(1)}s`);
