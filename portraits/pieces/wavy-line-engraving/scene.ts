// The wavy-line engraving: a young man with tousled silver hair, smiling, hands in the pockets of
// a zipped leather jacket, in a city street. This piece draws him alone, from his plate.
//
// The reference is generated: an engraving of the whole street (wavy-eng-full.png), its colored
// original (anime.png), and plates engraved apart, one per depth. The plates agree with the picture
// in what they show, not in frame: his plate shows him a tenth larger. Anime.png, mapped into the
// plate's frame (see MAP), lies on it within a few pixels everywhere but the hair, which was
// generated anew.
//
// The grammar, read from close crops of the plate and the full engraving:
// - Marks: one family of near-level wavy lines, about 6.8 px apart, everywhere he is drawn.
// - Tone: line width alone. Lines swell toward touching in the jacket's shadows and thin to
//   breaking in its light; the face and shirt carry only faint, sparse lines.
// - Form: clean contour lines over the waves (collar, lapels, seams, pockets, the zips' edges,
//   the features); his hair is strokes of its own, cream between dark strands.
// - Ink: indigo on cream for him; the street is green-black.
// Kept: line width as tone, the near-level waves, contours over them, the two inks.
// Reinterpreted: the plate's waves run flat across his face and sleeves; here they turn a little
// with the form, as an engraver's would. Dropped: the plate's deep shadows, where its lines melt
// into noise; there they only swell. Dropped also: wave fragments inside the zips and buckles.
// The eye goes to his face, then the zip and the hands.

import type { Affine } from "../../harness/trace/plate.ts";
import type { Point } from "../../harness/trace/polygon.ts";

const DIR = new URL("../../references/wavy-line-engraving/", import.meta.url);
export const HERE = new URL("./", import.meta.url);
export const PLATE = new URL("wav-subject.png", DIR);
export const ANIME = new URL("anime.png", DIR);
// From his plate to anime.png, fitted once by ORB features and RANSAC (trace/plate.ts).
export const MAP: Affine = [0.913, -0.0028, 53.5199, -0.0125, 0.9184, 145.7893];

// Read by eye off a gridded crop of the plate, as coarse as the lay-in needs. His face, from the
// hairline beneath the bangs round the jaw; and his head, hair and face, down to the jaw and the
// tips of the hair beside it. His hair is the head without the face: drawn in strands, not waves.
export const FACE: Point[] = [[640, 176], [675, 194], [697, 224], [702, 250], [697, 272], [702, 294], [697, 329], [684, 351], [658, 372], [634, 386], [606, 372], [580, 351], [558, 333], [547, 311], [540, 285], [540, 264], [562, 242], [593, 211], [614, 185]];
// His neck, from under the jaw to the shirt's collar: skin, drawn in the fine register however deep
// its shadow.
export const NECK: Point[] = [[572, 340], [702, 340], [708, 432], [640, 472], [582, 432]];
export const HEAD: Point[] = [[380, 60], [900, 60], [900, 330], [741, 355], [684, 351], [658, 372], [634, 386], [606, 372], [580, 351], [558, 333], [566, 372], [527, 355], [423, 329], [380, 330]];

// The jacket's big lines, which the colored original cannot give (black leather on black): read by
// eye off gridded crops of the plate and drawn as strokes. Each runs in the order drawn.
export const CONTOURS: Record<string, Point[]> = {
  "collar-left": [[563, 382], [542, 415], [514, 458], [493, 497], [476, 537], [504, 532], [536, 516], [580, 506]],
  "lapel-left": [[580, 513], [526, 540], [548, 589], [575, 638], [598, 679]],
  "collar-right": [[700, 382], [716, 409], [738, 448], [765, 491], [790, 551], [765, 540], [738, 529], [700, 510], [689, 507]],
  "strap": [[711, 633], [706, 829], [716, 844], [727, 829], [731, 633]],
  "epaulette-left": [[356, 520], [378, 493], [422, 471], [474, 455], [479, 463], [449, 477], [395, 504], [367, 523]],
  "epaulette-right": [[797, 458], [841, 475], [884, 499], [911, 521]],
  "hem": [[429, 1050], [500, 1066], [592, 1079], [701, 1077], [826, 1047]],
  "crease-left": [[500, 1080], [495, 1140], [481, 1205], [473, 1254]],
  "fly": [[617, 1080], [619, 1161], [620, 1254]],
  "crease-right": [[745, 1107], [753, 1161], [761, 1205], [769, 1254]],
};
// The woven leather on his left shoulder, drawn as a basket weave of its own.
export const PATCH: Point[] = [[760, 513], [792, 502], [841, 510], [882, 527], [890, 546], [874, 578], [830, 597], [792, 608], [765, 600], [757, 578]];

export const PAPER = "#f3e8cc";
export const INK = "#031731"; // the plate's own ink, measured on its darkest tenth

// The line family: spacing in pixels, and the waves laid over a level line, each an amplitude and
// a wavelength in pixels. The first is the engraver's ripple, the rest a slower wander, so no two
// neighbors run quite alike. Lines never cross: the field's slope across them stays well under one.
export const SPACING = 6.8;
export const RIPPLE = { amplitude: 1.1, wavelength: 26 };
export const WANDER = [
  { amplitude: 1.1, scale: 34 },
  { amplitude: 2.6, scale: 140 },
];
// Ink covers a line's share of the spacing in proportion to darkness, up to this share, so even the
// deepest shadow keeps a thread of paper between its lines.
export const FULLEST = 0.9;
// Where he is light (skin, shirt), the most a line may cover: the plate keeps shadow there in fine
// lines.
export const FINE = 0.3;
// The least darkness his face takes, so it keeps the faint hairlines the plate draws across it.
export const SKIN = 0.12;
// Lines thinner than this, in pixels, are not drawn: the light breaks them.
export const FINEST = 0.45;
