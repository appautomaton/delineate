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
import type { Cuff, Edge, Stud, Tab, Welt, Zip } from "./hardware.ts";

const DIR = new URL("../../../references/wavy-line-engraving/", import.meta.url);
export const PLATE = new URL("wav-subject.png", DIR);

// Read by eye off a gridded crop of the plate, as coarse as the lay-in needs. His face, from the
// hairline beneath the bangs round the jaw; and his head, hair and face, down to the jaw and the
// tips of the hair beside it. His hair is the head without the face: drawn in strands, not waves.
export const FACE: Point[] = [[640, 176], [675, 194], [697, 224], [702, 250], [697, 272], [702, 294], [697, 329], [681, 348], [656, 376], [625, 395], [600, 385], [577, 365], [561, 346], [547, 311], [540, 285], [540, 264], [562, 242], [593, 211], [614, 185]];
// His neck, overlapping the jawline by a few pixels so `light` never dips between face and neck,
// bounded cleanly along the inner edge of the shirt collar.
export const NECK: Point[] = [
  [570, 345], [580, 358], [600, 375], [625, 384], [658, 366], [684, 342], [694, 332],
  [690, 390], [680, 435], [660, 480], [634, 514], [606, 480], [584, 435], [573, 392],
];
// His shirt's collar and V-placket down to the zip: bounded strictly along the white shirt's outer
// ink outline so the dark leather collar outside it stays 100% in the jacket's ink.
export const SHIRT: Point[] = [
  [573, 392], [566, 420], [562, 445], [565, 470], [571, 495], [576, 518], [601, 514],
  [608, 535], [609, 575], [610, 615], [605, 646], [618, 622], [642, 584], [666, 548],
  [686, 516], [693, 495], [699, 470], [702, 445], [699, 420], [690, 390], [680, 432],
  [660, 480], [634, 514], [606, 480], [584, 432],
];
// The two turned-down white collar wings of his shirt, kept free of horizontal waves.
export const COLLAR_WINGS: Point[][] = [
  [[573, 392], [566, 420], [562, 445], [565, 470], [571, 495], [576, 518], [588, 496], [594, 464], [608, 468], [600, 428], [580, 405]],
  [[690, 390], [699, 420], [702, 445], [699, 470], [693, 495], [686, 516], [680, 494], [674, 462], [658, 468], [668, 428], [684, 402]],
];
export const HEAD: Point[] = [[380, 60], [900, 60], [900, 330], [741, 355], [684, 351], [658, 372], [634, 386], [606, 372], [580, 351], [558, 333], [566, 372], [527, 355], [423, 329], [380, 330]];

// The jacket's big lines, which the colored original cannot give (black leather on black): read by
// eye off gridded crops of the plate and drawn as strokes. Each runs in the order drawn.
export const CONTOURS: Record<string, Point[]> = {
  "collar-left": [[573, 392], [566, 420], [562, 445], [565, 470], [571, 495], [576, 518]],
  "collar-right": [[690, 390], [699, 420], [702, 445], [699, 470], [693, 495], [686, 516]],
  "lapel-inner": [[686, 516], [666, 548], [642, 584], [618, 622], [604, 646]],
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
  // Right upper collar and right lapel, closing cleanly into the diagonal zipper's upper welt.
  { line: [[726, 396], [748, 434], [766, 464], [777, 492], [786, 524], [795, 558]], side: 1 },
  { line: [[795, 558], [768, 545], [742, 531], [714, 516], [703, 510]], side: 1 },
  { line: [[692, 516], [715, 528], [738, 544], [758, 560], [773, 574]], side: 1 },
  { line: [[773, 574], [764, 586], [750, 594]], side: 0 },
  // The epaulettes on both shoulders.
  { line: [[356, 520], [378, 493], [422, 471], [474, 455], [479, 463], [449, 477], [395, 504], [367, 523], [356, 520]], side: 1 },
  { line: [[795, 463], [812, 466], [849, 481], [888, 500], [909, 512], [915, 521], [907, 525], [878, 514], [840, 498], [811, 488], [797, 476], [795, 463]], side: 1 },
  // The adjuster tabs at his waist, two a side, rimmed cleanly so horizontal waves remain inside.
  { line: [[423, 945], [487, 948], [486, 980], [421, 979], [423, 945]], side: 0 },
  { line: [[419, 990], [481, 992], [479, 1024], [416, 1022], [419, 990]], side: 0 },
  { line: [[778, 956], [834, 956], [834, 987], [780, 987], [778, 956]], side: 0 },
  { line: [[783, 1002], [838, 1002], [838, 1027], [785, 1027], [783, 1002]], side: 0 },
];

// Subtle vertical welt seams: the vertical chest strap (whose horizontal waves pass across its
// interior), the panel seam continuing below its V-tip, and the storm-flap welt beside the main zip.
export const WELTS: Welt[] = [
  { line: [[716, 624], [711, 700], [706, 826]], side: -1 },
  { line: [[735, 616], [730, 700], [727, 826]], side: 1 },
  { line: [[706, 826], [716, 844], [727, 826]], side: -1, stitch: true },
  { line: [[714, 844], [712, 960], [712, 1076]], side: -1 },
  { line: [[606, 684], [606, 880], [607, 1076]], side: -1 },
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
// His shirt's cuffs, showing where his hands go into his pockets: each a curved band of paper
// round the sleeve's opening, and the fold where it turns in. Read off the plate at 4x.
export const CUFFS: Cuff[] = [
  { outline: [[427, 1070], [404, 1080], [382, 1096], [364, 1116], [374, 1137], [388, 1141], [404, 1112], [422, 1077]], fold: [[421, 1078], [402, 1093], [385, 1111], [377, 1133]] },
  { outline: [[828, 1072], [852, 1084], [872, 1102], [888, 1123], [878, 1145], [861, 1147], [844, 1114], [823, 1079]], fold: [[830, 1083], [843, 1094], [854, 1108], [876, 1141]] },
];
export const STUDS: Stud[] = [
  { at: [452, 466], size: [19, 8], angle: -15, kind: "dome" },
  { at: [815, 471], size: [15, 8], angle: 22, kind: "dome" },
  { at: [583, 531], size: [9, 9], angle: 0, kind: "eyelet" },
  { at: [746, 568], size: [16, 15], angle: 0, kind: "dome" },
  { at: [754, 594], size: [9, 9], angle: 0, kind: "dome" },
  { at: [721, 642], size: [6, 10], angle: 0, kind: "eyelet" },
  { at: [721, 715], size: [11, 15], angle: 0, kind: "snap" },
  { at: [716, 788], size: [11, 15], angle: 0, kind: "snap" },
];

// The woven leather on his left shoulder, filling the notch between the upper collar and right lapel,
// and bordered along its lower edge by a curved double-welt seam.
export const PATCH: Point[] = [
  [778, 480], [820, 488], [859, 505], [886, 529], [891, 552], [883, 574],
  [856, 586], [810, 597], [764, 610], [728, 626], [758, 595], [773, 574],
  [738, 544], [742, 531], [795, 558], [786, 524],
];
export const PATCH_SEAM: Point[] = [[726, 627], [764, 610], [810, 597], [856, 586], [883, 572], [891, 550]];

// The zips, each a line read off the plate (top or inner end first) and its pull: where the slider
// sits, which way the tab hangs (degrees from straight down, clockwise), and how long it is.
export const ZIPS: Zip[] = [
  { line: [[589, 730], [591, 900], [592, 1060]], pull: { at: [589, 680], angle: 0, length: 50, width: 16 }, stop: { at: [592, 1067], width: 13, height: 24 } },
  { line: [[597, 682], [672, 640], [748, 597]] },
  { line: [[454, 622], [487, 769]], pull: { at: [449, 605], angle: 6, length: 48, width: 11.5 } },
  { line: [[817, 628], [782, 780]], pull: { at: [822, 612], angle: -5, length: 48, width: 11.5 } },
  { line: [[444, 888], [536, 892]], pull: { at: [544, 892], angle: 74, length: 42, width: 13 } },
  { line: [[819, 898], [730, 902]], pull: { at: [723, 902], angle: -74, length: 42, width: 13 } },
];

export const PAPER = "#f3e8cc";
export const INK = "#06203b"; // the plate's ink as its jacket shows it, between its darkest tenth and its median

// The line family: spacing in pixels, and the waves laid over a level line, each an amplitude and
// a wavelength in pixels. Engineered for taut, high-density parallel flow without wormy chatter.
export const SPACING = 5.6;
export const RIPPLE = { amplitude: 0.48, wavelength: 34 };
export const WANDER = [
  { amplitude: 0.38, scale: 44 },
  { amplitude: 0.78, scale: 150 },
];
// Ink covers a line's share of the spacing in proportion to darkness, up to this share, so even the
// deepest shadow keeps a thread of paper between its lines.
export const FULLEST = 0.93;
// Where he is light (skin, shirt), the most a tinted line may cover: the plate keeps shadow there in
// fine, pale lines.
export const FINE = 0.38;
// Where he is light, the opacity of the lines: the plate's there are pale gray-blue, fine, and
// unbroken across the skin.
export const TINT = 0.55;
// The most an untinted line may cover where he is light: the plate's band under his jaw is fine
// lines of ink, close, not broad ones.
export const SHADE = 0.34;
// The opacity of the strands and folds in his hair, face and shirt: the plate's are mid gray-blue.
export const LINE_TINT = 0.62;
// The least darkness his face takes, so it keeps the faint hairlines the plate draws across it.
export const SKIN = 0.082;
// Lines thinner than this, in pixels, are not drawn: the light breaks them.
export const FINEST = 0.42;

