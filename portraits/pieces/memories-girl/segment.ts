// Cuts each plate into regions and composites them into the picture's region map (see scene.ts).
//
//   node portraits/pieces/memories-girl/segment.ts [preview.png]
//
// Writes portraits/pieces/memories-girl/regions.png (the picture) and regions-<plate>.png (each plate in the
// picture's frame, where it has paint). A plate's claims run in two passes. Claims by place
// (polygons, lines, boxes) run on the plate itself, so its map reaches under whatever hides it in the
// picture. Claims by color or by search run on the picture, after compositing, where the picture
// shows their regions: the plates are repainted, and only the picture says which of its pixels are
// cloud, twig, or a flower at the lens.
//
// The petals are drawn from their own data, so their pixels belong to whatever lies around them,
// and the plates' own copies of them are dropped.

import { fileURLToPath } from "node:url";
import { labPlanes } from "../../harness/trace/color.ts";
import { type Raster, readPng, writePng } from "../../harness/trace/image.ts";
import { despeckle, preview, spread, union, writeMap } from "../../harness/trace/labels.ts";
import { grow, lineAt, ofTone, pieces, settle } from "../../harness/trace/mask.ts";
import { distance } from "../../harness/trace/polygon.ts";
import { type Segmenter, segmenter } from "../../harness/trace/sam.ts";
import { spriteFootprint } from "../../harness/model/sprite.ts";
import { PETAL } from "./petal.ts";
import { opaque } from "../../harness/trace/plate.ts";
import { inFrame } from "./plates.ts";
import { type Claim, MAP, PETALS, PLATES, REFERENCE, REGIONS, RIDGE, plateMap } from "./scene.ts";

const SPECK = 24; // islands smaller than this, in pixels, join their surroundings
const LOOSE = 3000; // a plate's pieces smaller than this are loose (petals, specks) unless they touch the frame or a large piece
const TOUCH = 30; // how near, in pixels, a loose piece must lie to a large piece to belong to it

const started = Date.now();
const picture = readPng(fileURLToPath(REFERENCE));
const { width: w, height: h } = picture;
const n = w * h;
const NAMES = ["none", ...REGIONS.map((r) => r.name)];
const id = new Map(NAMES.map((name, i) => [name, i]));

const petals = new Uint8Array(n);
for (const petal of PETALS) spriteFootprint(PETAL, petal, w, h, 2).forEach((v, p) => (petals[p] |= v));

// The ridge, settled onto the edge between sky and hills within a few pixels of where it was read.
const ridge = settle(picture, RIDGE, 7);

const plateLabels: Int16Array[] = [];
for (const plate of PLATES) {
  const paint = await inFrame(plate);
  const label = new Int16Array(n);
  const first = id.get(plate.claims[0].region)!;
  // The distance is the ground: it lies behind everything, painted or not.
  const cover = plate.name === "back" ? new Uint8Array(n).fill(1) : opaque(paint);
  if (plate.name !== "back") keepWhole(cover);
  const counts = selector(plate.claims[0]);
  for (let p = 0; p < n; p++) if (cover[p] && !petals[p] && counts(p)) label[p] = first;
  // The subject plate stops short of the frame's foot; the figure runs on straight down.
  if (plate.map && plate.name !== "back") extendDown(label);
  for (const claim of plate.claims.slice(1)) if (!byPicture(claim)) apply(label, claim, () => true);
  plateLabels.push(label);
}

// The picture: the nearest region any plate paints at each pixel (regions run back to front, so
// the nearest is the last). Petal pixels take the regions around them.
const label = new Int16Array(n);
for (let p = 0; p < n; p++) for (const plate of plateLabels) label[p] = Math.max(label[p], plate[p]);
spread(label, petals, w);
const lab = labPlanes(picture.data, n);
let sam: Segmenter | undefined;
for (const [k, plate] of PLATES.entries())
  for (const claim of plate.claims)
    if (byPicture(claim)) {
      const own = id.get(claim.region)!;
      const before = Int16Array.from(label);
      let found: Uint8Array | undefined;
      if (claim.find) {
        sam ??= await segmenter(fileURLToPath(REFERENCE));
        const logits = await union(sam, claim.find.map((point) => ({ points: [point] })));
        found = grow(Uint8Array.from(logits, (v) => (v > 0 ? 1 : 0)), w, h, 1);
      }
      apply(label, claim, (p) => (!claim.color || ofTone(lab, p, claim.color)) && (!found || found[p] === 1));
      // The plate's own map takes the claim where the picture shows the plate, or nothing of it.
      for (let p = 0; p < n; p++) if (label[p] === own && before[p] !== own && (plateLabels[k][p] === before[p] || !plateLabels[k][p])) plateLabels[k][p] = own;
    }
despeckle(label, w, SPECK);
writeMap(MAP, label, NAMES, w, h);
PLATES.forEach((plate, k) => {
  spread(plateLabels[k], petals, w);
  despeckle(plateLabels[k], w, SPECK);
  writeMap(plateMap(plate.name), plateLabels[k], NAMES, w, h);
});
console.log(`regions: ${((Date.now() - started) / 1000).toFixed(1)}s`);
if (process.argv[2]) writePng(process.argv[2], preview(picture as Raster, label, NAMES.length));

// A claim over a map: among the regions it may take, the pixels its place selects and `test` keeps.
function apply(label: Int16Array, claim: Claim, test: (p: number) => boolean) {
  const own = id.get(claim.region)!;
  const plate = PLATES.find((pl) => pl.claims.includes(claim))!;
  const within = (claim.within ?? [plate.claims[0].region]).map((r) => (r === "none" ? 0 : id.get(r)!));
  const place = selector(claim);
  const before = Int16Array.from(label);
  for (let step = 0, taken = 1; taken && step < (claim.near ? 8 : 1); step++) {
    const near = claim.near ? grow(Uint8Array.from(label, (l) => (l === own ? 1 : 0)), w, h, claim.near) : undefined;
    taken = 0;
    for (let p = 0; p < n; p++)
      if (label[p] !== own && within.includes(label[p]) && place(p) && (!near || near[p]) && test(p)) {
        label[p] = own;
        taken++;
      }
  }
  if (claim.least) dropSmall(label, own, claim.least, before);
}

// Pieces of a region smaller than `least` pixels go back to what they were.
function dropSmall(label: Int16Array, own: number, least: number, before: Int16Array) {
  for (const piece of pieces(Uint8Array.from(label, (l) => (l === own ? 1 : 0)), w)) if (piece.length < least) for (const p of piece) label[p] = before[p];
}

// Claims by color or by search read the picture, after compositing.
function byPicture(claim: Claim): boolean {
  return Boolean(claim.color || claim.find);
}

function selector({ inside, below, above, clip }: Claim): (p: number) => boolean {
  const tests: ((x: number, y: number) => boolean)[] = [];
  if (inside) tests.push((x, y) => distance(inside, x, y) > 0);
  if (below) tests.push((x, y) => y + 0.5 > lineAt(below, x + 0.5));
  if (above) tests.push((x, y) => y + 0.5 < (above === RIDGE ? ridge[x] : lineAt(above, x + 0.5)));
  if (clip) tests.push((x, y) => clip.some(([x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1));
  return (p) => {
    const x = p % w;
    const y = (p - x) / w;
    return tests.every((t) => t(x, y));
  };
}


// Keeps the large pieces of a plate's paint, and the small ones that touch the frame or lie close to
// a large one; drops the rest, which are loose petals and specks.
function keepWhole(cover: Uint8Array) {
  const found = pieces(cover, w);
  const large = new Uint8Array(n);
  for (const piece of found) if (piece.length >= LOOSE) for (const p of piece) large[p] = 1;
  const near = grow(large, w, h, TOUCH);
  for (const piece of found) {
    if (piece.length >= LOOSE) continue;
    const edge = piece.some((p) => p % w === 0 || p % w === w - 1 || p < w || p >= n - w);
    if (!edge && !piece.some((p) => near[p])) for (const p of piece) cover[p] = 0;
  }
}

// Below the last row a plate paints in full, each column carries on as that row is.
function extendDown(label: Int16Array) {
  let last = h - 1;
  while (last > 0 && label.subarray(last * w, last * w + w).every((v) => !v)) last--;
  last -= 3; // the warped plate's last rows fade out
  for (let y = last + 1; y < h; y++) label.copyWithin(y * w, last * w, last * w + w);
}
