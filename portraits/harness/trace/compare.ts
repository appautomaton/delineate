// Holds a drawing up against its reference: renders it in Chrome, pixel for pixel at the
// reference's size, and measures how far the two are apart.
//
//   node portraits/harness/trace/compare.ts <drawing.svg|.html> <reference.png> [out-dir]
//
// Reports the mean error per channel (0-255), the share of pixels off by more than a just
// noticeable step, and PSNR. With out-dir, also writes the render, a side-by-side, and a heat map
// of the error.

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { launch } from "../browser.ts";
import { type Raster, decodePng, readPng, writePng } from "./image.ts";

export async function render(file: string, width: number, height: number): Promise<Raster> {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(resolve(file)).href);
    return decodePng(await page.screenshot({ clip: { x: 0, y: 0, width, height }, animations: "disabled" }));
  } finally {
    await browser.close();
  }
}

export type Score = { mean: number; off: number; psnr: number };

// `off` counts pixels whose largest channel error exceeds `step`.
export function score(a: Raster, b: Raster, step = 12, mask?: Uint8Array): Score {
  let sum = 0;
  let sq = 0;
  let off = 0;
  let count = 0;
  for (let p = 0; p < a.width * a.height; p++) {
    if (mask && !mask[p]) continue;
    let worst = 0;
    for (let c = 0; c < 3; c++) {
      const e = Math.abs(a.data[p * 4 + c] - b.data[p * 4 + c]);
      sum += e;
      sq += e * e;
      worst = Math.max(worst, e);
    }
    if (worst > step) off++;
    count++;
  }
  const mse = sq / (count * 3);
  return { mean: sum / (count * 3), off: off / count, psnr: 10 * Math.log10((255 * 255) / Math.max(mse, 1e-9)) };
}

export function heat(a: Raster, b: Raster): Raster {
  const data = new Uint8Array(a.data.length);
  for (let p = 0; p < a.width * a.height; p++) {
    const e = Math.min(255, 3 * Math.max(...[0, 1, 2].map((c) => Math.abs(a.data[p * 4 + c] - b.data[p * 4 + c]))));
    data.set([e, e, e, 255], p * 4);
  }
  return { width: a.width, height: a.height, data };
}

export function sideBySide(a: Raster, b: Raster): Raster {
  const width = a.width + b.width;
  const data = new Uint8Array(width * a.height * 4);
  for (let y = 0; y < a.height; y++) {
    data.set(a.data.subarray(y * a.width * 4, (y + 1) * a.width * 4), y * width * 4);
    data.set(b.data.subarray(y * b.width * 4, (y + 1) * b.width * 4), (y * width + a.width) * 4);
  }
  return { width, height: a.height, data };
}

if (import.meta.main) {
  const [drawing, reference, out] = process.argv.slice(2);
  const ref = readPng(reference);
  const shot = await render(drawing, ref.width, ref.height);
  const { mean, off, psnr } = score(shot, ref);
  console.log(`mean error ${mean.toFixed(2)}/255   off by > 12: ${(off * 100).toFixed(1)}%   PSNR ${psnr.toFixed(1)} dB`);
  if (out) {
    mkdirSync(out, { recursive: true });
    writePng(`${out}/render.png`, shot);
    writePng(`${out}/side-by-side.png`, sideBySide(ref, shot));
    writePng(`${out}/heat.png`, heat(shot, ref));
  }
}
