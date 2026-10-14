// Glasshouse: a Victorian palm house as a copperplate engraving, hand-tinted by day, lit by night.
//
// By day every tone is cut as line. Each form is hatched in its own direction; the lines swell in the shadows,
// break into flicks in the light, and a second set crosses the deepest darks. Foliage is cut as small curled
// touches, glass as fine level lines with the palms inside showing through, water as ruled lines broken by the
// reflection. The colour is laid over the print by hand; each form carries its tint as --c.
//
// By night the same drawing is lit, not filtered. There is one light that matters, the house glowing from within:
// its glass warm and luminous, the palms dark inside it, its iron black across it. Its light spills onto the
// terrace and the pond, where the house lies broken in the water, and catches the near side of the trees. The
// moon, high on the left, only edges things: a silver rim along the tops of clouds and crowns, and a few touches
// of the engraving where its light falls. Everything else is silhouette, darkest nearest, so the couple on the
// terrace, the urns and the lamp stand black against the glass.

import { catmull, ellipse, poly, resample, ribbon, spans, unionOutline, type Circle, type Pt } from "../../lib/geometry.ts";
import { f, fixed, hypot, round, sum } from "../../lib/number.ts";
import { Random } from "../../lib/random.ts";
import { dataUri } from "../../lib/svg.ts";

// The burin's widths. A tone in [0, 1] picks the nearest; below the first, the paper is left white.
const WIDTHS = [0.2, 0.28, 0.38, 0.5, 0.64, 0.8, 0.98, 1.2, 1.46];
const INK = "#231E1A";
const PAPER = "#EFEEE8";
const MOON = "#DCE1EA"; // moonlight: rims and the few touches it picks out
// Silhouettes, a little lighter with distance.
const DARK = { far: "#151B29", back: "#10151F", mid: "#0D121B", ground: "#0C1018", near: "#070A10" };
const TAU = 2 * Math.PI;

type Tone = (x: number, y: number) => number;
type Inside = (x: number, y: number) => boolean;

const radians = (degrees: number) => degrees * (Math.PI / 180);
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const lit = (on: boolean) => (on ? 1 : 0);

function smoothstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

// A sine hump over [0, 1], never negative, raised to a power to fatten or thin it.
const arch = (t: number, p = 1.0) => Math.max(0, Math.sin(Math.PI * t)) ** p;

// The index of the burin width nearest w, the first of two that are as near.
function nearestWidth(w: number): number {
  let best = 0;
  for (let i = 1; i < WIDTHS.length; i++) if (Math.abs(WIDTHS[i] - w) < Math.abs(WIDTHS[best] - w)) best = i;
  return best;
}

const widthIndex = (t: number) => (t <= 0.045 ? undefined : nearestWidth(0.16 + 1.4 * t));

// Back from geometry's relative poly() path to absolute points.
function parsePoly(d: string): Pt[] {
  const nums = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  let [x, y] = [nums[0], nums[1]];
  const pts: Pt[] = [[x, y]];
  for (let k = 2; k < nums.length - 1; k += 2) {
    [x, y] = [x + nums[k], y + nums[k + 1]];
    pts.push([x, y]);
  }
  return pts;
}

// A polygon set rasterised once, even-odd, for fast inside tests.
function mask(polys: readonly (readonly Pt[])[], cell = 1.2): Inside {
  const xs = polys.flatMap((p) => p.map(([x]) => x));
  const ys = polys.flatMap((p) => p.map(([, y]) => y));
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const w = Math.trunc((Math.max(...xs) - x0) / cell) + 2;
  const h = Math.trunc((Math.max(...ys) - y0) / cell) + 2;
  const rows = Array.from({ length: h }, (_, j) => {
    const row = new Uint8Array(w);
    const hits = spans(polys, y0 + (j + 0.5) * cell);
    for (let k = 0; k + 1 < hits.length; k += 2) {
      for (let i = Math.max(0, Math.trunc((hits[k] - x0) / cell + 0.5)); i < Math.min(w, Math.trunc((hits[k + 1] - x0) / cell + 0.5)); i++) row[i] = 1;
    }
    return row;
  });
  return (x, y) => {
    const [i, j] = [Math.trunc((x - x0) / cell), Math.trunc((y - y0) / cell)];
    return 0 <= i && i < w && 0 <= j && j < h && rows[j][i] === 1;
  };
}

// A coordinate to a tenth, never minus zero.
const r1 = (v: number) => round(v, 1) + 0;

// Numbers for a path, with the separator left out wherever the parser does not need it.
function joinNums(nums: readonly string[]): string {
  let out = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const [prev, cur] = [nums[i - 1], nums[i]];
    out += (cur.startsWith("-") || (cur.startsWith(".") && prev.includes(".")) ? "" : " ") + cur;
  }
  return out;
}

const pair = (a: number, b: number) => joinNums([f(a), f(b)]);

// A polyline after its first point, in relative steps, and where it ends.
function tailOf(pts: readonly Pt[]): [string, Pt] {
  const nums: string[] = [];
  let [px, py] = pts[0];
  for (const [x, y] of pts.slice(1)) {
    const [dx, dy] = [r1(x - px), r1(y - py)];
    if (dx || dy) {
      nums.push(f(dx), f(dy));
      [px, py] = [x, y];
    }
  }
  if (!nums.length) return ["h.1", [r1(pts[0][0] + 0.1), pts[0][1]]];
  return ["l" + joinNums(nums), [px, py]];
}

// A mark: where it starts, its tail in relative steps, and where it ends. A mark written as an absolute path has
// no start or end, and the next mark starts afresh after it.
type Mark = readonly [Pt | undefined, string, Pt | undefined];
type Marks = Map<number, Mark[]>;
const push = (store: Marks, width: number, mark: Mark) => {
  if (!store.has(width)) store.set(width, []);
  store.get(width)!.push(mark);
};

type Hatch = { step?: number; levels?: number[]; flick?: number };
type Touches = { curl?: number; mask?: Inside; tilt?: number };
type Rim = { w?: number; colour?: string; closed?: boolean; up?: boolean; light?: Pt; k?: number };

// One stratum of the print: its forms (knocked out of what lies behind, tinted, burnished at night) and its
// marks, grouped by width. Marks come in two kinds: lines, which draw a thing (its contour, its ribs, its veins),
// and cuts, which lay tone (hatching, touches, stipple). By day both are printed in ink; by night the lines are
// printed in moonlight and the cuts only whisper, the tone coming from the mezzotint. Marks are kept as (start,
// relative tail, end), so each width's path can step from one mark to the next with short relative moves.
class Plate {
  readonly rng: Random;
  readonly knock: boolean;
  readonly cuts: Marks = new Map();
  readonly lines: Marks = new Map();
  readonly shapes: string[] = [];
  extraTint = "";
  // The plate by night, in drawing order; "{SID}" stands for its own id.
  readonly night: string[] = [];
  // How strongly moonlight picks out the engraving along each form's lit edge, if at all.
  moonTexture?: number;
  // The forms that hide what lies behind them, for the planes behind.
  cover: Pt[][] = [];

  constructor(seed: number, knock = true) {
    this.rng = new Random(seed);
    this.knock = knock;
  }

  shape(form: readonly Pt[] | string, c: string): void {
    this.shapes.push(`<path class="gh-s" d="${typeof form === "string" ? form : poly(form)}" style="--c:${c}"/>`);
  }

  // A form by night, filled flat: a silhouette, or a light.
  nshape(form: readonly Pt[] | string, fill: string, extra = ""): void {
    this.night.push(`<path d="${typeof form === "string" ? form : poly(form)}" fill="${fill}"${extra}/>`);
  }

  // Moonlight along the edges of a form that face the moon: brighter where they face it squarely. `up` is for an
  // open edge whose outside is above it, such as a crest line.
  rim(outline: readonly Pt[], opacity: number, opts: Rim = {}): void {
    const { w = 0.6, colour = MOON, closed = true, up = false, light = [0.42, 0.9], k = 0.18 } = opts;
    const pts = resample(closed ? [...outline, outline[0]] : outline, 2.5);
    const cx = sum(pts.map(([x]) => x)) / pts.length;
    const cy = sum(pts.map(([, y]) => y)) / pts.length;
    const runs: [Pt[][], Pt[][]] = [[], []];
    let cur: Pt[] = [];
    let level: 0 | 1 | undefined;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [[ax, ay], [bx, by]] = [pts[i], pts[i + 1]];
      const [tx, ty] = [bx - ax, by - ay];
      const l = hypot(tx, ty) || 1;
      let [nx, ny] = [ty / l, -tx / l];
      const [mx, my] = [(ax + bx) / 2, (ay + by) / 2];
      if (up ? ny > 0 : nx * (mx - cx) + ny * (my - cy) < 0) [nx, ny] = [-nx, -ny];
      const facing = -(nx * light[0] + ny * light[1]);
      const band = facing < k ? undefined : facing > 0.6 ? 1 : 0;
      if (band !== level && cur.length) {
        runs[level!].push(cur);
        cur = [];
      }
      if (band !== undefined) {
        if (!cur.length) cur = [[ax, ay]];
        cur.push([bx, by]);
      }
      level = band;
    }
    if (cur.length && level !== undefined) runs[level].push(cur);
    for (const [band, alpha, width] of [[0, opacity * 0.55, w * 0.8], [1, opacity, w]] as const) {
      if (!runs[band].length) continue;
      const d = runs[band].filter((r) => r.length > 1).map((r) => poly(r, false)).join("");
      this.night.push(
        `<path d="${d}" fill="none" stroke="${colour}" stroke-opacity="${f(alpha)}" ` +
          `stroke-width="${f(width)}" stroke-linecap="round" stroke-linejoin="round"/>`,
      );
    }
  }

  #add(width: number, points: readonly Pt[], store: Marks = this.cuts): void {
    const pts = points.map(([x, y]): Pt => [r1(x), r1(y)]);
    const [tail, end] = tailOf(pts);
    push(store, width, [pts[0], tail, end]);
  }

  // A line that draws: a contour, a rib, a vein.
  cut(pts: readonly Pt[], w: number): void {
    this.#add(nearestWidth(w), pts, this.lines);
  }

  // A line written by hand as an absolute path; the next mark starts afresh after it.
  raw(d: string, w: number): void {
    push(this.lines, nearestWidth(w), [undefined, d, undefined]);
  }

  // Parallel cuts across the polygons. Each run's width follows the tone beneath it.
  hatch(polys: readonly (readonly Pt[])[], angle: number, gap: number, tone: Tone, opts: Hatch = {}): void {
    const { step = 3.0, flick = 0.18 } = opts;
    const a = radians(angle);
    const [ca, sa] = [Math.cos(a), Math.sin(a)];
    const rot = polys.map((p) => p.map(([x, y]): Pt => [x * ca + y * sa, -x * sa + y * ca]));
    let levels = opts.levels;
    if (!levels) {
      const vs = rot.flatMap((p) => p.map(([, v]) => v));
      const top = Math.max(...vs);
      levels = [];
      for (let v = Math.min(...vs) + gap * this.rng.random(); v < top; v += gap) levels.push(v);
    }
    for (const v of levels) {
      const hits = spans(rot, v);
      for (let h = 0; h + 1 < hits.length; h += 2) {
        const [u0, u1] = [hits[h], hits[h + 1]];
        const n = Math.max(1, Math.trunc((u1 - u0) / step + 0.5));
        const du = (u1 - u0) / n;
        const marks = Array.from({ length: n }, (_, k) => {
          const um = u0 + (k + 0.5) * du;
          const t = tone(um * ca - v * sa, um * sa + v * ca);
          const b = widthIndex(t);
          return b !== undefined && t < flick && this.rng.random() * flick > t ? undefined : b;
        });
        // Each run of one width is cut as a single line.
        for (let k = 0; k < n; ) {
          let j = k;
          while (j < n && marks[j] === marks[k]) j++;
          const b = marks[k];
          if (b !== undefined) {
            const [ua, ub] = [u0 + k * du, u0 + j * du];
            this.#add(b, [[ua * ca - v * sa, ua * sa + v * ca], [ub * ca - v * sa, ub * sa + v * ca]]);
          }
          k = j;
        }
      }
    }
  }

  // Foliage as the engraver cuts it: small curled touches, closer and heavier in the shade.
  touches(polys: readonly (readonly Pt[])[], tone: Tone, step: number, size: number, opts: Touches = {}): void {
    const { curl = 1.0, tilt = 0.0 } = opts;
    const inside = opts.mask ?? mask(polys);
    const xs = polys.flatMap((p) => p.map(([x]) => x));
    const ys = polys.flatMap((p) => p.map(([, y]) => y));
    const [right, bottom] = [Math.max(...xs), Math.max(...ys)];
    for (let y = Math.min(...ys), row = 0; y < bottom; y += step * 0.6, row++) {
      for (let x = Math.min(...xs) + (row % 2 ? step / 2 : 0); x < right; x += step) {
        const px = x + this.rng.uniform(-0.45, 0.45) * step;
        const py = y + this.rng.uniform(-0.3, 0.3) * step;
        if (!inside(px, py)) continue;
        const t = tone(px, py);
        if (!(this.rng.random() < t * 1.7)) continue;
        const b = widthIndex(Math.min(1, t * 0.85 + 0.06));
        if (b === undefined) continue;
        const s = size * this.rng.uniform(0.7, 1.25);
        const dy = s * tilt * this.rng.uniform(0.5, 1.5);
        const [sx, sy] = [r1(px - s), r1(py - dy)];
        const [c1, c2, e1, e2] = [r1(s), r1(s * curl + dy), r1(2 * s), r1(2 * dy)];
        push(this.cuts, b, [[sx, sy], "q" + joinNums([f(c1), f(c2), f(e1), f(e2)]), [r1(sx + e1), r1(sy + e2)]]);
      }
    }
  }

  // The edge of a mass of leaves: a run of small bulges, each pushed out from the middle of the mass.
  scallops(outline: readonly Pt[], size: number, w: number, keep: Inside = () => true): void {
    const cx = sum(outline.map(([x]) => x)) / outline.length;
    const cy = sum(outline.map(([, y]) => y)) / outline.length;
    const pts = resample([...outline, outline[0]], size * 2);
    const b = nearestWidth(w);
    for (let i = 0; i + 1 < pts.length; i++) {
      const [mx, my] = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
      if (!keep(mx, my)) continue;
      const [nx, ny] = [mx - cx, my - cy];
      const l = hypot(nx, ny) || 1;
      const [ax, ay, bx, by] = [r1(pts[i][0]), r1(pts[i][1]), r1(pts[i + 1][0]), r1(pts[i + 1][1])];
      const [qx, qy] = [r1(mx + (nx / l) * size * 0.8 - ax), r1(my + (ny / l) * size * 0.8 - ay)];
      push(this.lines, b, [[ax, ay], "q" + joinNums([f(qx), f(qy), f(r1(bx - ax)), f(r1(by - ay))]), [bx, by]]);
    }
  }

  // Gravel and sand: dots, pecked closer where the tone is darker.
  stipple(polys: readonly (readonly Pt[])[], tone: Tone, step: number): void {
    const inside = mask(polys);
    const xs = polys.flatMap((p) => p.map(([x]) => x));
    const ys = polys.flatMap((p) => p.map(([, y]) => y));
    const [right, bottom] = [Math.max(...xs), Math.max(...ys)];
    for (let y = Math.min(...ys); y < bottom; y += step) {
      for (let x = Math.min(...xs); x < right; x += step) {
        const [px, py] = [r1(x + this.rng.uniform(0, step)), r1(y + this.rng.uniform(0, step))];
        if (inside(px, py) && this.rng.random() < tone(px, py) * 2.2) push(this.cuts, this.rng.choice([1, 2, 3]), [[px, py], "h.1", [r1(px + 0.1), py]]);
      }
    }
  }

  // Each width's marks as one path, stepping from one mark to the next.
  svgCuts(store: Marks = this.cuts): string {
    return [...store.keys()]
      .sort((a, b) => a - b)
      .map((i) => {
        let d = "";
        let here: Pt | undefined;
        for (const [start, tail, end] of store.get(i)!) {
          if (!start) {
            d += tail;
            here = undefined;
            continue;
          }
          d += here ? "m" + pair(r1(start[0] - here[0]), r1(start[1] - here[1])) : "M" + pair(...start);
          d += tail;
          here = end;
        }
        return `<path d="${d}" stroke-width="${WIDTHS[i]}"/>`;
      })
      .join("");
  }
}

// Tone fields. Light comes from the upper left and a little toward the viewer.

const LIGHT = [-0.52, -0.62, 0.59];

function lambert(nx: number, ny: number): number {
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  return nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
}

const sphere = (cx: number, cy: number, rx: number, ry: number, base: number, amp: number): Tone => (x, y) => {
  let [nx, ny] = [(x - cx) / rx, (y - cy) / ry];
  const k = hypot(nx, ny);
  if (k > 0.99) [nx, ny] = [(nx / k) * 0.99, (ny / k) * 0.99];
  return clamp(base + amp * (0.55 - lambert(nx, ny)));
};

// A vertical cylinder: lit on the left, turning into shade on the right.
const cylinder = (cx: number, r: number, base: number, amp: number): Tone => (x) => clamp(base + amp * (0.55 - lambert(clamp((x - cx) / r, -0.99, 0.99), 0)));

// Masses of foliage: each point is shaded as part of the nearest lobe, and darker toward the bottom.
function lobesTone(lobes: readonly Circle[], base: number, amp: number, [y0, y1, extra] = [0, 1, 0]): Tone {
  return (x, y) => {
    let near = lobes[0];
    let best = Infinity;
    for (const c of lobes) {
      const d = ((x - c[0]) ** 2 + (y - c[1]) ** 2) / c[2] ** 2;
      if (d < best) [near, best] = [c, d];
    }
    const light = lambert(clamp((x - near[0]) / near[2], -0.95, 0.95), clamp((y - near[1]) / near[2], -0.95, 0.95));
    return clamp(base + amp * (0.6 - light) + extra * smoothstep(y0, y1, y));
  };
}

// Points on an ellipse; angles in degrees, counter-clockwise as seen, with y pointing down the page.
const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number): Pt[] =>
  Array.from({ length: n + 1 }, (_, k) => {
    const a = radians(a0 + ((a1 - a0) * k) / n);
    return [cx + rx * Math.cos(a), cy - ry * Math.sin(a)];
  });

const blob = (cx: number, cy: number, rx: number, ry: number, rng: Random, n = 28, rough = 0.08): Pt[] =>
  Array.from({ length: n }, (_, k) => {
    const a = (k * TAU) / n;
    return [cx + rx * Math.cos(a) * (1 + rng.uniform(-rough, rough)), cy + ry * Math.sin(a) * (1 + rng.uniform(-rough, rough))];
  });

// The top edge of a row of round crowns.
function crownEdge(circles: readonly Circle[], x0: number, x1: number, floor: number, step = 3): Pt[] {
  const edge: Pt[] = [];
  for (let x = x0; x <= x1; x += step) {
    let top = floor;
    for (const [cx, cy, r] of circles) if (Math.abs(x - cx) < r) top = Math.min(top, cy - Math.sqrt(r * r - (x - cx) ** 2));
    edge.push([x, top]);
  }
  return edge;
}

const closedLoop = (pts: readonly Pt[]) => [...pts, pts[0]];

// ---------------------------------------------------------------------------------------------------------
// The sky and the far trees.

const SKY_TOP = 150;
const GROUND = 482;

function farPlane(cover: readonly Inside[]): Plate[] {
  const rng = new Random(1);
  const [sky, trees] = [new Plate(1, false), new Plate(2, false)];

  // The far tree line: a low band of rounded crowns with a few poplars standing out of it.
  const crowns: Circle[] = [];
  for (let x = -100; x < 1720; ) {
    const r = rng.uniform(15, 28);
    crowns.push([x, 472 - r * rng.uniform(0.45, 0.95), r]);
    x += r * rng.uniform(1.0, 1.5);
  }
  const poplars = [176, 230, 1372, 1418, 1468].map((px): Pt => [px, rng.uniform(384, 412)]);
  const top = (x: number) => {
    let best = 472.0;
    for (const [cx, cy, r] of crowns) if (Math.abs(x - cx) < r) best = Math.min(best, cy - Math.sqrt(r * r - (x - cx) ** 2));
    for (const [px, ptop] of poplars) {
      if (Math.abs(x - px) < 9) {
        const u = Math.abs(x - px) / 9;
        best = Math.min(best, ptop + ((472 - ptop) * Math.asin(Math.min(1, u ** (1 / 0.55)))) / Math.PI / 1.6);
      }
    }
    return best;
  };
  const edge: Pt[] = [];
  for (let x = -100; x <= 1720; x += 4) edge.push([x, top(x)]);
  const band: Pt[] = [...edge, [1720, 486], [-100, 486]];
  trees.shape(band, "#A9BCA4");
  trees.night.push('<rect x="-100" y="300" width="1820" height="186" fill="url(#gh-night-haze)"/>');
  trees.nshape(band, DARK.far);
  trees.rim(edge, 0.3, { w: 0.5, closed: false, up: true });
  const seen = lobesTone(crowns, 0.12, 0.16, [430, 472, 0.08]);
  // Hidden where the nearer planes cover it all round.
  const tone: Tone = (x, y) => {
    const hidden = [[0, 0], [-10, 0], [10, 0], [0, -6]].every(([dx, dy]) => cover.some((m) => m(x + dx, y + dy)));
    return hidden ? 0 : seen(x, y);
  };
  trees.hatch([band], -4, 2.1, tone, { flick: 0.2 });
  trees.touches([band], (x, y) => tone(x, y) * 0.7, 4.2, 1.4, { curl: 0.9 });

  // The sky, ruled level and close: darkest a little above the trees, fading toward the words above.
  const clouds = [
    unionOutline([[300, 262, 34], [340, 248, 40], [386, 258, 32], [262, 272, 22], [420, 270, 22]], 340, 262),
    unionOutline([[1150, 236, 30], [1196, 222, 40], [1246, 232, 34], [1290, 246, 24], [1110, 248, 20]], 1196, 236),
    unionOutline([[520, 312, 15], [548, 302, 21], [578, 310, 15]], 548, 308),
  ];
  const skyPoly: Pt[] = [[-100, SKY_TOP], [1720, SKY_TOP], ...edge.toReversed()];
  const levels = Array.from({ length: Math.trunc((486 - SKY_TOP) / 2.5) }, (_, k) => SKY_TOP + 2.5 * k);
  const skyTone: Tone = (x, y) => {
    const low = SKY_TOP + 34 + 30 * Math.sin(x / 173 + 1.3) * Math.cos(x / 89 - 0.4) + 14 * Math.sin(x / 41);
    return 0.17 * smoothstep(low, low + 70, y) * (1 - 0.62 * smoothstep(270, 470, y));
  };
  sky.hatch([skyPoly, ...clouds], 0, 2.5, skyTone, { levels, step: 4, flick: 0.1 });
  for (const c of clouds) {
    const ys = c.map(([, y]) => y);
    const [lo, hi] = [Math.min(...ys), Math.max(...ys)];
    sky.hatch([c], 0, 2.5, (_, y) => 0.2 * smoothstep(lo + (hi - lo) * 0.5, hi, y), { levels, step: 3, flick: 0.2 });
    sky.cut([...c.slice(Math.floor(c.length / 2)), c[0]], 0.2);
  }
  sky.extraTint = `<rect x="-100" y="${SKY_TOP}" width="1820" height="${486 - SKY_TOP}" fill="url(#gh-sky-tint)"/>`;
  // By night the clouds are dark, and the moon above them lines their tops with silver.
  for (const c of clouds) {
    sky.nshape(c, "url(#gh-night-cloud)");
    sky.rim(c, 0.7, { w: 0.8 });
  }
  return [sky, trees];
}

// ---------------------------------------------------------------------------------------------------------
// The palm house: a centre block with a dome over a clerestory, and two long wings ending in apses.

const [C_X0, C_X1] = [640, 960];
const [C_WALL, C_AISLE, C_CLER] = [404, 364, 336];
const [DOME_RX, DOME_RY] = [122, 100];
const [W_WALL, W_RIDGE] = [424, 378];
const [L_X0, R_X1] = [412, 1188];
const APSE = 40;
const PLINTH = 470;
const RIB = 8.4;

function wingOutline(left: boolean): Pt[] {
  if (left) return [[L_X0, PLINTH], ...arc(L_X0 + APSE, W_WALL, APSE, W_WALL - W_RIDGE, 180, 90, 12), [C_X0, W_RIDGE], [C_X0, PLINTH]];
  return [[C_X1, PLINTH], [C_X1, W_RIDGE], ...arc(R_X1 - APSE, W_WALL, APSE, W_WALL - W_RIDGE, 90, 0, 12), [R_X1, PLINTH]];
}

function centreOutline(): Pt[] {
  const leftEnd = arc(C_X0 + 32, C_WALL, 32, C_WALL - C_AISLE, 180, 90, 8);
  const rightEnd = arc(C_X1 - 32, C_WALL, 32, C_WALL - C_AISLE, 90, 0, 8);
  const dome = arc(800, C_CLER, DOME_RX, DOME_RY, 180, 0, 36);
  return [[C_X0, PLINTH], ...leftEnd, [672, C_CLER], [678, C_CLER], ...dome, [928, C_CLER], ...rightEnd, [C_X1, PLINTH]];
}

const houseMask = () => mask([wingOutline(true), wingOutline(false), centreOutline()]);

// Palm crowns inside the house: arching fronds round a crown, a trunk below.
function palms(rng: Random): Pt[][] {
  const out: string[] = [];
  const crowns = [[800, 286, 92, 300], [742, 352, 52, 360], [862, 356, 50, 362], [498, 404, 46, 410], [586, 398, 44, 404], [1014, 398, 44, 404], [1104, 404, 46, 410]];
  for (const [cx, cy, spread, trunkTop] of crowns) {
    const foot = cx === 800 ? 432 : PLINTH;
    out.push(ribbon([[cx + 1, foot], [cx - 2, (foot + trunkTop) / 2], [cx, trunkTop]], (u) => 5 - 2 * u));
    for (let k = 0; k < 11; k++) {
      const ang = radians(-178 + k * 17.6 + rng.uniform(-6, 6));
      const ln = spread * rng.uniform(0.6, 0.92);
      const lift = Math.sin(ang);
      const mid: Pt = [cx + Math.cos(ang) * ln * 0.5, cy + lift * ln * 0.62 - ln * 0.08];
      const tip: Pt = [cx + Math.cos(ang) * ln, cy + lift * ln * 0.55 + ln * 0.3 * (1 - Math.abs(lift)) + ln * 0.1];
      out.push(ribbon(resample(catmull([[cx, cy], mid, tip], 6), 3), (u) => spread * 0.11 * arch(Math.min(1, u * 1.15), 0.6)));
    }
  }
  return out.map(parsePoly).filter((p) => p.length > 2);
}

// Sky caught in a pane: a white diagonal the hatching leaves alone.
const streak = (sx: number, sy: number, ln: number): Pt[] => [[sx, sy + ln], [sx + ln * 0.62, sy], [sx + ln * 0.62 + 4, sy], [sx + 4, sy + ln]];

function housePlate(): [Plate, Plate] {
  const rng = new Random(7);
  const pl = new Plate(7);
  const [left, right, centre] = [wingOutline(true), wingOutline(false), centreOutline()];
  const porch: Pt[] = [[778, PLINTH], [778, 438], ...arc(800, 438, 22, 14, 180, 0, 12), [822, PLINTH]];
  const lantern: Pt[] = [[790, 238], [790, 220], [794, 214], [806, 214], [810, 220], [810, 238]];
  for (const o of [left, right, centre, porch, lantern]) pl.shape(o, "#CFE2E1");
  const palmPolys = palms(rng);
  for (const p of palmPolys) pl.shape(p, "#7FA06C");
  const inside = mask(palmPolys);
  // By night: the glass lit from within, the palms dark against it, the glazing a faint warm texture.
  pl.night.push('<g id="gh-house-glow">');
  for (const o of [left, right, centre, porch, lantern]) pl.nshape(o, "url(#gh-glass-glow)");
  pl.nshape(`M672 ${C_AISLE}V${C_CLER}H928V${C_AISLE}Z`, "#9A6534", ' opacity=".45"');
  pl.night.push('<use href="#{SID}-cuts" style="--gh-ink:#6B4421" opacity=".3"/>');
  pl.night.push('<g fill="#2E1E10" opacity=".82" filter="url(#gh-veil)">' + palmPolys.map((p) => `<path d="${poly(p)}"/>`).join("") + "</g>");

  // Glass: no lighter than this where the palms show through it.
  const glass = (base: Tone): Tone => (x, y) => (inside(x, y) ? Math.max(base(x, y), 0.4) : base(x, y));

  const walls: Pt[][] = [
    [[L_X0, PLINTH], [L_X0, W_WALL], [C_X0, W_WALL], [C_X0, PLINTH]],
    [[C_X1, PLINTH], [C_X1, W_WALL], [R_X1, W_WALL], [R_X1, PLINTH]],
    [[C_X0, PLINTH], [C_X0, C_WALL], [C_X1, C_WALL], [C_X1, PLINTH]],
  ];
  const wallStreaks = [[470, 452, 18], [560, 440, 22], [708, 452, 18], [884, 446, 20], [1060, 446, 18], [1140, 452, 16]].map(([x, y, ln]) => streak(x, y, ln));
  pl.hatch([...walls, ...wallStreaks], 0, 2.0, glass((x, y) => 0.1 + 0.2 * smoothstep(C_WALL, PLINTH, y) + 0.05 * lit(x > 800)), { flick: 0.16 });

  // The wing vaults, seen along their length: darker at the eaves, where the glass turns toward us.
  const vaults: Pt[][] = [
    [[L_X0 + APSE, W_WALL], [L_X0 + APSE, W_RIDGE], [C_X0, W_RIDGE], [C_X0, W_WALL]],
    [[C_X1, W_WALL], [C_X1, W_RIDGE], [R_X1 - APSE, W_RIDGE], [R_X1 - APSE, W_WALL]],
  ];
  const vaultStreaks = [streak(480, 410, 12), streak(1020, 408, 14)];
  pl.hatch([...vaults, ...vaultStreaks], 0, 1.7, glass((x, y) => 0.04 + 0.28 * smoothstep(W_RIDGE, W_WALL, y) ** 1.6 + 0.04 * lit(x > 800)), { flick: 0.18 });

  // The apses: quarter domes, lit on the west, turned into shade on the east.
  const apseL: Pt[] = [[L_X0, W_WALL], ...arc(L_X0 + APSE, W_WALL, APSE, W_WALL - W_RIDGE, 180, 90, 12), [L_X0 + APSE, W_WALL]];
  const apseR: Pt[] = [[R_X1 - APSE, W_WALL], ...arc(R_X1 - APSE, W_WALL, APSE, W_WALL - W_RIDGE, 90, 0, 12), [R_X1, W_WALL]];
  pl.hatch([apseL], 0, 1.7, glass(sphere(L_X0 + APSE, W_WALL, APSE * 1.1, (W_WALL - W_RIDGE) * 1.1, 0.02, 0.34)), { flick: 0.18 });
  pl.hatch([apseR], 0, 1.7, glass(sphere(R_X1 - APSE, W_WALL, APSE * 1.1, (W_WALL - W_RIDGE) * 1.1, 0.14, 0.36)), { flick: 0.18 });

  // The centre block's aisle roof and its curved ends, then the clerestory in shadow under the dome.
  const aisle: Pt[] = [[C_X0, C_WALL], ...arc(C_X0 + 32, C_WALL, 32, C_WALL - C_AISLE, 180, 90, 8), ...arc(C_X1 - 32, C_WALL, 32, C_WALL - C_AISLE, 90, 0, 8)];
  const aisleStreaks = [streak(676, 376, 14), streak(906, 386, 14)];
  pl.hatch([aisle, ...aisleStreaks], 0, 1.7, glass((x, y) => 0.05 + 0.26 * smoothstep(C_AISLE, C_WALL, y) ** 1.5 + 0.06 * smoothstep(800, 960, x)), { flick: 0.18 });
  const cler: Pt[] = [[672, C_AISLE], [672, C_CLER], [928, C_CLER], [928, C_AISLE]];
  pl.hatch([cler], 90, 1.9, glass((_, y) => 0.3 + 0.1 * smoothstep(C_CLER, C_AISLE, y)), { flick: 0.1 });

  const dome: Pt[] = [[678, C_CLER], ...arc(800, C_CLER, DOME_RX, DOME_RY, 180, 0, 36)];
  const domeStreaks = [streak(722, 300, 26), streak(752, 262, 22)];
  pl.hatch([dome, ...domeStreaks], 0, 1.6, glass(sphere(800, C_CLER, DOME_RX * 1.05, DOME_RY * 1.05, 0.02, 0.38)), { flick: 0.2 });
  pl.hatch([lantern], 90, 1.6, (x) => 0.22 + 0.2 * lit(x > 800));
  for (const st of [...wallStreaks, ...vaultStreaks, ...aisleStreaks, ...domeStreaks]) pl.nshape(st, "#FFF7E2", ' opacity=".42"');

  // The palms again, crossed, so they sit dark behind the glass.
  for (const g of [...walls, ...vaults, apseL, apseR, aisle, cler, dome]) pl.hatch([g], 52, 2.8, (x, y) => (inside(x, y) ? 0.32 : 0), { flick: 0 });

  const iron = new Plate(8, false);
  // By night the iron is the darkest thing on the house: tracery drawn over the lit glass.
  iron.night.push('<use href="#{SID}-lines" style="--gh-ink:#170F08" opacity=".9"/>');
  // Ironwork: ribs on every face, purlins along the curves, a gutter at each eave, cresting on the ridges.
  const ribs = (x0: number, x1: number, yTop: number, yBottom: number, w = 0.42) => {
    const n = Math.trunc((x1 - x0) / RIB);
    for (let k = 1; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / (n + 1);
      iron.cut([[x, yBottom], [x, yTop]], k % 4 === 0 ? 0.66 : w);
    }
  };
  ribs(L_X0 + APSE, C_X0, W_RIDGE, PLINTH);
  ribs(C_X1, R_X1 - APSE, W_RIDGE, PLINTH);
  ribs(L_X0, L_X0 + APSE, W_WALL, PLINTH);
  ribs(R_X1 - APSE, R_X1, W_WALL, PLINTH);
  ribs(C_X0, C_X1, C_WALL, PLINTH);
  ribs(C_X0 + 32, C_X1 - 32, C_AISLE, C_WALL);
  ribs(672, 928, C_CLER, C_AISLE, 0.5);
  for (let k = 1; k < 6; k++) {
    const s = Math.sin((k * Math.PI) / 12);
    const y = W_WALL - (W_WALL - W_RIDGE) * s;
    const reach = APSE * Math.cos((k * Math.PI) / 12);
    iron.cut([[L_X0 + APSE - reach, y], [C_X0, y]], 0.26);
    iron.cut([[C_X1, y], [R_X1 - APSE + reach, y]], 0.26);
    const y2 = C_WALL - (C_WALL - C_AISLE) * s;
    const r2 = 32 * Math.cos((k * Math.PI) / 12);
    iron.cut([[C_X0 + 32 - r2, y2], [C_X1 - 32 + r2, y2]], 0.26);
  }
  const quarters = [[L_X0 + APSE, -1, APSE, W_WALL, W_WALL - W_RIDGE, 5], [R_X1 - APSE, 1, APSE, W_WALL, W_WALL - W_RIDGE, 5],
    [C_X0 + 32, -1, 32, C_WALL, C_WALL - C_AISLE, 4], [C_X1 - 32, 1, 32, C_WALL, C_WALL - C_AISLE, 4]];
  for (const [cx, sign, rx, base, rise, n] of quarters) {
    for (let k = 1; k < n; k++) {
      const al = (k * Math.PI) / 2 / n;
      iron.cut(Array.from({ length: 11 }, (_, j): Pt => {
        const b = (j * Math.PI) / 20;
        return [cx + sign * rx * Math.cos(al) * Math.cos(b), base - rise * Math.sin(b)];
      }), 0.4);
    }
  }
  // Dome: meridians that close on the lantern, parallels that tighten toward the top.
  for (let k = 1; k < 24; k++) {
    const al = (k * Math.PI) / 24;
    const pts = Array.from({ length: 17 }, (_, j): Pt => {
      const b = (j * Math.PI) / 32;
      return [800 + DOME_RX * Math.cos(al) * Math.cos(b), C_CLER - DOME_RY * Math.sin(b)];
    });
    iron.cut(pts.filter(([, y]) => y > 238), k % 4 === 0 ? 0.7 : 0.4);
  }
  for (let k = 1; k < 8; k++) {
    const b = (k * Math.PI) / 2 / 8.6;
    const y = C_CLER - DOME_RY * Math.sin(b);
    const r = DOME_RX * Math.cos(b);
    iron.cut([[800 - r, y], [800 + r, y]], 0.28);
  }
  // Eaves with their gutters, and a transom across each wall.
  for (const [x0, x1, y] of [[L_X0, C_X0, W_WALL], [C_X1, R_X1, W_WALL], [C_X0, C_X1, C_WALL], [672, 928, C_AISLE], [672, 928, C_CLER]]) {
    iron.cut([[x0 - 2, y], [x1 + 2, y]], 1.0);
    iron.cut([[x0 - 2, y + 2.2], [x1 + 2, y + 2.2]], 0.3);
  }
  for (const [x0, x1] of [[L_X0, C_X0], [C_X1, R_X1], [C_X0, C_X1]]) iron.cut([[x0, 447], [x1, 447]], 0.5);
  // Cresting along the ridges: a light iron railing of uprights under a top bar, and finials.
  for (const [x0, x1, y] of [[L_X0 + APSE, C_X0, W_RIDGE], [C_X1, R_X1 - APSE, W_RIDGE], [C_X0 + 32, C_X1 - 32, C_AISLE]]) {
    iron.cut([[x0, y], [x1, y]], 0.9);
    iron.cut([[x0, y - 3.4], [x1, y - 3.4]], 0.26);
    for (let x = x0 + 2; x < x1; x += 3.2) iron.raw(`M${f(x)} ${f(y)}v-4.6`, 0.3);
  }
  for (const [fx, fy] of [[L_X0 + APSE, W_RIDGE], [R_X1 - APSE, W_RIDGE], [C_X0 + 32, C_AISLE], [C_X1 - 32, C_AISLE]]) {
    iron.raw(`M${f(fx)} ${f(fy)}v-11`, 0.6);
    iron.raw(ellipse(fx, fy - 6, 1.4, 1.4), 0.4);
  }
  // The lantern and its finial.
  iron.cut(lantern, 0.7);
  for (const x of [795, 800, 805]) iron.cut([[x, 236], [x, 219]], 0.3);
  iron.raw("M800 214v-16", 0.6);
  iron.raw(ellipse(800, 205, 1.8, 1.8), 0.4);
  for (const o of [left, right, centre]) iron.cut(o, 0.55);
  // The porch with its door.
  pl.hatch([porch], 0, 1.8, (_, y) => 0.16 + 0.1 * smoothstep(438, 470, y));
  const door: Pt[] = [[788, PLINTH], [788, 452], ...arc(800, 452, 12, 12, 180, 0, 10), [812, PLINTH]];
  pl.hatch([door], 0, 1.3, () => 0.82);
  pl.hatch([door], 60, 1.8, () => 0.6);
  pl.cut(porch, 0.7);
  pl.cut(arc(800, 438, 22, 14, 180, 0, 12), 0.5);
  for (const x of [784, 816]) pl.cut([[x, PLINTH], [x, 440]], 0.4);
  pl.nshape(door, "#FFEDC0");
  pl.night.push("</g>");

  // The plinth: dressed stone, coursed, under its coping.
  const plinth: Pt[] = [[L_X0 - 8, PLINTH], [R_X1 + 8, PLINTH], [R_X1 + 10, GROUND], [L_X0 - 10, GROUND]];
  pl.shape(plinth, "#D8CEBB");
  pl.nshape(plinth, "#16130F");
  pl.night.push(`<path d="M${L_X0 - 10} ${PLINTH}H${R_X1 + 10}" stroke="#C99A5C" stroke-opacity=".5" stroke-width=".8"/>`);
  pl.hatch([plinth], 0, 1.4, (_, y) => 0.26 + 0.18 * smoothstep(PLINTH, GROUND, y), { flick: 0.1 });
  pl.cut([[L_X0 - 10, PLINTH], [R_X1 + 10, PLINTH]], 1.1);
  pl.cut([[L_X0 - 10, GROUND], [R_X1 + 10, GROUND]], 0.7);
  for (let x = L_X0; x < R_X1; x += 22 + rng.uniform(-3, 3)) pl.raw(`M${f(x)} ${PLINTH + 1}v${GROUND - PLINTH - 1}`, 0.3);
  const steps: Pt[] = [[764, GROUND], [836, GROUND], [846, GROUND + 12], [754, GROUND + 12]];
  pl.shape(steps, "#E1D8C6");
  pl.nshape(steps, "#5A4630");
  pl.hatch([steps], 0, 1.6, (_, y) => 0.1 + 0.3 * lit((y - GROUND) % 4 > 2.6));
  for (let k = 1; k < 4; k++) pl.cut([[764 - 3.3 * k, GROUND + 4 * k], [836 + 3.3 * k, GROUND + 4 * k]], 0.5);
  return [pl, iron];
}

// Trees behind the house: a band of crowns, and Lombardy poplars standing up between the roofs.
function backTreesPlate(cover: readonly Pt[][]): Plate {
  const rng = new Random(11);
  const pl = new Plate(11);
  const circles: Circle[] = [];
  for (let x = 360; x < 1250; ) {
    const r = rng.uniform(26, 42);
    circles.push([x, 404 - rng.uniform(0, 16), r]);
    x += r * rng.uniform(0.9, 1.3);
  }
  const band: Pt[] = [...crownEdge(circles, 330, 1280, 470), [1280, 474], [330, 474]];
  pl.shape(band, "#93AE8B");
  pl.cover = [band];
  pl.nshape(band, DARK.back);
  pl.rim(band.slice(0, -2), 0.26, { w: 0.5, closed: false, up: true });
  const masks = [houseMask(), ...cover.map((c) => mask([c]))];
  const house: Inside = (x, y) => masks.some((m) => m(x, y));
  const seen = lobesTone(circles, 0.3, 0.3);
  const tone: Tone = (x, y) => (house(x, y) ? 0 : seen(x, y));
  pl.hatch([band], 18, 2.1, tone, { flick: 0.1 });
  pl.touches([band], tone, 3.6, 1.6);
  for (const [px, top, w] of [[598, 262, 13], [622, 300, 11], [980, 276, 13], [1006, 304, 11], [372, 330, 12], [1232, 322, 12]]) {
    const left = Array.from({ length: 15 }, (_, k): Pt => {
      const u = k / 14;
      const y = top + (474 - top) * u;
      const half = w * (u < 0.62 ? arch(Math.min(1, u * 1.6), 0.55) : 1 - 0.2 * (u - 0.62));
      return [px - half + rng.uniform(-1.4, 1.4), y];
    });
    const outline = [...left, ...left.toReversed().map(([x, y]): Pt => [2 * px - x + rng.uniform(-1.4, 1.4), y])];
    pl.shape(outline, "#7F9C7A");
    pl.nshape(outline, DARK.back);
    pl.rim(outline, 0.4, { w: 0.55 });
    const light = cylinder(px, w * 1.1, 0.3, 0.4);
    const poplar: Tone = (x, y) => (house(x, y) ? 0 : light(x, y));
    pl.hatch([outline], 78, 1.9, poplar, { flick: 0.1 });
    pl.touches([outline], poplar, 3.2, 1.3, { tilt: 0.4 });
  }
  return pl;
}

// A cedar of Lebanon on the left: its trunk, then flat tiers of foliage, pale on top and dark beneath.
function cedarPlate(): Plate {
  const rng = new Random(21);
  const pl = new Plate(21);
  const trunk = parsePoly(ribbon(resample(catmull([[296, GROUND + 4], [300, 420], [292, 360], [300, 300]], 6), 3), (u) => 18 - 12 * u));
  pl.shape(trunk, "#6A5646");
  pl.nshape(trunk, DARK.mid);
  const limbs = [[296, 432, 200, 452], [296, 432, 410, 448], [294, 396, 214, 412], [296, 394, 392, 408],
    [294, 360, 236, 374], [296, 358, 370, 372], [298, 330, 250, 340], [298, 330, 350, 338]];
  for (const [bx0, by0, bx1, by1] of limbs) {
    const limb = parsePoly(ribbon([[bx0, by0], [(bx0 + bx1) / 2, (by0 + by1) / 2 - 4], [bx1, by1]], (u) => 5 - 3.5 * u));
    pl.shape(limb, "#6A5646");
    pl.nshape(limb, DARK.mid);
    pl.cut(limb, 0.5);
  }
  pl.hatch([trunk], 86, 1.5, cylinder(296, 10, 0.45, 0.5));
  pl.hatch([trunk], 30, 2.2, (x) => (x > 297 ? 0.5 : 0));
  pl.cover = [trunk];
  pl.moonTexture = 0.5;
  const tiers = [[300, 456, 330, 30], [292, 418, 296, 28], [304, 380, 250, 26], [296, 346, 196, 24], [304, 316, 132, 20], [300, 292, 64, 16]];
  for (const [cx, cy, w, h] of tiers) {
    const pts = Array.from({ length: 40 }, (_, j): Pt => {
      const a = (j * TAU) / 40;
      const s = Math.sin(a);
      const ry = h * (s > 0 ? 0.42 : 0.58);
      const bump = s < 0 ? rng.uniform(-0.1, 0.14) : rng.uniform(-0.06, 0.06);
      return [cx + (w / 2) * Math.cos(a) * (1 + rng.uniform(-0.04, 0.04)), cy + s * ry * (1 + bump)];
    });
    pl.shape(pts, "#6F8E6B");
    pl.nshape(pts, DARK.mid);
    pl.rim(pts, 0.62, { w: 0.7 });
    pl.cover.push(pts);
    pl.scallops(pts, 1.7, 0.4, (_, y) => y < cy - 1);
    const [top, bottom] = [cy - h * 0.58, cy + h * 0.42];
    const tone: Tone = (x, y) => {
      const v = smoothstep(top + (bottom - top) * 0.3, bottom, y);
      return clamp(0.08 + 0.72 * v ** 1.3 + 0.1 * smoothstep(cx - w * 0.2, cx + w * 0.5, x));
    };
    const inside = mask([pts]);
    pl.hatch([pts], -5, 1.7, tone, { flick: 0.16 });
    pl.hatch([pts], 38, 2.2, (x, y) => Math.max(0, tone(x, y) - 0.5) * 1.8, { flick: 0 });
    pl.touches([pts], (x, y) => (tone(x, y) < 0.4 ? 0.45 : 0), 3.4, 1.8, { curl: 0.55, mask: inside });
  }
  return pl;
}

// A great beech on the right: lobed masses of foliage cut as touches, its limbs showing between.
function beechPlate(): Plate {
  const rng = new Random(31);
  const pl = new Plate(31);
  const trunk = parsePoly(ribbon(resample(catmull([[1340, GROUND + 4], [1336, 450], [1342, 400]], 6), 3), (u) => 26 - 12 * u));
  pl.shape(trunk, "#6E6050");
  pl.nshape(trunk, DARK.mid);
  for (const [x0, y0, x1, y1] of [[1340, 410, 1288, 350], [1342, 408, 1396, 352], [1340, 404, 1334, 320]]) {
    pl.shape(parsePoly(ribbon([[x0, y0], [(x0 + x1) / 2 + 4, (y0 + y1) / 2], [x1, y1]], (u) => 9 - 6 * u)), "#6E6050");
  }
  pl.hatch([trunk], 88, 1.5, cylinder(1340, 12, 0.4, 0.5));
  const lobes: Circle[] = Array.from({ length: 26 }, () => {
    const a = rng.uniform(0, TAU);
    const d = Math.sqrt(rng.random());
    return [1334 + Math.cos(a) * d * 96, 350 + Math.sin(a) * d * 72, rng.uniform(22, 34)];
  });
  lobes.push([1240, 412, 30], [1428, 410, 30], [1334, 268, 30]);
  const outline = unionOutline(lobes, 1334, 350, 160);
  const holes = [blob(1362, 392, 9, 5, rng)];
  pl.shape(outline, "#8FA868");
  pl.nshape(outline, DARK.mid);
  pl.night.push(
    `<clipPath id="gh-beech-clip"><path d="${poly(outline)}"/></clipPath>` +
      '<ellipse cx="1206" cy="420" rx="120" ry="90" fill="url(#gh-spill)" clip-path="url(#gh-beech-clip)" opacity=".5"/>',
  );
  pl.rim(outline, 0.6, { w: 0.75 });
  for (const [x, y, r] of lobes) {
    const inner = Array.from({ length: 11 }, (_, j): Pt => {
      const a = radians(200 + 9 * j);
      return [x + Math.cos(a) * r, y + Math.sin(a) * r];
    });
    pl.night.push(`<path d="${poly(inner, false)}" fill="none" stroke="${MOON}" stroke-opacity=".14" stroke-width=".5"/>`);
  }
  pl.moonTexture = 0.42;
  pl.cover = [outline, trunk];
  pl.scallops(outline, 2.2, 0.45, (_, y) => y < 420);
  const crown = sphere(1334, 340, 150, 120, 0.1, 0.55);
  const local = lobesTone(lobes, 0.1, 0.3);
  const tone: Tone = (x, y) => clamp(0.62 * crown(x, y) + 0.38 * local(x, y) + 0.16 * smoothstep(360, 440, y));
  pl.touches([outline], tone, 3.3, 1.9, { mask: mask([outline, ...holes]) });
  pl.hatch([outline, ...holes], 28, 2.1, (x, y) => Math.max(0, tone(x, y) - 0.34) * 1.4, { flick: 0.08 });
  pl.hatch([outline, ...holes], -42, 2.4, (x, y) => Math.max(0, tone(x, y) - 0.6) * 2, { flick: 0 });
  for (const h of holes) pl.hatch([h], 88, 1.4, () => 0.55);
  return pl;
}

// ---------------------------------------------------------------------------------------------------------
// The ground: lawn, terrace, a pond with the house in it and Victoria lilies, bedding, urns, a lamp, people.

const POND = [800, 513, 240, 15] as const;
const KERB = 4;
const LAMP: Pt = [1124, 474];

const stadium = (cx: number, cy: number, hx: number, hy: number, n = 14): Pt[] => [
  ...arc(cx + hx - hy, cy, hy, hy, -90, 90, n),
  ...arc(cx - hx + hy, cy, hy, hy, 90, 270, n),
];

// The house turned over in the pond, broken by ripples of bare paper.
type Reflection = { ripples: string[] };

function groundPlane(): (Plate | Reflection)[] {
  const rng = new Random(41);
  const [lawn, water, things] = [new Plate(41), new Plate(42, false), new Plate(43)];
  const [px, py, phx, phy] = POND;
  const kerbOut = stadium(px, py, phx + KERB + 2, phy + KERB);
  const waterPoly = stadium(px, py, phx, phy);
  const terrace: Pt[] = [[L_X0 - 20, GROUND], [R_X1 + 20, GROUND], [R_X1 + 34, py - phy - KERB], [L_X0 - 34, py - phy - KERB]];
  const path: Pt[] = [[774, py + phy + KERB], [826, py + phy + KERB], [920, 640], [680, 640]];
  const beds = [blob(340, 546, 104, 11, rng, 40, 0.02), blob(1262, 546, 104, 11, rng, 40, 0.02)];
  const shadows = [blob(300, 500, 150, 9, rng, 30, 0.1), blob(1336, 500, 120, 8, rng, 30, 0.1)];
  const field: Pt[] = [[-100, GROUND], [1720, GROUND], [1720, 640], [-100, 640]];

  lawn.shape(field, "#B8CB98");
  lawn.shape(terrace, "#E2D8C0");
  lawn.shape(path, "#E2D8C0");
  lawn.shape(kerbOut, "#DDD4C2");
  lawn.nshape(field, "url(#gh-night-lawn)");
  lawn.nshape(terrace, "#191612");
  lawn.nshape(path, "#15130F");
  for (const b of beds) {
    lawn.nshape(b, "#0A0E13");
    lawn.rim(b, 0.16, { w: 0.45 });
  }
  lawn.nshape(kerbOut, "#1F1B16");
  lawn.rim(kerbOut, 0.3, { w: 0.5, light: [0, 1] });
  const shade = mask(shadows);
  const grass: Tone = (x, y) => {
    const v = 0.14 + 0.16 * smoothstep(GROUND, 600, y) + 0.06 * Math.sin(x / 90 + y / 17) * smoothstep(GROUND, 520, y);
    return clamp(v + (shade(x, y) ? 0.42 : 0));
  };
  // Ruled closer near the house and opening out toward the viewer.
  const levels: number[] = [];
  for (let y = GROUND + 1.6; y < 640; y += 1.45 + (y - GROUND) * 0.036) levels.push(y);
  lawn.hatch([field, terrace, path, kerbOut, ...beds], 0, 2, grass, { levels, step: 4, flick: 0.17 });
  lawn.hatch(shadows, 35, 2.2, () => 0.4);
  lawn.stipple([terrace], () => 0.1, 2.6);
  lawn.stipple([path], (_, y) => 0.06 + 0.05 * smoothstep(530, 640, y), 3.2);
  lawn.cut([terrace[3], terrace[2]], 0.4);
  lawn.cut([path[0], path[3]], 0.45);
  lawn.cut([path[1], path[2]], 0.45);

  // Carpet bedding: rings of red, gold, purple and silver, each cut its own way, a spiky dot plant at the heart.
  for (const [[cx, cy], base] of [[[340, 546], beds[0]], [[1262, 546], beds[1]]] as const) {
    const rings = [base, ...[0.8, 0.58, 0.34].map((s) => base.map(([x, y]): Pt => [cx + (x - cx) * s, cy + (y - cy) * s]))];
    ["#C98478", "#D8C27E", "#9C90B6", "#C8CCBA"].forEach((colour, k) => {
      const ring = k + 1 < rings.length ? [rings[k], rings[k + 1]] : [rings[k]];
      lawn.shape(rings[k], colour);
      if (k === 0) lawn.stipple(ring, () => 0.24, 1.7);
      else if (k === 1) lawn.hatch(ring, 0, 1.6, () => 0.3);
      else if (k === 2) {
        lawn.hatch(ring, 60, 1.6, () => 0.36);
        lawn.hatch(ring, -60, 2.2, () => 0.22);
      } else lawn.stipple(ring, () => 0.2, 1.4);
      lawn.cut(closedLoop(rings[k]), k ? 0.32 : 0.55);
    });
    for (let k = 0; k < 13; k++) {
      const a = radians(-160 + k * 11.5 + rng.uniform(-4, 4));
      const ln = rng.uniform(8, 14);
      lawn.cut([[cx, cy - 2], [cx + Math.cos(a) * ln * 0.5, cy - 2 + Math.sin(a) * ln * 0.7], [cx + Math.cos(a) * ln, cy - 2 + Math.sin(a) * ln]], 0.4);
    }
  }

  // The kerb: a pale coping, its near face in shade.
  lawn.hatch([kerbOut, waterPoly], 0, 1.4, (_, y) => 0.1 + 0.3 * smoothstep(py + phy - 2, py + phy + KERB, y), { flick: 0.1 });
  lawn.cut(closedLoop(kerbOut), 0.45);

  // The water: ruled level lines, broken where the light lies on it, over the house turned upside down.
  water.shape(waterPoly, "#9EC4CE");
  water.nshape(waterPoly, "#080C14");
  const wl = Array.from({ length: Math.trunc((2 * phy) / 2.2) }, (_, k) => py - phy + 1.1 + 2.2 * k);
  water.hatch([waterPoly], 0, 2.2, (x, y) => 0.2 + 0.12 * smoothstep(py - phy, py + phy, y) + 0.05 * Math.sin(x / 23), { levels: wl, step: 3.2, flick: 0.26 });
  water.cut(closedLoop(waterPoly), 0.7);
  const ripples = Array.from({ length: 70 }, () => `M${f(rng.uniform(px - phx + 8, px + phx - 30))} ${f(rng.choice(wl) + 1.1)}h${f(rng.uniform(8, 34))}`);

  // Victoria lilies: great round pads with turned-up rims, and one flower open.
  for (const [cx, cy, rx, ry] of [[918, 506, 15, 3.2], [952, 512, 18, 3.8], [990, 507, 13, 3], [1012, 518, 14, 3.4], [936, 521, 12, 2.8], [888, 516, 10, 2.4]]) {
    const outer = arc(cx, cy, rx, ry, 0, 360, 30).slice(0, -1);
    const inner = arc(cx, cy - 0.8, rx * 0.88, ry * 0.72, 0, 360, 30).slice(0, -1);
    things.shape(outer, "#7FA463");
    things.nshape(outer, "#0A110E");
    things.rim(outer, 0.35, { w: 0.45, colour: "#F0C58A", light: [0, 1] });
    things.hatch([inner], 0, 1.2, () => 0.36);
    things.hatch([outer, inner], 0, 1.0, (_, y) => (y < cy ? 0.1 : 0.34));
    things.cut(closedLoop(outer), 0.5);
    things.cut(inner.slice(2, 15), 0.3);
  }
  things.shape(ellipse(968, 509, 5, 3), "#F2DCE2");
  things.nshape(ellipse(968, 509, 5, 3), "#E9DCD8", ' opacity=".8"');
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 8;
    things.raw(`M968 509.5l${f(Math.cos(a) * 5)} ${f(-Math.abs(Math.sin(a)) * 3.4)}`, 0.5);
  }

  // Urns on pedestals at the ends of the pond, spilling with trailing plants.
  for (const ux of [540, 1060]) {
    const parts: [Pt[], Tone][] = [
      [[[ux - 5, 498], [ux + 5, 498], [ux + 5, 484], [ux - 5, 484]], cylinder(ux, 6, 0.2, 0.45)],
      [[[ux - 7, 484], [ux + 7, 484], [ux + 7, 482], [ux - 7, 482]], () => 0.3],
      [[[ux - 2.6, 482], [ux - 3.4, 479], [ux - 9, 474.5], [ux - 10, 471], [ux + 10, 471], [ux + 9, 474.5], [ux + 3.4, 479], [ux + 2.6, 482]], sphere(ux, 474, 10, 6, 0.14, 0.5)],
    ];
    for (const [pts, tone] of parts) {
      things.shape(pts, "#D8CEBB");
      things.nshape(pts, DARK.near);
      things.hatch([pts], pts[0][1] < 484 ? 0 : 90, 1.2, tone);
      things.cut(closedLoop(pts), 0.45);
    }
    const leaves = blob(ux, 467, 11, 5, rng, 18, 0.25);
    things.shape(leaves, "#6E9A5E");
    things.nshape(leaves, DARK.near);
    things.touches([leaves], () => 0.55, 2.2, 1.3);
    for (let k = 0; k < 5; k++) {
      const sx = ux + rng.uniform(-9, 9);
      things.cut([[sx, 471], [sx + rng.uniform(-3, 3), 476], [sx + rng.uniform(-4, 4), 481 + rng.uniform(0, 6)]], 0.35);
    }
  }

  // A lamp on the right of the pond: a fluted post, a lantern, the ladder bar.
  const [lx, ly] = LAMP;
  const lampParts: [Pt[], number, number][] = [
    [[[lx - 1.6, 546], [lx - 1.2, 482], [lx + 1.2, 482], [lx + 1.6, 546]], 0.7, 0.9],
    [[[lx - 5, 548], [lx + 5, 548], [lx + 3, 538], [lx - 3, 538]], 0.7, 1],
    [[[lx - 8, ly - 6], [lx + 8, ly - 6], [lx, ly - 13]], 0.6, 1],
  ];
  for (const [pts, t, gap] of lampParts) {
    things.shape(pts, "#3E4A48");
    things.nshape(pts, DARK.near);
    things.hatch([pts], gap < 1 ? 90 : 0, gap, () => t);
    things.cut(closedLoop(pts), 0.4);
  }
  const lamp: Pt[] = [[lx - 5, ly + 6], [lx + 5, ly + 6], [lx + 6.5, ly - 6], [lx - 6.5, ly - 6]];
  things.shape(lamp, "#F2E2B0");
  things.nshape(lamp, "#FFE6AA");
  things.cut(closedLoop(lamp), 0.6);
  things.raw(`M${lx} ${ly + 6}v-12`, 0.3);
  things.raw(`M${lx} ${ly - 13}v-6`, 0.5);
  things.raw(`M${lx - 7} ${ly + 14}h14`, 0.6);

  // People, for scale: a couple strolling on the terrace, a gardener with his barrow on the lawn.
  const figure = (parts: [Pt[], string, number, number][]) => {
    for (const [pts, c, t, ang] of parts) {
      things.shape(pts, c);
      things.nshape(pts, DARK.near);
      things.hatch([pts], ang, 1.05, () => t);
      things.cut(closedLoop(pts), 0.3);
    }
  };
  const head = (x: number, y: number, rx: number, ry: number) => arc(x, y, rx, ry, 0, 360, 12).slice(0, -1);
  const lady: Pt[] = [[486, 496], [474, 496], [476, 490], [478, 484], [480, 481], [483, 480], [484, 484], [488, 488], [492, 492], [492, 496]];
  const bodice: Pt[] = [[479.6, 481], [480, 476.5], [482.6, 476.5], [483.2, 481]];
  figure([[lady, "#B9A4C9", 0.26, 80], [bodice, "#7E6A92", 0.55, 80], [head(481.4, 474.4, 1.7, 2), "#F1E1CE", 0.14, 0],
    [arc(486, 468, 8, 4.2, 180, 0, 14), "#F2E6D8", 0.16, 0]]);
  things.raw("M486 463.8V478", 0.3);
  figure([[[[495.6, 486], [496.2, 496], [497.4, 496], [497.6, 488], [498, 496], [499.2, 496], [499.4, 486]], "#3E3A40", 0.7, 90],
    [[[495, 486], [494.6, 477], [496, 475.4], [499, 475.4], [500.4, 477], [500.6, 487], [498.4, 485]], "#3E3A40", 0.78, 70],
    [head(497.6, 473.4, 1.6, 1.9), "#F1E1CE", 0.14, 0],
    [[[495.6, 471.8], [499.6, 471.8], [499.4, 466.6], [495.8, 466.6]], "#2A2628", 0.86, 0]]);
  things.raw("M494.6 471.8h6", 0.5);
  things.raw("M501 480l3 16", 0.3);

  const [gx, gy] = [1206, 528];
  figure([[[[gx, gy], [gx + 1.4, gy], [gx + 2.6, gy - 9], [gx + 6, gy - 15], [gx + 9, gy - 16], [gx + 10, gy - 13], [gx + 6, gy - 11], [gx + 4, gy - 8], [gx + 3.4, gy]], "#5E6A58", 0.62, 70],
    [head(gx + 10.4, gy - 18, 1.8, 1.9), "#F1E1CE", 0.14, 0],
    [[[gx + 15, gy - 12], [gx + 30, gy - 12], [gx + 27, gy - 5], [gx + 17, gy - 5]], "#8E6E58", 0.4, 0]]);
  things.raw(`M${gx + 7.6} ${gy - 19.4}h6`, 0.6);
  things.raw(`M${gx + 8} ${gy - 14}l9 4`, 0.4);
  things.raw(ellipse(gx + 28, gy - 3.4, 3.4, 3.4), 0.45);
  things.raw(`M${gx + 17} ${gy - 5}l-1 5`, 0.4);
  things.touches([blob(gx + 22, gy - 13.5, 7, 2.5, rng, 14, 0.2)], () => 0.6, 1.8, 1.0);
  return [lawn, water, { ripples }, things];
}

// ---------------------------------------------------------------------------------------------------------
// The foreground: botanical specimens at the edges, cut as for a botanical plate, each growing on scroll.

function treeFern(pl: Plate, x: number, base: number, top: number, rng: Random): void {
  const trunk = parsePoly(ribbon(resample(catmull([[x, base], [x + 4, (base + top) / 2], [x + 2, top]], 8), 4), (u) => 24 - 6 * u));
  pl.shape(trunk, "#6E5A48");
  pl.hatch([trunk], 87, 1.6, cylinder(x + 3, 12, 0.4, 0.5));
  pl.touches([trunk], () => 0.55, 3.2, 1.8, { curl: 1.4 });
  // Dead fronds hang down the top of the trunk.
  for (let k = 0; k < 9; k++) {
    const sx = x - 12 + k * 3 + rng.uniform(-1, 1);
    pl.cut([[sx, top + 4], [sx - 2 + rng.uniform(-2, 2), top + 18 + rng.uniform(0, 10)], [sx - 4 + rng.uniform(-3, 3), top + 30 + rng.uniform(0, 16)]], 0.5);
  }
  for (let k = 0; k < 11; k++) {
    const ang = radians(-176 + k * 17 + rng.uniform(-5, 5));
    const ln = rng.uniform(96, 136) * (4 <= k && k <= 6 ? 0.75 : 1);
    const tip: Pt = [x + 2 + Math.cos(ang) * ln, top + Math.sin(ang) * ln * 0.62 + ln * 0.46];
    const mid: Pt = [x + 2 + Math.cos(ang) * ln * 0.5, top + Math.sin(ang) * ln * 0.6 - ln * 0.06];
    const rib = resample(catmull([[x + 2, top], mid, tip], 10), 3.4);
    pl.shape(ribbon(rib, (u) => 2 + 26 * arch(Math.min(1, u * 1.1), 0.8) * (1 - 0.5 * u)), "#6E9A5E");
    pl.cut(rib, 0.8);
    // The pinnae on the side away from the light are cut finer.
    const lit = Math.cos(ang) < 0;
    for (let i = 2; i < rib.length - 1; i++) {
      const [[ax, ay], [bx, by]] = [rib[i - 1], rib[i]];
      const l = hypot(bx - ax, by - ay) || 1;
      const [tx, ty] = [(bx - ax) / l, (by - ay) / l];
      const u = i / rib.length;
      const pinna = 14 * arch(Math.min(1, u * 1.1), 0.8) * (1 - 0.5 * u) + 1.4;
      for (const side of [-1, 1]) {
        const [nx, ny] = [-ty * side, tx * side];
        const [ex, ey] = [bx + (nx * 0.86 + tx * 0.5) * pinna, by + (ny * 0.86 + ty * 0.5) * pinna + 1.6];
        const w = (lit && side < 0) || (!lit && side > 0) ? 0.32 : 0.55;
        pl.raw(`M${f(bx)} ${f(by)}q${f((ex - bx) * 0.5 + nx)} ${f((ey - by) * 0.5 + ny)} ${f(ex - bx)} ${f(ey - by)}`, w);
      }
    }
  }
}

function banana(pl: Plate, x: number, base: number, rng: Random): void {
  const stemTop = base - 132;
  const stem = parsePoly(ribbon([[x, base], [x - 2, base - 66], [x + 1, stemTop]], (u) => 20 - 6 * u));
  pl.shape(stem, "#7E9A62");
  pl.hatch([stem], 92, 1.5, cylinder(x, 10, 0.3, 0.5));
  for (let k = 0; k < 4; k++) pl.cut([[x - 9 + k * 2, base - 20 - k * 22], [x + 2, base - 34 - k * 22], [x + 8, base - 44 - k * 22]], 0.4);
  for (const [ang, ln, w] of [[-160, 150, 46], [-128, 138, 42], [-62, 146, 44], [-28, 128, 40], [-94, 104, 34]]) {
    const a = radians(ang + rng.uniform(-4, 4));
    const rib = resample(catmull([[x, stemTop + 4], [x + Math.cos(a) * 24, stemTop + Math.sin(a) * 30],
      [x + Math.cos(a) * ln * 0.55, stemTop + Math.sin(a) * ln * 0.5 - 6],
      [x + Math.cos(a) * ln, stemTop + Math.sin(a) * ln * 0.55 + ln * 0.36]], 10), 2.6);
    const start = Math.trunc(rib.length * 0.14);
    // Where the wind has torn the blade.
    const tears = new Set(Array.from({ length: 5 }, () => rng.randrange(start + 4, rib.length - 6)));
    const [left, right]: Pt[][] = [[], []];
    for (let i = start; i < rib.length; i++) {
      const [[ax, ay], [bx, by]] = [rib[Math.max(0, i - 1)], rib[Math.min(rib.length - 1, i + 1)]];
      const l = hypot(bx - ax, by - ay) || 1;
      const [tx, ty] = [(bx - ax) / l, (by - ay) / l];
      const [nx, ny] = [-ty, tx];
      const u = (i - start) / (rib.length - start - 1);
      const half = (w / 2) * arch(clamp(u * 1.05), 0.55);
      const [px, py] = rib[i];
      const lh = half * (tears.has(i) ? 0.5 : 1);
      const rh = half * (tears.has(i + 3) ? 0.55 : 1);
      left.push([px + nx * lh, py + ny * lh]);
      right.push([px - nx * rh, py - ny * rh]);
      if (u > 0.03) {
        // Parallel veins sweep from the midrib to the margin; the half turned down is in shade.
        for (const [side, h] of [[1, lh], [-1, rh]]) {
          const shade = ny * side > 0;
          if (!shade && rng.random() < 0.35) continue;
          const [ex, ey] = [side * nx * h * 0.97 + tx * h * 0.35, side * ny * h * 0.97 + ty * h * 0.35];
          pl.raw(`M${f(px)} ${f(py)}l${f(ex)} ${f(ey)}`, shade ? 0.5 : 0.24);
        }
      }
      if (tears.has(i)) pl.raw(`M${f(px + nx * half)} ${f(py + ny * half)}l${f(-nx * half * 0.7)} ${f(-ny * half * 0.7)}`, 0.45);
    }
    pl.shape([...left, ...right.toReversed()], "#83AB6A");
    pl.cut(left, 0.45);
    pl.cut(right, 0.45);
    pl.cut(rib.slice(0, start + 2), 1.0);
    pl.cut(rib.slice(start), 0.8);
  }
}

function strelitzia(pl: Plate, x: number, base: number, rng: Random): void {
  for (const [ang, stalk, ln, w] of [[-118, 70, 46, 16], [-100, 96, 52, 17], [-80, 84, 48, 16], [-62, 64, 42, 14], [-136, 52, 38, 13]]) {
    const a = radians(ang + rng.uniform(-3, 3));
    const [tx, ty] = [Math.cos(a), Math.sin(a)];
    const [nx, ny] = [-ty, tx];
    const [sx, sy] = [x + tx * stalk, base + ty * stalk];
    pl.cut([[x, base], [x + tx * stalk * 0.5, base + ty * stalk * 0.5], [sx, sy]], 0.7);
    const rib = resample([[sx, sy], [sx + tx * ln, sy + ty * ln]], 2.4);
    const [left, right]: Pt[][] = [[], []];
    rib.forEach(([px, py], i) => {
      const half = (w / 2) * arch(i / (rib.length - 1), 0.7);
      left.push([px + nx * half, py + ny * half]);
      right.push([px - nx * half, py - ny * half]);
      if (0 < i && i < rib.length - 1) {
        pl.raw(`M${f(px)} ${f(py)}l${f(nx * half * 0.95 + tx * half * 0.6)} ${f(ny * half * 0.95 + ty * half * 0.6)}`, 0.5);
        if (i % 2) pl.raw(`M${f(px)} ${f(py)}l${f(-nx * half * 0.95 + tx * half * 0.6)} ${f(-ny * half * 0.95 + ty * half * 0.6)}`, 0.26);
      }
    });
    const blade = [...left, ...right.toReversed()];
    pl.shape(blade, "#6F9A66");
    pl.cut(closedLoop(blade), 0.45);
    pl.cut(rib, 0.6);
  }
  for (const [fx, fy, s] of [[x + 18, base - 108, 1.0], [x - 22, base - 86, 0.86]]) {
    pl.cut([[x + (fx - x) * 0.2, base], [fx - 4 * s, fy + 30 * s], [fx - 6 * s, fy + 4 * s]], 0.8);
    const spathe: Pt[] = [[fx - 6 * s, fy + 4 * s], [fx + 26 * s, fy - 2 * s], [fx + 28 * s, fy], [fx - 4 * s, fy + 8 * s]];
    pl.shape(spathe, "#6E7F6A");
    pl.hatch([spathe], 6, 1.2, () => 0.45);
    pl.cut(closedLoop(spathe), 0.5);
    [[8, -22], [14, -24], [19, -20]].forEach(([dx, dy], k) => {
      const petal: Pt[] = [[fx + 2 * s + k * 2 * s, fy + 1 * s], [fx + dx * s - 3 * s, fy + dy * s], [fx + dx * s, fy + dy * s - 2 * s],
        [fx + dx * s + 2 * s, fy + dy * s + 3 * s], [fx + 6 * s + k * 2 * s, fy]];
      pl.shape(petal, "#E99A3C");
      pl.hatch([petal], 70, 1.3, () => 0.18, { flick: 0.3 });
      pl.cut(closedLoop(petal), 0.45);
    });
    const tongue: Pt[] = [[fx + 4 * s, fy - 1 * s], [fx + 12 * s, fy - 14 * s], [fx + 13 * s, fy - 12 * s], [fx + 7 * s, fy]];
    pl.shape(tongue, "#5A6EC0");
    pl.hatch([tongue], 60, 1, () => 0.5);
    pl.cut(closedLoop(tongue), 0.4);
  }
}

function foxglove(pl: Plate, x: number, base: number, h: number, rng: Random, colour: string): void {
  const stem = resample(catmull([[x, base], [x + 3, base - h * 0.5], [x + rng.uniform(-5, 5), base - h]], 8), 3);
  pl.cut(stem, 0.9);
  for (let k = 0; k < 5; k++) {
    const side = k % 2 ? -1 : 1;
    const ln = rng.uniform(28, 40);
    const a = radians(-90 + side * rng.uniform(40, 70));
    const y0 = base - 4 - k * 5;
    const l = hypot(Math.cos(a), Math.sin(a) * 0.7);
    const [tx, ty] = [Math.cos(a) / l, (Math.sin(a) * 0.7) / l];
    const [nx, ny] = [-ty, tx];
    const rib = resample([[x, y0], [x + tx * ln, y0 + ty * ln]], 2.6);
    const [left, right]: Pt[][] = [[], []];
    rib.forEach(([px, py], i) => {
      const half = 6 * arch(i / (rib.length - 1), 0.8);
      left.push([px + nx * half, py + ny * half]);
      right.push([px - nx * half, py - ny * half]);
      if (0 < i && i < rib.length - 1 && i % 2) {
        pl.raw(`M${f(px)} ${f(py)}l${f(nx * half * 0.9 + tx * 2)} ${f(ny * half * 0.9 + ty * 2)}`, 0.3);
        pl.raw(`M${f(px)} ${f(py)}l${f(-nx * half * 0.9 + tx * 2)} ${f(-ny * half * 0.9 + ty * 2)}`, 0.45);
      }
    });
    const blade = [...left, ...right.toReversed()];
    pl.shape(blade, "#76A062");
    pl.cut(closedLoop(blade), 0.4);
  }
  const n = 13;
  for (let k = 0; k < n; k++) {
    const u = 0.36 + (0.6 * k) / (n - 1);
    const [sx, sy] = stem[Math.min(stem.length - 1, Math.trunc(u * (stem.length - 1)))];
    const s = 1.25 - 0.65 * u;
    const side = k % 3 ? 1 : -1;
    const [bx, by] = [sx + side * 3 * s, sy + 2 * s];
    const bell: Pt[] = [[bx, by], [bx + side * 4 * s, by - 1.6 * s], [bx + side * 11 * s, by + 3 * s], [bx + side * 13 * s, by + 8.6 * s],
      [bx + side * 9 * s, by + 10.4 * s], [bx + side * 3.4 * s, by + 6 * s], [bx - side * 0.4 * s, by + 2.6 * s]];
    pl.shape(bell, colour);
    pl.hatch([bell], 40 * side, 1.3, (xx, yy) => 0.06 + 0.3 * smoothstep(2 * s, 12 * s, (xx - bx) * side + (yy - by)), { flick: 0.2 });
    pl.cut(closedLoop(bell), 0.42);
    for (let j = 0; j < 3; j++) pl.raw(`M${f(bx + side * (7 + j * 1.6) * s)} ${f(by + (6 + j * 1.2) * s)}h.1`, 0.64);
  }
}

// A specimen: its plate, where it grows from, when on the scroll, and its label (pointer from, to, anchor, name).
type Specimen = { name: string; ox: number; oy: number; on: number; pl: Plate; label?: readonly [number, number, number, number, string, string] };

// Each specimen is its own plate, so it can grow on its own, and is labelled as in a botanical plate.
function plants(): Specimen[] {
  const specimens: Specimen[] = [];
  const specimen = (name: string, ox: number, oy: number, on: number, draw: (pl: Plate) => void, label?: Specimen["label"]) => {
    const pl = new Plate(specimens.length + 60);
    draw(pl);
    specimens.push({ name, ox, oy, on, pl, label });
  };
  specimen("fern", 104, 600, 4, (pl) => treeFern(pl, 104, 610, 452, new Random(1)), [114, 532, 128, 548, "start", "Dicksonia antarctica"]);
  specimen("musa", 252, 600, 16, (pl) => banana(pl, 252, 612, new Random(2)), [260, 520, 272, 536, "start", "Musa basjoo"]);
  specimen("strelitzia", 1338, 600, 26, (pl) => strelitzia(pl, 1338, 604, new Random(3)));
  specimen("fox-a", 1446, 600, 12, (pl) => foxglove(pl, 1446, 606, 178, new Random(4), "#C66A92"), [1440, 440, 1428, 428, "end", "Digitalis purpurea"]);
  specimen("fox-b", 1494, 600, 22, (pl) => foxglove(pl, 1494, 610, 138, new Random(5), "#DA8EAE"));
  return specimens;
}

// ---------------------------------------------------------------------------------------------------------
// Assembly.

// A group of marks whose ink is a property, so day and night can each choose it.
const marks = (gid: string, markup: string) => `<g id="${gid}" fill="none" stroke-linecap="round" style="stroke:var(--gh-ink, ${INK})">${markup}</g>`;

// Per plate by day: its forms, knocked out of whatever lies behind, then its cuts and lines; all the forms again,
// hand-tinted over the print. A reflection is the house turned over in the water and broken by ripples of bare
// paper.
//
// By night each plate draws itself (silhouettes, lights, moonlit rims) in the same order, so nearer forms hide
// farther ones as the knock-outs do by day. Where a plate asks for it, the moon picks out its engraving along the
// lit edge of each form: the cuts, in moonlight, seen only through a crescent that is the form less itself moved
// away from the moon.
function planeDefs(name: string, plates: readonly (Plate | Reflection)[]): string {
  const [shapes, day, tint, extras, night, masks]: string[][] = [[], [], [], [], [], []];
  plates.forEach((pl, k) => {
    if (!(pl instanceof Plate)) {
      const ripples = pl.ripples.join("");
      day.push(
        '<g clip-path="url(#gh-pond-clip)"><g transform="matrix(1 0 0 -1 0 968)" opacity=".42">' +
          '<use href="#gh-mid-1-cuts"/><use href="#gh-mid-1-lines"/><use href="#gh-mid-2-lines"/></g>' +
          `<path d="${ripples}" stroke="${PAPER}" stroke-width="1.3" stroke-linecap="round"/></g>`,
      );
      night.push(
        '<g clip-path="url(#gh-pond-clip)"><use href="#gh-house-glow" transform="matrix(1 0 0 -1 0 968)" opacity=".62"/>' +
          '<use href="#gh-mid-2-lines" transform="matrix(1 0 0 -1 0 968)" style="--gh-ink:#140E08" opacity=".5"/>' +
          `<path d="${ripples}" stroke="#080C14" stroke-width="1.5" stroke-linecap="round"/></g>`,
      );
      return;
    }
    const sid = `gh-${name}-${k}`;
    if (pl.shapes.length) {
      shapes.push(`<g id="${sid}-s">${pl.shapes.join("")}</g>`);
      if (pl.knock) day.push(`<use href="#${sid}-s" style="--knock:1"/>`);
      tint.push(`<use href="#${sid}-s"/>`);
    }
    day.push(marks(`${sid}-cuts`, pl.svgCuts()), marks(`${sid}-lines`, pl.svgCuts(pl.lines)));
    extras.push(pl.extraTint);
    night.push(pl.night.join("").replaceAll("{SID}", sid));
    if (pl.moonTexture) {
      masks.push(
        `<mask id="${sid}-moon" maskUnits="userSpaceOnUse" x="-100" y="0" width="1800" height="640">` +
          `<use href="#${sid}-s" style="--knock:1; --paper-k:#fff"/>` +
          `<use href="#${sid}-s" transform="translate(4 7)" style="--knock:1; --paper-k:#000" filter="url(#gh-soften)"/></mask>`,
      );
      night.push(
        `<g mask="url(#${sid}-moon)" opacity="${pl.moonTexture}">` +
          `<use href="#${sid}-cuts" style="--gh-ink:${MOON}"/><use href="#${sid}-lines" style="--gh-ink:${MOON}"/></g>`,
      );
    }
  });
  return (
    shapes.join("") +
    masks.join("") +
    `<g id="gh-${name}-day">${day.join("")}<g class="gh-handtint">${extras.join("")}${tint.join("")}</g></g>` +
    `<g id="gh-${name}-night">${night.join("")}</g>`
  );
}

const plantDefs = (specimens: readonly Specimen[]) =>
  specimens
    .map(({ name, pl }) => `<g id="gh-plant-${name}-s">${pl.shapes.join("")}</g>` + marks(`gh-plant-${name}-cuts`, pl.svgCuts()) + marks(`gh-plant-${name}-lines`, pl.svgCuts(pl.lines)))
    .join("");

function plantMarkup(specimens: readonly Specimen[], mode: "day" | "night"): string {
  return specimens
    .map(({ name, ox, oy, on }) => {
      const inner =
        mode === "day"
          ? `<use href="#gh-plant-${name}-s" style="--knock:1"/><use href="#gh-plant-${name}-cuts"/><use href="#gh-plant-${name}-lines"/>` +
            `<g class="gh-handtint"><use href="#gh-plant-${name}-s"/></g>`
          : // Nearest of all, the specimens are the darkest things in the night, their veins just catching it.
            `<use href="#gh-plant-${name}-s" class="gh-sil"/><use href="#gh-plant-${name}-lines" class="gh-veins"/>`;
      return `<g class="gh-grow" style="transform-origin:${f(ox)}px ${f(oy)}px; --on:${on}%">${inner}</g>`;
    })
    .join("");
}

const labels = (specimens: readonly Specimen[]) =>
  specimens
    .filter(({ label }) => label)
    .map(({ label }) => {
      const [px, py, tx, ty, anchor, text] = label!;
      const ex = anchor === "start" ? tx - 2 : tx + 2;
      return `<path d="M${f(px)} ${f(py)}L${f(ex)} ${f(ty - 3.5)}"/><text x="${f(tx)}" y="${f(ty)}" text-anchor="${anchor}">${text}</text>`;
    })
    .join("");

// Laid paper: fine laid lines close together, chain lines far apart, a little fibre.
function paper(): string {
  const laid = Array.from({ length: 120 }, (_, k) => `<path d='M0 ${2 * k + 0.5}H240' stroke='#000' stroke-opacity='.022' stroke-width='.6'/>`).join("");
  const chains = [30, 150].map((x) => `<path d='M${x} 0V240' stroke='#000' stroke-opacity='.035' stroke-width='1.2'/>`).join("");
  return dataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>" +
      "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='2' seed='3'/>" +
      "<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -.25 .14'/></filter>" +
      `<rect width='240' height='240' filter='url(#n)'/>${laid}${chains}</svg>`,
  );
}

function stars(): string {
  const rng = new Random(33);
  const out: string[] = [];
  const placed: Pt[] = [];
  while (placed.length < 30) {
    const [x, y] = [rng.uniform(10, 1590), rng.uniform(10, 470)];
    if (placed.some(([px, py]) => hypot(x - px, y - py) < 80)) continue;
    placed.push([x, y]);
    out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(rng.choice([0.7, 0.9, 1.1]))}" opacity="${fixed(rng.uniform(0.4, 0.9), 2)}"/>`);
  }
  return out.join("");
}

// The middle plane, back to front, and what in it hides the far trees.
function midPlates(): [Plate[], Inside[]] {
  const [cedar, beech] = [cedarPlate(), beechPlate()];
  const back = backTreesPlate([...cedar.cover, ...beech.cover]);
  const cover = [...[...cedar.cover, ...beech.cover, ...back.cover].map((c) => mask([c])), houseMask()];
  const [house, iron] = housePlate();
  return [[back, house, iron, cedar, beech], cover];
}

export function placeholders(): Record<string, string> {
  const specimens = plants();
  const [mid, cover] = midPlates();
  const [px, py, phx, phy] = POND;
  const [lx, ly] = LAMP;
  return {
    FAR_DEFS: planeDefs("far", farPlane(cover)),
    MID_DEFS: planeDefs("mid", mid),
    GROUND_DEFS: planeDefs("ground", groundPlane()),
    PLANT_DEFS: plantDefs(specimens),
    PLANTS_DAY: plantMarkup(specimens, "day"),
    PLANTS_NIGHT: plantMarkup(specimens, "night"),
    LABELS: labels(specimens),
    POND_CLIP: poly(stadium(px, py, phx - 0.6, phy - 0.6)),
    LAMP_X: f(lx),
    LAMP_Y: f(ly),
    TEX_LAID: paper(),
    STARS: stars(),
  };
}

// Scene picker glyph, 16 x 16: a glasshouse vault with its ribs.
export const GLYPH = '<path d="M2.5 14V8.6C2.5 5.2 5 2.6 8 2.6S13.5 5.2 13.5 8.6V14Z"/><path d="M8 2.6V14M2.5 9.6h11M5.2 3.8V14M10.8 3.8V14"/>';
