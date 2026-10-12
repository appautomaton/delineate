// The desert: a Sonoran wash under an open sky. Saguaro, organ pipe, ocotillo, cholla, barrel,
// prickly pear, brittlebush, and creosote rise from the bed; palo verde (hung with mistletoe) and
// mesquite reach in from the sides, and a gourd vine trails in along the ground. Nothing hangs
// from the top, which is left to the sky. Drawn with the same kit as the other gardens. Spines
// are their own pen (.ink.spine, and .ink.hook for the barrel's red hooks), and areoles are dots
// of felt in the spine's color.

import { TAU, rad, P1, add, sub, mul, norm, rot, polar, lerp, wobble, closed, line, sample, vars, tone, shape, stalk, quad, grow, part, roundPts, gate } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";
import { limb, angleOf } from "./woody.ts";
import { blade, palmate, bladeBunch, tendril } from "./mediterranean.ts";

// ---------------------------------------------------------------------------
// Shared shapes

// Edges either side of a spine, `w(i)` its full width at each point.
function edges(spine: Pt[], w: (i: number) => number) {
  const n = spine.length - 1;
  const L: Pt[] = [];
  const R: Pt[] = [];
  spine.forEach((p, i) => {
    const t = norm(sub(spine[Math.min(n, i + 1)], spine[Math.max(0, i - 1)]));
    L.push(add(p, mul([t[1], -t[0]], w(i) / 2)));
    R.push(add(p, mul([-t[1], t[0]], w(i) / 2)));
  });
  return { L, R };
}

// Distance along a polyline at each of its points.
function arcs(pts: Pt[]) {
  let s = 0;
  return pts.map((p, i) => (i ? (s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])) : 0));
}

const dot = (c: Pt, rad: number) => closed(sample((t) => add(c, polar(rad, t * Math.PI * 2)), 6).slice(0, -1));

// An areole: a dot of felt, and its spines as short strokes at the given angles.
function areole(felt: string[], spines: string[], c: Pt, size: number, angles: number[], r: Rng) {
  felt.push(dot(c, size * 0.24));
  for (const a of angles) spines.push(`M${P1(c)}L${P1(add(c, polar(size * (0.8 + r() * 0.4), a)))}`);
}

// Ribs on a body between edges L and R: each at a fixed turn of the surface, so ribs crowd
// toward the edges as they turn away. `turn(i)` twists them, and `from` skips the base.
function ribs(L: Pt[], R: Pt[], count: number, { spread = 0.86, from = 1, upTo = L.length - 1, turn = () => 0 }: { spread?: number; from?: number; upTo?: number; turn?: (i: number) => number } = {}) {
  const lines: Pt[][] = [];
  for (let k = 0; k < count; k++) {
    const a = ((k / (count - 1)) * 2 - 1) * spread * (Math.PI / 2);
    const pts: Pt[] = [];
    for (let i = from; i <= upTo; i++) {
      const s = Math.sin(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, a + turn(i))));
      pts.push(lerp(lerp(L[i], R[i], 0.5), s < 0 ? L[i] : R[i], Math.abs(s) * 0.97));
    }
    lines.push(pts);
  }
  return lines;
}

// A cup flower open to the sky: a short tube, petals fanned around its rim, and a heart of
// stamens. `lean` tips it off upright.
function cup(out: Out, r: Rng, c: Pt, s: number, lean: number, { petal = "--petal", heart = "--flower-heart", petals = 7 }: { petal?: string; heart?: string; petals?: number } = {}) {
  const toW = (p: Pt) => add(c, rot(p, lean));
  shape(out, r, [[-s * 0.2, 0], [-s * 0.26, -s * 0.42], [s * 0.26, -s * 0.42], [s * 0.2, 0]].map(toW), tone(r, { dl: -0.04, spread: 0.03 }), { deep: 0 });
  const rim: Pt = [0, -s * 0.45];
  for (let k = 0; k < petals; k++) {
    const a = rad(-165 + (150 * k) / (petals - 1));
    const mid = add(rim, polar(s * 0.3, a));
    const pts = sample((t) => add(mid, rot([Math.cos(t * Math.PI * 2) * s * 0.36, Math.sin(t * Math.PI * 2) * s * 0.17], a)), 12).slice(0, -1);
    shape(out, r, pts.map(toW), tone(r, { pc: petal, spread: 0.05, hue: 8 }), { deep: 0 });
  }
  shape(out, r, sample((t) => add(rim, [Math.cos(t * Math.PI * 2) * s * 0.24, Math.sin(t * Math.PI * 2) * s * 0.1 - s * 0.04]), 10).slice(0, -1).map(toW), tone(r, { pc: heart, spread: 0.04 }), { deep: 0 });
}

// ---------------------------------------------------------------------------
// Saguaro: a pleated column, arms lifting from it like raised hands, white flowers on the tips.

// One ribbed column, trunk or arm, from `spine`'s base to its domed tip. Areoles stud every
// other rib, staggered with the rest.
export function saguaroColumn(out: Out, r: Rng, spine: Pt[], W: number, count: number) {
  const n = spine.length - 1;
  const along = arcs(spine);
  const S = along[n];
  const cap = W / 2;
  const width = (i: number) => {
    const w = W * (0.93 + 0.07 * Math.min(1, along[i] / (W * 1.5)));
    const d = along[i] - (S - cap);
    return d > 0 ? w * Math.sqrt(Math.max(0, 1 - (d / cap) ** 2)) : w;
  };
  const { L, R } = edges(spine, width);
  const right = norm(sub(R[Math.round(n * 0.45)], L[Math.round(n * 0.45)]));
  shape(out, r, [...L, spine[n], ...[...R].reverse()], tone(r, { spread: 0.03, hue: 6 }), { deep: 0.6, deepAbout: add(spine[Math.round(n * 0.45)], mul(right, W * 0.22)) });
  const lines = ribs(L, R, count, { from: 1, upTo: n - 1 });
  out.push(`<path class="ink hair" d="${lines.map(line).join("")}"/>`);
  const felt: string[] = [];
  const spines: string[] = [];
  const gap = W * 0.24;
  lines.forEach((pts, k) => {
    const rib = arcs(pts);
    for (let s = gap * (k % 2 ? 0.5 : 1); s < rib[rib.length - 1] - cap * 0.4; s += gap) {
      const i = rib.findIndex((v) => v >= s);
      areole(felt, spines, pts[i], W * 0.075, [rad(-150), rad(-30), rad(90)].map((a) => a + (r() - 0.5) * 0.5), r);
    }
  });
  out.push(`<path class="wash"${vars({ pc: "--spine", dl: -0.18 })} d="${felt.join("")}"/><path class="ink hair spine" d="${spines.join("")}"/>`);
  return { L, R, pts: spine };
}

export function saguaroFlower(out: Out, r: Rng, c: Pt, s: number, lean: number) {
  cup(out, r, c, s, lean, { petal: "--petal", heart: "--flower-heart" });
}

export function saguaro(out: Out, r: Rng, base: Pt) {
  const H = 760;
  const W = 112;
  const sway = wobble(r, 4, [0.7, 1.3]);
  const trunk = sample((t) => add(base, [sway(t), -t * H]), 64);
  const at = (t: number) => trunk[Math.round(t * 64)];
  // An arm leaves the trunk level, bends up at its knee, and rises; arms come first, so the
  // trunk covers where they join it.
  const arm = (t0: number, side: number, reach: number, rise: number) => {
    const p0 = add(at(t0), [side * W * 0.38, 0]);
    const knee = add(at(t0), [side * (W / 2 + reach), 12]);
    const bend = add(knee, [side * 2, -reach * 0.9]);
    const elbow = sample((t) => add(add(mul(p0, (1 - t) ** 2), mul(knee, 2 * (1 - t) * t)), mul(bend, t * t)), 14);
    const lift = sample((t) => add(bend, [side * 5 * t, -rise * t]), 24).slice(1);
    return [...elbow, ...lift];
  };
  const arms = [
    { spine: arm(0.4, -1, 62, 250), w: 76, g: [0.3, 0.64] },
    { spine: arm(0.55, 1, 52, 190), w: 70, g: [0.36, 0.68] },
  ];
  for (const { spine, w, g } of arms) grow(out, g[0], g[1], () => saguaroColumn(out, r, spine, w, 3));
  grow(out, 0.02, 0.56, () => saguaroColumn(out, r, trunk, W, 6));
  // Flowers crown each tip, a few on its dome.
  const crown = (tip: Pt, w: number, size: number, g: number, spots: number[][]) =>
    spots.forEach(([x, lean], k) => {
      const c = add(tip, [x * w, Math.abs(x) * w * 0.35]);
      part(out, g + k * 0.03, c, () => saguaroFlower(out, r, c, size, rad(lean)));
    });
  crown(trunk[64], W / 2, 42, 0.74, [[-0.55, -24], [0.05, 4], [0.6, 26]]);
  crown(arms[0].spine.at(-1)!, 38, 34, 0.8, [[-0.4, -18], [0.35, 16]]);
  crown(arms[1].spine.at(-1)!, 35, 34, 0.84, [[0, 0]]);
}

// ---------------------------------------------------------------------------
// Engelmann prickly pear: flat pads stacked into a sprawling clump, yellow cups and magenta fruit
// along their rims.

// One pad: an obovate joint, widest two thirds of the way up, its areoles set in diagonal rows.
// Returns where a point of its outline lies: `s` along it from base to tip, `v` across, as a
// share of its half width there.
export function opuntiaPad(out: Out, r: Rng, O: Pt, dir: number, L: number, W = 0.7) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const half = (s: number) => ((W * L) / 2) * Math.sin(Math.PI * Math.min(1, s) ** 0.72) ** 0.72;
  const up = sample((s) => [s * L, -half(s)] as Pt, 22);
  const dn = sample((s) => [s * L, half(s)] as Pt, 22);
  shape(out, r, [...up, ...dn.slice(0, -1).reverse()].map(toW), tone(r, { spread: 0.06, hue: 10 }), { deep: 0.62, deepAbout: toW([L * 0.58, half(0.58) * 0.35]) });
  const felt: string[] = [];
  const spines: string[] = [];
  for (let row = 0; row < 6; row++) {
    const s = 0.16 + row * 0.14;
    for (let col = -2; col <= 2; col++) {
      const v = (col + (row % 2 ? 0.5 : 0)) * 0.36;
      if (Math.abs(v) > 0.78) continue;
      const c = toW([s * L, v * half(s)]);
      areole(felt, spines, c, L * 0.07, [dir + Math.PI * 0.8, dir - Math.PI * 0.8].map((a) => a + (r() - 0.5) * 0.6), r);
    }
  }
  out.push(`<path class="wash"${vars({ pc: "--spine", dl: -0.3, dc: 1.4 })} d="${felt.join("")}"/><path class="ink hair spine" d="${spines.join("")}"/>`);
  return { at: (s: number, v: number) => toW([s * L, v * half(s)]), dir };
}

// A prickly pear fruit: a magenta barrel on a pad's rim, with the cup scar of its flower on top.
export function opuntiaFruit(out: Out, r: Rng, c: Pt, dir: number, s: number) {
  const toW = (p: Pt) => add(c, rot(p, dir));
  const pts = sample((t) => {
    const a = t * Math.PI * 2;
    const x = Math.cos(a);
    const y = Math.sin(a);
    return [s * 0.65 * (1 + x), s * 0.5 * Math.sign(y) * Math.abs(y) ** 0.8 * (0.82 + 0.18 * (1 + x) / 2)] as Pt;
  }, 20).slice(0, -1);
  shape(out, r, pts.map(toW), tone(r, { pc: "--fruit-opuntia", spread: 0.06, hue: 10 }), { deep: 0.55, deepAbout: toW([s * 0.75, s * 0.15]) });
  out.push(`<path class="ink thin" d="${closed(sample((t) => [s * 1.24 + Math.cos(t * Math.PI * 2) * s * 0.07, Math.sin(t * Math.PI * 2) * s * 0.2] as Pt, 8).slice(0, -1).map(toW))}"/>`);
  const specks = [0.35, 0.6, 0.85].flatMap((x) => [-0.25, 0.2].map((y) => `M${P1(toW([s * x * 1.3, s * y]))}L${P1(toW([s * x * 1.3 + 2, s * y + 1]))}`));
  out.push(`<path class="ink hair spine" d="${specks.join("")}"/>`);
}

export function opuntiaFlower(out: Out, r: Rng, c: Pt, s: number, lean: number) {
  cup(out, r, c, s, lean, { petal: "--flower-opuntia", heart: "--fruit-unripe", petals: 8 });
}

export function opuntia(out: Out, r: Rng, base: Pt) {
  const pad = (g: number, O: Pt, d: number, L: number) => part(out, g, O, () => opuntiaPad(out, r, O, rad(d), L));
  const p1 = pad(0.04, base, -96, 186);
  const p6 = pad(0.12, add(base, [108, 2]), -66, 150);
  const p2 = pad(0.2, p1.at(0.8, 0.84), -50, 160);
  const p3 = pad(0.26, p1.at(0.86, -0.76), -138, 146);
  const p7 = pad(0.32, p6.at(0.9, 0.36), -30, 120);
  const p4 = pad(0.4, p2.at(0.97, 0.12), -80, 136);
  const p5 = pad(0.46, p3.at(0.95, -0.24), -158, 118);
  // Fruit and flowers sit on the rims, facing outward from the pad.
  const rim = (p: ReturnType<typeof opuntiaPad>, s: number, v: number) => ({ c: p.at(s, v), dir: p.dir + v * 0.7 });
  [[p4, 0.9, -0.6], [p4, 0.99, 0.1], [p4, 0.88, 0.7], [p5, 0.95, 0.4], [p5, 0.88, -0.65], [p7, 0.96, -0.3]].forEach(([p, s, v], k) => {
    const { c, dir } = rim(p as ReturnType<typeof opuntiaPad>, s as number, v as number);
    part(out, 0.78 + k * 0.025, c, () => opuntiaFruit(out, r, c, dir, 26));
  });
  [[p2, 0.9, -0.62], [p7, 0.85, 0.75]].forEach(([p, s, v], k) => {
    const { c, dir } = rim(p as ReturnType<typeof opuntiaPad>, s as number, v as number);
    part(out, 0.7 + k * 0.04, c, () => opuntiaFlower(out, r, c, 56, dir + Math.PI / 2));
  });
}

// ---------------------------------------------------------------------------
// Fishhook barrel: squat ribbed barrels leaning toward the sun, a red hook at the heart of every
// areole, and a crown of flowers.

// One barrel, from its base in the ground to its crown; its ribs twist a little as they rise.
export function barrelBody(out: Out, r: Rng, base: Pt, H: number, W: number, lean: number) {
  const n = 36;
  const t0 = 0.06; // where the ground cuts the barrel's swell
  const p = 2.1;
  const half = (t: number) => (W / 2) * Math.max(0, 1 - Math.abs((t - 0.5) / 0.5) ** p) ** (1 / p);
  const ts = sample((u) => t0 + u * (1 - t0), n);
  const spine = ts.map((t) => add(base, rot([0, -((t - t0) / (1 - t0)) * H], lean)));
  const { L, R } = edges(spine, (i) => half(ts[i]) * 2);
  shape(out, r, [...L, spine[n], ...[...R].reverse()], tone(r, { spread: 0.04, hue: 8 }), { deep: 0.62, deepAbout: add(spine[Math.round(n * 0.4)], rot([W * 0.16, 0], lean)) });
  const lines = ribs(L, R, 9, { from: 0, upTo: n - 1, turn: (i) => (i / n) * 0.3 });
  out.push(`<path class="ink hair" d="${lines.map(line).join("")}"/>`);
  const felt: string[] = [];
  const spines: string[] = [];
  const hooks: string[] = [];
  const gap = W * 0.13;
  const mid = spine[Math.round(n / 2)];
  lines.forEach((pts, k) => {
    const rib = arcs(pts);
    for (let s = gap * (k % 2 ? 0.5 : 1); s < rib[rib.length - 1] - gap * 0.4; s += gap) {
      const i = rib.findIndex((v) => v >= s);
      const c = pts[i];
      const outward = Math.atan2(c[1] - mid[1] + H * 0.4, c[0] - mid[0]);
      areole(felt, spines, c, W * 0.05, [-0.9, -0.3, 0.3, 0.9].map((d) => outward + d), r);
      // The hook: down and out from the areole, curling back at its end.
      const a = outward * 0.4 + Math.PI * 0.42;
      const end = add(c, polar(W * 0.075, a));
      const curl = add(end, polar(W * 0.022, a - Math.PI * 0.9));
      hooks.push(`M${P1(c)}L${P1(end)}Q${P1(add(end, polar(W * 0.022, a + 0.6)))} ${P1(curl)}`);
    }
  });
  out.push(`<path class="wash"${vars({ pc: "--spine", dl: -0.25 })} d="${felt.join("")}"/><path class="ink hair spine" d="${spines.join("")}"/><path class="ink thin hook" d="${hooks.join("")}"/>`);
  return { L, R, pts: spine, crown: spine[n] };
}

export function barrelFlower(out: Out, r: Rng, c: Pt, s: number, lean: number) {
  cup(out, r, c, s, lean, { petal: "--flower-ferocactus", heart: "--flower-heart", petals: 7 });
}

export function ferocactus(out: Out, r: Rng, base: Pt) {
  const barrel = (b: Pt, H: number, W: number, lean: number, g: [number, number], flowers: number[], gf: number) => {
    const { crown } = grow(out, g[0], g[1], () => barrelBody(out, r, b, H, W, lean));
    flowers.forEach((x, k) => {
      const c = add(crown, rot([x * W * 0.5, Math.abs(x) * W * 0.1], lean));
      part(out, gf + k * 0.03, c, () => barrelFlower(out, r, c, W * 0.17, lean + x * 0.6));
    });
  };
  barrel(add(base, [-170, 0]), 170, 150, rad(4), [0.16, 0.5], [-0.22, 0.24], 0.76);
  barrel(base, 300, 240, rad(7), [0.02, 0.44], [-0.38, -0.12, 0.14, 0.4], 0.66);
}

// ---------------------------------------------------------------------------
// More shared shapes

// Small flowers of radiating petals as one wash and one ink path: a daisy's rays, or the five
// petals of a palo verde or creosote flower, around a heart.
function rays(out: Out, r: Rng, c: Pt, s: number, { count = 5, width = 0.4, petal = "--flower-gold", heart = "--flower-heart", spin = 0, squash = 1 }: { count?: number; width?: number; petal?: string; heart?: string; spin?: number; squash?: number } = {}) {
  let d = "";
  for (let k = 0; k < count; k++) {
    const a = spin + (k / count) * TAU;
    const pts = roundPts(add(c, mul(polar(s * 0.55, a), 1)), s * 0.42, s * 0.42 * width, a, 8).map((p) => [c[0] + (p[0] - c[0]), c[1] + (p[1] - c[1]) * squash] as Pt);
    d += closed(pts);
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: petal, spread: 0.05, hue: 8 }))} d="${d}"/><path class="ink hair" d="${d}"/>`);
  shape(out, r, roundPts(c, s * 0.24, s * 0.24 * squash, 0, 8), tone(r, { pc: heart, dl: -0.08, spread: 0.03 }), { deep: 0 });
}

// ---------------------------------------------------------------------------
// Organ pipe: many ribbed columns rising together from one base, leaning out and turning up,
// with pale pink flowers at a few tips.
export function organpipe(out: Out, r: Rng, base: Pt) {
  const stems: [number, number, number, number][] = [
    [-66, -26, 330, 50],
    [64, 25, 360, 50],
    [-46, -19, 430, 54],
    [46, 17, 470, 56],
    [-24, -10, 560, 60],
    [24, 8, 600, 60],
    [0, -2, 660, 64],
  ];
  const tips: { tip: Pt; w: number; g: number }[] = [];
  stems.forEach(([x, lean, H, W], k) => {
    const b = add(base, [x, 0]);
    const a = rad(lean);
    const spine = sample((t) => add(b, [Math.sin(a) * H * (t - 0.42 * t * t), -H * t]), 48);
    const g = [0.02 + k * 0.035, 0.5 + k * 0.03];
    grow(out, g[0], g[1], () => saguaroColumn(out, r, spine, W, 4));
    tips.push({ tip: spine[48], w: W, g: g[1] });
  });
  [6, 3, 1].forEach((k, i) => {
    const { tip, w, g } = tips[k];
    const c = add(tip, [(i - 1) * w * 0.12, w * 0.04]);
    part(out, Math.max(g, 0.7) + i * 0.04, c, () => organpipeFlower(out, r, c, 34, rad((i - 1) * 14)));
  });
}

export function organpipeFlower(out: Out, r: Rng, c: Pt, s: number, lean: number) {
  cup(out, r, c, s, lean, { petal: "--flower-organpipe", heart: "--flower-heart", petals: 8 });
}

// ---------------------------------------------------------------------------
// Ocotillo: bare whip canes fanning from one crown, thorned along their length, small leaves
// in clusters at the thorns, and a spike of scarlet tubes at every tip.
// A cane: a thin stalk on a quadratic from P0 through C to E, thorned on alternate sides.
export function ocotilloStem(out: Out, r: Rng, P0: Pt, C: Pt, E: Pt) {
  const res = stalk(out, quad(P0, C, E), 10, 4.5, tone(r, { pc: "--bark-pale", spread: 0.03 }), 30);
  let thorns = "";
  res.pts.forEach((p, i) => {
    if (i < 3 || i > 28 || i % 2) return;
    const n = angleOf(res.pts, i) + (i % 4 ? 1 : -1) * Math.PI * 0.45;
    thorns += `M${P1(p)}L${P1(add(p, polar(8, n)))}`;
  });
  out.push(`<path class="ink thin" d="${thorns}"/>`);
  return res;
}

// Leaf clusters at the thorns of a cane's stretch from point `from` to `to`.
export function ocotilloLeaves(out: Out, r: Rng, pts: Pt[], from: number, to: number) {
  const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
  for (let i = from; i <= to; i += 2) {
    const a = angleOf(pts, i);
    for (const d of [-60, -20, 25, 65]) blades.push({ O: pts[i], dir: a + rad(d) + (r() - 0.5) * 0.4, L: 16 + r() * 6, W: 0.42 });
  }
  bladeBunch(out, blades, tone(r, { spread: 0.06 }));
}

// The flower spike: scarlet tubes in pairs down the last stretch of a cane.
export function ocotilloSpike(out: Out, r: Rng, tip: Pt, dir: number, k = 1) {
  let d = "";
  for (let j = 0; j < 10; j++) {
    const p = add(tip, polar(-j * 7 * k, dir));
    for (const sg of [-1, 1]) d += closed(roundPts(add(p, polar(7 * k, dir + sg * 0.9)), 9 * k, 3.4 * k, dir + sg * 0.5, 8));
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--flower-ocotillo", spread: 0.06, hue: 8 }))} d="${d}"/><path class="ink hair" d="${d}"/>`);
}

export function ocotillo(out: Out, r: Rng, base: Pt) {
  const count = 13;
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1);
    const a = rad(-128 + 76 * u + (r() - 0.5) * 6);
    const len = (440 + 200 * (1 - Math.abs(u - 0.5) * 1.6)) * (0.9 + r() * 0.2);
    const out0 = a + Math.PI / 2;
    const P0 = add(base, [(k - 6) * 3, 0]);
    const C = add(P0, polar(len * 0.5, a - out0 * 0.12));
    const E = add(P0, polar(len, a + out0 * 0.1));
    const g = [0.02 + Math.abs(u - 0.5) * 0.12, 0.47 + Math.abs(u - 0.5) * 0.12];
    const cane = grow(out, g[0], g[1], () => ocotilloStem(out, r, P0, C, E));
    // Leaves come in three flushes along the cane, each as its stretch is reached.
    for (const [from, to] of [[3, 10], [11, 18], [19, 26]]) part(out, gate(cane, g, to), cane.pts[Math.round((from + to) / 2)], () => ocotilloLeaves(out, r, cane.pts, from, to));
    const tip = cane.pts[30];
    part(out, g[1] + 0.12, tip, () => ocotilloSpike(out, r, tip, angleOf(cane.pts, 30)));
  }
}

// ---------------------------------------------------------------------------
// Chain-fruit cholla: a short woody trunk, jointed arms of tubercled joints wrapped in pale
// spines that catch the light, and chains of green fruit hanging from the older joints.

// One joint: a tubercled cylinder from O along dir, and a halo of spines. Returns its tip.
export function chollaJoint(out: Out, r: Rng, O: Pt, dir: number, L: number, W: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const bump = wobble(r, 0.07, [7, 11]);
  const half = (s: number) => (W / 2) * Math.sin(Math.PI * Math.min(1, Math.max(0, s))) ** 0.35 * (1 + bump(s));
  const up = sample((s) => [s * L, -half(s)] as Pt, 18);
  const dn = sample((s) => [s * L, half(s)] as Pt, 18);
  shape(out, r, [...up, ...dn.slice(0, -1).reverse()].map(toW), tone(r, { spread: 0.05, hue: 8 }), { deep: 0.6, deepAbout: toW([L * 0.5, W * 0.14]) });
  let tubercles = "";
  let spines = "";
  for (let i = 1; i < 6; i++)
    for (const v of [-0.5, 0, 0.5]) {
      const c: Pt = [(i / 6 + (v === 0 ? 0.08 : 0)) * L, v * half(i / 6)];
      tubercles += line([add(c, [-W * 0.12, -W * 0.06]), add(c, [0, W * 0.07]), add(c, [W * 0.12, -W * 0.06])].map(toW));
      for (let j = 0; j < 4; j++) {
        const a = Math.atan2(c[1], 1) * 2.2 + (r() - 0.5) * 2.4 + (c[1] < 0 ? -Math.PI / 2 : c[1] > 0 ? Math.PI / 2 : (r() < 0.5 ? -1 : 1) * Math.PI / 2);
        spines += `M${P1(toW(c))}L${P1(toW(add(c, polar(W * (0.35 + r() * 0.25), a))))}`;
      }
    }
  out.push(`<path class="ink hair" d="${tubercles}"/><path class="ink hair spine" d="${spines}"/>`);
  return { tip: toW([L * 0.96, 0]), dir };
}

export function cholla(out: Out, r: Rng, base: Pt) {
  const trunkTop = add(base, [4, -96]);
  grow(out, 0.02, 0.18, () => limb(out, r, [base, add(base, [-3, -50]), trunkTop], { w0: 28, w1: 22, cap: "blunt" }));
  // Joints bud from joint tips, a level at a time.
  const levels: [number, number][][] = [
    [[-132, 0], [-58, 0]],
    [[-28, 0], [22, 0], [-22, 1], [28, 1]],
    [[-24, 1], [26, 2]],
  ];
  let ends = [{ tip: trunkTop, dir: rad(-90) }];
  const hangers: Pt[] = [];
  levels.forEach((level, depth) => {
    const next: { tip: Pt; dir: number }[] = [];
    level.forEach(([turn, from], k) => {
      const parent = ends[Math.min(from, ends.length - 1)];
      const dir = depth === 0 ? rad(turn) : parent.dir + rad(turn);
      const L = [100, 86, 74][depth] * (0.9 + r() * 0.2);
      const res = part(out, 0.18 + depth * 0.13 + k * 0.02, parent.tip, () => chollaJoint(out, r, parent.tip, dir, L, [40, 34, 30][depth]));
      next.push(res);
      if (depth < 2) hangers.push(add(parent.tip, polar(L * 0.55, dir)));
    });
    ends = next;
  });
  hangers.slice(0, 4).forEach((top, k) => part(out, 0.72 + k * 0.03, top, () => chollaFruit(out, r, top, 3 + (k % 2) * 2, k)));
}

// A chain of fruit, each hanging from the one before.
export function chollaFruit(out: Out, r: Rng, top: Pt, n: number, phase = 0, k = 1) {
  let p = top;
  for (let j = 0; j < n; j++) {
    const c = add(p, [Math.sin(j * 1.3 + phase) * 4 * k, 15 * k]);
    shape(out, r, roundPts(c, 11 * k, 15 * k, 0.1 * (j % 2 ? 1 : -1), 12), tone(r, { dl: 0.08, dc: 0.8, spread: 0.05 }), { deep: 0.5 });
    p = add(c, [0, 14 * k]);
  }
}

// ---------------------------------------------------------------------------
// Brittlebush: a mound of silver felted leaves, and long bare stalks holding yellow daisies above.
export function brittlebush(out: Out, r: Rng, base: Pt) {
  const leaves = Array.from({ length: 34 }, (_, k) => {
    const a = rad(-90 + (r() - 0.5) * 170);
    const O = add(base, [(r() - 0.5) * 70, -r() * 30]);
    const tall = 1 - Math.abs(a + Math.PI / 2) / (Math.PI / 2);
    return { a, O, L: (64 + 50 * tall) * (0.85 + r() * 0.3), k };
  }).sort((x, y) => Math.abs(x.a + Math.PI / 2) - Math.abs(y.a + Math.PI / 2));
  leaves.forEach(({ a, O, L }, i) => part(out, 0.04 + i * 0.008, O, () => brittlebushLeaf(out, r, O, a, L)));
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    const b = add(base, [(u - 0.5) * 90, -40 - r() * 20]);
    const H = 230 + r() * 110 - Math.abs(u - 0.5) * 60;
    const top = add(b, [(u - 0.5) * 140 + (r() - 0.5) * 30, -H]);
    const g = [0.4 + i * 0.02, 0.64 + i * 0.02];
    const stem = grow(out, g[0], g[1], () => stalk(out, quad(b, add(lerp(b, top, 0.5), [(r() - 0.5) * 30, 0]), top), 4, 2, tone(r, { dl: 0.06, dc: 0.6 }), 16));
    const heads = i % 3 === 0 ? 3 : 2;
    for (let h = 0; h < heads; h++) {
      const a = rad(-90 + (h - (heads - 1) / 2) * 40);
      const c = add(top, polar(26, a));
      part(out, g[1] + 0.06 + h * 0.02, top, () => {
        out.push(`<path class="ink thin" d="M${P1(stem.pts[16])}Q${P1(add(top, polar(12, a + 0.3)))} ${P1(c)}"/>`);
        brittlebushHead(out, r, c, 26);
      });
    }
  }
}

// A felted leaf: a broad oval, widest past its middle.
export function brittlebushLeaf(out: Out, r: Rng, O: Pt, a: number, L: number) {
  blade(out, r, O, a, L, { W: 0.5, prof: (s) => Math.sin(Math.PI * Math.min(1, s) ** 0.62) ** 0.8, v: tone(r, { spread: 0.06, hue: 10 }), deep: 0.5, rib: "ink hair" });
}

// A daisy, seen a little from below.
export function brittlebushHead(out: Out, r: Rng, c: Pt, s: number) {
  rays(out, r, c, s, { count: 11, width: 0.34, petal: "--flower-gold", heart: "--anther", spin: r(), squash: 0.82 });
}

// ---------------------------------------------------------------------------
// Creosote: an open vase of thin forking stems, tiny paired leaflets, small yellow flowers, and
// fuzzy white seed balls.
export function creosote(out: Out, r: Rng, base: Pt) {
  const count = 12;
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1);
    const a = rad(-124 + 68 * u + (r() - 0.5) * 8);
    const len = 300 + r() * 110;
    const zig = wobble(r, 9, [3, 5]);
    const P0 = add(base, [(u - 0.5) * 30, 0]);
    const at = (t: number) => add(add(P0, polar(len * t, a + (a + Math.PI / 2) * 0.25 * t)), [zig(t) * t, 0]);
    const g = [0.02 + Math.abs(u - 0.5) * 0.1, 0.48 + Math.abs(u - 0.5) * 0.1];
    const main = grow(out, g[0], g[1], () => stalk(out, at, 5.5, 2, tone(r, { pc: "--bark", dl: 0.06, spread: 0.04 }), 26));
    const branches = [main];
    const gs = [g];
    for (const t of [0.45, 0.68]) {
      const i = Math.round(t * 26);
      const from = main.pts[i];
      const side = (k + (t > 0.5 ? 1 : 0)) % 2 ? 1 : -1;
      const b = add(from, polar(90 + r() * 40, angleOf(main.pts, i) + side * rad(34)));
      const gb = [gate(main, g, i), gate(main, g, i) + 0.2];
      branches.push(grow(out, gb[0], gb[1], () => stalk(out, quad(from, lerp(from, b, 0.5), b), 3, 1.5, tone(r, { pc: "--bark", dl: 0.06 }), 10)));
      gs.push(gb);
    }
    branches.forEach((br, j) => {
      const n = br.pts.length - 1;
      part(out, gate(br, gs[j], n), br.pts[Math.round(n * 0.75)], () => creosoteLeaves(out, r, br.pts, Math.round(n * 0.3)));
      const tip = br.pts[n];
      if ((k + j) % 3 === 0) part(out, 0.72 + ((k + j) % 5) * 0.02, tip, () => creosoteFlower(out, r, add(tip, [0, -4]), 13));
      else if ((k + j) % 3 === 1) part(out, 0.82 + ((k + j) % 4) * 0.02, tip, () => creosoteSeed(out, r, add(tip, [0, -5]), 1));
    });
  }
}

// Tiny leaflets in pairs, each pair a V, along a stem from its point `from` to its tip.
export function creosoteLeaves(out: Out, r: Rng, pts: Pt[], from: number, k = 1) {
  const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
  for (let i = from; i < pts.length; i += 2) {
    const d = angleOf(pts, i);
    for (const sg of [-1, 1]) blades.push({ O: pts[i], dir: d + sg * rad(30 + r() * 20), L: (11 + r() * 4) * k, W: 0.5 });
  }
  bladeBunch(out, blades, tone(r, { spread: 0.05 }));
}

export function creosoteFlower(out: Out, r: Rng, c: Pt, s: number) {
  rays(out, r, c, s, { count: 5, width: 0.62, petal: "--flower-gold", heart: "--anther", spin: r() });
}

// A seed ball: a white fuzz of hairs around the fruit.
export function creosoteSeed(out: Out, r: Rng, c: Pt, k: number) {
  let hair = "";
  for (let h = 0; h < 14; h++) hair += `M${P1(add(c, polar(4 * k, (h / 14) * TAU)))}L${P1(add(c, polar(8.5 * k, (h / 14) * TAU + 0.2)))}`;
  shape(out, r, roundPts(c, 5.5 * k, 5.5 * k, 0, 8), tone(r, { pc: "--petal", dl: -0.06 }), { deep: 0 });
  out.push(`<path class="ink hair" d="${hair}"/>`);
}

// ---------------------------------------------------------------------------
// Foothill palo verde, hung with desert mistletoe: a green-barked branch reaching in from a
// side, fine green twigs of tiny leaflets, clouds of small yellow flowers, and leathery clumps
// of the mistletoe that lives on it, with pink berries.

// Fine twigs of tiny leaflets in pairs, with a few yellow flowers, from `O` along dir.
export function verdeTwig(out: Out, r: Rng, O: Pt, dir: number, L: number, flowers: boolean, k = 1) {
  const end = add(O, polar(L, dir));
  const twig = sample((t) => lerp(O, end, t), 8);
  out.push(`<path class="ink thin" d="${line(twig)}"/>`);
  const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
  for (let i = 2; i <= 8; i++) for (const sg of [-1, 1]) blades.push({ O: twig[i], dir: dir + sg * rad(50), L: (7 + r() * 2) * k, W: 0.6 });
  bladeBunch(out, blades, tone(r, { dl: 0.05, spread: 0.05 }));
  if (flowers) [0.55, 0.85, 1].forEach((t) => rays(out, r, add(lerp(O, end, t), polar(6 * k, dir - Math.PI / 2)), 12 * k, { count: 5, width: 0.7, petal: "--flower-gold", heart: "--anther", spin: r() }));
}

// A mistletoe clump: leafless jointed stems forking in pairs as they hang, berries at the ends.
export function mistletoe(out: Out, r: Rng, top: Pt, size: number) {
  const fork = (p: Pt, a: number, len: number, depth: number, ends: Pt[]) => {
    const end = add(p, polar(len, a));
    stalk(out, quad(p, add(lerp(p, end, 0.5), polar(len * 0.06, a + 1.2)), end), Math.max(2, 5 - depth), Math.max(1.5, 4 - depth), tone(r, { pc: "--mistletoe", spread: 0.05, hue: 8 }), 6);
    if (depth === 4) return ends.push(end);
    for (const sg of [-1, 1]) fork(end, a + sg * rad(24 + r() * 12), len * 0.78, depth + 1, ends);
  };
  const ends: Pt[] = [];
  fork(top, rad(90 + (r() - 0.5) * 20), size * 0.32, 0, ends);
  let berries = "";
  ends.forEach((e, k) => {
    if (k % 2) berries += closed(roundPts(add(e, [0, 3]), 4.2, 4.2, 0, 8));
  });
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--berry-mistletoe", spread: 0.05 }))} d="${berries}"/><path class="ink hair" d="${berries}"/>`);
}

export function paloverde(out: Out, r: Rng, base: Pt) {
  const gm = [0, 0.56];
  const main = grow(out, gm[0], gm[1], () => limb(out, r, [add(base, [-24, 6]), add(base, [170, -50]), add(base, [350, -86]), add(base, [520, -140]), add(base, [660, -160])], { w0: 30, w1: 8, pc: "--bark-verde", cap: "taper" }));
  const i1 = Math.round(main.n * 0.42);
  const g1 = [gate(main, gm, i1), gate(main, gm, i1) + 0.3];
  const up = grow(out, g1[0], g1[1], () => limb(out, r, [main.pts[i1 - 2], add(main.pts[i1], [70, -90]), add(main.pts[i1], [140, -190]), add(main.pts[i1], [190, -250])], { w0: 16, w1: 6, pc: "--bark-verde", cap: "taper", inkFrom: 0.12 }));
  const i2 = Math.round(main.n * 0.68);
  const g2 = [gate(main, gm, i2), gate(main, gm, i2) + 0.28];
  const down = grow(out, g2[0], g2[1], () => limb(out, r, [main.pts[i2 - 2], add(main.pts[i2], [80, 30]), add(main.pts[i2], [170, 48]), add(main.pts[i2], [240, 40])], { w0: 13, w1: 5, pc: "--bark-verde", cap: "taper", inkFrom: 0.12 }));
  // Twigs leave every limb on alternate sides, the outer ones in flower.
  [[main, gm], [up, g1], [down, g2]].forEach(([res, g]) => {
    const limbRes = res as ReturnType<typeof limb>;
    for (let i = 4; i <= limbRes.n; i += 5) {
      const p = limbRes.pts[i];
      const side = (i / 5) % 2 ? 1 : -1;
      const a = angleOf(limbRes.pts, i) + side * rad(48 + r() * 18);
      const L = 60 + r() * 50;
      part(out, gate(limbRes, g as number[], i), p, () => verdeTwig(out, r, p, a, L, i > limbRes.n * 0.35));
    }
  });
  // Mistletoe hangs from the main limb and the lower fork.
  [[main, gm, 0.3, 120], [down, g2, 0.55, 90]].forEach(([res, g, t, size]) => {
    const limbRes = res as ReturnType<typeof limb>;
    const i = Math.round(limbRes.n * (t as number));
    const p = add(limbRes.pts[i], [0, limbRes.width(t as number) * 0.3]);
    part(out, Math.max(0.62, gate(limbRes, g as number[], i)), p, () => mistletoe(out, r, p, size as number));
  });
}

// ---------------------------------------------------------------------------
// Velvet mesquite: a dark, twisting branch reaching in from a side, feathery leaves of many
// tiny leaflets, paired thorns at the nodes, yellow catkins, and hanging bean pods.

// A bipinnate leaf: a short stalk that forks into two feathers of tiny leaflets.
export function mesquiteLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const fork = add(O, polar(L * 0.16, dir));
  let rachis = `M${P1(O)}L${P1(fork)}`;
  const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
  for (const sg of [-1, 1]) {
    const pd = dir + sg * rad(16);
    const end = add(fork, polar(L * 0.84, pd));
    rachis += `M${P1(fork)}L${P1(end)}`;
    for (let j = 1; j <= 11; j++) {
      const p = lerp(fork, end, j / 11.5);
      for (const side of [-1, 1]) blades.push({ O: p, dir: pd + side * rad(62), L: L * 0.085, W: 0.42 });
    }
  }
  bladeBunch(out, blades, tone(r, { spread: 0.06, hue: 10 }));
  out.push(`<path class="ink thin" d="${rachis}"/>`);
}

// A catkin: a slim spike of tiny yellow flowers.
export function catkin(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const half = (s: number) => L * 0.11 * Math.sin(Math.PI * Math.min(1, s) ** 0.7) ** 0.5;
  const pts = [...sample((s) => [s * L, -half(s)] as Pt, 12), ...sample((s) => [s * L, half(s)] as Pt, 12).slice(0, -1).reverse()];
  shape(out, r, pts.map(toW), tone(r, { pc: "--flower-gold", spread: 0.05 }), { deep: 0.5 });
  let stip = "";
  for (let j = 1; j < 12; j++) for (const v of [-0.5, 0.5]) stip += `M${P1(toW([(j / 12) * L, v * half(j / 12)]))}l.5 .5`;
  out.push(`<path class="ink hair" d="${stip}"/>`);
}

// A bean pod: long, narrow, and gently curved, bulging over each seed.
export function mesquitePod(out: Out, r: Rng, top: Pt, L: number, curl: number) {
  const mid = (s: number): Pt => add(top, [Math.sin(s * 2) * curl * L * 0.2, s * L]);
  const half = (s: number) => L * 0.045 * (1 + 0.25 * Math.abs(Math.sin(s * Math.PI * 7))) * Math.min(1, s * 8, (1 - s) * 6 + 0.2);
  const pts = [...sample((s) => add(mid(s), [-half(s), 0]), 30), ...sample((s) => add(mid(s), [half(s), 0]), 30).slice(0, -1).reverse()];
  shape(out, r, pts, tone(r, { pc: "--pod", spread: 0.05, hue: 8 }), { deep: 0.5, deepAbout: mid(0.5) });
}

export function mesquite(out: Out, r: Rng, base: Pt) {
  const gm = [0, 0.58];
  const main = grow(out, gm[0], gm[1], () => limb(out, r, [add(base, [-24, 4]), add(base, [150, -70]), add(base, [260, -40]), add(base, [420, -110]), add(base, [540, -90]), add(base, [640, -150])], { w0: 32, w1: 8, pc: "--bark-mesquite", cap: "taper", lenticels: false }));
  const i1 = Math.round(main.n * 0.5);
  const g1 = [gate(main, gm, i1), gate(main, gm, i1) + 0.26];
  const fork = grow(out, g1[0], g1[1], () => limb(out, r, [main.pts[i1 - 2], add(main.pts[i1], [40, -100]), add(main.pts[i1], [120, -150]), add(main.pts[i1], [150, -240])], { w0: 15, w1: 5, pc: "--bark-mesquite", cap: "taper", inkFrom: 0.12 }));
  [[main, gm], [fork, g1]].forEach(([res, g]) => {
    const limbRes = res as ReturnType<typeof limb>;
    let thorns = "";
    for (let i = 5; i <= limbRes.n - 2; i += 6) {
      const p = limbRes.pts[i];
      const a = angleOf(limbRes.pts, i);
      for (const sg of [-1, 1]) thorns += `M${P1(p)}L${P1(add(p, polar(limbRes.width(i / limbRes.n) * 0.5 + 9, a + sg * rad(70))))}`;
      const side = (i / 6) % 2 ? 1 : -1;
      part(out, gate(limbRes, g as number[], i), p, () => mesquiteLeaf(out, r, p, a + side * rad(55 + r() * 25), 120 + r() * 40));
    }
    part(out, gate(limbRes, g as number[], limbRes.n), limbRes.pts[limbRes.n], () => out.push(`<path class="ink thin" d="${thorns}"/>`));
  });
  // Catkins at the outer nodes, pods hanging from the main limb.
  for (const t of [0.62, 0.8, 0.95]) {
    const i = Math.round(main.n * t);
    const p = main.pts[i];
    part(out, 0.7 + t * 0.06, p, () => catkin(out, r, p, angleOf(main.pts, i) - rad(70), 54));
  }
  for (const [t, L, c] of [[0.36, 150, 1], [0.44, 130, -1], [0.7, 160, 0.6]]) {
    const i = Math.round(main.n * t);
    const p = add(main.pts[i], [0, main.width(t) * 0.35]);
    part(out, 0.82 + t * 0.05, p, () => mesquitePod(out, r, p, L, c));
  }
}

// ---------------------------------------------------------------------------
// Sonoran ibervillea: a gourd vine trailing in along the ground from a side, deeply lobed leaves,
// coiled tendrils, and round red fruit.
export function ibervilleaLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  palmate(out, r, O, dir, L, { lobes: [[0, 1], [rad(-58), 0.8], [rad(58), 0.8]], sigma: 0.38, power: 2, core: 0.32, v: tone(r, { spread: 0.07, hue: 12 }) });
}

export function ibervilleaFruit(out: Out, r: Rng, c: Pt, R: number) {
  shape(out, r, roundPts(c, R, R * 0.94, 0, 16), tone(r, { pc: "--fruit-ibervillea", spread: 0.05 }), { deep: 0.5, deepAbout: add(c, [R * 0.25, R * 0.2]) });
  out.push(`<path class="ink hair" d="M${P1(add(c, [-R * 0.3, -R * 0.85]))}Q${P1(add(c, [-R * 0.55, 0]))} ${P1(add(c, [-R * 0.3, R * 0.85]))}M${P1(add(c, [R * 0.3, -R * 0.85]))}Q${P1(add(c, [R * 0.55, 0]))} ${P1(add(c, [R * 0.3, R * 0.85]))}"/><path class="wash shine" d="${closed(roundPts(add(c, [-R * 0.35, -R * 0.35]), R * 0.2, R * 0.14, -0.6, 8))}"/>`);
}

export function ibervillea(out: Out, r: Rng, base: Pt) {
  const wander = wobble(r, 16, [1.3, 2.6]);
  const at = (t: number) => add(base, [t * 640, -20 - Math.abs(wander(t)) - Math.sin(t * Math.PI) * 40]);
  const gv = [0.04, 0.62];
  const vine = grow(out, gv[0], gv[1], () => stalk(out, at, 6, 3, tone(r, { dl: -0.08, spread: 0.03 }), 40));
  for (let i = 4, k = 0; i <= 38; i += 5, k++) {
    const p = vine.pts[i];
    const a = angleOf(vine.pts, i) + rad(k % 2 ? -70 : -110);
    part(out, gate(vine, gv, i), p, () => {
      out.push(`<path class="ink thin" d="${tendril(p, angleOf(vine.pts, i) + rad(k % 2 ? 40 : -150), 30)}"/>`);
      ibervilleaLeaf(out, r, p, a, 78 + r() * 22);
    });
  }
  [10, 21, 33].forEach((i, k) => {
    const p = vine.pts[i];
    const c = add(p, [6, 16]);
    part(out, 0.76 + k * 0.04, p, () => {
      out.push(`<path class="ink thin" d="M${P1(p)}Q${P1(add(p, [8, 4]))} ${P1(add(c, [0, -12]))}"/>`);
      ibervilleaFruit(out, r, c, 14);
    });
  });
}

