// The Afroalpine garden: the Teleki Valley on Mount Kenya, about 4,000 metres up, where giant
// rosettes stand over silver shrubs and tussocks under an open sky. Nothing hangs from the top:
// the beard lichen is draped over the tree heath, and the groundsel's spent panicles hang from its
// rosettes, each drawn with its host. Drawn with the same kit as the other gardens.

import { rad, P1, add, sub, mul, norm, rot, polar, lerp, wobble, closed, line, sample, vars, tone, shape, stalk, quad, grow, part } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";
import { limb, spineThrough, angleOf } from "./woody.ts";
import { along, share, roundPts, bladeBunch } from "./mediterranean.ts";

// The share of `res`'s length at its point i, as the gate its growth reaches it at.
const gate = (res: { pts: Pt[] }, g: number[], i: number) => along(g[0], g[1], share(res, i));

// ---------------------------------------------------------------------------
// Giant groundsel: a trunk that forks once after each flowering into a candelabra, every tip a
// metre-wide rosette. The dead leaves never fall: they fold down into a dry skirt that clothes
// the stems, and on old trunks the skirt falls away from the foot to bare ridged cork, crusted
// with orange lichen. A spent panicle hangs from one rosette.

// A stem clothed in its own dead leaves, folded down into a thatch: each tier's tips hang over
// the tier below, and the hem is ragged with leaf tips. The hem reaches down to the spine's
// first point, so the whole skirt grows inside its shoot. A branch's hem hangs over the stem it
// leaves, so the fork reads as one thatch.
export function skirt(out: Out, r: Rng, ctrl: Pt[], { w0, w1, hem = 24 }: { w0: number; w1: number; hem?: number }) {
  const pts = spineThrough(ctrl);
  const n = pts.length - 1;
  // The top narrows into the crown it carries.
  const width = (t: number) => (w0 + (w1 - w0) * t) * (t > 0.86 ? 1 - ((t - 0.86) / 0.14) * 0.3 : 1);
  const L: Pt[] = [];
  const R: Pt[] = [];
  pts.forEach((p, i) => {
    const a = angleOf(pts, i);
    const w = width(i / n) / 2;
    L.push(add(p, polar(w, a - Math.PI / 2)));
    R.push(add(p, polar(w, a + Math.PI / 2)));
  });
  let s = 0;
  let h0 = 0;
  while (h0 < n - 2 && s < hem) s += Math.hypot(pts[h0 + 1][0] - pts[h0][0], pts[h0 + 1][1] - pts[h0][1]), h0++;
  // The hem: leaf tips hanging from the lowest tier down to the spine's first point.
  const down = norm(sub(pts[0], pts[h0]));
  const tips: Pt[] = [];
  const count = 7;
  for (let k = 0; k <= count * 2; k++) {
    const u = k / (count * 2);
    const p = lerp(R[h0], L[h0], u);
    tips.push(k % 2 ? add(add(p, mul(down, s * (0.55 + r() * 0.45))), [(r() - 0.5) * 6, 0]) : add(p, mul(down, s * 0.1)));
  }
  const body = [...L.slice(h0), ...[...R.slice(h0)].reverse(), ...tips.slice(1, -1)];
  const v = tone(r, { pc: "--skirt", spread: 0.03, hue: 6 });
  out.push(`<path class="wash bark"${vars(v)} d="${closed(body)}"/>`);
  const shade = [...pts.slice(h0).map((p, i) => lerp(p, R[h0 + i], 0.2)), ...[...R.slice(h0)].reverse()];
  out.push(`<path class="wash bark-shade"${vars(v)} d="${closed(shade)}"/>`);
  const lit = [...L.slice(h0).map((p, i) => lerp(p, pts[h0 + i], 0.1)), ...[...L.slice(h0)].reverse().map((p, i) => lerp(p, pts[n - i], 0.38))];
  out.push(`<path class="wash bark-lit"${vars(v)} d="${closed(lit)}"/>`);
  // The thatch: each dead leaf a narrow tip pointing back down the stem, set round the column so
  // the tiers crowd toward its edges as they turn away.
  let thatch = "";
  const step = 20;
  let row = 0;
  for (let at = s + step * 0.6, i = h0; i < n - 1; row++) {
    while (i < n - 1 && arc(pts, i) < at) i++;
    const a = angleOf(pts, i) + Math.PI;
    const across = 6;
    for (let k = 0; k <= across; k++) {
      const turn = ((k + (row % 2 ? 0.5 : 0)) / across) * 2 - 1;
      if (Math.abs(turn) > 0.96) continue;
      const sn = Math.sin(turn * Math.PI * 0.45);
      const p = lerp(lerp(L[i], R[i], 0.5), sn < 0 ? L[i] : R[i], Math.abs(sn) * 0.94);
      const len = 26 + r() * 12;
      const half = 5.5 * Math.cos(turn * Math.PI * 0.45) + 1;
      const dir = a + (r() - 0.5) * 0.18;
      const tip = add(p, polar(len, dir));
      const side = polar(half, dir + Math.PI / 2);
      thatch += `M${P1(add(p, side))}Q${P1(add(lerp(p, tip, 0.7), mul(side, 0.8)))} ${P1(tip)}Q${P1(add(lerp(p, tip, 0.7), mul(side, -0.8)))} ${P1(sub(p, side))}`;
    }
    at += step;
  }
  out.push(`<path class="ink hair bark-tex" d="${thatch}"/>`);
  out.push(`<path class="ink hair" d="${line([...tips].reverse())}"/>`);
  out.push(`<path class="ink thin" d="${line(L.slice(h0))}"/><path class="ink thick" d="${line(R.slice(h0))}"/>`);
  return { pts, L, R, width, n };
}

// Distance along a polyline up to its point i.
function arc(pts: Pt[], i: number) {
  let s = 0;
  for (let k = 1; k <= i; k++) s += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
  return s;
}

// The bare foot of an old trunk: thick cork in deep vertical ridges, flared at the ground, with
// colonies of orange lichen and pale grey crusts on the lit side.
export function corkTrunk(out: Out, r: Rng, ctrl: Pt[], w0: number, w1: number) {
  const res = limb(out, r, ctrl, { w0, w1, pc: "--bark-cork", cap: "blunt" });
  const { L, R, n } = res;
  let ridges = "";
  for (let k = 0; k < 8; k++) {
    const turn = (k / 7) * 2 - 1;
    const sn = Math.sin(turn * Math.PI * 0.42);
    const sway = wobble(r, 0.05, [2, 5]);
    const ridge = sample((t) => {
      const i = Math.round(t * (n - 2));
      const u = Math.max(-0.97, Math.min(0.97, sn + sway(t)));
      return lerp(lerp(L[i], R[i], 0.5), u < 0 ? L[i] : R[i], Math.abs(u));
    }, 14);
    ridges += line(ridge);
  }
  out.push(`<path class="ink hair" d="${ridges}"/>`);
  // Each colony a cluster of small lobed crusts.
  const crusts = (count: number, size: number) => {
    let d = "";
    for (let c = 0; c < count; c++) {
      const i = 3 + Math.floor(r() * (n - 8));
      const at = lerp(L[i], R[i], 0.14 + r() * 0.36);
      for (let k = 0; k < 4; k++) {
        const ctr = add(at, [(r() - 0.5) * size * 3, (r() - 0.5) * size * 4]);
        const rr = size * (0.5 + r() * 0.6);
        const wob = wobble(r, 0.22, [3, 5]);
        d += closed(sample((t) => add(ctr, polar(rr * (1 + wob(t)), t * Math.PI * 2)), 9).slice(0, -1));
      }
    }
    return d;
  };
  const grey = crusts(2, 4.4);
  const orange = crusts(4, 3.8);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--skirt", dl: 0.12, spread: 0.04 }))} d="${grey}"/><path class="ink hair" d="${grey}"/>`);
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--lichen-orange", spread: 0.06, hue: 10 }))} d="${orange}"/><path class="ink hair" d="${orange}"/>`);
  return res;
}

// The rosettes are seen from the side and a little above, so a spread leaf shows some face.
const VIEW = rad(12);
// A point in a rosette's space (x right, y up, z toward the viewer) placed on the page about the
// crown C, and how near the viewer it lies.
const onPage = (C: Pt, p: number[]): Pt => [C[0] + p[0], C[1] - (p[1] * Math.cos(VIEW) - p[2] * Math.sin(VIEW))];
const nearness = (p: number[]) => p[2] * Math.cos(VIEW) + p[1] * Math.sin(VIEW);

// One leaf of a giant rosette, in space: it leaves the crown at azimuth `az` and elevation `el`,
// its midrib bending up by `curl` toward the tip. Oblanceolate: it clasps the crown narrowly,
// widens past the middle, and tapers to a point. A leaf seen edge-on keeps some width, as a
// cupped blade does.
function leafInSpace(C: Pt, az: number, el: number, L: number, W: number, curl: number) {
  const N = 10;
  const mid: number[][] = [[0, 0, 0]];
  for (let i = 1; i <= N; i++) {
    const e = el + curl * ((i - 0.5) / N);
    const [x, y, z] = mid[i - 1];
    mid.push([x + (L / N) * Math.cos(e) * Math.cos(az), y + (L / N) * Math.sin(e), z + (L / N) * Math.cos(e) * Math.sin(az)]);
  }
  const page = mid.map((p) => onPage(C, p));
  const face = Math.max(0.4, Math.hypot(Math.sin(az), Math.cos(az) * Math.sin(VIEW)));
  const half = (s: number) => ((W * L) / 2) * face * Math.max(0.16 * (1 - s), (s ** 0.9 * (1 - s) ** 0.6) / 0.364);
  const A: Pt[] = [];
  const B: Pt[] = [];
  page.forEach((p, i) => {
    const t = norm(sub(page[Math.min(N, i + 1)], page[Math.max(0, i - 1)]));
    const h = half(i / N);
    A.push(add(p, mul([-t[1], t[0]], h)));
    B.push(add(p, mul([t[1], -t[0]], h)));
  });
  return { outline: [...A, ...[...B].reverse()], rib: page, A, B, near: nearness(mid[N >> 1]) };
}

// How a rosette holds its leaves, oldest to youngest: the shares of dying and young leaves, and
// for each kind its elevation, length (a share of the rosette's reach), width, and curl. A
// rosette with an `under` token shows that underside wherever a leaf turns its back to the
// viewer.
type Range = [number, number];
type Habit = {
  dying: number;
  young: number;
  el: { dying: Range; spread: Range; young: Range };
  len: { dying: number; spread: Range; young: Range };
  W: { dying: number; spread: number; young: number };
  curl: { dying: number; spread: Range; young: number };
  shine: boolean;
  under?: string;
};
const at = ([a, b]: Range, t: number) => a + (b - a) * t;

// The giant groundsel's: spread leaves raised into a bowl, the young ones in a tall cone.
export const GIANT: Habit = {
  dying: 0.1,
  young: 0.4,
  el: { dying: [-1, -0.8], spread: [0.25, 0.95], young: [1, 1.5] },
  len: { dying: 0.46, spread: [1, 0.82], young: [0.76, 0.44] },
  W: { dying: 0.16, spread: 0.24, young: 0.2 },
  curl: { dying: -0.1, spread: [0.24, 0.38], young: 0.04 },
  shine: true,
};

// A rosette of `count` leaves set round the crown at the golden angle, oldest outermost: the
// oldest bend down, browning; the spread leaves lie level with their tips turned up; the young
// ones stand in a yellowish cone at the heart. Leaves are drawn far to near, and each unfolds
// from the crown in order of age from g.
export function rosette(out: Out, r: Rng, C: Pt, R: number, g: number, count = 40, h: Habit = GIANT) {
  const leaves = Array.from({ length: count }, (_, k) => {
    const t = k / (count - 1);
    const az = k * rad(137.5) + (r() - 0.5) * 0.2;
    const kind = t < h.dying ? "dying" : t > 1 - h.young ? "young" : "spread";
    const u = kind === "dying" ? t / h.dying : kind === "young" ? (t - (1 - h.young)) / h.young : (t - h.dying) / (1 - h.dying - h.young);
    const el = at(h.el[kind], u);
    const L = R * (kind === "dying" ? h.len.dying : at(h.len[kind], u)) * (0.92 + r() * 0.16);
    const curl = kind === "spread" ? at(h.curl.spread, r()) : h.curl[kind];
    const leaf = leafInSpace(C, az, el, L, h.W[kind], curl);
    const depth = leaf.near / R;
    // The upper face looks away from the viewer when a near leaf rises toward them.
    const e = el + curl / 2;
    const back = h.under && kind !== "dying" && Math.cos(e) * Math.sin(VIEW) - Math.sin(e) * Math.sin(az) * Math.cos(VIEW) < 0;
    const v =
      kind === "dying" ? tone(r, { pc: "--skirt", dl: -0.04, dc: 1.3, spread: 0.04 })
      : back ? tone(r, { pc: h.under, spread: 0.03, hue: 6 })
      : kind === "young" ? tone(r, { dl: 0.09, dh: -16, spread: 0.04 })
      : tone(r, { dl: -0.03 + depth * 0.07, spread: 0.05, hue: 10 });
    return { k, leaf, v, shine: h.shine && !back && kind !== "dying" && depth > 0 && el < 0.7 };
  });
  leaves.sort((a, b) => a.leaf.near - b.leaf.near);
  for (const { k, leaf, v, shine } of leaves)
    part(out, g + k * 0.004, C, () => {
      shape(out, r, leaf.outline, v, { deep: 0.55, deepAbout: leaf.rib[3] });
      const rib = leaf.rib.slice(1, -1);
      if (shine) out.push(`<path class="wash shine" d="${closed([...rib.slice(2, 7).map((p, i) => add(p, [0, -2 - Math.sin((i / 4) * Math.PI) * 3])), ...rib.slice(2, 7).reverse()])}"/>`);
      out.push(`<path class="ink hair vein" d="${line(rib)}"/>`);
    });
}

// A spent panicle, a year after flowering: the dry stalk rises from the rosette, arches over its
// rim, and hangs down beside the skirt; its side branches droop and fork, holding nodding brown
// heads, some still tufted with pappus.
export function spentPanicle(out: Out, r: Rng, C: Pt, side: number, L: number) {
  const top = add(C, [side * L * 0.1, -L * 0.3]);
  const over = add(C, [side * L * 0.34, -L * 0.2]);
  const end = add(C, [side * L * 0.44, L * 0.6]);
  const spine = [...sample(quad(C, add(C, [0, -L * 0.2]), top), 8), ...sample(quad(top, add(top, [side * L * 0.16, -L * 0.06]), over), 8).slice(1), ...sample(quad(over, add(over, [side * L * 0.1, L * 0.24]), end), 16).slice(1)];
  const last = spine.length - 1;
  const v = tone(r, { pc: "--skirt", dl: -0.16, spread: 0.03 });
  stalk(out, (t) => spine[Math.round(t * last)], 8, 3.5, v, last);
  let twigs = "";
  let heads = "";
  let fluff = "";
  const head = (p: Pt) => {
    const c = add(p, [0, 4]);
    heads += closed(roundPts(c, 4, 5, 0, 8));
    if (r() < 0.4) fluff += closed(roundPts(add(c, [0, -5]), 5.5, 4, 0, 9));
  };
  for (let i = 12; i < last - 1; i += 3) {
    const p = spine[i];
    const out_ = side * (i % 2 ? 1 : -0.6);
    const len = 26 + r() * 30;
    const tip = add(p, [out_ * len * 0.8, len * 0.7]);
    const bend = add(lerp(p, tip, 0.5), [out_ * len * 0.25, -len * 0.18]);
    twigs += `M${P1(p)}Q${P1(bend)} ${P1(tip)}`;
    for (const d of [-0.5, 0.15, 0.7]) {
      const q = add(tip, polar(10 + r() * 8, Math.PI / 2 + d * side));
      twigs += `M${P1(tip)}L${P1(q)}`;
      head(q);
    }
  }
  head(spine[last]);
  out.push(`<path class="ink thin" d="${twigs}"/>`);
  out.push(`<path class="wash"${vars({ pc: "--petal", dl: -0.04 })} d="${fluff}"/><path class="ink hair" d="${fluff}"/>`);
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--skirt", dl: -0.22, spread: 0.04 }))} d="${heads}"/><path class="ink hair" d="${heads}"/>`);
}

export function groundsel(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  grow(out, 0.02, 0.16, () => corkTrunk(out, r, [at([0, 4]), at([-3, -90]), at([2, -190])], 94, 74));
  const gt = [0.15, 0.36];
  const trunk = grow(out, gt[0], gt[1], () => skirt(out, r, [at([2, -150]), at([4, -280]), at([0, -392])], { w0: 108, w1: 98 }));
  const gf = gate(trunk, gt, trunk.n - 3);
  // A branch over the stem it leaves, a rosette on its tip.
  const crown = (ctrl: Pt[], w: [number, number], gb: number[], R: number, count: number) => {
    const res = grow(out, gb[0], gb[1], () => skirt(out, r, ctrl.map(at), { w0: w[0], w1: w[1], hem: 16 }));
    const C = add(res.pts[res.n], [0, -10]);
    rosette(out, r, C, R, gb[1], count);
    return C;
  };
  // The right stem forked again; the left branch, drawn last, stands in front.
  const gs = [gf, gf + 0.12];
  const stem = grow(out, gs[0], gs[1], () => skirt(out, r, [at([10, -360]), at([34, -440]), at([50, -520]), at([54, -570])], { w0: 84, w1: 78, hem: 16 }));
  const gk = gate(stem, gs, stem.n - 3);
  crown([[46, -540], [42, -660], [32, -780], [26, -860]], [74, 66], [gk, gk + 0.18], 146, 66);
  const C = crown([[62, -540], [100, -580], [138, -630], [152, -686]], [68, 60], [gk + 0.01, gk + 0.15], 124, 56);
  part(out, 0.84, C, () => spentPanicle(out, r, C, 1, 320));
  crown([[-6, -360], [-40, -440], [-84, -530], [-108, -620], [-114, -690]], [78, 66], [gf, gf + 0.2], 136, 62);
}

// ---------------------------------------------------------------------------
// Teleki's lobelia: one rosette of narrow blue-green leaves under a column of long hairy bracts
// that hang down and outward and hide the blue-purple flowers, so the spike reads as a shaggy
// grey-green pillar tapering to a blunt tip.

export const NARROW: Habit = {
  dying: 0.12,
  young: 0.3,
  el: { dying: [-0.9, -0.6], spread: [0.1, 0.7], young: [0.9, 1.3] },
  len: { dying: 0.6, spread: [1, 0.8], young: [0.6, 0.4] },
  W: { dying: 0.16, spread: 0.21, young: 0.18 },
  curl: { dying: -0.1, spread: [0.2, 0.4], young: 0.05 },
  shine: false,
};

// One bract on the column at P: long and narrow, hanging, fringed with silver hairs that fall
// from its edges.
export function hairyBract(out: Out, r: Rng, P: Pt, az: number, el: number, L: number) {
  const leaf = leafInSpace(P, az, el, L, 0.24, -0.2 - r() * 0.3);
  shape(out, r, leaf.outline, tone(r, { dl: 0.05 + (leaf.near / L) * 0.06, dc: 0.75, spread: 0.05, hue: 8 }), { deep: 0 });
  let hair = "";
  leaf.rib.forEach((c, i) => {
    if (i < 3) return;
    for (const e of [leaf.A[i], leaf.B[i]]) {
      const d = norm(add(norm(sub(e, c)), [0, 0.9]));
      hair += `M${P1(e)}L${P1(add(e, mul(d, 7 + r() * 9)))}`;
    }
  });
  out.push(`<path class="ink wool" d="${hair}"/>`);
}

// A lobelia flower: a curved tube splitting into lips, pointing out from the spike.
export function lobeliaFlower(out: Out, r: Rng, P: Pt, dir: number, s: number) {
  const pts = sample((t) => {
    const a = t * Math.PI * 2;
    return add(P, rot([s * (0.5 + 0.5 * Math.cos(a)), s * 0.2 * Math.sin(a) * (0.5 + 0.7 * (0.5 + 0.5 * Math.cos(a)))], dir));
  }, 12).slice(0, -1);
  shape(out, r, pts, tone(r, { pc: "--flower-lobelia", spread: 0.06, hue: 12 }), { deep: 0 });
  out.push(`<path class="ink hair" d="M${P1(add(P, rot([s * 0.75, 0], dir)))}L${P1(add(P, rot([s * 1.05, s * 0.12], dir)))}"/>`);
}

export function telekii(out: Out, r: Rng, base: Pt) {
  const C = add(base, [0, -20]);
  rosette(out, r, C, 112, 0.04, 46, NARROW);
  const H = 470;
  const n = 40;
  const sway = wobble(r, 5, [0.6, 1.2]);
  const spine = sample((t) => add(C, [sway(t), -t * H]), n);
  const ga = [0.3, 0.72];
  // The column's body, a soft wash behind the bracts so it reads as one shaggy mass.
  const reach = (t: number) => 50 * (1 - t * 0.45) * Math.min(1, (1 - t) * 9 + 0.25);
  const axis = grow(out, ga[0], ga[1], () => {
    const body = [...spine.map((p, i) => add(p, [-reach(i / n), 0])), ...[...spine].reverse().map((p, i) => add(p, [reach(1 - i / n), 0]))].slice(2, -2);
    shape(out, r, body, tone(r, { dl: -0.06, dc: 0.7, spread: 0.03 }), { deep: 0.5, ink: false });
    return stalk(out, (t) => spine[Math.round(t * n)], 20, 10, tone(r, { dl: -0.06, spread: 0.03 }), n);
  });
  // Bracts and flowers round the column, drawn far to near; each opens as the column reaches it.
  const items: { near: number; i: number; draw: () => void }[] = [];
  const count = 170;
  for (let k = 0; k < count; k++) {
    const t = Math.min(1, 0.08 + ((k + 0.5) / count) * 0.92 + (r() - 0.5) * 0.02);
    const i = Math.round(t * n);
    const P = spine[i];
    const az = k * rad(137.5) + (r() - 0.5) * 0.6;
    const tip = t > 0.95;
    const el = tip ? 0.4 + (t - 0.95) * 12 : -1.1 + t * 0.3 + (r() - 0.5) * 0.4;
    const L = H * (tip ? 0.07 : 0.24 - t * 0.13) * (0.75 + r() * 0.5);
    items.push({ near: Math.cos(el) * Math.sin(az), i, draw: () => hairyBract(out, r, P, az, el, L) });
  }
  for (let k = 0; k < 30; k++) {
    const t = 0.1 + (k / 29) * 0.8;
    const i = Math.round(t * n);
    const az = r() * Math.PI * 2;
    const P = add(spine[i], [Math.cos(az) * 10, 4]);
    items.push({ near: Math.sin(az) * 0.6, i, draw: () => lobeliaFlower(out, r, P, Math.atan2(0.4, Math.cos(az)), 15) });
  }
  items.sort((a, b) => a.near - b.near);
  for (const it of items) part(out, gate(axis, ga, it.i), spine[it.i], it.draw);
}

// ---------------------------------------------------------------------------
// Cabbage groundsel: rosettes at ground level on a creeping stem hidden beneath them, broad
// leaves felted creamy white beneath, so every leaf that rises toward the viewer turns pale; one
// rosette holds up a narrow cone of nodding yellow-rayed heads.

export const CABBAGE: Habit = {
  dying: 0.14,
  young: 0.34,
  el: { dying: [-0.9, -0.55], spread: [-0.05, 0.4], young: [0.7, 1.15] },
  len: { dying: 0.55, spread: [1, 0.78], young: [0.62, 0.4] },
  W: { dying: 0.22, spread: 0.32, young: 0.26 },
  curl: { dying: -0.1, spread: [0.3, 0.5], young: 0.06 },
  shine: true,
  under: "--felt",
};

// A nodding head: a green cup, a brown disc facing down, and yellow rays drooping round it.
export function noddingHead(out: Out, r: Rng, c: Pt, s: number, lean: number) {
  const toW = (p: Pt) => add(c, rot(p, lean));
  let rays = "";
  for (let k = 0; k < 11; k++) {
    const a = rad(14 + (152 * k) / 10);
    const mid = add([0, s * 0.12], polar(s * 0.5, a));
    rays += closed(sample((t) => add(mid, rot([Math.cos(t * Math.PI * 2) * s * 0.36, Math.sin(t * Math.PI * 2) * s * 0.08], a)), 10).slice(0, -1).map(toW));
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-gold", spread: 0.05, hue: 8 }))} d="${rays}"/><path class="ink hair" d="${rays}"/>`);
  shape(out, r, roundPts([0, s * 0.1], s * 0.3, s * 0.16, 0, 10).map(toW), tone(r, { pc: "--flower-gold", dl: -0.28, dc: 0.8, spread: 0.04 }), { deep: 0 });
  shape(out, r, [[-s * 0.26, s * 0.02], [-s * 0.14, -s * 0.2], [s * 0.14, -s * 0.2], [s * 0.26, s * 0.02]].map(toW), tone(r, { dl: -0.04, spread: 0.04 }), { deep: 0 });
}

export function cabbage(out: Out, r: Rng, base: Pt) {
  rosette(out, r, add(base, [-136, -26]), 104, 0.06, 44, CABBAGE);
  rosette(out, r, add(base, [196, -30]), 92, 0.12, 40, CABBAGE);
  const C = add(base, [36, -20]);
  rosette(out, r, C, 124, 0.02, 52, CABBAGE);
  // The flowering cone rises from the heart of the middle rosette. Its heads are set round it in
  // space at uneven heights, nodding outward; the far ones are drawn before the axis, behind it.
  const H = 250;
  const n = 30;
  const foot = add(C, [0, -40]);
  const spine = sample((t) => add(foot, [Math.sin(t * 2) * 4, -t * H]), n);
  const gs = [0.36, 0.7];
  const heads = Array.from({ length: 17 }, (_, k) => {
    const t = Math.min(1, 0.1 + (k / 16) * 0.88 + (r() - 0.5) * 0.04);
    const i = Math.round(t * n);
    const az = k * rad(137.5) + (r() - 0.5) * 0.5;
    const reach = (1 - t) * 30 + 6;
    const p = spine[i];
    const end = add(p, [Math.cos(az) * reach, 6 - reach * 0.2]);
    return { i, az, p, end, near: Math.sin(az), s: 12 + (1 - t) * 4 + r() * 2 };
  });
  const draw = (h: (typeof heads)[number]) =>
    part(out, along(gs[0], gs[1], h.i / n) + 0.04, h.p, () => {
      out.push(`<path class="ink thin" d="M${P1(h.p)}Q${P1(add(lerp(h.p, h.end, 0.6), [0, -6]))} ${P1(h.end)}"/>`);
      noddingHead(out, r, add(h.end, [0, 6]), h.s, Math.cos(h.az) * rad(24));
    });
  heads.filter((h) => h.near < 0).forEach(draw);
  grow(out, gs[0], gs[1], () => stalk(out, (t) => spine[Math.round(t * n)], 12, 5, tone(r, { dl: -0.04, spread: 0.03 }), n));
  heads.filter((h) => h.near >= 0).forEach(draw);
}

// ---------------------------------------------------------------------------
// Tree heath, hung with beard lichen: a red-brown branch reaching in from a side, ascending
// plumes of needle leaves in whorls, white bells crowding short side shoots, and pale strands of
// Usnea draped over the limbs.

// A plume: a twig clothed in whorls of four needle leaves, tapering to its tip; white bells
// crowd short side shoots below the tip.
export function plume(out: Out, r: Rng, O: Pt, dir: number, L: number, bells: boolean) {
  const end = add(O, polar(L, dir));
  const N = 22;
  const twig = sample(quad(O, add(lerp(O, end, 0.5), polar(L * 0.08, dir - Math.PI / 2)), end), N);
  const len = (s: number) => 12 * (1 - s * 0.6);
  // The plume's body: a soft dark mass the needles stand out from.
  const side = (sg: number) => twig.map((p, i) => add(p, mul(norm([-(twig[Math.min(N, i + 1)][1] - twig[Math.max(0, i - 1)][1]), twig[Math.min(N, i + 1)][0] - twig[Math.max(0, i - 1)][0]]), sg * len(i / N) * 0.62)));
  shape(out, r, [...side(1), add(end, polar(6, dir)), ...side(-1).reverse()], tone(r, { dl: -0.1, spread: 0.04 }), { deep: 0, ink: false });
  let green = "";
  let ink = "";
  twig.forEach((p, i) => {
    if (i < 1) return;
    const s = i / N;
    const d = norm(sub(twig[Math.min(N, i + 1)], twig[i - 1]));
    const nrm: Pt = [-d[1], d[0]];
    for (let k = 0; k < 6; k++) {
      const az = (k / 6) * Math.PI * 2 + i * 0.7 + (r() - 0.5) * 0.4;
      const q = add(p, add(mul(d, len(s) * (0.35 + 0.35 * Math.abs(Math.sin(az)))), mul(nrm, len(s) * 0.85 * Math.cos(az))));
      const seg = `M${P1(p)}L${P1(q)}`;
      if (Math.sin(az) > 0.75) ink += seg;
      else green += seg;
    }
  });
  out.push(`<path class="wash needles"${vars(tone(r, { spread: 0.06, hue: 10 }))} d="${green}"/><path class="ink hair" d="${ink}"/>`);
  if (!bells) return;
  let b = "";
  for (const s of [0.4, 0.62]) {
    const c = add(twig[Math.round(s * N)], polar(8, dir + (s > 0.5 ? 1 : -1) * rad(80)));
    for (let k = 0; k < 6; k++) b += closed(roundPts(add(c, [(r() - 0.5) * 12, (r() - 0.3) * 10]), 3.2, 3.6, 0, 8));
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--petal", dl: -0.03, spread: 0.03 }))} d="${b}"/><path class="ink hair" d="${b}"/>`);
}

// Beard lichen draped over a limb at P: pale strands hanging from it, swelling into sausage-like
// segments between constrictions, with fine side branches. Some first arch over the limb.
export function usnea(out: Out, r: Rng, P: Pt, size: number) {
  let fill = "";
  let edge = "";
  let fibrils = "";
  for (let k = 0; k < 9; k++) {
    const len = size * (0.4 + r() * 0.6);
    const x0 = (r() - 0.5) * 18;
    const over = r() < 0.4;
    const sway = wobble(r, 5, [0.8, 1.7]);
    const n = Math.max(10, Math.round(len / 6));
    const pts = sample((t) => add(P, [x0 + sway(t) + (over ? Math.sin(t * Math.PI) * 4 : 0), (over ? -6 * Math.sin(Math.min(1, t * 6) * Math.PI) : 0) + t * len]), n);
    const L: Pt[] = [];
    const R: Pt[] = [];
    pts.forEach((p, i) => {
      const d = norm(sub(pts[Math.min(n, i + 1)], pts[Math.max(0, i - 1)]));
      const w = (1.5 + 1.4 * Math.abs(Math.sin((i * 6) / 7))) * (1 - (i / n) * 0.5);
      L.push(add(p, mul([-d[1], d[0]], w)));
      R.push(add(p, mul([d[1], -d[0]], w)));
      if (i > 2 && i % 3 === 0) fibrils += `M${P1(p)}l${(r() - 0.5) * 9} ${4 + r() * 4}`;
    });
    fill += closed([...L, ...[...R].reverse()]);
    edge += line(R);
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--usnea", spread: 0.04, hue: 8 }))} d="${fill}"/><path class="ink wool" d="${fibrils}"/><path class="ink hair" d="${edge}"/>`);
}

export function heath(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0, 0.5];
  const main = grow(out, gm[0], gm[1], () => limb(out, r, [at([-24, 6]), at([120, -46]), at([250, -40]), at([380, -92]), at([520, -120])], { w0: 34, w1: 8, pc: "--bark-heath", cap: "taper" }));
  const fork = (t: number, ctrl: Pt[], w0: number, span: number) => {
    const i = Math.round(main.n * t);
    const g = [gate(main, gm, i), gate(main, gm, i) + span];
    const res = grow(out, g[0], g[1], () => limb(out, r, [main.pts[i - 2], ...ctrl.map((p) => add(main.pts[i], p))], { w0, w1: 5, pc: "--bark-heath", cap: "taper", inkFrom: 0.12 }));
    return { res, g };
  };
  const up1 = fork(0.3, [[30, -70], [50, -150], [90, -230]], 16, 0.28);
  const up2 = fork(0.62, [[40, -60], [90, -120], [120, -190]], 13, 0.26);
  const down = fork(0.48, [[70, 30], [150, 50], [220, 40]], 12, 0.26);
  // Plumes rise from every limb, the outer ones in flower.
  for (const { res, g } of [{ res: main, g: gm }, up1, up2, down]) {
    for (let i = 5; i <= res.n; i += 4) {
      const p = res.pts[i];
      const a = angleOf(res.pts, i);
      const dir = Math.min(rad(-30), a - rad(40 + r() * 40));
      // A beat after the limb, so a plume near a fork never opens before the fork reaches it.
      part(out, gate(res, g, i) + 0.03, p, () => plume(out, r, p, dir, 70 + r() * 70, i > res.n * 0.4 && r() < 0.6));
    }
    part(out, gate(res, g, res.n), res.pts[res.n], () => plume(out, r, res.pts[res.n], angleOf(res.pts, res.n) - rad(20), 110, true));
  }
  // Usnea hangs from the main limb and the lower fork.
  for (const [res, g, t, size] of [[main, gm, 0.36, 230], [main, gm, 0.7, 180], [down.res, down.g, 0.5, 200], [up1.res, up1.g, 0.45, 150]] as const) {
    const i = Math.round(res.n * t);
    const p = add(res.pts[i], [0, res.width(t) * 0.3]);
    part(out, Math.max(0.6, gate(res, g, i)), p, () => usnea(out, r, p, size));
  }
}

// ---------------------------------------------------------------------------
// Mount Kenya thistle: a rosette of deeply lobed, spine-tipped leaves cobwebbed with white hair,
// a stout stem with interrupted spiny wings, and dense clusters of mauve heads.

export function thistleLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const W = 0.44;
  const up = Math.cos(dir) >= 0 ? 1 : -1;
  const mid = (s: number): Pt => [s * L, -up * 0.12 * L * s * s];
  const toW = (p: Pt) => add(O, rot(p, dir));
  const prof = (s: number) => Math.sin(Math.PI * Math.min(1, s) ** 0.8) ** 0.7;
  const lobes = 5.5;
  // Pointed lobes with deep sinuses between them: a triangle wave along each margin.
  const tri = (x: number) => 1 - 2 * Math.abs(x - Math.floor(x) - 0.5);
  const half = (s: number, sg: number) => ((W * L) / 2) * prof(s) * (0.2 + 0.8 * tri(s * lobes + (sg > 0 ? 0.3 : 0)) ** 1.3);
  const a = sample((s) => add(mid(s), [0, -half(s, 1)]), 60);
  const b = sample((s) => add(mid(s), [0, half(s, -1)]), 60);
  shape(out, r, [...a, mid(1.02), ...b.slice(0, -1).reverse()].map(toW), tone(r, { spread: 0.06, hue: 10 }), { deep: 0.5, deepAbout: toW(mid(0.3)) });
  // A spine at every lobe tip.
  let spines = "";
  for (const [pts, sg] of [[a, -1], [b, 1]] as const)
    pts.forEach((p, i) => {
      if (i < 3 || i > 57) return;
      const h0 = Math.abs(pts[i - 1][1]);
      const h1 = Math.abs(p[1]);
      const h2 = Math.abs(pts[i + 1][1]);
      if (h1 > h0 && h1 >= h2) spines += `M${P1(toW(p))}L${P1(toW(add(p, [7, sg * 11])))}`;
    });
  let web = "";
  for (let k = 0; k < 3; k++) {
    const s0 = 0.15 + r() * 0.7;
    web += `M${P1(toW(add(mid(s0), [0, -half(s0, 1) * 0.8])))}Q${P1(toW(add(mid(s0 + 0.05), [0, 0])))} ${P1(toW(add(mid(s0 + 0.1), [0, half(s0 + 0.1, -1) * 0.8])))}`;
  }
  out.push(`<path class="ink thin" d="${spines}"/><path class="ink wool" d="${web}"/><path class="ink hair vein" d="${line(sample(mid, 8).slice(1, -1).map(toW))}"/>`);
}

// A thistle head: a spiny green involucre under a brush of mauve florets.
export function thistleHead(out: Out, r: Rng, c: Pt, s: number, lean: number) {
  const toW = (p: Pt) => add(c, rot(p, lean));
  const brush = [[-s * 0.32, -s * 0.2], [-s * 0.5, -s * 0.72], [-s * 0.2, -s * 0.86], [s * 0.2, -s * 0.86], [s * 0.5, -s * 0.72], [s * 0.32, -s * 0.2]] as Pt[];
  shape(out, r, brush.map(toW), tone(r, { pc: "--flower-thistle", spread: 0.06, hue: 12 }), { deep: 0.5 });
  let strands = "";
  for (let k = 0; k < 9; k++) {
    const x = (k / 8 - 0.5) * s * 0.7;
    strands += `M${P1(toW([x * 0.6, -s * 0.24]))}L${P1(toW([x * 1.2, -s * (0.78 + r() * 0.1)]))}`;
  }
  out.push(`<path class="ink hair" d="${strands}"/>`);
  const cup = sample((t) => [Math.cos(t * Math.PI * 2) * s * 0.4, Math.sin(t * Math.PI * 2) * s * 0.34] as Pt, 14).slice(0, -1);
  shape(out, r, cup.map(toW), tone(r, { dl: -0.02, spread: 0.04 }), { deep: 0.55 });
  let spines = "";
  for (let k = 0; k < 9; k++) {
    const a = rad(200 + (140 * k) / 8);
    const p = polar(s * 0.36, a);
    spines += `M${P1(toW(p))}L${P1(toW(add(p, polar(s * 0.22, a - 0.3))))}`;
  }
  for (let k = 0; k < 6; k++) {
    const p: Pt = [(k / 5 - 0.5) * s * 0.6, s * (0.05 + (k % 2) * 0.12)];
    spines += `M${P1(toW(p))}l${P1(rot([s * 0.12, -s * 0.06], lean))}`;
  }
  out.push(`<path class="ink hair" d="${spines}"/>`);
}

// A wing along a stretch of stem: a strip of spiny lobes on one side, `sg` -1 left or 1 right.
function wing(out: Out, r: Rng, spine: Pt[], from: number, to: number, sg: number, w: (i: number) => number) {
  const edge: Pt[] = [];
  const base: Pt[] = [];
  let spines = "";
  for (let i = from; i <= to; i++) {
    const d = norm(sub(spine[Math.min(spine.length - 1, i + 1)], spine[Math.max(0, i - 1)]));
    const nrm: Pt = mul([d[1], -d[0]], sg);
    const half = w(i) / 2;
    base.push(add(spine[i], mul(nrm, half * 0.8)));
    const lobe = (i - from) % 3 === 1;
    const p = add(spine[i], mul(nrm, half + (lobe ? 13 : 4)));
    edge.push(p);
    if (lobe) spines += `M${P1(p)}L${P1(add(p, add(mul(nrm, 6), [0, 5])))}`;
  }
  shape(out, r, [...base, ...[...edge].reverse()], tone(r, { spread: 0.05, dl: 0.02 }), { deep: 0 });
  out.push(`<path class="ink thin" d="${spines}"/>`);
}

export function thistle(out: Out, r: Rng, base: Pt) {
  // The rosette, its leaves spread low round the foot of the stem.
  [-168, -12, -140, -40, -104, -76, -190, 10, -90].forEach((d, k) => {
    part(out, 0.02 + k * 0.03, base, () => thistleLeaf(out, r, add(base, [(r() - 0.5) * 12, -4]), rad(d), 150 + r() * 50));
  });
  const H = 640;
  const n = 48;
  const sway = wobble(r, 6, [0.6, 1.1]);
  const spine = sample((t) => add(base, [sway(t), -t * H]), n);
  const gs = [0.2, 0.62];
  const width = (i: number) => 34 - (i / n) * 18;
  const stem = grow(out, gs[0], gs[1], () => {
    for (const [a, b] of [[4, 14], [18, 27], [31, 40]])
      for (const sg of [-1, 1]) wing(out, r, spine, a, b, sg, width);
    return stalk(out, (t) => spine[Math.round(t * n)], 34, 16, tone(r, { dl: -0.02, spread: 0.03 }), n);
  });
  // Head clusters: one at the top, and short branches below it.
  const cluster = (c: Pt, count: number, s: number, g: number, i: number) => {
    for (let k = 0; k < count; k++) {
      const a = rad(-90 + (k - (count - 1) / 2) * 34);
      const hc = add(c, polar(k === 0 ? 0 : s * 0.55, a));
      part(out, g + k * 0.015, spine[i], () => thistleHead(out, r, hc, s, (a + Math.PI / 2) * 0.5));
    }
  };
  let branches = "";
  const ends: [Pt, number][] = [];
  for (const [t, side, len] of [[0.8, -1, 70], [0.86, 1, 60], [0.92, -1, 44]] as const) {
    const i = Math.round(t * n);
    const p = spine[i];
    const end = add(p, [side * len, -len * 0.7]);
    branches += `M${P1(p)}Q${P1(add(p, [side * len * 0.7, -len * 0.1]))} ${P1(end)}`;
    ends.push([end, i]);
  }
  part(out, gate(stem, gs, n), spine[n], () => out.push(`<path class="ink thick" d="${branches}"/>`));
  ends.forEach(([e, i], k) => cluster(e, 3, 34, 0.7 + k * 0.03, i));
  cluster(add(spine[n], [0, -6]), 5, 40, 0.76, n);
}

// ---------------------------------------------------------------------------
// Silver lady's mantle: a shrub of slender arching stems, silver all over, clothed in tiny
// three-lobed leaves with reddish stipules, the field layer under the groundsels.

// Tiny three-lobed leaves along a stem, alternating sides.
function tridents(fill: string[], stip: string[], stem: Pt[], size: number, r: Rng) {
  for (let i = 3; i < stem.length; i++) {
    const p = stem[i];
    const d = norm(sub(stem[Math.min(stem.length - 1, i + 1)], stem[i - 1]));
    const side = i % 2 ? 1 : -1;
    const a = Math.atan2(d[1], d[0]) + side * rad(50);
    const s = size * (0.75 + r() * 0.5) * (1 - (i / stem.length) * 0.35);
    for (const off of [-0.55, 0, 0.55]) {
      const la = a + off;
      const tip = add(p, polar(s * (off ? 0.8 : 1), la));
      const w = polar(s * 0.17, la + Math.PI / 2);
      fill.push(`M${P1(p)}L${P1(add(lerp(p, tip, 0.5), w))}L${P1(tip)}L${P1(sub(lerp(p, tip, 0.5), w))}Z`);
    }
    if (i % 6 === 3) stip.push(closed(roundPts(add(p, polar(2, a)), 1.6, 1.2, a, 6)));
  }
}

// A single sprig, for the close study.
export function alchemillaSprig(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const stem = sample((t) => add(O, polar(L * t, dir + Math.sin(t * 2) * 0.1)), 30);
  const fill: string[] = [];
  const stip: string[] = [];
  tridents(fill, stip, stem, L * 0.07, r);
  out.push(`<path class="ink thin" d="${line(stem)}"/><path class="wash"${vars(tone(r, { spread: 0.05, hue: 10 }))} d="${fill.join("")}"/><path class="ink hair" d="${fill.join("")}"/>`);
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--bark-heath", dl: 0.06, spread: 0.04 }))} d="${stip.join("")}"/>`);
}

export function alchemilla(out: Out, r: Rng, base: Pt) {
  // The mound's body: a soft silver mass the sprays stand out from.
  const stems = 40;
  for (let k = 0; k < stems; k++) {
    const u = (k * 7) % stems / (stems - 1);
    const a = rad(-164 + u * 148 + (r() - 0.5) * 24);
    const L = 140 + Math.sin(u * Math.PI) * 80 + r() * 40;
    const arch = Math.cos(a) * 0.35;
    const p0 = add(base, [(u - 0.5) * 150 + (r() - 0.5) * 40, 0]);
    const end = add(p0, polar(L, a + arch * 0.6));
    const stem = sample(quad(p0, add(p0, add(polar(L * 0.55, a - arch * 0.3), [0, -L * 0.1])), end), 30);
    const back = k < stems / 2;
    const fill: string[] = [];
    const stip: string[] = [];
    tridents(fill, stip, stem, 14, r);
    // A side shoot from the middle of the stem.
    const fork = stem[14];
    const shoot = sample((t) => add(fork, polar(L * 0.45 * t, a + (k % 2 ? 0.5 : -0.5) + t * arch)), 14);
    tridents(fill, stip, shoot, 12, r);
    part(out, 0.04 + (back ? 0 : 0.18) + u * 0.22, p0, () => {
      out.push(`<path class="ink hair" d="${line(stem)}${line(shoot)}"/>`);
      out.push(`<path class="wash"${vars(tone(r, { dl: back ? -0.04 : 0.05, spread: 0.05, hue: 10 }))} d="${fill.join("")}"/>`);
      out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--bark-heath", dl: 0.06, spread: 0.04 }))} d="${stip.join("")}"/>`);
    });
  }
}

// ---------------------------------------------------------------------------
// Water lobelia: shiny rosettes on short stems mantled in dead leaves, a narrow spike whose
// short bare bracts let the flowers show, and last year's spike left standing, dead and brown.

export const GLOSSY: Habit = {
  dying: 0.12,
  young: 0.32,
  el: { dying: [-0.9, -0.6], spread: [0.05, 0.7], young: [0.9, 1.35] },
  len: { dying: 0.55, spread: [1, 0.8], young: [0.62, 0.4] },
  W: { dying: 0.18, spread: 0.24, young: 0.2 },
  curl: { dying: -0.1, spread: [0.25, 0.45], young: 0.05 },
  shine: true,
};

export function gregoriana(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Last year's spike, dead, behind.
  const dead = sample((t) => at([96 + Math.sin(t * 2) * 6, -40 - t * 170]), 24);
  // Already standing, so it grows first.
  grow(out, 0.02, 0.3, () => stalk(out, (t) => dead[Math.round(t * 24)], 9, 4, tone(r, { pc: "--skirt", dl: -0.16, spread: 0.03 }), 24));
  let caps = "";
  for (let i = 4; i <= 24; i += 1) {
    const p = dead[i];
    const sg = i % 2 ? 1 : -1;
    caps += closed(roundPts(add(p, [sg * 8, 2]), 4.5, 6, sg * 0.4, 8));
  }
  part(out, 0.34, dead[24], () => out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--skirt", dl: -0.22, spread: 0.04 }))} d="${caps}"/><path class="ink hair" d="${caps}"/>`));
  // Rosettes on their stems: the back one, then the flowering one in front.
  const crown = (ctrl: Pt[], R: number, g: number, count: number) => {
    const res = grow(out, g, g + 0.14, () => skirt(out, r, ctrl.map(at), { w0: 40, w1: 34, hem: 12 }));
    const C = add(res.pts[res.n], [0, -6]);
    rosette(out, r, C, R, g + 0.14, count, GLOSSY);
    return C;
  };
  crown([[96, 0], [104, -20], [98, -46]], 66, 0.04, 34);
  crown([[-110, 0], [-118, -24], [-112, -40]], 60, 0.08, 32);
  const C = crown([[0, 0], [-4, -30], [2, -70]], 78, 0.02, 40);
  const H = 190;
  const n = 30;
  const spine = sample((t) => add(C, [Math.sin(t * 2.4) * 5, -30 - t * H]), n);
  const gs = [0.36, 0.72];
  const axis = grow(out, gs[0], gs[1], () => stalk(out, (t) => spine[Math.round(t * n)], 12, 5, tone(r, { dl: -0.04, spread: 0.03 }), n));
  for (let i = 2, k = 0; i <= n; i += 2, k++) {
    const p = spine[i];
    const sg = k % 2 ? 1 : -1;
    const t = i / n;
    const tilt = (r() - 0.5) * 0.5;
    part(out, gate(axis, gs, i), p, () => {
      shape(out, r, [p, add(p, [sg * 14, -6]), add(p, [sg * 5, 2])], tone(r, { dl: 0.02, spread: 0.04 }), { deep: 0 });
      if (t < 0.9) lobeliaFlower(out, r, add(p, [sg * 3, -2]), (sg > 0 ? rad(-25) : rad(-155)) + tilt, 22 - t * 8);
    });
  }
}

// ---------------------------------------------------------------------------
// Brown's everlasting: a grey cushion of short stems hidden in linear woolly leaves, and small
// clusters of papery heads, cream bracts flushed pink at the base round a yellow heart.

export function everlasting(out: Out, r: Rng, c: Pt, s: number) {
  let bracts = "";
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const mid = add(c, [Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.34]);
    bracts += closed(sample((t) => add(mid, rot([Math.cos(t * Math.PI * 2) * s * 0.3, Math.sin(t * Math.PI * 2) * s * 0.14], a)), 10).slice(0, -1));
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--bract-paper", spread: 0.03 }))} d="${bracts}"/><path class="ink hair petal-edge" d="${bracts}"/>`);
  shape(out, r, roundPts(c, s * 0.34, s * 0.22, 0, 10), tone(r, { pc: "--bract-pink", spread: 0.04 }), { deep: 0, ink: false });
  shape(out, r, roundPts(add(c, [0, -s * 0.03]), s * 0.18, s * 0.12, 0, 8), tone(r, { pc: "--flower-gold", dl: -0.06, spread: 0.04 }), { deep: 0 });
}

export function helichrysum(out: Out, r: Rng, base: Pt) {
  const stems = 56;
  const tips: Pt[] = [];
  for (let k = 0; k < stems; k++) {
    const u = (k * 11) % stems / (stems - 1);
    const a = rad(-170 + u * 160 + (r() - 0.5) * 12);
    // Lengths follow a dome, so the tips round the cushion off.
    const L = 60 + Math.sin(u * Math.PI) ** 0.6 * 80 + r() * 16;
    const p0 = add(base, [(u - 0.5) * 70, 0]);
    const end = add(p0, polar(L, a));
    const stem = sample(quad(p0, add(lerp(p0, end, 0.5), polar(L * 0.12, a + Math.PI / 2 * (k % 2 ? 1 : -1))), end), 14);
    const back = k < stems / 2;
    // Each stem's leaves as a soft grey body, and single leaves standing out from it.
    const nrm = polar(1, a + Math.PI / 2);
    const fuzz = wobble(r, 1.2, [3, 7]);
    const body = [...stem.map((p, i) => add(p, mul(nrm, 4.5 * (1 - (i / 14) * 0.4) + fuzz(i / 14)))), add(end, polar(4, a)), ...[...stem].reverse().map((p, i) => add(p, mul(nrm, -4.5 * (0.6 + (i / 14) * 0.4) - fuzz(1 - i / 14))))];
    let green = "";
    stem.forEach((p, i) => {
      if (i < 2) return;
      const sg = i % 2 ? 1 : -1;
      green += `M${P1(p)}L${P1(add(p, polar(6 + r() * 5, a + sg * rad(14 + r() * 40))))}`;
      if (r() < 0.5) green += `M${P1(p)}L${P1(add(p, polar(4 + r() * 4, a - sg * rad(20 + r() * 30))))}`;
    });
    part(out, 0.04 + (back ? 0 : 0.14) + u * 0.2, p0, () => {
      shape(out, r, body, tone(r, { dl: back ? -0.09 : -0.03, dc: 0.9, spread: 0.03 }), { deep: 0, ink: false });
      out.push(`<path class="wash needles"${vars(tone(r, { dl: back ? -0.03 : 0.05, spread: 0.05 }))} d="${green}"/>`);
    });
    if (k % 4 === 1) tips.push(add(end, polar(6, a)));
    else if (!back && k % 7 === 3) tips.push(stem[9]);
  }
  tips.forEach((p, k) => {
    part(out, 0.6 + k * 0.03, p, () => {
      for (const [dx, dy] of [[-8, 2], [8, 0], [0, -9]]) everlasting(out, r, add(p, [dx, dy]), 14);
    });
  });
}

// ---------------------------------------------------------------------------
// Tussock grass: a dense fountain of fine blades from one crown, the old ones bleached to straw,
// and a few thin panicles above.

export function tussock(out: Out, r: Rng, base: Pt) {
  const blades = 72;
  const order = Array.from({ length: blades }, (_, k) => k).sort(() => r() - 0.5);
  const groups: { O: Pt; dir: number; L: number; W: number }[][] = [[], [], []];
  for (const k of order) {
    const u = k / (blades - 1);
    const a = rad(-168 + u * 156 + (r() - 0.5) * 14);
    const L = 150 + Math.sin(u * Math.PI) * 110 + r() * 40;
    groups[k % 3].push({ O: add(base, [(u - 0.5) * 50, 0]), dir: a, L, W: 0.032 });
  }
  // Each blade arches outward: drawn as two straight halves bent at its middle.
  const bent = (list: { O: Pt; dir: number; L: number; W: number }[]) =>
    list.flatMap(({ O, dir, L, W }) => {
      const droop = Math.cos(dir) * 0.55;
      const p1 = add(O, polar(L * 0.42, dir));
      const p2 = add(p1, polar(L * 0.32, dir + droop * 0.45));
      return [{ O, dir, L: L * 0.44, W: W * 1.3 }, { O: p1, dir: dir + droop * 0.45, L: L * 0.34, W: W * 1.1 }, { O: p2, dir: dir + droop * 1.15, L: L * 0.26, W }];
    });
  part(out, 0.04, base, () => bladeBunch(out, bent(groups[0]), tone(r, { pc: "--straw", spread: 0.05 })));
  part(out, 0.1, base, () => bladeBunch(out, bent(groups[1]), tone(r, { dl: -0.05, spread: 0.05 })));
  part(out, 0.16, base, () => bladeBunch(out, bent(groups[2]), tone(r, { dl: 0.03, spread: 0.05 })));
  for (const [x, lean] of [[-20, -0.25], [6, 0.1], [22, 0.3]]) {
    const top = add(base, [x + lean * 300, -300 - r() * 40]);
    part(out, 0.5, base, () => {
      out.push(`<path class="ink hair" d="M${P1(add(base, [x, 0]))}Q${P1(add(base, [x, -200]))} ${P1(top)}"/>`);
      let sp = "";
      for (let k = 0; k < 6; k++) sp += closed(roundPts(add(top, [(k % 2 ? 1 : -1) * 5, k * 9]), 2.2, 5, (k % 2 ? 1 : -1) * 0.4, 6));
      out.push(`<path class="wash"${vars(tone(r, { pc: "--straw", dl: -0.08, spread: 0.04 }))} d="${sp}"/><path class="ink hair" d="${sp}"/>`);
    });
  }
}

// ---------------------------------------------------------------------------
// Haplocarpha: a flat rosette pressed to the ground, glossy above and white-woolly beneath, and
// yellow daisies on short stalks.

export const FLAT: Habit = {
  dying: 0.08,
  young: 0.3,
  el: { dying: [-0.3, -0.2], spread: [-0.04, 0.24], young: [0.35, 0.65] },
  len: { dying: 0.7, spread: [1, 0.84], young: [0.7, 0.5] },
  W: { dying: 0.3, spread: 0.36, young: 0.32 },
  curl: { dying: 0, spread: [0.05, 0.16], young: 0.05 },
  shine: true,
  under: "--felt",
};

// A daisy facing up and toward the viewer: yellow rays round a darker disc.
export function daisy(out: Out, r: Rng, c: Pt, s: number, tilt = 0.45) {
  let rays = "";
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    const mid = add(c, [Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5 * tilt]);
    rays += closed(sample((t) => add(mid, rot([Math.cos(t * Math.PI * 2) * s * 0.3, Math.sin(t * Math.PI * 2) * s * 0.07 * (0.6 + tilt)], Math.atan2(Math.sin(a) * tilt, Math.cos(a)))), 10).slice(0, -1));
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-gold", spread: 0.05, hue: 8 }))} d="${rays}"/><path class="ink hair" d="${rays}"/>`);
  shape(out, r, roundPts(c, s * 0.2, s * 0.2 * tilt, 0, 10), tone(r, { pc: "--flower-gold", dl: -0.24, spread: 0.04 }), { deep: 0 });
}

export function haplocarpha(out: Out, r: Rng, base: Pt) {
  const C = add(base, [0, -6]);
  rosette(out, r, C, 84, 0.04, 30, FLAT);
  for (const [dx, h, lean] of [[-44, 58, -0.3], [10, 74, 0.05], [52, 50, 0.35]]) {
    const top = add(C, [dx + lean * 30, -h]);
    part(out, 0.5, C, () => {
      stalk(out, quad(add(C, [dx * 0.3, -4]), add(C, [dx * 0.8, -h * 0.5]), top), 3.6, 2.4, tone(r, { dl: -0.04, spread: 0.03 }), 10);
      daisy(out, r, top, 34);
    });
  }
}

// ---------------------------------------------------------------------------
// Young giant groundsel: not yet flowered, so not yet branched, one rosette on a column in its
// skirt of dead leaves, leaning in from beyond the edge of the frame.

export function sapling(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  grow(out, 0.02, 0.12, () => corkTrunk(out, r, [at([0, 4]), at([-6, -50]), at([-14, -96])], 74, 66));
  const g = [0.1, 0.48];
  const col = grow(out, g[0], g[1], () => skirt(out, r, [at([-6, -60]), at([-40, -230]), at([-86, -400]), at([-134, -540])], { w0: 82, w1: 72 }));
  rosette(out, r, add(col.pts[col.n], [0, -10]), 120, g[1], 54);
}

// ---------------------------------------------------------------------------
// Mount Kenya heath: a low shrub's grey twiggy branch reaching in from a side, its tiny sticky
// light-green leaves packed into rounded clumps rather than plumes, and small bells that open
// white and age to brown.

// One clump: a rounded mass of needle leaves at the end of a short twig, with a few bells.
export function heathClump(out: Out, r: Rng, c: Pt, R: number, bells: boolean) {
  const wob = wobble(r, 0.14, [3, 5, 8]);
  shape(out, r, sample((t) => add(c, polar(R * (0.8 + wob(t)), t * Math.PI * 2)), 18).slice(0, -1), tone(r, { dl: -0.08, spread: 0.04 }), { deep: 0.5, ink: false });
  let green = "";
  let ink = "";
  for (let k = 0, count = Math.round(R * 2.2); k < count; k++) {
    const a = r() * Math.PI * 2;
    const from = add(c, polar(R * Math.sqrt(r()) * 0.7, a));
    const seg = `M${P1(from)}L${P1(add(from, polar(R * (0.28 + r() * 0.18), a + (r() - 0.5) * 0.8)))}`;
    if (k % 5 === 0) ink += seg;
    else green += seg;
  }
  out.push(`<path class="wash needles"${vars(tone(r, { dl: 0.04, spread: 0.06, hue: 10 }))} d="${green}"/><path class="ink hair" d="${ink}"/>`);
  if (!bells) return;
  let white = "";
  let brown = "";
  for (let k = 0; k < 7; k++) {
    const b = closed(roundPts(add(c, add(polar(R * (0.5 + r() * 0.5), rad(-150 + r() * 120)), [0, 2])), 2.6, 3, 0, 8));
    if (k % 3 === 2) brown += b;
    else white += b;
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--petal", dl: -0.03, spread: 0.03 }))} d="${white}"/><path class="wash fruit"${vars(tone(r, { pc: "--skirt", dl: -0.18, spread: 0.04 }))} d="${brown}"/><path class="ink hair" d="${white}${brown}"/>`);
}

export function trimera(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0, 0.5];
  const main = grow(out, gm[0], gm[1], () => limb(out, r, [at([-24, 8]), at([100, -26]), at([210, -14]), at([310, -56]), at([400, -60])], { w0: 26, w1: 7, pc: "--bark-pale", cap: "taper" }));
  const fork = (t: number, ctrl: Pt[], w0: number, span: number) => {
    const i = Math.round(main.n * t);
    const g = [gate(main, gm, i), gate(main, gm, i) + span];
    const res = grow(out, g[0], g[1], () => limb(out, r, [main.pts[i - 2], ...ctrl.map((p) => add(main.pts[i], p))], { w0, w1: 4, pc: "--bark-pale", cap: "taper", inkFrom: 0.12 }));
    return { res, g };
  };
  const limbs = [{ res: main, g: gm }, fork(0.28, [[24, -50], [40, -110], [70, -160]], 13, 0.26), fork(0.58, [[40, -40], [80, -90], [96, -140]], 11, 0.24), fork(0.44, [[60, 20], [120, 34], [170, 24]], 10, 0.24)];
  // Short twigs along every limb, each ending in a clump; one clump on every tip.
  for (const { res, g } of limbs) {
    for (let i = 6; i < res.n - 2; i += 6) {
      const p = res.pts[i];
      const dir = angleOf(res.pts, i) + ((i / 6) % 2 ? -1 : 1) * rad(55) - rad(15);
      const len = 18 + r() * 22;
      const c = add(p, polar(len, dir));
      part(out, gate(res, g, i) + 0.03, p, () => {
        out.push(`<path class="ink thin" d="M${P1(p)}L${P1(c)}"/>`);
        heathClump(out, r, c, 20 + r() * 10, r() < 0.5);
      });
    }
    const tip = res.pts[res.n];
    part(out, gate(res, g, res.n), tip, () => heathClump(out, r, tip, 28, true));
  }
}
