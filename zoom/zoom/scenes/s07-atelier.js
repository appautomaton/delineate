// Octave s07 (Stage 5 — 5x Micro-Craft): Dense @kiuzyx Optician's & Clockmaker's Studio + Tall Mullioned Window
// Zero oval/tube bezel collar! Floor-to-ceiling mahogany & blackened-steel optical cabinets, 2 denseBookshelf
// bays (300+ micro spines & ring binders), glass vitrine packed with 36+ apothecary bottles & 18 brass lenses,
// pinned Fraunhofer doublet technical chart, planked walnut workbench with under-bench specimen drawers,
// achromatic prism spectrometer + 5-band Newton dispersion fan on millimeter graph vellum, precision rotating
// watchmaker's brass bow-lathe, compound brass microscope, 16-lens mahogany trial case, calipers, dividers,
// 2-column copperplate optical treatise, warm 2 AM banker's lamps, and an open tall dark-bronze mullioned
// studio bay window at (1540, 900) framing s08 the Great Refractor Observatory!
import { LIGHT, PAL, Painter, PathBatcher, add, circlePath, closedSmooth, cubic, cylinderTone, denseBookshelf, ellipsePath, f, lerp, linePath, polar, polyPath, rad, rand, rectWindowHole, sample, } from "../kit.js";
import { BLEED, requiredPortalClearBox, requiredPortalSealBox, } from "./types.js";
export const S07_PORTAL = { cx: 1540, cy: 900, rx: 180, ry: 124 };
const NEXT_PORTAL = [860, 550]; // s08-observatory
/** Draws a @kiuzyx-dense glazed mahogany apothecary, reagent & optical-specimen cabinet (3-value shaded glass bottles, corks, meniscuses, hanging brass tools & stacked lens cases!). */
function drawOpticalVitrineCabinet(p, x, y, w, h) {
    const b = new PathBatcher();
    // Deep mahogany outer case & warm recessed beadboard tongue-and-groove interior back (ZERO blank beige wall!)
    b.rect("cabBack", x, y, w, h, { fill: PAL.barkDk, fillOpacity: 0.99 });
    b.rect("cabWall", x + 8, y + 8, w - 16, h - 16, { fill: PAL.umberDk, fillOpacity: 0.86 });
    for (let gx = x + 16; gx < x + w - 10; gx += 14) {
        b.line("bead", gx, y + 8, gx, y + h - 8, { stroke: PAL.ink, strokeWidth: 0.36, strokeOpacity: 0.36, nonScaling: "hatch" });
        b.line("beadHi", gx + 2, y + 8, gx + 2, y + h - 8, { stroke: PAL.umberLt, strokeWidth: 0.3, strokeOpacity: 0.16, nonScaling: "hatch" });
    }
    // Recessed interior side shadow & warm top shelf cornice moulding
    b.rect("sideShd", x + 8, y + 8, 12, h - 16, { fill: PAL.ink, fillOpacity: 0.24 });
    b.rect("sideShd", x + w - 20, y + 8, 12, h - 16, { fill: PAL.ink, fillOpacity: 0.24 });
    const shelves = 4;
    const baseDrawerH = 44;
    const rowH = (h - 18 - baseDrawerH) / shelves;
    const jarCols = [PAL.azurite, PAL.ochre, PAL.malachite, PAL.cinnabar, PAL.wisteria, PAL.celadonDk, PAL.copper];
    // Helper: draws a 3-value blown-glass reagent bottle (clear glass shoulder, colored liquid + elliptical meniscus, shaded right flank, vertical specular glint, cork/stopper & ruled parchment label!)
    const addBottle = (cx, baseY, bw, bh, col, fillFrac, isBackRow, stopperKind) => {
        const hw = bw * 0.5;
        const nw = bw * 0.24;
        const neckY = baseY - bh + 12;
        const bodyTopY = neckY + 14;
        const d = `M${f(cx - nw)} ${f(baseY - bh)}H${f(cx + nw)}V${f(neckY)}` +
            `Q${f(cx + hw)} ${f(neckY + 5)} ${f(cx + hw)} ${f(bodyTopY)}V${f(baseY)}H${f(cx - hw)}V${f(bodyTopY)}` +
            `Q${f(cx - hw)} ${f(neckY + 5)} ${f(cx - nw)} ${f(neckY)}Z`;
        if (isBackRow) {
            b.addPath("backBtl", d, { fill: PAL.slateDk, fillOpacity: 0.44 });
            b.rect("backCork", cx - nw * 0.85, baseY - bh - 5, nw * 1.7, 6, { fill: PAL.umber, fillOpacity: 0.5 });
            return;
        }
        // 1. Translucent pale blown-glass envelope (leaving clear glass headspace at shoulder/neck!)
        b.addPath("gEnv", d, { fill: PAL.glass, fillOpacity: 0.36 });
        // 2. Jewel-toned optical reagent liquid inside up to curved elliptical meniscus
        const liqH = Math.max(14, (baseY - bodyTopY + 5) * fillFrac);
        const menY = baseY - liqH;
        b.rect(`liq-${col}`, cx - hw + 1.2, menY, bw - 2.4, liqH - 1, { fill: col, fillOpacity: 0.78 });
        // 3. 3-value cylindrical glass shading: dark shadowed right flank + warm sunlit left highlight + meniscus oval!
        b.rect("gShd", cx + hw * 0.16, bodyTopY, hw * 0.82, baseY - bodyTopY, { fill: PAL.ink, fillOpacity: 0.28 });
        b.rect("gLit", cx - hw + 2.2, bodyTopY + 1, hw * 0.38, baseY - bodyTopY - 3, { fill: PAL.paper, fillOpacity: 0.28 });
        b.addPath("menisc", ellipsePath(cx, menY, hw - 1.5, 2.4), { fill: PAL.inkRim, fillOpacity: 0.64 });
        // 4. Flanged glass lip ring + tapered cork or faceted ground-glass stopper
        b.rect("gLip", cx - nw - 1.8, baseY - bh - 1, nw * 2 + 3.6, 3.2, { fill: PAL.glass, fillOpacity: 0.82 });
        if (stopperKind === "cork") {
            b.quad("jCork", [cx - nw * 0.92, baseY - bh - 7.5], [cx + nw * 0.92, baseY - bh - 7.5], [cx + nw * 0.72, baseY - bh - 1], [cx - nw * 0.72, baseY - bh - 1], {
                fill: PAL.umberLt,
                fillOpacity: 0.96,
            });
        }
        else {
            b.circle("gStop", cx, baseY - bh - 5.5, nw * 0.95, { fill: PAL.glass, fillOpacity: 0.88 });
            b.line("jHi", cx - nw * 0.4, baseY - bh - 7.5, cx + nw * 0.2, baseY - bh - 5.5, { stroke: PAL.inkRim, strokeWidth: 0.6, strokeOpacity: 0.82, nonScaling: "hatch" });
        }
        // 5. Ruled archival parchment bottle label with crimson trim & micro-script!
        const lblH = Math.min(22, Math.max(12, liqH * 0.44));
        const lblY = baseY - liqH * 0.66;
        b.rect("jLbl", cx - hw + 3.2, lblY, bw - 6.4, lblH, { fill: PAL.paperWarm, fillOpacity: 0.96 });
        b.line("lblRed", cx - hw + 4.4, lblY + 2.6, cx + hw - 4.4, lblY + 2.6, { stroke: PAL.cinnabar, strokeWidth: 0.42, strokeOpacity: 0.8, nonScaling: "hatch" });
        b.line("lblTxt", cx - hw + 5.2, lblY + lblH * 0.56, cx + hw - 5.8, lblY + lblH * 0.56, { stroke: PAL.ink, strokeWidth: 0.36, strokeOpacity: 0.76, nonScaling: "hatch" });
        b.line("lblTxt", cx - hw + 6.4, lblY + lblH * 0.78, cx + hw - 7.2, lblY + lblH * 0.78, { stroke: PAL.inkMid, strokeWidth: 0.32, strokeOpacity: 0.68, nonScaling: "hatch" });
        // 6. Sharp vertical specular glass glint on left shoulder/flank + crisp ink outline
        b.line("jHi", cx - hw + 3.2, bodyTopY - 2, cx - hw + 3.2, baseY - 3, { stroke: PAL.inkRim, strokeWidth: 0.78, strokeOpacity: 0.84, nonScaling: "hatch" });
        b.line("jHi", cx + hw - 2.6, bodyTopY + 6, cx + hw - 2.6, baseY - 5, { stroke: PAL.inkRim, strokeWidth: 0.4, strokeOpacity: 0.42, nonScaling: "hatch" });
        b.addPath("jOut", d, { stroke: PAL.ink, strokeWidth: 0.44, strokeOpacity: 0.82, nonScaling: "hatch" });
    };
    for (let row = 0; row < shelves; row++) {
        const shelfTop = y + 10 + row * rowH;
        const sy = y + 10 + (row + 1) * rowH - 9;
        b.rect("shd", x + 8, shelfTop, w - 16, 18, { fill: PAL.ink, fillOpacity: 0.28 });
        b.rect("shelf", x + 6, sy, w - 12, 9, { fill: PAL.umber, fillOpacity: 0.99 });
        b.line("shelfHi", x + 8, sy + 1, x + w - 8, sy + 1, { stroke: PAL.umberLt, strokeWidth: 0.5, strokeOpacity: 0.52, nonScaling: "contour" });
        if (row === 0 || row === 2) {
            // Recessed rear row of shadowy apothecary bottles for real @kiuzyx cabinet depth!
            for (let i = 0; i < 8; i++) {
                const bx = x + 32 + i * ((w - 64) / 7.5) + rand(p.r, -4, 4);
                addBottle(bx, sy - 4, rand(p.r, 22, 30), rowH * rand(p.r, 0.66, 0.84), PAL.slateDk, 0.7, true, "cork");
            }
            // Dense foreground row of 11 richly shaded 3-value blown-glass reagent bottles!
            let bx = x + 16;
            for (let i = 0; i < 12 && bx < x + w - 26; i++) {
                const bw = rand(p.r, 20, 30);
                const bh = rowH * rand(p.r, 0.54, 0.8);
                const col = jarCols[(row * 5 + i) % jarCols.length];
                addBottle(bx + bw * 0.5, sy, bw, bh, col, rand(p.r, 0.55, 0.82), false, i % 3 === 0 ? "glass" : "cork");
                bx += bw + rand(p.r, 2.5, 5.5);
            }
        }
        else if (row === 1) {
            // Back wall horizontal walnut tool-rail with hanging miniature brass horological tools (calipers, dividers, tweezers, screwdrivers!)
            const railY = shelfTop + 34;
            b.rect("rail", x + 16, railY, w - 32, 9, { fill: PAL.umber, fillOpacity: 0.98 });
            for (let i = 0; i < 11; i++) {
                const tx = x + 30 + i * ((w - 60) / 10);
                b.circle("brass", tx, railY + 4.5, 2.2, { fill: PAL.brassLt, fillOpacity: 0.96 });
                if (i % 3 === 0) {
                    // Hanging brass proportional dividers
                    b.line("toolB", tx, railY + 6, tx - 8, railY + 58, { stroke: PAL.brassLt, strokeWidth: 0.95, strokeOpacity: 0.92, nonScaling: "contour" });
                    b.line("toolB", tx, railY + 6, tx + 8, railY + 58, { stroke: PAL.brass, strokeWidth: 0.95, strokeOpacity: 0.92, nonScaling: "contour" });
                }
                else if (i % 3 === 1) {
                    // Hanging precision watchmaker's screwdriver with fluted brass handle
                    b.rect("brass", tx - 2.6, railY + 7, 5.2, 22, { fill: PAL.brass, fillOpacity: 0.96 });
                    b.line("toolS", tx, railY + 29, tx, railY + 56, { stroke: PAL.paperStone, strokeWidth: 0.72, strokeOpacity: 0.88, nonScaling: "contour" });
                }
                else {
                    // Hanging circular brass ring-loupe / spring caliper
                    b.circle("toolB", tx, railY + 24, 11, { stroke: PAL.brassLt, strokeWidth: 0.95, strokeOpacity: 0.9, nonScaling: "contour" });
                    b.line("toolB", tx, railY + 35, tx, railY + 56, { stroke: PAL.brass, strokeWidth: 0.85, strokeOpacity: 0.88, nonScaling: "contour" });
                }
            }
            // Two-tier stepped mahogany lens rack holding 10 graduated brass achromatic lens cells & upright brass eyepieces!
            b.rect("rack", x + 16, sy - 14, w - 32, 14, { fill: PAL.barkDk, fillOpacity: 0.98 });
            for (let i = 0; i < 10; i++) {
                const lx = x + 30 + i * ((w - 60) / 9);
                if (i === 1 || i === 5 || i === 8) {
                    // Upright brass microscope/telescope eyepiece barrel with knurled collar
                    b.rect("brass", lx - 8, sy - 54, 16, 40, { fill: PAL.brass, fillOpacity: 0.98 });
                    b.rect("brassDk", lx - 10, sy - 58, 20, 7, { fill: PAL.brassDk, fillOpacity: 0.98 });
                    b.rect("brassLt", lx - 5, sy - 52, 4, 36, { fill: PAL.brassLt, fillOpacity: 0.75 });
                    b.addPath("jOut", `M${f(lx - 8)} ${f(sy - 54)}H${f(lx + 8)}V${f(sy - 14)}H${f(lx - 8)}Z`, { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.8, nonScaling: "hatch" });
                }
                else {
                    const rL = 11.5 + (i % 3) * 3.4;
                    const ly = sy - 14 - rL;
                    b.circle("brass", lx, ly, rL, { fill: PAL.brass, fillOpacity: 0.98 });
                    b.circle("glass", lx, ly, rL - 3.2, { fill: PAL.glass, fillOpacity: 0.88 });
                    b.line("jHi", lx - rL * 0.42, ly - rL * 0.2, lx + rL * 0.22, ly - rL * 0.52, { stroke: PAL.inkRim, strokeWidth: 0.7, strokeOpacity: 0.82, nonScaling: "hatch" });
                    b.circle("jOut", lx, ly, rL, { stroke: PAL.ink, strokeWidth: 0.45, strokeOpacity: 0.8, nonScaling: "hatch" });
                }
                b.rect("jLbl", lx - 6, sy - 9, 12, 4.5, { fill: PAL.paperWarm, fillOpacity: 0.9 });
            }
        }
        else {
            // Bottom vitrine shelf (featured up close in day-mid-o07!): stacked dovetailed optical cases, 3D beveled prisms, brass gram-weights block & amber dropper vials!
            // Left: 3 stacked wooden/cloth-bound optical specimen boxes with brass clasps & inventory tags
            const stacks = [
                [x + 18, sy - 34, 86, 34, PAL.umber],
                [x + 22, sy - 62, 76, 28, PAL.cinnabarDk],
                [x + 26, sy - 86, 66, 24, PAL.prussian],
                [x + 114, sy - 42, 78, 42, PAL.umber],
                [x + 118, sy - 68, 68, 26, PAL.sageDk],
            ];
            for (const [bx, by, bw, bh, col] of stacks) {
                b.rect(`bx-${col}`, bx, by, bw, bh, { fill: col, fillOpacity: 0.96 });
                b.rect("bxShd", bx + bw - 10, by, 10, bh, { fill: PAL.ink, fillOpacity: 0.24 });
                b.line("bxLid", bx, by + 6, bx + bw, by + 6, { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.78, nonScaling: "hatch" });
                b.rect("jLbl", bx + bw * 0.24, by + bh * 0.36, bw * 0.52, Math.min(11, bh * 0.38), { fill: PAL.paperWarm, fillOpacity: 0.94 });
                b.rect("brass", bx + bw * 0.46, by + 3, bw * 0.08, 6, { fill: PAL.brassLt, fillOpacity: 0.96 });
                b.addPath("jOut", `M${f(bx)} ${f(by)}H${f(bx + bw)}V${f(by + bh)}H${f(bx)}Z`, { stroke: PAL.ink, strokeWidth: 0.45, strokeOpacity: 0.82, nonScaling: "hatch" });
            }
            // Center-right: Brass apothecary gram-weight block with 5 graduated cylindrical brass weights
            const wx0 = x + 204;
            b.rect("rack", wx0, sy - 20, 74, 20, { fill: PAL.umberDk, fillOpacity: 0.98 });
            for (let k = 0; k < 5; k++) {
                const wkx = wx0 + 10 + k * 13.5;
                const wkh = 28 - k * 3.8;
                b.rect("brass", wkx - 4.5, sy - 20 - wkh, 9, wkh, { fill: PAL.brass, fillOpacity: 0.98 });
                b.circle("brassLt", wkx, sy - 22 - wkh, 2.5, { fill: PAL.brassLt, fillOpacity: 0.98 });
            }
            // Right: 2 Beveled 3D isometric glass equilateral prisms + 3 small stoppered amber-balsam dropper vials!
            const p1x = x + 294;
            b.addPath("prismF", `M${f(p1x)} ${f(sy)}L${f(p1x + 20)} ${f(sy - 46)}L${f(p1x + 40)} ${f(sy)}Z`, { fill: PAL.glass, fillOpacity: 0.84 });
            b.addPath("prismS", `M${f(p1x + 20)} ${f(sy - 46)}L${f(p1x + 30)} ${f(sy - 52)}L${f(p1x + 49)} ${f(sy - 6)}L${f(p1x + 40)} ${f(sy)}Z`, { fill: PAL.glassTint, fillOpacity: 0.78 });
            b.line("jHi", p1x + 17, sy - 38, p1x + 7, sy - 8, { stroke: PAL.inkRim, strokeWidth: 0.72, strokeOpacity: 0.86, nonScaling: "hatch" });
            b.addPath("jOut", `M${f(p1x)} ${f(sy)}L${f(p1x + 20)} ${f(sy - 46)}L${f(p1x + 40)} ${f(sy)}ZM${f(p1x + 20)} ${f(sy - 46)}L${f(p1x + 30)} ${f(sy - 52)}L${f(p1x + 49)} ${f(sy - 6)}L${f(p1x + 40)} ${f(sy)}`, {
                stroke: PAL.ink,
                strokeWidth: 0.46,
                strokeOpacity: 0.82,
                nonScaling: "hatch",
            });
            for (let v = 0; v < 2; v++) {
                addBottle(x + 356 + v * 20, sy, 16, 48 + v * 10, v === 0 ? PAL.ochre : PAL.azurite, 0.74, false, "cork");
            }
        }
    }
    // Bottom Row of 4 Indexed Mahogany Apothecary Specimen Drawers with Brass Pulls & Ivory Cards!
    const drwY = y + h - baseDrawerH - 4;
    const drwW = (w - 28) / 4;
    for (let dIdx = 0; dIdx < 4; dIdx++) {
        const dx = x + 10 + dIdx * (drwW + 2.5);
        b.rect("cabDrw", dx, drwY, drwW - 2, baseDrawerH - 6, { fill: PAL.umber, fillOpacity: 0.96 });
        b.addPath("jOut", `M${f(dx)} ${f(drwY)}H${f(dx + drwW - 2)}V${f(drwY + baseDrawerH - 6)}H${f(dx)}Z`, {
            stroke: PAL.ink,
            strokeWidth: 0.5,
            strokeOpacity: 0.84,
            nonScaling: "hatch",
        });
        b.rect("jLbl", dx + drwW * 0.24, drwY + 6, drwW * 0.52, 10, { fill: PAL.paperWarm, fillOpacity: 0.94 });
        b.circle("brassLt", dx + drwW * 0.5 - 1, drwY + 25, 4.2, { fill: PAL.brassLt, fillOpacity: 0.98 });
    }
    // Glazed mullioned cabinet doors, brass keyhole escutcheon & clean diagonal window-glass sheen
    b.addPath("sheen", `M${f(x + 18)} ${f(y + 115)}L${f(x + 135)} ${f(y + 18)}M${f(x + 32)} ${f(y + 310)}L${f(x + 228)} ${f(y + 125)}M${f(x + 145)} ${f(y + 680)}L${f(x + 365)} ${f(y + 475)}`, {
        stroke: PAL.inkRim,
        strokeWidth: 0.88,
        strokeOpacity: 0.28,
        nonScaling: "hatch",
    });
    // Center wooden meeting stile + tiny brass turn-latch & escutcheon plate
    b.rect("stile", x + w * 0.5 - 3, y + 4, 6, h - 8, { fill: PAL.barkDk, fillOpacity: 0.96 });
    b.rect("brass", x + w * 0.5 - 5, y + h * 0.48, 10, 22, { fill: PAL.brass, fillOpacity: 0.96 });
    b.circle("brassLt", x + w * 0.5 + 9, y + h * 0.48 + 11, 3.8, { fill: PAL.brassLt, fillOpacity: 0.98 });
    b.addPath("cabFrame", `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`, {
        stroke: PAL.ink,
        strokeWidth: 0.85,
        strokeOpacity: 0.88,
        nonScaling: "contour",
    });
    b.flush(p);
}
/** Draws a pinned archival Fraunhofer / Achromatic Doublet optical ray-tracing chart. */
function drawOpticalChart(p, x, y, w, h) {
    p.fillPath(polyPath([[x + 6, y + 8], [x + w + 6, y + 8], [x + w + 6, y + h + 8], [x + 6, y + h + 8]]), PAL.inkMid, "var(--z-shadow-op)");
    p.fillPath(`M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`, PAL.paper, 0.99);
    const b = new PathBatcher();
    // Fine millimeter background grid on chart
    for (let gx = x + 16; gx < x + w - 12; gx += 18)
        b.line("g", gx, y + 12, gx, y + h - 12, { stroke: PAL.inkDraft, strokeWidth: 0.25, strokeOpacity: 0.18, nonScaling: "hatch" });
    for (let gy = y + 16; gy < y + h - 12; gy += 18)
        b.line("g", x + 12, gy, x + w - 12, gy, { stroke: PAL.inkDraft, strokeWidth: 0.25, strokeOpacity: 0.18, nonScaling: "hatch" });
    const midY = y + h * 0.44;
    const lensX = x + w * 0.36;
    const focusX = x + w * 0.86;
    const rH = h * 0.26;
    const crownD = `M${f(lensX - 16)} ${f(midY - rH)}Q${f(lensX - 30)} ${f(midY)} ${f(lensX - 16)} ${f(midY + rH)}Q${f(lensX + 8)} ${f(midY)} ${f(lensX - 16)} ${f(midY - rH)}Z`;
    const flintD = `M${f(lensX - 14)} ${f(midY - rH)}Q${f(lensX + 10)} ${f(midY)} ${f(lensX - 14)} ${f(midY + rH)}H${f(lensX + 14)}V${f(midY - rH)}Z`;
    b.addPath("crown", crownD, { fill: PAL.glass, fillOpacity: 0.72 });
    b.addPath("flint", flintD, { fill: PAL.glassTint, fillOpacity: 0.68 });
    b.line("axis", x + 20, midY, x + w - 20, midY, { stroke: PAL.inkDraft, strokeWidth: 0.45, strokeOpacity: 0.78, nonScaling: "hatch" });
    b.line("axis", focusX, midY - rH * 0.9, focusX, midY + rH * 0.9, { stroke: PAL.inkDraft, strokeWidth: 0.45, strokeOpacity: 0.78, nonScaling: "hatch" });
    for (const frac of [-0.78, -0.45, 0.45, 0.78]) {
        const dy = rH * frac;
        b.addPath("ray", `M${f(x + 28)} ${f(midY + dy)}L${f(lensX - 15)} ${f(midY + dy)}L${f(lensX + 12)} ${f(midY + dy * 0.84)}L${f(focusX)} ${f(midY)}`, {
            stroke: PAL.inkDraft,
            strokeWidth: 0.45,
            strokeOpacity: 0.82,
            nonScaling: "hatch",
        });
    }
    b.addPath("lensLn", crownD + flintD, { stroke: PAL.inkDraft, strokeWidth: 0.65, strokeOpacity: 0.88, nonScaling: "contour" });
    // Fraunhofer A-G spectral bar across bottom
    const barX = x + 28;
    const barY = y + h - 48;
    const barW = w - 56;
    const barH = 18;
    const specCols = [PAL.cinnabar, PAL.ochre, PAL.ochreLt, PAL.celadon, PAL.azurite, PAL.wisteria];
    for (let i = 0; i < specCols.length; i++) {
        b.rect(`s-${i}`, barX + (barW * i) / specCols.length, barY, barW / specCols.length + 1, barH, { fill: specCols[i], fillOpacity: 0.62 });
    }
    for (const u of [0.08, 0.16, 0.28, 0.41, 0.52, 0.64, 0.77, 0.88, 0.94]) {
        b.line("axis", barX + barW * u, barY - 4, barX + barW * u, barY + barH + 5, { stroke: PAL.inkDraft, strokeWidth: 0.45, strokeOpacity: 0.84, nonScaling: "hatch" });
    }
    b.addPath("border", `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}ZM${f(x + 10)} ${f(y + 10)}H${f(x + w - 10)}V${f(y + h - 10)}H${f(x + 10)}Z`, { stroke: PAL.inkDraft, strokeWidth: 0.55, strokeOpacity: 0.82, nonScaling: "contour" });
    for (const [tx, ty] of [[x + 16, y + 16], [x + w - 16, y + 16], [x + 16, y + h - 16], [x + w - 16, y + h - 16]]) {
        b.circle("tack", tx, ty, 3.8, { fill: PAL.brass, fillOpacity: 0.96 });
    }
    b.flush(p);
}
/** Draws a precision miniature watchmaker's brass & cast-iron bow-lathe on the lower-right workbench! */
function drawWatchmakerLathe(p, x, baseY) {
    const b = new PathBatcher();
    // Cast ground shadow
    p.fillPath(ellipsePath(x + 215, baseY + 12, 235, 32), PAL.ink, 0.32);
    // Heavy machined cast-iron lathe bed + mounting feet
    b.quad("foot", [x + 20, baseY - 26], [x + 76, baseY - 26], [x + 90, baseY + 10], [x + 6, baseY + 10], { fill: PAL.slateDk, fillOpacity: 0.98 });
    b.quad("foot", [x + 330, baseY - 26], [x + 386, baseY - 26], [x + 400, baseY + 10], [x + 316, baseY + 10], { fill: PAL.slateDk, fillOpacity: 0.98 });
    b.rect("bed", x + 16, baseY - 56, 376, 30, { fill: PAL.slate, fillOpacity: 0.98 });
    b.rect("bedHi", x + 16, baseY - 56, 376, 7, { fill: PAL.paperStone, fillOpacity: 0.68 });
    b.rect("bedDk", x + 16, baseY - 34, 376, 8, { fill: PAL.slateDk, fillOpacity: 0.96 });
    // Headstock pillar, stepped brass belt-pulley & 3-jaw brass collet chuck (left side)
    b.quad("head", [x + 48, baseY - 178], [x + 116, baseY - 178], [x + 126, baseY - 56], [x + 38, baseY - 56], { fill: PAL.slateDk, fillOpacity: 0.98 });
    b.rect("brass", x + 64, baseY - 166, 38, 56, { fill: PAL.brass, fillOpacity: 0.98 });
    b.rect("brassLt", x + 72, baseY - 164, 12, 52, { fill: PAL.brassLt, fillOpacity: 0.72 });
    // Brass spindle & turned brass workpiece being machined!
    b.rect("brass", x + 116, baseY - 148, 34, 24, { fill: PAL.brassDk, fillOpacity: 0.98 });
    b.rect("brassLt", x + 150, baseY - 154, 24, 36, { fill: PAL.brass, fillOpacity: 0.98 });
    b.rect("work", x + 174, baseY - 143, 52, 14, { fill: PAL.brassLt, fillOpacity: 0.96 });
    // Sliding compound cross-slide tool-rest & micrometer crank (center)
    b.rect("slide", x + 178, baseY - 94, 78, 38, { fill: PAL.slateDk, fillOpacity: 0.98 });
    b.rect("brass", x + 202, baseY - 128, 22, 34, { fill: PAL.brass, fillOpacity: 0.98 });
    b.rect("tool", x + 208, baseY - 134, 10, 14, { fill: PAL.paperWarm, fillOpacity: 0.96 });
    b.circle("brassLt", x + 218, baseY - 75, 11, { fill: PAL.brassLt, fillOpacity: 0.98 });
    // Tailstock housing, locking lever & quill handwheel (right side)
    b.quad("head", [x + 292, baseY - 158], [x + 356, baseY - 158], [x + 366, baseY - 56], [x + 282, baseY - 56], { fill: PAL.slateDk, fillOpacity: 0.98 });
    b.rect("brass", x + 244, baseY - 141, 48, 10, { fill: PAL.brass, fillOpacity: 0.98 });
    b.rect("brass", x + 356, baseY - 142, 24, 12, { fill: PAL.brassDk, fillOpacity: 0.98 });
    b.circle("brassLt", x + 388, baseY - 136, 22, { fill: PAL.brass, fillOpacity: 0.96 });
    b.circle("hole", x + 388, baseY - 136, 13, { fill: PAL.umberDk, fillOpacity: 0.86 });
    // Fine curled brass lathe shavings scattered on bench below chuck
    for (let k = 0; k < 14; k++) {
        const sx = x + 152 + rand(p.r, 0, 110);
        const sy = baseY - 18 + rand(p.r, 0, 26);
        b.addPath("shav", `M${f(sx)} ${f(sy)}q5 -5 10 0t9 2`, { stroke: PAL.brassLt, strokeWidth: 0.65, strokeOpacity: 0.84, nonScaling: "hatch" });
    }
    b.addPath("latheLn", `M${f(x + 16)} ${f(baseY - 56)}H${f(x + 392)}V${f(baseY - 26)}H${f(x + 16)}Z`, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.86, nonScaling: "contour" });
    b.flush(p);
    // Rotating brass spoked flywheel mounted on left of headstock!
    const fwC = [x + 26, baseY - 136];
    p.animGroup({ kind: "rotate", cx: fwC[0], cy: fwC[1], speedDeg: -16, phase: 0 }, () => {
        p.spurGear({ cx: fwC[0], cy: fwC[1], r: 44, teeth: 20, spokes: 5, fill: PAL.brass, rimFill: PAL.brassLt });
    });
}
/** Draws an antique standing brass compound monocular laboratory microscope! */
function drawBrassMicroscope(p, cx, baseY) {
    p.fillPath(ellipsePath(cx + 18, baseY + 10, 96, 24), PAL.ink, 0.32);
    const foot = [
        [cx - 76, baseY + 6], [cx - 52, baseY - 20], [cx + 54, baseY - 20], [cx + 78, baseY + 6],
        [cx + 44, baseY + 12], [cx + 26, baseY - 4], [cx - 26, baseY - 4], [cx - 44, baseY + 12],
    ];
    p.doubleGlaze(foot, PAL.slateDk, PAL.ink, { smooth: false, thinPx: 0.48, thickPx: 0.86 });
    p.fillPath(polyPath([[cx - 11, baseY - 94], [cx + 11, baseY - 94], [cx + 14, baseY - 14], [cx - 14, baseY - 14]]), PAL.brass, 0.98);
    const cArm = sample(cubic([cx + 4, baseY - 88], [cx + 62, baseY - 110], [cx + 66, baseY - 176], [cx + 18, baseY - 198]), 12);
    p.calligraphicStroke(cArm, 15, 18, 13, PAL.brass, 0.98);
    p.burinContour(linePath(cArm), PAL.ink, 0.68, 0.84, 1);
    // Specimen stage, clips & substage condenser mirror
    p.fillPath(polyPath([[cx - 58, baseY - 98], [cx + 38, baseY - 98], [cx + 48, baseY - 84], [cx - 66, baseY - 84]]), PAL.slateDk, 0.96);
    p.fillPath(polyPath([[cx - 32, baseY - 101], [cx + 14, baseY - 101], [cx + 18, baseY - 95], [cx - 36, baseY - 95]]), PAL.glass, 0.88);
    p.fillPath(ellipsePath(cx - 12, baseY - 46, 22, 11), PAL.glass, 0.88);
    p.burinContour(ellipsePath(cx - 12, baseY - 46, 22, 11), PAL.brass, 0.9, 0.9, 1);
    // Tilted polished-brass body tube, revolving nosepiece & knurled focus knob
    const tube = [[cx - 28, baseY - 260], [cx + 14, baseY - 246], [cx - 14, baseY - 138], [cx - 52, baseY - 150]];
    p.doubleGlaze(tube, PAL.brass, PAL.brassDk, { smooth: false, thinPx: 0.48, thickPx: 0.88 });
    p.fillPath(polyPath([[cx - 22, baseY - 288], [cx + 10, baseY - 278], [cx + 5, baseY - 252], [cx - 26, baseY - 262]]), PAL.brassLt, 0.96);
    p.burinHatch(tube, rad(-73), 5.5, cylinderTone([cx - 20, baseY - 196], [-0.28, 0.96], 24, LIGHT), { color: PAL.inkSepia, opacity: 0.48 });
    p.fillPath(circlePath(cx + 38, baseY - 172, 15), PAL.brassLt, 0.98);
    p.burinContour(circlePath(cx + 38, baseY - 172, 15) + circlePath(cx + 38, baseY - 172, 7.5), PAL.ink, 0.56, 0.86, 2);
}
/** Draws an open leather-bound optician's treatise with copperplate script & achromatic doublet plate! */
function drawOpenOpticalTreatise(p, x, y, w, h) {
    p.fillPath(polyPath([[x + 7, y + 9], [x + w + 7, y + 9], [x + w + 16, y + h + 9], [x - 4, y + h + 9]]), PAL.ink, 0.3);
    p.fillPath(polyPath([[x - 8, y - 4], [x + w + 8, y - 4], [x + w + 18, y + h + 7], [x - 16, y + h + 7]]), PAL.cinnabarDk, 0.96);
    const midX = x + w * 0.5;
    p.fillPath(polyPath([[x, y], [midX - 3, y + 4], [midX - 3, y + h], [x - 8, y + h]]), PAL.paper, 0.99);
    p.fillPath(polyPath([[midX + 3, y + 4], [x + w, y], [x + w + 8, y + h], [midX + 3, y + h]]), PAL.paperWarm, 0.99);
    p.fillPath(polyPath([[midX - 8, y + 3], [midX + 8, y + 3], [midX + 10, y + h], [midX - 10, y + h]]), PAL.paperShadow, 0.3);
    const b = new PathBatcher();
    b.rect("cap", x + 12, y + 14, 22, 22, { fill: PAL.cinnabarLt, fillOpacity: 0.5 });
    for (let row = 0; row < 10; row++) {
        const ry = y + 18 + row * 10.5;
        const x0 = row < 2 ? x + 38 : x + 12;
        const x1 = midX - 14 - ((row * 17) % 22);
        let d = `M${f(x0)} ${f(ry)}`;
        for (let sx = x0; sx < x1 - 7; sx += 11) {
            d += `q4 ${row % 2 === 0 ? "-1.5" : "1.5"} 8 0m3 0`;
        }
        b.addPath("txt", d, { stroke: PAL.inkDraft, strokeWidth: 0.38, strokeOpacity: 0.72, nonScaling: "hatch" });
    }
    // Right page: compound lens doublet ray-tracing figure
    const dCx = midX + w * 0.25;
    const dCy = y + h * 0.44;
    const pCrown = `M${f(dCx - 9)} ${f(dCy - 36)}Q${f(dCx - 22)} ${f(dCy)} ${f(dCx - 9)} ${f(dCy + 36)}Q${f(dCx + 4)} ${f(dCy)} ${f(dCx - 9)} ${f(dCy - 36)}Z`;
    const pFlint = `M${f(dCx - 7)} ${f(dCy - 36)}Q${f(dCx + 6)} ${f(dCy)} ${f(dCx - 7)} ${f(dCy + 36)}H${f(dCx + 9)}V${f(dCy - 36)}Z`;
    b.addPath("crown", pCrown, { fill: PAL.glass, fillOpacity: 0.72 });
    b.addPath("flint", pFlint, { fill: PAL.glassTint, fillOpacity: 0.68 });
    b.addPath("txt", circlePath(dCx, dCy, 46) + pCrown + pFlint + `M${f(dCx - 58)} ${f(dCy)}H${f(dCx + 58)}M${f(dCx)} ${f(dCy - 52)}V${f(dCy + 52)}`, {
        stroke: PAL.inkDraft,
        strokeWidth: 0.42,
        strokeOpacity: 0.78,
        nonScaling: "hatch",
    });
    b.addPath("redRay", `M${f(dCx - 54)} ${f(dCy - 22)}L${f(dCx - 9)} ${f(dCy - 22)}L${f(dCx + 9)} ${f(dCy - 17)}L${f(dCx + 56)} ${f(dCy)}` +
        `M${f(dCx - 54)} ${f(dCy + 22)}L${f(dCx - 9)} ${f(dCy + 22)}L${f(dCx + 9)} ${f(dCy + 17)}L${f(dCx + 56)} ${f(dCy)}`, { stroke: PAL.cinnabar, strokeWidth: 0.52, strokeOpacity: 0.74, nonScaling: "hatch" });
    b.addPath("out", polyPath([[x, y], [x + w, y], [x + w + 8, y + h], [x - 8, y + h]]), {
        stroke: PAL.ink,
        strokeWidth: 0.62,
        strokeOpacity: 0.8,
        nonScaling: "contour",
    });
    b.flush(p);
}
/** Draws precision brass & steel vernier calipers resting obliquely on the walnut workbench. */
function drawVernierCalipers(p, origin, angDeg, scale = 1) {
    const a = rad(angDeg);
    const toW = (pt) => add(origin, [
        (pt[0] * Math.cos(a) - pt[1] * Math.sin(a)) * scale,
        (pt[0] * Math.sin(a) + pt[1] * Math.cos(a)) * scale,
    ]);
    const shadowRaw = [[0, -14], [420, -14], [420, 14], [140, 14], [115, 74], [94, 68], [94, 14], [28, 14], [14, 82], [-6, 70]];
    p.fillPath(polyPath(shadowRaw.map((pt) => add(toW(pt), [8, 12]))), PAL.ink, "var(--z-shadow-op)");
    const beamPts = [toW([0, -52]), toW([18, -44]), toW([26, -13]), toW([420, -13]), toW([420, 13]), toW([26, 13]), toW([15, 82]), toW([0, 70])];
    p.doubleGlaze(beamPts, PAL.paperStone, PAL.slate, { smooth: false, thinPx: 0.45, thickPx: 0.88 });
    const jawX = 108;
    const slidePts = [
        toW([jawX - 16, -50]), toW([jawX + 4, -42]), toW([jawX + 12, -20]), toW([jawX + 90, -20]),
        toW([jawX + 90, 20]), toW([jawX + 14, 20]), toW([jawX + 4, 82]), toW([jawX - 12, 70]), toW([jawX - 12, 20]),
    ];
    p.doubleGlaze(slidePts, PAL.brass, PAL.brassDk, { smooth: false, thinPx: 0.48, thickPx: 0.9 });
    const sc = toW([jawX + 52, -27]);
    p.fillPath(circlePath(sc[0], sc[1], 9 * scale), PAL.brassLt, 0.96);
    p.burinContour(circlePath(sc[0], sc[1], 9 * scale), PAL.ink, 0.55, 0.85, 1);
    let ticksD = "";
    for (let i = 0; i <= 52; i++) {
        const tx = 42 + i * 7;
        const p0 = toW([tx, -12]);
        const p1 = toW([tx, i % 5 === 0 ? 2 : -4]);
        ticksD += `M${f(p0[0])} ${f(p0[1])}L${f(p1[0])} ${f(p1[1])}`;
    }
    p.burin(ticksD, PAL.ink, 0.38, 0.78, 53, "hatch");
}
/** Draws a velvet-lined 16-lens mahogany optician's trial case (2x8 brass-rimmed lenses in PathBatcher!). */
function drawTrialLensCase(p, x, y, w, h) {
    const b = new PathBatcher();
    b.rect("shd", x + 7, y + 9, w, h, { fill: PAL.ink, fillOpacity: 0.3 });
    b.rect("wood", x, y, w, h, { fill: PAL.umberDk, fillOpacity: 0.98 });
    b.rect("velvet", x + 10, y + 10, w - 20, h - 20, { fill: PAL.prussianDk, fillOpacity: 0.96 });
    // Brass corner clasps
    for (const [cx, cy] of [[x, y], [x + w - 12, y], [x, y + h - 12], [x + w - 12, y + h - 12]]) {
        b.rect("brass", cx, cy, 12, 12, { fill: PAL.brass, fillOpacity: 0.94 });
    }
    const cols = 6;
    const rows = 2;
    const dx = (w - 32) / cols;
    const dy = (h - 30) / rows;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const lx = x + 16 + (c + 0.5) * dx;
            const ly = y + 15 + (r + 0.5) * dy;
            const radL = Math.min(dx, dy) * 0.38;
            b.circle("brass", lx, ly, radL, { fill: PAL.brass, fillOpacity: 0.96 });
            b.circle("glass", lx, ly, radL - 3, { fill: PAL.glass, fillOpacity: 0.86 });
            b.line("hi", lx - radL * 0.4, ly - radL * 0.25, lx + radL * 0.2, ly - radL * 0.48, { stroke: PAL.inkRim, strokeWidth: 0.6, strokeOpacity: 0.76, nonScaling: "hatch" });
            b.rect("tag", lx - 8, ly + radL + 2, 16, 4.5, { fill: PAL.paperWarm, fillOpacity: 0.85 });
        }
    }
    b.addPath("out", `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.86, nonScaling: "contour" });
    b.flush(p);
}
/** Draws a turned brass plumb-gauge stand (swaying brass plumb bob). */
function drawBrassGaugeStand(p, cx, baseY) {
    p.fillPath(ellipsePath(cx + 8, baseY + 7, 56, 17), PAL.ink, 0.3);
    p.fillPath(ellipsePath(cx, baseY, 48, 14), PAL.brassDk, 0.98);
    p.fillPath(ellipsePath(cx, baseY - 10, 36, 10), PAL.brass, 0.98);
    p.fillPath(polyPath([[cx - 7, baseY - 168], [cx + 7, baseY - 168], [cx + 10, baseY - 10], [cx - 10, baseY - 10]]), PAL.brass, 0.98);
    p.fillPath(circlePath(cx, baseY - 173, 10), PAL.brassLt, 0.98);
    const armPts = sample(cubic([cx, baseY - 166], [cx + 24, baseY - 184], [cx + 54, baseY - 174], [cx + 68, baseY - 160]), 10);
    p.calligraphicStroke(armPts, 5.5, 4.5, 3, PAL.brass, 0.98);
    p.animGroup({ kind: "sway", cx: cx + 66, cy: baseY - 158, ampDeg: 4.0, freq: 1.35, phase: 0.9 }, () => {
        p.burinContour(`M${f(cx + 66)} ${f(baseY - 158)}V${f(baseY - 52)}`, PAL.inkMid, 0.52, 0.82, 1);
        const bob = [[cx + 66, baseY - 58], [cx + 78, baseY - 44], [cx + 66, baseY - 18], [cx + 54, baseY - 44]];
        p.doubleGlaze(bob, PAL.brassLt, PAL.brassDk, { smooth: false, thinPx: 0.45, thickPx: 0.78 });
    });
}
export function buildS07Atelier() {
    const p = new Painter("s07", 709);
    const clearBox = requiredPortalClearBox(S07_PORTAL, NEXT_PORTAL);
    const sealBox = requiredPortalSealBox(S07_PORTAL);
    // Crisp architectural dark-bronze/mahogany mullioned studio window (ZERO oval/tube collar!)
    const hole = rectWindowHole(clearBox, { padL: 62, padR: 62, padTop: 44, padBot: 44, chamfer: 0 });
    const winX0 = hole[0][0]; // ~1337
    const winX1 = hole[1][0]; // ~1697
    const winY0 = hole[0][1]; // ~759
    const winY1 = hole[2][1]; // ~1007
    // Gradients
    const wallGrad = p.linearGrad("wall", 0, BLEED.y0, 0, 1080, [
        [0, PAL.paperWarm],
        [1, PAL.paperDeep],
    ]);
    const winSkyGrad = p.linearGrad("winsky", 1800, 88, 1800, 960, [
        [0, PAL.glass],
        [0.48, PAL.celadonLt],
        [0.78, PAL.paperWarm],
        [1, PAL.paperDeep],
    ]);
    const walnutGrad = p.linearGrad("walnut", 0, 780, 2400, 1780, [
        [0, PAL.umberLt],
        [0.48, PAL.umber],
        [1, PAL.umberDk],
    ]);
    const lampConeGrad = p.radialGrad("lampcone", 620, 820, 920, [
        [0, PAL.lanternCore, 0.54],
        [0.36, PAL.lantern, 0.28],
        [0.72, PAL.lanternHalo, 0.12],
        [1, PAL.lanternHalo, 0],
    ]);
    const rightLampGrad = p.radialGrad("rlamp", 1980, 1140, 620, [
        [0, PAL.lanternCore, 0.46],
        [0.45, PAL.lantern, 0.22],
        [1, PAL.lanternHalo, 0],
    ]);
    // 1. Opaque full-bleed studio backdrop cutout
    p.asymmetricPortalBackdrop(hole, wallGrad, { smooth: false });
    p.clippedToBackdrop(hole, () => {
        // 2. Coffered Timber Atelier Ceiling Beams & Wainscoted Back Wall (y = -280..1040)
        const arch = new PathBatcher();
        arch.rect("ceiling", BLEED.x0, BLEED.y0, BLEED.x1 - BLEED.x0, 322, { fill: PAL.umberDk, fillOpacity: 0.96 });
        for (let bx = -240; bx <= 2640; bx += 220) {
            arch.rect("beam", bx, BLEED.y0, 26, 326, { fill: PAL.umber, fillOpacity: 0.98 });
            arch.line("beamLn", bx, BLEED.y0, bx, 46, { stroke: PAL.ink, strokeWidth: 0.6, strokeOpacity: 0.72, nonScaling: "contour" });
        }
        arch.rect("cornice", BLEED.x0, 38, BLEED.x1 - BLEED.x0, 18, { fill: PAL.umber, fillOpacity: 0.99 });
        arch.flush(p);
        // 3. Left & Center Floor-to-Ceiling @kiuzyx Optical Studio Cabinets & Dense Bookshelves!
        // Bay 1: Full-height dense optical/horological bookshelf with ring binders (x = -60..415, y = 56..805)
        denseBookshelf(p, { x: -60, y: 56, w: 475, h: 748 }, { shelves: 5, binders: true, chromeRack: true });
        // Bay 2: Upper dense treatise bookshelf (x = 430..885, y = 56..498) above pinned Fraunhofer chart
        denseBookshelf(p, { x: 430, y: 56, w: 455, h: 442 }, { shelves: 3, binders: true, chromeRack: false });
        drawOpticalChart(p, 434, 514, 448, 278);
        // Bay 3: Glass-Fronted Apothecary & Brass Optical-Tube Specimen Vitrine Cabinet (x = 900..1302, y = 56..802)!
        drawOpticalVitrineCabinet(p, 900, 56, 402, 746);
        // 4. Right Architectural Tall 12-Pane Dark-Bronze Mullioned Studio Bay Window Looking Out to the Observatory Dome & Cypress Garden!
        // All 11 closed panes reveal a continuous exterior sky, riveted observatory dome silhouette, garden cypresses & matching observatory gallery masonry,
        // while the lower-left pane (1540, 900) is a REAL swung-open steel casement sash opening directly into s08!
        const winB = new PathBatcher();
        const bayX0 = winX0 - 16; // flush with open casement left jamb (~1321)
        const bayX1 = 2376;
        const bayY0 = 78;
        const bayY1 = winY1 + 16; // flush with open casement lower sill (~1023)
        winB.rect("casing", bayX0, bayY0, bayX1 - bayX0, bayY1 - bayY0, { fill: PAL.slateDk, fillOpacity: 0.99 });
        winB.flush(p);
        // Luminous exterior twilight/daylight sky backdrop behind all 11 closed glass panes (swaps to deep starlit indigo at Night!)
        p.fillPath(`M${f(bayX0 + 16)} ${f(bayY0 + 16)}H${f(bayX1 - 16)}V${f(bayY1 - 16)}H${f(bayX0 + 16)}Z`, winSkyGrad, 0.96);
        p.layer("var(--z-star-op)", () => {
            const sb = new PathBatcher();
            sb.rect("nightSky", bayX0 + 16, bayY0 + 16, bayX1 - bayX0 - 32, bayY1 - bayY0 - 32, { fill: PAL.prussianDk, fillOpacity: 0.88 });
            for (let i = 0; i < 48; i++) {
                sb.circle("star", rand(p.r, bayX0 + 28, bayX1 - 28), rand(p.r, bayY0 + 28, 560), rand(p.r, 0.9, 2.0), {
                    fill: PAL.lanternCore,
                    fillOpacity: 0.82,
                });
            }
            // Waxing nocturnal crescent moon gleaming through upper-right transom pane!
            sb.addPath("moon", "M2195 148A22 22 0 1 0 2208 190A17 17 0 1 1 2195 148Z", { fill: PAL.lanternCore, fillOpacity: 0.92 });
            sb.flush(p);
        });
        // Continuous Exterior Observatory Complex & Cypress Garden Skyline spanning smoothly across all 11 closed panes!
        const extB = new PathBatcher();
        // Distant misty coastal hills behind the observatory garden
        extB.addPath("hillFar", `M${f(bayX0 + 16)} 740Q1540 565 1820 625Q2120 535 ${f(bayX1 - 16)} 635V${f(bayY1 - 16)}H${f(bayX0 + 16)}Z`, { fill: PAL.celadon, fillOpacity: 0.56 });
        // Monumental Exterior Patinated-Copper Ribbed Observatory Dome Silhouette rising directly beyond the upper & right glass panes!
        extB.addPath("domeBody", `M1338 785C1350 380 1560 225 1845 225C2110 225 2285 375 2328 785Z`, { fill: PAL.celadonDk, fillOpacity: 0.92 });
        extB.addPath("domeSun", `M1338 785C1350 380 1560 225 1845 225C1745 305 1665 480 1635 785Z`, { fill: PAL.celadon, fillOpacity: 0.55 });
        extB.addPath("domeShd", `M1845 225C2110 225 2285 375 2328 785H1945C1930 470 1892 295 1845 225Z`, { fill: PAL.prussianDk, fillOpacity: 0.44 });
        // Exterior copper dome shutter slit arch, cupola finial & standing-seam copper ribs!
        extB.addPath("domeSlit", "M1775 785C1782 470 1805 280 1845 225C1875 280 1895 470 1902 785Z", { fill: PAL.slateDk, fillOpacity: 0.56 });
        extB.circle("finial", 1845, 212, 8, { fill: PAL.brass, fillOpacity: 0.94 });
        for (let i = 0; i < 9; i++) {
            const u = (i + 1) / 10;
            const bx = 1358 + u * 945;
            extB.addPath("domeRib", `M${f(bx)} 785Q${f(lerp([bx, 785], [1845, 225], 0.52)[0])} 415 1845 225`, {
                stroke: PAL.copper,
                strokeWidth: 0.68,
                strokeOpacity: 0.58,
                nonScaling: "hatch",
            });
        }
        for (const py of [355, 488, 622, 742]) {
            extB.addPath("domeRib", `M1355 ${f(py)}Q1845 ${f(py - 28)} 2322 ${f(py)}`, {
                stroke: PAL.inkMid,
                strokeWidth: 0.52,
                strokeOpacity: 0.48,
                nonScaling: "hatch",
            });
        }
        // Stone observatory rotunda cornice belt right below the copper dome
        extB.rect("rotCorn", bayX0 + 16, 766, bayX1 - bayX0 - 32, 18, { fill: PAL.paperWarm, fillOpacity: 0.94 });
        // Flanking Exterior Mediterranean Cypress & Olive Garden Silhouette along the lower observatory terrace (y = 580..880)
        for (const [tx, ty, rx, ry] of [
            [1415, 675, 28, 125], [1472, 705, 24, 102], [2195, 665, 32, 138], [2268, 695, 28, 118], [2332, 725, 30, 96],
        ]) {
            extB.addPath("gardenTree", `M${f(tx)} ${f(ty - ry)}Q${f(tx + rx)} ${f(ty - ry * 0.2)} ${f(tx + rx * 0.65)} ${f(ty + ry * 0.55)}H${f(tx - rx * 0.65)}Q${f(tx - rx)} ${f(ty - ry * 0.2)} ${f(tx)} ${f(ty - ry)}Z`, {
                fill: PAL.sageDk,
                fillOpacity: 0.72,
            });
        }
        // Continuous Lower Observatory Masonry Drum & Cast-Iron Ring-Beam visible directly across the lower-right panes (continuous with s08!)
        extB.rect("obsWall", bayX0 + 16, 782, bayX1 - bayX0 - 32, bayY1 - 798, { fill: PAL.paperStone, fillOpacity: 0.92 });
        extB.rect("obsRing", bayX0 + 16, 872, bayX1 - bayX0 - 32, 24, { fill: PAL.slateDk, fillOpacity: 0.82 });
        extB.line("obsBrass", bayX0 + 16, 896, bayX1 - 16, 896, { stroke: PAL.brass, strokeWidth: 1.0, strokeOpacity: 0.78, nonScaling: "contour" });
        // Arched exterior observatory gallery windows glowing warmly at Night through the right glass panes!
        for (const gx of [1835, 1955, 2135, 2255]) {
            extB.addPath("extArch", `M${f(gx - 26)} 996V936A26 24 0 0 1 ${f(gx + 26)} 936V996Z`, { fill: PAL.windowLit, fillOpacity: 0.72 });
            extB.addPath("extArchLn", `M${f(gx - 26)} 996V936A26 24 0 0 1 ${f(gx + 26)} 936V996Z`, { stroke: PAL.inkMid, strokeWidth: 0.5, strokeOpacity: 0.6, nonScaling: "hatch" });
        }
        // Subtle translucent blue-glass atmosphere & crisp diagonal window reflections across the 11 closed panes
        extB.rect("paneGlaze", bayX0 + 16, bayY0 + 16, bayX1 - bayX0 - 32, bayY1 - bayY0 - 32, { fill: PAL.glass, fillOpacity: 0.24 });
        extB.addPath("gGlint", "M1365 268L1515 118M1745 278L1925 112M2078 272L2275 108M1380 495L1568 328M1765 505L1990 322M2088 502L2318 320M1412 715L1622 552M1778 725L2008 548M2092 718L2322 548M1765 975L1988 785M2095 972L2315 788", { stroke: PAL.inkRim, strokeWidth: 0.9, strokeOpacity: 0.44, nonScaling: "hatch" });
        // Architectural bronze transom & vertical bay mullions 100% FLUSH with open casement (winX1..winX1+16, winY0-16..winY0)!
        extB.rect("mullion", winX1, bayY0 + 10, 16, bayY1 - bayY0 - 20, { fill: PAL.slateDk, fillOpacity: 0.99 });
        extB.rect("mullion", 2036, bayY0 + 10, 16, bayY1 - bayY0 - 20, { fill: PAL.slateDk, fillOpacity: 0.99 });
        for (const my of [305, 530]) {
            extB.rect("mullion", bayX0 + 10, my - 7, bayX1 - bayX0 - 20, 14, { fill: PAL.slateDk, fillOpacity: 0.99 });
        }
        extB.rect("mullion", bayX0 + 10, winY0 - 16, bayX1 - bayX0 - 20, 16, { fill: PAL.slateDk, fillOpacity: 0.99 });
        // Fine interior leaded glazing muntins across upper transom & right bays
        for (const subX of [1458, 1578, 1824, 1932, 2152, 2262]) {
            extB.line("subMunt", subX, bayY0 + 16, subX, winY0 - 16, { stroke: PAL.slate, strokeWidth: 0.62, strokeOpacity: 0.74, nonScaling: "contour" });
        }
        for (const subX of [1824, 1932, 2152, 2262]) {
            extB.line("subMunt", subX, winY0, subX, bayY1 - 16, { stroke: PAL.slate, strokeWidth: 0.62, strokeOpacity: 0.74, nonScaling: "contour" });
        }
        for (const subY of [192, 418, 636]) {
            extB.line("subMunt", bayX0 + 16, subY, bayX1 - 16, subY, { stroke: PAL.slate, strokeWidth: 0.56, strokeOpacity: 0.7, nonScaling: "contour" });
        }
        for (const subY of [882]) {
            extB.line("subMunt", winX1 + 16, subY, bayX1 - 16, subY, { stroke: PAL.slate, strokeWidth: 0.56, strokeOpacity: 0.7, nonScaling: "contour" });
        }
        // Rolled-Up Slatted Walnut Venetian Blinds & Hanging Brass-Acorn Pull Cords tucked cleanly across top of the 3 window bays!
        const blindBays = [
            [bayX0 + 18, winX1 - 2],
            [winX1 + 18, 2034],
            [2054, bayX1 - 18],
        ];
        for (const [bx0, bx1] of blindBays) {
            const bw = bx1 - bx0;
            extB.rect("blindBox", bx0, bayY0 + 16, bw, 46, { fill: PAL.umber, fillOpacity: 0.96 });
            for (let sl = 0; sl < 6; sl++) {
                const sy = bayY0 + 21 + sl * 7;
                extB.line("blindSlat", bx0 + 2, sy, bx1 - 2, sy, { stroke: PAL.umberLt, strokeWidth: 0.55, strokeOpacity: 0.72, nonScaling: "hatch" });
                extB.line("blindShd", bx0 + 2, sy + 2.5, bx1 - 2, sy + 2.5, { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.62, nonScaling: "hatch" });
            }
            // Vertical linen ladder-tapes + hanging pull-cord with brass acorn tassel
            extB.rect("tape", bx0 + bw * 0.22, bayY0 + 16, 4.5, 46, { fill: PAL.paperWarm, fillOpacity: 0.85 });
            extB.rect("tape", bx0 + bw * 0.78, bayY0 + 16, 4.5, 46, { fill: PAL.paperWarm, fillOpacity: 0.85 });
            extB.line("cord", bx1 - 18, bayY0 + 62, bx1 - 18, bayY0 + 148, { stroke: PAL.umberLt, strokeWidth: 0.65, strokeOpacity: 0.84, nonScaling: "contour" });
            extB.circle("brass", bx1 - 18, bayY0 + 151, 3.8, { fill: PAL.brassLt, fillOpacity: 0.96 });
        }
        // Deep projecting mahogany window sill running flush beneath the tall studio window
        extB.rect("sillTop", bayX0 - 18, bayY1 - 2, bayX1 - bayX0 + 36, 16, { fill: PAL.umberLt, fillOpacity: 0.99 });
        extB.rect("sillFace", bayX0 - 18, bayY1 + 14, bayX1 - bayX0 + 36, 18, { fill: PAL.umberDk, fillOpacity: 0.99 });
        extB.flush(p);
        // 3D Swung-Open Blackened-Steel Casement Sash Leaf hinged on the right jamb (x = winX1+6) swinging inward-right over the adjacent pane!
        // Strictly outside `hole` (0px obstruction) so (1540, 900) unmistakably reads as an OPEN casement window sash!
        const sashB = new PathBatcher();
        const sHingeX = winX1 + 6;
        const sOuterX = winX1 + 114;
        const sTL = [sHingeX, winY0 - 4];
        const sTR = [sOuterX, winY0 - 24];
        const sBR = [sOuterX, winY1 + 22];
        const sBL = [sHingeX, winY1 + 4];
        // Cast shadow of open steel casement sash onto closed glass & sill behind it
        sashB.quad("sShd", [sTL[0] + 10, sTL[1] + 10], [sTR[0] + 16, sTR[1] + 14], [sBR[0] + 16, sBR[1] + 14], [sBL[0] + 10, sBL[1] + 10], {
            fill: PAL.ink,
            fillOpacity: 0.24,
        });
        // Translucent glazed interior of the open swung sash
        sashB.quad("sGlass", sTL, sTR, sBR, sBL, { fill: PAL.glass, fillOpacity: 0.42 });
        sashB.addPath("sGlint", `M${f(sHingeX + 14)} ${f(winY0 + 95)}L${f(sOuterX - 12)} ${f(winY0 + 14)}M${f(sHingeX + 18)} ${f(winY1 - 18)}L${f(sOuterX - 10)} ${f(winY1 - 105)}`, { stroke: PAL.inkRim, strokeWidth: 0.95, strokeOpacity: 0.62, nonScaling: "hatch" });
        // Blackened-steel perimeter stiles & 2×2 interior leaded glazing bars in true perspective
        const sMidX = (sHingeX + sOuterX) * 0.5;
        const sMidTop = lerp(sTL, sTR, 0.5);
        const sMidBot = lerp(sBL, sBR, 0.5);
        const sMidL = lerp(sTL, sBL, 0.5);
        const sMidR = lerp(sTR, sBR, 0.5);
        sashB.line("sMunt", sMidTop[0], sMidTop[1], sMidBot[0], sMidBot[1], { stroke: PAL.slateDk, strokeWidth: 1.4, strokeOpacity: 0.94, nonScaling: "contour" });
        sashB.line("sMunt", sMidL[0], sMidL[1], sMidR[0], sMidR[1], { stroke: PAL.slateDk, strokeWidth: 1.4, strokeOpacity: 0.94, nonScaling: "contour" });
        // Heavy perimeter steel sash frame (outer edge slightly thicker to show 3D thickness!)
        sashB.addPath("sFrame", `M${f(sTL[0])} ${f(sTL[1])}L${f(sTR[0])} ${f(sTR[1])}L${f(sBR[0])} ${f(sBR[1])}L${f(sBL[0])} ${f(sBL[1])}Z`, {
            stroke: PAL.slateDk,
            strokeWidth: 4.2,
            strokeOpacity: 0.99,
            nonScaling: "contour",
        });
        sashB.line("sHi", sTR[0], sTR[1], sBR[0], sBR[1], { stroke: PAL.litEdge, strokeWidth: 0.85, strokeOpacity: 0.72, nonScaling: "contour" });
        // Turned curved brass casement handle + notched brass quadrant stay bar pinned to sill!
        const hY = (sTR[1] + sBR[1]) * 0.5;
        sashB.rect("sBrass", sOuterX - 4, hY - 12, 7, 24, { fill: PAL.brass, fillOpacity: 0.98 });
        sashB.addPath("sBrassLn", `M${f(sOuterX + 2)} ${f(hY)}Q${f(sOuterX + 18)} ${f(hY + 4)} ${f(sOuterX + 14)} ${f(hY + 26)}`, {
            stroke: PAL.brassLt,
            strokeWidth: 1.6,
            strokeOpacity: 0.96,
            nonScaling: "contour",
        });
        sashB.line("sStay", sMidX + 12, sMidBot[1] - 4, sHingeX + 22, bayY1 + 2, { stroke: PAL.brassLt, strokeWidth: 1.4, strokeOpacity: 0.94, nonScaling: "contour" });
        sashB.flush(p);
        // Miniature Brass Celestial Armillary Sphere & Crown-Glass Prism resting on the right mahogany window sill!
        const sillY = bayY1 - 2;
        p.fillPath(ellipsePath(2148, sillY + 4, 34, 8), PAL.ink, 0.28);
        p.fillPath(ellipsePath(2144, sillY, 28, 7), PAL.brassDk, 0.98);
        p.fillPath(`M2140 ${f(sillY - 34)}H2148V${f(sillY)}H2140Z`, PAL.brass, 0.98);
        p.fillPath(circlePath(2144, sillY - 68, 36), PAL.glass, 0.22);
        p.burinContour(circlePath(2144, sillY - 68, 36) +
            ellipsePath(2144, sillY - 68, 36, 14) +
            ellipsePath(2144, sillY - 68, 16, 36) +
            `M2114 ${f(sillY - 94)}L2174 ${f(sillY - 42)}`, PAL.brassLt, 0.92, 0.92, 4);
        p.fillPath(circlePath(2144, sillY - 68, 8), PAL.brass, 0.98);
        p.fillPath(polyPath([[2212, sillY], [2242, sillY - 42], [2272, sillY]]), PAL.glass, 0.84);
        p.burinContour(polyPath([[2212, sillY], [2242, sillY - 42], [2272, sillY]]), PAL.ink, 0.56, 0.84, 3);
        // Hanging Brass Astrolabe Pendant suspended in the upper-right bay window transom!
        p.hangingLantern({ cx: 1875, cy: 235, w: 72, h: 78, cordLen: 115, style: "astrolabe", swayAmp: 1.5, freq: 0.85, phase: 0.6 });
        // 5. Dense L-Shaped Planked Walnut Optician's & Clockmaker's Workbench wrapping across left & foreground!
        p.fillPath(polyPath([[BLEED.x0, 795], [bayX0, 795], [bayX0, 1038], [BLEED.x1, 1038], [BLEED.x1, 1495], [BLEED.x0, 1495]]), walnutGrad, 0.99);
        // Front workbench apron + 12 Under-Bench Shallow Optical Specimen & Tool Drawers (y = 1495..1880)!
        p.fillPath(`M${BLEED.x0} 1495H${BLEED.x1}V${BLEED.y1}H${BLEED.x0}Z`, PAL.umberDk, 0.99);
        const benchB = new PathBatcher();
        // Fine undulating walnut wood-grain burin lines & horizontal plank miter joints
        for (let y = 812; y < 1490; y += 14) {
            const xStart = BLEED.x0;
            const xEnd = y < 1038 ? bayX0 : BLEED.x1;
            const wav = Math.sin(y * 0.05) * 5;
            benchB.addPath("grain", `M${f(xStart)} ${f(y)}Q780 ${f(y + wav)} ${f(xEnd)} ${f(y - wav * 0.5)}`, {
                stroke: PAL.inkSepia,
                strokeWidth: 0.36,
                strokeOpacity: 0.34,
                nonScaling: "hatch",
            });
        }
        for (const py of [930, 1038, 1185, 1340, 1495]) {
            const xEnd = py < 1038 ? bayX0 : BLEED.x1;
            benchB.line("plank", BLEED.x0, py, xEnd, py, { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.52, nonScaling: "contour" });
        }
        // 2 rows × 6 cols of under-bench mahogany specimen drawers with brass label-holders & cup pulls!
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 6; col++) {
                const dx = 40 + col * 388;
                const dy = 1512 + row * 112;
                const dw = 368;
                const dh = 96;
                benchB.rect("drw", dx, dy, dw, dh, { fill: PAL.umber, fillOpacity: 0.64 });
                benchB.addPath("drwLn", `M${f(dx)} ${f(dy)}H${f(dx + dw)}V${f(dy + dh)}H${f(dx)}Z`, { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.78, nonScaling: "contour" });
                // Brass card-holder label frame & cup pull
                benchB.rect("lbl", dx + dw * 0.5 - 32, dy + 16, 64, 22, { fill: PAL.brass, fillOpacity: 0.92 });
                benchB.rect("paper", dx + dw * 0.5 - 24, dy + 21, 48, 12, { fill: PAL.paperWarm, fillOpacity: 0.92 });
                benchB.addPath("pull", `M${f(dx + dw * 0.5 - 28)} ${f(dy + 56)}H${f(dx + dw * 0.5 + 28)}A28 18 0 0 1 ${f(dx + dw * 0.5 - 28)} ${f(dy + 56)}Z`, {
                    fill: PAL.brassLt,
                    fillOpacity: 0.92,
                });
            }
        }
        benchB.flush(p);
        // Warm 2 AM overlapping amber light pools from both banker's lamps across workbench & cabinets!
        p.layer("var(--z-halo-op)", () => {
            p.fillPath(circlePath(620, 820, 920), lampConeGrad, 0.98);
            p.fillPath(circlePath(1980, 1140, 620), rightLampGrad, 0.92);
        });
        // 6. Steel & Brass Dovetail Optical Bench Rail + Unrolled Millimeter Graph Vellum Sheet!
        const railTop = [[-120, 885], [1485, 1340], [1455, 1418], [-150, 965]];
        const railSide = [[-150, 965], [1455, 1418], [1455, 1456], [-150, 1002]];
        p.fillPath(polyPath(railSide), PAL.slateDk, 0.98);
        p.fillPath(polyPath(railTop), PAL.slate, 0.96);
        const railBrass = [[-132, 916], [1472, 1371], [1464, 1396], [-140, 941]];
        p.fillPath(polyPath(railBrass), PAL.brass, 0.92);
        let rTicks = "";
        for (let i = 0; i <= 65; i++) {
            const u = i / 65;
            const t0 = lerp(railBrass[0], railBrass[1], u);
            const t1 = lerp(railBrass[3], railBrass[2], u);
            const end = lerp(t0, t1, i % 5 === 0 ? 0.9 : 0.48);
            rTicks += `M${f(t0[0])} ${f(t0[1])}L${f(end[0])} ${f(end[1])}`;
        }
        p.burin(rTicks, PAL.ink, 0.4, 0.72, 66, "hatch");
        p.burinContour(polyPath(railTop) + polyPath(railSide), PAL.ink, 0.68, 0.84, 2);
        // Unrolled Ivory Millimeter Graph Vellum Sheet beneath the spectral fan (x = 450..1240, y = 1045..1470)
        const sheetPts = [[540, 995], [1225, 1155], [1115, 1472], [430, 1315]];
        p.fillPath(polyPath(sheetPts.map(([x, y]) => [x + 8, y + 11])), PAL.ink, "var(--z-shadow-op)");
        p.fillPath(polyPath(sheetPts), PAL.paper, 0.99);
        let sGrid = "";
        for (let i = 1; i < 20; i++) {
            const u = i / 20;
            const a = lerp(sheetPts[0], sheetPts[1], u);
            const b = lerp(sheetPts[3], sheetPts[2], u);
            sGrid += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
        }
        for (let j = 1; j < 12; j++) {
            const v = j / 12;
            const a = lerp(sheetPts[0], sheetPts[3], v);
            const b = lerp(sheetPts[1], sheetPts[2], v);
            sGrid += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
        }
        sGrid += `M735 1098A225 225 0 0 1 680 1295`;
        p.burin(sGrid, PAL.inkDraft, 0.34, 0.38, 33, "hatch");
        p.burinContour(polyPath(sheetPts), PAL.inkMid, 0.58, 0.74, 1);
        for (const [wx, wy] of [[565, 1028], [1090, 1438]]) {
            p.fillPath(ellipsePath(wx, wy, 17, 11), PAL.brass, 0.96);
            p.fillPath(ellipsePath(wx - 3, wy - 2, 9, 5), PAL.brassLt, 0.76);
            p.burinContour(ellipsePath(wx, wy, 17, 11), PAL.ink, 0.55, 0.84, 1);
        }
        // 7. Hero Left Achromatic Prism Spectrometer: Brass Collimator -> Rotating Goniometer Prism -> 5-Band Spectrum!
        const prismC = [598, 1045];
        p.fillPath(ellipsePath(prismC[0] + 8, prismC[1] + 18, 134, 120), PAL.ink, 0.3);
        p.animGroup({ kind: "rotate", cx: prismC[0], cy: prismC[1], speedDeg: 4.5, phase: 12 }, () => {
            p.brassDegreeRing({
                cx: prismC[0],
                cy: prismC[1],
                rOuter: 128,
                rInner: 94,
                tickCount: 72,
                majorEvery: 6,
                fill: PAL.brass,
                bevelFill: PAL.brassLt,
                ink: PAL.ink,
            });
        });
        p.fillPath(circlePath(prismC[0], prismC[1], 92), PAL.slateDk, 0.94);
        // Luminous 5-band Newton Spectral Dispersion Fan across the millimeter sheet!
        const exitTop = [prismC[0] + 44, prismC[1] - 16];
        const exitBot = [prismC[0] + 34, prismC[1] + 24];
        const spectralBands = [
            [PAL.cinnabarLt, 5, 13],
            [PAL.ochreLt, 12, 20],
            [PAL.celadonLt, 19, 28],
            [PAL.azurite, 27, 36],
            [PAL.wisteriaLt, 35, 44],
        ];
        for (const [col, deg0, deg1] of spectralBands) {
            const far0 = add(exitTop, polar(620, rad(deg0)));
            const far1 = add(exitBot, polar(600, rad(deg1)));
            p.fillPath(polyPath([exitTop, far0, far1, exitBot]), col, 0.46);
        }
        // Incident golden beam from visible brass collimator into prism
        p.animGroup({ kind: "pulse", baseOp: 0.84, ampOp: 0.16, freq: 1.9, phase: 0.3 }, () => {
            p.fillPath(polyPath([[430, 976], [558, 1022], [552, 1044], [424, 998]]), PAL.lanternCore, 0.62);
            p.fillPath(polyPath([[430, 983], [556, 1029], [554, 1037], [428, 991]]), PAL.lantern, 0.48);
        });
        // Beveled 3D Crown-Glass Equilateral Prism in Brass Trunnion Cradle
        const pTop = [prismC[0] - 6, prismC[1] - 82];
        const pL = [prismC[0] - 72, prismC[1] + 48];
        const pR = [prismC[0] + 66, prismC[1] + 38];
        const pTopB = [pTop[0] + 20, pTop[1] - 24];
        const pRB = [pR[0] + 20, pR[1] - 24];
        const pLB = [pL[0] + 20, pL[1] - 24];
        p.fillPath(polyPath([pTop, pTopB, pRB, pR]), PAL.glassTint, 0.8);
        p.fillPath(polyPath([pTop, pTopB, pLB, pL]), PAL.glass, 0.62);
        p.fillPath(polyPath([pTop, pR, pL]), PAL.glass, 0.78);
        p.fillPath(polyPath([pTop, lerp(pTop, pR, 0.52), lerp(pTop, pL, 0.62)]), PAL.inkRim, 0.48);
        p.burinContour(polyPath([pTop, pR, pL]) +
            `M${f(pTop[0])} ${f(pTop[1])}L${f(pTopB[0])} ${f(pTopB[1])}L${f(pRB[0])} ${f(pRB[1])}L${f(pR[0])} ${f(pR[1])}`, PAL.ink, 0.74, 0.84, 6);
        for (const pt of [pTop, pL, pR]) {
            p.fillPath(circlePath(pt[0], pt[1], 7.5), PAL.brass, 0.96);
            p.burinContour(circlePath(pt[0], pt[1], 7.5), PAL.ink, 0.5, 0.85, 1);
        }
        // Hooded Brass Collimator Lamp Tube on Pillar Stand right on-frame (x = 264..436)!
        p.fillPath(ellipsePath(354, 1082, 74, 22), PAL.ink, 0.34);
        p.doubleGlaze([[324, 1012], [374, 1012], [398, 1082], [302, 1082]], PAL.slateDk, PAL.ink, { smooth: false, thinPx: 0.45, thickPx: 0.82 });
        const collBody = [[286, 916], [434, 968], [414, 1030], [266, 978]];
        p.doubleGlaze(collBody, PAL.brass, PAL.brassDk, { smooth: false, thinPx: 0.48, thickPx: 0.9 });
        p.burinHatch(collBody, rad(19), 6, cylinderTone([350, 974], [0.94, 0.34], 34, LIGHT), { color: PAL.inkSepia, opacity: 0.48 });
        p.fillPath(ellipsePath(426, 998, 12, 30), PAL.lantern, 0.96);
        p.fillPath(ellipsePath(428, 998, 6, 19), PAL.lanternCore, 0.98);
        p.fillPath(polyPath([[306, 882], [352, 896], [344, 936], [298, 922]]), PAL.brassDk, 0.96);
        // 8. Articulated Emerald-Glass Banker's Lamp, Plumb Stand, Open Optical Treatise, Microscope, Watchmaker Lathe, Calipers & Trial Lens Case!
        p.fillPath(ellipsePath(424, 858, 56, 17), PAL.ink, 0.3);
        p.fillPath(ellipsePath(416, 848, 48, 14), PAL.brassDk, 0.98);
        p.fillPath(ellipsePath(416, 840, 34, 10), PAL.brass, 0.98);
        const armSpine = sample(cubic([416, 838], [436, 700], [538, 650], [608, 712]), 12);
        p.calligraphicStroke(armSpine, 9, 7, 5.5, PAL.brassDk, 0.96);
        p.doubleGlaze([[548, 728], [608, 684], [682, 708], [692, 756], [540, 746]], PAL.malachite, PAL.sageDk, { smooth: true, thinPx: 0.48, thickPx: 0.86 });
        p.fillPath(ellipsePath(616, 752, 70, 15), PAL.lantern, 0.94);
        p.fillPath(ellipsePath(616, 754, 42, 8.5), PAL.lanternCore, 0.98);
        drawBrassGaugeStand(p, 825, 965);
        drawOpenOpticalTreatise(p, 915, 842, 326, 194);
        drawTrialLensCase(p, 82, 1255, 318, 174);
        drawVernierCalipers(p, [345, 1320], 9, 0.98);
        // Right Foreground Bench: Antique Compound Microscope + Precision Watchmaker's Bow-Lathe + Optical Blanks on Chamois!
        drawBrassMicroscope(p, 1685, 1345);
        drawWatchmakerLathe(p, 1895, 1378);
        // Chamois cloth (warm ivory PAL.petal so it stays warmly visible at Night!) with unmounted crown-glass lens blanks & hand loupe!
        const cloth = [[1310, 1110], [1560, 1098], [1585, 1245], [1325, 1258]];
        p.doubleGlaze(cloth, PAL.petal, PAL.ochreLt, { smooth: true, washOpacity: 0.9, deepOpacity: 0.32, thinPx: 0.4, thickPx: 0.74 });
        for (const [lx, ly, rL] of [[1382, 1172, 28], [1454, 1202, 24]]) {
            p.fillPath(circlePath(lx, ly, rL), PAL.glass, 0.84);
            p.fillPath(ellipsePath(lx - rL * 0.25, ly - rL * 0.25, rL * 0.34, rL * 0.14), PAL.inkRim, 0.72);
            p.burinContour(circlePath(lx, ly, rL) + circlePath(lx, ly, rL - 4), PAL.inkMid, 0.48, 0.72, 2);
        }
        p.fillPath(polyPath([[1490, 1164], [1565, 1230], [1553, 1242], [1478, 1176]]), PAL.umberDk, 0.96);
        p.fillPath(circlePath(1480, 1144, 30), PAL.brass, 0.98);
        p.fillPath(circlePath(1480, 1144, 24), PAL.glass, 0.86);
        p.burinContour(circlePath(1480, 1144, 30) + circlePath(1480, 1144, 24), PAL.ink, 0.56, 0.84, 2);
        p.flush();
    }, false, "s07-clip");
    // 9. Sleek Machined Dark-Bronze Window Jambs 100% Flush with Surrounding Tall Bay Mullions (ZERO seam step!)
    const wFrame = new PathBatcher();
    const holePoly = polyPath(hole);
    const f1 = [[winX0 - 6, winY0 - 6], [winX1 + 6, winY0 - 6], [winX1 + 6, winY1 + 6], [winX0 - 6, winY1 + 6]];
    const f2 = [[winX0 - 16, winY0 - 16], [winX1 + 16, winY0 - 16], [winX1 + 16, winY1 + 16], [winX0 - 16, winY1 + 16]];
    wFrame.addPath("outer", polyPath(f2) + holePoly, { fill: PAL.slateDk, fillOpacity: 0.99, evenodd: true });
    wFrame.addPath("bevel", polyPath(f1) + holePoly, { fill: PAL.ink, fillOpacity: 0.44, evenodd: true });
    // Brass casement pivot hinges & latch stay on left/right dark-bronze window jambs!
    for (const hy of [winY0 + 38, winY1 - 42]) {
        wFrame.rect("hinge", winX0 - 12, hy - 8, 5, 16, { fill: PAL.brass, fillOpacity: 0.96 });
        wFrame.rect("hinge", winX1 + 7, hy - 8, 5, 16, { fill: PAL.brass, fillOpacity: 0.96 });
    }
    // Tiny brass casement stay bar resting on lower sill
    wFrame.rect("hinge", winX0 + 28, winY1 + 3, 72, 4.5, { fill: PAL.brassLt, fillOpacity: 0.92 });
    wFrame.addPath("ln", holePoly + polyPath(f1), {
        stroke: PAL.ink,
        strokeWidth: 0.78,
        strokeOpacity: 0.88,
        nonScaling: "contour",
    });
    wFrame.line("lit", f1[0][0], f1[0][1], f1[1][0], f1[1][1], { stroke: PAL.litEdge, strokeWidth: 0.65, strokeOpacity: 0.78, nonScaling: "contour" });
    wFrame.flush(p);
    return {
        index: 7,
        id: "s07-atelier",
        title: "Optician's Studio & Mullioned Window",
        subtitle: "Optical vitrines, prism spectrometer, watchmaker's lathe & observatory window",
        portal: S07_PORTAL,
        coreColorDay: [232, 226, 214],
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
