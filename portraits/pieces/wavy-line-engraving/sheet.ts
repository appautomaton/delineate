// What the layers share besides the engraving's line (engrave.ts): the sheet they are printed on,
// its inks, and how a layer is written out alone. Each layer lives in a folder of its own with a
// build.ts that exports `draw()`, its markup in the full engraving's frame (wavy-eng-full.png),
// and writes itself out when run; build.ts here prints them all, back to front.

import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { type Raster, readPng } from "../../harness/trace/image.ts";
import type { Affine } from "../../harness/trace/plate.ts";

export const REFERENCES = new URL("../../references/wavy-line-engraving/", import.meta.url);
export const SIZE = 1254; // the full engraving's frame, and every plate's
export const PAPER = "#f3e8cc";
// The street's ink, measured on the darkest tenth of its plates: a green-black.
export const STREET_INK = "#0b261a";
// The line family's spacing in the full frame: 6.8 px on his plate, which shows him a tenth
// larger; about 6 in the street's plates.
export const SPACING = 6.2;

export type Layer = { title: string; draw: () => Promise<string> };

// Each plate's frame in the whole's, where it is not the whole's own: x' = a x + b y + c,
// y' = d x + e y + f. His plate shows him a tenth larger, fitted by ORB features and RANSAC
// (trace/plate.ts) against the whole; the sky, buildings, trees and ground fit it within a pixel.
// The leaves' plate is a branch engraved apart, at two and a half times the whole's sprig in its
// top left corner: fitted by eye, overlaid at 2x.
export const FRAMES: Record<string, Affine> = {
  subject: [0.9116, 0.0001, 53.969, 0.0008, 0.9155, 133.8677],
  leaves: [0.4, 0, 0, 0, 0.4, 0],
};

// The layers back to front, each with its plate. The ground lies under the trees' layer, whose
// railing, planters and steps stand on it.
export const LAYERS: [string, string][] = [
  ["sky", "wav-sky.png"],
  ["building", "wav-building.png"],
  ["ground", "wav-ground.png"],
  ["tree", "wav-tree.png"],
  ["subject", "wav-subject.png"],
  ["leaves", "wav-leaves.png"],
];

// A plate's opacity brought into the whole's frame, by its frame's inverse, nearest pixel.
function opacity(name: string, file: string): Float32Array {
  const plate = readPng(fileURLToPath(new URL(file, REFERENCES)));
  const out = new Float32Array(SIZE * SIZE);
  const [a, b, c, d, e, f] = FRAMES[name] ?? [1, 0, 0, 0, 1, 0];
  const det = a * e - b * d;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const u = Math.round((e * (x + 0.5 - c) - b * (y + 0.5 - f)) / det - 0.5);
      const v = Math.round((a * (y + 0.5 - f) - d * (x + 0.5 - c)) / det - 0.5);
      if (u >= 0 && v >= 0 && u < plate.width && v < plate.height) out[y * SIZE + x] = plate.data[(v * plate.width + u) * 4 + 3] / 255;
    }
  return out;
}

// What a layer in the whole's frame is drawn from: its plate, but where it shows in the whole (no
// layer in front of it covers it) with the whole's own pixels. The plates were engraved apart from
// the whole and differ from it in tone (the sky's clouds lie elsewhere, the trees are darker); the
// picture is the whole, so where a layer is seen, the whole decides its tone, and where it is
// hidden, its plate fills in.
export function source(name: string): Raster {
  const at = LAYERS.findIndex(([n]) => n === name);
  const plate = readPng(fileURLToPath(new URL(LAYERS[at][1], REFERENCES)));
  const whole = readPng(fileURLToPath(new URL("wavy-eng-full.png", REFERENCES)));
  const front = new Float32Array(SIZE * SIZE);
  for (const [n, file] of LAYERS.slice(at + 1)) opacity(n, file).forEach((v, p) => (front[p] = Math.max(front[p], v)));
  const data = Uint8ClampedArray.from(plate.data);
  for (let p = 0; p < SIZE * SIZE; p++)
    if (front[p] < 0.5) for (let k = 0; k < 3; k++) data[p * 4 + k] = whole.data[p * 4 + k];
  return { width: SIZE, height: SIZE, data };
}

export const svgOf = (title: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
<title>${title}</title>
<rect width="${SIZE}" height="${SIZE}" fill="${PAPER}"/>
${body}
</svg>
`;

// Run as a script (not imported by the whole): writes the layer alone to OUT, or beside itself.
export async function run(url: string, { title, draw }: Layer, name: string): Promise<void> {
  if (!process.argv[1] || pathToFileURL(process.argv[1]).href !== url) return;
  const started = Date.now();
  const svg = svgOf(title, await draw());
  const out = process.env.OUT ?? fileURLToPath(new URL(`${name}.svg`, url));
  writeFileSync(out, svg);
  console.log(`${name}: ${(svg.length / 1024).toFixed(0)} KB in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}
