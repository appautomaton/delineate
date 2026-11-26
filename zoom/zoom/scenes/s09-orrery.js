// S09: Dense Astronomer's Chart Study, Coffered Library, Geared Copernican Orrery & Silk Scroll Table
// Stage-5 `5x` Micro-Craft Overhaul (`PathBatcher` + `denseBookshelf`, `portal: (1520, 950)`):
//   - Upper architecture: Coffered oak timber ceiling with dentil cornice molding, FOUR dense `@kiuzyx`
//     bookcase bays (`~380+` 3-7px leather spines, gold title bands, horizontal stacks & archival binders),
//     tall mahogany pendulum regulator wall clock (`data-anim="sway"`), twin brass planispheric wall
//     astrolabes, museum-framed double-hemisphere celestial atlas print & recessed cyanotype star-chart.
//   - Left workbench (`OCX = 640, OCY = 635`): Monumental geared Copernican brass orrery with 144-division
//     vernier horizon ring, counter-rotating meshing brass spur/bevel gears, tilted multi-band Saturn +
//     Titan, Earth-Moon tellurion, banded Jupiter + Galilean moons, Mars, Venus, Mercury & pulsing Sun.
//   - Lower-right oak workbench (portal `[1308..1732, 805..1096]` enclosing full S=6 viewport): Crowded
//     with layered star-chart worksheets, brass-box marine chronometer, open 70-line ephemeris ledger,
//     hinged parallel ruler, brass dividers, magnifying loupe, brass-meridian celestial table globe,
//     folding sextant, brass hourglass, rolled charts, inkwell, quill, inkstone, seal paste box, teacup,
//     articulated emerald-shade banker's lamp & unrolled celadon-damask Chinese landscape silk handscroll
//     (`绢本青绿山水卷`) opening seamlessly onto S10's Great Wall ridge!
import { PAL, Painter, PathBatcher, TAU, add, circlePath, closedSmooth, cubic, denseBookshelf, ellipsePath, f, lerp, linearTone, openPoly, polar, polyPath, rad, rand, rectWindowHole, sample, } from "../kit.js";
import { BLEED, requiredPortalClearBox, requiredPortalSealBox, validatePortalHole, } from "./types.js";
export const S09_PORTAL = { cx: 1520, cy: 950, rx: 198, ry: 140 };
const S10_NEXT_PORTAL = [1550, 570];
export function buildS09Orrery() {
    const p = new Painter("s09", 5909);
    // Scale-6 off-center portal geometry: unrolled silk handscroll centered cleanly on S09_PORTAL (1520, 950).
    // Opening [1308.4..1732.4, 804.6..1095.6] strictly encloses both S=12 clearBox and S=6 viewport (zero lingering strip on day-o10!).
    const clearBox = requiredPortalClearBox(S09_PORTAL, S10_NEXT_PORTAL);
    requiredPortalSealBox(S09_PORTAL);
    const hole = rectWindowHole(clearBox, {
        padL: 117,
        padR: 71,
        padTop: 50,
        padBot: 81,
    });
    validatePortalHole("s09-orrery", hole, S09_PORTAL, S10_NEXT_PORTAL);
    const sx0 = hole[0][0]; // ~1308
    const sy0 = hole[0][1]; // ~805
    const sx1 = hole[2][0]; // ~1732
    const sy1 = hole[2][1]; // ~1096
    const scy = (sy0 + sy1) * 0.5;
    const TABLE_Y = 514;
    const OCX = 640;
    const OCY = 635;
    // ---------- Gradients (zero SVG filters) ----------
    const wallGrad = p.linearGrad("wall", 0, BLEED.y0, 0, TABLE_Y + 40, [
        [0, PAL.paperDeep],
        [0.45, PAL.paperWarm],
        [1, PAL.paper],
    ]);
    const chartGrad = p.radialGrad("chart", OCX, 340, 860, [
        [0, PAL.paper],
        [0.58, PAL.paperWarm],
        [0.88, PAL.paperDeep],
        [1, PAL.paperStone],
    ]);
    const oakTableGrad = p.linearGrad("oak", 0, TABLE_Y, 0, BLEED.y1, [
        [0, PAL.umberLt],
        [0.14, PAL.umber],
        [0.64, PAL.bark],
        [1, PAL.umberDk],
    ]);
    const brocadeGrad = p.linearGrad("brocade", sx0 - 44, sy0 - 34, sx1 + 44, sy1 + 34, [
        [0, PAL.celadonLt],
        [0.45, PAL.paperStone],
        [1, PAL.celadon],
    ]);
    const brassGrad = p.linearGrad("brass", 180, 180, 1140, 1120, [
        [0, PAL.brassLt],
        [0.46, PAL.brass],
        [1, PAL.brassDk],
    ]);
    const globeGrad = p.radialGrad("globe", 2090, 785, 165, [
        [0, PAL.celadonLt],
        [0.48, PAL.azurite],
        [1, PAL.prussianDk],
    ]);
    const lampConeGrad = p.radialGrad("lampcone", 1915, 615, 680, [
        [0, PAL.lanternCore, 0.56],
        [0.3, PAL.lantern, 0.28],
        [0.68, PAL.lanternHalo, 0.09],
        [1, PAL.lanternHalo, 0],
    ]);
    const sunGlowGrad = p.radialGrad("sunglow", OCX, OCY, 235, [
        [0, PAL.lanternCore, 0.92],
        [0.36, PAL.lantern, 0.44],
        [0.74, PAL.lanternHalo, 0.14],
        [1, PAL.lanternHalo, 0],
    ]);
    // 1. Opaque overbleed archival study backdrop punched cleanly by the scroll aperture
    p.asymmetricPortalBackdrop(hole, wallGrad, { smooth: false });
    p.clippedToBackdrop(hole, () => {
        // =========================================================================
        // LAYER A: COFFERED CEILING, FOUR `@kiuzyx` BOOKCASE BAYS, REGULATOR CLOCK,
        // WALL ASTROLABES, DOUBLE-HEMISPHERE PRINT & CYANOTYPE STAR-CHART ALCOVE!
        // =========================================================================
        // 1. Recessed Cyanotype Star-Chart Alcove behind the upper orrery (`x = 390..1225, y = 66..TABLE_Y`)
        p.fillPath(polyPath([[390, 66], [1225, 66], [1225, TABLE_Y], [390, TABLE_Y]]), chartGrad, 0.99);
        // Warm paneled walnut study wall behind right wall instruments (`x = 1225..BLEED.x1, y = 66..TABLE_Y`)
        p.fillPath(polyPath([[1225, 66], [BLEED.x1, 66], [BLEED.x1, TABLE_Y], [1225, TABLE_Y]]), PAL.paperDeep, 0.98);
        // Coffered Oak Ceiling Beams & Dentil Cornice Frieze (`y = -280..74`, PathBatcher!)
        const archB = new PathBatcher();
        archB.rect("ceilBg", BLEED.x0, BLEED.y0, BLEED.x1 - BLEED.x0, 344, { fill: PAL.barkDk, fillOpacity: 0.98 });
        // Perspective coffer panels across ceiling soffit
        for (let i = -1; i < 9; i++) {
            const x0 = i * 310;
            archB.rect("coffer", x0 + 18, -110, 274, 152, { fill: PAL.umberDk, fillOpacity: 0.96 });
            archB.rect("cofferIn", x0 + 34, -96, 242, 124, { fill: PAL.bark, fillOpacity: 0.85 });
            archB.rect("cofferRim", x0 + 34, -96, 242, 124, { stroke: PAL.litEdge, strokeWidth: 0.5, strokeOpacity: 0.55, nonScaling: "hatch" });
        }
        // Molded crown cornice architrave + rhythmic dentil blocks (`y = 44..74`)
        archB.rect("corniceTop", BLEED.x0, 42, BLEED.x1 - BLEED.x0, 14, { fill: PAL.umber, fillOpacity: 0.99 });
        archB.rect("corniceBot", BLEED.x0, 56, BLEED.x1 - BLEED.x0, 16, { fill: PAL.barkDk, fillOpacity: 0.99 });
        for (let dx = -240; dx < 2680; dx += 22) {
            archB.rect("dentil", dx, 58, 12, 10, { fill: PAL.umberLt, fillOpacity: 0.78 });
        }
        archB.line("corniceHi", BLEED.x0, 42, BLEED.x1, 42, { stroke: PAL.litEdge, strokeWidth: 0.65, strokeOpacity: 0.72, nonScaling: "contour" });
        archB.line("corniceInk", BLEED.x0, 72, BLEED.x1, 72, { stroke: PAL.ink, strokeWidth: 0.8, strokeOpacity: 0.8, nonScaling: "contour" });
        // Brass gallery picture rail & wall paneling mouldings
        archB.line("rail", 390, 84, 1830, 84, { stroke: PAL.brass, strokeWidth: 0.95, strokeOpacity: 0.85, nonScaling: "contour" });
        archB.rect("chartFrame", 392, 72, 832, TABLE_Y - 72, { stroke: PAL.bark, strokeWidth: 0.95, strokeOpacity: 0.82, nonScaling: "contour" });
        archB.flush(p);
        // 2. FOUR Dense `@kiuzyx` Bays of `denseBookshelf` (~380+ varied 3-7px spines, title bands, stacks & binders!)
        // Bay 1: Full-height outer-left mahogany bookcase (`x = -120..172, y = 72..1205`)
        denseBookshelf(p, { x: -120, y: 72, w: 292, h: 1132 }, { shelves: 6, binders: true });
        // Bay 2: Inner-left upper bookcase (`x = 180..388, y = 72..506`, prominently visible inside `day-o09.png`!)
        denseBookshelf(p, { x: 180, y: 72, w: 208, h: 432 }, { shelves: 4, binders: true });
        // Bay 3: Upper-right inner bookcase (`x = 1838..2112, y = 72..506`, directly visible in `day-o09.png`!)
        denseBookshelf(p, { x: 1838, y: 72, w: 274, h: 432 }, { shelves: 4, binders: true });
        // Bay 4: Upper-right outer bookcase (`x = 2120..2440, y = 72..506`)
        denseBookshelf(p, { x: 2120, y: 72, w: 320, h: 432 }, { shelves: 4, binders: true });
        // 3. Dense Non-Scaling Celestial Star-Chart Alcove Grid, Ecliptic Arcs & Zodiac Asterisms (`x = 394..1220`)
        const chartB = new PathBatcher();
        for (const rr of [210, 315, 425, 540, 665, 795]) {
            chartB.addPath("arcs", circlePath(OCX, OCY, rr), { stroke: PAL.inkDraft, strokeWidth: 0.5, strokeOpacity: 0.44, nonScaling: "hatch", dash: "10 6" });
        }
        // Fine degree grid inside upper star-chart panel
        for (let gx = 430; gx < 1210; gx += 62) {
            chartB.line("grid", gx, 86, gx, TABLE_Y - 12, { stroke: PAL.inkDraft, strokeWidth: 0.34, strokeOpacity: 0.24, nonScaling: "hatch" });
        }
        for (let gy = 115; gy < TABLE_Y - 12; gy += 56) {
            chartB.line("grid", 402, gy, 1216, gy, { stroke: PAL.inkDraft, strokeWidth: 0.34, strokeOpacity: 0.24, nonScaling: "hatch" });
        }
        for (let i = 0; i < 24; i++) {
            const a = (i / 24) * TAU;
            chartB.line("rad", OCX + Math.cos(a) * 160, OCY + Math.sin(a) * 160, OCX + Math.cos(a) * 860, OCY + Math.sin(a) * 860, {
                stroke: PAL.inkDraft,
                strokeWidth: 0.4,
                strokeOpacity: 0.32,
                nonScaling: "hatch",
                dash: "14 5 2 5",
            });
        }
        const eclCurve = sample((t) => [404 + t * 812, 178 + Math.sin(t * TAU * 1.15 - 0.5) * 64], 42);
        chartB.addPath("ecl", openPoly(eclCurve), { stroke: PAL.copper, strokeWidth: 0.58, strokeOpacity: 0.48, nonScaling: "hatch" });
        // Tiny chart border degree ticks
        for (let tx = 408; tx <= 1210; tx += 16) {
            chartB.line("ticks", tx, 80, tx, tx % 64 === 0 ? 90 : 86, { stroke: PAL.inkDraft, strokeWidth: 0.45, strokeOpacity: 0.55, nonScaling: "hatch" });
        }
        chartB.flush(p);
        // Zodiacal constellation asterisms + nocturnal starfield
        const asterisms = [
            [[438, 168], [492, 134], [556, 152], [602, 114], [662, 144]],
            [[865, 118], [942, 98], [1018, 134], [1088, 106], [1162, 154], [1092, 198], [1018, 134]],
            [[980, 268], [1052, 245], [1124, 282], [1182, 254]],
        ];
        let asterLines = "";
        let asterStars = "";
        for (const pts of asterisms) {
            asterLines += openPoly(pts);
            for (const [ax, ay] of pts) {
                asterStars += `M${f(ax - 5)} ${f(ay)}L${f(ax)} ${f(ay - 5)}L${f(ax + 5)} ${f(ay)}L${f(ax)} ${f(ay + 5)}Z`;
            }
        }
        p.burin(asterLines, PAL.inkDraft, 0.52, 0.58, 16, "hatch", "4 5");
        p.animGroup({ kind: "pulse", baseOp: 0.78, ampOp: 0.22, freq: 1.6, phase: 0.5 }, () => {
            p.fillPath(asterStars, PAL.lanternCore, 0.92);
            p.burinContour(asterStars, PAL.inkDraft, 0.5, 0.74, 16);
        });
        p.layer("var(--z-star-op)", () => {
            p.animGroup({ kind: "pulse", baseOp: 0.78, ampOp: 0.22, freq: 2.1, phase: 1.7 }, () => {
                let starsD = "";
                for (let i = 0; i < 84; i++) {
                    starsD += `M${f(rand(p.r, 400, 1218))} ${f(rand(p.r, 82, TABLE_Y - 14))}h0.24`;
                }
                p.burinContour(starsD, PAL.inkRim, 1.35, 0.92, 84);
            });
        });
        // 4. Tall Mahogany Pendulum Regulator Wall Clock (`x = 1238..1372, y = 84..496`, `#183`!)
        const clkX = 1305;
        const clkB = new PathBatcher();
        // Shadow + stepped pediment + waist trunk + glazed pendulum window
        clkB.rect("sh", 1244, 92, 134, 408, { fill: PAL.cut, fillOpacity: 0.2 });
        clkB.rect("body", 1240, 108, 130, 386, { fill: PAL.bark, fillOpacity: 0.99 });
        clkB.rect("trim", 1232, 92, 146, 18, { fill: PAL.umberDk, fillOpacity: 0.99 });
        clkB.rect("trim", 1236, 484, 138, 14, { fill: PAL.umberDk, fillOpacity: 0.99 });
        // Brass spire finial + cornice pediment
        clkB.addPath("ped", `M1240 92L1305 74L1370 92Z`, { fill: PAL.barkDk, fillOpacity: 0.98 });
        clkB.circle("fin", clkX, 72, 6, { fill: PAL.brassLt, fillOpacity: 0.96 });
        // Glazed pendulum recess (`y = 248..472`)
        clkB.rect("waist", 1258, 248, 94, 222, { fill: PAL.cut, fillOpacity: 0.72 });
        clkB.rect("waistRim", 1258, 248, 94, 222, { stroke: PAL.brass, strokeWidth: 0.72, strokeOpacity: 0.82, nonScaling: "contour" });
        // Silvered Roman chapter-ring dial (`cy = 178, r = 50` — `PAL.petal` stays luminous moonlit silver at Night!)
        clkB.circle("bezel", clkX, 178, 54, { fill: PAL.brass, fillOpacity: 0.98 });
        clkB.circle("dial", clkX, 178, 46, { fill: PAL.petal, fillOpacity: 0.99 });
        clkB.circle("subDial", clkX, 158, 11, { stroke: PAL.inkMid, strokeWidth: 0.4, strokeOpacity: 0.75, nonScaling: "hatch" });
        for (let i = 0; i < 60; i++) {
            const a = (i / 60) * TAU;
            const maj = i % 5 === 0;
            clkB.line("ticks", clkX + Math.cos(a) * (maj ? 35 : 40), 178 + Math.sin(a) * (maj ? 35 : 40), clkX + Math.cos(a) * 44, 178 + Math.sin(a) * 44, {
                stroke: PAL.ink,
                strokeWidth: maj ? 0.8 : 0.38,
                strokeOpacity: 0.85,
                nonScaling: "hatch",
            });
        }
        // Blued steel regulator clock hands (set to 10:10)
        clkB.line("hands", clkX, 178, clkX - 20, 158, { stroke: PAL.prussianDk, strokeWidth: 1.1, strokeOpacity: 0.95, nonScaling: "contour" });
        clkB.line("hands", clkX, 178, clkX + 26, 156, { stroke: PAL.prussianDk, strokeWidth: 0.85, strokeOpacity: 0.95, nonScaling: "contour" });
        clkB.circle("fin", clkX, 178, 3.5, { fill: PAL.brassDk, fillOpacity: 0.98 });
        clkB.flush(p);
        // Swinging gilded brass lenticular pendulum inside the glazed regulator case (`data-anim="sway"`)!
        p.animGroup({ kind: "sway", cx: clkX, cy: 254, ampDeg: 4.5, freq: 1.55, phase: 0.4 }, () => {
            p.burinContour(`M${clkX} 254V428`, PAL.brassLt, 0.95, 0.9, 1);
            p.fillPath(circlePath(clkX, 434, 24), brassGrad, 0.98);
            p.fillPath(circlePath(clkX - 6, 428, 10), PAL.brassLt, 0.62);
            p.burinContour(circlePath(clkX, 434, 24), PAL.ink, 0.65, 0.82, 1);
        });
        // 5. Twin Hanging Brass Planispheric Wall Astrolabes (`x = 1392..1512, y = 104..476`, `#183`!)
        const astB = new PathBatcher();
        for (const [ax, ay, ar] of [
            [1452, 206, 52],
            [1452, 368, 44],
        ]) {
            // Oak mounting plaque + hanging brass ring
            astB.rect("plaque", ax - ar - 10, ay - ar - 16, (ar + 10) * 2, (ar + 16) * 2, { fill: PAL.umberDk, fillOpacity: 0.94 });
            astB.line("cord", ax, 84, ax, ay - ar - 16, { stroke: PAL.inkMid, strokeWidth: 0.55, strokeOpacity: 0.72, nonScaling: "contour" });
            astB.circle("throne", ax, ay - ar - 6, 7, { stroke: PAL.brassLt, strokeWidth: 0.85, strokeOpacity: 0.9, nonScaling: "contour" });
            astB.addPath("mater", circlePath(ax, ay, ar) + circlePath(ax, ay, ar * 0.8), { fill: brassGrad, fillOpacity: 0.96, evenodd: true });
            astB.circle("plate", ax, ay, ar * 0.8, { fill: PAL.paperWarm, fillOpacity: 0.86 });
            // Stereographic altitude almucantar circles + rete ecliptic ring + alidade sighting bar
            for (const fR of [0.35, 0.6]) {
                astB.circle("rete", ax, ay - ar * 0.14, ar * fR, { stroke: PAL.inkDraft, strokeWidth: 0.4, strokeOpacity: 0.72, nonScaling: "hatch" });
            }
            astB.circle("eclRing", ax + ar * 0.12, ay - ar * 0.1, ar * 0.48, { stroke: PAL.brassDk, strokeWidth: 0.9, strokeOpacity: 0.92, nonScaling: "contour" });
            for (let t = 0; t < 36; t++) {
                const a = (t / 36) * TAU;
                astB.line("ticks", ax + Math.cos(a) * ar * 0.82, ay + Math.sin(a) * ar * 0.82, ax + Math.cos(a) * ar * 0.98, ay + Math.sin(a) * ar * 0.98, {
                    stroke: PAL.ink,
                    strokeWidth: 0.42,
                    strokeOpacity: 0.75,
                    nonScaling: "hatch",
                });
            }
            astB.line("alidade", ax - ar * 0.88, ay - ar * 0.36, ax + ar * 0.88, ay + ar * 0.36, { stroke: PAL.brassDk, strokeWidth: 1.2, strokeOpacity: 0.92, nonScaling: "contour" });
            astB.circle("pin", ax, ay, 4.5, { fill: PAL.brassLt, fillOpacity: 0.98 });
        }
        astB.flush(p);
        // 6. Museum-Framed Double-Hemisphere Celestial Atlas Print (`x = 1526..1824, y = 96..414`)
        const prB = new PathBatcher();
        prB.rect("sh", 1534, 104, 294, 314, { fill: PAL.cut, fillOpacity: 0.18 });
        prB.rect("frame", 1528, 96, 294, 314, { fill: PAL.bark, fillOpacity: 0.99 });
        prB.rect("mat", 1544, 112, 262, 282, { fill: PAL.paperWarm, fillOpacity: 0.99 });
        prB.rect("plate", 1558, 126, 234, 254, { fill: PAL.paper, fillOpacity: 0.99, stroke: PAL.inkMid, strokeWidth: 0.48, nonScaling: "hatch" });
        prB.circle("hL", 1618, 238, 52, { fill: PAL.celadonLt, fillOpacity: 0.36 });
        prB.circle("hR", 1732, 238, 52, { fill: PAL.prussianLt, fillOpacity: 0.28 });
        prB.addPath("land1", closedSmooth([[1590, 218], [1614, 206], [1642, 220], [1634, 246], [1602, 256]]), { fill: PAL.sageLt, fillOpacity: 0.46 });
        prB.addPath("land2", closedSmooth([[1702, 214], [1734, 204], [1762, 224], [1750, 256], [1714, 260]]), { fill: PAL.ochreLt, fillOpacity: 0.42 });
        for (const hcx of [1618, 1732]) {
            prB.circle("hLine", hcx, 238, 52, { stroke: PAL.inkDraft, strokeWidth: 0.52, strokeOpacity: 0.78, nonScaling: "hatch" });
            prB.circle("hLine", hcx, 238, 57, { stroke: PAL.inkDraft, strokeWidth: 0.42, strokeOpacity: 0.65, nonScaling: "hatch" });
            for (const fr of [0.35, 0.68]) {
                prB.addPath("hLine", ellipsePath(hcx, 238, 52 * fr, 52) + ellipsePath(hcx, 238, 52, 52 * fr), {
                    stroke: PAL.inkDraft,
                    strokeWidth: 0.38,
                    strokeOpacity: 0.62,
                    nonScaling: "hatch",
                });
            }
            for (let t = 0; t < 24; t++) {
                const a = (t / 24) * TAU;
                prB.line("hLine", hcx + Math.cos(a) * 52, 238 + Math.sin(a) * 52, hcx + Math.cos(a) * 57, 238 + Math.sin(a) * 57, {
                    stroke: PAL.inkDraft,
                    strokeWidth: 0.4,
                    strokeOpacity: 0.68,
                    nonScaling: "hatch",
                });
            }
        }
        // Corner compass roses & copperplate cartouche script lines
        for (const [rx, ry] of [[1576, 146], [1774, 146], [1576, 336], [1774, 336]]) {
            prB.line("rose", rx - 8, ry, rx + 8, ry, { stroke: PAL.copper, strokeWidth: 0.48, strokeOpacity: 0.72, nonScaling: "hatch" });
            prB.line("rose", rx, ry - 8, rx, ry + 8, { stroke: PAL.copper, strokeWidth: 0.48, strokeOpacity: 0.72, nonScaling: "hatch" });
            prB.circle("rose", rx, ry, 4, { stroke: PAL.inkDraft, strokeWidth: 0.38, strokeOpacity: 0.65, nonScaling: "hatch" });
        }
        prB.line("title", 1605, 344, 1745, 344, { stroke: PAL.inkMid, strokeWidth: 0.55, strokeOpacity: 0.7, nonScaling: "hatch" });
        prB.line("title", 1628, 355, 1722, 355, { stroke: PAL.inkHair, strokeWidth: 0.42, strokeOpacity: 0.65, nonScaling: "hatch" });
        prB.line("title", 1648, 364, 1702, 364, { stroke: PAL.inkHair, strokeWidth: 0.38, strokeOpacity: 0.58, nonScaling: "hatch" });
        prB.flush(p);
        // =========================================================================
        // LAYER B: CONTINUOUS CARTOGRAPHER'S OAK WORKBENCH + LAYERED STAR CHARTS!
        // =========================================================================
        p.fillPath(polyPath([[172, TABLE_Y], [BLEED.x1, TABLE_Y], [BLEED.x1, BLEED.y1], [BLEED.x0, BLEED.y1], [BLEED.x0, 1205], [172, 1205]]), oakTableGrad, 0.99);
        // Rich staggered oak planks, bevelled rail molding, wooden dowel pegs & organic wood-grain burin fibers (`PathBatcher`!)
        const deskB = new PathBatcher();
        deskB.rect("rail", 172, TABLE_Y - 14, BLEED.x1 - 172, 18, { fill: PAL.bark, fillOpacity: 0.99 });
        deskB.rect("railHi", 172, TABLE_Y - 14, BLEED.x1 - 172, 5, { fill: PAL.umberLt, fillOpacity: 0.64 });
        for (let i = 0; i < 22; i++) {
            const y0 = TABLE_Y + 6 + i * 64;
            const y1 = y0 + 64;
            const xStart = y0 < 1210 ? 174 : BLEED.x0;
            if (i % 3 === 0)
                deskB.rect("plankDk", xStart, y0, BLEED.x1 - xStart, 64, { fill: PAL.umberDk, fillOpacity: 0.14 });
            else if (i % 3 === 1)
                deskB.rect("plankLt", xStart, y0, BLEED.x1 - xStart, 64, { fill: PAL.umberLt, fillOpacity: 0.11 });
            deskB.line("seam", xStart, y0, BLEED.x1, y0, { stroke: PAL.inkSepia, strokeWidth: 0.45, strokeOpacity: 0.4, nonScaling: "hatch" });
            const jx = 340 + ((i * 419) % 1880);
            if (jx > xStart + 25) {
                deskB.line("seam", jx, y0, jx, y1, { stroke: PAL.inkSepia, strokeWidth: 0.45, strokeOpacity: 0.42, nonScaling: "hatch" });
                // Tiny oak joinery dowel pegs flanking plank butt joints
                deskB.circle("peg", jx - 7, y0 + 18, 1.8, { fill: PAL.barkDk, fillOpacity: 0.65 });
                deskB.circle("peg", jx + 7, y0 + 46, 1.8, { fill: PAL.barkDk, fillOpacity: 0.65 });
            }
            for (let g = 0; g < 3; g++) {
                const gy = y0 + 14 + g * 20 + rand(p.r, -3, 3);
                deskB.addPath("grain", `M${f(xStart + rand(p.r, 0, 140))} ${f(gy)}Q${f(1220 + rand(p.r, -280, 280))} ${f(gy + rand(p.r, -8, 8))} ${f(BLEED.x1 - rand(p.r, 0, 160))} ${f(gy + rand(p.r, -4, 4))}`, { stroke: PAL.inkSepia, strokeWidth: 0.35, strokeOpacity: 0.28, nonScaling: "hatch" });
            }
        }
        // Subtle brass corner escutcheon brackets on tabletop foreground apron
        deskB.line("railInk", 172, TABLE_Y - 14, BLEED.x1, TABLE_Y - 14, { stroke: PAL.ink, strokeWidth: 0.8, strokeOpacity: 0.82, nonScaling: "contour" });
        deskB.line("railInk", 172, TABLE_Y + 4, BLEED.x1, TABLE_Y + 4, { stroke: PAL.ink, strokeWidth: 0.78, strokeOpacity: 0.78, nonScaling: "contour" });
        deskB.flush(p);
        // Layered Overlapping Antique Star-Charts & Celestial Worksheets across the mid/right bench (`PathBatcher`!)
        const wsB = new PathBatcher();
        // Worksheet 1: Tilted star-chart sheet under upper-right scroll corner (`x = 1620..1995, y = 615..785`)
        const ws1 = [[1635, 622], [1985, 648], [1966, 782], [1616, 756]];
        wsB.quad("sh", [1641, 628], [1991, 654], [1972, 788], [1622, 762], { fill: PAL.cut, fillOpacity: 0.22 });
        wsB.quad("paper1", ws1[0], ws1[1], ws1[2], ws1[3], { fill: PAL.paperWarm, fillOpacity: 0.98 });
        for (let g = 1; g < 8; g++) {
            const a = lerp(ws1[0], ws1[3], g / 8);
            const c = lerp(ws1[1], ws1[2], g / 8);
            wsB.line("grid", a[0], a[1], c[0], c[1], { stroke: PAL.inkDraft, strokeWidth: 0.36, strokeOpacity: 0.45, nonScaling: "hatch" });
        }
        for (let g = 1; g < 12; g++) {
            const a = lerp(ws1[0], ws1[1], g / 12);
            const c = lerp(ws1[3], ws1[2], g / 12);
            wsB.line("grid", a[0], a[1], c[0], c[1], { stroke: PAL.inkDraft, strokeWidth: 0.36, strokeOpacity: 0.4, nonScaling: "hatch" });
        }
        wsB.circle("diag", 1835, 706, 44, { stroke: PAL.copper, strokeWidth: 0.55, strokeOpacity: 0.72, nonScaling: "hatch" });
        wsB.addPath("diag", ellipsePath(1835, 706, 44, 18), { stroke: PAL.inkDraft, strokeWidth: 0.45, strokeOpacity: 0.72, nonScaling: "hatch" });
        // Worksheet 2: Open Ruled Celestial Ephemeris Folio beside left scroll roller (`x = 1020..1262, y = 660..1096`)
        const epCov = [[1022, 668], [1252, 654], [1266, 1082], [1036, 1096]];
        const epTop = [[1034, 678], [1240, 666], [1248, 868], [1042, 880]];
        const epBot = [[1042, 884], [1248, 872], [1255, 1072], [1049, 1084]];
        wsB.quad("sh", [1030, 676], [1260, 662], [1274, 1090], [1044, 1104], { fill: PAL.cut, fillOpacity: 0.24 });
        wsB.quad("cov", epCov[0], epCov[1], epCov[2], epCov[3], { fill: PAL.prussianDk, fillOpacity: 0.97 });
        wsB.quad("epPageTop", epTop[0], epTop[1], epTop[2], epTop[3], { fill: PAL.paper, fillOpacity: 0.99 });
        wsB.quad("epPageBot", epBot[0], epBot[1], epBot[2], epBot[3], { fill: PAL.paperWarm, fillOpacity: 0.99 });
        // Dense 0.35px ruled celestial diagram, tabular columns & cursive ephemeris script ticks on BOTH pages (`#197`!)
        wsB.circle("epDiag", 1142, 774, 48, { stroke: PAL.inkDraft, strokeWidth: 0.48, strokeOpacity: 0.74, nonScaling: "hatch" });
        wsB.circle("epDiag", 1142, 774, 30, { stroke: PAL.copper, strokeWidth: 0.4, strokeOpacity: 0.65, nonScaling: "hatch" });
        wsB.addPath("epDiag", ellipsePath(1142, 774, 48, 22) + ellipsePath(1142, 774, 20, 48), { stroke: PAL.inkDraft, strokeWidth: 0.42, strokeOpacity: 0.65, nonScaling: "hatch" });
        // Upper page header lines, side annotation ticks & degree border
        for (let r = 1; r <= 10; r++) {
            const v = r / 11;
            const a = lerp(epTop[0], epTop[3], v);
            const c = lerp(epTop[1], epTop[2], v);
            wsB.line("epGrid", a[0] + 10, a[1], c[0] - 10, c[1], { stroke: PAL.inkDraft, strokeWidth: 0.34, strokeOpacity: 0.34, nonScaling: "hatch" });
            // Delicate cursive astronomical note strokes along top & bottom margins of epTop
            if (r <= 2 || r >= 9) {
                for (let w = 0; w < 5; w++) {
                    const p0 = lerp(a, c, 0.08 + w * 0.17);
                    const p1 = lerp(a, c, 0.08 + w * 0.17 + rand(p.r, 0.07, 0.13));
                    wsB.line("epScript", p0[0], p0[1] - 3, p1[0], p1[1] - 3.5, { stroke: PAL.inkMid, strokeWidth: 0.38, strokeOpacity: 0.64, nonScaling: "hatch" });
                }
            }
        }
        // Lower page dense 16-row x 4-col ruled ephemeris table + micro cursive tabular numerals!
        for (let r = 1; r <= 16; r++) {
            const v = r / 17;
            const a = lerp(epBot[0], epBot[3], v);
            const c = lerp(epBot[1], epBot[2], v);
            wsB.line("epGrid", a[0] + 10, a[1], c[0] - 10, c[1], { stroke: PAL.inkDraft, strokeWidth: r === 2 ? 0.52 : 0.34, strokeOpacity: 0.54, nonScaling: "hatch" });
            // Micro cursive glyph / numeral dashes inside every ephemeris table cell!
            for (let col = 0; col < 4; col++) {
                const uStart = 0.08 + col * 0.22;
                const p0 = lerp(a, c, uStart);
                const p1 = lerp(a, c, uStart + rand(p.r, 0.08, 0.16));
                wsB.line("epScript", p0[0], p0[1] - 4, p1[0], p1[1] - 4.5, { stroke: PAL.inkSepia, strokeWidth: 0.38, strokeOpacity: 0.62, nonScaling: "hatch" });
            }
        }
        for (const u of [0.27, 0.5, 0.73]) {
            const a = lerp(epBot[0], epBot[1], u);
            const c = lerp(epBot[3], epBot[2], u);
            wsB.line("epGrid", a[0], a[1] + 8, c[0], c[1] - 8, { stroke: PAL.inkDraft, strokeWidth: 0.35, strokeOpacity: 0.55, nonScaling: "hatch" });
        }
        // Hinged ebony-and-brass parallel ruler resting diagonally across folio
        wsB.quad("ruler", [1074, 932], [1232, 884], [1237, 898], [1079, 946], { fill: PAL.barkDk, fillOpacity: 0.97 });
        wsB.quad("ruler", [1088, 968], [1246, 920], [1251, 934], [1093, 982], { fill: PAL.barkDk, fillOpacity: 0.97 });
        wsB.line("hinge", 1122, 922, 1138, 956, { stroke: PAL.brassLt, strokeWidth: 1.15, strokeOpacity: 0.94, nonScaling: "contour" });
        wsB.line("hinge", 1192, 900, 1208, 934, { stroke: PAL.brassLt, strokeWidth: 1.15, strokeOpacity: 0.94, nonScaling: "contour" });
        // Worksheet 3: Rolled crimson-tied parchment chart tubes & brass hourglass (`y = 545..645`)
        for (const [tx, ty, tw, rotDy, tieX] of [
            [1218, 548, 420, -5, 1425],
            [1262, 580, 360, 4, 1465],
        ]) {
            wsB.quad("paper1", [tx, ty], [tx + tw, ty + rotDy], [tx + tw, ty + rotDy + 22], [tx, ty + 22], { fill: PAL.paperWarm, fillOpacity: 0.97 });
            wsB.quad("rollSh", [tx, ty + 11], [tx + tw, ty + rotDy + 11], [tx + tw, ty + rotDy + 22], [tx, ty + 22], { fill: PAL.paperShadow, fillOpacity: 0.72 });
            wsB.rect("ribbon", tieX, ty - 1, 13, 24, { fill: PAL.cinnabar, fillOpacity: 0.94 });
        }
        wsB.flush(p);
        // Brass reading loupe resting on the upper folio margin
        p.pressuredRibbon([[1168, 728], [1124, 770]], 6.8, PAL.barkDk, 0.96, 0.35);
        p.fillPath(circlePath(1190, 706, 22), PAL.glass, 0.48);
        p.fillPath(circlePath(1190, 706, 27) + circlePath(1190, 706, 20), brassGrad, 0.96, true);
        p.burinContour(circlePath(1190, 706, 27) + circlePath(1190, 706, 20), PAL.ink, 0.62, 0.82, 2);
        // Turned brass sandglass / hourglass sitting at `(1768, 598)`
        const hgx = 1768;
        const hgy = 598;
        p.fillPath(ellipsePath(hgx, hgy + 54, 32, 8), PAL.cut, 0.25);
        p.fillPath(polyPath([[hgx - 30, hgy - 52], [hgx + 30, hgy - 52], [hgx + 26, hgy - 42], [hgx - 26, hgy - 42]]), PAL.brass, 0.98);
        p.fillPath(polyPath([[hgx - 26, hgy + 42], [hgx + 26, hgy + 42], [hgx + 30, hgy + 52], [hgx - 30, hgy + 52]]), PAL.brass, 0.98);
        p.fillPath(closedSmooth([[hgx - 19, hgy - 42], [hgx + 19, hgy - 42], [hgx + 3.5, hgy], [hgx + 19, hgy + 42], [hgx - 19, hgy + 42], [hgx - 3.5, hgy]]), PAL.glass, 0.62);
        p.fillPath(polyPath([[hgx - 12, hgy - 20], [hgx + 12, hgy - 20], [hgx, hgy - 2]]), PAL.ochreLt, 0.92);
        p.fillPath(polyPath([[hgx, hgy + 16], [hgx + 16, hgy + 42], [hgx - 16, hgy + 42]]), PAL.ochre, 0.94);
        p.burinContour(`M${hgx - 22} ${hgy - 42}V${hgy + 42}M${hgx + 22} ${hgy - 42}V${hgy + 42}M${hgx - 30} ${hgy - 52}H${hgx + 30}M${hgx - 30} ${hgy + 52}H${hgx + 30}`, PAL.ink, 0.68, 0.84, 4);
        // Cast shadow of the brass orrery pedestal onto the oak workbench
        p.fillPath(ellipsePath(680, 1196, 295, 40), PAL.cut, 0.34);
        p.flush();
        // =========================================================================
        // LAYER C: MONUMENTAL GEARED COPERNICAN BRASS ORRERY (Upper-Left, 5x Detail!)
        // =========================================================================
        const pedBase = [[448, 1200], [832, 1200], [792, 1142], [488, 1142]];
        p.doubleGlaze(pedBase, PAL.bark, PAL.umberDk, {
            smooth: false,
            toneFn: linearTone([448, 1142], [832, 1200], 0.14, 0.88),
            hatchSpacing: 11,
            thinPx: 0.6,
            thickPx: 1.0,
        });
        const pedCol = [[572, 985], [708, 985], [748, 1142], [532, 1142]];
        p.doubleGlaze(pedCol, PAL.brass, PAL.brassDk, {
            smooth: false,
            toneFn: linearTone([535, 1040], [745, 1080], 0.1, 0.9),
            hatchSpacing: 9,
            thinPx: 0.58,
            thickPx: 1.0,
        });
        p.fillPath(polyPath([[542, 964], [738, 964], [724, 988], [556, 988]]), PAL.brassLt, 0.96);
        p.fillPath(polyPath([[622, 645], [658, 645], [664, 964], [616, 964]]), brassGrad, 0.98);
        p.burinContour(polyPath([[622, 645], [658, 645], [664, 964], [616, 964]]), PAL.ink, 0.8, 0.82, 4);
        // 144-Division Micro-Engraved Brass Horizon & Ecliptic Vernier Ring (`r = 470..524`)!
        p.brassDegreeRing({
            cx: OCX,
            cy: OCY,
            rOuter: 524,
            rInner: 470,
            tickCount: 144,
            majorEvery: 12,
            fill: brassGrad,
            bevelFill: PAL.brassLt,
            ink: PAL.ink,
        });
        p.moonRim(sample((t) => add([OCX, OCY], polar(524, t * TAU)), 48), { widthPx: 0.95 });
        // Four pierced-brass armillary spider-arm struts with micro-rivet pairs & inner brass gear cages
        const strutAngles = [-42, 42, 138, 222];
        const orrB = new PathBatcher();
        for (const deg of strutAngles) {
            const a = rad(deg);
            const ca = Math.cos(a);
            const sa = Math.sin(a);
            const nx = -sa;
            const ny = ca;
            const r0 = 135;
            const r1 = 474;
            const w0 = 15;
            const w1 = 22;
            const q0 = [OCX + ca * r0 + nx * w0, OCY + sa * r0 + ny * w0];
            const q1 = [OCX + ca * r1 + nx * w1, OCY + sa * r1 + ny * w1];
            const q2 = [OCX + ca * r1 - nx * w1, OCY + sa * r1 - ny * w1];
            const q3 = [OCX + ca * r0 - nx * w0, OCY + sa * r0 - ny * w0];
            let strutD = polyPath([q0, q1, q2, q3]);
            for (let k = 1; k <= 6; k++) {
                const rr = r0 + (r1 - r0) * (k / 7);
                const hr = 5.4 + k * 0.95;
                const hc = circlePath(OCX + ca * rr, OCY + sa * rr, hr);
                strutD += hc;
                orrB.addPath("ink", hc, { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.82, nonScaling: "contour" });
                orrB.circle("rivet", OCX + ca * (rr - 22) + nx * 12, OCY + sa * (rr - 22) + ny * 12, 2.0, { fill: PAL.brassLt, fillOpacity: 0.88 });
                orrB.circle("rivet", OCX + ca * (rr - 22) - nx * 12, OCY + sa * (rr - 22) - ny * 12, 2.0, { fill: PAL.brassLt, fillOpacity: 0.88 });
            }
            orrB.addPath("strut", strutD, { fill: PAL.brassDk, fillOpacity: 0.96, evenodd: true });
            orrB.quad("strutHi", q0, q1, lerp(q1, q2, 0.34), lerp(q0, q3, 0.34), { fill: PAL.brassLt, fillOpacity: 0.38 });
            orrB.addPath("ink", polyPath([q0, q1, q2, q3]), { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.84, nonScaling: "contour" });
        }
        // Concentric zodiacal brass rail tracks & armillary colure ellipses
        orrB.addPath("rail", circlePath(OCX, OCY, 376) + circlePath(OCX, OCY, 358), { fill: PAL.brass, fillOpacity: 0.92, evenodd: true });
        orrB.addPath("railDk", circlePath(OCX, OCY, 254) + circlePath(OCX, OCY, 240), { fill: PAL.brassDk, fillOpacity: 0.92, evenodd: true });
        orrB.addPath("colure", ellipsePath(OCX, OCY, 470, 178), { stroke: PAL.brassLt, strokeWidth: 0.9, strokeOpacity: 0.74, nonScaling: "contour" });
        orrB.addPath("colure", ellipsePath(OCX, OCY, 188, 470), { stroke: PAL.brass, strokeWidth: 0.84, strokeOpacity: 0.66, nonScaling: "contour" });
        orrB.flush(p);
        // Counter-rotating meshing drive gears (`data-anim="rotate"`)
        p.animGroup({ kind: "rotate", cx: OCX, cy: OCY, speedDeg: 7.5, phase: 0 }, () => {
            p.spurGear({ cx: OCX, cy: OCY, r: 150, teeth: 36, spokes: 6, fill: PAL.brass, rimFill: PAL.brassLt });
        });
        const pinions = [
            [OCX + 206, OCY - 92, 74, 20, -15],
            [OCX - 196, OCY + 108, 78, 20, -14.2],
            [OCX - 188, OCY - 122, 62, 16, -18],
            [OCX + 165, OCY + 162, 66, 18, -17],
        ];
        for (const [gx, gy, gr, gTeeth, spd] of pinions) {
            p.animGroup({ kind: "rotate", cx: gx, cy: gy, speedDeg: spd, phase: 0.4 }, () => {
                p.spurGear({ cx: gx, cy: gy, r: gr, teeth: gTeeth, spokes: 5, fill: PAL.brassDk, rimFill: PAL.brass });
            });
        }
        p.animGroup({ kind: "rotate", cx: 874, cy: 985, speedDeg: 22, phase: 0.2 }, () => {
            p.spurGear({ cx: 874, cy: 985, r: 48, teeth: 16, spokes: 4, fill: PAL.brass, rimFill: PAL.brassLt });
        });
        // Orbiting planetary carriers: Saturn (+ Cassini/Encke rings + Titan), Jupiter (+ 4 Galilean moons), Earth-Moon Tellurion, Mars, Venus, Mercury
        p.animGroup({ kind: "rotate", cx: OCX, cy: OCY, speedDeg: 4.2, phase: 0 }, () => {
            const satPos = add([OCX, OCY], polar(425, rad(-132)));
            const satMid = add([OCX, OCY], polar(260, rad(-132)));
            p.pressuredRibbon([[OCX, OCY], satMid, satPos], 6.5, PAL.brassDk, 0.92, 0.35);
            p.burinContour(`M${OCX} ${OCY}L${f(satPos[0])} ${f(satPos[1])}`, PAL.brassLt, 0.72, 0.78, 1);
            const [sx, sy] = satPos;
            const ringTilt = rad(-24);
            const ringPt = (rx, ry, th) => {
                const lx = Math.cos(th) * rx;
                const ly = Math.sin(th) * ry;
                return [sx + lx * Math.cos(ringTilt) - ly * Math.sin(ringTilt), sy + lx * Math.sin(ringTilt) + ly * Math.cos(ringTilt)];
            };
            const backOuter = sample((t) => ringPt(106, 35, Math.PI + t * Math.PI), 18);
            const backInner = sample((t) => ringPt(66, 21, Math.PI + t * Math.PI), 18).reverse();
            p.fillPath(polyPath([...backOuter, ...backInner]), PAL.ochreLt, 0.9);
            p.burinContour(openPoly(backOuter), PAL.ink, 0.72, 0.8, 1);
            p.fillPath(circlePath(sx, sy, 48), PAL.ochreLt, 0.99);
            p.fillPath(ellipsePath(sx, sy - 10, 44, 11), PAL.ochre, 0.58);
            p.fillPath(ellipsePath(sx, sy + 12, 43, 12), PAL.copper, 0.46);
            const satShade = [
                ...sample((t) => add([sx, sy], polar(48, rad(-40 + t * 185))), 14),
                ...sample((t) => add([sx - 12, sy - 10], polar(44, rad(145 - t * 185))), 14),
            ];
            p.fillPath(closedSmooth(satShade), PAL.umberDk, 0.38);
            p.burinHatch(sample((t) => add([sx, sy], polar(47, t * TAU)), 28), rad(48), 7, linearTone([sx - 35, sy - 35], [sx + 38, sy + 38], 0.04, 0.88), {
                color: PAL.inkSepia,
                opacity: 0.48,
            });
            p.burinContour(circlePath(sx, sy, 48), PAL.ink, 0.85, 0.86, 1);
            const frontOuter = sample((t) => ringPt(106, 35, t * Math.PI), 18);
            const frontMid = sample((t) => ringPt(86, 28, t * Math.PI), 18);
            const frontEncke = sample((t) => ringPt(98, 32, t * Math.PI), 18);
            const frontInner = sample((t) => ringPt(66, 21, t * Math.PI), 18).reverse();
            p.fillPath(polyPath([...frontOuter, ...frontInner]), PAL.brassLt, 0.94);
            p.burinContour(openPoly(frontMid) + openPoly(frontEncke), PAL.inkSepia, 0.58, 0.76, 2);
            p.burinContour(openPoly(frontOuter) + openPoly(frontInner), PAL.ink, 0.76, 0.86, 2);
            const titan = ringPt(122, 40, rad(28));
            p.fillPath(circlePath(titan[0], titan[1], 7.5), PAL.paperWarm, 0.96);
            p.burinContour(circlePath(titan[0], titan[1], 7.5), PAL.ink, 0.65, 0.82, 1);
            // Banded Jupiter + 4 Galilean moons on slender brass epicycle arms!
            const jupPos = add([OCX, OCY], polar(418, rad(46)));
            p.pressuredRibbon([[OCX, OCY], jupPos], 6.0, PAL.brassDk, 0.9, 0.35);
            const [jx, jy] = jupPos;
            p.fillPath(circlePath(jx, jy, 44), PAL.paperStone, 0.99);
            p.fillPath(ellipsePath(jx, jy - 14, 39, 8), PAL.copper, 0.62);
            p.fillPath(ellipsePath(jx, jy + 3, 42, 9), PAL.ochre, 0.65);
            p.fillPath(ellipsePath(jx + 11, jy + 14, 12, 6), PAL.cinnabar, 0.84);
            p.burinHatch(sample((t) => add([jx, jy], polar(43, t * TAU)), 24), rad(42), 7.5, linearTone([jx - 32, jy - 32], [jx + 34, jy + 34], 0.05, 0.85), {
                color: PAL.inkSepia,
                opacity: 0.45,
            });
            p.burinContour(circlePath(jx, jy, 44), PAL.ink, 0.85, 0.86, 1);
            for (const [mAng, mR, mr] of [[-48, 60, 4.2], [22, 68, 4.8], [138, 64, 4.0], [-145, 74, 5.2]]) {
                const mp = add(jupPos, polar(mR, rad(mAng)));
                p.burinContour(`M${f(jx)} ${f(jy)}L${f(mp[0])} ${f(mp[1])}`, PAL.brassLt, 0.52, 0.72, 1);
                p.fillPath(circlePath(mp[0], mp[1], mr), PAL.paperWarm, 0.96);
                p.burinContour(circlePath(mp[0], mp[1], mr), PAL.ink, 0.5, 0.78, 1);
            }
        });
        p.animGroup({ kind: "rotate", cx: OCX, cy: OCY, speedDeg: -8.6, phase: 1.2 }, () => {
            const earPos = add([OCX, OCY], polar(308, rad(-34)));
            p.pressuredRibbon([[OCX, OCY], earPos], 5.2, PAL.brass, 0.92, 0.35);
            const [ex, ey] = earPos;
            p.fillPath(circlePath(ex, ey, 56) + circlePath(ex, ey, 48), PAL.brassDk, 0.88, true);
            p.burinContour(circlePath(ex, ey, 56) + circlePath(ex, ey, 48), PAL.ink, 0.68, 0.82, 2);
            p.fillPath(circlePath(ex, ey, 33), PAL.azurite, 0.98);
            p.fillPath(closedSmooth([[ex - 20, ey - 14], [ex - 4, ey - 22], [ex + 12, ey - 8], [ex + 4, ey + 14], [ex - 16, ey + 8]]), PAL.malachite, 0.88);
            p.fillPath(closedSmooth([[ex + 10, ey + 2], [ex + 24, ey - 6], [ex + 25, ey + 14], [ex + 12, ey + 20]]), PAL.ochre, 0.78);
            p.burin(ellipsePath(ex, ey, 16, 32) + `M${ex - 32} ${ey}H${ex + 32}M${ex} ${ey - 32}V${ey + 32}`, PAL.inkDraft, 0.45, 0.62, 3, "hatch");
            p.burinContour(circlePath(ex, ey, 33), PAL.ink, 0.82, 0.88, 1);
            const moonPos = add(earPos, polar(58, rad(-125)));
            p.burinContour(`M${f(ex)} ${f(ey)}L${f(moonPos[0])} ${f(moonPos[1])}`, PAL.brassLt, 0.85, 0.88, 1);
            p.fillPath(circlePath(moonPos[0], moonPos[1], 11), PAL.petal, 0.98);
            p.fillPath(ellipsePath(moonPos[0] + 3, moonPos[1] + 2, 7, 9), PAL.slateLt, 0.45);
            p.burinContour(circlePath(moonPos[0], moonPos[1], 11), PAL.ink, 0.68, 0.84, 1);
            const marsPos = add([OCX, OCY], polar(294, rad(158)));
            p.pressuredRibbon([[OCX, OCY], marsPos], 4.8, PAL.brass, 0.9, 0.35);
            p.fillPath(circlePath(marsPos[0], marsPos[1], 24), PAL.cinnabar, 0.96);
            p.fillPath(circlePath(marsPos[0] - 6, marsPos[1] - 6, 11), PAL.cinnabarLt, 0.56);
            p.burinContour(circlePath(marsPos[0], marsPos[1], 24), PAL.ink, 0.78, 0.86, 1);
        });
        p.animGroup({ kind: "rotate", cx: OCX, cy: OCY, speedDeg: 14.5, phase: 2.1 }, () => {
            const venPos = add([OCX, OCY], polar(194, rad(98)));
            const merPos = add([OCX, OCY], polar(148, rad(-76)));
            p.burinContour(`M${OCX} ${OCY}L${f(venPos[0])} ${f(venPos[1])}M${OCX} ${OCY}L${f(merPos[0])} ${f(merPos[1])}`, PAL.brassLt, 1.05, 0.88, 2);
            p.fillPath(circlePath(venPos[0], venPos[1], 19), PAL.ochreLt, 0.98);
            p.burinContour(circlePath(venPos[0], venPos[1], 19), PAL.ink, 0.72, 0.84, 1);
            p.fillPath(circlePath(merPos[0], merPos[1], 13), PAL.slateLt, 0.98);
            p.burinContour(circlePath(merPos[0], merPos[1], 13), PAL.ink, 0.68, 0.84, 1);
        });
        // Central gilded Sun sphere
        p.layer("var(--z-halo-op)", () => {
            p.animGroup({ kind: "pulse", baseOp: 0.84, ampOp: 0.16, freq: 1.9, phase: 0 }, () => {
                p.fillPath(circlePath(OCX, OCY, 235), sunGlowGrad, 0.86);
            });
        });
        p.fillPath(circlePath(OCX, OCY, 68), PAL.lantern, 0.99);
        p.fillPath(circlePath(OCX - 16, OCY - 16, 40), PAL.lanternCore, 0.82);
        p.burinHatch(sample((t) => add([OCX, OCY], polar(67, t * TAU)), 32), rad(52), 7.5, linearTone([OCX - 42, OCY - 42], [OCX + 52, OCY + 52], 0.02, 0.85), {
            color: PAL.brassDk,
            opacity: 0.56,
        });
        let sunRays = "";
        for (let i = 0; i < 16; i++) {
            const a = (i / 16) * TAU;
            const rOut = i % 2 === 0 ? 96 : 82;
            sunRays += `M${f(OCX + Math.cos(a) * 68)} ${f(OCY + Math.sin(a) * 68)}L${f(OCX + Math.cos(a) * rOut)} ${f(OCY + Math.sin(a) * rOut)}`;
        }
        p.burinContour(sunRays + circlePath(OCX, OCY, 68), PAL.ink, 0.82, 0.86, 17);
        p.flush();
        // =========================================================================
        // LAYER D: MUSEUM UNROLLED SILK LANDSCAPE HANDSCROLL (`绢本青绿山水卷`)
        // =========================================================================
        const bx0 = sx0 - 40;
        const bx1 = sx1 + 40;
        const by0 = sy0 - 34;
        const by1 = sy1 + 34;
        p.fillPath(polyPath([[bx0 - 18, by0 + 14], [bx1 + 32, by0 + 14], [bx1 + 38, by1 + 22], [bx0 - 12, by1 + 22]]), PAL.cut, 0.34);
        const brocadeRing = polyPath([[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]]) + polyPath(hole);
        p.fillPath(brocadeRing, brocadeGrad, 0.99, true);
        // Triple museum silk mounting borders (`绫边 / 隔水 / 细金线`) + dense `PathBatcher` damask fretwork!
        const scB = new PathBatcher();
        const r1 = [[sx0 - 7, sy0 - 7], [sx1 + 7, sy0 - 7], [sx1 + 7, sy1 + 7], [sx0 - 7, sy1 + 7]];
        const r2 = [[sx0 - 14, sy0 - 13], [sx1 + 14, sy0 - 13], [sx1 + 14, sy1 + 13], [sx0 - 14, sy1 + 13]];
        const r3 = [[sx0 - 21, sy0 - 19], [sx1 + 21, sy0 - 19], [sx1 + 21, sy1 + 19], [sx0 - 21, sy1 + 19]];
        scB.addPath("gold", polyPath(r1), { stroke: PAL.brassDk, strokeWidth: 0.82, strokeOpacity: 0.88, nonScaling: "contour" });
        scB.addPath("hair", polyPath(r2) + polyPath(r3), { stroke: PAL.inkHair, strokeWidth: 0.4, strokeOpacity: 0.62, nonScaling: "hatch" });
        scB.addPath("rim", polyPath(hole), { stroke: PAL.inkSepia, strokeWidth: 0.72, strokeOpacity: 0.84, nonScaling: "contour" });
        for (let x = bx0 + 16; x < bx1 - 14; x += 18) {
            scB.line("weave", x, by0 + 3, x, sy0 - 20, { stroke: PAL.celadonDk, strokeWidth: 0.34, strokeOpacity: 0.36, nonScaling: "hatch" });
            scB.line("weave", x, sy1 + 20, x, by1 - 3, { stroke: PAL.celadonDk, strokeWidth: 0.34, strokeOpacity: 0.36, nonScaling: "hatch" });
        }
        for (const [cx, cy, dx, dy] of [
            [bx0 + 6, by0 + 6, 1, 1],
            [bx1 - 6, by0 + 6, -1, 1],
            [bx0 + 6, by1 - 6, 1, -1],
            [bx1 - 6, by1 - 6, -1, -1],
        ]) {
            scB.addPath("fret", `M${f(cx)} ${f(cy)}H${f(cx + dx * 22)}V${f(cy + dy * 14)}H${f(cx + dx * 8)}V${f(cy + dy * 7)}H${f(cx + dx * 15)}M${f(cx)} ${f(cy)}V${f(cy + dy * 20)}H${f(cx + dx * 16)}`, { stroke: PAL.celadonDk, strokeWidth: 0.4, strokeOpacity: 0.5, nonScaling: "hatch" });
        }
        scB.flush(p);
        // Twin vermilion collector's chop seals (`鉴藏印`) on the lower-left & upper-right celadon mounting silk!
        for (const [sealX, sealY] of [
            [bx0 + 10, sy1 - 24],
            [bx0 + 10, sy1 - 48],
        ]) {
            p.fillPath(polyPath([[sealX, sealY], [sealX + 15, sealY], [sealX + 15, sealY + 17], [sealX, sealY + 17]]), PAL.cinnabar, 0.9);
            p.burinContour(polyPath([[sealX + 2, sealY + 2], [sealX + 13, sealY + 2], [sealX + 13, sealY + 15], [sealX + 2, sealY + 15]]) +
                `M${f(sealX + 4.5)} ${f(sealY + 6)}H${f(sealX + 10.5)}M${f(sealX + 7.5)} ${f(sealY + 4)}V${f(sealY + 13)}M${f(sealX + 4.5)} ${f(sealY + 11)}H${f(sealX + 10.5)}`, PAL.paper, 0.52, 0.88, 4);
        }
        // Turned Ebony, Jade & Brass Scroll Roller Rods (`木轴 + 玉/铜轴头`)
        for (const [rx0, rx1, isLeft] of [
            [bx0 - 28, bx0 + 3, true],
            [bx1 - 3, bx1 + 30, false],
        ]) {
            const rodMid = (rx0 + rx1) * 0.5;
            const cyl = [[rx0, by0 - 6], [rx1, by0 - 6], [rx1, by1 + 6], [rx0, by1 + 6]];
            p.fillPath(polyPath(cyl), PAL.paperStone, 0.98);
            p.fillPath(polyPath([[rx0, by0 - 6], [rodMid, by0 - 6], [rodMid, by1 + 6], [rx0, by1 + 6]]), PAL.paperWarm, 0.78);
            p.fillPath(polyPath([[rodMid + 4, by0 - 6], [rx1, by0 - 6], [rx1, by1 + 6], [rodMid + 4, by1 + 6]]), PAL.umber, 0.36);
            p.burinContour(polyPath(cyl), PAL.ink, 0.82, 0.85, 4);
            for (const [ky0, ky1] of [
                [by0 - 38, by0 - 6],
                [by1 + 6, by1 + 38],
            ]) {
                const knob = [[rx0 + 4, ky0], [rx1 - 4, ky0], [rx1 - 2, ky1], [rx0 + 2, ky1]];
                p.fillPath(polyPath(knob), PAL.barkDk, 0.98);
                p.fillPath(polyPath([[rx0 + 4, ky0 + 8], [rx1 - 4, ky0 + 8], [rx1 - 4, ky0 + 15], [rx0 + 4, ky0 + 15]]), PAL.brassLt, 0.94);
                p.fillPath(polyPath([[rx0 + 6, ky0 - 5], [rx1 - 6, ky0 - 5], [rx1 - 6, ky0 + 2], [rx0 + 6, ky0 + 2]]), PAL.celadonLt, 0.92);
                p.burinContour(polyPath(knob), PAL.ink, 0.72, 0.85, 4);
            }
            if (!isLeft) {
                const tie = sample(cubic([rx1, scy - 16], [rx1 + 52, scy + 18], [rx1 + 34, scy + 88], [rx1 + 92, scy + 132]), 14);
                p.pressuredRibbon(tie, 7.5, PAL.cinnabar, 0.92, 0.3);
                p.burinContour(openPoly(tie), PAL.cinnabarDk, 0.5, 0.65, 1);
            }
        }
        // Two solid engraved brass bar paperweights (`铜镇纸`)
        const w1 = [[sx0 + 12, sy0 - 29], [sx0 + 205, sy0 - 28], [sx0 + 205, sy0 - 12], [sx0 + 12, sy0 - 13]];
        p.fillPath(polyPath(w1.map(([x, y]) => [x + 4, y + 5])), PAL.cut, 0.28);
        p.fillPath(polyPath(w1), brassGrad, 0.98);
        p.fillPath(polyPath([[sx0 + 14, sy0 - 28], [sx0 + 203, sy0 - 27], [sx0 + 203, sy0 - 22], [sx0 + 14, sy0 - 23]]), PAL.brassLt, 0.68);
        p.fillPath(circlePath(sx0 + 108, sy0 - 20, 7.2), PAL.brassLt, 0.94);
        p.burinContour(polyPath(w1) + circlePath(sx0 + 108, sy0 - 20, 7.2), PAL.ink, 0.72, 0.86, 5);
        const w2 = [[sx1 - 215, sy1 + 12], [sx1 - 16, sy1 + 13], [sx1 - 16, sy1 + 29], [sx1 - 215, sy1 + 28]];
        p.fillPath(polyPath(w2.map(([x, y]) => [x + 4, y + 5])), PAL.cut, 0.28);
        p.fillPath(polyPath(w2), brassGrad, 0.98);
        p.fillPath(polyPath([[sx1 - 213, sy1 + 13], [sx1 - 18, sy1 + 14], [sx1 - 18, sy1 + 19], [sx1 - 213, sy1 + 18]]), PAL.brassLt, 0.65);
        p.fillPath(circlePath(sx1 - 115, sy1 + 20, 7.2), PAL.brassLt, 0.94);
        p.burinContour(polyPath(w2) + circlePath(sx1 - 115, sy1 + 20, 7.2), PAL.ink, 0.72, 0.86, 5);
        // =========================================================================
        // LAYER E: CROWDED ATELIER WORKBENCH INSTRUMENTS (`5x` MICRO-CRAFT!)
        // Celestial Globe, Marine Chronometer Box, 70-Row Ephemeris Ledger, Sextant,
        // Dividers, Inkstone, Quill, Porcelain Teacup & Glowing Emerald Desk Lamp!
        // =========================================================================
        // 1. Vintage Brass-Meridian Celestial Table Globe (`cx = 2135, cy = 845, r = 136`) with 24-deg meridian ticks!
        const glX = 2135;
        const glY = 845;
        const glR = 136;
        p.fillPath(ellipsePath(glX + 12, glY + 210, 118, 22), PAL.cut, 0.34);
        p.fillPath(polyPath([[glX - 78, glY + 204], [glX + 78, glY + 204], [glX + 54, glY + 174], [glX - 54, glY + 174]]), PAL.barkDk, 0.99);
        p.fillPath(polyPath([[glX - 18, glY + 148], [glX + 18, glY + 148], [glX + 26, glY + 178], [glX - 26, glY + 178]]), PAL.brass, 0.96);
        p.fillPath(circlePath(glX, glY, glR + 18) + circlePath(glX, glY, glR + 4), brassGrad, 0.96, true);
        p.fillPath(circlePath(glX, glY, glR), globeGrad, 0.99);
        p.fillPath(closedSmooth([[glX - 78, glY - 52], [glX - 18, glY - 82], [glX + 42, glY - 38], [glX + 12, glY + 28], [glX - 64, glY + 14]]), PAL.malachite, 0.72);
        p.fillPath(closedSmooth([[glX + 26, glY + 12], [glX + 94, glY - 18], [glX + 102, glY + 56], [glX + 38, glY + 84]]), PAL.ochre, 0.68);
        const glB = new PathBatcher();
        for (const fRx of [0.25, 0.5, 0.78])
            glB.addPath("grat", ellipsePath(glX, glY, glR * fRx, glR), { stroke: PAL.inkDraft, strokeWidth: 0.4, strokeOpacity: 0.62, nonScaling: "hatch" });
        for (const fRy of [0.28, 0.56, 0.82])
            glB.addPath("grat", ellipsePath(glX, glY, glR, glR * fRy), { stroke: PAL.inkDraft, strokeWidth: 0.4, strokeOpacity: 0.62, nonScaling: "hatch" });
        for (let t = 0; t < 36; t++) {
            const a = (t / 36) * TAU;
            glB.line("mTick", glX + Math.cos(a) * (glR + 5), glY + Math.sin(a) * (glR + 5), glX + Math.cos(a) * (glR + 17), glY + Math.sin(a) * (glR + 17), {
                stroke: PAL.ink,
                strokeWidth: 0.42,
                strokeOpacity: 0.72,
                nonScaling: "hatch",
            });
        }
        glB.quad("horiz", [glX - glR - 32, glY - 8], [glX + glR + 32, glY - 8], [glX + glR + 28, glY + 10], [glX - glR - 28, glY + 10], { fill: brassGrad, fillOpacity: 0.96, stroke: PAL.ink, strokeWidth: 0.72, nonScaling: "contour" });
        glB.flush(p);
        p.moonRim(sample((t) => add([glX, glY], polar(glR, t * TAU)), 32), { widthPx: 0.9 });
        // 2. Mahogany-Boxed Brass Marine Chronometer (`x = 1230..1398, y = 1275..1445`)!
        const chX = 1314;
        const chY = 1362;
        const chB = new PathBatcher();
        chB.rect("sh", chX - 78, chY - 76, 168, 168, { fill: PAL.cut, fillOpacity: 0.3 });
        chB.rect("box", chX - 82, chY - 82, 164, 164, { fill: PAL.barkDk, fillOpacity: 0.99 });
        chB.rect("inlay", chX - 74, chY - 74, 148, 148, { fill: PAL.umber, fillOpacity: 0.95, stroke: PAL.brass, strokeWidth: 0.75, nonScaling: "contour" });
        // Brass corner guards + gimbal ring + silvered chronometer dial with subsidiary seconds & power-reserve dials!
        for (const [cx, cy] of [[chX - 80, chY - 80], [chX + 66, chY - 80], [chX - 80, chY + 66], [chX + 66, chY + 66]]) {
            chB.rect("corner", cx, cy, 14, 14, { fill: PAL.brass, fillOpacity: 0.96 });
        }
        chB.circle("gimbal", chX, chY, 64, { stroke: PAL.brassLt, strokeWidth: 1.05, strokeOpacity: 0.92, nonScaling: "contour" });
        chB.circle("bezel", chX, chY, 54, { fill: PAL.brass, fillOpacity: 0.98 });
        chB.circle("dial", chX, chY, 47, { fill: PAL.petal, fillOpacity: 0.99 });
        chB.circle("sub", chX, chY + 21, 13, { stroke: PAL.inkMid, strokeWidth: 0.42, strokeOpacity: 0.78, nonScaling: "hatch" });
        chB.circle("sub", chX, chY - 21, 11, { stroke: PAL.inkMid, strokeWidth: 0.42, strokeOpacity: 0.78, nonScaling: "hatch" });
        for (let i = 0; i < 60; i++) {
            const a = (i / 60) * TAU;
            const maj = i % 5 === 0;
            chB.line("tick", chX + Math.cos(a) * (maj ? 36 : 41), chY + Math.sin(a) * (maj ? 36 : 41), chX + Math.cos(a) * 45, chY + Math.sin(a) * 45, {
                stroke: PAL.ink,
                strokeWidth: maj ? 0.78 : 0.36,
                strokeOpacity: 0.85,
                nonScaling: "hatch",
            });
        }
        chB.line("hand", chX, chY, chX - 18, chY - 22, { stroke: PAL.prussianDk, strokeWidth: 1.15, strokeOpacity: 0.95, nonScaling: "contour" });
        chB.line("hand", chX, chY, chX + 28, chY - 12, { stroke: PAL.prussianDk, strokeWidth: 0.85, strokeOpacity: 0.95, nonScaling: "contour" });
        chB.line("sec", chX, chY + 21, chX + 6, chY + 13, { stroke: PAL.cinnabar, strokeWidth: 0.65, strokeOpacity: 0.92, nonScaling: "contour" });
        chB.flush(p);
        // 3. Brass Folding Mariner's Sextant with Vernier Arc Ticks (`x = 1515..1795, y = 1230..1485`)
        const sxP = [1575, 1255];
        const sxArc = sample((t) => add(sxP, polar(188, rad(24 + t * 58))), 14);
        const sxIn = sample((t) => add(sxP, polar(160, rad(82 - t * 58))), 14);
        p.fillPath(polyPath([...sxArc, ...sxIn]), PAL.brass, 0.96);
        p.pressuredRibbon([sxP, sxArc[0]], 8, PAL.brassDk, 0.96, 0.35);
        p.pressuredRibbon([sxP, sxArc[sxArc.length - 1]], 8, PAL.brassDk, 0.96, 0.35);
        p.pressuredRibbon([sxP, sxArc[6]], 6, PAL.brassLt, 0.96, 0.35);
        p.fillPath(circlePath(sxP[0], sxP[1], 18), PAL.brassLt, 0.98);
        let sextTicks = polyPath([...sxArc, ...sxIn]) + circlePath(sxP[0], sxP[1], 18);
        for (let t = 0; t <= 24; t++) {
            const a = rad(24 + (t / 24) * 58);
            const a0 = add(sxP, polar(162, a));
            const a1 = add(sxP, polar(t % 4 === 0 ? 184 : 176, a));
            sextTicks += `M${f(a0[0])} ${f(a0[1])}L${f(a1[0])} ${f(a1[1])}`;
        }
        p.burinContour(sextTicks, PAL.ink, 0.58, 0.84, 30);
        // 4. Open 70-Row Leather-Bound Ephemeris Ledger (lower-left oak table, PathBatcher!)
        const ledB = new PathBatcher();
        ledB.quad("sh", [92, 1244], [656, 1218], [680, 1556], [112, 1576], { fill: PAL.cut, fillOpacity: 0.3 });
        ledB.quad("cov", [80, 1230], [640, 1205], [664, 1542], [100, 1562], { fill: PAL.cinnabarDk, fillOpacity: 0.98 });
        const pageL = [[100, 1244], [360, 1230], [380, 1530], [118, 1546]];
        const pageR = [[364, 1230], [624, 1218], [644, 1524], [384, 1530]];
        ledB.quad("pgL", pageL[0], pageL[1], pageL[2], pageL[3], { fill: PAL.paper, fillOpacity: 0.99 });
        ledB.quad("pgR", pageR[0], pageR[1], pageR[2], pageR[3], { fill: PAL.paperWarm, fillOpacity: 0.99 });
        ledB.addPath("rib", polyPath([[370, 1528], [384, 1528], [396, 1590], [384, 1578], [376, 1594]]), { fill: PAL.cinnabar, fillOpacity: 0.95 });
        for (let row = 1; row <= 24; row++) {
            const v = row / 25;
            const a = lerp(pageL[0], pageL[3], v);
            const c = lerp(pageL[1], pageL[2], v);
            ledB.line("txt", a[0] + 16, a[1], c[0] - 16, c[1], { stroke: PAL.inkDraft, strokeWidth: row % 5 === 0 ? 0.55 : 0.34, strokeOpacity: 0.62, nonScaling: "hatch" });
        }
        for (const u of [0.25, 0.52, 0.78]) {
            const a = lerp(pageL[0], pageL[1], u);
            const c = lerp(pageL[3], pageL[2], u);
            ledB.line("txt", a[0], a[1] + 14, c[0], c[1] - 14, { stroke: PAL.inkDraft, strokeWidth: 0.36, strokeOpacity: 0.52, nonScaling: "hatch" });
        }
        // Intricate copperplate planetary orbital diagram + captions on right page
        ledB.circle("diag", 502, 1344, 62, { stroke: PAL.inkDraft, strokeWidth: 0.52, strokeOpacity: 0.78, nonScaling: "hatch" });
        ledB.circle("diag", 502, 1344, 42, { stroke: PAL.copper, strokeWidth: 0.45, strokeOpacity: 0.72, nonScaling: "hatch" });
        ledB.circle("diag", 502, 1344, 24, { stroke: PAL.inkDraft, strokeWidth: 0.4, strokeOpacity: 0.68, nonScaling: "hatch" });
        ledB.addPath("diag", ellipsePath(502, 1344, 62, 24) + ellipsePath(502, 1344, 24, 62), { stroke: PAL.inkDraft, strokeWidth: 0.38, strokeOpacity: 0.62, nonScaling: "hatch" });
        for (let r = 0; r < 6; r++) {
            const y = 1430 + r * 14;
            ledB.line("txt", 422, y, 594 - (r === 5 ? 48 : 0), y - 4, { stroke: PAL.inkMid, strokeWidth: 0.4, strokeOpacity: 0.62, nonScaling: "hatch" });
        }
        ledB.flush(p);
        // 5. Brass Proportional Dividers, Pocket Brass Compass, Porcelain Inkdish & Soapstone Chop
        const divPivot = [778, 1272];
        const divTipA = [972, 1492];
        const divTipB = [1082, 1372];
        p.pressuredRibbon([divPivot, divTipA], 11, PAL.brass, 0.96, 0.4);
        p.pressuredRibbon([divPivot, divTipB], 11, PAL.brassDk, 0.96, 0.4);
        p.fillPath(circlePath(divPivot[0], divPivot[1], 18), PAL.brassLt, 0.98);
        p.burinContour(`M${f(divPivot[0])} ${f(divPivot[1])}L${f(divTipA[0])} ${f(divTipA[1])}M${f(divPivot[0])} ${f(divPivot[1])}L${f(divTipB[0])} ${f(divTipB[1])}` +
            circlePath(divPivot[0], divPivot[1], 18) +
            circlePath(divPivot[0], divPivot[1], 6), PAL.ink, 0.78, 0.86, 4);
        p.fillPath(circlePath(1118, 1455, 50), PAL.brass, 0.96);
        p.fillPath(circlePath(1118, 1455, 40), PAL.petal, 0.98);
        p.fillPath(polyPath([[1118, 1420], [1126, 1455], [1118, 1490], [1110, 1455]]), PAL.cinnabar, 0.92);
        p.burinContour(circlePath(1118, 1455, 50) + circlePath(1118, 1455, 40) + `M1078 1455H1158M1118 1415V1495`, PAL.ink, 0.65, 0.82, 4);
        p.fillPath(ellipsePath(1168, 1184, 34, 18), PAL.paperWarm, 0.98);
        p.fillPath(ellipsePath(1168, 1184, 24, 12), PAL.prussianDk, 0.88);
        p.burinContour(ellipsePath(1168, 1184, 34, 18), PAL.ink, 0.62, 0.78, 1);
        p.fillPath(polyPath([[1224, 1164], [1248, 1164], [1248, 1206], [1224, 1206]]), PAL.celadon, 0.96);
        p.fillPath(polyPath([[1224, 1196], [1248, 1196], [1248, 1206], [1224, 1206]]), PAL.cinnabar, 0.92);
        // 6. Lower-Right Scholar's Inkstone, Celadon Teacup, Cinnabar Seal Paste Box & Calligraphy Brushes
        p.fillPath(ellipsePath(2145, 1285, 68, 42), PAL.slateDk, 0.96);
        p.fillPath(ellipsePath(2136, 1280, 42, 26), PAL.cut, 0.88);
        p.burinContour(ellipsePath(2145, 1285, 68, 42), PAL.litEdge, 0.65, 0.72, 1);
        // Celadon porcelain scholar's teacup & saucer at `(1940, 1225)`
        p.fillPath(circlePath(1945, 1232, 44), PAL.cut, 0.24);
        p.fillPath(circlePath(1940, 1226, 44), PAL.celadonLt, 0.96);
        p.fillPath(circlePath(1940, 1226, 28), PAL.paperWarm, 0.98);
        p.fillPath(circlePath(1940, 1226, 22), PAL.ochre, 0.76); // amber oolong tea!
        p.burinContour(circlePath(1940, 1226, 44) + circlePath(1940, 1226, 28), PAL.ink, 0.6, 0.75, 2);
        p.fillPath(circlePath(2065, 1430, 36), PAL.paperWarm, 0.98);
        p.fillPath(circlePath(2065, 1430, 26), PAL.cinnabar, 0.94);
        p.burinContour(circlePath(2065, 1430, 36), PAL.ink, 0.72, 0.82, 1);
        p.pressuredRibbon([[1955, 1505], [2235, 1385]], 9, PAL.ochre, 0.96, 0.35);
        p.fillPath(closedSmooth([[1955, 1505], [1926, 1524], [1915, 1512], [1942, 1496]]), PAL.ink, 0.94);
        // 7. Articulated Emerald-Shade Brass Banker's Desk Lamp casting warm nocturnal glow over scroll & globe!
        p.fillPath(polyPath([[2025, 578], [2145, 578], [2130, 555], [2040, 555]]), PAL.brassDk, 0.98);
        const neck = sample(cubic([2085, 555], [2110, 425], [2015, 388], [1932, 462]), 16);
        p.pressuredRibbon(neck, 11.5, PAL.brass, 0.98, 0.35);
        p.burinContour(openPoly(neck), PAL.brassLt, 0.65, 0.75, 1);
        const shade = [[1858, 510], [1992, 476], [1966, 438], [1892, 456]];
        p.fillPath(polyPath(shade), PAL.malachite, 0.98);
        p.fillPath(polyPath([[1868, 508], [1985, 478], [1974, 496], [1880, 520]]), PAL.lanternCore, 0.94);
        p.burinContour(polyPath(shade), PAL.ink, 0.82, 0.88, 4);
        p.layer("var(--z-halo-op)", () => {
            p.animGroup({ kind: "pulse", baseOp: 0.88, ampOp: 0.12, freq: 1.5, phase: 0.9 }, () => {
                p.fillPath(circlePath(1915, 615, 680), lampConeGrad, 0.96);
                p.fillPath(ellipsePath(1926, 500, 68, 24), PAL.lanternCore, 0.84);
            });
        });
        // Swaying hanging brass astrolabe lamp in upper star-chart alcove
        p.hangingLantern({
            cx: 1120,
            cy: 118,
            w: 70,
            h: 70,
            cordLen: 185,
            style: "astrolabe",
            swayAmp: 2.2,
            freq: 0.85,
            phase: 0.6,
        });
    }, false, "scroll-clip");
    p.flush();
    return {
        index: 9,
        id: "s09-orrery",
        title: "Celestial Orrery & Scroll Table",
        subtitle: "Geared Copernican brass & unrolled silk handscroll",
        portal: S09_PORTAL,
        coreColorDay: [244, 240, 229],
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
