// Li River: blue-green landscape on silk, in ink and mineral pigment.
//
// Karst towers are drawn the way a painter builds them: an ochre underlayer that climbs into malachite and then
// azurite, a contour laid in with a pressured brush, lotus-leaf texture strokes that run down from each summit,
// and moss dots along the ridges. Bases dissolve into mist.

import { catmull, ellipse, poly, pressure, resample, ribbon, smooth, type Pt } from "../../lib/geometry.ts";
import { f, fixed, hypot, sum } from "../../lib/number.ts";
import { Random } from "../../lib/random.ts";
import { tile } from "../../lib/svg.ts";

const WATER = 458; // The river's far edge, in drawing units.
const TAU = 2 * Math.PI;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const radians = (degrees: number) => degrees * (Math.PI / 180);
const every = <T>(items: readonly T[], n: number) => items.filter((_, i) => i % n === 0);

type Kind = "tower" | "dome" | "cone";
// A tower as (centre x, base y, width, height, seed[, kind]).
type Spec = readonly [number, number, number, number, number, Kind?];

// p keeps the flanks steep for longer, q rounds the summit.
const KINDS: Record<Kind, readonly [readonly [number, number], readonly [number, number]]> = {
  tower: [[2.6, 3.8], [0.34, 0.46]],
  dome: [[1.8, 2.6], [0.45, 0.6]],
  cone: [[1.35, 1.75], [0.6, 0.72]],
};

// A karst tower. t runs from the base (0) to the summit (1); side is -1 (left) or 1 (right).
class Peak {
  readonly cx: number;
  readonly base: number;
  readonly w: number;
  readonly h: number;
  readonly #p: number;
  readonly #q: number;
  readonly #lean: number;
  // Per side: the outline's wobbles as (phase, frequency, amplitude), and its ledges as (where, how far, how wide).
  readonly #wobble = new Map<number, [number, number, number][]>();
  readonly #ledges = new Map<number, [number, number, number][]>([[-1, []], [1, []]]);
  // Straight facets, for rock that is cut rather than worn; see facet().
  facets?: Pt[];

  constructor([cx, base, w, h, seed, kind]: Spec) {
    const rng = new Random(seed);
    [this.cx, this.base, this.w, this.h] = [cx, base, w, h];
    const [[p0, p1], [q0, q1]] = KINDS[kind ?? rng.choice(["tower", "tower", "dome", "dome", "cone"] as const)];
    this.#p = rng.uniform(p0, p1);
    this.#q = rng.uniform(q0, q1);
    this.#lean = rng.uniform(-0.14, 0.14);
    for (const side of [-1, 1]) {
      this.#wobble.set(side, [0, 1].map(() => [rng.uniform(0, 6.3), rng.uniform(1.5, 4.5), rng.uniform(0.02, 0.07)]));
    }
    // Ledges and shoulders, where the limestone breaks away.
    for (let i = rng.randint(1, 3); i > 0; i--) {
      this.#ledges.get(rng.choice([-1, 1]))!.push([rng.uniform(0.15, 0.75), rng.uniform(0.07, 0.2), rng.uniform(0.04, 0.09)]);
    }
  }

  // The half width at t on one side.
  hw(t0: number, side: number): number {
    const t = Math.min(Math.max(t0, 0), 1);
    const shape = (1 - t ** this.#p) ** this.#q;
    const calm = (1 - t) ** 0.6;
    const wob = sum(this.#wobble.get(side)!.map(([ph, k, a]) => a * Math.sin(t * k * Math.PI + ph))) * calm;
    const ledge = sum(this.#ledges.get(side)!.map(([at, a, s]) => a * Math.exp(-(((t - at) / s) ** 2)))) * calm;
    return (this.w / 2) * shape * (1 + wob + ledge);
  }

  at(t: number, side: number, frac = 1): Pt {
    const center = this.cx + this.#lean * this.h * t * (2 - t);
    return [center + side * this.hw(t, side) * frac, this.base - this.h * t];
  }

  flank(side: number, frac = 1, t0 = 0, t1 = 1, n = 40): Pt[] {
    return Array.from({ length: n }, (_, i) => this.at(lerp(t0, t1, i / (n - 1)), side, frac));
  }

  outline(): Pt[] {
    return [...this.flank(-1), ...this.flank(1).reverse().slice(1)];
  }

  // The tower's silhouette, run down `sink` below its base into the mist.
  body(sink = 46): string {
    if (this.facets) {
      const [[lx, ly], [rx, ry]] = [this.facets[0], this.facets.at(-1)!];
      return poly([...this.facets, [rx, ry + sink], [lx, ly + sink]]);
    }
    const outline = this.outline();
    const pts = [...every(outline, 2), outline.at(-1)!];
    const [[lx, ly], [rx, ry]] = [pts[0], pts.at(-1)!];
    return smooth(pts) + `L${f(rx)} ${f(ry + sink)}L${f(lx)} ${f(ly + sink)}Z`;
  }

  // Breaks the outline into straight facets, the way rock is cut rather than worn.
  facet(n = 7, jitter = 0.05): void {
    const rng = new Random(this.cx * 7 + this.h);
    const pts: Pt[] = [];
    for (const side of [-1, 1]) {
      const flank = Array.from({ length: n + 1 }, (_, i): Pt => {
        const [x, y] = this.at(i / n, side);
        return [x + rng.uniform(-1, 1) * jitter * this.w, y + rng.uniform(-1, 1) * jitter * this.h * 0.5];
      });
      pts.push(...(side === -1 ? flank : flank.reverse().slice(1)));
    }
    this.facets = pts;
  }

  // A band down one flank, between two fractions of its width; blurred afterwards, so a dozen points a side.
  band(side: number, fracOut: number, fracIn: number, t0 = 0, t1 = 0.985): string {
    return poly([...this.flank(side, fracOut, t0, t1, 12), ...this.flank(side, fracIn, t0, t1, 12).reverse()]);
  }
}

// The silhouette in one or two pressured strokes, heavier on the shadowed right flank.
function inkContour(pk: Peak, s: number, rng: Random): string {
  const line = pk.facets ? resample(pk.facets, 3.6) : resample(catmull(every(pk.outline(), 3), 5), 3.6);
  const n = line.length;
  // Begin and end a little above the base, where the mist takes over.
  const a = Math.trunc(n * rng.uniform(0.04, 0.12));
  const b = Math.trunc(n * rng.uniform(0.88, 0.96));
  let cuts = [a, b];
  if (rng.random() < 0.6) {
    const c = Math.trunc(n * rng.uniform(0.25, 0.75));
    cuts = [a, c, c + rng.randint(1, 3), b];
  }
  const out: string[] = [];
  for (let i = 0; i < cuts.length; i += 2) {
    const seg = line.slice(cuts[i], cuts[i + 1]);
    if (seg.length < 3) continue;
    const p = pressure(rng, 0.45, 1.0);
    out.push(ribbon(seg, (u) => {
      const x = seg[Math.min(seg.length - 1, Math.trunc(u * (seg.length - 1)))][0];
      const heavy = 0.7 + (0.6 * ((x - pk.cx) / (pk.w / 2) + 1)) / 2;
      return 2.2 * s * p(u) * heavy;
    }));
  }
  return out.join("");
}

// Lotus-leaf texture strokes: lines that leave the summit and run down the flanks.
function lotusVeins(pk: Peak, s: number, rng: Random, count: number): string {
  const right = Array.from({ length: count }, () => rng.uniform(0.18, 0.86)).sort((x, y) => x - y);
  const left = Array.from({ length: Math.max(1, Math.floor(count / 2)) }, () => rng.uniform(0.45, 0.85)).sort((x, y) => x - y);
  const out: string[] = [];
  for (const [side, fracs] of [[1, right], [-1, left]] as const) {
    for (const frac of fracs) {
      const t1 = rng.uniform(0.8, 0.95);
      const t0 = side === 1 ? rng.uniform(0.1, 0.42) : rng.uniform(0.3, 0.6);
      const seg = resample(catmull(pk.flank(side, frac, t0, t1, 10).reverse(), 5), 4.2);
      const p = pressure(rng, 0.3, 1.0, [0.08, 0.5]);
      const w = (side === 1 ? 1.5 : 1.1) * s;
      out.push(ribbon(seg, (u) => w * p(u)));
    }
  }
  return out.join("");
}

// Short dry strokes between the veins, following the fall of the slope. Returned as centrelines, drawn with a
// round-capped stroke: at this size a taper would not show.
function cunStrokes(pk: Peak, rng: Random, density: number): string {
  const out: string[] = [];
  for (let i = Math.trunc((density * pk.w * pk.h) / 1900); i > 0; i--) {
    const side = rng.random() < 0.75 ? 1 : -1;
    const t = rng.uniform(0.12, 0.8);
    const frac = side === 1 ? rng.uniform(0.4, 0.95) : rng.uniform(0.6, 0.94);
    const length = rng.uniform(0.05, 0.12);
    const [[x0, y0], [x1, y1], [x2, y2]] = pk.flank(side, frac, Math.max(0.02, t - length), t, 3).reverse();
    out.push(`M${f(x0)} ${f(y0)}q${f(x1 - x0 + rng.uniform(-0.6, 0.6))} ${f(y1 - y0)} ${f(x2 - x0)} ${f(y2 - y0)}`);
  }
  return out.join("");
}

// Moss dots: small flattened dabs clustered on the summit and along the ridges.
function moss(pk: Peak, s: number, rng: Random, amount: number): string {
  const out: string[] = [];
  for (let i = Math.trunc(amount * (3 + pk.h / 45)); i > 0; i--) {
    const side = rng.choice([-1, 1]);
    const t = rng.random() < 0.7 ? rng.uniform(0.6, 0.99) : rng.uniform(0.25, 0.6);
    const [x, y] = pk.at(t, side, rng.uniform(0.82, 0.98));
    for (let k = rng.randint(2, 4); k > 0; k--) {
      out.push(`M${f(x + rng.uniform(-4, 4) * s)} ${f(y + rng.uniform(-2.5, 2.5) * s)}h${f(rng.uniform(0.4, 2.2) * s)}`);
    }
  }
  return out.join("");
}

// A small summit tree in ink: a leaning trunk and a crown of dabs.
function tree(x: number, y: number, s: number, rng: Random, kind: string): string {
  const h = rng.uniform(9, 15) * s;
  const lean = rng.uniform(-2, 2) * s;
  const trunk: Pt[] = [[x, y + 2 * s], [x + lean * 0.4, y - h * 0.5], [x + lean, y - h]];
  const out = [ribbon(resample(catmull(trunk, 5), 1.5), (u) => 1.3 * s * (1 - 0.6 * u))];
  if (kind === "pine") {
    for (let k = 0, n = rng.randint(3, 4); k < n; k++) {
      const ty = y - h * (0.35 + 0.22 * k);
      const span = (7 - 1.4 * k) * s;
      out.push(ribbon([[x + lean * 0.5 - span, ty + 0.6 * s], [x + lean * 0.6, ty - 1.4 * s], [x + lean * 0.7 + span, ty + 0.6 * s]],
        (u) => 2.4 * s * Math.sin(Math.PI * u) + 0.3));
    }
  } else {
    for (let k = rng.randint(7, 11); k > 0; k--) {
      const a = rng.uniform(0, TAU);
      const r = rng.uniform(0, 5) * s;
      out.push(ellipse(x + lean + Math.cos(a) * r, y - h + Math.sin(a) * r * 0.7, 1.9 * s, 1.2 * s));
    }
  }
  return out.join("");
}

type Layer = { veins?: number; density?: number; moss?: number; trees?: number; facets?: number };

// One plane of towers. Each tower is painted whole before the next, so nearer ones cover farther ones.
function peakLayer(name: string, specs: readonly Spec[], s: number, opts: Layer = {}): [string, string] {
  const { veins = 4, density = 1.0, moss: mossAmount = 1.0, trees = 0, facets = 0 } = opts;
  const defs: string[] = [];
  const art: string[] = [];
  specs.forEach((spec, i) => {
    const pk = new Peak(spec);
    if (facets) pk.facet(facets);
    const rng = new Random(spec[4] * 31 + 7);
    const pid = `lj-${name}-${i}`;
    defs.push(`<path id="${pid}" d="${pk.body()}"/><clipPath id="${pid}-c"><use href="#${pid}"/></clipPath>`);
    const shade = pk.band(1, 1.02, 0.56) + pk.band(1, 1.02, 0.86, 0.0, 0.7);
    const light = pk.band(-1, 0.95, 0.72, 0.1, 0.9);
    const ink = inkContour(pk, s, rng);
    const texture = veins ? lotusVeins(pk, s, rng, veins) : "";
    const dry = density ? cunStrokes(pk, rng, density) : "";
    const dots = mossAmount ? moss(pk, s, rng, mossAmount) : "";
    let crown = "";
    for (let k = 0; k < (pk.h > 150 ? trees : 0); k++) {
      const t = k === 0 ? rng.uniform(0.9, 0.99) : rng.uniform(0.62, 0.86);
      const [x, y] = pk.at(t, rng.choice([-1, 1]), rng.uniform(0.3, 0.8));
      crown += tree(x, y + 1.5 * s, s, rng, rng.choice(["pine", "leaf"]));
    }
    art.push(
      `<g><use href="#${pid}" style="fill:var(--lj-${name}-fill)"/>` +
        `<g clip-path="url(#${pid}-c)"><g filter="url(#lj-wash)">` +
        `<path d="${shade}" style="fill:var(--lj-${name}-shade)"/>` +
        `<path d="${light}" style="fill:var(--lj-${name}-glow)"/></g>` +
        (texture ? `<path d="${texture}" style="fill:var(--lj-${name}-vein)"/>` : "") +
        (dry ? `<path d="${dry}" fill="none" style="stroke:var(--lj-${name}-vein)" stroke-width="${f(1.05 * s)}" stroke-linecap="round"/>` : "") +
        `</g><path d="${ink}${crown}" style="fill:var(--lj-${name}-ink)"/>` +
        (dots ? `<path d="${dots}" fill="none" style="stroke:var(--lj-${name}-moss)" stroke-width="${f(2.3 * s)}" stroke-linecap="round"/>` : "") +
        "</g>",
    );
  });
  return [defs.join(""), art.join("")];
}

// Plane by plane, back to front. Towers stand in overlapping clusters with open water between them, the tallest
// at the back of each cluster.
const FAR: Spec[] = [[40, 430, 58, 80, 1], [96, 432, 50, 62, 2], [300, 430, 60, 110, 3], [350, 432, 46, 70, 4],
  [500, 430, 64, 128, 5], [548, 432, 50, 84, 6], [466, 433, 44, 60, 7],
  [690, 430, 56, 96, 8], [740, 432, 44, 64, 9], [850, 430, 66, 136, 10], [904, 433, 50, 80, 11],
  [812, 433, 42, 58, 12], [1060, 430, 60, 112, 13], [1112, 432, 48, 72, 14], [1180, 430, 52, 90, 15],
  [1290, 430, 58, 104, 16], [1340, 432, 46, 66, 17], [1420, 430, 52, 82, 18], [1530, 430, 60, 100, 19],
  [1590, 432, 50, 70, 20], [1660, 430, 56, 92, 51]];
const MID: Spec[] = [[48, 454, 88, 200, 21, "tower"],
  [352, 452, 72, 206, 22, "tower"], [296, 454, 84, 150, 23, "dome"], [414, 455, 70, 128, 24, "dome"],
  [462, 456, 50, 88, 25, "cone"],
  [664, 452, 86, 176, 26, "tower"], [606, 454, 66, 112, 27, "dome"], [726, 455, 64, 128, 28, "cone"],
  [782, 456, 52, 84, 29, "dome"],
  [996, 452, 92, 196, 30, "tower"], [936, 455, 62, 104, 31, "cone"], [1060, 454, 70, 140, 32, "dome"],
  [1112, 456, 50, 92, 33, "dome"],
  [1226, 453, 78, 158, 34, "tower"], [1286, 456, 58, 100, 35, "cone"],
  [1452, 452, 86, 214, 36, "tower"], [1560, 454, 70, 150, 37, "dome"]];
const HILLS: Spec[] = [[-70, 470, 130, 236, 41, "tower"], [24, 470, 150, 272, 42, "tower"], [138, 470, 106, 206, 43, "dome"],
  [218, 470, 84, 136, 44, "cone"],
  [1322, 470, 76, 124, 45, "cone"], [1404, 470, 108, 196, 46, "dome"], [1508, 470, 150, 282, 47, "tower"],
  [1626, 470, 130, 232, 48, "tower"]];

function peaks(): Record<string, string> {
  const [farDefs, far] = peakLayer("far", FAR, 0.55, { veins: 0, density: 0, moss: 0.35 });
  const [midDefs, mid] = peakLayer("mid", MID, 0.8, { veins: 3, density: 0.6, moss: 0.8 });
  const [hillDefs, hills] = peakLayer("hill", HILLS, 1.15, { veins: 5, density: 1.0, moss: 1.1, trees: 3 });
  return { PEAK_DEFS: farDefs + midDefs + hillDefs, FAR_PEAKS: far, MID_PEAKS: mid, HILL_PEAKS: hills };
}

// Net-pattern water: rows of fine sine strokes, each row half a wave out of step with the last, so together they
// knot into a mesh. Rows open up and thicken toward the viewer.
function waves(): Record<string, string> {
  const rng = new Random(5);
  const bands: Record<"far" | "mid" | "near", string[]> = { far: [], mid: [], near: [] };
  for (let y = WATER + 3.5, row = 0; y < 612; row++) {
    const t = (y - WATER) / (612 - WATER);
    const lam = 16 + 52 * t ** 1.3; // wavelength
    const amp = 0.7 + 2.3 * t ** 1.2; // height of each crest
    const phase = ((row % 2) * lam) / 2 + rng.uniform(-1.5, 1.5);
    let x = -80 - phase;
    let d = `M${f(x)} ${f(y)}q${f(lam / 4)} ${f(-2 * amp)} ${f(lam / 2)} 0`;
    x += lam / 2;
    // The row wanders a little, as a hand would over a long stroke.
    for (let drift = 0; x < 1700; x += lam / 2) {
      const dy = rng.uniform(-0.25, 0.25) - drift * 0.15;
      drift += dy;
      d += `t${f(lam / 2)} ${f(dy)}`;
    }
    bands[t < 0.3 ? "far" : t < 0.62 ? "mid" : "near"].push(d);
    y += 3.2 + 7.5 * t ** 1.1;
  }
  return { WAVES_FAR: bands.far.join(""), WAVES_MID: bands.mid.join(""), WAVES_NEAR: bands.near.join("") };
}

// A bamboo raft seen from a little above: seven poles bound together, the bow heated and bent upward. Local
// units: the bow tip at x = 0, the stern at x = 262, the waterline at y = 0.
function raft(): Record<string, string> {
  const poles = 7;
  const centre = (x: number) => -3.2 - 25 * Math.max(0, (52 - x) / 52) ** 2.1 + 0.8 * Math.sin(x / 40);
  const spread = (x: number) => 0.35 + 0.65 * Math.min(1, x / 52);
  const pole = (i: number, x: number) => centre(x) - 8.5 + i * 2.15 * spread(x);
  const last = poles - 1;
  const xs = Array.from({ length: 105 }, (_, k) => 0.5 + 2.5 * k);
  const top = xs.map((x): Pt => [x, pole(0, x) - 1.1]);
  const bottom = xs.map((x): Pt => [x, pole(last, x) + 5.2 * spread(x)]);
  // The near pole shows its rounded side; the rest show as lanes across the deck.
  const side = poly([...xs.map((x): Pt => [x, pole(last, x) + 0.6]), ...bottom.toReversed()]);
  const seams = Array.from({ length: last }, (_, i) => poly(xs.slice(1).map((x): Pt => [x, pole(i, x) + 1.05]), false)).join("");
  const rng = new Random(12);
  const nodes: string[] = [];
  for (let i = 0; i < poles; i++) {
    for (let x = rng.uniform(14, 30); x < 258; x += rng.uniform(26, 38)) {
      const h = i < last ? 2.1 * spread(x) : 5.6 * spread(x);
      nodes.push(`M${f(x)} ${f(pole(i, x) + (i < last ? 0.1 : 0.6))}l${f(-0.4)} ${f(h)}`);
    }
  }
  // Rattan bindings across all the poles.
  const ties = [60, 136, 214]
    .map((x) => `M${f(x)} ${f(pole(0, x) - 1)}` + Array.from({ length: poles }, (_, k) => `L${f(x + 0.6 * k)} ${f(pole(k, x) + (k === last ? 5 : 1))}`).join(""))
    .join("");
  return { RAFT_DECK: poly([...top, ...bottom.toReversed()]), RAFT_SIDE: side, RAFT_SEAMS: seams, RAFT_NODES: nodes.join(""), RAFT_TIES: ties };
}

// The fisherman's straw rain cape: a bell from neck to knee, laid in three tiers, each ending in a fringe of
// straw ends.
function strawCape(): Record<string, string> {
  const rng = new Random(3);
  // The bell's outline: narrow at the neck, rounding over the shoulders, flaring to the hem.
  const edge = (y: number, side: number) => {
    const u = Math.min(Math.max((y + 67) / 44, 0), 1);
    return side < 0 ? -5 - 16.5 * u ** 0.62 : 4 + 13.5 * u ** 0.7;
  };
  const fills: string[] = [];
  const strokes: string[] = [];
  for (const [top, hem] of [[-67.5, -51], [-57, -38], [-44, -23.5]]) {
    const pts: Pt[] = [];
    // Upper edge, slightly arched across the back.
    for (let k = 0; k < 7; k++) {
      const u = k / 6;
      pts.push([lerp(edge(top, -1), edge(top, 1), u), top - 1.6 * Math.sin(Math.PI * u)]);
    }
    // Down the back edge.
    for (let k = 1; k < 5; k++) {
      const y = lerp(top, hem, k / 4);
      pts.push([edge(y, 1) + 0.4, y]);
    }
    // The fringe: straw ends of uneven length, right to left.
    const [xBack, xFront] = [edge(hem, 1) + 0.6, edge(hem, -1) - 0.6];
    const m = 15;
    for (let k = 0; k <= m; k++) pts.push([lerp(xBack, xFront, k / m), hem + (k % 2 ? rng.uniform(2.2, 4.6) : rng.uniform(-0.8, 0.4))]);
    // Up the front edge.
    for (let k = 1; k < 4; k++) {
      const y = lerp(hem, top, k / 4);
      pts.push([edge(y, -1) - 0.4, y]);
    }
    fills.push(poly(pts));
    // Straw lines that follow the flare.
    for (let i = 0; i < 18; i++) {
      const u = rng.uniform(0.04, 0.96);
      const [ya, yb] = [top + rng.uniform(1.5, 4), hem + rng.uniform(-2, 2.5)];
      const xa = lerp(edge(ya, -1), edge(ya, 1), u);
      const xb = lerp(edge(yb, -1), edge(yb, 1), u);
      strokes.push(`M${f(xa)} ${f(ya)}Q${f((xa + xb) / 2 + rng.uniform(-0.8, 0.8))} ${f((ya + yb) / 2)} ${f(xb)} ${f(yb)}`);
    }
  }
  return { CAPE_TIERS: fills.join(""), CAPE_STRAW: strokes.join("") };
}

// An old pine on the bank, painted the classical way: a gnarled trunk scaled with open ink rings, antler-like
// limbs, and tiers of needles laid as fans of short strokes over a soft wash.
function pine(): Record<string, string> {
  const rng = new Random(8);
  const trunk = resample(catmull([[70, 508], [64, 478], [78, 448], [74, 422], [96, 398], [136, 380], [186, 372], [228, 374]], 8), 3);
  const p = pressure(rng, 0.9, 1.0, [0.01, 0.04]);
  const barkW = (u: number) => (21 - 12 * u) * p(u);
  const n = trunk.length;
  // A point beside the trunk at i, k half widths out.
  const offset = (i: number, k: number): Pt => {
    const [x, y] = trunk[i];
    const [ax, ay] = trunk[Math.max(0, i - 1)];
    const [bx, by] = trunk[Math.min(n - 1, i + 1)];
    const [tx, ty] = [bx - ax, by - ay];
    const ln = hypot(tx, ty) || 1;
    const w = (barkW(i / (n - 1)) / 2) * k;
    return [x - (ty / ln) * w, y + (tx / ln) * w];
  };
  const edges: string[] = [];
  for (const [side, weight] of [[-1, 1.6], [1, 2.8]]) {
    const line = Array.from({ length: n }, (_, i) => offset(i, side));
    const q = pressure(rng, 0.45, 1.0);
    const cut = rng.randint(Math.floor(n / 3), Math.floor((2 * n) / 3));
    for (const seg of [line.slice(0, cut), line.slice(cut + 2)]) if (seg.length > 2) edges.push(ribbon(seg, (u) => weight * q(u)));
  }
  const scales: string[] = [];
  for (let i = 2; i < n - 3; i += 2) {
    const u = i / (n - 1);
    for (let k = 0; k < 2; k++) {
      const [x, y] = offset(i, rng.uniform(-0.6, 0.6));
      const r = (21 - 12 * u) * rng.uniform(0.11, 0.17);
      const a0 = rng.uniform(0, TAU);
      const arc = Array.from({ length: 10 }, (_, j): Pt => [x + Math.cos(a0 + j * 0.5) * r, y + Math.sin(a0 + j * 0.5) * r * 0.7]);
      scales.push(ribbon(arc, (v) => 0.9 * Math.sin(Math.PI * v) + 0.2));
    }
  }
  // Stout limbs, each ending in a tier of needles: (start, path, tier centre, tier span).
  const limbs = [
    [[78, 448], [[112, 434], [140, 430]], [150, 426], 58],
    [[96, 398], [[90, 372], [100, 352]], [104, 346], 62],
    [[136, 380], [[156, 364], [166, 358]], [172, 354], 46],
    [[186, 372], [[206, 352], [232, 342]], [242, 338], 66],
    [[206, 372], [[250, 378], [298, 382]], [308, 380], 60],
  ] as const;
  const [branches, fans, washes]: string[][] = [[], [], []];
  for (const [start, rest, [tx, ty], span] of limbs) {
    branches.push(ribbon(resample(catmull([start, ...rest], 6), 2.4), (u) => 7 * (1 - 0.55 * u)));
    for (let k = 0; k < 4; k++) {
      washes.push(ellipse(tx + rng.uniform(-span * 0.3, span * 0.3), ty + rng.uniform(-4, 3), span * rng.uniform(0.3, 0.45), rng.uniform(7, 10)));
    }
    [2, -4].forEach((dy, row) => {
      const count = Math.trunc(span / (row === 0 ? 7 : 9));
      for (let k = 0; k < count; k++) {
        const cx = tx - span / 2 + (span * (k + 0.5)) / count + rng.uniform(-3, 3);
        const cy = ty + dy + rng.uniform(-2, 2);
        const r = rng.uniform(8, 11.5);
        const tilt = rng.uniform(-0.2, 0.2);
        for (let j = 0; j < 12; j++) {
          const a = Math.PI * (1.02 + (0.96 * j) / 11) + tilt;
          fans.push(`M${f(cx)} ${f(cy)}l${f(Math.cos(a) * r)} ${f(Math.sin(a) * r * 0.7)}`);
        }
      }
    });
  }
  return {
    PINE_TRUNK: ribbon(trunk, barkW),
    PINE_EDGES: edges.join(""),
    PINE_SCALES: scales.join(""),
    PINE_BRANCHES: branches.join(""),
    PINE_PADS: washes.join(""),
    PINE_NEEDLES: fans.join(""),
  };
}

// Reed clumps: long blades bending downwind, and soft plumes that nod on top.
function reeds(specs: readonly (readonly [number, number, number, number, number])[]): string {
  const rng = new Random(specs.length * 5);
  return specs
    .map(([bx, by, scale, n, seed]) => {
      const r = new Random(seed);
      const [blades, plumes]: string[][] = [[], []];
      for (let i = 0; i < n; i++) {
        const th = radians(-26 + (52 * i) / Math.max(1, n - 1) + r.uniform(-8, 8));
        const ln = scale * r.uniform(40, 76);
        const bend = scale * r.uniform(6, 16);
        const [ex, ey] = [bx + ln * Math.sin(th) + bend, by - ln * Math.cos(th)];
        const line = resample(catmull([[bx + r.uniform(-3, 3), by], [bx + ln * 0.5 * Math.sin(th) + bend * 0.2, by - ln * 0.5 * Math.cos(th)], [ex, ey]], 5), 2.2);
        blades.push(ribbon(line, (u) => 1.7 * scale * (1 - 0.85 * u)));
        if (r.random() < 0.4) {
          const plume = resample(catmull([[ex, ey], [ex + 5 * scale, ey - 7 * scale], [ex + 12 * scale, ey - 6 * scale], [ex + 17 * scale, ey - 1 * scale]], 5), 1.6);
          plumes.push(ribbon(plume, (u) => 4.2 * scale * Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 0.8 + 0.2));
        }
      }
      return (
        `<g class="lj-reed" style="transform-origin:${f(bx)}px ${f(by)}px; --sway-t:${fixed(rng.uniform(2.8, 4.2), 2)}s; --sway-d:${fixed(-rng.uniform(0, 3), 2)}s">` +
        `<path d="${blades.join("")}" style="fill:var(--lj-reed)"/>` +
        `<path d="${plumes.join("")}" style="fill:var(--lj-plume)"/></g>`
      );
    })
    .join("");
}

// Boulders on the near banks: low, cut into facets, and painted like the towers.
const BANKS: Spec[] = [[-40, 640, 250, 190, 61, "dome"], [96, 646, 190, 136, 62, "dome"], [214, 650, 150, 104, 63, "dome"],
  [300, 652, 104, 66, 64, "dome"], [360, 656, 60, 30, 65, "dome"],
  [1680, 640, 250, 170, 66, "dome"], [1560, 646, 180, 126, 67, "dome"], [1460, 652, 140, 88, 68, "dome"],
  [1384, 656, 92, 50, 69, "dome"]];

function banks(): Record<string, string> {
  const [defs, art] = peakLayer("bank", BANKS, 1.25, { veins: 3, density: 0.9, moss: 1.2, facets: 6 });
  return {
    BANK_DEFS: defs,
    BANK_ROCKS: art,
    REEDS: reeds([[1418, 590, 1.0, 9, 1], [1474, 566, 1.15, 11, 2], [1530, 548, 0.9, 8, 3], [1350, 600, 0.7, 6, 4],
      [356, 602, 0.8, 7, 5], [316, 590, 0.7, 6, 6]]),
  };
}

function stars(): string {
  const rng = new Random(77);
  const out: string[] = [];
  const placed: Pt[] = [];
  while (placed.length < 40) {
    const [x, y] = [rng.uniform(10, 1590), rng.uniform(10, 520)];
    if (placed.some(([px, py]) => hypot(x - px, y - py) < 70)) continue;
    placed.push([x, y]);
    const r = rng.choice([0.6, 0.7, 0.8, 0.9, 1.1]);
    const a = rng.uniform(0.3, 0.75);
    out.push(
      `<circle class="lj-tw" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" ` +
        `style="--a:${fixed(a, 2)}; --t:${fixed(rng.uniform(3, 6), 2)}s; --d:${fixed(rng.uniform(0, 4), 2)}s"/>`,
    );
  }
  return out.join("");
}

function pageStars(): string {
  const rng = new Random(31);
  return Array.from({ length: 28 }, () => {
    const [x, y] = [rng.uniform(2, 98), rng.uniform(1, 92)];
    const r = rng.choice([0.8, 1, 1, 1.2]);
    const a = rng.uniform(0.2, 0.6) * (1 - y / 140);
    return `radial-gradient(${r}px ${r}px at ${fixed(x, 1)}% ${fixed(y, 1)}%, rgb(240 232 210 / ${fixed(a, 2)}) 60%, transparent)`;
  }).join(",\n      ");
}

// Silk: fine warp and weft, lighter and darker threads, laid over everything in soft light; and the same silk,
// faint enough to lie under running text on the page above.
const silk = (lite: string, dark: string) =>
  tile(
    "<feTurbulence type='fractalNoise' baseFrequency='1.15 .035' numOctaves='1' seed='3' stitchTiles='stitch' result='v'/>" +
      "<feTurbulence type='fractalNoise' baseFrequency='.035 1.15' numOctaves='1' seed='5' stitchTiles='stitch' result='h'/>" +
      "<feComposite in='v' in2='h' operator='arithmetic' k2='.5' k3='.5' result='w'/>" +
      `<feColorMatrix in='w' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${lite}' result='lite'/>` +
      `<feColorMatrix in='w' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${dark}' result='dark'/>` +
      "<feMerge><feMergeNode in='lite'/><feMergeNode in='dark'/></feMerge>",
    256,
    256,
  );
const TEX_SILK = silk("3.2 0 0 0 -1.35", "-3.2 0 0 0 1.85");
const TEX_SILK_PAGE = silk("1.1 0 0 0 -.47", "-1.1 0 0 0 .64");
// Age: broad, faint tide marks where the silk has darkened unevenly.
const TEX_AGE = tile(
  "<feTurbulence type='fractalNoise' baseFrequency='.006' numOctaves='4' seed='8' stitchTiles='stitch'/>" +
    "<feColorMatrix values='0 0 0 0 .4 0 0 0 0 .3 0 0 0 0 .14 2.2 0 0 0 -.95'/>",
  640,
  640,
);

export function placeholders(): Record<string, string> {
  return {
    ...peaks(),
    ...waves(),
    ...raft(),
    ...strawCape(),
    ...pine(),
    ...banks(),
    STARS: stars(),
    PAGE_STARS: pageStars(),
    TEX_SILK,
    TEX_AGE,
    TEX_SILK_PAGE,
    WATER: String(WATER),
  };
}

// Scene picker glyph, 16 x 16: two karst towers over the river.
export const GLYPH = '<path d="M1.5 12.5C2.6 12.5 2.8 5.5 5 5.5S7 10.5 8 10.5 8.6 3 11 3 13.4 12.5 14.5 12.5"/>' + '<path d="M2.5 14.6h4M9 14.6h4.5"/>';
