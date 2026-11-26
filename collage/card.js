// A collage card: one picture, drawn by several hands, laid down again and again among scraps of paper, a shot
// at a time, inside a frame that never moves. Shots cut hard, on a beat; within a shot only small things move:
// a label is slapped on, tabs pop out along an edge, sheets drop onto a pile, the hands' sheets settle into a
// stack. Held under the pointer, the card stops and its pieces part, so the layers show. Pieces are placed in
// card units, a thousand across, so the card scales as one sheet.
//
//   import { mountCard } from "./card.js";
//   const card = mountCard(element, "panther-hunter", { ground: "oxblood", start: 3, tempo: 1.1 });
//   card.destroy();

import { GROUNDS, HANDS, MOTIFS } from "./motifs.js";

// The card, in its own units; a piece is placed in these units, as a share of what it lies on (the card, or a sheet).
const CARD = { x: 0, y: 0, w: 1000, h: 1000 };
const pct = (v, of) => `${(100 * v) / of}%`;

function el(tag, cls, ...kids) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.append(...kids);
  return e;
}

// A piece's box: given one side, the other follows from its aspect; given a span to fit, it is the largest box of its
// aspect that fits it, so a wide picture and a tall one both fill their place. Its corner may be given, or its middle.
function box({ x, y, w, h, cx, cy, fit, rot = 0, z = 0 }, aspect) {
  if (fit) [w, h] = fit[0] / fit[1] > aspect ? [fit[1] * aspect, fit[1]] : [fit[0], fit[0] / aspect];
  if (w === undefined && h !== undefined && aspect) w = h * aspect;
  if (h === undefined && w !== undefined && aspect) h = w / aspect;
  if (cx !== undefined) x = cx - w / 2;
  if (cy !== undefined) y = cy - h / 2;
  return { x, y, w, h, rot, z };
}
function place(e, b, on = CARD) {
  Object.assign(e.style, { left: pct(b.x - on.x, on.w), top: pct(b.y - on.y, on.h), zIndex: b.z, transform: `rotate(${b.rot}deg)` });
  if (b.w !== undefined) e.style.width = pct(b.w, on.w);
  if (b.h !== undefined) e.style.height = pct(b.h, on.h);
  return e;
}
const enter = (e, how, delay = 0) => (Object.assign(e.dataset, { enter: how, delay }), e);

// A seeded random, so a card's scraps are the same each time it is drawn.
function random(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The pieces, each made for one motif.
function kit(m, src, rand) {
  const [FW, FH] = m.frame;
  // A hand's drawing, whole or cropped, as a sheet cut to its box; `on` is the box of the sheet it lies on, if any.
  function art(hand, crop, at, { paper = false, on } = {}) {
    const [cx, cy, cw, ch] = crop ?? [0, 0, FW, FH];
    const img = el("img");
    Object.assign(img, { src: `${src}/${HANDS[hand].file}`, alt: "", decoding: "async", draggable: false });
    Object.assign(img.style, { width: `${(FW / cw) * 100}%`, height: `${(FH / ch) * 100}%`, left: `${(-cx / cw) * 100}%`, top: `${(-cy / ch) * 100}%` });
    const b = box(at, cw / ch);
    return Object.assign(place(el("div", `art ${hand}${paper ? " paper" : ""}`, img), b, on), { box: b });
  }
  // Tabs of bars, popping out one by one along a side of a box.
  const TINTS = ["#4FB3B4", "#B8C64B", "#5E8FD8", "#E39B76", "#B9A8E6"];
  function tabs(b, side, n, start = 120) {
    return Array.from({ length: n }, (_, k) => {
      const tint = TINTS[Math.floor(rand() * TINTS.length)];
      const stops = [];
      for (let u = 0, on = true; u < 100; on = !on) {
        const w = 4 + rand() * 9;
        stops.push(`${on ? tint : "transparent"} ${u.toFixed(1)}% ${Math.min(100, u + w).toFixed(1)}%`);
        u += w;
      }
      const tab = el("div", "tab");
      tab.style.background = `linear-gradient(90deg, ${stops.join(", ")}), color-mix(in srgb, ${tint} 30%, #fff)`;
      const w = 40 + rand() * 30, h = 20 + rand() * 6, along = b.y + b.h * (0.12 + 0.76 * ((k + rand() * 0.6) / n));
      const x = side === "left" ? b.x - w * (0.55 + rand() * 0.3) : b.x + b.w - w * (0.15 + rand() * 0.3);
      return enter(place(tab, { x, y: along, w, h, z: 3 }), "pop", start + k * 70 + rand() * 40);
    });
  }
  // The holder's record, typed on a card.
  function record(at) {
    const rows = m.record.map(([k, v]) => el("div", "row", el("span", "", k), el("span", "", v)));
    return place(el("div", "record paper", ...rows), box(at));
  }
  // A strip of embossed tape.
  const label = (text, tone, at, delay) => enter(place(el("div", `label ${tone}`, text), box(at)), "slap", delay);
  // A blank sheet, perhaps with something on it.
  const sheet = (color, at, ...kids) => {
    const s = place(el("div", "sheet paper", ...kids), box(at));
    s.style.background = color;
    return s;
  };
  // A perforated stamp with a hand's drawing on its face.
  function stamp(hand, crop, at) {
    const face = art(hand, crop, { x: 0, y: 0, w: 1000 });
    Object.assign(face.style, { position: "relative", left: 0, top: 0, width: "100%", height: "auto", aspectRatio: `${crop[2]} / ${crop[3]}` });
    const caption = el("div", "caption", el("span", "", m.title), el("span", "", m.mark));
    // Placed by its face's aspect; its height is its face's and the margins'.
    return place(el("div", "stamp-shadow", el("div", "stamp", face, caption)), { ...box(at, crop[2] / crop[3]), h: undefined });
  }
  // The hands' sheets in a stack, seen from above and to one side, settling one after another.
  // The stack is placed by what is seen of it: the sheets, tilted and lifted, are projected onto the card, and
  // the whole they make is scaled to fit the span and centred on the point, not the first sheet alone.
  const TILT = "rotateX(58deg) rotateZ(-40deg)";
  function stack(hands, { cx, cy, span: [sw, sh] }) {
    const w = 100, h = (w * FH) / FW, gap = 30;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    hands.forEach((_, k) => {
      const m = new DOMMatrix(TILT).translate(0, 0, k * gap);
      for (const [x, y] of [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]) {
        const q = m.transformPoint(new DOMPoint(x, y));
        [x0, x1, y0, y1] = [Math.min(x0, q.x), Math.max(x1, q.x), Math.min(y0, q.y), Math.max(y1, q.y)];
      }
    });
    const k = Math.min(sw / (x1 - x0), sh / (y1 - y0));
    const s = place(el("div", "stack"), box({ cx: cx - k * (x0 + x1) / 2, cy: cy - k * (y0 + y1) / 2, w: k * w, h: k * h }));
    s.style.transform = TILT;
    hands.forEach((hand, n) => {
      const slab = el("div", "slab", art(hand, null, { x: 0, y: 0, w: 1000 }));
      slab.firstChild.style.cssText += "left:0;top:0;width:100%;height:100%;transform:none;";
      slab.style.transform = `translateZ(${(n * gap * k) / 10}cqi)`;
      slab.style.setProperty("--n", n);
      s.append(enter(slab, "settle", 80 + n * 110));
    });
    return s;
  }
  // The whole drawing, its left half in one hand and its right half in another, meeting at the middle.
  function halves(left, right, at) {
    const b = box(at, FW / FH), half = FW / 2;
    return [
      art(left, [0, 0, half, FH], { x: b.x, y: b.y, w: b.w / 2, h: b.h }),
      art(right, [half, 0, half, FH], { x: b.x + b.w / 2, y: b.y, w: b.w / 2, h: b.h }),
    ];
  }
  return { art, tabs, record, label, sheet, stamp, stack, halves };
}

// The shots, in order: each is held for its beat, then cut.
export const SHOTS = [
  { hold: 800, pieces: (p) => [p.art("engraving", null, { cx: 500, cy: 505, fit: [800, 780], rot: -1.2 }, { paper: true })] },
  {
    hold: 700,
    pieces: (p) => {
      const panel = p.art("screen", null, { cx: 500, cy: 505, fit: [640, 780] });
      return [panel, ...p.tabs(panel.box, "left", 3), ...p.tabs(panel.box, "right", 3, 160)];
    },
  },
  {
    hold: 1200,
    pieces: (p, m) => [
      p.art("engraving", m.crops.detail, { x: 400, y: 150, w: 420 }, { paper: true }),
      p.record({ x: 170, y: 500, w: 370, z: 2 }),
      p.label(m.labels[0], "light", { x: 140, y: 420, rot: -1.5, z: 4 }, 140),
      p.label(m.labels[1], "dark", { x: 280, y: 474, rot: 1, z: 5 }, 330),
    ],
  },
  // The object itself, cut out and laid on the card.
  { hold: 700, pieces: (p) => [p.art("cast", null, { cx: 500, cy: 510, fit: [800, 760] })] },
  { hold: 700, pieces: (p, m) => [p.stamp("screen", m.crops.stamp, { cx: 500, cy: 505, fit: [540, 552], rot: 6 })] },
  {
    hold: 800,
    pieces: (p, m) => {
      // The drawing on its page, as large as the card allows; the coloured sheets dropped first show only at its edges.
      const drawing = box({ cx: 480, cy: 505, fit: [640, 750] }, m.frame[0] / m.frame[1]);
      const page = { x: drawing.x - 48, y: drawing.y - 20, w: drawing.w + 96, h: drawing.h + 40, z: 2 };
      const dark = { x: page.x + 90, y: page.y + 60, w: page.w - 40, h: page.h - 90, z: 1, rot: 1.5 };
      return [
        enter(p.sheet("#CFC5EA", { x: page.x + 10, y: page.y - 30, w: page.w - 40, h: page.h * 0.7, rot: -3 }), "drop", 0),
        enter(p.sheet("var(--ground)", dark), "drop", 60),
        ...p.tabs(dark, "right", 3, 240),
        enter(p.sheet("#FFFFFF", page, p.art("contour", null, drawing, { on: page })), "drop", 140),
      ];
    },
  },
  { hold: 1100, pieces: (p) => [p.stack(["screen", "marble", "engraving", "contour"], { cx: 500, cy: 500, span: [660, 640] })] },
  {
    hold: 1200,
    pieces: (p) => [
      // One picture, cut down the middle: one hand on the left, another on the right.
      ...p.halves("engraving", "screen", { cx: 500, cy: 445, fit: [640, 700] }),
      p.label("One picture,", "light", { x: 250, y: 772, rot: -1, z: 4 }, 140),
      p.label("many hands.", "dark", { x: 420, y: 830, rot: 0.5, z: 5 }, 330),
    ],
  },
  {
    hold: 700,
    pieces: (p) => [
      p.art("screen", null, { x: 470, y: 150, fit: [460, 640] }),
      p.art("marble", null, { cx: 400, cy: 515, fit: [560, 700], z: 2 }),
    ],
  },
];

// How each piece comes in, from its place as set; held at the first frame until its delay is up.
const ENTER = {
  slap: (t) => [{ transform: `${t} scale(1.35) rotate(-6deg)`, opacity: 0, filter: "blur(2px)" }, { transform: t, opacity: 1, filter: "blur(0)" }],
  pop: () => [{ opacity: 0 }, { opacity: 0, offset: 0.98 }, { opacity: 1 }],
  drop: (t) => [{ transform: `translateY(-4%) ${t}`, opacity: 0 }, { transform: t, opacity: 1 }],
  settle: (t) => [{ transform: `${t} translateZ(14cqi)`, opacity: 0 }, { transform: t, opacity: 1 }],
};
const TIMING = { slap: [150, "cubic-bezier(.2, 1.4, .4, 1)"], pop: [40, "linear"], drop: [190, "cubic-bezier(.2, .8, .3, 1)"], settle: [260, "cubic-bezier(.2, .8, .3, 1)"] };

function frame() {
  // A rule round the card with its corners cut in, a finer rule inside it, and a register mark in each corner.
  const rule = (i, r) => `M${i + r} ${i}H${1000 - i - r}A${r} ${r} 0 0 0 ${1000 - i} ${i + r}V${1000 - i - r}A${r} ${r} 0 0 0 ${1000 - i - r} ${1000 - i}H${i + r}A${r} ${r} 0 0 0 ${i} ${1000 - i - r}V${i + r}A${r} ${r} 0 0 0 ${i + r} ${i}Z`;
  const mark = ([x, y]) => `<circle cx="${x}" cy="${y}" r="8"/><path d="M${x - 15} ${y}h30M${x} ${y - 15}v30"/>`;
  const svg = `<svg class="frame" viewBox="0 0 1000 1000" aria-hidden="true"><g fill="none" stroke="currentColor"><path d="${rule(36, 46)}" stroke-width="1.4"/><path d="${rule(46, 46)}" stroke-width=".7"/>${[[36, 36], [964, 36], [964, 964], [36, 964]].map(mark).join("")}</g></svg>`;
  return document.createRange().createContextualFragment(svg);
}

// Where each piece of a shot goes when the card is held: away from the card's middle, the higher layers farther, so
// the pile opens; a piece alone in the middle lifts instead.
function part(shot) {
  for (const e of shot.children) {
    const [x, y, w, h] = ["left", "top", "width", "height"].map((k) => parseFloat(e.style[k]) || 0);
    const [dx, dy] = [x + w / 2 - 50, y + h / 2 - 50], d = Math.hypot(dx, dy), reach = 1.6 + 0.7 * (Number(e.style.zIndex) || 0);
    e.style.setProperty("--part", d < 8 ? "0 -1.4cqi" : `${((dx / d) * reach).toFixed(2)}cqi ${((dy / d) * reach).toFixed(2)}cqi`);
  }
}

// The card is printed in one of the GROUNDS: the line screen's sheets, the dark tape and the dark paper all take it.
// It opens on shot `start`, holds each shot `tempo` times its beat, and waits `delay` ms more before its first cut,
// so cards side by side keep their own time; `seed` deals its scraps.
export function mountCard(root, id, { shots = SHOTS, art = "art", ground = "navy", start = 0, tempo = 1, delay = 0, seed = id.length * 7919, motto = "One picture, many hands." } = {}) {
  const m = MOTIFS[id], p = kit(m, `${art}/${id}`, random(seed));
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  root.classList.add("card");
  root.style.setProperty("--ground", GROUNDS[ground]);
  root.setAttribute("role", "img");
  root.setAttribute("aria-label", `${m.title}, drawn by four hands among scraps of paper`);
  const layers = shots.map((s) => {
    const shot = el("div", "shot", ...s.pieces(p, m));
    shot.hidden = true;
    return shot;
  });
  root.append(frame(), el("div", "title", m.title), el("div", "motto", motto), ...layers);
  layers.forEach(part);

  let at = -1, timer = 0, due = 0, left = 0, playing = false, seen = false, held = false;
  const hold = (k) => shots[k].hold * tempo;
  function show(k) {
    if (at >= 0) layers[at].hidden = true;
    at = k;
    layers[at].hidden = false;
    if (calm.matches) return;
    for (const e of layers[at].querySelectorAll("[data-enter]")) {
      const how = e.dataset.enter, [duration, easing] = TIMING[how];
      e.animate(ENTER[how](e.style.transform || "none"), { duration, easing, delay: Number(e.dataset.delay), fill: "backwards" });
    }
  }
  function next() {
    show((at + 1) % layers.length);
    wait(hold(at));
  }
  function wait(ms) {
    due = performance.now() + ms;
    timer = setTimeout(next, ms);
  }
  // The card plays while it is on screen and not held, and holds still for anyone who asks for less motion.
  function update() {
    const play = seen && !held && !document.hidden && !calm.matches;
    if (play && !playing) wait(left || hold(at));
    if (!play && playing) {
      clearTimeout(timer);
      left = Math.max(0, due - performance.now());
    }
    playing = play;
  }

  // Start once every hand is ready to show, so no shot cuts to a blank.
  const off = new AbortController(), signal = off.signal;
  const sight = new IntersectionObserver(([e]) => { seen = e.isIntersecting; update(); });
  const images = [...new Set([...root.querySelectorAll("img")].map((i) => i.src))].map((s) => Object.assign(new Image(), { src: s }));
  Promise.all(images.map((i) => i.decode().catch(() => {}))).then(() => {
    if (signal.aborted) return;
    show(start % layers.length);
    left = hold(at) + delay;
    sight.observe(root);
    const holdStill = (on) => { held = on; root.classList.toggle("parted", on); update(); };
    root.addEventListener("pointerenter", () => holdStill(true), { signal });
    root.addEventListener("pointerleave", () => holdStill(false), { signal });
    document.addEventListener("visibilitychange", update, { signal });
    calm.addEventListener("change", update, { signal });
  });
  return {
    destroy() {
      off.abort();
      sight.disconnect();
      clearTimeout(timer);
      root.replaceChildren();
      root.classList.remove("card", "parted");
    },
  };
}
