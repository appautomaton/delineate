// Builds the wavy-line engraving of him, stage by stage, as a painter works (see scene.ts):
//
//   STAGE=1  the lay-in: his silhouette and the tone in four flat steps
//   STAGE=2  the tone in lines, turning as the plate's do, and his outline
//   STAGE=3  the lines that hold his form: his hair and features, the jacket's hardware, seams,
//            woven patch, and big lines (the default)
//
//   npm run wavy-line-engraving
//   STAGE=1 OUT=<file.svg> node portraits/pieces/wavy-line-engraving/build.ts

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { contours } from "../../harness/trace/contour.ts";
import { fitRing, pathData } from "../../harness/trace/bezier.ts";
import { readPng } from "../../harness/trace/image.ts";
import { type Field, ink, sample, tone } from "./field.ts";
import { drawn, strokeData } from "./lines.ts";
import { CONTOURS, EDGES, HERE, INK, LINE_TINT, PAPER, PATCH, PLATE, STUDS, TABS, TINT, ZIPS } from "./scene.ts";
import { edgeMarkup, studMarkup, tabMarkup, weaveMarkup, zipMarkup } from "./hardware.ts";

const STAGE = Number(process.env.STAGE ?? 3);
const OUT = process.env.OUT ?? fileURLToPath(new URL("wavy-line-engraving.svg", HERE));
const K = 3; // samples per pixel of the ink field, so lines a pixel wide keep their shape

const started = Date.now();
const plate = readPng(fileURLToPath(PLATE));
const { width: W, height: H } = plate;
const { dark, alpha, art, mass, light, tint } = tone(plate);

// Where he is, with a margin.
let [x0, y0, x1, y1] = [W, H, 0, 0];
alpha.data.forEach((a, p) => {
  if (a < 0.5) return;
  const [x, y] = [p % W, Math.floor(p / W)];
  [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x + 1), Math.max(y1, y + 1)];
});
const box = [Math.max(0, x0 - 4), Math.max(0, y0 - 4), Math.min(W, x1 + 4), Math.min(H, y1 + 4)];

// A field's positive region as one path, traced at `k` samples per pixel, in the field's own units.
function shapes(field: Field, k: number, tolerance: number, minArea: number): string {
  const rings = contours(field.data, field.width, field.height, minArea * k * k);
  return pathData(rings.map((r) => fitRing(r, { tolerance: tolerance * k, step: k / 2 })));
}
const placed = (d: string, k: number, fill: string, extra = "") =>
  `<path fill="${fill}"${extra} transform="translate(${box[0]} ${box[1]}) scale(${1 / k})" d="${d}"/>`;

// Over the box at k samples per pixel: f(x, y) in frame pixels.
function over(k: number, f: (x: number, y: number) => number): Field {
  const width = (box[2] - box[0]) * k;
  const height = (box[3] - box[1]) * k;
  const data = new Float32Array(width * height);
  for (let gy = 0; gy < height; gy++) for (let gx = 0; gx < width; gx++) data[gy * width + gx] = f(box[0] + (gx + 0.5) / k, box[1] + (gy + 0.5) / k);
  return { width, height, data };
}

const body: string[] = [];
if (STAGE === 1) {
  // Four steps of tone, each a flat ink at its share, stacked light to dark inside him.
  const inside = (x: number, y: number) => sample(alpha, x, y) - 0.5;
  body.push(placed(shapes(over(1, inside), 1, 0.5, 4), 1, "#fffaf0"));
  for (const [step, fill] of [[0.2, "#c9c6c4"], [0.4, "#8e93a3"], [0.6, "#4f5a7a"], [0.8, INK]] as const)
    body.push(placed(shapes(over(1, (x, y) => Math.min(inside(x, y), sample(dark, x, y) - step)), 1, 0.5, 4), 1, fill));
} else {
  // Where he is dark the lines are the ink itself; where he is light, a tint of it (see width_).
  const field = ink(dark, light, tint, alpha, box, K);
  const part = (sign: number) => ({ ...field, data: field.data.map((v, i) => Math.min(v, sign * (sample(tint, box[0] + ((i % field.width) + 0.5) / K, box[1] + (Math.floor(i / field.width) + 0.5) / K) - 0.5) * 4)) });
  body.push(placed(shapes(part(-1), K, 0.2, 0.3), K, INK));
  body.push(placed(shapes(part(1), K, 0.2, 0.3), K, INK, ` fill-opacity="${TINT}"`));
}
if (STAGE >= 3) {
  // Where he is light, and in his hair, the plate's ink is line art: features, strands, folds,
  // drawn as the plate draws them, its outlines smoothed and its crumbs left out.
  // The plate draws its strands and folds in a pale tint of its ink, and only the masses (the
  // blue lock, pupils, deep shadow under a lock) in the ink itself: so do we.
  const lines = over(K, (x, y) => Math.min(sample(art, x, y), (sample(alpha, x, y) - 0.5) * 0.4));
  body.push(placed(shapes(lines, K, 0.25, 3), K, INK, ` fill-opacity="${LINE_TINT}"`));
  const masses = over(K, (x, y) => Math.min(sample(mass, x, y), (sample(alpha, x, y) - 0.5) * 0.4));
  body.push(placed(shapes(masses, K, 0.25, 3), K, INK));

  // Where he is dark, his structure is drawn as models (see hardware.ts), each placed by eye off
  // the plate: the woven patch, the leather's edges and stitching, the zips, tabs and studs.
  body.push(weaveMarkup(PATCH, INK, PAPER));
  body.push(edgeMarkup(EDGES, INK, PAPER));
  body.push(zipMarkup(ZIPS, INK, PAPER));
  body.push(tabMarkup(TABS, INK, PAPER));
  body.push(studMarkup(STUDS, INK, PAPER));

  // The jacket's big lines, drawn by hand (see scene.ts), each cut free of the waves by paper.
  const big = Object.values(CONTOURS);
  body.push(`<path fill="${PAPER}" d="${strokeData(big.map((pts) => drawn(pts, 4.2)))}"/>`);
  body.push(`<path fill="${INK}" d="${strokeData(big.map((pts) => drawn(pts, 1.8)))}"/>`);
}
if (STAGE >= 2) {
  // His outline: a fine ink line round the silhouette, over the ends of the waves, with a rim of
  // paper inside it, as the plate lights every edge of the jacket.
  const outline = shapes(over(1, (x, y) => sample(alpha, x, y) - 0.5), 1, 0.5, 20);
  body.push(placed(outline, 1, "none", ` stroke="${PAPER}" stroke-width="4.4"`));
  body.push(placed(outline, 1, "none", ` stroke="${INK}" stroke-width="1.3"`));
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>A young man in a leather jacket, smiling, as a wavy-line engraving</title>
<rect width="${W}" height="${H}" fill="${PAPER}"/>
${body.join("\n")}
</svg>
`;
writeFileSync(OUT, svg);
console.log(`stage ${STAGE}: ${(svg.length / 1024).toFixed(0)} KB in ${((Date.now() - started) / 1000).toFixed(1)}s`);
