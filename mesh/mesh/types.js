// Shared types, specimen specifications, and deterministic layout geometry for Mesh Gradient.
// Both the WebGL2 shaders (via MeshRenderer uniforms) and the HTML editorial overlays
// consume these exact layout functions so typography locks to optical surfaces to 0.0px.
export const PLATES = ["veil", "plume", "prism", "lantern"];
export const VEIL_SHAPES = ["squircle", "circle", "reuleaux", "pentagon"];
export const PLUME_SHEETS = ["wash", "bloom", "emission"];
export const PRISM_SHAPES = ["spool", "dome", "diamond", "tetra", "slit"];
export const LANTERN_SPECS = [
    { slug: "tangent", label: "Tangent", aspect: 1.48 },
    { slug: "aperture", label: "Aperture", aspect: 0.94 },
    { slug: "cipher", label: "Cipher", aspect: 1.62 },
    { slug: "foci", label: "Foci", aspect: 1.00 },
    { slug: "warp", label: "Warp", aspect: 1.66 },
    { slug: "reeded", label: "Reeded", aspect: 0.94 },
];
export const PLUME_LAYOUT = {
    padX: 0.036,
    padY: 0.052,
    gapX: 0.024,
    narrowBreakpoint: 640,
    narrowPadX: 0.028,
    narrowPadY: 0.085,
    narrowGapX: 0.018,
    maxSheetAspect: 0.72,
    minSheetAspect: 0.44,
};
export const LANTERN_LAYOUT = {
    heightRatioH: 0.46,
    heightRatioW: 0.40,
    minCardH: 96,
    maxCardH: 312,
    gapRatio: 0.115,
    verticalWidthRatio: 0.66,
    minVertCardW: 148,
    maxVertCardW: 292,
    exponent: 4.6,
};
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const clamp01 = (v) => clamp(v, 0, 1);
/** Returns true when the Lantern container is tall enough to stack vessels vertically. */
export function isVerticalLantern(w, h) {
    return h > w * 1.05;
}
/**
 * Deterministic 3-sheet triptych layout for Plate II (Plume) in CSS pixels (top-left origin).
 * Tight margins keep all three Swiss posters ~255-270px wide on span-8 desktop tiles so the
 * 2-column Swiss poster grid stays uncollapsed across desktop and tablet viewports.
 */
export function getPlumeSheetRects(w, h) {
    const safeW = Math.max(1, w);
    const safeH = Math.max(1, h);
    const narrow = clamp01((PLUME_LAYOUT.narrowBreakpoint - safeW) / 240);
    const padX = (PLUME_LAYOUT.padX + (PLUME_LAYOUT.narrowPadX - PLUME_LAYOUT.padX) * narrow) * safeW;
    const padY = (PLUME_LAYOUT.padY + (PLUME_LAYOUT.narrowPadY - PLUME_LAYOUT.padY) * narrow) * safeH;
    const gap = (PLUME_LAYOUT.gapX + (PLUME_LAYOUT.narrowGapX - PLUME_LAYOUT.gapX) * narrow) * safeW;
    const availW = Math.max(3, safeW - padX * 2 - gap * 2);
    const availH = Math.max(1, safeH - padY * 2);
    let sheetW = availW / 3;
    let sheetH = availH;
    if (sheetW > sheetH * PLUME_LAYOUT.maxSheetAspect) {
        sheetW = sheetH * PLUME_LAYOUT.maxSheetAspect;
    }
    else if (sheetH > sheetW / PLUME_LAYOUT.minSheetAspect) {
        sheetH = sheetW / PLUME_LAYOUT.minSheetAspect;
    }
    const totalW = sheetW * 3 + gap * 2;
    const startX = (safeW - totalW) * 0.5;
    const startY = (safeH - sheetH) * 0.5;
    return [
        { x: startX, y: startY, w: sheetW, h: sheetH },
        { x: startX + sheetW + gap, y: startY, w: sheetW, h: sheetH },
        { x: startX + (sheetW + gap) * 2, y: startY, w: sheetW, h: sheetH },
    ];
}
/**
 * Deterministic cyclic carousel layout for Plate IV (Lantern) in CSS pixels (top-left origin).
 * Automatically stacks vessels vertically when `isVerticalLantern(w, h)` is true (for the tall
 * Bento pillar and mobile totem) and horizontally when wide. Always returns all 6 slots ordered
 * by index (0..5) so both GLSL uniforms and DOM labels update in place with 0.0px lock.
 */
export function getLanternSlotRects(scroll, w, h) {
    const safeW = Math.max(1, w);
    const safeH = Math.max(1, h);
    const count = LANTERN_SPECS.length;
    const baseIdx = Math.floor(scroll);
    const frac = scroll - baseIdx;
    const wrappedIdx = ((baseIdx % count) + count) % count;
    const wrappedScroll = ((scroll % count) + count) % count;
    if (isVerticalLantern(safeW, safeH)) {
        const cardW = clamp(safeW * LANTERN_LAYOUT.verticalWidthRatio, LANTERN_LAYOUT.minVertCardW, LANTERN_LAYOUT.maxVertCardW);
        const gap = clamp(safeH * 0.036, 16, 28);
        const heights = new Array(count);
        for (let i = 0; i < count; i++) {
            const effAspect = clamp(LANTERN_SPECS[i].aspect * 0.86, 0.90, 1.36);
            heights[i] = cardW / effAspect;
        }
        const steps = new Array(count);
        const pos = new Array(count + 1);
        pos[0] = 0;
        for (let i = 0; i < count; i++) {
            const next = (i + 1) % count;
            steps[i] = 0.5 * heights[i] + gap + 0.5 * heights[next];
            pos[i + 1] = pos[i] + steps[i];
        }
        const cycleLength = pos[count];
        const cameraY = pos[wrappedIdx] + frac * steps[wrappedIdx];
        const leftX = (safeW - cardW) * 0.5;
        const centerY = safeH * 0.5;
        const rects = new Array(count);
        for (let i = 0; i < count; i++) {
            let dy = pos[i] - cameraY;
            dy = ((((dy + cycleLength * 0.5) % cycleLength) + cycleLength) % cycleLength) - cycleLength * 0.5;
            let dist = i - wrappedScroll;
            if (dist > count * 0.5)
                dist -= count;
            if (dist < -count * 0.5)
                dist += count;
            const spec = LANTERN_SPECS[i];
            const ch = heights[i];
            rects[i] = {
                index: i,
                slug: spec.slug,
                label: spec.label,
                x: leftX,
                y: centerY + dy - ch * 0.5,
                w: cardW,
                h: ch,
                dist,
            };
        }
        return rects;
    }
    // Horizontal cyclic layout (wide stages)
    const cardH = Math.max(LANTERN_LAYOUT.minCardH, Math.min(safeH * LANTERN_LAYOUT.heightRatioH, safeW * LANTERN_LAYOUT.heightRatioW, LANTERN_LAYOUT.maxCardH));
    const gap = cardH * LANTERN_LAYOUT.gapRatio;
    const widths = new Array(count);
    for (let i = 0; i < count; i++) {
        widths[i] = cardH * LANTERN_SPECS[i].aspect;
    }
    const steps = new Array(count);
    const pos = new Array(count + 1);
    pos[0] = 0;
    for (let i = 0; i < count; i++) {
        const next = (i + 1) % count;
        steps[i] = 0.5 * widths[i] + gap + 0.5 * widths[next];
        pos[i + 1] = pos[i] + steps[i];
    }
    const cycleLength = pos[count];
    const cameraX = pos[wrappedIdx] + frac * steps[wrappedIdx];
    const centerX = safeW * 0.5;
    const topY = (safeH - cardH) * 0.5;
    const rects = new Array(count);
    for (let i = 0; i < count; i++) {
        let dx = pos[i] - cameraX;
        dx = ((((dx + cycleLength * 0.5) % cycleLength) + cycleLength) % cycleLength) - cycleLength * 0.5;
        let dist = i - wrappedScroll;
        if (dist > count * 0.5)
            dist -= count;
        if (dist < -count * 0.5)
            dist += count;
        const spec = LANTERN_SPECS[i];
        const cw = widths[i];
        rects[i] = {
            index: i,
            slug: spec.slug,
            label: spec.label,
            x: centerX + dx - cw * 0.5,
            y: topY,
            w: cw,
            h: cardH,
            dist,
        };
    }
    return rects;
}
