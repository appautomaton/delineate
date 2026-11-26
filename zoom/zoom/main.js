// Browser entrypoint for Zoom: boots the 18-scene (`6x` per stage = `46.53` dyadic octaves = `10^14x`)
// animated archival SVG world with meditative ~3m 10s cruise (`0.095` scenes/s),
// Day/Night delineate-theme sync, Spring pointer parallax, 0/24/60 fps controls, and QA hooks.
import { DEFAULT_CRUISE_SPEED, ZoomEngine } from "./engine.js";
import { buildAllScenes } from "./scenes/index.js";
import { OCTAVES_PER_SCENE } from "./scenes/types.js";
const THEME_KEY = "delineate-theme";
const params = new URLSearchParams(location.search);
const initialT = Number(params.get("t") ?? "0") || 0;
const initialSpeed = params.has("speed") ? Number(params.get("speed")) : DEFAULT_CRUISE_SPEED;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const still = params.get("still") === "1" || params.has("still") || reducedMotion;
const hideHud = params.get("hud") === "0";
function resolveInitialTheme() {
    const fromUrl = params.get("theme");
    if (fromUrl === "day" || fromUrl === "night")
        return fromUrl;
    try {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === "day" || stored === "night")
            return stored;
    }
    catch {
        // ignore storage restrictions
    }
    return "day";
}
let currentTheme = resolveInitialTheme();
document.documentElement.dataset.theme = currentTheme;
const stageWrap = document.getElementById("stageWrap");
const svg = document.getElementById("stage");
const defsEl = document.getElementById("stageDefs");
const backdropEl = document.getElementById("coreBackdrop");
const stackEl = document.getElementById("octaveStack");
const hud = document.getElementById("hud");
const hudIndex = document.getElementById("hudIndex");
const hudTitle = document.getElementById("hudTitle");
const hudMetric = document.getElementById("hudMetric");
const btnToggle = document.getElementById("btnToggle");
const btnReverse = document.getElementById("btnReverse");
const btnTheme = document.getElementById("btnTheme");
const btnFull = document.getElementById("btnFull");
const speedSlider = document.getElementById("speedSlider");
if (hideHud)
    hud.classList.add("is-off");
// Calibrate slider cleanly for meditative 6x-per-scene travel (-0.85..+0.85 scenes/s = +/-2.2 oct/s)
speedSlider.min = "-0.85";
speedSlider.max = "0.85";
speedSlider.step = "0.005";
speedSlider.value = String(initialSpeed);
const scenes = buildAllScenes();
const SUPER_DIGITS = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    ".": "·",
};
/** Formats cumulative dyadic magnification `2^(t * log2(6))` -> `2⁰⁰·⁰⁰` .. `2⁴⁶·⁵³`. */
function formatDyadic(t) {
    const octaves = t * OCTAVES_PER_SCENE;
    const s = octaves.toFixed(2).padStart(5, "0").replace(/[0-9.]/g, (ch) => SUPER_DIGITS[ch] ?? ch);
    return `2${s}`;
}
const totalLabel = String(scenes.length).padStart(2, "0");
const engine = new ZoomEngine({
    svg,
    defsEl,
    backdropEl,
    stackEl,
    scenes,
    initialT,
    initialSpeed,
    initialTheme: currentTheme,
    still,
    onUpdate: (st) => {
        hudIndex.textContent = `${String(st.base + 1).padStart(2, "0")} / ${totalLabel}`;
        hudTitle.textContent = st.scene.title;
        hudMetric.textContent = formatDyadic(st.t);
        btnToggle.textContent = st.paused ? "Play" : "Pause";
    },
});
function applyTheme(next, persist = true) {
    currentTheme = next;
    document.documentElement.dataset.theme = next;
    engine.setTheme(next);
    if (persist) {
        try {
            localStorage.setItem(THEME_KEY, next);
        }
        catch {
            // ignore storage errors
        }
    }
}
// Listen for delineate-theme updates from sibling tabs or parent site
window.addEventListener("storage", (e) => {
    if (e.key === THEME_KEY && (e.newValue === "day" || e.newValue === "night")) {
        applyTheme(e.newValue, false);
    }
});
// Cursor & HUD auto-hide after 1.6s of pointer inactivity
let idleTimer = 0;
function wakeUi() {
    stageWrap.classList.remove("cursor-hidden");
    if (!hideHud)
        hud.classList.remove("is-hidden");
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
        if (!engine.isPaused() && !hud.matches(":hover")) {
            stageWrap.classList.add("cursor-hidden");
            if (!hideHud)
                hud.classList.add("is-hidden");
        }
    }, 1600);
}
if (!hideHud && !still)
    wakeUi();
// Smooth Spring-damped pointer parallax across the mounted depth stack!
window.addEventListener("pointermove", (e) => {
    wakeUi();
    if (reducedMotion || still)
        return;
    const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
    engine.setPointerTarget(nx, ny);
}, { passive: true });
window.addEventListener("pointerleave", () => {
    if (!still)
        engine.setPointerTarget(0, 0);
});
window.addEventListener("pointerdown", wakeUi, { passive: true });
// Normalized wheel scrubbing into continuous-time velocity impulse (scaled for 6x scene depth!)
window.addEventListener("wheel", (e) => {
    e.preventDefault();
    wakeUi();
    const unit = e.deltaMode === 1 ? 28 : e.deltaMode === 2 ? window.innerHeight : 1;
    const dy = e.deltaY * unit;
    engine.addImpulse(dy * 0.00085);
}, { passive: false });
// Vertical pointer / touch drag scrubbing with throw inertia (scaled for 6x scene depth!)
let dragActive = false;
let lastY = 0;
let lastDragTs = 0;
let dragVel = 0;
svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0)
        return;
    dragActive = true;
    lastY = e.clientY;
    lastDragTs = performance.now();
    dragVel = 0;
    engine.setDragging(true);
    svg.setPointerCapture(e.pointerId);
});
svg.addEventListener("pointermove", (e) => {
    if (!dragActive)
        return;
    const now = performance.now();
    const dy = lastY - e.clientY;
    const dt = Math.max(0.004, (now - lastDragTs) / 1000);
    lastY = e.clientY;
    lastDragTs = now;
    const dScene = dy / Math.max(480, window.innerHeight * 0.95);
    engine.scrub(dScene);
    dragVel = dragVel * 0.65 + (dScene / dt) * 0.35;
});
function endDrag() {
    if (!dragActive)
        return;
    dragActive = false;
    engine.setDragging(false);
    if (Math.abs(dragVel) > 0.02)
        engine.addImpulse(dragVel * 0.6);
}
svg.addEventListener("pointerup", endDrag);
svg.addEventListener("pointercancel", endDrag);
// Keyboard navigation: Space (pause/play), ArrowUp/ArrowDown, R (reverse), D (day/night), F (fullscreen)
window.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLInputElement)
        return;
    if (e.code === "Space") {
        e.preventDefault();
        engine.toggle();
        wakeUi();
    }
    else if (e.code === "ArrowUp") {
        e.preventDefault();
        engine.setHoldVelocity(0.95);
    }
    else if (e.code === "ArrowDown") {
        e.preventDefault();
        engine.setHoldVelocity(-0.95);
    }
    else if (e.key === "r" || e.key === "R") {
        engine.reverse();
        speedSlider.value = String(engine.getSpeed().toFixed(3));
        wakeUi();
    }
    else if (e.key === "d" || e.key === "D") {
        applyTheme(currentTheme === "day" ? "night" : "day");
        wakeUi();
    }
    else if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement)
            void document.exitFullscreen();
        else
            void stageWrap.requestFullscreen?.();
    }
});
window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        engine.setHoldVelocity(0);
    }
});
btnToggle.addEventListener("click", () => {
    engine.toggle();
    wakeUi();
});
btnReverse.addEventListener("click", () => {
    engine.reverse();
    speedSlider.value = String(engine.getSpeed().toFixed(3));
    wakeUi();
});
btnTheme.addEventListener("click", () => {
    applyTheme(currentTheme === "day" ? "night" : "day");
    wakeUi();
});
speedSlider.addEventListener("input", () => {
    engine.setSpeed(Number(speedSlider.value));
    wakeUi();
});
btnFull.addEventListener("click", () => {
    if (document.fullscreenElement)
        void document.exitFullscreen();
    else
        void stageWrap.requestFullscreen?.();
});
// Deterministic control & profiling API for zoom/look.ts
window.__zoom = {
    setT: (t) => engine.setT(t),
    getT: () => engine.getT(),
    setAnimTime: (sec) => engine.setAnimTime(sec),
    getAnimTime: () => engine.getAnimTime(),
    setTheme: (th) => applyTheme(th, false),
    getTheme: () => engine.getTheme(),
    setPointer: (nx, ny, immediate = true) => engine.setPointerTarget(nx, ny, immediate),
    pause: () => engine.pause(),
    play: () => engine.play(),
    setSpeed: (s) => engine.setSpeed(s),
    scenes: () => scenes.map((s) => ({
        index: s.index,
        id: s.id,
        title: s.title,
        elements: s.stats.elements,
        strokes: s.stats.strokes,
        animGroups: s.stats.animGroups,
    })),
    measureFrames: (frames, stepPerFrame) => engine.measureFrames(frames, stepPerFrame),
};
