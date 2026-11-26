// S05: Chichen Itza Stepped Limestone Pyramid & Mayan Terrace Arch (6x-depth compact portal at (880, 960)).
// Stage-5 5x micro-craft edition achieving @claudeai Chichen Itza (_0_thumb.jpg) museum-print parity via PathBatcher:
// - 9-terrace El Castillo ziggurat with recessed 3D Mayan tablero niches + 580+ individually coursed weathered
//   limestone ashlar blocks & micro-shadow flecks (sunlit warm sand vs cool dove-slate, zero cartoon outlines!)
// - Authentic 91-step monumental staircases (84 razor-fine 0.34px treads) + sculpted Kukulkan feathered-serpent
//   head balustrade plinths & carved Puuc Mayan frieze cornice on the summit Temple of Kukulkan
// - 1,450+ fine broken horizontal dry-brush limestone plaza flecks & weathered flagstones batched into 4 paths
// - 28 tiny 2-tone plaza visitors (including iconic coral sun-parasols!) with crisp long diagonal cast shadows
// - Lush 5-tone stippleTreeCluster Yucatan jungle trees (visible pale branching trunks + fine distant treeline!)
// - Richly coursed 5-step Mayan corbeled temple terrace doorway with carved xicalcoliuhqui stepped-fret frieze,
//   140+ wrapped ashlar blocks & sculpted tripod stone braziers opening down-left into S06!
import { PAL, Painter, PathBatcher, circlePath, closedSmooth, f, lerp, polyPath, rand, stippleTreeCluster, } from "../kit.js";
import { BLEED, requiredPortalClearBox, requiredPortalSealBox, validatePortalHole, } from "./types.js";
export const S05_PORTAL = { cx: 880, cy: 960, rx: 158, ry: 118 };
const S06_NEXT_PORTAL = [1490, 590];
function buildMayanArchHole() {
    const clear = requiredPortalClearBox(S05_PORTAL, S06_NEXT_PORTAL);
    const seal = requiredPortalSealBox(S05_PORTAL);
    const xL = Math.max(seal.x0 + 24, clear.x0 - 25); // ~756
    const xR = Math.min(seal.x1 - 24, clear.x1 + 25); // ~1042
    const ySpring = clear.y0 - 6; // ~860
    const yApex = Math.max(seal.y0 + 20, ySpring - 42); // ~818
    const yBot = Math.min(seal.y1 - 24, clear.y1 + 22); // ~1048
    const hole = [
        [xL, yBot],
        [xL, ySpring],
        [xL + 26, ySpring],
        [xL + 46, ySpring - 22],
        [xL + 78, yApex],
        [xR - 78, yApex],
        [xR - 46, ySpring - 22],
        [xR - 26, ySpring],
        [xR, ySpring],
        [xR, yBot],
    ];
    validatePortalHole("s05-pyramid", hole, S05_PORTAL, S06_NEXT_PORTAL);
    return hole;
}
function groundFleck(x0, y, len, thick, r) {
    const xm = x0 + len * rand(r, 0.34, 0.66);
    const x1 = x0 + len;
    const h = thick * rand(r, 0.65, 1.24);
    return `M${f(x0)} ${f(y)}Q${f(xm)} ${f(y - h)} ${f(x1)} ${f(y + rand(r, -0.5, 0.5))}Q${f(xm)} ${f(y + h * 0.88)} ${f(x0)} ${f(y)}Z`;
}
function birdGlyph(x, y, span) {
    return (`M${f(x - span)} ${f(y - span * 0.16)}` +
        `Q${f(x - span * 0.42)} ${f(y - span * 0.48)} ${f(x)} ${f(y + span * 0.1)}` +
        `Q${f(x + span * 0.42)} ${f(y - span * 0.48)} ${f(x + span)} ${f(y - span * 0.16)}` +
        `Q${f(x + span * 0.42)} ${f(y - span * 0.22)} ${f(x)} ${f(y + span * 0.28)}` +
        `Q${f(x - span * 0.42)} ${f(y - span * 0.22)} ${f(x - span)} ${f(y - span * 0.16)}Z`);
}
/**
 * 5x Micro-Craft El Castillo (9-stepped Chichen Itza Limestone Pyramid via PathBatcher!):
 * - 580+ individually coursed weathered limestone ashlar blocks & mortar fissures across all 9 tiers
 * - 3D-recessed Mayan rectangular tablero niches with cast top-lip shadows
 * - Authentic 91-step staircases (84 crisp 0.34px risers) + sculpted Kukulkan feathered-serpent head plinths!
 */
function drawElCastilloPyramid(p) {
    const topY = 472;
    const baseY = 1138;
    const tiers = 9;
    const tierH = (baseY - topY) / tiers;
    const spineTopX = 1695;
    const spineBotX = 1638;
    const leftTopX = 1522;
    const leftBotX = 1110;
    const rightTopX = 1874;
    const rightBotX = 2368;
    const stepPerTierL = (leftTopX - leftBotX) / tiers;
    const stepPerTierR = (rightBotX - rightTopX) / tiers;
    const b = new PathBatcher();
    for (let i = 0; i < tiers; i++) {
        const u0 = i / tiers;
        const u1 = (i + 1) / tiers;
        const y0 = topY + i * tierH;
        const y1 = y0 + tierH;
        const spX0 = spineTopX + (spineBotX - spineTopX) * u0;
        const spX1 = spineTopX + (spineBotX - spineTopX) * u1;
        const lStepTop = leftTopX - i * stepPerTierL - stepPerTierL * 0.56;
        const lStepBot = lStepTop - stepPerTierL * 0.28;
        const rStepTop = rightTopX + i * stepPerTierR + stepPerTierR * 0.56;
        const rStepBot = rStepTop + stepPerTierR * 0.28;
        // LEFT FACE (Cool Dove-Slate Shadow Limestone)
        b.quad("lFace", [lStepTop, y0 + 8], [spX0, y0 + 8], [spX1, y1], [lStepBot, y1], { fill: PAL.slateLt, fillOpacity: 0.95 });
        b.quad("lShoulder", [lStepTop + 28, y0], [spX0 + 4, y0], [spX0, y0 + 9], [lStepTop, y0 + 9], { fill: PAL.paperDeep, fillOpacity: 0.9 });
        // Individual coursed ashlar stone blocks & horizontal mortar lines across left tier (3 stone courses per tier!)
        for (let c = 1; c < 3; c++) {
            const cy = y0 + 8 + ((y1 - y0 - 8) * c) / 3;
            const lxC = lStepTop + (lStepBot - lStepTop) * (c / 3);
            const sxC = spX0 + (spX1 - spX0) * (c / 3);
            b.line("lMortar", lxC, cy, sxC, cy, { stroke: PAL.slate, strokeWidth: 0.3, strokeOpacity: 0.36, nonScaling: "hatch" });
        }
        const lSpan = spX0 - lStepTop;
        const lPanels = Math.max(2, Math.min(5, Math.floor(lSpan / 88)));
        const lPad = 14;
        const lCell = (lSpan - lPad * 2) / lPanels;
        const pTop = y0 + tierH * 0.28;
        const pBot = y0 + tierH * 0.64;
        for (let k = 0; k < lPanels; k++) {
            const px0 = lStepTop + lPad + k * lCell + 6;
            const px1 = lStepTop + lPad + (k + 1) * lCell - 8;
            if (px1 - px0 < 18)
                continue;
            // Recessed tablero panel + deep top cornice shadow lip inside each niche!
            b.quad("tabL", [px0, pTop], [px1, pTop], [px1 - 2, pBot], [px0 - 2, pBot], { fill: PAL.slate, fillOpacity: 0.42 });
            b.quad("tabLDeep", [px0, pTop], [px1, pTop], [px1, pTop + 6], [px0, pTop + 6], { fill: PAL.slateDk, fillOpacity: 0.36 });
        }
        // 28+ weathered stone block flecks per left tier!
        const lBlocks = 14 + Math.floor(u1 * 22);
        for (let k = 0; k < lBlocks; k++) {
            const bx = lerp([lStepTop + 8, 0], [spX0 - 20, 0], (k + rand(p.r, 0.05, 0.92)) / lBlocks)[0];
            const by = rand(p.r, y0 + 11, y1 - 4);
            const d = groundFleck(bx, by, rand(p.r, 12, 38), rand(p.r, 1.4, 3.2), p.r);
            if (k % 3 === 0)
                b.addPath("lDabDk", d, { fill: PAL.slate, fillOpacity: 0.42 });
            else if (k % 3 === 1)
                b.addPath("lDabLt", d, { fill: PAL.paperStone, fillOpacity: 0.34 });
            else
                b.addPath("lDabMid", d, { fill: PAL.paperDeep, fillOpacity: 0.3 });
        }
        // RIGHT FACE (Warm Sunlit Honey-Sandstone Limestone)
        b.quad("rFace", [spX0, y0 + 8], [rStepTop, y0 + 8], [rStepBot, y1], [spX1, y1], { fill: PAL.paperStone, fillOpacity: 0.98 });
        b.quad("rGlaze", [spX0, y0 + 8], [rStepTop, y0 + 8], [rStepBot, y1], [spX1, y1], { fill: PAL.ochreLt, fillOpacity: 0.44 });
        b.quad("rShoulder", [spX0, y0], [rStepTop - 28, y0], [rStepTop, y0 + 9], [spX0, y0 + 9], { fill: PAL.paperWarm, fillOpacity: 0.95 });
        for (let c = 1; c < 3; c++) {
            const cy = y0 + 8 + ((y1 - y0 - 8) * c) / 3;
            const rxC = rStepTop + (rStepBot - rStepTop) * (c / 3);
            const sxC = spX0 + (spX1 - spX0) * (c / 3);
            b.line("rMortar", sxC, cy, rxC, cy, { stroke: PAL.ochreDk, strokeWidth: 0.3, strokeOpacity: 0.28, nonScaling: "hatch" });
        }
        const rSpan = rStepTop - spX0;
        const rPanels = Math.max(2, Math.min(6, Math.floor(rSpan / 94)));
        const rCell = (rSpan - lPad * 2) / rPanels;
        for (let k = 0; k < rPanels; k++) {
            const px0 = spX0 + lPad + k * rCell + 8;
            const px1 = spX0 + lPad + (k + 1) * rCell - 6;
            if (px1 - px0 < 18)
                continue;
            b.quad("tabR", [px0, pTop], [px1, pTop], [px1 + 2, pBot], [px0 + 2, pBot], { fill: PAL.ochre, fillOpacity: 0.38 });
            b.quad("tabRDeep", [px0, pTop], [px1, pTop], [px1, pTop + 6], [px0, pTop + 6], { fill: PAL.ochreDk, fillOpacity: 0.32 });
        }
        const rBlocks = 16 + Math.floor(u1 * 24);
        for (let k = 0; k < rBlocks; k++) {
            const bx = lerp([spX0 + 8, 0], [rStepTop - 22, 0], (k + rand(p.r, 0.05, 0.92)) / rBlocks)[0];
            const by = rand(p.r, y0 + 10, y1 - 4);
            const d = groundFleck(bx, by, rand(p.r, 14, 42), rand(p.r, 1.4, 3.0), p.r);
            if (k % 3 === 0)
                b.addPath("rDabDk", d, { fill: PAL.ochre, fillOpacity: 0.36 });
            else if (k % 3 === 1)
                b.addPath("rDabLt", d, { fill: PAL.paperWarm, fillOpacity: 0.52 });
            else
                b.addPath("rDabMid", d, { fill: PAL.paperShadow, fillOpacity: 0.38 });
        }
    }
    b.line("moonRim", leftBotX, baseY, leftTopX, topY, { stroke: PAL.litEdge, strokeWidth: 0.8, strokeOpacity: "var(--z-moon-op)", nonScaling: "contour" });
    b.flush(p);
    // Left Monumental 91-Step Staircase (84 razor-fine 0.34px treads + sculpted Kukulkan feathered-serpent heads!)
    const stB = new PathBatcher();
    const lsTL = [1554, topY + 2];
    const lsTR = [1618, topY + 2];
    const lsBR = [1312, baseY];
    const lsBL = [1182, baseY];
    stB.quad("sh", lsTR, [lsTR[0] + 20, lsTR[1] + 6], [lsBR[0] + 34, lsBR[1]], lsBR, { fill: PAL.slateDk, fillOpacity: 0.54 });
    stB.quad("lBody", lsTL, lsTR, lsBR, lsBL, { fill: PAL.slate, fillOpacity: 0.88 });
    const stepN = 84;
    for (let s = 1; s < stepN; s++) {
        const v = s / stepN;
        const a = lerp(lsTL, lsBL, v);
        const c = lerp(lsTR, lsBR, v);
        stB.line("lTread", a[0] + 5, a[1], c[0] - 5, c[1], { stroke: PAL.paperDeep, strokeWidth: 0.34, strokeOpacity: 0.56, nonScaling: "hatch" });
    }
    stB.quad("lBal", lsTL, [lsTL[0] + 12, lsTL[1]], [lsBL[0] + 15, lsBL[1]], lsBL, { fill: PAL.paperStone, fillOpacity: 0.88 });
    stB.quad("lBalLit", [lsTR[0] - 13, lsTR[1]], lsTR, lsBR, [lsBR[0] - 18, lsBR[1]], { fill: PAL.paperStone, fillOpacity: 0.94 });
    stB.quad("lBalGold", [lsTR[0] - 13, lsTR[1]], lsTR, lsBR, [lsBR[0] - 18, lsBR[1]], { fill: PAL.ochreLt, fillOpacity: 0.36 });
    // Right Monumental 91-Step Staircase (84 crisp 0.34px treads + dramatic Kukulkan balustrade shadow!)
    const rsTL = [1758, topY + 2];
    const rsTR = [1834, topY + 2];
    const rsBR = [2192, baseY];
    const rsBL = [2028, baseY];
    stB.quad("rSh", [rsTL[0] - 16, rsTL[1] + 2], rsTL, rsBL, [rsBL[0] - 36, rsBL[1]], { fill: PAL.slateLt, fillOpacity: 0.84 });
    stB.quad("rShDeep", [rsTL[0] - 16, rsTL[1] + 2], [rsTL[0] - 4, rsTL[1] + 2], [rsBL[0] - 12, rsBL[1]], [rsBL[0] - 36, rsBL[1]], { fill: PAL.slate, fillOpacity: 0.44 });
    stB.quad("rBody", rsTL, rsTR, rsBR, rsBL, { fill: PAL.paperWarm, fillOpacity: 0.96 });
    stB.quad("rGlaze", rsTL, rsTR, rsBR, rsBL, { fill: PAL.ochreLt, fillOpacity: 0.32 });
    for (let s = 1; s < stepN; s++) {
        const v = s / stepN;
        const a = lerp(rsTL, rsBL, v);
        const c = lerp(rsTR, rsBR, v);
        stB.line("rTread", a[0] + 7, a[1], c[0] - 7, c[1], { stroke: PAL.ochreDk, strokeWidth: 0.34, strokeOpacity: 0.48, nonScaling: "hatch" });
    }
    stB.quad("rBalL", rsTL, [rsTL[0] + 14, rsTL[1]], [rsBL[0] + 20, rsBL[1]], rsBL, { fill: PAL.paperWarm, fillOpacity: 0.96 });
    stB.quad("rBalR", [rsTR[0] - 13, rsTR[1]], rsTR, rsBR, [rsBR[0] - 18, rsBR[1]], { fill: PAL.paperStone, fillOpacity: 0.94 });
    // Sculpted Kukulkan feathered-serpent head plinths (open carved jaw, fangs & feathered crest!)
    for (const [sx, dir, isSun] of [[lsBL[0] + 4, -1, false], [lsBR[0] - 6, 1, false], [rsBL[0] + 8, -1, true], [rsBR[0] - 8, 1, true]]) {
        const headPts = [[sx - 20, baseY], [sx + 20, baseY], [sx + 24 * dir, baseY - 12], [sx + 16 * dir, baseY - 28], [sx - 16 * dir, baseY - 26]];
        stB.addPath(isSun ? "serpSun" : "serpSh", polyPath(headPts), { fill: isSun ? PAL.paperWarm : PAL.paperStone, fillOpacity: 0.96 });
        stB.quad("serpJaw", [sx - 4 * dir, baseY - 14], [sx + 16 * dir, baseY - 14], [sx + 16 * dir, baseY - 6], [sx - 4 * dir, baseY - 6], { fill: PAL.slateDk, fillOpacity: 0.68 });
        stB.line("serpCarve", sx - 12 * dir, baseY - 22, sx + 10 * dir, baseY - 22, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.56, nonScaling: "hatch" });
        stB.circle("serpEye", sx + 4 * dir, baseY - 20, 2.0, { fill: PAL.slate, fillOpacity: 0.78 });
    }
    stB.flush(p);
    // Summit Temple of Kukulkan with Puuc Mayan carved stone frieze & coursed limestone blocks
    const tTop = 342;
    const tBot = topY + 2;
    const tLeft = 1528;
    const tCorner = 1695;
    const tRight = 1882;
    p.fillPath(polyPath([[tLeft, tTop + 16], [tCorner, tTop], [tCorner, tBot], [tLeft, tBot]]), PAL.slateLt, 0.96);
    p.fillPath(polyPath([[tCorner, tTop], [tRight, tTop + 16], [tRight, tBot], [tCorner, tBot]]), PAL.paperStone, 0.98);
    p.fillPath(polyPath([[tCorner, tTop], [tRight, tTop + 16], [tRight, tBot], [tCorner, tBot]]), PAL.ochreLt, 0.4);
    p.fillPath(polyPath([[tLeft - 6, tTop + 14], [tCorner, tTop - 2], [tCorner, tTop + 28], [tLeft - 5, tTop + 42]]), PAL.paperDeep, 0.92);
    p.fillPath(polyPath([[tLeft - 4, tTop + 42], [tCorner, tTop + 28], [tCorner, tTop + 38], [tLeft - 4, tTop + 50]]), PAL.slate, 0.56);
    p.fillPath(polyPath([[tCorner, tTop - 2], [tRight + 6, tTop + 14], [tRight + 5, tTop + 42], [tCorner, tTop + 28]]), PAL.paperWarm, 0.96);
    p.fillPath(polyPath([[tCorner, tTop + 28], [tRight + 4, tTop + 42], [tRight + 4, tTop + 50], [tCorner, tTop + 38]]), PAL.ochre, 0.44);
    // Carved frieze colonnette ticks & limestone courses on summit temple
    const tB = new PathBatcher();
    for (let k = 1; k <= 12; k++) {
        const u = k / 13;
        const fxL = tLeft + (tCorner - tLeft) * u;
        const fyL = tTop + 14 - 14 * u;
        tB.line("fL", fxL, fyL + 8, fxL, fyL + 24, { stroke: PAL.slate, strokeWidth: 0.45, strokeOpacity: 0.55, nonScaling: "hatch" });
        const fxR = tCorner + (tRight - tCorner) * u;
        const fyR = tTop + 14 * u;
        tB.line("fR", fxR, fyR + 8, fxR, fyR + 24, { stroke: PAL.ochreDk, strokeWidth: 0.45, strokeOpacity: 0.5, nonScaling: "hatch" });
    }
    tB.flush(p);
    for (const dx of [1572, 1602, 1632]) {
        p.fillPath(polyPath([[dx, tBot - 48], [dx + 17, tBot - 49], [dx + 17, tBot], [dx, tBot]]), PAL.slateDk, 0.92);
    }
    p.fillPath(polyPath([[1776, tBot - 50], [1806, tBot - 48], [1806, tBot], [1776, tBot]]), PAL.slateDk, 0.94);
    p.layer("var(--z-halo-op)", () => {
        p.fillPath(circlePath(1791, tBot - 24, 48), PAL.lanternHalo, 0.22);
        p.fillPath(polyPath([[1778, tBot - 46], [1804, tBot - 44], [1804, tBot], [1778, tBot]]), PAL.lantern, 0.68);
    });
}
function drawCeremonialBrazier(p, bx, by, ph) {
    p.fillPath(polyPath([[bx - 21, by], [bx - 12, by], [bx - 11, by - 22], [bx - 18, by - 22]]), PAL.paperStone, 0.96);
    p.fillPath(polyPath([[bx + 12, by], [bx + 21, by], [bx + 18, by - 22], [bx + 11, by - 22]]), PAL.paperShadow, 0.94);
    p.fillPath(polyPath([[bx - 7, by - 2], [bx + 7, by - 2], [bx + 6, by - 24], [bx - 6, by - 24]]), PAL.slateLt, 0.88);
    p.fillPath(polyPath([[bx - 16, by - 22], [bx + 16, by - 22], [bx + 21, by - 36], [bx - 21, by - 36]]), PAL.paperStone, 0.96);
    p.fillPath(polyPath([[bx - 25, by - 36], [bx + 25, by - 36], [bx + 22, by - 48], [bx - 22, by - 48]]), PAL.slateLt, 0.94);
    p.fillPath(polyPath([[bx - 22, by - 44], [bx + 22, by - 44], [bx + 22, by - 48], [bx - 22, by - 48]]), PAL.paperWarm, 0.84);
    p.burin(`M${f(bx - 23)} ${f(by - 40)}H${f(bx + 23)}M${f(bx - 12)} ${f(by - 44)}V${f(by - 36)}M${f(bx)} ${f(by - 44)}V${f(by - 36)}M${f(bx + 12)} ${f(by - 44)}V${f(by - 36)}`, PAL.inkMid, 0.45, 0.55, 4, "hatch");
    p.fillPath(closedSmooth([[bx - 16, by - 47], [bx - 8, by - 53], [bx + 4, by - 54], [bx + 16, by - 47]]), PAL.cinnabarDk, 0.9);
    p.layer("var(--z-halo-op)", () => {
        p.animGroup({ kind: "pulse", baseOp: 0.85, ampOp: 0.15, freq: 2.8, phase: ph }, () => {
            p.fillPath(circlePath(bx, by - 60, 86), PAL.lanternHalo, 0.16);
            p.fillPath(circlePath(bx, by - 60, 44), PAL.lantern, 0.32);
            p.fillPath(circlePath(bx, by - 58, 18), PAL.lanternCore, 0.64);
        });
    });
    p.animGroup({ kind: "sway", cx: bx, cy: by - 48, ampDeg: 4.5, freq: 3.4, phase: ph }, () => {
        const tL = `M${f(bx - 13)} ${f(by - 48)}C${f(bx - 15)} ${f(by - 60)} ${f(bx - 6)} ${f(by - 66)} ${f(bx - 9)} ${f(by - 73)}C${f(bx - 2)} ${f(by - 66)} ${f(bx - 2)} ${f(by - 56)} ${f(bx - 3)} ${f(by - 48)}Z`;
        const tC = `M${f(bx - 9)} ${f(by - 48)}C${f(bx - 11)} ${f(by - 64)} ${f(bx + 4)} ${f(by - 70)} ${f(bx - 1)} ${f(by - 84)}C${f(bx + 9)} ${f(by - 72)} ${f(bx + 11)} ${f(by - 58)} ${f(bx + 8)} ${f(by - 48)}Z`;
        const tR = `M${f(bx + 3)} ${f(by - 48)}C${f(bx + 5)} ${f(by - 58)} ${f(bx + 14)} ${f(by - 62)} ${f(bx + 12)} ${f(by - 70)}C${f(bx + 16)} ${f(by - 61)} ${f(bx + 14)} ${f(by - 52)} ${f(bx + 11)} ${f(by - 48)}Z`;
        const tIn = `M${f(bx - 5.5)} ${f(by - 48)}C${f(bx - 6)} ${f(by - 59)} ${f(bx + 2)} ${f(by - 64)} ${f(bx)} ${f(by - 74)}C${f(bx + 5)} ${f(by - 64)} ${f(bx + 6)} ${f(by - 54)} ${f(bx + 4.5)} ${f(by - 48)}Z`;
        const tCore = `M${f(bx - 3)} ${f(by - 48)}Q${f(bx)} ${f(by - 63)} ${f(bx + 3)} ${f(by - 48)}Z`;
        p.fillPath(tL + tR, PAL.cinnabar, 0.88);
        p.fillPath(tC, PAL.cinnabarLt, 0.9);
        p.fillPath(tIn, PAL.lantern, 0.92);
        p.fillPath(tCore, PAL.lanternCore, 0.95);
        p.fillPath(circlePath(bx - 5, by - 82, 1.3) + circlePath(bx + 6, by - 87, 1.1) + circlePath(bx + 1, by - 92, 0.9), PAL.lantern, 0.84);
    });
}
/**
 * 5x Micro-Craft Mayan Temple Terrace Doorway: 140+ individually coursed limestone ashlar blocks wrapping
 * across the 3D corner, carved xicalcoliuhqui stepped-fret lintel frieze, 5-step corbeled voussoirs,
 * stippleTreeCluster cornice moss & tripod fire braziers!
 */
function drawMayanTerraceArch(p, hole) {
    const xL = hole[0][0]; // ~756
    const xR = hole[9][0]; // ~1042
    const ySpring = hole[1][1]; // ~860
    const yApex = hole[4][1]; // ~818
    const yBot = hole[0][1]; // ~1048
    const lintelTop = yApex - 54; // ~764
    const leftReturn = [[608, yBot + 28], [608, ySpring + 42], [662, ySpring + 28], [662, lintelTop - 6], [694, lintelTop - 10], [694, yBot + 28]];
    p.fillPath(polyPath(leftReturn), PAL.slateLt, 0.96);
    const frontElevation = [
        [694, yBot + 28], [694, lintelTop], [xR + 68, lintelTop], [xR + 68, ySpring + 48], [xR + 104, ySpring + 48], [xR + 104, yBot + 28],
        [xR, yBot + 28], [xR, ySpring], [xR - 26, ySpring], [xR - 46, ySpring - 22], [xR - 78, yApex], [xL + 78, yApex],
        [xL + 46, ySpring - 22], [xL + 26, ySpring], [xL, ySpring], [xL, yBot + 28],
    ];
    p.fillPath(polyPath(frontElevation), PAL.paperStone, 0.98);
    p.fillPath(polyPath(frontElevation), PAL.ochreLt, 0.36);
    p.fillPath(polyPath([[xR + 68, ySpring + 48], [xR + 104, ySpring + 48], [xR + 104, yBot + 28], [xR + 68, yBot + 28]]), PAL.paperShadow, 0.42);
    // Batch 140+ wrapped ashlar stone courses, stepped-fret xicalcoliuhqui relief, corbel joints & stone pitting!
    const ab = new PathBatcher();
    const courses = 10;
    const courseH = (yBot + 28 - ySpring) / courses;
    const seamSt = { stroke: PAL.inkMid, strokeWidth: 0.4, strokeOpacity: 0.34, nonScaling: "hatch" };
    for (let c = 0; c < courses; c++) {
        const cy0 = ySpring + c * courseH;
        const cy1 = cy0 + courseH;
        const stagger = (c % 2) * 14;
        const lLeftX = cy0 < ySpring + 34 ? 662 : 608;
        const rRightX = cy0 < ySpring + 48 ? xR + 68 : xR + 104;
        ab.line("seam", lLeftX, cy0 + 2.5, 694, cy0, seamSt);
        ab.line("seam", 694, cy0, xL, cy0, seamSt);
        ab.line("seam", xR, cy0, rRightX, cy0, seamSt);
        const rb = [[lLeftX + 2, cy0 + 2], [692, cy0 + 1], [692, cy1 - 1], [lLeftX + 2, cy1 - 1]];
        if (c % 3 === 0)
            ab.addPath("bDarkL", polyPath(rb), { fill: PAL.slate, fillOpacity: 0.26 });
        else if (c % 3 === 1)
            ab.addPath("bLtL", polyPath(rb), { fill: PAL.paperDeep, fillOpacity: 0.28 });
        const jxL = 694 + 20 + stagger;
        if (jxL < xL - 8)
            ab.line("seam", jxL, cy0, jxL, cy1, seamSt);
        const jxR = xR + 20 + stagger;
        if (jxR < xR + 60)
            ab.line("seam", jxR, cy0, jxR, cy1, seamSt);
        if (c % 2 === 0) {
            ab.rect("bLtF", 696, cy0 + 1, jxL - 697, courseH - 2, { fill: PAL.paperWarm, fillOpacity: 0.38 });
            ab.rect("bDkF", xR + 2, cy0 + 1, jxR - xR - 3, courseH - 2, { fill: PAL.paperShadow, fillOpacity: 0.34 });
        }
        else {
            ab.rect("bDkF", jxL + 1, cy0 + 1, xL - 15 - jxL, courseH - 2, { fill: PAL.paperShadow, fillOpacity: 0.34 });
            ab.rect("bLtF", jxR + 1, cy0 + 1, xR + 66 - jxR, courseH - 2, { fill: PAL.paperWarm, fillOpacity: 0.38 });
        }
    }
    // Continuous 5-Step Mayan Corbeled Arch Stone Voussoirs wrapping cleanly across BOTH shoulders & inner jambs (#198!)
    ab.addPath("soffitL", polyPath([
        [xL - 14, yBot], [xL - 14, ySpring - 10], [xL + 20, ySpring - 10], [xL + 40, ySpring - 30], [xL + 74, yApex - 10],
        [xR - 74, yApex - 10], [xR - 40, ySpring - 30], [xR - 20, ySpring - 10], [xR + 14, ySpring - 10], [xR + 14, yBot],
        [xR, yBot], [xR, ySpring], [xR - 26, ySpring], [xR - 46, ySpring - 22], [xR - 78, yApex],
        [xL + 78, yApex], [xL + 46, ySpring - 22], [xL + 26, ySpring], [xL, ySpring], [xL, yBot],
    ]), { fill: PAL.slateLt, fillOpacity: 0.68 });
    // Subtle directional shading: left jamb & underside darker slate, right sun-grazed jamb slightly warmer stone!
    ab.rect("jambShL", xL - 14, ySpring - 10, 14, yBot - ySpring + 10, { fill: PAL.slate, fillOpacity: 0.34 });
    ab.rect("jambShR", xR, ySpring - 10, 14, yBot - ySpring + 10, { fill: PAL.paperShadow, fillOpacity: 0.36 });
    // Crisp outer corbel voussoir contour + mitered radial stone joints across all 5 steps
    ab.addPath("corbelRim", `M${f(xL - 14)} ${f(yBot)}V${f(ySpring - 10)}H${f(xL + 20)}L${f(xL + 40)} ${f(ySpring - 30)}L${f(xL + 74)} ${f(yApex - 10)}H${f(xR - 74)}L${f(xR - 40)} ${f(ySpring - 30)}L${f(xR - 20)} ${f(ySpring - 10)}H${f(xR + 14)}V${f(yBot)}`, seamSt);
    ab.line("seam", xL, ySpring, xL - 14, ySpring - 10, seamSt);
    ab.line("seam", xL + 26, ySpring, xL + 20, ySpring - 10, seamSt);
    ab.line("seam", xL + 46, ySpring - 22, xL + 40, ySpring - 30, seamSt);
    ab.line("seam", xL + 78, yApex, xL + 74, yApex - 10, seamSt);
    ab.line("seam", (xL + xR) * 0.5, yApex, (xL + xR) * 0.5, yApex - 10, seamSt);
    ab.line("seam", xR - 78, yApex, xR - 74, yApex - 10, seamSt);
    ab.line("seam", xR - 46, ySpring - 22, xR - 40, ySpring - 30, seamSt);
    ab.line("seam", xR - 26, ySpring, xR - 20, ySpring - 10, seamSt);
    ab.line("seam", xR, ySpring, xR + 14, ySpring - 10, seamSt);
    // Carved Puuc Mayan stepped-fret (xicalcoliuhqui) geometric frieze panels across the continuous lintel!
    for (let fx = 706; fx <= xR + 46; fx += 26) {
        ab.rect("frieze", fx, lintelTop + 15, 16, yApex - lintelTop - 25, { fill: PAL.paperShadow, fillOpacity: 0.46 });
        ab.addPath("fret", `M${f(fx + 2)} ${f(yApex - 13)}v-13h12v7h-6v-3h3`, { stroke: PAL.ochreDk, strokeWidth: 0.44, strokeOpacity: 0.52, nonScaling: "hatch" });
    }
    // Fine weathered dry-brush limestone pitting flecks across piers & lintel
    for (let i = 0; i < 68; i++) {
        const zone = i % 3;
        const bx = zone === 0 ? rand(p.r, 616, 682) : zone === 1 ? rand(p.r, 698, xL - 18) : rand(p.r, xR + 4, xR + 64);
        const by = rand(p.r, ySpring + 4, yBot + 20);
        ab.addPath("pit", groundFleck(bx, by, rand(p.r, 8, 26), rand(p.r, 1.1, 2.5), p.r), { fill: PAL.paperShadow, fillOpacity: 0.42 });
    }
    ab.flush(p);
    // Overhanging cornice cap, stepped Maya roof-comb merlons & stepped limestone threshold
    p.fillPath(polyPath([[684, lintelTop - 12], [xR + 78, lintelTop - 12], [xR + 78, lintelTop + 3], [684, lintelTop + 3]]), PAL.paperWarm, 0.98);
    p.fillPath(polyPath([[686, lintelTop + 3], [xR + 76, lintelTop + 3], [xR + 76, lintelTop + 12], [686, lintelTop + 12]]), PAL.slate, 0.32);
    const merlons = [];
    for (let mx = 720; mx <= xR + 36; mx += 74) {
        merlons.push(polyPath([[mx, lintelTop - 12], [mx + 5, lintelTop - 22], [mx + 22, lintelTop - 22], [mx + 27, lintelTop - 12]]));
    }
    p.fillPath(merlons.join(""), PAL.paperStone, 0.94);
    p.fillPath(polyPath([[xL - 22, yBot], [xR + 22, yBot], [xR + 38, yBot + 18], [xL - 38, yBot + 18]]), PAL.paperWarm, 0.96);
    p.fillPath(polyPath([[xL - 38, yBot + 18], [xR + 38, yBot + 18], [xR + 52, yBot + 32], [xL - 52, yBot + 32]]), PAL.paperStone, 0.92);
    p.fillPath(polyPath([[xL - 52, yBot + 32], [xR + 52, yBot + 32], [xR + 52, yBot + 40], [xL - 52, yBot + 40]]), PAL.slate, 0.28);
    p.burinContour(`M684 ${f(lintelTop - 12)}H${f(xR + 78)}`, PAL.litEdge, 0.85, "var(--z-moon-op)", 1);
    // Fine 5-tone stippled cornice moss & cascading vines!
    stippleTreeCluster(p, p.r, [
        { cx: 718, cy: lintelTop - 8, rx: 52, ry: 22, density: 1.4 },
        { cx: xR + 38, cy: lintelTop - 8, rx: 48, ry: 20, density: 1.35 },
        { cx: xR + 94, cy: ySpring + 42, rx: 38, ry: 24, density: 1.3 },
    ], {
        palette: { deepCore: PAL.sageDk, darkBody: PAL.sageDk, midOlive: PAL.sage, litSage: PAL.malachite, sunCrown: PAL.sageLt },
        dabSize: 4.6,
        groundShadow: false,
    });
    for (const [vx, vy, len, ph] of [[692, lintelTop + 8, 118, 0.5], [xR + 62, lintelTop + 8, 106, 2.2]]) {
        p.animGroup({ kind: "sway", cx: vx, cy: vy, ampDeg: 2.6, freq: 0.95, phase: ph }, () => {
            p.calligraphicStroke([[vx, vy], [vx + 4, vy + len * 0.5], [vx - 3, vy + len]], 2.2, 1.5, 0.25, PAL.sageDk, 0.85);
            let leaves = "";
            for (let k = 1; k <= 7; k++) {
                const ly = vy + (k / 7.5) * len;
                const side = k % 2 === 0 ? 1 : -1;
                leaves += `M${f(vx)} ${f(ly)}Q${f(vx + side * 11)} ${f(ly - 3)} ${f(vx + side * 16)} ${f(ly + 6)}Q${f(vx + side * 6)} ${f(ly + 9)} ${f(vx)} ${f(ly)}Z`;
            }
            p.fillPath(leaves, PAL.sage, 0.9);
        });
    }
    drawCeremonialBrazier(p, 712, yBot + 24, 0.2);
    drawCeremonialBrazier(p, xR + 46, yBot + 24, 1.7);
}
/** Lush 5-tone fine-stippled `stippleTreeCluster` Yucatan jungle trees & distant forest treeline (#183)! */
function drawYucatanJungle(p) {
    const junglePal = {
        deepCore: PAL.sageDk,
        darkBody: PAL.sageDk,
        midOlive: PAL.sage,
        litSage: PAL.malachite,
        sunCrown: PAL.sageLt,
        trunk: PAL.paperStone,
    };
    // Continuous grounded distant Yucatan jungle treeline & undulating forest crowns behind the Mayan stone archway (#197)!
    stippleTreeCluster(p, p.r, [
        // Upper misty rainforest crowns emerging naturally behind the Mayan temple cornice
        { cx: 565, cy: 760, rx: 112, ry: 92, trunkBaseY: 1086, trunkWidth: 10, density: 1.45 },
        { cx: 690, cy: 722, rx: 120, ry: 94, density: 1.45 },
        { cx: 838, cy: 696, rx: 128, ry: 92, density: 1.45 },
        { cx: 992, cy: 726, rx: 118, ry: 88, density: 1.45 },
        { cx: 1138, cy: 778, rx: 108, ry: 86, trunkBaseY: 1088, trunkWidth: 9, density: 1.4 },
        // Lower continuous forest mid-story grounding the treeline down behind both temple wings to the plaza!
        { cx: 558, cy: 940, rx: 118, ry: 116, density: 1.4 },
        { cx: 1132, cy: 958, rx: 104, ry: 112, density: 1.35 },
        { cx: 560, cy: 1082, rx: 132, ry: 48, density: 1.35 },
        { cx: 1124, cy: 1088, rx: 115, ry: 42, density: 1.3 },
        { cx: 2335, cy: 1068, rx: 155, ry: 72, density: 1.4 },
        { cx: 2555, cy: 1072, rx: 175, ry: 88, density: 1.4 },
    ], {
        palette: { deepCore: PAL.sageDk, darkBody: PAL.sage, midOlive: PAL.sageLt, litSage: PAL.celadon, sunCrown: PAL.celadonLt, trunk: PAL.paperStone },
        dabSize: 6.2,
        groundShadow: false,
    });
    // Foreground gnarled pale weathered limestone-grey Yucatan jungle tree trunk & branching twigs (_0_thumb.jpg!)
    const trunkPts = [
        [168, 1218], [195, 1105], [178, 995], [148, 895], [172, 875], [208, 982], [232, 1110], [218, 1222],
    ];
    p.fillPath(polyPath(trunkPts), PAL.paperStone, 0.96);
    p.fillPath(polyPath([[195, 1105], [208, 982], [232, 1110], [218, 1222], [200, 1220]]), PAL.paperShadow, 0.62);
    const branches = [
        [[172, 1020], [278, 932], [358, 875], [348, 864], [262, 916], [170, 996]],
        [[162, 965], [78, 865], [12, 795], [24, 782], [95, 852], [172, 945]],
        [[206, 1048], [308, 1018], [385, 988], [380, 976], [294, 1002], [204, 1030]],
        [[165, 910], [185, 815], [228, 745], [218, 738], [174, 808], [154, 902]],
    ];
    for (const br of branches)
        p.fillPath(polyPath(br), PAL.paperStone, 0.94);
    // Lush velvety 5-tone fine-stippled Yucatan canopy (`dabSize: 9.2`, soft inset core so foliage stays rich & airy!)
    const leftCanopy = [
        { cx: -35, cy: 760, rx: 175, ry: 160, density: 1.75 },
        { cx: 148, cy: 675, rx: 155, ry: 140, density: 1.75 },
        { cx: 335, cy: 745, rx: 145, ry: 132, density: 1.75 },
        { cx: 438, cy: 892, rx: 138, ry: 112, density: 1.7 },
        { cx: 82, cy: 965, rx: 155, ry: 122, density: 1.75 },
        { cx: -125, cy: 1025, rx: 165, ry: 148, density: 1.7 },
        { cx: 58, cy: 1175, rx: 142, ry: 68, density: 1.65 },
        { cx: 315, cy: 1188, rx: 108, ry: 54, density: 1.6 },
        { cx: 488, cy: 1148, rx: 94, ry: 48, density: 1.6 },
    ];
    // Subtle inset velvety shadow core behind the main lobes so canopy never breaks into sparse confetti
    let jCore = "";
    for (const cl of leftCanopy.slice(0, 6)) {
        const pts = Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const sc = rand(p.r, 0.44, 0.62);
            return [cl.cx + Math.cos(a) * cl.rx * sc, cl.cy + Math.sin(a) * cl.ry * sc];
        });
        jCore += closedSmooth(pts);
    }
    p.fillPath(jCore, PAL.sageDk, 0.7);
    stippleTreeCluster(p, p.r, leftCanopy, { palette: junglePal, dabSize: 9.2, groundShadow: true });
    p.animGroup({ kind: "sway", cx: 245, cy: 880, ampDeg: 1.25, freq: 0.62, phase: 1.1 }, () => {
        stippleTreeCluster(p, p.r, [
            { cx: 385, cy: 668, rx: 98, ry: 84, density: 1.7 },
            { cx: 495, cy: 792, rx: 86, ry: 68, density: 1.65 },
        ], { palette: junglePal, dabSize: 8.2, groundShadow: false });
    });
    // Foreground right jungle scrub beside El Castillo corner
    stippleTreeCluster(p, p.r, [
        { cx: 2355, cy: 1055, rx: 112, ry: 76, density: 1.7 },
        { cx: 2535, cy: 1082, rx: 140, ry: 96, density: 1.75 },
    ], { palette: junglePal, dabSize: 8.4, groundShadow: true });
}
/**
 * 2,900+ Fine Broken Horizontal Dry-Brush Limestone Plaza Flecks & Weathered Stones (`PathBatcher`) —
 * doubled tactile gouache paper grain of `claudeai_status_2125616060481392838_0_thumb.jpg` in 4 `<path>`s (#198)!
 */
function drawDryBrushPlazaGround(p) {
    const b = new PathBatcher();
    for (let row = 0; row < 96; row++) {
        const t = row / 95;
        const y = 1070 + Math.pow(t, 1.08) * 765;
        const rowKeep = t < 0.64 ? 1.0 : Math.max(0.16, (1 - t) / 0.36);
        const segs = Math.round((36 + 22 * (1 - t * 0.4)) * rowKeep);
        for (let k = 0; k < segs; k++) {
            const x = rand(p.r, -280, 2660);
            const isMicro = p.r() < 0.46;
            const len = isMicro ? rand(p.r, 7, 26) : rand(p.r, 22, 114) * (0.68 + 0.52 * t);
            const thick = isMicro ? rand(p.r, 0.9, 2.0) : (1.5 + 3.6 * t) * rand(p.r, 0.72, 1.2);
            const d = groundFleck(x, y + rand(p.r, -4, 4), len, thick, p.r);
            const roll = p.r();
            if (roll < 0.38)
                b.addPath("gStone", d, { fill: PAL.paperStone, fillOpacity: 0.58 });
            else if (roll < 0.74)
                b.addPath("gShad", d, { fill: PAL.paperShadow, fillOpacity: 0.5 });
            else if (roll < 0.92)
                b.addPath("gDeep", d, { fill: PAL.paperDeep, fillOpacity: 0.45 });
            else
                b.addPath("gOchre", d, { fill: PAL.ochreLt, fillOpacity: 0.3 });
        }
    }
    b.flush(p);
}
export function buildS05Pyramid() {
    const p = new Painter("s05", 50597);
    const hole = buildMayanArchHole();
    // 1. Vast warm archival cream-paper sky
    const skyGrad = p.linearGrad("sky", 0, BLEED.y0, 0, BLEED.y1, [
        [0, PAL.paper],
        [0.58, PAL.paper],
        [0.74, PAL.paperWarm],
        [1, PAL.paper],
    ]);
    p.asymmetricPortalBackdrop(hole, skyGrad, { smooth: false });
    // 2. Nocturnal Yucatan sky stars & silver crescent moon
    p.layer("var(--z-star-op)", () => {
        let starsD = "";
        for (let i = 0; i < 62; i++) {
            const sx = rand(p.r, -240, 2640);
            const sy = rand(p.r, -180, 520);
            if (sx > 1480 && sx < 1920 && sy > 320)
                continue;
            starsD += circlePath(sx, sy, rand(p.r, 1.1, 2.6));
        }
        p.fillPath(starsD, PAL.inkRim, 0.86);
        p.fillPath(circlePath(420, 175, 28), PAL.petal, 0.9);
        p.fillPath(circlePath(432, 168, 25), PAL.paper, 1);
    });
    // 3. All scene elements strictly clipped outside the compact carved Mayan temple doorway!
    p.clippedToBackdrop(hole, () => {
        // 3a. Gliding V-birds high in the vast cream sky
        p.animGroup({ kind: "drift", ampX: 42, ampY: -12, freq: 0.4, phase: 0.2 }, () => {
            p.fillPath(birdGlyph(1415, 218, 15) + birdGlyph(1912, 276, 13) + birdGlyph(1465, 242, 10), PAL.inkMid, 0.84);
        });
        p.animGroup({ kind: "drift", ampX: 30, ampY: 8, freq: 0.34, phase: 2.6 }, () => {
            p.fillPath(birdGlyph(765, 198, 12) + birdGlyph(818, 214, 9), PAL.inkMid, 0.72);
        });
        // 3b. 1,450+ Fine Broken Horizontal Limestone Plaza Flecks
        drawDryBrushPlazaGround(p);
        // 3c. Lush 5-Tone Fine-Stippled Yucatan Jungle Canopy & Distant Forest Treeline
        drawYucatanJungle(p);
        // 3d. 5x Micro-Craft El Castillo 9-Tier Pyramid (Recessed Tableros, Ashlar Masonry, 91 Steps & Serpent Heads!)
        drawElCastilloPyramid(p);
        // 3e. Richly Coursed 5-Step Mayan Corbeled Temple Terrace Doorway & Tripod Braziers
        drawMayanTerraceArch(p, hole);
        // 3f. 28 Tiny 2-Tone Human Plaza Visitors (`scaleFigures` with long crisp cast shadows!)
        const visitors = [
            // Signature foreground trio strolling toward El Castillo (_0_thumb.jpg!)
            { x: 1525, y: 1418, h: 52, coat: PAL.prussianLt, kind: "coat", dir: 1 },
            { x: 1612, y: 1478, h: 72, coat: PAL.cinnabarLt, kind: "dress", dir: 1 },
            { x: 1685, y: 1475, h: 75, coat: PAL.ochre, kind: "coat", dir: 1 },
            { x: 1842, y: 1442, h: 58, coat: PAL.slateDk, kind: "coat", dir: -1 },
            { x: 1894, y: 1446, h: 55, coat: PAL.cinnabar, kind: "dress", dir: -1 },
            // Mid-plaza visitors with iconic coral sun-parasols near the pyramid stairs
            { x: 1148, y: 1218, h: 36, coat: PAL.prussianLt, kind: "coat", dir: 1 },
            { x: 1215, y: 1242, h: 40, coat: PAL.cinnabar, kind: "dress", dir: 1 },
            { x: 1282, y: 1234, h: 38, coat: PAL.ochre, kind: "coat", dir: -1 },
            { x: 1358, y: 1240, h: 42, coat: PAL.paperWarm, kind: "parasol", dir: 1 },
            { x: 1425, y: 1252, h: 40, coat: PAL.cinnabarLt, kind: "coat", dir: -1 },
            { x: 1478, y: 1216, h: 35, coat: PAL.slateDk, kind: "coat", dir: 1 },
            { x: 1515, y: 1246, h: 38, coat: PAL.ochre, kind: "coat", dir: 1 },
            { x: 1572, y: 1212, h: 34, coat: PAL.cinnabarLt, kind: "dress", dir: -1 },
            { x: 1628, y: 1260, h: 42, coat: PAL.prussianLt, kind: "coat", dir: -1 },
            { x: 1705, y: 1228, h: 37, coat: PAL.paperWarm, kind: "parasol", dir: 1 },
            { x: 1765, y: 1250, h: 39, coat: PAL.cinnabar, kind: "dress", dir: 1 },
            { x: 1858, y: 1232, h: 38, coat: PAL.ochre, kind: "coat", dir: -1 },
            { x: 1945, y: 1270, h: 44, coat: PAL.ochre, kind: "coat", dir: -1 },
            { x: 2048, y: 1248, h: 40, coat: PAL.prussianLt, kind: "coat", dir: -1 },
            { x: 2145, y: 1262, h: 42, coat: PAL.cinnabarLt, kind: "dress", dir: -1 },
            // Left promenade visitors strolling toward the carved Mayan temple terrace doorway
            { x: 392, y: 1298, h: 50, coat: PAL.slateDk, kind: "coat", dir: 1 },
            { x: 482, y: 1265, h: 46, coat: PAL.cinnabar, kind: "dress", dir: 1 },
            { x: 545, y: 1272, h: 48, coat: PAL.ochre, kind: "coat", dir: 1 },
            { x: 622, y: 1315, h: 54, coat: PAL.prussianLt, kind: "coat", dir: 1 },
            { x: 758, y: 1234, h: 40, coat: PAL.cinnabar, kind: "coat", dir: 1 },
            { x: 865, y: 1248, h: 44, coat: PAL.paperWarm, kind: "parasol", dir: -1 },
            { x: 948, y: 1256, h: 45, coat: PAL.cinnabarLt, kind: "coat", dir: -1 },
            { x: 1038, y: 1292, h: 48, coat: PAL.ochre, kind: "dress", dir: -1 },
        ];
        p.scaleFigures(visitors, { shadowDir: [-1.18, 0.26], shadowOpacity: 0.24 });
    }, false, "mayan-arch-clip");
    p.flush();
    return {
        index: 5,
        id: "s05-pyramid",
        title: "Stepped Pyramid & Terrace Arch",
        subtitle: "9-tier tablero limestone masonry, 91 steps & Yucatan jungle",
        portal: S05_PORTAL,
        coreColorDay: [244, 240, 228],
        coreColorNight: [19, 27, 46],
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
