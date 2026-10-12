import "./tokens.css";
import "./style.css";
import "./garden/switcher.css";
import "./garden/paint.css";
import "./garden/tropical.css";
import "./garden/mediterranean.css";
import "./garden/desert.css";
import "./garden/afroalpine.css";
import "./garden/savanna.css";
import "./garden/fynbos.css";
import "./garden/namib.css";
import "./garden/mangrove.css";
import "./garden/eastasian.css";
import "./garden/anchors.css";
import { animate } from "animejs";
import { arrange } from "./garden/arrange";
import { GARDENS } from "./garden/gardens";
import PLANTS from "./garden/plants.json";
import { chosenGarden, keepGarden, setupSwitcher } from "./garden/switcher";

// The garden is drawn by garden/draw into public/garden/<name>.svg. Each plant this screen
// shows is fetched and inlined so CSS can color it, then grown by one progress value: a short
// intro on load, then the scroll. Limbs extend inside a clip shaped like a rounded shoot, and
// leaves, flowers, and fruit unfold from where they attach. The theme picks the light, and the
// switcher the garden.

const INTRO = 0.5; // how far a garden grows before the visitor scrolls
// A garden that shows a year runs its progress through it: spring to 0.45, summer to 0.65,
// autumn to 0.85, winter to 1. Its intro grows it into early spring, its wood reaching in, so
// the scroll leafs it; it is full by late spring, where reduced motion shows it and entering
// plants settle; touch autoplay stops in full summer.
const BUD = 0.12;
const SPRING = 0.42;
const SUMMER = 0.6;
const FALL = 0.08; // the span a leaf or petal takes to fall
const LOW_TIDE = 0.22; // the share of a water garden's depth shown before scrolling begins
const UNFOLD = 0.08; // the span of progress a leaf, flower, or fruit takes to open
const FPS = 30; // growth is slow, so the garden redraws at most this often
const LAG = 75; // ms for the smoothed scroll to close about two thirds of the gap to the page
const AUTOPLAY = 6000; // ms touch screens take to play the scroll part of the growth
const GROW_IN = 1800; // ms a garden takes to grow in when it comes on show
const ROOM = 8; // how far a growing limb's clip reaches past its edges, in drawing units
const SVG_NS = "http://www.w3.org/2000/svg";

// A limb's spine, from data-sp: points, half widths, unit normals, and distance along it.
type Limb = {
  el: SVGGElement;
  id: string;
  clip: SVGPathElement;
  tip: SVGPathElement;
  x: number[];
  y: number[];
  w: number[];
  nx: number[];
  ny: number[];
  s: number[];
  g0: number;
  g1: number;
  last: number;
  clipped: boolean;
};
// A part opens at g and, if it leaves, falls at d: dropping `drop` drawing units to the foot of
// its plant, drifting `drift` aside and tilting `tilt` degrees as it goes.
type Part = { el: SVGGElement; g: number; d: number; o: string; back: string; turn: number; drop: number; drift: number; tilt: number; last: number; fell: number };
type Water = { body: SVGGElement; maskId: string; grad: SVGLinearGradientElement; edge: SVGPathElement; line: SVGPathElement; masked: boolean; wy: number };
// boost scales a plant's growth: 1 normally, and rising from 0 while its garden grows in.
// enter is how far, in CSS pixels, a plant starts from its place (null if it starts there), and
// shift the offset last applied.
type Plant = {
  bed: HTMLElement;
  garden: string;
  vb: number;
  vbY: number;
  top: number;
  k: number;
  lag: number;
  boost: number;
  limbs: Limb[];
  parts: Part[];
  water: Water | null;
  // A plant that turns in autumn: its turning window on the year, and the step last written.
  turn: number[] | null;
  turned: string;
  enter: number[] | null;
  flip: number;
  shift: string;
};

// The inputs the garden was last drawn at, cleared when what they map to changes (a resize, a new
// plant); and the height of the water at full tide, measured only when the layout changes.
let frame = "";
let tideDrawn = "";
let waterFull = 0;
let pending = false;
let lastDraw = 0;

const root = document.documentElement;
const gardenEl = document.querySelector<HTMLElement>(".garden")!;
const waterEl = document.querySelector<HTMLElement>(".garden .water");
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch = matchMedia("(pointer: coarse)").matches;
// intro runs from 0 to 1 as the garden grows to where it rests; scroll is the page's share.
const growth = { intro: 0, scroll: 0 };
// The address can pin the progress (`?u=0.8`, a late autumn), to show or share one moment.
const pinned = (() => {
  const u = new URLSearchParams(location.search).get("u");
  return u !== null && u !== "" && Number.isFinite(+u) ? clamp(+u) : null;
})();
// A water garden's tide grows in with its plants, so the surface and every plant's waterline
// rise together.
const tideIn = { k: 1 };
const plants: Plant[] = [];
const beds = [...document.querySelectorAll<HTMLElement>(".garden .plant")];
// The garden on show: a first visit opens on the theme's, tropical by day and Mediterranean at
// night. It is marked on the root, where paint.css hides the other gardens' beds.
let garden = chosenGarden(root.dataset.theme === "dark" ? "mediterranean" : "tropical");
root.dataset.garden = garden;
syncWater();
linkGallery();

// Every visit starts at the top, where the garden starts growing.
history.scrollRestoration = "manual";
setupTheme();
setupSwitcher(document.querySelector("[data-garden-switch]")!, document.querySelector("[data-garden-list]")!, () => garden, showGarden);
arrange(beds);
plantGarden().then(() => {
  if (!still) animate(growth, { intro: 1, duration: 2600, ease: "out(3)", onUpdate: () => requestGarden(), onComplete: () => { if (touch) autoplay(); } });
});
addEventListener(
  "resize",
  debounce(() => {
    arrange(beds);
    plants.forEach((plant) => {
      scaleInk(plant);
      readEnter(plant);
    });
    waterFull = waterEl?.offsetHeight ?? 0;
    frame = "";
    renderGarden();
    plantGarden();
  }, 250),
);

if (!still) followScroll();

// Scroll story: one smoothed progress value grows the garden. It eases toward the page's
// scroll and stops ticking once it arrives.
function followScroll() {
  const track = document.querySelector<HTMLElement>(".scroll-track")!;
  let span = 1;
  let target = 0;
  let frame = 0;
  let last = 0;
  const measure = () => {
    span = Math.max(1, track.offsetHeight - innerHeight);
    onScroll();
  };
  const onScroll = () => {
    target = clamp(scrollY / span);
    if (!frame) frame = requestAnimationFrame(step);
  };
  const step = (now: number) => {
    const dt = last ? Math.min(100, Math.max(0, now - last)) : 1000 / 60;
    growth.scroll += (target - growth.scroll) * (1 - Math.exp(-dt / LAG));
    if (Math.abs(target - growth.scroll) < 5e-4) growth.scroll = target;
    const s = growth.scroll;
    requestGarden();
    last = s === target ? 0 : now;
    frame = s === target ? 0 : requestAnimationFrame(step);
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", measure);
  measure();
}

// Touch screens play the rest of the growth on their own by easing the page through the scroll
// track. A touch, wheel, or key hands control back at once.
function autoplay() {
  // A seasonal garden plays on to full summer and leaves autumn and winter to the visitor.
  const share = seasonal() ? (SUMMER - BUD) / (1 - BUD) : 1;
  const span = (document.querySelector<HTMLElement>(".scroll-track")!.offsetHeight - innerHeight) * share;
  if (scrollY > 4 || span <= 0) return;
  const start = performance.now();
  let stopped = false;
  const stops = ["touchstart", "wheel", "keydown", "pointerdown"];
  const stop = () => {
    stopped = true;
    stops.forEach((type) => removeEventListener(type, stop));
  };
  stops.forEach((type) => addEventListener(type, stop, { passive: true }));
  const step = (now: number) => {
    if (stopped) return;
    const k = clamp((now - start) / AUTOPLAY);
    scrollTo(0, span * (0.5 - Math.cos(k * Math.PI) / 2));
    if (k < 1) requestAnimationFrame(step);
    else stops.forEach((type) => removeEventListener(type, stop));
  };
  requestAnimationFrame(step);
}

// Fetches the plants this layout shows and has not planted yet. Plants fetched for a garden that
// is growing in start from nothing.
async function plantGarden(growing = false) {
  await Promise.all(
    beds.map(async (bed, i) => {
      if (bed.dataset.planted || getComputedStyle(bed).display === "none") return;
      bed.dataset.planted = "1";
      // Measured now, while layout is clean, so the new plant is styled once with its ink scale.
      const height = bed.offsetHeight;
      const res = await fetch(`/garden/${bed.dataset.plant}.svg`);
      if (!res.ok) return;
      bed.innerHTML = await res.text();
      // A seasonal garden keeps every plant on the calendar; others stagger their growth a little.
      const year = GARDENS.find((g) => g.key === bed.dataset.garden)?.year;
      const plant = collect(bed, year ? 0 : (i % 5) * 0.03);
      scaleInk(plant, height);
      readEnter(plant);
      plants.push(plant);
      if (growing) growIn(plant);
      frame = "";
      renderGarden();
    }),
  );
}

function collect(bed: HTMLElement, lag: number): Plant {
  const svg = bed.querySelector("svg")!;
  const name = bed.dataset.plant!;
  const limbs = [...bed.querySelectorAll<SVGGElement>(".gl")].map((el, i): Limb => {
    const v = el.dataset.sp!.split(" ").map(Number);
    const x: number[] = [];
    const y: number[] = [];
    const w: number[] = [];
    for (let k = 0; k < v.length; k += 3) x.push(v[k]), y.push(v[k + 1]), w.push(v[k + 2]);
    const n = x.length;
    const nx: number[] = [];
    const ny: number[] = [];
    const s: number[] = [0];
    for (let k = 0; k < n; k++) {
      const a = Math.max(0, k - 1);
      const b = Math.min(n - 1, k + 1);
      const d = Math.hypot(x[b] - x[a], y[b] - y[a]) || 1;
      nx.push(-(y[b] - y[a]) / d);
      ny.push((x[b] - x[a]) / d);
      if (k) s.push(s[k - 1] + Math.hypot(x[k] - x[k - 1], y[k] - y[k - 1]));
    }
    const id = `${name}-grow${i}`;
    const clipPath = document.createElementNS(SVG_NS, "clipPath");
    clipPath.id = id;
    const clip = clipPath.appendChild(document.createElementNS(SVG_NS, "path"));
    const tip = document.createElementNS(SVG_NS, "path");
    tip.setAttribute("class", "ink mid");
    el.before(clipPath);
    el.after(tip);
    return { el, id, clip, tip, x, y, w, nx, ny, s, g0: +el.dataset.g0!, g1: +el.dataset.g1!, last: -1, clipped: false };
  });
  const box = svg.viewBox.baseVal;
  const parts = [...bed.querySelectorAll<SVGGElement>(".gp")].map((el, i): Part => {
    const [x, y] = el.dataset.o!.split(" ");
    const drop = box.y + box.height - +y;
    const side = i % 2 ? 1 : -1;
    const d = el.dataset.d === undefined ? Infinity : +el.dataset.d;
    return { el, g: +el.dataset.g!, d, o: `${x} ${y}`, back: `${-x} ${-y}`, turn: side * 22, drop, drift: side * drop * (0.1 + ((i * 7) % 10) / 50), tilt: side * (50 + ((i * 37) % 70)), last: -1, fell: -1 };
  });
  let water: Water | null = null;
  if (GARDENS.find((g) => g.key === bed.dataset.garden)?.water) {
    const body = document.createElementNS(SVG_NS, "g");
    while (svg.firstChild) body.appendChild(svg.firstChild);
    const defs = document.createElementNS(SVG_NS, "defs");
    const grad = document.createElementNS(SVG_NS, "linearGradient");
    const gradId = `${name}-wgrad`;
    const maskId = `${name}-wmask`;
    grad.id = gradId;
    grad.setAttribute("gradientUnits", "userSpaceOnUse");
    grad.setAttribute("x1", "0");
    grad.setAttribute("x2", "0");
    for (const [off, col] of [
      ["0", "#fff"],
      ["0.1", "#8c8c8c"],
      ["0.75", "#444"],
      ["1", "#0a0a0a"],
    ]) {
      const stop = document.createElementNS(SVG_NS, "stop");
      stop.setAttribute("offset", off);
      stop.setAttribute("stop-color", col);
      grad.appendChild(stop);
    }
    const mask = document.createElementNS(SVG_NS, "mask");
    mask.id = maskId;
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    const pad = 40;
    for (const [k, v] of [
      ["x", box.x - pad],
      ["y", box.y - pad],
      ["width", box.width + pad * 2],
      ["height", box.height + pad * 2],
    ] as const) {
      mask.setAttribute(k, String(v));
    }
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(box.x - pad));
    rect.setAttribute("y", String(box.y - pad));
    rect.setAttribute("width", String(box.width + pad * 2));
    rect.setAttribute("height", String(box.height + pad * 2));
    rect.setAttribute("fill", `url(#${gradId})`);
    mask.appendChild(rect);
    defs.append(grad, mask);
    const cross = document.createElementNS(SVG_NS, "g");
    const edge = document.createElementNS(SVG_NS, "path");
    edge.setAttribute("class", "wash water-edge");
    const line = document.createElementNS(SVG_NS, "path");
    line.setAttribute("class", "ink water-line");
    cross.append(edge, line);
    svg.append(defs, body, cross);
    water = { body, maskId, grad, edge, line, masked: false, wy: NaN };
  }
  const turn = (PLANTS.find((p) => p.name === name) as { turn?: number[] } | undefined)?.turn ?? null;
  return { bed, garden: bed.dataset.garden!, vb: box.height, vbY: box.y, top: 0, k: 0, lag, boost: 1, limbs, parts, water, turn, turned: "", enter: null, flip: 1, shift: "" };
}

// A plant can enter from beyond its place, so the garden starts open and fills as it grows:
// --enter, in its garden's layout, is where it starts, as shares of its own width and height,
// and it eases into place as it grows. Read per layout, since each layout can say otherwise.
function readEnter(plant: Plant) {
  plant.bed.style.removeProperty("transform");
  plant.top = plant.bed.getBoundingClientRect().top;
  const style = getComputedStyle(plant.bed);
  const v = style.getPropertyValue("--enter").trim().split(/\s+/).map(Number);
  plant.enter = v.length === 2 && v.every(Number.isFinite) && (v[0] || v[1]) ? [v[0] * plant.bed.offsetWidth, v[1] * plant.bed.offsetHeight] : null;
  plant.flip = style.getPropertyValue("--flip").trim() === "-1" ? -1 : 1;
  plant.bed.toggleAttribute("data-enters", !!plant.enter);
  plant.shift = "";
}

// Ink keeps one pen width at every plant size. --k is drawing units per CSS pixel.
function scaleInk(plant: Plant, height = plant.bed.offsetHeight) {
  const k = +(plant.vb / height).toFixed(3);
  if (!height || k === plant.k) return;
  plant.k = k;
  plant.bed.style.setProperty("--k", String(k));
  plant.limbs.forEach((limb) => (limb.last = -1));
}

// The garden redraws at most FPS times a second.
function requestGarden() {
  if (pending) return;
  pending = true;
  const tick = (now: number) => {
    if (now - lastDraw < 1000 / FPS - 4) return void requestAnimationFrame(tick);
    pending = false;
    lastDraw = now;
    renderGarden();
  };
  requestAnimationFrame(tick);
}

// Brings another garden on show: it is spaced out, fetched if this is its first showing, and
// grown in from nothing over GROW_IN. The choice is kept in the address and for the next visit.
function showGarden(next: string) {
  if (next === garden) return;
  garden = next;
  root.dataset.garden = garden;
  if (syncWater() && !still) {
    tideIn.k = 0;
    animate(tideIn, { k: 1, duration: GROW_IN, ease: "out(2)", onUpdate: () => requestGarden() });
  }
  keepGarden(garden);
  linkGallery();
  arrange(beds);
  for (const plant of plants) {
    if (plant.garden !== garden) continue;
    scaleInk(plant);
    readEnter(plant);
    growIn(plant);
  }
  plantGarden(true);
}

// Marks the garden's default water depth on the page, measures it, and tells whether it has water.
function syncWater() {
  const w = GARDENS.find((g) => g.key === garden)?.water ?? 0;
  if (w) gardenEl.style.setProperty("--water", String(w));
  else gardenEl.style.removeProperty("--water");
  waterFull = waterEl?.offsetHeight ?? 0;
  return w > 0;
}

function growIn(plant: Plant) {
  if (still) return;
  plant.boost = 0;
  animate(plant, { boost: 1, duration: GROW_IN, ease: "out(2)", onUpdate: () => requestGarden() });
}

// Writes only what has changed: a frame whose inputs have not moved is skipped, and each offset,
// limb, part, and waterline is compared with what it last wrote.
function renderGarden() {
  const all = progress();
  const year = seasonal();
  const rest = year ? BUD : INTRO;
  const tide = waterFull ? tideIn.k * (all <= rest ? (all / rest) * LOW_TIDE : LOW_TIDE + ((all - rest) / (1 - rest)) * (1 - LOW_TIDE)) : 0;
  let key = `${garden} ${all} ${tide}`;
  for (const plant of plants) if (plant.garden === garden) key += ` ${plant.boost}`;
  if (key === frame) return;
  frame = key;
  const tideCss = tide.toFixed(3);
  if (waterFull && tideCss !== tideDrawn) gardenEl.style.setProperty("--tide", (tideDrawn = tideCss));
  for (const plant of plants) {
    if (plant.garden !== garden) continue;
    const p = clamp((all - plant.lag) / (1 - plant.lag)) * plant.boost;
    let shiftY = 0;
    if (plant.enter) {
      // Eased: it leaves its start briskly and settles slowly, by full growth, or in a garden that
      // shows a year by late spring, where it rests. The transform comes after the flip, so a
      // mirrored plant's offset is mirrored back.
      const e = year ? clamp(p / SPRING) : p;
      const k = 1 - e * e * (3 - 2 * e);
      shiftY = plant.enter[1] * k;
      const shift = `translate(${(plant.enter[0] * k * plant.flip).toFixed(1)}px, ${shiftY.toFixed(1)}px)`;
      if (shift !== plant.shift) plant.bed.style.transform = plant.shift = shift;
    }
    if (plant.turn) {
      // Stepped in tenths, so a turning crown restyles only when its color visibly moves.
      const step = String(Math.round(clamp((p - plant.turn[0]) / (plant.turn[1] - plant.turn[0])) * 10) / 10);
      if (step !== plant.turned) plant.bed.style.setProperty("--turn", (plant.turned = step));
    }
    let moved = false;
    for (const limb of plant.limbs) {
      const t = clamp((p - limb.g0) / (limb.g1 - limb.g0));
      if (t === limb.last) continue;
      limb.last = t;
      moved = true;
      limb.el.style.visibility = t ? "" : "hidden";
      // Only a growing limb is clipped.
      const growing = t > 0 && t < 1;
      if (growing) {
        if (!limb.clipped) limb.el.setAttribute("clip-path", `url(#${limb.id})`);
        shoot(limb, t, plant.k);
      } else if (limb.clipped) {
        limb.el.removeAttribute("clip-path");
        limb.tip.removeAttribute("d");
      }
      limb.clipped = growing;
    }
    for (const part of plant.parts) {
      const t = clamp((p - part.g) / UNFOLD);
      const f = clamp((p - part.d) / FALL);
      if (t === part.last && f === part.fell) continue;
      part.last = t;
      part.fell = f;
      part.el.style.visibility = t && f < 1 ? "" : "hidden";
      if (f > 0) {
        // Falling, not arrival run backward: it lets go at once and drops faster as it goes,
        // swaying side to side as a leaf does, and fades over the second half.
        const sway = Math.sin(f * Math.PI * 3);
        const x = part.drift * f + Math.sign(part.drift) * part.drop * 0.06 * sway;
        const y = part.drop * f * (0.35 + 0.65 * f);
        part.el.style.opacity = f < 0.5 ? "" : String((1 - f) * 2);
        part.el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) translate(${part.o}) rotate(${(part.tilt * f + 18 * sway).toFixed(1)}) translate(${part.back})`);
        continue;
      }
      part.el.style.opacity = t < 0.3 ? String(t / 0.3) : "";
      if (t === 1) part.el.removeAttribute("transform");
      else part.el.setAttribute("transform", `translate(${part.o}) rotate(${(1 - t) * part.turn}) scale(${unfold(t)}) translate(${part.back})`);
    }
    if (plant.water && waterFull) {
      const waterY = innerHeight - waterFull * tide;
      const wy = plant.vbY + (waterY - (plant.top + shiftY)) * plant.k;
      if (moved || wy !== plant.water.wy) waterPlant(plant, wy);
    }
  }
}

// Softens the submerged portion of a plant below the garden's waterline wy (in the plant's SVG
// units) and draws a soft meniscus glaze and ripple stroke where each grown root or stem crosses wy.
function waterPlant(plant: Plant, wy: number) {
  const w = plant.water!;
  w.wy = wy;
  const k = plant.k;
  const bot = plant.vbY + plant.vb;
  if (wy >= bot - k) {
    if (w.masked) {
      w.body.removeAttribute("mask");
      w.edge.removeAttribute("d");
      w.line.removeAttribute("d");
      w.masked = false;
    }
    return;
  }
  if (!w.masked) {
    w.body.setAttribute("mask", `url(#${w.maskId})`);
    w.masked = true;
  }
  w.grad.setAttribute("y1", (wy - 1.5 * k).toFixed(1));
  w.grad.setAttribute("y2", Math.max(wy + 16 * k, bot - 2 * k).toFixed(1));

  const spans: [number, number][] = [];
  for (const limb of plant.limbs) {
    if (limb.last <= 0) continue;
    const { x, y, w: rw, s } = limb;
    const at = limb.last * s[s.length - 1];
    for (let i = 0; i < y.length - 1 && s[i] <= at; i++) {
      const y0 = y[i];
      const y1 = y[i + 1];
      if ((y0 - wy) * (y1 - wy) > 0 || y0 === y1) continue;
      const u = (wy - y0) / (y1 - y0);
      if (s[i] + u * (s[i + 1] - s[i]) > at) continue;
      const cx = x[i] + (x[i + 1] - x[i]) * u;
      const hw = (rw[i] + (rw[i + 1] - rw[i]) * u) * Math.min(1.8, Math.hypot(x[i + 1] - x[i], y1 - y0) / Math.abs(y1 - y0));
      spans.push([cx - hw, cx + hw]);
    }
  }
  spans.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const sp of spans) {
    const last = merged[merged.length - 1];
    if (last && sp[0] <= last[1] + 5 * k) last[1] = Math.max(last[1], sp[1]);
    else merged.push(sp);
  }
  let edgeD = "";
  let lineD = "";
  const pt = (px: number, py: number) => `${px.toFixed(1)} ${py.toFixed(1)}`;
  for (const [x0, x1] of merged) {
    const cx = (x0 + x1) / 2;
    const hw = (x1 - x0) / 2;
    const pad = hw + 8 * k;
    const h = 2.6 * k;
    edgeD += `M${pt(cx - pad, wy)}Q${pt(cx, wy - h)} ${pt(cx + pad, wy)}Q${pt(cx, wy + h * 1.5)} ${pt(cx - pad, wy)}Z`;
    lineD += `M${pt(cx - pad - 2 * k, wy)}Q${pt(cx, wy + 1.2 * k)} ${pt(cx + pad + 2 * k, wy)}M${pt(cx - hw - 3.5 * k, wy + 3.2 * k)}Q${pt(cx, wy + 4 * k)} ${pt(cx + hw + 3.5 * k, wy + 3.2 * k)}`;
  }
  w.edge.setAttribute("d", edgeD);
  w.line.setAttribute("d", lineD);
}

// Clips a growing limb to its spine up to the share t of its length, widened by ROOM on both
// sides, and rounds the end into a shoot. The tip's ink arc rides on the end, and the clip
// leaves just enough room past it for that line.
function shoot(limb: Limb, t: number, k: number) {
  const { x, y, w, nx, ny, s } = limb;
  const n = x.length;
  const at = t * s[n - 1];
  let j = 1;
  while (j < n - 1 && s[j] < at) j++;
  const u = (at - s[j - 1]) / (s[j] - s[j - 1] || 1);
  const gx = x[j - 1] + (x[j] - x[j - 1]) * u;
  const gy = y[j - 1] + (y[j] - y[j - 1]) * u;
  const gw = w[j - 1] + (w[j] - w[j - 1]) * u;
  const len = Math.hypot(x[j] - x[j - 1], y[j] - y[j - 1]) || 1;
  const tx = (x[j] - x[j - 1]) / len;
  const ty = (y[j] - y[j - 1]) / len;
  const r = gw + 0.6 * k; // the tip's ink is 1.1px wide
  const pt = (px: number, py: number) => `${px.toFixed(1)} ${py.toFixed(1)}`;
  // Each side runs ROOM past the edge, and starts ROOM behind the base.
  const side = (i: number, e: number, back = 0) =>
    pt(x[i] + nx[i] * e * (w[i] + ROOM) - ny[i] * back, y[i] + ny[i] * e * (w[i] + ROOM) + nx[i] * back);
  let left = side(0, 1, ROOM);
  let right = side(0, -1, ROOM);
  for (let i = 0; i < j; i++) {
    left += `L${side(i, 1)}`;
    right = `${side(i, -1)}L${right}`;
  }
  // Normal at the tip is (-ty, tx), so the arc from that side round the front to the other
  // turns through falling angles: sweep 0.
  const a = (e: number, rr: number) => pt(gx - ty * e * rr, gy + tx * e * rr);
  limb.clip.setAttribute("d", `M${left}L${a(1, gw + ROOM)}L${a(1, r)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${a(-1, r)}L${a(-1, gw + ROOM)}L${right}Z`);
  limb.tip.setAttribute("d", `M${a(1, gw)}A${gw.toFixed(1)} ${gw.toFixed(1)} 0 0 0 ${a(-1, gw)}`);
}

// The garden's progress, in 400 steps: a single-moment garden grows half way in the intro and
// the rest with the scroll; a seasonal one grows into early spring and the scroll carries it
// through the year. Reduced motion shows a garden full: fully grown, or late spring.
function progress() {
  if (pinned !== null) return pinned;
  const year = seasonal();
  if (still) return year ? SPRING : 1;
  const rest = year ? BUD : INTRO;
  return Math.round(Math.min(1, growth.intro * rest + (1 - rest) * growth.scroll) * 400) / 400;
}

function seasonal() {
  return !!GARDENS.find((g) => g.key === garden)?.year;
}

// Opens past full size a little, then settles, like a leaf relaxing as it unfurls.
function unfold(t: number) {
  const k = 1.4;
  return 1 + (k + 1) * (t - 1) ** 3 + k * (t - 1) ** 2;
}

function clamp(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function debounce(fn: () => void, ms: number) {
  let id = 0;
  return () => {
    clearTimeout(id);
    id = setTimeout(fn, ms);
  };
}

function setupTheme() {
  const toggles = document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]");
  const bars = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  const getTheme = () => (root.dataset.theme === "dark" ? "dark" : "light");
  const sync = () => {
    const label = getTheme() === "dark" ? "Switch to light theme" : "Switch to dark theme";
    toggles.forEach((t) => {
      t.setAttribute("aria-label", label);
      t.setAttribute("title", label);
    });
    // The browser bar follows the theme on show, not only the system's, in the paper token.
    const paper = getComputedStyle(root).getPropertyValue("--bg").trim();
    bars.forEach((bar) => (bar.content = paper));
  };
  toggles.forEach((t) =>
    t.addEventListener("click", () => {
      const next = getTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {}
      sync();
    }),
  );
  sync();
}

// The gallery link opens the token gallery on the garden on show, its fan in that garden's tone.
function linkGallery() {
  const link = document.querySelector<HTMLAnchorElement>("[data-gallery-link]")!;
  link.href = `/gallery/?garden=${garden}`;
  link.style.setProperty("--tone", `var(${GARDENS.find((g) => g.key === garden)!.tone})`);
}
