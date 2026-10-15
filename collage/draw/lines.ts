// The lines that hold the figure's form, found where its fields break, and drawn as tapered strokes.
//
//   silhouette   the figure's outline (and its holes), from the render's opacity
//   occlusion    where one form passes in front of another: depth jumps faster than its own slope
//   crease       where the surface folds sharply (plinth edges, the headband, the drape's hems):
//                normals that turn across a pixel or two while each side stays flat
//
// Pixels decide only where a line may lie; the stroke itself is drawn by rule: smoothed along its
// length, weighted by the light (a contour facing away from the key light is heavier) and by how far
// the form stands in front, and tapered to a point at both ends.

import { contours, type Ring } from "../../portraits/harness/trace/contour.ts";
import { fitRing, pathData } from "../../portraits/harness/trace/bezier.ts";
import { blur, type Field } from "../../portraits/pieces/wavy-line-engraving/engrave.ts";
import type { Fields, Frame } from "./fields.ts";

type P = [number, number];
export type Kind = "silhouette" | "occlusion" | "feature" | "form" | "crease";
// A line in the frame's pixels: its points, how strongly it breaks at each (0..1), how far its form
// faces away from the key light at each (1 away, -1 toward; read off the outward normal of the
// nearer form), whether it closes on itself.
export type Line = { kind: Kind; pts: P[]; strength: number[]; facing: number[]; closed: boolean };

// Chains shorter than this, in frame pixels, are crumbs.
const SHORTEST = { occlusion: 7, feature: 9, form: 18, crease: 24 };
// Surface curvature, measured as the divergence of the normals (smoothed SMOOTH source pixels so
// the scan's grain settles): a valley (the eye's socket, a mouth, the gap between fingers, a band's
// edge) turns the normals toward each other. Hysteresis: a valley is seeded where it is deeper than
// SEED and runs on while deeper than RUN; a whole chain must average MEAN or it is grain.
const SMOOTH = 1.2;
const SEED = 0.12;
const RUN = 0.06;
const MEAN = 0.1;
const FORM = 2.5;
const FORM_SEED = 0.045;
// A ridge sharp enough to be an edge (the plinth's corners): only long ones.
const RIDGE = 0.3;

// `jump`: metres a form must stand in front of its neighbour, beyond its own slope.
export function findLines({ frame, source: { alpha, depth, normal }, side }: Fields, JUMP = 0.008): Line[] {
  // The key light, as the tone render has it: from above, on its side. A unit vector toward it.
  const n = Math.hypot(0.62, 0.78);
  const light: P = [(side * 0.62) / n, -0.78 / n];
  const facing = (out: P[]) => out.map(([x, y]) => -(x * light[0] + y * light[1]));
  const { width: w, height: h } = alpha;
  const ins = (p: number) => alpha.data[p] > 0.5;
  const z = depth.data;
  const jump = new Float32Array(w * h);
  const toward = new Float32Array(w * h * 2);
  const steps: [number, number][] = [[1, 0], [0, 1], [1, 1], [-1, 1], [-1, 0], [0, -1], [-1, -1], [1, -1]];
  for (let y = 3; y < h - 3; y++)
    for (let x = 3; x < w - 3; x++) {
      const p = y * w + x;
      if (!ins(p)) continue;
      for (const [dx, dy] of steps) {
        const d = dy * w + dx;
        if (!ins(p + d)) continue;
        const back = ins(p - d) ? z[p - d] : z[p];
        const j = (z[p + d] - z[p] - Math.max(0, z[p] - back)) / Math.hypot(dx, dy) ** 0.5;
        if (j > jump[p]) {
          jump[p] = j;
          const l = Math.hypot(dx, dy);
          toward[p * 2] = dx / l;
          toward[p * 2 + 1] = dy / l;
        }
      }
    }
  // A step hard by the silhouette runs beside it as a second outline: the silhouette draws it.
  const solid = Float32Array.from(alpha.data, (a) => (a > 0.5 ? 1 : 0));
  const clear = shrinkMask(Uint8Array.from(solid), w, h, 5);
  const jumps = Uint8Array.from(jump, (j, p) => (j > JUMP && clear[p] ? 1 : 0));

  // Curvature.
  const nb = normal.map((f) => blur(f.data, solid, w, h, SMOOTH));
  const inner = shrinkMask(Uint8Array.from(solid), w, h, 4);
  const nearJump = grow(jumps, w, h, 3);
  const div = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (!inner[p] || nearJump[p] || normal[2].data[p] < 0.25) continue;
      div[p] = (nb[0][p + 1] - nb[0][p - 1]) / 2 - (nb[1][p + w] - nb[1][p - w]) / 2;
    }
  const valley = Float32Array.from(div, (d) => Math.max(0, -d));
  const ridge = Float32Array.from(div, (d) => Math.max(0, d));
  // The same at the scale of the form (the abdomen's grooves, the chest, the drape's folds): broad,
  // shallow valleys, kept only when long, so the grain never qualifies.
  const nc = normal.map((f) => blur(f.data, solid, w, h, FORM));
  const broad = new Float32Array(w * h);
  for (let y = 2; y < h - 2; y++)
    for (let x = 2; x < w - 2; x++) {
      const p = y * w + x;
      if (!inner[p] || nearJump[p] || normal[2].data[p] < 0.25) continue;
      broad[p] = Math.max(0, -((nc[0][p + 1] - nc[0][p - 1]) / 2 - (nc[1][p + w] - nc[1][p - w]) / 2));
    }
  const forms = hysteresis(broad, FORM_SEED, FORM_SEED * 0.5, w, h);
  const valleys = hysteresis(valley, SEED, RUN, w, h);
  // A form line where a fine line already runs is the same line.
  const nearFine = grow(valleys, w, h, 3);
  for (let p = 0; p < w * h; p++) if (nearFine[p]) forms[p] = 0;
  const ridges = hysteresis(ridge, RIDGE, RIDGE * 0.6, w, h);

  const toFrame = ([x, y]: P): P => [(x + 0.5 - frame.x0) * frame.scale, (y + 0.5 - frame.y0) * frame.scale];
  const lines: Line[] = [];

  // The silhouette: the opacity's half-way outline, rings in source pixels (centers at +0.5).
  for (const ring of contours(Float32Array.from(alpha.data, (a) => a - 0.5), w, h, 30 / frame.scale ** 2)) {
    const pts = resample(smoothClosed(toPoints(ring), 2), 1.5 / frame.scale).map(([x, y]) => toFrame([x - 0.5, y - 0.5]));
    const out = normals(pts, true);
    lines.push({ kind: "silhouette", pts, strength: pts.map(() => 1), facing: facing(fixOutward(pts, out, alpha, frame)), closed: true });
  }

  for (const [kind, mask] of [["occlusion", jumps], ["feature", valleys], ["form", forms], ["crease", ridges]] as const) {
    const thin = skeleton(close1(mask, w, h), w, h);
    for (const chain of chains(thin, w, h)) {
      const length = chain.length * frame.scale;
      if (length < (kind === "feature" ? 2.5 : SHORTEST[kind])) continue;
      const depthOf = (p: number) => Math.max(...around(kind === "feature" ? valley : kind === "form" ? broad : kind === "crease" ? ridge : jump, p, w, h));
      const raw = chain.map(depthOf);
      // A short valley must be a deep one (an eye, a nostril, a tooth's edge); grain is short and shallow.
      const mean = raw.reduce((a, v) => a + v, 0) / raw.length;
      if (kind === "feature" && mean < (length < SHORTEST.feature / 2 ? 1.3 * MEAN : length < SHORTEST.feature ? 1.2 * MEAN : MEAN)) continue;
      const strength = smoothValues(
        raw.map((v) => (kind === "occlusion" ? Math.min(1, Math.max(0, (v - JUMP) / 0.06)) : kind === "feature" ? Math.min(1, Math.max(0, (v - RUN) / 0.35)) : kind === "form" ? Math.min(1, Math.max(0, (v - FORM_SEED * 0.5) / 0.12)) : 0.5)),
        6,
      );
      const src = smoothOpen(chain.map((p) => [p % w, Math.floor(p / w)] as P), 2.4);
      // The nearer form lies away from the farther neighbour.
      const away = smoothVectors(chain.map((p) => [-toward[p * 2], -toward[p * 2 + 1]] as P), 6);
      const pts = src.map(toFrame);
      const nrm = normals(pts, false);
      const out = kind === "occlusion" ? nrm.map((v, i) => (v[0] * away[i][0] + v[1] * away[i][1] >= 0 ? v : ([-v[0], -v[1]] as P))) : nrm;
      lines.push({ kind, pts, strength, facing: facing(out), closed: false });
    }
  }
  return lines;
}

// Where `v` exceeds `hi`, grown through where it exceeds `lo`.
function hysteresis(v: Float32Array, hi: number, lo: number, w: number, h: number): Uint8Array {
  const out = new Uint8Array(v.length);
  const stack: number[] = [];
  for (let p = 0; p < v.length; p++) if (v[p] > hi) (out[p] = 1), stack.push(p);
  while (stack.length) {
    const p = stack.pop()!;
    const [x, y] = [p % w, Math.floor(p / w)];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (x + dx < 0 || y + dy < 0 || x + dx >= w || y + dy >= h) continue;
        const q = p + dy * w + dx;
        if (!out[q] && v[q] > lo) (out[q] = 1), stack.push(q);
      }
  }
  return out;
}

function shrinkMask(m: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const inv = Uint8Array.from(m, (v) => 1 - v);
  return Uint8Array.from(grow(inv, w, h, r), (v) => 1 - v);
}

// How heavy a line is at each point: `weight` maps a point's facing (1 away from the light, -1
// toward it) and strength to a width in pixels. Widths are smoothed along the line.
export type Weight = (facing: number, strength: number, kind: Kind) => number;

// The strokes as path data, in quarter pixels (draw with transform="scale(.25)"): each line a
// filled outline, tapering to a point at both ends over `taper` pixels. A closed line that never
// thins below `lost` is one closed band; else it breaks where it does, each run tapering there.
export function strokes(lines: Line[], weight: Weight, { taper = 14, lost = 0.3, minLength = 2.5 } = {}): string {
  const rings: Float64Array[] = [];
  for (const line of lines) {
    const raw = line.pts.map((_, i) => weight(line.facing[i], line.strength[i], line.kind));
    const width = line.closed ? smoothClosedValues(raw, 5) : smoothValues(raw, 5);
    const N = line.pts.length;
    if (line.closed && Math.min(...width) >= lost) {
      const nrm = normals(line.pts, true);
      rings.push(ring(line.pts.map((p, i) => off(p, nrm[i], width[i] / 2))));
      rings.push(ring(line.pts.map((p, i) => off(p, nrm[i], -width[i] / 2)).reverse()));
      continue;
    }
    // Runs where the line is drawn; a closed line starts at its thinnest point.
    const start = line.closed ? width.indexOf(Math.min(...width)) : 0;
    const order = Array.from({ length: N }, (_, i) => (start + i) % N);
    let run: number[] = [];
    const flush = () => {
      if (run.length >= 3) {
        const pts = run.map((i) => line.pts[i]);
        const len = pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
        if (len >= minLength) {
          const t = Math.min(line.kind === "feature" ? taper * 0.5 : taper, len / 2.2);
          let s = 0;
          const wid = run.map((i, k) => {
            if (k) s += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
            const end = Math.min(1, s / t, (len - s) / t);
            return width[i] * Math.sin((Math.PI / 2) * end) ** 0.8;
          });
          const nrm = normals(pts, false);
          const left = pts.map((p, k) => off(p, nrm[k], wid[k] / 2));
          const right = pts.map((p, k) => off(p, nrm[k], -wid[k] / 2));
          rings.push(ring([...left, ...right.reverse()]));
        }
      }
      run = [];
    };
    for (const i of order) {
      if (width[i] >= lost) run.push(i);
      else flush();
    }
    flush();
  }
  return pathData(rings.map((r) => fitRing(r, { tolerance: 0.5, step: 2, corner: 60 })));
}

const off = ([x, y]: P, [nx, ny]: P, d: number): P => [x + nx * d, y + ny * d];
const ring = (pts: P[]) => Float64Array.from(pts.flatMap(([x, y]) => [x * 4, y * 4]));
const toPoints = (r: Ring): P[] => Array.from({ length: r.length / 2 }, (_, i) => [r[i * 2], r[i * 2 + 1]] as P);

// Unit normals (the tangent turned a quarter, to the left in screen terms).
function normals(pts: P[], closed: boolean): P[] {
  const N = pts.length;
  return pts.map((_, i) => {
    const a = pts[closed ? (i - 2 + N) % N : Math.max(0, i - 2)];
    const b = pts[closed ? (i + 2) % N : Math.min(N - 1, i + 2)];
    const [tx, ty] = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(tx, ty) || 1;
    return [-ty / l, tx / l] as P;
  });
}

// Make the outward normals point out of the figure, checked against the opacity a few pixels off.
function fixOutward(pts: P[], out: P[], alpha: Field, frame: Frame): P[] {
  let votes = 0;
  const a = (x: number, y: number) => {
    const sx = Math.round(frame.x0 + x / frame.scale - 0.5);
    const sy = Math.round(frame.y0 + y / frame.scale - 0.5);
    return sx < 0 || sy < 0 || sx >= alpha.width || sy >= alpha.height ? 0 : alpha.data[sy * alpha.width + sx];
  };
  pts.forEach((p, i) => (votes += a(p[0] + out[i][0] * 3, p[1] + out[i][1] * 3) < a(p[0] - out[i][0] * 3, p[1] - out[i][1] * 3) ? 1 : -1));
  return votes >= 0 ? out : out.map(([x, y]) => [-x, -y] as P);
}

function resample(pts: P[], step: number): P[] {
  const out: P[] = [pts[0]];
  let carry = 0;
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i % pts.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let s = step - carry;
    while (s < l) {
      out.push([a[0] + ((b[0] - a[0]) * s) / l, a[1] + ((b[1] - a[1]) * s) / l]);
      s += step;
    }
    carry = l - (s - step);
  }
  return out;
}

function kernel(sigma: number): number[] {
  const r = Math.ceil(sigma * 2.5);
  return Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
}
function smoothClosed(pts: P[], sigma: number): P[] {
  const k = kernel(sigma);
  const r = (k.length - 1) / 2;
  const N = pts.length;
  return pts.map((_, i) => {
    let [x, y, s] = [0, 0, 0];
    k.forEach((g, j) => {
      const q = pts[(i + j - r + N * 4) % N];
      x += q[0] * g;
      y += q[1] * g;
      s += g;
    });
    return [x / s, y / s] as P;
  });
}
// Open chains keep their ends where they are, and smooth less toward them.
function smoothOpen(pts: P[], sigma: number): P[] {
  const k = kernel(sigma);
  const r = (k.length - 1) / 2;
  const N = pts.length;
  return pts.map((_, i) => {
    const reach = Math.min(r, i, N - 1 - i);
    let [x, y, s] = [0, 0, 0];
    for (let j = -reach; j <= reach; j++) {
      const g = k[j + r];
      x += pts[i + j][0] * g;
      y += pts[i + j][1] * g;
      s += g;
    }
    return [x / s, y / s] as P;
  });
}
function smoothValues(v: number[], sigma: number): number[] {
  const k = kernel(sigma);
  const r = (k.length - 1) / 2;
  return v.map((_, i) => {
    let [a, s] = [0, 0];
    for (let j = -r; j <= r; j++) {
      const q = i + j;
      if (q < 0 || q >= v.length) continue;
      a += v[q] * k[j + r];
      s += k[j + r];
    }
    return a / s;
  });
}
function smoothClosedValues(v: number[], sigma: number): number[] {
  const k = kernel(sigma);
  const r = (k.length - 1) / 2;
  const N = v.length;
  return v.map((_, i) => k.reduce((a, g, j) => a + g * v[(i + j - r + N * 4) % N], 0) / k.reduce((a, g) => a + g, 0));
}
function smoothVectors(v: P[], sigma: number): P[] {
  const xs = smoothValues(v.map((p) => p[0]), sigma);
  const ys = smoothValues(v.map((p) => p[1]), sigma);
  return xs.map((x, i) => [x, ys[i]] as P);
}

function around(f: Float32Array, p: number, w: number, h: number): number[] {
  const out: number[] = [];
  const [x, y] = [p % w, Math.floor(p / w)];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (x + dx >= 0 && y + dy >= 0 && x + dx < w && y + dy < h) out.push(f[p + dy * w + dx]);
  return out;
}

function grow(m: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const out = new Uint8Array(m.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (x + dx >= 0 && y + dy >= 0 && x + dx < w && y + dy < h) out[(y + dy) * w + x + dx] = 1;
    }
  return out;
}
// Close one-pixel gaps (grow by one, then thin back to a skeleton).
const close1 = (m: Uint8Array, w: number, h: number) => grow(m, w, h, 1);

// Zhang-Suen thinning to one-pixel skeletons.
function skeleton(src: Uint8Array, w: number, h: number): Uint8Array {
  const m = Uint8Array.from(src);
  const nb = (p: number) => [m[p - w], m[p - w + 1], m[p + 1], m[p + w + 1], m[p + w], m[p + w - 1], m[p - 1], m[p - w - 1]];
  for (let changed = true; changed; ) {
    changed = false;
    for (const pass of [0, 1]) {
      const kill: number[] = [];
      for (let y = 1; y < h - 1; y++)
        for (let x = 1; x < w - 1; x++) {
          const p = y * w + x;
          if (!m[p]) continue;
          const v = nb(p);
          const b = v.reduce((s, a) => s + a, 0);
          if (b < 2 || b > 6) continue;
          let a = 0;
          for (let i = 0; i < 8; i++) if (!v[i] && v[(i + 1) % 8]) a++;
          if (a !== 1) continue;
          if (pass === 0 ? v[0] * v[2] * v[4] || v[2] * v[4] * v[6] : v[0] * v[2] * v[6] || v[0] * v[4] * v[6]) continue;
          kill.push(p);
        }
      for (const p of kill) m[p] = 0;
      if (kill.length) changed = true;
    }
  }
  return m;
}

// A skeleton's chains. A walk runs on through junctions, taking the branch that turns least, so a
// long line is not cut by every spur that meets it; spurs are left as short chains of their own.
// Then chains whose ends meet across a small gap, heading the same way, are joined.
function chains(m: Uint8Array, w: number, h: number): number[][] {
  const offs = [-w - 1, -w, -w + 1, -1, 1, w - 1, w, w + 1];
  const xy = (p: number): P => [p % w, Math.floor(p / w)];
  const nbrs = (p: number) => offs.map((d) => p + d).filter((q) => q >= 0 && q < w * h && m[q] && Math.abs((q % w) - (p % w)) <= 1);
  const used = new Uint8Array(m.length);
  const out: number[][] = [];
  const walk = (start: number) => {
    const chain = [start];
    used[start] = 1;
    for (;;) {
      const p = chain[chain.length - 1];
      const next = nbrs(p).filter((q) => !used[q]);
      if (!next.length) break;
      const back = chain[Math.max(0, chain.length - 4)];
      const [px, py] = xy(p);
      const [bx, by] = xy(back);
      const dir: P = [px - bx, py - by];
      const score = (q: number) => {
        const [qx, qy] = xy(q);
        const [dx, dy] = [qx - px, qy - py];
        return chain.length > 1 ? (dx * dir[0] + dy * dir[1]) / (Math.hypot(dx, dy) * (Math.hypot(...dir) || 1)) : -Math.hypot(dx, dy);
      };
      next.sort((a, b) => score(b) - score(a));
      for (const q of next.slice(1)) if (Math.abs(q - next[0]) === 1 || Math.abs(q - next[0]) === w) used[q] = 1; // the corner pixel beside the step
      chain.push(next[0]);
      used[next[0]] = 1;
    }
    return chain;
  };
  const degree = (p: number) => nbrs(p).length;
  for (let p = 0; p < m.length; p++) if (m[p] && !used[p] && degree(p) === 1) {
    const c = walk(p);
    out.push(c);
  }
  for (let p = 0; p < m.length; p++) if (m[p] && !used[p]) out.push(walk(p));
  // Join ends across gaps.
  const GAP = 5;
  const end = (c: number[], head: boolean): { at: P; dir: P } => {
    const a = xy(head ? c[0] : c[c.length - 1]);
    const b = xy(head ? c[Math.min(c.length - 1, 5)] : c[Math.max(0, c.length - 6)]);
    const l = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
    return { at: a, dir: [(a[0] - b[0]) / l, (a[1] - b[1]) / l] };
  };
  let joined = true;
  const list = out.filter((c) => c.length >= 3);
  while (joined) {
    joined = false;
    outer: for (let i = 0; i < list.length; i++)
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const a = end(list[i], false);
        const b = end(list[j], true);
        const gap = Math.hypot(b.at[0] - a.at[0], b.at[1] - a.at[1]);
        if (gap > GAP || gap < 0.5) continue;
        const across: P = [(b.at[0] - a.at[0]) / gap, (b.at[1] - a.at[1]) / gap];
        if (a.dir[0] * across[0] + a.dir[1] * across[1] < 0.7 || -(b.dir[0] * across[0] + b.dir[1] * across[1]) < 0.7) continue;
        list[i] = [...list[i], ...list[j]];
        list.splice(j, 1);
        joined = true;
        break outer;
      }
    // Also join a tail to a tail, or a head to a head, by reversing one.
    if (!joined)
      outer2: for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++)
          for (const [ri, rj] of [[false, true], [true, false]] as const) {
            const ci = ri ? [...list[i]].reverse() : list[i];
            const cj = rj ? [...list[j]].reverse() : list[j];
            const a = end(ci, false);
            const b = end(cj, true);
            const gap = Math.hypot(b.at[0] - a.at[0], b.at[1] - a.at[1]);
            if (gap > GAP || gap < 0.5) continue;
            const across: P = [(b.at[0] - a.at[0]) / gap, (b.at[1] - a.at[1]) / gap];
            if (a.dir[0] * across[0] + a.dir[1] * across[1] < 0.7 || -(b.dir[0] * across[0] + b.dir[1] * across[1]) < 0.7) continue;
            list[i] = [...ci, ...cj];
            list.splice(j, 1);
            joined = true;
            break outer2;
          }
  }
  return list;
}
