// The sky: the whole frame, behind everything.
//
// The grammar, read off its plate (wav-sky.png) at 3.5x: one family of level wavy lines about 6 px
// apart, more deeply waved than on him (a crest every 30 to 50 px, two or three px high, neighbors
// rising and falling together) and wandering slowly. The blue sky is lines and paper in about equal
// measure, the paper between them cut into slivers; toward a cloud the lines thin, pale to a gray
// green, and break into short dashes, and in its light they stop, leaving paper. No outlines: a
// cloud is only where the lines give out.
// Kept: all of it. The tone is read as a field, the whole's where the sky shows (see source in
// sheet.ts); every line is laid by the family.

import { type Box, GAIN, ink, inked, placed, sample, shapes, smoothstep, waves } from "../engrave.ts";
import { PAPER, SIZE, SPACING, STREET_INK, run, source } from "../sheet.ts";

const K = 3;
const level = waves({ ripple: { amplitude: 1.8, wavelength: 34 }, wander: [{ amplitude: 1.4, scale: 60 }, { amplitude: 3, scale: 260 }], seed: 11 });
// A line covers its share of the spacing in proportion to darkness, up to FULLEST, so even the
// sky's deepest blue keeps a thread of paper between its lines; lines thinner than FINEST px are
// not drawn. Toward the clouds, below PALE, the lines are a tint of the ink, at TINT opacity and
// widened by as much, so the tone holds.
const FULLEST = 0.8;
const FINEST = 0.1;
const PALE = 0.25;
const TINT = 0.5;

export async function draw(): Promise<string> {
  const { dark } = inked(source("sky"), PAPER, STREET_INK, 0.9 * SPACING);
  const pale = (x: number, y: number) => smoothstep(PALE + 0.05, PALE - 0.05, sample(dark, x, y));
  const width = (x: number, y: number) => {
    const d = Math.max(0, sample(dark, x, y));
    const w = (pale(x, y) > 0.5 ? Math.min(0.5, d / TINT) : Math.min(FULLEST, d)) * SPACING - GAIN;
    return w < FINEST ? 0 : w;
  };
  const box: Box = [0, 0, SIZE, SIZE];
  const field = ink(width, { level, spacing: SPACING, cut: { paper: true, ink: true } }, null, box, K);
  const part = (sign: number) => ({ ...field, data: field.data.map((v, i) => Math.min(v, sign * (pale(((i % field.width) + 0.5) / K, (Math.floor(i / field.width) + 0.5) / K) - 0.5) * 4)) });
  return placed(box, shapes(part(-1), K, 0.2, 0.3), K, STREET_INK) + "\n" + placed(box, shapes(part(1), K, 0.2, 0.3), K, STREET_INK, ` fill-opacity="${TINT}"`);
}

export const title = "The sky over a city street, as a wavy-line engraving";
await run(import.meta.url, { title, draw }, "sky");
