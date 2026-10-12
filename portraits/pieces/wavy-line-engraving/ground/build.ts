// The ground: the paved plaza he stands on, from the horizon to the frame's foot. What stands on it
// (the railing, planters, wall and steps) is the trees' layer's, printed over it.
//
// The grammar, read off its plate (wav-ground.png) at 1.6x to 3x:
// - Marks: the same level wavy lines as the sky's, drawn closer toward the horizon (about 3.5 px
//   apart there, 6 at the frame's foot), as a plane seen at a slant. In the sun they are fine and
//   pale, a gray green, breaking into short dashes; in the trees' dappled shadows they swell to the
//   ink and merge, the paper between them cut to slivers.
// - Form: a few thin dark joints between the slabs, straight, fanning loosely toward the horizon
//   (the plate's perspective is loose, and so is ours: each joint is read as it lies); the horizon
//   itself a fine line.
// Kept: all of it. Dropped: the stone's cracks, which do not read at the whole's scale.

import { fileURLToPath } from "node:url";
import { readPng } from "../../../harness/trace/image.ts";
import { type Box, GAIN, type Field, blur, ink, luminance, placed, rgb, sample, shapes, smoothstep, waves } from "../engrave.ts";
import { PAPER, REFERENCES, SIZE, SPACING, STREET_INK, run } from "../sheet.ts";
import { HORIZON, JOINTS, structures } from "./scene.ts";

const PLATE = new URL("wav-ground.png", REFERENCES);
const K = 3;

// Between the horizon and the frame's foot the plane recedes, its lines drawn closer by NEAR at
// the horizon than at the foot: a line's page spacing is share(y) times SPACING.
const FOOT = 1254;
const NEAR = 0.55;
const share = (y: number) => NEAR + (1 - NEAR) * Math.min(1, Math.max(0, (y - HORIZON) / (FOOT - HORIZON)));
// The level a height lies at, so that lines a SPACING apart in level lie share(y) * SPACING apart
// on the page: the integral of 1 / share.
const B = (1 - NEAR) / (FOOT - HORIZON);
const depth = (y: number) => Math.log((NEAR + B * Math.max(0, Math.min(y, FOOT) - HORIZON)) / NEAR) / B + Math.max(0, y - FOOT) + Math.min(0, y - HORIZON);
const wobble = waves({ ripple: { amplitude: 1.6, wavelength: 34 }, wander: [{ amplitude: 1.2, scale: 60 }, { amplitude: 2.5, scale: 240 }], seed: 41 });
// The waves shrink with the spacing, as the plane recedes.
const level = (x: number, y: number) => depth(y) + (wobble(x, y) - y);

// A line covers its share of the spacing in proportion to darkness, up to FULLEST; lines thinner
// than FINEST px are not drawn. In the sun, below PALE, the lines are a tint of the ink at TINT
// opacity, and widened by as much (to 0.4 of the spacing at most), so the tone holds; they break
// into dashes below 0.55 of it, as the plate's sunlit paving does.
const FULLEST = 0.9;
const FINEST = 0.2;
const PALE = 0.3;
const TINT = 0.5;

// The plate's tone, as the share of paper our ink must cover; its own horizon line is left out,
// as ours is drawn.
function tone(): Field {
  const { width: w, height: h, data } = readPng(fileURLToPath(PLATE));
  const [p, i] = [luminance(...rgb(PAPER)), luminance(...rgb(STREET_INK))];
  const alpha = Float32Array.from({ length: w * h }, (_, q) => data[q * 4 + 3] / 255);
  const value = Float32Array.from({ length: w * h }, (_, q) => {
    const y = Math.floor(q / w);
    if (Math.abs(y - HORIZON) < 3) return 0;
    return (p - luminance(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])) / (p - i);
  });
  return { width: w, height: h, data: blur(value, alpha, w, h, 0.9 * SPACING) };
}

export async function draw(): Promise<string> {
  const dark = tone();
  const pale = (x: number, y: number) => smoothstep(PALE + 0.05, PALE - 0.05, sample(dark, x, y));
  // Widths are in level units, as the ink measures across the level: page px over share(y).
  const width = (x: number, y: number) => {
    const d = Math.max(0, sample(dark, x, y));
    const w = (pale(x, y) > 0.5 ? Math.min(0.4, d / TINT) : Math.min(FULLEST, d)) * SPACING - GAIN / share(y);
    return w < FINEST / share(y) ? 0 : w;
  };
  const box: Box = [0, HORIZON, SIZE, SIZE];
  const field = ink(width, { level, spacing: SPACING, cut: { paper: true, ink: 0.55 } }, null, box, K);
  const at = (i: number): [number, number] => [box[0] + ((i % field.width) + 0.5) / K, box[1] + (Math.floor(i / field.width) + 0.5) / K];
  const part = (sign: number) => ({ ...field, data: field.data.map((v, i) => Math.min(v, sign * (pale(...at(i)) - 0.5) * 4)) });
  // Paper first, so the layers behind do not show through the paving.
  return (
    `<rect x="0" y="${HORIZON}" width="${SIZE}" height="${SIZE - HORIZON}" fill="${PAPER}"/>` +
    placed(box, shapes(part(-1), K, 0.2, 0.3), K, STREET_INK) +
    placed(box, shapes(part(1), K, 0.2, 0.3), K, STREET_INK, ` fill-opacity="${TINT}"`) +
    structures(JOINTS)
  );
}

export const title = "The paved plaza of a city street, as a wavy-line engraving";
await run(import.meta.url, { title, draw }, "ground");
