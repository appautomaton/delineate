// The wavy-line engraving: a young man in a leather jacket in a city street, printed from its
// layers back to front, each drawn in a folder of its own (see sheet.ts): the sky, the buildings,
// the ground, the street's trees and what stands on the ground, him, and the leaves overhead.
//
//   node portraits/pieces/wavy-line-engraving/build.ts          the whole
//   node portraits/pieces/wavy-line-engraving/<layer>/build.ts  one layer alone

import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { type Layer, alongY, drawingMarkup, facing, layerMarkup } from "../../harness/stage/drawing.ts";
import { writePage } from "../../harness/stage/page.ts";
import { PAGE } from "./page.ts";
import { FRAMES, LAYERS, SIZE } from "./sheet.ts";

const HERE = new URL("./", import.meta.url);
const PLANES: Record<string, Omit<Layer, "name">> = {
  sky: { title: "The sky", note: "level waves and clouds on warm paper", plane: facing(1500) },
  building: { title: "The towers", note: "far blocks and near facades running to the vanishing point", plane: facing(180) },
  ground: { title: "The plaza", note: "sunlit stone slabs receding toward the horizon", plane: alongY(923, 28, 1254, 2.6) },
  tree: { title: "Trees & railings", note: "canopy, street lamps, planters, and the steps", plane: facing(8) },
  subject: { title: "The young man", note: "engraved from his own plate in navy waves", plane: facing(2) },
  leaves: { title: "Overhead leaves", note: "a five-lobed sprig in the top-left foreground", plane: facing(1.3) },
};

const started = Date.now();
const layers: string[] = [];
for (const [name] of LAYERS) {
  const file = new URL(`./${name}/build.ts`, import.meta.url);
  if (!existsSync(file)) continue;
  const { draw } = await import(file.href);
  const markup: string = await draw();
  const frame = FRAMES[name];
  const body = frame ? `<g transform="matrix(${frame[0]} ${frame[3]} ${frame[1]} ${frame[4]} ${frame[2]} ${frame[5]})">\n${markup}\n</g>` : markup;
  layers.push(layerMarkup({ name, ...PLANES[name] }, [body]));
}
const svg = drawingMarkup({
  width: SIZE,
  height: SIZE,
  title: "A young man in a leather jacket in a city street, as a wavy-line engraving",
  focus: 2,
  motion: "",
  defs: [],
  layers,
});
writeFileSync(process.env.OUT ?? fileURLToPath(new URL("wavy-line-engraving.svg", HERE)), svg);
if (!process.env.OUT) writePage(HERE, PAGE, svg);
console.log(`whole: ${(svg.length / 1024).toFixed(0)} KB in ${((Date.now() - started) / 1000).toFixed(1)}s`);

