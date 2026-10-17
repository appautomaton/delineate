// A stage that holds a solid of glass over the page. The glass follows the reader's pointer on a spring,
// leaning into its own motion; with no pointer over the stage it wanders slowly about the middle. It turns as
// it goes, stands HOLD seconds as each shape, and melts into the next over MELT; a click brings the next at
// once. The page under it stands PAGE seconds and melts into the next over FLOW, each measured into a distance
// field by a worker (field.ts) while the one before is shown. A new paper and ink are eased into over TURN.
// It draws at the screen's own rate, as a hand expects of what follows it, and only while it can be seen. A
// reader who asks for less motion gets it still in the middle, the next shape on a click, the next page when
// asked, and new colours at once.
//
//   const stage = await mount(element, { pages, start, light, tones, shape })
//   stage.wear(light, tones); stage.next()
import { Glass } from "./glass.js";
import { SHAPES } from "./shader.js";
import { css, lab, lerp, srgb } from "./palette.js";
import { draw, source } from "./source.js";
const HOLD = 2.4; // seconds the glass stands as each shape
const MELT = 0.9; // seconds it takes to become the next
const TURN = 1.2; // seconds the page takes to ease into a new paper and ink
const PAGE = 8; // seconds each page stands
const FLOW = 1.8; // seconds it takes to melt into the next
const FOLLOW = 7; // the spring's stiffness, as an angular frequency: higher follows closer
const LIFT = 1.7; // its height above the page, in its own sizes: past a sphere's focus, so the words show turned over
// how far the shadow falls for each unit of height, right and down: the light's own slant (shader.ts LIGHT)
const FALL = [0.32, 0.5];
const worn = (light, t) => ({ paper: lab(t.paper), ink: lab(t.ink), night: light === "night" ? 1 : 0 });
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export async function mount(host, o) {
    const still = o.still || matchMedia("(prefers-reduced-motion: reduce)").matches;
    host.classList.add("glass");
    host.innerHTML = "<canvas></canvas>";
    const canvas = host.querySelector("canvas");
    const glass = new Glass(canvas);
    let w = 1, h = 1, dpr = 1;
    // Measuring a page is the worker's: the page's ink goes over as coverage, its field comes back.
    const worker = new Worker(new URL("./field.js", import.meta.url), { type: "module" });
    const waiting = new Map();
    let asked = 0;
    worker.onmessage = (e) => {
        waiting.get(e.data.id)?.(e.data.field);
        waiting.delete(e.data.id);
    };
    // the field's grid: a cell to a CSS pixel
    const grid = () => [Math.max(1, Math.round(w)), Math.max(1, Math.round(h))];
    const measure = async (i) => {
        const [gw, gh] = grid(), cover = draw(gw, gh, await source(o.pages[i]));
        return new Promise((done) => {
            const id = ++asked;
            waiting.set(id, done);
            worker.postMessage({ id, cover, w: gw, h: gh }, { transfer: [cover.buffer] });
        });
    };
    // where the glass is and how fast it goes; where it is going; its shapes and the clock that changes them
    let pos = [0, 0], vel = [0, 0], pointer = null;
    let shape = SHAPES.indexOf(o.shape ?? "ring"), next = -1, since = 0, t = 0;
    const size = () => Math.min(w * 0.1, h * 0.26);
    // the colours it is leaving and those it is easing into, and when it began
    let was = worn(o.light, o.tones), wear = was, turned = -Infinity, settled = false;
    const wearing = () => {
        const f = ease((t - turned) / TURN);
        return { paper: lerp(was.paper, wear.paper, f), ink: lerp(was.ink, wear.ink, f), night: was.night + (wear.night - was.night) * f };
    };
    // the pages: the one shown, in slot `slot`; the next, measured into the other slot once `ready` names it;
    // the one being melted into, and since when; a reader's ask that came before the next was ready
    const n = o.pages.length;
    let page = (o.start ?? 0) % n, slot = 0, ready = -1, coming = -1, flowed = 0, stood = 0, hurry = false;
    // a new size lets go of every field measured for the old one
    let generation = 0;
    const prepare = async (i) => {
        const g = generation;
        ready = -1;
        let field;
        try {
            field = await measure(i);
        }
        catch {
            // a drawing that cannot be had is passed over
            if (g === generation)
                return prepare((i + 1) % n);
            return;
        }
        if (g !== generation)
            return;
        glass.page(1 - slot, field, ...grid());
        ready = i;
        if (hurry)
            turnPage();
    };
    const turnPage = () => {
        if (coming >= 0)
            return;
        if (ready < 0)
            return void (hurry = true);
        hurry = false;
        if (still) {
            (slot = 1 - slot), (page = ready), (stood = t);
            o.onPage?.(o.pages[page]);
            frame();
            return void prepare((page + 1) % n);
        }
        (coming = ready), (flowed = t);
        o.onPage?.(o.pages[coming]);
    };
    const frame = () => {
        const melt = next < 0 ? 0 : ease((t - since) / MELT);
        const r = size(), now = wearing(), paper = srgb(now.paper), ink = srgb(now.ink);
        // the page around the stage is told while the colours move, and once when they come to rest
        if (!settled)
            o.onWear?.(css(paper), css(ink));
        settled = t - turned >= TURN;
        glass.draw({
            center: [pos[0], pos[1], r * LIFT],
            size: r,
            turn: turn(t, vel, still),
            from: SHAPES[shape],
            to: SHAPES[next < 0 ? shape : next],
            melt,
            night: now.night,
            paper,
            ink,
            pages: [slot, 1 - slot],
            flow: coming < 0 ? 0 : ease((t - flowed) / FLOW),
        });
    };
    const become = () => {
        next = (shape + 1) % SHAPES.length;
        since = t;
        o.onShape?.(SHAPES[next]);
    };
    const advance = (dt) => {
        t += dt;
        // the shape: stand, then melt into the next, named as it begins to become it, then stand as that one
        if (next < 0 && t - since >= HOLD)
            become();
        if (next >= 0 && t - since >= MELT)
            (shape = next), (next = -1), (since = t);
        // the page: stand, then melt into the next once it is measured, then stand as that one
        if (coming < 0 && t - stood >= PAGE)
            turnPage();
        if (coming >= 0 && t - flowed >= FLOW)
            (slot = 1 - slot), (page = coming), (coming = -1), (stood = t), void prepare((page + 1) % n);
        // the place: the pointer's, or a slow wander about the middle, kept far enough in that the solid and its
        // shadow stay whole on the stage
        const r = size();
        const goal = pointer ?? [w / 2 + w * 0.26 * Math.sin(t * 0.31), h / 2 + h * 0.16 * Math.sin(t * 0.47 + 1)];
        const target = [
            Math.min(w - r * (1.3 + FALL[0] * LIFT), Math.max(r, goal[0])),
            Math.min(h - r * (1.3 + FALL[1] * LIFT), Math.max(r * 0.6, goal[1])),
        ];
        for (const i of [0, 1]) {
            vel[i] += (FOLLOW * FOLLOW * (target[i] - pos[i]) - 2 * FOLLOW * vel[i]) * dt;
            pos[i] += vel[i] * dt;
        }
    };
    // A new size: the page shown is measured again (a melt under way is let finish at once), then the next.
    const fit = async () => {
        const r = host.getBoundingClientRect();
        if (!r.width || (r.width === w && r.height === h))
            return;
        const first = w === 1;
        [w, h, dpr] = [r.width, r.height, Math.min(2, devicePixelRatio)];
        glass.size(w, h, dpr);
        if (first)
            pos = [w / 2, h / 2];
        // until the new field is in, the old one stretched to the new size
        else
            frame();
        if (coming >= 0)
            (slot = 1 - slot), (page = coming), (coming = -1), (stood = t);
        const g = ++generation;
        ready = -1;
        const field = await measure(page);
        if (g !== generation)
            return;
        glass.page(slot, field, ...grid());
        frame();
        void prepare((page + 1) % n);
    };
    await fit();
    new ResizeObserver(() => void fit()).observe(host);
    const local = (e) => {
        const r = host.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
    };
    if (!still) {
        host.addEventListener("pointermove", (e) => (pointer = local(e)));
        host.addEventListener("pointerdown", (e) => (pointer = local(e)));
        host.addEventListener("pointerleave", () => (pointer = null));
    }
    host.addEventListener("click", () => {
        if (next >= 0)
            return;
        if (still) {
            shape = (shape + 1) % SHAPES.length;
            o.onShape?.(SHAPES[shape]);
            return frame();
        }
        become();
    });
    // Every frame the screen offers while the stage is in view; a long gap (a tab put aside) is not run through.
    let seen = false, raf = 0, last = 0;
    const tick = (now) => {
        advance(Math.min(0.05, (now - last) / 1000));
        last = now;
        frame();
        raf = requestAnimationFrame(tick);
    };
    const run = () => {
        const on = seen && !document.hidden;
        if (on && !raf)
            (last = performance.now()), (raf = requestAnimationFrame(tick));
        else if (!on && raf)
            cancelAnimationFrame(raf), (raf = 0);
    };
    if (!still) {
        new IntersectionObserver(([e]) => ((seen = e.isIntersecting), run())).observe(host);
        document.addEventListener("visibilitychange", run);
    }
    o.onShape?.(SHAPES[shape]);
    o.onPage?.(o.pages[page]);
    return {
        wear: (l, tones) => {
            was = wearing();
            wear = worn(l, tones);
            // without the clock running, nothing could ease: the new colours come at once
            turned = still || !raf ? -Infinity : t;
            settled = false;
            if (!raf)
                frame();
        },
        next: turnPage,
    };
}
/**
 * The page's frame turned into the solid's: the solid spins slowly about a leaning axis and tips into the
 * way it moves, as a thing carried does; this is the inverse of that, column by column for WebGL.
 */
function turn(t, vel, still) {
    const spin = still ? 0.6 : t * 0.55;
    const ax = normalize([0.35, 1, 0.2]);
    const R = mul(axisAngle([-vel[1], vel[0], 0], Math.min(0.9, Math.hypot(vel[0], vel[1]) * 0.0012)), axisAngle(ax, spin));
    // the inverse of a rotation is its transpose; a row-major R, read as columns, is its transpose
    return new Float32Array(R);
}
function normalize(v) {
    const l = Math.hypot(...v) || 1;
    return v.map((x) => x / l);
}
function axisAngle(axis, a) {
    const [x, y, z] = normalize(axis), c = Math.cos(a), s = Math.sin(a), k = 1 - c;
    if (!Math.hypot(...axis))
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    return [c + x * x * k, x * y * k - z * s, x * z * k + y * s, y * x * k + z * s, c + y * y * k, y * z * k - x * s, z * x * k - y * s, z * y * k + x * s, c + z * z * k];
}
function mul(a, b) {
    const out = [];
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            out.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]);
    return out;
}
