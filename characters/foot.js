// The foot of the Characters page: a misty gorge written in type. Cliffs, slopes, and trees are cells of
// one grid, each a pixel of a dithered picture, its color one of three tones of its material, laid as a
// soft tile, and on it a letter of the name or one of the face's glyphs in the tone below: the tile
// carries the color, since a letter alone lays too little ink to, and the letter carries the texture; the haze washes the far planes toward the
// paper and fills the gorge's floor. As the foot comes into view its planes rise into place a row at a
// time, the nearest the furthest; a drift of mist moves through the gorge. By night the same gorge is
// moonlit.
//
//   import { mountFoot } from "./foot.js";
//   mountFoot(canvas);
//
// The scene is composed on a 16 x 9 sheet, laid over the canvas as a slice is, its foot on the canvas's
// foot and its middle in the middle, so a narrow screen keeps the gorge and loses the outer cliffs.

import { perlin } from "./field.js";

const FPS = 12;
const W = 16, H = 9;
const TILE = 0.42; // how strongly a cell's own color is laid under its letter
const RAMP = ["d", "a", "3", "n", "t", "l", "i", ":", "·"]; // dark to light, by how much ink each letter lays
const TREES = ["\u{F0531}", "\u{F0405}"]; // a broadleaf and a pine, from the Nerd Fonts' Material Design icons
const SUN = "\u{E30D}", MOON = "\u{E39B}", STARS = "\u{E370}"; // weather-day_sunny, weather-moon_full, weather-stars
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

// Each material's three tones, dark to light, by day and by night.
const INKS = {
  day: { rock: ["#7E6F78", "#B09F5A", "#DCCF8C"], foliage: ["#2F5A2C", "#5F8D3A", "#B5C567"], grass: ["#6E8F3A", "#A3B449", "#D8DA7E"], paper: "#F8F7F2", sky: "#C9A23C" },
  night: { rock: ["#3E4566", "#6B7598", "#A3ACCD"], foliage: ["#22383A", "#3F6159", "#7E9C8C"], grass: ["#2E4740", "#557064", "#8EA697"], paper: "#1B2036", sky: "#F1EDE2" },
};

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const n1 = (x, k = 0) => perlin(x, k, 0.5); // a ragged line, about -0.5 to 0.5
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };

// The planes, far to near. Each says, for a point of the sheet, whether it is inside, of what, how light
// (0 dark to 1 light), and how far the haze has washed it toward the paper.
const clamp01 = (v) => Math.min(1, Math.max(0, v));
// Columned rock: the noise pushed hard toward light and dark, so the columns read as lit and shadowed.
const columns = (X, Y, k) => clamp01(0.5 + 1.7 * perlin(X * 6.5, Y * 0.32, k));
const PLANES = [
  { // the far walls, deep in the gorge, half lost in haze
    rise: 2,
    at(X, Y) {
      const left = X < 6.5 + 0.25 * n1(Y * 0.9, 3) && Y > 3.3 + 0.5 * n1(X * 1.3, 1) + 0.12 * X;
      const right = X > 9.7 + 0.25 * n1(Y * 0.9, 4) && Y > 3.8 + 0.5 * n1(X * 1.3, 2) - 0.05 * (X - 10);
      if (!left && !right) return null;
      const face = left ? smooth(5, 6.5, X) : 1 - smooth(9.7, 11.2, X);
      return { m: "rock", t: 0.3 + 0.45 * columns(X, Y, 9) + 0.25 * face, haze: 0.45 + 0.4 * smooth(4.5, 8.5, Y) };
    },
  },
  { // the gorge's floor, far below: a few crowns showing through the mist, the middle left to the mist
    rise: 3,
    at(X, Y) {
      if (Math.abs(X - 8) > 3.4 || Y < 7.2 + 0.35 * n1(X * 0.8, 5)) return null;
      if (perlin(X * 3, Y * 3, 11) < 0.05) return null;
      return { m: "foliage", t: 0.45 + 0.3 * perlin(X * 2.4, Y * 2.4, 19), haze: 0.62 + 0.25 * (1 - Math.abs(X - 8) / 3.4) };
    },
  },
  { // the tall walls either side: columned rock, lit on the faces that turn to the gorge, shadowed behind
    rise: 5,
    at(X, Y) {
      const lt = 1.5 + 0.35 * n1(X * 1.6, 6) + 0.16 * Math.floor(X * 1.4) / 1.4;
      const rt = 1.9 + 0.35 * n1(X * 1.6, 7) + 0.14 * Math.floor((W - X) * 1.4) / 1.4;
      const left = X < 4.4 + 0.3 * n1(Y * 1.1, 8) + 0.06 * Y && Y > lt;
      const right = X > 11.3 + 0.3 * n1(Y * 1.1, 9) - 0.06 * Y && Y > rt;
      if (!left && !right) return null;
      const face = left ? smooth(2.4, 4.4, X) : 1 - smooth(11.3, 13.6, X);
      const top = left ? lt : rt;
      // A green crown where the rock meets the sky.
      if (Y < top + 0.32 + 0.2 * n1(X * 4, 10)) return { m: "foliage", t: 0.35 + 0.35 * perlin(X * 4, Y * 4, 12), haze: 0.05 };
      return { m: "rock", t: 0.1 + 0.5 * columns(X, Y, 13) + 0.4 * face - 0.15 * smooth(5, 9, Y), haze: 0.04 + 0.28 * smooth(6, 9, Y) };
    },
  },
  { // the near slopes: crowns of trees on their shoulders, grass falling to the foot
    rise: 8,
    at(X, Y) {
      const left = Y > 6.0 + 2.7 * (X / 5.6) ** 2 - 0.9 * Math.max(0, perlin(X * 1.8, 2, 15) + 0.3) && X < 6.2;
      const right = Y > 5.6 + 2.8 * ((W - X) / 5.2) ** 2 - 0.9 * Math.max(0, perlin(X * 1.8, 3, 16) + 0.3) && X > 10.2;
      if (!left && !right) return null;
      const shoulder = left ? 6.0 + 2.7 * (X / 5.6) ** 2 : 5.6 + 2.8 * ((W - X) / 5.2) ** 2;
      // Crowns gather where the noise rises near the shoulder; each is drawn in trees, darker at its foot.
      const crown = perlin(X * 2.4, Y * 2.4, 17) + 0.45 - 0.5 * Math.max(0, Y - shoulder - 0.4);
      if (crown > 0.2) return { m: "foliage", t: 0.15 + 0.5 * clamp01(crown - 0.2) + 0.3 * perlin(X * 5, Y * 5, 20), haze: 0, tree: true };
      return { m: "grass", t: 0.62 + 0.3 * perlin(X * 3, Y * 6, 18), haze: 0 };
    },
  },
];

export function mountFoot(canvas, { font = '"VictorMono NF Obl"' } = {}) {
  const g = canvas.getContext("2d");
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  const still = document.createElement("canvas"), s = still.getContext("2d");
  let cols = 0, rows = 0, cw = 0, ch = 0, dpr = 1, size = 12, scale = 1, ox = 0, oy = 0;
  let rise = 0, drawnRise = -1, seen = false, last = 0;

  const light = () => (document.documentElement.dataset.theme === "night" ? "night" : "day");
  const mix = (a, b, t) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [x, y] = [p(a), p(b)];
    return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
  };

  function fit() {
    const box = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    for (const c of [canvas, still]) { c.width = Math.round(box.width * dpr); c.height = Math.round(box.height * dpr); }
    size = box.width < 600 ? 10 : 12;
    cw = size * 0.92;
    ch = size * 1.08;
    cols = Math.ceil(box.width / cw);
    rows = Math.ceil(box.height / ch);
    // The sheet laid as a slice: it covers the canvas, its foot on the foot, its middle in the middle.
    scale = Math.max(box.width / W, box.height / H);
    ox = (box.width - W * scale) / 2;
    oy = box.height - H * scale;
    drawnRise = -1;
    paint();
  }

  // The scene as it stands at this much rise, into the still canvas; the frames lay the mist over it.
  function paint() {
    const inks = INKS[light()], night = light() === "night";
    s.setTransform(dpr, 0, 0, dpr, 0, 0);
    s.clearRect(0, 0, cols * cw, rows * ch);
    s.textAlign = "center";
    s.textBaseline = "middle";
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const X = ((i + 0.5) * cw - ox) / scale;
      let cell = null;
      // The nearest plane that covers the cell wins; each plane sits lower by the rows it has yet to rise.
      for (let p = PLANES.length - 1; p >= 0 && !cell; p--) {
        const lag = Math.round((1 - rise) * PLANES[p].rise);
        const Y = ((j - lag + 0.5) * ch - oy) / scale;
        cell = PLANES[p].at(X, Y);
      }
      if (!cell) continue;
      const t = Math.min(1, Math.max(0, cell.t)), tones = inks[cell.m];
      const level = Math.min(2, Math.floor(t * 2 + BAYER[(j & 3) * 4 + (i & 3)]));
      let glyph = RAMP[Math.min(RAMP.length - 1, Math.floor(t * RAMP.length))];
      if (cell.tree && hash(i, j) < 0.85) glyph = TREES[hash(j, i) < 0.6 ? 0 : 1];
      // The tile on whole device pixels, edge to edge with its neighbours, so no seam shows between them.
      const [x0, x1, y0, y1] = [i * cw, (i + 1) * cw, j * ch, (j + 1) * ch].map((v) => Math.round(v * dpr) / dpr);
      s.globalAlpha = TILE;
      s.fillStyle = mix(tones[level], inks.paper, cell.haze);
      s.fillRect(x0, y0, x1 - x0, y1 - y0);
      s.globalAlpha = 1;
      s.font = `400 ${size * (glyph.length > 1 ? 1.05 : 1)}px ${font}`;
      // The letter a tone beyond its tile: darker by day, lighter by night, as moonlight catches it.
      const beyond = night ? Math.min(2, level + 1) : Math.max(0, level - 1);
      s.fillStyle = mix(tones[beyond], inks.paper, cell.haze * 0.85);
      s.fillText(glyph, (i + 0.5) * cw, (j + 0.5) * ch);
    }
    // Sun by day; by night the moon and a scatter of stars, all in the sky above the walls.
    const orb = (X, Y, glyph, k, color) => { s.font = `400 ${size * k}px ${font}`; s.fillStyle = color; s.fillText(glyph, X * scale + ox, Y * scale + oy); };
    if (light() === "day") orb(12.6, 1.1, SUN, 2.6, inks.sky);
    else {
      orb(12.6, 1.1, MOON, 2.4, inks.sky);
      for (let k = 0; k < 9; k++) orb(1 + hash(k, 3) * 14, 0.25 + hash(3, k) * 1.4, STARS, 0.9, mix(inks.sky, inks.paper, 0.45));
    }
    drawnRise = rise;
  }

  // Each frame: the still scene, then the mist drifting through the gorge's floor.
  function frame(t) {
    const inks = INKS[light()];
    if (drawnRise !== rise) paint();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(still, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `400 ${size}px ${font}`;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const X = ((i + 0.5) * cw - ox) / scale, Y = ((j + 0.5) * ch - oy) / scale;
      if (X < 4.8 || X > 11.2 || Y < 4.6 || Y > 8.8) continue;
      const v = perlin(X * 1.6 - t * 0.6, Y * 3, 21) + 0.35 * (1 - Math.abs(X - 8) / 3.2);
      if (v < 0.42) continue;
      g.fillStyle = mix(inks.rock[2], inks.paper, 0.35);
      g.globalAlpha = Math.min(0.6, (v - 0.42) * 2.4);
      g.fillText(v > 0.6 ? "~" : "·", (i + 0.5) * cw, (j + 0.5) * ch);
    }
    g.globalAlpha = 1;
  }

  // How far the foot has come into view: its planes have risen fully once its top reaches the middle.
  function measure() {
    const r = canvas.getBoundingClientRect();
    rise = calm.matches ? 1 : Math.round(Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height * 0.75 + innerHeight * 0.25))) * 8) / 8;
  }
  function tick(now) {
    if (!seen) return;
    requestAnimationFrame(tick);
    if (now - last < 1000 / FPS) return;
    last = now;
    measure();
    frame(calm.matches ? 0 : now / 1000);
  }

  const view = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) requestAnimationFrame(tick); });
  const resize = new ResizeObserver(() => { fit(); frame(0); });
  const theme = new MutationObserver(() => { drawnRise = -1; frame(performance.now() / 1000); });
  document.fonts.load(`400 12px ${font}`, RAMP.join("") + TREES.join("") + SUN + MOON + STARS).then(() => {
    measure();
    fit();
    frame(0);
    view.observe(canvas);
    resize.observe(canvas);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  });
}
