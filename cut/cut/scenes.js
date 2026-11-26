// Deterministic 10-scene director's shot sheet (432 frames @ 24 fps = 18.000 seconds).
// World 01 · Silver Gelatin & Cinnabar (Leica Darkroom x delineate Monochrome) + Original Copy Arc A:
//   "In 2026_ -> In 2027 -> Everyone can build a SaaS -> Millions of products are built every day. ->
//    BUT / Most of them blur into -> noise -> every remembered work -> starts with -> a ->
//    Living / Form -> and every living form -> moves when -> you do. -> d"
import { drawBezierLink, drawOrbitalScan, drawTrackBox, drawTrackPoint } from "./cv.js";
import { drawBrandMacroBackdrop, drawBuilderBackdrop, drawLaunchPostCard, drawMiniProductCard } from "./mockups.js";
import { PALETTE, getGradedEye, getGradedPlate } from "./palette.js";
import { DEFAULT_SHADER } from "./shader.js";
export const FPS = 24;
export const TOTAL_FRAMES = 432; // 18.000 seconds at true 24 fps
export const STAGE_W = 1280;
export const STAGE_H = 720;
const SANS = '"Switzer", -apple-system, BlinkMacSystemFont, sans-serif';
const SERIF = '"Zodiak", Georgia, "Times New Roman", serif';
const MONO = '"Geist Mono", ui-monospace, monospace';
// EXACT 134 BPM -> 24 FPS MASTER CUT & BEAT SHEET:
export const SCENES = [
    { id: "01", name: "Year Roll", start: 0, end: 21 },
    { id: "02", name: "2027 Warp + Mesh", start: 21, end: 43 },
    { id: "03", name: "SaaS Montage", start: 43, end: 86 },
    { id: "04", name: "Product Storm", start: 86, end: 129 },
    { id: "05", name: "BUT & Mineral Eye", start: 129, end: 172 },
    { id: "06", name: "Halftone Noise", start: 172, end: 193 },
    { id: "07", name: "Studio Match-Cut", start: 193, end: 226 },
    { id: "08", name: "Horizon & Wave", start: 226, end: 269 },
    { id: "09", name: "Turrell Light Blade", start: 269, end: 322 },
    { id: "10", name: "Fluted Crystal & Gate", start: 322, end: 432 },
];
export function sceneForFrame(frame) {
    for (const s of SCENES) {
        if (frame >= s.start && frame < s.end)
            return s;
    }
    return SCENES[SCENES.length - 1];
}
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - (1 - clamp(t, 0, 1)) ** 3;
const easeInOutCubic = (t) => {
    const u = clamp(t, 0, 1);
    return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
};
/** Resolves active beat-cut slice `{ index, localFrame, shotLen }` for montage sequences. */
function cutSlice(frame, cuts, endFrame) {
    let idx = 0;
    for (let i = 0; i < cuts.length; i++) {
        if (frame >= cuts[i])
            idx = i;
        else
            break;
    }
    const start = cuts[idx];
    const next = idx + 1 < cuts.length ? cuts[idx + 1] : endFrame;
    return {
        index: idx,
        localFrame: frame - start,
        shotLen: Math.max(1, next - start),
    };
}
/**
 * Cinema speed-ramp camera engine eliminating rigid static holds between cuts:
 *   - Frame 0..1: Fast exponential ease-out whip-in settle (+0.058 zoom overshoot, 1f shutter smear)
 *   - Mid frames: Continuous living dolly push (+0.032 progressive zoom + perspective glide)
 *   - Final frame: Subtle pre-cut anticipation pull nudging straight into the next hard cut
 */
function shotRamp(localFrame, shotLen, dir = 1, allowExitPull = true) {
    const safeLen = Math.max(2, shotLen);
    const u = clamp(localFrame / (safeLen - 1), 0, 1);
    const whipIn = Math.exp(-localFrame * 1.48);
    const dolly = u * 0.032;
    const exitPull = allowExitPull && safeLen >= 4 && localFrame === safeLen - 1 ? 0.018 : 0.0;
    return {
        zoomMul: 1.0 + whipIn * 0.058 + dolly + exitPull,
        yawAdd: dir * (whipIn * 0.038 + (u - 0.5) * 0.028 - exitPull * 0.72),
        pitchAdd: -dir * (whipIn * 0.018 - u * 0.015),
        rollAdd: dir * (whipIn * 0.012 - u * 0.007),
        blurMag: localFrame === 0 ? 0.012 : localFrame === 1 ? 0.004 : exitPull > 0 ? 0.0065 : 0.0,
        chromaAdd: localFrame === 0 ? 0.0045 : exitPull > 0 ? 0.0022 : 0.0,
    };
}
// Major 134 BPM downbeat kicks for elastic 2-frame optical camera recoil (excludes F408!):
const RECOIL_KICKS = [21, 43, 86, 107, 129, 193, 226, 258, 269, 301, 322, 376];
function applyBeatRecoil(frame, params) {
    for (let i = 0; i < RECOIL_KICKS.length; i++) {
        const dt = frame - RECOIL_KICKS[i];
        if (dt === 0) {
            params.zoom *= 1.032;
            params.barrel += 0.034;
            params.chroma += 0.004;
            return;
        }
        if (dt === 1) {
            params.zoom *= 1.011;
            params.barrel += 0.012;
            params.chroma += 0.0015;
            return;
        }
        if (dt === 2) {
            params.zoom *= 0.997;
            return;
        }
    }
}
let cachedFontsReady = false;
let gridBut = null;
let gridNoise = null;
let gridCharA = null;
let charAOrigins = null;
let sliceCanvas = null;
let sliceCtx = null;
const WAVE_COLS = 88;
const WAVE_ROWS = 56;
const WAVE_TOTAL = WAVE_COLS * WAVE_ROWS;
const waveSx = new Float32Array(WAVE_TOTAL);
const waveSy = new Float32Array(WAVE_TOTAL);
const waveDepth = new Float32Array(WAVE_TOTAL);
const waveCrest = new Float32Array(WAVE_TOTAL);
function bakeTypoGrid(w, h, font, text, yFrac = 0.54) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#FFFFFF";
    g.font = font;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, w * 0.5, h * yFrac);
    const img = g.getImageData(0, 0, w, h).data;
    const data = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
        data[i] = img[i * 4 + 3];
    }
    return { w, h, data };
}
function ensureGrids() {
    const ready = typeof document !== "undefined" && document.fonts
        ? document.fonts.check('700 48px "Switzer"') && document.fonts.check('400 48px "Zodiak"')
        : true;
    if (gridBut && gridNoise && gridCharA && charAOrigins && (cachedFontsReady || !ready))
        return;
    cachedFontsReady = ready;
    gridBut = bakeTypoGrid(156, 68, `700 60px ${SANS}`, "BUT", 0.54);
    gridNoise = bakeTypoGrid(158, 76, `400 52px ${SERIF}`, "noise", 0.53);
    gridCharA = bakeTypoGrid(24, 28, `500 26px ${SANS}`, "a", 0.50);
    const active = [];
    for (let r = 0; r < gridCharA.h; r++) {
        for (let c = 0; c < gridCharA.w; c++) {
            if (gridCharA.data[r * gridCharA.w + c] > 105) {
                active.push([(c / (gridCharA.w - 1)) * 2 - 1, (r / (gridCharA.h - 1)) * 2 - 1]);
            }
        }
    }
    if (active.length === 0)
        active.push([0, 0]);
    charAOrigins = new Float32Array(WAVE_TOTAL * 2);
    for (let i = 0; i < WAVE_TOTAL; i++) {
        const pt = active[(i * 37) % active.length];
        charAOrigins[i * 2] = pt[0] * 0.52;
        charAOrigins[i * 2 + 1] = -pt[1] * 0.62;
    }
}
function drawCoverSource(ctx, src, zoom = 1, offX = 0, offY = 0, rot = 0) {
    const iw = src instanceof HTMLCanvasElement ? src.width : src.naturalWidth || 1;
    const ih = src instanceof HTMLCanvasElement ? src.height : src.naturalHeight || 1;
    const scale = Math.max(STAGE_W / iw, STAGE_H / ih) * zoom;
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.save();
    ctx.translate(STAGE_W * 0.5 + offX, STAGE_H * 0.5 + offY);
    if (rot)
        ctx.rotate(rot);
    ctx.drawImage(src, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
}
function drawGrotesque(ctx, text, x, y, size, opts = {}) {
    ctx.save();
    const weight = opts.weight ?? 500;
    ctx.font = `${weight} ${size}px ${SANS}`;
    if ("letterSpacing" in ctx) {
        ctx.letterSpacing = "-0.028em";
    }
    ctx.textAlign = opts.align ?? "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = opts.color ?? PALETTE.inkLight;
    if (opts.shadow) {
        ctx.shadowColor = "rgba(8, 9, 11, 0.80)";
        ctx.shadowBlur = 18;
    }
    ctx.fillText(text, x, y);
    const w = ctx.measureText(text).width;
    ctx.restore();
    return w;
}
function drawSparseAsciiClusters(ctx, W, H, seedStep) {
    const rows = [
        { x: 760, y: 38, pat: "☒☒o☒☒x  o☒☒  o☒   ☒☒o☒x  o☒o", a: 0.72, warm: true },
        { x: 785, y: 54, pat: "  xxo☒x  ☒o   ☒o☒☒o☒☒x  ooo", a: 0.58 },
        { x: 750, y: 94, pat: "xx / xxx x /   xxxxxxxxx   xooooxxx", a: 0.36 },
        { x: 842, y: 154, pat: "☒o☒☒o☒x  ☒  x  /oo/o/", a: 0.62, warm: true },
        { x: 702, y: 244, pat: "☒x  o", a: 0.56 },
        { x: 716, y: 296, pat: "o☒☒o☒☒oxxx☒☒ox/x/", a: 0.44 },
        { x: 820, y: 346, pat: "xo / oxo     xxxx / xx", a: 0.38 },
        { x: 836, y: 394, pat: "x xxxx      xoooo", a: 0.34, warm: true },
        { x: 108, y: 428, pat: "o☒x  /  xxo☒", a: 0.30 },
        { x: 540, y: 518, pat: "xx / o☒o☒   ooxx", a: 0.28 },
        { x: 960, y: 586, pat: "☒☒o☒  /  xxxo", a: 0.38, warm: true },
        { x: 640, y: 648, pat: "ooxx / ☒o☒", a: 0.26 },
    ];
    const cs = 10.0;
    ctx.save();
    ctx.lineWidth = 0.85;
    for (let ri = 0; ri < rows.length; ri++) {
        const r = rows[ri];
        const vis = ((ri * 7 + seedStep * 3) % 11) > 1;
        if (!vis)
            continue;
        const ox = (r.x + ((seedStep * 19 * (ri % 3)) % 28)) % (W - 140);
        const oy = (r.y + (seedStep % 2) * 8) % (H - 30);
        const col = r.warm
            ? `rgba(214, 207, 175, ${r.a.toFixed(2)})`
            : `rgba(242, 239, 233, ${r.a.toFixed(2)})`;
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        for (let i = 0; i < r.pat.length; i++) {
            const ch = r.pat[i];
            if (ch === " ")
                continue;
            const cx = ox + i * cs;
            const cy = oy;
            if (ch === "☒") {
                ctx.strokeRect(cx - 3.4, cy - 3.4, 6.8, 6.8);
                ctx.beginPath();
                ctx.moveTo(cx - 3.1, cy - 3.1);
                ctx.lineTo(cx + 3.1, cy + 3.1);
                ctx.moveTo(cx + 3.1, cy - 3.1);
                ctx.lineTo(cx - 3.1, cy + 3.1);
                ctx.stroke();
            }
            else if (ch === "o") {
                ctx.beginPath();
                ctx.arc(cx, cy, 2.8, 0, Math.PI * 2);
                ctx.stroke();
            }
            else if (ch === "x") {
                ctx.beginPath();
                ctx.moveTo(cx - 2.7, cy - 2.7);
                ctx.lineTo(cx + 2.7, cy + 2.7);
                ctx.moveTo(cx + 2.7, cy - 2.7);
                ctx.lineTo(cx - 2.7, cy + 2.7);
                ctx.stroke();
            }
            else if (ch === "/") {
                ctx.beginPath();
                ctx.moveTo(cx - 2.7, cy + 2.9);
                ctx.lineTo(cx + 2.7, cy - 2.9);
                ctx.stroke();
            }
        }
    }
    ctx.restore();
}
/**
 * S09a Tadao Ando x James Turrell Monumental Concrete Sanctuary Light-Slit:
 * Uses the real ARRI/Leica board-formed concrete gallery plate (`s09Living.jpg`) graded through
 * World 01's Silver Gelatin LUT, animated with silky 24 fps architectural dolly push, subtle
 * breathing volumetric sunbeam shimmer, and fine floating dust motes suspended in the shaft.
 */
function drawTurrellVerticalSlit(ctx, W, H, plate, lf, u, pxShift, pyShift) {
    ctx.save();
    const graded = getGradedPlate(plate) ?? plate;
    const slitX = W * 0.695 + pxShift * 0.35;
    if (graded) {
        const camZoom = lerp(1.03, 1.13, easeInOutCubic(u));
        const camPanX = lerp(-12, 16, u) + pxShift * 0.45;
        const camPanY = lerp(6, -10, u) + pyShift * 0.32;
        drawCoverSource(ctx, graded, camZoom, camPanX, camPanY, 0);
        // Subtle dark left-third sanctuary falloff so "Living" sits in velvety architectural stillness
        const leftVeil = ctx.createLinearGradient(0, 0, W * 0.56, 0);
        leftVeil.addColorStop(0.0, "rgba(8, 9, 11, 0.46)");
        leftVeil.addColorStop(0.65, "rgba(8, 9, 11, 0.22)");
        leftVeil.addColorStop(1.0, "rgba(8, 9, 11, 0)");
        ctx.fillStyle = leftVeil;
        ctx.fillRect(0, 0, W * 0.58, H);
        // Subtle living sunbeam luminance breath along the real vertical aperture slit
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const pulse = 0.08 + 0.06 * Math.sin(u * Math.PI) + 0.02 * Math.sin(lf * 0.45);
        const beamGlow = ctx.createRadialGradient(slitX, H * 0.48, 8, slitX - 36, H * 0.50, 320);
        beamGlow.addColorStop(0.0, `rgba(244, 241, 234, ${(pulse * 1.4).toFixed(3)})`);
        beamGlow.addColorStop(0.35, `rgba(214, 207, 175, ${(pulse * 0.9).toFixed(3)})`);
        beamGlow.addColorStop(0.75, `rgba(217, 91, 56, ${(pulse * 0.32).toFixed(3)})`);
        beamGlow.addColorStop(1.0, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = beamGlow;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }
    else {
        ctx.fillStyle = PALETTE.obsidianVoid;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#F4F1EA";
        ctx.fillRect(slitX - 5, H * 0.08, 10, H * 0.68);
    }
    // 42 whisper-fine sunlit dust motes drifting lazily through the real volumetric shaft
    for (let i = 0; i < 42; i++) {
        const s1 = Math.sin(i * 41.3 + 2.7) * 43758.5453;
        const f1 = s1 - Math.floor(s1);
        const s2 = Math.sin(i * 73.9 + 8.1) * 43758.5453;
        const f2 = s2 - Math.floor(s2);
        const driftY = ((f2 - lf * (0.0042 + (i % 4) * 0.0014)) % 1 + 1) % 1;
        const my = lerp(H * 0.14, H * 0.84, driftY);
        const spreadX = (f1 - 0.65) * 260 + Math.sin(lf * 0.12 + i * 1.9) * 5.0;
        const mx = slitX + spreadX;
        const beamProx = Math.exp(-(((spreadX + 44) / 110) ** 2));
        const ma = clamp((0.06 + beamProx * 0.50) * (0.65 + 0.35 * Math.sin(lf * 0.22 + i)), 0.03, 0.62);
        const mr = 0.75 + (i % 3) * 0.42;
        ctx.fillStyle = i % 3 === 0
            ? `rgba(244, 241, 234, ${ma.toFixed(3)})`
            : `rgba(214, 207, 175, ${ma.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
/**
 * S09c Monumental Smoked Optical Crystal Prism Monolith (Bar 7.0 Hoover Climax):
 * Uses the real Hasselblad/ARRI diagonal optical prism plate (`s09Form.jpg`) graded through
 * World 01's Silver Gelatin LUT, driven by kinetic Bar-7.0 dolly push-in, live refractive
 * shimmer across the crystal entry facet, and backlit floating dust motes.
 */
function drawTurrellDiagonalBlade(ctx, W, H, plate, fLf, pxShift, pyShift) {
    const u = fLf / 18;
    const settle = easeOutCubic(Math.min(1, fLf / 5));
    ctx.save();
    const graded = getGradedPlate(plate) ?? plate;
    if (graded) {
        const camZoom = lerp(1.12, 1.04, settle) + u * 0.075;
        const camPanX = lerp(14, -10, u) + pxShift * 0.42;
        const camPanY = lerp(-8, 10, u) + pyShift * 0.32;
        drawCoverSource(ctx, graded, camZoom, camPanX, camPanY, 0);
        // Subtle living optical shimmer right where the champagne beam pierces the beveled crystal facet
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const fx = W * 0.415 + camPanX * 0.65;
        const fy = H * 0.50 + camPanY * 0.65;
        const pulse = 0.14 + 0.08 * Math.sin(fLf * 0.36) + (fLf === 0 ? 0.16 : 0);
        const facetGlow = ctx.createRadialGradient(fx, fy, 6, fx, fy, 240);
        facetGlow.addColorStop(0.0, `rgba(246, 245, 240, ${(pulse * 1.15).toFixed(3)})`);
        facetGlow.addColorStop(0.35, `rgba(214, 207, 175, ${(pulse * 0.72).toFixed(3)})`);
        facetGlow.addColorStop(0.75, `rgba(217, 91, 56, ${(pulse * 0.22).toFixed(3)})`);
        facetGlow.addColorStop(1.0, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = facetGlow;
        ctx.fillRect(0, 0, W, H);
        // Delicate cool platinum horizontal anamorphic glint anchored directly on the crystal prism refraction point
        const panGrad = ctx.createLinearGradient(fx - 380, fy, fx + 440, fy);
        panGrad.addColorStop(0.0, "rgba(200, 211, 230, 0)");
        panGrad.addColorStop(0.42, `rgba(200, 211, 230, ${(pulse * 0.95).toFixed(3)})`);
        panGrad.addColorStop(0.50, `rgba(246, 245, 240, ${(pulse * 1.45).toFixed(3)})`);
        panGrad.addColorStop(0.58, `rgba(200, 211, 230, ${(pulse * 0.85).toFixed(3)})`);
        panGrad.addColorStop(1.0, "rgba(200, 211, 230, 0)");
        ctx.fillStyle = panGrad;
        ctx.fillRect(fx - 380, fy - 1.5, 820, 3.0);
        ctx.restore();
    }
    else {
        ctx.fillStyle = PALETTE.obsidianVoid;
        ctx.fillRect(0, 0, W, H);
    }
    // 40 whisper-fine backlit dust motes drifting along the 38° diagonal beam corridor
    ctx.save();
    ctx.translate(W * 0.43 + pxShift * 0.35, H * 0.49 + pyShift * 0.25);
    ctx.rotate((-42 * Math.PI) / 180);
    for (let i = 0; i < 40; i++) {
        const h1 = Math.sin(i * 53.1 + 1.3) * 43758.5453;
        const f1 = h1 - Math.floor(h1);
        const h2 = Math.sin(i * 89.7 + 4.9) * 43758.5453;
        const f2 = h2 - Math.floor(h2);
        const bx = ((f1 + fLf * (0.006 + (i % 3) * 0.0022)) % 1 - 0.5) * 980;
        const by = (f2 - 0.5) * 145 + Math.sin(fLf * 0.16 + i * 2.3) * 4;
        const prox = Math.exp(-((by / 48) ** 2));
        const alpha = clamp(0.05 + prox * 0.48, 0.03, 0.58);
        const r = 0.75 + (i % 3) * 0.45;
        ctx.fillStyle = i % 4 === 0
            ? `rgba(200, 211, 230, ${alpha.toFixed(3)})`
            : `rgba(244, 241, 234, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    ctx.restore();
}
/**
 * LOCKED CHAMPIONSHIP FINALE EMBLEM (`R3-03 · Sheared Director's Gate (16:9 -> d)`
 * on World-01 `#F6F5F0` archival rag in `#161615` ink).
 */
function drawFinaleEmblem(ctx, cx, cy, size, dark, spread) {
    const s = size / 100;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.transform(1, 0, -0.085, 1, 0, 0);
    if (dark) {
        ctx.fillStyle = PALETTE.paperLight;
        ctx.fillRect(-20.0, 1.9, 34.0, 19.2);
        ctx.restore();
        return;
    }
    ctx.fillStyle = PALETTE.inkDark;
    ctx.save();
    ctx.translate(-spread * 0.85, -spread * 0.55);
    ctx.beginPath();
    ctx.moveTo(-39.0, -17.6);
    ctx.lineTo(8.4, -17.6);
    ctx.lineTo(8.4, 1.9);
    ctx.lineTo(-20.0, 1.9);
    ctx.lineTo(-20.0, 16.5);
    ctx.lineTo(-39.0, 24.96);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(spread * 0.85, spread * 0.55);
    ctx.beginPath();
    ctx.moveTo(14.0, -41.5);
    ctx.lineTo(33.5, -50.2);
    ctx.lineTo(33.5, 40.6);
    ctx.lineTo(-39.0, 40.6);
    ctx.lineTo(-39.0, 31.09);
    ctx.lineTo(-16.56, 21.1);
    ctx.lineTo(14.0, 21.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
}
/** Master deterministic frame renderer: paints Stage 1 bg + crisp fg overlays and returns WebGL2 ShaderParams. */
export function renderScene(ctx, fg, frameRaw, pointer, assets) {
    ensureGrids();
    const frame = ((Math.floor(frameRaw) % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES;
    const W = STAGE_W;
    const H = STAGE_H;
    const params = {
        ...DEFAULT_SHADER,
        tint: [1, 1, 1],
        perspPivot: [0.5, 0.5],
        motionBlur: [0, 0],
        anamorphicTint: PALETTE.gl.anamorphic,
    };
    let darkBg = true;
    const pxShift = (pointer.nx - 0.5) * 20;
    const pyShift = (pointer.ny - 0.5) * 13;
    // ── SCENE 01 (F 0..20, B0..B2): Archival Cotton Rag · "In 2026_" Drum Roll + F19..20 Cock -> 7 ─
    if (frame < 21) {
        darkBg = false;
        ctx.fillStyle = PALETTE.paperLight;
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.font = `500 108px ${SANS}`;
        if ("letterSpacing" in ctx) {
            ctx.letterSpacing = "-0.03em";
        }
        ctx.fillStyle = PALETTE.inkDark;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        const baseX = W * 0.255 + pxShift * 0.25;
        const cy = H * 0.50 + pyShift * 0.25;
        if (frame < 11) {
            const txt = frame < 3 ? "I" :
                frame < 5 ? "In" :
                    frame < 8 ? "In 2" :
                        frame < 10 ? "In 202" : "In 2025";
            ctx.fillText(txt, baseX, cy);
        }
        else {
            const preDrop = frame >= 19 ? ((frame - 18) / 2) * 0.42 : 0;
            const u = easeOutCubic((frame - 11) / 5);
            const baseText = "In 202";
            ctx.fillText(baseText, baseX, cy);
            const digitX = baseX + ctx.measureText(baseText).width + 2;
            const roll = 5 + u + preDrop;
            const stepH = 122;
            for (const d of [4, 5, 6, 7]) {
                const dy = (d - roll) * stepH;
                const dist = Math.abs(d - roll);
                if (dist > 1.35)
                    continue;
                ctx.save();
                const alpha = dist < 0.18 ? 1.0 : clamp(0.34 * (1 - (dist - 0.18) / 1.18), 0.04, 0.28);
                ctx.globalAlpha = alpha;
                if (dist > 0.22) {
                    ctx.translate(digitX, cy + dy);
                    ctx.scale(1.0, 0.88);
                    ctx.fillText(String(d), 0, 0);
                }
                else {
                    ctx.fillText(String(d), digitX, cy + dy);
                }
                ctx.restore();
            }
            if (frame >= 16 && frame < 19) {
                const dw = ctx.measureText("6").width;
                ctx.fillStyle = PALETTE.inkDark;
                ctx.fillRect(digitX + dw + 4, cy + 44, 54, 7.0);
            }
        }
        ctx.restore();
        params.mode = 0;
        params.zoom = frame < 19 ? lerp(0.985, 1.028, frame / 18) : lerp(1.036, 1.066, frame - 19);
        params.barrel = frame >= 19 ? -0.036 * (frame - 18) : 0.0;
        params.chroma = frame >= 19 ? 0.0045 : 0.0010;
        params.paperGrain = 0.86;
        params.vignette = 0.26;
        params.bloom = 0.0;
        params.halation = 0.0;
        if (frame >= 11 && frame <= 15) {
            params.motionBlur = [0, 0.016 * (1 - (frame - 11) / 5)];
        }
        else if (frame >= 19) {
            params.motionBlur = [0, 0.022];
        }
    }
    // ── SCENE 02 (F 21..42, B2..B4): "In 2027" + Gossamer Cinnabar CV -> 6px Shear -> X-Ray Mesh ───
    else if (frame < 43) {
        const lf = frame - 21;
        ctx.fillStyle = PALETTE.obsidianVoid;
        ctx.fillRect(0, 0, W, H);
        if (frame < 35) {
            // Subtle Leica darkroom champagne glow behind the saucer arc
            const arcGlow = ctx.createRadialGradient(W * 0.5, H * 0.52, 40, W * 0.5, H * 0.52, 460);
            arcGlow.addColorStop(0, "rgba(214, 207, 175, 0.055)");
            arcGlow.addColorStop(0.55, "rgba(74, 85, 104, 0.035)");
            arcGlow.addColorStop(1, "rgba(8, 9, 11, 0)");
            ctx.fillStyle = arcGlow;
            ctx.fillRect(0, 0, W, H);
            const isGlitch = frame >= 32;
            const targetCtx = isGlitch
                ? (() => {
                    if (!sliceCanvas) {
                        sliceCanvas = document.createElement("canvas");
                        sliceCanvas.width = W;
                        sliceCanvas.height = H;
                        sliceCtx = sliceCanvas.getContext("2d");
                    }
                    sliceCtx.clearRect(0, 0, W, H);
                    return sliceCtx;
                })()
                : ctx;
            const chars = ["I", "n", " ", "2", "0", "2", "7"];
            targetCtx.font = `500 184px ${SANS}`;
            targetCtx.textBaseline = "middle";
            const widths = chars.map((ch) => (ch === " " ? 62 : targetCtx.measureText(ch).width + 14));
            const totalW = widths.reduce((a, b) => a + b, 0);
            let curX = (W - totalW) / 2 + pxShift * 0.45;
            const cy = H * 0.53 + pyShift * 0.45;
            const anchors = [];
            for (let i = 0; i < chars.length; i++) {
                const ch = chars[i];
                const cw = widths[i];
                if (ch !== " ") {
                    const dropY = i === chars.length - 1
                        ? (1 - easeOutCubic(lf / 2.6)) * 70
                        : Math.exp(-lf * 1.2) * (i % 2 === 0 ? -11 : 11);
                    const nx = (curX + cw / 2 - W / 2) / (totalW / 2);
                    const arcBreath = 62 + lf * 0.62;
                    const arcY = -nx * nx * arcBreath;
                    const tilt = -nx * (0.34 + lf * 0.003);
                    const gx = curX + cw / 2;
                    const gy = cy + dropY + arcY;
                    targetCtx.save();
                    targetCtx.translate(gx, gy);
                    targetCtx.rotate(tilt);
                    targetCtx.fillStyle = PALETTE.inkLight;
                    targetCtx.textAlign = "center";
                    targetCtx.textBaseline = "middle";
                    if (i === chars.length - 1 && lf === 0) {
                        targetCtx.scale(1.0, 0.68);
                    }
                    targetCtx.fillText(ch, 0, 0);
                    targetCtx.restore();
                    const bh = 150;
                    anchors.push({ cx: gx, cy: gy, w: cw + 4, h: bh, tilt });
                    drawTrackBox(fg, gx - (cw + 4) / 2, gy - bh / 2, cw + 4, bh, {
                        color: "rgba(217, 65, 43, 0.56)",
                        labelColor: "rgba(242, 239, 233, 0.78)",
                        label: `x:${Math.round(gx * 1.5)} y:${Math.round(gy * 1.5)}`,
                        labelBelow: i === 1,
                        rot: tilt,
                        crosshair: false,
                    });
                }
                curX += cw;
            }
            // Precision 6px horizontal micro-slice shear (±3px) + champagne micro-fiducials (ZERO neon green!)
            if (isGlitch && sliceCanvas) {
                const bandH = 6;
                for (let py = 72; py < H - 72; py += bandH) {
                    const rowIdx = Math.floor(py / bandH) + lf * 2;
                    const shearX = rowIdx % 7 === 0 ? 3 : rowIdx % 11 === 0 ? -3 : 0;
                    ctx.drawImage(sliceCanvas, 0, py, W, bandH - 0.6, shearX, py, W, bandH - 0.6);
                }
                const fiducials = [
                    [anchors[3].cx - 6, anchors[3].cy + 44, "984"],
                    [anchors[4].cx + 14, anchors[4].cy + 28, "1149"],
                    [anchors[2].cx - 18, anchors[2].cy + 36, "752"],
                    [anchors[5].cx - 8, anchors[5].cy - 18, "1390"],
                ];
                for (const [gx, gy, num] of fiducials) {
                    const sx = Math.round(gx / 6) * 6;
                    const sy = Math.round(gy / 6) * 6;
                    ctx.fillStyle = PALETTE.primaryAccent;
                    ctx.fillRect(sx - 2, sy - 2, 4.5, 4.5);
                    ctx.strokeStyle = "rgba(214, 207, 175, 0.45)";
                    ctx.lineWidth = 0.7;
                    ctx.strokeRect(sx - 5, sy - 5, 10.5, 10.5);
                    fg.font = `500 8.5px ${MONO}`;
                    fg.fillStyle = "rgba(242, 239, 233, 0.78)";
                    fg.fillText(num, sx - 6, sy - 8);
                }
            }
            if (anchors.length >= 6) {
                drawBezierLink(fg, anchors[0].cx, anchors[0].cy - 76, anchors[5].cx, anchors[5].cy - 76, -94, "rgba(242, 239, 233, 0.28)");
                drawBezierLink(fg, anchors[0].cx, anchors[0].cy + 76, anchors[5].cx, anchors[5].cy + 76, 150, "rgba(214, 207, 175, 0.24)");
                drawBezierLink(fg, anchors[1].cx, anchors[1].cy + 74, anchors[4].cx, anchors[4].cy + 74, 104, "rgba(242, 239, 233, 0.22)");
            }
            const kin = shotRamp(lf, 11, 1, false);
            params.mode = 0;
            params.zoom = isGlitch ? 1.05 + (frame - 32) * 0.014 : kin.zoomMul;
            params.roll = isGlitch ? -0.006 : kin.rollAdd * 0.5;
            params.barrel = 0.14 + (lf === 0 ? 0.06 : lf * 0.0025);
            params.chroma = lf === 0 ? 0.009 : isGlitch ? 0.0055 : 0.0038;
            params.flash = lf === 0 ? 0.16 : 0;
            params.vignette = 0.26;
            params.bloom = isGlitch ? 0.22 : 0.28;
            params.halation = 0.10;
            if (lf === 0)
                params.motionBlur = [0, -0.020];
            else if (frame === 32)
                params.motionBlur = [0.009, 0];
        }
        else if (frame < 38) {
            // F 35..37: Macro Cinema Aperture Plate (`s07Amber`) through 5.8px Optical Blueprint X-Ray Mesh!
            const mLf = frame - 35;
            const amberPlate = getGradedPlate(assets.plates.s07Amber);
            if (amberPlate) {
                drawCoverSource(ctx, amberPlate, lerp(1.14, 1.03, mLf / 2), pxShift * 0.45, pyShift * 0.45, -0.03 + mLf * 0.015);
            }
            else {
                // Clean geometric Leica 9-blade iris fallback while plate decodes
                ctx.save();
                ctx.translate(W * 0.5, H * 0.5);
                for (let b = 0; b < 9; b++) {
                    ctx.save();
                    ctx.rotate((b * Math.PI * 2) / 9 + mLf * 0.06);
                    ctx.fillStyle = b % 2 === 0 ? "#8E8A7E" : "#5C6470";
                    ctx.fillRect(68, -28, 260, 96);
                    ctx.restore();
                }
                ctx.restore();
            }
            drawOrbitalScan(fg, W * 0.50, H * 0.50, 224, 224, mLf * 0.08, "rgba(214, 207, 175, 0.24)");
            drawTrackPoint(fg, W * 0.50 - 158, H * 0.50 - 94, PALETTE.cvRegistrationTick, PALETTE.inkLight, "f/1.4 · 50mm");
            params.mode = 1;
            params.asciiBg = 0.35;
            params.cellSize = 5.8;
            params.tint = PALETTE.gl.champagne;
            params.zoom = lerp(1.06, 1.01, mLf / 2);
            params.barrel = 0.06;
            params.chroma = 0.004;
            params.vignette = 0.38;
            params.bloom = 0.20;
            params.halation = 0.06;
            if (frame === 35)
                params.motionBlur = [0.014, 0];
        }
        else {
            const sLf = frame - 38;
            drawSparseAsciiClusters(ctx, W, H, sLf);
            params.mode = 0;
            params.zoom = lerp(1.00, 1.05, sLf / 4);
            params.barrel = 0.04;
            params.chroma = 0.003;
            params.vignette = 0.18;
            params.bloom = 0.20;
            params.halation = 0.0;
        }
    }
    // ── SCENE 03 (F 43..85, B4..B8): "Everyone can build a SaaS" + Creamy Leica f/1.4 DOF ─────────
    else if (frame < 86) {
        const lf = frame - 43;
        const full = "Everyone can build a SaaS";
        const uiCuts = [43, 48, 54, 59, 64, 70, 75, 81];
        if (frame < 84) {
            const slice = cutSlice(frame, uiCuts, 84);
            const variant = slice.index;
            const dir = variant % 2 === 0 ? 1 : -1;
            const kin = shotRamp(slice.localFrame, slice.shotLen, dir);
            const chars = Math.min(full.length, Math.floor(6 + lf * 0.88));
            const typed = full.slice(0, chars);
            const showCursor = chars < full.length && Math.floor(lf / 3) % 2 === 0;
            const spec = drawBuilderBackdrop(ctx, W, H, variant, typed, showCursor, assets);
            darkBg = !spec.lightCard;
            params.mode = 0;
            params.perspX = spec.perspX + kin.yawAdd;
            params.perspY = spec.perspY + kin.pitchAdd;
            params.roll = spec.roll + kin.rollAdd;
            params.perspPivot = [spec.anchorUvX, spec.anchorUvY];
            params.zoom = spec.zoom * kin.zoomMul;
            params.barrel = 0.065;
            params.chroma = 0.0024 + kin.chromaAdd * 0.7;
            params.dof = 0.62; // Creamy Leica Summilux f/1.4 focal rolloff
            params.focusY = spec.anchorUvY;
            params.paperGrain = 0.24;
            params.vignette = 0.34;
            params.bloom = darkBg ? 0.24 : 0.06;
            params.halation = darkBg ? 0.08 : 0.0;
            if (kin.blurMag > 0) {
                params.motionBlur = [dir * kin.blurMag * 0.72, -kin.blurMag * 0.32];
            }
        }
        else {
            ctx.fillStyle = PALETTE.obsidianVoid;
            ctx.fillRect(0, 0, W, H);
            drawSparseAsciiClusters(ctx, W, H, lf);
            params.mode = 0;
            params.zoom = frame === 85 ? 1.04 : 1.01;
            params.barrel = 0.04;
            params.bloom = 0.18;
        }
    }
    // ── SCENE 04 (F 86..128, B8..B12): "Millions..." + 6px Drafting Peel + 9 Editorial Windows ────
    else if (frame < 129) {
        darkBg = false;
        const sentence = "Millions of products are built every day.";
        ctx.fillStyle = PALETTE.paperLight;
        ctx.fillRect(0, 0, W, H);
        if (frame < 102) {
            const lf = frame - 86;
            const typedLen = lf < 2 ? 0 : Math.min(sentence.length, Math.floor((lf - 1) * 4.2));
            const isDraftingGrid = frame <= 87 || frame === 94 || frame === 95;
            if (typedLen > 0) {
                ctx.save();
                ctx.font = `500 35px ${SANS}`;
                if ("letterSpacing" in ctx) {
                    ctx.letterSpacing = "-0.028em";
                }
                const fullW = ctx.measureText(sentence).width;
                const startX = W * 0.5 - fullW * 0.5 + pxShift * 0.25;
                ctx.fillStyle = PALETTE.inkDark;
                ctx.textAlign = "left";
                ctx.textBaseline = "middle";
                ctx.fillText(sentence.slice(0, typedLen), startX, H * 0.52 + pyShift * 0.25);
                ctx.restore();
            }
            params.zoom = lerp(0.99, 1.03, lf / 15);
            if (isDraftingGrid) {
                params.mode = 2;
                params.asciiBg = 0;
                params.cellSize = 6.0;
                params.barrel = 0.0;
                params.vignette = 0.12;
                params.bloom = 0.0;
            }
            else {
                params.mode = 0;
                params.barrel = 0.0;
                params.paperGrain = 0.78;
                params.vignette = 0.20;
                params.bloom = 0.0;
            }
        }
        else if (frame < 107) {
            // F 102..106: Crisp foreground sentence while 6.0px millimeter rag sheet peels over delineate.design!
            const peelU = (frame - 102) / 4;
            if (peelU > 0.04) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, W * 0.64, H * 0.46);
                ctx.clip();
                ctx.fillStyle = PALETTE.obsidianVoid;
                ctx.fillRect(0, 0, W * 0.64, H * 0.46);
                ctx.translate(210, 140);
                ctx.transform(1, -0.05, -0.14, 0.94, 0, 0);
                drawMiniProductCard(ctx, 355, 215, 4, assets);
                ctx.restore();
            }
            drawGrotesque(fg, sentence, W * 0.5 + pxShift * 0.2, H * 0.53 + pyShift * 0.2, 35, {
                color: PALETTE.inkDark,
                weight: 500,
            });
            params.mode = 2;
            params.asciiBg = 2.0 + peelU * 0.88;
            params.cellSize = 6.0;
            params.zoom = lerp(1.01, 1.045, peelU);
            params.barrel = 0.0;
            params.chroma = 0.0025 + peelU * 0.002;
            params.vignette = 0.18;
            params.bloom = 0.0;
            params.motionBlur = [-0.006 * peelU, -0.0045 * peelU];
        }
        else {
            // F 107..128: 9 impeccably spaced editorial windows orbiting smoothly with breathable center framing!
            drawGrotesque(ctx, sentence, W * 0.5 + pxShift * 0.2, H * 0.525 + pyShift * 0.2, 35, {
                color: PALETTE.inkDark,
                weight: 500,
            });
            const stormU = (frame - 107) / 21;
            const cards = [
                { cx: 195, cy: 175, w: 365, h: 218, skewX: -0.12, skewY: -0.03, v: 4, appear: 0.00, zParallax: 0.68 },
                { cx: 645, cy: 155, w: 380, h: 224, skewX: -0.08, skewY: -0.02, v: 1, appear: 0.07, zParallax: 0.76, tag: "bone" },
                { cx: 1065, cy: 190, w: 375, h: 220, skewX: -0.09, skewY: 0.02, v: 7, appear: 0.14, zParallax: 0.84 },
                { cx: 1085, cy: 485, w: 390, h: 230, skewX: -0.06, skewY: 0.03, v: 2, appear: 0.22, zParallax: 0.92, tag: "bone" },
                { cx: 210, cy: 545, w: 380, h: 224, skewX: -0.11, skewY: -0.03, v: 3, appear: 0.30, zParallax: 0.98 },
                { cx: 660, cy: 595, w: 395, h: 230, skewX: -0.07, skewY: 0.02, v: 6, appear: 0.38, zParallax: 1.06 },
                { cx: 355, cy: 335, w: 405, h: 242, skewX: -0.09, skewY: -0.02, v: 0, appear: 0.48, zParallax: 1.14, tag: "cinnabar" },
                { cx: 915, cy: 355, w: 395, h: 236, skewX: -0.07, skewY: 0.02, v: 5, appear: 0.58, zParallax: 1.22, tag: "bone" },
                { cx: 595, cy: 425, w: 410, h: 244, skewX: -0.06, skewY: 0.01, v: 2, appear: 0.70, zParallax: 1.28 },
            ];
            const activeCenters = [];
            for (const c of cards) {
                if (stormU < c.appear)
                    continue;
                const age = stormU - c.appear;
                const p = easeOutCubic(age / 0.18);
                const sc = lerp(1.20, 1.0, p) + age * 0.048 * c.zParallax;
                const x = c.cx + (pxShift * 0.5 + (stormU - 0.5) * -24) * c.zParallax;
                const y = c.cy + (1 - p) * 52 + (pyShift * 0.5 + (stormU - 0.5) * -12) * c.zParallax;
                ctx.save();
                ctx.translate(x, y);
                ctx.transform(sc, c.skewY * sc, c.skewX * sc, sc * 0.94, 0, 0);
                drawMiniProductCard(ctx, c.w, c.h, c.v, assets);
                ctx.restore();
                activeCenters.push([x, y]);
                if (c.tag === "cinnabar") {
                    drawTrackPoint(fg, x - 90, y + c.h * 0.42, PALETTE.cvRegistrationTick, PALETTE.inkLight, `x:${Math.round(x * 1.1)} y:${Math.round((y + 104) * 1.5)}`);
                    drawTrackPoint(fg, x + 90, y + c.h * 0.42, PALETTE.cvRegistrationTick, PALETTE.inkLight, `x:${Math.round((x + 180) * 1.3)} y:${Math.round((y + 104) * 1.5)}`);
                }
                else if (c.tag === "bone") {
                    drawTrackPoint(fg, x - 28, y - c.h * 0.43, PALETTE.inkLight, PALETTE.inkLight, `x:${Math.round(x * 1.4)} y:${Math.round(Math.max(40, y - 88))}`);
                }
            }
            if (activeCenters.length >= 3) {
                drawOrbitalScan(fg, W * 0.50, H * 0.50, 390, 240, -0.07 + stormU * 0.05, "rgba(110, 109, 104, 0.28)");
                drawBezierLink(fg, activeCenters[0][0], activeCenters[0][1], activeCenters[1][0], activeCenters[1][1], -58, "rgba(110, 109, 104, 0.34)");
            }
            if (activeCenters.length >= 6) {
                drawBezierLink(fg, activeCenters[3][0], activeCenters[3][1], activeCenters[5][0], activeCenters[5][1], 72, "rgba(217, 65, 43, 0.32)");
            }
            const climaxU = frame >= 124 ? (frame - 124) / 4 : 0;
            params.mode = 0;
            params.perspX = lerp(-0.045, 0.065, stormU);
            params.roll = lerp(-0.012, 0.012, stormU);
            params.zoom = lerp(1.00, 1.045, stormU) * lerp(1.0, 1.12, climaxU);
            params.barrel = lerp(0.03, 0.16, climaxU);
            params.chroma = lerp(0.0022, 0.0075, climaxU);
            params.paperGrain = 0.36;
            params.vignette = 0.22;
            params.bloom = 0.10;
            params.trail = 0.12;
            params.motionBlur = frame >= 126 ? [0.0075, -0.0045] : [0.0045, 0.0030];
        }
    }
    // ── SCENE 05 (F 129..171, B12..B16): Optical Slit BUT -> 156x68 BUT -> 3-Value Mineral Grid Eye ─
    else if (frame < 172) {
        const lf = frame - 129;
        ctx.fillStyle = PALETTE.obsidianVoid;
        ctx.fillRect(0, 0, W, H);
        if (frame < 133) {
            // F 129..132: Razor-fine 7px Venetian vertical optical slit-scan (2.5px slits, ZERO neon scribbles!)
            ctx.save();
            ctx.translate(W * 0.49, H * 0.50);
            ctx.rotate(-0.18 + lf * 0.028);
            ctx.font = `700 660px ${SANS}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = PALETTE.inkLight;
            ctx.fillText("BUT", 0, 0);
            // Carve crisp 2.5px obsidian slits at exact 7px optical reed pitch
            ctx.fillStyle = PALETTE.obsidianVoid;
            const slitPhase = (lf * 2.2) % 7;
            for (let s = -1080; s < 1080; s += 7) {
                ctx.fillRect(s + slitPhase, -540, 2.5, 1080);
            }
            ctx.restore();
            params.mode = 0;
            params.zoom = lerp(1.10, 1.00, easeOutCubic(lf / 3));
            params.barrel = 0.42 - lf * 0.05;
            params.chroma = 0.007;
            params.flash = lf === 0 ? 0.24 : 0;
            params.bloom = 0.28;
            params.halation = 0.12;
            if (lf <= 1)
                params.motionBlur = [-0.016, 0.008];
        }
        else if (frame < 140) {
            // F 133..139: High-res 156x68 circular optical micro-dot matrix (pitch = 7.2, #F2EFE9 bone dots)
            const mLf = frame - 133;
            const g = gridBut;
            const pitch = 7.2;
            const startX = (W - g.w * pitch) / 2 + pxShift * 0.25;
            const startY = (H - g.h * pitch) / 2 + pyShift * 0.25;
            for (let r = 0; r < g.h; r++) {
                for (let c = 0; c < g.w; c++) {
                    const a = g.data[r * g.w + c];
                    if (a < 72)
                        continue;
                    const x = startX + c * pitch + pitch * 0.5;
                    const y = startY + r * pitch + pitch * 0.5;
                    const rad = lerp(1.15, 2.85, (a - 72) / 183);
                    ctx.fillStyle = a > 180 ? PALETTE.inkLight : "rgba(214, 207, 175, 0.82)";
                    ctx.beginPath();
                    ctx.arc(x, y, rad, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            const kin = shotRamp(mLf, 7, -1);
            params.mode = 0;
            params.zoom = kin.zoomMul;
            params.barrel = 0.03 + mLf * 0.003;
            params.chroma = 0.0032 + kin.chromaAdd * 0.4;
            params.vignette = 0.22;
            params.bloom = 0.24;
            params.halation = 0.08;
        }
        else if (frame < 170) {
            // F 140..169: Strict 3-Value Mineral Grid Eye + "Most of them blur into"
            const eu = (frame - 140) / 29;
            const eyeZoom = lerp(1.16, 1.28, eu);
            const eyeCx = W * 0.50 + pxShift * 0.55;
            const eyeCy = H * 0.50 + pyShift * 0.55;
            // Anatomically lock eye.jpg's pupil (u=0.525, v=0.625 in 3:2 photo) directly onto (eyeCx, eyeCy)
            const eyeOffX = (eyeCx - W * 0.5) - 0.025 * W * eyeZoom;
            const eyeOffY = (eyeCy - H * 0.5) - 0.125 * (W / 1.5) * eyeZoom;
            const gradedEye = getGradedEye(assets.eye);
            if (gradedEye) {
                drawCoverSource(ctx, gradedEye, eyeZoom, eyeOffX, eyeOffY);
            }
            // 1. Edge-only outer chiaroscuro vignette (r > 230px) — leaves striated iris (r = 62..208px) 100% luminous!
            const outerVig = ctx.createRadialGradient(eyeCx, eyeCy, 230, eyeCx, eyeCy, 520);
            outerVig.addColorStop(0.00, "rgba(8, 9, 11, 0)");
            outerVig.addColorStop(0.55, "rgba(8, 9, 11, 0.68)");
            outerVig.addColorStop(1.00, "rgba(8, 9, 11, 0.96)");
            ctx.fillStyle = outerVig;
            ctx.fillRect(0, 0, W, H);
            // 2. Distinct deep-velvet #08090B anatomical pupil core ONLY (r = 56px)
            const pupilCore = ctx.createRadialGradient(eyeCx, eyeCy, 14, eyeCx, eyeCy, 58);
            pupilCore.addColorStop(0.00, "rgba(8, 9, 11, 0.98)");
            pupilCore.addColorStop(0.76, "rgba(8, 9, 11, 0.92)");
            pupilCore.addColorStop(1.00, "rgba(8, 9, 11, 0)");
            ctx.fillStyle = pupilCore;
            ctx.beginPath();
            ctx.arc(eyeCx, eyeCy, 60, 0, Math.PI * 2);
            ctx.fill();
            // 3. Crisp soft 10:30 corneal specular catchlight across all 3 acts
            ctx.save();
            ctx.translate(eyeCx - 44, eyeCy - 36);
            ctx.rotate(-0.56);
            const specGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
            specGlow.addColorStop(0, "rgba(246, 245, 240, 0.95)");
            specGlow.addColorStop(0.45, "rgba(214, 207, 175, 0.42)");
            specGlow.addColorStop(1, "rgba(214, 207, 175, 0)");
            ctx.fillStyle = specGlow;
            ctx.beginPath();
            ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(246, 245, 240, 0.96)";
            ctx.beginPath();
            ctx.ellipse(0, 0, 8.5, 4.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            if (frame < 150) {
                // Act 1 (F 140..149): Stepped Mineral Quadtree (`cellSize 6.2`) + gossamer circular iris reticle
                const aLf = frame - 140;
                drawOrbitalScan(fg, eyeCx, eyeCy, 208, 208, aLf * 0.015, "rgba(242, 239, 233, 0.20)");
                drawTrackPoint(fg, eyeCx + 196, eyeCy - 68, PALETTE.cvRegistrationTick, PALETTE.inkLight, "iris · 0.62");
                const kin = shotRamp(aLf, 10, 1);
                params.mode = 3;
                params.asciiBg = 0.35;
                params.cellSize = 6.2;
                params.zoom = kin.zoomMul;
                params.roll = kin.rollAdd * 0.7;
                params.barrel = 0.06;
                params.chroma = 0.004 + kin.chromaAdd * 0.4;
                params.vignette = 0.40;
                params.bloom = 0.24;
                params.halation = 0.08;
            }
            else if (frame < 161) {
                // Act 2 (F 150..160): 3 Beveled Achromatic/Champagne Crown-Glass Prisms (`mode 0, glass 1.0`)
                const gLf = frame - 150;
                const kin = shotRamp(gLf, 11, -1);
                params.mode = 0;
                params.glass = 1.0;
                params.zoom = kin.zoomMul;
                params.roll = Math.sin(eu * Math.PI) * 0.016;
                params.barrel = 0.08;
                params.chroma = 0.0045 + kin.chromaAdd * 0.35;
                params.dof = 0.24;
                params.focusY = 0.50;
                params.vignette = 0.40;
                params.bloom = 0.26;
                params.halation = 0.10;
            }
            else {
                // Act 3 (F 161..169): Fine Silver-Champagne Mezzotint Halftone (`mode 3, asciiBg 2.0, cellSize 5.8`)
                const hLf = frame - 161;
                params.mode = 3;
                params.asciiBg = 2.0;
                params.cellSize = 5.8;
                params.zoom = lerp(1.01, 1.06, hLf / 8);
                params.barrel = 0.08;
                params.chroma = 0.004;
                params.vignette = 0.44;
                params.bloom = 0.20;
                params.halation = 0.06;
            }
            if (frame >= 145) {
                const phrase = "Most of them blur into";
                const chars = Math.min(phrase.length, Math.floor((frame - 144) * 2.1));
                drawGrotesque(fg, phrase.slice(0, chars), W * 0.5, H * 0.50, 38, {
                    color: PALETTE.inkLight,
                    weight: 500,
                    shadow: true,
                });
            }
        }
        else {
            // F 170..171: Hushed 2-frame obsidian breath before Zodiak "noise"
            params.mode = 0;
            params.barrel = 0.0;
            params.bloom = 0.0;
            params.vignette = 0.14;
        }
    }
    // ── SCENE 06 (F 172..192, B16..B18): 158x76 Zodiak Serif Variable-Radius Halftone "noise" ─────
    else if (frame < 193) {
        const lf = frame - 172;
        const isSlingshot = frame >= 191;
        ctx.fillStyle = PALETTE.obsidianVoid;
        ctx.fillRect(0, 0, W, H);
        const ringCol = isSlingshot ? "rgba(217, 65, 43, 0.46)" : "rgba(242, 239, 233, 0.16)";
        const ringCol2 = isSlingshot ? "rgba(214, 207, 175, 0.36)" : "rgba(214, 207, 175, 0.14)";
        drawOrbitalScan(ctx, W * 0.52, H * 0.51, 240, 240, 0.0, ringCol);
        drawOrbitalScan(ctx, W * 0.52, H * 0.51, 336, 206, -0.20 + lf * 0.016, ringCol2);
        drawOrbitalScan(ctx, W * 0.48, H * 0.50, 172, 260, 0.28 - lf * 0.014, ringCol2);
        const g = gridNoise;
        const prevCol = frame <= 173 ? 0 :
            frame <= 176 ? Math.floor(g.w * 0.26) :
                frame <= 179 ? Math.floor(g.w * 0.48) :
                    frame <= 182 ? Math.floor(g.w * 0.62) :
                        frame <= 185 ? Math.floor(g.w * 0.80) : g.w;
        const maxCol = frame < 174 ? Math.floor(g.w * 0.26) :
            frame < 177 ? Math.floor(g.w * 0.48) :
                frame < 180 ? Math.floor(g.w * 0.62) :
                    frame < 183 ? Math.floor(g.w * 0.80) : g.w;
        const pitch = 6.8;
        const startX = (W - g.w * pitch) / 2 + pxShift * 0.32;
        const startY = (H - g.h * pitch) / 2 + pyShift * 0.32;
        for (let r = 0; r < g.h; r++) {
            for (let c = 0; c < maxCol; c++) {
                const a = g.data[r * g.w + c];
                if (a < 64)
                    continue;
                const x = startX + c * pitch + pitch * 0.5;
                const y = startY + r * pitch + pitch * 0.5;
                const newlyIgnited = c >= prevCol;
                const normA = (a - 64) / 191;
                const baseRad = lerp(1.0, 2.35, Math.pow(normA, 0.88));
                const rad = baseRad * (newlyIgnited ? 1.18 : 1.0);
                if (newlyIgnited) {
                    ctx.fillStyle = "rgba(214, 207, 175, 0.28)";
                    ctx.beginPath();
                    ctx.arc(x, y, rad * 1.9, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = PALETTE.primaryAccent;
                }
                else {
                    ctx.fillStyle = PALETTE.inkLight;
                }
                ctx.beginPath();
                ctx.arc(x, y, rad, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        const nBoxes = [
            [W * 0.17, H * 0.34, 156, 224, "x:326 y:368"],
            [W * 0.36, H * 0.34, 152, 224, "x:691 y:368"],
        ];
        if (maxCol > g.w * 0.65)
            nBoxes.push([W * 0.54, H * 0.27, 138, 274, "x:1038 y:292"]);
        if (maxCol >= g.w)
            nBoxes.push([W * 0.70, H * 0.34, 154, 224, "x:1344 y:368"]);
        for (const [bx, by, bw, bh, lbl] of nBoxes) {
            drawTrackBox(fg, bx, by, bw, bh, {
                color: isSlingshot ? "rgba(217, 65, 43, 0.56)" : "rgba(242, 239, 233, 0.22)",
                labelColor: "rgba(242, 239, 233, 0.72)",
                label: lbl,
                cornerBrackets: true,
                crosshair: false,
            });
        }
        const ignPulse = frame === 172 || frame === 174 || frame === 177 || frame === 180 || frame === 183 ? 0.026 :
            frame === 173 || frame === 175 || frame === 178 || frame === 181 || frame === 184 ? 0.010 : 0.0;
        params.mode = 0;
        params.zoom = frame === 192 ? 0.93 : lerp(0.99, 1.04, lf / 19) + ignPulse;
        params.barrel = frame === 192 ? 0.18 : 0.10;
        params.chroma = frame === 172 || frame === 183 || frame === 192 ? 0.0075 : 0.0028;
        params.paperGrain = 0.18;
        params.vignette = 0.36;
        params.bloom = isSlingshot ? 0.48 : 0.34;
        params.halation = isSlingshot ? 0.20 : 0.10;
        if (frame === 192)
            params.motionBlur = [0.012, 0];
    }
    // ── SCENE 07 (F 193..225, B18..B21): "every remembered work" Across 6 Studio Profiles ─────────
    else if (frame < 226) {
        const brandCuts = [193, 199, 204, 210, 215, 220];
        const slice = cutSlice(frame, brandCuts, 226);
        const variant = slice.index;
        const dir = variant % 2 === 0 ? 1 : -1;
        const kin = shotRamp(slice.localFrame, slice.shotLen, dir);
        const spec = drawBrandMacroBackdrop(ctx, W, H, variant, assets);
        drawGrotesque(fg, "every remembered work", W * 0.56, H * 0.50, 31, {
            align: "left",
            weight: 500,
            color: PALETTE.inkLight,
            shadow: true,
        });
        params.mode = 0;
        params.perspX = spec.perspX * 0.72 + kin.yawAdd;
        params.perspY = spec.perspY * 0.72 + kin.pitchAdd;
        params.roll = spec.roll + kin.rollAdd;
        params.perspPivot = [0.56, 0.50];
        params.zoom = 1.13 * kin.zoomMul;
        params.barrel = 0.11;
        params.chroma = 0.0026 + kin.chromaAdd * 0.65;
        params.dof = 0.42;
        params.focusY = 0.50;
        params.paperGrain = 0.24;
        params.vignette = 0.44;
        params.bloom = 0.28;
        params.halation = 0.10;
        if (kin.blurMag > 0) {
            params.motionBlur = [dir * kin.blurMag * 0.75, kin.blurMag * 0.28];
        }
    }
    // ── SCENE 08 (F 226..268, B21..B25): Serene Horizon "starts with" -> 'a' -> 3D Plexus Wave ────
    else if (frame < 269) {
        const lf = frame - 226;
        if (frame < 247) {
            // S08a (F 226..246, 10s): ZERO CLUTTER! 65% untouched #08090B upper void + single silk-stipple ridge
            ctx.fillStyle = PALETTE.obsidianVoid;
            ctx.fillRect(0, 0, W, H);
            const t = lf * 0.085;
            const cols = 122;
            const rows = 36;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `500 7.5px ${MONO}`;
            for (let row = 0; row < rows; row++) {
                const v = row / (rows - 1); // 0 = far horizon (y ~ 0.66*H), 1 = foreground lower edge
                const zDepth = lerp(3.25, 1.32, v);
                const persp = 1.58 / zDepth;
                const depthFade = Math.sin(v * Math.PI);
                for (let col = 0; col < cols; col++) {
                    const u = (col / (cols - 1)) * 2.7 - 1.35;
                    const crestA = Math.exp(-((u - 0.22 + Math.sin(v * 2.0 - t) * 0.14) ** 2) * 2.6) * depthFade * 0.98;
                    const crestB = Math.exp(-((u + 0.48 - Math.cos(v * 1.7 + t * 0.7) * 0.12) ** 2) * 2.9) * depthFade * 0.56;
                    const ripple = Math.sin(u * 2.9 - v * 2.6 + t * 0.85) * 0.11 * depthFade;
                    const elev = crestA + crestB + ripple;
                    const edgeMask = 1 - clamp((Math.abs(u) - 0.96) / 0.39, 0, 1);
                    const alpha = clamp((0.16 + elev * 0.28) * edgeMask * (0.42 + 0.58 * v), 0, 0.42);
                    if (alpha < 0.055)
                        continue;
                    const sx = W * 0.5 + u * persp * W * 0.50 + pxShift * 0.38 * v;
                    const sy = H * 0.67 + v * H * 0.32 - elev * 116 * persp + pyShift * 0.25 * v;
                    if (sx < 8 || sx > W - 8 || sy < H * 0.60 || sy > H - 4)
                        continue;
                    const glyph = elev > 0.66 ? "+" : elev > 0.32 ? ":" : "·";
                    const warmMix = clamp((elev - 0.24) / 0.56, 0, 1);
                    const rC = Math.round(lerp(110, 214, warmMix));
                    const gC = Math.round(lerp(109, 207, warmMix));
                    const bC = Math.round(lerp(104, 175, warmMix));
                    ctx.fillStyle = `rgba(${rC}, ${gC}, ${bC}, ${alpha.toFixed(3)})`;
                    ctx.fillText(glyph, sx, sy);
                }
            }
            // Unwarped, surgical Switzer "starts with" floating calmly in 65% untouched upper obsidian sky
            const tIn = easeOutCubic(Math.min(1, (lf + 1) / 4));
            fg.save();
            fg.globalAlpha = tIn;
            drawGrotesque(fg, "starts with", W * 0.5 + pxShift * 0.20, H * 0.39 + pyShift * 0.16, 52, { color: PALETTE.inkLight, weight: 500 });
            fg.restore();
            params.mode = 0;
            params.zoom = lerp(1.00, 1.045, easeInOutCubic(lf / 20));
            params.roll = 0.0;
            params.barrel = 0.03;
            params.chroma = 0.0022;
            params.vignette = 0.28;
            params.bloom = 0.16;
            params.halation = 0.04;
        }
        else if (frame < 258) {
            // S08b (F 247..257): Matte #16171A charcoal + #F2EFE9 stepped 'a'
            ctx.fillStyle = PALETTE.surfaceCharcoal;
            ctx.fillRect(0, 0, W, H);
            const g = gridCharA;
            const stepCuts = [247, 251, 255];
            const stepSlice = cutSlice(frame, stepCuts, 258);
            const baseStep = stepSlice.index === 0 ? 7.0 : stepSlice.index === 1 ? 9.2 : 11.2;
            const overshoot = stepSlice.localFrame === 0 ? 1.07 : stepSlice.localFrame === 1 ? 1.015 : 1.0 + stepSlice.localFrame * 0.008;
            const stepZoom = baseStep * overshoot;
            const ox = (W - g.w * stepZoom) / 2;
            const oy = (H - g.h * stepZoom) / 2;
            ctx.fillStyle = PALETTE.inkLight;
            for (let r = 0; r < g.h; r++) {
                for (let c = 0; c < g.w; c++) {
                    if (g.data[r * g.w + c] > 105) {
                        ctx.fillRect(ox + c * stepZoom + 0.8, oy + r * stepZoom + 0.8, stepZoom - 1.6, stepZoom - 1.6);
                    }
                }
            }
            params.mode = 0;
            params.barrel = 0.0;
            params.chroma = stepSlice.localFrame === 0 ? 0.0022 : 0.0008;
            params.paperGrain = 0.14;
            params.vignette = 0.12;
            params.bloom = 0.0;
            params.halation = 0.0;
            params.trail = 0.0;
        }
        else {
            // S08c (F 258..268): Bone-silver & champagne-crested 3D Houdini plexus wave
            const wu = (frame - 258) / 10;
            const morph = easeOutCubic(Math.min(1, (frame - 258 + 0.35) / 3.2));
            ctx.fillStyle = PALETTE.obsidianVoid;
            ctx.fillRect(0, 0, W, H);
            const yaw = lerp(0.0, -0.28 + wu * 0.54, morph) + (pointer.nx - 0.5) * 0.36;
            const pitch = lerp(0.0, 0.58 - wu * 0.12, morph) + (pointer.ny - 0.5) * 0.22;
            const cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
            const cpitch = Math.cos(pitch), spitch = Math.sin(pitch);
            const origins = charAOrigins;
            for (let r = 0; r < WAVE_ROWS; r++) {
                const v = (r / (WAVE_ROWS - 1)) * 2 - 1;
                for (let c = 0; c < WAVE_COLS; c++) {
                    const idx = r * WAVE_COLS + c;
                    const u = (c / (WAVE_COLS - 1)) * 2 - 1;
                    const wave = Math.sin(u * 3.6 + wu * 4.2) * 0.62 +
                        Math.cos(v * 3.2 - wu * 3.4) * 0.54 +
                        Math.sin((u - v) * 5.4 - wu * 2.5) * 0.28;
                    const tx3 = u * 5.6;
                    const tz3 = v * 4.6;
                    const ty3 = wave + v * 1.15;
                    const ax = origins[idx * 2];
                    const ay = origins[idx * 2 + 1];
                    const x3 = lerp(ax, tx3, morph);
                    const y3 = lerp(ay, ty3, morph);
                    const z3 = lerp(0.0, tz3, morph);
                    const rx = x3 * cyaw + z3 * syaw;
                    const rz = -x3 * syaw + z3 * cyaw;
                    const ry = y3 * cpitch - rz * spitch;
                    const rz2 = y3 * spitch + rz * cpitch;
                    const depth = Math.max(1.05, 4.65 - wu * 0.42 + rz2);
                    const f = 880 / depth;
                    waveSx[idx] = W * 0.5 + rx * f;
                    waveSy[idx] = H * 0.48 - ry * f;
                    waveDepth[idx] = depth;
                    const island1 = Math.exp(-((u - 0.50) ** 2 * 15 + (v + 0.22) ** 2 * 8));
                    const island2 = Math.exp(-((u + 0.34) ** 2 * 20 + (v - 0.04) ** 2 * 22));
                    waveCrest[idx] = Math.max(island1, island2 * 0.92, wave > 0.58 ? 0.48 : 0.0);
                }
            }
            if (morph > 0.45) {
                ctx.save();
                ctx.strokeStyle = `rgba(214, 207, 175, ${(0.18 * morph).toFixed(2)})`;
                ctx.lineWidth = 0.70;
                ctx.beginPath();
                for (let r = 0; r < WAVE_ROWS - 1; r++) {
                    for (let c = 0; c < WAVE_COLS - 1; c++) {
                        const idx = r * WAVE_COLS + c;
                        if (waveCrest[idx] < 0.34)
                            continue;
                        const sx = waveSx[idx], sy = waveSy[idx];
                        if (sx < 0 || sx > W || sy < 0 || sy > H)
                            continue;
                        const rIdx = idx + 1;
                        const dIdx = idx + WAVE_COLS;
                        if (Math.hypot(waveSx[rIdx] - sx, waveSy[rIdx] - sy) < 42) {
                            ctx.moveTo(sx, sy);
                            ctx.lineTo(waveSx[rIdx], waveSy[rIdx]);
                        }
                        if ((c + r) % 2 === 0 && Math.hypot(waveSx[dIdx] - sx, waveSy[dIdx] - sy) < 42) {
                            ctx.moveTo(sx, sy);
                            ctx.lineTo(waveSx[dIdx], waveSy[dIdx]);
                        }
                    }
                }
                ctx.stroke();
                ctx.restore();
            }
            for (let idx = 0; idx < WAVE_TOTAL; idx++) {
                const sx = waveSx[idx], sy = waveSy[idx];
                if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10)
                    continue;
                const depth = waveDepth[idx];
                const crest = waveCrest[idx];
                const coc = depth < 2.25 ? (2.25 - depth) * 4.8 : depth > 5.8 ? (depth - 5.8) * 3.2 : 0.0;
                if (coc > 1.2) {
                    const bRad = clamp(2.5 + coc, 3.0, 8.0);
                    const bAlpha = clamp((0.26 / (1 + coc * 0.45)) * (0.7 + crest * 0.5), 0.05, 0.26);
                    ctx.fillStyle = `rgba(74, 85, 104, ${bAlpha.toFixed(2)})`; // #4A5568 depth bokeh
                    ctx.beginPath();
                    ctx.arc(sx, sy, bRad, 0, Math.PI * 2);
                    ctx.fill();
                }
                else {
                    const sz = clamp((2.9 / (depth * 0.22)) * (1 + crest * 0.52), 1.7, 4.0);
                    const alpha = clamp((1 - (depth - 1.4) / 6.8) * (0.76 + crest * 0.34), 0.30, 0.98);
                    ctx.fillStyle = crest > 0.38
                        ? `rgba(214, 207, 175, ${alpha.toFixed(2)})` // #D6CFAF champagne crests
                        : `rgba(242, 239, 233, ${alpha.toFixed(2)})`; // #F2EFE9 bone particles
                    ctx.fillRect(sx - sz * 0.5, sy - sz * 0.5, sz, sz);
                    if (crest > 0.44 && morph > 0.5) {
                        const sub = sz * 0.72;
                        ctx.fillStyle = `rgba(242, 239, 233, ${(alpha * 0.72).toFixed(2)})`;
                        ctx.fillRect(sx + 3.8, sy + 1.3, sub, sub);
                    }
                }
            }
            params.mode = 0;
            params.barrel = 0.06;
            params.chroma = frame === 258 ? 0.0075 : 0.003;
            params.vignette = 0.30;
            params.bloom = 0.30;
            params.halation = 0.10;
            params.trail = 0.20;
            if (frame <= 259)
                params.motionBlur = [0.014, -0.008];
        }
    }
    // ── SCENE 09 (F 269..321, B25..B30): Turrell Vertical Slit -> Rag Ribbon -> 38° Light Blade! ───
    else if (frame < 322) {
        const lf = frame - 269;
        if (frame < 297) {
            // S09a (F 269..296): "Living" + Real Tadao Ando / James Turrell Board-Formed Concrete Sanctuary Light-Slit
            const u = lf / 27;
            const lockU = easeOutCubic(Math.min(1, lf / 8));
            ctx.fillStyle = PALETTE.obsidianVoid;
            ctx.fillRect(0, 0, W, H);
            drawTurrellVerticalSlit(ctx, W, H, assets.plates.s09Living, lf, u, pxShift, pyShift);
            const wordTilt = lerp(-0.04, 0.0, lockU);
            const wordScale = lerp(1.07, 1.0, lockU) + u * 0.024;
            fg.save();
            fg.translate(W * 0.27 + pxShift * 0.22, H * 0.49 + pyShift * 0.20);
            fg.rotate(wordTilt);
            fg.scale(wordScale, wordScale);
            drawGrotesque(fg, "Living", 0, 0, 56, {
                align: "center",
                weight: 500,
                color: PALETTE.inkLight,
                shadow: true,
            });
            fg.restore();
            const kin = shotRamp(lf, 28, 1);
            params.mode = 0;
            params.zoom = lerp(1.00, 1.045, u) * (1 + (kin.zoomMul - 1) * 0.45);
            params.roll = kin.rollAdd * 0.38;
            params.barrel = 0.04;
            params.chroma = 0.0028 + kin.chromaAdd * 0.35;
            params.vignette = 0.34;
            params.bloom = 0.36;
            params.halation = 0.22;
            params.anamorphic = 0.32;
            params.anamorphicTint = PALETTE.gl.anamorphic;
            params.trail = 0.12;
            if (lf === 0)
                params.motionBlur = [0, 0.010];
        }
        else if (frame < 301) {
            // S09b (F 297..300): 4f #F6F5F0 Archival Rag + 28 Graphite/Champagne 3D Drafting Curves + "Form"
            darkBg = false;
            const ru = (frame - 297) / 3;
            ctx.fillStyle = PALETTE.paperLight;
            ctx.fillRect(0, 0, W, H);
            const strands = 28;
            const steps = 104;
            const rSyms = "·:+-=o";
            for (let k = 0; k < strands; k++) {
                const s = (k / (strands - 1)) * 2 - 1;
                ctx.beginPath();
                for (let st = 0; st < steps; st++) {
                    const t = st / (steps - 1);
                    const spineX = lerp(-40, W + 60, t);
                    const spineY = lerp(H * 0.84, H * 0.14, Math.pow(t, 0.82)) -
                        Math.sin(t * Math.PI * 1.32) * 92 +
                        (ru - 0.5) * 16;
                    const twist = t * Math.PI * 1.36 - 0.56 + ru * 0.30;
                    const halfWidth = lerp(152, 88, t);
                    const px = spineX + s * halfWidth * Math.sin(twist) * 0.45;
                    const py = spineY + s * halfWidth * Math.cos(twist) * 0.72;
                    if (st === 0)
                        ctx.moveTo(px, py);
                    else
                        ctx.lineTo(px, py);
                }
                ctx.strokeStyle =
                    k % 3 === 0 ? "rgba(168, 155, 122, 0.36)" : "rgba(58, 58, 56, 0.22)";
                ctx.lineWidth = k % 3 === 0 ? 1.05 : 0.80;
                ctx.stroke();
            }
            ctx.font = `500 9.5px ${MONO}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for (let st = 0; st < steps; st += 2) {
                const t = st / (steps - 1);
                const spineX = lerp(-40, W + 60, t);
                const spineY = lerp(H * 0.84, H * 0.14, Math.pow(t, 0.82)) -
                    Math.sin(t * Math.PI * 1.32) * 92 +
                    (ru - 0.5) * 16;
                const twist = t * Math.PI * 1.36 - 0.56 + ru * 0.30;
                const halfWidth = lerp(152, 88, t);
                const nx = Math.sin(twist) * 0.45;
                const ny = Math.cos(twist);
                for (let k = 0; k < strands; k += 4) {
                    const s = (k / (strands - 1)) * 2 - 1;
                    const px = spineX + s * halfWidth * nx;
                    const py = spineY + s * halfWidth * ny * 0.72;
                    const alpha = clamp(0.24 + (1 - t * 0.55) * 0.42, 0.14, 0.68);
                    ctx.fillStyle =
                        k % 8 === 0
                            ? `rgba(168, 155, 122, ${alpha.toFixed(2)})`
                            : `rgba(58, 58, 56, ${(alpha * 0.82).toFixed(2)})`;
                    ctx.fillText(rSyms[(st + k) % rSyms.length], px, py);
                }
            }
            const lx = lerp(W * 0.62, W * 0.76, easeInOutCubic(ru));
            const ly = lerp(H * 0.28, H * 0.20, easeInOutCubic(ru));
            fg.save();
            fg.translate(lx, ly);
            fg.rotate(-0.24);
            fg.transform(1.06, 0.0, -0.52, 0.60, 0, 0);
            fg.fillStyle = PALETTE.inkDark;
            fg.font = `500 94px ${SANS}`;
            fg.textAlign = "center";
            fg.textBaseline = "middle";
            fg.fillText("Form", 0, 0);
            fg.restore();
            params.mode = 0;
            params.zoom = lerp(1.00, 1.045, ru);
            params.barrel = 0.0;
            params.chroma = 0.0022;
            params.paperGrain = 0.34;
            params.vignette = 0.08;
            params.bloom = 0.0;
            params.halation = 0.0;
            params.motionBlur = [0.016, -0.009];
        }
        else if (frame < 320) {
            // S09c (F 301..319, Bar 7.0 Hoover Climax): Real Smoked Optical Crystal Prism Monolith + Right-Pinned "Form"
            const fLf = frame - 301;
            const u = fLf / 18;
            ctx.fillStyle = PALETTE.obsidianVoid;
            ctx.fillRect(0, 0, W, H);
            drawTurrellDiagonalBlade(ctx, W, H, assets.plates.s09Form, fLf, pxShift, pyShift);
            const lSettle = easeOutCubic(Math.min(1, fLf / 5));
            const lScale = lerp(1.09, 1.0, lSettle) + u * 0.022;
            fg.save();
            fg.translate(W * 0.72 + pxShift * 0.22, H * 0.48 + pyShift * 0.20);
            fg.scale(lScale, lScale);
            drawGrotesque(fg, "Form", 0, 0, 56, {
                align: "left",
                weight: 500,
                color: PALETTE.inkLight,
                shadow: true,
            });
            fg.restore();
            const kin = shotRamp(fLf, 19, -1, false);
            params.mode = 0;
            params.zoom = kin.zoomMul;
            params.roll = kin.rollAdd * 0.38;
            params.barrel = 0.045;
            params.chroma = frame === 301 ? 0.0075 : 0.0032;
            params.vignette = 0.32;
            params.flash = frame === 301 ? 0.14 : 0;
            params.bloom = 0.42;
            params.halation = 0.30;
            params.anamorphic = 0.52;
            params.anamorphicTint = PALETTE.gl.anamorphic;
            params.trail = 0.14;
            if (frame === 301)
                params.motionBlur = [0.012, -0.010];
        }
        else {
            // S09d (F 320..321): Ascending champagne-silver caustic dust & diagonal glint bridge into S10a
            const bu = frame - 320;
            ctx.fillStyle = PALETTE.obsidianVoid;
            ctx.fillRect(0, 0, W, H);
            ctx.save();
            ctx.translate(W * 0.46, H * 0.48);
            ctx.rotate((-38 * Math.PI) / 180);
            const glint = ctx.createLinearGradient(0, -40, 0, 40);
            glint.addColorStop(0, "rgba(200, 211, 230, 0)");
            glint.addColorStop(0.5, `rgba(214, 207, 175, ${(0.28 - bu * 0.10).toFixed(2)})`);
            glint.addColorStop(1, "rgba(214, 207, 175, 0)");
            ctx.fillStyle = glint;
            ctx.fillRect(-900, -40, 1800, 80);
            ctx.restore();
            for (let i = 0; i < 48; i++) {
                const wing = i % 2 === 0 ? -1 : 1;
                const spread = (((i * 67 + 13) % 100) / 100 - 0.5) * 0.42;
                const x = W * (0.5 + wing * 0.22 + spread) + Math.sin(i * 3.1 + bu * 2.0) * 16;
                const y = H * (0.64 - bu * 0.20 - ((i * 29) % 48) * 0.009);
                const r = 1.2 + (i % 3) * 0.7;
                const ea = (0.36 + (i % 4) * 0.12).toFixed(2);
                ctx.fillStyle = i % 2 === 0 ? `rgba(214, 207, 175, ${ea})` : `rgba(200, 211, 230, ${ea})`;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
            params.mode = 0;
            params.zoom = lerp(1.01, 1.045, bu);
            params.bloom = 0.48;
            params.halation = 0.18;
            params.anamorphic = 0.36;
            params.anamorphicTint = PALETTE.gl.anamorphic;
            params.trail = frame === 320 ? 0.0 : 0.26;
            if (frame === 321)
                params.motionBlur = [0, -0.009];
        }
    }
    // ── SCENE 10 (F 322..431, B30..B40): 2.8px Fluted Crystal -> Mineral Pupil -> Cards -> R3-03! ─
    else {
        if (frame < 355) {
            // S10a (F 322..354): Silky Continuous 2.8px Fluted-Crystal Aurora (`mode 4`) + "and every living form"
            const lf = frame - 322;
            const u = clamp(lf / 32, 0, 1);
            ctx.fillStyle = PALETTE.obsidianVoid;
            ctx.fillRect(0, 0, W, H);
            if (lf >= 2) {
                const tIn = easeOutCubic(Math.min(1, (lf - 2) / 5));
                fg.save();
                fg.globalAlpha = tIn;
                fg.translate(W * 0.5 + pxShift * 0.2, H * 0.50 + pyShift * 0.2);
                const sc = lerp(0.96, 1.0, tIn) + u * 0.018;
                fg.scale(sc, sc);
                drawGrotesque(fg, "and every living form", 0, 0, 38, {
                    color: PALETTE.inkLight,
                    weight: 500,
                    shadow: true,
                });
                fg.restore();
            }
            params.mode = 4;
            params.asciiBg = u;
            params.cellSize = 2.8;
            params.zoom = lerp(1.00, 1.07, easeInOutCubic(u));
            params.roll = Math.sin(u * Math.PI) * 0.012;
            params.chroma = 0.0034;
            params.barrel = 0.045;
            params.vignette = 0.26;
            params.bloom = 0.20;
            params.halation = 0.08;
            params.anamorphic = 0.18;
            params.anamorphicTint = PALETTE.gl.anamorphic;
            params.trail = 0.16;
        }
        else if (frame < 376) {
            // S10b (F 355..375): Quiet Mineral Pupil Catchlight ("moves when")
            const lf = frame - 355;
            const u = lf / 20;
            ctx.fillStyle = PALETTE.obsidianVoid;
            ctx.fillRect(0, 0, W, H);
            const eyeZoom = 1.38 + u * 0.14;
            const eyeCx = W * 0.40 + pxShift * 0.45;
            const eyeCy = H * 0.50 + pyShift * 0.45;
            const eyeOffX = (eyeCx - W * 0.5) - 0.025 * W * eyeZoom;
            const eyeOffY = (eyeCy - H * 0.5) - 0.125 * (W / 1.5) * eyeZoom;
            const gradedEye = getGradedEye(assets.eye);
            if (gradedEye) {
                ctx.save();
                ctx.globalAlpha = 0.34;
                drawCoverSource(ctx, gradedEye, eyeZoom, eyeOffX, eyeOffY);
                ctx.restore();
            }
            const outerDim = ctx.createRadialGradient(eyeCx, eyeCy, 185, eyeCx, eyeCy, 440);
            outerDim.addColorStop(0, "rgba(8, 9, 11, 0)");
            outerDim.addColorStop(1, "rgba(8, 9, 11, 0.94)");
            ctx.fillStyle = outerDim;
            ctx.fillRect(0, 0, W, H);
            const pupCore = ctx.createRadialGradient(eyeCx, eyeCy, 12, eyeCx, eyeCy, 62);
            pupCore.addColorStop(0, "rgba(8, 9, 11, 0.98)");
            pupCore.addColorStop(0.78, "rgba(8, 9, 11, 0.90)");
            pupCore.addColorStop(1, "rgba(8, 9, 11, 0)");
            ctx.fillStyle = pupCore;
            ctx.beginPath();
            ctx.arc(eyeCx, eyeCy, 64, 0, Math.PI * 2);
            ctx.fill();
            // Refined 10:30 #F2EFE9 + #D6CFAF corneal catchlight
            ctx.save();
            ctx.translate(eyeCx - 48, eyeCy - 38);
            ctx.rotate(-0.52);
            const cg = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);
            cg.addColorStop(0, "rgba(242, 239, 233, 0.92)");
            cg.addColorStop(0.50, "rgba(214, 207, 175, 0.34)");
            cg.addColorStop(1, "rgba(8, 9, 11, 0)");
            ctx.fillStyle = cg;
            ctx.beginPath();
            ctx.ellipse(0, 0, 22, 13, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            const full = "moves when";
            const chars = Math.min(full.length, Math.floor(lf * 0.85) + 3);
            drawGrotesque(fg, full.slice(0, chars), W * 0.60, H * 0.50, 38, {
                align: "left",
                weight: 500,
                color: PALETTE.inkLight,
                shadow: true,
            });
            const kin = shotRamp(lf, 21, 1);
            params.mode = 3;
            params.asciiBg = 2.0;
            params.cellSize = 5.8;
            params.zoom = lerp(1.00, 1.08, easeInOutCubic(u)) * (1 + (kin.zoomMul - 1) * 0.45);
            params.roll = lerp(-0.012, 0.012, u);
            params.chroma = 0.0035 + kin.chromaAdd * 0.35;
            params.barrel = 0.05;
            params.vignette = 0.50;
            params.bloom = 0.26;
            params.halation = 0.08;
        }
        else if (frame < 398) {
            // S10c (F 376..397): "you do." + 5 World-01 Showcase Cards over Champagne/Slate Studio Backlight
            // Card #4 (F 394..397) settles cleanly to exact identity on F 397 for subpixel F 398 whip-morph!
            const lf = frame - 376;
            const cardCuts = [376, 381, 386, 390, 394];
            const slice = cutSlice(frame, cardCuts, 398);
            const cardVariant = slice.index;
            const isLastCard = cardVariant === 4;
            const dir = cardVariant % 2 === 0 ? 1 : -1;
            ctx.fillStyle = PALETTE.obsidianVoid;
            ctx.fillRect(0, 0, W, H);
            const settleLast = isLastCard ? 1 - easeOutCubic(slice.localFrame / Math.max(1, slice.shotLen - 1)) : 1.0;
            const kin = shotRamp(slice.localFrame, slice.shotLen, dir, !isLastCard);
            const cardOffX = (isLastCard ? settleLast : 1.0) * pxShift * 0.35;
            const cardOffY = (isLastCard ? settleLast : 1.0) * pyShift * 0.35;
            const cardX = W * 0.53 + cardOffX;
            const cardY = H * 0.25 + cardOffY;
            // Sculpted subtle champagne & platinum-slate ambient studio backlight behind floating card
            const studioGlow = ctx.createRadialGradient(cardX + 208, cardY + 166, 36, cardX + 208, cardY + 166, 360);
            studioGlow.addColorStop(0, "rgba(214, 207, 175, 0.11)");
            studioGlow.addColorStop(0.48, "rgba(74, 85, 104, 0.09)");
            studioGlow.addColorStop(1, "rgba(8, 9, 11, 0)");
            ctx.fillStyle = studioGlow;
            ctx.fillRect(0, 0, W, H);
            const full = "you do.";
            const chars = Math.min(full.length, Math.floor(lf * 1.2) + 2);
            drawGrotesque(fg, full.slice(0, chars), W * 0.18, H * 0.50, 40, {
                align: "left",
                weight: 500,
                color: PALETTE.inkLight,
            });
            drawLaunchPostCard(ctx, cardX, cardY, 416, 332, cardVariant, frame, assets);
            params.mode = 0;
            params.perspPivot = [0.18, 0.50];
            params.perspX = kin.yawAdd * 1.05 * settleLast;
            params.perspY = kin.pitchAdd * 1.05 * settleLast;
            params.roll = kin.rollAdd * settleLast;
            params.zoom = isLastCard ? lerp(1.055, 1.00, 1 - settleLast) : kin.zoomMul;
            params.barrel = lerp(0.03, 0.048, settleLast);
            params.chroma = 0.0022 + kin.chromaAdd * 0.7;
            params.paperGrain = 0.22;
            params.vignette = 0.38;
            params.bloom = 0.24;
            params.halation = 0.08;
            if (kin.blurMag > 0) {
                params.motionBlur = [dir * kin.blurMag * 0.68, 0];
            }
        }
        else if (frame < 408) {
            // F 398..407: SIGNATURE MATCH-CUT (Card #5 16:9 video player -> center R3-03 16:9 gate)!
            const preLf = frame - 398;
            ctx.fillStyle = PALETTE.obsidianVoid;
            ctx.fillRect(0, 0, W, H);
            const sz = 84;
            const s = sz / 100;
            const targetCx = W * 0.5 - 3.98 * s;
            const targetCy = H * 0.5 + 11.5 * s;
            const targetW = 34.0 * s;
            const targetH = 19.2 * s;
            if (preLf < 3) {
                const morphU = easeOutCubic((preLf + 0.35) / 2.65);
                const curCx = lerp(886.4, targetCx, morphU);
                const curCy = lerp(373.0, targetCy, morphU);
                const curW = lerp(388.0, targetW, morphU);
                const curH = lerp(214.0, targetH, morphU);
                const curShear = lerp(0.0, -0.085, morphU);
                ctx.save();
                ctx.translate(curCx, curCy);
                ctx.transform(1, 0, curShear, 1, 0, 0);
                ctx.fillStyle = PALETTE.paperLight;
                ctx.fillRect(-curW * 0.5, -curH * 0.5, curW, curH);
                ctx.restore();
                const pad = lerp(18, 9, morphU);
                drawTrackBox(fg, curCx - curW * 0.5 - pad, curCy - curH * 0.5 - pad, curW + pad * 2, curH + pad * 2, {
                    color: "rgba(217, 65, 43, 0.65)",
                    labelColor: "rgba(242, 239, 233, 0.80)",
                    label: `x:${Math.round(curCx)} y:${Math.round(curCy)}`,
                    cornerBrackets: true,
                    crosshair: false,
                });
                params.motionBlur = [-0.018 * (1 - morphU), 0.0];
            }
            else {
                drawFinaleEmblem(ctx, W * 0.5, H * 0.5, sz, true, 0);
                const pad = frame >= 406 ? 5.5 : lerp(9.0, 7.8, (preLf - 3) / 4);
                const bw = targetW + pad * 2;
                const bh = targetH + pad * 2;
                drawTrackBox(fg, targetCx - bw * 0.5, targetCy - bh * 0.5, bw, bh, {
                    color: "rgba(217, 65, 43, 0.65)",
                    labelColor: "rgba(242, 239, 233, 0.80)",
                    label: "x:640 y:360",
                    cornerBrackets: true,
                    crosshair: false,
                });
            }
            params.mode = 0;
            params.barrel = 0.03;
            params.chroma = frame === 406 || preLf === 0 ? 0.006 : 0.0024;
            params.vignette = 0.28;
            params.bloom = 0.30;
            params.halation = 0.08;
        }
        else {
            // F 408..431 (B38 = 17.000s RAZOR STEM GATE!): Blinding #FFFFFF -> #F6F5F0 Cotton-Paper Slam!
            darkBg = false;
            const slamLf = frame - 408;
            ctx.fillStyle = slamLf === 0 ? "#FFFFFF" : PALETTE.paperLight;
            ctx.fillRect(0, 0, W, H);
            const spread = slamLf === 0 ? 9.0 : slamLf === 1 ? 2.2 : 0.0;
            drawFinaleEmblem(ctx, W * 0.5 + pxShift * 0.15, H * 0.50 + pyShift * 0.15, 84, false, spread);
            params.mode = 0;
            params.barrel = 0.0;
            params.chroma = slamLf === 0 ? 0.005 : 0.0008;
            params.paperGrain = slamLf === 0 ? 0.32 : 0.88;
            params.vignette = slamLf === 0 ? 0.10 : 0.24;
            params.flash = 0.0;
            params.bloom = 0.0;
            params.halation = 0.0;
        }
    }
    // Apply damped 2-frame 134 BPM optical camera recoil across major downbeat kicks.
    applyBeatRecoil(frame, params);
    return params;
}
