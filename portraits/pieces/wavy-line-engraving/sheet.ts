// What the layers share besides the engraving's line (engrave.ts): the sheet they are printed on,
// its inks, and how a layer is written out alone. Each layer lives in a folder of its own with a
// build.ts that exports `draw()`, its markup in the full engraving's frame (wavy-eng-full.png),
// and writes itself out when run; build.ts here prints them all, back to front.

import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
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
