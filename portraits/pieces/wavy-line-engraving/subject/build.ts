// The young man, engraved from his own plate, stage by stage, as a painter works (see scene.ts):
//
//   STAGE=1  the lay-in: his silhouette and the tone in four flat steps
//   STAGE=2  the tone in lines, and his outline
//   STAGE=3  the lines that hold his form: his hair and features, the jacket's hardware, edges,
//            woven patch, and big lines (the default)
//
// Drawn in his plate's frame, which shows him a tenth larger than the whole does; the whole
// (../build.ts) brings him into its own by MAP.
//
//   STAGE=1 OUT=<file.svg> node portraits/pieces/wavy-line-engraving/subject/build.ts

import { fileURLToPath } from "node:url";
import { readPng } from "../../../harness/trace/image.ts";
import { type Box, extent, ink, over, placed, sample, shapes } from "../engrave.ts";
import { run } from "../sheet.ts";
import { level, tone, width_ } from "./field.ts";
import { edgeMarkup, studMarkup, tabMarkup, weaveMarkup, zipMarkup } from "./hardware.ts";
import { drawn, strokeData } from "./lines.ts";
import { CONTOURS, EDGES, INK, LINE_TINT, PAPER, PATCH, PLATE, SPACING, STUDS, TABS, TINT, ZIPS } from "./scene.ts";

const K = 3; // samples per pixel of the ink field, so lines a pixel wide keep their shape

export async function draw(stage = Number(process.env.STAGE ?? 3)): Promise<string> {
  const plate = readPng(fileURLToPath(PLATE));
  const { dark, alpha, art, mass, light, tint } = tone(plate);
  const box: Box = extent(alpha);
  // His silhouette, in paper first: in the whole he stands in front of the street, which must not
  // show through where he is light.
  const outline = shapes(over(box, 1, (x, y) => sample(alpha, x, y) - 0.5), 1, 0.5, 20);
  const body: string[] = [placed(box, outline, 1, PAPER)];
  if (stage === 1) {
    // Four steps of tone, each a flat ink at its share, stacked light to dark inside him.
    const inside = (x: number, y: number) => sample(alpha, x, y) - 0.5;
    body.push(placed(box, shapes(over(box, 1, inside), 1, 0.5, 4), 1, "#fffaf0"));
    for (const [step, fill] of [[0.2, "#c9c6c4"], [0.4, "#8e93a3"], [0.6, "#4f5a7a"], [0.8, INK]] as const)
      body.push(placed(box, shapes(over(box, 1, (x, y) => Math.min(inside(x, y), sample(dark, x, y) - step)), 1, 0.5, 4), 1, fill));
  } else {
    // Where he is dark the lines are the ink itself; where he is light, a tint of it (see width_).
    const width = (x: number, y: number) => width_(sample(dark, x, y), sample(light, x, y), sample(tint, x, y) > 0.5);
    const field = ink(width, { level, spacing: SPACING }, alpha, box, K);
    const tinted = (i: number) => sample(tint, box[0] + ((i % field.width) + 0.5) / K, box[1] + (Math.floor(i / field.width) + 0.5) / K) - 0.5;
    const part = (sign: number) => ({ ...field, data: field.data.map((v, i) => Math.min(v, sign * tinted(i) * 4)) });
    body.push(placed(box, shapes(part(-1), K, 0.2, 0.3), K, INK));
    body.push(placed(box, shapes(part(1), K, 0.2, 0.3), K, INK, ` fill-opacity="${TINT}"`));
  }
  if (stage >= 3) {
    // Where he is light, and in his hair, the plate's ink is line art: features, strands, folds,
    // drawn as the plate draws them, its outlines smoothed and its crumbs left out. The plate draws
    // its strands and folds in a pale tint of its ink, and only the masses (the blue lock, pupils,
    // deep shadow under a lock) in the ink itself: so do we.
    const lines = over(box, K, (x, y) => Math.min(sample(art, x, y), (sample(alpha, x, y) - 0.5) * 0.4));
    body.push(placed(box, shapes(lines, K, 0.25, 3), K, INK, ` fill-opacity="${LINE_TINT}"`));
    const masses = over(box, K, (x, y) => Math.min(sample(mass, x, y), (sample(alpha, x, y) - 0.5) * 0.4));
    body.push(placed(box, shapes(masses, K, 0.25, 3), K, INK));

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
  if (stage >= 2) {
    // His outline: a fine ink line round the silhouette, over the ends of the waves, with a rim of
    // paper inside it, as the plate lights every edge of the jacket.
    body.push(placed(box, outline, 1, "none", ` stroke="${PAPER}" stroke-width="4.4"`));
    body.push(placed(box, outline, 1, "none", ` stroke="${INK}" stroke-width="1.3"`));
  }
  return body.join("\n");
}

export const title = "A young man in a leather jacket, smiling, as a wavy-line engraving";
await run(import.meta.url, { title, draw }, "subject");
