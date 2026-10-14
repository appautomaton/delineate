// Summarises a Chrome trace: where time goes per thread, and how often the page paints and rasters.
//
//   node footers/harness/tracestat.ts <trace.json>

import { fixed } from "../lib/number.ts";
import { readTrace } from "./trace.ts";

const { events, complete, threadName, processName } = readTrace(process.argv[2]);
const ts = events.filter((e) => e.ts !== undefined && ["X", "B", "E", "I", "i"].includes(e.ph)).map((e) => e.ts);
const span = (Math.max(...ts) - Math.min(...ts)) / 1e6;

// Count and milliseconds by process, thread and event.
const by = new Map<string, { proc: string; thread: string; name: string; n: number; ms: number }>();
for (const e of complete) {
  const [proc, thr] = [processName(e) ?? String(e.pid), threadName(e) ?? String(e.tid)];
  const key = JSON.stringify([proc, thr, e.name]);
  if (!by.has(key)) by.set(key, { proc, thread: thr, name: e.name, n: 0, ms: 0 });
  const row = by.get(key)!;
  row.n += 1;
  row.ms += e.dur / 1000;
}

console.log(`span ${fixed(span, 2)}s`);
for (const { proc, thread: thr, name, n, ms } of [...by.values()].sort((a, b) => b.ms - a.ms).slice(0, 45)) {
  console.log(`${fixed(ms / span, 1).padStart(8)} ms/s  ${fixed(n / span, 1).padStart(7)}/s  ${proc.slice(0, 18).padEnd(18)} ${thr.slice(0, 28).padEnd(28)} ${name}`);
}
