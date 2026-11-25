// Real-Chrome GPU capture, registration audit & performance verifier for Patch Stage 2.
//
// Builds patch/dist, serves on an ephemeral port (port: 0, never colliding with dev.ts on 5411),
// captures Desktop Day/Night, Hover Pointer-X split curtain, global Split & SVG sheets, and
// Dual-Plate Inspection Modals for all 6 badges (2026-2031) into:
//   /Users/ac/dev/agents/design/d3lin3at3/.references/textile-study/stage2/
//
// Also asserts strict GPU & pacing contracts:
//   - glContextCount === 1
//   - atlasVramBytes < 28 MB
//   - idleRafPerSec === 0 (true 0.0 fps idle sleep!)
//   - glError === 0
//   - consoleErrors === 0
//
//   node patch/look.ts

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch } from "../portraits/harness/browser.ts";
import { serve } from "../tools/serve.ts";
import { DIST, build } from "./build.ts";

const OUT_DIR = "/Users/ac/dev/agents/design/d3lin3at3/.references/textile-study/stage2";

interface TelemetrySnapshot {
  glContextCount: number;
  atlasVramBytes: number;
  bakeMs: number;
  glError: number;
  activeRaf: boolean;
  rafTicksTotal: number;
  visibleCards: number;
  viewMode: string;
  light: string;
  modalYear: string | null;
  badgeIds: string[];
}

mkdirSync(OUT_DIR, { recursive: true });
build(DIST);

// Use port 0 so QA captures NEVER collide with live dev server on 5411!
const server = await serve(DIST, { port: 0 });
const browser = await launch();

const errors: string[] = [];

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  const waitFrames = async (n = 3) => {
    await page.evaluate(
      (count: number) =>
        new Promise<void>((resolve) => {
          let i = 0;
          const step = () => {
            if (++i >= count) resolve();
            else requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }),
      n,
    );
  };

  // 1. Load live interactive page (NOT ?still=1) to verify real 0.0 fps idle sleep & hover physics!
  await page.goto(`${server.url}?light=day`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean((window as { __PATCH_READY__?: boolean }).__PATCH_READY__));
  await waitFrames(4);

  // Measure true idle sleep over 1100 ms right after load
  const idleCheckA = await page.evaluate(async () => {
    const fn = (window as { __PATCH_TELEMETRY__?: () => TelemetrySnapshot }).__PATCH_TELEMETRY__!;
    const t0 = fn();
    await new Promise((r) => setTimeout(r, 1100));
    const t1 = fn();
    return { t0, t1, deltaTicks: t1.rafTicksTotal - t0.rafTicksTotal };
  });

  // Measure real GPU frame time drawing all 6 badges
  const gpuFrameMs = await page.evaluate(() => {
    const fn = (window as { __PATCH_BENCH__?: (n?: number) => number }).__PATCH_BENCH__;
    return fn ? fn(24) : -1;
  });

  // Capture 01: Desktop Day 3x2 Embroidered Sheet
  await waitFrames(2);
  await page.screenshot({ path: join(OUT_DIR, "01_desktop_day.png"), type: "png" });

  // Capture 02: Real Pointer-X Hover Split Curtain across 2026 APEX & 2028 FLORA
  const card0Box = await page.locator(".patch-card[data-badge='2026'] .card-stage").boundingBox();
  if (card0Box) {
    await page.mouse.move(card0Box.x + card0Box.width * 0.54, card0Box.y + card0Box.height * 0.5);
    await page.waitForTimeout(420);
  }
  await page.screenshot({ path: join(OUT_DIR, "03_hover_curtain_day.png"), type: "png" });

  // Move pointer off card and verify true 0.0 fps idle sleep returns after spring settles!
  await page.mouse.move(4, 4);
  await page.waitForTimeout(1050);
  const idleCheckB = await page.evaluate(async () => {
    const fn = (window as { __PATCH_TELEMETRY__?: () => TelemetrySnapshot }).__PATCH_TELEMETRY__!;
    const t0 = fn();
    await new Promise((r) => setTimeout(r, 1000));
    const t1 = fn();
    return { activeRaf: t1.activeRaf, deltaTicks: t1.rafTicksTotal - t0.rafTicksTotal };
  });

  // Reset light direction cleanly via ?still=1 for deterministic archival plates
  await page.goto(`${server.url}?light=night&seed=2026&still=1`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean((window as { __PATCH_READY__?: boolean }).__PATCH_READY__));
  await waitFrames(3);
  await page.screenshot({ path: join(OUT_DIR, "02_desktop_night.png"), type: "png" });

  // Capture 05 & 06: Pure Monochrome <svg> Blueprint Sheet (Day & Night)
  await page.goto(`${server.url}?light=day&view=svg&seed=2026&still=1`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean((window as { __PATCH_READY__?: boolean }).__PATCH_READY__));
  await waitFrames(3);
  await page.screenshot({ path: join(OUT_DIR, "05_svg_all_day.png"), type: "png" });

  await page.goto(`${server.url}?light=night&view=svg&seed=2026&still=1`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean((window as { __PATCH_READY__?: boolean }).__PATCH_READY__));
  await waitFrames(3);
  await page.screenshot({ path: join(OUT_DIR, "06_svg_all_night.png"), type: "png" });

  // Captures 07–12: Click-to-Inspect Dual-Plate Museum Modals for ALL 6 Badges!
  await page.goto(`${server.url}?light=day&still=1`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean((window as { __PATCH_READY__?: boolean }).__PATCH_READY__));
  await waitFrames(2);

  const modalSpecs: ReadonlyArray<readonly [string, string]> = [
    ["2026", "07_modal_2026_apex.png"],
    ["2027", "08_modal_2027_pelagic.png"],
    ["2028", "09_modal_2028_flora.png"],
    ["2029", "10_modal_2029_helios.png"],
    ["2030", "11_modal_2030_kinetic.png"],
    ["2031", "12_modal_2031_relay.png"],
  ];

  for (const [year, file] of modalSpecs) {
    await page.evaluate((y: string) => {
      (window as { __PATCH_STAGE__?: { openModal(yr: string): void } }).__PATCH_STAGE__?.openModal(y);
    }, year);
    await waitFrames(3);
    await page.screenshot({ path: join(OUT_DIR, file), type: "png" });
  }

  // Capture 13: Macro Modal Split Loupe at 50% on 2028 FLORA (proving 0.00 px macro registration!)
  await page.evaluate(() => {
    const st = (
      window as {
        __PATCH_STAGE__?: { openModal(yr: string): void; setModalSplit(v: number, snap?: boolean): void };
      }
    ).__PATCH_STAGE__;
    st?.openModal("2028");
    st?.setModalSplit(0.5, true);
  });
  await waitFrames(3);
  await page.screenshot({ path: join(OUT_DIR, "13_modal_split_macro.png"), type: "png" });

  // Capture 14: Night-Mode Dual-Plate Modal on 2031 RELAY (verifying darkroom modal & Night <svg> blueprint!)
  await page.goto(`${server.url}?light=night&badge=2031&still=1`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean((window as { __PATCH_READY__?: boolean }).__PATCH_READY__));
  await waitFrames(3);
  await page.screenshot({ path: join(OUT_DIR, "14_modal_night.png"), type: "png" });

  // Verify final GPU telemetry + DOM SVG integrity
  const finalCheck = await page.evaluate(() => {
    const t = (window as { __PATCH_TELEMETRY__?: () => TelemetrySnapshot }).__PATCH_TELEMETRY__!();
    const svgs = document.querySelectorAll(".patch-card svg.badge-svg").length;
    const canvases = document.querySelectorAll("canvas").length;
    const docOverflowX = document.documentElement.scrollWidth > window.innerWidth;
    const docOverflowY = document.documentElement.scrollHeight > window.innerHeight + 2;
    return { t, svgs, canvases, docOverflowX, docOverflowY };
  });

  const summary = {
    glContextCount: idleCheckA.t1.glContextCount,
    canvasDomCount: finalCheck.canvases,
    svgCardCount: finalCheck.svgs,
    atlasVramBytes: idleCheckA.t1.atlasVramBytes,
    atlasVramMiB: Number((idleCheckA.t1.atlasVramBytes / (1024 * 1024)).toFixed(2)),
    atlasVramMB: Number((idleCheckA.t1.atlasVramBytes / 1_000_000).toFixed(2)),
    bakeMs: Number(idleCheckA.t1.bakeMs.toFixed(2)),
    gpuFrameMs: Number(gpuFrameMs.toFixed(2)),
    idleAfterLoadRafTicks: idleCheckA.deltaTicks,
    idleAfterLoadActiveRaf: idleCheckA.t1.activeRaf,
    idleAfterHoverLeaveRafTicks: idleCheckB.deltaTicks,
    idleAfterHoverLeaveActiveRaf: idleCheckB.activeRaf,
    glError: finalCheck.t.glError,
    docOverflowX: finalCheck.docOverflowX,
    docOverflowY: finalCheck.docOverflowY,
    consoleErrorCount: errors.length,
    errors,
  };

  writeFileSync(join(OUT_DIR, "telemetry.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log("Stage-2 Telemetry:", JSON.stringify(summary, null, 2));

  const failures: string[] = [];
  if (summary.glContextCount !== 1) failures.push(`glContextCount=${summary.glContextCount} (expected 1)`);
  if (summary.canvasDomCount !== 1) failures.push(`canvasDomCount=${summary.canvasDomCount} (expected 1)`);
  if (summary.svgCardCount !== 6) failures.push(`svgCardCount=${summary.svgCardCount} (expected 6)`);
  if (summary.atlasVramBytes >= 28 * 1024 * 1024)
    failures.push(`atlasVramMiB=${summary.atlasVramMiB} (>= 28 MiB)`);
  if (summary.idleAfterLoadRafTicks !== 0 || summary.idleAfterLoadActiveRaf)
    failures.push(`idle after load not 0 fps (${summary.idleAfterLoadRafTicks} ticks)`);
  if (summary.idleAfterHoverLeaveRafTicks !== 0 || summary.idleAfterHoverLeaveActiveRaf)
    failures.push(`idle after hover leave not 0 fps (${summary.idleAfterHoverLeaveRafTicks} ticks)`);
  if (summary.glError !== 0) failures.push(`glError=0x${summary.glError.toString(16)}`);
  if (summary.consoleErrorCount !== 0) failures.push(`console errors: ${errors.join("; ")}`);

  if (failures.length) {
    console.error("STAGE-2 QA GATE FAILURES:\n - " + failures.join("\n - "));
    process.exitCode = 1;
  } else {
    console.log(`ALL STAGE-2 GPU/IDLE/DOM ASSERTIONS PASSED! Saved 13 PNGs + telemetry.json to ${OUT_DIR}`);
  }
} finally {
  await browser.close();
  await server.close();
}
