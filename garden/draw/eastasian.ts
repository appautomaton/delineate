// The East Asian garden: the ginkgo (Ginkgo biloba), a side tree in late spring. A stout grey-brown
// limb reaches in from the left edge and forks into ascending limbs. The wood is finished bare:
// spur shoots, short stout knuckles along the older limbs, and long shoots at the tips. The leaves
// are parts that open once their shoot has reached them: a spur bears three to seven fans on long
// stalks, and each long shoot carries single fans along its length. Every fan has its apex at its
// stalk, a notch cut in its outer margin, and veins that fork dichotomously out to the margin.

import { rad, P1, add, mul, lerp, polar, rot, quad, closed, vars, shape, stalk, tone, grow, part, gate } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";
import { limb, branch, angleOf } from "./woody.ts";
import type { Limb } from "./woody.ts";
import { palmate } from "./mediterranean.ts";

const BARK = { pc: "--bark-ginkgo" };
const STALK = { pc: "--stem-green" };

// A fan leaf whose apex is O, opening along dir, of radius R. Its outer margin is a sector arc
// with a notch at the middle; its veins split at two forks as they run out to the margin.
export function ginkgoFan(out: Out, r: Rng, O: Pt, dir: number, R: number) {
  const half = rad(60 + r() * 12);
  const ph = r() * 6.28;
  const rim = (a: number) => R * (0.97 + 0.03 * Math.cos(3 * a + ph)) * (1 - 0.24 * Math.exp(-((a / 0.13) ** 2)));
  const toW = (p: Pt) => add(O, rot(p, dir));
  // Seven margin points each side and the notch vertex between them: a curve runs smoothly through them.
  const arc: Pt[] = [];
  for (let k = 0; k <= 6; k++) arc.push(polar(rim(-half + (half - 0.14) * (k / 6)), -half + (half - 0.14) * (k / 6)));
  arc.push(polar(rim(0), 0));
  for (let k = 6; k >= 0; k--) arc.push(polar(rim(half - (half - 0.14) * (k / 6)), half - (half - 0.14) * (k / 6)));
  // A hairline rim, not the shape's light-and-heavy edges: dozens of fans overlap, and the full
  // edges turn a crown of them dark.
  const pts = [[0, 0] as Pt, ...arc].map(toW);
  shape(out, r, pts, tone(r, { spread: 0.06, hue: 8 }), { deep: 0.5, deepAbout: toW(polar(R * 0.4, 0)), ink: false });
  out.push(`<path class="ink hair" d="${closed(pts)}"/>`);

  const FORK = [0.5, 0.78, 0.92];
  let veins = "";
  // A vein runs from (r0, a0) out to its fork (or the margin), then splits into two children that
  // open by an eighth and a sixteenth of the leaf's half-angle.
  const vein = (a0: number, r0: number, a: number, lvl: number) => {
    const r1 = rim(a) * FORK[lvl];
    veins += `M${P1(toW(polar(r0, a0)))}Q${P1(toW(polar((r0 + r1) / 2, (a0 + a) / 2)))} ${P1(toW(polar(r1, a)))}`;
    if (lvl < 2) for (const d of [-1, 1]) vein(a, r1, a + (d * half) / 2 ** (lvl + 3), lvl + 1);
  };
  for (const a of [-0.75, -0.25, 0.25, 0.75]) vein(a * half, 3, a * half, 0);
  out.push(`<path class="ink hair vein" d="${veins}"/>`);
}

// When a leaf falls: somewhere in a tree's shedding, which starts at `from` and lasts `span`,
// at a moment taken from where the leaf hangs, not from the random stream, so timing never moves
// the drawing.
const fallsAt = (from: number, span: number) => ([x, y]: Pt) => from + ((((Math.round(x * 7 + y * 13) % 20) + 20) % 20) / 20) * span;

// The ginkgo turns gold all at once in late November, then sheds over a stretch of scroll long
// enough to watch the fans go.
const shed = fallsAt(0.8, 0.08);

// A fan on a long stalk from attach point T, leaning toward a direction a. The stalk and the fan
// open together, from T, at their own gate, and fall together at the shed.
function fanOnStalk(out: Out, r: Rng, T: Pt, a: number, len: number, R: number, g: number) {
  const E = add(T, polar(len, a));
  const bow = polar(len * 0.12, a + rad(90) * (r() < 0.5 ? -1 : 1));
  const ctrl = add(add(T, polar(len * 0.5, a)), bow);
  part(
    out,
    g,
    T,
    () => {
      stalk(out, quad(T, ctrl, E), 2.4, 1.3, STALK, 8);
      ginkgoFan(out, r, E, a + (r() - 0.5) * 0.25, R);
    },
    shed(T),
  );
}

// The leaves of a spur shoot: three to five fans from its tip on stalks of uneven length, turned
// up toward the light rather than spread round it like spokes. Each opens in turn once the spur
// has reached its tip, which is gate g.
function spurLeaves(out: Out, r: Rng, T: Pt, dir: number, g: number, sc: number) {
  const n = 3 + Math.floor(r() * 3);
  const aim = Math.atan2(Math.sin(dir) - 0.9, Math.cos(dir));
  const spread = rad(110);
  for (let k = 0; k < n; k++) {
    const a = aim + spread * (k / (n - 1) - 0.5) + (r() - 0.5) * 0.3;
    fanOnStalk(out, r, T, a, (30 + r() * 28) * sc, (26 + r() * 12) * sc, g + k * 0.006);
  }
}

// Spur shoots along a limb: a short knuckle on alternate sides, each grown from the limb as it
// passes and carrying its cluster of fans at the tip.
function spursOn(out: Out, r: Rng, parent: { res: Limb; g: number[] }, from: number, side: number) {
  const { res } = parent;
  for (let i = Math.round(res.n * from), s = side; i <= res.n - 6; i += 15 + Math.floor(r() * 4), s = -s) {
    const a = angleOf(res.pts, i) + s * rad(48 + r() * 30);
    // Stout and ringed with leaf scars, so the spur still reads once its leaves have fallen.
    const spur = branch(out, r, parent, i / res.n, [polar(8, a), polar(20 + r() * 6, a)], 0.02, { w0: 11, w1: 9, cap: "blunt", lenticels: true, ...BARK });
    const tip = spur.res.pts[spur.res.n];
    spurLeaves(out, r, tip, angleOf(spur.res.pts, spur.res.n), gate(spur.res, spur.g, spur.res.n) + 0.02, 1);
  }
}

// A ginkgo in late spring. Its base is at the origin, at the left edge; the crown reaches up and to
// the right, so the page mirrors the tree when it enters from the right.
export function ginkgo(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // On the year: the wood grows through March, the fans open from late March into April, and the
  // tree stands in full leaf by late spring.
  const gm = [0, 0.16];
  const main = grow(out, gm[0], gm[1], () => limb(out, r, [at([-30, 14]), at([80, -8]), at([190, -60]), at([280, -150]), at([330, -262])], { w0: 46, w1: 13, cap: "blunt", ...BARK }));
  const parent = { res: main, g: gm };

  const forks = [
    branch(out, r, parent, 0.3, [[30, -70], [70, -150], [96, -232]], 0.09, { w0: 22, w1: 11, cap: "blunt", ...BARK }),
    branch(out, r, parent, 0.52, [[40, 8], [130, -6], [222, -44], [280, -104]], 0.09, { w0: 20, w1: 10, cap: "blunt", ...BARK }),
    branch(out, r, parent, 0.74, [[20, -50], [50, -120], [60, -176]], 0.07, { w0: 16, w1: 9, cap: "blunt", ...BARK }),
  ];

  spursOn(out, r, parent, 0.16, 1);
  for (const f of forks) spursOn(out, r, f, 0.22, -1);

  // Long shoots run on from each fork's tip, fine at the end, with single fans along them.
  for (const f of forks) {
    const i = Math.round(f.res.n * 0.97);
    const a = angleOf(f.res.pts, i);
    const shoot = branch(out, r, f, 0.97, [polar(22, a - 0.12), polar(50, a - 0.2)], 0.05, { w0: 7, w1: 3.2, cap: "taper", ...BARK });
    let side = 1;
    for (const t of [0.3, 0.58, 0.84]) {
      const j = Math.round(shoot.res.n * t);
      const p = shoot.res.pts[j];
      const la = angleOf(shoot.res.pts, j) + side * rad(70 + r() * 20);
      fanOnStalk(out, r, p, la, 34 + r() * 6, 32 + r() * 4, gate(shoot.res, shoot.g, j) + 0.02);
      side = -side;
    }
  }
}

// A close study of one spur shoot: its knuckle of grey bark, and its cluster of fans on long stalks.
export function ginkgoSpurDetail(out: Out, r: Rng) {
  const sc = 3;
  const base = [40, 210];
  const dir = rad(-80);
  const knuckle = limb(out, r, [base, add(base, polar(14 * sc, dir + rad(6))), add(base, polar(30 * sc, dir))], { w0: 8 * sc, w1: 6.5 * sc, cap: "blunt", ...BARK });
  spurLeaves(out, r, knuckle.pts[knuckle.n], dir, 0, sc);
}

// ---------------------------------------------------------------------------
// Japanese maple: low layered limbs reaching in from the right, fine twigs held in near-level
// tiers, hand-shaped leaves in opposite pairs, and paired winged keys hanging under them through
// summer. It turns scarlet before the ginkgo turns gold, and stands in winter as tiers of fine
// bare twigs.

const MAPLE = { pc: "--bark-maple" };
const MAPLE_STALK = { pc: "--stem-maple" };
// Seven tailed lobes, the outer pair short, cut deep toward the stalk.
const LOBES: [number, number][] = [[0, 1], [-0.62, 0.9], [0.62, 0.9], [-1.24, 0.72], [1.24, 0.72], [-1.9, 0.4], [1.9, 0.4]];
const mapleShed = fallsAt(0.75, 0.08);
const keysFall = fallsAt(0.78, 0.06);

export function mapleLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  palmate(out, r, O, dir, L, { lobes: LOBES, sigma: 0.27, power: 1.7, teeth: 0.035, toothCount: 130, core: 0.3, deep: 0.4, v: tone(r, { spread: 0.06, hue: 10 }), hairline: true });
}

// A leaf on its red stalk from the twig at T, opening at g and falling at the maple's shedding.
function mapleOnStalk(out: Out, r: Rng, T: Pt, a: number, len: number, L: number, g: number) {
  const E = add(T, polar(len, a));
  part(
    out,
    g,
    T,
    () => {
      stalk(out, quad(T, add(lerp(T, E, 0.5), polar(len * 0.1, a + rad(90))), E), 1.8, 1.1, MAPLE_STALK, 6);
      mapleLeaf(out, r, E, a + (r() - 0.5) * 0.3, L);
    },
    mapleShed(T),
  );
}

// A pair of winged keys hanging from the twig at T: two seeds joined at a short stalk, their
// wings spread wide, red-flushed green.
export function mapleKeys(out: Out, r: Rng, T: Pt, a: number, s: number) {
  const C = add(T, polar(10 * s, a));
  let wings = "";
  for (const side of [-1, 1]) {
    const w = a + side * rad(58);
    const seed = add(C, polar(3 * s, w));
    const tip = add(C, polar(24 * s, w + side * 0.12));
    const n = polar(4.5 * s, w + rad(90) * side);
    wings += closed([seed, add(lerp(seed, tip, 0.45), n), add(tip, mul(n, 0.3)), tip, lerp(seed, tip, 0.6), seed]);
  }
  out.push(`<path class="ink hair" d="M${P1(T)}L${P1(C)}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--keys-maple", spread: 0.05 }))} d="${wings}"/><path class="ink hair" d="${wings}"/>`);
}

// A twig off a tier: fine and level, carrying a pair of leaves along it and a pair at its tip,
// drooping a little below the line of the twig.
function mapleTwig(out: Out, r: Rng, parent: { res: Limb; g: number[] }, t: number, a: number, len: number, keys: boolean) {
  const twig = branch(out, r, parent, t, [polar(len * 0.4, a), polar(len, a + (r() - 0.5) * 0.2)], 0.02, { w0: 4.2, w1: 1.6, cap: "taper", ...MAPLE });
  const n = twig.res.n;
  for (const [k, u] of [[0, 0.6], [1, 1]] as const) {
    const i = Math.round(n * u);
    const p = twig.res.pts[i];
    const d = angleOf(twig.res.pts, Math.min(i, n - 1));
    const g = gate(twig.res, twig.g, i) + 0.02 + k * 0.004;
    for (const side of [-1, 1]) mapleOnStalk(out, r, p, d + side * rad(62) + rad(18), 20 + r() * 8, 30 + r() * 8, g);
  }
  if (keys) {
    const p = twig.res.pts[Math.round(n * 0.6)];
    part(out, 0.46, p, () => mapleKeys(out, r, p, rad(100), 1), keysFall(p));
  }
}

export function maple(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // On the year: wood through March, leaves opening into April, in full leaf by late spring.
  const gm = [0, 0.14];
  const main = grow(out, gm[0], gm[1], () => limb(out, r, [at([-30, 16]), at([70, -18]), at([170, -40]), at([280, -48]), at([390, -40])], { w0: 30, w1: 8, cap: "taper", ...MAPLE }));
  const parent = { res: main, g: gm };
  // Tiers: limbs held near level, one above another, each a layer of foliage.
  const tiers = [
    branch(out, r, parent, 0.22, [[30, -40], [100, -86], [190, -108], [260, -112]], 0.07, { w0: 16, w1: 4, cap: "taper", ...MAPLE }),
    branch(out, r, parent, 0.42, [[40, 12], [120, 30], [210, 34], [280, 26]], 0.07, { w0: 14, w1: 4, cap: "taper", ...MAPLE }),
    branch(out, r, parent, 0.6, [[30, -30], [100, -60], [180, -66]], 0.06, { w0: 12, w1: 3.5, cap: "taper", ...MAPLE }),
  ];
  for (const [j, tier] of [parent, ...tiers].entries()) {
    const n = tier.res.n;
    for (let i = Math.round(n * 0.3), s = j % 2 ? 1 : -1; i <= n - 3; i += 10 + Math.floor(r() * 4), s = -s) {
      const a = angleOf(tier.res.pts, i) + s * rad(28 + r() * 18);
      mapleTwig(out, r, tier, i / n, a, 46 + r() * 22, (i + j) % 3 === 0);
    }
  }
}

// A close study: one twig with two pairs of leaves and a pair of keys.
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

