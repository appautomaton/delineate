// Pieces to SVG markup, as trace/svg.ts writes it, leaner for a busy picture. A ramp across a few
// pixels is no gradient the eye can see: it is drawn flat in its middle color, and flat pieces of
// one tone and one color share one path. Gradient ids are short (the prefix plus a counter), since
// a busy region holds thousands of them.

import { hex } from "../../harness/trace/color.ts";
import type { Piece } from "../../harness/trace/stack.ts";

const num = (v: number) => Math.round(v).toString();
const rgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

// `ramp`: the shortest ramp, in pixels end to end, drawn as a gradient.
export function markup(pieces: Piece[], prefix: string, ramp = 8): { defs: string; paths: string } {
  const color = (fill: Piece["fill"]): string | undefined => {
    if ("color" in fill) return fill.color;
    if (Math.hypot(fill.x2 - fill.x1, fill.y2 - fill.y1) >= ramp) return;
    const [a, b] = [rgb(fill.from), rgb(fill.to)];
    return hex(a.map((v, k) => Math.round((v + b[k]) / 2)));
  };
  const defs = [`<linearGradient id="${prefix}" gradientUnits="userSpaceOnUse"/>`];
  const paths: string[] = [];
  for (let i = 0; i < pieces.length; i++) {
    const { d, fill, tone } = pieces[i];
    const flat = color(fill);
    if (flat) {
      let joined = d;
      while (i + 1 < pieces.length && pieces[i + 1].tone === tone && color(pieces[i + 1].fill) === flat) joined += pieces[++i].d;
      paths.push(`<path fill="${flat}" d="${joined}"/>`);
      continue;
    }
    if ("color" in fill) continue;
    const id = prefix + (defs.length - 1).toString(36);
    const { x1, y1, x2, y2, from, to } = fill;
    defs.push(`<linearGradient id="${id}" href="#${prefix}" x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`);
    paths.push(`<path fill="url(#${id})" d="${d}"/>`);
  }
  return { defs: defs.length > 1 ? defs.join("\n") : "", paths: paths.join("\n") };
}
