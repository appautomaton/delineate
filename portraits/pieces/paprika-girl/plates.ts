// The plates in the picture's frame. The figurines' plate is painted a fifth larger, around its lower
// left corner, and is mapped into the picture's by an affine map fitted once (see Plate in
// scene.ts, and portraits/harness/trace/plate.ts). The plates agree with the picture in what they show, not
// in tone; their colors reach the drawing only through a transfer fitted where a plate and the
// picture show the same thing (see portraits/harness/trace/transfer.ts).
//
//   node portraits/pieces/paprika-girl/plates.ts   fits the map of each plate that has one, and prints it

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
  // Where the figurines show in the picture: the map is refined there, where it matters.
  const FIGURINES: Box = [0, 480, 340, 1110];
  for (const plate of PLATES.filter((p) => p.map)) {
    const raw = readPng(fileURLToPath(plate.image));
    const map = await refine(raw, picture, await fitFeatures(raw, picture), FIGURINES);
    console.log(`${plate.name}: map: [${map.map((v, i) => v.toFixed(i % 3 === 2 ? 1 : 4)).join(", ")}]`);
  }
}
