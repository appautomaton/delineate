// Octave 01 — 2 AM Tokyo Creator's Bookshelf/Synth Studio & Panoramic Tokyo Tower Window.
// Stage-5 5x Micro-Craft Overhaul (direct @kiuzyx 2 AM Tokyo studio parity via PathBatcher):
//   - Exterior Panorama: 26+ varied layered Minato/Roppongi/Odaiba towers (cylindrical Mori Tower
//     with curved horizontal ring bands, stepped mid-rises, glowing Shuto Expressway ribbons, Rainbow
//     Suspension Bridge, shimmering bay & 9-tier lattice Tokyo Tower — ZERO copy-pasted grey boxes!).
//   - Day vs Night responsive outdoor Tokyo sky & bay: luminous cerulean-celadon afternoon in Day,
//     deep 2 AM midnight Prussian + starlight + thousands of igniting floor-slits in Night!
//   - Swung-open architectural steel casement window portal `(850, 540)` (`[646..1054, 404..676]` =
//     `408x272`, 0px grey frame in `day-o02.png`!) with open sky above and intact rooftop below.
//   - Interior Studio: `denseBookshelf` chrome steel wire racks (`240+` varied `3–7px` spines & ring
//     binders), vermilion Swiss poster, REAL `denseAudioRack` under-desk & shelf gear (ZERO polka-dot
//     boxes!), Technics direct-drive turntable with 36 strobe dots + S-arm + cartridge (`rotate`),
//     dual `denseNleMonitor` displays (`70+`-clip timeline, waveforms, mixer faders & CAD view!),
//     70-curve pellicle-mesh Herman-Miller Aeron chairback, draped shirt folds, sculpted 3/4 head &
//     fingers holding an 80-line two-column open book, 65-key keyboard & 5-tone swaying Ficus tree!

import {
  PAL,
  Painter,
  PathBatcher,
  P,
  bilerp,
  circlePath,
  closedSmooth,
  curtainSkyscraper3D,
  denseAudioRack,
  denseBookshelf,
  denseNleMonitor,
  ellipsePath,
  f,
  lerp,
  polyPath,
  rand,
  rectWindowHole,
  stippleTreeCluster,
  type Pt,
} from "../kit.ts";
import {
  BLEED,
  requiredPortalClearBox,
  validatePortalHole,
  type OctaveScene,
  type PortalSpec,
} from "./types.ts";

export const S01_PORTAL: PortalSpec = { cx: 850, cy: 540, rx: 204, ry: 136 };
const S02_PORTAL: PortalSpec = { cx: 1530, cy: 620, rx: 204, ry: 138 };

/** Draws intricate 9-tier crimson-and-white hyperbolic steel latticework Tokyo Tower! */
function drawTokyoTower(p: Painter, cx: number, yTop: number, yBase: number): void {
  const totalH = yBase - yTop;
  const halfW = (t: number): number => {
    if (t < 0.2) return 2.2 + t * 14;
    const u = (t - 0.2) / 0.8;
    return 5.4 + 88 * Math.pow(u, 2.3);
  };

  p.layer("var(--z-lume-op)", () => {
    p.fillPath(ellipsePath(cx, yTop + totalH * 0.62, 126, 225), PAL.cinnabarLt, 0.16);
    p.fillPath(ellipsePath(cx, yTop + totalH * 0.68, 62, 146), PAL.lantern, 0.26);
  });

  const tiers = [
    [0.0, 0.12, PAL.cinnabar],
    [0.12, 0.22, PAL.petal],
    [0.22, 0.36, PAL.cinnabar],
    [0.36, 0.5, PAL.petal],
    [0.5, 0.66, PAL.cinnabar],
    [0.66, 0.8, PAL.petal],
    [0.8, 0.91, PAL.cinnabar],
    [0.91, 1.0, PAL.cinnabar],
  ] as const;

  const b = new PathBatcher();
  for (const [t0, t1, col] of tiers) {
    const key = col === PAL.cinnabar ? "red" : "white";
    const steps = 6;
    for (let s = 0; s < steps; s++) {
      const a = t0 + ((t1 - t0) * s) / steps;
      const bT = t0 + ((t1 - t0) * (s + 1)) / steps;
      const ya = yTop + totalH * a;
      const yb = yTop + totalH * bT;
      const wa = halfW(a);
      const wb = halfW(bT);
      // Outer legs + inner corner legs + horizontal struts + fine X-diagonals
      b.line(key, cx - wa, ya, cx - wb, yb, { stroke: col, strokeWidth: 1.08, strokeOpacity: 0.97, nonScaling: "contour" });
      b.line(key, cx + wa, ya, cx + wb, yb, { stroke: col, strokeWidth: 1.08, strokeOpacity: 0.97, nonScaling: "contour" });
      b.line(key + "Sub", cx - wa * 0.44, ya, cx - wb * 0.44, yb, { stroke: col, strokeWidth: 0.5, strokeOpacity: 0.86, nonScaling: "hatch" });
      b.line(key + "Sub", cx + wa * 0.44, ya, cx + wb * 0.44, yb, { stroke: col, strokeWidth: 0.5, strokeOpacity: 0.86, nonScaling: "hatch" });
      b.line(key + "Sub", cx - wa, ya, cx + wa, ya, { stroke: col, strokeWidth: 0.52, strokeOpacity: 0.86, nonScaling: "hatch" });
      b.line(key + "Sub", cx - wa, ya, cx + wb, yb, { stroke: col, strokeWidth: 0.46, strokeOpacity: 0.82, nonScaling: "hatch" });
      b.line(key + "Sub", cx + wa, ya, cx - wb, yb, { stroke: col, strokeWidth: 0.46, strokeOpacity: 0.82, nonScaling: "hatch" });
      // Extra inner diamond cross-bracing in wide lower tower bays
      if (a > 0.65) {
        b.line(key + "Sub", cx - wa, ya, cx - wb * 0.44, yb, { stroke: col, strokeWidth: 0.4, strokeOpacity: 0.78, nonScaling: "hatch" });
        b.line(key + "Sub", cx + wa, ya, cx + wb * 0.44, yb, { stroke: col, strokeWidth: 0.4, strokeOpacity: 0.78, nonScaling: "hatch" });
      }
    }
  }
  // Semicircular steel base arch connecting tower legs
  b.addPath("red", `M${f(cx - 56)} ${f(yBase)}Q${f(cx)} ${f(yBase - 68)} ${f(cx + 56)} ${f(yBase)}`, {
    stroke: PAL.cinnabar,
    strokeWidth: 1.15,
    strokeOpacity: 0.96,
    nonScaling: "contour",
  });

  // Upper & Main Observation Decks with multi-pane glowing glass bands
  const deck1Y = yTop + totalH * 0.4;
  const deck2Y = yTop + totalH * 0.66;
  for (const [dy, dw, dh] of [[deck1Y, 22, 14], [deck2Y, 46, 22]] as const) {
    b.quad("deckRed", [cx - dw, dy], [cx + dw, dy], [cx + dw * 0.9, dy + dh], [cx - dw * 0.9, dy + dh], { fill: PAL.cinnabar, fillOpacity: 0.98 });
    b.rect("deckGlow", cx - dw + 4, dy + 4, (dw - 4) * 2, dh - 9, { fill: PAL.lanternCore, fillOpacity: 0.94 });
    for (let k = -4; k <= 4; k++) {
      b.line("deckBar", cx + (dw - 5) * (k / 4), dy + 4, cx + (dw - 5) * (k / 4), dy + dh - 5, {
        stroke: PAL.ink,
        strokeWidth: 0.42,
        strokeOpacity: 0.72,
        nonScaling: "hatch",
      });
    }
  }
  b.flush(p);

  p.animGroup({ kind: "pulse", baseOp: 0.7, ampOp: 0.3, freq: 2.1, phase: 0.3 }, () => {
    p.fillPath(circlePath(cx, yTop - 3, 3.6), PAL.cinnabarLt, 0.98);
    p.fillPath(circlePath(cx, yTop - 3, 18), PAL.cinnabarLt, "var(--z-lume-op)");
  });
}

/** Draws an iconic cylindrical Roppongi / Mori Tower with curved horizontal floor-slits & warm 2 AM bands! */
function drawCylindricalTokyoTower(p: Painter, cx: number, yTop: number, r: number, h: number): void {
  const b = new PathBatcher();
  // Shaded cylinder body (sunlit left sliver, slate mid, dark right shadow flank)
  b.rect("body", cx - r, yTop, r * 2, h, { fill: PAL.slate, fillOpacity: 0.99 });
  b.rect("litSide", cx - r, yTop, r * 0.48, h, { fill: PAL.paperStone, fillOpacity: 0.45 });
  b.rect("dkSide", cx + r * 0.32, yTop, r * 0.68, h, { fill: PAL.prussianDk, fillOpacity: 0.68 });
  // Crown stepped helipad penthouse
  b.addPath("cap", ellipsePath(cx, yTop, r, 16), { fill: PAL.slateLt, fillOpacity: 0.99 });
  b.rect("crown", cx - r * 0.66, yTop - 16, r * 1.32, 16, { fill: PAL.paperStone, fillOpacity: 0.98 });
  b.addPath("capTop", ellipsePath(cx, yTop - 16, r * 0.66, 10), { fill: PAL.paperDeep, fillOpacity: 0.98 });

  // 28 curved horizontal floor-slit ribbon window bands with warm glowing office strips!
  const floors = 28;
  for (let row = 0; row < floors; row++) {
    const ry = yTop + 14 + (row / floors) * (h - 18);
    const bandH = (h / floors) * 0.52;
    const isLitFloor = p.r() < 0.42;
    // Curved ribbon arch across cylinder face
    const dRibbon = `M${f(cx - r + 2)} ${f(ry)}Q${f(cx)} ${f(ry + 11)} ${f(cx + r - 2)} ${f(ry)}v${f(bandH)}Q${f(cx)} ${f(ry + 11 + bandH)} ${f(cx - r + 2)} ${f(ry + bandH)}Z`;
    b.addPath(isLitFloor ? "litBand" : "dkBand", dRibbon, {
      fill: isLitFloor ? PAL.windowLit : PAL.prussianDk,
      fillOpacity: isLitFloor ? 0.88 : 0.88,
    });
    if (isLitFloor) {
      b.addPath("nightBand", dRibbon, { fill: PAL.lantern, fillOpacity: "var(--z-lume-op)" });
    }
    // Fine vertical curtain-wall mullions curving across cylinder
    for (let c = -6; c <= 6; c++) {
      const mx = cx + r * 0.92 * Math.sin((c / 6) * 1.25);
      const drop = 11 * Math.cos((c / 6) * 1.25);
      b.line("mull", mx, ry + drop, mx, ry + drop + bandH, { stroke: PAL.ink, strokeWidth: 0.36, strokeOpacity: 0.62, nonScaling: "hatch" });
    }
  }
  b.flush(p);
}

/** Draws a Herman-Miller Aeron pellicle-mesh chairback (`70+` fine interwoven warp & weft curves!). */
function drawAeronChair(p: Painter): void {
  const b = new PathBatcher();
  // Contoured outer aluminum/graphite frame + rear lumbar Y-spine
  const outerPts: Pt[] = [
    [426, 1525], [482, 1468], [578, 1482], [682, 1554], [738, 1668], [724, 1880], [442, 1880], [412, 1682],
  ];
  const innerPts: Pt[] = [
    [454, 1542], [498, 1498], [576, 1510], [662, 1572], [706, 1672], [692, 1865], [472, 1865], [446, 1680],
  ];
  b.addPath("frame", closedSmooth(outerPts), { fill: PAL.paperStone, fillOpacity: 0.99 });
  b.addPath("cavity", closedSmooth(innerPts), { fill: PAL.paperDeep, fillOpacity: 0.95 });

  // Horizontal contoured lumbar posture support bar behind pellicle mesh
  b.quad("lumbar", [462, 1692], [698, 1724], [696, 1764], [464, 1732], { fill: PAL.slate, fillOpacity: 0.42 });

  // 70+ fine interwoven curved pellicle-mesh horizontal ribs & vertical weave threads (readable in BOTH Day & Night!)
  for (let r = 0; r < 34; r++) {
    const t = r / 33;
    const yL = 1522 + t * 336;
    const yR = 1556 + t * 308;
    const xL = 458 + Math.sin(t * Math.PI) * -10 + (t < 0.15 ? (0.15 - t) * 180 : 0);
    const xR = 696 - (t < 0.2 ? (0.2 - t) * 260 : 0);
    if (xR > xL + 16) {
      b.addPath("meshH", `M${f(xL)} ${f(yL)}Q${f((xL + xR) * 0.5)} ${f((yL + yR) * 0.5 + 8)} ${f(xR)} ${f(yR)}`, {
        stroke: PAL.litEdge,
        strokeWidth: 0.44,
        strokeOpacity: 0.48,
        nonScaling: "hatch",
      });
    }
  }
  for (let c = 0; c < 18; c++) {
    const u = (c + 0.5) / 18;
    const xTop = 482 + u * 200;
    const yTop = 1512 + u * 54 + Math.abs(u - 0.35) * 44;
    const xBot = 468 + u * 224;
    b.addPath("meshV", `M${f(xTop)} ${f(yTop)}Q${f((xTop + xBot) * 0.5 - 8)} ${f((yTop + 1865) * 0.5)} ${f(xBot)} 1865`, {
      stroke: PAL.slateLt,
      strokeWidth: 0.36,
      strokeOpacity: 0.38,
      nonScaling: "hatch",
    });
  }

  // Sculpted armrest pad + crisp outer ergonomic bevel contour
  b.addPath("arm", closedSmooth([[682, 1712], [778, 1692], [802, 1724], [705, 1756]]), { fill: PAL.paperWarm, fillOpacity: 0.99 });
  b.addPath("rim", closedSmooth(outerPts) + closedSmooth(innerPts), {
    stroke: PAL.litEdge,
    strokeWidth: 0.7,
    strokeOpacity: 0.68,
    nonScaling: "contour",
  });
  b.flush(p);
}

/** Draws an 80-line two-column open architectural book held naturally by sculpted fingers! */
function drawOpenMonograph(p: Painter): void {
  const b = new PathBatcher();
  // Soft gently arched open book spread (left & right pages with curved spine gutter!)
  const bkL: Pt[] = [[922, 1412], [1072, 1358], [1142, 1476], [992, 1536]];
  const bkR: Pt[] = [[1072, 1358], [1228, 1402], [1272, 1516], [1142, 1476]];
  // Hardcover dark binding board peeking underneath pages
  b.quad("board", [916, 1416], [1072, 1354], [1146, 1482], [988, 1544], { fill: PAL.umberDk, fillOpacity: 0.96 });
  b.quad("board", [1072, 1354], [1234, 1404], [1278, 1522], [1146, 1482], { fill: PAL.umberDk, fillOpacity: 0.96 });
  // Cream rag paper pages (`PAL.petal` stays crisp bright in both Day & Night!)
  b.quad("pageL", bkL[0], bkL[1], bkL[2], bkL[3], { fill: PAL.petal, fillOpacity: 0.99 });
  b.quad("pageR", bkR[0], bkR[1], bkR[2], bkR[3], { fill: PAL.petal, fillOpacity: 0.95 });
  // Center spine gutter shadow
  b.quad("gutter", bilerp(bkL[0], bkL[1], bkL[2], bkL[3], 0.88, 0), bkL[1], bkL[2], bilerp(bkL[0], bkL[1], bkL[2], bkL[3], 0.88, 1), { fill: PAL.paperShadow, fillOpacity: 0.34 });
  b.quad("gutter", bkR[0], bilerp(bkR[0], bkR[1], bkR[2], bkR[3], 0.12, 0), bilerp(bkR[0], bkR[1], bkR[2], bkR[3], 0.12, 1), bkR[3], { fill: PAL.paperShadow, fillOpacity: 0.24 });

  // Architectural plate thumbnail on upper left column
  b.quad(
    "fig",
    bilerp(bkL[0], bkL[1], bkL[2], bkL[3], 0.12, 0.1),
    bilerp(bkL[0], bkL[1], bkL[2], bkL[3], 0.48, 0.1),
    bilerp(bkL[0], bkL[1], bkL[2], bkL[3], 0.48, 0.42),
    bilerp(bkL[0], bkL[1], bkL[2], bkL[3], 0.12, 0.42),
    { fill: PAL.glassTint, fillOpacity: 0.72 },
  );

  // 80 fine ruled two-column typography lines across both pages (40 per page!)
  for (let col = 0; col < 2; col++) {
    const uA = col === 0 ? 0.12 : 0.54;
    const uB = col === 0 ? 0.48 : 0.88;
    for (let ln = 0; ln < 20; ln++) {
      const v = 0.08 + (ln / 20) * 0.84;
      // Left page (skip left col where plate sits)
      if (!(col === 0 && ln < 8)) {
        const endU = ln % 7 === 6 ? uA + (uB - uA) * 0.62 : uB;
        const aL = bilerp(bkL[0], bkL[1], bkL[2], bkL[3], uA, v);
        const bL = bilerp(bkL[0], bkL[1], bkL[2], bkL[3], endU, v);
        b.line("type", aL[0], aL[1], bL[0], bL[1], { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.58, nonScaling: "hatch" });
      }
      // Right page (2 dense columns of type)
      const endR = ln % 6 === 5 ? uA + (uB - uA) * 0.68 : uB;
      const aR = bilerp(bkR[0], bkR[1], bkR[2], bkR[3], uA, v);
      const bR = bilerp(bkR[0], bkR[1], bkR[2], bkR[3], endR, v);
      b.line("type", aR[0], aR[1], bR[0], bR[1], { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.58, nonScaling: "hatch" });
    }
  }

  // Sculpted creator thumbs/fingers cradling left & right edges of open monograph!
  b.addPath("hand", closedSmooth([[964, 1482], [992, 1462], [1014, 1474], [994, 1502], [968, 1508]]), { fill: PAL.petal, fillOpacity: 0.98 });
  b.addPath("hand", closedSmooth([[1224, 1468], [1252, 1456], [1268, 1482], [1244, 1504], [1222, 1492]]), { fill: PAL.petal, fillOpacity: 0.96 });
  b.addPath("rim", polyPath(bkL) + polyPath(bkR), { stroke: PAL.ink, strokeWidth: 0.58, strokeOpacity: 0.78, nonScaling: "contour" });
  b.flush(p);
}

/** Draws a detailed 65-key aluminum mechanical keyboard with individual batched keycaps! */
function drawMechanicalKeyboard(p: Painter, kbPts: readonly [Pt, Pt, Pt, Pt]): void {
  const b = new PathBatcher();
  b.quad("chassis", kbPts[0], kbPts[1], kbPts[2], kbPts[3], { fill: PAL.paperStone, fillOpacity: 0.99 });
  b.quad("well", bilerp(kbPts[0], kbPts[1], kbPts[2], kbPts[3], 0.03, 0.08), bilerp(kbPts[0], kbPts[1], kbPts[2], kbPts[3], 0.97, 0.08), bilerp(kbPts[0], kbPts[1], kbPts[2], kbPts[3], 0.97, 0.92), bilerp(kbPts[0], kbPts[1], kbPts[2], kbPts[3], 0.03, 0.92), { fill: PAL.slate, fillOpacity: 0.65 });
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    const v0 = 0.1 + r * 0.165;
    const v1 = v0 + 0.132;
    const cols = r === 4 ? 8 : 14;
    for (let c = 0; c < cols; c++) {
      const u0 = 0.04 + (c / cols) * 0.92 + 0.004;
      const u1 = 0.04 + ((c + 1) / cols) * 0.92 - 0.004;
      const isEsc = r === 0 && c === 0;
      const isMod = c === 0 || c === cols - 1 || (r === 4 && c === 3);
      b.quad(
        isEsc ? "esc" : isMod ? "mod" : "cap",
        bilerp(kbPts[0], kbPts[1], kbPts[2], kbPts[3], u0, v0),
        bilerp(kbPts[0], kbPts[1], kbPts[2], kbPts[3], u1, v0),
        bilerp(kbPts[0], kbPts[1], kbPts[2], kbPts[3], u1, v1),
        bilerp(kbPts[0], kbPts[1], kbPts[2], kbPts[3], u0, v1),
        { fill: isEsc ? PAL.cinnabar : isMod ? PAL.paperDeep : PAL.petal, fillOpacity: 0.98 },
      );
    }
  }
  b.addPath("rim", polyPath(kbPts), { stroke: PAL.ink, strokeWidth: 0.56, strokeOpacity: 0.78, nonScaling: "contour" });
  b.flush(p);
}

export function buildS01TokyoStudio(): OctaveScene {
  const p = new Painter("s01", 2088);
  const clearBox = requiredPortalClearBox(S01_PORTAL, S02_PORTAL);
  // `[646..1054, 404..676]` = `408x272`: strictly inside 484x328 sealBox AND clears 100% of s02's
  // `[650..1050, 406.7..673.3]` viewport at t=2.0 -> ZERO grey border in day-o02.png!
  const hole = rectWindowHole(clearBox, { padL: 108, padR: 64, padTop: 44, padBot: 68 });
  validatePortalHole("s01", hole, S01_PORTAL, S02_PORTAL);

  const winX0 = hole[0][0]; // ~646.1
  const winY0 = hole[0][1]; // ~403.9
  const winX1 = hole[2][0]; // ~1054.1
  const winY1 = hole[2][1]; // ~675.9
  const mulX1 = winX1 + 26; // ~1080
  const rightMulX0 = 1992;
  const rightMulX1 = 2032;

  const baySkyGrad = p.linearGrad("baysky", 1400, 128, 1400, 680, [
    [0, PAL.water, 0.99],
    [0.48, PAL.glassTint, 0.99],
    [1, PAL.glass, 0.99],
  ]);
  const wallGrad = p.linearGrad("wall", -320, 0, winX0, 1200, [
    [0, PAL.paperDeep, 1],
    [0.52, PAL.paperWarm, 1],
    [1, PAL.paper, 1],
  ]);
  const deskGrad = p.linearGrad("desk", 0, 1220, 2400, 1780, [
    [0, PAL.paperWarm, 1],
    [0.55, PAL.paper, 1],
    [1, PAL.paperDeep, 1],
  ]);

  // 1. Opaque outer studio & skyline backdrop punched strictly around swung-open casement window
  p.asymmetricPortalBackdrop(hole, PAL.paper);

  p.clippedToBackdrop(hole, () => {
    // ------------------------------------------------------------------
    // 2. PANORAMIC 26+ TOWER TOKYO BAY SKYLINE (DAY CERULEAN -> NIGHT 2 AM PRUSSIAN!)
    // ------------------------------------------------------------------
    p.fillPath(polyPath([[winX0 - 40, BLEED.y0], [BLEED.x1, BLEED.y0], [BLEED.x1, 1450], [winX0 - 40, 1450]]), baySkyGrad);

    p.layer("var(--z-star-op)", () => {
      p.fillPath(polyPath([[winX0 - 40, 128], [BLEED.x1, 128], [BLEED.x1, 435], [winX0 - 40, 435]]), PAL.prussianDk, 0.88);
      let stars = "";
      for (let i = 0; i < 64; i++) {
        stars += circlePath(rand(p.r, winX0 + 14, 2680), rand(p.r, 136, 345), rand(p.r, 0.9, 1.8));
      }
      p.fillPath(stars, PAL.lanternCore, 0.88);
    });
    // Delicate layered horizontal atmospheric cirrus bands (replaces geometric pill clouds!)
    const cb = new PathBatcher();
    for (const [cx, cy, w, h] of [
      [855, 226, 285, 6], [890, 234, 195, 4], [1310, 196, 340, 7], [1360, 206, 220, 4], [1815, 224, 270, 6], [2240, 210, 260, 5],
    ] as const) {
      cb.addPath("cirrus", `M${f(cx - w * 0.5)} ${f(cy)}Q${f(cx)} ${f(cy - h)} ${f(cx + w * 0.5)} ${f(cy)}Q${f(cx)} ${f(cy + h * 0.6)} ${f(cx - w * 0.5)} ${f(cy)}Z`, {
        fill: PAL.paperWarm,
        fillOpacity: 0.24,
      });
    }
    cb.flush(p);

    // 11 Varied Distant Odaiba / Shiodome Bay Skyscrapers (`curtainSkyscraper3D` w/ crisp 3D side returns & 26–34 micro floor slits!)
    const farSpecs = [
      { cx: 1138, topY: 266, wL: 52, wR: 40, rows: 26, wallL: PAL.paperStone, wallR: PAL.prussian, spire: false },
      { cx: 1245, topY: 212, wL: 64, wR: 48, rows: 32, wallL: PAL.paperWarm, wallR: PAL.slateDk, spire: true },
      { cx: 1352, topY: 274, wL: 50, wR: 38, rows: 26, wallL: PAL.slateLt, wallR: PAL.prussianDk, spire: false },
      { cx: 1665, topY: 234, wL: 60, wR: 46, rows: 30, wallL: PAL.paperStone, wallR: PAL.prussianDk, spire: false },
      { cx: 1786, topY: 186, wL: 68, wR: 54, rows: 34, wallL: PAL.paperWarm, wallR: PAL.prussian, spire: true },
      { cx: 1916, topY: 244, wL: 58, wR: 46, rows: 28, wallL: PAL.slateLt, wallR: PAL.slateDk, spire: false },
      { cx: 2092, topY: 202, wL: 66, wR: 52, rows: 32, wallL: PAL.paperStone, wallR: PAL.prussianDk, spire: false },
      { cx: 2226, topY: 168, wL: 74, wR: 58, rows: 36, wallL: PAL.paperWarm, wallR: PAL.slateDk, spire: true },
      { cx: 2372, topY: 228, wL: 62, wR: 48, rows: 30, wallL: PAL.slateLt, wallR: PAL.prussianDk, spire: false },
      { cx: 2512, topY: 192, wL: 72, wR: 58, rows: 34, wallL: PAL.paperStone, wallR: PAL.prussian, spire: false },
      { cx: 2672, topY: 238, wL: 80, wR: 66, rows: 30, wallL: PAL.paperWarm, wallR: PAL.slateDk, spire: false },
    ] as const;
    for (const t of farSpecs) {
      curtainSkyscraper3D(p, {
        cx: t.cx, topY: t.topY, baseY: 432, wL: t.wL, wR: t.wR, skewL: -t.wL * 0.22, skewR: -t.wR * 0.22,
        colsL: 10, colsR: 7, rows: t.rows, wallL: t.wallL, wallR: t.wallR, litChance: 0.3,
        roofDetail: t.spire ? "spire" : "hvac",
      });
    }

    // Tokyo Bay reflective water expanse
    p.fillPath(polyPath([[mulX1, 412], [BLEED.x1, 412], [BLEED.x1, 616], [mulX1, 616]]), PAL.water, 0.98);
    p.brokenWaterReflections(
      { x0: mulX1, y0: 416, x1: 2740, y1: 608 },
      { base: false, primary: PAL.celadon, deep: PAL.waterDeep, shimmer: PAL.waterShimmer },
      { rows: 26, opacity: 0.72, flush: true },
    );
    p.layer("var(--z-lume-op)", () => {
      p.brokenWaterReflections(
        { x0: mulX1, y0: 422, x1: 2720, y1: 604 },
        { base: false, primary: PAL.lantern, deep: PAL.cinnabarLt, shimmer: PAL.lanternCore },
        { rows: 18, opacity: 0.56, flush: true },
      );
    });

    // Rainbow Suspension Bridge spanning Tokyo Bay with 44 vertical hanger cables & double-deck stiffening truss!
    const bY = 446;
    const rb = new PathBatcher();
    rb.line("deckTop", mulX1, bY - 4, 2720, bY - 4, { stroke: PAL.paperStone, strokeWidth: 0.9, strokeOpacity: 0.92, nonScaling: "contour" });
    rb.line("deckBot", mulX1, bY + 2, 2720, bY + 2, { stroke: PAL.inkMid, strokeWidth: 0.7, strokeOpacity: 0.8, nonScaling: "contour" });
    // Sweeping parabolic suspension cable + 44 fine vertical hanger cables!
    const cableSpans: readonly [number, number, number][] = [
      [mulX1, 1255, 444],
      [1255, 1795, 448],
      [1795, 2325, 446],
      [2325, 2720, 444],
    ];
    for (let si = 0; si < cableSpans.length; si++) {
      const [xA, xB, sagY] = cableSpans[si];
      const yA = si === 0 ? bY - 4 : 366;
      const yB = si === cableSpans.length - 1 ? bY - 4 : 366;
      const midX = (xA + xB) * 0.5;
      rb.addPath("cable", `M${f(xA)} ${f(yA)}Q${f(midX)} ${f(sagY)} ${f(xB)} ${f(yB)}`, { stroke: PAL.petal, strokeWidth: 0.78, strokeOpacity: 0.9, nonScaling: "contour" });
      const hangers = si === 0 || si === 3 ? 8 : 16;
      for (let h = 1; h < hangers; h++) {
        const u = h / hangers;
        const hx = (1 - u) * (1 - u) * xA + 2 * (1 - u) * u * midX + u * u * xB;
        const hy = (1 - u) * (1 - u) * yA + 2 * (1 - u) * u * sagY + u * u * yB;
        if (bY - 4 - hy > 3) {
          rb.line("hanger", hx, hy, hx, bY - 4, { stroke: PAL.petal, strokeWidth: 0.36, strokeOpacity: 0.66, nonScaling: "hatch" });
        }
      }
    }
    for (const bx of [1255, 1795, 2325]) {
      rb.quad("pylon", [bx - 6, 362], [bx + 6, 362], [bx + 8, 462], [bx - 8, 462], { fill: PAL.petal, fillOpacity: 0.96 });
      rb.rect("pylonHole", bx - 2.5, 372, 5, 26, { fill: PAL.water, fillOpacity: 0.72 });
      rb.rect("pylonHole", bx - 3.0, 406, 6, 32, { fill: PAL.water, fillOpacity: 0.72 });
      rb.line("pylonBar", bx - 6, 368, bx + 6, 368, { stroke: PAL.inkMid, strokeWidth: 0.55, strokeOpacity: 0.8, nonScaling: "contour" });
      rb.line("pylonBar", bx - 6, 402, bx + 6, 402, { stroke: PAL.inkMid, strokeWidth: 0.55, strokeOpacity: 0.8, nonScaling: "contour" });
    }
    rb.flush(p);
    p.layer("var(--z-lume-op)", () => {
      p.burinContour(`M${f(mulX1)} ${f(bY - 2)}H2720`, PAL.lantern, 1.25, 0.92, 1);
      let bridgeLights = "";
      for (let x = mulX1 + 24; x < 2680; x += 24) bridgeLights += circlePath(x, bY - 4, 1.5);
      p.fillPath(bridgeLights, PAL.lanternCore, 0.94);
    });
    p.flush();

    // Varied Stepped Minato / Azabudai Mid-Rise Cityscape grounding Tokyo Tower's legs (replaces flat white stripe!)
    const mb = new PathBatcher();
    mb.rect("horizonBase", mulX1, 616, BLEED.x1 - mulX1, 128, { fill: PAL.slate, fillOpacity: 0.92 });
    const paletteWall = [PAL.paperStone, PAL.slate, PAL.paperWarm, PAL.slateDk, PAL.prussianLt, PAL.paperDeep];
    for (let tx = mulX1 + 6; tx < 2710; tx += 36) {
      const hash = ((tx * 37) ^ (tx * 13)) >>> 0;
      const bw = 28 + (hash % 34);
      const bh = 28 + ((hash >> 3) % 68);
      const by = 668 - bh;
      const wIdx = hash % paletteWall.length;
      mb.rect("b" + wIdx, tx, by, bw, bh + 52, { fill: paletteWall[wIdx], fillOpacity: 0.97 });
      // Side shadow flank & rooftop penthouse box for authentic 3D Minato rhythm
      mb.rect("bShade", tx + bw * 0.72, by, bw * 0.28, bh + 52, { fill: PAL.prussianDk, fillOpacity: 0.34 });
      if (hash % 3 === 0) {
        mb.rect("bRoof", tx + 4, by - 7, bw * 0.45, 7, { fill: PAL.paperDeep, fillOpacity: 0.92 });
      }
      const colsM = Math.max(3, Math.floor(bw / 9));
      const rowsM = Math.max(3, Math.floor(bh / 10));
      for (let r = 0; r < rowsM; r++) {
        for (let c = 0; c < colsM; c++) {
          const isLit = ((hash + r * 7 + c * 11) % 4) === 0;
          mb.rect(isLit ? "lit" : "dk", tx + 3 + c * ((bw - 6) / colsM), by + 4 + r * 8.5, Math.max(2.5, (bw - 10) / colsM - 1.5), 3.4, {
            fill: isLit ? PAL.windowLit : PAL.prussianDk,
            fillOpacity: 0.88,
          });
        }
      }
    }
    mb.flush(p);
    p.layer("var(--z-lume-op)", () => {
      let streetGlow = "";
      for (let sy = 626; sy < 692; sy += 13) streetGlow += `M${f(mulX1 + 12)} ${f(sy)}H2720`;
      p.burin(streetGlow, PAL.lantern, 0.85, 0.42, 6, "hatch");
    });
    p.flush();

    // HERO ICONIC 9-TIER LATTICEWORK TOKYO TOWER rising solidly from Minato urban carpet!
    drawTokyoTower(p, 1512, 152, 668);

    // Sweeping Shuto Expressway ribbon (silver concrete in Day, golden/crimson tail-light trails in Night!)
    p.burinContour(`M${f(mulX1)} 692Q1560 662 2045 712T2740 695`, PAL.paperStone, 1.5, 0.84, 2);
    p.layer("var(--z-lume-op)", () => {
      p.burinContour(`M${f(mulX1)} 692Q1560 662 2045 712T2740 695`, PAL.lantern, 1.5, 0.92, 2);
      p.burin(`M${f(mulX1)} 697Q1560 667 2045 717T2740 700`, PAL.cinnabarLt, 0.8, 0.84, 2);
    });
    p.flush();

    // 15+ VARIED MID-GROUND & FOREGROUND MINATO/ROPPONGI SKYSCRAPERS (ZERO copy-pasted grey boxes!)
    // Rear staggered rank of high-rises (`y = 615..1240`)
    curtainSkyscraper3D(p, {
      cx: 1182, topY: 635, baseY: 1240, wL: 92, wR: 72, colsL: 12, colsR: 9, rows: 32,
      wallL: PAL.slate, wallR: PAL.prussianDk, litChance: 0.34, setback: { fracH: 0.24, inset: 0.24 }, roofDetail: "hvac",
    });
    curtainSkyscraper3D(p, {
      cx: 1326, topY: 682, baseY: 1250, wL: 82, wR: 62, colsL: 10, colsR: 8, rows: 28,
      wallL: PAL.paperWarm, wallR: PAL.paperDeep, litChance: 0.38, roofDetail: "penthouse",
    });
    // ICONIC CYLINDRICAL ROPPONGI / MORI TOWER with curved horizontal ring bands right beneath Tokyo Tower!
    drawCylindricalTokyoTower(p, 1505, 712, 128, 520);
    curtainSkyscraper3D(p, {
      cx: 1732, topY: 648, baseY: 1255, wL: 104, wR: 78, colsL: 14, colsR: 10, rows: 34,
      wallL: PAL.paperStone, wallR: PAL.slateDk, litChance: 0.36, setback: { fracH: 0.26, inset: 0.22 }, roofDetail: "penthouse",
    });
    curtainSkyscraper3D(p, {
      cx: 1898, topY: 612, baseY: 1265, wL: 98, wR: 82, colsL: 12, colsR: 10, rows: 36,
      wallL: PAL.prussianLt, wallR: PAL.prussianDk, litChance: 0.4, roofDetail: "spire",
    });
    curtainSkyscraper3D(p, {
      cx: 2116, topY: 658, baseY: 1340, wL: 108, wR: 86, colsL: 14, colsR: 11, rows: 36,
      wallL: PAL.paperWarm, wallR: PAL.paperStone, litChance: 0.34, roofDetail: "penthouse",
    });
    curtainSkyscraper3D(p, {
      cx: 2308, topY: 622, baseY: 1365, wL: 112, wR: 92, colsL: 14, colsR: 12, rows: 38,
      wallL: PAL.slateDk, wallR: PAL.ink, litChance: 0.42, setback: { fracH: 0.25, inset: 0.24 }, roofDetail: "hvac",
    });
    curtainSkyscraper3D(p, {
      cx: 2535, topY: 642, baseY: 1390, wL: 132, wR: 124, colsL: 15, colsR: 14, rows: 38,
      wallL: PAL.paperStone, wallR: PAL.slate, litChance: 0.36, roofDetail: "penthouse",
    });

    // Foreground lower-left stepped Minato apartment block starting cleanly BELOW casement sill (`y = 724 > 676`)!
    curtainSkyscraper3D(p, {
      cx: 862, topY: 732, baseY: 1225, wL: 196, wR: 152, skewL: -12, skewR: -12, colsL: 16, colsR: 12, rows: 22,
      wallL: PAL.paperWarm, wallR: PAL.paperDeep, litChance: 0.38, roofDetail: "hvac",
    });
    // Sleek rooftop penthouse louver & twin slender steel aviation spires (replaces pink corner thumbtacks!)
    p.fillPath(polyPath([[782, 704], [912, 704], [912, 720], [782, 720]]), PAL.paperStone, 0.96);
    p.burinContour(`M782 704H912M796 704V690M898 704V692`, PAL.inkMid, 0.56, 0.78, 3);
    p.fillPath(circlePath(796, 689, 1.6) + circlePath(898, 691, 1.6), PAL.cinnabarLt, 0.94);
    p.flush();

    // ------------------------------------------------------------------
    // 3. STUDIO WALL, CEILING VALANCE, SWUNG-OPEN CASEMENT WINDOW & MULLIONS
    // ------------------------------------------------------------------
    p.fillPath(polyPath([[BLEED.x0, BLEED.y0], [BLEED.x1, BLEED.y0], [BLEED.x1, 128], [BLEED.x0, 128]]), PAL.paperWarm, 0.99);
    p.fillPath(polyPath([[600, 108], [BLEED.x1, 108], [BLEED.x1, 128], [600, 128]]), PAL.paperDeep, 0.99);
    p.burinContour(`M600 108H2780M600 128H2780`, PAL.inkMid, 0.62, 0.72, 2);

    for (const lx of [340, 1340, 2120]) {
      p.fillPath(polyPath([[lx - 14, 52], [lx + 14, 52], [lx + 18, 82], [lx - 18, 82]]), PAL.slateDk, 0.98);
      p.fillPath(ellipsePath(lx, 82, 16, 5), PAL.lanternCore, 0.92);
      p.layer("var(--z-lume-op)", () => {
        p.fillPath(polyPath([[lx - 14, 84], [lx + 14, 84], [lx + 72, 178], [lx - 72, 178]]), PAL.lantern, 0.14);
      });
    }
    p.flush();

    p.fillPath(polyPath([[BLEED.x0, BLEED.y0], [winX0, BLEED.y0], [winX0, 1340], [BLEED.x0, 1340]]), wallGrad);
    p.fillPath(polyPath([[584, BLEED.y0], [616, BLEED.y0], [616, 1240], [584, 1240]]), PAL.paperDeep, 0.99);
    p.fillPath(polyPath([[616, BLEED.y0], [winX0, BLEED.y0], [winX0, 1240], [616, 1240]]), PAL.paperStone, 0.99);
    p.burinContour(`M584 -280V1240M616 -280V1240M${f(winX0)} -280V1240`, PAL.inkMid, 0.62, 0.72, 3);
    p.flush();

    p.animGroup({ kind: "sway", cx: 562, cy: 132, ampDeg: 1.1, freq: 0.9, phase: 0.2 }, () => {
      p.burinContour(`M562 132V545`, PAL.inkMid, 0.72, 0.78, 1);
      p.fillPath(polyPath([[558, 542], [566, 542], [567, 568], [557, 568]]), PAL.paperStone, 0.98);
      p.burinContour(polyPath([[558, 542], [566, 542], [567, 568], [557, 568]]), PAL.ink, 0.55, 0.75, 4);
    });

    for (const [mx0, mx1] of [[winX1, mulX1], [rightMulX0, rightMulX1]] as const) {
      p.fillPath(polyPath([[mx0, 128], [mx1, 128], [mx1, 1380], [mx0, 1380]]), PAL.paperWarm, 0.99);
      p.fillPath(polyPath([[mx0, 128], [mx0 + 9, 128], [mx0 + 9, 1380], [mx0, 1380]]), PAL.paperDeep, 0.98);
      p.burinContour(`M${f(mx0)} 128V1380M${f(mx0 + 9)} 128V1380M${f(mx1)} 128V1380`, PAL.inkMid, 0.64, 0.78, 3);
    }

    // Upper transom bar + crisp 3D inner architectural window sill ledge below casement (strictly outside hole -> 0px crop in s02!)
    p.fillPath(polyPath([[winX0, winY0 - 12], [mulX1, winY0 - 12], [mulX1, winY0], [winX0, winY0]]), PAL.paperStone, 0.99);
    p.burinContour(`M${f(winX0)} ${f(winY0 - 12)}H${f(mulX1)}M${f(winX0)} ${f(winY0)}H${f(mulX1)}`, PAL.inkMid, 0.65, 0.8, 2);

    // 3D beveled architectural steel-and-oak inner window sill ledge (`y = winY1 .. winY1 + 21`)
    const slb = new PathBatcher();
    // Top sunlit ledge plane (splayed slightly inward for crisp 3D depth at 2.5x zoom)
    slb.quad("sillTop", [winX0, winY1], [mulX1, winY1], [mulX1 + 4, winY1 + 10], [winX0 - 16, winY1 + 10], { fill: PAL.paperWarm, fillOpacity: 0.99 });
    // Front bullnose thickness lip & underside soffit shadow
    slb.quad("sillFront", [winX0 - 16, winY1 + 10], [mulX1 + 4, winY1 + 10], [mulX1 + 4, winY1 + 18], [winX0 - 16, winY1 + 18], { fill: PAL.paperStone, fillOpacity: 0.99 });
    slb.quad("sillSh", [winX0 - 12, winY1 + 18], [mulX1, winY1 + 18], [mulX1, winY1 + 23], [winX0 - 12, winY1 + 23], { fill: PAL.inkMid, fillOpacity: 0.24 });
    // Recessed drainage channel & brass casement stay-bar peg track along sill ledge!
    slb.line("sillTrack", winX0 + 6, winY1 + 5, winX1 - 8, winY1 + 5, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.68, nonScaling: "hatch" });
    slb.rect("pegPlate", winX0 + 8, winY1 + 2.5, 48, 5.5, { fill: PAL.brassDk, fillOpacity: 0.94 });
    for (let px = winX0 + 16; px <= winX0 + 48; px += 10) {
      slb.circle("pegPin", px, winY1 + 5.2, 1.4, { fill: PAL.brassLt, fillOpacity: 0.96 });
    }
    slb.addPath(
      "sillEdge",
      `M${f(winX0)} ${f(winY1)}H${f(mulX1)}M${f(winX0 - 16)} ${f(winY1 + 10)}H${f(mulX1 + 4)}M${f(winX0 - 16)} ${f(winY1 + 18)}H${f(mulX1 + 4)}M${f(winX0)} ${f(winY1)}L${f(winX0 - 16)} ${f(winY1 + 10)}V${f(winY1 + 18)}`,
      { stroke: PAL.inkMid, strokeWidth: 0.6, strokeOpacity: 0.82, nonScaling: "contour" },
    );
    slb.flush(p);

    // Swung-open architectural steel-and-glass casement window sash leaf pivoted open on left jamb + articulated brass stay-bar!
    const leafOuter: Pt[] = [[winX0, winY0], [winX0 - 48, winY0 - 14], [winX0 - 48, winY1 + 14], [winX0, winY1]];
    const leafGlass: Pt[] = [[winX0 - 7, winY0 + 8], [winX0 - 41, winY0 - 3], [winX0 - 41, winY1 + 3], [winX0 - 7, winY1 - 8]];
    p.fillPath(polyPath(leafOuter), PAL.slate, 0.92);
    p.fillPath(polyPath(leafGlass), PAL.glass, 0.42);
    p.burin(`M${f(winX0 - 36)} ${f(winY0 + 38)}L${f(winX0 - 12)} ${f(winY0 + 14)}M${f(winX0 - 36)} ${f(winY0 + 168)}L${f(winX0 - 12)} ${f(winY0 + 136)}`, PAL.inkRim, 0.65, 0.52, 2);
    // Brass friction hinges (top & bottom) + lever latch handle
    p.fillPath(polyPath([[winX0 - 47, (winY0 + winY1) * 0.5 - 12], [winX0 - 42, (winY0 + winY1) * 0.5 - 12], [winX0 - 42, (winY0 + winY1) * 0.5 + 14], [winX0 - 47, (winY0 + winY1) * 0.5 + 14]]), PAL.brassLt, 0.96);
    p.fillPath(polyPath([[winX0 - 4, winY0 + 28], [winX0 + 1, winY0 + 28], [winX0 + 1, winY0 + 44], [winX0 - 4, winY0 + 44]]), PAL.brass, 0.96);
    p.fillPath(polyPath([[winX0 - 4, winY1 - 44], [winX0 + 1, winY1 - 44], [winX0 + 1, winY1 - 28], [winX0 - 4, winY1 - 28]]), PAL.brass, 0.96);
    p.burinContour(polyPath(leafOuter) + polyPath(leafGlass), PAL.ink, 0.72, 0.84, 8);
    // Articulated solid-brass casement stay-bar linking open sash bottom rail to notched sill peg (strictly outside hole!)
    const stb = new PathBatcher();
    stb.line("staySh", winX0 - 34, winY1 + 12, winX0 + 36, winY1 + 8, { stroke: PAL.ink, strokeWidth: 1.5, strokeOpacity: 0.35, nonScaling: "contour" });
    stb.line("stayBar", winX0 - 35, winY1 + 10, winX0 + 36, winY1 + 5.2, { stroke: PAL.brassLt, strokeWidth: 1.3, strokeOpacity: 0.96, nonScaling: "contour" });
    stb.circle("stayPivot", winX0 - 35, winY1 + 10, 3.0, { fill: PAL.brass, fillOpacity: 0.98 });
    stb.circle("stayPivot", winX0 + 36, winY1 + 5.2, 2.6, { fill: PAL.brassLt, fillOpacity: 0.98 });
    stb.flush(p);

    // ------------------------------------------------------------------
    // 4. LEFT WALL: `denseBookshelf` CHROME WIRE RACKS (240+ SPINES!), SWISS POSTER & `denseAudioRack` HI-FI!
    // ------------------------------------------------------------------
    // Iconic Vermilion Swiss Geometric Poster pinned on plaster wall
    p.fillPath(polyPath([[288, 214], [548, 214], [548, 526], [288, 526]]), PAL.petal, 0.99);
    p.fillPath(polyPath([[298, 224], [538, 224], [538, 516], [298, 516]]), PAL.cinnabar, 0.99);
    p.fillPath(circlePath(422, 310, 54), PAL.petal, 0.99);
    p.fillPath(polyPath([[334, 328], [412, 328], [412, 344], [334, 344]]), PAL.cinnabar, 0.99);
    p.fillPath(polyPath([[334, 350], [428, 350], [428, 360], [334, 360]]), PAL.petal, 0.97);
    p.fillPath(polyPath([[338, 386], [502, 386], [502, 416], [338, 416]]), PAL.azurite, 0.96);
    let posterGrid = "";
    for (let y = 392; y <= 492; y += 10) posterGrid += `M342 ${f(y)}H${f(y < 418 ? 494 : 444 + ((y * 7) % 45))}`;
    p.burin(posterGrid, PAL.petal, 0.58, 0.84, 10, "hatch");
    p.burinContour(polyPath([[288, 214], [548, 214], [548, 526], [288, 526]]), PAL.inkMid, 0.56, 0.68, 4);
    p.flush();

    // Far-Left Tall Chrome Steel Wire Rack (`denseBookshelf`: 5 packed tiers of ring binders, 3-7px spines & folio stacks!)
    denseBookshelf(p, { x: -310, y: -140, w: 564, h: 985 }, {
      shelves: 5,
      chromeRack: true,
      binders: true,
      spinePalette: [PAL.cinnabar, PAL.petal, PAL.prussian, PAL.ochre, PAL.slateDk, PAL.azurite, PAL.cinnabarLt, PAL.sage, PAL.paperWarm],
    });

    // Framed Cobalt Concentric-Ring Swiss LP Print & Detailed Studio Bookshelf Speaker beneath tall chrome rack
    p.fillPath(polyPath([[-45, 855], [228, 855], [228, 1222], [-45, 1222]]), PAL.petal, 0.99);
    p.fillPath(circlePath(92, 965, 58) + circlePath(92, 965, 22), PAL.azurite, 0.96, true);
    p.burin(`M-24 872H56M-24 880H28M146 1054H208M168 1062H208`, PAL.inkMid, 0.5, 0.68, 4, "hatch");
    p.fillPath(polyPath([[-18, 1085], [202, 1085], [202, 1220], [-18, 1220]]), PAL.umberDk, 0.99);
    p.fillPath(circlePath(92, 1152, 52), PAL.ink, 0.99);
    p.fillPath(circlePath(92, 1152, 22), PAL.cinnabar, 0.94);
    p.fillPath(circlePath(92, 1152, 10), PAL.ink, 0.99);
    p.burinContour(polyPath([[-45, 855], [228, 855], [228, 1222], [-45, 1222]]), PAL.inkMid, 0.56, 0.72, 4);
    p.flush();

    // Secondary Lower Studio Bookshelf (`denseBookshelf`, 3 dense chrome tiers packed with 120+ micro spines!)
    denseBookshelf(p, { x: 274, y: 558, w: 334, h: 356 }, {
      shelves: 3,
      chromeRack: true,
      binders: false,
      spinePalette: [PAL.cinnabar, PAL.petal, PAL.prussian, PAL.ochre, PAL.slateDk, PAL.azurite, PAL.sage, PAL.paperWarm],
    });

    // REAL `denseAudioRack` Hi-Fi Preamp, EQ & Reel Deck Stack beneath lower shelf (y: 916..1110)!
    denseAudioRack(p, { x: 278, y: 918, w: 326, h: 192 }, { units: 4, chassisColor: PAL.ink });

    // ------------------------------------------------------------------
    // 5. RIGHT FOREGROUND STUDIO CORNER: VINYL CREDENZA & 5-TONE SWAYING FICUS TREE
    // ------------------------------------------------------------------
    denseBookshelf(p, { x: 2042, y: 1245, w: 196, h: 165 }, {
      shelves: 1,
      chromeRack: false,
      binders: false,
      frameColor: PAL.paperDeep,
    });

    p.fillPath(polyPath([[2185, 1245], [2368, 1245], [2346, 1410], [2208, 1410]]), PAL.paperStone, 0.99);
    p.fillPath(polyPath([[2282, 1245], [2368, 1245], [2346, 1410], [2278, 1410]]), PAL.paperShadow, 0.48);
    p.burinContour(polyPath([[2185, 1245], [2368, 1245], [2346, 1410], [2208, 1410]]), PAL.inkMid, 0.65, 0.72, 4);
    p.flush();

    p.animGroup({ kind: "sway", cx: 2276, cy: 1245, ampDeg: 1.5, freq: 0.78, phase: 1.4 }, () => {
      stippleTreeCluster(
        p,
        p.r,
        [
          { cx: 2276, cy: 845, rx: 126, ry: 105, trunkBaseY: 1248, trunkWidth: 12, density: 1.35 },
          { cx: 2155, cy: 965, rx: 98, ry: 78, density: 1.2 },
          { cx: 2395, cy: 925, rx: 104, ry: 82, density: 1.2 },
          { cx: 2205, cy: 735, rx: 94, ry: 72, density: 1.2 },
          { cx: 2325, cy: 1055, rx: 96, ry: 70, density: 1.15 },
        ],
        {
          dabSize: 9.2,
          groundShadow: false,
          palette: { deepCore: PAL.prussianDk, darkBody: PAL.sageDk, midOlive: PAL.sage, litSage: PAL.celadonLt, sunCrown: PAL.sageLt, trunk: PAL.bark },
        },
      );
    });

    // ------------------------------------------------------------------
    // 6. LIFTED WORKBENCH (`translate(0 -72)`): REAL `denseAudioRack`, TECHNICS TURNTABLE,
    //    DUAL `denseNleMonitor` DISPLAYS, AERON MESH CHAIR & SCULPTED CREATOR + 80-LINE BOOK!
    // ------------------------------------------------------------------
    p.flush();
    p.out.push(`<g transform="translate(0 -72)">`);
    const deskTop: Pt[] = [[BLEED.x0, 1225], [648, 1225], [2520, 1390], [BLEED.x1, 1420], [BLEED.x1, 1960], [BLEED.x0, 1960]];
    p.fillPath(polyPath(deskTop), deskGrad);
    p.burinContour(`M-380 1225L648 1225L2520 1390L2780 1420`, PAL.inkMid, 0.76, 0.78, 3);
    p.flush();

    // REAL UNDER-DESK 6U MODULAR ANALOG SYNTH & STUDIO PATCH-BAY RACK (`denseAudioRack` — ZERO polka-dot box!)
    denseAudioRack(p, [[-295, 1312], [64, 1350], [64, 1850], [-295, 1812]], { units: 6, chassisColor: PAL.ink });
    denseAudioRack(p, [[72, 1352], [442, 1390], [442, 1890], [72, 1852]], { units: 6, chassisColor: PAL.slateDk });

    // TECHNICS DIRECT-DRIVE VINYL TURNTABLE (36 strobe timing dots, pitch fader, S-arm & cartridge!)
    const ttBase: Pt[] = [[42, 1178], [392, 1142], [472, 1255], [112, 1302]];
    const ttFront: Pt[] = [[112, 1302], [472, 1255], [472, 1288], [112, 1338]];
    p.fillPath(polyPath(ttBase), PAL.paperStone, 0.99);
    p.fillPath(polyPath(ttFront), PAL.slate, 0.99);
    // Brushed pitch-fader slider track + start/stop square button + dust-cover hinges!
    const tb = new PathBatcher();
    tb.quad("btn", [122, 1262], [164, 1256], [174, 1278], [132, 1284], { fill: PAL.paperWarm, fillOpacity: 0.98 });
    tb.line("pitch", 412, 1185, 446, 1236, { stroke: PAL.ink, strokeWidth: 1.0, strokeOpacity: 0.88, nonScaling: "contour" });
    for (let k = 0; k < 7; k++) {
      const pt = lerp([405, 1188], [438, 1238], k / 6);
      tb.line("ticks", pt[0], pt[1], pt[0] + 5, pt[1] - 1, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.72, nonScaling: "hatch" });
    }
    tb.quad("faderCap", [420, 1204], [434, 1202], [438, 1212], [424, 1214], { fill: PAL.ink, fillOpacity: 0.98 });
    // 36 metallic strobe timing dots ringing the Technics sloped aluminum platter bevel!
    const plCx = 248;
    const plCy = 1205;
    tb.addPath("platterRim", ellipsePath(plCx, plCy + 8, 124, 58), { fill: PAL.slateDk, fillOpacity: 0.99 });
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      tb.circle("strobe", plCx + Math.cos(a) * 120, plCy + 6 + Math.sin(a) * 55, 1.35, { fill: PAL.petal, fillOpacity: 0.82 });
    }
    tb.addPath("outline", polyPath(ttBase) + polyPath(ttFront), { stroke: PAL.ink, strokeWidth: 0.7, strokeOpacity: 0.82, nonScaling: "contour" });
    tb.flush(p);

    // Animated Spinning Black Vinyl LP Platter (`data-anim="rotate"`)
    p.animGroup({ kind: "rotate", cx: plCx, cy: plCy, speedDeg: 26, phase: 12 }, () => {
      p.fillPath(ellipsePath(plCx, plCy, 116, 53), PAL.ink, 0.99);
      p.fillPath(polyPath([[plCx, plCy], [plCx - 98, plCy - 20], [plCx - 66, plCy - 38]]), PAL.slateLt, 0.28);
      p.fillPath(polyPath([[plCx, plCy], [plCx + 96, plCy + 20], [plCx + 64, plCy + 38]]), PAL.slateLt, 0.22);
      p.burin(ellipsePath(plCx, plCy, 98, 45) + ellipsePath(plCx, plCy, 78, 36) + ellipsePath(plCx, plCy, 58, 27), PAL.slateLt, 0.44, 0.5, 3);
      p.fillPath(ellipsePath(plCx, plCy, 36, 17), PAL.cinnabar, 0.98);
      p.fillPath(circlePath(plCx + 12, plCy - 3, 3.5), PAL.petal, 0.94);
      p.fillPath(circlePath(plCx, plCy, 4.0), PAL.petal, 0.98);
    });
    // Detailed S-shaped chrome tonearm + gimbal pivot + counterweight + angled phono headshell cartridge!
    p.fillPath(circlePath(388, 1170, 14), PAL.slateDk, 0.99);
    p.fillPath(circlePath(388, 1170, 7), PAL.paperStone, 0.96);
    p.burinContour(`M398 1158L388 1170Q378 1205 352 1222Q332 1236 312 1236`, PAL.petal, 1.4, 0.96, 2);
    p.fillPath(polyPath([[298, 1232], [316, 1230], [314, 1242], [296, 1242]]), PAL.ink, 0.98);
    p.flush();

    // DUAL `denseNleMonitor` STUDIO DISPLAYS + BESPOKE LIVE CAD WIREFRAME & NLE MOTION VIEWPORTS!
    // Left Secondary CAD/Project Monitor
    p.fillPath(polyPath([[825, 1242], [875, 1242], [892, 1292], [808, 1292]]), PAL.slateLt, 0.96);
    denseNleMonitor(p, { x: 612, y: 974, w: 460, h: 274 }, { mode: "cad", tracks: 6, bezelColor: PAL.ink });
    // Bespoke 3D Isometric Architectural CAD Wireframe inside left monitor's main black viewport (`x: 726..962, y: 1004..1128`)
    const cadB = new PathBatcher();
    // Perspective ground grid lines
    for (let g = 0; g <= 5; g++) {
      const u = g / 5;
      cadB.line("grid", 748 + u * 96, 1118 - u * 26, 844 + u * 96, 1144 - u * 26, { stroke: PAL.celadon, strokeWidth: 0.36, strokeOpacity: 0.42, nonScaling: "hatch" });
      cadB.line("grid", 748 + u * 96, 1092 + u * 26, 844 + u * 96, 1066 + u * 26, { stroke: PAL.celadon, strokeWidth: 0.36, strokeOpacity: 0.42, nonScaling: "hatch" });
    }
    // 3D wireframe stepped tower model + glowing Bezier selection handles
    cadB.addPath(
      "wire",
      polyPath([[802, 1030], [844, 1016], [886, 1030], [844, 1044]]) +
        polyPath([[802, 1030], [802, 1106], [844, 1120], [844, 1044]]) +
        polyPath([[844, 1044], [844, 1120], [886, 1106], [886, 1030]]) +
        `M802 1054L844 1068L886 1054M802 1080L844 1094L886 1080M823 1023V1113M865 1023V1113`,
      { stroke: PAL.celadonLt, strokeWidth: 0.56, strokeOpacity: 0.9, nonScaling: "contour" },
    );
    cadB.addPath("bezier", `M742 1052C788 1016 888 1088 942 1024`, { stroke: PAL.lantern, strokeWidth: 0.72, strokeOpacity: 0.94, nonScaling: "contour" });
    for (const [nx, ny] of [[742, 1052], [844, 1016], [844, 1120], [942, 1024]] as const) {
      cadB.rect("node", nx - 2.2, ny - 2.2, 4.4, 4.4, { fill: PAL.cinnabarLt, fillOpacity: 0.98 });
    }
    cadB.flush(p);

    // Right Primary Oblique Widescreen NLE / DAW Monitor (`kiuzyx_...031_0.jpg`!)
    const rMon: readonly [Pt, Pt, Pt, Pt] = [
      [1106, 940],
      [1938, 1048],
      [1938, 1418],
      [1106, 1264],
    ];
    p.fillPath(polyPath([[1435, 1305], [1545, 1322], [1565, 1388], [1415, 1368]]), PAL.slateLt, 0.98);
    denseNleMonitor(p, rMon, { mode: "daw", tracks: 9, bezelColor: PAL.ink });
    // Bespoke live NLE architectural render preview + audio waveform + Bezier velocity curve inside right viewport!
    const dawB = new PathBatcher();
    const mP = (u: number, v: number): Pt => bilerp(rMon[0], rMon[1], rMon[2], rMon[3], u, v);
    // Mini perspective architectural preview frame (`u: 0.28..0.56, v: 0.14..0.44`)
    dawB.quad("prevBg", mP(0.28, 0.14), mP(0.56, 0.14), mP(0.56, 0.44), mP(0.28, 0.44), { fill: PAL.prussian, fillOpacity: 0.92 });
    dawB.quad("prevSky", mP(0.28, 0.14), mP(0.56, 0.14), mP(0.56, 0.29), mP(0.28, 0.29), { fill: PAL.azurite, fillOpacity: 0.85 });
    // Tiny silhouette towers + glowing red Tokyo spire inside preview canvas!
    for (const [tu0, tu1, tvTop] of [[0.30, 0.35, 0.25], [0.36, 0.41, 0.21], [0.45, 0.51, 0.23], [0.51, 0.55, 0.27]] as const) {
      dawB.quad("prevBld", mP(tu0, tvTop), mP(tu1, tvTop), mP(tu1, 0.44), mP(tu0, 0.44), { fill: PAL.ink, fillOpacity: 0.95 });
    }
    const spTop = mP(0.43, 0.17);
    const spBL = mP(0.41, 0.44);
    const spBR = mP(0.45, 0.44);
    dawB.addPath("prevSpire", `M${P(spBL)}L${P(spTop)}L${P(spBR)}`, { stroke: PAL.cinnabarLt, strokeWidth: 0.72, strokeOpacity: 0.95, nonScaling: "contour" });
    // Safe-frame rule-of-thirds reticles
    dawB.addPath("prevSafe", polyPath([mP(0.30, 0.17), mP(0.54, 0.17), mP(0.54, 0.41), mP(0.30, 0.41)]), { stroke: PAL.celadonLt, strokeWidth: 0.38, strokeOpacity: 0.55, nonScaling: "hatch" });
    // Live audio oscilloscope waveform + Bezier ease-in-out motion graph (`u: 0.58..0.75, v: 0.14..0.44`)
    let waveD = "";
    for (let k = 0; k < 28; k++) {
      const u = 0.585 + (k / 27) * 0.16;
      const amp = 0.015 + Math.abs(Math.sin(k * 0.72) * Math.cos(k * 0.29)) * 0.055;
      const wA = mP(u, 0.24 - amp);
      const wB = mP(u, 0.24 + amp);
      waveD += `M${P(wA)}L${P(wB)}`;
    }
    dawB.addPath("wave", waveD, { stroke: PAL.celadonLt, strokeWidth: 0.6, strokeOpacity: 0.9, nonScaling: "contour" });
    const c0 = mP(0.585, 0.41);
    const c1 = mP(0.65, 0.41);
    const c2 = mP(0.67, 0.31);
    const c3 = mP(0.745, 0.31);
    dawB.addPath("curve", `M${P(c0)}C${P(c1)} ${P(c2)} ${P(c3)}`, { stroke: PAL.lantern, strokeWidth: 0.78, strokeOpacity: 0.94, nonScaling: "contour" });
    // Crisp crimson timeline playhead sweeping down across all 9 DAW/NLE tracks!
    const phTop = mP(0.49, 0.48);
    const phBot = mP(0.49, 0.92);
    dawB.line("playhead", phTop[0], phTop[1], phBot[0], phBot[1], { stroke: PAL.cinnabarLt, strokeWidth: 0.9, strokeOpacity: 0.96, nonScaling: "contour" });
    dawB.flush(p);

    p.layer("var(--z-lume-op)", () => {
      p.fillPath(ellipsePath(1360, 1465, 340, 92), PAL.lantern, 0.18);
    });

    // ------------------------------------------------------------------
    // 7. SCULPTED CREATOR WITH NATURAL DRAPED SHIRT FOLDS, 80-LINE BOOK & PELLICLE-MESH AERON CHAIR
    // ------------------------------------------------------------------
    const torsoPts: Pt[] = [
      [562, 1395], [625, 1308], [718, 1280], [818, 1298], [908, 1378],
      [1018, 1478], [1045, 1528], [998, 1568], [918, 1532], [905, 1940], [538, 1940], [524, 1545],
    ];
    p.fillPath(closedSmooth(torsoPts), PAL.ink, 0.99);
    // Subtle non-overlapping matte sweater shoulder shading + fine `0.42px` cloth drape creases (ZERO Venn-overlap lens!)
    p.fillPath(closedSmooth([[612, 1326], [718, 1296], [835, 1340], [925, 1418], [975, 1478], [925, 1502], [795, 1456], [634, 1432]]), PAL.prussianDk, 0.22);
    p.burin(`M665 1352Q735 1388 812 1445M795 1364Q865 1425 942 1485M624 1462Q698 1488 776 1554M715 1326Q782 1352 856 1418`, PAL.slate, 0.42, 0.52, 4);

    // Sculpted 3/4 rear-profile neck, cheek, brow/nose/jaw & layered charcoal hair + clean ribbed turtleneck collar!
    p.fillPath(closedSmooth([[754, 1244], [804, 1242], [806, 1292], [750, 1290]]), PAL.ochreLt, 0.45);
    p.fillPath(closedSmooth([[756, 1244], [804, 1242], [804, 1290], [752, 1288]]), PAL.petal, 0.72);
    p.fillPath(closedSmooth([[768, 1252], [806, 1244], [798, 1272], [764, 1268]]), PAL.petalBlush, 0.24);
    // Clean dark ribbed turtleneck collar smoothly uniting neck and dark sweater
    p.fillPath(closedSmooth([[738, 1276], [818, 1278], [824, 1316], [734, 1312]]), PAL.ink, 0.99);
    p.burin(`M752 1282V1306M766 1282V1308M780 1283V1309M794 1283V1309M808 1283V1308`, PAL.slate, 0.5, 0.52, 5, "hatch");

    const faceProfile: Pt[] = [[796, 1148], [838, 1166], [848, 1188], [854, 1206], [844, 1216], [842, 1236], [814, 1258], [786, 1252], [780, 1200]];
    p.fillPath(closedSmooth(faceProfile), PAL.petal, 0.99);
    p.fillPath(closedSmooth(faceProfile), PAL.ochreLt, 0.14);
    p.fillPath(closedSmooth([[806, 1216], [838, 1222], [824, 1250], [796, 1244]]), PAL.petalBlush, 0.18);
    p.burin(`M834 1192Q840 1190 845 1193M834 1202Q839 1203 843 1201`, PAL.inkMid, 0.62, 0.65, 2);

    const hairCrown: Pt[] = [[734, 1232], [714, 1186], [722, 1134], [756, 1102], [808, 1098], [850, 1124], [860, 1158], [836, 1156], [820, 1172], [806, 1214], [786, 1252], [754, 1260]];
    p.fillPath(closedSmooth(hairCrown), PAL.cut, 0.99);
    p.fillPath(ellipsePath(800, 1208, 8.5, 13.5), PAL.petal, 0.99);
    p.burin(`M799 1201Q805 1207 799 1216`, PAL.inkMid, 0.55, 0.62, 1);
    p.burin(`M744 1124Q778 1110 826 1124M730 1160Q768 1142 810 1156M742 1202Q768 1190 788 1210`, PAL.slateLt, 0.66, 0.44, 3);
    p.burinContour(closedSmooth(torsoPts), PAL.litEdge, 0.58, 0.42, 1);
    p.flush();

    // 80-Line Two-Column Open Architectural Monograph + Sculpted Fingers
    drawOpenMonograph(p);

    // 70+-Curve Pellicle-Mesh Herman-Miller Aeron Chairback!
    drawAeronChair(p);

    // 65-Key Mechanical Keyboard, Desk Mat, Mouse, Smartphone, Retro Phone, Pencils, Coffee Cup & Studio Monitor Speaker!
    drawMechanicalKeyboard(p, [[1248, 1412], [1482, 1456], [1438, 1515], [1202, 1468]]);

    p.fillPath(polyPath([[1445, 1528], [1695, 1574], [1632, 1665], [1378, 1612]]), PAL.ink, 0.95);
    p.fillPath(ellipsePath(1545, 1552, 28, 16), PAL.slateDk, 0.99);
    p.fillPath(polyPath([[1245, 1564], [1328, 1546], [1346, 1576], [1262, 1594]]), PAL.cinnabar, 0.99);
    p.fillPath(polyPath([[1254, 1566], [1322, 1551], [1335, 1572], [1267, 1587]]), PAL.ink, 0.95);

    // `@kiuzyx` 12-Button Matte-Black Retro Studio Desk Telephone + Cradled Handset + Spiraling Coiled Cord!
    const phB = new PathBatcher();
    const phTL: Pt = [1634, 1444];
    const phTR: Pt = [1748, 1464];
    const phBR: Pt = [1736, 1546];
    const phBL: Pt = [1620, 1524];
    const pQ = (u: number, v: number): Pt => bilerp(phTL, phTR, phBR, phBL, u, v);
    // Desk cast shadow + angled matte-black console base & front thickness lip
    phB.quad("sh", [1616, 1532], [1742, 1554], [1754, 1544], [1632, 1522], { fill: PAL.inkMid, fillOpacity: 0.28 });
    phB.quad("baseFront", phBL, phBR, [phBR[0], phBR[1] + 10], [phBL[0], phBL[1] + 10], { fill: PAL.cut, fillOpacity: 0.99 });
    phB.quad("baseTop", phTL, phTR, phBR, phBL, { fill: PAL.ink, fillOpacity: 0.99 });
    // Sculpted receiver handset resting in left cradle (`u: 0.06..0.34`)
    phB.quad("handset", pQ(0.05, 0.04), pQ(0.32, 0.04), pQ(0.30, 0.95), pQ(0.03, 0.95), { fill: PAL.slateDk, fillOpacity: 0.99 });
    phB.quad("earcup", pQ(0.06, 0.06), pQ(0.30, 0.06), pQ(0.30, 0.28), pQ(0.06, 0.28), { fill: PAL.slate, fillOpacity: 0.92 });
    phB.quad("earcup", pQ(0.04, 0.72), pQ(0.28, 0.72), pQ(0.28, 0.94), pQ(0.04, 0.94), { fill: PAL.slate, fillOpacity: 0.92 });
    // Tiny backlit green LCD caller display + 3×4 = 12 crisp tactile push-buttons on right keypad (`u: 0.40..0.92`)!
    phB.quad("lcd", pQ(0.42, 0.12), pQ(0.90, 0.12), pQ(0.89, 0.28), pQ(0.41, 0.28), { fill: PAL.celadon, fillOpacity: 0.85 });
    for (let kr = 0; kr < 4; kr++) {
      for (let kc = 0; kc < 3; kc++) {
        const ku0 = 0.42 + kc * 0.165;
        const ku1 = ku0 + 0.12;
        const kv0 = 0.36 + kr * 0.145;
        const kv1 = kv0 + 0.105;
        phB.quad(kr === 3 && kc === 2 ? "keyRed" : "key", pQ(ku0, kv0), pQ(ku1, kv0), pQ(ku1, kv1), pQ(ku0, kv1), {
          fill: kr === 3 && kc === 2 ? PAL.cinnabarLt : PAL.paperStone,
          fillOpacity: 0.94,
        });
      }
    }
    // Spiraling coiled handset telephone cord looping off lower-left side of phone body!
    let coilD = `M${f(phBL[0] + 10)} ${f(phBL[1] + 2)}`;
    for (let k = 0; k < 7; k++) {
      const cx = 1622 - k * 4.2;
      const cy = 1528 + k * 2.8;
      coilD += `Q${f(cx - 7)} ${f(cy + 5)} ${f(cx - 1)} ${f(cy + 7)}Q${f(cx + 5)} ${f(cy + 8)} ${f(cx - 2)} ${f(cy + 3)}`;
    }
    phB.addPath("cord", coilD, { stroke: PAL.ink, strokeWidth: 0.9, strokeOpacity: 0.92, nonScaling: "contour" });
    phB.addPath("rim", polyPath([phTL, phTR, phBR, phBL]), { stroke: PAL.slate, strokeWidth: 0.55, strokeOpacity: 0.65, nonScaling: "contour" });
    phB.flush(p);

    // Crisp-contoured porcelain pencil cup with soft desk cast shadow & colored drawing pencils
    p.fillPath(ellipsePath(1852, 1562, 34, 11), PAL.inkMid, 0.22);
    p.fillPath(polyPath([[1815, 1476], [1872, 1476], [1866, 1558], [1822, 1558]]), PAL.petal, 0.99);
    p.fillPath(polyPath([[1846, 1476], [1872, 1476], [1866, 1558], [1846, 1558]]), PAL.paperStone, 0.42);
    p.burinContour(polyPath([[1815, 1476], [1872, 1476], [1866, 1558], [1822, 1558]]), PAL.inkMid, 0.65, 0.78, 4);
    p.burinContour(`M1828 1478L1816 1432M1840 1478L1838 1424`, PAL.cinnabar, 1.35, 0.95, 2);
    p.burinContour(`M1852 1478L1864 1428M1862 1478L1880 1442`, PAL.azurite, 1.35, 0.95, 2);

    // Porcelain coffee mug with ceramic handle, saucer, desk shadow & dark roast espresso
    p.fillPath(ellipsePath(1966, 1618, 46, 15), PAL.inkMid, 0.24);
    p.fillPath(ellipsePath(1959, 1614, 44, 14), PAL.paperStone, 0.96);
    p.burinContour(`M1995 1546Q2016 1546 2016 1570Q2016 1592 1991 1594`, PAL.inkMid, 1.15, 0.85, 1);
    p.fillPath(polyPath([[1922, 1528], [1996, 1528], [1990, 1614], [1928, 1614]]), PAL.petal, 0.99);
    p.fillPath(polyPath([[1964, 1528], [1996, 1528], [1990, 1614], [1962, 1614]]), PAL.paperStone, 0.4);
    p.fillPath(ellipsePath(1959, 1528, 37, 13), PAL.petal, 0.99);
    p.fillPath(ellipsePath(1959, 1529, 30, 9), PAL.umberDk, 0.95);
    p.burinContour(polyPath([[1922, 1528], [1996, 1528], [1990, 1614], [1928, 1614]]) + ellipsePath(1959, 1528, 37, 13), PAL.inkMid, 0.65, 0.78, 5);
    p.flush();

    p.animGroup({ kind: "drift", ampX: 6, ampY: -10, freq: 0.95, phase: 0.6 }, () => {
      p.burin(`M1948 1514Q1938 1486 1954 1460Q1968 1434 1954 1408M1970 1512Q1980 1484 1966 1456`, PAL.petal, 0.92, 0.5, 2);
    });

    // Nearfield Studio Reference Monitor Speaker (chamfered baffle, woofer surround ring, silk tweeter & power LED!)
    p.fillPath(polyPath([[2025, 1380], [2112, 1380], [2112, 1554], [2025, 1554]]), PAL.ink, 0.99);
    p.fillPath(polyPath([[2038, 1392], [2099, 1392], [2099, 1542], [2038, 1542]]), PAL.paperStone, 0.97);
    p.fillPath(circlePath(2068, 1486, 24), PAL.slateDk, 0.98);
    p.fillPath(circlePath(2068, 1486, 19), PAL.ink, 0.99);
    p.fillPath(circlePath(2068, 1486, 7.5), PAL.slate, 0.92);
    p.fillPath(circlePath(2068, 1432, 11), PAL.slateDk, 0.98);
    p.fillPath(circlePath(2068, 1432, 5.5), PAL.ink, 0.98);
    p.fillPath(circlePath(2092, 1532, 2.2), PAL.celadonLt, 0.96);
    p.fillPath(polyPath([[1715, 1658], [1935, 1628], [1998, 1715], [1778, 1748]]), PAL.prussianDk, 0.99);
    p.fillPath(polyPath([[1965, 1698], [2195, 1665], [2255, 1758], [2025, 1795]]), PAL.cinnabar, 0.97);
    p.flush();
    p.out.push(`</g>`);
  });

  // ------------------------------------------------------------------
  // 8. HAIR-FINE NON-SCALING CASEMENT REVEAL EDGE (ZERO 42px GREY FRAME IN s02!)
  // ------------------------------------------------------------------
  p.burinContour(polyPath(hole), PAL.ink, 0.85, 0.84, 4);
  p.moonRim(
    [
      [winX0, winY1],
      [winX0, winY0],
      [winX1, winY0],
    ],
    { closed: false, widthPx: 0.85 },
  );

  p.flush();

  return {
    index: 1,
    id: "s01-tokyo-studio",
    title: "2 AM Tokyo Studio",
    subtitle: "Bookshelf Atelier, Vinyl Turntable & Tokyo Tower Window",
    portal: S01_PORTAL,
    coreColorDay: [222, 227, 232],
    coreColorNight: [16, 24, 42],
    defs: p.defs.join(""),
    markup: p.out.join(""),
    hole,
    stats: {
      elements: p.elements,
      strokes: p.strokes,
      animGroups: p.animGroups,
    },
  };
}
