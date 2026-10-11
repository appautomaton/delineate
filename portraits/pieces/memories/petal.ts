// A cherry petal, drawn once and placed many times (see portraits/harness/model/sprite.ts). In its own box
// the petal lies along x: the narrow base at the left end, the broad end with its notch at the
// right, 100 long and about as wide.
//
//   node portraits/pieces/memories/petal.ts   fits the floating petals on the front plate and prints them

import { fileURLToPath } from "node:url";
import { type Placement, type Sprite, placeByMoments } from "../../harness/model/sprite.ts";
import { hex } from "../../harness/trace/color.ts";
import { type Raster, readPng } from "../../harness/trace/image.ts";

export type Petal = Placement;

export const PETAL: Sprite = {
  id: "petal",
  outline: [
    [-50, 0],
    [-25, -20],
    [-5, -50],
    [20, -48],
    [40, -46],
    [52, -30],
    [50, -16],
    [38, 0],
    [50, 16],
    [52, 30],
    [40, 46],
    [20, 48],
    [-5, 50],
    [-25, 20],
  ],
  paths: [
    '<path fill="var(--petal, #f4b9c8)" d="M-50 0C-25-20-5-50 20-48C40-46 52-30 50-16L38 0 50 16C52 30 40 46 20 48C-5 50-25 20-50 0Z"/>',
    '<path fill="#fff" opacity=".38" d="M-44 0C-30-9-12-14 4-10C-12-4-30 2-44 0Z"/>',
    '<path fill="#c2557a" opacity=".16" d="M-50 0C-36-8-26-10-18-8C-26-2-36 4-50 0Z"/>',
  ].join("\n"),
};

const r = (v: number, k = 10) => Math.round(v * k) / k;

// The floating petals on a plate where everything else is black. A petal over black is an island
// of light: its shape is read at half strength, its blur from how far apart its quarter and
// three-quarter outlines lie. A petal over other paint on the plate is an island of pink: its
// shape is the island, and its blur follows from its size, as nearer petals are both larger and
// softer. Either way its color comes from the reference.
export function findPetals(plate: Raster, reference: Raster, keep: (x: number, y: number) => boolean): Petal[] {
  const { width: w, height: h, data } = plate;
  const strength = Float32Array.from({ length: w * h }, (_, p) => Math.max(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]) / 255);
  const pink = (p: number) => data[p * 4] > 120 && data[p * 4] > data[p * 4 + 1] + 25 && data[p * 4 + 2] > data[p * 4 + 1];
  const pale = (p: number) => pink(p) || (data[p * 4] > 200 && data[p * 4 + 2] > 190 && data[p * 4 + 1] > 170);
  const out: Petal[] = [];
  const taken = new Uint8Array(w * h);

  const islands = (joins: (p: number) => boolean, seeds: (p: number) => boolean) => {
    const seen = new Uint8Array(w * h);
    const found: number[][] = [];
    for (let s = 0; s < w * h; s++) {
      if (seen[s] || taken[s] || !seeds(s)) continue;
      const island: number[] = [];
      const todo = [s];
      seen[s] = 1;
      while (todo.length) {
        const p = todo.pop()!;
        island.push(p);
        const x = p % w;
        for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w])
          if (q >= 0 && q < w * h && !seen[q] && joins(q)) {
            seen[q] = 1;
            todo.push(q);
          }
      }
      found.push(island);
    }
    return found;
  };

  const fit = (shapePixels: number[], blur: number, colorPixels: number[]) => {
    const { at, angle, length, width } = placeByMoments(
      shapePixels.map((p) => [(p % w) + 0.5, Math.floor(p / w) + 0.5, 1]),
      PETAL.outline,
    );
    if (!keep(...at)) return false;
    const rgb = [0, 1, 2].map((c) => colorPixels.map((p) => reference.data[p * 4 + c]).sort((a, b) => a - b)[colorPixels.length >> 1]);
    out.push({ at: [r(at[0]), r(at[1])], angle: r(angle, 1), length: r(length), width: r(width), color: hex(rgb), blur: r(blur, 2) });
    return true;
  };

  // Over black: islands of light that are pale pink throughout.
  for (const island of islands((q) => strength[q] >= 0.1, pink)) {
    const bright = island.filter((p) => strength[p] > 0.45);
    if (bright.filter(pale).length < bright.length * 0.85 || island.length < 40 || island.length > 9000) continue;
    const peak = Math.max(...island.map((p) => strength[p]));
    const at = (k: number) => island.filter((p) => strength[p] >= peak * k);
    const half = at(0.5);
    // For a Gaussian edge, the quarter and three-quarter outlines lie 1.35 sigma apart.
    const perimeter = half.filter((p) => [p - 1, p + 1, p - w, p + w].some((q) => strength[q] < peak * 0.5)).length;
    const blur = Math.max(0, (at(0.25).length - at(0.75).length) / Math.max(1, perimeter) / 1.35 - 0.35);
    if (fit(half, blur, at(0.75))) for (const p of island) taken[p] = 1;
  }
  // Over other paint: islands of pink large enough to be petals rather than blossoms on the ground.
  for (const island of islands(pale, pink)) {
    if (island.length < 150 || island.length > 9000) continue;
    const length = 2 * Math.sqrt(island.length / Math.PI) * 1.6;
    if (fit(island, Math.min(2, length / 40), island)) for (const p of island) taken[p] = 1;
  }
  return out.sort((a, b) => a.at[1] - b.at[1]);
}

if (import.meta.main) {
  const dir = new URL("../../references/memories/", import.meta.url);
  const plate = readPng(fileURLToPath(new URL("front.png", dir)));
  const reference = readPng(fileURLToPath(new URL("complete.png", dir)));
  // The blossoms on the branch, top left, are not loose petals.
  const petals = findPetals(plate, reference, (x, y) => !(x < 330 && y < 400 && x + y < 560));
  for (const p of petals) console.log(`  ${JSON.stringify(p).replace(/"(\w+)":/g, "$1: ").replace(/,(?=\w)/g, ", ")},`);
  console.error(`${petals.length} petals`);
}
