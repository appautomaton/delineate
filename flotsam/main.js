// Flotsam: delineate's page for an address that leads nowhere. The page has sunk: the window is a tank of water,
// and the numerals of the error float in it, cut from plywood. Moving the window moves the tank, and the water,
// left behind, slops against its walls; a hand can fish a numeral out and throw it back.
//
// The water and the numerals are worked out on their own thread (water/worker.ts); this page only tells it where
// the window is and what the hand is doing, and draws the latest it hears back. The life of the sea floor
// (sea.ts) runs here, asking the water about the places it lives.
import { cut, hit, place } from "./numerals.js";
import { Sea } from "./sea.js";
import { Sound } from "./sound.js";
import { tilt } from "./tilt.js";
import { WaterView } from "./water/view.js";
const root = document.documentElement;
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
// The light: the visitor's choice on delineate's pages, kept under the same key.
document.querySelector(".light")?.addEventListener("click", () => {
    const theme = root.dataset.theme === "night" ? "day" : "night";
    root.dataset.theme = theme;
    try {
        localStorage.setItem("delineate-theme", theme);
    }
    catch { }
    view.palette();
});
const canvas = document.querySelector("canvas.water");
const floating = document.querySelector(".afloat");
const view = new WaterView(canvas);
const sea = new Sea(document.querySelector(".sea"));
const sound = new Sound(document.querySelector(".sound"));
const sim = new Worker(new URL("./water/worker.js", import.meta.url), { type: "module" });
const send = (m, transfer = []) => sim.postMessage(m, transfer);
// The tank is the window, where the screen has it. With less motion asked for, it stays put whatever the window
// does, the phone's tilt is not followed, and the sea's life holds still.
let fixed = null;
// A shake in place, for checking the work without moving the window: a side-to-side swing dying away.
let shaken = -Infinity;
const swing = (now) => {
    const t = (now - shaken) / 1000;
    return t > 1.6 ? 0 : 150 * Math.sin(t * Math.PI * 4.4) * Math.exp(-t * 1.6);
};
const origin = () => fixed ?? { x: screenX + swing(performance.now()), y: screenY };
// On a phone, which way the water falls, as the phone is tipped; until the phone says, straight down.
let down = null;
if (!still)
    tilt(2600, (d) => (down = d));
let W = 0, H = 0;
let numerals = [];
let latest = null;
let found = null;
let heard = 0;
const splashes = [];
sim.onmessage = ({ data }) => {
    found = data.found;
    if (data.type !== "frame")
        return sound.hear(0, 0, 1);
    sound.hear(data.stir, data.splash, data.h);
    if (latest)
        send({ type: "return", buffer: latest.water }, [latest.water.buffer]);
    latest = data;
    heard++;
    splashes.push(data.splash);
    if (splashes.length > 600)
        splashes.shift();
};
// Everything afresh for the window as it now is: the numerals cut to its size and set afloat in the middle of it.
async function begin() {
    W = innerWidth;
    H = innerHeight;
    fixed = still ? { x: screenX, y: screenY } : null;
    view.resize(W, H);
    const size = Math.round(Math.max(110, Math.min(W * 0.2, H * 0.34, 380)));
    const cuts = await Promise.all(["4", "0", "4"].map((t, i) => cut(t, size, 404 + i * 31, floating)));
    for (const n of numerals)
        n.el.remove();
    numerals = cuts;
    latest = null;
    found = null;
    const o = origin(), surface = H * 0.62;
    sea.layout(W, H, surface);
    sea.step(0, null);
    send({
        type: "start",
        W,
        H,
        origin: o,
        options: { fill: 0.38 },
        shapes: numerals.map((n, i) => ({
            shape: n.shape,
            at: { x: o.x + W / 2 + (i - 1) * size * 0.92, y: o.y + surface + size * (0.06 - (i % 2) * 0.04) },
            angle: (i - 1) * 0.06,
        })),
    });
}
// ---- The hand
const hand = { on: false, x: 0, y: 0, vx: 0, vy: 0 };
let hold = null;
let moved = 0;
// Which numeral, if any, lies under a point of the window, topmost first, and where on it.
function under(x, y) {
    if (!latest)
        return null;
    const o = origin();
    for (let i = numerals.length - 1; i >= 0; i--) {
        const [bx, by, a] = latest.bodies.subarray(i * 3, i * 3 + 3);
        const p = hit(numerals[i], x, y, bx - o.x, by - o.y, a);
        if (p)
            return { body: i, ax: p.x, ay: p.y };
    }
    return null;
}
const interactive = (e) => !e.target.closest?.("a, button");
addEventListener("pointerdown", (e) => {
    if (!interactive(e))
        return;
    Object.assign(hand, { on: true, x: e.clientX, y: e.clientY, vx: 0, vy: 0 });
    moved = performance.now();
    hold = under(e.clientX, e.clientY);
    root.classList.toggle("is-holding", !!hold);
    try {
        e.target.setPointerCapture(e.pointerId);
    }
    catch { }
});
addEventListener("pointermove", (e) => {
    const now = performance.now();
    if (hand.on) {
        // The hand's speed, smoothed over the last few events.
        const dt = Math.max((now - moved) / 1000, 1 / 240), k = 0.5;
        hand.vx = hand.vx * (1 - k) + ((e.clientX - hand.x) / dt) * k;
        hand.vy = hand.vy * (1 - k) + ((e.clientY - hand.y) / dt) * k;
        moved = now;
    }
    else
        root.classList.toggle("is-over", !!under(e.clientX, e.clientY));
    hand.x = e.clientX;
    hand.y = e.clientY;
});
const release = () => {
    // A hand still for a moment before it lets go throws nothing.
    if (performance.now() - moved > 60)
        hand.vx = hand.vy = 0;
    hand.on = false;
    hold = null;
    root.classList.remove("is-holding");
};
addEventListener("pointerup", release);
addEventListener("pointercancel", release);
// ---- Time
function frame(now) {
    if (innerWidth !== W || innerHeight !== H) {
        W = innerWidth;
        H = innerHeight;
        clearTimeout(resizing);
        resizing = setTimeout(begin, 200);
    }
    const o = origin();
    const probes = sea.probes();
    send({ type: "tank", origin: o, hand, hold, probes, down }, [probes.buffer]);
    if (!still)
        sea.step((now - then) / 1000, found);
    then = now;
    if (latest) {
        view.draw(latest.water, latest.N, latest.h, o, still ? 0 : now / 1000);
        numerals.forEach((n, i) => place(n, latest.bodies[i * 3], latest.bodies[i * 3 + 1], latest.bodies[i * 3 + 2], o));
    }
    requestAnimationFrame(frame);
}
let resizing;
let then = performance.now();
await document.fonts.ready;
await begin();
root.classList.add("is-afloat");
requestAnimationFrame(frame);
// For checking the work from the console: how the water is doing, and a shake in place.
Object.assign(window, {
    flotsam: {
        stats: () => latest && { N: latest.N, h: latest.h, steps: latest.steps, ms: latest.ms, stir: latest.stir, rocking: latest.rocking, heard },
        // Where each numeral is in the window, and its angle.
        numerals: () => {
            const o = origin();
            return numerals.map((_, i) => latest && { x: latest.bodies[i * 3] - o.x, y: latest.bodies[i * 3 + 1] - o.y, a: latest.bodies[i * 3 + 2] });
        },
        shake: () => (shaken = performance.now()),
        // The splash of every recent tick of the water.
        splashes: () => splashes.slice(),
    },
});
