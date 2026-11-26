// CNC-aligned geometric monoline embroidery alphabet emitting exact SVG path `d` strings.
//
// Every glyph aligns its outer ink cap-line and baseline to 0.00 px on [0, h] (accounting for
// half strokeWidth on horizontal bars & bowls) and emits pure M / L / C / Z geometry so that
// DOM <svg> and Canvas2D Path2D GPU bakes register to 0.00 px at any rotation or scale.
const KAPPA = 0.5522847498;
const fmt = (n) => {
    const r = Math.round(n * 100) / 100;
    return Object.is(r, -0) ? "0" : String(r);
};
class PathBuilder {
    #m;
    #parts = [];
    constructor(m) {
        this.#m = m;
    }
    #pt(x, y) {
        const [a, b, c, d, tx, ty] = this.#m;
        return `${fmt(a * x + c * y + tx)} ${fmt(b * x + d * y + ty)}`;
    }
    M(x, y) {
        this.#parts.push(`M${this.#pt(x, y)}`);
        return this;
    }
    L(x, y) {
        this.#parts.push(`L${this.#pt(x, y)}`);
        return this;
    }
    C(x1, y1, x2, y2, x, y) {
        this.#parts.push(`C${this.#pt(x1, y1)} ${this.#pt(x2, y2)} ${this.#pt(x, y)}`);
        return this;
    }
    Z() {
        this.#parts.push("Z");
        return this;
    }
    /** Full closed ellipse via 4 exact cubic Bezier quadrants. */
    ellipse(cx, cy, rx, ry) {
        const kx = rx * KAPPA;
        const ky = ry * KAPPA;
        this.M(cx, cy - ry)
            .C(cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy)
            .C(cx + rx, cy + ky, cx + kx, cy + ry, cx, cy + ry)
            .C(cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy)
            .C(cx - rx, cy - ky, cx - kx, cy - ry, cx, cy - ry)
            .Z();
        return this;
    }
    /** Elliptical arc from `a0` to `a1` (radians, Canvas2D Y-down angle convention), subdivided cleanly into cubics. */
    ellipseArc(cx, cy, rx, ry, a0, a1, move = true) {
        const span = a1 - a0;
        const segs = Math.max(1, Math.ceil(Math.abs(span) / (Math.PI * 0.5)));
        const step = span / segs;
        const k = (4 / 3) * Math.tan(step * 0.25);
        for (let i = 0; i < segs; i++) {
            const t0 = a0 + i * step;
            const t1 = t0 + step;
            const c0 = Math.cos(t0);
            const s0 = Math.sin(t0);
            const c1 = Math.cos(t1);
            const s1 = Math.sin(t1);
            const x0 = cx + rx * c0;
            const y0 = cy + ry * s0;
            const x1 = cx + rx * c1;
            const y1 = cy + ry * s1;
            const cp1x = x0 - k * rx * s0;
            const cp1y = y0 + k * ry * c0;
            const cp2x = x1 + k * rx * s1;
            const cp2y = y1 - k * ry * c1;
            if (i === 0 && move)
                this.M(x0, y0);
            this.C(cp1x, cp1y, cp2x, cp2y, x1, y1);
        }
        return this;
    }
    rect(x, y, w, h) {
        this.M(x, y)
            .L(x + w, y)
            .L(x + w, y + h)
            .L(x, y + h)
            .Z();
        return this;
    }
    toString() {
        return this.#parts.join(" ");
    }
}
const GLYPHS = {
    A: {
        width: 0.72,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.05 * w, h).L(0.45 * w, hs).L(0.55 * w, hs).L(0.95 * w, h);
            p.M(0.20 * w, 0.69 * h).L(0.80 * w, 0.69 * h);
        },
    },
    B: {
        width: 0.68,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.14 * w, h - hs)
                .L(0.14 * w, hs)
                .L(0.52 * w, hs)
                .C(0.90 * w, hs, 0.90 * w, 0.48 * h, 0.52 * w, 0.48 * h)
                .L(0.14 * w, 0.48 * h);
            p.M(0.52 * w, 0.48 * h)
                .C(0.96 * w, 0.48 * h, 0.96 * w, h - hs, 0.54 * w, h - hs)
                .L(0.14 * w, h - hs);
        },
    },
    C: {
        width: 0.68,
        emit(p, _f, _b, _s, w, h, hs) {
            const rx = 0.44 * w;
            const ry = Math.max(1, h * 0.5 - hs);
            p.ellipseArc(0.52 * w, 0.50 * h, rx, ry, -0.22 * Math.PI, -1.78 * Math.PI);
        },
    },
    D: {
        width: 0.70,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.12 * w, hs)
                .L(0.46 * w, hs)
                .C(0.95 * w, hs, 0.95 * w, h - hs, 0.46 * w, h - hs)
                .L(0.12 * w, h - hs)
                .Z();
        },
    },
    E: {
        width: 0.62,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.92 * w, hs).L(0.14 * w, hs).L(0.14 * w, h - hs).L(0.94 * w, h - hs);
            p.M(0.14 * w, 0.49 * h).L(0.82 * w, 0.49 * h);
        },
    },
    F: {
        width: 0.58,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.94 * w, hs).L(0.14 * w, hs).L(0.14 * w, h);
            p.M(0.14 * w, 0.50 * h).L(0.82 * w, 0.50 * h);
        },
    },
    G: {
        width: 0.72,
        emit(p, _f, _b, _s, w, h, hs) {
            const rx = 0.44 * w;
            const ry = Math.max(1, h * 0.5 - hs);
            const cx = 0.52 * w;
            p.ellipseArc(cx, 0.50 * h, rx, ry, -0.22 * Math.PI, -1.94 * Math.PI)
                .L(cx + rx, 0.54 * h)
                .L(0.54 * w, 0.54 * h);
        },
    },
    H: {
        width: 0.68,
        emit(p, _f, _b, _s, w, h) {
            p.M(0.14 * w, 0).L(0.14 * w, h);
            p.M(0.86 * w, 0).L(0.86 * w, h);
            p.M(0.14 * w, 0.49 * h).L(0.86 * w, 0.49 * h);
        },
    },
    I: {
        width: 0.40,
        emit(p, _f, _b, _s, w, h, hs, style) {
            p.M(0.50 * w, 0).L(0.50 * w, h);
            if (style === "mono") {
                p.M(0.06 * w, hs).L(0.94 * w, hs);
                p.M(0.06 * w, h - hs).L(0.94 * w, h - hs);
            }
        },
    },
    J: {
        width: 0.58,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.78 * w, 0)
                .L(0.78 * w, 0.64 * h)
                .C(0.78 * w, h - hs * 0.6, 0.14 * w, h - hs * 0.6, 0.14 * w, 0.68 * h);
        },
    },
    K: {
        width: 0.68,
        emit(p, _f, _b, _s, w, h) {
            p.M(0.14 * w, 0).L(0.14 * w, h);
            p.M(0.90 * w, 0).L(0.18 * w, 0.56 * h);
            p.M(0.38 * w, 0.42 * h).L(0.94 * w, h);
        },
    },
    L: {
        width: 0.56,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.16 * w, 0).L(0.16 * w, h - hs).L(0.94 * w, h - hs);
        },
    },
    M: {
        width: 0.82,
        emit(_p, _f, b, _s, w, h, hs) {
            b.M(0.10 * w, h).L(0.10 * w, hs).L(0.50 * w, 0.68 * h).L(0.90 * w, hs).L(0.90 * w, h);
        },
    },
    N: {
        width: 0.70,
        emit(_p, _f, b, _s, w, h, hs) {
            b.M(0.14 * w, h).L(0.14 * w, hs).L(0.86 * w, h - hs).L(0.86 * w, 0);
        },
    },
    O: {
        width: 0.74,
        emit(p, _f, _b, _s, w, h, hs) {
            p.ellipse(0.50 * w, 0.50 * h, 0.41 * w, Math.max(1, h * 0.5 - hs));
        },
    },
    P: {
        width: 0.64,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.14 * w, h)
                .L(0.14 * w, hs)
                .L(0.54 * w, hs)
                .C(0.95 * w, hs, 0.95 * w, 0.54 * h, 0.54 * w, 0.54 * h)
                .L(0.14 * w, 0.54 * h);
        },
    },
    Q: {
        width: 0.76,
        emit(p, _f, _b, _s, w, h, hs) {
            p.ellipse(0.49 * w, 0.49 * h, 0.40 * w, Math.max(1, h * 0.49 - hs));
            p.M(0.56 * w, 0.64 * h).L(0.94 * w, h);
        },
    },
    R: {
        width: 0.68,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.14 * w, h)
                .L(0.14 * w, hs)
                .L(0.52 * w, hs)
                .C(0.93 * w, hs, 0.93 * w, 0.52 * h, 0.52 * w, 0.52 * h)
                .L(0.14 * w, 0.52 * h);
            p.M(0.52 * w, 0.52 * h).L(0.92 * w, h);
        },
    },
    S: {
        width: 0.66,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.87 * w, 0.24 * h)
                .C(0.85 * w, hs * 0.7, 0.13 * w, hs * 0.7, 0.13 * w, 0.25 * h)
                .C(0.13 * w, 0.47 * h, 0.87 * w, 0.47 * h, 0.87 * w, 0.73 * h)
                .C(0.87 * w, h - hs * 0.7, 0.13 * w, h - hs * 0.7, 0.11 * w, 0.75 * h);
        },
    },
    T: {
        width: 0.66,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.02 * w, hs).L(0.98 * w, hs);
            p.M(0.50 * w, hs).L(0.50 * w, h);
        },
    },
    U: {
        width: 0.70,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.14 * w, 0)
                .L(0.14 * w, 0.62 * h)
                .C(0.14 * w, h - hs * 0.6, 0.86 * w, h - hs * 0.6, 0.86 * w, 0.62 * h)
                .L(0.86 * w, 0);
        },
    },
    V: {
        width: 0.70,
        emit(_p, _f, b, _s, w, h, hs) {
            b.M(0.06 * w, 0).L(0.47 * w, h - hs).L(0.53 * w, h - hs).L(0.94 * w, 0);
        },
    },
    W: {
        width: 0.88,
        emit(_p, _f, b, _s, w, h, hs) {
            b.M(0.06 * w, 0)
                .L(0.26 * w, h - hs)
                .L(0.50 * w, 0.32 * h)
                .L(0.74 * w, h - hs)
                .L(0.94 * w, 0);
        },
    },
    X: {
        width: 0.70,
        emit(p, _f, _b, _s, w, h) {
            p.M(0.08 * w, 0).L(0.92 * w, h);
            p.M(0.92 * w, 0).L(0.08 * w, h);
        },
    },
    Y: {
        width: 0.68,
        emit(p, _f, _b, _s, w, h) {
            p.M(0.06 * w, 0).L(0.50 * w, 0.52 * h).L(0.94 * w, 0);
            p.M(0.50 * w, 0.52 * h).L(0.50 * w, h);
        },
    },
    Z: {
        width: 0.64,
        emit(_p, _f, b, _s, w, h, hs) {
            b.M(0.08 * w, hs).L(0.90 * w, hs).L(0.10 * w, h - hs).L(0.92 * w, h - hs);
        },
    },
    "0": {
        width: 0.70,
        emit(p, _f, _b, s, w, h, hs, _style, slashedZero) {
            p.ellipse(0.50 * w, 0.50 * h, 0.40 * w, Math.max(1, h * 0.5 - hs));
            if (slashedZero) {
                s.M(0.76 * w, 0.16 * h).L(0.24 * w, 0.84 * h);
            }
        },
    },
    "1": {
        width: 0.50,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.16 * w, 0.24 * h).L(0.52 * w, hs).L(0.52 * w, h - hs);
            p.M(0.12 * w, h - hs).L(0.90 * w, h - hs);
        },
    },
    "2": {
        width: 0.66,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.11 * w, 0.28 * h)
                .C(0.11 * w, hs * 0.5, 0.89 * w, hs * 0.5, 0.87 * w, 0.28 * h)
                .C(0.85 * w, 0.50 * h, 0.36 * w, 0.66 * h, 0.12 * w, h - hs)
                .L(0.92 * w, h - hs);
        },
    },
    "3": {
        width: 0.66,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.14 * w, 0.20 * h)
                .C(0.18 * w, hs * 0.5, 0.86 * w, hs * 0.5, 0.86 * w, 0.26 * h)
                .C(0.86 * w, 0.45 * h, 0.56 * w, 0.49 * h, 0.36 * w, 0.49 * h)
                .C(0.62 * w, 0.49 * h, 0.88 * w, 0.54 * h, 0.88 * w, 0.74 * h)
                .C(0.88 * w, h - hs * 0.5, 0.16 * w, h - hs * 0.5, 0.12 * w, 0.78 * h);
        },
    },
    "4": {
        width: 0.68,
        emit(_p, _f, b, _s, w, h, hs) {
            b.M(0.74 * w, h)
                .L(0.74 * w, hs)
                .L(0.66 * w, hs)
                .L(0.08 * w, 0.68 * h)
                .L(0.96 * w, 0.68 * h);
        },
    },
    "5": {
        width: 0.66,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.86 * w, hs)
                .L(0.18 * w, hs)
                .L(0.14 * w, 0.47 * h)
                .C(0.32 * w, 0.38 * h, 0.88 * w, 0.38 * h, 0.88 * w, 0.68 * h)
                .C(0.88 * w, h - hs * 0.4, 0.20 * w, h - hs * 0.4, 0.12 * w, 0.80 * h);
        },
    },
    "6": {
        width: 0.68,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.84 * w, 0.16 * h)
                .C(0.66 * w, hs * 0.4, 0.15 * w, 0.06 * h, 0.13 * w, 0.50 * h)
                .C(0.11 * w, h - hs * 0.6, 0.56 * w, h - hs * 0.4, 0.78 * w, 0.86 * h)
                .C(0.94 * w, 0.74 * h, 0.90 * w, 0.42 * h, 0.54 * w, 0.42 * h)
                .C(0.28 * w, 0.42 * h, 0.15 * w, 0.54 * h, 0.13 * w, 0.68 * h);
        },
    },
    "7": {
        width: 0.64,
        emit(_p, _f, b, _s, w, h, hs) {
            b.M(0.08 * w, hs).L(0.92 * w, hs).L(0.32 * w, h);
        },
    },
    "8": {
        width: 0.68,
        emit(p, _f, _b, _s, w, h, hs) {
            p.ellipse(0.50 * w, 0.26 * h + hs * 0.35, 0.34 * w, Math.max(1, 0.24 * h - hs * 0.5));
            p.ellipse(0.50 * w, 0.73 * h - hs * 0.35, 0.39 * w, Math.max(1, 0.26 * h - hs * 0.5));
        },
    },
    "9": {
        width: 0.68,
        emit(p, _f, _b, _s, w, h, hs) {
            p.M(0.16 * w, 0.84 * h)
                .C(0.34 * w, h - hs * 0.4, 0.85 * w, 0.94 * h, 0.87 * w, 0.50 * h)
                .C(0.89 * w, hs * 0.6, 0.44 * w, hs * 0.4, 0.22 * w, 0.14 * h)
                .C(0.06 * w, 0.26 * h, 0.10 * w, 0.58 * h, 0.46 * w, 0.58 * h)
                .C(0.72 * w, 0.58 * h, 0.85 * w, 0.46 * h, 0.87 * w, 0.32 * h);
        },
    },
    ".": {
        width: 0.26,
        emit(_p, f, _b, _s, w, h, hs) {
            const sz = Math.max(hs * 2.24, 0.22 * h);
            f.rect(0.50 * w - sz * 0.5, h - sz, sz, sz);
        },
    },
    "·": {
        width: 0.34,
        emit(_p, f, _b, _s, w, h, hs) {
            const r = Math.max(hs * 1.15, 0.14 * h);
            f.ellipse(0.50 * w, 0.50 * h, r, r);
        },
    },
    "-": {
        width: 0.52,
        emit(p, _f, _b, _s, w, h) {
            p.M(0.08 * w, 0.52 * h).L(0.92 * w, 0.52 * h);
        },
    },
    "/": {
        width: 0.56,
        emit(p, _f, _b, _s, w, h) {
            p.M(0.84 * w, 0).L(0.16 * w, h);
        },
    },
    ":": {
        width: 0.28,
        emit(_p, f, _b, _s, w, h, hs) {
            const sz = Math.max(hs * 2.1, 0.19 * h);
            f.rect(0.50 * w - sz * 0.5, 0.24 * h, sz, sz);
            f.rect(0.50 * w - sz * 0.5, 0.76 * h - sz, sz, sz);
        },
    },
    "[": {
        width: 0.44,
        emit(p, _f, _b, _s, w, h) {
            const pad = 0.08 * h;
            p.M(0.88 * w, -pad).L(0.22 * w, -pad).L(0.22 * w, h + pad).L(0.88 * w, h + pad);
        },
    },
    "]": {
        width: 0.44,
        emit(p, _f, _b, _s, w, h) {
            const pad = 0.08 * h;
            p.M(0.12 * w, -pad).L(0.78 * w, -pad).L(0.78 * w, h + pad).L(0.12 * w, h + pad);
        },
    },
    ">": {
        width: 0.54,
        emit(p, _f, _b, _s, w, h) {
            p.M(0.12 * w, 0.18 * h).L(0.86 * w, 0.50 * h).L(0.12 * w, 0.82 * h);
        },
    },
    "<": {
        width: 0.54,
        emit(p, _f, _b, _s, w, h) {
            p.M(0.88 * w, 0.18 * h).L(0.14 * w, 0.50 * h).L(0.88 * w, 0.82 * h);
        },
    },
    " ": {
        width: 0.42,
        emit() { },
    },
};
export function glyphAdvance(ch, capH, style, widthScale = 1.0) {
    if (ch === "I" && style === "sans")
        return 0.25 * capH * widthScale;
    const spec = GLYPHS[ch];
    return (spec ? spec.width : 0.6) * capH * widthScale;
}
export function measureStrokeText(text, capH, tracking, style, widthScale = 1.0) {
    let total = 0;
    for (let i = 0; i < text.length; i++) {
        total += glyphAdvance(text[i], capH, style, widthScale);
        if (i < text.length - 1)
            total += tracking;
    }
    return total;
}
export function buildLinearTextPaths(text, x, yCenter, capH, strokeW, tracking, style, align = "left", widthScale = 1.0, slashedZero = false) {
    const totalW = measureStrokeText(text, capH, tracking, style, widthScale);
    let cursor = align === "center" ? x - totalW * 0.5 : align === "right" ? x - totalW : x;
    const yTop = yCenter - capH * 0.5;
    const hs = strokeW * 0.5;
    const sParts = [];
    const fParts = [];
    const bParts = [];
    const slParts = [];
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const adv = glyphAdvance(ch, capH, style, widthScale);
        const spec = GLYPHS[ch];
        if (spec && ch !== " ") {
            const m = [1, 0, 0, 1, cursor, yTop];
            const sp = new PathBuilder(m);
            const fp = new PathBuilder(m);
            const bp = new PathBuilder(m);
            const slp = new PathBuilder(m);
            spec.emit(sp, fp, bp, slp, adv, capH, hs, style, slashedZero);
            if (sp.toString())
                sParts.push(sp.toString());
            if (fp.toString())
                fParts.push(fp.toString());
            if (bp.toString())
                bParts.push(bp.toString());
            if (slp.toString())
                slParts.push(slp.toString());
        }
        cursor += adv + tracking;
    }
    return {
        strokeD: sParts.join(" "),
        fillD: fParts.join(" "),
        bevelD: bParts.join(" "),
        slashD: slParts.join(" "),
    };
}
/**
 * Emits curved lettering around a circular arc centered at (cx, cy).
 * - `mode = "clockwise"`: continuous clockwise seal text (0 deg = 12 o'clock), bottoms face center.
 * - `mode = "bottomUpright"`: runs left-to-right along the lower arc (startDeg > endDeg, e.g. 225 -> 135)
 *   with glyph tops facing center so bottom text reads right-side up!
 */
export function buildCircularArcTextPaths(text, cx, cy, radius, startDeg, endDeg, capH, strokeW, style, mode = "clockwise", slashedZero = false) {
    const chars = [...text];
    const advances = chars.map((ch) => glyphAdvance(ch, capH, style));
    const totalAdv = advances.reduce((a, b) => a + b, 0);
    const hs = strokeW * 0.5;
    const sParts = [];
    const fParts = [];
    const bParts = [];
    const slParts = [];
    if (mode === "clockwise") {
        const totalSpanRad = ((endDeg - startDeg) * Math.PI) / 180;
        const naturalArcRad = totalAdv / radius;
        const gapRad = chars.length > 1 ? (totalSpanRad - naturalArcRad) / (chars.length - 1) : 0;
        let curRad = (startDeg * Math.PI) / 180;
        for (let i = 0; i < chars.length; i++) {
            const ch = chars[i];
            const adv = advances[i];
            const charArc = adv / radius;
            const midRad = curRad + charArc * 0.5;
            const spec = GLYPHS[ch];
            if (spec && ch !== " ") {
                const cos = Math.cos(midRad);
                const sin = Math.sin(midRad);
                const ox = -adv * 0.5;
                const oy = -radius - capH * 0.5;
                const m = [cos, sin, -sin, cos, cx + cos * ox - sin * oy, cy + sin * ox + cos * oy];
                const sp = new PathBuilder(m);
                const fp = new PathBuilder(m);
                const bp = new PathBuilder(m);
                const slp = new PathBuilder(m);
                spec.emit(sp, fp, bp, slp, adv, capH, hs, style, slashedZero);
                if (sp.toString())
                    sParts.push(sp.toString());
                if (fp.toString())
                    fParts.push(fp.toString());
                if (bp.toString())
                    bParts.push(bp.toString());
                if (slp.toString())
                    slParts.push(slp.toString());
            }
            curRad += charArc + gapRad;
        }
    }
    else {
        const totalSpanRad = ((startDeg - endDeg) * Math.PI) / 180;
        const naturalArcRad = totalAdv / radius;
        const gapRad = chars.length > 1 ? (totalSpanRad - naturalArcRad) / (chars.length - 1) : 0;
        let curRad = (startDeg * Math.PI) / 180;
        for (let i = 0; i < chars.length; i++) {
            const ch = chars[i];
            const adv = advances[i];
            const charArc = adv / radius;
            const midRad = curRad - charArc * 0.5;
            const spec = GLYPHS[ch];
            if (spec && ch !== " ") {
                const rot = midRad - Math.PI;
                const cos = Math.cos(rot);
                const sin = Math.sin(rot);
                const ox = -adv * 0.5;
                const oy = radius - capH * 0.5;
                const m = [cos, sin, -sin, cos, cx + cos * ox - sin * oy, cy + sin * ox + cos * oy];
                const sp = new PathBuilder(m);
                const fp = new PathBuilder(m);
                const bp = new PathBuilder(m);
                const slp = new PathBuilder(m);
                spec.emit(sp, fp, bp, slp, adv, capH, hs, style, slashedZero);
                if (sp.toString())
                    sParts.push(sp.toString());
                if (fp.toString())
                    fParts.push(fp.toString());
                if (bp.toString())
                    bParts.push(bp.toString());
                if (slp.toString())
                    slParts.push(slp.toString());
            }
            curRad -= charArc + gapRad;
        }
    }
    return {
        strokeD: sParts.join(" "),
        fillD: fParts.join(" "),
        bevelD: bParts.join(" "),
        slashD: slParts.join(" "),
    };
}
