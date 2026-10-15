// Characters: a picture made of letters. A slow, flowing noise is cut at a level, and the shapes
// above it are written in type: ring by ring from each shape's edge inward, one cell apart, the word
// is spelled letter by letter, and deeper in, the face's own glyphs grow, a ring each (Nerd Fonts
// carry leaves, flowers, moons, and stars beside their letters). Around each shape a faint ground of points shows where it will
// spread. It steps a dozen frames a second, like film, only while it is on screen and someone is
// there; with less motion asked for, it holds one frame.
//
//   import { mount } from "./characters/field.js";
//   const field = mount(canvas, { word: "d3lin3at3", bloom: "garden", clear: [heading], cell: 16 });
//   field.bloom("moon");
//
// The canvas fills its parent. Colors come from the canvas's CSS: --ink for the letters, --leaf for
// what grows at the heart; they are read again whenever the root's theme changes.

const BLOOMS = {
  // Shallow to deep, by the names in the Nerd Fonts' glyphnames.json.
  garden: ["\u{F0E66}", "\u{F032A}", "\u{F0816}", "\u{F09F1}", "\u{F024A}", "\u{F0D08}"], // sprout, leaf, clover, tulip, flower, poppy
  moon: ["\u{E3CA}", "\u{E3CE}", "\u{E3D1}", "\u{E3D5}"], // the waxing moon, crescent to full
  stars: ["\u{F444}", "\u{F09DF}", "\u{F06C4}", "\u{F0AE2}", "\u{E370}"], // a dot, a small circle, an asterisk, a four-pointed star, stars
};
const GROUND = "·";
const FPS = 12;
const REST = 20000; // ms without input before the field holds still
const FEATURE = 26; // cells: the size of the field's features, counted in cells as the rings are, so a shape is deep enough for its heart on any screen
const HALO = 0.18; // how far below the cut the ground of points reaches, as a share of the field's range

// The distance from each inside cell to the nearest outside one, in pixels, exactly (Felzenszwalb and
// Huttenlocher's transform, by columns then rows), so every ring follows the shape's own contour.
function distances(inside, cols, rows, cw, ch) {
  const d = Float64Array.from(inside, (v) => (v ? 1e20 : 0));
  const line = (n, at, s) => {
    const f = Float64Array.from({ length: n }, (_, q) => d[at(q)]), v = new Int32Array(n), z = new Float64Array(n + 1);
    let k = 0;
    z[0] = -Infinity; z[1] = Infinity;
    for (let q = 1; q < n; q++) {
      let x;
      while ((x = (f[q] + (q * s) ** 2 - (f[v[k]] + (v[k] * s) ** 2)) / (2 * s * (q - v[k]))) <= z[k]) k--;
      v[++k] = q; z[k] = x; z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q * s) k++;
      d[at(q)] = ((q - v[k]) * s) ** 2 + f[v[k]];
    }
  };
  for (let i = 0; i < cols; i++) line(rows, (q) => q * cols + i, ch);
  for (let j = 0; j < rows; j++) line(cols, (q) => j * cols + q, cw);
  return d.map(Math.sqrt);
}

// Improved Perlin noise in three dimensions, from a seeded permutation, so every visit flows alike.
const PERM = (() => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = 20261014;
  for (let i = 255; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return Uint8Array.from([...p, ...p]);
})();
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
function grad(h, x, y, z) {
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return (h & 1 ? -u : u) + (h & 2 ? -v : v);
}
function perlin(x, y, z) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z);
  const A = PERM[X] + Y, AA = PERM[A] + Z, AB = PERM[A + 1] + Z, B = PERM[X + 1] + Y, BA = PERM[B] + Z, BB = PERM[B + 1] + Z;
  return lerp(
    lerp(lerp(grad(PERM[AA], x, y, z), grad(PERM[BA], x - 1, y, z), u), lerp(grad(PERM[AB], x, y - 1, z), grad(PERM[BB], x - 1, y - 1, z), u), v),
    lerp(lerp(grad(PERM[AA + 1], x, y, z - 1), grad(PERM[BA + 1], x - 1, y, z - 1), u), lerp(grad(PERM[AB + 1], x, y - 1, z - 1), grad(PERM[BB + 1], x - 1, y - 1, z - 1), u), v),
    w,
  );
}
// The field at a point (in units of SCALE) and a moment: two octaves, the domain warped so the shapes flow.
function field(x, y, t) {
  const wx = x + 0.8 * perlin(x * 0.6, y * 0.6, t * 0.5 + 10);
  const wy = y + 0.8 * perlin(x * 0.6 + 31, y * 0.6, t * 0.5 + 20);
  return 0.72 * perlin(wx, wy, t) + 0.28 * perlin(wx * 2.1, wy * 2.1, t * 1.4 + 5);
}

export function mount(canvas, { word = "d3lin3at3", bloom = "garden", font = '"VictorMono NF Obl"', cover = 0.5, clear = [], cell, gather = 0 } = {}) {
  const g = canvas.getContext("2d");
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  let set = BLOOMS[bloom] ?? BLOOMS.garden;
  let cols = 0, rows = 0, cw = 0, ch = 0, dpr = 1, size = 0;
  let atlas = null, tiles = new Map(), clearance = new Float32Array(0);
  let scale = 200; // px: the size of the field's features on this screen
  let seen = false, stirred = performance.now(), last = 0, frame = 0;

  // Each glyph drawn once, in its color, into a strip the frame copies from.
  function paintAtlas() {
    const css = getComputedStyle(canvas);
    const ink = css.getPropertyValue("--ink").trim() || "#1B1B19";
    const leaf = css.getPropertyValue("--leaf").trim() || ink;
    const glyphs = [...new Set(word), GROUND, ...Object.values(BLOOMS).flat()];
    const tw = Math.ceil(cw * dpr * 1.6), th = Math.ceil(ch * dpr);
    atlas = new OffscreenCanvas(tw * glyphs.length, th);
    const a = atlas.getContext("2d");
    a.textAlign = "center";
    a.textBaseline = "middle";
    tiles = new Map();
    glyphs.forEach((glyph, i) => {
      const heart = !word.includes(glyph) && glyph !== GROUND;
      a.font = `400 ${size * dpr * (heart ? 0.86 : 1)}px ${font}`;
      a.fillStyle = heart ? leaf : ink;
      a.fillText(glyph, tw * i + tw / 2, th / 2);
      tiles.set(glyph, [tw * i, tw, th]);
    });
  }

  // Where words lie over the field, the field sinks, so the shapes part round them: in an ellipse
  // about each block of words, so the rings that skirt it curve, never run straight along a box.
  function measureClearance() {
    clearance = new Float32Array(cols * rows);
    const box = canvas.getBoundingClientRect();
    for (const el of clear) {
      const r = el.getBoundingClientRect();
      const cx = (r.left + r.right) / 2 - box.left, cy = (r.top + r.bottom) / 2 - box.top;
      const rx = r.width / Math.SQRT2 + 2 * cw, ry = r.height / Math.SQRT2 + 2 * ch;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const e = Math.hypot(((i + 0.5) * cw - cx) / rx, ((j + 0.5) * ch - cy) / ry);
        if (e < 1.6) clearance[j * cols + i] = Math.max(clearance[j * cols + i], e < 1 ? 1 : 1 - (e - 1) / 0.6);
      }
    }
  }

  function fit() {
    const box = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    size = cell ?? (box.width < 600 ? 13 : 16);
    // Cells near square, so a ring reads the same whichever way the shape's edge runs.
    cw = size * 0.92;
    ch = size * 1.08;
    cols = Math.ceil(box.width / cw);
    rows = Math.ceil(box.height / ch);
    scale = FEATURE * (cw + ch) / 2;
    paintAtlas();
    measureClearance();
    draw(frame);
  }

  function draw(t) {
    if (!atlas) return;
    const n = cols * rows, values = new Float32Array(n);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      // With gather, the field rises toward the middle, so a shape gathers there and lets go toward the edges.
      const r = Math.hypot((i + 0.5) / cols - 0.5, (j + 0.5) / rows - 0.5) * 2;
      values[k] = field(((i + 0.5) * cw) / scale, ((j + 0.5) * ch) / scale, t) - 2 * clearance[k] + gather * (1 - r * r);
    }
    // The cut is taken from the field itself, so the shapes always cover about the same share of the frame.
    const sorted = Float32Array.from(values).sort();
    const cut = sorted[Math.floor(n * (1 - cover))], range = Math.max(1e-6, sorted[Math.floor(n * 0.985)] - cut);
    // Rings a cell apart: the distance from the shape's edge, in cells.
    const depth = distances(Uint8Array.from(values, (v) => (v >= cut ? 1 : 0)), cols, rows, cw, ch), pitch = (cw + ch) / 2;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    for (let k = 0; k < n; k++) {
      const v = values[k], i = k % cols, j = (k / cols) | 0;
      let glyph, alpha;
      if (v < cut) {
        // The ground: faint points just outside each shape, fading with the distance below the cut.
        const below = (cut - v) / range;
        if (below > HALO) continue;
        glyph = GROUND;
        alpha = 0.22 * (1 - below / HALO);
      } else {
        // From the edge inward, a ring a cell: the word's letters, rim to heart, lightest first; then
        // what grows there, a ring each, the last holding the heart.
        const ring = Math.floor(depth[k] / pitch - 0.5);
        if (ring < word.length) {
          glyph = word[Math.max(0, ring)];
          alpha = 0.3 + 0.7 * (Math.max(0, ring) / Math.max(1, word.length - 1));
        } else {
          // Planted, not paved: past the first ring of the heart, every other cell, staggered as a bed is
          // set out, so the paper shows between them.
          if (ring > word.length && (i + j) % 2) continue;
          glyph = set[Math.min(set.length - 1, ring - word.length)];
          alpha = 0.85;
        }
      }
      const [sx, tw, th] = tiles.get(glyph);
      g.globalAlpha = alpha;
      g.drawImage(atlas, sx, 0, tw, th, (i * cw + cw / 2) * dpr - tw / 2, j * ch * dpr, tw, th);
    }
    g.globalAlpha = 1;
  }

  function tick(now) {
    if (!seen) return;
    requestAnimationFrame(tick);
    if (now - last < 1000 / FPS || now - stirred > REST) return;
    last = now;
    frame = now / 7000;
    draw(frame);
  }
  const wake = () => (stirred = performance.now());
  for (const type of ["pointermove", "scroll", "keydown", "touchstart", "wheel"]) addEventListener(type, wake, { passive: true });

  const view = new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    if (seen && !calm.matches) requestAnimationFrame(tick);
  });
  const resize = new ResizeObserver(() => fit());
  // The letters take the page's light: read the colors again when the root's theme changes.
  const theme = new MutationObserver(() => { paintAtlas(); draw(frame); });

  const font16 = `400 16px ${font}`;
  document.fonts.load(font16, word + set.join("")).then(() => {
    fit();
    view.observe(canvas);
    resize.observe(canvas.parentElement);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
  });

  return {
    bloom(name) {
      set = BLOOMS[name] ?? set;
      draw(frame);
    },
    destroy() {
      view.disconnect();
      resize.disconnect();
      theme.disconnect();
      for (const type of ["pointermove", "scroll", "keydown", "touchstart", "wheel"]) removeEventListener(type, wake);
      seen = false;
    },
  };
}
