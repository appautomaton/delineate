// The Namib and Namaqualand garden: the Namibian coast and escarpment to the Richtersveld in
// August–September, when coastal fog and late-winter rain wake forked quiver trees, leaning
// halfmens, waxy butter trees, spiny nara hummocks, and ancient two-leaved welwitschias. Nothing
// hangs from the top: hemiparasitic mistletoe (Tapinanthus oleifolius) grows as a dense haustorial
// bush directly on the ribbed candelabra stems of the gifboom (Euphorbia virosa).

import { rad, P1, add, sub, mul, norm, rot, polar, lerp, wobble, closed, line, sample, vars, tone, shape, stalk, quad, grow, part, along, roundPts, gate } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";
import { limb, angleOf } from "./woody.ts";
import { bladeBunch } from "./mediterranean.ts";

// ---------------------------------------------------------------------------
// 1. Quiver tree / kokerboom (Aloidendron dichotomum): stout tapering trunk plated with golden-brown
// vascular scales and razor fissures, 3 tiers of dichotomous Y-forks into a rounded crown, compact
// terminal rosettes of blue-glaucous boat-shaped leaves over a short dry leaf skirt, and erect
// branched panicles of canary-yellow winter/spring racemes.

export function quiverRosette(out: Out, r: Rng, C: Pt, lean: number, R: number, hasRaceme = true) {
  const toW = (p: Pt) => add(C, rot(p, lean));
  // 1. Short reflexed skirt of dry brown persistent old leaves immediately below the rosette.
  let skirt = "";
  for (let k = 0; k < 7; k++) {
    const u = k / 6 - 0.5;
    const a = lean + Math.PI / 2 + u * rad(110);
    const L = R * (0.48 + (1 - Math.abs(u)) * 0.14);
    const p0 = toW([u * R * 0.24, R * 0.08]);
    const tip = add(p0, polar(L, a + u * 0.2));
    const nrm = polar(L * 0.14, a + Math.PI / 2);
    const mid = lerp(p0, tip, 0.48);
    skirt += closed([add(p0, mul(nrm, 0.7)), add(mid, nrm), tip, sub(mid, nrm), sub(p0, mul(nrm, 0.7))]);
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--strap-welwitschia", dl: -0.04, spread: 0.03 }))} d="${skirt}"/><path class="ink thin" d="${skirt}"/>`);

  // 2. Erect branched panicle of canary-yellow cylindrical racemes rising from the rosette axils
  // (drawn behind the front-most inner rosette blades so the leaves clasp the peduncle base).
  if (hasRaceme) {
    const spikes: [number, number, number][] = [
      [-0.32, 1.18, 0.84],
      [0.02, 1.38, 1.0],
      [0.34, 1.14, 0.82],
    ];
    for (const [da, hMul, sMul] of spikes) {
      const a = lean - Math.PI / 2 + da;
      const baseP = toW([da * R * 0.25, -R * 0.18]);
      const racStart = add(baseP, polar(R * 0.52 * hMul, a));
      const racTip = add(baseP, polar(R * 1.32 * hMul, a));
      stalk(out, quad(baseP, lerp(baseP, racTip, 0.5), racTip), 5.5 * sMul, 2.5 * sMul, tone(r, { pc: "--bark-butter", dl: -0.06, spread: 0.03 }), 8);
      // Cylindrical bottle-brush raceme of plump canary-yellow tubular flowers and orange stamens.
      let florets = "";
      let stamens = "";
      const rows = 10;
      for (let i = 0; i < rows; i++) {
        const u = i / (rows - 1);
        const ax = lerp(racStart, racTip, u);
        const w = R * 0.22 * sMul * Math.sin(Math.PI * (0.15 + u * 0.78));
        for (const sg of [-1, 0, 1]) {
          const fDir = a + sg * (0.65 - u * 0.25);
          const fC = add(ax, polar(sg * w * 0.55, a + Math.PI / 2));
          florets += closed(roundPts(fC, 8.5 * sMul, 4.2 * sMul, fDir, 6));
          if (u < 0.78 && sg !== 0) {
            const stTip = add(fC, polar(11 * sMul, fDir));
            stamens += `M${P1(fC)}L${P1(stTip)}`;
          }
        }
      }
      out.push(`<path class="wash filament"${vars(tone(r, { pc: "--flower-quiver", spread: 0.04, hue: 6 }))} d="${florets}"/><path class="ink hair" d="${florets}"/>`);
      if (stamens) out.push(`<path class="ink hair" style="stroke:var(--cone-welwitschia)" d="${stamens}"/>`);
    }
  }

  // 3. Compact hemispherical rosette of thick blue-glaucous boat-shaped lance leaves with cream-yellow margins.
  const tiers: [number, number, number, number, number, number][] = [
    // [count, minDeg, maxDeg, lenMul, dl, deep]
    [5, -148, -32, 0.92, -0.04, 0],
    [6, -162, -18, 1.0, 0.01, 0],
    [4, -125, -55, 0.78, 0.05, 0.35],
  ];
  let margins = "";
  for (const [count, d0, d1, lMul, dl, deep] of tiers) {
    for (let k = 0; k < count; k++) {
      const u = k / (count - 1);
      const deg = d0 + u * (d1 - d0) + (r() - 0.5) * 4;
      const a = lean + rad(deg);
      const L = R * lMul * (0.88 + Math.sin(u * Math.PI) * 0.16);
      const W = L * 0.26;
      const p0 = toW([(u - 0.5) * R * 0.32, (0.5 - Math.abs(u - 0.5)) * R * 0.08]);
      const curve = (u - 0.5) * 0.22;
      const mid = add(p0, polar(L * 0.46, a - curve * 0.4));
      const tip = add(p0, polar(L, a + curve));
      const nrm = polar(W * 0.5, a + Math.PI / 2);
      const pts: Pt[] = [
        add(p0, mul(nrm, 0.65)),
        add(mid, nrm),
        tip,
        sub(mid, nrm),
        sub(p0, mul(nrm, 0.65)),
      ];
      shape(out, r, pts, tone(r, { dl: dl + (k % 2 ? 0.02 : -0.02), spread: 0.04, hue: 6 }), {
        deep,
        deepAbout: sub(mid, mul(nrm, 0.4)),
      });
      margins += `M${P1(pts[0])}L${P1(pts[1])}L${P1(pts[2])}`;
    }
  }
  out.push(`<path class="wash band" d="${margins}"/>`);
}

export function quivertreeDetail(out: Out, r: Rng) {
  // Close study: a forked smooth silver-amber branch tip with its blue-glaucous rosette and two
  // canary-yellow racemes.
  const stem = limb(out, r, [[0, 152], [0, 88], [0, 26]], {
    w0: 26,
    w1: 18,
    pc: "--bark-quiver",
    cap: "blunt",
  });
  let rings = "";
  for (let i = 2; i < stem.n - 1; i += 2) {
    const p = stem.pts[i];
    const hw = stem.width(i / stem.n) * 0.42;
    rings += `M${P1([p[0] - hw, p[1]])}Q${P1([p[0], p[1] + 3])} ${P1([p[0] + hw, p[1]])}`;
  }
  out.push(`<path class="ink hair bark-tex" d="${rings}"/>`);
  quiverRosette(out, r, [0, 28], 0, 82, true);
}

export function quivertree(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // 1. Stout tapering bottle-column trunk plated with golden-brown scales and razor fissures.
  const gt: [number, number] = [0, 0.25];
  const trunk = grow(out, gt[0], gt[1], () => {
    const res = limb(out, r, [at([0, 16]), at([-5, -102]), at([3, -218]), at([0, -320])], {
      w0: 128,
      w1: 64,
      pc: "--bark-quiver",
      cap: "blunt",
    });
    // Plated bark scales and horizontal ring fissures along the stout trunk.
    let fissures = "";
    let plates = "";
    for (let i = 2; i < res.n - 1; i += 2) {
      const t = i / res.n;
      const p = res.pts[i];
      const hw = res.width(t) * 0.46;
      fissures += `M${P1([p[0] - hw, p[1]])}Q${P1([p[0], p[1] + 5])} ${P1([p[0] + hw, p[1]])}`;
      for (const u of [-0.55, -0.18, 0.22, 0.52]) {
        const x0 = p[0] + u * hw;
        fissures += `M${P1([x0, p[1] - 11])}L${P1([x0 + (r() - 0.5) * 3, p[1] + 11])}`;
      }
      if (i % 4 === 0) {
        plates += closed(roundPts([p[0] + (i % 8 === 0 ? -hw * 0.35 : hw * 0.35), p[1]], hw * 0.32, 10, 0, 6));
      }
    }
    out.push(`<path class="wash"${vars(tone(r, { pc: "--bark-butter", dl: -0.04, spread: 0.04 }))} d="${plates}"/>`);
    out.push(`<path class="ink thin bark-tex" d="${fissures}"/>`);
    return res;
  });

  // Helper to grow a dichotomous fork limb from a parent limb's tip.
  const forkLimb = (
    parent: ReturnType<typeof limb>,
    pg: [number, number],
    ctrl: Pt[],
    w0: number,
    w1: number,
    span: number,
  ) => {
    const tipIdx = parent.n;
    const p0 = parent.pts[tipIdx - 2];
    const pTip = parent.pts[tipIdx];
    const g0 = gate(parent, pg, tipIdx - 1);
    const g: [number, number] = [g0, g0 + span];
    const res = grow(out, g[0], g[1], () => {
      const l = limb(out, r, [p0, ...ctrl.map((d) => add(pTip, d))], {
        w0,
        w1,
        pc: "--bark-quiver",
        cap: "blunt",
        inkFrom: 0.14,
      });
      let rings = "";
      for (let i = 3; i < l.n - 1; i += 3) {
        const p = l.pts[i];
        const a = angleOf(l.pts, i) + Math.PI / 2;
        const hw = l.width(i / l.n) * 0.4;
        rings += `M${P1(add(p, polar(-hw, a)))}L${P1(add(p, polar(hw, a)))}`;
      }
      out.push(`<path class="ink hair bark-tex" d="${rings}"/>`);
      return l;
    });
    return { res, g };
  };

  // Tier 1 dichotomous fork (compact, stout primary arms).
  const L1 = forkLimb(trunk, gt, [[-44, -44], [-86, -92]], 50, 34, 0.14);
  const R1 = forkLimb(trunk, gt, [[46, -42], [88, -90]], 50, 34, 0.14);

  // Tier 2 dichotomous forks (6 secondary limbs spanning the crown).
  const L2a = forkLimb(L1.res, L1.g, [[-56, -44], [-114, -92]], 28, 19, 0.13);
  const L2b = forkLimb(L1.res, L1.g, [[-8, -52], [-18, -106]], 26, 18, 0.13);
  const L2c = forkLimb(L1.res, L1.g, [[32, -52], [62, -104]], 25, 17, 0.13);
  const R2a = forkLimb(R1.res, R1.g, [[-32, -52], [-62, -104]], 25, 17, 0.13);
  const R2b = forkLimb(R1.res, R1.g, [[8, -52], [18, -106]], 26, 18, 0.13);
  const R2c = forkLimb(R1.res, R1.g, [[56, -42], [112, -88]], 28, 19, 0.13);

  // Tier 3 terminal dichotomous forks (11 crown tips arranged in a full hemispherical dome).
  const tips = [
    { br: forkLimb(L2a.res, L2a.g, [[-44, -42], [-84, -84]], 16, 12, 0.12), lean: rad(-32), R: 62, rac: false },
    { br: forkLimb(L2a.res, L2a.g, [[4, -48], [10, -96]], 16, 12, 0.12), lean: rad(-20), R: 66, rac: true },
    { br: forkLimb(L2b.res, L2b.g, [[-28, -52], [-54, -104]], 16, 12, 0.12), lean: rad(-14), R: 68, rac: true },
    { br: forkLimb(L2b.res, L2b.g, [[12, -54], [24, -108]], 16, 12, 0.12), lean: rad(-6), R: 70, rac: true },
    { br: forkLimb(L2c.res, L2c.g, [[-14, -56], [-26, -112]], 15, 11, 0.12), lean: rad(-2), R: 72, rac: true },
    { br: forkLimb(L2c.res, L2c.g, [[22, -54], [42, -108]], 15, 11, 0.12), lean: rad(4), R: 70, rac: false },
    { br: forkLimb(R2a.res, R2a.g, [[14, -56], [26, -112]], 15, 11, 0.12), lean: rad(2), R: 72, rac: true },
    { br: forkLimb(R2b.res, R2b.g, [[-12, -54], [-24, -108]], 16, 12, 0.12), lean: rad(8), R: 70, rac: true },
    { br: forkLimb(R2b.res, R2b.g, [[28, -52], [54, -104]], 16, 12, 0.12), lean: rad(15), R: 68, rac: true },
    { br: forkLimb(R2c.res, R2c.g, [[-4, -48], [-10, -96]], 16, 12, 0.12), lean: rad(22), R: 66, rac: true },
    { br: forkLimb(R2c.res, R2c.g, [[44, -40], [84, -82]], 16, 12, 0.12), lean: rad(32), R: 62, rac: false },
  ];

  // Attach each blue-glaucous rosette and canary-yellow raceme cluster at its exact branch tip node.
  for (const { br, lean, R, rac } of tips) {
    const tip = br.res.pts[br.res.n];
    part(out, gate(br.res, br.g, br.res.n) + 0.03, tip, () => quiverRosette(out, r, tip, lean, R, rac));
  }
}

// ---------------------------------------------------------------------------
// 2. Halfmens (Pachypodium namaquanum): unbranched warty silver-grey column tilting 20–30° inward,
// densely armed in spiral rows of 3-spined tubercles (2 long spreading stipular spines + 1 shorter
// central spine), crowned by a tilted crest of strongly undulate velvety leaves and red-throated
// yellow-green tubular flowers.

export function halfmensLeaf(out: Out, r: Rng, O: Pt, dir: number, L: number, dl = 0) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const W = L * 0.36;
  // Strongly undulate / crisped (sinuous-margined) velvety oblong-obovate leaf.
  const N = 16;
  const wave = (s: number, sg: number) => {
    const env = Math.sin(Math.PI * s ** 0.72) ** 0.8;
    const crisp = 1 + 0.24 * Math.sin(s * Math.PI * 5.5 + (sg > 0 ? 0.6 : -0.6));
    return sg * (W / 2) * env * crisp;
  };
  const up = sample((s) => [s * L, wave(s, -1)] as Pt, N);
  const dn = sample((s) => [s * L, wave(s, 1)] as Pt, N);
  const pts = [...up, [L * 1.02, 0] as Pt, ...dn.slice(0, -1).reverse()].map(toW);
  shape(out, r, pts, tone(r, { dl, spread: 0.04, hue: 8 }), { deep: 0.38, deepAbout: toW([L * 0.52, W * 0.16]) });
  // Pale felted wavy margin and prominent cream midvein.
  out.push(`<path class="ink wool" d="${closed(pts)}"/>`);
  out.push(`<path class="ink thin" style="stroke:var(--felt);stroke-opacity:0.75" d="M${P1(toW([2, 0]))}L${P1(toW([L * 0.9, 0]))}"/>`);
}

export function halfmensFlower(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const W = L * 0.42;
  // Velvety tubular-campanulate yellow-green outer tube flaring into 5 lobes with a deep maroon-red throat.
  const tube: Pt[] = [
    [0, -W * 0.16],
    [L * 0.45, -W * 0.24],
    [L * 0.88, -W * 0.38],
    [L * 0.88, W * 0.38],
    [L * 0.45, W * 0.24],
    [0, W * 0.16],
  ].map(toW);
  shape(out, r, tube, tone(r, { pc: "--pl-damara", dl: 0.08, spread: 0.04 }), { deep: 0.3 });
  // Deep velvety crimson-maroon inner mouth and 5 spreading rim lobes.
  const mouthC = toW([L * 0.9, 0]);
  shape(out, r, roundPts(mouthC, W * 0.28, W * 0.46, dir, 10), tone(r, { pc: "--flower-mistletoe", dl: -0.06, spread: 0.03 }), { deep: 0.35 });
  shape(out, r, roundPts(toW([L * 0.86, 0]), W * 0.16, W * 0.26, dir, 8), tone(r, { pc: "--stem-protea", dl: -0.14, spread: 0.02 }), { deep: 0, ink: false });
}

export function halfmensCrest(out: Out, r: Rng, C: Pt, tilt: number, R: number) {
  const toW = (p: Pt) => add(C, rot(p, tilt));
  // Back tier of undulate velvety leaves.
  for (const [da, lMul, dl] of [
    [-1.35, 0.88, -0.05],
    [-0.95, 0.98, -0.03],
    [-0.48, 1.04, -0.02],
    [0.48, 1.04, -0.02],
    [0.95, 0.98, -0.03],
    [1.35, 0.88, -0.05],
  ] as const) {
    halfmensLeaf(out, r, toW([Math.sin(da) * R * 0.2, -R * 0.04]), tilt - Math.PI / 2 + da, R * lMul, dl);
  }
  // Sub-apical cluster of yellow-green tubular flowers with velvety maroon-red throats.
  for (const [dx, dy, da, lMul] of [
    [-R * 0.22, -R * 0.24, -0.68, 0.62],
    [-R * 0.08, -R * 0.34, -0.25, 0.68],
    [R * 0.1, -R * 0.34, 0.22, 0.68],
    [R * 0.24, -R * 0.22, 0.65, 0.62],
    [R * 0.34, -R * 0.08, 0.95, 0.56],
  ] as const) {
    halfmensFlower(out, r, toW([dx, dy]), tilt - Math.PI / 2 + da, R * lMul);
  }
  // Front tier of strongly undulate leaves framing the base of the floral crown.
  for (const [da, lMul, dl] of [
    [-1.15, 0.92, 0.02],
    [-0.65, 0.96, 0.04],
    [-0.12, 0.92, 0.05],
    [0.35, 0.95, 0.04],
    [0.82, 0.9, 0.02],
  ] as const) {
    halfmensLeaf(out, r, toW([Math.sin(da) * R * 0.18, R * 0.06]), tilt - Math.PI / 2 + da, R * lMul, dl);
  }
}

export function halfmens(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  // Helper for a warty silver-grey bottle-swollen pachycaul column tilting gently toward the sun.
  const drawColumn = (pts: Pt[], w0: number, w1: number, g: [number, number], crestR: number) => {
    const col = grow(out, g[0], g[1], () => {
      const res = limb(out, r, pts, {
        w0,
        w1,
        pc: "--bark-halfmens",
        cap: "blunt",
      });
      // Transverse growth folds and spiral rows of raised warts across the column face.
      let folds = "";
      let warts = "";
      for (let i = 2; i < res.n - 1; i += 2) {
        const t = i / res.n;
        const p = res.pts[i];
        const a = angleOf(res.pts, i) + Math.PI / 2;
        const hw = res.width(t) * 0.44;
        folds += `M${P1(add(p, polar(-hw, a)))}Q${P1(add(p, polar(4, a - Math.PI / 2)))} ${P1(add(p, polar(hw, a)))}`;
        for (const u of [-0.55, 0, 0.55]) {
          const wc = add(p, polar(u * hw, a));
          warts += closed(roundPts(wc, 5.5 * (1 - t * 0.25), 3.4 * (1 - t * 0.25), a, 6));
        }
      }
      out.push(`<path class="wash"${vars(tone(r, { pc: "--bark-cork", dl: 0.06, spread: 0.03 }))} d="${warts}"/>`);
      out.push(`<path class="ink hair bark-tex" d="${folds}"/>`);
      return res;
    });

    // 3-spined tubercles along both flanks of the column, each anchored at its exact node!
    for (let i = 3; i <= col.n - 2; i += 2) {
      const t = i / col.n;
      const p = col.pts[i];
      const a = angleOf(col.pts, i);
      const nrmA = a + Math.PI / 2;
      const hw = col.width(t) * 0.48;
      const spLen = (w0 * 0.3) * (1 - t * 0.22);
      part(out, gate(col, g, i) + 0.02, p, () => {
        let spines = "";
        let tips = "";
        for (const sg of [-1, 1]) {
          const baseT = add(p, polar(sg * hw, nrmA));
          const outA = a + sg * rad(68);
          for (const [da, lMul] of [
            [-0.28, 1.0],
            [0.28, 0.96],
            [0.02, 0.56],
          ] as const) {
            const tipS = add(baseT, polar(spLen * lMul, outA + da));
            const perp = polar(1.3, outA + da + Math.PI / 2);
            spines += `M${P1(add(baseT, perp))}L${P1(tipS)}L${P1(sub(baseT, perp))}Z`;
            tips += `M${P1(lerp(baseT, tipS, 0.65))}L${P1(tipS)}`;
          }
        }
        out.push(`<path class="wash"${vars(tone(r, { pc: "--spine", dl: -0.05, spread: 0.03 }))} d="${spines}"/><path class="ink hair" d="${spines}"/>`);
        out.push(`<path class="ink thin" style="stroke:var(--bark-thorn)" d="${tips}"/>`);
      });
    }

    // Tilted apical crest of strongly undulate velvety leaves and red-throated tubular flowers.
    const tip = col.pts[col.n];
    const tilt = angleOf(col.pts, col.n) + Math.PI / 2;
    part(out, gate(col, g, col.n) + 0.03, tip, () => halfmensCrest(out, r, tip, tilt, crestR));
  };

  // Tall primary Richtersveld column rooted at base and curving ~22° toward the upper right.
  drawColumn([at([0, 16]), at([18, -125]), at([52, -268]), at([104, -398]), at([168, -515])], 94, 42, [0, 0.45], 86);
  // Shorter juvenile sister stem rising beside the swollen base.
  drawColumn([at([52, 16]), at([68, -88]), at([96, -188]), at([136, -285])], 58, 30, [0.1, 0.48], 62);
}

// ---------------------------------------------------------------------------
// 3. Butter tree / botterboom (Tylecodon paniculatus): squat swollen pachycaul leaning in from a
// corner, olive-green underbark cloaked in curling translucent golden-yellow peeling bark strips,
// terminal clusters of succulent green obovate paddle leaves, and red-stalked urn panicles.

export function butterTip(out: Out, r: Rng, O: Pt, lean: number, R: number, hasPanicle = true) {
  const toW = (p: Pt) => add(O, rot(p, lean));
  // 1. Erect crimson-red dichotomous cyme bearing nodding yellowish-red urn flowers.
  if (hasPanicle) {
    const scapeTip = toW([0, -R * 1.48]);
    stalk(out, quad(O, toW([4, -R * 0.72]), scapeTip), 5.5, 2.4, tone(r, { pc: "--stem-protea", spread: 0.03 }), 9);
    let pedicels = "";
    for (const [dx, dy, fDir] of [
      [-R * 0.42, -R * 1.05, rad(55)],
      [R * 0.44, -R * 1.1, rad(125)],
      [-R * 0.28, -R * 1.42, rad(65)],
      [R * 0.3, -R * 1.44, rad(115)],
      [0, -R * 1.58, rad(85)],
    ] as const) {
      const fBase = toW([dx, dy]);
      pedicels += `M${P1(toW([0, dy + R * 0.16]))}Q${P1(toW([dx * 0.5, dy - 6]))} ${P1(fBase)}`;
      const urn = roundPts(add(fBase, polar(11, lean + fDir)), 12, 6.5, lean + fDir, 8);
      shape(out, r, urn, tone(r, { pc: "--cone-welwitschia", spread: 0.04, hue: 8 }), { deep: 0.3 });
      const mouth = add(fBase, polar(21, lean + fDir));
      shape(out, r, roundPts(mouth, 4.5, 6.5, lean + fDir, 6), tone(r, { pc: "--flower-quiver", spread: 0.03 }), { deep: 0 });
    }
    out.push(`<path class="ink thin" style="stroke:var(--stem-protea)" d="${pedicels}"/>`);
  }

  // 2. Rosulate cluster of fleshy bright-green obovate-spathulate paddle leaves.
  const paddles: [number, number, number, number][] = [
    [-1.28, 0.88, 0.44, -0.04],
    [-0.78, 0.98, 0.46, 0.01],
    [-0.24, 0.94, 0.48, 0.04],
    [0.26, 0.96, 0.48, 0.03],
    [0.78, 0.98, 0.46, 0.01],
    [1.28, 0.86, 0.44, -0.04],
  ];
  for (const [da, lMul, wMul, dl] of paddles) {
    const a = lean - Math.PI / 2 + da;
    const L = R * lMul;
    const W = L * wMul;
    const bToW = (p: Pt) => add(O, rot(p, a));
    // Obovate-spathulate paddle profile: narrow cuneate base, broad rounded apex.
    const half = (s: number) => (W / 2) * (s ** 0.58) * Math.sin(Math.PI * (s ** 0.78)) ** 0.65;
    const up = sample((s) => [s * L, -half(s)] as Pt, 8);
    const dn = sample((s) => [s * L, half(s)] as Pt, 8);
    const pts = [...up, [L * 1.01, 0] as Pt, ...dn.slice(0, -1).reverse()].map(bToW);
    shape(out, r, pts, tone(r, { dl, spread: 0.04, hue: 8 }), { deep: 0.35, deepAbout: bToW([L * 0.62, W * 0.18]) });
    out.push(`<path class="ink hair vein" d="M${P1(bToW([3, 0]))}L${P1(bToW([L * 0.84, 0]))}"/>`);
  }
}

export function buttertree(out: Out, r: Rng, base: Pt) {
  const at = (p: Pt) => add(base, p);
  const gm: [number, number] = [0, 0.38];
  // Squat bottle-swollen pachycaul trunk rooted at base and leaning gently inward.
  const main = grow(out, gm[0], gm[1], () => {
    const res = limb(out, r, [at([0, 18]), at([18, -72]), at([46, -158]), at([82, -238])], {
      w0: 118,
      w1: 54,
      pc: "--bark-butter",
      cap: "blunt",
    });
    // Olive-green photosynthetic underbark windows + papery exfoliating bark sheets across the belly.
    let windows = "";
    for (const [i, u, rx, ry] of [
      [5, -0.16, 26, 13],
      [10, 0.18, 22, 11],
      [15, -0.1, 18, 9],
    ] as const) {
      const p = res.pts[i];
      const a = angleOf(res.pts, i);
      windows += closed(roundPts(add(p, polar(u * res.width(i / res.n), a + Math.PI / 2)), rx, ry, a, 8));
    }
    out.push(`<path class="wash"${vars(tone(r, { pc: "--pl-gifboom", dl: 0.04, spread: 0.03 }))} d="${windows}"/>`);
    // Curling translucent papery golden-ochre bark ribbons peeling across the trunk face.
    for (const [i, sg, wCurl] of [
      [4, -1, 24],
      [7, 1, 26],
      [11, -1, 20],
      [14, 1, 18],
    ] as const) {
      const p = res.pts[i];
      const a = angleOf(res.pts, i);
      const edgeP = add(p, polar(sg * res.width(i / res.n) * 0.42, a + Math.PI / 2));
      const sheet: Pt[] = [
        add(edgeP, [-sg * 12, -8]),
        add(edgeP, [sg * wCurl * 0.7, -14]),
        add(edgeP, [sg * wCurl, 4]),
        add(edgeP, [sg * wCurl * 0.45, 14]),
        add(edgeP, [-sg * 10, 8]),
      ];
      shape(out, r, sheet, tone(r, { pc: "--bark-butter", dl: 0.07, spread: 0.04 }), { deep: 0.25 });
    }
    return res;
  });

  const fork = (t: number, ctrl: Pt[], w0: number, w1: number, span: number) => {
    const i = Math.round(main.n * t);
    const g: [number, number] = [gate(main, gm, i), gate(main, gm, i) + span];
    const res = grow(out, g[0], g[1], () =>
      limb(out, r, [main.pts[i - 2], ...ctrl.map((d) => add(main.pts[i], d))], {
        w0,
        w1,
        pc: "--bark-butter",
        cap: "blunt",
        inkFrom: 0.14,
      }),
    );
    return { res, g };
  };

  // Four thick stubby candelabrum arms branching from the swollen bottle trunk.
  const leftUp = fork(0.55, [[-34, -56], [-62, -118]], 46, 26, 0.2);
  const midUp = fork(0.76, [[-8, -58], [-12, -118]], 40, 24, 0.2);
  const rightMid = fork(0.68, [[52, -38], [106, -82]], 42, 24, 0.2);

  for (const [b, lean, R, pan] of [
    [leftUp, rad(-16), 62, true],
    [midUp, rad(-2), 66, true],
    [{ res: main, g: gm }, rad(14), 68, true],
    [rightMid, rad(32), 60, false],
  ] as const) {
    const tip = b.res.pts[b.res.n];
    part(out, gate(b.res, b.g, b.res.n) + 0.03, tip, () => butterTip(out, r, tip, lean, R, pan));
  }
}

// ---------------------------------------------------------------------------
// 4. Damara milk-bush (Euphorbia damarana): dense hemispherical dome of erect leafless glaucous
// pencil-thick rods marked with tiny dark leaf scars, tipped with sessile yellow-brown cyathia and
// 3-lobed subglobose seed capsules.

export function damaraTip(out: Out, r: Rng, P: Pt, dir: number, hasCapsule: boolean) {
  const toW = (p: Pt) => add(P, rot(p, dir));
  // Sessile yellow-gold bowl cyathia clustered around the sub-terminal nodes.
  let cyathia = "";
  for (const [dx, dy] of [
    [-14, -5.5],
    [-7, 5.5],
    [2, -4.5],
    [4, 4.5],
  ] as const) {
    cyathia += closed(roundPts(toW([dx, dy]), 5.2, 3.8, dir, 6));
  }
  out.push(`<path class="wash filament"${vars(tone(r, { pc: "--flower-quiver", dl: -0.04, spread: 0.04 }))} d="${cyathia}"/><path class="ink hair" d="${cyathia}"/>`);
  if (hasCapsule) {
    // Plump 3-lobed (tricoccous) tawny-ochre capsule perched at the rod apex.
    for (const dy of [-5.2, 5.2, 0]) {
      shape(out, r, roundPts(toW([11, dy]), 9.5, 7.0, dir, 8), tone(r, { pc: "--bark-butter", dl: dy === 0 ? 0.05 : -0.04, spread: 0.04, dh: -8, hue: 8 }), { deep: 0.35 });
    }
    out.push(`<path class="ink hair" d="M${P1(toW([3, 0]))}L${P1(toW([19, 0]))}"/>`);
  }
}

export function damara(out: Out, r: Rng, base: Pt) {
  const rods = 26;
  for (let k = 0; k < rods; k++) {
    const u = k / (rods - 1);
    const deg = -114 + u * 92 + (r() - 0.5) * 3;
    const a = rad(deg);
    const L = (250 + Math.sin(u * Math.PI) * 155) * (0.9 + r() * 0.14);
    const p0 = add(base, [(u - 0.35) * 68, (1 - Math.sin(u * Math.PI)) * 12]);
    const n = 16;
    const sway = wobble(r, 3, [0.5, 1.0]);
    const spine = sample((t) => add(p0, add(polar(t * L, a), polar(sway(t), a + Math.PI / 2))), n);
    const g0 = 0.04 + (k % 7) * 0.03;
    const g: [number, number] = [g0, g0 + 0.44];
    const res = grow(out, g[0], g[1], () => {
      const st = stalk(out, (t) => spine[Math.round(t * n)], 11.5, 7.8, tone(r, { dl: (k % 2 ? 0.03 : -0.04), spread: 0.04 }), n);
      let scars = "";
      for (let i = 4; i <= n - 3; i += 4) {
        const sp = st.pts[i];
        scars += `M${P1(add(sp, [-3.2, -1]))}L${P1(add(sp, [3.2, 1]))}`;
      }
      out.push(`<path class="ink hair" d="${scars}"/>`);
      return st;
    });
    const tip = res.pts[n];
    const tipA = angleOf(res.pts, n);
    part(out, gate(res, g, n) + 0.03, tip, () => damaraTip(out, r, tip, tipA, k % 2 === 0));
  }
}

// ---------------------------------------------------------------------------
// 5. Gifboom (Euphorbia virosa) + Namibian mistletoe (Tapinanthus oleifolius): twisted basal caudex
// with a candelabra whorl of 5–8-angled constricted segments armed with paired stipular spines on a
// continuous grey horny shield, hosting a bushy hemiparasitic clump of Tapinanthus oleifolius with
// leathery glaucous leaves and vivid crimson-red split-tube flowers.

export function mistletoeTube(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  // 1. Basal swollen oval red-pink tube + narrower cylindrical neck.
  const tube: Pt[] = [
    [0, -2.5],
    [L * 0.22, -L * 0.14],
    [L * 0.55, -L * 0.1],
    [L * 0.78, -L * 0.08],
    [L * 0.78, L * 0.08],
    [L * 0.55, L * 0.1],
    [L * 0.22, L * 0.14],
    [0, 2.5],
  ].map(toW);
  shape(out, r, tube, tone(r, { pc: "--flower-mistletoe", spread: 0.04, hue: 6 }), { deep: 0.38 });
  // 2. Five reflexed strap lobes at the apex (yellow-green inside with black tips) and coiled red stamen.
  const mouth = toW([L * 0.78, 0]);
  let lobes = "";
  let blackTips = "";
  for (const da of [-0.85, -0.35, 0.35, 0.85]) {
    const lTip = add(mouth, polar(L * 0.26, dir + Math.PI - da));
    const nrm = polar(1.6, dir + Math.PI - da + Math.PI / 2);
    lobes += `M${P1(add(mouth, nrm))}L${P1(lTip)}L${P1(sub(mouth, nrm))}Z`;
    blackTips += closed(roundPts(lTip, 2, 1.4, dir, 5));
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--pl-damara", dl: 0.12, spread: 0.03 }))} d="${lobes}"/><path class="ink hair" d="${lobes}"/>`);
  out.push(`<path class="wash"${vars({ pc: "--bark-thorn" })} d="${blackTips}"/>`);
  // Exserted crimson style and coiled stamen filaments from the unilateral split.
  const stTip = toW([L * 1.06, -L * 0.04]);
  out.push(`<path class="ink thin" style="stroke:var(--flower-mistletoe)" d="M${P1(mouth)}Q${P1(toW([L * 0.92, -L * 0.12]))} ${P1(stTip)}"/>`);
  out.push(`<path class="wash anther"${vars({ pc: "--flower-quiver" })} d="${closed(roundPts(stTip, 2.2, 1.5, dir, 5))}"/>`);
}

export function mistletoeClump(out: Out, r: Rng, P: Pt, s: number) {
  // Woody haustorial union and spreading grey-brown mistletoe twigs erupting from the Euphorbia rib.
  shape(out, r, roundPts(P, 12, 9, 0, 8), tone(r, { pc: "--bark-cork", dl: -0.04, spread: 0.03 }), { deep: 0.4 });
  const twigs: [Pt, Pt][] = [
    [[42, -38], [88, -62]],
    [[48, -6], [98, -8]],
    [[38, 24], [82, 46]],
    [[-36, -34], [-74, -54]],
    [[-38, 8], [-78, 22]],
  ];
  let berries = "";
  for (const [p1, p2] of twigs) {
    const m1 = add(P, mul(p1, s));
    const m2 = add(P, mul(p2, s));
    stalk(out, quad(P, m1, m2), 5.5 * s, 2.6 * s, tone(r, { pc: "--bark-cork", spread: 0.03 }), 7);
    const a = Math.atan2(m2[1] - P[1], m2[0] - P[0]);
    // Opposite leathery blue-glaucous elliptic leaves along the twig.
    for (const [f, sg] of [
      [0.38, -1],
      [0.42, 1],
      [0.72, -1],
      [0.76, 1],
    ] as const) {
      const lp = lerp(P, m2, f);
      const la = a + sg * rad(48);
      const lC = add(lp, polar(18 * s, la));
      shape(out, r, roundPts(lC, 18 * s, 7.5 * s, la, 9), tone(r, { pc: "--pl-quivertree", dl: sg > 0 ? 0.03 : -0.03, spread: 0.04 }), { deep: 0.3 });
    }
    // Axillary umbel of 3–4 crimson-red split-tube flowers + sticky red berries.
    for (const da of [-0.45, -0.12, 0.22, 0.52]) {
      mistletoeTube(out, r, m2, a + da, 36 * s);
    }
    berries += closed(roundPts(add(m1, [0, 5 * s]), 4.5 * s, 3.6 * s, a, 6));
  }
  out.push(`<path class="wash fruit"${vars(tone(r, { pc: "--flower-mistletoe", dl: 0.04, spread: 0.03 }))} d="${berries}"/><path class="ink hair" d="${berries}"/>`);
}

export function gifboom(out: Out, r: Rng, base: Pt) {
  // 1. Short spirally twisted grey-green basal caudex.
  part(out, 0.02, base, () => {
    const caudex = roundPts(add(base, [0, -28]), 66, 36, rad(-8), 12);
    shape(out, r, caudex, tone(r, { dl: -0.08, spread: 0.03 }), { deep: 0.45 });
    let twist = "";
    for (const dx of [-38, -14, 12, 38]) {
      twist += `M${P1(add(base, [dx, -4]))}Q${P1(add(base, [dx + 14, -28]))} ${P1(add(base, [dx - 4, -52]))}`;
    }
    out.push(`<path class="ink thin" d="${twist}"/>`);
  });

  // 2. Candelabra whorl of 8 constricted 5–8-angled stems with continuous grey spine shields.
  const stems = [
    { x0: -58, lean: -0.44, H: 335, segs: 5, g: [0.1, 0.52] as [number, number], mistletoe: 0 },
    { x0: -42, lean: -0.29, H: 395, segs: 6, g: [0.07, 0.49] as [number, number], mistletoe: 0 },
    { x0: -24, lean: -0.16, H: 455, segs: 6, g: [0.04, 0.46] as [number, number], mistletoe: 0.76 },
    { x0: -8, lean: -0.05, H: 485, segs: 6, g: [0.02, 0.44] as [number, number], mistletoe: 0 },
    { x0: 10, lean: 0.06, H: 490, segs: 6, g: [0.03, 0.45] as [number, number], mistletoe: 1.0 },
    { x0: 26, lean: 0.18, H: 450, segs: 6, g: [0.05, 0.47] as [number, number], mistletoe: 0 },
    { x0: 42, lean: 0.31, H: 390, segs: 6, g: [0.08, 0.5] as [number, number], mistletoe: 0 },
    { x0: 56, lean: 0.45, H: 330, segs: 5, g: [0.11, 0.53] as [number, number], mistletoe: 0 },
  ];

  for (const st of stems) {
    const n = 30;
    const spine = sample((t) => {
      // Candelabra curve: bows outward near the base, then turns upright.
      const bow = Math.sin(t * Math.PI * 0.65);
      return add(base, [st.x0 + bow * st.H * st.lean, -38 - t * st.H]);
    }, n);

    const res = grow(out, st.g[0], st.g[1], () => {
      // Constricted hourglass-segmented profile along the candelabra stem.
      const L: Pt[] = [];
      const R: Pt[] = [];
      const midRib1: Pt[] = [];
      const midRib2: Pt[] = [];
      let shields = "";
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const p = spine[i];
        const a = angleOf(spine, i) + Math.PI / 2;
        const pinch = 0.62 + 0.38 * Math.sin(t * st.segs * Math.PI) ** 2;
        const hw = (17.5 - t * 3.2) * pinch;
        const pL = add(p, polar(-hw, a));
        const pR = add(p, polar(hw, a));
        L.push(pL);
        R.push(pR);
        midRib1.push(add(p, polar(-hw * 0.36, a)));
        midRib2.push(add(p, polar(hw * 0.36, a)));
      }
      const poly = [...L, ...[...R].reverse()];
      shape(out, r, poly, tone(r, { dl: st.lean > 0 ? -0.02 : 0.02, spread: 0.04 }), { deep: 0.4 });
      // Continuous horny grey spine shields along the outer and inner rib crests.
      shields += `${line(L)}${line(R)}${line(midRib1)}${line(midRib2)}`;
      out.push(`<path class="ink mid" style="stroke:var(--bark-halfmens)" d="${shields}"/>`);
      return { L, R, pts: spine, n, len: st.H, s: spine.map((_, i) => (i / n) * st.H), width: (t: number) => 30 * (1 - t * 0.2) };
    });

    // Paired stipular spines along the rib crests + bright yellow cyathia at the upper segments.
    for (let i = 3; i <= n - 1; i += 2) {
      const t = i / n;
      const p = res.pts[i];
      const a = angleOf(res.pts, i) + Math.PI / 2;
      const pinch = 0.62 + 0.38 * Math.sin(t * st.segs * Math.PI) ** 2;
      const hw = (17.5 - t * 3.2) * pinch;
      part(out, gate(res, st.g, i) + 0.02, p, () => {
        let sp = "";
        for (const sg of [-1, 1]) {
          const edge = add(p, polar(sg * hw, a));
          sp += `M${P1(edge)}L${P1(add(edge, [sg * 7, -4]))}M${P1(edge)}L${P1(add(edge, [sg * 7, 3]))}`;
        }
        out.push(`<path class="ink thin" style="stroke:var(--bark-thorn)" d="${sp}"/>`);
        if (i >= n - 5) {
          let cy = "";
          for (const sg of [-1, 1]) {
            cy += closed(roundPts(add(p, polar(sg * (hw + 2), a)), 3.8, 2.8, a, 6));
          }
          out.push(`<path class="wash filament"${vars(tone(r, { pc: "--flower-quiver", spread: 0.04 }))} d="${cy}"/><path class="ink hair" d="${cy}"/>`);
        }
      });
    }

    // Woody hemiparasitic clump of Namibian mistletoe (Tapinanthus oleifolius) erupting from the upper stem!
    if (st.mistletoe > 0) {
      const mi = st.mistletoe > 0.9 ? 21 : 17;
      const mp = res.pts[mi];
      part(out, Math.max(0.56, gate(res, st.g, mi) + 0.05), mp, () => mistletoeClump(out, r, mp, st.mistletoe));
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Nara melon (Acanthosicyos horridus): leafless grooved grey-green thorny stems armed with
// paired straight 2–3 cm ivory-tipped spines at every node, pale greenish-yellow axillary flowers,
// and heavy 15 cm globose spiny orange-yellow melons resting near the ground.

export function naraFlower(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const W = L * 0.78;
  // Five-lobed campanulate greenish-yellow cucurbit corolla over a short warty hypanthium.
  const cup: Pt[] = [
    [0, -W * 0.18],
    [L * 0.42, -W * 0.34],
    [L * 0.88, -W * 0.52],
    [L * 1.04, -W * 0.32],
    [L * 0.82, -W * 0.14],
    [L * 1.08, 0],
    [L * 0.82, W * 0.14],
    [L * 1.04, W * 0.32],
    [L * 0.88, W * 0.52],
    [L * 0.42, W * 0.34],
    [0, W * 0.18],
  ].map(toW);
  shape(out, r, cup, tone(r, { pc: "--flower-candle", dl: -0.03, spread: 0.03, hue: 8 }), { deep: 0.28 });
  out.push(`<path class="ink hair vein" d="M${P1(toW([2, 0]))}L${P1(toW([L * 0.92, 0]))}"/>`);
}

export function naraMelon(out: Out, r: Rng, C: Pt, R: number) {
  // Globose orange-yellow pepo melon covered in conical spiny tubercles.
  const body = roundPts(C, R, R * 0.94, rad(-8), 16);
  shape(out, r, body, tone(r, { pc: "--fruit-nara", spread: 0.04, hue: 6 }), { deep: 0.42, deepAbout: add(C, [R * 0.25, R * 0.28]) });
  // Longitudinal meridian lines and concentric rings of conical spine warts.
  let meridians = "";
  for (const dx of [-0.55, -0.2, 0.2, 0.55]) {
    meridians += `M${P1(add(C, [0, -R * 0.92]))}Q${P1(add(C, [dx * R * 1.25, 0]))} ${P1(add(C, [0, R * 0.92]))}`;
  }
  out.push(`<path class="ink hair vein" d="${meridians}"/>`);
  let warts = "";
  let prickles = "";
  for (let row = -2; row <= 2; row++) {
    const y = row * R * 0.32;
    const rowW = Math.sqrt(Math.max(0.1, 1 - (y / R) ** 2)) * R * 0.82;
    for (let k = -2; k <= 2; k++) {
      const wp = add(C, [k * rowW * 0.42 + (row % 2 ? 4 : -4), y]);
      const dir = Math.atan2(wp[1] - C[1], wp[0] - C[0]);
      warts += closed(roundPts(wp, 4.2, 3.2, dir, 6));
      prickles += `M${P1(wp)}L${P1(add(wp, polar(5.5, dir)))}`;
    }
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--fruit-nara", dl: 0.07, spread: 0.04 }))} d="${warts}"/><path class="ink hair" d="${warts}"/><path class="ink thin" d="${prickles}"/>`);
}

export function nara(out: Out, r: Rng, base: Pt) {
  // Dense, tangled, spiny hummock of leafless grooved grey-green stems with lateral forks.
  const canes = [
    { x0: -56, ctrl: [-130, -95] as Pt, tip: [-205, -52] as Pt, g: [0.08, 0.46] as [number, number], fork: [-48, -54] as Pt },
    { x0: -38, ctrl: [-105, -165] as Pt, tip: [-175, -155] as Pt, g: [0.05, 0.43] as [number, number], fork: [-44, -62] as Pt },
    { x0: -22, ctrl: [-68, -215] as Pt, tip: [-118, -255] as Pt, g: [0.03, 0.41] as [number, number], fork: [-36, -68] as Pt },
    { x0: -6, ctrl: [-16, -245] as Pt, tip: [-26, -302] as Pt, g: [0.02, 0.4] as [number, number], fork: [-26, -66] as Pt },
    { x0: 10, ctrl: [38, -240] as Pt, tip: [72, -292] as Pt, g: [0.03, 0.41] as [number, number], fork: [28, -66] as Pt },
    { x0: 26, ctrl: [82, -205] as Pt, tip: [138, -242] as Pt, g: [0.04, 0.42] as [number, number], fork: [36, -68] as Pt },
    { x0: 42, ctrl: [115, -155] as Pt, tip: [182, -142] as Pt, g: [0.06, 0.44] as [number, number], fork: [44, -62] as Pt },
    { x0: 56, ctrl: [135, -90] as Pt, tip: [208, -48] as Pt, g: [0.09, 0.47] as [number, number], fork: [48, -54] as Pt },
  ];

  const armStem = (res: { pts: Pt[] }, g: [number, number], n: number, step: number, spLen: number) => {
    for (let i = 4; i <= n - 2; i += step) {
      const p = res.pts[i];
      const a = angleOf(res.pts, i);
      part(out, gate(res, g, i) + 0.02, p, () => {
        let sp = "";
        let ivory = "";
        for (const sg of [-1, 1]) {
          const dir = a + sg * rad(66);
          const sTip = add(p, polar(spLen, dir));
          const nrm = polar(1.6, dir + Math.PI / 2);
          sp += `M${P1(add(p, nrm))}L${P1(sTip)}L${P1(sub(p, nrm))}Z`;
          ivory += `M${P1(lerp(p, sTip, 0.55))}L${P1(sTip)}`;
        }
        out.push(`<path class="wash"${vars(tone(r, { dl: 0.05, spread: 0.03 }))} d="${sp}"/><path class="ink hair" d="${sp}"/>`);
        out.push(`<path class="ink thin" style="stroke:var(--spine)" d="${ivory}"/>`);
        if (i === 8 || i === 12) {
          const fDir = a + (i === 8 ? -1 : 1) * rad(54);
          naraFlower(out, r, p, fDir, 19);
        }
      });
    }
  };

  for (const c of canes) {
    const n = 18;
    const p0 = add(base, [c.x0, 0]);
    const spine = sample(quad(p0, add(base, c.ctrl), add(base, c.tip)), n);
    const res = grow(out, c.g[0], c.g[1], () =>
      stalk(out, (t) => spine[Math.round(t * n)], 9, 4.8, tone(r, { spread: 0.04, hue: 6 }), n),
    );
    armStem(res, c.g, n, 4, 23);

    // Lateral forked branchlet angling off even node 8 to create the dense tangled nara thicket.
    const fi = 8;
    const fp = res.pts[fi];
    const fg0 = gate(res, c.g, fi) + 0.02;
    const fg: [number, number] = [fg0, fg0 + 0.16];
    const fn = 10;
    const fTip = add(fp, c.fork);
    const fSpine = sample(quad(fp, lerp(fp, fTip, 0.5), fTip), fn);
    const fRes = grow(out, fg[0], fg[1], () =>
      stalk(out, (t) => fSpine[Math.round(t * fn)], 5.8, 3.4, tone(r, { dl: 0.03, spread: 0.04 }), fn),
    );
    armStem(fRes, fg, fn, 4, 17);
  }

  // Three globose spiny orange-yellow melons resting near the lower stems.
  for (const [dx, dy, R, g0] of [
    [-64, -42, 42, 0.55],
    [4, -32, 34, 0.6],
    [62, -38, 38, 0.64],
  ] as const) {
    const mp = add(base, [dx, dy]);
    part(out, g0, mp, () => naraMelon(out, r, mp, R));
  }
}

// ---------------------------------------------------------------------------
// 7. Welwitschia (Welwitschia mirabilis): low corky bi-lobed crater-cup crown issuing two broad
// leathery olive-russet straps that arch out, fold in ribbon waves, and split lengthwise into frayed
// bronze thongs over the gravel, framing forked scarlet-and-salmon 4-ranked cone panicles.

export function welwitschiaCone(out: Out, r: Rng, O: Pt, dir: number, H: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  const W = H * 0.42;
  // Oblong tetrastichous (4-ranked) female strobilus cone of overlapping salmon-scarlet scales.
  const body = roundPts(toW([H * 0.5, 0]), H * 0.52, W * 0.5, dir, 10);
  shape(out, r, body, tone(r, { pc: "--cone-welwitschia", spread: 0.04, hue: 6 }), { deep: 0.38 });
  // Geometric 4-ranked cross-hatched scale lines and apical micropylar tubes.
  let scales = "";
  const rows = 7;
  for (let i = 1; i < rows; i++) {
    const u = i / rows;
    const x = u * H;
    const hw = (W * 0.48) * Math.sin(u * Math.PI);
    scales += `M${P1(toW([x - 3, -hw]))}L${P1(toW([x + 3, 0]))}L${P1(toW([x - 3, hw]))}`;
  }
  scales += `M${P1(toW([H * 0.08, 0]))}L${P1(toW([H * 0.92, 0]))}`;
  out.push(`<path class="ink hair" d="${scales}"/>`);
}

export function welwitschiaPanicle(out: Out, r: Rng, O: Pt, side: number, s: number) {
  // Dichotomously forked glaucous peduncle bearing a cluster of 5 erect 4-ranked salmon-scarlet cones.
  const pMid = add(O, [side * 28 * s, -54 * s]);
  const pL = add(pMid, [side * 8 * s - 22 * s, -42 * s]);
  const pR = add(pMid, [side * 34 * s + 14 * s, -36 * s]);
  stalk(out, quad(O, add(O, [side * 12 * s, -28 * s]), pMid), 6 * s, 4 * s, tone(r, { pc: "--pl-quivertree", spread: 0.03 }), 6);
  out.push(`<path class="ink mid" style="stroke:var(--pl-quivertree)" d="M${P1(pMid)}L${P1(pL)}M${P1(pMid)}L${P1(pR)}"/>`);
  for (const [baseC, deg, H] of [
    [pL, -104, 42 * s],
    [add(pL, [-14 * s, 6 * s]), -122, 34 * s],
    [lerp(pL, pR, 0.5), -88, 46 * s],
    [pR, -74, 40 * s],
    [add(pR, [14 * s, 8 * s]), -58, 32 * s],
  ] as const) {
    welwitschiaCone(out, r, baseC, rad(deg), H);
  }
}

export function welwitschiaStrap(out: Out, r: Rng, O: Pt, side: number, span: number) {
  // A single broad, continuous, ribbon-folded leathery leaf strap emerging from the crater groove
  // (width ~54 at the base) that arches out, folds over the gravel in a broad S-wave, and splits
  // lengthwise in its distal half into 3 overlapping frayed russet-bronze thongs.
  const thongs: [number, number, number, number, number][] = [
    // [baseYOff, splitSpread, archH, wavePhase, lenMul]
    [10, 26, 44, 0.8, 0.86],
    [0, 4, 62, 0.0, 0.96],
    [-10, -20, 76, -0.6, 1.04],
  ];
  for (let k = 0; k < thongs.length; k++) {
    const [y0, spreadY, archH, ph, lMul] = thongs[k];
    const L = span * lMul;
    const N = 24;
    const spine = sample((t) => {
      const x = side * t * L;
      // Unified broad arch near the crater (t < 0.42), diverging into curling thongs only after t > 0.42.
      const diverge = Math.max(0, (t - 0.38) / 0.62) ** 1.35;
      const arch = -Math.sin(t * Math.PI * 1.38) * archH * (1 - t * 0.42) + t * 24;
      const curl = Math.sin(t * Math.PI * 2.6 + ph) * 16 * diverge;
      return add(O, [x, y0 * (1 - diverge * 0.3) + arch + spreadY * diverge + curl]);
    }, N);

    const up: Pt[] = [];
    const dn: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = spine[i];
      const a = angleOf(spine, i) + Math.PI / 2;
      // Wide overlapping ribbon (hw = 22) in the unified basal half so the 3 strips fuse into one broad sheet!
      const hw = (22 - k * 1.5) * (1 - Math.max(0, t - 0.35) * 0.72);
      up.push(add(p, polar(-hw, a)));
      dn.push(add(p, polar(hw, a)));
    }
    const poly = [...up, ...[...dn].reverse()];
    shape(out, r, poly, tone(r, { dl: (k - 1) * 0.035, spread: 0.03, dh: k * 3, hue: 6 }), { deep: 0.38 });

    // Weathered russet-bronze distal third where the old leaf drags and frays on the desert gravel.
    const splitIdx = Math.round(N * 0.56);
    const tipPoly = [...up.slice(splitIdx), ...[...dn.slice(splitIdx)].reverse()];
    out.push(`<path class="wash"${vars(tone(r, { pc: "--strap-welwitschia", dl: (k - 1) * 0.04, spread: 0.03 }))} d="${closed(tipPoly)}"/>`);
    // Parallel longitudinal venation lines along the broad strap.
    let veins = "";
    for (const vOff of [-0.45, 0, 0.45]) {
      const vPts = spine.map((p, i) => add(p, polar(vOff * 16 * (1 - (i / N) * 0.5), angleOf(spine, i) + Math.PI / 2)));
      veins += line(vPts);
    }
    out.push(`<path class="ink hair vein" d="${veins}"/>`);
  }
}

export function welwitschia(out: Out, r: Rng, base: Pt) {
  const crownC = add(base, [0, -48]);
  // 1. Low corky bi-lobed crater-cup woody crown with concentric growth ridges.
  part(out, 0.02, crownC, () => {
    const pedestal = [
      add(base, [-54, 4]),
      add(crownC, [-74, 14]),
      add(crownC, [-62, -16]),
      add(crownC, [0, -8]),
      add(crownC, [62, -16]),
      add(crownC, [74, 14]),
      add(base, [54, 4]),
    ];
    shape(out, r, pedestal, tone(r, { pc: "--bark-cork", dl: -0.08, spread: 0.03 }), { deep: 0.45 });
    const pit = roundPts(add(crownC, [0, -6]), 50, 13, 0, 12);
    shape(out, r, pit, tone(r, { pc: "--bark-thorn", dl: -0.06, spread: 0.03 }), { deep: 0.4 });
  });

  // 2. Two broad leathery straps unrolling from the left and right crown lobes.
  const leftRim = add(crownC, [-46, -4]);
  const rightRim = add(crownC, [46, -4]);
  part(out, 0.14, leftRim, () => welwitschiaStrap(out, r, leftRim, -1, 265));
  part(out, 0.18, rightRim, () => welwitschiaStrap(out, r, rightRim, 1, 265));

  // 3. Forked scarlet-and-salmon 4-ranked cone panicles rising from the inner crater rim.
  const leftIn = add(crownC, [-24, -10]);
  const rightIn = add(crownC, [24, -10]);
  part(out, 0.56, leftIn, () => welwitschiaPanicle(out, r, leftIn, -1, 1.04));
  part(out, 0.62, rightIn, () => welwitschiaPanicle(out, r, rightIn, 1, 0.98));
}

// ---------------------------------------------------------------------------
// 8. Bushman's grass (Stipagrostis sabulicola): tough dune-anchoring hummock of rigid bamboo-like
// knotted culms bent by wind and topped by narrow feathery silver-cream plumose panicles.

export function dunegrassPlume(out: Out, r: Rng, O: Pt, dir: number, L: number) {
  const toW = (p: Pt) => add(O, rot(p, dir));
  let feathers = "";
  let glumes = "";
  let awns = "";
  const spikelets = 10;
  for (let k = 0; k < spikelets; k++) {
    const u = k / (spikelets - 1);
    const side = k % 2 ? 1 : -1;
    const spO = toW([u * L * 0.74, side * (8.5 - u * 4)]);
    const spDir = dir + side * (0.28 - u * 0.14);
    glumes += closed(roundPts(spO, 9.5, 2.5, spDir, 6));
    // Silky silver-cream plumose central awn + 2 fine naked lateral awns.
    const awnTip = add(spO, polar(42 * (1 - u * 0.25), spDir + side * 0.08));
    const nrm = polar(4.5, spDir + Math.PI / 2);
    const mid = lerp(spO, awnTip, 0.52);
    feathers += closed([spO, add(mid, nrm), awnTip, sub(mid, nrm)]);
    awns += `M${P1(spO)}L${P1(awnTip)}M${P1(spO)}L${P1(add(spO, polar(22, spDir - 0.18)))}M${P1(spO)}L${P1(add(spO, polar(22, spDir + 0.18)))}`;
  }
  out.push(`<path class="wash"${vars(tone(r, { pc: "--straw", spread: 0.04 }))} d="${glumes}"/>`);
  out.push(`<path class="wash felt"${vars(tone(r, { pc: "--felt", spread: 0.02 }))} d="${feathers}"/>`);
  out.push(`<path class="ink wool" d="${awns}"/>`);
}

export function dunegrass(out: Out, r: Rng, base: Pt) {
  // 1. Continuous single-piece basal leaf blades framing the hummock base.
  const basalBlades: { O: Pt; dir: number; L: number; W: number }[] = [];
  for (let k = 0; k < 22; k++) {
    const u = k / 21;
    const p0 = add(base, [(u - 0.5) * 84, 0]);
    const dir = rad(-112 + u * 64 + (r() - 0.5) * 4);
    const L = (210 + Math.sin(u * Math.PI) * 110) * (0.88 + r() * 0.16);
    basalBlades.push({ O: p0, dir, L, W: 0.036 });
  }
  part(out, 0.04, base, () => bladeBunch(out, basalBlades, tone(r, { dl: -0.04, spread: 0.04 })));

  // 2. Fourteen smooth, continuous bamboo-knotted cane culms curving in the Namib wind.
  const culms = 14;
  for (let k = 0; k < culms; k++) {
    const u = k / (culms - 1);
    const lean = -0.28 + u * 1.08 + (r() - 0.5) * 0.06;
    const H = (355 + Math.sin(u * Math.PI) * 165) * (0.92 + r() * 0.12);
    const p0 = add(base, [(u - 0.5) * 74, 0]);
    const ctrl = add(p0, [lean * H * 0.34 + 10, -H * 0.56]);
    const tip = add(p0, [lean * H * 0.78 + 38, -H]);
    const n = 16;
    const spine = sample(quad(p0, ctrl, tip), n);
    const g0 = 0.06 + (k % 6) * 0.03;
    const g: [number, number] = [g0, g0 + 0.42];
    const res = grow(out, g[0], g[1], () =>
      stalk(out, (t) => spine[Math.round(t * n)], 6.5, 2.8, tone(r, { dl: (k % 2 ? 0.03 : -0.03), spread: 0.04 }), n),
    );

    // Swollen dark bamboo-like node rings and stiff rolled cauline leaf blades along the continuous culm.
    for (const ni of [6, 11]) {
      const np = res.pts[ni];
      const na = angleOf(res.pts, ni);
      part(out, gate(res, g, ni) + 0.02, np, () => {
        const nrm = polar(3.8, na + Math.PI / 2);
        out.push(`<path class="ink mid" d="M${P1(sub(np, nrm))}L${P1(add(np, nrm))}"/>`);
        if (ni === 6 && k % 2 === 0) {
          bladeBunch(out, [{ O: np, dir: na + rad(34), L: 98 + r() * 24, W: 0.045 }], tone(r, { dl: 0.04, spread: 0.04 }));
        }
      });
    }

    // Feathery silver-cream plumose panicle at the culm apex.
    const tipPt = res.pts[n];
    const tipA = angleOf(res.pts, n) + 0.12;
    part(out, gate(res, g, n) + 0.03, tipPt, () => dunegrassPlume(out, r, tipPt, tipA, 96));
  }
}

// ---------------------------------------------------------------------------
// 9. Bushman's candle (Monsonia crassicaulis, syn. Sarcocaulon crassicaule): dwarf resin-waxy spiny
// shrublet of pale-grey branches armed with long petiolar spines, small crenate-folded glaucous
// leaves, and crinkly translucent sulphur-yellow 5-petalled saucer flowers.

export function candleFlower(out: Out, r: Rng, C: Pt, R: number, tilt = 0.78) {
  // Five broad obovate-wedge petals with crinkly/erose outer margins in translucent sulphur-yellow.
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k / 5) * Math.PI * 2;
    const toW = (p: Pt) => {
      const pr = rot(p, a);
      return add(C, [pr[0], pr[1] * tilt]);
    };
    const pts: Pt[] = [
      [3, -2],
      [R * 0.52, -R * 0.36],
      [R * 0.94, -R * 0.44],
      [R * 1.02, -R * 0.22],
      [R * 0.96, 0],
      [R * 1.03, R * 0.22],
      [R * 0.94, R * 0.44],
      [R * 0.52, R * 0.36],
      [3, 2],
    ].map(toW);
    shape(out, r, pts, tone(r, { pc: "--flower-candle", dl: (k % 2 ? 0.02 : -0.02), spread: 0.03, hue: 4 }), { deep: 0.22 });
    // Delicate radial crease lines on the crinkly tissue-thin petal.
    let creases = "";
    for (const dy of [-0.22, 0, 0.22]) {
      creases += `M${P1(toW([R * 0.2, dy * R * 0.3]))}L${P1(toW([R * 0.88, dy * R]))}`;
    }
    out.push(`<path class="ink hair vein" d="${creases}"/>`);
  }
  // Warm golden-amber center and ring of 15 stamens.
  shape(out, r, roundPts(C, R * 0.26, R * 0.26 * tilt, 0, 10), tone(r, { pc: "--fruit-nara", spread: 0.03 }), { deep: 0 });
  shape(out, r, roundPts(C, R * 0.14, R * 0.14 * tilt, 0, 8), tone(r, { pc: "--flower-quiver", dl: 0.06, spread: 0.03 }), { deep: 0 });
}

export function bushmanscandle(out: Out, r: Rng, base: Pt) {
  const branches = [
    { ctrl: [[-64, -14], [-134, -36], [-186, -68]] as Pt[], g: [0.09, 0.49] as [number, number], fR: 34 },
    { ctrl: [[-48, -36], [-106, -84], [-148, -138]] as Pt[], g: [0.06, 0.46] as [number, number], fR: 38 },
    { ctrl: [[-20, -64], [-44, -138], [-62, -198]] as Pt[], g: [0.02, 0.42] as [number, number], fR: 42 },
    { ctrl: [[18, -68], [34, -142], [46, -204]] as Pt[], g: [0.03, 0.43] as [number, number], fR: 42 },
    { ctrl: [[52, -38], [112, -88], [154, -142]] as Pt[], g: [0.07, 0.47] as [number, number], fR: 38 },
    { ctrl: [[66, -16], [138, -38], [190, -72]] as Pt[], g: [0.1, 0.5] as [number, number], fR: 34 },
  ];

  for (const br of branches) {
    const res = grow(out, br.g[0], br.g[1], () =>
      limb(out, r, [add(base, [0, 8]), ...br.ctrl.map((d) => add(base, d))], {
        w0: 26,
        w1: 12,
        pc: "--bark-halfmens",
        cap: "blunt",
      }),
    );
    // Long pale petiolar spines + small axillary tufts of folded crenate glaucous leaves.
    for (let i = 3; i <= res.n - 2; i += 3) {
      const p = res.pts[i];
      const a = angleOf(res.pts, i);
      part(out, gate(res, br.g, i) + 0.02, p, () => {
        let spines = "";
        for (const sg of [-1, 1]) {
          const sDir = a + sg * rad(58);
          const sTip = add(p, polar(24 + r() * 6, sDir));
          const nrm = polar(1.5, sDir + Math.PI / 2);
          spines += `M${P1(add(p, nrm))}L${P1(sTip)}L${P1(sub(p, nrm))}Z`;
          // Small crenate-toothed glaucous leaf nestled at the spine base.
          const lC = add(p, polar(11, sDir - sg * 0.28));
          const lPts = roundPts(lC, 11, 7.5, sDir, 9);
          shape(out, r, lPts, tone(r, { dl: sg > 0 ? 0.03 : -0.03, spread: 0.04 }), { deep: 0.3 });
        }
        out.push(`<path class="wash"${vars(tone(r, { pc: "--spine", spread: 0.03 }))} d="${spines}"/><path class="ink hair" d="${spines}"/>`);
      });
    }
    // Solitary crinkly sulphur-yellow saucer flowers perched along the upper nodes and branch tip.
    for (const [idx, rMul] of [
      [Math.round(res.n * 0.62), 0.86],
      [res.n, 1.0],
    ] as const) {
      const fp = res.pts[idx];
      const fC = add(fp, [0, -18]);
      part(out, gate(res, br.g, idx) + 0.04, fp, () => {
        out.push(`<path class="ink thin" d="M${P1(fp)}L${P1(fC)}"/>`);
        candleFlower(out, r, fC, br.fR * rMul, 0.76);
      });
    }
  }
}

// ---------------------------------------------------------------------------
// 10. Ghaap (Hoodia gordonii): tight upright cluster of multi-ribbed grey-tan succulent cylinders
// studded with single-spined mammillate tubercles, crowned near the apex by flat five-angled
// flesh-pink to dusty rose-maroon saucer corollas with five tail-like points.

export function hoodiaFlower(out: Out, r: Rng, C: Pt, R: number, tilt = 0.72) {
  // Five-angled pentagonal rotate saucer corolla with 5 short tail-like points (3–6 mm) at the corners.
  const pts: Pt[] = [];
  let ribs = "";
  const corners = 5;
  for (let k = 0; k < corners; k++) {
    const a0 = -Math.PI / 2 + (k / corners) * Math.PI * 2;
    const aMid = a0 + Math.PI / corners;
    const cPt: Pt = [C[0] + Math.cos(a0) * R, C[1] + Math.sin(a0) * R * tilt];
    const tailTip: Pt = [C[0] + Math.cos(a0) * R * 1.14, C[1] + Math.sin(a0) * R * 1.14 * tilt];
    const sideL: Pt = [C[0] + Math.cos(a0 - 0.06) * R * 0.96, C[1] + Math.sin(a0 - 0.06) * R * 0.96 * tilt];
    const sideR: Pt = [C[0] + Math.cos(a0 + 0.06) * R * 0.96, C[1] + Math.sin(a0 + 0.06) * R * 0.96 * tilt];
    const mPt: Pt = [C[0] + Math.cos(aMid) * R * 0.84, C[1] + Math.sin(aMid) * R * 0.84 * tilt];
    pts.push(sideL, tailTip, sideR, mPt);
    ribs += `M${P1(C)}L${P1(cPt)}`;
  }
  shape(out, r, pts, tone(r, { pc: "--flower-hoodia", spread: 0.04, hue: 6 }), { deep: 0.32, deepAbout: add(C, [0, R * 0.18 * tilt]) });
  // Concentric maroon-rose inner zone and five radiating buff mid-ribs.
  const innerZone = roundPts(C, R * 0.52, R * 0.52 * tilt, 0, 12);
  shape(out, r, innerZone, tone(r, { pc: "--flower-hoodia", dl: -0.08, spread: 0.03, dh: -6, hue: 6 }), { deep: 0, ink: false });
  out.push(`<path class="ink thin" style="stroke:var(--straw);stroke-opacity:0.65" d="${ribs}"/>`);
  // Concentric papillate ring lines around the central tube and tiny dark 5-starred corona.
  let rings = "";
  for (const f of [0.28, 0.48, 0.68]) {
    rings += closed(roundPts(C, R * f, R * f * tilt, 0, 10));
  }
  out.push(`<path class="ink hair" style="stroke:var(--stem-protea);stroke-opacity:0.45" d="${rings}"/>`);
  shape(out, r, roundPts(C, R * 0.14, R * 0.14 * tilt, 0, 8), tone(r, { pc: "--bark-thorn", spread: 0.02 }), { deep: 0 });
}

export function hoodia(out: Out, r: Rng, base: Pt) {
  const stems = [
    { x0: -52, lean: -0.18, H: 195, w: 28, g: [0.08, 0.48] as [number, number], fl: [0, 34] as [number, number] },
    { x0: -26, lean: -0.08, H: 245, w: 32, g: [0.04, 0.44] as [number, number], fl: [-10, 42] as [number, number] },
    { x0: 2, lean: 0.01, H: 265, w: 34, g: [0.02, 0.42] as [number, number], fl: [4, 46] as [number, number] },
    { x0: 28, lean: 0.09, H: 235, w: 32, g: [0.05, 0.45] as [number, number], fl: [12, 40] as [number, number] },
    { x0: 54, lean: 0.2, H: 185, w: 28, g: [0.09, 0.49] as [number, number], fl: [0, 0] as [number, number] },
  ];

  for (const st of stems) {
    const n = 18;
    const spine = sample((t) => add(base, [st.x0 + t * st.H * st.lean, -t * st.H]), n);
    const res = grow(out, st.g[0], st.g[1], () => {
      const l = limb(out, r, [spine[0], spine[6], spine[12], spine[n]], {
        w0: st.w,
        w1: st.w * 0.82,
        pc: "--pl-hoodia",
        cap: "blunt",
      });
      // Vertical rib grooves and grid of mammillate tubercles across the cylinder face.
      let ribs = "";
      for (const u of [-0.28, 0, 0.28]) {
        const ribPts = l.pts.slice(1, -1).map((p, i) => add(p, [u * st.w, 0] as Pt));
        ribs += line(ribPts);
      }
      for (let i = 2; i < l.n - 1; i += 2) {
        const p = l.pts[i];
        const hw = st.w * 0.44;
        ribs += `M${P1([p[0] - hw, p[1]])}L${P1([p[0] + hw, p[1]])}`;
      }
      out.push(`<path class="ink hair" d="${ribs}"/>`);
      return l;
    });

    // Single sharp pale-brown spine on each marginal and facial tubercle, anchored at node p!
    for (let i = 2; i <= res.n - 1; i += 2) {
      const p = res.pts[i];
      const hw = st.w * 0.48;
      part(out, gate(res, st.g, i) + 0.02, p, () => {
        let sp = "";
        for (const sg of [-1, 1]) {
          const ep = add(p, [sg * hw, 0]);
          sp += `M${P1(ep)}L${P1(add(ep, [sg * 7.5, -2.5]))}`;
        }
        sp += `M${P1(p)}L${P1(add(p, [0, -5]))}`;
        out.push(`<path class="ink thin" style="stroke:var(--spine)" d="${sp}"/>`);
      });
    }

    // Flat pentagonal flesh-pink saucer corolla crowning the stem sub-apex.
    if (st.fl[1] > 0) {
      const fi = res.n - 2;
      const fp = res.pts[fi];
      const fC = add(fp, [st.fl[0], -14]);
      part(out, gate(res, st.g, fi) + 0.04, fp, () => hoodiaFlower(out, r, fC, st.fl[1], 0.72));
    }
  }
}

// ---------------------------------------------------------------------------
// 11. Rusch's living stones (Lithops ruschiorum): foreground clumps of cordate, convex pearl-grey
// and bone-ochre fused pebble leaf pairs split by a shallow V-cleft, with 5-chambered seed capsules
// and a golden-yellow daisy flower nestled in quartz gravel.

export function lithopsBody(out: Out, r: Rng, C: Pt, W: number, H: number, tilt: number, mode: "plain" | "capsule" | "flower") {
  const toW = (p: Pt) => add(C, rot(p, tilt));
  // Cordate (heart-shaped in profile) fused leaf pair with two convex rounded domes and a shallow V-cleft.
  const pts: Pt[] = [
    [-W * 0.34, 0],
    [-W * 0.52, -H * 0.42],
    [-W * 0.48, -H * 0.86],
    [-W * 0.24, -H * 1.02],
    [0, -H * 0.8], // V-notch between the two convex lobes
    [W * 0.24, -H * 1.02],
    [W * 0.48, -H * 0.86],
    [W * 0.52, -H * 0.42],
    [W * 0.34, 0],
  ].map(toW);
  shape(out, r, pts, tone(r, { spread: 0.04, hue: 6 }), { deep: 0.38, deepAbout: toW([W * 0.18, -H * 0.32]) });
  // Central fissure crease and delicate reddish-ochre dendritic rubrication lines + translucent dots on the convex lobes.
  const cleft = `M${P1(toW([0, -H * 0.8]))}L${P1(toW([0, -H * 0.52]))}M${P1(toW([-W * 0.08, -H * 0.86]))}Q${P1(toW([0, -H * 0.78]))} ${P1(toW([W * 0.08, -H * 0.86]))}`;
  out.push(`<path class="ink thin" d="${cleft}"/>`);
  let rubric = "";
  let dots = "";
  for (const sg of [-1, 1]) {
    rubric += `M${P1(toW([sg * W * 0.14, -H * 0.76]))}L${P1(toW([sg * W * 0.28, -H * 0.86]))}L${P1(toW([sg * W * 0.34, -H * 0.78]))}`;
    for (const [dx, dy] of [
      [0.18, -0.82],
      [0.28, -0.74],
      [0.22, -0.68],
    ] as const) {
      dots += closed(roundPts(toW([sg * dx * W, dy * H]), 1.8, 1.4, tilt, 5));
    }
  }
  out.push(`<path class="ink hair" style="stroke:var(--cone-welwitschia);stroke-opacity:0.55" d="${rubric}"/>`);
  out.push(`<path class="wash"${vars(tone(r, { pc: "--cone-welwitschia", dl: -0.06, spread: 0.04 }))} d="${dots}"/>`);

  if (mode === "capsule") {
    // Persistent 5-chambered woody capsule wedged inside the V-cleft.
    const capC = toW([0, -H * 0.82]);
    shape(out, r, roundPts(capC, W * 0.19, W * 0.11, tilt, 10), tone(r, { pc: "--bark-cork", dl: -0.05, spread: 0.03 }), { deep: 0.3 });
    let locules = "";
    for (let k = 0; k < 5; k++) {
      const a = tilt - Math.PI / 2 + (k / 5) * Math.PI * 2;
      locules += `M${P1(capC)}L${P1(add(capC, [Math.cos(a) * W * 0.18, Math.sin(a) * W * 0.1]))}`;
    }
    out.push(`<path class="ink hair" d="${locules}"/>`);
  } else if (mode === "flower") {
    // Bright golden-yellow multi-petalled daisy flower emerging from the cleft.
    const flC = toW([0, -H * 1.05]);
    let rays = "";
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      const mid = add(flC, [Math.cos(a) * W * 0.28, Math.sin(a) * W * 0.18]);
      rays += closed(roundPts(mid, W * 0.24, W * 0.052, a, 6));
    }
    out.push(`<path class="wash petal"${vars(tone(r, { pc: "--flower-quiver", spread: 0.03 }))} d="${rays}"/><path class="ink hair" d="${rays}"/>`);
    shape(out, r, roundPts(flC, W * 0.12, W * 0.08, 0, 8), tone(r, { pc: "--cone-protea", spread: 0.02 }), { deep: 0 });
  }
}

export function lithops(out: Out, r: Rng, base: Pt) {
  // Angular quartz and dolerite desert pebbles around the living stones.
  part(out, 0.02, base, () => {
    for (const [dx, dy, rx, ry, pc] of [
      [-92, -6, 18, 10, "--felt"],
      [-58, 4, 14, 8, "--bark-cork"],
      [56, 2, 16, 9, "--felt"],
      [94, -5, 20, 11, "--bark-halfmens"],
    ] as const) {
      shape(out, r, roundPts(add(base, [dx, dy]), rx, ry, (r() - 0.5) * 0.4, 6), tone(r, { pc, spread: 0.04 }), { deep: 0.25 });
    }
  });

  // Multi-headed clump of cordate pearl-grey / bone-ochre Lithops ruschiorum bodies.
  const bodies: [number, number, number, number, number, "plain" | "capsule" | "flower", number][] = [
    [-68, -4, 42, 48, -0.18, "plain", 0.08],
    [-32, -8, 48, 56, -0.08, "capsule", 0.12],
    [4, -10, 52, 62, 0.03, "flower", 0.16],
    [40, -6, 46, 54, 0.12, "capsule", 0.14],
    [72, -2, 40, 46, 0.2, "plain", 0.1],
    [-14, 4, 44, 48, -0.04, "plain", 0.2],
    [24, 4, 42, 46, 0.06, "plain", 0.22],
  ];
  for (const [dx, dy, W, H, tilt, mode, g0] of bodies) {
    const p = add(base, [dx, dy]);
    part(out, g0, p, () => lithopsBody(out, r, p, W, H, tilt, mode));
  }
}

// ---------------------------------------------------------------------------
// Close-study detail drawings for the gallery (180x165 viewBox, centered around [0, 0]).

export function halfmensDetail(out: Out, r: Rng) {
  const col = limb(out, r, [[-18, 148], [-4, 82], [8, 22]], {
    w0: 46,
    w1: 32,
    pc: "--bark-halfmens",
    cap: "blunt",
  });
  for (let i = 2; i <= col.n - 2; i += 2) {
    const p = col.pts[i];
    let sp = "";
    for (const sg of [-1, 1]) {
      const ep = add(p, [sg * 18, 0]);
      sp += `M${P1(ep)}L${P1(add(ep, [sg * 16, -8]))}M${P1(ep)}L${P1(add(ep, [sg * 16, 6]))}M${P1(ep)}L${P1(add(ep, [sg * 10, -1]))}`;
    }
    out.push(`<path class="ink thin" style="stroke:var(--bark-thorn)" d="${sp}"/>`);
  }
  halfmensCrest(out, r, [8, 22], rad(12), 72);
}

export function buttertreeDetail(out: Out, r: Rng) {
  limb(out, r, [[-12, 148], [0, 92], [6, 44]], { w0: 52, w1: 30, pc: "--bark-butter", cap: "blunt" });
  out.push(`<path class="wash"${vars(tone(r, { pc: "--pl-gifboom", dl: 0.04, spread: 0.03 }))} d="${closed(roundPts([0, 96], 10, 18, rad(6), 8))}"/>`);
  for (const [x, y, sg] of [
    [-20, 112, -1],
    [20, 88, 1],
  ] as const) {
    const curl = [[x - sg * 6, y - 6] as Pt, [x + sg * 20, y - 12] as Pt, [x + sg * 24, y + 6] as Pt, [x + sg * 8, y + 14] as Pt, [x - sg * 6, y + 6] as Pt];
    shape(out, r, curl, tone(r, { pc: "--bark-butter", dl: 0.07, spread: 0.04 }), { deep: 0.25 });
  }
  butterTip(out, r, [6, 44], rad(6), 68, true);
}

export function damaraDetail(out: Out, r: Rng) {
  for (const [x0, lean, H, cap] of [
    [-46, -0.14, 240, true],
    [0, 0.02, 265, true],
    [46, 0.16, 235, false],
  ] as const) {
    const n = 12;
    const spine = sample((t) => [x0 + t * H * lean, 140 - t * H] as Pt, n);
    stalk(out, (t) => spine[Math.round(t * n)], 15, 11, tone(r, { spread: 0.04 }), n);
    damaraTip(out, r, spine[n], -Math.PI / 2 + lean, cap);
  }
}

export function gifboomDetail(out: Out, r: Rng) {
  // Constricted Euphorbia virosa rib segment hosting a flowering Tapinanthus oleifolius mistletoe clump.
  const n = 16;
  const spine = sample((t) => [-28, 145 - t * 265] as Pt, n);
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const pinch = 0.62 + 0.38 * Math.sin(t * 3 * Math.PI) ** 2;
    const hw = 22 * pinch;
    L.push([-28 - hw, spine[i][1]]);
    R.push([-28 + hw, spine[i][1]]);
  }
  shape(out, r, [...L, ...[...R].reverse()], tone(r, { spread: 0.04 }), { deep: 0.4 });
  out.push(`<path class="ink mid" style="stroke:var(--bark-halfmens)" d="${line(L)}${line(R)}"/>`);
  mistletoeClump(out, r, [-14, 15], 1.12);
}

export function naraDetail(out: Out, r: Rng) {
  const spine = sample(quad([-75, 45], [0, -55], [78, -25]), 12);
  stalk(out, (t) => spine[Math.round(t * 12)], 10, 6, tone(r, { spread: 0.04 }), 12);
  for (const i of [3, 7, 10]) {
    const p = spine[i];
    const a = angleOf(spine, i);
    for (const sg of [-1, 1]) {
      const sTip = add(p, polar(28, a + sg * rad(68)));
      out.push(`<path class="ink mid" style="stroke:var(--spine)" d="M${P1(p)}L${P1(sTip)}"/>`);
    }
    if (i === 7) naraFlower(out, r, p, a - rad(58), 24);
  }
  naraMelon(out, r, [6, 38], 52);
}

export function welwitschiaDetail(out: Out, r: Rng) {
  welwitschiaStrap(out, r, [-35, 32], 1, 138);
  welwitschiaPanicle(out, r, [-35, 32], 1, 1.25);
}

export function dunegrassDetail(out: Out, r: Rng) {
  for (const [x0, y0, dir, L] of [
    [-38, 95, rad(-68), 115],
    [8, 110, rad(-62), 125],
  ] as const) {
    stalk(out, quad([x0 - 18, 148], [x0 - 8, 120], [x0, y0]), 6, 3.5, tone(r, { spread: 0.03 }), 6);
    dunegrassPlume(out, r, [x0, y0], dir, L);
  }
}

export function bushmanscandleDetail(out: Out, r: Rng) {
  const br = limb(out, r, [[-68, 118], [-6, 62], [56, 26]], { w0: 24, w1: 13, pc: "--bark-halfmens", cap: "blunt" });
  // Spines and small folded glaucous leaves along the detail branch.
  for (const i of [5, 10, 15]) {
    const p = br.pts[i];
    const a = angleOf(br.pts, i);
    let sp = "";
    for (const sg of [-1, 1]) {
      const sDir = a + sg * rad(58);
      const sTip = add(p, polar(26, sDir));
      const nrm = polar(1.5, sDir + Math.PI / 2);
      sp += `M${P1(add(p, nrm))}L${P1(sTip)}L${P1(sub(p, nrm))}Z`;
      shape(out, r, roundPts(add(p, polar(12, sDir - sg * 0.28)), 12, 8, sDir, 9), tone(r, { dl: sg * 0.03, spread: 0.04 }), { deep: 0.3 });
    }
    out.push(`<path class="wash"${vars(tone(r, { pc: "--spine", spread: 0.03 }))} d="${sp}"/><path class="ink hair" d="${sp}"/>`);
  }
  // Pedicels connecting the two crinkly sulphur-yellow saucer flowers to the branch nodes.
  const p1 = br.pts[9];
  const p2 = br.pts[16];
  out.push(`<path class="ink thin" d="M${P1(p1)}L${P1([-14, -8])}M${P1(p2)}L${P1([46, -22])}"/>`);
  candleFlower(out, r, [-14, -8], 50, 0.82);
  candleFlower(out, r, [46, -22], 44, 0.78);
}

export function hoodiaDetail(out: Out, r: Rng) {
  limb(out, r, [[0, 148], [0, 82], [0, 28]], { w0: 38, w1: 32, pc: "--pl-hoodia", cap: "blunt" });
  hoodiaFlower(out, r, [0, -12], 68, 0.82);
}

export function lithopsDetail(out: Out, r: Rng) {
  lithopsBody(out, r, [-36, 52], 64, 74, -0.1, "capsule");
  lithopsBody(out, r, [34, 56], 68, 78, 0.08, "flower");
}
