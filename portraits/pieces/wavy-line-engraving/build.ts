// The wavy-line engraving: a young man in a leather jacket in a city street, printed from its
// layers back to front, each drawn in a folder of its own (see sheet.ts): the sky, the buildings,
// the ground, the street's trees and what stands on the ground, him, and the leaves overhead.
//
//   node portraits/pieces/wavy-line-engraving/build.ts          the whole
//   node portraits/pieces/wavy-line-engraving/<layer>/build.ts  one layer alone

import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { svgOf } from "./sheet.ts";
import type { Affine } from "../../harness/trace/plate.ts";

// Back to front. The ground lies under the trees' layer, whose railing, planters and steps stand on it.
const LAYERS = ["sky", "building", "ground", "tree", "subject", "leaves"];
// Each plate's frame in the whole's, where it is not the whole's own: x' = a x + b y + c,
// y' = d x + e y + f. His plate shows him a tenth larger, fitted by ORB features and RANSAC
// (trace/plate.ts) against the whole; the sky, buildings, trees and ground fit it within a pixel.
// The leaves' plate is a branch engraved apart, at two and a half times the whole's sprig in its
// top left corner: fitted by eye, overlaid at 2x.
const FRAMES: Record<string, Affine> = {
  subject: [0.9116, 0.0001, 53.969, 0.0008, 0.9155, 133.8677],
  leaves: [0.4, 0, 0, 0, 0.4, 0],
};

const started = Date.now();
const body: string[] = [];
for (const name of LAYERS) {
  const file = new URL(`./${name}/build.ts`, import.meta.url);
  if (!existsSync(file)) continue;
  const { draw } = await import(file.href);
  const markup: string = await draw();
  const frame = FRAMES[name];
  const transform = frame ? ` transform="matrix(${frame[0]} ${frame[3]} ${frame[1]} ${frame[4]} ${frame[2]} ${frame[5]})"` : "";
  body.push(`<g id="layer-${name}"${transform}>${markup}</g>`);
}
const svg = svgOf("A young man in a leather jacket in a city street, as a wavy-line engraving", body.join("\n"));
writeFileSync(process.env.OUT ?? fileURLToPath(new URL("wavy-line-engraving.svg", import.meta.url)), svg);
console.log(`whole: ${(svg.length / 1024).toFixed(0)} KB in ${((Date.now() - started) / 1000).toFixed(1)}s`);
