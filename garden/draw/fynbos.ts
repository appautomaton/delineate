// The Cape fynbos garden: Table Mountain and the Cape Peninsula in October, where giant bract
// bowls, golden pincushion domes, hooded pagodas, and fountains of ringed reeds stand under an open
// sky. Nothing hangs from the top: dodder laurel (Cassytha ciliolata) twines through and cascades
// from the sugarbush's limbs, drawn with its host.

import { rad, P1, add, sub, mul, norm, rot, polar, lerp, wobble, closed, line, sample, vars, tone, shape, stalk, quad, grow, part } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";
import { limb, spineThrough, angleOf } from "./woody.ts";
import { along, share, roundPts, bladeBunch } from "./mediterranean.ts";

// The share of `res`'s length at its point i, as the gate its growth reaches it at.
const gate = (res: { pts: Pt[] }, g: number[], i: number) => along(g[0], g[1], share(res, i));

// ---------------------------------------------------------------------------
// 1. King protea (Protea cynaroides): thick unbranched red stems clothed in a spiral of glossy
// leathery oval-obovate leaves on exposed crimson petioles, each stem crowned by a massive
// artichoke-like bowl of pointed silky-pink bracts cupped round a snowy-white bearded floral cone.

export function proteaLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number, turn = 0.85, dl = 0) {
  const pet = L * 0.23;
  const bladeL = L - pet;
  const face = 0.42 + 0.58 * Math.abs(turn);
  const arch = (turn >= 0 ? 1 : -1) * 0.055 * L;
  const midPt = (s: number): Pt => [pet + s * bladeL, -Math.sin(s * Math.PI) * arch];
  const toW = (p: Pt) => add(O, rot(p, dir));
  // Exposed crimson petiole as a compact tapered ribbon.
  const petPoly = [toW([0, -2.5]), toW([pet + 3, -1.9]), toW([pet + 3, 1.9]), toW([0, 2.5])];
  out.push(`<path class="wash stem"${vars(tone(r, { pc: "--stem-protea", spread: 0.03 }))} d="${closed(petPoly)}"/><path class="ink thin" d="M${P1(petPoly[0])}L${P1(petPoly[1])}"/><path class="ink thick" d="M${P1(petPoly[3])}L${P1(petPoly[2])}"/>`);
  // Broadly obovate-elliptic blade: cuneate wedge base, widest at 0.58 along the blade, obtuse apex.
  const W = 0.58 * face;
  const half = (s: number) => ((W * bladeL) / 2) * (s ** 0.72 * (1 - s) ** 0.52) / 0.39;
  const N = 6;
  const up = sample((s) => {
    const m = midPt(s);
    return [m[0], m[1] - half(s)] as Pt;
  }, N);
  const dn = sample((s) => {
    const m = midPt(s);
    return [m[0], m[1] + half(s)] as Pt;
  }, N);
  const tip = toW(add(midPt(1), [2.5, 0]));
  const outline = [...up.map(toW), tip, ...dn.slice(0, -1).reverse().map(toW)];
  const v = tone(r, { dl, spread: 0.04, hue: 8 });
  shape(out, r, outline, v, { deep: 0.45, deepAbout: toW(add(midPt(0.56), [0, half(0.56) * 0.3])) });
  // Prominent pale yellow-green midrib and faint lateral veins.
  const mid = sample((s) => toW(midPt(s * 0.94)), 3);
  if (face > 0.6) {
    const ribBand = [
      ...mid.map((p, i) => add(p, rot([0, -1.9 * (1 - (i / 3) * 0.65)], dir))),
      ...[...mid].reverse().map((p, i) => add(p, rot([0, 1.9 * (0.35 + (i / 3) * 0.65)], dir))),
    ];
    out.push(`<path class="wash band" d="${closed(ribBand)}"/>`);
  }
  let veins = line(mid);
  if (face > 0.65) {
    for (const s of [0.35, 0.68]) {
      const p0 = midPt(s);
      const hw = half(s) * 0.76;
      veins += `M${P1(toW(p0))}Q${P1(toW([p0[0] + 0.08 * bladeL, p0[1] - hw * 0.55]))} ${P1(toW([p0[0] + 0.14 * bladeL, p0[1] - hw]))}`;
      veins += `M${P1(toW(p0))}Q${P1(toW([p0[0] + 0.08 * bladeL, p0[1] + hw * 0.55]))} ${P1(toW([p0[0] + 0.14 * bladeL, p0[1] + hw]))}`;
    }
  }
  out.push(`<path class="ink hair vein" d="${veins}"/>`);
  // Red cartilaginous rim along the outer margin.
  const rim = [...up.slice(1).map(toW), tip, ...dn.slice(1).reverse().map(toW)];
  out.push(`<path class="ink hair" style="stroke:var(--stem-protea);stroke-opacity:0.65" d="${line(rim)}"/>`);
}

function proteaBract(out: Out, r: Rng, silk: string[], O: Pt, dir: number, L: number, W: number, pc: string, dl = 0, curve = 0, deep = 0.38) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const N = 4;
  const midY = (s: number) => curve * L * s * s;
  const half = (s: number) => (W / 2) * Math.sin(Math.PI * s ** 0.62) ** 0.85;
  const up = sample((s) => [s * L, midY(s) - half(s)] as Pt, N);
  const dn = sample((s) => [s * L, midY(s) + half(s)] as Pt, N);
  const tip: Pt = [L * 1.03, midY(1.03)];
  const pts = [...up, tip, ...dn.slice(0, -1).reverse()].map(toW);
  shape(out, r, pts, tone(r, { pc, dl, spread: 0.035, hue: 5 }), { deep, deepAbout: toW([L * 0.36, midY(0.36) + half(0.36) * 0.25]) });
  if (deep > 0) {
    const tipPts = [...up.slice(1), tip, ...dn.slice(1).reverse()].map(toW);
    out.push(`<path class="wash blush"${vars(tone(r, { pc: "--bract-protea-deep", dl: -0.02, spread: 0.03 }))} d="${closed(tipPts)}"/>`);
  }
  out.push(`<path class="ink hair petal-edge" d="M${P1(toW([L * 0.14, midY(0.14)]))}Q${P1(toW([L * 0.55, midY(0.55)]))} ${P1(toW([L * 0.95, midY(0.95)]))}"/>`);
  for (const [edge, sg] of [[up[2], -1], [dn[2], 1]] as const) {
    const p = toW(edge);
    silk.push(`M${P1(p)}L${P1(add(p, polar(4 + r() * 2.5, dir + sg * 0.42)))}`);
  }
}

export function kingProteaHead(out: Out, r: Rng, C: Pt, R: number, lean: number, openness = 1) {
  const toW = (p: Pt) => add(C, rot(p, lean));
  const spread = 0.52 + 0.48 * openness;
  const silk: string[] = [];

  // 1. Back & side rank of long inner involucral bracts fanning into a royal crown behind the cone.
  const backCount = Math.round(9 + 3 * openness);
  for (let k = 0; k < backCount; k++) {
    const u = k / (backCount - 1) - 0.5;
    const a = -Math.PI / 2 + u * rad(148 * spread) + (r() - 0.5) * 0.03;
    const basePt = toW([u * R * 0.76 * spread, -R * 0.28 + (u * u) * R * 0.52]);
    const L = R * (1.02 - Math.abs(u) * 0.08) * (0.96 + r() * 0.06);
    const W = R * (0.25 + (0.5 - Math.abs(u)) * 0.05);
    proteaBract(out, r, silk, basePt, lean + a, L, W, "--bract-protea", 0.02 + (0.5 - Math.abs(u)) * 0.05, u * 0.16, 0);
  }

  // 2. The central domed cone: a broad, plush mass of snowy-white silky florets (--cone-protea)
  // rising inside the bract bowl, crowned at its apex with rose-pink style tips.
  const coneW = R * (0.68 * spread);
  const coneH = R * (0.86 + 0.06 * openness);
  const coneBaseY = -R * 0.18;
  const conePts = sample((t) => {
    const a = t * Math.PI * 2;
    const x = Math.cos(a) * coneW;
    const y = a < Math.PI ? -(Math.sin(a) ** 0.72) * coneH : Math.sin(a - Math.PI) * R * 0.14;
    return toW([x, coneBaseY + y]);
  }, 14).slice(0, -1);
  shape(out, r, conePts, tone(r, { pc: "--cone-protea", dl: 0.02, spread: 0.015 }), {
    deep: 0.14,
    deepAbout: toW([coneW * 0.35, coneBaseY - coneH * 0.3]),
  });
  // Soft rose-pink flush crowning the top rim of the white floret mass.
  const apexPts = sample((t) => {
    const a = t * Math.PI;
    return toW([Math.cos(a) * coneW * 0.62, coneBaseY - coneH * 0.76 - (Math.sin(a) ** 0.82) * coneH * 0.24]);
  }, 8);
  out.push(`<path class="wash blush"${vars(tone(r, { pc: "--bract-protea", dl: 0.04, spread: 0.02 }))} d="${closed(apexPts)}"/>`);
  let coneStyles = "";
  const floretRows = 4;
  for (let row = 0; row < floretRows; row++) {
    const v = 0.28 + (row / (floretRows - 1)) * 0.64;
    const y = coneBaseY - v * coneH * 0.92;
    const rowW = coneW * Math.sqrt(Math.max(0.1, 1 - v ** 1.55)) * 0.86;
    const cols = Math.max(5, Math.round(11 * (1 - v * 0.45)));
    for (let c = 0; c < cols; c++) {
      const u = cols === 1 ? 0 : (c / (cols - 1)) * 2 - 1;
      const p0 = toW([u * rowW, y + (u * u) * R * 0.08]);
      const dir = lean - Math.PI / 2 + u * 0.34 * spread;
      const tip = add(p0, polar(R * 0.12, dir));
      silk.push(`M${P1(p0)}Q${P1(add(lerp(p0, tip, 0.5), polar(2.5 * u, dir + Math.PI / 2)))} ${P1(tip)}`);
      if (row >= 2 || c % 2 === 0) coneStyles += `M${P1(lerp(p0, tip, 0.4))}L${P1(tip)}`;
    }
  }
  out.push(`<path class="ink hair petal-edge" style="stroke-opacity:0.28" d="${coneStyles}"/>`);

  // 3. Front imbricate tiers of involucral bracts: foreshortened in the center so the front lip
  // dips down and lets the snowy-white central cone shine out from the bowl.
  const midCount = Math.round(6 + 2 * openness);
  for (let k = 0; k < midCount; k++) {
    const u = k / (midCount - 1) - 0.5;
    const centerDip = 1 - Math.abs(u) * 2;
    const a = -Math.PI / 2 + u * rad(128 * spread) + (r() - 0.5) * 0.025;
    const basePt = toW([u * R * 0.64 * spread, -R * 0.02 - (u * u) * R * 0.24]);
    const L = R * (0.54 + Math.abs(u) * 0.48 - centerDip * 0.08 * openness);
    const W = R * (0.22 + centerDip * 0.03);
    proteaBract(out, r, silk, basePt, lean + a, L, W, "--bract-protea", 0.03, u * 0.14);
  }
  const outCount = Math.round(6 + 2 * openness);
  for (let k = 0; k < outCount; k++) {
    const u = k / (outCount - 1) - 0.5;
    const centerDip = 1 - Math.abs(u) * 2;
    const a = -Math.PI / 2 + u * rad(104 * spread);
    const basePt = toW([u * R * 0.48 * spread, R * 0.05 - (u * u) * R * 0.18]);
    const L = R * (0.4 + Math.abs(u) * 0.28 - centerDip * 0.04);
    const W = R * 0.22;
    proteaBract(out, r, silk, basePt, lean + a, L, W, "--bract-protea-deep", 0.02, u * 0.1, 0);
  }
  const baseCount = 5;
  for (let k = 0; k < baseCount; k++) {
    const u = k / (baseCount - 1) - 0.5;
    const a = -Math.PI / 2 + u * rad(72 * spread);
    const basePt = toW([u * R * 0.3 * spread, R * 0.11 - (u * u) * R * 0.12]);
    proteaBract(out, r, silk, basePt, lean + a, R * 0.28, R * 0.18, "--stem-protea", 0.05, u * 0.06, 0);
  }
  out.push(`<path class="ink wool" d="${silk.join("")}"/>`);
}

export function kingProteaDetail(out: Out, r: Rng) {
  stalk(out, (t) => [0, 135 - t * 90], 20, 16, tone(r, { pc: "--stem-protea", spread: 0.03 }), 8);
  proteaLeaf(out, r, [-6, 86], rad(-142), 165, -0.88, -0.02);
  proteaLeaf(out, r, [6, 92], rad(-38), 160, 0.88, 0.02);
  proteaLeaf(out, r, [-4, 62], rad(-156), 145, -0.78, 0.03);
  proteaLeaf(out, r, [4, 66], rad(-24), 142, 0.78, 0.04);
  kingProteaHead(out, r, [0, 42], 172, rad(2), 1);
}

export function kingprotea(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const stems: {
    ctrl: Pt[];
    w0: number;
    w1: number;
    g: [number, number];
    headR?: number;
    lean: number;
    open?: number;
    gHead?: number;
  }[] = [
    {
      ctrl: [at([-22, 4]), at([-86, -110]), at([-154, -225]), at([-198, -335])],
      w0: 20,
      w1: 15,
      g: [0.06, 0.46],
      headR: 118,
      lean: rad(-19),
      open: 0.9,
      gHead: 0.62,
    },
    {
      ctrl: [at([20, 4]), at([82, -92]), at([146, -188]), at([192, -275])],
      w0: 18,
      w1: 14,
      g: [0.1, 0.5],
      headR: 98,
      lean: rad(21),
      open: 0.68,
      gHead: 0.68,
    },
    {
      ctrl: [at([0, 6]), at([-8, -145]), at([5, -295]), at([2, -430])],
      w0: 24,
      w1: 17,
      g: [0.02, 0.44],
      headR: 150,
      lean: rad(2),
      open: 1,
      gHead: 0.56,
    },
    {
      ctrl: [at([-6, 6]), at([-28, -62]), at([-46, -128]), at([-54, -185])],
      w0: 15,
      w1: 11,
      g: [0.14, 0.48],
      lean: rad(-12),
    },
  ];

  for (const s of stems) {
    const spine = spineThrough(s.ctrl);
    const n = spine.length - 1;
    const leaves: { i: number; dir: number; len: number; turn: number; near: number; dl: number }[] = [];
    for (let i = 4, k = 0; i <= n - 3; i += 3, k++) {
      const t = i / n;
      const stemA = angleOf(spine, i);
      const az = k * rad(137.5) + s.lean * 1.4;
      const side = Math.cos(az);
      const near = Math.sin(az);
      const spreadA = rad(36 + Math.abs(side) * 26);
      const dir = stemA + (side >= 0 ? 1 : -1) * spreadA * (0.62 + 0.38 * Math.abs(side));
      const len = (122 + Math.sin(t * Math.PI) * 26) * (0.92 + r() * 0.14);
      leaves.push({ i, dir, len, turn: side, near, dl: near < 0 ? -0.04 : 0.03 });
    }
    // Guarantee an outward-spreading collar of 3 leaves right below the flower bowl (`n - 2`, `n - 1`)
    // so the neck of the stem is richly clothed.
    if (s.headR) {
      const stemA = angleOf(spine, n - 1);
      leaves.push(
        { i: n - 2, dir: stemA - rad(54), len: 118, turn: -0.86, near: -0.4, dl: -0.02 },
        { i: n - 2, dir: stemA + rad(52), len: 116, turn: 0.86, near: -0.3, dl: -0.01 },
        { i: n - 1, dir: stemA - rad(66), len: 108, turn: -0.82, near: 0.6, dl: 0.03 },
        { i: n - 1, dir: stemA + rad(64), len: 106, turn: 0.82, near: 0.65, dl: 0.04 },
      );
    }
    for (const lf of leaves.filter((l) => l.near < 0)) {
      const p = spine[lf.i];
      part(out, along(s.g[0], s.g[1], lf.i / n) + 0.02, p, () => proteaLeaf(out, r, p, lf.dir, lf.len, lf.turn, lf.dl));
    }
    const stemRes = grow(out, s.g[0], s.g[1], () =>
      stalk(out, (t) => spine[Math.round(t * n)], s.w0, s.w1, tone(r, { pc: "--stem-protea", spread: 0.03 }), n),
    );
    for (const lf of leaves.filter((l) => l.near >= 0)) {
      const p = stemRes.pts[lf.i];
      part(out, gate(stemRes, s.g, lf.i) + 0.025, p, () => proteaLeaf(out, r, p, lf.dir, lf.len, lf.turn, lf.dl));
    }
    const tip = stemRes.pts[n];
    if (s.headR && s.gHead) {
      const headR = s.headR;
      const open = s.open ?? 1;
      part(out, s.gHead, tip, () => kingProteaHead(out, r, add(tip, rot([0, -headR * 0.08], s.lean)), headR, s.lean, open));
    } else {
      for (const [da, len, turn] of [[-0.48, 98, -0.75], [0.44, 94, 0.78], [0.02, 104, 0.55]] as const) {
        part(out, s.g[1] + 0.03, tip, () => proteaLeaf(out, r, tip, angleOf(spine, n) + da, len, turn, 0.04));
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Silver tree (Leucadendron argenteum): stout ascending grey limbs marked with horizontal
// crescent leaf scars, shingled with silky silver-grey lance-leaves that flare at the branch tips
// into luminous involucral rosettes cradling heavy globose silver-dusted woody cones.

export function silverLeaf(out: Out, r: Rng, silk: string[], O: Pt, dir: number, L: number, W = 0.22, dl = 0, shine = false) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const N = 4;
  const half = (s: number) => ((W * L) / 2) * Math.sin(Math.PI * s ** 0.7) ** 0.8;
  const up = sample((s) => [s * L, -half(s)] as Pt, N);
  const dn = sample((s) => [s * L, half(s)] as Pt, N);
  const pts = [...up, [L * 1.03, 0] as Pt, ...dn.slice(0, -1).reverse()].map(toW);
  shape(out, r, pts, tone(r, { dl, spread: 0.035, hue: 5 }), { deep: shine ? 0.3 : 0, deepAbout: toW([L * 0.45, half(0.45) * 0.25]) });
  if (shine) {
    const sh = [toW([L * 0.22, -half(0.3) * 0.45]), toW([L * 0.72, -half(0.6) * 0.35]), toW([L * 0.68, 0]), toW([L * 0.25, 0])];
    out.push(`<path class="wash shine" d="${closed(sh)}"/>`);
  }
  out.push(`<path class="ink hair vein" d="M${P1(toW([L * 0.08, 0]))}L${P1(toW([L * 0.94, 0]))}"/>`);
  for (const [edge, sg] of [[up[2], -1], [dn[2], 1]] as const) {
    const p = toW(edge);
    silk.push(`M${P1(p)}L${P1(add(p, polar(3.5 + r() * 2, dir + sg * 0.35)))}`);
  }
}

export function silverRosette(out: Out, r: Rng, C: Pt, dir: number, R: number, hasCone = true) {
  const silk: string[] = [];
  // Outer spreading involucral lance-leaves radiating round the branch apex.
  const count = 12;
  for (let k = 0; k < count; k++) {
    const a = dir + ((k / count) * 2 - 1) * Math.PI + (r() - 0.5) * 0.14;
    const upBias = -0.22 * Math.cos(a);
    const la = a + upBias;
    const isFront = Math.sin(la) > -0.2;
    const L = R * (0.78 + 0.26 * Math.abs(Math.cos((k / count) * Math.PI - Math.PI / 2))) * (0.92 + r() * 0.14);
    silverLeaf(out, r, silk, add(C, polar(R * 0.08, la)), la, L, 0.23, isFront ? 0.03 : -0.04, isFront && k % 2 === 0);
  }
  // Inner shorter silver leaves cupping the cone.
  for (let k = 0; k < 6; k++) {
    const la = dir - rad(110) + (k / 5) * rad(220) + (r() - 0.5) * 0.12;
    silverLeaf(out, r, silk, add(C, polar(R * 0.04, la)), la, R * (0.52 + r() * 0.1), 0.25, 0.06, true);
  }
  if (hasCone) {
    // Heavy globose-ovoid woody female cone with imbricate silver-velvet scales.
    const cR = R * 0.34;
    const coneC = add(C, polar(cR * 0.25, dir - 0.2));
    const conePts = roundPts(coneC, cR * 0.95, cR * 1.12, dir - Math.PI / 2, 12);
    shape(out, r, conePts, tone(r, { pc: "--cone-silver", spread: 0.04 }), { deep: 0.48, deepAbout: add(coneC, [cR * 0.25, cR * 0.2]) });
    let scales = "";
    for (let row = -2; row <= 2; row++) {
      const y = row * cR * 0.34;
      const w = Math.sqrt(Math.max(0.15, 1 - (row / 2.6) ** 2)) * cR * 0.78;
      for (let col = -1; col <= 1; col++) {
        const sc = add(coneC, rot([col * w * 0.55 + (row % 2 ? w * 0.2 : 0), y], dir + Math.PI / 2));
        scales += `M${P1(add(sc, [-cR * 0.22, 0]))}Q${P1(add(sc, [0, -cR * 0.22]))} ${P1(add(sc, [cR * 0.22, 0]))}`;
        silk.push(`M${P1(sc)}L${P1(add(sc, [0, -4]))}`);
      }
    }
    out.push(`<path class="ink hair" d="${scales}"/>`);
  }
  out.push(`<path class="ink wool" d="${silk.join("")}"/>`);
}

export function silvertree(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0, 0.46];
  // Stout ascending grey limb reaching in from the side and curving upward in candelabrum form.
  const main = grow(out, gm[0], gm[1], () => {
    const res = limb(out, r, [at([-28, 12]), at([110, -24]), at([255, -72]), at([395, -148]), at([510, -240])], {
      w0: 44,
      w1: 18,
      pc: "--bark-silver",
      cap: "blunt",
    });
    // Horizontal crescent leaf scars across the grey bark.
    let scars = "";
    for (let i = 3; i < res.n - 4; i += 3) {
      const p = res.pts[i];
      const a = angleOf(res.pts, i) + Math.PI / 2;
      const hw = res.width(i / res.n) * 0.36;
      scars += `M${P1(add(p, polar(-hw, a)))}Q${P1(add(p, polar(4, a - Math.PI / 2)))} ${P1(add(p, polar(hw, a)))}`;
    }
    out.push(`<path class="ink hair bark-tex" d="${scars}"/>`);
    return res;
  });

  const fork = (t: number, ctrl: Pt[], w0: number, span: number) => {
    const i = Math.round(main.n * t);
    const g: [number, number] = [gate(main, gm, i), gate(main, gm, i) + span];
    const res = grow(out, g[0], g[1], () =>
      limb(out, r, [main.pts[i - 2], ...ctrl.map((p) => add(main.pts[i], p))], {
        w0,
        w1: 14,
        pc: "--bark-silver",
        cap: "blunt",
        inkFrom: 0.12,
      }),
    );
    return { res, g };
  };

  const up1 = fork(0.34, [[45, -68], [105, -148], [160, -235]], 26, 0.24);
  const up2 = fork(0.64, [[55, -58], [118, -124], [172, -195]], 22, 0.22);
  const low = fork(0.48, [[68, 8], [148, -8], [225, -42]], 22, 0.24);

  // Shingled silver leaves along the upper half of each branch, and a full rosette + cone at each tip.
  for (const [b, hasCone, R] of [
    [{ res: main, g: gm }, true, 108],
    [up1, true, 98],
    [up2, false, 88],
    [low, true, 94],
  ] as const) {
    const { res, g } = b;
    for (let i = Math.round(res.n * 0.35); i <= res.n - 3; i += 3) {
      const p = res.pts[i];
      const a = angleOf(res.pts, i);
      part(out, gate(res, g, i) + 0.02, p, () => {
        const silk: string[] = [];
        for (const da of [-0.48, 0.02, 0.52]) {
          silverLeaf(out, r, silk, p, a + da, 64 + r() * 18, 0.22, da < 0 ? 0.03 : -0.02, da <= 0.02);
        }
        out.push(`<path class="ink wool" d="${silk.join("")}"/>`);
      });
    }
    const tip = res.pts[res.n];
    const tipA = angleOf(res.pts, res.n);
    part(out, gate(res, g, res.n) + 0.02, tip, () => silverRosette(out, r, tip, tipA, R, hasCone));
  }
}

// ---------------------------------------------------------------------------
// 3. Sugarbush (Protea repens), draped with Dodder laurel (Cassytha ciliolata): woody branches of
// narrow upright blue-green oblanceolate leaves, V-shaped goblets of pointed cream-to-carmine
// bracts, persistent brown seed cones, and rootless yellow-orange Cassytha threads cascading from
// the limbs with tiny white flower spikes and red berries.

export function repensHead(out: Out, r: Rng, O: Pt, dir: number, H: number, old = false) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  if (old) {
    // Persistent dark-brown woody seed cone from last season.
    const W = H * 0.62;
    for (let k = 0; k < 7; k++) {
      const u = k / 6 - 0.5;
      const a = u * rad(72);
      const bPts = sample((s) => [s * H * 0.85, (s * H * 0.85) * Math.tan(a * 0.55) + (k % 2 ? 1 : -1) * Math.sin(s * Math.PI) * W * 0.12] as Pt, 7);
      const poly = [...bPts.map((p) => [p[0], p[1] - W * 0.09 * (1 - p[0] / H)] as Pt), ...[...bPts].reverse().map((p) => [p[0], p[1] + W * 0.09 * (1 - p[0] / H)] as Pt)].map(toW);
      shape(out, r, poly, tone(r, { pc: "--plume-restio", dl: 0.04 + (k % 2) * 0.04, spread: 0.04 }), { deep: 0.35 });
    }
    return;
  }
  // Sticky V-shaped (obconic) goblet of pointed bracts grading from cream base to deep carmine apex.
  // First: central brush of cream-and-rose styles protruding from the V-cup.
  let styles = "";
  let tips = "";
  for (let k = 0; k < 13; k++) {
    const u = k / 12 - 0.5;
    const p0 = toW([H * 0.35, u * H * 0.24]);
    const p1 = toW([H * (0.96 - Math.abs(u) * 0.14), u * H * 0.42]);
    styles += `M${P1(p0)}Q${P1(lerp(p0, p1, 0.5))} ${P1(p1)}`;
    tips += closed(roundPts(p1, 2.2, 1.4, dir + u * 0.3, 6));
  }
  out.push(`<path class="ink thin" style="stroke:var(--cone-protea);stroke-opacity:0.9" d="${styles}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--bract-repens", spread: 0.04 }))} d="${tips}"/>`);

  // Long inner V-goblet bracts (cream at base, carmine-red on upper half).
  const innerCount = 6;
  for (let k = 0; k < innerCount; k++) {
    const u = k / (innerCount - 1) - 0.5;
    const a = u * rad(62);
    const bO = toW([H * 0.08, u * H * 0.22]);
    const L = H * (0.94 - Math.abs(u) * 0.08);
    const W = H * 0.21;
    const bToW = (p: Pt) => add(bO, rot(p, dir + a));
    const half = (s: number) => (W / 2) * Math.sin(Math.PI * s ** 0.65) ** 0.85;
    const up = sample((s) => [s * L, -half(s)] as Pt, 7);
    const dn = sample((s) => [s * L, half(s)] as Pt, 7);
    const tip: Pt = [L * 1.03, 0];
    const pts = [...up, tip, ...dn.slice(0, -1).reverse()].map(bToW);
    shape(out, r, pts, tone(r, { pc: "--cone-protea", dl: -0.03, spread: 0.03 }), { deep: 0.3 });
    const redTip = [...up.slice(2), tip, ...dn.slice(2).reverse()].map(bToW);
    out.push(`<path class="wash petal"${vars(tone(r, { pc: "--bract-repens", dl: (0.5 - Math.abs(u)) * 0.05, spread: 0.04 }))} d="${closed(redTip)}"/>`);
    out.push(`<path class="ink hair" d="${closed(pts)}"/>`);
  }
  // Shorter outer basal bracts in deep carmine-ruby cupping the V-base.
  for (let k = 0; k < 5; k++) {
    const u = k / 4 - 0.5;
    const a = u * rad(46);
    const bO = toW([0, u * H * 0.16]);
    const L = H * (0.48 - Math.abs(u) * 0.05);
    const W = H * 0.19;
    const bToW = (p: Pt) => add(bO, rot(p, dir + a));
    const half = (s: number) => (W / 2) * Math.sin(Math.PI * s ** 0.65) ** 0.85;
    const up = sample((s) => [s * L, -half(s)] as Pt, 6);
    const dn = sample((s) => [s * L, half(s)] as Pt, 6);
    const pts = [...up, [L * 1.02, 0] as Pt, ...dn.slice(0, -1).reverse()].map(bToW);
    shape(out, r, pts, tone(r, { pc: "--bract-repens", dl: -0.08, spread: 0.04 }), { deep: 0.35 });
  }
}

// Rootless, leafless yellow-green to orange parasitic twiner (Cassytha ciliolata) draping over and
// cascading down from a host shrub limb at P, bearing tiny white flower heads and red berries.
export function cassytha(out: Out, r: Rng, P: Pt, drop: number) {
  let ribbons = "";
  let edges = "";
  let flowers = "";
  let berries = "";
  const strands = 8;
  for (let k = 0; k < strands; k++) {
    const len = drop * (0.48 + r() * 0.52);
    const x0 = (r() - 0.5) * 28;
    const sway = wobble(r, 9, [0.9, 2.1]);
    const loop = (k % 2 ? 1 : -1) * (6 + r() * 8);
    const n = Math.max(12, Math.round(len / 9));
    const pts = sample((t) => [P[0] + x0 + sway(t) + Math.sin(t * Math.PI * 2.5) * loop * (1 - t * 0.4), P[1] - 6 * Math.sin(Math.min(1, t * 5) * Math.PI) + t * len], n);
    const L: Pt[] = [];
    const R: Pt[] = [];
    pts.forEach((p, i) => {
      const d = norm(sub(pts[Math.min(n, i + 1)], pts[Math.max(0, i - 1)]));
      const w = 1.9 * (1 - (i / n) * 0.42);
      L.push(add(p, mul([-d[1], d[0]], w)));
      R.push(add(p, mul([d[1], -d[0]], w)));
      if (i > 3 && i < n - 2 && i % 5 === k % 5) {
        if (r() < 0.55) berries += closed(roundPts(add(p, [w * 2, 2]), 4.2, 4.2, 0, 7));
        else flowers += closed(roundPts(add(p, [-w * 2, 1]), 3, 2.4, 0, 6));
      }
    });
    ribbons += closed([...L, ...[...R].reverse()]);
    edges += line(R);
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--cassytha", spread: 0.05, hue: 10 }))} d="${ribbons}"/><path class="ink hair" d="${edges}"/>`);
  if (flowers) out.push(`<path class="wash petal"${vars(tone(r, { pc: "--petal", spread: 0.02 }))} d="${flowers}"/><path class="ink hair" d="${flowers}"/>`);
  if (berries) out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--hood-mimetes", dl: 0.04, spread: 0.04 }))} d="${berries}"/><path class="ink hair" d="${berries}"/>`);
}

export function sugarbush(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0, 0.46];
  const main = grow(out, gm[0], gm[1], () =>
    limb(out, r, [at([-24, 8]), at([115, -28]), at([255, -36]), at([395, -78]), at([535, -118])], {
      w0: 32,
      w1: 9,
      pc: "--bark-heath",
      cap: "taper",
    }),
  );
  const fork = (t: number, ctrl: Pt[], w0: number, span: number) => {
    const i = Math.round(main.n * t);
    const g: [number, number] = [gate(main, gm, i), gate(main, gm, i) + span];
    const res = grow(out, g[0], g[1], () =>
      limb(out, r, [main.pts[i - 2], ...ctrl.map((p) => add(main.pts[i], p))], {
        w0,
        w1: 7,
        pc: "--bark-heath",
        cap: "taper",
        inkFrom: 0.12,
      }),
    );
    return { res, g };
  };
  const up1 = fork(0.32, [[38, -62], [88, -134], [138, -205]], 18, 0.24);
  const up2 = fork(0.64, [[46, -54], [98, -112], [145, -172]], 15, 0.22);
  const low = fork(0.48, [[68, 22], [148, 34], [228, 18]], 15, 0.24);

  // Narrow oblanceolate blue-green leaves spiralling around both sides of every branch.
  for (const { res, g } of [{ res: main, g: gm }, up1, up2, low]) {
    for (let i = 5; i <= res.n - 2; i += 3) {
      const p = res.pts[i];
      const a = angleOf(res.pts, i);
      part(out, gate(res, g, i) + 0.02, p, () => {
        const upDirs = [-0.82, -0.38].map((da) => ({
          O: p,
          dir: a + da - rad(14),
          L: 58 + r() * 18,
          W: 0.19,
        }));
        const dnDirs = [0.36, 0.78].map((da) => ({
          O: p,
          dir: a + da - rad(18),
          L: 52 + r() * 16,
          W: 0.18,
        }));
        bladeBunch(out, upDirs, tone(r, { dl: 0.02, spread: 0.05, hue: 8 }));
        bladeBunch(out, dnDirs, tone(r, { dl: -0.03, spread: 0.05, hue: 8 }));
      });
    }
  }
  // V-goblet flower heads at the main and upper branch tips, plus a persistent brown cone.
  for (const [b, H, old] of [
    [{ res: main, g: gm }, 96, false],
    [up1, 90, false],
    [up2, 84, false],
    [low, 72, true],
  ] as const) {
    const tip = b.res.pts[b.res.n];
    const dir = Math.min(rad(-55), angleOf(b.res.pts, b.res.n) - rad(38));
    part(out, gate(b.res, b.g, b.res.n) + 0.03, tip, () => repensHead(out, r, tip, dir, H, old));
  }
  // Cassytha ciliolata parasitic threads draped over and cascading down from the limbs.
  for (const [b, t, drop] of [
    [{ res: main, g: gm }, 0.38, 235],
    [{ res: main, g: gm }, 0.72, 195],
    [low, 0.55, 210],
    [up1, 0.48, 165],
  ] as const) {
    const i = Math.round(b.res.n * t);
    const p = add(b.res.pts[i], [0, b.res.width(t) * 0.28]);
    part(out, Math.max(0.58, gate(b.res, b.g, i) + 0.04), p, () => cassytha(out, r, p, drop));
  }
}

// ---------------------------------------------------------------------------
// 4. Tree pincushion (Leucospermum conocarpodendron): thick corky grey limbs branching at wide
// angles, wedge-obovate leaves notched at the square apex with 3–5 red-tipped teeth, and 8 cm
// golden-yellow domes of arching styles with conical pollen presenters.

export function pincushionLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number, dl = 0) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const W = L * 0.38;
  // Wedge-shaped (cuneate-oblong) leaf widening toward a 3-toothed truncate apex.
  const pts: Pt[] = [
    [0, -1.8],
    [L * 0.35, -W * 0.34],
    [L * 0.78, -W * 0.5],
    [L * 0.96, -W * 0.44],
    [L * 0.88, -W * 0.16],
    [L * 1.02, 0],
    [L * 0.88, W * 0.16],
    [L * 0.96, W * 0.44],
    [L * 0.78, W * 0.5],
    [L * 0.35, W * 0.34],
    [0, 1.8],
  ].map(toW);
  shape(out, r, pts, tone(r, { dl, spread: 0.04, hue: 8 }), { deep: 0.35, deepAbout: toW([L * 0.55, W * 0.18]) });
  out.push(`<path class="ink hair vein" d="M${P1(toW([4, 0]))}L${P1(toW([L * 0.88, 0]))}"/>`);
  // Red-tipped apical gland teeth.
  let glands = "";
  for (const tp of [
    [L * 0.96, -W * 0.44],
    [L * 1.02, 0],
    [L * 0.96, W * 0.44],
  ] as Pt[]) {
    glands += closed(roundPts(toW(tp), 2.2, 1.8, dir, 6));
  }
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--hood-mimetes", spread: 0.03 }))} d="${glands}"/>`);
}

export function pincushionHead(out: Out, r: Rng, C: Pt, lean: number, R: number) {
  const toW = (p: Pt) => add(C, rot(p, lean));
  // Back involucral collar leaves behind the dome.
  for (const da of [-0.92, 0.92]) {
    pincushionLeaf(out, r, toW([Math.sin(da) * R * 0.24, R * 0.12]), lean - Math.PI / 2 + da, R * 0.78, -0.04);
  }
  // Soft warm core mass of tightly packed golden perianth tubes.
  const corePts = sample((t) => {
    const a = t * Math.PI * 2;
    return toW([Math.cos(a) * R * 0.58, -R * 0.24 + Math.sin(a) * R * 0.44]);
  }, 16).slice(0, -1);
  shape(out, r, corePts, tone(r, { pc: "--flower-pincushion", dl: -0.08, spread: 0.03 }), { deep: 0.35, ink: false });
  // Front-flanking 3-toothed wedge leaves cradling the base of the dome.
  for (const da of [-1.32, -0.48, 0.48, 1.32]) {
    pincushionLeaf(out, r, toW([Math.sin(da) * R * 0.22, R * 0.18]), lean - Math.PI / 2 + da, R * 0.68, 0.02);
  }

  // 48 arching golden ribbon styles sweeping up and out in a hemisphere, each tipped with a
  // conical orange-gold pollen presenter ("pinhead").
  let ribbons = "";
  let ink = "";
  let pins = "";
  const count = 48;
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1) - 0.5; // -0.5 .. 0.5
    const row = k % 3;
    const baseP = toW([u * R * 0.65, -R * (0.06 + row * 0.12) + (u * u) * R * 0.22]);
    const a = lean - Math.PI / 2 + u * rad(165) + (r() - 0.5) * 0.08;
    const len = R * (0.72 + (1 - Math.abs(u) * 0.5) * 0.24 - row * 0.08) * (0.94 + r() * 0.12);
    const ctrl = add(baseP, polar(len * 0.58, a - u * 0.42));
    const tip = add(baseP, polar(len, a + u * 0.15));
    const nrm = polar(1.3, a + Math.PI / 2);
    ribbons += `M${P1(add(baseP, nrm))}Q${P1(add(ctrl, nrm))} ${P1(tip)}Q${P1(sub(ctrl, nrm))} ${P1(sub(baseP, nrm))}Z`;
    if (k % 2 === 0) ink += `M${P1(baseP)}Q${P1(ctrl)} ${P1(tip)}`;
    pins += closed(roundPts(tip, 3.2, 2, a, 6));
  }
  out.push(`<path class="wash filament"${vars(tone(r, { pc: "--flower-pincushion", spread: 0.04, hue: 6 }))} d="${ribbons}"/>`);
  out.push(`<path class="ink hair filament-edge" d="${ink}"/>`);
  out.push(`<path class="wash anther"${vars(tone(r, { pc: "--sepal", dl: 0.06, spread: 0.04 }))} d="${pins}"/><path class="ink hair" d="${pins}"/>`);
}

export function pincushion(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm = [0, 0.44];
  // Stout grey corky trunk leaning in from a bottom corner and branching at wide angles.
  const main = grow(out, gm[0], gm[1], () =>
    limb(out, r, [at([0, 10]), at([42, -110]), at([112, -235]), at([195, -355]), at([285, -455])], {
      w0: 54,
      w1: 20,
      pc: "--bark-cork",
      cap: "blunt",
    }),
  );
  const fork = (t: number, ctrl: Pt[], w0: number, span: number) => {
    const i = Math.round(main.n * t);
    const g: [number, number] = [gate(main, gm, i), gate(main, gm, i) + span];
    const res = grow(out, g[0], g[1], () =>
      limb(out, r, [main.pts[i - 2], ...ctrl.map((p) => add(main.pts[i], p))], {
        w0,
        w1: 15,
        pc: "--bark-cork",
        cap: "blunt",
        inkFrom: 0.12,
      }),
    );
    return { res, g };
  };
  const left = fork(0.42, [[-18, -75], [-28, -162], [-22, -245]], 28, 0.24);
  const right = fork(0.56, [[68, -22], [142, -55], [210, -108]], 26, 0.24);
  const mid = fork(0.74, [[12, -68], [28, -138], [48, -198]], 20, 0.22);

  for (const [b, R, lean] of [
    [{ res: main, g: gm }, 82, rad(24)],
    [left, 78, rad(-8)],
    [right, 74, rad(34)],
    [mid, 72, rad(10)],
  ] as const) {
    const { res, g } = b;
    for (let i = Math.round(res.n * 0.28); i <= res.n - 2; i += 3) {
      const p = res.pts[i];
      const a = angleOf(res.pts, i);
      part(out, gate(res, g, i) + 0.02, p, () => {
        pincushionLeaf(out, r, p, a - rad(42), 54 + r() * 12, 0.03);
        pincushionLeaf(out, r, p, a + rad(38), 52 + r() * 12, -0.03);
      });
    }
    const tip = res.pts[res.n];
    part(out, gate(res, g, res.n) + 0.03, tip, () => pincushionHead(out, r, tip, lean, R));
  }
}

// ---------------------------------------------------------------------------
// 5. Hooded pagoda (Mimetes cucullatus): upright wand stems clad in overlapping oval leaves below,
// crowned by a cylindrical red-and-gold pagoda where scarlet boat-shaped leaf-hoods cowl over
// white-bearded involucres and tufts of long red styles with white tips.

export function pagodaHood(out: Out, r: Rng, P: Pt, side: number, s: number) {
  // 1. White-bearded axillary involucre and arching tuft of crimson styles with white tips.
  const beardC = add(P, [side * s * 0.28, -s * 0.06]);
  shape(out, r, roundPts(beardC, s * 0.28, s * 0.22, 0, 10), tone(r, { pc: "--cone-protea", spread: 0.02 }), { deep: 0.2 });
  let styles = "";
  let tips = "";
  for (let k = 0; k < 8; k++) {
    const u = k / 7 - 0.5;
    const p0 = add(beardC, [side * s * 0.1, u * s * 0.16]);
    const ctrl = add(p0, [side * s * 0.45, -s * 0.24 + u * s * 0.18]);
    const tip = add(p0, [side * s * (0.78 - Math.abs(u) * 0.18), s * 0.05 + u * s * 0.34]);
    styles += `M${P1(p0)}Q${P1(ctrl)} ${P1(tip)}`;
    tips += closed(roundPts(tip, 2.1, 1.4, 0, 5));
  }
  out.push(`<path class="ink thin" style="stroke:var(--hood-mimetes)" d="${styles}"/>`);
  out.push(`<path class="wash petal"${vars({ pc: "--cone-protea" })} d="${tips}"/>`);

  // 2. The cucullate (hooded) scarlet-and-gold bract leaf arching above and cowling over the beard.
  const hoodPts: Pt[] = [
    add(P, [0, -s * 0.26]),
    add(P, [side * s * 0.34, -s * 0.58]),
    add(P, [side * s * 0.72, -s * 0.48]),
    add(P, [side * s * 0.88, -s * 0.18]),
    add(P, [side * s * 0.56, -s * 0.12]),
    add(P, [side * s * 0.22, -s * 0.02]),
  ];
  shape(out, r, hoodPts, tone(r, { pc: "--hood-mimetes", spread: 0.04, hue: 6 }), { deep: 0.4, deepAbout: add(P, [side * s * 0.35, -s * 0.38]) });
  // Golden-yellow flush along the lower reflexed base of the hood.
  const goldBase: Pt[] = [hoodPts[0], lerp(hoodPts[0], hoodPts[1], 0.5), hoodPts[4], hoodPts[5]];
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-pincushion", spread: 0.04 }))} d="${closed(goldBase)}"/>`);
  out.push(`<path class="ink hair" d="${closed(hoodPts)}"/>`);
}

export function pagoda(out: Out, r: Rng, base: Pt) {
  const wands = [
    { x0: -56, lean: -0.18, H: 465, g: [0.06, 0.5] as [number, number] },
    { x0: -18, lean: -0.05, H: 535, g: [0.02, 0.46] as [number, number] },
    { x0: 22, lean: 0.07, H: 510, g: [0.04, 0.48] as [number, number] },
    { x0: 58, lean: 0.2, H: 440, g: [0.08, 0.52] as [number, number] },
  ];
  for (const w of wands) {
    const n = 34;
    const sway = wobble(r, 4, [0.7, 1.3]);
    const spine = sample((t) => add(base, [w.x0 + t * w.H * w.lean + sway(t), -t * w.H]), n);
    const stemRes = grow(out, w.g[0], w.g[1], () =>
      stalk(out, (t) => spine[Math.round(t * n)], 12, 6, tone(r, { pc: "--stem-protea", spread: 0.03 }), n),
    );
    // Lower two-thirds: densely overlapping ascending oval-elliptic green leaves in 3 ranks.
    for (let i = 2; i <= 20; i++) {
      const p = stemRes.pts[i];
      const rank = i % 3; // 0: left, 1: right, 2: center-ascending
      const da = rank === 0 ? -rad(26) : rank === 1 ? rad(26) : (r() - 0.5) * 0.12;
      const a = angleOf(stemRes.pts, i) + da;
      part(out, gate(stemRes, w.g, i) + 0.02, p, () => {
        const L = 46 - (i / 20) * 6;
        const c = add(p, polar(L * 0.46, a));
        const pts = roundPts(c, L * 0.52, L * 0.25, a, 10);
        shape(out, r, pts, tone(r, { dl: rank === 2 ? 0.03 : rank === 0 ? 0.01 : -0.03, spread: 0.04 }), { deep: 0.3 });
        out.push(`<path class="ink hair vein" d="M${P1(p)}L${P1(add(p, polar(L * 0.86, a)))}"/>`);
      });
    }
    // Upper third: cylindrical pagoda of scarlet-and-gold cucullate hoods over white beards.
    for (let i = 21; i <= n - 1; i += 2) {
      const p = stemRes.pts[i];
      const side = (i >> 1) % 2 ? 1 : -1;
      const s = 48 * (1 - ((i - 21) / (n - 20)) * 0.25);
      part(out, gate(stemRes, w.g, i) + 0.03, p, () => pagodaHood(out, r, p, side, s));
    }
    // Crown of smaller scarlet-and-gold upright terminal bracts at the wand apex.
    const tip = stemRes.pts[n];
    part(out, gate(stemRes, w.g, n) + 0.04, tip, () => {
      for (const [dx, dy, a] of [
        [-8, -14, -0.35],
        [8, -14, 0.35],
        [0, -22, 0],
      ] as const) {
        const pts = roundPts(add(tip, [dx, dy]), 18, 8, -Math.PI / 2 + a, 8);
        shape(out, r, pts, tone(r, { pc: "--hood-mimetes", dl: 0.04, spread: 0.03 }), { deep: 0 });
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 6. Cape thatching reed (Elegia tectorum): a dense fountain of leafless dark-green culms ringed
// with black node bands, curling golden-brown papery sheaths dropping off the nodes, and nodding
// dark-brown terminal spikelet plumes.

export function restioDetail(out: Out, r: Rng) {
  for (const [x0, lean, H] of [
    [-45, -0.12, 310],
    [5, 0.04, 340],
    [52, 0.16, 295],
  ] as const) {
    const n = 24;
    const spine = sample((t) => [x0 + t * t * H * lean, 140 - t * H] as Pt, n);
    stalk(out, (t) => spine[Math.round(t * n)], 6.5, 3.2, tone(r, { spread: 0.04 }), n);
    // Dark nodal rings and loose curling golden-chestnut sheaths peeling off the nodes.
    for (const i of [6, 13, 19]) {
      const p = spine[i];
      const a = angleOf(spine, i);
      const sg = i % 2 ? 1 : -1;
      out.push(`<path class="ink thick" d="M${P1(add(p, [-4, 0]))}L${P1(add(p, [4, 0]))}"/>`);
      const shDir = a + sg * rad(26);
      const shPts = [p, add(p, polar(34, shDir - sg * 0.12)), add(p, polar(42, shDir + sg * 0.18)), add(p, polar(18, shDir + sg * 0.32))];
      shape(out, r, shPts, tone(r, { pc: "--sheath-restio", spread: 0.04 }), { deep: 0.3 });
    }
    // Feathery dark-brown terminal panicle plume at the culm tip.
    const tip = spine[n];
    const tipA = angleOf(spine, n) + lean * 0.4;
    let spikelets = "";
    for (let k = 0; k < 11; k++) {
      const u = k / 10;
      const c = add(tip, polar(u * 48, tipA + u * 0.25));
      const off = (k % 2 ? 1 : -1) * (8 - u * 4);
      spikelets += closed(roundPts(add(c, polar(off, tipA + Math.PI / 2)), 8 - u * 2.5, 3.4, tipA + (k % 2 ? 0.35 : -0.35), 7));
    }
    out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--plume-restio", spread: 0.04 }))} d="${spikelets}"/><path class="ink hair" d="${spikelets}"/>`);
  }
}

export function restio(out: Out, r: Rng, base: Pt) {
  const culms = 42;
  const order = Array.from({ length: culms }, (_, k) => k).sort(() => r() - 0.5);
  const groups: { O: Pt; dir: number; L: number; W: number }[][] = [[], []];
  const heroCulms: { p0: Pt; pts: Pt[]; lean: number }[] = [];

  for (const k of order) {
    const u = k / (culms - 1); // 0..1
    const lean = (u - 0.5) * 1.35 + (r() - 0.5) * 0.12;
    const H = (380 + Math.sin(u * Math.PI) * 165) * (0.9 + r() * 0.16);
    const p0 = add(base, [(u - 0.5) * 86, 0]);
    const p1 = add(p0, [lean * H * 0.22, -H * 0.46]);
    const p2 = add(p0, [lean * H * 0.58, -H * 0.82]);
    const p3 = add(p0, [lean * H * 0.92, -H]);
    const d0 = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const d1 = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    const d2 = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]);
    const L0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const L1 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const L2 = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]);
    groups[k % 2].push(
      { O: p0, dir: d0, L: L0 * 1.04, W: 0.032 },
      { O: p1, dir: d1, L: L1 * 1.04, W: 0.026 },
      { O: p2, dir: d2, L: L2, W: 0.02 },
    );
    if (k % 2 === 0) heroCulms.push({ p0, pts: [p0, p1, p2, p3], lean });
  }

  part(out, 0.04, base, () => bladeBunch(out, groups[0], tone(r, { dl: -0.05, spread: 0.04 })));
  part(out, 0.12, base, () => bladeBunch(out, groups[1], tone(r, { dl: 0.03, spread: 0.04 })));

  // Nodal black rings, curling golden-brown papery sheaths, and dark-brown terminal plumes on the
  // hero culms, each anchored at its culm node.
  heroCulms.forEach(({ pts, lean }, idx) => {
    for (const [nodePt, nextPt, sg] of [
      [pts[1], pts[2], 1],
      [pts[2], pts[3], -1],
    ] as const) {
      const a = Math.atan2(nextPt[1] - nodePt[1], nextPt[0] - nodePt[0]);
      part(out, 0.28 + (idx % 8) * 0.025, nodePt, () => {
        out.push(`<path class="ink mid" d="M${P1(add(nodePt, [-3.2, 0]))}L${P1(add(nodePt, [3.2, 0]))}"/>`);
        const shDir = a + sg * rad(24);
        const sh = [nodePt, add(nodePt, polar(22, shDir - sg * 0.1)), add(nodePt, polar(28, shDir + sg * 0.18)), add(nodePt, polar(12, shDir + sg * 0.3))];
        out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--sheath-restio", spread: 0.05 }))} d="${closed(sh)}"/><path class="ink hair" d="${closed(sh)}"/>`);
      });
    }
    const tip = pts[3];
    const tipA = Math.atan2(pts[3][1] - pts[2][1], pts[3][0] - pts[2][0]) + lean * 0.25;
    part(out, 0.56 + (idx % 10) * 0.025, tip, () => {
      let sp = "";
      for (let k = 0; k < 7; k++) {
        const u = k / 6;
        const c = add(tip, polar(u * 34, tipA + u * lean * 0.3));
        sp += closed(roundPts(add(c, polar((k % 2 ? 1 : -1) * 4.5, tipA + Math.PI / 2)), 6.5 - u * 2, 2.8, tipA + (k % 2 ? 0.3 : -0.3), 6));
      }
      out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--plume-restio", spread: 0.04 }))} d="${sp}"/><path class="ink hair" d="${sp}"/>`);
    });
  });
}

// ---------------------------------------------------------------------------
// 7. Cape bugle-lily (Watsonia borbonica): a basal equitant fan of broad sword leaves bordered in
// yellow, and a tall branched spire lined in two opposite ranks with rose-magenta bugle trumpets.

export function watsoniaFlower(out: Out, r: Rng, O: Pt, side: number, s: number) {
  const dir = side > 0 ? rad(-26) : rad(-154);
  const toW = (p: Pt) => add(O, rot(p, dir));
  // Reddish-brown clasping bract at the base of the floral tube.
  const bract = [toW([0, -3]), toW([s * 0.34, -s * 0.14]), toW([s * 0.28, s * 0.1]), toW([0, 3])];
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--stem-protea", dl: -0.04, spread: 0.03 }))} d="${closed(bract)}"/><path class="ink hair" d="${closed(bract)}"/>`);
  // Curved funnel-bugle perianth tube flaring into 6 rose-magenta elliptic tepal lobes.
  const tube = [
    toW([s * 0.12, -s * 0.05]),
    toW([s * 0.45, -s * 0.15]),
    toW([s * 0.72, -s * 0.28]),
    toW([s * 0.68, s * 0.14]),
    toW([s * 0.42, s * 0.06]),
    toW([s * 0.12, s * 0.05]),
  ];
  shape(out, r, tube, tone(r, { pc: "--flower-watsonia", dl: -0.05, spread: 0.03 }), { deep: 0.35 });
  // Flared 6-tepal mouth.
  const mouth = toW([s * 0.68, -s * 0.08]);
  for (const [da, lMul, wMul, dl] of [
    [-0.62, 0.44, 0.2, -0.02],
    [-0.24, 0.48, 0.22, 0.03],
    [0.18, 0.46, 0.22, 0.04],
    [0.56, 0.42, 0.19, -0.01],
  ] as const) {
    const a = dir + da;
    const pts = roundPts(add(mouth, polar(s * lMul * 0.55, a)), s * lMul * 0.58, s * wMul * 0.5, a, 9);
    shape(out, r, pts, tone(r, { pc: "--flower-watsonia", dl, spread: 0.04, hue: 6 }), { deep: 0.25 });
  }
  // Three arched unilateral stamens under the upper tepal.
  const stEnd = add(mouth, polar(s * 0.42, dir - 0.15));
  out.push(`<path class="ink hair" d="M${P1(mouth)}Q${P1(add(lerp(mouth, stEnd, 0.5), [0, -5]))} ${P1(stEnd)}"/>`);
  out.push(`<path class="wash anther"${vars({ pc: "--petal-lilac" })} d="${closed(roundPts(stEnd, 3.2, 1.5, dir, 6))}"/>`);
}

export function watsonia(out: Out, r: Rng, base: Pt) {
  // Equitant basal fan of stiff sword leaves with thickened yellow margins.
  const blades = [
    [-132, 310],
    [-116, 360],
    [-102, 390],
    [-78, 380],
    [-64, 345],
    [-48, 295],
  ] as const;
  blades.forEach(([deg, L], k) => {
    const p0 = add(base, [(k - 2.5) * 8, 0]);
    const a = rad(deg);
    part(out, 0.04 + k * 0.02, p0, () => {
      const tip = add(p0, polar(L, a));
      const nrm = polar(11, a + Math.PI / 2);
      const mid = add(lerp(p0, tip, 0.52), nrm);
      const pts = [add(p0, mul(nrm, 0.6)), mid, tip, sub(mid, mul(nrm, 1.8)), sub(p0, mul(nrm, 0.6))];
      shape(out, r, pts, tone(r, { dl: k % 2 ? 0.02 : -0.03, spread: 0.04 }), { deep: 0.35 });
      // The pale margin: a sliver along the outer edge, tapering to nothing at base and tip.
      const rim = [pts[0], pts[1], pts[2], sub(pts[1], mul(nrm, 0.22)), sub(pts[0], mul(nrm, 0.2))];
      out.push(`<path class="wash band" d="${closed(rim)}"/>`);
    });
  });

  // Tall reddish main scape and two shorter lateral spikes.
  const H = 620;
  const n = 38;
  const sway = wobble(r, 4, [0.6, 1.1]);
  const spine = sample((t) => add(base, [sway(t), -t * H]), n);
  const gs: [number, number] = [0.18, 0.62];
  const stem = grow(out, gs[0], gs[1], () =>
    stalk(out, (t) => spine[Math.round(t * n)], 13, 5, tone(r, { pc: "--stem-protea", dl: -0.04, spread: 0.03 }), n),
  );

  // Two-ranked (distichous) rose-magenta bugle flowers opening acropetally up the upper half.
  for (let i = 15, k = 0; i <= n - 1; i += 2, k++) {
    const p = stem.pts[i];
    const side = k % 2 ? 1 : -1;
    const s = 68 * (1 - ((i - 15) / (n - 15)) * 0.28);
    part(out, gate(stem, gs, i) + 0.03, p, () => watsoniaFlower(out, r, p, side, s));
  }
  // Two shorter ascending lateral branches at mid-stem.
  for (const [t0, side, bH] of [
    [0.42, -1, 175],
    [0.48, 1, 160],
  ] as const) {
    const i0 = Math.round(n * t0);
    const p0 = stem.pts[i0];
    const gb: [number, number] = [gate(stem, gs, i0) + 0.02, gate(stem, gs, i0) + 0.24];
    const bSpine = sample((t) => add(p0, [side * (18 + t * 52), -t * bH]), 14);
    const bRes = grow(out, gb[0], gb[1], () =>
      stalk(out, (t) => bSpine[Math.round(t * 14)], 7.5, 3.8, tone(r, { pc: "--stem-protea", dl: -0.04, spread: 0.03 }), 14),
    );
    for (let j = 5, k = 0; j <= 13; j += 3, k++) {
      const bp = bRes.pts[j];
      part(out, gate(bRes, gb, j) + 0.03, bp, () => watsoniaFlower(out, r, bp, k % 2 ? side : -side, 54 - j));
    }
  }
}

// ---------------------------------------------------------------------------
// 8. Fire heath (Erica cerinthoides): wiry stems clothed in 4–6-whorled needles, tipped with
// nodding terminal umbels of swollen, hairy crimson-scarlet tubular bells.

export function fireheathBell(out: Out, r: Rng, silk: string[], O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const W = L * 0.44;
  // Swollen tubular-urceolate corolla constricted just below the 4-lobed mouth.
  const profile = (s: number) => {
    const belly = Math.sin(Math.PI * s ** 0.72) ** 0.68;
    const neck = s > 0.78 && s < 0.94 ? 0.84 : 1;
    return (W / 2) * belly * neck;
  };
  const N = 8;
  const up = sample((s) => [s * L, -profile(s)] as Pt, N);
  const dn = sample((s) => [s * L, profile(s)] as Pt, N);
  const lobes: Pt[] = [
    [L * 0.98, -W * 0.26],
    [L * 1.05, -W * 0.12],
    [L * 0.96, 0],
    [L * 1.05, W * 0.12],
    [L * 0.98, W * 0.26],
  ];
  const pts = [...up, ...lobes, ...dn.slice(0, -1).reverse()].map(toW);
  shape(out, r, pts, tone(r, { pc: "--flower-fireheath", spread: 0.04, hue: 6 }), { deep: 0.42, deepAbout: toW([L * 0.48, W * 0.16]) });
  // Glandular white hairs glistening along the swollen scarlet tube.
  for (let i = 2; i <= N - 1; i += 2) {
    for (const [edge, sg] of [[up[i], -1], [dn[i], 1]] as const) {
      const p = toW(edge);
      silk.push(`M${P1(p)}L${P1(add(p, polar(3.2 + r() * 2, dir + sg * 1.1)))}`);
    }
  }
}

export function fireheathUmbel(out: Out, r: Rng, C: Pt, lean: number, s: number) {
  const silk: string[] = [];
  let pedicels = "";
  const bells: [number, number, number][] = [
    [-135, 0.88, -0.04],
    [-105, 0.94, -0.02],
    [-75, 0.94, -0.02],
    [-45, 0.88, -0.04],
    [155, 0.96, 0.02],
    [125, 1.02, 0.04],
    [95, 1.04, 0.05],
    [65, 1.02, 0.04],
    [35, 0.96, 0.02],
  ];
  for (const [deg, lMul] of bells) {
    const a = lean + rad(deg) + (r() - 0.5) * 0.08;
    const baseB = add(C, polar(s * 0.18, a));
    pedicels += `M${P1(C)}L${P1(baseB)}`;
    fireheathBell(out, r, silk, baseB, a, s * lMul);
  }
  out.push(`<path class="ink thin" style="stroke:var(--stem-protea)" d="${pedicels}"/><path class="ink wool" d="${silk.join("")}"/>`);
}

export function fireheath(out: Out, r: Rng, base: Pt) {
  const stems = [
    { x0: -52, lean: -0.34, H: 265, g: [0.08, 0.52] as [number, number], s: 35, fork: -1 },
    { x0: -26, lean: -0.16, H: 325, g: [0.04, 0.48] as [number, number], s: 39, fork: 0 },
    { x0: 2, lean: 0.02, H: 350, g: [0.02, 0.46] as [number, number], s: 41, fork: 1 },
    { x0: 28, lean: 0.18, H: 315, g: [0.06, 0.5] as [number, number], s: 38, fork: 0 },
    { x0: 54, lean: 0.36, H: 255, g: [0.1, 0.54] as [number, number], s: 34, fork: 1 },
  ];
  for (const st of stems) {
    const n = 24;
    const sway = wobble(r, 9, [0.9, 1.9]);
    const spine = sample((t) => add(base, [st.x0 + t * st.H * st.lean + sway(t), -t * st.H]), n);
    const res = grow(out, st.g[0], st.g[1], () => {
      // Soft dark ericoid body behind the needle whorls.
      const body = [
        ...spine.slice(2, -1).map((p, i) => add(p, [-9 * (1 - (i / n) * 0.35), 0])),
        ...[...spine.slice(2, -1)].reverse().map((p, i) => add(p, [9 * (0.65 + (i / n) * 0.35), 0])),
      ];
      shape(out, r, body, tone(r, { dl: -0.08, spread: 0.03 }), { deep: 0, ink: false });
      return stalk(out, (t) => spine[Math.round(t * n)], 6.5, 3.2, tone(r, { pc: "--bark-heath", spread: 0.03 }), n);
    });
    // Whorls of 8 ericoid needles along the stem.
    for (let i = 2; i <= n - 2; i += 2) {
      const p = res.pts[i];
      const a = angleOf(res.pts, i);
      part(out, gate(res, st.g, i) + 0.02, p, () => {
        let needles = "";
        for (const da of [-1.25, -0.9, -0.55, -0.2, 0.2, 0.55, 0.9, 1.25]) {
          needles += `M${P1(p)}L${P1(add(p, polar(12 + r() * 3.5, a + da)))}`;
        }
        out.push(`<path class="wash needles"${vars(tone(r, { dl: 0.03, spread: 0.05 }))} d="${needles}"/>`);
      });
    }
    if (st.fork !== 0) {
      const fi = 12;
      const fp = res.pts[fi];
      const fTip = add(fp, [st.fork * 44, -76]);
      part(out, gate(res, st.g, fi) + 0.04, fp, () => {
        stalk(out, quad(fp, add(lerp(fp, fTip, 0.5), [st.fork * 10, 0]), fTip), 4.5, 2.8, tone(r, { pc: "--bark-heath", spread: 0.03 }), 8);
        let needles = "";
        for (let k = 1; k <= 5; k++) {
          const np = lerp(fp, fTip, k / 6);
          for (const da of [-1.1, -0.5, 0.5, 1.1]) needles += `M${P1(np)}L${P1(add(np, polar(10, -Math.PI / 2 + da)))}`;
        }
        out.push(`<path class="wash needles"${vars(tone(r, { dl: 0.02, spread: 0.04 }))} d="${needles}"/>`);
        fireheathUmbel(out, r, fTip, st.fork * 0.25, st.s * 0.78);
      });
    }
    const tip = res.pts[n];
    part(out, gate(res, st.g, n) + 0.03, tip, () => fireheathUmbel(out, r, tip, st.lean * 0.45, st.s));
  }
}

// ---------------------------------------------------------------------------
// 9. Cape everlasting (Phaenocoma prolifera): stiff white-woolly branches studded with tiny
// bead-like dark-green granular spur shoots (brachyblasts), crowned with 5 cm glossy cerise-magenta
// papery star-heads around a golden-purple central disc.

export function phaenocomaHead(out: Out, r: Rng, C: Pt, R: number, tilt = 0.62) {
  // Outer short tawny-gold involucral scales + inner long pointed glossy cerise-magenta ray bracts.
  for (const [count, lenMul, widMul, pc, dl, rotOff] of [
    [14, 0.68, 0.16, "--sheath-restio", 0.08, 0.12],
    [18, 1.0, 0.17, "--bract-phaenocoma", -0.03, 0],
    [16, 0.84, 0.16, "--bract-phaenocoma", 0.05, 0.18],
  ] as const) {
    let bracts = "";
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + rotOff;
      const dx = Math.cos(a);
      const dy = Math.sin(a) * tilt;
      const dir = Math.atan2(dy, dx);
      const reach = R * lenMul * Math.hypot(dx, dy);
      const baseB = add(C, [dx * R * 0.24, dy * R * 0.24]);
      const mid = add(baseB, polar(reach * 0.48, dir));
      const tip = add(baseB, polar(reach, dir));
      const nrm = polar(R * widMul * 0.5, dir + Math.PI / 2);
      bracts += `M${P1(add(baseB, mul(nrm, 0.5)))}Q${P1(add(mid, nrm))} ${P1(tip)}Q${P1(sub(mid, nrm))} ${P1(sub(baseB, mul(nrm, 0.5)))}Z`;
    }
    out.push(`<path class="wash petal"${vars(tone(r, { pc: pc as string, dl, spread: 0.04, hue: 6 }))} d="${bracts}"/><path class="ink hair petal-edge" d="${bracts}"/>`);
  }
  // Central dark purple-gold disc of tubular florets.
  shape(out, r, roundPts(C, R * 0.32, R * 0.32 * tilt, 0, 12), tone(r, { pc: "--stem-protea", dl: -0.08, spread: 0.03 }), { deep: 0 });
  shape(out, r, roundPts(add(C, [0, -R * 0.02]), R * 0.22, R * 0.22 * tilt, 0, 10), tone(r, { pc: "--flower-pincushion", dl: -0.06, spread: 0.04 }), { deep: 0 });
}

export function phaenocoma(out: Out, r: Rng, base: Pt) {
  const branches = [
    { x0: -48, lean: -0.45, H: 235, g: [0.08, 0.48] as [number, number], R: 38 },
    { x0: -22, lean: -0.2, H: 295, g: [0.04, 0.44] as [number, number], R: 44 },
    { x0: 4, lean: 0.04, H: 320, g: [0.02, 0.42] as [number, number], R: 48 },
    { x0: 28, lean: 0.24, H: 285, g: [0.06, 0.46] as [number, number], R: 42 },
    { x0: 52, lean: 0.48, H: 225, g: [0.1, 0.5] as [number, number], R: 36 },
  ];
  for (const br of branches) {
    const n = 20;
    const spine = sample((t) => add(base, [br.x0 + t * br.H * br.lean + Math.sin(t * 5) * 6, -t * br.H]), n);
    // White-felted stem densely studded all around with tiny dark-green bead-like spur shoots (brachyblasts).
    const res = grow(out, br.g[0], br.g[1], () =>
      stalk(out, (t) => spine[Math.round(t * n)], 8.5, 4.5, tone(r, { pc: "--felt", spread: 0.02 }), n),
    );
    for (let i = 2; i <= n - 1; i++) {
      const p = res.pts[i];
      part(out, gate(res, br.g, i) + 0.02, p, () => {
        let beads = "";
        for (const [dx, dy] of [
          [-5.2, -1.5],
          [5.2, 1.5],
          [(i % 2 ? -1.8 : 1.8), -3.5],
        ] as const) {
          beads += closed(roundPts(add(p, [dx + (r() - 0.5) * 1.8, dy]), 3.8, 3.0, r(), 6));
        }
        out.push(`<path class="wash"${vars(tone(r, { dl: (i % 2 ? 0.02 : -0.05), spread: 0.05 }))} d="${beads}"/><path class="ink hair" d="${beads}"/>`);
      });
    }
    // Side fork halfway up the main stems for divaricate shrub fullness.
    if (br.H > 260) {
      const fi = 11;
      const fp = res.pts[fi];
      const fSide = br.lean >= 0 ? 1 : -1;
      const fTip = add(fp, [fSide * 58, -88]);
      const fg = gate(res, br.g, fi) + 0.04;
      part(out, fg, fp, () => {
        stalk(out, quad(fp, add(lerp(fp, fTip, 0.5), [fSide * 10, 0]), fTip), 5.5, 3.8, tone(r, { pc: "--felt", spread: 0.02 }), 8);
        let beads = "";
        for (let k = 1; k <= 8; k++) {
          const bp = lerp(fp, fTip, k / 9);
          beads += closed(roundPts(add(bp, [(k % 2 ? 1 : -1) * 4.2, -1]), 3.5, 2.8, 0, 6));
          beads += closed(roundPts(add(bp, [0, 1.5]), 3.2, 2.5, 0, 6));
        }
        out.push(`<path class="wash"${vars(tone(r, { dl: -0.03, spread: 0.04 }))} d="${beads}"/><path class="ink hair" d="${beads}"/>`);
        phaenocomaHead(out, r, fTip, br.R * 0.78, 0.65);
      });
    }
    const tip = res.pts[n];
    part(out, gate(res, br.g, n) + 0.04, tip, () => phaenocomaHead(out, r, tip, br.R, 0.62));
  }
}

// ---------------------------------------------------------------------------
// 10. Hooded pelargonium (Pelargonium cucullatum): soft-hairy sprawling stems with cupped
// kidney-shaped toothed leaves and long-stalked umbels of asymmetric orchid-magenta flowers
// heavily feathered with dark purple on the two broad upper banner petals.

export function pelargoniumLeaf(out: Out, r: Rng, C: Pt, R: number, dir: number, dl = 0) {
  const toW = (p: Pt) => add(C, rot(p, dir));
  // Cupped reniform (kidney-shaped) dentate blade with a shallow basal sinus and palmate veins.
  const lobes = 11;
  const pts = sample((t) => {
    const a = -Math.PI + t * Math.PI * 2;
    const sinus = 1 - 0.36 * Math.exp(-((a / 0.55) ** 2));
    const tooth = 1 + 0.07 * Math.abs(Math.sin(t * lobes * Math.PI));
    const radNow = R * sinus * tooth;
    return toW([Math.cos(a) * radNow * 0.88, Math.sin(a) * radNow]);
  }, 28).slice(0, -1);
  shape(out, r, pts, tone(r, { dl, spread: 0.05, hue: 8 }), { deep: 0.4, deepAbout: toW([R * 0.2, R * 0.25]) });
  let veins = "";
  for (const va of [-1.1, -0.55, 0, 0.55, 1.1]) {
    veins += `M${P1(toW([-R * 0.22, 0]))}L${P1(toW(polar(R * 0.68, va)))}`;
  }
  out.push(`<path class="ink hair vein" d="${veins}"/><path class="ink wool" d="${closed(pts)}"/>`);
}

export function pelargoniumFlower(out: Out, r: Rng, C: Pt, s: number, lean: number) {
  const toW = (p: Pt) => add(C, rot(p, lean));
  // Three narrower lower anterior petals.
  for (const da of [-0.52, 0, 0.52]) {
    const a = Math.PI / 2 + da;
    const mid = polar(s * 0.46, a);
    const pts = roundPts(toW(mid), s * 0.44, s * 0.17, lean + a, 10);
    shape(out, r, pts, tone(r, { pc: "--flower-pelargonium", dl: 0.03, spread: 0.04 }), { deep: 0.2 });
  }
  // Two broad obovate upper banner petals with dark crimson-purple feathered nectar guides.
  let feathers = "";
  for (const sg of [-1, 1]) {
    const a = -Math.PI / 2 + sg * 0.42;
    const mid = polar(s * 0.5, a);
    const pts = roundPts(toW(mid), s * 0.52, s * 0.28, lean + a, 12);
    shape(out, r, pts, tone(r, { pc: "--flower-pelargonium", dl: -0.02, spread: 0.04 }), { deep: 0.25 });
    const p0 = toW([0, 0]);
    const p1 = toW(polar(s * 0.62, a));
    feathers += `M${P1(p0)}L${P1(p1)}`;
    for (const f of [0.28, 0.48, 0.66]) {
      const fp = toW(polar(s * f, a));
      feathers += `M${P1(fp)}L${P1(toW(polar(s * (f + 0.14), a - 0.22)))}M${P1(fp)}L${P1(toW(polar(s * (f + 0.14), a + 0.22)))}`;
    }
  }
  out.push(`<path class="ink thin petal-vein standard" d="${feathers}"/>`);
  shape(out, r, roundPts(C, s * 0.1, s * 0.1, 0, 7), tone(r, { pc: "--anther", spread: 0.03 }), { deep: 0 });
}

export function pelargonium(out: Out, r: Rng, base: Pt) {
  const shoots = [
    { x0: -45, lean: -0.42, H: 225, g: [0.06, 0.46] as [number, number] },
    { x0: 0, lean: -0.04, H: 275, g: [0.02, 0.42] as [number, number] },
    { x0: 46, lean: 0.38, H: 240, g: [0.08, 0.48] as [number, number] },
  ];
  for (const sh of shoots) {
    const n = 18;
    const spine = sample((t) => add(base, [sh.x0 + t * sh.H * sh.lean, -t * sh.H]), n);
    const res = grow(out, sh.g[0], sh.g[1], () =>
      stalk(out, (t) => spine[Math.round(t * n)], 8, 4, tone(r, { pc: "--stem-protea", dl: 0.06, spread: 0.03 }), n),
    );
    for (let i = 3; i <= n - 3; i += 3) {
      const p = res.pts[i];
      const side = i % 2 ? 1 : -1;
      const leafC = add(p, [side * 24, -10]);
      part(out, gate(res, sh.g, i) + 0.02, p, () => {
        out.push(`<path class="ink thin" d="M${P1(p)}L${P1(leafC)}"/>`);
        pelargoniumLeaf(out, r, leafC, 32 + r() * 8, -Math.PI / 2 + side * 0.45, side > 0 ? 0.02 : -0.03);
      });
    }
    const tip = res.pts[n];
    part(out, gate(res, sh.g, n) + 0.04, tip, () => {
      for (const [dx, dy, s, lean] of [
        [-28, -24, 34, -0.25],
        [26, -20, 32, 0.25],
        [0, -44, 38, 0],
      ] as const) {
        const fc = add(tip, [dx, dy]);
        out.push(`<path class="ink thin" d="M${P1(tip)}Q${P1(add(tip, [dx * 0.5, dy * 0.3]))} ${P1(fc)}"/>`);
        pelargoniumFlower(out, r, fc, s, lean);
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 11. Kolkol (Berzelia lanuginosa): soft feathery bottlebrush stems clothed in fine yellow-green
// needles, topped by corymb clusters of creamy-white spherical pompom heads and reddish fruiting knobs.

export function berzeliaCorymb(out: Out, r: Rng, C: Pt, lean: number, s: number) {
  const toW = (p: Pt) => add(C, rot(p, lean));
  let pedicels = "";
  let florets = "";
  let stamens = "";
  let anthers = "";
  const spots: [number, number, number, boolean][] = [
    [-0.95, -0.35, 0.25, true],
    [0.95, -0.32, 0.24, true],
    [-0.68, -0.78, 0.31, false],
    [0.68, -0.75, 0.3, false],
    [-0.25, -0.96, 0.35, false],
    [0.28, -0.94, 0.34, false],
    [0, -0.62, 0.3, false],
  ];
  for (const [ux, uy, rMul, isFruit] of spots) {
    const hc = toW([ux * s, uy * s]);
    pedicels += `M${P1(C)}Q${P1(toW([ux * s * 0.45, uy * s * 0.3]))} ${P1(hc)}`;
    const hr = s * rMul;
    if (isFruit) {
      // Woody reddish-brown globose fruiting cone studded with packed floral scales.
      shape(out, r, roundPts(hc, hr * 0.86, hr * 0.86, 0, 10), tone(r, { pc: "--sheath-restio", dl: -0.05, spread: 0.04 }), { deep: 0.4 });
      let scales = "";
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        scales += closed(roundPts(add(hc, polar(hr * 0.38, a)), hr * 0.28, hr * 0.22, a, 5));
      }
      out.push(`<path class="ink hair" d="${scales}"/>`);
    } else {
      // Fluffy spherical cream-white pompom of tiny Bruniaceae florets with exserted golden stamens.
      shape(out, r, roundPts(hc, hr * 0.94, hr * 0.94, 0, 12), tone(r, { pc: "--petal", dl: -0.03, spread: 0.02 }), { deep: 0.3, ink: false });
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2 + (r() - 0.5) * 0.15;
        florets += closed(roundPts(add(hc, polar(hr * 0.58, a)), hr * 0.36, hr * 0.26, a, 6));
      }
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + 0.3;
        florets += closed(roundPts(add(hc, polar(hr * 0.22, a)), hr * 0.32, hr * 0.24, a, 6));
      }
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2 + (r() - 0.5) * 0.1;
        const p0 = add(hc, polar(hr * 0.65, a));
        const p1 = add(hc, polar(hr * (1.16 + (k % 2) * 0.12), a));
        stamens += `M${P1(p0)}L${P1(p1)}`;
        anthers += closed(roundPts(p1, 1.8, 1.3, a, 5));
      }
    }
  }
  out.push(`<path class="ink thin" d="${pedicels}"/>`);
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--petal", spread: 0.02 }))} d="${florets}"/><path class="ink hair petal-edge" d="${florets}"/>`);
  out.push(`<path class="ink hair filament-edge" style="stroke:var(--cone-protea)" d="${stamens}"/>`);
  out.push(`<path class="wash anther"${vars(tone(r, { pc: "--flower-pincushion", spread: 0.04 }))} d="${anthers}"/>`);
}

export function berzelia(out: Out, r: Rng, base: Pt) {
  const stems = [
    { x0: -48, lean: -0.3, H: 310, g: [0.06, 0.48] as [number, number], s: 44, fork: -1 },
    { x0: -16, lean: -0.09, H: 375, g: [0.02, 0.44] as [number, number], s: 52, fork: 0 },
    { x0: 18, lean: 0.1, H: 360, g: [0.04, 0.46] as [number, number], s: 50, fork: 0 },
    { x0: 50, lean: 0.32, H: 295, g: [0.08, 0.5] as [number, number], s: 42, fork: 1 },
  ];
  for (const st of stems) {
    const n = 26;
    const sway = wobble(r, 7, [0.8, 1.5]);
    const spine = sample((t) => add(base, [st.x0 + t * st.H * st.lean + sway(t), -t * st.H]), n);
    const res = grow(out, st.g[0], st.g[1], () => {
      // Soft bottlebrush body behind the yellow-green needles.
      const body = [
        ...spine.slice(2, -1).map((p, i) => add(p, [-14 * (1 - (i / n) * 0.3), 0])),
        ...[...spine.slice(2, -1)].reverse().map((p, i) => add(p, [14 * (0.7 + (i / n) * 0.3), 0])),
      ];
      shape(out, r, body, tone(r, { dl: -0.06, spread: 0.03 }), { deep: 0, ink: false });
      return stalk(out, (t) => spine[Math.round(t * n)], 6, 3, tone(r, { dl: -0.08, spread: 0.03 }), n);
    });
    for (let i = 2; i <= n - 2; i += 2) {
      const p = res.pts[i];
      const a = angleOf(res.pts, i);
      part(out, gate(res, st.g, i) + 0.02, p, () => {
        let needles = "";
        for (const da of [-1.1, -0.78, -0.46, -0.18, 0.18, 0.46, 0.78, 1.1]) {
          needles += `M${P1(p)}L${P1(add(p, polar(16 + r() * 4, a + da)))}`;
        }
        out.push(`<path class="wash needles"${vars(tone(r, { dl: 0.04, spread: 0.05 }))} d="${needles}"/>`);
      });
    }
    if (st.fork !== 0) {
      const fi = 14;
      const fp = res.pts[fi];
      const fTip = add(fp, [st.fork * 44, -82]);
      part(out, gate(res, st.g, fi) + 0.03, fp, () => {
        stalk(out, quad(fp, add(lerp(fp, fTip, 0.5), [st.fork * 10, 0]), fTip), 4.5, 2.5, tone(r, { dl: -0.06, spread: 0.03 }), 8);
        let needles = "";
        for (let k = 1; k <= 6; k++) {
          const np = lerp(fp, fTip, k / 7);
          for (const da of [-0.95, -0.45, 0.45, 0.95]) needles += `M${P1(np)}L${P1(add(np, polar(13, -Math.PI / 2 + da)))}`;
        }
        out.push(`<path class="wash needles"${vars(tone(r, { dl: 0.03, spread: 0.04 }))} d="${needles}"/>`);
        berzeliaCorymb(out, r, fTip, st.fork * 0.28, st.s * 0.76);
      });
    }
    const tip = res.pts[n];
    part(out, gate(res, st.g, n) + 0.03, tip, () => berzeliaCorymb(out, r, tip, st.lean * 0.5, st.s));
  }
}

// ---------------------------------------------------------------------------
// 12. Blue sceptre (Aristea capitata): a stiff sword-leaf fan and tall rod-like stems packed along
// the upper third with sessile clusters of deep gentian-blue six-petaled stars, papery rust-brown
// spathes, and 3-winged seed capsules.

export function aristeaStar(out: Out, r: Rng, C: Pt, s: number, rot0 = 0) {
  let tepals = "";
  for (let k = 0; k < 6; k++) {
    const a = rot0 + (k / 6) * Math.PI * 2;
    const mid = add(C, polar(s * 0.52, a));
    tepals += closed(roundPts(mid, s * 0.48, s * 0.22, a, 8));
  }
  out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-aristea", spread: 0.04, hue: 6 }))} d="${tepals}"/><path class="ink hair petal-edge" d="${tepals}"/>`);
  shape(out, r, roundPts(C, s * 0.18, s * 0.18, 0, 7), tone(r, { pc: "--sepal", dl: 0.08, spread: 0.03 }), { deep: 0 });
}

export function aristeaDetail(out: Out, r: Rng) {
  const n = 22;
  const spine = sample((t) => [Math.sin(t * 2) * 5, 152 - t * 315] as Pt, n);
  stalk(out, (t) => spine[Math.round(t * n)], 11, 5.5, tone(r, { spread: 0.03 }), n);
  for (const [i, side, hasCap] of [
    [5, -1, true],
    [9, 1, true],
    [13, -1, false],
    [17, 1, false],
    [21, 0, false],
  ] as const) {
    const p = spine[i];
    // Lacerated papery rust-brown spathe bract clasping the sessile cluster.
    const spPts = [p, add(p, [side * 28 - 8, -16]), add(p, [side * 34 + 6, -32]), add(p, [side * 10, -28])];
    shape(out, r, spPts, tone(r, { pc: "--sheath-restio", dl: 0.06, spread: 0.04 }), { deep: 0.25 });
    if (hasCap) {
      const capC = add(p, [side * 20, 6]);
      shape(out, r, roundPts(capC, 15, 10, -Math.PI / 2 + side * 0.3, 8), tone(r, { pc: "--plume-restio", dl: 0.08, spread: 0.03 }), { deep: 0.35 });
    }
    aristeaStar(out, r, add(p, [side * 16, -12]), 40, i * 0.4);
    if (i < 20) aristeaStar(out, r, add(p, [-side * 10, -22]), 32, i * 0.4 + 0.5);
  }
}

export function aristea(out: Out, r: Rng, base: Pt) {
  // Stiff upright basal fan of narrow ribbed sword leaves.
  const fan = [
    [-124, 265],
    [-110, 315],
    [-98, 340],
    [-82, 330],
    [-70, 295],
    [-56, 250],
  ] as const;
  fan.forEach(([deg, L], k) => {
    const p0 = add(base, [(k - 2.5) * 6, 0]);
    part(out, 0.04 + k * 0.02, p0, () => {
      bladeBunch(out, [{ O: p0, dir: rad(deg), L, W: 0.048 }], tone(r, { dl: k % 2 ? 0.02 : -0.03, spread: 0.04 }));
    });
  });

  // Two tall stiff rod-like thyrses packed along the upper half with sessile gentian-blue stars.
  for (const [x0, lean, H, g0] of [
    [-12, -0.06, 540, 0.16],
    [16, 0.08, 485, 0.22],
  ] as const) {
    const n = 34;
    const spine = sample((t) => add(base, [x0 + t * H * lean + Math.sin(t * 3) * 3, -t * H]), n);
    const gs: [number, number] = [g0, g0 + 0.42];
    const stem = grow(out, gs[0], gs[1], () =>
      stalk(out, (t) => spine[Math.round(t * n)], 10, 4.5, tone(r, { dl: -0.03, spread: 0.03 }), n),
    );
    for (let i = 15, k = 0; i <= n - 1; i += 2, k++) {
      const p = stem.pts[i];
      const side = k % 2 ? 1 : -1;
      const s = 30 * (1 - ((i - 15) / (n - 15)) * 0.24);
      part(out, gate(stem, gs, i) + 0.03, p, () => {
        // Papery rust-brown spathe bract at the node.
        const sp = [p, add(p, [side * 16, -10]), add(p, [side * 20, -20]), add(p, [side * 5, -16])];
        out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--sheath-restio", dl: 0.06, spread: 0.04 }))} d="${closed(sp)}"/><path class="ink hair" d="${closed(sp)}"/>`);
        aristeaStar(out, r, add(p, [side * 11, -6]), s, k * 0.5);
        if (k % 2 === 0 && i < n - 3) aristeaStar(out, r, add(p, [-side * 7, -14]), s * 0.82, k * 0.5 + 0.4);
      });
    }
  }
}

