// A palette rolled by its structure, then morphed into.
//
// A roll never picks colours one by one. It starts from the flowers in the vase, inside the colours
// their real plants grow in (each plant names its window), then sets the card by one of three schemes
// (across the wheel from the hero, split to either side of there, or the hero's own hue taken deep),
// turned clear of the stems' green and of the accent, deep enough to be a colour and not a grey.
// Glass, water and ground take the card's hue; greens hold the middle values; white and silver are
// left for the few marks that should catch the eye. Every colour is set in OKLCH, so lightness is a
// number the structure controls: any roll keeps the same ladder of values.
//
// Tokens are named by role, not by species (a protea and a peony are both the hero), carry a prefix
// so they never meet a host page's own, and are set on the card's element, never on the page.
// Registered as colours, they let the browser carry a card from one roll to the next.
export const TOKENS = [
    "--ml-paper", "--ml-ground", "--ml-glass", "--ml-glass-wall", "--ml-glass-rim", "--ml-water", "--ml-foot", "--ml-shine", "--ml-ink",
    "--ml-stem", "--ml-leaf", "--ml-leaf-deep", "--ml-line", "--ml-line-deep",
    "--ml-hero", "--ml-hero-deep", "--ml-hero-light", "--ml-heart", "--ml-heart-dot",
    "--ml-accent", "--ml-accent-deep", "--ml-accent-light",
    "--ml-foliage", "--ml-foliage-deep", "--ml-filler", "--ml-filler-heart",
];
const ok = (l, c, h) => `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${(((h % 360) + 360) % 360).toFixed(1)})`;
const gap = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180);
export function roll(seed, hints) {
    const r = random(seed);
    const within = (w) => w.from + (w.to - w.from) * r();
    const hero = within(hints.hero);
    let accent = within(hints.accent);
    const green = 112 + r() * 30;
    // The card is set by one of three schemes: across the wheel from the hero; split to either side of
    // there; or the hero's own hue taken deep, so the flower stands on its own colour by lightness alone.
    const scheme = r();
    const tonal = scheme > 0.7;
    let card = scheme < 0.4 ? hero + 180 + (r() - 0.5) * 60
        : scheme < 0.7 ? hero + 180 + (r() < 0.5 ? -1 : 1) * (50 + r() * 20)
            : hero + (r() - 0.5) * 30;
    // The card must stand clear of the stems' green and of the accent, or they sink into it: turn it
    // away from whichever it is nearest, a step at a time.
    const away = (from) => 20 * Math.sign(((card - from + 540) % 360) - 180 || 1);
    for (let tries = 0; tries < 10; tries++) {
        if (gap(card, green) < 45)
            card += away(green);
        else if (gap(card, accent) < 55)
            card += away(accent);
        else
            break;
    }
    if (gap(card, accent) < 55)
        accent = within(hints.accent);
    // a card in the hero's own hue goes deeper, so the flower stands clear of it
    const depth = tonal ? 0.22 + r() * 0.05 : 0.25 + r() * 0.08;
    const filler = within(hints.filler), foliage = within(hints.foliage), line = within(hints.line);
    return {
        "--ml-paper": ok(depth, 0.055, card),
        "--ml-ground": ok(depth + 0.12, 0.045, card),
        "--ml-glass": ok(0.8, 0.04, card),
        "--ml-glass-wall": ok(0.62, 0.05, card),
        "--ml-glass-rim": ok(0.86, 0.035, card),
        "--ml-water": ok(0.5, 0.07, card),
        "--ml-foot": ok(depth - 0.1, 0.03, card),
        "--ml-shine": ok(1, 0, 0),
        "--ml-ink": ok(0.92, 0.015, card),
        "--ml-stem": ok(0.66, 0.09, green),
        "--ml-leaf": ok(0.6, 0.09, green),
        "--ml-leaf-deep": ok(0.47, 0.08, green),
        "--ml-line": ok(hints.line.light ?? 0.72, hints.line.chroma, line),
        "--ml-line-deep": ok((hints.line.light ?? 0.72) - 0.15, hints.line.chroma, line - 8),
        "--ml-hero": ok(0.76, hints.hero.chroma, hero),
        "--ml-hero-deep": ok(0.62, hints.hero.chroma * 1.15, hero - 4),
        "--ml-hero-light": ok(0.88, hints.hero.chroma * 0.6, hero + 4),
        "--ml-heart": ok(0.95, 0.03, 85),
        "--ml-heart-dot": ok(0.8, 0.06, hero + 20),
        "--ml-accent": ok(0.68, hints.accent.chroma, accent),
        "--ml-accent-deep": ok(0.58, hints.accent.chroma, accent - 6),
        "--ml-accent-light": ok(0.84, hints.accent.chroma * 0.85, accent + 25),
        "--ml-foliage": ok(hints.foliage.chroma < 0.03 ? 0.92 : 0.7, hints.foliage.chroma || 0.01, hints.foliage.chroma < 0.03 ? card : foliage),
        "--ml-foliage-deep": ok(hints.foliage.chroma < 0.03 ? 0.73 : 0.55, (hints.foliage.chroma || 0.02) * 1.1, hints.foliage.chroma < 0.03 ? card : foliage - 6),
        "--ml-filler": ok(hints.filler.chroma < 0.03 ? 0.98 : 0.8, hints.filler.chroma || 0.01, filler),
        "--ml-filler-heart": ok(0.8, 0.08, hints.filler.chroma < 0.03 ? hero + 30 : filler - 20),
    };
}
/** Registers every token as a colour, so a change to one is a transition rather than a jump. Once per page. */
let registered = false;
export function register() {
    if (registered || !("registerProperty" in CSS))
        return;
    registered = true;
    for (const name of TOKENS) {
        try {
            CSS.registerProperty({ name, syntax: "<color>", inherits: true, initialValue: "black" });
        }
        catch {
            // registered already, by another copy of this module on the page
        }
    }
}
/** Sets a palette on a card's element; with `morph`, over the given milliseconds. */
export function apply(el, palette, morph = 0) {
    el.style.transition = morph ? TOKENS.map((t) => `${t} ${morph}ms cubic-bezier(.4,0,.2,1)`).join(", ") : "none";
    for (const [name, value] of Object.entries(palette))
        el.style.setProperty(name, value);
}
/** A small seeded generator (mulberry32). */
export function random(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
