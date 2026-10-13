// The buildings: the city's towers either side of the street, behind him and the trees.
//
// The grammar, read off their plate (wav-building.png) at 2x to 3.5x:
// - Marks: the engraving's level wavy lines, finer on the far towers (about 4.6 px apart) than
//   on the two near towers at the frame's edges (about 6). No other hatching.
// - Tone: line width. A tower's face in shadow is lines nearly touching, cut by paper slits; a lit
//   face is thin lines broken into short dashes, so it reads as rows of windows.
// - Form: every block is a flat-roofed box, outlined in fine ink with a thread of paper beside it;
//   lit faces carry the window columns as fine verticals; a few roofs carry plant and masts. The
//   near towers are seen from below: their floors run as straight lines toward the street's
//   vanishing point, low in the middle of the frame.
// Kept: all of it. Dropped: the windows' individual frames, balconies and the plant's detail, which
//   do not read at the whole's scale. Where a block's foot is hidden (behind the trees, the ground,
//   him), its foot is drawn on the plate's line, as it is cut there.
// Every box is read by eye off gridded crops: x0-x1 across, its roof, and where it stands.

import type { Point } from "../../../harness/trace/polygon.ts";

export type Block = {
  // The face's outline: a box (x0, x1, roof) standing on the ground line, or any polygon.
  shape: [number, number, number] | Point[];
  // Window columns on a lit face: from x0 to x1, one every `every` px, from `from` down.
  columns?: { x: [number, number]; every: number; from: number };
};

// Where the blocks stand: the plate's lower edge, a shallow curve low in the middle.
export const GROUND: Point[] = [[0, 622], [137, 628], [140, 640], [244, 642], [310, 659], [400, 680], [470, 692], [560, 698], [640, 698], [760, 692], [860, 690], [940, 684], [1000, 668], [1040, 662], [1080, 646], [1254, 640]];

// The far blocks, back to front: each hides what is behind it; towers with a sunlit side and a
// shaded side are split along their corner edge so the ridge between light and shade stays sharp.
export const FAR: Block[] = [
  { shape: [420, 452, 425] },
  { shape: [584, 657, 457] },
  { shape: [561, 586, 516] },
  { shape: [498, 545, 494] },
  { shape: [452, 498, 460] },
  { shape: [778, 800, 442] },
  { shape: [800, 839, 442] },
  { shape: [886, 960, 311] },
  // Left big tower (x=200..357): sunlit front face (200..283), shaded front face (283..333), lit side face (333..357).
  { shape: [200, 283, 209] },
  { shape: [283, 333, 205], columns: { x: [293, 328], every: 11, from: 210 } },
  { shape: [[333, 205], [357, 253], [357, 540], [333, 540]], columns: { x: [337, 356], every: 8, from: 240 } },
  // Mid-left tower (x=368..426): shaded face (368..404) and sunlit side (404..426).
  { shape: [368, 404, 330] },
  { shape: [404, 426, 330], columns: { x: [407, 424], every: 7, from: 340 } },
  { shape: [149, 231, 323] },
  { shape: [357, 401, 383], columns: { x: [360, 400], every: 10, from: 390 } },
  // Left foreground block (x=136..310): shaded front face (136..244) and sunlit side face (244..310).
  { shape: [136, 244, 361], columns: { x: [148, 236], every: 14, from: 382 } },
  { shape: [[244, 362], [310, 424], [310, 660], [244, 643]], columns: { x: [256, 302], every: 11, from: 415 } },
  { shape: [310, 357, 532] },
  // Lower-left block (x=357..465): shaded face (357..435) and sunlit side (435..465).
  { shape: [357, 435, 519] },
  { shape: [[435, 519], [465, 550], [465, 692], [435, 690]], columns: { x: [440, 462], every: 7, from: 540 } },
  { shape: [497, 565, 566] },
  { shape: [565, 612, 560] },
  // Right mid tower (x=839..960): sunlit left side (839..858) and shaded front face (858..960).
  { shape: [858, 960, 347], columns: { x: [866, 954], every: 12, from: 360 } },
  { shape: [[839, 388], [858, 347], [858, 692], [839, 692]], columns: { x: [843, 855], every: 6, from: 380 } },
  { shape: [728, 776, 482] },
  { shape: [687, 700, 544] },
  { shape: [700, 717, 544] },
  { shape: [657, 695, 598] },
  { shape: [709, 751, 548] },
  // Lower-right block (x=870..960): sunlit left side (870..897) and shaded front face (897..960).
  { shape: [897, 960, 500] },
  { shape: [[870, 528], [897, 500], [897, 686], [870, 686]], columns: { x: [874, 894], every: 7, from: 525 } },
  // Tall right tower (x=958..1033): sunlit left side (958..976) and shaded front face (976..1033).
  { shape: [985, 1031, 165] },
  { shape: [976, 1033, 220], columns: { x: [984, 1028], every: 11, from: 226 } },
  { shape: [[958, 250], [976, 220], [976, 543], [958, 560]], columns: { x: [961, 973], every: 6, from: 245 } },
  // Foreground right low block (x=940..1040): sunlit left side (940..969) and shaded front face (969..1040).
  { shape: [969, 1040, 543] },
  { shape: [[940, 576], [969, 543], [969, 668], [940, 668]], columns: { x: [944, 966], every: 7, from: 560 } },
];

// The near towers at the frame's edges, seen from below: the left with its dark pillar, the right
// with its dark shaft and the columns its foot stands on. Floor lines run only across the sunlit
// faces (`span`), never cutting across the dark recessed shaft.
export type Tower = { blocks: Block[]; edge: number; span: [number, number]; floors: number[] };
export const NEAR: Tower[] = [
  {
    blocks: [
      { shape: [[0, 0], [64, 0], [64, 740], [0, 740]], columns: { x: [12, 58], every: 14, from: 0 } },
      { shape: [[94, 0], [137, 0], [137, 740], [92, 740]], columns: { x: [102, 132], every: 14, from: 0 } },
      { shape: [[59, 0], [94, 0], [88, 740], [64, 740]] },
    ],
    edge: 0,
    span: [0, 137],
    floors: [-44, 38, 120, 202, 283, 365, 448, 530, 610],
  },
  {
    blocks: [
      { shape: [[1033, 0], [1082, 0], [1096, 648], [1036, 662]] },
      { shape: [[1082, 0], [1180, 0], [1180, 642], [1096, 648]] },
      { shape: [[1180, 0], [1254, 0], [1254, 738], [1150, 740], [1150, 646], [1180, 642]] },
    ],
    edge: 1033,
    span: [1033, 1094],
    floors: [35, 118, 200, 282, 365, 448, 530, 612],
  },
];
export const VANISH: Point = [620, 705];

// Masts and plant on the roofs: x, and from where to where.
export const MASTS: [number, number, number][] = [
  [444, 413, 425], [589, 440, 457], [512, 482, 494], [528, 484, 494], [479, 447, 460], [793, 433, 442], [813, 431, 442],
  [905, 301, 311], [922, 299, 311], [156, 305, 323], [216, 297, 323], [382, 321, 330], [404, 321, 330], [702, 532, 544], [1006, 150, 165],
];
// Boxes of plant on the roofs: x0, x1, top, standing on the roof below.
export const PLANT: [number, number, number, number][] = [
  [218, 237, 202, 209], [264, 288, 196, 205], [302, 319, 190, 205], [598, 622, 450, 457], [918, 948, 304, 311],
];
