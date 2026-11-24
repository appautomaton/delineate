// Moments standalone page: wires the 5×4 tactile specimen sheet with Loop/Play, procedural Sound,
// and Day/Night light synced to delineate's shared theme key.
//
//   ?light=night|day   override light (otherwise reads delineate-theme, defaulting to night)
//   ?mode=loop|play    start looping choreography or quiet play-only mode
//   ?tile=<slug>       magnify a single tile (e.g. ?tile=tide-progress)
//   ?sound=on          enable subtle Web Audio cues on first gesture

import { mount, type Light, type Mode } from "./show.ts";

const KEY = "delineate-theme";
const PAGE_TONES: Record<Light, { bg: string; ink: string }> = {
  night: { bg: "#0A0A0C", ink: "#F2F2F0" },
  day: { bg: "#F6F5F0", ink: "#1B1B19" },
};

const params = new URLSearchParams(location.search);
const host = document.querySelector<HTMLElement>("[data-moments]")!;
const metaEl = document.querySelector<HTMLElement>("[data-meta]")!;
const loopBtn = document.querySelector<HTMLButtonElement>('[data-toggle="loop"]')!;
const soundBtn = document.querySelector<HTMLButtonElement>('[data-toggle="sound"]')!;
const lightBtn = document.querySelector<HTMLButtonElement>('[data-toggle="light"]')!;

const keptLight = (): Light | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "day" || v === "night" ? v : null;
  } catch {
    return null;
  }
};

const paramLight = params.get("light");
let light: Light =
  paramLight === "day" || paramLight === "night" ? paramLight : keptLight() ?? "night";

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const paramMode = params.get("mode");
let mode: Mode = paramMode === "play" || paramMode === "loop" ? paramMode : calm ? "play" : "loop";
let soundOn = params.get("sound") === "on";

const paintPage = (l: Light) => {
  const t = PAGE_TONES[l];
  document.body.style.setProperty("--page-bg", t.bg);
  document.body.style.setProperty("--page-ink", t.ink);
  lightBtn.querySelector("span")!.textContent = l === "night" ? "Day" : "Night";
};

const paintButtons = () => {
  loopBtn.setAttribute("aria-pressed", String(mode === "loop"));
  soundBtn.setAttribute("aria-pressed", String(soundOn));
};

paintPage(light);
paintButtons();

const stage = mount(host, {
  light,
  mode,
  tile: params.get("tile"),
  sound: soundOn,
});

if (stage.focused) {
  metaEl.textContent = `${stage.focused.name} · ${stage.focused.material}`;
} else {
  const syncMeta = () => {
    const cols = innerWidth <= 780 ? 2 : innerWidth <= 1080 ? 4 : 5;
    const rows = Math.ceil(stage.count / cols);
    metaEl.textContent = `${stage.count} Interactions · ${cols} × ${rows}`;
  };
  syncMeta();
  addEventListener("resize", syncMeta, { passive: true });
}

loopBtn.addEventListener("click", () => {
  mode = mode === "loop" ? "play" : "loop";
  stage.setMode(mode);
  paintButtons();
});

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  stage.setSound(soundOn);
  paintButtons();
});

lightBtn.addEventListener("click", () => {
  light = light === "night" ? "day" : "night";
  stage.setLight(light);
  paintPage(light);
  try {
    localStorage.setItem(KEY, light);
  } catch {}
});
