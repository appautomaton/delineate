// Masks: one byte a pixel, 1 inside. Growing and shrinking them, their connected pieces, and the
// masks a scene declares by place (boxes, lines across the frame) or by color (ranges in OKLab).

import { labPlanes } from "./color.ts";
import type { Raster } from "./image.ts";
import type { Box, Point } from "./polygon.ts";
import type { Planes } from "./quantize.ts";

// Binary dilation by a square of radius r.
export function grow(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const row = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let on = 0;
      for (let d = -r; d <= r && !on; d++) on = mask[y * w + Math.min(w - 1, Math.max(0, x + d))];
      row[y * w + x] = on;
    }
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let on = 0;
      for (let d = -r; d <= r && !on; d++) on = row[Math.min(h - 1, Math.max(0, y + d)) * w + x];
      out[y * w + x] = on;
    }
  return out;
}

export function shrink(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  return Uint8Array.from(grow(Uint8Array.from(mask, (v) => 1 - v), w, h, r), (v) => 1 - v);
}

// Gaps and dark lines up to 2r wide shut: the dilation, then the erosion.
export const close = (mask: Uint8Array, w: number, h: number, r: number) => shrink(grow(mask, w, h, r), w, h, r);

// The connected pieces of a mask, 4-neighbors, as lists of pixels, in the order their first pixels
// come in the scan.
export function pieces(mask: ArrayLike<number>, w: number): number[][] {
  const n = mask.length;
  const seen = new Uint8Array(n);
  const out: number[][] = [];
  for (let s = 0; s < n; s++) {
    if (!mask[s] || seen[s]) continue;
    const piece = [s];
    seen[s] = 1;
    for (let i = 0; i < piece.length; i++) {
      const p = piece[i];
      const x = p % w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w])
        if (q >= 0 && q < n && mask[q] && !seen[q]) {
          seen[q] = 1;
          piece.push(q);
        }
    }
    out.push(piece);
  }
  return out;
}

// Pieces of the mask smaller than `least` pixels cleared, in place.
export function dropSmall(mask: Uint8Array, w: number, least: number) {
  for (const piece of pieces(mask, w)) if (piece.length < least) for (const p of piece) mask[p] = 0;
}

// 1 inside any of the boxes.
export function boxes(list: Box[], w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h);
  for (const [x0, y0, x1, y1] of list) for (let y = Math.max(0, y0); y < Math.min(h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(w, x1); x++) out[y * w + x] = 1;
  return out;
}

// A polyline's height at x: it runs left to right, held level beyond its ends, and where it doubles
// back on itself (a step), the last segment over x wins.
export function lineAt(line: Point[], x: number): number {
  if (x <= line[0][0]) return line[0][1];
  let y = line[line.length - 1][1];
  for (let i = 1; i < line.length; i++) {
    const [[x0, y0], [x1, y1]] = [line[i - 1], line[i]];
    if (x >= Math.min(x0, x1) && x <= Math.max(x0, x1)) y = x1 === x0 ? y1 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return y;
}

// A range of colors in OKLab: lightness L, chroma C, hue h in degrees, and the a and b axes. A pixel
// is of a tone when it lies in every range the tone gives.
export type Tone = { L?: [number, number]; C?: [number, number]; h?: [number, number]; a?: [number, number]; b?: [number, number] };

export function ofTone([L, A, B]: Planes, p: number, tones: Tone[]): boolean {
  const C = Math.hypot(A[p], B[p]);
  const hue = (Math.atan2(B[p], A[p]) * 180) / Math.PI;
  const within = (v: number, range?: [number, number]) => !range || (v >= range[0] && v <= range[1]);
  return tones.some((t) => within(L[p], t.L) && within(C, t.C) && within(hue, t.h) && within(A[p], t.a) && within(B[p], t.b));
}

// A line read off the picture by eye (a ridge, a horizon), settled onto the strongest edge between
// light above and dark below within `reach` pixels of it: a height for every column, found by
// dynamic programming so that each column's differs from the next by a pixel at most.
export function settle(img: Raster, line: Point[], reach: number): Float32Array {
  const { width: w, height: h } = img;
  const [L, A, B] = labPlanes(img.data, w * h);
  const span = 2 * reach + 1;
  const cost = new Float32Array(w * span);
  for (let x = 0; x < w; x++) {
    const y0 = Math.round(lineAt(line, x + 0.5));
    for (let k = 0; k < span; k++) {
      const y = y0 - reach + k;
      let up = 0;
      let down = 0;
      for (let d = 1; d <= 3; d++) {
        const [a, b] = [Math.max(0, y - d) * w + x, Math.min(h - 1, y + d - 1) * w + x];
        up += L[a] + Math.hypot(A[a], B[a]);
        down += L[b] + Math.hypot(A[b], B[b]);
      }
      cost[x * span + k] = -(up - down) / 3 + 0.002 * Math.abs(k - reach);
    }
  }
  const total = Float32Array.from(cost.subarray(0, span));
  const from = new Int8Array(w * span);
  for (let x = 1; x < w; x++) {
    const shift = Math.round(lineAt(line, x + 0.5)) - Math.round(lineAt(line, x - 0.5));
    const next = new Float32Array(span).fill(Infinity);
    for (let k = 0; k < span; k++)
      for (const step of [-1, 0, 1]) {
        const j = k + shift + step; // the same height in the previous column's window, give or take a pixel
        if (j < 0 || j >= span || total[j] + cost[x * span + k] >= next[k]) continue;
        next[k] = total[j] + cost[x * span + k];
        from[x * span + k] = j;
      }
    for (let k = 0; k < span; k++)
      if (!Number.isFinite(next[k])) {
        next[k] = total[k] + cost[x * span + k] + 1;
        from[x * span + k] = k;
      }
    total.set(next);
  }
  const out = new Float32Array(w);
  let k = total.indexOf(Math.min(...total));
  for (let x = w - 1; x >= 0; x--) {
    out[x] = Math.round(lineAt(line, x + 0.5)) - reach + k;
    k = x ? from[x * span + k] : k;
  }
  return out;
}
