// The East Asian garden: the ginkgo (Ginkgo biloba), a side tree in late spring. A stout grey-brown
// limb reaches in from the left edge and forks into ascending limbs. The wood is finished bare:
// spur shoots, short stout knuckles along the older limbs, and long shoots at the tips. The leaves
// are parts that open once their shoot has reached them: a spur bears three to seven fans on long
// stalks, and each long shoot carries single fans along its length. Every fan has its apex at its
// stalk, a notch cut in its outer margin, and veins that fork dichotomously out to the margin.

import { rad, P1, add, sub, mul, lerp, polar, rot, quad, closed, line, sample, vars, shape, stalk, tone, grow, part, gate, roundPts } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";
import { limb, branch, angleOf } from "./woody.ts";
import type { Limb } from "./woody.ts";
import { palmate, blade, bladeBunch } from "./mediterranean.ts";

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

// ---------------------------------------------------------------------------
// Plum (Prunus mume): a bent, knotted trunk rooted past the bottom corner and leaning in, its
// twigs going zigzag from node to node. It flowers twice on the page's year: still in flower as
// spring opens, the petals falling as the leaves come; and again on bare wood at the year's end,
// where the page rests. Green plums yellow in the June rain; the leaves yellow and fall in autumn.

const PLUM = { pc: "--bark-plum" };
const plumShed = fallsAt(0.76, 0.08);
const petalsFall = fallsAt(0.12, 0.08);

// A plum flower facing out: five round petals, a dark calyx, a burst of stamens.
export function plumFlower(out: Out, r: Rng, C: Pt, R: number) {
  let petals = "";
  const spin = r() * 6.28;
  for (let k = 0; k < 5; k++) {
    const a = spin + (k / 5) * 6.28;
    petals += closed(roundPts(add(C, polar(R * 0.55, a)), R * 0.5, R * 0.46, a, 8));
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-plum", spread: 0.03 }))} d="${petals}"/><path class="ink hair petal-edge" d="${petals}"/>`);
  let stamens = "";
  for (let k = 0; k < 9; k++) {
    const a = spin + (k / 9) * 6.28;
    stamens += `M${P1(C)}L${P1(add(C, polar(R * 0.5, a)))}`;
  }
  out.push(`<path class="ink hair" style="stroke:var(--stamen-plum)" d="${stamens}"/>`);
  shape(out, r, roundPts(C, R * 0.2, R * 0.2, 0, 6), tone(r, { pc: "--calyx-plum", spread: 0.02 }), { deep: 0, ink: false });
}

// A zigzag twig: straight segments that turn at each node, thinning to a fine tip.
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
  const twig = branch(out, r, parent, t, zigzag(a, len, 4, r).slice(1), 0.03, { w0: 6, w1: 2, cap: "taper", ...PLUM });
  const n = twig.res.n;
  // Flowers sit close along the twig on the side toward the light, two moments each.
  for (const u of [0.3, 0.55, 0.8, 1]) {
    const i = Math.round(n * u);
    const p = add(twig.res.pts[i], polar(4, angleOf(twig.res.pts, Math.min(i, n - 1)) - rad(90)));
    const g = gate(twig.res, twig.g, i) + 0.005;
    const R = 9 + r() * 3;
    part(out, g, p, () => plumFlower(out, r, p, R), petalsFall(p));
    part(out, 0.93 + (u * 0.04), p, () => plumFlower(out, r, p, R));
  }
  // Leaves come after the flowers, alternate along the twig.
  for (const [k, u] of [[0, 0.4], [1, 0.65], [2, 0.9]] as const) {
    const i = Math.round(n * u);
    const T = twig.res.pts[i];
    const d = angleOf(twig.res.pts, Math.min(i, n - 1)) + (k % 2 ? 1 : -1) * rad(50);
    part(out, 0.14 + k * 0.03 + r() * 0.04, T, () => blade(out, r, T, d, 34 + r() * 8, { W: 0.46, prof: (q) => Math.sin(Math.PI * Math.min(1, q) ** 0.7) ** 0.9, v: tone(r, { spread: 0.05, hue: 8 }), deep: 0.4, rib: "ink hair" }), plumShed(T));
  }
  // A green plum or two, from late spring until the June rain has yellowed them.
  if (r() < 0.5) {
    const T = twig.res.pts[Math.round(n * 0.5)];
    const C = add(T, [0, 12]);
    part(out, 0.3, T, () => {
      out.push(`<path class="ink hair" d="M${P1(T)}L${P1(C)}"/>`);
      shape(out, r, roundPts(C, 9, 10, 0, 10), tone(r, { pc: "--fruit-plum", spread: 0.04 }), { deep: 0.4 });
    }, 0.56 + r() * 0.04);
  }
}

export function plum(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // The wood is up early, before the year's first flowers.
  const gm = [0, 0.05];
  const main = grow(out, gm[0], gm[1], () => limb(out, r, [at([-20, 20]), at([30, -60]), at([10, -130]), at([60, -200]), at([150, -240]), at([230, -300])], { w0: 40, w1: 12, cap: "blunt", swell: [[0.3, 0.12], [0.55, 0.1]], ...PLUM }));
  const parent = { res: main, g: gm };
  const limbs = [
    branch(out, r, parent, 0.42, [[50, -20], [120, -70], [150, -40], [230, -90]], 0.03, { w0: 16, w1: 5, cap: "taper", ...PLUM }),
    branch(out, r, parent, 0.68, [[-30, -50], [-20, -110], [-70, -150]], 0.03, { w0: 12, w1: 4, cap: "taper", ...PLUM }),
  ];
  for (const [j, l] of [parent, ...limbs].entries()) {
    const n = l.res.n;
    for (let i = Math.round(n * 0.35), s = j % 2 ? 1 : -1; i <= n - 2; i += 9 + Math.floor(r() * 4), s = -s) {
      plumTwig(out, r, l, i / n, angleOf(l.res.pts, i) + s * rad(40 + r() * 20), 60 + r() * 30);
    }
  }
}

export function plumDetail(out: Out, r: Rng) {
  const twig = limb(out, r, zigzag(rad(-20), 300, 4, r).map((p) => add(p, [-150, 60])), { w0: 10, w1: 3, cap: "taper", ...PLUM });
  for (const u of [0.25, 0.5, 0.75, 1]) {
    const i = Math.round(twig.n * u);
    plumFlower(out, r, add(twig.pts[i], [0, -6]), 26);
  }
}

// ---------------------------------------------------------------------------
// Paulownia: coarse, stout limbs with few twigs. Upright lilac panicles open on bare wood in early
// spring and drop as plate-sized velvety hearts unfold in opposite pairs. The leaves fall dull in
// autumn, and the tree stands through winter hung with brown capsules, next year's furred buds
// already at its tips.

const PAULOWNIA = { pc: "--bark-paulownia" };
const paulowniaShed = fallsAt(0.74, 0.08);
const bellsFall = fallsAt(0.22, 0.08);

// A broad heart: two rounded lobes behind the stalk, widest a third along, tapering to a point;
// matte and velvety, so no shine, with main veins fanning from the base.
export function paulowniaLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const k = 0.92 + r() * 0.16;
  const upper: Pt[] = [[0, 0], [-0.1, -0.12], [-0.06, -0.32 * k], [0.12, -0.44 * k], [0.36, -0.44 * k], [0.6, -0.33 * k], [0.82, -0.15 * k], [1, 0]].map(([x, y]) => [x * L, y * L]);
  const lower = upper.map(([x, y]) => [x, -y * (0.94 + r() * 0.1)] as Pt);
  const outline = [...upper, ...lower.slice(1, -1).reverse()].map(toW);
  shape(out, r, outline, tone(r, { spread: 0.05, hue: 8 }), { deep: 0.4, deepAbout: toW([0.3 * L, 0]), ink: false });
  let veins = "";
  for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) veins += line([[0, 0], [0.3 * L, a * 0.12 * L], [(0.75 - Math.abs(a) * 0.25) * L, a * 0.3 * L]].map((p) => toW(p as Pt)));
  out.push(`<path class="ink hair" d="${closed(outline)}"/><path class="ink hair vein" d="${veins}"/>`);
}

// An upright pyramid of pale violet trumpets, each a fifth as long as the panicle is tall, flared
// at the mouth; the lower branches longest, so it reads at garden size as a lilac spire.
export function paulowniaPanicle(out: Out, r: Rng, B: Pt, a: number, H: number) {
  const tip = add(B, polar(H, a));
  let stalks = `M${P1(B)}L${P1(tip)}`;
  let bells = "";
  const Lb = H * 0.2;
  // A tube that swells toward a rounded, lobed mouth, nodding a little outward.
  const trumpet = (q: Pt, d: number, L: number) => {
    const at = (u: number, w: number): Pt => add(add(q, polar(L * u, d)), polar(L * w, d + rad(90)));
    bells += closed([at(0, 0.05), at(0.45, 0.1), at(0.75, 0.2), at(0.92, 0.28), at(1.04, 0.14), at(1.08, 0), at(1.04, -0.14), at(0.92, -0.28), at(0.75, -0.2), at(0.45, -0.1), at(0, -0.05)]);
  };
  for (let k = 0; k < 4; k++) {
    const u = 0.15 + k * 0.21;
    const p = lerp(B, tip, u);
    for (const side of [-1, 1]) {
      const reach = H * 0.2 * (1 - u * 0.6);
      const q = add(p, polar(reach, a + side * rad(60)));
      stalks += `M${P1(p)}L${P1(q)}`;
      const n = r() < 0.5 ? 1 : 2;
      for (let j = 0; j < n; j++) trumpet(q, a + side * rad(70 + r() * 30) + (j ? 0.5 : -0.2) * side, Lb * (0.8 + r() * 0.35));
    }
  }
  trumpet(tip, a, Lb);
  out.push(`<path class="ink hair" d="${stalks}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-paulownia", spread: 0.04 }))} d="${bells}"/><path class="ink hair petal-edge" d="${bells}"/>`);
}

// Ripe capsules on the old panicle's stalks: brown, egg-shaped, beaked.
function paulowniaCapsules(out: Out, r: Rng, B: Pt, a: number, H: number) {
  let caps = "";
  let stalks = "";
  for (let k = 0; k < 5; k++) {
    const p = add(B, polar(H * (0.2 + k * 0.17), a));
    const C = add(p, polar(12, a + (k % 2 ? 1 : -1) * rad(70)));
    stalks += `M${P1(lerp(B, p, 0))}L${P1(p)}L${P1(C)}`;
    caps += closed(roundPts(C, 9, 6.5, a + rad(90), 9));
  }
  out.push(`<path class="ink hair" d="${stalks}"/><path class="wash"${vars(tone(r, { pc: "--capsule-paulownia", spread: 0.04 }))} d="${caps}"/><path class="ink hair" d="${caps}"/>`);
}

// Next year's flower buds, furred and light brown, gathered at a twig's tip.
function paulowniaBuds(out: Out, r: Rng, T: Pt, a: number) {
  let buds = "";
  for (let k = 0; k < 5; k++) buds += closed(roundPts(add(T, polar(8 + k * 4, a + (k % 2 ? 1 : -1) * 0.5)), 5, 4, a, 7));
  out.push(`<path class="wash felt"${vars(tone(r, { pc: "--bud-paulownia", spread: 0.04 }))} d="${buds}"/><path class="ink hair" d="${buds}"/>`);
}

function paulowniaTwig(out: Out, r: Rng, parent: { res: Limb; g: number[] }, t: number, a: number, len: number) {
  const twig = branch(out, r, parent, t, [polar(len * 0.5, a), polar(len, a - 0.15)], 0.03, { w0: 9, w1: 5, cap: "blunt", ...PAULOWNIA });
  const n = twig.res.n;
  const tip = twig.res.pts[n];
  const up = rad(-90);
  part(out, gate(twig.res, twig.g, n) + 0.005, tip, () => paulowniaPanicle(out, r, tip, up + (a - up) * 0.25, 90 + r() * 30), bellsFall(tip));
  part(out, 0.62, tip, () => paulowniaCapsules(out, r, tip, up + (a - up) * 0.4, 70));
  part(out, 0.7, tip, () => paulowniaBuds(out, r, tip, up));
  for (const [k, u] of [[0, 0.55], [1, 0.95]] as const) {
    const T = twig.res.pts[Math.round(n * u)];
    for (const side of [-1, 1]) {
      const d = a + side * rad(70) + rad(25);
      const E = add(T, polar(34, d));
      part(out, 0.22 + k * 0.04 + r() * 0.04, T, () => {
        stalk(out, quad(T, add(lerp(T, E, 0.5), [0, -4]), E), 3, 2, PAULOWNIA, 6);
        paulowniaLeaf(out, r, E, d + rad(20), 86 + r() * 22);
      }, paulowniaShed(T));
    }
  }
}

export function paulownia(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // The wood is up early: the panicles open on bare wood before the year's leaves.
  const gm = [0, 0.05];
  const main = grow(out, gm[0], gm[1], () => limb(out, r, [at([-30, 10]), at([80, -30]), at([200, -60]), at([320, -70]), at([420, -60])], { w0: 40, w1: 14, cap: "blunt", ...PAULOWNIA }));
  const parent = { res: main, g: gm };
  const limbs = [
    branch(out, r, parent, 0.35, [[40, -60], [100, -130], [170, -170]], 0.03, { w0: 20, w1: 9, cap: "blunt", ...PAULOWNIA }),
    branch(out, r, parent, 0.62, [[50, 30], [130, 50], [200, 40]], 0.03, { w0: 18, w1: 8, cap: "blunt", ...PAULOWNIA }),
  ];
  for (const [j, l] of [parent, ...limbs].entries()) {
    const n = l.res.n;
    for (let i = Math.round(n * 0.45), s = j % 2 ? 1 : -1; i <= n; i += 14 + Math.floor(r() * 4), s = -s) {
      paulowniaTwig(out, r, l, Math.min(1, i / n), angleOf(l.res.pts, Math.min(i, n - 1)) + s * rad(35 + r() * 15), 40 + r() * 20);
    }
  }
}

export function paulowniaDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-120, 160], [-40, 80], [10, 0]], { w0: 18, w1: 10, cap: "blunt", ...PAULOWNIA });
  paulowniaPanicle(out, r, twig.pts[twig.n], rad(-95), 200);
  paulowniaLeaf(out, r, twig.pts[Math.round(twig.n * 0.5)], rad(160), 150);
}

// ---------------------------------------------------------------------------
// Weeping willow: a bough reaching in from the edge, its long whips falling from it in a
// curtain. Yellow-green catkins hang on the bare whips as spring opens; narrow leaves follow and
// thicken into a full curtain by summer; it yellows in October and sheds, and the bare whips
// still hang through winter.

const WILLOW = { pc: "--bark-willow" };
const willowShed = fallsAt(0.76, 0.1);
const catkinsFall = fallsAt(0.12, 0.06);

// Narrow, long-pointed leaves, a few at a time along a whip, angled down and out from it: one
// light wash and one hairline for the lot, so a curtain of them stays soft and pale.
function willowLeaves(out: Out, r: Rng, pts: Pt[], from: number, to: number) {
  const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
  for (let i = from; i < to; i += 2) {
    const d = angleOf(pts, Math.min(i, pts.length - 2)) + (i % 4 ? 1 : -1) * rad(32 + r() * 16);
    blades.push({ O: pts[i], dir: d, L: 24 + r() * 10, W: 0.2 });
  }
  bladeBunch(out, blades, tone(r, { dl: 0.04, spread: 0.06, hue: 10 }));
}

// A whip: a fine shoot hanging from the bough, swaying a little, leafed in clusters along it.
function willowWhip(out: Out, r: Rng, parent: { res: Limb; g: number[] }, t: number, len: number) {
  const sway = (r() - 0.5) * 40;
  const whip = branch(out, r, parent, t, [[sway * 0.2, len * 0.25], [sway * 0.7, len * 0.6], [sway, len]], 0.06, { w0: 3.2, w1: 1, cap: "taper", ...WILLOW });
  const n = whip.res.n;
  const pts = whip.res.pts;
  // Starting clear of the bough, so nothing on the whip sits nearer the bough than the whip.
  for (let i = 6; i < n; i += 6) {
    const p = pts[i];
    const g = gate(whip.res, whip.g, i);
    part(out, g + 0.004, p, () => {
      const c = add(p, polar(9, angleOf(pts, i) + rad(30)));
      shape(out, r, roundPts(c, 3.2, 8, angleOf(pts, i), 8), tone(r, { pc: "--catkin-willow", spread: 0.04 }), { deep: 0, ink: false });
    }, catkinsFall(p));
    part(out, Math.max(g + 0.02, 0.1 + (i / n) * 0.12), p, () => willowLeaves(out, r, pts, i, Math.min(n, i + 6)), willowShed(p));
  }
}

export function willow(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0, 0.05];
  const bough = grow(out, gm[0], gm[1], () => limb(out, r, [at([-30, 10]), at([90, -24]), at([220, -30]), at([350, -10]), at([460, 22])], { w0: 30, w1: 7, cap: "taper", ...WILLOW }));
  const parent = { res: bough, g: gm };
  const twig = branch(out, r, parent, 0.5, [[60, -30], [150, -40], [230, -20]], 0.03, { w0: 10, w1: 4, cap: "taper", ...WILLOW });
  for (const [l, from] of [[parent, 0.3], [twig, 0.2]] as const) {
    const n = l.res.n;
    for (let i = Math.round(n * from); i <= n; i += 5 + Math.floor(r() * 3)) {
      const len = 220 + r() * 200 - (i / n) * 60;
      willowWhip(out, r, l, i / n, len);
    }
  }
}

export function willowDetail(out: Out, r: Rng) {
  const whip = limb(out, r, [[0, -160], [10, -60], [6, 40], [20, 150]], { w0: 4, w1: 1.5, cap: "taper", ...WILLOW });
  for (let i = 4; i < whip.n; i += 4) {
    const p = whip.pts[i];
    const d = angleOf(whip.pts, i) + (i % 8 ? 1 : -1) * rad(30);
    blade(out, r, p, d, 70, { W: 0.17, v: tone(r, { spread: 0.05 }), deep: 0.3, rib: "ink hair", hairline: true });
  }
}

// ---------------------------------------------------------------------------
// Moso bamboo: a few tall culms rising from below the frame and out of its top, ringed at every
// node and white-powdered when young, with fine branches from the upper nodes carrying sprays of
// narrow leaves. Evergreen, the garden's one full green in winter. In April a new shoot rises
// in its brown, spotted sheaths, grows into a culm, and lets the sheaths fall.

const CULM = { pc: "--culm-moso" };
const sheathsFall = fallsAt(0.36, 0.1);

// A culm from B along `lean`, H tall, w wide: a tapering green column with a ring at each node,
// grown from g0 to g1. Returns its spine and the nodes.
function culm(out: Out, r: Rng, B: Pt, lean: number, H: number, w: number, g: [number, number]) {
  const spine = sample((t) => add(B, add(polar(H * t, rad(-90) + lean), [Math.sin(t * 3) * 6, 0])), 30);
  const nodes: number[] = [];
  const res = grow(out, g[0], g[1], () => {
    const st = stalk(out, (t) => spine[Math.round(t * 30)], w, w * 0.7, tone(r, { ...CULM, spread: 0.03 }), 30);
    let rings = "";
    let bloom = "";
    for (let i = 2; i < 30; i += 2 + (i > 10 ? 1 : 0)) {
      nodes.push(i);
      const p = spine[i];
      const half = (w * (1 - (i / 30) * 0.3)) / 2;
      const nrm = polar(half, angleOf(spine, i) + rad(90));
      rings += `M${P1(add(p, nrm))}Q${P1(add(p, [0, 2.5]))} ${P1(sub(p, nrm))}`;
      bloom += closed([add(add(p, nrm), [0, 2]), add(add(p, nrm), [0, 7]), add(sub(p, nrm), [0, 7]), add(sub(p, nrm), [0, 2])]);
    }
    out.push(`<path class="wash felt"${vars(tone(r, { pc: "--bloom-moso", spread: 0.02 }))} d="${bloom}"/><path class="ink thin" d="${rings}"/>`);
    return { ...st, pts: spine, n: 30 };
  });
  return { res, nodes, g };
}

// A fine branch from a node with sprays of narrow drooping leaves at its joints.
function bambooSpray(out: Out, r: Rng, P: Pt, a: number, g: number) {
  const tip = add(P, polar(70 + r() * 40, a));
  part(out, g, P, () => {
    out.push(`<path class="ink thin" d="M${P1(P)}Q${P1(add(lerp(P, tip, 0.5), [0, -8]))} ${P1(tip)}"/>`);
    const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
    for (const u of [0.45, 0.75, 1]) {
      const O = lerp(P, tip, u);
      for (let k = 0; k < 3; k++) blades.push({ O, dir: a + rad(40 + k * 28 + (r() - 0.5) * 16) * (a > rad(-90) ? 1 : -1), L: 34 + r() * 14, W: 0.14 });
    }
    bladeBunch(out, blades, tone(r, { spread: 0.06, hue: 8 }));
  });
}

export function moso(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Standing culms are up with the intro; the new shoot rises through April.
  const stands: [number, number, number, number, [number, number]][] = [
    [0, 0.02, 1300, 30, [0, 0.07]],
    [70, -0.05, 1250, 26, [0.01, 0.08]],
    [150, 0.04, 1200, 24, [0.02, 0.09]],
  ];
  for (const [x, lean, H, w, g] of stands) {
    const c = culm(out, r, at([x, 0]), lean, H, w, g);
    for (const i of c.nodes.filter((i) => i > 14)) {
      const p = c.res.pts[i];
      const side = i % 2 ? 1 : -1;
      bambooSpray(out, r, p, rad(-90) + lean + side * rad(50 + r() * 15), gate(c.res, c.g, i) + 0.01);
    }
  }
  // The new shoot: sheathed, spotted brown, shedding its sheaths as it grows into a culm.
  const shoot = culm(out, r, at([110, 0]), -0.02, 900, 22, [0.14, 0.34]);
  for (const i of shoot.nodes) {
    const p = shoot.res.pts[i];
    const g = gate(shoot.res, shoot.g, i);
    const d = angleOf(shoot.res.pts, i);
    const side = i % 4 ? 1 : -1;
    part(out, g, p, () => {
      const pts = [add(p, polar(13, d + rad(90) * side)), add(p, polar(40, d)), add(p, polar(13, d - rad(90) * side * 0.2)), sub(p, polar(4, d))];
      shape(out, r, pts, tone(r, { pc: "--sheath-moso", spread: 0.04 }), { deep: 0.3 });
    }, sheathsFall(p));
  }
}

export function mosoDetail(out: Out, r: Rng) {
  stalk(out, (t) => [0, 200 - t * 400], 34, 30, tone(r, CULM), 10);
  let rings = "";
  for (const y of [120, 0, -120]) rings += `M-17 ${y}Q0 ${y + 4} 17 ${y}`;
  out.push(`<path class="ink thin" d="${rings}"/>`);
  bambooSpray(out, r, [0, -120], rad(-40), 0);
  bambooSpray(out, r, [0, 0], rad(-140), 0);
}

// ---------------------------------------------------------------------------
// Japanese wisteria on an arbor beam: an East Asian timber beam reaching in from the edge, old
// twisted vines wound along it, and long violet racemes falling from it in April, each opening
// from its base to its tip. Pinnate leaves follow; velvety pods hang from summer through winter,
// when the bare twisted vines and the pods are all that is left on the beam.

const VINE = { pc: "--bark-wisteria" };
const wisteriaShed = fallsAt(0.78, 0.08);
const racemesFall = fallsAt(0.38, 0.06);

// The arbor's beam: squared timber with its grain, the host the vines hang from. It is there
// before anything grows.
export function arborBeam(out: Out, r: Rng, A: Pt, len: number, depth: number) {
  const pts: Pt[] = [add(A, [-30, -depth / 2]), add(A, [len, -depth / 2]), add(A, [len + 6, depth / 2]), add(A, [-30, depth / 2])];
  shape(out, r, pts, tone(r, { pc: "--timber", spread: 0.02 }), { deep: 0.3 });
  let grain = "";
  for (const f of [-0.2, 0.15]) grain += `M${P1(add(A, [0, depth * f]))}Q${P1(add(A, [len * 0.5, depth * f + 2]))} ${P1(add(A, [len - 10, depth * f]))}`;
  out.push(`<path class="ink hair bark-tex" d="${grain}"/>`);
}

// A raceme hanging from T, L long: pea flowers crowded along a curving axis, widest at the top,
// opening from the base to the tip as g runs on.
export function raceme(out: Out, r: Rng, T: Pt, L: number, g: number, leave?: (p: Pt) => number) {
  const bend = (r() - 0.5) * 0.3;
  const axis = sample((t) => add(T, [Math.sin(t * 1.6) * L * bend * 0.4, t * L]), 12);
  out.push(`<path class="ink hair" d="${line(axis)}"/>`);
  for (let seg = 0; seg < 4; seg++) {
    const P = axis[seg * 3];
    part(out, g + seg * 0.02, P, () => {
      let flowers = "";
      for (let i = seg * 3; i < seg * 3 + 3; i++) {
        const t = i / 12;
        const w = L * 0.12 * (1 - t * 0.7);
        for (const side of [-1, 1]) {
          const c = add(axis[i], [side * w * (0.4 + r() * 0.3), 4]);
          flowers += closed(roundPts(c, w * 0.42, w * 0.32, side * 0.4, 8));
        }
      }
      out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-wisteria", dl: seg * 0.03, spread: 0.04 }))} d="${flowers}"/><path class="ink hair petal-edge" d="${flowers}"/>`);
    }, leave?.(P));
  }
}

// A pinnate leaf hanging from T: a drooping rachis with paired leaflets and one at its tip.
function wisteriaLeaf(out: Out, r: Rng, T: Pt, a: number, L: number) {
  const tip = add(T, polar(L, a));
  const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
  for (let k = 1; k <= 6; k++) {
    const O = lerp(T, tip, k / 6.5);
    for (const side of [-1, 1]) blades.push({ O, dir: a + side * rad(55), L: L * 0.22, W: 0.42 });
  }
  blades.push({ O: tip, dir: a, L: L * 0.24, W: 0.42 });
  out.push(`<path class="ink hair" d="M${P1(T)}L${P1(tip)}"/>`);
  bladeBunch(out, blades, tone(r, { spread: 0.06, hue: 10 }));
}

// A velvety pod: flat, a little curved, pinched between its seeds.
function wisteriaPod(out: Out, r: Rng, T: Pt, L: number) {
  const curve = (r() - 0.5) * 0.4;
  const at = (u: number, w: number): Pt => add(T, [Math.sin(u * 2) * L * curve * 0.3 + w, u * L]);
  const up: Pt[] = [];
  const dn: Pt[] = [];
  for (let k = 0; k <= 8; k++) {
    const u = k / 8;
    const w = 9 * Math.sin(Math.PI * Math.min(1, u * 1.1)) ** 0.5 * (k % 2 ? 0.85 : 1);
    up.push(at(u, -w));
    dn.push(at(u, w));
  }
  shape(out, r, [...up, ...dn.reverse()], tone(r, { pc: "--pod-wisteria", spread: 0.04 }), { deep: 0.3 });
}

export function wisteria(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  arborBeam(out, r, at([0, 0]), 640, 24);
  // Old vines wound along the beam, twisting over and under it.
  const gv = [0, 0.06];
  const vine = grow(out, gv[0], gv[1], () => limb(out, r, [at([-30, 6]), at([110, -10]), at([230, 16]), at([360, -8]), at([480, 14]), at([600, 0])], { w0: 18, w1: 6, cap: "taper", ...VINE }));
  const vineB = branch(out, r, { res: vine, g: gv }, 0.3, [[60, 18], [150, -6], [240, 20]], 0.04, { w0: 9, w1: 4, cap: "taper", ...VINE });
  const n = vine.n;
  for (let i = 4, k = 0; i < n - 2; i += 5, k++) {
    const T = add(vine.pts[i], [0, 12]);
    const g = gate(vine, gv, i);
    if (k % 2 === 0) raceme(out, r, T, 180 + r() * 120, 0.18 + (i / n) * 0.04, racemesFall);
    else part(out, Math.max(g + 0.02, 0.24 + r() * 0.06), T, () => wisteriaLeaf(out, r, T, rad(90 + (r() - 0.5) * 40), 130 + r() * 40), wisteriaShed(T));
    if (k % 3 === 1) part(out, 0.5 + r() * 0.04, T, () => wisteriaPod(out, r, add(T, [12, 0]), 110 + r() * 40));
  }
  for (let i = 3; i < vineB.res.n; i += 6) {
    const T = add(vineB.res.pts[i], [0, 8]);
    part(out, Math.max(gate(vineB.res, vineB.g, i) + 0.02, 0.26), T, () => wisteriaLeaf(out, r, T, rad(95), 120 + r() * 30), wisteriaShed(T));
  }
}

export function wisteriaDetail(out: Out, r: Rng) {
  arborBeam(out, r, [-140, -170], 280, 26);
  raceme(out, r, [-30, -154], 320, 0);
  wisteriaLeaf(out, r, [70, -154], rad(80), 220);
}

// ---------------------------------------------------------------------------
// Chocolate vine on a bamboo pole: thin stems twining along a pole that reaches in from the edge,
// some hanging free below it. Small purple-brown flowers dangle in early spring before the
// leaves; five-leaflet palms follow; purple sausage pods hang in September and October. Semi-
// evergreen: about half its leaves fall, the rest thin out over winter on the twining stems.

const AKEBIA = { pc: "--bark-akebia" };
const akebiaShed = fallsAt(0.8, 0.1);
const akebiaFlowersFall = fallsAt(0.2, 0.06);

// A bamboo pole: a straight, pale, dry rod with its nodes, the host the vine twines on.
function bambooPole(out: Out, r: Rng, A: Pt, len: number, w: number) {
  const pts: Pt[] = [add(A, [-30, -w / 2]), add(A, [len, -w / 2 + 2]), add(A, [len, w / 2 + 2]), add(A, [-30, w / 2])];
  shape(out, r, pts, tone(r, { pc: "--pole-bamboo", spread: 0.02 }), { deep: 0.25 });
  let nodes = "";
  for (let x = 60; x < len; x += 110) nodes += `M${P1(add(A, [x, -w / 2]))}L${P1(add(A, [x + 1, w / 2]))}`;
  out.push(`<path class="ink thin" d="${nodes}"/>`);
}

// A five-leaflet palm: obovate leaflets, notched at the tip, spread from the end of the stalk.
export function akebiaLeaf(out: Out, r: Rng, T: Pt, a: number, L: number) {
  const E = add(T, polar(L * 0.7, a));
  out.push(`<path class="ink hair" d="M${P1(T)}L${P1(E)}"/>`);
  for (const k of [-2, -1, 0, 1, 2]) blade(out, r, E, a + k * rad(34), L * (1 - Math.abs(k) * 0.08), { W: 0.48, prof: (q) => Math.sin(Math.PI * Math.min(1, q) ** 1.35) ** 0.75 * (q > 0.9 ? 0.8 : 1), v: tone(r, { spread: 0.06, hue: 8 }), deep: 0.3, rib: "ink hair", hairline: true });
}

// A short raceme of purple-brown cups: one or two larger flowers at its base, small ones beyond.
export function akebiaFlowers(out: Out, r: Rng, T: Pt, L: number) {
  const axis = sample((t) => add(T, [Math.sin(t * 2) * 6, t * L]), 5);
  let cups = "";
  axis.forEach((p, i) => {
    const R = i < 1 ? 9 : 5 - i * 0.4;
    for (let k = 0; k < 3; k++) cups += closed(roundPts(add(p, polar(R * 0.6, rad(90 + k * 120))), R * 0.55, R * 0.4, rad(90 + k * 120), 7));
  });
  out.push(`<path class="ink hair" d="${line(axis)}"/><path class="wash petal"${vars(tone(r, { pc: "--flower-akebia", spread: 0.04 }))} d="${cups}"/><path class="ink hair petal-edge" d="${cups}"/>`);
}

// A pair of sausage pods, purple and plump, hanging from the stem.
function akebiaPods(out: Out, r: Rng, T: Pt) {
  let pods = "";
  for (const side of [-1, 1]) {
    const C = add(T, [side * 10, 34]);
    pods += closed(roundPts(C, 11, 30, side * 0.2, 12));
  }
  out.push(`<path class="ink hair" d="M${P1(T)}L${P1(add(T, [-10, 6]))}M${P1(T)}L${P1(add(T, [10, 6]))}"/>`);
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--pod-akebia", spread: 0.04 }))} d="${pods}"/><path class="ink hair" d="${pods}"/>`);
}

export function akebia(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  bambooPole(out, r, at([0, 0]), 520, 14);
  // Stems twining along the pole, and a few hanging free below it.
  const gv = [0, 0.05];
  const twine = grow(out, gv[0], gv[1], () => limb(out, r, sample((t) => at([-30 + t * 500, Math.sin(t * 22) * 9]), 24), { w0: 5, w1: 2, cap: "taper", ...AKEBIA }));
  const strands = [0.3, 0.55, 0.8].map((t) => branch(out, r, { res: twine, g: gv }, t, [[10, 50], [-10, 110], [6, 150 + r() * 60]], 0.04, { w0: 3, w1: 1.2, cap: "taper", ...AKEBIA }));
  for (const [j, l] of [{ res: twine, g: gv }, ...strands].entries()) {
    const n = l.res.n;
    // The twining stem samples densely; leaves sit at a spacing that reads, not at every turn.
    for (let i = Math.round(n * 0.15), k = 0; i <= n; i += Math.round(n / (j ? 4 : 12)), k++) {
      const T = l.res.pts[Math.min(i, n)];
      const g = gate(l.res, l.g, Math.min(i, n));
      if (k % 3 === 0 && j === 0) part(out, g + 0.005, T, () => akebiaFlowers(out, r, T, 40 + r() * 16), akebiaFlowersFall(T));
      const a = rad(60 + r() * 60);
      // About half the leaves stay through winter.
      part(out, Math.max(g + 0.02, 0.14 + r() * 0.1), T, () => akebiaLeaf(out, r, T, a, 30 + r() * 8), k % 2 ? akebiaShed(T) : undefined);
      if (k % 5 === 2 && j === 0) part(out, 0.64, T, () => akebiaPods(out, r, T), 0.86 + r() * 0.04);
    }
  }
}

export function akebiaDetail(out: Out, r: Rng) {
  bambooPole(out, r, [-160, -120], 320, 18);
  akebiaFlowers(out, r, [-60, -112], 140);
  akebiaLeaf(out, r, [60, -112], rad(80), 90);
}

// ---------------------------------------------------------------------------
// The bed and the pond. These are herbs: their stems die back, bending over and fading, and what
// grows on a stem leaves before it does (npm run draw checks).

// A double flower seen a little from the side: a cup of broad outer petals round a ruffled ball.
function cupFlower(out: Out, r: Rng, C: Pt, R: number, pc: string) {
  for (const [ring, n, reach, size, dl] of [[0, 8, 0.62, 0.48, -0.04], [1, 9, 0.38, 0.4, 0.02], [2, 7, 0.16, 0.3, 0.06]] as const) {
    let petals = "";
    for (let k = 0; k < n; k++) {
      const a = (k / n) * 6.28 + ring * 0.4 + r() * 0.2;
      const c = add(C, [Math.cos(a) * R * reach, Math.sin(a) * R * reach * 0.55 - R * ring * 0.12]);
      petals += closed(roundPts(c, R * size, R * size * 0.7, a, 9));
    }
    out.push(`<path class="wash petal"${vars(tone(r, { pc, dl, spread: 0.03 }))} d="${petals}"/><path class="ink hair petal-edge" d="${petals}"/>`);
  }
}

// Peony: a clump of stems rising red from the ground, leaves twice divided in threes, ball
// flowers late in spring, then the seed follicles; the stems redden, bend over, and die back.
const peonyDies = 0.84;
const peonyShed = fallsAt(0.76, 0.05);

function peonyLeaf(out: Out, r: Rng, T: Pt, a: number, L: number) {
  const F = add(T, polar(L * 0.3, a));
  out.push(`<path class="ink hair" d="M${P1(T)}L${P1(F)}"/>`);
  for (const b of [-0.6, 0, 0.6]) {
    const G = add(F, polar(L * 0.22, a + b));
    out.push(`<path class="ink hair" d="M${P1(F)}L${P1(G)}"/>`);
    for (const c of [-0.5, 0, 0.5]) blade(out, r, G, a + b + c, L * 0.36, { W: 0.3, v: tone(r, { spread: 0.05, hue: 8 }), deep: 0.3, rib: "ink hair", hairline: true });
  }
}

export function peony(out: Out, r: Rng, base: Pt) {
  for (let k = 0; k < 6; k++) {
    const lean = rad(-90 + (k - 2.5) * 11 + (r() - 0.5) * 8);
    const H = 260 + r() * 100;
    const B = add(base, [(k - 2.5) * 8, 0]);
    const spine = sample((t) => add(B, add(polar(H * t, lean), [Math.sin(t * 2.4) * 10 * (k % 2 ? 1 : -1), 0])), 12);
    const g: [number, number] = [0.02 + k * 0.01, 0.18 + k * 0.01];
    const stem = grow(out, g[0], g[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 12)], 6, 3.5, tone(r, { pc: "--stem-peony", spread: 0.04 }), 12), pts: spine, n: 12 }), peonyDies);
    for (const u of [0.4, 0.68]) {
      const i = Math.round(12 * u);
      const T = spine[i];
      part(out, gate(stem, g, i) + 0.02, T, () => peonyLeaf(out, r, T, angleOf(spine, i) + (i % 2 ? 1 : -1) * rad(55), 120 + r() * 30), peonyShed(T));
    }
    if (k % 3 === 2) continue;
    const top = spine[12];
    part(out, 0.27 + r() * 0.04, top, () => cupFlower(out, r, add(top, [0, -10]), 44 + r() * 10, "--flower-peony"), 0.42 + r() * 0.03);
    part(out, 0.5, top, () => {
      let f = "";
      for (const d of [-0.5, 0, 0.5]) f += closed(roundPts(add(top, polar(12, lean + d)), 12, 7, lean + d, 8));
      out.push(`<path class="wash"${vars(tone(r, { pc: "--follicle-peony", spread: 0.04 }))} d="${f}"/><path class="ink hair" d="${f}"/>`);
    }, peonyDies - 0.01);
  }
}

export function peonyDetail(out: Out, r: Rng) {
  cupFlower(out, r, [0, -40], 130, "--flower-peony");
  peonyLeaf(out, r, [-60, 160], rad(-150), 180);
}

// Hydrangea: a mound of woody stems with broad leaves in opposite pairs; mopheads of small
// four-sepalled florets open blue-violet in the plum rain, fade on the stem to antique green and
// rose in autumn, and stay dry on the bare stems through winter.
const hydrangeaShed = fallsAt(0.74, 0.08);

function mophead(out: Out, r: Rng, C: Pt, R: number, pc: string, dl: number) {
  let florets = "";
  for (let k = 0; k < 34; k++) {
    // Florets round a dome seen a little from above: nearer ones lower and larger.
    const a = k * rad(137.5);
    const q = Math.sqrt((k + 0.5) / 34);
    const c = add(C, [Math.cos(a) * R * q, Math.sin(a) * R * q * 0.62 - R * 0.25 * (1 - q)]);
    const s = R * 0.17 * (0.85 + (Math.sin(a) + 1) * 0.12);
    for (let j = 0; j < 4; j++) florets += closed(roundPts(add(c, polar(s * 0.55, a + j * rad(90))), s * 0.5, s * 0.38, a + j * rad(90), 6));
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc, dl, spread: 0.05, hue: 10 }))} d="${florets}"/><path class="ink hair petal-edge" d="${florets}"/>`);
}

export function hydrangea(out: Out, r: Rng, base: Pt) {
  for (let k = 0; k < 7; k++) {
    const lean = rad(-90 + (k - 3) * 15 + (r() - 0.5) * 8);
    const L = 220 + r() * 80 - Math.abs(k - 3) * 20;
    const g = [0.01 + k * 0.006, 0.1];
    const stem = grow(out, g[0], g[1], () => limb(out, r, [add(base, [(k - 3) * 10, 4]), add(base, add(polar(L * 0.55, lean), [(k - 3) * 14, 0])), add(base, add(polar(L, lean + (k - 3) * 0.05), [(k - 3) * 20, 0]))], { w0: 8, w1: 5, cap: "blunt", pc: "--bark-hydrangea" }));
    const n = stem.n;
    for (const u of [0.45, 0.7, 0.92]) {
      const i = Math.round(n * u);
      const T = stem.pts[i];
      for (const side of [-1, 1]) {
        const d = angleOf(stem.pts, i) + side * rad(70);
        part(out, Math.max(gate(stem, g, i) + 0.02, 0.12 + u * 0.12), T, () => blade(out, r, T, d, 66 + r() * 16, { W: 0.58, v: tone(r, { spread: 0.05, hue: 8 }), veins: 4, deep: 0.35, rib: "ink hair", hairline: true }), hydrangeaShed(T));
      }
    }
    const top = add(stem.pts[n], [0, -26]);
    // The dry head lies beneath the fresh one and shows when the fresh one fades in autumn.
    part(out, 0.46, stem.pts[n], () => mophead(out, r, top, 56 + r() * 12, "--flower-hydrangea-dry", 0));
    part(out, 0.46, stem.pts[n], () => mophead(out, r, top, 56 + r() * 12, "--flower-hydrangea", (k % 3) * 0.03), 0.66 + r() * 0.04, true);
  }
}

export function hydrangeaDetail(out: Out, r: Rng) {
  mophead(out, r, [0, -30], 150, "--flower-hydrangea", 0);
  blade(out, r, [-40, 120], rad(-160), 160, { W: 0.58, v: tone(r, { spread: 0.05 }), veins: 5, deep: 0.35, rib: "ink hair", hairline: true });
}

// Red spider lily: bare scapes rise late in summer and open umbels of scarlet flowers, their
// narrow tepals curled back and their stamens far out; only after they fade do the narrow dark
// leaves come, and they stay through winter, withering late in spring.
function lilyLeaves(out: Out, r: Rng, B: Pt) {
  const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
  for (let k = 0; k < 12; k++) blades.push({ O: add(B, [(k - 6) * 3, 0]), dir: rad(-90 + (k - 5.5) * 13 + (r() - 0.5) * 6), L: 110 + r() * 40, W: 0.07 });
  bladeBunch(out, blades, tone(r, { dl: -0.04, spread: 0.05 }));
}

function lilyUmbel(out: Out, r: Rng, C: Pt, R: number) {
  let tepals = "";
  let stamens = "";
  for (let k = 0; k < 6; k++) {
    const a = rad(-160 + k * 28 + (r() - 0.5) * 10);
    const F = add(C, polar(R * 0.35, a));
    for (let j = 0; j < 6; j++) {
      const t = a + rad(-50 + j * 20);
      const tip = add(F, polar(R * 0.38, t));
      const curl = add(tip, polar(R * 0.14, t + rad(130)));
      tepals += closed([F, add(lerp(F, tip, 0.5), polar(R * 0.035, t + rad(90))), tip, curl, lerp(F, tip, 0.55)]);
    }
    for (let j = 0; j < 6; j++) {
      const t = a + rad(-25 + j * 10);
      const E = add(F, polar(R * 0.75, t - 0.25));
      stamens += `M${P1(F)}Q${P1(add(F, polar(R * 0.45, t + 0.1)))} ${P1(E)}`;
    }
    out.push(`<path class="ink hair" d="M${P1(C)}L${P1(F)}"/>`);
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-lycoris", spread: 0.04 }))} d="${tepals}"/><path class="ink hair petal-edge" d="${tepals}"/>`);
  out.push(`<path class="ink hair" style="stroke:var(--flower-lycoris)" d="${stamens}"/>`);
}

export function lycoris(out: Out, r: Rng, base: Pt) {
  // Last autumn's leaves, standing as the year opens, and withering late in spring.
  part(out, 0, base, () => lilyLeaves(out, r, base), 0.32, true);
  for (let k = 0; k < 4; k++) {
    const B = add(base, [(k - 1.5) * 26, 0]);
    const H = 240 + r() * 60;
    const lean = rad(-90 + (k - 1.5) * 6);
    const spine = sample((t) => add(B, polar(H * t, lean)), 8);
    const g: [number, number] = [0.6 + k * 0.006, 0.66 + k * 0.006];
    grow(out, g[0], g[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 8)], 4.5, 3.5, tone(r, { pc: "--stem-lycoris", spread: 0.03 }), 8), pts: spine, n: 8 }), 0.78);
    const top = spine[8];
    part(out, g[1], top, () => lilyUmbel(out, r, top, 80 + r() * 14), 0.74 + r() * 0.02);
  }
  // This year's leaves, after the flowers, through winter.
  part(out, 0.76, base, () => lilyLeaves(out, r, base));
}

export function lycorisDetail(out: Out, r: Rng) {
  lilyUmbel(out, r, [0, 0], 220);
}

// Rabbit-ear iris, in the pond's shallows: grey-green swords rising from the water, violet
// flowers in May and June, their falls marked white, then capsules; the swords yellow in autumn
// and fall over.
function irisFlower(out: Out, r: Rng, C: Pt, R: number) {
  let falls = "";
  let standards = "";
  let signal = "";
  for (const a of [rad(-20), rad(90), rad(200)]) {
    const tip = add(C, polar(R, a + rad(15)));
    falls += closed([C, add(C, polar(R * 0.5, a - 0.35)), add(tip, polar(R * 0.25, a - rad(60))), tip, add(tip, polar(R * 0.2, a + rad(80))), add(C, polar(R * 0.45, a + 0.45))]);
    signal += closed([add(C, polar(R * 0.2, a + 0.1)), add(C, polar(R * 0.55, a + 0.12)), add(C, polar(R * 0.3, a + 0.25))]);
    standards += closed([C, add(C, polar(R * 0.5, a + rad(55))), add(C, polar(R * 0.25, a + rad(70)))]);
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-iris", spread: 0.04 }))} d="${falls}${standards}"/><path class="ink hair petal-edge" d="${falls}${standards}"/>`);
  out.push(`<path class="wash"${vars({ pc: "--signal-iris" })} d="${signal}"/>`);
}

export function iris(out: Out, r: Rng, base: Pt) {
  for (let k = 0; k < 9; k++) {
    const B = add(base, [(k - 4) * 9, 0]);
    const H = 240 + r() * 140 - Math.abs(k - 4) * 22;
    const lean = rad(-90 + (k - 4) * 6);
    const spine = sample((t) => add(B, add(polar(H * t, lean), [t * t * (k - 4) * 8, 0])), 10);
    // A sword: a stem's growth, broad at the base and tapering to a point.
    grow(out, 0.06 + k * 0.008, 0.2 + k * 0.008, () => ({ ...stalk(out, (t) => spine[Math.round(t * 10)], 13, 1.5, tone(r, { spread: 0.04 }), 10), pts: spine, n: 10 }), 0.82 + r() * 0.03);
  }
  for (let k = 0; k < 3; k++) {
    const B = add(base, [(k - 1) * 22, 0]);
    const spine = sample((t) => add(B, polar(300 * t, rad(-90 + (k - 1) * 5))), 8);
    const g: [number, number] = [0.26 + k * 0.01, 0.32 + k * 0.01];
    grow(out, g[0], g[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 8)], 4, 3, tone(r, { spread: 0.03 }), 8), pts: spine, n: 8 }), 0.62);
    const top = spine[8];
    part(out, g[1] + 0.01, top, () => irisFlower(out, r, add(top, [0, -6]), 46 + r() * 8), 0.5 + r() * 0.03);
    part(out, 0.52, top, () => shape(out, r, roundPts(add(top, [0, -18]), 9, 20, 0, 9), tone(r, { pc: "--capsule-iris", spread: 0.04 }), { deep: 0.3 }), 0.61);
  }
}

export function irisDetail(out: Out, r: Rng) {
  irisFlower(out, r, [0, 0], 150);
}

// Lotus, in the pond: leaves rise rolled from the water in May and open into shield leaves on tall
// stalks; pink flowers stand above them through summer and leave their seed pods. In autumn the
// leaves brown and tatter and the stalks bend over; in winter the dry pods are left on broken
// stalks bent down to the water.
function lotusLeaf(out: Out, r: Rng, C: Pt, R: number, tilt: number) {
  const rim: Pt[] = [];
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * 6.28;
    const w = 1 + Math.sin(a * 5 + r()) * 0.04;
    rim.push(add(C, [Math.cos(a) * R * w, Math.sin(a) * R * w * tilt]));
  }
  shape(out, r, rim, tone(r, { spread: 0.05, hue: 8 }), { deep: 0.35, deepAbout: add(C, [0, R * tilt * 0.3]), ink: false });
  let veins = "";
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * 6.28;
    veins += `M${P1(C)}L${P1(add(C, [Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92 * tilt]))}`;
  }
  out.push(`<path class="ink hair" d="${closed(rim)}"/><path class="ink hair vein" d="${veins}"/>`);
}

function lotusFlower(out: Out, r: Rng, C: Pt, R: number) {
  for (const [ring, n, spread, dl] of [[0, 7, 0.9, -0.02], [1, 5, 0.5, 0.04]] as const) {
    let petals = "";
    for (let k = 0; k < n; k++) {
      const a = rad(-90) + (k / (n - 1) - 0.5) * 2 * spread * (ring ? 0.8 : 1);
      const tip = add(C, polar(R * (ring ? 0.85 : 1), a));
      const n2 = polar(R * 0.22, a + rad(90));
      petals += closed([C, add(lerp(C, tip, 0.55), n2), tip, sub(lerp(C, tip, 0.55), n2)]);
    }
    out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-lotus", dl, spread: 0.03 }))} d="${petals}"/><path class="ink hair petal-edge" d="${petals}"/>`);
  }
  shape(out, r, roundPts(add(C, [0, -R * 0.25]), R * 0.22, R * 0.14, 0, 8), tone(r, { pc: "--pod-lotus", spread: 0.03 }), { deep: 0 });
}

function lotusPod(out: Out, r: Rng, C: Pt, R: number, pc: string, a = 0) {
  const toW = (p: Pt) => add(C, rot(p, a));
  const pts: Pt[] = [[-R, -R * 0.5], [R, -R * 0.5], [R * 0.45, R * 0.6], [-R * 0.45, R * 0.6]].map(toW);
  shape(out, r, pts, tone(r, { pc, spread: 0.04 }), { deep: 0.3 });
  let holes = "";
  for (const x of [-0.5, 0, 0.5]) holes += closed(roundPts(toW([x * R, -R * 0.42]), R * 0.12, R * 0.06, a, 6));
  out.push(`<path class="ink hair" d="${holes}"/>`);
}

export function lotus(out: Out, r: Rng, base: Pt) {
  const stalkDies = 0.84;
  const leafFalls = fallsAt(0.79, 0.04);
  // Leaf stalks rise from the pond floor, the shields opening at their tops.
  for (let k = 0; k < 5; k++) {
    const B = add(base, [(k - 2) * 46, 0]);
    const H = 280 + r() * 160;
    const spine = sample((t) => add(B, [Math.sin(t * 2) * (k - 2) * 14, -H * t]), 10);
    const g: [number, number] = [0.28 + k * 0.012, 0.38 + k * 0.012];
    grow(out, g[0], g[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 10)], 5, 4, tone(r, { pc: "--stem-lotus", spread: 0.03 }), 10), pts: spine, n: 10 }), stalkDies);
    const top = spine[10];
    part(out, g[1], top, () => lotusLeaf(out, r, add(top, [0, -4]), 90 + r() * 30, 0.32 + r() * 0.12), leafFalls(top));
  }
  // Flowers on their own stalks, standing above the leaves, leaving their pods.
  for (let k = 0; k < 2; k++) {
    const B = add(base, [(k - 0.5) * 70, 0]);
    const spine = sample((t) => add(B, [0, -480 * t]), 10);
    const g: [number, number] = [0.44 + k * 0.03, 0.5 + k * 0.03];
    grow(out, g[0], g[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 10)], 4.5, 3.5, tone(r, { pc: "--stem-lotus", spread: 0.03 }), 10), pts: spine, n: 10 }), stalkDies);
    const top = spine[10];
    part(out, g[1] + 0.01, top, () => lotusFlower(out, r, add(top, [0, -4]), 70), 0.6 + k * 0.03);
    part(out, 0.6 + k * 0.03, top, () => lotusPod(out, r, add(top, [0, -10]), 22, "--pod-lotus"), stalkDies - 0.01);
  }
  // Winter: dry pods on stalks broken over, bent down to the water.
  for (let k = 0; k < 3; k++) {
    const B = add(base, [(k - 1) * 80 + 30, -20]);
    const knee = add(B, [(k - 1) * 10, -220 - k * 40]);
    const tip = add(knee, polar(120, rad(60 + k * 30)));
    part(out, stalkDies + 0.01, B, () => {
      out.push(`<path class="ink thin" style="stroke:var(--pod-lotus-dry)" d="M${P1(B)}L${P1(knee)}L${P1(tip)}"/>`);
      lotusPod(out, r, tip, 18, "--pod-lotus-dry", rad(150 + k * 20));
    });
  }
}

export function lotusDetail(out: Out, r: Rng) {
  lotusLeaf(out, r, [-80, 60], 160, 0.4);
  lotusFlower(out, r, [80, -40], 130);
}

