// The East Asian garden: the ginkgo (Ginkgo biloba), a side tree in late spring. A stout grey-brown
// limb reaches in from the left edge and forks into ascending limbs. The wood is finished bare:
// spur shoots, short stout knuckles along the older limbs, and long shoots at the tips. The leaves
// are parts that open once their shoot has reached them: a spur bears three to seven fans on long
// stalks, and each long shoot carries single fans along its length. Every fan has its apex at its
// stalk, a notch cut in its outer margin, and veins that fork dichotomously out to the margin.

import { rad, P1, add, polar, rot, quad, sample, shape, stalk, tone, grow, part, gate } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";
import { limb, branch, angleOf } from "./woody.ts";
import type { Limb } from "./woody.ts";

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
  shape(out, r, [[0, 0], ...arc].map(toW), tone(r, { spread: 0.06, hue: 8 }), { deep: 0.5, deepAbout: toW(polar(R * 0.4, 0)) });

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

// A fan on a long stalk from attach point T, leaning toward a direction a. The stalk and the fan
// open together, from T, at their own gate.
function fanOnStalk(out: Out, r: Rng, T: Pt, a: number, len: number, R: number, g: number) {
  const E = add(T, polar(len, a));
  const bow = polar(len * 0.12, a + rad(90) * (r() < 0.5 ? -1 : 1));
  const ctrl = add(add(T, polar(len * 0.5, a)), bow);
  part(out, g, T, () => {
    stalk(out, quad(T, ctrl, E), 2.4, 1.3, STALK, 8);
    ginkgoFan(out, r, E, a + (r() - 0.5) * 0.25, R);
  });
}

// The leaves of a spur shoot: three to seven fans round its tip, stalks spreading from it. Each
// opens in turn once the spur has reached its tip, which is gate g.
function spurLeaves(out: Out, r: Rng, T: Pt, dir: number, g: number, sc: number) {
  const n = 3 + Math.floor(r() * 3);
  const spread = rad(160);
  for (let k = 0; k < n; k++) {
    const a = dir + (n > 1 ? spread * (k / (n - 1) - 0.5) : 0) + (r() - 0.5) * 0.18;
    fanOnStalk(out, r, T, a, (40 + r() * 14) * sc, (34 + r() * 4) * sc, g + k * 0.014);
  }
}

// Spur shoots along a limb: a short knuckle on alternate sides, each grown from the limb as it
// passes and carrying its cluster of fans at the tip.
function spursOn(out: Out, r: Rng, parent: { res: Limb; g: number[] }, from: number, side: number) {
  const { res, g } = parent;
  for (let i = Math.round(res.n * from), s = side; i <= res.n - 6; i += 12 + Math.floor(r() * 3), s = -s) {
    const a = angleOf(res.pts, i) + s * rad(48 + r() * 30);
    const spur = branch(out, r, parent, i / res.n, [polar(5, a), polar(12 + r() * 4, a)], 0.03, { w0: 9, w1: 7.5, cap: "blunt", ...BARK });
    const tip = spur.res.pts[spur.res.n];
    spurLeaves(out, r, tip, angleOf(spur.res.pts, spur.res.n), gate(spur.res, spur.g, spur.res.n) + 0.02, 1);
  }
}

// A ginkgo in late spring. Its base is at the origin, at the left edge; the crown reaches up and to
// the right, so the page mirrors the tree when it enters from the right.
export function ginkgo(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0, 0.5];
  const main = grow(out, gm[0], gm[1], () => limb(out, r, [at([-30, 14]), at([80, -8]), at([190, -60]), at([280, -150]), at([330, -262])], { w0: 40, w1: 13, cap: "blunt", ...BARK }));
  const parent = { res: main, g: gm };

  const forks = [
    branch(out, r, parent, 0.3, [[30, -70], [70, -150], [96, -232]], 0.26, { w0: 22, w1: 11, cap: "blunt", ...BARK }),
    branch(out, r, parent, 0.52, [[40, 8], [130, -6], [222, -44], [280, -104]], 0.26, { w0: 20, w1: 10, cap: "blunt", ...BARK }),
    branch(out, r, parent, 0.74, [[20, -50], [50, -120], [60, -176]], 0.2, { w0: 16, w1: 9, cap: "blunt", ...BARK }),
  ];

  spursOn(out, r, parent, 0.16, 1);
  for (const f of forks) spursOn(out, r, f, 0.22, -1);

  // Long shoots run on from each fork's tip, fine at the end, with single fans along them.
  for (const f of forks) {
    const i = Math.round(f.res.n * 0.97);
    const a = angleOf(f.res.pts, i);
    const shoot = branch(out, r, f, 0.97, [polar(22, a - 0.12), polar(50, a - 0.2)], 0.12, { w0: 7, w1: 3.2, cap: "taper", ...BARK });
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
