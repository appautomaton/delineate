// The flowers a vase can hold, gathered by the gardens they grow in (the Garden's own climates).
//
// Each plant names the part it plays in an arrangement, the colours its real kind grows in, and how
// it is drawn with the pen. A drawing paints in roles, never in species: a protea and a peony are
// both the hero, so a palette is rolled for the arrangement rather than for the plant. A plant is
// given its stem above the mouth, head first, and draws its head there and whatever it carries along
// the stem; the arrangement has already drawn a plain stem, unless the plant is a line, which is
// all stem and draws its own.
import { block, dot, leaf, line, oval, PEN, run, walker } from "./pen.js";
const rad = (deg) => (deg * Math.PI) / 180;
const toward = ([x, y], deg, len) => [x + Math.cos(rad(deg)) * len, y + Math.sin(rad(deg)) * len];
// ——— Fynbos: the Cape's flowers as a florist sells them
/** The thatching reed: a jointed culm, a sheath at each joint, a broom of fine stems at the top. */
const reed = {
    name: "Cape thatching reed",
    role: "line",
    hue: { from: 62, to: 80, chroma: 0.065, light: 0.74 },
    draw(stem, r) {
        const pieces = Math.max(3, Math.round(walker(stem).total / (PEN * 11)));
        const spec = Array.from({ length: pieces }, (_, k) => `-${(5 + r() * 9).toFixed(0)}${k < pieces - 1 ? " .1" : ""}`).join(" ");
        const out = run(stem, spec, "--ml-line");
        const at = walker(stem);
        let t = 0, side = 1;
        for (const token of spec.split(" ")) {
            t += Number(token.slice(1) || 1) * PEN + PEN * 0.9;
            if (token[0] !== ".")
                continue;
            const [x, y] = at.point(t - PEN);
            out.push(line([[x, y], [x + side * PEN * 1.6, y - PEN * 1.6]], "--ml-line-deep", PEN * 0.8));
            side = -side;
        }
        const [tx, ty] = stem[0], lean = r() < 0.5 ? 1 : -1;
        for (let k = 0; k < 6; k++) {
            const y = ty + 18 + k * 20, len = 22 + k * 7;
            out.push(line([[tx, y], [tx + lean * len * Math.SQRT1_2, y - len * Math.SQRT1_2]], "--ml-line", PEN * 0.8));
        }
        return { back: out };
    },
};
/** A king protea from the side: a crown of pointed bracts round a dome of silver-tipped florets. */
const protea = {
    name: "King protea",
    role: "hero",
    hue: { from: 0, to: 38, chroma: 0.1 },
    draw(stem) {
        const [cx, base] = stem[0];
        const out = [];
        const bract = (deg, len, width, shift) => {
            const foot = [cx + shift, base];
            out.push(...leaf(toward(foot, deg - 90, len), foot, width, "--ml-hero", "--ml-hero-deep", 0.55));
        };
        const at = walker(stem);
        const [lx, ly] = at.point(64), [rx, ry] = at.point(80);
        out.push(...leaf([lx - 62, ly - 48], [lx, ly], 30, "--ml-leaf", "--ml-leaf-deep"));
        out.push(...leaf([rx + 58, ry - 46], [rx, ry], 28, "--ml-leaf", "--ml-leaf-deep"));
        for (const [deg, len] of [[-32, 112], [32, 112], [-19, 136], [19, 136], [-6, 148], [6, 148]])
            bract(deg, len, 50, deg);
        out.push(oval([cx, base - 84], 52, 28, "--ml-heart"));
        for (let row = 0; row < 3; row++) {
            const y = base - 102 + row * 11, half = [22, 34, 42][row];
            for (let x = -half; x <= half + 0.1; x += 14)
                out.push(dot([cx + x + (row % 2) * 7, y], PEN * 0.3, "--ml-heart-dot"));
        }
        for (const [deg, len] of [[-24, 74], [24, 74], [-8, 82], [8, 82]])
            bract(deg, len, 56, deg * 1.4);
        out.push(block([[cx - 24, base - 6], [cx + 24, base - 6], [cx + 12, base + 14], [cx - 12, base + 14]], "--ml-hero-deep"));
        return { front: out };
    },
};
/** A pincushion: styles flung out from a low cushion, each hooked in at its knob. */
const pincushion = {
    name: "Pincushion",
    role: "accent",
    hue: { from: 38, to: 88, chroma: 0.17 },
    draw(stem) {
        const [cx, cy] = stem[0];
        const out = [];
        for (let k = 0; k <= 10; k++) {
            const end = toward([cx, cy], -200 + k * 22, 66 + (k % 2) * 12);
            const hook = [end[0] - Math.sign(end[0] - cx) * 9, end[1] + 3];
            out.push(line([[cx, cy], end, hook], "--ml-accent", PEN * 0.8));
            out.push(dot(hook, PEN * 0.72, "--ml-accent-light"));
        }
        out.push(`<path d="M${cx - 38} ${cy} a38 32 0 0 1 76 0 z" style="fill:var(--ml-accent-deep)"/>`);
        out.push(block([[cx - 30, cy + 4], [cx + 30, cy + 4], [cx + 14, cy + 26], [cx - 14, cy + 26]], "--ml-leaf"));
        return { front: out };
    },
};
/** Silver-tree leaves set up a stem, alternate sides, pointing up and out. */
const silverTree = {
    name: "Silver tree",
    role: "foliage",
    hue: { from: 0, to: 0, chroma: 0 },
    draw(stem) {
        const at = walker(stem), out = [];
        const count = Math.min(6, Math.floor(at.total / 60));
        for (let k = 0; k < count; k++) {
            const [x, y] = at.point(12 + k * 60);
            const side = k % 2 ? 1 : -1, len = 84 - k * 7;
            out.push(...leaf([x + side * len * 0.6, y - len * 0.8], [x, y], 26, "--ml-foliage", "--ml-foliage-deep", 0.5));
        }
        return { front: out };
    },
};
/** Everlastings: four papery dots round a warm heart, on a stem and two side shoots. */
const everlasting = {
    name: "Cape everlasting",
    role: "filler",
    hue: { from: 0, to: 0, chroma: 0 },
    draw(stem, r) {
        const head = (p, size) => {
            const rr = PEN * 0.62 * size, s = PEN * 1.45 * size;
            return [...[[0, -s], [s, 0], [0, s], [-s, 0]].map(([dx, dy]) => dot([p[0] + dx, p[1] + dy], rr, "--ml-filler")), dot(p, rr * 0.95, "--ml-filler-heart")];
        };
        const at = walker(stem), side = r() < 0.5 ? 1 : -1;
        const [ax, ay] = at.point(56), [bx, by] = at.point(80);
        const a = [ax + side * 36, ay - 36], b = [bx - side * 34, by];
        return { front: [
                line([[ax, ay], a, [a[0], a[1] - 20]], "--ml-stem", PEN * 0.8),
                line([[bx, by], b], "--ml-stem", PEN * 0.8),
                ...head(stem[0], 1), ...head([a[0], a[1] - 26], 0.8), ...head([b[0] - side * 8, b[1]], 0.85),
            ] };
    },
};
// ——— East Asia: a spring-to-autumn vase of the gardens of China, Korea and Japan
/** A plum branch: dark wood that zigzags on the pen's angles, short spurs, five-dot blossoms and buds. */
const plum = {
    name: "Plum",
    role: "line",
    hue: { from: 30, to: 55, chroma: 0.03, light: 0.46 },
    draw(stem, r) {
        const out = [line(stem, "--ml-line", PEN * 1.1)];
        const at = walker(stem);
        const blossom = (p, size = 1) => {
            const ring = Array.from({ length: 5 }, (_, k) => dot(toward(p, -90 + k * 72, PEN * 1.05 * size), PEN * 0.6 * size, "--ml-hero-light"));
            return [...ring, dot(p, PEN * 0.42 * size, "--ml-heart-dot")];
        };
        let side = r() < 0.5 ? 1 : -1;
        for (let t = 30; t < Math.min(at.total - 60, 420); t += 54 + r() * 30) {
            const p = at.point(t);
            const tip = [p[0] + side * 34, p[1] - 34];
            out.push(line([p, tip], "--ml-line", PEN * 0.8));
            out.push(...blossom(tip, 0.8 + r() * 0.3));
            if (r() < 0.6)
                out.push(dot([p[0] - side * 12, p[1] - 6], PEN * 0.5, "--ml-hero-light"));
            side = -side;
        }
        out.push(...blossom(stem[0], 1.1));
        return { back: out };
    },
};
/** A peony from the side: rings of round petals, the back ones taller, cupped round a few stamens. */
const peony = {
    name: "Peony",
    role: "hero",
    hue: { from: -12, to: 22, chroma: 0.12 },
    draw(stem) {
        const [cx, base] = stem[0];
        const out = [];
        const at = walker(stem);
        const [lx, ly] = at.point(58), [rx, ry] = at.point(78);
        out.push(...leaf([lx - 64, ly - 40], [lx, ly], 32, "--ml-leaf", "--ml-leaf-deep"));
        out.push(...leaf([rx + 60, ry - 50], [rx, ry], 28, "--ml-leaf", "--ml-leaf-deep"));
        // back ring, tall and pale; middle ring; stamens; front ring, low and deep
        for (const dx of [-54, -18, 18, 54])
            out.push(oval([cx + dx, base - 92 + Math.abs(dx) * 0.3], 30, 42, "--ml-hero-light"));
        for (const dx of [-62, -22, 22, 62])
            out.push(oval([cx + dx, base - 58 + Math.abs(dx) * 0.2], 32, 34, "--ml-hero"));
        for (const dx of [-24, -8, 8, 24])
            out.push(dot([cx + dx, base - 84 - (dx % 16 ? 6 : 0)], PEN * 0.55, "--ml-heart"));
        for (const dx of [-40, 0, 40])
            out.push(oval([cx + dx, base - 30], 34, 28, "--ml-hero-deep"));
        out.push(block([[cx - 26, base - 8], [cx + 26, base - 8], [cx + 12, base + 12], [cx - 12, base + 12]], "--ml-leaf-deep"));
        return { front: out };
    },
};
/** A hydrangea: a mound of four-petalled florets, a broad leaf either side beneath. */
const hydrangea = {
    name: "Hydrangea",
    role: "accent",
    hue: { from: 235, to: 300, chroma: 0.13 },
    draw(stem) {
        const [cx, cy] = stem[0];
        const out = [];
        const at = walker(stem);
        const [lx, ly] = at.point(70);
        out.push(...leaf([lx - 70, ly - 26], [lx, ly], 38, "--ml-leaf", "--ml-leaf-deep"));
        out.push(...leaf([lx + 66, ly - 34], [lx, ly + 6], 34, "--ml-leaf", "--ml-leaf-deep"));
        const tones = ["--ml-accent", "--ml-accent-light", "--ml-accent-deep"];
        let k = 0;
        for (let y = -64; y <= 8; y += 22) {
            const half = Math.sqrt(Math.max(0, 1 - ((y + 28) / 46) ** 2)) * 70;
            for (let x = -half + ((y / 22) % 2 ? 11 : 0); x <= half; x += 24) {
                const p = [cx + x, cy + y], tone = tones[(k++ * 7) % 3];
                for (const deg of [45, 135, 225, 315])
                    out.push(dot(toward(p, deg, 6.5), 5.6, tone));
                out.push(dot(p, 2.6, "--ml-heart"));
            }
        }
        return { front: out };
    },
};
/** A red spider lily: six petals curled back from the heart, long stamens swept up and out. */
const spiderLily = {
    name: "Red spider lily",
    role: "accent",
    hue: { from: 18, to: 34, chroma: 0.19 },
    draw(stem) {
        const c = stem[0];
        const out = [];
        for (let k = 0; k < 7; k++) {
            const deg = -168 + k * 26;
            const mid = toward(c, deg, 44), end = toward(mid, deg - 40 * Math.sign(Math.cos(rad(deg)) || 1), 40);
            out.push(line([c, mid, end], "--ml-accent", PEN * 0.6));
            out.push(dot(end, PEN * 0.45, "--ml-accent-light"));
        }
        for (let k = 0; k < 6; k++) {
            const deg = -180 + k * 36;
            const out1 = toward(c, deg, 26), back = toward(out1, deg + 135, 12);
            out.push(line([c, out1, back], "--ml-accent-deep", PEN * 1.1));
        }
        out.push(dot(c, PEN * 0.8, "--ml-accent-deep"));
        return { front: out };
    },
};
/** A Japanese maple: a branch with palmate leaves, each five strokes from a point. */
const maple = {
    name: "Japanese maple",
    role: "foliage",
    // autumn's amber and gold, not its red: the vase's reds belong to its flowers
    hue: { from: 58, to: 88, chroma: 0.12 },
    draw(stem, r) {
        const at = walker(stem), out = [];
        const hand = (p, size, tone) => {
            for (const deg of [-90, -45, -135, 0, 180])
                out.push(line([p, toward(p, deg, (deg === -90 ? 22 : 16) * size)], tone, PEN * 0.75));
        };
        let side = 1;
        for (let t = 16; t < at.total - 20; t += 48) {
            const p = at.point(t);
            const twig = [p[0] + side * 26, p[1] - 26];
            out.push(line([p, twig], "--ml-stem", PEN * 0.6));
            hand(twig, 0.9 + r() * 0.3, r() < 0.5 ? "--ml-foliage" : "--ml-foliage-deep");
            side = -side;
        }
        hand(stem[0], 1.1, "--ml-foliage");
        return { front: out };
    },
};
/** Wisteria: a short arching stem, racemes hanging from it, the dots smaller as they fall. */
const wisteria = {
    name: "Japanese wisteria",
    role: "filler",
    hue: { from: 285, to: 312, chroma: 0.1 },
    draw(stem, r) {
        const out = [];
        const [hx, hy] = stem[0], side = r() < 0.5 ? 1 : -1;
        const arch = [[hx, hy], [hx + side * 30, hy - 30], [hx + side * 80, hy - 30]];
        out.push(line(arch, "--ml-stem", PEN * 0.8));
        for (const [x0, y0, n] of [[hx + side * 30, hy - 30, 7], [hx + side * 80, hy - 30, 6]]) {
            for (let k = 0; k < n; k++) {
                const y = y0 + 14 + k * 15, rr = PEN * (0.95 - k * 0.09);
                out.push(dot([x0 - rr * 0.8, y], rr, k % 2 ? "--ml-filler" : "--ml-filler-heart"));
                out.push(dot([x0 + rr * 0.8, y + 7], rr * 0.9, k % 2 ? "--ml-filler-heart" : "--ml-filler"));
            }
        }
        return { front: out };
    },
};
export const GARDENS = [
    { key: "fynbos", name: "Fynbos", region: "Western Cape", plants: [reed, protea, pincushion, silverTree, everlasting] },
    { key: "eastasian", name: "East Asia", region: "China, Korea, Japan", plants: [plum, peony, hydrangea, spiderLily, maple, wisteria] },
];
