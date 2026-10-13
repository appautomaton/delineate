// The Eastern North American edge (#9, Köppen Dfa: the Ohio Valley).
// Built on the four-season system (`year: true`), where the eastern deciduous forest edge meets
// the tallgrass prairie peninsula across `u ∈ [0, 1]`:
//   - Early spring (`u ≈ 0.08–0.34`): eastern redbud cauliflorous magenta pea clusters on bare
//     black zigzag wood, and sugar maple drooping chartreuse flower tassels.
//   - Late spring (`u = SPRING = 0.42`): squared four-lobed tulip-tree leaves and chartreuse-and-
//     orange cup flowers, broad U-sinused sugar-maple palms, black-walnut pinnate fronds and
//     catkins, and Dutchman's-pipe U-curved pipe flowers beneath huge shingled kidney-heart leaves.
//   - Summer (`u ≈ 0.44–0.68`): orange-scarlet trumpet-vine clusters on a split-rail timber beam,
//     compass-plant chrome-yellow sunflower heads, common-milkweed dusty-rose spherical umbels,
//     purple-coneflower drooping rays around coppery-orange spiny cones, and dense blazing-star
//     wands opening strictly from top to bottom.
//   - Autumn (`u ≈ 0.64–0.84`): Virginia creeper flaming crimson early to reveal blue-black
//     berries on carmine-red pedicels, sugar maple turning mottled yellow-orange-scarlet, tulip
//     tree chrome-yellow, black walnut dropping its yellow fronds early to leave warty green nuts
//     on bare wood, and big bluestem curing to copper and wine-burgundy under turkey-foot racemes.
//   - Winter (`u ≈ 0.86–1.0`): tulip-tree wooden samara-cone candelabras, bare opposite sugar-maple
//     twigs with sharp conical buds, twisted redbud pods on zigzag wood, split trumpet-vine boat
//     valves, 6-ribbed Dutchman's-pipe hanging baskets, split milkweed pods spilling white silk
//     comas, coal-black coneflower cones, dark compass-plant skeletal cups, and standing bluestem.

import { TAU, rad, P1, add, sub, mul, lerp, polar, rot, quad, closed, line, sample, glaze, vars, shape, stalk, tone, grow, part, gate, roundPts } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";
import { limb, branch, angleOf } from "./woody.ts";
import type { Limb } from "./woody.ts";
import { blade, bladeBunch } from "./mediterranean.ts";

// Deterministic leaf-fall timing from spatial position so timing never shifts the random stream.
const fallsAt = (from: number, span: number) => ([x, y]: Pt) =>
  from + ((((Math.round(x * 7 + y * 13) % 20) + 20) % 20) / 20) * span;

// ---------------------------------------------------------------------------
// 1. Tulip tree (Liriodendron tulipifera): smooth reddish-brown limbs with flattened duck-bill
// winter buds and stipule scars, unmistakable 4-lobed squared/truncate leaves, solitary upright
// chartreuse-yellow cup flowers banded vivid orange near the base, and upright cone-like samara
// aggregates that shed their outer wings in autumn to leave pale wooden candelabra receptacles.

const TULIP_BARK = { pc: "--bark-tulip" };
const tulipShed = fallsAt(0.72, 0.1);
const tulipFlowerFall = fallsAt(0.45, 0.03);
const tulipSamaraFall = fallsAt(0.76, 0.06);

export function tulipLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const s = 0.94 + r() * 0.12;
  // Squared 4-lobed profile: broad rounded base, two spreading pointed basal lobes, rounded lateral
  // U-sinuses, two ascending apical lobes, and a broad flat-to-shallowly-notched truncate apex.
  const half: Pt[] = [
    [0, 0],
    [0.06, 0.18 * s],
    [0.18, 0.36 * s],
    [0.34, 0.52 * s],
    [0.44, 0.58 * s], // basal lobe tip
    [0.5, 0.42 * s],
    [0.58, 0.28 * s], // rounded lateral U-sinus
    [0.72, 0.33 * s],
    [0.88, 0.44 * s],
    [0.98, 0.46 * s], // apical lobe tip
    [0.93, 0.26 * s],
    [0.86, 0.1 * s],
    [0.83, 0], // shallow V-notch at the truncate apex
  ];
  const upper = half.map(([x, y]): Pt => [x * L, -y * L]);
  const lower = half
    .slice(1, -1)
    .reverse()
    .map(([x, y]): Pt => [x * L, y * L * (0.96 + r() * 0.06)]);
  const pts = [...upper, ...lower].map(toW);
  shape(out, r, pts, tone(r, { spread: 0.06, hue: 10 }), {
    deep: 0.42,
    deepAbout: toW([0.42 * L, 0]),
    ink: false,
  });
  out.push(`<path class="ink hair" d="${closed(pts)}"/>`);

  let veins = `M${P1(toW([0, 0]))}L${P1(toW([0.83 * L, 0]))}`;
  for (const sg of [-1, 1]) {
    veins += `M${P1(toW([0.24 * L, 0]))}Q${P1(toW([0.34 * L, sg * 0.24 * s * L]))} ${P1(toW([0.42 * L, sg * 0.52 * s * L]))}`;
    veins += `M${P1(toW([0.54 * L, 0]))}Q${P1(toW([0.72 * L, sg * 0.18 * s * L]))} ${P1(toW([0.94 * L, sg * 0.42 * s * L]))}`;
  }
  out.push(`<path class="ink hair vein" d="${veins}"/>`);
}

function duckBillBud(out: Out, r: Rng, T: Pt, dir: number, sc = 1) {
  const toW = (p: Pt) => add(T, rot(p, dir));
  const pts: Pt[] = [
    [0, -2.6 * sc],
    [6 * sc, -4.2 * sc],
    [13 * sc, -3.2 * sc],
    [15 * sc, 0],
    [13 * sc, 3.2 * sc],
    [6 * sc, 4.2 * sc],
    [0, 2.6 * sc],
  ].map(toW);
  shape(out, r, pts, tone(r, { pc: "--bark-tulip", dl: -0.06, dc: 1.35, spread: 0.03 }), { deep: 0.3, ink: false });
  out.push(`<path class="ink hair" d="${closed(pts)}M${P1(toW([0, 0]))}L${P1(toW([14 * sc, 0]))}"/>`);
}

export function tulipFlower(out: Out, r: Rng, B: Pt, dir: number, R: number) {
  const toW = (p: Pt) => add(B, rot(p, dir));
  // Three reflexed pale-green sepals below the cup.
  let sepals = "";
  for (const [sx, sy, ang] of [
    [-0.22, 0.06, rad(148)],
    [0.22, 0.06, rad(32)],
    [0, 0.1, rad(90)],
  ] as const) {
    const sBase = toW([sx * R, sy * R]);
    const sTip = add(sBase, rot([Math.cos(ang) * R * 0.56, Math.sin(ang) * R * 0.36], dir));
    const sMid = lerp(sBase, sTip, 0.5);
    const nrm = polar(R * 0.16, dir + ang + rad(90));
    sepals += closed([sBase, add(sMid, nrm), sTip, sub(sMid, nrm)]);
  }
  out.push(`<path class="wash"${vars(tone(r, { dl: 0.06, dc: 0.8, spread: 0.03 }))} d="${sepals}"/><path class="ink hair" d="${sepals}"/>`);

  // Back three erect chartreuse-yellow tepals.
  let backTepals = "";
  for (const xOff of [-0.36, 0, 0.36]) {
    const c = toW([xOff * R, -R * 0.48]);
    backTepals += closed(roundPts(c, R * 0.28, R * 0.48, dir + xOff * 0.32, 10));
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-tulip-cup", dl: -0.03, spread: 0.03 }))} d="${backTepals}"/><path class="ink hair petal-edge" d="${backTepals}"/>`);

  // Central upright pistil cone and ring of erect cream stamens.
  const conePts: Pt[] = [
    [-R * 0.12, -R * 0.12],
    [-R * 0.06, -R * 0.72],
    [0, -R * 0.82],
    [R * 0.06, -R * 0.72],
    [R * 0.12, -R * 0.12],
  ].map(toW);
  shape(out, r, conePts, tone(r, { pc: "--cone-tulip", dl: 0.04, spread: 0.03 }), { deep: 0.2, ink: false });
  let stamens = "";
  for (let k = -4; k <= 4; k++) {
    if (k === 0) continue;
    const sx = k * R * 0.065;
    stamens += `M${P1(toW([sx * 0.6, -R * 0.12]))}L${P1(toW([sx, -R * 0.58]))}`;
  }
  out.push(`<path class="ink thin" style="stroke:var(--flower-tulip-cup)" d="${stamens}"/>`);

  // Front three cupped chartreuse-yellow tepals with vivid orange basal nectar band.
  let frontTepals = "";
  let orangeBands = "";
  for (const [xOff, tilt] of [
    [-0.38, -0.26],
    [0.38, 0.26],
    [0, 0],
  ] as const) {
    const c = toW([xOff * R, -R * 0.42]);
    frontTepals += closed(roundPts(c, R * 0.3, R * 0.45, dir + tilt, 10));
    const b = toW([xOff * R * 0.86, -R * 0.24]);
    orangeBands += closed(roundPts(b, R * 0.23, R * 0.16, dir + tilt, 8));
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-tulip-cup", dl: 0.03, spread: 0.03 }))} d="${frontTepals}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-tulip-band", spread: 0.03 }))} d="${orangeBands}"/>`);
  out.push(`<path class="ink hair petal-edge" d="${frontTepals}"/>`);
}

// Persistent wooden candelabra receptacle (standing all winter) and outer samara cone.
export function tulipCone(out: Out, r: Rng, B: Pt, dir: number, H: number, fullCone: boolean) {
  const toW = (p: Pt) => add(B, rot(p, dir));
  if (!fullCone) {
    // Winter candelabra: upright central woody spindle axis + spreading basal chalice of carpel scales.
    let chalice = "";
    for (const [ang, len] of [
      [-0.78, 0.48],
      [-0.46, 0.58],
      [-0.2, 0.62],
      [0.2, 0.62],
      [0.46, 0.58],
      [0.78, 0.48],
    ] as const) {
      const tip = toW([Math.sin(ang) * H * len, -Math.cos(ang) * H * len * 0.68]);
      const mid = lerp(B, tip, 0.55);
      const nrm = polar(2.2, dir + ang);
      chalice += closed([B, add(mid, nrm), tip, sub(mid, nrm)]);
    }
    const axis: Pt[] = [
      [-2.2, 0],
      [-1.2, -H * 0.94],
      [0, -H],
      [1.2, -H * 0.94],
      [2.2, 0],
    ].map(toW);
    out.push(`<path class="wash"${vars(tone(r, { pc: "--cone-tulip", dl: 0.04, spread: 0.04 }))} d="${chalice}${closed(axis)}"/><path class="ink hair" d="${chalice}${closed(axis)}"/>`);
    return;
  }
  // Full autumn samaracetum cone of imbricate winged carpels.
  const body: Pt[] = [
    [0, 2],
    [-H * 0.24, -H * 0.16],
    [-H * 0.28, -H * 0.52],
    [-H * 0.16, -H * 0.86],
    [0, -H * 1.04],
    [H * 0.16, -H * 0.86],
    [H * 0.28, -H * 0.52],
    [H * 0.24, -H * 0.16],
  ].map(toW);
  shape(out, r, body, tone(r, { pc: "--cone-tulip", spread: 0.04 }), { deep: 0.35, ink: false });
  let scales = "";
  for (let k = 1; k <= 5; k++) {
    const y = -H * (k / 6) * 0.88;
    const w = H * 0.24 * Math.sin(Math.PI * (k / 6));
    scales += `M${P1(toW([-w, y]))}L${P1(toW([0, y - H * 0.12]))}L${P1(toW([w, y]))}`;
  }
  out.push(`<path class="ink hair" d="${closed(body)}${scales}"/>`);
}

function tulipTwig(out: Out, r: Rng, parent: { res: Limb; g: number[] }, t: number, a: number, len: number, hasFlower: boolean) {
  const twig = branch(out, r, parent, t, [polar(len * 0.5, a), polar(len, a - 0.14)], 0.04, {
    w0: 5.4,
    w1: 2.6,
    cap: "blunt",
    ...TULIP_BARK,
  });
  const n = twig.res.n;
  const tip = twig.res.pts[n];
  const tipDir = angleOf(twig.res.pts, n);
  const gTip = gate(twig.res, twig.g, n) + 0.015;

  // Terminal duck-bill winter bud stays all year.
  part(out, gTip, tip, () => duckBillBud(out, r, tip, tipDir, 0.9));

  // Alternate 4-lobed squared leaves along the twig.
  for (const [k, u] of [
    [0, 0.34],
    [1, 0.64],
    [2, 0.9],
  ] as const) {
    const i = Math.round(n * u);
    const p = twig.res.pts[i];
    const side = k % 2 ? 1 : -1;
    const la = angleOf(twig.res.pts, Math.min(i, n - 1)) + side * rad(54 + r() * 14);
    const pet = 24 + r() * 10;
    const E = add(p, polar(pet, la));
    const gLeaf = Math.max(gate(twig.res, twig.g, i) + 0.015, 0.18 + k * 0.025 + r() * 0.03);
    part(
      out,
      gLeaf,
      p,
      () => {
        stalk(out, quad(p, add(lerp(p, E, 0.5), [0, -3]), E), 1.9, 1.1, { pc: "--stem-green" }, 6);
        tulipLeaf(out, r, E, la + (r() - 0.5) * 0.2, 48 + r() * 14);
      },
      tulipShed(p),
    );
  }

  if (hasFlower) {
    const up = rad(-4 + (r() - 0.5) * 16);
    const flBase = add(tip, [0, -2]);
    part(out, Math.max(gTip, 0.26 + r() * 0.03), tip, () => tulipFlower(out, r, flBase, up, 32 + r() * 5), tulipFlowerFall(tip));
    part(out, Math.max(gTip, 0.46), tip, () => tulipCone(out, r, flBase, up, 38, false));
    part(out, Math.max(gTip, 0.46), tip, () => tulipCone(out, r, flBase, up, 38, true), tulipSamaraFall(tip));
  }
}

export function tuliptree(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0.01, 0.18];
  const main = grow(out, gm[0], gm[1], () =>
    limb(
      out,
      r,
      [at([-28, 10]), at([78, -18]), at([188, -62]), at([294, -124]), at([388, -196])],
      { w0: 38, w1: 10, cap: "blunt", lenticels: true, ...TULIP_BARK },
    ),
  );
  const parent = { res: main, g: gm };
  const forks = [
    branch(out, r, parent, 0.28, [[38, -56], [96, -124], [148, -192]], 0.08, { w0: 18, w1: 7.5, cap: "blunt", ...TULIP_BARK }),
    branch(out, r, parent, 0.5, [[54, 8], [142, -8], [228, -42]], 0.08, { w0: 16, w1: 6.8, cap: "blunt", ...TULIP_BARK }),
    branch(out, r, parent, 0.72, [[32, -44], [78, -104], [116, -158]], 0.08, { w0: 13, w1: 6, cap: "blunt", ...TULIP_BARK }),
  ];

  for (const [j, l] of [parent, ...forks].entries()) {
    const n = l.res.n;
    for (let i = Math.round(n * 0.3), k = 0, s = j % 2 ? 1 : -1; i <= n - 2; i += 10 + Math.floor(r() * 3), k++, s = -s) {
      const a = angleOf(l.res.pts, i) + s * rad(34 + r() * 16);
      tulipTwig(out, r, l, i / n, a, 46 + r() * 18, (k + j) % 2 === 0);
    }
  }
}

export function tuliptreeDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-140, 80], [-30, 36], [70, -10], [140, -42]], {
    w0: 11,
    w1: 5.5,
    cap: "blunt",
    lenticels: true,
    ...TULIP_BARK,
  });
  duckBillBud(out, r, twig.pts[twig.n], angleOf(twig.pts, twig.n), 1.8);
  for (const [u, ang, L] of [
    [0.28, rad(-126), 112],
    [0.64, rad(42), 104],
  ] as const) {
    const p = twig.pts[Math.round(twig.n * u)];
    const E = add(p, polar(42, ang));
    stalk(out, quad(p, lerp(p, E, 0.5), E), 3.2, 1.8, { pc: "--stem-green" }, 6);
    tulipLeaf(out, r, E, ang, L);
  }
  tulipFlower(out, r, twig.pts[Math.round(twig.n * 0.52)], rad(-8), 68);
  tulipCone(out, r, twig.pts[Math.round(twig.n * 0.86)], rad(-12), 68, true);
}

// ---------------------------------------------------------------------------
// 2. Sugar maple (Acer saccharum): slender glossy reddish-brown opposite twigs with sharp conical
// dark-brown winter buds, drooping chartreuse spring flower tassels on bare wood, broad 5-lobed
// palmate leaves with wide rounded U-shaped sinuses turning a mottled gradient of yellow,
// tangerine, and fluorescent scarlet in autumn, and paired horseshoe samaras with nearly parallel
// wings.

const SUGAR_BARK = { pc: "--bark-sugarmaple" };
const sugarShed = fallsAt(0.7, 0.1);
const sugarTasselFall = fallsAt(0.31, 0.03);
const sugarKeysFall = fallsAt(0.74, 0.04);

export function sugarMapleLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  // Five broad acuminate lobes separated by wide, rounded U-shaped sinuses (entire inside the
  // sinuses, with sparse blunt-tapering shoulder points on the 3 main lobes).
  const half: Pt[] = [
    [0, 0],
    [-0.08, 0.16],
    [-0.14, 0.38], // basal lobe lower shoulder
    [-0.22, 0.56], // basal lobe tip
    [-0.04, 0.42],
    [0.08, 0.34], // lower U-sinus
    [0.24, 0.56],
    [0.32, 0.78], // lateral lobe lower shoulder tooth
    [0.48, 0.92], // lateral lobe tip
    [0.54, 0.72], // lateral lobe upper shoulder tooth
    [0.44, 0.5],
    [0.48, 0.36], // deep rounded upper U-sinus
    [0.68, 0.38],
    [0.78, 0.46], // central lobe shoulder tooth
    [0.88, 0.24],
    [1.04, 0], // central lobe acuminate apex
  ];
  const sc = 0.94 + r() * 0.12;
  const upper = half.map(([x, y]): Pt => [x * L * sc, -y * L * sc]);
  const lower = half
    .slice(1, -1)
    .reverse()
    .map(([x, y]): Pt => [x * L * sc, y * L * sc * (0.96 + r() * 0.06)]);
  const pts = [...upper, ...lower].map(toW);
  // Wide hue spread (`hue: 36`) so across the crown leaves turn a mottled gradient of yellow,
  // tangerine, and fluorescent scarlet as `--leaf` transitions to `--pl-sugarmaple-autumn`.
  shape(out, r, pts, tone(r, { spread: 0.08, hue: 36 }), {
    deep: 0.4,
    deepAbout: toW([0.36 * L, 0]),
    ink: false,
  });
  out.push(`<path class="ink hair" d="${closed(pts)}"/>`);

  let veins = `M${P1(toW([0, 0]))}L${P1(toW([0.96 * L * sc, 0]))}`;
  for (const sg of [-1, 1]) {
    veins += `M${P1(toW([0, 0]))}L${P1(toW([0.45 * L * sc, sg * 0.86 * L * sc]))}`;
    veins += `M${P1(toW([0, 0]))}L${P1(toW([-0.19 * L * sc, sg * 0.5 * L * sc]))}`;
    veins += `M${P1(toW([0.52 * L * sc, 0]))}L${P1(toW([0.74 * L * sc, sg * 0.4 * L * sc]))}`;
  }
  out.push(`<path class="ink hair vein" d="${veins}"/>`);
}

function sugarMapleTassel(out: Out, r: Rng, T: Pt, s = 1) {
  let threads = "";
  let bells = "";
  const count = 6;
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1) - 0.5;
    const len = (24 + (1 - Math.abs(u)) * 14 + r() * 6) * s;
    const end = add(T, [u * 22 * s + (r() - 0.5) * 4, len]);
    const ctrl = add(lerp(T, end, 0.5), [u * 6 * s, -2 * s]);
    threads += `M${P1(T)}Q${P1(ctrl)} ${P1(end)}`;
    bells += closed(roundPts(end, 2.4 * s, 3.6 * s, rad(90) + u * 0.3, 6));
    for (const d of [-0.25, 0.25]) {
      threads += `M${P1(end)}L${P1(add(end, [d * 5 * s, 4.5 * s]))}`;
    }
  }
  out.push(`<path class="ink hair" style="stroke:var(--flower-tulip-cup)" d="${threads}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-tulip-cup", spread: 0.04 }))} d="${bells}"/><path class="ink hair" d="${bells}"/>`);
}

export function sugarMapleKeys(out: Out, r: Rng, T: Pt, a: number, s = 1) {
  const C = add(T, polar(12 * s, a));
  let wings = "";
  let nutlets = "";
  // Horseshoe samaras: plump globose nutlets and wings diverging at a narrow 22° half-angle.
  for (const side of [-1, 1]) {
    const w = a + side * rad(22);
    const seed = add(C, polar(3.2 * s, a + side * rad(54)));
    nutlets += closed(roundPts(seed, 3.8 * s, 3.2 * s, w, 7));
    const tip = add(seed, polar(24 * s, w));
    const belly = polar(5.2 * s, w + side * rad(90));
    wings += closed([
      seed,
      add(lerp(seed, tip, 0.42), belly),
      add(lerp(seed, tip, 0.84), mul(belly, 0.85)),
      tip,
      lerp(seed, tip, 0.65),
    ]);
  }
  out.push(`<path class="ink hair" d="M${P1(T)}L${P1(C)}"/>`);
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--keys-sugarmaple", spread: 0.05 }))} d="${wings}${nutlets}"/><path class="ink hair" d="${wings}${nutlets}"/>`);
}

function conicalBuds(out: Out, r: Rng, T: Pt, dir: number, sc = 1) {
  const toW = (p: Pt) => add(T, rot(p, dir));
  let d = closed([toW([0, -2.2 * sc]), toW([8.5 * sc, 0]), toW([0, 2.2 * sc])]);
  for (const sg of [-1, 1]) {
    d += closed([toW([-1 * sc, sg * 1.8 * sc]), toW([4.5 * sc, sg * 5.2 * sc]), toW([1.5 * sc, sg * 1.2 * sc])]);
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--bark-sugarmaple", dl: -0.14 }))} d="${d}"/><path class="ink hair" d="${d}"/>`);
}

function sugarMapleTwig(out: Out, r: Rng, parent: { res: Limb; g: number[] }, t: number, a: number, len: number, hasKeys: boolean) {
  const twig = branch(out, r, parent, t, [polar(len * 0.48, a), polar(len, a + (r() - 0.5) * 0.14)], 0.04, {
    w0: 3.8,
    w1: 1.5,
    cap: "taper",
    ...SUGAR_BARK,
  });
  const n = twig.res.n;
  const tip = twig.res.pts[n];
  const tipDir = angleOf(twig.res.pts, n);
  const gTip = gate(twig.res, twig.g, n) + 0.01;

  // Sharp conical terminal and opposite lateral buds stay all winter.
  part(out, gTip, tip, () => conicalBuds(out, r, tip, tipDir, 0.9));

  // Early spring drooping chartreuse flower tassels on bare twigs (gate + 0.01..0.34).
  part(out, gTip, tip, () => sugarMapleTassel(out, r, tip, 0.95), sugarTasselFall(tip));

  // Opposite pairs of broad 5-lobed U-sinused leaves.
  for (const [k, u] of [
    [0, 0.44],
    [1, 0.78],
  ] as const) {
    const i = Math.round(n * u);
    const p = twig.res.pts[i];
    const d = angleOf(twig.res.pts, Math.min(i, n - 1));
    const g = Math.max(gate(twig.res, twig.g, i) + 0.02, 0.18 + k * 0.04 + r() * 0.04);
    for (const side of [-1, 1]) {
      const la = d + side * rad(56 - k * 6);
      const pet = 18 + r() * 8;
      const E = add(p, polar(pet, la));
      part(
        out,
        g,
        p,
        () => {
          stalk(out, quad(p, add(lerp(p, E, 0.5), [0, -2]), E), 1.6, 0.9, { pc: "--stem-green" }, 5);
          sugarMapleLeaf(out, r, E, la + (r() - 0.5) * 0.22, 36 + r() * 10);
        },
        sugarShed(p),
      );
    }
  }

  if (hasKeys) {
    const iKey = Math.round(n * 0.6);
    const p = twig.res.pts[iKey];
    part(out, Math.max(gate(twig.res, twig.g, iKey) + 0.02, 0.36), p, () => sugarMapleKeys(out, r, p, rad(92), 1.05), sugarKeysFall(p));
  }
}

export function sugarmaple(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0.02, 0.18];
  const main = grow(out, gm[0], gm[1], () =>
    limb(out, r, [at([-26, 8]), at([72, -18]), at([176, -42]), at([288, -56]), at([392, -48])], {
      w0: 30,
      w1: 7.5,
      cap: "taper",
      ...SUGAR_BARK,
    }),
  );
  const parent = { res: main, g: gm };
  const tiers = [
    branch(out, r, parent, 0.24, [[36, -46], [108, -96], [192, -124], [268, -132]], 0.08, { w0: 15, w1: 3.8, cap: "taper", ...SUGAR_BARK }),
    branch(out, r, parent, 0.44, [[44, 16], [126, 32], [214, 34], [286, 22]], 0.08, { w0: 13.5, w1: 3.5, cap: "taper", ...SUGAR_BARK }),
    branch(out, r, parent, 0.66, [[34, -34], [102, -68], [182, -78]], 0.08, { w0: 11, w1: 3.2, cap: "taper", ...SUGAR_BARK }),
  ];

  // Opposite twig pairs along each tier.
  for (const [j, tier] of [parent, ...tiers].entries()) {
    const n = tier.res.n;
    for (let i = Math.round(n * 0.32), k = 0; i <= n - 3; i += 12 + Math.floor(r() * 3), k++) {
      const tang = angleOf(tier.res.pts, i);
      for (const side of [-1, 1]) {
        const a = tang + side * rad(34 + r() * 12);
        sugarMapleTwig(out, r, tier, i / n, a, 46 + r() * 18, side === 1 && (k + j) % 2 === 0);
      }
    }
  }
}

export function sugarmapleDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-150, 24], [-40, 8], [70, -8], [155, -16]], {
    w0: 7.5,
    w1: 2.8,
    cap: "taper",
    ...SUGAR_BARK,
  });
  conicalBuds(out, r, twig.pts[twig.n], angleOf(twig.pts, twig.n), 1.8);
  for (const [u, side, L] of [
    [0.36, -1, 86],
    [0.36, 1, 82],
    [0.78, -1, 76],
  ] as const) {
    const i = Math.round(twig.n * u);
    const p = twig.pts[i];
    const d = angleOf(twig.pts, i) + side * rad(58);
    const E = add(p, polar(38, d));
    stalk(out, quad(p, lerp(p, E, 0.5), E), 2.8, 1.6, { pc: "--stem-green" }, 6);
    sugarMapleLeaf(out, r, E, d, L);
  }
  sugarMapleTassel(out, r, twig.pts[Math.round(twig.n * 0.78)], 1.6);
  sugarMapleKeys(out, r, twig.pts[Math.round(twig.n * 0.56)], rad(94), 2.2);
}

// ---------------------------------------------------------------------------
// 3. Eastern redbud (Cercis canadensis): dark grey-maroon limbs and strongly zigzag black twigs
// dotted with lenticels, bursting in early spring with tight cauliflorous clusters
// of magenta-pink pea flowers directly on bare old wood and twigs before the broad entire cordate
// heart leaves unfold, followed by flat shuttle-shaped purple-brown pods that hang all winter.

const REDBUD_BARK = { pc: "--bark-redbud" };
const redbudShed = fallsAt(0.74, 0.1);
const redbudFlowerFall = fallsAt(0.35, 0.03);

function redbudZigzag(a: number, len: number, turns: number, r: Rng): Pt[] {
  const pts: Pt[] = [[0, 0]];
  let dir = a;
  for (let k = 1; k <= turns; k++) {
    dir += (k % 2 ? 1 : -1) * rad(26 + r() * 12);
    pts.push(add(pts[k - 1], polar(len / turns, dir)));
  }
  return pts;
}

export function redbudCluster(out: Out, r: Rng, O: Pt, baseDir: number, count: number, sc = 1) {
  let peds = "";
  let calyces = "";
  let corollas = "";
  for (let k = 0; k < count; k++) {
    const u = k / Math.max(1, count - 1) - 0.5;
    const a = baseDir + u * rad(118) + (r() - 0.5) * 0.18;
    const len = (11 + r() * 7) * sc;
    const C = add(O, polar(len, a));
    peds += `M${P1(O)}L${P1(C)}`;
    // Wine-red campanulate calyx at the base of the pea flower.
    calyces += closed(roundPts(C, 3.2 * sc, 2.4 * sc, a, 6));
    // Rose-magenta papilionaceous pea corolla: upright banner, two lateral wings, and boat keel.
    const banner = add(C, polar(5.4 * sc, a - rad(28)));
    const keel = add(C, polar(6.2 * sc, a + rad(18)));
    corollas += closed(roundPts(banner, 5.2 * sc, 4.2 * sc, a - 0.3, 7));
    corollas += closed(roundPts(keel, 5.8 * sc, 3.4 * sc, a + 0.2, 7));
  }
  out.push(`<path class="ink hair" style="stroke:var(--pod-redbud)" d="${peds}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--pod-redbud", dl: -0.04, spread: 0.03 }))} d="${calyces}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-redbud", spread: 0.04 }))} d="${corollas}"/><path class="ink hair petal-edge" d="${corollas}"/>`);
}

export function redbudLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const k = 0.96 + r() * 0.1;
  const n = 14;
  const upper: Pt[] = [];
  const lower: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    // Broadly cordate heart blade: rounded basal auricles dip behind O before sweeping to an acuminate tip.
    const x = (u - 0.15 * Math.sin(Math.PI * (1 - u) ** 2.1)) * L;
    const w = 0.5 * k * Math.sin(Math.PI * u ** 0.58) * (1 - 0.14 * u * u) * L;
    upper.push([x, -w]);
    lower.push([x, w * (0.96 + r() * 0.06)]);
  }
  const outline = [[0, 0] as Pt, ...upper.slice(1), ...lower.slice(1, -1).reverse()].map(toW);
  shape(out, r, outline, tone(r, { spread: 0.06, hue: 10 }), {
    deep: 0.4,
    deepAbout: toW([0.34 * L, 0]),
    ink: false,
  });
  let veins = "";
  for (const a of [-0.92, -0.48, 0, 0.48, 0.92]) {
    veins += line([[0, 0], [0.28 * L, a * 0.16 * L], [(0.8 - Math.abs(a) * 0.28) * L, a * 0.36 * L]].map((p) => toW(p as Pt)));
  }
  out.push(`<path class="ink hair" d="${closed(outline)}"/><path class="ink hair vein" d="${veins}"/>`);
}

export function redbudPods(out: Out, r: Rng, T: Pt, count: number, sc = 1) {
  let pods = "";
  let seams = "";
  let stalks = "";
  for (let k = 0; k < count; k++) {
    const lean = (k - (count - 1) / 2) * 0.26 + (r() - 0.5) * 0.12;
    const L = (46 + r() * 14) * sc;
    const W = (7.2 + r() * 1.4) * sc;
    const B = add(T, [lean * 10 * sc, 8 * sc]);
    stalks += `M${P1(T)}L${P1(B)}`;
    const at = (u: number, w: number): Pt =>
      add(B, rot([Math.sin(u * Math.PI) * L * 0.08 * (k % 2 ? 1 : -1) + w, u * L], lean));
    const lPts: Pt[] = [];
    const rPts: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      // Flat shuttle-shaped pod tapered sharply at both ends.
      const hw = W * Math.sin(Math.PI * u);
      lPts.push(at(u, -hw));
      rPts.push(at(u, hw));
    }
    pods += closed([...lPts, ...rPts.reverse()]);
    seams += line([at(0.12, W * 0.35), at(0.5, W * 0.52), at(0.88, W * 0.35)]);
  }
  out.push(`<path class="ink hair" d="${stalks}"/>`);
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--pod-redbud", spread: 0.05 }))} d="${pods}"/><path class="ink hair" d="${pods}${seams}"/>`);
}

function redbudTwig(out: Out, r: Rng, parent: { res: Limb; g: number[] }, t: number, a: number, len: number) {
  const zz = redbudZigzag(a, len, 5, r).slice(1);
  const twig = branch(out, r, parent, t, zz, 0.06, {
    w0: 4.8,
    w1: 1.6,
    cap: "taper",
    lenticels: true,
    ...REDBUD_BARK,
  });
  const n = twig.res.n;

  for (const [k, u] of [
    [0, 0.22],
    [1, 0.44],
    [2, 0.66],
    [3, 0.88],
  ] as const) {
    const i = Math.round(n * u);
    const p = twig.res.pts[i];
    const tang = angleOf(twig.res.pts, Math.min(i, n - 1));
    const side = k % 2 ? 1 : -1;
    const gNode = gate(twig.res, twig.g, i) + 0.01;
    // Early spring cauliflorous fascicles at every zigzag node right behind the extending wood.
    part(
      out,
      gNode,
      p,
      () => redbudCluster(out, r, p, tang + side * rad(64), 5, 0.9),
      redbudFlowerFall(p),
    );
    // Broad cordate heart leaves open after the flowers (0.22..0.34).
    const la = tang + side * rad(54);
    const pet = 16 + r() * 6;
    const E = add(p, polar(pet, la));
    part(
      out,
      Math.max(gate(twig.res, twig.g, i) + 0.02, 0.22 + k * 0.025 + r() * 0.03),
      p,
      () => {
        stalk(out, quad(p, lerp(p, E, 0.5), E), 1.8, 1.2, REDBUD_BARK, 5);
        redbudLeaf(out, r, E, la, 38 + r() * 10);
      },
      redbudShed(p),
    );
    // Flat purple-brown shuttle pods hang through summer, autumn, and bare winter (0.36..1.0).
    if (k === 1 || k === 2) {
      part(out, Math.max(gNode + 0.02, 0.36 + k * 0.01), p, () => redbudPods(out, r, p, 2 + (k % 2), 0.95));
    }
  }
}

export function redbud(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0.01, 0.15];
  const main = grow(out, gm[0], gm[1], () =>
    limb(
      out,
      r,
      [at([-24, 6]), at([52, -32]), at([118, -96]), at([206, -138]), at([298, -196]), at([372, -238])],
      { w0: 32, w1: 8.5, cap: "taper", lenticels: true, swell: [[0.36, 0.1], [0.64, 0.08]], ...REDBUD_BARK },
    ),
  );
  const parent = { res: main, g: gm };
  const limbs = [
    branch(out, r, parent, 0.36, [[48, -12], [116, -42], [188, -28], [254, -64]], 0.06, { w0: 14, w1: 4.2, cap: "taper", lenticels: true, ...REDBUD_BARK }),
    branch(out, r, parent, 0.62, [[-12, -48], [26, -106], [84, -152]], 0.06, { w0: 11.5, w1: 3.6, cap: "taper", lenticels: true, ...REDBUD_BARK }),
  ];

  // Cauliflorous clusters bursting directly from the thick old wood of the main trunk and limbs!
  for (const [l, knots] of [
    [parent, [0.24, 0.44, 0.56, 0.76]],
    [limbs[0], [0.32, 0.68]],
    [limbs[1], [0.42]],
  ] as const) {
    for (const [idx, u] of knots.entries()) {
      const i = Math.round(l.res.n * u);
      const p = l.res.pts[i];
      const tang = angleOf(l.res.pts, i);
      const side = idx % 2 ? 1 : -1;
      const g = gate(l.res, l.g, i) + 0.01;
      part(out, g, p, () => redbudCluster(out, r, p, tang + side * rad(78), 7, 1.05), redbudFlowerFall(p));
      if (idx % 2 === 0) {
        part(out, Math.max(g + 0.02, 0.36 + idx * 0.01), p, () => redbudPods(out, r, p, 3, 1.0));
      }
    }
  }

  for (const [j, l] of [parent, ...limbs].entries()) {
    const n = l.res.n;
    for (let i = Math.round(n * 0.3), s = j % 2 ? 1 : -1; i <= n - 2; i += 10 + Math.floor(r() * 3), s = -s) {
      redbudTwig(out, r, l, i / n, angleOf(l.res.pts, i) + s * rad(36 + r() * 18), 66 + r() * 24);
    }
  }
}

export function redbudDetail(out: Out, r: Rng) {
  const zz = redbudZigzag(rad(-18), 290, 5, r).map((p) => add(p, [-145, 50]));
  const twig = limb(out, r, zz, { w0: 9.5, w1: 3.2, cap: "taper", lenticels: true, ...REDBUD_BARK });
  for (const u of [0.22, 0.52, 0.82]) {
    const i = Math.round(twig.n * u);
    redbudCluster(out, r, twig.pts[i], rad(-75), 7, 1.55);
  }
  const pLeaf = twig.pts[Math.round(twig.n * 0.68)];
  const E = add(pLeaf, polar(34, rad(-135)));
  stalk(out, quad(pLeaf, lerp(pLeaf, E, 0.5), E), 2.8, 1.8, REDBUD_BARK, 5);
  redbudLeaf(out, r, E, rad(-135), 88);
  redbudPods(out, r, twig.pts[Math.round(twig.n * 0.38)], 3, 1.5);
}

// ---------------------------------------------------------------------------
// 4. Black walnut (Juglans nigra): stout dark-ridged twigs with notched 3-lobed "monkey-face" leaf
// scars and velvety terminal buds, drooping yellow-green spring catkins (0.18..0.36), long
// odd-pinnate fronds of 15–19 falcate leaflets that yellow and drop early in autumn (0.68..0.76),
// and solitary or paired globose warty lime-green nuts (0.40..0.86) lingering on the bare wood.

const WALNUT_BARK = { pc: "--bark-walnut" };
const walnutShed = fallsAt(0.68, 0.08);
const walnutCatkinFall = fallsAt(0.34, 0.03);
const walnutNutFall = fallsAt(0.83, 0.03);

function walnutScarsAndBud(out: Out, r: Rng, twig: Limb) {
  const n = twig.n;
  const tip = twig.pts[n];
  const tipDir = angleOf(twig.pts, n);
  // Velvety buff-grey terminal bud.
  const bud = roundPts(add(tip, polar(5, tipDir)), 5.5, 3.8, tipDir, 7);
  out.push(`<path class="wash felt"${vars(tone(r, { pc: "--pod-milkweed", dl: -0.05 }))} d="${closed(bud)}"/><path class="ink hair" d="${closed(bud)}"/>`);
  // Notched 3-lobed "monkey-face" leaf scars along the stout twig.
  let scars = "";
  let dots = "";
  for (const u of [0.35, 0.62, 0.86]) {
    const i = Math.round(n * u);
    const p = twig.pts[i];
    const a = angleOf(twig.pts, i);
    scars += closed(roundPts(p, 3.2, 2.6, a, 6));
    dots += `M${P1(add(p, [-1.2, -0.6]))}l.6 .4M${P1(add(p, [1.2, -0.6]))}l.6 .4M${P1(add(p, [0, 1.1]))}l.6 .4`;
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--cone-tulip", dl: -0.04 }))} d="${scars}"/><path class="ink hair" d="${scars}${dots}"/>`);
}

export function walnutCatkin(out: Out, r: Rng, T: Pt, L: number, sway = 0.14) {
  const spine = sample((t) => add(T, [Math.sin(t * 2.2) * L * sway, t * L]), 10);
  const lPts: Pt[] = [];
  const rPts: Pt[] = [];
  let scales = "";
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    const hw = 4.6 * Math.sin(Math.PI * Math.min(1, u * 1.05)) ** 0.7;
    const p = spine[i];
    lPts.push(add(p, [-hw, 0]));
    rPts.push(add(p, [hw, 0]));
    if (i > 0 && i < 10) {
      scales += `M${P1(add(p, [-hw * 0.85, -1]))}Q${P1(add(p, [0, 2.5]))} ${P1(add(p, [hw * 0.85, -1]))}`;
    }
  }
  const body = [...lPts, ...rPts.reverse()];
  shape(out, r, body, tone(r, { pc: "--nut-walnut", dl: -0.03, spread: 0.04 }), { deep: 0.25, ink: false });
  out.push(`<path class="ink hair" d="${closed(body)}${scales}"/>`);
}

export function walnutFrond(out: Out, r: Rng, T: Pt, dir: number, L: number) {
  // Clamp frond direction so lower fronds sweep gracefully outward rather than plunging straight down.
  const safeDir = Math.sin(dir) > 0.38 ? rad(22) : dir;
  const droop = Math.cos(safeDir) * 0.18 + 0.12;
  const ctrl = add(T, polar(L * 0.52, safeDir + droop * 0.45));
  const tip = add(T, polar(L, safeDir + droop));
  const rachis = sample(quad(T, ctrl, tip), 9);
  const backBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
  const frontBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
  // 8 pairs of ovate-lanceolate falcate leaflets + reduced terminal leaflet (17 leaflets total).
  for (let k = 1; k <= 8; k++) {
    const u = k / 9;
    const O = rachis[k];
    const tang = angleOf(rachis, k);
    const env = Math.sin(Math.PI * u ** 0.78) ** 0.72;
    const lfL = L * (0.14 + 0.16 * env);
    for (const side of [-1, 1]) {
      const b = {
        O,
        dir: tang + side * rad(56 - k * 2.2) + (r() - 0.5) * 0.08,
        L: lfL * (0.92 + r() * 0.14),
        W: 0.3,
      };
      if ((k + (side > 0 ? 1 : 0)) % 2 === 0) backBlades.push(b);
      else frontBlades.push(b);
    }
  }
  frontBlades.push({ O: tip, dir: angleOf(rachis, 9), L: L * 0.16, W: 0.28 });
  out.push(`<path class="ink thin" style="stroke:var(--bark-walnut)" d="${line(rachis)}"/>`);
  bladeBunch(out, backBlades, tone(r, { dl: -0.04, spread: 0.05, hue: 8 }));
  bladeBunch(out, frontBlades, tone(r, { dl: 0.03, spread: 0.05, hue: 10 }));
}

export function walnutNuts(out: Out, r: Rng, T: Pt, paired: boolean, R: number) {
  const spots: [number, number, number][] = paired
    ? [
        [-R * 0.72, R * 0.9, 1],
        [R * 0.76, R * 1.02, 0.94],
      ]
    : [[0, R * 0.92, 1]];
  let stems = "";
  let warts = "";
  for (const [dx, dy, sc] of spots) {
    const C = add(T, [dx, dy]);
    stems += `M${P1(T)}L${P1(add(C, [0, -R * sc * 0.85]))}`;
    const rr = R * sc;
    // Warty globose lime-green husk.
    const outline = sample((t) => {
      const a = t * TAU;
      const bump = 1 + 0.045 * Math.sin(a * 9) + 0.03 * Math.cos(a * 15);
      return add(C, [Math.cos(a) * rr * bump, Math.sin(a) * rr * bump]);
    }, 20).slice(0, -1);
    shape(out, r, outline, tone(r, { pc: "--nut-walnut", spread: 0.04 }), {
      deep: 0.45,
      deepAbout: add(C, [rr * 0.25, rr * 0.3]),
      cls: "wash fruit",
    });
    for (let k = 0; k < 10; k++) {
      const p = add(C, polar(rr * (0.2 + r() * 0.58), r() * TAU));
      warts += `M${P1(p)}l1 .8`;
    }
  }
  out.push(`<path class="ink thin" d="${stems}"/><path class="ink hair bumps" d="${warts}"/>`);
}

function walnutTwig(out: Out, r: Rng, parent: { res: Limb; g: number[] }, t: number, a: number, len: number, hasNuts: boolean) {
  const twig = branch(
    out,
    r,
    parent,
    t,
    [polar(len * 0.5, a), polar(len, a - 0.12)],
    0.04,
    { w0: 8.2, w1: 4.6, cap: "blunt", ...WALNUT_BARK },
  );
  const n = twig.res.n;
  const tip = twig.res.pts[n];
  const gTip = gate(twig.res, twig.g, n) + 0.01;

  part(out, gTip, tip, () => walnutScarsAndBud(out, r, twig.res));

  // Drooping green male catkins in spring (0.18..0.37).
  for (const [k, u] of [
    [0, 0.52],
    [1, 0.82],
  ] as const) {
    const iCat = Math.round(n * u);
    const p = twig.res.pts[iCat];
    part(out, Math.max(gate(twig.res, twig.g, iCat) + 0.015, 0.18 + k * 0.015), p, () => walnutCatkin(out, r, p, 56 + r() * 16), walnutCatkinFall(p));
  }

  // Long odd-pinnate fronds of 17 falcate leaflets (0.20..fallsAt(0.68, 0.08)).
  for (const [k, u, side] of [
    [0, 0.44, -1],
    [1, 0.72, 1],
    [2, 0.96, -0.35],
  ] as const) {
    const i = Math.round(n * u);
    const p = twig.res.pts[i];
    const d = angleOf(twig.res.pts, Math.min(i, n - 1)) + side * rad(42);
    part(
      out,
      Math.max(gate(twig.res, twig.g, i) + 0.02, 0.2 + k * 0.04 + r() * 0.04),
      p,
      () => walnutFrond(out, r, p, d, 134 + r() * 28),
      walnutShed(p),
    );
  }

  // Globose warty lime-green nuts (0.40..0.86), persisting on bare wood after the early leaf drop!
  if (hasNuts) {
    const iNut = Math.round(n * 0.78);
    const p = twig.res.pts[iNut];
    part(out, Math.max(gate(twig.res, twig.g, iNut) + 0.02, 0.4), p, () => walnutNuts(out, r, p, r() < 0.7, 15.5 + r() * 2), walnutNutFall(p));
  }
}

export function walnut(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0.02, 0.18];
  const main = grow(out, gm[0], gm[1], () =>
    limb(
      out,
      r,
      [at([-28, 8]), at([84, -18]), at([198, -46]), at([312, -68]), at([412, -62])],
      { w0: 36, w1: 11, cap: "blunt", ...WALNUT_BARK },
    ),
  );
  const parent = { res: main, g: gm };
  const forks = [
    branch(out, r, parent, 0.34, [[46, -48], [116, -98], [192, -126]], 0.07, { w0: 17, w1: 7.5, cap: "blunt", ...WALNUT_BARK }),
    branch(out, r, parent, 0.62, [[52, 8], [134, 14], [212, 4]], 0.07, { w0: 15, w1: 6.8, cap: "blunt", ...WALNUT_BARK }),
  ];

  for (const [j, l] of [parent, ...forks].entries()) {
    const n = l.res.n;
    for (let i = Math.round(n * 0.38), k = 0, s = j % 2 ? 1 : -1; i <= n - 2; i += 12 + Math.floor(r() * 4), k++, s = -s) {
      const a = angleOf(l.res.pts, i) + s * rad(28 + r() * 14);
      walnutTwig(out, r, l, i / n, a, 46 + r() * 16, (k + j) % 2 === 0);
    }
  }
}

export function walnutDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-150, -40], [-40, -48], [70, -52]], {
    w0: 14,
    w1: 8.5,
    cap: "blunt",
    ...WALNUT_BARK,
  });
  walnutScarsAndBud(out, r, twig);
  walnutCatkin(out, r, twig.pts[Math.round(twig.n * 0.35)], 115, 0.16);
  walnutFrond(out, r, twig.pts[Math.round(twig.n * 0.85)], rad(16), 240);
  walnutNuts(out, r, twig.pts[Math.round(twig.n * 0.62)], true, 26);
}

// ---------------------------------------------------------------------------
// 5. Virginia creeper (Parthenocissus quinquefolia): woody liana clinging to an upper canopy limb
// by branched tendrils tipped with flat oval adhesive disks, alternate 5-leaflet palmate leaves
// coarsely saw-toothed along the distal half (turning crimson-scarlet early in autumn), and vivid
// carmine-red branched pedicels (0.52..1.0) bearing pruinose blue-black berries (0.56..0.90).

const creeperShed = fallsAt(0.68, 0.08);
const creeperBerriesFall = fallsAt(0.86, 0.04);

function diskTendril(out: Out, r: Rng, P: Pt, dir: number, sc = 1) {
  let stems = "";
  let disks = "";
  const trunkEnd = add(P, polar(14 * sc, dir));
  stems += `M${P1(P)}L${P1(trunkEnd)}`;
  for (const [da, len] of [
    [-0.65, 14],
    [-0.22, 18],
    [0.24, 17],
    [0.68, 13],
  ] as const) {
    const a = dir + da;
    const tip = add(trunkEnd, polar(len * sc, a));
    const ctrl = add(lerp(trunkEnd, tip, 0.5), polar(3 * sc, a + rad(90)));
    stems += `M${P1(trunkEnd)}Q${P1(ctrl)} ${P1(tip)}`;
    disks += closed(roundPts(tip, 3.2 * sc, 2.1 * sc, a, 6));
  }
  out.push(`<path class="ink hair" d="${stems}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--bark-redbud", spread: 0.03 }))} d="${disks}"/><path class="ink hair" d="${disks}"/>`);
}

export function creeperLeaf(out: Out, r: Rng, T: Pt, a: number, L: number) {
  const hub = add(T, polar(L * 0.48, a));
  let stalks = `M${P1(T)}L${P1(hub)}`;
  let fill = "";
  let deep = "";
  let ink = "";
  // Five diamond-elliptic acuminate leaflets radiating from one point, coarsely saw-toothed on the outer half.
  for (const k of [-2, -1, 0, 1, 2]) {
    const d = a + k * rad(46);
    const l = L * (1 - Math.abs(k) * 0.11);
    const p0 = add(hub, polar(l * 0.14, d));
    stalks += `M${P1(hub)}L${P1(p0)}`;
    const toW = (p: Pt) => add(p0, rot(p, d));
    const lfL = l * 0.86;
    const lfW = lfL * 0.38;
    const up: Pt[] = [[0, 0]];
    const dn: Pt[] = [];
    const steps = 8;
    for (let i = 1; i < steps; i++) {
      const u = i / steps;
      const env = Math.sin(Math.PI * u ** 0.85) ** 0.8;
      // Coarse saw-teeth along the distal half (u >= 0.45).
      const saw = u >= 0.45 && i % 2 === 1 ? 1.18 : 0.94;
      const hw = (lfW / 2) * env * saw;
      up.push([u * lfL, -hw]);
      dn.push([u * lfL, hw]);
    }
    const pts = [...up, [lfL * 1.04, 0] as Pt, ...dn.reverse()].map(toW);
    fill += closed(glaze(pts, r));
    deep += closed(glaze(pts, r, { k: 0.38, about: toW([lfL * 0.45, 0]), amp: 0.05, shift: [0.5, 1.5] }));
    ink += `${closed(pts)}M${P1(p0)}L${P1(toW([lfL * 0.92, 0]))}`;
  }
  const v = tone(r, { spread: 0.06, hue: 10 });
  out.push(`<path class="ink hair" style="stroke:var(--pedicel-creeper)" d="${stalks}"/>`);
  out.push(`<path class="wash"${vars(v)} d="${fill}"/><path class="wash deep"${vars(v)} d="${deep}"/><path class="ink hair" d="${ink}"/>`);
}

export function creeperPedicels(out: Out, r: Rng, T: Pt, L: number, withBerries: boolean) {
  const tips: Pt[] = [];
  let stalks = "";
  let hubs = "";
  const mainEnd = add(T, [4, L * 0.58]);
  stalks += `M${P1(T)}L${P1(mainEnd)}`;
  for (const [u, side, reach] of [
    [0.36, -1, 0.38],
    [0.56, 1, 0.42],
    [0.78, -1, 0.36],
    [0.96, 1, 0.34],
  ] as const) {
    const node = lerp(T, mainEnd, u);
    const branchEnd = add(node, [side * L * reach, L * 0.22]);
    stalks += `M${P1(node)}L${P1(branchEnd)}`;
    for (const [dx, dy] of [
      [-side * 7, 11],
      [side * 8, 9],
      [side * 2, 16],
    ] as const) {
      const tip = add(branchEnd, [dx * (L / 52), dy * (L / 52)]);
      stalks += `M${P1(branchEnd)}L${P1(tip)}`;
      hubs += closed(roundPts(tip, 1.8, 1.8, 0, 5));
      tips.push(tip);
    }
  }
  if (!withBerries) {
    // Vivid carmine-red branched pedicels that persist on the bare winter vine.
    out.push(`<path class="ink mid" style="stroke:var(--pedicel-creeper)" d="${stalks}"/>`);
    out.push(`<path class="wash"${vars(tone(r, { pc: "--pedicel-creeper", spread: 0.03 }))} d="${hubs}"/>`);
    return;
  }
  let berries = "";
  let blooms = "";
  const R = Math.max(4.4, L * 0.095);
  for (const c of tips) {
    berries += closed(roundPts(c, R, R * 1.04, 0, 8));
    blooms += closed(roundPts(add(c, [-R * 0.26, -R * 0.26]), R * 0.42, R * 0.32, -0.4, 6));
  }
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--berry-creeper", spread: 0.04 }))} d="${berries}"/>`);
  out.push(`<path class="wash shine" d="${blooms}"/><path class="ink hair" d="${berries}"/>`);
}

export function creeper(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Gnarled woody liana plunging diagonally from the overhead canopy edge.
  const gm: [number, number] = [0.02, 0.2];
  const main = grow(out, gm[0], gm[1], () =>
    limb(
      out,
      r,
      [at([-20, -14]), at([12, 32]), at([45, 75]), at([86, 122]), at([125, 165])],
      {
        w0: 14,
        w1: 5.5,
        cap: "taper",
        pc: "--bark-walnut",
        swell: [
          [0.35, 0.12],
          [0.68, 0.1],
        ],
      },
    ),
  );
  const parent = { res: main, g: gm };
  const trails = [
    branch(out, r, parent, 0.24, [[-42, 85], [-68, 195], [-52, 305], [-64, 395]], 0.18, { w0: 6.2, w1: 1.8, cap: "taper", pc: "--bark" }),
    branch(out, r, parent, 0.56, [[-16, 95], [14, 205], [-10, 310], [8, 392]], 0.16, { w0: 6.5, w1: 1.8, cap: "taper", pc: "--bark" }),
    branch(out, r, parent, 0.88, [[28, 72], [48, 156], [32, 244]], 0.1, { w0: 5.4, w1: 1.6, cap: "taper", pc: "--bark" }),
  ];

  for (const [j, l] of [parent, ...trails].entries()) {
    const n = l.res.n;
    const step = j === 0 ? 6 : 6;
    for (let i = 6, k = 0; i <= n - 1; i += step, k++) {
      const T = l.res.pts[i];
      const tang = angleOf(l.res.pts, Math.min(i, n - 1));
      const side = k % 2 ? 1 : -1;
      const gNode = gate(l.res, l.g, i) + 0.015;

      if (k % 2 === 0 && T[1] > 35) {
        part(out, gNode, T, () => diskTendril(out, r, T, tang - side * rad(62), 0.95));
      }

      const leafSide = j === 0 && T[1] < 65 ? 1 : side;
      const la = tang + leafSide * rad(52 + (r() - 0.5) * 16);
      part(
        out,
        Math.max(gate(l.res, l.g, i) + 0.02, 0.18 + (k % 5) * 0.024 + r() * 0.02),
        T,
        () => creeperLeaf(out, r, T, la, (j === 0 ? 64 : 56) + r() * 14),
        creeperShed(T),
      );

      if (k % 3 === 1 && i >= 12) {
        const pedL = 52 + r() * 12;
        part(out, Math.max(gNode + 0.02, 0.5), T, () => creeperPedicels(out, r, T, pedL, false));
        part(out, Math.max(gNode + 0.02, 0.54), T, () => creeperPedicels(out, r, T, pedL, true), creeperBerriesFall(T));
      }
    }
  }
}

export function creeperDetail(out: Out, r: Rng) {
  const vine = limb(out, r, [[-150, -90], [-20, -82], [130, -92]], {
    w0: 9,
    w1: 5,
    cap: "taper",
    pc: "--bark",
  });
  diskTendril(out, r, vine.pts[Math.round(vine.n * 0.25)], rad(-78), 1.8);
  creeperLeaf(out, r, vine.pts[Math.round(vine.n * 0.38)], rad(102), 118);
  const pBerry = vine.pts[Math.round(vine.n * 0.72)];
  creeperPedicels(out, r, pBerry, 92, false);
  creeperPedicels(out, r, pBerry, 92, true);
}

// ---------------------------------------------------------------------------
// 6. Trumpet vine (Campsis radicans): bold S-curving woody canes arching out and down with nodal
// aerial rootlets, opposite 7–11-leaflet coarsely serrate pinnate leaves, terminal clusters of
// large 6–9 cm orange-scarlet tubular trumpets with yellow-orange throats (0.34..0.68), and long
// curved cigar-shaped woody capsules (0.58..1.0) splitting into two boat valves in winter.

const TRUMPET_VINE = { pc: "--bark-pale", dl: -0.06 };
const trumpetShed = fallsAt(0.72, 0.1);
const trumpetFlowerFall = fallsAt(0.65, 0.03);

export function trumpetLeaf(out: Out, r: Rng, T: Pt, a: number, L: number) {
  const ctrl = add(lerp(T, add(T, polar(L, a)), 0.5), polar(L * 0.06, a + rad(90)));
  const tip = add(T, polar(L, a));
  const rachis = sample(quad(T, ctrl, tip), 5);
  let fill = "";
  let deep = "";
  let ink = line(rachis);
  // 4 opposite pairs + 1 terminal coarsely serrate ovate-acuminate leaflet (9 leaflets).
  const specs: { O: Pt; dir: number; l: number }[] = [];
  for (let k = 1; k <= 4; k++) {
    const O = rachis[k];
    const tang = angleOf(rachis, k);
    const sc = Math.sin(Math.PI * (k / 5) ** 0.75);
    for (const side of [-1, 1]) {
      specs.push({ O, dir: tang + side * rad(58), l: L * (0.22 + 0.12 * sc) });
    }
  }
  specs.push({ O: tip, dir: angleOf(rachis, 5), l: L * 0.32 });
  for (const { O, dir, l } of specs) {
    const toW = (p: Pt) => add(O, rot(p, dir));
    const w = l * 0.44;
    const up: Pt[] = [[0, 0]];
    const dn: Pt[] = [];
    for (let i = 1; i < 8; i++) {
      const u = i / 8;
      const env = Math.sin(Math.PI * u ** 0.75);
      const saw = i % 2 === 1 ? 1.18 : 0.88;
      const hw = (w / 2) * env * saw;
      up.push([u * l, -hw]);
      dn.push([u * l, hw]);
    }
    const pts = [...up, [l * 1.05, 0] as Pt, ...dn.reverse()].map(toW);
    fill += closed(glaze(pts, r));
    deep += closed(glaze(pts, r, { k: 0.34, about: toW([l * 0.45, 0]), amp: 0.05, shift: [0.5, 1.5] }));
    ink += `${closed(pts)}M${P1(O)}L${P1(toW([l * 0.88, 0]))}`;
  }
  const v = tone(r, { spread: 0.06, hue: 10 });
  out.push(`<path class="wash"${vars(v)} d="${fill}"/><path class="wash deep"${vars(v)} d="${deep}"/><path class="ink hair" d="${ink}"/>`);
}

export function trumpetCorolla(out: Out, r: Rng, B: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(B, rot(p, dir));
  // 5-toothed leathery reddish-tan calyx clasping the narrow basal tube.
  const calyx: Pt[] = [
    [0, -L * 0.06],
    [L * 0.26, -L * 0.1],
    [L * 0.22, -L * 0.03],
    [L * 0.28, 0],
    [L * 0.22, L * 0.03],
    [L * 0.26, L * 0.1],
    [0, L * 0.06],
  ].map(toW);
  shape(out, r, calyx, tone(r, { pc: "--flower-trumpet", dl: -0.1, dc: 0.75, spread: 0.03 }), { deep: 0.25, ink: false });

  // Long flaring tubular-funnelform orange-scarlet corolla with 5 rounded lobes.
  const tube: Pt[] = [
    [L * 0.18, -L * 0.06],
    [L * 0.52, -L * 0.15],
    [L * 0.84, -L * 0.24],
    [L * 0.98, -L * 0.34],
    [L * 1.06, -L * 0.2],
    [L * 1.02, -L * 0.08],
    [L * 1.1, 0],
    [L * 1.02, L * 0.08],
    [L * 1.06, L * 0.2],
    [L * 0.98, L * 0.34],
    [L * 0.84, L * 0.24],
    [L * 0.52, L * 0.15],
    [L * 0.18, L * 0.06],
  ].map(toW);
  shape(out, r, tube, tone(r, { pc: "--flower-trumpet", spread: 0.04 }), {
    deep: 0.38,
    deepAbout: toW([L * 0.65, 0]),
    cls: "wash petal",
    ink: false,
  });

  // Glowing yellow-orange throat inside the mouth + fine nectar lines + stamens.
  const throat: Pt[] = [
    [L * 0.46, -L * 0.09],
    [L * 0.88, -L * 0.18],
    [L * 0.96, 0],
    [L * 0.88, L * 0.18],
    [L * 0.46, L * 0.09],
  ].map(toW);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-trumpet-throat", spread: 0.03 }))} d="${closed(throat)}"/>`);
  let lines = "";
  for (const y of [-0.09, 0, 0.09]) {
    lines += `M${P1(toW([L * 0.48, L * y * 0.5]))}L${P1(toW([L * 0.92, L * y]))}`;
  }
  out.push(`<path class="ink hair" style="stroke:var(--flower-trumpet)" d="${lines}"/>`);
  out.push(`<path class="ink hair petal-edge" d="${closed(calyx)}${closed(tube)}"/>`);
}

export function trumpetCluster(out: Out, r: Rng, T: Pt, baseDir: number, L: number) {
  // Terminal cyme of 5 flaring orange-scarlet trumpets and 2 unopened buds.
  for (const [da, lenK, isBud] of [
    [-0.68, 0.56, true],
    [0.68, 0.56, true],
    [-0.44, 0.92, false],
    [0.44, 0.92, false],
    [-0.2, 0.98, false],
    [0.2, 0.98, false],
    [0, 1.04, false],
  ] as const) {
    const a = baseDir + da;
    const ped = add(T, polar(L * 0.16, a));
    out.push(`<path class="ink thin" d="M${P1(T)}L${P1(ped)}"/>`);
    if (isBud) {
      const tip = add(ped, polar(L * lenK, a));
      const mid = lerp(ped, tip, 0.58);
      const nrm = polar(L * 0.09, a + rad(90));
      const bPts = [ped, add(mid, nrm), tip, sub(mid, nrm)];
      shape(out, r, bPts, tone(r, { pc: "--flower-trumpet", dl: -0.05, spread: 0.03 }), { deep: 0.3, cls: "wash petal" });
    } else {
      trumpetCorolla(out, r, ped, a, L * lenK);
    }
  }
}

export function trumpetPod(out: Out, r: Rng, T: Pt, L: number, lean: number, split: boolean) {
  const at = (u: number, w: number): Pt =>
    add(T, rot([Math.sin(u * Math.PI) * L * 0.11 + w, 10 + u * L], lean));
  out.push(`<path class="ink thin" d="M${P1(T)}L${P1(at(0, 0))}"/>`);
  if (!split) {
    // Closed curved cigar-shaped capsule with longitudinal keel seam.
    const lPts: Pt[] = [];
    const rPts: Pt[] = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const hw = L * 0.075 * Math.sin(Math.PI * u) ** 0.72;
      lPts.push(at(u, -hw));
      rPts.push(at(u, hw));
    }
    const body = [...lPts, ...rPts.reverse()];
    shape(out, r, body, tone(r, { pc: "--pod-trumpet", spread: 0.04 }), { deep: 0.35, cls: "wash fruit" });
    out.push(`<path class="ink hair" d="${line(sample((u) => at(u, 0), 8))}"/>`);
    return;
  }
  // Winter capsule split lengthwise into two curved boat-shaped valves with a pale central septum.
  for (const side of [-1, 1]) {
    const outer: Pt[] = [];
    const inner: Pt[] = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const gap = Math.sin(Math.PI * u) * L * 0.065;
      const hw = L * 0.052 * Math.sin(Math.PI * u) ** 0.75;
      outer.push(at(u, side * (gap + hw)));
      inner.push(at(u, side * Math.max(0, gap - hw * 0.35)));
    }
    const valve = [...outer, ...inner.reverse()];
    shape(out, r, valve, tone(r, { pc: "--pod-trumpet", dl: side * 0.03, spread: 0.04 }), { deep: 0.3, ink: false });
    out.push(`<path class="ink hair" d="${closed(valve)}"/>`);
  }
  out.push(`<path class="ink hair" style="stroke:var(--cone-tulip)" d="${line(sample((u) => at(u, 0), 8))}"/>`);
}

export function trumpetvine(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Three bold S-curving woody canes arching out and down from the canopy edge.
  const caneSpecs: { ctrl: Pt[]; g: [number, number]; pc: string; w0: number }[] = [
    {
      ctrl: [at([-15, -12]), at([-68, 72]), at([-118, 178]), at([-96, 286]), at([-72, 382])],
      g: [0.03, 0.2],
      pc: "--bark-walnut",
      w0: 10.5,
    },
    {
      ctrl: [at([10, -12]), at([34, 92]), at([-18, 214]), at([16, 342]), at([6, 456])],
      g: [0.05, 0.22],
      pc: "--bark-tulip",
      w0: 11.5,
    },
    {
      ctrl: [at([35, -12]), at([98, 68]), at([152, 168]), at([134, 274]), at([108, 368])],
      g: [0.07, 0.24],
      pc: "--bark-walnut",
      w0: 10.0,
    },
  ];

  for (const [j, spec] of caneSpecs.entries()) {
    const cane = grow(out, spec.g[0], spec.g[1], () => {
      const c = limb(out, r, spec.ctrl, { w0: spec.w0, w1: 3.2, cap: "taper", pc: spec.pc });
      // Nodal rows of short aerial rootlets along the upper woody cane.
      let rootlets = "";
      for (const u of [0.16, 0.32]) {
        const p = c.pts[Math.round(c.n * u)];
        for (let k = -2; k <= 2; k++) {
          rootlets += `M${P1(add(p, [k * 2.2, 2]))}l${(k * 0.6).toFixed(1)} 6`;
        }
      }
      out.push(`<path class="ink hair root" d="${rootlets}"/>`);
      return c;
    });

    const n = cane.n;
    // Opposite pairs of coarsely serrate odd-pinnate leaves along each arching cane.
    for (const [k, u] of [
      [0, 0.2],
      [1, 0.38],
      [2, 0.56],
      [3, 0.74],
      [4, 0.88],
    ] as const) {
      const i = Math.round(n * u);
      const p = cane.pts[i];
      const tang = angleOf(cane.pts, Math.min(i, n - 1));
      const gLeaf = Math.max(gate(cane, spec.g, i) + 0.02, 0.2 + k * 0.024 + r() * 0.02);
      for (const side of [-1, 1]) {
        const la = tang + side * rad(58 - k * 4);
        part(out, gLeaf, p, () => trumpetLeaf(out, r, p, la, 96 - k * 6 + r() * 12), trumpetShed(p));
      }
    }

    // Terminal cluster of large orange-scarlet tubular trumpets (0.34..0.68).
    const tip = cane.pts[n];
    const tipDir = angleOf(cane.pts, n);
    const gTip = gate(cane, spec.g, n) + 0.02;
    part(out, Math.max(gTip, 0.34 + j * 0.015), tip, () => trumpetCluster(out, r, tip, tipDir, 68 + r() * 8), trumpetFlowerFall(tip));
    // Long curved cigar-shaped woody capsules (0.58..1.0), splitting into two boat valves in winter.
    const lean = (j - 1) * 0.18;
    part(out, Math.max(gTip, 0.58), tip, () => trumpetPod(out, r, tip, 114, lean, true));
    part(out, Math.max(gTip, 0.58), tip, () => trumpetPod(out, r, tip, 114, lean, false), 0.78 + j * 0.01, true);
  }
}

export function trumpetvineDetail(out: Out, r: Rng) {
  const cane = limb(out, r, [[-140, -130], [-40, -50], [10, 20]], {
    w0: 9,
    w1: 4.5,
    cap: "taper",
    ...TRUMPET_VINE,
  });
  const node = cane.pts[Math.round(cane.n * 0.42)];
  trumpetLeaf(out, r, node, rad(155), 145);
  trumpetLeaf(out, r, node, rad(-18), 145);
  trumpetCluster(out, r, cane.pts[cane.n], rad(68), 96);
  trumpetPod(out, r, cane.pts[Math.round(cane.n * 0.2)], 148, -0.35, true);
}

// ---------------------------------------------------------------------------
// 7. Dutchman's pipe (Aristolochia macrophylla): twining woody stems plunging into a cascading
// curtain, shingled with oversized orbicular-reniform kidney-heart leaves (0.18..0.72..0.82),
// pendulous U-curved yellow-green and chocolate-maroon smoking-pipe flowers (0.26..0.54),
// and 6-ribbed charcoal-black hanging basket capsules (0.54..1.0) splitting from the base up.

const PIPE_VINE = { pc: "--bark-sugarmaple", dl: -0.05 };
const pipeShed = fallsAt(0.72, 0.1);
const pipeFlowerFall = fallsAt(0.51, 0.03);

export function pipeLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const k = 0.96 + r() * 0.08;
  const n = 16;
  const upper: Pt[] = [];
  const lower: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    // Orbicular-reniform kidney-heart blade: deep rounded basal auricles sweep behind O (`x < 0`)
    // and flare into wide rounded cheeks (`W ≈ 1.06 * L`) with a short blunt tip.
    const x = (u - 0.22 * Math.sin(Math.PI * (1 - u) ** 1.85)) * L;
    const w = 0.54 * k * Math.sin(Math.PI * u ** 0.52) * (1 - 0.08 * u * u) * L;
    upper.push([x, -w]);
    lower.push([x, w * (0.96 + r() * 0.06)]);
  }
  const outline = [[0, 0] as Pt, ...upper.slice(1), ...lower.slice(1, -1).reverse()].map(toW);
  shape(out, r, outline, tone(r, { spread: 0.06, hue: 8 }), {
    deep: 0.44,
    deepAbout: toW([0.32 * L, 0]),
    ink: false,
  });
  let veins = "";
  for (const a of [-1.05, -0.54, 0, 0.54, 1.05]) {
    veins += line([[0, 0], [0.26 * L, a * 0.18 * L], [(0.78 - Math.abs(a) * 0.26) * L, a * 0.38 * L]].map((p) => toW(p as Pt)));
  }
  out.push(`<path class="ink hair" d="${closed(outline)}"/><path class="ink hair vein" d="${veins}"/>`);
}

export function pipeFlower(out: Out, r: Rng, T: Pt, sc = 1, flip = 1) {
  const top = add(T, [flip * 4 * sc, 24 * sc]);
  out.push(`<path class="ink hair" d="M${P1(T)}Q${P1(add(T, [flip * 8 * sc, 12 * sc]))} ${P1(top)}"/>`);
  // Strongly U-curved smoking-pipe calyx tube: inflated pendent utricle descending from `top`,
  // bending sharply at the bottom elbow, and ascending into a yellow-green pipe bowl.
  const at = (x: number, y: number): Pt => add(top, [flip * x * sc, y * sc]);
  const pipePts: Pt[] = [
    at(-3, 0),
    at(-9, 10),
    at(-10, 24),
    at(-6, 36),
    at(4, 40),
    at(16, 36),
    at(22, 24),
    at(22, 12),
    at(12, 12),
    at(11, 22),
    at(7, 28),
    at(1, 27),
    at(-1, 18),
    at(2, 8),
    at(3, 0),
  ];
  shape(out, r, pipePts, tone(r, { pc: "--flower-pipe", spread: 0.04 }), {
    deep: 0.38,
    deepAbout: at(4, 30),
    cls: "wash petal",
    ink: false,
  });
  out.push(`<path class="ink hair petal-edge" d="${closed(pipePts)}"/>`);

  // Flat 3-lobed velvety chocolate-maroon limb flaring at the upturned mouth of the pipe.
  const mouth = at(17, 10);
  const limbPts = roundPts(mouth, 11 * sc, 9.5 * sc, flip * 0.25, 9);
  shape(out, r, limbPts, tone(r, { pc: "--flower-pipe-limb", spread: 0.04 }), {
    deep: 0.35,
    cls: "wash petal",
    ink: false,
  });
  const eye = roundPts(mouth, 3.6 * sc, 3.2 * sc, 0, 6);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--flower-pipe", dl: 0.08 }))} d="${closed(eye)}"/>`);
  out.push(`<path class="ink hair petal-edge" d="${closed(limbPts)}${closed(eye)}"/>`);
}

export function pipeCapsule(out: Out, r: Rng, T: Pt, sc = 1, split = true) {
  const pedEnd = add(T, [0, 32 * sc]);
  if (!split) {
    out.push(`<path class="ink hair" d="M${P1(T)}L${P1(pedEnd)}"/>`);
    const C = add(pedEnd, [0, 22 * sc]);
    const body = roundPts(C, 13 * sc, 22 * sc, 0, 12);
    shape(out, r, body, tone(r, { pc: "--capsule-pipe", spread: 0.04 }), { deep: 0.4, ink: false });
    let ribs = "";
    for (const f of [-0.6, -0.2, 0.2, 0.6]) {
      ribs += `M${P1(pedEnd)}Q${P1(add(C, [f * 18 * sc, 0]))} ${P1(add(C, [0, 22 * sc]))}`;
    }
    out.push(`<path class="ink hair" d="${closed(body)}${ribs}"/>`);
    return;
  }
  // Winter 6-ribbed hanging basket capsule splitting basipetally (from the pedicel base upward into
  // 6 parachute-like thread ribs above the open boat-valved basket!).
  const basketTop = add(T, [0, 14 * sc]);
  const basketMid = add(T, [0, 36 * sc]);
  const basketBot = add(T, [0, 56 * sc]);
  let threads = `M${P1(T)}L${P1(basketTop)}`;
  let valves = "";
  for (const f of [-1, -0.55, -0.18, 0.18, 0.55, 1]) {
    const elbow = add(basketMid, [f * 16 * sc, 0]);
    threads += `M${P1(basketTop)}Q${P1(add(basketTop, [f * 14 * sc, 10 * sc]))} ${P1(elbow)}`;
    valves += closed([
      elbow,
      add(elbow, [f * 2.5 * sc, 10 * sc]),
      basketBot,
      add(elbow, [-f * 2 * sc, 9 * sc]),
    ]);
  }
  out.push(`<path class="ink hair" d="${threads}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--capsule-pipe", spread: 0.04 }))} d="${valves}"/><path class="ink hair" d="${valves}"/>`);
}

export function dutchmanspipe(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Twining woody stems plunging from the overhead edge into a cascading curtain (y = 0..440).
  const gm: [number, number] = [0.03, 0.22];
  const main = grow(out, gm[0], gm[1], () =>
    limb(
      out,
      r,
      [at([0, -12]), at([-28, 86]), at([24, 196]), at([-22, 316]), at([14, 436])],
      { w0: 10.5, w1: 2.8, cap: "taper", ...PIPE_VINE },
    ),
  );
  const parent = { res: main, g: gm };
  const loops = [
    branch(out, r, parent, 0.22, [[-56, 78], [-88, 178], [-64, 286]], 0.14, { w0: 6.8, w1: 2.2, cap: "taper", ...PIPE_VINE }),
    branch(out, r, parent, 0.38, [[58, 74], [92, 168], [68, 268]], 0.14, { w0: 6.4, w1: 2.0, cap: "taper", ...PIPE_VINE }),
  ];

  // Pendulous U-curved pipe flowers (0.26..0.54) and winter 6-ribbed hanging baskets (0.54..1.0).
  for (const [j, l] of [parent, ...loops].entries()) {
    const n = l.res.n;
    const step = 6;
    for (let i = 6, k = 0; i <= n - 1; i += step, k++) {
      const T = l.res.pts[i];
      const gNode = gate(l.res, l.g, i) + 0.015;
      if ((k + j) % 2 === 0) {
        part(
          out,
          Math.max(gNode, 0.26 + (k % 4) * 0.012),
          T,
          () => pipeFlower(out, r, add(T, [0, 6]), 1.08, k % 4 === 0 ? -1 : 1),
          pipeFlowerFall(T),
        );
      }
      if (k === 2 || k === 5) {
        part(out, Math.max(gNode, 0.54), T, () => pipeCapsule(out, r, T, 1.05, true));
        part(out, Math.max(gNode, 0.54), T, () => pipeCapsule(out, r, T, 1.05, false), 0.78, true);
      }
      // Dense overlapping shingle of huge orbicular-reniform kidney-heart leaves (0.18..0.33).
      const side = k % 2 ? 1 : -1;
      const la = rad(88 + side * (24 + (r() - 0.5) * 16));
      const pet = 16 + r() * 8;
      const E = add(T, polar(pet, la));
      part(
        out,
        Math.max(gate(l.res, l.g, i) + 0.02, 0.18 + (k % 5) * 0.026 + r() * 0.02),
        T,
        () => {
          stalk(out, quad(T, lerp(T, E, 0.5), E), 2.2, 1.4, { pc: "--stem-green" }, 5);
          pipeLeaf(out, r, E, la, (j === 0 ? 82 : 74) + r() * 18);
        },
        pipeShed(T),
      );
    }
  }
}

export function dutchmanspipeDetail(out: Out, r: Rng) {
  const vine = limb(out, r, [[-150, -110], [-20, -96], [130, -108]], {
    w0: 9,
    w1: 4.8,
    cap: "taper",
    ...PIPE_VINE,
  });
  const pLeaf = vine.pts[Math.round(vine.n * 0.3)];
  const E = add(pLeaf, polar(28, rad(102)));
  stalk(out, quad(pLeaf, lerp(pLeaf, E, 0.5), E), 3.2, 2.0, { pc: "--stem-green" }, 5);
  pipeLeaf(out, r, E, rad(102), 148);
  pipeFlower(out, r, vine.pts[Math.round(vine.n * 0.62)], 2.2, 1);
  pipeCapsule(out, r, vine.pts[Math.round(vine.n * 0.88)], 1.85, true);
}

// ---------------------------------------------------------------------------
// 8. Compass plant (Silphium laciniatum): stiffly erect deeply 1–2-pinnatifid oak-like basal and
// lower stem leaves (0.14..0.86), and a tall rough-haired resinous stem (staying all winter)
// tiered along its upper half with large chrome-yellow sunflower heads (--flower-compass,
// 0.46..0.68, leave: 0.70) over dark hairy involucral cups (--disc-compass, 0.44..1.0) that stand
// as a dark skeleton all winter.

const compassLeafFall = fallsAt(0.84, 0.03);

export function compassLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const bend = (r() - 0.5) * 0.08;
  const mid = (s: number): Pt => [s * L, bend * L * s * s];
  const toW = (p: Pt) => add(O, rot(p, dir));
  // Deeply 1-pinnatifid leaf cut nearly to the rachis into 6 pairs of narrow linear-oblong lobes
  // separated by wide rounded sinuses.
  const lobes = 6;
  const W = 0.44 * L;
  const half = (s: number) => {
    const env = Math.sin(Math.PI * Math.min(1, s) ** 0.72) ** 0.75;
    const wave = Math.sin(Math.PI * lobes * s);
    const lobe = wave > 0 ? 0.12 + 0.88 * wave ** 0.55 : 0.11;
    return (W / 2) * env * lobe;
  };
  const N = 56;
  const up = sample((s) => add(mid(s), [0, -half(s)]), N);
  const dn = sample((s) => add(mid(s), [0, half(Math.min(1, s + 0.03))]), N);
  const pts = [...up, mid(1.03), ...dn.slice(0, -1).reverse()].map(toW);
  shape(out, r, pts, tone(r, { spread: 0.06, hue: 10 }), {
    deep: 0.45,
    deepAbout: toW(mid(0.42)),
    ink: false,
  });
  let veins = line(sample(mid, 8).map(toW));
  for (let k = 0; k < lobes; k++) {
    const s = (k + 0.5) / lobes;
    for (const sg of [-1, 1]) {
      const sSide = sg > 0 ? Math.max(0.05, s - 0.03) : s;
      veins += `M${P1(toW(mid(sSide - 0.03)))}L${P1(toW(add(mid(sSide), [0, sg * half(s) * 0.88])))}`;
    }
  }
  out.push(`<path class="ink hair" d="${closed(pts)}"/><path class="ink hair vein" d="${veins}"/>`);
}

export function compassCup(out: Out, r: Rng, C: Pt, R: number, tilt = 0) {
  const toW = (p: Pt) => add(C, rot(p, tilt));
  // Coarse spreading-tipped phyllaries cupping the dark resinous receptacle disc.
  let bracts = "";
  for (let k = -4; k <= 4; k++) {
    const u = k / 4;
    const bBase = toW([u * R * 0.34, R * 0.14]);
    const bTip = toW([u * R * 0.62, R * (0.36 - Math.abs(u) * 0.14)]);
    const bMid = lerp(bBase, bTip, 0.5);
    const nrm: Pt = [-u * R * 0.06, -R * 0.09];
    bracts += closed([bBase, add(bMid, nrm), bTip, sub(bMid, nrm)]);
  }
  const disc = roundPts(C, R * 0.36, R * 0.24, tilt, 12);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--disc-compass", spread: 0.04 }))} d="${bracts}${closed(disc)}"/><path class="ink hair" d="${bracts}${closed(disc)}"/>`);
}

export function compassRays(out: Out, r: Rng, C: Pt, R: number, tilt = 0) {
  const toW = (p: Pt) => add(C, rot(p, tilt));
  let rays = "";
  const count = 24;
  for (let k = 0; k < count; k++) {
    const a = (k / count) * TAU + (r() - 0.5) * 0.06;
    const rx = Math.cos(a);
    const ry = Math.sin(a) * 0.72;
    const r0 = toW([rx * R * 0.3, ry * R * 0.3]);
    const rTip = toW([rx * R, ry * R]);
    const rMid = lerp(r0, rTip, 0.54);
    const nrm = toW([-ry * R * 0.095, rx * R * 0.095]);
    const nVec = sub(nrm, C);
    rays += closed([r0, add(rMid, nVec), rTip, sub(rMid, nVec)]);
  }
  const goldCenter = roundPts(C, R * 0.28, R * 0.18, tilt, 10);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-compass", spread: 0.04 }))} d="${rays}"/><path class="ink hair petal-edge" d="${rays}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--disc-compass", dl: 0.04, spread: 0.03 }))} d="${closed(goldCenter)}"/><path class="ink hair" d="${closed(goldCenter)}"/>`);
}

export function compassplant(out: Out, r: Rng, base: Pt) {
  const H = 540;
  const n = 24;
  const spine = sample((t) => add(base, [Math.sin(t * 1.9) * 10 - t * 6, -t * H]), n);
  const gs: [number, number] = [0.04, 0.26];

  // Tall rough-haired resinous stem stays all winter (no `leave`).
  const stem = grow(out, gs[0], gs[1], () => {
    const st = stalk(out, (t) => spine[Math.round(t * n)], 11.5, 4.2, tone(r, { pc: "--disc-compass", dl: -0.04, spread: 0.03 }), n);
    let hairs = "";
    for (let i = 2; i < n; i++) {
      const p = spine[i];
      const side = i % 2 ? 1 : -1;
      hairs += `M${P1(add(p, [side * 4, 0]))}l${(side * 4.5).toFixed(1)} -2.5`;
    }
    out.push(`<path class="ink hair" d="${hairs}"/>`);
    return { ...st, pts: spine, n };
  });

  // Huge stiffly erect deeply pinnatifid basal leaves (0.06..0.86).
  for (const [k, deg, L] of [
    [0, -118, 225],
    [1, -64, 232],
    [2, -104, 248],
    [3, -76, 242],
    [4, -130, 195],
    [5, -52, 198],
  ] as const) {
    const O = add(base, [(k - 2.5) * 6, -4]);
    part(out, 0.06 + k * 0.015, O, () => compassLeaf(out, r, O, rad(deg), L + r() * 16), compassLeafFall(O));
  }

  // Smaller clasping pinnatifid cauline leaves along the lower half of the stem.
  for (const [k, u, side, L] of [
    [0, 0.22, -1, 148],
    [1, 0.32, 1, 134],
    [2, 0.42, -1, 114],
    [3, 0.5, 1, 96],
  ] as const) {
    const i = Math.round(n * u);
    const p = spine[i];
    const d = rad(-90 + side * (38 + k * 4));
    part(
      out,
      Math.max(gate(stem, gs, i) + 0.015, 0.14 + k * 0.02),
      p,
      () => compassLeaf(out, r, p, d, L),
      compassLeafFall(p),
    );
  }

  // Upper half tiered with 7 large sunflower heads over dark hairy involucral cups that stay all winter!
  for (let k = 0; k < 7; k++) {
    const u = 0.54 + (k / 6) * 0.46;
    const i = Math.round(n * u);
    const p = spine[i];
    const side = k % 2 ? 1 : -1;
    const reach = k === 6 ? 4 : 22 - k * 1.8;
    const C = add(p, [side * reach, -8]);
    const R = (k === 6 ? 35 : 38 - k * 1.4) + r() * 3;
    const tilt = side * 0.22;

    // Dark hairy involucral cup and stalk (0.33..1.0, staying all winter as a dark skeleton).
    const gCup = Math.max(gate(stem, gs, i) + 0.015, 0.33 + k * 0.006);
    part(out, gCup, p, () => {
      out.push(`<path class="ink mid" style="stroke:var(--disc-compass)" d="M${P1(p)}L${P1(C)}"/>`);
      compassCup(out, r, C, R, tilt);
    });
    // Chrome-yellow sunflower rays (0.35..0.72).
    part(out, Math.max(gCup + 0.01, 0.35 + k * 0.008), C, () => compassRays(out, r, C, R, tilt), 0.7 + k * 0.004);
  }
}

export function compassplantDetail(out: Out, r: Rng) {
  compassLeaf(out, r, [-130, 140], rad(-42), 260);
  const C: Pt = [45, -35];
  compassCup(out, r, C, 92, 0.1);
  compassRays(out, r, C, 92, 0.1);
}

// ---------------------------------------------------------------------------
// 9. Big bluestem (Andropogon gerardii): tall prairie tussock of 3-point arching glaucous
// blue-green blades and culms with purplish nodes (staying all year, turning flame-copper and
// wine-burgundy in autumn via --pl-bluestem-autumn), crowned from late spring through winter
// (0.38..1.0) by digitate 3-branched "turkey-foot" racemes (--plume-bluestem) fringed with
// silvery hairs.

export function turkeyFoot(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  let rames = "";
  let hairs = "";
  let awns = "";
  // Three digitate spike-like rames diverging from one point like a three-toed turkey's foot.
  for (const [da, lenK] of [
    [-0.44, 0.92],
    [0, 1.04],
    [0.44, 0.92],
  ] as const) {
    const a = dir + da;
    const rLen = L * lenK;
    const tip = add(O, polar(rLen, a));
    const nrm = polar(1, a + rad(90));
    const steps = 7;
    for (let k = 0; k < steps; k++) {
      const u0 = k / steps;
      const u1 = (k + 0.85) / steps;
      const p0 = lerp(O, tip, u0);
      const p1 = lerp(O, tip, u1);
      const hw = Math.max(1.8, L * 0.048 * Math.sin(Math.PI * (u0 + 0.15)));
      rames += closed([add(p0, mul(nrm, hw * 0.4)), add(lerp(p0, p1, 0.5), mul(nrm, hw)), p1, sub(lerp(p0, p1, 0.5), mul(nrm, hw))]);
      // Silvery rachis hairs and fine bent brown awns along each rame.
      const side = k % 2 ? 1 : -1;
      const hTip = add(p1, polar(L * 0.14, a + side * rad(38)));
      hairs += `M${P1(p0)}L${P1(hTip)}`;
      if (k >= 2) {
        const awnTip = add(p1, polar(L * 0.18, a - side * rad(26)));
        awns += `M${P1(p1)}L${P1(awnTip)}`;
      }
    }
  }
  out.push(`<path class="ink wool" d="${hairs}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--plume-bluestem", spread: 0.05 }))} d="${rames}"/><path class="ink hair" d="${rames}${awns}"/>`);
}

export function bluestem(out: Out, r: Rng, base: Pt) {
  // Dense basal fountain of 3-point arching glaucous blue-green blades (staying all year, turning
  // flame-copper and wine-burgundy in autumn via species tone `--leaf`).
  const count = 48;
  const groups: { O: Pt; dir: number; L: number; W: number }[][] = [[], [], []];
  let basalWool = "";
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1);
    const a = rad(-90 + (u - 0.5) * 136 + (r() - 0.5) * 10);
    const L = (195 + Math.sin(u * Math.PI) * 95 + (r() - 0.5) * 32);
    const droop = Math.cos(a) * 0.56;
    const O = add(base, [(u - 0.5) * 44 + (r() - 0.5) * 6, (r() - 0.5) * 3]);
    const p1 = add(O, polar(L * 0.42, a));
    const p2 = add(p1, polar(L * 0.32, a + droop * 0.48));
    const W = 0.038;
    groups[k % 3].push(
      { O, dir: a, L: L * 0.44, W: W * 1.3 },
      { O: p1, dir: a + droop * 0.48, L: L * 0.34, W: W * 1.1 },
      { O: p2, dir: a + droop * 1.1, L: L * 0.26, W },
    );
    if (k % 3 === 0) {
      basalWool += `M${P1(O)}L${P1(add(O, polar(14, a + (r() - 0.5) * 0.3)))}`;
    }
  }
  part(out, 0.05, base, () => {
    bladeBunch(out, groups[0], tone(r, { dl: -0.04, spread: 0.05, hue: 10 }));
    bladeBunch(out, groups[1], tone(r, { dl: 0.01, spread: 0.05, hue: 12 }));
    bladeBunch(out, groups[2], tone(r, { dl: 0.05, spread: 0.05, hue: 10 }));
    out.push(`<path class="ink wool" d="${basalWool}"/>`);
  });

  // Eight tall culms with purplish nodes rising above the basal tussock (staying all year).
  const culms = 8;
  for (let k = 0; k < culms; k++) {
    const u = k / (culms - 1);
    const H = 390 + Math.sin(u * Math.PI) * 110 + (r() - 0.5) * 28;
    const lean = (u - 0.48) * 0.42 + (r() - 0.5) * 0.06;
    const foot = add(base, [(u - 0.5) * 32, -2]);
    const mid = add(foot, [lean * H * 0.36, -H * 0.58]);
    const top = add(foot, [lean * H, -H]);
    const spine = sample(quad(foot, mid, top), 12);
    const gc: [number, number] = [0.05 + k * 0.012, 0.22 + k * 0.008];

    const culm = grow(out, gc[0], gc[1], () => {
      const st = stalk(out, (t) => spine[Math.round(t * 12)], 3.8, 1.6, tone(r, { spread: 0.04, hue: 10 }), 12);
      // Purplish-black nodes and ascending cauline blades along the culm.
      let nodes = "";
      const cauline: { O: Pt; dir: number; L: number; W: number }[] = [];
      for (const idx of [3, 6, 9]) {
        const p = spine[idx];
        const ca = angleOf(spine, idx);
        nodes += closed(roundPts(p, 2.6, 2.2, ca, 6));
        const side = (idx + k) % 2 ? 1 : -1;
        cauline.push({ O: p, dir: ca + side * rad(28), L: 68 - idx * 3, W: 0.045 });
      }
      bladeBunch(out, cauline, tone(r, { dl: 0.02, spread: 0.05 }));
      out.push(`<path class="wash"${vars(tone(r, { pc: "--plume-bluestem", dl: -0.12 }))} d="${nodes}"/><path class="ink hair" d="${nodes}"/>`);
      return { ...st, pts: spine, n: 12 };
    });

    const tipDir = angleOf(spine, 12);
    // Digitate 3-branched "turkey-foot" terminal raceme (0.38..1.0, staying all winter).
    part(out, Math.max(gate(culm, gc, 12) + 0.02, 0.38 + k * 0.005), top, () => {
      turkeyFoot(out, r, top, tipDir, 62 + r() * 10);
    });
  }
}

export function bluestemDetail(out: Out, r: Rng) {
  const spine = sample(quad([-30, 170], [-8, 20], [18, -80]), 12);
  stalk(out, (t) => spine[Math.round(t * 12)], 6.5, 3.2, tone(r, { spread: 0.04 }), 12);
  for (const [idx, side] of [
    [4, -1],
    [8, 1],
  ] as const) {
    const p = spine[idx];
    const ca = angleOf(spine, idx);
    const node = roundPts(p, 4.8, 3.8, ca, 7);
    out.push(`<path class="wash"${vars(tone(r, { pc: "--plume-bluestem", dl: -0.12 }))} d="${closed(node)}"/><path class="ink thin" d="${closed(node)}"/>`);
    blade(out, r, p, ca + side * rad(32), 135, { W: 0.065, v: tone(r, { spread: 0.05 }), deep: 0.3, rib: "ink hair", hairline: true });
  }
  turkeyFoot(out, r, spine[12], angleOf(spine, 12), 145);
}

// ---------------------------------------------------------------------------
// 10. Common milkweed (Asclepias syriaca): stout upright stems (staying all winter) with opposite
// broad oblong leaves marked by a pale pink midrib (0.14..0.70..0.80), spherical axillary umbels
// of dusty rose-pink crowned flowers (--flower-milkweed, 0.35..0.72), and plump warty grey
// follicles (--pod-milkweed, 0.54..1.0) splitting open in autumn/winter (0.72..1.0) to spill brown
// seeds on white silky comas (--wool).

const milkweedShed = fallsAt(0.7, 0.1);
const milkweedFlowerFall = fallsAt(0.68, 0.04);

export function milkweedLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const W = 0.48 * L;
  // Broadly oblong-elliptic leaf with rounded base and short mucronate tip.
  const prof = (s: number) => Math.sin(Math.PI * Math.min(1, s * 0.94 + 0.03) ** 0.72) ** 0.62;
  const up = sample((s) => [s * L, -(W / 2) * prof(s)] as Pt, 14);
  const dn = sample((s) => [s * L, (W / 2) * prof(s)] as Pt, 14);
  const pts = [...up, [L * 1.03, 0] as Pt, ...dn.slice(0, -1).reverse()].map(toW);
  shape(out, r, pts, tone(r, { spread: 0.05, hue: 8 }), {
    deep: 0.38,
    deepAbout: toW([0.4 * L, 0]),
    ink: false,
  });
  let veins = "";
  for (let k = 1; k <= 6; k++) {
    const s = k / 7;
    const hw = (W / 2) * prof(s) * 0.86;
    for (const sg of [-1, 1]) {
      veins += `M${P1(toW([s * L, 0]))}Q${P1(toW([(s + 0.04) * L, sg * hw * 0.6]))} ${P1(toW([(s + 0.06) * L, sg * hw]))}`;
    }
  }
  out.push(`<path class="ink hair" d="${closed(pts)}"/><path class="ink hair vein" d="${veins}"/>`);
  // Creamy-pink prominent midrib characteristic of Asclepias syriaca.
  out.push(`<path class="ink thin" style="stroke:var(--flower-milkweed)" d="M${P1(toW([0, 0]))}L${P1(toW([0.95 * L, 0]))}"/>`);
}

export function milkweedUmbel(out: Out, r: Rng, P: Pt, dir: number, R: number) {
  const C = add(P, polar(R * 0.68, dir));
  let peds = `M${P1(P)}Q${P1(add(lerp(P, C, 0.5), [0, -4]))} ${P1(C)}`;
  let reflexed = "";
  let crowns = "";
  const count = 24;
  for (let k = 0; k < count; k++) {
    const a = k * rad(137.5);
    const q = Math.sqrt((k + 0.5) / count);
    const fPos = add(C, [Math.cos(a) * R * q, Math.sin(a) * R * q * 0.88]);
    peds += `M${P1(C)}L${P1(fPos)}`;
    const s = R * 0.17;
    // Reflexed dusty-rose petals below + erect paler-pink 5-hooded corona crown above.
    reflexed += closed(roundPts(add(fPos, [0, s * 0.32]), s * 0.72, s * 0.48, a, 6));
    crowns += closed(roundPts(add(fPos, [0, -s * 0.22]), s * 0.58, s * 0.54, a + 0.5, 6));
  }
  out.push(`<path class="ink hair" style="stroke:var(--flower-milkweed)" d="${peds}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-milkweed", dl: -0.05, spread: 0.04 }))} d="${reflexed}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-milkweed", dl: 0.07, spread: 0.03 }))} d="${crowns}"/><path class="ink hair petal-edge" d="${crowns}"/>`);
}

export function milkweedPod(out: Out, r: Rng, P: Pt, side: number, L: number, open: boolean) {
  // S-curved pedicel lifting an erect warty lance-ovoid follicle.
  const B = add(P, [side * 16, -6]);
  const sCurve = `M${P1(P)}Q${P1(add(P, [side * 12, 8]))} ${P1(B)}`;
  const dir = rad(-76 + side * 14);
  const toW = (p: Pt) => add(B, rot(p, dir));
  const podPts: Pt[] = [
    [0, 0],
    [L * 0.18, -L * 0.22],
    [L * 0.44, -L * 0.25],
    [L * 0.74, -L * 0.16],
    [L * 1.02, -L * 0.03],
    [L * 0.74, L * 0.14],
    [L * 0.44, L * 0.22],
    [L * 0.18, L * 0.2],
  ].map(toW);

  if (!open) {
    out.push(`<path class="ink thin" d="${sCurve}"/>`);
    shape(out, r, podPts, tone(r, { pc: "--pod-milkweed", spread: 0.04 }), {
      deep: 0.38,
      deepAbout: toW([L * 0.38, L * 0.05]),
      cls: "wash fruit",
    });
    // Soft warty tubercles along the follicle body.
    let warts = "";
    for (const [x, y] of [
      [0.24, -0.1],
      [0.36, 0.08],
      [0.48, -0.12],
      [0.58, 0.06],
      [0.7, -0.06],
      [0.3, 0.0],
    ] as const) {
      const wp = toW([L * x, L * y]);
      warts += `M${P1(wp)}l2.2 -1.2`;
    }
    out.push(`<path class="ink hair bumps" d="${warts}"/>`);
    return;
  }

  // Split autumn/winter follicle spilling overlapping brown seeds on white silky comas (--wool).
  out.push(`<path class="ink thin" d="${sCurve}"/>`);
  shape(out, r, podPts, tone(r, { pc: "--pod-milkweed", dl: -0.05, spread: 0.04 }), {
    deep: 0.42,
    ink: true,
  });
  // Billowing white silky coma cloud emerging from the split ventral seam.
  const silkCloud = roundPts(toW([L * 0.56, -L * 0.2]), L * 0.34, L * 0.24, dir + 0.3, 10);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--wool", spread: 0.02 }))} d="${closed(silkCloud)}"/>`);
  let silkThreads = "";
  let seeds = "";
  for (let k = 0; k < 10; k++) {
    const sOrigin = toW([L * (0.28 + k * 0.055), -L * 0.04]);
    const comaTip = add(sOrigin, [side * (18 + k * 2.2), -14 - (k % 3) * 6]);
    silkThreads += `M${P1(sOrigin)}Q${P1(add(lerp(sOrigin, comaTip, 0.5), [0, -6]))} ${P1(comaTip)}`;
    if (k % 2 === 0) {
      seeds += closed(roundPts(sOrigin, 3.8, 2.6, dir, 6));
    }
  }
  out.push(`<path class="ink wool" d="${silkThreads}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--bark-walnut", spread: 0.04 }))} d="${seeds}"/><path class="ink hair" d="${seeds}"/>`);
}

export function milkweed(out: Out, r: Rng, base: Pt) {
  const stems: [number, number, number][] = [
    [-28, 305, -0.07],
    [4, 345, 0.02],
    [34, 285, 0.09],
  ];
  stems.forEach(([dx, H, lean], sIdx) => {
    const B = add(base, [dx, 0]);
    const n = 16;
    const spine = sample((t) => add(B, [lean * H * t + Math.sin(t * Math.PI) * 6, -t * H]), n);
    const gs: [number, number] = [0.05 + sIdx * 0.02, 0.23 + sIdx * 0.02];
    const stem = grow(out, gs[0], gs[1], () => ({
      ...stalk(out, (t) => spine[Math.round(t * n)], 8.2, 4.2, tone(r, { pc: "--pod-milkweed", dl: -0.04, spread: 0.03 }), n),
      pts: spine,
      n,
    }));

    // Opposite pairs of broad oblong leaves with pale pink midribs (0.14..0.70..0.80).
    for (const [k, u] of [
      [0, 0.24],
      [1, 0.44],
      [2, 0.64],
      [3, 0.84],
    ] as const) {
      const i = Math.round(n * u);
      const p = spine[i];
      const tang = angleOf(spine, i);
      const gLeaf = Math.max(gate(stem, gs, i) + 0.015, 0.14 + k * 0.03 + r() * 0.02);
      for (const side of [-1, 1]) {
        const la = tang + side * rad(56 - k * 4);
        const L = (74 - k * 6 + r() * 8) * (sIdx === 1 ? 1.06 : 0.94);
        part(out, gLeaf, p, () => milkweedLeaf(out, r, p, la, L), milkweedShed(p));
      }
    }

    // Spherical axillary umbels of dusty rose-pink flowers (0.35..0.72).
    for (const [u, side, R] of [
      [0.68, sIdx % 2 ? -1 : 1, 28],
      [0.88, sIdx % 2 ? 1 : -1, 32],
    ] as const) {
      const iUmbel = Math.round(n * u);
      const p = spine[iUmbel];
      part(out, Math.max(gate(stem, gs, iUmbel) + 0.02, 0.35 + sIdx * 0.012), p, () => milkweedUmbel(out, r, p, rad(-90 + side * 42), R), milkweedFlowerFall(p));
    }

    // Plump warty grey follicles (0.54..1.0), splitting at 0.72 to spill white silky comas (--wool).
    const iPod = Math.round(n * 0.76);
    const podNode = spine[iPod];
    const podSide = sIdx === 0 ? -1 : 1;
    const gPod = Math.max(gate(stem, gs, iPod) + 0.02, 0.54);
    part(out, gPod, podNode, () => milkweedPod(out, r, podNode, podSide, 62, true));
    part(out, gPod, podNode, () => milkweedPod(out, r, podNode, podSide, 62, false), 0.72 + sIdx * 0.01, true);
  });
}

export function milkweedDetail(out: Out, r: Rng) {
  const spine = sample((t) => [-10, 150 - t * 280], 10);
  stalk(out, (t) => spine[Math.round(t * 10)], 12, 7.5, tone(r, { pc: "--pod-milkweed", dl: -0.04 }), 10);
  milkweedLeaf(out, r, spine[3], rad(-146), 135);
  milkweedLeaf(out, r, spine[3], rad(-32), 135);
  milkweedUmbel(out, r, spine[7], rad(-132), 58);
  milkweedPod(out, r, spine[6], 1, 108, true);
}

// ---------------------------------------------------------------------------
// 11. Dense blazing star (Liatris spicata): dense basal tuft of 3-point arching grass-like linear
// blades (0.06..0.88) and tall unbranched leafy wands (staying all winter) packed with sessile
// button heads: fluffy magenta-purple thread-styled florets (--flower-blazingstar) opening
// strictly from TOP to BOTTOM (basipetally, so top heads open at 0.34 and bottom heads at 0.44,
// fading to tan pappus cups 0.70..1.0).

const blazingLeafFall = fallsAt(0.86, 0.03);

function liatrisHead(out: Out, r: Rng, C: Pt, side: number, R: number, phase: "cup" | "bloom") {
  if (phase === "cup") {
    // Sessile involucral cup + tan barbellate pappus tuft (stays through winter).
    const cup = roundPts(C, R * 0.72, R * 0.62, side * 0.25, 7);
    const pappus = roundPts(add(C, [side * R * 0.35, -R * 0.25]), R * 0.65, R * 0.52, side * 0.3, 7);
    out.push(`<path class="wash"${vars(tone(r, { pc: "--pl-blazingstar-autumn", dl: 0.05, spread: 0.04 }))} d="${closed(pappus)}"/>`);
    out.push(`<path class="wash"${vars(tone(r, { pc: "--pl-blazingstar-autumn", dl: -0.08, spread: 0.04 }))} d="${closed(cup)}"/><path class="ink hair" d="${closed(cup)}"/>`);
    return;
  }
  // Fluffy discoid magenta-purple button head with long exserted curly thread-styles.
  const puff = roundPts(add(C, [side * R * 0.28, -R * 0.18]), R, R * 0.84, side * 0.25, 8);
  let threads = "";
  for (let k = 0; k < 6; k++) {
    const a = rad(-90 + side * 42 + (k - 2.5) * 26);
    const p0 = add(C, polar(R * 0.4, a));
    const p1 = add(C, polar(R * 1.48, a + (k % 2 ? 0.22 : -0.22)));
    const ctrl = add(lerp(p0, p1, 0.5), polar(R * 0.28, a + rad(90)));
    threads += `M${P1(p0)}Q${P1(ctrl)} ${P1(p1)}`;
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-blazingstar", spread: 0.05 }))} d="${closed(puff)}"/>`);
  out.push(`<path class="ink hair" style="stroke:var(--flower-blazingstar)" d="${threads}"/>`);
}

export function blazingstar(out: Out, r: Rng, base: Pt) {
  // Dense basal tuft of 3-point arching grass-like linear blades (0.06..0.88).
  const tuftCount = 38;
  const blades: { O: Pt; dir: number; L: number; W: number }[] = [];
  for (let k = 0; k < tuftCount; k++) {
    const u = k / (tuftCount - 1);
    const a = rad(-90 + (u - 0.5) * 144 + (r() - 0.5) * 8);
    const L = 128 + Math.sin(u * Math.PI) * 58 + (r() - 0.5) * 22;
    const droop = Math.cos(a) * 0.52;
    const O = add(base, [(u - 0.5) * 34, -2]);
    const p1 = add(O, polar(L * 0.48, a));
    blades.push(
      { O, dir: a, L: L * 0.52, W: 0.048 },
      { O, dir: a + droop * 0.58, L: L * 0.52, W: 0.038 },
    );
    blades[blades.length - 1].O = p1;
  }
  part(out, 0.06, base, () => bladeBunch(out, blades, tone(r, { spread: 0.06, hue: 10 })), blazingLeafFall(base));

  // Five tall unbranched leafy wands (staying all winter).
  const wands: [number, number, number][] = [
    [-26, 365, -0.07],
    [-11, 415, -0.03],
    [2, 445, 0.01],
    [15, 400, 0.04],
    [28, 345, 0.08],
  ];

  wands.forEach(([dx, H, lean], wIdx) => {
    const B = add(base, [dx, 0]);
    const n = 20;
    const spine = sample((t) => add(B, [lean * H * t + Math.sin(t * Math.PI) * 4, -t * H]), n);
    const gw: [number, number] = [0.05 + wIdx * 0.012, 0.23 + wIdx * 0.012];
    const wand = grow(out, gw[0], gw[1], () => ({
      ...stalk(out, (t) => spine[Math.round(t * n)], 4.6, 2.2, tone(r, { pc: "--pl-blazingstar-autumn", dl: -0.08, spread: 0.03 }), n),
      pts: spine,
      n,
    }));

    // Ascending linear cauline leaves along the lower 52% of the wand.
    const cauline: { O: Pt; dir: number; L: number; W: number }[] = [];
    for (let i = 2; i <= 10; i++) {
      const p = spine[i];
      const side = (i + wIdx) % 2 ? 1 : -1;
      const ca = angleOf(spine, i) + side * rad(28 + (10 - i) * 2);
      cauline.push({ O: p, dir: ca, L: 56 - i * 3.4, W: 0.065 });
    }
    const midWand = spine[6];
    part(out, Math.max(gate(wand, gw, 10) + 0.015, 0.18), midWand, () => bladeBunch(out, cauline, tone(r, { spread: 0.05 })), blazingLeafFall(midWand));

    // Terminal cylindrical spike (upper 48% of wand): 16 sessile button heads opening STRICTLY
    // TOP-TO-BOTTOM (basipetally: uSpike = 0 at top opens at 0.34, uSpike = 1 at bottom opens at 0.44).
    const heads = 16;
    for (let h = 0; h < heads; h++) {
      // uSpike runs 0 (top of spike, t = 0.99) -> 1 (bottom of spike, t = 0.52).
      const uSpike = h / (heads - 1);
      const tWand = 0.99 - uSpike * 0.47;
      const iHead = Math.round(tWand * n);
      const p = spine[iHead];
      const side = h % 2 ? 1 : -1;
      const C = add(p, [side * 4.5, 0]);
      const R = 7.2 + Math.sin(uSpike * Math.PI) * 2.2;
      const gCup = Math.max(gate(wand, gw, iHead) + 0.015, 0.32 + uSpike * 0.03);
      const gOpen = Math.max(gCup + 0.01, 0.34 + uSpike * 0.1);
      const gFade = 0.7 + uSpike * 0.04;

      // Involucral cup and tan pappus stay through winter (0.32..1.0).
      part(out, gCup, p, () => liatrisHead(out, r, C, side, R, "cup"));
      // Fluffy magenta-purple florets open basipetally (0.34 at top -> 0.44 at bottom) and fade.
      part(out, gOpen, p, () => liatrisHead(out, r, C, side, R, "bloom"), gFade, true);
    }
  });
}

export function blazingstarDetail(out: Out, r: Rng) {
  const spine = sample((t) => [0, 175 - t * 350], 20);
  stalk(out, (t) => spine[Math.round(t * 20)], 8, 4.2, tone(r, { pc: "--pl-blazingstar-autumn", dl: -0.08 }), 20);
  for (let i = 1; i <= 5; i++) {
    const p = spine[i];
    const side = i % 2 ? 1 : -1;
    blade(out, r, p, rad(-90 + side * 34), 95 - i * 8, { W: 0.08, v: tone(r, { spread: 0.05 }), deep: 0.3, rib: "ink hair", hairline: true });
  }
  // Basipetal close study: top heads in full fluffy magenta bloom, lowest heads still green/opening buds!
  const heads = 14;
  for (let h = 0; h < heads; h++) {
    const uSpike = h / (heads - 1);
    const tWand = 0.98 - uSpike * 0.68;
    const p = spine[Math.round(tWand * 20)];
    const side = h % 2 ? 1 : -1;
    const C = add(p, [side * 9, 0]);
    const R = 15 - uSpike * 2.5;
    liatrisHead(out, r, C, side, R, "cup");
    if (uSpike < 0.78) {
      liatrisHead(out, r, C, side, R * (1 - uSpike * 0.25), "bloom");
    }
  }
}

// ---------------------------------------------------------------------------
// 12. Purple coneflower (Echinacea purpurea): stout dark stems (staying all winter) with 3-veined
// rough ovate-lanceolate leaves (0.14..0.82), prominent hemispherical-conical central cones
// bristling with coppery-orange chaff spines (--cone-coneflower, 0.34..0.74, fade) over coal-black
// winter cones (--cone-coneflower-winter, 0.34..1.0) ringed in spring/summer by drooping/reflexed
// rose-purple strap rays (--flower-coneflower, 0.36..0.74).

const coneflowerLeafFall = fallsAt(0.8, 0.04);
const coneflowerRayFall = fallsAt(0.7, 0.04);

export function coneflowerLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const W = 0.42 * L;
  // Ovate-lanceolate coarse leaf with 3 arcuate veins and serrate margins.
  const up: Pt[] = [[0, 0]];
  const dn: Pt[] = [];
  for (let i = 1; i < 12; i++) {
    const u = i / 12;
    const env = Math.sin(Math.PI * u ** 0.72) ** 0.78;
    const saw = i % 2 === 1 ? 1.12 : 0.92;
    const hw = (W / 2) * env * saw;
    up.push([u * L, -hw]);
    dn.push([u * L, hw]);
  }
  const pts = [...up, [L * 1.03, 0] as Pt, ...dn.reverse()].map(toW);
  shape(out, r, pts, tone(r, { spread: 0.06, hue: 8 }), {
    deep: 0.4,
    deepAbout: toW([0.36 * L, 0]),
    ink: false,
  });
  // Three prominent arcuate veins from near the base.
  let veins = `M${P1(toW([0, 0]))}L${P1(toW([0.94 * L, 0]))}`;
  for (const sg of [-1, 1]) {
    veins += `M${P1(toW([0.1 * L, 0]))}Q${P1(toW([0.45 * L, sg * W * 0.34]))} ${P1(toW([0.82 * L, sg * W * 0.1]))}`;
  }
  out.push(`<path class="ink hair" d="${closed(pts)}"/><path class="ink hair vein" d="${veins}"/>`);
}

export function coneflowerRays(out: Out, r: Rng, C: Pt, R: number, tilt = 0) {
  const toW = (p: Pt) => add(C, rot(p, tilt));
  let rays = "";
  let veins = "";
  // 13 drooping/reflexed rose-purple strap rays sweeping downward around the base of the cone.
  const count = 13;
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1) - 0.5;
    const x0 = u * R * 0.76;
    const y0 = Math.abs(u) * R * 0.12;
    const ang = rad(90) - u * rad(96);
    const len = R * (0.92 + (1 - Math.abs(u)) * 0.18);
    const rBase = toW([x0, y0]);
    const rTip = add(rBase, rot(polar(len, ang), tilt));
    const rMid = lerp(rBase, rTip, 0.54);
    const nrm = polar(R * 0.125, ang + tilt + rad(90));
    const notch1 = add(rTip, polar(R * 0.04, ang + tilt - 0.35));
    const notch2 = add(rTip, polar(R * 0.04, ang + tilt + 0.35));
    rays += closed([rBase, add(rMid, nrm), notch1, rTip, notch2, sub(rMid, nrm)]);
    veins += `M${P1(rBase)}L${P1(lerp(rBase, rTip, 0.88))}`;
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-coneflower", spread: 0.04 }))} d="${rays}"/><path class="ink hair vein" style="stroke:var(--flower-coneflower)" d="${veins}"/><path class="ink hair petal-edge" d="${rays}"/>`);
}

export function coneflowerCone(out: Out, r: Rng, C: Pt, R: number, winter: boolean, tilt = 0) {
  const toW = (p: Pt) => add(C, rot(p, tilt));
  // High hemispherical-conical central receptacle dome bristling with stiff chaff spines (paleae).
  const dome: Pt[] = [
    [-R * 0.44, R * 0.06],
    [-R * 0.42, -R * 0.18],
    [-R * 0.26, -R * 0.42],
    [0, -R * 0.52],
    [R * 0.26, -R * 0.42],
    [R * 0.42, -R * 0.18],
    [R * 0.44, R * 0.06],
    [R * 0.22, R * 0.14],
    [-R * 0.22, R * 0.14],
  ].map(toW);
  const pc = winter ? "--cone-coneflower-winter" : "--cone-coneflower";
  shape(out, r, dome, tone(r, { pc, spread: 0.04 }), {
    deep: 0.42,
    deepAbout: toW([R * 0.1, -R * 0.1]),
    ink: false,
  });
  let spines = "";
  for (let row = 0; row < 4; row++) {
    const y = -R * (0.04 + row * 0.11);
    const hw = R * (0.38 - row * 0.07);
    const cols = 5 - row;
    for (let c = 0; c < cols; c++) {
      const x = cols === 1 ? 0 : (c / (cols - 1) - 0.5) * 2 * hw;
      const p = toW([x, y]);
      spines += `M${P1(add(p, [-2, 2]))}L${P1(add(p, [0, -3.8]))}L${P1(add(p, [2, 2]))}`;
    }
  }
  out.push(`<path class="ink hair" d="${closed(dome)}${spines}"/>`);
}

export function coneflower(out: Out, r: Rng, base: Pt) {
  const stems: [number, number, number, number][] = [
    [-42, 255, -0.11, 38],
    [-16, 315, -0.04, 44],
    [10, 345, 0.02, 48],
    [34, 295, 0.07, 42],
    [54, 240, 0.13, 36],
  ];

  stems.forEach(([dx, H, lean, R], k) => {
    const B = add(base, [dx, 0]);
    const n = 14;
    const spine = sample((t) => add(B, [lean * H * t + Math.sin(t * Math.PI) * 5, -t * H]), n);
    const gs: [number, number] = [0.05 + k * 0.012, 0.22 + k * 0.012];
    // Stout dark stems stay all winter (no `leave`).
    const stem = grow(out, gs[0], gs[1], () => ({
      ...stalk(out, (t) => spine[Math.round(t * n)], 5.6, 3.0, tone(r, { pc: "--cone-coneflower-winter", dl: 0.08, spread: 0.03 }), n),
      pts: spine,
      n,
    }));

    // 3-veined rough ovate-lanceolate leaves along lower and mid stem (0.14..0.82).
    for (const [idx, u] of [
      [0, 0.24],
      [1, 0.48],
      [2, 0.7],
    ] as const) {
      const i = Math.round(n * u);
      const p = spine[i];
      const side = (k + idx) % 2 ? 1 : -1;
      const la = angleOf(spine, i) + side * rad(52 - idx * 6);
      const L = 76 - idx * 12 + r() * 8;
      part(
        out,
        Math.max(gate(stem, gs, i) + 0.015, 0.14 + idx * 0.025),
        p,
        () => coneflowerLeaf(out, r, p, la, L),
        coneflowerLeafFall(p),
      );
    }

    const top = spine[n];
    const tilt = lean * 0.75;
    const gTip = gate(stem, gs, n) + 0.015;
    // 1. Coal-black spiky winter cone (0.34..1.0, stays all winter).
    part(out, Math.max(gTip, 0.34), top, () => coneflowerCone(out, r, top, R, true, tilt));
    // 2. Drooping/reflexed rose-purple strap rays (0.36..0.74).
    part(out, Math.max(gTip + 0.01, 0.36 + k * 0.006), top, () => coneflowerRays(out, r, top, R, tilt), coneflowerRayFall(top));
    // 3. Coppery-orange spiny summer cone (0.34..0.74, fades in place to uncover the black winter cone).
    part(out, Math.max(gTip, 0.34), top, () => coneflowerCone(out, r, top, R, false, tilt), 0.72 + k * 0.005, true);
  });
}

export function coneflowerDetail(out: Out, r: Rng) {
  const spine = sample((t) => [-30, 175 - t * 210], 10);
  stalk(out, (t) => spine[Math.round(t * 10)], 9, 5.5, tone(r, { pc: "--cone-coneflower-winter", dl: 0.08 }), 10);
  coneflowerLeaf(out, r, spine[3], rad(-142), 140);
  const top = spine[10];
  coneflowerRays(out, r, top, 96, -0.05);
  coneflowerCone(out, r, top, 96, false, -0.05);
  // Coal-black winter seed cone shown on a side stem to the right.
  const wSpine = sample((t) => [95, 175 - t * 185], 8);
  stalk(out, (t) => wSpine[Math.round(t * 8)], 7, 4.2, tone(r, { pc: "--cone-coneflower-winter", dl: 0.08 }), 8);
  coneflowerCone(out, r, wSpine[8], 72, true, 0.08);
}
