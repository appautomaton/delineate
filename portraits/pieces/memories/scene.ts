// Memories: a young man smiling on a hillside road in spring, the town and the city below him,
// cherry blossom overhead and petals in the air.
//
// The picture comes with plates, each painted on its own over black: the distance, the middle
// ground, the near ground, and the subject. They agree with the picture in shape, not in tone. Each
// plate is cut into regions by claims, in order, each later claim taking over what it claims (see
// Claim). The picture's own map is the plates composited, nearest in front.
//
// Every layer is a plane in space (see portraits/harness/stage/drawing.ts). Flat layers face the viewer; the
// road, the guardrail, and the street side recede, and under a moving eye each moves by an exact
// affine map. The subject stands on the focus plane, 2 m away.

import { type Layer as StageLayer, alongX, alongY, facing } from "../../harness/stage/drawing.ts";
import type { TraceStyle } from "../../harness/trace/layer.ts";
import type { Tone } from "../../harness/trace/mask.ts";
import type { Box } from "../../harness/trace/polygon.ts";
import type { Prompt } from "../../harness/trace/sam.ts";
import type { Petal } from "./petal.ts";

export type Layer = StageLayer & { regions: string[] };
// A claim takes pixels of its plate for a region: those Segment Anything finds from its points, or
// with no points every pixel; only among the regions named in `within` (by default, with no points,
// the plate's first region); only inside its clip boxes and its area (a polygon); only of a lightness and chroma given (any
// one of several ranges, in OKLab). A solid claim keeps one whole piece in each clip box: the
// largest it found there, with its holes filled.
export type Claim = { region: string; find?: Prompt[]; within?: string[]; clip?: Box[]; area?: [number, number][]; color?: Tone[]; solid?: true };
export type Plate = { name: string; image: URL; claims: Claim[] };
// `inside`: the region whose group holds this one, so it moves with it. `moves`: how the region
// moves as a whole, by the motion's class (see portraits/harness/stage/motion.css and motion.css here).
export type Region = { name: string; trace: TraceStyle; inside?: string; moves?: string };

const DIR = new URL("../../references/memories/", import.meta.url);
export const REFERENCE = new URL("complete.png", DIR);
export const MAP = new URL("./regions.png", import.meta.url);
export const PLATE_MAPS = new URL("./", import.meta.url); // regions-<plate>.png

const at = (...points: [number, number][]): Prompt[] => points.map((p) => ({ points: [p] }));

export const FOCUS = 2;

export const TRACE: TraceStyle = { error: 0.009, maxTones: 64, tolerance: 0.4, soften: 0.5, flat: 3, minArea: 1.5 };
const DISTANT: TraceStyle = { error: 0.016, maxTones: 64, tolerance: 0.6, soften: 0.9, flat: 6, minArea: 8, straight: 7 };
// Busy texture in the middle distance: a fine palette, kept to shapes of some size, and loose curves;
// tried against tighter curves, this held the picture better in fewer bytes.
const BUSY: TraceStyle = { error: 0.012, maxTones: 64, tolerance: 1.2, soften: 0.6, flat: 8, minArea: 5, straight: 7 };
const SOFT: TraceStyle = { error: 0.012, maxTones: 32, tolerance: 0.8, soften: 1.2, flat: 4, minArea: 12 };
export const HIDDEN: TraceStyle = { error: 0.03, maxTones: 24, tolerance: 1, soften: 1.2, flat: 8, minArea: 40, straight: 6 };

export const REGIONS: Region[] = [
  { name: "skyline", trace: DISTANT },
  { name: "sky", trace: { ...SOFT, error: 0.008, flat: 2 } },
  { name: "clouds", trace: SOFT, moves: "drift" },
  { name: "town", trace: BUSY },
  { name: "street", trace: BUSY },
  { name: "road", trace: { ...SOFT, error: 0.014 } },
  { name: "guardrail", trace: { ...TRACE, error: 0.014, straight: 5 } },
  { name: "branch", trace: { ...TRACE, error: 0.012 }, moves: "sway" },
  { name: "body", trace: TRACE, moves: "breathe" },
  { name: "head", trace: { ...TRACE, error: 0.006, flat: 1.5 }, moves: "nod" },
  { name: "eyes", trace: TRACE, inside: "head", moves: "blink" },
];

// Back to front.
export const LAYERS: Layer[] = [
  { name: "distance", title: "Distance", note: "sky, drifting clouds, mountains, the city", plane: facing(1500), regions: ["sky", "clouds", "skyline"] },
  { name: "town", title: "The town", note: "the hillside, the elevated road, trees in bloom", plane: facing(150), regions: ["town"] },
  { name: "street", title: "The street side", note: "flats, vines, poles, the retaining wall", plane: alongX(850, 45, 1254, 5), regions: ["street"] },
  { name: "road", title: "The road", note: "rising to the crest", plane: alongY(990, 22, 1254, 2.6), regions: ["road"] },
  { name: "guardrail", title: "The guardrail", note: "running back along the road", plane: alongX(0, 2.8, 345, 14), regions: ["guardrail"] },
  { name: "branch", title: "The branch", note: "cherry blossom overhead", plane: facing(2.6), regions: ["branch"] },
  { name: "subject", title: "The subject", note: "breathes, nods, blinks", plane: facing(FOCUS), regions: ["body", "head", "eyes"] },
  { name: "petals", title: "Petals", note: "falling through the air", plane: facing(1.5), regions: [] },
];

// Below the guardrail's top rail and left of the road's edge.
const RAIL: [number, number][] = [
  [0, 985],
  [585, 908],
  [605, 945],
  [340, 1020],
  [130, 1254],
  [0, 1254],
];

export const PLATES: Plate[] = [
  {
    name: "back",
    image: new URL("back.png", DIR),
    claims: [
      { region: "skyline" },
      { region: "sky", find: at([600, 60], [250, 110], [950, 30], [1000, 190], [700, 150], [180, 175]) },
      { region: "clouds", within: ["sky"], color: [{ L: [0.86, 1.1], C: [0, 0.07] }] },
    ],
  },
  {
    name: "med",
    image: new URL("med.png", DIR),
    claims: [
      { region: "town" },

      // The street side is everything right of where the town ends, and the wall's foot.
      {
        region: "street",
        clip: [
          [845, 0, 1254, 1030],
          [826, 730, 845, 1030],
        ],
      },
      // The guardrail, with the curb and the weeds at its foot: all that lies below its top rail.
      { region: "guardrail", area: RAIL },
      { region: "road", find: at([650, 1150], [400, 1150], [1000, 1120], [700, 1000], [880, 1010]), clip: [[0, 930, 1254, 1254]] },
    ],
  },
  {
    name: "front",
    image: new URL("front.png", DIR),
    claims: [
      { region: "road" },
      { region: "branch", clip: [[0, 0, 520, 420]] },
      { region: "guardrail", area: RAIL },
      { region: "road", find: at([650, 1150], [400, 1150], [1000, 1120], [250, 1200]), clip: [[0, 930, 1254, 1254]] },
    ],
  },
  {
    name: "subject",
    image: new URL("subject.png", DIR),
    claims: [
      { region: "body" },
      // Down to the chin: the neck stays with the body, so a nod turns the head above the collar.
      { region: "head", find: at([600, 420], [520, 470], [700, 470], [600, 520], [620, 620], [560, 650], [490, 620], [720, 620]), clip: [[380, 330, 820, 735]] },
      // The eyes are what is not skin around them: lashes and iris (dark) and the whites (pale).
      {
        region: "eyes",
        within: ["head"],
        solid: true,
        color: [{ L: [0, 0.5] }, { L: [0.8, 1.1], C: [0, 0.035] }],
        clip: [
          [518, 548, 580, 586],
          [624, 540, 690, 576],
        ],
      },
    ],
  },
];

// The lash lines of the closed eyes, drawn while the subject blinks.
export const LIDS = ["M523 569Q550 580 577 567", "M630 560Q657 571 686 556"];

// Fitted once on the front plate (see petal.ts), the false finds removed: blossoms on the branch,
// the guardrail, the curb, and flowers lying on the ground.
export const PETALS: Petal[] = [
  { at: [387.9, 4.1], angle: 177, length: 15.8, width: 8.5, color: "#e8abb9", blur: 0 },
  { at: [466, 77.6], angle: 225, length: 41.9, width: 20.7, color: "#e8abb4", blur: 0.5 },
  { at: [73.2, 478.5], angle: 32, length: 25.4, width: 12.7, color: "#e1a8b5", blur: 0.5 },
  { at: [1173.3, 546.8], angle: 335, length: 46, width: 23.8, color: "#e6a4af", blur: 1 },
  { at: [997.8, 659.8], angle: 217, length: 35.2, width: 18.2, color: "#eaafb5", blur: 1 },
  { at: [889.1, 788.1], angle: 330, length: 28.2, width: 13.7, color: "#e3a9b4", blur: 0.5 },
  { at: [1205.1, 872], angle: 38, length: 76.5, width: 35.9, color: "#e9adb4", blur: 2 },
  { at: [158.8, 872.3], angle: 214, length: 67.8, width: 23.1, color: "#e6aeb5", blur: 1.5 },
  { at: [1052.8, 889.7], angle: 330, length: 50.1, width: 25.5, color: "#e8adb3", blur: 1.5 },
  { at: [1077.4, 980.7], angle: 337, length: 31.5, width: 14.3, color: "#e3aab6", blur: 1 },
  { at: [268.7, 1124.9], angle: 212, length: 60.7, width: 27, color: "#e9adb4", blur: 1.5 },
  { at: [288.5, 1176.3], angle: 126, length: 22.1, width: 13.3, color: "#e6aab3", blur: 0.5 },
  { at: [1174.8, 1190.4], angle: 328, length: 65, width: 33.9, color: "#d8a6aa", blur: 2 },
  { at: [190.5, 1232.5], angle: 127, length: 32, width: 17.7, color: "#e6aab3", blur: 1 },
];
