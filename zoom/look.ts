// Captures real Chrome 1800x1200 keyframes across all 18 off-center octaves (O00..O17):
//   - Day plates (`day-o00..o17.png`) at t = k
//   - Night plates (`night-o00..o17.png`) at t = k
//   - Mid-glide off-center C2 pan plates (`day-mid-o00..o17.png`) at t = k + 0.52
//   - Seam-handoff pairs across key junctions including wrap-around (17 -> 0)
//   - Living animated SVG delta proofs (animTime 0.0s vs 1.2s at fixed T)
//   - Extreme pointer-parallax seal + ALL 54 integer boundary continuity audits (0.98x-1.02x)
//   - Off-center portal geometry telemetry, minimalist HUD plates, and Chrome Skia Paint profiling!
//
//   node zoom/look.ts

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import { launch } from "../portraits/harness/browser.ts";
import { serve } from "../tools/serve.ts";
import { DIST, build } from "./build.ts";
import { OCTAVES_PER_SCENE, UNMOUNT_PARENT_FRAC } from "./scenes/types.ts";

const OUT_DIR =
  process.env.ZOOM_OUT_DIR ?? "/Users/ac/dev/agents/design/d3lin3at3/.references/organiccity-study/stage5";
const PORT = 5422; // strictly isolated from live dev server on 5420
const WIDTH = 1800;
const HEIGHT = 1200;

type Theme = "day" | "night";

type FrameMetrics = {
  meanLuma: number;
  foveaGrad: number;
  outerGrad: number;
  foveaOuterRatio: number;
};

type PortalInfo = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  dx: number;
  dy: number;
  offCenterOk: boolean;
};

type ZoomApi = {
  setT(v: number): void;
  setAnimTime(sec: number): void;
  setTheme(th: Theme): void;
  setPointer(nx: number, ny: number, immediate?: boolean): void;
  scenes(): { index: number; id: string; title: string; elements: number; strokes: number; animGroups: number }[];
  measureFrames(frames?: number, step?: number): Promise<{
    frames: number;
    avgUpdateMs: number;
    p95UpdateMs: number;
    avgRafDeltaMs: number;
    p95RafDeltaMs: number;
    mountedNodes: number;
    totalSceneElements: number;
    totalAnimGroups: number;
  }>;
};

const pad2 = (n: number): string => String(n).padStart(2, "0");

function analyzePng(buf: Buffer): FrameMetrics {
  const png = PNG.sync.read(buf);
  const { width, height, data } = png;
  const luma = new Float32Array(width * height);
  let sumL = 0;
  for (let i = 0, p = 0; i < luma.length; i++, p += 4) {
    const y = 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
    luma[i] = y;
    sumL += y;
  }

  let foveaSum = 0;
  let foveaN = 0;
  let outerSum = 0;
  let outerN = 0;
  const cx = width * 0.5;
  const cy = height * 0.5;

  for (let y = 2; y < height - 2; y += 2) {
    const ry = Math.abs(y - cy) / cy;
    for (let x = 2; x < width - 2; x += 2) {
      const rx = Math.abs(x - cx) / cx;
      const boxR = Math.max(rx, ry);
      const idx = y * width + x;
      const gx = Math.abs(luma[idx + 1] - luma[idx - 1]);
      const gy = Math.abs(luma[idx + width] - luma[idx - width]);
      const g = Math.hypot(gx, gy) * 0.5;
      if (boxR < 0.18) {
        foveaSum += g;
        foveaN++;
      } else if (boxR > 0.65) {
        outerSum += g;
        outerN++;
      }
    }
  }

  const foveaGrad = foveaSum / Math.max(1, foveaN);
  const outerGrad = outerSum / Math.max(1, outerN);
  return {
    meanLuma: Number((sumL / luma.length).toFixed(1)),
    foveaGrad: Number(foveaGrad.toFixed(2)),
    outerGrad: Number(outerGrad.toFixed(2)),
    foveaOuterRatio: Number((foveaGrad / Math.max(0.01, outerGrad)).toFixed(2)),
  };
}

function diffRmse(bufA: Buffer, bufB: Buffer): { rmseRGB: number; changedPct: number; maxDiff: number } {
  const a = PNG.sync.read(bufA);
  const b = PNG.sync.read(bufB);
  let sumSq = 0;
  let maxDiff = 0;
  let changed = 0;
  const pxCount = a.width * a.height;
  for (let p = 0; p < a.data.length; p += 4) {
    const dr = Math.abs(a.data[p] - b.data[p]);
    const dg = Math.abs(a.data[p + 1] - b.data[p + 1]);
    const db = Math.abs(a.data[p + 2] - b.data[p + 2]);
    sumSq += dr * dr + dg * dg + db * db;
    const m = Math.max(dr, dg, db);
    if (m > maxDiff) maxDiff = m;
    if (m > 4) changed++;
  }
  return {
    rmseRGB: Number(Math.sqrt(sumSq / (pxCount * 3)).toFixed(2)),
    changedPct: Number(((changed / pxCount) * 100).toFixed(2)),
    maxDiff,
  };
}

mkdirSync(OUT_DIR, { recursive: true });
build();

const server = await serve(DIST, { port: PORT });
const browser = await launch();

const errors: string[] = [];

try {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`console.error: ${msg.text()}`);
      console.error(`BROWSER console.error: ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    errors.push(`pageerror: ${err.message}`);
    console.error(`BROWSER pageerror: ${err.message}`);
  });

  await page.goto(`${server.url}?still=1&hud=0&theme=day&t=0`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean((window as unknown as { __zoom?: unknown }).__zoom));

  const waitFrame = () =>
    page.evaluate(
      () => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))),
    );

  const capture = async (
    opts: { t: number; theme?: Theme; animTime?: number; ptr?: [number, number] },
    filename?: string,
  ): Promise<Buffer> => {
    await page.evaluate((o) => {
      const api = (window as unknown as { __zoom: ZoomApi }).__zoom;
      if (o.theme) api.setTheme(o.theme);
      if (o.ptr) api.setPointer(o.ptr[0], o.ptr[1], true);
      if (o.animTime !== undefined) api.setAnimTime(o.animTime);
      api.setT(o.t);
    }, opts);
    await waitFrame();
    const buf = await page.screenshot({ type: "png" });
    if (filename) writeFileSync(join(OUT_DIR, filename), buf);
    return buf;
  };

  const sceneInfo = await page.evaluate(() =>
    (window as unknown as { __zoom: ZoomApi }).__zoom.scenes(),
  );
  const N = sceneInfo.length;

  // Read data-portal telemetry from each octave group as it mounts
  const portals: PortalInfo[] = [];

  // 1. Capture all N (18) octaves in Day, Night, AND Mid-Glide (t = k + 0.52)!
  const octaves: Record<
    Theme,
    Array<{
      t: number;
      file: string;
      id: string;
      title: string;
      portal?: PortalInfo;
      elements: number;
      strokes: number;
      animGroups: number;
      metrics: FrameMetrics;
    }>
  > = { day: [], night: [] };

  const midGlide: Array<{
    t: number;
    file: string;
    id: string;
    title: string;
    metrics: FrameMetrics;
  }> = [];

  for (const theme of ["day", "night"] as const) {
    console.log(`\n=== Capturing ${theme.toUpperCase()} Octaves O00..O${pad2(N - 1)} ===`);
    for (let k = 0; k < N; k++) {
      const file = `${theme}-o${pad2(k)}.png`;
      const buf = await capture({ t: k, theme, animTime: 0, ptr: [0, 0] }, file);
      const metrics = analyzePng(buf);
      const info = sceneInfo[k];

      let portalInfo: PortalInfo | undefined;
      if (theme === "day") {
        const rawPortal = await page.evaluate((idx) => {
          const el = document.querySelector(`[data-octave="${idx}"]`);
          return el?.getAttribute("data-portal") ?? "1200,800,320,220";
        }, k);
        const [cx, cy, rx, ry] = rawPortal.split(",").map(Number);
        const dx = cx - 1200;
        const dy = cy - 800;
        portalInfo = {
          cx,
          cy,
          rx,
          ry,
          dx,
          dy,
          offCenterOk: Math.abs(dx) >= 220 || Math.abs(dy) >= 140,
        };
        portals.push(portalInfo);
      } else {
        portalInfo = portals[k];
      }

      octaves[theme].push({
        t: k,
        file,
        id: info.id,
        title: info.title,
        portal: portalInfo,
        elements: info.elements,
        strokes: info.strokes,
        animGroups: info.animGroups,
        metrics,
      });
      const pTag = portalInfo ? `p=(${portalInfo.cx},${portalInfo.cy})` : "";
      console.log(
        `${theme.toUpperCase().padEnd(5)} O${pad2(k)} ${info.id.padEnd(18)} ${pTag.padEnd(13)} | elem=${String(info.elements).padStart(3)} strokes=${String(info.strokes).padStart(4)} anim=${String(info.animGroups).padStart(2)} | L=${String(metrics.meanLuma).padStart(5)}`,
      );
    }
  }

  console.log(`\n=== Capturing DAY Mid-Glide Off-Center Pan Frames (t = k + 0.52) ===`);
  for (let k = 0; k < N; k++) {
    const tMid = k + 0.52;
    const file = `day-mid-o${pad2(k)}.png`;
    const buf = await capture({ t: tMid, theme: "day", animTime: 0, ptr: [0, 0] }, file);
    const metrics = analyzePng(buf);
    const info = sceneInfo[k];
    midGlide.push({ t: Number(tMid.toFixed(2)), file, id: info.id, title: info.title, metrics });
    console.log(`MID   O${pad2(k)} (t=${tMid.toFixed(2)}) ${info.id.padEnd(18)} | L=${String(metrics.meanLuma).padStart(5)}`);
  }

  // 2. Capture Seam-Handoff pairs across key junctions including wrap-around (N-1 -> 0)
  for (const theme of ["day", "night"] as const) {
    for (const [tPre, tPost] of [
      [1.96, 2.04],
      [8.96, 9.04],
      [13.96, 14.04],
      [N - 0.04, 0.04],
    ] as const) {
      await capture({ t: tPre, theme, animTime: 0, ptr: [0, 0] }, `${theme}-handoff-${tPre.toFixed(2)}.png`);
      await capture({ t: tPost, theme, animTime: 0, ptr: [0, 0] }, `${theme}-handoff-${tPost.toFixed(2)}.png`);
    }
  }

  // 3. Living SVG Animation Delta Proofs across representative worlds (animTime 0.0s vs 1.2s at fixed T!)
  console.log("\n=== Animated SVG Delta Proofs (animTime 0.0s vs 1.2s) ===");
  const animDeltas: Array<{ label: string; rmseRGB: number; changedPct: number; maxDiff: number }> = [];
  for (const [tVal, theme] of [
    [0, "day"],
    [2, "day"],
    [6, "day"],
    [9, "night"],
    [11, "night"],
    [13, "night"],
    [14, "night"],
    [16, "day"],
  ] as const) {
    if (tVal >= N) continue;
    const tag = `o${pad2(tVal)}-${sceneInfo[tVal].id}`;
    const a = await capture({ t: tVal, theme, animTime: 0.0, ptr: [0, 0] }, `anim-${tag}-t0.png`);
    const b = await capture({ t: tVal, theme, animTime: 1.2, ptr: [0, 0] }, `anim-${tag}-t1.2.png`);
    const d = diffRmse(a, b);
    animDeltas.push({ label: tag, ...d });
    console.log(`Anim ${tag.padEnd(24)} | rmseRGB=${d.rmseRGB.toFixed(2)} | changed=${d.changedPct}% | maxDiff=${d.maxDiff}`);
  }

  // 4. Extreme Pointer Parallax Visual Proof + Full 54 Boundary Continuity Audits (18 Day + 18 Night + 18 Corner Parallax)!
  console.log(`\n=== Pointer Parallax & Zero-Seam Boundary Continuity (${N * 3} Audits) ===`);
  const pCenter = await capture({ t: 11.25, theme: "day", animTime: 0, ptr: [0, 0] }, "parallax-center.png");
  const pCorner = await capture({ t: 11.25, theme: "day", animTime: 0, ptr: [0.95, -0.85] }, "parallax-corner.png");
  const parallaxDelta = diffRmse(pCenter, pCorner);
  console.log(`Parallax center vs corner (0.95,-0.85) | rmseRGB=${parallaxDelta.rmseRGB} | changed=${parallaxDelta.changedPct}%`);

  const boundaryAudits: Array<{
    theme: Theme;
    parallax: boolean;
    label: string;
    rmseRGB: number;
    preControlRmse: number;
    postControlRmse: number;
    localControlRmse: number;
    ratioToLocalControl: number;
  }> = [];

  // Nyquist-safe 0.005 dyadic-octave step (`+/-h`, `+/-3h`, h = 0.0025 / log2(6) ≈ 0.000967 scenes -> ~4.1px screen-edge step)
  // clearing the 3px book-spine & skyscraper-mullion spatial period cleanly without aliasing beats!
  const probeH = 0.0025 / OCTAVES_PER_SCENE;

  for (const [theme, ptr, parallax] of [
    ["day", [0, 0] as [number, number], false],
    ["night", [0, 0] as [number, number], false],
    ["day", [0.95, -0.85] as [number, number], true],
  ] as const) {
    for (let k = 0; k < N; k++) {
      const nextIdx = (k + 1) % N;
      const tPreCtrl = k + 1 - 3 * probeH;
      const tA = k + 1 - probeH;
      const tB = nextIdx + probeH;
      const tPostCtrl = nextIdx + 3 * probeH;
      const label = `O${pad2(k)}->O${pad2(nextIdx)}`;
      const pre = await capture({ t: tPreCtrl, theme, animTime: 0, ptr });
      const a = await capture({ t: tA, theme, animTime: 0, ptr });
      const b = await capture({ t: tB, theme, animTime: 0, ptr });
      const post = await capture({ t: tPostCtrl, theme, animTime: 0, ptr });
      const preCtrl = diffRmse(pre, a);
      const cross = diffRmse(a, b);
      const postCtrl = diffRmse(b, post);
      const localCtrlRmse = Number(((preCtrl.rmseRGB + postCtrl.rmseRGB) * 0.5).toFixed(2));
      const ratio = Number((cross.rmseRGB / Math.max(0.01, localCtrlRmse)).toFixed(2));
      boundaryAudits.push({
        theme,
        parallax,
        label,
        rmseRGB: cross.rmseRGB,
        preControlRmse: preCtrl.rmseRGB,
        postControlRmse: postCtrl.rmseRGB,
        localControlRmse: localCtrlRmse,
        ratioToLocalControl: ratio,
      });
      const flag = ratio < 0.98 || ratio > 1.02 ? "  <-- OUT OF BAND!" : "";
      console.log(
        `Boundary [${theme}${parallax ? "+ptr" : ""}] ${label} | rmse=${cross.rmseRGB.toFixed(2)} vs ctrl=${localCtrlRmse.toFixed(2)} (${preCtrl.rmseRGB.toFixed(2)}/${postCtrl.rmseRGB.toFixed(2)}) | ratio=${ratio}x${flag}`,
      );
    }
  }

  const ratios = boundaryAudits.map((b) => b.ratioToLocalControl);
  const boundarySummary = {
    total: boundaryAudits.length,
    minRatio: Math.min(...ratios),
    maxRatio: Math.max(...ratios),
    outOfRange: boundaryAudits.filter((b) => b.ratioToLocalControl < 0.98 || b.ratioToLocalControl > 1.02),
  };

  // 4b. Slot -1 S=12 Unmount Continuity Audits across all N scenes (Day + Extreme Corner Parallax!)
  // Proves 0.000px visual pop when parent Slot -1 unmounts at frac = UNMOUNT_PARENT_FRAC = log(2)/log(6).
  console.log(`\n=== Slot -1 (S=12) Unmount Continuity Audits (frac=${UNMOUNT_PARENT_FRAC.toFixed(6)}, ${N * 2} Audits) ===`);
  const unmountAudits: Array<{
    parallax: boolean;
    label: string;
    rmseRGB: number;
    preControlRmse: number;
    postControlRmse: number;
    localControlRmse: number;
    ratioToLocalControl: number;
  }> = [];

  for (const [ptr, parallax] of [
    [[0, 0] as [number, number], false],
    [[0.95, -0.85] as [number, number], true],
  ] as const) {
    for (let k = 0; k < N; k++) {
      const parentIdx = (k - 1 + N) % N;
      const tPreCtrl = k + UNMOUNT_PARENT_FRAC - 3 * probeH;
      const tA = k + UNMOUNT_PARENT_FRAC - probeH;
      const tB = k + UNMOUNT_PARENT_FRAC + probeH;
      const tPostCtrl = k + UNMOUNT_PARENT_FRAC + 3 * probeH;
      const label = `O${pad2(k)}(drop O${pad2(parentIdx)})`;
      const pre = await capture({ t: tPreCtrl, theme: "day", animTime: 0, ptr });
      const a = await capture({ t: tA, theme: "day", animTime: 0, ptr });
      const b = await capture({ t: tB, theme: "day", animTime: 0, ptr });
      const post = await capture({ t: tPostCtrl, theme: "day", animTime: 0, ptr });
      const preCtrl = diffRmse(pre, a);
      const cross = diffRmse(a, b);
      const postCtrl = diffRmse(b, post);
      const localCtrlRmse = Number(((preCtrl.rmseRGB + postCtrl.rmseRGB) * 0.5).toFixed(2));
      const ratio = Number((cross.rmseRGB / Math.max(0.01, localCtrlRmse)).toFixed(2));
      unmountAudits.push({
        parallax,
        label,
        rmseRGB: cross.rmseRGB,
        preControlRmse: preCtrl.rmseRGB,
        postControlRmse: postCtrl.rmseRGB,
        localControlRmse: localCtrlRmse,
        ratioToLocalControl: ratio,
      });
      const flag = ratio < 0.98 || ratio > 1.02 ? "  <-- OUT OF BAND!" : "";
      console.log(
        `Unmount  [day${parallax ? "+ptr" : ""}] ${label} | rmse=${cross.rmseRGB.toFixed(2)} vs ctrl=${localCtrlRmse.toFixed(2)} (${preCtrl.rmseRGB.toFixed(2)}/${postCtrl.rmseRGB.toFixed(2)}) | ratio=${ratio}x${flag}`,
      );
    }
  }

  const unmountRatios = unmountAudits.map((u) => u.ratioToLocalControl);
  const unmountSummary = {
    unmountFrac: Number(UNMOUNT_PARENT_FRAC.toFixed(6)),
    total: unmountAudits.length,
    minRatio: Math.min(...unmountRatios),
    maxRatio: Math.max(...unmountRatios),
    outOfRange: unmountAudits.filter((u) => u.ratioToLocalControl < 0.98 || u.ratioToLocalControl > 1.02),
  };

  // 5. Real Chrome SVG Paint & Frame Cost Profiling (CDP Tracing + 90-frame live zoom + anim benchmark)
  await capture({ t: 10.2, theme: "day", animTime: 0, ptr: [0, 0] });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Tracing.start", {
    categories: "devtools.timeline,blink.user_timing",
    transferMode: "ReturnAsStream",
  });

  const perf = await page.evaluate(() =>
    (window as unknown as { __zoom: ZoomApi }).__zoom.measureFrames(90, 0.011),
  );

  const traceDone = new Promise<string>((resolve) => {
    cdp.once("Tracing.tracingComplete", (ev: { stream?: string }) => resolve(ev.stream ?? ""));
  });
  await cdp.send("Tracing.end");
  const streamHandle = await traceDone;
  let traceJson = "";
  if (streamHandle) {
    while (true) {
      const chunk = (await cdp.send("IO.read", { handle: streamHandle })) as { data: string; eof: boolean };
      traceJson += chunk.data;
      if (chunk.eof) break;
    }
    await cdp.send("IO.close", { handle: streamHandle });
  }

  let chromePaintAvgMs = 0;
  let chromeMainAvgMs = 0;
  if (traceJson) {
    const parsed = JSON.parse(traceJson) as { traceEvents?: Array<{ name: string; ph: string; dur?: number }> };
    const events = parsed.traceEvents ?? [];
    let paintSumUs = 0;
    let mainSumUs = 0;
    let paintN = 0;
    let mainN = 0;
    for (const ev of events) {
      if (ev.ph !== "X" || !ev.dur) continue;
      if (ev.name === "Paint" || ev.name === "PrePaint") {
        paintSumUs += ev.dur;
        paintN++;
      } else if (ev.name === "BeginMainThreadFrame" || ev.name === "FunctionCall") {
        mainSumUs += ev.dur;
        mainN++;
      }
    }
    chromePaintAvgMs = paintN ? Number((paintSumUs / 1000 / Math.max(1, perf.frames)).toFixed(3)) : 0;
    chromeMainAvgMs = mainN ? Number((mainSumUs / 1000 / Math.max(1, perf.frames)).toFixed(3)) : 0;
  }

  // 6. Capture Minimalist HUD Screenshots (Day at 01/18 & Night at 18/18!)
  await page.goto(`${server.url}?still=1&theme=day&t=0`, { waitUntil: "load" });
  await waitFrame();
  writeFileSync(join(OUT_DIR, "hud-day.png"), await page.screenshot({ type: "png" }));
  await page.evaluate((lastT) => {
    const api = (window as unknown as { __zoom: ZoomApi }).__zoom;
    api.setTheme("night");
    api.setT(lastT);
  }, N - 0.55);
  await waitFrame();
  writeFileSync(join(OUT_DIR, "hud-night.png"), await page.screenshot({ type: "png" }));

  const portalSummary = {
    total: portals.length,
    offCenterCount: portals.filter((p) => p.offCenterOk).length,
    portals: portals.map((p, idx) => ({ index: idx, id: sceneInfo[idx].id, ...p })),
  };

  const summary = {
    octaveCount: N,
    viewport: `${WIDTH}x${HEIGHT}`,
    consoleErrors: errors,
    perf: {
      ...perf,
      chromePaintPerFrameMs: chromePaintAvgMs,
      chromeMainPerFrameMs: chromeMainAvgMs,
    },
    portalSummary,
    boundarySummary,
    unmountSummary,
    animDeltas,
    parallaxDelta,
    boundaryAudits,
    unmountAudits,
    octaves,
    midGlide,
  };

  writeFileSync(join(OUT_DIR, "metrics.json"), JSON.stringify(summary, null, 2));
  console.log("\n=== Chrome Performance, Portal, Boundary & Unmount Summary ===");
  console.log(
    JSON.stringify(
      {
        perf: summary.perf,
        offCenterPortals: `${portalSummary.offCenterCount}/${portalSummary.total}`,
        boundarySummary,
        unmountSummary,
      },
      null,
      2,
    ),
  );
  console.log(`Console errors: ${errors.length}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(e);
    process.exitCode = 1;
  }

  await context.close();
} finally {
  await browser.close();
  await server.close();
}
