// A collage card: one picture, drawn by several hands, laid down again and again among scraps of paper, a shot
// at a time, inside a frame that never moves. Shots cut hard, on a beat; within a shot only small things move:
// a label is slapped on, tabs pop out along an edge, sheets drop onto a pile, the hands' sheets settle into a
// stack. Pieces are placed in card units, a thousand across, so the card scales as one sheet.
//
//   import { mountCard } from "./card.js";
//   mountCard(element, "panther-hunter");

import { MOTIFS } from "./motifs.js";

const pct = (v) => `${v / 10}%`;

function el(tag, cls, ...kids) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.append(...kids);
  return e;
}

// A piece's box: given its middle and one side, the other side follows from its aspect.
function box({ x, y, w, h, cx, cy, rot = 0, z = 0 }, aspect) {
  if (w === undefined && h !== undefined && aspect) w = h * aspect;
  if (h === undefined && w !== undefined && aspect) h = w / aspect;
  if (cx !== undefined) x = cx - w / 2;
  if (cy !== undefined) y = cy - h / 2;
  return { x, y, w, h, rot, z };
}
function place(e, b) {
  Object.assign(e.style, { left: pct(b.x), top: pct(b.y), zIndex: b.z, transform: `rotate(${b.rot}deg)` });
  if (b.w !== undefined) e.style.width = pct(b.w);
  if (b.h !== undefined) e.style.height = pct(b.h);
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
  // A hand's drawing, whole or cropped, as a sheet cut to its box.
  function art(hand, crop, at, { paper = false } = {}) {
    const [cx, cy, cw, ch] = crop ?? [0, 0, FW, FH];
    const img = el("img");
    Object.assign(img, { src: `${src}/${hand}.svg`, alt: "", decoding: "async", draggable: false });
    Object.assign(img.style, { width: `${(FW / cw) * 100}%`, height: `${(FH / ch) * 100}%`, left: `${(-cx / cw) * 100}%`, top: `${(-cy / ch) * 100}%` });
    const b = box(at, cw / ch);
    return Object.assign(place(el("div", `art${paper ? " paper" : ""}`, img), b), { box: b });
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
    const caption = el("div", "caption", el("span", "", m.title), el("span", "", `${m.number} · ${m.year}`));
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
      s.append(enter(slab, "settle", 80 + n * 110));
    });
    return s;
  }
  // One crop, its left half in one hand and its right half in another, meeting at the middle.
  function halves(left, right, [x, y, w, h], at) {
    const b = box(at, w / h), half = w / 2;
    return [
      art(left, [x, y, half, h], { x: b.x, y: b.y, w: b.w / 2, h: b.h }),
      art(right, [x + half, y, half, h], { x: b.x + b.w / 2, y: b.y, w: b.w / 2, h: b.h }),
    ];
  }
  return { art, tabs, record, label, sheet, stamp, stack, halves };
}

// The shots, in order: each is held for its beat, then cut.
export const SHOTS = [
  { hold: 800, pieces: (p) => [p.art("engraving", null, { cx: 500, cy: 505, h: 780, rot: -1.2 }, { paper: true })] },
  {
    hold: 700,
    pieces: (p, m) => {
      const panel = p.art("screen", m.crops.upper, { cx: 500, cy: 505, h: 640 });
      return [panel, ...p.tabs(panel.box, "left", 3), ...p.tabs(panel.box, "right", 3, 160)];
    },
  },
  {
    hold: 1200,
    pieces: (p, m) => [
      p.art("engraving", m.crops.jaw, { x: 400, y: 150, w: 420 }, { paper: true }),
      p.record({ x: 170, y: 500, w: 370, z: 2 }),
      p.label("Bronze, 1846", "light", { x: 140, y: 420, rot: -1.5, z: 4 }, 140),
      p.label("Public domain", "dark", { x: 280, y: 474, rot: 1, z: 5 }, 330),
    ],
  },
  { hold: 600, pieces: (p) => [p.art("marble", null, { cx: 500, cy: 510, h: 740 })] },
  { hold: 700, pieces: (p, m) => [p.stamp("screen", m.crops.chest, { cx: 500, cy: 505, w: 440, rot: 6 })] },
  {
    hold: 800,
    pieces: (p, m) => {
      const navy = p.sheet("#22377F", { x: 380, y: 190, w: 400, h: 560, z: 1 });
      return [
        enter(p.sheet("#CFC5EA", { x: 300, y: 160, w: 400, h: 560 }), "drop", 0),
        enter(navy, "drop", 60),
        ...p.tabs({ x: 380, y: 190, w: 400, h: 560 }, "right", 3, 240),
        enter(p.sheet("#FFFFFF", { x: 220, y: 220, w: 440, h: 640, z: 2 }, p.art("contour", null, { cx: 500, cy: 500, h: 950 })), "drop", 140),
      ];
    },
  },
  { hold: 1100, pieces: (p) => [p.stack(["screen", "marble", "engraving", "contour"], { cx: 500, cy: 500, span: [660, 640] })] },
  {
    hold: 1200,
    pieces: (p, m) => [
      // One picture, cut down the middle: one hand on the left, another on the right.
      ...p.halves("engraving", "screen", m.crops.meeting, { cx: 500, cy: 480, h: 600 }),
      p.label("One picture,", "light", { x: 250, y: 700, rot: -1, z: 4 }, 140),
      p.label("many hands.", "dark", { x: 420, y: 760, rot: 0.5, z: 5 }, 330),
    ],
  },
  {
    hold: 700,
    pieces: (p, m) => [
      p.art("screen", m.crops.upper, { x: 450, y: 190, h: 560 }),
      p.art("marble", null, { cx: 400, cy: 515, h: 700, z: 2 }),
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

export function mountCard(root, id, { shots = SHOTS, art = "art", motto = "One picture, many hands." } = {}) {
  const m = MOTIFS[id], p = kit(m, `${art}/${id}`, random(id.length * 7919));
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  root.classList.add("card");
  root.setAttribute("role", "img");
  root.setAttribute("aria-label", `${m.title}, drawn by four hands among scraps of paper`);
  const layers = shots.map((s) => {
    const shot = el("div", "shot", ...s.pieces(p, m));
    shot.hidden = true;
    return shot;
  });
  root.append(frame(), el("div", "title", m.title), el("div", "motto", motto), ...layers);

  let at = -1, timer = 0, due = 0, left = 0, playing = false, seen = false, held = false;
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
    wait(shots[at].hold);
  }
  function wait(ms) {
    due = performance.now() + ms;
    timer = setTimeout(next, ms);
  }
  // The card plays while it is on screen and not held, and holds still for anyone who asks for less motion.
  function update() {
    const play = seen && !held && !document.hidden && !calm.matches;
    if (play && !playing) wait(left || shots[at].hold);
    if (!play && playing) {
      clearTimeout(timer);
      left = Math.max(0, due - performance.now());
    }
    playing = play;
  }

  // Start once every hand is ready to show, so no shot cuts to a blank.
  const images = [...new Set([...root.querySelectorAll("img")].map((i) => i.src))].map((s) => Object.assign(new Image(), { src: s }));
  Promise.all(images.map((i) => i.decode().catch(() => {}))).then(() => {
    show(0);
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; update(); }).observe(root);
    root.addEventListener("pointerenter", () => { held = true; update(); });
    root.addEventListener("pointerleave", () => { held = false; update(); });
    document.addEventListener("visibilitychange", update);
    calm.addEventListener("change", update);
  });
}
