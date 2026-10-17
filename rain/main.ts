// Rain's own page: one stage, the page around it wearing its sky as it changes, and a switch between dark and
// light. The light is the site's: a reader who chose night or day on delineate's page finds it here, and a
// choice made here is the one that page keeps (under the footer's own key). A reader who never chose gets day,
// as that page gives them.
//
//   ?palette=<name>   start on a palette (slate, celadon, dusk, tea, indigo)
//   ?figure=<who>     her or him, first
//   ?mode=<mode>      dark or light, whatever was chosen
//   ?glyphs=<text>    write the rain in these characters
//   ?rate=<n>         characters begun each second; 0 for none, to look at the figure alone

import { mount, type Choice } from "./show.ts";

const params = new URLSearchParams(location.search);
const host = document.querySelector<HTMLElement>("[data-rain]")!;
const caption = document.querySelector<HTMLElement>(".frame figcaption span")!;
const toggle = document.querySelector<HTMLButtonElement>(".frame figcaption button")!;
let shown: Choice = "auto";

// delineate's page keeps its light as "day" or "night" under this key, and opens by day until one is chosen
// (footers/component.ts).
const KEY = "delineate-theme";
const kept = (() => {
  try {
    return ({ day: "light", night: "dark" } as const)[localStorage.getItem(KEY) as "day" | "night"];
  } catch {
    return undefined;
  }
})() ?? "light";

const stage = await mount(host, {
  palette: params.get("palette") ?? undefined,
  figure: params.get("figure") ?? undefined,
  mode: (params.get("mode") as Choice | null) ?? kept,
  glyphs: params.get("glyphs") ?? undefined,
  rate: params.has("rate") ? Number(params.get("rate")) : undefined,
  onChange: (p, b, mode) => {
    caption.textContent = `${b.name} · ${p.name}`;
    shown = mode;
    toggle.textContent = mode === "dark" ? "Light" : "Dark";
  },
  onTones: (t) => {
    document.body.style.background = t.sky;
    document.body.style.color = t.ink;
  },
});

toggle.addEventListener("click", () => {
  const next = shown === "dark" ? "light" : "dark";
  stage.mode(next);
  try {
    localStorage.setItem(KEY, next === "dark" ? "night" : "day");
  } catch {}
});
