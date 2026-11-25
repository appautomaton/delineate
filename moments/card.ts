// Moments as a compact single-row rotating preview card for delineate's landing page:
// three live slots in one horizontal row cycle one slot at a time through all twenty nonlinear
// controls on the host page's own paper and ink; clicking the card opens the full playable sheet.

import type { TileInstance, TileSpec } from "./tile.ts";
import { TILES } from "./tiles/index.ts";

const SLOTS = 3;
const SWAP_INTERVAL_MS = 2700;
const EXIT_MS = 230;
const STEP_60_MS = 1000 / 60;
const STEP_24_MS = 1000 / 24;
const VSYNC_SLACK_MS = 3.5;

const isHostScrolling = (now: number): boolean =>
  (((window as { __delineateScrollUntil?: number }).__delineateScrollUntil ?? 0) > now);

type Slot = {
  el: HTMLElement;
  inner: HTMLElement;
  numEl: HTMLElement;
  matEl: HTMLElement;
  stageEl: HTMLElement;
  titleEl: HTMLElement;
  spec: TileSpec;
  posterIndex: number;
  instance: TileInstance;
  demoTime: number;
  awake: boolean;
};

export function mountCard(host: HTMLElement): { destroy(): void } {
  const calm = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const readTheme = (): "night" | "day" => (document.documentElement.dataset.theme === "night" ? "night" : "day");

  const tray = document.createElement("div");
  tray.className = "mc-tray";
  tray.dataset.light = readTheme();

  const wrap = document.createElement("div");
  wrap.className = "moments mc-strip";
  wrap.dataset.light = readTheme();

  const row = document.createElement("div");
  row.className = "mc-row";
  wrap.append(row);

  const foot = document.createElement("div");
  foot.className = "mc-foot";
  const counterEl = document.createElement("span");
  counterEl.className = "mc-counter";
  const ctaEl = document.createElement("span");
  ctaEl.className = "mc-cta";
  ctaEl.innerHTML = `Open all ${TILES.length} <span class="mc-arrow" aria-hidden="true">→</span>`;
  foot.append(counterEl, ctaEl);

  tray.append(wrap, foot);
  host.replaceChildren(tray);

  let rafId = 0;
  let lastNow = 0;
  let nextDue = 0;
  let anyAwake = true;
  let elapsed = 0;
  let visible = false;
  let swapTimer = 0;
  let nextTileCursor = SLOTS;
  let nextSlotCursor = 0;
  const slots: Slot[] = [];

  const isRunning = () => visible && !document.hidden;

  const updateCounter = () => {
    const nums = slots.map((s) => String(s.posterIndex).padStart(2, "0")).join(" · ");
    counterEl.textContent = `${nums}  /  ${TILES.length}`;
  };

  const mountIntoSlot = (slot: Slot, specIdx: number) => {
    slot.instance?.destroy?.();
    const spec = TILES[specIdx % TILES.length];
    const posterIndex = (specIdx % TILES.length) + 1;
    slot.spec = spec;
    slot.posterIndex = posterIndex;
    slot.demoTime = 0.25 + (posterIndex % 3) * 0.2;
    slot.awake = true;
    slot.numEl.textContent = String(posterIndex).padStart(2, "0");
    slot.matEl.textContent = spec.material;
    slot.titleEl.textContent = spec.name;

    const instance = spec.mount({
      wake() {
        slot.awake = true;
        anyAwake = true;
      },
      sound() {},
      interact() {},
    });
    slot.instance = instance;
    slot.stageEl.replaceChildren(instance.el);
    // Render one poised frame immediately so reduced-motion or first paint is crisp.
    slot.awake = instance.step(0.016, elapsed);
    if (slot.awake) anyAwake = true;
  };

  for (let i = 0; i < SLOTS; i++) {
    const el = document.createElement("div");
    el.className = "mc-slot";

    const inner = document.createElement("div");
    inner.className = "moment-card mc-tile";

    const head = document.createElement("div");
    head.className = "moment-head";
    const numEl = document.createElement("span");
    numEl.className = "moment-idx";
    const matEl = document.createElement("span");
    matEl.className = "moment-mat";
    head.append(numEl, matEl);

    const stageEl = document.createElement("div");
    stageEl.className = "moment-stage mc-stage";

    const titleEl = document.createElement("p");
    titleEl.className = "moment-title";

    inner.append(head, stageEl, titleEl);
    el.append(inner);
    row.append(el);

    const slot: Slot = {
      el,
      inner,
      numEl,
      matEl,
      stageEl,
      titleEl,
      spec: TILES[i],
      posterIndex: i + 1,
      instance: null as unknown as TileInstance,
      demoTime: i * 0.45,
      awake: true,
    };
    mountIntoSlot(slot, i);
    slots.push(slot);
  }
  updateCounter();

  const pendingTimeouts = new Set<number>();

  const rotateOne = () => {
    if (!isRunning() || calm) return;
    const slot = slots[nextSlotCursor % SLOTS];
    nextSlotCursor = (nextSlotCursor + 1) % SLOTS;
    const incomingIdx = nextTileCursor % TILES.length;
    nextTileCursor = (nextTileCursor + 1) % TILES.length;

    slot.inner.classList.remove("is-entering");
    slot.inner.classList.add("is-leaving");

    const id = window.setTimeout(() => {
      pendingTimeouts.delete(id);
      mountIntoSlot(slot, incomingIdx);
      updateCounter();
      slot.inner.classList.remove("is-leaving");
      void slot.inner.offsetWidth;
      slot.inner.classList.add("is-entering");
    }, EXIT_MS);
    pendingTimeouts.add(id);
  };

  const frame = (now: number) => {
    rafId = 0;
    if (!isRunning()) return;

    const stepMs = anyAwake && !isHostScrolling(now) ? STEP_60_MS : STEP_24_MS;
    if (nextDue > 0 && now + VSYNC_SLACK_MS < nextDue) {
      rafId = requestAnimationFrame(frame);
      return;
    }
    nextDue = nextDue > now - stepMs ? nextDue + stepMs : now + stepMs;

    const dt = Math.min(0.05, Math.max(0.001, (now - lastNow) / 1000));
    lastNow = now;
    elapsed += dt;

    let stillAwake = false;
    for (const s of slots) {
      s.demoTime += dt;
      s.instance.demo(s.demoTime, dt);
      if (s.awake) {
        s.awake = false;
        if (s.instance.step(dt, elapsed)) s.awake = true;
        if (s.awake) stillAwake = true;
      }
    }
    anyAwake = stillAwake;

    rafId = requestAnimationFrame(frame);
  };

  const startLoop = () => {
    if (calm) return;
    if (!rafId && isRunning()) {
      lastNow = performance.now();
      nextDue = 0;
      rafId = requestAnimationFrame(frame);
    }
    if (!swapTimer && isRunning()) {
      swapTimer = window.setInterval(rotateOne, SWAP_INTERVAL_MS);
    }
  };

  const stopLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (swapTimer) {
      clearInterval(swapTimer);
      swapTimer = 0;
    }
  };

  const syncRun = () => {
    if (isRunning()) startLoop();
    else stopLoop();
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      syncRun();
    },
    { threshold: 0.05 },
  );
  observer.observe(tray);
  document.addEventListener("visibilitychange", syncRun);

  const themeObserver = new MutationObserver(() => {
    const next = readTheme();
    tray.dataset.light = next;
    wrap.dataset.light = next;
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return {
    destroy() {
      stopLoop();
      for (const id of pendingTimeouts) clearTimeout(id);
      pendingTimeouts.clear();
      observer.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", syncRun);
      for (const s of slots) s.instance.destroy?.();
      host.replaceChildren();
    },
  };
}
