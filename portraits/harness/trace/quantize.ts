// A palette for a region: k-means in OKLab, seeded by k-means++ so the result is the same on
// every run. Fitting runs on a sample of the region's pixels; the palette then serves them all.

import type { Lab } from "./color.ts";

export type Planes = [Float32Array, Float32Array, Float32Array];

// A seeded source of numbers in [0, 1) (mulberry32).
function rng(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function kmeans(lab: Planes, pixels: Int32Array, k: number, { seed = 7, sample = 120_000, rounds = 16 } = {}): Lab[] {
  const random = rng(seed);
  const [L, A, B] = lab;
  const pick = pixels.length <= sample ? pixels : Int32Array.from({ length: sample }, () => pixels[Math.floor(random() * pixels.length)]);
  const n = pick.length;
  const pts = new Float32Array(n * 3);
  pick.forEach((p, i) => pts.set([L[p], A[p], B[p]], i * 3));
  const d2 = (i: number, c: Lab) => (pts[i * 3] - c[0]) ** 2 + (pts[i * 3 + 1] - c[1]) ** 2 + (pts[i * 3 + 2] - c[2]) ** 2;

  // k-means++: each new center is drawn in proportion to its squared distance from the others.
  const centers: Lab[] = [[pts[0], pts[1], pts[2]]];
  const near = new Float64Array(n).map((_, i) => d2(i, centers[0]));
  while (centers.length < Math.min(k, n)) {
    let total = 0;
    for (let i = 0; i < n; i++) total += near[i];
    let r = random() * total;
    let i = 0;
    while (i < n - 1 && (r -= near[i]) > 0) i++;
    const c: Lab = [pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]];
    centers.push(c);
    for (let j = 0; j < n; j++) near[j] = Math.min(near[j], d2(j, c));
  }

  const label = new Int32Array(n);
  for (let round = 0; round < rounds; round++) {
    const sum = new Float64Array(centers.length * 4);
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = d2(i, centers[c]);
        if (d < bestD) [best, bestD] = [c, d];
      }
      label[i] = best;
      sum[best * 4] += pts[i * 3];
      sum[best * 4 + 1] += pts[i * 3 + 1];
      sum[best * 4 + 2] += pts[i * 3 + 2];
      sum[best * 4 + 3]++;
    }
    let moved = 0;
    centers.forEach((c, j) => {
      const m = sum[j * 4 + 3];
      if (!m) return;
      const next: Lab = [sum[j * 4] / m, sum[j * 4 + 1] / m, sum[j * 4 + 2] / m];
      moved = Math.max(moved, Math.hypot(next[0] - c[0], next[1] - c[1], next[2] - c[2]));
      centers[j] = next;
    });
    if (moved < 1e-4) break;
  }
  return centers;
}

// The smallest palette, growing by half each try, whose tones lie on average within `error` of
// the pixels they stand for (OKLab distance; about 0.02 is a just noticeable step).
export function paletteFor(lab: Planes, pixels: Int32Array, { error = 0.012, min = 6, max = 96 } = {}): Lab[] {
  const [L, A, B] = lab;
  const stride = Math.max(1, Math.floor(pixels.length / 40_000));
  let k = min;
  for (;;) {
    const palette = kmeans(lab, pixels, k);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < pixels.length; i += stride) {
      const p = pixels[i];
      let best = Infinity;
      for (const c of palette) best = Math.min(best, (L[p] - c[0]) ** 2 + (A[p] - c[1]) ** 2 + (B[p] - c[2]) ** 2);
      sum += Math.sqrt(best);
      count++;
    }
    if (sum / count <= error || k >= max) return palette;
    k = Math.min(max, Math.ceil(k * 1.5));
  }
}
