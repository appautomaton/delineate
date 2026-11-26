// Octave 02 — Dense Mid-Rise Brick/Tile Street Canyon, Streetcar & Carved Timber Sanmon Sanctuary Gate.
// Stage-5 5x Micro-Craft Overhaul (direct @kiuzyx _1.jpg & _2.jpg urban canyon parity via PathBatcher):
//   - 12+ ultra-dense overlapping Beaux-Arts, Gothic limestone, brownstone & Miesian skyscrapers
//     (`curtainSkyscraper3D` + `brickLoftBuilding3D` + custom PathBatcher facades with `12–22` cols
//     x `28–42` floors of micro `2x2`-mullioned windows, real cornice brackets & fluted piers!).
//   - Detailed ground-floor shopfront vitrines with tiny interior displays, sidewalk café tables,
//     raised limestone curbs on BOTH left & right canyon walls, crisp white zebra crosswalks,
//     overhead catenary tram wires with cross-span insulators, cast-iron streetlamps, 48+ crisp
//     micro-pedestrians, 5-tone `stippleTreeCluster` corner trees & detailed clerestory streetcar!
//   - Portal `(1530, 620)` (`[1326..1734, 482..758]` = `408x276`, 0px border in `day-o03.png`!):
//     authentic carved East Asian timber *sanmon* gate with tiled flying eaves, exposed rafter tails
//     (*chuanfu*), multi-tier *dougong* brackets, cylindrical vermilion pillars on carved stone drum
//     bases, folded-back lattice timber doors with brass ring knockers, twin carved stone guardian
//     lanterns (*toro* / `石灯笼`) & swaying silk palace lanterns!
import { PAL, Painter, PathBatcher, P, bilerp, brickLoftBuilding3D, circlePath, curtainSkyscraper3D, ellipsePath, f, lerp, polyPath, quad, rand, rectWindowHole, sample, stippleTreeCluster, } from "../kit.js";
import { BLEED, requiredPortalClearBox, validatePortalHole, } from "./types.js";
export const S02_PORTAL = { cx: 1530, cy: 620, rx: 204, ry: 138 };
const S03_PORTAL = { cx: 870, cy: 940, rx: 170, ry: 115 };
/** Draws a tailored boutique striped storefront awning flush on a masonry ground-floor cornice. */
function drawTailoredAwning(p, tl, tr, br, bl, stripeColor, stripes = 14) {
    const b = new PathBatcher();
    for (let i = 0; i < stripes; i++) {
        const u0 = i / stripes;
        const u1 = (i + 1) / stripes;
        b.quad(i % 2 === 0 ? "col" : "wht", lerp(tl, tr, u0), lerp(tl, tr, u1), lerp(bl, br, u1), lerp(bl, br, u0), {
            fill: i % 2 === 0 ? stripeColor : PAL.petal,
            fillOpacity: 0.98,
        });
    }
    b.addPath("rim", polyPath([tl, tr, br, bl]), { stroke: PAL.ink, strokeWidth: 0.52, strokeOpacity: 0.78, nonScaling: "contour" });
    b.flush(p);
}
/** Draws intricate lacy wrought-iron exterior fire escapes with slatted landings, balusters & stairs! */
function drawFireEscapes(p, x0, x1, topYs) {
    const b = new PathBatcher();
    const w = x1 - x0;
    for (let i = 0; i < topYs.length; i++) {
        const y = topYs[i];
        const h = 32;
        const tilt = 22;
        const bl = [x0, y];
        const br = [x1, y + tilt];
        const tl = [x0, y - h];
        const tr = [x1, y + tilt - h];
        // Floor platform thickness + top & mid handrails
        b.quad("deck", bl, br, [br[0], br[1] + 4], [bl[0], bl[1] + 4], { fill: PAL.ink, fillOpacity: 0.86 });
        b.line("rail", bl[0], bl[1], br[0], br[1], { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.92, nonScaling: "contour" });
        b.line("rail", tl[0], tl[1], tr[0], tr[1], { stroke: PAL.ink, strokeWidth: 0.82, strokeOpacity: 0.92, nonScaling: "contour" });
        const midL = lerp(bl, tl, 0.5);
        const midR = lerp(br, tr, 0.5);
        b.line("web", midL[0], midL[1], midR[0], midR[1], { stroke: PAL.ink, strokeWidth: 0.45, strokeOpacity: 0.78, nonScaling: "hatch" });
        // 18 fine vertical balustrade pickets per landing!
        const bars = 18;
        for (let k = 0; k <= bars; k++) {
            const a = lerp(bl, br, k / bars);
            const c = lerp(tl, tr, k / bars);
            b.line("web", a[0], a[1], c[0], c[1], { stroke: PAL.ink, strokeWidth: 0.46, strokeOpacity: 0.82, nonScaling: "hatch" });
        }
        // Under-landing steel gusset brackets
        b.addPath("rail", `M${f(x0 + 14)} ${f(y + 4)}V${f(y + 24)}L${f(x0 + 38)} ${f(y + 9)}M${f(x1 - 14)} ${f(y + tilt + 4)}V${f(y + tilt + 24)}L${f(x1 - 38)} ${f(y + tilt - 4)}`, {
            stroke: PAL.ink,
            strokeWidth: 0.72,
            strokeOpacity: 0.88,
            nonScaling: "contour",
        });
        // Diagonal zigzag iron stair with stringers, handrail & 10 slatted treads!
        if (i + 1 < topYs.length) {
            const yNext = topYs[i + 1];
            const sTop = i % 2 === 0 ? [x0 + w * 0.16, y] : [x0 + w * 0.84, y + tilt];
            const sBot = i % 2 === 0 ? [x0 + w * 0.8, yNext + tilt - h] : [x0 + w * 0.2, yNext - h];
            b.line("rail", sTop[0], sTop[1], sBot[0], sBot[1], { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.92, nonScaling: "contour" });
            b.line("rail", sTop[0], sTop[1] - 18, sBot[0], sBot[1] - 18, { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.88, nonScaling: "contour" });
            for (let st = 1; st < 10; st++) {
                const pt = lerp(sTop, sBot, st / 10);
                b.line("web", pt[0] - 5, pt[1], pt[0] + 5, pt[1], { stroke: PAL.ink, strokeWidth: 0.52, strokeOpacity: 0.85, nonScaling: "hatch" });
                b.line("web", pt[0], pt[1], pt[0], pt[1] - 18, { stroke: PAL.ink, strokeWidth: 0.38, strokeOpacity: 0.72, nonScaling: "hatch" });
            }
        }
    }
    b.flush(p);
}
/** Draws an iconic elevated cedar-stave & copper-capped rooftop water tower on crisscrossed steel stilts. */
function drawRooftopWaterTower(p, cx, yTop) {
    const tankW = 148;
    const tankH = 142;
    const roofH = 54;
    const tankY = yTop + roofH;
    const legBotY = tankY + tankH + 200;
    const b = new PathBatcher();
    b.line("steel", cx, tankY + tankH, cx, legBotY, { stroke: PAL.ink, strokeWidth: 1.0, strokeOpacity: 0.92, nonScaling: "contour" });
    for (const dx of [-60, -25, 25, 60]) {
        b.line("steel", cx + dx, tankY + tankH - 4, cx + dx * 1.24, legBotY, { stroke: PAL.ink, strokeWidth: 0.88, strokeOpacity: 0.92, nonScaling: "contour" });
    }
    for (let tier = 0; tier < 3; tier++) {
        const ya = tankY + tankH + tier * 60;
        const yb = ya + 60;
        const sa = 1 + tier * 0.08;
        const sb = 1 + (tier + 1) * 0.08;
        b.line("brace", cx - 60 * sa, ya, cx + 60 * sa, ya, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.86, nonScaling: "contour" });
        b.line("brace", cx - 60 * sa, ya, cx + 25 * sb, yb, { stroke: PAL.ink, strokeWidth: 0.56, strokeOpacity: 0.82, nonScaling: "hatch" });
        b.line("brace", cx + 60 * sa, ya, cx - 25 * sb, yb, { stroke: PAL.ink, strokeWidth: 0.56, strokeOpacity: 0.82, nonScaling: "hatch" });
    }
    b.rect("tank", cx - tankW * 0.5, tankY, tankW, tankH, { fill: PAL.umberDk, fillOpacity: 0.99 });
    b.rect("hi", cx - tankW * 0.44, tankY, tankW * 0.3, tankH, { fill: PAL.umber, fillOpacity: 0.72 });
    for (let x = cx - tankW * 0.46; x <= cx + tankW * 0.46; x += 9) {
        b.line("stave", x, tankY, x, tankY + tankH, { stroke: PAL.ink, strokeWidth: 0.44, strokeOpacity: 0.72, nonScaling: "hatch" });
    }
    for (const dy of [16, 40, 62, 84, 104, 122, 134]) {
        b.line("hoop", cx - tankW * 0.51, tankY + dy, cx + tankW * 0.51, tankY + dy, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.86, nonScaling: "contour" });
    }
    b.addPath("cap", `M${f(cx - tankW * 0.58)} ${f(tankY + 4)}L${f(cx)} ${f(yTop)}L${f(cx + tankW * 0.58)} ${f(tankY + 4)}Z`, { fill: PAL.copper, fillOpacity: 0.99 });
    b.addPath("capSh", `M${f(cx)} ${f(yTop)}L${f(cx + tankW * 0.58)} ${f(tankY + 4)}L${f(cx + tankW * 0.12)} ${f(tankY + 4)}Z`, { fill: PAL.umberDk, fillOpacity: 0.44 });
    b.line("steel", cx, yTop, cx, yTop - 20, { stroke: PAL.ink, strokeWidth: 0.8, strokeOpacity: 0.88, nonScaling: "contour" });
    for (let k = -4; k <= 4; k++) {
        b.line("stave", cx, yTop, cx + k * 20, tankY + 4, { stroke: PAL.ink, strokeWidth: 0.45, strokeOpacity: 0.7, nonScaling: "hatch" });
    }
    b.flush(p);
    p.moonRim([[cx - tankW * 0.58, tankY + 4], [cx, yTop]], { closed: false, widthPx: 0.9 });
    p.flush();
}
/** Draws a carved traditional stone guardian lantern (`石灯笼` / toro) flanking the sanctuary steps! */
function drawStoneGuardianLantern(p, cx, baseY) {
    p.layer("var(--z-lume-op)", () => {
        p.fillPath(circlePath(cx, baseY - 54, 28), PAL.lanternHalo, 0.22);
        p.fillPath(circlePath(cx, baseY - 54, 14), PAL.lantern, 0.38);
    });
    const b = new PathBatcher();
    // Ground shadow + stepped hexagonal granite plinth + tapering stone shaft + lotus middle platform
    b.addPath("sh", ellipsePath(cx + 6, baseY + 1, 20, 5), { fill: PAL.inkMid, fillOpacity: 0.26 });
    b.rect("base", cx - 16, baseY - 8, 32, 8, { fill: PAL.paperStone, fillOpacity: 0.99 });
    b.quad("lotus", [cx - 11, baseY - 12], [cx + 11, baseY - 12], [cx + 14, baseY - 8], [cx - 14, baseY - 8], { fill: PAL.paperDeep, fillOpacity: 0.99 });
    b.rect("shaft", cx - 6, baseY - 38, 12, 26, { fill: PAL.paperDeep, fillOpacity: 0.99 });
    b.rect("shelf", cx - 14, baseY - 45, 28, 7, { fill: PAL.paperWarm, fillOpacity: 0.99 });
    // Carved fire-box chamber with warm glowing candle core!
    b.rect("firebox", cx - 9, baseY - 62, 18, 17, { fill: PAL.lantern, fillOpacity: 0.92 });
    b.circle("core", cx, baseY - 54, 3.8, { fill: PAL.lanternCore, fillOpacity: 0.96 });
    // Swept carved stone pagoda cap + upturned eaves + lotus-bud finial (`宝珠`)
    b.addPath("cap", `M${f(cx - 20)} ${f(baseY - 60)}Q${f(cx - 9)} ${f(baseY - 72)} ${f(cx)} ${f(baseY - 79)}Q${f(cx + 9)} ${f(baseY - 72)} ${f(cx + 20)} ${f(baseY - 60)}Z`, {
        fill: PAL.paperStone,
        fillOpacity: 0.99,
    });
    b.circle("finial", cx, baseY - 82, 3.2, { fill: PAL.paperWarm, fillOpacity: 0.99 });
    b.addPath("line", `M${f(cx - 9)} ${f(baseY - 62)}V${f(baseY - 45)}M${f(cx + 9)} ${f(baseY - 62)}V${f(baseY - 45)}M${f(cx)} ${f(baseY - 62)}V${f(baseY - 45)}M${f(cx - 9)} ${f(baseY - 54)}H${f(cx + 9)}`, { stroke: PAL.inkMid, strokeWidth: 0.55, strokeOpacity: 0.82, nonScaling: "contour" });
    b.flush(p);
}
/** Draws crisp cast-iron urban streetlamps with night-only layered halos (`var(--z-lume-op)` = 0 in Day!). */
function drawAlleyLamps(p, pts) {
    p.layer("var(--z-lume-op)", () => {
        const hb = new PathBatcher();
        for (const [x, y, h] of pts) {
            hb.addPath("pool", ellipsePath(x + 12, y + 3, 42, 14), { fill: PAL.lantern, fillOpacity: 0.26 });
            hb.circle("haloOut", x + 12, y - h - 4, 30, { fill: PAL.lanternHalo, fillOpacity: 0.22 });
            hb.circle("haloIn", x + 12, y - h - 4, 14, { fill: PAL.lantern, fillOpacity: 0.36 });
        }
        hb.flush(p);
    });
    const b = new PathBatcher();
    for (const [x, y, h] of pts) {
        b.rect("base", x - 3.2, y - 8, 6.4, 8, { fill: PAL.ink, fillOpacity: 0.92 });
        b.addPath("post", `M${f(x)} ${f(y)}V${f(y - h)}Q${f(x)} ${f(y - h - 10)} ${f(x + 12)} ${f(y - h - 8)}`, {
            stroke: PAL.ink,
            strokeWidth: 0.92,
            strokeOpacity: 0.9,
            nonScaling: "contour",
        });
        b.circle("bulb", x + 12, y - h - 4, 3.6, { fill: PAL.lanternCore, fillOpacity: 0.98 });
    }
    b.flush(p);
}
/** Draws a watertight 3D oblique vintage blue-and-cinnabar urban streetcar with clerestory roof, diamond pantograph & bogies! */
function drawStreetcar(p, x, y) {
    const dx = 252;
    const dy = 72;
    const offX = 40;
    const offY = -20;
    const h = 88;
    const b = new PathBatcher();
    b.quad("sh", [x - 10, y + h + 4], [x + dx + 8, y + dy + h + 4], [x + dx - 18, y + dy + h + 22], [x - 36, y + h + 22], { fill: PAL.inkMid, fillOpacity: 0.36 });
    const fBL = [x, y + h];
    const fTL = [x, y];
    const fBR = [x + offX, y + offY + h];
    const fTR = [x + offX, y + offY];
    const bBL = [x + dx, y + dy + h];
    const bTL = [x + dx, y + dy];
    const bTR = [x + dx + offX, y + dy + offY];
    const bBR = [x + dx + offX, y + dy + offY + h];
    // Recessed steel undercarriage & 4 bogie wheels
    b.quad("bogie", lerp(fTL, fBL, 0.88), lerp(bTL, bBL, 0.88), [bBL[0], bBL[1] + 7], [fBL[0], fBL[1] + 7], { fill: PAL.ink, fillOpacity: 0.98 });
    for (const u of [0.16, 0.28, 0.72, 0.84]) {
        const wp = lerp([fBL[0], fBL[1] + 4], [bBL[0], bBL[1] + 4], u);
        b.circle("wheel", wp[0], wp[1], 7.0, { fill: PAL.cut, fillOpacity: 0.99 });
        b.circle("hub", wp[0], wp[1], 2.6, { fill: PAL.slateLt, fillOpacity: 0.9 });
    }
    b.quad("rear", bTL, bTR, bBR, bBL, { fill: PAL.prussianDk, fillOpacity: 0.99 });
    b.quad("roof", fTL, fTR, bTR, bTL, { fill: PAL.petal, fillOpacity: 0.99 });
    // Raised Victorian Clerestory Monitor Roof with tiny warm transom windows
    const clFL = lerp(lerp(fTL, fTR, 0.2), lerp(bTL, bTR, 0.1), 0.1);
    const clFR = lerp(lerp(fTL, fTR, 0.8), lerp(bTL, bTR, 0.1), 0.1);
    const clBR = lerp(lerp(fTL, fTR, 0.8), lerp(bTL, bTR, 0.9), 0.9);
    const clBL = lerp(lerp(fTL, fTR, 0.2), lerp(bTL, bTR, 0.9), 0.9);
    const clH = 12;
    b.quad("clTop", [clFL[0], clFL[1] - clH], [clFR[0], clFR[1] - clH], [clBR[0], clBR[1] - clH], [clBL[0], clBL[1] - clH], { fill: PAL.paperStone, fillOpacity: 0.99 });
    b.quad("clSide", [clFL[0], clFL[1] - clH], [clBL[0], clBL[1] - clH], clBL, clFL, { fill: PAL.umberDk, fillOpacity: 0.96 });
    for (let k = 0; k < 7; k++) {
        const u0 = 0.06 + k * 0.132;
        const u1 = u0 + 0.092;
        b.quad("clWin", lerp([clFL[0], clFL[1] - clH + 3], [clBL[0], clBL[1] - clH + 3], u0), lerp([clFL[0], clFL[1] - clH + 3], [clBL[0], clBL[1] - clH + 3], u1), lerp([clFL[0], clFL[1] - 2], [clBL[0], clBL[1] - 2], u1), lerp([clFL[0], clFL[1] - 2], [clBL[0], clBL[1] - 2], u0), { fill: PAL.lantern, fillOpacity: 0.9 });
    }
    b.quad("side", fTL, bTL, bBL, fBL, { fill: PAL.petal, fillOpacity: 0.99 });
    b.quad("hull", lerp(fTL, fBL, 0.52), lerp(bTL, bBL, 0.52), bBL, fBL, { fill: PAL.azurite, fillOpacity: 0.99 });
    b.quad("belt", lerp(fTL, fBL, 0.64), lerp(bTL, bBL, 0.64), lerp(bTL, bBL, 0.78), lerp(fTL, fBL, 0.78), { fill: PAL.cinnabar, fillOpacity: 0.99 });
    // Vintage streetcar cab nose with destination sign board, brass headlight bezel & fender cowcatcher
    b.quad("nose", fTL, fTR, fBR, fBL, { fill: PAL.prussian, fillOpacity: 0.99 });
    b.quad("destBox", bilerp(fTL, fTR, fBR, fBL, 0.22, 0.04), bilerp(fTL, fTR, fBR, fBL, 0.78, 0.04), bilerp(fTL, fTR, fBR, fBL, 0.78, 0.13), bilerp(fTL, fTR, fBR, fBL, 0.22, 0.13), { fill: PAL.cinnabar, fillOpacity: 0.96 });
    b.quad("win", lerp(fTL, fBL, 0.17), lerp(fTR, fBR, 0.17), lerp(fTR, fBR, 0.49), lerp(fTL, fBL, 0.49), { fill: PAL.windowLit, fillOpacity: 0.96 });
    b.circle("headRim", x + offX * 0.48, y + h * 0.64, 6.8, { fill: PAL.brass, fillOpacity: 0.98 });
    b.circle("head", x + offX * 0.48, y + h * 0.64, 4.6, { fill: PAL.lanternCore, fillOpacity: 0.99 });
    for (let w = 0; w < 8; w++) {
        const u0 = 0.04 + w * 0.116;
        const u1 = u0 + 0.088;
        const w0 = bilerp(fTL, bTL, bBL, fBL, u0, 0.14);
        const w1 = bilerp(fTL, bTL, bBL, fBL, u1, 0.14);
        const w2 = bilerp(fTL, bTL, bBL, fBL, u1, 0.46);
        const w3 = bilerp(fTL, bTL, bBL, fBL, u0, 0.46);
        b.quad("win", w0, w1, w2, w3, { fill: PAL.windowLit, fillOpacity: 0.95 });
        b.quad("winGlow", w0, w1, w2, w3, { fill: PAL.lanternCore, fillOpacity: "var(--z-lume-op)" });
        // Subtle warm silhouette of seated tram passenger in alternate windows
        if (w % 2 === 1) {
            const pm = bilerp(fTL, bTL, bBL, fBL, (u0 + u1) * 0.5, 0.36);
            b.circle("pass", pm[0], pm[1] - 4, 3.2, { fill: PAL.slateDk, fillOpacity: 0.48 });
            b.rect("pass", pm[0] - 4.5, pm[1] - 1, 9, 8, { fill: PAL.slateDk, fillOpacity: 0.44 });
        }
        b.addPath("mull", polyPath([w0, w1, w2, w3]), { stroke: PAL.ink, strokeWidth: 0.52, strokeOpacity: 0.82, nonScaling: "contour" });
    }
    // Diamond pantograph scissor frame contacting overhead catenary wire!
    const rMid = lerp([clFL[0], clFL[1] - clH], [clBL[0], clBL[1] - clH], 0.48);
    const pTop = [rMid[0] + 10, rMid[1] - 46];
    b.addPath("mull", polyPath([fTL, bTL, bBL, fBL]) +
        polyPath([fTL, fTR, bTR, bTL]) +
        polyPath([fTL, fTR, fBR, fBL]) +
        `M${P(rMid)}L${f(rMid[0] + 24)} ${f(rMid[1] - 22)}L${P(pTop)}L${f(rMid[0] - 10)} ${f(rMid[1] - 24)}Z` +
        `M${f(pTop[0] - 14)} ${f(pTop[1] - 2)}L${f(pTop[0] + 14)} ${f(pTop[1] + 2)}`, { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.86, nonScaling: "contour" });
    b.flush(p);
    // Translucent night-only streetcar headlight glow cone (`0` in Day, soft amber glow at Night!)
    p.layer("var(--z-lume-op)", () => {
        p.fillPath(ellipsePath(x - 20, y + h * 0.72, 42, 18), PAL.lanternHalo, 0.22);
        p.fillPath(ellipsePath(x - 8, y + h * 0.69, 20, 9), PAL.lantern, 0.34);
    });
}
export function buildS02Alley() {
    const p = new Painter("s02", 3120);
    const clearBox = requiredPortalClearBox(S02_PORTAL, S03_PORTAL);
    // `[1326..1734, 482..758]` = `408x276`: strictly inside 484x328 sealBox AND clears 100% of s03's
    // `[1330..1730, 486.7..753.3]` viewport at t=3.0 -> ZERO brown border in day-o03.png!
    const hole = rectWindowHole(clearBox, { padL: 64, padR: 108, padTop: 67, padBot: 49 });
    validatePortalHole("s02", hole, S02_PORTAL, S03_PORTAL);
    const gateX0 = hole[0][0]; // ~1325.9
    const gateY0 = hole[0][1]; // ~482.4
    const gateX1 = hole[2][0]; // ~1733.9
    const gateY1 = hole[2][1]; // ~758.4
    const gateMidX = (gateX0 + gateX1) * 0.5; // ~1530
    const canyonSky = p.linearGrad("sky", 1200, BLEED.y0, 1200, 480, [
        [0, PAL.prussian, 0.92],
        [0.65, PAL.glassTint, 0.95],
        [1, PAL.paperWarm, 1],
    ]);
    p.asymmetricPortalBackdrop(hole, PAL.paper);
    p.clippedToBackdrop(hole, () => {
        // ------------------------------------------------------------------
        // 2. COLOSSAL UPPER SKYLINE BEHIND THE CARVED TIMBER SANMON GATE (`curtainSkyscraper3D`!)
        // ------------------------------------------------------------------
        p.fillPath(`M${BLEED.x0} ${BLEED.y0}H${BLEED.x1}V720H${BLEED.x0}Z`, canyonSky);
        p.flush();
        // Towering Miesian Black-Bronze Curtain-Wall Monolith (`1,300+` micro 4-6px panes!)
        curtainSkyscraper3D(p, {
            cx: 1365, topY: -260, baseY: 430, wL: 340, wR: 560, skewL: 65, skewR: -60, colsL: 16, colsR: 24, rows: 34,
            wallL: PAL.ink, wallR: PAL.prussianDk, glassL: PAL.cut, glassR: PAL.cut, tintFill: PAL.slateDk,
            mullionColor: PAL.ochre, litChance: 0.4, pierEvery: 4, roofDetail: "none",
        });
        // Bold Vermilion-Cinnabar Architectural Loft peeking behind the water tower (`_2.jpg` upper-right!)
        brickLoftBuilding3D(p, {
            cx: 2110, topY: -245, baseY: 445, wL: 200, wR: 185, skewL: 0, skewR: 0, colsL: 9, colsR: 8, floors: 14,
            wallL: PAL.cinnabar, wallR: PAL.cinnabarDk, trimColor: PAL.paperStone, litChance: 0.28, groundFloor: false,
        });
        // Sweeping Prussian-Indigo Tiled Sanctuary Gallery Wing Roof extending beneath water tower
        const wingRoof = [[1540, 385], [2295, 245], [2295, 650], [1640, 650]];
        p.fillPath(polyPath(wingRoof), PAL.prussian, 0.99);
        p.scallopedRoofTiles(wingRoof, 22, 14, PAL.prussianDk, 0.66);
        p.burinContour(polyPath(wingRoof), PAL.ink, 0.65, 0.82, 4);
        p.flush();
        drawRooftopWaterTower(p, 1965, 58);
        // ------------------------------------------------------------------
        // 3. DIAGONAL CANYON AVENUE, RAISED CURBS, BOLD CROSSWALK & COLOSSAL LEFT SKYSCRAPERS!
        // ------------------------------------------------------------------
        p.fillPath(polyPath([[980, 758], [1860, 758], [1860, 1285], [540, 1880], [-380, 1880], [-380, 1480], [780, 920]]), PAL.slate, 0.99);
        // Subtle `PathBatcher` `0.35px` granite paving-stone courses, staggered tramway cobblestone setts,
        // curbside iron storm grates & cast-iron manhole covers across the canyon avenue (`x: 650..1780, y: 760..1240`)!
        const stB = new PathBatcher();
        // Granite paving-stone courses across the sanctuary approach plaza (`y = 795..1180`)
        for (let row = 0; row < 17; row++) {
            const y = 798 + row * 22;
            const xL = Math.max(660, 1248 - row * 34);
            const xR = 1776 - row * 1.4;
            stB.line("course", xL, y, xR, y, { stroke: PAL.inkMid, strokeWidth: 0.35, strokeOpacity: 0.38, nonScaling: "hatch" });
            // Staggered running-bond granite joint ticks
            const offset = (row % 2) * 24;
            for (let x = xL + 18 + offset; x < xR - 14; x += 48) {
                stB.line("course", x, y, x - 3, y + 22, { stroke: PAL.inkMid, strokeWidth: 0.32, strokeOpacity: 0.3, nonScaling: "hatch" });
            }
        }
        // Staggered tramway cobblestone setts running tightly alongside the twin steel streetcar rails!
        for (let s = 0; s < 36; s++) {
            const u = s / 36;
            const ptA = lerp([1085, 952], [1645, 1112], u);
            const ptB = lerp([1070, 976], [1630, 1136], u);
            const mid = lerp(ptA, ptB, 0.5);
            stB.line("sett", ptA[0] - 4, ptA[1] - 5, ptB[0] + 4, ptB[1] + 5, { stroke: PAL.ink, strokeWidth: 0.35, strokeOpacity: 0.36, nonScaling: "hatch" });
            if (s % 2 === 0) {
                stB.line("settHi", mid[0] - 6, mid[1] - 2, mid[0] + 6, mid[1] + 2, { stroke: PAL.paperStone, strokeWidth: 0.32, strokeOpacity: 0.24, nonScaling: "hatch" });
            }
        }
        // Curbside cast-iron storm-drain grates along left & right gutters
        for (const [gx, gy, dx, dy] of [
            [1202, 854, -22, 18],
            [965, 1044, -22, 18],
            [716, 1244, -22, 18],
            [1756, 868, -2, 24],
            [1744, 1082, -2, 24],
        ]) {
            stB.quad("grate", [gx, gy], [gx + dx, gy + dy], [gx + dx + 12, gy + dy + 6], [gx + 12, gy + 6], { fill: PAL.prussianDk, fillOpacity: 0.86 });
            for (let k = 1; k < 5; k++) {
                const a = lerp([gx, gy], [gx + dx, gy + dy], k / 5);
                stB.line("grateBar", a[0], a[1], a[0] + 12, a[1] + 6, { stroke: PAL.slateLt, strokeWidth: 0.38, strokeOpacity: 0.72, nonScaling: "hatch" });
            }
        }
        // Cast-iron inspection manhole covers with concentric rings & crosshatch grip
        for (const [mx, my] of [[1568, 866], [1166, 1082]]) {
            stB.addPath("manhole", ellipsePath(mx, my, 15, 7.5), { fill: PAL.slateDk, fillOpacity: 0.9 });
            stB.addPath("manholeRim", ellipsePath(mx, my, 15, 7.5) + ellipsePath(mx, my, 10, 5) + `M${f(mx - 9)} ${f(my)}H${f(mx + 9)}M${f(mx)} ${f(my - 4.5)}V${f(my + 4.5)}`, {
                stroke: PAL.inkMid,
                strokeWidth: 0.42,
                strokeOpacity: 0.72,
                nonScaling: "hatch",
            });
        }
        stB.flush(p);
        // Continuous sunlit cross-street limestone plaza + raised curb (eliminates awkward dark alley gap under left awning!)
        const leftWalk = [[1085, 766], [1255, 804], [-120, 1880], [-380, 1880], [-380, 1120], [340, 1085], [965, 815]];
        p.fillPath(polyPath(leftWalk), PAL.paperWarm, 0.99);
        // Subtle sunlit paving slabs along the cross-alley terrace
        p.fillPath(polyPath([[315, 1110], [725, 1215], [585, 1320], [315, 1252]]), PAL.paperDeep, 0.42);
        p.fillPath(polyPath([[1255, 804], [1265, 812], [-110, 1888], [-120, 1880]]), PAL.paperStone, 0.99);
        p.burinContour(`M1255 804L-120 1880M1265 812L-110 1888`, PAL.inkMid, 0.72, 0.78, 2);
        // Bold mid-canyon & lower-left white zebra crosswalks + double yellow lines + twin gleaming steel tram rails!
        let cwD = "";
        for (let i = 0; i < 8; i++) {
            const t = i / 7;
            const a = lerp([810, 1132], [1075, 1234], t);
            const b = lerp([872, 1094], [1137, 1196], t);
            cwD += polyPath([a, b, [b[0] + 10, b[1] + 6], [a[0] + 10, a[1] + 6]]);
        }
        for (let i = 0; i < 9; i++) {
            const t = i / 8;
            const a = lerp([240, 1595], [515, 1745], t);
            const b = lerp([308, 1542], [583, 1692], t);
            cwD += polyPath([a, b, [b[0] + 12, b[1] + 8], [a[0] + 12, a[1] + 8]]);
        }
        p.fillPath(cwD, PAL.petal, 0.9);
        p.burinContour(`M1045 1045L-180 1880M1052 1052L-172 1886`, PAL.ochreLt, 0.82, 0.84, 2);
        p.burin(`M1085 952L1645 1112M1070 976L1630 1136`, PAL.inkMid, 0.75, 0.78, 2);
        p.burin(`M1085 950.5L1645 1110.5M1070 974.5L1630 1134.5`, PAL.petal, 0.42, 0.56, 2);
        p.flush();
        // Far-Left Rich Brownstone Masonry Loft (`brickLoftBuilding3D`: 10x18 dense `2x2` muntin sashes + cornice!)
        p.fillPath(polyPath([[-380, 148], [55, 8], [335, 96], [-120, 265]]), PAL.slate, 0.98);
        p.fillPath(polyPath([[-120, 112], [65, 58], [155, 88], [-32, 146]]), PAL.paperStone, 0.99);
        p.fillPath(polyPath([[-32, 146], [155, 88], [155, 168], [-32, 224]]), PAL.paperDeep, 0.99);
        p.flush();
        brickLoftBuilding3D(p, {
            cx: 28, topY: 225, baseY: 1620, wL: 408, wR: 308, skewL: 0, skewR: -129, colsL: 12, colsR: 9, floors: 18,
            wallL: PAL.umberLt, wallR: PAL.umber, trimColor: PAL.paperStone, litChance: 0.28, groundFloor: true,
        });
        // Perspective-true boutique striped awning strictly aligned to brownstone right wall slope (`dy/dx = -129/308 = -0.419`)!
        p.fillPath(polyPath([[76, 1456], [312, 1357], [326, 1398], [90, 1497]]), PAL.ink, 0.36);
        drawTailoredAwning(p, [54, 1432], [294, 1331], [326, 1364], [86, 1465], PAL.cinnabar, 12);
        // COLOSSAL LEFT BEAUX-ARTS / GOTHIC LIMESTONE SKYSCRAPER (800+ micro `2x2` recessed sash windows + fluted piers!)
        const lb = new PathBatcher();
        const lbMull = new PathBatcher();
        const lTL = [315, -280];
        const lTC = [725, -280];
        const lTR = [1135, -280];
        const lBL = [315, 1112];
        const lBC = [725, 1215];
        const lBR = [1135, 882];
        lb.quad("wallL", lTL, lTC, lBC, lBL, { fill: PAL.paperWarm, fillOpacity: 0.99 });
        lb.quad("wallR", lTC, lTR, lBR, lBC, { fill: PAL.paperDeep, fillOpacity: 0.99 });
        const populateGothicFace = (fTL, fTR, fBR, fBL, cols, rows, isLit) => {
            const mU = 0.04;
            const du = (1 - mU * 2) / cols;
            const dv = 0.88 / rows;
            for (let r = 0; r < rows; r++) {
                const v0 = 0.02 + (r + 0.18) * dv;
                const v1 = 0.02 + (r + 0.84) * dv;
                const vm = (v0 + v1) * 0.5;
                if (r > 0 && r % 4 === 0) {
                    const bA = lerp(fTL, fBL, 0.02 + r * dv);
                    const bB = lerp(fTR, fBR, 0.02 + r * dv);
                    lbMull.line("belt", bA[0], bA[1], bB[0], bB[1], { stroke: PAL.inkMid, strokeWidth: 0.58, strokeOpacity: 0.65, nonScaling: "contour" });
                }
                for (let c = 0; c < cols; c++) {
                    const u0 = mU + (c + 0.18) * du;
                    const u1 = mU + (c + 0.82) * du;
                    const um = (u0 + u1) * 0.5;
                    const lit = p.r() < (isLit ? 0.26 : 0.3);
                    const q0 = bilerp(fTL, fTR, fBR, fBL, u0, v0);
                    const q1 = bilerp(fTL, fTR, fBR, fBL, u1, v0);
                    const q2 = bilerp(fTL, fTR, fBR, fBL, u1, v1);
                    const q3 = bilerp(fTL, fTR, fBR, fBL, u0, v1);
                    lb.quad(lit ? "lit" : isLit ? "glL" : "glR", q0, q1, q2, q3, {
                        fill: lit ? PAL.windowLit : isLit ? PAL.slate : PAL.prussianDk,
                        fillOpacity: 0.92,
                    });
                    // Fine 2x2 inner sash muntins in `lbMull` so they NEVER get covered by window fills!
                    const mt = bilerp(fTL, fTR, fBR, fBL, um, v0);
                    const mb = bilerp(fTL, fTR, fBR, fBL, um, v1);
                    const ml = bilerp(fTL, fTR, fBR, fBL, u0, vm);
                    const mr = bilerp(fTL, fTR, fBR, fBL, u1, vm);
                    lbMull.line("munt", mt[0], mt[1], mb[0], mb[1], { stroke: PAL.paperWarm, strokeWidth: 0.36, strokeOpacity: 0.74, nonScaling: "hatch" });
                    lbMull.line("munt", ml[0], ml[1], mr[0], mr[1], { stroke: PAL.paperWarm, strokeWidth: 0.36, strokeOpacity: 0.74, nonScaling: "hatch" });
                }
            }
            for (let c = 0; c <= cols; c++) {
                const u = mU + c * du;
                const a = bilerp(fTL, fTR, fBR, fBL, u, 0.01);
                const bPt = bilerp(fTL, fTR, fBR, fBL, u, 0.91);
                lbMull.line("pier", a[0], a[1], bPt[0], bPt[1], {
                    stroke: PAL.paperShadow,
                    strokeWidth: c % 3 === 0 ? 0.65 : 0.38,
                    strokeOpacity: 0.72,
                    nonScaling: "hatch",
                });
            }
        };
        populateGothicFace(lTL, lTC, lBC, lBL, 12, 34, true);
        populateGothicFace(lTC, lTR, lBR, lBC, 11, 34, false);
        lbMull.line("arris", lTC[0], lTC[1], lBC[0], lBC[1], { stroke: PAL.ink, strokeWidth: 0.7, strokeOpacity: 0.75, nonScaling: "contour" });
        lb.flush(p);
        lbMull.flush(p);
        // Ground-floor dark shopfront bay + tailored blue-and-white awning on left face
        p.fillPath(polyPath([[332, 1052], [702, 1148], [702, 1212], [332, 1116]]), PAL.prussianDk, 0.96);
        p.fillPath(polyPath([[352, 1072], [682, 1158], [682, 1198], [352, 1112]]), PAL.windowLit, 0.76);
        drawTailoredAwning(p, [332, 1052], [702, 1148], [672, 1188], [302, 1092], PAL.azurite, 14);
        // Rusticated ground-floor base + DENSE `@kiuzyx` `_2.jpg` VERMILION-AND-BRONZE MULTI-PANE SHOPFRONTS!
        p.fillPath(polyPath([[725, 1068], [1135, 746], [1135, 882], [725, 1215]]), PAL.paperStone, 0.99);
        const shopL = [[740, 1078], [818, 1016], [818, 1134], [740, 1196]];
        const shopR = [[946, 916], [1082, 808], [1082, 922], [946, 1030]];
        const shB = new PathBatcher();
        const shM = new PathBatcher();
        for (const [idx, sp] of [shopL, shopR].entries()) {
            const sQ = (u, v) => bilerp(sp[0], sp[1], sp[2], sp[3], u, v);
            const colsS = idx === 0 ? 3 : 4;
            // Vermilion timber cornice + recessed dark-stone lower bulkhead
            shB.quad("frame", sQ(-0.02, -0.04), sQ(1.02, -0.04), sQ(1.02, 1.01), sQ(-0.02, 1.01), { fill: PAL.cinnabarDk, fillOpacity: 0.98 });
            shB.quad("glass", sQ(0.02, 0.04), sQ(0.98, 0.04), sQ(0.98, 0.78), sQ(0.02, 0.78), { fill: PAL.windowLit, fillOpacity: 0.94 });
            shB.quad("bulk", sQ(0.02, 0.79), sQ(0.98, 0.79), sQ(0.98, 0.99), sQ(0.02, 0.99), { fill: PAL.slateDk, fillOpacity: 0.96 });
            // Interior warm boutique ceiling shade, display shelves, miniature art/book stacks & hanging brass pendants!
            shB.quad("ceil", sQ(0.02, 0.04), sQ(0.98, 0.04), sQ(0.98, 0.14), sQ(0.02, 0.14), { fill: PAL.umberDk, fillOpacity: 0.36 });
            shB.quad("shelf1", sQ(0.06, 0.44), sQ(0.94, 0.44), sQ(0.94, 0.5), sQ(0.06, 0.5), { fill: PAL.umber, fillOpacity: 0.85 });
            shB.quad("shelf2", sQ(0.06, 0.64), sQ(0.94, 0.64), sQ(0.94, 0.72), sQ(0.06, 0.72), { fill: PAL.umberDk, fillOpacity: 0.82 });
            for (let d = 0; d < colsS * 2; d++) {
                const du0 = 0.08 + d * (0.82 / (colsS * 2));
                const du1 = du0 + 0.065;
                shB.quad(d % 2 === 0 ? "dispA" : "dispB", sQ(du0, 0.3), sQ(du1, 0.3), sQ(du1, 0.44), sQ(du0, 0.44), {
                    fill: d % 3 === 0 ? PAL.cinnabar : d % 3 === 1 ? PAL.azurite : PAL.ochre,
                    fillOpacity: 0.84,
                });
                shB.quad(d % 2 === 0 ? "dispC" : "dispD", sQ(du0 + 0.01, 0.52), sQ(du1 - 0.005, 0.52), sQ(du1 - 0.005, 0.64), sQ(du0 + 0.01, 0.64), {
                    fill: d % 2 === 0 ? PAL.prussian : PAL.cinnabarLt,
                    fillOpacity: 0.82,
                });
            }
            // Crisp 3x2 / 4x2 vermilion-and-bronze transom & vertical shopfront mullions ON TOP!
            for (let c = 1; c < colsS; c++) {
                const a = sQ(c / colsS, 0.04);
                const bPt = sQ(c / colsS, 0.79);
                shM.line("mullV", a[0], a[1], bPt[0], bPt[1], { stroke: PAL.cinnabarDk, strokeWidth: 0.9, strokeOpacity: 0.94, nonScaling: "contour" });
            }
            for (const tv of [0.24, 0.78]) {
                const a = sQ(0.02, tv);
                const bPt = sQ(0.98, tv);
                shM.line("mullH", a[0], a[1], bPt[0], bPt[1], { stroke: PAL.cinnabarDk, strokeWidth: 0.95, strokeOpacity: 0.95, nonScaling: "contour" });
            }
            // Fine brass transom subdivisions & bulkhead trim frame
            for (let c = 0; c < colsS; c++) {
                const mu = (c + 0.5) / colsS;
                const a = sQ(mu, 0.04);
                const bPt = sQ(mu, 0.24);
                shM.line("brass", a[0], a[1], bPt[0], bPt[1], { stroke: PAL.brassLt, strokeWidth: 0.52, strokeOpacity: 0.84, nonScaling: "hatch" });
            }
            shM.addPath("outer", polyPath(sp), { stroke: PAL.cinnabar, strokeWidth: 1.15, strokeOpacity: 0.95, nonScaling: "contour" });
            shM.addPath("bulkRim", polyPath([sQ(0.06, 0.83), sQ(0.94, 0.83), sQ(0.94, 0.95), sQ(0.06, 0.95)]), { stroke: PAL.brass, strokeWidth: 0.5, strokeOpacity: 0.78, nonScaling: "hatch" });
        }
        shB.flush(p);
        shM.flush(p);
        // Sidewalk café bistro tables & tiny chairs along sunlit limestone walk (`_2.jpg`!)
        let cafeD = "";
        for (const [tx, ty] of [[688, 1228], [625, 1272], [556, 1322], [482, 1372]]) {
            cafeD += ellipsePath(tx, ty, 12, 6) + `M${f(tx)} ${f(ty)}v10M${f(tx - 15)} ${f(ty + 2)}v8M${f(tx + 15)} ${f(ty + 2)}v8`;
        }
        p.fillPath(cafeD, PAL.cinnabar, 0.92);
        p.burinContour(cafeD, PAL.ink, 0.56, 0.8, 12);
        // Carved Gothic limestone archivolt + bronze entrance portal + radial fanlight tracery
        const archDoorD = `M835 1126V962Q835 902 882 872Q928 864 928 920V1052Z`;
        const archSurroundD = `M825 1134V958Q825 892 882 858Q938 850 938 916V1046Z`;
        p.fillPath(archSurroundD, PAL.paperDeep, 0.99);
        p.fillPath(archDoorD, PAL.umberDk, 0.99);
        p.layer("var(--z-lume-op)", () => p.fillPath(archDoorD, PAL.lantern, 0.42));
        p.burinContour(archDoorD + archSurroundD, PAL.brassLt, 0.9, 0.88, 2);
        p.burin(`M882 874V1090M858 914V1108M905 896V1068M835 995L928 955M835 955L928 915M882 935L842 925M882 935L922 895`, PAL.brass, 0.54, 0.8, 7);
        for (const [sx, sy, col] of [[718, 825, PAL.cinnabar], [1116, 612, PAL.cinnabar], [1116, 495, PAL.petal]]) {
            p.fillPath(polyPath([[sx, sy], [sx + 24, sy], [sx + 24, sy + 92], [sx, sy + 92]]), col, 0.98);
            p.burinContour(polyPath([[sx, sy], [sx + 24, sy], [sx + 24, sy + 92], [sx, sy + 92]]), PAL.ink, 0.6, 0.8, 4);
            p.burin(`M${f(sx + 12)} ${f(sy + 14)}v14M${f(sx + 12)} ${f(sy + 36)}v14M${f(sx + 12)} ${f(sy + 58)}v18`, col === PAL.petal ? PAL.cinnabar : PAL.petal, 0.9, 0.88, 3);
        }
        p.flush();
        // ------------------------------------------------------------------
        // 4. CARVED EAST ASIAN TIMBER *SANMON* SANCTUARY GATE (TILED EAVES, RADIATING PANTILE RIBS `瓦垄`,
        //    GILDED FINIALS `鸱吻`, RAFTERS `椽头`, 3-TIER *DOUGONG*, INSCRIBED PLAQUE `匾额` & KUMIKO DOORS!)
        // ------------------------------------------------------------------
        const roofEaveL = [1142, 434];
        const roofEaveR = [1918, 434];
        const ridgeL = [1358, 258];
        const ridgeR = [1702, 258];
        const leftSlopeCurve = sample(quad(ridgeL, [1262, 372], roofEaveL), 12);
        const rightSlopeCurve = sample(quad(ridgeR, [1798, 372], roofEaveR), 12);
        const sanctRoofPoly = [...leftSlopeCurve, [gateMidX, 448], ...[...rightSlopeCurve].reverse()];
        p.fillPath(polyPath(sanctRoofPoly), PAL.prussianDk, 0.99);
        p.fillPath(polyPath([...leftSlopeCurve, [1395, 444], ridgeL]), PAL.prussian, 0.86);
        p.scallopedRoofTiles(sanctRoofPoly, 20, 12, PAL.ink, 0.72);
        // 26 radiating ceramic pantile ribs (`瓦垄`), eaves-end tile medallions (`瓦当`) & gilded ridge finials (`鸱吻`)!
        const rbGate = new PathBatcher();
        for (let i = 1; i < 26; i++) {
            const u = i / 26;
            const topPt = lerp(ridgeL, ridgeR, u);
            const botPt = lerp([roofEaveL[0] + 18, 435], [roofEaveR[0] - 18, 435], u);
            rbGate.line("pantile", topPt[0], topPt[1] + 5, botPt[0], botPt[1], { stroke: PAL.slateLt, strokeWidth: 0.44, strokeOpacity: 0.44, nonScaling: "hatch" });
            rbGate.circle("wadang", botPt[0], botPt[1] + 1, 2.8, { fill: PAL.paperStone, fillOpacity: 0.72 });
        }
        // Upturned ceramic ridge beam + sculpted gilded dragon-tail finials (`鸱吻`)
        rbGate.quad("ridge", [ridgeL[0] - 28, ridgeL[1] - 12], [ridgeR[0] + 28, ridgeR[1] - 12], [ridgeR[0] + 16, ridgeR[1] + 5], [ridgeL[0] - 16, ridgeL[1] + 5], { fill: PAL.slateDk, fillOpacity: 0.99 });
        rbGate.addPath("finial", `M${f(ridgeL[0] - 26)} ${f(ridgeL[1] - 10)}Q${f(ridgeL[0] - 34)} ${f(ridgeL[1] - 28)} ${f(ridgeL[0] - 12)} ${f(ridgeL[1] - 26)}L${f(ridgeL[0] - 10)} ${f(ridgeL[1] - 10)}Z`, { fill: PAL.brass, fillOpacity: 0.96 });
        rbGate.addPath("finial", `M${f(ridgeR[0] + 26)} ${f(ridgeR[1] - 10)}Q${f(ridgeR[0] + 34)} ${f(ridgeR[1] - 28)} ${f(ridgeR[0] + 12)} ${f(ridgeR[1] - 26)}L${f(ridgeR[0] + 10)} ${f(ridgeR[1] - 10)}Z`, { fill: PAL.brass, fillOpacity: 0.96 });
        rbGate.line("ridgeGold", ridgeL[0] - 18, ridgeL[1] - 5, ridgeR[0] + 18, ridgeR[1] - 5, { stroke: PAL.brassLt, strokeWidth: 0.7, strokeOpacity: 0.85, nonScaling: "contour" });
        rbGate.flush(p);
        p.burinContour(polyPath(sanctRoofPoly), PAL.ink, 0.8, 0.88, 12);
        p.moonRim([roofEaveL, ridgeL, ridgeR], { closed: false, up: true, widthPx: 1.05 });
        p.flush();
        // Exposed carved timber rafters (*chuanfu* / `椽头`), multi-tier *dougong* corbel brackets & crossbeam (`额枋`)!
        // STRICT PathBatcher z-order: distinct bucket names for every overlay layer so NOTHING paints under a fill!
        const sb = new PathBatcher();
        sb.rect("eaveSh", 1188, 432, 684, 32, { fill: PAL.umberDk, fillOpacity: 0.99 });
        for (let x = 1196; x <= 1864; x += 14) {
            sb.rect("rafter", x, 433, 6.5, 6, { fill: PAL.ochreLt, fillOpacity: 0.84 });
        }
        for (let x = 1218; x <= 1842; x += 48) {
            sb.quad("dg1", [x - 18, 441], [x + 18, 441], [x + 14, 448], [x - 14, 448], { fill: PAL.cinnabar, fillOpacity: 0.98 });
            sb.quad("dg2", [x - 12, 448], [x + 12, 448], [x + 9, 455], [x - 9, 455], { fill: PAL.ochre, fillOpacity: 0.96 });
            sb.quad("dg3", [x - 7, 455], [x + 7, 455], [x + 6, 462], [x - 6, 462], { fill: PAL.cinnabarDk, fillOpacity: 0.98 });
        }
        sb.rect("beam", 1198, 462, 664, gateY0 - 462, { fill: PAL.cinnabarDk, fillOpacity: 0.99 });
        sb.line("beamGold", 1198, 462, 1862, 462, { stroke: PAL.brassLt, strokeWidth: 0.72, strokeOpacity: 0.86, nonScaling: "contour" });
        sb.line("beamGold", 1198, 471, 1862, 471, { stroke: PAL.brassLt, strokeWidth: 0.52, strokeOpacity: 0.76, nonScaling: "hatch" });
        // Cylindrical vermilion pillars (`柱`), stone drum plinths (`柱础`), folded Kumiko lattice doors (`门扇`) & shoji wings
        for (const side of [-1, 1]) {
            const colX0 = side < 0 ? gateX0 - 34 : gateX1;
            const colX1 = side < 0 ? gateX0 : gateX1 + 34;
            const doorX0 = side < 0 ? colX0 - 44 : colX1;
            const doorX1 = side < 0 ? colX0 : colX1 + 44;
            const shojiX0 = side < 0 ? 1196 : doorX1;
            const shojiX1 = side < 0 ? doorX0 : 1858;
            sb.rect("shoji", shojiX0, gateY0, shojiX1 - shojiX0, gateY1 - gateY0, { fill: PAL.windowLit, fillOpacity: 0.95 });
            sb.rect("wainscot", shojiX0, gateY1 - 66, shojiX1 - shojiX0, 66, { fill: PAL.cinnabar, fillOpacity: 0.96 });
            for (let sy = gateY0 + 24; sy < gateY1 - 66; sy += 24)
                sb.line("shojiLat", shojiX0, sy, shojiX1, sy, { stroke: PAL.umberDk, strokeWidth: 0.5, strokeOpacity: 0.82, nonScaling: "hatch" });
            for (let sx = shojiX0 + 18; sx < shojiX1; sx += 18)
                sb.line("shojiLat", sx, gateY0, sx, gateY1, { stroke: PAL.umberDk, strokeWidth: 0.5, strokeOpacity: 0.82, nonScaling: "hatch" });
            // Folded-back timber gate leaf with Kumiko woodwork lattice (`花格窗`), brass hinges & ring knockers (`铺首`)!
            sb.rect("door", doorX0, gateY0 + 4, doorX1 - doorX0, gateY1 - gateY0 - 10, { fill: PAL.cinnabarDk, fillOpacity: 0.99 });
            sb.rect("doorPanel", doorX0 + 5, gateY0 + 12, doorX1 - doorX0 - 10, 116, { fill: PAL.paperWarm, fillOpacity: 0.88 });
            // Distinct `"doorKumiko"` bucket AFTER `"doorPanel"` so lattice paints ON TOP!
            const dpMidX = (doorX0 + doorX1) * 0.5;
            for (let ly = gateY0 + 24; ly < gateY0 + 126; ly += 16) {
                sb.line("doorKumiko", doorX0 + 5, ly, doorX1 - 5, ly, { stroke: PAL.umberDk, strokeWidth: 0.55, strokeOpacity: 0.88, nonScaling: "hatch" });
            }
            sb.line("doorKumiko", dpMidX, gateY0 + 12, dpMidX, gateY0 + 128, { stroke: PAL.umberDk, strokeWidth: 0.55, strokeOpacity: 0.88, nonScaling: "hatch" });
            sb.line("doorKumiko", doorX0 + 12, gateY0 + 12, doorX0 + 12, gateY0 + 128, { stroke: PAL.umberDk, strokeWidth: 0.38, strokeOpacity: 0.72, nonScaling: "hatch" });
            sb.line("doorKumiko", doorX1 - 12, gateY0 + 12, doorX1 - 12, gateY0 + 128, { stroke: PAL.umberDk, strokeWidth: 0.38, strokeOpacity: 0.72, nonScaling: "hatch" });
            // Brass corner hinge straps & sculpted bronze door-knocker ring (`铺首衔环`)
            sb.rect("doorBrass", doorX0 + 4, gateY0 + 136, doorX1 - doorX0 - 8, 5, { fill: PAL.brass, fillOpacity: 0.92 });
            sb.rect("doorBrass", doorX0 + 4, gateY1 - 24, doorX1 - doorX0 - 8, 5, { fill: PAL.brass, fillOpacity: 0.92 });
            const kx = dpMidX;
            const ky = gateY0 + 168;
            sb.circle("doorBrass", kx, ky, 5.4, { fill: PAL.brassLt, fillOpacity: 0.98 });
            sb.addPath("doorRing", circlePath(kx, ky + 7, 6.5), { stroke: PAL.brassLt, strokeWidth: 0.9, strokeOpacity: 0.96, nonScaling: "contour" });
            // Cylindrical shaded vermilion pillar + octagonal carved granite drum base
            sb.rect("pillar", colX0, gateY0, colX1 - colX0, gateY1 - gateY0 - 24, { fill: PAL.cinnabar, fillOpacity: 0.99 });
            sb.rect("pillarHi", colX0 + 4, gateY0, 9, gateY1 - gateY0 - 24, { fill: PAL.cinnabarLt, fillOpacity: 0.52 });
            sb.rect("pillarSh", colX1 - 9, gateY0, 9, gateY1 - gateY0 - 24, { fill: PAL.cinnabarDk, fillOpacity: 0.56 });
            sb.quad("plinth1", [colX0 - 4, gateY1 - 24], [colX1 + 4, gateY1 - 24], [colX1 + 7, gateY1 - 12], [colX0 - 7, gateY1 - 12], { fill: PAL.paperWarm, fillOpacity: 0.99 });
            sb.quad("plinth2", [colX0 - 7, gateY1 - 12], [colX1 + 7, gateY1 - 12], [colX1 + 9, gateY1 + 6], [colX0 - 9, gateY1 + 6], { fill: PAL.paperStone, fillOpacity: 0.99 });
            sb.addPath("inkRim", polyPath([[colX0, gateY0], [colX1, gateY0], [colX1, gateY1 - 24], [colX0, gateY1 - 24]]), { stroke: PAL.ink, strokeWidth: 0.68, strokeOpacity: 0.82, nonScaling: "contour" });
        }
        // Inscribed Gold-and-Lacquer *Sanmon* Nameplate Plaque (`匾额`) — distinct late buckets so gold border & calligraphy paint ON TOP!
        sb.rect("plaqueFrame", gateMidX - 84, 434, 168, 44, { fill: PAL.brassDk, fillOpacity: 0.99 });
        sb.rect("plaqueBody", gateMidX - 80, 438, 160, 36, { fill: PAL.ink, fillOpacity: 0.99 });
        sb.addPath("plaqueGold", polyPath([[gateMidX - 75, 442], [gateMidX + 75, 442], [gateMidX + 75, 470], [gateMidX - 75, 470]]), { stroke: PAL.brassLt, strokeWidth: 0.9, strokeOpacity: 0.96, nonScaling: "contour" });
        // Stylized gilded 3-glyph sanctuary calligraphy (`山门院`) + crimson hanko seal stamp!
        sb.addPath("plaqueCallig", `M${f(gateMidX - 46)} 448v16M${f(gateMidX - 56)} 452v11h20v-11` +
            `M${f(gateMidX - 11)} 447v18M${f(gateMidX - 11)} 447h22v18M${f(gateMidX - 4)} 453h8M${f(gateMidX - 4)} 459h8` +
            `M${f(gateMidX + 34)} 448h20M${f(gateMidX + 44)} 448v16M${f(gateMidX + 35)} 455h18M${f(gateMidX + 33)} 463h22`, { stroke: PAL.brassLt, strokeWidth: 1.1, strokeOpacity: 0.95, nonScaling: "contour" });
        sb.rect("plaqueSeal", gateMidX - 68, 456, 6, 8, { fill: PAL.cinnabarLt, fillOpacity: 0.94 });
        // Stepped carved granite sanctuary threshold steps + side cheek-blocks (`垂带石`)
        sb.quad("step1", [1192, gateY1], [1866, gateY1], [1884, gateY1 + 18], [1174, gateY1 + 18], { fill: PAL.paperWarm, fillOpacity: 0.99 });
        sb.quad("step2", [1174, gateY1 + 18], [1884, gateY1 + 18], [1902, gateY1 + 38], [1156, gateY1 + 38], { fill: PAL.paperDeep, fillOpacity: 0.99 });
        sb.line("stepLine", 1174, gateY1 + 18, 1884, gateY1 + 18, { stroke: PAL.inkMid, strokeWidth: 0.6, strokeOpacity: 0.72, nonScaling: "contour" });
        sb.flush(p);
        // Twin Carved Stone Guardian Lanterns (`石灯笼` / toro) standing faithfully at the foot of the sanctuary steps!
        drawStoneGuardianLantern(p, 1244, gateY1 + 34);
        drawStoneGuardianLantern(p, 1814, gateY1 + 34);
        // Twin Swaying Silk Palace Lanterns hanging freely from outer upturned sanctuary eaves
        p.hangingLantern({ cx: 1188, cy: 492, w: 32, h: 52, cordLen: 52, style: "palace", swayAmp: 2.8, freq: 1.1, phase: 0.3 });
        p.hangingLantern({ cx: 1872, cy: 492, w: 32, h: 52, cordLen: 52, style: "palace", swayAmp: 2.6, freq: 1.05, phase: 2.1 });
        // ------------------------------------------------------------------
        // 5. RIGHT CANYON: GROUNDED BRICK FIRE-ESCAPE LOFT (`brickLoftBuilding3D`) & LIMESTONE TOWER!
        // ------------------------------------------------------------------
        p.fillPath(polyPath([[1782, 782], [1846, 782], [1846, 1345], [1748, 1312]]), PAL.paperWarm, 0.99);
        p.fillPath(polyPath([[1774, 782], [1782, 782], [1748, 1312], [1740, 1310]]), PAL.paperStone, 0.99);
        p.burinContour(`M1782 782L1748 1312M1774 782L1740 1310`, PAL.inkMid, 0.65, 0.76, 2);
        p.flush();
        // Rooftop gravel deck, parapet, chimney & galvanized HVAC chiller
        const loftRoof = [[1838, 598], [1955, 502], [2295, 598], [2295, 742]];
        p.fillPath(polyPath(loftRoof), PAL.slate, 0.98);
        p.fillPath(polyPath([[1838, 584], [1955, 490], [2295, 586], [2295, 602], [1955, 506], [1838, 600]]), PAL.paperStone, 0.99);
        p.fillPath(polyPath([[1982, 534], [2048, 554], [2068, 540], [2002, 520]]), PAL.inkMid, 0.32);
        p.fillPath(polyPath([[1976, 444], [2036, 462], [2036, 544], [1976, 526]]), PAL.umber, 0.99);
        p.fillPath(polyPath([[2036, 462], [2062, 448], [2062, 530], [2036, 544]]), PAL.umberDk, 0.99);
        p.fillPath(polyPath([[1976, 444], [2002, 430], [2062, 448], [2036, 462]]), PAL.paperStone, 0.99);
        p.fillPath(polyPath([[2118, 534], [2188, 556], [2188, 596], [2118, 574]]), PAL.paperStone, 0.99);
        p.fillPath(polyPath([[2188, 556], [2216, 542], [2216, 582], [2188, 596]]), PAL.slateDk, 0.99);
        p.fillPath(polyPath([[2118, 534], [2146, 520], [2216, 542], [2188, 556]]), PAL.paperWarm, 0.99);
        p.flush();
        // Dense 8x8 2x2-mullioned brick loft facade with projecting limestone lintels/sills & lacy iron fire escapes!
        // Separate `fbMull` flushed strictly AFTER `fb` so `2x2` sash muntins NEVER get buried under `"dk"` window fills!
        const fb = new PathBatcher();
        const fbMull = new PathBatcher();
        const fTL = [1838, 598];
        const fTR = [2295, 742];
        const fBR = [2295, 1460];
        const fBL = [1838, 1315];
        fb.quad("brick", fTL, fTR, fBR, fBL, { fill: PAL.umberLt, fillOpacity: 0.99 });
        for (let i = 1; i < 40; i++) {
            const a = lerp(fTL, fBL, i / 40);
            const bPt = lerp(fTR, fBR, i / 40);
            fb.line("course", a[0], a[1], bPt[0], bPt[1], { stroke: PAL.inkSepia, strokeWidth: 0.3, strokeOpacity: 0.24, nonScaling: "hatch" });
        }
        for (let r = 0; r < 8; r++) {
            const v0 = 0.05 + r * 0.114;
            const v1 = v0 + 0.076;
            const vm = (v0 + v1) * 0.5;
            for (let c = 0; c < 8; c++) {
                const u0 = 0.05 + c * 0.114;
                const u1 = u0 + 0.076;
                const um = (u0 + u1) * 0.5;
                const isLit = p.r() < 0.34;
                // Carved limestone lintel + projecting stone sill + underside sill drop-shadow
                fb.quad("lintel", bilerp(fTL, fTR, fBR, fBL, u0 - 0.008, v0 - 0.011), bilerp(fTL, fTR, fBR, fBL, u1 + 0.008, v0 - 0.011), bilerp(fTL, fTR, fBR, fBL, u1 + 0.008, v0), bilerp(fTL, fTR, fBR, fBL, u0 - 0.008, v0), { fill: PAL.paperWarm, fillOpacity: 0.94 });
                fb.quad("sill", bilerp(fTL, fTR, fBR, fBL, u0 - 0.009, v1), bilerp(fTL, fTR, fBR, fBL, u1 + 0.009, v1), bilerp(fTL, fTR, fBR, fBL, u1 + 0.009, v1 + 0.011), bilerp(fTL, fTR, fBR, fBL, u0 - 0.009, v1 + 0.011), { fill: PAL.paperWarm, fillOpacity: 0.95 });
                fb.quad("sillSh", bilerp(fTL, fTR, fBR, fBL, u0 - 0.008, v1 + 0.011), bilerp(fTL, fTR, fBR, fBL, u1 + 0.008, v1 + 0.011), bilerp(fTL, fTR, fBR, fBL, u1 + 0.008, v1 + 0.018), bilerp(fTL, fTR, fBR, fBL, u0 - 0.008, v1 + 0.018), { fill: PAL.ink, fillOpacity: 0.32 });
                const q0 = bilerp(fTL, fTR, fBR, fBL, u0, v0);
                const q1 = bilerp(fTL, fTR, fBR, fBL, u1, v0);
                const q2 = bilerp(fTL, fTR, fBR, fBL, u1, v1);
                const q3 = bilerp(fTL, fTR, fBR, fBL, u0, v1);
                fb.quad(isLit ? "lit" : "dk", q0, q1, q2, q3, { fill: isLit ? PAL.windowLit : PAL.prussianDk, fillOpacity: 0.95 });
                // Crisp 2x2 double-hung wooden sash frame & muntins painted strictly ON TOP in `fbMull`!
                const mt = bilerp(fTL, fTR, fBR, fBL, um, v0);
                const mb = bilerp(fTL, fTR, fBR, fBL, um, v1);
                const ml = bilerp(fTL, fTR, fBR, fBL, u0, vm);
                const mr = bilerp(fTL, fTR, fBR, fBL, u1, vm);
                fbMull.addPath("sash", polyPath([q0, q1, q2, q3]), { stroke: PAL.paperStone, strokeWidth: 0.62, strokeOpacity: 0.85, nonScaling: "contour" });
                fbMull.line("munt", mt[0], mt[1], mb[0], mb[1], { stroke: PAL.paperWarm, strokeWidth: 0.56, strokeOpacity: 0.88, nonScaling: "contour" });
                fbMull.line("munt", ml[0], ml[1], mr[0], mr[1], { stroke: PAL.paperWarm, strokeWidth: 0.68, strokeOpacity: 0.9, nonScaling: "contour" });
            }
        }
        fb.flush(p);
        fbMull.flush(p);
        drawFireEscapes(p, 1948, 2248, [826, 988, 1152]);
        // Soaring Classical Limestone Corner Tower anchoring Far Right (dense `10x34` micro-mullioned facade!)
        curtainSkyscraper3D(p, {
            cx: 2780, topY: -280, baseY: 1880, wL: 505, wR: 40, skewL: 0, skewR: 0, colsL: 10, colsR: 2, rows: 36,
            wallL: PAL.paperStone, wallR: PAL.paperDeep, glassL: PAL.slateDk, glassR: PAL.prussianDk, litChance: 0.3, roofDetail: "none",
        });
        // Flush belt-course cornice strictly aligned to left wall arris x = 2275 (ZERO overhanging ledge!)
        p.fillPath(polyPath([[2275, 244], [2780, 298], [2780, 332], [2275, 278]]), PAL.paperWarm, 0.99);
        p.burinContour(`M2275 244L2780 298M2275 278L2780 332`, PAL.inkMid, 0.7, 0.8, 2);
        p.flush();
        // ------------------------------------------------------------------
        // 6. OVERHEAD TRAM CATENARY WIRES, STREETLAMPS, STREETCAR, 48 PEDESTRIANS & FOREGROUND ROOFS
        // ------------------------------------------------------------------
        drawAlleyLamps(p, [
            [1122, 895, 72],
            [815, 1138, 74],
            [495, 1388, 76],
            [1785, 1085, 72],
        ]);
        // Overhead catenary tram contact wire + cross-span tension wires & ceramic insulators!
        p.burin(`M1045 848L1838 965M1045 836L1838 953M1135 812L1838 916M1310 886V875M1540 920V909`, PAL.inkMid, 0.46, 0.66, 5);
        p.flush();
        p.animGroup({ kind: "drift", ampX: -28, ampY: -8.0, freq: 0.68, phase: 0.5 }, () => {
            drawStreetcar(p, 1265, 926);
        });
        // Grounded 5-tone `stippleTreeCluster` corner tree on sidewalk
        stippleTreeCluster(p, p.r, [{ cx: 1102, cy: 814, rx: 32, ry: 26, trunkBaseY: 872, trunkWidth: 4.2, density: 1.2 }], { dabSize: 5.8, palette: { accent: PAL.cinnabarLt, trunk: PAL.barkDk } });
        p.fillPath(polyPath([[185, 1692], [285, 1632], [322, 1656], [222, 1718]]), PAL.prussianDk, 0.98);
        p.fillPath(polyPath([[212, 1666], [272, 1628], [295, 1646], [235, 1684]]), PAL.glass, 0.88);
        p.burinContour(polyPath([[185, 1692], [285, 1632], [322, 1656], [222, 1718]]), PAL.ink, 0.58, 0.8, 4);
        p.flush();
        // 48 Bustling Micro-Pedestrians strolling sidewalks, crosswalks & sanctuary plaza!
        const coats = [PAL.cinnabar, PAL.ink, PAL.petal, PAL.prussian, PAL.ochre, PAL.slateDk, PAL.cinnabarLt, PAL.prussianLt];
        const peds = [];
        const addWalkers = (x0, y0, x1, y1, n, hMin, hMax) => {
            for (let i = 0; i < n; i++) {
                const u = (i + rand(p.r, 0.1, 0.9)) / n;
                peds.push({
                    x: x0 + (x1 - x0) * u + rand(p.r, -10, 10),
                    y: y0 + (y1 - y0) * u + rand(p.r, -8, 8),
                    h: rand(p.r, hMin, hMax),
                    coat: coats[Math.floor(p.r() * coats.length)],
                    kind: p.r() < 0.36 ? "dress" : "coat",
                    dir: p.r() < 0.5 ? 1 : -1,
                });
            }
        };
        addWalkers(1205, 818, 1740, 834, 12, 17, 19); // Sanctuary courtyard & steps
        addWalkers(860, 1138, 1085, 1205, 8, 19, 21); // Prominent mid-canyon zebra crosswalk
        addWalkers(1120, 915, 120, 1695, 18, 19, 24); // Diagonal sunlit limestone sidewalk
        addWalkers(1768, 845, 1758, 1225, 5, 18, 21); // Right-side sidewalk along brownstone
        addWalkers(360, 1625, 495, 1695, 5, 22, 24); // Lower-left crosswalk
        p.scaleFigures(peds, { shadowDir: [1.1, 0.36], shadowOpacity: 0.3, flush: true });
        // Foreground Dramatic East Asian Ceramic Pantile Pavilion Roof (radiating pantile ribs, hip beams, tiled dormer!)
        const fgRoof = [[548, 1465], [1295, 1142], [1748, 1298], [1945, 1345], [1965, 1495], [1425, 1595], [1045, 1625]];
        p.fillPath(polyPath(fgRoof), PAL.prussianDk, 0.99);
        p.fillPath(polyPath([[548, 1465], [1295, 1142], [1165, 1575]]), PAL.slateDk, 0.68);
        p.scallopedRoofTiles(fgRoof, 26, 15, PAL.ink, 0.76);
        const fgb = new PathBatcher();
        // Radiating ceramic pantile ridge flutes (`瓦垄`) down left & right hip slopes!
        for (let i = 1; i <= 14; i++) {
            const u = i / 15;
            const topL = lerp([1295, 1142], [1165, 1575], u * 0.25);
            const botL = lerp([548, 1465], [1165, 1575], u);
            fgb.line("fluteL", topL[0], topL[1], botL[0], botL[1], { stroke: PAL.slateLt, strokeWidth: 0.44, strokeOpacity: 0.34, nonScaling: "hatch" });
            const topR = lerp([1295, 1142], [1748, 1298], u);
            const botR = lerp([1165, 1575], [1965, 1495], u);
            fgb.line("fluteR", topR[0], topR[1], botR[0], botR[1], { stroke: PAL.slateLt, strokeWidth: 0.42, strokeOpacity: 0.26, nonScaling: "hatch" });
        }
        // Raised glazed ceramic hip ridges (`垂脊`) converging at apex
        fgb.line("hipRidge", 1295, 1142, 548, 1465, { stroke: PAL.paperStone, strokeWidth: 1.05, strokeOpacity: 0.72, nonScaling: "contour" });
        fgb.line("hipRidge", 1295, 1142, 1165, 1575, { stroke: PAL.slateLt, strokeWidth: 0.95, strokeOpacity: 0.65, nonScaling: "contour" });
        fgb.line("hipRidge", 1295, 1142, 1748, 1298, { stroke: PAL.paperStone, strokeWidth: 1.05, strokeOpacity: 0.72, nonScaling: "contour" });
        // Sculpted louvered gable dormer window (replaces flat white triangle!)
        fgb.quad("dormWall", [906, 1348], [952, 1312], [998, 1348], [998, 1364], { fill: PAL.paperWarm, fillOpacity: 0.99 });
        fgb.quad("dormBase", [906, 1348], [998, 1348], [998, 1364], [906, 1364], { fill: PAL.paperStone, fillOpacity: 0.99 });
        fgb.rect("dormLouv", 928, 1332, 48, 24, { fill: PAL.prussianDk, fillOpacity: 0.96 });
        for (let ly = 1336; ly <= 1352; ly += 4) {
            fgb.line("dormSlat", 930, ly, 974, ly, { stroke: PAL.paperStone, strokeWidth: 0.44, strokeOpacity: 0.8, nonScaling: "hatch" });
        }
        fgb.addPath("dormRoof", `M896 1352L952 1302L1008 1352L998 1356L952 1316L906 1356Z`, { fill: PAL.slateDk, fillOpacity: 0.99 });
        fgb.flush(p);
        p.burinContour(polyPath(fgRoof), PAL.ink, 0.85, 0.88, 7);
        p.moonRim([[548, 1465], [1295, 1142], [1748, 1298]], { closed: false, up: true, widthPx: 1.05 });
        p.flush();
        p.archFacadeGrid({ x: 640, y: 1535, w: 720, h: 345 }, 7, 3, {
            wallFill: PAL.paperDeep, glassFill: PAL.prussianDk, tintFill: PAL.glassTint, litChance: 0.45,
            mullionColor: PAL.cinnabar, mullionWidthPx: 0.65, arched: true, masonryCourses: 22, edgeRim: true, flush: true,
        });
        p.fillPath(polyPath([[1365, 1425], [2240, 1525], [2240, 1880], [1365, 1880]]), PAL.paperWarm, 0.99);
        p.fillPath(polyPath([[1360, 1412], [1665, 1418], [2245, 1514], [2245, 1546], [1360, 1446]]), PAL.paperStone, 0.99);
        p.burinContour(`M1360 1412L2245 1514M1360 1446L2245 1546`, PAL.inkMid, 0.68, 0.78, 2);
        p.flush();
        p.archFacadeGrid([[1392, 1488], [2210, 1582], [2210, 1880], [1392, 1880]], 12, 4, {
            wallFill: PAL.paperWarm, glassFill: PAL.slate, tintFill: PAL.glass, litChance: 0.32,
            mullionColor: PAL.inkMid, mullionWidthPx: 0.45, edgeRim: true, flush: true,
        });
        // Lush 5-tone `stippleTreeCluster` foreground corner trees with peeking dark trunks & forks!
        stippleTreeCluster(p, p.r, [
            { cx: 792, cy: 1532, rx: 126, ry: 82, trunkBaseY: 1860, trunkWidth: 16, density: 1.3 },
            { cx: 642, cy: 1592, rx: 108, ry: 72, density: 1.2 },
            { cx: 938, cy: 1582, rx: 94, ry: 66, density: 1.2 },
            { cx: 2158, cy: 1572, rx: 136, ry: 92, trunkBaseY: 1860, trunkWidth: 16, density: 1.3 },
            { cx: 2338, cy: 1628, rx: 112, ry: 82, density: 1.2 },
        ], { dabSize: 9.2, groundShadow: false, palette: { accent: PAL.cinnabarLt, trunk: PAL.barkDk } });
    });
    // ------------------------------------------------------------------
    // 7. HAIR-FINE NON-SCALING GATE OPENING EDGE (ZERO 48px DARK BROWN COLLAR IN s03!)
    // ------------------------------------------------------------------
    p.burinContour(polyPath(hole), PAL.ink, 0.82, 0.86, 4);
    p.flush();
    return {
        index: 2,
        id: "s02-alley",
        title: "Sanctuary Canyon",
        subtitle: "Mid-Rise Brick Lofts, Streetcar Crosswalk & Indigo Gate",
        portal: S02_PORTAL,
        coreColorDay: [245, 241, 232],
        coreColorNight: [22, 31, 52],
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
