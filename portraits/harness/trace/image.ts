// Raster in and out for the tracing tools: PNG files as flat RGBA bytes, with crops and zooms for
// looking closely at a reference.
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";

export type Raster = { width: number; height: number; data: Uint8Array };

export function readPng(path: string): Raster {
  const png = PNG.sync.read(readFileSync(path));
  return { width: png.width, height: png.height, data: new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.length) };
}

export function decodePng(bytes: Uint8Array): Raster {
  const png = PNG.sync.read(Buffer.from(bytes));
  return { width: png.width, height: png.height, data: new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.length) };
}

export function writePng(path: string, { width, height, data }: Raster) {
  const png = new PNG({ width, height });
  png.data = Buffer.from(data.buffer, data.byteOffset, data.length);
  writeFileSync(path, PNG.sync.write(png));
}

export function crop(img: Raster, x: number, y: number, width: number, height: number): Raster {
  const data = new Uint8Array(width * height * 4);
  for (let j = 0; j < height; j++) {
    const from = ((y + j) * img.width + x) * 4;
    data.set(img.data.subarray(from, from + width * 4), j * width * 4);
  }
  return { width, height, data };
}

// Nearest-neighbor resizing by `k`, so every source pixel stays a crisp square when enlarged.
export function zoom(img: Raster, k: number): Raster {
  const width = Math.round(img.width * k);
  const height = Math.round(img.height * k);
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const s = (Math.min(img.height - 1, (y / k) | 0) * img.width + Math.min(img.width - 1, (x / k) | 0)) * 4;
      data.set(img.data.subarray(s, s + 4), (y * width + x) * 4);
    }
  return { width, height, data };
}

// The raster with `pad` pixels added on every side, each a copy of the nearest edge pixel: a bleed
// for drawings whose layers move, so that moving never pulls an edge into view.
export function bleed(img: Raster, pad: number): Raster {
  const width = img.width + 2 * pad;
  const height = img.height + 2 * pad;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const sx = Math.min(img.width - 1, Math.max(0, x - pad));
      const sy = Math.min(img.height - 1, Math.max(0, y - pad));
      const s = (sy * img.width + sx) * 4;
      data.set(img.data.subarray(s, s + 4), (y * width + x) * 4);
    }
  return { width, height, data };
}
