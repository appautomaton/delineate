// Cuts the reference, the sharp plate, and the background plate into regions and writes their region maps (see
// regions.ts).
//
//   node portraits/pieces/paprika/segment.ts [preview.png]
//
// Things and parts are found by Segment Anything; balloons are fitted circles. Nearer layers cover
// farther ones, and within a layer later regions cover earlier ones. Specks join what surrounds
// them, and a hole that the backdrop leaves inside a thing joins the thing.

import { fileURLToPath } from "node:url";
import { type Raster, readPng, writePng } from "../../harness/trace/image.ts";
import { despeckle, fillHoles, preview, union, writeMap } from "../../harness/trace/labels.ts";
import { type Segmenter, segmenter } from "../../harness/trace/sam.ts";
import { outline } from "../../harness/model/sphere.ts";
import { declared } from "./regions.ts";
import { LAYERS, PLATE, REFERENCE, REGIONS, SHARP } from "./scene.ts";

const SPECK = 24; // islands smaller than this, in pixels, join their surroundings
const HOLE = 4000; // the largest hole, in pixels, that a thing is taken to enclose by mistake

const started = Date.now();
const regions = declared();
const id = new Map(regions.map((r, i) => [r.name, i]));

for (const [image, map, without] of [
  [REFERENCE, REGIONS, ""],
  [SHARP.image, SHARP.map, ""],
  [PLATE.image, PLATE.map, PLATE.without],
] as const) {
  const path = fileURLToPath(image);
  const paint = readPng(path);
  const label = await cut(path, paint, without);
  writeMap(map, label, regions.map((r) => r.name), paint.width, paint.height);
  console.log(`${fileURLToPath(map).split("/").pop()}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
  if (process.argv[2] && map === REGIONS) writePng(process.argv[2], preview(paint, label, regions.length));
}

// The region map of one picture, leaving out the thing named `without`.
async function cut(path: string, paint: Raster, without: string): Promise<Int16Array> {
  const { width: w, height: h } = paint;
  const n = w * h;
  const label = new Int16Array(n);
  let sam: Segmenter | undefined;
  for (const layer of LAYERS)
    for (const thing of layer.things) {
      if (thing.name === without) continue;
      if (thing.balloon) {
        const { center, radius } = outline(paint, thing.balloon.center, thing.balloon.radius);
        const own = id.get(thing.name)!;
        for (let y = Math.floor(center[1] - radius); y <= Math.ceil(center[1] + radius); y++)
          for (let x = Math.floor(center[0] - radius); x <= Math.ceil(center[0] + radius); x++)
            if (Math.hypot(x + 0.5 - center[0], y + 0.5 - center[1]) < radius) label[y * w + x] = own;
        continue;
      }
      sam ??= await segmenter(path);
      const mask = await union(sam, thing.find ?? []);
      const parts = thing.parts ?? [];
      const first = id.get(parts.length ? `${thing.name}-${parts[0].name}` : thing.name)!;
      for (let p = 0; p < n; p++) if (mask[p] > 0) label[p] = first;
      for (const part of parts.slice(1)) {
        const own = id.get(`${thing.name}-${part.name}`)!;
        const found = await union(sam, part.find);
        for (const [x0, y0, x1, y1] of part.clip ?? [[0, 0, w, h]])
          for (let y = y0; y < y1; y++)
            for (let x = x0; x < x1; x++) {
              const p = y * w + x;
              if (found[p] > 0 && label[p] >= first && label[p] < own) label[p] = own;
            }
      }
    }
  despeckle(label, w, SPECK);
  fillHoles(label, w, h, HOLE);
  return label;
}
