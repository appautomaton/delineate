// Pieces to SVG markup: paths in stacking order, with each ramp as a linear gradient in the
// drawing's own coordinates. Ramps share one template that sets their units, and flat pieces of
// one tone and one color share one path.

import type { Fill } from "./ramp.ts";
import type { Piece } from "./stack.ts";

const num = (v: number) => Math.round(v).toString();

export function markup(pieces: Piece[], prefix: string): { defs: string; paths: string } {
  const defs = [`<linearGradient id="${prefix}" gradientUnits="userSpaceOnUse"/>`];
  const paths: string[] = [];
  for (let i = 0; i < pieces.length; i++) {
    const { d, fill, tone } = pieces[i];
    if ("color" in fill) {
      let joined = d;
      while (i + 1 < pieces.length && pieces[i + 1].tone === tone && "color" in pieces[i + 1].fill && (pieces[i + 1].fill as { color: string }).color === fill.color) joined += pieces[++i].d;
      paths.push(`<path fill="${fill.color}" d="${joined}"/>`);
      continue;
    }
    const id = prefix + defs.length.toString(36);
    const { x1, y1, x2, y2, from, to } = fill;
    defs.push(`<linearGradient id="${id}" href="#${prefix}" x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`);
    paths.push(`<path fill="url(#${id})" d="${d}"/>`);
  }
  return { defs: defs.length > 1 ? defs.join("\n") : "", paths: paths.join("\n") };
}
