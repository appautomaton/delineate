// Glass's own page: one stage, a line naming the shape, and two switches: to the next page, and between day and
// night. The pages are a line of words, then a Garden drawing, in turn (source.ts). The light is the site's: a reader who chose night or day on delineate's page finds it
// here, and a choice made here is the one that page keeps (under the footer's own key); one who never chose gets
// day, as that page gives them. Its colours are Glass's own (palette.ts): each turn of the light brings that
// light's next pair of paper and ink, and the page around the stage wears what the stage does.
//
//   ?words=<text>     these words for every line of words
//   ?picture          open on a drawing rather than words
//   ?shape=<name>     start as ring, tetrahedron, octahedron, sphere, cube or capsule
//   ?light=<light>    day or night, whatever was chosen
//   ?tones=<name>     start on one pair of paper and ink, and in its light: paper, sage, clay, mist by day,
//                     indigo, pine, umber, graphite by night
//   ?still            held still in the middle, the next shape on a click, the next page when asked: to judge
//                     one at a time

import { SHAPES, type Shape } from "./shader.ts";
import { mount } from "./show.ts";
import { named, TONES, type Light, type Tones } from "./palette.ts";
import { PICTURES, WORDS } from "./pages.ts";
import type { Page } from "./source.ts";

const params = new URLSearchParams(location.search);
const host = document.querySelector<HTMLElement>("[data-glass]")!;
const shown = document.querySelector<HTMLElement>(".frame figcaption span")!;
const [onward, lights] = document.querySelectorAll<HTMLButtonElement>(".frame figcaption button");

// words, then a drawing, then words, as long as there are both
const lines = params.get("words") ? [params.get("words")!] : WORDS;
const pages: Page[] = [];
for (let i = 0; i < Math.max(lines.length, PICTURES.length); i++)
  pages.push({ kind: "words", text: lines[i % lines.length] }, { kind: "picture", name: PICTURES[i % PICTURES.length] });

// delineate's page keeps its light as "day" or "night" under this key, and opens by day until one is chosen
// (footers/component.ts).
const KEY = "delineate-theme";
const kept = (): Light | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "day" || v === "night" ? v : null;
  } catch {
    return null;
  }
};
const asked = named(params.get("tones"));
const param = params.get("light");
let light: Light = asked?.light ?? (param === "day" || param === "night" ? param : null) ?? kept() ?? "day";

// how many times each light has come, so each time brings its next pair; the first is the light's first
const turns = { day: -1, night: -1 };
const next = (l: Light): Tones => TONES[l][++turns[l] % TONES[l].length];
if (asked) turns[light] = TONES[light].indexOf(asked.tones) - 1;
let tones = next(light);

const colour = (paper: string, ink: string) => {
  document.body.style.background = paper;
  document.body.style.color = ink;
};
colour(tones.paper, tones.ink);
const wear = () => (lights.textContent = light === "day" ? "Night" : "Day");
wear();
onward.textContent = "Next";
const describe = (p: Page) =>
  host.setAttribute("aria-label", p.kind === "words" ? `A solid of glass held over the words “${p.text}”` : `A solid of glass held over a drawing of ${p.name === "agave" || p.name === "alocasia" ? "an" : "a"} ${p.name}`);

const shape = params.get("shape") as Shape | null;
const stage = await mount(host, {
  pages,
  start: params.has("picture") ? 1 : 0,
  light,
  tones,
  shape: shape && SHAPES.includes(shape) ? shape : undefined,
  still: params.has("still"),
  onShape: (s) => (shown.textContent = s),
  onWear: colour,
  onPage: describe,
});

lights.addEventListener("click", () => {
  light = light === "day" ? "night" : "day";
  tones = next(light);
  stage.wear(light, tones);
  wear();
  try {
    localStorage.setItem(KEY, light);
  } catch {}
});
onward.addEventListener("click", stage.next);
