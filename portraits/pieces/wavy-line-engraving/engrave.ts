// The engraving's one way of laying tone, shared by every layer: a family of near-level wavy lines,
// each as wide as the darkness under it asks, the paper between them cut into tapered slivers where
// it is dark. Pixels enter only as fields (a plate's tone, blurred past its lines); the lines
// themselves are laid by the family and never read off a plate.

import { contours } from "../../harness/trace/contour.ts";
import { fitRing, pathData } from "../../harness/trace/bezier.ts";
import type { Raster } from "../../harness/trace/image.ts";

export type Field = { width: number; height: number; data: Float32Array };
export type Box = [number, number, number, number];

export const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// A Gaussian blur, as three box blurs (Kovesi 2010), weighted by `weight` so that what lies outside
// it (the transparent paper round a layer) does not wash its edges out.
export function blur(values: Float32Array, weight: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const box = (src: Float32Array, r: number) => {
    const tmp = new Float32Array(src.length);
    const out = new Float32Array(src.length);
    for (let y = 0; y < h; y++) {
      let s = 0;
      for (let x = -r; x <= r; x++) s += src[y * w + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        tmp[y * w + x] = s / (2 * r + 1);
        s += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = s / (2 * r + 1);
        s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
    return out;
  };
  const r = Math.max(1, Math.round(Math.sqrt((12 * sigma * sigma) / 3 + 1) / 2 - 0.5));
  let num = Float32Array.from(values, (v, p) => v * weight[p]);
  let den = Float32Array.from(weight);
  for (let k = 0; k < 3; k++) [num, den] = [box(num, r), box(den, r)];
  return num.map((v, p) => (den[p] > 1e-4 ? v / den[p] : 0));
}

// A field sampled between its pixels, by bilinear interpolation; (x, y) in pixels, centers at +0.5.
export function sample({ width: w, height: h, data }: Field, x: number, y: number): number {
  const fx = Math.min(w - 1, Math.max(0, x - 0.5));
  const fy = Math.min(h - 1, Math.max(0, y - 0.5));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  return (data[y0 * w + x0] * (1 - tx) + data[y0 * w + x1] * tx) * (1 - ty) + (data[y1 * w + x0] * (1 - tx) + data[y1 * w + x1] * tx) * ty;
}

// Light as the eye averages it: linear luminance of an sRGB color.
const linear = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const luminance = (r: number, g: number, b: number) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
export const rgb = (hex: string) => hex.match(/\w\w/g)!.map((c) => parseInt(c, 16)) as [number, number, number];

// How much of a plate's paper our ink must cover to give, seen from afar, the light the plate gives
// between our paper and our ink: per pixel, then blurred past the plate's lines (weighted by its
// opacity, so transparent paper round it does not count); and how opaque the plate is.
export function inked(plate: Raster, paper: string, ink: string, sigma: number): { dark: Field; alpha: Field } {
  const { width: w, height: h, data } = plate;
  const [p, i] = [luminance(...rgb(paper)), luminance(...rgb(ink))];
  const alpha = Float32Array.from({ length: w * h }, (_, q) => data[q * 4 + 3] / 255);
  const share = Float32Array.from({ length: w * h }, (_, q) => (p - luminance(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])) / (p - i));
  return { dark: { width: w, height: h, data: blur(share, alpha, w, h, sigma) }, alpha: { width: w, height: h, data: alpha } };
}

// The line family's level: lines lie where it is a whole number of spacings. Level lines, every
// one, as the plates have them: rippled, and wandering by a few slow waves (seeded, so every build
// lays the same lines). Form is carried by width and edges, never by turning lines.
export type Waves = { ripple: { amplitude: number; wavelength: number }; wander: { amplitude: number; scale: number }[]; seed: number };
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function waves({ ripple: { amplitude, wavelength }, wander, seed }: Waves): (x: number, y: number) => number {
  const random = seeded(seed);
  const slow = wander.flatMap(({ amplitude: a, scale }) =>
    [0, 1, 2].map(() => {
      const turn = random() * Math.PI;
      const k = (2 * Math.PI) / scale;
      return { a: a / Math.sqrt(3), kx: k * Math.cos(turn), ky: k * Math.sin(turn), phase: random() * 2 * Math.PI };
    }),
  );
  const ripple = (2 * Math.PI) / wavelength;
  // Slow fields that vary the ripple: its phase, so crests neither stand in columns nor repeat along
  // a line, and its height, so some stretches run nearly flat, as a graver's hand does.
  const drift = [0, 1, 2].map(() => ({ kx: (random() - 0.5) * 0.08, ky: (random() - 0.5) * 0.05, phase: random() * 2 * Math.PI }));
  return (x, y) => {
    let v = y;
    for (const { a, kx, ky, phase } of slow) v += a * Math.sin(kx * x + ky * y + phase);
    let turn = 0;
    for (const d of drift) turn += 1.4 * Math.sin(d.kx * x + d.ky * y + d.phase);
    const height = 0.65 + 0.35 * Math.sin(0.021 * x - 0.017 * y + turn / 2);
    return v + amplitude * height * Math.sin(ripple * x + turn);
  };
}

// A line drawn comes out GAIN wider than it is set, as a printed dot does: measured on a dark
// stretch, gaps set at 0.82 px rendered at 0.34. The gain is taken off every line, so tone is true.
export const GAIN = 0.48;

// The paper in a gap where it is dark, as the plates cut it: not one thread but long slivers, each
// opening from a point over TAPER px to about `peak` px across, running on, and closing to a point
// again, `cell` px long or a little less and a few pixels apart along the gap, staggered from gap
// to gap; each a little wider or narrower than the next, and a little above or below it, as a
// graver's are. `mean` is how wide the tone asks the gap to be on average. Returns how open gap
// `n` is at `x`, and how far its middle is moved. Slivers lengthen with the paper asked for until
// they run end to end; past that, they widen. Where it is light, a line breaks into dashes the
// same way (see ink).
export type Cut = { peak: number; cell: [number, number] };
const PAPER_CUT: Cut = { peak: 0.9, cell: [40, 80] };
const INK_CUT: Cut = { peak: 1.4, cell: [20, 50] };
const TAPER = 6;
const hash = (n: number, k: number) => {
  let s = Math.imul(n * 7919 + k * 104729, 0x9e3779b1);
  s = Math.imul(s ^ (s >>> 15), 0x85ebca6b);
  return ((s ^ (s >>> 13)) >>> 0) / 4294967296;
};
function slivers(n: number, x: number, mean: number, { peak, cell: [shortest, longest] }: Cut): [number, number] {
  const cell = shortest + (longest - shortest) * hash(n, 1);
  const s = (x + cell * hash(n, 2)) / cell;
  const j = Math.floor(s);
  const share = Math.min(0.95, mean / peak) * (0.92 + 0.08 * hash(n, 5000 + j));
  const along = (s - j - (1 - share) * hash(n, 3 + j)) * cell;
  const length = share * cell;
  if (along <= 0 || along >= length) return [0, 0];
  const tau = Math.min(0.5, TAPER / length);
  const body = 1 - 2 * tau + (2 * tau) / 1.7; // the profile's mean
  const profile = Math.min(1, along / (tau * length), (length - along) / (tau * length)) ** 0.7;
  const swell = 0.8 + 0.4 * hash(n, 9000 + j);
  return [((swell * mean) / (share * body)) * profile, 0.9 * (hash(n, 7000 + j) - 0.5)];
}

// The ink: positive where a line's ink lies, over a box of the frame sampled `k` times per pixel.
// A line's ink reaches half its width either side of it, the width (in pixels) given at each point
// by `width`; the distance to the line is measured across it, so a sloping stretch is no thicker
// than a level one. `inside`, if given, cuts the lines cleanly along a smooth edge (a silhouette).
// `cut` says where the line is broken: the paper between lines where it is dark (as on his
// jacket), and the lines themselves where it is light, into tapered dashes (as at a cloud's edge):
// `ink` is true, or the share of the spacing below which a line breaks (true: 0.3).
export function ink(
  width: (x: number, y: number) => number,
  { level, spacing, cut = { paper: true, ink: false } }: { level: (x: number, y: number) => number; spacing: number; cut?: { paper: boolean; ink: boolean | number } },
  inside: Field | null,
  [x0, y0, x1, y1]: Box,
  k: number,
): Field {
  const cols = (x1 - x0) * k;
  const rows = (y1 - y0) * k;
  const at = (gx: number, gy: number) => [x0 + (gx + 0.5) / k, y0 + (gy + 0.5) / k];
  const F = new Float32Array((cols + 2) * (rows + 2));
  for (let gy = -1; gy <= rows; gy++)
    for (let gx = -1; gx <= cols; gx++) {
      const [x, y] = at(gx, gy);
      F[(gy + 1) * (cols + 2) + gx + 1] = level(x, y);
    }
  const out = new Float32Array(cols * rows);
  for (let gy = 0; gy < rows; gy++)
    for (let gx = 0; gx < cols; gx++) {
      const [x, y] = at(gx, gy);
      const i = (gy + 1) * (cols + 2) + gx + 1;
      const fx = ((F[i + 1] - F[i - 1]) * k) / 2;
      const fy = ((F[i + cols + 2] - F[i - cols - 2]) * k) / 2;
      // Where the lines draw together or apart, their width follows, so the tone stays even.
      const u = F[i] / spacing;
      const g = Math.hypot(fx, fy);
      let w = width(x, y);
      // In the light, a line breaks into dashes (see slivers), the same ink on average.
      const below = cut.ink === true ? 0.3 : cut.ink || 0;
      const dashes = below ? smoothstep(below, below / 3, w / spacing) : 0;
      if (dashes > 0) w = (1 - dashes) * w + dashes * slivers(Math.floor(u) + 50000, x, w, INK_CUT)[0];
      // In the dark, the paper between two lines is cut in slivers, the same paper on average; in
      // the light, it is one unbroken thread. The gap is the one centered nearest.
      const gap = spacing - w;
      const strokes = cut.paper ? smoothstep(0.4, 0.7, w / spacing) : 0;
      const [opening, moved] = strokes > 0 ? slivers(Math.round(u), x, gap, PAPER_CUT) : [gap, 0];
      const open = (1 - strokes) * gap + strokes * opening;
      const line = (Math.abs(spacing * (u - Math.round(u)) - strokes * moved) - open / 2) / g;
      out[gy * cols + gx] = inside ? Math.min(line, (sample(inside, x, y) - 0.5) * 2) : line;
    }
  return { width: cols, height: rows, data: out };
}

// A field's positive region as one path, traced at `k` samples per pixel, in the field's own units.
export function shapes(field: Field, k: number, tolerance: number, minArea: number): string {
  const rings = contours(field.data, field.width, field.height, minArea * k * k);
  return pathData(rings.map((r) => fitRing(r, { tolerance: tolerance * k, step: k / 2 })));
}

// Over a box of the frame at k samples per pixel: f(x, y) in frame pixels.
export function over([x0, y0, x1, y1]: Box, k: number, f: (x: number, y: number) => number): Field {
  const width = (x1 - x0) * k;
  const height = (y1 - y0) * k;
  const data = new Float32Array(width * height);
  for (let gy = 0; gy < height; gy++) for (let gx = 0; gx < width; gx++) data[gy * width + gx] = f(x0 + (gx + 0.5) / k, y0 + (gy + 0.5) / k);
  return { width, height, data };
}

// A path traced over a box at k samples per pixel, placed back in the frame.
export const placed = ([x0, y0]: Box, d: string, k: number, fill: string, extra = "") =>
  `<path fill="${fill}"${extra} transform="translate(${x0} ${y0}) scale(${1 / k})" d="${d}"/>`;

// Where a field is above `at`, with a margin, clipped to the frame.
export function extent({ width: w, height: h, data }: Field, at = 0.5, margin = 4): Box {
  let [x0, y0, x1, y1] = [w, h, 0, 0];
  data.forEach((a, p) => {
    if (a < at) return;
    const [x, y] = [p % w, Math.floor(p / w)];
    [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x + 1), Math.max(y1, y + 1)];
  });
  return [Math.max(0, x0 - margin), Math.max(0, y0 - margin), Math.min(w, x1 + margin), Math.min(h, y1 + margin)];
}
