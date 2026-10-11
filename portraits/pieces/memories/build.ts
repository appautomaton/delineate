// Builds Memories from the region maps (see segment.ts): traces every region, draws the petals, and
// writes the layered SVG with its motion (motion.css), and the page with the SVG inlined (see
// portraits/harness/stage).
//
// Each region is drawn in two passes. Beneath, what its plates show of it where nearer regions
// stand, traced coarsely: it is seen only once the planes move or part. On top, what the picture
// shows of it, traced finely, reaching a margin under nearer regions into the plates' colors. A
// plate's colors are brought to the picture's by a transfer fitted where both show the region,
// and trusted only a seam inside a nearer region's outline, where the picture's own edge colors
// give way to the plate.
//
// Everything is traced with a bleed past the frame, in the picture's coordinates.
//
//   node portraits/pieces/memories/build.ts
//   ONLY=<regex> OUT=<file.svg> node portraits/pieces/memories/build.ts   builds only the matching regions
//   TUNE='{"error":0.01}' ...                                   overrides their trace settings, for trials

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { bilateral } from "../../harness/trace/filter.ts";
import { type Raster, bleed, readPng } from "../../harness/trace/image.ts";
import { bleedLabels, readMap } from "../../harness/trace/labels.ts";
import { type TraceStyle, type Traced, styled, traceLayer } from "../../harness/trace/layer.ts";
import { grow } from "../../harness/trace/mask.ts";
import { markup } from "../../harness/trace/svg.ts";
import { type Transfer, apply, fitTransfer } from "../../harness/trace/transfer.ts";
import { blurFilters, spriteFootprint, spriteMarkup, symbolOf } from "../../harness/model/sprite.ts";
import { drawingMarkup, fallStyle, group, layerMarkup, lids } from "../../harness/stage/drawing.ts";
import { writePage } from "../../harness/stage/page.ts";
import { PAGE } from "./page.ts";
import { PETAL } from "./petal.ts";
import { FOCUS, HIDDEN, LAYERS, LIDS, MAP, PETALS, PLATES, PLATE_MAPS, REFERENCE, REGIONS } from "./scene.ts";

const HERE = new URL("./", import.meta.url);
const OUT = process.env.OUT ?? fileURLToPath(new URL("memories.svg", HERE));
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : undefined;
const TUNE: TraceStyle = process.env.TUNE ? JSON.parse(process.env.TUNE) : {};
const MARGIN = 24; // pixels each region reaches under the regions in front of it
const BLEED = 16; // pixels drawn past the frame on every side
const SEAM = 12; // pixels inside a nearer region's outline before its plate is trusted

const started = Date.now();
const reference = readPng(fileURLToPath(REFERENCE));
const paint = bleed(reference, BLEED);
const flat = await bilateral(paint, { passes: 1, color: 12, space: 3, diameter: 7 });
const { width: w, height: h } = paint;
const n = w * h;
const names = ["none", ...REGIONS.map((r) => r.name)];
const index = (name: string) => names.indexOf(name);
const mapOf = (url: URL) => {
  const m = readMap(url, names);
  return bleedLabels(m.label, m.width, m.height, BLEED);
};
const label = mapOf(MAP);
const plates = await Promise.all(
  PLATES.map(async (plate) => {
    const raster = bleed(readPng(fileURLToPath(plate.image)), BLEED);
    return { ...plate, raster, flat: await bilateral(raster, { passes: 1, color: 12, space: 3, diameter: 7 }), label: mapOf(new URL(`regions-${plate.name}.png`, PLATE_MAPS)) };
  }),
);

// Drawing order: layer by layer, back to front, and within a layer as listed. A region is nearer
// than another when it is drawn later.
const order = LAYERS.flatMap((layer) => layer.regions.map(index));
const rank = new Int16Array(names.length).fill(-1);
order.forEach((r, k) => (rank[r] = k));
const nearer = (a: number, b: number) => rank[a] > rank[b];

// Petals lie over everything; under each, the regions are drawn whole so the petal can fall away.
const loose = new Uint8Array(n);
for (const petal of PETALS) spriteFootprint(PETAL, { ...petal, at: [petal.at[0] + BLEED, petal.at[1] + BLEED] }, w, h, 2).forEach((v, p) => (loose[p] |= v));

const defs: string[] = [symbolOf(PETAL), blurFilters(PETALS)];
const bodies = new Map<string, string>();
for (const r of order) {
  const region = REGIONS[r - 1];
  if (ONLY && !ONLY.test(region.name)) continue;
  const t = Date.now();
  const shown = Uint8Array.from(label, (l) => (l === r ? 1 : 0));
  // Where the plates show this region behind something nearer, and which plate shows it there:
  // the nearest plate that has it.
  const source = new Int8Array(n).fill(-1);
  for (let p = 0; p < n; p++)
    for (let k = plates.length - 1; k >= 0; k--)
      if (plates[k].label[p] === r) {
        source[p] = k;
        break;
      }
  // Under the petals the picture's own surroundings are a better guide than a plate, so holes
  // there are painted in from the region itself.
  const hidden = Uint8Array.from(label, (l, p) => (source[p] >= 0 && nearer(l, r) ? 1 : 0));
  const occluders = Uint8Array.from(label, (l) => (nearer(l, r) ? 1 : 0));
  const seam = grow(Uint8Array.from(occluders, (v) => 1 - v), w, h, SEAM);
  const trusted = Uint8Array.from(hidden, (v, p) => (v && (!seam[p] || !occluders[p]) ? 1 : 0));

  // The picture, with the plates' transferred colors wherever the region is hidden.
  const transfers = plates.map((plate, k) => (hidden.some((v, p) => v && source[p] === k) ? transferFor(k, r, shown, source) : undefined));
  const [scene, sceneFlat] = [paint, flat].map((base, j) => {
    const data = Uint8Array.from(base.data);
    for (let p = 0; p < n; p++) {
      if (!hidden[p]) continue;
      const k = source[p];
      const map = transfers[k];
      if (map) data.set(apply(map, j ? plates[k].flat : plates[k].raster, p), p * 4);
    }
    return { ...base, data } as Raster;
  });

  const masks = {
    hidden: {
      own: Uint8Array.from(hidden, (v, p) => (v && !loose[p] ? 1 : 0)),
      under: Uint8Array.from(occluders, (v, p) => (v && !hidden[p] ? 1 : 0)),
      holes: Uint8Array.from(loose, (v, p) => (v && hidden[p] ? 1 : 0)),
    },
    shown: {
      own: Uint8Array.from(shown, (v, p) => (v && !loose[p] ? 1 : 0)),
      under: occluders,
      holes: Uint8Array.from(loose, (v, p) => (v && shown[p] ? 1 : 0)),
      known: trusted,
    },
  };
  let paths = "";
  let pieces = 0;
  for (const [which, settings] of [
    ["hidden", { ...region.trace, ...HIDDEN }],
    ["shown", { ...region.trace, ...TUNE }],
  ] as const) {
    if (which === "hidden" && !masks.hidden.own.some((v) => v)) continue;
    const traced = await trace(settings, masks[which]);
    if (!traced) continue;
    const { defs: d, paths: p } = markup(traced.pieces, `${region.name}${which === "hidden" ? "-behind" : ""}-`);
    if (d) defs.push(d);
    paths += (paths ? "\n" : "") + p;
    pieces += traced.pieces.length;
  }
  bodies.set(region.name, paths);
  console.log(`${region.name.padEnd(10)} ${String(pieces).padStart(5)} pieces ${(paths.length / 1e3).toFixed(0).padStart(5)} kB ${((Date.now() - t) / 1000).toFixed(1)}s`);

  function trace(style: TraceStyle, m: { own: Uint8Array; under: Uint8Array; holes: Uint8Array; known?: Uint8Array }): Promise<Traced | undefined> {
    return traceLayer(scene, sceneFlat, { ...m, margin: MARGIN, ...styled(style, BLEED) });
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
      // Nearer petals are larger, and fall faster; each keeps its own pace and its own place in
      // the sway, and the breeze carries them all a little to the right.
      const m = Math.ceil(petal.length / 2 + 3 * petal.blur) + 4;
      const dur = 16 - petal.length / 8 + ((k * 7) % 5);
      const style = fallStyle(petal.at, m, reference.height, dur, { sway: "22px", phase: ((k * 0.37) % 1).toFixed(2), wind: 0.045, spin: "40deg", spins: 2, tumbles: 3 });
      parts.push(spriteMarkup(PETAL, petal, `petal-${k}`, { classes: "loose fall", style }));
    });
  return layerMarkup(layer, parts);
});

const svg = drawingMarkup({
  width: reference.width,
  height: reference.height,
  title: "Memories: a young man smiling on a hillside road in spring",
  focus: FOCUS,
  motion: readFileSync(new URL("motion.css", HERE), "utf8"),
  defs,
  layers,
});
writeFileSync(OUT, svg);
if (!process.env.OUT) writePage(HERE, PAGE, svg);
console.log(`${(svg.length / 1e6).toFixed(2)} MB in ${((Date.now() - started) / 1000).toFixed(1)}s`);

// The color transfer from plate k to the picture for region r: fitted where the picture shows the
// region and the plate has it; failing enough of those, wherever the picture shows the region and
// the plate has paint.
function transferFor(k: number, r: number, shown: Uint8Array, source: Int8Array): Transfer {
  const plate = plates[k];
  const count = (m: Uint8Array) => m.reduce((sum, v) => sum + v, 0);
  const both = Uint8Array.from(shown, (v, p) => (v && source[p] === k && !loose[p] ? 1 : 0));
  if (count(both) >= 200) return fitTransfer(plate.raster, paint, both);
  return fitTransfer(plate.raster, paint, Uint8Array.from(shown, (v, p) => (v && plate.label[p] ? 1 : 0)));
}
