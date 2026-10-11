// Builds the Paprika portrait from the region map (see segment.ts): traces every region, draws
// the balloons and confetti, and writes the layered SVG with its motion (motion.css). Each layer
// is one group, back to front, holding a group for every thing, part, and piece of confetti in it.
// The page gets the SVG inlined (see portraits/harness/stage), so it opens from disk.
//
// Behind the dreamer, the reference shows only him. There, every region behind him is drawn from
// the background plate instead: it continues under him with what the scene really holds, not with
// colors guessed from its edges.
//
// Regions are traced with a bleed: the reference and the map are extended past the frame by
// copying their edges, so every layer reaches beyond the frame and can move without baring it.
// Coordinates stay those of the reference.
//
//   node portraits/pieces/paprika/build.ts
//   ONLY=<regex> OUT=<file.svg> node portraits/pieces/paprika/build.ts   builds only the matching regions

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { bilateral } from "../../harness/trace/filter.ts";
import { bleed, readPng } from "../../harness/trace/image.ts";
import { type TraceStyle, type Traced, styled, traceLayer } from "../../harness/trace/layer.ts";
import { bleedLabels, readMap, spread } from "../../harness/trace/labels.ts";
import { close, grow } from "../../harness/trace/mask.ts";
import { markup } from "../../harness/trace/svg.ts";
import { cardFootprint, cardMarkup, cardShape } from "../../harness/model/card.ts";
import { defocus } from "../../harness/model/shape.ts";
import { fitSphere, sphereMarkup } from "../../harness/model/sphere.ts";
import { drawingMarkup, facing, fallStyle, group, layerMarkup, lids } from "../../harness/stage/drawing.ts";
import { writePage } from "../../harness/stage/page.ts";
import { PAGE } from "./page.ts";
import { placements, symbols } from "./crowd.ts";
import { declared } from "./regions.ts";
import { CONFETTI, type Confetto, CROWD, FOCUS, HIDDEN_TRACE, LAYERS, LIDS, PLATE, REFERENCE, REGIONS, SHARP } from "./scene.ts";

const HERE = new URL("./", import.meta.url);
const OUT = process.env.OUT ?? fileURLToPath(new URL("paprika.svg", HERE));
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : undefined;
const MARGIN = 24; // pixels each region reaches under the regions in front of it
const BLEED = 16; // pixels drawn past the frame on every side

const started = Date.now();
const reference = readPng(fileURLToPath(REFERENCE));
const paint = bleed(reference, BLEED);
const { width: w, height: h } = paint;
const regions = declared();
const label = bleedMap(REGIONS);
const shift = (c: Confetto): Confetto => ({ ...c, corners: c.corners.map(([x, y]) => [x + BLEED, y + BLEED]) });

// Where a blurred piece of confetti smears the reference, what lies behind the smear is drawn
// instead, and the piece, drawn with its blur on top, puts the smear back. Behind a thin smear the
// reference itself still shows it: knowing each piece's shape, color, and blur, the pieces are
// taken back out of it. Behind a thick smear too little is left, and the sharp plate shows it.
// The regions there come from both maps: segmentation tends to drop pieces of a thing next to the
// confetti rather than add to it, so where the maps disagree the nearer region wins, gaps in a
// region narrower than the smear are closed, and what both call backdrop takes the region around
// the smear (outside the frame counts as unknown too). Under each piece, the region is whatever
// surrounds it.
const smeared = new Uint8Array(w * h);
const soft = CONFETTI.filter((c) => c.blur).sort((a, b) => a.blur! - b.blur!).map(shift); // back to front
for (const c of soft) cardFootprint(c, w, h).forEach((v, p) => (smeared[p] |= v));
const { through, added } = defocus(soft.map(cardShape), w, h);
const sharp = bleed(readPng(fileURLToPath(SHARP.image)), BLEED);
const sharpLabel = bleedMap(SHARP.map);
const CORE = 5; // pixels past a blurred piece's corners that count as the piece, for small errors in them
const PAPER = 55; // RGB distance within which the sharp plate shows a piece's own paper
const THIN = 0.7; // at least this much of the background seen: the reference alone recovers it
const THICK = 0.3; // at most this much: the sharp plate alone
// Behind a thick smear, where the sharp plate shows a piece's own paper, the pixel is the piece's.
const papers = soft.map((c) => ({ rgb: [1, 3, 5].map((i) => parseInt(c.color.slice(i, i + 2), 16)), foot: cardFootprint(c, w, h) }));
const cores = new Uint8Array(w * h);
for (const c of soft) cardFootprint(c, w, h, CORE).forEach((v, p) => (cores[p] |= v));
for (let p = 0; p < smeared.length; p++) {
  if (!smeared[p]) continue;
  label[p] = Math.max(label[p], sharpLabel[p]);
  const t = through[p];
  const trust = Math.max(0, Math.min(1, (t - THICK) / (THIN - THICK)));
  const s = sharp.data.subarray(p * 4, p * 4 + 3);
  if (trust < 1 && papers.some(({ rgb, foot }) => foot[p] && Math.hypot(s[0] - rgb[0], s[1] - rgb[1], s[2] - rgb[2]) < PAPER)) cores[p] = 1;
  for (let k = 0; k < 3; k++) {
    const recovered = Math.max(0, Math.min(255, (paint.data[p * 4 + k] - added[k][p]) / Math.max(t, 1e-3)));
    paint.data[p * 4 + k] = Math.round(trust * recovered + (1 - trust) * sharp.data[p * 4 + k]);
  }
}
const GAP = 12; // the widest gap, in pixels, closed in a region inside a smear
for (let i = 1; i < regions.length; i++) {
  const own = Uint8Array.from(label, (l) => (l === i ? 1 : 0));
  if (!own.some((v, p) => v && smeared[p])) continue;
  const closed = close(own, w, h, GAP);
  for (let p = 0; p < label.length; p++) if (smeared[p] && closed[p] && label[p] < i) label[p] = i;
}
const unknown = Uint8Array.from(smeared, (v, p) => {
  const x = p % w;
  const y = (p - x) / w;
  return v || x < BLEED || y < BLEED || x >= w - BLEED || y >= h - BLEED ? 1 : 0;
});
const around = Int16Array.from(label);
spread(around, unknown, w);
for (let p = 0; p < label.length; p++) if (smeared[p] && label[p] === 0) label[p] = around[p];
spread(label, cores, w);
const flat = await bilateral(paint, { passes: 1, color: 12, space: 3, diameter: 7 });

// The scene without the dreamer: the reference, with the plate wherever the dreamer was.
const behind = bleedMap(PLATE.map);
const plate = bleed(readPng(fileURLToPath(PLATE.image)), BLEED);
const plateFlat = await bilateral(plate, { passes: 1, color: 12, space: 3, diameter: 7 });
const removed = regions.map((r) => r.name === PLATE.without || r.name.startsWith(`${PLATE.without}-`));
const revealed = Uint8Array.from(label, (l) => (removed[l] ? 1 : 0));
// Along the dreamer's outline, what shows through his soft edge is the reference's own scene, not
// the plate's: the plate is trusted only a few pixels inside the outline, and the band between is
// painted in from both sides.
const SEAM = 12;
const seam = grow(Uint8Array.from(revealed, (v) => 1 - v), w, h, SEAM);
const trusted = Uint8Array.from(revealed, (v, p) => (v && !seam[p] ? 1 : 0));
const [scene, sceneFlat] = [paint, flat].map((r, k) => {
  const data = Uint8Array.from(r.data);
  const from = [plate, plateFlat][k].data;
  for (let p = 0; p < revealed.length; p++) if (revealed[p]) data.set(from.subarray(p * 4, p * 4 + 4), p * 4);
  return { ...r, data };
});
// Confetti lie over the regions. Under each piece, the region it covers is drawn whole, so the
// piece can fall away; a sharp piece joins the nearest layer it covers, a blurred one the last.
// Within a layer the softer pieces lie nearer the lens, so they are drawn later. Over the sharp
// plate, a blurred piece covers only its own shape.
const feet = CONFETTI.map((c) => cardFootprint(shift(c), w, h, c.blur ? CORE : 1));
const loose = new Uint8Array(w * h);
for (const foot of feet) for (let p = 0; p < loose.length; p++) loose[p] |= foot[p];
for (let p = 0; p < loose.length; p++) loose[p] |= cores[p];
const joins = CONFETTI.map((c, k) => {
  if (c.blur) return LAYERS.length - 1;
  let layer = 0;
  for (let p = 0; p < loose.length; p++) if (feet[k][p]) layer = Math.max(layer, regions[label[p]].layer);
  return layer;
});

const defs: string[] = [symbols()];
const bodies = new Map<string, string>();
// Drawn between a region's hidden and shown passes: the crowd the plate shows behind the dreamer.
const between = new Map([["backdrop", placements(CROWD.cats, CROWD.lanterns)]]);
for (const [i, region] of regions.entries()) {
  if (ONLY && !ONLY.test(region.name)) continue;
  const t = Date.now();
  if (region.balloon) {
    const { center, radius, pole } = region.balloon;
    const model = fitSphere(reference, center, radius, pole);
    const { defs: d, body } = sphereMarkup(model, region.name);
    defs.push(d);
    bodies.set(region.name, body);
    console.log(`${region.name.padEnd(16)} balloon of ${model.panels} panels`);
    continue;
  }
  // What the reference shows of the region, traced finely; under the dreamer it reaches into the
  // plate's own colors for the region. Beneath it, what the plate shows of the region where the
  // dreamer stands, traced coarsely: that is seen only once the planes move or part.
  const front = removed[i];
  const hidden = Uint8Array.from(label, (_, p) => (!front && revealed[p] && behind[p] === i ? 1 : 0));
  const passes: [string, TraceStyle, Parameters<typeof masksOf>[0]][] = [
    [`${region.name}-behind-`, { ...region.trace, ...HIDDEN_TRACE }, "hidden"],
    [`${region.name}-`, region.trace, "shown"],
  ];
  let paths = "";
  let pieces = 0;
  for (const [prefix, settings, which] of passes) {
    const traced = await trace(settings, masksOf(which));
    if (!traced) continue;
    const { defs: d, paths: p } = markup(traced.pieces, prefix);
    if (d) defs.push(d);
    paths += (paths ? "\n" : "") + p;
    pieces += traced.pieces.length;
    if (which === "hidden" && between.has(region.name)) paths += "\n" + between.get(region.name);
  }
  if (!paths) continue;
  bodies.set(region.name, paths);
  console.log(`${region.name.padEnd(16)} ${String(pieces).padStart(5)} pieces ${((Date.now() - t) / 1000).toFixed(1)}s`);

  function masksOf(which: "hidden" | "shown") {
    if (which === "hidden")
      return {
        own: Uint8Array.from(hidden, (v, p) => (v && !loose[p] ? 1 : 0)),
        under: Uint8Array.from(label, (_, p) => (revealed[p] && behind[p] > i ? 1 : 0)),
        holes: Uint8Array.from(loose, (v, p) => (v && hidden[p] ? 1 : 0)),
      };
    return {
      own: Uint8Array.from(label, (l, p) => (l === i && !loose[p] ? 1 : 0)),
      under: Uint8Array.from(label, (l) => (l > i ? 1 : 0)),
      holes: Uint8Array.from(loose, (v, p) => (v && label[p] === i ? 1 : 0)),
      known: Uint8Array.from(hidden, (v, p) => v & trusted[p]),
    };
  }
  function trace(style: TraceStyle, masks: ReturnType<typeof masksOf>): Promise<Traced | undefined> {
    const [p, f] = front ? [paint, flat] : [scene, sceneFlat];
    return traceLayer(p, f, { ...masks, margin: MARGIN, ...styled(style, BLEED) });
  }
}

// Drawn over a region's own groups: the lash lines over the eyes.
const over = new Map([["dreamer-head", lids(LIDS)]]);

const layers = LAYERS.map((layer, l) => {
  const draw = (name: string): string => {
    const { moves } = regions.find((r) => r.name === name)!;
    const nested = regions.filter((r) => r.inside === name).map((r) => draw(r.name));
    return group(name, (bodies.get(name) ?? "") + nested.join("") + (over.get(name) ?? ""), { classes: moves ? `moving ${moves}` : "" });
  };
  const parts = regions.filter((r) => r.layer === l && !r.inside).map((r) => draw(r.name));
  const near = CONFETTI.map((_, k) => k).sort((a, b) => (CONFETTI[a].blur ?? 0) - (CONFETTI[b].blur ?? 0));
  for (const k of near) {
    const c = CONFETTI[k];
    if (joins[k] !== l || (ONLY && !ONLY.test(`confetti-${k}`))) continue;
    const { defs: d, body } = cardMarkup(c, `confetti-${k}`);
    if (d) defs.push(d);
    // Where the piece's center is, and how far past the frame it must fall to be gone.
    const xs = c.corners.map((p) => p[0]);
    const ys = c.corners.map((p) => p[1]);
    const [cx, cy] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
    const m = Math.ceil(Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 3 * (c.blur ?? 0)) + 4;
    // Nearer pieces fall faster; each piece keeps its own pace. Blurred ones by the lens hover:
    // falling, they would sweep across the dreamer's face.
    const dur = (c.blur ? 14 : 9 + 2.2 * layer.z ** 0.5) + ((k * 7) % 5);
    parts.push(group(`confetti-${k}`, body, { classes: c.blur ? "loose hover" : "loose fall", style: fallStyle([cx, cy], m, reference.height, dur) }));
  }
  return layerMarkup({ ...layer, plane: facing(layer.z) }, parts);
});

const svg = drawingMarkup({
  width: reference.width,
  height: reference.height,
  title: "Paprika: a smiling young man at a festival of torii, paper balloons, a carp streamer, and confetti",
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
  const map = readMap(url, regions.map((r) => r.name));
  return bleedLabels(map.label, map.width, map.height, BLEED);
}
