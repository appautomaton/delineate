// The foot of the Characters page: landscapes written in type, after the references kept locally. A scene is a
// grid of cells, each a pixel of a dithered picture: its color one of three tones of its material, laid as a soft
// tile, and on it a letter of the name or one of the face's trees, a tone beyond the tile. At this size the letters
// are grain and the tiles carry the color. Four scenes take turns, a gorge, a valley, dunes, and a cove (scenes.js
// draws them): each holds for a while, then dissolves into the next, cell by cell in the order of an ordered
// dither leaning upward, so the change is made of the same stuff as the pictures and the new scene settles from
// the foot as the old lifts away. As the foot comes into view the planes rise into place a row at a time, the
// nearest the furthest; over the still scene, its air moves at twelve frames a second.
//
//   import { mountFoot } from "./foot.js";
//   mountFoot(canvas, { clear: [...words] });
//
// Each scene is composed on a 16 x 9 sheet, laid over the canvas as a slice is, its foot on the canvas's foot and
// its middle in the middle, so a narrow screen keeps the middle of the scene and loses its edges. The sky is left
// to the page's words: nothing in it, not even a star, falls on the elements given as clear.

import { SCENES } from "./scenes.js";

const FPS = 12;
const REST = 20000; // ms without input before the foot holds still, as the field does
const HOLD = 11000; // ms a scene holds, long enough to look at
const TURN = 1600; // ms a scene takes to dissolve into the next, eased at both ends
const RISING = 0.35; // how far the dissolve leans upward: the new scene settles from the foot, the old lifts off the top
const BUDGET = 7; // ms of work a frame may spend on drawing or on composing; the rest waits for the next
const TILE = 0.64; // how strongly a cell's own color is laid under its letter
const ORB = 0.4; // the sun's and the moon's radius, in units of the sheet
const RAMP = ["d", "a", "3", "n", "t", "l", "i", ":", "·"]; // dark to light, by how much ink each letter lays
const TREES = ["\u{F0531}", "\u{F0405}"]; // a broadleaf and a pine, from the Nerd Fonts' Material Design icons
const STAR = "\u{F0AE2}"; // a four-pointed star
const W = 16, H = 9;
const NONE = 0xffff; // a cell whose drawing is not known, so it is drawn whatever it should show

// Ordered dither thresholds, (v + 0.5) / n²: four by four for a cell's tone, eight by eight for the order in which
// cells change, sixty-four steps fine.
const bayer = (x, y, n) => (n === 1 ? 0 : 4 * bayer(x % (n / 2), y % (n / 2), n / 2) + [[0, 2], [3, 1]][(y / (n / 2)) | 0][(x / (n / 2)) | 0]);
const BAYER4 = Float32Array.from({ length: 16 }, (_, k) => (bayer(k & 3, k >> 2, 4) + 0.5) / 16);
const BAYER8 = Float32Array.from({ length: 64 }, (_, k) => (bayer(k & 7, k >> 3, 8) + 0.5) / 64);
const PAPER = { day: "#F8F7F2", night: "#1B2036" };

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => t * t * (3 - 2 * t);
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
const mix = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
};

// Every look a cell can take, numbered once: a scene's material, its tone, its haze in eighths, its glyph, and
// whether a tile lies under it. The pictures hold these numbers; the atlas holds their looks in the light of the hour.
const looks = [null], numbers = new Map(), glyphs = new Map();
const MATERIALS = SCENES.map((s) => new Map(Object.keys(s.inks.day).map((m, i) => [m, i])));
function look(scene, m, level, haze, glyph, tile) {
  if (!glyphs.has(glyph)) glyphs.set(glyph, glyphs.size);
  const key = ((((scene * 32 + MATERIALS[scene].get(m)) * 3 + level) * 9 + haze) * 256 + glyphs.get(glyph)) * 2 + (tile ? 1 : 0);
  let id = numbers.get(key);
  if (id === undefined) {
    id = looks.length;
    looks.push({ scene, m, level, haze, glyph, tile });
    numbers.set(key, id);
  }
  return id;
}

export function mountFoot(canvas, { font = '"VictorMono NF Obl"', clear = [] } = {}) {
  const g = canvas.getContext("2d");
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  const still = document.createElement("canvas"), s = still.getContext("2d");
  // The layout. Cells are measured in whole device pixels, so tiles meet edge to edge with no seam and each look
  // is copied from the atlas pixel for pixel.
  let cols = 0, rows = 0, cw = 1, ch = 1, dpr = 1, size = 8, scale = 1, ox = 0, oy = 0;
  let drawn = new Uint16Array(0), order = new Uint32Array(0), turns = new Float32Array(0), cleared = new Uint8Array(0);
  let pictures = [], jobs = [], pumping = false, cursor = 0, dirty = true;
  let atlas = null, a = null, inked = new Uint8Array(0);
  let rise = 0, seen = false, last = 0, stirred = performance.now(), watched = 0, airTime = 0;
  let light = document.documentElement.dataset.theme === "night" ? "night" : "day";

  function fit() {
    const box = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    for (const c of [canvas, still]) { c.width = Math.round(box.width * dpr); c.height = Math.round(box.height * dpr); }
    size = box.width < 600 ? 7 : box.width < 2000 ? 8 : 9;
    cw = Math.max(2, Math.round(size * 0.92 * dpr));
    ch = Math.max(2, Math.round(size * 1.08 * dpr));
    cols = Math.ceil(canvas.width / cw);
    rows = Math.ceil(canvas.height / ch);
    // The sheet laid as a slice: it covers the canvas, its foot on the foot, its middle in the middle.
    scale = Math.max(box.width / W, box.height / H);
    ox = (box.width - W * scale) / 2;
    oy = box.height - H * scale;
    const n = cols * rows;
    drawn = new Uint16Array(n); // the still canvas starts empty, as every cell of the sky is
    // When each cell turns to the next scene, as a share of the dissolve: by the ordered dither, leaning upward.
    turns = new Float32Array(n);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) turns[j * cols + i] = BAYER8[(j & 7) * 8 + (i & 7)] * (1 - RISING) + RISING * (1 - j / rows);
    // Cells are visited in the order they turn, so work spread over frames spreads as the dissolve does: counted
    // into a thousand steps of turning, which is finer than any frame of the dissolve and costs one pass.
    const STEPS = 1024, counts = new Uint32Array(STEPS + 1), step = (k) => Math.min(STEPS - 1, (turns[k] * STEPS) | 0);
    for (let k = 0; k < n; k++) counts[step(k) + 1]++;
    for (let q = 1; q <= STEPS; q++) counts[q] += counts[q - 1];
    order = new Uint32Array(n);
    for (let k = 0; k < n; k++) order[counts[step(k)]++] = k;
    cursor = 0;
    // The words' boxes, a cell wider all round, where the sky stays empty.
    cleared = new Uint8Array(n);
    for (const el of clear) {
      const r = el.getBoundingClientRect();
      const [x0, x1, y0, y1] = [r.left - box.left, r.right - box.left, r.top - box.top, r.bottom - box.top].map((v) => v * dpr);
      for (let j = Math.max(0, Math.floor(y0 / ch) - 1); j <= Math.min(rows - 1, Math.floor(y1 / ch) + 1); j++)
        for (let i = Math.max(0, Math.floor(x0 / cw) - 1); i <= Math.min(cols - 1, Math.floor(x1 / cw) + 1); i++) cleared[j * cols + i] = 1;
    }
    atlas = null;
    inked = new Uint8Array(0);
    pictures = [];
    jobs = [];
    dirty = true;
    prepare(now().scene);
  }

  // The sheet's coordinates of a cell's middle.
  const sheetX = (i) => (((i + 0.5) * cw) / dpr - ox) / scale;
  const sheetY = (j) => (((j + 0.5) * ch) / dpr - oy) / scale;

  // A scene's picture for this layout: for each plane, the look of every cell at rest, and how many rows the plane
  // sits lower before it has risen; and the sky, by day and by night. Composed a row at a time, between frames.
  function prepare(n) {
    if (pictures[n]) return;
    pictures[n] = { ready: false };
    jobs.push(compose(n, pictures[n]));
    if (!pumping) { pumping = true; setTimeout(pump, 0); }
  }
  function pump() {
    const end = performance.now() + BUDGET;
    while (jobs.length && performance.now() < end) if (jobs[0].next().done) { jobs.shift(); dirty = true; }
    if (jobs.length) setTimeout(pump, 0);
    else pumping = false;
  }
  function* compose(n, picture) {
    const scene = SCENES[n], planes = scene.planes;
    const out = planes.map(() => new Uint16Array(cols * rows));
    for (let j = 0; j < rows; j++) {
      const Y = sheetY(j);
      for (let i = 0; i < cols; i++) {
        const X = sheetX(i);
        for (let p = 0; p < planes.length; p++) {
          const cell = planes[p].at(X, Y);
          if (cell) out[p][j * cols + i] = lookOf(n, cell, i, j);
        }
      }
      yield;
    }
    picture.planes = out;
    picture.lift = planes.map((p) => Math.round((p.rise * scale * dpr) / ch));
    picture.sky = { day: sky(n, "day"), night: sky(n, "night") };
    yield;
    picture.ready = true;
  }
  function lookOf(n, cell, i, j) {
    const t = clamp01(cell.t);
    const level = Math.min(2, Math.floor(t * 2 + BAYER4[(j & 3) * 4 + (i & 3)]));
    // The letter by how much ink the cell asks for (a material may ask for lighter grain than its tone); in the
    // shaded body of a crown, a tree.
    let glyph = RAMP[Math.min(RAMP.length - 1, Math.floor(clamp01(cell.g ?? t) * RAMP.length))];
    if (cell.tree && t < 0.56 && hash(i, j) < 0.85) glyph = TREES[hash(j, i) < 0.6 ? 0 : 1];
    return look(n, cell.m, level, Math.round(clamp01(cell.haze) * 8), glyph, true);
  }

  // The sky: by day the sun, a disc of cells with a glow of points thinning round it; by night the moon, and stars.
  function sky(n, hour) {
    const scene = SCENES[n], out = new Uint16Array(cols * rows);
    const [OX, OY] = hour === "day" ? scene.sun : scene.moon;
    for (let j = 0; j < rows; j++) {
      const Y = sheetY(j);
      if (Y > 6) break;
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        if (cleared[k]) continue;
        const X = sheetX(i), d = Math.hypot(X - OX, Y - OY) / ORB;
        if (d < 1) {
          // Lit from the upper left, by day a little and by night as a moon is, with a shadowed limb.
          const t = 0.62 + 0.3 * (1 - d * d) - 0.25 * Math.max(0, ((X - OX) - (OY - Y)) / ORB) * (hour === "night" ? 1 : 0.4);
          out[k] = lookOf(n, { m: "orb", t, haze: 0 }, i, j);
        } else if (d < 2.6) {
          const v = (1 - (d - 1) / 1.6) ** 2 * 0.55;
          if (v > BAYER8[(j & 7) * 8 + (i & 7)]) out[k] = look(n, "orb", 1, 3, "·", false);
        } else if (hour === "night" && Y < 4.2) {
          const h = hash(i * 0.37, j * 0.61);
          if (h < 0.0045) out[k] = look(n, "star", h < 0.0008 ? 2 : 1, 0, h < 0.0008 ? STAR : h < 0.0022 ? "+" : "·", false);
        }
      }
    }
    return out;
  }

  // The atlas: each look drawn once, in the light of the hour, in a slot of its own; cells are copies of it.
  function ink(id) {
    if (inked[id]) return;
    const per = 64;
    if (!atlas || id >= inked.length) {
      // Room for the looks there are and as many again; what was drawn is carried over.
      const slots = Math.ceil((looks.length * 2) / per) * per;
      const next = new OffscreenCanvas(per * cw, (slots / per) * ch);
      if (atlas) next.getContext("2d").drawImage(atlas, 0, 0);
      atlas = next;
      a = atlas.getContext("2d");
      a.textAlign = "center";
      a.textBaseline = "middle";
      const grown = new Uint8Array(slots);
      grown.set(inked);
      inked = grown;
    }
    const { scene, m, level, haze, glyph, tile } = looks[id];
    const tones = SCENES[scene].inks[light][m], paper = PAPER[light];
    const x = (id % per) * cw, y = ((id / per) | 0) * ch;
    a.save();
    a.beginPath();
    a.rect(x, y, cw, ch);
    a.clip();
    a.clearRect(x, y, cw, ch);
    if (tile) {
      a.globalAlpha = TILE;
      a.fillStyle = mix(tones[level], paper, haze / 8);
      a.fillRect(x, y, cw, ch);
      a.globalAlpha = 1;
    }
    if (glyph) {
      // The letter a tone beyond its tile: darker by day, lighter by night, as moonlight catches it.
      const beyond = !tile ? level : light === "night" ? Math.min(2, level + 1) : Math.max(0, level - 1);
      a.fillStyle = mix(tones[beyond], paper, (haze / 8) * 0.85);
      a.font = `400 ${size * dpr * (glyph.length > 1 ? 0.9 : 1)}px ${font}`;
      a.fillText(glyph, x + cw / 2, y + ch / 2);
    }
    a.restore();
    inked[id] = 1;
  }

  // Where the turn of scenes stands: the scene shown, the next, and how far the dissolve into it has gone.
  function now() {
    const at = Math.floor(watched / (HOLD + TURN)), phase = watched - at * (HOLD + TURN);
    return { scene: at % SCENES.length, next: (at + 1) % SCENES.length, turn: phase > HOLD ? ease((phase - HOLD) / TURN) : 0 };
  }

  // What a cell of a picture shows at this rise: the nearest plane that covers it, each plane lower by the rows it
  // has yet to rise; failing all, the sky.
  function lifts(picture) {
    return picture.lift.map((l) => Math.round((1 - rise) * l));
  }
  function shows(picture, lift, k, i, j) {
    const planes = picture.planes;
    for (let p = planes.length - 1; p >= 0; p--) {
      const r = j - lift[p];
      if (r < 0) continue;
      const v = planes[p][r * cols + i];
      if (v) return v;
    }
    return picture.sky[light][k];
  }

  // Bring the still canvas to what each cell should show, drawing only the cells that change, in the order cells
  // turn, until the frame's budget is spent; the rest waits for the next frame. Returns whether anything was drawn.
  function paint(state) {
    const A = pictures[state.scene];
    if (!A?.ready) return false;
    const B = state.turn > 0 ? pictures[state.next] : null;
    const la = lifts(A), lb = B && lifts(B), n = cols * rows, end = performance.now() + BUDGET;
    let changed = false, c = 0;
    for (; c < n; c++) {
      if ((c & 255) === 0 && c && performance.now() > end) break;
      const k = order[(cursor + c) % n], i = k % cols, j = (k / cols) | 0;
      const id = B && turns[k] < state.turn ? shows(B, lb, k, i, j) : shows(A, la, k, i, j);
      if (id === drawn[k]) continue;
      s.clearRect(i * cw, j * ch, cw, ch);
      if (id) {
        ink(id);
        s.drawImage(atlas, (id % 64) * cw, ((id / 64) | 0) * ch, cw, ch, i * cw, j * ch, cw, ch);
      }
      drawn[k] = id;
      changed = true;
    }
    cursor = (cursor + c) % n;
    if (c === n) dirty = false;
    return changed;
  }

  // Each frame: the still scene, then its air, over the cells that are the scene's own.
  function present(state) {
    g.globalAlpha = 1;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(still, 0, 0);
    if (!pictures[state.scene]?.ready) return;
    for (const n of state.turn > 0 ? [state.scene, state.next] : [state.scene]) {
      const air = SCENES[n].air;
      if (!air) continue;
      const orb = light === "day" ? SCENES[n].sun : SCENES[n].moon;
      const ids = air.shade ? [look(n, "air", 1, 0, "", true)] : air.glyphs.map((glyph) => look(n, "air", 1, 0, glyph, false));
      const [x0, x1, y0, y1] = air.box;
      const i0 = Math.max(0, Math.floor(((x0 * scale + ox) * dpr) / cw)), i1 = Math.min(cols - 1, Math.ceil(((x1 * scale + ox) * dpr) / cw));
      const j0 = Math.max(0, Math.floor(((y0 * scale + oy) * dpr) / ch)), j1 = Math.min(rows - 1, Math.ceil(((y1 * scale + oy) * dpr) / ch));
      for (let j = j0; j <= j1; j++) {
        const Y = sheetY(j);
        for (let i = i0; i <= i1; i++) {
          const k = j * cols + i;
          // In a turn, each cell's air is that of the scene it shows.
          if (state.turn > 0 && (turns[k] < state.turn) !== (n === state.next)) continue;
          const v = air.at(sheetX(i), Y, airTime, looks[drawn[k]]?.m ?? "", orb);
          if (v <= 0) continue;
          if (air.shade && v < BAYER8[(j & 7) * 8 + (i & 7)]) continue;
          const id = air.shade ? ids[0] : ids[Math.min(ids.length - 1, Math.floor(v * ids.length))];
          ink(id);
          g.globalAlpha = air.shade ? air.alpha : air.alpha * v;
          g.drawImage(atlas, (id % 64) * cw, ((id / 64) | 0) * ch, cw, ch, i * cw, j * ch, cw, ch);
        }
      }
    }
    g.globalAlpha = 1;
  }

  // How far the foot has come into view: its planes have risen fully once it is wholly on screen, or fills it.
  function measure() {
    const r = canvas.getBoundingClientRect();
    const next = calm.matches ? 1 : Math.round(clamp01((innerHeight - r.top) / Math.min(r.height, innerHeight)) * 16) / 16;
    if (next !== rise) { rise = next; dirty = true; }
  }

  function tick(time) {
    if (!seen) return;
    requestAnimationFrame(tick);
    if (time - last < 1000 / FPS) return;
    const dt = Math.min(250, time - last);
    last = time;
    measure();
    let state = now();
    // The scenes turn only while someone is there to see them, and a turn begun is finished.
    const moving = !calm.matches && (time - stirred < REST || state.turn > 0);
    if (moving && pictures[state.scene]?.ready) {
      airTime += dt / 1000;
      // A scene holds until the next is composed, however long that takes.
      const at = Math.floor(watched / (HOLD + TURN)) * (HOLD + TURN);
      watched = pictures[state.next]?.ready ? watched + dt : Math.min(watched + dt, at + HOLD);
      const after = now();
      if (after.scene !== state.scene || after.turn !== state.turn) dirty = true;
      state = after;
    }
    prepare(state.scene);
    if (!calm.matches) prepare(state.next);
    const painted = dirty && paint(state);
    if (painted || moving) present(state);
  }

  const wake = () => (stirred = performance.now());
  for (const type of ["pointermove", "scroll", "keydown", "touchstart", "wheel"]) addEventListener(type, wake, { passive: true });
  const view = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) requestAnimationFrame(tick); });
  const resize = new ResizeObserver(() => fit());
  // By night the same scene, repainted: every look is drawn again in the new light as its cells come round.
  const theme = new MutationObserver(() => {
    const next = document.documentElement.dataset.theme === "night" ? "night" : "day";
    if (next === light) return;
    light = next;
    inked.fill(0);
    drawn.fill(NONE);
    dirty = true;
  });
  document.fonts.load(`400 12px ${font}`, RAMP.join("") + TREES.join("") + STAR + "+").then(() => {
    resize.observe(canvas);
    view.observe(canvas);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  });
}
