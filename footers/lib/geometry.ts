// Geometry shared by every world's generator: smooth curves through points, compact paths, strokes whose
// width varies along their length, and the inside tests that fill shapes with strokes.

import { f, hypot, round } from "./number.ts";
import type { Random } from "./random.ts";

// A point as [x, y].
export type Pt = readonly [number, number];
// A circle as [x, y, r].
export type Circle = readonly [number, number, number];

export function ellipse(x: number, y: number, rx: number, ry: number): string {
  return `M${f(x - rx)} ${f(y)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0z`;
}

// The point at t along a cubic Bezier.
export function bezier([[x0, y0], [x1, y1], [x2, y2], [x3, y3]]: readonly Pt[], t: number): Pt {
  const u = 1 - t;
  return [
    u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3,
    u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3,
  ];
}

// A dense polyline through the points, along a Catmull-Rom spline, `samples` points to each span.
export function catmull(points: readonly Pt[], samples = 8, closed = false): Pt[] {
  const pts = closed ? [points.at(-1)!, ...points, points[0], points[1]] : [points[0], ...points, points.at(-1)!];
  const out: Pt[] = [];
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    for (let k = 0; k < samples; k++) {
      const t = k / samples;
      const t2 = t * t;
      const t3 = t * t * t;
      const at = (j: 0 | 1) =>
        0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push([at(0), at(1)]);
    }
  }
  if (!closed) out.push(pts.at(-2)!);
  return out;
}

// A polygon in relative coordinates, which keeps long hand-drawn strokes compact.
export function poly(points: readonly Pt[], closed = true): string {
  if (!points.length) return "";
  const [x0, y0] = [round(points[0][0], 1), round(points[0][1], 1)];
  let [px, py] = [x0, y0];
  const parts: string[] = [];
  for (const point of points.slice(1)) {
    const [x, y] = [round(point[0], 1), round(point[1], 1)];
    const dx = round(x - px, 1);
    const dy = round(y - py, 1);
    if (dx === 0 && dy === 0) continue;
    parts.push(`${f(dx)} ${f(dy)}`);
    [px, py] = [x, y];
  }
  return `M${f(x0)} ${f(y0)}l${joined(parts)}${closed ? "z" : ""}`;
}

// A cubic Bezier path through the points (Catmull-Rom converted to Bezier), in relative coordinates.
export function smooth(points: readonly Pt[], closed = false): string {
  const pts = points.map(([x, y]): Pt => [round(x, 1), round(y, 1)]);
  const n = pts.length;
  if (n < 2) return "";
  const get = (i: number) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const parts: string[] = [];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    parts.push([c1[0] - p1[0], c1[1] - p1[1], c2[0] - p1[0], c2[1] - p1[1], p2[0] - p1[0], p2[1] - p1[1]].map(f).join(" "));
  }
  return `M${f(pts[0][0])} ${f(pts[0][1])}c${joined(parts)}${closed ? "z" : ""}`;
}

// Numbers joined by spaces, where a minus sign stands in for the space before it.
const joined = (parts: string[]) => parts.join(" ").replaceAll(" -", "-");

// Points spaced evenly along a polyline.
export function resample(line: readonly Pt[], step: number): Pt[] {
  const out: Pt[] = [line[0]];
  let acc = 0;
  for (let i = 0; i + 1 < line.length; i++) {
    let [ax, ay] = line[i];
    const [bx, by] = line[i + 1];
    let seg = hypot(bx - ax, by - ay);
    while (acc + seg >= step && seg > 0) {
      const t = (step - acc) / seg;
      [ax, ay] = [ax + (bx - ax) * t, ay + (by - ay) * t];
      out.push([ax, ay]);
      seg = hypot(bx - ax, by - ay);
      acc = 0;
    }
    acc += seg;
  }
  const last = line.at(-1)!;
  if (hypot(out.at(-1)![0] - last[0], out.at(-1)![1] - last[1]) > step * 0.3) out.push(last);
  return out;
}

// A filled stroke along a polyline; width(u) gives its full width at the fraction u of its length.
export function ribbon(line: readonly Pt[], width: (u: number) => number): string {
  const n = line.length;
  if (n < 2) return "";
  const left: Pt[] = [];
  const right: Pt[] = [];
  line.forEach(([x, y], i) => {
    const [ax, ay] = line[Math.max(0, i - 1)];
    const [bx, by] = line[Math.min(n - 1, i + 1)];
    const [tx, ty] = [bx - ax, by - ay];
    const ln = hypot(tx, ty) || 1;
    const [nx, ny] = [-ty / ln, tx / ln];
    const w = Math.max(0, width(i / (n - 1))) / 2;
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  });
  return poly([...left, ...right.reverse()]);
}

// A brush's pressure along its stroke: pressed in, a little uneven along the way, lifted out. `swell` fixes
// how long it takes to press in and to lift out, as fractions of the stroke.
export function pressure(rng: Random, lo = 0.35, hi = 1, swell?: readonly [number, number]): (u: number) => number {
  const [a, b, c] = [rng.uniform(0, 6.3), rng.uniform(0, 6.3), rng.uniform(2.5, 5.5)];
  const start = swell ? swell[0] : rng.uniform(0.04, 0.14);
  const end = swell ? swell[1] : rng.uniform(0.12, 0.3);
  return (u) => {
    const body = lo + (hi - lo) * (0.62 + 0.26 * Math.sin(u * c + a) + 0.12 * Math.sin(u * 11 + b));
    const taper = Math.min(1, u / start) ** 0.6 * Math.min(1, (1 - u) / end) ** 0.8;
    return body * taper;
  };
}

// Where the line at height v crosses a set of polygons, points given as [u, v], sorted, to be read even-odd.
export function spans(polys: readonly (readonly Pt[])[], v: number): number[] {
  const out: number[] = [];
  for (const p of polys) {
    p.forEach(([u1, v1], k) => {
      const [u2, v2] = p[(k + 1) % p.length];
      if (v1 <= v !== v2 <= v) out.push(u1 + ((v - v1) * (u2 - u1)) / (v2 - v1));
    });
  }
  return out.sort((a, b) => a - b);
}

// The outline of overlapping circles, seen from a point inside them all: the farthest hit on every ray.
export function unionOutline(circles: readonly Circle[], cx: number, cy: number, n = 96): Pt[] {
  return Array.from({ length: n }, (_, k): Pt => {
    const a = (k * 2 * Math.PI) / n;
    const [dx, dy] = [Math.cos(a), Math.sin(a)];
    let best = 0;
    for (const [x, y, r] of circles) {
      const [ox, oy] = [cx - x, cy - y];
      const b = ox * dx + oy * dy;
      const disc = b * b - (ox * ox + oy * oy - r * r);
      if (disc >= 0) best = Math.max(best, -b + Math.sqrt(disc));
    }
    return [cx + dx * best, cy + dy * best];
  });
}
