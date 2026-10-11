// Closed outlines to cubic Béziers, the way a careful hand works the pen tool: resample the outline
// evenly, keep its corners sharp, draw what runs straight as straight lines, and fit the rest with
// as few curves as hold it within a pixel tolerance (Philip J. Schneider, "An Algorithm for Automatically Fitting Digitized
// Curves", Graphics Gems, 1990).

import type { Ring } from "./contour.ts";
import { closedSimplify } from "./polygon.ts";

type P = [number, number];
export type Cubic = [P, P, P, P];

export type FitOptions = {
  tolerance?: number; // the farthest a curve may stray from the outline, in pixels
  step?: number; // resampling interval along the outline, in pixels
  corner?: number; // the turn, in degrees, that counts as a corner
  reach?: number; // samples on each side used to measure a turn
  // A ring that straight edges of at least this mean length hold within the tolerance (and never
  // closer than a pixel) is drawn as a polygon; 0 draws every ring straight. Unset, none is.
  straight?: number;
};

const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
const dot = (a: P, b: P) => a[0] * b[0] + a[1] * b[1];
const len = (a: P) => Math.hypot(a[0], a[1]);
const unit = (a: P): P => {
  const n = len(a);
  return n > 1e-12 ? [a[0] / n, a[1] / n] : a;
};

function at(c: Cubic, t: number): P {
  const s = 1 - t;
  const a = s * s * s;
  const b = 3 * s * s * t;
  const d = 3 * s * t * t;
  const e = t * t * t;
  return [a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0], a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1]];
}

function d1(c: Cubic, t: number): P {
  const s = 1 - t;
  return add(add(mul(sub(c[1], c[0]), 3 * s * s), mul(sub(c[2], c[1]), 6 * s * t)), mul(sub(c[3], c[2]), 3 * t * t));
}

function d2(c: Cubic, t: number): P {
  return add(mul(add(sub(c[2], mul(c[1], 2)), c[0]), 6 * (1 - t)), mul(add(sub(c[3], mul(c[2], 2)), c[1]), 6 * t));
}

// Parameters proportional to distance along the points.
function chord(p: P[]): number[] {
  const u = [0];
  for (let i = 1; i < p.length; i++) u.push(u[i - 1] + len(sub(p[i], p[i - 1])));
  const total = u[u.length - 1];
  return total > 0 ? u.map((v) => v / total) : u;
}

// The cubic with the given end tangents that fits the points best in least squares.
function generate(p: P[], u: number[], t1: P, t2: P): Cubic {
  const p0 = p[0];
  const p3 = p[p.length - 1];
  let c00 = 0;
  let c01 = 0;
  let c11 = 0;
  let x0 = 0;
  let x1 = 0;
  for (let i = 0; i < p.length; i++) {
    const s = 1 - u[i];
    const a1 = mul(t1, 3 * s * s * u[i]);
    const a2 = mul(t2, 3 * s * u[i] * u[i]);
    c00 += dot(a1, a1);
    c01 += dot(a1, a2);
    c11 += dot(a2, a2);
    const tmp = sub(p[i], at([p0, p0, p3, p3], u[i]));
    x0 += dot(a1, tmp);
    x1 += dot(a2, tmp);
  }
  const det = c00 * c11 - c01 * c01;
  const seg = len(sub(p3, p0));
  let al = 0;
  let ar = 0;
  if (Math.abs(det) > 1e-12) {
    al = (x0 * c11 - x1 * c01) / det;
    ar = (c00 * x1 - c01 * x0) / det;
  }
  // A degenerate solve falls back to the classic third-of-the-chord handles.
  if (al < 1e-6 * seg || ar < 1e-6 * seg || al > 2 * seg + 1 || ar > 2 * seg + 1) al = ar = seg / 3;
  return [p0, add(p0, mul(t1, al)), add(p3, mul(t2, ar)), p3];
}

// One Newton step per point toward its nearest parameter on the curve.
function reparameterize(c: Cubic, p: P[], u: number[]): number[] {
  let floor = 0;
  return u.map((t, i) => {
    const q = sub(at(c, t), p[i]);
    const q1 = d1(c, t);
    const den = dot(q1, q1) + dot(q, d2(c, t));
    const next = Math.abs(den) > 1e-12 ? Math.min(1, Math.max(0, t - dot(q, q1) / den)) : t;
    floor = Math.max(floor, next);
    return floor;
  });
}

function worst(c: Cubic, p: P[], u: number[]): [number, number] {
  let e = 0;
  let k = 0;
  for (let i = 0; i < p.length; i++) {
    const d = len(sub(at(c, u[i]), p[i]));
    if (d > e) [e, k] = [d, i];
  }
  return [e, k];
}

function fit(p: P[], t1: P, t2: P, tolerance: number, depth = 0): Cubic[] {
  if (straight(p, tolerance)) return [line(p[0], p[p.length - 1])];
  if (p.length === 2 || depth > 24) {
    const d = len(sub(p[p.length - 1], p[0])) / 3;
    return [[p[0], add(p[0], mul(t1, d)), add(p[p.length - 1], mul(t2, d)), p[p.length - 1]]];
  }
  let u = chord(p);
  let c = generate(p, u, t1, t2);
  let [e, split] = worst(c, p, u);
  if (e < tolerance) return [c];
  if (e < tolerance * 6)
    for (let i = 0; i < 12; i++) {
      u = reparameterize(c, p, u);
      c = generate(p, u, t1, t2);
      [e, split] = worst(c, p, u);
      if (e < tolerance) return [c];
    }
  split = Math.max(1, Math.min(p.length - 2, split));
  const tc = unit(sub(p[split - 1], p[split + 1]));
  return [...fit(p.slice(0, split + 1), t1, tc, tolerance, depth + 1), ...fit(p.slice(split), mul(tc, -1), t2, tolerance, depth + 1)];
}

// Even spacing along a closed ring. Rings shorter than three steps keep their own points.
function resample(ring: Ring, step: number): P[] {
  const n = ring.length / 2;
  const pts: P[] = Array.from({ length: n + 1 }, (_, i) => [ring[(i % n) * 2], ring[(i % n) * 2 + 1]]);
  let total = 0;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push((total += len(sub(pts[i], pts[i - 1]))));
  if (total < step * 3) return pts.slice(0, n);
  const count = Math.floor(total / step);
  const out: P[] = [];
  let j = 0;
  for (let k = 0; k < count; k++) {
    const s = (k / count) * total;
    while (cum[j + 1] < s) j++;
    const t = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
    out.push(add(pts[j], mul(sub(pts[j + 1], pts[j]), t)));
  }
  return out;
}

// Where a closed, evenly sampled outline turns by at least `angle` degrees, taking the sharpest
// point of each turn.
function corners(p: P[], reach: number, angle: number): number[] {
  const n = p.length;
  if (n < 2 * reach + 3) return [];
  const turn = p.map((q, i) => {
    const a = sub(q, p[(i - reach + n) % n]);
    const b = sub(p[(i + reach) % n], q);
    const cos = dot(a, b) / ((len(a) + 1e-9) * (len(b) + 1e-9));
    return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  });
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    if (turn[i] < angle) continue;
    let peak = true;
    for (let j = -reach; j <= reach && peak; j++) if (turn[(i + j + n) % n] > turn[i]) peak = false;
    if (peak && !out.some((o) => Math.abs(i - o) < reach)) out.push(i);
  }
  return out;
}

export function fitRing(ring: Ring, { tolerance = 0.6, step = 1, corner = 55, reach = 3, straight }: FitOptions = {}): Cubic[] {
  const p = resample(ring, step);
  if (p.length < 3) return [];
  if (straight !== undefined) {
    const keep = closedSimplify(p, Math.max(1, tolerance));
    if (keep.length >= 3 && (p.length * step) / keep.length >= straight) return keep.map((k, i) => line(p[k], p[keep[(i + 1) % keep.length]]));
  }
  if (p.length < 6) return p.map((q, i) => line(q, p[(i + 1) % p.length]));
  const cs = corners(p, reach, corner);
  const n = p.length;
  if (!cs.length) {
    const t = unit(sub(p[1], p[n - 1]));
    return fit([...p, p[0]], t, mul(t, -1), tolerance);
  }
  const out: Cubic[] = [];
  for (let k = 0; k < cs.length; k++) {
    const a = cs[k];
    const b = k + 1 < cs.length ? cs[k + 1] : cs[0] + n;
    const run = Array.from({ length: b - a + 1 }, (_, i) => p[(a + i) % n]);
    if (run.length === 2) out.push(line(run[0], run[1]));
    else out.push(...fit(run, tangent(run, true), tangent(run, false), tolerance));
  }
  return out;
}

const line = (a: P, b: P): Cubic => [a, a, b, b];

// Whether every point lies within `tolerance` of the chord, so the run is drawn as a straight line.
function straight(p: P[], tolerance: number): boolean {
  const a = p[0];
  const chord = sub(p[p.length - 1], a);
  const length = len(chord);
  if (length < 1e-9) return false;
  for (const q of p) if (Math.abs(chord[0] * (q[1] - a[1]) - chord[1] * (q[0] - a[0])) / length > tolerance) return false;
  return true;
}

function tangent(p: P[], start: boolean, k = 3): P {
  return start ? unit(sub(p[Math.min(k, p.length - 1)], p[0])) : unit(sub(p[Math.max(p.length - 1 - k, 0)], p[p.length - 1]));
}

// SVG path data for closed runs of cubics, at half a pixel. Every ring starts absolute; the rest
// is relative, measured from the rounded points so error never accumulates. Straight runs become
// lines. Tenths of a pixel looked the same, even on eyes traced to 0.25 px seen at twice the
// drawing's size, and cost a third more bytes gzipped.
const STEPS = 2;
export function pathData(rings: Cubic[][]): string {
  const q = (v: number) => Math.round(v * STEPS);
  const f = (v: number) => {
    const s = (v / STEPS).toString();
    return s.startsWith("0.") ? s.slice(1) : s.startsWith("-0.") ? "-" + s.slice(2) : s;
  };
  // Numbers joined with the fewest separators: a minus sign or a leading dot that follows a
  // decimal number already separates them.
  const join = (vals: number[]) => {
    let out = "";
    let prev = "";
    for (const v of vals) {
      const s = f(v);
      out += !prev || s[0] === "-" || (s[0] === "." && prev.includes(".")) ? s : " " + s;
      prev = s;
    }
    return out;
  };
  let d = "";
  for (const curves of rings) {
    if (!curves.length) continue;
    let x = q(curves[0][0][0]);
    let y = q(curves[0][0][1]);
    d += "M" + join([x, y]);
    for (const [p0, p1, p2, p3] of curves) {
      const nx = q(p3[0]);
      const ny = q(p3[1]);
      if (len(sub(p1, p0)) < 0.05 && len(sub(p2, p3)) < 0.05) d += "l" + join([nx - x, ny - y]);
      else d += "c" + join([q(p1[0]) - x, q(p1[1]) - y, q(p2[0]) - x, q(p2[1]) - y, nx - x, ny - y]);
      x = nx;
      y = ny;
    }
    d += "z";
  }
  return d;
}
