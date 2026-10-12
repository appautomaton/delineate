/// <reference types="vite/client" />
// The bench page. Everything it shows is in its address, so a view can be handed to someone:
//
//   ?piece=<piece>                 which piece
//   &panes=anime.png,latest        what to show, left to right: a reference by file name, a version
//                                  (v003.svg), `latest`, or `previous` (default: every reference, then latest)
//   &at=<x>,<y>,<zoom>             the picture point at the panes' center, and screen pixels per picture pixel
//   &grid=1                        a coordinate grid in the picture's own pixels
//   &tone=<px>                     every pane blurred by so many picture pixels, so marks vanish and
//                                  only tone is left to compare (T toggles it at 6)
//
// The panes move together: scroll to zoom about the pointer, drag to pan, G toggles the grid,
// 0 fits the whole picture. A new build redraws `latest` and `previous` where they are shown.
// `bench.measure` (see the end) compares tone from the console.

import { measure } from "./measure.ts";

type Build = { piece: string; version?: string; ok: boolean; seconds: number; log: string };
type Piece = { references: string[]; versions: string[]; build: Build | null };

const q = new URLSearchParams(location.search);
const piece = q.get("piece") ?? "";
const view = { x: 627, y: 627, zoom: 0, grid: q.get("grid") === "1", tone: Number(q.get("tone") ?? 0) };
const at = q.get("at")?.split(",").map(Number);
if (at?.length === 3) [view.x, view.y, view.zoom] = at;

const bar = document.getElementById("bar")!;
const log = document.getElementById("log")!;
const main = document.getElementById("panes")!;
let state: Piece = { references: [], versions: [], build: null };
let frame = { width: 1254, height: 1254 };

const source = (key: string): string | undefined => {
  const v = state.versions;
  if (key === "latest") return v.length ? `/files/versions/${piece}/${v[v.length - 1]}` : undefined;
  if (key === "previous") return v.length > 1 ? `/files/versions/${piece}/${v[v.length - 2]}` : undefined;
  if (v.includes(key)) return `/files/versions/${piece}/${key}`;
  if (state.references.includes(key)) return `/files/references/${piece}/${key}`;
  return undefined;
};
const named = (key: string) => (key === "latest" ? state.versions.at(-1) ?? "latest" : key === "previous" ? state.versions.at(-2) ?? "previous" : key);

async function load() {
  state = await (await fetch(`/api/piece?name=${encodeURIComponent(piece)}`)).json();
}

function keys(): string[] {
  return q.get("panes")?.split(",") ?? [...state.references, "latest"];
}

function header() {
  const b = state.build;
  const status = b ? (b.ok ? `<span class="ok">built ${b.version} in ${b.seconds.toFixed(1)}s</span>` : `<span class="fail" id="fail">build failed (click)</span>`) : "";
  bar.innerHTML = `<b>${piece || "no piece"}</b><span>${state.versions.length} versions</span>${status}<span id="where"></span><span class="hint">scroll zoom · drag pan · G grid · T tone · 0 fit · B build</span>`;
  log.textContent = b && !b.ok ? b.log : "";
  document.getElementById("fail")?.addEventListener("click", () => (log.style.display = log.style.display === "block" ? "none" : "block"));
}

function panes() {
  main.innerHTML = "";
  for (const key of keys()) {
    const pane = document.createElement("div");
    pane.className = "pane";
    const src = source(key);
    if (src) {
      const img = new Image();
      img.src = `${src}?t=${Date.now()}`;
      img.onload = () => {
        frame = { width: img.naturalWidth || frame.width, height: img.naturalHeight || frame.height };
        if (!view.zoom) fit();
        place();
      };
      pane.append(img);
    }
    const label = document.createElement("div");
    label.className = "label";
    label.textContent = src ? named(key) : `${key} (none)`;
    pane.append(label, Object.assign(document.createElementNS("http://www.w3.org/2000/svg", "svg"), { classList: "grid" }));
    main.append(pane);
  }
  place();
}

function fit() {
  const pane = main.firstElementChild as HTMLElement | null;
  if (!pane) return;
  view.zoom = Math.min(pane.clientWidth / frame.width, pane.clientHeight / frame.height);
  [view.x, view.y] = [frame.width / 2, frame.height / 2];
}

// Every pane shows the same picture point at its center, at the same zoom.
function place() {
  for (const pane of main.children as HTMLCollectionOf<HTMLElement>) {
    const [w, h] = [pane.clientWidth, pane.clientHeight];
    const [ox, oy] = [w / 2 - view.x * view.zoom, h / 2 - view.y * view.zoom];
    const img = pane.querySelector("img");
    if (img) {
      img.style.transform = `translate(${ox}px, ${oy}px) scale(${view.zoom})`;
      img.style.filter = view.tone ? `blur(${view.tone}px)` : "";
    }
    const grid = pane.querySelector("svg.grid")!;
    grid.innerHTML = view.grid ? gridMarks(w, h, ox, oy) : "";
  }
  const z = view.zoom;
  document.getElementById("where")!.textContent = `center ${Math.round(view.x)},${Math.round(view.y)} · ${z >= 1 ? z.toFixed(1) : z.toFixed(2)}×`;
  q.set("at", `${Math.round(view.x)},${Math.round(view.y)},${+z.toFixed(3)}`);
  if (view.grid) q.set("grid", "1");
  else q.delete("grid");
  if (view.tone) q.set("tone", String(view.tone));
  else q.delete("tone");
  history.replaceState(null, "", `?${q}`);
}

// Lines at the finest step of 5, 10, 25, 50, 100, or 250 picture pixels that stays 14 screen pixels
// apart, labeled every fourth.
function gridMarks(w: number, h: number, ox: number, oy: number): string {
  const step = [5, 10, 25, 50, 100, 250].find((s) => s * view.zoom >= 14) ?? 250;
  let out = "";
  const line = (major: boolean) => `stroke="${major ? "#e03060" : "#e0306070"}" stroke-width="${major ? 1 : 0.5}"`;
  for (let v = Math.ceil(-ox / view.zoom / step) * step; v * view.zoom + ox < w; v += step) {
    const X = v * view.zoom + ox;
    const major = v % (step * 4) === 0;
    out += `<line x1="${X}" y1="0" x2="${X}" y2="${h}" ${line(major)}/>`;
    if (major) out += `<text x="${X + 2}" y="11" font-size="10" fill="#e03060">${v}</text>`;
  }
  for (let v = Math.ceil(-oy / view.zoom / step) * step; v * view.zoom + oy < h; v += step) {
    const Y = v * view.zoom + oy;
    const major = v % (step * 4) === 0;
    out += `<line x1="0" y1="${Y}" x2="${w}" y2="${Y}" ${line(major)}/>`;
    if (major) out += `<text x="2" y="${Y - 2}" font-size="10" fill="#e03060">${v}</text>`;
  }
  return out;
}

main.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const pane = (e.target as HTMLElement).closest(".pane") as HTMLElement | null;
    if (!pane) return;
    const r = pane.getBoundingClientRect();
    const [px, py] = [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2];
    const before = [view.x + px / view.zoom, view.y + py / view.zoom];
    view.zoom = Math.min(40, Math.max(0.1, view.zoom * Math.exp(-e.deltaY * 0.0015)));
    [view.x, view.y] = [before[0] - px / view.zoom, before[1] - py / view.zoom];
    place();
  },
  { passive: false },
);
main.addEventListener("pointerdown", (e) => {
  const pane = (e.target as HTMLElement).closest(".pane") as HTMLElement | null;
  if (!pane) return;
  pane.classList.add("dragging");
  pane.setPointerCapture(e.pointerId);
  const move = (m: PointerEvent) => {
    view.x -= m.movementX / view.zoom;
    view.y -= m.movementY / view.zoom;
    place();
  };
  pane.addEventListener("pointermove", move);
  pane.addEventListener("pointerup", () => (pane.classList.remove("dragging"), pane.removeEventListener("pointermove", move)), { once: true });
});
addEventListener("keydown", (e) => {
  if (e.key === "g" || e.key === "G") (view.grid = !view.grid), place();
  if (e.key === "0") fit(), place();
  if (e.key === "t" || e.key === "T") (view.tone = view.tone ? 0 : 6), place();
  if (e.key === "b" || e.key === "B") fetch(`/api/build?name=${encodeURIComponent(piece)}`);
});
addEventListener("resize", place);

import.meta.hot?.on("bench:built", async (b: Build) => {
  if (b.piece !== piece) return;
  await load();
  header();
  panes();
});

await load();
header();
panes();

// For the console and for agents: tone against a reference, by pane names.
//   await bench.measure("wav-subject.png", ["previous", "latest"])
Object.assign(globalThis, {
  bench: {
    measure: (reference: string, keys: string[]) =>
      measure(source(reference)!, keys.map((k) => source(k)!), { size: Math.max(frame.width, frame.height) }),
  },
});
