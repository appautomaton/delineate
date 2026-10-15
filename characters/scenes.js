// The foot's four scenes, after the references kept locally: a misty gorge, a green valley with a winding path,
// sand dunes, and a rocky cove of turquoise water. Each is drawn as planes, far to near, for a frame 16 units wide
// and 9 high (Y runs down); a plane says, for a point, whether it is inside, of what material, how light (t, 0 dark
// to 1 light), and how far the haze has washed it toward the paper; g, if given, asks for lighter or darker grain
// than the tone. Each material has three tones, dark to light, by day and by night. The sun and the moon each have
// a place in the sky clear of the footer's words, and the air says what moves over the scene while it is shown.
//
// A real frame is always 9 units high, so every feature keeps its size, and as wide as its aspect makes it. across
// lays a scene on it: the scene's sides hold the frame's edges, losing their outer parts when the frame is narrow,
// and its middle takes the width left, squeezed or spread to fit. So a phone sees a narrow inlet between headlands
// and a wide screen a broad sea, and both see a cove. A plane is given the point as drawn (X) and, as p, the
// frame's own x there, how much the drawing is squeezed there (k), and a row's height (row): shapes that must stay
// round, and grain that must stay fine, are measured in the frame's own units.

import { perlin } from "./field.js";

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const n1 = (x, k) => perlin(x, k, 0.5); // a ragged line, about -0.5 to 0.5
const frac = (v) => v - Math.floor(v);
const hash = (i, j, k) => frac(Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453);

// What every scene's sky shares: the sun's gold by day; the moon and the stars by night.
const SKY = {
  day: { orb: ["#C9901C", "#E2AE2E", "#F4D371"], star: ["#C9901C", "#E2AE2E", "#F4D371"] },
  night: { orb: ["#9C9EB6", "#D5D2C6", "#F4F0E4"], star: ["#6E7395", "#A8AAC2", "#E8E4D8"] },
};
const inks = (day, night) => ({ day: { ...SKY.day, ...day }, night: { ...SKY.night, ...night } });

// How a scene lies across a frame W units wide. Its sides, left and right units deep as drawn, keep their size and
// lose their outer parts when there is not room for them; its middle takes what is left, never less than least of
// the frame. Returns where a point of the frame falls on the drawing (to), the way back (from), and the squeeze.
export function across({ sides: [left, right, least] }, W) {
  const middle = Math.max(W * least, W - left - right);
  const shown = left + right ? (W - middle) / (left + right) : 0; // the share of each side that shows
  const a = left * shown, b = W - right * shown, k = (16 - left - right) / middle;
  return {
    to: (x) => (x < a ? x - a + left : x > b ? x - b + 16 - right : left + (x - a) * k),
    from: (X) => (X < left ? X - left + a : X > 16 - right ? X - 16 + right + b : a + (X - left) / k),
    squeeze: (x) => (x < a || x > b ? 1 : k),
  };
}

// Clumps, of trees or of scrub, scattered on a jittered grid a pitch apart where density(X, Y) lets them stand:
// each round, lit on the side the light comes from and darker at its foot, with clusters of leaves across it. Where
// clumps overlap, the lower one, being nearer, is in front. The grid lies on the frame, so clumps stay round however
// the drawing is squeezed; where they may stand is asked of the drawing. Returns the tone, or -1 outside them all.
const LIGHT = [0.55, -0.83]; // the sun up and to the right
function clumps(X, Y, p, pitch, density, k, [lx, ly] = LIGHT) {
  const x = p.x, gx = Math.floor(x / pitch), gy = Math.floor(Y / pitch), wobble = 0.22 * perlin(x * 5.5, Y * 5.5, k);
  let t = -1, front = -Infinity;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
    const ix = gx + a, iy = gy + b;
    const cx = (ix + 0.1 + 0.8 * hash(ix, iy, k)) * pitch, cy = (iy + 0.1 + 0.8 * hash(iy, ix, k + 1)) * pitch;
    if (cy < front || hash(ix - 5, iy + 9, k + 3) > density(X + (cx - x) * p.k, cy)) continue;
    const r = pitch * (0.42 + 0.36 * hash(ix + 7, iy - 3, k + 2));
    const dx = (x - cx) / r, dy = ((Y - cy) * 1.15) / r, d = Math.hypot(dx, dy);
    if (d > 1 + wobble) continue;
    front = cy;
    t = 0.42 + 0.3 * (dx * lx + dy * ly) - 0.12 * d + 0.24 * perlin(x * 3.8, Y * 3.8, k + 4);
  }
  return t;
}

// Crowns placed by hand on the drawing, back to front, shaded as clumps are and round on the frame.
function crowns(X, Y, p, list, k, [lx, ly] = LIGHT) {
  for (let c = list.length - 1; c >= 0; c--) {
    const [cx, cy, r] = list[c];
    const dx = (X - cx) / (r * p.k), dy = ((Y - cy) * 1.12) / r;
    if (Math.abs(dx) > 1.4 || Math.abs(dy) > 1.4) continue;
    const d = Math.hypot(dx, dy) + 0.3 * perlin(p.x * 4.2, Y * 4.2, k + c);
    if (d >= 1) continue;
    return 0.4 + 0.32 * (dx * lx + dy * ly) - 0.1 * d + 0.26 * perlin(p.x * 3.4, Y * 3.4, k + 40);
  }
  return -1;
}

// Boulders: rounded lumps, lit on their tops and sunward sides, dark at their feet, each casting a shadow on the
// ground below it. Returns the stone's tone, or SHADOW where the ground lies in a boulder's shadow, or -1.
const SHADOW = -0.5;
function boulders(X, Y, p, list, k) {
  let shadow = false;
  for (const [cx, cy, rx, ry] of list) {
    const dx = (X - cx) / (rx * p.k), dy = (Y - cy) / ry;
    if (Math.abs(dx) > 1.6 || Math.abs(dy) > 1.8) continue;
    const d = dx * dx + dy * dy + 0.25 * perlin(p.x * 5, Y * 5, k);
    if (d < 1) return 0.55 - 0.62 * dy + 0.22 * dx + 0.15 * perlin(p.x * 7, Y * 7, k + 1);
    if (dy > 0.3 && (dx + 0.3) ** 2 + ((dy - 0.5) / 0.7) ** 2 < 1.3) shadow = true;
  }
  return shadow ? SHADOW : -1;
}

// Rock stands in columns: noise stretched tall and pushed hard toward light and dark, cracked between. Ledges cross
// them every so often: a dark seam with a lit lip above it.
const columns = (X, Y, k, f = 3.6) => clamp01(0.5 + 1.6 * perlin(X * f, Y * 0.22, k)) - (Math.abs(perlin(X * f * 0.8, Y * 0.18, k + 1)) < 0.05 ? 0.35 : 0);
const ledges = (X, Y, k, pitch = 1.6) => {
  const f = frac(Y * pitch + 0.5 * perlin(X * 0.8, Y * 0.3, k));
  return f < 0.12 ? -0.38 : f < 0.24 ? 0.16 : 0;
};

// The misty gorge: walls deep in the haze, the gorge's floor lost in mist, tall columned walls either side, and
// near slopes of grass and trees.
const gorge = {
  sides: [4.4, 4.7, 0.36],
  sun: [9.7, 1.65],
  moon: [5.8, 1.8],
  inks: inks(
    { rock: ["#6C5B77", "#B39F55", "#E4D690"], stone: ["#4E4A52", "#8E8A86", "#D4D0C6"], foliage: ["#1D4724", "#4D8735", "#B8CC5E"], grass: ["#5A8A2E", "#9DB846", "#DDE27C"], air: ["#B8B49A", "#CFCBB2", "#E4E1D0"] },
    { rock: ["#363C5E", "#646E94", "#A3ACCD"], stone: ["#262A40", "#4A5070", "#7E86A6"], foliage: ["#1A3034", "#365A54", "#7A9C8A"], grass: ["#28423C", "#4F6E62", "#8EA697"], air: ["#4A5374", "#6A7394", "#8C94B2"] },
  ),
  planes: [
    { // the farthest walls, at the gorge's end, nearly lost
      rise: 0.15,
      at(X, Y, p) {
        const left = X > 5.6 && X < 7.3 + 0.2 * n1(Y * 1.2, 23) && Y > 4.4 + 0.3 * n1(X * 2, 24);
        const right = X < 10.4 && X > 8.85 + 0.2 * n1(Y * 1.2, 25) && Y > 4.7 + 0.3 * n1(X * 2, 26);
        if (!left && !right) return null;
        return { m: "rock", t: 0.45 + 0.35 * columns(p.x, Y, 27, 5) + 0.3 * ledges(X, Y, 28, 2.2), haze: 0.68 + 0.2 * smooth(5, 8, Y) };
      },
    },
    { // the far walls, half lost in haze
      rise: 0.25,
      at(X, Y, p) {
        const left = X < 6.5 + 0.25 * n1(Y * 0.9, 3) && Y > 3.3 + 0.5 * n1(X * 1.3, 1) + 0.12 * X;
        const right = X > 9.7 + 0.25 * n1(Y * 0.9, 4) && Y > 3.8 + 0.5 * n1(X * 1.3, 2) - 0.05 * (X - 10);
        if (!left && !right) return null;
        const face = left ? smooth(5, 6.5, X) : 1 - smooth(9.7, 11.2, X);
        return { m: "rock", t: 0.22 + 0.45 * columns(p.x, Y, 9, 4.4) + 0.25 * face + ledges(X, Y, 29, 1.9), haze: 0.4 + 0.42 * smooth(4.5, 8.5, Y) };
      },
    },
    { // the gorge's floor, far below: crowns showing through the mist, the middle left to it
      rise: 0.3,
      at(X, Y, p) {
        if (Math.abs(X - 8) > 3.4 || Y < 7.2 + 0.35 * n1(X * 0.8, 5)) return null;
        const t = clumps(X, Y, p, 0.3, () => 0.75, 11);
        if (t < 0) return null;
        return { m: "foliage", t: t + 0.1, haze: 0.58 + 0.25 * (1 - Math.abs(X - 8) / 3.4) };
      },
    },
    { // the tall walls either side: columned rock, lit on the faces that turn to the gorge, ivy on the ledges
      rise: 0.5,
      at(X, Y, p) {
        const lt = 1.5 + 0.35 * n1(X * 1.6, 6) + 0.16 * Math.floor(X * 1.4) / 1.4;
        const rt = 1.9 + 0.35 * n1(X * 1.6, 7) + 0.14 * Math.floor((16 - X) * 1.4) / 1.4;
        const left = X < 4.4 + 0.3 * n1(Y * 1.1, 8) + 0.06 * Y && Y > lt;
        const right = X > 11.3 + 0.3 * n1(Y * 1.1, 9) - 0.06 * Y && Y > rt;
        if (!left && !right) return null;
        const face = left ? smooth(2.4, 4.4, X) : 1 - smooth(11.3, 13.6, X);
        const top = left ? lt : rt;
        // A green crown where the rock meets the sky, and ivy hanging from it down the face.
        const ivy = perlin(X * 2.6, Y * 1.1, 31) + 0.3 - 0.2 * (Y - top);
        if (Y < top + 0.3 + 0.2 * n1(X * 4, 10) || ivy > 0.3) {
          return { m: "foliage", t: 0.3 + 0.35 * perlin(X * 4, Y * 4, 12) + 0.3 * face - 0.3 * clamp01(ivy - 0.3), haze: 0.04 + 0.2 * smooth(5, 9, Y), tree: true };
        }
        return { m: "rock", t: 0.04 + 0.5 * columns(X, Y, 13) + 0.42 * face - 0.18 * smooth(5, 9, Y) + ledges(X, Y, 32), haze: 0.04 + 0.26 * smooth(6, 9, Y) };
      },
    },
    { // the near slopes: trees on their shoulders, a few boulders, grass falling to the foot
      rise: 0.95,
      at(X, Y, p) {
        const lshoulder = 6.0 + 2.7 * (X / 5.6) ** 2, rshoulder = 5.6 + 2.8 * ((16 - X) / 5.2) ** 2;
        const left = X < 6.4 && Y > lshoulder - 0.25 * n1(X * 2.4, 15);
        const right = X > 10 && Y > rshoulder - 0.25 * n1(X * 2.4, 16);
        const t = crowns(X, Y, p, X < 8 ? GORGE_LEFT : GORGE_RIGHT, 17);
        if (t >= 0) return { m: "foliage", t, haze: 0, tree: true };
        if (!left && !right) return null;
        const stone = boulders(X, Y, p, GORGE_STONES, 33);
        if (stone >= 0) return { m: "stone", t: stone, haze: 0 };
        // Grass: tufts of lighter blades and darker hollows, the slope darker as it turns from the sun.
        const shoulder = left ? lshoulder : rshoulder;
        const tufts = perlin(p.x * 3.2, Y * 5, 34), blades = perlin(p.x * 11, Y * 1.4, 18);
        return { m: "grass", t: 0.6 + 0.3 * tufts + 0.16 * blades - 0.2 * smooth(0.3, 2.2, Y - shoulder) * (left ? 1 : 0.4) - (stone === SHADOW ? 0.35 : 0), haze: 0 };
      },
    },
  ],
  // Mist drifting through the gorge's floor.
  air: {
    box: [4.8, 11.2, 4.6, 8.9],
    glyphs: ["·", "~"],
    alpha: 0.6,
    at(X, Y, t) {
      const v = perlin(X * 1.6 - t * 0.6, Y * 3, 21) + 0.35 * (1 - Math.abs(X - 8) / 3.2);
      return v < 0.42 ? 0 : Math.min(1, (v - 0.42) * 2.4);
    },
  },
};
// Crowns on the left slope, a stand of trees; on the right, one great tree.
const GORGE_LEFT = [[0.5, 5.5, 0.75], [1.6, 5.9, 0.7], [0.2, 6.6, 0.6], [2.6, 6.4, 0.6], [1.2, 6.9, 0.55], [3.5, 7.0, 0.5], [2.3, 7.4, 0.5], [4.2, 7.6, 0.42]];
const GORGE_RIGHT = [[15.4, 5.4, 0.8], [14.2, 5.0, 0.75], [13.0, 5.3, 0.7], [12.2, 6.0, 0.55], [13.6, 6.1, 0.65], [14.9, 6.4, 0.6], [11.6, 6.8, 0.42]];
const GORGE_STONES = [[12.0, 7.8, 0.44, 0.3], [12.8, 7.55, 0.3, 0.22], [14.5, 7.5, 0.38, 0.26], [15.5, 8.25, 0.44, 0.3], [2.5, 8.45, 0.36, 0.24]];

// The green valley: low far hills with the sun behind them, a peaked hill on the right, every ridge rimmed in
// light; a meadow on the valley's floor where a pale path winds toward the foot; banks of scrub either side.
const VALLEY_LIGHT = [-0.35, -0.94]; // the sun stands behind the valley, a little left: tops are lit, feet shaded
const valley = {
  sides: [3, 4.6, 0.45],
  sun: [7.2, 2.3],
  moon: [9.9, 1.9],
  inks: inks(
    { hill: ["#245F27", "#559A33", "#B6D457"], scrub: ["#123A1C", "#2B5E26", "#6E9A36"], rim: ["#C79516", "#E6BA28", "#F6DC70"], meadow: ["#4E8C2A", "#93C03E", "#DCE87A"], path: ["#A49C88", "#D6D0BE", "#F4F1E8"], air: ["#1E4A20", "#1E4A20", "#1E4A20"] },
    { hill: ["#1C3838", "#365C55", "#6C8E84"], scrub: ["#102226", "#203839", "#3E5B55"], rim: ["#7E86A8", "#A9B0CC", "#DCE0EE"], meadow: ["#284642", "#476B61", "#84A295"], path: ["#5A6080", "#8B90AC", "#C5C8D8"], air: ["#0E1424", "#0E1424", "#0E1424"] },
  ),
  planes: [
    { // the far hills at the valley's end, low and hazed, where the sun sits
      rise: 0.15,
      at(X, Y, p) {
        const top = 5.32 + 0.16 * Math.sin(X * 1.7 + 0.4) + 0.06 * n1(X * 2.5, 50);
        if (X < 3.5 || X > 11 || Y < top) return null;
        if (Y - top < 0.09) return { m: "rim", t: 0.8, haze: 0.3 };
        return { m: "hill", t: 0.62 + 0.2 * perlin(X * 2, Y * 3, 51) - 0.25 * smooth(0.1, 0.5, Y - top), haze: 0.4 };
      },
    },
    { // the left hill, falling from the edge of the sheet to the valley's floor, scrub massed low on its flank
      rise: 0.3,
      at(X, Y, p) {
        const top = 4.05 + 1.6 * smooth(0.4, 7.2, X) + 0.1 * n1(X * 1.6, 52);
        if (X > 7.6 || Y < top) return null;
        const below = Y - top;
        if (below < 0.12) return { m: "rim", t: 0.62 + 0.3 * perlin(X * 5, 0, 53), haze: 0.12 };
        const bush = clumps(X, Y, p, 0.3, (x, y) => 0.06 + 0.95 * smooth(0.45, 1.1, y - top) * smooth(6, 3.8, x) + 0.3 * perlin(x * 1.1, y * 1.5, 54), 55, VALLEY_LIGHT);
        if (bush >= 0) return { m: "scrub", t: bush, haze: 0.12, tree: true };
        return { m: "hill", t: 0.86 - 0.45 * smooth(0.1, 1.4, below) + 0.2 * perlin(p.x * 2.2, Y * 4, 56) + 0.1 * perlin(p.x * 9, Y * 2, 57), haze: 0.12 };
      },
    },
    { // the peaked hill on the right, lit on the flank that turns to the sun, shadowed past its crest
      rise: 0.35,
      at(X, Y, p) {
        const peak = 11.9;
        const top = (X < peak ? 3.95 + 1.85 * smooth(peak, 6.6, X) ** 0.9 : 3.95 + 0.6 * smooth(peak, 14.4, X) - 0.15 * smooth(14.4, 16, X)) + 0.07 * n1(X * 2.2, 58);
        if (X < 6.6 || Y < top) return null;
        const below = Y - top;
        if (below < (X < peak ? 0.13 : 0.07)) return { m: "rim", t: 0.72, haze: 0.08 };
        // Past the crest the hill turns from the sun: a shadow falls from the peak down its right flank.
        const shadow = smooth(-0.3, 0.4, X - peak - 0.35 * below);
        // A hedgerow of scrub runs slantwise across the flank, a few bushes stray above it.
        const band = (x, y) => Math.exp(-(((y - 5.2 - 0.32 * (x - 9)) / 0.32) ** 2));
        const bush = clumps(X, Y, p, 0.3, (x, y) => 0.05 + 0.85 * band(x, y) + 0.2 * perlin(x, y * 2, 59), 60, VALLEY_LIGHT);
        if (bush >= 0) return { m: "scrub", t: bush - 0.15 * shadow, haze: 0.08, tree: true };
        return { m: "hill", t: 0.84 - 0.4 * smooth(0.1, 1.8, below) - 0.4 * shadow + 0.2 * perlin(p.x * 2.4, Y * 4, 61) + 0.1 * perlin(p.x * 9, Y * 2, 62), haze: 0.08 };
      },
    },
    { // the valley's floor: a bright meadow, and the path winding through it, narrowing as it goes
      rise: 0.55,
      at(X, Y, p) {
        // The floor narrows into the distance: toward either side it meets the hills lower down.
        const top = 5.75 + 0.18 * n1(X * 0.9, 63) + 0.25 * smooth(8, 11, X) + 0.55 * Math.max(0, Math.abs(X - 7.8) - 2.3) ** 1.3;
        if (Y < top) return null;
        const far = smooth(7, 5.6, Y);
        const d = pathAt(X, Y, p.k);
        if (d < 1) return { m: "path", t: 0.62 + 0.3 * (1 - d) + 0.12 * perlin(p.x * 6, Y * 6, 64), haze: 0.25 * far };
        // The grass along the path is worn lighter; the meadow darkens toward the foot.
        return { m: "meadow", t: 0.74 + 0.16 * smooth(2.2, 1, d) + 0.18 * perlin(p.x * 3, Y * 5, 66) + 0.1 * perlin(p.x * 11, Y * 1.6, 67) - 0.3 * smooth(6.6, 9, Y), haze: 0.22 * far };
      },
    },
    { // the near banks, in the shade: scrub thick along their shoulders, dark grass falling to the foot
      rise: 0.95,
      at(X, Y, p) {
        const lt = 6.15 + 2.6 * (X / 6) ** 1.8 + 0.18 * n1(X * 1.8, 68);
        const rt = 5.45 + 3.4 * ((16 - X) / 6.6) ** 1.7 + 0.18 * n1(X * 1.8, 69);
        const left = X < 6.1 && Y > lt, right = X > 9.3 && Y > rt;
        if (!left && !right) return null;
        const top = left ? lt : rt;
        const bush = clumps(X, Y, p, 0.4, (x, y) => 0.2 + 0.75 * smooth(1.2, 0.2, Math.abs(y - (left ? lt : rt) - 0.6)) + 0.35 * perlin(x * 0.7, y, 70), 71, VALLEY_LIGHT);
        if (bush >= 0) return { m: "scrub", t: bush, haze: 0, tree: true };
        const tufts = perlin(p.x * 3, Y * 4.5, 72), blades = perlin(p.x * 11, Y * 1.4, 73);
        return { m: "meadow", t: 0.3 + 0.3 * tufts + 0.18 * blades + 0.3 * smooth(0.3, 0, Y - top), haze: 0 };
      },
    },
  ],
  // Cloud shadows: slow patches of shade drifting across the hills, their edges dithered.
  air: {
    box: [0, 16, 3.8, 9],
    shade: true,
    alpha: 0.2,
    at(X, Y, t, m) {
      if (m !== "hill" && m !== "meadow" && m !== "scrub" && m !== "rim" && m !== "path") return 0;
      const v = perlin(X * 0.3 - t * 0.05, Y * 0.7, 74) + 0.5 * perlin(X * 0.75 - t * 0.07, Y * 1.5, 75);
      return v < 0.14 ? 0 : Math.min(1, (v - 0.14) * 5);
    },
  },
};
// The path winds from the foot into the valley, its turns tightening and narrowing with distance as a path on
// the ground does seen from above it; returns the distance from its middle in half-widths. Where the valley is
// squeezed (by k) its turns are squeezed with it, but the path loses less of its width, so it stays a path.
function pathAt(X, Y, k) {
  const p = clamp01((Y - 5.5) / 3.5); // the ground's scale here: 0 at the horizon, 1 at the foot
  const middle = (p) => 7.55 + 2.3 * p * Math.sin(3.4 * (1 / (p + 0.12) - 1 / 1.12));
  // Where the path runs across the slope rather than up it, it is wider across the frame, so it never breaks.
  const run = (middle(p + 0.01) - middle(p - 0.01)) / 0.02 / 3.5 / k;
  const w = (0.03 + 0.24 * p ** 1.25) * k ** 0.6 * Math.hypot(1, run);
  return Math.abs(X - middle(p)) / w;
}

// The dunes: two great dunes rising to the sheet's edges, each a lit face and a shadowed slip face divided by its
// crest; small dunes far off between them; near sand combed by the wind into ripples.
const LEFT_CREST = (X) => (X < 1 ? 4.5 + 0.18 * (1 - X) : 4.5 + 1.45 * smooth(1, 8.2, X) ** 0.85);
const RIGHT_CREST = (X) => (X > 15.1 ? 4.38 + 0.22 * (X - 15.1) : 4.38 + 1.5 * smooth(15.1, 7.6, X) ** 0.85);
const dunes = {
  sides: [0, 0, 1],
  sun: [8.9, 2.5],
  moon: [6.4, 2.1],
  inks: inks(
    { sand: ["#B95E2A", "#E3975A", "#F9DCA8"], shade: ["#5E2A12", "#8C4524", "#B96E40"], air: ["#E8B783", "#F0CA9C", "#F8E0BE"] },
    { sand: ["#4C476C", "#7B749C", "#B9B0CE"], shade: ["#211E38", "#36325A", "#57527E"], air: ["#6E6990", "#8E89AE", "#B0AACA"] },
  ),
  planes: [
    { // the far dunes, small and hazed, each with its lit side and its shadow
      rise: 0.15,
      at(X, Y, p) {
        // Small dunes, each a sharp crest with its lit face to the left and its slip face to the right.
        const w = 1.25, c = Math.floor(X / w), x = X / w - c;
        const top = 5.78 - 0.2 * (x < 0.62 ? x / 0.62 : (1 - x) / 0.38) * (0.6 + 0.4 * hash(c, 0, 80));
        if (X < 3 || X > 13 || Y < top) return null;
        if (x > 0.62 - 0.6 * (Y - top)) return { m: "sand", t: 0.3, haze: 0.3 };
        return { m: "sand", t: 0.85 - 0.25 * smooth(0, 0.4, Y - top), haze: 0.3 };
      },
    },
    { // a middle dune on the right of the gap
      rise: 0.3,
      at(X, Y, p) {
        const crest = 10.9;
        const top = (X < crest ? 5.6 + 0.45 * smooth(crest, 8.6, X) : 5.6 + 0.5 * smooth(crest, 13.6, X)) + 0.03 * n1(X * 3, 81);
        if (X < 8.5 || X > 14 || Y < top) return null;
        const below = Y - top;
        if (X > crest - 0.7 * below + 0.12 * n1(Y * 3, 82)) return { m: "shade", t: 0.42 + 0.2 * perlin(X * 2, Y * 6, 83), haze: 0.2 };
        return { m: "sand", t: 0.68 + 0.3 * smooth(0.3, 0, below) - 0.3 * smooth(0.3, 1.1, below), haze: 0.2 };
      },
    },
    { // the great dune on the left: its crest falls from the edge toward the middle; the slip face lies outside
      rise: 0.5,
      at(X, Y, p) {
        const top = LEFT_CREST(X) + 0.02 * n1(X * 3, 84);
        if (X > 8.4 || Y < top) return null;
        const below = Y - top;
        const slip = X < 1 + 1.15 * (Y - 4.5) + 0.2 * n1(Y * 1.5, 85);
        if (slip) return { m: "shade", t: 0.26 + 0.2 * perlin(p.x * 1.5, Y * 4, 86) + 0.16 * smooth(1.2, 0, below) + 0.1 * Math.sin((Y * 7 - p.x * 1.2) * Math.PI), haze: 0.05 };
        // The lit face: blazing under the crest, settling darker down the slope, grained by the wind.
        return { m: "sand", t: 0.5 + 0.45 * smooth(0.35, 0, below) - 0.22 * smooth(0.5, 2, below) + 0.1 * perlin(p.x * 2.5, Y * 9, 87), haze: 0.05 };
      },
    },
    { // the great dune on the right, its slip face to the right
      rise: 0.55,
      at(X, Y, p) {
        const top = RIGHT_CREST(X) + 0.02 * n1(X * 3, 88);
        if (X < 7.4 || Y < top) return null;
        const below = Y - top;
        const slip = X > 15.1 - 1.2 * (Y - 4.38) + 0.2 * n1(Y * 1.5, 89);
        if (slip) return { m: "shade", t: 0.24 + 0.2 * perlin(p.x * 1.5, Y * 4, 90) + 0.16 * smooth(1.2, 0, below) + 0.1 * Math.sin((Y * 7 + p.x * 1.2) * Math.PI), haze: 0.04 };
        return { m: "sand", t: 0.52 + 0.45 * smooth(0.35, 0, below) - 0.24 * smooth(0.5, 2.2, below) + 0.1 * perlin(p.x * 2.5, Y * 9, 91), haze: 0.04 };
      },
    },
    { // the near sand: a broad swell, then ripples running along it, wider apart as they come near
      rise: 0.95,
      at(X, Y, p) {
        const top = 6.75 + 0.22 * Math.sin(X * 0.42 + 0.8) + 0.08 * n1(X * 0.9, 92);
        if (Y < top) return null;
        const below = Y - top;
        // The ripples follow the swell's line, bent gently by the wind, closer set far off and wider apart near.
        const bent = Math.max(0.02, below + (0.08 + 0.22 * smooth(0, 1.5, below)) * Math.sin(p.x * 1.5 + below * 1.6) + 0.1 * perlin(p.x * 0.7, below, 93));
        // Where rows are coarse for the frame, as on a phone, fewer ripples, so each keeps rows enough to read.
        const often = 5.4 * Math.min(1, 0.1 / p.row) ** 0.8;
        const f = frac(often * Math.sqrt(bent)), pitch = Math.sqrt(bent) / (often / 2);
        // Each is a lee in shadow, never thinner than a row and a bit so it reads as a line, then a lit crest, and
        // the windward slope brightening toward the next.
        const lee = Math.min(0.42, (1.3 * p.row) / pitch), ripples = smooth(0.3, 0.75, below);
        if (ripples > 0.5 && f < lee) return { m: "shade", t: 0.55, haze: 0 };
        const crest = ripples > 0.5 && f < lee + 0.14;
        return { m: "sand", t: crest ? 0.92 : 0.5 + 0.4 * smooth(0.4, 0, below) + 0.22 * ripples * f - 0.1 * smooth(7.5, 9, Y) + 0.06 * perlin(p.x * 2, Y * 2, 95), haze: 0 };
      },
    },
  ],
  // Sand blown off the crests of the great dunes, streaming away on the wind.
  air: {
    box: [0, 16, 4.0, 6.4],
    glyphs: ["·", ":"],
    alpha: 0.55,
    at(X, Y, t) {
      const above = Math.min(Math.abs(Y - LEFT_CREST(X) + 0.12), Math.abs(Y - RIGHT_CREST(X) + 0.12));
      if (above > 0.28) return 0;
      const v = perlin(X * 2.2 + t * 0.9, Y * 7, 96) + 0.25 - above * 1.6;
      return v < 0.2 ? 0 : Math.min(1, (v - 0.2) * 2.5);
    },
  },
};

// The cove: limestone headlands with pines along their tops, a turquoise sea between them, deep at the horizon
// and pale in the shallows, a line of foam, a beach, and scrub and stones at the near corners.
const SHORE = (X) => 8.15 - 0.6 * ((X - 8) / 8) ** 2 + 0.06 * n1(X * 1.2, 100);
const COVE_LIGHT = [-0.5, -0.86]; // the sun stands high on the right; faces turned left fall into shadow
const cove = {
  sides: [3, 2.6, 0.45],
  sun: [10.2, 1.95],
  moon: [6.2, 2.15],
  inks: inks(
    { stone: ["#55524C", "#A8A497", "#EEEBE0"], pine: ["#1E381A", "#3F6226", "#87A03E"], water: ["#0C6371", "#1C9AA0", "#7AD3C9"], foam: ["#A8D6CF", "#D6EEE8", "#FFFFFF"], sand: ["#B5A077", "#DCCDA4", "#F3ECD6"], scrub: ["#2E4D1C", "#5E8230", "#AEC262"], air: ["#FFFFFF", "#FFFFFF", "#FFFFFF"] },
    { stone: ["#2E3452", "#646C8E", "#A9AFCA"], pine: ["#142428", "#273C3C", "#4C645E"], water: ["#0F2A44", "#1C4A68", "#4A84A0"], foam: ["#6F8FA8", "#A5BDCF", "#DCE6EE"], sand: ["#454962", "#727692", "#A9ACC2"], scrub: ["#1A2E2E", "#334D47", "#5F7E77"], air: ["#E8E6F0", "#E8E6F0", "#E8E6F0"] },
  ),
  planes: [
    { // the sea, from the horizon to the shore: deep far off, pale in the shallows, rocks dark under the water
      rise: 0.2,
      at(X, Y, p) {
        const shore = SHORE(X);
        if (Y < 5.62 || Y > shore) return null;
        if (shore - Y < 0.07 + 0.05 * perlin(X * 4, 0, 101)) return { m: "foam", t: 0.85, haze: 0 };
        const shallow = smooth(6.4, shore, Y);
        const rocks = perlin(X * 1.4, Y * 3, 102) - 0.2 + 0.25 * smooth(3.5, 0.5, Math.min(X, 16 - X)) + 0.1 * smooth(7, 8, Y);
        // The swell, in long low streaks, finer toward the horizon.
        const swell = perlin(p.x * 0.9, Y * (9 + 6 * smooth(8, 5.6, Y)), 103);
        const t = 0.2 + 0.62 * shallow + 0.3 * swell - (rocks > 0 ? 0.4 * clamp01(rocks * 4) : 0);
        return { m: "water", t, g: 0.45 + 0.5 * t, haze: 0.16 * smooth(6.2, 5.62, Y) };
      },
    },
    { // the beach, between the foam and the foot, wet and darker by the water, stones fallen on it
      rise: 0.45,
      at(X, Y, p) {
        const shore = SHORE(X);
        if (Y < shore) return null;
        const stone = boulders(X, Y, p, COVE_STONES, 118);
        if (stone >= 0) return { m: "stone", t: stone + 0.15, haze: 0 };
        return { m: "sand", t: 0.7 - 0.25 * smooth(0.25, 0, Y - shore) + 0.15 * perlin(p.x * 3, Y * 5, 104) + 0.1 * perlin(p.x * 9, Y * 9, 105) - (stone === SHADOW ? 0.35 : 0), haze: 0 };
      },
    },
    { // the headlands, left and right: pale limestone in blocks, cleft dark, pines along their tops
      rise: 0.5,
      at(X, Y, p) {
        const lt = 3.75 + 1.9 * smooth(0, 6.0, X) ** 1.1 + 0.12 * n1(X * 2.5, 106);
        const rt = 3.98 + 1.66 * smooth(16, 10.9, X) ** 1.15 + 0.12 * n1(X * 2.5, 107);
        const lb = 5.7 + 1.5 * smooth(5.8, 0, X) + 0.08 * n1(X * 2, 108);
        const rb = 5.7 + 1.9 * smooth(10.9, 16, X) + 0.08 * n1(X * 2, 109);
        const left = X < 6.2 && Y > lt && Y < lb, right = X > 10.6 && Y > rt && Y < rb;
        if (!left && !right) return null;
        const top = left ? lt : rt, base = left ? lb : rb;
        const pine = clumps(X, Y, p, 0.26, (x, y) => 0.9 - 1.6 * (y - (left ? lt : rt)) + 0.5 * perlin(x * 1.2, y, 110), 111, COVE_LIGHT);
        if (pine >= 0) return { m: "pine", t: pine, haze: 0.05, tree: true };
        const scrub = clumps(X, Y, p, 0.18, (x, y) => 0.6 * perlin(x * 0.9, y * 1.4, 112) - 0.05, 113, COVE_LIGHT);
        if (scrub >= 0) return { m: "pine", t: scrub + 0.15, haze: 0.05 };
        // The stone: blocks lit on their tops and sunward sides, their undersides and the clefts between them dark,
        // and darkest where the sea has cut under the cliff.
        const x = p.x, bx = x * 2.2, by = Y * 3.6 + 0.5 * perlin(x * 0.8, Y, 114);
        const fy = frac(by + 0.3 * perlin(bx, 0, 115));
        const block = perlin(x * 2.6, Y * 3.2, 116);
        const cleft = Math.abs(perlin(x * 2.2, Y * 3.8, 117)) < 0.04 || (fy > 0.86 && perlin(x * 2.4, Y * 1.5, 120) > -0.05);
        const lit = (left ? 0.12 : -0.1) + 0.22 * smooth(0.3, 0, fy);
        return { m: "stone", t: 0.6 + 0.6 * block + lit - (cleft ? 0.5 : 0) - 0.55 * smooth(0.3, 0, base - Y), haze: 0.05 };
      },
    },
    { // the near corners: scrub
      rise: 0.95,
      at(X, Y, p) {
        const t = crowns(X, Y, p, X < 8 ? COVE_LEFT : COVE_RIGHT, 119, COVE_LIGHT);
        if (t >= 0) return { m: "scrub", t, haze: 0, tree: true };
        return null;
      },
    },
  ],
  // The sea glints: sparks that come and go, gathered on the path the sun or the moon lays on the water.
  air: {
    box: [2, 14, 5.6, 8.4],
    glyphs: ["·", "+"],
    alpha: 0.9,
    at(X, Y, t, m, orb) {
      if (m !== "water") return 0;
      const path = Math.exp(-(((X - orb[0]) / (0.25 + 0.35 * (Y - 5.6))) ** 2));
      const s = frac(Math.sin(X * 91.7 + Y * 47.3 + Math.floor(t * 3 + frac(X * 13.1 + Y * 7.7) * 3) * 12.9) * 43758.5);
      const v = s - (1 - 0.03 - 0.3 * path);
      return v <= 0 ? 0 : Math.min(1, v * 8);
    },
  },
};
const COVE_LEFT = [[0.3, 7.6, 0.65], [1.2, 8.3, 0.6], [0.2, 8.8, 0.55], [2.0, 8.9, 0.45]];
const COVE_RIGHT = [[15.6, 7.3, 0.65], [14.6, 7.7, 0.6], [15.4, 8.4, 0.55], [13.8, 8.6, 0.42]];
const COVE_STONES = [[2.4, 7.85, 0.5, 0.32], [3.35, 8.25, 0.36, 0.24], [12.5, 8.35, 0.44, 0.28], [13.45, 7.95, 0.36, 0.24], [11.5, 8.75, 0.28, 0.18], [4.7, 8.8, 0.26, 0.16]];

export const SCENES = [gorge, valley, dunes, cove];
