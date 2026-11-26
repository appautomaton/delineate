// S11: Faceted Ink-and-Mineral 青绿山水 Li River Karst Gorge, Cliffside Cedar Teahouse & Moon-Bridge
// Stage-5 `5x` Micro-Craft Overhaul (`PathBatcher` + `stippleTreeCluster`, `portal: (860, 950)`):
//   - KILLED ALL SMOOTH GREEN CONES! Every karst tower is sculpted with **faceted angular columnar
//     limestone rock planes** (*斧劈皴* axe-cut cliff shadows + *披麻皴* downward non-scaling brush
//     veins + sunlit warm ochre-sage vs cool Prussian-slate vertical cliff faces + clustered *苔点*
//     moss dabs + gnarled cliffside pines + feathered silk mist bands)!
//   - Right cliff (`x = 1280..2780`): Grand cantilevered 3-part cliffside cedar teahouse (`悬空吊脚茶楼`
//     + high perched `望江亭` belvedere) with intricate `0.35px` ice-ray / stepped-key / fretwork
//     lattice windows glowing warm 2 AM amber at Night, curved ceramic roof tiles + round eave-end
//     `瓦当` caps, tiered `dougong` wooden brackets, hanging signboard, 6 swaying palace lanterns,
//     carved stone cliff stair, dense multi-layered bamboo groves & 9 veranda/stair tea guests!
//   - Lower-left river channel (`portal: (860, 950)`, compact `268x234` semicircular stone arch):
//     Individually coursed dressed-granite moon-bridge with double-ring voussoirs, sculpted pointed
//     lotus-bud post finials (`仰覆莲望柱头`), recessed cloud-scroll balustrade panels (`栏板`), bridge
//     lanterns, expansive broken-reflection Li River with staggered `lijiang` wavelets, bobbing
//     wooden canopy sampan boatman & distant cormorant bamboo raft opening seamlessly into S12!
import { PAL, Painter, PathBatcher, archDoorwayHole, circlePath, closedSmooth, cubic, ellipsePath, f, lerp, openPoly, polyPath, quad, rad, rand, sample, stippleTreeCluster, } from "../kit.js";
import { BLEED, requiredPortalClearBox, requiredPortalSealBox, validatePortalHole, } from "./types.js";
export const S11_PORTAL = { cx: 860, cy: 950, rx: 145, ry: 118 };
const S12_NEXT_PORTAL = [1520, 840];
/**
 * Museum-grade Ink-and-Mineral 青绿山水 Karst Tower (`lijiang` rounded-summit tower profile + continuous
 * jagged central ridge spine via `PathBatcher` — ZERO floating diamonds, ZERO sharp triangles, ZERO stroke bloat!).
 * Divides each steep limestone tower cleanly along a continuous jagged central ridge spine into a warm
 * sunlit ochre-celadon left face and a continuous cool malachite/azurite right cliff shadow plane,
 * textured with flowing downward *披麻皴* (`lotusVeins`), short `cun` slope strokes, clustered *苔点*
 * moss dabs & gnarled cliff pines!
 */
function drawFacetedKarstPeak(p, opts) {
    const { cx, baseY, w, h, lean, tier, fill, pines } = opts;
    const powP = rand(p.r, 2.5, 3.4); // steep columnar flanks (`lijiang` tower profile!)
    const powQ = rand(p.r, 0.36, 0.48); // naturally rounded worn limestone summit
    const wobL = [0, 1].map(() => [rand(p.r, 0, Math.PI * 2), rand(p.r, 1.8, 4.2), rand(p.r, 0.025, 0.06)]);
    const wobR = [0, 1].map(() => [rand(p.r, 0, Math.PI * 2), rand(p.r, 1.8, 4.2), rand(p.r, 0.025, 0.06)]);
    const ledgeL = [opts.shoulderL ?? rand(p.r, 0.34, 0.68), rand(p.r, 0.08, 0.16), rand(p.r, 0.05, 0.08)];
    const ledgeR = [opts.shoulderR ?? rand(p.r, 0.28, 0.64), rand(p.r, 0.08, 0.16), rand(p.r, 0.05, 0.08)];
    const halfW = (t0, side) => {
        const t = Math.max(0, Math.min(1, t0));
        const shape = Math.pow(Math.max(0, 1 - Math.pow(t, powP)), powQ);
        const calm = Math.pow(1 - t, 0.55);
        const wArr = side < 0 ? wobL : wobR;
        let wob = 0;
        for (const [ph, k, a] of wArr)
            wob += a * Math.sin(t * k * Math.PI + ph);
        const [la, lamp, ls] = side < 0 ? ledgeL : ledgeR;
        const ledge = lamp * Math.exp(-(((t - la) / ls) ** 2));
        return w * 0.5 * shape * (1 + (wob + ledge) * calm);
    };
    const at = (t, side, frac = 1) => [cx + lean * h * t * (2 - t) + side * halfW(t, side) * frac, baseY - h * t];
    const leftFlank = sample((t) => at(t, -1), 18);
    const rightFlank = sample((t) => at(t, 1), 18).reverse(); // summit -> base
    const topPt = at(1, -1, 0);
    // Continuous jagged central fracture ridge spine dividing warm sunlit left face from cool shadowed right cliff!
    const spineN = 9;
    const spine = Array.from({ length: spineN }, (_, i) => {
        const t = 1 - i / (spineN - 1);
        const jag = i === 0 ? 0 : rand(p.r, -0.14, 0.14) * halfW(t, 1);
        return [cx + lean * h * t * (2 - t) + jag, baseY - h * t];
    });
    const b = new PathBatcher();
    const fullOutline = [...leftFlank, ...rightFlank.slice(1)];
    const bodySmooth = closedSmooth(fullOutline);
    // 1. Opaque knockout + primary mineral silk wash
    b.addPath("ko", bodySmooth, { fill: PAL.paper, fillOpacity: tier === "far" ? 0.94 : 0.99 });
    b.addPath("body", bodySmooth, { fill, fillOpacity: tier === "far" ? 0.88 : 0.96 });
    // 2. Continuous Warm Sunlit Ochre-Celadon Left Face vs Continuous Cool Azurite/Malachite Right Shadow Face!
    const sunlitPoly = [...leftFlank, ...spine.slice(1)];
    b.addPath("sunFace", polyPath(sunlitPoly), {
        fill: PAL.ochreLt,
        fillOpacity: tier === "far" ? 0.24 : 0.3,
    });
    // Secondary left-rim sunlit glow strip catching upper-left daylight
    const litStrip = [...sample((t) => at(t, -1, 0.96), 12), ...sample((t) => at(t, -1, 0.54), 12).reverse()];
    b.addPath("sunRim", closedSmooth(litStrip), { fill: PAL.paperWarm, fillOpacity: tier === "far" ? 0.2 : 0.26 });
    // Continuous shadowed right face (`spine -> rightFlank` — ZERO floating diamonds!)
    const rightShadePoly = [...spine, ...rightFlank.slice().reverse()];
    b.addPath("shadeFace", polyPath(rightShadePoly), {
        fill: tier === "far" ? PAL.azurite : PAL.prussian,
        fillOpacity: tier === "far" ? 0.38 : 0.54,
    });
    // Continuous deeper vertical shadow flank hugging right cliff silhouette
    const deepFlank = [...sample((t) => at(t, 1, 0.98), 12), ...sample((t) => at(t, 1, 0.56), 12).reverse()];
    b.addPath("deepFlank", closedSmooth(deepFlank), {
        fill: PAL.prussianDk,
        fillOpacity: tier === "far" ? 0.2 : 0.36,
    });
    // 3. Flowing Downward *披麻皴* (`lotusVeins`) & Short `cun` Texture Strokes (non-scaling `<= 0.65px`!)
    const veinCount = tier === "far" ? 12 : 18;
    for (let i = 0; i < veinCount; i++) {
        const side = i < veinCount * 0.68 ? 1 : -1;
        const frac = side > 0 ? rand(p.r, 0.14, 0.88) : rand(p.r, 0.32, 0.86);
        const t0 = side > 0 ? rand(p.r, 0.08, 0.38) : rand(p.r, 0.24, 0.52);
        const t1 = rand(p.r, 0.78, 0.95);
        const seg = sample((u) => at(t1 - u * (t1 - t0), side, frac), 7);
        b.addPath(side > 0 ? "veinSh" : "veinLt", openPoly(seg), {
            stroke: side > 0 ? PAL.prussianDk : PAL.celadonDk,
            strokeWidth: tier === "far" ? 0.44 : 0.6,
            strokeOpacity: tier === "far" ? 0.44 : 0.58,
            nonScaling: "hatch",
        });
    }
    const cunCount = tier === "far" ? 20 : 34;
    for (let i = 0; i < cunCount; i++) {
        const side = p.r() < 0.72 ? 1 : -1;
        const t = rand(p.r, 0.12, 0.86);
        const frac = side > 0 ? rand(p.r, 0.22, 0.94) : rand(p.r, 0.48, 0.92);
        const len = rand(p.r, 0.05, 0.12);
        const a0 = at(t, side, frac);
        const a1 = at(Math.max(0.03, t - len * 0.5), side, frac);
        const a2 = at(Math.max(0.02, t - len), side, frac);
        b.addPath("cun", `M${f(a0[0])} ${f(a0[1])}Q${f(a1[0] + rand(p.r, -2, 2))} ${f(a1[1])} ${f(a2[0])} ${f(a2[1])}`, {
            stroke: side > 0 ? PAL.prussianDk : PAL.celadonDk,
            strokeWidth: tier === "far" ? 0.38 : 0.48,
            strokeOpacity: tier === "far" ? 0.42 : 0.52,
            nonScaling: "hatch",
        });
    }
    // 4. Razor-Fine Non-Scaling Silk Contours & Jagged Ridge Spine (`<= 0.85px` at ALL scales, `feibai` sunlit break!)
    b.addPath("litEdge", openPoly(leftFlank.slice(2, 9)) + openPoly(leftFlank.slice(11)), {
        stroke: tier === "far" ? PAL.celadonDk : PAL.inkMid,
        strokeWidth: tier === "far" ? 0.48 : 0.64,
        strokeOpacity: tier === "far" ? 0.54 : 0.7,
        nonScaling: "contour",
    });
    b.addPath("shEdge", openPoly(rightFlank.slice(0, -2)), {
        stroke: tier === "far" ? PAL.prussian : PAL.ink,
        strokeWidth: tier === "far" ? 0.72 : 0.86,
        strokeOpacity: tier === "far" ? 0.66 : 0.84,
        nonScaling: "contour",
    });
    b.addPath("spineEdge", openPoly(spine.slice(0, -1)), {
        stroke: tier === "far" ? PAL.prussian : PAL.inkSepia,
        strokeWidth: tier === "far" ? 0.46 : 0.58,
        strokeOpacity: tier === "far" ? 0.44 : 0.58,
        nonScaling: "hatch",
    });
    // 5. Clustered *苔点* (Horizontal Mineral Moss Dabs along Ledges & Summit Ridges)
    const mossClusters = tier === "far" ? 12 : 20;
    for (let i = 0; i < mossClusters; i++) {
        const side = p.r() < 0.5 ? -1 : 1;
        const t = p.r() < 0.7 ? rand(p.r, 0.58, 0.97) : rand(p.r, 0.26, 0.58);
        const pt = i % 3 === 0 ? spine[Math.min(spine.length - 2, Math.floor((1 - t) * (spine.length - 1)))] : at(t, side, rand(p.r, 0.78, 0.97));
        for (let k = 0; k < 3; k++) {
            b.dab("moss", pt[0] + rand(p.r, -10, 10), pt[1] + rand(p.r, -5, 5), rand(p.r, 3.0, 6.2), rand(p.r, 1.6, 3.0), rand(p.r, -0.25, 0.25), p.r, {
                fill: PAL.sageDk,
                fillOpacity: tier === "far" ? 0.62 : 0.84,
            });
        }
    }
    b.flush(p);
    p.moonRim(leftFlank, { closed: false, up: true, widthPx: tier === "far" ? 0.58 : 0.8 });
    // 6. Gnarled Cliffside Scholar Pines clinging to summit & cliff ledges!
    for (let k = 0; k < pines; k++) {
        const anchor = k === 0 ? [topPt[0] - w * 0.04, topPt[1] + h * 0.03] : at(rand(p.r, 0.64, 0.84), k % 2 === 0 ? -1 : 1, rand(p.r, 0.45, 0.82));
        p.inkPine(anchor[0], anchor[1], tier === "far" ? 0.64 : rand(p.r, 0.78, 1.04), k % 2 === 0 ? 1 : -1);
    }
}
/** Draws one cantilevered traditional Chinese cedar roof with sweeping upturned eaves, tiles & round `瓦当` eave caps! */
function drawSweptEaves(p, xL, xR, yRidge, yEave, tipLift, roofGrad) {
    const span = xR - xL;
    const rInL = xL + span * 0.15;
    const rInR = xR - span * 0.15;
    const topCurveL = sample(quad([rInL, yRidge], [xL + span * 0.04, yEave - 7], [xL - 36, yEave - tipLift]), 10);
    const topCurveR = sample(quad([rInR, yRidge], [xR - span * 0.04, yEave - 7], [xR + 36, yEave - tipLift]), 10);
    const botCurve = sample(cubic([xR + 36, yEave - tipLift + 14], [xR - span * 0.18, yEave + 16], [xL + span * 0.18, yEave + 16], [xL - 36, yEave - tipLift + 14]), 18);
    const roofPoly = [...topCurveL.slice().reverse(), [rInR, yRidge], ...topCurveR.slice(1), ...botCurve];
    p.fillPath(polyPath(roofPoly), roofGrad, 0.99);
    p.scallopedRoofTiles(roofPoly, 18, 12, PAL.ink, 0.54);
    const rfB = new PathBatcher();
    // Vertical ceramic tile rib channels (`筒瓦脊`) running from ridge to eave + round eave-end tile caps (`瓦当`)!
    const ribN = Math.round(span / 20);
    for (let i = 1; i < ribN; i++) {
        const u = i / ribN;
        const rxTop = lerp([rInL, yRidge + 3], [rInR, yRidge + 3], u);
        const bIdx = Math.min(botCurve.length - 1, Math.round((1 - u) * (botCurve.length - 1)));
        const rxBot = botCurve[bIdx];
        rfB.line("rib", rxTop[0], rxTop[1], rxBot[0], rxBot[1], { stroke: PAL.prussianDk, strokeWidth: 0.4, strokeOpacity: 0.48, nonScaling: "hatch" });
        rfB.circle("wadang", rxBot[0], rxBot[1] + 1, 2.2, { fill: PAL.ochreLt, fillOpacity: 0.82 });
    }
    const soffit = sample(cubic([xL - 20, yEave - tipLift + 16], [xL + span * 0.18, yEave + 22], [xR - span * 0.18, yEave + 22], [xR + 20, yEave - tipLift + 16]), 14);
    rfB.addPath("soffit", polyPath([...botCurve, ...soffit.slice().reverse()]), { fill: PAL.umberDk, fillOpacity: 0.94 });
    // Carved ridge beam & twin ceramic dragon-tail finials (`鸱吻`)
    rfB.quad("ridge", [rInL - 7, yRidge - 10], [rInR + 7, yRidge - 10], [rInR + 4, yRidge + 4], [rInL - 4, yRidge + 4], { fill: PAL.slateDk, fillOpacity: 0.98 });
    rfB.quad("finial", [rInL - 15, yRidge - 22], [rInL + 4, yRidge - 10], [rInL - 4, yRidge + 2], [rInL - 17, yRidge - 4], { fill: PAL.ochre, fillOpacity: 0.94 });
    rfB.quad("finial", [rInR + 15, yRidge - 22], [rInR - 4, yRidge - 10], [rInR + 4, yRidge + 2], [rInR + 17, yRidge - 4], { fill: PAL.ochre, fillOpacity: 0.94 });
    rfB.flush(p);
    p.burinContour(openPoly(topCurveL) + openPoly(topCurveR), PAL.litEdge, 0.72, 0.76, 2);
    p.burinContour(openPoly(botCurve), PAL.ink, 0.82, 0.85, 1);
    p.moonRim(topCurveL, { closed: false, up: true, widthPx: 0.85 });
}
/** Draws dense multi-layered calligraphic bamboo culms + lance leaves (`PathBatcher` inside sway animGroup). */
function drawBambooCluster(p, stalks, leafScale = 1) {
    for (const [bx, by, bh, lean, phase] of stalks) {
        p.animGroup({ kind: "sway", cx: bx, cy: by, ampDeg: 2.0, freq: 0.78, phase }, () => {
            const culm = sample(quad([bx, by], [bx + bh * lean * 0.42, by - bh * 0.52], [bx + bh * lean, by - bh]), 12);
            p.pressuredRibbon(culm, 10.5 * leafScale, PAL.sageDk, 0.95, 0.3);
            const b = new PathBatcher();
            b.addPath("hi", openPoly(culm), { stroke: PAL.sageLt, strokeWidth: 0.5, strokeOpacity: 0.54, nonScaling: "contour" });
            for (let k = 1; k <= 8; k++) {
                const pt = culm[Math.min(culm.length - 1, Math.round((k / 9) * (culm.length - 1)))];
                b.line("node", pt[0] - 6.5 * leafScale, pt[1], pt[0] + 6.5 * leafScale, pt[1], { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.8, nonScaling: "contour" });
                if (k >= 2) {
                    for (const side of [-1, 1]) {
                        for (let lf = 0; lf < 6; lf++) {
                            const ang = rad(side > 0 ? -44 + lf * 21 : 224 - lf * 21);
                            const lLen = rand(p.r, 40, 78) * leafScale;
                            const tip = [pt[0] + Math.cos(ang) * lLen, pt[1] + Math.sin(ang) * lLen];
                            const mid = [pt[0] + Math.cos(ang) * lLen * 0.46, pt[1] + Math.sin(ang) * lLen * 0.46 - 7 * leafScale];
                            const blade = `M${f(pt[0])} ${f(pt[1])}Q${f(mid[0])} ${f(mid[1])} ${f(tip[0])} ${f(tip[1])}Q${f(mid[0])} ${f(mid[1] + 9 * leafScale)} ${f(pt[0])} ${f(pt[1])}Z`;
                            if (lf % 3 === 0)
                                b.addPath("lfDk", blade, { fill: PAL.sageDk, fillOpacity: 0.94 });
                            else if (lf % 3 === 1)
                                b.addPath("lfMid", blade, { fill: PAL.malachite, fillOpacity: 0.88 });
                            else
                                b.addPath("lfLt", blade, { fill: PAL.sage, fillOpacity: 0.84 });
                        }
                    }
                }
            }
            b.flush(p);
        });
    }
}
export function buildS11Teahouse() {
    const p = new Painter("s11", 5911);
    // Scale-6 off-center portal geometry: graceful semicircular stone moon-bridge arch!
    const clearBox = requiredPortalClearBox(S11_PORTAL, S12_NEXT_PORTAL);
    const sealBox = requiredPortalSealBox(S11_PORTAL);
    const hole = archDoorwayHole(clearBox, {
        padL: 16,
        padR: 16,
        padTop: 14,
        padBot: 14,
        archRise: 56,
        pointed: false,
        sealBox,
    });
    validatePortalHole("s11-teahouse", hole, S11_PORTAL, S12_NEXT_PORTAL);
    const archXL = hole[0][0]; // ~747
    const archXR = hole[20][0]; // ~1015
    const archMidX = (archXL + archXR) * 0.5; // ~881
    const archSpringY = hole[0][1]; // ~869
    const archApexY = hole[10][1]; // ~813
    const archBotY = hole[21][1]; // ~1047
    const archHalfW = (archXR - archXL) * 0.5; // ~134
    const archRise = archSpringY - archApexY; // ~56
    // ---------- Gradients (true 青绿山水 mineral pigments!) ----------
    const silkSkyGrad = p.linearGrad("sky", 0, BLEED.y0, 0, archBotY + 40, [
        [0, PAL.paperDeep],
        [0.36, PAL.paperWarm],
        [0.72, PAL.paper],
        [1, PAL.paperMist],
    ]);
    const farPeakGrad = p.linearGrad("farpeak", 0, 220, 0, 880, [
        [0, PAL.azurite],
        [0.32, PAL.malachite],
        [0.68, PAL.celadon],
        [1, PAL.ochreLt],
    ]);
    const midPeakGrad = p.linearGrad("midpeak", 0, 120, 0, 1020, [
        [0, PAL.azurite],
        [0.38, PAL.malachite],
        [0.74, PAL.sage],
        [1, PAL.ochre],
    ]);
    const nearCliffGrad = p.linearGrad("nearcliff", 0, 60, 0, 1180, [
        [0, PAL.prussian],
        [0.32, PAL.azurite],
        [0.62, PAL.malachite],
        [0.84, PAL.sageDk],
        [1, PAL.umber],
    ]);
    const softMistGrad = p.linearGrad("softmist", 0, 420, 0, 820, [
        [0, PAL.paperMist, 0],
        [0.38, PAL.paperMist, 0.52],
        [0.66, PAL.paperMist, 0.38],
        [1, PAL.paperMist, 0],
    ]);
    const shoreMistGrad = p.linearGrad("shoremist", 0, 740, 0, 1025, [
        [0, PAL.paperMist, 0],
        [0.45, PAL.paperMist, 0.42],
        [1, PAL.paperMist, 0],
    ]);
    const riverGrad = p.linearGrad("river", 0, archBotY, 0, BLEED.y1, [
        [0, PAL.celadonLt],
        [0.28, PAL.water],
        [0.68, PAL.celadonDk],
        [1, PAL.waterDeep],
    ]);
    const roofGrad = p.linearGrad("roof", 1320, 160, 2360, 800, [
        [0, PAL.slateLt],
        [0.42, PAL.slate],
        [1, PAL.prussianDk],
    ]);
    const bridgeSunGrad = p.linearGrad("bridge", 520, 745, 1250, archBotY, [
        [0, PAL.paperWarm],
        [0.48, PAL.paperStone],
        [1, PAL.paperShadow],
    ]);
    const teahouseGlow = p.radialGrad("thglow", 1810, 735, 560, [
        [0, PAL.lanternCore, 0.48],
        [0.38, PAL.lantern, 0.25],
        [0.76, PAL.lanternHalo, 0.08],
        [1, PAL.lanternHalo, 0],
    ]);
    const boatLampGlow = p.radialGrad("boatlamp", 415, 1265, 140, [
        [0, PAL.lanternCore, 0.9],
        [0.38, PAL.lantern, 0.44],
        [0.75, PAL.lanternHalo, 0.12],
        [1, PAL.lanternHalo, 0],
    ]);
    // 1. Aged silk sky backdrop punched cleanly by the semicircular moon-bridge arch
    p.asymmetricPortalBackdrop(hole, silkSkyGrad, { smooth: false });
    p.clippedToBackdrop(hole, () => {
        // =========================================================================
        // LAYER A: SILK SKY, SEAL SUN / NIGHT MOON, STARS & SOARING EGRETS
        // =========================================================================
        p.fillPath(circlePath(425, 196, 56), PAL.cinnabarLt, 0.24);
        p.fillPath(circlePath(425, 196, 33), PAL.cinnabar, 0.72);
        p.layer("var(--z-star-op)", () => {
            let starsD = "";
            for (let i = 0; i < 66; i++) {
                starsD += `M${f(rand(p.r, -120, 2480))} ${f(rand(p.r, -160, 460))}h0.22`;
            }
            p.burinContour(starsD, PAL.inkRim, 1.35, 0.88, 66);
            p.fillPath(circlePath(425, 196, 76), PAL.lanternCore, 0.18);
            p.fillPath(circlePath(425, 196, 35), PAL.petal, 0.94);
        });
        p.animGroup({ kind: "drift", ampX: 46, ampY: -10, freq: 0.36, phase: 0.4 }, () => {
            for (const [ex, ey, sc] of [
                [750, 178, 1.1],
                [834, 146, 0.84],
                [1160, 224, 0.72],
            ]) {
                p.fillPath(`M${f(ex - 20 * sc)} ${f(ey + 3 * sc)}Q${f(ex - 8 * sc)} ${f(ey - 10 * sc)} ${f(ex)} ${f(ey + 2 * sc)}` +
                    `Q${f(ex + 9 * sc)} ${f(ey - 11 * sc)} ${f(ex + 22 * sc)} ${f(ey + 2 * sc)}` +
                    `Q${f(ex + 9 * sc)} ${f(ey - 4 * sc)} ${f(ex)} ${f(ey + 6 * sc)}` +
                    `Q${f(ex - 8 * sc)} ${f(ey - 4 * sc)} ${f(ex - 20 * sc)} ${f(ey + 3 * sc)}Z`, PAL.inkSepia, 0.78);
            }
        });
        // =========================================================================
        // LAYER B: FACETED INK-AND-MINERAL 青绿山水 KARST GORGE (`斧劈皴 / 披麻皴`)!
        // ZERO smooth rounded green cones — sharp angular columnar limestone rock faces!
        // =========================================================================
        // Stratum 1: Distant atmospheric faceted karst towers receding in silk mist (`opacity: 0.66`)
        p.layer("0.66", () => {
            drawFacetedKarstPeak(p, { cx: 195, baseY: 880, w: 300, h: 550, lean: -0.07, tier: "far", fill: farPeakGrad, pines: 0, shoulderL: 0.66, shoulderR: 0.56 });
            drawFacetedKarstPeak(p, { cx: 555, baseY: 885, w: 265, h: 495, lean: 0.06, tier: "far", fill: farPeakGrad, pines: 1, shoulderL: 0.6, shoulderR: 0.68 });
            drawFacetedKarstPeak(p, { cx: 885, baseY: 895, w: 280, h: 455, lean: -0.05, tier: "far", fill: farPeakGrad, pines: 1, shoulderL: 0.7, shoulderR: 0.52 });
            drawFacetedKarstPeak(p, { cx: 1210, baseY: 885, w: 320, h: 575, lean: 0.07, tier: "far", fill: farPeakGrad, pines: 1, shoulderL: 0.58, shoulderR: 0.66 });
        });
        // Feathered upper valley silk-mist veil
        p.animGroup({ kind: "drift", ampX: 52, ampY: 5, freq: 0.28, phase: 0.6 }, () => {
            p.fillPath(polyPath([[BLEED.x0, 420], [BLEED.x1, 420], [BLEED.x1, 820], [BLEED.x0, 820]]), softMistGrad, 1);
        });
        // Stratum 2: Towering Mid-Ground & Hero Faceted Limestone Cliffs LEFT & RIGHT!
        drawFacetedKarstPeak(p, { cx: -105, baseY: archBotY, w: 480, h: 880, lean: 0.08, tier: "near", fill: nearCliffGrad, pines: 2, shoulderL: 0.64, shoulderR: 0.58 });
        drawFacetedKarstPeak(p, { cx: 290, baseY: archBotY, w: 375, h: 630, lean: -0.06, tier: "mid", fill: midPeakGrad, pines: 2, shoulderL: 0.68, shoulderR: 0.54 });
        // Towering Right Karst Cliff Massif anchoring our cantilevered teahouse compound
        drawFacetedKarstPeak(p, { cx: 1620, baseY: archBotY, w: 485, h: 990, lean: -0.06, tier: "near", fill: nearCliffGrad, pines: 2, shoulderL: 0.72, shoulderR: 0.62 });
        drawFacetedKarstPeak(p, { cx: 2055, baseY: archBotY, w: 560, h: 1130, lean: -0.07, tier: "near", fill: nearCliffGrad, pines: 2, shoulderL: 0.62, shoulderR: 0.7 });
        drawFacetedKarstPeak(p, { cx: 2480, baseY: archBotY, w: 580, h: 1185, lean: -0.08, tier: "near", fill: nearCliffGrad, pines: 1, shoulderL: 0.66, shoulderR: 0.58 });
        // Soft shore-level river mist dissolving karst bases into the Li River
        p.fillPath(polyPath([[BLEED.x0, 740], [BLEED.x1, 740], [BLEED.x1, 1025], [BLEED.x0, 1025]]), shoreMistGrad, 1);
        // Left & Right faceted limestone cliff foundations meeting the river cleanly at `y = archBotY (1047)`!
        drawFacetedKarstPeak(p, { cx: 160, baseY: archBotY, w: 425, h: 235, lean: 0.04, tier: "near", fill: nearCliffGrad, pines: 1, shoulderL: 0.62, shoulderR: 0.52 });
        const rightCliffBase = [[1235, archBotY], [1365, 922], [1680, 892], [2080, 878], [BLEED.x1, 842], [BLEED.x1, archBotY]];
        p.fillPath(polyPath(rightCliffBase), nearCliffGrad, 0.98);
        const rcB = new PathBatcher();
        for (let i = 0; i < 16; i++) {
            const vx = 1350 + i * 72;
            rcB.line("vein", vx, 902, vx - 24, archBotY - 6, { stroke: PAL.prussianDk, strokeWidth: 0.55, strokeOpacity: 0.52, nonScaling: "hatch" });
        }
        rcB.flush(p);
        // =========================================================================
        // LAYER C: 5x-CRAFT MULTI-STORY CANTILEVERED CLIFFSIDE CEDAR TEAHOUSE COMPOUND!
        // Intricate Chinese `冰裂纹 / 步步锦` lattice screens, `dougong` brackets,
        // lacquered columns on stone plinths, signboard & 6 swaying silk palace lanterns!
        // =========================================================================
        p.layer("var(--z-halo-op)", () => {
            p.fillPath(circlePath(1810, 735, 560), teahouseGlow, 0.88);
        });
        // 0. Upper Perched Cliffside Belvedere (`望江亭`)
        p.archFacadeGrid({ x: 1905, y: 242, w: 224, h: 98 }, 6, 2, {
            wallFill: PAL.bark,
            glassFill: PAL.windowDim,
            tintFill: PAL.paperWarm,
            litFill: PAL.windowLit,
            litChance: 0.85,
            insetU: 0.12,
            insetV: 0.12,
            marginU: 0.03,
            marginV: 0.05,
            mullionColor: PAL.ink,
            mullionWidthPx: 0.36,
            mullionOpacity: 0.84,
            beltEvery: 1,
            edgeRim: false,
        });
        for (const cx of [1898, 2017, 2136]) {
            p.fillPath(polyPath([[cx - 5, 236], [cx + 5, 236], [cx + 5, 342], [cx - 5, 342]]), PAL.cinnabarDk, 0.96);
        }
        drawSweptEaves(p, 1865, 2170, 158, 240, 34, roofGrad);
        // 1. Diagonal Timber Cantilever Stilt Bracing (`吊脚木柱`) + Carved Stone Plinths (`柱础`)
        const thB = new PathBatcher();
        const stiltXs = [1390, 1505, 1625, 1755, 1885, 2015, 2145, 2265];
        for (let i = 0; i < stiltXs.length; i++) {
            const sx = stiltXs[i];
            const yBot = i < 2 ? archBotY : 995;
            thB.quad("stilt", [sx - 8, 868], [sx + 8, 868], [sx + 10, yBot], [sx - 10, yBot], { fill: PAL.barkDk, fillOpacity: 0.99 });
            thB.rect("plinth", sx - 13, yBot - 10, 26, 10, { fill: PAL.paperStone, fillOpacity: 0.92 });
            if (i + 1 < stiltXs.length) {
                thB.line("brace", sx, 902, stiltXs[i + 1], 978, { stroke: PAL.umberDk, strokeWidth: 0.95, strokeOpacity: 0.88, nonScaling: "contour" });
                thB.line("brace", stiltXs[i + 1], 902, sx, 978, { stroke: PAL.umberDk, strokeWidth: 0.95, strokeOpacity: 0.88, nonScaling: "contour" });
            }
        }
        // Heavy cantilevered floor girder deck + carved under-deck fascia panels
        thB.rect("deck", 1340, 854, 1000, 32, { fill: PAL.bark, fillOpacity: 0.99 });
        thB.rect("deckSh", 1350, 886, 980, 14, { fill: PAL.umberDk, fillOpacity: 0.94 });
        thB.line("deckHi", 1340, 854, 2340, 854, { stroke: PAL.litEdge, strokeWidth: 0.65, strokeOpacity: 0.72, nonScaling: "contour" });
        thB.flush(p);
        // 2. TIER 1: Main River Veranda & Tea Hall (`16 cols x 4 rows` ultra-fine shoji lattice!)
        p.archFacadeGrid({ x: 1416, y: 640, w: 860, h: 214 }, 16, 4, {
            wallFill: PAL.bark,
            glassFill: PAL.windowDim,
            tintFill: PAL.paperWarm,
            litFill: PAL.windowLit,
            litChance: 0.7,
            insetU: 0.1,
            insetV: 0.11,
            marginU: 0.02,
            marginV: 0.035,
            mullionColor: PAL.ink,
            mullionWidthPx: 0.36,
            mullionOpacity: 0.84,
            beltEvery: 1,
            edgeRim: false,
        });
        // Intricate traditional Chinese `冰裂纹` (ice-ray) & `回字格` fretwork lattice muntins + `dougong` brackets (`PathBatcher`!)
        const lat1B = new PathBatcher();
        for (let col = 0; col < 16; col++) {
            const bx0 = 1434 + col * 51.4;
            const bx1 = bx0 + 42;
            // Upper transom diagonal diamond fret + center stepped key-frame
            lat1B.line("lat", bx0, 652, bx1, 696, { stroke: PAL.umberDk, strokeWidth: 0.36, strokeOpacity: 0.72, nonScaling: "hatch" });
            lat1B.line("lat", bx1, 652, bx0, 696, { stroke: PAL.umberDk, strokeWidth: 0.36, strokeOpacity: 0.72, nonScaling: "hatch" });
            lat1B.line("lat", bx0 + 21, 652, bx0 + 21, 846, { stroke: PAL.umberDk, strokeWidth: 0.34, strokeOpacity: 0.66, nonScaling: "hatch" });
            lat1B.rect("fret", bx0 + 7, 712, 28, 34, { stroke: PAL.umberDk, strokeWidth: 0.34, strokeOpacity: 0.62, nonScaling: "hatch" });
        }
        // Red-lacquered veranda pillars on carved granite plinth bases + tiered `dougong` wooden eave brackets
        for (const cx of [1382, 1515, 1648, 1782, 1915, 2048, 2182, 2295]) {
            lat1B.rect("colDk", cx - 7, 632, 14, 224, { fill: PAL.cinnabarDk, fillOpacity: 0.99 });
            lat1B.rect("colLt", cx - 7, 632, 5, 224, { fill: PAL.cinnabar, fillOpacity: 0.74 });
            lat1B.rect("base", cx - 10, 848, 20, 8, { fill: PAL.paperStone, fillOpacity: 0.94 });
            // 2-tier stepped `dougong` bracket capital
            lat1B.rect("dg1", cx - 20, 626, 40, 8, { fill: PAL.ochreDk, fillOpacity: 0.96 });
            lat1B.rect("dg2", cx - 14, 634, 28, 7, { fill: PAL.umberDk, fillOpacity: 0.95 });
        }
        // Hanging lacquered cedar tea-hall signboard plaque (`茶楼匾额`) centered under Tier 1 eaves!
        lat1B.rect("plaqueBg", 1742, 654, 80, 34, { fill: PAL.barkDk, fillOpacity: 0.98, stroke: PAL.brass, strokeWidth: 0.75, nonScaling: "contour" });
        lat1B.line("plaqueGold", 1756, 666, 1808, 666, { stroke: PAL.brassLt, strokeWidth: 0.65, strokeOpacity: 0.88, nonScaling: "hatch" });
        lat1B.line("plaqueGold", 1762, 676, 1802, 676, { stroke: PAL.brassLt, strokeWidth: 0.55, strokeOpacity: 0.82, nonScaling: "hatch" });
        // Carved red-lacquered `美人靠` veranda balustrade with geometric X-lattice infill
        lat1B.rect("railTop", 1350, 804, 955, 10, { fill: PAL.cinnabar, fillOpacity: 0.95 });
        for (let rx = 1358; rx <= 2295; rx += 14) {
            lat1B.line("bal", rx, 814, rx, 854, { stroke: PAL.umberDk, strokeWidth: 0.5, strokeOpacity: 0.82, nonScaling: "contour" });
        }
        lat1B.line("bal", 1350, 834, 2305, 834, { stroke: PAL.cinnabarDk, strokeWidth: 0.55, strokeOpacity: 0.78, nonScaling: "contour" });
        lat1B.flush(p);
        // Tiny 2-tone veranda tea guests
        p.scaleFigures([
            { x: 1455, y: 852, h: 36, coat: PAL.paperWarm, kind: "coat", dir: -1 },
            { x: 1492, y: 852, h: 34, coat: PAL.cinnabarLt, kind: "dress", dir: -1 },
            { x: 1682, y: 852, h: 35, coat: PAL.prussianLt, kind: "coat", dir: 1 },
            { x: 1718, y: 852, h: 34, coat: PAL.ochre, kind: "coat", dir: -1 },
            { x: 1865, y: 852, h: 34, coat: PAL.celadonLt, kind: "dress", dir: 1 },
            { x: 2115, y: 852, h: 35, coat: PAL.cinnabar, kind: "coat", dir: -1 },
        ], { shadowDir: [0.8, 0.2], shadowOpacity: 0.22 });
        drawSweptEaves(p, 1335, 2350, 544, 632, 36, roofGrad);
        // 3. TIER 2: Upper Belvedere Tea Gallery (`12 cols x 3 rows` ultra-fine shoji lattice!)
        p.archFacadeGrid({ x: 1558, y: 402, w: 638, h: 150 }, 12, 3, {
            wallFill: PAL.bark,
            glassFill: PAL.windowDim,
            tintFill: PAL.paperWarm,
            litFill: PAL.windowLit,
            litChance: 0.76,
            insetU: 0.11,
            insetV: 0.12,
            marginU: 0.025,
            marginV: 0.04,
            mullionColor: PAL.ink,
            mullionWidthPx: 0.36,
            mullionOpacity: 0.84,
            beltEvery: 1,
            edgeRim: false,
        });
        const lat2B = new PathBatcher();
        for (let col = 0; col < 12; col++) {
            const bx0 = 1575 + col * 50.5;
            lat2B.line("lat", bx0, 412, bx0 + 40, 450, { stroke: PAL.umberDk, strokeWidth: 0.34, strokeOpacity: 0.68, nonScaling: "hatch" });
            lat2B.line("lat", bx0 + 40, 412, bx0, 450, { stroke: PAL.umberDk, strokeWidth: 0.34, strokeOpacity: 0.68, nonScaling: "hatch" });
            lat2B.line("lat", bx0 + 20, 412, bx0 + 20, 546, { stroke: PAL.umberDk, strokeWidth: 0.34, strokeOpacity: 0.64, nonScaling: "hatch" });
        }
        for (const cx of [1535, 1665, 1795, 1925, 2055, 2215]) {
            lat2B.rect("col", cx - 6, 392, 12, 158, { fill: PAL.cinnabarDk, fillOpacity: 0.99 });
            lat2B.rect("dg", cx - 16, 388, 32, 7, { fill: PAL.ochreDk, fillOpacity: 0.95 });
        }
        lat2B.rect("rail", 1515, 514, 715, 8, { fill: PAL.cinnabar, fillOpacity: 0.95 });
        for (let rx = 1524; rx <= 2220; rx += 13) {
            lat2B.line("bal", rx, 522, rx, 550, { stroke: PAL.umberDk, strokeWidth: 0.46, strokeOpacity: 0.8, nonScaling: "contour" });
        }
        lat2B.flush(p);
        p.scaleFigures([
            { x: 1625, y: 548, h: 29, coat: PAL.ochreLt, kind: "coat", dir: -1 },
            { x: 1662, y: 548, h: 27, coat: PAL.cinnabar, kind: "dress", dir: -1 },
            { x: 1995, y: 548, h: 28, coat: PAL.paperWarm, kind: "coat", dir: -1 },
        ], { shadowDir: [0.8, 0.2], shadowOpacity: 0.2 });
        drawSweptEaves(p, 1488, 2275, 294, 394, 42, roofGrad);
        // 4. Six Swaying Crimson & Amber Silk Palace Lanterns (`data-anim="sway"`)
        p.hangingLantern({ cx: 1332, cy: 636, w: 46, h: 66, cordLen: 34, style: "palace", swayAmp: 3.4, freq: 1.05, phase: 0.3 });
        p.hangingLantern({ cx: 1645, cy: 654, w: 42, h: 58, cordLen: 26, style: "palace", swayAmp: 2.8, freq: 1.18, phase: 1.7 });
        p.hangingLantern({ cx: 1965, cy: 654, w: 42, h: 58, cordLen: 26, style: "palace", swayAmp: 2.6, freq: 1.12, phase: 2.9 });
        p.hangingLantern({ cx: 2260, cy: 652, w: 38, h: 54, cordLen: 24, style: "palace", swayAmp: 3.0, freq: 1.08, phase: 0.8 });
        p.hangingLantern({ cx: 1485, cy: 392, w: 38, h: 54, cordLen: 30, style: "palace", swayAmp: 3.6, freq: 1.25, phase: 0.9 });
        p.hangingLantern({ cx: 1860, cy: 244, w: 30, h: 42, cordLen: 22, style: "palace", swayAmp: 3.8, freq: 1.32, phase: 2.1 });
        // 5. Lush Swaying Bamboo Groves framing BOTH right teahouse/cliff (`x = 1860..2385`) AND left bank (`x = 115..325`, visible inside `day-o11.png`!)
        drawBambooCluster(p, [
            [1885, 1042, 460, -0.1, 0.7],
            [2265, 1030, 640, 0.12, 0.2],
            [2325, 1040, 720, 0.06, 1.4],
            [2385, 1035, 780, -0.04, 2.6],
        ]);
        drawBambooCluster(p, [
            [115, 1042, 440, 0.14, 0.5],
            [175, 1044, 510, 0.08, 1.6],
            [245, 1042, 390, 0.18, 2.4],
        ], 0.88);
        // 5-tone nocturnal-safe `stippleTreeCluster` cliffside foliage under the teahouse stilts & left cliff bank!
        stippleTreeCluster(p, p.r, [
            { cx: 1475, cy: 985, rx: 95, ry: 48, density: 0.65 },
            { cx: 1755, cy: 960, rx: 122, ry: 54, density: 0.65 },
            { cx: 2095, cy: 965, rx: 135, ry: 56, density: 0.65 },
            { cx: 405, cy: 955, rx: 115, ry: 54, density: 0.7 },
            { cx: 145, cy: 985, rx: 135, ry: 64, density: 0.7 },
        ], {
            dabSize: 10.5,
            groundShadow: false,
            palette: {
                deepCore: PAL.prussianDk,
                darkBody: PAL.sageDk,
                midOlive: PAL.sageDk,
                litSage: PAL.sage,
                sunCrown: PAL.malachite,
            },
        });
        // =========================================================================
        // LAYER D: CARVED GRANITE MOON-BRIDGE (`月亮石拱桥`) — INDIVIDUALLY COURSED
        // ASHLAR BLOCKS, DOUBLE-RING VOUSSOIRS, LOTUS-BUD FINIALS & RELIEF PANELS!
        // =========================================================================
        const brL = 515;
        const brR = 1255;
        const brApexY = 758;
        const deckCurve = (u) => {
            const x = brL + u * (brR - brL);
            const dx = (x - archMidX) / 372;
            const y = brApexY + 218 * Math.pow(Math.abs(dx), 1.68);
            return [x, y];
        };
        const deckTop = sample(deckCurve, 34);
        const archInnerPts = [];
        for (let i = 0; i <= 20; i++)
            archInnerPts.push(hole[i]);
        const bridgeBody = [
            ...deckTop,
            [brR, archBotY],
            [archXR, archBotY],
            [archXR, archSpringY],
            ...archInnerPts.slice().reverse(),
            [archXL, archBotY],
            [brL, archBotY],
        ];
        p.fillPath(polyPath(bridgeBody), bridgeSunGrad, 0.99);
        // Individually tonal-varied dressed horizontal granite ashlar blocks (`PathBatcher`)!
        const brB = new PathBatcher();
        for (let row = 0, y = brApexY + 24; y < archBotY - 6; row++, y += 22) {
            const dy = Math.max(0, y - brApexY);
            const spanHalf = Math.min(372, 372 * Math.pow(dy / 218, 1 / 1.68));
            const xMin = Math.max(brL, archMidX - spanHalf);
            const xMax = Math.min(brR, archMidX + spanHalf);
            const emitCourse = (xa, xb) => {
                if (xb - xa < 10)
                    return;
                brB.line("mortar", xa, y, xb, y, { stroke: PAL.inkMid, strokeWidth: 0.4, strokeOpacity: 0.44, nonScaling: "hatch" });
                let jx = Math.floor(xa / 46) * 46 + (row % 2) * 23;
                while (jx < xb - 4) {
                    const x0 = Math.max(xa, jx);
                    const x1 = Math.min(xb, jx + 46);
                    if (x1 - x0 > 8) {
                        const roll = p.r();
                        if (roll < 0.34)
                            brB.rect("blkLt", x0 + 0.6, y + 0.6, x1 - x0 - 1.2, 20.5, { fill: PAL.paperWarm, fillOpacity: 0.36 });
                        else if (roll < 0.62)
                            brB.rect("blkSh", x0 + 0.6, y + 0.6, x1 - x0 - 1.2, 20.5, { fill: PAL.paperShadow, fillOpacity: 0.3 });
                        if (x0 > xa + 4)
                            brB.line("mortar", x0, y, x0, Math.min(archBotY, y + 22), { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.4, nonScaling: "hatch" });
                    }
                    jx += 46;
                }
            };
            if (y > archApexY + 4) {
                const archXSpan = y >= archSpringY ? archHalfW : archHalfW * Math.sqrt(Math.max(0, 1 - Math.pow((archSpringY - y) / archRise, 2)));
                emitCourse(xMin, archMidX - archXSpan);
                emitCourse(archMidX + archXSpan, xMax);
            }
            else {
                emitCourse(xMin, xMax);
            }
        }
        // Damp green river-moss waterline band + subtle weathered stone & moss dabs on moon-bridge spandrels (`#197`!)
        brB.rect("moss", brL, archBotY - 18, archXL - brL, 18, { fill: PAL.celadonDk, fillOpacity: 0.38 });
        brB.rect("moss", archXR, archBotY - 18, brR - archXR, 18, { fill: PAL.celadonDk, fillOpacity: 0.38 });
        for (const [mx, my, rx, ry, isMoss] of [
            [595, 965, 14, 5, true], [648, 1018, 18, 6, true], [708, 922, 11, 4.5, false],
            [625, 912, 12, 4, false], [715, 992, 15, 5, true], [1055, 938, 13, 4.5, true],
            [1092, 1005, 18, 5.5, true], [1165, 962, 14, 4.5, false], [1205, 1022, 16, 5, true],
            [1040, 882, 10, 4, false], [728, 868, 9, 3.8, true], [1036, 982, 12, 4.5, true],
        ]) {
            brB.dab(isMoss ? "spMoss" : "spWeath", mx, my, rx, ry, rand(p.r, -0.15, 0.15), p.r, {
                fill: isMoss ? PAL.sage : PAL.paperShadow,
                fillOpacity: isMoss ? 0.34 : 0.36,
            });
        }
        // Double-ring radial granite arch voussoirs + outer chamfered hood molding (`拱券双环`)
        const vN = 18;
        const vW = 28;
        for (let i = 0; i < vN; i++) {
            const a0 = Math.PI + (i / vN) * Math.PI;
            const a1 = Math.PI + ((i + 1) / vN) * Math.PI;
            const p0 = [archMidX + Math.cos(a0) * archHalfW, archSpringY + Math.sin(a0) * archRise];
            const p1 = [archMidX + Math.cos(a1) * archHalfW, archSpringY + Math.sin(a1) * archRise];
            const q0 = [archMidX + Math.cos(a0) * (archHalfW + vW), archSpringY + Math.sin(a0) * (archRise + vW * 0.85)];
            const q1 = [archMidX + Math.cos(a1) * (archHalfW + vW), archSpringY + Math.sin(a1) * (archRise + vW * 0.85)];
            const h0 = [archMidX + Math.cos(a0) * (archHalfW + vW + 6), archSpringY + Math.sin(a0) * (archRise + (vW + 6) * 0.85)];
            const h1 = [archMidX + Math.cos(a1) * (archHalfW + vW + 6), archSpringY + Math.sin(a1) * (archRise + (vW + 6) * 0.85)];
            brB.quad(i % 2 === 0 ? "vLt" : "vSh", p0, q0, q1, p1, { fill: i % 2 === 0 ? PAL.paperWarm : PAL.paperShadow, fillOpacity: i % 2 === 0 ? 0.96 : 0.88 });
            brB.quad("hood", q0, h0, h1, q1, { fill: PAL.paperWarm, fillOpacity: 0.92 });
            brB.line("vLine", p0[0], p0[1], q0[0], q0[1], { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.74, nonScaling: "contour" });
        }
        brB.addPath("vLine", openPoly(archInnerPts), { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.8, nonScaling: "contour" });
        // Carved Stone Balustrade Wall, Recessed Cloud-Scroll Panels (`栏板`) & Pointed Lotus-Bud Finials (`仰覆莲望柱头`)!
        const railTop = deckTop.map(([x, y]) => [x, y - 34]);
        brB.addPath("railBg", polyPath([...railTop, ...deckTop.slice().reverse()]), { fill: PAL.paperWarm, fillOpacity: 0.98 });
        brB.addPath("railHi", openPoly(railTop), { stroke: PAL.litEdge, strokeWidth: 0.78, strokeOpacity: 0.82, nonScaling: "contour" });
        brB.addPath("railDk", openPoly(deckTop), { stroke: PAL.inkMid, strokeWidth: 0.68, strokeOpacity: 0.74, nonScaling: "contour" });
        for (let i = 0; i < 12; i++) {
            const a = deckCurve((i + 0.16) / 12);
            const c = deckCurve((i + 0.84) / 12);
            brB.quad("panBg", [a[0], a[1] - 27], [c[0], c[1] - 27], [c[0], c[1] - 7], [a[0], a[1] - 7], { fill: PAL.paperStone, fillOpacity: 0.66, stroke: PAL.inkMid, strokeWidth: 0.42, nonScaling: "hatch" });
            const mx = (a[0] + c[0]) * 0.5;
            const my = (a[1] + c[1]) * 0.5 - 17;
            brB.addPath("panMotif", `M${f(mx - 10)} ${f(my)}L${f(mx)} ${f(my - 4.5)}L${f(mx + 10)} ${f(my)}L${f(mx)} ${f(my + 4.5)}Z`, { stroke: PAL.inkMid, strokeWidth: 0.4, strokeOpacity: 0.64, nonScaling: "hatch" });
        }
        for (let i = 0; i <= 12; i++) {
            const pt = deckCurve(i / 12);
            const pw = 6.5;
            const topY = pt[1] - 45;
            brB.rect("post", pt[0] - pw, topY, pw * 2, pt[1] - topY, { fill: PAL.paperStone, fillOpacity: 0.98, stroke: PAL.ink, strokeWidth: 0.56, nonScaling: "contour" });
            brB.rect("cap", pt[0] - pw - 2, topY - 3.5, (pw + 2) * 2, 4, { fill: PAL.paperWarm, fillOpacity: 0.98, stroke: PAL.ink, strokeWidth: 0.52, nonScaling: "contour" });
            brB.addPath("lotus", `M${f(pt[0] - 4.8)} ${f(topY - 3.5)}Q${f(pt[0] - 6.8)} ${f(topY - 9.5)} ${f(pt[0])} ${f(topY - 16.5)}Q${f(pt[0] + 6.8)} ${f(topY - 9.5)} ${f(pt[0] + 4.8)} ${f(topY - 3.5)}Z`, { fill: PAL.paperWarm, fillOpacity: 0.98, stroke: PAL.ink, strokeWidth: 0.54, nonScaling: "contour" });
            brB.addPath("lotusSh", `M${f(pt[0])} ${f(topY - 16.5)}Q${f(pt[0] + 6.8)} ${f(topY - 9.5)} ${f(pt[0] + 4.8)} ${f(topY - 3.5)}L${f(pt[0] + 0.5)} ${f(topY - 3.5)}Z`, { fill: PAL.paperShadow, fillOpacity: 0.56 });
        }
        // Stepped ashlar stone quay stair ascending into the teahouse veranda (`x = 1255..1420`)
        brB.quad("stair", [1255, 976], [1392, 886], [1420, archBotY], [1255, archBotY], { fill: PAL.paperStone, fillOpacity: 0.98 });
        brB.quad("stairMoss", [1255, archBotY - 18], [1416, archBotY - 18], [1420, archBotY], [1255, archBotY], { fill: PAL.celadonDk, fillOpacity: 0.36 });
        for (let i = 0; i < 8; i++) {
            const u = i / 8;
            const sx = 1262 + u * 124;
            const sy = 972 - u * 84;
            brB.line("stairMortar", sx, sy, sx + 18, sy, { stroke: PAL.inkMid, strokeWidth: 0.48, strokeOpacity: 0.56, nonScaling: "hatch" });
            brB.line("stairMortar", 1255, archBotY - 26 - i * 16, Math.min(1414, 1418 - i * 4), archBotY - 26 - i * 16, { stroke: PAL.inkMid, strokeWidth: 0.42, strokeOpacity: 0.46, nonScaling: "hatch" });
        }
        brB.line("handrail", 1255, 942, 1392, 854, { stroke: PAL.cinnabarDk, strokeWidth: 1.0, strokeOpacity: 0.9, nonScaling: "contour" });
        brB.line("handrail", 1292, 952, 1292, 918, { stroke: PAL.cinnabarDk, strokeWidth: 0.9, strokeOpacity: 0.88, nonScaling: "contour" });
        brB.line("handrail", 1332, 926, 1332, 892, { stroke: PAL.cinnabarDk, strokeWidth: 0.9, strokeOpacity: 0.88, nonScaling: "contour" });
        brB.line("handrail", 1370, 900, 1370, 868, { stroke: PAL.cinnabarDk, strokeWidth: 0.9, strokeOpacity: 0.88, nonScaling: "contour" });
        brB.flush(p);
        p.moonRim(railTop, { closed: false, up: true, widthPx: 0.95 });
        // Glowing stone bridge-entry post lanterns
        for (const [lx, ly] of [
            [612, 872],
            [1152, 868],
        ]) {
            p.layer("var(--z-halo-op)", () => {
                p.fillPath(circlePath(lx, ly, 46), PAL.lanternHalo, 0.24);
                p.fillPath(circlePath(lx, ly, 24), PAL.lantern, 0.42);
            });
            p.fillPath(polyPath([[lx - 7, ly - 9], [lx + 7, ly - 9], [lx + 6, ly + 9], [lx - 6, ly + 9]]), PAL.lanternCore, 0.92);
            p.fillPath(polyPath([[lx - 11, ly - 9], [lx, ly - 18], [lx + 11, ly - 9]]), PAL.slateDk, 0.95);
            p.burinContour(polyPath([[lx - 7, ly - 9], [lx + 7, ly - 9], [lx + 6, ly + 9], [lx - 6, ly + 9]]), PAL.ink, 0.6, 0.82, 4);
        }
        // Tiny 2-tone strollers crossing the moon-bridge toward the cliffside teahouse
        p.scaleFigures([
            { x: 848, y: 752, h: 27, coat: PAL.cinnabar, kind: "parasol", dir: 1 },
            { x: 896, y: 748, h: 28, coat: PAL.prussian, kind: "coat", dir: 1 },
            { x: 1105, y: 836, h: 26, coat: PAL.ochre, kind: "coat", dir: 1 },
            { x: 642, y: 868, h: 27, coat: PAL.cinnabarLt, kind: "dress", dir: 1 },
        ], { shadowDir: [1.0, 0.25], shadowOpacity: 0.22 });
        // =========================================================================
        // LAYER E: EXPANSIVE TURQUOISE LI RIVER, STAGGERED `lijiang` WAVELETS,
        // BOBBING SAMPAN BOATMAN, CORMORANT RAFT & FOREGROUND BAMBOO!
        // =========================================================================
        p.fillPath(polyPath([[BLEED.x0, archBotY], [BLEED.x1, archBotY], [BLEED.x1, BLEED.y1], [BLEED.x0, BLEED.y1]]), riverGrad, 0.99);
        // Broken organic waterline shimmer dashes (NO full-width ruler scanline!)
        let shoreD = "";
        for (const [xa, xb] of [[BLEED.x0, archXL], [archXR, BLEED.x1]]) {
            for (let x = xa + 18; x < xb - 40; x += rand(p.r, 85, 165)) {
                const len = Math.min(xb - x - 8, rand(p.r, 28, 72));
                if (len > 14)
                    shoreD += `M${f(x)} ${f(archBotY + rand(p.r, 0.5, 2.2))}Q${f(x + len * 0.5)} ${f(archBotY + rand(p.r, -0.8, 1.5))} ${f(x + len)} ${f(archBotY + rand(p.r, 0.5, 2.2))}`;
            }
        }
        p.burin(shoreD, PAL.waterShimmer, 0.72, 0.58, 28, "hatch");
        // Painterly staggered broken gouache water reflections (`brokenWaterReflections`)
        p.brokenWaterReflections({ x0: BLEED.x0, y0: archBotY + 5, x1: BLEED.x1, y1: BLEED.y1 }, {
            base: false,
            primary: PAL.celadon,
            deep: PAL.waterDeep,
            shimmer: PAL.waterShimmer,
        }, {
            rows: 38,
            opacity: 0.84,
            reflectBands: [
                { u0: 0.54, u1: 0.84, v0: 0.02, v1: 0.52, color: PAL.lantern },
                { u0: 0.27, u1: 0.35, v0: 0.01, v1: 0.2, color: PAL.prussian },
                { u0: 0.44, u1: 0.52, v0: 0.01, v1: 0.2, color: PAL.prussian },
            ],
        });
        // Staggered organic `lijiang` net-pattern wavelet clusters (`90-210px` runs with open breathing water gaps!)
        p.animGroup({ kind: "ripple", ampX: 14, baseOp: 0.56, ampOp: 0.16, freq: 1.2, phase: 0.5 }, () => {
            let waveD = "";
            let wCount = 0;
            for (let row = 0; row < 14; row++) {
                const t = row / 13;
                const yBase = archBotY + 26 + Math.pow(t, 1.18) * 580;
                const lam = 36 + 58 * t;
                const amp = 1.6 + 3.2 * t;
                let x = BLEED.x0 + rand(p.r, 20, 140) + (row % 2) * 85;
                while (x < BLEED.x1 - 120) {
                    const wavesInRun = Math.floor(rand(p.r, 2, 4.5));
                    const ry = yBase + rand(p.r, -6, 6);
                    waveD += `M${f(x)} ${f(ry)}`;
                    for (let k = 0; k < wavesInRun; k++) {
                        waveD += `q${f(lam * 0.25)} ${f(-amp)} ${f(lam * 0.5)} 0t${f(lam * 0.5)} 0`;
                        x += lam;
                    }
                    wCount++;
                    x += rand(p.r, 125, 290);
                }
            }
            p.burin(waveD, PAL.waterShimmer, 0.54, 0.52, wCount, "hatch");
        });
        // Distant cormorant bamboo raft gliding across the right river (`(1690, 1215)`)
        const rX = 1690;
        const rY = 1215;
        p.animGroup({ kind: "bob", cx: rX, cy: rY, ampY: 3.5, ampDeg: 0.9, freq: 0.92, phase: 2.3 }, () => {
            p.fillPath(ellipsePath(rX, rY + 8, 96, 7), PAL.waterDeep, 0.36);
            p.fillPath(polyPath([[rX - 88, rY - 9], [rX - 66, rY - 1], [rX + 86, rY - 1], [rX + 82, rY + 5], [rX - 72, rY + 5]]), PAL.ochre, 0.94);
            p.burinContour(`M${rX - 88} ${rY - 9}L${rX - 66} ${rY - 1}H${rX + 86}`, PAL.ink, 0.65, 0.78, 2);
            p.fillPath(polyPath([[rX + 42, rY - 32], [rX + 54, rY - 32], [rX + 58, rY - 2], [rX + 38, rY - 2]]), PAL.prussian, 0.94);
            p.fillPath(polyPath([[rX + 34, rY - 35], [rX + 48, rY - 46], [rX + 62, rY - 35]]), PAL.ochreLt, 0.96);
            p.burinContour(`M${rX + 24} ${rY - 64}L${rX + 78} ${rY + 22}`, PAL.inkSepia, 0.72, 0.8, 1);
            p.fillPath(ellipsePath(rX - 52, rY - 11, 5, 9), PAL.ink, 0.9);
        });
        // Hero Foreground Bobbing Wooden Canopy Sampan & Straw-Caped Boatman (`(565, 1305)`)
        const bX = 565;
        const bY = 1305;
        p.animGroup({ kind: "bob", cx: bX, cy: bY, ampY: 5.5, ampDeg: 1.35, freq: 1.05, phase: 0.8 }, () => {
            p.fillPath(ellipsePath(bX + 18, bY + 18, 178, 14), PAL.waterDeep, 0.42);
            const hull = [
                [bX - 158, bY - 22], [bX - 112, bY - 4], [bX + 128, bY - 4], [bX + 180, bY - 26], [bX + 144, bY + 12], [bX - 120, bY + 12],
            ];
            p.fillPath(polyPath(hull), PAL.bark, 0.99);
            p.fillPath(polyPath([[bX - 124, bY + 2], [bX + 150, bY + 2], [bX + 142, bY + 12], [bX - 120, bY + 12]]), PAL.umberDk, 0.94);
            const canopy = [[bX - 58, bY - 4], [bX - 46, bY - 56], [bX + 32, bY - 56], [bX + 46, bY - 4]];
            p.fillPath(closedSmooth(canopy), PAL.umber, 0.96);
            p.burin(`M${bX - 32} ${bY - 54}V${bY - 4}M${bX - 6} ${bY - 56}V${bY - 4}M${bX + 20} ${bY - 54}V${bY - 4}`, PAL.ink, 0.55, 0.72, 3, "hatch");
            p.burinContour(polyPath(hull), PAL.ink, 0.88, 0.88, 6);
            const fx = bX + 94;
            const fy = bY - 6;
            p.fillPath(polyPath([[fx - 8, fy - 28], [fx + 8, fy - 28], [fx + 10, fy], [fx - 10, fy]]), PAL.prussian, 0.96);
            p.fillPath(polyPath([[fx - 12, fy - 62], [fx + 10, fy - 62], [fx + 22, fy - 24], [fx - 20, fy - 24]]), PAL.ochre, 0.98);
            p.burin(`M${fx - 16} ${fy - 36}H${fx + 18}M${fx - 14} ${fy - 48}H${fx + 14}`, PAL.umberDk, 0.52, 0.72, 2, "hatch");
            p.fillPath(polyPath([[fx - 28, fy - 68], [fx - 1, fy - 86], [fx + 26, fy - 68]]), PAL.ochreLt, 0.98);
            p.burinContour(polyPath([[fx - 28, fy - 68], [fx - 1, fy - 86], [fx + 26, fy - 68]]), PAL.ink, 0.72, 0.82, 3);
            p.pressuredRibbon([[fx - 45, fy - 118], [fx + 62, fy + 38]], 4.2, PAL.ochre, 0.95, 0.25);
            p.burinContour(`M${fx - 45} ${fy - 118}L${fx + 62} ${fy + 38}`, PAL.ink, 0.55, 0.78, 1);
            const lx = bX - 148;
            const ly = bY - 46;
            p.burinContour(`M${bX - 138} ${bY - 12}Q${bX - 160} ${bY - 58} ${lx} ${ly - 8}`, PAL.ink, 0.85, 0.85, 1);
            p.layer("var(--z-halo-op)", () => {
                p.fillPath(circlePath(lx, ly + 8, 135), boatLampGlow, 0.92);
            });
            p.fillPath(ellipsePath(lx, ly + 8, 11, 15), PAL.lantern, 0.96);
            p.fillPath(ellipsePath(lx, ly + 8, 6, 9), PAL.lanternCore, 0.92);
            p.burinContour(ellipsePath(lx, ly + 8, 11, 15), PAL.cinnabarDk, 0.65, 0.84, 1);
            p.burin(`M${bX - 178} ${bY + 12}Q${bX - 65} ${bY + 19} ${bX + 188} ${bY + 11}`, PAL.waterShimmer, 0.95, 0.78, 1, "hatch");
        });
        // Foreground faceted limestone bank boulders + swaying reeds + lush foreground bamboo grove!
        drawFacetedKarstPeak(p, { cx: -65, baseY: 1690, w: 470, h: 285, lean: 0.05, tier: "near", fill: nearCliffGrad, pines: 0, shoulderL: 0.5, shoulderR: 0.62 });
        drawFacetedKarstPeak(p, { cx: 2465, baseY: 1685, w: 510, h: 325, lean: -0.06, tier: "near", fill: nearCliffGrad, pines: 0, shoulderL: 0.62, shoulderR: 0.52 });
        for (const [rx, ry, count, phase] of [
            [205, 1595, 9, 0.2],
            [2115, 1585, 10, 0.9],
        ]) {
            p.animGroup({ kind: "sway", cx: rx, cy: ry, ampDeg: 3.2, freq: 0.95, phase }, () => {
                for (let i = 0; i < count; i++) {
                    const ang = rad(-24 + (48 * i) / Math.max(1, count - 1) + rand(p.r, -6, 6));
                    const len = rand(p.r, 85, 155);
                    const tip = [rx + Math.sin(ang) * len + 18, ry - Math.cos(ang) * len];
                    const ctrl = [rx + Math.sin(ang) * len * 0.5 + 4, ry - Math.cos(ang) * len * 0.5];
                    p.pressuredRibbon(sample(quad([rx, ry], ctrl, tip), 8), 3.6, PAL.sageDk, 0.9, 0.2);
                }
            });
        }
        // Lush swaying foreground bamboo stalks rising from the lower-right bank boulder!
        drawBambooCluster(p, [
            [2275, 1650, 560, -0.18, 0.4],
            [2335, 1665, 640, -0.12, 1.3],
            [2395, 1645, 510, -0.22, 2.2],
        ], 1.1);
        // Traditional painter's cinnabar chop seal (`印章`) stamped delicately in the lower-right corner
        p.fillPath(polyPath([[2292, 1482], [2342, 1482], [2342, 1532], [2292, 1532]]), PAL.cinnabar, 0.88);
        p.burinContour(polyPath([[2298, 1488], [2336, 1488], [2336, 1526], [2298, 1526]]) + `M2306 1498H2328M2317 1494V1520M2306 1510H2328`, PAL.paper, 0.85, 0.88, 4);
    }, false, "moonbridge-clip");
    p.flush();
    return {
        index: 11,
        id: "s11-teahouse",
        title: "Li River Teahouse & Moon-Bridge",
        subtitle: "Faceted mineral karst cliffs, cedar lattice veranda & sampan arch",
        portal: S11_PORTAL,
        coreColorDay: [236, 234, 220],
        coreColorNight: [22, 31, 50],
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
