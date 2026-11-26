// Octave s08 (Stage 5 — 5x Micro-Craft): Great Refractor Observatory Dome & Two-Story Gallery Library
// Architectural cathedral interior in footers/worlds/observatory + glasshouse + @kiuzyx density:
// 42+ curved riveted steel dome meridian ribs, 14 concentric purlins & inspection catwalk railings,
// monumental Great Brass Equatorial Refractor with 3D elliptical dew-hood, gleaming convex achromatic
// objective lens, ringed upper finder scope, counterweights, graduated setting circles & 4-gear clock-drive,
// two-story wraparound gallery library with 6 bays of denseBookshelf (350+ micro spines!), helical spiral
// cast-iron staircase, Day-vellum / Night-cyanotype architectural blueprint, barometer & glowing astrolabe
// alcoves, tall swinging-pendulum sidereal clock, warm astronomer's chart tables & 8 scale-figure astronomers,
// framing s09 through the carved limestone Upper Gallery Chart-Room Archway at (860, 550)!
import { LIGHT, PAL, Painter, PathBatcher, TAU, add, archDoorwayHole, circlePath, cylinderTone, denseBookshelf, ellipsePath, f, lerp, linePath, linearTone, mul, norm, polyPath, quad, rad, sample, } from "../kit.js";
import { BLEED, requiredPortalClearBox, requiredPortalSealBox, } from "./types.js";
export const S08_PORTAL = { cx: 860, cy: 550, rx: 172, ry: 142 };
const NEXT_PORTAL = [1520, 950]; // s09-orrery
/** Framed observatory section blueprint: warm vellum by Day -> luminous silver-slate cyanotype by Night! */
function drawObservatorySectionFrame(p, x, y, w, h) {
    p.fillPath(polyPath([[x + 5, y + 7], [x + w + 5, y + 7], [x + w + 5, y + h + 7], [x + 5, y + h + 7]]), PAL.ink, 0.26);
    p.fillPath(`M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`, PAL.umber, 0.98);
    const ix = x + 10;
    const iy = y + 10;
    const iw = w - 20;
    const ih = h - 20;
    p.fillPath(`M${f(ix)} ${f(iy)}H${f(ix + iw)}V${f(iy + ih)}H${f(ix)}Z`, PAL.paper, 0.99);
    const b = new PathBatcher();
    for (let gx = ix + 18; gx < ix + iw; gx += 18)
        b.line("g", gx, iy, gx, iy + ih, { stroke: PAL.inkDraft, strokeWidth: 0.26, strokeOpacity: 0.24, nonScaling: "hatch" });
    for (let gy = iy + 18; gy < iy + ih; gy += 18)
        b.line("g", ix, gy, ix + iw, gy, { stroke: PAL.inkDraft, strokeWidth: 0.26, strokeOpacity: 0.24, nonScaling: "hatch" });
    const dCx = ix + iw * 0.56;
    const dCy = iy + ih * 0.56;
    const dR = Math.min(iw, ih) * 0.34;
    let secD = `M${f(dCx - dR)} ${f(dCy)}A${f(dR)} ${f(dR)} 0 0 1 ${f(dCx + dR)} ${f(dCy)}`;
    secD += `M${f(dCx - dR * 0.9)} ${f(dCy)}A${f(dR * 0.9)} ${f(dR * 0.9)} 0 0 1 ${f(dCx + dR * 0.9)} ${f(dCy)}`;
    secD += `M${f(dCx - dR)} ${f(dCy)}V${f(iy + ih - 16)}H${f(dCx + dR)}V${f(dCy)}`;
    secD += `M${f(dCx - 13)} ${f(dCy + 12)}H${f(dCx + 13)}V${f(iy + ih - 16)}H${f(dCx - 13)}Z`;
    secD += `M${f(dCx - dR * 1.1)} ${f(dCy)}H${f(dCx + dR * 1.1)}M${f(dCx)} ${f(dCy - dR * 1.12)}V${f(iy + ih - 10)}`;
    secD += `M${f(dCx + 26)} ${f(dCy + 10)}L${f(dCx - 46)} ${f(dCy - 58)}`;
    const pCx = ix + iw * 0.18;
    const pCy = iy + ih * 0.48;
    secD += circlePath(pCx, pCy, 22) + circlePath(pCx, pCy, 16) + `M${f(pCx - 28)} ${f(pCy)}H${f(pCx + 28)}`;
    b.addPath("sec", secD, { stroke: PAL.inkDraft, strokeWidth: 0.62, strokeOpacity: 0.9, nonScaling: "contour" });
    b.addPath("frm", `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.85, nonScaling: "contour" });
    b.flush(p);
}
/** Tall glass-fronted Sidereal Regulator Clock with swinging brass pendulum & rotating 24h dial hand. */
function drawSiderealClock(p, cx, topY, w, h) {
    const x0 = cx - w * 0.5;
    const botY = topY + h;
    p.fillPath(polyPath([[x0 + 6, topY + 8], [x0 + w + 6, topY + 8], [x0 + w + 6, botY], [x0 + 6, botY]]), PAL.ink, 0.28);
    p.doubleGlaze([[x0, topY], [x0 + w, topY], [x0 + w, botY], [x0, botY]], PAL.umber, PAL.umberDk, { smooth: false, thinPx: 0.48, thickPx: 0.88 });
    p.fillPath(polyPath([[x0 - 8, topY], [cx, topY - 22], [x0 + w + 8, topY]]), PAL.umberDk, 0.98);
    const gx0 = x0 + 13;
    const gw = w - 26;
    const gy0 = topY + 84;
    const gh = h - 106;
    p.fillPath(`M${f(gx0)} ${f(gy0)}H${f(gx0 + gw)}V${f(gy0 + gh)}H${f(gx0)}Z`, PAL.prussianDk, 0.94);
    p.animGroup({ kind: "sway", cx, cy: gy0 + 10, ampDeg: 4.4, freq: 2.1, phase: 0.4 }, () => {
        p.burinContour(`M${f(cx - 2.5)} ${f(gy0 + 10)}V${f(gy0 + gh - 38)}M${f(cx + 2.5)} ${f(gy0 + 10)}V${f(gy0 + gh - 38)}`, PAL.brassLt, 0.6, 0.88, 2);
        p.fillPath(circlePath(cx, gy0 + gh - 30, 16), PAL.brass, 0.98);
        p.fillPath(circlePath(cx - 4, gy0 + gh - 33, 6), PAL.brassLt, 0.74);
        p.burinContour(circlePath(cx, gy0 + gh - 30, 16), PAL.ink, 0.56, 0.85, 1);
    });
    const dCy = topY + 44;
    const dR = w * 0.34;
    p.fillPath(circlePath(cx, dCy, dR + 4.5), PAL.brass, 0.98);
    p.fillPath(circlePath(cx, dCy, dR), PAL.paper, 0.99);
    p.fillPath(circlePath(cx, dCy, dR * 0.92), PAL.lanternCore, "var(--z-halo-op)");
    let ticks = "";
    for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU;
        const r0 = i % 2 === 0 ? dR * 0.72 : dR * 0.82;
        ticks += `M${f(cx + Math.cos(a) * r0)} ${f(dCy + Math.sin(a) * r0)}L${f(cx + Math.cos(a) * (dR - 1.5))} ${f(dCy + Math.sin(a) * (dR - 1.5))}`;
    }
    p.burin(ticks, PAL.ink, 0.46, 0.84, 24, "hatch");
    p.animGroup({ kind: "rotate", cx, cy: dCy, speedDeg: 24, phase: 35 }, () => {
        p.burinContour(`M${f(cx)} ${f(dCy + 6)}V${f(dCy - dR * 0.78)}`, PAL.ink, 0.88, 0.92, 1);
    });
    p.burinContour(`M${f(gx0)} ${f(gy0)}H${f(gx0 + gw)}V${f(gy0 + gh)}H${f(gx0)}Z` + circlePath(cx, dCy, dR + 4.5), PAL.ink, 0.68, 0.84, 2);
}
/** Draws an ornate Victorian helical spiral cast-iron staircase linking the main floor to the upper gallery! */
function drawSpiralIronStair(p, cx, topY, botY, radius) {
    const b = new PathBatcher();
    // Cast ground shadow
    p.fillPath(ellipsePath(cx + 16, botY + 8, radius * 1.15, 22), PAL.ink, 0.28);
    const steps = 18;
    const railPts = [];
    // Rear spiral steps (behind central iron column)
    for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const y = topY + (botY - topY) * u;
        const ang = -0.3 + u * TAU * 1.25;
        const sx = cx + Math.cos(ang) * radius;
        const isFront = Math.sin(ang) >= 0;
        const key = isFront ? "treadF" : "treadB";
        const col = isFront ? PAL.slateDk : PAL.slate;
        const sx0 = cx;
        const xL = Math.min(sx0, sx);
        const xR = Math.max(sx0, sx);
        b.rect(key, xL, y, Math.max(12, xR - xL), 8, { fill: col, fillOpacity: 0.96 });
        // Delicate iron baluster post rising from step outer tip to curving handrail
        b.line(isFront ? "balF" : "balB", sx, y, sx, y - 56, { stroke: PAL.ink, strokeWidth: 0.52, strokeOpacity: 0.82, nonScaling: "contour" });
        railPts.push([sx, y - 56]);
    }
    // Central fluted cast-iron column post + brass finial ball
    b.rect("col", cx - 9, topY - 48, 18, botY - topY + 52, { fill: PAL.slateDk, fillOpacity: 0.99 });
    b.line("colHi", cx - 5, topY - 46, cx - 5, botY + 2, { stroke: PAL.litEdge, strokeWidth: 0.65, strokeOpacity: 0.72, nonScaling: "contour" });
    b.circle("finial", cx, topY - 54, 10, { fill: PAL.brass, fillOpacity: 0.98 });
    // Sweeping helical wrought-iron handrail curve
    b.addPath("rail", linePath(railPts), { stroke: PAL.brass, strokeWidth: 1.35, strokeOpacity: 0.92, nonScaling: "contour" });
    b.flush(p);
}
/** Draws a rolling brass library ladder leaning against a dense bookcase. */
function drawBrassLibraryLadder(p, x, topY, botY) {
    const b = new PathBatcher();
    b.line("rail", x - 18, topY, x - 34, botY, { stroke: PAL.brassDk, strokeWidth: 1.5, strokeOpacity: 0.94, nonScaling: "contour" });
    b.line("rail", x + 18, topY, x + 2, botY, { stroke: PAL.brassDk, strokeWidth: 1.5, strokeOpacity: 0.94, nonScaling: "contour" });
    const rungs = 11;
    for (let i = 1; i < rungs; i++) {
        const u = i / rungs;
        const ry = topY + (botY - topY) * u;
        const rxL = lerp([x - 18, 0], [x - 34, 0], u)[0];
        const rxR = lerp([x + 18, 0], [x + 2, 0], u)[0];
        b.line("rung", rxL, ry, rxR, ry, { stroke: PAL.brass, strokeWidth: 0.95, strokeOpacity: 0.9, nonScaling: "contour" });
    }
    b.flush(p);
}
export function buildS08Observatory() {
    const p = new Painter("s08", 811);
    const clearBox = requiredPortalClearBox(S08_PORTAL, NEXT_PORTAL);
    const sealBox = requiredPortalSealBox(S08_PORTAL);
    // Carved Stone Upper-Gallery Archway opening directly into s09 the Astronomer's Chart Study!
    const hole = archDoorwayHole(clearBox, {
        padL: 54,
        padR: 54,
        padTop: 22,
        padBot: 46,
        archRise: 76,
        pointed: false,
        sealBox,
    });
    const archL = clearBox.x0 - 54; // ~709
    const archR = clearBox.x1 + 54; // ~1053
    const archBot = clearBox.y1 + 46; // ~686
    // Gradients
    const domeGrad = p.linearGrad("dome", 80, -180, 2380, 920, [
        [0, PAL.slate],
        [0.34, PAL.paperShadow],
        [0.68, PAL.paperDeep],
        [1, PAL.paperWarm],
    ]);
    const moonShaftGrad = p.linearGrad("moonshaft", 980, -160, 1980, 1280, [
        [0, PAL.inkRim, 0.24],
        [0.52, PAL.celadonLt, 0.08],
        [1, PAL.paper, 0],
    ]);
    const brassTubeGrad = p.linearGrad("tube", 1180, 480, 2060, 1100, [
        [0, PAL.brassLt],
        [0.34, PAL.brass],
        [0.8, PAL.brassDk],
        [1, PAL.umberDk],
    ]);
    const deskHaloGrad = p.radialGrad("deskhalo", 845, 1225, 480, [
        [0, PAL.lanternCore, 0.58],
        [0.44, PAL.lantern, 0.28],
        [1, PAL.lanternHalo, 0],
    ]);
    const archHaloGrad = p.radialGrad("archhalo", 881, 560, 380, [
        [0, PAL.lanternCore, 0.34],
        [0.55, PAL.lantern, 0.14],
        [1, PAL.lanternHalo, 0],
    ]);
    // 1. Opaque full-bleed backdrop cutout
    p.asymmetricPortalBackdrop(hole, domeGrad, { smooth: false });
    p.clippedToBackdrop(hole, () => {
        // 2. Monumental 44-Rib Riveted Hemispherical Iron Observatory Dome Shell (y = -280..910) via PathBatcher!
        const domeB = new PathBatcher();
        const zenith = [1260, -340];
        // 44 Fine Curved Steel Meridian Ribs + Rivet Studs converging smoothly toward the dome oculus!
        for (let i = 0; i <= 42; i++) {
            const bx = -440 + (i / 42) * 3280;
            const ctrl = [lerp([bx, 910], zenith, 0.5)[0] + (bx - 1260) * 0.22, 220];
            const pts = sample(quad([bx, 910], ctrl, zenith), 14);
            const isPrimary = i % 3 === 0;
            domeB.addPath(isPrimary ? "ribMain" : "ribSub", linePath(pts), {
                stroke: isPrimary ? PAL.ink : PAL.inkMid,
                strokeWidth: isPrimary ? 0.78 : 0.38,
                strokeOpacity: isPrimary ? 0.68 : 0.42,
                nonScaling: "hatch",
            });
            if (isPrimary) {
                const pts2 = pts.map(([x, y]) => [x + 11, y]);
                domeB.addPath("ribMain", linePath(pts2), { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.56, nonScaling: "hatch" });
                for (let r = 1; r < pts.length - 1; r++) {
                    domeB.circle("rivet", pts[r][0] + 5.5, pts[r][1], 1.25, { fill: PAL.inkMid, fillOpacity: 0.55 });
                }
            }
        }
        // 14 Concentric Horizontal Curved Riveted Purlin Rings across the hemisphere!
        for (let k = 0; k < 14; k++) {
            const py = 860 - k * 84;
            const sag = (910 - py) * 0.085;
            const isMaj = k % 2 === 0;
            domeB.addPath(isMaj ? "purlinMaj" : "purlinMin", `M${BLEED.x0} ${f(py)}Q1260 ${f(py - sag)} ${BLEED.x1} ${f(py + 12)}`, {
                stroke: isMaj ? PAL.ink : PAL.inkMid,
                strokeWidth: isMaj ? 0.68 : 0.36,
                strokeOpacity: isMaj ? 0.58 : 0.36,
                nonScaling: "hatch",
            });
            if (isMaj) {
                domeB.addPath("purlinMin", `M${BLEED.x0} ${f(py + 7)}Q1260 ${f(py - sag + 7)} ${BLEED.x1} ${f(py + 19)}`, {
                    stroke: PAL.litEdge,
                    strokeWidth: 0.42,
                    strokeOpacity: 0.38,
                    nonScaling: "hatch",
                });
            }
        }
        // 4 Bold Structural Horizontal Riveted Steel Box-Flange Dome Purlin Rings + Engraved Brass Meridian Degree Ticks across upper-right vault!
        for (const py of [150, 320, 495, 675]) {
            const sag = (910 - py) * 0.085;
            const pPts = sample(quad([BLEED.x0, py], [1260, py - sag], [BLEED.x1, py + 12]), 34);
            const pPtsBot = pPts.map(([x, y]) => [x, y + 11]);
            domeB.addPath("flangeFill", linePath(pPts) + `L${f(pPtsBot[pPtsBot.length - 1][0])} ${f(pPtsBot[pPtsBot.length - 1][1])}` + linePath([...pPtsBot].reverse()).replace(/^M/, "L") + "Z", {
                fill: PAL.slate,
                fillOpacity: 0.28,
            });
            domeB.addPath("flangeEdge", linePath(pPts) + linePath(pPtsBot), {
                stroke: PAL.ink,
                strokeWidth: 0.78,
                strokeOpacity: 0.68,
                nonScaling: "contour",
            });
            for (let t = 1; t < pPts.length - 1; t++) {
                const [tx, ty] = pPts[t];
                domeB.circle("rivet", tx, ty + 5.5, 1.35, { fill: PAL.ink, fillOpacity: 0.64 });
                // Fine brass meridian degree ticks across upper-right dome vault (x = 1120..2400)
                if (tx >= 1120 && tx <= 2400) {
                    domeB.line("degTick", tx, ty - 6, tx, ty, { stroke: PAL.brass, strokeWidth: 0.58, strokeOpacity: 0.72, nonScaling: "hatch" });
                    if (t % 2 === 0) {
                        domeB.line("degTick", tx + 18, ty - 3.5, tx + 18, ty, { stroke: PAL.brassDk, strokeWidth: 0.42, strokeOpacity: 0.58, nonScaling: "hatch" });
                    }
                }
            }
        }
        // Curved Twin Heavy Steel Dome-Shutter Track Box Girders sweeping cleanly from zenith all the way to the ring-beam!
        for (const [bxTop, bxCtrl, bxBot] of [[1350, 1465, 1680], [1610, 1745, 2020]]) {
            const gPts = sample(quad([bxTop, -280], [bxCtrl, 310], [bxBot, 908]), 16);
            const gPts2 = gPts.map(([x, y]) => [x + 18, y]);
            domeB.addPath("shutterGirder", linePath(gPts) + linePath(gPts2), {
                stroke: PAL.ink,
                strokeWidth: 0.92,
                strokeOpacity: 0.72,
                nonScaling: "contour",
            });
            for (let r = 1; r < gPts.length - 1; r++) {
                domeB.line("gBrace", gPts[r][0], gPts[r][1], gPts2[r][0], gPts2[r][1], {
                    stroke: PAL.inkMid,
                    strokeWidth: 0.45,
                    strokeOpacity: 0.56,
                    nonScaling: "hatch",
                });
            }
        }
        domeB.flush(p);
        // 3. Elevated Left Upper-Mezzanine Stone Gallery Wall housing the Chart-Room Archway (x = -380..1125, y = 275..735)!
        const mezB = new PathBatcher();
        const mezTopY = 285;
        const mezFloorY = archBot; // 686
        const mezRightX = 1125;
        // Cast-iron mezzanine cornice & classical limestone drum wall surrounding the Chart-Room Archway + 3D stone corner return pier!
        mezB.rect("mezWall", BLEED.x0, mezTopY, mezRightX - BLEED.x0, mezFloorY - mezTopY + 18, { fill: PAL.paperStone, fillOpacity: 0.99 });
        // 3D Oblique Shaded Stone Corner Return Pier (x = mezRightX .. mezRightX + 34) receding cleanly into the curved dome vault!
        mezB.quad("cornerRet", [mezRightX, mezTopY], [mezRightX + 34, mezTopY + 14], [mezRightX + 34, mezFloorY + 12], [mezRightX, mezFloorY + 18], { fill: PAL.slateLt, fillOpacity: 0.92 });
        mezB.quad("cornerRetShd", [mezRightX, mezTopY], [mezRightX + 34, mezTopY + 14], [mezRightX + 34, mezFloorY + 12], [mezRightX, mezFloorY + 18], { fill: PAL.inkMid, fillOpacity: 0.16 });
        // Staggered dressed ashlar masonry joints + alternating rusticated limestone corner quoins terminating the pier cleanly!
        let mRow = 0;
        for (let y = mezTopY + 26; y < mezFloorY; y += 28) {
            mezB.line("mortar", BLEED.x0, y, mezRightX, y, { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.34, nonScaling: "hatch" });
            mezB.line("mortar", mezRightX, y, mezRightX + 34, y + 12, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.42, nonScaling: "hatch" });
            for (let x = -300 + (mRow % 2) * 38; x < mezRightX - 38; x += 76) {
                mezB.line("mortar", x, y, x, y + 28, { stroke: PAL.inkMid, strokeWidth: 0.32, strokeOpacity: 0.28, nonScaling: "hatch" });
            }
            // Rusticated stone corner quoin blocks along x = mezRightX
            const qw = mRow % 2 === 0 ? 34 : 22;
            mezB.rect("quoin", mezRightX - qw, y - 26, qw, 26, { fill: PAL.paperWarm, fillOpacity: 0.92 });
            mezB.addPath("quoinLn", `M${f(mezRightX - qw)} ${f(y - 26)}H${f(mezRightX)}V${f(y)}H${f(mezRightX - qw)}Z`, {
                stroke: PAL.inkMid,
                strokeWidth: 0.42,
                strokeOpacity: 0.48,
                nonScaling: "hatch",
            });
            mRow++;
        }
        // Crown projecting entablature cornice + dentil frieze moulding + 3D returned side cornice & carved stone finial urn at corner!
        mezB.rect("cornTop", BLEED.x0, mezTopY - 22, mezRightX - BLEED.x0 + 12, 22, { fill: PAL.paperWarm, fillOpacity: 0.99 });
        mezB.quad("cornRet", [mezRightX + 12, mezTopY - 22], [mezRightX + 46, mezTopY - 6], [mezRightX + 46, mezTopY + 14], [mezRightX + 12, mezTopY], {
            fill: PAL.paperDeep,
            fillOpacity: 0.98,
        });
        mezB.rect("cornFace", BLEED.x0, mezTopY, mezRightX - BLEED.x0 + 12, 16, { fill: PAL.paperDeep, fillOpacity: 0.98 });
        // Classical dentil frieze blocks under upper mezzanine cornice
        for (let dx = -340; dx < mezRightX; dx += 20) {
            mezB.rect("dentil", dx, mezTopY + 3, 10, 9, { fill: PAL.paperWarm, fillOpacity: 0.92 });
        }
        // Carved stone balustrade parapet plinth + finial urn crowning the corner return pier
        mezB.rect("cornTop", mezRightX - 24, mezTopY - 34, 44, 12, { fill: PAL.paperWarm, fillOpacity: 0.99 });
        mezB.addPath("urn", `M${f(mezRightX - 10)} ${f(mezTopY - 34)}H${f(mezRightX + 8)}L${f(mezRightX + 5)} ${f(mezTopY - 46)}Q${f(mezRightX + 15)} ${f(mezTopY - 58)} ${f(mezRightX + 12)} ${f(mezTopY - 72)}H${f(mezRightX - 14)}Q${f(mezRightX - 17)} ${f(mezTopY - 58)} ${f(mezRightX - 7)} ${f(mezTopY - 46)}Z`, { fill: PAL.paperStone, fillOpacity: 0.99 });
        mezB.addPath("cornerLn", `M${f(mezRightX)} ${f(mezTopY)}V${f(mezFloorY + 18)}M${f(mezRightX + 34)} ${f(mezTopY + 14)}V${f(mezFloorY + 12)}M${BLEED.x0} ${f(mezTopY - 22)}H${f(mezRightX + 12)}L${f(mezRightX + 46)} ${f(mezTopY - 6)}`, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.82, nonScaling: "contour" });
        // Fluted classical limestone pilasters flanking the Chart-Room Archway!
        for (const px of [archL - 54, archR + 18]) {
            mezB.rect("pil", px, mezTopY + 16, 36, mezFloorY - mezTopY - 16, { fill: PAL.paperWarm, fillOpacity: 0.98 });
            for (let fX = px + 6; fX <= px + 30; fX += 6) {
                mezB.line("flute", fX, mezTopY + 28, fX, mezFloorY - 14, { stroke: PAL.inkMid, strokeWidth: 0.4, strokeOpacity: 0.48, nonScaling: "hatch" });
            }
            mezB.rect("cap", px - 6, mezTopY + 14, 48, 14, { fill: PAL.paper, fillOpacity: 0.99 });
            mezB.rect("cap", px - 5, mezFloorY - 14, 46, 14, { fill: PAL.paperStone, fillOpacity: 0.99 });
        }
        mezB.flush(p);
        // Two Dense Upper-Mezzanine Library Bookcase Bays flanking the left of the Chart-Room Archway (clear of astronomers!)
        denseBookshelf(p, { x: 18, y: 342, w: 248, h: 344 }, { shelves: 4, binders: true });
        denseBookshelf(p, { x: 282, y: 342, w: 244, h: 344 }, { shelves: 4, binders: false });
        // Warm subtle amber glow radiating out from the Chart-Room Archway at Night
        p.layer("var(--z-halo-op)", () => {
            p.fillPath(circlePath(881, 560, 380), archHaloGrad, 0.85);
        });
        // Upper-Mezzanine Cast-Iron Catwalk Walkway, Lacy Railing, Double-Web Pierced Victorian Spandrel Trusses & Fluted Columns grounded on Ring-Beam!
        const catB = new PathBatcher();
        const colTop = mezFloorY + 16;
        const colBot = 903;
        const colXs = [14, 678, 1106];
        // Double-Web Pierced Victorian Cast-Iron Spandrel Arch Trusses spanning BOTH column bays ([14..678] & [678..1106])!
        const addVictorianSpandrelBay = (x0, x1, dropH) => {
            const xm = (x0 + x1) * 0.5;
            const outerPts = sample(quad([x0, colTop + dropH], [xm, colTop + 6], [x1, colTop + dropH]), 22);
            const innerPts = sample(quad([x0, colTop + dropH + 10], [xm, colTop + 15], [x1, colTop + dropH + 10]), 22);
            // Solid double-flange cast-iron arch rib chord
            catB.addPath("trussWeb", linePath(outerPts) + `L${f(innerPts[innerPts.length - 1][0])} ${f(innerPts[innerPts.length - 1][1])}` + linePath([...innerPts].reverse()).replace(/^M/, "L") + "Z", { fill: PAL.slateDk, fillOpacity: 0.96 });
            catB.addPath("trussEdge", linePath(outerPts) + linePath(innerPts), {
                stroke: PAL.ink,
                strokeWidth: 0.72,
                strokeOpacity: 0.88,
                nonScaling: "contour",
            });
            catB.addPath("trussHi", linePath(outerPts.map(([x, y]) => [x, y + 2])), {
                stroke: PAL.litEdge,
                strokeWidth: 0.45,
                strokeOpacity: 0.55,
                nonScaling: "hatch",
            });
            // Riveted diagonal lattice web struts & graduated pierced circular cast-iron spandrel rings filling the haunches!
            for (let i = 1; i < outerPts.length - 1; i++) {
                const [px, py] = outerPts[i];
                const gap = py - colTop;
                if (gap > 11) {
                    catB.line("trussStrut", px, colTop + 2, px, py, { stroke: PAL.slateDk, strokeWidth: 0.88, strokeOpacity: 0.88, nonScaling: "contour" });
                    if (i % 2 === 1 && gap > 18) {
                        const rRing = Math.min(14, (gap - 6) * 0.42);
                        catB.circle("spandIron", px, colTop + gap * 0.5, rRing, { stroke: PAL.slateDk, strokeWidth: 1.2, strokeOpacity: 0.92, nonScaling: "contour" });
                        catB.circle("spandRing", px, colTop + gap * 0.5, rRing * 0.66, { stroke: PAL.brass, strokeWidth: 0.65, strokeOpacity: 0.84, nonScaling: "contour" });
                    }
                }
                // Tiny rivet studs along curved double-web flange
                if (i % 2 === 0) {
                    catB.circle("trussRiv", px, py + 5, 1.25, { fill: PAL.brassLt, fillOpacity: 0.72 });
                }
            }
        };
        addVictorianSpandrelBay(23, 669, 68);
        addVictorianSpandrelBay(687, 1097, 66);
        for (const cx of colXs) {
            // Column shaft + sunlit flute edge + molded capital & bolted plinth resting firmly on ring-beam
            catB.rect("colShaft", cx - 9, colTop + 12, 18, colBot - colTop - 24, { fill: PAL.slateDk, fillOpacity: 0.99 });
            catB.line("colHi", cx - 4.5, colTop + 14, cx - 4.5, colBot - 14, { stroke: PAL.litEdge, strokeWidth: 0.65, strokeOpacity: 0.68, nonScaling: "contour" });
            catB.line("colFlute", cx + 2, colTop + 14, cx + 2, colBot - 14, { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.72, nonScaling: "hatch" });
            catB.rect("colCap", cx - 16, colTop, 32, 12, { fill: PAL.slate, fillOpacity: 0.99 });
            catB.rect("colBase", cx - 17, colBot - 12, 34, 12, { fill: PAL.slate, fillOpacity: 0.99 });
            catB.addPath("colLn", `M${f(cx - 9)} ${f(colTop + 12)}V${f(colBot - 12)}M${f(cx + 9)} ${f(colTop + 12)}V${f(colBot - 12)}`, {
                stroke: PAL.ink,
                strokeWidth: 0.68,
                strokeOpacity: 0.85,
                nonScaling: "contour",
            });
        }
        catB.rect("deck", BLEED.x0, mezFloorY, mezRightX - BLEED.x0 + 48, 16, { fill: PAL.slateDk, fillOpacity: 0.99 });
        catB.line("deckHi", BLEED.x0, mezFloorY + 3, mezRightX + 46, mezFloorY + 3, { stroke: PAL.litEdge, strokeWidth: 0.55, strokeOpacity: 0.55, nonScaling: "contour" });
        catB.line("topRail", BLEED.x0, mezFloorY - 62, archL - 16, mezFloorY - 62, { stroke: PAL.brass, strokeWidth: 1.15, strokeOpacity: 0.9, nonScaling: "contour" });
        catB.line("topRail", archR + 16, mezFloorY - 62, mezRightX + 46, mezFloorY - 62, { stroke: PAL.brass, strokeWidth: 1.15, strokeOpacity: 0.9, nonScaling: "contour" });
        catB.line("midRail", BLEED.x0, mezFloorY - 30, archL - 16, mezFloorY - 30, { stroke: PAL.ink, strokeWidth: 0.55, strokeOpacity: 0.8, nonScaling: "contour" });
        catB.line("midRail", archR + 16, mezFloorY - 30, mezRightX + 46, mezFloorY - 30, { stroke: PAL.ink, strokeWidth: 0.55, strokeOpacity: 0.8, nonScaling: "contour" });
        for (let x = -340; x <= mezRightX + 42; x += 18) {
            if (x > archL - 14 && x < archR + 14)
                continue;
            catB.line("bal", x, mezFloorY - 62, x, mezFloorY, { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.8, nonScaling: "hatch" });
        }
        catB.flush(p);
        // 2 Tiny Astronomers conversing cleanly on the Upper-Mezzanine Gallery between Bookcase 2 & the Chart-Room Archway!
        p.scaleFigures([
            { x: 568, y: mezFloorY, h: 62, coat: PAL.cinnabar, kind: "coat", dir: 1 },
            { x: 622, y: mezFloorY, h: 58, coat: PAL.ochre, kind: "dress", dir: -1 },
        ], { shadowDir: [1.0, 0.22], shadowOpacity: 0.24, flush: true });
        // 4. Continuous Curved Cast-Iron Dome Ring-Beam, Toothed Brass Azimuth Rack & 8 Bogie Carriages (y = 903..1012)
        const ringB = new PathBatcher();
        ringB.rect("ringIron", BLEED.x0, 903, BLEED.x1 - BLEED.x0, 61, { fill: PAL.slateDk, fillOpacity: 0.99 });
        ringB.rect("ringStone", BLEED.x0, 964, BLEED.x1 - BLEED.x0, 48, { fill: PAL.paperStone, fillOpacity: 0.99 });
        // Fine 14px-pitch machined brass azimuth ring gear teeth (200+ crisp teeth in 1 path!)
        for (let x = -350; x < 2750; x += 14) {
            ringB.addPath("rack", `M${f(x)} 952L${f(x + 2.5)} 964H${f(x + 9)}L${f(x + 11.5)} 952Z`, { fill: PAL.brass, fillOpacity: 0.9 });
        }
        ringB.line("ln", BLEED.x0, 903, BLEED.x1, 903, { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.86, nonScaling: "contour" });
        ringB.line("ln", BLEED.x0, 952, BLEED.x1, 952, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.84, nonScaling: "contour" });
        ringB.line("lit", BLEED.x0, 906, BLEED.x1, 906, { stroke: PAL.litEdge, strokeWidth: 0.62, strokeOpacity: 0.7, nonScaling: "contour" });
        for (const bx of [120, 460, 800, 1140, 1480, 1820, 2160, 2480]) {
            ringB.quad("bogie", [bx - 32, 922], [bx + 32, 922], [bx + 38, 948], [bx - 38, 948], { fill: PAL.slate, fillOpacity: 0.96 });
            ringB.circle("wheel", bx, 944, 15, { fill: PAL.brass, fillOpacity: 0.98 });
            ringB.circle("axle", bx, 944, 5.5, { fill: PAL.ink, fillOpacity: 0.94 });
        }
        ringB.flush(p);
        // 5. Lower Gallery Drum Wall: 4 Floor-to-Ceiling Dense Bookcase Bays + Blueprint + Barometer/Astrolabe + Sidereal Clock!
        const floorY = 1278;
        p.fillPath(`M${BLEED.x0} 1012H${BLEED.x1}V${floorY + 10}H${BLEED.x0}Z`, PAL.paperDeep, 0.99);
        let wallCourses = "";
        for (let y = 1044; y < floorY; y += 34) {
            wallCourses += `M${BLEED.x0} ${f(y)}H${BLEED.x1}`;
            const row = Math.round(y / 34);
            for (let x = -300 + (row % 2) * 55; x < 2700; x += 110)
                wallCourses += `M${f(x)} ${f(y)}V${f(y + 34)}`;
        }
        p.burin(wallCourses, PAL.inkMid, 0.38, 0.34, 110, "hatch");
        // 4 Lower Floor-to-Ceiling @kiuzyx Star-Atlas Bookcase Bays (300+ micro spines!)
        denseBookshelf(p, { x: -45, y: 1018, w: 268, h: 260 }, { shelves: 4, binders: true });
        denseBookshelf(p, { x: 428, y: 1018, w: 242, h: 260 }, { shelves: 4, binders: false });
        denseBookshelf(p, { x: 1890, y: 1018, w: 235, h: 260 }, { shelves: 4, binders: true });
        denseBookshelf(p, { x: 2138, y: 1018, w: 252, h: 260 }, { shelves: 4, binders: false });
        // Rolling brass library ladder on far-right bookcase!
        drawBrassLibraryLadder(p, 2115, 1020, 1280);
        // Framed Day-vellum / Night-cyanotype Observatory Section Blueprint (x = 688..982, y = 1030..1228)
        drawObservatorySectionFrame(p, 688, 1030, 294, 198);
        // Two Recessed Arched Instrument Alcoves: Barometer (x=1085) & Glowing Brass Astrolabe (x=1262)
        for (const [ax, kind] of [[1082, "barometer"], [1262, "astrolabe"]]) {
            const archD = `M${f(ax - 76)} ${floorY}V1118A76 68 0 0 1 ${f(ax + 76)} 1118V${floorY}Z`;
            p.fillPath(archD, PAL.paperShadow, 0.56);
            p.burinHatch([[ax - 76, 1060], [ax + 76, 1060], [ax + 76, floorY], [ax - 76, floorY]], rad(45), 10, linearTone([ax - 76, 1060], [ax + 76, floorY], 0.52, 0.1), { color: PAL.inkMid, opacity: 0.34 });
            p.burinContour(archD, PAL.inkMid, 0.68, 0.76, 1);
            if (kind === "barometer") {
                p.fillPath(`M${f(ax - 16)} 1108H${f(ax + 16)}V1252H${f(ax - 16)}Z`, PAL.umber, 0.94);
                p.fillPath(circlePath(ax, 1146, 26), PAL.brass, 0.96);
                p.fillPath(circlePath(ax, 1146, 20), PAL.paper, 0.96);
                p.burinContour(`M${f(ax)} 1146L${f(ax + 12)} 1135M${f(ax)} 1172V1240`, PAL.ink, 0.62, 0.84, 2);
            }
            else {
                p.fillPath(`M${f(ax - 50)} 1196H${f(ax + 50)}V${floorY}H${f(ax - 50)}Z`, PAL.umber, 0.92);
                p.burinContour(`M${f(ax - 50)} 1196H${f(ax + 50)}V${floorY}H${f(ax - 50)}ZM${f(ax)} 1196V${floorY}`, PAL.ink, 0.58, 0.78, 5);
                p.hangingLantern({ cx: ax, cy: 1094, w: 58, h: 62, cordLen: 36, style: "astrolabe", swayAmp: 1.6, freq: 0.85, phase: 1.2 });
            }
        }
        // Tall Glass-Fronted Sidereal Regulator Clock right beside Pier (x = 1412)
        drawSiderealClock(p, 1412, 1020, 108, 258);
        // 6. Radial Oak Parquet Observing Gallery Floor (y = 1278..1880) via PathBatcher!
        const floorGrad = p.linearGrad("floor", 1200, floorY, 1200, 1880, [
            [0, PAL.umberLt],
            [0.45, PAL.umber],
            [1, PAL.umberDk],
        ]);
        p.fillPath(`M${BLEED.x0} ${floorY}H${BLEED.x1}V${BLEED.y1}H${BLEED.x0}Z`, floorGrad, 0.99);
        const flB = new PathBatcher();
        for (let y = floorY; y < 1880; y += 26)
            flB.line("fl", BLEED.x0, y, BLEED.x1, y, { stroke: PAL.inkSepia, strokeWidth: 0.36, strokeOpacity: 0.44, nonScaling: "hatch" });
        for (let i = -10; i <= 16; i++)
            flB.line("fl", 1200 + i * 115, floorY, 1200 + i * 240, 1880, { stroke: PAL.inkSepia, strokeWidth: 0.36, strokeOpacity: 0.42, nonScaling: "hatch" });
        flB.addPath("track", "M-320 1372Q1200 1315 2720 1372M-320 1388Q1200 1331 2720 1388", { stroke: PAL.brass, strokeWidth: 1.15, strokeOpacity: 0.76, nonScaling: "contour" });
        flB.flush(p);
        // Helical Spiral Cast-Iron Staircase descending from Upper Mezzanine Gallery down to Main Floor (x = 322)!
        drawSpiralIronStair(p, 322, mezFloorY + 6, floorY + 26, 94);
        // Soft nocturnal moonlight shaft sweeping down-right across the Great Refractor & floor
        p.layer("var(--z-moon-op)", () => {
            p.fillPath(polyPath([[1240, -160], [1620, -160], [2120, 1420], [1340, 1420]]), moonShaftGrad, 0.96);
        });
        // 7. Monumental Dressed-Limestone Equatorial Pier (x = 1520..1890, y = 992..1468)
        const pierSun = [[1555, 1025], [1740, 1025], [1760, 1420], [1525, 1420]];
        const pierShade = [[1740, 1025], [1860, 1045], [1890, 1404], [1760, 1420]];
        const pierCap = [[1528, 992], [1884, 1012], [1872, 1046], [1532, 1028]];
        const pierBase = [[1490, 1404], [1770, 1418], [1925, 1396], [1934, 1446], [1770, 1468], [1484, 1448]];
        p.fillPath(polyPath([[1770, 1455], [2200, 1495], [2145, 1405], [1900, 1398]]), PAL.ink, "var(--z-shadow-op)");
        p.fillPath(polyPath(pierSun), PAL.paperStone, 0.99);
        p.fillPath(polyPath(pierShade), PAL.slateLt, 0.86);
        p.fillPath(polyPath(pierCap), PAL.paperWarm, 0.99);
        p.fillPath(polyPath(pierBase), PAL.paperDeep, 0.99);
        let pierCourses = "";
        for (let k = 1; k < 7; k++) {
            const v = k / 7;
            const pL = lerp(pierSun[0], pierSun[3], v);
            const pM = lerp(pierSun[1], pierSun[2], v);
            const pR = lerp(pierShade[1], pierShade[2], v);
            pierCourses += `M${f(pL[0])} ${f(pL[1])}L${f(pM[0])} ${f(pM[1])}L${f(pR[0])} ${f(pR[1])}`;
        }
        p.burin(pierCourses, PAL.inkMid, 0.46, 0.56, 12, "hatch");
        p.burinHatch(pierShade, rad(18), 8, linearTone([1740, 1030], [1890, 1410], 0.34, 0.84), {
            color: PAL.inkSepia,
            opacity: 0.52,
            cross: true,
            crossAngleRad: rad(-68),
            crossSpacing: 12,
            crossThresh: 0.62,
        });
        p.burinContour(polyPath(pierSun) + polyPath(pierShade) + polyPath(pierCap) + polyPath(pierBase), PAL.ink, 0.78, 0.84, 4);
        p.moonRim([pierSun[3], pierSun[0], pierCap[0], pierCap[1]], { closed: false, widthPx: 1.0 });
        // Recessed Cast-Iron Clock-Drive Housing & 4 Counter-Rotating Meshing Brass Gears on Pier Face!
        p.fillPath(polyPath([[1564, 1054], [1846, 1068], [1846, 1272], [1564, 1258]]), PAL.slateDk, 0.96);
        p.burinContour(polyPath([[1564, 1054], [1846, 1068], [1846, 1272], [1564, 1258]]), PAL.ink, 0.8, 0.86, 4);
        const gears = [
            [1636, 1170, 62, 24, 6, 10, PAL.brass, PAL.brassLt],
            [1732, 1118, 44, 16, 5, -16, PAL.brassLt, PAL.paperWarm],
            [1798, 1178, 32, 12, 4, 24, PAL.brass, PAL.brassLt],
            [1698, 1218, 38, 14, 5, -12, PAL.brassDk, PAL.brass],
        ];
        for (const [gx, gy, gr, teeth, spokes, spd, col, rim] of gears) {
            p.animGroup({ kind: "rotate", cx: gx, cy: gy, speedDeg: spd, phase: gx % 29 }, () => {
                p.spurGear({ cx: gx, cy: gy, r: gr, teeth, spokes, fill: col, rimFill: rim });
            });
        }
        // 8. Hero Monumental Great Brass Equatorial Refractor Telescope (3D elliptical dew-hood + ringed finder!)
        const decC = [1710, 885];
        p.doubleGlaze([[1605, 1005], [1805, 1012], [1765, 865], [1655, 858]], PAL.slateDk, PAL.ink, { smooth: false, thinPx: 0.52, thickPx: 0.94 });
        p.animGroup({ kind: "rotate", cx: decC[0], cy: decC[1], speedDeg: 3.5, phase: 8 }, () => {
            p.brassDegreeRing({ cx: decC[0], cy: decC[1], rOuter: 118, rInner: 90, tickCount: 72, majorEvery: 6, fill: PAL.brass, bevelFill: PAL.brassLt });
        });
        const cwEnd = [1935, 1185];
        const cwShaft = sample(quad(decC, lerp(decC, cwEnd, 0.5), cwEnd), 4);
        p.calligraphicStroke(cwShaft, 14, 14, 12, PAL.slate, 0.96);
        for (const u of [0.58, 0.74, 0.88]) {
            const cp = lerp(decC, cwEnd, u);
            const dir = [0.6, 0.8];
            const perp = [-0.8, 0.6];
            const wPts = [
                add(add(cp, mul(perp, -42)), mul(dir, -14)),
                add(add(cp, mul(perp, 42)), mul(dir, -14)),
                add(add(cp, mul(perp, 42)), mul(dir, 14)),
                add(add(cp, mul(perp, -42)), mul(dir, 14)),
            ];
            p.doubleGlaze(wPts, PAL.slateDk, PAL.ink, { smooth: false, thinPx: 0.5, thickPx: 0.9 });
        }
        const tailPt = [2075, 1115];
        const headPt = [1205, 515];
        const tubeDir = norm([headPt[0] - tailPt[0], headPt[1] - tailPt[1]]);
        const tubePerp = [-tubeDir[1], tubeDir[0]]; // +offsetAbove points UP-RIGHT (ABOVE tube!)
        const tubePt = (u, off) => add(lerp(tailPt, headPt, u), mul(tubePerp, off));
        const mainTube = [tubePt(0, 34), tubePt(0.84, 62), tubePt(0.84, -62), tubePt(0, -34)];
        const dewShield = [tubePt(0.84, 68), tubePt(1.0, 70), tubePt(1.0, -70), tubePt(0.84, -68)];
        const focuser = [tubePt(-0.12, 22), tubePt(0, 24), tubePt(0, -24), tubePt(-0.12, -22)];
        // Parallel upper brass finder scope with twin mounting struts, rings & objective cell
        const findTail = tubePt(0.18, 92);
        const findHead = tubePt(0.76, 108);
        const findPts = [
            add(findTail, mul(tubePerp, 11)), add(findHead, mul(tubePerp, 15)),
            add(findHead, mul(tubePerp, -15)), add(findTail, mul(tubePerp, -11)),
        ];
        for (const u of [0.28, 0.62]) {
            const sPts = [tubePt(u - 0.011, 46), tubePt(u + 0.011, 46), tubePt(u + 0.009, 116), tubePt(u - 0.009, 116)];
            p.fillPath(polyPath(sPts), PAL.brassDk, 0.98);
            p.burinContour(polyPath(sPts), PAL.ink, 0.62, 0.86, 4);
        }
        p.doubleGlaze(findPts, PAL.brass, PAL.brassDk, { smooth: false, thinPx: 0.44, thickPx: 0.82 });
        for (const uF of [0.16, 0.72, 0.89]) {
            const fc = lerp(findTail, findHead, uF);
            const hw = 12 + uF * 5;
            const rPts = [
                add(add(fc, mul(tubeDir, -6)), mul(tubePerp, hw)), add(add(fc, mul(tubeDir, 6)), mul(tubePerp, hw)),
                add(add(fc, mul(tubeDir, 6)), mul(tubePerp, -hw)), add(add(fc, mul(tubeDir, -6)), mul(tubePerp, -hw)),
            ];
            p.fillPath(polyPath(rPts), PAL.brassDk, 0.98);
            p.burinContour(polyPath(rPts), PAL.ink, 0.56, 0.86, 4);
        }
        p.fillPath(polyPath(focuser), PAL.brassDk, 0.98);
        p.fillPath(polyPath(mainTube), brassTubeGrad, 0.99);
        p.fillPath(polyPath(dewShield), brassTubeGrad, 0.99);
        // Stepped collimation cell collar with screws
        const cellCollar = [tubePt(0.815, 65), tubePt(0.848, 66), tubePt(0.848, -66), tubePt(0.815, -65)];
        p.fillPath(polyPath(cellCollar), PAL.brassDk, 0.96);
        p.burinContour(polyPath(cellCollar), PAL.ink, 0.72, 0.88, 4);
        for (const off of [-42, 0, 42]) {
            const sp = tubePt(0.832, off);
            p.fillPath(circlePath(sp[0], sp[1], 4.2), PAL.brassLt, 0.98);
        }
        p.fillPath(polyPath([tubePt(0.02, 20), tubePt(0.98, 40), tubePt(0.98, 18), tubePt(0.02, 6)]), PAL.brassLt, 0.58);
        p.burinHatch(mainTube, Math.atan2(tubeDir[1], tubeDir[0]), 6.5, cylinderTone(lerp(tailPt, headPt, 0.5), tubeDir, 60, LIGHT), { color: PAL.inkSepia, opacity: 0.48 });
        p.burinHatch(dewShield, Math.atan2(tubeDir[1], tubeDir[0]), 6.2, cylinderTone(lerp(tailPt, headPt, 0.92), tubeDir, 68, LIGHT), { color: PAL.inkSepia, opacity: 0.44 });
        // 3D Foreshortened Elliptical Dew-Hood Mouth + Gleaming Achromatic Crown-Glass Objective Lens Meniscus!
        const hoodEllipse = (center, rxAlong, ryPerp, segs = 32) => Array.from({ length: segs }, (_, i) => {
            const a = (i / segs) * TAU;
            return add(add(center, mul(tubeDir, Math.cos(a) * rxAlong)), mul(tubePerp, Math.sin(a) * ryPerp));
        });
        const hoodOuter = hoodEllipse(headPt, 24, 70, 32);
        const hoodInner = hoodEllipse(headPt, 19.5, 62, 32);
        const lensCenter = add(headPt, mul(tubeDir, -10));
        const lensGlass = hoodEllipse(lensCenter, 15, 53, 28);
        const lensGlint = hoodEllipse(add(add(lensCenter, mul(tubePerp, 16)), mul(tubeDir, 3)), 6.5, 22, 18);
        p.fillPath(polyPath(hoodOuter), PAL.brassLt, 0.99);
        p.fillPath(polyPath(hoodInner), PAL.prussianDk, 0.98);
        p.fillPath(polyPath(lensGlass), PAL.glass, 0.84);
        p.fillPath(polyPath(lensGlint), PAL.inkRim, 0.7);
        p.burinContour(polyPath(hoodOuter) + polyPath(hoodInner) + polyPath(lensGlass), PAL.ink, 0.78, 0.88, 3);
        p.moonRim(hoodOuter, { widthPx: 1.05 });
        const fHoodOut = hoodEllipse(findHead, 6, 15, 18);
        const fHoodIn = hoodEllipse(findHead, 4.2, 11, 18);
        p.fillPath(polyPath(fHoodOut), PAL.brassLt, 0.98);
        p.fillPath(polyPath(fHoodIn), PAL.glass, 0.86);
        p.burinContour(polyPath(fHoodOut) + polyPath(fHoodIn), PAL.ink, 0.58, 0.86, 2);
        for (const u of [0.28, 0.52]) {
            const rPts = [tubePt(u - 0.026, 62), tubePt(u + 0.026, 64), tubePt(u + 0.026, -64), tubePt(u - 0.026, -62)];
            p.doubleGlaze(rPts, PAL.slateDk, PAL.ink, { smooth: false, thinPx: 0.5, thickPx: 0.9 });
        }
        const eyeTip = tubePt(-0.15, 0);
        p.fillPath(circlePath(eyeTip[0], eyeTip[1], 14), PAL.brass, 0.96);
        p.fillPath(polyPath([add(eyeTip, [-10, 8]), add(eyeTip, [10, 8]), add(eyeTip, [12, 42]), add(eyeTip, [-12, 42])]), PAL.brassDk, 0.98);
        p.burinContour(polyPath(mainTube) + polyPath(dewShield) + polyPath(focuser), PAL.ink, 0.86, 0.88, 3);
        p.moonRim([tubePt(0, 34), tubePt(0.84, 62), tubePt(1.0, 70)], { closed: false, up: true, widthPx: 1.15 });
        p.fillPath(circlePath(decC[0], decC[1], 34), PAL.brass, 0.98);
        p.fillPath(circlePath(decC[0], decC[1], 14), PAL.brassLt, 0.94);
        p.burinContour(circlePath(decC[0], decC[1], 34) + circlePath(decC[0], decC[1], 14), PAL.ink, 0.78, 0.88, 2);
        // 9. Astronomer's Stepped Rolling Observing Ladder behind Eyepiece + Warm Chart Desk + 6 Floor Astronomers!
        const ladX = 1995;
        const ladTop = 1095;
        const ladBot = 1365;
        p.fillPath(polyPath([[ladX - 38, ladTop], [ladX - 25, ladTop], [ladX - 58, ladBot], [ladX - 71, ladBot]]), PAL.umber, 0.96);
        p.fillPath(polyPath([[ladX + 38, ladTop], [ladX + 51, ladTop], [ladX + 86, ladBot], [ladX + 73, ladBot]]), PAL.umberDk, 0.96);
        let stepsD = "";
        for (let s = 0; s < 6; s++) {
            const u = s / 5;
            const sy = lerp([0, ladTop + 28], [0, ladBot - 22], u)[1];
            const sxL = lerp([ladX - 34, 0], [ladX - 64, 0], u)[0];
            const sxR = lerp([ladX + 44, 0], [ladX + 78, 0], u)[0];
            p.fillPath(`M${f(sxL)} ${f(sy)}H${f(sxR)}V${f(sy + 9)}H${f(sxL)}Z`, PAL.umberLt, 0.95);
            stepsD += `M${f(sxL)} ${f(sy)}H${f(sxR)}V${f(sy + 9)}H${f(sxL)}Z`;
        }
        p.burinContour(stepsD, PAL.ink, 0.58, 0.82, 6);
        // Warm 2 AM Astronomer's Chart Desk & Lamp Halo
        p.layer("var(--z-halo-op)", () => {
            p.animGroup({ kind: "pulse", baseOp: 0.86, ampOp: 0.14, freq: 1.7, phase: 0.2 }, () => {
                p.fillPath(circlePath(845, 1225, 480), deskHaloGrad, 0.96);
            });
        });
        // Astronomers standing behind chart desk & on lower spiral stair landing
        p.scaleFigures([
            { x: 695, y: 1326, h: 96, coat: PAL.cinnabar, kind: "coat", dir: 1 },
            { x: 472, y: 1318, h: 90, coat: PAL.ochre, kind: "coat", dir: 1 },
            { x: 356, y: 1082, h: 68, coat: PAL.prussianLt, kind: "coat", dir: -1 }, // climbing spiral iron stair!
        ], { shadowDir: [1.1, 0.25], shadowOpacity: 0.26, flush: true });
        // Primary Astronomer's Chart Desk (x = 508..1002, y = 1272..1422) — rich open star-atlas folio, rolled star-charts, brass sextant, celestial globe & desk lamp!
        const deskTop = [[545, 1272], [965, 1272], [1002, 1324], [508, 1324]];
        const deskFront = [[508, 1324], [1002, 1324], [1002, 1348], [508, 1348]];
        p.fillPath(polyPath(deskTop), PAL.umberLt, 0.99);
        p.fillPath(polyPath(deskFront), PAL.umberDk, 0.99);
        for (const lx of [534, 966])
            p.fillPath(`M${f(lx)} 1348H${f(lx + 16)}V1422H${f(lx)}Z`, PAL.umberDk, 0.99);
        const dtB = new PathBatcher();
        // Left: 3 Rolled Star-Chart Parchment Scrolls tied with crimson silk ribbons!
        for (const [sx, sy, sw] of [[536, 1296, 66], [542, 1305, 62], [532, 1313, 68]]) {
            dtB.rect("scroll", sx, sy, sw, 6.5, { fill: PAL.paperWarm, fillOpacity: 0.98 });
            dtB.rect("ribbon", sx + sw * 0.46, sy, 4.5, 6.5, { fill: PAL.cinnabar, fillOpacity: 0.92 });
            dtB.addPath("dtLn", `M${f(sx)} ${f(sy)}H${f(sx + sw)}V${f(sy + 6.5)}H${f(sx)}Z`, { stroke: PAL.inkMid, strokeWidth: 0.42, strokeOpacity: 0.72, nonScaling: "hatch" });
        }
        // Center: Open Crimson Leather-Bound Star-Atlas Folio with celestial hemisphere graticule & ruled ephemeris table!
        dtB.quad("bookCov", [612, 1278], [798, 1278], [812, 1319], [598, 1319], { fill: PAL.cinnabarDk, fillOpacity: 0.98 });
        dtB.quad("pgL", [618, 1281], [704, 1282], [704, 1315], [606, 1315], { fill: PAL.paper, fillOpacity: 0.99 });
        dtB.quad("pgR", [706, 1282], [792, 1281], [804, 1315], [706, 1315], { fill: PAL.paperWarm, fillOpacity: 0.99 });
        // Left page: circular celestial hemisphere chart + meridian arcs + tiny star dots
        dtB.circle("chart", 658, 1298, 13.5, { stroke: PAL.inkDraft, strokeWidth: 0.44, strokeOpacity: 0.8, nonScaling: "hatch" });
        dtB.addPath("chart", "M644 1298H672M658 1285V1311M648 1290Q658 1298 668 1290M648 1306Q658 1298 668 1306", {
            stroke: PAL.inkDraft,
            strokeWidth: 0.36,
            strokeOpacity: 0.74,
            nonScaling: "hatch",
        });
        // Right page: ruled 3-column star-ephemeris table & crimson header rule
        dtB.line("crimson", 714, 1287, 786, 1287, { stroke: PAL.cinnabar, strokeWidth: 0.45, strokeOpacity: 0.78, nonScaling: "hatch" });
        for (let r = 0; r < 5; r++) {
            const ry = 1292 + r * 4.6;
            dtB.line("chart", 714, ry, 788, ry, { stroke: PAL.inkDraft, strokeWidth: 0.34, strokeOpacity: 0.68, nonScaling: "hatch" });
        }
        dtB.addPath("chart", "M738 1287V1312M764 1287V1312M705 1282V1315", { stroke: PAL.inkDraft, strokeWidth: 0.36, strokeOpacity: 0.72, nonScaling: "hatch" });
        // Right-of-folio: Miniature Brass Vernier Sextant, Brass Dividers & Inkwell with Feather Quill!
        dtB.addPath("brass", "M892 1312L914 1286L934 1312Q913 1320 892 1312Z", { stroke: PAL.brassLt, strokeWidth: 1.05, strokeOpacity: 0.94, nonScaling: "contour" });
        dtB.line("brass", 914, 1286, 918, 1315, { stroke: PAL.brass, strokeWidth: 0.9, strokeOpacity: 0.94, nonScaling: "contour" });
        dtB.addPath("brass", "M942 1288L954 1314M942 1288L964 1310", { stroke: PAL.brassLt, strokeWidth: 0.85, strokeOpacity: 0.92, nonScaling: "contour" });
        dtB.rect("inkwell", 814, 1286, 10, 10, { fill: PAL.prussianDk, fillOpacity: 0.95 });
        dtB.addPath("quill", "M819 1287Q828 1272 838 1265", { stroke: PAL.paper, strokeWidth: 1.15, strokeOpacity: 0.92, nonScaling: "contour" });
        // Desk front drawer pulls (3 brass pulls along desk apron!)
        for (const px of [595, 755, 915]) {
            dtB.rect("brass", px - 14, 1333, 28, 5, { fill: PAL.brass, fillOpacity: 0.92 });
        }
        dtB.flush(p);
        p.fillPath(circlePath(568, 1260, 19), PAL.celadon, 0.94);
        p.burinContour(circlePath(568, 1260, 21) + `M568 1281V1296M554 1296H582`, PAL.brass, 0.95, 0.9, 3);
        p.fillPath(ellipsePath(856, 1302, 23, 8), PAL.brassDk, 0.96);
        p.fillPath(`M852 1226H860V1302H852Z`, PAL.brass, 0.96);
        p.fillPath(polyPath([[814, 1230], [856, 1202], [892, 1230]]), PAL.malachite, 0.98);
        p.fillPath(ellipsePath(853, 1231, 34, 9), PAL.lanternCore, 0.96);
        p.burinContour(polyPath(deskTop) + polyPath(deskFront), PAL.ink, 0.72, 0.84, 2);
        // Foreground astronomers beside desk, near barometer & atop observing ladder!
        p.scaleFigures([
            { x: 1068, y: 1368, h: 102, coat: PAL.prussianLt, kind: "dress", dir: -1 },
            { x: 1218, y: 1345, h: 94, coat: PAL.slateDk, kind: "coat", dir: -1 },
            { x: 1995, y: 1185, h: 94, coat: PAL.ochreLt, kind: "coat", dir: -1 },
        ], { shadowDir: [1.15, 0.25], shadowOpacity: 0.3, flush: true });
        p.flush();
    }, false, "s08-clip");
    // 10. Carved Dressed-Limestone & Brass-Studded Archway Framing the Upper Chart-Room Opening (crisp even at 6x!)
    const holePoly = polyPath(hole);
    const expandArch = (dxM, dyT, dyB) => hole.map(([x, y]) => [x + (x < clearBox.cx ? -dxM : dxM), y + (y < clearBox.cy ? -dyT : dyB)]);
    const innerSoffit = expandArch(7.5, 7.5, 6);
    const outerArch = expandArch(21, 21, 14);
    const aB = new PathBatcher();
    aB.addPath("archOuter", polyPath(outerArch) + holePoly, { fill: PAL.paperWarm, fillOpacity: 0.99, evenodd: true });
    aB.addPath("archSoffit", polyPath(innerSoffit) + holePoly, { fill: PAL.slateDk, fillOpacity: 0.88, evenodd: true });
    // Radial dressed limestone arch voussoirs + keystone + delicate brass arch-trim rivets
    for (let i = 0; i < hole.length; i += 2) {
        const a = hole[i];
        const b = outerArch[i];
        if (a[1] < clearBox.cy + 20) {
            aB.line("vous", a[0], a[1], b[0], b[1], { stroke: PAL.inkMid, strokeWidth: 0.5, strokeOpacity: 0.68, nonScaling: "hatch" });
        }
        const mid = lerp(a, innerSoffit[i], 0.5);
        aB.circle("rivet", mid[0], mid[1], 1.35, { fill: PAL.brassLt, fillOpacity: 0.82 });
    }
    const apex = hole[10];
    const keyPts = [[apex[0] - 11, apex[1] - 26], [apex[0] + 11, apex[1] - 26], [apex[0] + 8, apex[1] - 1], [apex[0] - 8, apex[1] - 1]];
    aB.quad("key", keyPts[0], keyPts[1], keyPts[2], keyPts[3], { fill: PAL.paper, fillOpacity: 0.99 });
    aB.addPath("archLn", holePoly + polyPath(innerSoffit) + polyPath(outerArch) + polyPath(keyPts), {
        stroke: PAL.ink,
        strokeWidth: 0.82,
        strokeOpacity: 0.88,
        nonScaling: "contour",
    });
    aB.flush(p);
    p.moonRim(hole.slice(0, 21), { closed: false, up: true, widthPx: 1.0 });
    p.flush();
    return {
        index: 8,
        id: "s08-observatory",
        title: "Great Refractor Dome & Gallery Library",
        subtitle: "44-rib riveted dome, equatorial refractor, spiral stair & chart-room archway",
        portal: S08_PORTAL,
        coreColorDay: [228, 224, 214],
        coreColorNight: [16, 22, 38],
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
