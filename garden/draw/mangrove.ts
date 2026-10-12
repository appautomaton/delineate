// The Mangrove garden (#4, Köppen Aw): the Everglades and Caribbean tidal lagoons.
// Built around the garden's shared water mechanism: drawings place what meets the water from
// `waterOf("mangrove")`, and each layout in mangrove.css sets the depth that lands the surface there.
//
// Growth choreography: before scrolling (`scrollY = 0`, `all = 0.5`), the water sits at low tide
// (`LOW_TIDE = 0.22`) and only the core stilt-root and mudflat anchors have begun emerging near
// the edges so the frame stays open and uncrowded. As the visitor scrolls (`0.5 -> 1.0`), the tide
// rises across the stilt roots and pneumatophores while branches, epiphytes, ferns, grasses, and
// shore runners reach in from every direction and angle.

import { rad, P1, add, sub, mul, polar, lerp, closed, sample, vars, tone, shape, stalk, quad, grow, part, along, roundPts, gate } from "./lib.ts";
import type { Out, Pt, Rng, Tone } from "./lib.ts";
import { limb, angleOf } from "./woody.ts";
import { GARDENS } from "../src/garden/gardens.ts";

// Where high water stands, in drawing units above a plant's base: the garden's depth from
// GARDENS at 10 drawing units per --u. A layout draws a plant at its own scale, so each layout in
// mangrove.css sets the --water that lands the surface on this line for the black mangrove,
// whose breathing pegs are sized to it.
export const waterOf = (key: string) => (GARDENS.find((g) => g.key === key)?.water ?? 0) * 10;

// ---------------------------------------------------------------------------
// 1. Red mangrove (Rhizophora mangle): multi-order catenary prop-root arcade and plumb-vertical
// aerial drop roots with chalky horizontal lenticels, upturned sympodial twigs with pointed
// stipular candles, opposite leathery dark-green elliptic leaves (yellow-green with black
// corkwarts beneath, plus a few golden-yellow senescent salt-sacrifice leaves), 4-merous pale
// yellow axillary star cymes, and pendulous viviparous "pencil" propagules.

export function mangroveLeaf(
  out: Out,
  r: Rng,
  base: Pt,
  dir: number,
  len: number,
  { under = false, senescent = false, tilt = 1, pc, petPc = "--leaf-under-mangrove", acute = false }: { under?: boolean; senescent?: boolean; tilt?: number; pc?: string; petPc?: string; acute?: boolean } = {},
) {
  const pet = len * 0.13;
  const b0 = add(base, polar(pet, dir));
  const tip = add(base, polar(len, dir));
  const w = len * (acute ? 0.3 : 0.36) * tilt;
  const n = 7;
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const ax = lerp(b0, tip, u);
    const env = acute ? Math.sin(Math.PI * u ** 0.82) * (1 - 0.22 * u * u) : Math.sin(Math.PI * u ** 0.88) * (1 - 0.1 * u * u);
    const hw = (w / 2) * env;
    L.push(add(ax, polar(hw, dir - Math.PI / 2)));
    R.push(add(ax, polar(hw, dir + Math.PI / 2)));
  }
  stalk(out, quad(base, lerp(base, b0, 0.5), b0), Math.max(2.1, len * 0.044), Math.max(1.7, len * 0.035), tone(r, { pc: petPc, dl: -0.02, spread: 0.03 }), 3);

  const pts = [...L, ...(acute ? [tip] : []), ...[...R].reverse()];
  const v: Tone = senescent
    ? tone(r, { pc: "--leaf-senescent", spread: 0.05, hue: 8 })
    : under
      ? tone(r, { pc: pc ?? "--leaf-under-mangrove", spread: 0.05, hue: 8 })
      : tone(r, { pc, spread: 0.07, hue: 12 });
  shape(out, r, pts, v, { deep: under ? 0.36 : 0.62 });

  const midEnd = lerp(b0, tip, 0.93);
  out.push(`<path class="ink thin" style="stroke:var(--leaf-under-mangrove);opacity:.78" d="M${P1(b0)}L${P1(midEnd)}"/>`);
  out.push(`<path class="ink hair" d="M${P1(b0)}L${P1(midEnd)}"/>`);

  if (under && !pc) {
    let dots = "";
    for (let k = 1; k <= 5; k++) {
      const u = 0.18 + (k / 6) * 0.68;
      const side = (k % 2 ? 1 : -1) * (0.3 + (k % 3) * 0.12);
      const p = add(lerp(b0, tip, u), polar((w / 2) * Math.sin(Math.PI * u) * side, dir + Math.PI / 2));
      dots += `M${P1(add(p, [-0.9, 0]))}L${P1(add(p, [0.9, 0]))}`;
    }
    out.push(`<path class="ink mid" d="${dots}"/>`);
  }
}

export function mangroveCandle(out: Out, r: Rng, base: Pt, dir: number, len: number) {
  const tip = add(base, polar(len, dir));
  const mid = lerp(base, tip, 0.38);
  const nrm = polar(len * 0.12, dir + Math.PI / 2);
  const pts = [add(base, mul(nrm, 0.65)), add(mid, nrm), tip, sub(mid, nrm), sub(base, mul(nrm, 0.65))];
  shape(out, r, pts, tone(r, { pc: "--leaf-under-mangrove", dl: 0.04, dh: -12, spread: 0.03 }), { deep: 0.45 });
}

function leafCluster(
  out: Out,
  r: Rng,
  p: Pt,
  dir: number,
  len: number,
  { candle = true, senescent = 0 }: { candle?: boolean; senescent?: -1 | 0 | 1 } = {},
) {
  const pBack = add(p, polar(-len * 0.14, dir));
  mangroveLeaf(out, r, pBack, dir - rad(66 + (r() - 0.5) * 10), len * 0.92, {
    under: senescent !== -1,
    senescent: senescent === -1,
    tilt: 0.78,
  });
  mangroveLeaf(out, r, pBack, dir + rad(64 + (r() - 0.5) * 10), len * 0.92, {
    under: senescent === -1,
    senescent: senescent === 1,
    tilt: 0.82,
  });
  mangroveLeaf(out, r, p, dir - rad(32 + (r() - 0.5) * 8), len * (0.98 + r() * 0.08), { tilt: 0.98 });
  mangroveLeaf(out, r, p, dir + rad(30 + (r() - 0.5) * 8), len * (0.98 + r() * 0.08), { tilt: 0.98 });
  if (candle) mangroveCandle(out, r, p, dir, len * 0.54);
}

function leafNode(
  out: Out,
  r: Rng,
  p: Pt,
  dir: number,
  len: number,
  { underLeft = false, underRight = false, senescent = 0 }: { underLeft?: boolean; underRight?: boolean; senescent?: -1 | 0 | 1 } = {},
) {
  mangroveLeaf(out, r, p, dir - rad(48 + (r() - 0.5) * 10), len * (0.92 + r() * 0.1), {
    under: underLeft,
    senescent: senescent === -1,
    tilt: underLeft ? 0.76 : 0.94,
  });
  mangroveLeaf(out, r, p, dir + rad(46 + (r() - 0.5) * 10), len * (0.92 + r() * 0.1), {
    under: underRight,
    senescent: senescent === 1,
    tilt: underRight ? 0.76 : 0.94,
  });
}

export function mangroveCyme(out: Out, r: Rng, base: Pt, dir: number, size: number) {
  const fork = add(base, polar(size * 0.42, dir));
  stalk(out, quad(base, lerp(base, fork, 0.5), fork), 2.2, 1.8, tone(r, { pc: "--leaf-under-mangrove", dl: -0.04 }), 3);
  for (const sg of [-1, 1]) {
    const fDir = dir + sg * rad(28);
    const fC = add(fork, polar(size * 0.36, fDir));
    stalk(out, quad(fork, lerp(fork, fC, 0.5), fC), 1.7, 1.4, tone(r, { pc: "--leaf-under-mangrove", dl: -0.04 }), 3);
    let petals = "";
    for (let k = 0; k < 4; k++) {
      const a = fDir + rad(45 + k * 90);
      const pTip = add(fC, polar(size * 0.34, a));
      const pN = polar(size * 0.065, a + Math.PI / 2);
      const pMid = lerp(fC, pTip, 0.52);
      petals += closed([fC, add(pMid, pN), pTip, sub(pMid, pN)]);
    }
    out.push(`<path class="wash"${vars(tone(r, { pc: "--flower-mangrove", dl: 0.08, dc: 0.45 }))} d="${petals}"/><path class="ink hair" d="${petals}"/>`);
    let sepals = "";
    for (let k = 0; k < 4; k++) {
      const a = fDir + rad(k * 90);
      const sTip = add(fC, polar(size * 0.42, a));
      const sN = polar(size * 0.105, a + Math.PI / 2);
      const sMid = lerp(fC, sTip, 0.44);
      sepals += closed([fC, add(sMid, sN), sTip, sub(sMid, sN)]);
    }
    out.push(`<path class="wash"${vars(tone(r, { pc: "--flower-mangrove", spread: 0.03 }))} d="${sepals}"/><path class="ink thin" d="${sepals}"/>`);
    const core = closed(roundPts(fC, size * 0.11, size * 0.11, 0, 6));
    out.push(`<path class="wash"${vars(tone(r, { pc: "--propagule-tip", dl: 0.05 }))} d="${core}"/><path class="ink hair" d="${core}"/>`);
  }
}

export function mangrovePropagule(out: Out, r: Rng, base: Pt, len: number, sway = 0) {
  const dir = Math.PI / 2 + sway;
  const fruitTop = add(base, polar(len * 0.11, dir - sway * 0.4));
  const collar = add(fruitTop, polar(len * 0.15, dir));
  const tip = add(collar, polar(len * 0.74, dir));

  stalk(out, quad(base, lerp(base, fruitTop, 0.5), fruitTop), 2.4, 2.0, tone(r, { pc: "--leaf-under-mangrove", dl: -0.05 }), 3);

  let calyx = "";
  for (const k of [-1.1, -0.38, 0.38, 1.1]) {
    const a = dir + Math.PI + k * 0.52;
    const cTip = add(fruitTop, polar(len * 0.085, a));
    const cN = polar(len * 0.024, a + Math.PI / 2);
    calyx += closed([fruitTop, add(lerp(fruitTop, cTip, 0.5), cN), cTip, sub(lerp(fruitTop, cTip, 0.5), cN)]);
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--propagule", dl: -0.05 }))} d="${calyx}"/><path class="ink hair" d="${calyx}"/>`);

  const fMid = lerp(fruitTop, collar, 0.52);
  const fN = polar(len * 0.058, dir + Math.PI / 2);
  const fruitPts = [
    add(fruitTop, mul(fN, 0.45)),
    add(fMid, fN),
    add(collar, mul(fN, 0.52)),
    sub(collar, mul(fN, 0.52)),
    sub(fMid, fN),
    sub(fruitTop, mul(fN, 0.45)),
  ];
  shape(out, r, fruitPts, tone(r, { pc: "--bark-red", dl: -0.03, spread: 0.03 }), { deep: 0.55 });

  const n = 8;
  const L: Pt[] = [];
  const R: Pt[] = [];
  const wMax = Math.max(6.5, len * 0.068);
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const ax = add(lerp(collar, tip, u), polar(Math.sin(u * Math.PI) * len * 0.016 * sway, dir + Math.PI / 2));
    const profile = u < 0.88 ? 0.52 + 0.48 * Math.sin(Math.PI * (u / 0.88) ** 0.75) : ((1 - u) / 0.12) ** 0.72 * 0.52;
    const hw = (wMax / 2) * profile;
    L.push(add(ax, polar(hw, dir - Math.PI / 2)));
    R.push(add(ax, polar(hw, dir + Math.PI / 2)));
  }
  const hypoPts = [...L, tip, ...[...R].reverse()];
  shape(out, r, hypoPts, tone(r, { pc: "--propagule", spread: 0.04, hue: 8 }), { deep: 0.58 });

  const i0 = Math.floor(n * 0.46);
  const tipPts = [...L.slice(i0), tip, ...[...R.slice(i0)].reverse()];
  out.push(`<path class="wash"${vars(tone(r, { pc: "--propagule-tip", spread: 0.03 }))} d="${closed(tipPts)}"/>`);

  const cN = polar(wMax * 0.32, dir + Math.PI / 2);
  const cBand = [
    add(collar, cN),
    add(add(collar, polar(len * 0.028, dir)), cN),
    sub(add(collar, polar(len * 0.028, dir)), cN),
    sub(collar, cN),
  ];
  out.push(`<path class="wash"${vars(tone(r, { pc: "--flower-mangrove", dl: 0.03 }))} d="${closed(cBand)}"/>`);
}

function stiltArch(
  out: Out,
  r: Rng,
  g0: number,
  g1: number,
  ctrl: Pt[],
  { w0, w1, dl = 0, inkFrom = 0.06, cap = "taper", pc = "--bark-red" }: { w0: number; w1: number; dl?: number; inkFrom?: number; cap?: "taper" | "blunt"; pc?: string },
) {
  return grow(out, g0, g1, () => {
    const res = limb(out, r, ctrl, { w0, w1, cap, pc, lenticels: true, inkFrom });
    let calluses = "";
    const step = Math.max(4, Math.floor(res.n / 9));
    for (let i = 5; i < res.n - 3; i += step) {
      const p = lerp(res.L[i], res.R[i], 0.25 + r() * 0.5);
      const a = angleOf(res.pts, i) + Math.PI / 2;
      const hw = Math.min(3.2, res.width(i / res.n) * 0.23);
      const nrm = polar(1.0, a + Math.PI / 2);
      const p0 = add(p, polar(-hw, a));
      const p1 = add(p, polar(hw, a));
      calluses += closed([p0, add(lerp(p0, p1, 0.5), nrm), p1, sub(lerp(p0, p1, 0.5), nrm)]);
    }
    if (calluses) {
      out.push(`<path class="wash"${vars(tone(r, { pc: "--flower-mangrove", dl: 0.04 + dl, dc: 0.35 }))} d="${calluses}"/>`);
    }
    return res;
  });
}

export function redmangrove(out: Out, r: Rng, base: Pt = [0, 0]) {
  const W = waterOf("mangrove");
  const at = (x: number, y: number): Pt => add(base, [x, y]);

  const trunkCtrl = [at(0, 0), at(12, -W * 0.72), at(28, -W * 1.45), at(58, -W * 2.18), at(108, -W * 2.86), at(174, -W * 3.42)];
  const trunkG = [0, 0.22];

  // 1. Back-rank catenary stilt-root arches.
  stiltArch(out, r, 0.09, 0.32, [at(24, -W * 1.38), at(-52, -W * 0.96), at(-92, 0)], { w0: 14, w1: 9.5, dl: -0.06, inkFrom: 0.05 });
  stiltArch(out, r, 0.09, 0.34, [at(26, -W * 1.32), at(46, -W * 0.72), at(52, 0)], { w0: 13.5, w1: 9.5, dl: -0.05, inkFrom: 0.05 });
  const backRightG = [0.1, 0.36];
  const backRight = stiltArch(out, r, backRightG[0], backRightG[1], [at(28, -W * 1.28), at(122, -W * 0.88), at(158, 0)], { w0: 15, w1: 10.5, dl: -0.04, inkFrom: 0.05 });
  const brIdx = Math.round(backRight.n * 0.38);
  stiltArch(out, r, gate(backRight, backRightG, brIdx) + 0.01, 0.42, [lerp(backRight.pts[brIdx], backRight.L[brIdx], 0.25), at(198, -W * 0.68), at(228, 0)], { w0: 11, w1: 8.5, dl: -0.04, inkFrom: 0.08 });

  // 2. Main leaning grey-brown trunk.
  const trunk = grow(out, trunkG[0], trunkG[1], () =>
    limb(out, r, trunkCtrl, { w0: 28, w1: 13.5, pc: "--bark-mangrove", lenticels: true, swell: [[0.38, 0.14], [0.64, 0.12]] }),
  );

  // 3. Front-rank multi-order catenary stilt-root arcade.
  const flIdx = Math.round(trunk.n * 0.33);
  const flG = [gate(trunk, trunkG, flIdx) + 0.01, 0.34];
  const flRoot = stiltArch(out, r, flG[0], flG[1], [lerp(trunk.pts[flIdx], trunk.L[flIdx], 0.35), at(-36, -W * 0.8), at(-60, 0)], { w0: 13.5, w1: 10.5, dl: 0.02, inkFrom: 0.08 });
  const flToeIdx = Math.round(flRoot.n * 0.8);
  stiltArch(out, r, gate(flRoot, flG, flToeIdx) + 0.01, 0.42, [flRoot.pts[flToeIdx], at(-76, -W * 0.1), at(-84, 0)], { w0: 7.5, w1: 5, inkFrom: 0.08 });

  const fcIdx = Math.round(trunk.n * 0.43);
  const fcG = [gate(trunk, trunkG, fcIdx) + 0.01, 0.37];
  const fcRoot = stiltArch(out, r, fcG[0], fcG[1], [lerp(trunk.pts[fcIdx], trunk.R[fcIdx], 0.38), at(88, -W * 0.96), at(108, 0)], { w0: 14.5, w1: 11.5, dl: 0.03, inkFrom: 0.08 });
  const fcToeIdx = Math.round(fcRoot.n * 0.8);
  stiltArch(out, r, gate(fcRoot, fcG, fcToeIdx) + 0.01, 0.43, [fcRoot.pts[fcToeIdx], at(124, -W * 0.12), at(132, 0)], { w0: 8, w1: 5.5, inkFrom: 0.08 });

  const fr1Idx = Math.round(trunk.n * 0.37);
  const fr1G = [gate(trunk, trunkG, fr1Idx) + 0.01, 0.38];
  const fr1 = stiltArch(out, r, fr1G[0], fr1G[1], [lerp(trunk.pts[fr1Idx], trunk.R[fr1Idx], 0.38), at(144, -W * 0.94), at(192, 0)], { w0: 14.5, w1: 11, dl: 0.02, inkFrom: 0.08 });

  const fr2Idx = Math.round(fr1.n * 0.42);
  const fr2G = [gate(fr1, fr1G, fr2Idx) + 0.01, 0.43];
  const fr2 = stiltArch(out, r, fr2G[0], fr2G[1], [lerp(fr1.pts[fr2Idx], fr1.L[fr2Idx], 0.22), at(234, -W * 0.7), at(268, 0)], { w0: 12, w1: 9.5, dl: 0.03, inkFrom: 0.08 });

  const fr3Idx = Math.round(fr2.n * 0.44);
  stiltArch(out, r, gate(fr2, fr2G, fr3Idx) + 0.02, 0.66, [lerp(fr2.pts[fr3Idx], fr2.L[fr3Idx], 0.22), at(308, -W * 0.42), at(334, 0)], { w0: 9.5, w1: 7.5, dl: 0.04, inkFrom: 0.08 });

  // 4. Primary canopy boughs and upturned sympodial foliage twigs.
  const bAIdx = Math.round(trunk.n * 0.62);
  const boughAG = [gate(trunk, trunkG, bAIdx) + 0.01, 0.38];
  const boughA = grow(out, boughAG[0], boughAG[1], () =>
    limb(out, r, [trunk.pts[bAIdx], at(-14, -W * 2.86), at(-72, -W * 3.48)], { w0: 14, w1: 6.5, pc: "--bark-mangrove", lenticels: true, inkFrom: 0.06 }),
  );
  const tA1Idx = Math.round(boughA.n * 0.52);
  const twigA1G = [gate(boughA, boughAG, tA1Idx) + 0.01, 0.44];
  const twigA1 = grow(out, twigA1G[0], twigA1G[1], () =>
    limb(out, r, [boughA.pts[tA1Idx], at(-10, -W * 3.35), at(2, -W * 3.74)], { w0: 7.5, w1: 4.5, pc: "--bark-mangrove", inkFrom: 0.08 }),
  );

  const boughBG = [trunkG[1], 0.42];
  const boughB = grow(out, boughBG[0], boughBG[1], () =>
    limb(out, r, [trunk.pts[trunk.n], at(202, -W * 3.76), at(236, -W * 4.04)], { w0: 13.5, w1: 6.5, pc: "--bark-mangrove", lenticels: true, inkFrom: 0.04 }),
  );
  const tB1Idx = Math.round(trunk.n * 0.86);
  const twigB1G = [gate(trunk, trunkG, tB1Idx) + 0.01, 0.43];
  const twigB1 = grow(out, twigB1G[0], twigB1G[1], () =>
    limb(out, r, [trunk.pts[tB1Idx], at(114, -W * 3.56), at(96, -W * 3.98)], { w0: 9, w1: 5, pc: "--bark-mangrove", inkFrom: 0.06 }),
  );

  const bCIdx = Math.round(trunk.n * 0.78);
  const boughCG = [gate(trunk, trunkG, bCIdx) + 0.01, 0.52];
  const boughC = grow(out, boughCG[0], boughCG[1], () =>
    limb(out, r, [trunk.pts[bCIdx], at(238, -W * 3.16), at(334, -W * 3.58)], { w0: 14.5, w1: 6.5, pc: "--bark-mangrove", lenticels: true, inkFrom: 0.06 }),
  );
  const tC1Idx = Math.round(boughC.n * 0.54);
  const twigC1G = [gate(boughC, boughCG, tC1Idx) + 0.01, 0.64];
  const twigC1 = grow(out, twigC1G[0], twigC1G[1], () =>
    limb(out, r, [boughC.pts[tC1Idx], at(266, -W * 3.58), at(286, -W * 3.92)], { w0: 7.5, w1: 4.5, pc: "--bark-mangrove", inkFrom: 0.08 }),
  );

  const bDIdx = Math.round(trunk.n * 0.54);
  const boughDG = [gate(trunk, trunkG, bDIdx) + 0.01, 0.54];
  const boughD = grow(out, boughDG[0], boughDG[1], () =>
    limb(out, r, [trunk.pts[bDIdx], at(228, -W * 2.28), at(398, -W * 2.84)], { w0: 15, w1: 6.5, pc: "--bark-mangrove", lenticels: true, inkFrom: 0.06 }),
  );
  const tD1Idx = Math.round(boughD.n * 0.62);
  const twigD1G = [gate(boughD, boughDG, tD1Idx) + 0.01, 0.66];
  const twigD1 = grow(out, twigD1G[0], twigD1G[1], () =>
    limb(out, r, [boughD.pts[tD1Idx], at(314, -W * 2.76), at(348, -W * 3.12)], { w0: 8, w1: 4.8, pc: "--bark-mangrove", inkFrom: 0.08 }),
  );

  // 5. Plumb-vertical aerial drop roots descending from Bough D during scroll.
  const drop1Idx = Math.round(boughD.n * 0.44);
  const drop1Node = boughD.pts[drop1Idx];
  const drop1G = [Math.max(0.49, gate(boughD, boughDG, drop1Idx) + 0.02), 0.72];
  const drop1 = stiltArch(out, r, drop1G[0], drop1G[1], [drop1Node, at(drop1Node[0] + 3, -W * 1.56), at(drop1Node[0] + 5, -W * 0.92)], { w0: 7.5, w1: 6, dl: 0.01, inkFrom: 0.06 });
  const dropFork = drop1.pts[drop1.n];
  stiltArch(out, r, drop1G[1] + 0.01, 0.86, [dropFork, at(dropFork[0] - 10, -W * 0.54), at(dropFork[0] - 16, -W * 0.16)], { w0: 5.5, w1: 4.5, cap: "blunt", inkFrom: 0.06 });
  stiltArch(out, r, drop1G[1] + 0.02, 0.88, [dropFork, at(dropFork[0] + 11, -W * 0.52), at(dropFork[0] + 17, -W * 0.14)], { w0: 5.5, w1: 4.5, cap: "blunt", inkFrom: 0.06 });

  const drop2Idx = Math.round(boughD.n * 0.72);
  const drop2Node = boughD.pts[drop2Idx];
  const drop2G0 = Math.max(0.54, gate(boughD, boughDG, drop2Idx) + 0.03);
  grow(out, drop2G0, 0.82, () => {
    const res = limb(out, r, [drop2Node, at(drop2Node[0] + 2, -W * 1.88), at(drop2Node[0] + 3, -W * 1.32)], { w0: 6.5, w1: 5.5, cap: "blunt", pc: "--bark-red", lenticels: true, inkFrom: 0.06 });
    const tip = res.pts[res.n];
    const capPts = roundPts(add(tip, [0, -2]), 6, 3.2, Math.PI / 2, 8);
    out.push(`<path class="wash"${vars(tone(r, { pc: "--propagule-tip", dl: -0.02 }))} d="${closed(capPts)}"/>`);
    return res;
  });

  // 6. Canopy foliage rosettes, terminal stipular candles, 4-merous star cymes, and pendulous propagules.
  const twigs: {
    res: ReturnType<typeof limb>;
    g: number[];
    nodes: { frac: number; len: number; cluster?: boolean; underL?: boolean; underR?: boolean; sen?: -1 | 0 | 1; cyme?: boolean; prop?: number; late?: boolean }[];
  }[] = [
    { res: boughA, g: boughAG, nodes: [{ frac: 0.58, len: 56, underL: true, sen: 1 }, { frac: 0.96, len: 62, cluster: true, cyme: true, prop: 98 }] },
    { res: twigA1, g: twigA1G, nodes: [{ frac: 0.52, len: 52, underR: true }, { frac: 0.96, len: 60, cluster: true, cyme: true, late: true }] },
    { res: twigB1, g: twigB1G, nodes: [{ frac: 0.52, len: 54, underL: true }, { frac: 0.96, len: 64, cluster: true, cyme: true, prop: 104 }] },
    { res: boughB, g: boughBG, nodes: [{ frac: 0.5, len: 58, underR: true, sen: -1 }, { frac: 0.96, len: 64, cluster: true, cyme: true, prop: 112, late: true }] },
    { res: boughC, g: boughCG, nodes: [{ frac: 0.42, len: 56, underL: true }, { frac: 0.72, len: 58, underR: true, prop: 108, late: true }, { frac: 0.96, len: 62, cluster: true, cyme: true, late: true }] },
    { res: twigC1, g: twigC1G, nodes: [{ frac: 0.52, len: 54, underR: true, late: true }, { frac: 0.96, len: 60, cluster: true, cyme: true, prop: 96, late: true }] },
    { res: boughD, g: boughDG, nodes: [{ frac: 0.48, len: 56, underL: true, sen: 1, prop: 114 }, { frac: 0.76, len: 58, underR: true, cyme: true, prop: 106, late: true }, { frac: 0.96, len: 62, cluster: true, cyme: true, late: true }] },
    { res: twigD1, g: twigD1G, nodes: [{ frac: 0.52, len: 54, underL: true, late: true }, { frac: 0.96, len: 60, cluster: true, cyme: true, prop: 102, late: true }] },
  ];

  for (const { res, g, nodes } of twigs) {
    for (const nd of nodes) {
      const idx = Math.min(res.n, Math.max(1, Math.round(res.n * nd.frac)));
      const p = res.pts[idx];
      const dir = angleOf(res.pts, idx);
      const arrives = gate(res, g, idx);
      const leafG = nd.late ? Math.max(0.5, arrives + 0.02) : arrives + 0.02;

      if (nd.prop) {
        part(out, Math.max(0.52, arrives + 0.08), p, () => {
          mangrovePropagule(out, r, p, nd.prop!, (r() - 0.5) * 0.08);
        });
      }
      part(out, Math.min(0.88, leafG), p, () => {
        if (nd.cluster) leafCluster(out, r, p, dir, nd.len, { candle: true, senescent: nd.sen ?? 0 });
        else leafNode(out, r, p, dir, nd.len, { underLeft: nd.underL, underRight: nd.underR, senescent: nd.sen ?? 0 });
      });
      if (nd.cyme) {
        part(out, Math.max(0.48, Math.min(0.91, leafG + 0.06)), p, () => {
          mangroveCyme(out, r, p, dir + (r() < 0.5 ? -1 : 1) * rad(32), 26);
        });
      }
    }
  }
}

export function redmangroveDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-120, 40], [-30, -10], [65, -55]], { w0: 13, w1: 7.5, pc: "--bark-mangrove", lenticels: true });
  const p0 = twig.pts[Math.round(twig.n * 0.36)];
  const p1 = twig.pts[Math.round(twig.n * 0.72)];
  const p2 = twig.pts[twig.n];
  const d0 = angleOf(twig.pts, Math.round(twig.n * 0.36));
  const d1 = angleOf(twig.pts, Math.round(twig.n * 0.72));
  const d2 = angleOf(twig.pts, twig.n);

  mangrovePropagule(out, r, p0, 175, -0.05);
  mangrovePropagule(out, r, p1, 195, 0.04);
  mangroveLeaf(out, r, p0, d0 - rad(48), 96, { senescent: true });
  mangroveLeaf(out, r, p0, d0 + rad(44), 102);
  mangroveLeaf(out, r, p1, d1 - rad(44), 108, { under: true, tilt: 0.82 });
  mangroveLeaf(out, r, p1, d1 + rad(40), 112);
  mangroveCyme(out, r, p1, d1 - rad(24), 46);
  leafCluster(out, r, p2, d2, 106, { candle: true });
}

// ---------------------------------------------------------------------------
// 2. Black mangrove (Avicennia germinans): dark fissured trunk over a horizontal subterranean mud
// cable root issuing a dense field of erect pencil-like breathing pegs (pneumatophores) that cross
// the rising waterline; opposite lance-elliptic leaves dark green above and silvery-white salt-
// crusted beneath, short white 4-lobed yellow-throated flower spikes, and flat velvety lima-bean
// viviparous propagules.

function avicenniaFlowerSpike(out: Out, r: Rng, base: Pt, dir: number, size: number) {
  const tip = add(base, polar(size * 0.55, dir));
  stalk(out, quad(base, lerp(base, tip, 0.5), tip), 2.4, 1.8, tone(r, { pc: "--pl-spanishmoss", dl: -0.06 }), 3);
  for (const [u, da] of [
    [0.55, -0.45],
    [0.62, 0.45],
    [0.98, 0],
  ] as const) {
    const fC = add(lerp(base, tip, u), polar(size * 0.16 * da, dir + Math.PI / 2));
    const fDir = dir + da * 0.6;
    let lobes = "";
    for (let k = 0; k < 4; k++) {
      const a = fDir + rad(45 + k * 90);
      lobes += closed(roundPts(add(fC, polar(size * 0.14, a)), size * 0.13, size * 0.095, a, 6));
    }
    out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-mangrove", dl: 0.08, dc: 0.28 }))} d="${lobes}"/><path class="ink hair" d="${lobes}"/>`);
    const throat = closed(roundPts(fC, size * 0.08, size * 0.08, 0, 6));
    out.push(`<path class="wash"${vars(tone(r, { pc: "--leaf-senescent", dl: 0.02 }))} d="${throat}"/>`);
  }
}

function avicenniaPropagule(out: Out, r: Rng, base: Pt, dir: number, len: number) {
  // Asymmetric, laterally flattened, velvety grey-green lima-bean / teardrop capsule.
  const tip = add(base, polar(len, dir));
  const mid = lerp(base, tip, 0.46);
  const nL = polar(len * 0.36, dir - Math.PI / 2);
  const nR = polar(len * 0.24, dir + Math.PI / 2);
  const pts = [
    add(base, mul(nL, 0.3)),
    add(mid, nL),
    add(lerp(base, tip, 0.84), mul(nL, 0.55)),
    tip,
    add(lerp(base, tip, 0.8), sub([0, 0], mul(nR, 0.5))),
    sub(mid, nR),
    sub(base, mul(nR, 0.3)),
  ];
  shape(out, r, pts, tone(r, { pc: "--propagule", dl: 0.06, dc: 0.72, spread: 0.04 }), { deep: 0.45 });
  out.push(`<path class="ink hair" d="M${P1(lerp(base, tip, 0.15))}Q${P1(add(mid, mul(nL, 0.25)))} ${P1(lerp(base, tip, 0.88))}"/>`);
}

export function blackmangrove(out: Out, r: Rng, base: Pt = [0, 0]) {
  const W = waterOf("mangrove");
  const at = (x: number, y: number): Pt => add(base, [x, y]);

  // 1. Horizontal mud-level cable roots radiating left and right along y = 0, sending up a
  // forest of erect pencil-like pneumatophores (breathing pegs) across the waterline.
  const cableRG = [0.16, 0.62];
  const cableR = grow(out, cableRG[0], cableRG[1], () =>
    limb(out, r, [at(0, 0), at(175, 0), at(355, 0)], { w0: 14, w1: 7, pc: "--bark-black", inkFrom: 0.05 }),
  );
  const cableLG = [0.14, 0.44];
  const cableL = grow(out, cableLG[0], cableLG[1], () =>
    limb(out, r, [at(0, 0), at(-55, 0), at(-112, 0)], { w0: 12, w1: 6.5, pc: "--bark-black", inkFrom: 0.06 }),
  );

  // Erect pencil pneumatophores along the right cable root (tall enough that every peg crosses
  // both the low-tide and high-tide waterlines and holds its lenticellate tip above high water).
  const pegsR: [number, number, number][] = [
    [0.12, 1.56, -3],
    [0.2, 1.32, 2],
    [0.29, 1.62, -2],
    [0.38, 1.24, 3],
    [0.47, 1.5, -1],
    [0.56, 1.18, 2],
    [0.65, 1.42, -3],
    [0.74, 1.12, 2],
    [0.83, 1.34, -2],
    [0.92, 1.06, 1],
    [0.98, 1.22, -1],
  ];
  for (const [frac, hMul, lean] of pegsR) {
    const idx = Math.min(cableR.n, Math.max(1, Math.round(cableR.n * frac)));
    const p0 = cableR.pts[idx];
    const g0 = gate(cableR, cableRG, idx) + 0.01;
    const h = W * hMul;
    stiltArch(
      out,
      r,
      g0,
      Math.min(0.86, g0 + 0.2),
      [p0, add(p0, [lean * 0.5, -h * 0.52]), add(p0, [lean, -h])],
      { w0: 7, w1: 5, cap: "blunt", pc: "--bark-black", inkFrom: 0.06 },
    );
  }
  // Pneumatophores on the left cable root.
  for (const [frac, hMul, lean] of [
    [0.32, 1.44, -2],
    [0.62, 1.2, 2],
    [0.92, 1.32, -3],
  ] as const) {
    const idx = Math.round(cableL.n * frac);
    const p0 = cableL.pts[idx];
    const g0 = gate(cableL, cableLG, idx) + 0.01;
    const h = W * hMul;
    stiltArch(
      out,
      r,
      g0,
      Math.min(0.76, g0 + 0.18),
      [p0, add(p0, [lean * 0.5, -h * 0.52]), add(p0, [lean, -h])],
      { w0: 6.8, w1: 4.8, cap: "blunt", pc: "--bark-black", inkFrom: 0.06 },
    );
  }

  // 2. Dark fissured trunk and ascending crown boughs: inner shoots leaf out by low tide so the
  // tree is never a bare stick, while outer inward-reaching boughs extend on scroll.
  const trunkG = [0.1, 0.34];
  const trunk = grow(out, trunkG[0], trunkG[1], () =>
    limb(out, r, [at(0, 0), at(18, -W * 1.15), at(54, -W * 2.28), at(116, -W * 3.24)], {
      w0: 25,
      w1: 12,
      pc: "--bark-black",
      lenticels: true,
    }),
  );

  const b1Idx = Math.round(trunk.n * 0.56);
  const b1G = [gate(trunk, trunkG, b1Idx) + 0.01, 0.4];
  const bough1 = grow(out, b1G[0], b1G[1], () =>
    limb(out, r, [trunk.pts[b1Idx], at(-18, -W * 2.52), at(-64, -W * 3.18)], { w0: 12.5, w1: 5.5, pc: "--bark-black", inkFrom: 0.06 }),
  );

  const b3G = [trunkG[1], 0.42];
  const bough3 = grow(out, b3G[0], b3G[1], () =>
    limb(out, r, [trunk.pts[trunk.n], at(148, -W * 3.62), at(188, -W * 3.92)], { w0: 11.5, w1: 5, pc: "--bark-black", inkFrom: 0.05 }),
  );

  const b2Idx = Math.round(trunk.n * 0.76);
  const b2G = [Math.max(0.46, gate(trunk, trunkG, b2Idx) + 0.02), 0.76];
  const bough2 = grow(out, b2G[0], b2G[1], () =>
    limb(out, r, [trunk.pts[b2Idx], at(174, -W * 2.86), at(262, -W * 3.36)], { w0: 13, w1: 5.5, pc: "--bark-black", inkFrom: 0.06 }),
  );

  const b4Idx = Math.round(trunk.n * 0.46);
  const b4G = [Math.max(0.48, gate(trunk, trunkG, b4Idx) + 0.02), 0.78];
  const bough4 = grow(out, b4G[0], b4G[1], () =>
    limb(out, r, [trunk.pts[b4Idx], at(156, -W * 2.08), at(274, -W * 2.42)], { w0: 13, w1: 5.5, pc: "--bark-black", inkFrom: 0.06 }),
  );

  // Opposite lance-elliptic leaves (dark green above, silvery-white salt-crusted `--pl-spanishmoss`
  // beneath), white 4-lobed flower spikes, and lima-bean viviparous propagules.
  for (const [res, g] of [
    [bough1, b1G],
    [bough3, b3G],
    [bough2, b2G],
    [bough4, b4G],
  ] as const) {
    for (const [frac, len, hasFl, hasProp] of [
      [0.44, 52, false, true],
      [0.72, 56, true, false],
      [0.96, 58, true, true],
    ] as const) {
      const idx = Math.round(res.n * frac);
      const p = res.pts[idx];
      const dir = angleOf(res.pts, idx);
      const arrives = gate(res, g, idx);
      part(out, Math.min(0.91, arrives + 0.02), p, () => {
        // Opposite lance-elliptic pair, one tilted to show the silvery-grey underside.
        mangroveLeaf(out, r, p, dir - rad(44), len, { acute: true, under: true, pc: "--pl-spanishmoss", tilt: 0.76 });
        mangroveLeaf(out, r, p, dir + rad(42), len, { acute: true });
        if (frac > 0.9) {
          mangroveLeaf(out, r, p, dir - rad(18), len * 0.88, { acute: true });
          mangroveLeaf(out, r, p, dir + rad(18), len * 0.88, { acute: true, under: true, pc: "--pl-spanishmoss", tilt: 0.78 });
        }
        if (hasProp) avicenniaPropagule(out, r, p, dir + rad(58), 32);
        if (hasFl) avicenniaFlowerSpike(out, r, p, dir, 38);
      });
    }
  }
}

export function blackmangroveDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-110, 45], [-20, 0], [70, -45]], { w0: 11, w1: 6, pc: "--bark-black", lenticels: true });
  for (const [frac, len, prop] of [
    [0.36, 95, true],
    [0.72, 102, false],
    [0.98, 98, true],
  ] as const) {
    const idx = Math.round(twig.n * frac);
    const p = twig.pts[idx];
    const d = angleOf(twig.pts, idx);
    mangroveLeaf(out, r, p, d - rad(44), len, { acute: true, under: true, pc: "--pl-spanishmoss", tilt: 0.78 });
    mangroveLeaf(out, r, p, d + rad(40), len, { acute: true });
    if (prop) avicenniaPropagule(out, r, p, d + rad(62), 56);
  }
  avicenniaFlowerSpike(out, r, twig.pts[twig.n], angleOf(twig.pts, twig.n), 68);
}

// ---------------------------------------------------------------------------
// 3. White mangrove (Laguncularia racemosa): open-crowned side branch reaching in during scroll;
// opposite, thick, rounded-oblong yellow-green blades with diagnostic carmine-red petioles bearing
// paired extrafloral salt glands at the blade base, and axillary spikes of tiny cream flowers and
// 10-ribbed obovoid samaras.

function lagunculariaLeaf(out: Out, r: Rng, base: Pt, dir: number, len: number, tilt = 1) {
  const pet = len * 0.2;
  const b0 = add(base, polar(pet, dir));
  const tip = add(base, polar(len, dir));
  const w = len * 0.44 * tilt;

  // Carmine-red petiole with two opposite raised salt-gland bumps just below the blade base.
  stalk(out, quad(base, lerp(base, b0, 0.5), b0), Math.max(2.6, len * 0.052), Math.max(2.2, len * 0.044), tone(r, { pc: "--petiole-red", spread: 0.03 }), 3);
  const gPos = lerp(base, b0, 0.82);
  let glands = "";
  for (const sg of [-1, 1]) {
    const gC = add(gPos, polar(sg * Math.max(2.4, len * 0.048), dir + Math.PI / 2));
    glands += closed(roundPts(gC, 2.2, 1.6, dir, 6));
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--petiole-red", dl: -0.06 }))} d="${glands}"/><path class="ink hair" d="${glands}"/>`);

  // Broadly oblong-obovate rounded blade (blunt/slightly emarginate apex, same yellow-green both sides).
  const n = 7;
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const ax = lerp(b0, tip, u);
    const env = Math.sin(Math.PI * u ** 0.78) * (0.92 + 0.14 * u);
    const hw = (w / 2) * env;
    L.push(add(ax, polar(hw, dir - Math.PI / 2)));
    R.push(add(ax, polar(hw, dir + Math.PI / 2)));
  }
  shape(out, r, [...L, ...[...R].reverse()], tone(r, { spread: 0.06, hue: 10 }), { deep: 0.52 });
  const midEnd = lerp(b0, tip, 0.9);
  out.push(`<path class="ink hair" d="M${P1(b0)}L${P1(midEnd)}"/>`);
}

function lagunculariaRaceme(out: Out, r: Rng, base: Pt, dir: number, len: number) {
  const tip = add(base, polar(len, dir));
  stalk(out, quad(base, lerp(base, tip, 0.5), tip), 2.2, 1.5, tone(r, { pc: "--petiole-red", dl: 0.04 }), 4);
  for (let i = 1; i <= 5; i++) {
    const u = i / 5.4;
    const sg = i % 2 ? -1 : 1;
    const p = add(lerp(base, tip, u), polar(sg * 4, dir + Math.PI / 2));
    const a = dir + sg * 0.55;
    if (i <= 2) {
      // Obovoid longitudinally 10-ribbed greenish-tan samara fruit.
      const fTip = add(p, polar(len * 0.28, a));
      const fMid = lerp(p, fTip, 0.58);
      const fN = polar(len * 0.095, a + Math.PI / 2);
      const pts = [p, add(fMid, fN), fTip, sub(fMid, fN)];
      shape(out, r, pts, tone(r, { pc: "--propagule", dl: 0.04, spread: 0.03 }), { deep: 0.45 });
      out.push(`<path class="ink hair" d="M${P1(p)}L${P1(fTip)}"/>`);
    } else {
      // Small cream 5-merous chalice flower.
      const cup = closed(roundPts(add(p, polar(4.5, a)), 4.8, 3.8, a, 6));
      out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-mangrove", dl: 0.06, dc: 0.35 }))} d="${cup}"/><path class="ink hair" d="${cup}"/>`);
    }
  }
}

export function whitemangrove(out: Out, r: Rng, base: Pt = [0, 0]) {
  const at = (x: number, y: number): Pt => add(base, [x, y]);
  const mainG = [0.5, 0.8];
  const main = grow(out, mainG[0], mainG[1], () =>
    limb(out, r, [at(0, 0), at(185, 22), at(370, -14), at(520, -48)], { w0: 18, w1: 6.5, pc: "--bark-mangrove", lenticels: true }),
  );

  const f1Idx = Math.round(main.n * 0.38);
  const f1G = [gate(main, mainG, f1Idx) + 0.01, 0.85];
  const fork1 = grow(out, f1G[0], f1G[1], () =>
    limb(out, r, [main.pts[f1Idx], at(295, -72), at(415, -135)], { w0: 10.5, w1: 5, pc: "--bark-mangrove", inkFrom: 0.08 }),
  );

  const f2Idx = Math.round(main.n * 0.62);
  const f2G = [gate(main, mainG, f2Idx) + 0.01, 0.88];
  const fork2 = grow(out, f2G[0], f2G[1], () =>
    limb(out, r, [main.pts[f2Idx], at(410, 48), at(505, 82)], { w0: 9.5, w1: 4.8, pc: "--bark-mangrove", inkFrom: 0.08 }),
  );

  for (const [res, g] of [
    [main, mainG],
    [fork1, f1G],
    [fork2, f2G],
  ] as const) {
    for (const [frac, len, rac] of [
      [0.36, 54, false],
      [0.68, 58, true],
      [0.96, 60, true],
    ] as const) {
      const idx = Math.round(res.n * frac);
      const p = res.pts[idx];
      const d = angleOf(res.pts, idx);
      const arrives = gate(res, g, idx);
      part(out, Math.min(0.92, arrives + 0.02), p, () => {
        lagunculariaLeaf(out, r, p, d - rad(48), len, 0.9);
        lagunculariaLeaf(out, r, p, d + rad(46), len, 0.94);
        if (rac) lagunculariaRaceme(out, r, p, d + (frac > 0.8 ? 0 : rad(-24)), 54);
      });
    }
  }
}

export function whitemangroveDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-120, 30], [-20, 0], [70, -25]], { w0: 11, w1: 6, pc: "--bark-mangrove", lenticels: true });
  for (const [frac, len] of [
    [0.42, 96],
    [0.88, 104],
  ] as const) {
    const idx = Math.round(twig.n * frac);
    const p = twig.pts[idx];
    const d = angleOf(twig.pts, idx);
    lagunculariaLeaf(out, r, p, d - rad(52), len, 0.92);
    lagunculariaLeaf(out, r, p, d + rad(48), len, 0.96);
  }
  lagunculariaRaceme(out, r, twig.pts[twig.n], angleOf(twig.pts, twig.n), 92);
}

// ---------------------------------------------------------------------------
// 4. Buttonwood (Conocarpus erectus): dark fissured side branch reaching in during scroll;
// spirally alternate elliptic-oblanceolate acute leaves (green and silver-sericeous shoots) and
// branched panicles of globose reddish-brown scale-tessellated cone heads ("buttons").

function buttonConeCluster(out: Out, r: Rng, base: Pt, dir: number, size: number) {
  const mainTip = add(base, polar(size, dir));
  stalk(out, quad(base, lerp(base, mainTip, 0.5), mainTip), 2.4, 1.6, tone(r, { pc: "--bark-black", dl: 0.05 }), 3);
  const heads: [number, number, number][] = [
    [0.48, -0.52, 0.24],
    [0.68, 0.48, 0.25],
    [1.0, 0, 0.28],
  ];
  for (const [u, da, rMul] of heads) {
    const p0 = lerp(base, mainTip, u);
    const hC = u < 1 ? add(p0, polar(size * 0.26, dir + da)) : mainTip;
    if (u < 1) stalk(out, quad(p0, lerp(p0, hC, 0.5), hC), 1.8, 1.4, tone(r, { pc: "--bark-black", dl: 0.05 }), 2);
    const radH = size * rMul;
    const body = roundPts(hC, radH, radH * 0.92, dir, 10);
    shape(out, r, body, tone(r, { pc: "--cone-buttonwood", spread: 0.04, hue: 8 }), { deep: 0.55 });
    // Imbricate scale cross-hatching on the globose button cone.
    let scales = "";
    for (const k of [-0.45, 0, 0.45]) {
      const pA = add(hC, polar(radH * 0.72, dir + k - 1.1));
      const pB = add(hC, polar(radH * 0.72, dir + k + 1.1));
      scales += `M${P1(pA)}Q${P1(add(hC, polar(radH * 0.2, dir + k)))} ${P1(pB)}`;
    }
    out.push(`<path class="ink hair" d="${scales}"/>`);
  }
}

export function buttonwood(out: Out, r: Rng, base: Pt = [0, 0]) {
  const at = (x: number, y: number): Pt => add(base, [x, y]);
  const mainG = [0.52, 0.82];
  const main = grow(out, mainG[0], mainG[1], () =>
    limb(out, r, [at(0, 0), at(175, -18), at(355, 16), at(495, 42)], { w0: 19, w1: 6.5, pc: "--bark-black", lenticels: true }),
  );

  const f1Idx = Math.round(main.n * 0.42);
  const f1G = [gate(main, mainG, f1Idx) + 0.01, 0.87];
  const fork1 = grow(out, f1G[0], f1G[1], () =>
    limb(out, r, [main.pts[f1Idx], at(310, -68), at(435, -112)], { w0: 10.5, w1: 4.8, pc: "--bark-black", inkFrom: 0.08 }),
  );

  const f2Idx = Math.round(main.n * 0.66);
  const f2G = [gate(main, mainG, f2Idx) + 0.01, 0.89];
  const fork2 = grow(out, f2G[0], f2G[1], () =>
    limb(out, r, [main.pts[f2Idx], at(395, 76), at(478, 118)], { w0: 9, w1: 4.5, pc: "--bark-black", inkFrom: 0.08 }),
  );

  // Spirally alternate acute leaves (mixing green and silvery-sericeous var. sericeus leaves) +
  // globose reddish-brown button cones.
  for (const [res, g, silver] of [
    [main, mainG, false],
    [fork1, f1G, true],
    [fork2, f2G, false],
  ] as const) {
    for (let k = 1; k <= 5; k++) {
      const frac = 0.24 + k * 0.14;
      const idx = Math.min(res.n, Math.round(res.n * frac));
      const p = res.pts[idx];
      const d = angleOf(res.pts, idx);
      const side = k % 2 ? -1 : 1;
      const arrives = gate(res, g, idx);
      part(out, Math.min(0.92, arrives + 0.02), p, () => {
        mangroveLeaf(out, r, p, d + side * rad(44), 56, {
          acute: true,
          pc: silver && k % 2 ? "--pl-spanishmoss" : undefined,
          petPc: "--cone-buttonwood",
        });
        if (k >= 4) buttonConeCluster(out, r, p, d - side * rad(28), 52);
      });
    }
  }
}

export function buttonwoodDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-120, 35], [-20, 0], [75, -30]], { w0: 11.5, w1: 6, pc: "--bark-black" });
  for (const [frac, sg, len, silv] of [
    [0.28, -1, 96, false],
    [0.48, 1, 102, true],
    [0.68, -1, 98, false],
    [0.86, 1, 94, true],
  ] as const) {
    const idx = Math.round(twig.n * frac);
    const p = twig.pts[idx];
    const d = angleOf(twig.pts, idx);
    mangroveLeaf(out, r, p, d + sg * rad(46), len, { acute: true, pc: silv ? "--pl-spanishmoss" : undefined, petPc: "--cone-buttonwood" });
  }
  buttonConeCluster(out, r, twig.pts[twig.n], angleOf(twig.pts, twig.n), 92);
}

// ---------------------------------------------------------------------------
// 5. Spanish moss (Tillandsia usneoides): rootless silvery-grey peltate-scaly epiphytic festoons
// cascading from an upper canopy host limb; pendulous zig-zagging sympodial threads with curved
// filiform-subulate distichous blades at each node and tiny chartreuse 3-petalled flowers.

export function spanishmoss(out: Out, r: Rng, base: Pt = [0, 0]) {
  const at = (x: number, y: number): Pt => add(base, [x, y]);
  // Host canopy bough dipping down from the top border (`base = [0, 0]`) during scroll.
  const hostG = [0.5, 0.7];
  const host = grow(out, hostG[0], hostG[1], () =>
    limb(out, r, [at(0, 0), at(78, 46), at(172, 68), at(254, 52)], { w0: 15, w1: 9.5, pc: "--bark-mangrove", lenticels: true }),
  );
  part(out, Math.min(0.84, hostG[1] + 0.02), host.pts[host.n], () => {
    leafCluster(out, r, host.pts[host.n], angleOf(host.pts, host.n), 44, { candle: false });
  });

  const strands: [number, number, number, number][] = [
    [0.24, 395, -14, 0.55],
    [0.4, 510, -6, 0.57],
    [0.56, 565, 4, 0.56],
    [0.72, 470, 12, 0.6],
    [0.88, 375, 18, 0.62],
  ];

  for (const [frac, len, drift, gStart] of strands) {
    const hIdx = Math.round(host.n * frac);
    const p0 = host.pts[hIdx];
    const g0 = Math.max(gStart, gate(host, hostG, hIdx) + 0.02);
    const g1 = Math.min(0.89, g0 + 0.27);
    const segs = 12;
    const ctrl: Pt[] = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const zig = (i % 2 ? 1 : -1) * (5.5 + (1 - u) * 3.5);
      ctrl.push(add(p0, [drift * u + zig, len * u]));
    }
    const strand = grow(out, g0, g1, () =>
      stalk(
        out,
        (t) => {
          const s = t * segs;
          const k = Math.min(segs - 1, Math.floor(s));
          return lerp(ctrl[k], ctrl[k + 1], s - k);
        },
        4.2,
        2.2,
        tone(r, { spread: 0.05, hue: 8 }),
        20,
      ),
    );

    // Curved filiform-subulate grey-silver leaves (and occasional tiny chartreuse 3-petal flowers)
    // curling from the geniculate nodes along the festoon.
    for (let k = 2; k < strand.pts.length - 1; k += 2) {
      const np = strand.pts[k];
      const u = k / (strand.pts.length - 1);
      const arrives = g0 + (g1 - g0) * u;
      part(out, Math.min(0.92, arrives + 0.015), np, () => {
        let curls = "";
        for (const sg of [-1, 1]) {
          const lLen = 28 + (1 - u) * 14;
          const a = Math.PI / 2 + sg * (0.42 + (k % 3) * 0.08);
          const mid = add(np, polar(lLen * 0.52, a));
          const tip = add(mid, polar(lLen * 0.52, a + sg * 0.48));
          const nrm = polar(1.6, a + Math.PI / 2);
          curls += closed([add(np, nrm), add(mid, nrm), tip, sub(mid, nrm), sub(np, nrm)]);
        }
        out.push(`<path class="wash"${vars(tone(r, { spread: 0.05 }))} d="${curls}"/><path class="ink hair" d="${curls}"/>`);
        if (k % 6 === 0) {
          const fl = closed(roundPts(add(np, [0, 6]), 4.2, 2.8, Math.PI / 2, 6));
          out.push(`<path class="wash"${vars(tone(r, { pc: "--leaf-senescent", dl: 0.06 }))} d="${fl}"/>`);
        }
      });
    }
  }
}

export function spanishmossDetail(out: Out, r: Rng) {
  for (const [x0, len] of [
    [-45, 290],
    [15, 320],
    [65, 260],
  ] as const) {
    const pts = sample((t) => [x0 + Math.sin(t * Math.PI * 5) * 9, -120 + t * len], 18);
    stalk(out, (t) => pts[Math.min(18, Math.round(t * 18))], 5, 2.8, tone(r, { spread: 0.04 }), 18);
    for (let k = 2; k < 17; k += 2) {
      const p = pts[k];
      let curls = "";
      for (const sg of [-1, 1]) {
        const a = Math.PI / 2 + sg * 0.48;
        const mid = add(p, polar(24, a));
        const tip = add(mid, polar(24, a + sg * 0.5));
        const nrm = polar(2.1, a + Math.PI / 2);
        curls += closed([add(p, nrm), add(mid, nrm), tip, sub(mid, nrm), sub(p, nrm)]);
      }
      out.push(`<path class="wash"${vars(tone(r, { spread: 0.05 }))} d="${curls}"/><path class="ink thin" d="${curls}"/>`);
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Giant airplant (Tillandsia utriculata): epiphytic tank bromeliad perched on an upper canopy
// limb; spreading cream-green subulate-attenuate blades with broad castaneous-flushed water-holding
// basal sheaths, and a lax 2-pinnate zig-zagging crimson-bracted panicle with violet-and-cream
// tubular flowers.

function airplantBlade(out: Out, r: Rng, base: Pt, dir: number, len: number, sheathW: number) {
  const sEnd = add(base, polar(len * 0.24, dir));
  const mid = add(sEnd, polar(len * 0.4, dir + (dir > -Math.PI / 2 ? 0.18 : -0.18)));
  const tip = add(mid, polar(len * 0.42, dir + (dir > -Math.PI / 2 ? 0.42 : -0.42)));
  const curve = quad(base, mid, tip);
  const n = 8;
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = curve(u);
    const q = curve(Math.min(1, u + 0.05));
    const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
    // Expanded ovate basal tank sheath (u < 0.28) tapering gradually into a narrow channeled tip.
    const hw = u < 0.28 ? (sheathW / 2) * Math.sin(Math.PI * (u / 0.28) * 0.65 + 0.25) : (sheathW / 2) * (1 - u) ** 0.88 * 0.72;
    L.push(add(p, polar(hw, a - Math.PI / 2)));
    R.push(add(p, polar(hw, a + Math.PI / 2)));
  }
  shape(out, r, [...L, tip, ...[...R].reverse()], tone(r, { spread: 0.06, hue: 10 }), { deep: 0.45 });
  // Castaneous-ferruginous flush at the water-impounding basal sheath.
  const sheathPts = [...L.slice(0, 3), ...[...R.slice(0, 3)].reverse()];
  out.push(`<path class="wash"${vars(tone(r, { pc: "--propagule-tip", dl: 0.04, dc: 0.65 }))} d="${closed(sheathPts)}"/>`);
}

export function airplant(out: Out, r: Rng, base: Pt = [0, 0]) {
  const at = (x: number, y: number): Pt => add(base, [x, y]);
  // Host canopy bough dipping down from the top border (`base = [0, 0]`) during scroll, with the
  // giant tank rosette perched at `crown` (`y ≈ 138`) so all upper blades stay below `y = 0`.
  const hostG = [0.54, 0.72];
  const host = grow(out, hostG[0], hostG[1], () =>
    limb(out, r, [at(0, 0), at(86, 112), at(196, 152)], { w0: 16, w1: 10.5, pc: "--bark-mangrove", lenticels: true }),
  );
  part(out, Math.min(0.86, hostG[1] + 0.02), host.pts[host.n], () => {
    leafCluster(out, r, host.pts[host.n], angleOf(host.pts, host.n), 44, { candle: false });
  });
  const cIdx = Math.round(host.n * 0.62);
  const crown = host.pts[cIdx];
  const crownG = gate(host, hostG, cIdx);

  // Branched lax zig-zagging crimson-washed panicle arching down from the rosette center.
  const rachisG = [crownG + 0.04, 0.86];
  const rachis = grow(out, rachisG[0], rachisG[1], () =>
    limb(out, r, [crown, add(crown, [-22, 135]), add(crown, [-44, 275]), add(crown, [-56, 395])], { w0: 6.5, w1: 3, pc: "--petiole-red", inkFrom: 0.08 }),
  );
  for (const [frac, dx, dy] of [
    [0.34, -74, 68],
    [0.54, 72, 78],
    [0.74, -62, 64],
  ] as const) {
    const idx = Math.round(rachis.n * frac);
    const p0 = rachis.pts[idx];
    const g0 = gate(rachis, rachisG, idx) + 0.01;
    const g1 = Math.min(0.9, g0 + 0.09);
    const lat = grow(out, g0, g1, () =>
      limb(out, r, [p0, add(p0, [dx * 0.52, dy * 0.48]), add(p0, [dx, dy])], { w0: 4, w1: 2.2, pc: "--petiole-red", inkFrom: 0.08 }),
    );
    for (const u of [0.55, 0.95]) {
      const fIdx = Math.round(lat.n * u);
      const fp = lat.pts[fIdx];
      const fd = angleOf(lat.pts, fIdx);
      const arrives = gate(lat, [g0, g1], fIdx);
      part(out, Math.min(0.92, arrives + 0.015), fp, () => {
        const tube = closed(roundPts(add(fp, polar(10, fd)), 11, 3.6, fd, 6));
        out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-ipomoea", dl: -0.04 }))} d="${tube}"/><path class="ink hair" d="${tube}"/>`);
      });
    }
  }

  // Massive tank rosette of 14 recurved cream-green subulate blades radiating from the host perch.
  const angles = [-168, -144, -122, -102, -82, -62, -38, -14, 14, 38, 64, 118, 146, 168];
  angles.forEach((deg, i) => {
    const len = deg < -45 && deg > -135 ? 112 + (i % 2) * 12 : 128 + (i % 3) * 18;
    part(out, Math.min(0.9, crownG + 0.02 + (i % 5) * 0.03), crown, () => {
      airplantBlade(out, r, crown, rad(deg), len, 24);
    });
  });
}

export function airplantDetail(out: Out, r: Rng) {
  const C: Pt = [0, 70];
  for (const [deg, len] of [
    [-152, 165],
    [-124, 185],
    [-96, 195],
    [-68, 185],
    [-38, 165],
  ] as const) {
    airplantBlade(out, r, C, rad(deg), len, 28);
  }
  const sp = limb(out, r, [C, [35, -35], [85, -135]], { w0: 6.5, w1: 3, pc: "--petiole-red" });
  for (const u of [0.45, 0.72, 0.96]) {
    const idx = Math.round(sp.n * u);
    const p = sp.pts[idx];
    const d = angleOf(sp.pts, idx) - 0.35;
    const bract = closed(roundPts(add(p, polar(8, d)), 9, 4, d, 6));
    const tube = closed(roundPts(add(p, polar(18, d)), 12, 3.8, d, 6));
    out.push(`<path class="wash"${vars(tone(r, { pc: "--petiole-red", dl: 0.05 }))} d="${bract}"/><path class="wash petal"${vars(tone(r, { pc: "--flower-ipomoea" }))} d="${tube}"/><path class="ink hair" d="${bract}${tube}"/>`);
  }
}

// ---------------------------------------------------------------------------
// 7. Giant leather fern (Acrostichum danaeifolium): tall erect 1-pinnate brackish-water fronds
// rising from the lagoon floor during scroll; crowded ascending oblong-lanceolate leathery pinnae,
// with fertile fronds completely coated beneath in velvety golden-rust acrostichoid sporangia.

function fernPinna(out: Out, r: Rng, base: Pt, dir: number, len: number, fertile: boolean) {
  const tip = add(base, polar(len, dir));
  const w = len * 0.24;
  const mid = lerp(base, tip, 0.5);
  const nrm = polar(w / 2, dir + Math.PI / 2);
  const pts = [
    add(base, mul(nrm, 0.55)),
    add(lerp(base, mid, 0.5), mul(nrm, 0.95)),
    add(mid, nrm),
    add(lerp(mid, tip, 0.6), mul(nrm, 0.75)),
    tip,
    sub(lerp(mid, tip, 0.6), mul(nrm, 0.75)),
    sub(mid, nrm),
    sub(lerp(base, mid, 0.5), mul(nrm, 0.95)),
    sub(base, mul(nrm, 0.55)),
  ];
  const v = fertile ? tone(r, { pc: "--spore-rust", spread: 0.04, hue: 8 }) : tone(r, { spread: 0.06, hue: 10 });
  shape(out, r, pts, v, { deep: fertile ? 0.5 : 0.42 });
  out.push(`<path class="ink hair" d="M${P1(base)}L${P1(lerp(base, tip, 0.92))}"/>`);
}

export function leatherfern(out: Out, r: Rng, base: Pt = [0, 0]) {
  const at = (x: number, y: number): Pt => add(base, [x, y]);
  const fronds: { x1: number; y1: number; x2: number; y2: number; g0: number; g1: number; fertile: boolean }[] = [
    { x1: -68, y1: -280, x2: -138, y2: -510, g0: 0.52, g1: 0.84, fertile: false },
    { x1: -24, y1: -320, x2: -46, y2: -610, g0: 0.48, g1: 0.8, fertile: true },
    { x1: 12, y1: -340, x2: 18, y2: -645, g0: 0.42, g1: 0.76, fertile: false },
    { x1: 48, y1: -310, x2: 88, y2: -590, g0: 0.5, g1: 0.82, fertile: true },
    { x1: 82, y1: -265, x2: 152, y2: -485, g0: 0.55, g1: 0.86, fertile: false },
  ];

  for (const f of fronds) {
    const stipe = grow(out, f.g0, f.g1, () =>
      limb(out, r, [at(0, 0), at(f.x1, f.y1), at(f.x2, f.y2)], { w0: 9.5, w1: 3.2, pc: "--bark-mangrove", inkFrom: 0.04 }),
    );
    const pairs = 11;
    let lastLen = 0;
    for (let k = 0; k < pairs; k++) {
      const frac = 0.26 + (k / pairs) * 0.7;
      const idx = Math.min(stipe.n, Math.round(stipe.n * frac));
      const p = stipe.pts[idx];
      const d = angleOf(stipe.pts, idx);
      const env = Math.sin(Math.PI * ((k + 0.8) / (pairs + 1.2)));
      const pLen = (52 + env * 44) * (f.fertile ? 0.88 : 1);
      const arrives = gate(stipe, [f.g0, f.g1], idx);
      part(out, Math.min(0.92, arrives + 0.02), p, () => {
        fernPinna(out, r, p, d - rad(46), pLen, f.fertile);
        fernPinna(out, r, p, d + rad(46), pLen, f.fertile);
      });
      lastLen = pLen;
    }
    // The terminal pinna opens at the tip, once the stipe has reached it.
    const tip = stipe.pts[stipe.n];
    part(out, f.g1 + 0.01, tip, () => fernPinna(out, r, tip, angleOf(stipe.pts, stipe.n), lastLen * 0.85, f.fertile));
  }
}

export function leatherfernDetail(out: Out, r: Rng) {
  // Sterile green frond apex on left, fertile golden-rust acrostichoid frond apex on right.
  for (const [x0, dx, fertile] of [
    [-70, -18, false],
    [65, 18, true],
  ] as const) {
    const rachis = limb(out, r, [[x0, 140], [x0 + dx * 0.5, 0], [x0 + dx, -140]], { w0: 7, w1: 3, pc: "--bark-mangrove" });
    for (let k = 0; k < 6; k++) {
      const frac = 0.18 + (k / 6) * 0.76;
      const idx = Math.round(rachis.n * frac);
      const p = rachis.pts[idx];
      const d = angleOf(rachis.pts, idx);
      const len = 72 * (1 - k * 0.07);
      fernPinna(out, r, p, d - rad(46), len, fertile);
      fernPinna(out, r, p, d + rad(46), len, fertile);
    }
    fernPinna(out, r, rachis.pts[rachis.n], angleOf(rachis.pts, rachis.n), 52, fertile);
  }
}

// ---------------------------------------------------------------------------
// 8. Smooth cordgrass (Spartina alterniflora / Sporobolus alterniflorus): intertidal saltmarsh
// grass fringe rising through the lagoon water; erect terete culms, long flat tapering leaf blades
// arching to one side, and appressed straw-green cylindrical panicles of unilateral spikes.

function cordgrassPanicle(out: Out, r: Rng, base: Pt, dir: number, len: number) {
  const tip = add(base, polar(len, dir));
  stalk(out, quad(base, lerp(base, tip, 0.5), tip), 3.2, 1.6, tone(r, { pc: "--propagule", dl: 0.08 }), 4);
  // 5 closely appressed unilateral spikes overlapping along the main axis.
  let spikelets = "";
  let anthers = "";
  for (let s = 0; s < 5; s++) {
    const u0 = s * 0.17;
    const sBase = lerp(base, tip, u0);
    const sDir = dir + (s % 2 ? 1 : -1) * 0.14;
    const sLen = len * (0.38 - s * 0.03);
    for (let k = 0; k < 5; k++) {
      const p = add(sBase, polar(sLen * (k / 4.5), sDir));
      const spTip = add(p, polar(11, sDir - 0.22));
      const nrm = polar(1.8, sDir + Math.PI / 2);
      spikelets += closed([p, add(lerp(p, spTip, 0.5), nrm), spTip, sub(lerp(p, spTip, 0.5), nrm)]);
      if (k % 2 === 0) anthers += `M${P1(spTip)}L${P1(add(spTip, polar(4.5, sDir + 0.45)))}`;
    }
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--flower-mangrove", dl: -0.06, dc: 0.65 }))} d="${spikelets}"/><path class="ink hair" d="${spikelets}"/>`);
  out.push(`<path class="ink thin" style="stroke:var(--leaf-senescent)" d="${anthers}"/>`);
}

export function cordgrass(out: Out, r: Rng, base: Pt = [0, 0]) {
  const at = (x: number, y: number): Pt => add(base, [x, y]);
  const culms: [number, number, number, number, number][] = [
    [-58, -28, -460, 0.52, 0.84],
    [-32, -12, -525, 0.34, 0.62],
    [-6, 8, -560, 0.26, 0.54],
    [22, 24, -535, 0.5, 0.82],
    [48, 44, -490, 0.54, 0.86],
    [74, 68, -435, 0.58, 0.88],
  ];

  for (const [x0, dx, topY, g0, g1] of culms) {
    const culm = grow(out, g0, g1, () =>
      stalk(out, quad(at(x0, 0), at(x0 + dx * 0.45, topY * 0.52), at(x0 + dx, topY)), 6.5, 2.6, tone(r, { spread: 0.05 }), 14),
    );
    // Arching flat tapering leaf blades along the culm.
    for (const [frac, sg, bLen] of [
      [0.32, -1, 145],
      [0.54, 1, 165],
      [0.74, -1, 135],
    ] as const) {
      const idx = Math.round((culm.pts.length - 1) * frac);
      const p = culm.pts[idx];
      const arrives = g0 + (g1 - g0) * frac;
      part(out, Math.min(0.91, arrives + 0.02), p, () => {
        const bMid = add(p, [sg * bLen * 0.46, -bLen * 0.38]);
        const bTip = add(p, [sg * bLen * 0.92, -bLen * 0.12]);
        stalk(out, quad(p, bMid, bTip), 6.2, 0.8, tone(r, { spread: 0.06, hue: 10 }), 8);
      });
    }
    // Terminal appressed unilateral spike panicle.
    const tip = culm.pts[culm.pts.length - 1];
    part(out, Math.min(0.92, Math.max(0.54, g1 + 0.02)), tip, () => {
      cordgrassPanicle(out, r, tip, rad(-88 + dx * 0.15), 115);
    });
  }
}

export function cordgrassDetail(out: Out, r: Rng) {
  for (const [x0, lean, h] of [
    [-40, -6, 180],
    [25, 8, 210],
  ] as const) {
    const c = stalk(out, quad([x0, 120], [x0 + lean * 0.5, 20], [x0 + lean, 120 - h]), 7, 3.2, tone(r, { spread: 0.05 }), 10);
    const p1 = c.pts[5];
    stalk(out, quad(p1, add(p1, [-65, -45]), add(p1, [-125, -10])), 7, 1, tone(r, { spread: 0.05 }), 8);
    cordgrassPanicle(out, r, c.pts[10], rad(-90 + lean * 0.6), 165);
  }
}

// ---------------------------------------------------------------------------
// 9. Swamp lily (Crinum americanum): emergent brackish-water bulb clump; arching channeled green
// strap leaves and stout scapes crowned by umbels of fragrant white spider-like flowers with
// 6 narrow recurved white tepals and 6 long spreading crimson-purple stamen filaments.

function swampLilyUmbel(out: Out, r: Rng, center: Pt, scale = 1) {
  // 2 papery triangular spathe bracts subtending the umbel.
  for (const sg of [-1, 1]) {
    const bTip = add(center, polar(28 * scale, rad(90 + sg * 48)));
    const nrm = polar(5 * scale, rad(sg * 48));
    const br = closed([center, add(lerp(center, bTip, 0.4), nrm), bTip, sub(lerp(center, bTip, 0.4), nrm)]);
    out.push(`<path class="wash"${vars(tone(r, { pc: "--leaf-under-mangrove", dl: -0.04 }))} d="${br}"/><path class="ink hair" d="${br}"/>`);
  }

  // 3 open spider-like flowers in the umbel: slender greenish perianth tube, 6 narrow recurved
  // pure-white linear-lanceolate tepals, and 6 long spreading crimson-magenta stamen filaments
  // tipped with golden versatile anthers.
  const flowers: [number, number][] = [
    [-42, 0.92],
    [0, 1.04],
    [42, 0.92],
  ];
  for (const [deg, sMul] of flowers) {
    const s = scale * sMul;
    const dir = rad(-90 + deg);
    const throat = add(center, polar(42 * s, dir));
    // Slender greenish-cream perianth tube.
    stalk(out, quad(center, lerp(center, throat, 0.5), throat), 4.2 * s, 3.2 * s, tone(r, { pc: "--flower-mangrove", dl: -0.04 }), 4);

    // 6 narrow recurved white tepals fanning and arching outward from the throat.
    const tepalDegs = [-78, -46, -16, 16, 46, 78];
    for (const td of tepalDegs) {
      const tDir = dir + rad(td);
      const tLen = (54 - Math.abs(td) * 0.14) * s;
      const recurve = (td < 0 ? -1 : 1) * 0.34;
      const mid = add(throat, polar(tLen * 0.52, tDir));
      const tip = add(mid, polar(tLen * 0.52, tDir + recurve));
      const nrm = polar(3.8 * s, tDir + Math.PI / 2);
      const pts = [
        add(throat, mul(nrm, 0.45)),
        add(mid, nrm),
        tip,
        sub(mid, nrm),
        sub(throat, mul(nrm, 0.45)),
      ];
      shape(out, r, pts, { pc: "--flower-mangrove", dl: 0.1, dc: 0.18 }, { deep: 0.35, cls: "wash petal" });
    }

    // 6 long spreading crimson-purple stamen filaments with golden versatile T-anthers.
    let filaments = "";
    let anthers = "";
    for (const sd of [-62, -36, -12, 12, 36, 62]) {
      const sDir = dir + rad(sd);
      const fLen = 44 * s;
      const fMid = add(throat, polar(fLen * 0.55, sDir));
      const fTip = add(fMid, polar(fLen * 0.48, sDir - (sd < 0 ? -0.22 : 0.22)));
      filaments += `M${P1(throat)}Q${P1(fMid)} ${P1(fTip)}`;
      const aDir = sDir + Math.PI / 2;
      anthers += `M${P1(add(fTip, polar(-4.2 * s, aDir)))}L${P1(add(fTip, polar(4.2 * s, aDir)))}`;
    }
    out.push(`<path class="ink mid" style="stroke:var(--flower-ipomoea)" d="${filaments}"/>`);
    out.push(`<path class="ink thick" style="stroke:var(--leaf-senescent)" d="${anthers}"/>`);
  }
}

export function swamplily(out: Out, r: Rng, base: Pt = [0, 0]) {
  const at = (x: number, y: number): Pt => add(base, [x, y]);

  // Basal rosette of arching channeled strap leaves rising out of the water during scroll.
  const straps: [number, number, number, number, number, number][] = [
    [-145, -310, -235, -245, 0.54, 0.82],
    [-98, -365, -172, -330, 0.52, 0.8],
    [-42, -395, -78, -385, 0.5, 0.78],
    [42, -398, 76, -388, 0.5, 0.78],
    [96, -360, 168, -325, 0.52, 0.8],
    [142, -305, 232, -240, 0.54, 0.82],
  ];
  for (const [mx, my, tx, ty, g0, g1] of straps) {
    grow(out, g0, g1, () =>
      stalk(out, quad(at(0, 0), at(mx, my), at(tx, ty)), 18, 3.5, tone(r, { spread: 0.06, hue: 10 }), 12),
    );
  }

  // Two stout succulent scapes rising to carry the fragrant white spider-lily umbels.
  for (const [mx, tx, ty, g0, g1, sc] of [
    [-18, -34, -525, 0.56, 0.84, 1.0],
    [28, 52, -468, 0.6, 0.88, 0.88],
  ] as const) {
    const scape = grow(out, g0, g1, () =>
      stalk(out, quad(at(0, 0), at(mx, ty * 0.52), at(tx, ty)), 11 * sc, 7.5 * sc, tone(r, { dl: 0.04, spread: 0.04 }), 12),
    );
    const top = scape.pts[scape.pts.length - 1];
    part(out, Math.min(0.92, g1 + 0.02), top, () => {
      swampLilyUmbel(out, r, top, sc);
    });
  }
}

export function swamplilyDetail(out: Out, r: Rng) {
  stalk(out, quad([0, 155], [-6, 65], [0, 20]), 13, 9, tone(r, { dl: 0.04 }), 8);
  swampLilyUmbel(out, r, [0, 20], 1.45);
}

// ---------------------------------------------------------------------------
// 10. Beach morning glory (Ipomoea pes-caprae subsp. brasiliensis): prostrate shore runner in the
// bed (never a fake top-hanger!); long trailing stolons, erect succulent deeply bilobed "goat's-
// foot" leaves, and upright rose-violet funnel corollas with a darker magenta 5-pointed star throat.

function goatFootLeaf(out: Out, r: Rng, base: Pt, dir: number, size: number) {
  const petEnd = add(base, polar(size * 0.36, dir));
  stalk(out, quad(base, lerp(base, petEnd, 0.5), petEnd), 2.8, 2.2, tone(r, { pc: "--petiole-red", dl: 0.04 }), 3);
  // Deeply bilobed ("goat's-foot") blade with an emarginate apical cleft between two rounded lobes.
  const notch = add(petEnd, polar(size * 0.54, dir));
  const lLobe = add(petEnd, polar(size * 0.72, dir - rad(26)));
  const rLobe = add(petEnd, polar(size * 0.72, dir + rad(26)));
  const lFlank = add(petEnd, polar(size * 0.52, dir - rad(62)));
  const rFlank = add(petEnd, polar(size * 0.52, dir + rad(62)));
  const pts = [petEnd, lFlank, lLobe, notch, rLobe, rFlank];
  shape(out, r, pts, tone(r, { spread: 0.06, hue: 10 }), { deep: 0.48 });
  out.push(`<path class="ink hair" d="M${P1(petEnd)}L${P1(notch)}M${P1(petEnd)}L${P1(lerp(petEnd, lLobe, 0.82))}M${P1(petEnd)}L${P1(lerp(petEnd, rLobe, 0.82))}"/>`);
}

function ipomoeaFunnel(out: Out, r: Rng, base: Pt, dir: number, size: number) {
  const cal = add(base, polar(size * 0.28, dir));
  stalk(out, quad(base, lerp(base, cal, 0.5), cal), 2.6, 2.2, tone(r, { dl: -0.04 }), 3);
  // Funnel tube expanding into a 5-angled rose-purple limb tilted at 3/4 view.
  const rimC = add(cal, polar(size * 0.72, dir));
  const rimPts = roundPts(rimC, size * 0.56, size * 0.34, dir + Math.PI / 2, 10);
  const nrm = polar(size * 0.12, dir + Math.PI / 2);
  const conePts = [add(cal, nrm), add(rimC, polar(size * 0.52, dir + Math.PI / 2)), sub(rimC, polar(size * 0.52, dir + Math.PI / 2)), sub(cal, nrm)];
  shape(out, r, conePts, tone(r, { pc: "--flower-ipomoea", dl: 0.05, spread: 0.03 }), { deep: 0.4, cls: "wash petal" });
  shape(out, r, rimPts, tone(r, { pc: "--flower-ipomoea", spread: 0.04 }), { deep: 0.52, cls: "wash petal" });
  // 5-rayed darker magenta star plicae radiating from the throat.
  let star = "";
  for (let k = 0; k < 5; k++) {
    const a = dir + Math.PI / 2 + (k / 5) * Math.PI * 2;
    const tip = add(rimC, [Math.cos(a) * size * 0.5 * Math.sin(dir), Math.sin(a) * size * 0.3]);
    star += `M${P1(rimC)}L${P1(lerp(rimC, tip, 0.88))}`;
  }
  out.push(`<path class="ink mid" style="stroke:var(--flower-ipomoea);opacity:.8" d="${star}"/>`);
  const throat = closed(roundPts(rimC, size * 0.1, size * 0.07, dir + Math.PI / 2, 6));
  out.push(`<path class="wash"${vars(tone(r, { pc: "--flower-mangrove", dl: 0.08 }))} d="${throat}"/>`);
}

export function morningglory(out: Out, r: Rng, base: Pt = [0, 0]) {
  const at = (x: number, y: number): Pt => add(base, [x, y]);
  // Two prostrate stolons creeping outward along the shore lip during scroll.
  const runners: { ctrl: Pt[]; g: number[] }[] = [
    { ctrl: [at(0, 0), at(125, -14), at(255, -8), at(375, -18)], g: [0.54, 0.88] },
    { ctrl: [at(0, 0), at(85, -36), at(185, -48), at(275, -38)], g: [0.58, 0.9] },
  ];

  for (const { ctrl, g } of runners) {
    const stolon = grow(out, g[0], g[1], () =>
      limb(out, r, ctrl, { w0: 7.5, w1: 4, pc: "--bark-red", inkFrom: 0.04 }),
    );
    for (let k = 1; k <= 5; k++) {
      const frac = k / 5.4;
      const idx = Math.round(stolon.n * frac);
      const p = stolon.pts[idx];
      const arrives = gate(stolon, g, idx);
      part(out, Math.min(0.92, arrives + 0.02), p, () => {
        goatFootLeaf(out, r, p, rad(-88 + (k % 2 ? -18 : 18)), 52);
        if (k === 2 || k === 4) ipomoeaFunnel(out, r, p, rad(-82 + (k === 2 ? -14 : 16)), 54);
      });
    }
  }
}

export function morninggloryDetail(out: Out, r: Rng) {
  const runner = limb(out, r, [[-135, 55], [-10, 35], [115, 45]], { w0: 8.5, w1: 5, pc: "--bark-red" });
  goatFootLeaf(out, r, runner.pts[Math.round(runner.n * 0.25)], rad(-108), 108);
  goatFootLeaf(out, r, runner.pts[Math.round(runner.n * 0.62)], rad(-74), 114);
  goatFootLeaf(out, r, runner.pts[Math.round(runner.n * 0.88)], rad(-62), 96);
  ipomoeaFunnel(out, r, runner.pts[Math.round(runner.n * 0.46)], rad(-92), 112);
}

// ---------------------------------------------------------------------------
// 11. Saltwort / turtleweed (Batis maritima): low succulent subshrub greening the tidal flats;
// arching woody-based stems sending up opposite erect branches clothed in decussate pairs of plump,
// club-shaped (clavate) vivid yellow-green succulent leaves and sessile 4-ranked axillary cones.

function batisLeafPair(out: Out, r: Rng, p: Pt, dir: number, len: number, cone = false) {
  for (const sg of [-1, 1]) {
    const a = dir + sg * rad(48);
    const tip = add(p, polar(len, a));
    const mid = lerp(p, tip, 0.64);
    const nrm = polar(len * 0.19, a + Math.PI / 2);
    // Clavate (club-shaped) succulent blade, narrow at base and plumply rounded toward apex.
    const pts = [
      add(p, mul(nrm, 0.32)),
      add(mid, nrm),
      tip,
      sub(mid, nrm),
      sub(p, mul(nrm, 0.32)),
    ];
    shape(out, r, pts, tone(r, { spread: 0.06, hue: 10 }), { deep: 0.42 });
  }
  if (cone) {
    const cTip = add(p, polar(len * 0.55, dir - rad(24)));
    const cPts = roundPts(lerp(p, cTip, 0.55), len * 0.26, len * 0.15, dir - rad(24), 6);
    shape(out, r, cPts, tone(r, { pc: "--flower-mangrove", dl: -0.04 }), { deep: 0.4 });
  }
}

export function saltwort(out: Out, r: Rng, base: Pt = [0, 0]) {
  const at = (x: number, y: number): Pt => add(base, [x, y]);
  const shoots: [number, number, number, number, number][] = [
    [-95, -245, -135, 0.56, 0.86],
    [-46, -310, -64, 0.53, 0.84],
    [8, -338, 14, 0.51, 0.82],
    [56, -298, 78, 0.54, 0.85],
    [104, -235, 145, 0.58, 0.88],
  ];
  for (const [mx, topY, tx, g0, g1] of shoots) {
    const stem = grow(out, g0, g1, () =>
      limb(out, r, [at(0, 0), at(mx, topY * 0.52), at(tx, topY)], { w0: 6.5, w1: 3.2, pc: "--bark-mangrove", inkFrom: 0.04 }),
    );
    for (let k = 1; k <= 5; k++) {
      const frac = 0.28 + (k / 5.4) * 0.68;
      const idx = Math.round(stem.n * frac);
      const p = stem.pts[idx];
      const d = angleOf(stem.pts, idx);
      const arrives = gate(stem, [g0, g1], idx);
      part(out, Math.min(0.92, arrives + 0.02), p, () => {
        batisLeafPair(out, r, p, d, 32 - k * 1.4, k === 3 || k === 4);
      });
    }
  }
}

export function saltwortDetail(out: Out, r: Rng) {
  for (const [x0, dx, topY] of [
    [-45, -18, -125],
    [35, 16, -140],
  ] as const) {
    const stem = limb(out, r, [[x0, 95], [x0 + dx * 0.5, 0], [x0 + dx, topY]], { w0: 7, w1: 3.8, pc: "--bark-mangrove" });
    for (let k = 1; k <= 5; k++) {
      const frac = k / 5.3;
      const idx = Math.round(stem.n * frac);
      batisLeafPair(out, r, stem.pts[idx], angleOf(stem.pts, idx), 44 - k * 2, k >= 3);
    }
  }
}

// ---------------------------------------------------------------------------
// 12. Sea purslane (Sesuvium portulacastrum): prostrate succulent mat hugging the tidal mud;
// fleshy carmine-red stems rooting at the nodes, opposite glossy oblanceolate-spatulate succulent
// leaves, and solitary axillary 5-lobed rose-pink star calyces.

function sesuviumNode(out: Out, r: Rng, p: Pt, dir: number, len: number, star = false) {
  for (const sg of [-1, 1]) {
    const a = dir + sg * rad(54);
    const tip = add(p, polar(len, a));
    const mid = lerp(p, tip, 0.62);
    const nrm = polar(len * 0.22, a + Math.PI / 2);
    const pts = [
      add(p, mul(nrm, 0.35)),
      add(mid, nrm),
      tip,
      sub(mid, nrm),
      sub(p, mul(nrm, 0.35)),
    ];
    shape(out, r, pts, tone(r, { spread: 0.06, hue: 10 }), { deep: 0.45 });
  }
  if (star) {
    const fC = add(p, polar(len * 0.38, dir - rad(28)));
    let lobes = "";
    for (let k = 0; k < 5; k++) {
      const a = dir + (k / 5) * Math.PI * 2;
      const lTip = add(fC, polar(len * 0.42, a));
      const lN = polar(len * 0.1, a + Math.PI / 2);
      lobes += closed([fC, add(lerp(fC, lTip, 0.45), lN), lTip, sub(lerp(fC, lTip, 0.45), lN)]);
    }
    out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-ipomoea", dl: 0.06 }))} d="${lobes}"/><path class="ink thin" d="${lobes}"/>`);
    const core = closed(roundPts(fC, len * 0.12, len * 0.12, 0, 6));
    out.push(`<path class="wash"${vars(tone(r, { pc: "--flower-mangrove" }))} d="${core}"/>`);
  }
}

export function seapurslane(out: Out, r: Rng, base: Pt = [0, 0]) {
  const at = (x: number, y: number): Pt => add(base, [x, y]);
  const stems: [number, number, number, number, number, number][] = [
    [95, -24, 215, -42, 0.56, 0.88],
    [72, -58, 165, -96, 0.54, 0.86],
    [118, -12, 265, -18, 0.58, 0.89],
  ];
  for (const [mx, my, tx, ty, g0, g1] of stems) {
    const st = grow(out, g0, g1, () =>
      limb(out, r, [at(0, 0), at(mx, my), at(tx, ty)], { w0: 6.5, w1: 3.5, pc: "--stem-sesuvium", inkFrom: 0.04 }),
    );
    for (let k = 1; k <= 4; k++) {
      const frac = k / 4.3;
      const idx = Math.round(st.n * frac);
      const p = st.pts[idx];
      const d = angleOf(st.pts, idx);
      const arrives = gate(st, [g0, g1], idx);
      part(out, Math.min(0.92, arrives + 0.02), p, () => {
        sesuviumNode(out, r, p, d, 32, k === 2 || k === 4);
      });
    }
  }
}

export function seapurslaneDetail(out: Out, r: Rng) {
  const st = limb(out, r, [[-115, 45], [-10, 5], [95, -35]], { w0: 8, w1: 4.5, pc: "--stem-sesuvium" });
  for (const [frac, star] of [
    [0.28, false],
    [0.58, true],
    [0.88, true],
  ] as const) {
    const idx = Math.round(st.n * frac);
    sesuviumNode(out, r, st.pts[idx], angleOf(st.pts, idx), 52, star);
  }
}
