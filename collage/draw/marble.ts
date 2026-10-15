// Marble, as cel-shaded statuary: large calm planes of four warm marble tones and one highlight,
// turning with the form, with the feature lines as dark seams between them; the figure only, the
// ground transparent.
//
// The planes come from a clean light model, not from the beauty render (whose scan grain k-means
// kept as islands): the normals smoothed at the scale of the form, lit by one key (the render's own,
// from above, on its side) and a soft fill from the other, with the key's cast shadows read off the
// tone pass and the overlaps deepened. The light is cut into tones by threshold; every region
// smaller than LEAST is merged into the neighbour it shares most border with; the tone map is then
// traced as a cel stack (tones down light to dark, each reaching a little under the next).
import { rgbToLab, type Lab } from "../../portraits/harness/trace/color.ts";
import { blur, stack } from "../../portraits/harness/trace/stack.ts";
import { markup } from "../../portraits/harness/trace/svg.ts";
import { blur as wblur, rgb } from "../../portraits/pieces/wavy-line-engraving/engrave.ts";
import type { Fields } from "./fields.ts";
import { occlusion, toLinear, unit } from "./light.ts";
import { findLines, strokes } from "./lines.ts";

// Highlight, then four tones light to dark; the seam a step darker than the darkest.
const TONES = ["#FBF8F2", "#ECE5D9", "#D8CEBF", "#BCB09F", "#988B79"];
const SEAM = "#6E6253";
const CUTS = [0.9, 0.68, 0.46, 0.26]; // light above CUTS[i] takes tone i
const FORM = 6; // source pixels the normals are smoothed over
const LEAST = 90; // frame px²: smaller regions merge into a neighbour

export function marble(fields: Fields, title: string): string {
  const { frame, source, side } = fields;
  const { alpha, normal, tone } = source;
  const { width: w, height: h } = alpha;
  const solid = Float32Array.from(alpha.data, (a) => (a > 0.5 ? 1 : 0));
  const KEY = unit([side * 1, 0.9, 0.6]); // the render's key, in camera space (+y up, +z toward us)
  const FILL = unit([-side * 0.7, 0.05, 0.75]);
  const n = normal.map((f) => wblur(f.data, solid, w, h, FORM));
  const behind = occlusion(source, 9 / frame.scale);
  // The key's cast shadows: where the tone pass is far darker than the key alone would light it.
  const toneLin = wblur(Float32Array.from({ length: w * h }, (_, p) => toLinear(tone.data[p * 4]) / 0.83), solid, w, h, FORM);
  const light = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) {
    if (!solid[p]) continue;
    const l = Math.hypot(n[0][p], n[1][p], n[2][p]) || 1;
    const [x, y, z] = [n[0][p] / l, n[1][p] / l, n[2][p] / l];
    const key = Math.max(0, x * KEY[0] + y * KEY[1] + z * KEY[2]);
    const fill = Math.max(0, x * FILL[0] + y * FILL[1] + z * FILL[2]);
    const lit = Math.min(1, Math.max(0, (toneLin[p] - 0.04) / Math.max(0.05, key * 0.95)));
    light[p] = (0.08 + 0.85 * key * (0.25 + 0.75 * lit) + 0.25 * fill) * (1 - 0.55 * behind[p]);
  }

  // Tones by threshold.
  const toneOf = new Int8Array(w * h).fill(-1);
  for (let p = 0; p < w * h; p++) if (solid[p]) toneOf[p] = CUTS.findIndex((c) => light[p] > c) < 0 ? CUTS.length : CUTS.findIndex((c) => light[p] > c);

  // Merge small regions, smallest first, until none is left under LEAST.
  const least = LEAST / frame.scale ** 2;
  for (let round = 0; round < 8; round++) {
    const label = new Int32Array(w * h).fill(-1);
    const regions: number[][] = [];
    for (let s = 0; s < w * h; s++) {
      if (toneOf[s] < 0 || label[s] >= 0) continue;
      const id = regions.length;
      const piece = [s];
      label[s] = id;
      for (let i = 0; i < piece.length; i++) {
        const p = piece[i];
        const x = p % w;
        for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w])
          if (q >= 0 && q < w * h && label[q] < 0 && toneOf[q] === toneOf[s]) (label[q] = id), piece.push(q);
      }
      regions.push(piece);
    }
    const small = regions.map((r, id) => [r.length, id]).filter(([a]) => a < least).sort((a, b) => a[0] - b[0]);
    if (!small.length) break;
    for (const [, id] of small) {
      const border = new Map<number, number>();
      for (const p of regions[id]) {
        const x = p % w;
        for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w])
          if (q >= 0 && q < w * h && toneOf[q] >= 0 && toneOf[q] !== toneOf[p]) border.set(toneOf[q], (border.get(toneOf[q]) ?? 0) + 1);
      }
      if (!border.size) continue;
      const to = [...border.entries()].sort((a, b) => b[1] - a[1])[0][0];
      for (const p of regions[id]) toneOf[p] = to;
    }
  }

  // The tone map as a flat painting, traced as a cel stack.
  const palette: Lab[] = TONES.map((t) => rgbToLab(...rgb(t)));
  const planes = [0, 1, 2].map((c) => Float32Array.from(toneOf, (t) => (t >= 0 ? palette[t][c] : palette[0][c]))) as [Float32Array, Float32Array, Float32Array];
  const paint = { width: w, height: h, data: new Uint8Array(w * h * 4) };
  const region = blur(Float32Array.from(solid, (v) => (v ? 1 : -1)), w, h, 1.2);
  const pieces = stack(planes, paint, region, { x: 0, y: 0, width: w, height: h }, palette, {
    soften: 2.5,
    flat: 1e9,
    minArea: least / 2,
    fit: { tolerance: 0.8, corner: 70 },
  }).map((p) => ({ ...p, fill: { color: TONES[p.tone] } }));
  const { defs, paths } = markup(pieces, "m");

  // The seams: the shared feature lines, dark, tapered.
  const seams = strokes(findLines(fields).filter((l) => l.kind !== "silhouette"), (_f, s, kind) => {
    if (kind === "occlusion") return 0.7 + 0.9 * s;
    if (kind === "feature") return 0.45 + 0.8 * s;
    if (kind === "form") return 0.35 + 0.5 * s;
    return 0.6;
  });

  const { width: W, height: H, scale, x0, y0 } = frame;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>${title}, in marble</title>
${defs}<g transform="scale(${scale.toFixed(5)}) translate(${(-x0).toFixed(2)} ${(-y0).toFixed(2)})">
${paths}
</g>
<path fill="${SEAM}" transform="scale(.25)" d="${seams}"/>
</svg>`;
}
