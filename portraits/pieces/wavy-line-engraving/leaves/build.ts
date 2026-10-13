// The leaves overhead: a branch hanging into the top left, in front of everything, him included.
//
// The grammar, read off its plate (wav-leaves.png) at 1.6x to 4.5x:
// - Marks: compound leaves of five pointed leaflets, finely toothed toward the tip, with thin
//   curved twigs and stalks between them and clear open gaps of sky and building showing through.
// - Tone: the leaflets are solid ink, no waves; their light is their veins and sunlit leaflet rims,
//   a pale midrib and a herringbone of short side veins slanting to the tip, cut in paper over the
//   ink.
// - Form: the mass is densest at the top left, thins to the right, and hangs in sprays at its foot,
//   the longest reaching y 470 (in the plate's frame, scaled by 0.4 in the whole). No outlines: a
//   leaf is its silhouette.

import { fileURLToPath } from "node:url";
import { rgbToLab } from "../../../harness/trace/color.ts";
import { readPng } from "../../../harness/trace/image.ts";
import { type Box, blur, luminance, over, placed, rgb, sample, shapes } from "../engrave.ts";
import { PAPER, REFERENCES, STREET_INK, run } from "../sheet.ts";
import { lineField } from "../subject/field.ts";

const PLATE = new URL("wav-leaves.png", REFERENCES);
const BOX: Box = [0, 0, 880, 480];
const VEINS = 0.78; // the opacity of the paper veins: the plate's are a pale green, not white

export async function draw(): Promise<string> {
  const plate = readPng(fileURLToPath(PLATE));
  const { width: w, height: h, data } = plate;
  const [p, i] = [luminance(...rgb(PAPER)), luminance(...rgb(STREET_INK))];
  const alpha = Float32Array.from({ length: w * h }, (_, q) => data[q * 4 + 3] / 255);
  const share = Float32Array.from({ length: w * h }, (_, q) => (p - luminance(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])) / (p - i));
  const ones = new Float32Array(w * h).fill(1);
  // The branch's silhouette: every five-lobed leaf, stalk, and twig on the plate, with the open
  // spaces between leaflets preserved cleanly.
  const silhouette = { width: w, height: h, data: blur(Float32Array.from(share, (s, q) => alpha[q] * Math.max(0.4, s)), ones, w, h, 0.7) };
  // Light veins and leaflet separations inside the leaves, found by top-hat contrast in OKLab lightness.
  const L = Float32Array.from({ length: w * h }, (_, q) => (alpha[q] > 0.6 ? rgbToLab(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])[0] : 0.2));
  const { line: lightLine } = lineField(L, w, h, 3, 0.048, false);
  const veinField = { width: w, height: h, data: lightLine };

  const blades = over(BOX, 2, (x, y) => sample(silhouette, x, y) - 0.34);
  const veins = over(BOX, 2, (x, y) => (sample(silhouette, x, y) > 0.52 ? sample(veinField, x, y) : -1));

  return [
    `<g id="leaves">`,
    placed(BOX, shapes(blades, 2, 0.35, 3), 2, STREET_INK),
    placed(BOX, shapes(veins, 2, 0.35, 2.5), 2, PAPER, ` fill-opacity="${VEINS}"`),
    `</g>`,
  ].join("\n");
}

export const title = "A branch of leaves overhead, as a wavy-line engraving";
await run(import.meta.url, { title, draw }, "leaves");
