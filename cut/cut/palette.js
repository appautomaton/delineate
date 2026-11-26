// World 01 · Silver Gelatin & Cinnabar (Leica Darkroom x delineate Monochrome)
// Single source of truth for Cut's unified color architecture and cached mineral image LUTs.
//
// Proportions: 75% Void / Archival Rag · 18% Bone / Graphite · 5% Champagne Glass · 2% Cinnabar.
export const PALETTE = {
    // Core polarity surfaces
    paperLight: "#F6F5F0",
    paperWarmShadow: "#E4E1D8",
    obsidianVoid: "#08090B",
    surfaceElevated: "#121418",
    surfaceCharcoal: "#16171A",
    // Typography & architectural hairlines
    inkDark: "#161615",
    inkLight: "#F2EFE9",
    inkSoft: "rgba(242, 239, 233, 0.68)",
    hairlineMuted: "#6E6D68",
    // Disciplined mineral accents (< 7% frame area)
    primaryAccent: "#D6CFAF", // Champagne tungsten glass
    secondaryAtmosphere: "#4A5568", // Platinum-slate shadow lift
    cvRegistrationTick: "#D9412B", // Swiss cinnabar (2% micro-accent)
    halationTint: "#D95B38", // Kodak warm photochemical halation
    anamorphicTint: "#C8D3E6", // Cool platinum-silver optical streak
    eyeIrisGrade: "#9E9580", // Warm mineral champagne iris
    // WebGL2 normalized [r, g, b] tuples
    gl: {
        paperLight: [0.965, 0.961, 0.941],
        obsidianVoid: [0.031, 0.035, 0.043],
        inkDark: [0.086, 0.086, 0.082],
        champagne: [0.839, 0.812, 0.686],
        slate: [0.290, 0.333, 0.408],
        cinnabar: [0.851, 0.255, 0.169],
        halation: [0.851, 0.357, 0.220],
        anamorphic: [0.784, 0.827, 0.902],
        plasmaStops: [
            [0.106, 0.133, 0.188], // #1B2230 Deep selenium slate
            [0.361, 0.420, 0.494], // #5C6B7E Brushed platinum
            [0.839, 0.812, 0.686], // #D6CFAF Champagne glass
            [0.957, 0.945, 0.918], // #F4F1EA Warm bone highlight
        ],
    },
};
const plateCache = new WeakMap();
const eyeCache = new WeakMap();
function clampByte(v) {
    return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}
/**
 * Once-per-image World 01 Silver Gelatin & Champagne split-tone LUT.
 * Converts photographic plates into cohesive Leica darkroom tone:
 *   deep selenium obsidian (#08090B) -> platinum slate (#4A5568) -> champagne (#D6CFAF) -> rag (#F6F5F0),
 * preserving a whisper (~12%) of original hue nuance so every plate remains distinct yet unified.
 */
export function getGradedPlate(img) {
    if (!img || !img.complete || img.naturalWidth === 0)
        return null;
    const hit = plateCache.get(img);
    if (hit)
        return hit;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx)
        return null;
    ctx.drawImage(img, 0, 0, w, h);
    const frame = ctx.getImageData(0, 0, w, h);
    const d = frame.data;
    for (let i = 0; i < d.length; i += 4) {
        const sr = d[i];
        const sg = d[i + 1];
        const sb = d[i + 2];
        const l = (0.2126 * sr + 0.7152 * sg + 0.0722 * sb) / 255;
        // Gentle S-curve micro-contrast for silver-gelatin print depth
        const t = Math.max(0, Math.min(1, l * l * (3 - 2 * l) * 0.35 + l * 0.65));
        let tr;
        let tg;
        let tb;
        if (t < 0.42) {
            const u = t / 0.42;
            // #08090B -> #3B424D (selenium obsidian to cool platinum shadow)
            tr = 8 + (59 - 8) * u;
            tg = 9 + (66 - 9) * u;
            tb = 11 + (77 - 11) * u;
        }
        else if (t < 0.78) {
            const u = (t - 0.42) / 0.36;
            // #3B424D -> #D6CFAF (platinum midtone to warm champagne tungsten)
            tr = 59 + (214 - 59) * u;
            tg = 66 + (207 - 66) * u;
            tb = 77 + (175 - 77) * u;
        }
        else {
            const u = (t - 0.78) / 0.22;
            // #D6CFAF -> #F6F5F0 (champagne highlight to archival cotton rag)
            tr = 214 + (246 - 214) * u;
            tg = 207 + (245 - 207) * u;
            tb = 175 + (240 - 175) * u;
        }
        // Preserve 12% original chroma whisper so plates never collapse into identical flat grey
        d[i] = clampByte(tr * 0.88 + sr * 0.12);
        d[i + 1] = clampByte(tg * 0.88 + sg * 0.12);
        d[i + 2] = clampByte(tb * 0.88 + sb * 0.12);
    }
    ctx.putImageData(frame, 0, 0);
    plateCache.set(img, c);
    return c;
}
/**
 * Once-per-image Strict 3-Value Mineral Eye LUT (`eye.jpg` -> World 01 Leica Editorial Eye).
 * Enforces anatomical clarity and eliminates uncanny-valley pink sclera veins & black-void irises:
 *   1. Sclera / lid skin: 100% desaturated into calm alabaster-stone & soft selenium shadow.
 *   2. Striated iris ring: lifted & graded into luminous warm champagne-mineral (#9E9580..#D6CFAF)
 *      preserving radial fiber detail so iris & pupil NEVER merge into a dark void.
 *   3. Anatomical pupil core: crisp deep velvet obsidian (#08090B).
 */
export function getGradedEye(img) {
    if (!img || !img.complete || img.naturalWidth === 0)
        return null;
    const hit = eyeCache.get(img);
    if (hit)
        return hit;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx)
        return null;
    ctx.drawImage(img, 0, 0, w, h);
    const frame = ctx.getImageData(0, 0, w, h);
    const d = frame.data;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        // Weight green/blue slightly higher than red to naturally erase red capillary veins in sclera!
        const lum = (0.16 * r + 0.56 * g + 0.28 * b) / 255;
        // Detect greenish-hazel iris fibers vs warm pink sclera/skin
        const greenExcess = Math.max(0, (g - r * 0.88) / 255);
        const isIrisTone = Math.min(1, greenExcess * 5.2) * (lum > 0.08 && lum < 0.72 ? 1 : 0);
        // Preserve distinct deep velvet pupil (lum < 0.09), lift striated mid-value iris clearly!
        const pupilMask = lum < 0.11 ? Math.max(0, 1 - lum / 0.11) : 0;
        const lifted = pupilMask > 0.15
            ? lum * 0.55
            : Math.min(1, Math.pow(lum, 0.84) * 1.08 + isIrisTone * 0.16);
        // Base cool selenium-alabaster silver-gelatin ramp
        let tr;
        let tg;
        let tb;
        if (lifted < 0.35) {
            const u = lifted / 0.35;
            tr = 8 + (62 - 8) * u;
            tg = 9 + (64 - 9) * u;
            tb = 11 + (68 - 11) * u;
        }
        else if (lifted < 0.75) {
            const u = (lifted - 0.35) / 0.40;
            tr = 62 + (176 - 62) * u;
            tg = 64 + (172 - 64) * u;
            tb = 68 + (162 - 68) * u;
        }
        else {
            const u = (lifted - 0.75) / 0.25;
            tr = 176 + (244 - 176) * u;
            tg = 172 + (242 - 172) * u;
            tb = 162 + (235 - 162) * u;
        }
        // Warm mineral champagne glow strictly in the striated iris fibers (#9E9580 -> #D6CFAF)
        if (isIrisTone > 0.02) {
            const iw = isIrisTone * 0.72;
            const ir = 158 + lifted * 76;
            const ig = 149 + lifted * 72;
            const ib = 128 + lifted * 56;
            tr = tr * (1 - iw) + ir * iw;
            tg = tg * (1 - iw) + ig * iw;
            tb = tb * (1 - iw) + ib * iw;
        }
        d[i] = clampByte(tr);
        d[i + 1] = clampByte(tg);
        d[i + 2] = clampByte(tb);
    }
    ctx.putImageData(frame, 0, 0);
    eyeCache.set(img, c);
    return c;
}
