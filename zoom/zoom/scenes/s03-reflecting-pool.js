// S03: Marble Sanctuary, Mughal Charbagh & Baradari Water-Pavilion (6x-depth compact portal at (870, 940)).
// Stage-5 5x micro-craft edition channeling @claudeai's Taj Mahal (_1_thumb.jpg) + PathBatcher delicacy:
// - Fluted white-marble onion dome ribs, 9-petal inverted lotus collar (padma-kosha) & brass kalasha spire
// - 3-value recessed central iwan vault with stepped muqarnas facets, pierced jali lattice screens,
//   delicate 0.34px pietra dura floral spandrel scrollwork & chamfered minaret balcony brackets
// - 5-tone fine-stippled stippleTreeCluster cypress avenues (180-240 velvety dabs/tree + peeking trunks!)
// - Geometric Mughal charbagh sunken parterre beds (octagonal sandstone borders, stippled boxwood hedges,
//   rose/marigold blossom flecks & directional dry-brush terracotta flagstone walkways)
// - Rich broken-stroke turquoise reflecting pool with vivid inverted Taj dome & minaret reflections
// - Carved Mughal marble Baradari water-pavilion kiosk bridged to the left promenade (pointed scalloped arch,
//   slender fluted columns, overhanging bracketed chhajja eave & fluted roof dome) framing S04!
import { PAL, Painter, PathBatcher, archDoorwayHole, bilerp, circlePath, closedSmooth, cubic, ellipsePath, f, polyPath, rand, sample, stippleTreeCluster, } from "../kit.js";
import { BLEED, requiredPortalClearBox, requiredPortalSealBox, validatePortalHole, } from "./types.js";
export const S03_PORTAL = { cx: 870, cy: 940, rx: 146, ry: 112 };
const S04_NEXT_PORTAL = [1510, 580];
// Pointed Mughal Baradari water-pavilion archway opening (strictly encloses 6x S=12 clearBox inside sealBox).
function buildPavilionHole() {
    const clear = requiredPortalClearBox(S03_PORTAL, S04_NEXT_PORTAL);
    const seal = requiredPortalSealBox(S03_PORTAL);
    const hole = archDoorwayHole(clear, {
        padL: 16,
        padR: 16,
        padTop: 10,
        padBot: 16,
        archRise: 40,
        pointed: true,
        sealBox: seal,
    });
    validatePortalHole("s03-reflecting-pool", hole, S03_PORTAL, S04_NEXT_PORTAL);
    return hole;
}
/** Tapered C1-smooth dry-brush gouache stroke. */
function dryBrushStroke(x0, y, dx, dy, thick, r) {
    const mx = x0 + dx * rand(r, 0.36, 0.64);
    const my = y + dy * rand(r, 0.36, 0.64);
    const x1 = x0 + dx;
    const y1 = y + dy;
    const h = thick * rand(r, 0.65, 1.24);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    return `M${f(x0)} ${f(y)}Q${f(mx + nx * h)} ${f(my + ny * h)} ${f(x1)} ${f(y1)}Q${f(mx - nx * h * 0.84)} ${f(my - ny * h * 0.84)} ${f(x0)} ${f(y)}Z`;
}
function mughalArchPoly(cx, yTop, yBot, halfW, shoulderFrac = 0.42) {
    const ySh = yTop + (yBot - yTop) * shoulderFrac;
    const left = sample(cubic([cx - halfW, ySh], [cx - halfW * 0.96, yTop + (ySh - yTop) * 0.35], [cx - halfW * 0.32, yTop + (ySh - yTop) * 0.08], [cx, yTop]), 6);
    const right = sample(cubic([cx, yTop], [cx + halfW * 0.32, yTop + (ySh - yTop) * 0.08], [cx + halfW * 0.96, yTop + (ySh - yTop) * 0.35], [cx + halfW, ySh]), 6).slice(1);
    return [[cx - halfW, yBot], ...left, ...right, [cx + halfW, yBot]];
}
/** Slender tapering white marble minaret with coursed inlay bands, bracketed balconies & jali balustrades. */
function drawMinaret(p, cx, baseY, h, baseW) {
    const topW = baseW * 0.62;
    const shaftTop = baseY - h * 0.82;
    const b = new PathBatcher();
    const shaft = [[cx - baseW * 0.5, baseY], [cx - topW * 0.5, shaftTop], [cx + topW * 0.5, shaftTop], [cx + baseW * 0.5, baseY]];
    p.fillPath(polyPath(shaft), PAL.petal, 0.97);
    p.fillPath(polyPath([[cx + baseW * 0.06, baseY], [cx + topW * 0.06, shaftTop], [cx + topW * 0.5, shaftTop], [cx + baseW * 0.5, baseY]]), PAL.paperDeep, 0.72);
    p.fillPath(polyPath([[cx + baseW * 0.28, baseY], [cx + topW * 0.28, shaftTop], [cx + topW * 0.5, shaftTop], [cx + baseW * 0.5, baseY]]), PAL.slateLt, 0.34);
    // Subtle marble ring-band courses along the minaret shaft (exact Taj Mahal masonry banding!)
    for (let i = 1; i < 14; i++) {
        const u = i / 14;
        const ry = baseY - u * (baseY - shaftTop);
        const rw = (baseW + (topW - baseW) * u) * 0.5;
        b.line("course", cx - rw, ry, cx + rw, ry, { stroke: PAL.paperShadow, strokeWidth: 0.34, strokeOpacity: 0.52, nonScaling: "hatch" });
    }
    b.line("moon", cx - baseW * 0.5, baseY, cx - topW * 0.5, shaftTop, { stroke: PAL.litEdge, strokeWidth: 0.52, strokeOpacity: "var(--z-moon-op)", nonScaling: "contour" });
    // Three projecting bracketed marble balconies with delicate jali parapet rails
    for (const frac of [0.34, 0.62, 0.82]) {
        const by = baseY - h * frac;
        const bw = (baseW + (topW - baseW) * (frac / 0.82)) * 0.78;
        b.quad("balcTop", [cx - bw, by - 7], [cx + bw, by - 7], [cx + bw, by + 2], [cx - bw, by + 2], { fill: PAL.paperWarm, fillOpacity: 0.96 });
        b.quad("balcSh", [cx - bw * 0.94, by + 2], [cx + bw * 0.94, by + 2], [cx + bw * 0.72, by + 8], [cx - bw * 0.72, by + 8], { fill: PAL.slateLt, fillOpacity: 0.56 });
        // Fine jali balustrade lattice & carved corbel brackets
        b.line("jali", cx - bw, by - 7, cx + bw, by - 7, { stroke: PAL.inkHair, strokeWidth: 0.36, strokeOpacity: 0.52, nonScaling: "hatch" });
        b.line("jali", cx - bw * 0.94, by + 2, cx + bw * 0.94, by + 2, { stroke: PAL.inkHair, strokeWidth: 0.36, strokeOpacity: 0.52, nonScaling: "hatch" });
        for (let k = -3; k <= 3; k++) {
            const u = k / 3.4;
            b.line("jali", cx + bw * u, by - 7, cx + bw * u, by + 2, { stroke: PAL.inkHair, strokeWidth: 0.32, strokeOpacity: 0.44, nonScaling: "hatch" });
            b.line("jali", cx + bw * u, by + 2, cx + bw * u * 0.8, by + 8, { stroke: PAL.inkHair, strokeWidth: 0.36, strokeOpacity: 0.5, nonScaling: "hatch" });
        }
    }
    b.flush(p);
    const cupBase = shaftTop - 2;
    const cupTop = baseY - h * 0.91;
    const cw = topW * 0.52;
    p.fillPath(polyPath([[cx - cw, cupBase], [cx - cw, cupTop], [cx + cw, cupTop], [cx + cw, cupBase]]), PAL.paperDeep, 0.94);
    for (const off of [-0.52, 0, 0.52]) {
        p.fillPath(polyPath(mughalArchPoly(cx + off * cw * 1.1, cupTop + 3, cupBase - 2, cw * 0.22, 0.35)), PAL.slate, 0.64);
    }
    p.layer("var(--z-halo-op)", () => {
        p.fillPath(circlePath(cx, (cupBase + cupTop) * 0.5, cw * 1.6), PAL.lantern, 0.24);
        p.fillPath(circlePath(cx, (cupBase + cupTop) * 0.5, cw * 0.58), PAL.lanternCore, 0.66);
    });
    const domeH = h * 0.085;
    const domeL = sample(cubic([cx - cw * 1.05, cupTop], [cx - cw * 1.25, cupTop - domeH * 0.45], [cx - cw * 0.35, cupTop - domeH * 0.85], [cx, cupTop - domeH]), 6);
    const domeR = sample(cubic([cx, cupTop - domeH], [cx + cw * 0.35, cupTop - domeH * 0.85], [cx + cw * 1.25, cupTop - domeH * 0.45], [cx + cw * 1.05, cupTop]), 6).slice(1);
    p.fillPath(closedSmooth([...domeL, ...domeR]), PAL.petal, 0.98);
    p.fillPath(closedSmooth([[cx, cupTop - domeH], ...domeR, [cx + cw * 0.15, cupTop]]), PAL.slateLt, 0.26);
    p.burinContour(`M${f(cx)} ${f(cupTop - domeH)}V${f(cupTop - domeH - h * 0.055)}`, PAL.ochreDk, 0.88, 0.86, 1);
    p.fillPath(circlePath(cx, cupTop - domeH - h * 0.025, Math.max(2.0, cw * 0.14)), PAL.brassLt, 0.92);
}
/**
 * 5x Micro-Craft Taj Mahal Marble Mausoleum: fluted onion dome ribs, padma-kosha inverted lotus collar,
 * 3-value iwan vault with stepped muqarnas honeycomb niches, pierced jali screens & pietra dura spandrel inlay!
 */
function drawMarbleSanctuary(p, cx, plinthY) {
    // 1. Balanced soft dry-brush atmospheric cloud halo behind both dome flanks
    const hazeA = [];
    const hazeB = [];
    for (let i = 0; i < 72; i++) {
        const u = i / 71;
        const y = 172 + u * 318;
        const halfSpread = 190 + 265 * Math.sin(u * Math.PI);
        const len = rand(p.r, 48, 175);
        const xCenter = cx + rand(p.r, -halfSpread, halfSpread);
        const d = dryBrushStroke(xCenter - len * 0.5, y, len, rand(p.r, -1.0, 1.0), rand(p.r, 2.6, 5.8), p.r);
        if (i % 3 === 0)
            hazeB.push(d);
        else
            hazeA.push(d);
    }
    p.fillPath(hazeA.join(""), PAL.slateLt, 0.19);
    p.fillPath(hazeB.join(""), PAL.celadonLt, 0.21);
    // 2. Elevated marble terrace plinth + recessed arched plinth niches + carved marble jali balustrade!
    const plinthL = cx - 595;
    const plinthR = cx + 595;
    const plinthTop = plinthY - 52;
    p.fillPath(polyPath([[plinthL, plinthTop], [plinthR, plinthTop], [plinthR + 14, plinthY], [plinthL - 14, plinthY]]), PAL.paperWarm, 0.98);
    p.fillPath(polyPath([[plinthL, plinthTop], [plinthR, plinthTop], [plinthR, plinthTop + 6], [plinthL, plinthTop + 6]]), PAL.petal, 0.88);
    const plinthB = new PathBatcher();
    const nicheCount = 26;
    for (let i = 0; i < nicheCount; i++) {
        const nx = plinthL + 26 + (i / (nicheCount - 1)) * (plinthR - plinthL - 52);
        plinthB.addPath("arch", polyPath(mughalArchPoly(nx, plinthTop + 14, plinthY - 2, 13, 0.36)), { fill: PAL.slateLt, fillOpacity: 0.36 });
        plinthB.addPath("archIn", polyPath(mughalArchPoly(nx, plinthTop + 22, plinthY - 2, 7.5, 0.32)), { fill: PAL.slate, fillOpacity: 0.28 });
    }
    // Pierced jali terrace rail along plinth top
    plinthB.line("rail", plinthL, plinthTop - 7, plinthR, plinthTop - 7, { stroke: PAL.paperShadow, strokeWidth: 0.45, strokeOpacity: 0.65, nonScaling: "hatch" });
    for (let rx = plinthL + 8; rx < plinthR; rx += 14) {
        plinthB.line("rail", rx, plinthTop - 7, rx, plinthTop, { stroke: PAL.paperShadow, strokeWidth: 0.34, strokeOpacity: 0.55, nonScaling: "hatch" });
    }
    plinthB.flush(p);
    // 3. Four tapering bracketed marble minarets
    drawMinaret(p, cx - 538, plinthY, 372, 40);
    drawMinaret(p, cx + 538, plinthY, 372, 40);
    drawMinaret(p, cx - 330, plinthTop + 8, 250, 26);
    drawMinaret(p, cx + 330, plinthTop + 8, 250, 26);
    const bodyW = 524;
    const bodyL = cx - bodyW * 0.5;
    const bodyR = cx + bodyW * 0.5;
    const bodyTop = plinthTop - 184;
    const pishtaqW = 226;
    const pishtaqTop = bodyTop - 36;
    // 4. Flanking octagonal marble chhatri pavilions with fluted cupolas & slender colonnettes
    for (const side of [-1, 1]) {
        const chx = cx + side * 172;
        const chy = bodyTop;
        p.fillPath(polyPath([[chx - 48, chy], [chx - 48, chy - 42], [chx + 48, chy - 42], [chx + 48, chy]]), PAL.paperWarm, 0.98);
        p.fillPath(polyPath([[chx - 52, chy - 42], [chx + 52, chy - 42], [chx + 50, chy - 36], [chx - 50, chy - 36]]), PAL.paperShadow, 0.52);
        for (const k of [-26, 0, 26]) {
            p.fillPath(polyPath(mughalArchPoly(chx + k, chy - 34, chy - 2, 10, 0.36)), PAL.slateLt, 0.58);
            p.fillPath(polyPath(mughalArchPoly(chx + k, chy - 26, chy - 2, 5.5, 0.32)), PAL.slate, 0.42);
        }
        const dL = sample(cubic([chx - 46, chy - 42], [chx - 52, chy - 72], [chx - 18, chy - 94], [chx, chy - 106]), 6);
        const dR = sample(cubic([chx, chy - 106], [chx + 18, chy - 94], [chx + 52, chy - 72], [chx + 46, chy - 42]), 6).slice(1);
        p.fillPath(closedSmooth([...dL, ...dR]), PAL.petal, 0.98);
        p.fillPath(closedSmooth([[chx, chy - 106], ...dR, [chx + 6, chy - 42]]), PAL.slateLt, 0.24);
        // Subtle chhatri dome fluting & golden finial
        p.burin(`M${f(chx)} ${f(chy - 106)}Q${f(chx - 22)} ${f(chy - 74)} ${f(chx - 20)} ${f(chy - 42)}M${f(chx)} ${f(chy - 106)}Q${f(chx + 22)} ${f(chy - 74)} ${f(chx + 20)} ${f(chy - 42)}`, PAL.inkHair, 0.3, 0.34, 2, "hatch");
        p.burinContour(`M${f(chx)} ${f(chy - 106)}V${f(chy - 124)}`, PAL.ochreDk, 0.85, 0.85, 1);
        p.fillPath(circlePath(chx, chy - 115, 2.2), PAL.brassLt, 0.92);
    }
    // 5. Monumental Fluted Bulbous Onion Dome + Inlaid Drum + 9-Petal Padma-Kosha Lotus Collar!
    const drumTop = pishtaqTop - 38;
    const domeBaseY = drumTop + 4;
    const domeApexY = 186;
    const domeRx = 128;
    p.fillPath(polyPath([[cx - 106, pishtaqTop + 4], [cx - 106, drumTop], [cx + 106, drumTop], [cx + 106, pishtaqTop + 4]]), PAL.paperWarm, 0.98);
    p.fillPath(polyPath([[cx + 14, pishtaqTop + 4], [cx + 14, drumTop], [cx + 106, drumTop], [cx + 106, pishtaqTop + 4]]), PAL.paperDeep, 0.65);
    p.fillPath(polyPath([[cx - 108, drumTop - 4], [cx + 108, drumTop - 4], [cx + 108, drumTop + 4], [cx - 108, drumTop + 4]]), PAL.paperShadow, 0.48);
    const onionL = sample(cubic([cx - 104, domeBaseY], [cx - domeRx * 1.24, domeBaseY - 52], [cx - domeRx * 0.78, domeApexY + 28], [cx, domeApexY]), 12);
    const onionR = sample(cubic([cx, domeApexY], [cx + domeRx * 0.78, domeApexY + 28], [cx + domeRx * 1.24, domeBaseY - 52], [cx + 104, domeBaseY]), 12).slice(1);
    p.fillPath(closedSmooth([...onionL, ...onionR]), PAL.petal, 0.99);
    const sunCrescent = [...onionL.slice(2, 11), ...onionL.slice(2, 11).reverse().map(([x, y]) => [x + 28, y + 6])];
    p.fillPath(closedSmooth(sunCrescent), PAL.paper, 0.44);
    const domeShadePts = [[cx, domeApexY], ...onionR, [cx + 12, domeBaseY], [cx + 42, domeBaseY - 52], [cx + 28, domeApexY + 46]];
    p.fillPath(closedSmooth(domeShadePts), PAL.paperDeep, 0.56);
    const domeCoreShade = [[cx + 14, domeApexY + 8], ...onionR.slice(2), [cx + 62, domeBaseY], [cx + 84, domeBaseY - 52]];
    p.fillPath(closedSmooth(domeCoreShade), PAL.slateLt, 0.28);
    // Delicate curved meridian fluted dome ribs + drum pietra-dura inlay arcading (batched via PathBatcher!)
    const domeB = new PathBatcher();
    for (const frac of [-0.82, -0.62, -0.42, -0.22, 0, 0.22, 0.42, 0.62, 0.82]) {
        const bx = cx + frac * 100;
        const mx = cx + frac * domeRx * 1.06;
        const my = domeBaseY - (domeBaseY - domeApexY) * 0.46;
        domeB.addPath("rib", `M${f(cx)} ${f(domeApexY + 6)}Q${f(mx)} ${f(my)} ${f(bx)} ${f(domeBaseY)}`, {
            stroke: PAL.paperShadow,
            strokeWidth: 0.34,
            strokeOpacity: frac > 0.15 ? 0.56 : 0.34,
            nonScaling: "hatch",
        });
    }
    // Drum decorative calligraphy / blind-arch band
    for (let i = -5; i <= 5; i++) {
        const dx = cx + i * 18;
        domeB.addPath("drumArch", `M${f(dx - 6)} ${f(pishtaqTop)}v-24q6 -7 12 0v24`, {
            stroke: PAL.inkHair,
            strokeWidth: 0.34,
            strokeOpacity: 0.42,
            nonScaling: "hatch",
        });
    }
    domeB.flush(p);
    // Sculpted 9-petal inverted lotus collar (padma-kosha) + ornate golden brass kalasha crescent finial!
    let lotusPetals = "";
    for (let k = -4; k <= 4; k++) {
        const px = cx + k * 5.2;
        const py = domeApexY + 12 - (4 - Math.abs(k)) * 1.4;
        lotusPetals += `M${f(px - 3.2)} ${f(py)}Q${f(px)} ${f(domeApexY - 3)} ${f(px + 3.2)} ${f(py)}Z`;
    }
    p.fillPath(lotusPetals, PAL.ochreLt, 0.88);
    p.burinContour(`M${f(cx)} ${f(domeApexY - 2)}V${f(domeApexY - 56)}`, PAL.ochreDk, 1.15, 0.92, 1);
    p.fillPath(circlePath(cx, domeApexY - 14, 5.2) + circlePath(cx, domeApexY - 28, 3.8) + circlePath(cx, domeApexY - 40, 2.5), PAL.brassLt, 0.96);
    // Subtle crescent horns on the kalasha finial
    p.burinContour(`M${f(cx - 5.5)} ${f(domeApexY - 46)}Q${f(cx)} ${f(domeApexY - 41)} ${f(cx + 5.5)} ${f(domeApexY - 46)}`, PAL.brass, 0.8, 0.92, 1);
    p.moonRim(onionL, { closed: false, up: true, widthPx: 0.9, opacity: "var(--z-moon-op)" });
    // 6. Main Wings, Carved Parapet Crenellations, 3-Value Recessed Iwan & Pietra Dura Spandrel Filigree!
    p.fillPath(polyPath([[bodyL, plinthTop], [bodyL, bodyTop], [bodyR, bodyTop], [bodyR, plinthTop]]), PAL.petal, 0.98);
    p.fillPath(polyPath([[bodyL, plinthTop], [bodyL, bodyTop], [bodyL + 64, bodyTop], [bodyL + 64, plinthTop]]), PAL.paperDeep, 0.56);
    p.fillPath(polyPath([[bodyR - 64, plinthTop], [bodyR - 64, bodyTop], [bodyR, bodyTop], [bodyR, plinthTop]]), PAL.paperDeep, 0.68);
    p.fillPath(polyPath([[bodyR - 64, plinthTop], [bodyR - 64, bodyTop], [bodyR, bodyTop], [bodyR, plinthTop]]), PAL.slateLt, 0.2);
    p.fillPath(polyPath([[bodyL - 4, bodyTop - 6], [bodyR + 4, bodyTop - 6], [bodyR + 4, bodyTop + 3], [bodyL - 4, bodyTop + 3]]), PAL.paperShadow, 0.52);
    // Carved kangura trefoil parapet merlons along roof edges + flanking double-tier arches with pierced jali screens
    const facadeB = new PathBatcher();
    for (let mx = bodyL + 6; mx < bodyR - 6; mx += 12) {
        if (Math.abs(mx - cx) < pishtaqW * 0.5)
            continue;
        facadeB.addPath("merlon", `M${f(mx)} ${f(bodyTop - 6)}l4 -5l4 5Z`, { fill: PAL.paperWarm, fillOpacity: 0.94 });
    }
    for (const side of [-1, 1]) {
        const innerX = cx + side * 164;
        const outerX = cx + side * 228;
        for (const [nx, hw] of [[innerX, 26], [outerX, 18]]) {
            facadeB.addPath("nicheOuter", polyPath(mughalArchPoly(nx, bodyTop + 20, bodyTop + 92, hw, 0.42)), { fill: PAL.slateLt, fillOpacity: 0.56 });
            facadeB.addPath("nicheMid", polyPath(mughalArchPoly(nx, bodyTop + 34, bodyTop + 92, hw * 0.62, 0.38)), { fill: PAL.slate, fillOpacity: 0.46 });
            facadeB.addPath("nicheOuter", polyPath(mughalArchPoly(nx, bodyTop + 104, plinthTop - 2, hw, 0.42)), { fill: PAL.slateLt, fillOpacity: 0.64 });
            facadeB.addPath("nicheMid", polyPath(mughalArchPoly(nx, bodyTop + 122, plinthTop - 2, hw * 0.6, 0.36)), { fill: PAL.slate, fillOpacity: 0.56 });
            // Fine pierced jali lattice lines inside each arched bay
            for (let r = 1; r <= 3; r++) {
                const jy = bodyTop + 126 + r * 12;
                facadeB.line("jali", nx - hw * 0.5, jy, nx + hw * 0.5, jy, { stroke: PAL.paperWarm, strokeWidth: 0.32, strokeOpacity: 0.45, nonScaling: "hatch" });
            }
        }
    }
    facadeB.flush(p);
    for (const side of [-1, 1]) {
        const innerX = cx + side * 164;
        const outerX = cx + side * 228;
        for (const [nx, hw] of [[innerX, 26], [outerX, 18]]) {
            p.layer("var(--z-halo-op)", () => {
                p.fillPath(polyPath(mughalArchPoly(nx, bodyTop + 130, plinthTop - 2, hw * 0.48, 0.35)), PAL.lantern, 0.52);
            });
        }
    }
    // Central Monumental Pishtaq + Pietra Dura Floral Spandrel Scrollwork + 3-Value Muqarnas Iwan Vault!
    p.fillPath(polyPath([[cx - pishtaqW * 0.5, plinthTop], [cx - pishtaqW * 0.5, pishtaqTop], [cx + pishtaqW * 0.5, pishtaqTop], [cx + pishtaqW * 0.5, plinthTop]]), PAL.petal, 0.99);
    // 3-value recessed central iwan vault (outer pale cool-slate reveal -> stepped muqarnas honeycomb tier -> deep inner sanctum!)
    p.fillPath(polyPath(mughalArchPoly(cx, pishtaqTop + 28, plinthTop, 82, 0.42)), PAL.slateLt, 0.62);
    p.fillPath(polyPath(mughalArchPoly(cx, pishtaqTop + 44, plinthTop, 68, 0.4)), PAL.slate, 0.36);
    p.fillPath(polyPath(mughalArchPoly(cx, pishtaqTop + 62, plinthTop, 54, 0.38)), PAL.slate, 0.48);
    // Delicate pietra dura spandrel arabesque tendrils, calligraphy border frames & muqarnas vault facets!
    const pB = new PathBatcher();
    const pStyle = { stroke: PAL.inkHair, strokeWidth: 0.34, strokeOpacity: 0.48, nonScaling: "hatch" };
    const inlayStyle = { stroke: PAL.ochreDk, strokeWidth: 0.36, strokeOpacity: 0.46, nonScaling: "hatch" };
    // Double calligraphy frame around pishtaq
    pB.addPath("frame", `M${f(cx - pishtaqW * 0.46)} ${f(plinthTop)}V${f(pishtaqTop + 8)}H${f(cx + pishtaqW * 0.46)}V${f(plinthTop)}`, pStyle);
    pB.addPath("frame", `M${f(cx - pishtaqW * 0.41)} ${f(plinthTop)}V${f(pishtaqTop + 18)}H${f(cx + pishtaqW * 0.41)}V${f(plinthTop)}`, pStyle);
    // Delicate pietra dura vine scrolls inside both upper spandrels of the central iwan!
    for (const side of [-1, 1]) {
        const sx0 = cx + side * 26;
        const sy0 = pishtaqTop + 34;
        pB.addPath("inlay", `M${f(sx0)} ${f(sy0)}Q${f(cx + side * 56)} ${f(sy0 - 6)} ${f(cx + side * 74)} ${f(sy0 + 18)}Q${f(cx + side * 82)} ${f(sy0 + 38)} ${f(cx + side * 72)} ${f(sy0 + 52)}`, inlayStyle);
        pB.addPath("inlay", `M${f(cx + side * 52)} ${f(sy0 + 4)}Q${f(cx + side * 70)} ${f(sy0 + 2)} ${f(cx + side * 80)} ${f(sy0 + 12)}`, inlayStyle);
        pB.circle("inlayDot", cx + side * 66, sy0 + 14, 2.2, { fill: PAL.cinnabarLt, fillOpacity: 0.42 });
        pB.circle("inlayDot", cx + side * 76, sy0 + 34, 1.8, { fill: PAL.ochre, fillOpacity: 0.44 });
        // Rectangular side-wing recessed inlay frames
        const px = cx + side * 164;
        pB.rect("frame", px - 31, bodyTop + 16, 62, 74, pStyle);
        pB.rect("frame", px - 31, bodyTop + 102, 62, 76, pStyle);
    }
    // Stepped muqarnas vault facets inside upper iwan semidome
    for (let row = 0; row < 3; row++) {
        const my = pishtaqTop + 58 + row * 16;
        const mW = 24 + row * 16;
        const cells = 3 + row * 2;
        for (let k = 0; k < cells; k++) {
            const mx = cx - mW + ((k + 0.5) / cells) * mW * 2;
            pB.addPath("muq", `M${f(mx - 6)} ${f(my + 8)}Q${f(mx)} ${f(my - 4)} ${f(mx + 6)} ${f(my + 8)}`, { stroke: PAL.paperDeep, strokeWidth: 0.36, strokeOpacity: 0.44, nonScaling: "hatch" });
        }
    }
    pB.flush(p);
    // Upper pierced jali clerestory arch & ground sanctum doorway inside iwan
    p.fillPath(polyPath(mughalArchPoly(cx, pishtaqTop + 92, pishtaqTop + 148, 24, 0.38)), PAL.slateDk, 0.66);
    p.fillPath(polyPath(mughalArchPoly(cx, plinthTop - 58, plinthTop, 22, 0.34)), PAL.slateDk, 0.8);
    p.layer("var(--z-halo-op)", () => {
        p.fillPath(circlePath(cx, plinthTop - 28, 102), PAL.lanternHalo, 0.22);
        p.fillPath(circlePath(cx, plinthTop - 30, 52), PAL.lantern, 0.4);
        p.fillPath(polyPath(mughalArchPoly(cx, plinthTop - 56, plinthTop, 20, 0.34)), PAL.lanternCore, 0.84);
        p.fillPath(polyPath(mughalArchPoly(cx, pishtaqTop + 94, pishtaqTop + 146, 21, 0.38)), PAL.lantern, 0.68);
    });
    // Slender corner guldasta pinnacles framing pishtaq
    for (const side of [-1, 1]) {
        const gx = cx + side * (pishtaqW * 0.5);
        p.fillPath(polyPath([[gx - 4.5, pishtaqTop + 6], [gx + 4.5, pishtaqTop + 6], [gx + 3.5, pishtaqTop - 28], [gx - 3.5, pishtaqTop - 28]]), PAL.paperWarm, 0.96);
        p.fillPath(circlePath(gx, pishtaqTop - 30, 4.2), PAL.petal, 0.95);
        p.burinContour(`M${f(gx)} ${f(pishtaqTop - 33)}V${f(pishtaqTop - 46)}`, PAL.ochreDk, 0.75, 0.8, 1);
    }
}
/**
 * Geometric Mughal Charbagh Sunken Parterre Gardens + Perspective Red-Sandstone Flagstone Promenades!
 * Combines @claudeai's diagonal dry-brush terracotta patina with PathBatcher octagonal parterre beds,
 * fine flagstone joints, low stippled boxwood edging & tiny rose/marigold blossom flecks!
 */
function drawCharbaghPromenadesAndParterres(p, quadPts, strokeCount, fadeSide) {
    const [tl, tr, br, bl] = quadPts;
    const washPoly = [
        bilerp(tl, tr, br, bl, fadeSide === "left" ? 0.24 : 0.02, 0),
        bilerp(tl, tr, br, bl, fadeSide === "right" ? 0.76 : 0.98, 0),
        bilerp(tl, tr, br, bl, fadeSide === "right" ? 0.84 : 0.99, 1),
        bilerp(tl, tr, br, bl, fadeSide === "left" ? 0.16 : 0.01, 1),
    ];
    p.fillPath(polyPath(washPoly), PAL.paperWarm, 0.44);
    const b = new PathBatcher();
    // 1. Directional diagonal dry-brush terracotta & copper sandstone patina (exact @claudeai _1_thumb.jpg warmth!)
    for (let i = 0; i < strokeCount; i++) {
        const v = Math.pow(p.r(), 0.76);
        let u = p.r();
        if (fadeSide === "left") {
            u = 1 - Math.pow(p.r(), 0.78);
            if (u < 0.22 && p.r() > u / 0.22)
                continue;
        }
        else if (fadeSide === "right") {
            u = Math.pow(p.r(), 0.78);
            if (u > 0.78 && p.r() > (1 - u) / 0.24)
                continue;
        }
        else if ((u < 0.14 || u > 0.86) && p.r() < 0.5) {
            continue;
        }
        const pt = bilerp(tl, tr, br, bl, u, v);
        const sc = 0.44 + 0.96 * v;
        const len = rand(p.r, 36, 124) * sc;
        const slope = fadeSide === "left" ? rand(p.r, -0.3, -0.05) : fadeSide === "right" ? rand(p.r, 0.05, 0.3) : rand(p.r, -0.05, 0.05);
        const d = dryBrushStroke(pt[0] - len * 0.5, pt[1] - len * slope * 0.5, len, len * slope, rand(p.r, 2.2, 5.8) * sc, p.r);
        const roll = p.r();
        if (roll < 0.34)
            b.addPath("terra", d, { fill: PAL.cinnabarLt, fillOpacity: 0.36 });
        else if (roll < 0.56)
            b.addPath("copper", d, { fill: PAL.copper, fillOpacity: 0.26 });
        else if (roll < 0.80)
            b.addPath("ochre", d, { fill: PAL.ochreLt, fillOpacity: 0.34 });
        else if (roll < 0.92)
            b.addPath("stone", d, { fill: PAL.paperStone, fillOpacity: 0.46 });
        else
            b.addPath("paper", d, { fill: PAL.paper, fillOpacity: 0.42 });
    }
    // 2. Delicate perspective Mughal sandstone walkway paving grid along inner promenade strip!
    if (fadeSide === "left" || fadeSide === "right") {
        const uA = fadeSide === "left" ? 0.70 : 0.02;
        const uB = fadeSide === "left" ? 0.98 : 0.32;
        const paveStyle = { stroke: PAL.cinnabar, strokeWidth: 0.34, strokeOpacity: 0.26, nonScaling: "hatch" };
        for (let r = 1; r <= 18; r++) {
            const v = Math.pow(r / 19, 1.32);
            const pA = bilerp(tl, tr, br, bl, uA, v);
            const pB = bilerp(tl, tr, br, bl, uB, v);
            b.line("pave", pA[0], pA[1], pB[0], pB[1], paveStyle);
        }
        for (let c = 1; c <= 3; c++) {
            const u = uA + ((uB - uA) * c) / 4;
            const pA = bilerp(tl, tr, br, bl, u, 0.02);
            const pB = bilerp(tl, tr, br, bl, u, 0.98);
            b.line("pave", pA[0], pA[1], pB[0], pB[1], paveStyle);
        }
        // 3. Clean Perspective-Aligned 4-Quadrant Mughal Charbagh Floral Parterres (strictly inside marble kerb!)
        // Right: upper bed between cypresses (clear of octagonal fountain) + foreground bed below fountain.
        // Left: symmetrical partial Mughal parterres mirrored on the left lawn beside the cypress avenue!
        const parterreSpecs = fadeSide === "right"
            ? [[0.68, 0.34, 0.13, 0.11], [0.56, 0.85, 0.15, 0.10]]
            : [[0.34, 0.56, 0.13, 0.10], [0.58, 0.86, 0.14, 0.095]];
        const curbEdge = { stroke: PAL.cinnabar, strokeWidth: 0.42, strokeOpacity: 0.38, nonScaling: "hatch" };
        const bedEdge = { stroke: PAL.sageDk, strokeWidth: 0.36, strokeOpacity: 0.36, nonScaling: "hatch" };
        const quadrants = [
            [0.09, 0.45, 0.11, 0.45],
            [0.55, 0.91, 0.11, 0.45],
            [0.09, 0.45, 0.55, 0.89],
            [0.55, 0.91, 0.55, 0.89],
        ];
        for (const [uc, vc, du, dv] of parterreSpecs) {
            const q0 = bilerp(tl, tr, br, bl, uc - du, vc - dv);
            const q1 = bilerp(tl, tr, br, bl, uc + du, vc - dv);
            const q2 = bilerp(tl, tr, br, bl, uc + du, vc + dv);
            const q3 = bilerp(tl, tr, br, bl, uc - du, vc + dv);
            // Outer marble/sandstone parterre kerb & sunken cross-walk bed
            b.quad("pCurb", q0, q1, q2, q3, { fill: PAL.paperWarm, fillOpacity: 0.88 });
            const in0 = bilerp(q0, q1, q2, q3, 0.05, 0.06);
            const in1 = bilerp(q0, q1, q2, q3, 0.95, 0.06);
            const in2 = bilerp(q0, q1, q2, q3, 0.95, 0.94);
            const in3 = bilerp(q0, q1, q2, q3, 0.05, 0.94);
            b.quad("pWalk", in0, in1, in2, in3, { fill: PAL.paperStone, fillOpacity: 0.72 });
            // 4 crisp perspective-aligned charbagh floral quadrants strictly inside the marble kerb!
            for (const [ua, ub, va, vb] of quadrants) {
                const qa = bilerp(q0, q1, q2, q3, ua, va);
                const qb = bilerp(q0, q1, q2, q3, ub, va);
                const qc = bilerp(q0, q1, q2, q3, ub, vb);
                const qd = bilerp(q0, q1, q2, q3, ua, vb);
                b.quad("pLawn", qa, qb, qc, qd, { fill: PAL.sageLt, fillOpacity: 0.46 });
                // Clipped inner boxwood parterre sub-panel
                const sa = bilerp(qa, qb, qc, qd, 0.16, 0.18);
                const sb = bilerp(qa, qb, qc, qd, 0.84, 0.18);
                const sc = bilerp(qa, qb, qc, qd, 0.84, 0.82);
                const sd = bilerp(qa, qb, qc, qd, 0.16, 0.82);
                b.quad("pHedge", sa, sb, sc, sd, { fill: PAL.sage, fillOpacity: 0.48 });
                b.line("pInner", qa[0], qa[1], qb[0], qb[1], bedEdge);
                b.line("pInner", qb[0], qb[1], qc[0], qc[1], bedEdge);
                b.line("pInner", qc[0], qc[1], qd[0], qd[1], bedEdge);
                b.line("pInner", qd[0], qd[1], qa[0], qa[1], bedEdge);
                // Micro stippled rose/marigold & boxwood flecks strictly bounded inside each quadrant!
                for (let fIdx = 0; fIdx < 7; fIdx++) {
                    const fp = bilerp(qa, qb, qc, qd, rand(p.r, 0.2, 0.8), rand(p.r, 0.22, 0.78));
                    b.circle(fIdx % 3 === 0 ? "flRose" : "flLeaf", fp[0], fp[1], rand(p.r, 1.2, 2.2), {
                        fill: fIdx % 3 === 0 ? PAL.cinnabarLt : PAL.sageDk,
                        fillOpacity: 0.68,
                    });
                }
            }
            // Central Mughal octagonal/diamond marble water-medallion at cross-walk intersection
            const c0 = bilerp(q0, q1, q2, q3, 0.50, 0.40);
            const c1 = bilerp(q0, q1, q2, q3, 0.60, 0.50);
            const c2 = bilerp(q0, q1, q2, q3, 0.50, 0.60);
            const c3 = bilerp(q0, q1, q2, q3, 0.40, 0.50);
            b.quad("pBoss", c0, c1, c2, c3, { fill: PAL.paperWarm, fillOpacity: 0.94 });
            const w0 = bilerp(q0, q1, q2, q3, 0.50, 0.44);
            const w1 = bilerp(q0, q1, q2, q3, 0.56, 0.50);
            const w2 = bilerp(q0, q1, q2, q3, 0.50, 0.56);
            const w3 = bilerp(q0, q1, q2, q3, 0.44, 0.50);
            b.quad("pPool", w0, w1, w2, w3, { fill: PAL.water, fillOpacity: 0.56 });
            // Crisp outer marble kerb border hairlines
            b.line("pEdge", q0[0], q0[1], q1[0], q1[1], curbEdge);
            b.line("pEdge", q1[0], q1[1], q2[0], q2[1], curbEdge);
            b.line("pEdge", q2[0], q2[1], q3[0], q3[1], curbEdge);
            b.line("pEdge", q3[0], q3[1], q0[0], q0[1], curbEdge);
        }
    }
    b.flush(p);
}
/** Rich broken-stroke turquoise reflecting pool with vivid inverted white marble dome & minaret reflections! */
function drawLushReflectingWater(p, quadPts, rows, withDomeReflection) {
    const [tl, tr, br, bl] = quadPts;
    p.fillPath(polyPath(quadPts), PAL.water, 0.24);
    const b = new PathBatcher();
    for (let row = 0; row < rows; row++) {
        const t = row / Math.max(1, rows - 1);
        const vBase = Math.pow(t, 1.15);
        const thickBase = 1.9 + 6.0 * vBase;
        const segs = Math.round(10 + 12 * t);
        for (let k = 0; k < segs; k++) {
            const v = Math.min(0.992, Math.max(0.008, vBase + rand(p.r, -0.44, 0.44) / rows));
            const uMid = (k + rand(p.r, 0.14, 0.86)) / segs;
            const hw = rand(p.r, 0.014, 0.042) * (0.7 + 0.46 * v);
            const u0 = Math.max(0.008, uMid - hw);
            const u1 = Math.min(0.992, uMid + hw);
            const a = bilerp(tl, tr, br, bl, u0, v);
            const c = bilerp(tl, tr, br, bl, u1, v);
            const dx = c[0] - a[0];
            if (dx < 5)
                continue;
            const d = dryBrushStroke(a[0], a[1], dx, rand(p.r, -0.5, 0.5), thickBase, p.r);
            if (withDomeReflection) {
                const dv = (v - 0.56) / 0.34;
                if (dv > 0 && dv < 1) {
                    const domeHalfU = 0.2 * Math.sin(Math.pow(dv, 0.65) * Math.PI) * (1 - 0.08 * dv);
                    const du = uMid - 0.54;
                    if (Math.abs(du) < domeHalfU && p.r() < 0.78) {
                        b.addPath(du > domeHalfU * 0.22 ? "reflSh" : "reflLit", d, {
                            fill: du > domeHalfU * 0.22 ? PAL.paperWarm : PAL.paper,
                            fillOpacity: du > domeHalfU * 0.22 ? 0.84 : 0.94,
                        });
                        continue;
                    }
                    if ((Math.abs(uMid - 0.24) < 0.025 || Math.abs(uMid - 0.84) < 0.025) && p.r() < 0.55) {
                        b.addPath("reflLit", d, { fill: PAL.paper, fillOpacity: 0.9 });
                        continue;
                    }
                }
            }
            const lowerBoost = v > 0.48 ? 0.22 : 0;
            const edgeWeight = Math.abs(uMid - 0.52) * 1.45 + v * 0.55;
            const roll = p.r();
            if (roll < 0.34 + lowerBoost)
                b.addPath("deep", d, { fill: PAL.waterDeep, fillOpacity: 0.72 });
            else if (roll < 0.74 + edgeWeight * 0.14)
                b.addPath("turq", d, { fill: PAL.water, fillOpacity: 0.8 });
            else
                b.addPath("cel", d, { fill: PAL.celadon, fillOpacity: 0.56 });
        }
    }
    b.flush(p);
}
/**
 * Carved Mughal Marble Baradari Water-Pavilion Kiosk framing the pointed archway into S04 (#183)!
 * Grounded to the left charbagh promenade by a stepped marble causeway bridge (ZERO floating box in water!):
 * stepped plinth descending into pool, slender fluted marble piers, scalloped inner arch trim, pietra dura
 * spandrel scrollwork, overhanging bracketed chhajja eave, carved parapet, fluted roof dome & brass spire!
 */
function drawMarbleBaradariKiosk(p, hole, pTL, pTR, pBR, pBL) {
    const xL = Math.min(...hole.map((q) => q[0])); // ~757
    const xR = Math.max(...hole.map((q) => q[0])); // ~1025
    const midX = (xL + xR) * 0.5; // ~891
    const yApex = Math.min(...hole.map((q) => q[1])); // ~802
    const ySpring = hole[0][1]; // ~842
    const yBot = Math.max(...hole.map((q) => q[1])); // ~1021
    const pierW = 24;
    const kL = xL - pierW; // ~733
    const kR = xR + pierW; // ~1049
    const eaveY = yApex - 14; // ~788
    const roofTop = eaveY - 26; // ~762
    // 1. Stepped White-Marble Causeway Bridge connecting the Baradari kiosk to the left pool kerb!
    const vBridge = (yBot - pTL[1]) / (pBL[1] - pTL[1]);
    const bankX = bilerp(pTL, pTR, pBR, pBL, 0, vBridge)[0] - 18;
    p.fillPath(polyPath([[bankX, yBot - 16], [kL, yBot - 16], [kL, yBot + 14], [bankX - 10, yBot + 14]]), PAL.paperWarm, 0.96);
    p.fillPath(polyPath([[bankX - 10, yBot + 14], [kL, yBot + 14], [kL, yBot + 24], [bankX - 12, yBot + 24]]), PAL.slateLt, 0.72);
    p.fillPath(polyPath([[bankX - 12, yBot + 24], [kL, yBot + 24], [kL, yBot + 31], [bankX - 12, yBot + 31]]), PAL.waterDeep, 0.48);
    // 2. Stepped Marble Water-Plinth Foundation descending cleanly into the turquoise reflecting pool
    p.fillPath(polyPath([[kL - 12, yBot], [kR + 12, yBot], [kR + 18, yBot + 14], [kL - 18, yBot + 14]]), PAL.paperWarm, 0.98);
    p.fillPath(polyPath([[kL - 18, yBot + 14], [kR + 18, yBot + 14], [kR + 22, yBot + 24], [kL - 22, yBot + 24]]), PAL.slateLt, 0.86);
    p.fillPath(polyPath([[kL - 22, yBot + 24], [kR + 22, yBot + 24], [kR + 24, yBot + 32], [kL - 24, yBot + 32]]), PAL.waterDeep, 0.52);
    // 3. Pavilion Elevation Facade (warm sunlit ivory marble + cool-slate right return & recessed inner arch reveal)
    const kioskOuter = [[kL, yBot], [kL, eaveY], [kR, eaveY], [kR, yBot]];
    p.fillPath(polyPath(kioskOuter) + polyPath(hole), PAL.petal, 0.98, true);
    // Subtle right-flank 3D marble thickness return
    p.fillPath(polyPath([[kR, eaveY], [kR + 12, eaveY + 6], [kR + 12, yBot + 6], [kR, yBot]]), PAL.paperDeep, 0.94);
    p.fillPath(polyPath([[kR, eaveY], [kR + 12, eaveY + 6], [kR + 12, yBot + 6], [kR, yBot]]), PAL.slateLt, 0.34);
    // 4. Overhanging Bracketed Chhajja Eave + Carved Marble Parapet Frieze + Fluted Marble Roof Dome!
    p.fillPath(polyPath([[kL - 16, eaveY - 4], [kR + 20, eaveY - 4], [kR + 16, eaveY + 4], [kL - 12, eaveY + 4]]), PAL.paperStone, 0.98);
    p.fillPath(polyPath([[kL - 12, eaveY + 4], [kR + 16, eaveY + 4], [kR + 10, eaveY + 11], [kL - 6, eaveY + 11]]), PAL.slate, 0.44);
    p.fillPath(polyPath([[kL + 4, roofTop], [kR - 4, roofTop], [kR - 4, eaveY - 4], [kL + 4, eaveY - 4]]), PAL.paperWarm, 0.98);
    // Low Graceful Fluted Mughal Marble Pavilion Dome + Corner Chhatri Pinnacles
    const dRx = 72;
    const dApex = roofTop - 52;
    const dL = sample(cubic([midX - dRx, roofTop], [midX - dRx * 1.1, roofTop - 22], [midX - dRx * 0.48, dApex + 12], [midX, dApex]), 8);
    const dR = sample(cubic([midX, dApex], [midX + dRx * 0.48, dApex + 12], [midX + dRx * 1.1, roofTop - 22], [midX + dRx, roofTop]), 8).slice(1);
    p.fillPath(closedSmooth([...dL, ...dR]), PAL.petal, 0.98);
    p.fillPath(closedSmooth([[midX, dApex], ...dR, [midX + 10, roofTop]]), PAL.paperDeep, 0.62);
    p.fillPath(closedSmooth([[midX + 12, dApex + 5], ...dR.slice(2), [midX + 38, roofTop]]), PAL.slateLt, 0.28);
    // 5. Fine Non-Scaling Pietra Dura Spandrel Scrollwork, Fluted Pier Shafts, Brackets & Dome Ribs (`PathBatcher`!)
    const kb = new PathBatcher();
    const fineInk = { stroke: PAL.inkHair, strokeWidth: 0.42, strokeOpacity: 0.64, nonScaling: "hatch" };
    const goldInlay = { stroke: PAL.ochreDk, strokeWidth: 0.42, strokeOpacity: 0.56, nonScaling: "hatch" };
    // Fluted marble column shafts & moulded bases/capitals on left & right piers
    for (const px of [kL + pierW * 0.5, kR - pierW * 0.5]) {
        for (const off of [-5, 0, 5]) {
            kb.line("flute", px + off, ySpring, px + off, yBot - 10, fineInk);
        }
        kb.rect("cap", px - 10, ySpring - 6, 20, 6, { fill: PAL.paperStone, fillOpacity: 0.96 });
        kb.rect("cap", px - 10, yBot - 10, 20, 10, { fill: PAL.paperStone, fillOpacity: 0.96 });
        // Corner rooftop marble guldasta pinnacle spire
        kb.rect("cap", px - 4, roofTop - 20, 8, 20, { fill: PAL.paperWarm, fillOpacity: 0.98 });
        kb.circle("fin", px, roofTop - 22, 3.6, { fill: PAL.petal, fillOpacity: 0.96 });
        kb.line("spire", px, roofTop - 25, px, roofTop - 36, { stroke: PAL.ochreDk, strokeWidth: 0.72, strokeOpacity: 0.88, nonScaling: "contour" });
    }
    // Carved eave support brackets + roof parapet blind arches
    for (let bx = kL + 2; bx <= kR - 2; bx += 16) {
        kb.line("brk", bx, eaveY + 4, bx, eaveY + 11, fineInk);
        kb.addPath("pArch", `M${f(bx - 5)} ${f(eaveY - 5)}v-13q5 -4 10 0v13`, fineInk);
    }
    // Pietra dura floral spandrel scrollwork & miniature 5-petal lotus rosettes (razor crisp even at 6x zoom!)
    for (const side of [-1, 1]) {
        const sx = midX + side * 38;
        kb.addPath("inlay", `M${f(sx)} ${f(yApex + 4)}Q${f(midX + side * 86)} ${f(yApex - 2)} ${f(midX + side * 124)} ${f(ySpring - 8)}`, goldInlay);
        const fx = midX + side * 96;
        const fy = yApex + 14;
        for (let k = 0; k < 5; k++) {
            const ang = (k / 5) * Math.PI * 2 - Math.PI * 0.5;
            const px = fx + Math.cos(ang) * 2.2;
            const py = fy + Math.sin(ang) * 2.2;
            kb.circle("inlayPetal", px, py, 0.9, { fill: PAL.cinnabarLt, fillOpacity: 0.58 });
        }
        kb.circle("inlayCore", fx, fy, 0.8, { fill: PAL.ochreDk, fillOpacity: 0.72 });
        const fx2 = midX + side * 116;
        const fy2 = ySpring - 14;
        kb.circle("inlayCore", fx2, fy2, 0.9, { fill: PAL.ochre, fillOpacity: 0.56 });
    }
    // Fluted roof dome ribs + golden kalasha finial
    for (const frac of [-0.66, -0.34, 0, 0.34, 0.66]) {
        kb.addPath("dRib", `M${f(midX)} ${f(dApex + 2)}Q${f(midX + frac * dRx * 1.05)} ${f((dApex + roofTop) * 0.5)} ${f(midX + frac * dRx)} ${f(roofTop)}`, fineInk);
    }
    kb.line("spire", midX, dApex, midX, dApex - 24, { stroke: PAL.ochreDk, strokeWidth: 0.88, strokeOpacity: 0.92, nonScaling: "contour" });
    kb.circle("finGold", midX, dApex - 9, 3.0, { fill: PAL.brassLt, fillOpacity: 0.95 });
    kb.circle("finGold", midX, dApex - 17, 2.0, { fill: PAL.brass, fillOpacity: 0.95 });
    // Crisp non-scaling arch contour + moonlit top edge
    kb.addPath("archEdge", polyPath(hole), { stroke: PAL.inkMid, strokeWidth: 0.68, strokeOpacity: 0.62, nonScaling: "contour" });
    kb.line("moon", kL - 16, eaveY - 4, kR + 20, eaveY - 4, { stroke: PAL.litEdge, strokeWidth: 0.72, strokeOpacity: "var(--z-moon-op)", nonScaling: "contour" });
    // Delicate brass Mughal pier wall-sconces (architectural hardware visible in Day, glowing cleanly via --z-lume-op in Night!)
    for (const lx of [kL + 12, kR - 12]) {
        const sy = ySpring + 28;
        kb.addPath("sconce", `M${f(lx - 3.2)} ${f(sy - 5)}h6.4l-1.1 9.5h-4.2Z`, { fill: PAL.brassDk, fillOpacity: 0.86 });
        kb.addPath("sconceCap", `M${f(lx - 4.2)} ${f(sy - 5)}Q${f(lx)} ${f(sy - 9.5)} ${f(lx + 4.2)} ${f(sy - 5)}Z`, { fill: PAL.brass, fillOpacity: 0.9 });
        kb.line("sconcePin", lx, sy + 4.5, lx, sy + 8.5, { stroke: PAL.brassDk, strokeWidth: 0.55, strokeOpacity: 0.82, nonScaling: "contour" });
    }
    kb.flush(p);
    // 6. Warm Nocturnal Pier-Sconce Glow (strictly --z-lume-op so ZERO ghostly pale circles appear in Day at 6x!)
    for (const lx of [kL + 12, kR - 12]) {
        p.layer("var(--z-lume-op)", () => {
            p.fillPath(circlePath(lx, ySpring + 28, 30), PAL.lanternHalo, 0.24);
            p.fillPath(circlePath(lx, ySpring + 28, 11), PAL.lantern, 0.48);
            p.fillPath(circlePath(lx, ySpring + 28, 3.6), PAL.lanternCore, 0.88);
        });
    }
    let lapD = "";
    for (let i = 0; i < 16; i++) {
        const lx = rand(p.r, kL - 26, kR + 18);
        const ly = yBot + rand(p.r, 22, 34);
        lapD += dryBrushStroke(lx, ly, rand(p.r, 18, 46), 0, rand(p.r, 1.5, 3.0), p.r);
    }
    p.fillPath(lapD, PAL.water, 0.7);
}
function drawLotusPad(p, cx, cy, rx, ry, notchAng, hasBud = false) {
    const pts = [];
    const segs = 18;
    for (let i = 0; i < segs; i++) {
        const a = notchAng + 0.24 + (i / (segs - 1)) * (Math.PI * 2 - 0.48);
        pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    pts.push([cx + Math.cos(notchAng) * rx * 0.14, cy + Math.sin(notchAng) * ry * 0.14]);
    p.fillPath(ellipsePath(cx + 3, cy + 4, rx * 1.02, ry * 0.96), PAL.waterDeep, 0.38);
    p.fillPath(closedSmooth(pts), PAL.malachite, 0.94);
    p.fillPath(ellipsePath(cx - rx * 0.12, cy - ry * 0.1, rx * 0.52, ry * 0.42), PAL.sageLt, 0.32);
    if (hasBud) {
        p.fillPath(closedSmooth([[cx - 9, cy + 1], [cx - 5, cy - 11], [cx, cy - 15], [cx + 5, cy - 11], [cx + 9, cy + 1], [cx, cy + 4]]), PAL.petal, 0.98);
        p.fillPath(closedSmooth([[cx - 6, cy + 1], [cx, cy - 14], [cx + 6, cy + 1]]), PAL.petalBlush, 0.44);
    }
}
function drawRightGardenPavilion(p) {
    const x0 = 2175;
    const x1 = 2780;
    const roofY = 620;
    const baseY = 1125;
    p.fillPath(polyPath([[x0, baseY], [x0, roofY], [x1, roofY], [x1, baseY]]), PAL.cinnabarLt, 0.44);
    p.fillPath(polyPath([[x0, baseY], [x0, roofY], [x0 + 68, roofY + 12], [x0 + 68, baseY]]), PAL.cinnabar, 0.28);
    let wallDabs = "";
    for (let i = 0; i < 28; i++) {
        wallDabs += dryBrushStroke(rand(p.r, x0 + 10, 2410), rand(p.r, roofY + 35, baseY - 35), rand(p.r, 28, 78), 0, rand(p.r, 2.2, 4.6), p.r);
    }
    p.fillPath(wallDabs, PAL.ochreLt, 0.24);
    p.fillPath(polyPath([[x0 - 22, roofY + 6], [x1, roofY + 6], [x1, roofY - 12], [x0 - 14, roofY - 12]]), PAL.paperStone, 0.94);
    p.fillPath(polyPath([[x0 - 20, roofY + 6], [x1, roofY + 6], [x1, roofY + 26], [x0 - 8, roofY + 26]]), PAL.slate, 0.36);
    p.fillPath(polyPath([[x0 + 14, roofY - 12], [x1, roofY - 12], [x1, roofY - 34], [x0 + 14, roofY - 34]]), PAL.paperWarm, 0.95);
    const dcx = 2295;
    const dcy = roofY - 34;
    p.fillPath(polyPath([[dcx - 40, dcy], [dcx - 40, dcy - 42], [dcx + 40, dcy - 42], [dcx + 40, dcy]]), PAL.paperWarm, 0.95);
    p.fillPath(polyPath(mughalArchPoly(dcx, dcy - 36, dcy - 2, 15, 0.36)), PAL.slate, 0.55);
    p.fillPath(closedSmooth([
        ...sample(cubic([dcx - 42, dcy - 42], [dcx - 46, dcy - 74], [dcx - 14, dcy - 94], [dcx, dcy - 104]), 6),
        ...sample(cubic([dcx, dcy - 104], [dcx + 14, dcy - 94], [dcx + 46, dcy - 74], [dcx + 42, dcy - 42]), 6).slice(1),
    ]), PAL.petal, 0.96);
    for (const ax of [2260, 2388]) {
        p.fillPath(polyPath(mughalArchPoly(ax, roofY + 62, baseY - 22, 38, 0.34)), PAL.slate, 0.58);
        p.fillPath(polyPath(mughalArchPoly(ax, roofY + 95, baseY - 22, 24, 0.3)), PAL.slateDk, 0.52);
        p.layer("var(--z-halo-op)", () => {
            p.fillPath(circlePath(ax, roofY + 145, 74), PAL.lanternHalo, 0.22);
            p.fillPath(circlePath(ax, roofY + 145, 32), PAL.lantern, 0.46);
            p.fillPath(circlePath(ax, roofY + 145, 12), PAL.lanternCore, 0.82);
        });
    }
    p.fillPath(polyPath([[x0 - 20, baseY - 22], [x1, baseY - 22], [x1, baseY + 14], [x0 - 30, baseY + 14]]), PAL.paperStone, 0.92);
}
function birdGlyph(x, y, span) {
    return (`M${f(x - span)} ${f(y - span * 0.14)}` +
        `Q${f(x - span * 0.42)} ${f(y - span * 0.46)} ${f(x)} ${f(y + span * 0.1)}` +
        `Q${f(x + span * 0.42)} ${f(y - span * 0.46)} ${f(x + span)} ${f(y - span * 0.14)}` +
        `Q${f(x + span * 0.42)} ${f(y - span * 0.22)} ${f(x)} ${f(y + span * 0.28)}` +
        `Q${f(x - span * 0.42)} ${f(y - span * 0.22)} ${f(x - span)} ${f(y - span * 0.14)}Z`);
}
export function buildS03ReflectingPool() {
    const p = new Painter("s03", 30397);
    const hole = buildPavilionHole();
    const pTL = [765, 642];
    const pTR = [1295, 642];
    const pBR = [1415, 1515];
    const pBL = [420, 1515];
    // 1. Vast warm archival cream-paper sky (Midnight Prussian sky at Night)
    const skyGrad = p.linearGrad("sky", 0, BLEED.y0, 0, BLEED.y1, [
        [0, PAL.paper],
        [0.36, PAL.paper],
        [0.68, PAL.paperWarm],
        [1, PAL.paper],
    ]);
    p.asymmetricPortalBackdrop(hole, skyGrad, { smooth: false });
    // 2. Nocturnal starry sky & silver crescent moon
    p.layer("var(--z-star-op)", () => {
        let starsD = "";
        for (let i = 0; i < 58; i++) {
            const sx = rand(p.r, -240, 2640);
            const sy = rand(p.r, -180, 560);
            if (Math.hypot((sx - 1090) * 0.8, sy - 330) < 175)
                continue;
            starsD += circlePath(sx, sy, rand(p.r, 1.1, 2.5));
        }
        p.fillPath(starsD, PAL.inkRim, 0.84);
        p.fillPath(circlePath(335, 168, 28), PAL.petal, 0.88);
        p.fillPath(circlePath(346, 160, 25), PAL.paper, 1);
    });
    // 3. All scene elements strictly clipped outside the carved Mughal Baradari archway opening!
    p.clippedToBackdrop(hole, () => {
        // 3a. 5x Micro-Craft Taj Mahal Marble Mausoleum
        drawMarbleSanctuary(p, 1090, 642);
        // 3b. Gliding V-birds in the breathing archival cream sky
        p.animGroup({ kind: "drift", ampX: 38, ampY: -10, freq: 0.42, phase: 0.4 }, () => {
            p.fillPath(birdGlyph(1465, 252, 15) + birdGlyph(1522, 276, 12) + birdGlyph(1402, 224, 10), PAL.inkMid, 0.82);
        });
        p.animGroup({ kind: "drift", ampX: 28, ampY: 8, freq: 0.36, phase: 2.3 }, () => {
            p.fillPath(birdGlyph(472, 208, 11) + birdGlyph(518, 226, 9), PAL.inkMid, 0.72);
        });
        // 3c. Horizon terrace wash
        p.fillPath(polyPath([[BLEED.x0, 638], [BLEED.x1, 638], [BLEED.x1, 678], [BLEED.x0, 678]]), PAL.paperWarm, 0.68);
        // 3d. Geometric Mughal Charbagh Sunken Parterres & Diagonal Dry-Brush Terracotta Flagstone Promenades!
        drawCharbaghPromenadesAndParterres(p, [[260, 650], [745, 650], [400, 1515], [-260, 1515]], 360, "left");
        drawCharbaghPromenadesAndParterres(p, [[1315, 650], [1930, 650], [2340, 1515], [1435, 1515]], 390, "right");
        drawCharbaghPromenadesAndParterres(p, [[-240, 1508], [2620, 1508], [2760, 1860], [-360, 1860]], 200, "both");
        // 3e. Far-right terracotta garden pavilion loggia & sunken octagonal side fountain
        drawRightGardenPavilion(p);
        const fCx = 1970;
        const fCy = 1175;
        const fOuter = [
            [fCx - 138, fCy - 56], [fCx + 138, fCy - 56], [fCx + 206, fCy], [fCx + 168, fCy + 64],
            [fCx - 168, fCy + 64], [fCx - 206, fCy],
        ];
        p.fillPath(polyPath(fOuter), PAL.paperStone, 0.96);
        p.fillPath(polyPath([[fCx - 168, fCy + 64], [fCx + 168, fCy + 64], [fCx + 178, fCy + 76], [fCx - 178, fCy + 76]]), PAL.slate, 0.4);
        drawLushReflectingWater(p, [[fCx - 118, fCy - 42], [fCx + 118, fCy - 42], [fCx + 150, fCy + 48], [fCx - 150, fCy + 48]], 18, false);
        // 3f. FULL-LENGTH LUSH BROKEN-STROKE TURQUOISE REFLECTING POOL + VIVID INVERTED TAJ DOME REFLECTION!
        drawLushReflectingWater(p, [pTL, pTR, pBR, pBL], 78, true);
        p.animGroup({ kind: "ripple", ampX: 16, baseOp: 0.74, ampOp: 0.2, freq: 0.88, phase: 0.5 }, () => {
            let shimD = "";
            for (let i = 0; i < 44; i++) {
                const v = rand(p.r, 0.04, 0.96);
                const u = rand(p.r, 0.05, 0.85);
                const len = rand(p.r, 0.025, 0.08);
                const a = bilerp(pTL, pTR, pBR, pBL, u, v);
                const c = bilerp(pTL, pTR, pBR, pBL, Math.min(0.96, u + len), v);
                shimD += dryBrushStroke(a[0], a[1], c[0] - a[0], 0, 1.6 + v * 2.6, p.r);
            }
            p.fillPath(shimD, PAL.waterShimmer, 0.74);
        });
        // Outer Main Reflecting Pool White-Marble Coping Kerbs
        p.fillPath(polyPath([[pTL[0] - 24, pTL[1]], pTL, pBL, [pBL[0] - 32, pBL[1]]]), PAL.paperWarm, 0.97);
        p.fillPath(polyPath([[pTL[0] - 14, pTL[1]], pTL, pBL, [pBL[0] - 16, pBL[1]]]), PAL.petal, 0.42);
        p.fillPath(polyPath([pTR, [pTR[0] + 24, pTR[1]], [pBR[0] + 32, pBR[1]], pBR]), PAL.paperWarm, 0.97);
        p.fillPath(polyPath([pTR, [pTR[0] + 14, pTR[1]], [pBR[0] + 16, pBR[1]], pBR]), PAL.petal, 0.42);
        p.fillPath(polyPath([[pTL[0] - 24, pTL[1] - 4], [pTR[0] + 24, pTR[1] - 4], [pTR[0] + 24, pTR[1] + 4], [pTL[0] - 24, pTL[1] + 4]]), PAL.paperWarm, 0.96);
        p.fillPath(polyPath([[pBL[0] - 32, pBL[1] - 4], [pBR[0] + 32, pBR[1] - 4], [pBR[0] + 36, pBR[1] + 16], [pBL[0] - 36, pBL[1] + 16]]), PAL.paperWarm, 0.96);
        p.fillPath(polyPath([[pBL[0] - 36, pBL[1] + 16], [pBR[0] + 36, pBR[1] + 16], [pBR[0] + 38, pBR[1] + 26], [pBL[0] - 38, pBL[1] + 26]]), PAL.slate, 0.42);
        // 3g. Floating emerald lotus pads & porcelain lotus buds beside the Baradari kiosk
        drawLotusPad(p, 706, 985, 24, 11, 0.4, false);
        drawLotusPad(p, 1082, 998, 28, 13, 2.4, true);
        drawLotusPad(p, 1118, 922, 22, 10, 2.0, false);
        drawLotusPad(p, 1066, 1068, 20, 9, 1.6, false);
        // 3h. Carved Mughal Marble Baradari Water-Pavilion Kiosk bridged to left bank framing S04!
        drawMarbleBaradariKiosk(p, hole, pTL, pTR, pBR, pBL);
        // 3i. Warm Nocturnal Path Bollard Lanterns lining the long outer reflecting pool coping
        for (const side of ["L", "R"]) {
            for (let i = 0; i < 5; i++) {
                const v = 0.08 + i * 0.21;
                const pt = side === "L" ? bilerp(pTL, pTR, pBR, pBL, -0.04, v) : bilerp(pTL, pTR, pBR, pBL, 1.04, v);
                const sc = 0.54 + i * 0.13;
                p.fillPath(polyPath([[pt[0] - 5 * sc, pt[1]], [pt[0] + 5 * sc, pt[1]], [pt[0] + 4 * sc, pt[1] - 22 * sc], [pt[0] - 4 * sc, pt[1] - 22 * sc]]), PAL.paperStone, 0.94);
                p.fillPath(circlePath(pt[0], pt[1] - 25 * sc, 4.0 * sc), PAL.lantern, 0.9);
                p.layer("var(--z-halo-op)", () => {
                    p.fillPath(circlePath(pt[0], pt[1] - 25 * sc, 28 * sc), PAL.lanternHalo, 0.16);
                    p.fillPath(circlePath(pt[0], pt[1] - 25 * sc, 12 * sc), PAL.lantern, 0.34);
                    p.fillPath(circlePath(pt[0], pt[1] - 25 * sc, 5 * sc), PAL.lanternCore, 0.72);
                });
            }
        }
        // 3j. 5-Tone Fine-Stippled `stippleTreeCluster` Cypress Avenues with Velvety Soft Core (zero confetti gaps!)
        const cypressPal = {
            deepCore: PAL.sageDk,
            darkBody: PAL.sageDk,
            midOlive: PAL.sage,
            litSage: PAL.malachite,
            sunCrown: PAL.sageLt,
            trunk: PAL.umberDk,
        };
        const paintCypressCore = (list) => {
            let cores = "";
            for (const cl of list) {
                const sp = cl.spire ?? 1.38;
                if (sp > 0) {
                    const topY = cl.cy - cl.ry * 0.86;
                    const botY = cl.cy + cl.ry * 0.88;
                    const lPts = [];
                    const rPts = [];
                    for (let i = 0; i <= 8; i++) {
                        const u = i / 8;
                        const env = Math.pow(Math.min(1, u * 1.05), 0.72 * sp) * (u > 0.86 ? 1 - (u - 0.86) * 1.6 : 1);
                        const hw = cl.rx * 0.62 * env;
                        lPts.push([cl.cx - hw, topY + u * (botY - topY)]);
                        rPts.push([cl.cx + hw, topY + u * (botY - topY)]);
                    }
                    cores += closedSmooth([...lPts, ...rPts.reverse()]);
                }
                else {
                    cores += ellipsePath(cl.cx, cl.cy, cl.rx * 0.65, cl.ry * 0.65);
                }
            }
            p.fillPath(cores, PAL.sageDk, 0.74);
        };
        const rightCypresses = [
            { cx: 1368, cy: 604, rx: 22, ry: 58, spire: 1.38, trunkBaseY: 668, trunkWidth: 4, density: 1.65 },
            { cx: 1412, cy: 622, rx: 25, ry: 68, spire: 1.38, trunkBaseY: 696, trunkWidth: 4.5, density: 1.65 },
            { cx: 1460, cy: 648, rx: 28, ry: 78, spire: 1.38, trunkBaseY: 734, trunkWidth: 5, density: 1.7 },
            { cx: 1512, cy: 680, rx: 32, ry: 92, spire: 1.38, trunkBaseY: 780, trunkWidth: 5.5, density: 1.7 },
            { cx: 1570, cy: 722, rx: 37, ry: 108, spire: 1.4, trunkBaseY: 838, trunkWidth: 6, density: 1.75 },
            { cx: 1634, cy: 774, rx: 43, ry: 126, spire: 1.4, trunkBaseY: 910, trunkWidth: 7, density: 1.75 },
            { cx: 1706, cy: 840, rx: 50, ry: 150, spire: 1.4, trunkBaseY: 1002, trunkWidth: 8, density: 1.8 },
            { cx: 1788, cy: 922, rx: 58, ry: 178, spire: 1.42, trunkBaseY: 1112, trunkWidth: 9, density: 1.8 },
            { cx: 1878, cy: 1022, rx: 66, ry: 204, spire: 1.42, trunkBaseY: 1238, trunkWidth: 10, density: 1.85 },
            { cx: 2010, cy: 745, rx: 48, ry: 145, spire: 1.34, trunkBaseY: 902, trunkWidth: 7, density: 1.7 },
            { cx: 2125, cy: 820, rx: 58, ry: 172, spire: 1.34, trunkBaseY: 1004, trunkWidth: 8, density: 1.75 },
            { cx: 2210, cy: 1050, rx: 68, ry: 88, spire: 0, trunkBaseY: 1140, trunkWidth: 9, density: 1.7 },
            { cx: 2375, cy: 1285, rx: 118, ry: 96, spire: 0, density: 1.75 },
        ];
        paintCypressCore(rightCypresses);
        stippleTreeCluster(p, p.r, rightCypresses, { palette: cypressPal, dabSize: 7.4, groundShadow: true });
        const leftCypresses = [
            { cx: 695, cy: 604, rx: 22, ry: 58, spire: 1.38, trunkBaseY: 668, trunkWidth: 4, density: 1.65 },
            { cx: 644, cy: 626, rx: 26, ry: 72, spire: 1.38, trunkBaseY: 704, trunkWidth: 4.5, density: 1.65 },
            { cx: 588, cy: 658, rx: 30, ry: 86, spire: 1.38, trunkBaseY: 752, trunkWidth: 5.5, density: 1.7 },
            { cx: 526, cy: 700, rx: 36, ry: 106, spire: 1.4, trunkBaseY: 814, trunkWidth: 6.5, density: 1.75 },
            { cx: 458, cy: 758, rx: 44, ry: 132, spire: 1.4, trunkBaseY: 898, trunkWidth: 7.5, density: 1.75 },
            { cx: 382, cy: 832, rx: 54, ry: 164, spire: 1.42, trunkBaseY: 1008, trunkWidth: 9, density: 1.8 },
            { cx: 298, cy: 924, rx: 66, ry: 204, spire: 1.42, trunkBaseY: 1140, trunkWidth: 10.5, density: 1.85 },
            { cx: 202, cy: 1038, rx: 82, ry: 256, spire: 1.44, trunkBaseY: 1308, trunkWidth: 12, density: 1.9 },
        ];
        paintCypressCore(leftCypresses);
        stippleTreeCluster(p, p.r, leftCypresses, { palette: cypressPal, dabSize: 7.8, groundShadow: true });
        // Monumental twin foreground cypress giants anchoring far-left frame (gentle breeze sway!)
        p.animGroup({ kind: "sway", cx: 20, cy: 1580, ampDeg: 0.85, freq: 0.55, phase: 0.8 }, () => {
            const fgCyp = [
                { cx: 48, cy: 1125, rx: 144, ry: 470, spire: 1.44, density: 1.9 },
                { cx: -115, cy: 1165, rx: 148, ry: 495, spire: 1.4, density: 1.85 },
                { cx: 142, cy: 1315, rx: 104, ry: 295, spire: 1.36, density: 1.8 },
            ];
            paintCypressCore(fgCyp);
            stippleTreeCluster(p, p.r, fgCyp, { palette: cypressPal, dabSize: 11.2, groundShadow: false });
        });
        // 3k. Tiny 2-Tone Human Promenade & Baradari Causeway Visitors (`scaleFigures`)
        const figures = [
            { x: 328, y: 1315, h: 66, coat: PAL.cinnabarLt, kind: "dress", dir: 1 },
            { x: 384, y: 1318, h: 70, coat: PAL.ochre, kind: "coat", dir: 1 },
            { x: 488, y: 985, h: 38, coat: PAL.prussianLt, kind: "coat", dir: -1 },
            { x: 565, y: 835, h: 26, coat: PAL.cinnabar, kind: "dress", dir: 1 },
            // Visitors stepping across the marble causeway onto the Baradari water-pavilion!
            { x: 642, y: 1022, h: 34, coat: PAL.ochre, kind: "coat", dir: 1 },
            { x: 678, y: 1024, h: 32, coat: PAL.cinnabarLt, kind: "dress", dir: 1 },
            { x: 845, y: 656, h: 17, coat: PAL.cinnabar, kind: "coat", dir: 1 },
            { x: 1015, y: 654, h: 16, coat: PAL.prussianLt, kind: "coat", dir: -1 },
            { x: 1190, y: 654, h: 16, coat: PAL.ochre, kind: "coat", dir: 1 },
            { x: 1310, y: 656, h: 17, coat: PAL.cinnabarLt, kind: "dress", dir: -1 },
            { x: 1465, y: 835, h: 28, coat: PAL.ochre, kind: "dress", dir: 1 },
            { x: 1555, y: 995, h: 40, coat: PAL.cinnabar, kind: "coat", dir: -1 },
            { x: 1608, y: 1002, h: 38, coat: PAL.paperWarm, kind: "parasol", dir: -1 },
            { x: 1755, y: 1198, h: 48, coat: PAL.paperWarm, kind: "parasol", dir: 1 },
            { x: 1820, y: 1206, h: 50, coat: PAL.prussianLt, kind: "coat", dir: 1 },
            { x: 2055, y: 1325, h: 56, coat: PAL.ochre, kind: "coat", dir: -1 },
            { x: 2112, y: 1330, h: 54, coat: PAL.cinnabarLt, kind: "dress", dir: -1 },
            { x: 1575, y: 1485, h: 64, coat: PAL.slateDk, kind: "coat", dir: -1 },
            { x: 1518, y: 1488, h: 62, coat: PAL.cinnabarLt, kind: "dress", dir: -1 },
        ];
        p.scaleFigures(figures, { shadowDir: [1.0, 0.24], shadowOpacity: 0.22 });
    }, false, "pool-clip");
    p.flush();
    return {
        index: 3,
        id: "s03-reflecting-pool",
        title: "Marble Sanctuary & Reflecting Pool",
        subtitle: "Pietra dura marble dome, stippled cypresses & Baradari kiosk",
        portal: S03_PORTAL,
        coreColorDay: [244, 241, 232],
        coreColorNight: [20, 30, 50],
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
