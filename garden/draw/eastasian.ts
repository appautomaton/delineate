// The East Asian garden (#2, Köppen Cfa: the lower Yangtze and Kanto plains).
// The first four-season garden (`year: true`) and the second water garden (`water: 9, still: true`).
// Thirteen plants span the full year on `u ∈ [0, 1]`:
//   - Early spring (`u ≈ 0.12–0.22`): plum blossoms on bare wood, paulownia violet panicles,
//     weeping willow catkins, chocolate vine flowers, and a new moso bamboo shoot in spotted sheaths.
//   - Late spring (`u = SPRING = 0.42`): wisteria racemes, peonies, and full fresh foliage across
//     every deciduous crown.
//   - Summer (`u ≈ 0.50–0.65`): lotus blossoms and shield leaves over the pond, rabbit-ear iris in
//     the shallows, hydrangea mopheads in the plum rain, green plums yellowing, and maple keys.
//   - Early autumn (`u ≈ 0.66–0.74`): red spider lily umbels on bare scapes, lotus seed pods,
//     akebia purple sausage pods, and hydrangea heads fading to antique rose-parchment.
//   - Late autumn (`u ≈ 0.75–0.84`): scarlet maple, golden ginkgo, yellow willow and wisteria
//     shedding across the scroll.
//   - Winter (`u ≈ 0.86–1.0`): evergreen moso bamboo, bare ginkgo spur shoots, fine maple twigs,
//     paulownia capsules and furred buds, wisteria pods, dry hydrangea heads, broken winter lotus
//     stalks with dry pods, spider-lily leaves, and the plum flowering again on bare wood.

import { rad, P1, add, sub, mul, lerp, polar, rot, quad, closed, line, sample, vars, shape, stalk, tone, grow, part, gate, roundPts, fallsAt } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";
import { limb, branch, angleOf } from "./woody.ts";
import type { Limb } from "./woody.ts";
import { palmate, blade, bladeBunch } from "./mediterranean.ts";

const BARK = { pc: "--bark-ginkgo" };
const STALK = { pc: "--stem-green" };

// ---------------------------------------------------------------------------
// 1. Ginkgo (Ginkgo biloba): stout grey-brown limbs forking into ascending wood studded with
// compact ringed spur shoots (brachyblasts), each bearing a cluster of long-stalked bilobed fan
// leaves with dichotomous venation. Turns bright saffron-gold in late autumn and sheds.

const shed = fallsAt(0.8, 0.08);

export function ginkgoFan(out: Out, r: Rng, O: Pt, dir: number, R: number) {
  const half = rad(58 + r() * 14);
  const ph = r() * 6.28;
  const notch = 0.2 + r() * 0.12;
  const rim = (a: number) => R * (0.96 + 0.04 * Math.cos(3 * a + ph)) * (1 - notch * Math.exp(-((a / 0.14) ** 2)));
  const toW = (p: Pt) => add(O, rot(p, dir));
  const arc: Pt[] = [];
  for (let k = 0; k <= 7; k++) arc.push(polar(rim(-half + (half - 0.13) * (k / 7)), -half + (half - 0.13) * (k / 7)));
  arc.push(polar(rim(0), 0));
  for (let k = 7; k >= 0; k--) arc.push(polar(rim(half - (half - 0.13) * (k / 7)), half - (half - 0.13) * (k / 7)));
  const pts = [[0, 0] as Pt, ...arc].map(toW);
  shape(out, r, pts, tone(r, { spread: 0.06, hue: 8 }), { deep: 0.5, deepAbout: toW(polar(R * 0.4, 0)), ink: false });
  out.push(`<path class="ink hair" d="${closed(pts)}"/>`);

  const FORK = [0.5, 0.78, 0.92];
  let veins = "";
  const vein = (a0: number, r0: number, a: number, lvl: number) => {
    const r1 = rim(a) * FORK[lvl];
    veins += `M${P1(toW(polar(r0, a0)))}Q${P1(toW(polar((r0 + r1) / 2, (a0 + a) / 2)))} ${P1(toW(polar(r1, a)))}`;
    if (lvl < 2) for (const d of [-1, 1]) vein(a, r1, a + (d * half) / 2 ** (lvl + 3), lvl + 1);
  };
  for (const a of [-0.75, -0.25, 0.25, 0.75]) vein(a * half, 3, a * half, 0);
  out.push(`<path class="ink hair vein" d="${veins}"/>`);
}

function fanOnStalk(out: Out, r: Rng, T: Pt, a: number, len: number, R: number, g: number) {
  const E = add(T, polar(len, a));
  const bow = polar(len * 0.12, a + rad(90) * (r() < 0.5 ? -1 : 1));
  const ctrl = add(add(T, polar(len * 0.5, a)), bow);
  part(
    out,
    g,
    T,
    () => {
      stalk(out, quad(T, ctrl, E), 2.2, 1.2, STALK, 8);
      ginkgoFan(out, r, E, a + (r() - 0.5) * 0.24, R);
    },
    shed(T),
  );
}

function spurLeaves(out: Out, r: Rng, T: Pt, dir: number, g: number, sc: number) {
  const n = 4 + Math.floor(r() * 2);
  const aim = Math.atan2(Math.sin(dir) - 0.85, Math.cos(dir));
  const spread = rad(116);
  for (let k = 0; k < n; k++) {
    const a = aim + spread * (k / (n - 1) - 0.5) + (r() - 0.5) * 0.26;
    fanOnStalk(out, r, T, a, (28 + r() * 24) * sc, (27 + r() * 11) * sc, g + k * 0.005);
  }
}

// Compact ringed brachyblasts (short spur shoots) along older wood: proportioned so they read as
// knobby leaf-scarred pegs in winter without overpowering the parent limb.
function spursOn(out: Out, r: Rng, parent: { res: Limb; g: number[] }, from: number, side: number) {
  const { res } = parent;
  for (let i = Math.round(res.n * from), s = side; i <= res.n - 5; i += 13 + Math.floor(r() * 4), s = -s) {
    const a = angleOf(res.pts, i) + s * rad(42 + r() * 20);
    const len = 10 + r() * 5;
    const spur = branch(out, r, parent, i / res.n, [polar(len * 0.45, a), polar(len, a)], 0.025, { w0: 5.8, w1: 4.4, cap: "blunt", lenticels: true, ...BARK });
    const tip = spur.res.pts[spur.res.n];
    spurLeaves(out, r, tip, angleOf(spur.res.pts, spur.res.n), Math.min(0.32, gate(spur.res, spur.g, spur.res.n) + 0.015), 1);
  }
}

export function ginkgo(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0.01, 0.18];
  const main = grow(out, gm[0], gm[1], () =>
    limb(out, r, [at([-26, 6]), at([76, -12]), at([184, -56]), at([276, -134]), at([344, -226])], { w0: 42, w1: 12, cap: "blunt", ...BARK }),
  );
  const parent = { res: main, g: gm };

  const forks = [
    branch(out, r, parent, 0.28, [[32, -62], [74, -138], [108, -210]], 0.08, { w0: 20, w1: 9.5, cap: "blunt", ...BARK }),
    branch(out, r, parent, 0.5, [[48, 6], [136, -10], [224, -46], [286, -98]], 0.08, { w0: 18, w1: 9, cap: "blunt", ...BARK }),
    branch(out, r, parent, 0.72, [[24, -46], [56, -108], [72, -162]], 0.08, { w0: 14, w1: 8, cap: "blunt", ...BARK }),
  ];

  spursOn(out, r, parent, 0.16, 1);
  for (const f of forks) spursOn(out, r, f, 0.2, -1);

  for (const f of forks) {
    const i = Math.round(f.res.n * 0.96);
    const a = angleOf(f.res.pts, i);
    const shoot = branch(out, r, f, 0.96, [polar(22, a - 0.1), polar(48, a - 0.18)], 0.04, { w0: 6.2, w1: 2.8, cap: "taper", ...BARK });
    let side = 1;
    for (const t of [0.32, 0.6, 0.86]) {
      const j = Math.round(shoot.res.n * t);
      const p = shoot.res.pts[j];
      const la = angleOf(shoot.res.pts, j) + side * rad(64 + r() * 18);
      fanOnStalk(out, r, p, la, 30 + r() * 6, 30 + r() * 5, Math.min(0.34, gate(shoot.res, shoot.g, j) + 0.015));
      side = -side;
    }
  }
}

export function ginkgoSpurDetail(out: Out, r: Rng) {
  const sc = 3;
  const base: Pt = [40, 210];
  const dir = rad(-80);
  const knuckle = limb(out, r, [base, add(base, polar(12 * sc, dir + rad(6))), add(base, polar(24 * sc, dir))], { w0: 6.5 * sc, w1: 5 * sc, cap: "blunt", lenticels: true, ...BARK });
  spurLeaves(out, r, knuckle.pts[knuckle.n], dir, 0, sc);
}

// ---------------------------------------------------------------------------
// 2. Japanese maple (Acer palmatum): sinuous horizontal-tiered limbs reaching in from the right,
// fine red-barked twigs held in floating planes, 7-lobed palmate hands in opposite pairs on red
// petioles, and paired winged samaras hanging beneath the tiers through summer.

const MAPLE = { pc: "--bark-maple" };
const MAPLE_STALK = { pc: "--stem-maple" };
const LOBES: [number, number][] = [[0, 1], [-0.62, 0.9], [0.62, 0.9], [-1.24, 0.72], [1.24, 0.72], [-1.9, 0.4], [1.9, 0.4]];
const mapleShed = fallsAt(0.75, 0.08);
const keysFall = fallsAt(0.78, 0.06);

export function mapleLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  palmate(out, r, O, dir, L, { lobes: LOBES, sigma: 0.27, power: 1.7, teeth: 0.035, toothCount: 130, core: 0.3, deep: 0.4, v: tone(r, { spread: 0.06, hue: 10 }), hairline: true });
}

function mapleOnStalk(out: Out, r: Rng, T: Pt, a: number, len: number, L: number, g: number) {
  const E = add(T, polar(len, a));
  part(
    out,
    g,
    T,
    () => {
      stalk(out, quad(T, add(lerp(T, E, 0.5), polar(len * 0.1, a + rad(90))), E), 1.7, 1.0, MAPLE_STALK, 6);
      mapleLeaf(out, r, E, a + (r() - 0.5) * 0.28, L);
    },
    mapleShed(T),
  );
}

export function mapleKeys(out: Out, r: Rng, T: Pt, a: number, s: number) {
  const C = add(T, polar(11 * s, a));
  let wings = "";
  for (const side of [-1, 1]) {
    const w = a + side * rad(56);
    const seed = add(C, polar(3 * s, w));
    const tip = add(C, polar(24 * s, w + side * 0.12));
    const n = polar(4.6 * s, w + rad(90) * side);
    wings += closed([seed, add(lerp(seed, tip, 0.45), n), add(tip, mul(n, 0.3)), tip, lerp(seed, tip, 0.6), seed]);
  }
  out.push(`<path class="ink hair" d="M${P1(T)}L${P1(C)}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--keys-maple", spread: 0.05 }))} d="${wings}"/><path class="ink hair" d="${wings}"/>`);
}

function mapleTwig(out: Out, r: Rng, parent: { res: Limb; g: number[] }, t: number, a: number, len: number, keys: boolean) {
  const twig = branch(out, r, parent, t, [polar(len * 0.45, a), polar(len, a + (r() - 0.5) * 0.18)], 0.04, { w0: 3.8, w1: 1.4, cap: "taper", ...MAPLE });
  const n = twig.res.n;
  for (const [k, u] of [[0, 0.48], [1, 0.78], [2, 1]] as const) {
    const i = Math.round(n * u);
    const p = twig.res.pts[i];
    const d = angleOf(twig.res.pts, Math.min(i, n - 1));
    const g = Math.min(0.34, Math.max(gate(twig.res, twig.g, i) + 0.018, 0.18 + k * 0.015));
    for (const side of [-1, 1]) {
      mapleOnStalk(out, r, p, d + side * rad(58 - k * 6) + rad(14), 18 + r() * 8, (32 - k * 3 + r() * 8), g);
    }
  }
  if (keys) {
    const p = twig.res.pts[Math.round(n * 0.62)];
    part(out, 0.45, p, () => mapleKeys(out, r, p, rad(96), 1), keysFall(p));
  }
}

export function maple(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0.02, 0.18];
  const main = grow(out, gm[0], gm[1], () =>
    limb(out, r, [at([-26, 10]), at([68, -22]), at([172, -46]), at([288, -54]), at([402, -42])], { w0: 28, w1: 7, cap: "taper", ...MAPLE }),
  );
  const parent = { res: main, g: gm };
  const tiers = [
    branch(out, r, parent, 0.2, [[34, -44], [108, -92], [198, -114], [274, -116]], 0.08, { w0: 15, w1: 3.8, cap: "taper", ...MAPLE }),
    branch(out, r, parent, 0.4, [[44, 14], [128, 30], [220, 32], [294, 22]], 0.08, { w0: 13, w1: 3.6, cap: "taper", ...MAPLE }),
    branch(out, r, parent, 0.62, [[32, -32], [104, -64], [188, -70]], 0.08, { w0: 11, w1: 3.2, cap: "taper", ...MAPLE }),
  ];
  for (const [j, tier] of [parent, ...tiers].entries()) {
    const n = tier.res.n;
    for (let i = Math.round(n * 0.28), s = j % 2 ? 1 : -1; i <= n - 3; i += 9 + Math.floor(r() * 4), s = -s) {
      const a = angleOf(tier.res.pts, i) + s * rad(26 + r() * 16);
      mapleTwig(out, r, tier, i / n, a, 48 + r() * 22, (i + j) % 3 === 0);
    }
  }
}

export function mapleDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-150, 20], [-40, 6], [80, -10], [160, -14]], { w0: 7, w1: 2.5, cap: "taper", ...MAPLE });
  for (const [u, side] of [[0.35, -1], [0.35, 1], [0.8, -1], [0.8, 1]] as const) {
    const i = Math.round(twig.n * u);
    const p = twig.pts[i];
    const d = angleOf(twig.pts, i) + side * rad(62) + rad(18);
    const E = add(p, polar(44, d));
    stalk(out, quad(p, lerp(p, E, 0.5), E), 3, 1.8, tone(r, MAPLE_STALK), 6);
    mapleLeaf(out, r, E, d, 84);
  }
  mapleKeys(out, r, twig.pts[Math.round(twig.n * 0.58)], rad(95), 2.6);
}

// ---------------------------------------------------------------------------
// 3. Plum (Prunus mume): an ancient bent, knotted trunk leaning in from the right bank, its twigs
// turning sharply in classical zhegan (折枝) zigzags. Flowers twice on the year's scroll: in early
// spring (`g -> petalsFall`) and again on bare wood at winter's end (`0.88..0.94 -> 1.0`), with
// both 5-petalled blossoms and round unopened winter buds. Plump green-gold plums sit subsessile
// against the twigs in the June plum rain.

const PLUM = { pc: "--bark-plum" };
const plumShed = fallsAt(0.76, 0.08);
const petalsFall = fallsAt(0.24, 0.06);

export function plumFlower(out: Out, r: Rng, C: Pt, R: number) {
  let petals = "";
  const spin = r() * 6.28;
  for (let k = 0; k < 5; k++) {
    const a = spin + (k / 5) * 6.28;
    petals += closed(roundPts(add(C, polar(R * 0.56, a)), R * 0.5, R * 0.46, a, 8));
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-plum", spread: 0.03 }))} d="${petals}"/><path class="ink hair petal-edge" d="${petals}"/>`);
  let stamens = "";
  for (let k = 0; k < 11; k++) {
    const a = spin + (k / 11) * 6.28;
    const tip = add(C, polar(R * 0.52, a));
    stamens += `M${P1(C)}L${P1(tip)}`;
  }
  out.push(`<path class="ink hair" style="stroke:var(--stamen-plum)" d="${stamens}"/>`);
  shape(out, r, roundPts(C, R * 0.21, R * 0.21, 0, 6), tone(r, { pc: "--calyx-plum", spread: 0.02 }), { deep: 0, ink: false });
}

function plumBud(out: Out, r: Rng, B: Pt, dir: number, R: number) {
  const C = add(B, polar(R * 0.85, dir));
  shape(out, r, roundPts(C, R * 0.58, R * 0.52, dir, 7), tone(r, { pc: "--flower-plum", dl: -0.03, spread: 0.03 }), { deep: 0.25, ink: false });
  out.push(`<path class="ink hair petal-edge" d="${closed(roundPts(C, R * 0.58, R * 0.52, dir, 7))}"/>`);
  const cal = add(B, polar(R * 0.36, dir));
  shape(out, r, roundPts(cal, R * 0.36, R * 0.32, dir, 6), tone(r, { pc: "--calyx-plum", spread: 0.02 }), { deep: 0, ink: false });
}

function zigzag(a: number, len: number, turns: number, r: Rng): Pt[] {
  const pts: Pt[] = [[0, 0]];
  let dir = a;
  for (let k = 1; k <= turns; k++) {
    dir += (k % 2 ? 1 : -1) * rad(18 + r() * 14);
    pts.push(add(pts[k - 1], polar(len / turns, dir)));
  }
  return pts;
}

function plumTwig(out: Out, r: Rng, parent: { res: Limb; g: number[] }, t: number, a: number, len: number) {
  const twig = branch(out, r, parent, t, zigzag(a, len, 4, r).slice(1), 0.03, { w0: 5.8, w1: 1.8, cap: "taper", ...PLUM });
  const n = twig.res.n;
  for (const [idx, u] of [[0, 0.28], [1, 0.54], [2, 0.78], [3, 0.98]] as const) {
    const i = Math.round(n * u);
    const d = angleOf(twig.res.pts, Math.min(i, n - 1));
    const p = add(twig.res.pts[i], polar(3.5, d - rad(90)));
    const g = gate(twig.res, twig.g, i) + 0.01;
    const R = 10 + r() * 3.5;
    const isBud = idx === 3 && r() < 0.55;
    part(out, g, p, () => (isBud ? plumBud(out, r, p, d - rad(55), R) : plumFlower(out, r, p, R)), petalsFall(p));
    part(out, 0.88 + u * 0.06, p, () => (isBud ? plumBud(out, r, p, d - rad(55), R) : plumFlower(out, r, p, R)));
  }
  for (const [k, u] of [[0, 0.38], [1, 0.64], [2, 0.88]] as const) {
    const i = Math.round(n * u);
    const T = twig.res.pts[i];
    const d = angleOf(twig.res.pts, Math.min(i, n - 1)) + (k % 2 ? 1 : -1) * rad(48);
    const lg = Math.min(0.34, Math.max(gate(twig.res, twig.g, i) + 0.02, 0.2 + k * 0.02 + r() * 0.03));
    part(
      out,
      lg,
      T,
      () => blade(out, r, T, d, 34 + r() * 8, { W: 0.44, prof: (q) => Math.sin(Math.PI * Math.min(1, q) ** 0.7) ** 0.9, v: tone(r, { spread: 0.05, hue: 8 }), deep: 0.4, rib: "ink hair", hairline: true }),
      plumShed(T),
    );
  }
  // Subsessile green-gold ume fruit nestled directly against the twig node (no hanging string).
  if (r() < 0.55) {
    const i = Math.round(n * 0.48);
    const T = twig.res.pts[i];
    const d = angleOf(twig.res.pts, i) + rad(75);
    const C = add(T, polar(6.5, d));
    part(
      out,
      Math.max(gate(twig.res, twig.g, i) + 0.02, 0.32),
      T,
      () => {
        shape(out, r, roundPts(C, 9.5, 10.5, d, 10), tone(r, { pc: "--fruit-plum", spread: 0.04 }), { deep: 0.4 });
        const seam = quad(add(C, polar(-7, d)), add(C, polar(3, d + rad(90))), add(C, polar(7.5, d)));
        out.push(`<path class="ink hair" d="${line(sample(seam, 5))}"/>`);
      },
      0.56 + r() * 0.04,
    );
  }
}

export function plum(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0.01, 0.14];
  const main = grow(out, gm[0], gm[1], () =>
    limb(out, r, [at([-22, -2]), at([34, -58]), at([18, -126]), at([76, -192]), at([168, -228]), at([252, -284])], {
      w0: 38,
      w1: 10,
      cap: "blunt",
      swell: [[0.3, 0.14], [0.56, 0.12]],
      ...PLUM,
    }),
  );
  const parent = { res: main, g: gm };
  const limbs = [
    branch(out, r, parent, 0.4, [[54, -18], [128, -64], [164, -36], [244, -84]], 0.06, { w0: 15, w1: 4.5, cap: "taper", ...PLUM }),
    branch(out, r, parent, 0.66, [[-26, -48], [-14, -104], [48, -148]], 0.06, { w0: 11.5, w1: 3.8, cap: "taper", ...PLUM }),
  ];
  for (const [j, l] of [parent, ...limbs].entries()) {
    const n = l.res.n;
    for (let i = Math.round(n * 0.32), s = j % 2 ? 1 : -1; i <= n - 2; i += 8 + Math.floor(r() * 4), s = -s) {
      plumTwig(out, r, l, i / n, angleOf(l.res.pts, i) + s * rad(38 + r() * 20), 62 + r() * 28);
    }
  }
}

export function plumDetail(out: Out, r: Rng) {
  const twig = limb(out, r, zigzag(rad(-20), 300, 4, r).map((p) => add(p, [-150, 60])), { w0: 10, w1: 3, cap: "taper", ...PLUM });
  for (const u of [0.25, 0.5, 0.75]) {
    const i = Math.round(twig.n * u);
    plumFlower(out, r, add(twig.pts[i], [0, -6]), 26);
  }
  plumBud(out, r, twig.pts[Math.round(twig.n * 0.92)], rad(-65), 22);
}

// ---------------------------------------------------------------------------
// 4. Paulownia (Paulownia tomentosa): stout candelabra limbs with upturned tips bearing upright
// pyramidal panicles of pale violet foxglove trumpets on bare wood in early spring, followed by
// plate-sized cordate velvet leaves in opposite pairs, and woody beaked capsules with furred
// overwintering flower-bud thyrses in autumn and winter.

const PAULOWNIA = { pc: "--bark-paulownia" };
const paulowniaShed = fallsAt(0.74, 0.08);
const bellsFall = fallsAt(0.415, 0.04);

export function paulowniaLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const k = 0.94 + r() * 0.12;
  const n = 14;
  const upper: Pt[] = [];
  const lower: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    // Cordate profile: basal auricles dip behind O (`x < 0`) before sweeping out to a broad heart.
    const x = (u - 0.12 * Math.sin(Math.PI * (1 - u) ** 2.2)) * L;
    const w = 0.46 * k * Math.sin(Math.PI * u ** 0.62) * (1 - 0.18 * u * u) * L;
    upper.push([x, -w]);
    lower.push([x, w * (0.95 + r() * 0.08)]);
  }
  const outline = [[0, 0] as Pt, ...upper.slice(1), ...lower.slice(1, -1).reverse()].map(toW);
  shape(out, r, outline, tone(r, { spread: 0.05, hue: 8 }), { deep: 0.4, deepAbout: toW([0.32 * L, 0]), ink: false });
  let veins = "";
  for (const a of [-0.88, -0.44, 0, 0.44, 0.88]) {
    veins += line([[0, 0], [0.3 * L, a * 0.13 * L], [(0.78 - Math.abs(a) * 0.26) * L, a * 0.32 * L]].map((p) => toW(p as Pt)));
  }
  out.push(`<path class="ink hair" d="${closed(outline)}"/><path class="ink hair vein" d="${veins}"/>`);
}

export function paulowniaPanicle(out: Out, r: Rng, B: Pt, a: number, H: number) {
  const tip = add(B, polar(H, a));
  let stalks = `M${P1(B)}L${P1(tip)}`;
  let bells = "";
  let calyces = "";
  const Lb = H * 0.22;
  const trumpet = (q: Pt, d: number, L: number) => {
    const at = (u: number, w: number): Pt => add(add(q, polar(L * u, d)), polar(L * w, d + rad(90)));
    calyces += closed([at(-0.04, 0.04), at(0.18, 0.11), at(0.24, 0), at(0.18, -0.11), at(-0.04, -0.04)]);
    bells += closed([
      at(0.1, 0.06),
      at(0.45, 0.12),
      at(0.76, 0.22),
      at(0.95, 0.3),
      at(1.06, 0.16),
      at(1.1, 0),
      at(1.06, -0.16),
      at(0.95, -0.3),
      at(0.76, -0.22),
      at(0.45, -0.12),
      at(0.1, -0.06),
    ]);
  };
  for (let k = 0; k < 5; k++) {
    const u = 0.14 + k * 0.18;
    const p = lerp(B, tip, u);
    for (const side of [-1, 1]) {
      const reach = H * 0.22 * (1 - u * 0.58);
      const q = add(p, polar(reach, a + side * rad(56)));
      stalks += `M${P1(p)}L${P1(q)}`;
      const n = k < 3 ? 2 : 1;
      for (let j = 0; j < n; j++) {
        trumpet(q, a + side * rad(64 + r() * 24) + (j ? 0.42 : -0.18) * side, Lb * (0.84 + r() * 0.28));
      }
    }
  }
  trumpet(tip, a, Lb * 0.92);
  out.push(`<path class="ink hair" d="${stalks}"/>`);
  out.push(`<path class="wash felt"${vars(tone(r, { pc: "--bud-paulownia", spread: 0.03 }))} d="${calyces}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-paulownia", spread: 0.04 }))} d="${bells}"/><path class="ink hair petal-edge" d="${bells}"/>`);
}

function paulowniaCapsules(out: Out, r: Rng, B: Pt, a: number, H: number) {
  let caps = "";
  let stalks = `M${P1(B)}L${P1(add(B, polar(H * 0.88, a)))}`;
  for (let k = 0; k < 6; k++) {
    const p = add(B, polar(H * (0.18 + k * 0.13), a));
    const dir = a + (k % 2 ? 1 : -1) * rad(64);
    const C = add(p, polar(12, dir));
    stalks += `M${P1(p)}L${P1(C)}`;
    const beak = add(C, polar(11, dir));
    caps += closed([...roundPts(C, 8.5, 6.2, dir, 8), beak]);
  }
  out.push(`<path class="ink hair" d="${stalks}"/><path class="wash"${vars(tone(r, { pc: "--capsule-paulownia", spread: 0.04 }))} d="${caps}"/><path class="ink hair" d="${caps}"/>`);
}

function paulowniaBuds(out: Out, r: Rng, T: Pt, a: number) {
  let buds = "";
  let stalks = `M${P1(T)}L${P1(add(T, polar(28, a)))}`;
  for (let k = 0; k < 5; k++) {
    const p = add(T, polar(7 + k * 4.5, a + (k % 2 ? 1 : -1) * 0.45));
    stalks += `M${P1(lerp(T, p, 0.5))}L${P1(p)}`;
    buds += closed(roundPts(p, 4.8, 3.8, a, 7));
  }
  out.push(`<path class="ink hair" d="${stalks}"/><path class="wash felt"${vars(tone(r, { pc: "--bud-paulownia", spread: 0.04 }))} d="${buds}"/><path class="ink hair" d="${buds}"/>`);
}

function paulowniaTwig(out: Out, r: Rng, parent: { res: Limb; g: number[] }, t: number, a: number, len: number) {
  const twig = branch(out, r, parent, t, [polar(len * 0.5, a), polar(len, a - 0.18)], 0.03, { w0: 9, w1: 5, cap: "blunt", ...PAULOWNIA });
  const n = twig.res.n;
  const tip = twig.res.pts[n];
  const up = rad(-88);
  part(out, gate(twig.res, twig.g, n) + 0.01, tip, () => paulowniaPanicle(out, r, tip, up + (a - up) * 0.22, 102 + r() * 28), bellsFall(tip));
  part(out, 0.62, tip, () => paulowniaCapsules(out, r, tip, up + (a - up) * 0.35, 72));
  part(out, 0.7, tip, () => paulowniaBuds(out, r, tip, up));
  for (const [k, u] of [[0, 0.52], [1, 0.92]] as const) {
    const idx = Math.round(n * u);
    const T = twig.res.pts[idx];
    const gBase = gate(twig.res, twig.g, idx) + 0.02;
    for (const side of [-1, 1]) {
      const d = a + side * rad(68) + rad(22);
      const E = add(T, polar(32, d));
      part(
        out,
        Math.min(0.34, Math.max(gBase, 0.24 + k * 0.03 + r() * 0.03)),
        T,
        () => {
          stalk(out, quad(T, add(lerp(T, E, 0.5), [0, -4]), E), 3, 2, PAULOWNIA, 6);
          paulowniaLeaf(out, r, E, d + rad(18), 84 + r() * 20);
        },
        paulowniaShed(T),
      );
    }
  }
}

export function paulownia(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0.02, 0.16];
  const main = grow(out, gm[0], gm[1], () =>
    limb(out, r, [at([-28, 8]), at([76, -26]), at([192, -54]), at([306, -64]), at([402, -52])], { w0: 36, w1: 13, cap: "blunt", ...PAULOWNIA }),
  );
  const parent = { res: main, g: gm };
  const limbs = [
    branch(out, r, parent, 0.34, [[38, -56], [96, -120], [162, -158]], 0.06, { w0: 18, w1: 8.5, cap: "blunt", ...PAULOWNIA }),
    branch(out, r, parent, 0.6, [[46, 26], [122, 42], [188, 32]], 0.06, { w0: 16, w1: 7.5, cap: "blunt", ...PAULOWNIA }),
  ];
  for (const [j, l] of [parent, ...limbs].entries()) {
    const n = l.res.n;
    for (let i = Math.round(n * 0.44), s = j % 2 ? 1 : -1; i <= n; i += 13 + Math.floor(r() * 4), s = -s) {
      paulowniaTwig(out, r, l, Math.min(1, i / n), angleOf(l.res.pts, Math.min(i, n - 1)) + s * rad(32 + r() * 14), 40 + r() * 18);
    }
  }
}

export function paulowniaDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-120, 160], [-40, 80], [10, 0]], { w0: 18, w1: 10, cap: "blunt", ...PAULOWNIA });
  paulowniaPanicle(out, r, twig.pts[twig.n], rad(-95), 200);
  paulowniaLeaf(out, r, twig.pts[Math.round(twig.n * 0.5)], rad(160), 150);
}

// ---------------------------------------------------------------------------
// 5. Weeping willow (Salix babylonica): an arching bough with wind-swept, rhythmically grouped
// pendulous whips. Narrow falcate-lanceolate blades follow the downward tangent of each whip in
// soft cascading streams rather than sticking out like barbed wire.

const WILLOW = { pc: "--bark-willow" };
const willowShed = fallsAt(0.76, 0.1);
const catkinsFall = fallsAt(0.24, 0.05);

function willowLeaves(out: Out, r: Rng, pts: Pt[], from: number, to: number) {
  const light: { O: Pt; dir: number; L: number; W: number }[] = [];
  const deep: { O: Pt; dir: number; L: number; W: number }[] = [];
  for (let i = from; i < to; i += 2) {
    const tang = angleOf(pts, Math.min(i, pts.length - 2));
    // Slender lanceolate leaves fan gently off the downward flow of the whip (±18°..34°) in two tonal layers.
    const side = i % 4 ? 1 : -1;
    const d = tang + side * rad(18 + r() * 16);
    const b = { O: pts[i], dir: d, L: 38 + r() * 18, W: 0.13 };
    if (i % 4 === 0) deep.push(b);
    else light.push(b);
  }
  if (deep.length) bladeBunch(out, deep, tone(r, { dl: -0.02, spread: 0.05, hue: 8 }));
  if (light.length) bladeBunch(out, light, tone(r, { dl: 0.05, spread: 0.06, hue: 12 }));
}

function populateWhip(out: Out, r: Rng, whip: { res: Limb; g: number[] }) {
  const n = whip.res.n;
  const pts = whip.res.pts;
  for (let i = 5; i < n; i += 6) {
    const p = pts[i];
    const g = gate(whip.res, whip.g, i);
    const tang = angleOf(pts, Math.min(i, n - 1));
    const side = i % 12 < 6 ? 1 : -1;
    part(
      out,
      g + 0.01,
      p,
      () => {
        const c = add(p, polar(8, tang + side * rad(24)));
        shape(out, r, roundPts(c, 2.6, 7.2, tang + side * rad(20), 8), tone(r, { pc: "--catkin-willow", spread: 0.04 }), { deep: 0, ink: false });
      },
      Math.max(g + 0.025, catkinsFall(p)),
    );
    part(out, Math.min(0.34, Math.max(g + 0.02, 0.18 + (i / n) * 0.12)), p, () => willowLeaves(out, r, pts, i, Math.min(n, i + 6)), willowShed(p));
  }
}

function willowWhip(out: Out, r: Rng, parent: { res: Limb; g: number[] }, t: number, len: number, breeze: number) {
  const sway = breeze + (r() - 0.5) * 28;
  const whip = branch(
    out,
    r,
    parent,
    t,
    [
      [sway * 0.12, len * 0.28],
      [sway * 0.62, len * 0.64],
      [sway * 1.08, len],
    ],
    0.08,
    { w0: 2.1, w1: 0.6, cap: "taper", ...WILLOW },
  );
  populateWhip(out, r, whip);
}

export function willow(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0.01, 0.15];
  const bough = grow(out, gm[0], gm[1], () =>
    limb(out, r, [at([-28, 12]), at([84, -26]), at([210, -38]), at([336, -16]), at([442, 24])], { w0: 26, w1: 5.5, cap: "taper", ...WILLOW }),
  );
  const parent = { res: bough, g: gm };
  const upper = branch(out, r, parent, 0.38, [[58, -32], [148, -46], [238, -22]], 0.06, { w0: 10, w1: 3.2, cap: "taper", ...WILLOW });
  const outer = branch(out, r, parent, 0.68, [[46, -14], [112, -8], [168, 18]], 0.06, { w0: 7.5, w1: 2.4, cap: "taper", ...WILLOW });

  // Eleven rhythmically grouped, wind-swept whips of varied lengths.
  for (const [l, knots] of [
    [parent, [0.22, 0.34, 0.54, 0.76, 0.94]],
    [upper, [0.26, 0.52, 0.78, 0.96]],
    [outer, [0.42, 0.92]],
  ] as const) {
    for (const u of knots) {
      const len = 195 + r() * 195 - u * 40;
      willowWhip(out, r, l, u, len, 32 + u * 18);
    }
  }
}

export function willowDetail(out: Out, r: Rng) {
  const whip = limb(out, r, [[0, -160], [10, -60], [18, 40], [34, 150]], { w0: 4, w1: 1.5, cap: "taper", ...WILLOW });
  for (let i = 4; i < whip.n; i += 3) {
    const p = whip.pts[i];
    const d = angleOf(whip.pts, i) + (i % 6 ? 1 : -1) * rad(18);
    blade(out, r, p, d, 72, { W: 0.15, v: tone(r, { spread: 0.05 }), deep: 0.3, rib: "ink hair", hairline: true });
  }
}

// ---------------------------------------------------------------------------
// 6. Moso bamboo (Phyllostachys edulis): three tall, slender, gracefully bowed green culms rising
// along the left margin, ringed at every node with a white waxy bloom band below each ring, and
// tiered feathery foliage branches in the upper canopy. In spring a new shoot rises in spotted
// culm sheaths that wrap around the culm through late spring and shed by early summer.

const CULM = { pc: "--culm-moso" };
const sheathsFall = fallsAt(0.425, 0.04);

function culm(out: Out, r: Rng, B: Pt, ctrl: Pt, tip: Pt, w: number, g: [number, number]) {
  const spine = sample(quad(B, ctrl, tip), 24);
  const nodes: number[] = [];
  const res = grow(out, g[0], g[1], () => {
    const st = stalk(out, (t) => spine[Math.round(t * 24)], w, w * 0.64, tone(r, { ...CULM, spread: 0.03 }), 24);
    let rings = "";
    let bloom = "";
    for (let i = 2; i < 24; i += 2) {
      nodes.push(i);
      const p = spine[i];
      const half = (w * (1 - (i / 24) * 0.36)) / 2;
      const tang = angleOf(spine, i);
      const nrm = polar(half + 1.2, tang + rad(90));
      const down = polar(1, tang + Math.PI);
      // Double nodal ring characteristic of Phyllostachys, with white powder bloom immediately below.
      rings += `M${P1(add(p, nrm))}Q${P1(add(p, mul(down, -2)))} ${P1(sub(p, nrm))}`;
      rings += `M${P1(add(add(p, mul(down, 2.5)), nrm))}Q${P1(add(p, mul(down, 0.8)))} ${P1(sub(add(p, mul(down, 2.5)), nrm))}`;
      bloom += closed([
        add(add(p, nrm), mul(down, 2.8)),
        add(add(p, nrm), mul(down, 8.5)),
        add(sub(p, nrm), mul(down, 8.5)),
        add(sub(p, nrm), mul(down, 2.8)),
      ]);
    }
    out.push(`<path class="wash felt"${vars(tone(r, { pc: "--bloom-moso", spread: 0.02 }))} d="${bloom}"/><path class="ink thin" d="${rings}"/>`);
    return { ...st, pts: spine, n: 24 };
  });
  return { res, nodes, g };
}

// A tiered, forked bamboo branch holding drooping fan-tufts of 4–5 lanceolate leaves in two tonal
// layers (濃淡墨竹), creating soft horizontal foliage clouds in the upper canopy.
function bambooSpray(out: Out, r: Rng, P: Pt, a: number, g: number, scale = 1) {
  const L = (108 + r() * 44) * scale;
  const mid = add(P, polar(L * 0.52, a - 0.08));
  const tip = add(P, polar(L, a + 0.06));
  const fork = add(mid, polar(L * 0.46, a + 0.32));
  part(out, g, P, () => {
    out.push(`<path class="ink thin" d="M${P1(P)}Q${P1(mid)} ${P1(tip)}M${P1(mid)}L${P1(fork)}"/>`);
    const backBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
    const frontBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
    for (const [O, baseDir, count] of [
      [lerp(P, mid, 0.72), a, 4],
      [tip, a + 0.08, 5],
      [fork, a + 0.26, 4],
    ] as const) {
      for (let k = 0; k < count; k++) {
        // Bamboo leaves fan downward and outward in overlapping feathers.
        const fan = rad(52 + k * 20 + (r() - 0.5) * 10);
        const d = Math.min(rad(106), baseDir + fan * 0.62);
        const b = { O, dir: d, L: (46 + r() * 20) * scale, W: 0.155 };
        if (k % 2 === 0) backBlades.push(b);
        else frontBlades.push(b);
      }
    }
    bladeBunch(out, backBlades, tone(r, { dl: -0.03, spread: 0.05, hue: 6 }));
    bladeBunch(out, frontBlades, tone(r, { dl: 0.04, spread: 0.06, hue: 10 }));
  });
}

export function moso(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Three jade-green culms enter from behind the left edge (`x = -24`) and sweep inward and upward.
  const stands: [Pt, Pt, Pt, number, [number, number]][] = [
    [at([-24, -48]), at([58, -295]), at([195, -515]), 21, [0.01, 0.16]],
    [at([-24, -12]), at([86, -255]), at([258, -465]), 18.5, [0.03, 0.19]],
    [at([-24, 22]), at([112, -205]), at([315, -405]), 16, [0.05, 0.22]],
  ];
  for (const [B, ctrl, tip, w, g] of stands) {
    const c = culm(out, r, B, ctrl, tip, w, g);
    for (const i of c.nodes.filter((i) => i >= 10)) {
      const p = c.res.pts[i];
      const tang = angleOf(c.res.pts, i);
      const a = tang + rad(36 + r() * 18);
      bambooSpray(out, r, p, a, gate(c.res, c.g, i) + 0.015, 0.88 + (i / 24) * 0.22);
    }
  }
  // The April shoot: rises diagonally from behind the left border in spotted culm sheaths.
  const shootW = 16.5;
  const shoot = culm(out, r, at([-22, 6]), at([56, -185]), at([182, -355]), shootW, [0.16, 0.34]);
  for (const i of shoot.nodes) {
    const p = shoot.res.pts[i];
    const g = gate(shoot.res, shoot.g, i) + 0.012;
    const d = angleOf(shoot.res.pts, i);
    const half = (shootW * (1 - (i / 24) * 0.36)) / 2 + 1.2;
    const nrm = polar(half, d + rad(90));
    const side = i % 2 ? 1 : -1;
    part(
      out,
      g,
      p,
      () => {
        const top = add(p, polar(34, d));
        const bladeTip = add(top, polar(12, d + side * rad(28)));
        const pts: Pt[] = [
          sub(p, nrm),
          add(sub(lerp(p, top, 0.55), mul(nrm, 0.82)), polar(2, d)),
          add(top, mul(nrm, -0.25 * side)),
          bladeTip,
          add(top, mul(nrm, 0.35 * side)),
          add(add(lerp(p, top, 0.55), mul(nrm, 0.82)), polar(2, d)),
          add(p, nrm),
        ];
        shape(out, r, pts, tone(r, { pc: "--sheath-moso", spread: 0.04 }), { deep: 0.32 });
      },
      sheathsFall(p),
    );
  }
}

export function mosoDetail(out: Out, r: Rng) {
  stalk(out, (t) => [0, 200 - t * 400], 30, 26, tone(r, CULM), 10);
  let rings = "";
  for (const y of [120, 0, -120]) rings += `M-15 ${y}Q0 ${y + 3} 15 ${y}M-15 ${y + 3}Q0 ${y + 5} 15 ${y + 3}`;
  out.push(`<path class="ink thin" d="${rings}"/>`);
  bambooSpray(out, r, [0, -120], rad(-42), 0, 1.15);
  bambooSpray(out, r, [0, 0], rad(-138), 0, 1.05);
}

// ---------------------------------------------------------------------------
// 7. Japanese wisteria (Wisteria floribunda): two gnarled, twisted woody lianas plunging and
// arching diagonally downward from the top border (`base = [0, 0]`), dropping seven long tapering
// curtains of violet pea-flowers in spring (with the rachis inside `part()` so zero bare wires
// linger after petal fall!), odd-pinnate leaf sprays, and velvety autumn/winter seed pods.

const VINE = { pc: "--bark-wisteria" };
const wisteriaShed = fallsAt(0.78, 0.08);
const racemesFall = fallsAt(0.425, 0.03);

// A pendulous wisteria raceme: the central rachis opens with the first segment and falls with it,
// so no bare axis wire stays behind after `racemesFall`.
export function raceme(out: Out, r: Rng, T: Pt, L: number, g: number, leave?: (p: Pt) => number) {
  const bend = (r() - 0.5) * 0.26;
  const axis = sample((t) => add(T, [Math.sin(t * 1.8) * L * bend * 0.35, t * L]), 16);
  const dropAt = leave?.(T);
  for (let seg = 0; seg < 4; seg++) {
    const i0 = seg * 4;
    const P = axis[i0];
    part(
      out,
      g + seg * 0.015,
      P,
      () => {
        const subAxis = axis.slice(i0, Math.min(axis.length, i0 + 5));
        out.push(`<path class="ink hair" d="${line(subAxis)}"/>`);
        let standards = "";
        let wings = "";
        for (let i = i0; i < i0 + 4; i++) {
          const t = i / 16;
          const w = L * 0.135 * (1 - t * 0.68);
          const count = t < 0.72 ? 3 : 2;
          for (let m = 0; m < count; m++) {
            const side = m === 0 ? -1 : m === 1 ? 1 : (i % 2 ? 0.35 : -0.35);
            const c = add(axis[i], [side * w * (0.42 + r() * 0.25), 3 + m * 2]);
            // Rounded standard banner above cupped keel/wings below.
            standards += closed(roundPts(c, w * 0.44, w * 0.36, side * 0.35, 8));
            wings += closed(roundPts(add(c, [side * w * 0.08, w * 0.28]), w * 0.26, w * 0.34, side * 0.2, 7));
          }
        }
        out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-wisteria", dl: 0.04 + seg * 0.02, spread: 0.04 }))} d="${standards}"/><path class="ink hair petal-edge" d="${standards}"/>`);
        out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-wisteria", dl: -0.05 + seg * 0.015, spread: 0.03 }))} d="${wings}"/><path class="ink hair petal-edge" d="${wings}"/>`);
      },
      dropAt !== undefined ? dropAt + seg * 0.003 : undefined,
    );
  }
}

function wisteriaLeaf(out: Out, r: Rng, T: Pt, a: number, L: number) {
  const ctrl = add(lerp(T, add(T, polar(L, a)), 0.5), [L * 0.08, 0]);
  const tip = add(T, polar(L, a));
  const rachis = sample(quad(T, ctrl, tip), 8);
  const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
  for (let k = 1; k <= 6; k++) {
    const O = rachis[k];
    const tang = angleOf(rachis, k);
    const sc = Math.sin(Math.PI * (k / 7) ** 0.75);
    for (const side of [-1, 1]) {
      blades.push({ O, dir: tang + side * rad(52), L: L * (0.18 + 0.1 * sc), W: 0.4 });
    }
  }
  blades.push({ O: tip, dir: angleOf(rachis, 7), L: L * 0.25, W: 0.4 });
  out.push(`<path class="ink hair" d="${line(rachis)}"/>`);
  bladeBunch(out, blades, tone(r, { spread: 0.06, hue: 10 }));
}

function wisteriaPod(out: Out, r: Rng, T: Pt, L: number, lean = 0.12) {
  const curve = 0.22 + (r() - 0.5) * 0.18;
  const at = (u: number, w: number): Pt =>
    add(T, rot([Math.sin(u * 2.4) * L * curve * 0.22 + w, 10 + u * L], lean));
  const up: Pt[] = [];
  const dn: Pt[] = [];
  for (let k = 0; k <= 8; k++) {
    const u = k / 8;
    const w = 8 * Math.sin(Math.PI * Math.min(1, u * 1.08)) ** 0.55 * (k % 2 ? 0.8 : 1);
    up.push(at(u, -w));
    dn.push(at(u, w));
  }
  out.push(`<path class="ink hair" d="M${P1(T)}L${P1(at(0, 0))}"/>`);
  shape(out, r, [...up, ...dn.reverse()], tone(r, { pc: "--pod-wisteria", spread: 0.04 }), { deep: 0.32 });
}

export function wisteria(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gv: [number, number] = [0.02, 0.2];
  const vine = grow(out, gv[0], gv[1], () =>
    limb(
      out,
      r,
      [at([-40, -14]), at([35, 65]), at([145, 130]), at([255, 165])],
      { w0: 22, w1: 7, cap: "taper", ...VINE },
    ),
  );
  const mainLiana = { res: vine, g: gv };
  const vineB = branch(out, r, mainLiana, 0.24, [[-48, 32], [-108, 62], [-152, 86]], 0.08, { w0: 14, w1: 5, cap: "taper", ...VINE });

  // Seven long cascading violet raceme curtains (`L = 220..340`), pinnate foliage, and velvety pods.
  const stations: [{ res: Limb; g: number[] }, number, number][] = [
    [vineB, 0.82, 235],
    [vineB, 0.44, 285],
    [mainLiana, 0.16, 260],
    [mainLiana, 0.36, 320],
    [mainLiana, 0.54, 305],
    [mainLiana, 0.74, 270],
    [mainLiana, 0.92, 225],
  ];
  stations.forEach(([liana, u, baseL], k) => {
    const n = liana.res.n;
    const i = Math.round(n * u);
    const T = add(liana.res.pts[i], [0, 6]);
    const g = gate(liana.res, liana.g, i);
    const L = baseL + r() * 20;
    raceme(out, r, T, L, Math.max(g + 0.018, 0.18 + k * 0.006), racemesFall);
    const leafIdx = Math.max(2, i - 2);
    const leafT = add(liana.res.pts[leafIdx], [0, 4]);
    const leafG = gate(liana.res, liana.g, leafIdx);
    part(
      out,
      Math.min(0.34, Math.max(leafG + 0.025, 0.24 + r() * 0.05)),
      leafT,
      () => wisteriaLeaf(out, r, leafT, rad(88 + (k - 3) * 8), 118 + r() * 32),
      wisteriaShed(leafT),
    );
    if (k === 1 || k === 3 || k === 5) {
      const podLean = (k === 3 ? -1 : 1) * (0.14 + r() * 0.08);
      part(out, 0.5 + k * 0.008, T, () => {
        wisteriaPod(out, r, add(T, [8, 0]), 110 + r() * 32, podLean);
        if (k === 3) wisteriaPod(out, r, add(T, [-4, 2]), 82 + r() * 20, -podLean * 1.2);
      });
    }
  });
}

export function wisteriaDetail(out: Out, r: Rng) {
  limb(out, r, [[-140, -168], [-10, -148], [140, -160]], { w0: 20, w1: 9, cap: "taper", ...VINE });
  raceme(out, r, [-30, -146], 310, 0);
  wisteriaLeaf(out, r, [70, -150], rad(80), 210);
}

// ---------------------------------------------------------------------------
// 8. Chocolate vine (Akebia quinata): three graceful twining stems cascading and swaying downward
// from the top edge (`base = [0, 0]`), clothed in five-leaflet notched palms, dangling wine-purple
// flowers in early spring, and plump purple sausage pods in autumn.

const AKEBIA = { pc: "--bark-akebia" };
const akebiaShed = fallsAt(0.8, 0.1);
const akebiaFlowersFall = fallsAt(0.26, 0.06);

export function akebiaLeaf(out: Out, r: Rng, T: Pt, a: number, L: number) {
  const E = add(T, polar(L * 0.68, a));
  out.push(`<path class="ink hair" d="M${P1(T)}L${P1(E)}"/>`);
  for (const k of [-2, -1, 0, 1, 2]) {
    const d = a + k * rad(35);
    const l = L * (1 - Math.abs(k) * 0.08);
    const p0 = add(E, polar(l * 0.18, d));
    out.push(`<path class="ink hair" d="M${P1(E)}L${P1(p0)}"/>`);
    blade(out, r, p0, d, l * 0.85, {
      W: 0.48,
      prof: (q) => Math.sin(Math.PI * Math.min(1, q) ** 1.3) ** 0.75 * (q > 0.88 ? 0.76 : 1),
      v: tone(r, { spread: 0.06, hue: 8 }),
      deep: 0.3,
      rib: "ink hair",
      hairline: true,
    });
  }
}

export function akebiaFlowers(out: Out, r: Rng, T: Pt, L: number) {
  const axis = sample((t) => add(T, [Math.sin(t * 2.2) * 7, t * L]), 6);
  let cups = "";
  let stamens = "";
  axis.forEach((p, i) => {
    if (i === 0) return;
    const R = i <= 2 ? 9.5 : 5.2 - i * 0.35;
    for (let k = 0; k < 3; k++) {
      const a = rad(90 + k * 120 + i * 18);
      cups += closed(roundPts(add(p, polar(R * 0.58, a)), R * 0.56, R * 0.44, a, 7));
    }
    stamens += closed(roundPts(p, R * 0.22, R * 0.22, 0, 6));
  });
  out.push(`<path class="ink hair" d="${line(axis)}"/><path class="wash petal"${vars(tone(r, { pc: "--flower-akebia", spread: 0.04 }))} d="${cups}"/><path class="ink hair petal-edge" d="${cups}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--bud-paulownia", dl: 0.08 }))} d="${stamens}"/>`);
}

function akebiaPods(out: Out, r: Rng, T: Pt) {
  let pods = "";
  let seams = "";
  for (const [side, tilt, sc] of [
    [-1, -0.22, 1],
    [1, 0.26, 0.88],
  ] as const) {
    const C = add(T, [side * 12, 34 * sc]);
    pods += closed(roundPts(C, 12 * sc, 30 * sc, tilt, 12));
    seams += `M${P1(add(C, rot([0, -24 * sc], tilt)))}Q${P1(add(C, rot([side * 3, 0], tilt)))} ${P1(add(C, rot([0, 24 * sc], tilt)))}`;
  }
  out.push(`<path class="ink hair" d="M${P1(T)}L${P1(add(T, [-10, 8]))}M${P1(T)}L${P1(add(T, [10, 8]))}"/>`);
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--pod-akebia", spread: 0.04 }))} d="${pods}"/><path class="ink hair" d="${pods}"/><path class="ink hair" style="stroke:var(--bg);opacity:.7" d="${seams}"/>`);
}

export function akebia(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const vines: [Pt[], number, number, [number, number]][] = [
    [[at([-20, -10]), at([-54, 92]), at([-22, 210]), at([-62, 315]), at([-38, 385])], 5.2, 1.8, [0.03, 0.21]],
    [[at([15, -10]), at([-4, 105]), at([28, 225]), at([-2, 340]), at([18, 435])], 5.8, 2.0, [0.04, 0.23]],
    [[at([45, -10]), at([78, 86]), at([52, 188]), at([88, 275]), at([64, 345])], 4.8, 1.6, [0.05, 0.24]],
  ];
  vines.forEach(([pts, w0, w1, gv], j) => {
    const res = grow(out, gv[0], gv[1], () => limb(out, r, pts, { w0, w1, cap: "taper", ...AKEBIA }));
    const n = res.n;
    for (let k = 0; k < 6; k++) {
      const u = 0.14 + k * 0.16;
      const i = Math.round(n * u);
      const T = res.pts[i];
      const g = gate(res, gv, i);
      if (k % 2 === 0 && k < 5) {
        part(out, g + 0.015, T, () => akebiaFlowers(out, r, T, 48 + r() * 18), Math.max(g + 0.035, akebiaFlowersFall(T)));
      }
      const side = (j + k) % 2 ? 1 : -1;
      const a = rad(90 + side * (26 + r() * 18));
      part(
        out,
        Math.min(0.34, Math.max(g + 0.02, 0.2 + r() * 0.06)),
        T,
        () => akebiaLeaf(out, r, T, a, 38 + r() * 12),
        k % 2 ? akebiaShed(T) : undefined,
      );
      if ((j === 0 && k === 2) || (j === 1 && k === 3)) {
        part(out, 0.64, T, () => akebiaPods(out, r, T), 0.86 + r() * 0.04);
      }
    }
  });
}

export function akebiaDetail(out: Out, r: Rng) {
  limb(out, r, [[-160, -120], [0, -106], [160, -114]], { w0: 8, w1: 3.5, cap: "taper", ...AKEBIA });
  akebiaFlowers(out, r, [-60, -110], 140);
  akebiaLeaf(out, r, [60, -110], rad(80), 90);
}

// ---------------------------------------------------------------------------
// 9. Peony (Paeonia lactiflora): a lush, asymmetric mound of curving red-flushed stems on the
// pond bank (`y <= 0`), richly clothed in three tiers of biternate compound leaves that conceal
// the lower stems, crowned by large double blush-pink goblets and round rose buds at varied
// heights, then diverging green seed follicles.

const peonyDies = 0.84;
const peonyShed = fallsAt(0.76, 0.05);

function cupFlower(out: Out, r: Rng, C: Pt, R: number, pc: string, tilt = 0) {
  const toW = (p: Pt) => add(C, rot(p, tilt));
  // Outer guard petals, mid ruffled petals, inner cupped crown, and warm golden stamen heart.
  for (const [ring, n, reach, size, dl] of [
    [0, 9, 0.64, 0.48, -0.04],
    [1, 10, 0.42, 0.4, 0.01],
    [2, 8, 0.2, 0.31, 0.05],
  ] as const) {
    let petals = "";
    for (let k = 0; k < n; k++) {
      const a = (k / n) * 6.28 + ring * 0.42 + r() * 0.18;
      const c = toW([Math.cos(a) * R * reach, Math.sin(a) * R * reach * 0.56 - R * ring * 0.13]);
      petals += closed(roundPts(c, R * size, R * size * 0.72, a + tilt, 9));
    }
    out.push(`<path class="wash petal"${vars(tone(r, { pc, dl, spread: 0.03 }))} d="${petals}"/><path class="ink hair petal-edge" d="${petals}"/>`);
  }
  const core = toW([0, -R * 0.24]);
  let stamens = "";
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * 6.28;
    stamens += closed(roundPts(add(core, [Math.cos(a) * R * 0.1, Math.sin(a) * R * 0.05]), R * 0.04, R * 0.03, a, 5));
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--stamen-plum", dl: 0.04 }))} d="${stamens}"/>`);
}

function peonyBud(out: Out, r: Rng, C: Pt, R: number, dir: number) {
  const ball = add(C, polar(R * 0.3, dir));
  shape(out, r, roundPts(ball, R * 0.58, R * 0.54, dir, 9), tone(r, { pc: "--flower-peony", dl: -0.02, spread: 0.03 }), { deep: 0.3, ink: false });
  out.push(`<path class="ink hair petal-edge" d="${closed(roundPts(ball, R * 0.58, R * 0.54, dir, 9))}"/>`);
  let sepals = "";
  for (const s of [-1, 1]) {
    const a = dir + s * rad(42);
    const tip = add(C, polar(R * 0.72, a - s * 0.25));
    sepals += closed([C, add(lerp(C, tip, 0.5), polar(R * 0.22, a + s * rad(90))), tip, lerp(C, ball, 0.6)]);
  }
  out.push(`<path class="wash"${vars(tone(r, { spread: 0.04 }))} d="${sepals}"/><path class="ink hair" d="${sepals}"/>`);
}

function peonyLeaf(out: Out, r: Rng, T: Pt, a: number, L: number) {
  // Clamp leaf direction so basal leaves never droop below the bank line.
  const safeA = Math.sin(a) > -0.18 ? (Math.cos(a) >= 0 ? rad(-18) : rad(-162)) : a;
  const F = add(T, polar(L * 0.28, safeA));
  out.push(`<path class="ink hair" style="stroke:var(--stem-peony)" d="M${P1(T)}L${P1(F)}"/>`);
  for (const b of [-0.56, 0, 0.56]) {
    const G = add(F, polar(L * 0.2, safeA + b));
    out.push(`<path class="ink hair" style="stroke:var(--stem-peony)" d="M${P1(F)}L${P1(G)}"/>`);
    for (const c of [-0.46, 0, 0.46]) {
      blade(out, r, G, safeA + b + c, L * 0.38, { W: 0.32, v: tone(r, { spread: 0.05, hue: 8 }), deep: 0.32, rib: "ink hair", hairline: true });
    }
  }
}

export function peony(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Stems originate behind the bank edge (`x = -18`) and sweep outward over the shore.
  const stems: [number, Pt, Pt, "flower" | "bud" | "foliage", number][] = [
    [-22, [96, -112], [188, -182], "bud", 30],
    [-16, [132, -132], [256, -212], "flower", 52],
    [-10, [126, -86], [224, -138], "foliage", 0],
    [-4, [172, -120], [328, -196], "flower", 58],
    [1, [178, -74], [302, -118], "foliage", 0],
    [5, [208, -78], [386, -134], "flower", 48],
    [8, [196, -38], [354, -72], "bud", 28],
  ];
  stems.forEach(([y0, ctrl, tip, kind, R], k) => {
    const spine = sample(quad(at([-18, y0]), at(ctrl), at(tip)), 12);
    const g: [number, number] = [0.08 + k * 0.006, 0.22 + k * 0.006];
    const stem = grow(out, g[0], g[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 12)], 6.2, 3.4, tone(r, { pc: "--stem-peony", spread: 0.04 }), 12), pts: spine, n: 12 }), peonyDies);
    for (const [idx, u] of [[0, 0.36], [1, 0.6], [2, 0.82]] as const) {
      const i = Math.round(12 * u);
      const T = spine[i];
      const side = (k + idx) % 2 ? 1 : -1;
      const d = angleOf(spine, i) + side * rad(46 - idx * 6);
      part(out, gate(stem, g, i) + 0.018, T, () => peonyLeaf(out, r, T, d, (124 - idx * 12) + r() * 16), peonyShed(T));
    }
    const top = spine[12];
    const topDir = angleOf(spine, 11);
    const topG = gate(stem, g, 12) + 0.015;
    if (kind === "flower") {
      part(out, Math.max(topG, 0.27 + k * 0.008), top, () => cupFlower(out, r, add(top, [0, -10]), R, "--flower-peony", (topDir + rad(90)) * 0.35), 0.43 + r() * 0.03);
      part(
        out,
        0.46,
        top,
        () => {
          let f = "";
          for (const d of [-0.55, 0, 0.55]) f += closed(roundPts(add(top, polar(13, topDir + d)), 13, 7, topDir + d, 8));
          out.push(`<path class="wash"${vars(tone(r, { pc: "--follicle-peony", spread: 0.04 }))} d="${f}"/><path class="ink hair" d="${f}"/>`);
        },
        peonyDies - 0.01,
      );
    } else if (kind === "bud") {
      part(out, Math.max(topG, 0.25 + k * 0.008), top, () => peonyBud(out, r, top, R, topDir), 0.43 + r() * 0.03);
    }
  });
}

export function peonyDetail(out: Out, r: Rng) {
  cupFlower(out, r, [0, -40], 130, "--flower-peony");
  peonyLeaf(out, r, [-60, 160], rad(-150), 180);
}

// ---------------------------------------------------------------------------
// 10. Hydrangea (Hydrangea macrophylla): a cascading multi-stemmed shrub mound reaching in from
// the shore bank (`x = -18`), clothed in opposite pairs of broad serrated leaves, crowned by 5
// plush globose mophead corymbs at staggered heights that open violet-blue in the June plum rain
// and fade in place to antique rose-parchment heads for autumn and winter.

const hydrangeaShed = fallsAt(0.74, 0.08);

function mophead(out: Out, r: Rng, C: Pt, R: number, pc: string, dl: number) {
  let florets = "";
  let eyes = "";
  const count = 38;
  for (let k = 0; k < count; k++) {
    const a = k * rad(137.5);
    const q = Math.sqrt((k + 0.5) / count);
    const c = add(C, [Math.cos(a) * R * q, Math.sin(a) * R * q * 0.66 - R * 0.24 * (1 - q)]);
    const s = R * 0.18 * (0.86 + (Math.sin(a) + 1) * 0.12);
    const rot0 = (k * 0.4) % 1.57;
    for (let j = 0; j < 4; j++) {
      const fa = rot0 + j * rad(90);
      florets += closed(roundPts(add(c, polar(s * 0.56, fa)), s * 0.52, s * 0.4, fa, 6));
    }
    eyes += closed(roundPts(c, s * 0.13, s * 0.13, 0, 5));
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc, dl, spread: 0.05, hue: 10 }))} d="${florets}"/><path class="ink hair petal-edge" d="${florets}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc, dl: dl - 0.1, spread: 0.02 }))} d="${eyes}"/>`);
}

export function hydrangea(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Woody stems originate behind the left bank border (`x = -18`) and arch outward over the shore.
  const stems: [number, Pt, Pt, number][] = [
    [-22, [72, -108], [148, -176], 52],
    [-16, [112, -122], [218, -198], 64],
    [-10, [98, -84], [184, -138], 0],
    [-4, [152, -104], [286, -168], 70],
    [1, [154, -66], [262, -106], 0],
    [5, [180, -70], [334, -122], 60],
    [8, [148, -32], [268, -58], 50],
  ];
  stems.forEach(([y0, ctrl, tip, headR], k) => {
    const g = [0.08 + k * 0.006, 0.22 + k * 0.006];
    const stem = grow(out, g[0], g[1], () => limb(out, r, [at([-18, y0]), at(ctrl), at(tip)], { w0: 7.5, w1: 4.6, cap: "blunt", pc: "--bark-hydrangea" }));
    const n = stem.n;
    for (const u of [0.46, 0.72, 0.92]) {
      const i = Math.round(n * u);
      const T = stem.pts[i];
      for (const side of [-1, 1]) {
        const rawD = angleOf(stem.pts, i) + side * rad(54);
        // Keep leaves from pointing downward below the bank line.
        const d = Math.sin(rawD) > -0.18 ? (Math.cos(rawD) >= 0 ? rad(-18) : rad(-162)) : rawD;
        part(
          out,
          gate(stem, g, i) + 0.018,
          T,
          () => blade(out, r, T, d, 68 + r() * 16, { W: 0.58, v: tone(r, { spread: 0.05, hue: 8 }), veins: 4, deep: 0.35, rib: "ink hair", hairline: true }),
          hydrangeaShed(T),
        );
      }
    }
    if (headR > 0) {
      const top = add(stem.pts[n], [0, -24]);
      part(out, 0.45, stem.pts[n], () => mophead(out, r, top, headR + r() * 6, "--flower-hydrangea-dry", 0));
      part(out, 0.45, stem.pts[n], () => mophead(out, r, top, headR + r() * 6, "--flower-hydrangea", ((k % 3) - 1) * 0.03), 0.66 + r() * 0.04, true);
    }
  });
}

export function hydrangeaDetail(out: Out, r: Rng) {
  mophead(out, r, [0, -30], 150, "--flower-hydrangea", 0);
  blade(out, r, [-40, 120], rad(-160), 160, { W: 0.58, v: tone(r, { spread: 0.05 }), veins: 5, deep: 0.35, rib: "ink hair", hairline: true });
}

// ---------------------------------------------------------------------------
// 11. Red spider lily (Lycoris radiata): five slender, gently flexing scapes at staggered heights
// arching out from the bank edge (`x = -18`) in late summer (`0.57 -> 0.61`), crowned with radiant
// scarlet umbels of strongly recurved wavy tepals and long upturned catenary stamens. Three-point
// arching basal strap leaves curve gracefully out from the bank from autumn through early spring.

function lilyLeaves(out: Out, r: Rng, B: Pt) {
  let fill = "";
  let ink = "";
  for (let k = 0; k < 14; k++) {
    const u = k / 13;
    const O = add(B, [-18, -14 + u * 22]);
    const dir = rad(-52 + u * 44 + (r() - 0.5) * 4);
    const L = 128 + Math.sin(u * Math.PI) * 52 + r() * 16;
    const mid = add(O, polar(L * 0.54, dir - rad(12)));
    const tip = add(O, add(polar(L, dir + rad(14)), [0, 14 + u * 12]));
    const sp = sample(quad(O, mid, tip), 8);
    const up: Pt[] = [];
    const dn: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const s = i / 8;
      const hw = 4.6 * Math.sin(Math.PI * Math.min(1, s) ** 0.78) ** 0.78;
      const nrm = polar(hw, angleOf(sp, Math.min(i, 7)) + rad(90));
      up.push(sub(sp[i], nrm));
      dn.push(add(sp[i], nrm));
    }
    fill += closed([...up, tip, ...dn.slice(0, -1).reverse()]);
    ink += line(dn);
  }
  out.push(`<path class="wash"${vars(tone(r, { dl: -0.04, spread: 0.05 }))} d="${fill}"/><path class="ink hair" d="${ink}"/>`);
}

function lilyUmbel(out: Out, r: Rng, C: Pt, R: number) {
  let tepals = "";
  let stamens = "";
  let anthers = "";
  let pedicels = "";
  const florets = 7;
  for (let k = 0; k < florets; k++) {
    const a = rad(-168 + (k / (florets - 1)) * 156 + (r() - 0.5) * 8);
    const F = add(C, polar(R * 0.32, a));
    pedicels += `M${P1(C)}L${P1(F)}`;
    for (let j = 0; j < 6; j++) {
      const t = a + rad(-48 + j * 19);
      const mid = add(F, polar(R * 0.22, t + rad(18)));
      const tip = add(F, polar(R * 0.4, t));
      const curl = add(tip, polar(R * 0.15, t + rad(135)));
      tepals += closed([F, add(mid, polar(R * 0.036, t + rad(90))), tip, curl, sub(mid, polar(R * 0.025, t + rad(90)))]);
    }
    for (let j = 0; j < 6; j++) {
      const t = a + rad(-26 + j * 10.5);
      // Long sweeping catenary stamens that dip slightly and curve up at the tip.
      const ctrl = add(F, polar(R * 0.46, t + 0.14));
      const E = add(F, polar(R * 0.84, t - 0.22));
      stamens += `M${P1(F)}Q${P1(ctrl)} ${P1(E)}`;
      anthers += closed(roundPts(E, 1.8, 1.1, t, 5));
    }
  }
  out.push(`<path class="ink hair" d="${pedicels}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-lycoris", spread: 0.04 }))} d="${tepals}"/><path class="ink hair petal-edge" d="${tepals}"/>`);
  out.push(`<path class="ink hair" style="stroke:var(--flower-lycoris)" d="${stamens}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--flower-lycoris", dl: -0.08 }))} d="${anthers}"/>`);
}

export function lycoris(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  part(out, 0, base, () => lilyLeaves(out, r, base), 0.24, true);
  // Five slender scapes arch outward from behind the bank border (`x = -18`) at staggered heights.
  const scapes: [number, Pt, Pt, number][] = [
    [-12, [58, -92], [122, -158], 74],
    [-6, [84, -112], [172, -192], 86],
    [-1, [112, -124], [222, -208], 90],
    [4, [132, -88], [254, -148], 78],
    [8, [148, -96], [288, -168], 82],
  ];
  scapes.forEach(([y0, ctrl, tip, R], k) => {
    const spine = sample(quad(at([-18, y0]), at(ctrl), at(tip)), 8);
    const g: [number, number] = [0.57 + k * 0.004, 0.61 + k * 0.004];
    grow(out, g[0], g[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 8)], 4.8, 3.4, tone(r, { pc: "--stem-lycoris", spread: 0.03 }), 8), pts: spine, n: 8 }), 0.72);
    const top = spine[8];
    part(out, g[1], top, () => lilyUmbel(out, r, top, R), 0.71 + r() * 0.01);
  });
  part(out, 0.83, base, () => lilyLeaves(out, r, base));
}

export function lycorisDetail(out: Out, r: Rng) {
  lilyUmbel(out, r, [0, 0], 220);
}

// ---------------------------------------------------------------------------
// 12. Rabbit-ear iris (Iris laevigata): emergent in the pond's shallows. An arching fountain of
// grey-green sword blades and tall stems bearing deep royal-violet flowers with three broad
// drooping falls marked by a white dagger signal and three upright rabbit-ear standards.

function irisFlower(out: Out, r: Rng, C: Pt, R: number) {
  let falls = "";
  let standards = "";
  let signals = "";
  // Three drooping outer falls (left, front-center, right) and three erect inner standards ("rabbit ears").
  for (const [dx, dy, wSc, lSc, ang] of [
    [-0.78, 0.18, 0.36, 0.96, rad(148)],
    [0, 0.34, 0.44, 1.04, rad(90)],
    [0.78, 0.18, 0.36, 0.96, rad(32)],
  ] as const) {
    const base = add(C, [dx * R * 0.18, -R * 0.08]);
    const waist = add(base, [dx * R * 0.32, dy * R * 0.2]);
    const tip = add(base, polar(R * lSc, ang));
    const nrm = polar(R * wSc, ang + rad(90));
    const belly = lerp(waist, tip, 0.56);
    falls += closed([base, add(waist, mul(nrm, 0.45)), add(belly, nrm), tip, sub(belly, nrm), sub(waist, mul(nrm, 0.45))]);
    const sigTip = lerp(waist, tip, 0.58);
    const sigN = mul(nrm, 0.24);
    signals += closed([base, add(lerp(base, sigTip, 0.5), sigN), sigTip, sub(lerp(base, sigTip, 0.5), sigN)]);
  }
  for (const [sx, sang, slen] of [
    [-0.36, rad(-108), 0.78],
    [0, rad(-90), 0.86],
    [0.36, rad(-72), 0.78],
  ] as const) {
    const sBase = add(C, [sx * R * 0.22, -R * 0.06]);
    const sTip = add(sBase, polar(R * slen, sang));
    const sMid = lerp(sBase, sTip, 0.52);
    const sN = polar(R * 0.2, sang + rad(90));
    standards += closed([sBase, add(sMid, sN), sTip, sub(sMid, sN)]);
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-iris", spread: 0.04 }))} d="${falls}"/><path class="ink hair petal-edge" d="${falls}"/>`);
  out.push(`<path class="wash"${vars({ pc: "--signal-iris" })} d="${signals}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-iris", dl: 0.05, spread: 0.03 }))} d="${standards}"/><path class="ink hair petal-edge" d="${standards}"/>`);
}

export function iris(out: Out, r: Rng, base: Pt) {
  const swords = 11;
  for (let k = 0; k < swords; k++) {
    const u = k - (swords - 1) / 2;
    const B = add(base, [u * 8.5, 0]);
    const H = 290 + (1 - Math.abs(u) / 6) * 145 + r() * 35;
    const lean = rad(-90 + u * 5.6);
    const spine = sample((t) => add(B, add(polar(H * t, lean), [t * t * u * 11, t * t * Math.abs(u) * 3])), 10);
    grow(out, 0.08 + k * 0.005, 0.2 + k * 0.005, () => ({ ...stalk(out, (t) => spine[Math.round(t * 10)], 13.5, 1.4, tone(r, { spread: 0.04 }), 10), pts: spine, n: 10 }), 0.82 + r() * 0.03);
  }
  const scapes: [number, number, number, number][] = [
    [-26, -95, 365, 52],
    [4, -89, 420, 58],
    [30, -83, 330, 48],
  ];
  scapes.forEach(([dx, deg, H, R], k) => {
    const B = add(base, [dx, 0]);
    const spine = sample((t) => add(B, add(polar(H * t, rad(deg)), [Math.sin(t * Math.PI) * (k - 1) * 8, 0])), 8);
    const g: [number, number] = [0.14 + k * 0.015, 0.25 + k * 0.015];
    grow(out, g[0], g[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 8)], 4.5, 3.2, tone(r, { spread: 0.03 }), 8), pts: spine, n: 8 }), 0.61);
    const top = spine[8];
    part(out, g[1] + 0.015, top, () => irisFlower(out, r, add(top, [0, -8]), R), 0.56 + r() * 0.02);
    part(out, 0.57, top, () => shape(out, r, roundPts(add(top, [0, -18]), 9, 22, 0, 9), tone(r, { pc: "--capsule-iris", spread: 0.04 }), { deep: 0.3 }), 0.605);
  });
}

export function irisDetail(out: Out, r: Rng) {
  irisFlower(out, r, [0, 0], 150);
}

// ---------------------------------------------------------------------------
// 13. Lotus (Nelumbo nucifera): emergent from the pond. Cupped peltate shield leaves with
// undulating wavy margins, central pale navel (荷葉臍), and dichotomously forked veins; a rolled
// young scroll leaf; tall gently curving scapes lifting multi-layered pink blossoms, a pointed
// rose bud, and flat-topped seed pods. In winter, natural curved broken stalks bow toward the
// water with nodding dry brown seed pods and a tattered dry leaf remnant.

function lotusLeaf(out: Out, r: Rng, C: Pt, R: number, tilt: number) {
  const ph1 = r() * 6.28;
  const ph2 = r() * 6.28;
  const n = 40;
  const rim: Pt[] = [];
  const waveAt = (a: number) => 1 + 0.065 * Math.sin(a * 7 + ph1) + 0.032 * Math.cos(a * 13 + ph2);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * 6.28;
    const w = waveAt(a);
    // Cupped funnel profile: the rim rises and dips vertically with each marginal wave.
    const cupLift = -R * 0.09 * Math.sin(a * 7 + ph1);
    rim.push(add(C, [Math.cos(a) * R * w, Math.sin(a) * R * w * tilt + cupLift]));
  }
  const navel = add(C, [0, R * tilt * 0.14]);
  shape(out, r, rim, tone(r, { spread: 0.05, hue: 8 }), { deep: 0.38, deepAbout: navel, ink: false });

  // Dichotomously forked radiating veins from the central peltate navel out to the undulating rim.
  let veins = "";
  const spokes = 14;
  for (let k = 0; k < spokes; k++) {
    const a = (k / spokes) * 6.28 + 0.12;
    const w = waveAt(a);
    const forkPt = add(C, [Math.cos(a) * R * w * 0.68, Math.sin(a) * R * w * 0.68 * tilt - R * 0.05 * Math.sin(a * 7 + ph1)]);
    const midPt = lerp(navel, forkPt, 0.52);
    veins += `M${P1(navel)}Q${P1(add(midPt, [0, -2]))} ${P1(forkPt)}`;
    for (const s of [-1, 1]) {
      const a2 = a + s * 0.11;
      const w2 = waveAt(a2);
      const tipPt = add(C, [Math.cos(a2) * R * w2 * 0.94, Math.sin(a2) * R * w2 * 0.94 * tilt - R * 0.08 * Math.sin(a2 * 7 + ph1)]);
      veins += `M${P1(forkPt)}L${P1(tipPt)}`;
    }
  }
  out.push(`<path class="ink hair" d="${closed(rim)}"/><path class="ink hair vein" d="${veins}"/>`);
  // Central pale yellow-green peltate navel (肚臍) where the petiole attaches beneath.
  const navPts = roundPts(navel, R * 0.065, R * 0.065 * tilt, 0, 8);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--pod-lotus", dl: 0.12 }))} d="${closed(navPts)}"/><path class="ink hair" d="${closed(navPts)}"/>`);
}

// A young rolled emerging lotus leaf (卷荷) unfurling above the water.
function lotusScroll(out: Out, r: Rng, C: Pt, R: number, tilt: number) {
  const toW = (p: Pt) => add(C, rot(p, tilt));
  const roll: Pt[] = [
    [-R * 0.75, R * 0.12],
    [-R * 0.45, -R * 0.22],
    [R * 0.15, -R * 0.28],
    [R * 0.82, -R * 0.08],
    [R * 0.42, R * 0.18],
    [-R * 0.2, R * 0.22],
  ].map(toW);
  shape(out, r, roll, tone(r, { dl: 0.04, spread: 0.04, hue: 8 }), { deep: 0.3 });
}

function lotusFlower(out: Out, r: Rng, C: Pt, R: number) {
  // Back petals, receptacle & golden stamen ring, then cupped front petals.
  for (const [ring, n, spread, lenSc, wSc, dl] of [
    [0, 7, 1.05, 1.0, 0.25, -0.03],
    [1, 6, 0.72, 0.9, 0.23, 0.02],
  ] as const) {
    let petals = "";
    let veins = "";
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1) - 0.5;
      const a = rad(-90) + u * 2 * spread;
      const tip = add(C, polar(R * lenSc * (1 - Math.abs(u) * 0.12), a));
      const mid = lerp(C, tip, 0.52);
      const n2 = polar(R * wSc, a + rad(90));
      petals += closed([C, add(lerp(C, mid, 0.6), mul(n2, 0.7)), add(mid, n2), tip, sub(mid, n2), sub(lerp(C, mid, 0.6), mul(n2, 0.7))]);
      veins += `M${P1(C)}L${P1(lerp(C, tip, 0.86))}`;
    }
    out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-lotus", dl, spread: 0.03 }))} d="${petals}"/><path class="ink hair vein" style="stroke:var(--flower-lotus);opacity:.55" d="${veins}"/><path class="ink hair petal-edge" d="${petals}"/>`);
  }
  const podC = add(C, [0, -R * 0.28]);
  let stamens = "";
  for (let k = -5; k <= 5; k++) {
    const sx = k * R * 0.045;
    stamens += `M${P1([podC[0] + sx, podC[1] + 6])}L${P1([podC[0] + sx * 1.25, podC[1] - R * 0.12])}`;
  }
  out.push(`<path class="ink hair" style="stroke:var(--stamen-plum)" d="${stamens}"/>`);
  shape(out, r, roundPts(podC, R * 0.22, R * 0.11, 0, 8), tone(r, { pc: "--pod-lotus", spread: 0.03 }), { deep: 0 });
  // Front-center cradling petals that cup over the base of the receptacle.
  let front = "";
  for (const u of [-0.36, 0, 0.36]) {
    const a = rad(-90) + u * 0.85;
    const tip = add(C, polar(R * 0.76, a));
    const mid = lerp(C, tip, 0.5);
    const n2 = polar(R * 0.24, a + rad(90));
    front += closed([C, add(mid, n2), tip, sub(mid, n2)]);
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-lotus", dl: 0.05, spread: 0.02 }))} d="${front}"/><path class="ink hair petal-edge" d="${front}"/>`);
}

function lotusBud(out: Out, r: Rng, C: Pt, R: number, tilt = 0) {
  const toW = (p: Pt) => add(C, rot(p, tilt));
  const outer: Pt[] = [
    [0, 4],
    [-R * 0.38, -R * 0.28],
    [-R * 0.28, -R * 0.74],
    [0, -R * 1.05],
    [R * 0.28, -R * 0.74],
    [R * 0.38, -R * 0.28],
  ].map(toW);
  shape(out, r, outer, tone(r, { pc: "--flower-lotus", dl: -0.03, spread: 0.03 }), { deep: 0.32, ink: false });
  out.push(`<path class="ink hair petal-edge" d="${closed(outer)}"/>`);
}

function lotusPod(out: Out, r: Rng, C: Pt, R: number, pc: string, a = 0) {
  const toW = (p: Pt) => add(C, rot(p, a));
  // Conical receptacle body below the flat elliptical top disc.
  const cone: Pt[] = [
    [-R, -R * 0.42],
    [R, -R * 0.42],
    [R * 0.56, R * 0.26],
    [R * 0.22, R * 0.68],
    [-R * 0.22, R * 0.68],
    [-R * 0.56, R * 0.26],
  ].map(toW);
  shape(out, r, cone, tone(r, { pc, dl: -0.04, spread: 0.04 }), { deep: 0.35 });
  const topDisc = roundPts(toW([0, -R * 0.42]), R, R * 0.34, a, 12);
  shape(out, r, topDisc, tone(r, { pc, dl: 0.05, spread: 0.03 }), { deep: 0.15 });
  let holes = "";
  for (const [hx, hy] of [
    [-0.55, 0],
    [0, -0.14],
    [0, 0.14],
    [0.55, 0],
    [-0.28, -0.12],
    [0.28, 0.12],
  ] as const) {
    holes += closed(roundPts(toW([hx * R, (-0.42 + hy) * R]), R * 0.11, R * 0.06, a, 6));
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--pod-lotus-dry", dl: -0.06 }))} d="${holes}"/><path class="ink hair" d="${holes}"/>`);
}

export function lotus(out: Out, r: Rng, base: Pt) {
  const stalkDies = 0.84;
  const leafFalls = fallsAt(0.79, 0.04);

  // Young rolled scroll leaf emerging near the left side of the clump, well above high water.
  {
    const B = add(base, [-96, 0]);
    const spine = sample((t) => add(B, [-Math.sin(t * 2) * 10, -310 * t]), 8);
    const g: [number, number] = [0.09, 0.21];
    grow(out, g[0], g[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 8)], 4.5, 3.4, tone(r, { pc: "--stem-lotus", spread: 0.03 }), 8), pts: spine, n: 8 }), stalkDies);
    const top = spine[8];
    part(out, g[1] + 0.015, top, () => lotusScroll(out, r, add(top, [0, -4]), 68, -0.14), leafFalls(top));
  }

  // Five cupped peltate shield leaves at varied heights, tilts, and S-curves, all clearing summer high water.
  const leaves: [number, number, number, number, number][] = [
    [-82, 345, -16, 108, 0.34],
    [-34, 430, 14, 126, 0.38],
    [16, 305, -12, 98, 0.31],
    [64, 395, 18, 118, 0.36],
    [112, 325, 15, 102, 0.33],
  ];
  leaves.forEach(([dx, H, sway, R, tilt], k) => {
    const B = add(base, [dx, 0]);
    const spine = sample((t) => add(B, [Math.sin(t * 2.2) * sway + t * sway * 0.4, -H * t]), 10);
    const g: [number, number] = [0.1 + k * 0.012, 0.22 + k * 0.015];
    grow(out, g[0], g[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 10)], 5.4, 4, tone(r, { pc: "--stem-lotus", spread: 0.03 }), 10), pts: spine, n: 10 }), stalkDies);
    const top = spine[10];
    part(out, g[1] + 0.015, top, () => lotusLeaf(out, r, add(top, [0, -4]), R, tilt), leafFalls(top));
  });

  // Two open blossoms at distinct heights and gentle curves + one pointed rose bud on a third stem.
  const flowers: [number, number, number, "open" | "bud", number, number][] = [
    [-48, 535, -22, "open", 76, -0.08],
    [38, 465, 24, "open", 68, 0.12],
    [88, 385, 18, "bud", 48, 0.15],
  ];
  flowers.forEach(([dx, H, sway, kind, R, podTilt], k) => {
    const B = add(base, [dx, 0]);
    const spine = sample((t) => add(B, [Math.sin(t * Math.PI * 0.85) * sway, -H * t]), 10);
    const g: [number, number] = [0.43 + k * 0.008, 0.455 + k * 0.008];
    grow(out, g[0], g[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 10)], 4.8, 3.6, tone(r, { pc: "--stem-lotus", spread: 0.03 }), 10), pts: spine, n: 10 }), stalkDies);
    const top = spine[10];
    if (kind === "open") {
      part(out, g[1] + 0.015, top, () => lotusFlower(out, r, add(top, [0, -4]), R), 0.58 + k * 0.015);
      part(out, 0.58 + k * 0.015, top, () => lotusPod(out, r, add(top, [0, -10]), 25 - k * 2, "--pod-lotus", podTilt), stalkDies - 0.01);
    } else {
      part(out, g[1] + 0.015, top, () => lotusBud(out, r, top, R, podTilt), 0.6);
      part(out, 0.6, top, () => lotusPod(out, r, add(top, [0, -8]), 19, "--pod-lotus", podTilt), stalkDies - 0.01);
    }
  });

  // Winter (`stalkDies -> 1.0`): smooth arching dry stalks bowing over the pond water,
  // holding nodding dry brown seed pods and a folded tattered winter leaf remnant.
  const winterStalks: [number, Pt, Pt, number, "pod" | "leaf"][] = [
    [-56, [-48, -285], [16, -188], rad(134), "pod"],
    [18, [28, -325], [96, -218], rad(142), "pod"],
    [74, [82, -235], [138, -168], rad(116), "leaf"],
  ];
  winterStalks.forEach(([dx, ctrlOff, tipOff, ang, kind], k) => {
    const B = add(base, [dx, 0]);
    const ctrl = add(B, ctrlOff);
    const tip = add(B, tipOff);
    const spine = sample(quad(B, ctrl, tip), 10);
    const wg: [number, number] = [stalkDies + k * 0.006, stalkDies + 0.035 + k * 0.006];
    grow(out, wg[0], wg[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 10)], 4.4, 2.8, tone(r, { pc: "--pod-lotus-dry", spread: 0.03 }), 10), pts: spine, n: 10 }));
    part(out, wg[1] + 0.015, tip, () => {
      if (kind === "pod") {
        lotusPod(out, r, tip, 20 - k * 2, "--pod-lotus-dry", ang);
      } else {
        // Folded, tattered dry winter lotus leaf hanging from the arched petiole.
        const Rem: Pt[] = [
          tip,
          add(tip, [-38, 18]),
          add(tip, [-18, 44]),
          add(tip, [4, 26]),
          add(tip, [22, 48]),
          add(tip, [44, 20]),
        ];
        shape(out, r, Rem, tone(r, { pc: "--pod-lotus-dry", dl: 0.04, spread: 0.04 }), { deep: 0.35 });
      }
    });
  });
}

export function lotusDetail(out: Out, r: Rng) {
  lotusLeaf(out, r, [-80, 60], 160, 0.4);
  lotusFlower(out, r, [80, -40], 130);
}
