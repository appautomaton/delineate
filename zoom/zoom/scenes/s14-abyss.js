// S14: Abyssal Kelp Canyon & Sunken Expedition Frigate Stern Gallery (Stage-5 5x Micro-Craft Edition)
// KILLED the giant mustard porthole collar! Replaces it with a sunken 19th-century expedition frigate's
// carved oak-and-brass stern gallery arcade on the right volcanic reef cliff (with planked timber strakes,
// copper-sheathed lower bilge, fluted gilded pilasters, carved taffrail pediment, turned stern-walk balusters,
// wrought-brass stern lantern, flanking leaded-glass quarter-gallery windows & swung-open central mullioned
// stern window pane at (1500, 600) -> 404x272px rectWindowHole enclosing S15's full 6x viewport with ZERO collar!).
// Left & lower canyon teems with 3 layered reef skylines, 9 swaying lush Macrocystis giant kelp columns,
// 6 Ernst Haeckel Gorgonia lace sea-fans, Acropora staghorn coral thickets, grooved brain corals, 4 bobbing
// translucent Medusa jellyfish, 120+ tiny schooling silver fish in 4 bait-ball streams (PathBatcher), and a
// finely riveted Victorian brass diving bell casting warm volumetric searchlight cones into the abyss!
import { PAL, Painter, PathBatcher, TAU, bilerp, circlePath, closedSmooth, cubic, ellipsePath, f, lerp, linearTone, openPoly, polyPath, quad, rad, rand, rectWindowHole, sample, } from "../kit.js";
import { BLEED, requiredPortalClearBox, requiredPortalSealBox, } from "./types.js";
export const S14_PORTAL = { cx: 1500, cy: 600, rx: 202, ry: 136 };
const S15_PORTAL_PT = [860, 720];
export function buildS14Abyss() {
    const p = new Painter("s14", 14117);
    const sealBox = requiredPortalSealBox(S14_PORTAL);
    const clearBox = requiredPortalClearBox(S14_PORTAL, S15_PORTAL_PT);
    // Crisp architectural central stern-gallery window opening (`432 x 280 px`, strictly inside 484x328 sealBox
    // AND enclosing ALL of S15's 400x267 S=6x viewport [1300..1700, 467..733] -> 0.0 px frame strip on day-o15.png!).
    const rawHole = rectWindowHole(clearBox, { padL: 84, padR: 112, padTop: 56, padBot: 64 });
    const hole = rawHole.map(([hx, hy]) => [
        Math.max(sealBox.x0 + 6, Math.min(sealBox.x1 - 6, hx)),
        Math.max(sealBox.y0 + 6, Math.min(sealBox.y1 - 6, hy)),
    ]);
    const wX0 = hole[0][0];
    const wY0 = hole[0][1];
    const wX1 = hole[2][0];
    const wY1 = hole[2][1];
    const wW = wX1 - wX0;
    const wH = wY1 - wY0;
    const wCx = (wX0 + wX1) * 0.5;
    const abyssGrad = p.linearGrad("abyss", 360, -240, 2120, 1680, [
        [0, PAL.celadonLt],
        [0.24, PAL.water],
        [0.62, PAL.waterDeep],
        [1, PAL.prussianDk],
    ]);
    const sunbeamGrad = p.linearGrad("sunbeam", 420, -260, 920, 1460, [
        [0, PAL.waterSpray, 0.28],
        [0.55, PAL.celadonLt, 0.13],
        [1, PAL.celadonLt, 0.0],
    ]);
    const searchlightGrad = p.linearGrad("searchlight", 625, 640, 1440, 1440, [
        [0, PAL.lanternCore, 0.44],
        [0.42, PAL.lantern, 0.22],
        [1, PAL.lanternHalo, 0.0],
    ]);
    const timberGrad = p.linearGrad("timber", 1040, 220, 2380, 1140, [
        [0, PAL.umber],
        [0.36, PAL.bark],
        [0.72, PAL.umberDk],
        [1, PAL.prussianDk],
    ]);
    // 1. Opaque full-bleed pelagic water backdrop punched cleanly by the ship's stern-gallery window
    p.asymmetricPortalBackdrop(hole, abyssGrad, { smooth: false });
    p.clippedToBackdrop(hole, () => {
        // 2. Volumetric Surface Sunbeams & Three Layered Reef `skyline` Depth Planes (`deep/gen.ts` lineage!)
        for (const [bx, topW, lean] of [
            [140, 115, 265],
            [460, 150, 320],
            [825, 130, 300],
            [1180, 105, 240],
        ]) {
            p.fillPath(polyPath([
                [bx - topW * 0.5, BLEED.y0],
                [bx + topW * 0.5, BLEED.y0],
                [bx + lean + topW * 1.65, 1620],
                [bx + lean - topW * 1.55, 1620],
            ]), sunbeamGrad, 0.72);
        }
        const buildReefSkyline = (baseY, low, high, step) => {
            const pts = [[BLEED.x0, baseY - rand(p.r, low, high) * 0.5]];
            let x = BLEED.x0;
            while (x < BLEED.x1) {
                const w = rand(p.r, step * 0.65, step * 1.35);
                const h = rand(p.r, low, high);
                pts.push([x + w * 0.28, baseY - h * 0.86], [x + w * 0.52, baseY - h], [x + w * 0.78, baseY - h * rand(p.r, 0.52, 0.78)]);
                x += w;
            }
            pts.push([BLEED.x1, baseY - rand(p.r, low, high) * 0.4], [BLEED.x1, BLEED.y1], [BLEED.x0, BLEED.y1]);
            return pts;
        };
        const farReef = buildReefSkyline(1135, 130, 410, 300);
        const midReef = buildReefSkyline(1245, 95, 310, 230);
        const nearReef = buildReefSkyline(1325, 65, 200, 175);
        p.fillPath(closedSmooth(farReef), PAL.waterDeep, 0.36);
        p.fillPath(closedSmooth(midReef), PAL.prussian, 0.54);
        p.fillPath(closedSmooth(nearReef), PAL.prussianDk, 0.44);
        p.moonRim(midReef.slice(0, -2), { closed: false, up: true, widthPx: 0.68 });
        // 3. RIGHT VOLCANIC REEF CLIFF & SUNKEN 19TH-CENTURY EXPEDITION FRIGATE STERN CASTLE!
        const rightCliff = [
            [1780, BLEED.y0],
            [BLEED.x1, BLEED.y0],
            [BLEED.x1, BLEED.y1],
            [1460, BLEED.y1],
            [1580, 1340],
            [1740, 1090],
            [1940, 860],
            [2040, 520],
            [1960, 220],
            [1840, 40],
        ];
        p.fillPath(closedSmooth(rightCliff), PAL.prussian, 0.94);
        // Sunken Frigate Broken Mizzen Mast, Yardarm & Trailing Rigging Shrouds rising into upper-right pelagic rays!
        const rigB = new PathBatcher();
        rigB.quad("mast", [1765, 325], [1792, 322], [1732, -240], [1710, -240], { fill: PAL.barkDk, fillOpacity: 0.92 });
        rigB.quad("yard", [1485, 85], [1985, 20], [1988, 34], [1488, 99], { fill: PAL.barkDk, fillOpacity: 0.9 });
        for (let k = 0; k < 5; k++) {
            rigB.line("shroud", 1742, -80 + k * 28, 1280 + k * 145, 340 - k * 12, {
                stroke: PAL.ink,
                strokeWidth: 0.52,
                strokeOpacity: 0.55,
                nonScaling: "hatch",
            });
        }
        rigB.flush(p);
        // Sunken Frigate Carved Oak Stern Castle & Copper-Sheathed Lower Hull (`x = 1045..2560, y = 305..1170`)
        const sternTopL = [1065, 365];
        const sternTopMid = [1480, 315];
        const sternTopR = [2265, 295];
        const sternBotL = [1105, 825];
        const sternBotR = [2295, 835];
        const keelL = [1165, 975];
        const keelR = [2420, 1185];
        // Main dark waterlogged oak stern transom wall
        const transomPts = [
            sternTopL,
            [1270, 332],
            sternTopMid,
            [1720, 312],
            sternTopR,
            [BLEED.x1, 275],
            [BLEED.x1, 1185],
            keelR,
            [1580, 1085],
            keelL,
            sternBotL,
        ];
        p.fillPath(closedSmooth(transomPts), timberGrad, 0.98);
        // PathBatcher for fine oak planking courses, copper-sheathed lower bilge plates + rivets,
        // carved upper taffrail pediment, turned stern-walk balcony balusters & flanking quarter-gallery windows!
        const shipB = new PathBatcher();
        // Copper-sheathed lower hull band (below y = 830) with aged verdigris patina & staggered copper plates!
        const copperQuad = [sternBotL, sternBotR, keelR, keelL];
        shipB.quad("copperBase", copperQuad[0], copperQuad[1], copperQuad[2], copperQuad[3], { fill: PAL.celadonDk, fillOpacity: 0.68 });
        for (let r = 0; r < 4; r++) {
            const v0 = r / 4;
            const v1 = (r + 1) / 4;
            const a = lerp(copperQuad[0], copperQuad[3], v0);
            const b = lerp(copperQuad[1], copperQuad[2], v0);
            shipB.line("cSeam", a[0], a[1], b[0], b[1], { stroke: PAL.ink, strokeWidth: 0.46, strokeOpacity: 0.62, nonScaling: "hatch" });
            for (let c = 0; c < 14; c++) {
                const u = (c + (r % 2) * 0.5) / 14;
                if (u > 0.02 && u < 0.98) {
                    const p0 = bilerp(copperQuad[0], copperQuad[1], copperQuad[2], copperQuad[3], u, v0);
                    const p1 = bilerp(copperQuad[0], copperQuad[1], copperQuad[2], copperQuad[3], u, v1);
                    shipB.line("cSeam", p0[0], p0[1], p1[0], p1[1], { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.56, nonScaling: "hatch" });
                    shipB.circle("cRivet", p0[0] + 5, p0[1] + 5, 1.4, { fill: PAL.brassLt, fillOpacity: 0.55 });
                }
            }
        }
        // Horizontal waterlogged oak hull strake planks & wood-grain fibers above the copper sheathing
        for (let row = 0; row < 14; row++) {
            const yy = 358 + row * 34;
            shipB.line("plank", 1075, yy, 2320, yy - 8, { stroke: PAL.ink, strokeWidth: 0.45, strokeOpacity: 0.52, nonScaling: "hatch" });
        }
        // Ornate Carved Gilded-Brass Upper Taffrail Cornice & Pediment Arch crowning the stern gallery!
        const taffrail = sample(quad([1060, 392], [wCx, 336], [2185, 368]), 20);
        const taffBot = taffrail.map(([x, y]) => [x, y + 26]);
        shipB.addPath("taff", polyPath([...taffrail, ...[...taffBot].reverse()]), { fill: PAL.brassDk, fillOpacity: 0.96 });
        shipB.addPath("taffHi", openPoly(taffrail), { stroke: PAL.brassLt, strokeWidth: 1.05, strokeOpacity: 0.82, nonScaling: "contour" });
        // Carved classical frieze triglyphs & decorative brass rosette bosses along the stern taffrail!
        for (let i = 1; i < taffrail.length - 1; i++) {
            const pt = lerp(taffrail[i], taffBot[i], 0.5);
            shipB.circle("boss", pt[0], pt[1], 4.2, { fill: PAL.brassLt, fillOpacity: 0.84 });
        }
        // Carved Gilded-Timber 19th-Century Expedition Frigate Coat-of-Arms Scroll, Compass Crest & Braided Rope Molding!
        // Braided twist-rope molding running along the entire curved stern taffrail!
        for (let i = 0; i < taffrail.length - 1; i++) {
            const a = lerp(taffrail[i], taffBot[i], 0.2);
            const b = lerp(taffrail[i + 1], taffBot[i + 1], 0.8);
            shipB.line("rope", a[0], a[1], b[0], b[1], { stroke: PAL.brassLt, strokeWidth: 0.55, strokeOpacity: 0.72, nonScaling: "hatch" });
        }
        // Sweeping Baroque carved acanthus & ribbon scrolls flanking the central stern coat-of-arms (`wCx, 392`)!
        for (const side of [-1, 1]) {
            const scrollPts = sample(cubic([wCx + side * 42, 392], [wCx + side * 98, 368], [wCx + side * 145, 412], [wCx + side * 192, 386]), 16);
            shipB.addPath("scrollRib", openPoly(scrollPts), { stroke: PAL.brassLt, strokeWidth: 1.45, strokeOpacity: 0.88, nonScaling: "contour" });
            const innerVol = sample(quad([wCx + side * 66, 396], [wCx + side * 108, 418], [wCx + side * 136, 392]), 10);
            shipB.addPath("scrollSub", openPoly(innerVol), { stroke: PAL.brass, strokeWidth: 0.9, strokeOpacity: 0.85, nonScaling: "contour" });
            shipB.circle("scrollBoss", wCx + side * 104, 392, 5.5, { fill: PAL.brassLt, fillOpacity: 0.88 });
            shipB.circle("scrollBoss", wCx + side * 158, 398, 4.2, { fill: PAL.brass, fillOpacity: 0.9 });
        }
        // Carved Heraldic Shield & Compass-Rose Expedition Crest (replaces plain oval sticker!)
        const shieldPts = [
            [wCx - 32, 368],
            [wCx + 32, 368],
            [wCx + 30, 394],
            [wCx + 18, 410],
            [wCx, 420],
            [wCx - 18, 410],
            [wCx - 30, 394],
        ];
        shipB.addPath("shieldOut", polyPath(shieldPts), { fill: PAL.brass, fillOpacity: 0.98 });
        shipB.addPath("shieldIn", polyPath([
            [wCx - 24, 374],
            [wCx + 24, 374],
            [wCx + 22, 392],
            [wCx + 12, 404],
            [wCx, 412],
            [wCx - 12, 404],
            [wCx - 22, 392],
        ]), { fill: PAL.prussian, fillOpacity: 0.96 });
        // Gilded 8-point mariner's compass rose carved inside the expedition shield!
        for (let k = 0; k < 8; k++) {
            const a = (k / 8) * TAU;
            const rr = k % 2 === 0 ? 15 : 9;
            shipB.line("crestStar", wCx, 392, wCx + Math.cos(a) * rr, 392 + Math.sin(a) * rr, {
                stroke: PAL.brassLt,
                strokeWidth: k % 2 === 0 ? 0.95 : 0.55,
                nonScaling: "contour",
            });
        }
        // Carved crown crest resting atop the heraldic shield
        shipB.addPath("crown", `M${f(wCx - 18)} 368L${f(wCx - 22)} 356L${f(wCx - 8)} 362L${f(wCx)} 351L${f(wCx + 8)} 362L${f(wCx + 22)} 356L${f(wCx + 18)} 368Z`, { fill: PAL.brassLt, fillOpacity: 0.96 });
        shipB.addPath("shieldRim", polyPath(shieldPts), { stroke: PAL.ink, strokeWidth: 0.72, nonScaling: "contour" });
        // Flanking Carved Victorian Leaded-Glass Quarter-Gallery Windows showing dimly lit S15-coherent cabin bookshelves,
        // specimen jars & nautical charts behind translucent diagonal-glinted leaded glass!
        // Split into `winInnerB` (frames + interiors) & `winGlassB` (seawater veil + specular glints + bronze muntins)
        // so glass reflections & muntins ALWAYS render cleanly above every interior book, cloche, chart & globe!
        const winInnerB = new PathBatcher();
        const winGlassB = new PathBatcher();
        const drawSternSideWindow = (x0, y0, w, h, cols, rows, warm, kind) => {
            winInnerB.rect("winFrame", x0 - 7, y0 - 7, w + 14, h + 14, { fill: PAL.brassDk, fillOpacity: 0.96 });
            // Deep warm cabin interior backdrop (coherent with S15 Victorian Naturalist's Study!)
            winInnerB.rect("cabBg", x0, y0, w, h, {
                fill: PAL.umberDk,
                fillOpacity: 0.96,
            });
            // Soft interior study lamp glow (warmer in book/chart bays, dimmer velvet amber in specimen bay)
            winInnerB.rect(warm ? "cabGlowHi" : "cabGlowLo", x0, y0, w, h, {
                fill: warm ? PAL.windowLit : PAL.ochre,
                fillOpacity: warm ? 0.36 : 0.16,
            });
            // Dimly lit interior Victorian study contents glimpsed through the flanking windows!
            if (kind === "books") {
                // 4 shelves of tiny leather-bound folios & binders matching S15's left bookcase!
                const shN = 4;
                const shH = h / shN;
                const spineCols = [PAL.cinnabar, PAL.prussian, PAL.ochre, PAL.umber, PAL.paperStone, PAL.sage];
                for (let s = 0; s < shN; s++) {
                    const syBot = y0 + (s + 1) * shH - 3;
                    winInnerB.rect("cabShelf", x0 + 2, syBot, w - 4, 3.5, { fill: PAL.barkDk, fillOpacity: 0.92 });
                    let bx = x0 + 4;
                    while (bx < x0 + w - 8) {
                        const bw = rand(p.r, 4.5, 9.5);
                        const bh = shH * rand(p.r, 0.62, 0.84);
                        const col = spineCols[Math.floor(rand(p.r, 0, spineCols.length))];
                        winInnerB.rect(`sp_${col}`, bx, syBot - bh, bw - 0.8, bh, { fill: col, fillOpacity: 0.74 });
                        bx += bw;
                    }
                }
            }
            else if (kind === "specimens") {
                // Illuminated naturalist vitrine shelves: tall glass cloche with coral sprig, stacked specimen folios,
                // nautilus shell on brass stand, mineral geode & specimen drawers (coherent with S15 right side!)
                const sy1 = y0 + h * 0.34;
                const sy2 = y0 + h * 0.68;
                const sy3 = y0 + h * 0.94;
                for (const sy of [sy1, sy2, sy3]) {
                    winInnerB.rect("cabShelf", x0 + 2, sy, w - 4, 4, { fill: PAL.barkDk, fillOpacity: 0.92 });
                }
                // Shelf 1: tall domed glass bell-jar cloche (left) + branching coral inside + stacked field journals (right)
                winInnerB.addPath("cabCloche", `M${f(x0 + 18)} ${f(sy1)}L${f(x0 + 18)} ${f(sy1 - 24)}Q${f(x0 + 34)} ${f(sy1 - 44)} ${f(x0 + 50)} ${f(sy1 - 24)}L${f(x0 + 50)} ${f(sy1)}Z`, { fill: PAL.celadonLt, fillOpacity: 0.3 });
                winInnerB.addPath("cabCoral", `M${f(x0 + 34)} ${f(sy1 - 2)}L${f(x0 + 34)} ${f(sy1 - 22)}M${f(x0 + 34)} ${f(sy1 - 12)}L${f(x0 + 25)} ${f(sy1 - 21)}M${f(x0 + 34)} ${f(sy1 - 16)}L${f(x0 + 43)} ${f(sy1 - 24)}`, { stroke: PAL.cinnabarLt, strokeWidth: 0.9, strokeOpacity: 0.78, nonScaling: "contour" });
                winInnerB.rect("cabFolio1", x0 + 66, sy1 - 9, 44, 8, { fill: PAL.cinnabar, fillOpacity: 0.74 });
                winInnerB.rect("cabFolio2", x0 + 70, sy1 - 18, 38, 8, { fill: PAL.ochre, fillOpacity: 0.76 });
                winInnerB.rect("cabFolio3", x0 + 75, sy1 - 25, 30, 6, { fill: PAL.paperStone, fillOpacity: 0.72 });
                // Shelf 2: brass-pedestal nautilus shell (left) + glowing crystal cluster (center) + specimen flask (right)
                winInnerB.rect("cabStand", x0 + 28, sy2 - 10, 4, 10, { fill: PAL.brass, fillOpacity: 0.86 });
                winInnerB.circle("cabShell", x0 + 30, sy2 - 19, 10, { fill: PAL.paperWarm, fillOpacity: 0.72 });
                winInnerB.circle("cabShellIn", x0 + 32, sy2 - 19, 4.5, { fill: PAL.ochre, fillOpacity: 0.76 });
                winInnerB.addPath("cabCryst", polyPath([[x0 + 58, sy2], [x0 + 64, sy2 - 22], [x0 + 72, sy2 - 16], [x0 + 77, sy2 - 28], [x0 + 84, sy2]]), { fill: PAL.celadonLt, fillOpacity: 0.66 });
                winInnerB.rect("cabFlask", x0 + 96, sy2 - 26, 16, 26, { fill: PAL.brassLt, fillOpacity: 0.36 });
                winInnerB.rect("cabFlaskLiq", x0 + 98, sy2 - 16, 12, 14, { fill: PAL.ochreLt, fillOpacity: 0.62 });
                // Shelf 3: specimen collection drawer fronts with brass pulls
                for (let d = 0; d < 2; d++) {
                    const dx = x0 + 10 + d * (w * 0.46);
                    winInnerB.rect("cabDrawer", dx, sy3 - 26, w * 0.4, 24, { fill: PAL.umber, fillOpacity: 0.86 });
                    winInnerB.circle("cabPull", dx + w * 0.2, sy3 - 14, 2.6, { fill: PAL.brassLt, fillOpacity: 0.92 });
                }
            }
            else {
                // Framed maritime charts, hanging brass globe & warm glowing cabin lamp silhouette!
                winInnerB.rect("cabChart", x0 + 14, y0 + 24, w - 28, h * 0.38, { fill: PAL.paperWarm, fillOpacity: 0.56 });
                winInnerB.line("cabMapLine", x0 + 22, y0 + 52, x0 + w - 22, y0 + 68, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.54, nonScaling: "hatch" });
                winInnerB.circle("cabGlobe", x0 + w * 0.5, y0 + h * 0.74, 22, { fill: PAL.ochre, fillOpacity: 0.66 });
                winInnerB.rect("cabDesk", x0 + 2, y0 + h * 0.84, w - 4, h * 0.16, { fill: PAL.umberDk, fillOpacity: 0.92 });
            }
            // Translucent seawater glass sheen + diagonal specular glass reflection streaks!
            winGlassB.rect(warm ? "glassVeilWarm" : "glassVeilCool", x0, y0, w, h, { fill: PAL.water, fillOpacity: warm ? 0.22 : 0.28 });
            winGlassB.quad("winSpec", [x0 + w * 0.12, y0], [x0 + w * 0.3, y0], [x0 + w * 0.74, y0 + h], [x0 + w * 0.56, y0 + h], {
                fill: PAL.waterSpray,
                fillOpacity: 0.2,
            });
            winGlassB.quad("winSpec2", [x0 + w * 0.4, y0], [x0 + w * 0.47, y0], [x0 + w * 0.88, y0 + h], [x0 + w * 0.81, y0 + h], {
                fill: PAL.waterSpray,
                fillOpacity: 0.13,
            });
            // Crisp leaded-glass architectural muntin grid (`0.68px` dark bronze bars)
            for (let c = 1; c < cols; c++) {
                const mx = x0 + (w * c) / cols;
                winGlassB.line("muntin", mx, y0, mx, y0 + h, { stroke: PAL.umberDk, strokeWidth: 0.68, strokeOpacity: 0.92, nonScaling: "contour" });
            }
            for (let r = 1; r < rows; r++) {
                const my = y0 + (h * r) / rows;
                winGlassB.line("muntin", x0, my, x0 + w, my, { stroke: PAL.umberDk, strokeWidth: 0.68, strokeOpacity: 0.92, nonScaling: "contour" });
            }
            winGlassB.rect("winOut", x0, y0, w, h, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.88, nonScaling: "contour" });
        };
        drawSternSideWindow(1122, wY0 + 10, 108, wH - 18, 3, 5, true, "books");
        drawSternSideWindow(1756, wY0 + 8, 128, wH - 16, 4, 5, false, "specimens");
        drawSternSideWindow(1922, wY0 + 12, 126, wH - 22, 4, 5, true, "charts");
        // Fluted Gilded-Brass Corinthian Transom Pilasters separating every stern-gallery window bay!
        for (const px of [1084, 1244, 1718, 1894, 2064]) {
            shipB.rect("pil", px, wY0 - 16, 22, wH + 28, { fill: PAL.brass, fillOpacity: 0.96 });
            shipB.rect("pilSh", px + 13, wY0 - 16, 9, wH + 28, { fill: PAL.brassDk, fillOpacity: 0.78 });
            shipB.rect("pilCap", px - 5, wY0 - 22, 32, 10, { fill: PAL.brassLt, fillOpacity: 0.94 });
            shipB.rect("pilBase", px - 4, wY1 + 8, 30, 10, { fill: PAL.brassDk, fillOpacity: 0.96 });
            for (const fx of [5, 11, 17]) {
                shipB.line("pilFlute", px + fx, wY0 - 10, px + fx, wY1 + 6, { stroke: PAL.ink, strokeWidth: 0.38, strokeOpacity: 0.56, nonScaling: "hatch" });
            }
        }
        // Carved Stern-Walk Balcony Rail & Turned Solid-Brass Balusters (`fill` split cleanly from `nonScaling` stroke!)
        const balY0 = wY1 + 20;
        const balY1 = wY1 + 68;
        shipB.rect("balBack", 1072, balY0 + 9, 1045, balY1 - balY0 - 9, { fill: PAL.barkDk, fillOpacity: 0.84 });
        shipB.rect("balTop", 1072, balY0, 1045, 9, { fill: PAL.brass, fillOpacity: 0.96 });
        shipB.rect("balBot", 1072, balY1, 1045, 12, { fill: PAL.brassDk, fillOpacity: 0.98 });
        const balMidY = balY0 + (balY1 - balY0) * 0.55;
        for (let bx = 1090; bx <= 2095; bx += 22) {
            const bD = `M${f(bx - 3)} ${f(balY0 + 9)}H${f(bx + 3)}L${f(bx + 5)} ${f(balMidY)}L${f(bx + 3)} ${f(balY1)}H${f(bx - 3)}L${f(bx - 5)} ${f(balMidY)}Z`;
            shipB.addPath("balFill", bD, { fill: PAL.brass, fillOpacity: 0.94 });
            shipB.line("balHi", bx - 1.5, balY0 + 11, bx - 1.5, balY1 - 2, { stroke: PAL.brassLt, strokeWidth: 0.5, strokeOpacity: 0.72, nonScaling: "hatch" });
        }
        // Grand Wrought-Brass Frigate Poop-Deck Stern Lantern mounted atop the taffrail at `(1845, 295)`!
        const slX = 1845;
        const slY = 285;
        shipB.line("slPost", slX, 345, slX, slY + 26, { stroke: PAL.brassDk, strokeWidth: 1.6, nonScaling: "contour" });
        shipB.quad("slGlass", [slX - 22, slY - 22], [slX + 22, slY - 22], [slX + 14, slY + 24], [slX - 14, slY + 24], { fill: PAL.lantern, fillOpacity: 0.88 });
        shipB.addPath("slCap", `M${f(slX - 28)} ${f(slY - 22)}L${f(slX)} ${f(slY - 46)}L${f(slX + 28)} ${f(slY - 22)}Z`, { fill: PAL.brassDk, fillOpacity: 0.96 });
        shipB.line("slBar", slX - 8, slY - 22, slX - 5, slY + 24, { stroke: PAL.ink, strokeWidth: 0.65, nonScaling: "contour" });
        shipB.line("slBar", slX + 8, slY - 22, slX + 5, slY + 24, { stroke: PAL.ink, strokeWidth: 0.65, nonScaling: "contour" });
        // Heavy iron anchor chain & brass hawsepipe dropping from the stern quarter down to the reef bed
        shipB.addPath("hawseFill", ellipsePath(1112, 650, 18, 13), { fill: PAL.brassDk, fillOpacity: 0.96 });
        shipB.addPath("hawseHole", ellipsePath(1112, 650, 10, 7), { fill: PAL.prussianDk, fillOpacity: 0.96 });
        shipB.addPath("hawseRim", ellipsePath(1112, 650, 18, 13), { stroke: PAL.ink, strokeWidth: 0.78, nonScaling: "contour" });
        const chainPts = sample(cubic([1112, 654], [1082, 855], [1128, 1110], [1222, 1345]), 30);
        for (let i = 0; i + 1 < chainPts.length; i++) {
            const m = lerp(chainPts[i], chainPts[i + 1], 0.5);
            shipB.addPath("chain", ellipsePath(m[0], m[1], i % 2 === 0 ? 7.0 : 4.0, 10.5), { stroke: PAL.ink, strokeWidth: 1.2, strokeOpacity: 0.82, nonScaling: "contour" });
        }
        shipB.flush(p);
        winInnerB.flush(p);
        winGlassB.flush(p);
        // Subtle warm nocturnal glow radiating from the sunken frigate's stern lantern & quarter-gallery cabins!
        p.layer("var(--z-halo-op)", () => {
            const sternGlow = p.radialGrad("stern-lamp", slX, slY, 175, [
                [0, PAL.lanternCore, 0.5],
                [0.32, PAL.lantern, 0.24],
                [1, PAL.lanternHalo, 0.0],
            ]);
            p.fillPath(circlePath(slX, slY, 175), sternGlow, 1);
        });
        // Jagged volcanic rock shelf lapping over the frigate's lower right bilge
        const rockOverHull = [
            [1580, 1125],
            [1840, 965],
            [2120, 815],
            [2420, 675],
            [BLEED.x1, 580],
            [BLEED.x1, BLEED.y1],
            [1420, BLEED.y1],
        ];
        p.fillPath(closedSmooth(rockOverHull), PAL.prussianDk, 0.94);
        p.moonRim(rockOverHull.slice(0, 5), { closed: false, up: true, widthPx: 0.82 });
        // 4. LEFT VOLCANIC BLUFF & PAINTERLY SANDY ABYSSAL REEF FLOOR + LIQUID CAUSTICS
        const leftBluff = [
            [BLEED.x0, BLEED.y0],
            [330, BLEED.y0],
            [205, 260],
            [160, 590],
            [225, 925],
            [390, 1185],
            [540, 1345],
            [460, BLEED.y1],
            [BLEED.x0, BLEED.y1],
        ];
        p.fillPath(closedSmooth(leftBluff), PAL.prussian, 0.94);
        p.fillPath(closedSmooth([[BLEED.x0, BLEED.y0], [165, BLEED.y0], [120, 620], [210, 1220], [BLEED.x0, BLEED.y1]]), PAL.prussianDk, 0.56);
        p.moonRim(leftBluff.slice(1, 7), { closed: false, widthPx: 0.8 });
        const sandFloor = [
            [BLEED.x0, 1225],
            [310, 1195],
            [685, 1265],
            [1080, 1315],
            [1485, 1260],
            [1880, 1185],
            [BLEED.x1, 1220],
            [BLEED.x1, BLEED.y1],
            [BLEED.x0, BLEED.y1],
        ];
        p.fillPath(closedSmooth(sandFloor), PAL.paperStone, 0.92);
        p.fillPath(closedSmooth([[BLEED.x0, 1310], [480, 1295], [1080, 1365], [1680, 1295], [BLEED.x1, 1315], [BLEED.x1, BLEED.y1], [BLEED.x0, BLEED.y1]]), PAL.waterDeep, 0.46);
        p.fillPath(closedSmooth([[BLEED.x0, 1465], [720, 1445], [1560, 1470], [BLEED.x1, 1440], [BLEED.x1, BLEED.y1], [BLEED.x0, BLEED.y1]]), PAL.prussianDk, 0.44);
        // Organic wavy connected water-caustic ribbons dancing across the seabed
        let caustics = "";
        let caustN = 0;
        for (let row = 0; row < 6; row++) {
            const baseY = 1238 + row * 68;
            let wave = "";
            let prevX = -160;
            let prevY = baseY + rand(p.r, -12, 12);
            wave += `M${f(prevX)} ${f(prevY)}`;
            for (let col = 0; col < 18; col++) {
                const nx = -160 + (col + 1) * 165 + rand(p.r, -28, 28);
                const ny = baseY + Math.sin(col * 1.4 + row * 1.9) * 16 + rand(p.r, -8, 8);
                const mx = (prevX + nx) * 0.5;
                const my = (prevY + ny) * 0.5 + (col % 2 === 0 ? -14 : 14);
                wave += `Q${f(mx)} ${f(my)} ${f(nx)} ${f(ny)}`;
                if (row < 5 && (col + row) % 2 === 0) {
                    const by = baseY + 68 + rand(p.r, -10, 10);
                    const bx = mx + rand(p.r, -24, 24);
                    caustics += `M${f(mx)} ${f(my)}Q${f((mx + bx) * 0.5 + 14)} ${f((my + by) * 0.5)} ${f(bx)} ${f(by)}`;
                    caustN++;
                }
                prevX = nx;
                prevY = ny;
            }
            caustics += wave;
            caustN++;
        }
        p.burin(caustics, PAL.waterSpray, 0.72, 0.34, caustN, "hatch");
        // Lush outline-free dry-brush sea-moss, algae & coral sponge gardens
        p.dryBrushFoliage([
            { cx: 235, cy: 1215, rx: 145, ry: 52, density: 1.15 },
            { cx: 565, cy: 1295, rx: 165, ry: 48, density: 1.1 },
            { cx: 920, cy: 1345, rx: 145, ry: 46, density: 1.0 },
            { cx: 1265, cy: 1320, rx: 115, ry: 44, density: 1.0 },
            { cx: 1465, cy: 1290, rx: 175, ry: 54, density: 1.1 },
            { cx: 1920, cy: 1175, rx: 165, ry: 64, density: 1.15 },
            { cx: 2210, cy: 1265, rx: 180, ry: 62, density: 1.05 },
            { cx: 1920, cy: 915, rx: 125, ry: 56, density: 0.95 },
        ], { dark: PAL.sageDk, mid: PAL.malachite, light: PAL.celadonLt, accent: PAL.cinnabarLt }, { dabSize: 12, opacity: 0.9, accentChance: 0.09 });
        // 5. HYPER-DETAILED VICTORIAN BRASS BATHYSPHERE / DIVING BELL (`cx = 625, cy = 615`, data-anim="sway")!
        const bellCx = 625;
        const bellCy = 615;
        p.animGroup({ kind: "sway", cx: bellCx, cy: -220, ampDeg: 1.6, freq: 0.62, phase: 0.5 }, () => {
            p.layer("var(--z-halo-op)", () => {
                const coneR = [[bellCx + 56, bellCy + 86], [bellCx + 80, bellCy + 60], [1485, 1345], [965, 1465]];
                const coneL = [[bellCx - 56, bellCy + 86], [bellCx - 80, bellCy + 60], [-45, 1385], [385, 1465]];
                p.fillPath(polyPath(coneR), searchlightGrad, 0.8);
                p.fillPath(polyPath(coneL), searchlightGrad, 0.54);
            });
            p.layer("var(--z-lume-op)", () => {
                p.animGroup({ kind: "pulse", baseOp: 0.86, ampOp: 0.14, freq: 1.9, phase: 0.3 }, () => {
                    const bGlow = p.radialGrad("bell-glow", bellCx, bellCy + 20, 200, [
                        [0, PAL.lanternCore, 0.32],
                        [0.45, PAL.lantern, 0.18],
                        [1, PAL.lanternHalo, 0.0],
                    ]);
                    p.fillPath(circlePath(bellCx, bellCy + 20, 200), bGlow, 1);
                    p.fillPath(polyPath([[bellCx + 60, bellCy + 82], [bellCx + 76, bellCy + 64], [1340, 1280], [1045, 1365]]), PAL.lantern, 0.24);
                });
            });
            p.burinContour(`M${f(bellCx)} ${BLEED.y0}V${f(bellCy - 128)}`, PAL.ink, 1.35, 0.88, 1);
            const hose = sample(cubic([bellCx - 40, BLEED.y0], [bellCx - 82, 130], [bellCx - 16, 330], [bellCx - 30, bellCy - 106]), 14);
            p.pressuredRibbon(hose, 4.8, PAL.umberDk, 0.86, 0.3);
            const bellBody = [
                [bellCx - 104, bellCy + 102],
                [bellCx - 92, bellCy - 24],
                [bellCx - 70, bellCy - 90],
                [bellCx - 30, bellCy - 120],
                [bellCx + 30, bellCy - 120],
                [bellCx + 70, bellCy - 90],
                [bellCx + 92, bellCy - 24],
                [bellCx + 104, bellCy + 102],
            ];
            p.doubleGlaze(bellBody, PAL.brass, PAL.brassDk, {
                knockout: false,
                smooth: true,
                washOpacity: 0.96,
                deepOpacity: 0.46,
                toneFn: linearTone([bellCx - 96, bellCy - 60], [bellCx + 96, bellCy + 82], 0.1, 0.8),
                hatchAngleRad: rad(88),
                hatchSpacing: 10,
                thinPx: 0.56,
                thickPx: 1.02,
            });
            // Micro-craft PathBatcher details on the bathysphere: riveted hull meridian seams, copper oxygen piping, bolted viewports!
            const bb = new PathBatcher();
            bb.addPath("hi", closedSmooth([
                [bellCx - 70, bellCy + 86],
                [bellCx - 62, bellCy - 22],
                [bellCx - 44, bellCy - 78],
                [bellCx - 26, bellCy - 76],
                [bellCx - 40, bellCy - 18],
                [bellCx - 46, bellCy + 86],
            ]), { fill: PAL.brassLt, fillOpacity: 0.48 });
            // Riveted horizontal hull band & vertical meridian rivets
            bb.line("seam", bellCx - 94, bellCy - 26, bellCx + 94, bellCy - 26, { stroke: PAL.ink, strokeWidth: 0.65, nonScaling: "contour" });
            for (let rx = -84; rx <= 84; rx += 14) {
                bb.circle("riv", bellCx + rx, bellCy - 31, 1.8, { fill: PAL.brassLt });
                bb.circle("riv", bellCx + rx, bellCy + 88, 1.8, { fill: PAL.brassLt });
            }
            // Skirt + top valve manifold + copper pressure tube
            bb.quad("skirt", [bellCx - 118, bellCy + 96], [bellCx + 118, bellCy + 96], [bellCx + 124, bellCy + 122], [bellCx - 124, bellCy + 122], { fill: PAL.slateDk, fillOpacity: 0.96 });
            bb.quad("brass", [bellCx - 24, bellCy - 132], [bellCx + 24, bellCy - 132], [bellCx + 30, bellCy - 112], [bellCx - 30, bellCy - 112], { fill: PAL.brassDk, fillOpacity: 0.96 });
            bb.circle("shackle", bellCx, bellCy - 140, 15, { fill: "none", stroke: PAL.brass, strokeWidth: 1.3, nonScaling: "contour" });
            for (const [vx, vy, rx, ry] of [
                [bellCx, bellCy + 6, 32, 34],
                [bellCx - 64, bellCy + 12, 16, 26],
                [bellCx + 64, bellCy + 12, 16, 26],
            ]) {
                bb.addPath("vpOutFill", ellipsePath(vx, vy, rx + 9, ry + 9), { fill: PAL.brassDk, fillOpacity: 0.96 });
                bb.addPath("vpMidFill", ellipsePath(vx, vy, rx + 5, ry + 5), { fill: PAL.brassLt, fillOpacity: 0.88 });
                bb.addPath("vpGlassFill", ellipsePath(vx, vy, rx, ry), { fill: PAL.lantern, fillOpacity: 0.96 });
                bb.addPath("vpCore", ellipsePath(vx - rx * 0.16, vy - ry * 0.16, rx * 0.6, ry * 0.6), { fill: PAL.lanternCore, fillOpacity: 0.9 });
                bb.addPath("vpRim", ellipsePath(vx, vy, rx + 9, ry + 9) + ellipsePath(vx, vy, rx, ry), { stroke: PAL.ink, strokeWidth: 0.72, nonScaling: "contour" });
            }
            bb.circle("diver", bellCx + 3, bellCy + 1, 10, { fill: PAL.umberDk, fillOpacity: 0.78 });
            bb.quad("diver", [bellCx - 13, bellCy + 32], [bellCx - 7, bellCy + 13], [bellCx + 14, bellCy + 13], [bellCx + 18, bellCy + 32], { fill: PAL.umberDk, fillOpacity: 0.78 });
            for (const side of [-1, 1]) {
                bb.circle("projFill", bellCx + side * 68, bellCy + 72, 15, { fill: PAL.brassDk, fillOpacity: 0.96 });
                bb.circle("projRim", bellCx + side * 68, bellCy + 72, 15, { stroke: PAL.ink, strokeWidth: 0.78, nonScaling: "contour" });
                bb.circle("projCore", bellCx + side * 74, bellCy + 76, 9.5, { fill: PAL.lanternCore, fillOpacity: 0.96 });
            }
            bb.flush(p);
            p.moonRim(bellBody, { closed: true, widthPx: 0.9 });
        });
        p.animGroup({ kind: "drift", ampX: 12, ampY: -46, freq: 0.82, phase: 0.7 }, () => {
            let bubFill = "";
            let bubRim = "";
            for (let i = 0; i < 24; i++) {
                const u = i / 24;
                const bx = bellCx + 18 + Math.sin(u * 12) * 28 + rand(p.r, -12, 12);
                const by = bellCy - 128 - u * 660;
                const br = rand(p.r, 3.0, 9.2) * (0.65 + u * 0.55);
                bubFill += circlePath(bx, by, br);
                bubRim += circlePath(bx - br * 0.28, by - br * 0.28, br * 0.24);
            }
            p.fillPath(bubFill, PAL.waterSpray, 0.34);
            p.burinContour(bubFill, PAL.waterSpray, 0.65, 0.68, 24);
            p.fillPath(bubRim, PAL.lanternCore, 0.76);
        });
        // 6. LUSH MONTEREY BAY MACROCYSTIS GIANT KELP FOREST (9 undulating swaying columns!)
        const drawKelpFrond = (baseX, baseY, h, side, phase, scale = 1, toneShift = 0, isBack = false) => {
            p.animGroup({ kind: "sway", cx: baseX, cy: baseY, ampDeg: isBack ? 2.1 : 3.0, freq: isBack ? 0.72 : 0.88, phase }, () => {
                // More sinuous undulating Macrocystis stipe curving gracefully with the abyssal current!
                const spine = sample(cubic([baseX, baseY], [baseX + side * 105 * scale, baseY - h * 0.28], [baseX - side * 52 * scale, baseY - h * 0.64], [baseX + side * 128 * scale, baseY - h]), 34);
                p.calligraphicStroke(spine, 11.5 * scale, 7.2 * scale, 2.2 * scale, isBack ? PAL.prussian : PAL.sageDk, isBack ? 0.56 : 0.92);
                const kb = new PathBatcher();
                for (let i = 3; i < spine.length - 1; i++) {
                    const pt = spine[i];
                    const t = i / spine.length;
                    const prev = spine[i - 1];
                    const next = spine[Math.min(spine.length - 1, i + 1)];
                    const tangA = Math.atan2(next[1] - prev[1], next[0] - prev[0]);
                    const countAtNode = isBack ? 1 : i % 3 === 0 ? 2 : 1;
                    for (let dup = 0; dup < countAtNode; dup++) {
                        const bSide = dup === 1 ? -1 : i % 4 === 0 ? -1 : 1;
                        const env = 1.05 - t * 0.36;
                        const bLen = rand(p.r, 188, 278) * scale * env;
                        const bW = rand(p.r, 27, 42) * scale * env;
                        const sweepAng = bSide > 0
                            ? -rad(rand(p.r, 20, 44)) + (tangA + Math.PI * 0.5) * 0.25
                            : -Math.PI + rad(rand(p.r, 24, 48)) + (tangA + Math.PI * 0.5) * 0.2;
                        const ca = Math.cos(sweepAng);
                        const sa = Math.sin(sweepAng);
                        const nx = -sa;
                        const ny = ca;
                        const phaseW = i * 1.7 + dup * 2.3;
                        // True ruffled Macrocystis blade silhouette: 7 sinusoidal edge lobes along BOTH margins + wavy centerline!
                        const p0 = [pt[0] + ca * 14 * scale, pt[1] + sa * 14 * scale];
                        const lobes = 7;
                        const upperEdge = [p0];
                        const lowerEdge = [];
                        const centerPts = [pt];
                        const corrTop = [];
                        const corrBot = [];
                        for (let s = 1; s < lobes; s++) {
                            const u = s / lobes;
                            const envW = Math.sin(Math.pow(u, 0.72) * Math.PI);
                            // Sinuous centerline undulation + alternating ruffled margin scallops!
                            const spineWave = Math.sin(u * Math.PI * 2.4 + phaseW) * bW * 0.36;
                            const ruffleTop = (0.76 + 0.34 * Math.sin(s * 2.1 + phaseW)) * bW * envW;
                            const ruffleBot = (0.76 + 0.34 * Math.cos(s * 2.1 + phaseW + 0.7)) * bW * envW;
                            const cx = p0[0] + ca * bLen * u + nx * spineWave;
                            const cy = p0[1] + sa * bLen * u + ny * spineWave;
                            centerPts.push([cx, cy]);
                            upperEdge.push([cx + nx * ruffleTop, cy + ny * ruffleTop]);
                            lowerEdge.push([cx - nx * ruffleBot, cy - ny * ruffleBot]);
                            corrTop.push([cx + nx * ruffleTop * 0.48, cy + ny * ruffleTop * 0.48]);
                            corrBot.push([cx - nx * ruffleBot * 0.48, cy - ny * ruffleBot * 0.48]);
                        }
                        const tipWave = Math.sin(Math.PI * 2.4 + phaseW) * bW * 0.22;
                        const tip = [p0[0] + ca * bLen + nx * tipWave, p0[1] + sa * bLen + ny * tipWave];
                        centerPts.push(tip);
                        const bD = closedSmooth([...upperEdge, tip, ...lowerEdge.reverse()]);
                        if (isBack) {
                            kb.addPath("back", bD, { fill: PAL.celadonDk, fillOpacity: 0.46 });
                        }
                        else {
                            const tIdx = (i + dup + toneShift) % 4;
                            const cols = [PAL.malachite, PAL.sage, PAL.celadonDk, PAL.ochre];
                            const ops = [0.82, 0.8, 0.84, 0.66];
                            kb.addPath(`b${tIdx}`, bD, { fill: cols[tIdx], fillOpacity: ops[tIdx] });
                            if ((i + dup) % 2 === 0) {
                                kb.addPath("hi", closedSmooth([p0, upperEdge[1], upperEdge[2], upperEdge[3], centerPts[4], centerPts[2]]), {
                                    fill: PAL.ochreLt,
                                    fillOpacity: 0.26,
                                });
                            }
                            // Fine longitudinal wavy midrib + 2 corrugated Macrocystis blade ridges!
                            kb.addPath("vein", openPoly(centerPts), { stroke: PAL.vein, strokeWidth: 0.44, strokeOpacity: 0.64, nonScaling: "hatch" });
                            kb.addPath("corr", openPoly(corrTop) + openPoly(corrBot), {
                                stroke: PAL.celadonLt,
                                strokeWidth: 0.34,
                                strokeOpacity: 0.38,
                                nonScaling: "hatch",
                            });
                            const fx = pt[0] + ca * 10 * scale;
                            const fy = pt[1] + sa * 10 * scale;
                            const fr = 6.2 * scale * env;
                            kb.addPath("float", ellipsePath(fx, fy, fr * 1.15, fr * 0.85), { fill: PAL.ochreLt, fillOpacity: 0.92 });
                            kb.addPath("floatSh", ellipsePath(fx + 1.4, fy + 1.4, fr * 0.65, fr * 0.48), { fill: PAL.ochreDk, fillOpacity: 0.44 });
                        }
                    }
                }
                kb.flush(p);
            });
        };
        drawKelpFrond(145, 1720, 1480, 1, 0.7, 1.05, 2, true);
        drawKelpFrond(410, 1690, 1160, 1, 1.9, 0.94, 1, true);
        drawKelpFrond(965, 1680, 1080, 1, 2.7, 0.88, 0, true);
        drawKelpFrond(48, 1740, 1520, 1, 0.2, 1.12, 0, false);
        drawKelpFrond(235, 1700, 1340, 1, 1.3, 1.02, 1, false);
        drawKelpFrond(345, 1670, 960, 1, 2.5, 0.92, 3, false);
        drawKelpFrond(855, 1680, 920, 1, 0.8, 0.88, 1, false);
        drawKelpFrond(1055, 1700, 760, 1, 3.2, 0.82, 2, false);
        drawKelpFrond(2245, 1740, 1320, -1, 1.8, 1.06, 0, false);
        // 7. ERNST HAECKEL GORGONIA SEA-FANS, BRANCHING STAGHORN CORAL THICKETS & GROOVED BRAIN CORALS!
        const drawSeaFan = (cx, baseY, r, fill, rimCol) => {
            const levelNodes = [[], [], [], [], []];
            const fb = new PathBatcher();
            fb.addPath("hold", closedSmooth([[cx - r * 0.14, baseY + 6], [cx - r * 0.06, baseY - r * 0.07], [cx + r * 0.06, baseY - r * 0.07], [cx + r * 0.14, baseY + 6]]), { fill: rimCol, fillOpacity: 0.94 });
            const grow = (ox, oy, ang, len, depth) => {
                const ex = ox + Math.cos(ang) * len;
                const ey = oy + Math.sin(ang) * len;
                const bend = rand(p.r, -len * 0.16, len * 0.16);
                const mx = (ox + ex) * 0.5 - Math.sin(ang) * bend;
                const my = (oy + ey) * 0.5 + Math.cos(ang) * bend;
                const segD = `M${f(ox)} ${f(oy)}Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}`;
                fb.addPath(depth >= 2 ? "main" : "fine", segD, {
                    stroke: depth >= 2 ? rimCol : fill,
                    strokeWidth: depth >= 2 ? 1.55 : 0.95,
                    strokeOpacity: 0.94,
                    nonScaling: "contour",
                });
                levelNodes[depth].push([ex, ey]);
                if (depth <= 1) {
                    fb.addPath("polyp", `M${f(mx)} ${f(my)}h0.2M${f(ex)} ${f(ey)}h0.2`, {
                        stroke: PAL.petal,
                        strokeWidth: 1.25,
                        strokeOpacity: 0.84,
                        nonScaling: "contour",
                    });
                }
                if (depth > 0) {
                    const spread = depth === 3 ? 0.42 : depth === 2 ? 0.36 : 0.3;
                    grow(ex, ey, ang - spread + rand(p.r, -0.06, 0.06), len * rand(p.r, 0.74, 0.84), depth - 1);
                    grow(ex, ey, ang + spread + rand(p.r, -0.06, 0.06), len * rand(p.r, 0.74, 0.84), depth - 1);
                }
            };
            for (const [sa, slen] of [[-Math.PI * 0.5 - 0.56, r * 0.31], [-Math.PI * 0.5, r * 0.34], [-Math.PI * 0.5 + 0.56, r * 0.31]]) {
                grow(cx, baseY - r * 0.04, sa, slen, 3);
            }
            for (const depth of [0, 1, 2]) {
                const nodes = levelNodes[depth];
                const maxD = r * (depth === 0 ? 0.24 : depth === 1 ? 0.34 : 0.46);
                for (let i = 0; i + 1 < nodes.length; i++) {
                    const a = nodes[i];
                    const b = nodes[i + 1];
                    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
                    if (d > 8 && d < maxD) {
                        fb.addPath("mesh", `M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) * 0.5)} ${f((a[1] + b[1]) * 0.5 - d * 0.14)} ${f(b[0])} ${f(b[1])}`, {
                            stroke: fill,
                            strokeWidth: 0.55,
                            strokeOpacity: 0.72,
                            nonScaling: "hatch",
                        });
                    }
                }
            }
            fb.flush(p);
        };
        drawSeaFan(340, 1285, 205, PAL.cinnabarLt, PAL.cinnabar);
        drawSeaFan(655, 1365, 152, PAL.wisteriaLt, PAL.wisteria);
        drawSeaFan(1135, 1415, 165, PAL.ochreLt, PAL.ochre);
        drawSeaFan(1965, 1215, 195, PAL.cinnabarLt, PAL.cinnabar);
        drawSeaFan(1640, 1345, 138, PAL.celadonLt, PAL.celadon);
        // Branching pale Acropora staghorn coral thickets (`footers/worlds/deep/gen.ts` lineage!)
        const stagB = new PathBatcher();
        const growStag = (ox, oy, ang, len, w, depth, col) => {
            const ex = ox + Math.cos(ang) * len;
            const ey = oy + Math.sin(ang) * len;
            const mx = (ox + ex) * 0.5 + rand(p.r, -6, 6);
            const my = (oy + ey) * 0.5 + rand(p.r, -4, 4);
            stagB.addPath(col, `M${f(ox)} ${f(oy)}Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}`, {
                stroke: col,
                strokeWidth: Math.max(0.8, w),
                strokeOpacity: 0.9,
                nonScaling: "contour",
            });
            stagB.circle(`${col}Tip`, ex, ey, Math.max(2.2, w * 1.4), { fill: PAL.petal, fillOpacity: 0.86 });
            if (depth > 0) {
                growStag(ex, ey, ang - rand(p.r, 0.34, 0.58), len * rand(p.r, 0.64, 0.8), w * 0.72, depth - 1, col);
                growStag(ex, ey, ang + rand(p.r, 0.34, 0.58), len * rand(p.r, 0.64, 0.8), w * 0.72, depth - 1, col);
            }
        };
        for (const [sx, sy, sz, col] of [
            [810, 1355, 86, PAL.petalBlush],
            [1525, 1345, 92, PAL.ochreLt],
            [2125, 1295, 84, PAL.celadonLt],
        ]) {
            for (const a of [-Math.PI * 0.5 - 0.45, -Math.PI * 0.5, -Math.PI * 0.5 + 0.48]) {
                growStag(sx, sy, a + rand(p.r, -0.08, 0.08), sz * rand(p.r, 0.32, 0.4), 1.7, 3, col);
            }
        }
        stagB.flush(p);
        const drawBrainCoral = (cx, baseY, rx, ry, fill, deep) => {
            const dome = [
                [cx - rx, baseY],
                [cx - rx * 0.92, baseY - ry * 0.58],
                [cx - rx * 0.52, baseY - ry * 0.96],
                [cx, baseY - ry],
                [cx + rx * 0.54, baseY - ry * 0.94],
                [cx + rx * 0.92, baseY - ry * 0.55],
                [cx + rx, baseY],
            ];
            p.doubleGlaze(dome, fill, deep, { knockout: false, smooth: true, washOpacity: 0.92, deepOpacity: 0.42, thinPx: 0.5, thickPx: 0.88 });
            let grooves = "";
            let grN = 0;
            for (let i = 0; i < 4; i++) {
                const yy = baseY - ry * (0.2 + 0.19 * i);
                const half = rx * Math.sqrt(Math.max(0.05, 1 - ((baseY - yy) / ry) ** 2)) * 0.8;
                let seg = `M${f(cx - half)} ${f(yy)}`;
                for (let x = cx - half + 18, k = 0; x < cx + half; x += 18, k++) {
                    seg += `Q${f(x - 9)} ${f(yy + (k % 2 ? 7 : -7))} ${f(x)} ${f(yy)}`;
                    grN++;
                }
                grooves += seg;
            }
            p.burin(grooves, PAL.inkSepia, 0.72, 0.66, grN, "hatch");
        };
        drawBrainCoral(510, 1365, 88, 56, PAL.ochreLt, PAL.umber);
        drawBrainCoral(1375, 1390, 92, 58, PAL.celadon, PAL.celadonDk);
        drawBrainCoral(1795, 1295, 84, 52, PAL.wisteriaLt, PAL.wisteriaDk);
        // 8. TRANSLUCENT ERNST HAECKEL MEDUSA JELLYFISH (data-anim="bob")
        const drawMedusa = (cx, cy, r, phase, tint) => {
            p.animGroup({ kind: "bob", cx, cy, ampY: 18, ampDeg: 3.6, freq: 1.0, phase }, () => {
                p.layer("var(--z-lume-op)", () => {
                    p.fillPath(circlePath(cx, cy + r * 0.1, r * 2.1), tint, 0.14);
                    p.fillPath(circlePath(cx, cy + r * 0.1, r * 1.3), tint, 0.24);
                });
                for (let t = -3; t <= 3; t++) {
                    const tx = cx + t * r * 0.25;
                    const tLen = r * (2.25 + (3 - Math.abs(t)) * 0.48);
                    const tent = sample(cubic([tx, cy + r * 0.26], [tx + Math.sin(t * 1.7 + phase) * 28, cy + tLen * 0.38], [tx - Math.cos(t * 1.3 + phase) * 30, cy + tLen * 0.72], [tx + t * 9, cy + tLen]), 12);
                    p.calligraphicStroke(tent, 2.0, 1.25, 0.05, t % 2 === 0 ? PAL.celadonLt : PAL.petalBlush, 0.76);
                }
                for (const s of [-1, 0, 1]) {
                    const arm = sample(quad([cx + s * r * 0.16, cy + r * 0.2], [cx + s * r * 0.34, cy + r * 1.1], [cx + s * r * 0.12, cy + r * 1.82]), 10);
                    p.calligraphicStroke(arm, 5.8, 3.6, 0.1, PAL.petal, 0.82);
                }
                const bell = [];
                for (let i = 0; i <= 14; i++) {
                    const a = Math.PI + (i / 14) * Math.PI;
                    bell.push([cx + Math.cos(a) * r, cy + r * 0.24 + Math.sin(a) * r * 0.92]);
                }
                for (let i = 6; i >= 0; i--) {
                    bell.push([lerp([cx - r, 0], [cx + r, 0], i / 6)[0], cy + r * (i % 2 === 0 ? 0.32 : 0.18)]);
                }
                p.fillPath(closedSmooth(bell), PAL.petal, 0.78);
                p.fillPath(ellipsePath(cx, cy - r * 0.12, r * 0.62, r * 0.42), tint, 0.46);
                let canals = "";
                for (let k = -3; k <= 3; k++) {
                    canals += `M${f(cx)} ${f(cy - r * 0.56)}Q${f(cx + k * r * 0.18)} ${f(cy - r * 0.12)} ${f(cx + k * r * 0.28)} ${f(cy + r * 0.25)}`;
                }
                p.burin(canals, PAL.inkMid, 0.52, 0.56, 7, "hatch");
                p.burinContour(closedSmooth(bell), PAL.ink, 0.82, 0.78, 1);
            });
        };
        drawMedusa(295, 365, 68, 0.3, PAL.celadonLt);
        drawMedusa(935, 420, 62, 1.4, PAL.petalBlush);
        drawMedusa(915, 965, 76, 2.2, PAL.celadonLt);
        drawMedusa(2085, 925, 64, 3.1, PAL.wisteriaLt);
        // 9. 120+ TINY GLIDING SILVER SCHOOLING FISH IN 4 SWIRLING BAIT-BALL STREAMS (`PathBatcher`, `drift`!)
        const drawFishShoal = (cx, cy, dir, count, phase) => {
            p.animGroup({ kind: "drift", ampX: 64 * dir, ampY: 16, freq: 0.58, phase }, () => {
                const fb = new PathBatcher();
                for (let i = 0; i < count; i++) {
                    const t = i / count;
                    const fx = cx + (t - 0.5) * 440 + rand(p.r, -55, 55);
                    const fy = cy + Math.sin(t * TAU * 1.4) * 58 + rand(p.r, -38, 38);
                    const sz = rand(p.r, 9, 17);
                    const body = [
                        [fx + dir * sz, fy],
                        [fx + dir * sz * 0.22, fy - sz * 0.34],
                        [fx - dir * sz * 0.68, fy],
                        [fx - dir * sz * 1.18, fy - sz * 0.34],
                        [fx - dir * sz * 0.98, fy],
                        [fx - dir * sz * 1.18, fy + sz * 0.34],
                        [fx - dir * sz * 0.68, fy],
                        [fx + dir * sz * 0.22, fy + sz * 0.34],
                    ];
                    const d = polyPath(body);
                    fb.addPath(i % 3 === 0 ? "teal" : "silver", d, { fill: i % 3 === 0 ? PAL.celadonLt : PAL.petal, fillOpacity: 0.88 });
                    fb.addPath("gill", d + `M${f(fx + dir * sz * 0.42)} ${f(fy - sz * 0.15)}V${f(fy + sz * 0.15)}`, {
                        stroke: PAL.ink,
                        strokeWidth: 0.46,
                        strokeOpacity: 0.68,
                        nonScaling: "contour",
                    });
                }
                fb.flush(p);
            });
        };
        drawFishShoal(485, 955, 1, 34, 0.4);
        drawFishShoal(965, 245, -1, 32, 1.9);
        drawFishShoal(1545, 1085, -1, 30, 3.1);
        drawFishShoal(685, 395, 1, 26, 2.5);
        // 10. BIOLUMINESCENT CELADON & AMBER REEF NODES igniting at Night
        p.layer("var(--z-lume-op)", () => {
            p.animGroup({ kind: "pulse", baseOp: 0.72, ampOp: 0.26, freq: 2.05, phase: 0.6 }, () => {
                const nb = new PathBatcher();
                for (const [bx, by, isCel, r] of [
                    [265, 1185, true, 22],
                    [385, 1210, false, 18],
                    [540, 1305, true, 24],
                    [695, 1275, false, 19],
                    [1095, 1325, true, 24],
                    [1375, 1345, true, 26],
                    [1645, 1265, false, 20],
                    [1945, 1150, true, 24],
                    [2045, 1115, false, 20],
                    [185, 765, true, 18],
                    [1165, 895, true, 18],
                ]) {
                    nb.circle(isCel ? "cOut" : "aOut", bx, by, r * 2.0, { fill: isCel ? PAL.celadonLt : PAL.lantern, fillOpacity: 0.16 });
                    nb.circle(isCel ? "cMid" : "aMid", bx, by, r * 1.0, { fill: isCel ? PAL.celadonLt : PAL.lantern, fillOpacity: 0.34 });
                    nb.circle("core", bx, by, r * 0.32, { fill: PAL.lanternCore, fillOpacity: 0.94 });
                }
                nb.flush(p);
            });
        });
    });
    // 11. CARVED TIMBER-&-BRASS STERN GALLERY WINDOW CASING & SWUNG-OPEN LEADED CASEMENTS around `hole`!
    // Crisp architectural mullioned casing strictly OUTSIDE `hole` (404x272px -> 0px mustard oval collar on S15!).
    const casB = new PathBatcher();
    const cPad = 12;
    const outerRect = [
        [wX0 - cPad, wY0 - cPad],
        [wX1 + cPad, wY0 - cPad],
        [wX1 + cPad, wY1 + cPad],
        [wX0 - cPad, wY1 + cPad],
    ];
    // Slim carved gilded-brass & dark oak window architrave frame (evenodd punched by hole!)
    casB.addPath("architrave", polyPath(outerRect) + polyPath(hole), { fill: PAL.brassDk, fillOpacity: 0.98, evenodd: true });
    casB.addPath("bevel", polyPath([[wX0 - 5, wY0 - 5], [wX1 + 5, wY0 - 5], [wX1 + 5, wY1 + 5], [wX0 - 5, wY1 + 5]]) + polyPath(hole), { fill: PAL.brass, fillOpacity: 0.94, evenodd: true });
    // Delicate Swung-Open Leaded-Glass Casement Shutters folded back cleanly outside left & right jambs!
    for (const side of [-1, 1]) {
        const sx0 = side < 0 ? wX0 - cPad - 54 : wX1 + cPad;
        const sx1 = side < 0 ? wX0 - cPad : wX1 + cPad + 54;
        const tilt = side < 0 ? -12 : 12;
        const p0 = [sx0, wY0 + (side < 0 ? tilt : 0)];
        const p1 = [sx1, wY0 + (side > 0 ? -tilt : 0)];
        const p2 = [sx1, wY1 + (side > 0 ? tilt : 0)];
        const p3 = [sx0, wY1 + (side < 0 ? -tilt : 0)];
        casB.quad("sashFill", p0, p1, p2, p3, { fill: PAL.brassDk, fillOpacity: 0.96 });
        casB.quad("sashRim", p0, p1, p2, p3, { stroke: PAL.ink, strokeWidth: 0.72, nonScaling: "contour" });
        casB.quad("sashGlass", bilerp(p0, p1, p2, p3, 0.14, 0.05), bilerp(p0, p1, p2, p3, 0.86, 0.05), bilerp(p0, p1, p2, p3, 0.86, 0.95), bilerp(p0, p1, p2, p3, 0.14, 0.95), { fill: PAL.glass, fillOpacity: 0.48 });
        for (let r = 1; r < 5; r++) {
            const a = bilerp(p0, p1, p2, p3, 0.14, r / 5);
            const b = bilerp(p0, p1, p2, p3, 0.86, r / 5);
            casB.line("sashBar", a[0], a[1], b[0], b[1], { stroke: PAL.umberDk, strokeWidth: 0.62, nonScaling: "contour" });
        }
        const vm0 = bilerp(p0, p1, p2, p3, 0.5, 0.05);
        const vm1 = bilerp(p0, p1, p2, p3, 0.5, 0.95);
        casB.line("sashBar", vm0[0], vm0[1], vm1[0], vm1[1], { stroke: PAL.umberDk, strokeWidth: 0.62, nonScaling: "contour" });
    }
    // Subtle encrusting conical calcareous barnacles strictly on the outer corners of the carved sill/lintel!
    for (const [cx, cy] of [
        [wX0 - 4, wY0 - 8],
        [wX1 + 2, wY0 - 8],
        [wX0 + 36, wY1 + 10],
        [wX1 - 44, wY1 + 10],
    ]) {
        for (let k = 0; k < 4; k++) {
            const bx = cx + rand(p.r, -14, 14);
            const by = cy + rand(p.r, -4, 4);
            const bw = rand(p.r, 4.5, 7.5);
            const bh = rand(p.r, 4.0, 6.5);
            casB.quad("barnL", [bx - bw, by + bh * 0.4], [bx - bw * 0.4, by - bh * 0.6], [bx, by - bh * 0.5], [bx, by + bh * 0.55], { fill: PAL.paperStone, fillOpacity: 0.94 });
            casB.quad("barnR", [bx, by - bh * 0.5], [bx + bw * 0.45, by - bh * 0.55], [bx + bw, by + bh * 0.4], [bx, by + bh * 0.55], { fill: PAL.slate, fillOpacity: 0.9 });
        }
    }
    casB.addPath("casOut", polyPath(outerRect), { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.88, nonScaling: "contour" });
    casB.addPath("holeOut", polyPath(hole), { stroke: PAL.ink, strokeWidth: 0.95, strokeOpacity: 0.9, nonScaling: "contour" });
    casB.flush(p);
    // Subtle verdigris sea-moss tufts clinging to the outer corners of the stern gallery sill
    p.dryBrushFoliage([
        { cx: wX0 - 18, cy: wY1 + 18, rx: 32, ry: 14, density: 0.72 },
        { cx: wX1 + 18, cy: wY0 - 14, rx: 30, ry: 13, density: 0.68 },
    ], { dark: PAL.celadonDk, mid: PAL.malachite, light: PAL.celadonLt }, { dabSize: 5.5, opacity: 0.84 });
    p.flush();
    return {
        index: 14,
        id: "s14-abyss",
        title: "Abyssal Kelp Canyon & Sunken Stern Gallery",
        subtitle: "Macrocystis kelp cathedral, Haeckel reef, bathysphere & sunken frigate stern window",
        portal: S14_PORTAL,
        coreColorDay: [204, 216, 214],
        coreColorNight: [13, 21, 38],
        defs: p.defs.join(""),
        markup: p.out.join(""),
        hole,
        stats: { elements: p.elements, strokes: p.strokes, animGroups: p.animGroups },
    };
}
