// The Paprika portrait as a scene. It is cut into layers, each a plane at one depth that moves as
// a whole under parallax; depth is in meters from the camera, with the dreamer on the focus plane
// at 2 m. A thing gets a layer of its own only if it stands at a depth of its own. Inside a layer,
// each thing, and each part of a thing that moves on its own (a head that nods, eyes that blink),
// is a named group that motion can take hold of.
//
// Things are found in the reference by Segment Anything, from points inside them; a thing is the
// union of what its points find, which holds together better than one prompt with many points.
// Parts are cut from their thing the same way, back to front, each kept inside its clip boxes;
// whatever of the thing no later part claims goes to its first part. Balloons need no search:
// their geometry is fitted directly. Confetti are simple enough to be drawn outright. Whatever
// nothing claims is the backdrop.

import type { Cat, Lantern } from "./crowd.ts";
import type { Card } from "../../harness/model/card.ts";
import type { TraceStyle } from "../../harness/trace/layer.ts";
import type { Box } from "../../harness/trace/polygon.ts";
import type { Prompt } from "../../harness/trace/sam.ts";

// `inside`: the part whose group holds this one, so it moves with it. `moves`: how a thing or part
// moves as a whole, by the motion's class (see portraits/harness/stage/motion.css and motion.css here).
export type Part = { name: string; find: Prompt[]; clip?: Box[]; trace?: TraceStyle; inside?: string; moves?: string };
export type Balloon = { center: [number, number]; radius: number; pole: [number, number] };
export type Thing = { name: string; find?: Prompt[]; parts?: Part[]; trace?: TraceStyle; balloon?: Balloon; moves?: string };
export type Layer = { name: string; title: string; note?: string; z: number; things: Thing[] };

// The crowd the plate shows behind the dreamer, read off the plate: one cat and one lantern,
// placed again and again (see crowd.ts). It stands in the backdrop, over the plate's coarse trace.
export const CROWD: { cats: Cat[]; lanterns: Lantern[] } = {
  cats: [
    { at: [327, 815], size: 60 },
    { at: [375, 748], size: 34 },
    { at: [415, 855], size: 40 },
    { at: [520, 885], size: 36, flip: true },
    { at: [235, 875], size: 34, flip: true },
    { at: [617, 965], size: 30 },
    { at: [655, 985], size: 28, flip: true },
    { at: [682, 997], size: 26 },
    { at: [710, 1005], size: 25, flip: true },
    { at: [327, 1050], size: 56, koban: true },
    { at: [230, 1035], size: 30, flip: true },
    { at: [412, 1108], size: 34, coat: "#d8692e" },
    { at: [458, 1100], size: 40, koban: true, flip: true },
    { at: [500, 1155], size: 28 },
    { at: [590, 1215], size: 28, flip: true },
    { at: [722, 1020], size: 25 },
    { at: [775, 1032], size: 36, flip: true },
    { at: [812, 1047], size: 25 },
    { at: [872, 1060], size: 38 },
    { at: [917, 1077], size: 32, flip: true },
    { at: [1200, 1070], size: 22 },
    { at: [1230, 1075], size: 22, flip: true },
  ],
  lanterns: [
    { at: [535, 1050], width: 80 },
    { at: [610, 1122], width: 75 },
    { at: [730, 1187], width: 55 },
    { at: [800, 1209], width: 50 },
    { at: [857, 1226], width: 45 },
    { at: [912, 1238], width: 45 },
  ],
};

// The lash lines of the closed eyes, drawn while the dreamer blinks.
export const LIDS = ["M482 423Q520 433 557 423", "M642 418Q684 425 726 410"];

// A piece of confetti: a flat polygon of paper, and the blur that puts it out of focus when it lies
// close to the lens. Blurred pieces make the foreground; sharp ones join the layer they are seen
// against.
export type Confetto = Card;

const at = (...points: [number, number][]): Prompt[] => points.map((p) => ({ points: [p] }));

// The dreamer stands on the focus plane, 2 m from the camera: the plane that holds still as the eye
// moves.
export const FOCUS = 2;

export const REFERENCE = new URL("../../references/paprika-portrait.png", import.meta.url);
export const REGIONS = new URL("./regions.png", import.meta.url);

// The sharp plate: the same picture with nothing out of focus. Where a blurred piece of confetti
// smears the reference, it shows what lies under the smear, edges and all.
export const SHARP = {
  image: new URL("../../references/paprika-portrait-no-blur.png", import.meta.url),
  map: new URL("./regions-sharp.png", import.meta.url),
};

// The background plate: the same picture with the dreamer taken out and the scene behind him
// painted in, aligned with the reference. It supplies what lies behind the dreamer, where the
// reference shows only him; it is cut into regions like the reference, into its own map.
export const PLATE = {
  image: new URL("../../references/paprika-portrait-background.png", import.meta.url),
  map: new URL("./regions-behind.png", import.meta.url),
  without: "dreamer",
};

export const TRACE: TraceStyle = { error: 0.009, maxTones: 64, tolerance: 0.4, soften: 0.5, flat: 3, minArea: 1.5 };
export const BACKDROP_TRACE: TraceStyle = { error: 0.016, maxTones: 64, tolerance: 0.6, soften: 0.9, flat: 6, minArea: 10, straight: 7 };
// For what is seen only once the planes move or part: the scene behind the dreamer. Close enough in
// shape and color, without its texture.
export const HIDDEN_TRACE: TraceStyle = { error: 0.03, maxTones: 24, tolerance: 1, soften: 1.2, flat: 8, minArea: 40, straight: 6 };
// For built things of straight members: few tones, straight edges, no crumbs.
export const GEOMETRIC: TraceStyle = { error: 0.02, maxTones: 16, tolerance: 1.6, soften: 1.2, flat: 4, minArea: 24, straight: 0 };

// Back to front. The backdrop is whatever nothing else claims.
export const LAYERS: Layer[] = [
  { name: "backdrop", title: "Backdrop", note: "sky, clouds, the city, the crowds", z: 60, things: [] },
  { name: "torii", title: "Torii", note: "the gate, in straight-edged planes", z: 9, things: [{ name: "torii", trace: GEOMETRIC, find: at([150, 80], [330, 170], [250, 360], [380, 430], [60, 450], [420, 440], [460, 640]) }] },
  {
    name: "air",
    title: "Air",
    note: "paper balloons, birds, far confetti",
    z: 8,
    things: [
      { name: "bird-small", find: at([815, 175]), moves: "glide" },
      { name: "balloon-low", balloon: { center: [296.9, 319], radius: 24, pole: [293, 337.5] }, moves: "bob" },
      { name: "balloon-high", balloon: { center: [552.5, 65.1], radius: 53.1, pole: [546, 103] }, moves: "bob" },
      { name: "bird-cloud", find: at([870, 110]), moves: "glide" },
      { name: "balloon-near", balloon: { center: [865.4, 547.9], radius: 28.3, pole: [860, 570] }, moves: "bob" },
      { name: "bird-crest", find: at([320, 70]), moves: "glide" },
      { name: "bird-tower", find: at([1050, 370]), moves: "glide" },
    ],
  },
  { name: "koi", title: "Carp streamer", note: "tied at the mouth, swimming on the wind", z: 6, things: [{ name: "koi", find: at([1130, 150], [1200, 60]), moves: "sway" }] },
  {
    name: "geisha",
    title: "Parasol and mask",
    z: 4.5,
    things: [
      { name: "parasol", find: at([1150, 480], [1060, 450], [1220, 420]) },
      { name: "mask", find: at([1180, 640], [1150, 700], [1165, 590]) },
    ],
  },
  {
    name: "figurines",
    title: "Figurines",
    note: "the beckoning cat, the doll, the frog",
    z: 3.2,
    things: [
      { name: "cat", find: at([150, 680], [250, 740], [110, 560], [260, 620], [180, 800], [100, 755], [270, 780]) },
      { name: "doll", find: at([110, 900], [60, 820], [50, 960]) },
      { name: "frog", find: at([120, 1000], [90, 990]) },
    ],
  },
  {
    name: "dreamer",
    title: "The dreamer",
    note: "breathes, nods, blinks",
    z: 2,
    things: [
      {
        name: "dreamer",
        find: at([620, 420], [600, 950], [600, 220], [560, 800], [440, 480], [980, 880], [760, 840], [1180, 1200], [330, 1000], [370, 1080], [470, 1150], [900, 1000], [700, 1220], [1150, 1110], [1185, 1215]),
        parts: [
          { name: "body", find: [], moves: "breathe" },
          { name: "head", trace: { error: 0.005, flat: 1.5 }, moves: "nod", find: at([600, 200], [450, 350], [800, 330], [620, 440], [700, 300], [600, 700], [445, 475], [805, 460], [437, 500], [791, 511]) },
          {
            name: "eyes",
            inside: "head",
            moves: "blink",
            find: at([520, 416], [495, 410], [545, 420], [685, 405], [655, 400], [712, 405]),
            clip: [
              [476, 394, 564, 438],
              [634, 383, 733, 428],
            ],
          },
        ],
      },
    ],
  },
  { name: "foreground", title: "Foreground", note: "confetti at the lens, out of focus", z: 1, things: [] },
];

// Fitted once (paper color and blur to the reference; the corners of blurred pieces to the sharp
// plate, where their edges are crisp), and drawn from here on.
export const CONFETTI: Confetto[] = [
  { color: "#338633", corners: [[89, 47], [110, 58], [100, 86], [82, 71]] },
  { color: "#cfaf96", corners: [[22, 85], [33, 102], [11, 119], [-2, 97]] },
  { color: "#efe0c9", corners: [[197, 7], [202, 17], [192, 23], [185, 14]] },
  { color: "#f7c453", corners: [[123, 200], [156, 247], [111, 263], [75, 213]] },
  { color: "#f42a1c", corners: [[315, 220], [332, 239], [320, 257], [295, 246]] },
  { color: "#5c81e3", corners: [[380, 248], [385, 263], [373, 265], [368, 246]] },
  { color: "#3174d9", corners: [[85, 377], [109, 422], [81, 434], [58, 392]] },
  { color: "#f4cf92", corners: [[416, 43], [427, 54], [416, 74], [403, 56]] },
  { color: "#fabb38", corners: [[650, 86], [664, 93], [652, 119], [635, 109]] },
  { color: "#f6cd5b", corners: [[896, 343], [887, 373], [865, 375], [871, 346]] },
  { color: "#2d3242", corners: [[6, 607], [51, 658], [33, 677], [-2, 647]] },
  { color: "#71a344", corners: [[267, 426], [286, 441], [268, 471], [245, 448]] },
  { color: "#d3c2cb", corners: [[441, 645], [455, 656], [439, 677], [425, 667]] },
  { color: "#f2c44d", corners: [[502, 636], [513, 681], [484, 685], [470, 639]] },
  { color: "#f9d781", corners: [[840, 491], [843, 506], [828, 516], [825, 500]] },
  { color: "#3b913f", corners: [[1008, 614], [1014, 616], [1020, 628], [1013, 649], [1011, 651], [994, 640], [997, 632], [997, 622]] },
  { color: "#1451a2", corners: [[977, 629], [1002, 678], [981, 687], [954, 641]] },
  { color: "#ea304c", corners: [[205, 1035], [220, 1048], [198, 1075], [185, 1059]] },
  { color: "#679039", corners: [[236, 1114], [279, 1139], [266, 1159], [220, 1134]] },
  { color: "#2a6ed2", corners: [[651, 1124], [671, 1141], [648, 1168], [624, 1153]] },
  { color: "#3f3d49", corners: [[924, 835], [952, 851], [932, 871], [899, 857]] },
  { color: "#f2c655", blur: 2.7, corners: [[342, 808], [371, 845], [339, 872], [308, 834]] },
  { color: "#f8e2d9", blur: 4, corners: [[161, 1073], [184, 1162], [109, 1188], [60, 1107]] },
  { color: "#1f67cf", blur: 2.5, corners: [[82, 1140], [111, 1185], [72, 1257], [24, 1207]] },
  { color: "#dc2b21", blur: 4.9, corners: [[254, 1218], [251, 1265], [68, 1249], [172, 1154]] },
  { color: "#f5c14f", blur: 3.2, corners: [[297, 1203], [297, 1344], [171, 1240], [253, 1219]] },
  { color: "#1867d2", blur: 1.9, corners: [[65, 1055], [62, 1083], [-4, 1088], [0, 1057]] },
  { color: "#195ec8", blur: 3.6, corners: [[1199, 913], [1165, 1000], [1113, 1010], [1159, 911]] },
  { color: "#f8db98", blur: 3.8, corners: [[1002, 1096], [1094, 1152], [1091, 1189], [985, 1134]] },
  { color: "#cf2b27", blur: 3, corners: [[1015, 1139], [1125, 1175], [1049, 1230], [990, 1194]] },
  { color: "#79a73d", blur: 4.9, corners: [[1101, 1174], [1167, 1234], [1101, 1269], [1049, 1230]] },
  { color: "#1c61c8", blur: 3, corners: [[990, 1193], [1100, 1262], [970, 1257], [968, 1249]] },
  { color: "#2a70c9", blur: 5.4, corners: [[1241, 764], [1180, 839], [1149, 824], [1178, 782]] },
];
