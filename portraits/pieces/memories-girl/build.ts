// Builds the girl on the hillside from the region maps (see segment.ts): traces every region, draws
// the petals, and writes the layered SVG with its motion (motion.css), and the page with it inlined
// (see portraits/harness/stage), so the page opens from disk. Each layer is one group, back to front, holding
// a group for every region in it; the petals are one symbol placed many times.
//
// Every region continues under the regions in front of it. A margin's worth is drawn as part of
// what the picture shows of it. Beyond that, where its plate paints it, it is drawn on in a second,
// coarser pass beneath: what the picture hides, seen only once the planes move or part, in the
// plate's own paint carried into the picture's colors. The sky and the distance are the backdrop,
// so they are drawn whole: the sky over the full frame, the distance everywhere below the ridge,
// painted in from their own pixels where no plate has them, so that no view through the planes,
// however far apart, finds nothing behind them. The sky's plate is repainted with other clouds, so
// the sky is painted in from the picture's own sky alone.
//
// Regions are traced with a bleed: the picture, the plates, and the maps are extended past the
// frame by copying their edges, so every layer reaches beyond the frame and can move without baring
// it. Coordinates stay those of the picture.
//
//   node portraits/pieces/memories-girl/build.ts
//   ONLY=<regex> OUT=<file.svg> node portraits/pieces/memories-girl/build.ts   builds only the matching regions

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { bilateral } from "../../harness/trace/filter.ts";
import { type Raster, bleed, readPng } from "../../harness/trace/image.ts";
import { bleedLabels, readMap } from "../../harness/trace/labels.ts";
import { type LayerSpec, type TraceStyle, type Traced, styled, traceLayer } from "../../harness/trace/layer.ts";
import { pushPull } from "../../harness/trace/fill.ts";
import { grow, shrink } from "../../harness/trace/mask.ts";
import { opaque } from "../../harness/trace/plate.ts";
import { markup } from "../../harness/trace/svg.ts";
import { type Transfer, apply, fitTransfer } from "../../harness/trace/transfer.ts";
import { blurFilters, spriteFootprint, spriteMarkup, symbolOf } from "../../harness/model/sprite.ts";
import { drawingMarkup, fallStyle, group, layerMarkup, lids } from "../../harness/stage/drawing.ts";
import { writePage } from "../../harness/stage/page.ts";
import { PAGE } from "./page.ts";
import { PETAL } from "./petal.ts";
import { inFrame } from "./plates.ts";
import { FOCUS, HERE, HIDDEN, LAYERS, LIDS, MAP, PETALS, PLATES, REFERENCE, REGIONS, plateMap } from "./scene.ts";

const OUT = process.env.OUT ?? fileURLToPath(new URL("memories-girl.svg", HERE));
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : undefined;
const BLEED = 16; // pixels drawn past the frame on every side
const MARGIN = 24; // pixels each region reaches under the regions in front of it
// Regions that move on their own reach farther: the clouds drift, the branch and the bloom sway.
const REACH: Record<string, number> = { clouds: 44, branch: 32 };
const SEAM = 12; // along a region's outline, what shows through its soft edge is the picture's, not the plate's

const started = Date.now();
const reference = readPng(fileURLToPath(REFERENCE));
const paint = bleed(reference, BLEED);
const { width: w, height: h } = paint;
const n = w * h;
const names = ["none", ...REGIONS.map((r) => r.name)];
const bleedMap = (url: URL) => {
  const map = readMap(url, names);
  return bleedLabels(map.label, map.width, map.height, BLEED);
};
const label = bleedMap(MAP);
const flat = await bilateral(paint, { passes: 1, color: 12, space: 3, diameter: 7 });

// The petals lie over the regions; under each, the region it covers is drawn whole, so the petal
// can fall away.
const loose = new Uint8Array(n);
for (const petal of PETALS) spriteFootprint(PETAL, { ...petal, at: [petal.at[0] + BLEED, petal.at[1] + BLEED] }, w, h, 2).forEach((v, p) => (loose[p] |= v));

// Each plate in the frame, its map, and its paint carried into the picture's colors: one transfer
// per region, fitted where the plate and the picture agree that the region shows, away from edges.
const plates = await Promise.all(
  PLATES.map(async (plate) => {
    const raster = bleed(await inFrame(plate), BLEED);
    const map = bleedMap(plateMap(plate.name));
    const painted = opaque(raster);
    const transfers = new Map<number, Transfer>();
    for (const claim of plate.claims) {
      const i = names.indexOf(claim.region);
      const both = Uint8Array.from(label, (l, p) => (l === i && map[p] === i && painted[p] ? 1 : 0));
      const inner = shrink(both, w, h, 3);
      if (inner.reduce((s, v) => s + v, 0) > 2000) transfers.set(i, fitTransfer(raster, paint, inner));
    }
    const data = Uint8Array.from(paint.data);
    for (let p = 0; p < n; p++) {
      const t = transfers.get(map[p]);
      if (painted[p] && t) data.set(apply(t, raster, p), p * 4);
    }
    const carried: Raster = { width: w, height: h, data };
    return { name: plate.name, map, painted, carried, flat: await bilateral(carried, { passes: 1, color: 12, space: 3, diameter: 7 }) };
  }),
);
const plateOf = (region: string) => plates[PLATES.findIndex((pl) => pl.claims.some((c) => c.region === region))];

const defs: string[] = [symbolOf(PETAL), blurFilters(PETALS)];
const bodies = new Map<string, string>();
for (const [r, region] of REGIONS.entries()) {
  const i = r + 1;
  if (ONLY && !ONLY.test(region.name)) continue;
  const t = Date.now();
  const plate = plateOf(region.name);
  const front = Uint8Array.from(label, (l) => (l > i ? 1 : 0));
  // Where the plate has the region under nearer ones, and of that, where its paint is to be had.
  // The distance plate's map covers the frame, past the plate's own paint.
  const sky = region.name === "sky";
  const extent = Uint8Array.from(plate.map, (m, p) => (front[p] && (sky || m === i) ? 1 : 0));
  const known = Uint8Array.from(extent, (v, p) => (v && plate.painted[p] && !sky ? 1 : 0));
  const own = Uint8Array.from(label, (l) => (l === i ? 1 : 0));
  const trusted = Uint8Array.from(grow(own, w, h, SEAM), (v, p) => (!v && known[p] ? 1 : 0));
  let [scene, sceneFlat] = [plate.carried, plate.flat].map((carried, k): Raster => {
    const data = Uint8Array.from([paint, flat][k].data);
    for (let p = 0; p < n; p++) if (known[p]) data.set(carried.data.subarray(p * 4, p * 4 + 4), p * 4);
    return { width: w, height: h, data };
  });
  // The backdrop's hidden part is wide, and is painted in smoothly from what is known of it: the
  // region's own pixels clear of the regions in front, and the plate's beyond the seam.
  const backdrop = sky || region.name === "distance";
  if (backdrop) {
    const near = grow(front, w, h, 2);
    const source = Uint8Array.from(own, (v, p) => ((v && !near[p]) || trusted[p] ? 1 : 0));
    [scene, sceneFlat] = [scene, sceneFlat].map((r) => pushPull(r, source, extent));
  }
  const filled = backdrop ? extent : undefined;

  // What the picture shows of the region, traced finely, reaching into the plate's colors beyond its
  // seam; beneath it, the rest of what the plate has of it, coarsely. The sky is painted in whole.
  const passes: [string, TraceStyle, "hidden" | "shown"][] = [
    [`${region.name}-behind-`, { ...region.trace, ...HIDDEN }, "hidden"],
    [`${region.name}-`, region.trace, "shown"],
  ];
  let paths = "";
  let pieces = 0;
  for (const [prefix, settings, which] of passes) {
    if (which === "hidden" && sky) continue;
    const masks =
      which === "hidden"
        ? {
            own: Uint8Array.from(known, (v, p) => (v && !loose[p] ? 1 : 0)),
            under: Uint8Array.from(plate.map, (m, p) => (m > i && front[p] ? 1 : 0)),
            holes: Uint8Array.from(extent, (v, p) => (v && (!known[p] || loose[p]) ? 1 : 0)),
            known: filled,
          }
        : {
            own: Uint8Array.from(own, (v, p) => (v && !loose[p] ? 1 : 0)),
            under: front,
            holes: Uint8Array.from(loose, (v, p) => ((v && label[p] === i) || (sky && extent[p]) ? 1 : 0)),
            known: filled ?? trusted,
          };
    const traced = await trace(settings, masks, REACH[region.name] ?? MARGIN);
    if (!traced) continue;
    const { defs: d, paths: p } = markup(traced.pieces, prefix);
    if (d) defs.push(d);
    paths += (paths ? "\n" : "") + p;
    pieces += traced.pieces.length;
  }
  if (!paths) continue;
  bodies.set(region.name, paths);
  console.log(`${region.name.padEnd(10)} ${String(pieces).padStart(6)} pieces ${(paths.length / 1e3).toFixed(0).padStart(5)} KB ${((Date.now() - t) / 1000).toFixed(1)}s`);

  function trace(style: TraceStyle, masks: Omit<LayerSpec, "margin">, margin: number): Promise<Traced | undefined> {
    return traceLayer(scene, sceneFlat, { ...masks, margin, ...styled(style, BLEED) });
  }
}

// Drawn over a region's own groups: the lash lines over the eyes.
const over = new Map([["head", lids(LIDS)]]);

const layers = LAYERS.map((layer) => {
  const draw = (name: string): string => {
    const { moves } = REGIONS.find((r) => r.name === name)!;
    const nested = REGIONS.filter((r) => r.inside === name).map((r) => draw(r.name));
    return group(name, (bodies.get(name) ?? "") + nested.join("") + (over.get(name) ?? ""), { classes: moves ? `moving ${moves}` : "" });
  };
  const parts = layer.regions.filter((name) => !REGIONS.find((r) => r.name === name)!.inside).map(draw);
  if (layer.name === "petals")
    PETALS.forEach((petal, k) => {
      if (ONLY && !ONLY.test(`petal-${k}`)) return;
      // How far past the frame a petal must fall to be gone, and how long a fall takes: larger
      // petals are nearer and fall faster, each at its own pace, and every other one turns the
      // other way.
      const m = Math.ceil(petal.length / 2 + 3 * petal.blur) + 4;
      const dur = 26 - petal.length / 6 + ((k * 7) % 5) * 1.3;
      const style = fallStyle(petal.at, m, reference.height, dur, { sway: "16px", spin: k % 2 ? "-50deg" : "50deg", tumbles: 4 });
      parts.push(spriteMarkup(PETAL, petal, `petal-${k}`, { classes: "loose fall", style }));
    });
  return layerMarkup(layer, parts);
});

const svg = drawingMarkup({
  width: reference.width,
  height: reference.height,
  title: "Memories: a girl on a hillside in spring",
  focus: FOCUS,
  motion: readFileSync(new URL("motion.css", HERE), "utf8"),
  defs,
  layers,
});
writeFileSync(OUT, svg);
if (!process.env.OUT) writePage(HERE, PAGE, svg);
console.log(`${(svg.length / 1e6).toFixed(2)} MB in ${((Date.now() - started) / 1000).toFixed(1)}s`);
