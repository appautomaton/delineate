// Fills fitted to pixels: a linear ramp when the paint shades along one direction, otherwise
// a flat color. The ramp is the best rank-one affine fit, which an SVG linear gradient draws
// exactly: color changes along one axis and holds across it.

import { hex } from "./color.ts";
import type { Raster } from "./image.ts";

export type Fill = { color: string } | { from: string; to: string; x1: number; y1: number; x2: number; y2: number };

// `flat`: the largest change, in levels of any channel end to end, that is still drawn flat.
export function fillOf(img: Raster, pixels: ArrayLike<number>, flat = 1.5): Fill | undefined {
  const n = pixels.length;
  if (!n) return;
  const { width: w, data } = img;
  let sx = 0;
  let sy = 0;
  const sc = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const p = pixels[i];
    sx += (p % w) + 0.5;
    sy += Math.floor(p / w) + 0.5;
    for (let c = 0; c < 3; c++) sc[c] += data[p * 4 + c];
  }
  const cx = sx / n;
  const cy = sy / n;
  const mean = sc.map((v) => v / n);
  if (n < 6) return { color: hex(mean.map(round)) };

  // Least-squares slopes per channel, lightly regularized for thin regions.
  let xx = 2;
  let xy = 0;
  let yy = 2;
  const cX = [0, 0, 0];
  const cY = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const p = pixels[i];
    const dx = (p % w) + 0.5 - cx;
    const dy = Math.floor(p / w) + 0.5 - cy;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
    for (let c = 0; c < 3; c++) {
      const v = data[p * 4 + c] - mean[c];
      cX[c] += v * dx;
      cY[c] += v * dy;
    }
  }
  const det = xx * yy - xy * xy;
  const gx = cX.map((v, c) => (yy * v - xy * cY[c]) / det);
  const gy = cY.map((v, c) => (xx * v - xy * cX[c]) / det);

  // The direction of steepest shading across all three channels.
  const a = gx.reduce((s, v) => s + v * v, 0);
  const b = gx.reduce((s, v, c) => s + v * gy[c], 0);
  const d = gy.reduce((s, v) => s + v * v, 0);
  const theta = 0.5 * Math.atan2(2 * b, a - d);
  const ux = Math.cos(theta);
  const uy = Math.sin(theta);
  const slope = gx.map((v, c) => v * ux + gy[c] * uy);

  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < n; i++) {
    const p = pixels[i];
    const t = ((p % w) + 0.5 - cx) * ux + (Math.floor(p / w) + 0.5 - cy) * uy;
    lo = Math.min(lo, t);
    hi = Math.max(hi, t);
  }
  if (Math.max(...slope.map(Math.abs)) * (hi - lo) < flat) return { color: hex(mean.map(round)) };
  const at = (t: number) => hex(mean.map((m, c) => round(m + slope[c] * t)));
  return { from: at(lo), to: at(hi), x1: cx + ux * lo, y1: cy + uy * lo, x2: cx + ux * hi, y2: cy + uy * hi };
}

const round = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
