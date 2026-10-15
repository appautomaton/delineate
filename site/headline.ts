// The headline, drawn in crayon in the page's own serif: each letter outlined, then coloured in with the tip
// driven back and forth inside it, letter by letter, line by line, as a hand would letter a title; once the
// hand is done, a wash of the same ink settles under the strokes so the words read as dark as type.
//
// The letterforms are traced once from Hedvig Letters Serif, set large in Chrome, its ink read back and traced
// into closed outlines kept in headline.json, so building the page needs neither the browser nor the network.
// Trace them again only when the words change:
//
//   node site/headline.ts

import { readFileSync, writeFileSync } from "node:fs";
import { Hand } from "../footers/crayon/hand.ts";
import { Sheet } from "../footers/crayon/shapes.ts";
import { f, fixed } from "../footers/lib/number.ts";

export const LINES = ["Drawings", "that move", "when you do."];
const SIZE = 240; // px each line is set at to trace it; one em of the page's headline
const LEADING = 1.04;
const STEP = 4; // px between the points kept along an outline

type Pt = [number, number];
type Line = { text: string; width: number; height: number; rings: number[][] };

const points = (ring: number[]): Pt[] => Array.from({ length: ring.length / 2 }, (_, i) => [ring[i * 2], ring[i * 2 + 1]]);
const area = (pts: Pt[]) => Math.abs(pts.reduce((s, [x, y], i) => s + x * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * y, 0) / 2);
function inside([x, y]: Pt, poly: Pt[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

// The outlines of a line as letters: each outer outline with the counters it holds, left to right.
function letters(rings: number[][]): { outer: Pt[]; holes: Pt[][] }[] {
  const shapes = rings.map(points).sort((a, b) => area(b) - area(a));
  const out: { outer: Pt[]; holes: Pt[][] }[] = [];
  for (const s of shapes) {
    const home = out.find((l) => inside(s[0], l.outer));
    if (home) home.holes.push(s);
    else out.push({ outer: s, holes: [] });
  }
  return out.sort((a, b) => Math.min(...a.outer.map((p) => p[0])) - Math.min(...b.outer.map((p) => p[0])));
}

const pathOf = (pts: Pt[]) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;

// Each line of the headline as an <svg> laid over its own words, and the seconds the whole takes to draw. A line
// starts a beat after the one above it; within it each letter is outlined in turn, left to right, and coloured
// in a little behind its outline.
export function headline(): { lines: string[]; time: number } {
  const data: { lines: Line[] } = JSON.parse(readFileSync(new URL("headline.json", import.meta.url), "utf8"));
  let end = 0;
  const lines = data.lines.map((line, k) => {
    const sheet = new Sheet(`hl${k}-`);
    const h = new Hand(101 + k, 0);
    const parts: string[] = [], tones: string[] = [];
    const start = 0.15 + k * 0.32;
    letters(line.rings).forEach(({ outer, holes }, i, all) => {
      const at = start + (i / Math.max(1, all.length - 1)) * 0.95;
      h.clock = at;
      for (const ring of [outer, ...holes]) h.line(ring, "ink", { closed: true, samples: 2, width: 3, n: 2, secs: 0.32, weight: [2.6, 3.6], alpha: [0.85, 1], chunk: [60, 160] });
      const outline = h.take();
      h.clock = at + 0.38;
      h.fill(outer, "ink", { angle: -52, spacing: 5.5, width: 5, n: 2, secs: 0.4, weight: [4.2, 5.8], alpha: [0.85, 1], step: 7 });
      const id = `${sheet.prefix}${sheet.clips.length}`;
      const shape = [outer, ...holes].map(pathOf).join("");
      sheet.clips.push(`<clipPath id="${id}"><path clip-rule="evenodd" d="${shape}"/></clipPath>`);
      tones.push(`<path class="tone" fill-rule="evenodd" d="${shape}"/>`);
      parts.push(`<g clip-path="url(#${id})">${h.take()}</g>`, outline);
      end = Math.max(end, h.clock + 0.4);
    });
    return (
      `<svg class="wax lettered" viewBox="0 0 ${line.width} ${line.height}" style="width:${fixed(line.width / SIZE, 4)}em;height:${fixed(line.height / SIZE, 4)}em" aria-hidden="true">` +
      `<defs>${sheet.defs()}</defs><g>${tones.join("")}${parts.join("")}</g></svg>`
    );
  });
  return { lines, time: Math.round(end * 10) / 10 };
}

// A closed outline, resampled to points STEP apart, so every letter carries detail in proportion to its size.
function resample(ring: Float64Array): number[] {
  const n = ring.length / 2, out: number[] = [];
  let carry = 0;
  for (let i = 0; i < n; i++) {
    const [ax, ay, bx, by] = [ring[i * 2], ring[i * 2 + 1], ring[((i + 1) % n) * 2], ring[((i + 1) % n) * 2 + 1]];
    const l = Math.hypot(bx - ax, by - ay);
    for (let s = carry; s < l; s += STEP) out.push(+(ax + ((bx - ax) * s) / l).toFixed(1), +(ay + ((by - ay) * s) / l).toFixed(1));
    carry = (carry - l) % STEP;
    if (carry < 0) carry += STEP;
  }
  return out;
}

if (import.meta.main) {
  const { launch } = await import("../portraits/harness/browser.ts");
  const { contours } = await import("../portraits/harness/trace/contour.ts");
  const { decodePng } = await import("../portraits/harness/trace/image.ts");
  const browser = await launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  // Each line in a box of its own, padded a little each side so no stroke is cut, as the page lays it.
  await page.setContent(`<!doctype html><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif:opsz@12..24&display=block">
<style>body{margin:0;background:transparent} p{margin:0;padding:0 .12em;display:inline-block;font:400 ${SIZE}px/${LEADING} "Hedvig Letters Serif";letter-spacing:-.015em;white-space:pre}</style>
${LINES.map((l) => `<div><p>${l}</p></div>`).join("")}`);
  await page.evaluate("document.fonts.ready");
  const lines: Line[] = [];
  for (const [k, p] of (await page.$$("p")).entries()) {
    const png = decodePng(await p.screenshot({ omitBackground: true }));
    const field = new Float32Array(png.width * png.height);
    for (let i = 0; i < field.length; i++) field[i] = png.data[i * 4 + 3] / 255 - 0.5;
    const rings = contours(field, png.width, png.height, 12).map(resample).filter((r) => r.length >= 8);
    lines.push({ text: LINES[k], width: png.width, height: png.height, rings });
  }
  await browser.close();
  writeFileSync(new URL("headline.json", import.meta.url), JSON.stringify({ size: SIZE, leading: LEADING, lines }));
  console.log(lines.map((l) => `${l.text}: ${l.width}×${l.height}, ${l.rings.length} outlines`).join("\n"));
}
