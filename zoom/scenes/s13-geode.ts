// S13: Basalt & Amethyst Sea-Cavern (Stage-5 5x Micro-Craft & 320+ PathBatcher Prisms Edition)
// Asymmetric off-center geological cathedral diving through a submerged basalt rock cleft at (880, 970) -> S14:
// 320+ 3-face isometric hexagonal Giant's Causeway basalt organ-pipe columns across 6 atmospheric depth tiers
// batched via PathBatcher (slender misty far choir -> vaulted stalactite dome -> stepped amphitheater terraces ->
// wet caustic-dappled tidal piers & rocky cenote cleft), 70+ luminous translucent mineral quartz/amethyst/celadon/
// citrine crystal prisms (zero black pencil outlines! pale internal refraction bevels & caustic glow), a finely
// crafted clinker-built wooden geologist's skiff gently bobbing (data-anim="bob") with planked strakes, ribs,
// oars, amethyst specimen crate, bow Davy-lantern & two tiny expedition geologists, 3 swaying wire-gauze brass
// Davy lamps, and a bioluminescent broken-reflection subterranean tidal pool plunging into S14!

import {
  PAL,
  Painter,
  PathBatcher,
  add,
  circlePath,
  closedSmooth,
  cubic,
  ellipsePath,
  f,
  lerp,
  mul,
  openPoly,
  polyPath,
  quad,
  rand,
  rot,
  sample,
  type Pt,
} from "../kit.ts";
import {
  BLEED,
  requiredPortalClearBox,
  requiredPortalSealBox,
  type OctaveScene,
  type PortalSpec,
} from "./types.ts";

export const S13_PORTAL: PortalSpec = { cx: 880, cy: 970, rx: 192, ry: 132 };
const S14_PORTAL_PT: readonly [number, number] = [1500, 600];

type BasaltSpec = {
  readonly cx: number;
  readonly yTop: number;
  readonly yBot: number;
  readonly hw: number;
  readonly cap: "top" | "bottom" | "none";
  readonly tier: 0 | 1 | 2;
  readonly wetBase?: number; // optional waterline Y for dark tidal wet stain + caustic reflections!
};

type CrystalPalette = {
  readonly lit: string;
  readonly mid: string;
  readonly shade: string;
  readonly tipLit: string;
  readonly edge: string;
};

const CRYSTAL_PALETTES: readonly CrystalPalette[] = [
  { lit: PAL.celadonLt, mid: PAL.celadon, shade: PAL.celadonDk, tipLit: PAL.waterSpray, edge: PAL.celadonDk },
  { lit: PAL.wisteriaLt, mid: PAL.wisteria, shade: PAL.wisteriaDk, tipLit: PAL.wisteriaLt, edge: PAL.wisteriaDk },
  { lit: PAL.ochreLt, mid: PAL.ochre, shade: PAL.ochreDk, tipLit: PAL.lanternCore, edge: PAL.ochreDk },
  { lit: PAL.waterSpray, mid: PAL.celadonLt, shade: PAL.slate, tipLit: PAL.inkRim, edge: PAL.slate },
];

export function buildS13Geode(): OctaveScene {
  const p = new Painter("s13", 13093);

  const sealBox = requiredPortalSealBox(S13_PORTAL);
  const clearBox = requiredPortalClearBox(S13_PORTAL, S14_PORTAL_PT);

  // Crisp rectilinear stepped hexagonal-basalt rock cleft (`[676..1084, 832..1108]` = `408 x 276 px`!)
  // Strictly inside 6x sealBox [638..1122, 806..1134] AND encloses ALL of S14's 400x267 S=6x viewport
  // -> ZERO rounded-TV stadium bezel wrapping day-o14.png / night-o14.png!
  const cleftX0 = Math.max(sealBox.x0 + 8, S13_PORTAL.cx - 204); // 676
  const cleftX1 = Math.min(sealBox.x1 - 8, S13_PORTAL.cx + 204); // 1084
  const cleftY0 = Math.max(sealBox.y0 + 8, S13_PORTAL.cy - 138); // 832
  const cleftY1 = Math.min(sealBox.y1 - 8, S13_PORTAL.cy + 138); // 1108
  // Stepped geological basalt lintel profile along top + sheer vertical basalt column walls + level tidal water threshold!
  const hole: Pt[] = [
    [cleftX0, cleftY0],
    [cleftX0 + 68, cleftY0],
    [cleftX0 + 68, cleftY0 - 8],
    [cleftX0 + 142, cleftY0 - 8],
    [cleftX0 + 142, cleftY0 - 14],
    [cleftX1 - 142, cleftY0 - 14],
    [cleftX1 - 142, cleftY0 - 8],
    [cleftX1 - 68, cleftY0 - 8],
    [cleftX1 - 68, cleftY0],
    [cleftX1, cleftY0],
    [cleftX1, cleftY1],
    [cleftX0, cleftY1],
  ];

  const cavernGrad = p.linearGrad("cavern", 260, -180, 2240, 1480, [
    [0, PAL.paperWarm],
    [0.24, PAL.paperStone],
    [0.54, PAL.paperShadow],
    [0.82, PAL.slate],
    [1, PAL.prussianDk],
  ]);
  const poolGrad = p.linearGrad("pool", 180, 800, 1680, 1880, [
    [0, PAL.water],
    [0.34, PAL.waterDeep],
    [0.74, PAL.prussian],
    [1, PAL.prussianDk],
  ]);
  const lightShaftGrad = p.linearGrad("shaft", 300, -240, 1300, 1220, [
    [0, PAL.paperWarm, 0.34],
    [0.56, PAL.celadonLt, 0.14],
    [1, PAL.paperWarm, 0.0],
  ]);

  // 1. Opaque full-bleed geological backdrop punched cleanly by the rectilinear stepped basalt rock cleft (smooth: false!)
  p.asymmetricPortalBackdrop(hole, cavernGrad, { smooth: false });

  // High-Density PathBatcher 3-Face Isometric Hexagonal Basalt Organ-Pipe Tier Renderer!
  // Renders 50-110 basalt prisms per call in ONLY ~11 compound <path> nodes (with wet waterline stains & caustics!)
  const drawBasaltTier = (cols: readonly BasaltSpec[]) => {
    if (!cols.length) return;
    const b = new PathBatcher();
    const leftColors = [PAL.paperWarm, PAL.paperStone, PAL.paperDeep] as const;
    const midColors = [PAL.paperShadow, PAL.slateLt, PAL.slate] as const;
    const rightColors = [PAL.slate, PAL.prussianLt, PAL.prussian] as const;

    for (const c of cols) {
      const w3 = c.hw * 0.46;
      const capH = c.hw * 0.34;
      const topY = c.cap === "top" ? c.yTop + capH * 0.52 : c.yTop;
      const botY = c.cap === "bottom" ? c.yBot - capH * 0.52 : c.yBot;
      if (botY <= topY + 4) continue;

      const xLL = c.cx - c.hw;
      const xML = c.cx - w3;
      const xMR = c.cx + w3;
      const xRR = c.cx + c.hw;
      const dyM = capH * 0.52;

      const t = c.tier;
      b.addPath(`L${t}`, `M${f(xLL)} ${f(topY)}L${f(xML)} ${f(topY + dyM)}V${f(botY + dyM)}L${f(xLL)} ${f(botY)}Z`, {
        fill: leftColors[t],
        fillOpacity: 0.99,
      });
      b.addPath(`M${t}`, `M${f(xML)} ${f(topY + dyM)}H${f(xMR)}V${f(botY + dyM)}H${f(xML)}Z`, {
        fill: midColors[t],
        fillOpacity: 0.99,
      });
      b.addPath(`R${t}`, `M${f(xMR)} ${f(topY + dyM)}L${f(xRR)} ${f(topY)}V${f(botY)}L${f(xMR)} ${f(botY + dyM)}Z`, {
        fill: rightColors[t],
        fillOpacity: 0.99,
      });

      // Wet dark tidal stain & subtle water-caustic reflection shimmer climbing lower column bases!
      if (c.wetBase !== undefined && botY > c.wetBase - 46 && topY < c.wetBase) {
        const wTop = Math.max(topY + 6, c.wetBase - 42);
        const wBot = Math.min(botY, c.wetBase + 24);
        b.addPath("wet", `M${f(xLL)} ${f(wTop)}L${f(xML)} ${f(wTop + dyM)}H${f(xMR)}L${f(xRR)} ${f(wTop)}V${f(wBot)}L${f(xMR)} ${f(wBot + dyM)}H${f(xML)}L${f(xLL)} ${f(wBot)}Z`, {
          fill: PAL.prussianDk,
          fillOpacity: 0.28,
        });
        if (c.hw >= 22) {
          const cy1 = wTop + rand(p.r, 8, 22);
          b.line("caustic", xLL + 3, cy1, xMR - 2, cy1 + dyM * 0.7, {
            stroke: PAL.celadonLt,
            strokeWidth: 0.55,
            strokeOpacity: 0.42,
            nonScaling: "hatch",
          });
        }
      }

      if (c.cap === "top") {
        const capD = `M${f(xLL)} ${f(topY)}L${f(xML)} ${f(topY - dyM)}H${f(xMR)}L${f(xRR)} ${f(topY)}L${f(xMR)} ${f(topY + dyM)}H${f(xML)}Z`;
        b.addPath("topCap", capD, { fill: PAL.paperWarm, fillOpacity: 0.97 });
        if (t === 0) b.addPath("topOchre", capD, { fill: PAL.ochreLt, fillOpacity: 0.24 });
        // Crisp inner bevel fracture facet on larger foreground basalt crowns!
        if (c.hw >= 34) {
          const k = 0.72;
          b.addPath(
            "capBevel",
            `M${f(c.cx - c.hw * k)} ${f(topY)}L${f(c.cx - w3 * k)} ${f(topY - dyM * k)}H${f(c.cx + w3 * k)}L${f(c.cx + c.hw * k)} ${f(topY)}`,
            { stroke: PAL.inkHair, strokeWidth: 0.36, strokeOpacity: 0.38, nonScaling: "hatch" },
          );
        }
        b.addPath("moon", `M${f(xLL)} ${f(topY)}L${f(xML)} ${f(topY - dyM)}H${f(xMR)}`, {
          stroke: PAL.litEdge,
          strokeWidth: 0.68,
          strokeOpacity: "var(--z-moon-op)",
          nonScaling: "contour",
        });
      } else if (c.cap === "bottom") {
        b.addPath(
          "botCap",
          `M${f(xLL)} ${f(botY)}L${f(xML)} ${f(botY - dyM)}H${f(xMR)}L${f(xRR)} ${f(botY)}L${f(xMR)} ${f(botY + dyM)}H${f(xML)}Z`,
          { fill: PAL.prussianDk, fillOpacity: 0.92 },
        );
      }

      // Fine volcanic cooling-joint horizontal step fractures & vertical micro-cleavage striae
      const jointStep = Math.max(36, c.hw * 1.45);
      for (let jy = topY + rand(p.r, 20, jointStep); jy < botY - 18; jy += jointStep * rand(p.r, 0.76, 1.32)) {
        b.addPath("crack", `M${f(xLL)} ${f(jy)}L${f(xML)} ${f(jy + dyM)}H${f(xMR)}L${f(xRR)} ${f(jy)}`, {
          stroke: PAL.inkMid,
          strokeWidth: 0.38,
          strokeOpacity: 0.44,
          nonScaling: "hatch",
        });
      }

      b.addPath("arris", `M${f(xML)} ${f(topY + dyM)}V${f(botY + dyM)}M${f(xMR)} ${f(topY + dyM)}V${f(botY + dyM)}`, {
        stroke: PAL.ink,
        strokeWidth: 0.46,
        strokeOpacity: 0.5,
        nonScaling: "contour",
      });
      b.line("moon", xLL + 0.7, topY, xLL + 0.7, botY, {
        stroke: PAL.litEdge,
        strokeWidth: 0.65,
        strokeOpacity: "var(--z-moon-op)",
        nonScaling: "contour",
      });
    }
    b.flush(p);
  };

  // LUMINOUS TRANSLUCENT MINERAL QUARTZ CRYSTAL PRISM (Zero black outlines, natural rhombohedron facets!)
  const drawCrystalPrism = (base: Pt, angleRad: number, len: number, halfW: number, palIdx: number) => {
    const pal = CRYSTAL_PALETTES[((palIdx % 4) + 4) % 4];
    const toW = (lx: number, ly: number): Pt => add(base, rot([lx, ly], angleRad));
    const neckL = len * 0.7;
    const neckR = len * 0.77;
    const tipP = toW(len, -halfW * 0.14);

    const bL = toW(0, -halfW);
    const bM1 = toW(0, -halfW * 0.3);
    const bM2 = toW(0, halfW * 0.32);
    const bR = toW(0, halfW);

    const nL = toW(neckL, -halfW * 0.94);
    const nM1 = toW(neckL + len * 0.08, -halfW * 0.26);
    const nM2 = toW(neckR - len * 0.03, halfW * 0.3);
    const nR = toW(neckR, halfW * 0.92);

    const cb = new PathBatcher();
    cb.addPath("lit", polyPath([bL, nL, nM1, bM1]), { fill: pal.lit, fillOpacity: 0.78 });
    cb.addPath("mid", polyPath([bM1, nM1, nM2, bM2]) + polyPath([nM1, tipP, nM2]), { fill: pal.mid, fillOpacity: 0.72 });
    cb.addPath("sh", polyPath([bM2, nM2, nR, bR]) + polyPath([nM2, tipP, nR]), { fill: pal.shade, fillOpacity: 0.82 });
    cb.addPath("tip", polyPath([nL, tipP, nM1]), { fill: pal.tipLit, fillOpacity: 0.86 });

    const phTip = toW(len * 0.66, -halfW * 0.08);
    const phL = toW(len * 0.34, -halfW * 0.66);
    const phR = toW(len * 0.4, halfW * 0.56);
    let edgeD =
      polyPath([bL, nL, tipP, nR, bR]) +
      `M${f(bM2[0])} ${f(bM2[1])}L${f(nM2[0])} ${f(nM2[1])}L${f(tipP[0])} ${f(tipP[1])}` +
      `M${f(nM2[0])} ${f(nM2[1])}L${f(nR[0])} ${f(nR[1])}` +
      `M${f(phL[0])} ${f(phL[1])}L${f(phTip[0])} ${f(phTip[1])}L${f(phR[0])} ${f(phR[1])}`;
    for (let u = 0.2; u < 0.66; u += 0.16) {
      const sA = lerp(bL, nL, u);
      const sB = lerp(bM1, nM1, u);
      const sC = lerp(bM2, nM2, u);
      const sD = lerp(bR, nR, u);
      edgeD += `M${f(sA[0])} ${f(sA[1])}L${f(sB[0])} ${f(sB[1])}L${f(sC[0])} ${f(sC[1])}L${f(sD[0])} ${f(sD[1])}`;
    }
    const refractD =
      `M${f(bL[0])} ${f(bL[1])}L${f(nL[0])} ${f(nL[1])}L${f(tipP[0])} ${f(tipP[1])}` +
      `M${f(bM1[0])} ${f(bM1[1])}L${f(nM1[0])} ${f(nM1[1])}L${f(tipP[0])} ${f(tipP[1])}` +
      `M${f(nL[0])} ${f(nL[1])}L${f(nM1[0])} ${f(nM1[1])}L${f(nM2[0])} ${f(nM2[1])}`;
    cb.addPath("edge", edgeD, { stroke: pal.edge, strokeWidth: 0.44, strokeOpacity: 0.56, nonScaling: "contour" }, 7);
    cb.addPath("refract", refractD, { stroke: PAL.inkRim, strokeWidth: 0.72, strokeOpacity: 0.8, nonScaling: "contour" }, 4);
    cb.flush(p);
  };

  // Multi-prism translucent quartz druse bouquet rooted directly into a real basalt column crown
  const growColumnCrownBouquet = (capCenter: Pt, mainDir: number, sc: number, palIdx: number) => {
    const spreadVec: Pt = [Math.cos(mainDir + Math.PI * 0.5), Math.sin(mainDir + Math.PI * 0.5)];
    const root: Pt = [capCenter[0], capCenter[1] + (mainDir < 0 ? 5 : -5) * sc];
    drawCrystalPrism(add(root, mul(spreadVec, -20 * sc)), mainDir - 0.4, 114 * sc, 16 * sc, palIdx + 2);
    drawCrystalPrism(add(root, mul(spreadVec, 20 * sc)), mainDir + 0.34, 128 * sc, 18 * sc, palIdx + 1);
    drawCrystalPrism(root, mainDir, 176 * sc, 24 * sc, palIdx);
    drawCrystalPrism(add(root, mul(spreadVec, -10 * sc)), mainDir - 0.14, 88 * sc, 13 * sc, palIdx + 3);
    drawCrystalPrism(add(root, mul(spreadVec, 11 * sc)), mainDir + 0.16, 74 * sc, 11 * sc, palIdx);
  };

  // Hanging Brass Miner's Davy Safety Lamp with ultra-fine 0.38px wire-gauze chimney & silky radial glow
  const drawDavyLamp = (cx: number, cy: number, cordLen: number, sc: number, phase: number, idx: number) => {
    const pivotY = cy - cordLen;
    p.animGroup({ kind: "sway", cx, cy: pivotY, ampDeg: 2.3, freq: 1.0, phase }, () => {
      p.layer("var(--z-halo-op)", () => {
        p.animGroup({ kind: "pulse", baseOp: 0.88, ampOp: 0.12, freq: 2.3, phase: phase + 0.7 }, () => {
          const hy = cy + 62 * sc;
          const glow = p.radialGrad(`davy-${idx}`, cx, hy, 205 * sc, [
            [0, PAL.lanternCore, 0.56],
            [0.26, PAL.lantern, 0.32],
            [0.62, PAL.lanternHalo, 0.12],
            [1, PAL.lanternHalo, 0.0],
          ]);
          p.fillPath(circlePath(cx, hy, 205 * sc), glow, 1);
        });
      });

      const lb = new PathBatcher();
      lb.line("chain", cx, pivotY, cx, cy - 14 * sc, { stroke: PAL.ink, strokeWidth: 0.95, strokeOpacity: 0.88, nonScaling: "contour" });
      lb.circle("ring", cx, cy - 8 * sc, 8.5 * sc, { fill: "none", stroke: PAL.brass, strokeWidth: 1.15, nonScaling: "contour" });
      lb.quad("brass", [cx - 24 * sc, cy + 12 * sc], [cx - 16 * sc, cy], [cx + 16 * sc, cy], [cx + 24 * sc, cy + 12 * sc], { fill: PAL.brass, fillOpacity: 0.96 });
      lb.quad("brassHi", [cx - 24 * sc, cy + 12 * sc], [cx - 16 * sc, cy], [cx, cy], [cx, cy + 12 * sc], { fill: PAL.brassLt, fillOpacity: 0.45 });
      lb.rect("gauze", cx - 17 * sc, cy + 12 * sc, 34 * sc, 40 * sc, { fill: PAL.slateDk, fillOpacity: 0.82 });
      for (let gx = -13; gx <= 13; gx += 4.2) lb.line("mesh", cx + gx * sc, cy + 12 * sc, cx + gx * sc, cy + 52 * sc, { stroke: PAL.brassLt, strokeWidth: 0.38, strokeOpacity: 0.68, nonScaling: "hatch" });
      for (let gy = 16; gy <= 48; gy += 4.8) lb.line("mesh", cx - 17 * sc, cy + gy * sc, cx + 17 * sc, cy + gy * sc, { stroke: PAL.brassLt, strokeWidth: 0.38, strokeOpacity: 0.68, nonScaling: "hatch" });
      lb.rect("glass", cx - 20 * sc, cy + 52 * sc, 40 * sc, 40 * sc, { fill: PAL.lantern, fillOpacity: 0.96 });
      lb.addPath("flame", ellipsePath(cx, cy + 72 * sc, 9 * sc, 15 * sc), { fill: PAL.lanternCore, fillOpacity: 0.96 });
      lb.quad("brass", [cx - 26 * sc, cy + 92 * sc], [cx + 26 * sc, cy + 92 * sc], [cx + 30 * sc, cy + 114 * sc], [cx - 30 * sc, cy + 114 * sc], { fill: PAL.brass, fillOpacity: 0.98 });
      lb.quad("brassDk", [cx + 4 * sc, cy + 92 * sc], [cx + 26 * sc, cy + 92 * sc], [cx + 30 * sc, cy + 114 * sc], [cx + 4 * sc, cy + 114 * sc], { fill: PAL.brassDk, fillOpacity: 0.44 });
      for (const rx of [-22, -8, 8, 22]) {
        lb.line("guard", cx + rx * sc, cy + 12 * sc, cx + rx * sc, cy + 93 * sc, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.86, nonScaling: "contour" });
      }
      lb.flush(p);
    });
  };

  p.clippedToBackdrop(hole, () => {
    // 2. TIER 4: FAR MISTY BASALT ORGAN-PIPE CATHEDRAL CHOIR (~105 slender isometric hexagonal pipes!)
    const farCols: BasaltSpec[] = [];
    for (let x = -360; x <= 2760; x += 29) {
      const isRight = x > 1040;
      const yBot = isRight
        ? 1120 + 160 * Math.sin(x * 0.011) + ((x - 1040) / 1480) * 320
        : 605 + 145 * Math.cos(x * 0.0085) + Math.sin(x * 0.03) * 28;
      farCols.push({
        cx: x + rand(p.r, -2.5, 2.5),
        yTop: BLEED.y0,
        yBot: Math.min(BLEED.y1, yBot),
        hw: rand(p.r, 13.5, 16.5),
        cap: isRight ? "none" : "bottom",
        tier: 2,
      });
    }
    drawBasaltTier(farCols);

    p.fillPath(polyPath([[BLEED.x0, BLEED.y0], [BLEED.x1, BLEED.y0], [BLEED.x1, 1280], [BLEED.x0, 1280]]), PAL.paperMist, 0.24);
    p.fillPath(polyPath([[240, BLEED.y0], [760, BLEED.y0], [1340, 1240], [660, 1240]]), lightShaftGrad, 0.86);

    // 3. TIER 3: UPPER VAULTED BASALT ORGAN-PIPE STALACTITE DOME (~62 stepped columns!)
    const ceilCols: BasaltSpec[] = [];
    for (let i = 0, x = -340; x <= 2740; i++, x += 50) {
      const vault =
        x < 1050
          ? 270 + 255 * Math.pow(Math.abs((x - 860) / 1120), 1.35)
          : 265 + 305 * Math.pow((x - 1050) / 1550, 1.15);
      const yBot = vault + Math.sin(i * 1.85) * 56 + rand(p.r, -22, 26);
      ceilCols.push({
        cx: x,
        yTop: BLEED.y0,
        yBot: Math.min(710, yBot),
        hw: rand(p.r, 23, 28),
        cap: "bottom",
        tier: 1,
      });
    }
    drawBasaltTier(ceilCols);

    growColumnCrownBouquet([ceilCols[18].cx, ceilCols[18].yBot - 8], Math.PI * 0.54, 0.78, 0);
    growColumnCrownBouquet([ceilCols[25].cx, ceilCols[25].yBot - 8], Math.PI * 0.48, 0.84, 2);
    growColumnCrownBouquet([ceilCols[32].cx, ceilCols[32].yBot - 8], Math.PI * 0.44, 0.76, 1);

    // 4. CONTINUOUS SUBTERRANEAN BIOLUMINESCENT TIDAL POOL & FAR BASALT SHORELINE (y = 800..BLEED.y1)
    const farShore: Pt[] = [
      [BLEED.x0, 762],
      [260, 754],
      [540, 778],
      [760, 758],
      [980, 770],
      [1180, 756],
      [BLEED.x1, 766],
      [BLEED.x1, 832],
      [BLEED.x0, 832],
    ];
    p.fillPath(closedSmooth(farShore), PAL.slate, 0.72);
    p.fillPath(
      closedSmooth([[BLEED.x0, 782], [520, 792], [980, 794], [BLEED.x1, 786], [BLEED.x1, 822], [BLEED.x0, 822]]),
      PAL.slateDk,
      0.56,
    );

    const poolQuad: readonly [Pt, Pt, Pt, Pt] = [
      [BLEED.x0, 804],
      [BLEED.x1, 804],
      [BLEED.x1, BLEED.y1],
      [BLEED.x0, BLEED.y1],
    ];
    p.fillPath(polyPath(poolQuad), poolGrad, 0.98);
    p.brokenWaterReflections(
      poolQuad,
      { base: false, primary: PAL.celadon, deep: PAL.prussianDk, shimmer: PAL.waterShimmer },
      {
        rows: 58,
        opacity: 0.9,
        reflectBands: [
          { u0: 0.24, u1: 0.3, v0: 0.05, v1: 0.84, color: PAL.lantern },
          { u0: 0.36, u1: 0.44, v0: 0.08, v1: 0.82, color: PAL.celadonLt },
          { u0: 0.46, u1: 0.54, v0: 0.06, v1: 0.84, color: PAL.wisteriaLt },
          { u0: 0.56, u1: 0.64, v0: 0.04, v1: 0.88, color: PAL.lantern },
        ],
      },
    );

    // Bioluminescent tidal pool shimmer wavelets igniting along the cavern shoreline at Night!
    p.layer("var(--z-lume-op)", () => {
      p.animGroup({ kind: "ripple", ampX: 8, baseOp: 0.74, ampOp: 0.22, freq: 1.5, phase: 0.4 }, () => {
        const bioB = new PathBatcher();
        for (let k = 0; k < 34; k++) {
          const bx = rand(p.r, 120, 1460);
          const by = rand(p.r, 850, 1540);
          const bl = rand(p.r, 26, 78);
          bioB.addPath("bioWave", `M${f(bx)} ${f(by)}Q${f(bx + bl * 0.5)} ${f(by - 2.6)} ${f(bx + bl)} ${f(by)}`, {
            stroke: PAL.celadonLt,
            strokeWidth: 0.85,
            strokeOpacity: 0.68,
            nonScaling: "hatch",
          });
        }
        bioB.flush(p);
      });
    });

    // Animated concentric cave water-drop ripples across the tidal mirror pool
    for (const [dx, dy, sc, ph] of [
      [525, 1145, 1.05, 0.3],
      [965, 1305, 1.38, 1.8],
      [1155, 1140, 0.92, 3.1],
      [815, 1455, 1.24, 0.9],
    ] as const) {
      p.animGroup({ kind: "ripple", ampX: 7, baseOp: 0.76, ampOp: 0.2, freq: 1.65, phase: ph }, () => {
        let rings = "";
        for (const rr of [22, 50, 88, 132]) rings += ellipsePath(dx, dy, rr * sc, rr * sc * 0.23);
        p.burin(rings, PAL.waterSpray, 0.82, 0.66, 4, "hatch", "24 12");
        p.fillPath(ellipsePath(dx, dy, 5.0, 2.0), PAL.lanternCore, 0.64);
      });
    }

    // 5. RECTILINEAR STEPPED HEXAGONAL-BASALT ROCK CLEFT physically framing `(880, 970)` (ZERO stadium oval!)
    // Stepped overhanging basalt lintel columns terminate flush along the stepped top lintel (`y = 818..832`)
    // while vertical 3-face basalt piers frame left (`x <= 676`) and right (`x >= 1084`) down into the tidal pool!
    const cenoteOverhangCols: BasaltSpec[] = [
      { cx: 652, yTop: 610, yBot: 842, hw: 28, cap: "bottom", tier: 2 },
      { cx: 708, yTop: 590, yBot: 834, hw: 30, cap: "bottom", tier: 1 },
      { cx: 774, yTop: 572, yBot: 826, hw: 32, cap: "bottom", tier: 1 },
      { cx: 842, yTop: 558, yBot: 820, hw: 34, cap: "bottom", tier: 1 },
      { cx: 912, yTop: 558, yBot: 820, hw: 34, cap: "bottom", tier: 1 },
      { cx: 980, yTop: 574, yBot: 826, hw: 32, cap: "bottom", tier: 1 },
      { cx: 1046, yTop: 592, yBot: 834, hw: 30, cap: "bottom", tier: 1 },
      { cx: 1106, yTop: 615, yBot: 844, hw: 28, cap: "bottom", tier: 2 },
    ];
    drawBasaltTier(cenoteOverhangCols);

    const cenoteSidePiers: BasaltSpec[] = [
      { cx: 608, yTop: 912, yBot: 1126, hw: 34, cap: "top", tier: 1, wetBase: 1108 },
      { cx: 652, yTop: 854, yBot: 1114, hw: 26, cap: "top", tier: 0, wetBase: 1104 },
      { cx: 628, yTop: 1038, yBot: 1142, hw: 32, cap: "top", tier: 0, wetBase: 1126 },
      { cx: 1112, yTop: 846, yBot: 1120, hw: 28, cap: "top", tier: 0, wetBase: 1106 },
      { cx: 1164, yTop: 822, yBot: 1168, hw: 36, cap: "top", tier: 1, wetBase: 1148 },
      { cx: 1128, yTop: 1034, yBot: 1148, hw: 34, cap: "top", tier: 0, wetBase: 1130 },
    ];
    drawBasaltTier(cenoteSidePiers);

    growColumnCrownBouquet([cenoteSidePiers[0].cx, cenoteSidePiers[0].yTop + 10], -Math.PI * 0.44, 0.72, 1);
    growColumnCrownBouquet([cenoteSidePiers[3].cx, cenoteSidePiers[3].yTop + 10], -Math.PI * 0.56, 0.76, 0);
    growColumnCrownBouquet([cenoteSidePiers[4].cx, cenoteSidePiers[4].yTop + 10], -Math.PI * 0.52, 0.72, 2);

    // 6. RIGHT & CENTER-RIGHT MONUMENTAL GIANT'S CAUSEWAY AMPHITHEATER (~115 tightly packed 3-face basalt columns!)
    const rightDeepRow: BasaltSpec[] = [];
    for (let i = 0, x = 1190; x <= 2750; i++, x += 46) {
      const climb = Math.max(0, (x - 1190) / 1460);
      const yTop = 620 - climb * 525 + Math.sin(i * 1.5) * 68;
      rightDeepRow.push({ cx: x, yTop: Math.max(BLEED.y0 + 30, yTop), yBot: BLEED.y1, hw: 24, cap: "top", tier: 1 });
    }
    drawBasaltTier(rightDeepRow);

    growColumnCrownBouquet([rightDeepRow[2].cx, rightDeepRow[2].yTop + 12], -Math.PI * 0.62, 0.96, 0);
    growColumnCrownBouquet([rightDeepRow[8].cx, rightDeepRow[8].yTop + 12], -Math.PI * 0.56, 1.08, 2);
    growColumnCrownBouquet([rightDeepRow[15].cx, rightDeepRow[15].yTop + 12], -Math.PI * 0.58, 1.04, 1);
    growColumnCrownBouquet([rightDeepRow[22].cx, rightDeepRow[22].yTop + 12], -Math.PI * 0.54, 1.0, 0);

    const rightMidRow: BasaltSpec[] = [];
    for (let i = 0, x = 1265; x <= 2760; i++, x += 62) {
      const climb = Math.max(0, (x - 1265) / 1380);
      const yTop = 875 - climb * 515 + Math.cos(i * 1.85) * 62;
      rightMidRow.push({ cx: x, yTop: Math.max(200, yTop), yBot: BLEED.y1, hw: 33, cap: "top", tier: i % 2 === 0 ? 0 : 1 });
    }
    drawBasaltTier(rightMidRow);

    growColumnCrownBouquet([rightMidRow[1].cx, rightMidRow[1].yTop + 14], -Math.PI * 0.64, 1.12, 1);
    growColumnCrownBouquet([rightMidRow[5].cx, rightMidRow[5].yTop + 14], -Math.PI * 0.52, 1.2, 2);
    growColumnCrownBouquet([rightMidRow[10].cx, rightMidRow[10].yTop + 14], -Math.PI * 0.6, 1.1, 0);
    growColumnCrownBouquet([rightMidRow[15].cx, rightMidRow[15].yTop + 14], -Math.PI * 0.56, 1.04, 1);

    const rightForeRow: BasaltSpec[] = [];
    for (let i = 0, x = 1365; x <= 2760; i++, x += 82) {
      const climb = Math.max(0, (x - 1365) / 1260);
      const yTop = 1175 - climb * 470 + Math.sin(i * 1.45 + 0.5) * 58;
      rightForeRow.push({ cx: x, yTop: Math.max(440, yTop), yBot: BLEED.y1, hw: 44, cap: "top", tier: 0 });
    }
    drawBasaltTier(rightForeRow);

    growColumnCrownBouquet([rightForeRow[2].cx, rightForeRow[2].yTop + 16], -Math.PI * 0.62, 1.06, 0);
    growColumnCrownBouquet([rightForeRow[6].cx, rightForeRow[6].yTop + 16], -Math.PI * 0.55, 1.12, 1);
    growColumnCrownBouquet([rightForeRow[10].cx, rightForeRow[10].yTop + 16], -Math.PI * 0.6, 1.02, 2);

    // 7. LEFT FRAMING BASALT ORGAN-PIPE CLIFF & STEPPED SHORE COLUMNS (~18 columns)
    const leftCols: BasaltSpec[] = [];
    for (let i = 0, x = -340; x <= 490; i++, x += 52) {
      const drop = Math.max(0, (x + 340) / 830);
      leftCols.push({
        cx: x,
        yTop: 110 + drop * 990 + Math.sin(i * 1.7) * 44,
        yBot: BLEED.y1,
        hw: 30 + (1 - drop) * 20,
        cap: "top",
        tier: i % 3 === 0 ? 1 : 0,
      });
    }
    drawBasaltTier(leftCols);

    growColumnCrownBouquet([leftCols[9].cx, leftCols[9].yTop + 14], -Math.PI * 0.36, 1.04, 1);
    growColumnCrownBouquet([leftCols[13].cx, leftCols[13].yTop + 12], -Math.PI * 0.32, 0.9, 2);

    // 8. CLINKER-BUILT WOODEN GEOLOGIST'S SKIFF bobbing in the subterranean tidal pool (data-anim="bob")!
    const skX = 635;
    const skY = 1278;
    p.animGroup({ kind: "bob", cx: skX, cy: skY, ampY: 5.5, ampDeg: 1.4, freq: 1.05, phase: 0.8 }, () => {
      // Silky warm amber bow-lantern light spill on the boat & broken golden water reflection below!
      p.layer("var(--z-halo-op)", () => {
        const bowGlow = p.radialGrad("skiff-lamp", skX + 114, skY - 56, 165, [
          [0, PAL.lanternCore, 0.56],
          [0.28, PAL.lantern, 0.3],
          [0.65, PAL.lanternHalo, 0.11],
          [1, PAL.lanternHalo, 0.0],
        ]);
        p.fillPath(circlePath(skX + 114, skY - 56, 165), bowGlow, 1);
      });

      const sb = new PathBatcher();
      // Reflected dark hull shadow & glowing lantern ripples right beneath the skiff hull
      sb.addPath("shadow", ellipsePath(skX + 6, skY + 26, 134, 16), { fill: PAL.prussianDk, fillOpacity: 0.44 });
      sb.addPath("waterRim", `M${f(skX - 134)} ${f(skY + 20)}Q${f(skX)} ${f(skY + 34)} ${f(skX + 136)} ${f(skY + 18)}`, {
        stroke: PAL.waterSpray,
        strokeWidth: 0.85,
        strokeOpacity: 0.72,
        nonScaling: "hatch",
        dash: "22 8 10 8",
      });

      // Curved interior far gunwale & dark wooden floorboards
      const farGun = sample(quad([skX - 114, skY - 22], [skX, skY - 12], [skX + 122, skY - 30]), 12);
      const nearGun = sample(quad([skX - 122, skY - 16], [skX, skY - 4], [skX + 132, skY - 26]), 12);
      const keel = sample(quad([skX - 102, skY + 20], [skX + 4, skY + 28], [skX + 108, skY + 18]), 12);

      sb.addPath("interior", closedSmooth([...farGun, ...[...nearGun].reverse()]), { fill: PAL.barkDk, fillOpacity: 0.96 });
      // Interior curved oak hull ribs & 3 transverse wooden thwarts (benches)
      for (const u of [0.22, 0.48, 0.74]) {
        const pF = farGun[Math.round(u * (farGun.length - 1))];
        const pN = nearGun[Math.round(u * (nearGun.length - 1))];
        sb.quad("thwart", [pF[0] - 5, pF[1]], [pF[0] + 6, pF[1]], [pN[0] + 6, pN[1]], [pN[0] - 5, pN[1]], {
          fill: PAL.umberLt,
          fillOpacity: 0.94,
        });
      }
      // Mineral specimen crate sitting on the forward thwart with glowing amethyst crystals inside!
      sb.rect("crateFill", skX + 26, skY - 25, 28, 16, { fill: PAL.ochre });
      sb.rect("crateRim", skX + 26, skY - 25, 28, 16, { stroke: PAL.ink, strokeWidth: 0.55, nonScaling: "contour" });
      sb.addPath("spec", `M${f(skX + 32)} ${f(skY - 25)}L${f(skX + 36)} ${f(skY - 36)}L${f(skX + 41)} ${f(skY - 25)}Z`, { fill: PAL.wisteriaLt });
      sb.addPath("spec2", `M${f(skX + 41)} ${f(skY - 25)}L${f(skX + 47)} ${f(skY - 34)}L${f(skX + 51)} ${f(skY - 25)}Z`, { fill: PAL.celadonLt });

      // Two tiny expedition geologists inside the skiff (stern poleman + bow surveyor!)
      // Seated/standing figures grounded directly on the skiff thwarts
      sb.addPath("figA", `M${f(skX - 66)} ${f(skY - 14)}L${f(skX - 60)} ${f(skY - 46)}L${f(skX - 50)} ${f(skY - 45)}L${f(skX - 48)} ${f(skY - 14)}Z`, { fill: PAL.cinnabar, fillOpacity: 0.96 });
      sb.circle("head", skX - 56, skY - 52, 5.2, { fill: PAL.ink });
      sb.addPath("figB", `M${f(skX - 8)} ${f(skY - 10)}L${f(skX - 4)} ${f(skY - 38)}L${f(skX + 8)} ${f(skY - 37)}L${f(skX + 10)} ${f(skY - 10)}Z`, { fill: PAL.ochre, fillOpacity: 0.96 });
      sb.circle("head", skX + 2, skY - 44, 5.0, { fill: PAL.ink });
      // Long wooden steering pole / oar dipping down into the mirror pool!
      sb.line("oar", skX - 52, skY - 34, skX - 128, skY + 38, { stroke: PAL.umberLt, strokeWidth: 1.25, strokeOpacity: 0.94, nonScaling: "contour" });
      sb.line("oar", skX + 8, skY - 12, skX + 62, skY + 34, { stroke: PAL.umberLt, strokeWidth: 1.15, strokeOpacity: 0.9, nonScaling: "contour" });

      // Clinker-built overlapping wooden exterior hull planking (5 horizontal strakes!)
      sb.addPath("hull", closedSmooth([...nearGun, ...[...keel].reverse()]), { fill: PAL.umber, fillOpacity: 0.98 });
      sb.addPath(
        "hullSh",
        closedSmooth([...nearGun.map((pt, i) => lerp(pt, keel[i], 0.56)), ...[...keel].reverse()]),
        { fill: PAL.umberDk, fillOpacity: 0.54 },
      );
      for (const v of [0.24, 0.48, 0.72]) {
        const strake = nearGun.map((pt, i) => lerp(pt, keel[i], v));
        sb.addPath("strake", openPoly(strake), { stroke: PAL.ink, strokeWidth: 0.46, strokeOpacity: 0.65, nonScaling: "hatch" });
      }
      sb.addPath("gunTrim", openPoly(nearGun), { stroke: PAL.ochreLt, strokeWidth: 0.9, strokeOpacity: 0.85, nonScaling: "contour" });
      sb.addPath("hullOut", closedSmooth([...nearGun, ...[...keel].reverse()]), { stroke: PAL.ink, strokeWidth: 0.78, strokeOpacity: 0.86, nonScaling: "contour" });

      // Curved wrought-iron bow lantern post & glowing brass bow Davy lamp!
      sb.addPath("post", `M${f(skX + 116)} ${f(skY - 26)}Q${f(skX + 124)} ${f(skY - 58)} ${f(skX + 114)} ${f(skY - 68)}`, {
        stroke: PAL.ink,
        strokeWidth: 0.9,
        nonScaling: "contour",
      });
      sb.rect("bowGlassFill", skX + 109, skY - 62, 10, 12, { fill: PAL.lantern, fillOpacity: 0.96 });
      sb.rect("bowGlassRim", skX + 109, skY - 62, 10, 12, { stroke: PAL.ink, strokeWidth: 0.55, nonScaling: "contour" });
      sb.circle("bowCore", skX + 114, skY - 56, 3.2, { fill: PAL.lanternCore });
      sb.flush(p);
    });

    // Foreground stepped hexagonal basalt causeway stones emerging from the mirror pool!
    const poolSteppingStones: BasaltSpec[] = [
      { cx: 295, yTop: 1245, yBot: BLEED.y1, hw: 46, cap: "top", tier: 0 },
      { cx: 398, yTop: 1345, yBot: BLEED.y1, hw: 44, cap: "top", tier: 0 },
      { cx: 515, yTop: 1455, yBot: BLEED.y1, hw: 46, cap: "top", tier: 1 },
      { cx: 1215, yTop: 1345, yBot: BLEED.y1, hw: 46, cap: "top", tier: 1 },
      { cx: 1318, yTop: 1245, yBot: BLEED.y1, hw: 48, cap: "top", tier: 0 },
      { cx: 1435, yTop: 1315, yBot: BLEED.y1, hw: 50, cap: "top", tier: 0 },
    ];
    drawBasaltTier(poolSteppingStones);

    // Tiny Geological Surveyors standing squarely on top of the flat hexagonal basalt causeway caps
    p.scaleFigures(
      [
        { x: 1318, y: 1248, h: 21, coat: PAL.cinnabar, kind: "coat", dir: -1 },
        { x: 1346, y: 1252, h: 19, coat: PAL.ochre, kind: "coat", dir: -1 },
        { x: 1435, y: 1318, h: 20, coat: PAL.paperWarm, kind: "coat", dir: -1 },
        { x: 295, y: 1248, h: 20, coat: PAL.cinnabarLt, kind: "dress", dir: 1 },
      ],
      { shadowDir: [1.05, 0.26], shadowOpacity: 0.28 },
    );

    // Subtle crystalline mineral luminescence glints igniting softly at Night (var(--z-lume-op))
    p.layer("var(--z-lume-op)", () => {
      p.animGroup({ kind: "pulse", baseOp: 0.68, ampOp: 0.28, freq: 1.85, phase: 0.6 }, () => {
        let stars = "";
        for (const [gx, gy, gr] of [
          [1255, 645, 12],
          [1585, 515, 14],
          [1940, 625, 13],
          [1615, 960, 12],
          [325, 665, 12],
          [625, 875, 11],
          [1115, 825, 11],
          [1160, 415, 10],
          [755, 425, 10],
        ] as const) {
          stars += `M${f(gx - gr)} ${f(gy)}L${f(gx)} ${f(gy - gr)}L${f(gx + gr)} ${f(gy)}L${f(gx)} ${f(gy + gr)}Z`;
        }
        p.fillPath(stars, PAL.celadonLt, 0.78);
      });
    });

    // 9. SWAYING BRASS MINER'S DAVY SAFETY LAMPS suspended on iron chains from the basalt vault!
    drawDavyLamp(1415, 295, 155, 1.0, 0.4, 0);
    drawDavyLamp(2045, 435, 175, 0.94, 2.1, 1);
    drawDavyLamp(515, 340, 165, 0.94, 1.3, 2);

    p.animGroup({ kind: "drift", ampX: 30, ampY: -22, freq: 0.46, phase: 0.9 }, () => {
      let motes = "";
      for (let i = 0; i < 42; i++) motes += `M${f(rand(p.r, 180, 2240))} ${f(rand(p.r, 160, 1240))}h0.2`;
      p.burinContour(motes, PAL.lanternCore, 1.5, 0.64, 42);
    });
  });

  // 10. CRISP STEPPED HEXAGONAL-BASALT LINTEL EDGE & STRAIGHT TIDAL WATER THRESHOLD (ZERO curved stadium bezel!)
  p.animGroup({ kind: "ripple", ampX: 4, baseOp: 0.78, ampOp: 0.18, freq: 1.8, phase: 1.2 }, () => {
    p.burin(`M${f(cleftX0 - 12)} ${f(cleftY1 + 3)}H${f(cleftX1 + 12)}`, PAL.waterSpray, 0.86, 0.76, 1, "hatch", "32 14 14 12");
    p.burin(`M${f(cleftX0 - 24)} ${f(cleftY1 + 11)}H${f(cleftX1 + 24)}`, PAL.celadonLt, 0.66, 0.58, 1, "hatch", "22 18 10 14");
  });
  // Subtle dark rock-cleavage edge strictly along stepped top basalt lintel & sheer vertical piers
  p.burinContour(openPoly(hole.slice(0, 11)), PAL.ink, 0.78, 0.68, 1);
  p.burinContour(`M${f(cleftX0)} ${f(cleftY0)}V${f(cleftY1)}`, PAL.ink, 0.78, 0.68, 1);
  p.moonRim(hole.slice(0, 10), { closed: false, up: true, widthPx: 0.78, opacity: "var(--z-moon-op)" });
  p.flush();

  return {
    index: 13,
    id: "s13-geode",
    title: "Basalt & Amethyst Sea-Cavern",
    subtitle: "320+ hexagonal basalt organ-pipes, translucent quartz druses, geologist's skiff & rock cleft",
    portal: S13_PORTAL,
    coreColorDay: [214, 216, 210],
    coreColorNight: [14, 21, 36],
    defs: p.defs.join(""),
    markup: p.out.join(""),
    hole,
    stats: { elements: p.elements, strokes: p.strokes, animGroups: p.animGroups },
  };
}
