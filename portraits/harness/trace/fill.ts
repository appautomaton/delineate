// Filling large hidden areas smoothly. Telea's inpainting carries edge colors inward along
// straight lines, which over a band of a few pixels is right and over hundreds draws streaks. Here
// the known pixels are averaged down a pyramid, halving each time, until every cell has some; then
// back up, each unknown pixel takes the smooth color of the coarser level (push-pull, Gortler et
// al., "The Lumigraph", 1996). Far from what is known, the fill is the broad average around it; near
// it, its local color.
// The fill for wide hidden areas; layer.ts's inpainting is for narrow ones.

import type { Raster } from "./image.ts";

// A copy of `img` whose pixels in `fill` (by default, all) and not in `known` are painted in from
// `known`.
export function pushPull(img: Raster, known: Uint8Array, fill?: Uint8Array): Raster {
  const { width: w0, height: h0 } = img;
  type Level = { w: number; h: number; c: Float32Array; a: Float32Array };
  const base: Level = { w: w0, h: h0, c: new Float32Array(w0 * h0 * 3), a: new Float32Array(w0 * h0) };
  for (let p = 0; p < w0 * h0; p++)
    if (known[p]) {
      base.a[p] = 1;
      for (let k = 0; k < 3; k++) base.c[p * 3 + k] = img.data[p * 4 + k];
    }
  // Down: each cell the weighted mean of its four, its weight their sum, at most 1.
  const levels = [base];
  for (let l = base; l.w > 1 || l.h > 1; ) {
    const w = Math.ceil(l.w / 2);
    const h = Math.ceil(l.h / 2);
    const next: Level = { w, h, c: new Float32Array(w * h * 3), a: new Float32Array(w * h) };
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let a = 0;
        const c = [0, 0, 0];
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const [sx, sy] = [2 * x + dx, 2 * y + dy];
          if (sx >= l.w || sy >= l.h) continue;
          const q = sy * l.w + sx;
          a += l.a[q];
          for (let k = 0; k < 3; k++) c[k] += l.c[q * 3 + k] * l.a[q];
        }
        const p = y * w + x;
        if (a > 0) for (let k = 0; k < 3; k++) next.c[p * 3 + k] = c[k] / a;
        next.a[p] = Math.min(1, a);
      }
    levels.push(next);
    l = next;
  }
  // Up: a cell's color is its own, weighed by how much it knows, and the rest from the level above,
  // sampled bilinearly.
  for (let i = levels.length - 2; i >= 0; i--) {
    const [l, up] = [levels[i], levels[i + 1]];
    for (let y = 0; y < l.h; y++)
      for (let x = 0; x < l.w; x++) {
        const p = y * l.w + x;
        if (l.a[p] >= 1) continue;
        const fx = Math.max(0, Math.min(up.w - 1, (x + 0.5) / 2 - 0.5));
        const fy = Math.max(0, Math.min(up.h - 1, (y + 0.5) / 2 - 0.5));
        const [x0, y0] = [Math.floor(fx), Math.floor(fy)];
        const [x1, y1] = [Math.min(up.w - 1, x0 + 1), Math.min(up.h - 1, y0 + 1)];
        const [tx, ty] = [fx - x0, fy - y0];
        for (let k = 0; k < 3; k++) {
          const at = (xx: number, yy: number) => up.c[(yy * up.w + xx) * 3 + k];
          const coarse = (at(x0, y0) * (1 - tx) + at(x1, y0) * tx) * (1 - ty) + (at(x0, y1) * (1 - tx) + at(x1, y1) * tx) * ty;
          l.c[p * 3 + k] = l.c[p * 3 + k] * l.a[p] + coarse * (1 - l.a[p]);
        }
        l.a[p] = 1;
      }
  }
  const data = Uint8Array.from(img.data);
  for (let p = 0; p < w0 * h0; p++) if ((!fill || fill[p]) && !known[p]) for (let k = 0; k < 3; k++) data[p * 4 + k] = Math.round(base.c[p * 3 + k]);
  return { ...img, data };
}
