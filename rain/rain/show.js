// A stage that keeps its own rain. Two canvases: on the one behind, the far rain and then the figure over it;
// on the one before, the near rain. All of it runs on a film's clock of 24 steps a second: the umbrella sways,
// the dots flow, and the stage keeps its own time. Each person stands HOLD seconds and then becomes the
// other over CHANGE; each time she returns, the colours ease to the next palette with her. A click brings
// the change at once.
//
// Dark or light follows the reader's system unless the page sets it. Colours always ease, in OKLab, from
// where they are to where they are going; the rain is drawn in white and tinted with the ink, so a change of
// colour never redraws a character.
//
// It runs only while it can be seen: off screen, or in a tab put aside, it waits where it is. A reader who
// asks for less motion gets the rain as it stands a few seconds in, held still, and the change on a click.
//
//   const stage = await mount(element, { palette, figure, mode, glyphs, rate, onChange, onTones })
//   stage.mode("dark" | "light" | "auto")
import { BODIES, bodyNamed, Figure, TILT } from "./figure.js";
import { characters, DEFAULT, FONT } from "./glyphs.js";
import { apply, mix, nextPalette, paletteNamed } from "./palette.js";
import { Rain, sprites } from "./rain.js";
const STEP = 1 / 24; // a film's frame
const HOLD = 5; // seconds a person stands before becoming the other
const CHANGE = 1.6; // seconds they take to become the other, and the colours to turn
const TURN = 0.8; // seconds the colours take to go from dark to light
// The umbrella's lean: two slow swells, never in step.
const tilt = (t) => TILT + 1.4 * Math.sin(t * 0.8) + 0.5 * Math.sin(t * 2.1 + 1);
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export async function mount(host, o = {}) {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dark = matchMedia("(prefers-color-scheme: dark)");
    const chars = characters(o.glyphs ?? DEFAULT);
    host.classList.add("rain");
    host.innerHTML = `<canvas class="rain-back"></canvas><canvas class="rain-front"></canvas>`;
    const [backCanvas, frontCanvas] = host.querySelectorAll("canvas");
    const back = backCanvas.getContext("2d"), front = frontCanvas.getContext("2d");
    let choice = o.mode ?? "auto";
    const resolve = () => (choice === "auto" ? (dark.matches ? "dark" : "light") : choice);
    let mode = resolve(), palette = paletteNamed(o.palette);
    let shown = bodyNamed(o.figure);
    // the change under way, if any, and when the one shown began to stand; the colours on their way
    let change = null, since = 0;
    let fade = { from: palette[mode], to: palette[mode], at: 0, over: 0 };
    await document.fonts.load(`40px ${FONT}`, chars.join("")).catch(() => { });
    const figure = new Figure();
    const rain = new Rain({ glyphs: chars.length, rate: o.rate ?? 100, canopy: (t) => figure.canopy(tilt(t), t) });
    const tones = (t) => mix(fade.from, fade.to, ease(fade.over ? (t - fade.at) / fade.over : 1));
    const turnTo = (to, over) => (fade = { from: tones(rain.t), to, at: rain.t, over });
    const told = () => o.onChange?.(palette, shown, mode);
    // Where the change stands at t; once it is done, the one it brought is shown and stands HOLD from then.
    const where = (t) => {
        if (!change)
            return { from: shown, to: shown, f: 0 };
        const f = (t - change.at) / CHANGE;
        if (f < 1)
            return { from: shown, to: change.to, f: ease(f) };
        shown = change.to;
        if (change.next)
            palette = change.next;
        change = null;
        since = t;
        told();
        return { from: shown, to: shown, f: 0 };
    };
    const other = () => BODIES[(BODIES.indexOf(shown) + 1) % BODIES.length];
    const begin = (t) => {
        if (change)
            return;
        const to = other();
        // the palette turns as she comes back
        const next = to === BODIES[0] ? nextPalette(palette) : null;
        change = { to, at: t, next };
        if (next)
            turnTo(next[mode], CHANGE);
    };
    const step = (dt) => {
        rain.step(dt);
        if (!still && !change && rain.t - since >= HOLD)
            begin(rain.t);
        figure.step(dt, rain.t, where(rain.t));
    };
    for (let s = 0; s < (still ? 3 : 1.5); s += STEP)
        step(STEP);
    since = rain.t;
    let k = 1, ink = null, worn = "";
    const draw = () => {
        ink ??= sprites(chars, FONT, k, mode === "dark" ? 0.12 : 0.04);
        const t = tones(rain.t);
        if (t.sky !== worn)
            (apply(host, t), o.onTones?.(t), (worn = t.sky));
        for (const c of [back, front])
            c.clearRect(0, 0, c.canvas.width, c.canvas.height);
        rain.draw(back, false, k, ink);
        tint(back, t.ink);
        figure.draw(back, k, tilt(rain.t), t);
        rain.draw(front, true, k, ink);
        tint(front, t.ink);
    };
    // Drawn at the device's pixels, up to two to the CSS pixel; the sprites are drawn again to match.
    new ResizeObserver(() => {
        const side = Math.round(host.clientWidth * Math.min(2, devicePixelRatio));
        if (!side || side === backCanvas.width)
            return;
        for (const c of [backCanvas, frontCanvas])
            c.width = c.height = side;
        k = side / 1000;
        ink = null;
        draw();
    }).observe(host);
    // A step for each film frame due; a frame drawn only when a step was taken.
    let seen = false, frame = 0, last = 0, owed = 0;
    const tick = (now) => {
        owed += Math.min(0.25, (now - last) / 1000);
        last = now;
        if (owed >= STEP) {
            for (; owed >= STEP; owed -= STEP)
                step(STEP);
            draw();
        }
        frame = requestAnimationFrame(tick);
    };
    const run = () => {
        const on = seen && !document.hidden;
        if (on && !frame) {
            last = performance.now();
            frame = requestAnimationFrame(tick);
        }
        else if (!on && frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
    };
    const setMode = (m) => {
        choice = m;
        const next = resolve();
        if (next === mode)
            return;
        mode = next;
        ink = null;
        turnTo((change?.next ?? palette)[mode], still ? 0 : TURN);
        told();
        // when the clock is not running, the new colours are drawn at once
        if (!frame)
            draw();
    };
    dark.addEventListener("change", () => choice === "auto" && setMode("auto"));
    host.addEventListener("click", () => {
        if (!still)
            return begin(rain.t);
        // with less motion, the other person at once, the colours where they are
        shown = other();
        figure.step(0, rain.t, where(rain.t));
        told();
        draw();
    });
    told();
    if (!still) {
        new IntersectionObserver(([e]) => ((seen = e.isIntersecting), run())).observe(host);
        document.addEventListener("visibilitychange", run);
    }
    return { mode: setMode };
}
/** Colours what is drawn on a canvas with the ink, keeping its shapes and how clear each is. */
function tint(c, ink) {
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = "source-in";
    c.fillStyle = ink;
    c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    c.restore();
}
