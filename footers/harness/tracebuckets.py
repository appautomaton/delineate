"""Per-second busy time for the renderer main thread, the compositor, raster workers and the GPU process."""
import json
import sys
from collections import defaultdict

data = json.load(open(sys.argv[1]))
events = data["traceEvents"] if isinstance(data, dict) else data
names, procs = {}, {}
for e in events:
    if e.get("ph") == "M" and e.get("name") == "thread_name":
        names[(e["pid"], e["tid"])] = e["args"]["name"]
    if e.get("ph") == "M" and e.get("name") == "process_name":
        procs[e["pid"]] = e["args"]["name"]
t0 = min(e["ts"] for e in events if e.get("ph") == "X")
buckets = defaultdict(lambda: defaultdict(float))
frames = defaultdict(int)
for e in events:
    if e.get("ph") != "X" or "dur" not in e:
        continue
    thread = names.get((e["pid"], e["tid"]), "")
    proc = procs.get(e["pid"], "")
    sec = int((e["ts"] - t0) / 1e6)
    if e["name"] == "RunTask" or e["name"] == "ThreadControllerImpl::RunTask":
        key = {"CrRendererMain": "main", "Compositor": "compositor", "CrGpuMain": "gpu", "VizCompositorThread": "viz"}.get(thread)
        if key and (proc in ("Renderer", "GPU Process")):
            buckets[sec][key] += e["dur"] / 1000
    if e["name"] == "RasterTask":
        buckets[sec]["raster"] += e["dur"] / 1000
    if e["name"] == "Paint" and thread == "CrRendererMain":
        frames[sec] += 1
print("sec   main  comp  raster   gpu   viz   paints   (ms of work per second)")
for sec in sorted(buckets):
    b = buckets[sec]
    print(f"{sec:3d} {b['main']:6.0f} {b['compositor']:5.0f} {b['raster']:7.0f} {b['gpu']:5.0f} {b['viz']:5.0f} {frames[sec]:7d}")
