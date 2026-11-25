// Patch Stage-2 Entry Point: wires the 3x2 Specimen Sheet, bare-ground colophon toolbar
// (View: Stitch · Split · SVG + Day/Night synced to localStorage["delineate-theme"]),
// keyboard shortcuts (1-6 open badge modal, Esc close, ←/→ cycle), and QA telemetry hooks.

import {
  mountPatchExhibition,
  type LightMode,
  type PatchExhibition,
  type PatchTelemetry,
  type ViewMode,
} from "./show.ts";

declare global {
  interface Window {
    __PATCH_READY__?: boolean;
    __PATCH_STAGE__?: PatchExhibition;
    __PATCH_TELEMETRY__?: () => PatchTelemetry;
    __PATCH_BENCH__?: (frames?: number) => number;
  }
}

const THEME_KEY = "delineate-theme";
const params = new URLSearchParams(location.search);

const readStoredTheme = (): LightMode | null => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "day" || v === "night" ? v : null;
  } catch {
    return null;
  }
};

const rawLight = params.get("light");
const initialLight: LightMode =
  rawLight === "day" || rawLight === "night" ? rawLight : (readStoredTheme() ?? "day");

const rawView = params.get("view");
const initialView: ViewMode =
  rawView === "stitch" || rawView === "split" || rawView === "svg" ? rawView : "stitch";

const rawSeed = params.get("seed");
const parsedSeed = rawSeed !== null ? Number(rawSeed) : null;

const still = params.get("still") === "1";
const initialBadgeYear = params.get("badge");

document.body.dataset.light = initialLight;

const root = document.querySelector<HTMLElement>("[data-exhibition]");
const viewBtns = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-view]"));
const shuffleBtn = document.querySelector<HTMLButtonElement>("[data-action='shuffle']");
const lightBtn = document.querySelector<HTMLButtonElement>("[data-toggle='light']");

const syncColophon = (state: { light: LightMode; view: ViewMode }) => {
  document.body.dataset.light = state.light;
  if (lightBtn) {
    lightBtn.querySelector("span")!.textContent = state.light === "day" ? "Night" : "Day";
  }
  for (const btn of viewBtns) {
    btn.setAttribute("aria-pressed", btn.dataset.view === state.view ? "true" : "false");
  }
};

if (root) {
  let currentLight = initialLight;
  let currentView = initialView;

  const exhibition = mountPatchExhibition(root, {
    light: initialLight,
    view: initialView,
    initialBadgeYear,
    still,
    seed: parsedSeed,
    onStateChange(st) {
      currentLight = st.light;
      currentView = st.view;
      syncColophon(st);
    },
  });

  syncColophon({ light: currentLight, view: currentView });

  for (const btn of viewBtns) {
    btn.addEventListener("click", () => {
      const next = btn.dataset.view as ViewMode | undefined;
      if (next) exhibition.setView(next);
    });
  }

  shuffleBtn?.addEventListener("click", () => {
    exhibition.shuffle();
  });

  lightBtn?.addEventListener("click", () => {
    const next: LightMode = currentLight === "day" ? "night" : "day";
    exhibition.setLight(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore storage failure
    }
  });

  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

    if (e.key === "Escape") {
      exhibition.closeModal();
    } else if (e.key === "ArrowRight") {
      exhibition.stepModal(1);
    } else if (e.key === "ArrowLeft") {
      exhibition.stepModal(-1);
    } else if (e.key >= "1" && e.key <= "6") {
      const idx = Number(e.key) - 1;
      const year = String(2026 + idx);
      exhibition.openModal(year);
    }
  });

  window.__PATCH_STAGE__ = exhibition;
  window.__PATCH_TELEMETRY__ = () => exhibition.telemetry();
  window.__PATCH_BENCH__ = (frames?: number) => exhibition.bench(frames);
  window.__PATCH_READY__ = true;
  window.addEventListener("pagehide", () => exhibition.destroy(), { once: true });
}
