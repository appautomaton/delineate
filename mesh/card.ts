// Mesh Gradient landing-page entry card: renders all four live optical plates side-by-side (4×1
// desktop, 2×2 narrow) inside ONE shared WebGL2 canvas on delineate's own --paper and --ink tokens.
// Hovering any slot steers light smoothly across that plate and updates the parent link to open
// directly into that plate; sleeps completely off-screen via IntersectionObserver + document.hidden.

import { PALETTES, hexToSrgb, lerpOklab, lerpPalette } from "./palette.ts";
import { SPRINGS, Spring, clamp } from "./physics.ts";
import { MeshRenderer } from "./renderer.ts";
import { PLATES, type Light, type PlateFrame, type PlateId, type V3, type Viewport } from "./types.ts";

const SLOT_META: ReadonlyArray<{ plate: PlateId; num: string; name: string; phase: number }> = [
  { plate: "veil", num: "01", name: "Veil", phase: 1.8 },
  { plate: "plume", num: "02", name: "Plume", phase: 3.1 },
  { plate: "prism", num: "03", name: "Prism", phase: 1.35 },
  { plate: "lantern", num: "04", name: "Lantern", phase: 1.6 },
];

const TRAY_MIX: Record<Light, number> = {
  day: 0.032,
  night: 0.045,
};

const STEP_60_MS = 1000 / 60;
const STEP_24_MS = 1000 / 24;
const VSYNC_SLACK_MS = 3.5;

const isHostScrolling = (now: number): boolean =>
  (((window as { __delineateScrollUntil?: number }).__delineateScrollUntil ?? 0) > now);

const mixSrgb = (paper: V3, ink: V3, t: number): V3 => [
  paper[0] + (ink[0] - paper[0]) * t,
  paper[1] + (ink[1] - paper[1]) * t,
  paper[2] + (ink[2] - paper[2]) * t,
];

const DEFAULT_TRAY_BG: Record<Light, V3> = {
  day: mixSrgb(hexToSrgb("#f8f7f2"), hexToSrgb("#1b1b19"), TRAY_MIX.day),
  night: mixSrgb(hexToSrgb("#1b2036"), hexToSrgb("#f1ede2"), TRAY_MIX.night),
};

/** Parses CSS hex, rgb()/rgba(), or color(srgb ...) into normalized sRGB [0..1]. */
function parseCssColor(raw: string, fallback: V3): V3 {
  const trimmed = raw.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return hexToSrgb(trimmed);
  }
  const srgbMatch = trimmed.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (srgbMatch) {
    return [clamp(Number(srgbMatch[1]), 0, 1), clamp(Number(srgbMatch[2]), 0, 1), clamp(Number(srgbMatch[3]), 0, 1)];
  }
  const rgbMatch = trimmed.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgbMatch) {
    return [
      clamp(Number(rgbMatch[1]) / 255, 0, 1),
      clamp(Number(rgbMatch[2]) / 255, 0, 1),
      clamp(Number(rgbMatch[3]) / 255, 0, 1),
    ];
  }
  return fallback;
}

type CardSlot = {
  plate: PlateId;
  phase: number;
  el: HTMLDivElement;
  windowEl: HTMLDivElement;
  viewport: Viewport;
  px: Spring;
  py: Spring;
  hover: Spring;
};

export function mountCard(host: HTMLElement): { destroy(): void } {
  const reducedMotion =
    typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const readTheme = (): Light => (document.documentElement.dataset.theme === "night" ? "night" : "day");

  const tray = document.createElement("div");
  tray.className = "mg-tray";
  tray.dataset.light = readTheme();

  const stageEl = document.createElement("div");
  stageEl.className = "mg-stage";

  const canvas = document.createElement("canvas");
  canvas.className = "mg-canvas";
  canvas.setAttribute("aria-hidden", "true");

  const grid = document.createElement("div");
  grid.className = "mg-grid";

  const slots: CardSlot[] = SLOT_META.map(({ plate, num, name, phase }) => {
    const el = document.createElement("div");
    el.className = "mg-slot";
    el.dataset.plate = plate;

    const windowEl = document.createElement("div");
    windowEl.className = "mg-window";
    windowEl.dataset.plate = plate;

    const label = document.createElement("div");
    label.className = "mg-label";
    label.innerHTML = `<span class="mg-num">${num}</span><span class="mg-name">${name}</span>`;

    el.append(windowEl, label);
    grid.append(el);

    return {
      plate,
      phase,
      el,
      windowEl,
      viewport: { x: 0, y: 0, w: 0, h: 0 },
      px: new Spring(0.5, SPRINGS.pointer),
      py: new Spring(0.5, SPRINGS.pointer),
      hover: new Spring(0, SPRINGS.ease),
    };
  });

  stageEl.append(canvas, grid);

  const foot = document.createElement("div");
  foot.className = "mg-foot";
  foot.innerHTML =
    `<span class="mg-counter">01 · 02 · 03 · 04<span class="mg-counter-sub">  /  Optical Mesh</span></span>` +
    `<span class="mg-cta">Open Mesh Gradient <span class="mg-arrow" aria-hidden="true">→</span></span>`;

  tray.append(stageEl, foot);
  host.replaceChildren(tray);

  const linkEl = host.closest<HTMLAnchorElement>("a.mesh-host");
  const baseHref = linkEl?.getAttribute("href") ?? "mesh/";

  // Single shared WebGL2 renderer with graceful fallback.
  let renderer: MeshRenderer | null = null;
  try {
    renderer = new MeshRenderer(canvas);
  } catch {
    renderer = null;
    canvas.hidden = true;
    tray.classList.add("is-fallback");
  }

  let light: Light = readTheme();
  const nightSpring = new Spring(light === "night" ? 1 : 0, SPRINGS.ease);
  let dayGround: V3 = DEFAULT_TRAY_BG.day;
  let nightGround: V3 = DEFAULT_TRAY_BG.night;

  let stageW = 0;
  let stageH = 0;
  let visible = false;
  let rafId = 0;
  let lastNow = 0;
  let nextDue = 0;
  let springsMoving = false;
  let elapsed = 0;
  let hoveredIndex = -1;
  let destroyed = false;

  /**
   * Computes exact tray surface ground from :root's non-transitioning --paper and --ink tokens,
   * avoiding any race with .mg-tray's 280ms CSS background-color transition.
   */
  const sampleThemeGround = (mode: Light) => {
    const rootStyle = getComputedStyle(document.documentElement);
    const paperRaw = rootStyle.getPropertyValue("--paper");
    const inkRaw = rootStyle.getPropertyValue("--ink");
    if (!paperRaw.trim() || !inkRaw.trim()) return;
    const fallbackPaper = mode === "night" ? hexToSrgb("#1b2036") : hexToSrgb("#f8f7f2");
    const fallbackInk = mode === "night" ? hexToSrgb("#f1ede2") : hexToSrgb("#1b1b19");
    const paper = parseCssColor(paperRaw, fallbackPaper);
    const ink = parseCssColor(inkRaw, fallbackInk);
    const ground = mixSrgb(paper, ink, TRAY_MIX[mode]);
    if (mode === "night") nightGround = ground;
    else dayGround = ground;
  };

  /** Cached strictly inside ResizeObserver — zero getBoundingClientRect() calls inside RAF! */
  const measure = () => {
    const sr = stageEl.getBoundingClientRect();
    if (!sr.width || !sr.height) return;
    stageW = sr.width;
    stageH = sr.height;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    renderer?.resize(stageW, stageH, dpr);

    for (const s of slots) {
      const r = s.windowEl.getBoundingClientRect();
      s.viewport = {
        x: r.left - sr.left,
        y: r.top - sr.top,
        w: r.width,
        h: r.height,
      };
    }

    sampleThemeGround(light);
    render();
  };

  const render = () => {
    if (!renderer || stageW <= 0 || stageH <= 0) return;

    const night = clamp(nightSpring.x, 0, 1);
    const ground = lerpOklab(dayGround, nightGround, night);

    renderer.clear(ground);

    // Subtle slow shape showcase on Veil (0 -> 1 -> 2 -> 3) when motion is allowed.
    const veilCycle = reducedMotion ? 0 : (elapsed * 0.14) % 4;
    const veilFrom = Math.floor(veilCycle) % 4;
    const veilTo = (veilFrom + 1) % 4;
    const veilFrac = veilCycle - Math.floor(veilCycle);
    const veilMorph = veilFrac > 0.72 ? (veilFrac - 0.72) / 0.28 : 0;

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (s.viewport.w <= 0 || s.viewport.h <= 0) continue;

      const pal = PALETTES[s.plate][0];
      const colors = lerpPalette(pal.day, pal.night, night);

      const frame: PlateFrame = {
        time: s.phase + (reducedMotion ? 0 : elapsed),
        night,
        colors,
        ground,
        pointer: [clamp(s.px.x, 0, 1), clamp(s.py.x, 0, 1)],
        hover: clamp(s.hover.x, 0, 1),
        fromIndex: s.plate === "veil" ? veilFrom : 0,
        toIndex: s.plate === "veil" ? veilTo : 0,
        morph: s.plate === "veil" ? veilMorph : 1,
        scroll: 0,
        motion: [0, 0],
        compact: 1,
        cornerRadius: 13,
        paletteIndex: 0,
      };

      renderer.drawPlate(s.plate, frame, s.viewport);
    }
  };

  const isRunning = () => visible && !document.hidden && !destroyed;

  const stopLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const tick = (now: number) => {
    rafId = 0;
    if (!isRunning()) return;

    const interactive = hoveredIndex >= 0 || (springsMoving && !isHostScrolling(now));
    const stepMs = interactive ? STEP_60_MS : STEP_24_MS;
    if (nextDue > 0 && now + VSYNC_SLACK_MS < nextDue) {
      rafId = requestAnimationFrame(tick);
      return;
    }
    nextDue = nextDue > now - stepMs ? nextDue + stepMs : now + stepMs;

    const dt = clamp((now - lastNow) / 1000, 0.001, 0.05);
    lastNow = now;
    if (!reducedMotion) elapsed += dt;

    let moving = false;
    if (nightSpring.step(dt)) moving = true;
    for (const s of slots) {
      if (s.px.step(dt)) moving = true;
      if (s.py.step(dt)) moving = true;
      if (s.hover.step(dt)) moving = true;
    }
    springsMoving = moving;

    render();

    if (!reducedMotion || moving) {
      rafId = requestAnimationFrame(tick);
    }
  };

  const startLoop = () => {
    if (rafId || !isRunning()) return;
    lastNow = performance.now();
    nextDue = 0;
    rafId = requestAnimationFrame(tick);
  };

  const syncRun = () => {
    if (isRunning()) {
      render();
      if (!reducedMotion) startLoop();
    } else {
      stopLoop();
    }
  };

  const setHovered = (idx: number) => {
    if (idx === hoveredIndex) return;
    hoveredIndex = idx;
    for (let i = 0; i < slots.length; i++) {
      slots[i].el.classList.toggle("is-hot", i === idx);
      slots[i].hover.target = i === idx ? 1 : 0;
      if (i !== idx) {
        slots[i].px.target = 0.5;
        slots[i].py.target = 0.5;
      }
    }
    if (linkEl) {
      if (idx >= 0 && idx < PLATES.length) {
        linkEl.setAttribute("href", `${baseHref}?plate=${PLATES[idx]}`);
      } else {
        linkEl.setAttribute("href", baseHref);
      }
    }
    if (isRunning()) startLoop();
  };

  const onPointerMove = (e: PointerEvent) => {
    const sr = stageEl.getBoundingClientRect();
    const x = e.clientX - sr.left;
    const y = e.clientY - sr.top;

    let hit = -1;
    for (let i = 0; i < slots.length; i++) {
      const vp = slots[i].viewport;
      if (x >= vp.x && x <= vp.x + vp.w && y >= vp.y && y <= vp.y + vp.h) {
        hit = i;
        slots[i].px.target = clamp((x - vp.x) / Math.max(1, vp.w), 0, 1);
        slots[i].py.target = clamp((y - vp.y) / Math.max(1, vp.h), 0, 1);
        break;
      }
    }
    setHovered(hit);
    if (hit >= 0 && isRunning()) startLoop();
  };

  const onPointerLeave = () => {
    setHovered(-1);
  };

  stageEl.addEventListener("pointermove", onPointerMove);
  stageEl.addEventListener("pointerleave", onPointerLeave);

  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(stageEl);

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      syncRun();
    },
    { threshold: 0.05 },
  );
  intersectionObserver.observe(tray);
  document.addEventListener("visibilitychange", syncRun);

  const themeObserver = new MutationObserver(() => {
    const next = readTheme();
    if (next === light) return;
    light = next;
    tray.dataset.light = light;
    sampleThemeGround(light);
    nightSpring.target = light === "night" ? 1 : 0;
    if (reducedMotion) {
      nightSpring.snap(nightSpring.target);
      render();
    } else if (isRunning()) {
      startLoop();
    }
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // Measure and render one poised initial frame right away.
  measure();

  return {
    destroy() {
      destroyed = true;
      stopLoop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", syncRun);
      stageEl.removeEventListener("pointermove", onPointerMove);
      stageEl.removeEventListener("pointerleave", onPointerLeave);
      renderer?.destroy();
      host.replaceChildren();
    },
  };
}
