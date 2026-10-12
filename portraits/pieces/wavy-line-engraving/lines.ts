// The jacket's big lines, drawn by hand: each a stroke through a few points read off the plate,
// one width along its body, tapering to a point at both ends.

type P = [number, number];
export type Stroke = { points: P[]; widths: number[] };

const TAPER = 7; // pixels over which a stroke narrows to its point

// A stroke through a few points, as a hand draws it: a Catmull-Rom curve through them.
export function drawn(through: P[], width: number): Stroke {
  const pts = [through[0], ...through, through[through.length - 1]];
  const points: P[] = [];
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    const steps = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const [t2, t3] = [t * t, t * t * t];
      const at = (k: 0 | 1) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3);
      points.push([at(0), at(1)]);
    }
  }
  points.push(through[through.length - 1]);
  return { points, widths: points.map(() => width) };
}

// One path for every stroke: each an outline, its two sides offset from its middle by half its
// width, closed round its tapered ends.
export function strokeData(list: Stroke[]): string {
  const f = (v: number) => {
    const s = (Math.round(v * 10) / 10).toString();
    return s.startsWith("0.") ? s.slice(1) : s.startsWith("-0.") ? "-" + s.slice(2) : s;
  };
  let d = "";
  for (const { points, widths } of list) {
    const n = points.length;
    let run = 0;
    const along = points.map((p, i) => (run += i ? Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) : 0));
    const total = along[n - 1];
    const left: P[] = [];
    const right: P[] = [];
    for (let i = 0; i < n; i++) {
      const [ax, ay] = points[Math.max(0, i - 1)];
      const [bx, by] = points[Math.min(n - 1, i + 1)];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const [nx, ny] = [-(by - ay) / len, (bx - ax) / len];
      const end = Math.min(along[i], total - along[i]);
      const half = (widths[i] / 2) * Math.sqrt(Math.min(1, end / Math.min(TAPER, total / 2.5)));
      left.push([points[i][0] + nx * half, points[i][1] + ny * half]);
      right.push([points[i][0] - nx * half, points[i][1] - ny * half]);
    }
    const ring = [...left, ...right.reverse()];
    d += `M${f(ring[0][0])} ${f(ring[0][1])}` + ring.slice(1).map(([x, y]) => `L${f(x)} ${f(y)}`).join("") + "Z";
  }
  return d;
}
