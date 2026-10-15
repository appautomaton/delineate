// Assembly as another page shows it: a small sheet on which a few hands build a miniature of Assembly's first
// screen, rest, clear it, and build it again, for as long as the sheet is in view. delineate's page mounts it:
//
//   import("./assembly/show.js").then(({ mount }) => mount(document.querySelector("[data-assembly]")));
//
// The sheet brings its own stylesheets and markup, from beside this module; it takes its paper, ink and crayons
// from the page around it, so it keeps that page's light.

import { Clock } from "./hand/clock.ts";
import { Crew } from "./hand/crew.ts";
import { Hand } from "./hand/hand.ts";
import { Marks } from "./hand/marks.ts";
import { stage as stageSpace } from "./hand/space.ts";

const COLOURS = ["blue", "red", "ochre", "green", "violet", "rust"].map((c) => `var(--c-${c})`);
const NAMES = ["grid-01", "type-02", "wax-03", "ink-04", "copy-05", "draw-06"];
// A small sheet's hands keep to its scale: a little quicker over shorter distances.
const STYLE = { tempo: 0.55, curl: 0.05, scatter: 1 };

// Stylesheets from beside this module, and the sheet's markup.
function styles(...hrefs: string[]) {
  for (const href of hrefs) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = new URL(href, import.meta.url).href;
    document.head.append(link);
  }
}
const sheetMarkup = async () => (await fetch(new URL("./show.html", import.meta.url))).text();

export async function mount(stage: HTMLElement): Promise<void> {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return still(stage);
  styles("./hand/hand.css", "./show.css");
  const markup = await sheetMarkup();
  await document.fonts.ready;

  stage.classList.add("assembly-stage");
  stage.innerHTML = '<div class="show-sheet"></div><div class="marks"></div><div class="hands"></div>';
  const sheet = stage.querySelector<HTMLElement>(".show-sheet")!;
  const space = stageSpace(stage);
  const clock = new Clock();
  const marks = new Marks(stage.querySelector(".marks")!, { rulers: false });
  const middle = () => ({ x: stage.clientWidth / 2, y: stage.clientHeight / 2 });
  const hands = NAMES.map((name, i) => new Hand(clock, stage.querySelector(".hands")!, { name, colour: COLOURS[i], seed: 4001 + i * 17, start: middle(), style: STYLE }));

  // Work only while the sheet can be seen.
  let seen: () => void = () => {};
  let visible = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) seen();
  }, { threshold: 0.4 }).observe(stage);
  const inView = () => (visible ? Promise.resolve() : new Promise<void>((done) => (seen = done)));

  for (;;) {
    await inView();
    sheet.classList.remove("is-clearing");
    sheet.innerHTML = markup;
    const crew = new Crew(sheet, hands, marks, clock, space);
    crew.start();
    await crew.finished;
    // The finished sheet holds a while, then clears for the next.
    await clock.wait(4.5);
    sheet.classList.add("is-clearing");
    await clock.wait(0.7);
  }
}

// Without motion, the finished sheet, drawn.
async function still(stage: HTMLElement) {
  styles("./show.css");
  stage.classList.add("assembly-stage");
  stage.innerHTML = `<div class="show-sheet">${await sheetMarkup()}</div>`;
  for (const p of stage.querySelectorAll<SVGPathElement>(".wax path")) p.style.strokeDashoffset = "0";
}
