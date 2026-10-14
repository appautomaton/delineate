// A Chrome performance trace, as Chrome DevTools records it: its events, and the names of its processes and threads.

import { readFileSync } from "node:fs";

export type TraceEvent = { name: string; ph: string; pid: number; tid: number; ts: number; dur?: number; args?: { name?: string } };

export function readTrace(path: string) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  const events: TraceEvent[] = Array.isArray(data) ? data : data.traceEvents;
  const threads = new Map<string, string>();
  const processes = new Map<number, string>();
  for (const e of events) {
    if (e.ph !== "M" || !e.args?.name) continue;
    if (e.name === "thread_name") threads.set(`${e.pid}/${e.tid}`, e.args.name);
    if (e.name === "process_name") processes.set(e.pid, e.args.name);
  }
  return {
    events,
    // A complete event: one with a duration, in microseconds.
    complete: events.filter((e): e is TraceEvent & { dur: number } => e.ph === "X" && e.dur !== undefined),
    threadName: (e: TraceEvent) => threads.get(`${e.pid}/${e.tid}`),
    processName: (e: TraceEvent) => processes.get(e.pid),
  };
}
