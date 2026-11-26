// Homologous <svg> + WebGL2 embroidery bake generator for the 2026-2031 Six-Badge Specimen Sheet.
//
// Single source of truth: every badge defines a declarative list of geometric vector operations
// tagged with semantic attributes:
//   data-layer="recessed|main|proud"
//   data-thread="0|1|2|3"
//   data-region="satin|star|tatami_a|tatami_b|proud|rail"
//
// From that exact same geometry list we emit:
//   1. Live DOM <svg viewBox="-390 -280 780 560"> technical blueprints (and standalone .svg exports)
//   2. Zero-readback GPU Canvas2D rasterizations at 2x supersampling (1440x1040) + 1x metadata (720x520)
// Guaranteeing exact 0.00 px geometric registration between raw <svg> and 3D WebGL2 embroidery.
import { buildCircularArcTextPaths, buildLinearTextPaths, } from "./glyphs.js";
import { BAKE_REF_H, BAKE_REF_W, MERROW_HALF_W, MERROW_WIDTH, SHAPE_ID, VIEW_H, VIEW_W, shapeOuterBounds, shapeSvgPath, } from "./shapes.js";
export const BAKE_SCALE = 2;
export const BAKE_W = BAKE_REF_W * BAKE_SCALE; // 1440 (temporary 2x JFA scratch)
export const BAKE_H = BAKE_REF_H * BAKE_SCALE; // 1040
export const ATLAS_TILE_W = BAKE_REF_W; // 720 (resolved 1:1 compact atlas tile)
export const ATLAS_TILE_H = BAKE_REF_H; // 520
export const WEAVE_ID = {
    twill: 0,
    felt: 1,
    canvas: 2,
    ripstop: 3,
};
export const REGION_CODE = {
    satin: 0,
    star: 64,
    tatami_a: 128,
    tatami_b: 160,
    proud: 200,
    rail: 240,
};
const fmt = (n) => {
    const r = Math.round(n * 100) / 100;
    return Object.is(r, -0) ? "0" : String(r);
};
// ============================================================================
// Reusable Parametric SVG Path Helpers (Exact M/L/C/A/Z)
// ============================================================================
function circlePath(cx, cy, r) {
    return `M ${fmt(cx)} ${fmt(cy - r)} A ${fmt(r)} ${fmt(r)} 0 1 1 ${fmt(cx)} ${fmt(cy + r)} A ${fmt(r)} ${fmt(r)} 0 1 1 ${fmt(cx)} ${fmt(cy - r)} Z`;
}
function ellipsePath(cx, cy, rx, ry, rotDeg = 0) {
    const rad = (rotDeg * Math.PI) / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const x0 = cx + rx * c;
    const y0 = cy + rx * s;
    const x1 = cx - rx * c;
    const y1 = cy - rx * s;
    return `M ${fmt(x0)} ${fmt(y0)} A ${fmt(rx)} ${fmt(ry)} ${fmt(rotDeg)} 1 1 ${fmt(x1)} ${fmt(y1)} A ${fmt(rx)} ${fmt(ry)} ${fmt(rotDeg)} 1 1 ${fmt(x0)} ${fmt(y0)} Z`;
}
function arcPath(cx, cy, r, startDeg, endDeg) {
    // 0 deg = 12 o'clock (0, -r), clockwise in SVG Y-down
    const a0 = ((startDeg - 90) * Math.PI) / 180;
    const a1 = ((endDeg - 90) * Math.PI) / 180;
    const x0 = cx + Math.cos(a0) * r;
    const y0 = cy + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r;
    const y1 = cy + Math.sin(a1) * r;
    const span = Math.abs(endDeg - startDeg);
    const large = span > 180 ? 1 : 0;
    const sweep = endDeg >= startDeg ? 1 : 0;
    return `M ${fmt(x0)} ${fmt(y0)} A ${fmt(r)} ${fmt(r)} 0 ${large} ${sweep} ${fmt(x1)} ${fmt(y1)}`;
}
function starPath(cx, cy, rOuter, rInner, rotRad = 0) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? rOuter : rInner;
        const a = -Math.PI * 0.5 + rotRad + (i * Math.PI) / 5;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        pts.push(`${i === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`);
    }
    pts.push("Z");
    return pts.join(" ");
}
function polyPath(pts, cx = 0, cy = 0, rotDeg = 0, closed = true) {
    const rad = (rotDeg * Math.PI) / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const out = pts.map(([px, py], i) => {
        const x = cx + px * c - py * s;
        const y = cy + px * s + py * c;
        return `${i === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`;
    });
    if (closed)
        out.push("Z");
    return out.join(" ");
}
function pushGlyphOps(ops, gp, layer, thread, strokeW, clipPath) {
    if (gp.strokeD) {
        ops.push({
            d: gp.strokeD,
            layer,
            thread,
            region: "satin",
            mode: "stroke",
            strokeWidth: strokeW,
            lineCap: "butt",
            lineJoin: "miter",
            clipPath,
        });
    }
    if (gp.bevelD) {
        ops.push({
            d: gp.bevelD,
            layer,
            thread,
            region: "satin",
            mode: "stroke",
            strokeWidth: strokeW,
            lineCap: "butt",
            lineJoin: "bevel",
            clipPath,
        });
    }
    if (gp.slashD) {
        ops.push({
            d: gp.slashD,
            layer,
            thread,
            region: "satin",
            mode: "stroke",
            strokeWidth: strokeW * 0.86,
            lineCap: "butt",
            lineJoin: "miter",
            clipPath,
        });
    }
    if (gp.fillD) {
        ops.push({
            d: gp.fillD,
            layer,
            thread,
            region: "satin",
            mode: "fill",
            clipPath,
        });
    }
}
function pushText(ops, text, x, yCenter, capH, strokeW, tracking, style, align, widthScale, layer, thread, slashedZero = false) {
    const gp = buildLinearTextPaths(text, x, yCenter, capH, strokeW, tracking, style, align, widthScale, slashedZero);
    pushGlyphOps(ops, gp, layer, thread, strokeW);
}
function pushArcText(ops, text, cx, cy, radius, startDeg, endDeg, capH, strokeW, style, layer, thread, mode = "clockwise", slashedZero = false) {
    const gp = buildCircularArcTextPaths(text, cx, cy, radius, startDeg, endDeg, capH, strokeW, style, mode, slashedZero);
    pushGlyphOps(ops, gp, layer, thread, strokeW);
}
// ============================================================================
// BADGE 0 — 2026 · APEX · Supersonic Flight Test (Rounded Tactical Rectangle)
// ============================================================================
function build2026Apex() {
    const meta = {
        index: 0,
        year: "2026",
        slug: "apex",
        code: "2026",
        title: "APEX",
        subtitle: "Supersonic Flight Test",
        shape: "rect",
        shapeLabel: "Rounded Rect",
        weave: "twill",
        weaveLabel: "2/1 Carbon Z-Twill",
        substrateHex: "#141516",
        substrateRoughness: 0.50,
        substrateSheen: 0.16,
        substrateAngleDeg: 31.5,
        isLightSubstrate: false,
        tatamiAnglesDeg: [52.0, 33.0, 42.0],
        merrowThread: 0,
        threads: [
            {
                name: "Optical White Rayon",
                hex: "#F2F2F4",
                dayInkHex: "#1B1C1E",
                sheen: 1.32,
                roughness: 0.18,
                metallic: 0.0,
            },
            {
                name: "Silver-Slate Globe",
                hex: "#9EA4B0",
                dayInkHex: "#6D7482",
                sheen: 0.82,
                roughness: 0.24,
                metallic: 0.0,
            },
            {
                name: "Swiss Cinnabar",
                hex: "#D9412B",
                dayInkHex: "#C93622",
                sheen: 1.28,
                roughness: 0.20,
                metallic: 0.0,
            },
            {
                name: "Warm Titanium",
                hex: "#D2D5DC",
                dayInkHex: "#4E535D",
                sheen: 1.15,
                roughness: 0.22,
                metallic: 0.0,
            },
        ],
    };
    const ops = [];
    // Stage-1 coordinates shifted by (-600, -598) to center at (0, 0)
    const sealCx = 0.0;
    const sealCy = -70.0;
    const sealRInner = 73.5;
    const sealROuter = 115.0;
    const sealRText = 94.2;
    const jetCx = 1.5;
    const jetCy = -68.5;
    const jetAngleDeg = -44.5;
    const globeClip = circlePath(sealCx, sealCy, sealRInner - 0.8);
    // Layer 1 (Recessed): Orthographic globe lat/lon grid in Silver-Slate [1]
    const globeLines = [];
    for (const dy of [-30, 0, 30]) {
        globeLines.push(`M ${fmt(sealCx - sealRInner - 4)} ${fmt(sealCy + dy)} L ${fmt(sealCx + sealRInner + 4)} ${fmt(sealCy + dy)}`);
    }
    globeLines.push(`M ${fmt(sealCx)} ${fmt(sealCy - sealRInner - 4)} L ${fmt(sealCx)} ${fmt(sealCy + sealRInner + 4)}`);
    globeLines.push(ellipsePath(sealCx, sealCy, sealRInner * 0.52, sealRInner));
    ops.push({
        d: globeLines.join(" "),
        layer: "recessed",
        thread: 1,
        region: "satin",
        mode: "stroke",
        strokeWidth: 2.5,
        clipPath: globeClip,
    });
    // Layer 2 (Main): Concentric seal rings + clockwise curved type
    ops.push({
        d: circlePath(sealCx, sealCy, sealROuter),
        layer: "main",
        thread: 0,
        region: "satin",
        mode: "stroke",
        strokeWidth: 4.65,
    });
    ops.push({
        d: circlePath(sealCx, sealCy, sealRInner),
        layer: "main",
        thread: 0,
        region: "satin",
        mode: "stroke",
        strokeWidth: 4.4,
    });
    // 2 Swiss Cinnabar [2] circular seal bullets at 0 deg and 150 deg
    for (const deg of [0, 150]) {
        const rad = (deg * Math.PI) / 180;
        const dx = sealCx + Math.sin(rad) * sealRText;
        const dy = sealCy - Math.cos(rad) * sealRText;
        ops.push({
            d: circlePath(dx, dy, 3.2),
            layer: "main",
            thread: 2,
            region: "satin",
            mode: "fill",
        });
    }
    pushArcText(ops, "APEX", sealCx, sealCy, sealRText, 12.5, 57.0, 20.0, 3.4, "sans", "main", 0);
    pushArcText(ops, "STUDIO", sealCx, sealCy, sealRText, 69.5, 138.0, 20.0, 3.4, "sans", "main", 0);
    pushArcText(ops, "OPERATIONAL", sealCx, sealCy, sealRText, 162.5, 291.5, 20.0, 3.4, "sans", "main", 0);
    pushArcText(ops, "2026", sealCx, sealCy, sealRText, 304.0, 347.5, 20.0, 3.4, "sans", "main", 0, "clockwise", true);
    // Layer 2 (Main): Swept delta wings, stabilators, LERX strakes & wingtip missile rails
    for (const side of [-1, 1]) {
        const region = side === -1 ? "tatami_a" : "tatami_b";
        const wingD = [
            polyPath([
                [22, side * 10.5],
                [-20, side * 60.0],
                [-33, side * 60.0],
                [-28, side * 10.5],
            ], jetCx, jetCy, jetAngleDeg),
            polyPath([
                [-31, side * 11.5],
                [-53, side * 27.5],
                [-61, side * 21.5],
                [-55, side * 10.5],
            ], jetCx, jetCy, jetAngleDeg),
            polyPath([
                [41, side * 13.8],
                [22, side * 18.2],
                [13, side * 14.2],
                [24, side * 10.6],
            ], jetCx, jetCy, jetAngleDeg),
        ].join(" ");
        ops.push({ d: wingD, layer: "main", thread: 0, region, mode: "fill" });
        // Wingtip missile rails in Swiss Cinnabar [2] (force-satin)
        const railD = polyPath([
            [-3, side * 60.8],
            [-35, side * 60.8],
        ], jetCx, jetCy, jetAngleDeg, false);
        ops.push({
            d: railD,
            layer: "main",
            thread: 2,
            region: "rail",
            mode: "stroke",
            strokeWidth: 3.6,
        });
    }
    // Layer 3 (Proud): Sculpted fighter fuselage core (Optical White [0]) + Cinnabar Mach nosecone tip [2]
    const fuseMainD = polyPath([
        [48, 5.7],
        [38, 8.2],
        [24, 11.4],
        [8, 13.8],
        [-12, 15.4],
        [-34, 16.0],
        [-47, 14.8],
        [-60, 12.8],
        [-64, 8.0],
        [-56, 4.0],
        [-62, 0],
        [-56, -4.0],
        [-64, -8.0],
        [-60, -12.8],
        [-47, -14.8],
        [-34, -16.0],
        [-12, -15.4],
        [8, -13.8],
        [24, -11.4],
        [38, -8.2],
        [48, -5.7],
    ], jetCx, jetCy, jetAngleDeg);
    const fuseNoseD = polyPath([
        [74.5, 0],
        [55, 4.0],
        [48, 5.7],
        [48, -5.7],
        [55, -4.0],
    ], jetCx, jetCy, jetAngleDeg);
    ops.push({ d: fuseMainD, layer: "proud", thread: 0, region: "proud", mode: "fill" });
    ops.push({ d: fuseNoseD, layer: "proud", thread: 2, region: "proud", mode: "fill" });
    // Layer 2 (Main): 8x Flanking 5-Pointed Mitered Satin Stars
    const starYs = [-141, -106, -71, -37];
    const starXs = [-305.5, 305.5];
    const starJitters = [
        [0.2, -0.3, 0.018],
        [-0.3, 0.2, -0.022],
        [0.1, 0.3, 0.012],
        [-0.2, -0.2, -0.016],
        [-0.2, 0.2, -0.015],
        [0.3, -0.1, 0.020],
        [-0.1, -0.3, -0.014],
        [0.2, 0.2, 0.017],
    ];
    let sIdx = 0;
    for (const sx of starXs) {
        for (const sy of starYs) {
            const [jx, jy, jRot] = starJitters[sIdx++];
            ops.push({
                d: starPath(sx + jx, sy + jy, 15.2, 6.45, jRot),
                layer: "main",
                thread: 0,
                region: "star",
                mode: "both",
                strokeWidth: 1.1,
                lineJoin: "round",
            });
        }
    }
    // Layer 2 (Main): 3x2 Mirrored Telemetry Rows (Cinnabar prompt chevrons + White text)
    const telCapH = 16.4;
    const telStroke = 3.5;
    const telTrack = 3.1;
    const leftRows = [
        ["SYS.INIT", -98.5],
        ["THRUST", -68.5],
        ["PAYLOAD", -38.5],
    ];
    for (const [label, y] of leftRows) {
        pushText(ops, ">", -265, y, telCapH, telStroke, telTrack, "mono", "left", 1.03, "main", 2);
        pushText(ops, label, -245, y, telCapH, telStroke, telTrack, "mono", "left", 1.03, "main", 0);
    }
    const rightRows = [
        ["OK", -98.5],
        ["LOCK", -68.5],
        ["ARMED", -38.5],
    ];
    for (const [label, y] of rightRows) {
        pushText(ops, label, 245, y, telCapH, telStroke, telTrack, "mono", "right", 1.03, "main", 0);
        pushText(ops, "<", 265, y, telCapH, telStroke, telTrack, "mono", "right", 1.03, "main", 2);
    }
    // Layer 2 (Main): Mid Display Brackets Row & ENGAGED (Cinnabar [ ] around APEX!)
    const midY = 75.0;
    const midCapH = 19.6;
    const midStroke = 4.4;
    const midTrack = 4.5;
    pushText(ops, "[", -282.5, midY, midCapH, midStroke, midTrack, "sans", "center", 1.14, "main", 2);
    pushText(ops, "APEX", -225.5, midY, midCapH, midStroke, midTrack, "sans", "center", 1.14, "main", 0);
    pushText(ops, "]", -168.5, midY, midCapH, midStroke, midTrack, "sans", "center", 1.14, "main", 2);
    pushText(ops, "[ RESTRICTED ]", 0.0, midY, midCapH, midStroke, midTrack, "sans", "center", 1.14, "main", 0);
    pushText(ops, "[ DEF-4 ]", 223.5, midY, midCapH, midStroke, midTrack, "sans", "center", 1.14, "main", 0);
    pushText(ops, "ENGAGED", 0.0, 147.0, 20.2, 3.8, 5.4, "sans", "center", 1.16, "main", 0);
    // Layer 2 (Main): Bottom-Left & Bottom-Right 8-Ray Reticles
    for (const rcx of [-266.5, 266.5]) {
        const rcy = 142.5;
        const hw = 33.0;
        const hh = 34.0;
        const arm = 14.5;
        const brk = [];
        for (const sx of [-1, 1]) {
            for (const sy of [-1, 1]) {
                const ox = rcx + sx * hw;
                const oy = rcy + sy * hh;
                brk.push(`M ${fmt(ox - sx * arm)} ${fmt(oy)} L ${fmt(ox)} ${fmt(oy)} L ${fmt(ox)} ${fmt(oy - sy * arm)}`);
            }
        }
        ops.push({ d: brk.join(" "), layer: "main", thread: 0, region: "satin", mode: "stroke", strokeWidth: 4.1 });
        const rOuter = 26.5;
        const diagIn = 3.2;
        const isq = Math.SQRT1_2;
        const diag = [];
        for (const sx of [-1, 1]) {
            for (const sy of [-1, 1]) {
                diag.push(`M ${fmt(rcx + sx * diagIn * isq)} ${fmt(rcy + sy * diagIn * isq)} L ${fmt(rcx + sx * rOuter * isq)} ${fmt(rcy + sy * rOuter * isq)}`);
            }
        }
        ops.push({ d: diag.join(" "), layer: "main", thread: 0, region: "satin", mode: "stroke", strokeWidth: 3.3 });
        const cardIn = 9.5;
        const card = [
            `M ${fmt(rcx)} ${fmt(rcy - rOuter)} L ${fmt(rcx)} ${fmt(rcy - cardIn)}`,
            `M ${fmt(rcx)} ${fmt(rcy + cardIn)} L ${fmt(rcx)} ${fmt(rcy + rOuter)}`,
            `M ${fmt(rcx - rOuter)} ${fmt(rcy)} L ${fmt(rcx - cardIn)} ${fmt(rcy)}`,
            `M ${fmt(rcx + cardIn)} ${fmt(rcy)} L ${fmt(rcx + rOuter)} ${fmt(rcy)}`,
        ].join(" ");
        ops.push({ d: card, layer: "main", thread: 0, region: "satin", mode: "stroke", strokeWidth: 2.8 });
    }
    return { meta, ops };
}
// ============================================================================
// BADGE 1 — 2027 · PELAGIC · Abyssal Bathymetry (Circular Mission Roundel)
// ============================================================================
function build2027Pelagic() {
    const meta = {
        index: 1,
        year: "2027",
        slug: "pelagic",
        code: "2027",
        title: "PELAGIC",
        subtitle: "Abyssal Bathymetry",
        shape: "circle",
        shapeLabel: "Mission Roundel",
        weave: "felt",
        weaveLabel: "Navy Wool Felt",
        substrateHex: "#0E1726",
        substrateRoughness: 0.84,
        substrateSheen: 0.08,
        substrateAngleDeg: 0.0,
        isLightSubstrate: false,
        tatamiAnglesDeg: [14.0, 102.0, 0.0],
        merrowThread: 2, // Champagne Gold Metallic Bullion rim!
        threads: [
            {
                name: "Ice-Cyan Rayon",
                hex: "#A8DFEE",
                dayInkHex: "#1D6F8A",
                sheen: 1.36,
                roughness: 0.17,
                metallic: 0.0,
            },
            {
                name: "Bone White Rayon",
                hex: "#F2EFE9",
                dayInkHex: "#132238",
                sheen: 1.24,
                roughness: 0.20,
                metallic: 0.0,
            },
            {
                name: "Champagne Gold Bullion",
                hex: "#DCB868",
                dayInkHex: "#9C741C",
                sheen: 2.15,
                roughness: 0.15,
                metallic: 0.88,
            },
            {
                name: "Abyssal Slate",
                hex: "#5F8FA8",
                dayInkHex: "#3C647A",
                sheen: 0.90,
                roughness: 0.26,
                metallic: 0.0,
            },
        ],
    };
    const ops = [];
    const innerClip = circlePath(0, 0, 144.0);
    // Outer & inner Champagne Gold metallic compass bezel rings
    ops.push({
        d: circlePath(0, 0, 198.0),
        layer: "main",
        thread: 2,
        region: "satin",
        mode: "stroke",
        strokeWidth: 4.6,
    });
    ops.push({
        d: circlePath(0, 0, 147.0),
        layer: "main",
        thread: 2,
        region: "satin",
        mode: "stroke",
        strokeWidth: 4.1,
    });
    // 24 compass degree ticks around inner bezel perimeter (every 15 deg, longer at 45/90)
    const ticks = [];
    for (let i = 0; i < 24; i++) {
        const deg = i * 15;
        const rad = ((deg - 90) * Math.PI) / 180;
        const len = deg % 90 === 0 ? 15 : deg % 45 === 0 ? 11 : 7;
        const r0 = 144.0;
        const r1 = r0 - len;
        ticks.push(`M ${fmt(Math.cos(rad) * r0)} ${fmt(Math.sin(rad) * r0)} L ${fmt(Math.cos(rad) * r1)} ${fmt(Math.sin(rad) * r1)}`);
    }
    ops.push({
        d: ticks.join(" "),
        layer: "main",
        thread: 2,
        region: "satin",
        mode: "stroke",
        strokeWidth: 2.7,
    });
    // Curved bezel typography in Bone White [1]: top PELAGIC SURVEY, bottom 2027 · 10924M tightened to match top rhythm
    pushArcText(ops, "PELAGIC SURVEY", 0, 0, 172.5, -62, 62, 18.8, 3.4, "sans", "main", 1, "clockwise");
    pushArcText(ops, "2027 · 10924M", 0, 0, 172.5, 222, 138, 18.8, 3.4, "sans", "main", 1, "bottomUpright");
    // Twin 5-facet Gold mitered stars flanking 9 o'clock and 3 o'clock
    ops.push({
        d: starPath(-172.5, 0, 12.6, 5.4, 0),
        layer: "main",
        thread: 2,
        region: "star",
        mode: "both",
        strokeWidth: 1.0,
        lineJoin: "round",
    });
    ops.push({
        d: starPath(172.5, 0, 12.6, 5.4, 0),
        layer: "main",
        thread: 2,
        region: "star",
        mode: "both",
        strokeWidth: 1.0,
        lineJoin: "round",
    });
    // Layer 1 (Recessed): Concentric asymmetric bathymetric trench contour rings (Ice-Cyan [0])
    const contours = [];
    const contourSpecs = [
        [16, -8, 126, 108, -14],
        [12, -10, 102, 86, -12],
        [6, -12, 78, 66, -8],
        [0, -14, 146, 146, 0],
    ];
    for (let i = 0; i < 3; i++) {
        const [cx, cy, rx, ry, rot] = contourSpecs[i];
        contours.push(ellipsePath(cx, cy, rx, ry, rot));
    }
    // Vertical depth sounding plumb line & horizontal abyssal datum
    contours.push("M 0 -142 L 0 142");
    contours.push("M -142 -16 L 142 -16");
    ops.push({
        d: contours.join(" "),
        layer: "recessed",
        thread: 0,
        region: "satin",
        mode: "stroke",
        strokeWidth: 2.5,
        clipPath: innerClip,
    });
    // Layer 2 (Main): Two-tone overlapping abyssal ocean wave strata across the lower hemisphere
    // Upper/back swell in Abyssal Slate [3] (tatami_a) + lower foreground swell in Ice-Cyan [0] (tatami_b)
    const waveBack = "M -150 60 C -106 36 -62 36 -24 55 C 16 76 58 32 102 46 C 126 54 142 62 156 56 L 156 156 L -150 156 Z";
    const waveFront = "M -150 96 C -98 74 -48 76 -4 95 C 40 114 82 72 132 88 L 156 96 L 156 156 L -150 156 Z";
    ops.push({
        d: waveBack,
        layer: "main",
        thread: 3,
        region: "tatami_a",
        mode: "fill",
        clipPath: innerClip,
    });
    ops.push({
        d: waveFront,
        layer: "main",
        thread: 0,
        region: "tatami_b",
        mode: "fill",
        clipPath: innerClip,
    });
    // Crisp Bone White foam crest ribbons riding proudly along both wave strata
    const waveCrestTop = "M -142 58 C -100 34 -60 34 -24 53 C 16 74 58 30 102 44 C 122 51 136 57 148 54";
    const waveCrestLow = "M -142 94 C -94 72 -46 74 -4 93 C 40 112 82 70 132 86 C 140 89 146 92 150 94";
    ops.push({
        d: waveCrestTop,
        layer: "proud",
        thread: 1,
        region: "rail",
        mode: "stroke",
        strokeWidth: 4.2,
        clipPath: innerClip,
    });
    ops.push({
        d: waveCrestLow,
        layer: "proud",
        thread: 1,
        region: "rail",
        mode: "stroke",
        strokeWidth: 4.0,
        clipPath: innerClip,
    });
    // Layer 2 (Main): Deep-submergence Bathysphere pressure hull centered at (0, -16)
    // Upper dome (Bone White [1], tatami_b) + lower pressure ballast hull (Ice-Cyan [0], tatami_a)
    const hullUpper = "M -52 -19 A 52 52 0 0 1 52 -19 Z";
    const hullLower = "M -52 -13 A 52 52 0 0 0 52 -13 Z";
    ops.push({ d: hullUpper, layer: "main", thread: 1, region: "tatami_b", mode: "fill" });
    ops.push({ d: hullLower, layer: "main", thread: 0, region: "tatami_a", mode: "fill" });
    // Side thruster shrouds & upper recovery shackle / sonar mast
    const thrusters = [
        "M -74 -27 L -58 -27 L -58 -5 L -74 -5 Z",
        "M 58 -27 L 74 -27 L 74 -5 L 58 -5 Z",
        "M -14 -72 L 14 -72 L 10 -86 L -10 -86 Z",
    ].join(" ");
    ops.push({ d: thrusters, layer: "main", thread: 0, region: "satin", mode: "fill" });
    // Hull tether cable rising toward compass star
    ops.push({
        d: "M 0 -86 L 0 -100",
        layer: "main",
        thread: 1,
        region: "satin",
        mode: "stroke",
        strokeWidth: 3.4,
    });
    // Layer 3 (Proud): Champagne Gold Metallic equatorial flange, circular observation viewport & North Star!
    ops.push({
        d: "M -62 -16 L 62 -16",
        layer: "proud",
        thread: 2,
        region: "satin",
        mode: "stroke",
        strokeWidth: 6.2,
    });
    ops.push({
        d: circlePath(0, -16, 25.0),
        layer: "proud",
        thread: 2,
        region: "satin",
        mode: "stroke",
        strokeWidth: 6.0,
    });
    // Luminous Ice-Cyan curved specular glint inside the bathysphere viewport
    ops.push({
        d: arcPath(0, -16, 14.0, -55, 25),
        layer: "proud",
        thread: 0,
        region: "satin",
        mode: "stroke",
        strokeWidth: 3.4,
    });
    // Crowning 5-facet Gold North Star
    ops.push({
        d: starPath(0, -110, 17.5, 7.4, 0),
        layer: "proud",
        thread: 2,
        region: "star",
        mode: "both",
        strokeWidth: 1.0,
        lineJoin: "round",
    });
    return { meta, ops };
}
// ============================================================================
// BADGE 2 — 2028 · FLORA · Alpine Herbarium (Pointed Heritage Shield)
// ============================================================================
function build2028Flora() {
    const meta = {
        index: 2,
        year: "2028",
        slug: "flora",
        code: "2028",
        title: "FLORA",
        subtitle: "Alpine Herbarium",
        shape: "shield",
        shapeLabel: "Heritage Shield",
        weave: "canvas",
        weaveLabel: "Natural Cotton Duck",
        substrateHex: "#E5DEC9",
        substrateRoughness: 0.78,
        substrateSheen: 0.08,
        substrateAngleDeg: 0.0,
        isLightSubstrate: true,
        tatamiAnglesDeg: [36.0, 144.0, 90.0],
        merrowThread: 0, // Matte Forest Green spun cotton rim
        threads: [
            {
                name: "Forest Green Cotton",
                hex: "#1F4B3C",
                dayInkHex: "#1F4B3C",
                nightInkHex: "#69C2A2",
                sheen: 0.56,
                roughness: 0.44,
                metallic: 0.0,
            },
            {
                name: "Deep Indigo Ink",
                hex: "#1B2B48",
                dayInkHex: "#1B2B48",
                nightInkHex: "#A4BCE6",
                sheen: 0.52,
                roughness: 0.46,
                metallic: 0.0,
            },
            {
                name: "Terracotta Blossom",
                hex: "#C84B31",
                dayInkHex: "#C84B31",
                nightInkHex: "#EB6D52",
                sheen: 0.64,
                roughness: 0.40,
                metallic: 0.0,
            },
            {
                name: "Alpine Ochre",
                hex: "#C48B28",
                dayInkHex: "#B57B1A",
                nightInkHex: "#E8B754",
                sheen: 0.72,
                roughness: 0.36,
                metallic: 0.0,
            },
        ],
    };
    const ops = [];
    const innerFrame = shapeSvgPath("shield", -20);
    const innerClip = shapeSvgPath("shield", -26);
    // Inner shield satin border framing the pressed botanical plate
    ops.push({
        d: innerFrame,
        layer: "main",
        thread: 0,
        region: "satin",
        mode: "stroke",
        strokeWidth: 3.6,
    });
    // Layer 1 (Recessed): Alpine topographic elevation isolines behind specimen (cleanly above SPECIMEN 03)
    const isoLines = [];
    const isoYs = [-74, -36, 2, 40, 78, 108];
    for (let i = 0; i < isoYs.length; i++) {
        const y0 = isoYs[i];
        const amp = 13 + (i % 2) * 5;
        isoLines.push(`M -195 ${fmt(y0 + 10)} C -120 ${fmt(y0 + 12)} -60 ${fmt(y0 - amp)} 0 ${fmt(y0 - amp * 1.15)} C 60 ${fmt(y0 - amp)} 120 ${fmt(y0 + 12)} 195 ${fmt(y0 + 10)}`);
    }
    ops.push({
        d: isoLines.join(" "),
        layer: "recessed",
        thread: 1,
        region: "satin",
        mode: "stroke",
        strokeWidth: 2.5,
        clipPath: innerClip,
    });
    // Top Herbarium Title Banner
    pushText(ops, "ALPINE HERBARIUM", 0, -166, 16.0, 3.2, 2.5, "sans", "center", 1.0, "main", 1);
    pushText(ops, "2028", 0, -134, 17.5, 3.6, 3.2, "sans", "center", 1.08, "main", 2);
    // Flanking botanical hairlines & small 5-facet stars beside 2028
    ops.push({
        d: "M -150 -134 L -56 -134 M 56 -134 L 150 -134",
        layer: "main",
        thread: 0,
        region: "satin",
        mode: "stroke",
        strokeWidth: 2.9,
    });
    ops.push({
        d: starPath(-132, -98, 10.5, 4.5, 0),
        layer: "main",
        thread: 2,
        region: "star",
        mode: "both",
        strokeWidth: 0.9,
        lineJoin: "round",
    });
    ops.push({
        d: starPath(132, -98, 10.5, 4.5, 0),
        layer: "main",
        thread: 2,
        region: "star",
        mode: "both",
        strokeWidth: 0.9,
        lineJoin: "round",
    });
    // Layer 2 (Main, Forest Green [0]): Central tapered stem + 3 pairs of serrated alpine leaves + calyx cup
    ops.push({
        d: "M -4.2 -12 L 4.2 -12 L 3.4 114 L -3.4 114 Z",
        layer: "main",
        thread: 0,
        region: "satin",
        mode: "fill",
    });
    // Symmetrical serrated alpine leaves (left = tatami_a 36 deg, right = tatami_b 144 deg) + proud satin midribs!
    const midribs = [];
    const leafPair = (yBase, tipX, tipY, midUpX, midUpY, midDnX, midDnY) => {
        // Subtle serrated upper/lower notches along the lanceolate botanical blade
        const s1x = tipX * 0.44;
        const s1y = (yBase + tipY) * 0.5 - 12;
        const s2x = tipX * 0.72;
        const s2y = (yBase + tipY) * 0.5 - 8;
        const leftD = [
            `M -4 ${fmt(yBase)}`,
            `C ${fmt(-midUpX * 0.7)} ${fmt(midUpY + 2)} ${fmt(-s1x + 4)} ${fmt(s1y - 4)} ${fmt(-s1x)} ${fmt(s1y)}`,
            `L ${fmt(-s1x - 5)} ${fmt(s1y + 4)}`,
            `C ${fmt(-s2x + 6)} ${fmt(s2y - 3)} ${fmt(-tipX * 0.86)} ${fmt(tipY - 4)} ${fmt(-tipX)} ${fmt(tipY)}`,
            `C ${fmt(-tipX * 0.72)} ${fmt(tipY + 17)} ${fmt(-midDnX)} ${fmt(midDnY)} -4 ${fmt(yBase + 16)} Z`,
        ].join(" ");
        const rightD = [
            `M 4 ${fmt(yBase)}`,
            `C ${fmt(midUpX * 0.7)} ${fmt(midUpY + 2)} ${fmt(s1x - 4)} ${fmt(s1y - 4)} ${fmt(s1x)} ${fmt(s1y)}`,
            `L ${fmt(s1x + 5)} ${fmt(s1y + 4)}`,
            `C ${fmt(s2x - 6)} ${fmt(s2y - 3)} ${fmt(tipX * 0.86)} ${fmt(tipY - 4)} ${fmt(tipX)} ${fmt(tipY)}`,
            `C ${fmt(tipX * 0.72)} ${fmt(tipY + 17)} ${fmt(midDnX)} ${fmt(midDnY)} 4 ${fmt(yBase + 16)} Z`,
        ].join(" ");
        ops.push({ d: leftD, layer: "main", thread: 0, region: "tatami_a", mode: "fill" });
        ops.push({ d: rightD, layer: "main", thread: 0, region: "tatami_b", mode: "fill" });
        // Proud central botanical midrib veins catching directional studio light
        midribs.push(`M -7 ${fmt(yBase + 8)} Q ${fmt(-tipX * 0.48)} ${fmt((yBase + tipY) * 0.5 + 3)} ${fmt(-tipX * 0.84)} ${fmt(tipY + 2)}`);
        midribs.push(`M 7 ${fmt(yBase + 8)} Q ${fmt(tipX * 0.48)} ${fmt((yBase + tipY) * 0.5 + 3)} ${fmt(tipX * 0.84)} ${fmt(tipY + 2)}`);
    };
    leafPair(4, 108, -18, 36, -18, 48, 22);
    leafPair(42, 114, 24, 42, 22, 54, 62);
    leafPair(78, 84, 72, 34, 66, 38, 102);
    ops.push({
        d: midribs.join(" "),
        layer: "proud",
        thread: 3,
        region: "rail",
        mode: "stroke",
        strokeWidth: 2.6,
    });
    // Calyx involucre cup cradling the King Protea flower head
    ops.push({
        d: "M -48 -30 C -42 -2 -16 6 0 6 C 16 6 42 -2 48 -30 C 30 -20 14 -16 0 -16 C -14 -16 -30 -20 -48 -30 Z",
        layer: "main",
        thread: 0,
        region: "tatami_a",
        mode: "fill",
    });
    // King Protea Outer & Guard Bracts in Layer 2 (Main, opposing tatami_a / tatami_b angles!)
    const outerBracts = [
        // Sweeping outer left & right bracts
        ["M -46 -26 C -58 -54 -63 -77 -56 -90 C -42 -79 -35 -56 -32 -34 Z", "tatami_a"],
        ["M 46 -26 C 58 -54 63 -77 56 -90 C 42 -79 35 -56 32 -34 Z", "tatami_b"],
        // Wide lower guard bracts
        ["M -50 -20 C -73 -36 -83 -53 -78 -63 C -62 -56 -49 -42 -44 -28 Z", "tatami_b"],
        ["M 50 -20 C 73 -36 83 -53 78 -63 C 62 -56 49 -42 44 -28 Z", "tatami_a"],
    ];
    for (const [bd, reg] of outerBracts) {
        ops.push({ d: bd, layer: "main", thread: 2, region: reg, mode: "fill" });
    }
    // Layer 3 (Proud): 3 Individually Separated Inner Terracotta Crown Bracts (>= 3.5 px clear gap!) + Ochre Pollen Dome
    // Front bracts cast crisp embankment shadows onto outer Layer-2 bracts without merging into one blob!
    const innerProudBracts = [
        // Center tall vertical crown bract (stops cleanly at y = -57 above ochre dome!)
        "M -9.5 -56 C -10 -80 -5 -102 0 -114 C 5 -102 10 -80 9.5 -56 Z",
        // Inner left angled crown bract (3.8 px clear gap from center bract & ochre dome)
        "M -32 -44 C -36 -70 -31 -93 -24 -105 C -15 -92 -13 -70 -16 -48 Z",
        // Inner right angled crown bract
        "M 32 -44 C 36 -70 31 -93 24 -105 C 15 -92 13 -70 16 -48 Z",
    ];
    for (const pd of innerProudBracts) {
        ops.push({ d: pd, layer: "proud", thread: 2, region: "proud", mode: "fill" });
    }
    // Proud Alpine Ochre [3] central pollen cushion dome (separated cleanly below bracts)
    ops.push({
        d: ellipsePath(0, -37, 21.5, 14.0),
        layer: "proud",
        thread: 3,
        region: "proud",
        mode: "fill",
    });
    // Lower Shield Herbarium Footer (generous breathing room above shield point!)
    ops.push({
        d: "M -90 125 L 90 125",
        layer: "main",
        thread: 0,
        region: "satin",
        mode: "stroke",
        strokeWidth: 2.8,
    });
    pushText(ops, "SPECIMEN 03", 0, 149, 14.5, 3.1, 2.4, "mono", "center", 0.98, "main", 1);
    pushText(ops, "2840M", 0, 176, 13.5, 2.9, 2.6, "mono", "center", 1.0, "main", 0);
    return { meta, ops };
}
// ============================================================================
// BADGE 3 — 2029 · HELIOS · Solar Corona Array (Rounded Flat-Top Hexagon)
// ============================================================================
function build2029Helios() {
    const meta = {
        index: 3,
        year: "2029",
        slug: "helios",
        code: "2029",
        title: "HELIOS",
        subtitle: "Solar Corona Array",
        shape: "hexagon",
        shapeLabel: "Regular Hexagon",
        weave: "twill",
        weaveLabel: "Espresso Cavalry Twill",
        substrateHex: "#1D1714",
        substrateRoughness: 0.48,
        substrateSheen: 0.20,
        substrateAngleDeg: 38.0, // Steep Cavalry Twill
        isLightSubstrate: false,
        tatamiAnglesDeg: [24.0, 114.0, 68.0],
        merrowThread: 0, // Solar Amber / Marigold rim
        threads: [
            {
                name: "Solar Amber Rayon",
                hex: "#EA9A28",
                dayInkHex: "#C7780C",
                sheen: 1.48,
                roughness: 0.17,
                metallic: 0.0,
            },
            {
                name: "Pale Parchment Rayon",
                hex: "#F6EFE0",
                dayInkHex: "#2B1F16",
                sheen: 1.28,
                roughness: 0.19,
                metallic: 0.0,
            },
            {
                name: "Burnished Copper",
                hex: "#A45A2A",
                dayInkHex: "#8C481E",
                sheen: 1.38,
                roughness: 0.22,
                metallic: 0.35,
            },
            {
                name: "Corona Gold",
                hex: "#F5C451",
                dayInkHex: "#B88212",
                sheen: 1.65,
                roughness: 0.16,
                metallic: 0.45,
            },
        ],
    };
    const ops = [];
    const innerHex = shapeSvgPath("hexagon", -20);
    const innerClip = shapeSvgPath("hexagon", -25);
    // Inner Hexagonal Solar Amber bezel
    ops.push({
        d: innerHex,
        layer: "main",
        thread: 0,
        region: "satin",
        mode: "stroke",
        strokeWidth: 3.8,
    });
    // Layer 1 (Recessed): Burnished Copper Keplerian orbital ellipses + ecliptic/polar axes
    const orbits = [
        ellipsePath(0, 0, 192, 68, 28),
        ellipsePath(0, 0, 192, 68, -28),
        "M -220 0 L 220 0",
        "M 0 -138 L 0 138",
    ].join(" ");
    ops.push({
        d: orbits,
        layer: "recessed",
        thread: 2,
        region: "satin",
        mode: "stroke",
        strokeWidth: 2.6,
        clipPath: innerClip,
    });
    // Layer 2 (Main): Astrolabe degree arcs (Pale Parchment [1]) + fine radial ticks
    const astroArcs = [
        arcPath(0, 0, 122, -52, 52),
        arcPath(0, 0, 122, 128, 232),
    ];
    for (let deg = -48; deg <= 48; deg += 12) {
        for (const base of [0, 180]) {
            const rad = ((deg + base - 90) * Math.PI) / 180;
            const r0 = 122;
            const r1 = deg % 24 === 0 ? 111 : 115;
            astroArcs.push(`M ${fmt(Math.cos(rad) * r0)} ${fmt(Math.sin(rad) * r0)} L ${fmt(Math.cos(rad) * r1)} ${fmt(Math.sin(rad) * r1)}`);
        }
    }
    ops.push({
        d: astroArcs.join(" "),
        layer: "main",
        thread: 1,
        region: "satin",
        mode: "stroke",
        strokeWidth: 2.9,
    });
    // Layer 2 (Main): 12 sculpted Solar Corona Prominence Tongues alternating Solar Amber [0] & Corona Gold [3]!
    for (let i = 0; i < 12; i++) {
        const aDeg = i * 30;
        const isMajor = i % 2 === 0;
        const rTip = isMajor ? 105 : 82;
        const rBase = 48.5;
        const halfSpread = isMajor ? 10.2 : 8.2;
        const d = polyPath([
            [rBase, -halfSpread],
            [rTip * 0.80, -halfSpread * 0.45],
            [rTip, 0],
            [rTip * 0.80, halfSpread * 0.45],
            [rBase, halfSpread],
        ], 0, 0, aDeg - 90);
        ops.push({
            d,
            layer: "main",
            thread: isMajor ? 0 : 3,
            region: isMajor ? "tatami_a" : "tatami_b",
            mode: "fill",
        });
    }
    // Blazing Eclipsed Solar Corona Ring (Pale Parchment [1], thick force-satin on Layer 2 so proud star stays un-melted!)
    ops.push({
        d: circlePath(0, 0, 44.0),
        layer: "main",
        thread: 1,
        region: "rail",
        mode: "stroke",
        strokeWidth: 7.4,
    });
    // L1 & L2 Lagrange point reticles at x = ±166, y = 0
    for (const [lx, label] of [
        [-166, "L1"],
        [166, "L2"],
    ]) {
        const ret = [
            circlePath(lx, 0, 15.0),
            `M ${fmt(lx - 24)} 0 L ${fmt(lx - 9)} 0 M ${fmt(lx + 9)} 0 L ${fmt(lx + 24)} 0`,
            `M ${fmt(lx)} -24 L ${fmt(lx)} -9 M ${fmt(lx)} 9 L ${fmt(lx)} 24`,
        ].join(" ");
        ops.push({ d: ret, layer: "main", thread: 1, region: "satin", mode: "stroke", strokeWidth: 2.8 });
        ops.push({ d: circlePath(lx, 0, 3.6), layer: "main", thread: 0, region: "satin", mode: "fill" });
        pushText(ops, label, lx, 36, 12.5, 2.7, 2.2, "mono", "center", 1.0, "main", 1);
    }
    // Typography along flat top & bottom hexagon edges
    pushText(ops, "HELIOS CORONA", 0, -162, 16.5, 3.3, 2.8, "sans", "center", 1.02, "main", 1);
    pushText(ops, "2029", -68, 162, 16.8, 3.5, 2.6, "sans", "center", 1.04, "main", 0);
    pushText(ops, "·", -22, 162, 16.8, 3.4, 2.0, "sans", "center", 1.0, "main", 0);
    pushText(ops, "L1 ARRAY", 42, 162, 16.5, 3.3, 2.6, "sans", "center", 1.02, "main", 1);
    // Layer 3 (Proud): Isolated 5-Facet Diamond-Ring Eclipse Flare Star + Inner Corona Gold [3] Prominence Crescent!
    ops.push({
        d: arcPath(0, 0, 34.5, 165, 275),
        layer: "proud",
        thread: 3,
        region: "rail",
        mode: "stroke",
        strokeWidth: 3.6,
    });
    // Isolated 5-pointed Diamond-Ring flare star sitting cleanly ON TOP of the 1:30 corona ring limb!
    ops.push({
        d: starPath(31, -31, 19.2, 7.9, 0.22),
        layer: "proud",
        thread: 1,
        region: "star",
        mode: "both",
        strokeWidth: 1.0,
        lineJoin: "round",
    });
    return { meta, ops };
}
// ============================================================================
// BADGE 4 — 2030 · KINETIC · Field Optics & Robotics (Horizontal Stadium Capsule)
// ============================================================================
function build2030Kinetic() {
    const meta = {
        index: 4,
        year: "2030",
        slug: "kinetic",
        code: "2030",
        title: "KINETIC",
        subtitle: "Field Optics & Robotics",
        shape: "capsule",
        shapeLabel: "Stadium Capsule",
        weave: "ripstop",
        weaveLabel: "Olive Ripstop Nylon",
        substrateHex: "#252E26",
        substrateRoughness: 0.44,
        substrateSheen: 0.24,
        substrateAngleDeg: 0.0,
        isLightSubstrate: false,
        tatamiAnglesDeg: [30.0, 90.0, 150.0],
        merrowThread: 0, // Signal Safety Orange rim!
        threads: [
            {
                name: "Signal Safety Orange",
                hex: "#E85D24",
                dayInkHex: "#D44912",
                sheen: 1.38,
                roughness: 0.19,
                metallic: 0.0,
            },
            {
                name: "Chalk White Rayon",
                hex: "#F0EDE4",
                dayInkHex: "#1F2A21",
                sheen: 1.24,
                roughness: 0.20,
                metallic: 0.0,
            },
            {
                name: "Sage-Grey Scale",
                hex: "#8D9A8E",
                dayInkHex: "#5B6A5D",
                sheen: 0.78,
                roughness: 0.28,
                metallic: 0.0,
            },
            {
                name: "Warm Brass",
                hex: "#C8A464",
                dayInkHex: "#8F6E32",
                sheen: 1.45,
                roughness: 0.22,
                metallic: 0.55,
            },
        ],
    };
    const ops = [];
    const innerClip = shapeSvgPath("capsule", -22);
    // Layer 1 (Recessed): Vernier caliper graduation ruler scales + optical datum axis (Sage-Grey [2])
    const scaleD = [
        "M -192 -128 L 192 -128",
        "M -192 128 L 192 128",
        "M -282 0 L 282 0",
        circlePath(0, 0, 114.0),
    ];
    for (let x = -180; x <= 180; x += 15) {
        const major = x % 45 === 0;
        const len = major ? 13 : 7;
        scaleD.push(`M ${x} -128 L ${x} ${-128 + len}`);
        scaleD.push(`M ${x} 128 L ${x} ${128 - len}`);
    }
    ops.push({
        d: scaleD.join(" "),
        layer: "recessed",
        thread: 2,
        region: "satin",
        mode: "stroke",
        strokeWidth: 2.5,
        clipPath: innerClip,
    });
    // Layer 2 (Main): Central 6-Blade Optical Aperture Iris centered at (0, 0)
    // Outer barrel ring (Chalk White [1]) + inner track ring (Sage-Grey [2])
    ops.push({
        d: circlePath(0, 0, 96.0),
        layer: "main",
        thread: 1,
        region: "satin",
        mode: "stroke",
        strokeWidth: 5.0,
    });
    ops.push({
        d: circlePath(0, 0, 81.0),
        layer: "main",
        thread: 2,
        region: "satin",
        mode: "stroke",
        strokeWidth: 2.8,
    });
    // 6 interlocking spiral iris blades around R=31 hexagonal opening (clean > 4.5 px clearance outside brass collar!)
    for (let i = 0; i < 6; i++) {
        const a0 = (i * 60 * Math.PI) / 180;
        const a1 = ((i * 60 + 50) * Math.PI) / 180;
        const aMid = ((i * 60 + 18) * Math.PI) / 180;
        const rIn = 37.5;
        const rOut = 76.0;
        const p0x = Math.cos(a0) * rIn;
        const p0y = Math.sin(a0) * rIn;
        const p1x = Math.cos(aMid) * rOut;
        const p1y = Math.sin(aMid) * rOut;
        const p2x = Math.cos(a1) * rOut;
        const p2y = Math.sin(a1) * rOut;
        const p3x = Math.cos(a1 - 0.14) * (rIn + 2.2);
        const p3y = Math.sin(a1 - 0.14) * (rIn + 2.2);
        const bladeD = `M ${fmt(p0x)} ${fmt(p0y)} L ${fmt(p1x)} ${fmt(p1y)} A ${fmt(rOut)} ${fmt(rOut)} 0 0 1 ${fmt(p2x)} ${fmt(p2y)} L ${fmt(p3x)} ${fmt(p3y)} Z`;
        const isHero = i === 5; // Hero upper-right Signal Orange [0] shutter blade!
        ops.push({
            d: bladeD,
            layer: "main",
            thread: isHero ? 0 : 1,
            region: i % 2 === 0 ? "tatami_a" : "tatami_b",
            mode: "fill",
        });
    }
    // Left & right semicircular framing brackets (mirroring capsule curvature cleanly)
    ops.push({
        d: arcPath(-148, 0, 144, 212, 328),
        layer: "main",
        thread: 2,
        region: "satin",
        mode: "stroke",
        strokeWidth: 3.4,
    });
    ops.push({
        d: arcPath(148, 0, 144, 32, 148),
        layer: "main",
        thread: 2,
        region: "satin",
        mode: "stroke",
        strokeWidth: 3.4,
    });
    // Left Semicircle Typography (right-aligned facing the central optical iris)
    pushText(ops, "2030", -124, -54, 18.8, 3.9, 3.0, "sans", "right", 1.06, "main", 0);
    pushText(ops, "KINETIC", -124, -14, 17.5, 3.6, 2.8, "sans", "right", 1.04, "main", 1);
    pushText(ops, "OPTICS", -124, 24, 17.5, 3.6, 2.8, "sans", "right", 1.04, "main", 1);
    pushText(ops, "F/1.4", -124, 60, 14.8, 3.1, 2.6, "mono", "right", 1.0, "main", 2);
    // Right Semicircle Typography (left-aligned facing the central optical iris)
    pushText(ops, "MK-V", 124, -54, 18.8, 3.9, 3.0, "sans", "left", 1.06, "main", 0);
    pushText(ops, "AXIS 01", 124, -14, 16.5, 3.5, 2.6, "mono", "left", 1.0, "main", 1);
    pushText(ops, "50MM", 124, 24, 16.5, 3.5, 2.6, "mono", "left", 1.0, "main", 1);
    pushText(ops, "[ CAL ]", 124, 60, 14.8, 3.1, 2.4, "mono", "left", 1.0, "main", 1);
    // Precision vernier caliper linkage arms at far left (-274) and far right (+274)
    ops.push({
        d: "M -262 -34 L -246 -34 L -246 34 L -262 34 M 262 -34 L 246 -34 L 246 34 L 262 34",
        layer: "main",
        thread: 1,
        region: "satin",
        mode: "stroke",
        strokeWidth: 3.4,
    });
    // Layer 3 (Proud): Warm Brass [3] machined hexagonal aperture collar + Signal Orange [0] witness bars & vernier cursors!
    const hexPts = [];
    for (let i = 0; i < 6; i++) {
        const a = (i * 60 * Math.PI) / 180;
        hexPts.push([Math.cos(a) * 30.5, Math.sin(a) * 30.5]);
    }
    ops.push({
        d: polyPath(hexPts, 0, 0, 0, true),
        layer: "proud",
        thread: 3,
        region: "rail",
        mode: "stroke",
        strokeWidth: 4.4,
        lineJoin: "miter",
    });
    // 3 witness index bars on outer lens barrel + top/bottom vernier pointer chevrons
    const indexBars = [];
    for (const deg of [0, 120, 240]) {
        const rad = ((deg - 90) * Math.PI) / 180;
        indexBars.push(`M ${fmt(Math.cos(rad) * 94)} ${fmt(Math.sin(rad) * 94)} L ${fmt(Math.cos(rad) * 111)} ${fmt(Math.sin(rad) * 111)}`);
    }
    ops.push({
        d: indexBars.join(" "),
        layer: "proud",
        thread: 0,
        region: "rail",
        mode: "stroke",
        strokeWidth: 4.4,
    });
    // Vernier index cursor triangles at top (0, -114) and bottom (0, +114)
    ops.push({
        d: "M 0 -122 L -8 -110 L 8 -110 Z M 0 122 L -8 110 L 8 110 Z",
        layer: "proud",
        thread: 0,
        region: "satin",
        mode: "fill",
    });
    return { meta, ops };
}
// ============================================================================
// BADGE 5 — 2031 · RELAY · Deep-Space Telemetry (Cathedral Arch Vault)
// ============================================================================
function build2031Relay() {
    const meta = {
        index: 5,
        year: "2031",
        slug: "relay",
        code: "2031",
        title: "RELAY",
        subtitle: "Deep-Space Telemetry",
        shape: "arch",
        shapeLabel: "Cathedral Arch",
        weave: "twill",
        weaveLabel: "Prussian Cobalt Twill",
        substrateHex: "#121F36",
        substrateRoughness: 0.48,
        substrateSheen: 0.19,
        substrateAngleDeg: 31.5,
        isLightSubstrate: false,
        tatamiAnglesDeg: [38.0, 148.0, 18.0],
        merrowThread: 0, // Starlight Silver-White rim
        threads: [
            {
                name: "Starlight Silver-White",
                hex: "#EEF2F8",
                dayInkHex: "#13264A",
                sheen: 1.35,
                roughness: 0.18,
                metallic: 0.0,
            },
            {
                name: "Crimson Vermilion",
                hex: "#D83A32",
                dayInkHex: "#C72B24",
                sheen: 1.32,
                roughness: 0.19,
                metallic: 0.0,
            },
            {
                name: "Pale Gold Metallic",
                hex: "#E2C680",
                dayInkHex: "#A47B1E",
                sheen: 1.95,
                roughness: 0.17,
                metallic: 0.68,
            },
            {
                name: "Cobalt Mist",
                hex: "#6E8CB8",
                dayInkHex: "#49658F",
                sheen: 0.85,
                roughness: 0.25,
                metallic: 0.0,
            },
        ],
    };
    const ops = [];
    const innerArch = shapeSvgPath("arch", -20);
    // Dedicated recessed sky-grid clip strictly inside R <= 126 around arch origin (0, -24)
    // so DEEP SPACE RELAY sits on an uninterrupted Prussian Cobalt arch track!
    const skyGridClip = "M -126 -24 A 126 126 0 0 1 126 -24 L 126 134 L -126 134 Z";
    // Inner Cathedral Vault border frame
    ops.push({
        d: innerArch,
        layer: "main",
        thread: 0,
        region: "satin",
        mode: "stroke",
        strokeWidth: 3.6,
    });
    // Layer 1 (Recessed): Celestial sky-grid right-ascension & declination arcs (clipped inside R=126!)
    const skyGrid = [
        arcPath(-52, 134, 150, -24, 68),
        arcPath(-52, 134, 206, -22, 62),
        arcPath(-52, 134, 260, -18, 56),
        "M -52 134 L -128 -90",
        "M -52 134 L -20 -150",
        "M -52 134 L 106 -110",
    ].join(" ");
    ops.push({
        d: skyGrid,
        layer: "recessed",
        thread: 3,
        region: "satin",
        mode: "stroke",
        strokeWidth: 2.5,
        clipPath: skyGridClip,
    });
    // Layer 2 (Main): Curved cathedral arch lettering DEEP SPACE RELAY on clear Prussian Cobalt track
    pushArcText(ops, "DEEP SPACE RELAY", 0, -24, 148, -62, 62, 17.6, 3.4, "sans", "main", 0, "clockwise");
    // 6 Constellation 5-Facet Mitered Stars in Pale Gold [2]
    const stars = [
        [-96, -72, 13.0, 0.08],
        [-132, -12, 9.6, -0.14],
        [-42, -98, 10.6, 0.12],
        [136, -12, 11.4, -0.09],
        [-124, 48, 9.8, 0.16],
        [136, 56, 12.2, -0.11],
    ];
    for (const [sx, sy, sr, srot] of stars) {
        ops.push({
            d: starPath(sx, sy, sr, sr * 0.42, srot),
            layer: "main",
            thread: 2,
            region: "star",
            mode: "both",
            strokeWidth: 0.9,
            lineJoin: "round",
        });
    }
    // Parabolic Deep-Space Telemetry Dish anchored at lower-left (-54, +82), aimed up-right at -40 deg
    const dishCx = -54;
    const dishCy = 80;
    const dishTilt = -40;
    // Triangular truss pedestal anchoring the dish to the horizon bar (Layer 2 Main, cleanly behind proud dish bowl!)
    ops.push({
        d: "M -84 138 L -58 94 L -32 138 M -72 118 L -44 118",
        layer: "main",
        thread: 0,
        region: "satin",
        mode: "stroke",
        strokeWidth: 4.0,
        lineJoin: "bevel",
    });
    // Feed-horn tripod struts converging onto Crimson beacon (Layer 2 Main)
    const feedStruts = [
        polyPath([
            [-8, -40],
            [42, 0],
            [-8, 40],
        ], dishCx, dishCy, dishTilt, false),
        polyPath([
            [12, 0],
            [42, 0],
        ], dishCx, dishCy, dishTilt, false),
    ].join(" ");
    ops.push({
        d: feedStruts,
        layer: "main",
        thread: 0,
        region: "satin",
        mode: "stroke",
        strokeWidth: 3.0,
        lineJoin: "bevel",
    });
    // Expanding telemetry signal wave arcs in Pale Gold [2] beaming cleanly from dish toward Saturn (zero red X-crossing!)
    const beaconX = dishCx + Math.cos((dishTilt * Math.PI) / 180) * 42;
    const beaconY = dishCy + Math.sin((dishTilt * Math.PI) / 180) * 42;
    const waveArcs = [
        arcPath(beaconX, beaconY, 19, 24, 78),
        arcPath(beaconX, beaconY, 33, 27, 75),
        arcPath(beaconX, beaconY, 47, 30, 72),
    ].join(" ");
    ops.push({
        d: waveArcs,
        layer: "main",
        thread: 2,
        region: "satin",
        mode: "stroke",
        strokeWidth: 3.0,
    });
    // Bottom Mission Footer Band (horizon rule + 2031 · AU-42 · DSN-7)
    ops.push({
        d: "M -162 138 L 162 138",
        layer: "main",
        thread: 0,
        region: "satin",
        mode: "stroke",
        strokeWidth: 3.6,
    });
    pushText(ops, "2031", -104, 172, 17.5, 3.6, 2.8, "sans", "center", 1.04, "main", 2);
    pushText(ops, "AU-42", 4, 172, 17.5, 3.6, 2.8, "sans", "center", 1.04, "main", 1);
    pushText(ops, "DSN-7", 108, 172, 16.0, 3.3, 2.4, "mono", "center", 0.98, "main", 0);
    // Tilted Saturnian Ringed Planet at (54, -44):
    // Unified Starlight Silver-White [0] ring (analytically occluded behind R=28 planet sphere in BOTH <svg> & WebGL2!)
    const satX = 54;
    const satY = -44;
    const ringRad = (-22 * Math.PI) / 180;
    const rc = Math.cos(ringRad);
    const rs = Math.sin(ringRad);
    const ringPt = (lx, ly) => [
        satX + lx * rc - ly * rs,
        satY + lx * rs + ly * rc,
    ];
    const [rxTip, ryTip] = ringPt(64, 0);
    const [lxTip, lyTip] = ringPt(-64, 0);
    // Exact analytical intersection of tilted ellipse (rx=64, ry=17) with R=28 planet disk (t = -111 deg, -69 deg)
    const [lbX, lbY] = ringPt(-22.94, -15.87);
    const [rbX, rbY] = ringPt(22.94, -15.87);
    // Back ring wings strictly OUTSIDE the R=28 planet disk (Layer 2 Main, unified Starlight [0])
    ops.push({
        d: `M ${fmt(lxTip)} ${fmt(lyTip)} A 64 17 -22 0 1 ${fmt(lbX)} ${fmt(lbY)} M ${fmt(rbX)} ${fmt(rbY)} A 64 17 -22 0 1 ${fmt(rxTip)} ${fmt(ryTip)}`,
        layer: "main",
        thread: 0,
        region: "rail",
        mode: "stroke",
        strokeWidth: 4.8,
    });
    // Pale Gold Metallic [2] Saturn planet sphere (Layer 2 Main tatami_b)
    ops.push({
        d: circlePath(satX, satY, 28.0),
        layer: "main",
        thread: 2,
        region: "tatami_b",
        mode: "fill",
    });
    // Layer 3 (Proud): Parabolic Dish Bowl (Starlight [0]), Front Saturn Ring (Starlight [0]), & Uncrossed Crimson Slingshot!
    const dishBowl = polyPath([
        [-12, -50],
        [6, -32],
        [14, -14],
        [16, 0],
        [14, 14],
        [6, 32],
        [-12, 50],
        [-24, 44],
        [-10, 24],
        [-4, 0],
        [-10, -24],
        [-24, -44],
    ], dishCx, dishCy, dishTilt);
    ops.push({ d: dishBowl, layer: "proud", thread: 0, region: "proud", mode: "fill" });
    // Front half of Saturn ring crossing proudly in front of the Pale Gold sphere (same Starlight [0] thread!)
    ops.push({
        d: `M ${fmt(rxTip)} ${fmt(ryTip)} A 64 17 -22 0 1 ${fmt(lxTip)} ${fmt(lyTip)}`,
        layer: "proud",
        thread: 0,
        region: "rail",
        mode: "stroke",
        strokeWidth: 4.8,
    });
    // Hyperbolic Slingshot Trajectory Vector whipping cleanly around Saturn's outer gravity well (zero X-crossing with dish!)
    ops.push({
        d: "M 142 114 C 118 54 116 -12 86 -66 C 62 -106 16 -116 -18 -96",
        layer: "proud",
        thread: 1,
        region: "rail",
        mode: "stroke",
        strokeWidth: 4.0,
    });
    // Trajectory vector arrowhead at (-24, -92) pointing along exit tangent
    ops.push({
        d: "M -28 -90 L -10 -106 L -14 -88 Z",
        layer: "proud",
        thread: 1,
        region: "rail",
        mode: "fill",
    });
    // Dish feed-horn Crimson beacon dot
    ops.push({
        d: circlePath(beaconX, beaconY, 5.2),
        layer: "proud",
        thread: 1,
        region: "rail",
        mode: "fill",
    });
    return { meta, ops };
}
export const BADGES = [
    build2026Apex(),
    build2027Pelagic(),
    build2028Flora(),
    build2029Helios(),
    build2030Kinetic(),
    build2031Relay(),
];
export function findBadgeByYear(year) {
    if (!year)
        return undefined;
    return BADGES.find((b) => b.meta.year === year || b.meta.slug === year.toLowerCase());
}
/** Returns sorted unique thread indices actually stitched on `badge` (Merrow + all vector ops). */
export function activeThreadIndices(badge) {
    const used = new Set([badge.meta.merrowThread]);
    for (const op of badge.ops)
        used.add(op.thread);
    return [...used].sort((a, b) => a - b);
}
// ============================================================================
// 1. Standalone & DOM <svg> Blueprint Serialization (0.00 px Homologous Source)
// ============================================================================
function escapeXml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
/**
 * Generates clean, semantic SVG markup for either:
 *  - `mode = "blueprint"`: Live DOM blueprint inside the specimen card & modal (CSS-themed for Day/Night
 *    Swiss architectural drafting with crisp registration ticks & dashed Merrow trim guide).
 *  - `mode = "export"`: Self-contained downloadable `.svg` file with true substrate fill, Merrow stroke,
 *    and authentic thread hex colors ready for Figma/Illustrator/Inkscape.
 */
export function buildBadgeSvgMarkup(badge, mode, idPrefix = "p") {
    const { meta, ops } = badge;
    const bounds = shapeOuterBounds(meta.shape);
    const outerOutline = shapeSvgPath(meta.shape, MERROW_HALF_W);
    const centerOutline = shapeSvgPath(meta.shape, 0);
    const innerOutline = shapeSvgPath(meta.shape, -MERROW_HALF_W);
    const merrowHex = meta.threads[meta.merrowThread].hex;
    // Deduplicate clip paths cleanly
    const clipMap = new Map();
    let clipCount = 0;
    for (const op of ops) {
        if (op.clipPath && !clipMap.has(op.clipPath)) {
            clipMap.set(op.clipPath, `${idPrefix}-clip-${meta.year}-${clipCount++}`);
        }
    }
    const defsParts = [];
    for (const [d, id] of clipMap.entries()) {
        defsParts.push(`    <clipPath id="${id}"><path d="${d}" /></clipPath>`);
    }
    const defs = defsParts.length ? `  <defs>\n${defsParts.join("\n")}\n  </defs>\n` : "";
    // Drafting chrome (blueprint mode) OR physical silhouette base (export mode)
    let chrome = "";
    if (mode === "blueprint") {
        const cx = bounds.hw + 14;
        const yt = bounds.top - 14;
        const yb = bounds.bot + 14;
        const tick = 10;
        const crops = [
            `M ${fmt(-cx)} ${fmt(yt + tick)} L ${fmt(-cx)} ${fmt(yt)} L ${fmt(-cx + tick)} ${fmt(yt)}`,
            `M ${fmt(cx - tick)} ${fmt(yt)} L ${fmt(cx)} ${fmt(yt)} L ${fmt(cx)} ${fmt(yt + tick)}`,
            `M ${fmt(-cx)} ${fmt(yb - tick)} L ${fmt(-cx)} ${fmt(yb)} L ${fmt(-cx + tick)} ${fmt(yb)}`,
            `M ${fmt(cx - tick)} ${fmt(yb)} L ${fmt(cx)} ${fmt(yb)} L ${fmt(cx)} ${fmt(yb - tick)}`,
        ].join(" ");
        chrome = [
            `  <g class="bp-chrome" data-blueprint-chrome="true">`,
            `    <path class="bp-substrate" d="${outerOutline}" />`,
            `    <path class="bp-outer" d="${outerOutline}" />`,
            `    <path class="bp-merrow" d="${centerOutline}" />`,
            `    <path class="bp-inner" d="${innerOutline}" />`,
            `    <path class="bp-ticks" d="${crops}" />`,
            `  </g>`,
        ].join("\n");
    }
    else {
        chrome = [
            `  <g data-layer="substrate" data-weave="${meta.weave}" data-shape="${meta.shape}">`,
            `    <path d="${outerOutline}" fill="${meta.substrateHex}" />`,
            `    <path d="${centerOutline}" fill="none" stroke="${merrowHex}" stroke-width="${MERROW_WIDTH}" stroke-linejoin="round" />`,
            `  </g>`,
        ].join("\n");
    }
    // Group ops by physical layer order: recessed -> main -> proud
    const layerOrder = ["recessed", "main", "proud"];
    const layerGroups = [];
    for (const layer of layerOrder) {
        const layerOps = ops.filter((o) => o.layer === layer);
        if (!layerOps.length)
            continue;
        const lines = [`  <g data-layer="${layer}">`];
        for (const op of layerOps) {
            const th = meta.threads[op.thread];
            const clipAttr = op.clipPath ? ` clip-path="url(#${clipMap.get(op.clipPath)})"` : "";
            const isProudOrStar = op.region === "proud" || op.region === "star";
            let fillVal;
            let strokeVal;
            let swAttr = "";
            if (mode === "export") {
                fillVal = op.mode === "stroke" ? "none" : th.hex;
                strokeVal = op.mode === "fill" ? "none" : th.hex;
                if (op.mode !== "fill" && op.strokeWidth) {
                    swAttr = ` stroke-width="${fmt(op.strokeWidth)}"`;
                }
            }
            else {
                // Pure monochrome CAD/drafting blueprint ("before" state) for maximum contrast against 3D color stitch
                fillVal =
                    op.mode === "stroke"
                        ? "none"
                        : isProudOrStar
                            ? "var(--bp-wash-strong)"
                            : "var(--bp-wash)";
                strokeVal = "var(--bp-ink)";
                const bpSw = op.mode === "fill" ? 1.25 : (op.strokeWidth ?? 1.5);
                swAttr = ` stroke-width="${fmt(bpSw)}"`;
            }
            const lcAttr = ` stroke-linecap="${op.lineCap ?? "round"}"`;
            const ljAttr = ` stroke-linejoin="${op.lineJoin ?? "round"}"`;
            lines.push(`    <path d="${op.d}" data-layer="${op.layer}" data-thread="${op.thread}" data-region="${op.region}" fill="${fillVal}" stroke="${strokeVal}"${swAttr}${lcAttr}${ljAttr}${clipAttr} />`);
        }
        lines.push("  </g>");
        layerGroups.push(lines.join("\n"));
    }
    const header = mode === "export" ? `<?xml version="1.0" encoding="UTF-8"?>\n` : "";
    const titleTag = `  <title>${escapeXml(`${meta.year} ${meta.title} — ${meta.subtitle}`)}</title>\n`;
    return `${header}<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-VIEW_W / 2} ${-VIEW_H / 2} ${VIEW_W} ${VIEW_H}" preserveAspectRatio="xMidYMid meet" class="badge-svg" data-badge="${meta.year}" data-shape="${meta.shape}" data-weave="${meta.weave}">\n${titleTag}${defs}${chrome}\n${layerGroups.join("\n")}\n</svg>`;
}
export function createBakeScratchCanvases() {
    const mk = (w, h) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        return c;
    };
    return {
        layerCanvas: mk(BAKE_W, BAKE_H),
        regionCanvas: mk(ATLAS_TILE_W, ATLAS_TILE_H),
        threadCanvas: mk(ATLAS_TILE_W, ATLAS_TILE_H),
        cR: mk(BAKE_W, BAKE_H),
        cG: mk(BAKE_W, BAKE_H),
        cB: mk(BAKE_W, BAKE_H),
        cTR: mk(ATLAS_TILE_W, ATLAS_TILE_H),
        cTG: mk(ATLAS_TILE_W, ATLAS_TILE_H),
        cTB: mk(ATLAS_TILE_W, ATLAS_TILE_H),
    };
}
function setupBadgeTransform(ctx, scale) {
    ctx.setTransform(scale, 0, 0, scale, BAKE_REF_W * 0.5 * scale, BAKE_REF_H * 0.5 * scale);
}
function drawOp(ctx, op, color, dilatePx = 0) {
    const path = new Path2D(op.d);
    ctx.save();
    if (op.clipPath) {
        ctx.clip(new Path2D(op.clipPath));
    }
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = op.lineCap ?? "butt";
    ctx.lineJoin = op.lineJoin ?? "miter";
    ctx.miterLimit = 3.2;
    if (op.mode === "fill") {
        ctx.fill(path);
        if (dilatePx > 0) {
            ctx.lineWidth = dilatePx * 2;
            ctx.lineJoin = "round";
            ctx.stroke(path);
        }
    }
    else if (op.mode === "stroke") {
        ctx.lineWidth = (op.strokeWidth ?? 3.0) + dilatePx * 2;
        ctx.stroke(path);
    }
    else {
        ctx.fill(path);
        ctx.lineWidth = (op.strokeWidth ?? 1.0) + dilatePx * 2;
        ctx.stroke(path);
    }
    ctx.restore();
}
/**
 * Rasterizes one badge's homologous vector ops into reusable scratch canvases ready for direct
 * `gl.texSubImage2D(..., canvas)` upload with ZERO `getImageData()` CPU readback!
 */
export function rasterizeBadgeIntoScratch(badge, scratch) {
    const ctxLayer = scratch.layerCanvas.getContext("2d");
    const ctxR = scratch.cR.getContext("2d");
    const ctxG = scratch.cG.getContext("2d");
    const ctxB = scratch.cB.getContext("2d");
    const ctxReg = scratch.regionCanvas.getContext("2d");
    const ctxThr = scratch.threadCanvas.getContext("2d");
    const ctxTR = scratch.cTR.getContext("2d");
    const ctxTG = scratch.cTG.getContext("2d");
    const ctxTB = scratch.cTB.getContext("2d");
    // Clear all single-channel scratch canvases
    for (const c of [ctxR, ctxG, ctxB]) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, BAKE_W, BAKE_H);
        setupBadgeTransform(c, BAKE_SCALE);
    }
    for (const c of [ctxReg, ctxTR, ctxTG, ctxTB]) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, ATLAS_TILE_W, ATLAS_TILE_H);
        c.imageSmoothingEnabled = false;
        setupBadgeTransform(c, 1.0);
    }
    // Fill solid black background on regionCanvas & thread canvases so non-drawn pixels = 0
    ctxReg.setTransform(1, 0, 0, 1, 0, 0);
    ctxReg.fillStyle = "#000000";
    ctxReg.fillRect(0, 0, ATLAS_TILE_W, ATLAS_TILE_H);
    setupBadgeTransform(ctxReg, 1.0);
    // Thread encoding in [0..3]: store (thread * 64 + 32) so 8-bit decode floor(v * 4) is exact
    // even across minor Canvas2D rounding; only write on dilated footprint (+2.4 px) so every
    // antialiased edge pixel inherits its exact thread index with zero bleed!
    const threadByte = (t) => t * 64 + 32;
    // Pass 1 (dilated +2.2 px): ensures every exterior antialiased stitch pixel inherits its exact
    // region & thread ID; Pass 2 (exact 0 px): restores 0.00 px interior seams where two thread colors touch!
    for (const pass of [0, 1]) {
        const dilate = pass === 0 ? 2.2 : 0;
        for (const op of badge.ops) {
            if (pass === 0) {
                // High-res 2x coverage layers (R=recessed, G=main, B=proud)
                if (op.layer === "recessed")
                    drawOp(ctxR, op, "#ff0000", 0);
                else if (op.layer === "main")
                    drawOp(ctxG, op, "#00ff00", 0);
                else
                    drawOp(ctxB, op, "#0000ff", 0);
            }
            // Thread IDs per layer
            if (op.layer === "recessed") {
                drawOp(ctxTR, op, `rgb(${threadByte(op.thread)},0,0)`, dilate);
            }
            else if (op.layer === "main") {
                drawOp(ctxTG, op, `rgb(0,${threadByte(op.thread)},0)`, dilate);
            }
            else {
                drawOp(ctxTB, op, `rgb(0,0,${threadByte(op.thread)})`, dilate);
            }
            // Exact region ID (on pass 0 only non-default regions dilate; on pass 1 exact regions overwrite cleanly)
            const code = REGION_CODE[op.region];
            if (pass === 0) {
                if (op.region !== "satin")
                    drawOp(ctxReg, op, `rgb(${code},0,0)`, dilate);
            }
            else if (op.layer !== "recessed") {
                drawOp(ctxReg, op, `rgb(${code},0,0)`, 0);
            }
        }
    }
    // Composite R + G + B layers onto opaque #000 layerCanvas via "lighter" (zero premul loss!)
    ctxLayer.setTransform(1, 0, 0, 1, 0, 0);
    ctxLayer.globalCompositeOperation = "source-over";
    ctxLayer.fillStyle = "#000000";
    ctxLayer.fillRect(0, 0, BAKE_W, BAKE_H);
    ctxLayer.globalCompositeOperation = "lighter";
    ctxLayer.drawImage(scratch.cR, 0, 0);
    ctxLayer.drawImage(scratch.cG, 0, 0);
    ctxLayer.drawImage(scratch.cB, 0, 0);
    ctxLayer.globalCompositeOperation = "source-over";
    // Composite R(tRec) + G(tMain) + B(tProud) onto opaque #000 threadCanvas via "lighter"
    ctxThr.setTransform(1, 0, 0, 1, 0, 0);
    ctxThr.globalCompositeOperation = "source-over";
    ctxThr.fillStyle = "#000000";
    ctxThr.fillRect(0, 0, ATLAS_TILE_W, ATLAS_TILE_H);
    ctxThr.globalCompositeOperation = "lighter";
    ctxThr.drawImage(scratch.cTR, 0, 0);
    ctxThr.drawImage(scratch.cTG, 0, 0);
    ctxThr.drawImage(scratch.cTB, 0, 0);
    ctxThr.globalCompositeOperation = "source-over";
}
export function hexToLinearRgb(hex) {
    const clean = hex.replace(/^#/, "");
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return [toLin(r), toLin(g), toLin(b)];
}
export { SHAPE_ID };
