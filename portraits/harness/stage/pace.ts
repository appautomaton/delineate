// Frame pacing of a separation page in Chrome at device pixel ratio 2, with the pointer moving:
// together, and with the planes apart. Reports frames per second, the share of frames over 20 ms,
// the main thread's busy share (Chrome DevTools Protocol Performance.getMetrics: TaskDuration over
// wall time), and how much of that is style recalculation and layout.
//
//   node portraits/harness/stage/pace.ts <page.html> [seconds per run]
//
// The page is expected to have a range input #apart from 0 to 100, as the separation pages do.

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { launch } from "../browser.ts";

const [file, seconds = "6"] = process.argv.slice(2);
const browser = await launch();
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(pathToFileURL(resolve(file)).href);
  await page.waitForTimeout(2500);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  const metrics = async () => Object.fromEntries(((await cdp.send("Performance.getMetrics")) as { metrics: { name: string; value: number }[] }).metrics.map((m) => [m.name, m.value]));

  for (const apart of [0, 100]) {
    await page.evaluate((v) => {
      const s = document.getElementById("apart") as HTMLInputElement;
      s.value = String(v);
      s.dispatchEvent(new Event("input"));
    }, apart);
    await page.waitForTimeout(1500);
    const box = (await page.locator("#stack").boundingBox())!;
    const before = await metrics();
    const frames = page.evaluate(
      (ms) =>
        new Promise<number[]>((done) => {
          const times: number[] = [];
          const end = performance.now() + ms;
          requestAnimationFrame(function tick(t) {
            times.push(t);
            if (t < end) requestAnimationFrame(tick);
            else done(times);
          });
        }),
      Number(seconds) * 1000,
    );
    // The pointer circles the picture while the frames are counted.
    const started = Date.now();
    while (Date.now() - started < Number(seconds) * 1000) {
      const a = ((Date.now() - started) / 1000) * 2.2;
      await page.mouse.move(box.x + box.width * (0.5 + 0.4 * Math.cos(a)), box.y + box.height * (0.5 + 0.4 * Math.sin(1.3 * a)));
      await page.waitForTimeout(16);
    }
    const times = await frames;
    const after = await metrics();
    const gaps = times.slice(1).map((t, i) => t - times[i]);
    const wall = (times[times.length - 1] - times[0]) / 1000;
    const busy = (k: string) => (after[k] - before[k]) / wall;
    console.log(
      `${apart ? "apart   " : "together"}  ${(gaps.length / wall).toFixed(1)} fps   frames over 20 ms: ${((gaps.filter((g) => g > 20).length / gaps.length) * 100).toFixed(1)}%   main thread ${(busy("TaskDuration") * 100).toFixed(0)}% (style ${(busy("RecalcStyleDuration") * 100).toFixed(0)}%, layout ${(busy("LayoutDuration") * 100).toFixed(0)}%)`,
    );
  }
} finally {
  await browser.close();
}
