// Assembly's page, made in front of the reader by a crew of hands. They circle the name while the type loads,
// set to work section by section as the page scrolls into view, and when the last section is done they fly as
// one flock after the reader's own pointer.

import { Clock } from "./hand/clock.ts";
import { Crew } from "./hand/crew.ts";
import { Flock, circle } from "./hand/flock.ts";
import { Hand } from "./hand/hand.ts";
import { Marks } from "./hand/marks.ts";
import type { Pt } from "./hand/motion.ts";

const $ = (s: string) => document.querySelector(s) as HTMLElement;
const root = document.documentElement;

// The hands wear the site's crayons, by name, so the pointers belong to the drawings they make and turn pastel
// with them at night.
const COLOURS = ["blue", "red", "ochre", "green", "pink", "violet", "rust", "deep", "olive", "maroon", "pine"].map((c) => `var(--c-${c})`);
const ROLES = ["grid", "type", "wax", "ink", "copy", "line", "edit", "draw"];

// As many hands as the screen has room for: thirty-two on a wide one, ten on a phone.
const HANDS = Math.round(Math.min(32, Math.max(10, (innerWidth * innerHeight) / 36000)));

// Faster than a person, with a person's way of moving.
const STYLE = { tempo: 0.6, curl: 0.05, scatter: 1 };

// Day or night, as on delineate's page, which keeps the choice under the same name.
const light = $(".light");
const showLight = () => {
  const night = root.dataset.theme === "night";
  light.textContent = night ? "Day" : "Night";
  light.setAttribute("aria-pressed", String(night));
};
light.addEventListener("click", () => {
  const theme = root.dataset.theme === "night" ? "day" : "night";
  root.dataset.theme = theme;
  try {
    localStorage.setItem("delineate-theme", theme);
  } catch {}
  showLight();
});
showLight();

// The page says how many hands made it.
$(".confession-lead").textContent = `This page was drawn by ${HANDS} hands while you scrolled.`;

if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  root.classList.remove("is-preparing");
  $(".readout").remove();
} else {
  await document.fonts.ready;
  history.scrollRestoration = "manual";
  scrollTo(0, 0);
  run();
}

async function run() {
  const clock = new Clock();
  const marks = new Marks($(".marks"));
  const centre = (): Pt => ({ x: scrollX + innerWidth / 2, y: scrollY + innerHeight * 0.46 });
  const hands = Array.from(
    { length: HANDS },
    (_, i) =>
      new Hand(clock, $(".hands"), {
        name: `${ROLES[i % ROLES.length]}-${String(i + 1).padStart(2, "0")}`,
        colour: COLOURS[i % COLOURS.length],
        seed: 7001 + i * 31,
        start: centre(),
        style: STYLE,
      }),
  );
  const crew = new Crew(document.body, hands, marks, clock);
  root.classList.remove("is-preparing");

  // The readout, and the rulers while anything is being made.
  const text = $(".readout-text");
  const meter = $(".readout-meter");
  const { stats } = crew;
  clock.each(() => {
    marks.rulers = stats.busy > 0;
    marks.draw();
  });
  const read = () => {
    const done = Math.round((stats.done / stats.total) * 100);
    const parts = [`${stats.busy} ${stats.busy === 1 ? "hand" : "hands"} at work`, `${stats.done} / ${stats.total} pieces`];
    if (stats.conflicts) parts.push(`${stats.settled} of ${stats.conflicts} clashes settled`);
    text.textContent = parts.join("  ·  ");
    meter.style.setProperty("--done", `${done}%`);
  };
  crew.onchange = read;
  read();

  const opening = clock.wait(2.6);
  circle(hands, clock, centre, opening);
  await opening;
  root.classList.add("is-open");
  crew.start();

  await crew.finished;
  root.classList.add("is-built");
  text.textContent = `built by ${HANDS} hands  ·  ${stats.total} pieces  ·  ${stats.settled} clashes settled`;

  // The reveal: the flock follows the reader's pointer, or, until it moves, a slow figure about the screen.
  let seen: Pt | null = null;
  let client: Pt = { x: innerWidth / 2, y: innerHeight / 2 };
  addEventListener("pointermove", (e) => {
    client = { x: e.clientX, y: e.clientY };
    seen = client;
  });
  const flock = new Flock(hands, clock, centre());
  clock.each((now) => {
    flock.target = seen
      ? { x: client.x + scrollX, y: client.y + scrollY }
      : { x: scrollX + innerWidth * (0.5 + 0.3 * Math.sin(now * 0.5)), y: scrollY + innerHeight * (0.5 + 0.25 * Math.sin(now * 0.9)) };
  });
}
