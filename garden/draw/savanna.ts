// The savanna: the Kruger lowveld early in December, after the first rains, under a wide sky. The
// trees are just in leaf and flower over last year's straw-pale grass. Nothing hangs from the top:
// what hangs (the baobab's flowers, the sausage tree's fruit, the thorn's pods) hangs from its own
// plant. Drawn with the same kit as the other gardens.

import { TAU, P1, add, sub, mul, norm, rot, polar, lerp, wobble, closed, line, sample, glaze, vars, tone, shape, stalk, quad, grow, part, rad } from "./lib.ts";
import type { Out, Pt, Rng, Tone } from "./lib.ts";
import { limb, angleOf, spineThrough } from "./woody.ts";
import type { Limb } from "./woody.ts";
import { blade, bladeBunch, tendril, along, share, roundPts } from "./mediterranean.ts";

// The share of `res`'s length at its point i, as the gate its growth reaches it at.
const gate = (res: { pts: Pt[] }, g: number[], i: number) => along(g[0], g[1], share(res, i));

// ---------------------------------------------------------------------------
// Baobab: a swollen grey trunk, smooth and folded, flared into buttresses at the foot; heavy
// primary boles dividing into sinuous, gnarled limbs ending stubby; rosettes of new palmate
// leaves at the twig tips, and pendulous white flowers and buds hanging beneath the crown.

// A limb whose bark wash and shading start smoothly without semi-transparent bands crossing
// deep inside its parent trunk.
function bough(out: Out, r: Rng, ctrl: Pt[], { w0, w1, cap = "blunt", pc = "--bark-baobab", inkFrom = 0.16, shadeFrom = 0.14, swell = [] }: { w0: number; w1: number; cap?: "taper" | "blunt"; pc?: string; inkFrom?: number; shadeFrom?: number; swell?: [number, number][] }) {
  const pts = spineThrough(ctrl);
  const n = pts.length - 1;
  const width = (t: number) => (w0 + (w1 - w0) * t ** 0.82) * (1 + swell.reduce((s, [at, k]) => s + k * Math.exp(-(((t - at) / 0.06) ** 2)), 0));
  const L: Pt[] = [];
  const R: Pt[] = [];
  pts.forEach((p, i) => {
    const a = angleOf(pts, i);
    const w = width(i / n) / 2;
    L.push(add(p, polar(w, a - Math.PI / 2)));
    R.push(add(p, polar(w, a + Math.PI / 2)));
  });
  const endA = angleOf(pts, n);
  const capPts = cap === "blunt" ? sample((t) => add(pts[n], polar(width(1) / 2, endA - Math.PI / 2 + t * Math.PI)), 8).slice(1, -1) : [add(pts[n], polar(width(1) * 0.8, endA))];
  const body = [...L, ...capPts, ...[...R].reverse()];
  const v = tone(r, { pc, spread: 0.018, hue: 5 });
  out.push(`<path class="wash bark"${vars(v)} d="${closed(body)}"/>`);
  const s0 = Math.round(shadeFrom * n);
  const m = n - s0;
  const shade = [...pts.slice(s0).map((p, i) => lerp(p, R[s0 + i], 0.2)), ...R.slice(s0).reverse().map((p, i) => lerp(p, pts[n - i], 0.06))];
  out.push(`<path class="wash bark-shade"${vars(v)} d="${closed(shade)}"/>`);
  const lit = [...L.slice(s0).map((p, i) => lerp(p, pts[s0 + i], 0.1)), ...L.slice(s0).reverse().map((p, i) => lerp(p, pts[s0 + m - i], 0.36))];
  out.push(`<path class="wash bark-lit"${vars(v)} d="${closed(lit)}"/>`);
  let tex = "";
  for (let k = 0; k < Math.round(m / 4); k++) {
    const i = s0 + 1 + Math.floor(r() * Math.max(1, m - 4));
    const u0 = 0.2 + r() * 0.4;
    const u1 = Math.min(0.85, u0 + 0.2 + r() * 0.25);
    const w = width(i / n);
    const a = angleOf(pts, i);
    tex += line(sample((u) => add(lerp(L[i], R[i], u0 + (u1 - u0) * u), polar(Math.sin(u * Math.PI) * w * 0.05, a)), 5));
  }
  out.push(`<path class="ink hair bark-tex" d="${tex}"/>`);
  const i0 = Math.round(inkFrom * n);
  out.push(`<path class="ink thin" d="${line(L.slice(i0))}"/>`);
  out.push(`<path class="ink thick" d="${line([...R.slice(i0), ...(cap === "blunt" ? [...capPts].reverse() : capPts)])}"/>`);
  if (cap === "blunt") out.push(`<path class="ink thin" d="${line([L[n], ...capPts])}"/>`);
  return { pts, L, R, width, n };
}

// The trunk, from `base` up to `T`: a swollen bottle flared into root-buttresses at the foot,
// its smooth bark creased in rings that bow round the column.
export function baobabTrunk(out: Out, r: Rng, base: Pt, T: number, W: number) {
  const n = 44;
  const lump = wobble(r, 0.03, [2, 4, 7]);
  const width = (s: number) =>
    W *
    (1 + 0.3 * Math.sin(Math.PI * Math.min(1, s * 1.12)) ** 0.9) *
    (1 - 0.35 * s ** 1.1) *
    (1 + 0.32 * Math.exp(-s / 0.08));
  const pts = sample((s) => add(base, [lump(s) * W * 0.28 - s * 6, -s * T]), n);
  const L = pts.map((p, i) => add(p, [-(width(i / n) / 2) * (1 + lump(i / n + 0.25)), 0]));
  const R = pts.map((p, i) => add(p, [(width(i / n) / 2) * (1 + lump(i / n + 0.65)), 0]));
  const top = sample((u) => add(pts[n], [Math.cos(Math.PI - u * Math.PI) * width(1) * 0.5, -Math.sin(u * Math.PI) * width(1) * 0.12]), 10).slice(1, -1);
  const body = [add(L[0], [-6, 14]), ...L, ...top, ...[...R].reverse(), add(R[0], [6, 14])];
  const v = tone(r, { pc: "--bark-baobab", spread: 0.018, hue: 5 });
  out.push(`<path class="wash bark"${vars(v)} d="${closed(body)}"/>`);
  const m = n - 3;
  out.push(`<path class="wash bark-shade"${vars(v)} d="${closed([...pts.slice(0, m).map((p, i) => lerp(p, R[i], 0.24 + 0.08 * Math.sin((i / m) * Math.PI))), ...R.slice(0, m).reverse()])}"/>`);
  out.push(`<path class="wash bark-lit"${vars(v)} d="${closed([...L.slice(0, m).map((p, i) => lerp(p, pts[i], 0.08)), ...L.slice(0, m).reverse().map((p, i) => lerp(p, pts[m - 1 - i], 0.36))])}"/>`);
  // Horizontal bark creases bowing round the column, and fluted buttress hollows near the ground.
  let folds = "";
  let flutes = "";
  for (let k = 0; k < 18; k++) {
    const i = 3 + Math.floor(r() * (n - 6));
    const a = 0.1 + r() * 0.45;
    const b = Math.min(0.92, a + 0.2 + r() * 0.36);
    const w = width(i / n);
    folds += line(sample((u) => add(lerp(L[i], R[i], a + (b - a) * u), [0, Math.sin((a + (b - a) * u) * Math.PI) * w * 0.055]), 6));
  }
  for (const [u, h, heavy] of [[0.18, 0.28, false], [0.34, 0.38, true], [0.52, 0.3, false], [0.68, 0.4, true], [0.83, 0.26, false]] as const) {
    const d = line(
      sample((t) => {
        const idx = Math.round(t * h * n);
        return add(lerp(L[idx], R[idx], u + (0.5 - u) * t * 0.42), [0, t === 0 ? 10 : 0]);
      }, 7),
    );
    if (heavy) flutes += d;
    else folds += d;
  }
  out.push(`<path class="ink hair bark-tex" d="${folds}"/><path class="ink thin bark-tex" d="${flutes}"/>`);
  out.push(`<path class="ink thin" d="${line([add(L[0], [-6, 14]), ...L])}"/><path class="ink thick" d="${line([add(R[0], [6, 14]), ...R])}"/>`);
  return { pts, L, R, n, top: pts[n], width, v };
}

// Collects the 5-7 leaflets of a palmate baobab leaf for batched rendering, or renders one leaf directly.
function baobabLeafParts(r: Rng, O: Pt, dir: number, S: number, blades: { O: Pt; dir: number; L: number; W: number }[]) {
  const tip = add(O, polar(S * 0.32, dir));
  let stems = `M${P1(O)}Q${P1(add(lerp(O, tip, 0.5), polar(S * 0.025, dir - Math.PI / 2)))} ${P1(tip)}`;
  let ribs = "";
  const count = r() < 0.35 ? 5 : 7;
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1) - 0.5;
    const la = dir + u * rad(146) + (r() - 0.5) * 0.06;
    const L = S * (0.68 - Math.abs(u) * 0.32) * (0.92 + r() * 0.14);
    blades.push({ O: tip, dir: la, L, W: 0.38 });
    ribs += `M${P1(tip)}L${P1(add(tip, polar(L * 0.8, la)))}`;
  }
  return { stems, ribs };
}

export function baobabLeaf(out: Out, r: Rng, O: Pt, dir: number, S: number) {
  const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
  const { stems, ribs } = baobabLeafParts(r, O, dir, S, blades);
  out.push(`<path class="ink thin" d="${stems}"/>`);
  bladeBunch(out, blades, tone(r, { spread: 0.07, hue: 10 }));
  out.push(`<path class="ink hair vein" d="${ribs}"/>`);
}

// A pendulous baobab flower on its long stalk from `top`: a soft velvety calyx collar, five wide
// crinkled satin-white petals reflexed into a lush dome around the receptacle, a hemispherical
// pom-pom of creamy stamens below, and the curved style emerging from the bottom.
export function baobabFlower(out: Out, r: Rng, top: Pt, len: number, s: number, sway: number) {
  const end = add(top, [sway * len * 0.14, len]);
  out.push(`<path class="ink mid" d="M${P1(top)}Q${P1(add(lerp(top, end, 0.52), [sway * len * 0.12, 0]))} ${P1(end)}"/>`);
  // Soft velvety calyx lobes curled back at the apex of the pedicel (no heavy dark ring).
  const cupPts = sample((t) => add(end, [Math.cos(t * TAU) * s * 0.22, Math.sin(t * TAU) * s * 0.11]), 10).slice(0, -1);
  shape(out, r, cupPts, tone(r, { dl: -0.06, dc: 0.6, spread: 0.03 }), { deep: 0, ink: false });

  // Five broad, overlapping crinkled white petals forming a full ruffled skirt around `c`.
  const c = add(end, [0, s * 0.24]);
  for (const [deg, reach, w, dl] of [
    [-156, 0.95, 0.46, -0.03],
    [-24, 0.95, 0.46, -0.03],
    [-122, 1.02, 0.5, -0.01],
    [-58, 1.02, 0.5, -0.01],
    [-90, 0.98, 0.54, 0.01],
  ] as const) {
    const dir = rad(deg);
    const wob = wobble(r, 0.07, [4, 7]);
    const pts = sample((t) => {
      const ang = t * TAU;
      const rr = (0.52 + 0.48 * Math.cos(ang)) ** 0.58;
      const ruffle = 1 + wob(t) * Math.sin(ang * 0.5) ** 2;
      return add(c, add(polar(s * 0.64 * reach * rr * ruffle, dir), polar(s * w * Math.sin(ang) * (0.75 + 0.25 * rr), dir + Math.PI / 2)));
    }, 18).slice(0, -1);
    shape(out, r, pts, tone(r, { pc: "--petal", dl, spread: 0.025 }), { deep: 0.38, deepAbout: c, cls: "wash petal" });
    let veins = "";
    for (const da of [-0.2, 0, 0.2]) {
      veins += `M${P1(add(c, polar(s * 0.1, dir + da)))}Q${P1(add(c, polar(s * 0.34 * reach, dir + da * 1.15)))} ${P1(add(c, polar(s * 0.52 * reach, dir + da * 1.3)))}`;
    }
    out.push(`<path class="ink hair vein" d="${veins}"/>`);
  }

  // Short staminal column and dense hemispherical pom-pom of creamy filaments and golden anthers.
  const ball = add(c, [sway * s * 0.02, s * 0.38]);
  const dome = sample((t) => {
    const a = t * TAU;
    const ry = Math.sin(a) > 0 ? s * 0.32 : s * 0.22;
    return add(ball, [Math.cos(a) * s * 0.38, Math.sin(a) * ry]);
  }, 16).slice(0, -1);
  shape(out, r, dome, tone(r, { pc: "--petal", dl: -0.03, spread: 0.025 }), { deep: 0.45, deepAbout: add(ball, [0, -s * 0.08]), ink: false, cls: "wash petal" });
  let hair = "";
  let dots = "";
  const count = 20;
  for (let k = 0; k < count; k++) {
    const a = (k / count) * TAU;
    const rx = s * (0.35 + (k % 2) * 0.05);
    const ry = (Math.sin(a) > 0 ? 0.31 : 0.2) * s;
    const p = add(ball, [Math.cos(a) * rx, Math.sin(a) * ry]);
    const p0 = add(ball, [Math.cos(a) * s * 0.1, Math.sin(a) * s * 0.06]);
    hair += `M${P1(p0)}L${P1(p)}`;
    dots += closed(roundPts(p, Math.max(1.4, s * 0.042), Math.max(1.1, s * 0.032), a, 6));
  }
  out.push(`<path class="ink hair petal-edge" d="${hair}"/><path class="wash anther"${vars({ pc: "--anther" })} d="${dots}"/>`);
  // Long sinuous style curving out from the bottom of the stamen pom-pom.
  const st0 = add(ball, [0, s * 0.24]);
  const st1 = add(ball, [sway * s * 0.2, s * 0.62]);
  const st2 = add(st1, [sway * s * 0.16, -s * 0.07]);
  out.push(`<path class="ink thin" d="M${P1(st0)}Q${P1(add(ball, [sway * s * 0.04, s * 0.52]))} ${P1(st1)}Q${P1(add(st1, [sway * s * 0.1, s * 0.03]))} ${P1(st2)}"/>`);
  out.push(`<path class="wash petal"${vars({ pc: "--petal" })} d="${closed(roundPts(st2, Math.max(1.6, s * 0.048), Math.max(1.6, s * 0.048), 0, 6))}"/>`);
}

export function baobab(out: Out, r: Rng, base: Pt) {
  const T = 420;
  const gt = [0.02, 0.3];
  const trunk = grow(out, gt[0], gt[1], () => baobabTrunk(out, r, base, T, 265));
  const neck = trunk.top;
  const nw = trunk.width(1);

  // Monumental primary boughs: wide-spreading outer limbs that arch out and turn up, and heavy
  // ascending inner boles that fork into sinuous secondary and stubby tertiary branches.
  const primaries: {
    dx: number;
    dy: number;
    pts: Pt[];
    w0: number;
    w1: number;
    inkFrom: number;
    shadeFrom: number;
    forks: { t: number; pts: Pt[]; w0: number; w1: number; spur?: [number, Pt[]] }[];
  }[] = [
    // Left low spreading bough
    {
      dx: -nw * 0.34,
      dy: 36,
      pts: [[-95, -24], [-198, -46], [-286, -98], [-335, -162]],
      w0: 76,
      w1: 24,
      inkFrom: 0.15,
      shadeFrom: 0.16,
      forks: [
        { t: 0.48, pts: [[-52, -52], [-108, -112], [-134, -172]], w0: 38, w1: 13, spur: [0.55, [[-48, -14], [-86, -42]]] },
        { t: 0.78, pts: [[-48, 8], [-98, -12], [-132, -54]], w0: 26, w1: 11 },
      ],
    },
    // Right low spreading bough
    {
      dx: nw * 0.34,
      dy: 38,
      pts: [[96, -20], [202, -42], [292, -92], [342, -154]],
      w0: 74,
      w1: 24,
      inkFrom: 0.15,
      shadeFrom: 0.16,
      forks: [
        { t: 0.46, pts: [[54, -48], [112, -108], [142, -166]], w0: 36, w1: 13, spur: [0.55, [[46, -12], [84, -38]]] },
        { t: 0.78, pts: [[48, 10], [98, -8], [134, -48]], w0: 25, w1: 11 },
      ],
    },
    // Left-center ascending bole
    {
      dx: -nw * 0.15,
      dy: 28,
      pts: [[-42, -78], [-98, -168], [-156, -242], [-192, -304]],
      w0: 84,
      w1: 26,
      inkFrom: 0.2,
      shadeFrom: 0.22,
      forks: [
        { t: 0.5, pts: [[-56, -34], [-116, -78], [-158, -132]], w0: 40, w1: 14 },
        { t: 0.74, pts: [[24, -48], [52, -98], [64, -146]], w0: 30, w1: 12 },
      ],
    },
    // Right-center ascending bole
    {
      dx: nw * 0.16,
      dy: 30,
      pts: [[44, -74], [102, -160], [162, -234], [198, -294]],
      w0: 82,
      w1: 25,
      inkFrom: 0.2,
      shadeFrom: 0.22,
      forks: [
        { t: 0.52, pts: [[58, -32], [118, -74], [162, -126]], w0: 38, w1: 14 },
        { t: 0.74, pts: [[-22, -46], [-46, -96], [-56, -142]], w0: 28, w1: 12 },
      ],
    },
    // Central high crown bole
    {
      dx: 2,
      dy: 24,
      pts: [[-6, -84], [8, -178], [-4, -264], [-18, -326]],
      w0: 76,
      w1: 22,
      inkFrom: 0.24,
      shadeFrom: 0.26,
      forks: [
        { t: 0.56, pts: [[-44, -42], [-86, -92], [-106, -138]], w0: 34, w1: 12 },
        { t: 0.68, pts: [[44, -38], [88, -86], [112, -132]], w0: 32, w1: 12 },
      ],
    },
  ];

  const rosettes: { p: Pt; dir: number; g: number; count: number }[] = [];
  const flowers: { p: Pt; g: number; len: number; sway: number }[] = [];

  primaries.forEach((b, k) => {
    const from = add(neck, [b.dx, b.dy]);
    const ctrl = [from, ...b.pts.map((d) => add(from, d))];
    const gl = [gt[1] - 0.03 + k * 0.012, gt[1] + 0.18 + k * 0.012];
    const mainBough = grow(out, gl[0], gl[1], () =>
      bough(out, r, ctrl, { w0: b.w0, w1: b.w1, cap: "blunt", inkFrom: b.inkFrom, shadeFrom: b.shadeFrom, swell: [[0.42, 0.08]] }),
    );
    rosettes.push({ p: mainBough.pts[mainBough.n], dir: angleOf(mainBough.pts, mainBough.n), g: gl[1] + 0.02, count: 6 });

    b.forks.forEach((f, j) => {
      const i = Math.round(mainBough.n * f.t);
      const p = mainBough.pts[i];
      const ctrlB = [mainBough.pts[Math.max(0, i - 2)], ...f.pts.map((d) => add(p, d))];
      const gb = [gate(mainBough, gl, i), gate(mainBough, gl, i) + 0.15];
      const sec = grow(out, gb[0], gb[1], () =>
        bough(out, r, ctrlB, { w0: f.w0, w1: f.w1, cap: "blunt", inkFrom: 0.18, shadeFrom: 0.18 }),
      );
      rosettes.push({ p: sec.pts[sec.n], dir: angleOf(sec.pts, sec.n), g: gb[1] + 0.02, count: 5 });

      if (f.spur) {
        const [st, spts] = f.spur;
        const is = Math.round(sec.n * st);
        const ps = sec.pts[is];
        const gc = [gate(sec, gb, is), gate(sec, gb, is) + 0.1];
        const tert = grow(out, gc[0], gc[1], () =>
          bough(out, r, [sec.pts[Math.max(0, is - 1)], ...spts.map((d) => add(ps, d))], { w0: 18, w1: 9, cap: "blunt", inkFrom: 0.2, shadeFrom: 0.2 }),
        );
        rosettes.push({ p: tert.pts[tert.n], dir: angleOf(tert.pts, tert.n), g: gc[1] + 0.02, count: 4 });
      }

      if (j === 0 || (k < 2 && j === 1)) {
        const ih = Math.round(sec.n * 0.62);
        const ph = add(sec.pts[ih], [0, sec.width(0.62) * 0.35]);
        flowers.push({
          p: ph,
          g: Math.max(0.74, gb[1] + 0.08) + k * 0.02 + j * 0.015,
          len: 68 + r() * 56,
          sway: (k + j) % 2 ? 1 : -1,
        });
      }
    });
  });

  // Palmate leaf rosettes at the blunt twig ends: drawn in two depth tones (back leaves darker,
  // front leaves brighter) without any artificial circular backing plate.
  rosettes.forEach(({ p, dir, g, count }) => {
    part(out, g, p, () => {
      const backBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
      const frontBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
      let stems = "";
      let ribs = "";
      for (let k = 0; k < count; k++) {
        const u = k / (count - 1) - 0.5;
        const la = dir + u * rad(140) + (r() - 0.5) * 0.18;
        const S = (44 + (1 - Math.abs(u)) * 12) * (0.9 + r() * 0.2);
        const res = baobabLeafParts(r, p, la, S, k % 2 === 0 ? backBlades : frontBlades);
        stems += res.stems;
        ribs += res.ribs;
      }
      out.push(`<path class="ink thin" d="${stems}"/>`);
      bladeBunch(out, backBlades, tone(r, { dl: -0.05, spread: 0.05, hue: 8 }));
      bladeBunch(out, frontBlades, tone(r, { dl: 0.03, spread: 0.05, hue: 8 }));
      out.push(`<path class="ink hair vein" d="${ribs}"/>`);
    });
  });

  // Pendulous white flowers hanging on long stalks beneath the boughs.
  flowers.forEach(({ p, g, len, sway }) => {
    part(out, g, p, () => baobabFlower(out, r, p, len, 26 + r() * 4, sway));
  });
}

// ---------------------------------------------------------------------------
// Umbrella thorn (Vachellia tortilis): a dark fissured bough reaching in from a side, its limbs
// zigzagging up and fanning out into layered flat-topped canopy tables; fine feathery bipinnate
// leaves, paired stipular spines (one long straight white spine, one short dark hook), clusters
// of cream-white puffball flowers nestled in the foliage, and twisted pods hanging below.

function thornLeafParts(r: Rng, O: Pt, dir: number, L: number, blades: { O: Pt; dir: number; L: number; W: number }[]) {
  const end = add(O, polar(L, dir));
  const rachis = `M${P1(O)}L${P1(end)}`;
  blades.push({ O: end, dir, L: L * 0.32, W: 0.16 });
  for (let k = 1; k <= 5; k++) {
    const u = k / 5.4;
    const p = lerp(O, end, 0.14 + u * 0.82);
    const pinnaL = L * (0.42 - Math.abs(u - 0.45) * 0.22);
    for (const sg of [-1, 1]) blades.push({ O: p, dir: dir + sg * rad(62 + (r() - 0.5) * 10), L: pinnaL, W: 0.17 });
  }
  return rachis;
}

export function thornLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
  const rachis = thornLeafParts(r, O, dir, L, blades);
  out.push(`<path class="ink hair vein" d="${rachis}"/>`);
  bladeBunch(out, blades, tone(r, { spread: 0.07, hue: 10 }));
}

// A globose acacia flower head: a fluffy cream-white pom-pom of tiny stamens with a warm gold heart.
export function puffball(out: Out, r: Rng, c: Pt, R: number) {
  // Scalloped outer puff of stamens so the head reads as soft and botanical at any scale.
  const puff = sample((t) => {
    const a = t * TAU;
    const rr = R * (0.94 + 0.08 * Math.sin(a * 14));
    return add(c, polar(rr, a));
  }, 28).slice(0, -1);
  shape(out, r, puff, tone(r, { pc: "--petal", dl: -0.01, spread: 0.025 }), { deep: 0.35, ink: false, cls: "wash petal" });
  shape(out, r, roundPts(c, R * 0.52, R * 0.52, 0, 10), tone(r, { pc: "--flower-heart", dl: 0.06, spread: 0.03 }), { deep: 0, ink: false, cls: "wash petal" });
  let fuzz = "";
  let dots = "";
  const count = 20;
  for (let k = 0; k < count; k++) {
    const a = (k / count) * TAU + (r() - 0.5) * 0.1;
    const p0 = add(c, polar(R * 0.68, a));
    const p1 = add(c, polar(R * (1.02 + (k % 2) * 0.08), a));
    fuzz += `M${P1(p0)}L${P1(p1)}`;
    if (R > 16 && k % 2 === 0) dots += closed(roundPts(p1, R * 0.04, R * 0.04, 0, 5));
  }
  out.push(`<path class="ink hair petal-edge" d="${fuzz}"/>`);
  if (dots) out.push(`<path class="wash anther"${vars({ pc: "--anther" })} d="${dots}"/>`);
}

// A contorted umbrella-thorn pod (haak-en-steek): a slender, constricted golden-ochre flat legume
// wound into an open 1.35-turn spiral so the coil stays open and legible at both tree and study scale.
export function coiledPod(out: Out, r: Rng, top: Pt, R: number) {
  const stalkEnd = add(top, [0, R * 0.32]);
  out.push(`<path class="ink thin" d="M${P1(top)}Q${P1(add(top, [R * 0.08, R * 0.16]))} ${P1(stalkEnd)}"/>`);
  const c = add(stalkEnd, [0, R * 0.82]);
  const N = 30;
  const spine = sample((t) => {
    const a = -Math.PI * 0.52 + t * Math.PI * 2.75;
    const radAt = R * (0.92 - 0.42 * t);
    return add(c, [Math.cos(a) * radAt, Math.sin(a) * radAt * 0.88 + t * R * 0.28]);
  }, N);
  const A: Pt[] = [];
  const B: Pt[] = [];
  spine.forEach((p, i) => {
    const d = norm(sub(spine[Math.min(N, i + 1)], spine[Math.max(0, i - 1)]));
    const taper = Math.sin(Math.PI * Math.min(1, Math.max(0.08, i / N))) ** 0.38;
    const pinch = 1 + 0.15 * Math.sin((i / N) * Math.PI * 8);
    const w = R * 0.125 * taper * pinch;
    A.push(add(p, mul([-d[1], d[0]], w)));
    B.push(add(p, mul([d[1], -d[0]], w)));
  });
  const outline = [...A, ...[...B].reverse()];
  const v = tone(r, { pc: "--pod", dl: 0.02, dc: 1.15, spread: 0.04, hue: 6 });
  out.push(`<path class="wash fruit"${vars(v)} d="${closed(glaze(outline, r, { k: 1, shift: [0.6, 0.8], amp: 0.01 }))}"/>`);
  out.push(`<path class="ink thin" d="${line(A)}"/><path class="ink mid" d="${line(B)}"/><path class="ink hair vein" d="${line(spine.slice(3, -3))}"/>`);
}

// Dimorphic stipular spines in a pair at node `i` of a limb: one long straight white spine and
// one short recurved dark hook ("haak-en-steek"), anchored at `res.pts[i]` so it unfolds directly
// out of the bark as the shoot passes.
function nodeThorns(out: Out, res: { pts: Pt[]; n: number; width: (t: number) => number }, g: number[], from: number, step: number, r: Rng) {
  for (let i = from; i < res.n - 2; i += step) {
    const p = res.pts[i];
    const a = angleOf(res.pts, i);
    const w = res.width(i / res.n) * 0.44;
    const sg = Math.round(i / step) % 2 ? 1 : -1;
    const baseW = add(p, polar(w, a + (sg * Math.PI) / 2));
    const white = `M${P1(baseW)}L${P1(add(baseW, polar(15 + r() * 6, a + sg * rad(54))))}`;
    const baseH = add(p, polar(w, a - (sg * Math.PI) / 2));
    const hTip = add(baseH, polar(5.5, a - sg * rad(78)));
    const hook = `M${P1(baseH)}Q${P1(add(baseH, polar(4.5, a - sg * rad(45))))} ${P1(hTip)}`;
    part(out, gate(res, g, i) + 0.015, p, () => {
      out.push(`<path class="ink thin spine" d="${white}"/><path class="ink thin hook" d="${hook}"/>`);
    });
  }
}

export function thorn(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0, 0.44];
  const main = grow(out, gm[0], gm[1], () =>
    limb(out, r, [at([-24, 10]), at([105, -42]), at([225, -108]), at([355, -168]), at([495, -226]), at([635, -268]), at([775, -280])], {
      w0: 38,
      w1: 8,
      pc: "--bark-thorn",
      cap: "taper",
      swell: [[0.32, 0.08], [0.62, 0.07]],
    }),
  );

  const forks: { t: number; pts: Pt[]; w0: number; canopyFrom: number; hasFlowers: boolean }[] = [
    { t: 0.22, pts: [[10, -58], [28, -124], [88, -162], [185, -168]], w0: 19, canopyFrom: 0.44, hasFlowers: true },
    { t: 0.38, pts: [[16, -64], [48, -138], [126, -188], [235, -196], [345, -198]], w0: 18, canopyFrom: 0.46, hasFlowers: true },
    { t: 0.56, pts: [[28, -44], [74, -84], [156, -98], [250, -100]], w0: 16, canopyFrom: 0.44, hasFlowers: true },
    { t: 0.64, pts: [[46, 10], [114, 18], [198, 18]], w0: 13, canopyFrom: 0.42, hasFlowers: false },
  ];

  const limbs: { res: Limb; g: number[]; canopyFrom: number; hasFlowers: boolean }[] = [
    { res: main, g: gm, canopyFrom: 0.68, hasFlowers: true },
  ];
  for (const f of forks) {
    const i = Math.round(main.n * f.t);
    const p = main.pts[i];
    const ctrl = [main.pts[Math.max(0, i - 2)], ...f.pts.map((d) => add(p, d))];
    const g = [gate(main, gm, i), gate(main, gm, i) + 0.2];
    const res = grow(out, g[0], g[1], () => limb(out, r, ctrl, { w0: f.w0, w1: 4.5, pc: "--bark-thorn", cap: "taper", inkFrom: 0.14 }));
    limbs.push({ res, g, canopyFrom: f.canopyFrom, hasFlowers: f.hasFlowers });
  }

  limbs.forEach(({ res, g }, idx) => {
    nodeThorns(out, res, g, idx === 0 ? 5 : 8, 5, r);
  });

  // Flat-topped foliage cushions anchored directly to nodes along the upper horizontal stretches
  // of each limb, so every leaf and puffball unfolds out of its branch node and coalesces into
  // the umbrella thorn's layered flat crown.
  limbs.forEach(({ res, g, canopyFrom, hasFlowers }, limbIdx) => {
    const cushions = limbIdx === 2 ? 4 : 3;
    for (let cIdx = 0; cIdx < cushions; cIdx++) {
      const t = canopyFrom + ((0.96 - canopyFrom) * cIdx) / Math.max(1, cushions - 1);
      const i = Math.round(res.n * t);
      const p = res.pts[i];
      const span = 128;
      const thick = 20;
      const gc = Math.max(0.56, gate(res, g, i) + 0.08) + limbIdx * 0.015 + cIdx * 0.012;
      part(out, gc, p, () => {
        const backBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
        const frontBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
        let rachises = "";
        let stepIdx = 0;
        for (let dx = -span * 0.5; dx <= span * 0.5; dx += 18, stepIdx++) {
          const u = (dx + span * 0.5) / span;
          const hScale = Math.sin(u * Math.PI) ** 0.35;
          const px = p[0] + dx + (r() - 0.5) * 5;
          const py = p[1] - 4;
          rachises += thornLeafParts(
            r,
            [px, py - thick * 0.32 * hScale + (r() - 0.5) * 4],
            rad(-90 + (u - 0.5) * 68 + (r() - 0.5) * 56),
            (31 + r() * 13) * (0.76 + 0.24 * hScale),
            stepIdx % 2 ? backBlades : frontBlades,
          );
          if (r() < 0.8) {
            rachises += thornLeafParts(
              r,
              [px + 5, py + thick * 0.16 * hScale + (r() - 0.5) * 4],
              rad((u < 0.5 ? -152 : -28) + (r() - 0.5) * 36),
              27 + r() * 10,
              stepIdx % 2 ? frontBlades : backBlades,
            );
          }
        }
        bladeBunch(out, backBlades, tone(r, { dl: -0.05, spread: 0.05, hue: 8 }));
        bladeBunch(out, frontBlades, tone(r, { dl: 0.03, spread: 0.05, hue: 8 }));
        out.push(`<path class="ink hair vein" d="${rachises}"/>`);

        if (hasFlowers) {
          for (const fdx of [-span * 0.28, span * 0.18]) {
            const fc: Pt = [p[0] + fdx + (r() - 0.5) * 8, p[1] - thick * 0.52 + (r() - 0.5) * 6];
            puffball(out, r, fc, 6.5 + r() * 2);
            if (r() < 0.55) puffball(out, r, add(fc, [10 + r() * 5, 3 + r() * 4]), 5.2 + r() * 1.5);
          }
        }
      });
    }
  });

  // Twisted golden-ochre pods hanging directly from the underside of the boughs.
  const podNodes: [number, number, number][] = [
    [1, 0.62, 15],
    [2, 0.58, 16],
    [3, 0.58, 15.5],
    [4, 0.56, 14.5],
    [0, 0.84, 15],
  ];
  podNodes.forEach(([limbIdx, t, R], k) => {
    const { res } = limbs[limbIdx];
    const i = Math.round(res.n * t);
    const p = add(res.pts[i], [0, res.width(t) * 0.36]);
    part(out, 0.82 + k * 0.02, p, () => coiledPod(out, r, p, R));
  });
}

// ---------------------------------------------------------------------------
// Sausage tree (Kigelia africana): a pale flaky-grey branch reaching in from a side, an open
// rounded crown of glossy odd-pinnate leaf rosettes clustered near the branch ends, and heavy
// grey-brown gourd-like fruits hanging on long, cord-like stalks from the older wood.

function pinnateLeafParts(r: Rng, O: Pt, dir: number, L: number, pairs: number, W: number, blades: { O: Pt; dir: number; L: number; W: number }[]) {
  const bend = Math.cos(dir) * 0.14;
  const end = add(O, polar(L, dir + bend));
  const midCtrl = add(lerp(O, end, 0.5), polar(L * 0.05 * Math.sign(Math.cos(dir) || 1), dir + Math.PI / 2));
  const rachis = quad(O, midCtrl, end);
  let stems = line(sample(rachis, 8));
  let ribs = "";
  const leafletLen = L / (pairs + 1.45);
  for (let k = 1; k <= pairs; k++) {
    const t = 0.18 + (0.78 * k) / (pairs + 0.35);
    const p = rachis(t);
    const tangent = Math.atan2(rachis(Math.min(1, t + 0.04))[1] - rachis(Math.max(0, t - 0.04))[1], rachis(Math.min(1, t + 0.04))[0] - rachis(Math.max(0, t - 0.04))[0]);
    const scale = 0.68 + 0.34 * Math.sin(((k - 0.2) / pairs) * Math.PI * 0.85);
    const lL = leafletLen * scale;
    for (const sg of [-1, 1]) {
      const la = tangent + sg * rad(56 - k * 3) + (r() - 0.5) * 0.08;
      blades.push({ O: p, dir: la, L: lL, W });
      ribs += `M${P1(p)}L${P1(add(p, polar(lL * 0.82, la)))}`;
    }
  }
  const endA = Math.atan2(end[1] - rachis(0.9)[1], end[0] - rachis(0.9)[0]);
  const termL = leafletLen * 1.08;
  blades.push({ O: end, dir: endA, L: termL, W: W * 1.04 });
  ribs += `M${P1(end)}L${P1(add(end, polar(termL * 0.82, endA)))}`;
  return { stems, ribs };
}

// An odd-pinnate leaf: at close-study scale (L >= 160), each leaflet is drawn individually with
// lateral veins and deep glazes; at tree scale, leaflets batch cleanly into bladeBunch.
export function pinnateLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number, pairs: number, W = 0.42, v = tone(r, { spread: 0.07, hue: 10 })) {
  if (L < 160) {
    const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
    const { stems, ribs } = pinnateLeafParts(r, O, dir, L, pairs, W, blades);
    out.push(`<path class="ink thin" d="${stems}"/>`);
    bladeBunch(out, blades, v);
    out.push(`<path class="ink hair vein" d="${ribs}"/>`);
    return;
  }
  const bend = Math.cos(dir) * 0.14;
  const end = add(O, polar(L, dir + bend));
  const midCtrl = add(lerp(O, end, 0.5), polar(L * 0.05 * Math.sign(Math.cos(dir) || 1), dir + Math.PI / 2));
  const rachis = quad(O, midCtrl, end);
  out.push(`<path class="ink thin" d="${line(sample(rachis, 14))}"/>`);
  const leafletLen = L / (pairs + 1.45);
  const prof = (s: number) => Math.sin(Math.PI * Math.min(1, s) ** 0.78) ** 0.72;
  for (let k = 1; k <= pairs; k++) {
    const t = 0.18 + (0.78 * k) / (pairs + 0.35);
    const p = rachis(t);
    const tangent = Math.atan2(rachis(Math.min(1, t + 0.04))[1] - rachis(Math.max(0, t - 0.04))[1], rachis(Math.min(1, t + 0.04))[0] - rachis(Math.max(0, t - 0.04))[0]);
    const scale = 0.68 + 0.34 * Math.sin(((k - 0.2) / pairs) * Math.PI * 0.85);
    for (const sg of [-1, 1]) {
      const la = tangent + sg * rad(56 - k * 3) + (r() - 0.5) * 0.08;
      blade(out, r, p, la, leafletLen * scale, {
        W,
        prof,
        bend: sg * 0.05,
        v: tone(r, { ...v, spread: 0.04, hue: 6 }),
        deep: 0.5,
        veins: 3,
        rib: "ink hair vein",
      });
    }
  }
  const endA = Math.atan2(end[1] - rachis(0.9)[1], end[0] - rachis(0.9)[0]);
  blade(out, r, end, endA, leafletLen * 1.08, {
    W: W * 1.04,
    prof,
    v: tone(r, { ...v, dl: (v.dl ?? 0) + 0.02, spread: 0.04 }),
    deep: 0.5,
    veins: 4,
    rib: "ink hair vein",
  });
}

// A heavy woody sausage fruit (Kigelia africana) hanging from `top` on a long, fibrous cord.
export function sausage(out: Out, r: Rng, top: Pt, stalkLen: number, L: number, W: number, sway: number) {
  const hang = add(top, [sway * stalkLen * 0.1, stalkLen]);
  out.push(`<path class="ink mid" d="M${P1(top)}Q${P1(add(lerp(top, hang, 0.52), [sway * stalkLen * 0.08, 0]))} ${P1(hang)}"/>`);
  const curve = (t: number): Pt => add(hang, [Math.sin(t * 2.1) * sway * L * 0.06, t * L]);
  const half = (t: number) =>
    (W / 2) *
    Math.sin(Math.PI * Math.min(1, Math.max(0, t)) ** 0.78) ** 0.42 *
    (1 - 0.08 * Math.sin(t * Math.PI * 2));
  const N = 24;
  const spine = sample(curve, N);
  const A: Pt[] = [];
  const B: Pt[] = [];
  spine.forEach((p, i) => {
    const d = norm(sub(spine[Math.min(N, i + 1)], spine[Math.max(0, i - 1)]));
    const h = half(i / N);
    A.push(add(p, mul([-d[1], d[0]], h)));
    B.push(add(p, mul([d[1], -d[0]], h)));
  });
  const body = [...A, ...[...B].reverse()];
  shape(out, r, body, tone(r, { pc: "--fruit-kigelia", spread: 0.035, hue: 6 }), { deep: 0.58, deepAbout: add(curve(0.58), [W * 0.14, 0]), cls: "wash fruit" });
  out.push(`<path class="wash shine" d="${closed(sample((t) => add(curve(0.18 + t * 0.55), [-half(0.18 + t * 0.55) * 0.48 + Math.cos(t * TAU) * W * 0.08, Math.sin(t * TAU) * L * 0.18]), 12).slice(0, -1))}"/>`);
  out.push(`<path class="wash bark-shade"${vars({ pc: "--fruit-kigelia" })} d="${closed([add(hang, [-W * 0.16, -2]), add(hang, [W * 0.16, -2]), add(hang, [W * 0.24, 7]), add(hang, [-W * 0.24, 7])])}"/>`);
  let flecks = "";
  const seams = line(sample((t) => add(curve(0.08 + t * 0.84), [half(0.08 + t * 0.84) * 0.18, 0]), 8));
  for (let k = 0; k < 24; k++) {
    const t = 0.08 + r() * 0.84;
    const p = add(curve(t), [(r() - 0.5) * half(t) * 1.4, 0]);
    flecks += `M${P1(p)}l1 .7`;
  }
  out.push(`<path class="ink hair vein" d="${seams}"/><path class="ink dots" d="${flecks}"/>`);
}

export function kigelia(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0, 0.48];
  const main = grow(out, gm[0], gm[1], () =>
    limb(out, r, [at([-24, 8]), at([135, -18]), at([285, -12]), at([435, -48]), at([575, -42])], {
      w0: 44,
      w1: 11,
      pc: "--bark-kigelia",
      cap: "taper",
      lenticels: true,
      swell: [[0.3, 0.08], [0.68, 0.06]],
    }),
  );

  const forkSpecs: [number, Pt[], number][] = [
    [0.28, [[36, -64], [86, -138], [148, -186]], 20],
    [0.54, [[46, -54], [112, -108], [178, -138]], 16],
    [0.68, [[58, 22], [134, 34], [204, 18]], 14],
  ];
  const forks: { res: Limb; g: number[] }[] = [{ res: main, g: gm }];
  for (const [t, ctrl, w0] of forkSpecs) {
    const i = Math.round(main.n * t);
    const g = [gate(main, gm, i), gate(main, gm, i) + 0.22];
    const res = grow(out, g[0], g[1], () =>
      limb(out, r, [main.pts[Math.max(0, i - 2)], ...ctrl.map((p) => add(main.pts[i], p))], { w0, w1: 5.5, pc: "--bark-kigelia", cap: "taper", lenticels: true, inkFrom: 0.14 }),
    );
    forks.push({ res, g });
  }

  // Dense rosettes of odd-pinnate leaves in two depth tones (no artificial circular blobs).
  const rosettes: { res: Limb; g: number[]; t: number; count: number; spread: number }[] = [
    { res: forks[1].res, g: forks[1].g, t: 0.56, count: 6, spread: 160 },
    { res: forks[1].res, g: forks[1].g, t: 1.0, count: 7, spread: 195 },
    { res: forks[2].res, g: forks[2].g, t: 0.58, count: 6, spread: 160 },
    { res: forks[2].res, g: forks[2].g, t: 1.0, count: 7, spread: 195 },
    { res: main, g: gm, t: 0.44, count: 5, spread: 145 },
    { res: main, g: gm, t: 0.8, count: 6, spread: 165 },
    { res: main, g: gm, t: 1.0, count: 7, spread: 195 },
    { res: forks[3].res, g: forks[3].g, t: 0.62, count: 5, spread: 150 },
    { res: forks[3].res, g: forks[3].g, t: 1.0, count: 7, spread: 185 },
  ];

  rosettes.forEach(({ res, g, t, count, spread }) => {
    const i = Math.round(res.n * t);
    const p = res.pts[i];
    const a = angleOf(res.pts, i);
    part(out, gate(res, g, i) + 0.03, p, () => {
      const backBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
      const frontBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
      let stems = "";
      let ribs = "";
      for (let k = 0; k < count; k++) {
        const u = k / (count - 1) - 0.5;
        const la = a - rad(16) + u * rad(spread) + (r() - 0.5) * 0.18;
        const L = (78 + (1 - Math.abs(u)) * 18) * (0.9 + r() * 0.2);
        const leaf = pinnateLeafParts(r, p, la, L, 3, 0.42, k % 2 === 0 ? backBlades : frontBlades);
        stems += leaf.stems;
        ribs += leaf.ribs;
      }
      out.push(`<path class="ink thin" d="${stems}"/>`);
      bladeBunch(out, backBlades, tone(r, { dl: -0.05, spread: 0.05, hue: 8 }));
      bladeBunch(out, frontBlades, tone(r, { dl: 0.03, spread: 0.05, hue: 8 }));
      out.push(`<path class="ink hair vein" d="${ribs}"/>`);
    });
  });

  // Heavy grey-brown sausage fruits hanging on long cord-like stalks.
  for (const [res, t, stalkL, fruitL, fruitW, sway] of [
    [main, 0.36, 95, 138, 30, -1],
    [main, 0.6, 145, 126, 28, 1],
    [forks[3].res, 0.46, 82, 132, 29, -1],
    [forks[3].res, 0.78, 124, 116, 26, 1],
  ] as const) {
    const i = Math.round(res.n * t);
    const p = add(res.pts[i], [0, res.width(t) * 0.32]);
    part(out, 0.78 + t * 0.08, p, () => sausage(out, r, p, stalkL + r() * 24, fruitL, fruitW, sway));
  }
}

// ---------------------------------------------------------------------------
// Marula (Sclerocarya birrea): a pale grey trunk mottled with flaking bark scales, leaning in
// from beyond a bottom corner, dividing into crooked ascending limbs with terminal rosettes of
// drooping odd-pinnate leaves and small round marula drupes.

export function marula(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gt = [0.02, 0.34];
  const trunk = grow(out, gt[0], gt[1], () => {
    const res = limb(out, r, [at([0, 8]), at([22, -135]), at([64, -265]), at([112, -365])], {
      w0: 68,
      w1: 38,
      pc: "--bark-marula",
      cap: "blunt",
      swell: [[0.45, 0.06]],
    });
    let litFlakes = "";
    let darkFlakes = "";
    for (let k = 0; k < 16; k++) {
      const i = 2 + Math.floor(r() * (res.n - 4));
      const patch = closed(roundPts(lerp(res.L[i], res.R[i], 0.18 + r() * 0.64), 6 + r() * 7, 3.5 + r() * 3.5, angleOf(res.pts, i), 8));
      if (k % 2) litFlakes += patch;
      else darkFlakes += patch;
    }
    out.push(`<path class="wash bark-lit"${vars({ pc: "--bark-marula" })} d="${litFlakes}"/><path class="wash bark-shade"${vars({ pc: "--bark-marula" })} d="${darkFlakes}"/><path class="ink hair bark-tex" d="${litFlakes}"/>`);
    return res;
  });

  const top = trunk.pts[trunk.n];
  const tips: { p: Pt; a: number; g: number; count: number; fruits: number }[] = [];
  const branches: [Pt[], number, number][] = [
    [[[-48, -68], [-115, -132], [-172, -168]], 26, 1],
    [[[-18, -82], [-56, -164], [-86, -218]], 24, 0],
    [[[24, -86], [52, -172], [68, -228]], 25, 2],
    [[[68, -64], [142, -124], [198, -158]], 24, 1],
    [[[82, -18], [158, -32], [218, -28]], 20, 2],
  ];

  branches.forEach(([pts, w0, fruits], k) => {
    const from = add(top, [(k - 2) * 5, 16]);
    const ctrl = [from, ...pts.map((d) => add(top, d))];
    const g = [gt[1] - 0.02 + k * 0.015, gt[1] + 0.2 + k * 0.015];
    const res = grow(out, g[0], g[1], () => limb(out, r, ctrl, { w0, w1: 7, pc: "--bark-marula", cap: "blunt", inkFrom: 0.18 }));
    tips.push({ p: res.pts[res.n], a: angleOf(res.pts, res.n), g: g[1] + 0.02, count: 7, fruits });
    const im = Math.round(res.n * 0.58);
    const side = k < 2 ? -1 : 1;
    const spurEnd = add(res.pts[im], polar(68 + r() * 20, angleOf(res.pts, im) + side * rad(42)));
    const gs = [gate(res, g, im), gate(res, g, im) + 0.12];
    const spur = grow(out, gs[0], gs[1], () => limb(out, r, [res.pts[im], lerp(res.pts[im], spurEnd, 0.5), spurEnd], { w0: 12, w1: 6, pc: "--bark-marula", cap: "blunt", inkFrom: 0.2 }));
    tips.push({ p: spur.pts[spur.n], a: angleOf(spur.pts, spur.n), g: gs[1] + 0.02, count: 6, fruits: 0 });
  });

  tips.forEach(({ p, a, g, count, fruits }) => {
    part(out, g, p, () => {
      const backBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
      const frontBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
      let stems = "";
      let ribs = "";
      for (let k = 0; k < count; k++) {
        const u = k / (count - 1) - 0.5;
        const la = a + u * rad(210) + (r() - 0.5) * 0.2;
        const L = 68 + r() * 18;
        const leaf = pinnateLeafParts(r, p, la, L, 5, 0.34, k % 2 === 0 ? backBlades : frontBlades);
        stems += leaf.stems;
        ribs += leaf.ribs;
      }
      out.push(`<path class="ink thin" d="${stems}"/>`);
      bladeBunch(out, backBlades, tone(r, { dl: -0.05, spread: 0.05, hue: 8 }));
      bladeBunch(out, frontBlades, tone(r, { dl: 0.03, spread: 0.05, hue: 8 }));
      out.push(`<path class="ink hair vein" d="${ribs}"/>`);
      for (let f = 0; f < fruits; f++) {
        const fc = add(p, [(f - 0.5) * 18 + (r() - 0.5) * 6, 16 + f * 6]);
        out.push(`<path class="ink thin" d="M${P1(p)}L${P1(fc)}"/>`);
        shape(out, r, roundPts(fc, 7.5, 6.8, 0.2, 10), tone(r, { pc: "--straw", dl: -0.04, dc: 1.5, spread: 0.04 }), { deep: 0.45, cls: "wash fruit" });
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Flame lily (Gloriosa superba): slender stems scrambling up through the grass, glossy spear
// leaves whose tips coil into prehensile tendrils, and nodding flowers whose six wavy, crisped
// tepals reflex sharply upward from the receptacle like flames—crimson-scarlet over a glowing
// chrome-yellow base—with six radiating horizontal stamens and a bent green style beneath.

export function gloriosaFlower(out: Out, r: Rng, c: Pt, s: number, lean: number) {
  const toW = (p: Pt) => add(c, rot(p, lean));
  const tepalSpecs: [number, number, number, number][] = [
    [-0.58, 0.92, -1, -0.04],
    [0.58, 0.92, 1, -0.04],
    [-0.18, 0.96, -1, -0.02],
    [-0.36, 1.04, -1, 0.01],
    [0.36, 1.04, 1, 0.01],
    [0.06, 1.06, 1, 0.02],
  ];

  for (const [spread, lenK, side, dl] of tepalSpecs) {
    const L = s * lenK;
    const phase = r() * TAU;
    const mid = (t: number): Pt => [
      spread * L * (0.28 * Math.sin(t * Math.PI * 0.65) + 0.72 * t ** 1.15) + Math.sin(t * Math.PI * 2.1) * side * L * 0.06,
      -L * (t ** 0.88) + (t < 0.14 ? t * L * 0.12 : 0),
    ];
    const half = (t: number) => {
      const env = Math.sin(Math.PI * Math.min(1, t) ** 0.78) ** 0.72;
      const wave = 1 + 0.28 * Math.sin(t * TAU * 3.8 + phase) * Math.sin(t * Math.PI);
      return L * 0.125 * env * wave;
    };
    const N = 22;
    const spine = sample(mid, N);
    const Lpts: Pt[] = [];
    const Rpts: Pt[] = [];
    spine.forEach((p, i) => {
      const t = i / N;
      const d = norm(sub(spine[Math.min(N, i + 1)], spine[Math.max(0, i - 1)]));
      const nrm: Pt = [-d[1], d[0]];
      const h = half(t);
      const ripple = Math.cos(t * TAU * 3.8 + phase) * L * 0.018 * Math.sin(t * Math.PI);
      Lpts.push(add(p, mul(nrm, h + ripple)));
      Rpts.push(add(p, mul(nrm, -h + ripple)));
    });
    const outline = [...Lpts, add(spine[N], [side * L * 0.02, -L * 0.03]), ...[...Rpts].reverse()].map(toW);

    shape(out, r, outline, tone(r, { pc: "--flower-gloriosa", dl, spread: 0.04, hue: 8 }), {
      deep: 0.48,
      deepAbout: toW(mid(0.62)),
      cls: "wash petal",
    });
    const mBase = Math.round(N * 0.44);
    const basePts = [
      ...Lpts.slice(0, mBase).map((p, i) => lerp(spine[i], p, 0.92)),
      add(spine[mBase], [0, -L * 0.04]),
      ...Rpts.slice(0, mBase).reverse().map((p, i) => lerp(spine[mBase - 1 - i], p, 0.92)),
    ].map(toW);
    out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-gold", dl: 0.02, spread: 0.03 }))} d="${closed(glaze(basePts, r, { shift: [0, 0], amp: 0.04 }))}"/>`);
    out.push(`<path class="ink hair vein" d="${line(spine.slice(1, -2).map(toW))}"/>`);
  }

  const ovaryEnd = toW([0, s * 0.16]);
  shape(out, r, roundPts(toW([0, s * 0.08]), s * 0.055, s * 0.085, lean, 10), tone(r, { pc: "--pistil", dl: -0.1, spread: 0.03 }), { deep: 0 });
  const styleTip = toW([s * 0.42, s * 0.22]);
  let pistilD = `M${P1(ovaryEnd)}Q${P1(toW([s * 0.22, s * 0.18]))} ${P1(styleTip)}`;
  for (const da of [-0.35, 0, 0.35]) pistilD += `M${P1(styleTip)}L${P1(add(styleTip, polar(s * 0.07, lean + da)))}`;
  out.push(`<path class="ink thin" d="${pistilD}"/>`);

  let stamens = "";
  let anthers = "";
  for (const [deg, lenK] of [[168, 0.56], [142, 0.62], [114, 0.54], [66, 0.54], [38, 0.62], [12, 0.56]] as const) {
    const a = rad(deg);
    const end = toW(polar(s * lenK, a));
    const ctrl = toW(add(polar(s * lenK * 0.55, a), [0, s * 0.06]));
    stamens += `M${P1(toW([0, s * 0.03]))}Q${P1(ctrl)} ${P1(end)}`;
    anthers += closed(roundPts(end, s * 0.078, s * 0.026, lean + a + rad(75), 8));
  }
  out.push(`<path class="ink thin" d="${stamens}"/><path class="wash anther"${vars({ pc: "--anther" })} d="${anthers}"/><path class="ink hair" d="${anthers}"/>`);
}

function gloriosaBud(out: Out, r: Rng, c: Pt, s: number, lean: number) {
  const toW = (p: Pt) => add(c, rot(p, lean));
  const pts = sample((t) => {
    const a = t * TAU;
    const y = (0.5 - 0.5 * Math.cos(a)) * s;
    const x = Math.sin(a) * s * 0.26 * Math.sin(Math.PI * (0.5 - 0.5 * Math.cos(a)) ** 0.7);
    return toW([x, y]);
  }, 16).slice(0, -1);
  shape(out, r, pts, tone(r, { pc: "--flower-gold", dl: -0.04, dc: 0.85, spread: 0.04 }), { deep: 0.4, cls: "wash petal" });
  out.push(`<path class="ink hair vein" d="M${P1(c)}Q${P1(toW([s * 0.1, s * 0.5]))} ${P1(toW([0, s]))}"/>`);
}

export function gloriosa(out: Out, r: Rng, base: Pt) {
  for (const [dx, H, lean, gs, flowers] of [
    [-34, 430, -0.16, 0.04, [[0.64, -1, false], [0.88, 1, false]] as const],
    [14, 490, 0.06, 0.1, [[0.58, 1, false], [0.78, -1, false], [0.94, 1, true]] as const],
    [52, 375, 0.26, 0.16, [[0.68, 1, false], [0.9, -1, true]] as const],
  ] as const) {
    const n = 28;
    const sway = wobble(r, 12, [1.4, 2.8]);
    const spine = sample((t) => add(base, [dx + lean * H * t + sway(t) * Math.sin(t * Math.PI), -t * H]), n);
    const g = [gs, gs + 0.42];
    const stem = grow(out, g[0], g[1], () => stalk(out, (t) => spine[Math.round(t * n)], 5.2, 2.6, tone(r, { dl: -0.04, spread: 0.03 }), n));

    for (let i = 4; i <= n - 2; i += 3) {
      const p = spine[i];
      const sg = (i / 3) % 2 ? 1 : -1;
      const bend = sg * 0.18;
      const dir = angleOf(spine, i) + sg * rad(52 + (r() - 0.5) * 14);
      const L = (66 - (i / n) * 18) * (0.9 + r() * 0.2);
      part(out, gate(stem, g, i), p, () => {
        const leaf = blade(out, r, p, dir, L, {
          W: 0.22,
          bend,
          v: tone(r, { spread: 0.06, hue: 8 }),
          deep: 0.5,
          shine: true,
          rib: "ink hair vein",
        });
        out.push(`<path class="ink thin" d="${tendril(leaf.tip, dir + bend * 1.8, 16 + r() * 5)}"/>`);
      });
    }

    for (const [t, sg, isBud] of flowers) {
      const i = Math.round(t * n);
      const p = spine[i];
      const hang = add(p, [sg * (48 + r() * 10), 18 + r() * 8]);
      part(out, Math.max(0.68, gate(stem, g, i) + 0.08), p, () => {
        out.push(`<path class="ink thin" d="M${P1(p)}Q${P1(add(p, [sg * 36, -18]))} ${P1(hang)}"/>`);
        if (isBud) gloriosaBud(out, r, hang, 38, -sg * 0.2);
        else gloriosaFlower(out, r, hang, 64 + r() * 6, sg * 0.22);
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Grasses.
// Red grass (Themeda triandra): a rich fountain tussock of arching blades in straw, copper-flushed
// green, and warm tawny, topped by nodding culms carrying triangular boat-spathe tassels of
// rust-red spikelets and dark geniculate (kinked) awns.
// Fine thatching grass (Hyparrhenia filipendula): a taller, wind-swept fountain of slender culms
// bearing delicate spatheate pairs of golden-buff racemes with fine twisted awns.

function tussockBase(out: Out, r: Rng, base: Pt, count: number, len: number, spread: number, crownW: number, g: number, tones: Tone[]) {
  const order = Array.from({ length: count }, (_, k) => k).sort(() => r() - 0.5);
  const groups: { O: Pt; dir: number; L: number; W: number }[][] = [[], [], []];
  for (const k of order) {
    const u = k / (count - 1);
    const a = rad(-90 + (u - 0.5) * spread + (r() - 0.5) * 14);
    const L = len * (0.58 + Math.sin(u * Math.PI) * 0.42 + (r() - 0.5) * 0.18);
    const droop = Math.cos(a) * 0.58;
    const O = add(base, [(u - 0.5) * crownW + (r() - 0.5) * 8, (r() - 0.5) * 4]);
    const p1 = add(O, polar(L * 0.42, a));
    const p2 = add(p1, polar(L * 0.32, a + droop * 0.46));
    const W = 0.036;
    groups[k % 3].push(
      { O, dir: a, L: L * 0.44, W: W * 1.3 },
      { O: p1, dir: a + droop * 0.46, L: L * 0.34, W: W * 1.1 },
      { O: p2, dir: a + droop * 1.12, L: L * 0.26, W },
    );
  }
  part(out, g, base, () => bladeBunch(out, groups[0], tone(r, { ...tones[0], spread: 0.05 })));
  part(out, g + 0.05, base, () => bladeBunch(out, groups[1], tone(r, { ...tones[1], spread: 0.05 })));
  part(out, g + 0.1, base, () => bladeBunch(out, groups[2], tone(r, { ...tones[2], spread: 0.05 })));
}

function themedaTassel(r: Rng, O: Pt, dir: number, s: number) {
  let spathes = "";
  let spikes = "";
  let awns = "";
  const toW = (p: Pt) => add(O, rot(p, dir));
  const spPts = [
    [0, 0],
    [s * 0.42, -s * 0.14],
    [s * 0.95, -s * 0.06],
    [s * 1.25, 0],
    [s * 0.85, s * 0.08],
    [s * 0.35, s * 0.1],
  ].map(toW);
  spathes += closed(spPts);
  for (const [da, reach, hasAwn] of [[-0.36, 0.95, false], [-0.12, 1.15, true], [0.14, 1.1, true], [0.38, 0.9, false]] as const) {
    const a = dir + da;
    const baseP = add(O, polar(s * 0.28, dir));
    const tip = add(baseP, polar(s * reach, a));
    const mid = lerp(baseP, tip, 0.52);
    const w = polar(s * 0.13, a + Math.PI / 2);
    spikes += closed([baseP, add(mid, w), tip, sub(mid, w)]);
    if (hasAwn) {
      const knee = add(tip, polar(s * 0.55, a - 0.38));
      const awnEnd = add(knee, polar(s * 0.85, a + 0.48));
      awns += `M${P1(tip)}L${P1(knee)}L${P1(awnEnd)}`;
    }
  }
  return { spathes, spikes, awns };
}

// Close study of a single nodding Themeda triandra panicle, showing the boat-shaped spatheoles,
// triangular spikelet clusters, and geniculate awns.
export function redgrassDetail(out: Out, r: Rng, base: Pt) {
  const culm = sample(quad(base, add(base, [28, -150]), add(base, [82, -260])), 18);
  out.push(`<path class="ink mid" d="${line(culm)}"/>`);
  let spathes = "";
  let spikes = "";
  let awns = "";
  let peduncles = "";
  for (const [t, sg, s] of [
    [0.36, -1, 46],
    [0.58, 1, 50],
    [0.78, -1, 48],
    [1.0, 1, 44],
  ] as const) {
    const idx = Math.round(t * 18);
    const p = culm[idx];
    const tasselO = t === 1 ? p : add(p, [sg * 28, 22]);
    if (t < 1) peduncles += `M${P1(p)}Q${P1(add(p, [sg * 16, -8]))} ${P1(tasselO)}`;
    const res = themedaTassel(r, tasselO, rad(78 + sg * 12), s);
    spathes += res.spathes;
    spikes += res.spikes;
    awns += res.awns;
  }
  out.push(`<path class="ink thin" d="${peduncles}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--straw", dl: -0.04, dc: 1.35 }))} d="${spathes}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--grass-rust", spread: 0.04 }))} d="${spikes}"/><path class="ink thin" d="${spathes}${spikes}${awns}"/>`);
}

export function redgrass(out: Out, r: Rng, base: Pt) {
  tussockBase(out, r, base, 64, 215, 142, 46, 0.04, [
    { pc: "--straw", dl: -0.02 },
    { pc: "--grass-rust", dl: 0.08, dc: 0.72 },
    { dl: -0.03, dc: 0.95 },
  ]);

  const culms = 10;
  for (let k = 0; k < culms; k++) {
    const u = k / (culms - 1);
    const H = 310 + Math.sin(u * Math.PI) * 135 + (r() - 0.5) * 45;
    const lean = (u - 0.46) * 0.78 + (r() - 0.5) * 0.12;
    const foot = add(base, [(u - 0.5) * 36, -4]);
    const mid = add(foot, [lean * H * 0.34, -H * 0.62]);
    const top = add(foot, [lean * H, -H + Math.abs(lean) * 28]);
    const culm = sample(quad(foot, mid, top), 16);
    const tang = (idx: number) => Math.atan2(culm[Math.min(16, idx + 1)][1] - culm[Math.max(0, idx - 1)][1], culm[Math.min(16, idx + 1)][0] - culm[Math.max(0, idx - 1)][0]);

    part(out, 0.28 + u * 0.24, foot, () => {
      out.push(`<path class="ink thin" d="${line(culm)}"/>`);
      let spathes = "";
      let spikes = "";
      let awns = "";
      let peduncles = "";
      for (const [t, sg, s] of [
        [0.58, -1, 18],
        [0.73, 1, 20],
        [0.87, -1, 19],
        [1.0, 1, 17],
      ] as const) {
        const idx = Math.round(t * 16);
        const p = culm[idx];
        const ca = tang(idx);
        const dropDir = rad(68 + (r() - 0.5) * 22) * (lean >= 0 ? 1 : -1) + sg * 0.28;
        const tasselO = t === 1 ? p : add(p, [Math.cos(dropDir) * 16 + sg * 8, 12]);
        if (t < 1) peduncles += `M${P1(p)}Q${P1(add(p, [sg * 8, -4]))} ${P1(tasselO)}`;
        const tDir = rad(76 + sg * 14) + (ca + Math.PI / 2) * 0.35;
        const res = themedaTassel(r, tasselO, tDir, s * (0.9 + r() * 0.2));
        spathes += res.spathes;
        spikes += res.spikes;
        awns += res.awns;
      }
      out.push(`<path class="ink hair" d="${peduncles}"/>`);
      out.push(`<path class="wash"${vars(tone(r, { pc: "--straw", dl: -0.06, dc: 1.3, spread: 0.05 }))} d="${spathes}"/>`);
      out.push(`<path class="wash"${vars(tone(r, { pc: "--grass-rust", spread: 0.06, hue: 10 }))} d="${spikes}"/><path class="ink hair" d="${spathes}${spikes}${awns}"/>`);
    });
  }
}

// Close study of a single Hyparrhenia filipendula panicle showing the narrow spatheoles,
// filiform peduncles, paired golden racemes, and fine twisted awns.
export function thatchgrassDetail(out: Out, r: Rng, base: Pt) {
  const culm = sample(quad(base, add(base, [18, -160]), add(base, [52, -300])), 18);
  out.push(`<path class="ink mid" d="${line(culm)}"/>`);
  let spatheoles = "";
  let racemes = "";
  let peduncles = "";
  let awns = "";
  for (let j = 0; j < 6; j++) {
    const t = 0.28 + (j / 5) * 0.72;
    const idx = Math.round(t * 18);
    const p = culm[idx];
    const sg = j % 2 ? 1 : -1;
    const reach = 74 - j * 6;
    const branchA = rad(-90 + sg * 36) + 0.15;
    const spatheTip = add(p, polar(reach * 0.56, branchA));
    const end = add(spatheTip, [sg * reach * 0.44, reach * 0.26]);
    spatheoles += closed([p, add(lerp(p, spatheTip, 0.5), polar(4.5, branchA + Math.PI / 2)), spatheTip, add(lerp(p, spatheTip, 0.5), polar(3.5, branchA - Math.PI / 2))]);
    peduncles += `M${P1(spatheTip)}Q${P1(add(spatheTip, [sg * 14, -4]))} ${P1(end)}`;
    for (const d of [-0.34, 0.34]) {
      const racDir = rad(78 + sg * 12) + d;
      const rTip = add(end, polar(34, racDir));
      const rMid = lerp(end, rTip, 0.5);
      const w = polar(5.2, racDir + Math.PI / 2);
      racemes += closed([end, add(rMid, w), rTip, sub(rMid, w)]);
      awns += `M${P1(rTip)}L${P1(add(rTip, polar(28, racDir + d * 0.5)))}M${P1(rMid)}L${P1(add(rMid, polar(24, racDir + d * 0.8)))}`;
    }
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--grass-rust", dl: 0.1, dc: 0.75 }))} d="${spatheoles}"/>`);
  out.push(`<path class="ink thin" d="${peduncles}${awns}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--straw", dl: -0.06, dc: 1.55 }))} d="${racemes}"/><path class="ink thin" d="${spatheoles}${racemes}"/>`);
}

export function thatchgrass(out: Out, r: Rng, base: Pt) {
  tussockBase(out, r, base, 58, 245, 108, 40, 0.04, [
    { pc: "--straw", dl: 0.02 },
    { dl: -0.04, dc: 0.9 },
    { dl: 0.03, dc: 1.05 },
  ]);

  const culms = 9;
  for (let k = 0; k < culms; k++) {
    const u = k / (culms - 1);
    const H = 450 + Math.sin(u * Math.PI) * 140 + (r() - 0.5) * 40;
    const lean = (u - 0.38) * 0.46 + (r() - 0.5) * 0.08;
    const foot = add(base, [(u - 0.5) * 30, -4]);
    const mid = add(foot, [lean * H * 0.32, -H * 0.58]);
    const top = add(foot, [lean * H, -H]);
    const culm = sample(quad(foot, mid, top), 16);

    part(out, 0.3 + u * 0.24, foot, () => {
      out.push(`<path class="ink thin" d="${line(culm)}"/>`);
      let spatheoles = "";
      let racemes = "";
      let peduncles = "";
      let awns = "";
      for (let j = 0; j < 7; j++) {
        const t = 0.52 + (j / 6) * 0.48;
        const idx = Math.round(t * 16);
        const p = culm[idx];
        const sg = j % 2 ? 1 : -1;
        const reach = (36 - j * 3.2) * (0.9 + r() * 0.2);
        const branchA = rad(-90 + sg * (32 + r() * 14)) + lean * 0.65;
        const spatheTip = add(p, polar(reach * 0.55, branchA));
        const end = add(spatheTip, [sg * reach * 0.42 + lean * 10, reach * 0.28]);
        spatheoles += closed([p, add(lerp(p, spatheTip, 0.5), polar(2.2, branchA + Math.PI / 2)), spatheTip, add(lerp(p, spatheTip, 0.5), polar(1.8, branchA - Math.PI / 2))]);
        peduncles += `M${P1(spatheTip)}Q${P1(add(spatheTip, [sg * 6, -2]))} ${P1(end)}`;
        for (const d of [-0.32, 0.32]) {
          const racDir = rad(78 + sg * 12) + d + lean * 0.4;
          const rTip = add(end, polar(15, racDir));
          const rMid = lerp(end, rTip, 0.5);
          const w = polar(2.4, racDir + Math.PI / 2);
          racemes += closed([end, add(rMid, w), rTip, sub(rMid, w)]);
          const awn1 = add(rTip, polar(12 + r() * 4, racDir + d * 0.5));
          const awn2 = add(rMid, polar(11 + r() * 3, racDir + d * 0.8));
          awns += `M${P1(rTip)}L${P1(awn1)}M${P1(rMid)}L${P1(awn2)}`;
        }
      }
      out.push(`<path class="wash"${vars(tone(r, { pc: "--grass-rust", dl: 0.1, dc: 0.75, spread: 0.04 }))} d="${spatheoles}"/>`);
      out.push(`<path class="ink hair" d="${peduncles}${awns}"/>`);
      out.push(`<path class="wash"${vars(tone(r, { pc: "--straw", dl: -0.06, dc: 1.55, spread: 0.05 }))} d="${racemes}"/><path class="ink hair" d="${racemes}"/>`);
    });
  }
}

// ---------------------------------------------------------------------------
// Sabie crinum (Crinum macowanii): a lush basal fountain of broad, channelled, wavy-margined
// glaucous strap leaves, and a stout scape topped by papery spathe bracts and an umbel of
// nodding white trumpet bells, every tepal banded down the keel with crimson-rose and filled
// with curved dark filaments.

export function crinumFlower(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const tubeMid = (t: number): Pt => [t * L * 0.42, -Math.sin(t * Math.PI) * L * 0.035];
  const tubeHalf = (t: number) => L * (0.028 + 0.055 * t ** 1.6);
  const tUp = sample((t) => add(tubeMid(t), [0, -tubeHalf(t)]), 10);
  const tDn = sample((t) => add(tubeMid(t), [0, tubeHalf(t)]), 10);
  shape(
    out,
    r,
    [...tUp, ...tDn.reverse()].map(toW),
    tone(r, { pc: "--stripe-crinum", dl: 0.04, dc: 0.65, spread: 0.03 }),
    { deep: 0.4, cls: "wash petal" },
  );

  const throat: Pt = [L * 0.38, 0];
  const tepals: [number, number, number, number][] = [
    [-0.56, 0.58, -1, -0.03],
    [0.56, 0.58, 1, -0.03],
    [-0.28, 0.64, -1, -0.01],
    [0.28, 0.64, 1, -0.01],
    [0.0, 0.66, 1, 0.01],
  ];

  for (const [ang, lenK, curl, dl] of tepals) {
    const tL = L * lenK;
    const mid = (s: number): Pt => add(throat, rot([s * tL, curl * s ** 2.2 * tL * 0.22], ang));
    const half = (s: number) => tL * 0.19 * Math.sin(Math.PI * Math.min(1, s) ** 0.72) ** 0.75;
    const up = sample((s) => add(mid(s), rot([0, -half(s)], ang)), 14);
    const dn = sample((s) => add(mid(s), rot([0, half(s)], ang)), 14);
    const outline = [...up, add(mid(1.02), rot([0, curl * tL * 0.04], ang)), ...dn.slice(0, -1).reverse()].map(toW);
    shape(out, r, outline, tone(r, { pc: "--petal", dl, spread: 0.025 }), { deep: 0.38, deepAbout: toW(throat), cls: "wash petal" });

    const band = [
      ...sample((s) => add(mid(s * 0.92), rot([0, -half(s * 0.92) * 0.32], ang)), 8),
      ...sample((s) => add(mid((1 - s) * 0.92), rot([0, half((1 - s) * 0.92) * 0.32], ang)), 8),
    ].map(toW);
    out.push(`<path class="wash lilac-flush"${vars(tone(r, { pc: "--stripe-crinum", spread: 0.03 }))} d="${closed(glaze(band, r, { shift: [0, 0], amp: 0.03 }))}"/>`);
    out.push(`<path class="ink hair stripe" d="${line(sample((s) => mid(s * 0.94), 6).map(toW))}"/>`);
  }

  let filaments = "";
  let anthers = "";
  for (const [da, reach] of [[-0.28, 0.56], [-0.14, 0.62], [0, 0.65], [0.14, 0.6], [0.26, 0.54]] as const) {
    const start = toW(add(throat, [L * 0.08, 0]));
    const end = toW(add(throat, rot([L * reach, -L * 0.08], da)));
    const ctrl = toW(add(throat, rot([L * reach * 0.55, L * 0.05], da)));
    filaments += `M${P1(start)}Q${P1(ctrl)} ${P1(end)}`;
    anthers += closed(roundPts(end, L * 0.032, L * 0.012, dir + da - 0.4, 6));
  }
  out.push(`<path class="ink hair stripe" d="${filaments}"/><path class="wash anther"${vars({ pc: "--anther", dl: -0.15 })} d="${anthers}"/><path class="ink hair" d="${anthers}"/>`);
}

function crinumLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number, droop: number, dl = 0) {
  const mid = (s: number): Pt => [s * L * (1 - 0.12 * s * s), droop * L * s ** 1.85];
  const toW = (p: Pt) => add(O, rot(p, dir));
  const wav = wobble(r, 0.022 * L, [3, 6, 10]);
  const half = (s: number) => L * 0.072 * Math.sin(Math.PI * Math.min(1, s * 0.96 + 0.04) ** 0.65) ** 0.75;
  const N = 24;
  const spine = sample(mid, N);
  const up: Pt[] = [];
  const dn: Pt[] = [];
  spine.forEach((p, i) => {
    const s = i / N;
    const d = norm(sub(spine[Math.min(N, i + 1)], spine[Math.max(0, i - 1)]));
    const nrm: Pt = [-d[1], d[0]];
    const h = half(s);
    const wv = wav(s) * Math.sin(s * Math.PI);
    up.push(add(p, mul(nrm, h + wv)));
    dn.push(add(p, mul(nrm, -h + wv * 0.8)));
  });
  const outline = [...up, spine[N], ...dn.slice(0, -1).reverse()].map(toW);
  shape(out, r, outline, tone(r, { dl, spread: 0.05, hue: 8 }), { deep: 0.52, deepAbout: toW(mid(0.32)) });
  const keel = [
    ...spine.slice(0, 14).map((p, i) => add(p, [0, -half(i / N) * 0.22])),
    ...spine.slice(0, 14).reverse().map((p, i) => add(p, [0, half((13 - i) / N) * 0.22])),
  ].map(toW);
  out.push(`<path class="wash band" d="${closed(keel)}"/><path class="ink hair vein" d="${line(spine.slice(1, -2).map(toW))}"/>`);
}

export function crinum(out: Out, r: Rng, base: Pt) {
  const leaves: [number, number, number, number][] = [
    [-162, 310, -0.46, -0.05],
    [-18, 320, 0.46, -0.05],
    [-142, 345, -0.42, -0.03],
    [-38, 350, 0.42, -0.03],
    [-118, 310, -0.34, -0.02],
    [-62, 315, 0.34, -0.02],
    [-92, 275, 0.14, -0.01],
    [-172, 360, -0.5, 0.01],
    [-8, 365, 0.5, 0.01],
    [-150, 380, -0.48, 0.02],
    [-30, 385, 0.48, 0.02],
    [-126, 330, -0.4, 0.03],
    [-54, 335, 0.4, 0.03],
  ];
  leaves.forEach(([deg, len, droop, dl], k) => {
    const O = add(base, [(r() - 0.5) * 20, -4]);
    part(out, 0.03 + k * 0.022, base, () => crinumLeaf(out, r, O, rad(deg), len + r() * 35, droop, dl));
  });

  const n = 22;
  const spine = sample((t) => add(base, [Math.sin(t * 1.7) * 12 - 4, -t * 395]), n);
  const g = [0.34, 0.6];
  const scape = grow(out, g[0], g[1], () => stalk(out, (t) => spine[Math.round(t * n)], 14, 9, tone(r, { pc: "--stripe-crinum", dl: -0.08, dc: 0.45, spread: 0.03 }), n));
  const top = spine[n];

  part(out, g[1] + 0.01, top, () => {
    for (const sg of [-1, 1]) {
      blade(out, r, top, rad(-90 + sg * 115), 54, { W: 0.28, bend: sg * 0.2, v: tone(r, { pc: "--straw", dl: -0.04, spread: 0.04 }), deep: 0, rib: "ink hair vein" });
    }
  });

  const umbel: [number, number, number, boolean][] = [
    [-145, 28, 114, false],
    [-35, 28, 114, false],
    [-116, 32, 106, false],
    [-64, 32, 106, false],
    [-168, 24, 118, false],
    [-12, 24, 118, false],
    [-90, 30, 98, false],
    [-132, 26, 76, true],
    [-48, 26, 76, true],
  ];
  umbel.forEach(([deg, pedL, flL, isBud], k) => {
    part(out, gate(scape, g, n) + 0.03 + k * 0.02, top, () => {
      const pedA = rad(deg);
      const p = add(top, polar(pedL, pedA));
      out.push(`<path class="ink thin" d="M${P1(top)}Q${P1(add(lerp(top, p, 0.5), [0, -4]))} ${P1(p)}"/>`);
      const side = Math.cos(pedA) >= 0 ? 1 : -1;
      const flA = pedA + side * rad(36);
      if (isBud) {
        const budTip = add(p, polar(flL, flA));
        const bMid = lerp(p, budTip, 0.58);
        const nrm = polar(flL * 0.13, flA + Math.PI / 2);
        shape(out, r, [p, add(bMid, nrm), budTip, sub(bMid, nrm)], tone(r, { pc: "--stripe-crinum", dl: 0.08, dc: 0.85, spread: 0.03 }), { deep: 0.4, cls: "wash petal" });
      } else {
        crinumFlower(out, r, p, flA, flL);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Star flower (Hypoxis hemerocallidea): three-ranked (tristichous) fans of strongly arching,
// ribbed, white-hairy falcate leaves, and erect hairy scapes carrying bright golden-yellow
// six-pointed star flowers with a cone of orange-gold stamens.

export function star(out: Out, r: Rng, c: Pt, s: number, tilt: number) {
  const spin = (r() - 0.5) * 0.25;
  for (const [offset, w, reach, dl] of [
    [0, 0.26, 1.04, -0.03],
    [1, 0.32, 0.98, 0.02],
  ] as const) {
    for (let k = 0; k < 3; k++) {
      const a = spin + ((k * 2 + offset) / 6) * TAU - Math.PI / 2;
      const project = ([x, y]: Pt): Pt => {
        const rotP = rot([x, y], a);
        return add(c, [rotP[0], rotP[1] * tilt]);
      };
      const L = s * reach;
      const half = (t: number) => L * w * Math.sin(Math.PI * Math.min(1, t) ** 0.78) ** 0.82;
      const up = sample((t) => [t * L, -half(t)] as Pt, 10);
      const dn = sample((t) => [t * L, half(t)] as Pt, 10);
      const pts = [...up, [L * 1.03, 0] as Pt, ...dn.slice(0, -1).reverse()].map(project);
      shape(out, r, pts, tone(r, { pc: "--flower-gold", dl, spread: 0.04, hue: 6 }), {
        deep: 0.38,
        deepAbout: c,
        cls: "wash petal",
      });
      out.push(`<path class="ink hair vein" d="M${P1(project([L * 0.14, 0]))}L${P1(project([L * 0.84, 0]))}"/>`);
    }
  }
  let anthers = "";
  for (let k = 0; k < 6; k++) {
    const a = spin + (k / 6) * TAU;
    const ac = add(c, [Math.cos(a) * s * 0.16, Math.sin(a) * s * 0.16 * tilt]);
    anthers += closed(roundPts(ac, Math.max(1.5, s * 0.085), Math.max(1.1, s * 0.055 * (0.4 + 0.6 * tilt)), a, 6));
  }
  out.push(`<path class="wash anther"${vars(tone(r, { pc: "--anther", dl: -0.06, dc: 1.2 }))} d="${anthers}"/><path class="ink hair" d="${anthers}"/>`);
  shape(out, r, roundPts(c, Math.max(1.5, s * 0.07), Math.max(1.2, s * 0.07 * tilt), 0, 6), tone(r, { pc: "--flower-gold", dl: -0.22 }), { deep: 0 });
}

export function hypoxis(out: Out, r: Rng, base: Pt) {
  const leaves: [number, number, number, number][] = [
    [-168, 250, -0.52, -0.04],
    [-12, 255, 0.52, -0.04],
    [-152, 280, -0.48, -0.02],
    [-28, 285, 0.48, -0.02],
    [-136, 265, -0.44, 0],
    [-44, 270, 0.44, 0],
    [-114, 240, -0.34, -0.03],
    [-66, 245, 0.34, -0.03],
    [-98, 215, -0.22, -0.01],
    [-82, 220, 0.22, -0.01],
    [-160, 270, -0.5, 0.02],
    [-20, 275, 0.5, 0.02],
    [-144, 250, -0.42, 0.03],
    [-36, 255, 0.42, 0.03],
    [-122, 225, -0.36, 0.03],
    [-58, 230, 0.36, 0.03],
  ];

  leaves.forEach(([deg, len, bend, dl], k) => {
    const O = add(base, [(r() - 0.5) * 16, -2]);
    const dir = rad(deg);
    part(out, 0.03 + k * 0.02, base, () => {
      const L = len + r() * 45;
      const W = 0.085;
      const res = blade(out, r, O, dir, L, {
        W,
        bend,
        v: tone(r, { dl, spread: 0.05, hue: 8 }),
        deep: 0.5,
        rib: "ink hair vein",
      });
      // Fine silky white marginal cilia along the upper edge of the arching blade.
      let cilia = "";
      const upSign = Math.cos(dir) >= 0 ? -1 : 1;
      for (let s0 = 0.16; s0 <= 0.86; s0 += 0.1) {
        const p = res.at(s0);
        const tangent = dir + 2 * bend * s0;
        const edge = add(p, polar((W * L * Math.sin(Math.PI * s0) * 0.45), tangent + upSign * Math.PI / 2));
        const tip = add(edge, polar(6 + r() * 3, tangent + upSign * rad(42)));
        cilia += `M${P1(edge)}L${P1(tip)}`;
      }
      out.push(`<path class="ink wool" d="${cilia}"/>`);
    });
  });

  for (const [dx, H, lean, stars] of [
    [-18, 235, -0.22, 3],
    [-6, 275, -0.06, 4],
    [6, 260, 0.08, 3],
    [18, 230, 0.22, 3],
    [0, 200, -0.02, 2],
  ] as const) {
    const foot = add(base, [dx, -4]);
    const top = add(foot, [lean * H, -H]);
    const ctrl = add(foot, [lean * H * 0.38, -H * 0.58]);
    const scape = sample(quad(foot, ctrl, top), 12);
    part(out, 0.42 + Math.abs(lean) * 0.6, foot, () => {
      out.push(`<path class="ink mid" d="${line(scape)}"/>`);
      let fuzz = "";
      for (let i = 2; i < 12; i += 2) {
        fuzz += `M${P1(scape[i])}l${(i % 4 ? 4 : -4).toFixed(1)} -3`;
      }
      out.push(`<path class="ink wool" d="${fuzz}"/>`);

      for (let k = 0; k < stars; k++) {
        const t = 1 - k * 0.12;
        const p = scape[Math.round(t * 12)];
        const side = (k % 2 ? 1 : -1) * (lean >= 0 ? 1 : -1);
        const c = add(p, [side * (12 + k * 4), -4 + k * 4]);
        out.push(`<path class="ink thin" d="M${P1(p)}L${P1(c)}"/>`);
        if (k === 0) {
          const budTip = add(c, [side * 5, -14]);
          shape(out, r, [c, add(lerp(c, budTip, 0.5), [-4.5, 0]), budTip, add(lerp(c, budTip, 0.5), [4.5, 0])], tone(r, { dl: -0.02, spread: 0.04 }), { deep: 0 });
        } else {
          star(out, r, c, 24 - k * 1.5, 0.68);
        }
      }
    });
  }
}
