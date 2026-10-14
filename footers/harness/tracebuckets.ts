// Busy time per second for the renderer's main thread, the compositor, raster workers and the GPU process.
//
//   node footers/harness/tracebuckets.ts <trace.json>

import { fixed } from "../lib/number.ts";
import { readTrace } from "./trace.ts";

const KEYS = { CrRendererMain: "main", Compositor: "compositor", CrGpuMain: "gpu", VizCompositorThread: "viz" } as const;
type Key = (typeof KEYS)[keyof typeof KEYS] | "raster";

const { complete, threadName, processName } = readTrace(process.argv[2]);
const t0 = Math.min(...complete.map((e) => e.ts));
const buckets = new Map<number, Record<Key, number>>();
const paints = new Map<number, number>();
const bucket = (sec: number) => {
  if (!buckets.has(sec)) buckets.set(sec, { main: 0, compositor: 0, gpu: 0, viz: 0, raster: 0 });
  return buckets.get(sec)!;
};

for (const e of complete) {
  const thr = threadName(e) ?? "";
  const sec = Math.trunc((e.ts - t0) / 1e6);
  if (e.name === "RunTask" || e.name === "ThreadControllerImpl::RunTask") {
    const key = KEYS[thr as keyof typeof KEYS];
    if (key && ["Renderer", "GPU Process"].includes(processName(e) ?? "")) bucket(sec)[key] += e.dur / 1000;
  }
  if (e.name === "RasterTask") bucket(sec).raster += e.dur / 1000;
  if (e.name === "Paint" && thr === "CrRendererMain") paints.set(sec, (paints.get(sec) ?? 0) + 1);
}

const ms = (v: number, width: number) => fixed(v, 0).padStart(width);
console.log("sec   main  comp  raster   gpu   viz   paints   (ms of work per second)");
for (const sec of [...buckets.keys()].sort((a, b) => a - b)) {
  const b = buckets.get(sec)!;
  console.log(`${String(sec).padStart(3)} ${ms(b.main, 6)} ${ms(b.compositor, 5)} ${ms(b.raster, 7)} ${ms(b.gpu, 5)} ${ms(b.viz, 5)} ${String(paints.get(sec) ?? 0).padStart(7)}`);
}
