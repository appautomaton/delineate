// Measures the WCAG contrast of footer text against the rendered background.
//
//   node footers/harness/contrast.ts <background.bmp> <boxes.json> <scale>
//
// boxes.json: [{ "name", "x", "y", "w", "h", "color": [r, g, b, a] }] in CSS pixels; scale is device pixels per
// CSS pixel.

import { readFileSync } from "node:fs";
import { fixed } from "../lib/number.ts";

type RGB = readonly [number, number, number];
type Box = { name: string; x: number; y: number; w: number; h: number; color: [number, number, number, number] };

// An uncompressed BMP, top-down or bottom-up: its size and a reader for each pixel.
function loadBmp(path: string) {
  const data = readFileSync(path);
  const offset = data.readUInt32LE(10);
  const width = data.readInt32LE(18);
  const signed = data.readInt32LE(22);
  const bpp = Math.floor(data.readUInt16LE(28) / 8);
  const row = Math.floor((width * bpp + 3) / 4) * 4;
  const height = Math.abs(signed);
  const pixel = (x: number, y: number): RGB => {
    const i = offset + (signed < 0 ? y : height - 1 - y) * row + x * bpp;
    return [data[i + 2], data[i + 1], data[i]];
  };
  return { width, height, pixel };
}

function luminance(rgb: readonly number[]): number {
  const [r, g, b] = rgb.map((c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const [bmp, boxesPath, scaleArg] = process.argv.slice(2);
const { width, height, pixel } = loadBmp(bmp);
const boxes: Box[] = JSON.parse(readFileSync(boxesPath, "utf8"));
const scale = Number(scaleArg);
for (const box of boxes) {
  const [x0, y0] = [Math.trunc(box.x * scale), Math.trunc(box.y * scale)];
  const [x1, y1] = [Math.trunc((box.x + box.w) * scale), Math.trunc((box.y + box.h) * scale)];
  // Every other pixel in each direction is plenty.
  const samples: RGB[] = [];
  for (let y = Math.max(y0, 0); y < Math.min(y1, height); y += 2) for (let x = Math.max(x0, 0); x < Math.min(x1, width); x += 2) samples.push(pixel(x, y));
  if (!samples.length) continue;
  const lums = samples.map(luminance).sort((a, b) => a - b);
  const mean = [0, 1, 2].map((i) => samples.reduce((s, p) => s + p[i], 0) / samples.length);
  const [r, g, b, a] = box.color;
  const textL = luminance([r, g, b].map((c, i) => c * a + mean[i] * (1 - a)));
  const meanL = luminance(mean);
  // Worst case: the 10% of background pixels closest in luminance to the text.
  const worstL = textL < meanL ? lums[Math.trunc(lums.length * 0.1)] : lums[Math.trunc(lums.length * 0.9)];
  console.log(`${box.name.padEnd(14)} mean ${fixed(ratio(textL, meanL), 2).padStart(5)}   worst-10% ${fixed(ratio(textL, worstL), 2).padStart(5)}`);
}
