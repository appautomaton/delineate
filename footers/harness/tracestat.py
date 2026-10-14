"""Summarise a Chrome trace: where time goes per thread, and how often the page paints and rasters."""
import json
import sys
from collections import defaultdict

data = json.load(open(sys.argv[1]))
events = data["traceEvents"] if isinstance(data, dict) else data
names = {}
for e in events:
    if e.get("ph") == "M" and e.get("name") == "thread_name":
        names[(e["pid"], e["tid"])] = e["args"]["name"]
    if e.get("ph") == "M" and e.get("name") == "process_name":
        names[(e["pid"], None)] = e["args"]["name"]
ts = [e["ts"] for e in events if "ts" in e and e.get("ph") in ("X", "B", "E", "I", "i")]
span = (max(ts) - min(ts)) / 1e6
by = defaultdict(lambda: [0, 0.0])
for e in events:
    if e.get("ph") != "X" or "dur" not in e:
        continue
    thread = names.get((e["pid"], e["tid"]), str(e["tid"]))
    proc = names.get((e["pid"], None), str(e["pid"]))
    key = (proc, thread, e["name"])
    by[key][0] += 1
    by[key][1] += e["dur"] / 1000
print(f"span {span:.2f}s")
interesting = ("Paint", "PrePaint", "Layerize", "UpdateLayerTree", "RasterTask", "RecalcStyle", "Animation", "Commit",
               "DrawFrame", "GPUTask", "Display::DrawAndSwap", "SkiaOutputSurfaceImplOnGpu::SwapBuffers", "ThreadControllerImpl::RunTask",
               "PaintArtifactCompositor::Update", "UpdateLifecycle", "ProxyMain::BeginMainFrame", "LayerTreeHostImpl::PrepareToDraw",
               "TileManager::FlushAndIssueSignals", "SkiaOutputSurfaceImplOnGpu::FinishPaintCurrentFrame", "DirectRenderer::DrawFrame")
rows = sorted(by.items(), key=lambda kv: -kv[1][1])
for (proc, thread, name), (n, ms) in rows[:45]:
    print(f"{ms / span:8.1f} ms/s  {n / span:7.1f}/s  {proc[:18]:18s} {thread[:28]:28s} {name}")
