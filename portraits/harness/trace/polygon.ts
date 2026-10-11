// Straight-edged shapes: simplifying an outline to its corners, and measuring and drawing polygons.

export type Point = [number, number];
export type Box = [number, number, number, number]; // x0, y0, x1, y1
export type Polygon = Point[];

export function pathOf(poly: Polygon): string {
  const f = (v: number) => (Math.round(v * 10) / 10).toString();
  return "M" + poly.map(([x, y]) => `${f(x)} ${f(y)}`).join("L") + "Z";
}

// Signed distance to the polygon's outline, positive inside.
export function distance(poly: Polygon, x: number, y: number): number {
  let best = Infinity;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j];
    const [bx, by] = poly[i];
    if (by > y !== ay > y && x < ((ax - bx) * (y - by)) / (ay - by) + bx) inside = !inside;
    const ex = bx - ax;
    const ey = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey)));
    best = Math.min(best, Math.hypot(x - ax - t * ex, y - ay - t * ey));
  }
  return inside ? best : -best;
}

// Douglas-Peucker on a closed ring, anchored at its two farthest-apart points. Returns indices.
export function closedSimplify(pts: Point[], epsilon: number): number[] {
  const n = pts.length;
  let a = 0;
  let b = 0;
  let far = -1;
  for (let i = 0; i < n; i += Math.max(1, n >> 6))
    for (let j = 0; j < n; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (d > far) [far, a, b] = [d, i, j];
    }
  if (a > b) [a, b] = [b, a];
  const keep = new Set([a, b]);
  const walk = (i: number, j: number) => {
    // Indices from i to j going forward around the ring.
    const span = (j - i + n) % n;
    if (span < 2) return;
    const [ax, ay] = pts[i];
    const [bx, by] = pts[j];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let worst = -1;
    let at = -1;
    for (let s = 1; s < span; s++) {
      const k = (i + s) % n;
      const d = Math.abs((bx - ax) * (pts[k][1] - ay) - (by - ay) * (pts[k][0] - ax)) / len;
      if (d > worst) [worst, at] = [d, k];
    }
    if (worst > epsilon) {
      keep.add(at);
      walk(i, at);
      walk(at, j);
    }
  };
  walk(a, b);
  walk(b, a);
  return [...keep].sort((x, y) => x - y);
}
