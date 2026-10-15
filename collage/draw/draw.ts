// Draws each motif in each hand, from its renders (npm run collage:render): art/<id>/<hand>.svg,
// the files the cards show. It stops with an error if a motif's drawings come out in a frame other
// than the one its crops were set in, since every crop would then cut in the wrong place.
// Run: npm run collage:draw [-- <id> ...]   every motif, or those named

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { HANDS } from "../motifs.js";
import { motifs, renders } from "../render.ts";
import { cast } from "./cast.ts";
import { contour } from "./contour.ts";
import { engraving } from "./engraving.ts";
import { load, type Fields } from "./fields.ts";
import { marble } from "./marble.ts";
import { screen } from "./screen.ts";

const DRAW = { engraving, screen, marble, contour, cast } satisfies Record<keyof typeof HANDS, (fields: Fields, title: string) => string | Uint8Array>;

const named = process.argv.slice(2);
for (const id of named) if (!motifs[id]) throw new Error(`No motif "${id}"; there are ${Object.keys(motifs).join(", ")}`);
for (const id of named.length ? named : Object.keys(motifs)) {
  const motif = motifs[id];
  const { title } = motif;
  const frame = "frame" in motif ? motif.frame : null; // a new motif's frame is set once it is first drawn
  if (!existsSync(`${renders(id)}/view.json`)) throw new Error(`${id} has no renders yet: npm run collage:render -- ${id}`);
  const fields = load(id);
  const { width, height } = fields.frame;
  if (!frame) console.log(`${id} is drawn ${width} × ${height}: give it that frame in motifs.js, and set its crops in it`);
  else if (width !== frame[0] || height !== frame[1])
    throw new Error(`${id} draws ${width} × ${height}, but its crops were set in ${frame.join(" × ")}: set its frame in motifs.js to [${width}, ${height}] and its crops anew`);
  const dir = new URL(`../art/${id}/`, import.meta.url);
  mkdirSync(dir, { recursive: true });
  for (const [hand, draw] of Object.entries(DRAW)) {
    const made = draw(fields, title), file = HANDS[hand as keyof typeof HANDS].file;
    writeFileSync(new URL(file, dir), made);
    console.log(`art/${id}/${file}`, `${Math.round(made.length / 1024)} KB`);
  }
}
