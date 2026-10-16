// The vessel: glass drawn by formula, so any bottle reads as glass with water in it.
//
// It comes apart into the layers light passes through, and the page stacks them with real
// transparency, so a stem seen through glass and water takes its colour from the browser, not from
// a guess. Back to front:
//
//   glass-back   the far wall: a pale pane behind everything inside
//   submerged    the stems below the waterline, shifted and broken, because water bends what it holds
//   water        the water itself, laid over the stems so they sink into its colour
//   surface      the waterline and the light caught on it
//   inside       the stems between the waterline and the mouth, as they stand
//   glass-front  the near pane, the walls, the lit side's highlight, and the foot
//
// The ground that runs out from the foot is ground.ts; what stands above the mouth is the bouquet's.

import { block, dot, line, PEN, run, type Pt } from "./pen.ts";

/**
 * Bottles by their right half, from the lip down to the foot, x from the axis and y from the lip.
 * Every one has the same number of points, so one can become another.
 */
export const BOTTLES: Record<string, Pt[]> = {
  jar: [[74, 0], [74, 26], [84, 44], [110, 62], [116, 82], [116, 292], [108, 308], [92, 312]],
  tumbler: [[66, 0], [66, 12], [66, 40], [66, 120], [66, 220], [66, 330], [62, 344], [52, 348]],
  milk: [[42, 0], [42, 22], [52, 70], [84, 128], [94, 168], [94, 292], [88, 308], [74, 312]],
  carafe: [[50, 0], [42, 16], [40, 44], [58, 112], [104, 192], [108, 252], [102, 278], [86, 284]],
  egg: [[72, 0], [74, 10], [98, 44], [124, 104], [128, 164], [118, 222], [96, 252], [70, 260]],
  prism: [[60, 0], [62, 8], [82, 44], [118, 118], [118, 178], [98, 256], [88, 268], [70, 272]],
};

/** A stem as it passes through the vessel, from the mouth down to where it rests. */
export type Submerged = { path: Pt[]; color: string; width?: number; broken?: string };

export type Vessel = {
  /** The closed outline: down the left from its lip, across the foot, up the right to its lip. */
  outline: Pt[];
  top: number;
  waterline: number;
  bottom: number;
  left: number;
  right: number;
  axis: number;
  /** Half the mouth's opening, inside the walls. */
  mouth: number;
};

/** A bottle stood on the line y = foot, about the axis, filled to `water` (0 to 1) of its height. */
export function vessel(axis: number, foot: number, half: Pt[], water: number): Vessel {
  const height = half[half.length - 1][1];
  const top = foot - height;
  const down = half.map(([x, y]): Pt => [axis - x, top + y]);
  const up = half.map(([x, y]): Pt => [axis + x, top + y]).reverse();
  const outline = [...down, ...up];
  const xs = outline.map((p) => p[0]);
  return {
    outline, top, axis,
    waterline: foot - height * water,
    bottom: foot,
    left: Math.min(...xs),
    right: Math.max(...xs),
    mouth: half[0][0] - PEN * 2,
  };
}

const d = (ps: Pt[]) => "M" + ps.map(([x, y]) => `${+x.toFixed(2)} ${+y.toFixed(2)}`).join(" L") + " Z";

/** The vessel's marks, layer by layer. `id` keeps one card's clip apart from another's on a page. */
export function glass(v: Vessel, stems: Submerged[], id: string): Record<string, string[]> {
  const wall = PEN * 2.4;
  const clip = `inside-${id}`;
  const within = (marks: string[]) => [`<g clip-path="url(#${clip})">`, ...marks, `</g>`];

  const back = [`<clipPath id="${clip}"><path d="${d(v.outline)}"/></clipPath>`, block(v.outline, "--ml-glass", wall * 0.5, 0.16)];

  // Below the water each stem is pushed away from the axis and broken; above it, between the water
  // and the mouth, it stands as it is.
  const bend = PEN * 1.2;
  const submerged: string[] = [], inside: string[] = [];
  for (const s of stems) {
    const w = s.width ?? PEN;
    const cross = crossing(s.path, v.waterline);
    inside.push(line([...s.path.filter((p) => p[1] < v.waterline), cross], s.color, w));
    const away = (x: number) => x + bend * Math.sign(x - v.axis || 1);
    const below = s.path.filter((p) => p[1] > v.waterline).map(([x, y]): Pt => [away(x), y]);
    submerged.push(...run([[away(cross[0]), v.waterline + PEN * 1.8], ...below], s.broken ?? "-6 .1 .1 -9 -4", s.color, w));
  }

  const water = [`<rect x="${v.left - wall}" y="${v.waterline}" width="${v.right - v.left + wall * 2}" height="${v.bottom - v.waterline + wall}" style="fill:var(--ml-water)"/>`];

  const span = v.right - v.left;
  const surface = [
    line([[v.left, v.waterline], [v.right, v.waterline]], "--ml-glass-wall", PEN * 1.6, 0.45),
    line([[v.left, v.waterline], [v.right, v.waterline]], "--ml-glass-rim", PEN * 0.45, 0.8),
    ...[0.18, 0.3, 0.84].map((k) => dot([v.left + span * k, v.waterline], PEN * 0.4, "--ml-shine", 0.7)),
  ];

  // The near pane, then the walls: a broad band and a line within it, a line down the shaded side and
  // a highlight down the lit side, each following its wall a little inside it, so it narrows into a
  // neck and swells round a belly as the glass does; the highlight breaks where the water starts.
  const n = v.outline.length / 2;
  const leftWall = v.outline.slice(0, n), rightWall = v.outline.slice(n).reverse();
  const lit = stretch(inset(leftWall, v.axis, wall * 1.3), v.top + (v.waterline - v.top) * 0.3, v.bottom - PEN * 3);
  const shade = stretch(inset(rightWall, v.axis, wall * 0.9), v.top + (v.waterline - v.top) * 0.55, v.bottom - PEN * 2.5);
  const above = stretch(lit, -Infinity, v.waterline - PEN * 1.2), below = stretch(lit, v.waterline + PEN * 2, Infinity);
  const front = [
    block(v.outline, "--ml-glass", wall * 0.5, 0.08),
    line(v.outline, "--ml-glass-wall", wall, 0.5),
    line(v.outline, "--ml-glass-rim", PEN * 0.8, 0.6),
    ...(shade.length > 1 ? [line(shade, "--ml-glass-rim", PEN * 0.7, 0.35)] : []),
    ...(above.length > 1 ? [line(above, "--ml-shine", PEN, 0.55)] : []),
    ...(below.length > 1 ? run(below, "-4 .1", "--ml-shine", PEN, 0.55) : []),
    line([[v.left - PEN * 0.3, v.bottom], [v.right + PEN * 0.3, v.bottom]], "--ml-foot", PEN * 2),
  ];

  return {
    "glass-back": back,
    submerged: within(submerged),
    water: within(water),
    surface: within(surface),
    inside: within(inside),
    "glass-front": front,
  };
}

/** A wall moved toward the axis by `by`, point by point. */
function inset(wall: Pt[], axis: number, by: number): Pt[] {
  return wall.map(([x, y]): Pt => [x + by * Math.sign(axis - x), y]);
}

/** The stretch of a path, running downward, that lies between y0 and y1, cut exactly at both. */
function stretch(ps: Pt[], y0: number, y1: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i], q = ps[i + 1];
    if (p[1] >= y0 && p[1] <= y1) out.push(p);
    if (!q) break;
    for (const y of [y0, y1]) {
      if ((p[1] - y) * (q[1] - y) < 0) out.push([p[0] + ((q[0] - p[0]) * (y - p[1])) / (q[1] - p[1]), y]);
    }
  }
  return out.sort((a, b) => a[1] - b[1]);
}

/** Where a path first reaches the line y. */
function crossing(ps: Pt[], y: number): Pt {
  for (let i = 1; i < ps.length; i++) {
    const [ax, ay] = ps[i - 1], [bx, by] = ps[i];
    if ((ay - y) * (by - y) <= 0 && ay !== by) {
      const k = (y - ay) / (by - ay);
      return [ax + (bx - ax) * k, y];
    }
  }
  return ps[ps.length - 1];
}
