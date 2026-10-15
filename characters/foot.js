// The foot of the Characters page: landscapes written in type, after the references kept locally. A scene is a
// grid of cells, each a pixel of a dithered picture: its color one of three tones of its material, laid as a soft
// tile, and on it a letter of the name or one of the face's trees, a tone beyond the tile. At this size the letters
// are grain and the tiles carry the color. Four scenes take turns, a gorge, a valley, dunes, and a cove (scenes.js
// draws them): each holds a while, then gives way to the next as a stage changes its set. The old scene's planes
// sink out of the frame, the farthest first, behind what stands before them; the new scene's rise into place, the
// nearest first, the distance coming up behind, settling a row at a time; and the sun, or the moon, crosses from
// its place in the one to its place in the other. As the foot comes into view the planes rise into place the same
// way, the nearest the furthest; over the still scene, its air moves at twelve frames a second.
//
//   import { mountFoot } from "./foot.js";
//   mountFoot(canvas, { clear: [...words] });
//
// The frame is always 9 units high, so the land keeps its share of the height and every feature its size, and as
// many wide as its aspect makes it; each scene is laid across that width as scenes.js says, its sides holding the
// edges and its middle taking what is left. The sky is left to the page's words: nothing in it, not even a star,
// falls on the elements given as clear.

import { SCENES, across } from "./scenes.js";

const FPS = 12;
const TURN_FPS = 30; // while scenes turn; at twelve a plane would jump half a dozen rows a frame
const REST = 20000; // ms without input before the foot holds still, as the field does
const HOLD = 2000; // ms a scene holds between turns
const TURN = 2000; // ms a scene takes to give way to the next
// A turn's choreography, in shares of it. Each plane moves over MOVE. The old scene's start within the first
// STAGGER, farthest first; the new scene's from ENTER, nearest first; so the two overlap and the land is never bare.
const MOVE = 0.4, STAGGER = 0.2, ENTER = 0.4;
const ARC = 0.35; // how far the sun or the moon rises above the straight way between its places, in the scenes' units
const RISING = 0.35; // how far a repaint leans upward: a new light settles from the foot
const BUDGET = 7; // ms a slice of composing may take, or a frame, drawing and all; the rest waits for the next
const TILE = 0.64; // how strongly a cell's own color is laid under its letter
const ORB = 0.4; // the sun's and the moon's radius, in the scenes' units
const RAMP = ["d", "a", "3", "n", "t", "l", "i", ":", "·"]; // dark to light, by how much ink each letter lays
const TREES = ["\u{F0531}", "\u{F0405}"]; // a broadleaf and a pine, from the Nerd Fonts' Material Design icons
const STAR = "\u{F0AE2}"; // a four-pointed star
const H = 9; // the frame's height in the scenes' units
const NONE = 0xffff; // a cell whose drawing is not known, so it is drawn whatever it should show

// Ordered dither thresholds, (v + 0.5) / n²: four by four for a cell's tone, eight by eight for the order in which
// cells are repainted, sixty-four steps fine.
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
  let cols = 0, rows = 0, cw = 1, ch = 1, dpr = 1, size = 8, scale = 1, W = 16;
  let drawn = new Uint16Array(0), order = new Uint32Array(0), cleared = new Uint8Array(0), heaven = new Uint16Array(0);
  let pictures = [], stages = [], jobs = [], pumping = false, cursor = 0, dirty = true;
  let atlas = null, a = null, inked = new Uint8Array(0);
  let rise = 0, seen = false, last = 0, stirred = performance.now(), watched = 0, airTime = 0;
  let behind = false, layered = false, fast = false;
  let light = document.documentElement.dataset.theme === "night" ? "night" : "day";

  function fit() {
    const box = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    for (const c of [canvas, still]) { c.width = Math.round(box.width * dpr); c.height = Math.round(box.height * dpr); }
    // Cells grow a little with the screen, from 7 px on a phone to 9 on the widest, the grain staying fine.
    size = Math.min(9, Math.max(7, 6.2 + box.width / 800));
    cw = Math.max(2, Math.round(size * 0.92 * dpr));
    ch = Math.max(2, Math.round(size * 1.08 * dpr));
    cols = Math.ceil(canvas.width / cw);
    rows = Math.ceil(canvas.height / ch);
    scale = box.height / H;
    W = box.width / scale;
    const n = cols * rows;
    drawn = new Uint16Array(n); // the still canvas starts empty, as every cell of the sky is
    heaven = new Uint16Array(n);
    // The order in which cells are repainted, as when the light changes: by the ordered dither, leaning upward, so
    // the new settles from the foot. Counted into a thousand steps, finer than the eye follows, in one pass.
    const due = new Float32Array(n);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) due[j * cols + i] = BAYER8[(j & 7) * 8 + (i & 7)] * (1 - RISING) + RISING * (1 - j / rows);
    const STEPS = 1024, counts = new Uint32Array(STEPS + 1), step = (k) => Math.min(STEPS - 1, (due[k] * STEPS) | 0);
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
    stages = [];
    jobs = [];
    dirty = true;
    behind = false;
    prepare(now().scene);
  }

  // The frame's coordinates of a cell's middle.
  const frameX = (i) => ((i + 0.5) * cw) / dpr / scale;
  const frameY = (j) => ((j + 0.5) * ch) / dpr / scale;

  // A scene's picture for this layout: how it lies across the frame; for each plane, the look of every cell at
  // rest, the cells it covers, and how many rows it sits lower before it has risen; where its sun and moon stand;
  // and its sky, by day and by night. Composed a row at a time, between frames.
  function prepare(n) {
    if (pictures[n]) return;
    pictures[n] = { ready: false };
    run(compose(n, pictures[n]));
  }
  function run(job) {
    jobs.push(job);
    if (!pumping) { pumping = true; setTimeout(pump, 0); }
  }
  // Composing goes a row at a time, at least one a slice, and stops before a row that might not fit in it; until
  // a row has been timed, one is taken to cost two milliseconds.
  let step = 2;
  function pump() {
    const end = performance.now() + BUDGET - 0.5;
    for (let now = performance.now(); jobs.length; ) {
      if (jobs[0].next().done) { jobs.shift(); dirty = true; }
      const then = performance.now();
      step = Math.max(step * 0.9, then - now);
      now = then;
      if (now + step > end) break;
    }
    if (jobs.length) setTimeout(pump, 0);
    else pumping = false;
  }
  function* compose(n, picture) {
    const scene = SCENES[n], planes = scene.planes, lay = across(scene, W);
    const out = planes.map(() => new Uint16Array(cols * rows));
    const box = planes.map(() => [cols, -1, rows, -1]); // first and last column, first and last row
    const point = { x: 0, k: 1, row: ch / dpr / scale };
    for (let j = 0; j < rows; j++) {
      const Y = frameY(j);
      for (let i = 0; i < cols; i++) {
        point.x = frameX(i);
        point.k = lay.squeeze(point.x);
        const X = lay.to(point.x);
        for (let p = 0; p < planes.length; p++) {
          const cell = planes[p].at(X, Y, point);
          if (!cell) continue;
          out[p][j * cols + i] = lookOf(n, cell, i, j);
          const b = box[p];
          if (i < b[0]) b[0] = i;
          if (i > b[1]) b[1] = i;
          if (j < b[2]) b[2] = j;
          b[3] = j;
        }
      }
      yield;
    }
    const place = ([at, Y]) => [lay.from(at), Y];
    picture.lay = lay;
    picture.planes = out;
    picture.box = box.map((b) => (b[1] < 0 ? null : b));
    picture.lift = planes.map((p) => Math.round((p.rise * scale * dpr) / ch));
    picture.orb = { day: place(scene.sun), night: place(scene.moon) };
    picture.sky = { day: sky(n, "day", picture.orb.day), night: sky(n, "night", picture.orb.night) };
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

  // The sky with the sun or the moon at [OX, OY]: by day a disc of cells with a glow of points thinning round it;
  // by night the moon, and stars. The screen of cells stays put, so an orb that moves moves under it.
  function sky(n, hour, [OX, OY], out = new Uint16Array(cols * rows)) {
    out.fill(0);
    for (let j = 0; j < rows; j++) {
      const Y = frameY(j);
      if (Y > 6) break;
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        if (cleared[k]) continue;
        const X = frameX(i), d = Math.hypot(X - OX, Y - OY) / ORB;
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
  const copy = (ctx, id, x, y) => ctx.drawImage(atlas, (id % 64) * cw, ((id / 64) | 0) * ch, cw, ch, x, y, cw, ch);

  // The layers: each plane of the scene shown and of the next, drawn once into a canvas of its own, cropped to the
  // cells it covers, so a turn moves planes whole where drawing them cell by cell would take a frame and more. Each
  // cell is laid on the paper, so a nearer plane hides what is behind it rather than letting its tile through.
  // Only the two scenes in play keep theirs; a new light redraws them in place, a row at a time. Each row is drawn
  // to a point at once, so the canvas does its work in the row's slice, not all of it in the turn's first frame.
  const dot = new OffscreenCanvas(1, 1).getContext("2d");
  function stage(n) {
    if (stages[n] || !pictures[n]?.ready) return;
    stages[n] = { ready: false, layers: null, gen: 0 };
    redraw(n);
  }
  function redraw(n) {
    const st = stages[n];
    run(layer(n, st, ++st.gen));
  }
  function* layer(n, st, gen) {
    const { box, planes } = pictures[n];
    st.layers ??= box.map((b) => b && new OffscreenCanvas((b[1] - b[0] + 1) * cw, (b[3] - b[2] + 1) * ch).getContext("2d"));
    for (let p = 0; p < box.length; p++) {
      const b = box[p], l = st.layers[p];
      if (!b) continue;
      for (let j = b[2]; j <= b[3]; j++) {
        if (st.gen !== gen || stages[n] !== st) return;
        l.fillStyle = PAPER[light];
        for (let i = b[0]; i <= b[1]; i++) {
          const id = planes[p][j * cols + i];
          if (!id) continue;
          const x = (i - b[0]) * cw, y = (j - b[2]) * ch;
          l.fillRect(x, y, cw, ch);
          ink(id);
          copy(l, id, x, y);
        }
        dot.drawImage(l.canvas, 0, 0, 1, 1, 0, 0, 1, 1);
        yield;
      }
    }
    st.ready = true;
  }
  function keep(...ns) {
    for (let n = 0; n < stages.length; n++) if (stages[n] && !ns.includes(n)) stages[n] = null;
  }

  // Where the turn of scenes stands: the scene shown, the next, and how far the turn into it has gone, 0 to 1,
  // or 0 while the scene holds.
  function now() {
    const at = Math.floor(watched / (HOLD + TURN)), phase = watched - at * (HOLD + TURN);
    return { scene: at % SCENES.length, next: (at + 1) % SCENES.length, turn: phase > HOLD ? (phase - HOLD) / TURN : 0 };
  }
  // The scene the still canvas is being brought to: in a turn, the one coming.
  const target = (state) => (state.turn > 0 ? state.next : state.scene);

  // How many rows each plane of a picture sits below its place: at this rise, and in a turn, how far it has sunk
  // (going: farthest first, falling away) or has yet to rise (coming: nearest first, settling). Each goes just far
  // enough that its top row is below the frame's foot, but a far plane never runs ahead of the planes before it, so
  // the parts of it they hide, drawn roughly or not at all, stay hidden.
  function lifts(picture) {
    return picture.lift.map((l) => Math.round((1 - rise) * l));
  }
  function offsets(picture, u, going) {
    const off = lifts(picture), P = off.length;
    for (let p = P - 1, ahead = 0; p >= 0; p--) {
      const b = picture.box[p];
      if (!b) continue;
      const share = P > 1 ? p / (P - 1) : 0, D = rows - b[2];
      const t = clamp01((u - (going ? STAGGER * share : ENTER + STAGGER * (1 - share))) / MOVE);
      ahead = Math.max(ahead, Math.round(going ? D * t * t : D * (1 - t) ** 3));
      off[p] += ahead;
    }
    return off;
  }

  // What a cell of a picture shows at this rise: the nearest plane that covers it, each plane lower by the rows it
  // has yet to rise; failing all, the sky.
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

  // Bring the still canvas to what each cell of the target scene should show at rest, drawing only the cells that
  // change, in the repaint's order, until the frame's budget is spent; the rest waits for the next frame. Returns
  // whether anything was drawn.
  function paint(state) {
    const A = pictures[target(state)];
    if (!A?.ready) return false;
    // Drawing leaves a frame room to lay the scene and its air on the canvas after it; in a turn, when the still
    // canvas is hidden and has the turn to catch up, it takes less.
    const la = lifts(A), n = cols * rows, end = performance.now() + (state.turn > 0 ? 1 : BUDGET - 2.5);
    let changed = false, c = 0;
    for (; c < n; c++) {
      if ((c & 255) === 0 && c && performance.now() > end) break;
      const k = order[(cursor + c) % n], i = k % cols, j = (k / cols) | 0;
      const id = shows(A, la, k, i, j);
      if (id === drawn[k]) continue;
      s.clearRect(i * cw, j * ch, cw, ch);
      if (id) {
        ink(id);
        copy(s, id, i * cw, j * ch);
      }
      drawn[k] = id;
      changed = true;
    }
    cursor = (cursor + c) % n;
    if (c === n) dirty = false;
    return changed;
  }

  // The cells a scene's air may reach.
  function reachOf(n) {
    const [x0, x1, y0, y1] = SCENES[n].air.box, lay = pictures[n].lay;
    return [
      Math.max(0, Math.floor((lay.from(x0) * scale * dpr) / cw)), Math.min(cols - 1, Math.ceil((lay.from(x1) * scale * dpr) / cw)),
      Math.max(0, Math.floor((y0 * scale * dpr) / ch)), Math.min(rows - 1, Math.ceil((y1 * scale * dpr) / ch)),
    ];
  }
  // A scene's air over the cells of its reach, where under(i, j) gives the material below, or null for none of its own.
  function breathe(n, [i0, i1, j0, j1], under) {
    const air = SCENES[n].air, lay = pictures[n].lay;
    const orb = light === "day" ? SCENES[n].sun : SCENES[n].moon;
    const ids = air.shade ? [look(n, "air", 1, 0, "", true)] : air.glyphs.map((glyph) => look(n, "air", 1, 0, glyph, false));
    for (let j = j0; j <= j1; j++) {
      const Y = frameY(j);
      for (let i = i0; i <= i1; i++) {
        const m = under(i, j);
        if (m === null) continue;
        const v = air.at(lay.to(frameX(i)), Y, airTime, m, orb);
        if (v <= 0) continue;
        if (air.shade && v < BAYER8[(j & 7) * 8 + (i & 7)]) continue;
        const id = air.shade ? ids[0] : ids[Math.min(ids.length - 1, Math.floor(v * ids.length))];
        ink(id);
        g.globalAlpha = air.shade ? air.alpha : air.alpha * v;
        copy(g, id, i * cw, j * ch);
      }
    }
    g.globalAlpha = 1;
  }

  // A frame while the scene holds: the still scene, then its air. While nothing but the air has changed, only the
  // air's reach is laid again.
  function present(state, whole) {
    const n = state.scene, reach = SCENES[n].air && pictures[n]?.lay ? reachOf(n) : null;
    let [x, y, w, h] = [0, 0, canvas.width, canvas.height];
    if (!whole && reach) {
      [x, y] = [reach[0] * cw, reach[2] * ch];
      w = Math.min(canvas.width, (reach[1] + 1) * cw) - x;
      h = Math.min(canvas.height, (reach[3] + 1) * ch) - y;
    }
    g.globalAlpha = 1;
    g.clearRect(x, y, w, h);
    g.drawImage(still, x, y, w, h, x, y, w, h);
    if (reach) breathe(n, reach, (i, j) => looks[drawn[j * cols + i]]?.m ?? "");
  }

  // A frame drawn from the layers, in a turn or until the still canvas has caught up with it: the sky with its orb
  // where it stands, then each scene's planes, far to near, at their rows, the coming scene in front of the going;
  // then each scene's air, only over its own land at rest.
  function shift(state) {
    const u = state.turn, going = u > 0 ? state.scene : -1, coming = target(state);
    const shown = (going < 0 ? [coming] : [going, coming]).map((n) => {
      const picture = pictures[n];
      return { n, picture, lift: lifts(picture), off: u > 0 ? offsets(picture, u, n === going) : lifts(picture) };
    });
    // The sun or the moon crosses from the one place to the other, eased, a little above the straight way.
    let orb = pictures[coming].orb[light];
    if (going >= 0) {
      const from = pictures[going].orb[light], e = ease(u);
      orb = [from[0] + (orb[0] - from[0]) * e, from[1] + (orb[1] - from[1]) * e - ARC * Math.sin(Math.PI * e)];
    }
    g.globalAlpha = 1;
    g.clearRect(0, 0, canvas.width, canvas.height);
    sky(coming, light, orb, heaven);
    for (let k = 0; k < heaven.length; k++) {
      const id = heaven[k];
      if (!id) continue;
      ink(id);
      copy(g, id, (k % cols) * cw, ((k / cols) | 0) * ch);
    }
    for (const { n, picture, off } of shown) {
      const layers = stages[n].layers;
      picture.box.forEach((b, p) => {
        if (b && b[2] + off[p] < rows) g.drawImage(layers[p].canvas, b[0] * cw, (b[2] + off[p]) * ch);
      });
    }
    // The sky is the going scene's until its farthest plane moves, and the coming scene's once its own has settled.
    const [first, last] = [shown[0], shown[shown.length - 1]];
    const heavens = first.off[0] === first.lift[0] ? first.n : last.off[0] === last.lift[0] ? last.n : -1;
    for (const { n } of shown) {
      if (!SCENES[n].air) continue;
      breathe(n, reachOf(n), (i, j) => {
        for (let q = shown.length - 1; q >= 0; q--) {
          const { picture, off, lift } = shown[q], planes = picture.planes;
          for (let p = planes.length - 1; p >= 0; p--) {
            const r = j - off[p];
            if (r < 0) continue;
            const id = planes[p][r * cols + i];
            if (id) return shown[q].n === n && off[p] === lift[p] ? looks[id].m : null;
          }
        }
        return heavens === n ? "" : null;
      });
    }
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
    if (time - last < 1000 / (fast ? TURN_FPS : FPS)) return;
    const dt = Math.min(250, time - last);
    last = time;
    measure();
    let state = now();
    // The scenes turn only while someone is there to see them, and a turn begun is finished.
    const moving = !calm.matches && (time - stirred < REST || state.turn > 0);
    if (moving && pictures[state.scene]?.ready) {
      airTime += dt / 1000;
      // A scene holds until the next is composed and both have their layers, however long that takes.
      const at = Math.floor(watched / (HOLD + TURN)) * (HOLD + TURN);
      const set = pictures[state.next]?.ready && stages[state.scene]?.ready && stages[state.next]?.ready;
      watched = set ? watched + dt : Math.min(watched + dt, at + HOLD);
      const after = now();
      // The still canvas is brought to the scene that will hold next; until it has caught up, frames come from the
      // layers.
      if (target(after) !== target(state)) { dirty = true; behind = true; }
      state = after;
    }
    prepare(state.scene);
    if (!calm.matches) {
      prepare(state.next);
      stage(state.scene);
      stage(state.next);
      keep(state.scene, state.next);
    }
    const painted = dirty && paint(state);
    if (behind && state.turn === 0 && !dirty) behind = false;
    const was = layered;
    layered = (state.turn > 0 || behind) && [state.scene, target(state)].every((n) => stages[n]?.ready);
    if (layered) {
      shift(state);
      // The still canvas, hidden meanwhile, does its drawing now, a frame's worth at a time, not all of it when shown.
      if (painted) dot.drawImage(still, 0, 0, 1, 1, 0, 0, 1, 1);
    } else if (painted || moving || was) present(state, painted || was);
    fast = state.turn > 0;
  }

  const wake = () => (stirred = performance.now());
  for (const type of ["pointermove", "scroll", "keydown", "touchstart", "wheel"]) addEventListener(type, wake, { passive: true });
  const view = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) requestAnimationFrame(tick); });
  const resize = new ResizeObserver(() => fit());
  // By night the same scene, repainted: every look is drawn again in the new light as its cells come round, and
  // the layers in play are drawn again in place.
  const theme = new MutationObserver(() => {
    const next = document.documentElement.dataset.theme === "night" ? "night" : "day";
    if (next === light) return;
    light = next;
    inked.fill(0);
    drawn.fill(NONE);
    dirty = true;
    for (let n = 0; n < stages.length; n++) if (stages[n]) redraw(n);
  });
  document.fonts.load(`400 12px ${font}`, RAMP.join("") + TREES.join("") + STAR + "+").then(() => {
    resize.observe(canvas);
    view.observe(canvas);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  });
}
