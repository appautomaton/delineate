// delineate Archival Copperplate, Calligraphic Ribbon & Shifted Double-Glaze Watercolor Kit for Zoom.
// Zero runtime dependencies, zero SVG <filter> blurs.
// Built directly in the printmaking & botanical lineage of:
//   - footers/worlds/glasshouse/gen.ts (non-scaling copperplate burin hatching, flick breaks, foliage touches, moon rims, water reflections)
//   - footers/worlds/lijiang/gen.ts (pressured variable-width calligraphic ribbons, feibai gaps, karst peaks, lotus-leaf cun veins, moss dabs)
//   - garden/draw/lib.ts & garden/draw/rosette.ts (knockout + shifted double-glaze watercolors, split directional ink, 3D golden-angle rosettes)
//   - footers/worlds/observatory/gen.ts (precision horological brass gears & vernier degree rings)
import { APERTURE, BLEED, STAGE_CX, STAGE_CY } from "./scenes/types.js";
export const TAU = Math.PI * 2;
export const rad = (deg) => (deg * Math.PI) / 180;
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
};
export const f = (n) => {
    const r = Math.round(n * 10) / 10;
    return r === 0 ? "0" : String(r);
};
export const P = (p) => `${f(p[0])} ${f(p[1])}`;
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, k) => [a[0] * k, a[1] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
export const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const norm = (a) => {
    const m = Math.hypot(a[0], a[1]) || 1;
    return [a[0] / m, a[1] / m];
};
export const rot = (p, a) => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};
export const polar = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
export const centroid = (pts) => {
    let sx = 0;
    let sy = 0;
    for (const [x, y] of pts) {
        sx += x;
        sy += y;
    }
    return [sx / pts.length, sy / pts.length];
};
// Shared upper-left studio/archival light vector matching garden/draw/lib.ts & glasshouse!
export const LIGHT = norm([-0.55, -0.83]);
/** Semantic CSS custom property palette — switches Day <-> Night instantaneously with zero rebuild. */
export const PAL = {
    paper: "var(--z-paper)",
    paperWarm: "var(--z-paper-warm)",
    paperDeep: "var(--z-paper-deep)",
    paperStone: "var(--z-paper-stone)",
    paperShadow: "var(--z-paper-shadow)",
    paperMist: "var(--z-paper-mist)",
    cut: "var(--z-cut)",
    ink: "var(--z-ink)",
    inkSepia: "var(--z-ink-sepia)",
    inkMid: "var(--z-ink-mid)",
    inkHair: "var(--z-ink-hair)",
    inkDraft: "var(--z-ink-draft)",
    litEdge: "var(--z-lit-edge)",
    inkRim: "var(--z-ink-rim)",
    sage: "var(--z-sage)",
    sageLt: "var(--z-sage-lt)",
    sageDk: "var(--z-sage-dk)",
    celadon: "var(--z-celadon)",
    celadonLt: "var(--z-celadon-lt)",
    celadonDk: "var(--z-celadon-dk)",
    malachite: "var(--z-malachite)",
    azurite: "var(--z-azurite)",
    copper: "var(--z-copper)",
    prussian: "var(--z-prussian)",
    prussianLt: "var(--z-prussian-lt)",
    prussianDk: "var(--z-prussian-dk)",
    ochre: "var(--z-ochre)",
    ochreLt: "var(--z-ochre-lt)",
    ochreDk: "var(--z-ochre-dk)",
    cinnabar: "var(--z-cinnabar)",
    cinnabarLt: "var(--z-cinnabar-lt)",
    cinnabarDk: "var(--z-cinnabar-dk)",
    umber: "var(--z-umber)",
    umberLt: "var(--z-umber-lt)",
    umberDk: "var(--z-umber-dk)",
    bark: "var(--z-bark)",
    barkDk: "var(--z-bark-dk)",
    slate: "var(--z-slate)",
    slateLt: "var(--z-slate-lt)",
    slateDk: "var(--z-slate-dk)",
    wisteria: "var(--z-wisteria)",
    wisteriaLt: "var(--z-wisteria-lt)",
    wisteriaDk: "var(--z-wisteria-dk)",
    petal: "var(--z-petal)",
    petalBlush: "var(--z-petal-blush)",
    waterSpray: "var(--z-water-spray)",
    brass: "var(--z-brass)",
    brassLt: "var(--z-brass-lt)",
    brassDk: "var(--z-brass-dk)",
    glass: "var(--z-glass)",
    glassTint: "var(--z-glass-tint)",
    water: "var(--z-water)",
    waterDeep: "var(--z-water-deep)",
    waterShimmer: "var(--z-water-shimmer)",
    lantern: "var(--z-lantern)",
    lanternCore: "var(--z-lantern-core)",
    lanternHalo: "var(--z-lantern-halo)",
    windowLit: "var(--z-window-lit)",
    windowDim: "var(--z-window-dim)",
    vein: "var(--z-vein)",
};
export function rng(seed) {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export const rand = (r, lo, hi) => lo + r() * (hi - lo);
export function through(pts) {
    let d = "";
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const c1 = add(p1, mul(sub(p2, p0), 1 / 6));
        const c2 = sub(p2, mul(sub(p3, p1), 1 / 6));
        d += `C${P(c1)} ${P(c2)} ${P(p2)}`;
    }
    return d;
}
export const linePath = (pts) => (pts.length ? `M${P(pts[0])}${through(pts)}` : "");
export function closedSmooth(pts) {
    const n = pts.length;
    if (n < 3)
        return "";
    let d = `M${P(pts[0])}`;
    for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n];
        const p1 = pts[i];
        const p2 = pts[(i + 1) % n];
        const p3 = pts[(i + 2) % n];
        const c1 = add(p1, mul(sub(p2, p0), 1 / 6));
        const c2 = sub(p2, mul(sub(p3, p1), 1 / 6));
        d += `C${P(c1)} ${P(c2)} ${P(p2)}`;
    }
    return d + "Z";
}
export const polyPath = (pts) => (pts.length ? `M${pts.map(P).join("L")}Z` : "");
export const openPoly = (pts) => (pts.length ? `M${pts.map(P).join("L")}` : "");
export function circlePath(cx, cy, r) {
    return `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
}
export function ellipsePath(cx, cy, rx, ry) {
    return `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;
}
export function sample(fn, n) {
    return Array.from({ length: n + 1 }, (_, i) => fn(i / n));
}
export const cubic = (p0, p1, p2, p3) => (t) => {
    const u = 1 - t;
    return [
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ];
};
export const quad = (p0, p1, p2) => (t) => {
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
};
export function bilerp(tl, tr, br, bl, u, v) {
    const top = lerp(tl, tr, u);
    const bot = lerp(bl, br, u);
    return lerp(top, bot, v);
}
/** Catmull-Rom dense polyline sampling (footers/lib/geometry.ts lineage). */
export function catmullSpline(points, samples = 6, closed = false) {
    if (points.length < 2)
        return [...points];
    const pts = closed
        ? [points[points.length - 1], ...points, points[0], points[1]]
        : [points[0], ...points, points[points.length - 1]];
    const out = [];
    for (let i = 1; i < pts.length - 2; i++) {
        const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
        for (let k = 0; k < samples; k++) {
            const t = k / samples;
            const t2 = t * t;
            const t3 = t2 * t;
            const x = 0.5 *
                (2 * p1[0] +
                    (-p0[0] + p2[0]) * t +
                    (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                    (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
            const y = 0.5 *
                (2 * p1[1] +
                    (-p0[1] + p2[1]) * t +
                    (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                    (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
            out.push([x, y]);
        }
    }
    if (!closed)
        out.push(pts[pts.length - 2]);
    return out;
}
/** Uniform arclength polyline resampler (footers/lib/geometry.ts lineage). */
export function resamplePolyline(pts, step) {
    if (pts.length < 2 || step <= 0)
        return [...pts];
    const out = [pts[0]];
    let acc = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
        let [ax, ay] = pts[i];
        const [bx, by] = pts[i + 1];
        let seg = Math.hypot(bx - ax, by - ay);
        while (acc + seg >= step && seg > 1e-6) {
            const t = (step - acc) / seg;
            ax += (bx - ax) * t;
            ay += (by - ay) * t;
            out.push([ax, ay]);
            seg = Math.hypot(bx - ax, by - ay);
            acc = 0;
        }
        acc += seg;
    }
    const last = pts[pts.length - 1];
    const tail = out[out.length - 1];
    if (Math.hypot(tail[0] - last[0], tail[1] - last[1]) > step * 0.25)
        out.push(last);
    return out;
}
export function wobblePoly(pts, r, amp = 1.6, segLen = 54) {
    const out = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % n];
        const len = dist(a, b);
        const steps = Math.max(1, Math.min(7, Math.round(len / segLen)));
        const nx = -(b[1] - a[1]) / (len || 1);
        const ny = (b[0] - a[0]) / (len || 1);
        for (let s = 0; s < steps; s++) {
            const t = s / steps;
            const p = lerp(a, b, t);
            const jitter = s === 0 ? rand(r, -amp * 0.4, amp * 0.4) : rand(r, -amp, amp);
            out.push([p[0] + nx * jitter, p[1] + ny * jitter]);
        }
    }
    return out;
}
/** Harmonic watercolor wobble function (garden/draw/lib.ts lineage). */
export function wobbleFn(r, amp, freqs = [2, 5, 9]) {
    const ph = freqs.map(() => r() * TAU);
    return (t) => {
        let s = 0;
        for (let i = 0; i < freqs.length; i++) {
            s += (amp / (i + 1)) * Math.sin(t * freqs[i] * TAU + ph[i]);
        }
        return s;
    };
}
/**
 * Shifted, organically wobbled watercolor glaze polygon (garden/draw/lib.ts `glaze()`).
 */
export function glazePoly(pts, r, opts = {}) {
    const { k = 1, about, shift = [1.8, 2.2], amp = 0.032 } = opts;
    const c = about ?? centroid(pts);
    const w = wobbleFn(r, amp, [2, 5, 9]);
    const n = pts.length;
    return pts.map((p, i) => add(add(c, mul(sub(p, c), k + w(i / n))), shift));
}
export function spans(poly, v) {
    const hits = [];
    const n = poly.length;
    for (let i = 0; i < n; i++) {
        const [x0, y0] = poly[i];
        const [x1, y1] = poly[(i + 1) % n];
        if ((y0 <= v && y1 > v) || (y1 <= v && y0 > v)) {
            hits.push(x0 + ((v - y0) / (y1 - y0)) * (x1 - x0));
        }
    }
    hits.sort((a, b) => a - b);
    return hits;
}
export function pointInPoly(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        const hit = yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi || 1e-9) + xi;
        if (hit)
            inside = !inside;
    }
    return inside;
}
// ---------- Copperplate Tone Fields & Burin Primitives (glasshouse lineage!) ----------
export function linearTone(p0, p1, t0 = 0.06, t1 = 0.92) {
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const denom = dx * dx + dy * dy || 1;
    return (x, y) => {
        const u = clamp(((x - p0[0]) * dx + (y - p0[1]) * dy) / denom, 0, 1);
        return t0 + (t1 - t0) * u;
    };
}
export function radialTone(cx, cy, r0, r1, tInner = 0.06, tOuter = 0.92) {
    const span = r1 - r0 || 1;
    return (x, y) => {
        const u = clamp((Math.hypot(x - cx, y - cy) - r0) / span, 0, 1);
        return tInner + (tOuter - tInner) * u;
    };
}
export function cylinderTone(axisOrigin, axisDir, radius, lightDir = LIGHT) {
    const ax = norm(axisDir);
    const perp = [-ax[1], ax[0]];
    const lightDot = dot(perp, lightDir);
    const sign = lightDot >= 0 ? 1 : -1;
    return (x, y) => {
        const s = ((x - axisOrigin[0]) * perp[0] + (y - axisOrigin[1]) * perp[1]) / Math.max(1, radius);
        // -1 = sunlit flank, +1 = deep core shadow, wrapping back slightly for reflected rim light
        const oriented = clamp(-s * sign, -1, 1);
        const core = 0.1 + 0.85 * smoothstep(-0.65, 0.82, oriented);
        const rimBack = 0.16 * smoothstep(0.75, 1.0, oriented);
        return clamp(core - rimBack, 0, 1);
    };
}
/**
 * True glasshouse-lineage copperplate burin hatching:
 * Clips parallel scanlines analytically to `polyPts`, evaluates `toneFn(x, y)` along each cut,
 * breaks lit passages into delicate flicks, quantizes into 3 hair-fine non-scaling burin widths
 * `[0.38, 0.72, 1.12]`, and optionally lays a cross-hatch pass in deep shadows (`tone > crossThresh`).
 */
export function burinHatch(polyPts, angleRad, spacing, toneFn, r = rng(731), opts = {}) {
    const widths = opts.widths ?? [0.38, 0.72, 1.12];
    const step = Math.max(4, opts.step ?? 16);
    const flick = opts.flick ?? 0.24;
    const curveAmp = opts.curveAmp ?? 0.55;
    const parts = [[], [], []];
    const counts = [0, 0, 0];
    const pass = (ang, gap, fn, flickThr) => {
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const rotPts = polyPts.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
        let vMin = Infinity;
        let vMax = -Infinity;
        for (const [, v] of rotPts) {
            if (v < vMin)
                vMin = v;
            if (v > vMax)
                vMax = v;
        }
        const safeGap = Math.max(2.5, gap);
        for (let v = vMin + safeGap * (0.2 + r() * 0.65); v < vMax; v += safeGap) {
            const hits = spans(rotPts, v);
            for (let h = 0; h + 1 < hits.length; h += 2) {
                const u0 = hits[h];
                const u1 = hits[h + 1];
                if (u1 - u0 < 3)
                    continue;
                const n = Math.max(1, Math.round((u1 - u0) / step));
                const du = (u1 - u0) / n;
                const marks = new Int8Array(n);
                for (let k = 0; k < n; k++) {
                    const um = u0 + (k + 0.5) * du;
                    const t = fn(um * ca - v * sa, um * sa + v * ca);
                    if (t <= 0.055 || (t < flickThr && r() * flickThr > t)) {
                        marks[k] = -1;
                    }
                    else if (t < 0.36) {
                        marks[k] = 0;
                    }
                    else if (t < 0.68) {
                        marks[k] = 1;
                    }
                    else {
                        marks[k] = 2;
                    }
                }
                // Coalesce contiguous runs of the same burin band into one stroke
                let k = 0;
                while (k < n) {
                    const b = marks[k];
                    let j = k + 1;
                    while (j < n && marks[j] === b)
                        j++;
                    if (b >= 0) {
                        const ua = u0 + k * du;
                        const ub = u0 + j * du;
                        if (ub - ua >= 2.2) {
                            const x0 = ua * ca - v * sa;
                            const y0 = ua * sa + v * ca;
                            const x1 = ub * ca - v * sa;
                            const y1 = ub * sa + v * ca;
                            if (curveAmp > 0.15 && ub - ua > 18) {
                                const bw = rand(r, -curveAmp, curveAmp);
                                const xm = (x0 + x1) * 0.5 - sa * bw;
                                const ym = (y0 + y1) * 0.5 + ca * bw;
                                parts[b].push(`M${f(x0)} ${f(y0)}Q${f(xm)} ${f(ym)} ${f(x1)} ${f(y1)}`);
                            }
                            else {
                                parts[b].push(`M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`);
                            }
                            counts[b]++;
                        }
                    }
                    k = j;
                }
            }
        }
    };
    pass(angleRad, spacing, toneFn, flick);
    if (opts.cross) {
        const crossThresh = opts.crossThresh ?? 0.54;
        const crossAng = opts.crossAngleRad ?? angleRad + rad(58);
        const crossGap = opts.crossSpacing ?? spacing * 1.28;
        const inv = 1 / Math.max(0.05, 1 - crossThresh);
        pass(crossAng, crossGap, (x, y) => clamp((toneFn(x, y) - crossThresh) * inv, 0, 1), 0.28);
    }
    return {
        bands: [
            { width: widths[0], d: parts[0].join(""), count: counts[0] },
            { width: widths[1], d: parts[1].join(""), count: counts[1] },
            { width: widths[2], d: parts[2].join(""), count: counts[2] },
        ],
        totalCount: counts[0] + counts[1] + counts[2],
    };
}
/**
 * Curled copperplate botanical C/S foliage touches (footers/worlds/glasshouse/gen.ts `touches()`).
 */
export function foliageTouches(r, polyPts, count, scale = 1, opts = {}) {
    const widths = opts.widths ?? [0.38, 0.7, 1.05];
    const curl = opts.curl ?? 1.0;
    const tilt = opts.tilt ?? 0.14;
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const [x, y] of polyPts) {
        if (x < x0)
            x0 = x;
        if (x > x1)
            x1 = x;
        if (y < y0)
            y0 = y;
        if (y > y1)
            y1 = y;
    }
    const c = centroid(polyPts);
    const spanR = Math.max(1, Math.hypot(x1 - x0, y1 - y0) * 0.5);
    const toneFn = opts.toneFn ??
        ((x, y) => {
            const proj = ((x - c[0]) * -LIGHT[0] + (y - c[1]) * -LIGHT[1]) / spanR;
            return clamp(0.45 + 0.45 * proj, 0.12, 0.96);
        });
    const parts = [[], [], []];
    const counts = [0, 0, 0];
    const area = Math.max(1, (x1 - x0) * (y1 - y0));
    const step = Math.max(7, Math.sqrt(area / Math.max(12, count * 1.9)));
    let placed = 0;
    let row = 0;
    for (let y = y0 + step * 0.3; y < y1 && placed < count * 1.4; y += step * 0.65, row++) {
        for (let x = x0 + (row % 2 ? step * 0.5 : 0); x < x1 && placed < count * 1.4; x += step) {
            const px = x + rand(r, -0.45, 0.45) * step;
            const py = y + rand(r, -0.32, 0.32) * step;
            if (!pointInPoly([px, py], polyPts))
                continue;
            const t = toneFn(px, py);
            if (r() > t * 1.55)
                continue;
            const band = t < 0.36 ? 0 : t < 0.68 ? 1 : 2;
            const sz = 5.5 * scale * rand(r, 0.72, 1.28);
            const dy = sz * tilt * rand(r, -1.2, 1.4);
            const sx = px - sz;
            const sy = py - dy;
            if (r() < 0.32) {
                // S-curl botanical leaf flick
                const mx = px;
                const my = py;
                const ex = px + sz * 1.25;
                const ey = py + dy * 1.3;
                parts[band].push(`M${f(sx)} ${f(sy)}Q${f(sx + sz * 0.55)} ${f(sy + sz * curl * 0.85)} ${f(mx)} ${f(my)}Q${f(mx + sz * 0.6)} ${f(my - sz * curl * 0.7)} ${f(ex)} ${f(ey)}`);
            }
            else {
                // C-curl copperplate touch
                parts[band].push(`M${f(sx)} ${f(sy)}Q${f(px)} ${f(py + sz * curl)} ${f(px + sz)} ${f(py + dy)}`);
            }
            counts[band]++;
            placed++;
        }
    }
    return {
        bands: [
            { width: widths[0], d: parts[0].join(""), count: counts[0] },
            { width: widths[1], d: parts[1].join(""), count: counts[1] },
            { width: widths[2], d: parts[2].join(""), count: counts[2] },
        ],
        totalCount: counts[0] + counts[1] + counts[2],
    };
}
/**
 * Ruled perspective copperplate water lines broken cleanly by reflection polygons (glasshouse lineage!).
 */
export function waterReflections(box, brokenByPolys = [], r = rng(907), opts = {}) {
    const rows = opts.rows ?? 34;
    let water = "";
    let reflected = "";
    let shimmer = "";
    let count = 0;
    for (let i = 0; i < rows; i++) {
        const u = i / Math.max(1, rows - 1);
        // Perspective crowding near far bank (y0), opening toward viewer (y1)
        const y = box.y0 + (box.y1 - box.y0) * (u ** 1.38);
        // Collect reflection intervals intersecting horizontal scanline y
        const intervals = [];
        for (const poly of brokenByPolys) {
            const hs = spans(poly, y);
            for (let k = 0; k + 1 < hs.length; k += 2) {
                const a = clamp(hs[k] + rand(r, -5, 5), box.x0, box.x1);
                const b = clamp(hs[k + 1] + rand(r, -5, 5), box.x0, box.x1);
                if (b - a > 4)
                    intervals.push([a, b]);
            }
        }
        intervals.sort((a, b) => a[0] - b[0]);
        // Merge overlapping reflection intervals
        const merged = [];
        for (const iv of intervals) {
            const last = merged[merged.length - 1];
            if (last && iv[0] <= last[1] + 3)
                last[1] = Math.max(last[1], iv[1]);
            else
                merged.push([iv[0], iv[1]]);
        }
        let cur = box.x0;
        const emitOpen = (a, b) => {
            let x = a + rand(r, 0, 12);
            const segBase = 36 + 88 * u;
            while (x < b - 10) {
                const len = Math.min(b - x, segBase * rand(r, 0.45, 1.35));
                if (r() < 0.84 && len > 8) {
                    water += `M${f(x)} ${f(y)}H${f(x + len)}`;
                    count++;
                }
                x += len + rand(r, 10, 32) * (0.5 + u);
            }
        };
        for (const [ra, rb] of merged) {
            if (ra > cur + 8)
                emitOpen(cur, ra);
            // Inside reflection: closer broken dark strokes + subtle shimmer ticks
            let x = ra + rand(r, 1, 8);
            const rStep = 14 + 28 * u;
            while (x < rb - 5) {
                const len = Math.min(rb - x, rStep * rand(r, 0.55, 1.25));
                if (len > 4) {
                    reflected += `M${f(x)} ${f(y + rand(r, -0.7, 0.7))}H${f(x + len)}`;
                    count++;
                }
                if (r() < 0.24 && len > 6) {
                    shimmer += `M${f(x + len * 0.2)} ${f(y + 1.4)}H${f(x + len * 0.72)}`;
                }
                x += len + rand(r, 4, 12);
            }
            cur = rb;
        }
        if (cur < box.x1 - 8)
            emitOpen(cur, box.x1);
    }
    return { water, reflected, shimmer, count };
}
// ---------- Pressured Variable-Width Calligraphic Ribbons (lijiang lineage!) ----------
/**
 * Brush pressure envelope along [0, 1]: presses in, breathes harmonically, lifts to a 0px tip.
 * Direct port of footers/lib/geometry.ts `pressure()`.
 */
export function brushPressure(r, lo = 0.35, hi = 1.0, swell) {
    const a = rand(r, 0, TAU);
    const b = rand(r, 0, TAU);
    const c = rand(r, 2.5, 5.5);
    const start = swell ? swell[0] : rand(r, 0.05, 0.14);
    const end = swell ? swell[1] : rand(r, 0.12, 0.28);
    return (u) => {
        const body = lo + (hi - lo) * (0.62 + 0.26 * Math.sin(u * c + a) + 0.12 * Math.sin(u * 11 + b));
        const taper = Math.min(1, u / Math.max(1e-4, start)) ** 0.65 * Math.min(1, (1 - u) / Math.max(1e-4, end)) ** 0.85;
        return body * taper;
    };
}
function buildRibbonPoly(pts, widthAt) {
    const n = pts.length;
    if (n < 2)
        return "";
    const left = [];
    const right = [];
    for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(n - 1, i + 1)];
        const tan = norm(sub(next, prev));
        const nm = [-tan[1], tan[0]];
        const hw = Math.max(0, widthAt(u, i, nm)) * 0.5;
        left.push(add(pts[i], mul(nm, hw)));
        right.push(add(pts[i], mul(nm, -hw)));
    }
    return polyPath([...left, ...right.reverse()]);
}
export function calligraphicRibbon(pts, arg2, arg3, arg4, arg5, arg6) {
    if (pts.length < 2)
        return "";
    // New lijiang pressured-brush signature: (pts, r, baseW, lightBias?, opts?)
    if (typeof arg2 === "function") {
        const r = arg2;
        const baseW = arg3;
        const lightBias = arg4 ?? 0.45;
        const opts = arg5 ?? {};
        const light = opts.lightDir ?? LIGHT;
        const c = opts.center ?? centroid(pts);
        const resampled = pts.length < 10 ? resamplePolyline(catmullSpline(pts, 4), Math.max(6, dist(pts[0], pts[pts.length - 1]) / 18)) : pts;
        // Optional feibai sunlit breathing break (splits into 2 tapered strokes where facing light!)
        if (opts.feibai && resampled.length >= 10) {
            let bestIdx = -1;
            let bestSun = 0.25;
            for (let i = Math.floor(resampled.length * 0.22); i < Math.floor(resampled.length * 0.78); i++) {
                const a = resampled[i - 1];
                const b = resampled[i + 1];
                let nm = norm([-(b[1] - a[1]), b[0] - a[0]]);
                if (dot(nm, sub(resampled[i], c)) < 0)
                    nm = mul(nm, -1);
                const sun = dot(nm, light);
                if (sun > bestSun) {
                    bestSun = sun;
                    bestIdx = i;
                }
            }
            if (bestIdx > 2 && bestIdx < resampled.length - 3) {
                const gap = Math.max(1, Math.min(3, Math.round(resampled.length * 0.05)));
                const segA = resampled.slice(0, bestIdx);
                const segB = resampled.slice(Math.min(resampled.length - 2, bestIdx + gap));
                const pA = brushPressure(r, 0.4, 1.0, opts.swell);
                const pB = brushPressure(r, 0.4, 1.0, opts.swell);
                const wFn = (pFn, seg) => (u, i, nm) => {
                    let outN = nm;
                    if (dot(outN, sub(seg[i], c)) < 0)
                        outN = mul(outN, -1);
                    const shadow = 1 - lightBias * dot(outN, light);
                    return baseW * pFn(u) * clamp(shadow, 0.42, 1.65);
                };
                return buildRibbonPoly(segA, wFn(pA, segA)) + buildRibbonPoly(segB, wFn(pB, segB));
            }
        }
        const pFn = brushPressure(r, 0.42, 1.0, opts.swell);
        return buildRibbonPoly(resampled, (u, i, nm) => {
            let outN = nm;
            if (dot(outN, sub(resampled[i], c)) < 0)
                outN = mul(outN, -1);
            const shadow = 1 - lightBias * dot(outN, light);
            return baseW * pFn(u) * clamp(shadow, 0.42, 1.65);
        });
    }
    // Legacy numeric signature: (pts, wStart, wMid, wEnd, r?, swellPow?)
    const wStart = arg2;
    const wMid = arg3;
    const wEnd = arg4 ?? arg3;
    const r = typeof arg5 === "function" ? arg5 : undefined;
    const swellPow = arg6 ?? 0.72;
    const ph1 = r ? r() * TAU : 0.7;
    const ph2 = r ? r() * TAU : 2.1;
    return buildRibbonPoly(pts, (u) => {
        const endLerp = wStart + (wEnd - wStart) * u;
        const bell = Math.sin(Math.PI * u) ** swellPow;
        const ripple = r ? 1 + 0.14 * Math.sin(u * 7.5 + ph1) + 0.08 * Math.sin(u * 15 + ph2) : 1;
        const raw = (endLerp * (1 - bell) + wMid * bell) * ripple;
        // Allow razor 0px tips when caller requests wStart/wEnd near 0!
        return u === 0 && wStart <= 0.05 ? 0 : u === 1 && wEnd <= 0.05 ? 0 : Math.max(0.05, raw);
    });
}
export function engravingHatch(pts, r, opts = {}) {
    const angle = rad(opts.angle ?? 52);
    const step = opts.step ?? 10;
    const jitter = opts.jitter ?? 0.16;
    const keep = opts.keep ?? 0.92;
    const bow = opts.bow ?? 0.9;
    const minLen = opts.minLen ?? 6;
    const breakLen = opts.breakLen ?? 0;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const rotated = pts.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
    let vMin = Infinity;
    let vMax = -Infinity;
    for (const [, v] of rotated) {
        if (v < vMin)
            vMin = v;
        if (v > vMax)
            vMax = v;
    }
    let d = "";
    let count = 0;
    let v = vMin + step * (0.25 + r() * 0.55);
    while (v < vMax) {
        const xs = spans(rotated, v);
        for (let i = 0; i + 1 < xs.length; i += 2) {
            let u0 = xs[i];
            const u1 = xs[i + 1];
            if (u1 - u0 < minLen)
                continue;
            if (breakLen > 0 && u1 - u0 > breakLen * 1.45) {
                while (u0 < u1 - minLen) {
                    const seg = Math.min(u1 - u0, breakLen * rand(r, 0.5, 1.3));
                    if (r() < keep && seg >= minLen) {
                        d += emitHatchSeg(u0, u0 + seg, v, ca, sa, bow, r);
                        count++;
                    }
                    u0 += seg + breakLen * rand(r, 0.14, 0.42);
                }
            }
            else if (r() < keep) {
                d += emitHatchSeg(u0, u1, v, ca, sa, bow, r);
                count++;
            }
        }
        v += step * rand(r, 1 - jitter, 1 + jitter);
    }
    return { d, count };
}
function emitHatchSeg(u0, u1, v, ca, sa, bow, r) {
    const x0 = u0 * ca - v * sa;
    const y0 = u0 * sa + v * ca;
    const x1 = u1 * ca - v * sa;
    const y1 = u1 * sa + v * ca;
    if (bow > 0.2) {
        const b = rand(r, -bow, bow);
        const xm = (x0 + x1) * 0.5 - sa * b;
        const ym = (y0 + y1) * 0.5 + ca * b;
        return `M${f(x0)} ${f(y0)}Q${f(xm)} ${f(ym)} ${f(x1)} ${f(y1)}`;
    }
    return `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
}
/** Architectural fineliner segment running delicately past corners (alfama/observatory lineage). */
export function handSeg(a, b, r, over = 1.4, bow = 0.6) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const o0 = rand(r, 0.1, 0.85) * over;
    const o1 = rand(r, 0.1, 0.85) * over;
    const sx = a[0] - ux * o0;
    const sy = a[1] - uy * o0;
    const ex = b[0] + ux * o1;
    const ey = b[1] + uy * o1;
    const bw = rand(r, -bow, bow);
    const cx = (sx + ex) * 0.5 - uy * bw;
    const cy = (sy + ey) * 0.5 + ux * bw;
    return `M${f(sx)} ${f(sy)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`;
}
// ---------- Asymmetric Off-Center Portal Cutouts (Replacing Concentric Rings!) ----------
/**
 * Punches an off-center architectural doorway, lancet window, Wardian case, scroll, or natural aperture
 * (`holePts`) cleanly out of widened `BLEED = [-380..2780, -280..1880]` (`fill-rule="evenodd"`).
 */
export function backdropCutoutPath(holePts, smooth = false) {
    const outer = `M${BLEED.x0} ${BLEED.y0}H${BLEED.x1}V${BLEED.y1}H${BLEED.x0}Z`;
    const inner = smooth ? closedSmooth(holePts) : polyPath(holePts);
    return `${outer}${inner}`;
}
export const asymmetricPortalBackdrop = backdropCutoutPath;
/**
 * Generates an asymmetric architectural doorway / Gothic lancet / Roman arch hole polygon
 * guaranteed to strictly enclose `clearBox = requiredPortalClearBox(pCur, pNext)`.
 */
export function archDoorwayHole(clearBox, opts = {}) {
    const padL = opts.padL ?? 14;
    const padR = opts.padR ?? 14;
    const padTop = opts.padTop ?? 10;
    const padBot = opts.padBot ?? 14;
    const xL = opts.sealBox ? Math.max(opts.sealBox.x0 + 6, clearBox.x0 - padL) : clearBox.x0 - padL;
    const xR = opts.sealBox ? Math.min(opts.sealBox.x1 - 6, clearBox.x1 + padR) : clearBox.x1 + padR;
    const yBot = opts.sealBox ? Math.min(opts.sealBox.y1 - 6, clearBox.y1 + padBot) : clearBox.y1 + padBot;
    // Arch spring line sits just above clearBox.y0 so clearBox's top corners stay strictly inside!
    const ySpring = clearBox.y0 - Math.min(padTop * 0.3, 4);
    const halfW = (xR - xL) * 0.5;
    const midX = (xL + xR) * 0.5;
    const defaultRise = opts.pointed ? Math.min(54, halfW * 0.42) : Math.min(46, halfW * 0.36);
    let archRise = opts.archRise ?? defaultRise;
    if (opts.sealBox) {
        archRise = Math.min(archRise, Math.max(14, ySpring - (opts.sealBox.y0 + 6)));
    }
    const yApex = ySpring - archRise;
    const pts = [];
    if (opts.pointed) {
        const leftArch = sample(cubic([xL, ySpring], [xL + halfW * 0.08, yApex + archRise * 0.36], [midX - halfW * 0.34, yApex + archRise * 0.08], [midX, yApex]), 10);
        const rightArch = sample(cubic([midX, yApex], [midX + halfW * 0.34, yApex + archRise * 0.08], [xR - halfW * 0.08, yApex + archRise * 0.36], [xR, ySpring]), 10).slice(1);
        pts.push(...leftArch, ...rightArch);
    }
    else {
        // Semicircular / elliptical Venetian or Roman arch springing at ySpring
        const segs = 20;
        for (let i = 0; i <= segs; i++) {
            const a = Math.PI + (i / segs) * Math.PI; // PI (left) -> 2*PI (right)
            pts.push([midX + Math.cos(a) * halfW, ySpring + Math.sin(a) * archRise]);
        }
    }
    pts.push([xR, yBot], [midX, yBot], [xL, yBot]);
    return pts;
}
/**
 * Generates a crisp rectangular or chamfered architectural window / Wardian case / handscroll / copperplate
 * hole polygon guaranteed to enclose `clearBox`.
 */
export function rectWindowHole(clearBox, opts = {}) {
    const x0 = clearBox.x0 - (opts.padL ?? 14);
    const x1 = clearBox.x1 + (opts.padR ?? 14);
    const y0 = clearBox.y0 - (opts.padTop ?? 14);
    const y1 = clearBox.y1 + (opts.padBot ?? 14);
    const ch = opts.chamfer ?? 0;
    if (ch <= 0.5) {
        return [
            [x0, y0],
            [x1, y0],
            [x1, y1],
            [x0, y1],
        ];
    }
    // Ensure chamfer never cuts inside clearBox corners
    const c = Math.min(ch, Math.min(opts.padL ?? 14, opts.padR ?? 14, opts.padTop ?? 14, opts.padBot ?? 14) * 0.9);
    return [
        [x0 + c, y0],
        [x1 - c, y0],
        [x1, y0 + c],
        [x1, y1 - c],
        [x1 - c, y1],
        [x0 + c, y1],
        [x0, y1 - c],
        [x0, y0 + c],
    ];
}
/**
 * Generates an organic superellipse / squircle opening (dewdrop, lens barrel, cavern arch, tidal sinkhole,
 * porthole, Nautilus chamber mouth, branch sky-fork) mathematically guaranteed to enclose `clearBox`.
 */
export function organicPortalHole(clearBox, r, opts = {}) {
    const n = opts.squircle ?? 3.2; // n=2 is ellipse, n=3.2 is soft organic lens/squircle
    const factor = Math.pow(2, 1 / n); // exact radius multiplier so curve clears rectangle corners!
    const rx = (clearBox.rx + (opts.padX ?? 8)) * factor;
    const ry = (clearBox.ry + (opts.padY ?? 8)) * factor;
    const wobAmp = opts.wobble ?? 0.022;
    const samples = opts.samples ?? 44;
    const wob = wobbleFn(r, wobAmp, [2, 3, 5]);
    const pts = [];
    for (let i = 0; i < samples; i++) {
        const th = (i / samples) * TAU;
        const c = Math.cos(th);
        const s = Math.sin(th);
        const sc = 1 + Math.max(0, wob(i / samples)); // strictly outward wobble preserves clearBox!
        const ux = Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
        const uy = Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
        pts.push([clearBox.cx + rx * ux * sc, clearBox.cy + ry * uy * sc]);
    }
    return pts;
}
// ---------- Legacy Centered Rings (retained for backward compatibility) ----------
export function ellipseRing(samples, rx, ry, tiltRad = 0, cx = STAGE_CX, cy = STAGE_CY) {
    const pts = [];
    const ct = Math.cos(tiltRad);
    const st = Math.sin(tiltRad);
    for (let i = 0; i < samples; i++) {
        const th = (i / samples) * TAU;
        const lx = rx * Math.cos(th);
        const ly = ry * Math.sin(th);
        pts.push([cx + lx * ct - ly * st, cy + lx * st + ly * ct]);
    }
    return pts;
}
export function facetedRing(sides, rx, ry, phaseRad = 0, cx = STAGE_CX, cy = STAGE_CY) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
        const th = phaseRad + (i / sides) * TAU;
        pts.push([cx + Math.cos(th) * rx, cy + Math.sin(th) * ry]);
    }
    return pts;
}
export function radialPortalHole(samples, rxFn, ryFn) {
    const pts = [];
    for (let i = 0; i < samples; i++) {
        const th = (i / samples) * TAU;
        const c = Math.cos(th);
        const s = Math.sin(th);
        const rx = clamp(rxFn(th), 472, 566);
        const ry = clamp(ryFn(th), 322, 374);
        pts.push([STAGE_CX + rx * c, STAGE_CY + ry * s]);
    }
    return pts;
}
export function pointedArchHole(halfW = 492, topDrop = 374, botDrop = 324, shoulder = 0.76) {
    const pts = [];
    const xL = STAGE_CX - halfW;
    const xR = STAGE_CX + halfW;
    const yTop = STAGE_CY - topDrop;
    const yBot = STAGE_CY + botDrop;
    const ySpring = STAGE_CY - topDrop * 0.16;
    const topLeftArch = sample(cubic([xL, ySpring], [xL + halfW * 0.05, yTop + topDrop * (1 - shoulder)], [STAGE_CX - halfW * 0.3, yTop + 18], [STAGE_CX, yTop]), 12);
    const topRightArch = sample(cubic([STAGE_CX, yTop], [STAGE_CX + halfW * 0.3, yTop + 18], [xR - halfW * 0.05, yTop + topDrop * (1 - shoulder)], [xR, ySpring]), 12).slice(1);
    const rightPier = [
        [xR, lerp([xR, ySpring], [xR, yBot], 0.36)[1]],
        [xR, lerp([xR, ySpring], [xR, yBot], 0.74)[1]],
        [xR - 14, yBot],
    ];
    const botSpan = [
        [STAGE_CX + halfW * 0.45, yBot + 6],
        [STAGE_CX, yBot + 8],
        [STAGE_CX - halfW * 0.45, yBot + 6],
        [xL + 14, yBot],
    ];
    const leftPier = [
        [xL, lerp([xL, yBot], [xL, ySpring], 0.26)[1]],
        [xL, lerp([xL, yBot], [xL, ySpring], 0.64)[1]],
    ];
    pts.push(...topLeftArch, ...topRightArch, ...rightPier, ...botSpan, ...leftPier);
    return pts;
}
export function octagonalPortalHole(rx = 528, ry = 362, phaseRad = Math.PI / 8) {
    return facetedRing(8, rx, ry, phaseRad).map(([x, y]) => [
        clamp(x, APERTURE.sealX0 + 6, APERTURE.sealX1 - 6),
        clamp(y, APERTURE.sealY0 + 6, APERTURE.sealY1 - 6),
    ]);
}
export function ellipsePortalHole(samples, rx = 516, ry = 348, tiltRad = 0) {
    return ellipseRing(samples, rx, ry, tiltRad).map(([x, y]) => [
        clamp(x, APERTURE.sealX0 + 8, APERTURE.sealX1 - 8),
        clamp(y, APERTURE.sealY0 + 8, APERTURE.sealY1 - 8),
    ]);
}
/** Legacy alias of `backdropCutoutPath` spanning widened `BLEED`. */
export function sealRingPath(hole, smooth = true) {
    return backdropCutoutPath(hole, smooth);
}
/**
 * Archival Copperplate, Calligraphic & Double-Glaze Painter for one octave scene.
 * Batches non-scaling burin cuts into quantized paths for blazing `< 1.5 ms/frame` Skia paint
 * with razor-fine `0.35-1.25 px` engraving clarity even at `S = 2..4`!
 */
export class Painter {
    id;
    r;
    defs = [];
    out = [];
    buckets = new Map();
    elements = 0;
    strokes = 0;
    animGroups = 0;
    constructor(id, seed) {
        this.id = id;
        this.r = rng(seed);
    }
    gradId(name) {
        return `${this.id}-${name}`;
    }
    linearGrad(name, x1, y1, x2, y2, stops) {
        const id = this.gradId(name);
        const body = stops
            .map(([off, col, op]) => `<stop offset="${Math.round(off * 100)}%" stop-color="${col}"${op !== undefined && op < 1 ? ` stop-opacity="${f(op)}"` : ""}/>`)
            .join("");
        this.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">${body}</linearGradient>`);
        return `url(#${id})`;
    }
    radialGrad(name, cx, cy, radius, stops, fx, fy) {
        const id = this.gradId(name);
        const focus = fx !== undefined && fy !== undefined ? ` fx="${f(fx)}" fy="${f(fy)}"` : "";
        const body = stops
            .map(([off, col, op]) => `<stop offset="${Math.round(off * 100)}%" stop-color="${col}"${op !== undefined && op < 1 ? ` stop-opacity="${f(op)}"` : ""}/>`)
            .join("");
        this.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(radius)}"${focus}>${body}</radialGradient>`);
        return `url(#${id})`;
    }
    /** Registers an even-odd portal cutout `<clipPath>` in `defs` and returns its `url(#id)`. */
    portalClip(holePts, name = "clip", smooth = false) {
        const id = this.gradId(name);
        this.defs.push(`<clipPath id="${id}"><path clip-rule="evenodd" d="${backdropCutoutPath(holePts, smooth)}"/></clipPath>`);
        return `url(#${id})`;
    }
    /** Wraps drawing calls inside an off-center portal cutout `<clipPath>` so nothing can bleed into the opening. */
    clippedToBackdrop(holePts, draw, smooth = false, name = "clip") {
        this.flush();
        const url = this.portalClip(holePts, name, smooth);
        this.out.push(`<g clip-path="${url}">`);
        draw();
        this.flush();
        this.out.push(`</g>`);
    }
    /** Paints an opaque full-bleed asymmetric backdrop with `holePts` punched out cleanly (`evenodd`). */
    asymmetricPortalBackdrop(holePts, fill, opts = {}) {
        this.fillPath(backdropCutoutPath(holePts, opts.smooth ?? false), fill, opts.opacity ?? 1, true);
    }
    fillPath(d, fill, opacity = 1, evenodd = false) {
        if (!d)
            return;
        const op = typeof opacity === "string" ? ` fill-opacity="${opacity}"` : opacity < 0.995 ? ` fill-opacity="${f(opacity)}"` : "";
        const rule = evenodd ? ` fill-rule="evenodd"` : "";
        this.out.push(`<path d="${d}" fill="${fill}"${op}${rule}/>`);
        this.elements++;
    }
    /**
     * Non-scaling copperplate burin stroke (`vector-effect="non-scaling-stroke"`).
     * Remains razor-sharp `0.28-1.35 px` on screen at `S = 1..4` (ZERO bloated cartoon lines!)
     * and smoothly attenuates in deep nested portals (`S < 0.68`) via `--z-burin-op` / `--z-contour-op`.
     */
    burin(d, color = PAL.ink, widthPx = 0.72, opacity = 0.82, count = 1, kind = "hatch", dash) {
        if (!d)
            return;
        const wKey = (Math.round(widthPx * 100) / 100).toFixed(2).replace(/\.?0+$/, "");
        const oKey = typeof opacity === "string" ? opacity : f(opacity);
        const key = `B|${kind}|${color}|${wKey}|${oKey}|${dash ?? ""}`;
        let b = this.buckets.get(key);
        if (!b) {
            b = {
                color,
                width: Number(wKey),
                opacity: typeof opacity === "string" ? -1 : Number(oKey),
                opStr: typeof opacity === "string" ? opacity : undefined,
                cap: "round",
                dash,
                nonScaling: kind,
                parts: [],
            };
            this.buckets.set(key, b);
        }
        b.parts.push(d);
        this.strokes += count;
    }
    /** Convenience shorthand for a structural non-scaling copperplate contour line (stays visible down to S=0.25). */
    burinContour(d, color = PAL.ink, widthPx = 0.95, opacity = 0.86, count = 1, dash) {
        this.burin(d, color, widthPx, opacity, count, "contour", dash);
    }
    /** Standard vector stroke (kept for legacy callers & purposeful world-space ribbons/bars). */
    stroke(d, color, width, opacity = 1, count = 1, cap = "round", dash) {
        if (!d)
            return;
        const wKey = f(width);
        const oKey = typeof opacity === "string" ? opacity : f(opacity);
        const key = `S|${color}|${wKey}|${oKey}|${cap}|${dash ?? ""}`;
        let b = this.buckets.get(key);
        if (!b) {
            b = {
                color,
                width: Number(wKey),
                opacity: typeof opacity === "string" ? -1 : Number(oKey),
                opStr: typeof opacity === "string" ? opacity : undefined,
                cap,
                dash,
                nonScaling: "none",
                parts: [],
            };
            this.buckets.set(key, b);
        }
        b.parts.push(d);
        this.strokes += count;
    }
    flush() {
        for (const b of this.buckets.values()) {
            const op = b.opStr
                ? ` stroke-opacity="${b.opStr}"`
                : b.opacity < 0.995
                    ? ` stroke-opacity="${f(b.opacity)}"`
                    : "";
            const da = b.dash ? ` stroke-dasharray="${b.dash}"` : "";
            if (b.nonScaling !== "none") {
                const cls = b.nonScaling === "contour" ? "burin-c" : "burin";
                const bo = b.opStr
                    ? ` style="--bo:${b.opStr}"`
                    : b.opacity < 0.995
                        ? ` style="--bo:${f(b.opacity)}"`
                        : "";
                this.out.push(`<path class="${cls}" d="${b.parts.join("")}" stroke="${b.color}" stroke-width="${b.width}"${bo}${da} vector-effect="non-scaling-stroke"/>`);
            }
            else {
                this.out.push(`<path d="${b.parts.join("")}" fill="none" stroke="${b.color}" stroke-width="${f(b.width)}"${op}${da} stroke-linecap="${b.cap}" stroke-linejoin="round"/>`);
            }
            this.elements++;
        }
        this.buckets.clear();
    }
    /**
     * Declarative animated SVG group driven by engine.ts with zero DOM queries per frame.
     * Flushes before and after so z-order stays airtight.
     */
    animGroup(spec, draw, extraStyle = "") {
        this.flush();
        const attrs = [`data-anim="${spec.kind}"`];
        if (spec.kind === "rotate") {
            attrs.push(`data-cx="${f(spec.cx)}"`, `data-cy="${f(spec.cy)}"`, `data-amp="${f(spec.speedDeg)}"`, `data-phase="${f(spec.phase ?? 0)}"`);
        }
        else if (spec.kind === "sway") {
            attrs.push(`data-cx="${f(spec.cx)}"`, `data-cy="${f(spec.cy)}"`, `data-amp="${f(spec.ampDeg)}"`, `data-freq="${f(spec.freq)}"`, `data-phase="${f(spec.phase ?? 0)}"`);
        }
        else if (spec.kind === "bob") {
            attrs.push(`data-cx="${f(spec.cx)}"`, `data-cy="${f(spec.cy)}"`, `data-amp="${f(spec.ampY)}"`, `data-amp2="${f(spec.ampDeg ?? 1.4)}"`, `data-freq="${f(spec.freq)}"`, `data-phase="${f(spec.phase ?? 0)}"`);
        }
        else if (spec.kind === "drift") {
            attrs.push(`data-amp="${f(spec.ampX)}"`, `data-amp2="${f(spec.ampY ?? 0)}"`, `data-freq="${f(spec.freq)}"`, `data-phase="${f(spec.phase ?? 0)}"`);
        }
        else if (spec.kind === "ripple") {
            attrs.push(`data-amp="${f(spec.ampX)}"`, `data-base="${f(spec.baseOp ?? 0.68)}"`, `data-amp2="${f(spec.ampOp ?? 0.18)}"`, `data-freq="${f(spec.freq)}"`, `data-phase="${f(spec.phase ?? 0)}"`);
        }
        else if (spec.kind === "pulse") {
            attrs.push(`data-base="${f(spec.baseOp)}"`, `data-amp="${f(spec.ampOp)}"`, `data-freq="${f(spec.freq)}"`, `data-phase="${f(spec.phase ?? 0)}"`);
        }
        const st = extraStyle ? ` style="${extraStyle}"` : "";
        this.out.push(`<g ${attrs.join(" ")}${st}>`);
        draw();
        this.flush();
        this.out.push(`</g>`);
        this.animGroups++;
    }
    /** Wraps a static layer with an optional CSS custom-property opacity (e.g. night stars or halos). */
    layer(opacityVar, draw) {
        this.flush();
        this.out.push(`<g style="opacity:${opacityVar}">`);
        draw();
        this.flush();
        this.out.push(`</g>`);
    }
    // ---------- High-Craft Printmaking & Watercolor Methods ----------
    /** Copperplate burin hatching emitted directly as 3 quantized non-scaling burin bands. */
    burinHatch(polyPts, angleRad, spacing, toneFn, opts = {}) {
        const res = burinHatch(polyPts, angleRad, spacing, toneFn, this.r, opts);
        const col = opts.color ?? PAL.ink;
        const op = opts.opacity ?? 0.72;
        for (const band of res.bands) {
            if (band.count > 0)
                this.burin(band.d, col, band.width, op, band.count, "hatch");
        }
    }
    /** Curled copperplate botanical C/S foliage touches emitted as 3 quantized non-scaling bands. */
    foliageTouches(polyPts, count, scale = 1, opts = {}) {
        const res = foliageTouches(this.r, polyPts, count, scale, opts);
        const col = opts.color ?? PAL.ink;
        const op = opts.opacity ?? 0.74;
        for (const band of res.bands) {
            if (band.count > 0)
                this.burin(band.d, col, band.width, op, band.count, "hatch");
        }
    }
    /** Perspective-spaced copperplate water lines broken around reflection polygons. */
    waterReflections(box, brokenByPolys = [], opts = {}) {
        const res = waterReflections(box, brokenByPolys, this.r, opts);
        const op = opts.opacity ?? 0.62;
        if (res.water)
            this.burin(res.water, opts.color ?? PAL.inkMid, 0.52, op * 0.78, Math.round(res.count * 0.6), "hatch");
        if (res.reflected)
            this.burin(res.reflected, opts.reflectionColor ?? PAL.ink, 0.92, op, Math.round(res.count * 0.4), "hatch");
        if (res.shimmer)
            this.burin(res.shimmer, opts.shimmerColor ?? PAL.waterShimmer, 0.68, "var(--z-moon-op)", 24, "hatch");
    }
    /**
     * Moonlight bevel rim along upper-left facing edges (footers/worlds/glasshouse/gen.ts `Plate.rim()`).
     */
    moonRim(outline, opts = {}) {
        const { color = PAL.litEdge, widthPx = 0.85, opacity = "var(--z-moon-op)", closed = true, up = false, lightDir = LIGHT, threshold = 0.22, } = opts;
        if (outline.length < 2)
            return;
        const pts = resamplePolyline(closed ? [...outline, outline[0]] : outline, 16);
        const c = centroid(outline);
        let d = "";
        let count = 0;
        for (let i = 0; i + 1 < pts.length; i++) {
            const a = pts[i];
            const b = pts[i + 1];
            let nm = norm([-(b[1] - a[1]), b[0] - a[0]]);
            const mid = lerp(a, b, 0.5);
            if (up ? nm[1] > 0 : dot(nm, sub(mid, c)) < 0)
                nm = mul(nm, -1);
            if (dot(nm, lightDir) >= threshold) {
                d += `M${P(a)}L${P(b)}`;
                count++;
            }
        }
        if (count > 0)
            this.burinContour(d, color, widthPx, opacity, count);
    }
    /** Lijiang pressured variable-width calligraphic brush ribbon (zero stroke bloat, 0px nib tips). */
    pressuredRibbon(pts, baseW, color = PAL.ink, opacity = 0.9, lightBias = 0.45, opts = {}) {
        const d = calligraphicRibbon(pts, this.r, baseW, lightBias, opts);
        if (d) {
            this.fillPath(d, color, opacity);
            this.strokes++;
        }
    }
    /** Legacy tapered calligraphic stroke rendered as a filled polygon. */
    calligraphicStroke(pts, wStart, wMid, wEnd, color = PAL.ink, opacity = 0.92, swellPow = 0.72) {
        const d = calligraphicRibbon(pts, wStart, wMid, wEnd, this.r, swellPow);
        if (d) {
            this.fillPath(d, color, opacity);
            this.strokes++;
        }
    }
    /**
     * Shifted Double-Glaze Watercolor + Copperplate Contour (garden/draw/lib.ts `shape()` + `glaze()`).
     * Paints: (1) opaque paper/night knockout base, (2) wobbled off-register translucent watercolor wash,
     * (3) inner pooled `deep` shadow glaze, (4) optional copperplate burin hatching, and (5) split
     * non-scaling directional ink edges (0.55px lit + 1.15px shadow, or pressured calligraphic ribbon).
     */
    doubleGlaze(pts, washColor, deepColor, opts = {}) {
        doubleGlaze(this, pts, washColor, deepColor, opts);
    }
    /**
     * Directional hand-inked outline using crisp non-scaling copperplate contours (`burinContour`)
     * so outlines NEVER bloat into chunky cartoon borders at S=2..4!
     */
    directionalInk(pts, opts = {}) {
        const n = pts.length;
        if (n < 2)
            return;
        const isClosed = opts.closed ?? true;
        const c = opts.from ?? centroid(pts);
        const light = opts.lightDir ?? LIGHT;
        // Clamp non-scaling widths into archival copperplate range [0.35..1.45 px]
        const thinW = clamp((opts.thin ?? 1.1) * 0.52, 0.35, 0.95);
        const thickW = clamp((opts.thick ?? 2.2) * 0.54, 0.65, 1.45);
        const op = opts.opacity ?? 0.86;
        const color = opts.color ?? PAL.ink;
        const litColor = opts.litColor ?? (color === PAL.ink ? PAL.litEdge : color);
        const segCount = isClosed ? n : n - 1;
        let thinD = "";
        let thickD = "";
        let thinN = 0;
        let thickN = 0;
        for (let i = 0; i < segCount; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % n];
            let nm = norm([-(b[1] - a[1]), b[0] - a[0]]);
            if (dot(nm, sub(lerp(a, b, 0.5), c)) < 0)
                nm = mul(nm, -1);
            const seg = opts.hand !== false ? handSeg(a, b, this.r, thinW * 0.9, 0.55) : `M${P(a)}L${P(b)}`;
            if (dot(nm, light) < -0.1) {
                thickD += seg;
                thickN++;
            }
            else {
                thinD += seg;
                thinN++;
            }
        }
        if (thinN > 0)
            this.burinContour(thinD, litColor, thinW, op * 0.68, thinN);
        if (thickN > 0)
            this.burinContour(thickD, color, thickW, op, thickN);
    }
    /**
     * Translucent off-register mineral watercolor wash (garden/draw/lib.ts `glaze` lineage).
     */
    glazedWash(pts, fill, opts = {}) {
        if (pts.length < 3)
            return;
        const basePts = opts.wobble ? wobblePoly(pts, this.r, opts.wobble) : pts;
        const dBase = opts.smooth ? closedSmooth(basePts) : polyPath(basePts);
        this.fillPath(dBase, fill, opts.baseOp ?? 1);
        const c = centroid(pts);
        const gOp = opts.glazeOp ?? 0.26;
        if (opts.darkFill) {
            const sh = [rand(this.r, 2.2, 5.5), rand(this.r, 2.8, 6.5)];
            const gPts = glazePoly(pts, this.r, { k: 0.76, about: add(c, sh), shift: sh, amp: 0.048 });
            this.fillPath(closedSmooth(gPts), opts.darkFill, gOp);
        }
        if (opts.lightFill) {
            const sh = [rand(this.r, -5.5, -1.8), rand(this.r, -6.5, -2.0)];
            const gPts = glazePoly(pts, this.r, { k: 0.66, about: add(c, sh), shift: sh, amp: 0.04 });
            this.fillPath(closedSmooth(gPts), opts.lightFill, gOp * 0.78);
        }
    }
    /**
     * Complete archival ink-and-watercolor solid upgraded with non-scaling copperplate burin hatching
     * & non-scaling directional contours!
     */
    watercolorSolid(pts, opts) {
        if (pts.length < 3)
            return;
        this.glazedWash(pts, opts.fill, {
            baseOp: opts.opacity ?? 1,
            darkFill: opts.glazeDark,
            lightFill: opts.glazeLight,
            glazeOp: opts.glazeOpacity ?? 0.24,
            smooth: opts.smooth,
            wobble: opts.wobble,
        });
        if (opts.hatchColor) {
            const h = engravingHatch(pts, this.r, {
                angle: opts.hatchAngle ?? 52,
                step: opts.hatchStep ?? 11,
                keep: opts.hatchKeep ?? 0.88,
                breakLen: opts.hatchBreak ?? 0,
            });
            if (h.count > 0) {
                const wPx = clamp((opts.hatchWidth ?? 1.2) * 0.56, 0.35, 1.1);
                this.burin(h.d, opts.hatchColor, wPx, opts.hatchOpacity ?? 0.42, h.count, "hatch");
            }
        }
        if (opts.crossColor) {
            const ch = engravingHatch(pts, this.r, {
                angle: opts.crossAngle ?? (opts.hatchAngle ?? 52) + 62,
                step: opts.crossStep ?? (opts.hatchStep ?? 11) * 1.45,
                keep: 0.65,
                breakLen: 88,
            });
            if (ch.count > 0) {
                const wPx = clamp((opts.hatchWidth ?? 1.2) * 0.48, 0.32, 0.95);
                this.burin(ch.d, opts.crossColor, wPx, opts.crossOpacity ?? 0.32, ch.count, "hatch");
            }
        }
        if (opts.ink) {
            this.directionalInk(pts, {
                color: opts.ink,
                litColor: opts.litInk ?? opts.ink,
                thin: opts.inkThin ?? 1.15,
                thick: opts.inkThick ?? 2.25,
                opacity: opts.inkOpacity ?? 0.86,
                lightDir: opts.lightDir,
            });
        }
        if (opts.flush !== false)
            this.flush();
    }
    /** Batched fine copperplate stipple dots inside any polygon (non-scaling pecks). */
    stippleField(pts, count, color, radiusPx = 1.15, opacity = 0.58) {
        let x0 = Infinity;
        let x1 = -Infinity;
        let y0 = Infinity;
        let y1 = -Infinity;
        for (const [x, y] of pts) {
            if (x < x0)
                x0 = x;
            if (x > x1)
                x1 = x;
            if (y < y0)
                y0 = y;
            if (y > y1)
                y1 = y;
        }
        let d = "";
        let placed = 0;
        let guard = count * 5;
        while (placed < count && guard-- > 0) {
            const p = [rand(this.r, x0, x1), rand(this.r, y0, y1)];
            if (pointInPoly(p, pts)) {
                d += `M${P(p)}h0.2`;
                placed++;
            }
        }
        if (placed > 0)
            this.burin(d, color, clamp(radiusPx * 0.65, 0.45, 1.4), opacity, placed, "hatch");
    }
    /** 3D golden-angle foreshortened botanical rosette (garden/draw/rosette.ts lineage!). */
    rosette3D(opts) {
        rosette3D(this, opts);
    }
    /** Gnarled barked bough with overlapping fork necks, bark fissures & moonlit upper rim (never bare sticks!). */
    gnarledBough(opts) {
        return gnarledBough(this, opts);
    }
    /** @kiuzyx-grade oblique/isometric architectural facade grid in 3-4 batched <path>s! */
    archFacadeGrid(polyOrBox, cols, rows, opts) {
        archFacadeGrid(this, polyOrBox, cols, rows, opts);
    }
    /** @claudeai-grade outline-free layered gouache / dry-brush stippled foliage crowns (3-4 batched <path>s)! */
    dryBrushFoliage(clusters, palette, opts) {
        dryBrushFoliage(this, this.r, clusters, palette, opts);
    }
    /** @claudeai / glasshouse horizontal broken-stroke water reflections & shimmer dashes (perspective-capable)! */
    brokenWaterReflections(boxOrQuad, colors, opts) {
        brokenWaterReflections(this, this.r, boxOrQuad, colors, opts);
    }
    /** @kiuzyx / @claudeai tiny 10-22px 2-tone human scale figures with slanted ground cast shadows! */
    scaleFigures(placements, opts) {
        scaleFigures(this, this.r, placements, opts);
    }
    /**
     * Organic tapering bark/stem/timber limb with non-scaling bark fissures and pressured ribbons.
     */
    barkLimb(spine, w0, w1, opts = {}) {
        const n = spine.length;
        const left = [];
        const right = [];
        const normals = [];
        const widths = [];
        for (let i = 0; i < n; i++) {
            const t = i / (n - 1);
            const prev = spine[Math.max(0, i - 1)];
            const next = spine[Math.min(n - 1, i + 1)];
            const tan = norm(sub(next, prev));
            const nm = [-tan[1], tan[0]];
            const knot = 1 + 0.08 * Math.sin(t * 11 + 0.5);
            const w = (w0 + (w1 - w0) * t) * 0.5 * knot;
            normals.push(nm);
            widths.push(w);
            left.push(add(spine[i], mul(nm, w)));
            right.push(add(spine[i], mul(nm, -w)));
        }
        const bodyPts = [...left, ...[...right].reverse()];
        this.fillPath(closedSmooth(bodyPts), PAL.paper, 0.98);
        this.fillPath(closedSmooth(bodyPts), opts.fill ?? PAL.umber, 0.9);
        // Shadow side glaze
        const midSpine = spine.map((p, i) => add(p, mul(normals[i], -widths[i] * 0.08)));
        this.fillPath(closedSmooth([...midSpine, ...[...right].reverse()]), opts.shadeFill ?? PAL.umberDk, 0.44);
        // Lit upper highlight glaze
        const hiIn = spine.map((p, i) => add(p, mul(normals[i], widths[i] * 0.34)));
        const hiOut = spine.map((p, i) => add(p, mul(normals[i], widths[i] * 0.84)));
        this.fillPath(closedSmooth([...hiOut, ...[...hiIn].reverse()]), opts.litFill ?? PAL.paperWarm, 0.22);
        // Fine non-scaling fissured bark grain cuts
        const gCount = opts.grainCount ?? 10;
        const gCol = opts.grainColor ?? PAL.inkSepia;
        let grainD = "";
        for (let g = 0; g < gCount; g++) {
            const u = -0.78 + (g / Math.max(1, gCount - 1)) * 1.56 + rand(this.r, -0.05, 0.05);
            const i0 = Math.floor(rand(this.r, 0, n * 0.25));
            const i1 = Math.min(n - 1, Math.floor(rand(this.r, n * 0.65, n)));
            if (i1 - i0 < 2)
                continue;
            const gPts = [];
            for (let i = i0; i <= i1; i++) {
                const uu = clamp(u + Math.sin(i * 0.7 + g) * 0.12, -0.88, 0.88);
                gPts.push(add(spine[i], mul(normals[i], widths[i] * uu)));
            }
            grainD += linePath(gPts);
        }
        this.burin(grainD, gCol, 0.65, 0.56, gCount, "hatch");
        // Subtle moonlit upper-left non-scaling edge + pressured calligraphic shadow flank
        const ink = opts.ink ?? PAL.ink;
        this.burinContour(linePath(left), PAL.litEdge, 0.65, 0.68, 1);
        this.pressuredRibbon(right, Math.min(3.2, Math.max(1.2, w0 * 0.08)), ink, 0.9, 0.35);
        this.flush();
        return { left, right, normals, widths };
    }
    /**
     * Glowing multi-layered archival lantern / gas-lamp with wrought cap, non-scaling mullions & zero-filter halo!
     */
    hangingLantern(opts) {
        const { cx, cy, w, h, cordLen, style = "gas" } = opts;
        const pivotY = cy - cordLen;
        this.animGroup({
            kind: "sway",
            cx,
            cy: pivotY,
            ampDeg: opts.swayAmp ?? 2.4,
            freq: opts.freq ?? 1.15,
            phase: opts.phase ?? rand(this.r, 0, TAU),
        }, () => {
            this.layer("var(--z-halo-op)", () => {
                this.animGroup({ kind: "pulse", baseOp: 0.88, ampOp: 0.12, freq: 2.2, phase: (opts.phase ?? 0) + 1.1 }, () => {
                    const hy = cy + h * 0.48;
                    this.fillPath(circlePath(cx, hy, w * 2.9), PAL.lanternHalo, 0.07);
                    this.fillPath(circlePath(cx, hy, w * 2.2), PAL.lanternHalo, 0.11);
                    this.fillPath(circlePath(cx, hy, w * 1.6), PAL.lantern, 0.16);
                    this.fillPath(circlePath(cx, hy, w * 1.12), PAL.lantern, 0.24);
                    this.fillPath(circlePath(cx, hy, w * 0.72), PAL.lanternCore, 0.34);
                });
            });
            this.burinContour(`M${f(cx)} ${f(pivotY)}L${f(cx)} ${f(cy - h * 0.16)}`, PAL.ink, 1.05, 0.85, 1);
            if (style === "palace") {
                const rx = w * 0.56;
                const ry = h * 0.52;
                const midY = cy + ry;
                this.fillPath(polyPath([[cx - w * 0.34, cy - 4], [cx + w * 0.34, cy - 4], [cx + w * 0.28, cy + 8], [cx - w * 0.28, cy + 8]]), PAL.umberDk);
                this.fillPath(polyPath([[cx - w * 0.28, cy + h - 8], [cx + w * 0.28, cy + h - 8], [cx + w * 0.32, cy + h + 4], [cx - w * 0.32, cy + h + 4]]), PAL.umberDk);
                this.fillPath(ellipsePath(cx, midY, rx, ry), PAL.lantern, 0.92);
                this.fillPath(ellipsePath(cx, midY, rx * 0.62, ry * 0.72), PAL.lanternCore, 0.72);
                let ribs = "";
                for (const k of [-0.62, -0.25, 0.25, 0.62]) {
                    ribs += `M${f(cx + w * 0.22 * k)} ${f(cy + 6)}Q${f(cx + rx * 1.12 * k)} ${f(midY)} ${f(cx + w * 0.22 * k)} ${f(cy + h - 6)}`;
                }
                this.burinContour(ribs, PAL.cinnabarDk, 0.68, 0.68, 4);
                this.burinContour(ellipsePath(cx, midY, rx, ry), PAL.ink, 0.95, 0.85, 1);
                this.burinContour(`M${f(cx)} ${f(cy + h + 4)}L${f(cx)} ${f(cy + h + 32)}M${f(cx - 5)} ${f(cy + h + 16)}L${f(cx - 7)} ${f(cy + h + 30)}M${f(cx + 5)} ${f(cy + h + 16)}L${f(cx + 7)} ${f(cy + h + 30)}`, PAL.cinnabar, 0.9, 0.84, 3);
            }
            else if (style === "astrolabe") {
                const R = w * 0.64;
                const midY = cy + R;
                this.fillPath(circlePath(cx, midY, R * 0.34), PAL.lanternCore, 0.92);
                this.burinContour(circlePath(cx, midY, R), PAL.brass, 1.35, 0.95, 1);
                this.burinContour(circlePath(cx, midY, R * 0.82), PAL.ink, 0.78, 0.8, 1);
                this.burinContour(ellipsePath(cx, midY, R * 0.96, R * 0.42), PAL.brassLt, 0.95, 0.88, 1);
                this.burinContour(ellipsePath(cx, midY, R * 0.42, R * 0.96), PAL.brass, 0.85, 0.82, 1);
                this.burin(`M${f(cx - R)} ${f(midY)}H${f(cx + R)}M${f(cx)} ${f(midY - R)}V${f(midY + R)}`, PAL.inkHair, 0.55, 0.7, 2);
                this.fillPath(polyPath([[cx - 6, midY + R], [cx + 6, midY + R], [cx, midY + R + 24]]), PAL.brassDk);
            }
            else {
                const topW = w * 0.56;
                const botW = w * 0.36;
                const bodyPts = [
                    [cx - topW, cy + 12],
                    [cx + topW, cy + 12],
                    [cx + botW, cy + h],
                    [cx - botW, cy + h],
                ];
                const capPts = [
                    [cx, cy - 22],
                    [cx + topW * 0.42, cy - 4],
                    [cx + topW * 1.24, cy + 12],
                    [cx - topW * 1.24, cy + 12],
                    [cx - topW * 0.42, cy - 4],
                ];
                this.fillPath(polyPath(bodyPts), PAL.lantern, 0.92);
                this.fillPath(ellipsePath(cx, cy + h * 0.54, botW * 0.72, h * 0.28), PAL.lanternCore, 0.84);
                this.fillPath(polyPath(capPts), PAL.slateDk);
                this.fillPath(polyPath([[cx - botW * 0.9, cy + h], [cx + botW * 0.9, cy + h], [cx, cy + h + 16]]), PAL.slateDk);
                let bars = polyPath(bodyPts) + polyPath(capPts);
                bars += `M${f(cx - topW * 0.34)} ${f(cy + 12)}L${f(cx - botW * 0.34)} ${f(cy + h)}`;
                bars += `M${f(cx + topW * 0.34)} ${f(cy + 12)}L${f(cx + botW * 0.34)} ${f(cy + h)}`;
                bars += `M${f(cx - (topW + botW) * 0.48)} ${f(cy + h * 0.56)}H${f(cx + (topW + botW) * 0.48)}`;
                this.burinContour(bars, PAL.ink, 0.95, 0.9, 6);
            }
        });
    }
    /** Calligraphic wrought-iron S-scroll & botanical volute bracket (filled tapered ribbons). */
    wroughtScrollwork(origin, end, flip = 1, scale = 1, color = PAL.ink) {
        const dx = end[0] - origin[0];
        const dy = end[1] - origin[1];
        const main = sample(cubic(origin, [origin[0] + dx * 0.34, origin[1] - 42 * scale * flip], [origin[0] + dx * 0.72, end[1] - 32 * scale * flip], end), 16);
        this.calligraphicStroke(main, 4.4 * scale, 3.0 * scale, 1.4 * scale, color, 0.92);
        const c0 = lerp(origin, end, 0.22);
        const spiral1 = [];
        for (let i = 0; i <= 14; i++) {
            const t = i / 14;
            const ang = -Math.PI * 0.5 + t * TAU * 1.15 * flip;
            const radR = 30 * (1 - t * 0.76) * scale;
            spiral1.push([c0[0] + dx * 0.14 + Math.cos(ang) * radR, c0[1] + 24 * scale * flip + Math.sin(ang) * radR]);
        }
        this.calligraphicStroke(spiral1, 2.8 * scale, 1.9 * scale, 0.3 * scale, color, 0.88);
        const c1 = lerp(origin, end, 0.76);
        const spiral2 = [];
        for (let i = 0; i <= 12; i++) {
            const t = i / 12;
            const ang = Math.PI * 0.5 - t * TAU * 0.95 * flip;
            const radR = 20 * (1 - t * 0.74) * scale;
            spiral2.push([c1[0] + Math.cos(ang) * radR, c1[1] - 14 * scale * flip + Math.sin(ang) * radR]);
        }
        this.calligraphicStroke(spiral2, 2.0 * scale, 1.3 * scale, 0.25 * scale, color, 0.85);
        this.flush();
    }
    /** Archival multi-mullion window with crisp non-scaling glazing bars, carved stone sill & night glow. */
    archivalWindow(opts) {
        const { x, y, w, h, cols = 2, rows = 3, arched = false, lit = false } = opts;
        const archR = arched ? w * 0.5 : 0;
        const bodyTop = y + archR;
        const winPath = arched
            ? `M${f(x)} ${f(y + h)}V${f(bodyTop)}A${f(archR)} ${f(archR)} 0 0 1 ${f(x + w)} ${f(bodyTop)}V${f(y + h)}Z`
            : `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
        this.fillPath(winPath, lit ? PAL.windowLit : PAL.windowDim, lit ? 0.92 : 0.82);
        if (lit) {
            this.fillPath(polyPath([
                [x + w * 0.14, bodyTop + h * 0.1],
                [x + w * 0.86, bodyTop + h * 0.1],
                [x + w * 0.86, y + h * 0.86],
                [x + w * 0.14, y + h * 0.86],
            ]), PAL.lanternCore, "var(--z-halo-op)");
        }
        else {
            // Fine level glasshouse glazing lines
            let glassLines = "";
            for (let gy = bodyTop + 9; gy < y + h - 6; gy += 11) {
                glassLines += `M${f(x + 3)} ${f(gy)}H${f(x + w - 3)}`;
            }
            this.burin(glassLines, PAL.inkRim, 0.42, 0.26, 8, "hatch");
        }
        let muntins = "";
        for (let c = 1; c < cols; c++) {
            const mx = x + (w * c) / cols;
            muntins += `M${f(mx)} ${f(arched ? y + archR * 0.22 : y)}V${f(y + h)}`;
        }
        for (let r = 1; r < rows; r++) {
            const my = bodyTop + ((y + h - bodyTop) * r) / rows;
            muntins += `M${f(x)} ${f(my)}H${f(x + w)}`;
        }
        if (arched) {
            const acx = x + w * 0.5;
            const acy = bodyTop;
            muntins += `M${f(x)} ${f(bodyTop)}H${f(x + w)}`;
            for (const deg of [35, 70, 110, 145]) {
                const a = -rad(deg);
                muntins += `M${f(acx)} ${f(acy)}L${f(acx + Math.cos(a) * archR)} ${f(acy + Math.sin(a) * archR)}`;
            }
        }
        this.burinContour(muntins, PAL.ink, 0.72, 0.82, cols + rows + 3);
        this.burinContour(winPath, PAL.ink, 1.05, 0.9, 1);
        this.fillPath(polyPath([[x - 6, y + h], [x + w + 6, y + h], [x + w + 4, y + h + 8], [x - 4, y + h + 8]]), PAL.paperStone);
        this.burinContour(`M${f(x - 6)} ${f(y + h)}H${f(x + w + 6)}M${f(x - 4)} ${f(y + h + 8)}H${f(x + w + 4)}`, PAL.ink, 0.82, 0.85, 2);
        if (!arched) {
            this.fillPath(polyPath([[x - 7, y - 9], [x + w + 7, y - 9], [x + w + 4, y], [x - 4, y]]), PAL.paperDeep);
            this.burinContour(`M${f(x - 7)} ${f(y - 9)}H${f(x + w + 7)}M${f(x - 4)} ${f(y)}H${f(x + w + 4)}`, PAL.ink, 0.85, 0.86, 2);
        }
        if (opts.shutterColor) {
            const sw = w * 0.34;
            for (const sx of [x - sw - 2, x + w + 2]) {
                const sp = [[sx, bodyTop], [sx + sw, bodyTop], [sx + sw, y + h], [sx, y + h]];
                this.fillPath(polyPath(sp), opts.shutterColor, 0.88);
                let slats = polyPath(sp);
                for (let sy = bodyTop + 8; sy < y + h - 4; sy += 7.5) {
                    slats += `M${f(sx + 2)} ${f(sy)}H${f(sx + sw - 2)}`;
                }
                this.burin(slats, PAL.ink, 0.58, 0.72, 10, "hatch");
            }
        }
        if (opts.balcony) {
            const bx0 = x - 8;
            const bx1 = x + w + 8;
            const by0 = y + h - 22;
            const by1 = y + h + 2;
            let rail = `M${f(bx0)} ${f(by0)}H${f(bx1)}M${f(bx0)} ${f(by1)}H${f(bx1)}`;
            const bars = Math.max(4, Math.round((bx1 - bx0) / 11));
            for (let i = 0; i <= bars; i++) {
                const bx = bx0 + ((bx1 - bx0) * i) / bars;
                rail += `M${f(bx)} ${f(by0)}V${f(by1)}`;
            }
            this.burinContour(rail, PAL.ink, 0.82, 0.88, bars + 3);
        }
    }
    /** Individual scalloped copperplate roof tile courses clipped cleanly inside a roof polygon. */
    scallopedRoofTiles(pts, tileW = 24, tileH = 16, color = PAL.ink, opacity = 0.58) {
        let y0 = Infinity;
        let y1 = -Infinity;
        for (const [, y] of pts) {
            if (y < y0)
                y0 = y;
            if (y > y1)
                y1 = y;
        }
        let d = "";
        let count = 0;
        let row = 0;
        for (let y = y0 + tileH; y < y1 - 2; y += tileH) {
            const xs = spans(pts, y);
            const offset = (row++ % 2) * tileW * 0.5;
            for (let i = 0; i + 1 < xs.length; i += 2) {
                const sx = Math.floor((xs[i] - offset) / tileW) * tileW + offset;
                for (let x = sx; x < xs[i + 1] - tileW * 0.35; x += tileW) {
                    const xa = Math.max(xs[i], x);
                    const xb = Math.min(xs[i + 1], x + tileW);
                    if (xb - xa < tileW * 0.45)
                        continue;
                    const xm = (xa + xb) * 0.5;
                    d += `M${f(xa)} ${f(y - tileH * 0.18)}Q${f(xm)} ${f(y + tileH * 0.44)} ${f(xb)} ${f(y - tileH * 0.18)}`;
                    count++;
                }
            }
        }
        if (count > 0)
            this.burin(d, color, 0.68, opacity, count, "hatch");
    }
    /** Precision horological spur gear with non-scaling technical burin engraving (observatory lineage!). */
    spurGear(opts) {
        const { cx, cy, r, teeth, spokes = 6, fill = PAL.brass, rimFill = PAL.brassLt, ink = PAL.ink } = opts;
        const depth = r * 0.14;
        const rootR = r - depth;
        const innerR = rootR * 0.72;
        const hubR = r * 0.24;
        const toothPts = [];
        const step = TAU / teeth;
        for (let k = 0; k < teeth; k++) {
            const a = k * step;
            for (const [da, rr] of [
                [-0.28, rootR],
                [-0.14, r],
                [0.14, r],
                [0.28, rootR],
            ]) {
                toothPts.push([cx + Math.cos(a + da * step) * rr, cy + Math.sin(a + da * step) * rr]);
            }
        }
        const outerD = polyPath(toothPts);
        const holeD = circlePath(cx, cy, innerR);
        this.fillPath(outerD + holeD, fill, 0.94, true);
        this.fillPath(circlePath(cx, cy, rootR * 0.95) + circlePath(cx, cy, innerR * 1.06), rimFill, 0.34, true);
        for (let k = 0; k < spokes; k++) {
            const a = (k * TAU) / spokes + 0.15;
            const nx = -Math.sin(a);
            const ny = Math.cos(a);
            const wIn = Math.max(4, r * 0.085);
            const wOut = Math.max(2.6, r * 0.055);
            const p0 = [cx + Math.cos(a) * hubR, cy + Math.sin(a) * hubR];
            const p1 = [cx + Math.cos(a) * (innerR + 4), cy + Math.sin(a) * (innerR + 4)];
            const spPts = [
                [p0[0] + nx * wIn, p0[1] + ny * wIn],
                [p1[0] + nx * wOut, p1[1] + ny * wOut],
                [p1[0] - nx * wOut, p1[1] - ny * wOut],
                [p0[0] - nx * wIn, p0[1] - ny * wIn],
            ];
            this.fillPath(polyPath(spPts), fill, 0.94);
            this.burinContour(polyPath(spPts), ink, 0.78, 0.85, 4);
        }
        this.fillPath(circlePath(cx, cy, hubR) + circlePath(cx, cy, hubR * 0.44), rimFill, 0.95, true);
        this.burinContour(outerD + holeD + circlePath(cx, cy, hubR) + circlePath(cx, cy, hubR * 0.44), ink, 0.92, 0.9, 4);
        if (opts.pitch !== false) {
            this.burin(circlePath(cx, cy, r - depth * 0.48), PAL.inkHair, 0.55, 0.58, 1, "hatch", "6 4");
        }
        this.flush();
    }
    /** Engraved astronomical brass degree ring with hair-fine non-scaling vernier ticks. */
    brassDegreeRing(opts) {
        const { cx, cy, rOuter, rInner, tickCount = 72, majorEvery = 6, fill = PAL.brass, bevelFill = PAL.brassLt, ink = PAL.ink } = opts;
        this.fillPath(circlePath(cx, cy, rOuter) + circlePath(cx, cy, rInner), fill, 0.9, true);
        const rMid = (rOuter + rInner) * 0.5;
        this.fillPath(circlePath(cx, cy, rOuter - 4) + circlePath(cx, cy, rMid), bevelFill, 0.34, true);
        let minorD = "";
        let majorD = "";
        let minorN = 0;
        let majorN = 0;
        for (let i = 0; i < tickCount; i++) {
            const a = (i / tickCount) * TAU;
            const ca = Math.cos(a);
            const sa = Math.sin(a);
            const isMajor = i % majorEvery === 0;
            const tIn = isMajor ? rInner + 2 : rInner + (rOuter - rInner) * 0.42;
            const tOut = rOuter - 2;
            const seg = `M${f(cx + ca * tIn)} ${f(cy + sa * tIn)}L${f(cx + ca * tOut)} ${f(cy + sa * tOut)}`;
            if (isMajor) {
                majorD += seg;
                majorN++;
            }
            else {
                minorD += seg;
                minorN++;
            }
        }
        this.burin(minorD, ink, 0.52, 0.68, minorN, "hatch");
        this.burinContour(majorD, ink, 0.95, 0.9, majorN);
        this.burinContour(circlePath(cx, cy, rOuter) + circlePath(cx, cy, rInner), ink, 1.02, 0.92, 2);
        this.burin(circlePath(cx, cy, rMid), PAL.inkHair, 0.48, 0.58, 1, "hatch", "10 4 2 4");
        this.flush();
    }
    // ---------- Garden-Caliber Procedural Botanical Builders ----------
    veinedFern(opts) {
        const { origin, dir, len, maxW, pairs = 11, bend = 0.24, fill = PAL.sage, shadeFill = PAL.sageDk, veinColor = PAL.vein, } = opts;
        const ctrl = add(origin, polar(len * 0.52, dir + bend * 0.7));
        const tip = add(origin, polar(len, dir + bend));
        const spine = sample(quad(origin, ctrl, tip), 18);
        this.calligraphicStroke(spine, 4.4, 2.6, 0.2, PAL.ink, 0.88);
        let veinD = "";
        let thinInk = "";
        let thickInk = "";
        for (let i = 1; i <= pairs; i++) {
            const t = 0.1 + (i / (pairs + 0.5)) * 0.86;
            const idx = Math.min(spine.length - 2, Math.floor(t * (spine.length - 1)));
            const base = lerp(spine[idx], spine[idx + 1], t * (spine.length - 1) - idx);
            const tan = norm(sub(spine[Math.min(spine.length - 1, idx + 1)], spine[Math.max(0, idx - 1)]));
            const baseAngle = Math.atan2(tan[1], tan[0]);
            const env = Math.sin(t * Math.PI) ** 0.72;
            const pLen = maxW * env * rand(this.r, 0.9, 1.08);
            const pWid = Math.max(4.5, pLen * 0.24);
            for (const side of [-1, 1]) {
                const a = baseAngle + side * (rad(54) - t * rad(18)) + rand(this.r, -0.05, 0.05);
                const mid = add(base, polar(pLen * 0.52, a + side * 0.08));
                const end = add(base, polar(pLen, a + side * 0.14));
                const nm = polar(pWid, a + side * Math.PI * 0.5);
                const leafPts = [
                    base,
                    add(lerp(base, mid, 0.6), mul(nm, 0.78)),
                    add(mid, mul(nm, 0.92)),
                    end,
                    sub(mid, mul(nm, 0.42)),
                    sub(lerp(base, mid, 0.55), mul(nm, 0.46)),
                ];
                this.fillPath(closedSmooth(leafPts), PAL.paper, 0.96);
                this.fillPath(closedSmooth(glazePoly(leafPts, this.r, { shift: [1.2, 1.5], amp: 0.03 })), i % 2 === 0 ? fill : PAL.celadon, 0.82);
                this.fillPath(closedSmooth([base, mid, end, sub(mid, mul(nm, 0.38))]), shadeFill, 0.3);
                veinD += `M${P(base)}Q${P(mid)} ${P(end)}`;
                thinInk += linePath([base, leafPts[1], leafPts[2], end]);
                thickInk += linePath([base, leafPts[5], leafPts[4], end]);
            }
        }
        this.burin(veinD, veinColor, 0.52, 0.72, pairs * 2, "hatch");
        this.burinContour(thinInk, PAL.litEdge, 0.5, 0.65, pairs * 2);
        this.burinContour(thickInk, PAL.ink, 0.98, 0.86, pairs * 2);
        this.flush();
    }
    monsteraBlade(opts) {
        const { origin, dir, len, tilt = 0.86, fill = PAL.sage, deepFill = PAL.sageDk, veinColor = PAL.vein } = opts;
        const toW = (p) => add(origin, rot([p[0], p[1] * tilt], dir));
        const cx = 0.46 * len;
        const M = (phi, s) => [
            cx + 0.56 * len * Math.cos(phi),
            -s * 0.48 * len * Math.sin(phi) * (1 - 0.06 * Math.sin(phi * 3)),
        ];
        let ribsD = "";
        for (const s of [1, -1]) {
            const n = 5;
            const veins = [];
            for (let i = 0; i < n; i++) {
                veins.push({
                    m: [0.05 * len + (i / (n - 1)) * 0.74 * len, 0],
                    phi: 2.62 - (i / (n - 1)) * 2.24 + rand(this.r, -0.05, 0.05),
                    split: i > 0 && i < n - 1,
                });
            }
            const bounds = [{ m: [0, 0], phi: Math.PI, split: false }, ...veins, { m: veins[n - 1].m, phi: 0, split: false }];
            const delta = 0.065;
            for (let k = 0; k < bounds.length - 1; k++) {
                const A = bounds[k];
                const B = bounds[k + 1];
                const a0 = A.split ? A.phi - delta : A.phi;
                const b0 = B.split ? B.phi + delta : B.phi;
                const edge = (from, phi) => {
                    const end = M(phi, s);
                    const ctrl = [from[0] + (end[0] - from[0]) * 0.35 + 0.04 * len, from[1] + (end[1] - from[1]) * 0.62];
                    return sample(quad(from, ctrl, end), 5);
                };
                const ea = edge(A.m, a0);
                const eb = edge(B.m, b0).reverse();
                const arc = [];
                for (let j = 1; j < 5; j++)
                    arc.push(M(a0 + ((b0 - a0) * j) / 5, s));
                const world = [...ea, ...arc, ...eb.slice(0, -1)].map(toW);
                this.doubleGlaze(world, s > 0 ? fill : PAL.celadonDk, deepFill, {
                    smooth: true,
                    washOpacity: 0.84,
                    deepOpacity: 0.34,
                    thinPx: 0.55,
                    thickPx: 1.15,
                    flush: false,
                });
            }
            for (const v of veins) {
                const end = M(v.phi, s);
                const ctrl = [v.m[0] + (end[0] - v.m[0]) * 0.38 + 0.04 * len, v.m[1] + (end[1] - v.m[1]) * 0.6];
                ribsD += `M${P(toW(v.m))}Q${P(toW(ctrl))} ${P(toW(lerp(v.m, end, 0.72)))}`;
            }
        }
        this.burin(ribsD, veinColor, 0.68, 0.78, 10, "hatch");
        this.calligraphicStroke([toW([-len * 0.04, 0]), toW([len * 0.45, 0]), toW([cx + 0.52 * len, 0])], 3.8, 2.6, 0.3, veinColor, 0.9);
        this.flush();
    }
    ginkgoFan(origin, dir, R, fill = PAL.ochreLt) {
        const half = rad(58 + rand(this.r, 0, 12));
        const notch = 0.22 + rand(this.r, 0, 0.1);
        const ph = rand(this.r, 0, TAU);
        const rim = (a) => R * (0.96 + 0.04 * Math.cos(3 * a + ph)) * (1 - notch * Math.exp(-((a / 0.16) ** 2)));
        const toW = (p) => add(origin, rot(p, dir));
        const arc = [];
        for (let k = 0; k <= 6; k++) {
            const a = -half + (half - 0.12) * (k / 6);
            arc.push(polar(rim(a), a));
        }
        arc.push(polar(rim(0), 0));
        for (let k = 6; k >= 0; k--) {
            const a = half - (half - 0.12) * (k / 6);
            arc.push(polar(rim(a), a));
        }
        const pts = [[0, 0], ...arc].map(toW);
        this.doubleGlaze(pts, fill, PAL.ochre, {
            smooth: true,
            washOpacity: 0.86,
            deepOpacity: 0.34,
            deepAbout: toW([R * 0.3, 0]),
            thinPx: 0.5,
            thickPx: 1.0,
            flush: false,
        });
        let veins = "";
        const addVein = (a0, r0, a, lvl) => {
            const r1 = rim(a) * [0.52, 0.78, 0.93][lvl];
            veins += `M${P(toW(polar(r0, a0)))}Q${P(toW(polar((r0 + r1) * 0.5, (a0 + a) * 0.5)))} ${P(toW(polar(r1, a)))}`;
            if (lvl < 2) {
                for (const d of [-1, 1])
                    addVein(a, r1, a + (d * half) / 2 ** (lvl + 3), lvl + 1);
            }
        };
        for (const a of [-0.72, -0.24, 0.24, 0.72])
            addVein(a * half, 3, a * half, 0);
        this.burin(veins, PAL.vein, 0.45, 0.58, 24, "hatch");
    }
    wisteriaRaceme(origin, len, maxW, lean = 0.08) {
        const tip = [origin[0] + len * lean, origin[1] + len];
        const ctrl = [origin[0] + len * lean * 0.35, origin[1] + len * 0.52];
        const spine = sample(quad(origin, ctrl, tip), 14);
        this.calligraphicStroke(spine, 2.6, 1.8, 0.25, PAL.sageDk, 0.85);
        const rows = Math.max(7, Math.round(len / 20));
        for (let i = 0; i < rows; i++) {
            const t = 0.06 + (i / rows) * 0.92;
            const idx = Math.min(spine.length - 2, Math.floor(t * (spine.length - 1)));
            const p = lerp(spine[idx], spine[idx + 1], t * (spine.length - 1) - idx);
            const env = (1 - t * 0.78) * Math.min(1, t * 4.5);
            const count = Math.max(1, Math.round(3.6 * env));
            for (let k = 0; k < count; k++) {
                const dx = (k - (count - 1) * 0.5) * maxW * 0.42 * env + rand(this.r, -4, 4);
                const dy = rand(this.r, -3, 5);
                const bx = p[0] + dx;
                const by = p[1] + dy;
                const rx = (6.5 + rand(this.r, 0, 3.5)) * (0.55 + env * 0.55);
                const ry = rx * 1.38;
                const tone = t > 0.68 ? PAL.wisteriaDk : k % 2 === 0 ? PAL.wisteriaLt : PAL.wisteria;
                const fPts = [
                    [bx, by - ry * 0.82],
                    [bx + rx * 0.95, by - ry * 0.15],
                    [bx + rx * 0.55, by + ry * 0.85],
                    [bx - rx * 0.55, by + ry * 0.85],
                    [bx - rx * 0.95, by - ry * 0.15],
                ];
                this.fillPath(closedSmooth(fPts), PAL.paper, 0.94);
                this.fillPath(closedSmooth(glazePoly(fPts, this.r, { shift: [1.0, 1.3], amp: 0.04 })), tone, 0.82);
                this.fillPath(ellipsePath(bx, by + ry * 0.25, rx * 0.45, ry * 0.42), PAL.paperWarm, 0.34);
                this.burinContour(closedSmooth(fPts), PAL.ink, 0.55, 0.66, 1);
            }
        }
        this.flush();
    }
    lotusBlossom(cx, cy, radius, petalFill = PAL.petal, flushFill = PAL.petalBlush) {
        const outerN = 10;
        const innerN = 7;
        for (let i = 0; i < outerN; i++) {
            const a = (i / outerN) * TAU + rand(this.r, -0.04, 0.04);
            const len = radius * rand(this.r, 0.94, 1.06);
            const wid = radius * 0.3;
            const toW = (p) => add([cx, cy], rot(p, a));
            const pts = [
                toW([radius * 0.1, 0]),
                toW([len * 0.34, -wid * 0.86]),
                toW([len * 0.68, -wid * 0.72]),
                toW([len, 0]),
                toW([len * 0.68, wid * 0.72]),
                toW([len * 0.34, wid * 0.86]),
            ];
            this.fillPath(closedSmooth(pts), petalFill, 0.99);
            this.fillPath(closedSmooth(glazePoly(pts, this.r, { k: 0.72, about: toW([len * 0.72, 0]), shift: [1.2, 1.4], amp: 0.04 })), flushFill, 0.28);
            let vD = `M${P(toW([radius * 0.16, 0]))}L${P(toW([len * 0.86, 0]))}`;
            vD += `M${P(toW([radius * 0.22, 0]))}Q${P(toW([len * 0.48, -wid * 0.44]))} ${P(toW([len * 0.78, -wid * 0.18]))}`;
            vD += `M${P(toW([radius * 0.22, 0]))}Q${P(toW([len * 0.48, wid * 0.44]))} ${P(toW([len * 0.78, wid * 0.18]))}`;
            this.burin(vD, PAL.cinnabarDk, 0.42, 0.38, 3, "hatch");
            this.burinContour(closedSmooth(pts), PAL.ink, 0.68, 0.78, 1);
            const lowerEdge = sample(quad(pts[0], pts[5], pts[3]), 6);
            this.calligraphicStroke(lowerEdge, 0.1, 1.6, 0.1, PAL.ink, 0.72);
            this.flush();
        }
        for (let i = 0; i < innerN; i++) {
            const a = ((i + 0.5) / innerN) * TAU;
            const len = radius * 0.68;
            const wid = radius * 0.25;
            const toW = (p) => add([cx, cy], rot(p, a));
            const pts = [
                toW([radius * 0.08, 0]),
                toW([len * 0.44, -wid]),
                toW([len * 0.78, -wid * 0.58]),
                toW([len, 0]),
                toW([len * 0.78, wid * 0.58]),
                toW([len * 0.44, wid]),
            ];
            this.fillPath(closedSmooth(pts), petalFill, 0.99);
            this.fillPath(closedSmooth(glazePoly(pts, this.r, { k: 0.7, about: toW([len * 0.7, 0]), shift: [1.0, 1.2], amp: 0.04 })), flushFill, 0.32);
            this.burin(`M${P(toW([radius * 0.14, 0]))}L${P(toW([len * 0.82, 0]))}`, PAL.cinnabarDk, 0.42, 0.4, 1, "hatch");
            this.burinContour(closedSmooth(pts), PAL.ink, 0.62, 0.8, 1);
            this.flush();
        }
        let filD = "";
        let antD = "";
        const stamN = 22;
        for (let i = 0; i < stamN; i++) {
            const a = (i / stamN) * TAU + rand(this.r, -0.06, 0.06);
            const r0 = radius * 0.15;
            const r1 = radius * rand(this.r, 0.29, 0.4);
            const p0 = [cx + Math.cos(a) * r0, cy + Math.sin(a) * r0];
            const p1 = [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1];
            filD += `M${P(p0)}L${P(p1)}`;
            antD += `M${P(p1)}h0.2`;
        }
        this.burin(filD, PAL.ochreDk, 0.52, 0.76, stamN, "hatch");
        this.burinContour(antD, PAL.brassLt, 1.4, 0.94, stamN);
        this.fillPath(circlePath(cx, cy, radius * 0.17), PAL.ochre, 0.96);
        this.burinContour(circlePath(cx, cy, radius * 0.17), PAL.ink, 0.75, 0.84, 1);
        this.stippleField(ellipseRing(12, radius * 0.13, radius * 0.13, 0, cx, cy), 9, PAL.ink, 1.1, 0.74);
        this.flush();
    }
    /** True lijiang blue-green karst peak with ledges, pressured ribbons, lotus-leaf cun veins & moss dabs. */
    karstPeak(opts) {
        karstPeak(this, opts);
    }
    /** Calligraphic scholar's cliff pine (lijiang lineage!). */
    inkPine(x, y, sc = 1, leanDir = 1) {
        const h = 56 * sc;
        const d = leanDir;
        const trunk = [
            [x, y + 6 * sc],
            [x - 8 * d * sc, y - h * 0.28],
            [x + 12 * d * sc, y - h * 0.64],
            [x + 6 * d * sc, y - h],
        ];
        const trunkPts = sample(cubic(trunk[0], trunk[1], trunk[2], trunk[3]), 10);
        this.calligraphicStroke(trunkPts, 5.4 * sc, 3.4 * sc, 0.9 * sc, PAL.barkDk, 0.95);
        this.burinContour(linePath(trunkPts), PAL.litEdge, 0.55, 0.48, 1);
        const bough1 = sample(quad([x - 2 * d * sc, y - h * 0.48], [x + 18 * d * sc, y - h * 0.44], [x + 34 * d * sc, y - h * 0.56]), 8);
        const bough2 = sample(quad([x + 6 * d * sc, y - h * 0.74], [x - 14 * d * sc, y - h * 0.78], [x - 26 * d * sc, y - h * 0.84]), 8);
        this.calligraphicStroke(bough1, 3.0 * sc, 1.9 * sc, 0.4 * sc, PAL.barkDk, 0.92);
        this.calligraphicStroke(bough2, 2.4 * sc, 1.5 * sc, 0.35 * sc, PAL.barkDk, 0.9);
        const pads = [
            [x + 30 * d * sc, y - h * 0.58, 26 * sc, 10 * sc],
            [x - 22 * d * sc, y - h * 0.85, 22 * sc, 9 * sc],
            [x + 8 * d * sc, y - h * 1.02, 28 * sc, 11 * sc],
            [x - 4 * d * sc, y - h * 0.72, 18 * sc, 8 * sc],
        ];
        let needles = "";
        for (const [px, py, rx, ry] of pads) {
            const tuft = [
                [px - rx, py + ry * 0.3],
                [px - rx * 0.65, py - ry * 0.75],
                [px - rx * 0.18, py - ry * 0.42],
                [px + rx * 0.12, py - ry * 1.02],
                [px + rx * 0.62, py - ry * 0.68],
                [px + rx, py + ry * 0.25],
                [px + rx * 0.4, py + ry * 0.46],
                [px - rx * 0.4, py + ry * 0.46],
            ];
            this.fillPath(closedSmooth(tuft), PAL.sageDk, 0.92);
            this.fillPath(ellipsePath(px - rx * 0.15, py - ry * 0.28, rx * 0.58, ry * 0.44), PAL.celadon, 0.36);
            this.burinContour(closedSmooth(tuft), PAL.ink, 0.62, 0.78, 1);
            for (let k = -3; k <= 3; k++) {
                const nx0 = px + k * rx * 0.24;
                const ny0 = py + ry * 0.22;
                needles += `M${f(nx0)} ${f(ny0)}L${f(nx0 + k * 2.2 * sc)} ${f(ny0 - ry * 1.15)}`;
            }
        }
        this.burin(needles, PAL.ink, 0.52, 0.64, 28, "hatch");
    }
}
// ---------- Standalone Master Primitives (garden / lijiang / glasshouse) ----------
/**
 * Shifted Double-Glaze Watercolor (garden/draw/lib.ts `shape()` + `glaze()`).
 * 1. Opaque knockout (`PAL.paper`) prevents muddy bleed from back planes.
 * 2. Wobbled translucent outer watercolor wash shifted `[+1.8, +2.2]`.
 * 3. Pooled inner `deep` shadow glaze (`k = 0.65, amp = 0.05`).
 * 4. Optional copperplate burin hatching (`toneFn`).
 * 5. Split directional non-scaling ink edges (`0.55px` lit + `1.15px` shadow, or pressured `ribbon`).
 */
export function doubleGlaze(p, pts, washColor, deepColor, opts = {}) {
    if (pts.length < 3)
        return;
    const smooth = opts.smooth ?? true;
    const basePath = smooth ? closedSmooth(pts) : polyPath(pts);
    // 1. Opaque paper/night knockout so overlapping foliage/stone never muddies
    if (opts.knockout !== false) {
        p.fillPath(basePath, opts.knockout ?? PAL.paper, opts.knockoutOpacity ?? 0.98);
    }
    // 2. Wobbled outer translucent watercolor wash shifted off-register
    const washPts = glazePoly(pts, p.r, {
        k: 1.0,
        shift: opts.washShift ?? [1.8, 2.2],
        amp: opts.washAmp ?? 0.032,
    });
    p.fillPath(smooth ? closedSmooth(washPts) : polyPath(washPts), washColor, opts.washOpacity ?? 0.78);
    // 3. Pooled inner deep watercolor glaze pulled slightly toward lower-right shadow side
    const c = centroid(pts);
    const deepAbout = opts.deepAbout ?? add(c, [4, 5]);
    const deepPts = glazePoly(pts, p.r, {
        k: opts.deepK ?? 0.65,
        about: deepAbout,
        shift: opts.deepShift ?? [1.2, 2.2],
        amp: opts.deepAmp ?? 0.052,
    });
    p.fillPath(smooth ? closedSmooth(deepPts) : polyPath(deepPts), deepColor, opts.deepOpacity ?? 0.38);
    // 4. Optional non-scaling copperplate burin hatching
    if (opts.toneFn) {
        p.burinHatch(pts, opts.hatchAngleRad ?? rad(52), opts.hatchSpacing ?? 10, opts.toneFn, {
            color: opts.hatchColor ?? PAL.ink,
            opacity: opts.hatchOpacity ?? 0.64,
            cross: opts.cross,
        });
    }
    // 5. Split directional ink contours (non-scaling hair-fine lit + heavier shadow / calligraphic ribbon)
    if (opts.ink !== false) {
        const light = opts.lightDir ?? LIGHT;
        const inkColor = opts.inkColor ?? PAL.ink;
        const litColor = opts.litColor ?? (inkColor === PAL.ink ? PAL.litEdge : inkColor);
        const thinPx = opts.thinPx ?? 0.55;
        const thickPx = opts.thickPx ?? 1.15;
        const op = opts.inkOpacity ?? 0.86;
        const n = pts.length;
        const runs = [];
        for (let i = 0; i < n; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % n];
            let nm = norm([-(b[1] - a[1]), b[0] - a[0]]);
            if (dot(nm, sub(lerp(a, b, 0.5), c)) < 0)
                nm = mul(nm, -1);
            const heavy = dot(nm, light) < -0.1;
            const last = runs[runs.length - 1];
            if (last && last.heavy === heavy)
                last.pts.push(b);
            else
                runs.push({ heavy, pts: [a, b] });
        }
        let thinD = "";
        let thickD = "";
        let thinN = 0;
        let thickN = 0;
        for (const run of runs) {
            if (run.heavy && opts.ribbonInk && run.pts.length >= 3) {
                p.pressuredRibbon(run.pts, thickPx * 2.1, inkColor, op, 0.35, { center: c, lightDir: light });
            }
            else {
                const d = smooth && run.pts.length > 2 ? linePath(run.pts) : openPoly(run.pts);
                if (run.heavy) {
                    thickD += d;
                    thickN++;
                }
                else {
                    thinD += d;
                    thinN++;
                }
            }
        }
        if (thinN > 0)
            p.burinContour(thinD, litColor, thinPx, op * 0.68, thinN);
        if (thickN > 0)
            p.burinContour(thickD, inkColor, thickPx, op, thickN);
    }
    if (opts.flush)
        p.flush();
}
const oblanceolateBlade = (s) => Math.max(0.16 * (1 - s), (Math.pow(s, 0.9) * Math.pow(Math.max(0, 1 - s), 0.6)) / 0.364);
/**
 * 3D Golden-Angle (`137.5°`) Foreshortened Botanical Rosette drawn far-to-near (garden/draw/rosette.ts!).
 * Renders Agave, Echeveria, Aeonium, or lotus-crown rosettes with true 3D depth sorting,
 * double-glaze watercolor blades, hair-fine midribs, and optional sunlit sheen.
 */
export function rosette3D(p, opts) {
    const { cx, cy, radius, count = 26, viewDeg = 16, fill = PAL.celadon, deepFill = PAL.sageDk, youngFill = PAL.celadonLt, dyingFill = PAL.ochre, veinColor = PAL.vein, shine = true, bladeShape = oblanceolateBlade, } = opts;
    const view = rad(viewDeg);
    const cv = Math.cos(view);
    const sv = Math.sin(view);
    const onPage = (q) => [cx + q[0], cy - (q[1] * cv - q[2] * sv)];
    const nearness = (q) => q[2] * cv + q[1] * sv;
    const leaves = [];
    for (let k = 0; k < count; k++) {
        const t = k / Math.max(1, count - 1);
        const az = k * rad(137.5) + rand(p.r, -0.1, 0.1);
        const kind = t < 0.16 ? "dying" : t > 0.78 ? "young" : "spread";
        const u = kind === "dying" ? t / 0.16 : kind === "young" ? (t - 0.78) / 0.22 : (t - 0.16) / 0.62;
        const el = kind === "dying"
            ? -0.25 + 0.18 * u
            : kind === "young"
                ? 0.68 + 0.65 * u
                : 0.04 + 0.56 * u;
        const L = radius *
            (kind === "dying" ? 0.9 : kind === "young" ? 0.58 - 0.24 * u : 0.98 - 0.22 * u) *
            rand(p.r, 0.92, 1.08);
        const W = kind === "dying" ? 0.26 : kind === "young" ? 0.34 : 0.3;
        const curl = kind === "dying" ? -0.22 : kind === "young" ? 0.14 : rand(p.r, 0.12, 0.36);
        const N = 8;
        const mid = [[0, 0, 0]];
        for (let i = 1; i <= N; i++) {
            const e = el + curl * ((i - 0.5) / N);
            const [x, y, z] = mid[i - 1];
            mid.push([
                x + (L / N) * Math.cos(e) * Math.cos(az),
                y + (L / N) * Math.sin(e),
                z + (L / N) * Math.cos(e) * Math.sin(az),
            ]);
        }
        const page = mid.map(onPage);
        const face = Math.max(0.42, Math.hypot(Math.sin(az), Math.cos(az) * sv));
        const A = [];
        const B = [];
        for (let i = 0; i <= N; i++) {
            const tan = norm(sub(page[Math.min(N, i + 1)], page[Math.max(0, i - 1)]));
            const hw = ((W * L) / 2) * face * bladeShape(i / N);
            A.push(add(page[i], mul([-tan[1], tan[0]], hw)));
            B.push(add(page[i], mul([tan[1], -tan[0]], hw)));
        }
        const near = nearness(mid[N >> 1]);
        const wash = kind === "dying" ? dyingFill : kind === "young" ? youngFill : near > 0 ? fill : PAL.sage;
        const deep = kind === "dying" ? PAL.umber : deepFill;
        leaves.push({
            outline: [...A, ...B.reverse()],
            rib: page,
            near,
            wash,
            deep,
            hasShine: shine && kind !== "dying" && near > 0 && el < 0.72,
        });
    }
    // Painter's depth order: strictly far-to-near!
    leaves.sort((a, b) => a.near - b.near);
    for (const lf of leaves) {
        doubleGlaze(p, lf.outline, lf.wash, lf.deep, {
            smooth: true,
            washOpacity: 0.84,
            deepK: 0.56,
            deepAbout: lf.rib[2],
            deepOpacity: 0.36,
            thinPx: 0.48,
            thickPx: 0.98,
        });
        if (lf.hasShine) {
            const seg = lf.rib.slice(2, 6);
            if (seg.length >= 3) {
                const hi = [...seg.map((pt, i) => add(pt, [0, -2 - Math.sin((i / (seg.length - 1)) * Math.PI) * 3])), ...[...seg].reverse()];
                p.fillPath(closedSmooth(hi), PAL.paperWarm, 0.28);
            }
        }
        p.burin(linePath(lf.rib.slice(1, -1)), veinColor, 0.42, 0.55, 1, "hatch");
        p.flush();
    }
}
const KARST_KINDS = {
    tower: [[2.6, 3.8], [0.34, 0.46]],
    dome: [[1.8, 2.6], [0.45, 0.6]],
    cone: [[1.35, 1.75], [0.6, 0.72]],
};
/**
 * Blue-Green Li River Karst Peak (direct port of footers/worlds/lijiang/gen.ts `Peak`!).
 * Features steep limestone ledges, dual flank wobbles, optional cut facets, ochre->malachite->azurite
 * mineral glazes, pressured calligraphic silhouette with sunlit *feibai* gap, downward `lotusVeins`
 * ribbons, dry non-scaling `cun` slope strokes, clustered ridge `mossDots`, and summit scholar pines.
 */
export function karstPeak(p, opts) {
    const { cx, baseY, w, h, lean = rand(p.r, -0.1, 0.1), kind = "tower", facets = 0, fill, shadeFill, glowFill = PAL.ochreLt, veinCount = 6, cunDensity = 0.85, mossCount = 16, pines = 2, } = opts;
    const [[p0, p1], [q0, q1]] = KARST_KINDS[kind];
    const powP = rand(p.r, p0, p1);
    const powQ = rand(p.r, q0, q1);
    const wobL = [0, 1].map(() => [rand(p.r, 0, TAU), rand(p.r, 1.5, 4.5), rand(p.r, 0.02, 0.065)]);
    const wobR = [0, 1].map(() => [rand(p.r, 0, TAU), rand(p.r, 1.5, 4.5), rand(p.r, 0.02, 0.065)]);
    const ledgesL = [];
    const ledgesR = [];
    for (let i = 0; i < 2; i++) {
        const arr = p.r() < 0.5 ? ledgesL : ledgesR;
        arr.push([rand(p.r, 0.18, 0.75), rand(p.r, 0.06, 0.18), rand(p.r, 0.04, 0.09)]);
    }
    const hw = (t0, side) => {
        const t = clamp(t0, 0, 1);
        const shape = Math.pow(Math.max(0, 1 - Math.pow(t, powP)), powQ);
        const calm = Math.pow(1 - t, 0.6);
        const wArr = side < 0 ? wobL : wobR;
        const lArr = side < 0 ? ledgesL : ledgesR;
        let wob = 0;
        for (const [ph, k, a] of wArr)
            wob += a * Math.sin(t * k * Math.PI + ph);
        let ledge = 0;
        for (const [at, a, s] of lArr)
            ledge += a * Math.exp(-(((t - at) / s) ** 2));
        return (w * 0.5) * shape * (1 + (wob + ledge) * calm);
    };
    const at = (t, side, frac = 1) => [
        cx + lean * h * t * (2 - t) + side * hw(t, side) * frac,
        baseY - h * t,
    ];
    let left;
    let right;
    if (facets > 0) {
        left = Array.from({ length: facets + 1 }, (_, i) => {
            const [x, y] = at(i / facets, -1);
            return [x + rand(p.r, -0.04, 0.04) * w, y + rand(p.r, -0.02, 0.02) * h];
        });
        right = Array.from({ length: facets + 1 }, (_, i) => {
            const [x, y] = at(i / facets, 1);
            return [x + rand(p.r, -0.04, 0.04) * w, y + rand(p.r, -0.02, 0.02) * h];
        }).reverse();
    }
    else {
        left = sample((t) => at(t, -1), 18);
        right = sample((t) => at(t, 1), 18).reverse();
    }
    const outline = [...left, ...right.slice(1)];
    const bodyD = facets > 0 ? polyPath(outline) : closedSmooth(outline);
    // 1. Opaque knockout + ochre underlayer + main blue-green mineral wash
    p.fillPath(bodyD, PAL.paper, 0.99);
    p.fillPath(bodyD, fill, 0.9);
    // 2. Shadowed right flank mineral band (malachite/azurite depth) + warm sunlit left rim
    const shadeBand = [...sample((t) => at(t, 1, 0.99), 12), ...sample((t) => at(t, 1, 0.28), 12).reverse()];
    p.fillPath(closedSmooth(shadeBand), shadeFill, 0.48);
    const deepCrest = [...sample((t) => at(t, 1, 0.99), 10), ...sample((t) => at(t, 1, 0.72), 10).reverse()];
    p.fillPath(closedSmooth(deepCrest), PAL.prussianDk, 0.26);
    const litBand = [...sample((t) => at(t, -1, 0.96), 10), ...sample((t) => at(t, -1, 0.56), 10).reverse()];
    p.fillPath(closedSmooth(litBand), glowFill, 0.24);
    // 3. Pressured variable-width calligraphic ink contour (heavier on right shadow flank, feibai on lit crest)
    const scaleFactor = clamp(w / 220, 0.65, 1.5);
    p.pressuredRibbon(left.slice(2), 2.2 * scaleFactor, PAL.ink, 0.78, 0.35, { feibai: true });
    p.pressuredRibbon(right.slice(0, -2), 4.2 * scaleFactor, PAL.ink, 0.92, 0.55);
    // 4. Downward lotus-leaf `cun` texture veins running from summit down flanks
    for (let i = 0; i < veinCount; i++) {
        const side = i < veinCount * 0.66 ? 1 : -1;
        const frac = side > 0 ? rand(p.r, 0.2, 0.86) : rand(p.r, 0.44, 0.85);
        const t0 = side > 0 ? rand(p.r, 0.12, 0.42) : rand(p.r, 0.3, 0.58);
        const t1 = rand(p.r, 0.78, 0.95);
        const seg = sample((u) => at(t1 - u * (t1 - t0), side, frac), 9);
        p.pressuredRibbon(seg, (side > 0 ? 2.4 : 1.5) * scaleFactor, PAL.inkSepia, 0.58, 0.25, { swell: [0.08, 0.5] });
    }
    // 5. Short dry non-scaling `cun` slope strokes between veins
    if (cunDensity > 0) {
        const cunN = Math.min(48, Math.max(4, Math.round((cunDensity * w * h) / 3800)));
        let cunD = "";
        for (let i = 0; i < cunN; i++) {
            const side = p.r() < 0.74 ? 1 : -1;
            const t = rand(p.r, 0.14, 0.82);
            const frac = side > 0 ? rand(p.r, 0.36, 0.94) : rand(p.r, 0.58, 0.92);
            const len = rand(p.r, 0.06, 0.13);
            const a0 = at(t, side, frac);
            const a1 = at(Math.max(0.03, t - len * 0.5), side, frac);
            const a2 = at(Math.max(0.02, t - len), side, frac);
            cunD += `M${P(a0)}Q${f(a1[0] + rand(p.r, -2, 2))} ${f(a1[1])} ${P(a2)}`;
        }
        p.burin(cunD, PAL.inkSepia, 0.58, 0.54, cunN, "hatch");
    }
    // 6. Clustered horizontal ridge moss dots (non-scaling calligraphic dabs)
    if (mossCount > 0) {
        let mossD = "";
        let mN = 0;
        for (let i = 0; i < mossCount; i++) {
            const side = p.r() < 0.5 ? -1 : 1;
            const t = p.r() < 0.7 ? rand(p.r, 0.58, 0.98) : rand(p.r, 0.26, 0.58);
            const pt = at(t, side, rand(p.r, 0.8, 0.98));
            for (let k = 0; k < 3; k++) {
                mossD += `M${f(pt[0] + rand(p.r, -9, 9))} ${f(pt[1] + rand(p.r, -5, 5))}h${f(rand(p.r, 2.2, 5.8))}`;
                mN++;
            }
        }
        p.burinContour(mossD, PAL.sageDk, 1.35, 0.8, mN);
    }
    // 7. Subtle moonlit upper-left rim at night
    p.moonRim(left, { closed: false, up: true, widthPx: 0.78 });
    // 8. Optional crooked summit scholar pines
    for (let k = 0; k < pines; k++) {
        const pt = at(k === 0 ? rand(p.r, 0.88, 0.97) : rand(p.r, 0.64, 0.86), k % 2 === 0 ? -1 : 1, rand(p.r, 0.32, 0.8));
        p.inkPine(pt[0], pt[1], rand(p.r, 0.68, 1.08), k % 2 === 0 ? 1 : -1);
    }
    p.flush();
}
/**
 * Gnarled tapering barked bough with overlapping fork necks, double-glaze bark washes,
 * non-scaling burin bark fissures, moonlit upper rim & shadowed calligraphic underside (never bare sticks!).
 * Returns all branch tips so callers can attach Ginkgo spurs, blossom clusters, or foliage pads directly to forks.
 */
export function gnarledBough(p, opts) {
    const { spine: rawSpine, w0, w1, fill = PAL.bark, shadeFill = PAL.barkDk, litFill = PAL.ochreLt, ink = PAL.ink, fissures = 12, forks = [], } = opts;
    const spine = rawSpine.length < 8 ? resamplePolyline(catmullSpline(rawSpine, 5), 24) : [...rawSpine];
    const n = spine.length;
    const tips = [spine[n - 1]];
    const drawLimbBody = (pts, wa, wb, fisCount) => {
        const m = pts.length;
        const left = [];
        const right = [];
        const normals = [];
        const widths = [];
        for (let i = 0; i < m; i++) {
            const t = i / (m - 1);
            const prev = pts[Math.max(0, i - 1)];
            const next = pts[Math.min(m - 1, i + 1)];
            const tan = norm(sub(next, prev));
            const nm = [-tan[1], tan[0]];
            // Gnarled elbow knots & natural taper
            const knot = 1 + 0.1 * Math.sin(t * 13.5 + wa * 0.1) + 0.05 * Math.cos(t * 23);
            const hw = (wa + (wb - wa) * Math.pow(t, 0.82)) * 0.5 * knot;
            normals.push(nm);
            widths.push(hw);
            left.push(add(pts[i], mul(nm, hw)));
            right.push(add(pts[i], mul(nm, -hw)));
        }
        const bodyPts = [...left, ...[...right].reverse()];
        const bodyD = closedSmooth(bodyPts);
        // Opaque knockout + shifted bark double-glaze
        p.fillPath(bodyD, PAL.paper, 0.99);
        p.fillPath(closedSmooth(glazePoly(bodyPts, p.r, { shift: [1.4, 1.8], amp: 0.025 })), fill, 0.9);
        // Shadowed underside band
        const midShade = pts.map((pt, i) => add(pt, mul(normals[i], -widths[i] * 0.1)));
        p.fillPath(closedSmooth([...midShade, ...[...right].reverse()]), shadeFill, 0.52);
        // Sunlit upper bark ridge
        const hiIn = pts.map((pt, i) => add(pt, mul(normals[i], widths[i] * 0.35)));
        const hiOut = pts.map((pt, i) => add(pt, mul(normals[i], widths[i] * 0.86)));
        p.fillPath(closedSmooth([...hiOut, ...[...hiIn].reverse()]), litFill, 0.22);
        // Longitudinal non-scaling burin bark fissures + cross-knot flicks
        let grainD = "";
        for (let g = 0; g < fisCount; g++) {
            const u = -0.76 + (g / Math.max(1, fisCount - 1)) * 1.52 + rand(p.r, -0.05, 0.05);
            const i0 = Math.floor(rand(p.r, 0, m * 0.28));
            const i1 = Math.min(m - 1, Math.floor(rand(p.r, m * 0.62, m)));
            if (i1 - i0 < 2)
                continue;
            const gPts = [];
            for (let i = i0; i <= i1; i++) {
                const uu = clamp(u + Math.sin(i * 0.85 + g) * 0.14, -0.88, 0.88);
                gPts.push(add(pts[i], mul(normals[i], widths[i] * uu)));
            }
            grainD += linePath(gPts);
        }
        p.burin(grainD, PAL.inkSepia, 0.62, 0.6, fisCount, "hatch");
        // Moonlit thin upper edge + pressured calligraphic shadow flank
        p.burinContour(linePath(left), PAL.litEdge, 0.62, 0.72, 1);
        p.pressuredRibbon(right, clamp(wa * 0.09, 1.3, 3.6), ink, 0.92, 0.45);
    };
    // Draw main trunk/bough first
    drawLimbBody(spine, w0, w1, fissures);
    // Draw forked sub-branches WITH physical overlapping neck inside parent core (zero disconnected sticks!)
    for (const fk of forks) {
        const idx = clamp(Math.round(fk.t * (n - 1)), 1, n - 2);
        const parentPt = spine[idx];
        const parentW = w0 + (w1 - w0) * Math.pow(fk.t, 0.82);
        const fkW0 = parentW * (fk.wScale ?? 0.62);
        const fkW1 = fk.wEnd ?? Math.max(3.2, fkW0 * 0.24);
        // Start slightly inside parent spine so the collar fuses organically
        const prevPt = spine[Math.max(0, idx - 1)];
        const anchor = lerp(prevPt, parentPt, 0.65);
        const ctrl = fk.ctrl ?? add(lerp(anchor, fk.tip, 0.52), [rand(p.r, -28, 28), rand(p.r, -24, 24)]);
        const subSpine = sample(quad(anchor, ctrl, fk.tip), 10);
        drawLimbBody(subSpine, fkW0, fkW1, Math.max(4, Math.round(fissures * 0.55)));
        tips.push(fk.tip);
    }
    p.flush();
    return { tips, spine };
}
/**
 * Procedurally generates `@kiuzyx`-grade oblique/isometric architectural curtain walls, limestone towers,
 * red-brick lofts, and 2 AM Tokyo apartment high-rises in ONLY 4-5 batched `<path>` elements!
 * Supports both `[tl, tr, br, bl]` isometric quads AND `{ x, y, w, h }` boxes.
 */
export function archFacadeGrid(p, polyOrBox, cols, rows, opts = {}) {
    const quadPts = Array.isArray(polyOrBox)
        ? polyOrBox
        : (() => {
            const b = polyOrBox;
            return [
                [b.x, b.y],
                [b.x + b.w, b.y],
                [b.x + b.w, b.y + b.h],
                [b.x, b.y + b.h],
            ];
        })();
    const [tl, tr, br, bl] = quadPts;
    const wallFill = opts.wallFill ?? PAL.paperStone;
    const glassFill = opts.glassFill ?? PAL.windowDim;
    const tintFill = opts.tintFill ?? PAL.glassTint;
    const litFill = opts.litFill ?? PAL.windowLit;
    const litChance = opts.litChance ?? 0.24;
    const insetU = opts.insetU ?? 0.17;
    const insetV = opts.insetV ?? 0.19;
    const marginU = opts.marginU ?? 0.035;
    const marginV = opts.marginV ?? 0.025;
    const mullionColor = opts.mullionColor ?? PAL.inkMid;
    const mullionW = opts.mullionWidthPx ?? 0.45;
    const mullionOp = opts.mullionOpacity ?? 0.72;
    const beltEvery = opts.beltEvery ?? 1;
    // 1. Base architectural facade slab
    p.fillPath(polyPath(quadPts), wallFill, opts.wallOpacity ?? 0.98);
    // Optional subtle horizontal brick / ashlar stone courses
    if (opts.masonryCourses && opts.masonryCourses > 0) {
        let courseD = "";
        for (let i = 1; i < opts.masonryCourses; i++) {
            const v = i / opts.masonryCourses;
            courseD += `M${P(lerp(tl, bl, v))}L${P(lerp(tr, br, v))}`;
        }
        p.burin(courseD, mullionColor, 0.32, 0.28, opts.masonryCourses, "hatch");
    }
    // 2. Batch all cols x rows window panes into just 3 fills: unlit dark glass, tinted glass, & warm 2 AM lit!
    const darkParts = [];
    const tintParts = [];
    const litParts = [];
    const litGlowParts = [];
    const mullionParts = [];
    const uSpan = 1 - marginU * 2;
    const vSpan = 1 - marginV * 2;
    const du = uSpan / Math.max(1, cols);
    const dv = vSpan / Math.max(1, rows);
    // Coherent apartment/office lit runs (like 2 AM Tokyo/Chicago floors where adjacent bays are lit together!)
    for (let row = 0; row < rows; row++) {
        let runLit = p.r() < litChance * 0.7;
        const v0 = marginV + (row + insetV) * dv;
        const v1 = marginV + (row + 1 - insetV) * dv;
        const vMid = (v0 + v1) * 0.5;
        for (let col = 0; col < cols; col++) {
            if (p.r() < 0.36)
                runLit = p.r() < litChance;
            const u0 = marginU + (col + insetU) * du;
            const u1 = marginU + (col + 1 - insetU) * du;
            const uMid = (u0 + u1) * 0.5;
            const p00 = bilerp(tl, tr, br, bl, u0, v0);
            const p10 = bilerp(tl, tr, br, bl, u1, v0);
            const p11 = bilerp(tl, tr, br, bl, u1, v1);
            const p01 = bilerp(tl, tr, br, bl, u0, v1);
            let paneD;
            if (opts.arched) {
                const pSpringL = bilerp(tl, tr, br, bl, u0, lerp([v0, 0], [v1, 0], 0.32)[0]);
                const pSpringR = bilerp(tl, tr, br, bl, u1, lerp([v0, 0], [v1, 0], 0.32)[0]);
                const pTopMid = bilerp(tl, tr, br, bl, uMid, v0);
                paneD = `M${P(p01)}L${P(pSpringL)}Q${P(p00)} ${P(pTopMid)}Q${P(p10)} ${P(pSpringR)}L${P(p11)}Z`;
            }
            else {
                paneD = `M${P(p00)}L${P(p10)}L${P(p11)}L${P(p01)}Z`;
            }
            if (runLit) {
                litParts.push(paneD);
                // Subtle warm core reflection bar on lower pane
                const g0 = bilerp(tl, tr, br, bl, u0 + du * 0.1, vMid);
                const g1 = bilerp(tl, tr, br, bl, u1 - du * 0.1, vMid);
                const g2 = bilerp(tl, tr, br, bl, u1 - du * 0.1, v1 - dv * 0.08);
                const g3 = bilerp(tl, tr, br, bl, u0 + du * 0.1, v1 - dv * 0.08);
                litGlowParts.push(`M${P(g0)}L${P(g1)}L${P(g2)}L${P(g3)}Z`);
            }
            else if (p.r() < 0.34) {
                tintParts.push(paneD);
            }
            else {
                darkParts.push(paneD);
            }
            // Fine vertical window mullion split inside taller windows
            if (cols <= 18 && rows <= 24) {
                const mTop = bilerp(tl, tr, br, bl, uMid, v0);
                const mBot = bilerp(tl, tr, br, bl, uMid, v1);
                mullionParts.push(`M${P(mTop)}L${P(mBot)}`);
            }
        }
    }
    if (darkParts.length)
        p.fillPath(darkParts.join(""), glassFill, 0.88);
    if (tintParts.length)
        p.fillPath(tintParts.join(""), tintFill, 0.72);
    if (litParts.length)
        p.fillPath(litParts.join(""), litFill, 0.94);
    if (litGlowParts.length)
        p.fillPath(litGlowParts.join(""), PAL.lanternCore, "var(--z-halo-op)");
    // 3. Structural curtain-wall pilasters & floor belt spandrels in ONE non-scaling burin path!
    const gridLines = [];
    for (let col = 0; col <= cols; col++) {
        const u = marginU + col * du;
        gridLines.push(`M${P(bilerp(tl, tr, br, bl, u, marginV))}L${P(bilerp(tl, tr, br, bl, u, 1 - marginV))}`);
    }
    if (beltEvery > 0) {
        for (let row = 0; row <= rows; row += beltEvery) {
            const v = marginV + row * dv;
            gridLines.push(`M${P(bilerp(tl, tr, br, bl, marginU, v))}L${P(bilerp(tl, tr, br, bl, 1 - marginU, v))}`);
        }
    }
    if (mullionParts.length)
        p.burin(mullionParts.join(""), mullionColor, Math.max(0.3, mullionW * 0.78), mullionOp * 0.62, mullionParts.length, "hatch");
    p.burin(gridLines.join(""), mullionColor, mullionW, mullionOp, gridLines.length, "hatch");
    // 4. Razor-sharp architectural arris & sunlit cornice edge (ZERO cartoon thick black box!)
    if (opts.edgeRim !== false) {
        p.burinContour(`M${P(tl)}L${P(tr)}L${P(br)}`, PAL.ink, 0.65, 0.68, 2);
        p.burinContour(`M${P(bl)}L${P(tl)}L${P(tr)}`, PAL.litEdge, 0.55, 0.62, 2);
    }
    if (opts.flush)
        p.flush();
}
function makeBrushDab(cx, cy, rx, ry, ang, r) {
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const verts = 8;
    const pts = [];
    for (let i = 0; i < verts; i++) {
        const a = (i / verts) * TAU + rand(r, -0.18, 0.18);
        const radScale = rand(r, 0.72, 1.18);
        const lx = Math.cos(a) * rx * radScale;
        const ly = Math.sin(a) * ry * radScale;
        pts.push([cx + lx * ca - ly * sa, cy + lx * sa + ly * ca]);
    }
    // Connect consecutive midpoints with C1-smooth quadratic Q Beziers so dabs stay velvety even at 12x!
    const last = pts[verts - 1];
    const first = pts[0];
    let d = `M${f((last[0] + first[0]) * 0.5)} ${f((last[1] + first[1]) * 0.5)}`;
    for (let i = 0; i < verts; i++) {
        const cur = pts[i];
        const nxt = pts[(i + 1) % verts];
        d += `Q${f(cur[0])} ${f(cur[1])} ${f((cur[0] + nxt[0]) * 0.5)} ${f((cur[1] + nxt[1]) * 0.5)}`;
    }
    return d + "Z";
}
/**
 * Generates `@claudeai` Seven Wonders-grade **outline-free** dry-brush / gouache stippled foliage crowns
 * (cypresses, jungle canopy, Great Wall olive pines, courtyard shrubs) batched into ONLY 3-4 `<path>`s total!
 * Zero cartoon outlines; ragged perimeter tooth lets warm paper breathe through naturally.
 */
export function dryBrushFoliage(p, r, clusters, palette = {}, opts = {}) {
    const darkCol = palette.dark ?? PAL.sageDk;
    const midCol = palette.mid ?? PAL.sage;
    const lightCol = palette.light ?? PAL.sageLt;
    const accentCol = palette.accent;
    const baseDab = opts.dabSize ?? 13;
    const op = opts.opacity ?? 0.94;
    const light = opts.lightDir ?? LIGHT;
    const accentChance = accentCol ? (opts.accentChance ?? 0.05) : 0;
    const darkParts = [];
    const midParts = [];
    const lightParts = [];
    const accentParts = [];
    for (const cl of clusters) {
        const spire = cl.spire ?? 0;
        const areaScale = Math.sqrt(Math.max(120, cl.rx * cl.ry)) / 42;
        const dabCount = Math.max(14, Math.min(85, Math.round(28 * areaScale * (cl.density ?? 1))));
        for (let i = 0; i < dabCount; i++) {
            // Sample organic interior + dry-brush perimeter scatter
            let ux;
            let uy;
            if (spire > 0) {
                // Pointed cypress / conifer silhouette: wide lower base, slender tapering spire tip!
                uy = rand(r, -1, 1); // -1 = spire tip, +1 = base
                const widthAtY = clamp(Math.pow(Math.max(0.001, (uy + 1.06) * 0.5), 0.72 * spire), 0.1, 1.05);
                ux = rand(r, -1, 1) * widthAtY;
            }
            else {
                const a = r() * TAU;
                const radU = Math.pow(r(), 0.56);
                ux = Math.cos(a) * radU;
                uy = Math.sin(a) * radU;
            }
            const x = cl.cx + ux * cl.rx;
            const y = cl.cy + uy * cl.ry;
            // Edge dabs shrink into feathery dry-brush stipple flecks!
            const edgeDist = Math.hypot(ux, uy);
            const sz = baseDab * (0.45 + 0.72 * Math.max(0.25, 1.1 - edgeDist * 0.65)) * rand(r, 0.75, 1.32);
            const dab = makeBrushDab(x, y, sz * rand(r, 0.85, 1.35), sz * rand(r, 0.58, 1.05), rand(r, -0.5, 0.5), r);
            // Classify dab strictly by directional sunlight exposure + subtle organic jitter
            const sun = ux * light[0] + uy * light[1] + rand(r, -0.28, 0.28);
            if (accentCol && sun > 0.05 && r() < accentChance) {
                accentParts.push(dab);
            }
            else if (sun > 0.34) {
                lightParts.push(dab);
            }
            else if (sun > -0.18) {
                midParts.push(dab);
            }
            else {
                darkParts.push(dab);
            }
        }
        // Feathery dry-brush tooth specks around the silhouette edge (outline-free painterly magic!)
        const specks = Math.max(8, Math.round(dabCount * 0.38));
        for (let i = 0; i < specks; i++) {
            const a = r() * TAU;
            const push = rand(r, 0.92, 1.18);
            let ux = Math.cos(a) * push;
            const uy = Math.sin(a) * push;
            if (spire > 0)
                ux *= clamp(Math.pow(Math.max(0.001, (uy + 1.06) * 0.5), 0.72 * spire), 0.12, 1.05);
            const sx = cl.cx + ux * cl.rx;
            const sy = cl.cy + uy * cl.ry;
            const sr = baseDab * rand(r, 0.18, 0.38);
            const speck = makeBrushDab(sx, sy, sr * 1.2, sr * 0.8, rand(r, 0, TAU), r);
            const sun = ux * light[0] + uy * light[1];
            if (sun > 0.25)
                lightParts.push(speck);
            else if (sun > -0.2)
                midParts.push(speck);
            else
                darkParts.push(speck);
        }
    }
    // Paint back-to-front: deep shadow base -> mid foliage -> sunlit leaf tips -> rare blossom/autumn flecks
    if (darkParts.length)
        p.fillPath(darkParts.join(""), darkCol, op);
    if (midParts.length)
        p.fillPath(midParts.join(""), midCol, op * 0.94);
    if (lightParts.length)
        p.fillPath(lightParts.join(""), lightCol, op * 0.88);
    if (accentParts.length && accentCol)
        p.fillPath(accentParts.join(""), accentCol, op * 0.92);
    if (opts.flush)
        p.flush();
}
/**
 * Generates `@claudeai` Taj Mahal / `glasshouse` horizontal broken-stroke gouache water reflections
 * across either a rectangle OR a perspective trapezoid `[tl, tr, br, bl]` in ONLY 3-4 batched `<path>`s!
 */
export function brokenWaterReflections(p, r, boxOrQuad, colors = {}, opts = {}) {
    const quadPts = Array.isArray(boxOrQuad)
        ? boxOrQuad
        : (() => {
            const b = boxOrQuad;
            return [
                [b.x0, b.y0],
                [b.x1, b.y0],
                [b.x1, b.y1],
                [b.x0, b.y1],
            ];
        })();
    const [tl, tr, br, bl] = quadPts;
    const rows = opts.rows ?? 38;
    const op = opts.opacity ?? 0.86;
    const primaryCol = colors.primary ?? PAL.water;
    const deepCol = colors.deep ?? PAL.waterDeep;
    const shimmerCol = colors.shimmer ?? PAL.waterShimmer;
    if (colors.base !== false) {
        p.fillPath(polyPath(quadPts), colors.base ?? PAL.paperWarm, 0.55);
    }
    const primParts = [];
    const deepParts = [];
    const shimParts = [];
    const customParts = new Map();
    for (let row = 0; row < rows; row++) {
        const t = row / Math.max(1, rows - 1);
        // Perspective crowding toward horizon (v = 0), opening toward foreground (v = 1)
        const vBase = Math.pow(t, 1.32);
        const segCount = Math.round(5 + 7 * (0.4 + 0.6 * t));
        for (let k = 0; k < segCount; k++) {
            // Leave 40-55% breathing open water between short gouache dashes & jitter v off ruler scanlines!
            if (r() < 0.16)
                continue;
            const uCenter = (k + rand(r, 0.14, 0.86)) / segCount;
            const vSeg = clamp(vBase + rand(r, -0.45, 0.45) / Math.max(1, rows), 0.005, 0.995);
            const strokeH = 1.4 + 4.4 * vSeg;
            const halfLen = rand(r, 0.013, 0.038) * (0.65 + 0.4 * vSeg);
            const u0 = clamp(uCenter - halfLen, 0.01, 0.99);
            const u1 = clamp(uCenter + halfLen, 0.01, 0.99);
            if (u1 - u0 < 0.01)
                continue;
            const a = bilerp(tl, tr, br, bl, u0, vSeg);
            const b = bilerp(tl, tr, br, bl, u1, vSeg);
            const mx = (a[0] + b[0]) * 0.5;
            const my = (a[1] + b[1]) * 0.5;
            const hh = strokeH * rand(r, 0.55, 1.15);
            // Tapered organic horizontal gouache dash (zero mechanical stripes or ruler beats!)
            const dash = `M${f(a[0])} ${f(a[1])}Q${f(mx)} ${f(my - hh * 0.72)} ${f(b[0])} ${f(b[1])}Q${f(mx)} ${f(my + hh * 0.76)} ${f(a[0])} ${f(a[1])}Z`;
            // Check optional reflected monument / sky bands
            let matchedCustom;
            if (opts.reflectBands) {
                for (const rb of opts.reflectBands) {
                    if (uCenter >= rb.u0 && uCenter <= rb.u1 && vSeg >= rb.v0 && vSeg <= rb.v1 && r() < 0.72) {
                        matchedCustom = rb.color;
                        break;
                    }
                }
            }
            if (matchedCustom) {
                let arr = customParts.get(matchedCustom);
                if (!arr) {
                    arr = [];
                    customParts.set(matchedCustom, arr);
                }
                arr.push(dash);
            }
            else {
                const roll = r();
                if (roll < 0.46)
                    primParts.push(dash);
                else if (roll < 0.78)
                    deepParts.push(dash);
                else
                    shimParts.push(dash);
            }
        }
    }
    if (primParts.length)
        p.fillPath(primParts.join(""), primaryCol, op * 0.82);
    if (deepParts.length)
        p.fillPath(deepParts.join(""), deepCol, op * 0.68);
    for (const [col, parts] of customParts.entries()) {
        p.fillPath(parts.join(""), col, op * 0.84);
    }
    if (shimParts.length)
        p.fillPath(shimParts.join(""), shimmerCol, op * 0.72);
    if (opts.flush)
        p.flush();
}
const DEFAULT_COATS = [PAL.cinnabar, PAL.ochre, PAL.prussianLt, PAL.slateDk, PAL.paperWarm, PAL.cinnabarLt];
/**
 * Draws `@kiuzyx` & `@claudeai` tiny 2-tone human scale figures (`10–26 px` tall) with slanted
 * ground shadows, dark heads/legs, expressive wardrobe tones, and optional coral parasols!
 * Batched by tone so 25 strolling figures add only ~6 `<path>` DOM elements!
 */
export function scaleFigures(p, r, placements, opts = {}) {
    if (!placements.length)
        return;
    const shDir = opts.shadowDir ?? [1.05, 0.3];
    const shadowParts = [];
    const darkParts = [];
    const coatBuckets = new Map();
    const parasolParts = [];
    for (const fig of placements) {
        const h = fig.h ?? rand(r, 14, 21);
        const x = fig.x;
        const y = fig.y;
        const dir = fig.dir ?? (r() < 0.5 ? 1 : -1);
        const kind = fig.kind ?? (r() < 0.34 ? "dress" : "coat");
        const coat = fig.coat ?? DEFAULT_COATS[Math.floor(r() * DEFAULT_COATS.length)];
        // 1. Slanted cast shadow grounding feet to stone/pavement
        const shLen = h * 0.72;
        const sx = x + shDir[0] * shLen;
        const sy = y + shDir[1] * shLen;
        const sw = h * 0.11;
        shadowParts.push(`M${f(x - sw)} ${f(y)}L${f(x + sw)} ${f(y)}L${f(sx + sw * 0.6)} ${f(sy)}L${f(sx - sw * 0.6)} ${f(sy)}Z`);
        // 2. Tiny dark legs (slight walking stride) + head
        const headR = h * 0.1;
        const headY = y - h + headR;
        const waistY = y - h * 0.42;
        const legW = Math.max(0.8, h * 0.055);
        const stride = h * 0.09 * dir;
        darkParts.push(circlePath(x, headY, headR), 
        // Back & front legs
        `M${f(x - legW * 1.1)} ${f(waistY)}L${f(x - stride * 0.5 - legW)} ${f(y)}L${f(x - stride * 0.5 + legW * 0.4)} ${f(y)}L${f(x)} ${f(waistY)}Z`, `M${f(x)} ${f(waistY)}L${f(x + stride * 0.6 - legW * 0.4)} ${f(y)}L${f(x + stride * 0.6 + legW)} ${f(y)}L${f(x + legW * 1.1)} ${f(waistY)}Z`);
        // 3. Expressive 2-tone coat or flared dress torso
        const shY = y - h * 0.78;
        const shW = h * 0.14;
        let bodyD;
        if (kind === "dress") {
            const hemY = y - h * 0.24;
            const hemW = h * 0.2;
            bodyD = `M${f(x - shW * 0.85)} ${f(shY)}L${f(x + shW * 0.85)} ${f(shY)}L${f(x + hemW)} ${f(hemY)}L${f(x - hemW)} ${f(hemY)}Z`;
        }
        else {
            const hemY = y - h * 0.36;
            const hemW = h * 0.13;
            bodyD = `M${f(x - shW)} ${f(shY)}L${f(x + shW)} ${f(shY)}L${f(x + hemW)} ${f(hemY)}L${f(x - hemW)} ${f(hemY)}Z`;
        }
        let arr = coatBuckets.get(coat);
        if (!arr) {
            arr = [];
            coatBuckets.set(coat, arr);
        }
        arr.push(bodyD);
        // 4. Optional Chichen Itza / Riviera coral sun-parasol dome
        if (kind === "parasol") {
            const pr = h * 0.36;
            const py = headY - h * 0.12;
            parasolParts.push(`M${f(x - pr)} ${f(py)}Q${f(x)} ${f(py - pr * 0.78)} ${f(x + pr)} ${f(py)}Z`);
            darkParts.push(`M${f(x - 0.5)} ${f(py)}L${f(x + 0.5)} ${f(py)}L${f(x + 0.5)} ${f(shY)}L${f(x - 0.5)} ${f(shY)}Z`);
        }
    }
    if (shadowParts.length)
        p.fillPath(shadowParts.join(""), PAL.inkMid, opts.shadowOpacity ?? 0.26);
    if (darkParts.length)
        p.fillPath(darkParts.join(""), PAL.ink, 0.92);
    for (const [col, parts] of coatBuckets.entries()) {
        p.fillPath(parts.join(""), col, 0.94);
    }
    if (parasolParts.length)
        p.fillPath(parasolParts.join(""), PAL.cinnabarLt, 0.94);
    if (opts.flush)
        p.flush();
}
/**
 * Compound-Path Material Batcher: accumulates hundreds/thousands of tiny windows, mullions,
 * rivets, book spines, waveforms, knobs, and gouache foliage dabs by material `key`, and
 * flushes EXACTLY ONE `<path>` element per unique key in deterministic painter's z-order.
 */
export class PathBatcher {
    buckets = new Map();
    bucket(key, style) {
        let b = this.buckets.get(key);
        if (!b) {
            b = { style, parts: [], count: 0 };
            this.buckets.set(key, b);
        }
        return b;
    }
    addPath(key, d, style, count = 1) {
        if (!d)
            return this;
        const b = this.bucket(key, style);
        b.parts.push(d);
        b.count += count;
        return this;
    }
    rect(key, x, y, w, h, style) {
        if (w <= 0 || h <= 0)
            return this;
        return this.addPath(key, `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`, style, 1);
    }
    quad(key, p0, p1, p2, p3, style) {
        return this.addPath(key, `M${P(p0)}L${P(p1)}L${P(p2)}L${P(p3)}Z`, style, 1);
    }
    line(key, x1, y1, x2, y2, style) {
        return this.addPath(key, `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`, style, 1);
    }
    circle(key, cx, cy, r, style) {
        if (r <= 0)
            return this;
        return this.addPath(key, circlePath(cx, cy, r), style, 1);
    }
    /** Appends a C1-smooth 8-vertex quadratic-Q gouache brush dab (stays velvety even at 12x zoom). */
    dab(key, cx, cy, rx, ry, rotRad, seedOrRng, style) {
        const rFn = typeof seedOrRng === "function" ? seedOrRng : rng(seedOrRng);
        return this.addPath(key, makeBrushDab(cx, cy, rx, ry, rotRad, rFn), style, 1);
    }
    /**
     * Emits ONE compound `<path>` per unique key into `target` (`Painter`) or returns raw SVG markup string.
     * Preserves insertion order across keys for airtight painter's z-ordering.
     */
    flush(target) {
        if (target)
            target.flush();
        const out = [];
        for (const b of this.buckets.values()) {
            if (!b.parts.length)
                continue;
            const d = b.parts.join("");
            const st = b.style;
            const hasFill = st.fill !== undefined && st.fill !== "none";
            const fillAttr = hasFill ? ` fill="${st.fill}"` : ` fill="none"`;
            const fOp = hasFill && st.fillOpacity !== undefined
                ? typeof st.fillOpacity === "string"
                    ? ` fill-opacity="${st.fillOpacity}"`
                    : st.fillOpacity < 0.995
                        ? ` fill-opacity="${f(st.fillOpacity)}"`
                        : ""
                : "";
            const rule = st.evenodd ? ` fill-rule="evenodd"` : "";
            const strokeAttr = st.stroke ? ` stroke="${st.stroke}"` : "";
            const sw = st.stroke && st.strokeWidth !== undefined
                ? ` stroke-width="${(Math.round(st.strokeWidth * 100) / 100).toFixed(2).replace(/\.?0+$/, "")}"`
                : "";
            const sOp = st.stroke && st.strokeOpacity !== undefined
                ? typeof st.strokeOpacity === "string"
                    ? ` stroke-opacity="${st.strokeOpacity}"`
                    : st.strokeOpacity < 0.995
                        ? ` stroke-opacity="${f(st.strokeOpacity)}"`
                        : ""
                : "";
            const da = st.dash ? ` stroke-dasharray="${st.dash}"` : "";
            const emitEl = (el, addStrokes) => {
                if (target) {
                    target.out.push(el);
                    target.elements++;
                    target.strokes += addStrokes;
                }
                else {
                    out.push(el);
                }
            };
            const boStyle = st.stroke && st.strokeOpacity !== undefined
                ? typeof st.strokeOpacity === "string"
                    ? ` style="--bo:${st.strokeOpacity}"`
                    : st.strokeOpacity < 0.995
                        ? ` style="--bo:${f(st.strokeOpacity)}"`
                        : ""
                : "";
            // Guard: CSS `.burin`/`.burin-c` sets `fill: none; stroke-opacity: calc(var(--bo,1) * var(--z-burin-op,1))`.
            // When a key carries BOTH fill and non-scaling stroke, emit fill-only first, then stroke-only `.burin*`!
            if (hasFill && st.stroke && st.nonScaling) {
                const cls = st.nonScaling === "contour" ? "burin-c" : "burin";
                emitEl(`<path d="${d}"${fillAttr}${fOp}${rule}/>`, 0);
                emitEl(`<path class="${cls}" vector-effect="non-scaling-stroke" d="${d}" fill="none"${strokeAttr}${sw}${boStyle}${da}/>`, b.count);
            }
            else if (st.stroke && st.nonScaling) {
                const cls = st.nonScaling === "contour" ? "burin-c" : "burin";
                emitEl(`<path class="${cls}" vector-effect="non-scaling-stroke" d="${d}" fill="none"${strokeAttr}${sw}${boStyle}${da}/>`, b.count);
            }
            else {
                const extra = st.stroke ? ` stroke-linecap="${st.cap ?? "round"}" stroke-linejoin="round"` : "";
                emitEl(`<path${extra} d="${d}"${fillAttr}${fOp}${rule}${strokeAttr}${sw}${sOp}${da}/>`, st.stroke ? b.count : 0);
            }
        }
        this.buckets.clear();
        return out.join("");
    }
    clear() {
        this.buckets.clear();
    }
}
function toQuad4(bounds) {
    if (Array.isArray(bounds))
        return bounds;
    const b = bounds;
    return [
        [b.x, b.y],
        [b.x + b.w, b.y],
        [b.x + b.w, b.y + b.h],
        [b.x, b.y + b.h],
    ];
}
/**
 * `@kiuzyx`-grade 2-point/axonometric curtain-wall skyscraper with sunlit & shaded faces,
 * `400–1,200` micro `3–6 px` recessed panes, diagonal sky glints, half-drawn Venetian blinds,
 * stochastic 2 AM lit office runs, primary piers, parapet roof & mechanical penthouse —
 * batched via `PathBatcher` into ONLY ~10 `<path>` DOM nodes!
 */
export function curtainSkyscraper3D(p, opts) {
    const { cx, topY, baseY, wL, wR } = opts;
    const h = Math.max(40, baseY - topY);
    const skewL = opts.skewL ?? -wL * 0.26;
    const skewR = opts.skewR ?? -wR * 0.26;
    const colsL = Math.max(4, opts.colsL ?? Math.round(wL / 9));
    const colsR = Math.max(3, opts.colsR ?? Math.round(wR / 10));
    const rows = Math.max(6, opts.rows ?? Math.round(h / 10));
    const wallL = opts.wallL ?? PAL.paperStone;
    const wallR = opts.wallR ?? PAL.slateDk;
    const roofFill = opts.roofFill ?? PAL.paperDeep;
    const glassL = opts.glassL ?? PAL.windowDim;
    const glassR = opts.glassR ?? PAL.prussianDk;
    const tintFill = opts.tintFill ?? PAL.glassTint;
    const litFill = opts.litFill ?? PAL.windowLit;
    const blindFill = opts.blindFill ?? PAL.paperWarm;
    const mullionCol = opts.mullionColor ?? PAL.inkMid;
    const litChance = opts.litChance ?? 0.24;
    const pierEvery = opts.pierEvery ?? 4;
    const b = new PathBatcher();
    const drawTier = (tx, ty, tBaseY, twL, twR, tSkL, tSkR, tColsL, tColsR, tRows, drawRoof) => {
        const tl = [tx - twL, ty + tSkL];
        const tc = [tx, ty];
        const tr = [tx + twR, ty + tSkR];
        const tb = [tx - twL + twR, ty + tSkL + tSkR];
        const bl = [tx - twL, tBaseY + tSkL];
        const bc = [tx, tBaseY];
        const br = [tx + twR, tBaseY + tSkR];
        // 1. Structural facade slabs & recessed rooftop parapet
        b.quad("wallL", tl, tc, bc, bl, { fill: wallL, fillOpacity: 0.99 });
        b.quad("wallR", tc, tr, br, bc, { fill: wallR, fillOpacity: 0.99 });
        if (drawRoof) {
            b.quad("roofRim", tb, tr, tc, tl, { fill: PAL.paperWarm, fillOpacity: 0.98 });
            const rIn = 0.08;
            b.quad("roofSlab", bilerp(tb, tr, tc, tl, rIn, rIn), bilerp(tb, tr, tc, tl, 1 - rIn, rIn), bilerp(tb, tr, tc, tl, 1 - rIn, 1 - rIn), bilerp(tb, tr, tc, tl, rIn, 1 - rIn), { fill: roofFill, fillOpacity: 0.96 });
        }
        const populateFace = (fTL, fTR, fBR, fBL, cols, gKey, gCol, isLitFace) => {
            const mU = 0.032;
            const mV = 0.022;
            const du = (1 - mU * 2) / cols;
            const dv = (1 - mV * 2) / tRows;
            const inU = 0.14;
            const inV = 0.22;
            // Diagonal glass sky-reflection streak phase
            const streakA = rand(p.r, 0.25, 0.72);
            const streakSlope = rand(p.r, 0.35, 0.75);
            for (let row = 0; row < tRows; row++) {
                let runLit = p.r() < litChance * 0.65;
                const v0 = mV + (row + inV) * dv;
                const v1 = mV + (row + 1 - inV) * dv;
                const vN = row / Math.max(1, tRows - 1);
                for (let col = 0; col < cols; col++) {
                    if (p.r() < 0.32)
                        runLit = p.r() < litChance;
                    const u0 = mU + (col + inU) * du;
                    const u1 = mU + (col + 1 - inU) * du;
                    const uN = col / Math.max(1, cols - 1);
                    const q0 = bilerp(fTL, fTR, fBR, fBL, u0, v0);
                    const q1 = bilerp(fTL, fTR, fBR, fBL, u1, v0);
                    const q2 = bilerp(fTL, fTR, fBR, fBL, u1, v1);
                    const q3 = bilerp(fTL, fTR, fBR, fBL, u0, v1);
                    if (runLit) {
                        b.quad("lit", q0, q1, q2, q3, { fill: litFill, fillOpacity: 0.94 });
                        const vm = v0 + (v1 - v0) * 0.45;
                        b.quad("litCore", bilerp(fTL, fTR, fBR, fBL, u0, vm), bilerp(fTL, fTR, fBR, fBL, u1, vm), q2, q3, { fill: PAL.lanternCore, fillOpacity: "var(--z-halo-op)" });
                    }
                    else {
                        const onStreak = Math.abs(uN * streakSlope + vN - streakA) < 0.14;
                        if (isLitFace && (onStreak || p.r() < 0.26)) {
                            b.quad("tint", q0, q1, q2, q3, { fill: tintFill, fillOpacity: 0.78 });
                        }
                        else {
                            b.quad(gKey, q0, q1, q2, q3, { fill: gCol, fillOpacity: 0.9 });
                        }
                        // Stochastic half-drawn Venetian blinds on 18% of unlit offices
                        if (p.r() < 0.18) {
                            const vb = v0 + (v1 - v0) * rand(p.r, 0.32, 0.56);
                            b.quad("blind", q0, q1, bilerp(fTL, fTR, fBR, fBL, u1, vb), bilerp(fTL, fTR, fBR, fBL, u0, vb), { fill: blindFill, fillOpacity: isLitFace ? 0.58 : 0.32 });
                        }
                    }
                }
            }
            // Fine spandrels + curtain-wall mullions + heavier structural column piers
            for (let col = 0; col <= cols; col++) {
                const u = mU + col * du;
                const a = bilerp(fTL, fTR, fBR, fBL, u, mV);
                const c = bilerp(fTL, fTR, fBR, fBL, u, 1 - mV);
                const isPier = pierEvery > 0 && col % pierEvery === 0;
                b.line(isPier ? "pier" : "mullion", a[0], a[1], c[0], c[1], {
                    stroke: mullionCol,
                    strokeWidth: isPier ? 0.65 : 0.36,
                    strokeOpacity: isPier ? 0.78 : 0.56,
                    nonScaling: "hatch",
                });
            }
            for (let row = 0; row <= tRows; row++) {
                const v = mV + row * dv;
                const a = bilerp(fTL, fTR, fBR, fBL, mU, v);
                const c = bilerp(fTL, fTR, fBR, fBL, 1 - mU, v);
                const isMech = tRows >= 18 && (row === Math.round(tRows * 0.5) || row === 0 || row === tRows);
                b.line(isMech ? "pier" : "mullion", a[0], a[1], c[0], c[1], {
                    stroke: mullionCol,
                    strokeWidth: isMech ? 0.68 : 0.36,
                    strokeOpacity: isMech ? 0.78 : 0.52,
                    nonScaling: "hatch",
                });
            }
        };
        populateFace(tl, tc, bc, bl, tColsL, "glassL", glassL, true);
        populateFace(tc, tr, br, bc, tColsR, "glassR", glassR, false);
        // Crisp architectural arrises (lit edge on left/roof, dark corner edge)
        b.line("arrLit", tl[0], tl[1], tc[0], tc[1], { stroke: PAL.litEdge, strokeWidth: 0.62, strokeOpacity: 0.72, nonScaling: "contour" });
        b.line("arrLit", tl[0], tl[1], bl[0], bl[1], { stroke: PAL.litEdge, strokeWidth: 0.55, strokeOpacity: 0.62, nonScaling: "contour" });
        b.line("arrDk", tc[0], tc[1], bc[0], bc[1], { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.72, nonScaling: "contour" });
        b.line("arrDk", tc[0], tc[1], tr[0], tr[1], { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.68, nonScaling: "contour" });
        b.line("arrDk", tr[0], tr[1], br[0], br[1], { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.68, nonScaling: "contour" });
        // Rooftop mechanical penthouse / chiller fans / water tank / spire
        if (drawRoof && opts.roofDetail !== "none") {
            const detail = opts.roofDetail ?? "penthouse";
            const rCx = (tb[0] + tc[0]) * 0.5;
            const rCy = (tb[1] + tc[1]) * 0.5;
            const pw = Math.min(twL, twR) * 0.36;
            const ph = Math.max(10, Math.min(28, pw * 0.52));
            if (detail === "penthouse" || detail === "hvac") {
                const pL = [rCx - pw, rCy - ph - pw * 0.24];
                const pC = [rCx, rCy - ph];
                const pR = [rCx + pw * 0.85, rCy - ph - pw * 0.2];
                const pB = [rCx - pw + pw * 0.85, rCy - ph - pw * 0.44];
                b.quad("roofSlab", pB, pR, pC, pL, { fill: PAL.paperWarm, fillOpacity: 0.96 });
                b.quad("wallL", pL, pC, [rCx, rCy], [rCx - pw, rCy - pw * 0.24], { fill: wallL, fillOpacity: 0.96 });
                b.quad("wallR", pC, pR, [rCx + pw * 0.85, rCy - pw * 0.2], [rCx, rCy], { fill: wallR, fillOpacity: 0.96 });
                // Tiny louvered HVAC vents on penthouse
                for (let k = 1; k <= 4; k++) {
                    const u = k / 5;
                    const vx = pL[0] + (pC[0] - pL[0]) * u;
                    const vy = pL[1] + (pC[1] - pL[1]) * u;
                    b.line("mullion", vx, vy + 2, vx, vy + ph - 2, { stroke: mullionCol, strokeWidth: 0.38, strokeOpacity: 0.65, nonScaling: "hatch" });
                }
            }
            if (detail === "watertank") {
                const tw = Math.max(7, Math.min(14, pw * 0.48));
                const th = tw * 1.45;
                const tx0 = rCx + pw * 0.25;
                const ty0 = rCy - th * 0.6;
                // Steel legs + wooden barrel + conical copper cap
                b.line("arrDk", tx0 - tw * 0.6, ty0 + th, tx0 - tw * 0.8, ty0 + th + 12, { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.85, nonScaling: "contour" });
                b.line("arrDk", tx0 + tw * 0.6, ty0 + th, tx0 + tw * 0.8, ty0 + th + 12, { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.85, nonScaling: "contour" });
                b.rect("wtBody", tx0 - tw, ty0, tw * 2, th, { fill: PAL.umber, fillOpacity: 0.96 });
                b.addPath("wtCap", `M${f(tx0 - tw * 1.15)} ${f(ty0)}L${f(tx0)} ${f(ty0 - tw * 0.85)}L${f(tx0 + tw * 1.15)} ${f(ty0)}Z`, { fill: PAL.copper, fillOpacity: 0.96 });
            }
            else if (detail === "spire") {
                const spH = Math.max(36, h * 0.16);
                b.line("arrDk", rCx, rCy, rCx, rCy - spH, { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.85, nonScaling: "contour" });
                b.circle("beacon", rCx, rCy - spH, 2.2, { fill: PAL.cinnabarLt, fillOpacity: 0.95 });
            }
        }
    };
    if (opts.setback) {
        const sb = opts.setback;
        const splitY = topY + h * sb.fracH;
        const lowerRows = Math.max(4, Math.round(rows * (1 - sb.fracH)));
        const upperRows = Math.max(3, rows - lowerRows);
        drawTier(cx, splitY, baseY, wL, wR, skewL, skewR, colsL, colsR, lowerRows, true);
        const s = 1 - clamp(sb.inset, 0.12, 0.44);
        const scL = Math.max(3, Math.round(colsL * s));
        const scR = Math.max(2, Math.round(colsR * s));
        const uShiftY = (skewL + skewR) * (1 - s) * 0.5;
        drawTier(cx, topY + uShiftY, splitY + uShiftY, wL * s, wR * s, skewL * s, skewR * s, scL, scR, upperRows, true);
    }
    else {
        drawTier(cx, topY, baseY, wL, wR, skewL, skewR, colsL, colsR, rows, true);
    }
    b.flush(p);
}
/**
 * `@kiuzyx` Chicago/NY masonry brick or limestone loft with corbelled cornice brackets,
 * stone lintels/sills, recessed `2x2` muntin sash windows, masonry courses & bronze ground-floor
 * storefront colonnade (ZERO candy-cane awnings!) — batched into ~11 `<path>` nodes!
 */
export function brickLoftBuilding3D(p, opts) {
    const { cx, topY, baseY, wL, wR } = opts;
    const h = Math.max(40, baseY - topY);
    const skewL = opts.skewL ?? -wL * 0.26;
    const skewR = opts.skewR ?? -wR * 0.26;
    const colsL = Math.max(3, opts.colsL ?? Math.round(wL / 18));
    const colsR = Math.max(2, opts.colsR ?? Math.round(wR / 20));
    const floors = Math.max(2, opts.floors ?? Math.round(h / 24));
    const wallL = opts.wallL ?? PAL.cinnabar;
    const wallR = opts.wallR ?? PAL.cinnabarDk;
    const trim = opts.trimColor ?? PAL.paperStone;
    const litChance = opts.litChance ?? 0.25;
    const hasGround = opts.groundFloor !== false && floors >= 3;
    const tl = [cx - wL, topY + skewL];
    const tc = [cx, topY];
    const tr = [cx + wR, topY + skewR];
    const tb = [cx - wL + wR, topY + skewL + skewR];
    const bl = [cx - wL, baseY + skewL];
    const bc = [cx, baseY];
    const br = [cx + wR, baseY + skewR];
    const b = new PathBatcher();
    // Roof parapet + walls
    b.quad("roof", tb, tr, tc, tl, { fill: PAL.paperDeep, fillOpacity: 0.98 });
    b.quad("wallL", tl, tc, bc, bl, { fill: wallL, fillOpacity: 0.99 });
    b.quad("wallR", tc, tr, br, bc, { fill: wallR, fillOpacity: 0.99 });
    const populateMasonry = (fTL, fTR, fBR, fBL, cols, isLitFace) => {
        // Subtle brick/ashlar courses
        const courseN = Math.min(44, floors * 5);
        for (let i = 1; i < courseN; i++) {
            const v = i / courseN;
            const a = lerp(fTL, fBL, v);
            const c = lerp(fTR, fBR, v);
            b.line("course", a[0], a[1], c[0], c[1], { stroke: PAL.ink, strokeWidth: 0.28, strokeOpacity: 0.18, nonScaling: "hatch" });
        }
        // Projecting stone cornice band + dentil brackets
        const cornV = Math.min(0.065, 11 / h);
        b.quad("trim", fTL, fTR, lerp(fTR, fBR, cornV), lerp(fTL, fBL, cornV), { fill: trim, fillOpacity: 0.96 });
        const dentils = Math.min(28, cols * 3);
        for (let d = 0; d < dentils; d++) {
            const u0 = (d + 0.2) / dentils;
            const u1 = (d + 0.65) / dentils;
            b.quad("shadow", bilerp(fTL, fTR, fBR, fBL, u0, cornV), bilerp(fTL, fTR, fBR, fBL, u1, cornV), bilerp(fTL, fTR, fBR, fBL, u1, cornV * 1.55), bilerp(fTL, fTR, fBR, fBL, u0, cornV * 1.55), { fill: PAL.inkMid, fillOpacity: 0.55 });
        }
        // Upper story sash windows with projecting stone lintels, sills & 2x2 muntins
        const bodyTopV = cornV * 1.8;
        const bodyBotV = hasGround ? 1 - Math.min(0.24, 1.3 / floors) : 0.96;
        const upperFloors = hasGround ? floors - 1 : floors;
        const mU = 0.055;
        const du = (1 - mU * 2) / cols;
        const dv = (bodyBotV - bodyTopV) / Math.max(1, upperFloors);
        for (let fl = 0; fl < upperFloors; fl++) {
            const v0 = bodyTopV + (fl + 0.2) * dv;
            const v1 = bodyTopV + (fl + 0.82) * dv;
            const vMid = (v0 + v1) * 0.5;
            for (let col = 0; col < cols; col++) {
                const u0 = mU + (col + 0.22) * du;
                const u1 = mU + (col + 0.78) * du;
                const uMid = (u0 + u1) * 0.5;
                const q0 = bilerp(fTL, fTR, fBR, fBL, u0, v0);
                const q1 = bilerp(fTL, fTR, fBR, fBL, u1, v0);
                const q2 = bilerp(fTL, fTR, fBR, fBL, u1, v1);
                const q3 = bilerp(fTL, fTR, fBR, fBL, u0, v1);
                // Stone lintel & sill
                b.quad("trim", bilerp(fTL, fTR, fBR, fBL, u0 - du * 0.06, v0 - dv * 0.09), bilerp(fTL, fTR, fBR, fBL, u1 + du * 0.06, v0 - dv * 0.09), q1, q0, { fill: trim, fillOpacity: 0.94 });
                b.quad("trim", q3, q2, bilerp(fTL, fTR, fBR, fBL, u1 + du * 0.07, v1 + dv * 0.07), bilerp(fTL, fTR, fBR, fBL, u0 - du * 0.07, v1 + dv * 0.07), { fill: trim, fillOpacity: 0.92 });
                const lit = p.r() < litChance;
                b.quad(lit ? "lit" : isLitFace ? "glassL" : "glassR", q0, q1, q2, q3, {
                    fill: lit ? PAL.windowLit : isLitFace ? PAL.windowDim : PAL.prussianDk,
                    fillOpacity: 0.92,
                });
                // Crisp 2x2 sash muntin cross
                const mT = bilerp(fTL, fTR, fBR, fBL, uMid, v0);
                const mB = bilerp(fTL, fTR, fBR, fBL, uMid, v1);
                const mL = bilerp(fTL, fTR, fBR, fBL, u0, vMid);
                const mR = bilerp(fTL, fTR, fBR, fBL, u1, vMid);
                b.line("muntin", mT[0], mT[1], mB[0], mB[1], { stroke: trim, strokeWidth: 0.38, strokeOpacity: 0.78, nonScaling: "hatch" });
                b.line("muntin", mL[0], mL[1], mR[0], mR[1], { stroke: trim, strokeWidth: 0.38, strokeOpacity: 0.78, nonScaling: "hatch" });
            }
        }
        // Ground-floor bronze storefront colonnade (transom + tall plate glass, zero candy-cane awnings!)
        if (hasGround) {
            b.quad("storeCornice", lerp(fTL, fBL, bodyBotV), lerp(fTR, fBR, bodyBotV), lerp(fTR, fBR, bodyBotV + 0.025), lerp(fTL, fBL, bodyBotV + 0.025), { fill: PAL.slateDk, fillOpacity: 0.96 });
            const bays = Math.max(2, Math.round(cols * 0.6));
            const bDu = (1 - mU * 2) / bays;
            for (let i = 0; i < bays; i++) {
                const u0 = mU + (i + 0.1) * bDu;
                const u1 = mU + (i + 0.9) * bDu;
                const vT = bodyBotV + 0.04;
                const vTr = bodyBotV + (1 - bodyBotV) * 0.3;
                const vB = 0.975;
                b.quad("storeGlass", bilerp(fTL, fTR, fBR, fBL, u0, vT), bilerp(fTL, fTR, fBR, fBL, u1, vT), bilerp(fTL, fTR, fBR, fBL, u1, vB), bilerp(fTL, fTR, fBR, fBL, u0, vB), { fill: p.r() < 0.55 ? PAL.windowLit : PAL.windowDim, fillOpacity: 0.88 });
                const trA = bilerp(fTL, fTR, fBR, fBL, u0, vTr);
                const trB = bilerp(fTL, fTR, fBR, fBL, u1, vTr);
                b.line("storeBar", trA[0], trA[1], trB[0], trB[1], { stroke: PAL.ink, strokeWidth: 0.6, strokeOpacity: 0.82, nonScaling: "contour" });
            }
        }
    };
    populateMasonry(tl, tc, bc, bl, colsL, true);
    populateMasonry(tc, tr, br, bc, colsR, false);
    b.line("arrLit", tl[0], tl[1], tc[0], tc[1], { stroke: PAL.litEdge, strokeWidth: 0.62, strokeOpacity: 0.72, nonScaling: "contour" });
    b.line("arrDk", tc[0], tc[1], bc[0], bc[1], { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.75, nonScaling: "contour" });
    b.line("arrDk", tc[0], tc[1], tr[0], tr[1], { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.7, nonScaling: "contour" });
    b.flush(p);
}
/**
 * Lacy riveted Pratt/Warren/X steel truss viaduct or bascule bridge span with gusset plates,
 * diagonal web struts, optional deck rail ties & cross-braced piers — batched into ~5 `<path>`s!
 */
export function trussBridgeSpan(p, opts) {
    const { p0, p1, depth } = opts;
    const bays = Math.max(4, opts.bays ?? 16);
    const kind = opts.kind ?? "x-truss";
    const steel = opts.steelColor ?? PAL.slateDk;
    const hi = opts.highlightColor ?? PAL.litEdge;
    const b = new PathBatcher();
    const bot0 = [p0[0], p0[1] + depth];
    const bot1 = [p1[0], p1[1] + depth];
    const chordH = Math.max(2.2, depth * 0.11);
    // Top & bottom steel flange girders
    b.quad("chord", p0, p1, [p1[0], p1[1] + chordH], [p0[0], p0[1] + chordH], { fill: steel, fillOpacity: 0.96 });
    b.quad("chord", [bot0[0], bot0[1] - chordH], [bot1[0], bot1[1] - chordH], bot1, bot0, { fill: steel, fillOpacity: 0.96 });
    b.line("hi", p0[0], p0[1], p1[0], p1[1], { stroke: hi, strokeWidth: 0.65, strokeOpacity: 0.72, nonScaling: "contour" });
    // Panel posts, diagonal web struts & corner gusset plates
    const gR = Math.max(2.2, Math.min(4.8, depth * 0.13));
    for (let i = 0; i <= bays; i++) {
        const u = i / bays;
        const tPt = lerp(p0, p1, u);
        const bPt = lerp(bot0, bot1, u);
        b.line("post", tPt[0], tPt[1], bPt[0], bPt[1], { stroke: steel, strokeWidth: 0.95, strokeOpacity: 0.92, nonScaling: "contour" });
        b.rect("gusset", tPt[0] - gR * 0.6, tPt[1], gR * 1.2, gR * 1.1, { fill: steel, fillOpacity: 0.94 });
        b.rect("gusset", bPt[0] - gR * 0.6, bPt[1] - gR * 1.1, gR * 1.2, gR * 1.1, { fill: steel, fillOpacity: 0.94 });
        if (i < bays) {
            const uNext = (i + 1) / bays;
            const tN = lerp(p0, p1, uNext);
            const bN = lerp(bot0, bot1, uNext);
            if (kind === "x-truss") {
                b.line("web", tPt[0], tPt[1], bN[0], bN[1], { stroke: steel, strokeWidth: 0.58, strokeOpacity: 0.86, nonScaling: "hatch" });
                b.line("web", bPt[0], bPt[1], tN[0], tN[1], { stroke: steel, strokeWidth: 0.58, strokeOpacity: 0.86, nonScaling: "hatch" });
            }
            else if (kind === "warren") {
                if (i % 2 === 0)
                    b.line("web", tPt[0], tPt[1], bN[0], bN[1], { stroke: steel, strokeWidth: 0.68, strokeOpacity: 0.88, nonScaling: "hatch" });
                else
                    b.line("web", bPt[0], bPt[1], tN[0], tN[1], { stroke: steel, strokeWidth: 0.68, strokeOpacity: 0.88, nonScaling: "hatch" });
            }
            else {
                // Pratt: diagonals slant down toward span center
                if (i < bays * 0.5)
                    b.line("web", tPt[0], tPt[1], bN[0], bN[1], { stroke: steel, strokeWidth: 0.65, strokeOpacity: 0.88, nonScaling: "hatch" });
                else
                    b.line("web", bPt[0], bPt[1], tN[0], tN[1], { stroke: steel, strokeWidth: 0.65, strokeOpacity: 0.88, nonScaling: "hatch" });
            }
        }
    }
    // Optional wooden ties & steel rail deck
    if (opts.deck !== false) {
        const deckY = -Math.max(3, depth * 0.14);
        b.quad("deck", [p0[0], p0[1] + deckY], [p1[0], p1[1] + deckY], p1, p0, { fill: PAL.umberDk, fillOpacity: 0.94 });
        const tieN = bays * 4;
        for (let i = 0; i <= tieN; i++) {
            const pt = lerp(p0, p1, i / tieN);
            b.line("ties", pt[0], pt[1] + deckY, pt[0] - 2, pt[1], { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.62, nonScaling: "hatch" });
        }
        b.line("hi", p0[0], p0[1] + deckY * 0.72, p1[0], p1[1] + deckY * 0.72, { stroke: PAL.paperWarm, strokeWidth: 0.55, strokeOpacity: 0.78, nonScaling: "contour" });
        b.line("hi", p0[0], p0[1] + deckY * 0.3, p1[0], p1[1] + deckY * 0.3, { stroke: PAL.paperWarm, strokeWidth: 0.55, strokeOpacity: 0.78, nonScaling: "contour" });
    }
    // Optional lattice steel trestle piers descending to street/riverbank
    if (opts.piers && opts.piers > 0 && opts.groundY !== undefined) {
        for (let k = 1; k <= opts.piers; k++) {
            const u = k / (opts.piers + 1);
            const top = lerp(bot0, bot1, u);
            const gy = opts.groundY;
            if (gy <= top[1] + 8)
                continue;
            const pw = Math.max(8, depth * 0.36);
            const segs = Math.max(2, Math.round((gy - top[1]) / (pw * 1.4)));
            b.line("post", top[0] - pw * 0.5, top[1], top[0] - pw * 0.7, gy, { stroke: steel, strokeWidth: 1.05, strokeOpacity: 0.92, nonScaling: "contour" });
            b.line("post", top[0] + pw * 0.5, top[1], top[0] + pw * 0.7, gy, { stroke: steel, strokeWidth: 1.05, strokeOpacity: 0.92, nonScaling: "contour" });
            for (let s = 0; s < segs; s++) {
                const ya = top[1] + ((gy - top[1]) * s) / segs;
                const yb = top[1] + ((gy - top[1]) * (s + 1)) / segs;
                const wa = pw * (0.5 + 0.2 * (s / segs));
                const wb = pw * (0.5 + 0.2 * ((s + 1) / segs));
                b.line("web", top[0] - wa, ya, top[0] + wb, yb, { stroke: steel, strokeWidth: 0.48, strokeOpacity: 0.82, nonScaling: "hatch" });
                b.line("web", top[0] + wa, ya, top[0] - wb, yb, { stroke: steel, strokeWidth: 0.48, strokeOpacity: 0.82, nonScaling: "hatch" });
            }
        }
    }
    b.flush(p);
}
const ARCHIVAL_SPINES = [
    PAL.cinnabar,
    PAL.prussian,
    PAL.paperWarm,
    PAL.ochre,
    PAL.slateDk,
    PAL.sage,
    PAL.umber,
    PAL.prussianLt,
];
/**
 * `@kiuzyx`-grade dense bookcase or studio chrome rack bay (`35–65` individual `3–8 px` spines per shelf,
 * title bands, horizontal folio stacks, leaning volumes, ring binders with index labels & finger holes)
 * — supports both boxes AND oblique perspective quads, batched into ~10 `<path>` nodes!
 */
export function denseBookshelf(p, polyOrBox, opts = {}) {
    const [tl, tr, br, bl] = toQuad4(polyOrBox);
    const shelves = Math.max(2, opts.shelves ?? 5);
    const frameCol = opts.frameColor ?? (opts.chromeRack ? PAL.slateLt : PAL.umberDk);
    const backCol = opts.backColor ?? (opts.chromeRack ? PAL.paperDeep : PAL.barkDk);
    const palette = opts.spinePalette ?? ARCHIVAL_SPINES;
    const b = new PathBatcher();
    const approxW = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
    const approxH = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
    // 1. Back cavity & outer side stiles
    b.quad("back", tl, tr, br, bl, { fill: backCol, fillOpacity: 0.96 });
    const stileU = clamp(6 / Math.max(40, approxW), 0.015, 0.04);
    b.quad("frame", tl, bilerp(tl, tr, br, bl, stileU, 0), bilerp(tl, tr, br, bl, stileU, 1), bl, { fill: frameCol, fillOpacity: 0.98 });
    b.quad("frame", bilerp(tl, tr, br, bl, 1 - stileU, 0), tr, br, bilerp(tl, tr, br, bl, 1 - stileU, 1), { fill: frameCol, fillOpacity: 0.98 });
    if (opts.chromeRack) {
        // Slotted studio shelf uprights + diagonal tension wire cross-brace
        const slots = Math.min(36, Math.round(approxH / 14));
        for (let s = 1; s < slots; s++) {
            const v = s / slots;
            const pL = bilerp(tl, tr, br, bl, stileU * 0.5, v);
            const pR = bilerp(tl, tr, br, bl, 1 - stileU * 0.5, v);
            b.line("slot", pL[0], pL[1] - 1.2, pL[0], pL[1] + 1.2, { stroke: PAL.ink, strokeWidth: 0.6, strokeOpacity: 0.7, nonScaling: "hatch" });
            b.line("slot", pR[0], pR[1] - 1.2, pR[0], pR[1] + 1.2, { stroke: PAL.ink, strokeWidth: 0.6, strokeOpacity: 0.7, nonScaling: "hatch" });
        }
        b.line("wire", tl[0], tl[1], br[0], br[1], { stroke: PAL.inkHair, strokeWidth: 0.4, strokeOpacity: 0.4, nonScaling: "hatch" });
        b.line("wire", tr[0], tr[1], bl[0], bl[1], { stroke: PAL.inkHair, strokeWidth: 0.4, strokeOpacity: 0.4, nonScaling: "hatch" });
    }
    const shelfThickV = clamp(6 / Math.max(60, approxH), 0.012, 0.032);
    const innerSpanU = 1 - stileU * 2;
    const stepV = (1 - shelfThickV) / shelves;
    for (let s = 0; s < shelves; s++) {
        const vTop = s * stepV + shelfThickV;
        const vBot = (s + 1) * stepV;
        const shelfH = vBot - vTop;
        // Shelf plank top & shadow lip
        b.quad("frame", bilerp(tl, tr, br, bl, 0, vBot), bilerp(tl, tr, br, bl, 1, vBot), bilerp(tl, tr, br, bl, 1, vBot + shelfThickV), bilerp(tl, tr, br, bl, 0, vBot + shelfThickV), { fill: frameCol, fillOpacity: 0.98 });
        b.quad("cavityShadow", bilerp(tl, tr, br, bl, stileU, vTop), bilerp(tl, tr, br, bl, 1 - stileU, vTop), bilerp(tl, tr, br, bl, 1 - stileU, vTop + shelfH * 0.18), bilerp(tl, tr, br, bl, stileU, vTop + shelfH * 0.18), { fill: PAL.ink, fillOpacity: 0.24 });
        // Pack shelf tightly with 3-8px vertical spines, occasional ring binders & horizontal top stack!
        let uCur = stileU + 0.004;
        const uEnd = 1 - stileU - 0.004;
        const avgBookU = clamp(5.6 / Math.max(80, approxW), 0.011, 0.042);
        while (uCur < uEnd - avgBookU * 0.8) {
            // Occasional horizontal stack of 3-5 flat folios
            if (uEnd - uCur > avgBookU * 5.5 && p.r() < 0.08) {
                const stackW = avgBookU * rand(p.r, 4.0, 6.2);
                const flatN = 3 + Math.floor(p.r() * 3);
                const flatH = (shelfH * 0.14);
                for (let k = 0; k < flatN; k++) {
                    const fv1 = vBot - k * flatH;
                    const fv0 = fv1 - flatH * 0.88;
                    const col = palette[Math.floor(p.r() * palette.length)];
                    b.quad(`sp-${col}`, bilerp(tl, tr, br, bl, uCur, fv0), bilerp(tl, tr, br, bl, uCur + stackW, fv0), bilerp(tl, tr, br, bl, uCur + stackW, fv1), bilerp(tl, tr, br, bl, uCur, fv1), { fill: col, fillOpacity: 0.96 });
                    const lnA = bilerp(tl, tr, br, bl, uCur, fv0);
                    const lnB = bilerp(tl, tr, br, bl, uCur + stackW, fv0);
                    b.line("gap", lnA[0], lnA[1], lnB[0], lnB[1], { stroke: PAL.ink, strokeWidth: 0.35, strokeOpacity: 0.65, nonScaling: "hatch" });
                }
                uCur += stackW + avgBookU * 0.35;
                continue;
            }
            // Ring binder (slightly wider, uniform tall height, white spine index tag & finger hole!)
            const isBinder = Boolean(opts.binders) && p.r() < 0.16 && uEnd - uCur > avgBookU * 2.2;
            const bw = isBinder ? avgBookU * rand(p.r, 1.85, 2.5) : avgBookU * rand(p.r, 0.58, 1.45);
            const u1 = Math.min(uEnd, uCur + bw);
            const bh = isBinder ? shelfH * rand(p.r, 0.86, 0.93) : shelfH * rand(p.r, 0.64, 0.93);
            const bv0 = vBot - bh;
            // Subtle 1-book lean near end of a shelf cluster
            const lean = !isBinder && p.r() < 0.06 && u1 + bw < uEnd ? bw * 0.45 : 0;
            const col = palette[Math.floor(p.r() * palette.length)];
            const p0 = bilerp(tl, tr, br, bl, uCur + lean, bv0);
            const p1 = bilerp(tl, tr, br, bl, u1 + lean, bv0);
            const p2 = bilerp(tl, tr, br, bl, u1, vBot);
            const p3 = bilerp(tl, tr, br, bl, uCur, vBot);
            b.quad(`sp-${col}`, p0, p1, p2, p3, { fill: col, fillOpacity: 0.96 });
            if (isBinder) {
                // White archival spine label + dark circular finger-pull ring
                const l0 = bilerp(tl, tr, br, bl, uCur + bw * 0.16, bv0 + bh * 0.14);
                const l1 = bilerp(tl, tr, br, bl, u1 - bw * 0.16, bv0 + bh * 0.14);
                const l2 = bilerp(tl, tr, br, bl, u1 - bw * 0.16, bv0 + bh * 0.44);
                const l3 = bilerp(tl, tr, br, bl, uCur + bw * 0.16, bv0 + bh * 0.44);
                b.quad("label", l0, l1, l2, l3, { fill: PAL.paper, fillOpacity: 0.94 });
                const holePt = bilerp(tl, tr, br, bl, (uCur + u1) * 0.5, bv0 + bh * 0.74);
                b.circle("hole", holePt[0], holePt[1], Math.max(1.4, Math.min(3.0, bw * approxW * 0.2)), { fill: PAL.ink, fillOpacity: 0.82 });
            }
            else if (p.r() < 0.72) {
                // Gold/cream spine title bands & classical raised binding ribs
                const tv = bv0 + bh * rand(p.r, 0.14, 0.28);
                const tA = bilerp(tl, tr, br, bl, uCur + lean * 0.8 + bw * 0.12, tv);
                const tB = bilerp(tl, tr, br, bl, u1 + lean * 0.8 - bw * 0.12, tv);
                b.line("band", tA[0], tA[1], tB[0], tB[1], { stroke: PAL.brassLt, strokeWidth: 0.55, strokeOpacity: 0.72, nonScaling: "hatch" });
                if (p.r() < 0.45) {
                    const tv2 = bv0 + bh * rand(p.r, 0.72, 0.84);
                    const tC = bilerp(tl, tr, br, bl, uCur + bw * 0.12, tv2);
                    const tD = bilerp(tl, tr, br, bl, u1 - bw * 0.12, tv2);
                    b.line("band", tC[0], tC[1], tD[0], tD[1], { stroke: PAL.paperWarm, strokeWidth: 0.42, strokeOpacity: 0.65, nonScaling: "hatch" });
                }
            }
            // Crisp 0.35px hairline separating every single spine
            b.line("gap", p0[0], p0[1], p3[0], p3[1], { stroke: PAL.ink, strokeWidth: 0.35, strokeOpacity: 0.62, nonScaling: "hatch" });
            uCur = u1 + (lean > 0 ? lean * 1.15 : 0.0012);
        }
    }
    // Top crown shelf plank & crisp perimeter contour
    b.quad("frame", tl, tr, bilerp(tl, tr, br, bl, 1, shelfThickV), bilerp(tl, tr, br, bl, 0, shelfThickV), { fill: frameCol, fillOpacity: 0.98 });
    b.line("rim", tl[0], tl[1], tr[0], tr[1], { stroke: PAL.litEdge, strokeWidth: 0.65, strokeOpacity: 0.72, nonScaling: "contour" });
    b.line("rimDk", tr[0], tr[1], br[0], br[1], { stroke: PAL.ink, strokeWidth: 0.68, strokeOpacity: 0.72, nonScaling: "contour" });
    b.flush(p);
}
/**
 * `@kiuzyx`-grade dense 2 AM studio NLE / DAW / CAD display (`kiuzyx_...031_0.jpg`):
 * slim matte bezel, top menu bar, left file browser tree, video/blueprint preview pane,
 * `65+`-clip multi-track timeline with audio waveforms, red playhead & mixer faders —
 * supports oblique 3D quads, batched via `PathBatcher` into ~10 `<path>`s!
 */
export function denseNleMonitor(p, polyOrBox, opts = {}) {
    const [tl, tr, br, bl] = toQuad4(polyOrBox);
    const tracks = Math.max(5, opts.tracks ?? 8);
    const bezelCol = opts.bezelColor ?? PAL.slateDk;
    const b = new PathBatcher();
    // Outer monitor housing & inner dark studio UI canvas
    b.quad("bezel", tl, tr, br, bl, { fill: bezelCol, fillOpacity: 0.99 });
    const m = 0.026;
    const sTL = bilerp(tl, tr, br, bl, m, m);
    const sTR = bilerp(tl, tr, br, bl, 1 - m, m);
    const sBR = bilerp(tl, tr, br, bl, 1 - m, 1 - m * 1.4);
    const sBL = bilerp(tl, tr, br, bl, m, 1 - m * 1.4);
    b.quad("screen", sTL, sTR, sBR, sBL, { fill: PAL.prussianDk, fillOpacity: 0.99 });
    const ui = (u0, v0, u1, v1, key, fill, op = 0.94) => {
        b.quad(key, bilerp(sTL, sTR, sBR, sBL, u0, v0), bilerp(sTL, sTR, sBR, sBL, u1, v0), bilerp(sTL, sTR, sBR, sBL, u1, v1), bilerp(sTL, sTR, sBR, sBL, u0, v1), { fill, fillOpacity: op });
    };
    const uiLine = (u0, v0, u1, v1, key, stroke, w = 0.42, op = 0.72) => {
        const a = bilerp(sTL, sTR, sBR, sBL, u0, v0);
        const c = bilerp(sTL, sTR, sBR, sBL, u1, v1);
        b.line(key, a[0], a[1], c[0], c[1], { stroke, strokeWidth: w, strokeOpacity: op, nonScaling: "hatch" });
    };
    // Top chrome toolbar & transport buttons
    ui(0, 0, 1, 0.065, "chrome", PAL.slate, 0.92);
    for (let i = 0; i < 8; i++)
        ui(0.02 + i * 0.048, 0.018, 0.056 + i * 0.048, 0.046, "uiText", PAL.paperWarm, 0.65);
    ui(0.45, 0.015, 0.56, 0.05, "meterBg", PAL.ink, 0.9);
    ui(0.46, 0.024, 0.52, 0.04, "clipCel", PAL.celadonLt, 0.9);
    // Left media/project browser tree (18 micro file rows)
    ui(0.01, 0.08, 0.21, 0.49, "panel", PAL.prussian, 0.9);
    for (let r = 0; r < 14; r++) {
        const vr = 0.1 + r * 0.027;
        const ind = (r % 4 === 0 ? 0.022 : 0.042);
        ui(ind, vr, ind + 0.014, vr + 0.014, "clipOch", r % 4 === 0 ? PAL.ochreLt : PAL.celadonLt, 0.85);
        ui(ind + 0.02, vr + 0.002, Math.min(0.195, ind + rand(p.r, 0.06, 0.14)), vr + 0.012, "uiText", PAL.paperWarm, 0.52);
    }
    // Upper center preview monitor (Tokyo nocturnal skyline thumbnail OR CAD plan)
    ui(0.225, 0.08, 0.76, 0.49, "previewBg", PAL.ink, 0.96);
    if (opts.mode === "cad") {
        for (let g = 1; g < 12; g++)
            uiLine(0.225 + g * 0.044, 0.08, 0.225 + g * 0.044, 0.49, "grid", PAL.inkDraft, 0.32, 0.42);
        for (let g = 1; g < 8; g++)
            uiLine(0.225, 0.08 + g * 0.05, 0.76, 0.08 + g * 0.05, "grid", PAL.inkDraft, 0.32, 0.42);
        ui(0.32, 0.16, 0.66, 0.41, "clipCel", PAL.celadonLt, 0.22);
        uiLine(0.32, 0.16, 0.66, 0.41, "wave", PAL.paperWarm, 0.55, 0.8);
        uiLine(0.32, 0.41, 0.66, 0.16, "wave", PAL.paperWarm, 0.55, 0.8);
    }
    else {
        // Mini spectral analyzer + nocturnal frame preview
        ui(0.24, 0.1, 0.48, 0.46, "panel", PAL.prussian, 0.92);
        ui(0.35, 0.14, 0.37, 0.42, "clipRed", PAL.cinnabarLt, 0.9);
        for (let k = 0; k < 22; k++) {
            const bx = 0.5 + k * 0.011;
            const bh = rand(p.r, 0.04, 0.3);
            ui(bx, 0.46 - bh, bx + 0.007, 0.46, k % 3 === 0 ? "clipCel" : "clipOch", k % 3 === 0 ? PAL.celadonLt : PAL.ochreLt, 0.82);
        }
    }
    // Right inspector / vertical channel mixer faders
    ui(0.775, 0.08, 0.99, 0.49, "panel", PAL.prussian, 0.92);
    for (let ch = 0; ch < 7; ch++) {
        const cxU = 0.795 + ch * 0.027;
        uiLine(cxU, 0.13, cxU, 0.44, "grid", PAL.ink, 0.6, 0.8);
        const fy = rand(p.r, 0.18, 0.38);
        ui(cxU - 0.009, fy, cxU + 0.009, fy + 0.022, "uiText", PAL.paperWarm, 0.92);
        ui(cxU - 0.004, fy + 0.028, cxU + 0.004, 0.44, "clipCel", PAL.celadonLt, 0.75);
    }
    // Lower 65+-clip multi-track timeline + ruler ticks + audio waveforms + playhead!
    ui(0.01, 0.51, 0.99, 0.985, "panel", PAL.prussian, 0.92);
    ui(0.01, 0.51, 0.99, 0.545, "chrome", PAL.slate, 0.85);
    for (let tk = 0; tk < 32; tk++) {
        const tu = 0.13 + (tk / 32) * 0.85;
        uiLine(tu, tk % 4 === 0 ? 0.514 : 0.528, tu, 0.545, "grid", PAL.paperWarm, 0.35, 0.65);
    }
    const clipCols = [
        ["clipRed", PAL.cinnabarLt],
        ["clipCel", PAL.celadonLt],
        ["clipOch", PAL.ochreLt],
        ["clipWis", PAL.wisteriaLt],
        ["clipBlu", PAL.prussianLt],
    ];
    const laneH = (0.975 - 0.55) / tracks;
    for (let trk = 0; trk < tracks; trk++) {
        const v0 = 0.55 + trk * laneH + 0.004;
        const v1 = 0.55 + (trk + 1) * laneH - 0.004;
        const vMid = (v0 + v1) * 0.5;
        // Track header strip + mute/solo tiny squares
        ui(0.015, v0, 0.118, v1, "header", PAL.slateDk, 0.92);
        ui(0.022, v0 + laneH * 0.25, 0.036, v1 - laneH * 0.25, "clipOch", PAL.ochreLt, 0.85);
        ui(0.042, v0 + laneH * 0.25, 0.056, v1 - laneH * 0.25, "clipCel", PAL.celadonLt, 0.78);
        uiLine(0.12, v1 + 0.002, 0.985, v1 + 0.002, "grid", PAL.ink, 0.35, 0.55);
        // 7-11 micro-clips per track = 60-85 individual clips!
        let cu = 0.13 + rand(p.r, 0, 0.04);
        const [ckey, ccol] = clipCols[trk % clipCols.length];
        while (cu < 0.94) {
            const cw = rand(p.r, 0.038, 0.115);
            const cu1 = Math.min(0.98, cu + cw);
            ui(cu, v0 + 0.002, cu1, v1 - 0.002, ckey, ccol, 0.86);
            // High-frequency waveform ticks inside each clip
            const wfN = Math.max(4, Math.round((cu1 - cu) * 95));
            for (let w = 1; w < wfN; w++) {
                const wu = cu + ((cu1 - cu) * w) / wfN;
                const amp = (v1 - v0) * rand(p.r, 0.12, 0.38);
                uiLine(wu, vMid - amp, wu, vMid + amp, "wave", PAL.ink, 0.32, 0.58);
            }
            cu = cu1 + rand(p.r, 0.008, 0.035);
        }
    }
    // Crisp crimson playhead scrubber line
    uiLine(0.44, 0.51, 0.44, 0.985, "playhead", PAL.cinnabarLt, 0.95, 0.95);
    b.line("rim", tl[0], tl[1], tr[0], tr[1], { stroke: PAL.litEdge, strokeWidth: 0.65, strokeOpacity: 0.7, nonScaling: "contour" });
    b.flush(p);
}
/**
 * `@kiuzyx`-grade modular studio / hi-fi equipment rack (`kiuzyx_...031_0.jpg`):
 * alternating anodized steel/aluminum faceplates, rack ears, `50+` rotary knobs with radial
 * indicator ticks, illuminated VU meters, EQ fader banks, patch-bay jacks & LED indicators
 * (ZERO beige polka-dot boxes!) — batched via `PathBatcher` into ~10 `<path>`s!
 */
export function denseAudioRack(p, polyOrBox, opts = {}) {
    const [tl, tr, br, bl] = toQuad4(polyOrBox);
    const units = Math.max(3, opts.units ?? 6);
    const b = new PathBatcher();
    const approxW = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
    const approxH = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
    b.quad("chassis", tl, tr, br, bl, { fill: opts.chassisColor ?? PAL.ink, fillOpacity: 0.98 });
    const uPanel = (u0, v0, u1, v1, key, fill, op = 0.96) => {
        b.quad(key, bilerp(tl, tr, br, bl, u0, v0), bilerp(tl, tr, br, bl, u1, v0), bilerp(tl, tr, br, bl, u1, v1), bilerp(tl, tr, br, bl, u0, v1), { fill, fillOpacity: op });
    };
    const unitH = 0.96 / units;
    for (let u = 0; u < units; u++) {
        const v0 = 0.02 + u * unitH + 0.005;
        const v1 = 0.02 + (u + 1) * unitH - 0.005;
        const vMid = (v0 + v1) * 0.5;
        const plateCol = u % 3 === 0 ? PAL.slateDk : u % 3 === 1 ? PAL.paperStone : PAL.prussianDk;
        const isLight = u % 3 === 1;
        uPanel(0.02, v0, 0.98, v1, `plate-${u % 3}`, plateCol, 0.98);
        // Rack-ear corner screws
        const scrR = clamp(approxH / (units * 18), 1.0, 2.2);
        for (const [su, sv] of [[0.042, v0 + unitH * 0.26], [0.042, v1 - unitH * 0.26], [0.958, v0 + unitH * 0.26], [0.958, v1 - unitH * 0.26]]) {
            const pt = bilerp(tl, tr, br, bl, su, sv);
            b.circle("screw", pt[0], pt[1], scrR, { fill: PAL.inkHair, fillOpacity: 0.85 });
        }
        const kind = u % 4;
        if (kind === 0) {
            // Dual illuminated amber VU meters + 6 rotary preamp knobs with ticks
            uPanel(0.08, v0 + unitH * 0.16, 0.24, v1 - unitH * 0.16, "vuBg", PAL.lantern, 0.92);
            uPanel(0.26, v0 + unitH * 0.16, 0.42, v1 - unitH * 0.16, "vuBg", PAL.lantern, 0.92);
            for (const vuU of [0.16, 0.34]) {
                const base = bilerp(tl, tr, br, bl, vuU, v1 - unitH * 0.2);
                const tip = bilerp(tl, tr, br, bl, vuU + rand(p.r, -0.05, 0.05), v0 + unitH * 0.26);
                b.line("needle", base[0], base[1], tip[0], tip[1], { stroke: PAL.cinnabarDk, strokeWidth: 0.65, strokeOpacity: 0.9, nonScaling: "contour" });
            }
            const knobR = clamp(approxW * 0.025, 2.2, 5.2);
            for (let k = 0; k < 7; k++) {
                const pt = bilerp(tl, tr, br, bl, 0.49 + k * 0.068, vMid);
                b.circle("knob", pt[0], pt[1], knobR, { fill: PAL.ink, fillOpacity: 0.95 });
                const ang = rand(p.r, -2.2, 0.8);
                b.line("tick", pt[0], pt[1], pt[0] + Math.cos(ang) * knobR * 0.85, pt[1] + Math.sin(ang) * knobR * 0.85, { stroke: PAL.paperWarm, strokeWidth: 0.6, strokeOpacity: 0.92, nonScaling: "contour" });
            }
        }
        else if (kind === 1) {
            // Graphic EQ / 12-band vertical fader bank + LED ladder
            for (let fIdx = 0; fIdx < 12; fIdx++) {
                const fu = 0.09 + fIdx * 0.064;
                const a = bilerp(tl, tr, br, bl, fu, v0 + unitH * 0.18);
                const c = bilerp(tl, tr, br, bl, fu, v1 - unitH * 0.18);
                b.line("slot", a[0], a[1], c[0], c[1], { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.88, nonScaling: "contour" });
                const fv = rand(p.r, v0 + unitH * 0.24, v1 - unitH * 0.34);
                uPanel(fu - 0.014, fv, fu + 0.014, fv + unitH * 0.14, "cap", isLight ? PAL.slateDk : PAL.paperWarm, 0.96);
            }
            // Power LED
            const led = bilerp(tl, tr, br, bl, 0.9, vMid);
            b.circle("ledRed", led[0], led[1], 2.0, { fill: PAL.cinnabarLt, fillOpacity: 0.95 });
        }
        else if (kind === 2) {
            // 2-row modular synth patch-bay: 16 brass/chrome jacks + toggle switches
            const jR = clamp(approxW * 0.014, 1.5, 3.2);
            for (let row = 0; row < 2; row++) {
                const rv = row === 0 ? v0 + unitH * 0.32 : v1 - unitH * 0.32;
                for (let col = 0; col < 12; col++) {
                    const pt = bilerp(tl, tr, br, bl, 0.09 + col * 0.072, rv);
                    b.circle("jackRing", pt[0], pt[1], jR, { fill: PAL.paperStone, fillOpacity: 0.9 });
                    b.circle("knob", pt[0], pt[1], jR * 0.52, { fill: PAL.ink, fillOpacity: 0.96 });
                }
            }
        }
        else {
            // Digital display deck + transport buttons + jog dial
            uPanel(0.08, v0 + unitH * 0.2, 0.44, v1 - unitH * 0.2, "lcd", PAL.ink, 0.96);
            uPanel(0.11, v0 + unitH * 0.36, 0.28, v0 + unitH * 0.52, "lcdGlow", PAL.celadonLt, 0.88);
            uPanel(0.11, v0 + unitH * 0.6, 0.38, v0 + unitH * 0.72, "lcdAmber", PAL.lantern, 0.82);
            for (let btn = 0; btn < 6; btn++) {
                uPanel(0.48 + btn * 0.052, v0 + unitH * 0.32, 0.518 + btn * 0.052, v1 - unitH * 0.32, "cap", PAL.paperWarm, 0.86);
            }
            const jog = bilerp(tl, tr, br, bl, 0.87, vMid);
            const jRad = clamp(approxH / (units * 3.1), 4.0, 9.5);
            b.circle("knob", jog[0], jog[1], jRad, { fill: PAL.slate, fillOpacity: 0.96 });
            b.circle("screw", jog[0] + jRad * 0.4, jog[1] - jRad * 0.2, jRad * 0.22, { fill: PAL.paperWarm, fillOpacity: 0.9 });
        }
        // Crisp horizontal module seam
        const sA = bilerp(tl, tr, br, bl, 0.02, v1 + 0.002);
        const sB = bilerp(tl, tr, br, bl, 0.98, v1 + 0.002);
        b.line("seam", sA[0], sA[1], sB[0], sB[1], { stroke: PAL.litEdge, strokeWidth: 0.38, strokeOpacity: 0.42, nonScaling: "hatch" });
    }
    b.flush(p);
}
/**
 * `@devteamdrew` / `@claudeai` 5-tone outline-free gouache stipple tree/cypress/bush cluster:
 * `140–260` velvety midpoint-Q dabs per tree across 5 tonal ranks (Prussian-pine core → dark body →
 * mid olive → sunlit sage → warm crown rim) + peeking pale/umber trunks & twigs + ragged cast shadows —
 * batched via `PathBatcher` into ONLY 6–7 `<path>` DOM nodes!
 */
export function stippleTreeCluster(p, r, clusters, opts = {}) {
    if (!clusters.length)
        return;
    const pal = opts.palette ?? {};
    // Tight analogous pine -> deep celadon -> olive sage -> sunlit moss-sage ramp (zero yellow/navy confetti!)
    const c0 = pal.deepCore ?? PAL.sageDk;
    const c1 = pal.darkBody ?? PAL.celadonDk;
    const c2 = pal.midOlive ?? PAL.sage;
    const c3 = pal.litSage ?? PAL.sageLt;
    const c4 = pal.sunCrown ?? PAL.celadonLt;
    const accent = pal.accent;
    const trunkCol = pal.trunk ?? PAL.umber;
    const baseDab = opts.dabSize ?? 7.8;
    const light = opts.lightDir ?? LIGHT;
    const b = new PathBatcher();
    // Pass 1: Ground cast shadows beneath trunks/bases
    if (opts.groundShadow !== false) {
        for (const cl of clusters) {
            const gy = cl.trunkBaseY ?? cl.cy + cl.ry * 0.92;
            const shW = cl.rx * 1.15;
            for (let i = 0; i < 14; i++) {
                const sx = cl.cx + rand(r, -0.35, 1.35) * shW;
                const sy = gy + rand(r, -3, 10);
                b.dab("gShadow", sx, sy, rand(r, 8, 22), rand(r, 2.2, 4.8), rand(r, -0.08, 0.08), r, {
                    fill: PAL.inkMid,
                    fillOpacity: 0.24,
                });
            }
        }
    }
    // Pass 1b: Organic multi-lobed gouache underpainting core (~0.76x radius) behind trunks & dabs
    // so every crown has velvety painterly body (zero Swiss-cheese white-wall holes!) while edges stay feathery.
    for (const cl of clusters) {
        const spire = cl.spire ?? 0;
        const corePts = [];
        if (spire > 0) {
            // Tapered organic cypress core
            const steps = 7;
            for (let i = 0; i <= steps; i++) {
                const uy = -0.82 + (i / steps) * 1.64;
                const w = clamp(Math.pow(Math.max(0.001, (uy + 1.06) * 0.5), 0.74 * spire), 0.08, 1.0) * 0.76;
                corePts.push([cl.cx + cl.rx * w * rand(r, 0.9, 1.08), cl.cy + cl.ry * uy]);
            }
            for (let i = steps; i >= 0; i--) {
                const uy = -0.82 + (i / steps) * 1.64;
                const w = clamp(Math.pow(Math.max(0.001, (uy + 1.06) * 0.5), 0.74 * spire), 0.08, 1.0) * 0.76;
                corePts.push([cl.cx - cl.rx * w * rand(r, 0.9, 1.08), cl.cy + cl.ry * uy]);
            }
        }
        else {
            const verts = 16;
            for (let i = 0; i < verts; i++) {
                const a = (i / verts) * TAU;
                const lobe = (0.84 + 0.2 * Math.sin(a * 3 + cl.cx * 0.03) + 0.09 * Math.cos(a * 5)) * 0.76 * rand(r, 0.92, 1.08);
                corePts.push([cl.cx + Math.cos(a) * cl.rx * lobe, cl.cy + Math.sin(a) * cl.ry * lobe]);
            }
        }
        b.addPath("core", closedSmooth(corePts), { fill: c1, fillOpacity: 0.93 });
    }
    // Pass 2: Pre-classify all 5 tonal ranks + trunks so trunks peek naturally THROUGH canopy openings!
    const rankKeys = [
        ["r0", c0, 0.92],
        ["r1", c1, 0.94],
        ["r2", c2, 0.92],
        ["r3", c3, 0.88],
        ["r4", c4, 0.82],
    ];
    const frontBatch = new PathBatcher();
    for (const cl of clusters) {
        const spire = cl.spire ?? 0;
        const areaScale = Math.sqrt(Math.max(200, cl.rx * cl.ry)) / 36;
        const totalDabs = Math.max(48, Math.min(260, Math.round(68 * areaScale * (cl.density ?? 1))));
        // Visible trunk & upward Y-forks drawn between dark core (r0/r1) and front lit foliage (r2/r3/r4)!
        if (cl.trunkBaseY !== undefined && cl.trunkBaseY > cl.cy) {
            const tw = cl.trunkWidth ?? Math.max(4.5, cl.rx * 0.14);
            const topY = cl.cy + cl.ry * 0.08;
            const midX = cl.cx + rand(r, -tw * 0.5, tw * 0.5);
            const midY = (cl.trunkBaseY + topY) * 0.52;
            const tPts = [[cl.cx, cl.trunkBaseY], [midX, midY], [cl.cx + rand(r, -tw, tw), topY]];
            b.addPath("trunk", calligraphicRibbon(tPts, tw * 1.15, tw * 0.72, tw * 0.35, r), { fill: trunkCol, fillOpacity: 0.95 });
            for (const side of [-1, 1]) {
                const fk = [
                    [midX, midY - (midY - topY) * 0.35],
                    [midX + side * cl.rx * 0.24, topY - cl.ry * 0.12],
                    [cl.cx + side * cl.rx * 0.44, cl.cy - cl.ry * 0.26],
                ];
                b.addPath("trunk", calligraphicRibbon(fk, tw * 0.52, tw * 0.32, 0.8, r), { fill: trunkCol, fillOpacity: 0.92 });
            }
        }
        for (let i = 0; i < totalDabs; i++) {
            let ux;
            let uy;
            if (spire > 0) {
                uy = rand(r, -1, 1);
                const wAtY = clamp(Math.pow(Math.max(0.001, (uy + 1.06) * 0.5), 0.74 * spire), 0.08, 1.04);
                ux = rand(r, -1, 1) * wAtY;
            }
            else {
                const a = r() * TAU;
                const lobe = 0.84 + 0.22 * Math.sin(a * 3 + cl.cx * 0.03) + 0.1 * Math.cos(a * 5);
                const radU = Math.pow(r(), 0.54) * lobe;
                ux = Math.cos(a) * radU;
                uy = Math.sin(a) * radU;
            }
            const x = cl.cx + ux * cl.rx;
            const y = cl.cy + uy * cl.ry;
            const edge = Math.hypot(ux, uy);
            const isEdge = edge > 0.84;
            const sz = baseDab * (isEdge ? rand(r, 0.34, 0.72) : rand(r, 0.65, 1.32));
            // Horizontally stretched gouache brush-belly touches (never round polka-dots!)
            const dabRx = sz * rand(r, 1.15, 1.65);
            const dabRy = sz * rand(r, 0.52, 0.85);
            const dabAng = rand(r, -0.32, 0.32);
            const sun = ux * light[0] + uy * light[1] + rand(r, -0.26, 0.26);
            let rank;
            if (sun < -0.34)
                rank = 0;
            else if (sun < -0.04)
                rank = 1;
            else if (sun < 0.28)
                rank = 2;
            else if (sun < 0.58)
                rank = 3;
            else
                rank = 4;
            if (accent && rank >= 3 && r() < 0.08) {
                frontBatch.dab("accent", x, y, dabRx * 0.9, dabRy * 0.95, dabAng, r, { fill: accent, fillOpacity: 0.92 });
                continue;
            }
            const [rk, rc, rop] = rankKeys[rank];
            // Deep shadow ranks sit BEHIND trunk forks; mid & sunlit foliage sit IN FRONT for natural peeking bark!
            const targetBatch = rank <= 1 ? b : frontBatch;
            targetBatch.dab(rk, x, y, dabRx, dabRy, dabAng, r, {
                fill: rc,
                fillOpacity: rop,
            });
        }
    }
    b.flush(p);
    frontBatch.flush(p);
}
