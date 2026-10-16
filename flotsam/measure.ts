// Measures Flotsam as a visitor's browser runs it: the page's frames, the water's ticks, and whether the water
// falls asleep when still and wakes when shaken. It opens its own Chrome, with no debugger attached: a debugger
// on the water's thread slows it more than tenfold, so numbers from a browser being driven by devtools mislead.
//
//   node flotsam/measure.ts [url]        (default: the dev server, at an address that leads nowhere)

import { chromium, type Page } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:5340/lost";
const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-size=1440,900"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
await page.goto(url);
await page.waitForFunction(() => (window as any).flotsam?.stats());

type Stats = { ms: number; stir: number; heard: number };
const stats = (p: Page) => p.evaluate(() => (window as any).flotsam.stats() as Stats);

// Over `secs`: the page's frame times, the water's tick times and how many frames it sent.
async function sample(label: string, secs: number) {
  const before = (await stats(page)).heard;
  const r = await page.evaluate(async (secs) => {
    const frames: number[] = [], ticks: number[] = [];
    const end = performance.now() + secs * 1000;
    const poll = setInterval(() => ticks.push((window as any).flotsam.stats().ms), 100);
    await new Promise<void>((done) => {
      const f = (t: number) => (frames.push(t), t < end ? requestAnimationFrame(f) : done());
      requestAnimationFrame(f);
    });
    clearInterval(poll);
    const gaps = frames.slice(1).map((t, i) => t - frames[i]).sort((a, b) => a - b);
    ticks.sort((a, b) => a - b);
    return { median: gaps[gaps.length >> 1], worst: gaps.at(-1)!, tick: ticks[ticks.length >> 1] };
  }, secs);
  const s = await stats(page);
  const sent = (s.heard - before) / secs;
  console.log(
    `${label.padEnd(12)} page ${r.median.toFixed(1)} ms a frame (worst ${r.worst.toFixed(1)})  ` +
      `water ${sent.toFixed(0)} frames/s, ${r.tick.toFixed(1)} ms a tick  stirred ${s.stir.toFixed(0)} px/s${sent < 1 ? "  (asleep)" : ""}`,
  );
}

await sample("opening", 3);
await sample("settling", 4);
await sample("still", 4);
await page.evaluate(() => (window as any).flotsam.shake());
await sample("shaken", 2);
await sample("after", 6);
await browser.close();
