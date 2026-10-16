// The ground: what stands in for a shadow. Pills and dots run out from the vessel's foot along the
// line it stands on, longer and nearer on the side away from the light, thinning to single dots,
// never the same on both sides. A dot or two in a flower's colour says something fell.

import { dot, line, PEN, type Pt } from "./pen.ts";

/** A piece of ground: a pill `len` pens long (0 is a dot), `gap` pens after the one before it. */
type Piece = { gap: number; len: number; size?: number; tone?: number };

// Toward the light the ground is short and sparse; away from it, long and busy.
const NEAR: Piece[] = [{ gap: 0, len: 9, size: 1.8 }, { gap: 1.6, len: 0 }, { gap: 1.4, len: 0, tone: 1 }, { gap: 2.4, len: 0 }];
const FAR: Piece[] = [
  { gap: 0, len: 7, size: 2.2 }, { gap: 0.8, len: 2, size: 1.2 }, { gap: 1.2, len: 0, tone: 1 },
  { gap: 1.2, len: 0, size: 1.6 }, { gap: 1.6, len: 0, size: 2.4 }, { gap: 1.4, len: 0 }, { gap: 2.6, len: 0, tone: 2 },
];

/** `tones` are the ground's own colour first, then the fallen colours its dots may take. */
export function ground(left: number, right: number, y: number, tones: string[]): string[] {
  return [...side(left, -1, y, NEAR, tones), ...side(right, 1, y, FAR, tones)];
}

function side(from: number, dir: -1 | 1, y: number, pieces: Piece[], tones: string[]): string[] {
  const out: string[] = [];
  let x = from;
  for (const p of pieces) {
    const r = ((p.size ?? 1.1) * PEN) / 2;
    const color = tones[Math.min(p.tone ?? 0, tones.length - 1)];
    x += dir * (p.gap * PEN + r);
    if (p.len) {
      const end = x + dir * p.len * PEN;
      out.push(line([[x, y - r + PEN * 0.55], [end, y - r + PEN * 0.55]] as Pt[], color, r * 2, 0.8));
      x = end + dir * r;
    } else {
      out.push(dot([x, y + PEN * 0.55 - r], r, color, 0.85));
      x += dir * r;
    }
  }
  return out;
}
