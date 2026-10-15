// Engraving: one family of lines whose width carries the tone, black-brown on warm paper, with
// tapered contour lines where depth or the surface breaks.
//
// The lines are level lines lifted by depth, as if the figure were cut by level planes and seen a
// little from above: each line bows down over a form as it comes toward us, so a limb reads as a
// cylinder and the torso as a barrel, the way a medal engraving's ruled lines carry relief. The
// lift is gentle (a few line spacings over the torso), and where one form passes in front of
// another the lines shift, which the contour line there covers. Tone is the key-light render in
// linear light; nothing else of the pixels is drawn.
import { GAIN, blur, luminance, rgb, ink, inked, placed, sample, shapes, smoothstep, waves, type Box, type Field } from "../../portraits/pieces/wavy-line-engraving/engrave.ts";
import { HANDS } from "../motifs.js";
import { extend, reframe, type Fields } from "./fields.ts";
import { asRaster, light } from "./light.ts";
import { findLines, strokes, type Kind } from "./lines.ts";

const PAPER = HANDS.engraving.ground;
const INK = "#2a1d15";
const SPACING = 3.0;
const LIFT = 60; // frame pixels a line moves down per metre nearer
const FULLEST = 0.85;
const FINEST = 0.36;
const FLOOR = 0.2;
const K = 4;

export function engraving(fields: Fields, title: string): string {
  const { frame, source } = fields;
  const box: Box = [0, 0, frame.width, frame.height];
  // Matched in linear light: full light gives the paper's own luminance.
  const lit = asRaster(source, light(fields), (v) => v * luminance(...rgb(PAPER)));
  const { dark: dark0, alpha: alpha0 } = inked(lit, PAPER, INK, (0.7 * SPACING) / frame.scale);
  const dark = reframe(dark0, frame);
  const alpha = reframe(alpha0, frame);
  // Depth, smoothed a little within the figure and carried past its edge, so lines run on smoothly.
  const inside = (p: number) => source.alpha.data[p] > 0.5;
  const zs = extend(source.depth, inside, Math.round(12 / frame.scale));
  const zSoft: Field = { ...zs, data: blur(zs.data, Float32Array.from(zs.data, (_, p) => (inside(p) ? 1 : 0.02)), zs.width, zs.height, 2.5 / frame.scale) };
  // Lines may crowd where a surface turns away (the plinth's top, seen almost edge on) but never fold
  // back: down each column the lift may fall at most FOLD of a pixel per pixel.
  const z = reframe(zSoft, frame, 1);
  const FOLD = 0.6;
  // The lift is depth measured from each row's own mean, smoothed down the frame: a plane that only
  // recedes (the plinth's top) gives no lift and does not crowd the lines; a form that swells
  // across the row bows them.
  const rowMean = Array.from({ length: z.height }, (_, y) => {
    let [s, n] = [0, 0];
    for (let x = 0; x < z.width; x++) {
      const a = alpha.data[y * z.width + x];
      s += a * z.data[y * z.width + x];
      n += a;
    }
    return n > 1 ? s / n : NaN;
  });
  const known = rowMean.map((v) => !Number.isNaN(v));
  const filled = rowMean.map((v, y) => (known[y] ? v : rowMean[known.indexOf(true) > y ? known.indexOf(true) : known.lastIndexOf(true)]));
  const base = filled.map((_, y) => {
    let [s, n] = [0, 0];
    for (let d = -60; d <= 60; d++) {
      const q = Math.min(filled.length - 1, Math.max(0, y + d));
      const g = Math.exp(-(d * d) / (2 * 20 * 20));
      s += g * filled[q];
      n += g;
    }
    return s / n;
  });
  const lift = { ...z, data: z.data.map((v, p) => LIFT * (v - base[Math.floor(p / z.width)])) };
  for (let x = 0; x < lift.width; x++)
    for (let y = 1; y < lift.height; y++) {
      const p = y * lift.width + x;
      lift.data[p] = Math.max(lift.data[p], lift.data[p - lift.width] - FOLD);
    }
  const ripple = waves({ ripple: { amplitude: 0.35, wavelength: 30 }, wander: [], seed: 11 });
  const level = (x: number, y: number) => ripple(x, y) + sample(lift, x, y);

  // Tone to width: the share of paper the ink covers, eased so the deep cast shadows keep a glint
  // of paper between their lines, and the lights break into dashes before they vanish.
  const width = (x: number, y: number) => {
    const d = Math.max(0, sample(dark, x, y));
    // In the highlights a line never quite vanishes: it keeps a hairline, so the lit form is still
    // described by the lines' bowing.
    const w = Math.min(FULLEST, d) * SPACING - GAIN;
    return Math.max(FLOOR, w < FINEST / 2 ? 0 : w);
  };
  const field = ink(width, { level, spacing: SPACING, cut: { paper: true, ink: false } }, alpha, box, K);

  const lines = findLines(fields);
  const weight = (facing: number, strength: number, kind: Kind) => {
    const shade = smoothstep(-1, 0.9, facing);
    if (kind === "silhouette") return 0.5 + 1.5 * shade;
    if (kind === "occlusion") return (0.6 + 0.9 * strength) * (0.7 + 0.5 * shade);
    if (kind === "feature") return 0.55 + 0.95 * strength;
    if (kind === "form") return 0.25 + 0.5 * strength;
    return 0.5;
  };
  // Where one form passes in front of another, the engraver leaves a thread of paper beside the
  // line, so the nearer form's edge reads even in shadow.
  const inner = lines.filter((l) => l.kind !== "silhouette");
  const halo = strokes(inner, (f, s, k) => weight(f, s, k) + (k === "occlusion" ? 2.2 : 2), { taper: 18 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${frame.width} ${frame.height}" width="${frame.width}" height="${frame.height}">
<title>${title}, engraved</title>
<rect width="${frame.width}" height="${frame.height}" fill="${PAPER}"/>
${placed(box, shapes(field, K, 0.2, 0.3), K, INK)}
<path fill="${PAPER}" transform="scale(.25)" d="${halo}"/>
<path fill="${INK}" transform="scale(.25)" d="${strokes(lines, weight)}"/>
</svg>`;
}
