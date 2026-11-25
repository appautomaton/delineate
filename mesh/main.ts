// Mesh Gradient v5 standalone Bento page: wires the bare-ground colophon controls (Palette swatch,
// Drift/Still, Day/Night synced to localStorage["delineate-theme"]), inline specimen & chord strips
// inside each of the 4 optical tiles, keyboard shortcuts (1-4 focus tile, ←/→ and Space drive active
// tile), and deterministic query parameters for deep links & QA.
//
//   ?plate=veil|prism|plume|lantern   scroll directly to a bento tile on load
//   ?light=day|night                  override light (else delineate-theme ?? "day")
//   ?palette=0|1|2                    initial harmonic palette chord
//   ?shape=0..5                       initial specimen index on the target ?plate
//   ?still                            freeze autonomous drift, auto-scroll & scroll surge

import { PALETTES, STAGE_TONES, css } from "./palette.ts";
import { PRISM_SOLIDS, TILES, mountBento, type BentoState, type TileId } from "./show.ts";
import { LANTERN_SPECS, VEIL_SHAPES, type Light } from "./types.ts";

const KEY = "delineate-theme";

const params = new URLSearchParams(location.search);
const rootEl = document.querySelector<HTMLElement>("[data-exhibition]")!;
const paletteBtn = document.querySelector<HTMLButtonElement>('[data-action="palette"]')!;
const swatchEl = document.querySelector<HTMLElement>("[data-swatch]")!;
const paletteLabelEl = document.querySelector<HTMLElement>("[data-palette-label]")!;
const motionBtn = document.querySelector<HTMLButtonElement>('[data-toggle="motion"]')!;
const lightBtn = document.querySelector<HTMLButtonElement>('[data-toggle="light"]')!;

const keptLight = (): Light | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "day" || v === "night" ? v : null;
  } catch {
    return null;
  }
};

const rawPlate = params.get("plate");
const initialTile: TileId | undefined =
  rawPlate && (TILES as readonly string[]).includes(rawPlate) ? (rawPlate as TileId) : undefined;

const rawLight = params.get("light");
const explicitLightParam: Light | null = rawLight === "day" || rawLight === "night" ? rawLight : null;
const initialLight: Light = explicitLightParam ?? keptLight() ?? "day";

const parseOptionalInt = (raw: string | null): number | undefined => {
  if (raw === null || raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
};

const paintThemeTokens = (light: Light) => {
  const tone = STAGE_TONES[light];
  document.body.dataset.light = light;
  document.body.style.setProperty("--page-bg", tone.bg);
  document.body.style.setProperty("--page-ink", tone.ink);
  document.body.style.setProperty("--plume-matte", css(tone.plumeMatte));
  lightBtn.querySelector("span")!.textContent = light === "day" ? "Night" : "Day";
};

function populateRow(
  container: HTMLElement | null,
  labels: readonly string[],
  onPick: (index: number) => void,
): HTMLButtonElement[] {
  if (!container) return [];
  container.replaceChildren();
  const buttons: HTMLButtonElement[] = [];
  labels.forEach((label, idx) => {
    if (idx > 0) {
      const sep = document.createElement("span");
      sep.className = "spec-sep";
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = "·";
      container.append(sep);
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "spec-btn";
    btn.textContent = label;
    btn.addEventListener("click", () => onPick(idx));
    container.append(btn);
    buttons.push(btn);
  });
  return buttons;
}

paintThemeTokens(initialLight);

let veilBtns: HTMLButtonElement[] = [];
let prismBtns: HTMLButtonElement[] = [];
let plumeChordBtns: HTMLButtonElement[] = [];
let lanternBtns: HTMLButtonElement[] = [];

const syncChrome = (state: BentoState) => {
  paintThemeTokens(state.light);

  swatchEl.style.setProperty("--swatch-color", state.chordSwatch);
  paletteLabelEl.textContent = state.chordName;

  motionBtn.setAttribute("aria-pressed", String(!state.still));
  motionBtn.querySelector("span")!.textContent = state.still ? "Still" : "Drift";

  veilBtns.forEach((b, i) => b.setAttribute("aria-current", i === state.specimens.veil ? "true" : "false"));
  prismBtns.forEach((b, i) =>
    b.setAttribute("aria-current", i === state.specimens.prism ? "true" : "false"),
  );
  plumeChordBtns.forEach((b, i) =>
    b.setAttribute("aria-current", i === state.plumeChordIndex ? "true" : "false"),
  );
  lanternBtns.forEach((b, i) =>
    b.setAttribute("aria-current", i === state.specimens.lantern ? "true" : "false"),
  );
};

const bento = mountBento(rootEl, {
  initialTile,
  light: initialLight,
  explicitLightParam,
  palette: parseOptionalInt(params.get("palette")),
  shape: parseOptionalInt(params.get("shape")),
  still: params.has("still") ? true : undefined,
  onState: syncChrome,
});

veilBtns = populateRow(
  document.querySelector('[data-specimens="veil"]'),
  VEIL_SHAPES,
  (i) => bento.setSpecimen("veil", i),
);
prismBtns = populateRow(
  document.querySelector('[data-specimens="prism"]'),
  PRISM_SOLIDS,
  (i) => bento.setSpecimen("prism", i),
);
plumeChordBtns = populateRow(
  document.querySelector('[data-chords="plume"]'),
  PALETTES.plume.map((p) => p.id),
  (i) => bento.setPlumeChord(i),
);
lanternBtns = populateRow(
  document.querySelector('[data-specimens="lantern"]'),
  LANTERN_SPECS.map((s) => s.slug),
  (i) => bento.setSpecimen("lantern", i),
);

syncChrome(bento.state());

paletteBtn.addEventListener("click", () => bento.nextChord());
motionBtn.addEventListener("click", () => bento.setStill(!bento.state().still));
lightBtn.addEventListener("click", () => {
  const next: Light = bento.state().light === "day" ? "night" : "day";
  bento.setLight(next);
  try {
    localStorage.setItem(KEY, next);
  } catch {}
});

addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const target = e.target as HTMLElement | null;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

  if (e.key === "1") bento.focusTile("veil");
  else if (e.key === "2") bento.focusTile("prism");
  else if (e.key === "3") bento.focusTile("plume");
  else if (e.key === "4") bento.focusTile("lantern");
  else if (e.key === "ArrowRight") {
    e.preventDefault();
    bento.stepActive(1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    bento.stepActive(-1);
  } else if (e.key === " " || e.code === "Space") {
    if (target && (target.tagName === "BUTTON" || target.tagName === "A")) return;
    e.preventDefault();
    bento.triggerActive();
  }
});
