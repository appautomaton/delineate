// A cherry petal, drawn once and placed many times. In its own box the petal lies along x, an
// almond pointed at both ends: the narrow base at the left, the tip at the right, 100 long and 100
// wide. A placement gives its center, angle, length and width, color, and the blur that softens it
// near the lens.
//
//   node portraits/pieces/memories-girl/petal.ts   fits the petals the picture shows and prints them
//
// The forward plate paints the petals cleanly but not quite where the picture has them, and it
// paints some the picture does not have at all. So the petals worth keeping are chosen by eye (SEEDS),
// each is taken from the plate as its island of alpha, and the island is moved, scaled, and turned
// until it sits on the picture's own petal: pale pink inside, something else around it.

import { fileURLToPath } from "node:url";
import { type Placement, type Sprite, placeByMoments, spriteFootprint } from "../../harness/model/sprite.ts";
import { hex, labPlanes } from "../../harness/trace/color.ts";
import { type Raster, readPng } from "../../harness/trace/image.ts";
import type { Point } from "../../harness/trace/polygon.ts";
import { FORWARD, REFERENCE } from "./scene.ts";

export type Petal = Placement;

// The base in the petal's color, a pale band along its middle where it catches the light, and a
// deeper pink at the base.
export const PETAL: Sprite = {
  id: "petal",
  outline: [
    [-50, 0], [-40, -8], [-28, -26], [-12, -42], [5, -49], [22, -45], [37, -32], [47, -15],
    [50, 0], [47, 15], [37, 32], [22, 45], [5, 49], [-12, 42], [-28, 26], [-40, 8],
  ],
  paths: [
    '<path fill="var(--petal)" d="M-50 0C-38-10-24-44 4-49C28-50 46-24 50 0C46 24 28 50 4 49C-24 44-38 10-50 0Z"/>',
    '<path fill="#fff" opacity=".5" d="M-38 1C-16-10 14-22 42-3C20-4-10 2-38 1Z"/>',
    '<path fill="#e26d97" opacity=".22" d="M-50 0C-40-7-31-12-22-11C-30-4-40 5-50 0Z"/>',
  ].join("\n"),
};

const r = (v: number, k = 10) => Math.round(v * k) / k;

// The petals the picture shows, one seed point each, read off a sheet of the plate's islands beside
// the picture. Two seeds in one island split it between them.
const SEEDS: Point[] = [
  [1058, 52], [87, 148], [519, 232], [1136, 228], [351, 271], [1200, 357], [254, 408], [101, 455], [367, 537], [985, 677], [106, 688], [208, 755], [240, 772], [366, 814], [176, 811], [240, 894], [107, 941], [345, 943],
  [1221, 948], [1198, 1135],
];

// A petal's pixels in the picture, judged by color: pale and pinkish white.
function likeness(full: Raster): Float32Array {
  const n = full.width * full.height;
  const [L, A, B] = labPlanes(full.data, n);
  return Float32Array.from({ length: n }, (_, p) => {
    const light = Math.min(1, Math.max(0, (L[p] - 0.74) / 0.1));
    const hue = Math.max(0, 1 - Math.hypot(A[p] - 0.035, (B[p] + 0.004) * 1.3) / 0.05);
    return light * hue;
  });
}

export function fitPetals(plate: Raster, full: Raster): Petal[] {
  const { width: w, height: h } = full;
  const alpha = Float32Array.from({ length: w * h }, (_, p) => plate.data[p * 4 + 3] / 255);
  const like = likeness(full);
  // The islands of alpha, and each seed's share of its island: the pixels nearer it than any other
  // seed in the same island.
  const island = new Int32Array(w * h).fill(-1);
  let islands = 0;
  for (const [sx, sy] of SEEDS) {
    const s = Math.round(sy) * w + Math.round(sx);
    if (alpha[s] < 0.25) console.error(`seed ${sx},${sy}: no petal on the plate`);
    if (alpha[s] < 0.25 || island[s] >= 0) continue;
    const todo = [s];
    island[s] = islands;
    while (todo.length) {
      const p = todo.pop()!;
      const x = p % w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w])
        if (q >= 0 && q < w * h && island[q] < 0 && alpha[q] >= 0.25) {
          island[q] = islands;
          todo.push(q);
        }
    }
    islands++;
  }
  const seedIsland = SEEDS.map(([sx, sy]) => island[Math.round(sy) * w + Math.round(sx)]);
  const shares: number[][] = SEEDS.map(() => []);
  for (let p = 0; p < w * h; p++) {
    if (island[p] < 0) continue;
    const x = (p % w) + 0.5;
    const y = Math.floor(p / w) + 0.5;
    let best = -1;
    let near = Infinity;
    SEEDS.forEach(([sx, sy], k) => {
      const d = Math.hypot(x - sx, y - sy);
      if (seedIsland[k] === island[p] && d < near) [near, best] = [d, k];
    });
    if (best >= 0) shares[best].push(p);
  }

  const out: Petal[] = [];
  shares.forEach((pixels, k) => {
    if (!pixels.length) return;
    let [cx, cy, m] = [0, 0, 0];
    for (const p of pixels) {
      cx += alpha[p] * ((p % w) + 0.5);
      cy += alpha[p] * (Math.floor(p / w) + 0.5);
      m += alpha[p];
    }
    cx /= m;
    cy /= m;
    const own = new Float32Array(w * h);
    for (const p of pixels) own[p] = alpha[p];
    const R = Math.ceil(Math.sqrt(pixels.length) * 1.2) + 18;
    // How well the island, moved by (dx, dy), scaled by s about its center, and turned by t, lies on
    // the picture's petal: the normalized correlation of its alpha with the picture's likeness to a
    // petal, over a window around it. Correlation, unlike a mean inside, does not favor shrinking.
    const score = (dx: number, dy: number, s: number, t: number) => {
      const [c, n] = [Math.cos(t) / s, Math.sin(t) / s];
      let [sa, sl, saa, sll, sal, count] = [0, 0, 0, 0, 0, 0];
      for (let Y = Math.max(0, Math.floor(cy - R)); Y <= Math.min(h - 1, cy + R); Y++)
        for (let X = Math.max(0, Math.floor(cx - R)); X <= Math.min(w - 1, cx + R); X++) {
          const u = X + 0.5 - cx - dx;
          const v = Y + 0.5 - cy - dy;
          const px = Math.round(cx + c * u + n * v - 0.5);
          const py = Math.round(cy - n * u + c * v - 0.5);
          const a = px < 0 || py < 0 || px >= w || py >= h ? 0 : own[py * w + px];
          const l = like[Y * w + X];
          sa += a;
          sl += l;
          saa += a * a;
          sll += l * l;
          sal += a * l;
          count++;
        }
      const cov = sal - (sa * sl) / count;
      return cov / Math.sqrt(Math.max(1e-9, (saa - (sa * sa) / count) * (sll - (sl * sl) / count)));
    };
    let best = { dx: 0, dy: 0, s: 1, t: 0, v: score(0, 0, 1, 0) };
    for (let dy = -14; dy <= 14; dy += 2)
      for (let dx = -14; dx <= 14; dx += 2) {
        const v = score(dx, dy, 1, 0);
        if (v > best.v) best = { dx, dy, s: 1, t: 0, v };
      }
    for (let round = 0; round < 2; round++)
      for (const s of [0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15])
        for (const t of [-0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15])
          for (let dy = -2; dy <= 2; dy++)
            for (let dx = -2; dx <= 2; dx++) {
              const v = score(best.dx + dx, best.dy + dy, s, t);
              if (v > best.v) best = { dx: best.dx + dx, dy: best.dy + dy, s, t, v };
            }
    // Over a busy ground of blossom the picture's petal does not stand out; the plate's is kept.
    if (best.v < 0.35) best = { dx: 0, dy: 0, s: 0.95, t: 0, v: best.v };
    // The moved island's moments give the petal's angle and size.
    const { dx, dy, s, t } = best;
    const moved = pixels.map((p): [number, number, number] => {
      const u = (p % w) + 0.5 - cx;
      const v = Math.floor(p / w) + 0.5 - cy;
      return [s * (u * Math.cos(t) - v * Math.sin(t)), s * (u * Math.sin(t) + v * Math.cos(t)), alpha[p]];
    });
    const { angle, length, width } = placeByMoments(moved, PETAL.outline);
    const petal: Petal = { at: [r(cx + dx), r(cy + dy)], angle: r(angle, 1), length: r(length), width: r(width), color: "", blur: 0 };
    // Color: the median of the picture inside the petal, away from its edge.
    const inner = spriteFootprint(PETAL, { ...petal, length: length * 0.6, width: width * 0.6 }, w, h);
    const channels: number[][] = [[], [], []];
    for (let p = 0; p < w * h; p++) if (inner[p]) channels.forEach((c, i) => c.push(full.data[p * 4 + i]));
    petal.color = hex(channels.map((c) => c.sort((a, b) => a - b)[c.length >> 1] ?? 240));
    // Larger petals lie nearer the lens and are softer.
    petal.blur = r(Math.max(0, Math.min(1.2, (length - 30) / 50)), 2);
    out.push(petal);
    console.error(`${String(k).padStart(2)} moved ${dx},${dy} scaled ${s} turned ${r((t * 180) / Math.PI)} correlation ${best.v.toFixed(2)}`);
  });
  return out;
}

if (import.meta.main) {
  const petals = fitPetals(readPng(fileURLToPath(FORWARD)), readPng(fileURLToPath(REFERENCE)));
  for (const p of petals) console.log(`  ${JSON.stringify(p).replace(/"(\w+)":/g, "$1: ").replace(/,(?=\w)/g, ", ")},`);
  console.error(`${petals.length} petals`);
}
