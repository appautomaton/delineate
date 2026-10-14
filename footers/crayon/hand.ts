// Crayon: wax on toothy paper, drawn as vector.
//
// A crayon mark is not one line. The tip is a few millimetres wide and lays wax only where the paper's tooth
// stands up, so a stroke is a sheaf of fine streaks running together, darker where they cross. Here a stroke
// is a few strands that follow one path, each offset across the tip and wandering a little, each with its own
// weight and pressure. Outlines are laid in short lengths of differing pressure, so the colour swells and
// thins along them; colouring in is the same strands driven back and forth inside a shape, in the shape's own
// frame, swinging round in a loop at each end the way a hand scribbles.
//
// Every strand carries pathLength="1", a delay and a duration, so the page can draw it on in the order a hand
// made it. A shape takes the same short time whatever its size, as a quick hand does. The paper's tooth is not
// part of the strands: it is TOOTH, a tile the page lays over a finished drawing as a mask.
//
// Colours are names, not values: a strand carries class="k-<name>" and the page says what each name is, so
// one drawing can be laid on white paper by day and on dark paper by night. A hex value still works where a
// drawing has only one light. The shapes drawn with the hand are in shapes.ts.

import { catmull, type Pt } from "../lib/geometry.ts";
import { f, fixed, hypot } from "../lib/number.ts";
import { Random } from "../lib/random.ts";

// The paper's tooth, as a CSS image: a 256 px tile of fine noise, opaque where the wax takes and clear where
// the paper stands up through it. A page masks a finished drawing with it, under a solid layer it fades out,
// so the grain comes up through the wax: mask: linear-gradient(rgb(0 0 0 / var(--bare)) 0 0), TOOTH 0 0 / 256px.
export const TOOTH =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E" +
  "%3Cfilter id='t' x='0' y='0' width='1' height='1' color-interpolation-filters='sRGB'%3E" +
  "%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' seed='4' stitchTiles='stitch'/%3E" +
  "%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -6.5 4.75'/%3E%3C/filter%3E" +
  "%3Crect width='256' height='256' filter='url(%23t)'/%3E%3C/svg%3E\")";

// A range to draw from, [lo, hi].
export type Range = readonly [number, number];

export type StrokeOptions = {
  // How wide the tip is, and how many strands it lays across that width.
  width?: number;
  n?: number;
  // Each strand's stroke width and opacity, drawn from these ranges.
  weight?: Range;
  alpha?: Range;
  // How far the strands wander across the tip, as a share of its width.
  wander?: number;
  // How long the hand takes over the stroke.
  secs?: number;
  // With a chunk (a range of lengths in px), each strand is laid in lengths of their own pressure.
  chunk?: Range;
  // How finely the path is resampled.
  step?: number;
};

export type FillOptions = StrokeOptions & {
  // The direction of the passes in degrees, the distance between them, and how wide the turn at each end.
  angle?: number;
  spacing?: number;
  loop?: number;
};

// Lays strokes and keeps time, so the page can replay them as a hand made them.
export class Hand {
  readonly rng: Random;
  clock: number;
  #out: string[] = [];

  constructor(seed: number, start = 0) {
    this.rng = new Random(seed);
    this.clock = start;
  }

  // `n` strands across a tip `width` wide along `pts`, drawn in `secs`.
  stroke(points: readonly Pt[], colour: string, opts: StrokeOptions = {}): void {
    const { width = 10, n = 6, weight = [1.3, 2.6], alpha = [0.5, 0.9], wander = 0.8, secs = 0.35, chunk, step = 5 } = opts;
    const rng = this.rng;
    const pts = resample(points, step);
    if (pts.length < 2) return;
    const nm = normals(pts);
    const start = this.clock;
    for (let k = 0; k < n; k++) {
      const o = (k / Math.max(1, n - 1) - 0.5) * width * rng.uniform(0.7, 1);
      const [ph, fr] = [rng.uniform(0, 6.3), rng.uniform(0.04, 0.1)];
      const edge = Math.abs(o) / (width / 2 + 1e-6);
      const lo = Math.trunc(pts.length * rng.uniform(0, 0.12) * edge);
      const hi = pts.length - Math.trunc(pts.length * rng.uniform(0, 0.12) * edge);
      const line: Pt[] = [];
      for (let i = lo; i < Math.max(lo + 2, hi); i++) {
        const [[x, y], [nx, ny]] = [pts[i], nm[i]];
        const w = o + wander * width * 0.14 * Math.sin(i * fr + ph);
        line.push([x + nx * w + rng.uniform(-0.3, 0.3), y + ny * w + rng.uniform(-0.3, 0.3)]);
      }
      const sw = rng.uniform(...weight);
      const base = rng.uniform(...alpha) * (1 - 0.35 * edge);
      const lengths: [number, number][] = [];
      if (chunk) {
        for (let i = 0; i < line.length - 1; ) {
          const j = Math.min(line.length - 1, i + Math.max(2, Math.trunc(rng.uniform(...chunk) / step)));
          lengths.push([i, j]);
          i = j;
        }
      } else lengths.push([0, line.length - 1]);
      for (const [i, j] of lengths) {
        if (chunk && rng.random() < 0.05 * edge) continue;
        const a = Math.max(0.08, Math.min(1, base * (chunk ? rng.uniform(0.6, 1.15) : 1)));
        const t0 = start + (secs * i) / line.length + rng.uniform(0, 0.04);
        const td = Math.max(0.03, (secs * (j - i)) / line.length);
        this.#out.push(
          `<path d="${pathD(line.slice(i, j + 1))}" pathLength="1" ${paint(colour)} stroke-width="${f(sw)}" ` +
            `stroke-opacity="${fixed(a, 2)}" style="--d:${fixed(t0, 2)}s;--t:${fixed(td, 2)}s"/>`,
        );
      }
    }
    this.clock = start + secs * 0.9;
  }

  // Many short marks laid as one gesture, a hedge of dabs or a spike of florets: each strand is one path of many
  // pieces, so a row of a hundred dabs costs `n` elements, not a hundred times `n`.
  dabs(marks: readonly (readonly [Pt, Pt])[], colour: string, opts: Omit<StrokeOptions, "wander" | "chunk" | "step"> = {}): void {
    const { width = 4, n = 2, weight = [1.4, 2.4], alpha = [0.45, 0.8], secs = 0.4 } = opts;
    const rng = this.rng;
    const start = this.clock;
    const jitter = () => rng.uniform(-0.4, 0.4);
    for (let k = 0; k < n; k++) {
      const o = (k / Math.max(1, n - 1) - 0.5) * width;
      const d = marks.map(([[x0, y0], [x1, y1]]) => {
        const [dx, dy] = [x1 - x0, y1 - y0];
        const ln = hypot(dx, dy) || 1;
        const [nx, ny] = [(-dy / ln) * o, (dx / ln) * o];
        return `M${f(x0 + nx + jitter())} ${f(y0 + ny + jitter())}l${f(dx + jitter())} ${f(dy + jitter())}`;
      });
      this.#out.push(
        `<path d="${d.join("")}" pathLength="1" ${paint(colour)} stroke-width="${f(rng.uniform(...weight))}" ` +
          `stroke-opacity="${fixed(rng.uniform(...alpha), 2)}" style="--d:${fixed(start, 2)}s;--t:${fixed(secs, 2)}s"/>`,
      );
    }
    this.clock = start + secs * 0.9;
  }

  // An outline or a stem through control points, smoothed, in lengths of differing pressure.
  line(points: readonly Pt[], colour: string, opts: StrokeOptions & { samples?: number; closed?: boolean } = {}): void {
    const { samples = 8, closed = false, chunk = [40, 110], ...rest } = opts;
    this.stroke(catmull(points, samples, closed), colour, { ...rest, chunk });
  }

  // Colours a shape in: the tip driven back and forth across it at `angle` degrees, in the shape's own frame so
  // no stroke is wasted outside it, swinging round at each end and running a little past the edge. The caller
  // clips it to the shape.
  fill(outline: readonly Pt[], colour: string, opts: FillOptions = {}): void {
    const { angle = 0, spacing = 10, loop = 1, width = 12, n = 6, secs = 0.5, weight = [1.8, 3.4], ...rest } = opts;
    // The distance to the next pass is drawn into `step`, so the stroke is resampled at the last pass's distance.
    let { step = 6 } = opts;
    const rng = this.rng;
    const a = (angle + rng.uniform(-6, 6)) * (Math.PI / 180);
    const [ux, uy] = [Math.cos(a), Math.sin(a)];
    const [vx, vy] = [-uy, ux];
    const us = outline.map(([x, y]) => x * ux + y * uy);
    const vs = outline.map(([x, y]) => x * vx + y * vy);
    const [u0, u1, v1] = [Math.min(...us), Math.max(...us), Math.max(...vs)];
    const pts: Pt[] = [];
    let v = Math.min(...vs) - spacing * 0.3;
    let side = 1;
    while (v < v1 + spacing * 0.3) {
      // How far the shape reaches at this v: where its edges cross the line.
      const hits: number[] = [];
      outline.forEach(([xa, ya], i) => {
        const [xb, yb] = outline[(i + 1) % outline.length];
        const [va, vb] = [xa * vx + ya * vy, xb * vx + yb * vy];
        if ((va - v) * (vb - v) <= 0 && va !== vb) {
          const t = (v - va) / (vb - va);
          hits.push((xa + (xb - xa) * t) * ux + (ya + (yb - ya) * t) * uy);
        }
      });
      const [lo, hi] = hits.length ? [Math.min(...hits), Math.max(...hits)] : [(u0 + u1) / 2, (u0 + u1) / 2];
      const over = spacing * 0.6;
      const ends = side > 0 ? [lo - over, hi + over] : [hi + over, lo - over];
      for (const u of ends) pts.push([u * ux + v * vx, u * uy + v * vy]);
      step = spacing * rng.uniform(0.75, 1.2);
      // The turn: out past the end and round to the next pass.
      const u = ends[1] + side * spacing * 0.45 * loop;
      pts.push([u * ux + (v + step * 0.5) * vx, u * uy + (v + step * 0.5) * vy]);
      v += step;
      side = -side;
    }
    this.stroke(catmull(pts, 3), colour, { ...rest, width, n, wander: 0.5, secs, step, weight });
  }

  // A centre wound in from the edge.
  spiral(cx: number, cy: number, r: number, colour: string, opts: StrokeOptions & { turns?: number; squash?: number } = {}): void {
    const { turns = 5, squash = 1, secs = 0.4, ...rest } = opts;
    const rng = this.rng;
    const steps = Math.trunc(turns * 36);
    const start = rng.uniform(0, 6.3);
    const pts: Pt[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const rr = r * (1 - 0.85 * t) * (1 + rng.uniform(-0.04, 0.04));
      const ang = start + t * turns * 2 * Math.PI;
      pts.push([cx + rr * Math.cos(ang), cy + rr * squash * Math.sin(ang)]);
    }
    this.stroke(pts, colour, { ...rest, wander: 0.4, secs });
  }

  // A loop scribble: the tip wound round a centre that wanders as the hand moves, each turn its own size and
  // tilt, never on the same track twice.
  loops(
    cx: number,
    cy: number,
    r: number,
    colour: string,
    opts: StrokeOptions & { turns?: number; wobble?: number; squash?: number; drift?: Pt } = {},
  ): void {
    const { turns = 6, wobble = 0.1, squash = 1, drift = [0, 0], secs = 0.6, ...rest } = opts;
    const rng = this.rng;
    const count = Math.trunc(turns) + 2;
    const radii = Array.from({ length: count }, () => r * rng.uniform(0.86, 1.1));
    const tilts = Array.from({ length: count }, () => rng.uniform(-0.25, 0.25));
    const squashes = Array.from({ length: count }, () => squash * rng.uniform(0.88, 1.08));
    const offsets = Array.from({ length: count }, (): Pt => [rng.uniform(-0.09, 0.09) * r, rng.uniform(-0.09, 0.09) * r]);
    const per = 36;
    const start = rng.uniform(0, 6.3);
    const pts: Pt[] = [];
    for (let i = 0; i <= Math.trunc(turns * per); i++) {
      const t = i / per;
      const k = Math.trunc(t);
      const e = 0.5 - 0.5 * Math.cos(Math.PI * (t - k));
      const lerp = (a: number, b: number) => a + (b - a) * e;
      const rr = lerp(radii[k], radii[k + 1]) * (1 + wobble * Math.sin(t * 5.1 + start));
      const [tilt, sq] = [lerp(tilts[k], tilts[k + 1]), lerp(squashes[k], squashes[k + 1])];
      const [ox, oy] = [lerp(offsets[k][0], offsets[k + 1][0]), lerp(offsets[k][1], offsets[k + 1][1])];
      const ang = start + t * 2 * Math.PI;
      const [ex, ey] = [rr * Math.cos(ang), rr * sq * Math.sin(ang)];
      const g = t / Math.max(1, turns);
      pts.push([
        cx + ex * Math.cos(tilt) - ey * Math.sin(tilt) + ox + drift[0] * g,
        cy + ex * Math.sin(tilt) + ey * Math.cos(tilt) + oy + drift[1] * g,
      ]);
    }
    this.stroke(pts, colour, { ...rest, wander: 0.5, secs });
  }

  // The strokes laid since the last take, one per line, and a clean sheet for the next.
  take(): string {
    const out = this.#out.join("\n");
    this.#out = [];
    return out;
  }
}

// A colour name is a class the page defines for day and night; a hex value paints the stroke directly.
const paint = (colour: string) => (colour.startsWith("#") ? `stroke="${colour}"` : `class="k-${colour}"`);

// Points every `step` px along a polyline, keeping its ends.
function resample(pts: readonly Pt[], step: number): Pt[] {
  const out: Pt[] = [pts[0]];
  let carry = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [[x0, y0], [x1, y1]] = [pts[i], pts[i + 1]];
    const seg = hypot(x1 - x0, y1 - y0);
    if (seg === 0) continue;
    let d = step - carry;
    for (; d <= seg; d += step) out.push([x0 + (x1 - x0) * (d / seg), y0 + (y1 - y0) * (d / seg)]);
    carry = seg - (d - step);
  }
  const [last, end] = [out.at(-1)!, pts.at(-1)!];
  if (last[0] !== end[0] || last[1] !== end[1]) out.push(end);
  return out;
}

// The unit normal at each point, from its neighbours.
function normals(pts: readonly Pt[]): Pt[] {
  return pts.map((_, i) => {
    const [a, b] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const d = hypot(dx, dy) || 1;
    return [-dy / d, dx / d];
  });
}

// A polyline as a path in relative steps.
function pathD(pts: readonly Pt[]): string {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) d += `l${f(pts[i][0] - pts[i - 1][0])} ${f(pts[i][1] - pts[i - 1][1])}`;
  return d;
}
