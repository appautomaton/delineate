// Builds the paprika girl from the region maps (see segment.ts): traces every region, draws the
// balloons and confetti, and writes the layered SVG with its motion (motion.css), and the page (see
// portraits/harness/stage).
// Each layer is one group, back to front, holding a group for every region and piece of confetti
// in it.
//
// Every region continues under what lies in front of it. Where its plate shows it there, it is
// traced twice: coarsely, from the plate in the picture's colors, for what is seen only once the
// planes move or part; and finely, from the picture, for what it shows, reaching a margin under
// its neighbors in front. The sky is whole: where its plate is silent too, it is painted in from
// the colors around (see trace/fill.ts). Along the outline of whatever is in front, the plate is trusted
// only a seam inside it: what shows through a soft edge is the picture's own.
//
// Regions are traced with a bleed: the picture and maps are extended past the frame by copying
// their edges, so every layer reaches beyond the frame. Coordinates stay those of the picture.
//
//   node portraits/pieces/paprika-girl/build.ts
//   ONLY=<regex> OUT=<file.svg> node portraits/pieces/paprika-girl/build.ts   builds only the matching regions

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { rgbToLab } from "../../harness/trace/color.ts";
import { bilateral } from "../../harness/trace/filter.ts";
import { type Raster, bleed, readPng } from "../../harness/trace/image.ts";
import { type TraceStyle, type Traced, styled, traceLayer } from "../../harness/trace/layer.ts";
import { bleedLabels, readMap } from "../../harness/trace/labels.ts";
import { grow, shrink } from "../../harness/trace/mask.ts";
import { inked } from "../../harness/trace/plate.ts";
import { apply, fitTransfer } from "../../harness/trace/transfer.ts";
import { cardFootprint, cardMarkup } from "../../harness/model/card.ts";
import { fitSphere, sphereMarkup } from "../../harness/model/sphere.ts";
import { drawingMarkup, facing, fallStyle, group, layerMarkup, lids } from "../../harness/stage/drawing.ts";
import { writePage } from "../../harness/stage/page.ts";
import { PAGE } from "./page.ts";
import { pushPull } from "../../harness/trace/fill.ts";
import { markup } from "./markup.ts";
import { inFrame } from "./plates.ts";
import { CONFETTI, type Confetto, FOCUS, HAIR, HERE, HIDDEN, LAYERS, LIDS, MAP, PLATES, REFERENCE, REGIONS } from "./scene.ts";
import { findStrands, strandMarkup } from "./strands.ts";

const OUT = process.env.OUT ?? fileURLToPath(new URL("paprika-girl.svg", HERE));
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : undefined;
const MARGIN = 24; // pixels each region reaches under the regions in front of it
const BLEED = 16; // pixels drawn past the frame on every side
const SEAM = 12; // pixels inside the outline of what is in front before a plate is trusted
const NICK = 3; // the same, inside a piece of confetti, whose edge hides little

const started = Date.now();
const reference = readPng(fileURLToPath(REFERENCE));
const paint = bleed(reference, BLEED);
const { width: w, height: h } = paint;
const n = w * h;
const names = ["none", ...REGIONS.map((r) => r.name)];
const map = readMap(MAP, names);
const label = bleedLabels(map.label, map.width, map.height, BLEED);
const flat = await bilateral(paint, { passes: 1, color: 12, space: 3, diameter: 7 });
const layerOf = (i: number) => LAYERS.findIndex((l) => l.regions.includes(names[i]));

// Confetti lie over everything. Under each piece, the regions are drawn whole, so the piece can
// move away. A piece joins the nearest layer it lies over; a large one in front floats by the lens.
const shift = (c: Confetto): Confetto => ({ ...c, corners: c.corners.map(([x, y]) => [x + BLEED, y + BLEED]) });
const feet = CONFETTI.map((c) => cardFootprint(shift(c), w, h, 1.5));
const loose = new Uint8Array(n);
for (const foot of feet) foot.forEach((v, p) => (loose[p] |= v));
const joins = CONFETTI.map((c, k) => {
  if (c.near) return LAYERS.length - 1;
  let layer = 0;
  feet[k].forEach((v, p) => v && (layer = Math.max(layer, layerOf(label[p]))));
  return layer;
});
// Where her loose hair crosses what lies behind her, the picture shows each strand blended into
// it; she is drawn with the strands (see strands.ts). Behind them, the blend is no part of the
// scene: it is drawn as under a loose piece, from the region's plate or painted in from its clean
// pixels, so no smear of a strand is traced into the scene. Along her outline the blend is her
// own soft edge, and stays.
const subject = await inFrame(PLATES.find((p) => p.name === "subject")!);
const edge = grow(Uint8Array.from(label, (l) => (names[l].startsWith("girl") ? 1 : 0)), w, h, 3);
const veil = inked(bleed(subject, BLEED));
const [hx0, hy0, hx1, hy1] = HAIR.map((v) => v + BLEED);
veil.forEach((v, p) => {
  const [x, y] = [p % w, Math.floor(p / w)];
  if (v && !edge[p] && x >= hx0 && x < hx1 && y >= hy0 && y < hy1) loose[p] = 1;
});

// Each plate in the picture's coordinates and colors, plain and flattened, with its region map.
const plates = new Map<string, { paint: Raster; flat: Raster; label: Int16Array; clean: boolean }>();
for (const plate of PLATES) {
  if (!REGIONS.some((r) => r.plate === plate.name && (!ONLY || ONLY.test(r.name)))) continue;
  const raw = await inFrame(plate);
  const ink = inked(raw);
  const core = shrink(ink, raw.width, raw.height, 3);
  const map = fitTransfer(raw, reference, core, { keep: 0.6 });
  const data = Uint8Array.from(raw.data);
  for (let p = 0; p < ink.length; p++) data.set(apply(map, raw, p), p * 4);
  const tinted = bleed({ ...raw, data }, BLEED);
  plates.set(plate.name, { paint: tinted, flat: await bilateral(tinted, { passes: 1, color: 12, space: 3, diameter: 7 }), label: bleedMap(new URL(`regions-${plate.name}.png`, HERE)), clean: !!plate.clean });
}

const defs: string[] = [];
const bodies = new Map<string, string>();
for (const [r, region] of REGIONS.entries()) {
  if (ONLY && !ONLY.test(region.name)) continue;
  const i = r + 1;
  const t = Date.now();
  if (region.balloon) {
    const { center, radius, pole } = region.balloon;
    const model = fitSphere(reference, center, radius, pole);
    const { defs: d, body } = sphereMarkup(model, region.name);
    defs.push(d);
    bodies.set(region.name, body);
    console.log(`${region.name.padEnd(14)} balloon of ${model.panels} panels`);
    continue;
  }
  const nearer = Uint8Array.from(label, (l) => (l > i ? 1 : 0));
  const shown = Uint8Array.from(label, (l) => (l === i ? 1 : 0));
  // What the plate knows of the region where the picture does not show it: under what is in front,
  // and under confetti if the plate paints none there. The sky is known everywhere: what its plate
  // does not show is painted in.
  const plate = region.plate ? plates.get(region.plate) : undefined;
  const known = new Uint8Array(n);
  const scene = { paint: Uint8Array.from(paint.data), flat: Uint8Array.from(flat.data) };
  if (plate) {
    // The plate's own edges carry its neighbors' colors in their anti-aliasing.
    const own = shrink(Uint8Array.from(plate.label, (l) => (l === i ? 1 : 0)), w, h, 2);
    for (let p = 0; p < n; p++) if (own[p] && (nearer[p] || (shown[p] && loose[p])) && (plate.clean || !loose[p])) known[p] = 1;
    if (region.name === "sky") whole(known);
    for (let p = 0; p < n; p++)
      if (known[p] && own[p]) {
        scene.paint.set(plate.paint.data.subarray(p * 4, p * 4 + 4), p * 4);
        scene.flat.set(plate.flat.data.subarray(p * 4, p * 4 + 4), p * 4);
      }
  }
  const hidden = Uint8Array.from(known, (v, p) => v & nearer[p]);
  const uncovered = Uint8Array.from(nearer, (v, p) => (v || loose[p] ? 0 : 1));
  const seam = grow(uncovered, w, h, SEAM);
  const nick = grow(uncovered, w, h, NICK);
  const trusted = Uint8Array.from(known, (v, p) => (v && ((nearer[p] && !seam[p]) || (loose[p] && !nearer[p] && !nick[p])) ? 1 : 0));
  const sceneRaster = { width: w, height: h, data: scene.paint };
  const sceneFlat = { width: w, height: h, data: scene.flat };

  let paths = "";
  const sizes: string[] = [];
  const passes: [string, TraceStyle, Parameters<typeof traceLayer>[2]][] = [
    [
      `g${i}a`,
      { ...region.trace, ...HIDDEN },
      {
        own: Uint8Array.from(hidden, (v, p) => v & (loose[p] ^ 1)),
        under: Uint8Array.from(nearer, (v, p) => v & (hidden[p] ^ 1)),
        holes: Uint8Array.from(hidden, (v, p) => v & loose[p]),
        known,
        margin: MARGIN,
      },
    ],
    [
      `g${i}b`,
      region.trace,
      {
        own: Uint8Array.from(shown, (v, p) => v & (loose[p] ^ 1)),
        under: nearer,
        holes: Uint8Array.from(shown, (v, p) => v & loose[p]),
        known: trusted,
        margin: MARGIN,
      },
    ],
  ];
  for (const [prefix, style, masks] of passes) {
    if (!masks.own.some((v) => v)) continue;
    const traced: Traced | undefined = await traceLayer(sceneRaster, sceneFlat, { ...masks, ...styled(style, BLEED) });
    if (!traced) continue;
    const { defs: d, paths: p } = markup(traced.pieces, prefix);
    if (d) defs.push(d);
    paths += (paths ? "\n" : "") + p;
    sizes.push(`${traced.tones} tones, ${traced.pieces.length} pieces, ${Math.round((p.length + d.length) / 1024)} KB`);
  }
  if (!paths) continue;
  bodies.set(region.name, paths);
  console.log(`${region.name.padEnd(14)} ${sizes.join(" + ").padEnd(36)} ${((Date.now() - t) / 1000).toFixed(1)}s`);

  // The sky's plate is silent under the torii it paints and wherever the festival stands. Under
  // a piece of confetti the sky is painted in from what is around it; behind the torii and the
  // festival, from its open sky and clouds only, so it reads as sky going on, not as a smear of
  // the city's colors.
  function whole(known: Uint8Array) {
    const source = Uint8Array.from(label, (l, p) => ((l === i && !loose[p]) || known[p] ? 1 : 0));
    const clear = shrink(source, w, h, 2);
    const layered = { width: w, height: h, data: Uint8Array.from(paint.data) };
    for (let p = 0; p < n; p++) if (known[p]) layered.data.set(plate!.paint.data.subarray(p * 4, p * 4 + 4), p * 4);
    const open = Uint8Array.from(clear, (v, p) => {
      if (!v) return 0;
      const [L, a, b] = rgbToLab(layered.data[p * 4], layered.data[p * 4 + 1], layered.data[p * 4 + 2]);
      return (b < -0.06 && L > 0.45) || (L > 0.88 && Math.hypot(a, b) < 0.04) ? 1 : 0;
    });
    const near = pushPull(layered, clear);
    const far = pushPull(layered, open);
    for (let p = 0; p < n; p++)
      if (!clear[p] && (nearer[p] || loose[p]) && !known[p]) {
        const from = (nearer[p] ? far : near).data.subarray(p * 4, p * 4 + 4);
        scene.paint.set(from, p * 4);
        scene.flat.set(from, p * 4);
        known[p] = 1;
      }
  }
}

// Drawn over a region's own groups: her loose strands, and the lash lines over the eyes.
const her = Uint8Array.from(map.label, (l) => (names[l].startsWith("girl") ? 1 : 0));
const strands = !ONLY || ONLY.test("girl-head") ? strandMarkup(findStrands(reference, subject, her, HAIR)) : "";
const over = new Map([["girl-head", strands + lids(LIDS)]]);

const layers = LAYERS.map((layer, l) => {
  const draw = (name: string): string => {
    const { moves } = REGIONS.find((r) => r.name === name)!;
    const nested = REGIONS.filter((r) => r.inside === name).map((r) => draw(r.name));
    return group(name, (bodies.get(name) ?? "") + nested.join("") + (over.get(name) ?? ""), { classes: moves ? `moving ${moves}` : "" });
  };
  const parts = REGIONS.filter((r) => layer.regions.includes(r.name) && !r.inside).map((r) => draw(r.name));
  // Within a layer, larger pieces lie nearer, so they are drawn later.
  const area = (c: Confetto) => Math.abs(c.corners.reduce((s, [x, y], j) => s + x * c.corners[(j + 1) % c.corners.length][1] - y * c.corners[(j + 1) % c.corners.length][0], 0));
  const order = CONFETTI.map((_, k) => k).sort((a, b) => area(CONFETTI[a]) - area(CONFETTI[b]));
  for (const k of order) {
    const c = CONFETTI[k];
    if (joins[k] !== l || (ONLY && !ONLY.test(`confetti-${k}`))) continue;
    const { defs: d, body } = cardMarkup(c, `confetti-${k}`);
    if (d) defs.push(d);
    // Where the piece's center is, and how far past the frame it must fall to be gone.
    const xs = c.corners.map((p) => p[0]);
    const ys = c.corners.map((p) => p[1]);
    const [cx, cy] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
    const m = Math.ceil(Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2) + 4;
    // Nearer pieces fall faster; each piece keeps its own pace. Those by the lens hover: falling,
    // they would sweep across her.
    const dur = (c.near ? 13 : 9 + 2.2 * layer.z ** 0.5) + ((k * 7) % 5);
    parts.push(group(`confetti-${k}`, body, { classes: c.near ? "loose hover" : "loose fall", style: fallStyle([cx, cy], m, reference.height, dur) }));
  }
  return layerMarkup({ ...layer, plane: facing(layer.z) }, parts);
});

const svg = drawingMarkup({
  width: reference.width,
  height: reference.height,
  title: "Paprika: a smiling young woman with silver and blue hair at a festival of torii, paper balloons, a carp streamer, and confetti",
  focus: FOCUS,
  motion: readFileSync(new URL("motion.css", HERE), "utf8"),
  defs,
  layers,
});
writeFileSync(OUT, svg);
if (!process.env.OUT) writePage(HERE, PAGE, svg);
console.log(`${(svg.length / 1e6).toFixed(2)} MB in ${((Date.now() - started) / 1000).toFixed(1)}s`);

// A region map, read and bled like the paint.
function bleedMap(url: URL): Int16Array {
  const map = readMap(url, names);
  return bleedLabels(map.label, map.width, map.height, BLEED);
}
