// Compact live 18-stage Infinite Zoom card for delineate's .lineup row.
//
// Mounts the real 6x-per-stage off-center SVG compositor (`ZoomEngine`) inside a compact card,
// cruising calmly at 24 fps while on-screen, responding at 60 fps to pointer multi-plane parallax,
// syncing instantaneously with delineate's Day/Night theme, and sleeping at 0.0 fps off-screen.
import { ZoomEngine } from "./engine.js";
import { buildAllScenes } from "./scenes/index.js";
const SVG_NS = "http://www.w3.org/2000/svg";
const CARD_CRUISE_SPEED = 0.115; // gentle ~2m 36s loop inside the lineup card
const SHOWCASE_STAGES = [0, 1, 3, 4, 7, 9, 11, 13, 15, 17];
function readHostTheme() {
    return document.documentElement.dataset.theme === "night" ? "night" : "day";
}
export function mountCard(host, opts = {}) {
    const reducedMotion = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const initialT = opts.initialT ??
        (reducedMotion
            ? 0.08
            : SHOWCASE_STAGES[Math.floor(Math.random() * SHOWCASE_STAGES.length)]);
    host.replaceChildren();
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "zoom-card-svg");
    svg.setAttribute("viewBox", "0 0 2400 1600");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("aria-hidden", "true");
    const defsEl = document.createElementNS(SVG_NS, "defs");
    const backdropEl = document.createElementNS(SVG_NS, "rect");
    backdropEl.setAttribute("x", "-380");
    backdropEl.setAttribute("y", "-280");
    backdropEl.setAttribute("width", "3160");
    backdropEl.setAttribute("height", "2160");
    backdropEl.setAttribute("fill", "#f3efe6");
    const stackEl = document.createElementNS(SVG_NS, "g");
    svg.append(defsEl, backdropEl, stackEl);
    const pill = document.createElement("div");
    pill.className = "zoom-card-pill";
    pill.setAttribute("aria-hidden", "true");
    const idxEl = document.createElement("span");
    idxEl.className = "zoom-card-idx";
    const titleEl = document.createElement("span");
    titleEl.className = "zoom-card-title";
    pill.append(idxEl, titleEl);
    host.append(svg, pill);
    const scenes = buildAllScenes();
    const totalLabel = String(scenes.length).padStart(2, "0");
    let lastShownBase = -1;
    const engine = new ZoomEngine({
        svg,
        defsEl,
        backdropEl,
        stackEl,
        scenes,
        initialT,
        initialSpeed: CARD_CRUISE_SPEED,
        initialTheme: readHostTheme(),
        still: true, // start paused until IntersectionObserver confirms card is in view
        onUpdate: (st) => {
            if (st.base !== lastShownBase) {
                lastShownBase = st.base;
                idxEl.textContent = `${String(st.base + 1).padStart(2, "0")} / ${totalLabel}`;
                titleEl.textContent = st.scene.title;
            }
        },
    });
    let inView = false;
    const syncPlayback = () => {
        if (reducedMotion || document.hidden || !inView) {
            engine.pause();
        }
        else {
            engine.play();
        }
    };
    const targetEl = host.closest(".zoom-host") ?? host;
    const onPointerMove = (e) => {
        if (reducedMotion)
            return;
        const r = host.getBoundingClientRect();
        if (r.width <= 1 || r.height <= 1)
            return;
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
        engine.setPointerTarget(nx, ny);
    };
    const onPointerLeave = () => {
        if (!reducedMotion)
            engine.setPointerTarget(0, 0);
    };
    targetEl.addEventListener("pointermove", onPointerMove, { passive: true });
    targetEl.addEventListener("pointerleave", onPointerLeave, { passive: true });
    const io = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        engine.setTheme(readHostTheme());
        syncPlayback();
    }, { rootMargin: "15% 0px" });
    io.observe(host);
    const mo = new MutationObserver(() => {
        engine.setTheme(readHostTheme());
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const onVisibility = () => syncPlayback();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
        io.disconnect();
        mo.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        targetEl.removeEventListener("pointermove", onPointerMove);
        targetEl.removeEventListener("pointerleave", onPointerLeave);
        engine.destroy();
        host.replaceChildren();
    };
}
