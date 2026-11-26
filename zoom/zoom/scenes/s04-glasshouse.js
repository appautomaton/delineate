// S04: Victorian Cast-Iron Palm House & Open Clerestory Casement (6x-depth compact portal at (1510, 580)).
// Stage-5 5x micro-craft edition channeling footers/worlds/glasshouse + @kiuzyx filigree density via PathBatcher:
// - Open-web riveted Victorian cast-iron lattice vault ribs (hundreds of tiny X-truss struts + gussets)
// - Lacy Gothic pierced cast-iron spandrel filigree & 160+ curved non-scaling glazing muntins
// - Perspective herringbone terracotta-and-stone Victorian brick floor paths + perforated iron floor grilles
// - Lush multi-layered botanical jungle: 5-tone stippleTreeCluster tropical understory, serrated multi-pinna
//   feather palms, hanging Victorian wire fern baskets, climbing column ivy, Wardian fern cloche potting bench,
//   grounded terracotta planters (Dicksonia tree-fern, Monstera, rosette3D agaves, double-glazed Musa basjoo
//   banana grove & Strelitzia), central Victoria-lily pond & fountain, and 3x5 finely mullioned clerestory window!
import { PAL, Painter, PathBatcher, add, archDoorwayHole, bilerp, circlePath, closedSmooth, cubic, ellipsePath, f, lerp, linePath, linearTone, polar, polyPath, quad, rad, rand, sample, stippleTreeCluster, sub, } from "../kit.js";
import { BLEED, requiredPortalClearBox, requiredPortalSealBox, validatePortalHole, } from "./types.js";
export const S04_PORTAL = { cx: 1510, cy: 580, rx: 152, ry: 118 };
const S05_NEXT_PORTAL = [880, 960];
function buildClerestoryHole() {
    const clear = requiredPortalClearBox(S04_PORTAL, S05_NEXT_PORTAL);
    const seal = requiredPortalSealBox(S04_PORTAL);
    const hole = archDoorwayHole(clear, {
        padL: 20,
        padR: 20,
        padTop: 14,
        padBot: 18,
        archRise: 48,
        pointed: false,
        sealBox: seal,
    });
    validatePortalHole("s04-glasshouse", hole, S04_PORTAL, S05_NEXT_PORTAL);
    return hole;
}
function glassStreak(x, y, len, width = 18) {
    return [[x, y + len], [x + len * 0.58, y], [x + len * 0.58 + width, y], [x + width, y + len]];
}
/** High-performance batched Wisteria raceme (~5 <path>s). */
function drawBatchedWisteria(p, origin, len, maxW, lean = 0.06) {
    const tip = [origin[0] + len * lean, origin[1] + len];
    const ctrl = [origin[0] + len * lean * 0.35, origin[1] + len * 0.52];
    const spine = sample(quad(origin, ctrl, tip), 10);
    p.calligraphicStroke(spine, 2.6, 1.7, 0.4, PAL.sageDk, 0.85);
    const b = new PathBatcher();
    const rows = Math.max(8, Math.round(len / 20));
    for (let i = 0; i < rows; i++) {
        const t = 0.06 + (i / rows) * 0.92;
        const idx = Math.min(spine.length - 2, Math.floor(t * (spine.length - 1)));
        const pt = lerp(spine[idx], spine[idx + 1], t * (spine.length - 1) - idx);
        const env = (1 - t * 0.78) * Math.min(1, t * 4.2);
        const count = Math.max(1, Math.round(3.6 * env));
        for (let k = 0; k < count; k++) {
            const bx = pt[0] + (k - (count - 1) * 0.5) * maxW * 0.42 * env + rand(p.r, -4, 4);
            const by = pt[1] + rand(p.r, -3, 5);
            const rx = (6.6 + rand(p.r, 0, 3.0)) * (0.55 + env * 0.55);
            const ry = rx * 1.36;
            const d = closedSmooth([
                [bx, by - ry * 0.82], [bx + rx * 0.92, by - ry * 0.14], [bx + rx * 0.52, by + ry * 0.84],
                [bx - rx * 0.52, by + ry * 0.84], [bx - rx * 0.92, by - ry * 0.14],
            ]);
            const col = t > 0.68 ? PAL.wisteriaDk : k % 2 === 0 ? PAL.wisteriaLt : PAL.wisteria;
            b.addPath(`w-${col}`, d, { fill: col, fillOpacity: 0.9 });
            b.addPath("hi", ellipsePath(bx, by + ry * 0.24, rx * 0.44, ry * 0.4), { fill: PAL.paperWarm, fillOpacity: 0.3 });
            b.addPath("ink", d, { stroke: PAL.ink, strokeWidth: 0.46, strokeOpacity: 0.6, nonScaling: "contour" });
        }
    }
    b.flush(p);
}
/** High-performance batched compound veined fern frond (~6 <path>s). */
function drawBatchedFern(p, origin, dir, len, maxW, pairs = 13, bend = 0.24, fill = PAL.sage) {
    const ctrl = add(origin, polar(len * 0.52, dir + bend * 0.7));
    const tip = add(origin, polar(len, dir + bend));
    const spine = sample(quad(origin, ctrl, tip), 16);
    p.calligraphicStroke(spine, 4.2, 2.4, 0.25, PAL.ink, 0.88);
    const b = new PathBatcher();
    for (let i = 1; i <= pairs; i++) {
        const t = 0.1 + (i / (pairs + 0.5)) * 0.86;
        const idx = Math.min(spine.length - 2, Math.floor(t * (spine.length - 1)));
        const base = lerp(spine[idx], spine[idx + 1], t * (spine.length - 1) - idx);
        const tan = sub(spine[Math.min(spine.length - 1, idx + 1)], spine[Math.max(0, idx - 1)]);
        const baseAngle = Math.atan2(tan[1], tan[0]);
        const env = Math.pow(Math.sin(t * Math.PI), 0.72);
        const pLen = maxW * env * rand(p.r, 0.9, 1.08);
        const pWid = Math.max(4.5, pLen * 0.23);
        for (const side of [-1, 1]) {
            const a = baseAngle + side * (rad(54) - t * rad(18)) + rand(p.r, -0.05, 0.05);
            const mid = add(base, polar(pLen * 0.52, a + side * 0.08));
            const end = add(base, polar(pLen, a + side * 0.14));
            const nm = polar(pWid, a + side * Math.PI * 0.5);
            const leafPts = [
                base, add(lerp(base, mid, 0.6), [nm[0] * 0.78, nm[1] * 0.78]), add(mid, [nm[0] * 0.92, nm[1] * 0.92]),
                end, sub(mid, [nm[0] * 0.42, nm[1] * 0.42]), sub(lerp(base, mid, 0.55), [nm[0] * 0.46, nm[1] * 0.46]),
            ];
            const d = closedSmooth(leafPts);
            b.addPath(i % 2 === 0 ? "main" : "alt", d, { fill: i % 2 === 0 ? fill : PAL.celadon, fillOpacity: 0.92 });
            b.addPath("sh", closedSmooth([base, mid, end, sub(mid, [nm[0] * 0.38, nm[1] * 0.38])]), { fill: PAL.sageDk, fillOpacity: 0.28 });
            b.addPath("vein", `M${f(base[0])} ${f(base[1])}Q${f(mid[0])} ${f(mid[1])} ${f(end[0])} ${f(end[1])}`, { stroke: PAL.vein, strokeWidth: 0.42, strokeOpacity: 0.72, nonScaling: "hatch" });
            b.addPath("lit", linePath([base, leafPts[1], leafPts[2], end]), { stroke: PAL.litEdge, strokeWidth: 0.44, strokeOpacity: 0.62, nonScaling: "contour" });
            b.addPath("dk", linePath([base, leafPts[5], leafPts[4], end]), { stroke: PAL.ink, strokeWidth: 0.78, strokeOpacity: 0.84, nonScaling: "contour" });
        }
    }
    b.flush(p);
}
/**
 * Towering interior conservatory feather-palms with lush FILLED sage/malachite ribbon fronds + individual
 * filled lanceolate pinnae (footers/worlds/glasshouse lineage — rich crowns by Day, bold silhouettes by Night!).
 */
function drawFeatheredVaultPalms(p, palms) {
    const b = new PathBatcher();
    for (let pIdx = 0; pIdx < palms.length; pIdx++) {
        const [px, py, spread] = palms[pIdx];
        // Tapered ringed palm trunk with sunlit left bevel & shaded right edge
        const trunkD = polyPath([[px - 14, 1074], [px - 7, py], [px + 7, py], [px + 13, 1074]]);
        const trunkSh = polyPath([[px + 1, 1074], [px + 1, py], [px + 7, py], [px + 13, 1074]]);
        b.addPath("trunk", trunkD, { fill: PAL.sageDk, fillOpacity: 0.72 });
        b.addPath("trunkSh", trunkSh, { fill: PAL.prussianDk, fillOpacity: 0.34 });
        for (let ty = py + 22; ty < 1054; ty += 24) {
            b.line("ring", px - 10, ty, px + 10, ty - 2, { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.46, nonScaling: "hatch" });
        }
        // Crown-shaft heart nestled at palm apex
        b.circle("crownHeart", px, py + 4, 14, { fill: PAL.sageDk, fillOpacity: 0.88 });
        // 11 gracefully arching compound feather fronds with FILLED tapering ribbon rachis + FILLED lanceolate pinnae!
        for (let k = 0; k < 11; k++) {
            const ang = rad(-174 + k * 17.2 + rand(p.r, -4, 4));
            const ln = spread * rand(p.r, 0.74, 1.08);
            const mid = [px + Math.cos(ang) * ln * 0.5, py + Math.sin(ang) * ln * 0.56 - ln * 0.1];
            const tip = [px + Math.cos(ang) * ln, py + Math.sin(ang) * ln * 0.52 + ln * 0.34];
            const rib = sample(quad([px, py], mid, tip), 13);
            // Build tapering filled ribbon rachis spine
            const rLeft = [];
            const rRight = [];
            for (let i = 0; i < rib.length; i++) {
                const u = i / (rib.length - 1);
                const w = (1 - u * 0.78) * 3.4;
                const prev = rib[Math.max(0, i - 1)];
                const next = rib[Math.min(rib.length - 1, i + 1)];
                const td = sub(next, prev);
                const tl = Math.hypot(td[0], td[1]) || 1;
                const nx = -td[1] / tl;
                const ny = td[0] / tl;
                rLeft.push([rib[i][0] + nx * w, rib[i][1] + ny * w]);
                rRight.push([rib[i][0] - nx * w, rib[i][1] - ny * w]);
            }
            b.addPath("rachis", polyPath([...rLeft, ...rRight.reverse()]), { fill: PAL.sageDk, fillOpacity: 0.86 });
            // Lush filled lanceolate pinna blades radiating from both sides of the arching rachis!
            const isSunFrond = k >= 2 && k <= 7;
            for (let i = 1; i < rib.length - 1; i++) {
                const u = i / (rib.length - 1);
                const env = Math.pow(Math.sin(u * Math.PI), 0.62);
                const pLen = spread * 0.21 * env * rand(p.r, 0.9, 1.12);
                const pW = Math.max(3.4, pLen * 0.145);
                const tan = sub(rib[i + 1], rib[i - 1]);
                const tl = Math.hypot(tan[0], tan[1]) || 1;
                const tx = tan[0] / tl;
                const ty = tan[1] / tl;
                for (const side of [-1, 1]) {
                    const nx = -ty * side;
                    const ny = tx * side;
                    const bx = rib[i][0];
                    const by = rib[i][1];
                    // Arch each filled pinna slightly outward and drooping gracefully under gravity
                    const dx = nx * 0.78 + tx * 0.62;
                    const dy = ny * 0.78 + ty * 0.62 + 0.24;
                    const dl = Math.hypot(dx, dy) || 1;
                    const ux = dx / dl;
                    const uy = dy / dl;
                    const pxN = -uy;
                    const pyN = ux;
                    const ex = bx + ux * pLen;
                    const ey = by + uy * pLen + pLen * 0.08;
                    const m1x = bx + ux * pLen * 0.42 + pxN * pW;
                    const m1y = by + uy * pLen * 0.42 + pyN * pW;
                    const m2x = bx + ux * pLen * 0.42 - pxN * pW * 0.72;
                    const m2y = by + uy * pLen * 0.42 - pyN * pW * 0.72;
                    const leafD = `M${f(bx)} ${f(by)}Q${f(m1x)} ${f(m1y)} ${f(ex)} ${f(ey)}Q${f(m2x)} ${f(m2y)} ${f(bx)} ${f(by)}Z`;
                    const key = isSunFrond ? (side > 0 ? "pinLit" : "pinMid") : side > 0 ? "pinMid" : "pinDk";
                    const fill = key === "pinLit" ? PAL.malachite : key === "pinMid" ? PAL.sage : PAL.sageDk;
                    const op = key === "pinLit" ? 0.78 : key === "pinMid" ? 0.82 : 0.86;
                    b.addPath(key, leafD, { fill, fillOpacity: op });
                    if (i % 2 === 0) {
                        b.line("pinVein", bx, by, ex, ey, { stroke: PAL.ink, strokeWidth: 0.32, strokeOpacity: 0.42, nonScaling: "hatch" });
                    }
                }
            }
        }
    }
    b.flush(p);
}
/** Suspended Victorian wrought-iron wire basket overflowing with swaying maidenhair ferns! */
function drawHangingFernBasket(p, cx, cy, cordTop, phase) {
    p.animGroup({ kind: "sway", cx, cy: cordTop, ampDeg: 1.9, freq: 0.82, phase }, () => {
        const b = new PathBatcher();
        // Suspension iron rod & triple chains down to wire basket rim
        b.line("iron", cx, cordTop, cx, cy - 38, { stroke: PAL.ink, strokeWidth: 0.75, strokeOpacity: 0.82, nonScaling: "contour" });
        b.line("iron", cx, cy - 38, cx - 34, cy, { stroke: PAL.ink, strokeWidth: 0.55, strokeOpacity: 0.78, nonScaling: "contour" });
        b.line("iron", cx, cy - 38, cx, cy + 4, { stroke: PAL.ink, strokeWidth: 0.55, strokeOpacity: 0.78, nonScaling: "contour" });
        b.line("iron", cx, cy - 38, cx + 34, cy, { stroke: PAL.ink, strokeWidth: 0.55, strokeOpacity: 0.78, nonScaling: "contour" });
        // Hemisphere wire basket + moss liner
        b.addPath("liner", `M${f(cx - 34)} ${f(cy)}Q${f(cx)} ${f(cy + 42)} ${f(cx + 34)} ${f(cy)}Z`, { fill: PAL.umber, fillOpacity: 0.9 });
        b.addPath("wire", `M${f(cx - 36)} ${f(cy)}H${f(cx + 36)}M${f(cx - 34)} ${f(cy)}Q${f(cx)} ${f(cy + 42)} ${f(cx + 34)} ${f(cy)}M${f(cx - 22)} ${f(cy)}Q${f(cx - 10)} ${f(cy + 34)} ${f(cx)} ${f(cy + 21)}M${f(cx + 22)} ${f(cy)}Q${f(cx + 10)} ${f(cy + 34)} ${f(cx)} ${f(cy + 21)}`, { stroke: PAL.ink, strokeWidth: 0.6, strokeOpacity: 0.86, nonScaling: "contour" });
        // Cascading delicate maidenhair fern fronds spilling over the wire rim
        for (let k = -4; k <= 4; k++) {
            const sx = cx + k * 7.5;
            const len = 46 + (4 - Math.abs(k)) * 10 + rand(p.r, -6, 12);
            const ex = sx + k * 10;
            const ey = cy + len * (Math.abs(k) > 2 ? 0.85 : 1.05);
            const mx = (sx + ex) * 0.5 + k * 5;
            const my = cy + len * 0.32;
            b.addPath("stem", `M${f(sx)} ${f(cy - 6)}Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}`, { stroke: PAL.sageDk, strokeWidth: 0.55, strokeOpacity: 0.82, nonScaling: "hatch" });
            for (let j = 1; j <= 5; j++) {
                const u = j / 5.5;
                const lx = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * mx + u * u * ex;
                const ly = (1 - u) * (1 - u) * (cy - 6) + 2 * (1 - u) * u * my + u * u * ey;
                b.dab(j % 2 === 0 ? "leafA" : "leafB", lx, ly, 6.2, 4.0, rand(p.r, -0.6, 0.6), p.r, {
                    fill: j % 2 === 0 ? PAL.sage : PAL.malachite,
                    fillOpacity: 0.92,
                });
            }
        }
        b.flush(p);
    });
}
function drawIronColumn(p, x, yTop, yBot, colW) {
    const hw = colW * 0.5;
    const shaft = [[x - hw, yBot], [x - hw * 0.88, yTop], [x + hw * 0.88, yTop], [x + hw, yBot]];
    p.fillPath(polyPath(shaft), PAL.slate, 0.94);
    p.fillPath(polyPath([[x + hw * 0.1, yBot], [x + hw * 0.1, yTop], [x + hw * 0.88, yTop], [x + hw, yBot]]), PAL.slateDk, 0.62);
    let flutes = "";
    for (const u of [-0.55, -0.18, 0.18, 0.55])
        flutes += `M${f(x + hw * u)} ${f(yTop + 14)}V${f(yBot - 18)}`;
    p.burin(flutes, PAL.ink, 0.48, 0.72, 4, "hatch");
    p.burinContour(`M${f(x - hw)} ${f(yBot)}L${f(x - hw * 0.88)} ${f(yTop)}`, PAL.litEdge, 0.76, 0.84, 1);
    p.burinContour(`M${f(x + hw)} ${f(yBot)}L${f(x + hw * 0.88)} ${f(yTop)}`, PAL.ink, 0.95, 0.9, 1);
    const cap = [[x - hw * 1.55, yTop - 16], [x + hw * 1.55, yTop - 16], [x + hw * 1.15, yTop + 12], [x - hw * 1.15, yTop + 12]];
    p.fillPath(polyPath(cap), PAL.slateDk, 0.96);
    p.burinContour(polyPath(cap), PAL.ink, 0.8, 0.88, 4);
    const plinth = [[x - hw * 1.65, yBot], [x + hw * 1.65, yBot], [x + hw * 1.35, yBot - 26], [x - hw * 1.35, yBot - 26]];
    p.fillPath(polyPath(plinth), PAL.slateDk, 0.96);
    p.burinContour(polyPath(plinth), PAL.ink, 0.82, 0.9, 4);
}
function drawClimbingColumnVine(p, colX, yStart, yEnd, colHalfW) {
    const steps = 24;
    const vinePts = [];
    const b = new PathBatcher();
    for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const y = lerp([0, yStart], [0, yEnd], u)[1];
        const x = colX + Math.sin(u * Math.PI * 4.5 + colX * 0.01) * (colHalfW + 8);
        vinePts.push([x, y]);
        if (i > 0 && i < steps) {
            const side = Math.cos(u * Math.PI * 4.5 + colX * 0.01) >= 0 ? 1 : -1;
            const lx = x + side * rand(p.r, 12, 24);
            const ly = y + rand(p.r, -10, 6);
            const d = closedSmooth([[x, y], [x + side * 8, y - 9], [lx, ly - 5], [lx + side * 6, ly + 4], [x + side * 6, y + 8]]);
            b.addPath(i % 2 === 0 ? "mid" : "dk", d, { fill: i % 2 === 0 ? PAL.malachite : PAL.sageDk, fillOpacity: 0.92 });
            b.addPath("ink", d, { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.7, nonScaling: "contour" });
        }
    }
    p.calligraphicStroke(vinePts, 3.6, 2.2, 0.5, PAL.sageDk, 0.9);
    b.flush(p);
}
/** Glazed Victorian arched conservatory lower arcade (y = 932..1082) + dense 5-tone stippled tropical understory! */
function drawLowerConservatoryArcade(p) {
    const yTop = 932;
    const yBot = 1082;
    p.fillPath(polyPath([[BLEED.x0, yTop], [BLEED.x1, yTop], [BLEED.x1, yBot], [BLEED.x0, yBot]]), PAL.paperStone, 0.96);
    const b = new PathBatcher();
    const bayW = 148;
    for (let bx = -320; bx < 2680; bx += bayW) {
        const ax0 = bx + 15;
        const ax1 = bx + bayW - 15;
        const amx = (ax0 + ax1) * 0.5;
        const rx = (ax1 - ax0) * 0.5;
        const ySp = yTop + 44;
        const archD = `M${f(ax0)} ${yBot}V${f(ySp)}A${f(rx)} 34 0 0 1 ${f(ax1)} ${f(ySp)}V${yBot}Z`;
        b.addPath("glass", archD, { fill: PAL.glassTint, fillOpacity: 0.86 });
        b.addPath("glow", archD, { fill: PAL.lantern, fillOpacity: "var(--z-halo-op)" });
        // Dense Victorian 3x3 glazed bay muntins + radial fanlight spokes!
        b.line("muntin", amx, ySp - 34, amx, yBot, { stroke: PAL.inkMid, strokeWidth: 0.42, strokeOpacity: 0.68, nonScaling: "hatch" });
        b.line("muntin", ax0 + rx * 0.5, ySp, ax0 + rx * 0.5, yBot, { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.55, nonScaling: "hatch" });
        b.line("muntin", ax1 - rx * 0.5, ySp, ax1 - rx * 0.5, yBot, { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.55, nonScaling: "hatch" });
        b.line("muntin", ax0, ySp, ax1, ySp, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.72, nonScaling: "hatch" });
        b.line("muntin", ax0, ySp + 34, ax1, ySp + 34, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.58, nonScaling: "hatch" });
        b.line("muntin", ax0, ySp + 68, ax1, ySp + 68, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.58, nonScaling: "hatch" });
        b.line("muntin", amx, ySp, ax0 + rx * 0.28, ySp - 24, { stroke: PAL.inkMid, strokeWidth: 0.38, strokeOpacity: 0.64, nonScaling: "hatch" });
        b.line("muntin", amx, ySp, ax1 - rx * 0.28, ySp - 24, { stroke: PAL.inkMid, strokeWidth: 0.38, strokeOpacity: 0.64, nonScaling: "hatch" });
        b.addPath("arch", archD, { stroke: PAL.ink, strokeWidth: 0.7, strokeOpacity: 0.84, nonScaling: "contour" });
    }
    b.line("base", BLEED.x0, yBot, BLEED.x1, yBot, { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.86, nonScaling: "contour" });
    b.flush(p);
    // Rich 5-tone stippleTreeCluster tropical conservatory understory banking the glazed arcade (#183!)
    stippleTreeCluster(p, p.r, [
        { cx: 52, cy: 1048, rx: 145, ry: 52, density: 1.4 },
        { cx: 425, cy: 1046, rx: 155, ry: 56, density: 1.4 },
        { cx: 735, cy: 1054, rx: 115, ry: 44, density: 1.3 },
        { cx: 1185, cy: 1050, rx: 185, ry: 48, density: 1.45 },
        { cx: 1495, cy: 1052, rx: 125, ry: 46, density: 1.35 },
        { cx: 1935, cy: 1044, rx: 165, ry: 58, density: 1.45 },
        { cx: 2380, cy: 1048, rx: 165, ry: 56, density: 1.4 },
    ], {
        palette: {
            deepCore: PAL.prussianDk,
            darkBody: PAL.sageDk,
            midOlive: PAL.sage,
            litSage: PAL.malachite,
            sunCrown: PAL.celadon,
            accent: PAL.cinnabarLt,
        },
        dabSize: 6.2,
        groundShadow: false,
    });
}
/**
 * Perspective Victorian Herringbone Terracotta & Stone Brick Conservatory Paths + Perforated Cast-Iron Grilles (#183!)
 * Emits 700+ tiny perspective herringbone bricks into ONLY 5 compound <path> nodes via PathBatcher!
 */
function drawHerringboneConservatoryFloor(p, wL, wR) {
    const fTL = [-320, 1082];
    const fTR = [2720, 1082];
    const fBR = [3120, 1880];
    const fBL = [-720, 1880];
    p.fillPath(polyPath([[BLEED.x0, 1082], [BLEED.x1, 1082], [BLEED.x1, BLEED.y1], [BLEED.x0, BLEED.y1]]), PAL.paperStone, 0.98);
    const b = new PathBatcher();
    // Ultra-fine perspective herringbone brick walkways on left & right promenades (refined in both Day & Night!)
    const brickCols = 58;
    const brickRows = 28;
    for (let row = 0; row < brickRows; row++) {
        const v0 = Math.pow(row / brickRows, 1.24);
        const v1 = Math.pow((row + 1) / brickRows, 1.24);
        for (let col = 0; col < brickCols; col++) {
            const u0 = col / brickCols;
            const u1 = (col + 1) / brickCols;
            const uMid = (u0 + u1) * 0.5;
            const inBrick = uMid < 0.36 || uMid > 0.64 || v0 > 0.56;
            if (!inBrick)
                continue;
            const shift = ((row + col) % 2 === 0 ? 0.003 : -0.003);
            const p0 = bilerp(fTL, fTR, fBR, fBL, u0, v0 + shift);
            const p1 = bilerp(fTL, fTR, fBR, fBL, u1, v0 - shift);
            const p2 = bilerp(fTL, fTR, fBR, fBL, u1, v1 - shift);
            const p3 = bilerp(fTL, fTR, fBR, fBL, u0, v1 + shift);
            const tone = (row * 3 + col * 5) % 7;
            if (tone === 0 || tone === 4)
                b.quad("bTerra", p0, p1, p2, p3, { fill: PAL.cinnabarLt, fillOpacity: 0.14 });
            else if (tone === 1 || tone === 5)
                b.quad("bOchre", p0, p1, p2, p3, { fill: PAL.ochreLt, fillOpacity: 0.16 });
            else if (tone === 2)
                b.quad("bDeep", p0, p1, p2, p3, { fill: PAL.paperShadow, fillOpacity: 0.28 });
            else
                b.quad("bWarm", p0, p1, p2, p3, { fill: PAL.paperWarm, fillOpacity: 0.28 });
            b.line("mortar", p0[0], p0[1], p1[0], p1[1], { stroke: PAL.inkMid, strokeWidth: 0.28, strokeOpacity: 0.26, nonScaling: "hatch" });
            b.line("mortar", p0[0], p0[1], p3[0], p3[1], { stroke: PAL.inkMid, strokeWidth: 0.28, strokeOpacity: 0.24, nonScaling: "hatch" });
        }
    }
    // Dressed ashlar flagstone grid inside central court & stone border kerb bands
    for (let i = 1; i <= 10; i++) {
        const y = 1082 + Math.pow(i / 10, 1.28) * 440;
        b.line("court", 620 - i * 24, y, 1780 + i * 24, y, { stroke: PAL.inkMid, strokeWidth: 0.38, strokeOpacity: 0.32, nonScaling: "hatch" });
    }
    for (let i = -3; i <= 3; i++) {
        b.line("court", 1185 + i * 165, 1082, 1185 + i * 265, 1522, { stroke: PAL.inkMid, strokeWidth: 0.38, strokeOpacity: 0.3, nonScaling: "hatch" });
    }
    // Ornate cast-iron floor heating ventilation grating strips tucked along arcade plinth & walkways!
    for (const [gx0, gx1, gy0, gy1] of [[720, 1660, 1094, 1116], [420, 740, 1348, 1380], [1640, 1980, 1348, 1380]]) {
        b.rect("grateBg", gx0, gy0, gx1 - gx0, gy1 - gy0, { fill: PAL.slateDk, fillOpacity: 0.42 });
        const step = 12;
        for (let x = gx0; x < gx1; x += step) {
            b.line("grate", x, gy0, Math.min(gx1, x + (gy1 - gy0)), gy1, { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.65, nonScaling: "hatch" });
            b.line("grate", Math.min(gx1, x + (gy1 - gy0)), gy0, x, gy1, { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.65, nonScaling: "hatch" });
        }
        b.rect("grateRim", gx0, gy0, gx1 - gx0, gy1 - gy0, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.78, nonScaling: "contour" });
    }
    b.flush(p);
    // Sunlit light shaft pouring diagonally down-left from the upper-right clerestory window + night lantern pools
    p.fillPath(polyPath([[wL, 1082], [wR, 1082], [1160, 1740], [640, 1740]]), PAL.paperWarm, 0.34);
    p.layer("var(--z-halo-op)", () => {
        const flL = p.radialGrad("floorGlowL", 465, 1340, 360, [[0, PAL.lantern, 0.24], [0.55, PAL.lantern, 0.1], [1, PAL.lantern, 0]]);
        const flC = p.radialGrad("floorGlowC", 1185, 1290, 390, [[0, PAL.lantern, 0.22], [0.55, PAL.lantern, 0.09], [1, PAL.lantern, 0]]);
        const flR = p.radialGrad("floorGlowR", 2060, 1320, 320, [[0, PAL.lantern, 0.22], [0.55, PAL.lantern, 0.09], [1, PAL.lantern, 0]]);
        p.fillPath(ellipsePath(465, 1340, 360, 145), flL, 1);
        p.fillPath(ellipsePath(1185, 1290, 390, 135), flC, 1);
        p.fillPath(ellipsePath(2060, 1320, 320, 125), flR, 1);
    });
}
function drawStoneUrn(p, cx, baseY, sc = 1) {
    const ped = [[cx - 32 * sc, baseY], [cx + 32 * sc, baseY], [cx + 28 * sc, baseY - 64 * sc], [cx - 28 * sc, baseY - 64 * sc]];
    const cap = [[cx - 40 * sc, baseY - 64 * sc], [cx + 40 * sc, baseY - 64 * sc], [cx + 40 * sc, baseY - 74 * sc], [cx - 40 * sc, baseY - 74 * sc]];
    const foot = [[cx - 20 * sc, baseY - 74 * sc], [cx + 20 * sc, baseY - 74 * sc], [cx + 14 * sc, baseY - 92 * sc], [cx - 14 * sc, baseY - 92 * sc]];
    const bowl = [
        [cx - 16 * sc, baseY - 92 * sc], [cx - 44 * sc, baseY - 108 * sc], [cx - 56 * sc, baseY - 134 * sc], [cx - 60 * sc, baseY - 144 * sc],
        [cx + 60 * sc, baseY - 144 * sc], [cx + 56 * sc, baseY - 134 * sc], [cx + 44 * sc, baseY - 108 * sc], [cx + 16 * sc, baseY - 92 * sc],
    ];
    for (const pts of [ped, cap, foot, bowl])
        p.fillPath(polyPath(pts), PAL.paperStone, 0.98);
    p.fillPath(polyPath([[cx + 4 * sc, baseY], [cx + 32 * sc, baseY], [cx + 28 * sc, baseY - 64 * sc], [cx + 4 * sc, baseY - 64 * sc]]), PAL.paperShadow, 0.56);
    p.fillPath(polyPath([[cx + 6 * sc, baseY - 92 * sc], [cx + 44 * sc, baseY - 108 * sc], [cx + 56 * sc, baseY - 134 * sc], [cx + 60 * sc, baseY - 144 * sc], [cx + 8 * sc, baseY - 144 * sc]]), PAL.paperShadow, 0.54);
    p.burinHatch(ped, rad(90), 6.5, linearTone([cx - 32 * sc, baseY], [cx + 32 * sc, baseY], 0.14, 0.78), { color: PAL.ink, opacity: 0.58 });
    p.burinHatch(bowl, 0, 5.5, linearTone([cx - 56 * sc, baseY - 144 * sc], [cx + 56 * sc, baseY - 92 * sc], 0.12, 0.74), { color: PAL.ink, opacity: 0.56 });
    for (const pts of [ped, cap, foot, bowl])
        p.burinContour(polyPath(pts), PAL.ink, 0.72, 0.86, pts.length);
    p.burinContour(`M${f(cx - 58 * sc)} ${f(baseY - 144 * sc)}H${f(cx + 58 * sc)}`, PAL.litEdge, 0.78, "var(--z-moon-op)", 1);
    const mound = Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return [cx + Math.cos(a) * (58 + rand(p.r, -6, 10)) * sc, baseY - 160 * sc + Math.sin(a) * (30 + rand(p.r, -5, 8)) * sc];
    });
    p.fillPath(closedSmooth(mound), PAL.sage, 0.94);
    p.fillPath(ellipsePath(cx - 14 * sc, baseY - 170 * sc, 32 * sc, 16 * sc), PAL.malachite, 0.52);
    p.fillPath(ellipsePath(cx + 14 * sc, baseY - 150 * sc, 38 * sc, 16 * sc), PAL.sageDk, 0.48);
    p.foliageTouches(mound, 56, 0.92 * sc, { color: PAL.ink, opacity: 0.78 });
    let trails = "";
    let trailLeaves = "";
    for (let i = 0; i < 9; i++) {
        const sx = cx + rand(p.r, -48, 48) * sc;
        const sy = baseY - 142 * sc;
        const ln = rand(p.r, 34, 78) * sc;
        const ex = sx + rand(p.r, -16, 16) * sc;
        trails += `M${f(sx)} ${f(sy)}Q${f((sx + ex) * 0.5 + rand(p.r, -8, 8))} ${f(sy + ln * 0.5)} ${f(ex)} ${f(sy + ln)}`;
        trailLeaves += ellipsePath(ex, sy + ln, 4.5 * sc, 2.8 * sc);
    }
    p.burinContour(trails, PAL.sageDk, 0.82, 0.86, 9);
    p.fillPath(trailLeaves, PAL.malachite, 0.88);
}
function drawConservatoryPond(p, cx, cy) {
    const kerbOut = Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return [cx + Math.cos(a) * 265, cy + Math.sin(a) * 58];
    });
    const waterPoly = Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return [cx + Math.cos(a) * 242, cy + Math.sin(a) * 44];
    });
    p.fillPath(closedSmooth(kerbOut), PAL.paperStone, 0.98);
    p.burinContour(closedSmooth(kerbOut), PAL.ink, 0.78, 0.86, 24);
    p.fillPath(closedSmooth(waterPoly), PAL.water, 0.78);
    p.waterReflections({ x0: cx - 235, y0: cy - 40, x1: cx + 235, y1: cy + 40 }, [], { rows: 16, opacity: 0.62 });
    p.burinContour(closedSmooth(waterPoly), PAL.ink, 0.72, 0.85, 24);
    for (const [lx, ly, rx, ry] of [
        [cx - 118, cy - 8, 38, 10], [cx - 48, cy + 12, 46, 12], [cx + 76, cy + 4, 42, 11], [cx + 148, cy - 10, 32, 9],
    ]) {
        p.fillPath(ellipsePath(lx, ly, rx, ry), PAL.sage, 0.92);
        p.fillPath(ellipsePath(lx, ly - 1.5, rx * 0.86, ry * 0.72), PAL.celadon, 0.45);
        p.burinContour(ellipsePath(lx, ly, rx, ry), PAL.ink, 0.65, 0.82, 1);
    }
    p.fillPath(polyPath([[cx - 18, cy + 4], [cx + 18, cy + 4], [cx + 12, cy - 86], [cx - 12, cy - 86]]), PAL.slateDk, 0.95);
    p.fillPath(ellipsePath(cx, cy - 58, 72, 16), PAL.slate, 0.94);
    p.fillPath(ellipsePath(cx, cy - 112, 42, 11), PAL.slate, 0.94);
    p.burinContour(ellipsePath(cx, cy - 58, 72, 16) + ellipsePath(cx, cy - 112, 42, 11), PAL.ink, 0.78, 0.88, 2);
    p.animGroup({ kind: "ripple", ampX: 3, baseOp: 0.72, ampOp: 0.22, freq: 1.8, phase: 0.4 }, () => {
        let spray = "";
        for (const side of [-1, 1]) {
            spray += `M${f(cx)} ${f(cy - 126)}Q${f(cx + side * 26)} ${f(cy - 148)} ${f(cx + side * 38)} ${f(cy - 112)}`;
            spray += `M${f(cx + side * 38)} ${f(cy - 110)}Q${f(cx + side * 66)} ${f(cy - 98)} ${f(cx + side * 68)} ${f(cy - 58)}`;
            spray += `M${f(cx + side * 68)} ${f(cy - 56)}Q${f(cx + side * 98)} ${f(cy - 36)} ${f(cx + side * 96)} ${f(cy + 4)}`;
        }
        p.burin(spray, PAL.waterSpray, 0.95, 0.82, 6, "hatch");
    });
}
function drawTerracottaPlanter(p, cx, topY, w, h, withTag = false) {
    const hw = w * 0.5;
    const bw = hw * 0.82;
    const rimH = Math.min(18, Math.max(8, h * 0.18));
    const body = [[cx - hw, topY + rimH], [cx + hw, topY + rimH], [cx + bw, topY + h], [cx - bw, topY + h]];
    const rim = [[cx - hw - 6, topY], [cx + hw + 6, topY], [cx + hw + 4, topY + rimH + 2], [cx - hw - 4, topY + rimH + 2]];
    // Clay drainage saucer beneath pot
    p.fillPath(polyPath([[cx - bw - 8, topY + h - 3], [cx + bw + 8, topY + h - 3], [cx + bw + 5, topY + h + 6], [cx - bw - 5, topY + h + 6]]), PAL.cinnabarDk, 0.74);
    p.fillPath(polyPath(body), PAL.copper, 0.94);
    p.fillPath(polyPath([[cx + hw * 0.12, topY + rimH], [cx + hw, topY + rimH], [cx + bw, topY + h], [cx + bw * 0.12, topY + h]]), PAL.cinnabarDk, 0.38);
    p.fillPath(polyPath(rim), PAL.cinnabarLt, 0.9);
    // Vertical classical terracotta fluting ribs & molded waist band
    let flutes = `M${f(cx - hw * 0.94)} ${f(topY + rimH + 6)}H${f(cx + hw * 0.94)}`;
    for (let k = -3; k <= 3; k++) {
        const u = k / 3.8;
        flutes += `M${f(cx + hw * u)} ${f(topY + rimH + 2)}L${f(cx + bw * u)} ${f(topY + h - 2)}`;
    }
    p.burin(flutes, PAL.ink, 0.38, 0.54, 8, "hatch");
    p.burinContour(polyPath(body) + polyPath(rim), PAL.ink, 0.72, 0.86, 8);
    p.burinContour(`M${f(cx - hw - 6)} ${f(topY)}H${f(cx + hw + 6)}`, PAL.litEdge, 0.72, "var(--z-moon-op)", 1);
    // Optional wooden Victorian Latin botanical specimen stake tucked into the soil
    if (withTag) {
        const sh = Math.min(34, h * 0.45);
        p.fillPath(polyPath([[cx + hw * 0.42, topY + 2], [cx + hw * 0.56, topY - sh], [cx + hw * 0.66, topY - sh + 2], [cx + hw * 0.52, topY + 2]]), PAL.paperWarm, 0.94);
        p.burinContour(polyPath([[cx + hw * 0.42, topY + 2], [cx + hw * 0.56, topY - sh], [cx + hw * 0.66, topY - sh + 2], [cx + hw * 0.52, topY + 2]]), PAL.inkMid, 0.48, 0.82, 4);
    }
}
function drawBananaBlade(p, origin, angDeg, len, maxW) {
    const a = rad(angDeg);
    const rib = sample(cubic(origin, add(origin, polar(len * 0.28, a - 0.14)), add(origin, polar(len * 0.65, a + 0.08)), add(origin, [Math.cos(a) * len, Math.sin(a) * len + len * 0.24])), 16);
    const left = [];
    const right = [];
    let veinLit = "";
    let veinShade = "";
    const tearSet = new Set([5, 10, 13]);
    for (let i = 2; i < rib.length; i++) {
        const prev = rib[i - 1];
        const next = rib[Math.min(rib.length - 1, i + 1)];
        const d = sub(next, prev);
        const l = Math.hypot(d[0], d[1]) || 1;
        const tx = d[0] / l;
        const ty = d[1] / l;
        const nx = -ty;
        const ny = tx;
        const u = (i - 2) / (rib.length - 3);
        const half = maxW * 0.5 * Math.pow(Math.max(0, Math.sin(Math.min(1, u * 1.04) * Math.PI)), 0.58);
        const lh = half * (tearSet.has(i) ? 0.54 : 1);
        const rh = half * (tearSet.has(i + 2) ? 0.6 : 1);
        left.push([rib[i][0] + nx * lh, rib[i][1] + ny * lh]);
        right.push([rib[i][0] - nx * rh, rib[i][1] - ny * rh]);
        if (i > 2 && i < rib.length - 1) {
            veinLit += `M${f(rib[i][0])} ${f(rib[i][1])}l${f(nx * lh * 0.92 + tx * lh * 0.3)} ${f(ny * lh * 0.92 + ty * lh * 0.3)}`;
            veinShade += `M${f(rib[i][0])} ${f(rib[i][1])}l${f(-nx * rh * 0.92 + tx * rh * 0.3)} ${f(-ny * rh * 0.92 + ty * rh * 0.3)}`;
        }
    }
    const blade = [...left, ...right.reverse()];
    p.doubleGlaze(blade, PAL.sage, PAL.sageDk, { smooth: true, washOpacity: 0.88, deepK: 0.62, deepOpacity: 0.34, thinPx: 0.45, thickPx: 0.9 });
    p.burin(veinLit, PAL.vein, 0.42, 0.58, 14, "hatch");
    p.burin(veinShade, PAL.ink, 0.62, 0.66, 14, "hatch");
    p.calligraphicStroke(rib, 4.8, 2.8, 0.25, PAL.vein, 0.9);
}
function drawStrelitzia(p, x, baseY, sc = 1) {
    for (const [ang, stalk, ln, w] of [[-116, 128, 118, 34], [-96, 152, 130, 36], [-74, 134, 116, 32]]) {
        const a = rad(ang);
        const sx = x + Math.cos(a) * stalk * sc;
        const sy = baseY + Math.sin(a) * stalk * sc;
        p.calligraphicStroke([[x, baseY], lerp([x, baseY], [sx, sy], 0.5), [sx, sy]], 4.0 * sc, 2.6 * sc, 1.6 * sc, PAL.sageDk, 0.9);
        const tip = [sx + Math.cos(a) * ln * sc, sy + Math.sin(a) * ln * sc];
        const nx = -Math.sin(a) * w * 0.5 * sc;
        const ny = Math.cos(a) * w * 0.5 * sc;
        const mid = lerp([sx, sy], tip, 0.48);
        const blade = [[sx, sy], [mid[0] + nx, mid[1] + ny], tip, [mid[0] - nx, mid[1] - ny]];
        p.fillPath(closedSmooth(blade), PAL.malachite, 0.92);
        p.burinContour(closedSmooth(blade), PAL.ink, 0.65, 0.82, 4);
        p.burin(`M${f(sx)} ${f(sy)}L${f(tip[0])} ${f(tip[1])}`, PAL.vein, 0.52, 0.72, 1, "hatch");
    }
    for (const [fx, fy, s] of [[x + 32 * sc, baseY - 215 * sc, sc], [x - 42 * sc, baseY - 175 * sc, sc * 0.86]]) {
        p.calligraphicStroke([[x + (fx - x) * 0.15, baseY], [fx - 12 * s, fy + 62 * s], [fx - 14 * s, fy + 8 * s]], 3.8 * s, 2.8 * s, 1.8 * s, PAL.sageDk, 0.92);
        const spathe = [[fx - 14 * s, fy + 10 * s], [fx + 62 * s, fy - 6 * s], [fx + 68 * s, fy + 2 * s], [fx - 8 * s, fy + 20 * s]];
        p.fillPath(polyPath(spathe), PAL.celadonDk, 0.94);
        p.burinContour(polyPath(spathe), PAL.ink, 0.65, 0.85, 4);
        for (const [dx, dy, k] of [[22, -52, 0], [36, -58, 1], [48, -46, 2]]) {
            const petal = [
                [fx + (6 + k * 5) * s, fy + 2 * s], [fx + (dx - 8) * s, fy + dy * s], [fx + dx * s, fy + (dy - 6) * s],
                [fx + (dx + 6) * s, fy + (dy + 8) * s], [fx + (16 + k * 5) * s, fy],
            ];
            p.fillPath(polyPath(petal), PAL.ochre, 0.94);
            p.burinContour(polyPath(petal), PAL.ink, 0.58, 0.82, 5);
        }
        const tongue = [[fx + 10 * s, fy - 2 * s], [fx + 32 * s, fy - 34 * s], [fx + 35 * s, fy - 28 * s], [fx + 18 * s, fy + 2 * s]];
        p.fillPath(polyPath(tongue), PAL.prussianLt, 0.94);
        p.burinContour(polyPath(tongue), PAL.ink, 0.58, 0.84, 4);
    }
}
/** Fine 4x8 leaded Victorian wrought-iron mullioned swung-open clerestory casement sash (#197)! */
function drawOpenCasementLeaf(p, hingeX, yTop, yBot, swingDir, leafW) {
    const outerX = hingeX + swingDir * leafW;
    const skew = 18;
    const tl = [Math.min(hingeX, outerX), hingeX < outerX ? yTop : yTop - skew];
    const tr = [Math.max(hingeX, outerX), hingeX < outerX ? yTop - skew : yTop];
    const br = [Math.max(hingeX, outerX), hingeX < outerX ? yBot + skew : yBot];
    const bl = [Math.min(hingeX, outerX), hingeX < outerX ? yBot : yBot + skew];
    const leafPoly = [tl, tr, br, bl];
    p.fillPath(polyPath(leafPoly), PAL.glass, 0.36);
    p.layer("var(--z-halo-op)", () => {
        p.fillPath(polyPath(leafPoly), PAL.lantern, 0.24);
    });
    const b = new PathBatcher();
    // 4x8 leaded casement muntin grid + delicate Victorian corner diamond lead-came fillets!
    for (let r = 1; r < 8; r++) {
        const v = r / 8;
        const a = lerp(tl, bl, v);
        const c = lerp(tr, br, v);
        b.line("muntin", a[0], a[1], c[0], c[1], { stroke: PAL.ink, strokeWidth: r === 4 ? 0.62 : 0.38, strokeOpacity: r === 4 ? 0.82 : 0.68, nonScaling: "hatch" });
    }
    for (let col = 1; col < 4; col++) {
        const u = col / 4;
        const a = lerp(tl, tr, u);
        const c = lerp(bl, br, u);
        b.line("muntin", a[0], a[1], c[0], c[1], { stroke: PAL.ink, strokeWidth: col === 2 ? 0.56 : 0.38, strokeOpacity: col === 2 ? 0.78 : 0.66, nonScaling: "hatch" });
    }
    // Delicate corner lead-came quarry diamonds in top & bottom sash rows
    for (const vRow of [0, 7]) {
        for (let col = 0; col < 4; col++) {
            const mT = bilerp(tl, tr, br, bl, (col + 0.5) / 4, vRow / 8);
            const mR = bilerp(tl, tr, br, bl, (col + 1) / 4, (vRow + 0.5) / 8);
            const mB = bilerp(tl, tr, br, bl, (col + 0.5) / 4, (vRow + 1) / 8);
            const mL = bilerp(tl, tr, br, bl, col / 4, (vRow + 0.5) / 8);
            b.line("came", mT[0], mT[1], mR[0], mR[1], { stroke: PAL.inkMid, strokeWidth: 0.3, strokeOpacity: 0.52, nonScaling: "hatch" });
            b.line("came", mR[0], mR[1], mB[0], mB[1], { stroke: PAL.inkMid, strokeWidth: 0.3, strokeOpacity: 0.52, nonScaling: "hatch" });
            b.line("came", mB[0], mB[1], mL[0], mL[1], { stroke: PAL.inkMid, strokeWidth: 0.3, strokeOpacity: 0.52, nonScaling: "hatch" });
            b.line("came", mL[0], mL[1], mT[0], mT[1], { stroke: PAL.inkMid, strokeWidth: 0.3, strokeOpacity: 0.52, nonScaling: "hatch" });
        }
    }
    // Twin diagonal sky reflections across the leaded glass leaf
    const gA = bilerp(tl, tr, br, bl, 0.16, 0.66);
    const gB = bilerp(tl, tr, br, bl, 0.82, 0.12);
    const gC = bilerp(tl, tr, br, bl, 0.34, 0.78);
    const gD = bilerp(tl, tr, br, bl, 0.88, 0.32);
    b.line("glint", gA[0], gA[1], gB[0], gB[1], { stroke: PAL.paper, strokeWidth: 0.55, strokeOpacity: 0.56, nonScaling: "hatch" });
    b.line("glint", gC[0], gC[1], gD[0], gD[1], { stroke: PAL.paper, strokeWidth: 0.42, strokeOpacity: 0.42, nonScaling: "hatch" });
    // Outer iron sash frame, brass hinges & stay-bar
    b.addPath("frame", polyPath(leafPoly), { stroke: PAL.ink, strokeWidth: 1.05, strokeOpacity: 0.92, nonScaling: "contour" });
    b.line("lit", tl[0], tl[1], tr[0], tr[1], { stroke: PAL.litEdge, strokeWidth: 0.75, strokeOpacity: 0.76, nonScaling: "contour" });
    for (const hy of [yTop + 26, yBot - 28]) {
        b.rect("hinge", hingeX - 2.2, hy - 5, 4.4, 10, { fill: PAL.brass, fillOpacity: 0.9 });
    }
    const stayY = yBot - 10;
    b.line("brass", hingeX, stayY, hingeX + swingDir * leafW * 0.74, stayY + skew * 0.55, { stroke: PAL.brass, strokeWidth: 0.92, strokeOpacity: 0.92, nonScaling: "contour" });
    b.circle("knob", hingeX + swingDir * leafW * 0.74, stayY + skew * 0.55, 1.6, { fill: PAL.brassLt, fillOpacity: 0.96 });
    b.flush(p);
}
function drawButterfly(p, bx, by, sc = 1) {
    const lw = `M${f(bx)} ${f(by)}C${f(bx - 14 * sc)} ${f(by - 18 * sc)} ${f(bx - 24 * sc)} ${f(by - 4 * sc)} ${f(bx - 8 * sc)} ${f(by + 3 * sc)}C${f(bx - 15 * sc)} ${f(by + 10 * sc)} ${f(bx - 6 * sc)} ${f(by + 14 * sc)} ${f(bx)} ${f(by + 4 * sc)}Z`;
    const rw = `M${f(bx)} ${f(by)}C${f(bx + 14 * sc)} ${f(by - 18 * sc)} ${f(bx + 24 * sc)} ${f(by - 4 * sc)} ${f(bx + 8 * sc)} ${f(by + 3 * sc)}C${f(bx + 15 * sc)} ${f(by + 10 * sc)} ${f(bx + 6 * sc)} ${f(by + 14 * sc)} ${f(bx)} ${f(by + 4 * sc)}Z`;
    p.fillPath(lw + rw, PAL.ochreLt, 0.88);
    p.burinContour(lw + rw, PAL.inkSepia, 0.55, 0.78, 2);
    p.burinContour(`M${f(bx)} ${f(by - 5 * sc)}V${f(by + 8 * sc)}`, PAL.ink, 0.8, 0.9, 1);
}
export function buildS04Glasshouse() {
    const p = new Painter("s04", 40497);
    const hole = buildClerestoryHole();
    const wL = Math.min(...hole.map((q) => q[0]));
    const wR = Math.max(...hole.map((q) => q[0]));
    const wMid = (wL + wR) * 0.5;
    const wApex = Math.min(...hole.map((q) => q[1]));
    const wSpring = hole[0][1];
    const wBot = Math.max(...hole.map((q) => q[1]));
    // 1. Hand-tinted Victorian conservatory glass backdrop
    const glassBg = p.linearGrad("glass", 0, BLEED.y0, 0, BLEED.y1, [
        [0, PAL.paper],
        [0.28, PAL.glass],
        [0.62, PAL.glassTint],
        [1, PAL.paperStone],
    ]);
    p.asymmetricPortalBackdrop(hole, glassBg, { smooth: false });
    p.layer("var(--z-halo-op)", () => {
        const glowL = p.radialGrad("nglowL", 520, 540, 860, [[0, PAL.lanternCore, 0.48], [0.34, PAL.lantern, 0.34], [0.74, PAL.lanternHalo, 0.16], [1, PAL.lanternHalo, 0]]);
        const glowC = p.radialGrad("nglowC", 1160, 460, 680, [[0, PAL.lanternCore, 0.38], [0.38, PAL.lantern, 0.24], [1, PAL.lanternHalo, 0]]);
        const glowR = p.radialGrad("nglowR", 2060, 500, 740, [[0, PAL.lanternCore, 0.42], [0.36, PAL.lantern, 0.28], [1, PAL.lanternHalo, 0]]);
        p.asymmetricPortalBackdrop(hole, glowL, { smooth: false, opacity: 0.96 });
        p.asymmetricPortalBackdrop(hole, glowC, { smooth: false, opacity: 0.9 });
        p.asymmetricPortalBackdrop(hole, glowR, { smooth: false, opacity: 0.92 });
    });
    // 2. All conservatory micro-craft clipped cleanly outside the compact upper-right clerestory window!
    p.clippedToBackdrop(hole, () => {
        // 2a. Copperplate level glass hatching + diagonal white sky reflections
        const glassPaneZone = [[BLEED.x0, BLEED.y0], [BLEED.x1, BLEED.y0], [BLEED.x1, 1080], [BLEED.x0, 1080]];
        p.burinHatch(glassPaneZone, 0, 14, linearTone([0, -240], [0, 1060], 0.14, 0.46), {
            color: PAL.inkMid,
            opacity: 0.42,
            widths: [0.32, 0.54, 0.78],
            flick: 0.26,
        });
        const streaks = [
            glassStreak(145, 95, 220, 24), glassStreak(445, 38, 260, 28), glassStreak(825, 42, 240, 26),
            glassStreak(1140, 95, 220, 22), glassStreak(1845, 76, 245, 26), glassStreak(2140, 175, 210, 22),
            glassStreak(240, 585, 185, 18), glassStreak(960, 560, 195, 20), glassStreak(1980, 570, 195, 20),
        ];
        for (const st of streaks) {
            p.fillPath(polyPath(st), PAL.paper, 0.42);
            p.layer("var(--z-halo-op)", () => {
                p.fillPath(polyPath(st), PAL.lanternCore, 0.3);
            });
        }
        // 2b. Abundant Towering Serrated-Pinna Feather Palms Rising Under the Glazed Vault (#183!)
        drawFeatheredVaultPalms(p, [
            [85, 470, 240], [245, 365, 285], [475, 455, 230], [665, 315, 275],
            [865, 415, 245], [1065, 290, 300], [1845, 445, 240], [2085, 385, 265], [2345, 475, 225],
        ]);
        // 2c. Open-Web Riveted Victorian Cast-Iron Lattice Vault Ribs + 160+ Curved Glazing Muntins (`PathBatcher`!)
        const domeCx = 1120;
        const domeSpringY = 920;
        const domeRx = 1600;
        const domeRy = 1160;
        const vaultB = new PathBatcher();
        // 22 closely spaced concentric horizontal curved glazing muntins & purlins across the dome ceiling!
        for (let k = 1; k <= 22; k++) {
            const bAng = (k / 23.2) * (Math.PI * 0.5);
            const py = domeSpringY - domeRy * Math.sin(bAng);
            const rx = domeRx * Math.cos(bAng);
            const arcPts = Array.from({ length: 24 }, (_, j) => {
                const u = -1 + (2 * j) / 23;
                return [domeCx + u * rx, py - Math.cos(u * Math.PI * 0.5) * 44];
            });
            const isPurlin = k % 3 === 0;
            vaultB.addPath(isPurlin ? "purlin" : "glazeBar", linePath(arcPts), {
                stroke: isPurlin ? PAL.ink : PAL.inkMid,
                strokeWidth: isPurlin ? 0.65 : 0.34,
                strokeOpacity: isPurlin ? 0.72 : 0.44,
                nonScaling: "hatch",
            });
        }
        // 24 fine meridian glazing bars + 6 open-web X-truss riveted structural cast-iron arch girders!
        for (let k = 0; k <= 24; k++) {
            const al = (k / 24) * Math.PI;
            const isMajor = k % 4 === 0;
            const pts = Array.from({ length: 24 }, (_, j) => {
                const bAng = (j / 23) * (Math.PI * 0.5);
                return [domeCx + Math.cos(al) * domeRx * Math.cos(bAng), domeSpringY - domeRy * Math.sin(bAng)];
            });
            if (isMajor) {
                const offsetPts = pts.map(([x, y]) => [x + (x < domeCx ? 18 : -18), y + 10]);
                // Open-web double-flange truss girder with crisp X-cross-bracing & pierced web rings!
                vaultB.addPath("flange", linePath(pts), { stroke: PAL.slateDk, strokeWidth: 1.5, strokeOpacity: 0.94, nonScaling: "contour" });
                vaultB.addPath("flange", linePath(offsetPts), { stroke: PAL.slateDk, strokeWidth: 1.15, strokeOpacity: 0.9, nonScaling: "contour" });
                vaultB.addPath("lit", linePath(offsetPts), { stroke: PAL.litEdge, strokeWidth: 0.55, strokeOpacity: 0.68, nonScaling: "contour" });
                for (let j = 0; j < pts.length - 1; j++) {
                    const a0 = pts[j];
                    const a1 = pts[j + 1];
                    const b0 = offsetPts[j];
                    const b1 = offsetPts[j + 1];
                    vaultB.line("truss", a0[0], a0[1], b1[0], b1[1], { stroke: PAL.ink, strokeWidth: 0.5, strokeOpacity: 0.84, nonScaling: "hatch" });
                    vaultB.line("truss", b0[0], b0[1], a1[0], a1[1], { stroke: PAL.ink, strokeWidth: 0.5, strokeOpacity: 0.84, nonScaling: "hatch" });
                    vaultB.line("truss", a0[0], a0[1], b0[0], b0[1], { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.8, nonScaling: "hatch" });
                }
            }
            else {
                vaultB.addPath("merid", linePath(pts), { stroke: PAL.inkMid, strokeWidth: 0.42, strokeOpacity: 0.56, nonScaling: "hatch" });
            }
        }
        vaultB.flush(p);
        // Upper Mezzanine Gallery Girder & Pierced Victorian Iron Balustrade (y = 818..932)
        p.fillPath(polyPath([[BLEED.x0, 898], [BLEED.x1, 898], [BLEED.x1, 932], [BLEED.x0, 932]]), PAL.slateDk, 0.94);
        p.fillPath(polyPath([[BLEED.x0, 898], [BLEED.x1, 898], [BLEED.x1, 906], [BLEED.x0, 906]]), PAL.slate, 0.85);
        p.burinContour(`M${BLEED.x0} 898H${BLEED.x1}M${BLEED.x0} 932H${BLEED.x1}`, PAL.ink, 1.0, 0.9, 2);
        p.burinContour(`M${BLEED.x0} 900H${BLEED.x1}`, PAL.litEdge, 0.68, "var(--z-moon-op)", 1);
        let balusD = `M-320 818H2740M-320 826H2740M-320 890H2740`;
        let ringD = "";
        for (let bx = -300; bx <= 2720; bx += 20) {
            balusD += `M${f(bx)} 818V898`;
            if (Math.round(bx / 20) % 2 === 0)
                ringD += circlePath(bx + 10, 854, 7.5);
        }
        p.burinContour(balusD, PAL.ink, 0.68, 0.86, 152);
        p.burin(ringD, PAL.ink, 0.48, 0.76, 76, "hatch");
        p.scaleFigures([
            { x: 382, y: 896, h: 42, coat: PAL.wisteria, kind: "dress", dir: 1 },
            { x: 422, y: 896, h: 45, coat: PAL.slateDk, kind: "coat", dir: 1 },
            { x: 695, y: 896, h: 40, coat: PAL.ochre, kind: "parasol", dir: -1 },
            { x: 742, y: 896, h: 42, coat: PAL.prussian, kind: "coat", dir: -1 },
            { x: 965, y: 896, h: 40, coat: PAL.cinnabar, kind: "coat", dir: 1 },
            { x: 1218, y: 896, h: 41, coat: PAL.cinnabarLt, kind: "dress", dir: 1 },
            { x: 1795, y: 896, h: 42, coat: PAL.slateDk, kind: "coat", dir: -1 },
            { x: 1842, y: 896, h: 40, coat: PAL.ochre, kind: "dress", dir: -1 },
        ], { shadowDir: [0.85, 0.14], shadowOpacity: 0.2 });
        // 2d. Glazed Victorian Arched Lower Conservatory Arcades + 5-Tone Stippled Tropical Understory
        drawLowerConservatoryArcade(p);
        // 2e. Perspective Herringbone Brick Conservatory Floor Paths + Perforated Cast-Iron Grilles!
        drawHerringboneConservatoryFloor(p, wL, wR);
        // Spiral iron service staircase descending on left atrium
        p.fillPath(polyPath([[346, 898], [364, 898], [364, 1345], [346, 1345]]), PAL.slateDk, 0.95);
        let stairD = "";
        for (let s = 0; s < 16; s++) {
            const sy = 924 + s * 25;
            const phase = s * 0.42;
            const xEnd = 355 + Math.cos(phase) * 98;
            const tread = [[355, sy], [xEnd, sy + 6], [xEnd, sy + 14], [355, sy + 9]];
            p.fillPath(polyPath(tread), PAL.slate, 0.88);
            stairD += polyPath(tread) + `M${f(xEnd)} ${f(sy + 6)}V${f(sy - 36)}`;
        }
        p.burinContour(stairD, PAL.ink, 0.68, 0.85, 32);
        // 2f. Fluted Cast-Iron Corinthian Columns + Continuous Cornice Ring-Girder + Lacy Pierced Gothic Spandrels!
        const colTopY = 278;
        drawIronColumn(p, 118, colTopY, 1380, 44);
        drawIronColumn(p, 560, colTopY, 1300, 38);
        drawIronColumn(p, 1015, colTopY, 1140, 34);
        drawIronColumn(p, 1315, colTopY, 1140, 30);
        drawIronColumn(p, 1665, colTopY, 1140, 30);
        drawIronColumn(p, 2245, colTopY, 1320, 40);
        p.fillPath(polyPath([[BLEED.x0, colTopY - 22], [BLEED.x1, colTopY - 22], [BLEED.x1, colTopY - 4], [BLEED.x0, colTopY - 4]]), PAL.slateDk, 0.94);
        p.fillPath(polyPath([[BLEED.x0, colTopY - 22], [BLEED.x1, colTopY - 22], [BLEED.x1, colTopY - 16], [BLEED.x0, colTopY - 16]]), PAL.slate, 0.85);
        p.burinContour(`M${BLEED.x0} ${colTopY - 22}H${BLEED.x1}M${BLEED.x0} ${colTopY - 4}H${BLEED.x1}`, PAL.ink, 0.92, 0.9, 2);
        p.burinContour(`M${BLEED.x0} ${colTopY - 20}H${BLEED.x1}`, PAL.litEdge, 0.62, "var(--z-moon-op)", 1);
        // Lacy Victorian Pierced Cast-Iron Filigree Spandrel Arches (concentric rings + radial spokes + cusps!)
        const spB = new PathBatcher();
        const colSpans = [[-260, 118], [118, 560], [560, 1015], [1015, 1315], [1315, 1665], [1665, 2245], [2245, 2700]];
        for (const [xa, xb] of colSpans) {
            const span = xb - xa;
            const midX = (xa + xb) * 0.5;
            const drop = Math.min(88, span * 0.21);
            spB.addPath("arc", `M${f(xa)} ${f(colTopY + drop)}Q${f(midX)} ${f(colTopY - 18)} ${f(xb)} ${f(colTopY + drop)}`, { stroke: PAL.ink, strokeWidth: 0.92, strokeOpacity: 0.88, nonScaling: "contour" });
            spB.addPath("arc", `M${f(xa)} ${f(colTopY + drop - 10)}Q${f(midX)} ${f(colTopY - 26)} ${f(xb)} ${f(colTopY + drop - 10)}`, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.82, nonScaling: "contour" });
            // Lacy vertical struts & concentric Gothic filigree rings packed inside each spandrel haunch
            for (const u of [0.06, 0.13, 0.21, 0.3, 0.7, 0.79, 0.87, 0.94]) {
                const sx = xa + span * u;
                const archY = colTopY - 4 + drop * Math.pow(Math.abs(u - 0.5) * 2, 1.8);
                spB.line("web", sx, colTopY - 4, sx, archY, { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.74, nonScaling: "hatch" });
            }
            for (const [uR, rFrac] of [[0.1, 0.19], [0.22, 0.12], [0.78, 0.12], [0.9, 0.19]]) {
                const rcx = xa + span * uR;
                const rcy = colTopY + drop * (rFrac * 1.9);
                const rr = Math.min(14, drop * rFrac);
                spB.circle("ring", rcx, rcy, rr, { stroke: PAL.ink, strokeWidth: 0.52, strokeOpacity: 0.78, nonScaling: "hatch" });
                spB.circle("ring", rcx, rcy, rr * 0.48, { stroke: PAL.ink, strokeWidth: 0.38, strokeOpacity: 0.65, nonScaling: "hatch" });
            }
        }
        spB.flush(p);
        // 4 Suspended Victorian Wrought-Iron Wire Hanging Fern Baskets (gentle sway!)
        drawHangingFernBasket(p, 338, 438, colTopY - 4, 0.4);
        drawHangingFernBasket(p, 792, 412, colTopY - 4, 1.8);
        drawHangingFernBasket(p, 1892, 428, colTopY - 4, 2.9);
        drawHangingFernBasket(p, 2175, 456, colTopY - 4, 4.1);
        drawClimbingColumnVine(p, 560, 1270, 560, 19);
        drawClimbingColumnVine(p, 2245, 1290, 610, 20);
        p.wroughtScrollwork([140, 930], [252, 930], 1, 1.05, PAL.ink);
        p.wroughtScrollwork([542, 930], [430, 930], -1, 1.0, PAL.ink);
        p.wroughtScrollwork([578, 930], [692, 930], 1, 1.0, PAL.ink);
        p.wroughtScrollwork([998, 930], [888, 930], -1, 0.95, PAL.ink);
        p.wroughtScrollwork([1032, 930], [1142, 930], 1, 0.95, PAL.ink);
        p.wroughtScrollwork([1682, 930], [1796, 930], 1, 0.95, PAL.ink);
        // 2g. Refined Upper-Right Arched Cast-Iron Clerestory Casement Window (Gothic cusps, filigree & 4x8 leaded sashes!)
        const frameOuter = [
            [wL - 17, wBot + 11],
            [wL - 17, wSpring],
            ...Array.from({ length: 21 }, (_, i) => {
                const a = Math.PI + (i / 20) * Math.PI;
                return [wMid + Math.cos(a) * ((wR - wL) * 0.5 + 17), wSpring + Math.sin(a) * (wSpring - wApex + 17)];
            }),
            [wR + 17, wSpring],
            [wR + 17, wBot + 11],
        ];
        const frameMidArch = Array.from({ length: 21 }, (_, i) => {
            const a = Math.PI + (i / 20) * Math.PI;
            return [wMid + Math.cos(a) * ((wR - wL) * 0.5 + 8.5), wSpring + Math.sin(a) * (wSpring - wApex + 8.5)];
        });
        p.fillPath(polyPath([[1315, wBot + 4], [1665, wBot + 4], [1665, wBot + 17], [1315, wBot + 17]]), PAL.slateDk, 0.94);
        p.fillPath(polyPath(frameOuter) + polyPath(hole), PAL.slateDk, 0.95, true);
        p.burinContour(polyPath(frameOuter), PAL.ink, 1.0, 0.92, 24);
        p.burinContour(polyPath(hole), PAL.ink, 0.95, 0.92, 24);
        p.burin(linePath(frameMidArch), PAL.litEdge, 0.52, 0.62, 20, "hatch");
        p.moonRim(frameOuter.slice(1, 22), { closed: false, up: true, widthPx: 0.85 });
        // Pierced Victorian cast-iron Gothic trefoil arch cusps & outer spandrel scrollwork (#197)!
        const archB = new PathBatcher();
        const rxIn = (wR - wL) * 0.5;
        const ryIn = wSpring - wApex;
        for (let i = 1; i < 16; i++) {
            const a = Math.PI + (i / 16) * Math.PI;
            archB.circle("rivet", wMid + Math.cos(a) * (rxIn + 8.5), wSpring + Math.sin(a) * (ryIn + 8.5), 1.05, { fill: PAL.brass, fillOpacity: 0.88 });
        }
        // Pierced exterior Victorian arch cresting & Gothic foliate rings crowning the clerestory arch (continuous arcaded web!)
        for (let i = 1; i < 10; i++) {
            const a0 = Math.PI + (i / 10) * Math.PI;
            const cxR = wMid + Math.cos(a0) * (rxIn + 23);
            const cyR = wSpring + Math.sin(a0) * (ryIn + 23);
            archB.circle("crest", cxR, cyR, 4.0, { stroke: PAL.ink, strokeWidth: 0.56, strokeOpacity: 0.82, nonScaling: "hatch" });
            archB.circle("crestDot", cxR, cyR, 1.15, { fill: PAL.brass, fillOpacity: 0.84 });
            if (i < 9) {
                const aNext = Math.PI + ((i + 1) / 10) * Math.PI;
                const nxR = wMid + Math.cos(aNext) * (rxIn + 23);
                const nyR = wSpring + Math.sin(aNext) * (ryIn + 23);
                const am = (a0 + aNext) * 0.5;
                const mx = wMid + Math.cos(am) * (rxIn + 19.5);
                const my = wSpring + Math.sin(am) * (ryIn + 19.5);
                archB.addPath("crest", `M${f(cxR)} ${f(cyR)}Q${f(mx)} ${f(my)} ${f(nxR)} ${f(nyR)}`, { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.78, nonScaling: "hatch" });
            }
        }
        archB.flush(p);
        p.burinContour(`M${f(wMid)} ${f(wApex - 17)}V${f(wApex - 54)}`, PAL.ink, 1.0, 0.9, 1);
        p.fillPath(circlePath(wMid, wApex - 35, 3.0), PAL.brass, 0.92);
        p.wroughtScrollwork([wMid - 8, wApex - 21], [wMid - 72, wApex - 12], -1, 0.52, PAL.ink);
        p.wroughtScrollwork([wMid + 8, wApex - 21], [wMid + 72, wApex - 12], 1, 0.52, PAL.ink);
        drawOpenCasementLeaf(p, wL - 4, wSpring + 4, wBot - 2, -1, 98);
        drawOpenCasementLeaf(p, wR + 4, wSpring + 4, wBot - 2, 1, 98);
        // 2h. Lifted Central Victoria-Lily Pond & Tiered Fountain (100% un-cropped inside day-o04!), Stone Urns & Wardian Bench
        drawConservatoryPond(p, 1185, 1172);
        drawStoneUrn(p, 818, 1170, 0.88);
        drawStoneUrn(p, 1592, 1170, 0.86);
        // Victorian potting bench with fern-filled Wardian glass cloche & stacked clay pots (fully visible in day-o04!)
        const tbL = 558;
        const tbR = 736;
        const tbY = 1196;
        p.fillPath(polyPath([[tbL, tbY], [tbR, tbY], [tbR - 5, tbY + 11], [tbL + 5, tbY + 11]]), PAL.paperStone, 0.96);
        p.burinContour(polyPath([[tbL, tbY], [tbR, tbY], [tbR - 5, tbY + 11], [tbL + 5, tbY + 11]]) +
            `M${tbL + 14} ${tbY + 11}V${tbY + 74}M${tbR - 14} ${tbY + 11}V${tbY + 74}M${tbL + 14} ${tbY + 50}H${tbR - 14}`, PAL.ink, 0.86, 0.88, 7);
        p.fillPath(closedSmooth([[606, tbY - 2], [610, tbY - 24], [622, tbY - 34], [634, tbY - 22], [638, tbY - 2]]), PAL.malachite, 0.78);
        p.fillPath(`M592 ${tbY}V${tbY - 40}A30 30 0 0 1 652 ${tbY - 40}V${tbY}Z`, PAL.glass, 0.46);
        p.burinContour(`M592 ${tbY}V${tbY - 40}A30 30 0 0 1 652 ${tbY - 40}V${tbY}Z`, PAL.ink, 0.72, 0.85, 1);
        p.fillPath(circlePath(622, tbY - 73, 4.2), PAL.glass, 0.82);
        drawTerracottaPlanter(p, 694, tbY - 32, 36, 32);
        drawTerracottaPlanter(p, 610, tbY + 26, 28, 22);
        drawTerracottaPlanter(p, 654, tbY + 26, 28, 22);
        drawTerracottaPlanter(p, 698, tbY + 24, 34, 24);
        // 6 Un-Cropped Fluted Terracotta Floor Planters Across Visible Conservatory Court (y = 1165..1260, #197!)
        // Planter 1 (Left-Court): Full Dicksonia Tree-Fern Clump
        drawTerracottaPlanter(p, 725, 1218, 66, 46, true);
        p.animGroup({ kind: "sway", cx: 725, cy: 1218, ampDeg: 1.5, freq: 0.82, phase: 0.7 }, () => {
            drawBatchedFern(p, [725, 1218], rad(-138), 118, 34, 9, -0.22, PAL.sage);
            drawBatchedFern(p, [725, 1218], rad(-92), 132, 38, 10, 0.14, PAL.malachite);
            drawBatchedFern(p, [725, 1218], rad(-46), 124, 36, 9, 0.26, PAL.sage);
        });
        // Planter 2 (Left-Center): Sculpted 3D Golden-Angle Agave Rosette + Monstera Leaf
        drawTerracottaPlanter(p, 888, 1212, 76, 48, true);
        p.monsteraBlade({ origin: [876, 1214], dir: rad(-126), len: 112, tilt: 0.84, fill: PAL.sage, deepFill: PAL.sageDk });
        p.rosette3D({ cx: 892, cy: 1196, radius: 54, count: 18, viewDeg: 22, fill: PAL.celadon, deepFill: PAL.sageDk, youngFill: PAL.celadonLt, dyingFill: PAL.ochre });
        // Planter 3 (Beside Fountain Left): Blooming Strelitzia (Bird of Paradise)
        drawTerracottaPlanter(p, 1018, 1218, 56, 42, true);
        drawStrelitzia(p, 1018, 1220, 0.44);
        // Planter 4 (Beside Fountain Right): Lush Fenestrated Monstera Deliciosa
        drawTerracottaPlanter(p, 1378, 1216, 72, 46, true);
        p.monsteraBlade({ origin: [1372, 1218], dir: rad(-118), len: 124, tilt: 0.86, fill: PAL.malachite, deepFill: PAL.sageDk });
        p.monsteraBlade({ origin: [1386, 1218], dir: rad(-66), len: 118, tilt: 0.84, fill: PAL.sage, deepFill: PAL.sageDk });
        // Planter 5 (Right-Center): 3D Fibonacci Agave Rosette + Cascading Ferns
        drawTerracottaPlanter(p, 1516, 1210, 76, 48, true);
        drawBatchedFern(p, [1508, 1212], rad(-134), 108, 32, 9, -0.2, PAL.sage);
        p.rosette3D({ cx: 1520, cy: 1194, radius: 52, count: 18, viewDeg: 20, fill: PAL.celadon, deepFill: PAL.sageDk, youngFill: PAL.celadonLt, dyingFill: PAL.ochre });
        // Planter 6 (Right-Court): Double-Glazed Musa Basjoo Banana Grove + Strelitzia
        drawTerracottaPlanter(p, 1742, 1192, 86, 56, true);
        p.animGroup({ kind: "sway", cx: 1742, cy: 1194, ampDeg: 1.4, freq: 0.76, phase: 1.9 }, () => {
            drawBananaBlade(p, [1736, 1194], -148, 176, 56);
            drawBananaBlade(p, [1742, 1190], -108, 168, 54);
            drawBananaBlade(p, [1748, 1192], -62, 166, 52);
        });
        drawTerracottaPlanter(p, 1646, 1222, 56, 42);
        drawStrelitzia(p, 1646, 1224, 0.42);
        // Victorian visitors admiring the central Victoria-lily pond & conservatory palms (clearly visible in day-o04!)
        p.scaleFigures([
            { x: 948, y: 1242, h: 52, coat: PAL.wisteria, kind: "dress", dir: 1 },
            { x: 988, y: 1244, h: 56, coat: PAL.slateDk, kind: "coat", dir: 1 },
            { x: 1438, y: 1240, h: 52, coat: PAL.ochre, kind: "coat", dir: -1 },
            { x: 1474, y: 1244, h: 50, coat: PAL.cinnabarLt, kind: "dress", dir: -1 },
            { x: 1308, y: 1138, h: 42, coat: PAL.prussianLt, kind: "coat", dir: 1 },
        ], { shadowDir: [-0.85, 0.22], shadowOpacity: 0.24 });
        // 2i. Batched Swaying Wisteria Racemes Cascading from the Curved Iron Vault Purlins
        const wisteriaSpecs = [
            [135, 118, 245, 44, 0.2], [278, 92, 278, 48, 1.3], [445, 108, 236, 42, 2.5], [638, 134, 206, 38, 3.6],
            [895, 116, 224, 42, 4.7], [1135, 142, 186, 36, 0.9], [1935, 148, 218, 40, 1.7], [2140, 118, 255, 44, 2.9],
        ];
        for (const [wx, wy, wLen, wW, ph] of wisteriaSpecs) {
            p.animGroup({ kind: "sway", cx: wx, cy: wy, ampDeg: 2.2, freq: 0.9, phase: ph }, () => {
                drawBatchedWisteria(p, [wx, wy], wLen, wW, 0.06);
            });
        }
        // 2j. Elevated Foreground Botanical Planter Beds (with wooden Latin specimen stakes & clay saucers!)
        drawTerracottaPlanter(p, 155, 1435, 148, 116, true);
        p.gnarledBough({ spine: [[148, 1450], [156, 1310], [166, 1175], [176, 1055]], w0: 62, w1: 40, fill: PAL.bark, shadeFill: PAL.barkDk, fissures: 12 });
        p.animGroup({ kind: "sway", cx: 176, cy: 1055, ampDeg: 1.7, freq: 0.78, phase: 0.4 }, () => {
            drawBatchedFern(p, [176, 1055], rad(-138), 325, 94, 13, -0.26, PAL.sage);
            drawBatchedFern(p, [176, 1055], rad(-88), 355, 100, 14, 0.18, PAL.malachite);
            drawBatchedFern(p, [176, 1055], rad(-44), 365, 104, 14, 0.34, PAL.sage);
            drawBatchedFern(p, [176, 1055], rad(-8), 325, 92, 13, 0.28, PAL.celadonDk);
            drawBatchedFern(p, [176, 1055], rad(22), 275, 78, 11, 0.22, PAL.sage);
        });
        drawTerracottaPlanter(p, 545, 1465, 205, 112, true);
        p.monsteraBlade({ origin: [365, 1515], dir: rad(-125), len: 290, tilt: 0.84, fill: PAL.sage, deepFill: PAL.sageDk });
        p.monsteraBlade({ origin: [555, 1560], dir: rad(-70), len: 278, tilt: 0.86, fill: PAL.malachite, deepFill: PAL.sageDk });
        p.rosette3D({ cx: 545, cy: 1428, radius: 128, count: 22, viewDeg: 22, fill: PAL.celadon, deepFill: PAL.sageDk, youngFill: PAL.celadonLt, dyingFill: PAL.ochre });
        drawTerracottaPlanter(p, 835, 1485, 136, 95);
        drawStrelitzia(p, 835, 1538, 1.08);
        drawTerracottaPlanter(p, 2245, 1365, 195, 148, true);
        p.animGroup({ kind: "sway", cx: 2245, cy: 1382, ampDeg: 1.4, freq: 0.72, phase: 2.1 }, () => {
            drawBananaBlade(p, [2235, 1368], -155, 395, 130);
            drawBananaBlade(p, [2245, 1360], -118, 370, 120);
            drawBananaBlade(p, [2255, 1362], -65, 375, 124);
            drawBananaBlade(p, [2265, 1378], -22, 345, 114);
        });
        drawTerracottaPlanter(p, 2045, 1478, 185, 102, true);
        p.monsteraBlade({ origin: [1895, 1555], dir: rad(-135), len: 275, tilt: 0.84, fill: PAL.sage, deepFill: PAL.sageDk });
        drawBatchedFern(p, [1585, 1568], rad(-132), 275, 82, 12, -0.22, PAL.sage);
        drawBatchedFern(p, [1635, 1575], rad(-104), 245, 72, 11, 0.14, PAL.malachite);
        p.rosette3D({ cx: 2045, cy: 1450, radius: 124, count: 20, viewDeg: 20, fill: PAL.celadon, deepFill: PAL.sageDk, youngFill: PAL.celadonLt, dyingFill: PAL.ochre });
        drawTerracottaPlanter(p, 1805, 1495, 128, 92);
        drawStrelitzia(p, 1805, 1548, 0.98);
        // 2k. Three Asymmetric Hanging Hexagonal Victorian Gas-Lamps & Fluttering Butterflies
        p.hangingLantern({ cx: 432, cy: 418, w: 68, h: 102, cordLen: 380, style: "gas", swayAmp: 2.0, freq: 0.85, phase: 0.6 });
        p.hangingLantern({ cx: 1125, cy: 332, w: 58, h: 88, cordLen: 310, style: "gas", swayAmp: 1.8, freq: 0.82, phase: 1.5 });
        p.hangingLantern({ cx: 2065, cy: 388, w: 64, h: 96, cordLen: 350, style: "gas", swayAmp: 2.1, freq: 0.88, phase: 2.4 });
        p.animGroup({ kind: "bob", cx: 745, cy: 590, ampY: 14, ampDeg: 7, freq: 2.0, phase: 0.3 }, () => drawButterfly(p, 745, 590, 0.92));
        p.animGroup({ kind: "bob", cx: 1865, cy: 1140, ampY: 12, ampDeg: 6, freq: 2.2, phase: 2.7 }, () => drawButterfly(p, 1865, 1140, 0.85));
    }, false, "clerestory-clip");
    // Solid-forged Victorian cast-iron Gothic cusps along the top inner arch lip (strictly outside clearBox!)
    const cuspB = new PathBatcher();
    const rxInC = (wR - wL) * 0.5;
    const ryInC = wSpring - wApex;
    const cuspCount = 7;
    for (let i = 0; i < cuspCount; i++) {
        const a0 = Math.PI + 0.14 + (i / cuspCount) * (Math.PI - 0.28);
        const a1 = Math.PI + 0.14 + ((i + 1) / cuspCount) * (Math.PI - 0.28);
        const am = (a0 + a1) * 0.5;
        const p0x = wMid + Math.cos(a0) * rxInC;
        const p0y = wSpring + Math.sin(a0) * ryInC;
        const p1x = wMid + Math.cos(a1) * rxInC;
        const p1y = wSpring + Math.sin(a1) * ryInC;
        const tipX = wMid + Math.cos(am) * (rxInC - 6.8);
        const tipY = wSpring + Math.sin(am) * (ryInC - 6.8);
        const midArcX = wMid + Math.cos(am) * (rxInC + 2.5);
        const midArcY = wSpring + Math.sin(am) * (ryInC + 2.5);
        // Forged cast-iron scalloped cusp spandrel (filled to merge seamlessly with the iron arch band!)
        const cuspFillD = `M${f(p0x)} ${f(p0y)}Q${f(midArcX)} ${f(midArcY)} ${f(p1x)} ${f(p1y)}Q${f((p1x + tipX) * 0.5)} ${f((p1y + tipY) * 0.5 - 1.5)} ${f(tipX)} ${f(tipY)}Q${f((p0x + tipX) * 0.5)} ${f((p0y + tipY) * 0.5 - 1.5)} ${f(p0x)} ${f(p0y)}Z`;
        cuspB.addPath("cuspIron", cuspFillD, { fill: PAL.slateDk, fillOpacity: 0.96 });
        cuspB.addPath("cuspEdge", `M${f(p0x)} ${f(p0y)}Q${f((p0x + tipX) * 0.5)} ${f((p0y + tipY) * 0.5 - 1.5)} ${f(tipX)} ${f(tipY)}Q${f((p1x + tipX) * 0.5)} ${f((p1y + tipY) * 0.5 - 1.5)} ${f(p1x)} ${f(p1y)}`, {
            stroke: PAL.ink,
            strokeWidth: 0.72,
            strokeOpacity: 0.9,
            nonScaling: "contour",
        });
        cuspB.circle("cuspBud", tipX, tipY, 1.35, { fill: PAL.brass, fillOpacity: 0.88 });
    }
    cuspB.flush(p);
    p.flush();
    return {
        index: 4,
        id: "s04-glasshouse",
        title: "Victorian Palm House & Clerestory",
        subtitle: "Riveted iron lattice dome, herringbone brick paths & open casement",
        portal: S04_PORTAL,
        coreColorDay: [232, 238, 232],
        coreColorNight: [22, 34, 52],
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
