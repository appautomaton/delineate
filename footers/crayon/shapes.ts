// The shapes crayon drawings are made of, each coloured in and outlined the way an illustrator works with wax.
// Each takes the hand that draws it and the sheet it is drawn on.

import { catmull, type Pt } from "../lib/geometry.ts";
import { f } from "../lib/number.ts";
import type { Random } from "../lib/random.ts";
import type { Hand, Range } from "./hand.ts";

const degrees = (radians: number) => radians * (180 / Math.PI);

// A drawing's clip paths, under an id prefix of its own, since ids are shared by the whole page.
export class Sheet {
  readonly prefix: string;
  readonly clips: string[] = [];

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  // Registers a clip path and returns the url() that refers to it.
  clip(d: string): string {
    const id = `${this.prefix}${this.clips.length}`;
    this.clips.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    return `url(#${id})`;
  }

  defs(): string {
    return this.clips.join("");
  }
}

// A closed shape smoothed through its points, as an absolute path.
export const closedD = (pts: readonly Pt[]) => `M${catmull(pts, 5, true).map(([x, y]) => `${f(x)} ${f(y)}`).join(" ")}Z`;

export const circle = (cx: number, cy: number, r: number, n = 10): Pt[] =>
  Array.from({ length: n }, (_, k) => [cx + r * Math.cos((k * 2 * Math.PI) / n), cy + r * Math.sin((k * 2 * Math.PI) / n)]);

type Coloured = {
  // A darker pass over a circle [x, y, r], in this colour.
  shade?: string;
  shadeAt?: readonly [number, number, number];
  // The outline, in another crayon, unless none.
  edge?: string;
  edgeWidth?: number;
  edgeWeight?: Range;
  edgeAlpha?: Range;
  // The direction of the colouring in, in degrees.
  angle?: number;
  // When the next shape starts, in seconds after this one began, while this one is still being drawn.
  stagger?: number;
  // Strokes to lay over the colour, under the outline.
  extra?: string;
};

// A shape coloured in and outlined: a fill pass, a darker pass toward `shadeAt`, then the outline.
export function coloured(sheet: Sheet, h: Hand, outline: readonly Pt[], fill: string, opts: Coloured = {}): string {
  const { shade, shadeAt, edge = "graphite", edgeWidth = 4, edgeWeight = [1.4, 2.6], edgeAlpha = [0.65, 0.95], angle = -35, stagger = 0.22, extra = "" } = opts;
  const t0 = h.clock;
  h.fill(outline, fill, { angle, secs: 0.3 });
  let parts = h.take();
  if (shade) {
    h.fill(circle(...shadeAt!), shade, { angle: angle + 70, spacing: 12, secs: 0.2, alpha: [0.35, 0.7] });
    parts += "\n" + h.take();
  }
  parts += extra;
  if (edge) h.line(outline, edge, { closed: true, width: edgeWidth, n: 3, weight: edgeWeight, alpha: edgeAlpha, secs: 0.25 });
  h.clock = t0 + stagger;
  return `<g clip-path="${sheet.clip(closedD(outline))}">${parts}</g>\n${h.take()}`;
}

// A broad petal from the centre out, its tip rounded and a little waved.
export function petal(rng: Random, cx: number, cy: number, ang: number, length: number, width: number, inner = 0.18): Pt[] {
  const [ux, uy] = [Math.cos(ang), Math.sin(ang)];
  const [vx, vy] = [-uy, ux];
  const at = (t: number, s: number): Pt => [cx + ux * length * t + vx * width * s, cy + uy * length * t + vy * width * s];
  return [at(inner, -0.12), at(0.45, -0.42), at(0.82, -0.5), at(1, -0.22), at(0.97, 0.02 + rng.uniform(-0.06, 0.06)),
    at(1, 0.24), at(0.82, 0.5), at(0.45, 0.42), at(inner, 0.12)];
}

// An open flower seen from the front, a little tipped back by `tilt`: broad petals, a wound centre, stamens
// flicked out round it.
export function poppy(
  sheet: Sheet,
  h: Hand,
  cx: number,
  cy: number,
  R: number,
  fill: string,
  shade: string,
  edge: string,
  { centre = "graphite", n = 6, tilt = 0 } = {},
): string {
  const rng = h.rng;
  const out: string[] = [];
  const squash = 1 - tilt;
  const start = rng.uniform(0, 6.3);
  const order = [...Array(n).keys()];
  rng.shuffle(order);
  for (const k of order) {
    const a = start + (k * 2 * Math.PI) / n + rng.uniform(-0.12, 0.12);
    const length = R * rng.uniform(0.9, 1.06);
    const pts = petal(rng, cx, cy, a, length, R * 0.62).map(([x, y]): Pt => [x, cy + (y - cy) * squash]);
    const t0 = h.clock;
    for (let k2 = 0; k2 < 3; k2++) {
      const va = a + (k2 - 1) * 0.32 + rng.uniform(-0.06, 0.06);
      const [r0, r1] = [R * 0.26, length * rng.uniform(0.62, 0.8)];
      const along = (r: number, da: number): Pt => [cx + r * Math.cos(va + da), cy + r * squash * Math.sin(va + da)];
      h.stroke(catmull([along(r0, 0), along((r0 + r1) / 2, 0.05), along(r1, 0.02)], 6), shade, { width: 2.5, n: 2, weight: [0.9, 1.5], alpha: [0.35, 0.6], secs: 0.15 });
    }
    const veins = h.take();
    h.clock = t0;
    out.push(coloured(sheet, h, pts, fill, {
      shade, edge, angle: degrees(a) + 90, shadeAt: [cx, cy, R * 0.5], edgeWidth: 3, edgeWeight: [1, 1.9], edgeAlpha: [0.5, 0.85], extra: "\n" + veins,
    }));
  }
  const spiral = Array.from({ length: 160 }, (_, i): Pt => {
    const t = i / 160;
    const r = R * 0.2 * (1 - t * 0.85);
    const a = t * 6 * 2 * Math.PI;
    return [cx + r * Math.cos(a), cy + r * squash * Math.sin(a)];
  });
  h.stroke(spiral, centre, { width: 10, n: 6, weight: [1.4, 2.6], alpha: [0.6, 0.95], secs: 0.35 });
  for (let k = 0; k < 22; k++) {
    const a = (k * 2 * Math.PI) / 22 + rng.uniform(-0.1, 0.1);
    const [r0, r1] = [R * 0.2, R * rng.uniform(0.3, 0.38)];
    const at = (r: number): Pt => [cx + r * Math.cos(a), cy + r * squash * Math.sin(a)];
    h.stroke([at(r0), at(r1)], centre, { width: 2.5, n: 2, weight: [1.2, 2], alpha: [0.6, 0.9], secs: 0.05 });
  }
  out.push(h.take());
  return out.join("\n");
}

// A tulip from the side: two outer petals and the one in front, darker toward the cup's foot.
export function tulip(sheet: Sheet, h: Hand, cx: number, cy: number, r: number, fill: string, shade: string, edge: string): string {
  return [-1, 1, 0]
    .map((side) => {
      const pts: Pt[] = side
        ? [[cx, cy + r * 1.05], [cx + side * r * 0.2, cy + r * 0.2], [cx + side * r * 0.55, cy - r * 0.55],
          [cx + side * r * 0.95, cy - r * 0.95], [cx + side * r * 1, cy - r * 0.2], [cx + side * r * 0.85, cy + r * 0.6]]
        : [[cx - r * 0.45, cy + r * 0.9], [cx - r * 0.55, cy], [cx - r * 0.3, cy - r * 0.85], [cx, cy - r * 1.15],
          [cx + r * 0.3, cy - r * 0.85], [cx + r * 0.55, cy], [cx + r * 0.45, cy + r * 0.9], [cx, cy + r * 1.05]];
      return coloured(sheet, h, pts, fill, { shade, edge, angle: -80 + side * 25, shadeAt: [cx, cy + r * 0.8, r * 0.7] });
    })
    .join("\n");
}

// A closed bud in its two sepals, leaning by `ang`.
export function bud(sheet: Sheet, h: Hand, cx: number, cy: number, r: number, fill: string, edge: string, ang = 0): string {
  const [ux, uy] = [Math.sin(ang), -Math.cos(ang)];
  const [vx, vy] = [-uy, ux];
  const at = (t: number, s: number): Pt => [cx + ux * r * t + vx * r * s, cy + uy * r * t + vy * r * s];
  const pts = [at(-0.9, 0), at(-0.5, 0.55), at(0.3, 0.5), at(1, 0), at(0.3, -0.5), at(-0.5, -0.55)];
  const out = coloured(sheet, h, pts, fill, { edge, angle: degrees(ang) - 60 });
  for (const s of [-1, 1]) h.line([at(-0.95, 0), at(-0.6, s * 0.5), at(-0.1, s * 0.62)], "green", { width: 6, n: 4, secs: 0.15 });
  return out + "\n" + h.take();
}

type Leaf = {
  // The blade's colour, and the colour of its rib, veins and outline.
  fill?: string;
  second?: string;
  // How far the midrib curves, as a share of the leaf's length; drawn at random unless given.
  bend?: number;
  veins?: boolean;
};

// A leaf from `base`, where it grows from a stem or the ground, at `ang`: a short stalk, then the blade, whose
// midrib curves by `bend`; it is widest a third of the way up and narrows to a turned tip. Each half is coloured
// along its veins, so the halves meet at the rib in a herringbone; the rib and the veins are drawn in `second`,
// and so is a fine outline.
export function leaf(sheet: Sheet, h: Hand, base: Pt, ang: number, length: number, width: number, opts: Leaf = {}): string {
  const { fill = "green", second = "pine", veins = true } = opts;
  const rng = h.rng;
  const bend = opts.bend ?? rng.uniform(-0.16, 0.16);
  const [ux, uy] = [Math.cos(ang), Math.sin(ang)];
  const [vx, vy] = [-uy, ux];
  const stalk = length * 0.08;
  const [bx, by] = [base[0] + ux * stalk, base[1] + uy * stalk];
  const rib = (t: number): Pt => {
    const off = bend * length * 4 * t * (1 - t);
    return [bx + ux * length * t + vx * off, by + uy * length * t + vy * off];
  };
  const edge = (t: number, side: number): Pt => {
    const [x, y] = rib(t);
    const w = width * 0.5 * Math.sin(Math.PI * Math.min(1, t) ** 0.72) ** 0.9 * (1 + 0.12 * side * bend);
    return [x + vx * w * side, y + vy * w * side];
  };
  const ts = Array.from({ length: 13 }, (_, i) => i / 12);
  const left = ts.map((t) => edge(t, 1));
  const right = ts.map((t) => edge(t, -1));
  const midrib = ts.map(rib);
  const outline = [...left, ...right.toReversed().slice(1, -1)];
  const t0 = h.clock;
  const out: string[] = [];
  for (const [side, half] of [[1, left], [-1, right]] as const) {
    const shape = [...midrib, ...half.toReversed()];
    h.fill(shape, fill, { angle: degrees(ang) + side * 52, spacing: 7.5, width: 9, secs: 0.25 });
    const body = h.take();
    const band = [...ts.map(rib), ...ts.toReversed().map((t) => edge(t, side * 0.42))];
    h.fill(band, second, { angle: degrees(ang) + side * 40, spacing: 10, width: 7, secs: 0.15, alpha: [0.25, 0.5] });
    out.push(`<g clip-path="${sheet.clip(closedD(shape))}">${body}\n${h.take()}</g>`);
  }
  h.clock = t0 + 0.1;
  h.stroke(catmull(midrib, 4), second, { width: 2.5, n: 2, weight: [1, 1.8], alpha: [0.55, 0.85], secs: 0.2 });
  if (veins) {
    for (const t of [0.22, 0.38, 0.54, 0.7]) {
      for (const side of [1, -1]) {
        const [p0, p1] = [rib(t), edge(Math.min(1, t + 0.14), side * 0.85)];
        h.stroke([p0, [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], p1], second, { width: 1.6, n: 1, weight: [0.8, 1.2], alpha: [0.3, 0.5], secs: 0.06 });
      }
    }
  }
  h.line(outline, second, { closed: true, width: 2.5, n: 2, weight: [1, 1.6], alpha: [0.45, 0.75], secs: 0.25 });
  h.stroke([base, rib(0)], second, { width: 3, n: 2, weight: [1.4, 2.2], secs: 0.08 });
  out.push(h.take());
  h.clock = t0 + 0.22;
  return out.join("\n");
}

export function stem(h: Hand, pts: readonly Pt[], colour = "green", width = 8): string {
  h.line(pts, colour, { width, n: 5, weight: [1.3, 2.4], secs: 0.35 });
  return h.take();
}
