// The people who stand in the rain, seen from behind, looking into it. Each is drawn the way a figure is
// built: each part a line of bone, joint to joint, given a width along it on either side, so a muscle is a
// swell in the widths and a joint a narrowing. The outline is found from the bone and the widths and drawn
// as one smooth closed curve, with no line around it: the form is the shape, and the dots that flow over it,
// around a part's bone as a contour runs around an arm, or along it as cloth falls.
//
// They are alive while they stand: a person is built afresh for each pose, which breathes, shifts its weight
// from leg to leg, lets the coat's hem go with the wind and turns the head a little. And one becomes the
// other: both are drawn as the same parts in the same order, each outline the same count of points, so any
// part of hers can be eased, point by point, into the same part of his.

export type Pt = [number, number];
type Flow = (x: number, y: number) => Pt;
/** A part as it is painted: its outline, and how its dots run. */
export type Part = { path: Path2D; flow: Flow };
export type Box = { x: number; y: number; w: number; h: number };

/** A width at a point along the bone, 0 at its start and 1 at its end: [t, on the left, on the right]. */
type Width = [number, number, number];
type Run = "around" | "along";
/** A part as it is drawn up: its bone (joints in order), its widths, how its dots run, how round its ends. */
type Spec = { bone: Pt[]; widths: Width[]; run: Run; caps: [number, number] };

/** Where a person is in their breathing and swaying: how a point of them is moved, the wind, the head's turn. */
export type Pose = { at: (x: number, y: number) => Pt; wind: number; turn: number };

/**
 * A person: their parts back to front in a pose, the hand on the shaft (hidden before them) and how far up
 * the shaft the canopy stands, so its rim clears their head.
 */
export type Body = { name: string; build: (p: Pose) => Spec[]; grip: Pt; reach: number; box: Box };

export const REST: Pose = { at: (x, y) => [x, y], wind: 0, turn: 0 };

/**
 * The pose at t seconds. Slow swells that never fall in step: the breath lifts the shoulders, the weight
 * goes from leg to leg, carrying the hips while the shoulders answer; the feet stay where they stand.
 */
export function pose(t: number): Pose {
  const breath = Math.sin((2 * Math.PI * t) / 4.2), sway = Math.sin((2 * Math.PI * t) / 7.3);
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  return {
    at: (x, y) => {
      const upper = clamp((520 - y) / 160), mid = Math.sin(Math.PI * clamp((y - 380) / 500));
      return [x + 2.6 * sway * mid - 1.0 * sway * upper, y - 1.4 * breath * upper];
    },
    wind: 0.65 * Math.sin((2 * Math.PI * t) / 3.3) + 0.35 * Math.sin((2 * Math.PI * t) / 1.9 + 1.3),
    turn: Math.sin((2 * Math.PI * t) / 9.5),
  };
}

/**
 * "Left" is the left of the bone's direction, so for a bone that runs down the page it is the reader's left.
 * `caps` round the start and the end, 0 cut square to 1 fully round.
 */
const part = (bone: Pt[], widths: Width[], run: Run, caps: [number, number] = [1, 1]): Spec => ({ bone, widths, run, caps });

const N = 28; // stations down each side of a part; with the caps, every outline has 2 * (N + 1) + 10 points

/** A part's outline: down its left side, round its end, back up its right, and round its start. */
function outline({ bone, widths, caps }: Spec): Pt[] {
  const len = lengths(bone), total = len[len.length - 1];
  const at = (t: number): Pt => {
    const s = t * total;
    let i = 1;
    while (i < len.length - 1 && len[i] < s) i++;
    const f = (s - len[i - 1]) / (len[i] - len[i - 1] || 1);
    return [bone[i - 1][0] + f * (bone[i][0] - bone[i - 1][0]), bone[i - 1][1] + f * (bone[i][1] - bone[i - 1][1])];
  };
  // the bone's direction, eased through a joint over a little of its length, so an elbow turns round
  const tangent = (t: number): Pt => {
    const a = at(Math.max(0, t - 0.06)), b = at(Math.min(1, t + 0.06)), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  const left: Pt[] = [], right: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, [x, y] = at(t), [tx, ty] = tangent(t), [wl, wr] = width(widths, t);
    left.push([x + ty * wl, y - tx * wl]);
    right.push([x - ty * wr, y + tx * wr]);
  }
  const cap = (t: number, round: number, out: number): Pt[] => {
    const [x, y] = at(t), [tx, ty] = tangent(t), [wl, wr] = width(widths, t), pts: Pt[] = [];
    for (let i = 1; i < 6; i++) {
      const a = (i / 6) * Math.PI, w = a < Math.PI / 2 ? wl : wr;
      // from the left side around the end to the right, bulging out by `round`
      const across = Math.cos(a) * w, ahead = Math.sin(a) * w * round * out;
      pts.push([x + ty * across + tx * ahead, y - tx * across + ty * ahead]);
    }
    return pts;
  };
  return [...left, ...cap(1, caps[1], 1), ...right.reverse(), ...cap(0, caps[0], -1).reverse()];
}

/**
 * The parts a fraction f of the way from one person to the other, in the same pose: each outline eased point
 * by point, each bone joint by joint, so the dots run the way the part in between runs.
 */
export function shape(a: Spec[], b: Spec[] | null, f: number): Part[] {
  return a.map((sa, i) => {
    const sb = b?.[i];
    const loop = wound(sb && f > 0 ? mix(outline(sa), outline(sb), f) : outline(sa));
    const bone = sb && f > 0 ? mix(sa.bone, sb.bone, f) : sa.bone;
    return { path: smooth(loop), flow: (f < 0.5 || !sb ? sa : sb).run === "around" ? aroundBone(bone) : alongBone(bone) };
  });
}

/**
 * A loop turned to run one way round, whichever way its bone ran, so that parts painted as one path add to
 * each other where they overlap instead of cancelling.
 */
function wound(p: Pt[]): Pt[] {
  let area = 0;
  for (let i = 0; i < p.length; i++) {
    const [a, b] = [p[i], p[(i + 1) % p.length]];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area < 0 ? p.reverse() : p;
}

const mix = (a: Pt[], b: Pt[], f: number): Pt[] => a.map(([x, y], i) => [x + (b[i][0] - x) * f, y + (b[i][1] - y) * f]);

function width(widths: Width[], t: number): [number, number] {
  let i = 1;
  while (i < widths.length - 1 && widths[i][0] < t) i++;
  const [a, b] = [widths[i - 1], widths[i]];
  const f = Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0] || 1)));
  const e = f * f * (3 - 2 * f); // eased, so a swell has no corners
  return [a[1] + e * (b[1] - a[1]), a[2] + e * (b[2] - a[2])];
}

function lengths(bone: Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < bone.length; i++) out.push(out[i - 1] + Math.hypot(bone[i][0] - bone[i - 1][0], bone[i][1] - bone[i - 1][1]));
  return out;
}

/** The nearest stretch of bone to a point, as its unit direction. */
function nearest(bone: Pt[], x: number, y: number): Pt {
  let best = Infinity, dir: Pt = [0, 1];
  for (let i = 1; i < bone.length; i++) {
    const [a, b] = [bone[i - 1], bone[i]], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    const f = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2));
    const d = Math.hypot(a[0] + f * dx - x, a[1] + f * dy - y);
    if (d < best) (best = d), (dir = [dx / Math.sqrt(l2), dy / Math.sqrt(l2)]);
  }
  return dir;
}
const aroundBone = (bone: Pt[]): Flow => (x, y) => {
  const [dx, dy] = nearest(bone, x, y);
  return [-dy, dx];
};
const alongBone = (bone: Pt[]): Flow => (x, y) => nearest(bone, x, y);

/** A closed loop of points as a smooth curve through them all (Catmull-Rom, as cubic Béziers). */
function smooth(p: Pt[]): Path2D {
  const n = p.length, q = (i: number) => p[(i + n) % n], path = new Path2D();
  path.moveTo(p[0][0], p[0][1]);
  for (let i = 0; i < n; i++) {
    const [a, b, c, e] = [q(i - 1), q(i), q(i + 1), q(i + 2)];
    path.bezierCurveTo(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6, c[0], c[1]);
  }
  path.closePath();
  return path;
}

// Both people are drawn as these parts, in this order, so either can become the other:
// legs, shoes and heels, neck, coat, storm flap, belt, the arm that holds the umbrella, the arm that hangs
// and its hand, collar, head.

/**
 * Long, from behind: a trench coat belted close and flaring to just above the knee, the storm flap across her
 * shoulders, the collar up; the hair cut level at a small, round head; heels. She holds the umbrella before
 * her in her right hand, so only that arm's elbow shows.
 */
const HER: Body = {
  name: "her",
  grip: [536, 474],
  reach: 292,
  box: { x: 400, y: 280, w: 230, h: 615 },
  build: ({ at, wind, turn }) => [
    // legs, the weight on the right, the left knee easing in: the thigh, the knee, the calf's swell, a slim ankle
    part([at(497, 680), at(489, 770), at(494, 868)], [[0, 15, 14], [0.3, 12, 11.5], [0.46, 9, 9], [0.64, 9.5, 10.5], [0.76, 8.5, 9], [0.92, 5.5, 5.5], [1, 5.5, 5.5]], "around", [0.4, 1]),
    part([at(531, 680), at(536, 772), at(538, 868)], [[0, 14, 15], [0.3, 11.5, 12], [0.46, 9, 9], [0.64, 10.5, 9.5], [0.76, 9, 8.5], [0.92, 5.5, 5.5], [1, 5.5, 5.5]], "around", [0.4, 1]),
    // shoes from behind, each on a slender heel
    part([[494, 858], [494, 880]], [[0, 6.5, 6.5], [0.6, 7.5, 7.5], [1, 7, 7]], "around", [1, 0.6]),
    part([[495, 876], [495, 889]], [[0, 2.2, 2.2], [1, 2, 2]], "along", [0.2, 0.2]),
    part([[538, 858], [538, 880]], [[0, 6.5, 6.5], [0.6, 7.5, 7.5], [1, 7, 7]], "around", [1, 0.6]),
    part([[539, 876], [539, 889]], [[0, 2.2, 2.2], [1, 2, 2]], "along", [0.2, 0.2]),
    // a long neck, under the hair
    part([at(516, 352), at(515, 396)], [[0, 9, 9], [0.7, 10, 10], [1, 14, 14]], "around", [0, 0]),
    // the trench: set shoulders, belted close, flaring to just above the knee, its hem going with the wind
    part([at(515, 388), at(514, 520), at(519 + 5 * wind, 732)], [[0, 16, 16], [0.03, 46, 46], [0.08, 52, 52], [0.16, 46, 46], [0.38, 35, 35], [0.56, 46, 48], [1, 68 - 2 * wind, 78 + 2 * wind]], "along", [0.4, 0.12]),
    // the storm flap across the shoulders, and the belt: their dots run across, the coat's down
    part([at(474, 410), at(516, 410), at(558, 410)], [[0, 4, 22], [0.5, 4, 32], [1, 4, 22]], "along", [0.2, 0.2]),
    part([at(479, 520), at(551, 520)], [[0, 4, 4], [1, 4, 4]], "along", [0.3, 0.3]),
    // the arm that holds the umbrella before her: shoulder and elbow, the forearm gone in front of her
    part([at(560, 418), at(574, 492), at(546, 482)], [[0, 14, 14], [0.2, 13, 13], [0.65, 10.5, 10.5], [1, 9, 9]], "around"),
    // the arm that hangs, and its hand
    part([at(472, 418), at(458, 510), at(452, 604)], [[0, 14, 14], [0.15, 13, 13], [0.48, 10, 10], [0.6, 10, 10], [0.95, 6, 6], [1, 6, 6]], "around"),
    part([at(452, 602), at(450, 628)], [[0, 6, 6], [0.5, 7, 7.5], [1, 4, 4]], "around"),
    // the collar, up around the back of the neck
    part([at(496, 398), at(516, 392), at(536, 398)], [[0, 12, 3], [0.5, 14, 3], [1, 12, 3]], "along", [0.4, 0.4]),
    // the back of the head, small and round, the hair cut level below it
    part([at(516 + 2.5 * turn, 331), at(516, 358)], [[0, 26, 26], [0.4, 28, 28], [0.8, 27.5, 27.5], [1, 27, 27]], "around", [1, 0.3]),
  ],
};

/**
 * Broad, from behind: the same trench on wide shoulders, belted to a narrow waist and falling to above the
 * knee, the collar up against short hair. He holds the umbrella before him in his right hand.
 */
const HIM: Body = {
  name: "him",
  grip: [538, 462],
  reach: 308,
  box: { x: 390, y: 255, w: 260, h: 640 },
  build: ({ at, wind, turn }) => [
    // legs: the thigh sweeping out, the knee, the calf swelling, a lean ankle
    part([at(490, 570), at(483, 728), at(485, 864)], [[0, 25, 22], [0.18, 29, 22], [0.36, 23, 19], [0.5, 15.5, 15], [0.64, 16.5, 18], [0.76, 15, 16], [0.9, 10.5, 10.5], [1, 9, 9]], "around", [0.4, 1]),
    part([at(543, 570), at(548, 728), at(548, 864)], [[0, 22, 25], [0.18, 22, 29], [0.36, 19, 23], [0.5, 15, 15.5], [0.64, 18, 16.5], [0.76, 16, 15], [0.9, 10.5, 10.5], [1, 9, 9]], "around", [0.4, 1]),
    // the heels of his shoes; where hers stand on heels, his are drawn in, too small to show
    part([[485, 856], [485, 884]], [[0, 10, 10], [0.6, 11.5, 11.5], [1, 11, 11]], "around", [1, 0.5]),
    part([[485, 879], [485, 882]], [[0, 0.5, 0.5], [1, 0.5, 0.5]], "along", [0.2, 0.2]),
    part([[548, 856], [548, 884]], [[0, 10, 10], [0.6, 11.5, 11.5], [1, 11, 11]], "around", [1, 0.5]),
    part([[548, 879], [548, 882]], [[0, 0.5, 0.5], [1, 0.5, 0.5]], "along", [0.2, 0.2]),
    // the neck, into the shoulders
    part([at(516, 318), at(516, 376)], [[0, 16, 16], [0.5, 17, 17], [1, 30, 30]], "around", [0, 0]),
    // the trench: wide set shoulders, belted in, falling to above the knee, its hem going with the wind
    part([at(516, 366), at(516, 520), at(520 + 5 * wind, 702)], [[0, 26, 26], [0.05, 62, 62], [0.12, 77, 77], [0.24, 72, 72], [0.46, 50, 50], [0.6, 56, 57], [1, 72 - 2 * wind, 78 + 2 * wind]], "along", [0.3, 0.12]),
    // the storm flap, and the belt
    part([at(450, 414), at(516, 414), at(582, 414)], [[0, 5, 28], [0.5, 5, 40], [1, 5, 28]], "along", [0.2, 0.2]),
    part([at(466, 520), at(567, 520)], [[0, 5, 5], [1, 5, 5]], "along", [0.3, 0.3]),
    // the arm that holds the umbrella before him: shoulder and elbow, the forearm gone in front of him
    part([at(590, 420), at(608, 500), at(572, 492)], [[0, 23, 23], [0.15, 23, 23], [0.6, 17, 17], [1, 14, 14]], "around"),
    // the arm that hangs, full in its sleeve to the cuff; the hand
    part([at(444, 420), at(424, 504), at(420, 592)], [[0, 23, 21], [0.1, 24, 22], [0.3, 20, 19], [0.5, 16, 16], [0.65, 15.5, 15.5], [0.92, 13, 13], [1, 13.5, 13.5]], "around"),
    part([at(420, 588), at(419, 618)], [[0, 9.5, 9.5], [0.45, 11.5, 12], [1, 8, 8]], "around"),
    // the collar, up around the back of the neck
    part([at(490, 382), at(516, 374), at(542, 382)], [[0, 15, 3], [0.5, 18, 3], [1, 15, 3]], "along", [0.4, 0.4]),
    // the back of the head, the hair short: a little longer than wide, no more
    part([at(516 + 2.5 * turn, 298), at(516, 326)], [[0, 24, 24], [0.4, 25.5, 25.5], [0.8, 24, 24], [1, 21, 21]], "around", [1, 0.55]),
  ],
};

export const BODIES = [HER, HIM];
export const bodyNamed = (name: string | null | undefined): Body => BODIES.find((b) => b.name === name) ?? HER;
