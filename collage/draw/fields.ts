// A motif's fields, read once from its renders and brought into the drawing's frame. Pixels enter
// here only as fields: tone, opacity, depth (metres), normals. Every drawing is made in the output
// frame: the figure cropped with air, 1200 px on its long side.

import { readFileSync } from "node:fs";
import { PNG } from "pngjs";
import { readPng, type Raster } from "../../portraits/harness/trace/image.ts";
import type { Field } from "../../portraits/pieces/wavy-line-engraving/engrave.ts";
import { renders } from "../render.ts";

export const LONG = 1200;
const AIR = 0.05; // of the long side, round the figure

// 16-bit RGBA as floats 0..1.
function read16(path: string): { width: number; height: number; data: Float32Array } {
  const png = PNG.sync.read(readFileSync(path), { skipRescale: true });
  const data = new Float32Array(png.width * png.height * 4);
  const max = png.depth === 16 ? 65535 : 255;
  for (let i = 0; i < data.length; i++) data[i] = png.data[i] / max;
  return { width: png.width, height: png.height, data };
}

export type Frame = { width: number; height: number; scale: number; x0: number; y0: number };
export type Fields = {
  frame: Frame;
  source: { tone: Raster; beauty: Raster; alpha: Field; depth: Field; normal: Field[] };
  // The side the key light comes from: -1 the left, 1 the right.
  side: -1 | 1;
};

export function load(id: string): Fields {
  const pass = (name: string) => `${renders(id)}/${name}.png`;
  const render = JSON.parse(readFileSync(`${renders(id)}/view.json`, "utf8"));
  const tone = readPng(pass("tone"));
  const beautyRgb = readPng(pass("beauty"));
  const { width: w, height: h } = tone;
  const alpha: Field = { width: w, height: h, data: Float32Array.from({ length: w * h }, (_, p) => tone.data[p * 4 + 3] / 255) };
  const d16 = read16(pass("depth"));
  const n16 = read16(pass("normal"));
  const [near, far] = [render.depth_near, render.depth_far];
  // Metres from the camera; where the render is empty, the far plane.
  const depth: Field = { width: w, height: h, data: Float32Array.from({ length: w * h }, (_, p) => (d16.data[p * 4 + 3] > 0.5 ? far - d16.data[p * 4] * (far - near) : far)) };
  const normal = [0, 1, 2].map((c) => ({ width: w, height: h, data: Float32Array.from({ length: w * h }, (_, p) => n16.data[p * 4 + c] * 2 - 1) }));
  // beauty.png carries no alpha; it shares the tone render's camera, so it takes that opacity.
  const beauty: Raster = { width: w, height: h, data: new Uint8Array(w * h * 4) };
  const stride = beautyRgb.data.length / (w * h);
  for (let p = 0; p < w * h; p++) {
    for (let c = 0; c < 3; c++) beauty.data[p * 4 + c] = beautyRgb.data[p * stride + c];
    beauty.data[p * 4 + 3] = tone.data[p * 4 + 3];
  }
  // The figure's box, with air, scaled so its long side is LONG.
  let [bx0, by0, bx1, by1] = [w, h, 0, 0];
  alpha.data.forEach((a, p) => {
    if (a < 0.5) return;
    const [x, y] = [p % w, Math.floor(p / w)];
    [bx0, by0, bx1, by1] = [Math.min(bx0, x), Math.min(by0, y), Math.max(bx1, x + 1), Math.max(by1, y + 1)];
  });
  const long = Math.max(bx1 - bx0, by1 - by0);
  const air = AIR * long;
  const scale = LONG / (long + 2 * air);
  const width = Math.round((bx1 - bx0 + 2 * air) * scale);
  const height = Math.round((by1 - by0 + 2 * air) * scale);
  // The source point drawn at the frame's origin, so the figure is centered.
  const x0 = (bx0 + bx1) / 2 - width / scale / 2;
  const y0 = (by0 + by1) / 2 - height / scale / 2;
  return { frame: { width, height, scale, x0, y0 }, source: { tone, beauty, alpha, depth, normal }, side: render.key_side === 1 ? 1 : -1 };
}

// A source field sampled into the frame, `k` samples per frame pixel, by bilinear interpolation.
export function reframe(f: Field, { width, height, scale, x0, y0 }: Frame, k = 1): Field {
  const W = width * k;
  const H = height * k;
  const out = new Float32Array(W * H);
  const { width: w, height: h, data } = f;
  for (let gy = 0; gy < H; gy++)
    for (let gx = 0; gx < W; gx++) {
      const sx = x0 + (gx + 0.5) / k / scale - 0.5;
      const sy = y0 + (gy + 0.5) / k / scale - 0.5;
      const fx = Math.min(w - 1, Math.max(0, sx));
      const fy = Math.min(h - 1, Math.max(0, sy));
      const xa = Math.floor(fx), ya = Math.floor(fy);
      const xb = Math.min(w - 1, xa + 1), yb = Math.min(h - 1, ya + 1);
      const tx = fx - xa, ty = fy - ya;
      const inside = sx >= -0.5 && sy >= -0.5 && sx <= w - 0.5 && sy <= h - 0.5;
      out[gy * W + gx] = inside
        ? (data[ya * w + xa] * (1 - tx) + data[ya * w + xb] * tx) * (1 - ty) + (data[yb * w + xa] * (1 - tx) + data[yb * w + xb] * tx) * ty
        : data[0];
    }
  return { width: W, height: H, data: out };
}

// A field's values where `known` is false replaced by the mean of known values nearby, grown ring
// by ring (`rings` times), so samples taken across an edge do not mix in what lies outside.
export function extend(f: Field, known: (p: number) => boolean, rings: number): Field {
  const { width: w, height: h } = f;
  const data = Float32Array.from(f.data);
  let have = Uint8Array.from({ length: w * h }, (_, p) => (known(p) ? 1 : 0));
  for (let r = 0; r < rings; r++) {
    const next = Uint8Array.from(have);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (have[p]) continue;
        let s = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const q = (y + dy) * w + x + dx;
            if (x + dx < 0 || y + dy < 0 || x + dx >= w || y + dy >= h || !have[q]) continue;
            s += data[q];
            n++;
          }
        if (n) {
          data[p] = s / n;
          next[p] = 1;
        }
      }
    have = next;
  }
  return { width: w, height: h, data };
}
