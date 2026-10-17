// The colours of a rain. A palette is a family of quiet, greyed hues, each given twice: for a dark room and a
// light one. In each the four tokens keep their order of value:
//
//   dark   sky a dusk grey, the figure near black against it, the stipple between, the ink pale: rain like
//          light at night
//   light  sky like paper, the figure a mid grey wash, the stipple paler than the figure, the ink dark:
//          rain like ink, still clear where it falls across the figure
//
// show.ts eases from one set of tones to the next in OKLab, so a change of palette or of mode never jumps.
export const PALETTES = [
    {
        name: "slate",
        dark: { sky: "#48525f", figure: "#0b0f14", stipple: "#6f7a87", ink: "#e4f0ff" },
        light: { sky: "#e7ebee", figure: "#7b8996", stipple: "#c8d2db", ink: "#1b2631" },
    },
    {
        name: "celadon",
        dark: { sky: "#47554f", figure: "#0b120f", stipple: "#6e7d77", ink: "#e2f3ec" },
        light: { sky: "#e8ece5", figure: "#87988c", stipple: "#d0dbd2", ink: "#202e28" },
    },
    {
        name: "dusk",
        dark: { sky: "#574e5e", figure: "#110d15", stipple: "#7f7687", ink: "#f4eafd" },
        light: { sky: "#eee8eb", figure: "#978a96", stipple: "#dbd1d8", ink: "#2d232f" },
    },
    {
        name: "tea",
        dark: { sky: "#565049", figure: "#100e0b", stipple: "#7e7871", ink: "#f4ede5" },
        light: { sky: "#eee9e0", figure: "#9c9080", stipple: "#ddd4c6", ink: "#2e2922" },
    },
    {
        name: "indigo",
        dark: { sky: "#464f71", figure: "#0a0d19", stipple: "#6d779b", ink: "#e1edff" },
        light: { sky: "#e6e8f0", figure: "#7e87a7", stipple: "#ced3e5", ink: "#1e2544" },
    },
];
export const paletteNamed = (name) => PALETTES.find((p) => p.name === name) ?? PALETTES[0];
export const nextPalette = (p) => PALETTES[(PALETTES.indexOf(p) + 1) % PALETTES.length];
export function apply(el, t) {
    for (const key of ["sky", "figure", "stipple", "ink"])
        el.style.setProperty(`--rain-${key}`, t[key]);
}
/** The tones a fraction f of the way from a to b, eased through OKLab so the greys between stay clean. */
export function mix(a, b, f) {
    const one = (x, y) => rgb(fromLab(lerp(toLab(x), toLab(y), f)));
    return { sky: one(a.sky, b.sky), figure: one(a.figure, b.figure), stipple: one(a.stipple, b.stipple), ink: one(a.ink, b.ink) };
}
const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function toLab(hex) {
    const n = parseInt(hex.slice(1), 16), [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => lin(c / 255));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromLab([L, A, B]) {
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const rgb = (c) => `rgb(${c.map((v) => Math.round(255 * Math.max(0, Math.min(1, gam(v))))).join(" ")})`;
