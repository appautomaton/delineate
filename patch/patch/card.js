// Lightweight single-badge specimen card for delineate's .lineup section.
//
// Bakes ONE dealt badge into a 1x1 720x520 tile (4.28 MiB VRAM total), rests directly on the
// host page's --paper (#F8F7F2 Day / #1B2036 Night) at a slight stochastic tilt, sweeps a vertical
// Cinnabar Pointer-X split hairline across to reveal the 0.00 px registered monochrome <svg>
// blueprint on hover, and sleeps at 0.0 fps whenever settled or off-screen.
import { BADGES, buildBadgeSvgMarkup, findBadgeByYear, hexToLinearRgb } from "./badges.js";
import { SPRINGS, Spring, clamp, lerp } from "./physics.js";
import { DEFAULT_LIGHT_DIR, PatchAtlasRenderer, } from "./renderer.js";
const STEP_60_MS = 1000 / 60;
const VSYNC_SLACK_MS = 3.5;
const DEG_TO_RAD = Math.PI / 180;
// Matches site/page.html's Day (#F8F7F2) and Night (#1B2036) --paper tokens
const DAY_SITE_LIN = hexToLinearRgb("#F8F7F2");
const NIGHT_SITE_LIN = hexToLinearRgb("#1B2036");
function readHostNight() {
    return (document.documentElement.dataset.theme === "night" ||
        document.body.dataset.light === "night");
}
export function mountCard(host, opts = {}) {
    const reducedMotion = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Deterministic showcase badge under reduced-motion (share cards / tests); dealt across all 6 otherwise
    const badge = findBadgeByYear(opts.year ?? null) ??
        (reducedMotion ? BADGES[2] : BADGES[Math.floor(Math.random() * BADGES.length)]);
    const isWideShape = badge.meta.shape === "rect" || badge.meta.shape === "capsule";
    const baseZoom = isWideShape ? 0.94 : 1.08;
    const restAngleDeg = reducedMotion
        ? -3.8
        : (Math.random() < 0.5 ? -1 : 1) * (3.2 + Math.random() * 2.2);
    host.replaceChildren();
    const svgClip = document.createElement("div");
    svgClip.className = "patch-card-svg-clip";
    const svgPose = document.createElement("div");
    svgPose.className = "patch-card-svg-pose";
    svgPose.innerHTML = buildBadgeSvgMarkup(badge, "blueprint", "lineup-patch");
    svgClip.append(svgPose);
    const canvas = document.createElement("canvas");
    canvas.className = "patch-card-gl";
    canvas.setAttribute("aria-hidden", "true");
    const hairline = document.createElement("div");
    hairline.className = "patch-card-hairline";
    hairline.setAttribute("aria-hidden", "true");
    const tag = document.createElement("span");
    tag.className = "patch-card-tag";
    tag.textContent = "<svg>";
    hairline.append(tag);
    host.append(svgClip, canvas, hairline);
    let renderer;
    try {
        renderer = new PatchAtlasRenderer(canvas, [badge]);
    }
    catch {
        // Graceful SVG blueprint fallback if WebGL2 is unavailable
        svgClip.style.visibility = "visible";
        svgClip.style.clipPath = "none";
        svgPose.style.transform = `rotate(${restAngleDeg.toFixed(2)}deg) scale(${baseZoom.toFixed(3)})`;
        return () => host.replaceChildren();
    }
    let destroyed = false;
    let inView = true;
    let hovered = false;
    let cssW = 1;
    let cssH = 1;
    let rafId = 0;
    let lastNow = 0;
    let nextDue = 0;
    const nightSpring = new Spring(readHostNight() ? 1 : 0, SPRINGS.ease);
    const splitSpring = new Spring(0, SPRINGS.peel);
    const dySpring = new Spring(0, SPRINGS.pose);
    const angleSpring = new Spring(restAngleDeg, SPRINGS.pose);
    const lightX = new Spring(0, SPRINGS.pointer);
    const lightY = new Spring(0, SPRINGS.pointer);
    // Measure untransformed layout dimensions so scroll-driven scale/pan animations keep 0.00 px lock
    const measure = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cssW = Math.max(1, host.clientWidth || 320);
        cssH = Math.max(1, host.clientHeight || 280);
        renderer.resize(cssW, cssH, dpr);
    };
    const computeLightDir = () => {
        if (reducedMotion)
            return DEFAULT_LIGHT_DIR;
        const lx = -0.18 + lightX.x * 0.34;
        const ly = 0.62 - lightY.x * 0.22;
        const lz = Math.max(0.5, Math.sqrt(Math.max(0.25, 1.0 - lx * lx - ly * ly)));
        const inv = 1 / Math.hypot(lx, ly, lz);
        return [lx * inv, ly * inv, lz * inv];
    };
    const renderFrame = () => {
        if (destroyed)
            return;
        const sp = clamp(splitSpring.x, 0, 1);
        const dy = dySpring.x;
        const deg = angleSpring.x;
        const night = clamp(nightSpring.x, 0, 1);
        if (sp <= 0.001) {
            svgClip.style.clipPath = "inset(0 100% 0 0)";
            svgClip.style.visibility = "hidden";
        }
        else if (sp >= 0.999) {
            svgClip.style.clipPath = "none";
            svgClip.style.visibility = "visible";
        }
        else {
            svgClip.style.visibility = "visible";
            svgClip.style.clipPath = `inset(0 ${((1 - sp) * 100).toFixed(3)}% 0 0)`;
        }
        if (sp > 0.001) {
            svgPose.style.transform = `translate3d(0px, ${dy.toFixed(2)}px, 0) rotate(${deg.toFixed(3)}deg) scale(${baseZoom.toFixed(4)})`;
        }
        const showLine = sp > 0.015 && sp < 0.985;
        hairline.style.opacity = showLine ? "1" : "0";
        hairline.style.left = `${(sp * 100).toFixed(3)}%`;
        if (showLine) {
            tag.textContent = `<svg> ${Math.round(sp * 100)}%`;
        }
        const cardLin = [
            lerp(DAY_SITE_LIN[0], NIGHT_SITE_LIN[0], night),
            lerp(DAY_SITE_LIN[1], NIGHT_SITE_LIN[1], night),
            lerp(DAY_SITE_LIN[2], NIGHT_SITE_LIN[2], night),
        ];
        const vp = { x: 0, y: 0, w: cssW, h: cssH };
        const pose = {
            dx: 0,
            dy,
            angleRad: deg * DEG_TO_RAD,
            fitZoom: baseZoom,
        };
        renderer.beginFrame();
        renderer.drawBadgeSlot(0, vp, computeLightDir(), sp, night, cardLin, 1.0, pose);
        renderer.endFrame();
    };
    const stopLoop = () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
        lastNow = 0;
        nextDue = 0;
    };
    const tick = (now) => {
        rafId = 0;
        if (destroyed || document.hidden || !inView)
            return;
        if (nextDue > 0 && now + VSYNC_SLACK_MS < nextDue) {
            rafId = requestAnimationFrame(tick);
            return;
        }
        nextDue = nextDue > now - STEP_60_MS ? nextDue + STEP_60_MS : now + STEP_60_MS;
        const dt = lastNow > 0 ? clamp((now - lastNow) * 0.001, 0.001, 0.05) : 1 / 60;
        lastNow = now;
        let moving = false;
        if (nightSpring.step(dt))
            moving = true;
        if (splitSpring.step(dt))
            moving = true;
        if (dySpring.step(dt))
            moving = true;
        if (angleSpring.step(dt))
            moving = true;
        if (lightX.step(dt))
            moving = true;
        if (lightY.step(dt))
            moving = true;
        renderFrame();
        if (moving) {
            rafId = requestAnimationFrame(tick);
        }
        else {
            lastNow = 0;
            nextDue = 0;
        }
    };
    const wake = () => {
        if (destroyed || document.hidden || !inView)
            return;
        if (reducedMotion) {
            nightSpring.snap(nightSpring.target);
            splitSpring.snap(splitSpring.target);
            dySpring.snap(dySpring.target);
            angleSpring.snap(angleSpring.target);
            lightX.snap(lightX.target);
            lightY.snap(lightY.target);
            renderFrame();
            return;
        }
        if (!rafId) {
            lastNow = 0;
            nextDue = 0;
            rafId = requestAnimationFrame(tick);
        }
    };
    const targetEl = host.closest(".patch-host") ?? host;
    const onPointerMove = (e) => {
        const r = host.getBoundingClientRect();
        if (r.width <= 1 || r.height <= 1)
            return;
        const tx = clamp((e.clientX - r.left) / r.width, 0, 1);
        const ty = clamp((e.clientY - r.top) / r.height, 0, 1);
        hovered = true;
        splitSpring.target = tx;
        dySpring.target = -2.5;
        angleSpring.target = restAngleDeg * 0.82;
        lightX.target = tx * 2 - 1;
        lightY.target = ty * 2 - 1;
        wake();
    };
    const onPointerLeave = () => {
        if (!hovered)
            return;
        hovered = false;
        splitSpring.target = 0;
        dySpring.target = 0;
        angleSpring.target = restAngleDeg;
        lightX.target = 0;
        lightY.target = 0;
        wake();
    };
    targetEl.addEventListener("pointerenter", onPointerMove, { passive: true });
    targetEl.addEventListener("pointermove", onPointerMove, { passive: true });
    targetEl.addEventListener("pointerleave", onPointerLeave, { passive: true });
    const ro = new ResizeObserver(() => {
        measure();
        renderFrame();
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (!inView)
            stopLoop();
        else {
            nightSpring.snap(readHostNight() ? 1 : 0);
            renderFrame();
        }
    }, { rootMargin: "20% 0px" });
    io.observe(host);
    const mo = new MutationObserver(() => {
        nightSpring.target = readHostNight() ? 1 : 0;
        if (inView && !document.hidden)
            wake();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    mo.observe(document.body, { attributes: true, attributeFilter: ["data-light"] });
    const onVisibility = () => {
        if (document.hidden)
            stopLoop();
        else if (inView)
            renderFrame();
    };
    document.addEventListener("visibilitychange", onVisibility);
    measure();
    renderFrame();
    return () => {
        destroyed = true;
        stopLoop();
        ro.disconnect();
        io.disconnect();
        mo.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        targetEl.removeEventListener("pointerenter", onPointerMove);
        targetEl.removeEventListener("pointermove", onPointerMove);
        targetEl.removeEventListener("pointerleave", onPointerLeave);
        renderer.dispose();
        host.replaceChildren();
    };
}
