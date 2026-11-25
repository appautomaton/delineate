// Moments specimen stage: mounts the 5×4 grid, a curated subset (`slugs`), or a single focused
// tile (`tile`), drives the shared requestAnimationFrame scheduler with automatic idle-sleep,
// pauses out of view or when the tab is hidden, and advances per-tile Loop clocks cleanly.

import { SoundEngine } from "./sound.ts";
import type { TileInstance, TileSpec } from "./tile.ts";
import { TILES } from "./tiles/index.ts";

export type Light = "night" | "day";
export type Mode = "loop" | "play";

export type StageOptions = {
  light?: Light;
  mode?: Mode;
  tile?: string | null;
  slugs?: readonly string[];
  sound?: boolean;
  onInteract?: (spec: TileSpec, index: number) => void;
};

export type Stage = {
  setLight(light: Light): void;
  setMode(mode: Mode): void;
  setSound(enabled: boolean): void;
  readonly count: number;
  readonly focused: TileSpec | null;
  destroy(): void;
};

type MountedTile = {
  spec: TileSpec;
  instance: TileInstance;
  card: HTMLElement;
  awake: boolean;
  visible: boolean;
  demoTime: number;
  userUntil: number;
};

const USER_HOLD_MS = 4500;
const STEP_60_MS = 1000 / 60;
const STEP_24_MS = 1000 / 24;
const VSYNC_SLACK_MS = 3.5;

export function mount(host: HTMLElement, options: StageOptions = {}): Stage {
  const calm = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let light: Light = options.light ?? "night";
  let mode: Mode = options.mode ?? (calm ? "play" : "loop");

  const focused = options.tile ? TILES.find((t) => t.slug === options.tile) ?? null : null;
  const list: readonly TileSpec[] = focused
    ? [focused]
    : options.slugs?.length
      ? options.slugs.map((s) => TILES.find((t) => t.slug === s)).filter((t): t is TileSpec => Boolean(t))
      : TILES;

  const sound = new SoundEngine();
  if (options.sound) sound.setEnabled(true);

  const root = document.createElement("div");
  root.className = focused ? "moments is-single" : "moments";
  root.dataset.light = light;

  const grid = document.createElement("div");
  grid.className = "moments-grid";
  root.append(grid);
  host.replaceChildren(root);

  let rafId = 0;
  let inFrame = false;
  let lastNow = 0;
  let nextDue = 0;
  let anyAwakeState = true;
  let elapsed = 0;
  let visibleCount = 0;
  const mounted: MountedTile[] = [];
  const cardMap = new WeakMap<Element, MountedTile>();

  const isRunning = () => visibleCount > 0 && !document.hidden;

  const schedule = () => {
    anyAwakeState = true;
    if (rafId || inFrame || !isRunning()) return;
    lastNow = performance.now();
    nextDue = 0;
    rafId = requestAnimationFrame(frame);
  };

  const wakeAll = () => {
    for (const m of mounted) m.awake = true;
    schedule();
  };

  list.forEach((spec, idx) => {
    const posterIndex = TILES.indexOf(spec) + 1;
    const number = String(posterIndex > 0 ? posterIndex : idx + 1).padStart(2, "0");

    const card = document.createElement("article");
    card.className = "moment-card";
    card.style.setProperty("--enter-i", String(idx));
    card.tabIndex = 0;
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", `${spec.name} (${spec.material}). ${spec.hint}`);

    const head = document.createElement("div");
    head.className = "moment-head";
    const numEl = document.createElement("span");
    numEl.className = "moment-idx";
    numEl.textContent = number;
    const matEl = document.createElement("span");
    matEl.className = "moment-mat";
    matEl.textContent = spec.material;
    head.append(numEl, matEl);

    const stageSlot = document.createElement("div");
    stageSlot.className = "moment-stage";

    const footer = document.createElement("div");
    const title = document.createElement("p");
    title.className = "moment-title";
    title.textContent = spec.name;
    const hint = document.createElement("p");
    hint.className = "moment-hint";
    hint.textContent = spec.hint;
    footer.append(title, hint);

    const entry: MountedTile = {
      spec,
      instance: null as unknown as TileInstance,
      card,
      awake: true,
      visible: true,
      demoTime: idx * 0.42,
      userUntil: 0,
    };
    visibleCount++;
    cardMap.set(card, entry);

    const instance = spec.mount({
      wake() {
        entry.awake = true;
        schedule();
      },
      sound(cue, intensity) {
        sound.play(cue, intensity);
      },
      interact() {
        entry.userUntil = performance.now() + USER_HOLD_MS;
        entry.awake = true;
        options.onInteract?.(spec, posterIndex > 0 ? posterIndex : idx + 1);
        schedule();
      },
    });
    entry.instance = instance;

    stageSlot.append(instance.el);
    card.append(head, stageSlot, footer);
    grid.append(card);

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        instance.trigger();
      }
    });

    mounted.push(entry);
  });

  const frame = (now: number) => {
    rafId = 0;
    if (!isRunning()) return;

    const stepMs = anyAwakeState ? STEP_60_MS : STEP_24_MS;
    if (nextDue > 0 && now + VSYNC_SLACK_MS < nextDue) {
      rafId = requestAnimationFrame(frame);
      return;
    }
    nextDue = nextDue > now - stepMs ? nextDue + stepMs : now + stepMs;

    inFrame = true;
    const dt = Math.min(0.05, Math.max(0.001, (now - lastNow) / 1000));
    lastNow = now;
    elapsed += dt;

    let anyAwake = false;
    for (const m of mounted) {
      if (!m.visible) continue;
      const underUserControl = now < m.userUntil;
      if (mode === "loop" && !underUserControl) {
        m.demoTime += dt;
        m.instance.demo(m.demoTime, dt);
      }
      if (m.awake) {
        m.awake = false;
        if (m.instance.step(dt, elapsed)) m.awake = true;
        if (m.awake) anyAwake = true;
      }
    }
    anyAwakeState = anyAwake;
    inFrame = false;

    if (!rafId && (anyAwake || (mode === "loop" && visibleCount > 0))) {
      rafId = requestAnimationFrame(frame);
    }
  };

  const syncRun = () => {
    if (isRunning()) {
      if (mode === "loop" || mounted.some((m) => m.visible && m.awake)) schedule();
    } else if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  // Per-card visibility culling: off-screen cards (especially on mobile 2×10) cost zero CPU/GPU!
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const m = cardMap.get(e.target);
        if (!m || m.visible === e.isIntersecting) continue;
        m.visible = e.isIntersecting;
        visibleCount += m.visible ? 1 : -1;
      }
      syncRun();
    },
    { threshold: 0.01 },
  );
  for (const m of mounted) observer.observe(m.card);
  document.addEventListener("visibilitychange", syncRun);

  wakeAll();

  return {
    setLight(next) {
      light = next;
      root.dataset.light = next;
    },
    setMode(next) {
      mode = next;
      if (mode === "loop") {
        for (const m of mounted) m.userUntil = 0;
        wakeAll();
      }
    },
    setSound(enabled) {
      sound.setEnabled(enabled, enabled);
    },
    count: list.length,
    focused,
    destroy() {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncRun);
      if (rafId) cancelAnimationFrame(rafId);
      for (const m of mounted) m.instance.destroy?.();
      host.replaceChildren();
    },
  };
}
