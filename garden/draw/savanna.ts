// The savanna: the Kruger lowveld early in December, after the first rains, under a wide sky. The
// trees are just in leaf and flower over last year's straw-pale grass. Nothing hangs from the top:
// what hangs (the baobab's flowers, the sausage tree's fruit, the thorn's pods) hangs from its own
// plant. Drawn with the same kit as the other gardens.

import { P1, add, sub, mul, norm, rot, polar, lerp, wobble, closed, line, sample, vars, tone, shape, stalk, quad, grow, part, rad } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";
import { limb, angleOf } from "./woody.ts";
import type { Limb } from "./woody.ts";
import { blade, bladeBunch, tendril, along, share, roundPts } from "./mediterranean.ts";
import { mesquiteLeaf } from "./desert.ts";

// The share of `res`'s length at its point i, as the gate its growth reaches it at.
const gate = (res: { pts: Pt[] }, g: number[], i: number) => along(g[0], g[1], share(res, i));

// ---------------------------------------------------------------------------
// Baobab: a swollen grey trunk, smooth and folded, flared into buttresses at the foot; a few
// thick limbs thrust up from it like roots, ending stubby; new palmate leaves at the twig tips,
// and big white flowers hanging on long stalks, petals turned back over a ball of stamens.

// The trunk, from `base` up to `T`: a bottle, swollen below the middle and flared at the foot,
// its smooth bark creased in rings that bow round the column and fluted near the ground.
export function baobabTrunk(out: Out, r: Rng, base: Pt, T: number, W: number) {
  const n = 40;
  const lump = wobble(r, 0.035, [2, 5, 9]);
  const width = (s: number) => W * (1 + 0.28 * Math.sin(Math.PI * Math.min(1, s * 1.1))) * (1 - 0.38 * s) * (1 + 0.3 * Math.exp(-s / 0.07));
  const pts = sample((s) => add(base, [lump(s) * W * 0.4, -s * T]), n);
  const L = pts.map((p, i) => add(p, [-(width(i / n) / 2) * (1 + lump(i / n + 0.3)), 0]));
  const R = pts.map((p, i) => add(p, [(width(i / n) / 2) * (1 + lump(i / n + 0.7)), 0]));
  const top = sample((u) => add(pts[n], [Math.cos(Math.PI - u * Math.PI) * width(1) * 0.5, -Math.sin(u * Math.PI) * width(1) * 0.1]), 8).slice(1, -1);
  const body = [add(L[0], [0, 12]), ...L, ...top, ...[...R].reverse(), add(R[0], [0, 12])];
  const v = tone(r, { pc: "--bark-baobab", spread: 0.02, hue: 6 });
  out.push(`<path class="wash bark"${vars(v)} d="${closed(body)}"/>`);
  const m = n - 4;
  out.push(`<path class="wash bark-shade"${vars(v)} d="${closed([...pts.slice(0, m).map((p, i) => lerp(p, R[i], 0.3)), ...R.slice(0, m).reverse()])}"/>`);
  out.push(`<path class="wash bark-lit"${vars(v)} d="${closed([...L.slice(0, m).map((p, i) => lerp(p, pts[i], 0.08)), ...L.slice(0, m).reverse().map((p, i) => lerp(p, pts[m - 1 - i], 0.34))])}"/>`);
  // Rings of creases, each bowing a little round the column and running only part way across.
  let folds = "";
  for (let k = 0; k < 16; k++) {
    const i = 3 + Math.floor(r() * (n - 6));
    const a = 0.1 + r() * 0.4;
    const b = Math.min(0.95, a + 0.25 + r() * 0.4);
    const w = width(i / n);
    folds += line(sample((u) => add(lerp(L[i], R[i], a + (b - a) * u), [0, Math.sin((a + (b - a) * u) * Math.PI) * w * 0.06]), 8));
  }
  // Flutes rising from the buttresses.
  for (let k = 0; k < 6; k++) {
    const u = 0.12 + (k / 5) * 0.76;
    const h = 0.12 + r() * 0.16;
    folds += line(sample((t) => lerp(L[Math.round(t * h * n)], R[Math.round(t * h * n)], u + (0.5 - u) * t * 0.5), 6));
  }
  out.push(`<path class="ink hair bark-tex" d="${folds}"/>`);
  out.push(`<path class="ink thin" d="${line([add(L[0], [0, 12]), ...L])}"/><path class="ink thick" d="${line([add(R[0], [0, 12]), ...R])}"/>`);
  return { pts, L, R, n, top: pts[n], width, v };
}

// A palmate leaf: a stalk, then five to seven leaflets fanned from its tip, all in one wash.
export function baobabLeaf(out: Out, r: Rng, O: Pt, dir: number, S: number) {
  const tip = add(O, polar(S * 0.36, dir));
  out.push(`<path class="ink thin" d="M${P1(O)}L${P1(tip)}"/>`);
  const count = r() < 0.5 ? 5 : 7;
  const blades = Array.from({ length: count }, (_, k) => {
    const u = k / (count - 1) - 0.5;
    return { O: tip, dir: dir + u * rad(150), L: S * (0.62 - Math.abs(u) * 0.3), W: 0.38 };
  });
  bladeBunch(out, blades, tone(r, { spread: 0.07, hue: 10 }));
}

// A flower hanging on its long stalk from `top`: a leathery cup, five crumpled white petals
// turned back over it, and below them a ball of stamens with the style poking through.
export function baobabFlower(out: Out, r: Rng, top: Pt, len: number, s: number, sway: number) {
  const end = add(top, [sway * len * 0.18, len]);
  out.push(`<path class="ink thin" d="M${P1(top)}Q${P1(add(lerp(top, end, 0.5), [sway * len * 0.16, 0]))} ${P1(end)}"/>`);
  const c = add(end, [0, s * 0.3]);
  // Petals, turned back and up round the cup, the far ones first.
  for (const [a, k] of [[-120, 0.95], [-60, 0.95], [-160, 1], [-20, 1], [-90, 0.8]] as const) {
    const dir = rad(a);
    const wob = wobble(r, 0.12, [4, 7]);
    const pts = sample((t) => {
      const ang = t * Math.PI * 2;
      const rr = (0.5 + 0.5 * Math.cos(ang)) ** 0.7;
      return add(c, add(polar(s * 0.62 * k * rr * (1 + wob(t)), dir), polar(s * 0.3 * Math.sin(ang), dir + Math.PI / 2)));
    }, 16).slice(0, -1);
    shape(out, r, pts, tone(r, { pc: "--petal", dl: -0.02, spread: 0.04 }), { deep: 0.45, deepAbout: c, cls: "wash petal" });
  }
  shape(out, r, roundPts(add(c, [0, -s * 0.05]), s * 0.24, s * 0.2, 0, 10), tone(r, { dl: -0.12, dc: 0.6, spread: 0.03 }), { deep: 0 });
  // The stamen ball: a dense puff of filaments, a few anthers dotted at its rim.
  const ball = add(c, [0, s * 0.42]);
  shape(out, r, roundPts(ball, s * 0.34, s * 0.3, 0, 14), tone(r, { pc: "--petal", dl: -0.04, spread: 0.03 }), { deep: 0.5, ink: false, cls: "wash petal" });
  let hair = "";
  let dots = "";
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    const p = add(ball, polar(s * 0.3, a));
    hair += `M${P1(add(ball, polar(s * 0.12, a)))}L${P1(p)}`;
    if (k % 2) dots += closed(roundPts(p, 1.6, 1.6, 0, 6));
  }
  out.push(`<path class="ink hair petal-edge" d="${hair}"/><path class="wash anther"${vars({ pc: "--anther" })} d="${dots}"/>`);
  out.push(`<path class="ink thin" d="M${P1(add(ball, [0, s * 0.2]))}L${P1(add(ball, [sway * 2, s * 0.62]))}"/>`);
}

// A crooked branch off a limb: angular, not curved, blunt at the end.
function crooked(r: Rng, from: Pt, dir: number, len: number, rise: number) {
  const ctrl: Pt[] = [from];
  let p = from;
  let a = dir;
  for (let k = 0; k < 3; k++) {
    a += (r() - 0.5) * 0.45 + rise;
    p = add(p, polar(len / 3, a));
    ctrl.push(p);
  }
  return ctrl;
}

export function baobab(out: Out, r: Rng, base: Pt) {
  const T = 460;
  const gt = [0.02, 0.32];
  const trunk = grow(out, gt[0], gt[1], () => baobabTrunk(out, r, base, T, 270));
  const neck = trunk.top;
  const nw = trunk.width(1);
  // Limbs thrust up and out from the neck like upturned roots: short, thick, and blunt. They
  // start well inside the neck and are drawn over it, so together they cover it.
  const limbs: [number, number, number][] = [
    [-168, 230, 80],
    [-132, 200, 92],
    [-104, 170, 88],
    [-78, 185, 92],
    [-46, 205, 90],
    [-14, 225, 78],
  ];
  const twigs: { p: Pt; dir: number; g: number }[] = [];
  const flowers: { p: Pt; g: number }[] = [];
  limbs.forEach(([deg, len, w], k) => {
    const a = rad(deg);
    const from = add(neck, [((k - 2.5) / 2.5) * nw * 0.24, 96]);
    // The outer limbs reach out low and turn up at their ends; the inner ones rise.
    const bend = (Math.cos(a) > 0 ? -1 : 1) * 0.65 * Math.abs(Math.cos(a));
    const ctrl = [from, add(from, polar(len * 0.45, a)), add(from, polar(len * 0.78, a + bend * 0.5)), add(from, polar(len, a + bend))];
    const gl = [gt[1] - 0.04 + k * 0.01, gt[1] + 0.16 + k * 0.01];
    const res: Limb = grow(out, gl[0], gl[1], () => limb(out, r, ctrl, { w0: w, w1: w * 0.42, pc: "--bark-baobab", cap: "blunt", inkFrom: 0.4 }));
    // Two or three short crooked branches from the outer part, stubby at the ends.
    for (const [t, side] of [[0.7, -1], [0.88, 1], [1, 0]] as const) {
      const i = Math.round(res.n * t);
      const p = res.pts[i];
      const dir = angleOf(res.pts, i) + side * rad(28 + r() * 12);
      const ctrlB = crooked(r, p, dir, 70 + r() * 50, (Math.cos(dir) > 0 ? -1 : 1) * 0.16);
      const gb = [gate(res, gl, i), gate(res, gl, i) + 0.14];
      const br = grow(out, gb[0], gb[1], () => limb(out, r, ctrlB, { w0: res.width(t) * 0.6, w1: 12, pc: "--bark-baobab", cap: "blunt", inkFrom: 0.22 }));
      if (r() < 0.75) twigs.push({ p: br.pts[br.n], dir: angleOf(br.pts, br.n), g: gb[1] });
      if (r() < 0.5) flowers.push({ p: add(br.pts[Math.round(br.n * 0.6)], [0, 6]), g: 0.78 + r() * 0.12 });
    }
  });
  // New leaves, a few at each twig tip.
  twigs.forEach(({ p, dir, g }) => {
    part(out, g, p, () => {
      for (let k = 0; k < 2; k++) baobabLeaf(out, r, p, dir + (k - 0.5) * rad(56) + (r() - 0.5) * 0.3, 40 + r() * 14);
    });
  });
  flowers.forEach(({ p, g }, k) => part(out, g, p, () => baobabFlower(out, r, p, 50 + r() * 80, 30, k % 2 ? 1 : -1)));
}

// ---------------------------------------------------------------------------
// Umbrella thorn: a dark branch reaching in from a side, its limbs zigzagging out to one level so
// the crown is flat on top; fine bipinnate leaves in tiers, thorns in pairs (one long, straight,
// and white, one short and hooked), white ball flowers on the crown, and coiled pods below it.

// A bipinnate leaf seen at a distance: a short stalk and pairs of feathery pinnae, in one wash.
export function thornLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const end = add(O, polar(L, dir));
  const blades = [{ O: end, dir, L: L * 0.4, W: 0.2 }];
  for (let k = 1; k <= 4; k++) {
    const p = lerp(O, end, 0.2 + k * 0.2);
    for (const sg of [-1, 1]) blades.push({ O: p, dir: dir + sg * rad(64), L: L * (0.42 - k * 0.03), W: 0.2 });
  }
  bladeBunch(out, blades, tone(r, { spread: 0.07, hue: 10 }));
}

// A flower: a white puffball of stamens.
export function puffball(out: Out, r: Rng, c: Pt, R: number) {
  shape(out, r, roundPts(c, R, R, 0, 12), tone(r, { pc: "--petal", dl: -0.02, spread: 0.03 }), { deep: 0.4, ink: false, cls: "wash petal" });
  let fuzz = "";
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + r();
    fuzz += `M${P1(add(c, polar(R * 0.6, a)))}L${P1(add(c, polar(R * 1.15, a)))}`;
  }
  out.push(`<path class="ink hair petal-edge" d="${fuzz}"/>`);
}

// A coiled pod: a flat strip wound into a loose spiral.
export function coiledPod(out: Out, r: Rng, top: Pt, R: number) {
  const c = add(top, [0, R * 1.4]);
  const spine = sample((t) => add(c, polar(R * (0.45 + 0.55 * t), -Math.PI / 2 + t * Math.PI * 3.2)), 30);
  const A: Pt[] = [];
  const B: Pt[] = [];
  spine.forEach((p, i) => {
    const d = norm(sub(spine[Math.min(30, i + 1)], spine[Math.max(0, i - 1)]));
    A.push(add(p, mul([-d[1], d[0]], R * 0.16)));
    B.push(add(p, mul([d[1], -d[0]], R * 0.16)));
  });
  out.push(`<path class="ink hair" d="M${P1(top)}L${P1(spine[0])}"/>`);
  shape(out, r, [...A, ...[...B].reverse()], tone(r, { pc: "--pod", dl: -0.06, spread: 0.04 }), { deep: 0 });
}

// Thorns in pairs along a limb, every `step` points: a long straight white one and a short hook.
function thorns(res: { pts: Pt[]; n: number; width: (t: number) => number }, step: number, r: Rng) {
  let white = "";
  let hooks = "";
  for (let i = step; i < res.n; i += step) {
    const p = res.pts[i];
    const a = angleOf(res.pts, i);
    const w = res.width(i / res.n) / 2;
    const sg = (i / step) % 2 ? 1 : -1;
    const base = add(p, polar(w, a + sg * Math.PI / 2));
    white += `M${P1(base)}L${P1(add(base, polar(16 + r() * 6, a + sg * rad(62))))}`;
    const hb = add(p, polar(w, a - sg * Math.PI / 2));
    hooks += `M${P1(hb)}q${P1(polar(4, a - sg * rad(90)))} ${P1(add(polar(4, a - sg * rad(90)), polar(3, a + Math.PI)))}`;
  }
  return { white, hooks };
}

export function thorn(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const level = -300;
  const gm = [0, 0.48];
  const main = grow(out, gm[0], gm[1], () => limb(out, r, [at([-24, 8]), at([120, -50]), at([250, -130]), at([380, -210]), at([520, -250]), at([640, -270])], { w0: 40, w1: 10, pc: "--bark-thorn", cap: "taper" }));
  // Secondary limbs zigzag up from the main limb to the crown's level and run out along it.
  const limbs: { res: Limb; g: number[] }[] = [{ res: main, g: gm }];
  for (const [t, reach, dx] of [[0.22, 1, -40], [0.42, 1, 60], [0.6, 1, 150], [0.74, -1, -120]] as const) {
    const i = Math.round(main.n * t);
    const p = main.pts[i];
    const up = level - p[1];
    const zig = (k: number) => (k % 2 ? 14 : -14);
    const ctrl: Pt[] = [main.pts[i - 2], add(p, [dx * 0.3 + zig(1), up * 0.45]), add(p, [dx * 0.6 + zig(2), up * 0.85]), add(p, [dx + reach * 90, up * 1.02]), add(p, [dx + reach * 190, up + 6])];
    const g = [gate(main, gm, i), gate(main, gm, i) + 0.26];
    limbs.push({ res: grow(out, g[0], g[1], () => limb(out, r, ctrl, { w0: main.width(t) * 0.55, w1: 5, pc: "--bark-thorn", cap: "taper", inkFrom: 0.15 })), g });
  }
  for (const { res } of limbs) {
    const { white, hooks } = thorns(res, 5, r);
    out.push(`<path class="ink spine" d="${white}"/><path class="ink hair" d="${hooks}"/>`);
  }
  // The crown: flat tiers of foliage along the level, each a soft body under feathery leaves
  // (rising on top, drooping beneath), with puffballs on top and coiled pods hanging below.
  const tiers: [number, number, number][] = [[-20, 140, 4], [100, 340, -10], [300, 580, -2], [520, 780, 8]];
  tiers.forEach(([x0, x1, dy], k) => {
    const g = 0.56 + k * 0.05;
    const y = base[1] + level + dy;
    const wob = wobble(r, 6, [3, 6]);
    // A lens, tapering at both ends, so the tiers overlap without seams.
    const taper = (t: number) => Math.sin(Math.PI * t) ** 0.45;
    const body = [...sample((t) => [base[0] + x0 + (x1 - x0) * t, y - 8 - (38 + Math.sin(t * Math.PI) * 16) * taper(t) + wob(t)] as Pt, 20), ...sample((t) => [base[0] + x1 - (x1 - x0) * t, y - 8 + 36 * taper(1 - t) + wob(t + 0.5)] as Pt, 20).slice(1, -1)];
    part(out, g, [base[0] + (x0 + x1) / 2, y], () => {
      shape(out, r, body, tone(r, { dl: -0.1, spread: 0.03 }), { deep: 0.5, ink: false });
      for (let x = x0 + 8; x < x1 - 8; x += 18) {
        thornLeaf(out, r, [base[0] + x, y - 14 + (r() - 0.5) * 12], rad(-90 + (r() - 0.5) * 80), 40 + r() * 14);
        thornLeaf(out, r, [base[0] + x + 9, y + 12 + (r() - 0.5) * 8], rad(90 + (r() - 0.5) * 90), 30 + r() * 10);
      }
      for (let x = x0 + 16; x < x1 - 16; x += 30 + r() * 18) puffball(out, r, [base[0] + x, y - 50 + (r() - 0.5) * 14], 7 + r() * 2);
    });
  });
  for (const x of [180, 420, 610]) part(out, 0.84, [base[0] + x, base[1] + level + 34], () => coiledPod(out, r, [base[0] + x, base[1] + level + 34], 14));
}

// ---------------------------------------------------------------------------
// Sausage tree: a smooth grey branch reaching in from a side, a rounded crown of pinnate leaves
// clustered at the twig tips, and last season's long grey fruit hanging on rope-like stalks.

// A pinnate leaf: leaflets in pairs along a rachis and one at the tip, in one wash.
export function pinnateLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number, pairs: number, W = 0.4, v = tone(r, { spread: 0.07, hue: 10 })) {
  const end = add(O, polar(L, dir));
  const leaflet = L / (pairs + 1.6);
  const blades = [{ O: end, dir, L: leaflet * 1.1, W }];
  for (let k = 1; k <= pairs; k++) {
    const p = lerp(O, end, 0.18 + (0.82 * k) / (pairs + 0.6));
    for (const sg of [-1, 1]) blades.push({ O: p, dir: dir + sg * rad(58), L: leaflet * (0.85 + 0.15 * (k / pairs)), W });
  }
  out.push(`<path class="ink thin" d="M${P1(O)}L${P1(end)}"/>`);
  bladeBunch(out, blades, v);
}

// A sausage fruit hanging from `top` on its long stalk.
export function sausage(out: Out, r: Rng, top: Pt, stalkLen: number, L: number, W: number, sway: number) {
  const hang = add(top, [sway * stalkLen * 0.12, stalkLen]);
  out.push(`<path class="ink thin" d="M${P1(top)}Q${P1(add(lerp(top, hang, 0.5), [sway * stalkLen * 0.1, 0]))} ${P1(hang)}"/>`);
  const curve = (t: number): Pt => add(hang, [Math.sin(t * 2.2) * sway * L * 0.08, t * L]);
  const half = (t: number) => (W / 2) * Math.min(1, t * 6 + 0.25, (1 - t) * 5 + 0.3);
  const spine = sample(curve, 20);
  const A = spine.map((p, i) => add(p, [-half(i / 20), 0]));
  const B = spine.map((p, i) => add(p, [half(i / 20), 0]));
  shape(out, r, [...A, ...[...B].reverse()], tone(r, { pc: "--fruit-kigelia", spread: 0.04, hue: 8 }), { deep: 0.55, deepAbout: curve(0.55) });
  let flecks = "";
  for (let k = 0; k < 16; k++) {
    const t = 0.1 + r() * 0.8;
    const p = add(curve(t), [(r() - 0.5) * W * 0.6, 0]);
    flecks += `M${P1(p)}l.8 .6`;
  }
  out.push(`<path class="ink dots" d="${flecks}"/>`);
}

export function kigelia(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0, 0.5];
  const main = grow(out, gm[0], gm[1], () => limb(out, r, [at([-24, 6]), at([140, -24]), at([290, -16]), at([430, -56]), at([560, -50])], { w0: 46, w1: 12, pc: "--bark-kigelia", cap: "taper" }));
  const forks: { res: Limb; g: number[] }[] = [{ res: main, g: gm }];
  for (const [t, ctrl, w] of [[0.3, [[30, -70], [70, -150], [120, -200]], 20], [0.55, [[40, -60], [100, -120], [150, -150]], 17], [0.7, [[60, 24], [130, 30], [190, 10]], 14]] as const) {
    const i = Math.round(main.n * t);
    const g = [gate(main, gm, i), gate(main, gm, i) + 0.24];
    forks.push({ res: grow(out, g[0], g[1], () => limb(out, r, [main.pts[i - 2], ...ctrl.map((p) => add(main.pts[i], p as Pt))], { w0: w, w1: 6, pc: "--bark-kigelia", cap: "taper", inkFrom: 0.12 })), g });
  }
  // Leaf clusters at the twig tips and along the outer limbs, each over a soft rounded body.
  for (const { res, g } of forks) {
    for (let i = Math.round(res.n * 0.35); i <= res.n; i += 9) {
      const p = res.pts[i];
      const a = angleOf(res.pts, i);
      part(out, gate(res, g, i) + 0.02, p, () => {
        const lump = wobble(r, 0.16, [3, 5, 7]);
        shape(out, r, sample((t) => add(p, polar(52 * (1 + lump(t)), t * Math.PI * 2)), 18).slice(0, -1).map((q) => add(q, [0, -18])), tone(r, { dl: -0.05, spread: 0.03 }), { deep: 0.4, ink: false });
        for (let k = 0; k < 5; k++) pinnateLeaf(out, r, p, a - rad(100) + k * rad(48) + (r() - 0.5) * 0.3, 72 + r() * 18, 3);
      });
    }
  }
  // Fruit hangs from the main limb and the low fork.
  for (const [res, g, t, len] of [[main, gm, 0.42, 130], [main, gm, 0.62, 110], [forks[3].res, forks[3].g, 0.5, 120], [main, gm, 0.82, 140], [forks[3].res, forks[3].g, 0.85, 100]] as const) {
    const i = Math.round(res.n * t);
    const p = add(res.pts[i], [0, res.width(t) * 0.3]);
    part(out, 0.8 + t * 0.05, p, () => sausage(out, r, p, 60 + r() * 90, len, 26 + r() * 6, r() < 0.5 ? -1 : 1));
  }
}

// ---------------------------------------------------------------------------
// Marula: a grey trunk mottled where its bark flakes, leaning in from beyond a bottom corner, and
// a dense rounded crown of pinnate leaves crowded at the branch ends.

export function marula(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gt = [0.02, 0.36];
  const trunk = grow(out, gt[0], gt[1], () => {
    const res = limb(out, r, [at([0, 6]), at([24, -140]), at([70, -280]), at([120, -380])], { w0: 70, w1: 40, pc: "--bark-marula", cap: "blunt" });
    let flakes = "";
    for (let k = 0; k < 14; k++) {
      const i = 2 + Math.floor(r() * (res.n - 4));
      flakes += closed(roundPts(lerp(res.L[i], res.R[i], 0.2 + r() * 0.6), 5 + r() * 6, 3 + r() * 3, angleOf(res.pts, i), 8));
    }
    out.push(`<path class="wash bark-lit"${vars({ pc: "--bark-marula" })} d="${flakes}"/><path class="ink hair bark-tex" d="${flakes}"/>`);
    return res;
  });
  const top = trunk.pts[trunk.n];
  const tips: { p: Pt; a: number; g: number }[] = [];
  for (const [deg, len] of [[-150, 170], [-115, 190], [-80, 180], [-45, 200], [-15, 170]] as const) {
    const a = rad(deg);
    const ctrl: Pt[] = [add(top, [0, 20]), add(top, polar(len * 0.5, a + 0.15)), add(top, polar(len, a))];
    const g = [gt[1] - 0.02, gt[1] + 0.2];
    const res = grow(out, g[0], g[1], () => limb(out, r, ctrl, { w0: 26, w1: 7, pc: "--bark-marula", cap: "taper", inkFrom: 0.2 }));
    tips.push({ p: res.pts[res.n], a: angleOf(res.pts, res.n), g: g[1] });
    tips.push({ p: res.pts[Math.round(res.n * 0.6)], a: angleOf(res.pts, Math.round(res.n * 0.6)) + 0.5, g: gate(res, g, Math.round(res.n * 0.6)) });
  }
  tips.forEach(({ p, a, g }) => {
    part(out, g + 0.02, p, () => {
      shape(out, r, sample((t) => add(p, polar(66 * (0.85 + 0.15 * Math.sin(t * Math.PI * 7)), t * Math.PI * 2)), 18).slice(0, -1), tone(r, { dl: -0.1, spread: 0.03 }), { deep: 0.5, ink: false });
      for (let k = 0; k < 6; k++) pinnateLeaf(out, r, p, a - rad(130) + k * rad(52) + (r() - 0.5) * 0.3, 66 + r() * 16, 5, 0.34);
    });
  });
}

// ---------------------------------------------------------------------------
// Flame lily: thin stems scrambling up through the grass, each leaf's tip drawn out into a
// tendril, and nodding flowers whose six wavy tepals sweep back and up like flames, plum-red
// over a yellow base, the stamens spread beneath.

export function gloriosaFlower(out: Out, r: Rng, c: Pt, s: number, lean: number) {
  const toW = (p: Pt) => add(c, rot(p, lean));
  for (let k = 0; k < 6; k++) {
    const side = k % 2 ? 1 : -1;
    const spread = (Math.floor(k / 2) + 0.5) * 0.36 * side;
    const wav = wobble(r, 0.06, [5, 9]);
    const pts = [
      ...sample((t) => [spread * s * 0.5 + side * t * s * 0.18 + Math.sin(t * 9) * s * 0.03 * (1 + wav(t)), -t * s] as Pt, 10),
      ...sample((t) => [spread * s * 0.5 + side * (1 - t) * s * 0.18 + s * 0.12 * side * Math.sin((1 - t) * Math.PI) + Math.sin((1 - t) * 9 + 1) * s * 0.03, -(1 - t) * s] as Pt, 10),
    ].map(toW);
    shape(out, r, pts, tone(r, { pc: "--flower-gloriosa", spread: 0.05, hue: 10 }), { deep: 0.4, deepAbout: toW([spread * s * 0.5, -s * 0.15]), cls: "wash petal" });
    shape(out, r, pts.slice(0, 4).concat(pts.slice(-4)), tone(r, { pc: "--flower-gold", spread: 0.04 }), { deep: 0, ink: false, cls: "wash petal" });
  }
  let stamens = "";
  let anthers = "";
  for (let k = 0; k < 6; k++) {
    const a = rad(160 - k * 28);
    const end = toW(polar(s * 0.55, a));
    stamens += `M${P1(c)}L${P1(end)}`;
    anthers += closed(roundPts(end, s * 0.07, s * 0.03, lean + a, 6));
  }
  out.push(`<path class="ink hair" d="${stamens}"/><path class="wash anther"${vars({ pc: "--anther" })} d="${anthers}"/><path class="ink hair" d="${anthers}"/>`);
}

export function gloriosa(out: Out, r: Rng, base: Pt) {
  for (const [dx, H, lean, gs] of [[-30, 420, -0.18, 0.04], [20, 480, 0.08, 0.1], [50, 360, 0.3, 0.16]] as const) {
    const n = 24;
    const sway = wobble(r, 10, [1.5, 3]);
    const spine = sample((t) => add(base, [dx + lean * H * t + sway(t), -t * H]), n);
    const g = [gs, gs + 0.4];
    const stem = grow(out, g[0], g[1], () => stalk(out, (t) => spine[Math.round(t * n)], 5, 3, tone(r, { dl: -0.04, spread: 0.03 }), n));
    for (let i = 4; i <= n; i += 3) {
      const p = spine[i];
      const sg = (i / 3) % 2 ? 1 : -1;
      const dir = angleOf(spine, i) + sg * rad(55);
      part(out, gate(stem, g, i), p, () => {
        const leaf = blade(out, r, p, dir, 58 + r() * 14, { W: 0.2, v: tone(r, { spread: 0.06 }), deep: 0.5, rib: "ink hair vein" });
        out.push(`<path class="ink thin" d="${tendril(leaf.tip, dir + sg * 0.4, 16)}"/>`);
      });
    }
    // Flowers nod from the upper leaf axils on long stalks.
    for (const t of [0.62, 0.82]) {
      const i = Math.round(t * n);
      const p = spine[i];
      const sg = t > 0.7 ? 1 : -1;
      const hang = add(p, [sg * 46, 26]);
      part(out, 0.7 + t * 0.1, p, () => {
        out.push(`<path class="ink thin" d="M${P1(p)}Q${P1(add(p, [sg * 40, -14]))} ${P1(hang)}"/>`);
        gloriosaFlower(out, r, hang, 62, sg * 0.25);
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Grasses. Red grass: a tuft of narrow blades, and culms holding drooping clusters of rust-red
// spikelets with kinked awns. Fine thatching grass: taller, straighter culms with loose panicles
// of small golden racemes.

// A tuft of arching blades from one crown, in three tones.
function tuft(out: Out, r: Rng, base: Pt, count: number, len: number, spread: number, g: number) {
  const groups: { O: Pt; dir: number; L: number; W: number }[][] = [[], [], []];
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1);
    const a = rad(-90 + (u - 0.5) * spread + (r() - 0.5) * 12);
    const L = len * (0.6 + Math.sin(u * Math.PI) * 0.4 + r() * 0.2);
    const droop = Math.cos(a) * 0.6;
    const O = add(base, [(u - 0.5) * 30, 0]);
    const p1 = add(O, polar(L * 0.5, a));
    groups[k % 3].push({ O, dir: a, L: L * 0.52, W: 0.05 }, { O: p1, dir: a + droop, L: L * 0.5, W: 0.04 });
  }
  part(out, g, base, () => bladeBunch(out, groups[0], tone(r, { pc: "--straw", spread: 0.05 })));
  part(out, g + 0.04, base, () => bladeBunch(out, groups[1], tone(r, { dl: -0.05, spread: 0.05 })));
  part(out, g + 0.08, base, () => bladeBunch(out, groups[2], tone(r, { dl: 0.03, spread: 0.05 })));
}

export function redgrass(out: Out, r: Rng, base: Pt) {
  tuft(out, r, base, 30, 200, 130, 0.04);
  for (let k = 0; k < 12; k++) {
    const u = k / 11;
    const H = 300 + Math.sin(u * Math.PI) * 120 + r() * 40;
    const lean = (u - 0.5) * 0.7;
    const top = add(base, [(u - 0.5) * 40 + lean * H, -H]);
    const culm = sample(quad(add(base, [(u - 0.5) * 30, 0]), add(base, [(u - 0.5) * 30 + lean * H * 0.3, -H * 0.6]), top), 12);
    part(out, 0.3 + u * 0.2, base, () => {
      out.push(`<path class="ink thin" d="${line(culm)}"/>`);
      let spikes = "";
      let awns = "";
      for (const t of [0.62, 0.76, 0.9, 1]) {
        const p = culm[Math.round(t * 12)];
        for (let j = 0; j < 3; j++) {
          const a = rad(60 + j * 30 + (r() - 0.5) * 20) + lean;
          const tip = add(p, polar(16, a));
          const w = polar(3.4, a + Math.PI / 2);
          spikes += `M${P1(p)}L${P1(add(lerp(p, tip, 0.5), w))}L${P1(tip)}L${P1(sub(lerp(p, tip, 0.5), w))}Z`;
          const kink = add(tip, polar(10, a - 0.5));
          awns += `M${P1(tip)}L${P1(kink)}L${P1(add(kink, polar(14, a + 0.4)))}`;
        }
      }
      out.push(`<path class="wash"${vars(tone(r, { pc: "--grass-rust", spread: 0.06, hue: 10 }))} d="${spikes}"/><path class="ink hair" d="${spikes}${awns}"/>`);
    });
  }
}

export function thatchgrass(out: Out, r: Rng, base: Pt) {
  tuft(out, r, base, 26, 240, 90, 0.04);
  for (let k = 0; k < 8; k++) {
    const u = k / 7;
    const H = 460 + Math.sin(u * Math.PI) * 120 + r() * 40;
    const lean = (u - 0.5) * 0.3;
    const top = add(base, [(u - 0.5) * 30 + lean * H, -H]);
    const culm = sample((t) => lerp(add(base, [(u - 0.5) * 24, 0]), top, t), 10);
    part(out, 0.34 + u * 0.2, base, () => {
      out.push(`<path class="ink thin" d="${line(culm)}"/>`);
      let racemes = "";
      let branches = "";
      for (let j = 0; j < 7; j++) {
        const p = lerp(culm[6], top, j / 6);
        const sg = j % 2 ? 1 : -1;
        const end = add(p, polar(34 - j * 3, rad(-90 + sg * 48) + lean));
        branches += `M${P1(p)}L${P1(end)}`;
        for (const d of [-0.35, 0.35]) {
          const c = add(end, polar(7, rad(90) + d));
          racemes += closed(roundPts(c, 2.6, 7, d, 8));
        }
      }
      out.push(`<path class="ink hair" d="${branches}"/><path class="wash"${vars(tone(r, { pc: "--straw", dl: -0.08, dc: 1.6, spread: 0.05 }))} d="${racemes}"/><path class="ink hair" d="${racemes}"/>`);
    });
  }
}

// ---------------------------------------------------------------------------
// Sabie crinum: a rosette of arching blue-green strap leaves, and on a stalk above them an umbel
// of white trumpets, each tepal keeled with pink.

export function crinumFlower(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const tube = [[0, -L * 0.05], [L * 0.5, -L * 0.07], [L * 0.5, L * 0.07], [0, L * 0.05]] as Pt[];
  shape(out, r, tube.map(toW), tone(r, { pc: "--petal", dl: -0.06, spread: 0.03 }), { deep: 0, cls: "wash petal" });
  for (const a of [-0.5, -0.17, 0.17, 0.5]) {
    const pts = sample((t) => {
      const ang = t * Math.PI * 2;
      return add([L * 0.5, 0], rot([L * 0.26 * (1 + Math.cos(ang)), L * 0.09 * Math.sin(ang)], a));
    }, 14).slice(0, -1);
    shape(out, r, pts.map(toW), tone(r, { pc: "--petal", spread: 0.03 }), { deep: 0, cls: "wash petal" });
    out.push(`<path class="ink hair stripe" d="${line([toW([L * 0.3, 0]), toW(add([L * 0.5, 0], rot([L * 0.42, 0], a)))])}"/>`);
  }
}

export function crinum(out: Out, r: Rng, base: Pt) {
  [-170, -12, -150, -34, -128, -56, -106, -78, -92].forEach((d, k) => {
    part(out, 0.04 + k * 0.03, base, () => blade(out, r, add(base, [(r() - 0.5) * 16, -4]), rad(d), 300 + r() * 110, { W: 0.1, bend: Math.cos(rad(d)) > 0 ? 0.35 : -0.35, v: tone(r, { spread: 0.06, hue: 8 }), deep: 0.5, rib: "ink hair vein" }));
  });
  const n = 20;
  const spine = sample((t) => add(base, [Math.sin(t * 1.6) * 10, -t * 380]), n);
  const g = [0.34, 0.62];
  const scape = grow(out, g[0], g[1], () => stalk(out, (t) => spine[Math.round(t * n)], 12, 8, tone(r, { dl: -0.06, spread: 0.03 }), n));
  const top = spine[n];
  [-150, -120, -60, -30, -90, -170, -10].forEach((d, k) => {
    part(out, gate(scape, g, n) + 0.03 + k * 0.02, top, () => {
      const a = rad(d) + rad(70) * (Math.cos(rad(d)) > 0 ? 1 : -1) * 0.6;
      const p = add(top, polar(24, rad(d)));
      out.push(`<path class="ink thin" d="M${P1(top)}L${P1(p)}"/>`);
      crinumFlower(out, r, p, a, 112);
    });
  });
}

// ---------------------------------------------------------------------------
// Star flower: hairy strap leaves arching out in three ranks, and erect stalks each carrying a
// few bright yellow six-pointed stars and buds.

export function star(out: Out, r: Rng, c: Pt, s: number, tilt: number) {
  const pts: Pt[] = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
    const rr = k % 2 ? s * 0.46 : s;
    pts.push(add(c, [Math.cos(a) * rr, Math.sin(a) * rr * tilt]));
  }
  shape(out, r, pts, tone(r, { pc: "--flower-gold", spread: 0.05 }), { deep: 0.4, cls: "wash petal" });
  shape(out, r, roundPts(c, s * 0.18, s * 0.18 * tilt, 0, 8), tone(r, { pc: "--flower-gold", dl: -0.18, spread: 0.03 }), { deep: 0 });
}

export function hypoxis(out: Out, r: Rng, base: Pt) {
  [-165, -20, -140, -42, -118, -64, -96, -80, -155, -30, -128, -52].forEach((d, k) => {
    part(out, 0.04 + k * 0.025, base, () => {
      const res = blade(out, r, add(base, [(r() - 0.5) * 14, -2]), rad(d), 210 + r() * 90, { W: 0.08, bend: Math.cos(rad(d)) > 0 ? 0.4 : -0.4, v: tone(r, { spread: 0.06 }), deep: 0.5, rib: "ink hair vein" });
      let hair = "";
      for (const s0 of [0.2, 0.35, 0.5, 0.65, 0.8]) hair += `M${P1(res.at(s0))}l${(r() - 0.5) * 6} ${3 + r() * 3}`;
      out.push(`<path class="ink wool" d="${hair}"/>`);
    });
  });
  for (const [dx, H, lean] of [[-14, 220, -0.2], [0, 260, 0], [12, 240, 0.18], [-4, 190, -0.06], [8, 200, 0.1]] as const) {
    const top = add(base, [dx + lean * H, -H]);
    part(out, 0.4 + Math.abs(lean), base, () => {
      out.push(`<path class="ink thin" d="M${P1(add(base, [dx, 0]))}Q${P1(add(base, [dx + lean * H * 0.4, -H * 0.6]))} ${P1(top)}"/>`);
      const flowers = 2 + Math.round(r() * 2);
      for (let k = 0; k < flowers; k++) {
        const c = add(top, [(k % 2 ? 1 : -1) * (14 + k * 5), k * 28]);
        out.push(`<path class="ink hair" d="M${P1(top)}L${P1(c)}"/>`);
        if (k === flowers - 1) shape(out, r, roundPts(c, 4, 8, 0.3, 8), tone(r, { dl: -0.04, spread: 0.04 }), { deep: 0 });
        else star(out, r, c, 24, 0.6);
      }
    });
  }
}
