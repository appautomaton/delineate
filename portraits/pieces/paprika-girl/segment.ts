// Cuts each plate into regions, then the picture, and writes their region maps (see scene.ts).
//
//   node portraits/pieces/paprika-girl/segment.ts [preview.png]
//
// Writes portraits/pieces/paprika-girl/regions-<plate>.png, where each plate has paint, and regions.png, the
// picture, back to front: the sky everywhere; the festival wherever its plate paints and the sky's
// plate does not show the sky as the picture does; what is found in the picture itself (FOUND:
// the torii, the birds, the figurines, by Segment Anything or by color); the balloons as fitted
// circles; and nearer, the streamer and mask, the figurines, and the girl, as their plates were
// cut. Under each piece of confetti the region is the girl's if her plate paints her there, and
// otherwise whatever surrounds the piece.

import { fileURLToPath } from "node:url";
import { labPlanes, rgbToLab } from "../../harness/trace/color.ts";
import { type Raster, readPng, writePng } from "../../harness/trace/image.ts";
import { despeckle, fillHoles, preview, spread, union, writeMap } from "../../harness/trace/labels.ts";
import { boxes, close, dropSmall, grow, ofTone, pieces, shrink } from "../../harness/trace/mask.ts";
import { inked } from "../../harness/trace/plate.ts";
import { type Segmenter, segmenter } from "../../harness/trace/sam.ts";
import { blur } from "../../harness/trace/stack.ts";
import { apply, fitTransfer } from "../../harness/trace/transfer.ts";
import { distance as signedDistance } from "../../harness/trace/polygon.ts";
import { cardFootprint } from "../../harness/model/card.ts";
import { outline } from "../../harness/model/sphere.ts";
import { inFrame } from "./plates.ts";
import { type Claim, CONFETTI, FOUND, HERE, MAP, PLATES, REFERENCE, REGIONS } from "./scene.ts";

const SPECK = 24; // islands smaller than this, in pixels, join their surroundings
const HOLE = 600; // dark islands up to this size inside a plate's paint are paint (deep shadow), not black
const SKY = 0.07; // the sky's plate shows the sky as the picture does within this OKLab distance
const STRAND = 1.5; // a strand pixel agrees within this many times its claim's distance, unsmoothed
const LOW = 900; // below this row, what no plate paints is festival

const started = Date.now();
const reference = readPng(fileURLToPath(REFERENCE));
const { width: w, height: h } = reference;
const n = w * h;
const names = ["none", ...REGIONS.map((r) => r.name)];
const id = new Map(names.map((name, i) => [name, i]));

const plates = new Map<string, { paint: Raster; label: Int16Array; near: Float32Array }>();
for (const plate of PLATES) {
  const paint = await inFrame(plate);
  const ink = inked(paint);
  const label = new Int16Array(n);
  // How far the plate, in the picture's colors, is from the picture: smoothed, and pixel by pixel.
  const exact = distance(paint, ink);
  const near = blur(exact, w, h, 2);
  let sam: Segmenter | undefined;
  for (const claim of plate.claims) {
    const own = id.get(claim.region)!;
    let found: Float32Array | undefined;
    if (claim.find) {
      if (plate.map) throw new Error(`${plate.name}: points are found on plates in the picture's frame only`);
      sam ??= await segmenter(fileURLToPath(plate.image));
      found = await union(sam, claim.find);
    }
    const within = (claim.within ?? []).map((r) => id.get(r)!);
    const closed = claim.close ? close(ink, w, h, claim.close) : ink;
    // Along the plate's black, loose strands are taken pixel by pixel, where the plate paints them
    // as the picture does.
    const rim = claim.rim ? grow(Uint8Array.from(closed, (v) => 1 - v), w, h, claim.rim) : undefined;
    if (rim) {
      const inside = boxes(claim.where ?? [[0, 0, w, h]], w, h);
      rim.forEach((v, p) => (rim[p] = v & inside[p]));
    }
    const offered = (p: number) => {
      if (found) return found[p] > 0;
      if (rim?.[p]) return !!ink[p] && exact[p] < STRAND * claim.agree!;
      return (within.length > 0 || !!closed[p]) && (!!rim || !claim.agree || near[p] < claim.agree);
    };
    const taken = claimed(claim, paint, (p) => offered(p) && (!within.length || within.includes(label[p])));
    if (!claim.find && !claim.within) fill(taken, plate.hole ?? HOLE);
    if (claim.least) dropSmall(taken, w, claim.least);
    for (let p = 0; p < n; p++) if (taken[p]) label[p] = own;
  }
  despeckle(label, w, SPECK);
  plates.set(plate.name, { paint, label, near });
  writeMap(new URL(`regions-${plate.name}.png`, HERE), label, names, w, h);
  console.log(`${plate.name}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

// The picture, back to front.
const label = new Int16Array(n).fill(id.get("sky")!);
const back = plates.get("back")!;
const med = plates.get("med")!;
for (let p = 0; p < n; p++) {
  const sky = back.label[p] === id.get("sky") && back.near[p] < SKY;
  if (med.label[p] && !sky) label[p] = id.get("festival")!;
}
const sam = await segmenter(fileURLToPath(REFERENCE));
for (const claim of FOUND) {
  const found = claim.find && (await union(sam, claim.find));
  const within = (claim.within ?? []).map((r) => id.get(r)!);
  const taken = claimed(claim, reference, (p) => (!found || found[p] > 0) && (!within.length || within.includes(label[p])));
  for (let p = 0; p < n; p++) if (taken[p]) label[p] = id.get(claim.region)!;
}
for (const region of REGIONS) {
  if (!region.balloon) continue;
  const { center, radius } = outline(reference, region.balloon.center, region.balloon.radius);
  for (let y = Math.floor(center[1] - radius); y <= Math.ceil(center[1] + radius); y++)
    for (let x = Math.floor(center[0] - radius); x <= Math.ceil(center[0] + radius); x++)
      if (Math.hypot(x + 0.5 - center[0], y + 0.5 - center[1]) < radius) label[y * w + x] = id.get(region.name)!;
}
for (const name of ["front-right", "front-left", "subject"]) {
  const plate = plates.get(name)!;
  for (let p = 0; p < n; p++) if (plate.label[p]) label[p] = plate.label[p];
}
// Slivers of the sky and the festival pinched between nearer things are gaps between what
// Segment Anything found, not glimpses of the distance: they join their neighbors. Around the
// girl they stay, for there they are the festival seen between strands of her hair.
const isGirl = (l: number) => names[l].startsWith("girl");
const beside = grow(Uint8Array.from(label, (l) => (isGirl(l) ? 1 : 0)), w, h, 6);
for (const far of ["sky", "festival"]) {
  const own = Uint8Array.from(label, (l) => (l === id.get(far) ? 1 : 0));
  const open = grow(shrink(own, w, h, 2), w, h, 2);
  spread(label, Uint8Array.from(own, (v, p) => (v && !open[p] && !beside[p] ? 1 : 0)), w);
}
// Low in the frame the festival fills everything behind the near things: what no plate paints
// down there is a gap in the plates, not sky.
const sky = Uint8Array.from(label, (l) => (l === id.get("sky") ? 1 : 0));
const low = new Uint8Array(n);
for (const piece of pieces(sky, w)) if (piece.every((p) => p >= LOW * w)) for (const p of piece) low[p] = 1;
spread(label, low, w);
const subject = plates.get("subject")!;
const under = new Uint8Array(n);
for (const c of CONFETTI) cardFootprint(c, w, h, 1.5).forEach((v, p) => (under[p] |= v));
for (let p = 0; p < n; p++) if (under[p] && subject.label[p]) [label[p], under[p]] = [subject.label[p], 0];
// The rest takes what surrounds the piece, but never her: her plate says where she is.
const around = Int16Array.from(label);
spread(around, Uint8Array.from(under, (v, p) => v | (isGirl(label[p]) ? 1 : 0)), w);
for (let p = 0; p < n; p++) if (under[p]) label[p] = around[p];
despeckle(label, w, SPECK);
fillHoles(label, w, h, 1500, id.get("sky"));
writeMap(MAP, label, names, w, h);
console.log(`regions.png: ${((Date.now() - started) / 1000).toFixed(1)}s`);
if (process.argv[2]) writePng(process.argv[2], preview(reference, label, names.length));

// Dark islands inside a plate's paint are paint: deep shadow, not the black around it.
function fill(mask: Uint8Array, largest: number) {
  const holes = Int16Array.from(mask);
  fillHoles(holes, w, h, largest);
  mask.set(holes);
}

// The pixels a claim takes, given which of them its source offers.
function claimed(claim: Claim, paint: Raster, offered: (p: number) => boolean): Uint8Array {
  const out = new Uint8Array(n);
  const lab = claim.color ? labPlanes(paint.data, n) : undefined;
  for (const [x0, y0, x1, y1] of claim.clip ?? [[0, 0, w, h]])
    for (let y = Math.max(0, y0); y < Math.min(h, y1); y++)
      for (let x = Math.max(0, x0); x < Math.min(w, x1); x++) {
        const p = y * w + x;
        if (!offered(p) || (claim.shape && signedDistance(claim.shape, x + 0.5, y + 0.5) < 0)) continue;
        if (lab && claim.color && !ofTone(lab, p, claim.color)) continue;
        out[p] = 1;
      }
  return out;
}

// The plate's colors carried into the picture's by a transfer fitted where it paints, and their
// distance from the picture's; far where the plate has no paint.
function distance(paint: Raster, ink: Uint8Array): Float32Array {
  const core = Uint8Array.from(ink, (v, p) => (v && ink[p - 3] && ink[p + 3] && ink[p - 3 * w] && ink[p + 3 * w] ? 1 : 0));
  const map = fitTransfer(paint, reference, core, { keep: 0.6 });
  const d = new Float32Array(n);
  for (let p = 0; p < n; p++) {
    if (!ink[p]) {
      d[p] = 1;
      continue;
    }
    const a = rgbToLab(...apply(map, paint, p));
    const b = rgbToLab(reference.data[p * 4], reference.data[p * 4 + 1], reference.data[p * 4 + 2]);
    d[p] = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
  return d;
}
