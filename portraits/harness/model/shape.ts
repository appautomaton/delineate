// Flat shapes over a picture: a polygon in one color, crisp or out of focus. Loose pieces that lie
// over a layer and move off it (confetti, petals) are shapes, whatever draws them, and a build needs
// two things of each: every pixel it touches, so the layer is drawn whole beneath it, and for a
// blurred one, how it changes what lies behind it, so that can be taken back out of the picture.

import { type Point, distance } from "../trace/polygon.ts";
import { blur as gaussian } from "../trace/stack.ts";

export type Shape = { polygon: Point[]; color: string; blur?: number };

// Every pixel within `reach` of the polygon, its inside included.
export function footprint(polygon: Point[], w: number, h: number, reach: number): Uint8Array {
  const out = new Uint8Array(w * h);
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  for (let y = Math.max(0, Math.floor(Math.min(...ys) - reach)); y <= Math.min(h - 1, Math.ceil(Math.max(...ys) + reach)); y++)
    for (let x = Math.max(0, Math.floor(Math.min(...xs) - reach)); x <= Math.min(w - 1, Math.ceil(Math.max(...xs) + reach)); x++)
      if (distance(polygon, x + 0.5, y + 0.5) > -reach) out[y * w + x] = 1;
  return out;
}

// How shapes drawn back to front, each through its blur, change what lies behind them: per pixel,
// the share of the background still seen (`through`), and the color the shapes add over it
// (`added`, per channel, 0-255). The picture is then background × through + added, in sRGB, as an
// SVG filter composites it.
export function defocus(shapes: Shape[], w: number, h: number): { through: Float32Array; added: Float32Array[] } {
  const through = new Float32Array(w * h).fill(1);
  const added = [0, 1, 2].map(() => new Float32Array(w * h));
  const SUB = 3; // samples per pixel side when measuring coverage
  for (const { polygon, color, blur = 0 } of shapes) {
    const reach = Math.ceil(3 * blur) + 2;
    const xs = polygon.map((p) => p[0]);
    const ys = polygon.map((p) => p[1]);
    const x0 = Math.max(0, Math.floor(Math.min(...xs)) - reach);
    const y0 = Math.max(0, Math.floor(Math.min(...ys)) - reach);
    const bw = Math.min(w, Math.ceil(Math.max(...xs)) + reach) - x0;
    const bh = Math.min(h, Math.ceil(Math.max(...ys)) + reach) - y0;
    const cover = new Float32Array(bw * bh);
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        let hits = 0;
        for (let sy = 0; sy < SUB; sy++) for (let sx = 0; sx < SUB; sx++) if (distance(polygon, x0 + x + (sx + 0.5) / SUB, y0 + y + (sy + 0.5) / SUB) > 0) hits++;
        cover[y * bw + x] = hits / (SUB * SUB);
      }
    const alpha = gaussian(cover, bw, bh, blur);
    const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        const a = alpha[y * bw + x];
        if (a <= 0) continue;
        const p = (y0 + y) * w + x0 + x;
        through[p] *= 1 - a;
        for (let k = 0; k < 3; k++) added[k][p] = added[k][p] * (1 - a) + rgb[k] * a;
      }
  }
  return { through, added };
}
