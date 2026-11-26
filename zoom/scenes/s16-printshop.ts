// S16: Master Engraver's Copperplate Intaglio Atelier (Stage-5 5x Micro-Craft Overhaul)
// @kiuzyx + delineate printmaking self-portrait with compound-path micro-craft density:
//   - Timber ceiling beams with iron truss tie-rods, subtle coursed studio brick/plaster walls (PathBatcher!),
//     and TWO overhead staggered drying racks hung with 16 detailed miniature copperplate architectural,
//     botanical, celestial & marine proofs swaying gently on hemp twine (data-anim="sway")!
//   - Dense 6-tier left & right apothecary pigment walls (64+ curved hand-blown glass jars, round-shouldered
//     oil/acid flasks, cylindrical 3D etching ink tins, brass apothecary weights & stacked deckle rag paper!).
//   - Heavy mortised oak-and-cast-iron intaglio rolling press with turning 6-spoked star-wheel (rotate),
//     meshing 3-gear reduction train (rotate), twin steel cylinders, folded wool press blankets, brass pressure
//     dial, walnut rack holding 12 burins/rockers/burnishers, hung burnished master plates, AND a freshly pulled
//     high-detail copperplate proof impression (`0.38px` city/bridge mullions & voussoirs) on the press bed!
//   - Portal (1520, 920 -> S17 Library): Large framed architectural proof / glazed interior studio partition
//     window (`403x269px`, 0px bezel crop on day-o17.png!) framed in beveled burnished copper & oak molding!
//   - Foreground planked oak workbench: proof stack, leather *tampon*, porphyry cinnabar muller, proofing
//     brayer, steel lozenge burins, acid etching tray, stoneware ink crock, tarlatan cloth & glowing studio lamps!

import {
  PAL,
  Painter,
  PathBatcher,
  TAU,
  add,
  circlePath,
  closedSmooth,
  curtainSkyscraper3D,
  cylinderTone,
  ellipsePath,
  f,
  lerp,
  linePath,
  linearTone,
  polyPath,
  quad,
  rad,
  rand,
  rectWindowHole,
  rot,
  sample,
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

export const S16_PORTAL: PortalSpec = { cx: 1520, cy: 920, rx: 202, ry: 135 };
const NEXT_PORTAL: readonly [number, number] = [880, 580]; // s17-library

export function buildS16Printshop(): OctaveScene {
  const p = new Painter("s16", 16510);

  const clearBox = requiredPortalClearBox(S16_PORTAL, NEXT_PORTAL);
  // Generous framed architectural proof / interior studio opening centered on S16_PORTAL:
  // x=[1318.6..1721.6] (403px), y=[785.3..1054.3] (269px) -> clears all 4 edges at S=6 (`day-o17.png` 0px crop)!
  const hole = rectWindowHole(clearBox, {
    padL: 62,
    padR: 105,
    padTop: 40,
    padBot: 69,
    chamfer: 0,
  });
  validatePortalHole("s16-printshop", hole, S16_PORTAL, NEXT_PORTAL);

  const hx0 = hole[0][0]; // ~1318.6
  const hx1 = hole[1][0]; // ~1721.6
  const hy0 = hole[0][1]; // ~785.3
  const hy1 = hole[2][1]; // ~1054.3

  const wallGrad = p.linearGrad("wall", BLEED.x0, BLEED.y0, BLEED.x1, 1200, [
    [0, PAL.paperWarm],
    [0.45, PAL.paperDeep],
    [0.85, PAL.paperStone],
    [1, PAL.umberLt],
  ]);
  const copperGrad = p.linearGrad("copper", hx0 - 30, hy0 - 24, hx1 + 30, hy1 + 24, [
    [0, PAL.ochreLt],
    [0.24, PAL.copper],
    [0.58, PAL.cinnabar],
    [0.84, PAL.copper],
    [1, PAL.cinnabarDk],
  ]);
  const benchLampPool = p.radialGrad("bench-pool", 1045, 1340, 480, [
    [0, PAL.lanternCore, 0.38],
    [0.32, PAL.lantern, 0.22],
    [0.68, PAL.lanternHalo, 0.09],
    [1, PAL.lanternHalo, 0],
  ]);
  const topLampPoolL = p.radialGrad("topl-pool", 422, 365, 290, [
    [0, PAL.lanternCore, 0.44],
    [0.32, PAL.lantern, 0.24],
    [0.66, PAL.lanternHalo, 0.09],
    [1, PAL.lanternHalo, 0],
  ]);
  const topLampPoolR = p.radialGrad("topr-pool", 1855, 375, 290, [
    [0, PAL.lanternCore, 0.44],
    [0.32, PAL.lantern, 0.24],
    [0.66, PAL.lanternHalo, 0.09],
    [1, PAL.lanternHalo, 0],
  ]);

  // Curved Hand-Blown Glass Apothecary Bottle / Pigment Jar helper with 3-value cylindrical shading & liquid meniscus!
  const makeCurvedJar = (cx: number, jy: number, hw: number, jh: number, style: 0 | 1 | 2) => {
    const nw = style === 1 ? hw * 0.34 : style === 2 ? hw * 0.42 : hw * 0.56;
    const shY = style === 1 ? jy - jh * 0.58 : jy - jh * 0.72;
    const neckTop = jy - jh - (style === 1 ? 12 : 9);
    const glass =
      style === 1
        ? `M${f(cx - nw)} ${f(neckTop)}V${f(jy - jh)}C${f(cx - nw)} ${f(shY - 4)} ${f(cx - hw)} ${f(shY - 2)} ${f(cx - hw)} ${f(jy - jh * 0.38)}Q${f(cx - hw)} ${f(jy)} ${f(cx - hw * 0.62)} ${f(jy)}H${f(cx + hw * 0.62)}Q${f(cx + hw)} ${f(jy)} ${f(cx + hw)} ${f(jy - jh * 0.38)}C${f(cx + hw)} ${f(shY - 2)} ${f(cx + nw)} ${f(shY - 4)} ${f(cx + nw)} ${f(jy - jh)}V${f(neckTop)}Z`
        : `M${f(cx - nw)} ${f(neckTop)}V${f(jy - jh + 2)}Q${f(cx - hw)} ${f(jy - jh + 6)} ${f(cx - hw)} ${f(shY + 7)}V${f(jy - 5)}Q${f(cx - hw)} ${f(jy)} ${f(cx - hw + 5)} ${f(jy)}H${f(cx + hw - 5)}Q${f(cx + hw)} ${f(jy)} ${f(cx + hw)} ${f(jy - 5)}V${f(shY + 7)}Q${f(cx + hw)} ${f(jy - jh + 6)} ${f(cx + nw)} ${f(jy - jh + 2)}V${f(neckTop)}Z`;
    const fillH = jh * rand(p.r, 0.5, 0.72);
    const menY = jy - fillH + 4;
    const mound = `M${f(cx - hw + 2.2)} ${f(menY)}Q${f(cx)} ${f(menY + 3.5)} ${f(cx + hw - 2.2)} ${f(menY)}V${f(jy - 2.5)}H${f(cx - hw + 2.2)}Z`;
    const meniscus = ellipsePath(cx, menY, hw - 2.4, 3.0);
    // Cylindrical 3-value shadow band on right flank of bottle
    const shadeR = `M${f(cx + hw * 0.28)} ${f(shY + 5)}Q${f(cx + hw * 0.88)} ${f(shY + 8)} ${f(cx + hw - 1.5)} ${f(shY + 14)}V${f(jy - 4)}Q${f(cx + hw - 1.5)} ${f(jy - 1)} ${f(cx + hw * 0.34)} ${f(jy - 1)}Z`;
    const cork = polyPath([[cx - nw * 0.86, neckTop - 10], [cx + nw * 0.86, neckTop - 10], [cx + nw * 0.72, neckTop + 1], [cx - nw * 0.72, neckTop + 1]]);
    const ly0 = jy - jh * 0.5;
    const ly1 = jy - jh * 0.2;
    const lw = hw * 0.76;
    const label = `M${f(cx - lw)} ${f(ly0)}Q${f(cx)} ${f(ly0 + 3)} ${f(cx + lw)} ${f(ly0)}V${f(ly1)}Q${f(cx)} ${f(ly1 + 3)} ${f(cx - lw)} ${f(ly1)}Z`;
    const labelRule = `M${f(cx - lw * 0.6)} ${f((ly0 + ly1) * 0.5 - 2)}H${f(cx + lw * 0.6)}M${f(cx - lw * 0.44)} ${f((ly0 + ly1) * 0.5 + 2.5)}H${f(cx + lw * 0.44)}`;
    const hi = `M${f(cx - hw * 0.66)} ${f(shY + 7)}V${f(jy - 7)}M${f(cx - nw * 0.55)} ${f(neckTop + 2)}V${f(jy - jh + 2)}`;
    return { glass, mound, meniscus, shadeR, cork, label, labelRule, hi };
  };

  // 1. Opaque full-bleed warm printshop wall punched cleanly by the interior studio/proof opening
  p.asymmetricPortalBackdrop(hole, wallGrad, { smooth: false });

  p.clippedToBackdrop(
    hole,
    () => {
      // 1a. Coursed Atelier Brick/Plaster Walls, Dado Wainscoting & Heavy Oak Ceiling Rafters (via PathBatcher!)
      {
        const bg = new PathBatcher();
        for (let y = 110; y < 1130; y += 26) {
          bg.line("course", BLEED.x0, y, BLEED.x1, y, { stroke: PAL.inkHair, strokeWidth: 0.3, strokeOpacity: 0.2, nonScaling: "hatch" });
          const off = ((y / 26) % 2) * 32;
          for (let x = -200 + off; x < 2600; x += 64) {
            if (p.r() < 0.45) bg.line("course", x, y, x, y + 26, { stroke: PAL.inkHair, strokeWidth: 0.26, strokeOpacity: 0.14, nonScaling: "hatch" });
          }
        }
        bg.rect("dado", BLEED.x0, 992, BLEED.x1 - BLEED.x0, 160, { fill: PAL.paperStone, fillOpacity: 0.65 });
        bg.line("dadoRail", BLEED.x0, 992, BLEED.x1, 992, { stroke: PAL.umberDk, strokeWidth: 0.9, strokeOpacity: 0.68, nonScaling: "contour" });
        bg.line("dadoRail", BLEED.x0, 1004, BLEED.x1, 1004, { stroke: PAL.umberDk, strokeWidth: 0.62, strokeOpacity: 0.5, nonScaling: "hatch" });
        // Exposed heavy oak ceiling girder, rafters & forged iron truss tie-rods
        bg.rect("beamTop", BLEED.x0, BLEED.y0, BLEED.x1 - BLEED.x0, 62 - BLEED.y0, { fill: PAL.barkDk, fillOpacity: 0.99 });
        for (const bx of [120, 480, 840, 1200, 1560, 1920, 2280]) {
          bg.quad("joist", [bx - 16, BLEED.y0], [bx + 16, BLEED.y0], [bx + 13, 104], [bx - 13, 104], { fill: PAL.bark, fillOpacity: 0.98 });
          bg.quad("joistRim", [bx - 16, BLEED.y0], [bx + 16, BLEED.y0], [bx + 13, 104], [bx - 13, 104], { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.86, nonScaling: "contour" });
          // Forged iron strap bracket & bolts
          bg.rect("ironStrap", bx - 15, 58, 30, 10, { fill: PAL.slateDk, fillOpacity: 0.96 });
        }
        bg.line("tieRod", BLEED.x0, 84, BLEED.x1, 84, { stroke: PAL.slateDk, strokeWidth: 0.9, strokeOpacity: 0.72, nonScaling: "contour" });
        bg.flush(p);
      }

      // 2. Dense 6-Tier Left & Right Apothecary Pigment & Ink Shelves (`64+` Curved Bottles, Flasks & Ink Tins!)
      //    Two-stage PathBatcher (`rbBack` fills -> `rbFront` shading/labels/glints/planks) guarantees ZERO label overwrite!
      const drawDenseApothecaryRack = (x0: number, x1: number, yTop: number, yBot: number, rows: number) => {
        const rbBack = new PathBatcher();
        const rbFront = new PathBatcher();
        rbBack.rect("cabOut", x0, yTop, x1 - x0, yBot - yTop, { fill: PAL.barkDk, fillOpacity: 0.98 });
        rbBack.rect("cabIn", x0 + 8, yTop + 8, x1 - x0 - 16, yBot - yTop - 16, { fill: PAL.umberDk, fillOpacity: 0.95 });

        const rowH = (yBot - yTop - 20) / rows;
        const pigPalette = [
          PAL.prussian, PAL.cinnabar, PAL.malachite, PAL.ochre, PAL.azurite,
          PAL.copper, PAL.wisteria, PAL.celadonDk, PAL.cinnabarLt, PAL.ochreLt, PAL.umber,
        ];

        for (let rIdx = 0; rIdx < rows; rIdx++) {
          const sy = yTop + 10 + (rIdx + 1) * rowH;
          rbBack.rect("inShad", x0 + 8, sy - rowH + 4, x1 - x0 - 16, 14, { fill: PAL.cut, fillOpacity: 0.24 });

          if (rIdx === rows - 1) {
            // Bottom tier: tall stacked cotton-rag paper reams
            for (let k = 0; k < 6; k++) {
              const ry = sy - 8 - k * 14;
              rbBack.rect("paper", x0 + 18, ry - 11, x1 - x0 - 36, 10, { fill: PAL.petal, fillOpacity: 0.96 });
              rbFront.rect("paperRim", x0 + 18, ry - 11, x1 - x0 - 36, 10, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.76, nonScaling: "hatch" });
            }
          } else {
            let jx = x0 + 16;
            let idx = 0;
            while (jx < x1 - 36) {
              const isTin = rIdx === rows - 2 && idx % 2 === 1;
              const jw = isTin ? rand(p.r, 34, 44) : rand(p.r, 30, 46);
              if (jx + jw > x1 - 14) break;
              const jh = rowH * (isTin ? rand(p.r, 0.46, 0.6) : rand(p.r, 0.5, 0.68));
              const cx = jx + jw * 0.5;
              const jy = sy - 8;
              const col = pigPalette[Math.floor(p.r() * pigPalette.length)];
              if (isTin) {
                rbBack.rect(`pig-${col}`, cx - jw * 0.46, jy - jh, jw * 0.92, jh, { fill: col, fillOpacity: 0.96 });
                rbFront.rect("tinShad", cx + jw * 0.14, jy - jh, jw * 0.32, jh, { fill: PAL.cut, fillOpacity: 0.2 });
                rbFront.addPath("tinLid", ellipsePath(cx, jy - jh, jw * 0.46, 4.2), { fill: PAL.slateLt, fillOpacity: 0.94 });
                rbFront.rect("label", cx - jw * 0.38, jy - jh * 0.66, jw * 0.76, jh * 0.34, { fill: PAL.petal, fillOpacity: 0.94 });
                rbFront.line("rule", cx - jw * 0.26, jy - jh * 0.5, cx + jw * 0.26, jy - jh * 0.5, { stroke: PAL.inkMid, strokeWidth: 0.38, strokeOpacity: 0.72, nonScaling: "hatch" });
                rbFront.rect("out", cx - jw * 0.46, jy - jh, jw * 0.92, jh, { stroke: PAL.ink, strokeWidth: 0.56, strokeOpacity: 0.84, nonScaling: "contour" });
                rbFront.addPath("out", ellipsePath(cx, jy - jh, jw * 0.46, 4.2), { stroke: PAL.ink, strokeWidth: 0.5, strokeOpacity: 0.84, nonScaling: "contour" });
              } else {
                const j = makeCurvedJar(cx, jy, jw * 0.46, jh, ((rIdx + idx) % 3) as 0 | 1 | 2);
                rbBack.addPath("glass", j.glass, { fill: PAL.glass, fillOpacity: 0.5 });
                rbBack.addPath(`pig-${col}`, j.mound, { fill: col, fillOpacity: 0.94 });
                rbFront.addPath("meniscus", j.meniscus, { fill: PAL.petal, fillOpacity: 0.38 });
                rbFront.addPath("shadeR", j.shadeR, { fill: PAL.cut, fillOpacity: 0.18 });
                rbFront.addPath("cork", j.cork, { fill: PAL.ochre, fillOpacity: 0.96 });
                rbFront.addPath("label", j.label, { fill: PAL.petal, fillOpacity: 0.94 });
                rbFront.addPath("rule", j.labelRule, { stroke: PAL.inkMid, strokeWidth: 0.38, strokeOpacity: 0.74, nonScaling: "hatch" });
                rbFront.addPath("hi", j.hi, { stroke: PAL.inkRim, strokeWidth: 0.68, strokeOpacity: 0.72, nonScaling: "hatch" });
                rbFront.addPath("out", j.glass + j.cork, { stroke: PAL.ink, strokeWidth: 0.56, strokeOpacity: 0.84, nonScaling: "contour" });
              }
              jx += jw + rand(p.r, 3, 7);
              idx++;
            }
          }
          rbFront.rect("plank", x0 - 3, sy - 8, x1 - x0 + 6, 10, { fill: PAL.bark, fillOpacity: 0.99 });
          rbFront.rect("plankRim", x0 - 3, sy - 8, x1 - x0 + 6, 10, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.88, nonScaling: "contour" });
        }
        rbFront.rect("cabRim", x0, yTop, x1 - x0, yBot - yTop, { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.88, nonScaling: "contour" });
        rbBack.flush(p);
        rbFront.flush(p);
      };

      drawDenseApothecaryRack(-130, 382, 130, 1112, 6);
      drawDenseApothecaryRack(1918, 2550, 130, 1112, 6);

      // 2b. Center-Right Atelier Wall Above Press Bed (x = 1105..1875):
      //     Walnut Rack Holding 12 Burins/Burnishers + 3 Hung Burnished Master Plates + 11 3-Value Curved Apothecary Bottles!
      {
        const wbBack = new PathBatcher();
        const wbFront = new PathBatcher();
        wbBack.rect("rack", 1122, 412, 378, 22, { fill: PAL.bark, fillOpacity: 0.99 });
        wbFront.rect("rackRim", 1122, 412, 378, 22, { stroke: PAL.ink, strokeWidth: 0.75, strokeOpacity: 0.88, nonScaling: "contour" });
        for (let k = 0; k < 12; k++) {
          const tx = 1142 + k * 31;
          const len = 76 + (k % 3) * 16;
          const hdlD = ellipsePath(tx, 405, 8.2, 11.5);
          wbBack.addPath(k % 2 === 0 ? "hdlA" : "hdlB", hdlD, { fill: k % 2 === 0 ? PAL.ochre : PAL.umberDk, fillOpacity: 0.96 });
          wbFront.addPath("hdlRim", hdlD, { stroke: PAL.ink, strokeWidth: 0.58, strokeOpacity: 0.86, nonScaling: "contour" });
          wbFront.line("steel", tx, 434, tx, 434 + len, { stroke: PAL.slateLt, strokeWidth: 1.25, strokeOpacity: 0.92, nonScaling: "contour" });
          wbFront.line("steelDk", tx + 0.8, 434, tx + 0.8, 434 + len, { stroke: PAL.ink, strokeWidth: 0.45, strokeOpacity: 0.76, nonScaling: "contour" });
        }

        // 3 Hung Burnished Master Copperplates with fine incised engraving compositions
        for (const [px0, py0, pw, ph] of [
          [1522, 404, 108, 138],
          [1644, 404, 108, 138],
          [1766, 404, 108, 138],
        ] as const) {
          wbBack.rect("plShad", px0 + 4, py0 + 6, pw, ph, { fill: PAL.cut, fillOpacity: 0.24 });
          wbBack.rect("plCop", px0, py0, pw, ph, { fill: PAL.copper, fillOpacity: 0.98 });
          wbFront.rect("plCopRim", px0, py0, pw, ph, { stroke: PAL.ink, strokeWidth: 0.75, strokeOpacity: 0.88, nonScaling: "contour" });
          wbFront.rect("plIn", px0 + 10, py0 + 10, pw - 20, ph - 20, { stroke: PAL.ochreLt, strokeWidth: 0.5, strokeOpacity: 0.7, nonScaling: "hatch" });
          wbFront.circle("peg", px0 + pw * 0.5, py0 + 5, 3.8, { fill: PAL.brassLt, fillOpacity: 0.96 });
          for (let r = 0; r < 6; r++) {
            wbFront.line("inc", px0 + 18, py0 + 26 + r * 14, px0 + pw - 18, py0 + 26 + r * 14, { stroke: PAL.ink, strokeWidth: 0.36, strokeOpacity: 0.54, nonScaling: "hatch" });
          }
        }

        // Oak Wall Ledge crammed with 11 3-Value Curved Blown-Glass Ink/Mordant/Linseed Bottles (strict 2-pass z-order!)
        wbFront.rect("ledge", 1118, 634, 754, 20, { fill: PAL.bark, fillOpacity: 0.99 });
        wbFront.rect("ledgeRim", 1118, 634, 754, 20, { stroke: PAL.ink, strokeWidth: 0.78, strokeOpacity: 0.88, nonScaling: "contour" });
        const ledgeSpecs: readonly [number, number, number, 0 | 1 | 2, string][] = [
          [1156, 20, 64, 0, PAL.prussian],
          [1218, 22, 74, 1, PAL.cinnabar],
          [1280, 19, 64, 2, PAL.ochre],
          [1342, 22, 60, 0, PAL.malachite],
          [1408, 20, 74, 1, PAL.azurite],
          [1474, 19, 64, 2, PAL.wisteria],
          [1540, 22, 70, 1, PAL.copper],
          [1606, 20, 62, 0, PAL.celadonDk],
          [1672, 22, 72, 2, PAL.umberDk],
          [1740, 20, 64, 1, PAL.cinnabarLt],
          [1808, 22, 66, 0, PAL.prussian],
        ];
        for (const [bx, hw, bh, st, col] of ledgeSpecs) {
          const j = makeCurvedJar(bx, 634, hw, bh, st);
          wbBack.addPath("lGlass", j.glass, { fill: PAL.glass, fillOpacity: 0.48 });
          wbBack.addPath(`lpig-${col}`, j.mound, { fill: col, fillOpacity: 0.94 });
          wbFront.addPath("lMen", j.meniscus, { fill: PAL.petal, fillOpacity: 0.44 });
          wbFront.addPath("lShad", j.shadeR, { fill: PAL.cut, fillOpacity: 0.2 });
          wbFront.addPath("lCork", j.cork, { fill: PAL.ochre, fillOpacity: 0.96 });
          wbFront.addPath("lLab", j.label, { fill: PAL.petal, fillOpacity: 0.95 });
          wbFront.addPath("lRule", j.labelRule, { stroke: PAL.inkMid, strokeWidth: 0.38, strokeOpacity: 0.78, nonScaling: "hatch" });
          wbFront.addPath("lHi", j.hi, { stroke: PAL.inkRim, strokeWidth: 0.72, strokeOpacity: 0.78, nonScaling: "hatch" });
          wbFront.addPath("lOut", j.glass + j.cork, { stroke: PAL.ink, strokeWidth: 0.58, strokeOpacity: 0.86, nonScaling: "contour" });
        }
        wbBack.flush(p);
        wbFront.flush(p);
      }

      // 3. TWO Staggered Overhead Drying Lines Holding 16 Detailed Miniature Copperplate Proofs (`data-anim="sway"`)!
      const twine1 = sample(quad([60, 92], [1190, 140], [2340, 88]), 20);
      const twine2 = sample(quad([390, 256], [1200, 286], [1910, 254]), 18);
      p.calligraphicStroke(twine1, 1.6, 2.2, 1.6, PAL.umberDk, 0.86);
      p.calligraphicStroke(twine2, 1.4, 2.0, 1.4, PAL.umberDk, 0.76);
      p.flush();

      const drawHangingProof = (x: number, y: number, w: number, h: number, motif: number, phase: number) => {
        p.animGroup({ kind: "sway", cx: x, cy: y, ampDeg: 1.9, freq: 0.94, phase }, () => {
          const hw = w * 0.5;
          const sheet: Pt[] = [[x - hw, y + 6], [x + hw, y + 6], [x + hw + 3, y + h], [x, y + h + 4], [x - hw - 2, y + h]];
          p.fillPath(polyPath(sheet.map(([sx, sy]): Pt => [sx + 4, sy + 5])), PAL.cut, 0.2);
          p.fillPath(polyPath(sheet), PAL.paperWarm, 0.98);
          p.layer("var(--z-halo-op)", () => {
            p.fillPath(polyPath(sheet), PAL.lantern, 0.22);
          });

          const px0 = x - hw * 0.78;
          const px1 = x + hw * 0.78;
          const py0 = y + 20;
          const py1 = y + h - 18;
          const mcx = x;
          const mcy = (py0 + py1) * 0.5;
          const pw = px1 - px0;
          const pb = new PathBatcher();
          pb.addPath("sheetRim", polyPath(sheet), { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.78, nonScaling: "contour" });
          pb.rect("plateBg", px0, py0, pw, py1 - py0, { fill: PAL.petal, fillOpacity: 0.86 });
          pb.rect("plateRim", px0, py0, pw, py1 - py0, { stroke: PAL.inkMid, strokeWidth: 0.44, strokeOpacity: 0.76, nonScaling: "hatch" });

          const kind = motif % 6;
          if (kind === 0) {
            // Miniature Dense Micro-Window Skyscraper Canyon & Steel Truss Bridge Copperplate Engraving!
            pb.rect("sky", px0 + 3, py0 + 3, pw - 6, mcy - py0 + 2, { fill: PAL.glass, fillOpacity: 0.24 });
            pb.rect("wat", px0 + 3, mcy + 5, pw - 6, py1 - mcy - 8, { fill: PAL.water, fillOpacity: 0.36 });
            // 4 stepped skyscraper silhouettes with fine 0.32px fenestration grids
            const twrs: readonly [number, number, number, string][] = [
              [px0 + 6, py0 + 18, pw * 0.22, PAL.paperStone],
              [px0 + pw * 0.29, py0 + 8, pw * 0.24, PAL.slateDk],
              [px0 + pw * 0.54, py0 + 14, pw * 0.2, PAL.prussian],
              [px0 + pw * 0.75, py0 + 22, pw * 0.19, PAL.copper],
            ];
            for (let ti = 0; ti < twrs.length; ti++) {
              const [tx, ty, tw, tc] = twrs[ti];
              const th = mcy + 5 - ty;
              pb.rect(`tw-${ti}`, tx, ty, tw, th, { fill: tc, fillOpacity: 0.76 });
              for (let r = 3; r < th - 2; r += 5) {
                pb.line("win", tx + 2, ty + r, tx + tw - 2, ty + r, { stroke: PAL.petal, strokeWidth: 0.32, strokeOpacity: 0.72, nonScaling: "hatch" });
              }
              pb.rect("twRim", tx, ty, tw, th, { stroke: PAL.ink, strokeWidth: 0.36, strokeOpacity: 0.78, nonScaling: "hatch" });
            }
            for (let g = 0; g < 6; g++) {
              pb.line("et", px0 + 7 + (g % 2) * 8, mcy + 14 + g * 5.2, px1 - 7 - (g % 2) * 6, mcy + 14 + g * 5.2, { stroke: PAL.ink, strokeWidth: 0.34, strokeOpacity: 0.68, nonScaling: "hatch" });
            }
            pb.addPath("arch", `M${f(px0 + 6)} ${f(mcy + 11)}H${f(px1 - 6)}M${f(px0 + 10)} ${f(mcy + 14)}A${f(pw * 0.36)} 14 0 0 1 ${f(px1 - 10)} ${f(mcy + 14)}`, { stroke: PAL.ink, strokeWidth: 0.5, strokeOpacity: 0.84, nonScaling: "hatch" });
          } else if (kind === 1) {
            // Celestial Armillary & Observatory Meridian Plate
            pb.rect("bgC", px0 + 3, py0 + 3, pw - 6, py1 - py0 - 6, { fill: PAL.prussian, fillOpacity: 0.16 });
            pb.circle("orb", mcx, mcy - 2, pw * 0.32, { fill: PAL.ochreLt, fillOpacity: 0.38 });
            pb.circle("orbRim", mcx, mcy - 2, pw * 0.32, { stroke: PAL.inkDraft, strokeWidth: 0.48, strokeOpacity: 0.82, nonScaling: "hatch" });
            pb.addPath("rings", ellipsePath(mcx, mcy - 2, pw * 0.34, pw * 0.12) + ellipsePath(mcx, mcy - 2, pw * 0.12, pw * 0.34), { stroke: PAL.inkDraft, strokeWidth: 0.42, strokeOpacity: 0.8, nonScaling: "hatch" });
            pb.line("ax", px0 + 6, mcy - 2, px1 - 6, mcy - 2, { stroke: PAL.inkDraft, strokeWidth: 0.36, strokeOpacity: 0.7, nonScaling: "hatch" });
            pb.line("ax", mcx, py0 + 6, mcx, py1 - 10, { stroke: PAL.inkDraft, strokeWidth: 0.36, strokeOpacity: 0.7, nonScaling: "hatch" });
          } else if (kind === 2) {
            // Classical Taj Marble Dome & Cypresses Copperplate
            pb.rect("wat", px0 + 3, mcy + 10, pw - 6, py1 - mcy - 13, { fill: PAL.water, fillOpacity: 0.36 });
            const domeD = `M${f(mcx - pw * 0.24)} ${f(mcy + 10)}V${f(mcy - 6)}Q${f(mcx)} ${f(py0 + 12)} ${f(mcx + pw * 0.24)} ${f(mcy - 6)}V${f(mcy + 10)}Z`;
            pb.addPath("dome", domeD, { fill: PAL.paperWarm, fillOpacity: 0.94 });
            pb.addPath("domeRim", domeD, { stroke: PAL.ink, strokeWidth: 0.44, strokeOpacity: 0.8, nonScaling: "hatch" });
            pb.addPath("cyp", `M${f(px0 + 8)} ${f(mcy + 10)}L${f(px0 + 13)} ${f(py0 + 18)}L${f(px0 + 18)} ${f(mcy + 10)}ZM${f(px1 - 18)} ${f(mcy + 10)}L${f(px1 - 13)} ${f(py0 + 18)}L${f(px1 - 8)} ${f(mcy + 10)}Z`, { fill: PAL.sageDk, fillOpacity: 0.86 });
          } else if (kind === 3) {
            // Li River Blue-Green Karst Peaks & Pavilion Engraving
            const k1D = `M${f(px0 + 6)} ${f(mcy + 14)}Q${f(px0 + pw * 0.28)} ${f(py0 + 10)} ${f(mcx)} ${f(mcy + 14)}Z`;
            const k2D = `M${f(mcx - 8)} ${f(mcy + 14)}Q${f(px0 + pw * 0.7)} ${f(py0 + 14)} ${f(px1 - 6)} ${f(mcy + 14)}Z`;
            pb.addPath("k1", k1D, { fill: PAL.celadon, fillOpacity: 0.68 });
            pb.addPath("k2", k2D, { fill: PAL.malachite, fillOpacity: 0.62 });
            pb.addPath("kRim", k1D + k2D, { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.78, nonScaling: "hatch" });
            pb.rect("wat", px0 + 3, mcy + 14, pw - 6, py1 - mcy - 17, { fill: PAL.water, fillOpacity: 0.36 });
          } else if (kind === 4) {
            // Cross-Sectioned Nautilus Conchology Plate
            const sPts: Pt[] = Array.from({ length: 34 }, (_, i) => {
              const th = (i / 33) * TAU * 2.0;
              const r = 3.8 * Math.exp(0.18 * th);
              return [mcx + Math.cos(th) * r, mcy - 2 + Math.sin(th) * r] as Pt;
            });
            pb.addPath("nFill", closedSmooth(sPts.slice(16)), { fill: PAL.ochreLt, fillOpacity: 0.44 });
            pb.addPath("nLine", linePath(sPts), { stroke: PAL.cinnabarDk, strokeWidth: 0.48, strokeOpacity: 0.84, nonScaling: "hatch" });
          } else {
            // Botanical Herbarium Frond Study
            pb.line("stem", mcx, py1 - 10, mcx + 3, py0 + 12, { stroke: PAL.sageDk, strokeWidth: 0.56, strokeOpacity: 0.84, nonScaling: "hatch" });
            for (let k = -3; k <= 3; k++) {
              const ly = mcy + k * 9;
              pb.line("lf", mcx, ly, mcx - pw * 0.3, ly - 8, { stroke: PAL.sageDk, strokeWidth: 0.45, strokeOpacity: 0.78, nonScaling: "hatch" });
              pb.line("lf", mcx, ly, mcx + pw * 0.3, ly - 8, { stroke: PAL.sageDk, strokeWidth: 0.45, strokeOpacity: 0.78, nonScaling: "hatch" });
            }
          }
          // Twin wooden clothespins
          for (const pinOff of [-hw * 0.48, hw * 0.48]) {
            pb.rect("pin", x + pinOff - 3.5, y - 7, 7, 20, { fill: PAL.ochre, fillOpacity: 0.96 });
            pb.rect("pinRim", x + pinOff - 3.5, y - 7, 7, 20, { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.85, nonScaling: "contour" });
          }
          pb.flush(p);
        });
      };

      // Top drying line: 10 proofs spanning full width!
      for (let i = 0; i < 10; i++) {
        const px = 195 + i * 222;
        const sag = Math.sin(((i + 0.5) / 10) * Math.PI) * 32;
        drawHangingProof(px, 96 + sag, 108, 144, i, i * 0.62);
      }
      // Second lower drying line (middle bay above press & tool rack): 6 proofs!
      for (let i = 0; i < 6; i++) {
        const px = 560 + i * 238;
        const sag = Math.sin(((i + 0.5) / 6) * Math.PI) * 18;
        drawHangingProof(px, 260 + sag, 98, 128, i + 3, i * 0.9 + 1.1);
      }

      // 4. Heavy Oak-and-Cast-Iron Intaglio Rolling Press (Left-Center) + Traveling Cast-Iron/Oak Press Bed!
      const drawOakBeam = (pts: Pt[], angDeg = 90) => {
        p.fillPath(polyPath(pts), PAL.bark, 0.99);
        p.fillPath(polyPath([pts[0], lerp(pts[0], pts[1], 0.35), lerp(pts[3], pts[2], 0.35), pts[3]]), PAL.ochre, 0.16);
        p.burinHatch(pts, rad(angDeg), 9.5, linearTone(pts[0], pts[2], 0.14, 0.72), {
          color: PAL.ink,
          opacity: 0.46,
          widths: [0.34, 0.58, 0.88],
          cross: true,
          crossThresh: 0.56,
        });
        p.burinContour(polyPath(pts), PAL.ink, 0.88, 0.88, 4);
        p.burinContour(`M${f(pts[0][0])} ${f(pts[0][1])}L${f(pts[1][0])} ${f(pts[1][1])}`, PAL.litEdge, 0.72, 0.7, 1);
        p.flush();
      };

      // Traveling Cast-Iron & Oak Press Bed Plank (y = 708..1106)
      const bedPlank: Pt[] = [[410, 708], [1868, 708], [1882, 1106], [410, 1106]];
      p.fillPath(polyPath(bedPlank.map(([x, y]): Pt => [x + 10, y + 12])), PAL.cut, 0.24);
      p.fillPath(polyPath(bedPlank), PAL.slateDk, 0.98);
      p.fillPath(polyPath([[1045, 722], [1846, 722], [1858, 1092], [1045, 1092]]), PAL.umber, 0.96);
      p.burinHatch([[1045, 722], [1846, 722], [1858, 1092], [1045, 1092]], rad(0), 12, linearTone([1450, 722], [1450, 1092], 0.14, 0.56), {
        color: PAL.inkSepia,
        opacity: 0.34,
        widths: [0.3, 0.52, 0.76],
      });
      p.fillPath(polyPath([[420, 708], [1868, 708], [1868, 724], [420, 724]]), PAL.slateLt, 0.9);
      p.fillPath(polyPath([[420, 1088], [1880, 1088], [1880, 1106], [420, 1106]]), PAL.slate, 0.94);
      p.burinContour(polyPath(bedPlank), PAL.ink, 0.92, 0.9, 4);
      p.burinContour(`M420 708H1868M420 1088H1880`, PAL.litEdge, 0.78, 0.74, 2);
      p.flush();

      // Damp Deckle-Edged Cotton Rag Printing Sheet + Genuine `180+`-Window Micro-Engraved Skyscraper & Truss Bridge Proof!
      const ragBed: Pt[] = [[1094, 736], [1788, 736], [1796, 1074], [1094, 1074]];
      p.fillPath(polyPath(ragBed.map(([x, y]): Pt => [x + 4, y + 5])), PAL.cut, 0.22);
      p.fillPath(polyPath(ragBed), PAL.petal, 0.94);
      p.burinContour(polyPath(ragBed), PAL.inkMid, 0.65, 0.76, 4);
      {
        const proofClip = p.gradId("proof-clip");
        p.defs.push(`<clipPath id="${proofClip}"><rect x="1116" y="768" width="132" height="260"/></clipPath>`);
        p.flush();
        p.out.push(`<g clip-path="url(#${proofClip})">`);
        // Delicate archival engraving sky + river backdrop
        p.fillPath(polyPath([[1116, 768], [1248, 768], [1248, 926], [1116, 926]]), PAL.glass, 0.22);
        p.fillPath(polyPath([[1116, 926], [1248, 926], [1248, 1028], [1116, 1028]]), PAL.water, 0.34);

        // 5 Overlapping `curtainSkyscraper3D` Engraved Towers (`180+` crisp micro-windows!) in architectural sepia/slate tones!
        curtainSkyscraper3D(p, {
          cx: 1132, topY: 816, baseY: 928, wL: 24, wR: 18, colsL: 5, colsR: 4, rows: 16,
          wallL: PAL.paperWarm, wallR: PAL.paperShadow, glassL: PAL.slate, glassR: PAL.slateDk, litChance: 0.14, roofDetail: "hvac",
        });
        curtainSkyscraper3D(p, {
          cx: 1164, topY: 786, baseY: 928, wL: 22, wR: 18, colsL: 5, colsR: 4, rows: 22,
          wallL: PAL.slateDk, wallR: PAL.prussianDk, glassL: PAL.prussian, glassR: PAL.ink, litChance: 0.24, roofDetail: "spire",
        });
        curtainSkyscraper3D(p, {
          cx: 1198, topY: 798, baseY: 928, wL: 24, wR: 20, colsL: 6, colsR: 5, rows: 20,
          wallL: PAL.paperStone, wallR: PAL.slate, glassL: PAL.prussian, glassR: PAL.prussianDk, litChance: 0.18, setback: { fracH: 0.32, inset: 0.26 }, roofDetail: "penthouse",
        });
        curtainSkyscraper3D(p, {
          cx: 1236, topY: 814, baseY: 928, wL: 22, wR: 18, colsL: 5, colsR: 4, rows: 16,
          wallL: PAL.copper, wallR: PAL.cinnabarDk, glassL: PAL.prussianDk, glassR: PAL.ink, litChance: 0.2, roofDetail: "watertank",
        });
        curtainSkyscraper3D(p, {
          cx: 1146, topY: 856, baseY: 928, wL: 20, wR: 16, colsL: 5, colsR: 4, rows: 11,
          wallL: PAL.paperWarm, wallR: PAL.paperStone, glassL: PAL.slateDk, glassR: PAL.ink, litChance: 0.16, roofDetail: "none",
        });

        // Lacy Steel `trussBridgeSpan` across the engraved Chicago River canyon!
        trussBridgeSpan(p, {
          p0: [1114, 934],
          p1: [1250, 934],
          depth: 16,
          bays: 10,
          kind: "warren",
          steelColor: PAL.slateDk,
          highlightColor: PAL.paperWarm,
          deck: true,
          piers: 2,
          groundY: 966,
        });

        // Fine Copperplate Broken Water Reflections & Plate Etching Sky Stipples
        const pb = new PathBatcher();
        for (let row = 0; row < 12; row++) {
          const wy = 950 + row * 6.4;
          const off = (row % 2) * 11;
          pb.line("rip", 1120 + off, wy, 1144 + off, wy, { stroke: PAL.ink, strokeWidth: 0.34, strokeOpacity: 0.68, nonScaling: "hatch" });
          pb.line("rip", 1154 + (row % 3) * 5, wy + 1.2, 1196 + (row % 3) * 5, wy + 1.2, { stroke: PAL.ink, strokeWidth: 0.34, strokeOpacity: 0.72, nonScaling: "hatch" });
          pb.line("rip", 1208 - off * 0.4, wy - 0.6, 1242 - off * 0.4, wy - 0.6, { stroke: PAL.ink, strokeWidth: 0.34, strokeOpacity: 0.64, nonScaling: "hatch" });
        }
        pb.flush(p);
        p.out.push(`</g>`);

        // Crisp Double Plate-Mark Bevel & Engraved Plate Title Caption underneath!
        const pm = new PathBatcher();
        pm.rect("pmOut", 1111, 763, 142, 286, { stroke: PAL.inkMid, strokeWidth: 0.48, strokeOpacity: 0.76, nonScaling: "hatch" });
        pm.rect("pmIn", 1116, 768, 132, 260, { stroke: PAL.ink, strokeWidth: 0.44, strokeOpacity: 0.84, nonScaling: "hatch" });
        pm.line("pmCap", 1144, 1037, 1220, 1037, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.72, nonScaling: "hatch" });
        pm.line("pmCap", 1160, 1043, 1204, 1043, { stroke: PAL.inkMid, strokeWidth: 0.32, strokeOpacity: 0.56, nonScaling: "hatch" });
        pm.flush(p);
      }

      // Corner Brass Bed Registration L-Stops
      for (const [rx, ry, sx, sy] of [[1814, 742, -16, 16], [1820, 1068, -16, -16]] as const) {
        p.fillPath(polyPath([[rx, ry], [rx + sx, ry], [rx + sx, ry + sy * 0.45], [rx + sx * 0.45, ry + sy * 0.45], [rx + sx * 0.45, ry + sy], [rx, ry + sy]]), PAL.brass, 0.98);
        p.burinContour(`M${rx + sx} ${ry}H${rx}V${ry + sy}`, PAL.ink, 0.72, 0.86, 2);
      }
      p.flush();

      // Massive Oak Press Cheeks, Crown Crossbeam, Capstan Screws & Pressure Dial!
      drawOakBeam([[455, 420], [1092, 420], [1092, 472], [455, 472]], 0);
      drawOakBeam([[485, 420], [612, 420], [612, 1165], [485, 1165]], 90);
      drawOakBeam([[938, 420], [1062, 420], [1062, 1165], [938, 1165]], 90);

      let bolts = "";
      for (const bx of [548, 1000]) {
        for (const by of [512, 668, 982, 1110]) bolts += circlePath(bx, by, 8.5);
      }
      p.fillPath(bolts, PAL.slateDk, 0.96);
      p.burinContour(bolts, PAL.litEdge, 0.7, 0.75, 8);
      p.flush();

      for (const sx of [548, 1000]) {
        const screw: Pt[] = [[sx - 18, 344], [sx + 18, 344], [sx + 18, 420], [sx - 18, 420]];
        p.fillPath(polyPath(screw), PAL.brass, 0.96);
        p.burinHatch(screw, rad(10), 6, linearTone([sx - 18, 380], [sx + 18, 380], 0.14, 0.78), { color: PAL.ink, opacity: 0.56, widths: [0.35, 0.62, 0.92] });
        p.burinContour(polyPath(screw), PAL.ink, 0.78, 0.88, 4);
        const cap: Pt[] = [[sx - 44, 326], [sx + 44, 326], [sx + 44, 348], [sx - 44, 348]];
        p.fillPath(polyPath(cap), PAL.brassDk, 0.96);
        p.burinContour(polyPath(cap), PAL.ink, 0.8, 0.88, 4);
      }
      p.fillPath(circlePath(774, 446, 26), PAL.brass, 0.98);
      p.fillPath(circlePath(774, 446, 20), PAL.petal, 0.96);
      p.burinContour(circlePath(774, 446, 26) + circlePath(774, 446, 20) + `M774 446L786 435`, PAL.ink, 0.76, 0.88, 3);
      p.flush();

      const blanket: Pt[] = [[612, 560], [938, 560], [938, 672], [612, 672]];
      p.fillPath(polyPath(blanket), PAL.petal, 0.94);
      p.burinHatch(blanket, rad(2), 9, linearTone([775, 560], [775, 672], 0.08, 0.52), { color: PAL.inkMid, opacity: 0.34, widths: [0.32, 0.52, 0.74] });
      p.burinContour(polyPath(blanket), PAL.inkMid, 0.72, 0.82, 4);
      p.flush();

      const rollerPts: Pt[] = [[612, 672], [938, 672], [938, 934], [612, 934]];
      p.fillPath(polyPath(rollerPts), PAL.slateLt, 0.98);
      p.burinHatch(rollerPts, rad(0), 7.5, cylinderTone([775, 803], [1, 0], 131), { color: PAL.ink, opacity: 0.54, widths: [0.35, 0.65, 1.0] });
      p.burinContour(polyPath(rollerPts), PAL.ink, 0.88, 0.9, 4);
      p.flush();

      for (const bx of [548, 1000]) {
        const blk: Pt[] = [[bx - 38, 728], [bx + 38, 728], [bx + 44, 864], [bx - 44, 864]];
        p.fillPath(polyPath(blk), PAL.slateDk, 0.99);
        p.burinContour(polyPath(blk), PAL.ink, 0.86, 0.9, 4);
        p.burinContour(`M${bx - 38} 728H${bx + 38}`, PAL.litEdge, 0.8, 0.75, 1);
      }
      p.flush();

      // 4a. Meshing 3-Gear Reduction Train & Rotating 6-Spoked Cast-Iron Star-Wheel (`data-anim="rotate"`)!
      p.animGroup({ kind: "rotate", cx: 472, cy: 582, speedDeg: 18.0, phase: 16 }, () => {
        p.spurGear({ cx: 472, cy: 582, r: 64, teeth: 14, spokes: 5, fill: PAL.brass, rimFill: PAL.brassLt });
      });
      p.animGroup({ kind: "rotate", cx: 446, cy: 760, speedDeg: -9.5, phase: 4 }, () => {
        p.spurGear({ cx: 446, cy: 760, r: 118, teeth: 24, spokes: 6, fill: PAL.slate, rimFill: PAL.slateLt });
        p.burinContour(circlePath(446, 760, 96), PAL.litEdge, 0.85, 0.78, 1);
      });
      p.animGroup({ kind: "rotate", cx: 664, cy: 802, speedDeg: 9.8, phase: 18 }, () => {
        const cx = 664;
        const cy = 802;
        p.fillPath(circlePath(cx, cy, 152) + circlePath(cx, cy, 128), PAL.slateDk, 0.98, true);
        p.fillPath(circlePath(cx, cy, 146) + circlePath(cx, cy, 134), PAL.slateLt, 0.44, true);
        p.burinContour(circlePath(cx, cy, 152) + circlePath(cx, cy, 128), PAL.ink, 0.95, 0.92, 2);
        p.burinContour(circlePath(cx, cy, 148) + circlePath(cx, cy, 131), PAL.litEdge, 0.88, 0.8, 2);
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * TAU;
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          const nx = -sa;
          const ny = ca;
          const p0: Pt = [cx + ca * 28, cy + sa * 28];
          const p1: Pt = [cx + ca * 204, cy + sa * 204];
          const spoke: Pt[] = [[p0[0] + nx * 11, p0[1] + ny * 11], [p1[0] + nx * 5.8, p1[1] + ny * 5.8], [p1[0] - nx * 5.8, p1[1] - ny * 5.8], [p0[0] - nx * 11, p0[1] - ny * 11]];
          p.fillPath(polyPath(spoke), PAL.slate, 0.98);
          p.burinContour(polyPath(spoke), PAL.ink, 0.82, 0.9, 4);
          p.burinContour(`M${f(p0[0] + nx * 4)} ${f(p0[1] + ny * 4)}L${f(p1[0] + nx * 2.4)} ${f(p1[1] + ny * 2.4)}`, PAL.litEdge, 0.82, 0.8, 1);
          const f0: Pt = [cx + ca * 172, cy + sa * 172];
          const f1: Pt = [cx + ca * 188, cy + sa * 188];
          const ferrule: Pt[] = [[f0[0] + nx * 9.5, f0[1] + ny * 9.5], [f1[0] + nx * 9.5, f1[1] + ny * 9.5], [f1[0] - nx * 9.5, f1[1] - ny * 9.5], [f0[0] - nx * 9.5, f0[1] - ny * 9.5]];
          p.fillPath(polyPath(ferrule), PAL.brass, 0.98);
          const g0: Pt = [cx + ca * 188, cy + sa * 188];
          const g1: Pt = [cx + ca * 240, cy + sa * 240];
          const grip: Pt[] = [
            [g0[0] + nx * 8.5, g0[1] + ny * 8.5],
            [lerp(g0, g1, 0.64)[0] + nx * 14.5, lerp(g0, g1, 0.64)[1] + ny * 14.5],
            [g1[0] + nx * 7, g1[1] + ny * 7],
            [g1[0] - nx * 7, g1[1] - ny * 7],
            [lerp(g0, g1, 0.64)[0] - nx * 14.5, lerp(g0, g1, 0.64)[1] - ny * 14.5],
            [g0[0] - nx * 8.5, g0[1] - ny * 8.5],
          ];
          p.fillPath(closedSmooth(grip), PAL.ochre, 0.98);
          p.burinContour(closedSmooth(grip), PAL.ink, 0.78, 0.9, 1);
        }
        p.fillPath(circlePath(cx, cy, 40), PAL.slateDk, 0.99);
        p.fillPath(circlePath(cx, cy, 21), PAL.brass, 0.98);
        p.burinContour(circlePath(cx, cy, 40) + circlePath(cx, cy, 21), PAL.ink, 0.92, 0.92, 2);
      });

      // 5. Master Engraver's Foreground Oak Workbench (y = 1152..BLEED.y1)
      const bench: Pt[] = [[BLEED.x0, 1152], [BLEED.x1, 1152], [BLEED.x1, BLEED.y1], [BLEED.x0, BLEED.y1]];
      p.fillPath(polyPath(bench), PAL.umber, 0.99);
      p.burinHatch(bench, rad(1), 12, linearTone([1200, 1152], [1200, 1680], 0.14, 0.58), { color: PAL.inkSepia, opacity: 0.36, widths: [0.32, 0.56, 0.84] });
      p.burinContour(`M${BLEED.x0} 1152H${BLEED.x1}`, PAL.litEdge, 0.85, 0.72, 1);
      let planks = "";
      for (let i = -6; i <= 6; i++) planks += `M${f(1200 + i * 165)} 1152L${f(1200 + i * 255)} ${BLEED.y1}`;
      p.burin(planks, PAL.inkMid, 0.6, 0.5, 13, "hatch");
      p.flush();

      p.layer("var(--z-halo-op)", () => {
        p.fillPath(ellipsePath(1045, 1340, 480, 260), benchLampPool, 1);
      });

      // 5a. Stack of Freshly Pulled Archival Proofs with Dense `0.35px` Micro-Engraved Skyscraper & Truss Bridge Plate (`x = 68..362`)!
      {
        const stack0: Pt[] = [[92, 1255], [344, 1244], [362, 1468], [76, 1482]];
        const stack1: Pt[] = [[84, 1238], [336, 1228], [352, 1450], [68, 1464]];
        p.fillPath(polyPath(stack0.map(([x, y]): Pt => [x + 8, y + 10])), PAL.cut, 0.28);
        p.fillPath(polyPath(stack0), PAL.paperDeep, 0.98);
        p.fillPath(polyPath(stack1), PAL.petal, 0.96);
        p.burinContour(polyPath(stack0) + polyPath(stack1), PAL.ink, 0.72, 0.84, 8);
        const pb = new PathBatcher();
        pb.quad("imp", [116, 1266], [310, 1258], [320, 1420], [108, 1428], { stroke: PAL.inkMid, strokeWidth: 0.52, strokeOpacity: 0.78, nonScaling: "hatch" });
        pb.quad("sky", [122, 1272], [304, 1264], [308, 1352], [118, 1360], { fill: PAL.glass, fillOpacity: 0.22 });
        pb.quad("wat", [118, 1360], [308, 1352], [312, 1412], [114, 1420], { fill: PAL.water, fillOpacity: 0.34 });
        // 5 Detailed Engraved Skyscraper Silhouettes + `100+` micro-window grid lines!
        const sTwrs: readonly [number, number, number, number, string][] = [
          [126, 1296, 30, 62, PAL.paperStone],
          [158, 1280, 36, 78, PAL.slateDk],
          [196, 1272, 40, 86, PAL.prussian],
          [238, 1288, 32, 68, PAL.copper],
          [272, 1300, 28, 54, PAL.paperShadow],
        ];
        for (let ti = 0; ti < sTwrs.length; ti++) {
          const [tx, ty, tw, th, tc] = sTwrs[ti];
          pb.rect(`st-${ti}`, tx, ty, tw, th, { fill: tc, fillOpacity: 0.62 });
          pb.rect("stRim", tx, ty, tw, th, { stroke: PAL.ink, strokeWidth: 0.38, strokeOpacity: 0.78, nonScaling: "hatch" });
          for (let rx = tx + 5; rx < tx + tw - 2; rx += 6) {
            pb.line("stGrid", rx, ty + 3, rx, ty + th - 2, { stroke: PAL.ink, strokeWidth: 0.3, strokeOpacity: 0.56, nonScaling: "hatch" });
          }
          for (let ry = ty + 6; ry < ty + th - 2; ry += 7) {
            pb.line("stGrid", tx + 2, ry, tx + tw - 2, ry, { stroke: PAL.ink, strokeWidth: 0.3, strokeOpacity: 0.56, nonScaling: "hatch" });
          }
        }
        // Hatched arched river bridge with radial voussoirs & staggered water reflections
        pb.addPath("br", `M120 1358L306 1350M138 1368A74 36 0 0 1 286 1362M146 1368A66 28 0 0 1 278 1362`, { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.84, nonScaling: "hatch" });
        for (let k = 1; k <= 10; k++) {
          const a = Math.PI + (k / 11) * Math.PI;
          pb.line("brV", 212 + Math.cos(a) * 66, 1365 + Math.sin(a) * 28, 212 + Math.cos(a) * 74, 1365 + Math.sin(a) * 36, { stroke: PAL.ink, strokeWidth: 0.34, strokeOpacity: 0.76, nonScaling: "hatch" });
        }
        for (let r = 0; r < 6; r++) {
          const wy = 1372 + r * 7;
          pb.line("brW", 124 + (r % 2) * 14, wy, 198 + (r % 3) * 10, wy - 1.5, { stroke: PAL.ink, strokeWidth: 0.34, strokeOpacity: 0.68, nonScaling: "hatch" });
          pb.line("brW", 220 + (r % 2) * 10, wy - 2, 296 - (r % 2) * 12, wy - 3.5, { stroke: PAL.ink, strokeWidth: 0.34, strokeOpacity: 0.68, nonScaling: "hatch" });
        }
        pb.flush(p);
      }

      // 5b. Tilted Stitched Gathered-Leather Mushroom Ink Dabber (*Tampon*) at (445, 1338)
      {
        const tx = 445;
        const ty = 1338;
        const toT = (lx: number, ly: number): Pt => add([tx, ty], rot([lx, ly], rad(-12)));
        p.fillPath(ellipsePath(tx + 5, ty + 34, 54, 16), PAL.cut, 0.3);
        const sole: Pt[] = [toT(-48, 12), toT(-38, 30), toT(0, 38), toT(38, 30), toT(48, 12), toT(36, 2), toT(-36, 2)];
        p.fillPath(closedSmooth(sole), PAL.cut, 0.95);
        const cushion: Pt[] = [toT(-46, 10), toT(-44, -14), toT(-22, -32), toT(22, -32), toT(44, -14), toT(46, 10), toT(0, 18)];
        p.doubleGlaze(cushion, PAL.umberLt, PAL.umberDk, { smooth: true, thinPx: 0.52, thickPx: 1.0, flush: false });
        let pleats = "";
        for (const px of [-34, -24, -14, -5, 5, 14, 24, 34]) {
          const a = toT(px * 0.42, -30);
          const b = toT(px * 1.15, 10);
          pleats += `M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) * 0.5)} ${f((a[1] + b[1]) * 0.5 - 4)} ${f(b[0])} ${f(b[1])}`;
        }
        p.burin(pleats, PAL.inkSepia, 0.58, 0.76, 8, "hatch");
        const collar: Pt[] = [toT(-16, -30), toT(16, -30), toT(13, -44), toT(-13, -44)];
        p.fillPath(polyPath(collar), PAL.brass, 0.96);
        const grip: Pt[] = [toT(-11, -44), toT(-19, -68), toT(-13, -90), toT(0, -96), toT(13, -90), toT(19, -68), toT(11, -44)];
        p.doubleGlaze(grip, PAL.bark, PAL.barkDk, { smooth: true, thinPx: 0.52, thickPx: 1.0, flush: false });
      }

      // 5c. Inked Porphyry Mulling Slab, Bell-Shaped Stone Muller + Steel Ink Palette Spatula Knife (`x = 568..880`)
      {
        const slab: Pt[] = [[585, 1295], [842, 1295], [868, 1472], [558, 1472]];
        p.fillPath(polyPath(slab.map(([x, y]): Pt => [x + 6, y + 8])), PAL.cut, 0.24);
        p.fillPath(polyPath(slab), PAL.paperStone, 0.94);
        p.burinContour(polyPath(slab), PAL.ink, 0.8, 0.84, 4);
        p.fillPath(ellipsePath(706, 1388, 76, 34), PAL.cinnabar, 0.92);
        p.fillPath(ellipsePath(694, 1380, 42, 16), PAL.cinnabarLt, 0.65);
        const muller: Pt[] = [[674, 1384], [738, 1384], [732, 1348], [720, 1312], [724, 1292], [706, 1284], [688, 1292], [692, 1312], [680, 1348]];
        p.doubleGlaze(muller, PAL.petal, PAL.slate, { knockout: PAL.petal, smooth: true, thinPx: 0.55, thickPx: 1.05, flush: false });
        p.burinContour(`M678 1372Q706 1384 734 1372`, PAL.cinnabarDk, 0.95, 0.8, 1);
        // Steel ink palette spatula knife resting diagonally across right edge of stone slab!
        const blade: Pt[] = [[764, 1396], [834, 1318], [848, 1326], [778, 1404]];
        const kHdl: Pt[] = [[834, 1318], [874, 1272], [890, 1284], [848, 1326]];
        p.fillPath(polyPath(blade), PAL.slateLt, 0.96);
        p.fillPath(polyPath([[764, 1396], [790, 1368], [802, 1378], [778, 1404]]), PAL.cinnabar, 0.9);
        p.fillPath(polyPath(kHdl), PAL.bark, 0.98);
        p.burinContour(polyPath(blade) + polyPath(kHdl), PAL.ink, 0.65, 0.86, 8);
      }

      // 5d. Dense Master Engraver's Foreground Toolbench: Grooved Walnut Burin Rack (14 Tools!), Proofing Brayer,
      //     Articulated Brass Magnifying Lens, Richly Incised Architectural Master Plate, 3 Ink Tins & Tarlatan Cloth!
      {
        // Grooved Walnut Bench Tool-Rack holding 14 graduated steel burins, scrapers, burnishers & drypoint needles (`x = 918..1246`)!
        const tbBack = new PathBatcher();
        const tbFront = new PathBatcher();
        tbBack.quad("tRackSh", [924, 1342], [1248, 1328], [1262, 1492], [936, 1506], { fill: PAL.cut, fillOpacity: 0.24 });
        tbBack.quad("tRack", [916, 1334], [1240, 1320], [1252, 1482], [928, 1496], { fill: PAL.bark, fillOpacity: 0.99 });
        tbBack.quad("tRackGroove", [924, 1346], [1232, 1332], [1240, 1424], [932, 1438], { fill: PAL.umberDk, fillOpacity: 0.94 });
        tbFront.quad("tRackRim", [916, 1334], [1240, 1320], [1252, 1482], [928, 1496], { stroke: PAL.ink, strokeWidth: 0.78, strokeOpacity: 0.88, nonScaling: "contour" });
        for (let k = 0; k < 14; k++) {
          const u = (k + 0.5) / 14;
          const bx = 934 + u * 294;
          const by = 1352 - u * 12;
          const hCol = k % 3 === 0 ? PAL.ochre : k % 3 === 1 ? PAL.cinnabarDk : PAL.barkDk;
          const hD = ellipsePath(bx, by + 94, 7.6, 13);
          tbBack.addPath(`h-${k % 3}`, hD, { fill: hCol, fillOpacity: 0.98 });
          tbFront.addPath("hRim", hD, { stroke: PAL.ink, strokeWidth: 0.5, strokeOpacity: 0.84, nonScaling: "contour" });
          tbFront.rect("ferrule", bx - 3.2, by + 74, 6.4, 8, { fill: PAL.brassLt, fillOpacity: 0.96 });
          tbFront.line("shaft", bx, by + 74, bx, by + (k % 3) * 8, { stroke: PAL.slateLt, strokeWidth: 1.3, strokeOpacity: 0.95, nonScaling: "contour" });
          tbFront.line("shaftDk", bx + 0.8, by + 74, bx + 0.8, by + (k % 3) * 8, { stroke: PAL.ink, strokeWidth: 0.45, strokeOpacity: 0.78, nonScaling: "contour" });
        }
        tbBack.flush(p);
        tbFront.flush(p);

        // Proofing Rubber Brayer resting above the burin rack (`x = 955..1140, y = 1200..1305`)
        p.fillPath(polyPath([[965, 1204], [1132, 1188], [1138, 1238], [971, 1254]]), PAL.slateDk, 0.96);
        p.fillPath(polyPath([[968, 1209], [1129, 1194], [1131, 1208], [970, 1223]]), PAL.slateLt, 0.36);
        p.burinContour(polyPath([[965, 1204], [1132, 1188], [1138, 1238], [971, 1254]]), PAL.ink, 0.8, 0.9, 4);
        p.burinContour(`M968 1228L1052 1268L1135 1212`, PAL.brassLt, 1.35, 0.9, 2);
        const bGrip: Pt[] = [[1046, 1264], [1062, 1262], [1072, 1324], [1052, 1326]];
        p.fillPath(polyPath(bGrip), PAL.ochre, 0.96);
        p.burinContour(polyPath(bGrip), PAL.ink, 0.78, 0.88, 4);

        // Articulated Brass Engraver's Bench Magnifying Loupe Stand (`x = 1285..1445`) peering over the copperplate!
        p.fillPath(ellipsePath(1328, 1446, 36, 12), PAL.slateDk, 0.98);
        p.calligraphicStroke([[1328, 1440], [1306, 1344], [1364, 1296]], 6.2, 5.2, 4.6, PAL.brass, 0.96);
        p.fillPath(circlePath(1306, 1344, 7.5), PAL.brassLt, 0.98);
        p.fillPath(ellipsePath(1426, 1284, 58, 36), PAL.glass, 0.48);
        p.fillPath(ellipsePath(1426, 1284, 65, 42) + ellipsePath(1426, 1284, 56, 34), PAL.brass, 0.96, true);
        p.burinContour(ellipsePath(1426, 1284, 65, 42) + ellipsePath(1426, 1284, 56, 34), PAL.ink, 0.78, 0.88, 2);
        p.burin(`M1388 1272Q1414 1258 1446 1266`, PAL.inkRim, 0.72, 0.62, 1, "hatch");

        // Richly Incised Architectural Master Etching Copperplate on Bench (`x = 1492..1932, y = 1216..1458`)!
        const plate2: Pt[] = [[1512, 1220], [1912, 1234], [1938, 1448], [1488, 1434]];
        p.fillPath(polyPath(plate2.map(([x, y]): Pt => [x + 8, y + 10])), PAL.cut, 0.28);
        p.fillPath(polyPath(plate2), copperGrad, 0.98);
        p.burinHatch(plate2, rad(-28), 11, linearTone(plate2[0], plate2[2], 0.12, 0.56), { color: PAL.cinnabarDk, opacity: 0.34, widths: [0.3, 0.5, 0.72] });
        const inner2 = plate2.map((pt) => lerp(pt, [1713, 1334], 0.12));
        p.burinContour(polyPath(plate2), PAL.ink, 0.92, 0.9, 4);
        p.burinContour(polyPath(inner2), PAL.ochreLt, 0.72, 0.8, 4);
        // Intricate silver-etched classical dome, colonnade & celestial compass incision across the master plate!
        const ep = new PathBatcher();
        ep.addPath(
          "dome",
          `M1664 1344V1302Q1714 1252 1764 1302V1344ZM1630 1344H1798M1618 1384H1812` +
            circlePath(1572, 1288, 22) +
            circlePath(1852, 1296, 22) +
            `M1572 1262V1314M1546 1288H1598M1852 1270V1322M1826 1296H1878`,
          { stroke: PAL.ochreLt, strokeWidth: 0.48, strokeOpacity: 0.82, nonScaling: "hatch" },
        );
        for (let c = 0; c <= 12; c++) {
          const cx = 1624 + c * 15;
          ep.line("col", cx, 1344, cx, 1384, { stroke: PAL.ochreLt, strokeWidth: 0.42, strokeOpacity: 0.76, nonScaling: "hatch" });
        }
        for (let r = 0; r < 5; r++) {
          const ry = 1392 + r * 7.5;
          ep.line("refl", 1568 + (r % 2) * 18, ry, 1858 - (r % 2) * 16, ry, { stroke: PAL.ink, strokeWidth: 0.36, strokeOpacity: 0.65, nonScaling: "hatch" });
        }
        ep.flush(p);

        // Far-Right Bench (`x = 1972..2375`): 3 Ruled 3D Cylindrical Etching Ink Tins + Glazed Crock + Folded Tarlatan Gauze Cloth!
        const rtBack = new PathBatcher();
        const rtFront = new PathBatcher();
        for (const [tx, ty, tw, th, col] of [
          [2022, 1388, 56, 74, PAL.prussian],
          [2092, 1418, 54, 70, PAL.cinnabar],
          [2164, 1394, 58, 76, PAL.umberDk],
        ] as const) {
          rtBack.addPath("tinSh", ellipsePath(tx + 4, ty + 4, tw * 0.52, 10), { fill: PAL.cut, fillOpacity: 0.28 });
          rtBack.rect(`tin-${col}`, tx - tw * 0.5, ty - th, tw, th, { fill: col, fillOpacity: 0.96 });
          rtBack.addPath(`tinB-${col}`, ellipsePath(tx, ty, tw * 0.5, 9), { fill: col, fillOpacity: 0.96 });
          rtFront.rect("tinShad", tx + tw * 0.14, ty - th, tw * 0.36, th, { fill: PAL.cut, fillOpacity: 0.22 });
          rtFront.addPath("tinLid", ellipsePath(tx, ty - th, tw * 0.5, 9.5), { fill: PAL.slateLt, fillOpacity: 0.96 });
          rtFront.addPath("tinLip", ellipsePath(tx, ty - th, tw * 0.38, 6.2), { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.72, nonScaling: "hatch" });
          rtFront.rect("tinLab", tx - tw * 0.44, ty - th * 0.66, tw * 0.88, th * 0.36, { fill: PAL.petal, fillOpacity: 0.95 });
          rtFront.line("tinRule", tx - tw * 0.3, ty - th * 0.52, tx + tw * 0.3, ty - th * 0.52, { stroke: PAL.inkMid, strokeWidth: 0.42, strokeOpacity: 0.78, nonScaling: "hatch" });
          rtFront.line("tinRule", tx - tw * 0.22, ty - th * 0.42, tx + tw * 0.22, ty - th * 0.42, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.62, nonScaling: "hatch" });
          rtFront.addPath("tinRim", `M${f(tx - tw * 0.5)} ${f(ty - th)}V${f(ty)}A${f(tw * 0.5)} 9 0 0 0 ${f(tx + tw * 0.5)} ${f(ty)}V${f(ty - th)}` + ellipsePath(tx, ty - th, tw * 0.5, 9.5), { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.88, nonScaling: "contour" });
        }
        // Folded cross-hatched tarlatan copperplate wiping cloth beside the ink tins (`x = 2216..2370`)!
        const cloth: Pt[] = [[2224, 1344], [2368, 1332], [2384, 1446], [2216, 1456]];
        rtBack.quad("clSh", [2230, 1352], [2374, 1340], [2390, 1454], [2222, 1464], { fill: PAL.cut, fillOpacity: 0.24 });
        rtBack.addPath("clFill", closedSmooth(cloth), { fill: PAL.petal, fillOpacity: 0.94 });
        rtFront.addPath("clStain", ellipsePath(2292, 1396, 38, 22), { fill: PAL.prussian, fillOpacity: 0.34 });
        for (let g = 0; g < 9; g++) {
          const u = (g + 0.5) / 9;
          const a = lerp(cloth[0], cloth[3], u);
          const b = lerp(cloth[1], cloth[2], u);
          const c = lerp(cloth[0], cloth[1], u);
          const d = lerp(cloth[3], cloth[2], u);
          rtFront.line("clMesh", a[0], a[1], b[0], b[1], { stroke: PAL.inkMid, strokeWidth: 0.32, strokeOpacity: 0.44, nonScaling: "hatch" });
          rtFront.line("clMesh", c[0], c[1], d[0], d[1], { stroke: PAL.inkMid, strokeWidth: 0.32, strokeOpacity: 0.44, nonScaling: "hatch" });
        }
        rtFront.addPath("clRim", closedSmooth(cloth), { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.82, nonScaling: "contour" });
        rtBack.flush(p);
        rtFront.flush(p);
      }

      // 6. Twin Swaying Brass Atelier Work Lamps with Smooth Radial-Gradient Nocturnal Pools!
      for (const [lx, ly, pool, ph] of [
        [422, 325, topLampPoolL, 0.4],
        [1855, 335, topLampPoolR, 2.5],
      ] as const) {
        p.layer("var(--z-halo-op)", () => {
          p.animGroup({ kind: "pulse", baseOp: 0.88, ampOp: 0.12, freq: 2.1, phase: ph }, () => {
            p.fillPath(circlePath(lx, ly + 40, 290), pool, 1);
          });
        });
        p.animGroup({ kind: "sway", cx: lx, cy: ly - 155, ampDeg: 1.9, freq: 1.0, phase: ph }, () => {
          p.burinContour(`M${lx} ${ly - 155}V${ly - 14}`, PAL.ink, 1.0, 0.85, 1);
          const body: Pt[] = [[lx - 30, ly + 12], [lx + 30, ly + 12], [lx + 20, ly + 78], [lx - 20, ly + 78]];
          const cap: Pt[] = [[lx, ly - 18], [lx + 14, ly - 2], [lx + 38, ly + 12], [lx - 38, ly + 12], [lx - 14, ly - 2]];
          p.fillPath(polyPath(body), PAL.lantern, 0.94);
          p.fillPath(ellipsePath(lx, ly + 46, 15, 22), PAL.lanternCore, 0.88);
          p.fillPath(polyPath(cap), PAL.slateDk, 0.98);
          p.fillPath(polyPath([[lx - 18, ly + 78], [lx + 18, ly + 78], [lx, ly + 92]]), PAL.slateDk, 0.98);
          p.burinContour(polyPath(body) + polyPath(cap) + `M${lx - 10} ${ly + 12}L${lx - 7} ${ly + 78}M${lx + 10} ${ly + 12}L${lx + 7} ${ly + 78}`, PAL.ink, 0.85, 0.9, 6);
        });
      }
    },
    false,
    "press-clip",
  );

  // 7. Sleek `10px` Burnished Copperplate Bevel + Embossed Rag Plate-Mark (`0px` bezel crop on day-o17.png!)
  const plateMark: Pt[] = [[hx0 - 18, hy0 - 16], [hx1 + 18, hy0 - 16], [hx1 + 18, hy1 + 16], [hx0 - 18, hy1 + 16]];
  const plateOuter: Pt[] = [[hx0 - 10, hy0 - 9], [hx1 + 10, hy0 - 9], [hx1 + 10, hy1 + 9], [hx0 - 10, hy1 + 9]];
  const plateBevel: Pt[] = [[hx0 - 3.5, hy0 - 3.5], [hx1 + 3.5, hy0 - 3.5], [hx1 + 3.5, hy1 + 3.5], [hx0 - 3.5, hy1 + 3.5]];
  // Delicate embossed plate-mark pressed into damp rag sheet surrounding the copperplate
  p.fillPath(polyPath(plateMark) + polyPath(plateOuter), PAL.paperShadow, 0.3, true);
  p.burin(polyPath(plateMark), PAL.inkMid, 0.44, 0.65, 4, "hatch");
  // Sleek 10px burnished metallic copperplate edge with fine 0.35px burin cross-hatching
  p.fillPath(polyPath(plateOuter) + polyPath(hole), PAL.copper, 0.99, true);
  p.fillPath(polyPath(plateBevel) + polyPath(hole), PAL.ochreLt, 0.42, true);

  p.clippedToBackdrop(
    hole,
    () => {
      p.burinHatch(plateOuter, rad(-34), 5.5, linearTone([hx0 - 10, hy0 - 9], [hx1 + 10, hy1 + 9], 0.12, 0.62), {
        color: PAL.cinnabarDk,
        opacity: 0.44,
        widths: [0.28, 0.42, 0.6],
      });
    },
    false,
    "copper-bezel-clip",
  );
  let miters = "";
  for (let i = 0; i < 4; i++) miters += `M${f(hole[i][0])} ${f(hole[i][1])}L${f(plateOuter[i][0])} ${f(plateOuter[i][1])}`;
  p.burin(miters, PAL.cinnabarDk, 0.5, 0.72, 4, "contour");
  p.burinContour(polyPath(plateOuter), PAL.ink, 0.82, 0.9, 4);
  p.burinContour(`M${f(plateOuter[3][0])} ${f(plateOuter[3][1])}L${f(plateOuter[0][0])} ${f(plateOuter[0][1])}L${f(plateOuter[1][0])} ${f(plateOuter[1][1])}`, PAL.ochreLt, 0.76, 0.82, 2);
  p.burinContour(polyPath(hole), PAL.ink, 0.95, 0.95, 4);
  p.flush();

  return {
    index: 16,
    id: "s16-printshop",
    title: "Intaglio Press & Copperplate",
    subtitle: "64+ curved pigment bottles, 16 swaying engraved proofs, star-wheel press & burnished plate",
    portal: S16_PORTAL,
    coreColorDay: [224, 216, 202],
    coreColorNight: [18, 24, 41],
    defs: p.defs.join(""),
    markup: p.out.join(""),
    hole,
    stats: { elements: p.elements, strokes: p.strokes, animGroups: p.animGroups },
  };
}
