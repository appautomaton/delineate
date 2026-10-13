// The fields the engraving is drawn from. Pixels enter only here, and only as fields: his
// silhouette, and the tone of his plate blurred until its lines vanish. The lines themselves are
// laid by the line family (see scene.ts) and never read off the plate.

import { rgbToLab } from "../../../harness/trace/color.ts";
import type { Raster } from "../../../harness/trace/image.ts";
import { type Point, distance } from "../../../harness/trace/polygon.ts";
import { type Field, GAIN, blur, luminance, rgb, smoothstep, waves } from "../engrave.ts";
import { COLLAR_WINGS, FACE, FINE, TINT, FINEST, FULLEST, HEAD, INK, NECK, PAPER, RIPPLE, SHADE, SHIRT, SKIN, SPACING, WANDER } from "./scene.ts";

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
const FOLDS = 0.42; // how far a fold's tone is pushed from its surroundings
export function tone(plate: Raster): { dark: Field; alpha: Field; art: Field; mass: Field; light: Field; tint: Field } {
  const { width: w, height: h, data } = plate;
  const [paper, ink] = [luminance(...rgb(PAPER)), luminance(...rgb(INK))];
  const alpha = Float32Array.from({ length: w * h }, (_, p) => data[p * 4 + 3] / 255);
  const L = Float32Array.from({ length: w * h }, (_, p) => (alpha[p] > 0.5 ? rgbToLab(data[p * 4], data[p * 4 + 1], data[p * 4 + 2])[0] : 0.93));
  const inked = Float32Array.from({ length: w * h }, (_, p) => (paper - luminance(data[p * 4], data[p * 4 + 1], data[p * 4 + 2])) / (paper - ink));
  const near = blur(inked, alpha, w, h, 0.9 * SPACING);
  const { hair, face, neck, shirt, wings } = headFields(w, h);
  const light = Float32Array.from({ length: w * h }, (_, p) => Math.max(face[p], hair[p], neck[p], shirt[p]));
  // The neck's shadow is the plate's waves, not line art: the neck is light only in register,
  // save where the collarbones are drawn as line art at its base. Filter out faint horizontal
  // shading waves (which have vertical contrast but negligible horizontal contrast `depthX`) so
  // they do not double-expose as crumbly line-art islands on the nose, throat, or shirt.
  const { line, depth, depthX } = lineField(L, w, h, REACH, CONTRAST, true);
  const feature = (p: number) => {
    const x = p % w;
    const y = Math.floor(p / w);
    if (hair[p] > 0.5 || face[p] > 0.05) return depth[p] > 0.145 || L[p] < MASS || (depthX[p] > 0.065 && depth[p] > 0.095) || hair[p] > 0.5;
    if (neck[p] > 0.5 && (y < 412 || (x > 600 && x < 655 && y < 442))) return false;
    if (shirt[p] > 0.5 && x < 578 && y > 395 && y < 520) return false;
    return depth[p] > 0.145 || L[p] < MASS || (depthX[p] > 0.065 && depth[p] > 0.095);
  };
  const art = Float32Array.from(L, (v, p) =>
    light[p] > 0.5 && feature(p) && alpha[p] > 0.5
      ? (neck[p] > 0.5 && face[p] < 0.05) || shirt[p] > 0.5
        ? line[p]
        : Math.max(line[p], MASS - v)
      : -1,
  );
  // The darkest of it, the masses (the blue lock, pupils, the jawline, the shadow under a lock), apart.
  const mass = Float32Array.from(L, (v, p) => (light[p] > 0.5 && (neck[p] < 0.5 || face[p] > 0.05) && shirt[p] < 0.5 && alpha[p] > 0.5 ? MASS - v : -1));
  // Keep dark leather collar, hair locks, and the jawline stroke itself from blurring into the skin or white shirt.
  const cleanWeight = Float32Array.from(alpha, (a, p) => {
    if (light[p] < 0.5 || hair[p] > 0.5 || depth[p] > CONTRAST || inked[p] > 0.45) return 0;
    return a;
  });
  const clean = blur(inked, cleanWeight, w, h, 0.8 * SPACING);
  // Where he is dark, the folds are lifted from their surroundings, as an engraver opens the lines
  // along a fold's light to model it. On his neck, the cast shadow under the chin and the gentle
  // skin tone below are modeled directly from the jaw's V-contour so dark hair and collar outlines
  // on the left and right never bleed in as horizontal bars.
  const broad = blur(near, alpha, w, h, 2 * SPACING);
  const neckTone = (p: number) => {
    const x = p % w;
    const y = Math.floor(p / w);
    const yJaw = x < 625 ? 389 - (625 - x) * 0.43 : 389 - (x - 625) * 0.68;
    const dy = y - yJaw;
    const u = Math.max(0, 1 - ((x - 630) / 46) ** 2);
    const span = 25 * u * Math.sqrt(u);
    const cast = span > 1 && dy >= -2 && dy < span ? 0.35 * (1 - Math.max(0, dy) / span) : 0;
    const skin = (0.084 + 0.048 * smoothstep(508, 365, y)) * (0.86 + 0.14 * smoothstep(690, 575, x));
    return Math.max(cast, skin);
  };
  const dark = near.map((v, p) => {
    const skin = neck[p] > 0.5 && face[p] < 0.5 ? neckTone(p) : Math.max(clean[p] * (1 - 0.35 * face[p] - 0.55 * shirt[p]), SKIN * face[p]);
    return (skin * (1 - wings[p]) * light[p] + Math.max(0, v + FOLDS * (v - broad[p])) * (1 - light[p])) * (1 - hair[p]);
  });
  // Where the lines are a tint: wherever he is light (face, sunlit neck, shirt), save in the deep
  // cast shadow directly under his jaw where the lines are dark enough to need the ink itself.
  const tint = Float32Array.from(light, (v, p) => (v > 0.5 ? smoothstep(1.15, 0.85, dark[p] / (FINE * TINT)) : 0));
  const field = (d: Float32Array) => ({ width: w, height: h, data: d });
  return { dark: field(dark), alpha: field(alpha), art: field(art), mass: field(mass), light: field(light), tint: field(tint) };
}

// The lines in a lightness field, as a field positive on a line: dark lines (a black top-hat), or
// light ones. A line is as wide as it stands out by more than half its own depth, so a fine line
// stays fine; one shallower than `contrast` is no line. `depth` is how far each pixel stands out.
export function lineField(
  L: Float32Array,
  w: number,
  h: number,
  reach: number,
  contrast: number,
  dark: boolean,
): { line: Float32Array; depth: Float32Array; depthX: Float32Array } {
  const [first, then] = dark ? [Math.max, Math.min] : [Math.min, Math.max];
  const around = extreme(extreme(L, w, h, reach, first), w, h, reach, then);
  const aroundX = extremeRow(extremeRow(L, w, h, reach, first), w, h, reach, then);
  const depth = Float32Array.from(L, (v, p) => (dark ? around[p] - v : v - around[p]));
  const depthX = Float32Array.from(L, (v, p) => (dark ? aroundX[p] - v : v - aroundX[p]));
  const peak = extreme(depth, w, h, 2, Math.max);
  return { line: Float32Array.from(depth, (d, p) => Math.min(d - 0.5 * peak[p], peak[p] - contrast)), depth, depthX };
}

function extremeRow(src: Float32Array, w: number, h: number, r: number, pick: (...v: number[]) => number): Float32Array {
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = src[y * w + x];
      for (let d = -r; d <= r; d++) v = pick(v, src[y * w + Math.min(w - 1, Math.max(0, x + d))]);
      out[y * w + x] = v;
    }
  return out;
}

// The largest (or smallest) value within `r` pixels, over a square, by rows and then columns.
function extreme(src: Float32Array, w: number, h: number, r: number, pick: (...v: number[]) => number): Float32Array {
  const tmp = extremeRow(src, w, h, r, pick);
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = tmp[y * w + x];
      for (let d = -r; d <= r; d++) v = pick(v, tmp[Math.min(h - 1, Math.max(0, y + d)) * w + x]);
      out[y * w + x] = v;
    }
  return out;
}

// 1 in his hair, face, neck, shirt, and white collar wings, 0 elsewhere, easing over a pixel at their edges.
function headFields(w: number, h: number): { hair: Float32Array; face: Float32Array; neck: Float32Array; shirt: Float32Array; wings: Float32Array } {
  const ease = (d: number) => Math.min(1, Math.max(0, d / 1.4 + 0.5));
  // Over the outline's own box, the eased signed distance `of` gives at each pixel.
  const over = (outline: Point[], of: (x: number, y: number) => number) => {
    const out = new Float32Array(w * h);
    const [x0, y0] = [Math.min(...outline.map((p) => p[0])) - 4, Math.min(...outline.map((p) => p[1])) - 4];
    const [x1, y1] = [Math.max(...outline.map((p) => p[0])) + 4, Math.max(...outline.map((p) => p[1])) + 4];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) out[y * w + x] = Math.max(out[y * w + x], ease(of(x + 0.5, y + 0.5)));
    return out;
  };
  const wings = new Float32Array(w * h);
  for (const wing of COLLAR_WINGS) {
    const part = over(wing, (x, y) => distance(wing, x, y));
    for (let i = 0; i < wings.length; i++) wings[i] = Math.max(wings[i], part[i]);
  }
  return {
    hair: over(HEAD, (x, y) => Math.min(distance(HEAD, x, y), -distance(FACE, x, y))),
    face: over(FACE, (x, y) => distance(FACE, x, y)),
    neck: over(NECK, (x, y) => distance(NECK, x, y)),
    shirt: over(SHIRT, (x, y) => distance(SHIRT, x, y)),
    wings,
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
