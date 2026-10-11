// Her loose strands of hair, drawn as strokes. Where they cross the scene the picture paints them a
// pixel or two wide, too thin for a tone stack to keep. They are found in the picture as ridges: a
// thin line lighter and paler than the scene on either side of it, and only where the girl's
// plate paints hair near by (the plate paints the strands too, but freely, not where the picture
// has them). The ridges are thinned to a skeleton, followed strand by strand, and stroked at the
// strand's own width in her hair's own colors, silver or blue. (Read off a thin strand, the
// picture's colors are the scene's, blended through it.)

import { type Lab, hex, labToRgb, rgbToLab } from "../../harness/trace/color.ts";
import type { Raster } from "../../harness/trace/image.ts";
import { grow } from "../../harness/trace/mask.ts";

type P = [number, number];
export type Strand = { points: P[]; width: number; blue: boolean };

const SHORTEST = 10; // strands shorter than this, in pixels, are dropped
const WIDTHS = [1, 1.5, 2]; // strokes share these widths
const RIDGE = 0.04; // how much lighter and paler than both sides a strand is (OKLab L minus chroma)
const NEAR = 12; // how close, in pixels, the plate must paint hair
const BLUE = -0.05; // a strand this blue (OKLab b), and this much bluer than the scene beside it, is a blue one

// `paint`: the picture; `plate`: the girl's plate, in the picture's frame; `girl`: her traced outline (the
// hair's colors are read from inside it); `box`: where loose strands are sought.
export function findStrands(paint: Raster, plate: Raster, girl: Uint8Array, [x0, y0, x1, y1]: number[]): { strands: Strand[]; silver: string; blue: string } {
  const { width: w, height: h } = paint;
  const ink = Uint8Array.from(girl, (_, p) => (Math.max(plate.data[p * 4], plate.data[p * 4 + 1], plate.data[p * 4 + 2]) > 14 ? 1 : 0));
  const hair = grow(ink, w, h, NEAR);
  const away = grow(girl, w, h, 1);
  const lab = (p: number) => rgbToLab(paint.data[p * 4], paint.data[p * 4 + 1], paint.data[p * 4 + 2]);
  const pale = new Float32Array(w * h);
  for (let y = y0 - 3; y < y1 + 3; y++)
    for (let x = x0 - 3; x < x1 + 3; x++) {
      const [L, a, b] = lab(y * w + x);
      pale[y * w + x] = L - Math.hypot(a, b);
    }
  const mask = new Uint8Array(w * h);
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const p = y * w + x;
      if (!hair[p] || away[p]) continue;
      // Across the line, in any of four directions, both sides two pixels off are darker.
      for (const d of [1, w, w + 1, w - 1])
        if (pale[p] - Math.max(pale[p - 2 * d], pale[p + 2 * d]) > RIDGE) {
          mask[p] = 1;
          break;
        }
    }
  const depth = chamfer(mask, w, h);
  const bone = thin(mask, w, h);
  const strands = chains(bone, w).flatMap((chain) => {
    if (chain.length < SHORTEST) return [];
    const points = simplify(chain.map((p) => [(p % w) + 0.5, Math.floor(p / w) + 0.5] as P), 1);
    const width = Math.min(2, Math.max(1, (2 * chain.reduce((s, p) => s + Math.max(...[p, p - 1, p + 1, p - w, p + w].map((q) => depth[q])), 0)) / chain.length - 0.5));
    // Blue if blue, and bluer than the scene beside it: a silver strand over the sky is blue only
    // by what shows through it.
    const bluer = chain.map((p) => {
      const side = [p - 3, p + 3, p - 3 * w, p + 3 * w].filter((q) => !mask[q]).map((q) => lab(q)[2]);
      const b = lab(p)[2];
      return Math.max(b, b - side.reduce((s, v) => s + v, 0) / Math.max(1, side.length));
    });
    return [{ points, width, blue: bluer.sort((u, v) => u - v)[chain.length >> 1] < BLUE }];
  });
  // Her hair's two colors: the light of the silver, and the blue, as the picture paints them on her.
  const own: Lab[] = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (girl[y * w + x]) own.push(lab(y * w + x));
  const median = (list: Lab[]) => hex(labToRgb([0, 1, 2].map((k) => list.map((c) => c[k]).sort((u, v) => u - v)[list.length >> 1]) as Lab));
  return { strands, silver: median(own.filter((c) => c[0] > 0.86 && Math.hypot(c[1], c[2]) < 0.03)), blue: median(own.filter((c) => c[2] < -0.15)) };
}

// One path per shared color and width.
export function strandMarkup({ strands, silver, blue }: ReturnType<typeof findStrands>): string {
  if (!strands.length) return "";
  const groups = new Map<string, string[]>();
  for (const s of strands) {
    const width = WIDTHS.reduce((a, b) => (Math.abs(b - s.width) < Math.abs(a - s.width) ? b : a));
    const key = `${s.blue ? blue : silver} ${width}`;
    groups.set(key, [...(groups.get(key) ?? []), curve(s.points)]);
  }
  const paths = [...groups].map(([key, ds]) => {
    const [color, width] = key.split(" ");
    return `<path fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" d="${ds.join("")}"/>`;
  });
  return `<g id="strands">${paths.join("")}</g>`;
}

const f = (v: number) => (Math.round(v * 10) / 10).toString();

// Through the points, smoothly: quadratic segments between midpoints, the points as controls.
function curve(pts: P[]): string {
  if (pts.length < 3) return `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}`;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [mx, my] = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${i === pts.length - 2 ? `${f(pts[i + 1][0])} ${f(pts[i + 1][1])}` : `${f(mx)} ${f(my)}`}`;
  }
  return d;
}

// Douglas-Peucker on an open polyline.
function simplify(pts: P[], epsilon: number): P[] {
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const walk = (i: number, j: number) => {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[j];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let worst = -1;
    let at = -1;
    for (let k = i + 1; k < j; k++) {
      const d = Math.abs((bx - ax) * (pts[k][1] - ay) - (by - ay) * (pts[k][0] - ax)) / len;
      if (d > worst) [worst, at] = [d, k];
    }
    if (worst > epsilon) {
      keep[at] = 1;
      walk(i, at);
      walk(at, j);
    }
  };
  walk(0, pts.length - 1);
  return pts.filter((_, i) => keep[i]);
}

// Distance to the nearest pixel outside the mask, roughly (3-4 chamfer), in pixels.
function chamfer(mask: Uint8Array, w: number, h: number): Float32Array {
  const d = Float32Array.from(mask, (v) => (v ? 1e6 : 0));
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (d[y * w + x]) d[y * w + x] = Math.min(d[y * w + x], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) if (d[y * w + x]) d[y * w + x] = Math.min(d[y * w + x], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
  return d.map((v) => v / 3);
}

// Zhang-Suen thinning: the mask worn down to lines one pixel wide.
function thin(mask: Uint8Array, w: number, h: number): Uint8Array {
  const m = Uint8Array.from(mask);
  const nb = (p: number) => [m[p - w], m[p - w + 1], m[p + 1], m[p + w + 1], m[p + w], m[p + w - 1], m[p - 1], m[p - w - 1]];
  for (let changed = true; changed; ) {
    changed = false;
    for (const step of [0, 1]) {
      const drop: number[] = [];
      for (let y = 1; y < h - 1; y++)
        for (let x = 1; x < w - 1; x++) {
          const p = y * w + x;
          if (!m[p]) continue;
          const n = nb(p);
          const count = n.reduce((s, v) => s + v, 0);
          if (count < 2 || count > 6) continue;
          let turns = 0;
          for (let k = 0; k < 8; k++) if (!n[k] && n[(k + 1) % 8]) turns++;
          if (turns !== 1) continue;
          if (step === 0 ? n[0] * n[2] * n[4] || n[2] * n[4] * n[6] : n[0] * n[2] * n[6] || n[0] * n[4] * n[6]) continue;
          drop.push(p);
        }
      for (const p of drop) m[p] = 0;
      if (drop.length) changed = true;
    }
  }
  return m;
}

// The skeleton followed into chains of pixels: from each loose end, on through junctions and over
// gaps of up to GAP pixels, always to the unused pixel that turns least from the way the chain was
// going, until none lies within TURN of it.
const GAP = 3;
const TURN = Math.PI / 3;
function chains(bone: Uint8Array, w: number): number[][] {
  const used = new Uint8Array(bone.length);
  const near = (p: number, r: number) => {
    const out: number[] = [];
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx || dy) out.push(p + dy * w + dx);
    return out.filter((q) => q >= 0 && q < bone.length && bone[q] && Math.abs((q % w) - (p % w)) <= r);
  };
  const follow = (start: number) => {
    const chain = [start];
    used[start] = 1;
    for (;;) {
      const p = chain[chain.length - 1];
      const back = chain[Math.max(0, chain.length - 4)];
      const heading = chain.length > 1 ? Math.atan2(Math.floor(p / w) - Math.floor(back / w), (p % w) - (back % w)) : undefined;
      let best = -1;
      let cost = Infinity;
      for (const r of [1, GAP]) {
        for (const q of near(p, r)) {
          if (used[q]) continue;
          const dir = Math.atan2(Math.floor(q / w) - Math.floor(p / w), (q % w) - (p % w));
          const turn = heading === undefined ? 0 : Math.abs(((dir - heading + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
          if (turn > TURN) continue;
          const c = turn + 0.1 * Math.hypot((q % w) - (p % w), Math.floor(q / w) - Math.floor(p / w));
          if (c < cost) [best, cost] = [q, c];
        }
        if (best >= 0) break;
      }
      if (best < 0) break;
      // Mark the pixels beside the step as used too, so a strand two pixels wide is followed once.
      for (const q of near(best, 1)) if (!used[q] && near(q, 1).includes(p)) used[q] = 1;
      used[best] = 1;
      chain.push(best);
    }
    return chain;
  };
  const degree = (p: number) => near(p, 1).length;
  const out: number[][] = [];
  for (const want of [(d: number) => d === 1, () => true])
    for (let p = 0; p < bone.length; p++) if (bone[p] && !used[p] && want(degree(p))) out.push(follow(p));
  return out;
}
