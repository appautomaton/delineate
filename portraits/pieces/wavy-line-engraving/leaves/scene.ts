// What of the branch is read by eye, off gridded crops of its plate at 1.6x to 4.5x: the twigs
// that show between the leaves, and the sprays that make its edge, where the eye reads leaves one
// by one. The dense middle is laid by the plate's mass (see build.ts).

import type { Compound, P } from "./leaf.ts";

// Twigs, each through a few points from where it is thickest, with its width there.
export const TWIGS: { points: P[]; width: number }[] = [
  { points: [[0, 190], [38, 183], [84, 190], [128, 180], [176, 190]], width: 4 },
  { points: [[50, 132], [84, 141], [113, 161]], width: 3 },
  { points: [[132, 103], [166, 122], [190, 141]], width: 3 },
  { points: [[261, 69], [285, 64], [309, 61]], width: 2.5 },
  { points: [[355, 209], [359, 211], [385, 196], [422, 177], [458, 167], [482, 155]], width: 6 },
  { points: [[364, 163], [385, 167], [412, 167]], width: 3 },
  { points: [[374, 49], [406, 55], [439, 55], [455, 52]], width: 3 },
  { points: [[480, 90], [518, 95], [554, 102], [591, 98], [606, 92]], width: 3 },
  { points: [[610, 288], [639, 307], [668, 324], [690, 340]], width: 3.5 },
  { points: [[598, 179], [640, 190], [680, 200]], width: 3 },
  { points: [[640, 150], [680, 147], [743, 149], [818, 143]], width: 3 },
  { points: [[513, 360], [525, 377], [540, 396]], width: 3 },
  { points: [[440, 300], [453, 336]], width: 3 },
  { points: [[300, 270], [320, 300]], width: 3 },
];

// The sprays at the branch's edge: stalk from base to tip, pairs of leaflets, their length.
export const SPRAYS: Compound[] = [
  { base: [265, 302], tip: [243, 362], pairs: 2, size: 24 },
  { base: [320, 300], tip: [348, 406], pairs: 3, size: 26, bend: 6 },
  { base: [453, 336], tip: [471, 473], pairs: 3, size: 28, bend: -5 },
  { base: [446, 372], tip: [398, 372], pairs: 1, size: 24 },
  { base: [506, 360], tip: [639, 430], pairs: 3, size: 27, bend: 10 },
  { base: [550, 413], tip: [552, 464], pairs: 1, size: 24 },
  { base: [615, 312], tip: [617, 387], pairs: 2, size: 26 },
  { base: [663, 307], tip: [702, 406], pairs: 2, size: 27 },
  { base: [119, 218], tip: [115, 289], pairs: 2, size: 26 },
  { base: [649, 297], tip: [778, 391], pairs: 3, size: 27, bend: -8 },
  { base: [680, 147], tip: [830, 145], pairs: 3, size: 26, bend: 6 },
  { base: [690, 140], tip: [700, 70], pairs: 1, size: 28 },
  { base: [700, 140], tip: [790, 115], pairs: 2, size: 26 },
  { base: [720, 150], tip: [760, 215], pairs: 2, size: 28 },
  { base: [598, 179], tip: [712, 230], pairs: 2, size: 26 },
  { base: [700, 0], tip: [705, 45], pairs: 1, size: 24 },
  { base: [430, 0], tip: [440, 40], pairs: 1, size: 22 },
];
