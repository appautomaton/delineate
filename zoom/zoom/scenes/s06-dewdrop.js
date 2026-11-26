// Octave s06 (Stage 5 — 5x Micro-Craft): Sunlit Mediterranean Botanical Terrace & French Casement Doorway
// Zero oval/ring bezel collar! Full-bleed Italianate botanical terrace overlooking shimmering coastal
// hills & sea, 5-tone @devteamdrew stipple cypress/olive/bougainvillea groves, 26-baluster carved limestone
// balustrade, herringbone & travertine mosaic terrace, sculpted terracotta & cobalt ceramic planters
// with 3D golden-angle Agave/Echeveria/Aeonium rosettes, wrought-iron garden table, stepped marble
// lotus reflecting pond, and an open arched French conservatory casement doorway at (1490, 590)
// framing s07 the Optician's & Clockmaker's Atelier.
import { LIGHT, PAL, Painter, PathBatcher, TAU, archDoorwayHole, circlePath, closedSmooth, cubic, cylinderTone, ellipsePath, f, lerp, linePath, linearTone, polyPath, quad, rad, rand, sample, stippleTreeCluster, } from "../kit.js";
import { BLEED, requiredPortalClearBox, requiredPortalSealBox, } from "./types.js";
export const S06_PORTAL = { cx: 1490, cy: 590, rx: 176, ry: 142 };
const NEXT_PORTAL = [1540, 900]; // s07-atelier
/** Sculpted hand-thrown terracotta or glazed ceramic planter with cylindrical copperplate burin shading. */
function drawPlanterPot(p, cx, rimY, rimW, baseW, h, opts = {}) {
    const fill = opts.fill ?? PAL.copper;
    const shade = opts.shade ?? PAL.cinnabarDk;
    const light = opts.light ?? PAL.cinnabarLt;
    const botY = rimY + h;
    const lipH = Math.max(14, h * 0.14);
    p.fillPath(ellipsePath(cx + baseW * 0.22, botY + 8, baseW * 0.64, Math.max(12, h * 0.08)), PAL.inkMid, "var(--z-shadow-op)");
    const bodyPts = [
        [cx - rimW * 0.48, rimY + lipH * 0.7],
        [cx + rimW * 0.48, rimY + lipH * 0.7],
        [cx + rimW * 0.44, rimY + h * 0.46],
        [cx + baseW * 0.5, botY],
        [cx, botY + h * 0.055],
        [cx - baseW * 0.5, botY],
        [cx - rimW * 0.44, rimY + h * 0.46],
    ];
    p.doubleGlaze(bodyPts, fill, shade, {
        smooth: false,
        washOpacity: 0.96,
        deepK: 0.72,
        deepAbout: [cx + rimW * 0.2, rimY + h * 0.56],
        deepOpacity: 0.4,
        ink: false,
    });
    // Sunlit left & cool shadowed right ceramic flanks
    p.fillPath(polyPath([
        [cx - rimW * 0.46, rimY + lipH * 0.75],
        [cx - rimW * 0.08, rimY + lipH * 0.75],
        [cx - baseW * 0.1, botY + h * 0.04],
        [cx - baseW * 0.48, botY],
    ]), light, opts.glazed ? 0.46 : 0.34);
    p.fillPath(polyPath([
        [cx + rimW * 0.08, rimY + lipH * 0.75],
        [cx + rimW * 0.46, rimY + lipH * 0.75],
        [cx + baseW * 0.48, botY],
        [cx + baseW * 0.12, botY + h * 0.04],
    ]), shade, 0.36);
    // Decorative relief bands + cylindrical copperplate burin shading
    let ribsD = "";
    for (const frac of [0.3, 0.36, 0.72]) {
        const yy = rimY + h * frac;
        const hw = lerp([rimW * 0.47, 0], [baseW * 0.5, 0], frac)[0];
        ribsD += `M${f(cx - hw)} ${f(yy)}Q${f(cx)} ${f(yy + h * 0.036)} ${f(cx + hw)} ${f(yy)}`;
    }
    p.burin(ribsD, PAL.inkSepia, 0.45, 0.52, 3, "hatch");
    p.burinHatch(bodyPts, rad(8), 7, cylinderTone([cx, rimY + h * 0.5], [0, 1], rimW * 0.52, LIGHT), {
        color: PAL.inkSepia,
        opacity: 0.48,
        cross: true,
        crossAngleRad: rad(-66),
        crossSpacing: 11,
        crossThresh: 0.64,
    });
    // Rolled collar rim + dark potting soil
    const collarPts = [
        [cx - rimW * 0.53, rimY],
        [cx + rimW * 0.53, rimY],
        [cx + rimW * 0.52, rimY + lipH],
        [cx, rimY + lipH + h * 0.05],
        [cx - rimW * 0.52, rimY + lipH],
    ];
    p.fillPath(polyPath(collarPts), fill, 0.98);
    p.fillPath(ellipsePath(cx, rimY, rimW * 0.53, lipH * 0.58), light, 0.92);
    p.fillPath(ellipsePath(cx, rimY + 2, rimW * 0.45, lipH * 0.42), PAL.barkDk, 0.92);
    p.burinContour(`M${f(cx - rimW * 0.52)} ${f(rimY + lipH)}Q${f(cx)} ${f(rimY + lipH + h * 0.05)} ${f(cx + rimW * 0.52)} ${f(rimY + lipH)}`, PAL.ink, 0.68, 0.76, 1);
    p.burinContour(`M${f(cx + rimW * 0.48)} ${f(rimY + lipH)}L${f(cx + baseW * 0.5)} ${f(botY)}Q${f(cx)} ${f(botY + h * 0.06)} ${f(cx - baseW * 0.5)} ${f(botY)}`, PAL.ink, 0.78, 0.78, 2);
    p.moonRim([
        [cx - rimW * 0.53, rimY],
        [cx - rimW * 0.52, rimY + lipH],
        [cx - rimW * 0.46, rimY + h * 0.46],
        [cx - baseW * 0.5, botY],
    ], { closed: false, widthPx: 0.85, opacity: "var(--z-moon-op)" });
    p.flush();
}
/** Draws a hovering archival botanical hawk-moth with veined double-glazed wings. */
function drawBotanicalMoth(p, cx, cy, sc, tiltDeg, phase) {
    const ang = rad(tiltDeg);
    const toW = (pt) => [
        cx + (pt[0] * Math.cos(ang) - pt[1] * Math.sin(ang)) * sc,
        cy + (pt[0] * Math.sin(ang) + pt[1] * Math.cos(ang)) * sc,
    ];
    p.animGroup({ kind: "bob", cx, cy, ampY: 10 * sc, ampDeg: 4.2, freq: 2.1, phase }, () => {
        for (const s of [-1, 1]) {
            const fw = [toW([0, -4]), toW([s * 24, -22]), toW([s * 54, -14]), toW([s * 44, 6]), toW([s * 14, 10])];
            p.doubleGlaze(fw, PAL.petal, PAL.ochre, { smooth: true, washOpacity: 0.92, deepOpacity: 0.36, thinPx: 0.4, thickPx: 0.72 });
            const hw = [toW([0, 4]), toW([s * 30, 8]), toW([s * 26, 26]), toW([s * 8, 22])];
            p.doubleGlaze(hw, PAL.ochreLt, PAL.cinnabarLt, { smooth: true, washOpacity: 0.88, deepOpacity: 0.4, thinPx: 0.36, thickPx: 0.68 });
            const spot = toW([s * 28, -4]);
            p.fillPath(circlePath(spot[0], spot[1], 3.8 * sc), PAL.wisteriaDk, 0.72);
            p.fillPath(circlePath(spot[0], spot[1], 1.6 * sc), PAL.lanternCore, 0.86);
        }
        const body = [toW([0, -14]), toW([4, -2]), toW([2.8, 18]), toW([0, 23]), toW([-2.8, 18]), toW([-4, -2])];
        p.fillPath(closedSmooth(body), PAL.umber, 0.94);
        p.burinContour(closedSmooth(body), PAL.ink, 0.55, 0.82, 1);
    });
}
/** Draws a crisp PathBatcher Mediterranean bougainvillea & ivy garland with pointed ovate leaves & 3-bract papery crimson/blush florets! */
function drawBougainvilleaGarland(p) {
    const b = new PathBatcher();
    // 1. Intertwined climbing woody vine runners draping along the conservatory eaves & cascading down doorway flanks
    const vines = [
        [[1195, 242], [1365, 286], [1545, 224], [1740, 268]],
        [[1435, 232], [1625, 278], [1790, 235], [1908, 282]],
        [[1235, 245], [1202, 325], [1252, 405], [1214, 488]],
        [[1268, 255], [1296, 338], [1246, 408], [1278, 468]],
        [[1828, 252], [1866, 335], [1818, 412], [1852, 482]],
    ];
    const samplePts = [];
    for (const [p0, p1, p2, p3] of vines) {
        const pts = sample(cubic(p0, p1, p2, p3), 18);
        b.addPath("vine", linePath(pts), { stroke: PAL.barkDk, strokeWidth: 1.25, strokeOpacity: 0.88, nonScaling: "contour" });
        for (const pt of pts)
            samplePts.push(pt);
    }
    // Helper: pointed ovate leaf path (zero round circles!)
    const addPointedLeaf = (key, cx, cy, ang, len, w, fill, op) => {
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const tipX = cx + ca * len;
        const tipY = cy + sa * len;
        const midX = cx + ca * len * 0.48;
        const midY = cy + sa * len * 0.48;
        const nx = -sa * w;
        const ny = ca * w;
        b.addPath(key, `M${f(cx)} ${f(cy)}Q${f(midX + nx)} ${f(midY + ny)} ${f(tipX)} ${f(tipY)}Q${f(midX - nx)} ${f(midY - ny)} ${f(cx)} ${f(cy)}Z`, { fill, fillOpacity: op });
    };
    // 2. Dense layered pointed Mediterranean bougainvillea & ivy foliage (3 depth tones)
    const leafTones = [
        ["lfDk", PAL.sageDk, 0.94],
        ["lfMid", PAL.sage, 0.92],
        ["lfLt", PAL.sageLt, 0.88],
    ];
    for (let i = 0; i < samplePts.length; i++) {
        const [vx, vy] = samplePts[i];
        const count = 4;
        for (let k = 0; k < count; k++) {
            const ox = vx + rand(p.r, -34, 34);
            const oy = vy + rand(p.r, -24, 28);
            const ang = rand(p.r, 0, TAU);
            const len = rand(p.r, 11, 22);
            const w = len * rand(p.r, 0.34, 0.46);
            const [key, col, op] = leafTones[(i + k) % 3];
            addPointedLeaf(key, ox, oy, ang, len, w, col, op);
        }
    }
    // 3. 240+ Crisp 3-Bract Pointed Papery Bougainvillea Floret Clusters (4.6–8.0px bracts + tiny cream stamen center!)
    const bractTones = [
        ["brDk", PAL.cinnabarDk, 0.94],
        ["brMid", PAL.cinnabar, 0.96],
        ["brLt", PAL.cinnabarLt, 0.96],
        ["brBlush", PAL.petalBlush, 0.94],
    ];
    for (let i = 0; i < samplePts.length; i++) {
        const [vx, vy] = samplePts[i];
        const clusters = i % 2 === 0 ? 4 : 3;
        for (let c = 0; c < clusters; c++) {
            const fx = vx + rand(p.r, -40, 40);
            const fy = vy + rand(p.r, -26, 32);
            const baseAng = rand(p.r, 0, TAU);
            const brLen = rand(p.r, 5.0, 8.2);
            const brW = brLen * 0.46;
            const toneIdx = Math.floor(p.r() * bractTones.length);
            const [key, col, op] = bractTones[toneIdx];
            // 3 papery pointed bracts radiating at 120° around tiny cream-white flower tube
            for (let br = 0; br < 3; br++) {
                const a = baseAng + (br * TAU) / 3 + rand(p.r, -0.18, 0.18);
                addPointedLeaf(key, fx, fy, a, brLen, brW, col, op);
            }
            b.circle("stamen", fx, fy, 1.1, { fill: PAL.paper, fillOpacity: 0.96 });
        }
    }
    b.flush(p);
}
/** Draws a graceful swaying budding Nelumbo lotus stem & pointed blush-crimson bud rising above the marble basin! */
function drawLotusBud(p, baseX, baseY, tipX, tipY, sc, phase) {
    p.animGroup({ kind: "sway", cx: baseX, cy: baseY, ampDeg: 2.1, freq: 0.92, phase }, () => {
        const ctrl = [(baseX + tipX) * 0.5 - 14 * sc, (baseY + tipY) * 0.5];
        const stemPts = sample(quad([baseX, baseY], ctrl, [tipX, tipY + 12 * sc]), 10);
        p.calligraphicStroke(stemPts, 4.6 * sc, 3.6 * sc, 2.8 * sc, PAL.sageDk, 0.96);
        // Water ripple collar where stem emerges from the turquoise reflecting pond
        p.burinContour(ellipsePath(baseX, baseY, 18 * sc, 5.5 * sc), PAL.waterShimmer, 0.58, 0.72, 1);
        // Swollen pointed blush-pink Nelumbo bud with overlapping outer crimson-blush calyx petals
        const outerL = [
            [tipX, tipY + 14 * sc], [tipX - 18 * sc, tipY - 4 * sc], [tipX - 10 * sc, tipY - 34 * sc],
            [tipX, tipY - 48 * sc], [tipX + 6 * sc, tipY - 12 * sc],
        ];
        const outerR = [
            [tipX, tipY + 14 * sc], [tipX + 18 * sc, tipY - 4 * sc], [tipX + 10 * sc, tipY - 34 * sc],
            [tipX, tipY - 48 * sc], [tipX - 6 * sc, tipY - 12 * sc],
        ];
        const centerPetal = [
            [tipX, tipY + 12 * sc], [tipX - 12 * sc, tipY - 12 * sc], [tipX, tipY - 54 * sc], [tipX + 12 * sc, tipY - 12 * sc],
        ];
        p.doubleGlaze(outerL, PAL.petalBlush, PAL.cinnabarLt, { smooth: true, thinPx: 0.36, thickPx: 0.68 });
        p.doubleGlaze(outerR, PAL.petalBlush, PAL.cinnabarLt, { smooth: true, thinPx: 0.36, thickPx: 0.68 });
        p.doubleGlaze(centerPetal, PAL.petal, PAL.petalBlush, { smooth: true, thinPx: 0.38, thickPx: 0.72 });
        p.fillPath(ellipsePath(tipX, tipY + 13 * sc, 9 * sc, 4.5 * sc), PAL.sage, 0.96);
    });
}
/** Draws a floating peltate Nelumbo lotus pad with radiating veins and subtle dewdrop glints. */
function drawLotusPad(p, cx, cy, rx, ry, fill, shade, veinsN = 14) {
    const pts = [];
    for (let i = 0; i < 36; i++) {
        const a = (i / 36) * TAU;
        const sc = 1 + 0.045 * Math.sin(a * 7 + cx * 0.01) + 0.022 * Math.cos(a * 11);
        pts.push([cx + Math.cos(a) * rx * sc, cy + Math.sin(a) * ry * sc]);
    }
    const d = closedSmooth(pts);
    p.fillPath(closedSmooth(pts.map(([x, y]) => [x + 10, y + 14])), PAL.prussianDk, 0.28);
    p.fillPath(d, PAL.paper, 0.96);
    p.fillPath(d, fill, 0.92);
    p.fillPath(ellipsePath(cx + rx * 0.14, cy + ry * 0.16, rx * 0.62, ry * 0.52), shade, 0.28);
    let vD = "";
    for (let i = 0; i < veinsN; i++) {
        const a = (i / veinsN) * TAU + 0.14;
        vD += `M${f(cx)} ${f(cy)}Q${f(cx + Math.cos(a + 0.06) * rx * 0.48)} ${f(cy + Math.sin(a + 0.06) * ry * 0.48)} ${f(cx + Math.cos(a) * rx * 0.9)} ${f(cy + Math.sin(a) * ry * 0.9)}`;
    }
    p.burin(vD, PAL.vein, 0.42, 0.62, veinsN, "hatch");
    p.burinContour(d, PAL.ink, 0.62, 0.72, 1);
    p.moonRim(pts, { widthPx: 0.82, opacity: "var(--z-moon-op)" });
}
/** Draws a wrought-iron Mediterranean terrace bistro table with botanical sketchbook, loupe & teacup! */
function drawTerraceBistroTable(p, cx, topY) {
    const b = new PathBatcher();
    // Cast ground shadow
    p.fillPath(ellipsePath(cx + 26, topY + 215, 118, 30), PAL.inkMid, "var(--z-shadow-op)");
    // Slender wrought-iron curved legs & cross-stretchers
    for (const [lx, curve] of [[cx - 72, -16], [cx + 72, 16], [cx - 24, -6], [cx + 24, 6]]) {
        const sp = sample(cubic([lx, topY + 18], [lx + curve, topY + 86], [lx - curve * 0.8, topY + 154], [lx + curve * 1.1, topY + 210]), 10);
        b.addPath("iron", linePath(sp), { stroke: PAL.slateDk, strokeWidth: 1.35, strokeOpacity: 0.92, nonScaling: "contour" });
    }
    b.addPath("iron", ellipsePath(cx, topY + 132, 46, 12), { stroke: PAL.slateDk, strokeWidth: 0.9, strokeOpacity: 0.86, nonScaling: "contour" });
    b.flush(p);
    // Sculpted stone & wrought-iron tabletop ellipse + subtle mosaic rim
    p.fillPath(ellipsePath(cx, topY + 9, 122, 36), PAL.slateDk, 0.96);
    p.fillPath(ellipsePath(cx, topY, 120, 34), PAL.paperWarm, 0.99);
    p.burin(ellipsePath(cx, topY, 108, 29), PAL.inkMid, 0.42, 0.52, 1, "hatch");
    p.burinContour(ellipsePath(cx, topY, 120, 34), PAL.ink, 0.72, 0.82, 1);
    // Open botanical watercolor sketchbook, porcelain teacup & brass hand-loupe resting on tabletop!
    p.fillPath(polyPath([[cx - 72, topY - 14], [cx + 8, topY - 22], [cx + 18, topY + 10], [cx - 62, topY + 18]]), PAL.paper, 0.99);
    p.burin(`M${f(cx - 32)} ${f(topY - 18)}L${f(cx - 22)} ${f(topY + 14)}`, PAL.inkMid, 0.48, 0.72, 1, "hatch");
    p.fillPath(ellipsePath(cx - 48, topY + 1, 12, 8), PAL.sageLt, 0.7);
    p.fillPath(ellipsePath(cx - 6, topY - 3, 10, 7), PAL.cinnabarLt, 0.65);
    p.burinContour(polyPath([[cx - 72, topY - 14], [cx + 8, topY - 22], [cx + 18, topY + 10], [cx - 62, topY + 18]]), PAL.ink, 0.52, 0.78, 4);
    // Porcelain saucer & teacup
    p.fillPath(ellipsePath(cx + 58, topY + 4, 20, 8), PAL.paper, 0.98);
    p.fillPath(ellipsePath(cx + 58, topY - 5, 13, 6), PAL.petal, 0.99);
    p.fillPath(ellipsePath(cx + 58, topY - 5, 9, 3.8), PAL.ochre, 0.72);
    p.burinContour(ellipsePath(cx + 58, topY + 4, 20, 8) + ellipsePath(cx + 58, topY - 5, 13, 6), PAL.ink, 0.5, 0.78, 2);
}
/** Draws a distant whitewashed Mediterranean hillside village cluster using PathBatcher (2–5px micro-windows!). */
function drawHillsideVillage(p) {
    const b = new PathBatcher();
    const houses = [
        [540, 398, 34, 26, false],
        [572, 386, 42, 38, false],
        [610, 394, 30, 28, false],
        [638, 360, 20, 62, true], // slender stone campanile belltower!
        [658, 390, 38, 34, false],
        [694, 400, 34, 26, false],
        [726, 394, 28, 30, false],
        [752, 406, 32, 22, false],
        [820, 412, 30, 22, false],
        [848, 404, 36, 28, false],
    ];
    for (const [x, y, w, h, isTower] of houses) {
        const split = w * 0.62;
        b.rect("vLit", x, y, split, h, { fill: PAL.paperWarm, fillOpacity: 0.95 });
        b.rect("vShd", x + split, y, w - split, h, { fill: PAL.paperShadow, fillOpacity: 0.92 });
        // Terracotta pitched roof
        if (isTower) {
            b.addPath("vRoof", `M${f(x - 2)} ${f(y)}L${f(x + w * 0.5)} ${f(y - 16)}L${f(x + w + 2)} ${f(y)}Z`, { fill: PAL.copper, fillOpacity: 0.95 });
            b.rect("vWin", x + 5, y + 6, 4, 9, { fill: PAL.prussianDk, fillOpacity: 0.85 });
            b.rect("vWin", x + 11, y + 6, 4, 9, { fill: PAL.prussianDk, fillOpacity: 0.85 });
        }
        else {
            b.addPath("vRoof", `M${f(x - 3)} ${f(y + 1)}L${f(x + split * 0.5)} ${f(y - 9)}L${f(x + w + 2)} ${f(y + 1)}Z`, { fill: PAL.copper, fillOpacity: 0.92 });
            const cols = Math.max(2, Math.floor(split / 8));
            const rows = Math.max(1, Math.floor(h / 10));
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const lit = p.r() < 0.3;
                    b.rect(lit ? "vLitWin" : "vWin", x + 3 + c * 7.5, y + 5 + r * 9.5, 3.8, 5.2, {
                        fill: lit ? PAL.windowLit : PAL.windowDim,
                        fillOpacity: 0.88,
                    });
                }
            }
        }
    }
    b.flush(p);
}
/** Draws a recessed Mediterranean stone-voussoir arched villa window (4x4 muntins), 24-louver wood shutters & wrought-iron Juliet railing! */
function drawVillaLouveredWindow(p, x, y, w, h, lit) {
    const b = new PathBatcher();
    const cx = x + w * 0.5;
    const rx = w * 0.5;
    const springY = y + rx;
    const botY = y + h;
    const archD = `M${f(x)} ${f(botY)}V${f(springY)}A${f(rx)} ${f(rx)} 0 0 1 ${f(x + w)} ${f(springY)}V${f(botY)}Z`;
    const outerRx = rx + 18;
    const outerArchD = `M${f(x - 18)} ${f(botY + 6)}V${f(springY)}A${f(outerRx)} ${f(outerRx)} 0 0 1 ${f(x + w + 18)} ${f(springY)}V${f(botY + 6)}Z`;
    // 1. Carved limestone voussoir architrave surround & radial mortar joints + keystone
    b.addPath("stoneSur", outerArchD, { fill: PAL.paperWarm, fillOpacity: 0.99 });
    b.addPath("stoneShd", `M${f(x - 18)} ${f(botY + 6)}H${f(x + w + 18)}V${f(botY + 18)}H${f(x - 18)}Z`, { fill: PAL.paperStone, fillOpacity: 0.99 });
    for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        b.line("vous", cx + Math.cos(a) * rx, springY + Math.sin(a) * rx, cx + Math.cos(a) * outerRx, springY + Math.sin(a) * outerRx, {
            stroke: PAL.inkMid,
            strokeWidth: 0.48,
            strokeOpacity: 0.65,
            nonScaling: "hatch",
        });
    }
    const keyPts = [[cx - 9, y - 24], [cx + 9, y - 24], [cx + 6.5, y + 2], [cx - 6.5, y + 2]];
    b.quad("key", keyPts[0], keyPts[1], keyPts[2], keyPts[3], { fill: PAL.paper, fillOpacity: 0.99 });
    // 2. Deep recessed masonry reveal shadow + interior glazing & subtle interior bookshelves/drapes
    b.addPath("reveal", archD, { fill: PAL.slateDk, fillOpacity: 0.96 });
    const inX = x + 6;
    const inW = w - 12;
    const inRx = inW * 0.5;
    const inArchD = `M${f(inX)} ${f(botY - 2)}V${f(springY + 2)}A${f(inRx)} ${f(inRx)} 0 0 1 ${f(inX + inW)} ${f(springY + 2)}V${f(botY - 2)}Z`;
    b.addPath("glassBg", inArchD, { fill: lit ? PAL.windowLit : PAL.glass, fillOpacity: lit ? 0.92 : 0.82 });
    // Subtle recessed botanical interior room shadows (drapery fold & shelf silhouette behind glazing)
    b.rect("intShade", inX + 4, springY + 6, 24, botY - springY - 8, { fill: lit ? PAL.ochre : PAL.slate, fillOpacity: 0.28 });
    b.rect("intShade", inX + inW - 28, springY + 6, 24, botY - springY - 8, { fill: lit ? PAL.ochre : PAL.slate, fillOpacity: 0.28 });
    for (let sy = springY + 42; sy < botY - 14; sy += 34) {
        b.line("intShelf", inX + 26, sy, inX + inW - 26, sy, { stroke: lit ? PAL.umber : PAL.slateDk, strokeWidth: 0.55, strokeOpacity: 0.26, nonScaling: "hatch" });
    }
    // Diagonal glass reflection glint across panes
    b.addPath("glint", `M${f(inX + 14)} ${f(springY + 65)}L${f(inX + 86)} ${f(springY + 6)}M${f(inX + 24)} ${f(botY - 24)}L${f(inX + inW - 16)} ${f(springY + 52)}`, {
        stroke: PAL.inkRim,
        strokeWidth: 0.85,
        strokeOpacity: 0.44,
        nonScaling: "hatch",
    });
    // 3. Crisp 4x4 dark-bronze casement muntins + radial semicircular fanlight spokes!
    b.line("munt", inX, springY + 2, inX + inW, springY + 2, { stroke: PAL.slateDk, strokeWidth: 1.35, strokeOpacity: 0.92, nonScaling: "contour" });
    for (let c = 1; c < 4; c++) {
        const mx = inX + (inW * c) / 4;
        b.line("munt", mx, springY + 2, mx, botY - 2, { stroke: PAL.slateDk, strokeWidth: c === 2 ? 1.4 : 0.72, strokeOpacity: 0.9, nonScaling: "contour" });
    }
    for (let r = 1; r < 4; r++) {
        const my = springY + 2 + ((botY - springY - 4) * r) / 4;
        b.line("munt", inX, my, inX + inW, my, { stroke: PAL.slateDk, strokeWidth: 0.72, strokeOpacity: 0.88, nonScaling: "contour" });
    }
    for (let sp = 1; sp <= 5; sp++) {
        const a = Math.PI + (sp / 6) * Math.PI;
        b.line("munt", cx, springY + 2, cx + Math.cos(a) * inRx, springY + 2 + Math.sin(a) * inRx, {
            stroke: PAL.slateDk,
            strokeWidth: 0.65,
            strokeOpacity: 0.88,
            nonScaling: "contour",
        });
    }
    b.addPath("winOut", outerArchD + archD + polyPath(keyPts), { stroke: PAL.ink, strokeWidth: 0.68, strokeOpacity: 0.82, nonScaling: "contour" });
    // 4. Pair of Open Folded Sage-Green Wood Shutters with 24 Individual Horizontal Wood Louvers Each + Forged Iron Hinges!
    const shW = 68;
    const shTop = springY - 12;
    const shH = botY - shTop;
    for (const sx of [x - 18 - shW, x + w + 18]) {
        // Cast shutter shadow onto stone wall
        b.rect("shShd", sx + 6, shTop + 8, shW, shH, { fill: PAL.ink, fillOpacity: 0.22 });
        // Outer painted wood stiles & recessed louver cavity
        b.rect("shWood", sx, shTop, shW, shH, { fill: PAL.sageDk, fillOpacity: 0.98 });
        b.rect("shRec", sx + 9, shTop + 10, shW - 18, shH - 20, { fill: PAL.sage, fillOpacity: 0.92 });
        b.rect("shWood", sx + 4, shTop + shH * 0.48 - 4, shW - 8, 8, { fill: PAL.sageDk, fillOpacity: 0.99 });
        // 24 crisp angled horizontal wood louvers (12 upper bay + 12 lower bay!)
        const louversPerHalf = 12;
        for (let half = 0; half < 2; half++) {
            const yStart = half === 0 ? shTop + 13 : shTop + shH * 0.48 + 7;
            const yEnd = half === 0 ? shTop + shH * 0.48 - 6 : shTop + shH - 12;
            for (let lv = 0; lv < louversPerHalf; lv++) {
                const ly = yStart + ((yEnd - yStart) * lv) / (louversPerHalf - 1);
                b.line("louverShd", sx + 10, ly + 1.8, sx + shW - 10, ly + 1.8, { stroke: PAL.ink, strokeWidth: 0.56, strokeOpacity: 0.72, nonScaling: "hatch" });
                b.line("louverHi", sx + 10, ly, sx + shW - 10, ly, { stroke: PAL.sageLt, strokeWidth: 0.46, strokeOpacity: 0.78, nonScaling: "hatch" });
            }
        }
        // Forged iron strap hinges
        const isLeft = sx < x;
        const hx = isLeft ? sx + shW - 18 : sx;
        for (const hy of [shTop + 26, shTop + shH - 32]) {
            b.rect("hinge", hx, hy, 18, 4.2, { fill: PAL.slateDk, fillOpacity: 0.96 });
        }
        b.addPath("shOut", `M${f(sx)} ${f(shTop)}H${f(sx + shW)}V${f(shTop + shH)}H${f(sx)}Z`, {
            stroke: PAL.ink,
            strokeWidth: 0.65,
            strokeOpacity: 0.84,
            nonScaling: "contour",
        });
    }
    // 5. Wrought-Iron Juliet Balcony with Stone Corbels, 18 Fine Vertical Pickets & Central Scroll Medallion!
    const jX0 = x - 14;
    const jX1 = x + w + 14;
    const jTop = botY - 58;
    const jBot = botY + 8;
    b.rect("corb", jX0 + 14, jBot + 4, 14, 18, { fill: PAL.paperStone, fillOpacity: 0.98 });
    b.rect("corb", jX1 - 28, jBot + 4, 14, 18, { fill: PAL.paperStone, fillOpacity: 0.98 });
    b.line("jIron", jX0, jTop, jX1, jTop, { stroke: PAL.slateDk, strokeWidth: 1.8, strokeOpacity: 0.96, nonScaling: "contour" });
    b.line("jIron", jX0, jTop + 9, jX1, jTop + 9, { stroke: PAL.slateDk, strokeWidth: 0.95, strokeOpacity: 0.92, nonScaling: "contour" });
    b.line("jIron", jX0, jBot, jX1, jBot, { stroke: PAL.slateDk, strokeWidth: 1.6, strokeOpacity: 0.96, nonScaling: "contour" });
    const pickets = 18;
    for (let i = 0; i <= pickets; i++) {
        const px = jX0 + ((jX1 - jX0) * i) / pickets;
        b.line("jPick", px, jTop, px, jBot, { stroke: PAL.slateDk, strokeWidth: i === 0 || i === pickets ? 1.3 : 0.72, strokeOpacity: 0.92, nonScaling: "contour" });
    }
    b.circle("jScroll", cx, (jTop + 9 + jBot) * 0.5, 13, { stroke: PAL.slateDk, strokeWidth: 0.9, strokeOpacity: 0.92, nonScaling: "contour" });
    b.circle("jScroll", cx - 18, (jTop + 9 + jBot) * 0.5, 7, { stroke: PAL.slateDk, strokeWidth: 0.72, strokeOpacity: 0.88, nonScaling: "contour" });
    b.circle("jScroll", cx + 18, (jTop + 9 + jBot) * 0.5, 7, { stroke: PAL.slateDk, strokeWidth: 0.72, strokeOpacity: 0.88, nonScaling: "contour" });
    b.flush(p);
}
/** Draws a swung-open multi-pane French conservatory casement door leaf beside the archway! */
function drawFrenchCasementLeaf(p, hingeX, topY, botY, leafW, side) {
    const b = new PathBatcher();
    const outerX = hingeX + side * leafW;
    const skewY = 8; // slight 3D open-angle perspective!
    const tl = side < 0 ? [outerX, topY - skewY] : [hingeX, topY];
    const tr = side < 0 ? [hingeX, topY] : [outerX, topY - skewY];
    const br = side < 0 ? [hingeX, botY] : [outerX, botY + skewY];
    const bl = side < 0 ? [outerX, botY + skewY] : [hingeX, botY];
    // Cast shadow onto stone villa wall behind open casement leaf
    b.quad("shd", [tl[0] + side * 8, tl[1] + 10], [tr[0] + side * 8, tr[1] + 10], [br[0] + side * 8, br[1] + 10], [bl[0] + side * 8, bl[1] + 10], {
        fill: PAL.ink,
        fillOpacity: 0.24,
    });
    // Painted sage-bronze wooden casement stiles & lower solid kick-panel
    b.quad("frame", tl, tr, br, bl, { fill: PAL.sageDk, fillOpacity: 0.98 });
    const cols = 2;
    const rows = 4;
    for (let r = 0; r < rows; r++) {
        const v0 = 0.05 + r * 0.175;
        const v1 = v0 + 0.145;
        for (let c = 0; c < cols; c++) {
            const u0 = 0.1 + c * 0.42;
            const u1 = u0 + 0.36;
            const q0 = lerp(lerp(tl, tr, u0), lerp(bl, br, u0), v0);
            const q1 = lerp(lerp(tl, tr, u1), lerp(bl, br, u1), v0);
            const q2 = lerp(lerp(tl, tr, u1), lerp(bl, br, u1), v1);
            const q3 = lerp(lerp(tl, tr, u0), lerp(bl, br, u0), v1);
            b.quad("pane", q0, q1, q2, q3, { fill: PAL.glass, fillOpacity: 0.74 });
            b.line("glint", q0[0] + 3, q0[1] + 8, q1[0] - 4, q0[1] + 3, { stroke: PAL.inkRim, strokeWidth: 0.45, strokeOpacity: 0.56, nonScaling: "hatch" });
            b.addPath("muntin", `M${f(q0[0])} ${f(q0[1])}L${f(q1[0])} ${f(q1[1])}L${f(q2[0])} ${f(q2[1])}L${f(q3[0])} ${f(q3[1])}Z`, {
                stroke: PAL.ink,
                strokeWidth: 0.52,
                strokeOpacity: 0.82,
                nonScaling: "contour",
            });
        }
    }
    // Raised moulded lower kick-panel + brass cremone espagnolette handle!
    const k0 = lerp(lerp(tl, tr, 0.12), lerp(bl, br, 0.12), 0.78);
    const k1 = lerp(lerp(tl, tr, 0.88), lerp(bl, br, 0.88), 0.78);
    const k2 = lerp(lerp(tl, tr, 0.88), lerp(bl, br, 0.88), 0.94);
    const k3 = lerp(lerp(tl, tr, 0.12), lerp(bl, br, 0.12), 0.94);
    b.quad("kick", k0, k1, k2, k3, { fill: PAL.sage, fillOpacity: 0.88 });
    b.addPath("rim", `M${f(tl[0])} ${f(tl[1])}L${f(tr[0])} ${f(tr[1])}L${f(br[0])} ${f(br[1])}L${f(bl[0])} ${f(bl[1])}Z`, {
        stroke: PAL.ink,
        strokeWidth: 0.72,
        strokeOpacity: 0.86,
        nonScaling: "contour",
    });
    const handleU = side < 0 ? 0.18 : 0.82;
    const hPt = lerp(lerp(tl, tr, handleU), lerp(bl, br, handleU), 0.58);
    b.rect("brass", hPt[0] - 2.5, hPt[1] - 14, 5, 28, { fill: PAL.brassLt, fillOpacity: 0.96 });
    b.flush(p);
}
export function buildS06Dewdrop() {
    const p = new Painter("s06", 607);
    const clearBox = requiredPortalClearBox(S06_PORTAL, NEXT_PORTAL);
    const sealBox = requiredPortalSealBox(S06_PORTAL);
    // Crisp architectural arched French conservatory doorway (ZERO oval dewdrop collar!)
    const hole = archDoorwayHole(clearBox, {
        padL: 58,
        padR: 58,
        padTop: 22,
        padBot: 46,
        archRise: 74,
        pointed: false,
        sealBox,
    });
    // Gradients
    const skyGrad = p.linearGrad("sky", 0, BLEED.y0, 0, 560, [
        [0, PAL.paper],
        [0.58, PAL.paperWarm],
        [1, PAL.paperDeep],
    ]);
    const villaWallGrad = p.linearGrad("villa", 1180, 140, 2680, 1020, [
        [0, PAL.paperWarm],
        [0.52, PAL.paperStone],
        [1, PAL.paperDeep],
    ]);
    const roofGrad = p.linearGrad("roof", 1420, -240, 1420, 224, [
        [0, PAL.cinnabarLt],
        [0.5, PAL.copper],
        [1, PAL.cinnabarDk],
    ]);
    // 1. Full-bleed backdrop cutout
    p.asymmetricPortalBackdrop(hole, skyGrad, { smooth: false });
    p.clippedToBackdrop(hole, () => {
        // 2. Nocturnal Starfield & Clean Waxing Crescent Moon (upper sky, visible at Night!)
        p.layer("var(--z-star-op)", () => {
            const sb = new PathBatcher();
            for (let i = 0; i < 64; i++) {
                sb.circle("star", rand(p.r, -280, 2400), rand(p.r, -200, 380), rand(p.r, 1.0, 2.3), {
                    fill: PAL.lanternCore,
                    fillOpacity: 0.84,
                });
            }
            sb.addPath("moon", "M282 102A34 34 0 1 0 302 166A26 26 0 1 1 282 102Z", { fill: PAL.lanternCore, fillOpacity: 0.94 });
            sb.flush(p);
        });
        // Delicate archival cirrus sky wisps & gliding coastal V-birds
        p.animGroup({ kind: "drift", ampX: 44, ampY: -8, freq: 0.42, phase: 0.6 }, () => {
            const birds = [
                [420, 152, 0.95], [478, 178, 0.74], [542, 134, 0.84], [980, 118, 0.78], [1038, 140, 0.65],
            ];
            let bD = "";
            for (const [bx, by, sc] of birds) {
                bD += `M${f(bx - 15 * sc)} ${f(by + 3 * sc)}Q${f(bx - 6 * sc)} ${f(by - 7 * sc)} ${f(bx)} ${f(by)}Q${f(bx + 6 * sc)} ${f(by - 7 * sc)} ${f(bx + 15 * sc)} ${f(by + 3 * sc)}`;
            }
            p.burinContour(bD, PAL.inkMid, 0.92, 0.76, birds.length);
        });
        // 3. Layered Atmospheric Mediterranean Coastal Hills, Distant Whitewashed Village & Shimmering Sea!
        // Far atmospheric celadon headland
        p.fillPath(closedSmooth([[-380, 480], [-80, 355], [240, 318], [580, 368], [940, 305], [1340, 375], [1340, 520], [-380, 520]]), PAL.celadonLt, 0.58);
        // Mid warm-limestone & olive coastal ridge supporting the tiny hillside village
        p.fillPath(closedSmooth([[-380, 505], [40, 428], [380, 396], [660, 412], [960, 434], [1320, 442], [1320, 560], [-380, 560]]), PAL.sageLt, 0.66);
        drawHillsideVillage(p);
        // Shimmering Mediterranean Sea Bay (y = 452..650, x = -380..1260) with broken turquoise dashes & sailboats!
        const seaQuad = [[-380, 452], [1260, 452], [1260, 655], [-380, 655]];
        p.fillPath(polyPath(seaQuad), PAL.glass, 0.94);
        p.brokenWaterReflections(seaQuad, { base: false, primary: PAL.water, deep: PAL.azurite, shimmer: PAL.waterShimmer }, { rows: 34, opacity: 0.84 });
        // 3 Tiny Gliding Mediterranean Sailboats on the bay (data-anim="drift"!)
        p.animGroup({ kind: "drift", ampX: 28, ampY: 0, freq: 0.35, phase: 0.4 }, () => {
            const sb = new PathBatcher();
            for (const [sx, sy, sc] of [[315, 512, 1.0], [835, 488, 0.72], [1040, 536, 0.88]]) {
                sb.addPath("hull", `M${f(sx - 16 * sc)} ${f(sy)}H${f(sx + 16 * sc)}L${f(sx + 11 * sc)} ${f(sy + 5 * sc)}H${f(sx - 11 * sc)}Z`, { fill: PAL.umberDk, fillOpacity: 0.92 });
                sb.addPath("sail", `M${f(sx - 2 * sc)} ${f(sy - 2 * sc)}L${f(sx - 2 * sc)} ${f(sy - 28 * sc)}L${f(sx + 14 * sc)} ${f(sy - 3 * sc)}Z`, { fill: PAL.paper, fillOpacity: 0.95 });
                sb.addPath("sail2", `M${f(sx - 4 * sc)} ${f(sy - 3 * sc)}L${f(sx - 4 * sc)} ${f(sy - 21 * sc)}L${f(sx - 14 * sc)} ${f(sy - 3 * sc)}Z`, { fill: PAL.paperWarm, fillOpacity: 0.9 });
            }
            sb.flush(p);
        });
        // 4. 5-Tone @devteamdrew Stipple Cypresses, Stone Pines & Olive Trees framing the coastal terrace!
        stippleTreeCluster(p, p.r, [
            { cx: 95, cy: 365, rx: 72, ry: 220, spire: 1.55, trunkBaseY: 635, trunkWidth: 11, density: 1.3 },
            { cx: 235, cy: 395, rx: 58, ry: 195, spire: 1.6, trunkBaseY: 635, trunkWidth: 9, density: 1.25 },
            { cx: -65, cy: 435, rx: 145, ry: 135, spire: 0, trunkBaseY: 645, trunkWidth: 18, density: 1.2 },
            { cx: 415, cy: 525, rx: 118, ry: 88, spire: 0, trunkBaseY: 640, trunkWidth: 12, density: 1.15 },
            { cx: 1095, cy: 488, rx: 105, ry: 125, spire: 1.25, trunkBaseY: 645, trunkWidth: 11, density: 1.2 },
        ], {
            palette: {
                deepCore: PAL.sageDk,
                darkBody: PAL.sageDk,
                midOlive: PAL.sage,
                litSage: PAL.sageLt,
                sunCrown: PAL.celadonLt,
                trunk: PAL.bark,
            },
            dabSize: 7.4,
            groundShadow: false,
        });
        // 5. Finely Carved 26-Baluster Italianate Limestone Terrace Balustrade overlooking the sea! (PathBatcher!)
        const bal = new PathBatcher();
        const balX0 = -360;
        const balX1 = 1230;
        const railY = 626;
        const plinthY = 768;
        // Top coping rail & molded bottom plinth
        bal.rect("copingTop", balX0, railY - 12, balX1 - balX0, 12, { fill: PAL.paper, fillOpacity: 0.99 });
        bal.rect("copingFace", balX0, railY, balX1 - balX0, 22, { fill: PAL.paperStone, fillOpacity: 0.99 });
        bal.rect("plinthTop", balX0, plinthY, balX1 - balX0, 14, { fill: PAL.paperWarm, fillOpacity: 0.99 });
        bal.rect("plinthFace", balX0, plinthY + 14, balX1 - balX0, 32, { fill: PAL.paperStone, fillOpacity: 0.99 });
        bal.line("copingLine", balX0, railY, balX1, railY, { stroke: PAL.inkMid, strokeWidth: 0.6, strokeOpacity: 0.72, nonScaling: "contour" });
        bal.line("copingLine", balX0, railY + 22, balX1, railY + 22, { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.74, nonScaling: "contour" });
        bal.line("copingLine", balX0, plinthY, balX1, plinthY, { stroke: PAL.inkMid, strokeWidth: 0.6, strokeOpacity: 0.72, nonScaling: "contour" });
        // 26 Sculpted classical limestone balusters + 3 paneled balustrade stone piers!
        const pierXs = [150, 675, 1185];
        for (let x = -320; x <= 1150; x += 52) {
            if (pierXs.some((px) => Math.abs(x - px) < 42))
                continue;
            const tY = railY + 22;
            const bY = plinthY;
            const mY = (tY + bY) * 0.56;
            const bD = `M${f(x - 10)} ${f(tY)}H${f(x + 10)}L${f(x + 6)} ${f(tY + 22)}Q${f(x + 14)} ${f(mY)} ${f(x + 8)} ${f(bY - 16)}` +
                `L${f(x + 12)} ${f(bY)}H${f(x - 12)}L${f(x - 8)} ${f(bY - 16)}Q${f(x - 14)} ${f(mY)} ${f(x - 6)} ${f(tY + 22)}Z`;
            bal.addPath("balLit", bD, { fill: PAL.paperWarm, fillOpacity: 0.99 });
            bal.rect("balShd", x + 1, tY + 2, 9, bY - tY - 4, { fill: PAL.slateLt, fillOpacity: 0.36 });
            bal.addPath("balLine", bD, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.62, nonScaling: "hatch" });
        }
        // 3 Paneled Limestone Balustrade Piers crowned with sculpted Medici Urns!
        for (const px of pierXs) {
            bal.rect("pierSun", px - 32, railY - 18, 48, plinthY - railY + 64, { fill: PAL.paperWarm, fillOpacity: 0.99 });
            bal.rect("pierShd", px + 16, railY - 14, 18, plinthY - railY + 60, { fill: PAL.slateLt, fillOpacity: 0.52 });
            bal.rect("copingTop", px - 38, railY - 28, 76, 12, { fill: PAL.paper, fillOpacity: 0.99 });
            bal.rect("panel", px - 22, railY + 24, 28, plinthY - railY - 26, { fill: PAL.paperDeep, fillOpacity: 0.72 });
            bal.addPath("copingLine", `M${f(px - 32)} ${f(railY - 18)}V${f(plinthY + 46)}M${f(px + 16)} ${f(railY - 18)}V${f(plinthY + 46)}`, {
                stroke: PAL.inkMid,
                strokeWidth: 0.55,
                strokeOpacity: 0.7,
                nonScaling: "contour",
            });
            // Carved stone Medici urn atop pier
            const uY = railY - 28;
            bal.addPath("pierSun", `M${f(px - 14)} ${f(uY)}H${f(px + 14)}L${f(px + 9)} ${f(uY - 14)}Q${f(px + 24)} ${f(uY - 30)} ${f(px + 22)} ${f(uY - 48)}H${f(px - 22)}Q${f(px - 24)} ${f(uY - 30)} ${f(px - 9)} ${f(uY - 14)}Z`, { fill: PAL.paperStone, fillOpacity: 0.99 });
        }
        bal.flush(p);
        // Tiny trailing rosemary/olive tufts in the 3 Medici balustrade urns
        stippleTreeCluster(p, p.r, pierXs.map((px) => ({ cx: px, cy: railY - 88, rx: 36, ry: 26, density: 0.9 })), {
            palette: { deepCore: PAL.sageDk, darkBody: PAL.sageDk, midOlive: PAL.sage, litSage: PAL.sageLt, sunCrown: PAL.celadonLt, accent: PAL.cinnabarLt },
            dabSize: 4.5,
            groundShadow: false,
        });
        // 6. Sunlit Mediterranean Villa / Conservatory Right Architectural Wing (x = 1210..2780, y = -280..1080)!
        const wallQuad = [[1210, 210], [2780, 175], [2780, 1085], [1210, 1045]];
        p.fillPath(polyPath(wallQuad), villaWallGrad, 0.99);
        // Coursed warm limestone ashlar blocks & carved corner quoins via PathBatcher (ZERO flat beige wall!)
        const ash = new PathBatcher();
        let rowIdx = 0;
        for (let y = 235; y < 1060; y += 34) {
            ash.line("mortar", 1210, y, 2780, y - 8, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.34, nonScaling: "hatch" });
            for (let x = 1215 + (rowIdx % 2) * 44; x < 2760; x += 88) {
                ash.line("mortar", x, y, x, y + 34, { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.3, nonScaling: "hatch" });
                if (p.r() < 0.24) {
                    ash.rect(p.r() < 0.5 ? "warmBlk" : "coolBlk", x + 1, y + 1, 86, 32, {
                        fill: p.r() < 0.5 ? PAL.paperWarm : PAL.paperShadow,
                        fillOpacity: 0.28,
                    });
                }
            }
            // Alternating rusticated stone corner quoins along the villa's sunlit left corner (x = 1210)!
            const qw = rowIdx % 2 === 0 ? 52 : 34;
            ash.rect("quoin", 1210, y + 1, qw, 31, { fill: PAL.paperWarm, fillOpacity: 0.94 });
            ash.addPath("qEdge", `M1210 ${f(y)}H${f(1210 + qw)}V${f(y + 33)}H1210Z`, { stroke: PAL.inkMid, strokeWidth: 0.48, strokeOpacity: 0.56, nonScaling: "hatch" });
            rowIdx++;
        }
        // Recessed stone belt course string-moulding across the facade
        ash.rect("belt", 1204, 738, 1576, 18, { fill: PAL.paperWarm, fillOpacity: 0.98 });
        ash.rect("beltShd", 1204, 756, 1576, 10, { fill: PAL.inkMid, fillOpacity: 0.22 });
        ash.line("beltLn", 1204, 738, 2780, 738, { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.72, nonScaling: "contour" });
        ash.flush(p);
        // Sloped Mediterranean Terracotta Barrel-Tile Conservatory Roof Eaves & Timber Rafter Tails (y = -280..235)!
        const roofPoly = [[1165, 224], [1285, -260], [2780, -280], [2780, 195]];
        p.fillPath(polyPath(roofPoly), roofGrad, 0.99);
        p.fillPath(polyPath([[1165, 224], [2780, 195], [2780, 248], [1185, 262]]), PAL.umberDk, 0.96);
        p.scallopedRoofTiles(roofPoly, 30, 22, PAL.inkSepia, 0.62);
        // Crisp PathBatcher 0.42px scalloped terracotta barrel-pantile courses & sunlit ridge ribs across y = -240..224!
        const roofB = new PathBatcher();
        const tilePitchX = 32;
        const tilePitchY = 20;
        for (let row = 0; row < 24; row++) {
            const yBase = 216 - row * tilePitchY;
            if (yBase < -250)
                break;
            const tFrac = Math.max(0, Math.min(1, (224 - yBase) / 484));
            const xStart = lerp([1168, 0], [1285, 0], tFrac)[0];
            let courseD = "";
            let hiD = "";
            for (let tx = xStart; tx < 2765; tx += tilePitchX) {
                const slopeY = yBase - ((tx - 1168) / 1612) * 28;
                courseD += `M${f(tx)} ${f(slopeY)}Q${f(tx + tilePitchX * 0.5)} ${f(slopeY + 9.5)} ${f(tx + tilePitchX)} ${f(slopeY)}`;
                hiD += `M${f(tx + 5)} ${f(slopeY - 3)}Q${f(tx + tilePitchX * 0.5)} ${f(slopeY + 4)} ${f(tx + tilePitchX - 5)} ${f(slopeY - 3)}`;
                if (row === 0) {
                    // Sweeping barrel-tile vertical pan ribs climbing up the roof slope
                    const xTop = tx + 115;
                    roofB.line("panRib", tx, slopeY, xTop, slopeY - 460, { stroke: PAL.inkSepia, strokeWidth: 0.4, strokeOpacity: 0.42, nonScaling: "hatch" });
                    roofB.line("panHi", tx + 10, slopeY, xTop + 10, slopeY - 460, { stroke: PAL.ochreLt, strokeWidth: 0.36, strokeOpacity: 0.24, nonScaling: "hatch" });
                }
            }
            roofB.addPath("pantile", courseD, { stroke: PAL.ink, strokeWidth: 0.46, strokeOpacity: 0.52, nonScaling: "hatch" });
            roofB.addPath("pantileHi", hiD, { stroke: PAL.cinnabarLt, strokeWidth: 0.4, strokeOpacity: 0.36, nonScaling: "hatch" });
        }
        roofB.flush(p);
        // Exposed carved timber eaves rafter tails + frieze cornice (PathBatcher!)
        const eaves = new PathBatcher();
        for (let rx = 1195; rx < 2760; rx += 38) {
            const ey = lerp([1195, 224], [2760, 196], (rx - 1195) / 1565)[1];
            eaves.rect("rafter", rx, ey + 2, 12, 26, { fill: PAL.umber, fillOpacity: 0.96 });
            eaves.rect("rafterShd", rx + 12, ey + 6, 7, 22, { fill: PAL.ink, fillOpacity: 0.34 });
        }
        eaves.line("eaveLn", 1165, 224, 2780, 195, { stroke: PAL.ink, strokeWidth: 0.9, strokeOpacity: 0.86, nonScaling: "contour" });
        eaves.flush(p);
        // Upper-Right Recessed Stone-Voussoir Arched Conservatory Windows with 4x4 Muntins, 24-Louver Wood Shutters & Wrought-Iron Juliet Railings!
        drawVillaLouveredWindow(p, 1960, 365, 196, 278, true);
        drawVillaLouveredWindow(p, 2310, 361, 178, 274, false);
        // 7. Open Arched French Casement Conservatory Doorway Framing (1490, 590) -> s07 Atelier!
        // Swung-open multi-pane French casement door leaves folded cleanly back on left & right jambs!
        const archL = clearBox.x0 - 58; // ~1337
        const archR = clearBox.x1 + 58; // ~1689
        const archBot = clearBox.y1 + 46; // ~723
        const archSpring = clearBox.y0 - 6; // ~511
        drawFrenchCasementLeaf(p, archL - 10, archSpring, archBot + 6, 118, -1);
        drawFrenchCasementLeaf(p, archR + 10, archSpring, archBot + 6, 118, 1);
        // Stepped carved limestone doorway threshold stairs descending from French doorway onto terrace!
        const steps = new PathBatcher();
        for (let st = 0; st < 3; st++) {
            const sx0 = archL - 24 - st * 22;
            const sx1 = archR + 24 + st * 22;
            const sy = archBot + 6 + st * 22;
            steps.rect("stTop", sx0, sy, sx1 - sx0, 12, { fill: PAL.paper, fillOpacity: 0.99 });
            steps.rect("stFace", sx0, sy + 12, sx1 - sx0, 10, { fill: PAL.paperStone, fillOpacity: 0.99 });
            steps.line("stLn", sx0, sy, sx1, sy, { stroke: PAL.inkMid, strokeWidth: 0.55, strokeOpacity: 0.72, nonScaling: "contour" });
        }
        steps.flush(p);
        // Glowing Wrought-Iron Wall Lanterns flanking the French Conservatory Doorway!
        p.wroughtScrollwork([archL - 115, 448], [archL - 44, 434], 1, 0.85, PAL.ink);
        p.hangingLantern({ cx: archL - 50, cy: 462, w: 46, h: 68, cordLen: 26, style: "gas", swayAmp: 1.8, freq: 0.95, phase: 0.3 });
        p.wroughtScrollwork([archR + 115, 448], [archR + 44, 434], -1, 0.85, PAL.ink);
        p.hangingLantern({ cx: archR + 50, cy: 462, w: 46, h: 68, cordLen: 26, style: "gas", swayAmp: 1.8, freq: 1.05, phase: 1.7 });
        // Lush Crisp 3-Bract Pointed Crimson/Coral Bougainvillea & Pointed Ivy Garland framing the conservatory doorway!
        drawBougainvilleaGarland(p);
        // 8. Receding Perspective Travertine & Terracotta Mosaic Courtyard Terrace Floor (y = 812..1880)!
        p.fillPath(`M${BLEED.x0} 812H${BLEED.x1}V${BLEED.y1}H${BLEED.x0}Z`, PAL.paperWarm, 0.99);
        const tileB = new PathBatcher();
        const tRows = 12;
        const tCols = 16;
        for (let r = 0; r < tRows; r++) {
            const v0 = Math.pow(r / tRows, 1.18);
            const v1 = Math.pow((r + 1) / tRows, 1.18);
            const y0 = 812 + v0 * 960;
            const y1 = 812 + v1 * 960;
            tileB.line("grout", BLEED.x0, y0, BLEED.x1, y0, { stroke: PAL.inkMid, strokeWidth: 0.38, strokeOpacity: 0.42, nonScaling: "hatch" });
            for (let c = -2; c < tCols + 2; c++) {
                const u0 = c / tCols;
                const u1 = (c + 1) / tCols;
                const xTop0 = -200 + u0 * 2800;
                const xTop1 = -200 + u1 * 2800;
                const xBot0 = -760 + u0 * 3920;
                const xBot1 = -760 + u1 * 3920;
                const p00 = [lerp([xTop0, 0], [xBot0, 0], v0)[0], y0];
                const p10 = [lerp([xTop1, 0], [xBot1, 0], v0)[0], y0];
                const p11 = [lerp([xTop1, 0], [xBot1, 0], v1)[0], y1];
                const p01 = [lerp([xTop0, 0], [xBot0, 0], v1)[0], y1];
                if ((r + c) % 2 === 0) {
                    tileB.quad("tileWarm", p00, p10, p11, p01, { fill: PAL.ochreLt, fillOpacity: 0.24 });
                }
                else if ((r * 3 + c) % 7 === 0) {
                    tileB.quad("tileClay", p00, p10, p11, p01, { fill: PAL.copper, fillOpacity: 0.14 });
                }
                if (r === 0) {
                    tileB.line("grout", xTop0, 812, xBot0, 1772, { stroke: PAL.inkMid, strokeWidth: 0.38, strokeOpacity: 0.4, nonScaling: "hatch" });
                }
            }
        }
        // Subtle cast villa wall shadow across upper terrace tiles + weathered travertine micro-paving grain on right terrace!
        tileB.quad("wallShd", [1210, 812], [2780, 812], [2780, 915], [1165, 915], { fill: PAL.inkMid, fillOpacity: 0.14 });
        for (let i = 0; i < 92; i++) {
            const sx = 1220 + rand(p.r, 0, 1420);
            const sy = 818 + rand(p.r, 0, 138);
            const sl = rand(p.r, 12, 46);
            tileB.line("stoneGr", sx, sy, sx + sl, sy, { stroke: PAL.inkSepia, strokeWidth: 0.34, strokeOpacity: 0.24, nonScaling: "hatch" });
        }
        // Subtle inset decorative travertine border band running along the right terrace promenade (y = 928..946)
        tileB.line("trimLn", 1210, 926, 2760, 926, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.42, nonScaling: "hatch" });
        tileB.line("trimLn", 1210, 944, 2760, 944, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.42, nonScaling: "hatch" });
        tileB.flush(p);
        // 9. Stepped Carved Marble Lotus Reflecting Basin on Lower-Right Terrace (x = 1135..2680, y = 965..1880)!
        const curbPts = [[1095, 1880], [1185, 965], [2780, 965], [2780, 1005], [1232, 1005], [1152, 1880]];
        p.fillPath(polyPath(curbPts), PAL.paperStone, 0.99);
        p.burinContour(`M1095 1880L1185 965H2780M1152 1880L1232 1005H2780`, PAL.inkMid, 0.72, 0.74, 2);
        const pondQuad = [[1232, 1005], [2780, 1005], [2780, 1880], [1152, 1880]];
        p.fillPath(polyPath(pondQuad), PAL.glass, 0.98);
        p.brokenWaterReflections(pondQuad, { base: PAL.celadonLt, primary: PAL.water, deep: PAL.waterDeep, shimmer: PAL.waterShimmer }, {
            rows: 54,
            opacity: 0.9,
            reflectBands: [
                { u0: 0.08, u1: 0.46, v0: 0.04, v1: 0.42, color: PAL.celadon },
                { u0: 0.34, u1: 0.78, v0: 0.16, v1: 0.68, color: PAL.water },
                { u0: 0.56, u1: 0.92, v0: 0.34, v1: 0.85, color: PAL.celadonDk },
            ],
        });
        // Extra fine horizontal broken turquoise & celadon mineral reflection strokes across basin
        const pondB = new PathBatcher();
        for (let i = 0; i < 68; i++) {
            const py = 1022 + rand(p.r, 0, 740);
            const px = 1235 + rand(p.r, 0, 1320);
            const len = rand(p.r, 26, 98);
            const col = i % 3 === 0 ? PAL.celadon : i % 3 === 1 ? PAL.water : PAL.waterDeep;
            pondB.line(`pr-${i % 3}`, px, py, px + len, py, { stroke: col, strokeWidth: rand(p.r, 0.8, 1.8), strokeOpacity: 0.48, nonScaling: "contour" });
        }
        pondB.flush(p);
        // Organic tapered Q shimmer ripples on the lotus basin
        p.animGroup({ kind: "ripple", ampX: 14, baseOp: 0.56, ampOp: 0.2, freq: 0.85, phase: 0.5 }, () => {
            const rb = new PathBatcher();
            for (let i = 0; i < 16; i++) {
                const ry = 1045 + i * 44 + rand(p.r, -10, 10);
                const rx = 1275 + (i % 4) * 310 + rand(p.r, -35, 35);
                const len = rand(p.r, 48, 118);
                const hh = rand(p.r, 1.6, 3.2);
                rb.addPath("rip", `M${f(rx)} ${f(ry)}Q${f(rx + len * 0.5)} ${f(ry - hh)} ${f(rx + len)} ${f(ry)}Q${f(rx + len * 0.5)} ${f(ry + hh)} ${f(rx)} ${f(ry)}Z`, {
                    fill: PAL.waterShimmer,
                    fillOpacity: 0.74,
                });
            }
            rb.flush(p);
        });
        // Layered Nelumbo Lotus Pads, 3 Porcelain Blossoms & Swaying Reeds in the Marble Basin!
        drawLotusPad(p, 1465, 1195, 175, 102, PAL.malachite, PAL.sageDk, 14);
        drawLotusPad(p, 1885, 1135, 195, 112, PAL.celadon, PAL.sageDk, 16);
        drawLotusPad(p, 2240, 1280, 215, 122, PAL.sage, PAL.sageDk, 16);
        drawLotusPad(p, 1645, 1445, 225, 126, PAL.celadonDk, PAL.sageDk, 16);
        drawLotusPad(p, 2145, 1510, 240, 134, PAL.malachite, PAL.sageDk, 16);
        p.animGroup({ kind: "sway", cx: 1945, cy: 1320, ampDeg: 1.5, freq: 0.8, phase: 0.9 }, () => {
            p.lotusBlossom(1945, 1215, 112, PAL.petal, PAL.petalBlush);
        });
        p.animGroup({ kind: "sway", cx: 1485, cy: 1460, ampDeg: 1.8, freq: 0.9, phase: 2.1 }, () => {
            p.lotusBlossom(1485, 1365, 86, PAL.petal, PAL.petalBlush);
        });
        p.animGroup({ kind: "sway", cx: 2265, cy: 1540, ampDeg: 1.4, freq: 0.72, phase: 3.0 }, () => {
            p.lotusBlossom(2265, 1425, 124, PAL.petal, PAL.petalBlush);
        });
        // 2 Swaying Budding Nelumbo Lotus Stems & Blush Buds rising cleanly from the turquoise basin!
        drawLotusBud(p, 1692, 1252, 1662, 1098, 1.04, 0.6);
        drawLotusBud(p, 2078, 1385, 2108, 1246, 0.88, 2.3);
        // 10. Terrace Bistro Table, Tiny Scale Visitors, Potted Olive Tree & 3D Fibonacci Agave/Echeveria Planters!
        // Tiny @claudeai / @kiuzyx botanical terrace visitors strolling beside the balustrade overlooking the sea!
        p.scaleFigures([
            { x: 355, y: 862, h: 66, coat: PAL.cinnabar, kind: "dress", dir: 1 },
            { x: 404, y: 865, h: 70, coat: PAL.prussianLt, kind: "coat", dir: -1 },
            { x: 905, y: 846, h: 62, coat: PAL.ochre, kind: "parasol", dir: -1 },
        ], { shadowDir: [1.12, 0.26], shadowOpacity: 0.26, flush: true });
        // Wrought-iron botanical terrace bistro table with sketchbook & teacup
        drawTerraceBistroTable(p, 725, 965);
        // Potted Gnarled Mediterranean Olive Tree in a Cobalt-Glazed Ceramic Jar beside the Villa Corner (x=1055)
        drawPlanterPot(p, 1045, 845, 152, 102, 134, {
            fill: PAL.azurite,
            light: PAL.celadonLt,
            shade: PAL.prussianDk,
            glazed: true,
        });
        stippleTreeCluster(p, p.r, [{ cx: 1038, cy: 665, rx: 112, ry: 96, trunkBaseY: 848, trunkWidth: 13, density: 1.3 }], {
            palette: {
                deepCore: PAL.sageDk,
                darkBody: PAL.sageDk,
                midOlive: PAL.sage,
                litSage: PAL.celadonLt,
                sunCrown: PAL.sageLt,
                trunk: PAL.bark,
            },
            dabSize: 6.4,
            groundShadow: false,
        });
        // Second Glazed Majolica Ceramic Mediterranean Citrus (Lemon!) & Rosemary Planter grounding the bare right terrace (x = 2055, y = 835)!
        drawPlanterPot(p, 2055, 838, 146, 98, 122, {
            fill: PAL.azurite,
            light: PAL.celadonLt,
            shade: PAL.prussianDk,
            glazed: true,
        });
        stippleTreeCluster(p, p.r, [{ cx: 2052, cy: 718, rx: 108, ry: 78, trunkBaseY: 842, trunkWidth: 11, density: 1.3 }], {
            palette: {
                deepCore: PAL.sageDk,
                darkBody: PAL.sageDk,
                midOlive: PAL.sage,
                litSage: PAL.sageLt,
                sunCrown: PAL.celadonLt,
                trunk: PAL.bark,
            },
            dabSize: 5.8,
            groundShadow: false,
        });
        // Tiny sunlit Mediterranean lemons nestled in the right potted citrus canopy!
        const citB = new PathBatcher();
        for (const [lx, ly] of [
            [2005, 706], [2038, 678], [2088, 694], [2116, 732], [2062, 742], [1988, 736], [2024, 725], [2096, 718],
        ]) {
            citB.addPath("lemon", ellipsePath(lx, ly, 6.2, 4.8), { fill: PAL.ochreLt, fillOpacity: 0.96 });
            citB.addPath("lemHi", ellipsePath(lx - 1.5, ly - 1.2, 2.2, 1.4), { fill: PAL.paper, fillOpacity: 0.72 });
            citB.addPath("lemOut", ellipsePath(lx, ly, 6.2, 4.8), { stroke: PAL.inkSepia, strokeWidth: 0.36, strokeOpacity: 0.65, nonScaling: "hatch" });
        }
        citB.flush(p);
        // Small Terracotta Trailing-Rosemary Pot flanking the far-right conservatory wall (x = 2258, y = 865)
        drawPlanterPot(p, 2258, 868, 108, 72, 92, { fill: PAL.copper, light: PAL.cinnabarLt, shade: PAL.cinnabarDk });
        stippleTreeCluster(p, p.r, [{ cx: 2258, cy: 816, rx: 68, ry: 44, density: 1.15 }], {
            palette: {
                deepCore: PAL.sageDk,
                darkBody: PAL.sageDk,
                midOlive: PAL.sage,
                litSage: PAL.sageLt,
                sunCrown: PAL.cinnabarLt,
                accent: PAL.petalBlush,
            },
            dabSize: 4.8,
            groundShadow: false,
        });
        // Hero Sculpted Terracotta Planters with Lush 3D Acuminate Fibonacci Agave & Echeveria Rosettes!
        const agaveBlade = (s) => Math.pow(Math.max(0, 1 - s), 0.58) * (0.42 + 0.75 * Math.pow(s, 0.35));
        drawPlanterPot(p, 425, 1065, 252, 174, 212, { fill: PAL.copper, light: PAL.cinnabarLt, shade: PAL.cinnabarDk });
        p.rosette3D({
            cx: 425,
            cy: 1038,
            radius: 238,
            count: 32,
            viewDeg: 22,
            fill: PAL.celadon,
            deepFill: PAL.sageDk,
            youngFill: PAL.celadonLt,
            dyingFill: PAL.sageDk,
            veinColor: PAL.vein,
            bladeShape: agaveBlade,
        });
        p.animGroup({ kind: "sway", cx: 315, cy: 1095, ampDeg: 2.0, freq: 1.0, phase: 0.2 }, () => {
            p.veinedFern({ origin: [315, 1095], dir: rad(134), len: 210, maxW: 46, pairs: 9, bend: 0.28, fill: PAL.sage, shadeFill: PAL.sageDk });
        });
        // Lower-Left Cobalt Ceramic Urn with Blush Echeveria Rosette
        drawPlanterPot(p, 148, 1295, 224, 156, 186, {
            fill: PAL.azurite,
            light: PAL.prussianLt,
            shade: PAL.prussianDk,
            glazed: true,
        });
        p.rosette3D({
            cx: 148,
            cy: 1272,
            radius: 178,
            count: 28,
            viewDeg: 20,
            fill: PAL.celadon,
            deepFill: PAL.celadonDk,
            youngFill: PAL.petalBlush,
            dyingFill: PAL.sageDk,
            veinColor: PAL.vein,
            bladeShape: agaveBlade,
        });
        // Mid-Foreground Terracotta Pot with Small Golden-Sage Agave beside Brass Watering Can
        drawPlanterPot(p, 988, 1245, 172, 118, 146, { fill: PAL.copper, light: PAL.cinnabarLt, shade: PAL.cinnabarDk });
        p.rosette3D({
            cx: 988,
            cy: 1222,
            radius: 145,
            count: 26,
            viewDeg: 24,
            fill: PAL.sage,
            deepFill: PAL.sageDk,
            youngFill: PAL.celadonLt,
            dyingFill: PAL.sageDk,
            veinColor: PAL.vein,
            bladeShape: agaveBlade,
        });
        // Gleaming Brass Long-Spout Botanical Watering Can on foreground terrace tiles (cleanly clear of planters!)
        const wcX = 674;
        const wcY = 1235;
        p.fillPath(ellipsePath(wcX + 22, wcY + 112, 86, 20), PAL.inkMid, "var(--z-shadow-op)");
        p.doubleGlaze([[wcX + 44, wcY + 64], [wcX + 166, wcY - 28], [wcX + 174, wcY - 19], [wcX + 52, wcY + 86]], PAL.brass, PAL.brassDk, { smooth: false, thinPx: 0.44, thickPx: 0.82 });
        p.fillPath(ellipsePath(wcX + 175, wcY - 26, 15, 24), PAL.brassLt, 0.94);
        const handleSpine = sample(cubic([wcX - 48, wcY + 16], [wcX - 118, wcY - 16], [wcX - 112, wcY + 96], [wcX - 44, wcY + 96]), 12);
        p.calligraphicStroke(handleSpine, 6.8, 8.5, 5.8, PAL.brassDk, 0.95);
        const canBody = [[wcX - 52, wcY], [wcX + 52, wcY], [wcX + 57, wcY + 108], [wcX, wcY + 118], [wcX - 57, wcY + 108]];
        p.doubleGlaze(canBody, PAL.brass, PAL.brassDk, { smooth: false, thinPx: 0.45, thickPx: 0.88 });
        p.burinHatch(canBody, rad(90), 7, cylinderTone([wcX, wcY + 54], [0, 1], 56, LIGHT), { color: PAL.inkSepia, opacity: 0.48 });
        p.fillPath(ellipsePath(wcX, wcY, 52, 14), PAL.brassLt, 0.96);
        p.fillPath(ellipsePath(wcX + 5, wcY + 1, 30, 8), PAL.inkSepia, 0.72);
        p.burinContour(ellipsePath(wcX, wcY, 52, 14), PAL.ink, 0.68, 0.84, 1);
        // 2 Hovering Archival Botanical Hawk-Moths cleanly clear of buds over the foreground agave terrace & lotus pond
        drawBotanicalMoth(p, 295, 920, 0.94, -18, 0.5);
        drawBotanicalMoth(p, 1528, 1054, 0.9, 14, 2.2);
        p.flush();
    }, false, "s06-clip");
    // 11. Sleek Carved Limestone Voussoir Architrave & Moulded Reveal Framing the French Casement Opening!
    // Crisp thin architectural frame (ZERO thick oval collar!) that frames s07 cleanly even at 6x!
    const holePoly = polyPath(hole);
    const expandArch = (dxM, dyT, dyB) => hole.map(([x, y]) => [x + (x < clearBox.cx ? -dxM : dxM), y + (y < clearBox.cy ? -dyT : dyB)]);
    const innerSoffit = expandArch(7, 7, 5);
    const outerArch = expandArch(22, 22, 12);
    p.fillPath(polyPath(outerArch) + holePoly, PAL.paperWarm, 0.99, true);
    p.fillPath(polyPath(innerSoffit) + holePoly, PAL.slateLt, 0.54, true);
    // Radial dressed limestone arch voussoirs + carved projecting keystone!
    const vB = new PathBatcher();
    for (let i = 0; i < hole.length; i += 2) {
        const a = hole[i];
        const b = outerArch[i];
        if (a[1] < clearBox.cy + 14) {
            vB.line("vJoint", a[0], a[1], b[0], b[1], { stroke: PAL.inkMid, strokeWidth: 0.52, strokeOpacity: 0.68, nonScaling: "hatch" });
        }
    }
    // Carved keystone at exact crown of the arch (index 10 of 20-seg semicircular arch) with crisp stonework outline
    const apex = hole[10];
    const keyPts = [[apex[0] - 11, apex[1] - 28], [apex[0] + 11, apex[1] - 28], [apex[0] + 8, apex[1] - 1], [apex[0] - 8, apex[1] - 1]];
    vB.quad("keystone", keyPts[0], keyPts[1], keyPts[2], keyPts[3], { fill: PAL.paper, fillOpacity: 0.99 });
    vB.addPath("archLn", holePoly + polyPath(innerSoffit) + polyPath(outerArch) + polyPath(keyPts), { stroke: PAL.ink, strokeWidth: 0.78, strokeOpacity: 0.84, nonScaling: "contour" });
    vB.flush(p);
    p.moonRim(hole.slice(0, 21), { closed: false, up: true, widthPx: 0.95 });
    p.flush();
    return {
        index: 6,
        id: "s06-dewdrop",
        title: "Mediterranean Botanical Terrace",
        subtitle: "Coastal balustrade, bougainvillea garland, 3D Fibonacci agaves, lotus basin & French doorway",
        portal: S06_PORTAL,
        coreColorDay: [236, 232, 222],
        coreColorNight: [18, 27, 45],
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
