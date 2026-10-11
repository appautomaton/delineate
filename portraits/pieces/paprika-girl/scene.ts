// The paprika girl: a young woman with silver and blue hair, smiling, in a dark embroidered jacket,
// at a festival of torii, paper balloons, a carp streamer, a parasol and mask, a beckoning cat, a
// doll, a frog, birds, and confetti, in the manner of Satoshi Kon's Paprika.
//
// The picture comes with plates, each painted on its own over black: the sky and far city, the
// festival, the girl, the figurines on the left, the streamer, parasol, and mask on the right, and
// the confetti. They agree with the picture in what they show, not in tone, and not always in
// place: the figurines are painted a fifth larger. Each plate is brought into the picture's frame
// (see plates.ts) and cut into regions by claims; its colors reach the drawing only through a
// transfer fitted to the picture. The picture's own map is composed from the plates' maps, back to
// front, with what Segment Anything finds in the picture itself (see segment.ts). The confetti
// plate served once, to find the pieces (see CONFETTI).
//
// Layers are planes facing the viewer at a depth in meters; the girl stands on the focus plane at
// 2 m. A piece of confetti joins the nearest layer it lies over and falls through it; a large one
// in the foreground floats by the lens.

import type { Card } from "../../harness/model/card.ts";
import type { TraceStyle } from "../../harness/trace/layer.ts";
import type { Tone } from "../../harness/trace/mask.ts";
import type { Affine } from "../../harness/trace/plate.ts";
import type { Box } from "../../harness/trace/polygon.ts";
import type { Prompt } from "../../harness/trace/sam.ts";

export type Balloon = { center: [number, number]; radius: number; pole: [number, number] };
// `inside`: the region whose group holds this one, so it moves with it. `moves`: how it moves as a
// whole, by the motion's class (see portraits/harness/stage/motion.css and motion.css here). `plate`: the
// plate that shows what the picture hides of it.
export type Region = { name: string; trace: TraceStyle; inside?: string; moves?: string; plate?: string; balloon?: Balloon };
export type Layer = { name: string; title: string; note?: string; z: number; regions: string[] };

// A claim takes pixels of a plate for a region: those Segment Anything finds from its points, or
// with no points every pixel the plate paints; only among the regions named in `within`; only
// inside its clip boxes, and inside its outline (`shape`, drawn by hand where a thing is simple);
// only of a lightness, chroma, and hue given (OKLab). `agree` keeps only what the plate shows as
// the picture does, its colors transferred, within that OKLab distance (smoothed). With `rim`,
// that test holds only within so many pixels of the plate's black, inside the boxes `where`, and
// there pixel by pixel, so loose strands of hair are taken and the scene between them is not.
// `close` shuts gaps up to twice that many pixels wide (dark outlines that read as black);
// `least` drops pieces smaller than that many pixels (the plate's own confetti, scraps).
export type Claim = { region: string; find?: Prompt[]; within?: string[]; clip?: Box[]; shape?: [number, number][]; color?: Tone[]; agree?: number; rim?: number; where?: Box[]; close?: number; least?: number };
// `clean`: the plate paints nothing over its regions where the picture's confetti lie. `hole`: the
// largest dark island, in pixels, inside its paint that is paint (deep shadow, a pupil), not black.
export type Plate = { name: string; image: URL; map?: Affine; clean?: true; hole?: number; claims: Claim[] };

const DIR = new URL("../../references/paprika-girl/", import.meta.url);
export const REFERENCE = new URL("full.png", DIR);
export const HERE = new URL("./", import.meta.url);
// The girl stands on the focus plane, 2 m from the camera: the plane that holds still as the eye
// moves.
export const FOCUS = 2;
export const MAP = new URL("regions.png", HERE); // the picture's; each plate's is regions-<plate>.png

const at = (...points: [number, number][]): Prompt[] => points.map((p) => ({ points: [p] }));

// Her hair, with the strands the wind lifts off it.
export const HAIR: Box = [420, 380, 840, 770];

export const TRACE: TraceStyle = { error: 0.009, maxTones: 64, tolerance: 0.4, soften: 0.5, flat: 3, minArea: 1.5 };
// Her face and eyes: fine steps on smooth skin, and lashes and lip lines kept to their width.
const SKIN: TraceStyle = { error: 0.004, maxTones: 96, tolerance: 0.3, soften: 0.4, flat: 1.5, minArea: 1 };
const EYES: TraceStyle = { error: 0.004, maxTones: 96, tolerance: 0.25, soften: 0.3, flat: 1.5, minArea: 0.5 };
// The festival and the far city are busy everywhere: fine outlines and small crumbs carry most of
// what they look like, finer tones little.
const CITY: TraceStyle = { error: 0.01, maxTones: 64, tolerance: 0.5, soften: 0.5, flat: 4, minArea: 3, straight: 7 };
const FESTIVAL: TraceStyle = { error: 0.012, maxTones: 64, tolerance: 0.6, soften: 0.5, flat: 4, minArea: 6, straight: 7 };
const GEOMETRIC: TraceStyle = { error: 0.016, maxTones: 24, tolerance: 1.2, soften: 1, flat: 4, minArea: 16, straight: 0 };
// For what is seen only once the planes move or part: close in shape and color, without texture.
export const HIDDEN: TraceStyle = { error: 0.04, maxTones: 16, tolerance: 1.5, soften: 1.6, flat: 10, minArea: 80, straight: 6 };

// The torii as Segment Anything finds it, beam by beam and pillar by pillar.
const TORII = at([200, 120], [420, 240], [560, 330], [70, 40], [120, 300], [30, 480], [25, 350], [300, 420], [480, 400], [440, 620]);

export const REGIONS: Region[] = [
  { name: "sky", trace: CITY, plate: "back" },
  { name: "festival", trace: FESTIVAL, plate: "med" },
  { name: "torii", trace: GEOMETRIC, plate: "med" },
  { name: "balloon-top", trace: TRACE, moves: "bob", balloon: { center: [552.5, 65.5], radius: 52.5, pole: [546, 100] } },
  { name: "balloon-mid", trace: TRACE, moves: "bob", balloon: { center: [588, 193], radius: 29, pole: [585, 209] } },
  { name: "balloon-gate", trace: TRACE, moves: "bob", balloon: { center: [298, 318.3], radius: 25, pole: [294, 335] } },
  { name: "balloon-city", trace: TRACE, moves: "bob", balloon: { center: [866, 548], radius: 28.3, pole: [861, 568] } },
  { name: "bird-gate", trace: TRACE, moves: "glide" },
  { name: "bird-cloud", trace: TRACE, moves: "glide" },
  { name: "bird-small", trace: TRACE, moves: "glide" },
  { name: "bird-tower", trace: TRACE, moves: "glide" },
  { name: "koi", trace: TRACE, moves: "sway", plate: "front-right" },
  { name: "geisha", trace: TRACE, plate: "front-right" },
  { name: "figurines", trace: TRACE, plate: "front-left" },
  { name: "girl", trace: TRACE, moves: "breathe", plate: "subject" },
  { name: "girl-head", trace: SKIN, inside: "girl", moves: "nod", plate: "subject" },
  { name: "girl-eye-l", trace: EYES, inside: "girl-head", moves: "blink", plate: "subject" },
  { name: "girl-eye-r", trace: EYES, inside: "girl-head", moves: "blink", plate: "subject" },
];

// Back to front.
export const LAYERS: Layer[] = [
  { name: "sky", title: "Sky", note: "clouds, the far city, banners on the wind", z: 60, regions: ["sky"] },
  { name: "festival", title: "Festival", note: "halls, balconies of cats, lanterns", z: 11, regions: ["festival"] },
  { name: "torii", title: "Torii", note: "the gate, in straight-edged planes", z: 8, regions: ["torii"] },
  { name: "air", title: "Air", note: "paper balloons and birds", z: 6.5, regions: ["balloon-top", "balloon-mid", "balloon-gate", "balloon-city", "bird-gate", "bird-cloud", "bird-small", "bird-tower"] },
  { name: "koi", title: "Carp streamer", note: "tied at the mouth, swimming on the wind", z: 4.5, regions: ["koi"] },
  { name: "geisha", title: "Parasol and mask", z: 3.6, regions: ["geisha"] },
  { name: "figurines", title: "Figurines", note: "the beckoning cat, the doll, the frog", z: 3, regions: ["figurines"] },
  { name: "girl", title: "The girl", note: "breathes, nods, blinks", z: 2, regions: ["girl", "girl-head", "girl-eye-l", "girl-eye-r"] },
  { name: "lens", title: "By the lens", note: "large confetti, drifting in place", z: 1.2, regions: [] },
];

export const PLATES: Plate[] = [
  // Where the sky shows; the torii is painted into it, and nothing of the sky is known there.
  { name: "back", image: new URL("back.png", DIR), claims: [{ region: "sky" }, { region: "torii", find: TORII }] },
  // The festival, and the torii again, here whole down to the foot of its pillars.
  { name: "med", image: new URL("med.png", DIR), clean: true, claims: [{ region: "festival" }, { region: "torii", find: [...TORII, ...at([540, 540], [470, 900])] }] },
  {
    name: "subject",
    image: new URL("subject.png", DIR),
    clean: true,
    claims: [
      { region: "girl", close: 3, agree: 0.08, rim: 14, where: [HAIR], least: 4000 },
      // The hair, the face, and the neck down to the collar; the head nods about the neck's foot.
      {
        region: "girl-head",
        within: ["girl"],
        find: at([600, 470], [510, 620], [770, 620], [620, 620], [610, 700], [560, 560], [690, 560]),
        clip: [HAIR],
      },
      // Each eye, lashes to lower lid, read off the picture; they blink apart, each onto its own
      // lower lid, which the tilt of her head sets at its own slant.
      { region: "girl-eye-l", within: ["girl", "girl-head"], shape: [[554, 605], [562, 590], [570, 585.5], [577.5, 582.5], [586, 583], [594.5, 587], [600, 592.5], [602, 596], [598, 599.5], [589, 604], [580, 607], [570, 607.5], [560, 607]] },
      { region: "girl-eye-r", within: ["girl", "girl-head"], shape: [[635.5, 584], [634.5, 575], [636.5, 566.5], [643, 560], [651, 557.5], [664, 557], [676.5, 559], [690, 559.5], [686, 566.5], [678, 572.5], [670, 577], [657.5, 580], [645, 582.5]] },
    ],
  },
  {
    name: "front-right",
    image: new URL("front-right.png", DIR),
    clean: true,
    claims: [
      { region: "koi", least: 3000, clip: [[995, 0, 1254, 372]] },
      { region: "geisha", least: 3000, agree: 0.12, clip: [[980, 360, 1254, 940]] },
    ],
  },
  // Painted larger than the picture shows it, around its lower left corner; mapped into the
  // picture's frame by a map fitted once (see plates.ts).
  {
    name: "front-left",
    image: new URL("front-left.png", DIR),
    map: [0.8125, -0.0033, 2.7, -0.0037, 0.8224, 202.3],
    hole: 6000,
    // Below the frog lie only confetti, which the plate paints too.
    claims: [{ region: "figurines", close: 4, least: 3000, agree: 0.1, clip: [[0, 380, 520, 1105]] }],
  },
];

// Found on the picture itself, by their points or their color. Balloons are fitted.
export const FOUND: Claim[] = [
  { region: "torii", find: TORII },
  // The figurines as the picture shows them: their plate is painted a fifth larger, and even
  // mapped into the frame it strays by several pixels about the cat's face, so it only adds to these.
  { region: "figurines", find: at([150, 620], [100, 560], [180, 780], [90, 900], [40, 840], [60, 960], [140, 1010], [100, 990]), clip: [[0, 480, 340, 1110]] },
  // The right pillar where her hair blows across it: what is red between the strands.
  { region: "torii", within: ["sky", "festival"], clip: [[422, 470, 506, 792]], color: [{ C: [0.1, 1], h: [0, 50] }] },
  { region: "bird-gate", find: at([330, 80]), clip: [[240, 0, 400, 150]] },
  { region: "bird-cloud", find: at([880, 110]), clip: [[770, 40, 980, 180]] },
  { region: "bird-small", find: at([805, 178]), clip: [[760, 140, 850, 210]] },
  { region: "bird-tower", find: at([1040, 370]), clip: [[960, 310, 1140, 430]] },
];

// The lash lines of the closed eyes, drawn while the girl blinks.
export const LIDS = ["M556 603Q580 608 600 595", "M636 582Q666 581 689 561"];

// A piece of confetti: a flat polygon of paper; `near`, by the lens.
export type Confetto = Card & { near?: true };

// Fitted once: found on the forward plate, checked against the picture and fitted there edge by
// edge, with paper color read off the picture; pieces the plate lacks added by hand, and
// pieces cut by the frame carried on past it. The large pieces in the lower half are by the lens;
// the picture paints them about as crisp as the rest (their edges rise over a pixel or two), so
// none is drawn blurred.
export const CONFETTI: Confetto[] = [
  { color: "#f73123", near: true, corners: [[120, 1199], [198, 1168], [306, 1275], [69, 1275]] },
  { color: "#f4efee", near: true, corners: [[74, 1139], [170, 1092], [196, 1169], [120, 1199]] },
  { color: "#0864ef", near: true, corners: [[30, 1215], [81, 1150], [120, 1199], [82, 1255]] },
  { color: "#6daf4d", near: true, corners: [[1064, 1181], [1137, 1233], [1096, 1293], [1023, 1242]] },
  { color: "#fcd251", near: true, corners: [[951, 1110], [1065, 1173], [1047, 1204], [939, 1152]] },
  { color: "#fbd153", near: true, corners: [[281, 1245], [384, 1182], [396, 1222], [293, 1285]] },
  { color: "#f12920", near: true, corners: [[1076, 1075], [1149, 1116], [1126, 1151], [1052, 1105]] },
  { color: "#0b69f3", near: true, corners: [[967, 1199], [1029, 1237], [1010, 1278], [927, 1278]] },
  { color: "#fdd351", corners: [[75, 213], [124, 199], [156, 247], [111, 263]] },
  { color: "#df1f22", near: true, corners: [[985, 1167], [1051, 1200], [1027, 1236], [965, 1198]] },
  { color: "#0568f5", near: true, corners: [[1148, 823], [1183, 774], [1214, 798], [1180, 841]] },
  { color: "#f3eeed", near: true, corners: [[1045, 1028], [1091, 1060], [1059, 1094], [1017, 1057]] },
  { color: "#056cf4", near: true, corners: [[-24, 1061], [66, 1055], [65, 1083], [-24, 1090]] },
  { color: "#f72f22", near: true, corners: [[868, 1222], [901, 1181], [930, 1202], [899, 1245]] },
  { color: "#1f76ed", corners: [[58, 390], [87, 375], [109, 419], [82, 433]] },
  { color: "#6db44c", corners: [[254, 1111], [290, 1137], [270, 1164], [231, 1139]] },
  { color: "#fcd04f", corners: [[401, 844], [425, 825], [446, 852], [422, 880]] },
  { color: "#066ef9", corners: [[260, 1186], [281, 1244], [276, 1245], [229, 1200]] },
  { color: "#65af47", corners: [[268, 425], [289, 441], [270, 471], [242, 450]] },
  { color: "#fcd554", corners: [[408, 1019], [437, 998], [456, 1022], [431, 1043]] },
  { color: "#0673f6", corners: [[402, 892], [421, 928], [401, 942], [382, 906]] },
  { color: "#fbd54f", corners: [[683, 243], [703, 257], [682, 286], [662, 271]] },
  { color: "#fcbb35", corners: [[763, 308], [782, 299], [790, 335], [763, 348]] },
  { color: "#fcd953", corners: [[877, 336], [895, 347], [882, 380], [857, 368]] },
  { color: "#5aac40", corners: [[90, 44], [113, 57], [101, 86], [79, 70]] },
  { color: "#fccf4b", corners: [[460, 748], [487, 735], [500, 767], [470, 777]] },
  { color: "#0373f4", corners: [[888, 1097], [908, 1113], [891, 1133], [870, 1117]] },
  { color: "#fbd045", corners: [[647, 94], [665, 104], [651, 131], [630, 121]] },
  { color: "#f9293e", corners: [[210, 1044], [226, 1060], [206, 1081], [192, 1066]] },
  { color: "#f2efef", corners: [[0, 97], [23, 85], [35, 105], [12, 123]] },
  { color: "#fb2d67", corners: [[420, 1181], [442, 1165], [454, 1183], [433, 1198]] },
  { color: "#efeceb", corners: [[462, 473], [481, 456], [498, 474], [479, 491]] },
  { color: "#fb3026", corners: [[316, 223], [332, 238], [320, 255], [300, 242]] },
  { color: "#fcd54b", corners: [[417, 42], [430, 55], [418, 72], [398, 59]] },
  { color: "#239137", corners: [[1003, 616], [1023, 625], [1012, 650], [993, 638]] },
  { color: "#fdc32a", corners: [[1207, 1039], [1226, 1058], [1213, 1070], [1194, 1051]] },
  { color: "#0976fa", corners: [[367, 248], [380, 241], [388, 262], [375, 267]] },
  { color: "#172751", corners: [[13, 614], [52, 658], [33, 677], [-6, 633]] },
  { color: "#004dd1", corners: [[953, 640], [975, 629], [1002, 678], [980, 688]] },
];
