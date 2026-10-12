// The fields the engraving is drawn from. Pixels enter only here, and only as fields: his
// silhouette, and the tone of his plate blurred until its lines vanish. The lines themselves are
// laid by the line family (see scene.ts) and never read off the plate.

import { rgbToLab } from "../../../harness/trace/color.ts";
import type { Raster } from "../../../harness/trace/image.ts";
import { type Point, distance } from "../../../harness/trace/polygon.ts";
import { type Field, GAIN, blur, luminance, rgb, smoothstep, waves } from "../engrave.ts";
import { FACE, FINE, TINT, FINEST, FULLEST, HEAD, INK, NECK, PAPER, RIPPLE, SHADE, SKIN, SPACING, WANDER } from "./scene.ts";

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
  // Where the lines are a tint: wherever he is light, but not in a shadow deeper than a tint can
  // hold (the shirt's folds into the collar), where they are the ink's own; and never on his neck,
  // whose lines the plate draws fine and in ink throughout, close under his jaw, sparse below.
  const tint = Float32Array.from(light, (v, p) => v * (1 - neck[p]) * smoothstep(1.3, 0.9, dark[p] / (FINE * TINT)));
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

// The line family, as the plate lays it (see engrave.ts).
export const level = waves({ ripple: RIPPLE, wander: WANDER, seed: 7 });

// A line's width for a darkness: its share of the spacing is the share of paper the ink must cover
// (see tone), so seen from afar the drawing gives the plate's light, up to FULLEST. Where light
// thins a line below half the finest, it stops; as the tone fades toward that, the line tapers to it.
// Where he is light (skin, shirt), lines keep to a finer register (FINE at most in a tint, SHADE in
// ink where the shadow is too deep for a tint), so a shadow there stays delicate rather than
// turning to the jacket's weight.
//
// Where he is light, the plate's lines are a pale tint of its ink, not the ink itself: there ours
// are drawn at TINT opacity (see build.ts), and widened by as much, so the tone stays the same.
export function width_(dark: number, light: number, tinted: boolean): number {
  const most = tinted ? FINE : FULLEST + (SHADE - FULLEST) * light;
  const width = Math.min(most, Math.max(0, tinted ? dark / TINT : dark)) * SPACING - GAIN;
  return width < FINEST / 2 ? 0 : width;
}
