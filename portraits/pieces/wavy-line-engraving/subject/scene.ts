// The wavy-line engraving: a young man with tousled silver hair, smiling, hands in the pockets of
// a zipped leather jacket, in a city street. This piece draws him alone, from his plate.
//
// The reference is generated: an engraving of the whole street (wavy-eng-full.png), its colored
// original (anime.png), and plates engraved apart, one per depth. His plate shows him a tenth
// larger than the whole does; the whole brings him into its frame (see ../build.ts).
//
// The grammar, read from close crops of the plate and the full engraving:
// - Marks: one family of near-level wavy lines, about 6.8 px apart, everywhere he is drawn. On
//   the leather they merge into a navy ground, and the paper between them shows as long, thin
//   slivers that taper at both ends; the face and shirt carry only faint, sparse lines.
// - Tone: the slivers' length and width, the lines' width.
// - Form: lit edges over the waves (collar, lapels, epaulettes, tabs, his silhouette), each with a
//   row of stitches; hardware in paper edged with ink; his hair is strokes of its own.
// - Ink: navy on cream for him; the street is green-black.
// Kept: all of it. Kept above all: every wave runs level, as the plate's do. Dropped: the plate's
// deep shadows, where its lines melt into noise; there they only swell.
// The eye goes to his face, then the zip and the hands.

import type { Point } from "../../../harness/trace/polygon.ts";
import type { Edge, Stud, Tab, Zip } from "./hardware.ts";

const DIR = new URL("../../../references/wavy-line-engraving/", import.meta.url);
export const PLATE = new URL("wav-subject.png", DIR);

// Read by eye off a gridded crop of the plate, as coarse as the lay-in needs. His face, from the
// hairline beneath the bangs round the jaw; and his head, hair and face, down to the jaw and the
// tips of the hair beside it. His hair is the head without the face: drawn in strands, not waves.
export const FACE: Point[] = [[640, 176], [675, 194], [697, 224], [702, 250], [697, 272], [702, 294], [697, 329], [681, 348], [656, 371], [624, 389], [600, 381], [577, 365], [561, 346], [547, 311], [540, 285], [540, 264], [562, 242], [593, 211], [614, 185]];
// His neck, from under the jaw to the shirt's collar: skin, drawn in the fine register however deep
// its shadow.
export const NECK: Point[] = [[566, 372], [579, 371], [600, 385], [624, 394], [658, 377], [684, 354], [704, 337], [708, 432], [640, 472], [582, 432]];
export const HEAD: Point[] = [[380, 60], [900, 60], [900, 330], [741, 355], [684, 351], [658, 372], [634, 386], [606, 372], [580, 351], [558, 333], [566, 372], [527, 355], [423, 329], [380, 330]];

// The jacket's big lines, which the colored original cannot give (black leather on black): read by
// eye off gridded crops of the plate and drawn as strokes. Each runs in the order drawn.
export const CONTOURS: Record<string, Point[]> = {
  "hem": [[429, 1050], [500, 1066], [592, 1079], [701, 1077], [826, 1047]],
  "crease-left": [[500, 1080], [495, 1140], [481, 1205], [473, 1254]],
  "fly": [[617, 1080], [619, 1161], [620, 1254]],
  "crease-right": [[745, 1107], [753, 1161], [761, 1205], [769, 1254]],
};
// The collars' and lapels' edges, read off gridded crops of the plate at 3.4x: each a rim of
// light along the edge and, on the piece's side, a row of stitches (see hardware.ts).
export const EDGES: Edge[] = [
  { line: [[549, 407], [531, 424], [518, 438], [507, 449], [500, 461], [495, 478], [490, 496], [485, 513], [479, 529], [477, 541]], side: -1 },
  { line: [[477, 541], [492, 533], [512, 525], [531, 517], [550, 509]], side: -1 },
  { line: [[526, 541], [560, 528], [599, 514]], side: 1 },
  { line: [[526, 541], [535, 552], [547, 571], [558, 591], [568, 610], [576, 630], [583, 652], [589, 680]], side: -1 },
  { line: [[600, 514], [607, 532], [608, 571], [610, 610]], side: 0 },
  { line: [[752, 445], [766, 461], [776, 478], [783, 505], [790, 533], [793, 550]], side: 1 },
  { line: [[793, 550], [772, 540], [749, 531], [721, 515], [706, 509]], side: 1 },
  { line: [[690, 519], [714, 533], [733, 546], [752, 562], [762, 571]], side: 1 },
  // The epaulettes and the strap on his chest, each all round.
  { line: [[356, 520], [378, 493], [422, 471], [474, 455], [479, 463], [449, 477], [395, 504], [367, 523], [356, 520]], side: 1 },
  { line: [[795, 463], [812, 466], [849, 481], [888, 500], [909, 512], [915, 521], [907, 525], [878, 514], [840, 498], [811, 488], [797, 476], [795, 463]], side: 1 },
  { line: [[711, 633], [706, 829], [716, 844], [727, 829], [731, 633], [711, 633]], side: -1 },
  // The adjuster tabs at his waist, two a side, each strap from its buckle to its rounded end.
  { line: [[423, 945], [487, 948], [486, 980], [421, 979], [423, 945]], side: 1 },
  { line: [[419, 990], [481, 992], [479, 1024], [416, 1022], [419, 990]], side: 1 },
  { line: [[778, 956], [834, 956], [834, 987], [780, 987], [778, 956]], side: 1 },
  { line: [[783, 1002], [838, 1002], [838, 1027], [785, 1027], [783, 1002]], side: 1 },
];

// Their buckles (a bar seen edge on, top end first, and the prong's point) and eyelets, and the
// studs and snaps: on the epaulettes, the lapels, and down the strap on his chest. Read off the
// plate at 3x to 3.5x.
export const TABS: Tab[] = [
  { buckle: [[434, 944], [431, 977]], eyelet: { at: [455, 962], size: [8, 11] } },
  { buckle: [[430, 986], [424, 1027], [423, 1033]], eyelet: { at: [448, 1005], size: [8, 11] } },
  { buckle: [[826, 953], [831, 988]], eyelet: { at: [807, 971], size: [8, 11] } },
  { buckle: [[829, 995], [836, 1031], [834, 1036]], eyelet: { at: [811, 1013], size: [8, 11] } },
];
export const STUDS: Stud[] = [
  { at: [452, 466], size: [19, 8], angle: -15 },
  { at: [815, 471], size: [15, 8], angle: 22 },
  { at: [583, 531], size: [8, 8], angle: 0 },
  { at: [736, 579], size: [14, 14], angle: 0 },
  { at: [720, 663], size: [7, 10], angle: 0 },
  { at: [721, 715], size: [7, 10], angle: 0 },
  { at: [715, 788], size: [7, 10], angle: 0 },
];

// The woven leather on his left shoulder, drawn as a basket weave of its own.
// Read off the plate at 3.4x: below the epaulette, along the right collar's outer edge, round the
// shoulder, and back beneath the lapel's point.
export const PATCH: Point[] = [[778, 482], [820, 488], [859, 505], [884, 529], [888, 552], [882, 575], [865, 589], [830, 599], [791, 606], [764, 612], [758, 595], [760, 567], [783, 552], [789, 533], [783, 505]];

// The zips, each a line read off the plate (top or inner end first) and its pull: where the slider
// sits, which way the tab hangs (degrees from straight down, clockwise), and how long it is.
export const ZIPS: Zip[] = [
  { line: [[589, 731], [591, 900], [593, 1075]], pull: { at: [589, 684], angle: 0, length: 48, width: 15 } },
  { line: [[597, 682], [672, 640], [747, 601]] },
  { line: [[449, 627], [487, 769]], pull: { at: [445, 614], angle: -8, length: 46, width: 10 } },
  { line: [[821, 624], [784, 778]], pull: { at: [823, 618], angle: 6, length: 46, width: 10 } },
  { line: [[444, 892], [505, 895]], pull: { at: [506, 895], angle: -84, length: 42, width: 13 } },
  { line: [[818, 902], [760, 904]], pull: { at: [759, 904], angle: 86, length: 42, width: 13 } },
];

export const PAPER = "#f3e8cc";
export const INK = "#06203b"; // the plate's ink as its jacket shows it, between its darkest tenth and its median

// The line family: spacing in pixels, and the waves laid over a level line, each an amplitude and
// a wavelength in pixels. The first is the engraver's ripple, the rest a slower wander, so no two
// neighbors run quite alike. Lines never cross: the field's slope across them stays well under one.
export const SPACING = 6.8;
export const RIPPLE = { amplitude: 1.1, wavelength: 26 };
export const WANDER = [
  { amplitude: 0.6, scale: 34 },
  { amplitude: 1.2, scale: 140 },
];
// Ink covers a line's share of the spacing in proportion to darkness, up to this share, so even the
// deepest shadow keeps a thread of paper between its lines.
export const FULLEST = 0.94;
// Where he is light (skin, shirt), the most a tinted line may cover: the plate keeps shadow there in
// fine, pale lines.
export const FINE = 0.4;
// Where he is light, the opacity of the lines: the plate's there are pale gray-blue, fine, and
// unbroken across the skin.
export const TINT = 0.55;
// The most an untinted line may cover where he is light: the plate's band under his jaw is fine
// lines of ink, close, not broad ones.
export const SHADE = 0.32;
// The opacity of the strands and folds in his hair, face and shirt: the plate's are mid gray-blue.
export const LINE_TINT = 0.6;
// The least darkness his face takes, so it keeps the faint hairlines the plate draws across it.
export const SKIN = 0;
// Lines thinner than this, in pixels, are not drawn: the light breaks them.
export const FINEST = 0.45;
