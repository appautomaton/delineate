// The Boreal Taiga garden (#7, Köppen Dfc: Siberia and Fennoscandia).
// Built on the four-season system (`year: true`), where `u ∈ [0, 1]` runs from April snowmelt
// (`BUD = 0.05`) through late-spring flush (`SPRING = 0.42`), white-night summer (`0.50–0.65`),
// brief incandescent *ruska* autumn (`0.68–0.82`), and long snowed-under winter (`0.84–1.0`):
//   - Four woody trees reach in from the sides: Siberian spruce (*Picea obovata*), Siberian larch
//     (*Larix sibirica*), silver birch (*Betula pendula*), and Scots pine (*Pinus sylvestris*).
//   - Two epiphytic canopy beard lichens hang from plunging diagonal conifer host boughs overhead:
//     Methuselah's beard (*Usnea longissima*) on spruce and horsehair lichen (*Bryoria fremontii*)
//     on Scots pine.
//   - Six forest-floor herbs, subshrubs, and horsetails rise from the bed: fireweed (*Chamaenerion
//     angustifolium*), Labrador tea (*Rhododendron tomentosum*), wood horsetail (*Equisetum
//     sylvaticum*), lingonberry (*Vaccinium vitis-idaea*), cloudberry (*Rubus chamaemorus*), and
//     creeping twinflower (*Linnaea borealis*) in the foreground.

import { TAU, rad, P1, add, sub, mul, lerp, polar, rot, quad, closed, line, sample, wobble, vars, shape, stalk, tone, grow, part, gate, roundPts } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";
import { limb, branch, angleOf } from "./woody.ts";
import type { Limb } from "./woody.ts";
import { blade, palmate } from "./mediterranean.ts";

// Deterministic shedding time from attachment coordinates so timing never shifts the random stream.
const fallsAt = (from: number, span: number) => ([x, y]: Pt) =>
  from + ((((Math.round(x * 7 + y * 13) % 20) + 20) % 20) / 20) * span;

const glint = (c: Pt, rx: number, ry: number, rotA = 0) =>
  `<path class="wash shine" d="${closed(roundPts(c, rx, ry, rotA, 7))}"/>`;

// ===========================================================================
// 1. Siberian spruce (Picea obovata): sweeping whorled boughs reaching right (x > 0) and drooping
// in concave tiers hung with curtains of pendulous branchlets (--bark-spruce), dense 4-angled dark
// blue-green needle sprays, spring lime-green shoot tips (0.22..0.46, fade), erect crimson spring
// female conelets (--cone-spruce-young, 0.22..0.48, fade), and pendulous glossy brown cylindrical
// cones (--cone-spruce, 5–10 cm, smooth rounded obovate scales) from 0.44 through winter (1.0).
// ===========================================================================

const SPRUCE_BARK = { pc: "--bark-spruce" };

function spruceSpray(out: Out, r: Rng, O: Pt, dir: number, len: number, limeTip = false, pc?: string, g0 = 0.22) {
  const end = add(O, polar(len, dir));
  const mid = add(lerp(O, end, 0.52), polar(len * 0.06, dir + rad(90)));
  const sp = sample(quad(O, mid, end), 8);
  // Soft dark evergreen cushion behind the 4-angled needle strokes so field() registers the tier.
  const w = len * 0.18;
  const nrm = polar(w, dir + rad(90));
  shape(
    out,
    r,
    [add(O, mul(nrm, 0.4)), add(mid, nrm), add(end, polar(4, dir)), sub(mid, nrm), sub(O, mul(nrm, 0.4))],
    tone(r, { pc, dl: -0.06, spread: 0.04, hue: 6 }),
    { deep: 0, ink: false },
  );
  let needles = "";
  let ink = "";
  for (let i = 1; i <= 8; i++) {
    const p = sp[i];
    const u = i / 8;
    const tang = angleOf(sp, Math.min(i, 7));
    const nLen = (15 - u * 4.5 + r() * 3) * (len / 56);
    for (const side of [-1, -0.45, 0.45, 1]) {
      const a = tang + side * rad(54 - u * 12) + (r() - 0.5) * 0.12;
      const q = add(p, polar(nLen, a));
      const seg = `M${P1(p)}L${P1(q)}`;
      if (Math.abs(side) === 1 && i % 2 === 0) ink += seg;
      else needles += seg;
    }
  }
  const st = pc ? `--pc:var(${pc});stroke:var(${pc})` : "";
  out.push(
    `<path class="wash needles"${st ? ` style="${st}"` : vars(tone(r, { spread: 0.05, hue: 8 }))} d="${needles}"/><path class="ink hair" d="${ink}"/>`,
  );
  if (limeTip) {
    // Fresh lime-green spring bud-burst flush at the shoot apex (gated after spray..0.46, fade).
    part(
      out,
      Math.max(g0 + 0.015, 0.22) + r() * 0.02,
      end,
      () => {
        const tipEnd = add(end, polar(len * 0.34, dir - 0.08));
        const body = roundPts(lerp(end, tipEnd, 0.52), len * 0.18, len * 0.11, dir, 8);
        shape(out, r, body, tone(r, { pc, dl: 0.22, dh: -18, dc: 1.3, spread: 0.03 }), { deep: 0, ink: false });
        let flush = "";
        for (let k = 0; k < 9; k++) {
          const a = dir - 0.08 + ((k / 8) - 0.5) * rad(96);
          const p0 = lerp(end, tipEnd, (k % 3) * 0.22);
          flush += `M${P1(p0)}L${P1(add(p0, polar(len * 0.22, a)))}`;
        }
        out.push(`<path class="wash needles"${vars(tone(r, { pc, dl: 0.24, dh: -18, dc: 1.3 }))} d="${flush}"/>`);
      },
      0.46 + r() * 0.02,
      true,
    );
  }
}

// Erect purple-crimson spring female conelet (3–4 cm) at pollination in May–June.
function spruceYoungCone(out: Out, r: Rng, B: Pt, size: number, tilt = 0) {
  const dir = rad(-90) + tilt;
  const C = add(B, polar(size * 0.52, dir));
  shape(
    out,
    r,
    roundPts(C, size * 0.52, size * 0.32, dir, 10),
    tone(r, { pc: "--cone-spruce-young", spread: 0.04, hue: 6 }),
    { deep: 0.35, cls: "wash fruit" },
  );
  let scales = "";
  for (const u of [-0.22, 0.04, 0.28]) {
    const p = add(C, polar(size * u, dir));
    const nrm = polar(size * 0.22, dir + rad(90));
    scales += `M${P1(sub(p, nrm))}Q${P1(add(p, polar(size * 0.1, dir)))} ${P1(add(p, nrm))}`;
  }
  out.push(`<path class="ink hair" d="${scales}"/>`);
}

// Pendulous glossy brown cylindrical-ovoid cone (5–10 cm) with smoothly rounded, entire, convex
// obovate seed scales characteristic of Picea obovata.
export function spruceCone(out: Out, r: Rng, top: Pt, L: number, lean = 0) {
  const dir = rad(90) + lean;
  const toW = (x: number, y: number): Pt => add(top, rot([x * L, y * L], lean));
  const outline: Pt[] = [
    [0, 0],
    [0.14, 0.08],
    [0.21, 0.28],
    [0.22, 0.58],
    [0.18, 0.84],
    [0.09, 0.97],
    [0, 1.0],
    [-0.09, 0.97],
    [-0.18, 0.84],
    [-0.22, 0.58],
    [-0.21, 0.28],
    [-0.14, 0.08],
  ].map(([x, y]) => toW(x, y));
  shape(
    out,
    r,
    outline,
    tone(r, { pc: "--cone-spruce", spread: 0.04, hue: 6 }),
    { deep: 0.5, deepAbout: toW(0.06, 0.55), cls: "wash fruit" },
  );
  // Smoothly rounded convex obovate seed scales in overlapping ranks.
  let scaleWash = "";
  let scaleInk = "";
  const rows = 6;
  for (let row = 1; row <= rows; row++) {
    const y = 0.1 + (row / (rows + 1)) * 0.78;
    const halfW = 0.2 * Math.sin(Math.PI * y ** 0.85);
    const cols = row % 2 ? 3 : 2;
    for (let c = 0; c < cols; c++) {
      const x = (c / (cols - 1) - 0.5) * halfW * 1.35;
      const sc = toW(x, y);
      const rx = L * 0.075;
      const ry = L * 0.085;
      scaleWash += closed(roundPts(sc, rx, ry, dir, 7));
      const pL = toW(x - 0.075, y - 0.01);
      const pM = toW(x, y + 0.085);
      const pR = toW(x + 0.075, y - 0.01);
      scaleInk += `M${P1(pL)}Q${P1(pM)} ${P1(pR)}`;
    }
  }
  out.push(
    `<path class="wash"${vars(tone(r, { pc: "--cone-spruce", dl: 0.07, spread: 0.03 }))} d="${scaleWash}"/><path class="ink hair" d="${scaleInk}"/>`,
  );
  out.push(glint(toW(-0.08, 0.38), L * 0.035, L * 0.14, lean));
}

export function spruce(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Two sweeping concave-tiered main boughs reaching right from the left edge and turning up at the tips.
  const gMain = [0.01, 0.18];
  const main = grow(out, gMain[0], gMain[1], () =>
    limb(
      out,
      r,
      [at([-24, -18]), at([95, 8]), at([225, 28]), at([345, 24]), at([438, -4])],
      { w0: 32, w1: 8, cap: "taper", ...SPRUCE_BARK },
    ),
  );
  const parent = { res: main, g: gMain };
  const upperTier = branch(
    out,
    r,
    parent,
    0.22,
    [[68, -48], [168, -68], [268, -64], [344, -84]],
    0.08,
    { w0: 18, w1: 6, cap: "taper", ...SPRUCE_BARK },
  );
  const lowerTier = branch(
    out,
    r,
    parent,
    0.36,
    [[54, 38], [142, 68], [234, 76], [308, 58]],
    0.08,
    { w0: 15, w1: 5.5, cap: "taper", ...SPRUCE_BARK },
  );

  // Curtains of pendulous side branchlets hanging beneath each concave tier.
  const tiers = [parent, upperTier, lowerTier];
  for (const [tIdx, tier] of tiers.entries()) {
    const n = tier.res.n;
    for (let i = Math.round(n * 0.18); i <= n - 4; i += 8) {
      const u = i / n;
      const dropLen = (72 + (1 - u) * 52 + r() * 24) * (tIdx === 1 ? 0.78 : 1);
      const sway = 14 + u * 16;
      const curtain = branch(
        out,
        r,
        tier,
        u,
        [
          [sway * 0.35, dropLen * 0.48],
          [sway, dropLen],
        ],
        0.05,
        { w0: 4.2, w1: 1.6, cap: "taper", ...SPRUCE_BARK },
      );
      const cn = curtain.res.n;
      for (const f of [0.35, 0.7, 1.0]) {
        const ci = Math.round(cn * f);
        const cp = curtain.res.pts[ci];
        const ca = angleOf(curtain.res.pts, Math.min(ci, cn - 1));
        const gSpray = gate(curtain.res, curtain.g, ci) + 0.015;
        part(out, gSpray, cp, () => {
          spruceSpray(out, r, cp, ca + (f < 1 ? (ci % 2 ? 0.28 : -0.28) : 0), 38 + r() * 12, f === 1, undefined, gSpray);
        });
      }
    }
    // Forward-sweeping dark blue-green needle sprays along the bough spine and at its upturned tip.
    for (let i = Math.round(n * 0.16); i <= n; i += 6) {
      const idx = Math.min(i, n);
      const p = tier.res.pts[idx];
      const a = angleOf(tier.res.pts, Math.min(i, n - 1));
      const isTip = i >= n - 2;
      const gSpray = gate(tier.res, tier.g, idx) + (tIdx === 2 ? 0.045 : 0.015);
      part(out, gSpray, p, () => {
        spruceSpray(out, r, p, a - rad(18), 48 + r() * 14, isTip, undefined, gSpray);
        if (!isTip) spruceSpray(out, r, p, a + rad(22), 44 + r() * 12, false, undefined, gSpray);
      });
    }
  }

  // Erect crimson spring female conelets (0.22..0.48, fade) and pendulous glossy brown mature cones (0.44..1.0).
  const coneSpots: [{ res: Limb; g: number[] }, number, number][] = [
    [upperTier, 0.52, 62],
    [upperTier, 0.82, 58],
    [parent, 0.48, 70],
    [parent, 0.72, 66],
    [parent, 0.9, 60],
    [lowerTier, 0.64, 64],
  ];
  coneSpots.forEach(([tier, u, len], k) => {
    const i = Math.round(tier.res.n * u);
    const p = tier.res.pts[i];
    const gYoung = Math.max(gate(tier.res, tier.g, i) + 0.02, 0.22 + k * 0.006);
    part(
      out,
      gYoung,
      p,
      () => spruceYoungCone(out, r, add(p, [0, -4]), 26 + r() * 4, (r() - 0.5) * 0.2),
      0.48 + r() * 0.02,
      true,
    );
    part(out, 0.44 + k * 0.01, p, () => spruceCone(out, r, add(p, [0, 3]), len, (r() - 0.5) * 0.16));
  });
}

export function spruceDetail(out: Out, r: Rng) {
  const bough = limb(out, r, [[-155, -10], [-35, 8], [85, 12], [165, -8]], {
    w0: 16,
    w1: 6,
    cap: "taper",
    ...SPRUCE_BARK,
  });
  for (const u of [0.22, 0.48, 0.74, 0.98]) {
    const i = Math.round(bough.n * u);
    const p = bough.pts[i];
    const a = angleOf(bough.pts, Math.min(i, bough.n - 1));
    spruceSpray(out, r, p, a - rad(22), 68, u > 0.9);
    spruceSpray(out, r, p, a + rad(28), 64, false);
  }
  const pYoung = bough.pts[Math.round(bough.n * 0.78)];
  spruceYoungCone(out, r, add(pYoung, [0, -5]), 44, -0.08);
  spruceCone(out, r, add(bough.pts[Math.round(bough.n * 0.36)], [0, 4]), 118, 0.06);
  spruceCone(out, r, add(bough.pts[Math.round(bough.n * 0.64)], [0, 4]), 106, -0.08);
}

// ===========================================================================
// 2. Siberian larch (Larix sibirica): pale buff-grey branches (--bark-larch) studded with dark
// woody spur pegs (brachyblasts), soft rosettes of 25–40 needles per spur (0.14..fallsAt around
// 0.74..0.84, turning brilliant amber-gold via --pl-larch-autumn before shedding!), and small
// ovoid cones (--cone-larch) standing STRICTLY ERECT above the twigs all year including on bare
// winter wood.
// ===========================================================================

const LARCH_BARK = { pc: "--bark-larch" };
const LARCH_SPUR = { pc: "--cone-larch" };
const larchShed = fallsAt(0.75, 0.08);

// Soft radiating rosette of 28–36 flat needles on a woody brachyblast spur.
export function larchRosette(out: Out, r: Rng, T: Pt, dir: number, R: number) {
  // Soft emerald/amber wash halo behind the fine needle tuft so field() and autumn turn read clearly.
  const halo = sample((t) => add(add(T, polar(R * 0.35, dir)), polar(R * (0.52 + 0.08 * Math.sin(t * TAU * 6)), t * TAU)), 16).slice(0, -1);
  shape(out, r, halo, tone(r, { dl: -0.02, spread: 0.05, hue: 8 }), { deep: 0.35, ink: false });
  let needles = "";
  let ink = "";
  const count = 28;
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1) - 0.5;
    const a = dir + u * rad(210) + (r() - 0.5) * 0.14;
    const len = R * (0.72 + 0.34 * Math.cos(u * 2.1) + (r() - 0.5) * 0.16);
    const ctrl = add(T, polar(len * 0.54, a + u * 0.12));
    const end = add(T, polar(len, a + u * 0.22));
    const d = `M${P1(T)}Q${P1(ctrl)} ${P1(end)}`;
    if (k % 4 === 0) ink += d;
    else needles += d;
  }
  out.push(
    `<path class="wash needles"${vars(tone(r, { spread: 0.06, hue: 8 }))} d="${needles}"/><path class="ink hair" d="${ink}"/>`,
  );
}

// Strictly erect ovoid female cone (2.5–4.5 cm) sitting upright above the twig with 25–40 loosely
// appressed, slightly incurved rounded scales.
export function larchCone(out: Out, r: Rng, B: Pt, H: number, tilt = 0, pc = "--cone-larch") {
  const dir = rad(-90) + tilt;
  const C = add(B, polar(H * 0.52, dir));
  // Short stout pedicel curving sharply upward so the cone stands strictly erect.
  out.push(`<path class="ink mid" d="M${P1(B)}L${P1(add(B, polar(H * 0.12, dir)))}"/>`);
  shape(
    out,
    r,
    roundPts(C, H * 0.48, H * 0.39, dir, 12),
    tone(r, { pc, spread: 0.04, hue: 6 }),
    { deep: 0.48, deepAbout: add(C, [H * 0.08, H * 0.1]), cls: "wash fruit" },
  );
  let scales = "";
  let edges = "";
  for (let row = -2; row <= 2; row++) {
    const yOff = row * H * 0.15;
    const wRow = H * 0.34 * Math.sqrt(Math.max(0.15, 1 - (row / 2.6) ** 2));
    const cols = row % 2 === 0 ? 3 : 2;
    for (let c = 0; c < cols; c++) {
      const xOff = (c / (cols - 1) - 0.5) * wRow * 1.3;
      const p = add(C, rot([yOff, xOff], dir));
      scales += closed(roundPts(p, H * 0.11, H * 0.12, dir, 6));
      const pL = add(p, rot([0, -H * 0.11], dir));
      const pTop = add(p, rot([H * 0.12, 0], dir));
      const pR = add(p, rot([0, H * 0.11], dir));
      edges += `M${P1(pL)}Q${P1(pTop)} ${P1(pR)}`;
    }
  }
  out.push(
    `<path class="wash"${vars(tone(r, { pc, dl: 0.06, spread: 0.03 }))} d="${scales}"/><path class="ink hair" d="${edges}"/>`,
  );
}

export function larch(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gMain = [0.02, 0.18];
  const main = grow(out, gMain[0], gMain[1], () =>
    limb(
      out,
      r,
      [at([-24, 8]), at([92, -16]), at([218, -28]), at([338, -22]), at([428, -38])],
      { w0: 28, w1: 7.5, cap: "taper", ...LARCH_BARK },
    ),
  );
  const parent = { res: main, g: gMain };
  const boughs = [
    branch(out, r, parent, 0.22, [[58, -54], [146, -104], [238, -126]], 0.08, { w0: 15, w1: 5, cap: "taper", ...LARCH_BARK }),
    branch(out, r, parent, 0.42, [[64, 38], [156, 78], [248, 86]], 0.08, { w0: 13.5, w1: 4.6, cap: "taper", ...LARCH_BARK }),
    branch(out, r, parent, 0.68, [[48, -36], [118, -68], [184, -76]], 0.08, { w0: 10.5, w1: 4, cap: "taper", ...LARCH_BARK }),
  ];

  // Stud every branch with dark cylindrical brachyblast spur pegs (all year) and soft needle rosettes (0.18..larchShed).
  for (const [bIdx, b] of [parent, ...boughs].entries()) {
    const n = b.res.n;
    for (let i = Math.round(n * 0.16), s = bIdx % 2 ? 1 : -1; i <= n - 3; i += 6, s = -s) {
      const u = i / n;
      const tang = angleOf(b.res.pts, i);
      const pegDir = tang + s * rad(54 + r() * 14);
      const pegLen = 9 + r() * 4;
      const peg = branch(
        out,
        r,
        b,
        u,
        [polar(pegLen * 0.5, pegDir), polar(pegLen, pegDir)],
        0.02,
        { w0: 5.4, w1: 4.4, cap: "blunt", ...LARCH_SPUR },
      );
      const tip = peg.res.pts[peg.res.n];
      const gRosette = Math.min(0.34, Math.max(gate(peg.res, peg.g, peg.res.n) + 0.015, 0.18 + u * 0.12 + r() * 0.015));
      part(
        out,
        gRosette,
        tip,
        () => larchRosette(out, r, tip, pegDir, 30 + r() * 9),
        larchShed(tip),
      );
    }
    // Terminal long shoot with spirally arranged single needles + terminal rosette.
    const tip = b.res.pts[n];
    const tipA = angleOf(b.res.pts, n);
    const gTerm = Math.min(0.34, Math.max(gate(b.res, b.g, n) + 0.015, 0.28));
    part(out, gTerm, tip, () => larchRosette(out, r, tip, tipA, 34), larchShed(tip));
  }

  // Strictly erect ovoid cones standing above the twigs all year (including bare winter wood),
  // preceded in spring (0.20..0.44, fade) by rose-pink female conelets on outer spurs.
  const conePositions: [{ res: Limb; g: number[] }, number, number][] = [
    [parent, 0.34, 34],
    [parent, 0.58, 32],
    [parent, 0.82, 30],
    [boughs[0], 0.48, 32],
    [boughs[0], 0.78, 29],
    [boughs[1], 0.52, 32],
    [boughs[1], 0.82, 28],
    [boughs[2], 0.62, 29],
  ];
  conePositions.forEach(([b, u, H], k) => {
    const i = Math.round(b.res.n * u);
    const p = add(b.res.pts[i], [0, -3]);
    const gCone = Math.min(0.34, Math.max(gate(b.res, b.g, i) + 0.015, 0.18 + u * 0.12));
    part(out, gCone, p, () => larchCone(out, r, p, H, (r() - 0.5) * 0.16));
    if (k % 2 === 1) {
      part(
        out,
        Math.min(0.34, gCone + 0.01),
        p,
        () => larchCone(out, r, p, H * 0.88, (r() - 0.5) * 0.14, "--cone-spruce-young"),
        0.44 + r() * 0.02,
        true,
      );
    }
  });
}

export function larchDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-160, 26], [-40, 12], [75, 4], [165, -8]], {
    w0: 15,
    w1: 7,
    cap: "taper",
    ...LARCH_BARK,
  });
  for (const [u, side] of [
    [0.18, 1],
    [0.38, -1],
    [0.58, 1],
    [0.78, -1],
    [0.95, 1],
  ] as const) {
    const i = Math.round(twig.n * u);
    const p = twig.pts[i];
    const dir = angleOf(twig.pts, i) + side * rad(58);
    const peg = limb(out, r, [p, add(p, polar(9, dir)), add(p, polar(18, dir))], {
      w0: 9,
      w1: 7.5,
      cap: "blunt",
      ...LARCH_SPUR,
    });
    larchRosette(out, r, peg.pts[peg.n], dir, 58);
  }
  larchCone(out, r, add(twig.pts[Math.round(twig.n * 0.3)], [0, -5]), 64, -0.06);
  larchCone(out, r, add(twig.pts[Math.round(twig.n * 0.68)], [0, -5]), 58, 0.05);
}

// ===========================================================================
// 3. Silver birch (Betula pendula): chalk-white peeling trunk (--bark-birch) with horizontal
// lenticels and rough black diamond basal fissures (--bark-birch-fissure), ascending main limbs
// and long slender weeping reddish-brown twigs (--twig-birch), spring elongating yellow-brown
// male catkins (--catkin-birch, gated after whip tip..0.41), doubly serrate rhombic-diamond leaves
// (hairline: true, gated after whip..fallsAt around 0.72..0.82, turning butter-gold via
// --pl-birch-autumn), and rigid dark winter male catkins at twig tips (0.60..1.0).
// ===========================================================================

const BIRCH_BARK = { pc: "--bark-birch" };
const BIRCH_TWIG = { pc: "--twig-birch" };
const birchShed = fallsAt(0.73, 0.08);
const birchCatkinFall = fallsAt(0.36, 0.05);

// Doubly serrate rhombic-triangular (diamond-deltoid) leaf with cuneate base and acuminate tip.
export function birchLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const n = 14;
  const up: Pt[] = [];
  const dn: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    // Rhombic-diamond envelope: widest around s = 0.34, tapering sharply to an acuminate tip.
    const env = s < 0.34 ? (s / 0.34) ** 0.82 : ((1 - s) / 0.66) ** 0.88;
    // Double serration: primary teeth modulated by finer secondary teeth.
    const teeth = i > 1 && i < n ? 1 - 0.12 * ((i % 2) * 0.68 + ((i * 3) % 2) * 0.32) : 1;
    const hw = L * 0.34 * env * teeth;
    up.push([s * L, -hw]);
    dn.push([s * L, hw]);
  }
  const pts = [[0, 0] as Pt, ...up.slice(1), [L * 1.03, 0] as Pt, ...dn.slice(1, -1).reverse()].map(toW);
  shape(out, r, pts, tone(r, { spread: 0.06, hue: 8 }), {
    deep: 0.38,
    deepAbout: toW([L * 0.34, 0]),
    ink: false,
  });
  let veins = `M${P1(O)}L${P1(toW([L * 0.92, 0]))}`;
  for (const s of [0.24, 0.46, 0.68]) {
    const w = L * 0.27 * (s < 0.34 ? s / 0.34 : (1 - s) / 0.66);
    for (const sg of [-1, 1]) {
      veins += `M${P1(toW([s * L, 0]))}L${P1(toW([(s + 0.14) * L, sg * w]))}`;
    }
  }
  out.push(`<path class="ink hair" d="${closed(pts)}"/><path class="ink hair vein" d="${veins}"/>`);
}

// Black diamond-shaped basal bark fissures and horizontal peeling lenticel strips on white birch wood.
function birchBarkMarkings(out: Out, r: Rng, tr: Limb, diamondsCount = 5) {
  let diamonds = "";
  let lenticels = "";
  for (let k = 0; k < diamondsCount; k++) {
    const u = 0.08 + (k / diamondsCount) * 0.52;
    const i = Math.round(tr.n * u);
    const a = angleOf(tr.pts, i);
    const v = 0.22 + ((k * 37) % 50) / 100;
    const c = lerp(tr.L[i], tr.R[i], v);
    const len = 14 + (1 - u) * 14;
    const wid = 4.5 + (1 - u) * 3.5;
    const dVec = polar(len, a);
    const nVec = polar(wid, a + rad(90));
    diamonds += closed([sub(c, dVec), add(c, nVec), add(c, dVec), sub(c, nVec)]);
  }
  for (let i = 3; i < tr.n - 2; i += 3) {
    const a = angleOf(tr.pts, i) + rad(90);
    const c = lerp(tr.L[i], tr.R[i], 0.18 + r() * 0.64);
    const w = tr.width(i / tr.n) * (0.18 + r() * 0.18);
    lenticels += `M${P1(sub(c, polar(w, a)))}L${P1(add(c, polar(w, a)))}`;
  }
  out.push(
    `<path class="wash"${vars(tone(r, { pc: "--bark-birch-fissure", spread: 0.03 }))} d="${diamonds}"/><path class="ink hair" d="${diamonds}"/><path class="ink thin bark-tex" d="${lenticels}"/>`,
  );
}

// Paired/clustered pendulous yellow-brown spring male catkins (--catkin-birch).
function birchSpringCatkins(out: Out, r: Rng, T: Pt, len: number) {
  let washD = "";
  let scalesD = "";
  for (const [dx, lMul, sway] of [
    [-2.5, 1.0, -5],
    [2.5, 0.84, 4],
  ] as const) {
    const l = len * lMul;
    const sp = sample((t) => add(T, [dx + Math.sin(t * 2.2) * sway, t * l]), 7);
    for (let i = 1; i <= 7; i++) {
      const p = sp[i];
      washD += closed(roundPts(p, 3.4, 4.2, 0, 6));
      if (i % 2 === 0) scalesD += `M${P1(add(p, [-3, 0]))}Q${P1(add(p, [0, 2.5]))} ${P1(add(p, [3, 0]))}`;
    }
  }
  out.push(
    `<path class="wash"${vars(tone(r, { pc: "--catkin-birch", spread: 0.04, hue: 8 }))} d="${washD}"/><path class="ink hair" d="${scalesD}"/>`,
  );
}

// Rigid dark purple-brown overwintering male catkins at bare twig tips (0.60..1.0).
function birchWinterCatkins(out: Out, r: Rng, T: Pt, dir: number, sc = 1) {
  let catkins = "";
  for (const da of [-0.24, 0.2]) {
    const a = dir + da;
    const C = add(T, polar(11 * sc, a));
    catkins += closed(roundPts(C, 10 * sc, 2.4 * sc, a, 7));
  }
  out.push(
    `<path class="wash"${vars(tone(r, { pc: "--twig-birch", dl: -0.06, spread: 0.03 }))} d="${catkins}"/><path class="ink hair" d="${catkins}"/>`,
  );
}

export function birch(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gTrunk = [0.01, 0.16];
  // Chalk-white trunk sweeping high and deep inward from the edge with black diamond basal fissures.
  const trunk = grow(out, gTrunk[0], gTrunk[1], () => {
    const tr = limb(
      out,
      r,
      [at([-28, 45]), at([75, -65]), at([185, -185]), at([285, -295]), at([365, -375])],
      { w0: 38, w1: 11, cap: "taper", ...BIRCH_BARK },
    );
    birchBarkMarkings(out, r, tr, 6);
    return tr;
  });
  const parent = { res: trunk, g: gTrunk };
  const upperLimb = branch(
    out,
    r,
    parent,
    0.34,
    [[48, -62], [122, -128], [202, -178]],
    0.07,
    { w0: 17, w1: 6, cap: "taper", lenticels: true, ...BIRCH_BARK },
  );
  const outerLimb = branch(
    out,
    r,
    parent,
    0.58,
    [[62, -14], [148, -28], [228, -24]],
    0.07,
    { w0: 14, w1: 5, cap: "taper", lenticels: true, ...BIRCH_BARK },
  );

  // Long, slender, whip-like weeping reddish-brown twigs (--twig-birch, drop = 180..290 units) cascading downward.
  const whipPlan: [{ res: Limb; g: number[] }, readonly number[]][] = [
    [parent, [0.26, 0.44, 0.68, 0.88, 0.98]],
    [upperLimb, [0.36, 0.68, 0.96]],
    [outerLimb, [0.38, 0.72, 0.96]],
  ];
  for (const [l, knots] of whipPlan) {
    for (const u of knots) {
      const len = 180 + r() * 110;
      const sway = 22 + (r() - 0.5) * 18;
      const whip = branch(
        out,
        r,
        l,
        u,
        [
          [sway * 0.25, len * 0.32],
          [sway * 0.68, len * 0.68],
          [sway, len],
        ],
        0.08,
        { w0: 2.5, w1: 0.85, cap: "taper", ...BIRCH_TWIG },
      );
      const wn = whip.res.n;
      // Alternate doubly serrate rhombic-diamond leaves on slender petioles along the weeping whip.
      for (let i = 4, side = 1; i <= wn - 2; i += 5, side = -side) {
        const p = whip.res.pts[i];
        const tang = angleOf(whip.res.pts, i);
        const petDir = tang + side * rad(36 + r() * 14);
        const leafBase = add(p, polar(11, petDir));
        const gLeaf = Math.min(0.34, Math.max(gate(whip.res, whip.g, i) + 0.015, 0.18 + (i / wn) * 0.05) + r() * 0.015);
        part(
          out,
          gLeaf,
          p,
          () => {
            out.push(`<path class="ink hair" d="M${P1(p)}L${P1(leafBase)}"/>`);
            birchLeaf(out, r, leafBase, petDir + side * rad(8), 32 + r() * 9);
          },
          birchShed(p),
        );
      }
      // Spring elongating yellow-brown male catkins and rigid winter male catkins (0.60..1.0) at whip tip.
      const tip = whip.res.pts[wn];
      const tipDir = angleOf(whip.res.pts, wn - 1);
      const gTip = gate(whip.res, whip.g, wn) + 0.015;
      part(out, gTip, tip, () => birchSpringCatkins(out, r, tip, 46 + r() * 10), birchCatkinFall(tip));
      part(out, Math.max(0.6, gTip), tip, () => birchWinterCatkins(out, r, tip, tipDir, 1));
    }
  }
}

export function birchDetail(out: Out, r: Rng) {
  const barkLimb = limb(out, r, [[-155, -75], [-60, -95], [45, -110]], {
    w0: 36,
    w1: 22,
    cap: "blunt",
    ...BIRCH_BARK,
  });
  birchBarkMarkings(out, r, barkLimb, 4);
  const whip = limb(out, r, [[-10, -98], [18, -10], [34, 85], [46, 165]], {
    w0: 4.5,
    w1: 1.6,
    cap: "taper",
    ...BIRCH_TWIG,
  });
  for (const [u, side] of [
    [0.24, -1],
    [0.48, 1],
    [0.72, -1],
    [0.9, 1],
  ] as const) {
    const i = Math.round(whip.n * u);
    const p = whip.pts[i];
    const d = angleOf(whip.pts, i) + side * rad(42);
    const E = add(p, polar(22, d));
    out.push(`<path class="ink thin" d="M${P1(p)}L${P1(E)}"/>`);
    birchLeaf(out, r, E, d, 72);
  }
  birchSpringCatkins(out, r, whip.pts[whip.n], 88);
}

// ===========================================================================
// 4. Scots pine (Pinus sylvestris): flaky salmon-orange upper limbs (--bark-scotspine), spring
// upright golden-brown "candles" at shoot tips (--candle-pine, 0.22..0.45), stiff twisted
// blue-green needle pairs in fascicles of 2 (evergreen all year), and pointed conical brown
// cones (--cone-spruce / --cone-larch) pointing backward along the branch.
// ===========================================================================

const PINE_BARK = { pc: "--bark-scotspine" };

// Tufts of stiff, twisted blue-green needles in fascicles of 2 bound by persistent grey-brown basal sheaths.
export function scotsPineTuft(out: Out, r: Rng, tip: Pt, dir: number, R: number, pc?: string) {
  const mass = sample((t) => add(add(tip, polar(R * 0.38, dir)), polar(R * (0.48 + 0.08 * Math.sin(t * TAU * 5)), t * TAU)), 16).slice(0, -1);
  shape(out, r, mass, tone(r, { pc, dl: -0.05, spread: 0.05, hue: 8 }), { deep: 0.45, ink: false });
  let sheaths = "";
  let needles = "";
  let ink = "";
  const pairs = 13;
  for (let k = 0; k < pairs; k++) {
    const u = k / (pairs - 1) - 0.5;
    const baseA = dir + u * rad(190) + (r() - 0.5) * 0.12;
    const b0 = add(tip, polar(4, baseA));
    const sEnd = add(b0, polar(7.5, baseA));
    sheaths += closed(roundPts(lerp(b0, sEnd, 0.5), 4, 1.6, baseA, 5));
    // Two needles per fascicle, diverging at a sharp V and twisting slightly across one another.
    for (const pairSide of [-1, 1]) {
      const len = R * (0.76 + r() * 0.28);
      const a1 = baseA + pairSide * rad(8 + r() * 5);
      const ctrl = add(sEnd, polar(len * 0.52, a1 - pairSide * 0.14));
      const end = add(sEnd, polar(len, a1 + pairSide * 0.08));
      const seg = `M${P1(sEnd)}Q${P1(ctrl)} ${P1(end)}`;
      if ((k + (pairSide > 0 ? 1 : 0)) % 3 === 0) ink += seg;
      else needles += seg;
    }
  }
  const st = pc ? `--pc:var(${pc});stroke:var(${pc})` : "";
  out.push(
    `<path class="wash needles"${st ? ` style="${st}"` : vars(tone(r, { spread: 0.06, hue: 8 }))} d="${needles}"/><path class="ink hair" d="${ink}"/>`,
  );
  out.push(`<path class="wash"${vars(tone(r, { pc: "--cone-larch", spread: 0.03 }))} d="${sheaths}"/>`);
}

// Erect golden-brown spring "candle" (elongating shoot bud, 4–10 cm) with basal yellow pollen cones.
function scotsPineCandle(out: Out, r: Rng, T: Pt, H: number, tilt = 0) {
  const dir = rad(-90) + tilt;
  const top = add(T, polar(H, dir));
  const body = roundPts(lerp(T, top, 0.52), H * 0.5, H * 0.14, dir, 10);
  shape(out, r, body, tone(r, { pc: "--candle-pine", spread: 0.04, hue: 6 }), { deep: 0.35 });
  // Clustered yellow pollen cones at the candle base.
  let pollen = "";
  for (const [dx, dy] of [
    [-4.5, -5],
    [4.5, -5],
    [0, -9],
    [-3.5, -12],
    [3.5, -12],
  ] as const) {
    pollen += closed(roundPts(add(T, rot([dy, dx], dir)), 3.2, 2.4, dir, 6));
  }
  out.push(
    `<path class="wash"${vars(tone(r, { pc: "--catkin-birch", dl: 0.06, spread: 0.03 }))} d="${pollen}"/><path class="ink hair" d="${pollen}"/>`,
  );
}

// Pointed conical-ovoid seed cone (3–7.5 cm) pointing backward (deflexed) along the shoot with
// rhombic pyramidal scale apophyses.
export function scotsPineCone(out: Out, r: Rng, B: Pt, backDir: number, L: number) {
  const toW = (x: number, y: number): Pt => add(B, rot([x * L, y * L], backDir));
  // Conical-ovoid silhouette: broad rounded base near B tapering to an acute pointed apex at x = 1.0.
  const pts: Pt[] = [
    [0, 0],
    [0.14, -0.24],
    [0.34, -0.31],
    [0.62, -0.24],
    [0.86, -0.11],
    [1.02, 0],
    [0.86, 0.11],
    [0.62, 0.24],
    [0.34, 0.31],
    [0.14, 0.24],
  ].map(([x, y]) => toW(x, y));
  shape(
    out,
    r,
    pts,
    tone(r, { pc: "--cone-spruce", spread: 0.04, hue: 8 }),
    { deep: 0.5, deepAbout: toW(0.42, 0.1), cls: "wash fruit" },
  );
  // Rhombic diamond scale apophyses with central umbo dot.
  let rhomb = "";
  let rhombInk = "";
  for (const [x, w, cols] of [
    [0.24, 0.22, 2],
    [0.44, 0.24, 3],
    [0.64, 0.18, 2],
    [0.82, 0.09, 1],
  ] as const) {
    for (let c = 0; c < cols; c++) {
      const y = cols === 1 ? 0 : (c / (cols - 1) - 0.5) * w * 1.4;
      const d = [
        toW(x - 0.09, y),
        toW(x, y - 0.085),
        toW(x + 0.09, y),
        toW(x, y + 0.085),
      ];
      rhomb += closed(d);
      rhombInk += `${closed(d)}M${P1(toW(x - 0.01, y))}L${P1(toW(x + 0.01, y))}`;
    }
  }
  out.push(
    `<path class="wash"${vars(tone(r, { pc: "--cone-larch", dl: 0.08, spread: 0.03 }))} d="${rhomb}"/><path class="ink hair" d="${rhombInk}"/>`,
  );
}

export function scotspine(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gMain = [0.02, 0.18];
  // Picturesque crooked salmon-orange upper limb reaching right from the lower left edge.
  const main = grow(out, gMain[0], gMain[1], () =>
    limb(
      out,
      r,
      [at([-26, 12]), at([92, -32]), at([215, -18]), at([332, -74]), at([428, -96])],
      { w0: 32, w1: 9, cap: "taper", lenticels: true, ...PINE_BARK },
    ),
  );
  const parent = { res: main, g: gMain };
  const forks = [
    branch(out, r, parent, 0.32, [[48, -56], [122, -112], [196, -138]], 0.08, { w0: 16, w1: 6, cap: "taper", ...PINE_BARK }),
    branch(out, r, parent, 0.56, [[56, 26], [136, 42], [208, 22]], 0.08, { w0: 14, w1: 5.5, cap: "taper", ...PINE_BARK }),
    branch(out, r, parent, 0.78, [[38, -44], [94, -84]], 0.08, { w0: 11, w1: 5, cap: "taper", ...PINE_BARK }),
  ];

  // Paired twisted blue-green needle tufts (evergreen), spring upright golden candles (0.22..0.45, fade),
  // and backward-pointing pointed conical cones along the orange limbs.
  for (const [idx, b] of [parent, ...forks].entries()) {
    const n = b.res.n;
    const tip = b.res.pts[n];
    const tipA = angleOf(b.res.pts, n);
    const gTip = gate(b.res, b.g, n) + 0.015;
    part(out, gTip, tip, () => scotsPineTuft(out, r, tip, tipA, 58 + r() * 10));
    part(
      out,
      Math.max(gTip + 0.015, 0.22 + idx * 0.01),
      tip,
      () => scotsPineCandle(out, r, add(tip, polar(8, tipA)), 42 + r() * 8, (r() - 0.5) * 0.18),
      0.45 + r() * 0.02,
      true,
    );

    const midI = Math.round(n * 0.64);
    const midP = b.res.pts[midI];
    const midA = angleOf(b.res.pts, midI);
    part(out, gate(b.res, b.g, midI) + 0.015, midP, () =>
      scotsPineTuft(out, r, midP, midA - rad(48), 48 + r() * 8),
    );

    // Pointed conical cones pointing backward (deflexed) along the branch.
    for (const [u, side] of idx === 0
      ? ([
          [0.44, 1],
          [0.72, -1],
        ] as const)
      : ([[0.52, idx % 2 ? 1 : -1]] as const)) {
      const ci = Math.round(n * u);
      const cp = b.res.pts[ci];
      const backA = angleOf(b.res.pts, ci) + Math.PI + side * rad(28);
      part(out, gate(b.res, b.g, ci) + 0.015, cp, () => scotsPineCone(out, r, cp, backA, 48 + r() * 6));
    }
  }
}

export function scotspineDetail(out: Out, r: Rng) {
  const bough = limb(out, r, [[-155, 40], [-35, 10], [85, -18], [145, -32]], {
    w0: 18,
    w1: 8,
    cap: "taper",
    lenticels: true,
    ...PINE_BARK,
  });
  const tip = bough.pts[bough.n];
  const tipA = angleOf(bough.pts, bough.n);
  scotsPineTuft(out, r, tip, tipA, 92);
  scotsPineCandle(out, r, add(tip, polar(10, tipA)), 72, -0.06);
  const midP = bough.pts[Math.round(bough.n * 0.52)];
  const midA = angleOf(bough.pts, Math.round(bough.n * 0.52));
  scotsPineTuft(out, r, midP, midA - rad(52), 78);
  scotsPineCone(out, r, bough.pts[Math.round(bough.n * 0.36)], midA + Math.PI + rad(26), 86);
  scotsPineCone(out, r, bough.pts[Math.round(bough.n * 0.68)], midA + Math.PI - rad(28), 78);
}

// ===========================================================================
// 5. Methuselah's beard (Usnea longissima): hanging from top edge, drawn draped unattached over a
// plunging diagonal Siberian spruce host bough (--bark-spruce with dark spruce needle tufts at its
// tips so nothing floats!), long pale chartreuse-grey main strands (--pl-methuselah) clothed
// perpendicularly along their entire length in dense horizontal fishbone fibrils.
// ===========================================================================

function methuselahStrand(out: Out, r: Rng, P: Pt, L: number, drift: number) {
  const sway = wobble(r, 7, [1, 2]);
  const n = 22;
  // Unattached loop arching slightly over the top of the spruce bough before cascading straight down.
  const pts = sample((t) => {
    const archY = t < 0.08 ? -9 * Math.sin((t / 0.08) * Math.PI) : (t - 0.08) * L;
    return add(P, [drift * t + sway(t), archY]);
  }, n);

  const left: Pt[] = [];
  const right: Pt[] = [];
  let fibrils = "";
  let fibrilWash = "";
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = pts[i];
    const hw = 1.8 * (1 - u * 0.38);
    left.push([p[0] - hw, p[1]]);
    right.push([p[0] + hw, p[1]]);
    if (i >= 1 && i < n) {
      // Dense horizontal perpendicular fishbone fibrils (5–25 mm) along the entire main axis.
      const fLen = (14 + 7 * Math.sin(Math.PI * u ** 0.7) + (r() - 0.5) * 5) * (1 - u * 0.25);
      const dyL = (r() - 0.5) * 3.5;
      const dyR = (r() - 0.5) * 3.5;
      fibrils += `M${P1([p[0] - fLen, p[1] + dyL])}L${P1([p[0] + fLen, p[1] + dyR])}`;
      const fMid = (10 + (r() - 0.5) * 4) * (1 - u * 0.25);
      fibrils += `M${P1([p[0] - fMid, p[1] + 4])}L${P1([p[0] + fMid, p[1] + 4])}`;
      if (i % 2 === 1) {
        fibrilWash += closed([
          [p[0] - fLen * 0.85, p[1] - 3],
          [p[0] + fLen * 0.85, p[1] - 3],
          [p[0] + fLen * 0.75, p[1] + 5],
          [p[0] - fLen * 0.75, p[1] + 5],
        ]);
      }
    }
  }
  const cord = closed([...left, ...right.reverse()]);
  out.push(
    `<path class="wash"${vars(tone(r, { dl: -0.02, spread: 0.04, hue: 6 }))} d="${fibrilWash}"/><path class="wash"${vars(tone(r, { dl: 0.05, spread: 0.03 }))} d="${cord}"/><path class="ink hair" style="stroke:var(--pl-methuselah);stroke-opacity:.92" d="${fibrils}"/><path class="ink hair" d="${fibrils}"/><path class="ink thin" d="${line(pts)}"/>`,
  );
}

export function methuselah(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Dipping Siberian spruce host bough sweeping diagonally down-right from `base = [0, 0]` with a left fork.
  const gHost = [0.02, 0.2];
  const host = grow(out, gHost[0], gHost[1], () =>
    limb(
      out,
      r,
      [at([-15, -14]), at([65, 38]), at([155, 86]), at([245, 112])],
      { w0: 20, w1: 7.5, cap: "taper", ...SPRUCE_BARK },
    ),
  );
  const parent = { res: host, g: gHost };
  const forkOrigin = host.pts[Math.round(host.n * 0.24)];
  const sideFork = branch(
    out,
    r,
    parent,
    0.24,
    [sub(at([-38, 46]), forkOrigin), sub(at([-95, 78]), forkOrigin)],
    0.08,
    { w0: 11, w1: 4.5, cap: "taper", ...SPRUCE_BARK },
  );

  // Dark spruce needle sprays and a pendulous spruce cone on the dipping boughs so nothing floats.
  for (const [b, u] of [
    [sideFork, 0.68],
    [sideFork, 1.0],
    [parent, 0.52],
    [parent, 0.8],
    [parent, 1.0],
  ] as const) {
    const i = Math.round(b.res.n * u);
    const p = b.res.pts[i];
    const a = angleOf(b.res.pts, Math.min(i, b.res.n - 1));
    const gSpray = gate(b.res, b.g, i) + 0.015;
    part(out, gSpray, p, () => spruceSpray(out, r, p, a, 46, false, "--pl-spruce", gSpray));
  }
  const coneI = Math.round(host.n * 0.86);
  const coneP = host.pts[coneI];
  part(out, gate(host, gHost, coneI) + 0.02, coneP, () => spruceCone(out, r, add(coneP, [0, 3]), 54, 0.06));

  // Seven long pale chartreuse-grey fishbone garlands cascading 320..460 units down from the dipping boughs.
  const drapes: [{ res: Limb; g: number[] }, number, number, number][] = [
    [sideFork, 0.82, 330, -10],
    [sideFork, 0.46, 365, -6],
    [parent, 0.22, 390, -4],
    [parent, 0.38, 435, 0],
    [parent, 0.54, 460, 4],
    [parent, 0.7, 405, 8],
    [parent, 0.86, 320, 12],
  ];
  drapes.forEach(([b, u, len, drift], k) => {
    const i = Math.round(b.res.n * u);
    const p = b.res.pts[i];
    const gDrape = Math.min(0.32, gate(b.res, b.g, i) + 0.02 + k * 0.01);
    part(out, gDrape, p, () => methuselahStrand(out, r, p, len, drift));
  });
}

export function methuselahDetail(out: Out, r: Rng) {
  const bough = limb(out, r, [[-155, -135], [-20, -118], [135, -128]], {
    w0: 16,
    w1: 8,
    cap: "taper",
    ...SPRUCE_BARK,
  });
  spruceSpray(out, r, bough.pts[bough.n], angleOf(bough.pts, bough.n), 64, false, "--pl-spruce");
  methuselahStrand(out, r, bough.pts[Math.round(bough.n * 0.28)], 295, -8);
  methuselahStrand(out, r, bough.pts[Math.round(bough.n * 0.56)], 325, 6);
  methuselahStrand(out, r, bough.pts[Math.round(bough.n * 0.78)], 265, 12);
}

// ===========================================================================
// 6. Horsehair lichen (Bryoria fremontii): hanging from top edge, drawn hanging from a plunging
// crooked salmon-orange Scots pine host bough (--bark-scotspine with paired blue-green pine needles
// at its tips), cascading locks of dark chocolate-black threads (--lichen-horsehair / --pl-horsehair)
// branching dichotomously at acute angles.
// ===========================================================================

function horsehairLock(out: Out, r: Rng, P: Pt, L: number, drift: number) {
  // Soft dark chocolate-black skein silhouette so field() registers the hanging lock.
  const mid = add(P, [drift * 0.45, L * 0.48]);
  const tip = add(P, [drift, L]);
  const skein: Pt[] = [
    add(P, [-7, 0]),
    add(mid, [-14, 0]),
    add(tip, [-4, -18]),
    tip,
    add(tip, [4, -18]),
    add(mid, [14, 0]),
    add(P, [7, 0]),
  ];
  shape(out, r, skein, tone(r, { pc: "--lichen-horsehair", spread: 0.04, hue: 6 }), { deep: 0.35, ink: false });

  // Recursive dichotomous branching at acute V-angles into fine capillary threads (no fishbone fibrils!).
  let mainThreads = "";
  let fineThreads = "";
  const forkThread = (p0: Pt, dir: number, len: number, depth: number) => {
    const bend = (r() - 0.5) * 0.14;
    const ctrl = add(p0, polar(len * 0.52, dir + bend));
    const p1 = add(p0, polar(len, dir + bend * 0.6));
    const seg = `M${P1(p0)}Q${P1(ctrl)} ${P1(p1)}`;
    if (depth <= 1) mainThreads += seg;
    else fineThreads += seg;
    if (depth < 3) {
      // Acute dichotomous fork (10°–18° half-angle).
      const spreadA = rad(9 + r() * 7) * (1 - depth * 0.15);
      forkThread(p1, dir - spreadA, len * (0.68 + r() * 0.12), depth + 1);
      forkThread(p1, dir + spreadA, len * (0.68 + r() * 0.12), depth + 1);
    }
  };
  const baseDir = Math.atan2(L, drift);
  for (const dx of [-4, 0, 4]) {
    forkThread(add(P, [dx, 2]), baseDir + (dx / 4) * 0.05, L * 0.36, 0);
  }
  out.push(
    `<path class="ink mid" style="stroke:var(--lichen-horsehair)" d="${mainThreads}"/><path class="ink hair" style="stroke:var(--lichen-horsehair)" d="${fineThreads}"/><path class="ink hair" d="${mainThreads}${fineThreads}"/>`,
  );
}

export function horsehair(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Crooked salmon-orange Scots pine host bough plunging diagonally from `base = [0, 0]`.
  const gHost = [0.03, 0.22];
  const host = grow(out, gHost[0], gHost[1], () =>
    limb(
      out,
      r,
      [at([-12, -14]), at([55, 44]), at([135, 96]), at([215, 128])],
      { w0: 19, w1: 8, cap: "taper", lenticels: true, ...PINE_BARK },
    ),
  );
  const parent = { res: host, g: gHost };
  const forkOrigin = host.pts[Math.round(host.n * 0.24)];
  const fork = branch(
    out,
    r,
    parent,
    0.24,
    [sub(at([-32, 50]), forkOrigin), sub(at([-85, 84]), forkOrigin)],
    0.08,
    { w0: 11, w1: 4.8, cap: "taper", lenticels: true, ...PINE_BARK },
  );

  // Paired blue-green Scots pine needles and backward-pointing pine cone at the dipping tips.
  const hostTip = host.pts[host.n];
  part(out, gate(host, gHost, host.n) + 0.015, hostTip, () => scotsPineTuft(out, r, hostTip, rad(24), 46, "--pl-scotspine"));
  const forkTip = fork.res.pts[fork.res.n];
  part(out, gate(fork.res, fork.g, fork.res.n) + 0.015, forkTip, () =>
    scotsPineTuft(out, r, forkTip, rad(148), 42, "--pl-scotspine"),
  );
  const coneI = Math.round(host.n * 0.78);
  const coneP = host.pts[coneI];
  part(out, gate(host, gHost, coneI) + 0.02, coneP, () =>
    scotsPineCone(out, r, coneP, angleOf(host.pts, coneI) + Math.PI - 0.32, 44),
  );

  // Six dark chocolate-black dichotomous horsehair locks cascading 300..440 units down from the pine boughs.
  const locks: [{ res: Limb; g: number[] }, number, number, number][] = [
    [fork, 0.82, 310, -10],
    [fork, 0.46, 355, -5],
    [parent, 0.28, 385, -2],
    [parent, 0.46, 440, 3],
    [parent, 0.64, 395, 8],
    [parent, 0.82, 300, 12],
  ];
  locks.forEach(([b, u, len, drift], k) => {
    const i = Math.round(b.res.n * u);
    const p = b.res.pts[i];
    const gLock = Math.min(0.32, gate(b.res, b.g, i) + 0.02 + k * 0.01);
    part(out, gLock, p, () => horsehairLock(out, r, p, len, drift));
  });
}

export function horsehairDetail(out: Out, r: Rng) {
  const bough = limb(out, r, [[-150, -130], [-15, -112], [130, -124]], {
    w0: 18,
    w1: 8.5,
    cap: "taper",
    lenticels: true,
    ...PINE_BARK,
  });
  scotsPineTuft(out, r, bough.pts[bough.n], angleOf(bough.pts, bough.n), 68, "--pl-scotspine");
  horsehairLock(out, r, bough.pts[Math.round(bough.n * 0.28)], 290, -10);
  horsehairLock(out, r, bough.pts[Math.round(bough.n * 0.56)], 320, 4);
  horsehairLock(out, r, bough.pts[Math.round(bough.n * 0.8)], 260, 12);
}

// ===========================================================================
// 7. Fireweed (Chamaenerion angustifolium): tall unbranched reddish stems (--stem-fireweed)
// clothed in spirally alternate willow-like lance leaves (0.16..0.82, turning crimson via
// --pl-fireweed-autumn), crowned in summer (0.38..0.70) by a tapering pyramidal raceme of
// 4-petalled magenta-rose flowers (--flower-fireweed) opening base-to-tip, followed in autumn
// and winter (0.64..1.0) by linear capsules splitting into 4 recurved curling valves releasing
// white silky seed-plumes (--wool).
// ===========================================================================

const fireweedShed = fallsAt(0.76, 0.06);

// 4-petalled slightly zygomorphic magenta-rose blossom with 4 dark-pink sepal teeth and a white
// 4-cleft cross stigma.
export function fireweedFlower(out: Out, r: Rng, C: Pt, R: number, dir: number) {
  let sepals = "";
  for (const da of [-2.35, -0.8, 0.8, 2.35]) {
    const a = dir + da;
    const tip = add(C, polar(R * 0.82, a));
    const nrm = polar(R * 0.09, a + rad(90));
    sepals += closed([C, add(lerp(C, tip, 0.5), nrm), tip, sub(lerp(C, tip, 0.5), nrm)]);
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--flower-fireweed", dl: -0.16, spread: 0.03 }))} d="${sepals}"/>`);

  // Two broader upper obovate petals and two slightly narrower lower petals.
  let petals = "";
  for (const [da, wMul, lMul] of [
    [-1.65, 0.36, 0.96],
    [-0.52, 0.38, 1.0],
    [0.52, 0.38, 1.0],
    [1.65, 0.36, 0.96],
  ] as const) {
    const a = dir + da;
    const pc = add(C, polar(R * lMul * 0.54, a));
    petals += closed(roundPts(pc, R * lMul * 0.48, R * wMul, a, 8));
  }
  out.push(
    `<path class="wash petal"${vars(tone(r, { pc: "--flower-fireweed", spread: 0.04, hue: 8 }))} d="${petals}"/><path class="ink hair petal-edge" d="${petals}"/>`,
  );

  // White 4-cleft recurved cross stigma at the center.
  let stigma = "";
  const stC = add(C, polar(R * 0.22, dir));
  for (const sa of [-2.2, -0.8, 0.8, 2.2]) {
    const p1 = add(stC, polar(R * 0.24, dir + sa));
    stigma += `M${P1(C)}L${P1(stC)}L${P1(p1)}`;
  }
  out.push(`<path class="ink wool" d="${stigma}"/>`);
}

// Dehisced linear capsule splitting from the apex into 4 strongly recurved curling valves releasing
// billowy masses of white silky-plumed seeds (--wool).
export function fireweedSplitPod(out: Out, r: Rng, B: Pt, dir: number, L: number) {
  const splitBase = add(B, polar(L * 0.25, dir));
  // Billowy white silky coma cloud (--wool) emerging between the 4 curled valves.
  const cloudC = add(B, polar(L * 0.62, dir));
  let silkWash = "";
  for (const [dx, dy, rx, ry] of [
    [0, 0, L * 0.26, L * 0.18],
    [-L * 0.14, -L * 0.08, L * 0.18, L * 0.14],
    [L * 0.14, L * 0.06, L * 0.18, L * 0.14],
  ] as const) {
    silkWash += closed(roundPts(add(cloudC, rot([dx, dy], dir)), rx, ry, dir, 8));
  }
  out.push(`<path class="wash" style="--pc:var(--wool);fill-opacity:.82;stroke:none" d="${silkWash}"/>`);

  // Four strongly recurved curling valves (two outer, two inner) + central placenta column.
  let valves = `M${P1(B)}L${P1(add(B, polar(L * 0.88, dir)))}`;
  let plumes = "";
  for (const [sg, curlScale, spread] of [
    [-1, 1.0, 0.58],
    [1, 1.0, 0.58],
    [-1, 0.72, 0.3],
    [1, 0.72, 0.3],
  ] as const) {
    const mid = add(splitBase, polar(L * 0.42 * curlScale, dir + sg * spread));
    const tip = add(mid, polar(L * 0.28 * curlScale, dir + sg * (spread + 1.45)));
    const curlEnd = add(tip, polar(L * 0.16 * curlScale, dir + sg * (spread + 2.8)));
    valves += `M${P1(splitBase)}Q${P1(mid)} ${P1(tip)}Q${P1(add(tip, polar(4, dir + sg * 2.1)))} ${P1(curlEnd)}`;
  }
  for (let k = 0; k < 12; k++) {
    const u = 0.32 + (k / 11) * 0.52;
    const p0 = add(B, polar(L * u, dir));
    const a = dir + ((k % 2 ? 1 : -1) * (0.4 + (k % 3) * 0.28));
    plumes += `M${P1(p0)}Q${P1(add(p0, polar(L * 0.18, a - 0.2)))} ${P1(add(p0, polar(L * 0.32, a)))}`;
  }
  out.push(
    `<path class="ink wool" d="${plumes}"/><path class="ink thin" style="stroke:var(--stem-fireweed)" d="${valves}"/><path class="ink hair" d="${valves}"/>`,
  );
}

export function fireweed(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Four tall unbranched erect reddish stems rising from the bed.
  const wands: [number, number, number][] = [
    [-58, 395, -8],
    [-18, 495, -3],
    [22, 455, 5],
    [62, 365, 9],
  ];
  wands.forEach(([dx, H, lean], wIdx) => {
    const B = at([dx, 0]);
    const spine = sample((t) => add(B, [lean * t + Math.sin(t * Math.PI) * (wIdx % 2 ? 4 : -4), -H * t]), 16);
    const gStem: [number, number] = [0.06 + wIdx * 0.018, 0.2 + wIdx * 0.018];
    const stem = grow(out, gStem[0], gStem[1], () => ({
      ...stalk(out, (t) => spine[Math.round(t * 16)], 6.4, 2.4, tone(r, { pc: "--stem-fireweed", spread: 0.04 }), 16),
      pts: spine,
      n: 16,
    }));

    // Spirally alternate willow-like narrowly lanceolate leaves along the lower 62% of the stem.
    for (let i = 2, side = wIdx % 2 ? 1 : -1; i <= 10; i++, side = -side) {
      const p = stem.pts[i];
      const u = i / 16;
      const tang = angleOf(stem.pts, i);
      const leafDir = tang + side * rad(48 - u * 18);
      const leafLen = (74 - u * 26 + r() * 10) * (H / 460);
      const gLeaf = Math.min(0.34, Math.max(gate(stem, gStem, i) + 0.015, 0.18 + u * 0.08) + r() * 0.015);
      part(
        out,
        gLeaf,
        p,
        () =>
          blade(out, r, p, leafDir, leafLen, {
            W: 0.18,
            bend: side * 0.06,
            v: tone(r, { spread: 0.06, hue: 8 }),
            veins: 4,
            deep: 0.4,
            rib: "ink hair",
            hairline: true,
          }),
        fireweedShed(p),
      );
    }

    // Upper pyramidal raceme (nodes 10..16): flowers open from base to tip (0.36..0.70), followed by
    // 4-valved curling seed pods with white silky coma (0.64..1.0) that stand all winter.
    for (let i = 10; i <= 15; i++) {
      const p = stem.pts[i];
      const racU = (i - 10) / 5; // 0 at raceme base, 1 near apex
      const tang = angleOf(stem.pts, i);
      for (const side of [-1, 1]) {
        const pedDir = tang + side * rad(56 - racU * 16);
        const pedLen = (24 - racU * 10) * (H / 460);
        const flPos = add(p, polar(pedLen, pedDir));
        const openAt = Math.max(gate(stem, gStem, i) + 0.02, 0.36 + racU * 0.045);
        part(
          out,
          openAt,
          p,
          () => {
            out.push(`<path class="ink hair" style="stroke:var(--stem-fireweed)" d="M${P1(p)}L${P1(flPos)}"/>`);
            if (racU > 0.82) {
              // Reflexed dark crimson buds at the pointed raceme apex.
              const budC = add(p, polar(pedLen * 0.85, pedDir + side * 0.45));
              shape(
                out,
                r,
                roundPts(budC, 7.5, 3.6, pedDir + side * 0.45, 7),
                tone(r, { pc: "--flower-fireweed", dl: -0.14, spread: 0.03 }),
                { deep: 0, ink: false },
              );
            } else {
              fireweedFlower(out, r, flPos, (18 - racU * 4.5) * (H / 460), pedDir);
            }
          },
          0.68 + racU * 0.03,
        );
        // Autumn/winter 4-valved curling seed pods with white silky plumes (0.64..1.0).
        if (racU <= 0.82) {
          part(out, 0.64 + racU * 0.03, p, () =>
            fireweedSplitPod(out, r, p, pedDir - side * 0.18, (36 - racU * 8) * (H / 460)),
          );
        }
      }
    }
    // Pointed terminal bud cluster at the raceme tip.
    const top = stem.pts[16];
    part(
      out,
      Math.max(gate(stem, gStem, 16) + 0.02, 0.38),
      top,
      () => {
        for (const [dx, dy, a] of [
          [0, -8, -1.57],
          [-5, -4, -2.1],
          [5, -4, -1.0],
        ] as const) {
          shape(
            out,
            r,
            roundPts(add(top, [dx, dy]), 6.5, 3.2, a, 6),
            tone(r, { pc: "--flower-fireweed", dl: -0.16, spread: 0.03 }),
            { deep: 0, ink: false },
          );
        }
      },
      0.7,
    );
  });
}

export function fireweedDetail(out: Out, r: Rng) {
  const spine = sample((t) => [Math.sin(t * 2) * 6, 175 - t * 340], 12);
  stalk(out, (t) => spine[Math.round(t * 12)], 9, 4, tone(r, { pc: "--stem-fireweed", spread: 0.03 }), 12);
  blade(out, r, spine[2], rad(-142), 135, {
    W: 0.19,
    v: tone(r, { spread: 0.05 }),
    veins: 6,
    deep: 0.4,
    rib: "ink thin",
    hairline: true,
  });
  blade(out, r, spine[3], rad(-38), 128, {
    W: 0.19,
    v: tone(r, { spread: 0.05 }),
    veins: 6,
    deep: 0.4,
    rib: "ink thin",
    hairline: true,
  });
  fireweedSplitPod(out, r, spine[5], rad(-135), 88);
  fireweedSplitPod(out, r, spine[6], rad(-42), 84);
  for (const [idx, ang, sz] of [
    [8, rad(-138), 38],
    [9, rad(-42), 36],
    [10, rad(-132), 32],
    [11, rad(-48), 30],
  ] as const) {
    const p = spine[idx];
    const fl = add(p, polar(32, ang));
    out.push(`<path class="ink thin" style="stroke:var(--stem-fireweed)" d="M${P1(p)}L${P1(fl)}"/>`);
    fireweedFlower(out, r, fl, sz, ang);
  }
}

// ===========================================================================
// 8. Labrador tea (Rhododendron tomentosum, syn. Ledum palustre): evergreen bog shrub with
// rusty-woolly twigs (--felt-rust), narrow rolled leathery leaves showing rust-orange felted
// undersides (0.18..0.80 spreading, plus folded-down winter leaves 0.76..1.0 showing rust-woolly
// backs), terminal hemispherical domes of 5-petalled white star flowers (--flower-labrador,
// 0.34..0.60), and 5-valved brown capsules on down-curved stalks (0.58..1.0).
// ===========================================================================

const RUST_TWIG = { pc: "--felt-rust" };

// Narrowly oblong leathery leaf with strongly rolled-under (revolute) margins and dense rust-orange
// woolly felt (--felt-rust) on the underside.
export function labradorLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number, showRustBack = false) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const w = L * 0.21;
  const pts: Pt[] = [
    [0, 0],
    [L * 0.18, -w * 0.78],
    [L * 0.52, -w],
    [L * 0.86, -w * 0.72],
    [L, 0],
    [L * 0.86, w * 0.72],
    [L * 0.52, w],
    [L * 0.18, w * 0.78],
  ].map(toW);

  if (showRustBack) {
    // Underside view or winter-drooping leaf showing dense rust-orange woolly felt bordered by dark rolled margins.
    shape(out, r, pts, tone(r, { pc: "--felt-rust", spread: 0.05, hue: 8 }), { deep: 0.35, ink: false });
    const inner = [
      [L * 0.12, 0],
      [L * 0.5, -w * 0.55],
      [L * 0.88, 0],
      [L * 0.5, w * 0.55],
    ].map(toW);
    out.push(
      `<path class="wash felt"${vars(tone(r, { pc: "--felt-rust", dl: 0.07, spread: 0.03 }))} d="${closed(inner)}"/><path class="ink thin" style="stroke:var(--pl-labradortea)" d="${closed(pts)}"/><path class="ink hair" d="${closed(pts)}M${P1(O)}L${P1(toW([L * 0.92, 0]))}"/>`,
    );
  } else {
    // Upper surface view with a sliver of rust-orange felt visible along the lower revolute rim.
    shape(out, r, pts, tone(r, { spread: 0.06, hue: 8 }), { deep: 0.45, ink: false });
    const rustRim = [
      [L * 0.14, w * 0.42],
      [L * 0.52, w * 0.96],
      [L * 0.88, w * 0.45],
      [L * 0.52, w * 0.52],
    ].map(toW);
    out.push(
      `<path class="wash felt"${vars(tone(r, { pc: "--felt-rust", spread: 0.04 }))} d="${closed(rustRim)}"/><path class="ink hair" d="${closed(pts)}M${P1(O)}L${P1(toW([L * 0.92, 0]))}"/>`,
    );
  }
}

// Terminal hemispherical umbel-like corymb of 5-petalled creamy-white star flowers (--flower-labrador)
// with 10 long protruding stamens.
export function labradorCorymb(out: Out, r: Rng, T: Pt, R: number) {
  let pedicels = "";
  let petals = "";
  let stamens = "";
  let centers = "";
  const count = 11;
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1) - 0.5;
    const ring = k % 2;
    const a = rad(-90) + u * rad(148);
    const reach = R * (ring ? 0.86 : 0.52);
    const C = add(T, [Math.cos(a) * reach, Math.sin(a) * reach * 0.72 - R * 0.18]);
    pedicels += `M${P1(T)}L${P1(C)}`;
    const fR = R * 0.24;
    const spin = k * 0.5;
    for (let p = 0; p < 5; p++) {
      const pa = spin + (p / 5) * TAU;
      petals += closed(roundPts(add(C, polar(fR * 0.54, pa)), fR * 0.48, fR * 0.28, pa, 6));
    }
    centers += closed(roundPts(C, fR * 0.16, fR * 0.16, 0, 5));
    for (let s = 0; s < 6; s++) {
      const sa = spin + 0.3 + (s / 6) * TAU;
      stamens += `M${P1(C)}L${P1(add(C, polar(fR * 1.05, sa)))}`;
    }
  }
  out.push(`<path class="ink hair" style="stroke:var(--felt-rust)" d="${pedicels}"/>`);
  out.push(
    `<path class="wash petal"${vars(tone(r, { pc: "--flower-labrador", spread: 0.03 }))} d="${petals}"/><path class="ink hair petal-edge" d="${petals}"/>`,
  );
  out.push(
    `<path class="ink hair" style="stroke:var(--felt-rust);stroke-opacity:.75" d="${stamens}"/><path class="wash"${vars(tone(r, { pc: "--candle-pine", spread: 0.03 }))} d="${centers}"/>`,
  );
}

// Umbel of down-curved fruiting pedicels bearing ovoid brown 5-valved capsules that split from the base.
function labradorCapsules(out: Out, r: Rng, T: Pt, R: number) {
  let stalksD = "";
  let capsD = "";
  for (let k = -3; k <= 3; k++) {
    const a = rad(-90 + k * 22);
    const knee = add(T, polar(R * 0.52, a));
    const end = add(knee, [Math.sign(k || 1) * 4, R * 0.34]);
    stalksD += `M${P1(T)}Q${P1(knee)} ${P1(end)}`;
    capsD += closed(roundPts(add(end, [0, 4.5]), 3.6, 5.4, 0, 7));
  }
  out.push(
    `<path class="ink hair" style="stroke:var(--felt-rust)" d="${stalksD}"/><path class="wash"${vars(tone(r, { pc: "--cone-larch", spread: 0.04 }))} d="${capsD}"/><path class="ink hair" d="${capsD}"/>`,
  );
}

export function labradortea(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Six branching rusty-woolly stems forming an evergreen bog-shrub mound.
  const branches: [Pt, Pt, Pt, boolean][] = [
    [at([-24, 0]), at([-74, -95]), at([-118, -198]), true],
    [at([-12, 0]), at([-38, -125]), at([-58, -252]), true],
    [at([-4, 0]), at([-6, -110]), at([-10, -218]), false],
    [at([6, 0]), at([28, -130]), at([48, -262]), true],
    [at([16, 0]), at([64, -108]), at([104, -216]), true],
    [at([24, 0]), at([84, -76]), at([134, -154]), false],
  ];
  branches.forEach(([p0, p1, p2, flowers], bIdx) => {
    const g: [number, number] = [0.06 + bIdx * 0.014, 0.17 + bIdx * 0.014];
    const st = grow(out, g[0], g[1], () =>
      limb(out, r, [p0, p1, p2], { w0: 7.5, w1: 3.8, cap: "blunt", ...RUST_TWIG }),
    );
    const n = st.n;
    // Spreading spring/summer/autumn leaves (0.18..0.80, fade) and steeply folded-down winter leaves
    // (0.76..1.0) showing their rust-orange felted undersides.
    for (let i = Math.round(n * 0.24), s = bIdx % 2 ? 1 : -1; i <= n - 1; i += 4, s = -s) {
      const p = st.pts[i];
      const u = i / n;
      const tang = angleOf(st.pts, i);
      const spreadDir = tang + s * rad(54 - u * 14);
      const len = 34 + (1 - u * 0.25) * 12;
      const showBack = i % 3 === 0;
      const gLeaf = Math.min(0.32, Math.max(gate(st, g, i) + 0.025, 0.19 + u * 0.09));
      part(
        out,
        gLeaf,
        p,
        () => labradorLeaf(out, r, p, spreadDir, len, showBack),
        0.8 + (i % 3) * 0.01,
        true,
      );
      // Winter frost position (0.76..1.0): leaves hang steeply downward parallel to the stem, showing rust-woolly backs.
      const winterDir = rad(90) + s * rad(14 + (i % 3) * 5);
      part(out, 0.76 + (i % 3) * 0.01, p, () => labradorLeaf(out, r, p, winterDir, len * 0.94, true));
    }

    const tip = st.pts[n];
    if (flowers) {
      const gFl = Math.max(gate(st, g, n) + 0.02, 0.34 + bIdx * 0.006);
      part(out, gFl, tip, () => labradorCorymb(out, r, tip, 42 + r() * 6), 0.6);
      part(out, 0.58 + bIdx * 0.006, tip, () => labradorCapsules(out, r, tip, 30));
    }
  });
}

export function labradorteaDetail(out: Out, r: Rng) {
  const twig = limb(out, r, [[-20, 175], [-6, 65], [0, -35]], {
    w0: 12,
    w1: 6.5,
    cap: "blunt",
    ...RUST_TWIG,
  });
  for (const [u, deg, rust] of [
    [0.24, -148, true],
    [0.34, -32, false],
    [0.52, -142, false],
    [0.64, -36, true],
    [0.8, -136, true],
    [0.86, -42, false],
  ] as const) {
    const p = twig.pts[Math.round(twig.n * u)];
    labradorLeaf(out, r, p, rad(deg), 88, rust);
  }
  labradorCorymb(out, r, twig.pts[twig.n], 96);
}

// ===========================================================================
// 9. Wood horsetail (Equisetum sylvaticum): jointed hollow stems (leave: 0.84 so they die back
// in winter) ringed with reddish-brown nodal sheaths (--sheath-horsetail), spring pale fertile
// stems with terminal brown spore cones (0.24..0.42), and tiered lacy horizontal pagodas of
// compound drooping green branch whorls (0.20..0.82, turning straw-tan via --pl-horsetail-autumn).
// ===========================================================================

const horsetailDies = 0.84;

// Loose papery nodal sheath green at the base and reddish-brown (--sheath-horsetail) above,
// fused into 3–4 broad blunt lobes/teeth.
function horsetailSheath(out: Out, r: Rng, P: Pt, w: number, h: number) {
  const pts: Pt[] = [
    [P[0] - w * 0.55, P[1]],
    [P[0] - w * 0.68, P[1] - h * 0.68],
    [P[0] - w * 0.42, P[1] - h],
    [P[0] - w * 0.16, P[1] - h * 0.72],
    [P[0], P[1] - h * 1.04],
    [P[0] + w * 0.16, P[1] - h * 0.72],
    [P[0] + w * 0.42, P[1] - h],
    [P[0] + w * 0.68, P[1] - h * 0.68],
    [P[0] + w * 0.55, P[1]],
  ];
  shape(out, r, pts, tone(r, { pc: "--sheath-horsetail", spread: 0.04, hue: 6 }), { deep: 0.3, ink: false });
  out.push(`<path class="ink hair" d="${closed(pts)}"/>`);
}

// One tiered lacy horizontal umbrella of 2-pinnate compound drooping branchlets at a node.
function horsetailWhorl(out: Out, r: Rng, P: Pt, span: number, droop: number) {
  // Soft umbrella wash so field() captures the pagoda tier and autumn straw-tan turning shows clearly.
  const umbrella: Pt[] = [
    add(P, [-span * 0.92, droop * 0.95]),
    add(P, [-span * 0.55, -droop * 0.28]),
    add(P, [0, -droop * 0.36]),
    add(P, [span * 0.55, -droop * 0.28]),
    add(P, [span * 0.92, droop * 0.95]),
    add(P, [span * 0.38, droop * 0.45]),
    add(P, [0, droop * 0.2]),
    add(P, [-span * 0.38, droop * 0.45]),
  ];
  shape(out, r, umbrella, tone(r, { dl: 0.02, spread: 0.05, hue: 8 }), { deep: 0, ink: false });

  let branches = "";
  let pinnules = "";
  const rays = 9;
  for (let k = 0; k < rays; k++) {
    const u = (k / (rays - 1)) * 2 - 1; // -1 left to +1 right
    const s = Math.sign(u || 1);
    const reach = span * (0.35 + 0.65 * Math.abs(u) ** 0.75);
    const ctrl = add(P, [u * span * 0.48, -droop * 0.35 * (1 - Math.abs(u) * 0.3)]);
    const tip = add(P, [s * reach, droop * (0.45 + 0.55 * Math.abs(u))]);
    branches += `M${P1(P)}Q${P1(ctrl)} ${P1(tip)}`;
    // Secondary compound branchlets (2-pinnate) drooping gracefully from each lateral branch!
    for (const q of [0.42, 0.72]) {
      const m = quad(P, ctrl, tip)(q);
      const subTip1 = add(m, [s * span * 0.14, droop * 0.48]);
      const subTip2 = add(m, [s * span * 0.06, droop * 0.56]);
      pinnules += `M${P1(m)}L${P1(subTip1)}M${P1(m)}L${P1(subTip2)}`;
    }
  }
  out.push(
    `<path class="wash needles"${vars(tone(r, { spread: 0.05, hue: 8 }))} d="${branches}${pinnules}"/><path class="ink hair" d="${branches}"/>`,
  );
}

// Terminal blunt ovoid brown spore cone (strobilus) on a spring fertile stem.
function horsetailCone(out: Out, r: Rng, T: Pt, H: number) {
  const C = add(T, [0, -H * 0.52]);
  const body = roundPts(C, H * 0.34, H * 0.52, 0, 12);
  shape(out, r, body, tone(r, { pc: "--sheath-horsetail", spread: 0.04, hue: 6 }), {
    deep: 0.45,
    cls: "wash fruit",
  });
  let grid = "";
  for (const dy of [-0.28, -0.08, 0.12, 0.3]) {
    const y = C[1] + dy * H;
    const hw = H * 0.3 * Math.sqrt(Math.max(0.1, 1 - (dy / 0.48) ** 2));
    grid += `M${P1([C[0] - hw, y])}L${P1([C[0] + hw, y])}`;
  }
  for (const dx of [-0.14, 0, 0.14]) {
    grid += `M${P1([C[0] + dx * H, C[1] - H * 0.42])}L${P1([C[0] + dx * H, C[1] + H * 0.42])}`;
  }
  out.push(`<path class="ink hair" d="${grid}"/>`);
}

export function horsetail(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Five jointed hollow stems (two with spring terminal strobili) that die back at 0.84.
  const culms: [number, number, number, boolean][] = [
    [-72, 285, -6, false],
    [-28, 365, -3, true],
    [14, 395, 2, false],
    [54, 335, 5, true],
    [88, 255, 8, false],
  ];
  culms.forEach(([dx, H, lean, fertile], cIdx) => {
    const B = at([dx, 0]);
    const nodes = 8;
    const spine = sample((t) => add(B, [lean * t, -H * t]), nodes);
    const g: [number, number] = [0.07 + cIdx * 0.015, 0.19 + cIdx * 0.015];
    const stem = grow(
      out,
      g[0],
      g[1],
      () => {
        const st = stalk(
          out,
          (t) => spine[Math.round(t * nodes)],
          6.5,
          2.6,
          tone(r, fertile ? { pc: "--pl-horsetail-autumn", spread: 0.03 } : { spread: 0.04 }),
          nodes,
        );
        for (let i = 1; i < nodes; i++) {
          const w = 6.5 - (i / nodes) * 3.8;
          horsetailSheath(out, r, spine[i], w + 2.2, 9 + (1 - i / nodes) * 4);
        }
        return { ...st, pts: spine, n: nodes };
      },
      horsetailDies,
    );

    // Spring terminal spore cone on fertile stems (gated after stem tip..0.42, fade).
    if (fertile) {
      const top = stem.pts[nodes];
      const gCone = Math.max(gate(stem, g, nodes) + 0.015, 0.24 + cIdx * 0.008);
      part(out, gCone, top, () => horsetailCone(out, r, top, 32), 0.42, true);
    }

    // Tiered lacy horizontal pagodas of compound drooping green branch whorls (0.20..0.82 <= horsetailDies).
    for (let i = 2; i <= nodes - (fertile ? 1 : 0); i++) {
      const p = stem.pts[i];
      const u = (i - 1.5) / (nodes - 1);
      // Pagoda taper: widest in the middle tiers, tapering gracefully toward the apex.
      const span = (68 * Math.sin(Math.PI * Math.min(0.95, u * 0.88 + 0.12)) + 16) * (H / 365);
      const droop = 18 + (1 - u) * 12;
      const gWhorl = Math.min(0.34, Math.max(gate(stem, g, i) + 0.015, 0.2 + u * 0.1));
      part(
        out,
        gWhorl,
        p,
        () => horsetailWhorl(out, r, p, span, droop),
        0.81 + (i % 3) * 0.008,
      );
    }
  });
}

export function horsetailDetail(out: Out, r: Rng) {
  const spine = sample((t) => [-20, 175 - t * 320], 6);
  stalk(out, (t) => spine[Math.round(t * 6)], 11, 5.5, tone(r, { spread: 0.03 }), 6);
  for (const [i, span, droop] of [
    [1, 30, 12],
    [2, 118, 34],
    [3, 108, 30],
    [4, 88, 26],
    [5, 62, 20],
  ] as const) {
    horsetailSheath(out, r, spine[i], 14 - i * 1.1, 18 - i);
    if (i >= 2) horsetailWhorl(out, r, spine[i], span, droop);
  }
  // Companion fertile stem apex with spore cone on the right.
  const fSpine = sample((t) => [95, 175 - t * 235], 4);
  stalk(out, (t) => fSpine[Math.round(t * 4)], 10, 6.5, tone(r, { pc: "--pl-horsetail-autumn", spread: 0.03 }), 4);
  for (const i of [1, 2, 3]) horsetailSheath(out, r, fSpine[i], 13 - i, 17);
  horsetailCone(out, r, fSpine[4], 62);
}

// ===========================================================================
// 10. Lingonberry (Vaccinium vitis-idaea): low evergreen dwarf clumps of glossy oval leathery
// leaves (staying all year), terminal nodding racemes of pale-pink urn bells (--flower-lingon,
// 0.30..0.54), and dense clusters of glossy scarlet-red berries (--berry-lingon, 0.56..1.0)
// persisting all winter.
// ===========================================================================

// Glossy leathery obovate-elliptic leaf with rounded/slightly notched tip; underside pale green
// dotted with dark-brown sessile glands.
export function lingonLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number, underside = false) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const w = L * 0.28;
  // Obovate outline: narrower cuneate base, broadest past the middle, slightly notched/retuse apex.
  const pts: Pt[] = [
    [0, 0],
    [L * 0.25, -w * 0.68],
    [L * 0.64, -w],
    [L * 0.92, -w * 0.66],
    [L * 1.0, -w * 0.2],
    [L * 0.96, 0],
    [L * 1.0, w * 0.2],
    [L * 0.92, w * 0.66],
    [L * 0.64, w],
    [L * 0.25, w * 0.68],
  ].map(toW);

  if (underside) {
    shape(out, r, pts, tone(r, { dl: 0.14, dc: 0.72, spread: 0.04, hue: 6 }), { deep: 0.25, ink: false });
    let glands = `M${P1(O)}L${P1(toW([L * 0.9, 0]))}`;
    for (const [gx, gy] of [
      [0.32, -0.35],
      [0.48, 0.42],
      [0.58, -0.48],
      [0.72, 0.38],
      [0.78, -0.28],
    ] as const) {
      const gp = toW([gx * L, gy * w]);
      glands += `M${P1(gp)}L${P1([gp[0] + 0.8, gp[1] + 0.8])}`;
    }
    out.push(`<path class="ink hair" d="${closed(pts)}${glands}"/>`);
  } else {
    shape(out, r, pts, tone(r, { spread: 0.05, hue: 8 }), {
      deep: 0.45,
      deepAbout: toW([L * 0.55, w * 0.2]),
      ink: false,
    });
    out.push(glint(toW([L * 0.58, -w * 0.36]), L * 0.18, w * 0.22, dir));
    out.push(`<path class="ink hair" d="${closed(pts)}M${P1(O)}L${P1(toW([L * 0.9, 0]))}"/>`);
  }
}

// Nodding terminal raceme of 4-lobed pale-pink campanulate-urceolate bells (--flower-lingon)
// with slightly exserted styles.
export function lingonRaceme(out: Out, r: Rng, T: Pt, side: number, scale = 1) {
  const arch = sample(quad(T, add(T, [side * 16 * scale, -10 * scale]), add(T, [side * 34 * scale, 8 * scale])), 5);
  let stalksD = line(arch);
  let bellsD = "";
  let stylesD = "";
  for (let i = 1; i <= 5; i++) {
    const p = arch[i];
    const bC = add(p, [side * 2 * scale, 9 * scale]);
    stalksD += `M${P1(p)}L${P1(add(bC, [0, -5 * scale]))}`;
    const s = (7.5 - i * 0.4) * scale;
    const toB = (x: number, y: number): Pt => add(bC, [x * s, y * s]);
    bellsD += closed([
      toB(-0.42, -0.7),
      toB(-0.78, -0.15),
      toB(-0.62, 0.55),
      toB(-0.82, 0.85),
      toB(-0.32, 0.68),
      toB(0, 0.88),
      toB(0.32, 0.68),
      toB(0.82, 0.85),
      toB(0.62, 0.55),
      toB(0.78, -0.15),
      toB(0.42, -0.7),
    ]);
    stylesD += `M${P1(toB(0, 0.75))}L${P1(toB(0, 1.35))}`;
  }
  out.push(
    `<path class="ink hair" d="${stalksD}"/><path class="wash petal"${vars(tone(r, { pc: "--flower-lingon", spread: 0.03 }))} d="${bellsD}"/><path class="ink hair petal-edge" d="${bellsD}"/><path class="ink hair" style="stroke:var(--berry-lingon)" d="${stylesD}"/>`,
  );
}

// Dense terminal cluster of globose glossy scarlet-red berries (--berry-lingon) with 4-parted apical calyx.
export function lingonBerries(out: Out, r: Rng, T: Pt, side: number, scale = 1) {
  const offsets: [number, number, number][] = [
    [side * 6, -12, 9.5],
    [side * 18, -8, 10.2],
    [side * 12, 3, 10.6],
    [side * 26, 1, 9.8],
    [side * 4, 8, 9.4],
    [side * 20, 12, 9.2],
  ];
  let crowns = "";
  for (const [dx, dy, radB] of offsets) {
    const C = add(T, [dx * scale, dy * scale]);
    const R = radB * scale;
    shape(
      out,
      r,
      roundPts(C, R, R * 0.96, 0, 10),
      tone(r, { pc: "--berry-lingon", spread: 0.04, hue: 6 }),
      { deep: 0.48, deepAbout: add(C, [R * 0.22, R * 0.26]), cls: "wash fruit" },
    );
    out.push(glint(add(C, [-R * 0.28, -R * 0.28]), R * 0.26, R * 0.18, -0.4));
    const cr = add(C, [side * R * 0.35, R * 0.32]);
    crowns += `M${P1(add(cr, [-2 * scale, -1 * scale]))}L${P1(add(cr, [2 * scale, 1 * scale]))}M${P1(add(cr, [-1 * scale, 2 * scale]))}L${P1(add(cr, [1 * scale, -2 * scale]))}`;
  }
  out.push(`<path class="ink hair" d="${crowns}"/>`);
}

export function lingonberry(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Seven low evergreen dwarf stems rising in a compact colonial clump.
  const stems: [number, Pt, Pt, number][] = [
    [-78, [-96, -68], [-118, -138], -1],
    [-46, [-58, -86], [-72, -168], -1],
    [-16, [-22, -98], [-28, -192], -1],
    [10, [14, -102], [18, -196], 1],
    [38, [48, -88], [62, -172], 1],
    [66, [82, -74], [104, -146], 1],
    [88, [106, -54], [128, -108], 1],
  ];
  stems.forEach(([x0, ctrl, tip, side], sIdx) => {
    const g: [number, number] = [0.06 + sIdx * 0.012, 0.16 + sIdx * 0.012];
    const st = grow(out, g[0], g[1], () =>
      limb(out, r, [at([x0, 0]), at(ctrl), at(tip)], { w0: 5.2, w1: 2.6, cap: "taper", pc: "--bark-spruce" }),
    );
    const n = st.n;
    // Crowded alternate glossy oval evergreen leaves staying all year.
    for (let i = 3, sg = sIdx % 2 ? 1 : -1; i <= n - 1; i += 3, sg = -sg) {
      const p = st.pts[i];
      const u = i / n;
      const tang = angleOf(st.pts, i);
      const leafDir = tang + sg * rad(46 - u * 10);
      const under = i % 6 === 0;
      const gLeaf = Math.min(0.32, Math.max(gate(st, g, i) + 0.015, 0.16 + u * 0.1));
      part(out, gLeaf, p, () => lingonLeaf(out, r, p, leafDir, 28 + (1 - u * 0.2) * 8, under));
    }
    const top = st.pts[n];
    // Nodding pale-pink urn racemes in late spring (0.30..0.54), then scarlet berry clusters (0.54..1.0).
    if (sIdx >= 1 && sIdx <= 5) {
      const gRac = Math.max(gate(st, g, n) + 0.02, 0.3 + sIdx * 0.008);
      part(out, gRac, top, () => lingonRaceme(out, r, top, side, 1), 0.54);
      part(out, 0.54 + sIdx * 0.008, top, () => lingonBerries(out, r, top, side, 1));
    }
  });
}

export function lingonberryDetail(out: Out, r: Rng) {
  const stL = limb(out, r, [[-65, 165], [-72, 45], [-68, -55]], {
    w0: 8,
    w1: 4.5,
    cap: "taper",
    pc: "--bark-spruce",
  });
  const stR = limb(out, r, [[45, 165], [52, 45], [48, -55]], {
    w0: 8,
    w1: 4.5,
    cap: "taper",
    pc: "--bark-spruce",
  });
  for (const [st, shift] of [
    [stL, 0],
    [stR, 1],
  ] as const) {
    for (const [u, sg, under] of [
      [0.24, -1, false],
      [0.42, 1, shift === 1],
      [0.62, -1, shift === 0],
      [0.82, 1, false],
    ] as const) {
      const i = Math.round(st.n * u);
      const p = st.pts[i];
      lingonLeaf(out, r, p, angleOf(st.pts, i) + sg * rad(48), 58, under);
    }
  }
  lingonRaceme(out, r, stL.pts[stL.n], -1, 1.85);
  lingonBerries(out, r, stR.pts[stR.n], 1, 1.9);
}

// ===========================================================================
// 11. Cloudberry (Rubus chamaemorus): low stems (leave: 0.86) with pleated 5–7-lobed kidney
// leaves (0.18..0.82, turning burgundy-bronze via --pl-cloudberry-autumn), a solitary white
// 5-petalled flower per stem (--flower-labrador, 0.28..0.46), a plump aggregate berry ripening
// from ruby-red (--berry-cloud-unripe, 0.44..0.56, fade) to golden-amber (--berry-cloud,
// 0.52..0.74), and persistent spreading star calyxes (0.44..0.85).
// ===========================================================================

const cloudberryDies = 0.86;
const cloudberryShed = fallsAt(0.77, 0.045);

const CLOUD_LOBES: [number, number][] = [
  [0, 0.94],
  [rad(-44), 0.98],
  [rad(44), 0.98],
  [rad(-92), 0.92],
  [rad(92), 0.92],
  [rad(-134), 0.72],
  [rad(134), 0.72],
];

// Pleated (rugose) reniform-orbicular 5–7-lobed kidney leaf with rounded serrate lobes.
export function cloudberryLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  palmate(out, r, O, dir, L, {
    lobes: CLOUD_LOBES,
    sigma: 0.38,
    power: 2.2,
    teeth: 0.032,
    toothCount: 72,
    core: 0.58,
    deep: 0.45,
    v: tone(r, { spread: 0.06, hue: 8 }),
    hairline: true,
  });
}

// Solitary erect 5-petalled white flower (--flower-labrador) with broad obovate petals and golden stamens.
export function cloudberryFlower(out: Out, r: Rng, C: Pt, R: number) {
  let petals = "";
  const spin = -rad(90);
  for (let k = 0; k < 5; k++) {
    const a = spin + (k / 5) * TAU;
    petals += closed(roundPts(add(C, polar(R * 0.54, a)), R * 0.48, R * 0.38, a, 9));
  }
  out.push(
    `<path class="wash petal"${vars(tone(r, { pc: "--flower-labrador", spread: 0.03 }))} d="${petals}"/><path class="ink hair petal-edge" d="${petals}"/>`,
  );
  let stamens = "";
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    stamens += `M${P1(C)}L${P1(add(C, polar(R * 0.28, a)))}`;
  }
  out.push(
    `<path class="ink hair" style="stroke:var(--berry-cloud)" d="${stamens}"/><path class="wash"${vars(tone(r, { pc: "--berry-cloud", spread: 0.03 }))} d="${closed(roundPts(C, R * 0.18, R * 0.18, 0, 7))}"/>`,
  );
}

// Persistent 5-pointed spreading star calyx cradling or outlasting the berry.
function cloudberryCalyx(out: Out, r: Rng, C: Pt, R: number, pc?: string) {
  let sepals = "";
  for (const deg of [-158, -124, -90, -56, -22, 12, 168]) {
    const a = rad(deg);
    const tip = add(C, polar(R, a));
    const nrm = polar(R * 0.18, a + rad(90));
    sepals += closed([C, add(lerp(C, tip, 0.45), nrm), tip, sub(lerp(C, tip, 0.45), nrm)]);
  }
  out.push(
    `<path class="wash"${vars(tone(r, { pc, dl: -0.04, spread: 0.04 }))} d="${sepals}"/><path class="ink hair" d="${sepals}"/>`,
  );
}

// Plump hemispherical aggregate berry of 10 large jewel-like drupelets (ruby-red unripe or golden-amber ripe).
export function cloudberryFruit(out: Out, r: Rng, C: Pt, R: number, pc: string) {
  // Back tier, middle tier, and front tier of large plump drupelets.
  const drupelets: [number, number, number][] = [
    [-0.46, -0.58, 0.34],
    [0, -0.68, 0.36],
    [0.46, -0.58, 0.34],
    [-0.64, -0.22, 0.35],
    [-0.22, -0.28, 0.38],
    [0.22, -0.28, 0.38],
    [0.64, -0.22, 0.35],
    [-0.42, 0.1, 0.34],
    [0, 0.14, 0.36],
    [0.42, 0.1, 0.34],
  ];
  for (const [dx, dy, dr] of drupelets) {
    const dc = add(C, [dx * R, dy * R]);
    const rr = dr * R;
    shape(
      out,
      r,
      roundPts(dc, rr, rr * 0.94, 0, 8),
      tone(r, { pc, spread: 0.04, hue: 6 }),
      { deep: 0.42, deepAbout: add(dc, [rr * 0.2, rr * 0.25]), cls: "wash fruit" },
    );
    out.push(glint(add(dc, [-rr * 0.28, -rr * 0.28]), rr * 0.28, rr * 0.2));
  }
}

export function cloudberry(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Four low erect unbranched stems (leave: 0.86), each with 2 pleated kidney leaves and a single terminal flower/berry.
  const shoots: [number, number, number][] = [
    [-78, 148, -6],
    [-24, 182, -2],
    [28, 174, 3],
    [76, 142, 6],
  ];
  shoots.forEach(([dx, H, lean], sIdx) => {
    const B = at([dx, 0]);
    const spine = sample((t) => add(B, [lean * t, -H * t]), 8);
    const g: [number, number] = [0.07 + sIdx * 0.016, 0.19 + sIdx * 0.016];
    const stem = grow(
      out,
      g[0],
      g[1],
      () => ({
        ...stalk(out, (t) => spine[Math.round(t * 8)], 4.8, 2.8, tone(r, { pc: "--bark-spruce", spread: 0.03 }), 8),
        pts: spine,
        n: 8,
      }),
      cloudberryDies,
    );

    // Two alternate long-petioled pleated 5–7-lobed kidney leaves per stem (0.18..cloudberryShed <= 0.82).
    for (const [u, side, lSz] of [
      [0.38, -1, 34],
      [0.66, 1, 31],
    ] as const) {
      const i = Math.round(8 * u);
      const p = stem.pts[i];
      const petDir = rad(-90 + side * 46);
      const leafC = add(p, polar(22, petDir));
      const gLeaf = Math.min(0.32, Math.max(gate(stem, g, i) + 0.015, 0.18 + sIdx * 0.012 + u * 0.06));
      part(
        out,
        gLeaf,
        p,
        () => {
          stalk(out, quad(p, add(lerp(p, leafC, 0.5), [0, -3]), leafC), 2.4, 1.5, { pc: "--bark-spruce" }, 4);
          cloudberryLeaf(out, r, leafC, petDir + side * rad(14), lSz);
        },
        cloudberryShed(p),
      );
    }

    const top = stem.pts[8];
    // Solitary white 5-petalled flower (0.28..0.46), persistent star calyx (0.44..0.85),
    // ruby-red unripe berry (0.44..0.56, fade), and golden-amber ripe berry (0.52..0.74).
    const gFl = Math.max(gate(stem, g, 8) + 0.02, 0.28 + sIdx * 0.008);
    part(out, gFl, top, () => cloudberryFlower(out, r, add(top, [0, -6]), 26), 0.46);
    part(out, 0.44 + sIdx * 0.006, top, () => cloudberryCalyx(out, r, top, 21), 0.85);
    part(
      out,
      0.44 + sIdx * 0.006,
      top,
      () => cloudberryFruit(out, r, add(top, [0, -5]), 19, "--berry-cloud-unripe"),
      0.56,
      true,
    );
    part(
      out,
      0.52 + sIdx * 0.006,
      top,
      () => cloudberryFruit(out, r, add(top, [0, -6]), 22, "--berry-cloud"),
      0.74,
    );
  });

  // Low dry winter stems and persistent dry calyx husks (0.85..1.0).
  for (const [dx, H] of [
    [-24, 132],
    [28, 126],
  ] as const) {
    const B = at([dx, 0]);
    const top = add(B, [4, -H]);
    part(out, 0.85, B, () => {
      stalk(out, quad(B, lerp(B, top, 0.5), top), 3.6, 2.2, tone(r, { pc: "--cone-larch", spread: 0.03 }), 5);
      cloudberryCalyx(out, r, top, 18, "--cone-larch");
    });
  }
}

export function cloudberryDetail(out: Out, r: Rng) {
  stalk(out, quad([-55, 165], [-62, 70], [-58, -15]), 6, 3.8, tone(r, { pc: "--bark-spruce" }), 8);
  stalk(out, quad([55, 165], [62, 70], [58, -15]), 6, 3.8, tone(r, { pc: "--bark-spruce" }), 8);
  cloudberryLeaf(out, r, [-92, 65], rad(-138), 72);
  cloudberryLeaf(out, r, [92, 65], rad(-42), 72);
  cloudberryFlower(out, r, [-58, -28], 58);
  cloudberryCalyx(out, r, [58, -15], 48);
  cloudberryFruit(out, r, [58, -28], 48, "--berry-cloud");
}

// ===========================================================================
// 12. Twinflower (Linnaea borealis): creeping woody stolons with opposite evergreen rounded
// crenate leaf pairs hugging the floor all year, sending up slender erect stalks (0.26..0.72)
// forked at the top into a pair of nodding pale-pink trumpet bells (--flower-twin, 0.35..0.66).
// ===========================================================================

// Opposite pair of small orbicular-oval evergreen leaves with 2 pairs of shallow rounded crenate teeth.
export function twinLeafPair(out: Out, r: Rng, N: Pt, stolonA: number, L: number) {
  const goRight = Math.cos(stolonA) >= 0;
  for (const dir of [
    goRight ? rad(-55) : rad(-125),
    goRight ? rad(-125) : rad(-55),
  ]) {
    const O = add(N, polar(4.5, dir));
    out.push(`<path class="ink hair" d="M${P1(N)}L${P1(O)}"/>`);
    const toW = (p: Pt) => add(O, rot(p, dir));
    const w = L * 0.42;
    const pts: Pt[] = [
      [0, 0],
      [L * 0.22, -w * 0.72],
      [L * 0.38, -w * 0.98],
      [L * 0.52, -w * 0.84],
      [L * 0.68, -w * 0.96],
      [L * 0.88, -w * 0.64],
      [L * 1.0, 0],
      [L * 0.88, w * 0.64],
      [L * 0.68, w * 0.96],
      [L * 0.52, w * 0.84],
      [L * 0.38, w * 0.98],
      [L * 0.22, w * 0.72],
    ].map(toW);
    shape(out, r, pts, tone(r, { spread: 0.05, hue: 8 }), { deep: 0.4, ink: false });
    out.push(`<path class="ink hair" d="${closed(pts)}M${P1(O)}L${P1(toW([L * 0.86, 0]))}"/>`);
  }
}

// A single nodding funnelform-campanulate 5-lobed pale-pink trumpet bell (--flower-twin), deeper
// rose inside the throat, hanging from a short pedicel with two tiny calyx bracts.
export function twinBell(out: Out, r: Rng, P: Pt, side: number, L: number) {
  const dir = rad(90) + side * rad(26);
  const toW = (x: number, y: number): Pt => add(P, rot([x * L, y * L], dir - rad(90)));
  // Tiny green calyx teeth at the base of the nodding bell.
  const cal: Pt[] = [toW(-0.14, 0.16), toW(0, -0.06), toW(0.14, 0.16)];
  out.push(`<path class="wash"${vars(tone(r, { dl: -0.06 }))} d="${closed(cal)}"/>`);

  // Flared 5-lobed trumpet bell silhouette.
  const bell: Pt[] = [
    toW(-0.1, 0.06),
    toW(-0.22, 0.42),
    toW(-0.46, 0.84),
    toW(-0.56, 1.02),
    toW(-0.28, 0.94),
    toW(-0.14, 1.06),
    toW(0, 0.95),
    toW(0.14, 1.06),
    toW(0.28, 0.94),
    toW(0.56, 1.02),
    toW(0.46, 0.84),
    toW(0.22, 0.42),
    toW(0.1, 0.06),
  ];
  shape(
    out,
    r,
    bell,
    tone(r, { pc: "--flower-twin", spread: 0.03, hue: 6 }),
    { deep: 0.35, deepAbout: toW(0, 0.55), ink: false, cls: "wash petal" },
  );
  // Deeper rose-pink interior throat flush.
  const throat = roundPts(toW(0, 0.92), L * 0.32, L * 0.11, dir - rad(90), 8);
  out.push(
    `<path class="wash lilac-flush deep"${vars(tone(r, { pc: "--flower-fireweed", spread: 0.03 }))} d="${closed(throat)}"/><path class="ink hair petal-edge" d="${closed(bell)}"/>`,
  );
}

// Erect thread-like stalk rising vertically and forking at the apex into a Y bearing a twin pair
// of nodding pale-pink trumpet bells.
function twinStalk(out: Out, r: Rng, B: Pt, H: number, bellSize: number, g0: number) {
  const stalkLeavesAt = 0.72;
  const fork = add(B, [0, -H]);
  const spine = sample((t) => add(B, [Math.sin(t * Math.PI) * 2.5, -H * t]), 8);
  const g1 = g0 + 0.07;
  const st = grow(
    out,
    g0,
    g1,
    () => ({
      ...stalk(out, (t) => spine[Math.round(t * 8)], 2.4, 1.5, tone(r, { pc: "--twig-birch", spread: 0.03 }), 8),
      pts: spine,
      n: 8,
    }),
    stalkLeavesAt,
  );
  part(
    out,
    gate(st, [g0, g1], 8) + 0.015,
    fork,
    () => {
      const pL = add(fork, [-14, -12]);
      const pR = add(fork, [14, -12]);
      const dL = add(pL, [-4, 10]);
      const dR = add(pR, [4, 10]);
      out.push(
        `<path class="ink thin" style="stroke:var(--twig-birch)" d="M${P1(fork)}Q${P1(pL)} ${P1(dL)}M${P1(fork)}Q${P1(pR)} ${P1(dR)}"/>`,
      );
      twinBell(out, r, dL, -1, bellSize);
      twinBell(out, r, dR, 1, bellSize);
    },
    0.66,
  );
}

export function twinflower(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Two creeping woody stolons trailing left and right across the foreground floor.
  const gStolonL: [number, number] = [0.06, 0.22];
  const stolonL = grow(out, gStolonL[0], gStolonL[1], () =>
    limb(
      out,
      r,
      [at([12, 0]), at([-45, -18]), at([-108, -14]), at([-168, -22])],
      { w0: 4.2, w1: 2.4, cap: "taper", pc: "--twig-birch" },
    ),
  );
  const gStolonR: [number, number] = [0.07, 0.23];
  const stolonR = grow(out, gStolonR[0], gStolonR[1], () =>
    limb(
      out,
      r,
      [at([-12, 0]), at([48, -16]), at([112, -22]), at([172, -16])],
      { w0: 4.2, w1: 2.4, cap: "taper", pc: "--twig-birch" },
    ),
  );

  // Opposite evergreen rounded crenate leaf pairs along both stolons all year.
  for (const [st, gSt] of [
    [stolonL, gStolonL],
    [stolonR, gStolonR],
  ] as const) {
    for (let i = 3; i <= st.n - 2; i += 5) {
      const p = st.pts[i];
      const a = angleOf(st.pts, i);
      part(out, gate(st, gSt, i) + 0.015, p, () => twinLeafPair(out, r, p, a, 22 + r() * 4));
    }
  }

  // Four slender erect stalks rising in late spring/summer (0.26..0.72), each forked at the top into paired nodding bells.
  const scapes: [{ res: Limb; g: number[] }, number, number, number][] = [
    [{ res: stolonL, g: gStolonL }, 0.72, 126, 26],
    [{ res: stolonL, g: gStolonL }, 0.34, 152, 29],
    [{ res: stolonR, g: gStolonR }, 0.36, 146, 28],
    [{ res: stolonR, g: gStolonR }, 0.74, 122, 25],
  ];
  scapes.forEach(([st, u, H, bellSz], k) => {
    const i = Math.round(st.res.n * u);
    const nodeP = st.res.pts[i];
    const g0 = Math.max(gate(st.res, st.g, i) + 0.02, 0.26 + k * 0.012);
    twinStalk(out, r, nodeP, H, bellSz, g0);
  });
}

export function twinflowerDetail(out: Out, r: Rng) {
  const stolon = limb(out, r, [[-155, 145], [-45, 136], [65, 142], [155, 134]], {
    w0: 6.5,
    w1: 4,
    cap: "taper",
    pc: "--twig-birch",
  });
  for (const u of [0.16, 0.38, 0.62, 0.84]) {
    const i = Math.round(stolon.n * u);
    twinLeafPair(out, r, stolon.pts[i], angleOf(stolon.pts, i), 42);
  }
  const B = stolon.pts[Math.round(stolon.n * 0.5)];
  const fork: Pt = [B[0], -85];
  stalk(out, (t) => lerp(B, fork, t), 4.5, 3, tone(r, { pc: "--twig-birch" }), 8);
  const pL: Pt = [fork[0] - 32, fork[1] - 26];
  const pR: Pt = [fork[0] + 32, fork[1] - 26];
  const dL: Pt = [pL[0] - 10, pL[1] + 24];
  const dR: Pt = [pR[0] + 10, pR[1] + 24];
  out.push(
    `<path class="ink mid" style="stroke:var(--twig-birch)" d="M${P1(fork)}Q${P1(pL)} ${P1(dL)}M${P1(fork)}Q${P1(pR)} ${P1(dR)}"/>`,
  );
  twinBell(out, r, dL, -1, 66);
  twinBell(out, r, dR, 1, 66);
}
