// Line screen on navy: the engraving's engine turned upright. Straight vertical cream lines, each
// as wide as the light asks (matched in linear light between the navy and the cream), so the figure
// reads by the lines' width alone; behind it, a fine guilloché of concentric circles in a navy a
// shade lighter, stopped short of the figure, as on a banknote.
//
// The engine lays level lines and breaks them along x; an upright family is laid in the transposed
// frame, where it is level, and turned back.
import { ink, inked, luminance, over, rgb, sample, shapes, type Box, type Field } from "../../portraits/pieces/wavy-line-engraving/engrave.ts";
import { HANDS } from "../motifs.js";
import { reframe, type Fields } from "./fields.ts";
import { asRaster, light, occlusion } from "./light.ts";
import { findLines, strokes } from "./lines.ts";

const NAVY = HANDS.screen.ground;
const CREAM = "#EFE3C8";
const GROUND = "#34489F"; // the guilloché's navy, a shade lighter
const SPACING = 3.2;
const RING = 4.8; // the guilloché's pitch
const FULLEST = 0.55; // the most cream a line may take: lights stay lines
const HAIR = 0.25; // the thinnest line kept, in the figure's darks
// Antialiasing blends in sRGB, which thins a light line on a dark ground; given back here.
const GAIN = 0.1;
const K = 3;
// Light is given as the cream's share of the ground, read in linear light. On a dark ground a
// faithful match would close the lit side into solid cream; the screen keeps its lines apart
// instead: full light is LIGHTEST of the cream, and the half-tones fall away faster (CURVE), so the
// lit marble glows and the shade holds only hairlines.
const LIGHTEST = 0.92;
const CURVE = 2.2;
// On a dark ground the shade side is lost in the ground, so the light is turned half toward the
// viewer: the key light, mixed with a frontal light that falls away to the outline, so every limb
// reads as a lit volume rounding off into the navy. Where a form passes behind another it is
// deepened by DEEPEN.
const FRONT = 0.35;
const DEEPEN = 0.8;

const transpose = (f: Field): Field => {
  const out = new Float32Array(f.data.length);
  for (let y = 0; y < f.height; y++) for (let x = 0; x < f.width; x++) out[x * f.height + y] = f.data[y * f.width + x];
  return { width: f.height, height: f.width, data: out };
};

export function screen(fields: Fields, title: string): string {
  const { frame, source } = fields;
  const [W, H] = [frame.width, frame.height];
  const [navy, cream] = [luminance(...rgb(NAVY)), luminance(...rgb(CREAM))];
  const key = light(fields);
  const behind = occlusion(source, 9 / frame.scale);
  const v = key.map((k, p) => ((1 - FRONT) * k + FRONT * Math.max(0, source.normal[2].data[p]) ** 2) * (1 - DEEPEN * behind[p]));
  const lit = asRaster(source, v, (v) => navy + (0.02 + (LIGHTEST - 0.02) * v ** CURVE) * (cream - navy));
  const { dark: share0, alpha: alpha0 } = inked(lit, NAVY, CREAM, (1.1 * SPACING) / frame.scale);
  const share = reframe(share0, frame);
  const alpha = reframe(alpha0, frame);

  // In the transposed frame (x' = y, y' = x), where the lines are level.
  const shareT = transpose(share);
  const alphaT = transpose(alpha);
  const width = (x: number, y: number) => Math.max(HAIR, Math.min(FULLEST, sample(shareT, x, y)) * SPACING + GAIN);
  const boxT: Box = [0, 0, H, W];
  const fieldT = ink(width, { level: (_x, y) => y, spacing: SPACING, cut: { paper: false, ink: false } }, alphaT, boxT, K);
  const lines = shapes(transpose(fieldT), K, 0.2, 0.3);

  // The figure's outline, for the ground to stop at.
  const outline = shapes(over([0, 0, W, H], 1, (x, y) => sample(alpha, x, y) - 0.5), 1, 0.3, 20);
  const [cx, cy] = [W / 2, H * 0.47];
  const reach = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
  const rings: string[] = [];
  for (let r = RING; r < reach; r += RING) rings.push(`<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}"/>`);

  // Gaps of navy through the cream where one form passes in front of another, and along the
  // features (a band's edge, an eye, the gaps between fingers): the screen's own way of drawing a line.
  const gaps = strokes(findLines(fields).filter((l) => l.kind !== "silhouette"), (_f, s, kind) => {
    if (kind === "occlusion") return 1.4 + 1.2 * s;
    if (kind === "feature") return 0.8 + 0.9 * s;
    if (kind === "form") return 0.6 + 0.6 * s;
    return 0.8;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>${title}, a line screen on navy</title>
<rect width="${W}" height="${H}" fill="${NAVY}"/>
<g fill="none" stroke="${GROUND}" stroke-width="1.3">${rings.join("")}</g>
<path fill="${NAVY}" stroke="${NAVY}" stroke-width="5" stroke-linejoin="round" d="${outline}"/>
<path fill="${CREAM}" transform="scale(${1 / K})" d="${lines}"/>
<path fill="${NAVY}" transform="scale(.25)" d="${gaps}"/>
</svg>`;
}
