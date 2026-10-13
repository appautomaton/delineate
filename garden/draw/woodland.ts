// The Northwest European Woodland garden (#10, Köppen Cfb: Devon, Cornwall, and the west of Ireland).
// Built on the four-season system (`year: true` in `gardens.ts`, March to February):
//   - Late winter / early bud (`u = BUD = 0.05` to `0.30`): gnarled oak boughs, coppery hazel
//     coppice rods, thorny hawthorn branches, cascading climbers, and foxglove/bracken stalks
//     shoot and extend across the hollow-way, trailing sulphur-yellow hazel catkins, golden gorse
//     pea blossoms, emerging bluebell shoots, and silver-furry bracken fiddleheads.
//   - Late spring (`u = SPRING = 0.42`): bluebells carpeting the floor with nodding one-sided
//     violet-blue racemes before the oak canopy closes, snowy flat-topped corymbs of white May
//     blossom with pink anthers on the hawthorn, fresh eared oak leaves, holly axil blossoms,
//     foxglove spires and honeysuckle trumpets coming into bloom, and gorse in full gold.
//   - Summer (`u = SUMMER = 0.55–0.60`): tall one-sided spires of spotted purple-pink foxglove bells
//     in full bloom, terminal whorls of creamy-yellow and rose-carmine honeysuckle
//     trumpets, greenish-cream old man's beard panicles, broad triangular bracken fronds,
//     swelling long-stalked acorns and leafy-husked cobnuts, while bluebells vanish underground.
//   - Autumn (`u ≈ 0.68–0.82`): spherical umbels of chartreuse-yellow ivy flowers on unlobed
//     adult shoots, translucent crimson honeysuckle berries, scarlet haws and holly berries,
//     billowing silver-white old man's beard style wigs, copper-russet bracken, butter-yellow
//     hazel, and ochre-russet oak shedding acorns from their long-stalked cups.
//   - Winter (`u ≈ 0.86–1.0`): bare gnarled oak limbs holding empty stalked acorn cups and
//     marble galls, thorny hawthorn twigs studded with crimson haws, evergreen holly with scarlet
//     berries, ivy with dull ink-black berry clusters, billowing silver clematis wigs, stiff
//     foxglove capsule stalks, collapsed bronze bracken, winter-blooming gorse, and new hazel
//     catkins expanding yellow for the coming spring.

import { TAU, rad, P1, add, sub, mul, lerp, polar, rot, through, quad, closed, line, sample, vars, shape, stalk, tone, grow, part, gate, roundPts } from "./lib.ts";
import type { Out, Pt, Rng, Tone } from "./lib.ts";
import { limb, branch, angleOf } from "./woody.ts";
import type { Limb } from "./woody.ts";
import { blade, bladeBunch } from "./mediterranean.ts";

// Deterministic autumn shedding time based on attachment position rather than the RNG stream.
const fallsAt = (from: number, span: number) => ([x, y]: Pt) =>
  from + ((((Math.round(x * 7 + y * 13) % 20) + 20) % 20) / 20) * span;

// ---------------------------------------------------------------------------
// 1. Pedunculate oak (Quercus robur): stout, wide-spreading, crooked limbs with deeply fissured
// grey-brown bark (`--bark-oak`), clustered blunt ovoid terminal buds, pendulous yellow-green
// spring catkins, practically stalkless obovate leaves with an auriculate (eared) base and 4–5
// rounded wavy asymmetric lobes per side, and 1–3 acorns in scaly cross-hatched cups borne on a
// long slender peduncle (cups and marble galls stay through winter; nuts drop in autumn).

const OAK_BARK = { pc: "--bark-oak" };
const oakShed = fallsAt(0.75, 0.08);
const oakCatkinFall = fallsAt(0.32, 0.03);
const acornNutFall = fallsAt(0.75, 0.05);

export function oakLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number, v?: Tone) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  // Short subsessile petiole (2–6 mm in life) before the auriculate basal ear-lobes.
  const pet = 0.06 * L;
  const B = toW([pet, 0]);
  out.push(`<path class="ink thin" d="M${P1(O)}L${P1(B)}"/>`);

  // 4 lateral rounded lobes per side + rounded terminal lobe + basal auricles dipping back to x = 0.01*L.
  const lobesL = [0.22, 0.44, 0.66, 0.84];
  const lobesR = [0.24, 0.47, 0.68, 0.85];
  const asym = (r() - 0.5) * 0.04;
  const halfAt = (u: number, side: number) => {
    // Basal auricle (ear) dipping behind `pet`
    if (u < 0.08) {
      const t = u / 0.08;
      return L * 0.11 * Math.sin(Math.PI * t ** 0.7);
    }
    const s = (u - 0.08) / 0.92;
    // Obovate envelope: widest at s ≈ 0.68
    const env = 0.34 * Math.sin(Math.PI * s ** 0.72) * (0.72 + 0.38 * Math.sin(Math.PI * s));
    // Wavy rounded lobes separated by deep rounded sinuses
    const wave = 0.66 + 0.34 * Math.cos((s * 4.2 + (side > 0 ? asym : -asym)) * TAU);
    return L * env * wave;
  };

  const steps = 20;
  const up: Pt[] = [];
  const dn: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = (0.02 + u * 0.98) * L;
    up.push(toW([x, -halfAt(u, -1)]));
    dn.push(toW([x, halfAt(u, 1)]));
  }
  const tip = toW([1.03 * L, 0]);
  const outline = [B, ...up, tip, ...dn.reverse()];
  const leafTone = v ?? tone(r, { spread: 0.06, hue: 10 });
  shape(out, r, outline, leafTone, { deep: 0.45, deepAbout: toW([0.48 * L, 0]), ink: false });
  out.push(`<path class="ink hair" d="${closed(outline)}"/>`);

  let veins = `M${P1(B)}L${P1(toW([0.96 * L, 0]))}`;
  for (const u of lobesL) {
    const x0 = (0.04 + u * 0.82) * L;
    const x1 = (0.08 + u * 0.9) * L;
    const y1 = -halfAt(u * 0.92 + 0.06, -1) * 0.84;
    veins += `M${P1(toW([x0, 0]))}Q${P1(toW([(x0 + x1) * 0.5, y1 * 0.45]))} ${P1(toW([x1, y1]))}`;
  }
  for (const u of lobesR) {
    const x0 = (0.04 + u * 0.82) * L;
    const x1 = (0.08 + u * 0.9) * L;
    const y1 = halfAt(u * 0.92 + 0.06, 1) * 0.84;
    veins += `M${P1(toW([x0, 0]))}Q${P1(toW([(x0 + x1) * 0.5, y1 * 0.45]))} ${P1(toW([x1, y1]))}`;
  }
  out.push(`<path class="ink hair vein" d="${veins}"/>`);
}

function oakTerminalBuds(out: Out, r: Rng, T: Pt, dir: number, sc = 1) {
  let buds = "";
  for (const [da, len, w] of [
    [-0.48, 7.5, 2.8],
    [0, 9.2, 3.2],
    [0.48, 7.5, 2.8],
  ] as const) {
    const a = dir + da;
    const c = add(T, polar(len * 0.52 * sc, a));
    buds += closed(roundPts(c, len * 0.52 * sc, w * sc, a, 7));
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--acorn-nut", dl: -0.08, spread: 0.03 }))} d="${buds}"/><path class="ink hair" d="${buds}"/>`);
}

function oakCatkins(out: Out, r: Rng, T: Pt, sc = 1) {
  let stalks = "";
  let beads = "";
  for (const [dx, L, sway] of [
    [-4 * sc, 36 * sc, -4 * sc],
    [3 * sc, 44 * sc, 5 * sc],
    [9 * sc, 32 * sc, 3 * sc],
  ] as const) {
    const B = add(T, [dx, 2]);
    const sp = sample((t) => add(B, [Math.sin(t * 2.4) * sway, t * L]), 7);
    stalks += line(sp);
    for (let i = 1; i <= 7; i++) {
      const p = sp[i];
      beads += closed(roundPts(add(p, [(i % 2 ? 1 : -1) * 1.6 * sc, 0]), 2.2 * sc, 1.7 * sc, 0, 5));
    }
  }
  out.push(`<path class="ink hair" d="${stalks}"/><path class="wash"${vars(tone(r, { pc: "--catkin-hazel", dl: -0.04, dh: 16, spread: 0.04 }))} d="${beads}"/><path class="ink hair" d="${beads}"/>`);
}

// Long-stalked acorns (Quercus robur): 1–2 acorns on a slender 3–8 cm peduncle.
// When `mode === "cups"`, draws the peduncle and scaly cupules (`0.42..1.0`); when `mode === "nuts"`,
// draws the ovoid nuts inside the cups (`0.46..acornNutFall`).
export function oakPeduncle(out: Out, r: Rng, T: Pt, dir: number, sc = 1, mode: "both" | "cups" | "nuts" = "both") {
  const pedLen = 42 * sc;
  const ctrl = add(T, polar(pedLen * 0.55, dir + 0.18));
  const end = add(T, polar(pedLen, dir + 0.08));
  const acorns: [Pt, number, number][] = [
    [end, dir - 0.32, 1],
    [lerp(ctrl, end, 0.58), dir + 0.46, 0.9],
  ];

  if (mode !== "nuts") {
    out.push(`<path class="ink thin" d="M${P1(T)}Q${P1(ctrl)} ${P1(end)}"/>`);
  }

  for (const [A, a, k] of acorns) {
    const s = sc * k;
    const toW = (p: Pt) => add(A, rot(p, a));
    if (mode !== "cups") {
      // Plump ovoid-oblong acorn nut protruding from the cupule, tipped with a tiny stylar point
      const nutC = toW([11.5 * s, 0]);
      const nutPts = roundPts(nutC, 9.5 * s, 6.4 * s, a, 10);
      shape(out, r, nutPts, tone(r, { pc: "--acorn-nut", spread: 0.04 }), { deep: 0.42, deepAbout: toW([13 * s, 2 * s]) });
      const mucro = toW([22 * s, 0]);
      out.push(`<path class="ink thin" d="M${P1(toW([20.5 * s, 0]))}L${P1(mucro)}"/>`);
    }
    if (mode !== "nuts") {
      // Hemispherical scaly cupule (`--acorn-cup`) clasping the base of the nut
      const cupPts = [
        toW([0, -4.2 * s]),
        toW([3.5 * s, -6.8 * s]),
        toW([8.2 * s, -7.2 * s]),
        toW([9.2 * s, -3.5 * s]),
        toW([9.5 * s, 0]),
        toW([9.2 * s, 3.5 * s]),
        toW([8.2 * s, 7.2 * s]),
        toW([3.5 * s, 6.8 * s]),
        toW([0, 4.2 * s]),
      ];
      shape(out, r, cupPts, tone(r, { pc: "--acorn-cup", spread: 0.04 }), { deep: 0.45 });
      let scales = "";
      for (const x of [2.5, 5.2, 7.4]) {
        for (const y of [-4.2, -1.4, 1.4, 4.2]) {
          scales += `M${P1(toW([x * s, (y - 1.3) * s]))}Q${P1(toW([(x + 1.8) * s, y * s]))} ${P1(toW([x * s, (y + 1.3) * s]))}`;
        }
      }
      out.push(`<path class="ink hair" d="${scales}"/>`);
    }
  }
}

function oakMarbleGall(out: Out, r: Rng, P: Pt, dir: number) {
  const C = add(P, polar(8, dir));
  shape(out, r, roundPts(C, 7.2, 7.2, 0, 10), tone(r, { pc: "--acorn-cup", dl: -0.05, spread: 0.03 }), { deep: 0.45 });
  const hole = roundPts(add(C, [1.5, -1]), 1.3, 1.3, 0, 5);
  out.push(`<path class="ink thin" d="${closed(hole)}"/>`);
}

function oakSpray(out: Out, r: Rng, parent: { res: Limb; g: number[] }, u: number, side: number, hasAcorn: boolean, hasGall: boolean) {
  const i = Math.round(parent.res.n * u);
  const a = angleOf(parent.res.pts, i) + side * rad(34 + r() * 14);
  const len = 48 + r() * 18;
  // Elbowed oak twig
  const twig = branch(
    out,
    r,
    parent,
    u,
    [polar(len * 0.48, a), polar(len, a - side * rad(18))],
    0.04,
    { w0: 5.6, w1: 2.6, cap: "blunt", ...OAK_BARK },
  );
  const n = twig.res.n;
  const tip = twig.res.pts[n];
  const tipDir = angleOf(twig.res.pts, n);
  const gTip = gate(twig.res, twig.g, n);

  // Persistent terminal bud cluster
  part(out, gTip + 0.01, tip, () => oakTerminalBuds(out, r, tip, tipDir, 1));

  // Spring catkins dangling from mid-twig (`gate(...) + 0.01..0.34`)
  const catIdx = Math.round(n * 0.55);
  const catPt = twig.res.pts[catIdx];
  const gCat = gate(twig.res, twig.g, catIdx);
  part(out, gCat + 0.01, catPt, () => oakCatkins(out, r, catPt, 0.95), oakCatkinFall(catPt));

  // Rosette-like cluster of 4 subsessile eared oak leaves near the shoot tip and upper nodes
  const leafAngles = [-rad(66), -rad(22), rad(24), side * rad(72)];
  leafAngles.forEach((da, k) => {
    const nodeIdx = k < 2 ? n : Math.round(n * (k === 2 ? 0.68 : 0.42));
    const P = twig.res.pts[nodeIdx];
    const gNode = gate(twig.res, twig.g, nodeIdx);
    const la = tipDir + da + (r() - 0.5) * 0.14;
    const L = (62 - k * 4 + r() * 10);
    part(out, Math.max(gNode + 0.02, 0.18 + k * 0.025 + r() * 0.02), P, () => oakLeaf(out, r, P, la, L), oakShed(P));
  });

  if (hasAcorn) {
    const acIdx = Math.round(n * 0.72);
    const acPt = twig.res.pts[acIdx];
    const gAc = gate(twig.res, twig.g, acIdx);
    const acDir = rad(74 + side * 12);
    part(out, Math.max(gAc + 0.015, 0.42), acPt, () => oakPeduncle(out, r, acPt, acDir, 1, "cups"));
    part(out, Math.max(gAc + 0.015, 0.46), acPt, () => oakPeduncle(out, r, acPt, acDir, 1, "nuts"), acornNutFall(acPt));
  }
  if (hasGall) {
    const gIdx = Math.round(n * 0.38);
    const gPt = twig.res.pts[gIdx];
    const gGall = gate(twig.res, twig.g, gIdx);
    part(out, Math.max(gGall + 0.015, 0.54), gPt, () => oakMarbleGall(out, r, gPt, tipDir - side * rad(72)));
  }
}

export function oak(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0.01, 0.18];
  // Stout, crooked, elbowed main bough reaching in from the left edge
  const main = grow(out, gm[0], gm[1], () =>
    limb(
      out,
      r,
      [at([-28, 12]), at([68, -18]), at([154, -8]), at([248, -58]), at([346, -44]), at([428, -88])],
      { w0: 44, w1: 11, cap: "blunt", swell: [[0.32, 0.15], [0.64, 0.12]], ...OAK_BARK },
    ),
  );
  const parent = { res: main, g: gm };
  const upper = branch(out, r, parent, 0.34, [[42, -52], [108, -112], [186, -138], [254, -178]], 0.08, {
    w0: 21,
    w1: 7.5,
    cap: "blunt",
    swell: [[0.48, 0.12]],
    ...OAK_BARK,
  });
  const lower = branch(out, r, parent, 0.56, [[52, 24], [128, 48], [204, 34]], 0.08, {
    w0: 17,
    w1: 6.5,
    cap: "blunt",
    ...OAK_BARK,
  });
  const outer = branch(out, r, parent, 0.78, [[36, -42], [92, -88], [148, -118]], 0.08, {
    w0: 13,
    w1: 5.5,
    cap: "blunt",
    ...OAK_BARK,
  });

  for (const [b, knots] of [
    [parent, [0.24, 0.46, 0.68, 0.88, 0.98]],
    [upper, [0.32, 0.62, 0.88, 0.98]],
    [lower, [0.38, 0.72, 0.96]],
    [outer, [0.48, 0.94]],
  ] as const) {
    knots.forEach((u, idx) => {
      oakSpray(out, r, b, u, idx % 2 ? 1 : -1, idx % 2 === 0, idx === 1);
    });
  }
}

export function oakDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-150, 30], [-40, -10], [60, -25], [130, -55]], { w0: 14, w1: 6, cap: "blunt", ...OAK_BARK });
  const tip = twig.pts[twig.n];
  oakTerminalBuds(out, r, tip, angleOf(twig.pts, twig.n), 1.6);
  oakCatkins(out, r, twig.pts[Math.round(twig.n * 0.35)], 1.5);
  oakPeduncle(out, r, twig.pts[Math.round(twig.n * 0.68)], rad(72), 1.85, "both");
  for (const [u, deg, L] of [
    [0.32, -135, 118],
    [0.58, -68, 132],
    [0.84, -18, 126],
    [0.96, 32, 114],
  ] as const) {
    oakLeaf(out, r, twig.pts[Math.round(twig.n * u)], rad(deg), L);
  }
}

// ---------------------------------------------------------------------------
// 2. Common hazel (Corylus avellana): multi-stemmed shining coppery-brown coppice rods marked with
// horizontal lenticels (`--bark-hazel`), hung in late winter and early spring (`gate(...) + 0.01 -> 0.30`
// and again `0.86..1.0`) with clusters of 2–4 dangling sulphur-yellow lamb's-tail catkins
// (`--catkin-hazel`) and tiny crimson female style tufts, broad orbicular doubly-serrate drip-tipped
// leaves, and cobnuts (`--nut-hazel`) in jagged husks.

const HAZEL_BARK = { pc: "--bark-hazel" };
const hazelShed = fallsAt(0.73, 0.08);
const hazelCatkinFall = fallsAt(0.28, 0.04);
const cobnutFall = fallsAt(0.75, 0.05);

export function hazelCatkins(out: Out, r: Rng, T: Pt, sc = 1) {
  // Tiny crimson female flower style tuft peeking from a plump bud just above the catkin peduncle
  const budC = add(T, [0, -3.5 * sc]);
  let styles = "";
  for (const da of [-0.55, -0.2, 0.2, 0.55]) {
    const a = rad(-90) + da;
    styles += `M${P1(budC)}Q${P1(add(budC, polar(4.5 * sc, a + da * 0.4)))} ${P1(add(budC, polar(8.5 * sc, a + da * 0.8)))}`;
  }
  out.push(`<path class="ink thin" style="stroke:var(--berry-haw)" d="${styles}"/>`);
  shape(out, r, roundPts(budC, 3.2 * sc, 2.4 * sc, rad(-90), 6), tone(r, { pc: "--bark-hazel", dl: 0.05 }), { deep: 0, ink: false });

  // Cluster of 3 dangling cylindrical sulphur-yellow lamb's-tail male catkins
  const tails: [number, number, number][] = [
    [-5 * sc, 64 * sc, -5 * sc],
    [1 * sc, 78 * sc, 2 * sc],
    [6.5 * sc, 56 * sc, 6 * sc],
  ];
  let scaleTicks = "";
  for (const [dx, L, sway] of tails) {
    const B = add(T, [dx, 2 * sc]);
    const sp = sample((t) => add(B, [Math.sin(t * 2.1) * sway + t * sway * 0.4, t * L]), 8);
    const up: Pt[] = [];
    const dn: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const hw = 4.2 * sc * Math.sin(Math.PI * Math.min(1, u * 0.92 + 0.06)) ** 0.45;
      up.push(add(sp[i], [-hw, 0]));
      dn.push(add(sp[i], [hw, 0]));
      if (i > 0 && i < 8) {
        scaleTicks += `M${P1(add(sp[i], [-hw * 0.82, -1 * sc]))}Q${P1(add(sp[i], [0, 1.8 * sc]))} ${P1(add(sp[i], [hw * 0.82, -1 * sc]))}`;
      }
    }
    const body = [...up, add(sp[8], [0, 2 * sc]), ...dn.reverse()];
    shape(out, r, body, tone(r, { pc: "--catkin-hazel", spread: 0.04, hue: 6 }), { deep: 0.35, ink: false });
    out.push(`<path class="ink hair" d="${closed(body)}"/>`);
  }
  out.push(`<path class="ink hair" style="opacity:.55" d="${scaleTicks}"/>`);
}

export function hazelLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const pet = 0.12 * L;
  const B = toW([pet, 0]);
  out.push(`<path class="ink thin" d="M${P1(O)}L${P1(B)}"/>`);

  // Broadly orbicular-obovate blade with cordate base, doubly-serrate margin, and sudden narrow drip-tip
  const steps = 20;
  const up: Pt[] = [];
  const dn: Pt[] = [];
  const halfAt = (u: number) => {
    // Cordate base to broad orbicular belly, narrowing abruptly at u > 0.84 into an acuminate drip-tip
    const body = u < 0.86 ? Math.sin(Math.PI * (u / 0.86) ** 0.58) ** 0.68 : ((1 - u) / 0.14) ** 1.6 * 0.24;
    const saw = 1 - 0.045 * ((iTooth(u * 14) % 1) + 0.4 * (iTooth(u * 28) % 1));
    return 0.44 * L * body * saw;
  };
  function iTooth(x: number) {
    return x - Math.floor(x);
  }
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = (0.08 + u * 0.92 - 0.06 * Math.sin(Math.PI * (1 - u) ** 2.4)) * L;
    const hw = halfAt(u);
    up.push(toW([x, -hw]));
    dn.push(toW([x, hw * 0.97]));
  }
  const tip = toW([1.06 * L, 0]);
  const outline = [B, ...up, tip, ...dn.reverse()];
  shape(out, r, outline, tone(r, { spread: 0.06, hue: 10 }), { deep: 0.42, deepAbout: toW([0.46 * L, 0]), ink: false });
  out.push(`<path class="ink hair" d="${closed(outline)}"/>`);

  let veins = `M${P1(B)}L${P1(toW([0.98 * L, 0]))}`;
  for (let k = 1; k <= 5; k++) {
    const u = k / 6.2;
    const x0 = (0.12 + u * 0.72) * L;
    const hw = halfAt(Math.min(0.82, u + 0.08)) * 0.88;
    for (const s of [-1, 1]) {
      veins += `M${P1(toW([x0, 0]))}Q${P1(toW([x0 + 0.08 * L, s * hw * 0.48]))} ${P1(toW([x0 + 0.18 * L, s * hw]))}`;
    }
  }
  out.push(`<path class="ink hair vein" d="${veins}"/>`);
}

export function hazelCobnuts(out: Out, r: Rng, T: Pt, dir: number, sc = 1) {
  // Cluster of 2–3 ovoid brown cobnuts, each clasped in a deeply jagged-toothed leafy involucre husk
  for (const [da, dist] of [
    [-0.42, 10 * sc],
    [0.36, 11 * sc],
  ] as const) {
    const a = dir + da;
    const C = add(T, polar(dist, a));
    const toW = (p: Pt) => add(C, rot(p, a));
    // Ovoid nut
    const nutPts = roundPts(toW([8 * sc, 0]), 8.5 * sc, 6.8 * sc, a, 10);
    shape(out, r, nutPts, tone(r, { pc: "--nut-hazel", spread: 0.04 }), { deep: 0.4 });
    // Deeply laciniate-toothed leafy husk wrapping the base and sides of the nut
    const huskPts = [
      toW([-2 * sc, -4 * sc]),
      toW([3 * sc, -8.5 * sc]),
      toW([11 * sc, -9.2 * sc]),
      toW([7 * sc, -5.2 * sc]),
      toW([13.5 * sc, -3.4 * sc]),
      toW([8.2 * sc, 0]),
      toW([13.5 * sc, 3.4 * sc]),
      toW([7 * sc, 5.2 * sc]),
      toW([11 * sc, 9.2 * sc]),
      toW([3 * sc, 8.5 * sc]),
      toW([-2 * sc, 4 * sc]),
    ];
    shape(out, r, huskPts, tone(r, { dl: 0.04, spread: 0.05 }), { deep: 0.35, ink: false });
    out.push(`<path class="ink hair" d="${closed(huskPts)}"/>`);
  }
}

export function hazel(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Three ascending and arching coppery-brown coppice rods with horizontal lenticels
  const rods: [Pt[], number, number][] = [
    [[at([-24, 18]), at([76, -34]), at([186, -88]), at([294, -142]), at([386, -184])], 22, 6.5],
    [[at([-24, 28]), at([84, -8]), at([204, -32]), at([326, -54]), at([424, -68])], 19, 6],
    [[at([-24, 38]), at([68, 12]), at([168, 16]), at([268, 8]), at([348, -6])], 16, 5.2],
  ];

  rods.forEach(([ctrl, w0, w1], j) => {
    const gm: [number, number] = [0.01, 0.16];
    const rod = grow(out, gm[0], gm[1], () =>
      limb(out, r, ctrl, { w0, w1, cap: "taper", lenticels: true, ...HAZEL_BARK }),
    );
    const parent = { res: rod, g: gm };
    // Fine lateral shoots along each coppice rod
    for (const [k, u] of [
      [0, 0.28],
      [1, 0.5],
      [2, 0.72],
      [3, 0.92],
    ] as const) {
      const side = (j + k) % 2 ? 1 : -1;
      const i = Math.round(rod.n * u);
      const a = angleOf(rod.pts, i) + side * rad(28 + r() * 14);
      const len = 46 + r() * 20;
      const shoot = branch(out, r, parent, u, [polar(len * 0.5, a), polar(len, a + side * 0.1)], 0.07, {
        w0: 4.8,
        w1: 1.8,
        cap: "taper",
        lenticels: true,
        ...HAZEL_BARK,
      });
      const sn = shoot.res.n;
      for (const [m, su] of [
        [0, 0.45],
        [1, 0.92],
      ] as const) {
        const si = Math.round(sn * su);
        const P = shoot.res.pts[si];
        const sd = angleOf(shoot.res.pts, Math.min(si, sn - 1));
        const g = gate(shoot.res, shoot.g, si);
        // Lamb's-tail catkins dangle right behind the extending wood in spring AND again in winter
        if (m === 1 || (k + j) % 2 === 0) {
          part(out, g + 0.01, P, () => hazelCatkins(out, r, P, 0.88 + m * 0.14), hazelCatkinFall(P));
          part(out, 0.86 + u * 0.04, P, () => hazelCatkins(out, r, P, 0.88 + m * 0.14));
        }
        // Broad doubly-serrate drip-tipped leaves unfold after the catkins shed pollen (`0.18..0.33`)
        const la = sd + (m % 2 ? 1 : -1) * rad(42);
        part(out, Math.max(g + 0.02, 0.18 + k * 0.025 + m * 0.015), P, () => hazelLeaf(out, r, P, la, 56 + r() * 14), hazelShed(P));
      }
      if ((j + k) % 2 === 0) {
        const nutIdx = Math.round(sn * 0.65);
        const nutP = shoot.res.pts[nutIdx];
        const gNut = gate(shoot.res, shoot.g, nutIdx);
        const nutDir = angleOf(shoot.res.pts, nutIdx) + side * rad(48);
        part(out, Math.max(gNut + 0.015, 0.44 + k * 0.01), nutP, () => hazelCobnuts(out, r, nutP, nutDir, 1), cobnutFall(nutP));
      }
    }
  });
}

export function hazelDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-150, -30], [-30, -45], [90, -55], [160, -60]], {
    w0: 11,
    w1: 4.5,
    cap: "taper",
    lenticels: true,
    ...HAZEL_BARK,
  });
  hazelCatkins(out, r, twig.pts[Math.round(twig.n * 0.28)], 1.9);
  hazelCatkins(out, r, twig.pts[Math.round(twig.n * 0.88)], 1.65);
  hazelLeaf(out, r, twig.pts[Math.round(twig.n * 0.46)], rad(38), 112);
  hazelLeaf(out, r, twig.pts[Math.round(twig.n * 0.68)], rad(-32), 104);
  hazelCobnuts(out, r, twig.pts[Math.round(twig.n * 0.58)], rad(82), 1.85);
}

// ---------------------------------------------------------------------------
// 3. Common hawthorn (Crataegus monogyna): gnarled, zigzagging thorny branches (`--bark-hawthorn`)
// armed with sharp straight axillary thorns, deeply cut 3–7-lobed forward-pointing leaves, dense
// flat-topped corymbs of 5-petalled white May blossoms with pink-purple anthers (`--flower-hawthorn`,
// `--anther-hawthorn`), and clusters of deep crimson-red haws (`--berry-haw`) that stud the bare
// thorny twigs all winter.

const HAW_BARK = { pc: "--bark-hawthorn" };
const hawShed = fallsAt(0.73, 0.08);
const mayBlossomFall = fallsAt(0.44, 0.03);

export function hawthornLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  // Deeply cut more than halfway to the midrib into 5 forward-pointing acute lobes with a wedge base
  const toW = (p: Pt) => add(O, rot(p, dir));
  const pet = 0.08 * L;
  const B = toW([pet, 0]);
  out.push(`<path class="ink hair" d="M${P1(O)}L${P1(B)}"/>`);
  const lobes: [number, number][] = [
    [0, 1],
    [rad(-34), 0.85],
    [rad(34), 0.85],
    [rad(-68), 0.66],
    [rad(68), 0.66],
  ];
  const reachAt = (a: number) => {
    let m = 0.23;
    for (const [la, reach] of lobes) {
      m = Math.max(m, 0.23 + (reach - 0.23) * Math.exp(-(Math.abs((a - la) / 0.21) ** 1.8)));
    }
    return m;
  };
  const pts = sample((t) => {
    const a = rad(-86) + t * rad(172);
    return add(B, polar(reachAt(a) * L * 0.92, dir + a));
  }, 24);
  const outline = [B, ...pts];
  shape(out, r, outline, tone(r, { spread: 0.06, hue: 10 }), { deep: 0.42, deepAbout: toW([0.42 * L, 0]), ink: false });
  let veins = "";
  for (const [la, reach] of lobes) {
    veins += `M${P1(B)}L${P1(add(B, polar(reach * L * 0.8, dir + la)))}`;
  }
  out.push(`<path class="ink hair" d="${closed(outline)}"/><path class="ink hair vein" d="${veins}"/>`);
}

function hawthornThorn(out: Out, P: Pt, dir: number, len: number) {
  const nrm = polar(2.1, dir + rad(90));
  const tip = add(P, polar(len, dir));
  const pts = [add(P, nrm), tip, sub(P, nrm)];
  out.push(`<path class="wash bark"${vars({ pc: "--bark-hawthorn" })} d="${closed(pts)}"/><path class="ink thin" d="M${P1(pts[0])}L${P1(tip)}L${P1(pts[2])}"/>`);
}

export function hawthornCorymb(out: Out, r: Rng, T: Pt, dir: number, R: number) {
  let pedicels = "";
  let petals = "";
  let stamens = "";
  let anthers = "";
  let centers = "";
  const spots: [number, number, number][] = [
    [0.52, -0.68, 0.34],
    [0.72, -0.34, 0.38],
    [0.82, 0, 0.4],
    [0.72, 0.34, 0.38],
    [0.52, 0.68, 0.34],
    [0.42, -0.2, 0.35],
    [0.42, 0.22, 0.35],
  ];
  for (const [reach, da, sz] of spots) {
    const C = add(T, polar(R * reach, dir + da));
    pedicels += `M${P1(T)}L${P1(C)}`;
    const fR = R * sz;
    const spin = r() * TAU;
    for (let k = 0; k < 5; k++) {
      const a = spin + (k / 5) * TAU;
      petals += closed(roundPts(add(C, polar(fR * 0.56, a)), fR * 0.48, fR * 0.45, a, 6));
    }
    centers += closed(roundPts(C, fR * 0.18, fR * 0.18, 0, 6));
    for (let k = 0; k < 8; k++) {
      const a = spin + (k / 8) * TAU + 0.15;
      const tip = add(C, polar(fR * 0.48, a));
      stamens += `M${P1(C)}L${P1(tip)}`;
      anthers += closed(roundPts(tip, 1.5, 1.2, a, 5));
    }
  }
  out.push(`<path class="ink hair" d="${pedicels}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-hawthorn", spread: 0.02 }))} d="${petals}"/><path class="ink hair petal-edge" d="${petals}"/>`);
  out.push(`<path class="wash"${vars({ pc: "--pl-hawthorn", dl: 0.16 })} d="${centers}"/>`);
  out.push(`<path class="ink hair" d="${stamens}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--anther-hawthorn", spread: 0.03 }))} d="${anthers}"/>`);
}

export function hawthornHaws(out: Out, r: Rng, T: Pt, dir: number, sc = 1) {
  let stalks = "";
  let berries = "";
  let crowns = "";
  const offsets: [number, number][] = [
    [-0.55, 18],
    [-0.22, 25],
    [0.08, 28],
    [0.38, 23],
    [0.64, 17],
  ];
  for (const [da, dist] of offsets) {
    const a = dir + da;
    const C = add(T, polar(dist * sc, a));
    stalks += `M${P1(T)}L${P1(C)}`;
    // Ovoid crimson-red pome (haw) crowned with a tiny dark remnant of calyx teeth
    berries += closed(roundPts(C, 6.4 * sc, 5.2 * sc, a, 8));
    const apex = add(C, polar(6.2 * sc, a));
    crowns += `M${P1(add(apex, polar(1.8 * sc, a + 0.9)))}L${P1(apex)}L${P1(add(apex, polar(1.8 * sc, a - 0.9)))}`;
  }
  out.push(`<path class="ink hair" d="${stalks}"/>`);
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--berry-haw", spread: 0.04 }))} d="${berries}"/><path class="ink hair" d="${berries}"/>`);
  out.push(`<path class="ink thin" d="${crowns}"/>`);
}

export function hawthorn(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0.02, 0.18];
  const main = grow(out, gm[0], gm[1], () =>
    limb(
      out,
      r,
      [at([-24, 14]), at([58, -28]), at([132, -16]), at([218, -64]), at([304, -52]), at([378, -92])],
      { w0: 30, w1: 7.5, cap: "taper", swell: [[0.34, 0.12], [0.68, 0.1]], ...HAW_BARK },
    ),
  );
  const parent = { res: main, g: gm };
  const forks = [
    branch(out, r, parent, 0.3, [[36, -48], [94, -104], [164, -132]], 0.07, { w0: 15, w1: 4.5, cap: "taper", ...HAW_BARK }),
    branch(out, r, parent, 0.54, [[46, 20], [116, 34], [184, 18]], 0.07, { w0: 13, w1: 4, cap: "taper", ...HAW_BARK }),
    branch(out, r, parent, 0.76, [[32, -38], [84, -82], [138, -106]], 0.07, { w0: 10.5, w1: 3.5, cap: "taper", ...HAW_BARK }),
  ];

  for (const [j, b] of [parent, ...forks].entries()) {
    const n = b.res.n;
    for (let i = Math.round(n * 0.24), s = j % 2 ? 1 : -1; i <= n - 2; i += 9 + Math.floor(r() * 3), s = -s) {
      const P = b.res.pts[i];
      const d = angleOf(b.res.pts, i);
      const g = gate(b.res, b.g, i);
      // Sharp straight axillary thorn staying all year
      part(out, g + 0.01, P, () => hawthornThorn(out, P, d + s * rad(54), 15 + r() * 5));

      const twigA = d + s * rad(32 + r() * 14);
      const twigLen = 42 + r() * 18;
      const twig = branch(out, r, b, i / n, [polar(twigLen * 0.5, twigA), polar(twigLen, twigA - s * 0.16)], 0.04, {
        w0: 4.2,
        w1: 1.6,
        cap: "taper",
        ...HAW_BARK,
      });
      const tn = twig.res.n;
      const tTip = twig.res.pts[tn];
      const tDir = angleOf(twig.res.pts, tn);
      const tGate = gate(twig.res, twig.g, tn);

      // Deeply lobed hawthorn leaves (`Math.max(gate(...) + 0.015, 0.14..0.30)`)
      for (const [k, tu] of [
        [0, 0.38],
        [1, 0.72],
        [2, 0.96],
      ] as const) {
        const ti = Math.round(tn * tu);
        const LP = twig.res.pts[ti];
        const lGate = gate(twig.res, twig.g, ti);
        const la = angleOf(twig.res.pts, Math.min(ti, tn - 1)) + (k % 2 ? 1 : -1) * rad(46);
        part(out, Math.max(lGate + 0.015, 0.14 + k * 0.025 + r() * 0.02), LP, () => hawthornLeaf(out, r, LP, la, 34 + r() * 9), hawShed(LP));
      }
      // Snowy flat-topped corymb of white May blossoms (`Math.max(gate(...) + 0.02, 0.26..0.46)`)
      part(out, Math.max(tGate + 0.02, 0.26 + (i % 4) * 0.015), tTip, () => hawthornCorymb(out, r, tTip, tDir - rad(14), 38 + r() * 8), mayBlossomFall(tTip));
      // Crimson-red haws (`0.56..1.0`) persist on bare thorny twigs all winter
      part(out, Math.max(tGate + 0.02, 0.56 + (i % 3) * 0.01), tTip, () => hawthornHaws(out, r, tTip, rad(78 + s * 14), 1));
    }
  }
}

export function hawthornDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-150, 40], [-30, 5], [75, -20], [155, -35]], { w0: 11, w1: 4.5, cap: "taper", ...HAW_BARK });
  for (const [u, s] of [
    [0.28, -1],
    [0.62, 1],
    [0.86, -1],
  ] as const) {
    const i = Math.round(twig.n * u);
    hawthornThorn(out, twig.pts[i], angleOf(twig.pts, i) + s * rad(56), 28);
  }
  hawthornLeaf(out, r, twig.pts[Math.round(twig.n * 0.25)], rad(-125), 76);
  hawthornLeaf(out, r, twig.pts[Math.round(twig.n * 0.55)], rad(45), 72);
  hawthornCorymb(out, r, twig.pts[Math.round(twig.n * 0.48)], rad(-82), 92);
  hawthornHaws(out, r, twig.pts[Math.round(twig.n * 0.82)], rad(68), 2.1);
}

// ---------------------------------------------------------------------------
// 4. English holly (Ilex aquifolium): smooth pale silver-grey branches (`--bark-holly`), evergreen
// thick glossy dark-green undulating leaves armed with 5–6 sharp alternating marginal spines per
// side, small 4-petalled white May flowers (`0.24..0.44`), and dense axillary clusters of bright
// scarlet winter berries (`--berry-holly`, `0.54..1.0`).

const HOLLY_BARK = { pc: "--bark-holly" };

export function hollyLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const pet = 0.07 * L;
  const B = toW([pet, 0]);
  out.push(`<path class="ink thin" d="M${P1(O)}L${P1(B)}"/>`);

  // Undulating wavy margin armed with 5 sharp divaricate spines per side + terminal spine
  const bays = 5;
  const up: Pt[] = [B];
  const dn: Pt[] = [B];
  const spineTips: [Pt, Pt][] = [];
  for (let b = 0; b < bays; b++) {
    const u0 = b / bays;
    const u1 = (b + 1) / bays;
    const uMid = (u0 + u1) * 0.5;
    const envMid = Math.sin(Math.PI * uMid ** 0.78);
    const env1 = b === bays - 1 ? 0 : Math.sin(Math.PI * u1 ** 0.78);
    // Scalloped sinus dipping inward between two sharp spine cusps
    const xMid = (0.07 + uMid * 0.9) * L;
    const wSinus = 0.21 * L * envMid;
    const xPeak = (0.07 + u1 * 0.9) * L;
    const wPeak = b === bays - 1 ? 0 : 0.34 * L * env1;

    up.push(toW([xMid, -wSinus]));
    dn.push(toW([xMid, wSinus]));
    if (b < bays - 1) {
      const pUp = toW([xPeak + 0.02 * L, -wPeak]);
      const pDn = toW([xPeak + 0.02 * L, wPeak]);
      up.push(pUp);
      dn.push(pDn);
      spineTips.push([pUp, toW([xPeak + 0.065 * L, -wPeak * 1.18])]);
      spineTips.push([pDn, toW([xPeak + 0.065 * L, wPeak * 1.18])]);
    }
  }
  const apex = toW([1.03 * L, 0]);
  spineTips.push([apex, toW([1.1 * L, 0])]);

  const outline = [...up, apex, ...dn.slice(1).reverse()];
  shape(out, r, outline, tone(r, { spread: 0.05, hue: 8 }), { deep: 0.56, deepAbout: toW([0.45 * L, 0]) });

  // Glossy evergreen surface highlight and pale marginal rim
  const shinePts = [toW([0.2 * L, -0.05 * L]), toW([0.46 * L, -0.15 * L]), toW([0.74 * L, -0.1 * L]), toW([0.52 * L, -0.03 * L])];
  out.push(`<path class="wash shine" d="${closed(shinePts)}"/>`);

  let needles = `M${P1(B)}L${P1(apex)}`;
  for (const [p0, p1] of spineTips) needles += `M${P1(p0)}L${P1(p1)}`;
  out.push(`<path class="ink thin" style="stroke:var(--vein-ivy)" d="M${P1(B)}L${P1(toW([0.94 * L, 0]))}"/><path class="ink thin" d="${needles}"/>`);
}

function hollyFlowers(out: Out, r: Rng, P: Pt, sc = 1) {
  let petals = "";
  let centers = "";
  for (let m = 0; m < 4; m++) {
    const a = (m / 4) * TAU + 0.3;
    const C = add(P, polar(6.5 * sc, a));
    for (let j = 0; j < 4; j++) {
      const fa = a + (j / 4) * TAU;
      petals += closed(roundPts(add(C, polar(3.2 * sc, fa)), 2.8 * sc, 2.1 * sc, fa, 6));
    }
    centers += closed(roundPts(C, 1.3 * sc, 1.3 * sc, 0, 5));
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-hawthorn", spread: 0.02 }))} d="${petals}"/><path class="ink hair petal-edge" d="${petals}"/>`);
  out.push(`<path class="wash"${vars({ pc: "--catkin-hazel" })} d="${centers}"/>`);
}

export function hollyBerries(out: Out, r: Rng, P: Pt, sc = 1) {
  let berries = "";
  let glints = "";
  let dots = "";
  // Tight axillary cluster of 7 globose bright scarlet drupes
  const ring: [number, number][] = [
    [-6.5, -4],
    [0, -7],
    [6.5, -3.5],
    [-7, 3],
    [6.5, 3.5],
    [-2.5, 6.5],
    [2.5, 0],
  ];
  for (const [dx, dy] of ring) {
    const C = add(P, [dx * sc, dy * sc]);
    berries += closed(roundPts(C, 5.4 * sc, 5.2 * sc, 0, 8));
    glints += closed(roundPts(add(C, [-1.6 * sc, -1.8 * sc]), 1.5 * sc, 1.1 * sc, -0.4, 5));
    dots += `M${P1(add(C, [1.2 * sc, 1.4 * sc]))}l.8 .5`;
  }
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--berry-holly", spread: 0.03 }))} d="${berries}"/><path class="ink thin" d="${berries}"/>`);
  out.push(`<path class="wash shine" d="${glints}"/><path class="ink thin" d="${dots}"/>`);
}

export function holly(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0.02, 0.18];
  const main = grow(out, gm[0], gm[1], () =>
    limb(out, r, [at([-24, 10]), at([68, -16]), at([168, -42]), at([264, -58]), at([348, -68])], {
      w0: 26,
      w1: 6.5,
      cap: "taper",
      ...HOLLY_BARK,
    }),
  );
  const parent = { res: main, g: gm };
  const shoots = [
    branch(out, r, parent, 0.28, [[38, -44], [96, -92], [162, -124]], 0.07, { w0: 12, w1: 4, cap: "taper", ...HOLLY_BARK }),
    branch(out, r, parent, 0.52, [[44, 18], [112, 28], [176, 18]], 0.07, { w0: 11, w1: 3.8, cap: "taper", ...HOLLY_BARK }),
    branch(out, r, parent, 0.74, [[34, -34], [84, -68], [134, -88]], 0.07, { w0: 9, w1: 3.2, cap: "taper", ...HOLLY_BARK }),
  ];

  for (const [j, b] of [parent, ...shoots].entries()) {
    const n = b.res.n;
    for (const [k, u] of [
      [0, 0.3],
      [1, 0.52],
      [2, 0.74],
      [3, 0.94],
    ] as const) {
      if (j === 0 && k === 0) continue;
      const i = Math.round(n * u);
      const P = b.res.pts[i];
      const d = angleOf(b.res.pts, Math.min(i, n - 1));
      const g = gate(b.res, b.g, i);
      // Evergreen alternating spiny leaves stay all year (`gate(...) + 0.015`)
      for (const side of [-1, 1]) {
        const la = d + side * rad(46 + (k % 2) * 10) + (r() - 0.5) * 0.14;
        part(out, g + 0.015 + (side > 0 ? 0.006 : 0), P, () => hollyLeaf(out, r, P, la, 56 + r() * 14));
      }
      // Small white 4-petalled May flowers in leaf axils (`0.24..0.44`)
      part(out, Math.max(g + 0.015, 0.24 + k * 0.012), P, () => hollyFlowers(out, r, P, 1), 0.44 + r() * 0.02);
      // Dense axillary clusters of bright scarlet winter berries (`0.54..1.0`)
      part(out, Math.max(g + 0.015, 0.54 + k * 0.012), P, () => hollyBerries(out, r, P, 1.05));
    }
  }
}

export function hollyDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-140, 35], [-20, 5], [100, -20], [150, -30]], { w0: 12, w1: 5, cap: "taper", ...HOLLY_BARK });
  for (const [u, deg, L] of [
    [0.28, -128, 108],
    [0.34, 48, 102],
    [0.64, -52, 114],
    [0.72, 34, 106],
    [0.96, -8, 98],
  ] as const) {
    hollyLeaf(out, r, twig.pts[Math.round(twig.n * u)], rad(deg), L);
  }
  hollyBerries(out, r, twig.pts[Math.round(twig.n * 0.34)], 1.9);
  hollyBerries(out, r, twig.pts[Math.round(twig.n * 0.7)], 2.1);
}

// ---------------------------------------------------------------------------
// 5. English ivy (Hedera helix): plunging from the top canopy on a gnarled mossy limb
// (`base = [0, 0]`). Evergreen all year, showing both phases of shoot dimorphism:
//   (1) Rootlet-clinging trailing curtains with alternate palmately 5-lobed dark-green juvenile
//       leaves marked with pale whitish-green veins (`--vein-ivy`).
//   (2) Arching adult fertile shoots with unlobed diamond-ovate entire leaves crowned by spherical
//       pom-pom umbels of chartreuse-yellow autumn flowers (`--flower-ivy`, `0.62..0.82`, `fade`)
//       ripening into spherical clusters of dull ink-black winter berries (`--berry-ivy`,
//       `0.76..1.0` and early-spring `0.04..0.24`).

export function ivyJuvenileLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  // Palmately 5-lobed dark-green juvenile leaf with radiating pale whitish-green veins (`--vein-ivy`)
  const toW = (p: Pt) => add(O, rot(p, dir));
  const lobes: [number, number][] = [
    [0, 1],
    [rad(-54), 0.78],
    [rad(54), 0.78],
    [rad(-112), 0.52],
    [rad(112), 0.52],
  ];
  const reachAt = (a: number) => {
    let m = 0.36;
    for (const [la, reach] of lobes) {
      m = Math.max(m, 0.36 + (reach - 0.36) * Math.exp(-(Math.abs((a - la) / 0.36) ** 2.3)));
    }
    return m;
  };
  const pts = sample((t) => {
    const a = -Math.PI + 0.4 + t * (TAU - 0.8);
    return add(O, polar(reachAt(a) * L, dir + a));
  }, 24);
  const outline = [...pts, toW([0.05 * L, 0])];
  shape(out, r, outline, tone(r, { dl: -0.02, spread: 0.05, hue: 8 }), { deep: 0.5, deepAbout: toW([0.3 * L, 0]), ink: false });
  out.push(`<path class="ink hair" d="${closed(outline)}"/>`);
  let paleVeins = "";
  for (const [la, reach] of lobes) {
    paleVeins += `M${P1(O)}L${P1(add(O, polar(L * reach * 0.84, dir + la)))}`;
  }
  out.push(`<path class="ink thin" style="stroke:var(--vein-ivy);opacity:.85" d="${paleVeins}"/>`);
}

export function ivyAdultLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  // Unlobed diamond-ovate entire leaf of the fertile adult shoot
  blade(out, r, O, dir, L, {
    W: 0.56,
    prof: (s) => Math.sin(Math.PI * Math.min(1, s) ** 0.72) ** 1.15,
    v: tone(r, { dl: 0.03, spread: 0.04, hue: 8 }),
    deep: 0.45,
    shine: true,
    rib: "ink thin",
    hairline: true,
  });
  const tip = add(O, polar(L * 0.88, dir));
  out.push(`<path class="ink hair" style="stroke:var(--vein-ivy);opacity:.8" d="M${P1(O)}L${P1(tip)}"/>`);
}

export function ivyUmbel(out: Out, r: Rng, C: Pt, R: number, phase: "flower" | "berry") {
  let rays = "";
  let balls = "";
  let tops = "";
  const count = 16;
  for (let k = 0; k < count; k++) {
    const a = (k / count) * TAU + (k % 2) * 0.14;
    const reach = k < 11 ? R * 0.86 : R * 0.44;
    const P = add(C, polar(reach, a));
    rays += `M${P1(C)}L${P1(P)}`;
    if (phase === "flower") {
      // Globose chartreuse-yellow autumn flower with tiny radiating stamens
      balls += closed(roundPts(P, 3.8, 3.8, a, 6));
      tops += `M${P1(add(P, polar(-2.4, a)))}L${P1(add(P, polar(2.4, a)))}M${P1(add(P, polar(-2.4, a + 1.57)))}L${P1(add(P, polar(2.4, a + 1.57)))}`;
    } else {
      // Dull ink-black winter berry with tiny apical disc ring
      balls += closed(roundPts(P, 4.4, 4.2, a, 7));
      tops += closed(roundPts(add(P, polar(1.5, a)), 1.4, 1.1, a, 5));
    }
  }
  out.push(`<path class="ink hair" style="stroke:var(--stem-green)" d="${rays}"/>`);
  if (phase === "flower") {
    out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-ivy", spread: 0.04 }))} d="${balls}"/><path class="ink hair" d="${balls}"/><path class="ink hair" style="stroke:var(--flower-ivy)" d="${tops}"/>`);
  } else {
    out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--berry-ivy", spread: 0.03 }))} d="${balls}"/><path class="ink hair" d="${balls}"/><path class="wash"${vars({ pc: "--bark-holly", dl: -0.1 })} d="${tops}"/>`);
  }
}

export function ivy(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gb: [number, number] = [0.02, 0.18];
  // Gnarled mossy trunk/limb plunging steeply from the upper canopy
  const trunk = grow(out, gb[0], gb[1], () => {
    const res = limb(
      out,
      r,
      [at([-18, -14]), at([6, 26]), at([32, 68]), at([64, 108]), at([95, 145])],
      { w0: 28, w1: 13, cap: "blunt", swell: [[0.44, 0.12]], ...OAK_BARK },
    );
    let moss = "";
    for (const u of [0.24, 0.54, 0.82]) {
      const i = Math.round(res.n * u);
      const p = lerp(res.L[i], res.pts[i], 0.35);
      moss += closed(roundPts(p, 22, 5.5, angleOf(res.pts, i), 10));
    }
    out.push(`<path class="wash felt"${vars(tone(r, { pc: "--pl-hartstongue", dl: -0.04, spread: 0.04 }))} d="${moss}"/>`);
    return res;
  });
  const parent = { res: trunk, g: gb };

  // 1. Three long trailing juvenile 5-lobed ivy curtains cascading down to `y = 380..490` (`g = 0.06..0.28`)
  for (const [u, dx, len, sway, span] of [
    [0.18, -42, 395, -22, 0.16],
    [0.52, -8, 415, 18, 0.16],
    [0.84, 24, 272, -16, 0.11],
  ] as const) {
    const trail = branch(
      out,
      r,
      parent,
      u,
      [
        [dx * 0.45 + sway * 0.4, len * 0.34],
        [dx * 0.8 - sway * 0.3, len * 0.68],
        [dx + sway * 0.4, len],
      ],
      span,
      { w0: 4.6, w1: 1.8, cap: "taper", pc: "--bark-hazel" },
    );
    const tn = trail.res.n;
    for (let i = 4, k = 0; i <= tn; i += 5, k++) {
      const P = trail.res.pts[i];
      const tang = angleOf(trail.res.pts, Math.min(i, tn - 1));
      const g = gate(trail.res, trail.g, i);
      const side = k % 2 ? 1 : -1;
      const la = tang + side * rad(46 + (r() - 0.5) * 16);
      const L = (40 - (i / tn) * 12) + r() * 6;
      part(out, g + 0.015, P, () => {
        // Aerial rootlets along the upper stem
        if (i < tn * 0.45) {
          let roots = "";
          for (const d of [-3, 0, 3]) roots += `M${P1(add(P, [0, d]))}L${P1(add(P, [-side * 6, d + 3]))}`;
          out.push(`<path class="ink hair" d="${roots}"/>`);
        }
        ivyJuvenileLeaf(out, r, P, la, L);
      });
    }
  }

  // 2. Two fertile unlobed adult ivy branches arching outward from the plunging trunk
  for (const [u, dx, dy] of [
    [0.34, -76, 86],
    [0.68, 82, 78],
  ] as const) {
    const adult = branch(
      out,
      r,
      parent,
      u,
      [
        [dx * 0.55, dy * 0.48],
        [dx, dy],
      ],
      0.06,
      { w0: 5.5, w1: 2.8, cap: "taper", pc: "--bark-holly" },
    );
    const an = adult.res.n;
    for (const [k, au] of [
      [0, 0.34],
      [1, 0.6],
      [2, 0.84],
    ] as const) {
      const ai = Math.round(an * au);
      const P = adult.res.pts[ai];
      const ad = angleOf(adult.res.pts, ai);
      const g = gate(adult.res, adult.g, ai);
      for (const s of [-1, 1]) {
        part(out, g + 0.015, P, () => ivyAdultLeaf(out, r, P, ad + s * rad(52 - k * 5), 42 - k * 3));
      }
    }
    const tip = adult.res.pts[an];
    const tDir = angleOf(adult.res.pts, an);
    const gTip = gate(adult.res, adult.g, an);
    const umbelSpots: [Pt, number][] = [
      [add(tip, polar(22, tDir)), 21],
      [add(tip, polar(18, tDir - 0.65)), 16],
      [add(tip, polar(18, tDir + 0.65)), 16],
    ];
    // Early-spring leftover winter berries (`0.04..0.24`), chartreuse autumn flower umbels (`0.62..0.82`, fade),
    // and winter ink-black berry umbels (`0.76..1.0`)
    const drawPanicle = (phase: "flower" | "berry") => {
      for (const [C, R] of umbelSpots) {
        out.push(`<path class="ink thin" style="stroke:var(--stem-green)" d="M${P1(tip)}L${P1(C)}"/>`);
        ivyUmbel(out, r, C, R, phase);
      }
    };
    part(out, Math.max(0.04, gTip + 0.01), tip, () => drawPanicle("berry"), 0.24, true);
    part(out, 0.76, tip, () => drawPanicle("berry"));
    part(out, 0.62, tip, () => drawPanicle("flower"), 0.82, true);
  }
}

export function ivyDetail(out: Out, r: Rng) {
  const stem = limb(out, r, [[-140, 70], [-30, 20], [55, -25]], { w0: 9, w1: 4.5, cap: "taper", pc: "--bark-holly" });
  ivyJuvenileLeaf(out, r, [-110, 58], rad(132), 78);
  ivyJuvenileLeaf(out, r, [-70, 38], rad(-118), 74);
  ivyAdultLeaf(out, r, [-10, 10], rad(-64), 82);
  ivyAdultLeaf(out, r, [18, -5], rad(48), 78);
  const tip = stem.pts[stem.n];
  ivyUmbel(out, r, add(tip, [52, -38]), 42, "flower");
  ivyUmbel(out, r, add(tip, [64, 34]), 38, "berry");
}

// ---------------------------------------------------------------------------
// 6. Old man's beard (Clematis vitalba): scrambling ribbed woody lianas plunging and arching from
// the top canopy (`base = [0, 0]`). 6-angled ribbed buff stems (`--acorn-cup`) climbing by
// tendril-coiled petioles, opposite 5-leaflet odd-pinnate leaves, loose summer panicles of
// greenish-cream 4-tepaled blossoms (`--flower-clematis`, `0.42..0.66`), exploding in autumn and
// winter (`0.64..1.0`) into billowing silver-white feathery style wigs (`--plume-clematis`).

const clematisShed = fallsAt(0.73, 0.08);
const clematisFlowerFall = fallsAt(0.64, 0.03);

export function clematisLeaf(out: Out, r: Rng, T: Pt, dir: number, L: number) {
  // Tendril-coiled petiole that loops as it grips the support, bearing 5 ovate-cordate leaflets
  const mid = add(T, polar(L * 0.48, dir + 0.16));
  const tip = add(T, polar(L, dir));
  const rachis = sample(quad(T, mid, tip), 6);
  // Coiled petiole tendril loop near base
  const loopC = add(rachis[2], polar(7, dir + rad(90)));
  const loop = roundPts(loopC, 5.5, 4.5, dir, 8);
  out.push(`<path class="ink thin" style="stroke:var(--stem-green)" d="${line(rachis)}M${P1(rachis[2])}${through(loop)}"/>`);

  const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
  let petioles = "";
  for (const idx of [2, 4]) {
    const P = rachis[idx];
    const tang = angleOf(rachis, idx);
    for (const s of [-1, 1]) {
      const pPet = add(P, polar(L * 0.12, tang + s * rad(68)));
      petioles += `M${P1(P)}L${P1(pPet)}`;
      blades.push({ O: pPet, dir: tang + s * rad(64), L: L * 0.34, W: 0.52 });
    }
  }
  blades.push({ O: tip, dir: angleOf(rachis, 6), L: L * 0.38, W: 0.52 });
  out.push(`<path class="ink hair" style="stroke:var(--stem-green)" d="${petioles}"/>`);
  bladeBunch(out, blades, tone(r, { spread: 0.05, hue: 8 }));
}

export function clematisPanicle(out: Out, r: Rng, T: Pt, dir: number, R: number) {
  let stalks = "";
  let tepals = "";
  let stamens = "";
  const spots: [number, number, number][] = [
    [0.48, -0.52, 0.36],
    [0.78, -0.22, 0.42],
    [0.86, 0.16, 0.4],
    [0.54, 0.48, 0.36],
  ];
  for (const [reach, da, sz] of spots) {
    const C = add(T, polar(R * reach, dir + da));
    stalks += `M${P1(T)}L${P1(C)}`;
    const fR = R * sz;
    const spin = r() * TAU;
    // 4 spreading oblong-lanceolate greenish-cream tepals + tuft of cream stamens
    for (let k = 0; k < 4; k++) {
      const a = spin + (k / 4) * TAU;
      tepals += closed(roundPts(add(C, polar(fR * 0.56, a)), fR * 0.5, fR * 0.22, a, 7));
    }
    for (let k = 0; k < 10; k++) {
      const a = spin + (k / 10) * TAU;
      stamens += `M${P1(C)}L${P1(add(C, polar(fR * 0.46, a)))}`;
    }
  }
  out.push(`<path class="ink hair" d="${stalks}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-clematis", spread: 0.03 }))} d="${tepals}"/><path class="ink hair petal-edge" d="${tepals}"/>`);
  out.push(`<path class="ink hair" style="stroke:var(--plume-clematis)" d="${stamens}"/>`);
}

export function clematisWig(out: Out, r: Rng, T: Pt, dir: number, R: number) {
  // Billowing silver-white "old man's beard" seed-head ball: swirling S-curved feathery plumose styles
  const heads: [Pt, number][] = [
    [add(T, polar(R * 0.45, dir - 0.36)), R * 0.58],
    [add(T, polar(R * 0.62, dir + 0.22)), R * 0.66],
    [add(T, polar(R * 0.32, dir + 0.05)), R * 0.52],
  ];
  let cloud = "";
  let plumes = "";
  let barbs = "";
  let achenes = "";
  for (const [C, hR] of heads) {
    cloud += closed(roundPts(C, hR * 0.82, hR * 0.76, r() * 3, 12));
    achenes += closed(roundPts(C, hR * 0.16, hR * 0.16, 0, 6));
    const n = 16;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + (r() - 0.5) * 0.15;
      const len = hR * (0.86 + r() * 0.28);
      const mid1 = add(C, polar(len * 0.46, a + 0.34));
      const tip = add(C, polar(len, a - 0.18));
      plumes += `M${P1(C)}Q${P1(mid1)} ${P1(tip)}`;
      // Fine silky lateral feather-hairs along the style
      for (const f of [0.45, 0.74]) {
        const p = lerp(C, tip, f);
        barbs += `M${P1(p)}L${P1(add(p, polar(len * 0.22, a + 0.65)))}M${P1(p)}L${P1(add(p, polar(len * 0.2, a - 0.55)))}`;
      }
    }
  }
  out.push(`<path class="wash felt"${vars(tone(r, { pc: "--plume-clematis", spread: 0.02 }))} d="${cloud}"/>`);
  out.push(`<path class="ink hair" style="stroke:var(--plume-clematis);opacity:.9" d="${barbs}"/>`);
  out.push(`<path class="ink thin" style="stroke:var(--plume-clematis)" d="${plumes}"/>`);
  out.push(`<path class="wash"${vars({ pc: "--acorn-cup", dl: -0.06 })} d="${achenes}"/>`);
}

export function oldmansbeard(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Two scrambling ribbed woody lianas plunging and arching from `at([-20, -12])` and `at([20, -12])`
  // down to `y = 360..460` (`g = [0.03, 0.25]`), plus two lateral scrambling shoots.
  const g1: [number, number] = [0.03, 0.22];
  const liana1 = {
    res: grow(out, g1[0], g1[1], () =>
      limb(
        out,
        r,
        [at([-20, -12]), at([-52, 86]), at([-18, 196]), at([-44, 304]), at([-14, 408])],
        { w0: 6.5, w1: 2.2, cap: "taper", pc: "--acorn-cup" },
      ),
    ),
    g: g1,
  };
  const g2: [number, number] = [0.05, 0.25];
  const liana2 = {
    res: grow(out, g2[0], g2[1], () =>
      limb(
        out,
        r,
        [at([20, -12]), at([50, 94]), at([18, 212]), at([42, 334]), at([16, 452])],
        { w0: 6.8, w1: 2.4, cap: "taper", pc: "--acorn-cup" },
      ),
    ),
    g: g2,
  };
  const lat1 = branch(out, r, liana1, 0.34, [[-44, 68], [-76, 152], [-54, 244]], 0.08, {
    w0: 4.8,
    w1: 1.9,
    cap: "taper",
    pc: "--acorn-cup",
  });
  const lat2 = branch(out, r, liana2, 0.36, [[44, 72], [74, 156], [52, 246]], 0.08, {
    w0: 4.8,
    w1: 1.9,
    cap: "taper",
    pc: "--acorn-cup",
  });

  const stems: [{ res: Limb; g: [number, number] }, readonly number[]][] = [
    [liana1, [0.22, 0.5, 0.74, 0.96]],
    [liana2, [0.22, 0.5, 0.74, 0.96]],
    [lat1, [0.46, 0.92]],
    [lat2, [0.46, 0.92]],
  ];

  stems.forEach(([st, knots], j) => {
    const n = st.res.n;
    knots.forEach((u, k) => {
      const i = Math.round(n * u);
      const P = st.res.pts[i];
      const tang = angleOf(st.res.pts, Math.min(i, n - 1));
      const g = gate(st.res, st.g, i);
      // Opposite 5-leaflet pinnate leaves (`Math.max(gate(...) + 0.02, 0.18..0.33)`)
      if (u < 0.9) {
        for (const side of [-1, 1]) {
          const la = tang + side * rad(58 - k * 6);
          part(out, Math.max(g + 0.02, 0.18 + k * 0.03 + j * 0.015), P, () => clematisLeaf(out, r, P, la, 56 - k * 4), clematisShed(P));
        }
      }
      // Summer greenish-cream 4-tepaled flower panicles (`0.42..0.66`)
      const panDir = tang + ((k + j) % 2 ? 1 : -1) * rad(36);
      part(out, Math.max(g + 0.02, 0.42 + k * 0.015 + j * 0.008), P, () => clematisPanicle(out, r, P, panDir, 44 + r() * 8), clematisFlowerFall(P));
      // Billowing silver-white feathery style wigs (`0.64..1.0`) persist all winter
      part(out, Math.max(g + 0.02, 0.64 + k * 0.012 + j * 0.006), P, () => clematisWig(out, r, P, panDir, 48 + r() * 10));
    });
  });
}

export function oldmansbeardDetail(out: Out, r: Rng) {
  const stem = limb(out, r, [[-140, -60], [-20, -10], [95, 35]], { w0: 8, w1: 4, cap: "taper", pc: "--acorn-cup" });
  clematisLeaf(out, r, stem.pts[Math.round(stem.n * 0.28)], rad(118), 115);
  clematisPanicle(out, r, stem.pts[Math.round(stem.n * 0.52)], rad(-65), 95);
  clematisWig(out, r, stem.pts[Math.round(stem.n * 0.88)], rad(-25), 112);
}

// ---------------------------------------------------------------------------
// 7. European honeysuckle / woodbine (Lonicera periclymenum): two clockwise-twining woody
// honeysuckle ropes cascading and swaying downward from the top canopy (`base = [0, 0]`). Opposite
// oval leaves (completely free to the base, never fused into a perfoliate saucer!), terminal whorls
// of long curved two-lipped creamy-yellow and rose-carmine trumpets (`--flower-honeysuckle`,
// `--blush-honeysuckle`, `0.36..0.68`), and tight globose clusters of glossy crimson-red berries
// (`--berry-honeysuckle`, `0.60..0.88`).

const honeysuckleShed = fallsAt(0.75, 0.08);
const honeysuckleFlowerFall = fallsAt(0.65, 0.03);
const honeysuckleBerryFall = fallsAt(0.85, 0.03);

export function honeysuckleLeafPair(out: Out, r: Rng, P: Pt, tang: number, L: number) {
  // Opposite oval-elliptic leaves, strictly separate to the base (short distinct attachment)
  for (const side of [-1, 1]) {
    const a = tang + side * rad(62);
    const B = add(P, polar(3.5, a));
    out.push(`<path class="ink thin" d="M${P1(P)}L${P1(B)}"/>`);
    blade(out, r, B, a, L, {
      W: 0.52,
      prof: (s) => Math.sin(Math.PI * Math.min(1, s) ** 0.78) ** 0.82,
      v: tone(r, { dl: side < 0 ? -0.03 : 0.02, spread: 0.05, hue: 8 }),
      veins: 3,
      deep: 0.42,
      rib: "ink hair",
      hairline: true,
    });
  }
}

export function honeysuckleWhorl(out: Out, r: Rng, T: Pt, dir: number, R: number) {
  // Terminal whorl of 8 long, gracefully curved two-lipped trumpets: rose-carmine tube exterior,
  // creamy-yellow flaring mouth with 4-lobed recurved upper lip, strap lower lip, and long stamens.
  let tubes = "";
  let mouths = "";
  let stamens = "";
  let anthers = "";
  const count = 8;
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1) - 0.5;
    const a = dir + u * rad(154);
    const L = R * (0.88 + (1 - Math.abs(u)) * 0.2);
    const bend = (u >= 0 ? 1 : -1) * 0.28;
    const toW = (x: number, y: number) => add(T, rot([x * L, (y + bend * x * x) * L], a));

    // Slender curving trumpet tube flushed rose-carmine outside
    tubes += closed([
      toW(0, -0.028),
      toW(0.38, -0.042),
      toW(0.74, -0.095),
      toW(0.78, 0),
      toW(0.74, 0.095),
      toW(0.38, 0.042),
      toW(0, 0.028),
    ]);
    // Two-lipped creamy-yellow limb: broad rolled-back upper lip + narrow recurved lower lip
    mouths += closed([
      toW(0.66, -0.06),
      toW(0.88, -0.22),
      toW(1.04, -0.26),
      toW(1.06, -0.11),
      toW(0.84, -0.02),
      toW(1.02, 0.14),
      toW(0.96, 0.23),
      toW(0.72, 0.07),
    ]);
    // Long exserted arching stamens with cream-yellow anthers
    for (const s of [-0.05, 0.03, 0.1]) {
      const tip = toW(1.22, s);
      stamens += `M${P1(toW(0.76, 0))}Q${P1(toW(1.0, s * 0.4))} ${P1(tip)}`;
      anthers += closed(roundPts(tip, 1.8, 0.9, a, 5));
    }
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--blush-honeysuckle", spread: 0.04 }))} d="${tubes}"/><path class="ink hair petal-edge" d="${tubes}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-honeysuckle", spread: 0.04 }))} d="${mouths}"/><path class="ink hair petal-edge" d="${mouths}"/>`);
  out.push(`<path class="ink hair" style="stroke:var(--flower-honeysuckle)" d="${stamens}"/>`);
  out.push(`<path class="wash"${vars({ pc: "--catkin-hazel" })} d="${anthers}"/>`);
}

export function honeysuckleBerries(out: Out, r: Rng, T: Pt, sc = 1) {
  let berries = "";
  let glints = "";
  const offsets: [number, number][] = [
    [-7, -5],
    [0, -8],
    [7, -4.5],
    [-8, 2.5],
    [0, 0],
    [7.5, 3],
    [-3.5, 7.5],
    [3.5, 7.5],
  ];
  for (const [dx, dy] of offsets) {
    const C = add(T, [dx * sc, dy * sc]);
    berries += closed(roundPts(C, 5.2 * sc, 5.2 * sc, 0, 8));
    glints += closed(roundPts(add(C, [-1.5 * sc, -1.6 * sc]), 1.6 * sc, 1.1 * sc, -0.4, 5));
  }
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--berry-honeysuckle", spread: 0.04 }))} d="${berries}"/><path class="ink thin" d="${berries}"/><path class="wash shine" d="${glints}"/>`);
}

export function honeysuckle(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Two clockwise-twining woody honeysuckle ropes cascading and swaying downward from
  // `at([-15, -12])` and `at([18, -12])` down to `y = 350..450` (`g = [0.03, 0.25]`).
  const drawTwiningRope = (ctrl: Pt[], g: [number, number], w0: number, w1: number) => {
    const res = grow(out, g[0], g[1], () => {
      const main = limb(out, r, ctrl, { w0, w1, cap: "taper", pc: "--acorn-nut" });
      // Secondary clockwise-twining strand spiralling around the main woody rope
      const coilPts = sample((t) => {
        const idx = Math.min(main.n, Math.round(t * main.n));
        const p = main.pts[idx];
        const a = angleOf(main.pts, idx) + Math.PI / 2;
        return add(p, polar(Math.sin(t * TAU * 3.5) * 4.2, a));
      }, 28);
      out.push(`<path class="ink mid" style="stroke:var(--bark-hazel)" d="${line(coilPts)}"/>`);
      return main;
    });
    return { res, g };
  };

  const rope1 = drawTwiningRope(
    [at([-15, -12]), at([-44, 82]), at([-12, 184]), at([-36, 278]), at([-18, 368])],
    [0.03, 0.22],
    5.8,
    2.2,
  );
  const rope2 = drawTwiningRope(
    [at([18, -12]), at([46, 94]), at([14, 206]), at([38, 326]), at([20, 442])],
    [0.05, 0.25],
    6.2,
    2.4,
  );
  const lat1 = branch(out, r, rope1, 0.44, [[-42, 58], [-68, 128]], 0.06, {
    w0: 4.2,
    w1: 1.8,
    cap: "taper",
    pc: "--acorn-nut",
  });
  const lat2 = branch(out, r, rope2, 0.46, [[42, 62], [68, 134]], 0.06, {
    w0: 4.2,
    w1: 1.8,
    cap: "taper",
    pc: "--acorn-nut",
  });

  const shoots: [{ res: Limb; g: [number, number] }, readonly number[]][] = [
    [rope1, [0.18, 0.36, 0.64, 0.86]],
    [rope2, [0.18, 0.36, 0.64, 0.86]],
    [lat1, [0.45, 0.84]],
    [lat2, [0.45, 0.84]],
  ];

  shoots.forEach(([rp, knots], j) => {
    const n = rp.res.n;
    knots.forEach((u, k) => {
      const i = Math.round(n * u);
      const P = rp.res.pts[i];
      const tang = angleOf(rp.res.pts, Math.min(i, n - 1));
      const g = gate(rp.res, rp.g, i);
      part(out, Math.max(g + 0.02, 0.16 + k * 0.025 + j * 0.015), P, () => honeysuckleLeafPair(out, r, P, tang, 38 - k * 2.5 + r() * 5), honeysuckleShed(P));
    });
    const tip = rp.res.pts[n];
    const tDir = angleOf(rp.res.pts, n);
    const gTip = gate(rp.res, rp.g, n);
    // Terminal whorl of rose-and-cream two-lipped trumpets (`0.36..0.68`)
    part(out, Math.max(gTip + 0.02, 0.36 + j * 0.015), tip, () => honeysuckleWhorl(out, r, tip, tDir, 54 + r() * 8), honeysuckleFlowerFall(tip));
    // Tight globose cluster of glossy crimson berries (`0.60..0.88`)
    part(out, Math.max(gTip + 0.02, 0.6 + j * 0.01), tip, () => honeysuckleBerries(out, r, tip, 1.1), honeysuckleBerryFall(tip));
  });
}

export function honeysuckleDetail(out: Out, r: Rng) {
  const stem = limb(out, r, [[-150, 50], [-40, 20], [50, -5]], { w0: 8, w1: 4.5, cap: "taper", pc: "--acorn-nut" });
  honeysuckleLeafPair(out, r, stem.pts[Math.round(stem.n * 0.34)], angleOf(stem.pts, Math.round(stem.n * 0.34)), 68);
  honeysuckleLeafPair(out, r, stem.pts[Math.round(stem.n * 0.74)], angleOf(stem.pts, Math.round(stem.n * 0.74)), 62);
  honeysuckleWhorl(out, r, stem.pts[stem.n], rad(-12), 115);
  honeysuckleBerries(out, r, add(stem.pts[Math.round(stem.n * 0.34)], [0, 52]), 1.85);
}

// ---------------------------------------------------------------------------
// 8. Bracken (Pteridium aquilinum): stiffly erect grooved stems rising from `base = [0, 0]`,
// unrolling in spring from silver-furry shepherd's-crook fiddlehead crosiers into broad horizontal
// triangular 2–3-pinnate fronds (`0.22..0.85`, turning glowing butter-gold and copper-russet in
// October via `--pl-bracken-autumn`), collapsing in winter (`0.80..1.0`) into low angled
// bronze-russet heaps.

export function brackenCrosier(out: Out, r: Rng, T: Pt, dir: number, R: number) {
  // Shepherd's-crook coiled fiddlehead felted in silver-grey hair
  const pts: Pt[] = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const a = dir + u * TAU * 1.35;
    const radU = R * (1 - u * 0.72);
    pts.push(add(add(T, polar(R * 0.75, dir - 0.35)), polar(radU, a + Math.PI)));
  }
  stalk(out, (t) => pts[Math.round(t * steps)], R * 0.36, R * 0.16, tone(r, { pc: "--bark-holly", dl: 0.08, spread: 0.03 }), steps);
}

export function brackenFrond(out: Out, r: Rng, T: Pt, dir: number, W: number, H: number, v?: Tone) {
  // Broad horizontal-tiered triangular 2–3-pinnate frond: central rachis + opposite pinna arms
  // clothed in oblong-lobed pinnules.
  const tip = add(T, polar(H, dir));
  const rachis = sample(quad(T, add(lerp(T, tip, 0.5), [0, -H * 0.06]), tip), 10);
  let axes = line(rachis);
  const backPinnules: { O: Pt; dir: number; L: number; W: number }[] = [];
  const frontPinnules: { O: Pt; dir: number; L: number; W: number }[] = [];

  const pairs = 6;
  for (let k = 0; k < pairs; k++) {
    const u = 0.08 + (k / (pairs - 1)) * 0.82;
    const P = rachis[Math.round(u * 10)];
    // Triangular envelope: lowest pair is widest (`W * 0.56`), tapering up to the apex
    const pinnaLen = W * 0.56 * (1 - u * 0.78) * (k === 0 ? 0.96 : 1);
    for (const side of [-1, 1]) {
      const pa = dir + side * rad(72 - k * 4) + (side > 0 ? 0.06 : -0.06);
      const pMid = add(P, polar(pinnaLen * 0.54, pa - side * 0.08));
      const pTip = add(P, polar(pinnaLen, pa + side * 0.06));
      axes += `M${P1(P)}Q${P1(pMid)} ${P1(pTip)}`;
      const pCount = Math.max(4, 8 - k);
      for (let m = 1; m <= pCount; m++) {
        const mu = m / (pCount + 0.5);
        const O = lerp(P, pTip, mu);
        const pL = pinnaLen * 0.28 * (1 - mu * 0.62);
        for (const s2 of [-1, 1]) {
          const b = { O, dir: pa + s2 * rad(66), L: pL, W: 0.38 };
          if ((k + m) % 2 === 0) backPinnules.push(b);
          else frontPinnules.push(b);
        }
      }
      frontPinnules.push({ O: pTip, dir: pa, L: pinnaLen * 0.2, W: 0.36 });
    }
  }
  frontPinnules.push({ O: tip, dir, L: H * 0.16, W: 0.38 });

  const baseTone = v ?? tone(r, { spread: 0.05, hue: 8 });
  bladeBunch(out, backPinnules, { ...baseTone, dl: (baseTone.dl ?? 0) - 0.04 });
  bladeBunch(out, frontPinnules, { ...baseTone, dl: (baseTone.dl ?? 0) + 0.03 });
  out.push(`<path class="ink hair" d="${axes}"/>`);
}

export function bracken(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const summerDies = 0.86;
  // Five stiffly erect grooved summer stipes crowned with broad horizontal triangular fronds
  const stipes: [number, number, number, number, number, number, number][] = [
    [-72, 235, -96, 165, 118, 0.04, 0.18],
    [-34, 315, -92, 210, 146, 0.06, 0.2],
    [4, 365, -89, 235, 162, 0.08, 0.23],
    [42, 295, -86, 198, 138, 0.1, 0.25],
    [76, 220, -82, 155, 110, 0.12, 0.26],
  ];

  stipes.forEach(([dx, H, deg, fW, fH, g0, g1]) => {
    const B = at([dx, 0]);
    const a = rad(deg);
    const top = add(B, polar(H, a));
    const spine = sample(quad(B, add(lerp(B, top, 0.5), [(r() - 0.5) * 8, 0]), top), 10);
    const g: [number, number] = [g0, g1];
    const stipe = grow(out, g[0], g[1], () => ({ ...stalk(out, (t) => spine[Math.round(t * 10)], 5.2, 2.8, tone(r, { spread: 0.04 }), 10), pts: spine, n: 10 }), summerDies);
    const gTop = gate(stipe, g, 10);
    // Silver-furry shepherd's-crook fiddlehead unrolling in spring (`gTop + 0.015 -> 0.34`, fade)
    part(out, gTop + 0.015, top, () => brackenCrosier(out, r, top, a, 20), 0.34, true);
    // Broad horizontal triangular 2–3-pinnate frond (`gTop + 0.03 -> summerDies - 0.01`)
    part(out, gTop + 0.03, top, () => brackenFrond(out, r, top, a + (deg + 90) * 0.012, fW, fH), summerDies - 0.01);
  });

  // Winter collapsed bronze-russet drift (`0.80..1.0`): low angled broken-over stems whose tips
  // stay well clear of the upright summer stipes and above `y = 0`.
  const winterDrifts: [number, Pt, Pt, number, number, number][] = [
    [-88, [-132, -52], [-182, -68], -158, 138, 92],
    [88, [136, -48], [188, -64], -22, 142, 96],
    [-94, [-118, -88], [-154, -116], -142, 126, 86],
  ];
  winterDrifts.forEach(([dx, ctrl, tipOff, deg, fW, fH], k) => {
    const B = at([dx, 0]);
    const C = at(ctrl);
    const T = at(tipOff);
    const spine = sample(quad(B, C, T), 8);
    const wg: [number, number] = [0.8 + k * 0.008, 0.84 + k * 0.008];
    const wStalk = grow(out, wg[0], wg[1], () => ({
      ...stalk(out, (t) => spine[Math.round(t * 8)], 4.4, 2.4, tone(r, { pc: "--pl-bracken-autumn", dl: -0.06, spread: 0.03 }), 8),
      pts: spine,
      n: 8,
    }));
    part(out, gate(wStalk, wg, 8) + 0.015, T, () =>
      brackenFrond(out, r, T, rad(deg), fW, fH, tone(r, { pc: "--pl-bracken-autumn", dl: -0.03, spread: 0.05 })),
    );
  });
}

export function brackenDetail(out: Out, r: Rng) {
  stalk(out, (t) => [-20, 170 - t * 150], 7, 4, tone(r, { spread: 0.03 }), 8);
  brackenFrond(out, r, [-20, 20], rad(-88), 260, 185);
  stalk(out, (t) => [110, 170 - t * 130], 7, 5, tone(r, { spread: 0.03 }), 6);
  brackenCrosier(out, r, [110, 40], rad(-84), 38);
}

// ---------------------------------------------------------------------------
// 9. Common foxglove (Digitalis purpurea): evergreen downy basal rosette of wrinkled ovate leaves
// at the base all year, sending up a tall unbranched stem (staying all winter) hung strictly on
// one side (`secund`) with 20+ pendulous inflated purple-pink thimbles (`--flower-foxglove`,
// `0.32..0.66`, opening bottom-to-top) spotted inside the lower floor with white-rimmed dark
// crimson speckles (`--spot-foxglove`), leaving a stiff brown stalk of split ovoid capsules
// (`0.58..1.0`) through winter.

function foxgloveRosetteLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  // Clamp angle so basal rosette leaves never dip below `y = 0`
  const safeA = Math.sin(dir) > -0.14 ? (Math.cos(dir) >= 0 ? rad(-10) : rad(-170)) : dir;
  blade(out, r, O, safeA, L, {
    W: 0.38,
    prof: (s) => Math.sin(Math.PI * Math.min(1, s) ** 0.75) ** 0.85,
    wavy: 0.012,
    veins: 5,
    v: tone(r, { spread: 0.05, hue: 8 }),
    deep: 0.45,
    rib: "ink thin",
    hairline: true,
  });
}

export function foxgloveBell(out: Out, r: Rng, P: Pt, side: number, L: number, isBud = false) {
  const dir = rad(90) - side * rad(54);
  const toW = (x: number, y: number) => add(P, rot([x * L, y * L * side], dir));
  // Short arching pedicel + 5-lobed green calyx cup
  const base = toW(0.16, 0);
  out.push(`<path class="ink thin" style="stroke:var(--stem-green)" d="M${P1(P)}L${P1(base)}"/>`);
  const calyx = [toW(0.08, -0.05), toW(0.28, -0.14), toW(0.32, 0), toW(0.28, 0.14), toW(0.08, 0.05)];

  if (isBud) {
    const budPts = [toW(0.18, -0.08), toW(0.56, -0.17), toW(0.92, 0), toW(0.56, 0.17), toW(0.18, 0.08)];
    shape(out, r, budPts, tone(r, { pc: "--flower-foxglove", dl: 0.05, spread: 0.03 }), { deep: 0.25, ink: false });
    out.push(`<path class="ink hair petal-edge" d="${closed(budPts)}"/><path class="wash"${vars(tone(r, { spread: 0.03 }))} d="${closed(calyx)}"/><path class="ink hair" d="${closed(calyx)}"/>`);
    return;
  }

  // Inflated tubular-campanulate thimble bell with slightly protruding lower lip
  const bell = [
    toW(0.18, -0.08),
    toW(0.45, -0.22),
    toW(0.78, -0.26),
    toW(0.98, -0.22),
    toW(0.94, 0),
    toW(1.08, 0.26),
    toW(0.78, 0.28),
    toW(0.44, 0.22),
    toW(0.18, 0.08),
  ];
  shape(out, r, bell, tone(r, { pc: "--flower-foxglove", spread: 0.04 }), { deep: 0.36, deepAbout: toW(0.52, -0.08), ink: false });
  out.push(`<path class="ink hair petal-edge" d="${closed(bell)}"/>`);

  // Pale interior throat floor visible at the oblique mouth, spotted with white-rimmed dark crimson speckles
  const throat = [toW(0.68, 0.02), toW(0.94, -0.14), toW(1.05, 0.22), toW(0.76, 0.24)];
  out.push(`<path class="wash"${vars({ pc: "--flower-hawthorn", dl: -0.02 })} d="${closed(throat)}"/>`);
  let spots = "";
  for (const [sx, sy] of [
    [0.82, 0.04],
    [0.9, -0.02],
    [0.88, 0.12],
    [0.96, 0.08],
    [0.78, 0.14],
  ] as const) {
    spots += closed(roundPts(toW(sx, sy), L * 0.036, L * 0.028, dir, 5));
  }
  out.push(`<path class="wash"${vars({ pc: "--spot-foxglove" })} d="${spots}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { spread: 0.03 }))} d="${closed(calyx)}"/><path class="ink hair" d="${closed(calyx)}"/>`);
}

function foxgloveCapsule(out: Out, r: Rng, P: Pt, side: number, s = 1) {
  const dir = rad(-90) + side * rad(52);
  const toW = (x: number, y: number) => add(P, rot([x * s, y * s], dir));
  // Split ovoid septicidal capsule with two pointed valves
  const cap = [toW(0, -2), toW(6, -5.2), toW(15, -3.2), toW(11, 0), toW(15, 3.2), toW(6, 5.2), toW(0, 2)];
  out.push(`<path class="wash"${vars(tone(r, { pc: "--acorn-cup", dl: -0.04, spread: 0.04 }))} d="${closed(cap)}"/><path class="ink hair" d="${closed(cap)}"/>`);
}

function foxgloveSpire(out: Out, r: Rng, B: Pt, H: number, side: number, bellCount: number, g0: number, g1: number) {
  const spine = sample((t) => add(B, [Math.sin(t * Math.PI * 0.85) * side * 12, -H * t]), 24);
  const g: [number, number] = [g0, g1];
  // Tall unbranched stem that stays standing through winter (`leave` omitted)
  const stem = grow(out, g[0], g[1], () => ({
    ...stalk(out, (t) => spine[Math.round(t * 24)], 7.2, 2.6, tone(r, { spread: 0.03 }), 24),
    pts: spine,
    n: 24,
  }));

  // Lower stem leaves (wither in late summer `0.76`)
  for (const [k, u] of [
    [0, 0.14],
    [1, 0.24],
    [2, 0.34],
  ] as const) {
    const i = Math.round(24 * u);
    const P = spine[i];
    const ls = k % 2 ? 1 : -1;
    const gNode = gate(stem, g, i);
    part(out, gNode + 0.015, P, () => foxgloveRosetteLeaf(out, r, P, rad(-90 + ls * 58), 68 - k * 10), 0.76 + k * 0.02);
  }

  // Strictly one-sided (`secund`) raceme of pendulous purple-pink thimbles opening bottom-to-top (`0.32..0.66`)
  for (let k = 0; k < bellCount; k++) {
    const q = k / (bellCount - 1);
    const u = 0.38 + q * 0.59;
    const i = Math.min(24, Math.max(1, Math.round(24 * u)));
    const P = spine[i];
    const gNode = gate(stem, g, i);
    // Lateral offset within two ranks on the SAME side (`side`) for rich secund density
    const rankOff = (k % 2 ? 2.5 : -1.5) * side;
    const attach = add(P, [rankOff, 0]);
    const L = (42 * (1 - q * 0.48)) + r() * 3;
    const isBud = q > 0.82;
    const openAt = Math.max(gNode + 0.015, 0.32 + q * 0.07);
    const dropAt = 0.59 + q * 0.07;
    part(out, openAt, P, () => foxgloveBell(out, r, attach, side, L, isBud), dropAt);
    if (k % 2 === 0) {
      part(out, Math.max(gNode + 0.015, 0.58 + q * 0.04), P, () => foxgloveCapsule(out, r, P, side, 1.05 - q * 0.25));
    }
  }
}

export function foxglove(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Evergreen downy basal rosette of wrinkled ovate leaves (`0.05..1.0`, stays all year)
  const rosetteAngles = [-168, -148, -124, -98, -74, -48, -26, -12];
  rosetteAngles.forEach((deg, k) => {
    const P = at([(k - 3.5) * 6, -2]);
    const L = 86 + Math.sin((k / 7) * Math.PI) * 34 + r() * 10;
    part(out, 0.055 + k * 0.01, P, () => foxgloveRosetteLeaf(out, r, P, rad(deg), L));
  });

  // Main tall secund spire (22 bells facing right) + secondary spire (14 bells facing left)
  foxgloveSpire(out, r, at([-8, 0]), 445, 1, 22, 0.04, 0.24);
  foxgloveSpire(out, r, at([22, 0]), 325, -1, 14, 0.07, 0.26);
}

export function foxgloveDetail(out: Out, r: Rng) {
  const spine = sample((t) => [-35, 175 - t * 340], 16);
  stalk(out, (t) => spine[Math.round(t * 16)], 10, 5, tone(r, { spread: 0.03 }), 16);
  for (let k = 0; k < 6; k++) {
    const q = k / 5;
    const P = spine[Math.round((0.16 + q * 0.78) * 16)];
    foxgloveBell(out, r, P, 1, (98 - k * 8), k === 5);
  }
  foxgloveRosetteLeaf(out, r, [-35, 165], rad(-145), 135);
}

// ---------------------------------------------------------------------------
// 10. Common gorse (Ulex europaeus): dense evergreen mound of furrowed dark-green stems armed
// with branched green spines all year, ablaze in spring (`g -> 0.48`) and again in late autumn /
// winter (`0.78..1.0`) with golden-yellow pea blossoms (`--flower-gorse`) cupped in velvety brown
// two-lipped calyces (`--calyx-gorse`), plus dark shaggy pods (`--pod-gorse`, `0.46..0.76`).

const gorseSpringFall = fallsAt(0.45, 0.05);
const gorsePodFall = fallsAt(0.75, 0.04);

export function gorseFlower(out: Out, r: Rng, P: Pt, dir: number, R: number) {
  const toW = (x: number, y: number) => add(P, rot([x * R, y * R], dir));
  // Velvety brown two-lipped calyx clasping the base of the pea blossom
  const calyx = [
    toW(0, -0.16),
    toW(0.46, -0.34),
    toW(0.56, -0.12),
    toW(0.38, 0),
    toW(0.58, 0.16),
    toW(0.46, 0.34),
    toW(0, 0.16),
  ];
  // Upright notched standard banner + boat keel & wings (`--flower-gorse`)
  const standard = roundPts(toW(0.68, -0.22), R * 0.46, R * 0.38, dir - 0.38, 9);
  const keel = [toW(0.32, -0.06), toW(0.84, -0.08), toW(1.06, 0.08), toW(0.82, 0.28), toW(0.32, 0.2)];
  const wing = roundPts(toW(0.68, 0.06), R * 0.36, R * 0.22, dir + 0.1, 8);

  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-gorse", dl: 0.04, spread: 0.03 }))} d="${closed(standard)}"/><path class="ink hair petal-edge" d="${closed(standard)}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-gorse", dl: -0.04, spread: 0.03 }))} d="${closed(keel)}"/><path class="ink hair petal-edge" d="${closed(keel)}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-gorse", spread: 0.03 }))} d="${closed(wing)}"/><path class="ink hair petal-edge" d="${closed(wing)}"/>`);
  out.push(`<path class="wash felt"${vars(tone(r, { pc: "--calyx-gorse", spread: 0.04 }))} d="${closed(calyx)}"/><path class="ink hair" d="${closed(calyx)}"/>`);
}

export function gorsePod(out: Out, r: Rng, P: Pt, dir: number, L: number) {
  const toW = (x: number, y: number) => add(P, rot([x * L, y * L], dir));
  const pod = roundPts(toW(0.56, 0), L * 0.48, L * 0.22, dir, 9);
  const cal = [toW(0, -0.15), toW(0.38, -0.24), toW(0.32, 0), toW(0.38, 0.24), toW(0, 0.15)];
  out.push(`<path class="wash"${vars(tone(r, { pc: "--pod-gorse", spread: 0.04 }))} d="${closed(pod)}"/><path class="ink hair" d="${closed(pod)}"/>`);
  out.push(`<path class="wash felt"${vars(tone(r, { pc: "--calyx-gorse", spread: 0.03 }))} d="${closed(cal)}"/>`);
}

function gorseShootSpines(out: Out, r: Rng, pts: Pt[], from: number, to: number) {
  const back: { O: Pt; dir: number; L: number; W: number }[] = [];
  const front: { O: Pt; dir: number; L: number; W: number }[] = [];
  for (let i = from; i <= to; i += 2) {
    const P = pts[i];
    const tang = angleOf(pts, Math.min(i, pts.length - 2));
    // Clamp spine angles near the base so no lower spine dips below `y = 0`
    for (const side of [-1, 1]) {
      const mainA = tang + side * rad(42);
      if (P[1] > -18 && Math.sin(mainA) > -0.1) continue;
      const L = 20 + r() * 6;
      // Branched 3-forked green spine (primary spine + two lateral spinelets)
      back.push({ O: P, dir: mainA - 0.28, L: L * 0.68, W: 0.1 });
      back.push({ O: P, dir: mainA + 0.28, L: L * 0.68, W: 0.1 });
      front.push({ O: P, dir: mainA, L, W: 0.11 });
    }
  }
  if (back.length) bladeBunch(out, back, tone(r, { dl: -0.05, spread: 0.04 }));
  if (front.length) bladeBunch(out, front, tone(r, { dl: 0.03, spread: 0.04 }));
}

export function gorse(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Seven furrowed dark-green woody stems fanning into a dense spiny dome (`y <= 0`)
  const stems: [number, Pt, Pt][] = [
    [-28, [-96, -68], [-168, -118]],
    [-18, [-78, -116], [-134, -188]],
    [-8, [-36, -142], [-64, -226]],
    [0, [4, -152], [8, -242]],
    [8, [42, -138], [76, -218]],
    [18, [82, -112], [142, -178]],
    [28, [98, -64], [168, -112]],
  ];

  stems.forEach(([dx, ctrl, tip], j) => {
    const gm: [number, number] = [0.04 + j * 0.008, 0.19 + j * 0.008];
    const stem = grow(out, gm[0], gm[1], () =>
      limb(out, r, [at([dx, -2]), at(ctrl), at(tip)], { w0: 9.5, w1: 3.2, cap: "taper", pc: "--pl-gorse" }),
    );
    const n = stem.n;
    const iMid = Math.round(n * 0.5);
    const gMid = gate(stem, gm, iMid);
    // Evergreen branched green spines all year
    part(out, gMid + 0.015, stem.pts[iMid], () => gorseShootSpines(out, r, stem.pts, 3, n));

    // Golden-yellow pea blossoms in spring (`g + 0.015 -> 0.48`) and again in winter (`0.78..1.0`),
    // plus dark shaggy summer pods (`0.46..0.76`)
    for (const [k, u] of [
      [0, 0.34],
      [1, 0.56],
      [2, 0.76],
      [3, 0.94],
    ] as const) {
      const i = Math.round(n * u);
      const P = stem.pts[i];
      const tang = angleOf(stem.pts, Math.min(i, n - 1));
      const g = gate(stem, gm, i);
      for (const side of [-1, 1]) {
        const fa = tang + side * rad(34 - k * 4);
        if (P[1] > -24 && Math.sin(fa) > -0.15) continue;
        const R = 19 + r() * 4;
        part(out, g + 0.015 + k * 0.006, P, () => gorseFlower(out, r, P, fa, R), gorseSpringFall(P));
        if ((j + k + (side > 0 ? 1 : 0)) % 2 === 0) {
          part(out, 0.78 + k * 0.012 + j * 0.005, P, () => gorseFlower(out, r, P, fa, R * 0.95));
        }
      }
      if (k === 1 || k === 2) {
        part(out, Math.max(g + 0.015, 0.46 + k * 0.015), P, () => gorsePod(out, r, P, tang + (j % 2 ? 1 : -1) * rad(36), 22), gorsePodFall(P));
      }
    }
  });
}

export function gorseDetail(out: Out, r: Rng) {
  const stem = limb(out, r, [[-140, 80], [-20, 10], [110, -55]], { w0: 12, w1: 4.5, cap: "taper", pc: "--pl-gorse" });
  gorseShootSpines(out, r, stem.pts, 2, stem.n);
  for (const [u, da, R] of [
    [0.32, -42, 54],
    [0.54, 36, 52],
    [0.74, -34, 50],
    [0.92, 24, 46],
  ] as const) {
    const i = Math.round(stem.n * u);
    gorseFlower(out, r, stem.pts[i], angleOf(stem.pts, i) + rad(da), R);
  }
  gorsePod(out, r, stem.pts[Math.round(stem.n * 0.44)], rad(42), 52);
}

// ---------------------------------------------------------------------------
// 11. Hart's-tongue fern (Asplenium scolopendrium): evergreen shuttlecock rosette of completely
// undivided glossy emerald strap blades with ruffled undulating margins, deeply cordate-auriculate
// bases, and paired oblique rows of rust-brown linear herringbone sori (`--sori-rust`) beneath,
// staying bright green all winter.

export function hartstongueFrond(out: Out, r: Rng, O: Pt, dir: number, L: number, showSori = true) {
  // Clamp angle so basal auricles and strap never dip below `y = 0`
  const safeA = Math.sin(dir) > -0.18 ? (Math.cos(dir) >= 0 ? rad(-14) : rad(-166)) : dir;
  const bend = (Math.cos(safeA) >= 0 ? 1 : -1) * 0.11;
  const stipe = 0.12 * L;
  const mid = (s: number): Pt => [stipe + s * 0.88 * L, bend * L * s * s];
  const toW = (p: Pt) => add(O, rot(p, safeA));

  // Short dark scaly stipe at the base
  const B = toW([stipe, 0]);
  stalk(out, quad(O, lerp(O, B, 0.5), B), 3.6, 2.6, tone(r, { pc: "--bark-hawthorn", spread: 0.03 }), 4);

  // Undivided glossy strap with cordate-auriculate base and ruffled undulating margins
  const W = 0.21 * L;
  const steps = 16;
  const up: Pt[] = [];
  const dn: Pt[] = [];
  const spinePts: Pt[] = [O];
  const ph = r() * TAU;
  const halfAt = (s: number, side: number) => {
    const env = Math.sin(Math.PI * Math.min(1, s) ** 0.62) ** 0.72 * (1 - 0.18 * s * s);
    // Ruffled 3D wave along the strap margin
    const ruffle = 1 + 0.14 * Math.sin(s * TAU * 4.5 + ph + (side > 0 ? 1.1 : 0));
    return (W / 2) * env * ruffle;
  };
  // Cordate-auriculate basal ears dipping slightly behind `stipe`
  const earUp = toW([stipe * 0.55, -W * 0.34]);
  const earDn = toW([stipe * 0.55, W * 0.34]);
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const m = mid(s);
    up.push(toW(add(m, [0, -halfAt(s, -1)])));
    dn.push(toW(add(m, [0, halfAt(s, 1)])));
    spinePts.push(toW(m));
  }
  const tip = toW(mid(1.02));
  const outline = [B, earUp, ...up.slice(1), tip, ...dn.slice(1).reverse(), earDn];
  shape(out, r, outline, tone(r, { spread: 0.05, hue: 8 }), { deep: 0.48, deepAbout: toW(mid(0.4)) });

  // Glossy highlight strip along the lit half of the blade
  const shinePts = [toW(add(mid(0.18), [0, -W * 0.12])), toW(add(mid(0.52), [0, -W * 0.28])), toW(add(mid(0.76), [0, -W * 0.16])), toW(add(mid(0.48), [0, -W * 0.06]))];
  out.push(`<path class="wash shine" d="${closed(shinePts)}"/>`);

  // Paired oblique linear rows of rust-brown herringbone sori (`--sori-rust`)
  if (showSori) {
    let sori = "";
    for (let k = 2; k <= 12; k++) {
      const s = k / 14;
      const m = mid(s);
      const hw = (W / 2) * Math.sin(Math.PI * s ** 0.62) ** 0.72 * 0.76;
      for (const side of [-1, 1]) {
        const p0 = toW(add(m, [0.01 * L, side * hw * 0.24]));
        const p1 = toW(add(m, [0.045 * L, side * hw * 0.86]));
        sori += `M${P1(p0)}L${P1(p1)}`;
      }
    }
    out.push(`<path class="ink mid" style="stroke:var(--sori-rust);opacity:.88" d="${sori}"/>`);
  }

  out.push(`<path class="ink mid" d="${line(sample(mid, 8).map(toW))}"/>`);
  return { L: [O, ...up], R: [O, ...dn], pts: spinePts, n: steps + 1 };
}

export function hartstongue(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Rusty-scaled shuttlecock crown at the base
  shape(out, r, roundPts(at([0, -5]), 18, 6, 0, 8), tone(r, { pc: "--sori-rust", dl: -0.06 }), { deep: 0.4 });

  // Eight evergreen undivided strap fronds fanning out in a shuttlecock rosette (`0.04..0.26 -> 1.0`)
  const fronds: [number, number, number, boolean][] = [
    [-156, 152, -16, true],
    [-136, 184, -12, true],
    [-116, 212, -7, true],
    [-98, 228, -2, false],
    [-82, 224, 3, true],
    [-64, 206, 8, true],
    [-44, 178, 13, false],
    [-24, 148, 17, true],
  ];
  fronds.forEach(([deg, L, dx, sori], k) => {
    const P = at([dx, -3]);
    grow(out, 0.04 + k * 0.012, 0.18 + k * 0.012, () => hartstongueFrond(out, r, P, rad(deg), L, sori));
  });

  // Two pale-green spring fiddlehead crosiers unrolling from the center in April–May (`0.06..0.34`, fade)
  for (const [j, [dx, deg]] of [
    [-5, -96],
    [6, -84],
  ].entries()) {
    const P = at([dx, -6]);
    const top = add(P, polar(68, rad(deg)));
    const cg: [number, number] = [0.06 + j * 0.02, 0.19 + j * 0.02];
    const cStalk = grow(
      out,
      cg[0],
      cg[1],
      () => {
        const sp = sample(quad(P, lerp(P, top, 0.5), top), 6);
        return { ...stalk(out, (t) => sp[Math.round(t * 6)], 4, 2.5, tone(r, { dl: 0.08 }), 6), pts: sp, n: 6 };
      },
      0.34,
    );
    part(out, gate(cStalk, cg, 6) + 0.015, top, () => brackenCrosier(out, r, top, rad(deg), 14), 0.34, true);
  }
}

export function hartstongueDetail(out: Out, r: Rng) {
  hartstongueFrond(out, r, [-50, 140], rad(-62), 310, true);
  hartstongueFrond(out, r, [20, 150], rad(-108), 285, true);
}

// ---------------------------------------------------------------------------
// 12. English bluebell (Hyacinthoides non-scripta): bulbous spring ephemeral in the bed foreground!
// Glossy linear channelled leaves (`0.04..0.55`) and smooth scapes (`leave = 0.58` so the entire
// plant vanishes underground by midsummer!) drooping strongly at the top in a shepherd's crook,
// hung strictly along the underside (`secund`) with narrow parallel-sided violet-blue tubular bells
// with strongly rolled-back tips and cream-white anthers (`--flower-bluebell`, `0.18..0.47`),
// followed briefly by erect 3-lobed green capsules (`0.42..0.55`) before dormancy.

export function bluebellBell(out: Out, r: Rng, P: Pt, tang: number, L: number) {
  // Hangs strictly from the underside of the nodding shepherd's-crook rachis
  const dir = rad(84) + (tang - rad(90)) * 0.18;
  const toW = (x: number, y: number) => add(P, rot([x * L, y * L], dir));
  const B = toW(0.22, 0);
  // Paired violet-blue linear bracts at the base of the curved pedicel
  out.push(`<path class="ink thin" style="stroke:var(--flower-bluebell)" d="M${P1(P)}L${P1(add(P, polar(L * 0.26, tang - 0.55)))}M${P1(P)}L${P1(B)}"/>`);

  // Narrow parallel-sided tubular bell with 6 strongly recurved (rolled-back) tepal tips
  const tube = [
    toW(0.2, -0.14),
    toW(0.76, -0.15),
    // Upper rolled-back curl
    toW(0.96, -0.34),
    toW(0.82, -0.44),
    toW(0.88, -0.16),
    // Middle recurved lobe
    toW(1.06, 0),
    // Lower rolled-back curl
    toW(0.88, 0.16),
    toW(0.82, 0.44),
    toW(0.96, 0.34),
    toW(0.76, 0.15),
    toW(0.2, 0.14),
  ];
  shape(out, r, tube, tone(r, { pc: "--flower-bluebell", spread: 0.04 }), { deep: 0.38, deepAbout: toW(0.5, 0), ink: false });
  out.push(`<path class="ink hair petal-edge" d="${closed(tube)}"/>`);

  // Cream-white anthers (`--flower-hawthorn`) inside the mouth of the tube (signature of H. non-scripta!)
  let anthers = "";
  for (const dy of [-0.07, 0.07]) {
    anthers += closed(roundPts(toW(0.8, dy), L * 0.075, L * 0.038, dir, 5));
  }
  out.push(`<path class="wash"${vars({ pc: "--flower-hawthorn" })} d="${anthers}"/>`);
}

function bluebellCapsule(out: Out, r: Rng, P: Pt, s = 1) {
  // Erect 3-lobed green ovoid capsule ripening in June before dormancy
  const C = add(P, [0, -10 * s]);
  out.push(`<path class="ink thin" style="stroke:var(--stem-green)" d="M${P1(P)}L${P1(C)}"/>`);
  shape(out, r, roundPts(C, 4.6 * s, 6.8 * s, 0, 8), tone(r, { dl: 0.05, spread: 0.04 }), { deep: 0.35 });
}

export function bluebell(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const scapeDies = 0.58;
  const leafDies = 0.55;

  // 1. Glossy linear channelled basal leaves (`0.04..0.22 -> 0.55`)
  const leaves: [number, number, number, number][] = [
    [-58, -138, 128, -14],
    [-46, -124, 152, -12],
    [-34, -112, 168, -9],
    [-22, -98, 176, -6],
    [-10, -86, 164, 5],
    [4, -104, 172, -8],
    [16, -78, 168, 9],
    [28, -66, 156, 12],
    [42, -54, 142, 14],
    [54, -42, 124, 16],
  ];
  leaves.forEach(([dx, deg, L, bow], k) => {
    const B = at([dx, 0]);
    const a = rad(deg);
    const tip = add(B, add(polar(L, a), [bow, Math.abs(bow) * 0.6]));
    const mid = add(lerp(B, tip, 0.5), [bow * 0.4, -8]);
    const spine = sample(quad(B, mid, tip), 8);
    grow(
      out,
      0.04 + k * 0.006,
      0.16 + k * 0.006,
      () => ({ ...stalk(out, (t) => spine[Math.round(t * 8)], 6.4, 1.4, tone(r, { spread: 0.04 }), 8), pts: spine, n: 8 }),
      leafDies,
    );
  });

  // 2. Five graceful scapes drooping strongly at the top in a shepherd's crook (`0.06..0.25 -> 0.58`)
  const scapes: [number, number, number, number][] = [
    [-46, 215, 1, 8],
    [-20, 255, 1, 9],
    [6, 275, 1, 10],
    [32, 238, 1, 8],
    [56, 198, 1, 7],
  ];
  scapes.forEach(([dx, H, crookDir, bells], j) => {
    // Shepherd's-crook spine: rises upright for 65% of its height, then arches over to one side
    const spine = sample((t) => {
      const bend = Math.max(0, (t - 0.52) / 0.48);
      const x = dx + crookDir * (bend * bend * 68 + t * 8);
      const y = -H * (t - 0.24 * bend * bend * bend);
      return add(base, [x, y]);
    }, 16);
    const g: [number, number] = [0.06 + j * 0.01, 0.21 + j * 0.01];
    const scape = grow(
      out,
      g[0],
      g[1],
      () => ({ ...stalk(out, (t) => spine[Math.round(t * 16)], 4.4, 2.0, tone(r, { spread: 0.03 }), 16), pts: spine, n: 16 }),
      scapeDies,
    );

    // Strictly one-sided (`secund`) nodding raceme of narrow violet-blue bells along the underside
    for (let k = 0; k < bells; k++) {
      const q = k / (bells - 1);
      const i = Math.min(16, Math.max(6, Math.round((0.46 + q * 0.52) * 16)));
      const P = spine[i];
      const tang = angleOf(spine, Math.min(15, i));
      const gNode = gate(scape, g, i);
      const L = (26 * (1 - q * 0.34)) + r() * 2;
      part(out, Math.max(gNode + 0.02, 0.25 + q * 0.04), P, () => bluebellBell(out, r, P, tang, L), 0.45 + q * 0.02);
      if (k % 2 === 0) {
        part(out, Math.max(gNode + 0.02, 0.42 + q * 0.02), P, () => bluebellCapsule(out, r, P, 0.95 - q * 0.2), leafDies);
      }
    }
  });

  // 3. Late-winter February emergence (`0.94..1.0`): pale green leaf tips just piercing the woodland floor
  for (const [dx, H, deg] of [
    [-32, 34, -96],
    [-8, 42, -88],
    [18, 38, -84],
    [38, 30, -78],
  ] as const) {
    const B = at([dx, 0]);
    const top = add(B, polar(H, rad(deg)));
    const sp = sample(quad(B, lerp(B, top, 0.5), top), 4);
    grow(out, 0.94, 0.98, () => ({ ...stalk(out, (t) => sp[Math.round(t * 4)], 5.2, 1.4, tone(r, { dl: 0.08 }), 4), pts: sp, n: 4 }));
  }
}

export function bluebellDetail(out: Out, r: Rng) {
  const spine = sample((t) => {
    const bend = Math.max(0, (t - 0.38) / 0.62);
    return [-65 + bend * bend * 165, 175 - 320 * (t - 0.28 * bend * bend * bend)];
  }, 16);
  stalk(out, (t) => spine[Math.round(t * 16)], 7.5, 3.2, tone(r, { spread: 0.03 }), 16);
  for (let k = 0; k < 7; k++) {
    const q = k / 6;
    const i = Math.round((0.32 + q * 0.65) * 16);
    bluebellBell(out, r, spine[i], angleOf(spine, Math.min(15, i)), 64 - k * 4);
  }
  const leafSp = sample(quad([-85, 175], [-115, 30], [-95, -90]), 8);
  stalk(out, (t) => leafSp[Math.round(t * 8)], 11, 2, tone(r, { spread: 0.04 }), 8);
}
