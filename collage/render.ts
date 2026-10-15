// Renders a motif's scan, by Blender run headless, into the passes its drawings are made from:
// render/{beauty,tone,depth,normal}.png and render/view.json, in the cache beside the scan. A scan
// is fetched by hand, from where its holder publishes it, and never leaves the cache.
// Run: npm run collage:render -- <id>                        its view, at full size
//      npm run collage:render -- <id> --preview 0,5 30,5 ...  small studies of other views, in preview/
// Blender is the `blender` on the path, or the one BLENDER names.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { MOTIFS } from "./motifs.js";

export type Motif = (typeof MOTIFS)[keyof typeof MOTIFS];
export const motifs: Record<string, Motif> = MOTIFS;

export const ASSETS = `${homedir()}/.cache/delineate/assets/collage`;
export const renders = (id: string) => `${ASSETS}/${id}/render`;

// Twice the drawings' long side, so the fields are only ever sampled down into a drawing.
const LONG = 2400;

if (import.meta.main) {
  const [id, flag, ...views] = process.argv.slice(2);
  const motif = motifs[id];
  if (!motif) throw new Error(`No motif "${id}"; there are ${Object.keys(motifs).join(", ")}`);
  const preview = flag === "--preview";
  if (preview && !views.length) throw new Error("Name the views to preview, as azimuth,elevation in degrees: --preview 0,5 30,5");
  const { file, from, fix, view, lens, key } = motif.scan;
  const mesh = `${ASSETS}/${id}/${file}`;
  if (!existsSync(mesh)) throw new Error(`No scan at ${mesh}: fetch ${from} and save it there`);
  const config = {
    mesh,
    out: preview ? `${ASSETS}/${id}/preview` : renders(id),
    fix,
    views: preview ? views.map((v) => v.split(",").map(Number)) : [view],
    mode: preview ? "preview" : "final",
    long: preview ? 360 : LONG,
    lens,
    key_side: key === "right" ? 1 : -1,
  };
  const script = fileURLToPath(new URL("render.py", import.meta.url));
  execFileSync(process.env.BLENDER ?? "blender", ["-b", "-P", script, "--", JSON.stringify(config)], { stdio: "inherit" });
}
