// The leaves overhead: a branch hanging into the top left, in front of everything, him included.
//
// The grammar, read off its plate (wav-leaves.png) at 1.6x to 4.5x:
// - Marks: compound leaves of pointed leaflets, 20 to 35 px long, finely toothed toward the tip;
//   pairs along a stalk with one at its end, or a star of three to five where the stalk is short.
//   Thin twigs, a few px wide, curve between them.
// - Tone: the leaflets are solid ink, no waves; their light is their veins, a pale midrib and a
//   herringbone of short side veins slanting to the tip, drawn in paper over the ink. Leaves deep in
//   the mass show few veins; those at its edge show them all.
// - Form: the mass is densest at the top left, thins to the right, and hangs in sprays at its foot,
//   the longest reaching y 470. No outlines: a leaf is its silhouette.
// Kept: all of it. Dropped: the plate's streaks of light across the densest leaves, which read as
// noise at full size; their veins carry the light instead.
// The edge sprays and the twigs are read by eye (scene.ts); the dense middle is laid leaf by leaf
// where the plate's mass is, its tone read as a field, each leaf hanging away from the mass.

import { fileURLToPath } from "node:url";
import { readPng } from "../../../harness/trace/image.ts";
import { blur, luminance, rgb, sample } from "../engrave.ts";
import { PAPER, REFERENCES, STREET_INK, run } from "../sheet.ts";
import { drawn, strokeData } from "../subject/lines.ts";
import { type P, compound, leaflet, seeded } from "./leaf.ts";
import { SPRAYS, TWIGS } from "./scene.ts";

const PLATE = new URL("wav-leaves.png", REFERENCES);
const VEINS = 0.72; // the opacity of the paper veins: the plate's are a pale green, not white

// How much of the plate is leaf, blurred a little, and blurred far (the mass the leaves hang from).
function mass(): { near: (x: number, y: number) => number; far: (x: number, y: number) => number } {
  const plate = readPng(fileURLToPath(PLATE));
  const { width: w, height: h, data } = plate;
  const [p, i] = [luminance(...rgb(PAPER)), luminance(...rgb(STREET_INK))];
  const leaf = Float32Array.from({ length: w * h }, (_, q) => (data[q * 4 + 3] / 255) * Math.min(1, Math.max(0, (p - luminance(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])) / (p - i))));
  const ones = new Float32Array(w * h).fill(1);
  const near = { width: w, height: h, data: blur(leaf, ones, w, h, 2.5) };
  const far = { width: w, height: h, data: blur(leaf, ones, w, h, 28) };
  return { near: (x, y) => sample(near, x, y), far: (x, y) => sample(far, x, y) };
}

export async function draw(): Promise<string> {
  const random = seeded(23);
  const { near, far } = mass();
  const blades: string[] = [];
  const veins: string[] = [];

  // The dense middle: on a jittered grid, a leaflet wherever the plate is leaf all along it, hanging
  // away from the mass and down, turned a little either way until it fits; so the leaves fill the
  // plate's mass and leave its gaps open.
  const STEP = 10;
  const fits = (base: P, angle: number, length: number) =>
    [0.15, 0.5, 0.85].every((t) => near(base[0] + Math.cos(angle) * length * t, base[1] + Math.sin(angle) * length * t) > 0.55);
  for (let gy = 0; gy < 480; gy += STEP)
    for (let gx = 0; gx < 880; gx += STEP) {
      const base: P = [gx + (random() - 0.5) * STEP, gy + (random() - 0.5) * STEP];
      if (near(...base) < 0.55) continue;
      const [ex, ey] = [far(base[0] + 6, base[1]) - far(base[0] - 6, base[1]), far(base[0], base[1] + 6) - far(base[0], base[1] - 6)];
      const out = Math.hypot(ex, ey) > 1e-3 ? Math.atan2(-ey, -ex) : Math.PI / 2;
      const hang = Math.atan2(Math.sin(out) * 0.6 + 0.7, Math.cos(out) * 0.6) + (random() - 0.5) * 1.2;
      const length = 22 + 10 * random();
      const angle = [0, 0.7, -0.7, 1.4, -1.4].map((d) => hang + d).find((a) => fits(base, a, length));
      if (angle === undefined) continue;
      const leaf = leaflet(base, angle, length, random, 0.05 + 0.25 * random() * (1 - far(...base)));
      blades.push(leaf.blade);
      if (leaf.veins) veins.push(leaf.veins);
    }

  // The twigs, over the middle's leaves, thickest where they start.
  const twigs = TWIGS.map(({ points, width }) => {
    const stroke = drawn(points, width);
    const n = stroke.points.length;
    return { ...stroke, widths: stroke.points.map((_, i) => width * (1 - 0.55 * (i / Math.max(1, n - 1)))) };
  });

  // The sprays at the edge, last, so their leaves lie over the rest; their stalks with them.
  const stalks: P[][] = [];
  const front: string[] = [];
  const frontVeins: string[] = [];
  for (const spray of SPRAYS) {
    const leaf = compound(spray, random);
    front.push(...leaf.blades);
    frontVeins.push(...leaf.veins);
    stalks.push(leaf.stalk);
  }
  const stalkData = strokeData(stalks.map((s) => drawn(s, 2.2)));

  return [
    `<g id="leaves">`,
    `<path fill="${STREET_INK}" d="${blades.join("")}"/>`,
    `<path fill="${PAPER}" fill-opacity="${VEINS}" d="${veins.join("")}"/>`,
    `<path fill="${STREET_INK}" d="${strokeData(twigs)}"/>`,
    `<path fill="${STREET_INK}" d="${stalkData}"/>`,
    `<path fill="${STREET_INK}" d="${front.join("")}"/>`,
    `<path fill="${PAPER}" fill-opacity="${VEINS}" d="${frontVeins.join("")}"/>`,
    `</g>`,
  ].join("\n");
}

export const title = "A branch of leaves overhead, as a wavy-line engraving";
await run(import.meta.url, { title, draw }, "leaves");
