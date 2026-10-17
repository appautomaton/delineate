// Glass's colours: a few quiet pairs of paper and ink for the day, and a few for the night. Each turn of the
// light brings that light's next pair, so the page is never quite the same twice. The first by day is
// delineate's own, so a reader who comes from the site's page arrives on its paper. By night the paper is dim,
// its hue just there, and the ink a soft light rather than white.
//
// show.ts eases from one pair to the next in OKLab, and the shader lays the pair it is at on the page's mask.
export const TONES = {
    day: [
        { name: "paper", paper: "#f8f7f2", ink: "#1b1b19" },
        { name: "sage", paper: "#eef5ee", ink: "#1c2a24" },
        { name: "clay", paper: "#f9f1ea", ink: "#342521" },
        { name: "mist", paper: "#edf4f8", ink: "#1d2631" },
    ],
    night: [
        { name: "indigo", paper: "#131624", ink: "#d5d0c7" },
        { name: "pine", paper: "#0c1a16", ink: "#d0d3c5" },
        { name: "umber", paper: "#1f1410", ink: "#dbd1c5" },
        { name: "graphite", paper: "#13161a", ink: "#d0d5d9" },
    ],
};
/** The pair named `name`, and the light it belongs to. */
export function named(name) {
    for (const light of ["day", "night"]) {
        const tones = TONES[light].find((t) => t.name === name);
        if (tones)
            return { light, tones };
    }
    return null;
}
export const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
/** "#rrggbb" in OKLab. */
export function lab(hex) {
    const n = parseInt(hex.slice(1), 16), [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => lin(c / 255));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
/** An OKLab colour as sRGB channels from 0 to 1, as the canvas stores them. */
export function srgb([L, A, B]) {
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
    return rgb.map((v) => Math.max(0, Math.min(1, gam(v))));
}
export const css = (c) => `rgb(${c.map((v) => Math.round(255 * v)).join(" ")})`;
