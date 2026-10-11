// The plates in the picture's frame. Two are painted in frames of their own and are mapped into the
// picture's by an affine map fitted once (see Plate in scene.ts, and portraits/harness/trace/plate.ts).
//
//   node portraits/pieces/memories-girl/plates.ts   fits the maps of the plates that have one, and prints them
//
// The distance plate is repainted so much that few features agree with the picture, so its map is
// refined over the city, where the plate's scene shows clearly.

import { fileURLToPath } from "node:url";
import { type Raster, readPng } from "../../harness/trace/image.ts";
import { fitFeatures, refine, warp } from "../../harness/trace/plate.ts";
import type { Box } from "../../harness/trace/polygon.ts";
import { PLATES, type Plate, REFERENCE } from "./scene.ts";

const picture = readPng(fileURLToPath(REFERENCE));

export async function inFrame(plate: Plate): Promise<Raster> {
  const raw = readPng(fileURLToPath(plate.image));
  return plate.map ? warp(raw, plate.map, picture.width, picture.height) : raw;
}

if (import.meta.main) {
  // Where the distance plate's city shows clearly in the picture.
  const CITY: Box = [840, 200, 1254, 560];
  for (const plate of PLATES.filter((p) => p.map)) {
    const raw = readPng(fileURLToPath(plate.image));
    let map = await fitFeatures(raw, picture);
    if (plate.name === "back") map = await refine(raw, picture, map, CITY);
    console.log(`${plate.name}: map: [${map.map((v, i) => v.toFixed(i % 3 === 2 ? 1 : 4)).join(", ")}]`);
  }
}
