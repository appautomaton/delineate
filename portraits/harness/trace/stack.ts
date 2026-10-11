// Tone stacking: a region drawn as a stack of tones. Each tone covers its own pixels and all the
// pixels of the tones stacked above it, so the stack leaves no gaps and every boundary between
// two tones is traced once, by the upper one.
//
// A tone's outline is the zero crossing of a margin field: how much nearer a pixel's color lies to
// the tones at or above this one than to the tones below. The crossing falls where a painted edge
// is half way between its two sides, so outlines land on the painting's own anti-aliased edges.
//
// Each separate shape of a tone is filled with a ramp fitted to the pixels it shows, so a smooth
// gradient painted across many tones is redrawn as joined ramps rather than steps.
//
// A tone reaches under the tones above it only a little way past its own pixels: far enough that
// the edges above it close over it without a gap, and no farther. Two things follow. Every
// boundary is drawn twice at most, once as the upper tone's edge and once, hidden, as the lower
// tone's reach; a full stack would redraw it for every tone in between. And no tone runs to an
// edge where other tones meet each other, or meet the region's outline, where its edge would
// coincide with theirs and the anti-aliasing of two coinciding edges would let it show through
// as a hairline of the wrong color. The bottom tone keeps to the same rule, so every stretch of
// the outline is drawn by the one tone that shows there.

import { type FitOptions, fitRing, pathData } from "./bezier.ts";
import type { Lab } from "./color.ts";
import { contours, rasterize, shapes } from "./contour.ts";
import type { Raster } from "./image.ts";
import { grow } from "./mask.ts";
import type { Planes } from "./quantize.ts";
import { type Fill, fillOf } from "./ramp.ts";

export type Piece = { d: string; fill: Fill; tone: number };
export type Bounds = { x: number; y: number; width: number; height: number };

export type StackOptions = {
  soften?: number; // blur on each tone's field before tracing, in pixels
  flat?: number; // a ramp changing less than this, in levels end to end, is drawn flat
  minArea?: number; // rings smaller than this, in square pixels, are dropped
  fit?: FitOptions;
  origin?: [number, number]; // the raster point drawn at (0, 0); a raster with bleed sets it to the bleed
};

// Bottom to top, light to dark, the way glazes go down. Where two tones meet, the anti-aliased
// edge lets a sliver of every tone stacked between them show through; in lightness order those
// tones lie between the two in value, so the sliver reads as the edge's own blend instead of a
// dark seam. Tones no pixel uses are dropped.
export function order(lab: Planes, pixels: Int32Array, palette: Lab[]): Lab[] {
  const used = new Uint8Array(palette.length);
  for (const p of pixels) used[nearest(lab, p, palette)] = 1;
  return palette.filter((_, i) => used[i]).sort((a, b) => b[0] - a[0]);
}

export function nearest([L, A, B]: Planes, p: number, palette: Lab[]): number {
  let best = 0;
  let bestD = Infinity;
  for (let c = 0; c < palette.length; c++) {
    const d = (L[p] - palette[c][0]) ** 2 + (A[p] - palette[c][1]) ** 2 + (B[p] - palette[c][2]) ** 2;
    if (d < bestD) [best, bestD] = [c, d];
  }
  return best;
}

// The pieces of `region` (positive inside, zero on its outline), which lies within `box`.
// `lab` is the flattened painting that tones are read from; `paint` is the painting itself,
// which fills are fitted to. `palette` runs bottom to top.
// Levels between kept distance marks; see `stack`.
const STRIDE = 8;
// How far, in pixels, a tone reaches under the tones above it.
const REACH = 3;

export function stack(lab: Planes, paint: Raster, region: Float32Array, box: Bounds, palette: Lab[], { soften = 0.5, flat = 1.5, minArea = 1.5, fit = {}, origin = [0, 0] }: StackOptions = {}): Piece[] {
  const { width } = paint;
  const { x: bx, y: by, width: w, height: h } = box;
  const n = w * h;
  const K = palette.length;
  const at = (i: number) => (by + Math.floor(i / w)) * width + bx + (i % w);

  // The box's own copy of the flattened painting, so distances read contiguous memory.
  const [L, A, B] = [0, 1, 2].map((c) => Float32Array.from({ length: n }, (_, i) => lab[c][at(i)]));
  const dist = (i: number, c: Lab) => Math.hypot(L[i] - c[0], A[i] - c[1], B[i] - c[2]);

  // Distance to the nearest tone at or above a level. Kept for every STRIDE-th level only, and
  // completed for the levels between from the next mark up, which bounds memory for long palettes.
  const marks: Float32Array[] = [];
  for (let m = Math.ceil(K / STRIDE) - 1; m >= 0; m--) {
    const mark = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let best = m + 1 < Math.ceil(K / STRIDE) ? marks[m + 1][i] : Infinity;
      for (let j = m * STRIDE; j < Math.min(K, (m + 1) * STRIDE); j++) best = Math.min(best, dist(i, palette[j]));
      mark[i] = best;
    }
    marks[m] = mark;
  }
  const above = (k: number, i: number) => {
    const m = Math.ceil(k / STRIDE);
    let best = m < marks.length ? marks[m][i] : Infinity;
    for (let j = k; j < Math.min(K, m * STRIDE); j++) best = Math.min(best, dist(i, palette[j]));
    return best;
  };

  const inside = new Float32Array(n);
  const tone = new Int32Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    inside[i] = region[at(i)];
    if (inside[i] > 0) tone[i] = nearest(lab, at(i), palette);
  }

  const below = new Float32Array(n).fill(Infinity);
  const pieces: Piece[] = [];
  palette.forEach((c, k) => {
    const field = new Float32Array(n);
    for (let i = 0; i < n; i++) field[i] = k === 0 ? inside[i] : below[i] - above(k, i);
    // The bottom tone's field is the region itself; the region's outline is already smooth.
    const traced = k === 0 ? field : blur(field, w, h, soften);
    const near = grow(Uint8Array.from(tone, (t) => (t === k ? 1 : 0)), w, h, REACH);
    // The reach is hidden, so its outline is drawn smooth and cheap.
    const keep = blur(Float32Array.from(near, (v) => (v ? 1 : -1)), w, h, 1.5);
    for (let i = 0; i < n; i++) traced[i] = Math.min(traced[i], inside[i], keep[i]);
    for (let i = 0; i < n; i++) below[i] = Math.min(below[i], dist(i, c));

    for (const shape of shapes(contours(traced, w, h, minArea))) {
      const shown: number[] = [];
      rasterize(shape, w, h, (i) => tone[i] === k && shown.push(at(i)));
      const fill = fillOf(paint, shown, flat);
      if (!fill) continue;
      if ("from" in fill) {
        fill.x1 -= origin[0];
        fill.x2 -= origin[0];
        fill.y1 -= origin[1];
        fill.y2 -= origin[1];
      }
      const d = pathData(
        shape.map((r) => {
          for (let j = 0; j < r.length; j += 2) {
            r[j] += bx - origin[0];
            r[j + 1] += by - origin[1];
          }
          return fitRing(r, fit);
        }),
      );
      if (d) pieces.push({ d, fill, tone: k });
    }
  });
  return pieces;
}


// Gaussian blur of a field, edges clamped. Narrow blurs use the exact separable kernel; wide ones
// use three box blurs in a row, whose sizes are chosen to match the Gaussian's variance (Kovesi,
// "Fast Almost-Gaussian Filtering", 2010), at a cost that does not grow with the width.
export function blur(field: Float32Array, w: number, h: number, sigma: number): Float32Array {
  if (sigma <= 0) return Float32Array.from(field);
  if (sigma >= 2.5) return boxes(field, w, h, sigma);
  const r = Math.ceil(sigma * 3);
  const kernel = Float32Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  const sum = kernel.reduce((a, b) => a + b, 0);
  kernel.forEach((v, i) => (kernel[i] = v / sum));
  const tmp = new Float32Array(field.length);
  const out = new Float32Array(field.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += kernel[k + r] * field[y * w + Math.min(w - 1, Math.max(0, x + k))];
      tmp[y * w + x] = s;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += kernel[k + r] * tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x];
      out[y * w + x] = s;
    }
  return out;
}

function boxes(field: Float32Array, w: number, h: number, sigma: number): Float32Array {
  // Three passes: m of width wl and the rest of width wl + 2, together of variance sigma².
  let wl = Math.floor(Math.sqrt(4 * sigma * sigma + 1));
  if (wl % 2 === 0) wl--;
  const m = Math.round((12 * sigma * sigma - 3 * wl * wl - 12 * wl - 9) / (-4 * wl - 4));
  let a = Float32Array.from(field);
  let b = new Float32Array(field.length);
  for (let i = 0; i < 3; i++) {
    const r = ((i < m ? wl : wl + 2) - 1) / 2;
    box(a, b, w, h, r, true);
    box(b, a, w, h, r, false);
  }
  return a;
}

// A running-sum box blur of radius r along rows or columns, edges clamped.
function box(src: Float32Array, dst: Float32Array, w: number, h: number, r: number, rows: boolean) {
  const [lines, len, stride, step] = rows ? [h, w, w, 1] : [w, h, 1, w];
  const k = 1 / (2 * r + 1);
  for (let l = 0; l < lines; l++) {
    const o = l * stride;
    const at = (i: number) => src[o + Math.min(len - 1, Math.max(0, i)) * step];
    let sum = 0;
    for (let i = -r; i <= r; i++) sum += at(i);
    for (let i = 0; i < len; i++) {
      dst[o + i * step] = sum * k;
      sum += at(i + r + 1) - at(i - r);
    }
  }
}
