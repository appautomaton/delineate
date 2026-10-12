// The sky: the whole frame, behind everything.
//
// The grammar, read off its plate (wav-sky.png) at 3.5x: one family of level wavy lines about 6 px
// apart, more deeply waved than on him (a crest every 30 to 50 px, two or three px high, neighbors
// rising and falling together) and wandering slowly. The blue sky is lines and paper in about equal
// measure, the paper between them cut into slivers; toward a cloud the lines thin, pale to a gray
// green, and break into short dashes, and in its light they stop, leaving paper. No outlines: a
// cloud is only where the lines give out.
// Kept: all of it. The tone is read as a field; every line is laid by the family. Where the sky
// shows in the whole (no other plate covers it), the tone is the whole's, not the sky plate's: the
// plate was engraved apart, and its clouds lie elsewhere and darker. Hidden, it is the plate's.

import { fileURLToPath } from "node:url";
import { readPng } from "../../../harness/trace/image.ts";
import { type Box, type Field, GAIN, blur, ink, luminance, placed, rgb, sample, shapes, smoothstep, waves } from "../engrave.ts";
import { FRAMES, PAPER, REFERENCES, SIZE, SPACING, STREET_INK, run } from "../sheet.ts";

const PLATE = new URL("wav-sky.png", REFERENCES);
const WHOLE = new URL("wavy-eng-full.png", REFERENCES);
const FRONT = ["wav-building.png", "wav-tree.png", "wav-ground.png"];
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

// Where something stands in front of the sky in the whole: the other street plates, and him
// brought into the whole's frame.
function covered(): Float32Array {
  const out = new Float32Array(SIZE * SIZE);
  for (const name of FRONT) {
    const { data } = readPng(fileURLToPath(new URL(name, REFERENCES)));
    for (let p = 0; p < SIZE * SIZE; p++) out[p] = Math.max(out[p], data[p * 4 + 3] / 255);
  }
  const him = readPng(fileURLToPath(new URL("wav-subject.png", REFERENCES)));
  const [a, b, c, d, e, f] = FRAMES.subject;
  const det = a * e - b * d;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const u = Math.round((e * (x - c) - b * (y - f)) / det);
      const v = Math.round((a * (y - f) - d * (x - c)) / det);
      if (u >= 0 && v >= 0 && u < him.width && v < him.height) out[y * SIZE + x] = Math.max(out[y * SIZE + x], him.data[(v * him.width + u) * 4 + 3] / 255);
    }
  return out;
}

function tone(): Field {
  const [sky, whole] = [readPng(fileURLToPath(PLATE)), readPng(fileURLToPath(WHOLE))];
  const front = covered();
  const [p, i] = [luminance(...rgb(PAPER)), luminance(...rgb(STREET_INK))];
  const share = (data: Uint8Array | Uint8ClampedArray, q: number) => (p - luminance(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])) / (p - i);
  const value = Float32Array.from({ length: SIZE * SIZE }, (_, q) => (front[q] < 0.5 ? share(whole.data, q) : share(sky.data, q)));
  return { width: SIZE, height: SIZE, data: blur(value, new Float32Array(SIZE * SIZE).fill(1), SIZE, SIZE, 0.9 * SPACING) };
}

export async function draw(): Promise<string> {
  const dark = tone();
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
