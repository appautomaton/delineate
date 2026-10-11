// Cuts each plate into regions and composites them into the picture's region map (see scene.ts).
//
//   node portraits/pieces/memories/segment.ts [preview.png]
//
// Writes portraits/pieces/memories/regions.png (the picture) and regions-<plate>.png (each plate, where it
// has paint; elsewhere its first region). Petal pixels on the front plate are left out of it: the
// petals are drawn from their own data.

import { fileURLToPath } from "node:url";
import { labPlanes } from "../../harness/trace/color.ts";
import { type Raster, readPng, writePng } from "../../harness/trace/image.ts";
import { despeckle, fillHoles, preview, spread, union, writeMap } from "../../harness/trace/labels.ts";
import { boxes, close, ofTone, pieces } from "../../harness/trace/mask.ts";
import { distance } from "../../harness/trace/polygon.ts";
import { segmenter } from "../../harness/trace/sam.ts";
import { spriteFootprint } from "../../harness/model/sprite.ts";
import { PETAL } from "./petal.ts";
import { MAP, PETALS, PLATES, PLATE_MAPS, REFERENCE, REGIONS } from "./scene.ts";

const INK = 4; // a plate pixel brighter than this, in any channel, is paint; darker is the black around it
const SPECK = 24; // islands smaller than this, in pixels, join their surroundings
const HOLE = 600; // dark islands up to this size inside a plate's paint are paint (deep shadow), not black
const CREASE = 3; // dark lines up to twice this wide that cut into a plate's paint are paint too (folds, outlines)

const started = Date.now();
const reference = readPng(fileURLToPath(REFERENCE));
const { width: w, height: h } = reference;
const n = w * h;
const names = ["none", ...REGIONS.map((r) => r.name)];
const id = new Map(names.map((name, i) => [name, i]));

const petals = new Uint8Array(n);
for (const petal of PETALS) spriteFootprint(PETAL, petal, w, h, 3).forEach((v, p) => (petals[p] |= v));

const plateLabels: Int16Array[] = [];
for (const plate of PLATES) {
  const path = fileURLToPath(plate.image);
  const paint = readPng(path);
  const label = new Int16Array(n);
  const first = id.get(plate.claims[0].region)!;
  // Paint: brighter than black, with small dark islands inside it counted as paint too.
  const ink = Uint8Array.from({ length: n }, (_, p) => (Math.max(paint.data[p * 4], paint.data[p * 4 + 1], paint.data[p * 4 + 2]) > INK ? 1 : 0));
  const closed = close(ink, w, h, CREASE);
  for (let p = 0; p < n; p++) if (closed[p]) label[p] = first;
  if (plate.name === "front") for (let p = 0; p < n; p++) if (petals[p]) label[p] = 0;
  fillHoles(label, w, h, HOLE);
  despeckle(label, w, SPECK);
  const lab = labPlanes(paint.data, n);
  let sam: Awaited<ReturnType<typeof segmenter>> | undefined;
  for (const claim of plate.claims.slice(1)) {
    const own = id.get(claim.region)!;
    const within = (claim.within ?? (claim.find ? [] : [plate.claims[0].region])).map((r) => id.get(r)!);
    let found: Float32Array | undefined;
    if (claim.find) {
      sam ??= await segmenter(path);
      found = await union(sam, claim.find);
    }
    const inClip = boxes(claim.clip ?? [[0, 0, w, h]], w, h);
    if (claim.area) for (let p = 0; p < n; p++) if (inClip[p] && distance(claim.area, (p % w) + 0.5, Math.floor(p / w) + 0.5) < 0) inClip[p] = 0;
    for (let p = 0; p < n; p++) {
      if (!label[p] || !inClip[p] || (found && found[p] <= 0) || (within.length && !within.includes(label[p]))) continue;
      if (claim.color && !ofTone(lab, p, claim.color)) continue;
      label[p] = own;
    }
    if (claim.solid) for (const box of claim.clip ?? [[0, 0, w, h]]) solidify(label, own, box);
  }
  despeckle(label, w, SPECK);
  plateLabels.push(label);
  writeMap(new URL(`regions-${plate.name}.png`, PLATE_MAPS), label, names, w, h);
  console.log(`${plate.name}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

// The picture: the nearest plate with paint at each pixel. What no plate paints is far: it takes
// the region of the distance around it, unless one region encloses it.
const label = new Int16Array(n);
for (let p = 0; p < n; p++)
  for (let k = PLATES.length - 1; k >= 0; k--)
    if (plateLabels[k][p]) {
      label[p] = plateLabels[k][p];
      break;
    }
fillHoles(label, w, h, 20000);
const far = Int16Array.from(plateLabels[0]);
spread(far, Uint8Array.from(far, (v) => (v ? 0 : 1)), w);
for (let p = 0; p < n; p++) if (!label[p]) label[p] = far[p];
despeckle(label, w, SPECK);
writeMap(MAP, label, names, w, h);
console.log(`regions.png: ${((Date.now() - started) / 1000).toFixed(1)}s`);
if (process.argv[2]) writePng(process.argv[2], preview(reference as Raster, label, names.length));

// Within a box, the largest piece of a region stays, with its holes filled; the rest goes back to
// the label around it.
function solidify(label: Int16Array, own: number, [x0, y0, x1, y1]: number[]) {
  const bw = x1 - x0;
  const bh = y1 - y0;
  const mine = Uint8Array.from({ length: bw * bh }, (_, i) => (label[(y0 + Math.floor(i / bw)) * w + x0 + (i % bw)] === own ? 1 : 0));
  const found = pieces(mine, bw);
  if (!found.length) return;
  const keep = found.reduce((a, b) => (b.length > a.length ? b : a));
  const around = new Map<number, number>();
  for (const piece of found)
    if (piece !== keep)
      for (const i of piece) {
        mine[i] = 0;
        const p = (y0 + Math.floor(i / bw)) * w + x0 + (i % bw);
        label[p] = label[p - 1] === own ? (around.get(p) ?? label[p - w]) : label[p - 1];
      }
  // Holes: pieces of the rest that do not reach the box's edge.
  for (const hole of pieces(Uint8Array.from(mine, (v) => 1 - v), bw)) {
    if (hole.some((i) => i % bw === 0 || i % bw === bw - 1 || i < bw || i >= bw * (bh - 1))) continue;
    for (const i of hole) label[(y0 + Math.floor(i / bw)) * w + x0 + (i % bw)] = own;
  }
}
