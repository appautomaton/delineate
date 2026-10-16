// The pen: every mark in a monoline drawing comes from here.
//
//   line   a stroke of the one pen, round at its ends and corners
//   run    a line broken into pieces, gaps and single dots: the drawing's signature
//   dot    a filled circle, the pen set down and lifted
//   block  a filled shape with its corners rounded by the pen's own radius
//   leaf   two blocks along a spine, the light half and the dark: the only shading
//   oval   for the one flower a card may draw round; shape, any filled path
//   path   points on the pen's three angles
//
// A mark is SVG text. Colours are token names the caller passes ("--protea"), which the page's
// stylesheet gives a value by day and by night; a literal colour also works while a study is tuned.
// The pen never chooses one.

export type Pt = readonly [number, number];

/** The one pen. A drawing scales it with its card; nothing else draws a stem at another width. */
export const PEN = 10;

const n = (v: number) => +v.toFixed(2);
const pts = (ps: readonly Pt[]) => ps.map(([x, y]) => `${n(x)},${n(y)}`).join(" ");
const value = (c: string) => (c.startsWith("--") ? `var(${c})` : c);
// Presentation attributes cannot read a custom property, so paint goes in a style.
const paint = (fill: string, stroke?: string, alpha?: number) =>
  ` style="fill:${fill === "none" ? "none" : value(fill)}${stroke ? `;stroke:${value(stroke)}` : ""}${alpha === undefined || alpha === 1 ? "" : `;opacity:${n(alpha)}`}"`;

export function line(ps: readonly Pt[], color: string, width = PEN, alpha?: number): string {
  return `<polyline points="${pts(ps)}"${paint("none", color, alpha)} stroke-width="${n(width)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export function dot([x, y]: Pt, r: number, color: string, alpha?: number): string {
  return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"${paint(color, undefined, alpha)}/>`;
}

/** A filled shape whose corners the pen rounds: the outline is stroked in its own colour. */
export function block(ps: readonly Pt[], color: string, round = PEN * 0.6, alpha?: number): string {
  return `<polygon points="${pts(ps)}"${paint(color, color, alpha)} stroke-width="${n(round)}" stroke-linejoin="round"/>`;
}

/** An ellipse, for the one flower a card may draw round. */
export function oval([x, y]: Pt, rx: number, ry: number, color: string, alpha?: number): string {
  return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}"${paint(color, undefined, alpha)}/>`;
}

/** Any path, filled. */
export function shape(d: string, color: string, alpha?: number): string {
  return `<path d="${d}"${paint(color, undefined, alpha)}/>`;
}

/**
 * A broken line. The spec reads like Morse along the path: "-" draws, " " leaves a gap, "." sets
 * one dot, each followed by its length in pen widths ("-6 .1 -3" is a piece six pens long, a gap,
 * a dot, a short piece). The path may bend; pieces carry round the corners.
 */
export function run(ps: readonly Pt[], spec: string, color: string, width = PEN, alpha?: number): string[] {
  const marks: string[] = [];
  const at = walker(ps);
  let t = 0;
  for (const token of spec.trim().split(/\s+/)) {
    const kind = token[0];
    const len = Number(token.slice(1) || 1) * width;
    if (kind === "-") marks.push(line(at.between(t, t + len), color, width, alpha));
    if (kind === ".") marks.push(dot(at.point(t + len / 2), width / 2, color, alpha));
    t += len + (kind === " " ? 0 : width * 0.9);
  }
  return marks;
}

/** Points along a polyline by distance from its start. */
export function walker(ps: readonly Pt[]) {
  const seg = ps.slice(1).map((p, i) => Math.hypot(p[0] - ps[i][0], p[1] - ps[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  function point(t: number): Pt {
    let d = Math.max(0, Math.min(total, t));
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i] || i === seg.length - 1) {
        const k = seg[i] ? d / seg[i] : 0;
        return [ps[i][0] + (ps[i + 1][0] - ps[i][0]) * k, ps[i][1] + (ps[i + 1][1] - ps[i][1]) * k];
      }
      d -= seg[i];
    }
    return ps[ps.length - 1];
  }
  // The stretch from a to b, with every corner it passes kept, so a piece bends as the path does.
  function between(a: number, b: number): Pt[] {
    const out: Pt[] = [point(a)];
    let acc = 0;
    for (let i = 0; i < seg.length; i++) {
      acc += seg[i];
      if (acc > a && acc < b) out.push(ps[i + 1]);
    }
    out.push(point(b));
    return out;
  }
  return { point, between, total };
}

/**
 * A leaf cut along its spine into a light half and a dark half: the series' only shading. The light
 * falls from the upper left, so the half nearer it is light whichever way the leaf points. `belly`
 * is where along the spine the leaf is widest, from 0 at the tip to 1 at the base.
 */
export function leaf(tip: Pt, base: Pt, width: number, light: string, dark: string, belly = 0.45): string[] {
  const [ax, ay] = tip, [bx, by] = base;
  const len = Math.hypot(bx - ax, by - ay);
  const mx = ax + (bx - ax) * belly, my = ay + (by - ay) * belly;
  const nx = -(by - ay) / len, ny = (bx - ax) / len;
  const a: Pt = [mx + (nx * width) / 2, my + (ny * width) / 2];
  const b: Pt = [mx - (nx * width) / 2, my - (ny * width) / 2];
  // nearer the light is smaller x + y
  const [lit, shade] = a[0] + a[1] < b[0] + b[1] ? [a, b] : [b, a];
  return [block([tip, lit, base], light), block([tip, shade, base], dark)];
}

/** Points on a 45-degree path: from a start, each step is a direction and a length. */
export type Step = readonly ["n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw", number];
const DIR: Record<Step[0], Pt> = {
  n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0],
  ne: [Math.SQRT1_2, -Math.SQRT1_2], nw: [-Math.SQRT1_2, -Math.SQRT1_2],
  se: [Math.SQRT1_2, Math.SQRT1_2], sw: [-Math.SQRT1_2, Math.SQRT1_2],
};
export function path(from: Pt, ...steps: Step[]): Pt[] {
  const out: Pt[] = [from];
  for (const [d, len] of steps) {
    const [x, y] = out[out.length - 1];
    out.push([x + DIR[d][0] * len, y + DIR[d][1] * len]);
  }
  return out;
}
