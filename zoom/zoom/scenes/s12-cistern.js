// S12: Piranesi Subterranean Waterworks (Stage-5 5x Micro-Craft & PathBatcher Edition)
// Asymmetric off-center architectural vault with vaulted stone canal arch at (1520, 840) -> S13 Geode:
// Three receding depth tiers of Roman brick cross-vaults & colonnades (outer arcade, mid inner gallery,
// deep third-plane vaults with groin ribs & classical fluted pilasters + Ionic capitals), 0.35px running-bond
// Roman brickwork batched via PathBatcher, iron pulley cranes hoisting dressed stone blocks, spoked iron-&-timber
// overshot waterwheel with riveted rim strapping, 24 dripping buckets & 5-gear horological train + sluice winch
// (data-anim="rotate"), crisscrossing lattice iron catwalks (trussBridgeSpan) with 22 tiny lantern-bearing scale
// figures, 5 full wrought-iron caged arcade cressets with silky radial Night glows, streaky gouache/copperplate
// cascades, 5-tone wet pier moss, and a splayed vaulted canal arch with carved classical keystone framing S13!
import { PAL, Painter, PathBatcher, TAU, add, archDoorwayHole, bilerp, circlePath, closedSmooth, cubic, ellipsePath, f, lerp, linearTone, openPoly, polar, polyPath, quad, rad, rand, sample, trussBridgeSpan, } from "../kit.js";
import { BLEED, requiredPortalClearBox, requiredPortalSealBox, } from "./types.js";
export const S12_PORTAL = { cx: 1520, cy: 840, rx: 192, ry: 150 };
const S13_PORTAL_PT = [880, 970];
export function buildS12Cistern() {
    const p = new Painter("s12", 12071);
    const sealBox = requiredPortalSealBox(S12_PORTAL);
    const clearBox = requiredPortalClearBox(S12_PORTAL, S13_PORTAL_PT);
    // Widened monumental Roman vaulted canal arch (~408 x 304 px, strictly inside 484x328 sealBox
    // and cleanly enclosing S=6x viewport [1320..1720] so zero jamb/scroll strip crops day-o13.png!).
    const hole = archDoorwayHole(clearBox, {
        padL: 66,
        padR: 108,
        padTop: 22,
        padBot: 64,
        archRise: 68,
        sealBox,
    });
    const archPts = hole.slice(0, 21);
    const xL = archPts[0][0];
    const xR = archPts[archPts.length - 1][0];
    const ySpring = archPts[0][1];
    const yBot = hole[hole.length - 1][1];
    const archMidX = (xL + xR) * 0.5;
    const archHalfW = (xR - xL) * 0.5;
    const archRise = ySpring - archPts[10][1];
    const vaultGrad = p.linearGrad("vault", 180, -180, 2120, 1520, [
        [0, PAL.paperWarm],
        [0.24, PAL.paperStone],
        [0.56, PAL.paperShadow],
        [0.84, PAL.slate],
        [1, PAL.prussianDk],
    ]);
    const canalGrad = p.linearGrad("canal", 0, 1175, 0, 1880, [
        [0, PAL.prussian],
        [0.22, PAL.waterDeep],
        [0.62, PAL.water],
        [1, PAL.prussianDk],
    ]);
    const beamGrad = p.linearGrad("shaft", 160, -180, 980, 1340, [
        [0, PAL.paperWarm, 0.34],
        [0.54, PAL.ochreLt, 0.14],
        [1, PAL.paperWarm, 0.0],
    ]);
    // 1. Opaque full-bleed backdrop punched cleanly by the right-side Roman vaulted canal arch
    p.asymmetricPortalBackdrop(hole, vaultGrad, { smooth: false });
    // Compound-path batched Roman opus-mixtum masonry face (sunlit/shadow planes + 0.34px brick/ashlar joints!)
    const drawMasonryFace = (quadPts, opts) => {
        const [tl, tr, br, bl] = quadPts;
        const b = new PathBatcher();
        b.quad("base", tl, tr, br, bl, { fill: opts.fill, fillOpacity: 0.99 });
        if (opts.brickBands) {
            for (let r = 2; r < opts.rows - 1; r += 5) {
                const v0 = r / opts.rows;
                const v1 = Math.min(1, (r + 1.4) / opts.rows);
                b.quad("brickBand", lerp(tl, bl, v0), lerp(tr, br, v0), lerp(tr, br, v1), lerp(tl, bl, v1), {
                    fill: PAL.cinnabarLt,
                    fillOpacity: 0.24,
                });
            }
        }
        if (opts.glazeDark) {
            b.quad("sh", lerp(tl, tr, 0.44), tr, br, lerp(bl, br, 0.54), { fill: opts.glazeDark, fillOpacity: 0.28 });
        }
        if (opts.glazeLight) {
            b.quad("lt", tl, lerp(tl, tr, 0.36), lerp(bl, br, 0.28), bl, { fill: opts.glazeLight, fillOpacity: 0.22 });
        }
        // Ultra-fine 0.34px running-bond Roman brick & ashlar stone joints!
        const jStyle = {
            stroke: opts.jointColor ?? PAL.inkMid,
            strokeWidth: 0.34,
            strokeOpacity: opts.jointOp ?? 0.48,
            nonScaling: "hatch",
        };
        for (let r = 1; r < opts.rows; r++) {
            const v = r / opts.rows;
            const a = lerp(tl, bl, v);
            const c = lerp(tr, br, v);
            b.line("joint", a[0], a[1], c[0], c[1], jStyle);
        }
        for (let r = 0; r < opts.rows; r++) {
            const v0 = r / opts.rows;
            const v1 = (r + 1) / opts.rows;
            const stag = (r % 2) * 0.5;
            for (let c = 1; c < opts.cols; c++) {
                const u = (c + stag) / opts.cols;
                if (u <= 0.03 || u >= 0.97)
                    continue;
                const a = bilerp(tl, tr, br, bl, u, v0);
                const d = bilerp(tl, tr, br, bl, u, v1);
                b.line("joint", a[0], a[1], d[0], d[1], jStyle);
            }
        }
        b.line("arrLt", bl[0], bl[1], tl[0], tl[1], { stroke: PAL.litEdge, strokeWidth: 0.52, strokeOpacity: 0.54, nonScaling: "contour" });
        b.line("arrLt", tl[0], tl[1], tr[0], tr[1], { stroke: PAL.litEdge, strokeWidth: 0.52, strokeOpacity: 0.54, nonScaling: "contour" });
        b.line("arrDk", tr[0], tr[1], br[0], br[1], { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.7, nonScaling: "contour" });
        b.flush(p);
        if (opts.hatch) {
            p.burinHatch(quadPts, rad(opts.hatchAngle ?? 54), opts.hatchStep ?? 11, linearTone(tl, br, opts.tone0 ?? 0.14, opts.tone1 ?? 0.72), { color: PAL.ink, opacity: 0.42, cross: opts.cross, crossThresh: 0.54, step: 20 });
        }
    };
    // THREE-DEPTH PIRANESI ROMAN CROSS-VAULT ARCH BAY with receding inner colonnades, groin vault ribs,
    // carved fluted pilasters, classical Ionic/volute capitals, dentil cornice & coursed brick spandrels!
    const drawAqueductBay = (x0, x1, yTop, ySpringLine, yFloor, archH, depthDx, opts) => {
        const cx = (x0 + x1) * 0.5;
        const hw = (x1 - x0) * 0.5;
        const innerHW = hw * 0.72;
        const archCurve = [];
        for (let i = 0; i <= 16; i++) {
            const a = Math.PI + (i / 16) * Math.PI;
            archCurve.push([cx + Math.cos(a) * innerHW, ySpringLine + Math.sin(a) * archH]);
        }
        const b = new PathBatcher();
        const voidPoly = [[cx - innerHW, yFloor], ...archCurve, [cx + innerHW, yFloor]];
        b.addPath("void", polyPath(voidPoly), { fill: opts.recessedDark ?? PAL.prussianDk, fillOpacity: 0.92 });
        // Depth Planes 2 & 3: Receding double-nested Piranesi perspective cross-vault colonnade!
        if (opts.innerGallery) {
            // Plane 2: mid-depth arched bridge & vaulted gallery
            const subHW = innerHW * 0.62;
            const subSpring = ySpringLine + (yFloor - ySpringLine) * 0.18;
            const subArchH = archH * 0.64;
            const subCx = cx + depthDx * 0.36;
            const subCurve = [];
            for (let i = 0; i <= 12; i++) {
                const a = Math.PI + (i / 12) * Math.PI;
                subCurve.push([subCx + Math.cos(a) * subHW, subSpring + Math.sin(a) * subArchH]);
            }
            b.addPath("innerSpandrel", polyPath([
                [cx - innerHW, ySpringLine - archH * 0.24],
                [cx + innerHW, ySpringLine - archH * 0.24],
                [cx + innerHW, yFloor],
                [subCx + subHW, yFloor],
                ...[...subCurve].reverse(),
                [subCx - subHW, yFloor],
                [cx - innerHW, yFloor],
            ]), { fill: PAL.slate, fillOpacity: 0.62 });
            // Cross-vault groin ribs X-ing inside the deep tunnel soffit
            b.line("groin", cx - innerHW, ySpringLine, subCx + subHW, subSpring - subArchH * 0.6, {
                stroke: PAL.paperStone,
                strokeWidth: 0.45,
                strokeOpacity: 0.36,
                nonScaling: "hatch",
            });
            b.line("groin", cx + innerHW, ySpringLine, subCx - subHW, subSpring - subArchH * 0.6, {
                stroke: PAL.paperStone,
                strokeWidth: 0.45,
                strokeOpacity: 0.36,
                nonScaling: "hatch",
            });
            // Plane 3: deep third-tier vanishing arch & elevated distant bridge lintel!
            const farHW = subHW * 0.56;
            const farSpring = subSpring + (yFloor - subSpring) * 0.28;
            const farArchH = subArchH * 0.58;
            const farCx = subCx + depthDx * 0.28;
            const farCurve = [];
            for (let i = 0; i <= 10; i++) {
                const a = Math.PI + (i / 10) * Math.PI;
                farCurve.push([farCx + Math.cos(a) * farHW, farSpring + Math.sin(a) * farArchH]);
            }
            b.addPath("subVoid", polyPath([[subCx - subHW, yFloor], ...subCurve, [subCx + subHW, yFloor]]), {
                fill: PAL.prussian,
                fillOpacity: 0.86,
            });
            b.addPath("farVoid", polyPath([[farCx - farHW, yFloor], ...farCurve, [farCx + farHW, yFloor]]), {
                fill: PAL.cut,
                fillOpacity: 0.68,
            });
            // Distant recessed arch stringcourse & vault moldings
            b.addPath("innerRim", openPoly(subCurve) + openPoly(farCurve), {
                stroke: PAL.paperStone,
                strokeWidth: 0.48,
                strokeOpacity: 0.44,
                nonScaling: "hatch",
            });
            // Distant high bridge lintel spanning deep inside the vault
            const farBrY = subSpring + (yFloor - subSpring) * 0.56;
            b.rect("innerSpandrel", subCx - subHW, farBrY, subHW * 2, 7, { fill: PAL.slateLt, fillOpacity: 0.46 });
            if (Math.round(cx / 140) % 2 === 0) {
                b.circle("farLamp", farCx, farSpring + 22, 2.2, { fill: PAL.lanternCore, fillOpacity: 0.82 });
            }
        }
        // Exposed barrel-vault underside soffit thickness with coffered stone panels & ribs!
        const shiftedCurve = archCurve.map(([ax, ay]) => [ax + depthDx, ay + Math.abs(depthDx) * 0.24]);
        const soffitPoly = [...archCurve.slice(0, 10), ...shiftedCurve.slice(0, 10).reverse()];
        b.addPath("soffit", polyPath(soffitPoly), { fill: opts.soffit, fillOpacity: 0.94 });
        for (let i = 1; i < 9; i++) {
            b.line("soffitRib", archCurve[i][0], archCurve[i][1], shiftedCurve[i][0], shiftedCurve[i][1], {
                stroke: PAL.ink,
                strokeWidth: 0.44,
                strokeOpacity: 0.6,
                nonScaling: "hatch",
            });
            // Recessed coffer inset inside each soffit panel
            const ca = lerp(archCurve[i - 1], shiftedCurve[i - 1], 0.28);
            const cb = lerp(archCurve[i], shiftedCurve[i], 0.28);
            const cc = lerp(archCurve[i], shiftedCurve[i], 0.72);
            const cd = lerp(archCurve[i - 1], shiftedCurve[i - 1], 0.72);
            b.quad("coffer", ca, cb, cc, cd, { fill: PAL.slateDk, fillOpacity: 0.26 });
        }
        // Front spandrel masonry wall wrapping the arch opening
        const spandrelPoly = [
            [x0, yTop],
            [x1, yTop],
            [x1, yFloor],
            [cx + innerHW, yFloor],
            ...[...archCurve].reverse(),
            [cx - innerHW, yFloor],
            [x0, yFloor],
        ];
        b.addPath("spandrel", polyPath(spandrelPoly), { fill: opts.litWall, fillOpacity: 0.99 });
        if (opts.brickTone) {
            for (const bandY of [ySpringLine - 10, ySpringLine + (yFloor - ySpringLine) * 0.48]) {
                if (bandY + 12 < yFloor) {
                    b.rect("brickBand", x0, bandY, cx - innerHW - x0, 12, { fill: PAL.cinnabarLt, fillOpacity: 0.3 });
                    b.rect("brickBand", cx + innerHW, bandY, x1 - (cx + innerHW), 12, { fill: PAL.cinnabarLt, fillOpacity: 0.3 });
                }
            }
        }
        b.addPath("spandrelSh", polyPath([[cx, yTop], [x1, yTop], [x1, yFloor], [cx + innerHW, yFloor], ...archCurve.slice(8).reverse()]), { fill: opts.shadeWall, fillOpacity: 0.32 });
        // Ultra-fine 0.34px running-bond Roman brick courses across spandrels & piers!
        const courseRows = Math.max(12, Math.round((yFloor - yTop) / 11));
        const brickCol = opts.brickTone ? PAL.cinnabarDk : PAL.inkMid;
        for (let r = 1; r < courseRows; r++) {
            const yy = yTop + ((yFloor - yTop) * r) / courseRows;
            if (yy < ySpringLine - archH - 4) {
                b.line("brick", x0, yy, x1, yy, { stroke: brickCol, strokeWidth: 0.34, strokeOpacity: 0.4, nonScaling: "hatch" });
            }
            else if (yy < ySpringLine) {
                const dy = (ySpringLine - yy) / archH;
                const dx = innerHW * Math.sqrt(Math.max(0, 1 - dy * dy));
                b.line("brick", x0, yy, cx - dx, yy, { stroke: brickCol, strokeWidth: 0.34, strokeOpacity: 0.4, nonScaling: "hatch" });
                b.line("brick", cx + dx, yy, x1, yy, { stroke: brickCol, strokeWidth: 0.34, strokeOpacity: 0.4, nonScaling: "hatch" });
            }
            else {
                b.line("brick", x0, yy, cx - innerHW, yy, { stroke: brickCol, strokeWidth: 0.34, strokeOpacity: 0.4, nonScaling: "hatch" });
                b.line("brick", cx + innerHW, yy, x1, yy, { stroke: brickCol, strokeWidth: 0.34, strokeOpacity: 0.4, nonScaling: "hatch" });
            }
        }
        // Carved Classical Fluted Pilasters + Ionic Volute Capitals + Molded Plinths on Pier Faces!
        if (opts.pilasters) {
            const pierW = cx - innerHW - x0;
            const pilW = Math.min(24, pierW * 0.56);
            for (const px of [x0 + (pierW - pilW) * 0.5, x1 - (pierW + pilW) * 0.5]) {
                const capY = ySpringLine - 16;
                // Fluted pilaster shaft
                b.rect("pilaster", px, capY + 14, pilW, yFloor - capY - 26, { fill: PAL.paperWarm, fillOpacity: 0.88 });
                // 4 crisp vertical flutes
                for (let fl = 1; fl <= 3; fl++) {
                    const fx = px + (pilW * fl) / 4;
                    b.line("flute", fx, capY + 18, fx, yFloor - 16, { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.48, nonScaling: "hatch" });
                }
                // Carved classical Ionic/Corinthian capital with paired volute scrolls + abacus slab
                b.rect("cap", px - 5, capY, pilW + 10, 6, { fill: PAL.paperWarm, fillOpacity: 0.96 });
                b.rect("capSh", px - 3, capY + 6, pilW + 6, 8, { fill: PAL.paperStone, fillOpacity: 0.94 });
                b.circle("volFill", px - 2, capY + 10, 3.8, { fill: PAL.paperWarm });
                b.circle("volFill", px + pilW + 2, capY + 10, 3.8, { fill: PAL.paperWarm });
                b.circle("volStroke", px - 2, capY + 10, 3.8, { stroke: PAL.inkMid, strokeWidth: 0.42, nonScaling: "hatch" });
                b.circle("volStroke", px + pilW + 2, capY + 10, 3.8, { stroke: PAL.inkMid, strokeWidth: 0.42, nonScaling: "hatch" });
                // Stepped classical column plinth base
                b.rect("cap", px - 4, yFloor - 12, pilW + 8, 12, { fill: PAL.paperStone, fillOpacity: 0.95 });
            }
        }
        // Radiating dressed-stone voussoir arch ring + projecting carved keystone
        const vousOuter = archCurve.map(([ax, ay]) => [
            cx + (ax - cx) * 1.16,
            ySpringLine + (ay - ySpringLine) * 1.18,
        ]);
        b.addPath("vous", polyPath([...archCurve, ...[...vousOuter].reverse()]), { fill: PAL.paperWarm, fillOpacity: 0.92 });
        b.addPath("vousLine", openPoly(archCurve) + openPoly(vousOuter), {
            stroke: PAL.ink,
            strokeWidth: 0.58,
            strokeOpacity: 0.76,
            nonScaling: "contour",
        });
        for (let i = 0; i < archCurve.length; i++) {
            b.line("vousLine", archCurve[i][0], archCurve[i][1], vousOuter[i][0], vousOuter[i][1], {
                stroke: PAL.ink,
                strokeWidth: 0.52,
                strokeOpacity: 0.72,
                nonScaling: "contour",
            });
        }
        const ks = [
            [cx - 11, ySpringLine - archH * 1.26],
            [cx + 11, ySpringLine - archH * 1.26],
            [cx + 7, ySpringLine - archH * 0.95],
            [cx - 7, ySpringLine - archH * 0.95],
        ];
        b.addPath("ksFill", polyPath(ks), { fill: PAL.paperWarm, fillOpacity: 0.96 });
        b.addPath("ksStroke", polyPath(ks), { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.78, nonScaling: "contour" });
        // Molded classical cornice with dentil tooth row along top of aqueduct tier!
        b.rect("cornice", x0 - 4, yTop, x1 - x0 + 8, 10, { fill: PAL.paperWarm, fillOpacity: 0.96 });
        b.rect("corniceSh", x0 - 2, yTop + 10, x1 - x0 + 4, 7, { fill: PAL.slateDk, fillOpacity: 0.36 });
        for (let dx = x0 + 6; dx < x1 - 6; dx += 12) {
            b.rect("dentil", dx, yTop + 10, 5, 5, { fill: PAL.paperWarm, fillOpacity: 0.88 });
        }
        b.line("corniceLine", x0 - 4, yTop, x1 + 4, yTop, { stroke: PAL.ink, strokeWidth: 0.68, strokeOpacity: 0.76, nonScaling: "contour" });
        b.line("corniceLine", x0 - 2, yTop + 10, x1 + 2, yTop + 10, { stroke: PAL.ink, strokeWidth: 0.52, strokeOpacity: 0.7, nonScaling: "contour" });
        b.flush(p);
        p.burinHatch(voidPoly, rad(46), 13, linearTone([cx - innerHW, ySpringLine - archH], [cx + innerHW, yFloor], 0.76, 0.2), {
            color: PAL.ink,
            opacity: 0.42,
            cross: true,
            crossThresh: 0.5,
            step: 26,
        });
    };
    p.clippedToBackdrop(hole, () => {
        // 2. High Vaulted Coffered Ceiling Ribs & Soaring Upper Roman Aqueduct Colonnade (y = -280..450)
        const ceilB = new PathBatcher();
        for (let i = 0; i < 4; i++) {
            const yy = -180 + i * 112;
            const ribPts = sample(quad([BLEED.x0, yy + 135], [920, yy - 62], [BLEED.x1, yy + 175]), 22);
            const ribBot = ribPts.map(([rx, ry]) => [rx, ry + 34]);
            ceilB.addPath(i % 2 === 0 ? "ribA" : "ribB", polyPath([...ribPts, ...[...ribBot].reverse()]), {
                fill: i % 2 === 0 ? PAL.paperStone : PAL.slate,
                fillOpacity: 0.78,
            });
            ceilB.addPath("ribLine", openPoly(ribPts) + openPoly(ribBot), {
                stroke: PAL.inkMid,
                strokeWidth: 0.48,
                strokeOpacity: 0.56,
                nonScaling: "hatch",
            });
            for (let k = 1; k < ribPts.length - 1; k++) {
                ceilB.line("ribLine", ribPts[k][0], ribPts[k][1], ribBot[k][0], ribBot[k][1], {
                    stroke: PAL.inkMid,
                    strokeWidth: 0.42,
                    strokeOpacity: 0.5,
                    nonScaling: "hatch",
                });
            }
        }
        ceilB.flush(p);
        // Tier 1: 10 soaring Roman aqueduct colonnade bays WITH 3-plane cross-vaults & fluted Ionic pilasters!
        const tier1Bays = [
            [-260, 20],
            [20, 300],
            [300, 580],
            [580, 860],
            [860, 1140],
            [1140, 1420],
            [1420, 1700],
            [1700, 2020],
            [2020, 2360],
            [2360, 2720],
        ];
        for (let i = 0; i < tier1Bays.length; i++) {
            const [bx0, bx1] = tier1Bays[i];
            drawAqueductBay(bx0, bx1, 72, 238, 446, 98, 22, {
                litWall: i % 3 === 1 ? PAL.paperDeep : PAL.paperStone,
                shadeWall: PAL.slate,
                soffit: PAL.paperShadow,
                brickTone: true,
                recessedDark: PAL.prussian,
                innerGallery: true,
                pilasters: true,
            });
        }
        // Piranesi Overhead Timber-&-Iron Pulley Hoists suspended from the high vault (hoisting dressed stone blocks!)
        const hoistB = new PathBatcher();
        for (const [hx, hyTop, blockY] of [
            [1132, 84, 336],
            [1688, 84, 312],
        ]) {
            // Twin iron hoist chains + brass pulley wheel + iron grab tongs + dressed ashlar block
            hoistB.line("chain", hx - 7, hyTop, hx - 7, blockY, { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.82, nonScaling: "contour" });
            hoistB.line("chain", hx + 7, hyTop, hx + 7, blockY, { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.82, nonScaling: "contour" });
            hoistB.circle("pulFill", hx, hyTop + 34, 11, { fill: PAL.brass });
            hoistB.circle("pulFill", hx, blockY - 14, 8, { fill: PAL.brass });
            hoistB.rect("blkFill", hx - 22, blockY, 44, 24, { fill: PAL.paperWarm });
            hoistB.rect("blkSh", hx + 4, blockY, 18, 24, { fill: PAL.slate, fillOpacity: 0.42 });
            hoistB.circle("pulRim", hx, hyTop + 34, 11, { stroke: PAL.ink, strokeWidth: 0.65, nonScaling: "contour" });
            hoistB.circle("pulRim", hx, blockY - 14, 8, { stroke: PAL.ink, strokeWidth: 0.6, nonScaling: "contour" });
            hoistB.rect("blkRim", hx - 22, blockY, 44, 24, { stroke: PAL.ink, strokeWidth: 0.6, nonScaling: "contour" });
        }
        hoistB.flush(p);
        // Slanting shafts of warm dusty light pouring down from high clerestory arches (Day)
        p.fillPath(polyPath([[45, 110], [285, 110], [880, 1280], [520, 1280]]), beamGrad, 0.84);
        p.fillPath(polyPath([[340, 125], [545, 125], [1040, 1190], [790, 1190]]), beamGrad, 0.62);
        // 3. High Arched Piranesi Iron-Truss Catwalk, Stone Corbels & Tiny Lantern-Bearers (y = 446)
        trussBridgeSpan(p, {
            p0: [BLEED.x0, 446],
            p1: [BLEED.x1, 446],
            depth: 24,
            bays: 64,
            kind: "x-truss",
            steelColor: PAL.slateDk,
            highlightColor: PAL.paperWarm,
            deck: false,
        });
        const catwalkY = 446;
        const catB = new PathBatcher();
        catB.rect("deck", BLEED.x0, catwalkY - 3, BLEED.x1 - BLEED.x0, 7, { fill: PAL.paperWarm, fillOpacity: 0.96 });
        catB.line("rail", BLEED.x0, catwalkY - 24, BLEED.x1, catwalkY - 24, { stroke: PAL.ink, strokeWidth: 0.68, strokeOpacity: 0.84, nonScaling: "contour" });
        catB.line("rail", BLEED.x0, catwalkY - 13, BLEED.x1, catwalkY - 13, { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.68, nonScaling: "hatch" });
        for (let x = -220; x < 2620; x += 20) {
            catB.line("post", x, catwalkY - 24, x, catwalkY - 2, { stroke: PAL.ink, strokeWidth: 0.46, strokeOpacity: 0.72, nonScaling: "hatch" });
            if (x % 40 === 0) {
                // Crisscross wrought-iron filigree diamond balustrade
                catB.line("lat", x, catwalkY - 24, x + 20, catwalkY - 2, { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.48, nonScaling: "hatch" });
                catB.line("lat", x + 20, catwalkY - 24, x, catwalkY - 2, { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.48, nonScaling: "hatch" });
            }
            if (x % 60 === 0) {
                catB.quad("corbel", [x - 5, catwalkY + 24], [x + 5, catwalkY + 24], [x + 2, catwalkY + 46], [x - 2, catwalkY + 46], {
                    fill: PAL.slate,
                    fillOpacity: 0.86,
                });
            }
        }
        catB.flush(p);
        // 10 Tiny Catwalk Lantern-Bearers (15-18px tall!) giving monumental Piranesi scale!
        p.scaleFigures([
            { x: 185, y: catwalkY - 2, h: 17, coat: PAL.cinnabar, kind: "coat", dir: 1 },
            { x: 222, y: catwalkY - 2, h: 16, coat: PAL.slateDk, kind: "coat", dir: 1 },
            { x: 468, y: catwalkY - 2, h: 16, coat: PAL.prussianLt, kind: "coat", dir: 1 },
            { x: 645, y: catwalkY - 2, h: 17, coat: PAL.ochre, kind: "coat", dir: -1 },
            { x: 960, y: catwalkY - 2, h: 16, coat: PAL.cinnabarLt, kind: "dress", dir: 1 },
            { x: 992, y: catwalkY - 2, h: 17, coat: PAL.prussian, kind: "coat", dir: 1 },
            { x: 1218, y: catwalkY - 2, h: 16, coat: PAL.paperWarm, kind: "coat", dir: -1 },
            { x: 1410, y: catwalkY - 2, h: 16, coat: PAL.ochre, kind: "coat", dir: -1 },
            { x: 1745, y: catwalkY - 2, h: 17, coat: PAL.cinnabar, kind: "coat", dir: 1 },
            { x: 1885, y: catwalkY - 2, h: 17, coat: PAL.slateDk, kind: "coat", dir: -1 },
        ], { shadowDir: [1.1, 0.24], shadowOpacity: 0.24 });
        const walkerLamps = [
            [194, catwalkY - 11],
            [636, catwalkY - 11],
            [984, catwalkY - 11],
            [1402, catwalkY - 11],
            [1754, catwalkY - 11],
        ];
        let wlHalo1 = "";
        let wlHalo2 = "";
        let wlCore = "";
        for (const [lx, ly] of walkerLamps) {
            wlHalo1 += circlePath(lx, ly, 36);
            wlHalo2 += circlePath(lx, ly, 16);
            wlCore += circlePath(lx, ly, 3.0);
        }
        p.layer("var(--z-halo-op)", () => {
            p.fillPath(wlHalo1, PAL.lanternHalo, 0.14);
            p.fillPath(wlHalo2, PAL.lantern, 0.3);
        });
        p.fillPath(wlCore, PAL.lanternCore, 0.96);
        // 4. Lower Monumental Aqueduct Arcade (3 full vaulted bays with classical pilasters!)
        drawAqueductBay(-260, 145, 472, 745, 1185, 165, 32, {
            litWall: PAL.paperWarm,
            shadeWall: PAL.slate,
            soffit: PAL.paperShadow,
            brickTone: true,
            recessedDark: PAL.prussianDk,
            pilasters: true,
        });
        drawAqueductBay(145, 875, 472, 745, 1185, 215, 40, {
            litWall: PAL.paperStone,
            shadeWall: PAL.slateDk,
            soffit: PAL.umberLt,
            brickTone: true,
            recessedDark: PAL.prussianDk,
            innerGallery: true,
        });
        drawAqueductBay(875, 1235, 472, 725, 1185, 155, 26, {
            litWall: PAL.paperWarm,
            shadeWall: PAL.slate,
            soffit: PAL.paperShadow,
            brickTone: true,
            recessedDark: PAL.prussianDk,
            innerGallery: true,
            pilasters: true,
        });
        // Monumental Left Foreground Masonry Pier & Carved Bronze Lion/Medusa Water-Spout
        drawMasonryFace([[-380, 465], [150, 465], [150, 1215], [-380, 1215]], {
            fill: PAL.paperStone,
            glazeDark: PAL.slate,
            glazeLight: PAL.paperWarm,
            brickBands: true,
            rows: 40,
            cols: 12,
            hatch: true,
            hatchAngle: 52,
            hatchStep: 11,
            cross: true,
            tone0: 0.08,
            tone1: 0.6,
        });
        // Sculpted bronze gargoyle/Medusa water-spout mask + flanged collar
        const spoutB = new PathBatcher();
        spoutB.quad("spBody", [96, 680], [156, 682], [164, 718], [96, 726], { fill: PAL.brassDk, fillOpacity: 0.96 });
        spoutB.quad("spHi", [96, 680], [156, 682], [156, 695], [96, 695], { fill: PAL.brassLt, fillOpacity: 0.52 });
        spoutB.circle("spMask", 118, 703, 14, { fill: PAL.brass, fillOpacity: 0.96 });
        spoutB.circle("spMaskRim", 118, 703, 14, { stroke: PAL.ink, strokeWidth: 0.65, nonScaling: "contour" });
        spoutB.circle("spEye", 114, 700, 2.2, { fill: PAL.ink });
        spoutB.circle("spEye", 122, 700, 2.2, { fill: PAL.ink });
        spoutB.flush(p);
        // 5. Monumental Right Rusticated Basalt & Ashlar Bastion Wall (x = 1215..BLEED.x1, y = 472..1200)
        drawMasonryFace([[1215, 472], [1985, 472], [1985, 1200], [1215, 1200]], {
            fill: PAL.paperDeep,
            glazeDark: PAL.slateDk,
            glazeLight: PAL.paperWarm,
            brickBands: true,
            rows: 42,
            cols: 16,
            jointColor: PAL.inkMid,
            jointOp: 0.52,
            hatch: true,
            hatchAngle: 128,
            hatchStep: 12,
            tone0: 0.16,
            tone1: 0.62,
        });
        drawMasonryFace([[1186, 472], [1218, 492], [1218, 1200], [1186, 1200]], {
            fill: PAL.paperWarm,
            glazeDark: PAL.paperStone,
            rows: 36,
            cols: 2,
            jointColor: PAL.inkMid,
            hatch: true,
            hatchAngle: 52,
            hatchStep: 10,
            tone0: 0.08,
            tone1: 0.42,
        });
        // Upper Blind Relief Arcade & Dentil Pediment crowning the bastion ABOVE the vaulted canal arch (y = 490..638)
        for (const [ax0, ax1] of [
            [1260, 1412],
            [1432, 1592],
            [1612, 1764],
        ]) {
            drawAqueductBay(ax0, ax1, 490, 574, 632, 46, 12, {
                litWall: PAL.paperStone,
                shadeWall: PAL.slate,
                soffit: PAL.paperShadow,
                brickTone: true,
                recessedDark: PAL.slateDk,
            });
            // Recessed coursed Roman brickwork + secondary radial brick relieving-arch joints inside each blind niche!
            const nCx = (ax0 + ax1) * 0.5;
            const nHW = (ax1 - ax0) * 0.35;
            const nb = new PathBatcher();
            // Subtle recessed warm-slate brick rows & running-bond vertical joints inside blind arch tympanum
            for (let r = 0; r < 11; r++) {
                const yy = 532 + r * 9.2;
                if (yy >= 631)
                    break;
                let spanHW = nHW;
                if (yy < 574) {
                    const dy = (574 - yy) / 46;
                    spanHW = nHW * Math.sqrt(Math.max(0, 1 - dy * dy));
                }
                if (spanHW < 4)
                    continue;
                nb.line("nBrick", nCx - spanHW, yy, nCx + spanHW, yy, {
                    stroke: PAL.paperStone,
                    strokeWidth: 0.34,
                    strokeOpacity: 0.34,
                    nonScaling: "hatch",
                });
                const stag = (r % 2) * 8;
                for (let vx = nCx - spanHW + 8 + stag; vx < nCx + spanHW - 4; vx += 16) {
                    nb.line("nBrick", vx, yy, vx, Math.min(631, yy + 9.2), {
                        stroke: PAL.paperStone,
                        strokeWidth: 0.3,
                        strokeOpacity: 0.28,
                        nonScaling: "hatch",
                    });
                }
            }
            // Radial recessed brick voussoir arch joints inside the blind niche tympanum!
            for (let k = 1; k < 12; k++) {
                const a = Math.PI + (k / 12) * Math.PI;
                const xIn = nCx + Math.cos(a) * (nHW * 0.72);
                const yIn = 574 + Math.sin(a) * (46 * 0.72);
                const xOut = nCx + Math.cos(a) * nHW;
                const yOut = 574 + Math.sin(a) * 46;
                nb.line("nVous", xIn, yIn, xOut, yOut, {
                    stroke: PAL.paperWarm,
                    strokeWidth: 0.38,
                    strokeOpacity: 0.42,
                    nonScaling: "hatch",
                });
            }
            nb.addPath("nVous", openPoly(Array.from({ length: 13 }, (_, k) => {
                const a = Math.PI + (k / 12) * Math.PI;
                return [nCx + Math.cos(a) * (nHW * 0.72), 574 + Math.sin(a) * (46 * 0.72)];
            })), { stroke: PAL.paperWarm, strokeWidth: 0.42, strokeOpacity: 0.44, nonScaling: "hatch" });
            nb.flush(p);
        }
        // Lower Vaulted Sluice Arch directly BENEATH the compact canal bridge threshold (y = 1012..1195)!
        drawAqueductBay(1305, 1720, 1008, 1118, 1198, 72, 24, {
            litWall: PAL.paperStone,
            shadeWall: PAL.slateDk,
            soffit: PAL.slateDk,
            recessedDark: PAL.prussianDk,
        });
        // Elevated Stone-&-Iron Causeway Bridge leading right up to the vaulted basalt canal arch (y = yBot + 2)
        const bridgeY = yBot + 2;
        const brB = new PathBatcher();
        brB.rect("brTop", 870, bridgeY, 955, 22, { fill: PAL.paperWarm, fillOpacity: 0.98 });
        brB.rect("brSh", 870, bridgeY + 13, 955, 11, { fill: PAL.slateDk, fillOpacity: 0.46 });
        brB.line("rail", 870, bridgeY - 19, xL - 44, bridgeY - 19, { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.82, nonScaling: "contour" });
        brB.line("rail", xR + 44, bridgeY - 19, 1825, bridgeY - 19, { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.82, nonScaling: "contour" });
        for (let rx = 880; rx < xL - 48; rx += 16) {
            brB.line("post", rx, bridgeY - 19, rx, bridgeY, { stroke: PAL.ink, strokeWidth: 0.46, strokeOpacity: 0.72, nonScaling: "hatch" });
            if (rx % 32 === 0)
                brB.line("lat", rx, bridgeY - 19, rx + 16, bridgeY, { stroke: PAL.inkMid, strokeWidth: 0.32, strokeOpacity: 0.48, nonScaling: "hatch" });
        }
        for (let rx = xR + 48; rx <= 1820; rx += 16) {
            brB.line("post", rx, bridgeY - 19, rx, bridgeY, { stroke: PAL.ink, strokeWidth: 0.46, strokeOpacity: 0.72, nonScaling: "hatch" });
        }
        brB.flush(p);
        // Tiny Causeway Lantern-Bearers walking toward the vaulted tunnel arch!
        p.scaleFigures([
            { x: 1025, y: bridgeY, h: 19, coat: PAL.cinnabar, kind: "coat", dir: 1 },
            { x: 1058, y: bridgeY, h: 18, coat: PAL.ochre, kind: "dress", dir: 1 },
            { x: 1228, y: bridgeY, h: 19, coat: PAL.prussianLt, kind: "coat", dir: 1 },
            { x: 1776, y: bridgeY, h: 19, coat: PAL.cinnabarLt, kind: "coat", dir: -1 },
        ], { shadowDir: [1.1, 0.22], shadowOpacity: 0.28 });
        p.layer("var(--z-halo-op)", () => {
            p.fillPath(circlePath(1034, bridgeY - 10, 38) + circlePath(1236, bridgeY - 10, 38), PAL.lanternHalo, 0.16);
            p.fillPath(circlePath(1034, bridgeY - 10, 18) + circlePath(1236, bridgeY - 10, 18), PAL.lantern, 0.32);
        });
        p.fillPath(circlePath(1034, bridgeY - 10, 3.2) + circlePath(1236, bridgeY - 10, 3.2), PAL.lanternCore, 0.96);
        // Deeply shadowed Far-Right Wing Vault & Grounded Diagonal Stone Staircase
        drawMasonryFace([[1985, 472], [BLEED.x1, 472], [BLEED.x1, 1220], [1985, 1220]], {
            fill: PAL.slate,
            glazeDark: PAL.prussianDk,
            rows: 36,
            cols: 14,
            jointColor: PAL.ink,
            jointOp: 0.54,
            hatch: true,
            hatchAngle: 132,
            hatchStep: 10,
            cross: true,
            tone0: 0.34,
            tone1: 0.84,
        });
        drawAqueductBay(2045, 2365, 520, 745, 1175, 125, -24, {
            litWall: PAL.slateLt,
            shadeWall: PAL.prussian,
            soffit: PAL.slateDk,
            recessedDark: PAL.prussianDk,
            pilasters: true,
        });
        const stairStart = [1795, 1168];
        const stairEnd = [2340, 710];
        const stairSteps = 26;
        const stairB = new PathBatcher();
        for (const u of [0.28, 0.58, 0.86]) {
            const sp = lerp(stairStart, stairEnd, u);
            stairB.quad("pier", [sp[0] - 14, sp[1] + 46], [sp[0] + 14, sp[1] + 46], [sp[0] + 18, 1190], [sp[0] - 18, 1190], { fill: PAL.slate, fillOpacity: 0.94 });
            stairB.quad("pierSh", [sp[0] + 2, sp[1] + 46], [sp[0] + 14, sp[1] + 46], [sp[0] + 18, 1190], [sp[0] + 2, 1190], { fill: PAL.prussianDk, fillOpacity: 0.48 });
        }
        stairB.quad("body", stairStart, stairEnd, [stairEnd[0], stairEnd[1] + 58], [stairStart[0], stairStart[1] + 58], { fill: PAL.paperStone, fillOpacity: 0.98 });
        stairB.quad("bodySh", [stairStart[0], stairStart[1] + 28], [stairEnd[0], stairEnd[1] + 28], [stairEnd[0], stairEnd[1] + 58], [stairStart[0], stairStart[1] + 58], { fill: PAL.slateDk, fillOpacity: 0.54 });
        const railTopA = [stairStart[0], stairStart[1] - 32];
        const railTopB = [stairEnd[0], stairEnd[1] - 32];
        stairB.line("rail", railTopA[0], railTopA[1], railTopB[0], railTopB[1], { stroke: PAL.ink, strokeWidth: 0.68, strokeOpacity: 0.84, nonScaling: "contour" });
        for (let s = 0; s <= stairSteps; s++) {
            const u = s / stairSteps;
            const sp = lerp(stairStart, stairEnd, u);
            const spNext = lerp(stairStart, stairEnd, Math.min(1, (s + 1) / stairSteps));
            stairB.line("step", sp[0], sp[1], spNext[0], sp[1], { stroke: PAL.ink, strokeWidth: 0.56, strokeOpacity: 0.78, nonScaling: "hatch" });
            stairB.line("step", spNext[0], sp[1], spNext[0], spNext[1], { stroke: PAL.ink, strokeWidth: 0.56, strokeOpacity: 0.78, nonScaling: "hatch" });
            if (s % 2 === 0) {
                const rp = lerp(railTopA, railTopB, u);
                stairB.line("post", sp[0], sp[1], rp[0], rp[1], { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.74, nonScaling: "hatch" });
            }
        }
        stairB.flush(p);
        p.scaleFigures([
            { x: 1965, y: 1026, h: 20, coat: PAL.ochre, kind: "coat", dir: 1 },
            { x: 2012, y: 988, h: 19, coat: PAL.cinnabar, kind: "coat", dir: 1 },
            { x: 2140, y: 882, h: 18, coat: PAL.slateDk, kind: "coat", dir: -1 },
            { x: 2210, y: 822, h: 18, coat: PAL.paperWarm, kind: "coat", dir: -1 },
        ], { shadowDir: [0.95, 0.32], shadowOpacity: 0.28 });
        // 6. Five-Stage Interlocking Horological Brass Escapement & Pinion Gear Train!
        const gearSpecs = [
            { cx: 195, cy: 560, r: 122, teeth: 28, speed: -14.0, phase: 6, fill: PAL.brass },
            { cx: 882, cy: 585, r: 112, teeth: 26, speed: -15.5, phase: 14, fill: PAL.brass },
            { cx: 1026, cy: 718, r: 74, teeth: 18, speed: 22.8, phase: 2, fill: PAL.ochre },
            { cx: 1118, cy: 812, r: 48, teeth: 12, speed: -34.2, phase: 8, fill: PAL.brassLt },
            { cx: 215, cy: 1125, r: 92, teeth: 22, speed: 18.5, phase: 11, fill: PAL.ochre },
        ];
        for (const g of gearSpecs) {
            p.animGroup({ kind: "rotate", cx: g.cx, cy: g.cy, speedDeg: g.speed, phase: g.phase }, () => {
                p.spurGear({ cx: g.cx, cy: g.cy, r: g.r, teeth: g.teeth, spokes: 6, fill: g.fill, rimFill: PAL.brassLt });
            });
        }
        p.fillPath(polyPath([[188, 560], [202, 560], [520, 828], [506, 842]]), PAL.slateDk, 0.86);
        p.fillPath(polyPath([[514, 826], [886, 578], [894, 590], [522, 838]]), PAL.slateDk, 0.86);
        p.burinContour("M195 560L515 835M515 835L882 585", PAL.litEdge, 0.62, 0.58, 2);
        // 7. Timber & Bronze Headrace Aqueduct Flume + Geared Sluice-Gate Winch!
        const wx = 520;
        const wy = 852;
        const wR = 338;
        const wInnerR = 260;
        const wBrassR = 224;
        const wHubR = 54;
        const flumePts = [[BLEED.x0, 488], [wx + 32, 488], [wx + 32, 534], [BLEED.x0, 534]];
        p.doubleGlaze(flumePts, PAL.umber, PAL.umberDk, {
            smooth: false,
            washOpacity: 0.94,
            deepOpacity: 0.44,
            thinPx: 0.55,
            thickPx: 1.02,
            toneFn: linearTone([0, 488], [0, 534], 0.14, 0.72),
            hatchAngleRad: rad(2),
            hatchSpacing: 9,
        });
        const flumeB = new PathBatcher();
        flumeB.quad("lip", [wx + 22, 486], [wx + 68, 492], [wx + 62, 538], [wx + 22, 534], { fill: PAL.brassDk, fillOpacity: 0.96 });
        flumeB.quad("lipHi", [wx + 22, 486], [wx + 68, 492], [wx + 66, 502], [wx + 22, 498], { fill: PAL.brassLt, fillOpacity: 0.52 });
        // Riveted iron tie-straps + sluice-gate upright frame & spoked brass handwheel at x = 420!
        for (let fx = 25; fx <= wx + 10; fx += 56) {
            flumeB.rect("strap", fx, 486, 5.5, 50, { fill: PAL.slateDk, fillOpacity: 0.88 });
            flumeB.circle("riv", fx + 2.7, 494, 1.4, { fill: PAL.litEdge });
            flumeB.circle("riv", fx + 2.7, 526, 1.4, { fill: PAL.litEdge });
        }
        // Sluice-gate upright winch tower mounted on the flume at x = 415
        flumeB.rect("strap", 402, 444, 6, 46, { fill: PAL.slateDk, fillOpacity: 0.95 });
        flumeB.rect("strap", 434, 444, 6, 46, { fill: PAL.slateDk, fillOpacity: 0.95 });
        flumeB.rect("strap", 398, 442, 46, 7, { fill: PAL.slateDk, fillOpacity: 0.95 });
        flumeB.circle("wheel", 421, 466, 17, { fill: "none", stroke: PAL.brass, strokeWidth: 1.4, nonScaling: "contour" });
        flumeB.line("spoke", 404, 466, 438, 466, { stroke: PAL.brass, strokeWidth: 0.85, nonScaling: "contour" });
        flumeB.line("spoke", 421, 449, 421, 483, { stroke: PAL.brass, strokeWidth: 0.85, nonScaling: "contour" });
        flumeB.flush(p);
        // 8. GIANT SPOKED IRON-AND-TIMBER OVERSHOT WATERWHEEL (cx = 520, cy = 852, r = 338, data-anim="rotate")
        p.animGroup({ kind: "rotate", cx: wx, cy: wy, speedDeg: 8.5, phase: 4 }, () => {
            const wb = new PathBatcher();
            wb.addPath("shroud", circlePath(wx, wy, wR) + circlePath(wx, wy, wInnerR), { fill: PAL.umber, fillOpacity: 0.96, evenodd: true });
            wb.addPath("shroudDk", circlePath(wx, wy, wR - 10) + circlePath(wx, wy, wInnerR + 14), { fill: PAL.umberDk, fillOpacity: 0.36, evenodd: true });
            wb.addPath("brassRing", circlePath(wx, wy, wInnerR) + circlePath(wx, wy, wBrassR), { fill: PAL.brass, fillOpacity: 0.94, evenodd: true });
            wb.addPath("brassHi", circlePath(wx, wy, wInnerR - 6) + circlePath(wx, wy, wBrassR + 12), { fill: PAL.brassLt, fillOpacity: 0.38, evenodd: true });
            // 24 layered wooden overshot buckets + riveted cast-iron splice plates + 48 rim bolts + 12 twin-braced spokes!
            const bucketCount = 24;
            for (let k = 0; k < bucketCount; k++) {
                const a0 = (k / bucketCount) * TAU;
                const a1 = ((k + 0.56) / bucketCount) * TAU;
                const pIn = add([wx, wy], polar(wInnerR, a0));
                const pMid = add([wx, wy], polar((wInnerR + wR) * 0.54, a0 + 0.06));
                const pOut = add([wx, wy], polar(wR, a1));
                const pNextIn = add([wx, wy], polar(wInnerR, a1));
                wb.quad("bucket", pIn, pMid, pOut, pNextIn, { fill: PAL.umberDk, fillOpacity: 0.66 });
                if (Math.cos(a0) > 0.02 && Math.sin(a0) < 0.78) {
                    wb.quad("bWater", pIn, lerp(pIn, pMid, 0.78), lerp(pNextIn, pOut, 0.68), pNextIn, { fill: PAL.celadonLt, fillOpacity: 0.68 });
                }
                wb.addPath("bLine", `M${f(pIn[0])} ${f(pIn[1])}L${f(pMid[0])} ${f(pMid[1])}L${f(pOut[0])} ${f(pOut[1])}`, {
                    stroke: PAL.ink,
                    strokeWidth: 0.78,
                    strokeOpacity: 0.84,
                    nonScaling: "contour",
                });
                const bp = add([wx, wy], polar((wInnerR + wBrassR) * 0.5, a0));
                const bp2 = add([wx, wy], polar(wR - 6, a0));
                wb.circle("bolt", bp[0], bp[1], 3.4, { fill: PAL.brassLt, fillOpacity: 0.94 });
                wb.circle("rivet", bp2[0], bp2[1], 2.2, { fill: PAL.slateLt, fillOpacity: 0.88 });
            }
            const spokeCount = 12;
            for (let k = 0; k < spokeCount; k++) {
                const a = (k / spokeCount) * TAU;
                const nx = -Math.sin(a);
                const ny = Math.cos(a);
                const s0 = add([wx, wy], polar(wHubR * 0.85, a));
                const s1 = add([wx, wy], polar(wBrassR + 12, a));
                const p0 = [s0[0] + nx * 13, s0[1] + ny * 13];
                const p1 = [s1[0] + nx * 9, s1[1] + ny * 9];
                const p2 = [s1[0] - nx * 9, s1[1] - ny * 9];
                const p3 = [s0[0] - nx * 13, s0[1] - ny * 13];
                wb.quad(k % 2 === 0 ? "spokeA" : "spokeB", p0, p1, p2, p3, { fill: k % 2 === 0 ? PAL.umber : PAL.bark, fillOpacity: 0.95 });
                wb.addPath("bLine", polyPath([p0, p1, p2, p3]), { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.84, nonScaling: "contour" });
                // Diagonal iron cross-bracing tie rod + center turnbuckle nut
                const nextMid = add([wx, wy], polar(wBrassR * 0.72, ((k + 1) / spokeCount) * TAU));
                const curMid = add([wx, wy], polar(wBrassR * 0.42, a));
                wb.line("tie", curMid[0], curMid[1], nextMid[0], nextMid[1], { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.78, nonScaling: "contour" });
                const tb = lerp(curMid, nextMid, 0.5);
                wb.circle("bolt", tb[0], tb[1], 3.0, { fill: PAL.brassLt });
            }
            wb.circle("hub", wx, wy, wHubR, { fill: PAL.brass, fillOpacity: 0.98 });
            wb.circle("hubHi", wx, wy, wHubR * 0.68, { fill: PAL.brassLt, fillOpacity: 0.56 });
            wb.circle("hubAx", wx, wy, wHubR * 0.34, { fill: PAL.slateDk, fillOpacity: 0.96 });
            wb.addPath("rimLine", circlePath(wx, wy, wR) + circlePath(wx, wy, wInnerR) + circlePath(wx, wy, wBrassR) + circlePath(wx, wy, wHubR), { stroke: PAL.ink, strokeWidth: 0.84, strokeOpacity: 0.88, nonScaling: "contour" });
            wb.addPath("ringDash", circlePath(wx, wy, (wInnerR + wR) * 0.5), {
                stroke: PAL.litEdge,
                strokeWidth: 0.48,
                strokeOpacity: 0.52,
                nonScaling: "hatch",
                dash: "14 6",
            });
            wb.flush(p);
        });
        const stanchionL = [[wx - 28, wy + 10], [wx + 28, wy + 10], [wx + 88, 1192], [wx - 88, 1192]];
        p.doubleGlaze(stanchionL, PAL.paperStone, PAL.slateDk, {
            smooth: false,
            washOpacity: 0.94,
            deepOpacity: 0.38,
            thinPx: 0.55,
            thickPx: 1.02,
            toneFn: linearTone([wx - 60, wy], [wx + 80, 1192], 0.14, 0.72),
            hatchAngleRad: rad(54),
            hatchSpacing: 11,
        });
        p.fillPath(circlePath(wx, wy, 36), PAL.brassDk, 0.96);
        p.fillPath(circlePath(wx, wy, 22), PAL.brassLt, 0.92);
        p.burinContour(circlePath(wx, wy, 36) + circlePath(wx, wy, 22), PAL.ink, 0.9, 0.9, 2);
        // 9. CURVING STREAKY COPPERPLATE & GOUACHE TURQUOISE WATERFALLS + DAMP 5-TONE PIER MOSS!
        p.dryBrushFoliage([
            { cx: 122, cy: 1152, rx: 68, ry: 26, density: 1.05 },
            { cx: 882, cy: 1156, rx: 74, ry: 24, density: 1.0 },
            { cx: 1248, cy: 1154, rx: 62, ry: 22, density: 0.95 },
            { cx: 1325, cy: 1158, rx: 46, ry: 24, density: 0.9 },
            { cx: 1705, cy: 1158, rx: 48, ry: 24, density: 0.9 },
            { cx: 1995, cy: 1152, rx: 58, ry: 22, density: 0.85 },
        ], { dark: PAL.sageDk, mid: PAL.malachite, light: PAL.sage, accent: PAL.ochreLt }, { dabSize: 7.5, opacity: 0.68, accentChance: 0.06 });
        const drawStreakyCascade = (eL, eR, baseOp) => {
            const cb = new PathBatcher();
            cb.addPath("veil", closedSmooth([...eL, ...[...eR].reverse()]), { fill: PAL.water, fillOpacity: baseOp * 0.42 });
            const streams = 10;
            for (let k = 0; k < streams; k++) {
                const u0 = (k + 0.12) / streams;
                const u1 = Math.min(0.98, u0 + rand(p.r, 0.045, 0.095));
                const sStart = k % 3 === 0 ? 0 : Math.floor(rand(p.r, 0, Math.min(3, eL.length - 3)));
                const leftRib = [];
                const rightRib = [];
                for (let i = sStart; i < eL.length; i++) {
                    const jitter = Math.sin(i * 1.3 + k * 2.1) * 0.022;
                    leftRib.push(lerp(eL[i], eR[i], Math.max(0.01, Math.min(0.99, u0 + jitter))));
                    rightRib.push(lerp(eL[i], eR[i], Math.max(0.01, Math.min(0.99, u1 + jitter))));
                }
                cb.addPath(k % 2 === 0 ? "bright" : "deep", closedSmooth([...leftRib, ...rightRib.reverse()]), {
                    fill: k % 2 === 0 ? PAL.celadonLt : PAL.waterDeep,
                    fillOpacity: k % 2 === 0 ? baseOp * 0.62 : baseOp * 0.4,
                });
                for (let i = sStart; i < eL.length - 1; i++) {
                    if (p.r() < 0.78) {
                        const um = (u0 + u1) * 0.5 + rand(p.r, -0.025, 0.025);
                        const a = lerp(eL[i], eR[i], um);
                        const d = lerp(eL[i + 1], eR[i + 1], um);
                        cb.line("thread", a[0], a[1], d[0], d[1], {
                            stroke: PAL.waterSpray,
                            strokeWidth: 0.72,
                            strokeOpacity: 0.78,
                            nonScaling: "hatch",
                        });
                    }
                }
            }
            cb.flush(p);
        };
        const arcOuterL = sample(cubic([wx + 56, 514], [wx + 245, 535], [wx + 318, 765], [wx + 288, 1188]), 16);
        const arcOuterR = sample(cubic([wx + 66, 496], [wx + 292, 522], [wx + 372, 765], [wx + 392, 1188]), 16);
        drawStreakyCascade(arcOuterL, arcOuterR, 0.92);
        const spL = sample(cubic([156, 708], [176, 845], [164, 1020], [136, 1188]), 12);
        const spR = sample(cubic([166, 696], [218, 845], [228, 1020], [234, 1188]), 12);
        drawStreakyCascade(spL, spR, 0.88);
        const slL = sample(cubic([1480, 1072], [1474, 1130], [1468, 1165], [1458, 1192]), 8);
        const slR = sample(cubic([1546, 1072], [1554, 1130], [1564, 1165], [1574, 1192]), 8);
        drawStreakyCascade(slL, slR, 0.84);
        p.animGroup({ kind: "ripple", ampX: 6, baseOp: 0.86, ampOp: 0.14, freq: 2.3, phase: 0.4 }, () => {
            const fb = new PathBatcher();
            for (const [eL, eR] of [
                [arcOuterL, arcOuterR],
                [spL, spR],
                [slL, slR],
            ]) {
                for (const u of [0.14, 0.34, 0.56, 0.76, 0.92]) {
                    for (let s = 0; s < eL.length - 1; s++) {
                        if (p.r() < 0.74) {
                            const a = lerp(eL[s], eR[s], u + rand(p.r, -0.04, 0.04));
                            const d = lerp(eL[s + 1], eR[s + 1], u + rand(p.r, -0.04, 0.04));
                            fb.line("dash", a[0], a[1], d[0], d[1], { stroke: PAL.waterSpray, strokeWidth: 0.86, strokeOpacity: 0.84, nonScaling: "hatch" });
                        }
                    }
                }
            }
            for (const [bx, span] of [
                [wx + 340, 118],
                [185, 82],
                [1515, 84],
            ]) {
                for (let k = 0; k < 24; k++) {
                    const fx = bx + rand(p.r, -span, span);
                    const fy = 1188 + rand(p.r, -20, 26);
                    const fl = rand(p.r, 14, 48);
                    const fh = rand(p.r, 2.2, 6.2);
                    fb.addPath("foamDash", `M${f(fx - fl * 0.5)} ${f(fy)}Q${f(fx)} ${f(fy - fh)} ${f(fx + fl * 0.5)} ${f(fy)}Q${f(fx)} ${f(fy + fh)} ${f(fx - fl * 0.5)} ${f(fy)}Z`, { fill: PAL.waterSpray, fillOpacity: 0.78 });
                }
                for (let k = 0; k < 12; k++) {
                    fb.dab("puff", bx + rand(p.r, -span * 0.78, span * 0.78), 1178 + rand(p.r, -16, 10), rand(p.r, 14, 28), rand(p.r, 7, 13), rand(p.r, -0.2, 0.2), p.r, {
                        fill: PAL.waterSpray,
                        fillOpacity: 0.44,
                    });
                }
            }
            fb.flush(p);
        });
        // 10. PAINTERLY SUBTERRANEAN CANAL BASIN (y = 1185..BLEED.y1)
        const waterQuad = [
            [BLEED.x0, 1185],
            [BLEED.x1, 1185],
            [BLEED.x1, BLEED.y1],
            [BLEED.x0, BLEED.y1],
        ];
        p.fillPath(polyPath(waterQuad), canalGrad, 0.98);
        p.brokenWaterReflections(waterQuad, { base: false, primary: PAL.celadon, deep: PAL.prussianDk, shimmer: PAL.waterShimmer }, {
            rows: 52,
            opacity: 0.9,
            reflectBands: [
                { u0: 0.22, u1: 0.27, v0: 0.04, v1: 0.84, color: PAL.lantern },
                { u0: 0.4, u1: 0.45, v0: 0.02, v1: 0.86, color: PAL.lantern },
                { u0: 0.56, u1: 0.63, v0: 0.02, v1: 0.88, color: PAL.lantern },
                { u0: 0.74, u1: 0.79, v0: 0.06, v1: 0.76, color: PAL.lantern },
                { u0: 0.36, u1: 0.44, v0: 0.0, v1: 0.38, color: PAL.waterSpray },
                { u0: 0.57, u1: 0.62, v0: 0.0, v1: 0.28, color: PAL.waterSpray },
            ],
        });
        p.animGroup({ kind: "ripple", ampX: 10, baseOp: 0.76, ampOp: 0.18, freq: 1.45, phase: 0.8 }, () => {
            let ripD = "";
            for (const [rx, ry, rr] of [
                [wx + 340, 1255, 128],
                [185, 1265, 92],
                [1515, 1285, 118],
                [620, 1415, 145],
            ]) {
                ripD += ellipsePath(rx, ry, rr, rr * 0.18) + ellipsePath(rx, ry, rr * 0.6, rr * 0.11);
            }
            p.burin(ripD, PAL.waterSpray, 0.78, 0.62, 8, "hatch", "26 14");
        });
        // Foreground Stone Quay Embankment Shelves + Iron Mooring Rings
        const leftQuayTop = [[BLEED.x0, 1166], [365, 1166], [335, 1192], [BLEED.x0, 1192]];
        const leftQuayFace = [[BLEED.x0, 1192], [335, 1192], [335, 1216], [BLEED.x0, 1216]];
        const rightQuayTop = [[1750, 1166], [BLEED.x1, 1166], [BLEED.x1, 1196], [1782, 1196]];
        const rightQuayFace = [[1782, 1196], [BLEED.x1, 1196], [BLEED.x1, 1222], [1782, 1222]];
        p.fillPath(polyPath(leftQuayTop) + polyPath(rightQuayTop), PAL.paperWarm, 0.98);
        p.fillPath(polyPath(leftQuayFace) + polyPath(rightQuayFace), PAL.slate, 0.96);
        p.burinContour(polyPath(leftQuayTop) + polyPath(leftQuayFace) + polyPath(rightQuayTop) + polyPath(rightQuayFace) + circlePath(296, 1204, 6) + circlePath(1845, 1208, 6), PAL.ink, 0.72, 0.78, 6);
        p.scaleFigures([
            { x: 252, y: 1184, h: 22, coat: PAL.cinnabar, kind: "coat", dir: 1 },
            { x: 288, y: 1186, h: 21, coat: PAL.ochre, kind: "dress", dir: 1 },
            { x: 1848, y: 1184, h: 22, coat: PAL.prussianLt, kind: "coat", dir: -1 },
            { x: 1892, y: 1186, h: 20, coat: PAL.cinnabar, kind: "coat", dir: -1 },
        ], { shadowDir: [1.15, 0.22], shadowOpacity: 0.28 });
        // 11. Hanging Wrought-Iron Chain Lanterns + 5 Fully Caged Arcade Cresset Sconces!
        p.hangingLantern({ cx: 345, cy: 292, w: 30, h: 48, cordLen: 145, style: "gas", swayAmp: 2.0, freq: 0.95, phase: 0.4 });
        p.hangingLantern({ cx: 1055, cy: 318, w: 28, h: 46, cordLen: 165, style: "gas", swayAmp: 1.9, freq: 1.05, phase: 1.9 });
        p.hangingLantern({ cx: 1995, cy: 520, w: 34, h: 54, cordLen: 155, style: "gas", swayAmp: 2.1, freq: 0.9, phase: 3.1 });
        const arcadeSconces = [
            { x: 158, y: 258, crownY: 140 },
            { x: 718, y: 258, crownY: 140 },
            { x: 1278, y: 258, crownY: 140 },
            { x: 1848, y: 258, crownY: 140 },
            { x: 1242, y: 578 },
        ];
        p.layer("var(--z-halo-op)", () => {
            p.animGroup({ kind: "pulse", baseOp: 0.88, ampOp: 0.12, freq: 1.95, phase: 0.9 }, () => {
                arcadeSconces.forEach(({ x: ax, y: ay }, idx) => {
                    const glow = p.radialGrad(`cresset-${idx}`, ax, ay, 245, [
                        [0, PAL.lanternCore, 0.48],
                        [0.24, PAL.lantern, 0.3],
                        [0.58, PAL.lanternHalo, 0.12],
                        [1, PAL.lanternHalo, 0.0],
                    ]);
                    p.fillPath(circlePath(ax, ay, 245), glow, 1);
                });
            });
        });
        const scB = new PathBatcher();
        for (const { x: ax, y: ay, crownY } of arcadeSconces) {
            scB.addPath("glass", `M${f(ax - 8.5)} ${f(ay - 12)}H${f(ax + 8.5)}L${f(ax + 6.5)} ${f(ay + 4)}H${f(ax - 6.5)}Z`, { fill: PAL.lantern, fillOpacity: 0.94 });
            scB.addPath("core", ellipsePath(ax, ay - 4, 3.6, 5.8), { fill: PAL.lanternCore, fillOpacity: 0.95 });
            scB.addPath("iron", `M${f(ax - 10.5)} ${f(ay - 12)}L${f(ax)} ${f(ay - 20)}L${f(ax + 10.5)} ${f(ay - 12)}ZM${f(ax - 7.5)} ${f(ay + 4)}H${f(ax + 7.5)}L${f(ax)} ${f(ay + 18)}Z`, { fill: PAL.slateDk, fillOpacity: 0.95 });
            let cage = `M${f(ax - 8.5)} ${f(ay - 12)}L${f(ax - 6.5)} ${f(ay + 4)}M${f(ax)} ${f(ay - 12)}V${f(ay + 4)}` +
                `M${f(ax + 8.5)} ${f(ay - 12)}L${f(ax + 6.5)} ${f(ay + 4)}M${f(ax - 7.5)} ${f(ay - 4)}H${f(ax + 7.5)}`;
            if (crownY !== undefined)
                cage += `M${f(ax)} ${f(crownY)}V${f(ay - 20)}`;
            else {
                cage +=
                    `M${f(ax)} ${f(ay - 25)}V${f(ay + 28)}M${f(ax - 5)} ${f(ay - 25)}H${f(ax + 5)}M${f(ax - 5)} ${f(ay + 28)}H${f(ax + 5)}` +
                        `M${f(ax - 12)} ${f(ay + 22)}Q${f(ax - 12)} ${f(ay + 12)} ${f(ax - 4)} ${f(ay + 12)}M${f(ax + 12)} ${f(ay + 22)}Q${f(ax + 12)} ${f(ay + 12)} ${f(ax + 4)} ${f(ay + 12)}`;
            }
            scB.addPath("cage", cage, { stroke: PAL.ink, strokeWidth: 0.55, strokeOpacity: 0.88, nonScaling: "contour" }, 6);
        }
        scB.flush(p);
    });
    // 12. HERO VAULTED STONE CANAL ARCHWAY FRAME around `hole` (outside clip — zero bleed into S13!)
    const revealW = 18;
    const vousW = 42;
    const outerArchPts = archPts.map(([ax, ay]) => [
        archMidX + (ax - archMidX) * ((archHalfW + vousW) / archHalfW),
        ySpring + (ay - ySpring) * ((archRise + vousW) / archRise),
    ]);
    const midArchPts = archPts.map(([ax, ay]) => [
        archMidX + (ax - archMidX) * ((archHalfW + revealW) / archHalfW),
        ySpring + (ay - ySpring) * ((archRise + revealW) / archRise),
    ]);
    const outerFrame = [[xL - vousW, ySpring], ...outerArchPts, [xR + vousW, yBot + 10], [xL - vousW, yBot + 10]];
    const innerFrame = [[xL - revealW, ySpring], ...midArchPts, [xR + revealW, yBot + 4], [xL - revealW, yBot + 4]];
    const frB = new PathBatcher();
    frB.addPath("outer", polyPath(outerFrame) + polyPath(hole), { fill: PAL.paperStone, fillOpacity: 0.98, evenodd: true });
    frB.addPath("inner", polyPath(innerFrame) + polyPath(hole), { fill: PAL.slateDk, fillOpacity: 0.94, evenodd: true });
    for (let i = 0; i < archPts.length - 1; i++) {
        const vD = polyPath([midArchPts[i], outerArchPts[i], outerArchPts[i + 1], midArchPts[i + 1]]);
        const key = i === 9 || i === 10 ? "vWarm" : i < 10 ? (i % 2 === 0 ? "vWarm" : "vStone") : i % 2 === 0 ? "vSlateLt" : "vSlate";
        const col = key === "vWarm" ? PAL.paperWarm : key === "vStone" ? PAL.paperStone : key === "vSlateLt" ? PAL.slateLt : PAL.slate;
        frB.addPath(key, vD, { fill: col, fillOpacity: 0.95 });
        frB.line("joint", archPts[i][0], archPts[i][1], outerArchPts[i][0], outerArchPts[i][1], {
            stroke: PAL.inkMid,
            strokeWidth: 0.5,
            strokeOpacity: 0.68,
            nonScaling: "hatch",
        });
    }
    const quoinRows = 9;
    for (let q = 0; q < quoinRows; q++) {
        const qy0 = ySpring + ((yBot - ySpring) * q) / quoinRows;
        const qy1 = ySpring + ((yBot - ySpring) * (q + 1)) / quoinRows;
        const wMod = q % 2 === 0 ? vousW : vousW * 0.78;
        frB.quad(q % 2 === 0 ? "vWarm" : "vStone", [xL - wMod, qy0], [xL - revealW, qy0], [xL - revealW, qy1], [xL - wMod, qy1], {
            fill: q % 2 === 0 ? PAL.paperWarm : PAL.paperStone,
            fillOpacity: 0.96,
        });
        frB.quad(q % 2 === 0 ? "vSlate" : "vSlateDk", [xR + revealW, qy0], [xR + wMod, qy0], [xR + wMod, qy1], [xR + revealW, qy1], {
            fill: q % 2 === 0 ? PAL.slate : PAL.slateDk,
            fillOpacity: 0.94,
        });
        frB.line("joint", xL - wMod, qy0, xL, qy0, { stroke: PAL.inkMid, strokeWidth: 0.5, strokeOpacity: 0.68, nonScaling: "hatch" });
        frB.line("joint", xR, qy0, xR + wMod, qy0, { stroke: PAL.inkMid, strokeWidth: 0.5, strokeOpacity: 0.68, nonScaling: "hatch" });
    }
    // Carved Classical Medusa / Aqueduct Keystone Relief at arch apex!
    const apexX = archMidX;
    const apexY = archPts[10][1];
    const keystone = [
        [apexX - 20, apexY - vousW - 10],
        [apexX + 20, apexY - vousW - 10],
        [apexX + 13, apexY - 2],
        [apexX - 13, apexY - 2],
    ];
    frB.addPath("ks", polyPath(keystone), { fill: PAL.paperWarm, fillOpacity: 0.98 });
    frB.quad("ksSh", [apexX + 1, apexY - vousW - 10], [apexX + 20, apexY - vousW - 10], [apexX + 13, apexY - 2], [apexX + 1, apexY - 2], {
        fill: PAL.slate,
        fillOpacity: 0.34,
    });
    frB.circle("medFill", apexX, apexY - vousW * 0.55 - 4, 8.5, { fill: PAL.paperStone });
    frB.circle("medRim", apexX, apexY - vousW * 0.55 - 4, 8.5, { stroke: PAL.inkMid, strokeWidth: 0.48, nonScaling: "hatch" });
    frB.addPath("sill", polyPath([[xL - vousW - 8, yBot], [xR + vousW + 8, yBot], [xR + vousW + 12, yBot + 16], [xL - vousW - 12, yBot + 16]]), { fill: PAL.paperStone, fillOpacity: 0.98 });
    frB.addPath("outline", polyPath(outerFrame) + polyPath(keystone), { stroke: PAL.ink, strokeWidth: 0.78, strokeOpacity: 0.84, nonScaling: "contour" });
    frB.addPath("holeRim", polyPath(hole), { stroke: PAL.ink, strokeWidth: 1.0, strokeOpacity: 0.88, nonScaling: "contour" });
    frB.flush(p);
    p.moonRim(outerArchPts, { closed: false, up: true, widthPx: 0.88, opacity: "var(--z-moon-op)" });
    // Twin Glowing Wrought-Iron Wall Sconces with 36-pt non-scaling Venetian volutes!
    for (const [sx, sy, side] of [
        [xL - 32, ySpring + 48, -1],
        [xR + 32, ySpring + 48, 1],
    ]) {
        p.layer("var(--z-halo-op)", () => {
            p.animGroup({ kind: "pulse", baseOp: 0.86, ampOp: 0.14, freq: 2.1, phase: side > 0 ? 1.5 : 0.2 }, () => {
                const g = p.radialGrad(`psconce-${side > 0 ? "r" : "l"}`, sx, sy, 148, [
                    [0, PAL.lanternCore, 0.56],
                    [0.28, PAL.lantern, 0.32],
                    [0.64, PAL.lanternHalo, 0.12],
                    [1, PAL.lanternHalo, 0.0],
                ]);
                p.fillPath(circlePath(sx, sy, 148), g, 1);
            });
        });
        const wallX = sx - side * 18;
        const armPts = sample(cubic([wallX, sy + 28], [wallX + side * 12, sy + 26], [sx - side * 5, sy + 12], [sx, sy + 12]), 36);
        const vol1 = [];
        for (let k = 0; k <= 36; k++) {
            const t = k / 36;
            const ang = (side > 0 ? Math.PI : 0) - side * t * TAU * 1.18;
            const radR = 10.5 * (1 - t * 0.74);
            vol1.push([wallX + side * 9 + Math.cos(ang) * radR, sy + 22 + Math.sin(ang) * radR]);
        }
        const vol2 = [];
        for (let k = 0; k <= 32; k++) {
            const t = k / 32;
            const ang = Math.PI * 0.5 + side * t * TAU * 0.92;
            const radR = 7.6 * (1 - t * 0.76);
            vol2.push([wallX + side * 11 + Math.cos(ang) * radR, sy + 5 + Math.sin(ang) * radR]);
        }
        p.burinContour(`M${f(wallX)} ${f(sy - 6)}V${f(sy + 34)}` + openPoly(armPts), PAL.ink, 0.88, 0.92, 2);
        p.burinContour(openPoly(vol1) + openPoly(vol2), PAL.ink, 0.74, 0.88, 2);
        const cage = [[sx - 9.5, sy - 12], [sx + 9.5, sy - 12], [sx + 6.8, sy + 12], [sx - 6.8, sy + 12]];
        const roof = [[sx - 14, sy - 12], [sx, sy - 22], [sx + 14, sy - 12]];
        p.fillPath(polyPath(cage), PAL.lantern, 0.96);
        p.fillPath(ellipsePath(sx, sy, 4.4, 7.2), PAL.lanternCore, 0.94);
        p.fillPath(polyPath(roof), PAL.slateDk, 0.96);
        p.burinContour(polyPath(cage) + polyPath(roof) + `M${f(sx)} ${f(sy - 12)}V${f(sy + 12)}`, PAL.ink, 0.8, 0.9, 3);
    }
    p.flush();
    return {
        index: 12,
        id: "s12-cistern",
        title: "Piranesi Subterranean Waterworks",
        subtitle: "Three-tier Roman cross-vaults, spoked waterwheel, lattice catwalks & vaulted canal arch",
        portal: S12_PORTAL,
        coreColorDay: [228, 222, 210],
        coreColorNight: [15, 21, 37],
        defs: p.defs.join(""),
        markup: p.out.join(""),
        hole,
        stats: { elements: p.elements, strokes: p.strokes, animGroups: p.animGroups },
    };
}
