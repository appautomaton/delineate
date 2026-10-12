// The fields the engraving is drawn from. Pixels enter only here, and only as fields: his
// silhouette, and the tone of his plate blurred until its lines vanish. The lines themselves are
// laid by the line family (see scene.ts) and never read off the plate.

import { rgbToLab } from "../../harness/trace/color.ts";
import type { Raster } from "../../harness/trace/image.ts";
import { type Point, distance } from "../../harness/trace/polygon.ts";
import { FACE, FINE, TINT, FINEST, FULLEST, HEAD, INK, NECK, PAPER, RIPPLE, SKIN, SPACING, WANDER } from "./scene.ts";

export type Field = { width: number; height: number; data: Float32Array };

// A Gaussian blur, as three box blurs (Kovesi 2010), weighted by `weight` so that what lies outside
// it (the transparent paper around him) does not wash his edges out.
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

// How dark the plate is, as the share of paper our ink must cover to give, seen from afar, the
// light the plate gives: the eye averages light, so the match is made in linear light, between
// our paper and our ink. Blurred past the lines; and how opaque the plate is.
//
// Where he is light (his face, and wherever the plate is light all round: shirt, neck, hands) and
// in his hair, the plate's ink is line art, not tone: features, strands, folds. `art` holds it as
// a field, positive on a line: how much darker the plate is than its surroundings a few pixels
// off (a black top-hat, so a light line counts as much as a dark one), or, for masses too wide for
// that (a dark lock of hair, a pupil), how dark it is outright. The tone there is taken from the
// plate's other pixels only, so the waves do not swell around every feature. His hair carries no
// waves; it is drawn in strands.
const linear = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (r: number, g: number, b: number) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
const rgb = (hex: string) => hex.match(/\w\w/g)!.map((c) => parseInt(c, 16)) as [number, number, number];
const REACH = 3; // pixels; lines up to twice this wide are found by their contrast
const CONTRAST = 0.085; // OKLab lightness a line lies below its surroundings
const MASS = 0.38; // OKLab lightness below which ink is line art however wide
const FOLDS = 0.3; // how far a fold's tone is pushed from its surroundings
export function tone(plate: Raster): { dark: Field; alpha: Field; art: Field; mass: Field; light: Field; tint: Field } {
  const { width: w, height: h, data } = plate;
  const [paper, ink] = [luminance(...rgb(PAPER)), luminance(...rgb(INK))];
  const alpha = Float32Array.from({ length: w * h }, (_, p) => data[p * 4 + 3] / 255);
  const L = Float32Array.from({ length: w * h }, (_, p) => (alpha[p] > 0.5 ? rgbToLab(data[p * 4], data[p * 4 + 1], data[p * 4 + 2])[0] : 0.93));
  const inked = Float32Array.from({ length: w * h }, (_, p) => (paper - luminance(data[p * 4], data[p * 4 + 1], data[p * 4 + 2])) / (paper - ink));
  const wide = blur(inked, alpha, w, h, 2.5 * SPACING);
  const { hair, face, neck } = headFields(w, h);
  const light = Float32Array.from(wide, (v, p) => Math.max(face[p], hair[p], neck[p], smoothstep(0.4, 0.2, v)));
  // Where the lines are a tint: wherever he is light, his neck included.
  const tint = light;
  // The neck's shadow is the plate's waves, not line art: the neck is light only in register.
  const { line, depth } = lineField(L, w, h, REACH, CONTRAST, true);
  const art = Float32Array.from(L, (v, p) => (light[p] > 0.5 && neck[p] < 0.5 && alpha[p] > 0.5 ? Math.max(line[p], MASS - v) : -1));
  // The darkest of it, the masses (the blue lock, pupils, the shadow under a lock), apart.
  const mass = Float32Array.from(L, (v, p) => (light[p] > 0.5 && neck[p] < 0.5 && alpha[p] > 0.5 ? MASS - v : -1));
  const near = blur(inked, alpha, w, h, 0.9 * SPACING);
  const clean = blur(inked, Float32Array.from(alpha, (a, p) => (light[p] > 0.5 && neck[p] < 0.5 && depth[p] > CONTRAST ? 0 : a)), w, h, 0.6 * SPACING);
  // Where he is dark, the folds are lifted from their surroundings, as an engraver opens the lines
  // along a fold's light to model it. His face keeps the faint hairlines the plate gives it.
  const broad = blur(near, alpha, w, h, 2 * SPACING);
  const dark = near.map((v, p) => (Math.max(clean[p], SKIN * face[p]) * light[p] + Math.max(0, v + FOLDS * (v - broad[p])) * (1 - light[p])) * (1 - hair[p]));
  const field = (d: Float32Array) => ({ width: w, height: h, data: d });
  return { dark: field(dark), alpha: field(alpha), art: field(art), mass: field(mass), light: field(light), tint: field(tint) };
}

// The lines in a lightness field, as a field positive on a line: dark lines (a black top-hat), or
// light ones. A line is as wide as it stands out by more than half its own depth, so a fine line
// stays fine; one shallower than `contrast` is no line. `depth` is how far each pixel stands out.
export function lineField(L: Float32Array, w: number, h: number, reach: number, contrast: number, dark: boolean): { line: Float32Array; depth: Float32Array } {
  const [first, then] = dark ? [Math.max, Math.min] : [Math.min, Math.max];
  const around = extreme(extreme(L, w, h, reach, first), w, h, reach, then);
  const depth = Float32Array.from(L, (v, p) => (dark ? around[p] - v : v - around[p]));
  const peak = extreme(depth, w, h, 2, Math.max);
  return { line: Float32Array.from(depth, (d, p) => Math.min(d - 0.5 * peak[p], peak[p] - contrast)), depth };
}

// The jacket's structure, read off the colored original brought into the plate's frame, where the
// plate itself cannot tell it from the waves: its hardware (zips, buckles, studs), which shine,
// and its seams and edges, which shade. Each a line field, only where he is dark.
export function structure(anime: Raster, light: Field, alpha: Field): { shine: Field; seams: Field } {
  const { width: w, height: h, data } = anime;
  const L = Float32Array.from({ length: w * h }, (_, p) => rgbToLab(data[p * 4], data[p * 4 + 1], data[p * 4 + 2])[0]);
  const dark = (p: number) => light.data[p] < 0.5 && alpha.data[p] > 0.5;
  const shine = lineField(L, w, h, 3, 0.15, false).line.map((v, p) => (dark(p) ? v : -1));
  const seams = lineField(L, w, h, 2, 0.04, true).line.map((v, p) => (dark(p) ? v : -1));
  return { shine: { width: w, height: h, data: shine }, seams: { width: w, height: h, data: seams } };
}

// The largest (or smallest) value within `r` pixels, over a square, by rows and then columns.
function extreme(src: Float32Array, w: number, h: number, r: number, pick: (...v: number[]) => number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = src[y * w + x];
      for (let d = -r; d <= r; d++) v = pick(v, src[y * w + Math.min(w - 1, Math.max(0, x + d))]);
      tmp[y * w + x] = v;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = tmp[y * w + x];
      for (let d = -r; d <= r; d++) v = pick(v, tmp[Math.min(h - 1, Math.max(0, y + d)) * w + x]);
      out[y * w + x] = v;
    }
  return out;
}

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// 1 in his hair and in his face, 0 elsewhere, easing over a few pixels at their edges.
function headFields(w: number, h: number): { hair: Float32Array; face: Float32Array; neck: Float32Array } {
  const ease = (d: number) => Math.min(1, Math.max(0, d / 4 + 0.5));
  // Over the outline's own box, the eased signed distance `of` gives at each pixel.
  const over = (outline: Point[], of: (x: number, y: number) => number) => {
    const out = new Float32Array(w * h);
    const [x0, y0] = [Math.min(...outline.map((p) => p[0])) - 4, Math.min(...outline.map((p) => p[1])) - 4];
    const [x1, y1] = [Math.max(...outline.map((p) => p[0])) + 4, Math.max(...outline.map((p) => p[1])) + 4];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) out[y * w + x] = ease(of(x + 0.5, y + 0.5));
    return out;
  };
  return {
    hair: over(HEAD, (x, y) => Math.min(distance(HEAD, x, y), -distance(FACE, x, y))),
    face: over(FACE, (x, y) => distance(FACE, x, y)),
    neck: over(NECK, (x, y) => distance(NECK, x, y)),
  };
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

// The line family's level: lines lie where it is a whole number of spacings. Level lines, every
// one, as the plate has them: rippled, and wandering by a few slow waves (seeded, so every build
// lays the same lines). Form is carried by width and edges, never by turning lines.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = seeded(7);
const waves = WANDER.flatMap(({ amplitude, scale }) =>
  [0, 1, 2].map(() => {
    const turn = random() * Math.PI;
    const k = (2 * Math.PI) / scale;
    return { a: amplitude / Math.sqrt(3), kx: k * Math.cos(turn), ky: k * Math.sin(turn), phase: random() * 2 * Math.PI };
  }),
);
const ripple = (2 * Math.PI) / RIPPLE.wavelength;
// Slow fields that vary the ripple: its phase, so crests neither stand in columns nor repeat along
// a line, and its height, so some stretches run nearly flat, as a graver's hand does.
const drift = [0, 1, 2].map(() => ({ kx: (random() - 0.5) * 0.08, ky: (random() - 0.5) * 0.05, phase: random() * 2 * Math.PI }));
export function level(x: number, y: number): number {
  let v = y;
  for (const { a, kx, ky, phase } of waves) v += a * Math.sin(kx * x + ky * y + phase);
  let turn = 0;
  for (const d of drift) turn += 1.4 * Math.sin(d.kx * x + d.ky * y + d.phase);
  const height = 0.65 + 0.35 * Math.sin(0.021 * x - 0.017 * y + turn / 2);
  v += RIPPLE.amplitude * height * Math.sin(ripple * x + turn);
  return v;
}

// A line's width for a darkness: its share of the spacing is the share of paper the ink must cover
// (see tone), so seen from afar the drawing gives the plate's light, up to FULLEST. Where light
// thins a line below half the finest, it stops; as the tone fades toward that, the line tapers to it.
// Where he is light (skin, shirt), lines keep to a finer register, FINE at most, so a shadow there
// stays delicate rather than turning to the jacket's weight.
//
// A line drawn comes out GAIN wider than it is set, as a printed dot does: measured on a dark
// stretch, gaps set at 0.82 px rendered at 0.34. The gain is taken off every line, so tone is true.
const GAIN = 0.48;
//
// Where he is light, the plate's lines are a pale tint of its ink, not the ink itself: there ours
// are drawn at TINT opacity (see build.ts), and widened by as much, so the tone stays the same.
export function width_(dark: number, light: number, tinted: boolean): number {
  const most = tinted ? FINE : FULLEST + (FINE * TINT - FULLEST) * light;
  const width = Math.min(most, Math.max(0, tinted ? dark / TINT : dark)) * SPACING - GAIN;
  return width < FINEST / 2 ? 0 : width;
}

// How open the gap after line `n` is at `x`, as a multiple of its mean: closed for stretches, open
// for strokes of 10 to 40 px, each swelling from a point to its middle and back. A sum of three
// waves with phases drawn per gap, lifted and clipped, has mean near 1.
function dashes(n: number, x: number): number {
  const h = (k: number) => {
    let s = Math.imul(n * 7919 + k * 104729, 0x9e3779b1);
    s = Math.imul(s ^ (s >>> 15), 0x85ebca6b);
    return ((s ^ (s >>> 13)) >>> 0) / 4294967296;
  };
  const v = Math.sin(x / 9 + 6.28 * h(1)) + 0.7 * Math.sin(x / 4.3 + 6.28 * h(2)) + 0.5 * Math.sin(x / 17 + 6.28 * h(3));
  return Math.max(0, 0.9 + 0.95 * v);
}

// The ink: positive where a line's ink lies, over a box of the frame sampled `k` times per pixel.
// A line's ink reaches half its width either side of it, the width set by the darkness there; the
// distance to the line is measured across it, so a sloping stretch is no thicker than a level one.
// `inside` cuts the lines cleanly along a smooth edge (his silhouette).
export function ink(dark: Field, light: Field, tint: Field, inside: Field, [x0, y0, x1, y1]: number[], k: number): Field {
  const width = (x1 - x0) * k;
  const height = (y1 - y0) * k;
  const at = (gx: number, gy: number) => [x0 + (gx + 0.5) / k, y0 + (gy + 0.5) / k];
  const F = new Float32Array((width + 2) * (height + 2));
  for (let gy = -1; gy <= height; gy++)
    for (let gx = -1; gx <= width; gx++) {
      const [x, y] = at(gx, gy);
      F[(gy + 1) * (width + 2) + gx + 1] = level(x, y);
    }
  const out = new Float32Array(width * height);
  for (let gy = 0; gy < height; gy++)
    for (let gx = 0; gx < width; gx++) {
      const [x, y] = at(gx, gy);
      const i = (gy + 1) * (width + 2) + gx + 1;
      const fx = ((F[i + 1] - F[i - 1]) * k) / 2;
      const fy = ((F[i + width + 2] - F[i - width - 2]) * k) / 2;
      // Where the lines draw together or apart, their width follows, so the tone stays even.
      const u = F[i] / SPACING;
      const g = Math.hypot(fx, fy);
      const w = width_(sample(dark, x, y), sample(light, x, y), sample(tint, x, y) > 0.5);
      // In the dark, the paper between two lines is cut as the plate cuts it: short strokes that
      // taper at both ends, not one unbroken thread. Its width swells and pinches along the gap
      // by a noise of the gap's own (so neighbors do not break together), wider where open, so
      // the paper shown on average is the same.
      const gap = SPACING - w;
      const strokes = smoothstep(0.4, 0.7, w / SPACING);
      const open = gap * (1 + strokes * (dashes(Math.floor(u), x) - 1));
      const line = (SPACING / 2 - SPACING * Math.abs(u - Math.floor(u) - 0.5) - open / 2) / g;
      const edge = (sample(inside, x, y) - 0.5) * 2;
      out[gy * width + gx] = Math.min(line, edge);
    }
  return { width, height, data: out };
}
