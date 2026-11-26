// Octave 00 — Chicago River Canyon, Miesian Towers, Steel Bascule Bridges & Curved L-Train Viaduct.
// Stage-5 5x Micro-Craft Overhaul (direct @kiuzyx Chicago parity via PathBatcher compound batching):
//   - 26+ overlapping dense 3D Chicago skyscrapers & masonry lofts (`curtainSkyscraper3D` +
//     `brickLoftBuilding3D`) packed with 14–26 cols x 24–48 floors of micro 3–6 px windows,
//     vertical limestone/steel piers, recessed spandrels, half-drawn blinds & rooftop penthouses
//     (ZERO giant cartoon arches, ZERO candy-cane awnings!).
//   - Continuous diagonal Prussian Chicago River (mineral teal/celadon in Day, warm city-light
//     reflections gated strictly to Night) crossed by lacy riveted `trussBridgeSpan` Warren/Pratt
//     bascule bridges & an elevated X-truss L-train viaduct carrying a gliding 4-car stainless CTA train.
//   - Lush Millennium Park plaza framed by 6 foreground rooftops, smooth Cloud Gate with concentric
//     paving rings, 5-tone `stippleTreeCluster` trees, 3D buses & sedans, and 85+ micro-pedestrians.
//   - Lower-right portal `(1540, 880)` (`[1336..1746, 742..1018]` = `410x276`, 0px border in `day-o01`!):
//     6-story terracotta & limestone Chicago School corner architecture gallery (60 finely mullioned
//     tripartite sash windows above a recessed 3D Miesian bronze-and-limestone corner gallery vitrine!).

import {
  PAL,
  Painter,
  PathBatcher,
  P,
  bilerp,
  brickLoftBuilding3D,
  circlePath,
  closedSmooth,
  curtainSkyscraper3D,
  ellipsePath,
  f,
  lerp,
  polyPath,
  quad,
  rand,
  rectWindowHole,
  sample,
  stippleTreeCluster,
  trussBridgeSpan,
  type Pt,
} from "../kit.ts";
import {
  BLEED,
  requiredPortalClearBox,
  validatePortalHole,
  type OctaveScene,
  type PortalSpec,
} from "./types.ts";

export const S00_PORTAL: PortalSpec = { cx: 1540, cy: 880, rx: 205, ry: 138 };
const S01_PORTAL: PortalSpec = { cx: 850, cy: 540, rx: 204, ry: 136 };

/** Draws a fluted stainless-steel 4-car CTA L-train (`11` micro window/door bays & twin roof HVAC pods/car!). */
function drawCTATrain(p: Painter, start: Pt, end: Pt): void {
  const dir = [end[0] - start[0], end[1] - start[1]] as const;
  const len = Math.hypot(dir[0], dir[1]) || 1;
  const ux = dir[0] / len;
  const uy = dir[1] / len;
  const cars = 4;
  const carLen = 96;
  const gap = 5;
  const carH = 23;

  const b = new PathBatcher();
  const bWin = new PathBatcher();
  const bLine = new PathBatcher();
  for (let c = 0; c < cars; c++) {
    const d0 = c * (carLen + gap);
    const d1 = d0 + carLen;
    const p0: Pt = [start[0] + ux * d0, start[1] + uy * d0];
    const p1: Pt = [start[0] + ux * d1, start[1] + uy * d1];
    const top0: Pt = [p0[0], p0[1] - carH];
    const top1: Pt = [p1[0], p1[1] - carH];
    const roof0: Pt = [top0[0] - 8, top0[1] - 5.5];
    const roof1: Pt = [top1[0] - 8, top1[1] - 5.5];

    // Dark rubber gangway coupler connecting consecutive cars
    if (c > 0) {
      const prevEnd: Pt = [start[0] + ux * (d0 - gap), start[1] + uy * (d0 - gap)];
      b.quad("coupler", [prevEnd[0], prevEnd[1] - carH + 3], [p0[0], p0[1] - carH + 3], [p0[0], p0[1] - 2], [prevEnd[0], prevEnd[1] - 2], { fill: PAL.ink, fillOpacity: 0.92 });
    }

    b.quad("roof", roof0, roof1, top1, top0, { fill: PAL.paperStone, fillOpacity: 0.98 });
    b.quad("body", top0, top1, p1, p0, { fill: PAL.paperWarm, fillOpacity: 0.99 });
    // CTA metallic steel lower skirt + colored route stripe
    b.quad(
      c === 0 ? "stripeRed" : "stripeBlu",
      lerp(top0, p0, 0.74),
      lerp(top1, p1, 0.74),
      lerp(top1, p1, 0.87),
      lerp(top0, p0, 0.87),
      { fill: c === 0 ? PAL.cinnabar : PAL.azurite, fillOpacity: 0.96 },
    );
    b.quad("skirt", lerp(top0, p0, 0.87), lerp(top1, p1, 0.87), p1, p0, { fill: PAL.slate, fillOpacity: 0.94 });

    // Twin low-profile stainless roof HVAC condenser pods per car
    for (const [uA, uB] of [[0.18, 0.36], [0.64, 0.82]] as const) {
      const acA = lerp(roof0, roof1, uA);
      const acB = lerp(roof0, roof1, uB);
      b.quad("ac", [acA[0] + 1, acA[1] - 3], [acB[0] + 1, acB[1] - 3], acB, acA, { fill: PAL.slateDk, fillOpacity: 0.9 });
    }

    // Fine corrugated stainless-steel horizontal fluting ribs
    for (const v of [0.14, 0.62, 0.7, 0.74, 0.87]) {
      const fa = lerp(top0, p0, v);
      const fb = lerp(top1, p1, v);
      bLine.line("flute", fa[0], fa[1], fb[0], fb[1], { stroke: PAL.slate, strokeWidth: 0.34, strokeOpacity: 0.68, nonScaling: "hatch" });
    }

    // 11 tight micro window & bi-parting sliding-door bays matching `3–5px` skyscraper rhythm!
    const bays = 11;
    for (let w = 0; w < bays; w++) {
      const u0 = 0.035 + w * 0.085;
      const u1 = u0 + 0.064;
      const isDoor = w === 2 || w === 3 || w === 7 || w === 8;
      const vBot = isDoor ? 0.68 : 0.56;
      const isLit = (c * 5 + w * 3) % 3 !== 0;
      bWin.quad(
        isLit ? "litWin" : "dkWin",
        bilerp(top0, top1, p1, p0, u0, 0.2),
        bilerp(top0, top1, p1, p0, u1, 0.2),
        bilerp(top0, top1, p1, p0, u1, vBot),
        bilerp(top0, top1, p1, p0, u0, vBot),
        { fill: isLit ? PAL.windowLit : PAL.prussianDk, fillOpacity: 0.95 },
      );
      if (w === 2 || w === 7) {
        // Bi-parting sliding passenger door seam running full height
        const dsT = bilerp(top0, top1, p1, p0, u1 + 0.01, 0.12);
        const dsB = bilerp(top0, top1, p1, p0, u1 + 0.01, 0.95);
        bLine.line("doorSeam", dsT[0], dsT[1], dsB[0], dsB[1], { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.82, nonScaling: "hatch" });
      }
    }

    if (c === cars - 1) {
      bWin.quad("nose", top1, [top1[0] + 7, top1[1] - 4], [p1[0] + 8, p1[1] - 4], p1, { fill: PAL.slateDk, fillOpacity: 0.98 });
      bWin.circle("head", p1[0] + 5.5, p1[1] - 7, 2.2, { fill: PAL.lanternCore, fillOpacity: 0.98 });
    }
    bLine.addPath("outline", polyPath([top0, top1, p1, p0]) + polyPath([roof0, roof1, top1, top0]), {
      stroke: PAL.ink,
      strokeWidth: 0.54,
      strokeOpacity: 0.8,
      nonScaling: "contour",
    });
  }
  b.flush(p);
  bWin.flush(p);
  bLine.flush(p);
  const lastD = (cars - 1) * (carLen + gap) + carLen;
  const lx = start[0] + ux * lastD;
  const ly = start[1] + uy * lastD;
  p.layer("var(--z-lume-op)", () => {
    p.fillPath(`M${f(lx + 7)} ${f(ly - 7)}L${f(lx + 72)} ${f(ly - 26)}L${f(lx + 72)} ${f(ly + 2)}Z`, PAL.lantern, 0.28);
  });
}

/** Draws bridge-tender Beaux-Arts operator towers flanking each Chicago bascule bridge. */
function drawBridgeTenders(p: Painter, ax: number, ay: number, bx: number, by: number): void {
  const b = new PathBatcher();
  for (const [tx, ty] of [[ax - 22, ay - 26], [bx - 8, by - 26]] as const) {
    b.rect("wall", tx, ty, 28, 42, { fill: PAL.paperWarm, fillOpacity: 0.99 });
    b.rect("shade", tx + 16, ty, 12, 42, { fill: PAL.paperDeep, fillOpacity: 0.85 });
    b.addPath("roof", `M${f(tx - 3)} ${f(ty)}L${f(tx + 14)} ${f(ty - 13)}L${f(tx + 31)} ${f(ty)}Z`, { fill: PAL.malachite, fillOpacity: 0.96 });
    b.rect("win", tx + 4, ty + 7, 9, 9, { fill: PAL.windowLit, fillOpacity: 0.94 });
    b.rect("win", tx + 19, ty + 7, 6, 9, { fill: PAL.windowLit, fillOpacity: 0.84 });
    b.addPath("rim", polyPath([[tx, ty], [tx + 28, ty], [tx + 28, ty + 42], [tx, ty + 42]]), {
      stroke: PAL.inkMid,
      strokeWidth: 0.52,
      strokeOpacity: 0.72,
      nonScaling: "contour",
    });
  }
  b.flush(p);
}

/** Draws 3D CTA city bus & oblique period vehicles in ONE compound PathBatcher pass! */
function drawStreetTraffic(p: Painter): void {
  const b = new PathBatcher();
  const addBus = (x: number, y: number, dx: number, dy: number) => {
    const h = 24;
    const offX = 14;
    const offY = -7;
    const fBL: Pt = [x, y];
    const fTL: Pt = [x, y - h];
    const bBL: Pt = [x + dx, y + dy];
    const bTL: Pt = [x + dx, y + dy - h];
    const fTR: Pt = [x + offX, y - h + offY];
    const bTR: Pt = [x + dx + offX, y + dy - h + offY];
    const bBR: Pt = [x + dx + offX, y + dy + offY];
    b.quad("sh", [x - 4, y + 3], [x + dx + 8, y + dy + 5], [x + dx + 16, y + dy + 10], [x + 8, y + 8], { fill: PAL.inkMid, fillOpacity: 0.34 });
    b.quad("rear", bTL, bTR, bBR, bBL, { fill: PAL.prussianDk, fillOpacity: 0.99 });
    b.quad("roof", fTL, fTR, bTR, bTL, { fill: PAL.petal, fillOpacity: 0.99 });
    b.quad("body", fTL, bTL, bBL, fBL, { fill: PAL.petal, fillOpacity: 0.99 });
    b.quad("stripe", lerp(fTL, fBL, 0.56), lerp(bTL, bBL, 0.56), bBL, fBL, { fill: PAL.azurite, fillOpacity: 0.98 });
    for (let i = 0; i < 6; i++) {
      const u0 = 0.06 + i * 0.148;
      const u1 = u0 + 0.112;
      b.quad("win", bilerp(fTL, bTL, bBL, fBL, u0, 0.14), bilerp(fTL, bTL, bBL, fBL, u1, 0.14), bilerp(fTL, bTL, bBL, fBL, u1, 0.48), bilerp(fTL, bTL, bBL, fBL, u0, 0.48), { fill: PAL.windowLit, fillOpacity: 0.94 });
    }
    b.quad("front", fTL, fTR, [x + offX, y + offY], fBL, { fill: PAL.slateDk, fillOpacity: 0.98 });
    b.quad("glass", lerp(fTL, fBL, 0.14), lerp(fTR, [x + offX, y + offY], 0.14), lerp(fTR, [x + offX, y + offY], 0.52), lerp(fTL, fBL, 0.52), { fill: PAL.glass, fillOpacity: 0.92 });
    const w1 = lerp(fBL, bBL, 0.22);
    const w2 = lerp(fBL, bBL, 0.78);
    b.circle("wheel", w1[0], w1[1], 4.6, { fill: PAL.ink, fillOpacity: 0.98 });
    b.circle("wheel", w2[0], w2[1], 4.6, { fill: PAL.ink, fillOpacity: 0.98 });
    b.circle("head", x + 4, y - 5, 2.0, { fill: PAL.lanternCore, fillOpacity: 0.98 });
    b.circle("head", x + 11, y - 8, 2.0, { fill: PAL.lanternCore, fillOpacity: 0.98 });
  };

  const addCar = (x: number, y: number, dx: number, dy: number, colKey: string, bodyCol: string) => {
    const h = 11;
    const offX = 10;
    const offY = -5;
    const fBL: Pt = [x, y];
    const fTL: Pt = [x, y - h];
    const bBL: Pt = [x + dx, y + dy];
    const bTL: Pt = [x + dx, y + dy - h];
    const fTR: Pt = [x + offX, y - h + offY];
    const bTR: Pt = [x + dx + offX, y + dy - h + offY];
    b.quad("sh", [x - 3, y + 2], [x + dx + 6, y + dy + 4], [x + dx + 13, y + dy + 8], [x + 5, y + 6], { fill: PAL.inkMid, fillOpacity: 0.3 });
    b.quad(colKey, fTL, bTL, bBL, fBL, { fill: bodyCol, fillOpacity: 0.99 });
    b.quad(colKey, fTL, fTR, bTR, bTL, { fill: bodyCol, fillOpacity: 0.9 });
    const c0 = lerp(fTL, bTL, 0.24);
    const c1 = lerp(fTL, bTL, 0.74);
    const c2 = lerp(fTR, bTR, 0.72);
    const c3 = lerp(fTR, bTR, 0.26);
    b.quad(colKey, [c0[0], c0[1] - 7], [c1[0], c1[1] - 7], [c2[0], c2[1] - 7], [c3[0], c3[1] - 7], { fill: bodyCol, fillOpacity: 0.99 });
    b.quad("glass", c0, c1, [c1[0], c1[1] - 7], [c0[0], c0[1] - 7], { fill: PAL.glass, fillOpacity: 0.92 });
    const w1 = lerp(fBL, bBL, 0.22);
    const w2 = lerp(fBL, bBL, 0.78);
    b.circle("wheel", w1[0], w1[1], 3.4, { fill: PAL.ink, fillOpacity: 0.98 });
    b.circle("wheel", w2[0], w2[1], 3.4, { fill: PAL.ink, fillOpacity: 0.98 });
    b.circle("head", bBL[0] + 3, bBL[1] - 5, 1.8, { fill: PAL.lanternCore, fillOpacity: 0.98 });
    b.circle("tail", fBL[0] + 2, fBL[1] - 5, 1.6, { fill: PAL.cinnabarLt, fillOpacity: 0.96 });
  };

  addBus(1332, 1228, 108, 30);
  addBus(395, 1345, 92, -33);
  addCar(816, 1172, 44, -15, "carRed", PAL.cinnabar);
  addCar(625, 1244, 42, -15, "carCream", PAL.petal);
  addCar(1568, 1296, 46, 13, "carCream", PAL.petal);
  addCar(1762, 1352, 46, 13, "carBlu", PAL.prussian);
  addCar(1975, 1412, 46, 13, "carOchre", PAL.ochre);
  b.flush(p);
  p.layer("var(--z-lume-op)", () => {
    p.fillPath(
      `M1334 1223L1286 1210L1294 1232ZM397 1340L352 1356L362 1372Z`,
      PAL.lantern,
      0.24,
    );
  });
}

/** Draws batched cast-iron streetlamps with night-only layered halos (`var(--z-lume-op)` = 0 in Day!). */
function drawStreetLamps(p: Painter, pts: readonly (readonly [number, number, number])[]): void {
  p.layer("var(--z-lume-op)", () => {
    const hb = new PathBatcher();
    for (const [x, y, h] of pts) {
      hb.addPath("pool", ellipsePath(x + 12, y + 2, 38, 13), { fill: PAL.lantern, fillOpacity: 0.24 });
      hb.circle("haloOut", x + 12, y - h - 4, 28, { fill: PAL.lanternHalo, fillOpacity: 0.2 });
      hb.circle("haloIn", x + 12, y - h - 4, 13, { fill: PAL.lantern, fillOpacity: 0.34 });
    }
    hb.flush(p);
  });
  const b = new PathBatcher();
  for (const [x, y, h] of pts) {
    b.rect("base", x - 3, y - 7, 6, 7, { fill: PAL.ink, fillOpacity: 0.9 });
    b.addPath("post", `M${f(x)} ${f(y)}V${f(y - h)}Q${f(x)} ${f(y - h - 9)} ${f(x + 12)} ${f(y - h - 7)}`, {
      stroke: PAL.ink,
      strokeWidth: 0.92,
      strokeOpacity: 0.9,
      nonScaling: "contour",
    });
    b.circle("bulb", x + 12, y - h - 4, 3.2, { fill: PAL.lanternCore, fillOpacity: 0.96 });
  }
  b.flush(p);
}

export function buildS00Chicago(): OctaveScene {
  const p = new Painter("s00", 1042);
  const clearBox = requiredPortalClearBox(S00_PORTAL, S01_PORTAL);
  // `[1336..1746, 742..1018]` = `410x276`: strictly inside 484x328 sealBox AND clears 100% of s01's
  // `[1340..1740, 746.7..1013.3]` viewport at t=1.0 -> ZERO picture-frame border in day-o01.png!
  const hole = rectWindowHole(clearBox, { padL: 62, padR: 111, padTop: 40, padBot: 75 });
  validatePortalHole("s00", hole, S00_PORTAL, S01_PORTAL);

  const winX0 = hole[0][0]; // ~1336.6
  const winY0 = hole[0][1]; // ~742.6
  const winX1 = hole[2][0]; // ~1745.6
  const winY1 = hole[2][1]; // ~1017.6

  const skyGrad = p.linearGrad("sky", 0, BLEED.y0, 0, 560, [
    [0, PAL.azurite, 0.92],
    [0.52, PAL.glassTint, 0.96],
    [1, PAL.paperWarm, 1],
  ]);
  const riverGrad = p.linearGrad("river", 640, 260, -140, 1480, [
    [0, PAL.prussian, 0.99],
    [0.5, PAL.azurite, 0.99],
    [1, PAL.waterDeep, 0.99],
  ]);
  const plazaGrad = p.linearGrad("plaza", 200, 1020, 1180, 1860, [
    [0, PAL.paperWarm, 1],
    [0.6, PAL.paperDeep, 1],
    [1, PAL.paperStone, 1],
  ]);

  // 1. Opaque full-bleed backdrop punched strictly around the recessed corner gallery vitrine
  p.asymmetricPortalBackdrop(hole, PAL.paper);

  p.clippedToBackdrop(hole, () => {
    // Cerulean/midnight sky with crisp sky wedges peeking between soaring skyscraper setbacks
    p.fillPath(`M${BLEED.x0} ${BLEED.y0}H${BLEED.x1}V820H${BLEED.x0}Z`, skyGrad);
    p.layer("var(--z-star-op)", () => {
      let stars = "";
      for (let i = 0; i < 52; i++) {
        stars += circlePath(rand(p.r, -280, 2680), rand(p.r, -220, 190), rand(p.r, 0.9, 1.8));
      }
      p.fillPath(stars, PAL.lanternCore, 0.86);
    });
    p.flush();

    // ------------------------------------------------------------------
    // 2. FAR & MID-UPPER SKYLINE — 12 Overlapping Dense `@kiuzyx` Skyscrapers (`14–24` cols x `28–46` rows!)
    // ------------------------------------------------------------------
    // Far-left warm terracotta-cream setback tower
    curtainSkyscraper3D(p, {
      cx: -145, topY: -220, baseY: 510, wL: 245, wR: 135, colsL: 16, colsR: 10, rows: 36,
      wallL: PAL.paperWarm, wallR: PAL.cinnabarLt, roofFill: PAL.paperStone, litChance: 0.24, roofDetail: "penthouse",
    });
    // Far-left-mid stepped limestone tower peeking behind blue glass tower
    curtainSkyscraper3D(p, {
      cx: 65, topY: -120, baseY: 540, wL: 155, wR: 120, colsL: 14, colsR: 10, rows: 34,
      wallL: PAL.paperStone, wallR: PAL.paperDeep, glassL: PAL.slate, glassR: PAL.prussianDk, litChance: 0.22, roofDetail: "hvac",
    });
    // Curved/stepped azure-glass office tower (sky wedge above y = 55!)
    curtainSkyscraper3D(p, {
      cx: 195, topY: 74, baseY: 610, wL: 215, wR: 145, colsL: 18, colsR: 12, rows: 32,
      wallL: PAL.azurite, wallR: PAL.prussian, glassL: PAL.prussianDk, glassR: PAL.cut, tintFill: PAL.celadonLt,
      mullionColor: PAL.paperWarm, litChance: 0.26, roofDetail: "penthouse",
    });
    // HERO STEPPED MIESIAN OBSIDIAN-BRONZE MONOLITH (Willis/Sears Tower — 1,600+ micro panes!)
    curtainSkyscraper3D(p, {
      cx: 565, topY: -260, baseY: 580, wL: 255, wR: 175, colsL: 22, colsR: 14, rows: 48,
      wallL: PAL.ink, wallR: PAL.cut, glassL: PAL.prussianDk, glassR: PAL.cut, tintFill: PAL.prussian,
      mullionColor: PAL.slate, litChance: 0.28, pierEvery: 4, setback: { fracH: 0.32, inset: 0.24 }, roofDetail: "spire",
    });
    // Slender cream Art Deco setback limestone skyscraper with spire (sky wedge above!)
    curtainSkyscraper3D(p, {
      cx: 925, topY: 42, baseY: 615, wL: 175, wR: 130, colsL: 15, colsR: 11, rows: 34,
      wallL: PAL.paperWarm, wallR: PAL.paperDeep, glassL: PAL.windowDim, glassR: PAL.prussianDk,
      litChance: 0.26, setback: { fracH: 0.28, inset: 0.28 }, roofDetail: "spire",
    });
    // Mid-center bronze Miesian setback slab behind blue-steel tower
    curtainSkyscraper3D(p, {
      cx: 1155, topY: -185, baseY: 525, wL: 165, wR: 125, colsL: 14, colsR: 10, rows: 38,
      wallL: PAL.umberDk, wallR: PAL.ink, glassL: PAL.prussianDk, glassR: PAL.cut, mullionColor: PAL.ochre, litChance: 0.3, roofDetail: "hvac",
    });
    // Wide blue-steel International Style curtain tower rising behind corner gallery (sky wedge at y = 24!)
    curtainSkyscraper3D(p, {
      cx: 1455, topY: 44, baseY: 555, wL: 285, wR: 210, colsL: 22, colsR: 16, rows: 32,
      wallL: PAL.prussianLt, wallR: PAL.prussian, glassL: PAL.prussianDk, glassR: PAL.cut, tintFill: PAL.glass,
      mullionColor: PAL.paperStone, litChance: 0.3, roofDetail: "penthouse",
    });
    // Upper-right soaring Miesian obsidian curtain monolith
    curtainSkyscraper3D(p, {
      cx: 1965, topY: -240, baseY: 610, wL: 265, wR: 205, colsL: 22, colsR: 16, rows: 46,
      wallL: PAL.slateDk, wallR: PAL.ink, glassL: PAL.cut, glassR: PAL.cut, tintFill: PAL.prussian,
      mullionColor: PAL.slateLt, litChance: 0.34, setback: { fracH: 0.26, inset: 0.22 }, roofDetail: "penthouse",
    });
    // Far-right warm limestone Art Deco tower + terracotta annex
    curtainSkyscraper3D(p, {
      cx: 2435, topY: 22, baseY: 710, wL: 235, wR: 185, colsL: 18, colsR: 14, rows: 38,
      wallL: PAL.paperStone, wallR: PAL.umberLt, litChance: 0.26, roofDetail: "watertank",
    });
    curtainSkyscraper3D(p, {
      cx: 2685, topY: -190, baseY: 740, wL: 145, wR: 155, colsL: 12, colsR: 12, rows: 42,
      wallL: PAL.paperWarm, wallR: PAL.paperDeep, litChance: 0.28, roofDetail: "penthouse",
    });

    // ------------------------------------------------------------------
    // 3. CONTINUOUS DIAGONAL CHICAGO RIVER, LACY TRUSS BRIDGES & SIGHTSEEING BOAT
    // ------------------------------------------------------------------
    // River winds naturally deep into the northern skyscraper canyon (ZERO dead-end bathtub cap!)
    const riverPoly: Pt[] = [
      [680, 145], [960, 145], [965, 340], [885, 575], [620, 880],
      [345, 1185], [-40, 1520], [-380, 1520], [-380, 1085], [65, 760], [365, 495], [565, 290],
    ];
    p.fillPath(polyPath(riverPoly), riverGrad);

    // Pure mineral teal/celadon reflections shimmering all the way north to y = 165 (zero red/yellow sticks!)
    p.brokenWaterReflections(
      [[635, 165], [952, 165], [330, 1180], [-240, 1180]],
      { base: false, primary: PAL.celadon, deep: PAL.waterDeep, shimmer: PAL.waterShimmer },
      { rows: 54, opacity: 0.76, flush: true },
    );
    // Warm amber/cinnabar city-light river reflections strictly gated to Night (`var(--z-lume-op)` = 0 in Day!)
    p.layer("var(--z-lume-op)", () => {
      p.brokenWaterReflections(
        [[610, 185], [935, 185], [320, 1140], [-200, 1140]],
        { base: false, primary: PAL.lantern, deep: PAL.cinnabarLt, shimmer: PAL.lanternCore },
        { rows: 28, opacity: 0.54, flush: true },
      );
    });

    // Slender dressed-limestone Riverwalk seawalls with continuous iron balustrade railings on BOTH quays!
    const leftBankWall: Pt[] = [[648, 155], [678, 155], [562, 305], [382, 502], [84, 772], [-380, 1110], [-380, 1068], [48, 742], [346, 480], [534, 286]];
    const rightBankWalk: Pt[] = [[942, 155], [984, 155], [992, 348], [922, 595], [662, 908], [422, 1212], [42, 1545], [-40, 1520], [345, 1185], [620, 880], [885, 575], [952, 340]];
    p.fillPath(polyPath(leftBankWall), PAL.paperDeep, 0.98);
    p.fillPath(polyPath(rightBankWalk), PAL.paperWarm, 0.99);
    // Stone quay slab joints & continuous iron riverwalk railings along BOTH left & right quays
    const qw = new PathBatcher();
    qw.addPath("quayRim", polyPath(leftBankWall) + polyPath(rightBankWalk), { stroke: PAL.inkMid, strokeWidth: 0.54, strokeOpacity: 0.74, nonScaling: "contour" });
    // Right quay top handrail & posts (upper + mid + lower)
    const rRailPts: readonly [Pt, Pt][] = [
      [[952, 170], [950, 340]],
      [[950, 340], [886, 575]],
      [[886, 575], [622, 880]],
      [[622, 880], [348, 1185]],
    ];
    for (const [ra, rbPt] of rRailPts) {
      qw.line("railTop", ra[0] + 6, ra[1] - 7, rbPt[0] + 6, rbPt[1] - 7, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.76, nonScaling: "hatch" });
      for (let k = 0; k <= 10; k++) {
        const pt = lerp(ra, rbPt, k / 10);
        qw.line("railPost", pt[0] + 6, pt[1], pt[0] + 6, pt[1] - 7, { stroke: PAL.inkMid, strokeWidth: 0.42, strokeOpacity: 0.7, nonScaling: "hatch" });
        qw.line("slabJoint", pt[0] + 2, pt[1], pt[0] + 34, pt[1] + 8, { stroke: PAL.inkHair, strokeWidth: 0.34, strokeOpacity: 0.48, nonScaling: "hatch" });
      }
    }
    // Left quay top handrail & posts
    const lRailPts: readonly [Pt, Pt][] = [
      [[664, 170], [550, 304]],
      [[550, 304], [370, 498]],
      [[370, 498], [74, 766]],
    ];
    for (const [la, lbPt] of lRailPts) {
      qw.line("railTop", la[0] - 5, la[1] - 6, lbPt[0] - 5, lbPt[1] - 6, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.72, nonScaling: "hatch" });
      for (let k = 0; k <= 8; k++) {
        const pt = lerp(la, lbPt, k / 8);
        qw.line("railPost", pt[0] - 5, pt[1], pt[0] - 5, pt[1] - 6, { stroke: PAL.inkMid, strokeWidth: 0.4, strokeOpacity: 0.66, nonScaling: "hatch" });
      }
    }
    qw.flush(p);

    // Velvety `stippleTreeCluster` riverwalk trees lining BOTH upper & mid Chicago River quays!
    stippleTreeCluster(
      p,
      p.r,
      [
        { cx: 584, cy: 238, rx: 20, ry: 15, trunkBaseY: 256, trunkWidth: 2.8, density: 1.0 },
        { cx: 486, cy: 350, rx: 22, ry: 16, trunkBaseY: 370, trunkWidth: 3.0, density: 1.0 },
        { cx: 382, cy: 458, rx: 22, ry: 17, trunkBaseY: 480, trunkWidth: 3.2, density: 1.0 },
        { cx: 974, cy: 222, rx: 20, ry: 15, trunkBaseY: 242, trunkWidth: 2.8, density: 1.0 },
        { cx: 972, cy: 332, rx: 22, ry: 16, trunkBaseY: 354, trunkWidth: 3.0, density: 1.0 },
        { cx: 942, cy: 486, rx: 24, ry: 18, trunkBaseY: 510, trunkWidth: 3.2, density: 1.05 },
        { cx: 716, cy: 814, rx: 26, ry: 19, trunkBaseY: 840, trunkWidth: 3.5, density: 1.1 },
      ],
      { dabSize: 4.8, palette: { trunk: PAL.barkDk } },
    );

    // Far-north riveted Pratt steel truss bridge spanning the upper canyon bend (`y = 266`, replaces thin hairline!)
    trussBridgeSpan(p, {
      p0: [576, 266], p1: [974, 266], depth: 24, bays: 18, kind: "pratt",
      steelColor: PAL.prussianDk, highlightColor: PAL.paperWarm, deck: true,
    });
    drawBridgeTenders(p, 576, 266, 974, 266);

    // Upper-river riveted steel Warren/open-spandrel arch bridge spanning the bend (`y = 436`)
    const archTop = sample(quad([488, 438], [712, 354], [932, 438]), 24);
    const archBot = sample(quad([488, 444], [712, 362], [932, 444]), 24);
    const ab = new PathBatcher();
    ab.addPath("archRib", polyPath([...archTop, ...[...archBot].reverse()]), { fill: PAL.slateDk, fillOpacity: 0.94 });
    ab.rect("deck", 482, 436, 456, 9, { fill: PAL.paperStone, fillOpacity: 0.98 });
    ab.rect("deckShade", 482, 443, 456, 3.5, { fill: PAL.slate, fillOpacity: 0.85 });
    for (let i = 2; i < archTop.length - 2; i++) {
      ab.line("hanger", archBot[i][0], archBot[i][1], archBot[i][0], 436, { stroke: PAL.inkMid, strokeWidth: 0.42, strokeOpacity: 0.78, nonScaling: "hatch" });
      if (i % 2 === 0 && i + 2 < archTop.length - 2) {
        ab.line("hanger", archBot[i][0], archBot[i][1], archBot[i + 1][0], 436, { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.62, nonScaling: "hatch" });
      }
    }
    ab.addPath("rim", polyPath([[482, 436], [938, 436], [938, 446], [482, 446]]), { stroke: PAL.ink, strokeWidth: 0.56, strokeOpacity: 0.82, nonScaling: "contour" });
    ab.flush(p);

    // Mid-river lacy riveted cinnabar-red Warren bascule bridge (`trussBridgeSpan`!)
    trussBridgeSpan(p, {
      p0: [242, 668], p1: [792, 668], depth: 28, bays: 20, kind: "warren",
      steelColor: PAL.cinnabar, highlightColor: PAL.cinnabarLt, deck: true,
    });
    drawBridgeTenders(p, 242, 668, 792, 668);

    // Animated white Chicago sightseeing tour boat gliding smoothly down-river
    p.animGroup({ kind: "drift", ampX: -14, ampY: 16, freq: 0.72, phase: 0.4 }, () => {
      const bx = 338;
      const by = 824;
      p.burin(
        `M${f(bx + 26)} ${f(by - 28)}L${f(bx + 62)} ${f(by - 62)}M${f(bx + 18)} ${f(by - 20)}L${f(bx + 44)} ${f(by - 58)}M${f(bx + 32)} ${f(by - 18)}L${f(bx + 68)} ${f(by - 48)}`,
        PAL.waterShimmer,
        0.88,
        0.78,
        3,
      );
      p.fillPath(polyPath([[bx - 40, by + 30], [bx + 22, by - 28], [bx + 40, by - 14], [bx - 16, by + 42], [bx - 42, by + 42]]), PAL.petal, 0.99);
      p.fillPath(polyPath([[bx - 22, by + 24], [bx + 18, by - 14], [bx + 28, by - 4], [bx - 10, by + 34]]), PAL.azurite, 0.95);
      p.fillPath(polyPath([[bx - 16, by + 15], [bx + 14, by - 15], [bx + 22, by - 7], [bx - 6, by + 23]]), PAL.paperWarm, 0.99);
      p.burinContour(`M${f(bx - 20)} ${f(by + 26)}L${f(bx + 20)} ${f(by - 12)}`, PAL.windowLit, 1.2, 0.94, 1);
      p.burinContour(polyPath([[bx - 40, by + 30], [bx + 22, by - 28], [bx + 40, by - 14], [bx - 16, by + 42], [bx - 42, by + 42]]), PAL.ink, 0.6, 0.82, 5);
    });

    // Lower-river lacy riveted cinnabar-red Pratt bascule bridge (`trussBridgeSpan`!)
    trussBridgeSpan(p, {
      p0: [-95, 962], p1: [536, 962], depth: 32, bays: 22, kind: "pratt",
      steelColor: PAL.cinnabar, highlightColor: PAL.cinnabarLt, deck: true,
    });
    drawBridgeTenders(p, -95, 962, 536, 962);

    // ------------------------------------------------------------------
    // 4. MID-GROUND CHICAGO LOFTS (`brickLoftBuilding3D`) & LACY STEEL L-TRAIN VIADUCT!
    // ------------------------------------------------------------------
    // Crisp white glazed-terracotta Loop office block behind viaduct (16x12 fine windows!)
    curtainSkyscraper3D(p, {
      cx: 175, topY: 365, baseY: 688, wL: 215, wR: 135, colsL: 16, colsR: 10, rows: 16,
      wallL: PAL.paper, wallR: PAL.paperDeep, glassL: PAL.azurite, glassR: PAL.prussian, litChance: 0.2, roofDetail: "penthouse",
    });

    // Lacy riveted Prussian-steel elevated L-train X-truss viaduct (`trussBridgeSpan` × 2 curved chords!)
    trussBridgeSpan(p, {
      p0: [-380, 742], p1: [475, 548], depth: 30, bays: 22, kind: "x-truss",
      steelColor: PAL.prussianDk, highlightColor: PAL.litEdge, deck: true, piers: 4, groundY: 845,
    });
    trussBridgeSpan(p, {
      p0: [475, 548], p1: [1295, 368], depth: 28, bays: 22, kind: "x-truss",
      steelColor: PAL.prussianDk, highlightColor: PAL.litEdge, deck: true, piers: 3, groundY: 675,
    });

    p.animGroup({ kind: "drift", ampX: 38, ampY: -8.6, freq: 0.65, phase: 0.9 }, () => {
      drawCTATrain(p, [152, 608], [568, 513]);
    });

    // Dense mid-block Loop masonry & limestone lofts flanking the river & corner gallery (7-story `2x2` sashes!)
    curtainSkyscraper3D(p, {
      cx: 838, topY: 672, baseY: 1068, wL: 202, wR: 122, colsL: 14, colsR: 9, rows: 16,
      wallL: PAL.paperStone, wallR: PAL.paperDeep, glassL: PAL.prussian, glassR: PAL.prussianDk, litChance: 0.34, roofDetail: "penthouse",
    });
    brickLoftBuilding3D(p, {
      cx: 1126, topY: 505, baseY: 1085, wL: 185, wR: 102, colsL: 10, colsR: 6, floors: 11,
      wallL: PAL.paperWarm, wallR: PAL.paperStone, trimColor: PAL.paper, litChance: 0.3, groundFloor: true,
    });

    // ------------------------------------------------------------------
    // 5. MILLENNIUM PARK PLAZA, RIVERFRONT LOFTS, 5-TONE STIPPLE TREES & 6 FOREGROUND ROOFTOPS
    // ------------------------------------------------------------------
    p.fillPath(
      polyPath([
        [635, 1020], [2780, 1020], [2780, 1880], [-380, 1880], [-380, 1580], [42, 1545], [435, 1215],
      ]),
      plazaGrad,
    );

    let paverD = "";
    for (let u = 0.08; u < 1; u += 0.05) {
      paverD += `M${P(lerp([435, 1215], [2180, 1215], u))}L${P(lerp([120, 1860], [2340, 1860], u))}`;
    }
    for (let y = 1235; y <= 1840; y += 42) {
      const lx = Math.max(-180, 435 - (y - 1215) * 1.15);
      paverD += `M${f(lx)} ${f(y)}H2360`;
    }
    p.burin(paverD, PAL.inkHair, 0.34, 0.36, 40, "hatch");

    // Riverfront landscaped lawn & riverside terracotta masonry loft (`brickLoftBuilding3D`!)
    p.fillPath(polyPath([[485, 1148], [665, 1036], [625, 1152], [358, 1272]]), PAL.sageLt, 0.42);
    p.burinContour(`M485 1148L665 1036M358 1272L625 1152`, PAL.inkMid, 0.58, 0.68, 2);
    p.flush();

    brickLoftBuilding3D(p, {
      cx: 562, topY: 942, baseY: 1148, wL: 122, wR: 72, colsL: 7, colsR: 4, floors: 5,
      wallL: PAL.cinnabar, wallR: PAL.cinnabarDk, trimColor: PAL.paperWarm, litChance: 0.36, groundFloor: true,
    });

    // Tight oblique asphalt Chicago avenue
    p.fillPath(
      polyPath([[-380, 1550], [980, 1068], [1120, 1068], [2780, 1545], [2780, 1695], [1010, 1188], [-380, 1690]]),
      PAL.slate,
      0.98,
    );
    p.burinContour(`M-380 1618L1010 1124L2780 1618M-380 1626L1010 1132L2780 1626`, PAL.ochreLt, 0.85, 0.84, 2);

    let crosswalkD = "";
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const a = lerp([675, 1182], [768, 1274], t);
      const b = lerp([726, 1164], [819, 1256], t);
      crosswalkD += polyPath([a, b, [b[0] + 5, b[1] + 7], [a[0] + 5, a[1] + 7]]);
    }
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const a = lerp([1115, 1112], [1052, 1212], t);
      const b = lerp([1166, 1126], [1103, 1226], t);
      crosswalkD += polyPath([a, b, [b[0] - 4, b[1] + 6], [a[0] - 4, a[1] + 6]]);
    }
    p.fillPath(crosswalkD, PAL.petal, 0.9);
    p.flush();

    // Raised limestone terrace parapet wall, planted median beds & sunken sculpture garden court
    p.fillPath(polyPath([[955, 1295], [1565, 1465], [1565, 1545], [955, 1375]]), PAL.paperStone, 0.99);
    p.fillPath(polyPath([[955, 1375], [1565, 1545], [1545, 1880], [885, 1880]]), PAL.paperDeep, 0.99);
    // Granite planter beds framing Millennium Park plaza walk
    p.fillPath(polyPath([[992, 1236], [1238, 1304], [1222, 1344], [976, 1276]]), PAL.sageLt, 0.52);
    p.fillPath(polyPath([[1346, 1334], [1615, 1408], [1598, 1448], [1328, 1374]]), PAL.sageLt, 0.52);
    p.burinContour(
      polyPath([[992, 1236], [1238, 1304], [1222, 1344], [976, 1276]]) +
        polyPath([[1346, 1334], [1615, 1408], [1598, 1448], [1328, 1374]]),
      PAL.inkMid,
      0.56,
      0.72,
      8,
    );
    // Recessed subway/gallery underpass entrance with bronze canopy overhang
    p.fillPath(polyPath([[1242, 1396], [1392, 1438], [1392, 1498], [1242, 1456]]), PAL.ink, 0.94);
    p.fillPath(polyPath([[1234, 1388], [1400, 1434], [1392, 1446], [1242, 1404]]), PAL.slateDk, 0.96);
    p.layer("var(--z-lume-op)", () => {
      p.fillPath(polyPath([[1258, 1412], [1378, 1446], [1378, 1492], [1258, 1458]]), PAL.lantern, 0.44);
    });
    p.burinContour(`M955 1295L1565 1465M955 1375L1565 1545`, PAL.inkMid, 0.62, 0.72, 2);
    p.flush();

    // Smooth sculptural Cloud-Gate mirror pavilion + concentric stone paving rings
    const beanCx = 468;
    const beanCy = 1465;
    p.burin(ellipsePath(beanCx, beanCy + 34, 158, 42) + ellipsePath(beanCx, beanCy + 34, 212, 56), PAL.inkMid, 0.44, 0.42, 2, "hatch");
    const beanPts: Pt[] = [
      [beanCx - 118, beanCy + 26], [beanCx - 122, beanCy - 24], [beanCx - 66, beanCy - 68],
      [beanCx + 24, beanCy - 70], [beanCx + 108, beanCy - 30], [beanCx + 116, beanCy + 24],
      [beanCx + 76, beanCy + 42], [beanCx + 34, beanCy + 22], [beanCx - 34, beanCy + 22], [beanCx - 76, beanCy + 42],
    ];
    const beanSky = p.linearGrad("bean", beanCx, beanCy - 74, beanCx, beanCy + 42, [
      [0, PAL.azurite, 0.98],
      [0.42, PAL.glass, 0.98],
      [0.54, PAL.petal, 0.98],
      [0.78, PAL.slateDk, 0.96],
      [1, PAL.ink, 0.94],
    ]);
    p.fillPath(ellipsePath(beanCx + 14, beanCy + 42, 118, 22), PAL.inkMid, 0.24);
    p.fillPath(closedSmooth(beanPts), beanSky, 0.99);
    p.burinContour(closedSmooth(beanPts), PAL.inkMid, 0.56, 0.68, 1);
    p.moonRim(beanPts, { widthPx: 0.9 });
    p.flush();

    // 11 5-tone `@devteamdrew` stipple street & plaza trees WITH peeking trunks, forks & ground shadows!
    stippleTreeCluster(
      p,
      p.r,
      [
        { cx: 416, cy: 1178, rx: 32, ry: 24, trunkBaseY: 1212, trunkWidth: 4.5, density: 1.1 },
        { cx: 486, cy: 1142, rx: 30, ry: 22, trunkBaseY: 1174, trunkWidth: 4.2, density: 1.1 },
        { cx: 586, cy: 1094, rx: 28, ry: 21, trunkBaseY: 1126, trunkWidth: 4.0, density: 1.0 },
        { cx: 224, cy: 1352, rx: 38, ry: 28, trunkBaseY: 1392, trunkWidth: 5.0, density: 1.2 },
        { cx: 620, cy: 1314, rx: 34, ry: 25, trunkBaseY: 1350, trunkWidth: 4.8, density: 1.15 },
        { cx: 938, cy: 1280, rx: 32, ry: 24, trunkBaseY: 1316, trunkWidth: 4.5, density: 1.1 },
        { cx: 1068, cy: 1252, rx: 32, ry: 24, trunkBaseY: 1286, trunkWidth: 4.5, density: 1.15 },
        { cx: 1182, cy: 1284, rx: 30, ry: 22, trunkBaseY: 1318, trunkWidth: 4.2, density: 1.1 },
        { cx: 1418, cy: 1348, rx: 36, ry: 27, trunkBaseY: 1386, trunkWidth: 4.8, density: 1.2 },
        { cx: 1525, cy: 1392, rx: 34, ry: 25, trunkBaseY: 1428, trunkWidth: 4.6, density: 1.15 },
        { cx: 1658, cy: 1426, rx: 34, ry: 25, trunkBaseY: 1464, trunkWidth: 4.6, density: 1.15 },
      ],
      { dabSize: 6.0, palette: { accent: PAL.cinnabarLt, trunk: PAL.barkDk } },
    );

    // Sculpted teak-and-iron park benches along Millennium Plaza
    const bb = new PathBatcher();
    for (const [bx, by] of [[318, 1382], [585, 1405], [1045, 1322], [1395, 1405], [1225, 1368]] as const) {
      bb.quad("sh", [bx + 2, by + 11], [bx + 36, by + 19], [bx + 32, by + 23], [bx - 2, by + 15], { fill: PAL.inkMid, fillOpacity: 0.25 });
      bb.quad("slat", [bx, by], [bx + 34, by + 8], [bx + 32, by + 14], [bx - 2, by + 6], { fill: PAL.umber, fillOpacity: 0.96 });
      bb.line("leg", bx + 3, by + 7, bx + 3, by + 14, { stroke: PAL.ink, strokeWidth: 0.8, strokeOpacity: 0.88, nonScaling: "contour" });
      bb.line("leg", bx + 28, by + 13, bx + 28, by + 20, { stroke: PAL.ink, strokeWidth: 0.8, strokeOpacity: 0.88, nonScaling: "contour" });
    }
    bb.flush(p);

    // 6 Dense Foreground Chicago Skyscrapers & Masonry Lofts framing bottom edge (`kiuzyx_..._0.jpg`!)
    brickLoftBuilding3D(p, {
      cx: -108, topY: 825, baseY: 1398, wL: 270, wR: 165, colsL: 12, colsR: 8, floors: 9,
      wallL: PAL.cinnabar, wallR: PAL.cinnabarDk, trimColor: PAL.paperWarm, litChance: 0.3, groundFloor: true,
    });
    curtainSkyscraper3D(p, {
      cx: -15, topY: 1412, baseY: 1880, wL: 340, wR: 180, colsL: 18, colsR: 10, rows: 18,
      wallL: PAL.paperWarm, wallR: PAL.paperStone, litChance: 0.28, roofDetail: "penthouse",
    });
    brickLoftBuilding3D(p, {
      cx: 418, topY: 1588, baseY: 1880, wL: 185, wR: 125, colsL: 10, colsR: 7, floors: 6,
      wallL: PAL.cinnabar, wallR: PAL.cinnabarDk, trimColor: PAL.paperWarm, litChance: 0.34, groundFloor: false,
    });
    curtainSkyscraper3D(p, {
      cx: 815, topY: 1345, baseY: 1880, wL: 138, wR: 92, colsL: 10, colsR: 7, rows: 22,
      wallL: PAL.paperWarm, wallR: PAL.paperStone, litChance: 0.32, setback: { fracH: 0.22, inset: 0.26 }, roofDetail: "penthouse",
    });
    curtainSkyscraper3D(p, {
      cx: 1565, topY: 1510, baseY: 1880, wL: 275, wR: 175, colsL: 16, colsR: 10, rows: 15,
      wallL: PAL.paperWarm, wallR: PAL.paperDeep, litChance: 0.3, roofDetail: "hvac",
    });
    // Rooftop skylight monitor & louver grid on foreground center roof (`cx=1565`)
    p.fillPath(polyPath([[1435, 1445], [1562, 1478], [1642, 1454], [1518, 1420]]), PAL.slate, 0.56);
    p.fillPath(polyPath([[1468, 1435], [1545, 1456], [1585, 1442], [1508, 1420]]), PAL.glass, 0.82);
    p.burinContour(polyPath([[1468, 1435], [1545, 1456], [1585, 1442], [1508, 1420]]), PAL.inkMid, 0.52, 0.78, 4);
    p.flush();
    brickLoftBuilding3D(p, {
      cx: 2125, topY: 1445, baseY: 1880, wL: 315, wR: 245, colsL: 14, colsR: 10, floors: 8,
      wallL: PAL.paperStone, wallR: PAL.cinnabar, trimColor: PAL.paperWarm, litChance: 0.34, groundFloor: false,
    });

    drawStreetLamps(p, [
      [560, 1218, 60],
      [855, 1118, 56],
      [1185, 1126, 60],
      [1785, 1218, 62],
      [1345, 1222, 58],
    ]);

    // ------------------------------------------------------------------
    // 6. HERO RIGHT BLOCK: 6-STORY CHICAGO SCHOOL MASONRY CORNER GALLERY
    //    60 Micro-Mullioned Upper Windows + Recessed 3D Bronze-and-Limestone Vitrine (ZERO candy-cane awning!)
    // ------------------------------------------------------------------
    const galleryWalk: Pt[] = [
      [1155, 1068], [1812, 1068], [2385, 1265], [2355, 1410], [1775, 1215], [1110, 1152],
    ];
    p.fillPath(polyPath(galleryWalk), PAL.paperWarm, 0.99);
    // Subtle night-only warm vitrine light spill (`var(--z-lume-op)` = 0 in Day!)
    p.layer("var(--z-lume-op)", () => {
      p.fillPath(ellipsePath(1540, 1115, 225, 42), PAL.lantern, 0.22);
      p.fillPath(ellipsePath(1540, 1098, 165, 24), PAL.lanternCore, 0.18);
    });
    p.burinContour(polyPath(galleryWalk), PAL.inkMid, 0.58, 0.68, 6);
    p.flush();

    const frontX0 = 1192;
    const frontX1 = 1796;
    const frontY0 = 376;
    const frontY1 = 1072;

    // Front Red-Brick Masonry Wall batched with fine brick courses, dentil cornice & 60 micro-mullioned windows!
    const gb = new PathBatcher();
    gb.rect("brick", frontX0, frontY0, frontX1 - frontX0, frontY1 - frontY0, { fill: PAL.cinnabar, fillOpacity: 0.99 });
    for (let y = frontY0 + 10; y < frontY1; y += 10) {
      gb.line("course", frontX0 + 3, y, frontX1 - 3, y, { stroke: PAL.cinnabarDk, strokeWidth: 0.3, strokeOpacity: 0.38, nonScaling: "hatch" });
    }
    // Corbelled limestone roof parapet & classical dentil bracket row
    gb.rect("stone", frontX0 - 10, 352, frontX1 - frontX0 + 20, 24, { fill: PAL.paperWarm, fillOpacity: 0.99 });
    gb.rect("stone2", frontX0 - 6, 376, frontX1 - frontX0 + 12, 20, { fill: PAL.paperStone, fillOpacity: 0.99 });
    for (let x = frontX0; x < frontX1; x += 14) {
      gb.rect("dentil", x, 378, 7, 13, { fill: PAL.paperShadow, fillOpacity: 0.66 });
    }

    // 12 tight columns x 5 stories = 60 delicate Chicago School rectangular sash windows (`2x2` muntins in late `gbM`!)
    const gbM = new PathBatcher();
    const cols = 12;
    const rows = 5;
    const gx0 = frontX0 + 20;
    const gy0 = 408;
    const gw = frontX1 - frontX0 - 40;
    const gh = 282;
    const cw = gw / cols;
    const ch = gh / rows;
    for (let r = 0; r < rows; r++) {
      // Subtle limestone floor belt course every 2 stories
      if (r === 2) gb.rect("stoneBelt", frontX0 - 2, gy0 + r * ch - 4, frontX1 - frontX0 + 4, 5, { fill: PAL.paperStone, fillOpacity: 0.96 });
      for (let c = 0; c < cols; c++) {
        const wx = gx0 + (c + 0.18) * cw;
        const wy = gy0 + (r + 0.18) * ch;
        const ww = cw * 0.64;
        const wh = ch * 0.64;
        const isLit = p.r() < 0.34;
        // Carved stone lintel & projecting sill
        gb.rect("trimStone", wx - 3, wy - 4, ww + 6, 4, { fill: PAL.paperWarm, fillOpacity: 0.96 });
        gb.rect("trimStone", wx - 3.5, wy + wh, ww + 7, 3.5, { fill: PAL.paperWarm, fillOpacity: 0.96 });
        gb.rect(isLit ? "litWin" : "dkWin", wx, wy, ww, wh, {
          fill: isLit ? PAL.windowLit : PAL.prussianDk,
          fillOpacity: 0.94,
        });
        if (isLit) {
          gb.rect("blind", wx + 2, wy + 2, ww - 4, wh * 0.32, { fill: PAL.paperWarm, fillOpacity: 0.36 });
        }
        // Crisp 2x2 inner sash muntins flushed strictly AFTER `gb`!
        gbM.line("muntin", wx + ww * 0.5, wy, wx + ww * 0.5, wy + wh, { stroke: PAL.paperWarm, strokeWidth: 0.44, strokeOpacity: 0.85, nonScaling: "hatch" });
        gbM.line("muntin", wx, wy + wh * 0.5, wx + ww, wy + wh * 0.5, { stroke: PAL.paperWarm, strokeWidth: 0.44, strokeOpacity: 0.85, nonScaling: "hatch" });
      }
    }

    // Grounded Limestone Ashlar Ground Floor + Miesian Bronze-and-Glass Gallery Marquee (`y: 696..1072`)!
    gb.rect("gfStone", frontX0 - 4, 696, frontX1 - frontX0 + 8, winY0 - 696, { fill: PAL.paperWarm, fillOpacity: 0.99 });
    gb.quad("marqTop", [winX0 - 14, 704], [winX1 + 14, 704], [winX1 + 20, 728], [winX0 - 20, 728], { fill: PAL.prussianDk, fillOpacity: 0.99 });
    gb.quad("marqBot", [winX0 - 20, 728], [winX1 + 20, 728], [winX1 + 12, winY0], [winX0 - 12, winY0], { fill: PAL.slateDk, fillOpacity: 0.96 });
    gb.line("marqBrass", winX0 - 14, 716, winX1 + 14, 716, { stroke: PAL.brassLt, strokeWidth: 0.72, strokeOpacity: 0.88, nonScaling: "contour" });
    for (let x = winX0 + 18; x <= winX1 - 18; x += 24) {
      gb.line("marqBrass", x, 707, x, 726, { stroke: PAL.brassLt, strokeWidth: 0.6, strokeOpacity: 0.86, nonScaling: "contour" });
    }

    // Rusticated limestone corner pilasters & finely carved Beaux-Arts arched oak entrance door left of vitrine!
    gb.rect("gfPilaster", frontX0, winY0, winX0 - frontX0, frontY1 - winY0, { fill: PAL.paperStone, fillOpacity: 0.99 });
    gb.rect("gfPilaster", winX1, winY0, frontX1 - winX1, frontY1 - winY0, { fill: PAL.paperStone, fillOpacity: 0.99 });
    for (let y = winY0 + 18; y < frontY1; y += 20) {
      gb.line("rust", frontX0 + 2, y, winX0 - 10, y, { stroke: PAL.inkMid, strokeWidth: 0.42, strokeOpacity: 0.56, nonScaling: "hatch" });
      gb.line("rust", winX1 + 10, y, frontX1 - 2, y, { stroke: PAL.inkMid, strokeWidth: 0.42, strokeOpacity: 0.56, nonScaling: "hatch" });
    }
    const doorX0 = 1218;
    const doorX1 = 1296;
    const doorY0 = 816;
    const doorMid = (doorX0 + doorX1) * 0.5;
    const fanCy = doorY0 + 36;
    // Carved limestone archivolt + keystone surround
    gb.addPath("doorSurround", `M${doorX0 - 6} ${frontY1}V${fanCy}A45 40 0 0 1 ${doorX1 + 6} ${fanCy}V${frontY1}Z`, { fill: PAL.paperDeep, fillOpacity: 0.99 });
    gb.quad("doorKeystone", [doorMid - 7, doorY0 - 8], [doorMid + 7, doorY0 - 8], [doorMid + 4, doorY0 + 4], [doorMid - 4, doorY0 + 4], { fill: PAL.paperWarm, fillOpacity: 0.99 });
    const doorD = `M${doorX0} ${frontY1}V${fanCy}A39 36 0 0 1 ${doorX1} ${fanCy}V${frontY1}Z`;
    gb.addPath("doorFrame", doorD, { fill: PAL.umberDk, fillOpacity: 0.99 });
    // Glowing radial sunburst fanlight transom
    gb.addPath("doorFan", `M${doorX0 + 7} ${fanCy}A32 29 0 0 1 ${doorX1 - 7} ${fanCy}Z`, { fill: PAL.windowLit, fillOpacity: 0.94 });
    for (let k = 1; k < 6; k++) {
      const ang = Math.PI + (k / 6) * Math.PI;
      gb.line("doorFanMunt", doorMid, fanCy, doorMid + Math.cos(ang) * 32, fanCy + Math.sin(ang) * 29, { stroke: PAL.umberDk, strokeWidth: 0.55, strokeOpacity: 0.88, nonScaling: "hatch" });
    }
    // 6-panel walnut double doors with upper glazed lites, recessed lower oak panels & brass push-bars!
    gb.rect("doorTransomBar", doorX0 + 2, fanCy, doorX1 - doorX0 - 4, 6, { fill: PAL.umberDk, fillOpacity: 0.99 });
    for (const side of [0, 1] as const) {
      const lx = side === 0 ? doorX0 + 8 : doorMid + 3;
      const lw = 28;
      // Upper glazed lite with 2x2 brass muntins
      gb.rect("doorGlass", lx, fanCy + 11, lw, 98, { fill: PAL.windowLit, fillOpacity: 0.88 });
      gb.line("doorMunt", lx + lw * 0.5, fanCy + 11, lx + lw * 0.5, fanCy + 109, { stroke: PAL.umberDk, strokeWidth: 0.5, strokeOpacity: 0.85, nonScaling: "hatch" });
      gb.line("doorMunt", lx, fanCy + 60, lx + lw, fanCy + 60, { stroke: PAL.umberDk, strokeWidth: 0.5, strokeOpacity: 0.85, nonScaling: "hatch" });
      // Brass push-bar & pull handle
      gb.line("doorBrass", lx + 3, fanCy + 118, lx + lw - 3, fanCy + 118, { stroke: PAL.brassLt, strokeWidth: 0.95, strokeOpacity: 0.94, nonScaling: "contour" });
      // Recessed carved lower oak kick-panel
      gb.rect("doorPanel", lx, fanCy + 128, lw, 68, { fill: PAL.umber, fillOpacity: 0.94 });
      gb.addPath("doorBrass", polyPath([[lx + 3, fanCy + 132], [lx + lw - 3, fanCy + 132], [lx + lw - 3, fanCy + 192], [lx + 3, fanCy + 192]]), { stroke: PAL.brass, strokeWidth: 0.48, strokeOpacity: 0.72, nonScaling: "hatch" });
    }
    // Dressed granite entrance threshold steps
    gb.rect("doorStep", doorX0 - 8, frontY1 - 6, doorX1 - doorX0 + 16, 6, { fill: PAL.paperWarm, fillOpacity: 0.99 });
    gb.addPath("doorBrass", doorD + `M${f(doorMid)} ${fanCy + 6}V${frontY1 - 6}`, { stroke: PAL.brassLt, strokeWidth: 0.72, strokeOpacity: 0.88, nonScaling: "contour" });

    // Splayed 3D inner architectural jambs + grounded dressed granite bulkhead below vitrine
    gb.quad("jambL", [winX0 - 12, winY0 - 6], [winX0, winY0], [winX0, winY1], [winX0 - 12, winY1 + 8], { fill: PAL.paperDeep, fillOpacity: 0.99 });
    gb.quad("jambR", [winX1, winY0], [winX1 + 12, winY0 - 6], [winX1 + 12, winY1 + 8], [winX1, winY1], { fill: PAL.slate, fillOpacity: 0.95 });
    gb.rect("vitSill", winX0 - 12, winY1, winX1 - winX0 + 24, 10, { fill: PAL.paperWarm, fillOpacity: 0.99 });
    gb.rect("bulkhead", winX0 - 12, winY1 + 10, winX1 - winX0 + 24, frontY1 - winY1 - 10, { fill: PAL.slateDk, fillOpacity: 0.99 });
    // Distinct late bucket `"bulkheadBrass"` so 3 recessed bronze bulkhead frames paint cleanly ON TOP of bulkhead!
    for (let i = 0; i < 3; i++) {
      const x0 = winX0 + 10 + i * 134;
      gb.addPath("bulkheadBrass", polyPath([[x0, winY1 + 16], [x0 + 116, winY1 + 16], [x0 + 116, frontY1 - 8], [x0, frontY1 - 8]]), {
        stroke: PAL.brassLt,
        strokeWidth: 0.65,
        strokeOpacity: 0.82,
        nonScaling: "contour",
      });
    }
    gb.flush(p);
    gbM.flush(p);

    // Twin warm bronze gallery gooseneck sconces flanking the vitrine (night-only layered halos!)
    for (const sx of [winX0 - 22, winX1 + 25]) {
      p.fillPath(circlePath(sx, winY0 + 42, 5.2), PAL.lanternCore, 0.96);
      p.fillPath(polyPath([[sx - 8, winY0 + 36], [sx + 8, winY0 + 36], [sx + 5, winY0 + 30], [sx - 5, winY0 + 30]]), PAL.brassDk, 0.98);
      p.layer("var(--z-lume-op)", () => {
        p.fillPath(circlePath(sx, winY0 + 46, 36), PAL.lanternHalo, 0.18);
        p.fillPath(circlePath(sx, winY0 + 46, 16), PAL.lantern, 0.34);
      });
    }
    p.flush();

    // Shaded Oblique Right Return Facade of Corner Gallery — FLOOR-FOR-FLOOR ALIGNED with Front Facade!
    // 5 crisp upper brick stories (y=376..696, 12 cols x 5 rows `2x2` sashes) + matching Limestone Colonnade Ground Floor!
    const rb = new PathBatcher();
    const rTL: Pt = [frontX1, 376];
    const rTR: Pt = [2350, 520];
    const rBR: Pt = [2350, 1265];
    const rBL: Pt = [frontX1, 1072];
    const gfSplit = (696 - 376) / (1072 - 376); // exact 0.4598 floor alignment with front facade!
    const rMidL = lerp(rTL, rBL, gfSplit);
    const rMidR = lerp(rTR, rBR, gfSplit);

    // Upper 5-story shaded red-brick masonry return + matching stepped limestone cornice parapet!
    rb.quad("wallR", rTL, rTR, rMidR, rMidL, { fill: PAL.cinnabarDk, fillOpacity: 0.99 });
    rb.quad("parapet", [frontX1, 352], [2356, 496], rTR, rTL, { fill: PAL.paperStone, fillOpacity: 0.99 });
    rb.quad("parapetSh", rTL, rTR, lerp(rTR, rBR, 0.028), lerp(rTL, rBL, 0.028), { fill: PAL.paperDeep, fillOpacity: 0.98 });
    for (let i = 1; i < 20; i++) {
      const a = lerp(rTL, rMidL, i / 20);
      const bPt = lerp(rTR, rMidR, i / 20);
      rb.line("course", a[0], a[1], bPt[0], bPt[1], { stroke: PAL.ink, strokeWidth: 0.3, strokeOpacity: 0.24, nonScaling: "hatch" });
    }
    // 12 tight columns x 5 stories matching the front facade's exact micro window scale (muntins in separate `rbUpM` so NEVER buried!)
    const rbUpM = new PathBatcher();
    for (let r = 0; r < 5; r++) {
      const v0 = 0.05 + r * 0.081;
      const v1 = v0 + 0.055;
      const vm = (v0 + v1) * 0.5;
      if (r === 2) {
        rb.quad("beltR", lerp(rTL, rBL, v0 - 0.009), lerp(rTR, rBR, v0 - 0.009), lerp(rTR, rBR, v0 - 0.002), lerp(rTL, rBL, v0 - 0.002), { fill: PAL.paperDeep, fillOpacity: 0.94 });
      }
      for (let c = 0; c < 12; c++) {
        const u0 = 0.032 + c * 0.078;
        const u1 = u0 + 0.052;
        const um = (u0 + u1) * 0.5;
        const isLit = p.r() < 0.28;
        rb.quad("lintel", bilerp(rTL, rTR, rBR, rBL, u0 - 0.004, v0 - 0.007), bilerp(rTL, rTR, rBR, rBL, u1 + 0.004, v0 - 0.007), bilerp(rTL, rTR, rBR, rBL, u1 + 0.004, v0), bilerp(rTL, rTR, rBR, rBL, u0 - 0.004, v0), { fill: PAL.paperStone, fillOpacity: 0.9 });
        rb.quad("sill", bilerp(rTL, rTR, rBR, rBL, u0 - 0.005, v1), bilerp(rTL, rTR, rBR, rBL, u1 + 0.005, v1), bilerp(rTL, rTR, rBR, rBL, u1 + 0.005, v1 + 0.007), bilerp(rTL, rTR, rBR, rBL, u0 - 0.005, v1 + 0.007), { fill: PAL.paperStone, fillOpacity: 0.9 });
        rb.quad(isLit ? "lit" : "dk", bilerp(rTL, rTR, rBR, rBL, u0, v0), bilerp(rTL, rTR, rBR, rBL, u1, v0), bilerp(rTL, rTR, rBR, rBL, u1, v1), bilerp(rTL, rTR, rBR, rBL, u0, v1), { fill: isLit ? PAL.windowLit : PAL.cut, fillOpacity: 0.94 });
        const mt = bilerp(rTL, rTR, rBR, rBL, um, v0);
        const mb = bilerp(rTL, rTR, rBR, rBL, um, v1);
        const ml = bilerp(rTL, rTR, rBR, rBL, u0, vm);
        const mr = bilerp(rTL, rTR, rBR, rBL, u1, vm);
        rbUpM.line("munt", mt[0], mt[1], mb[0], mb[1], { stroke: PAL.paperStone, strokeWidth: 0.42, strokeOpacity: 0.8, nonScaling: "hatch" });
        rbUpM.line("munt", ml[0], ml[1], mr[0], mr[1], { stroke: PAL.paperStone, strokeWidth: 0.42, strokeOpacity: 0.8, nonScaling: "hatch" });
      }
    }

    // Matching Shaded Limestone Ground-Floor Gallery Colonnade — DENSE `@kiuzyx` 2-LEVEL BRONZE-AND-GLASS BAYS!
    // (Replaces 5 blank beige slabs with 4x6 dark-bronze mullions, carved spandrel friezes, warm interior bookshelves,
    //  framed gallery artworks, display tables, pendant lamps & tiny interior gallery visitors!)
    rb.quad("gfStoneR", rMidL, rMidR, rBR, rBL, { fill: PAL.paperDeep, fillOpacity: 0.99 });
    rb.quad("gfCornice", lerp(rTL, rBL, gfSplit - 0.014), lerp(rTR, rBR, gfSplit - 0.014), lerp(rTR, rBR, gfSplit + 0.022), lerp(rTL, rBL, gfSplit + 0.022), { fill: PAL.slateDk, fillOpacity: 0.98 });
    rb.line("gfCorniceBrass", lerp(rTL, rBL, gfSplit + 0.004)[0], lerp(rTL, rBL, gfSplit + 0.004)[1], lerp(rTR, rBR, gfSplit + 0.004)[0], lerp(rTR, rBR, gfSplit + 0.004)[1], { stroke: PAL.brassLt, strokeWidth: 0.65, strokeOpacity: 0.82, nonScaling: "contour" });
    for (let i = 1; i < 16; i++) {
      const v = gfSplit + 0.03 + (i / 16) * (1 - gfSplit - 0.04);
      const a = lerp(rTL, rBL, v);
      const bPt = lerp(rTR, rBR, v);
      rb.line("rustR", a[0], a[1], bPt[0], bPt[1], { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.42, nonScaling: "hatch" });
    }
    const qR = (u: number, v: number): Pt => bilerp(rTL, rTR, rBR, rBL, u, v);
    const spineCols = [PAL.cinnabar, PAL.prussian, PAL.ochre, PAL.azurite, PAL.slateDk, PAL.cinnabarLt, PAL.sage];
    // Stage A (`rb`): dark bronze frames, bulkheads & glass backing planes (flushed FIRST so interiors NEVER get buried!)
    for (let bay = 0; bay < 5; bay++) {
      const u0 = 0.035 + bay * 0.188;
      const u1 = u0 + 0.156;
      const vTop = gfSplit + 0.05;
      const vMezzBot = 0.675;
      const vSpandBot = 0.725;
      const vShopBot = 0.945;
      const isWarmBay = bay % 2 === 0 || bay === 3;
      rb.quad("bayFrame", qR(u0 - 0.008, vTop - 0.008), qR(u1 + 0.008, vTop - 0.008), qR(u1 + 0.008, 0.992), qR(u0 - 0.008, 0.992), { fill: PAL.slateDk, fillOpacity: 0.99 });
      rb.quad("bayBulk", qR(u0, vShopBot), qR(u1, vShopBot), qR(u1, 0.985), qR(u0, 0.985), { fill: PAL.prussianDk, fillOpacity: 0.98 });
      rb.quad(isWarmBay ? "mezzWarm" : "mezzCool", qR(u0, vTop), qR(u1, vTop), qR(u1, vMezzBot), qR(u0, vMezzBot), {
        fill: isWarmBay ? PAL.windowLit : PAL.glassTint,
        fillOpacity: 0.92,
      });
      rb.quad(bay % 2 === 0 ? "shopWarm" : "shopPaper", qR(u0, vSpandBot), qR(u1, vSpandBot), qR(u1, vShopBot), qR(u0, vShopBot), {
        fill: bay % 2 === 0 ? PAL.windowLit : PAL.paperWarm,
        fillOpacity: 0.94,
      });
    }
    rb.flush(p);
    rbUpM.flush(p);

    // Stage B (`rbInt`): interior bookshelves, framed gallery works, tables, visitors, carved spandrel frieze!
    const rbInt = new PathBatcher();
    const rbMull = new PathBatcher();
    for (let bay = 0; bay < 5; bay++) {
      const u0 = 0.035 + bay * 0.188;
      const u1 = u0 + 0.156;
      const vTop = gfSplit + 0.05;
      const vMezzBot = 0.675;
      const vSpandBot = 0.725;
      const vShopBot = 0.945;

      // Mezzanine ceiling shadow + 3 tiers of studio shelves & colorful book spines!
      rbInt.quad("intCeil", qR(u0, vTop), qR(u1, vTop), qR(u1, vTop + 0.028), qR(u0, vTop + 0.028), { fill: PAL.umberDk, fillOpacity: 0.34 });
      for (let sh = 0; sh < 3; sh++) {
        const sv = vTop + 0.055 + sh * 0.042;
        const sl = qR(u0 + 0.012, sv);
        const sr = qR(u1 - 0.012, sv);
        rbInt.line("intShelf", sl[0], sl[1], sr[0], sr[1], { stroke: PAL.umberDk, strokeWidth: 0.48, strokeOpacity: 0.74, nonScaling: "hatch" });
        for (let bk = 0; bk < 9; bk++) {
          const bu0 = u0 + 0.016 + bk * 0.0135;
          const bu1 = bu0 + 0.0095;
          const bh = 0.022 + ((bay * 7 + sh * 5 + bk * 3) % 3) * 0.005;
          const colIdx = (bay + sh * 3 + bk) % spineCols.length;
          rbInt.quad("intBk" + colIdx, qR(bu0, sv - bh), qR(bu1, sv - bh), qR(bu1, sv), qR(bu0, sv), { fill: spineCols[colIdx], fillOpacity: 0.86 });
        }
      }

      // Street-level gallery floor, framed artworks, oak display table, pendant lamps & browsing visitors!
      rbInt.quad("intCeil", qR(u0, vSpandBot), qR(u1, vSpandBot), qR(u1, vSpandBot + 0.028), qR(u0, vSpandBot + 0.028), { fill: PAL.umberDk, fillOpacity: 0.34 });
      rbInt.quad("intFloor", qR(u0, vShopBot - 0.048), qR(u1, vShopBot - 0.048), qR(u1, vShopBot), qR(u0, vShopBot), { fill: PAL.paperDeep, fillOpacity: 0.76 });
      rbInt.quad(bay % 2 === 0 ? "artA" : "artB", qR(u0 + 0.022, vSpandBot + 0.058), qR(u0 + 0.068, vSpandBot + 0.058), qR(u0 + 0.068, vSpandBot + 0.132), qR(u0 + 0.022, vSpandBot + 0.132), { fill: bay % 2 === 0 ? PAL.cinnabar : PAL.azurite, fillOpacity: 0.88 });
      rbInt.quad(bay % 2 === 0 ? "artC" : "artD", qR(u0 + 0.084, vSpandBot + 0.062), qR(u1 - 0.022, vSpandBot + 0.062), qR(u1 - 0.022, vSpandBot + 0.128), qR(u0 + 0.084, vSpandBot + 0.128), { fill: bay % 2 === 0 ? PAL.prussian : PAL.ochre, fillOpacity: 0.86 });
      rbInt.quad("intTable", qR(u0 + 0.032, vShopBot - 0.072), qR(u1 - 0.032, vShopBot - 0.072), qR(u1 - 0.032, vShopBot - 0.026), qR(u0 + 0.032, vShopBot - 0.026), { fill: PAL.umber, fillOpacity: 0.9 });
      for (const pu of [u0 + 0.045, u1 - 0.045]) {
        const lTop = qR(pu, vSpandBot);
        const lBot = qR(pu, vSpandBot + 0.036);
        rbInt.line("intCord", lTop[0], lTop[1], lBot[0], lBot[1], { stroke: PAL.ink, strokeWidth: 0.45, strokeOpacity: 0.78, nonScaling: "hatch" });
        rbInt.circle("intLamp", lBot[0], lBot[1] + 2, 2.5, { fill: PAL.lanternCore, fillOpacity: 0.96 });
      }
      const visU = u0 + (bay % 2 === 0 ? 0.052 : 0.104);
      const visHd = qR(visU, vShopBot - 0.092);
      const visFt = qR(visU, vShopBot - 0.018);
      rbInt.circle("intVisH", visHd[0], visHd[1], 3.0, { fill: PAL.ink, fillOpacity: 0.82 });
      rbInt.quad("intVisB", [visHd[0] - 4.2, visHd[1] + 4], [visHd[0] + 4.2, visHd[1] + 4], [visFt[0] + 5, visFt[1]], [visFt[0] - 5, visFt[1]], { fill: PAL.slateDk, fillOpacity: 0.84 });

      // Stage C (`rbMull`): carved limestone spandrel frieze + dentil relief + `4×6` dark-bronze mullions strictly ON TOP!
      rbMull.quad("spandrel", qR(u0 - 0.005, vMezzBot), qR(u1 + 0.005, vMezzBot), qR(u1 + 0.005, vSpandBot), qR(u0 - 0.005, vSpandBot), { fill: PAL.paperStone, fillOpacity: 0.99 });
      rbMull.quad("spandRecess", qR(u0 + 0.008, vMezzBot + 0.01), qR(u1 - 0.008, vMezzBot + 0.01), qR(u1 - 0.008, vSpandBot - 0.01), qR(u0 + 0.008, vSpandBot - 0.01), { fill: PAL.slateDk, fillOpacity: 0.85 });
      for (let d = 0; d < 6; d++) {
        const du0 = u0 + 0.015 + d * 0.021;
        rbMull.quad("spandDent", qR(du0, vMezzBot + 0.014), qR(du0 + 0.011, vMezzBot + 0.014), qR(du0 + 0.011, vSpandBot - 0.014), qR(du0, vSpandBot - 0.014), { fill: PAL.brass, fillOpacity: 0.78 });
      }
      for (let mc = 1; mc < 4; mc++) {
        const mu = u0 + (mc / 4) * (u1 - u0);
        const mTop = qR(mu, vTop);
        const mMidA = qR(mu, vMezzBot);
        const mMidB = qR(mu, vSpandBot);
        const mBot = qR(mu, vShopBot);
        rbMull.line("bayMull", mTop[0], mTop[1], mMidA[0], mMidA[1], { stroke: PAL.ink, strokeWidth: mc === 2 ? 0.78 : 0.48, strokeOpacity: 0.9, nonScaling: "contour" });
        rbMull.line("bayMull", mMidB[0], mMidB[1], mBot[0], mBot[1], { stroke: PAL.ink, strokeWidth: mc === 2 ? 0.78 : 0.48, strokeOpacity: 0.9, nonScaling: "contour" });
      }
      for (const mv of [vTop + 0.045, vTop + 0.095, vTop + 0.145, vSpandBot + 0.048, vSpandBot + 0.112, vSpandBot + 0.172]) {
        const ml = qR(u0, mv);
        const mr = qR(u1, mv);
        rbMull.line("bayMullH", ml[0], ml[1], mr[0], mr[1], { stroke: PAL.ink, strokeWidth: 0.54, strokeOpacity: 0.86, nonScaling: "contour" });
      }
      const gA = qR(u0 + 0.015, vSpandBot + 0.02);
      const gB = qR(u0 + 0.065, vSpandBot + 0.11);
      rbMull.line("baySheen", gA[0], gA[1], gB[0], gB[1], { stroke: PAL.petal, strokeWidth: 0.6, strokeOpacity: 0.34, nonScaling: "hatch" });
      rbMull.addPath("bayBulkTrim", polyPath([qR(u0 + 0.012, vShopBot + 0.008), qR(u1 - 0.012, vShopBot + 0.008), qR(u1 - 0.012, 0.978), qR(u0 + 0.012, 0.978)]), { stroke: PAL.brassLt, strokeWidth: 0.52, strokeOpacity: 0.78, nonScaling: "contour" });
    }
    rbInt.flush(p);
    rbMull.flush(p);

    // POPULATED RIGHT COLONNADE SIDEWALK (`x = 1780..2350, y = 1150..1410`):
    // Sidewalk café bistro tables + umbrellas, granite tree pits + 3 `stippleTreeCluster` trees, & 3 cast-iron streetlamps!
    const rc = new PathBatcher();
    for (const [tx, ty] of [[1865, 1184], [1958, 1216], [2048, 1248], [2145, 1282], [2242, 1316]] as const) {
      // Cast shadow + round Parisian bistro table + twin chairs + red/cream parasol!
      rc.addPath("sh", ellipsePath(tx + 5, ty + 14, 17, 7), { fill: PAL.inkMid, fillOpacity: 0.24 });
      rc.addPath("tbl", ellipsePath(tx, ty + 4, 11, 5), { fill: PAL.petal, fillOpacity: 0.96 });
      rc.line("leg", tx, ty + 4, tx, ty + 14, { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.85, nonScaling: "contour" });
      rc.line("leg", tx - 13, ty + 7, tx - 13, ty + 14, { stroke: PAL.ink, strokeWidth: 0.6, strokeOpacity: 0.8, nonScaling: "contour" });
      rc.line("leg", tx + 13, ty + 7, tx + 13, ty + 14, { stroke: PAL.ink, strokeWidth: 0.6, strokeOpacity: 0.8, nonScaling: "contour" });
      if (tx % 2 === 1 || tx === 2048 || tx === 2242) {
        rc.line("pole", tx, ty + 4, tx, ty - 22, { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.88, nonScaling: "contour" });
        rc.addPath("umb", `M${f(tx - 19)} ${f(ty - 14)}Q${f(tx)} ${f(ty - 29)} ${f(tx + 19)} ${f(ty - 14)}Q${f(tx)} ${f(ty - 10)} ${f(tx - 19)} ${f(ty - 14)}Z`, {
          fill: tx === 2048 ? PAL.azurite : PAL.cinnabar,
          fillOpacity: 0.94,
        });
      }
    }
    // Granite curb tree-pit grates along right sidewalk edge
    for (const [px, py] of [[1896, 1234], [2094, 1304], [2286, 1372]] as const) {
      rc.quad("pit", [px - 18, py - 4], [px + 18, py + 8], [px + 12, py + 16], [px - 24, py + 4], { fill: PAL.paperStone, fillOpacity: 0.96 });
      rc.quad("soil", [px - 12, py - 1], [px + 12, py + 7], [px + 8, py + 12], [px - 16, py + 4], { fill: PAL.umberDk, fillOpacity: 0.78 });
    }
    rc.flush(p);

    stippleTreeCluster(
      p,
      p.r,
      [
        { cx: 1894, cy: 1188, rx: 32, ry: 25, trunkBaseY: 1236, trunkWidth: 4.5, density: 1.15 },
        { cx: 2092, cy: 1258, rx: 34, ry: 26, trunkBaseY: 1306, trunkWidth: 4.6, density: 1.15 },
        { cx: 2284, cy: 1326, rx: 34, ry: 26, trunkBaseY: 1374, trunkWidth: 4.8, density: 1.2 },
      ],
      { dabSize: 5.8, palette: { trunk: PAL.barkDk } },
    );

    drawStreetLamps(p, [
      [1834, 1205, 58],
      [2018, 1272, 60],
      [2208, 1338, 60],
    ]);

    // Far-right foreground Miesian office skyscraper anchoring right bleed (`curtainSkyscraper3D`!)
    curtainSkyscraper3D(p, {
      cx: 2560, topY: 315, baseY: 1525, wL: 205, wR: 220, colsL: 16, colsR: 14, rows: 42,
      wallL: PAL.prussianDk, wallR: PAL.ink, glassL: PAL.cut, glassR: PAL.cut, tintFill: PAL.azurite,
      mullionColor: PAL.slateLt, litChance: 0.36, roofDetail: "penthouse",
    });

    // ------------------------------------------------------------------
    // 7. 86 BUSTLING MICRO-PEDESTRIANS & 3D CTA BUSES / SEDANS!
    // ------------------------------------------------------------------
    const pedList: Array<{ x: number; y: number; h: number; coat: string; kind: "coat" | "dress"; dir: -1 | 1 }> = [];
    const coats = [PAL.cinnabar, PAL.prussianLt, PAL.ochre, PAL.slateDk, PAL.petal, PAL.cinnabarLt, PAL.prussian, PAL.ink];
    const addCrowd = (x0: number, y0: number, x1: number, y1: number, count: number, hMin: number, hMax: number) => {
      for (let i = 0; i < count; i++) {
        const u = (i + rand(p.r, 0.1, 0.9)) / count;
        pedList.push({
          x: x0 + (x1 - x0) * u + rand(p.r, -12, 12),
          y: y0 + (y1 - y0) * u + rand(p.r, -10, 10),
          h: rand(p.r, hMin, hMax),
          coat: coats[Math.floor(p.r() * coats.length)],
          kind: p.r() < 0.38 ? "dress" : "coat",
          dir: p.r() < 0.5 ? 1 : -1,
        });
      }
    };
    addCrowd(1140, 1104, 1765, 1134, 18, 17, 20); // Gallery sidewalk
    addCrowd(1810, 1152, 2240, 1300, 10, 17, 19); // Side colonnade sidewalk
    addCrowd(688, 1192, 795, 1258, 7, 16, 18); // Left crosswalk
    addCrowd(1045, 1155, 1142, 1212, 6, 17, 19); // Right crosswalk
    addCrowd(270, 1460, 650, 1528, 22, 16, 19); // Cloud Gate crowd (`_0.jpg`!)
    addCrowd(895, 1305, 1350, 1535, 14, 17, 20); // Terraced plaza & sunken court
    addCrowd(540, 995, 815, 765, 9, 12, 14); // Riverwalk promenade
    p.scaleFigures(pedList, { shadowDir: [1.15, 0.34], shadowOpacity: 0.28, flush: true });

    drawStreetTraffic(p);
  });

  // ------------------------------------------------------------------
  // 8. HAIR-FINE NON-SCALING BRONZE VITRINE EDGE (ZERO 48px BROWN FRAME IN s01!)
  // ------------------------------------------------------------------
  p.burinContour(polyPath(hole), PAL.ink, 0.85, 0.86, 4);
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
    index: 0,
    id: "s00-chicago",
    title: "Chicago River Canyon",
    subtitle: "Miesian Towers, Steel Bascule Bridges & Storefront Gallery",
    portal: S00_PORTAL,
    coreColorDay: [236, 232, 222],
    coreColorNight: [18, 25, 42],
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
