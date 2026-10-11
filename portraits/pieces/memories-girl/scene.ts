// Memories, the girl: a young woman with silver-and-blue hair smiling on a hillside in spring, in a
// dark jacket embroidered with blossoms; a cherry tree frames the left, the town, the bay, and the
// city lie below a blue sky, and petals drift through the air.
//
// The picture comes with plates painted to split it by depth, each over transparency: the distance
// (sky, mountains, city, bay, town), the hillside on the left (a building and retaining walls), the
// road on the right, the subject, the blossom tree, and the petals nearest the lens. They agree
// with the picture in shape, not always in detail or tone, and two are not in its frame: the
// distance is painted half again as large, so that it covers only the right two thirds of the
// frame and the top two thirds, and the subject larger and higher. Each plate is mapped
// into the picture's frame by an affine map fitted once (see plates.ts) and cut into regions by
// claims (see Claim); the picture's own map is the plates composited, nearest in front. A plate's
// colors serve only through a color transfer fitted per region, for what the picture hides.
//
// Every layer is a plane in space (see portraits/harness/stage/drawing.ts). Flat layers face the viewer; the
// retaining wall comes toward the viewer on the right, and under a moving eye it moves by an exact
// affine map. The subject stands on the focus plane, 2 m away.

import { type Layer as StageLayer, alongX, facing } from "../../harness/stage/drawing.ts";
import type { TraceStyle } from "../../harness/trace/layer.ts";
import type { Tone } from "../../harness/trace/mask.ts";
import type { Affine } from "../../harness/trace/plate.ts";
import type { Box, Point } from "../../harness/trace/polygon.ts";
import type { Petal } from "./petal.ts";

export type Layer = StageLayer & { regions: string[] };
// `inside`: the region whose group holds this one, so it moves with it. `moves`: how the region
// moves as a whole, by the motion's class (see portraits/harness/stage/motion.css and motion.css here).
export type Region = { name: string; trace: TraceStyle; inside?: string; moves?: string };
// A claim takes pixels for a region, among the regions named in `within` (by default the plate's
// first region; "none" is what the plate leaves unpainted): those inside the polygon `inside`,
// below or above a polyline (y downward; the line runs left to right and holds level beyond its
// ends), inside its clip boxes, and only those of a lightness and chroma given (any one of several
// ranges, in OKLab), or those Segment Anything finds in the picture from points inside the thing;
// and with `near`, only those that reach the region through such pixels, a step of that many pixels
// at a time, eight steps at most; with `least`, only pieces of at least that many pixels. The first claim of a plate
// says where its paint counts; by default, everywhere.
export type Claim = { region: string; within?: string[]; inside?: Point[]; below?: Point[]; above?: Point[]; clip?: Box[]; color?: Tone[]; near?: number; least?: number; find?: Point[] };
// `map`: for a plate painted in a frame of its own, where its pixels land in the picture's (see
// portraits/harness/trace/plate.ts).
export type Plate = { name: string; image: URL; map?: Affine; claims: Claim[] };

const DIR = new URL("../../references/memories-girl/", import.meta.url);
export const REFERENCE = new URL("full.png", DIR);
export const FORWARD = new URL("forward.png", DIR);
export const HERE = new URL("./", import.meta.url);
export const MAP = new URL("regions.png", HERE);
export const plateMap = (name: string) => new URL(`regions-${name}.png`, HERE);

export const FOCUS = 2;

export const TRACE: TraceStyle = { error: 0.009, maxTones: 64, tolerance: 0.4, soften: 0.5, flat: 3, minArea: 1.5 };
const SOFT: TraceStyle = { error: 0.012, maxTones: 32, tolerance: 0.8, soften: 1.2, flat: 4, minArea: 12 };
// For the busy ground: town, foliage, ivy, stone. Few tones and no crumbs, but outlines kept sharp:
// softening them before fitting, as for a smooth painting, blurs fine paint like this into mush.
const BUSY: TraceStyle = { error: 0.025, maxTones: 32, tolerance: 0.8, soften: 0.4, flat: 12, minArea: 6, straight: 5 };
// For blossom: more tones than the ground, for the pinks and violets in shade and sun.
const BLOSSOM: TraceStyle = { error: 0.02, maxTones: 40, tolerance: 0.6, soften: 0.4, flat: 8, minArea: 3 };
// For what is seen only once the planes move or part: close in shape and color, without texture.
export const HIDDEN: TraceStyle = { error: 0.04, maxTones: 16, tolerance: 1.4, soften: 1.2, flat: 12, minArea: 60, straight: 4 };

// Back to front; within a layer, later regions lie over earlier ones.
export const REGIONS: Region[] = [
  { name: "sky", trace: { ...SOFT, error: 0.008, flat: 2 } },
  { name: "clouds", trace: SOFT, moves: "drift" },
  { name: "distance", trace: BUSY },
  { name: "road", trace: BUSY },
  { name: "hillside", trace: BUSY },
  { name: "wall", trace: BUSY },
  { name: "tree", trace: BLOSSOM },
  { name: "branch", trace: BLOSSOM, moves: "sway" },
  { name: "body", trace: { ...TRACE, error: 0.01, flat: 5 }, moves: "breathe" },
  // The face, where the eye goes, is traced with outlines barely softened, so fine lines hold.
  { name: "head", trace: { ...TRACE, error: 0.006, flat: 1.5, soften: 0.25, tolerance: 0.35, minArea: 1 }, inside: "body", moves: "nod" },
  { name: "eyes", trace: { ...TRACE, error: 0.005, flat: 1.5, soften: 0.2, tolerance: 0.3, minArea: 0.5 }, inside: "head", moves: "blink" },
  { name: "bloom", trace: { ...TRACE, error: 0.012, soften: 0.45, flat: 5 } },
];

export const LAYERS: Layer[] = [
  { name: "sky", title: "Sky", note: "and clouds drifting behind the hills", plane: facing(6000), regions: ["sky", "clouds"] },
  { name: "distance", title: "Distance", note: "mountains, the city, the bay, the town", plane: facing(900), regions: ["distance"] },
  { name: "road", title: "The road", note: "winding up the far hillside", plane: facing(80), regions: ["road"] },
  { name: "hillside", title: "Hillside", note: "flats, poles, cypress, an ivied wall", plane: facing(16), regions: ["hillside"] },
  { name: "wall", title: "The wall", note: "railed, coming round beside her", plane: alongX(0, 6, 1254, 2.5), regions: ["wall"] },
  { name: "tree", title: "The cherry", note: "its branch swaying overhead", plane: facing(3.4), regions: ["tree", "branch"] },
  { name: "subject", title: "The subject", note: "breathes, nods, blinks", plane: facing(FOCUS), regions: ["body", "head", "eyes"] },
  { name: "bloom", title: "Near bloom", note: "blossom at the lens", plane: facing(1.4), regions: ["bloom"] },
  { name: "petals", title: "Petals", note: "falling and tumbling", plane: facing(1.15), regions: [] },
];

// The ridge where the hills meet the sky, read off the picture left to right (behind the tree,
// where the picture hides it, carried on level); segmentation settles it onto the edge itself.
export const RIDGE: Point[] = [
  [-20, 176], [440, 172], [500, 176], [560, 190], [600, 200], [650, 205], [700, 195], [740, 183], [780, 180], [807, 188], [840, 196],
  [883, 202], [907, 192], [940, 188], [973, 180], [1000, 178], [1027, 173], [1057, 167], [1080, 160], [1100, 153], [1123, 151],
  [1160, 152], [1173, 158], [1200, 163], [1217, 167], [1274, 171],
];

// The hillside plate's lower railing and wall come forward; the line runs just above the rail, then
// up past the end of the ivied wall, so the railing on the right goes with the wall too.
const RAIL: Point[] = [[-20, 861], [842, 1081], [846, 1000], [1274, 1000]];

// The face and hair, down to the jaw; the neck stays with the body, so a nod turns the head above
// the collar.
const HEAD: Point[] = [
  [420, 280], [900, 280], [900, 642], [792, 640], [772, 618], [760, 590], [745, 590], [700, 614], [655, 627], [650, 642], [640, 656], [420, 656],
];

// Bark and blossom, as against sky and cloud: dark, or pink.
const TWIG: Tone[] = [{ L: [0, 0.6] }, { a: [0.015, 1] }];

export const PLATES: Plate[] = [
  {
    name: "back",
    image: new URL("back.png", DIR),
    map: [0.6623, 0.0015, 422.2, 0.0004, 0.6662, -17.8],
    claims: [
      { region: "distance" },
      { region: "sky", above: RIDGE },
      // Clouds are the sky's bright, grey-white pixels, in pieces larger than the white of a blossom.
      { region: "clouds", within: ["sky"], color: [{ L: [0.84, 1.1], C: [0, 0.06] }], least: 600 },
    ],
  },
  { name: "med-right", image: new URL("med-right.png", DIR), claims: [{ region: "road" }] },
  { name: "med-left", image: new URL("med-left.png", DIR), claims: [{ region: "hillside" }, { region: "wall", below: RAIL }] },
  {
    name: "front-left",
    image: new URL("front-left.png", DIR),
    claims: [
      // The crown; below it the plate's paint runs on between the flowers nearest the lens, over
      // the wall the picture shows there.
      { region: "tree", above: [[-20, 700], [1274, 700]] },
      // The branch reaching out over the sky sways on its own, from where it leaves the crown.
      { region: "branch", clip: [[440, -20, 1274, 340]] },
      // The plate's outline misses the finest twigs and the pink edges of blossoms against the sky:
      // what is dark or pink and reaches the tree is the tree's.
      { region: "branch", within: ["sky", "clouds"], near: 2, color: TWIG, clip: [[440, -20, 1274, 340]] },
      { region: "tree", within: ["sky", "clouds"], near: 2, color: TWIG, clip: [[-20, -20, 440, 700]] },
      // The large flowers nearest the lens, found one by one in the picture.
      { region: "bloom", within: ["none", "tree", "hillside", "wall", "body"], find: [[60, 760], [130, 860], [200, 960], [90, 1010], [40, 1150], [180, 1200], [380, 1200], [30, 880]] },
    ],
  },
  {
    name: "subject",
    image: new URL("subject.png", DIR),
    map: [0.7218, -0.001, 218.7, -0.0002, 0.7268, 313.3],
    claims: [
      { region: "body" },
      { region: "head", inside: HEAD },
      // The eyes, lashes and all, inside their outlines: what is left around them is skin, which
      // shows when they close.
      { region: "eyes", within: ["head"], inside: [[566, 517], [568, 507], [575, 499], [585, 494], [597, 492], [609, 494], [618, 499], [625, 506], [624, 510], [614, 517], [600, 523], [588, 526], [576, 525]] },
      { region: "eyes", within: ["head"], inside: [[657, 496], [659, 486], [667, 477], [678, 470], [690, 466], [702, 463], [713, 464], [722, 467], [719, 473], [711, 481], [703, 488], [690, 494], [676, 499], [664, 499]] },
    ],
  },
];

// The lash lines of the closed eyes, drawn while the subject blinks.
export const LIDS = ["M568 516Q596 530 624 508", "M659 496Q690 503 717 474"];

// Fitted once to the picture (see petal.ts), starting from the forward plate's petals, and kept
// only where the picture shows them. Three are set by hand: two the plate merges into one, and one
// that runs off the frame.
export const PETALS: Petal[] = [
  { at: [1057.9, 50.1], angle: 45, length: 44.1, width: 14.9, color: "#fdeef3", blur: 0.5 },
  { at: [86.7, 147.9], angle: 60, length: 47.7, width: 23.5, color: "#fbdee9", blur: 0.5 },
  { at: [519.8, 231.3], angle: 46, length: 32.3, width: 16.1, color: "#fdfafd", blur: 0 },
  { at: [1135.6, 226.9], angle: 166, length: 27.4, width: 11.2, color: "#fccfe8", blur: 0 },
  { at: [348.7, 269.9], angle: 171, length: 23.2, width: 12.1, color: "#fdcfe5", blur: 0 },
  { at: [1203.7, 356.4], angle: 14, length: 26.5, width: 8.9, color: "#facbe9", blur: 0 },
  { at: [251.8, 409.2], angle: 208, length: 23.7, width: 14.1, color: "#fddfe6", blur: 0 },
  { at: [94.7, 452.5], angle: 220, length: 86.3, width: 45.9, color: "#fee3eb", blur: 1 },
  { at: [367, 535.6], angle: 319, length: 23.2, width: 12.1, color: "#fccfe8", blur: 0 },
  { at: [982.8, 676.7], angle: 142, length: 39, width: 20.7, color: "#fdeff8", blur: 0 },
  { at: [106.8, 684.8], angle: 212, length: 33.7, width: 19.4, color: "#fdcddc", blur: 0 },
  { at: [211, 758], angle: 42, length: 38, width: 15, color: "#fdf2f6", blur: 0 },
  { at: [238, 767], angle: 182, length: 38, width: 17, color: "#f9c6da", blur: 0 },
  { at: [362.8, 812.9], angle: 38, length: 30.7, width: 12.9, color: "#fcf4f7", blur: 0 },
  { at: [175.6, 805.5], angle: 18, length: 25.1, width: 17, color: "#fdcdde", blur: 0 },
  { at: [237.2, 886.5], angle: 152, length: 63.1, width: 23.6, color: "#feeff5", blur: 0.5 },
  { at: [109.8, 935.3], angle: 64, length: 80, width: 38.6, color: "#fed0db", blur: 1 },
  { at: [342.9, 941.7], angle: 46, length: 50.7, width: 25.8, color: "#fef2f7", blur: 0.5 },
  { at: [1218, 949], angle: 25, length: 100, width: 36, color: "#fdf5fa", blur: 1 },
  { at: [1196.6, 1133.7], angle: 24, length: 83.7, width: 36.6, color: "#fdcfe2", blur: 1 },
];
