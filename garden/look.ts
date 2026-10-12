// Looks at the gardens the way a visitor meets them: every layout, by day and by night, fully
// grown. Saves a screenshot of each to garden/look/<garden>/<screen>-<light>.png and prints what a
// screenshot hides: how many plants each layout shows, which ones the solver left out, and which
// paint under the controls.
//
//   npm run look              every garden
//   npm run look namib fynbos the gardens named

import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { launch } from "../portraits/harness/browser.ts";
import { GARDENS } from "./src/garden/gardens.ts";

// One screen for each layout tier in the gardens' CSS (see ref/layout.md in the climate-garden
// skill), in CSS pixels.
const SCREENS: Record<string, [number, number]> = {
  phone: [390, 844],
  tablet: [820, 1180],
  laptop: [1440, 900],
  wide: [1680, 1050],
  short: [844, 390],
};
const CLEAR = 8; // how close to the controls, in CSS pixels, a plant may paint

const keys = process.argv.length > 2 ? process.argv.slice(2) : GARDENS.map((g) => g.key);
const unknown = keys.filter((key) => !GARDENS.some((g) => g.key === key));
if (unknown.length) throw new Error(`No garden named ${unknown.join(", ")}. Gardens: ${GARDENS.map((g) => g.key).join(", ")}`);

const root = fileURLToPath(new URL(".", import.meta.url));
const server = await createServer({ root, logLevel: "silent", server: { port: 0 } });
await server.listen();
const browser = await launch();
try {
  for (const key of keys) {
    mkdirSync(`${root}look/${key}`, { recursive: true });
    console.log(key);
    for (const [screen, [width, height]] of Object.entries(SCREENS)) {
      for (const light of ["light", "dark"] as const) {
        // Reduced motion shows the garden fully grown at once, with nothing still entering.
        const context = await browser.newContext({ viewport: { width, height }, colorScheme: light, reducedMotion: "reduce" });
        const page = await context.newPage();
        await page.goto(`${server.resolvedUrls!.local[0]}?garden=${key}`);
        await page.waitForFunction(planted);
        await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
        await page.screenshot({ path: `${root}look/${key}/${screen}-${light}.png` });
        if (light === "light") report(screen, await page.evaluate(survey, CLEAR));
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  await server.close();
}

function report(screen: string, { shown, crowded, under }: { shown: number; crowded: string[]; under: string[] }) {
  const notes = [crowded.length && `left out: ${crowded.join(", ")}`, under.length && `under the controls: ${under.join(", ")}`].filter(Boolean);
  console.log(`  ${screen.padEnd(7)}${String(shown).padStart(2)} plants${notes.length ? `   ${notes.join("   ")}` : ""}`);
}

// In the page: every plant the layout shows has been fetched and drawn.
function planted() {
  const beds = [...document.querySelectorAll<HTMLElement>(".garden .plant")].filter((bed) => getComputedStyle(bed).display !== "none");
  return beds.length > 0 && beds.every((bed) => bed.querySelector("svg"));
}

// In the page: the plants shown, the ones the solver left out, and the ones whose paint reaches
// within `clear` pixels of the controls. Plants ignore the pointer, so hit testing is switched on
// for them while the controls' box is sampled.
function survey(clear: number) {
  const garden = document.documentElement.dataset.garden;
  const beds = [...document.querySelectorAll<HTMLElement>(`.garden .plant[data-garden="${garden}"]`)];
  const hit = document.head.appendChild(document.createElement("style"));
  hit.textContent = ".garden .plant * { pointer-events: visiblePainted !important; }";
  const box = document.querySelector(".controls")!.getBoundingClientRect();
  const under = new Set<string>();
  for (let y = box.top - clear; y <= box.bottom + clear; y += 4)
    for (let x = box.left - clear; x <= box.right + clear; x += 4)
      for (const el of document.elementsFromPoint(x, y)) {
        // Only painted geometry counts: an inline <svg> answers anywhere in its box.
        const bed = el instanceof SVGGeometryElement && el.closest<HTMLElement>(".garden .plant");
        if (bed) under.add(bed.dataset.plant!);
      }
  hit.remove();
  return {
    shown: beds.filter((bed) => getComputedStyle(bed).display !== "none").length,
    crowded: beds.filter((bed) => "crowded" in bed.dataset).map((bed) => bed.dataset.plant!),
    under: [...under],
  };
}
