// A review page for a drawing traced from a reference: wipe between the two, flip with Space,
// see where they differ, zoom to 1:1 and 2:1, and turn layers off to see what lies under them.
// It renders and scores the drawing first, so the page carries the numbers too.
//
//   node portraits/harness/trace/review.ts <drawing.svg> <reference.png> <out-dir> [regions.png]
//
// Layers are the drawing's groups with class "layer" (or, failing that, its top-level groups).
// The page is written as out-dir/index.html beside the images it shows; open it from disk.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { heat, render, score } from "./compare.ts";
import { readPng, writePng } from "./image.ts";

export async function review(drawing: string, reference: string, out: string, regions?: string) {
  mkdirSync(out, { recursive: true });
  const ref = readPng(reference);
  const shot = await render(drawing, ref.width, ref.height);
  const { mean, off, psnr } = score(shot, ref);
  writePng(`${out}/heat.png`, heat(shot, ref));
  copyFileSync(reference, `${out}/reference.png`);
  if (regions) copyFileSync(regions, `${out}/regions.png`);

  const svg = readFileSync(drawing, "utf8").replace("<svg ", '<svg id="art" ');
  const marked = [...svg.matchAll(/<g id="([^"]+)"[^>]*class="layer"[^>]*>/g)].map((m) => m[1]);
  const layers = marked.length ? marked : [...svg.matchAll(/^<g id="([^"]+)"/gm)].map((m) => m[1]);
  const sizes = layers.map((id, i) => {
    const a = svg.indexOf(`<g id="${id}"`);
    const b = i + 1 < layers.length ? svg.indexOf(`<g id="${layers[i + 1]}"`) : svg.lastIndexOf("</svg>");
    return Math.round((b - a) / 1024);
  });
  const shapes = (svg.match(/<(path|circle|ellipse|rect|polygon|use)\b/g) ?? []).length;
  const stat = (value: string, label: string) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Trace Review</title>
<style>
:root{--bg:#121214;--panel:#1b1b1f;--line:#2c2c33;--text:#e9e7e2;--mute:#8d8b86;--accent:#ff6a3d;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:13px/1.45 ui-sans-serif,system-ui,-apple-system,"PingFang SC",sans-serif}
header{display:flex;flex-wrap:wrap;gap:28px;align-items:baseline;padding:18px 24px;border-bottom:1px solid var(--line)}
h1{font-size:15px;font-weight:600;margin:0}
.stat b{display:block;font-size:20px;font-weight:600;font-variant-numeric:tabular-nums}.stat span{color:var(--mute)}
main{display:grid;grid-template-columns:1fr 280px;min-height:calc(100vh - 80px)}
.view{overflow:auto;padding:20px;display:flex;justify-content:center;align-items:flex-start}
.stage{position:relative;width:min(100%,calc(100vh - 140px));aspect-ratio:${ref.width}/${ref.height};flex:none;user-select:none}
.stage.z1{width:${ref.width}px}.stage.z2{width:${2 * ref.width}px}
.stage>svg,.stage>img{position:absolute;inset:0;width:100%;height:100%;display:block}
#ref{clip-path:inset(0 calc(100% - var(--cut,50%)) 0 0)}
.handle{position:absolute;top:0;bottom:0;left:var(--cut,50%);width:2px;background:var(--accent);translate:-1px 0;z-index:5;pointer-events:none}
.stage[data-mode=reference] #ref{clip-path:none}.stage[data-mode=reference] #art,.stage[data-mode=drawing] #ref,.stage:not([data-mode=wipe]) .handle{display:none}
#heat,#map{display:none}.stage[data-mode=heat] #heat,.stage[data-mode=map] #map{display:block;z-index:4}
aside{border-left:1px solid var(--line);background:var(--panel);padding:16px;overflow:auto;max-height:calc(100vh - 80px);position:sticky;top:0}
h2{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--mute);margin:0 0 8px;font-weight:600}
.group{margin-bottom:18px}.seg{display:flex;flex-wrap:wrap;gap:4px}
.seg button{background:#26262c;color:var(--text);border:1px solid var(--line);border-radius:5px;padding:5px 9px;font:inherit;cursor:pointer}
.seg button[aria-pressed=true]{background:var(--accent);color:#000;border-color:var(--accent)}
label{display:grid;grid-template-columns:18px 1fr auto;gap:6px;align-items:center;padding:3px 4px;border-radius:4px;cursor:pointer}
label:hover{background:#26262c}small{color:var(--mute);font-variant-numeric:tabular-nums}
p{color:var(--mute);font-size:12px;margin:6px 0 0}
@media (max-width:800px){main{grid-template-columns:1fr}aside{position:static;max-height:none;border-left:0;border-top:1px solid var(--line)}}
</style></head><body>
<header><h1>${basename(drawing)}</h1>
${stat(String(layers.length), "layers")}${stat(shapes.toLocaleString("en-US"), "shapes")}${stat(`${mean.toFixed(2)} / 255`, "mean error")}${stat(`${(off * 100).toFixed(1)}%`, "pixels off by > 12")}${stat(`${psnr.toFixed(1)} dB`, "PSNR")}${stat(`${(svg.length / 1e6).toFixed(2)} MB`, `gzip ${(gzipSync(svg).length / 1e6).toFixed(2)} MB`)}
</header>
<main><div class="view"><div class="stage" id="stage" data-mode="wipe">
${svg}
<img id="ref" src="reference.png" alt="reference">
<img id="heat" src="heat.png" alt="where they differ">
${regions ? '<img id="map" src="regions.png" alt="regions">' : ""}
<div class="handle"></div></div></div>
<aside>
<div class="group"><h2>Compare</h2><div class="seg" id="modes">
<button data-mode="wipe" aria-pressed="true">Wipe</button><button data-mode="reference">Reference</button><button data-mode="drawing">Drawing</button><button data-mode="heat">Difference</button>${regions ? '<button data-mode="map">Regions</button>' : ""}</div>
<p>Drag across the picture to wipe; Space flips between reference and drawing. Brighter is further apart.</p></div>
<div class="group"><h2>Zoom</h2><div class="seg" id="zooms"><button data-z="" aria-pressed="true">Fit</button><button data-z="z1">1:1</button><button data-z="z2">2:1</button></div></div>
<div class="group"><h2>Layers, back to front</h2>
${layers.map((id, i) => `<label><input type="checkbox" checked data-id="${id}"><span>${id}</span><small>${sizes[i]} KB</small></label>`).join("\n")}
<p>Turn a layer off to see what lies under it.</p></div>
</aside></main>
<script>
const stage = document.getElementById("stage");
const press = (group, b) => group.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
const mode = (m) => { stage.dataset.mode = m; press(document.getElementById("modes"), document.querySelector('[data-mode="' + m + '"]')); };
document.getElementById("modes").addEventListener("click", (e) => e.target.closest("button") && mode(e.target.closest("button").dataset.mode));
document.getElementById("zooms").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { stage.className = "stage " + b.dataset.z; press(e.currentTarget, b); } });
let drag = false;
const cut = (x) => { const r = stage.getBoundingClientRect(); stage.style.setProperty("--cut", Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100)) + "%"); };
stage.addEventListener("pointerdown", (e) => { if (stage.dataset.mode === "wipe") { drag = true; stage.setPointerCapture(e.pointerId); cut(e.clientX); } });
stage.addEventListener("pointermove", (e) => drag && cut(e.clientX));
stage.addEventListener("pointerup", () => (drag = false));
addEventListener("keydown", (e) => { if (e.code === "Space") { e.preventDefault(); mode(stage.dataset.mode === "reference" ? "drawing" : "reference"); } });
document.querySelector("aside").addEventListener("change", (e) => { const g = document.getElementById(e.target.dataset.id); if (g) g.style.display = e.target.checked ? "" : "none"; });
</script></body></html>`;
  writeFileSync(`${out}/index.html`, html);
  return { mean, off, psnr };
}

if (import.meta.main) {
  const [drawing, reference, out, regions] = process.argv.slice(2);
  const { mean, off, psnr } = await review(resolve(drawing), resolve(reference), resolve(out), regions && resolve(regions));
  console.log(`mean error ${mean.toFixed(2)}/255   off by > 12: ${(off * 100).toFixed(1)}%   PSNR ${psnr.toFixed(1)} dB   ${resolve(out)}/index.html`);
}
