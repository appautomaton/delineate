// The drawings the hands make on the page, in the Footers' crayon. Each drawing is split by the hand that draws
// it: every crayon hand's strands are gathered in a <g data-hand>, so on the page one pointer takes one group and
// follows its strands in the order and at the times the crayon laid them.
//
// Colours are crayon names (class="k-<name>"); the page says what each one is.

import { Hand } from "../footers/crayon/hand.ts";
import { Sheet, bud, circle, coloured, leaf, petal, poppy, stem, tulip } from "../footers/crayon/shapes.ts";
import { catmull, type Pt } from "../footers/lib/geometry.ts";
import { Random } from "../footers/lib/random.ts";

type Script = (h: Hand, s: Sheet) => string[];

// One drawing: each script is one crayon hand, drawn into its own group.
function drawing(id: string, viewBox: string, seed: number, scripts: Script[], attrs = ""): string {
  const sheet = new Sheet(`${id}-`);
  const rng = new Random(seed);
  const groups = scripts.map((script, i) => `<g data-hand="${i}">${script(new Hand(rng.randrange(10 ** 6), 0), sheet).join("\n")}</g>`);
  return `<svg class="wax" viewBox="${viewBox}" ${attrs} data-build="draw" aria-hidden="true"><defs>${sheet.defs()}</defs>${groups.join("\n")}</svg>`;
}

// ——— The still life ———
//
// A glass vase of flowers on a table, on a 900 × 1000 sheet. The vase's mouth is at (450, 600) and its water at
// y = 730; every stem rises out of the mouth to its head, and below the water it shows through the glass, paler
// and set a little aside, as water bends what lies in it.

const MOUTH_Y = 606;
const WATER_Y = 730;

// A stem from inside the vase to a head: under water, seen through the glass and shifted; above, in the open.
function vaseStem(h: Hand, head: Pt, mouthX: number, width = 6, colour = "green"): string {
  const [hx, hy] = head;
  const spread = mouthX - 450;
  const under = stem(h, [[450 + spread * 2.2, 930], [450 + spread * 1.6 + 9, 820], [450 + spread * 1.2 + 9, WATER_Y + 4]], "sage", width * 0.8);
  const bow = (hx - mouthX) * 0.18;
  const above = stem(h, [[450 + spread * 1.2, WATER_Y], [mouthX, MOUTH_Y], [(mouthX + hx) / 2 - bow, (MOUTH_Y + hy) / 2], [hx, hy + 6]], colour, width);
  return under + "\n" + above;
}

// An aster: narrow petals all round, each coloured and outlined, about a wound centre.
function aster(s: Sheet, h: Hand, cx: number, cy: number, r: number, fill: string, edge: string): string {
  const out: string[] = [];
  const n = 14;
  for (let k = 0; k < n; k++) {
    const ang = (k * 2 * Math.PI) / n + h.rng.uniform(-0.07, 0.07);
    out.push(coloured(s, h, petal(h.rng, cx, cy, ang, r * h.rng.uniform(0.9, 1.05), r * 0.27, 0.24), fill, { edge, edgeWidth: 2, stagger: 0.035 }));
  }
  h.spiral(cx, cy, r * 0.24, "ochre", { turns: 4, width: 6, n: 4, secs: 0.2, weight: [1.6, 2.6] });
  out.push(h.take());
  return out.join("\n");
}

// A daisy, white on white paper: only its petals' outlines in graphite, round a yellow eye.
function daisy(h: Hand, cx: number, cy: number, r: number): string {
  const n = 16;
  for (let k = 0; k < n; k++) {
    const ang = (k * 2 * Math.PI) / n + h.rng.uniform(-0.06, 0.06);
    h.line(petal(h.rng, cx, cy, ang, r, r * 0.24, 0.26), "graphite", { closed: true, width: 2, n: 2, secs: 0.05, weight: [1, 1.6], alpha: [0.5, 0.8] });
  }
  h.spiral(cx, cy, r * 0.22, "ochre", { turns: 5, width: 7, n: 5, secs: 0.22, weight: [1.8, 2.8] });
  return h.take();
}

// A spike of lavender: a stem, then florets laid down it from the tip, alternating sides, larger as they go.
function lavender(h: Hand, top: Pt, mouthX: number): string {
  const st = vaseStem(h, top, mouthX, 4, "olive");
  const [tx, ty] = top;
  const dx = (mouthX - tx) / Math.hypot(mouthX - tx, MOUTH_Y - ty);
  const dy = (MOUTH_Y - ty) / Math.hypot(mouthX - tx, MOUTH_Y - ty);
  for (let i = 0; i < 16; i++) {
    const t = i * 10;
    const [px, py] = [tx + dx * t, ty + dy * t];
    const side = i % 2 ? 1 : -1;
    const size = 6 + i * 0.45;
    h.stroke([[px, py], [px - dy * side * size + dx * 2, py + dx * side * size - size * 0.6]], i % 3 ? "violet" : "lilac", {
      width: 5, n: 3, secs: 0.035, weight: [1.6, 2.8], alpha: [0.6, 0.95],
    });
  }
  return st + "\n" + h.take();
}

// A fern frond along `pts`: the rachis, then leaflets in pairs, shorter toward the tip, each swept forward.
function fern(h: Hand, pts: readonly Pt[], colour = "green"): string {
  const spine = catmull(pts, 10);
  h.stroke(spine, colour, { width: 4, n: 3, secs: 0.4, weight: [1.4, 2.2] });
  for (let i = 2; i < spine.length - 1; i += 2) {
    const [px, py] = spine[i];
    const tx = spine[i + 1][0] - spine[i - 1][0];
    const ty = spine[i + 1][1] - spine[i - 1][1];
    const tl = Math.hypot(tx, ty) || 1;
    const [ux, uy] = [tx / tl, ty / tl];
    const len = 6 + 30 * (1 - i / spine.length);
    for (const side of [-1, 1]) {
      const end: Pt = [px + (-uy * side * 0.9 + ux * 0.45) * len, py + (ux * side * 0.9 + uy * 0.45) * len];
      const mid: Pt = [(px + end[0]) / 2 + ux * len * 0.12, (py + end[1]) / 2 + uy * len * 0.12];
      h.stroke([[px, py], mid, end], i % 4 ? colour : "olive", { width: 3, n: 2, secs: 0.025, weight: [1.2, 2], alpha: [0.55, 0.9] });
    }
  }
  return h.take();
}

// A sprig of berries hanging from a twig, each berry wound round in a few turns.
function berries(h: Hand, mouthX: number, tip: Pt): string {
  const twig = vaseStem(h, tip, mouthX, 3, "rust");
  const [tx, ty] = tip;
  const spots: Pt[] = [[tx - 6, ty + 26], [tx + 16, ty + 34], [tx - 22, ty + 44], [tx + 2, ty + 56], [tx + 24, ty + 62], [tx - 14, ty + 72], [tx + 10, ty + 86]];
  for (const [x, y] of spots) {
    h.stroke([[tx + (x - tx) * 0.2, ty + 4], [x, y - 7]], "rust", { width: 2, n: 2, secs: 0.03, weight: [1, 1.5] });
    h.spiral(x, y, 7.5, "red", { turns: 2.6, width: 5, n: 3, secs: 0.07, weight: [1.6, 2.6] });
  }
  return twig + "\n" + h.take();
}

// A butterfly at rest, wings open: forewings and hindwings coloured and outlined, a body, two antennae.
function butterfly(s: Sheet, h: Hand, bx: number, by: number): string {
  const wing = (ang: number, len: number, wid: number) => petal(h.rng, bx, by, ang, len, wid, 0.06);
  const parts = [
    coloured(s, h, wing(-2.45, 54, 42), "ochre", { edge: "maroon", edgeWidth: 3, shade: "rust", shadeAt: [bx - 34, by - 30, 15] }),
    coloured(s, h, wing(-0.69, 54, 42), "ochre", { edge: "maroon", edgeWidth: 3, shade: "rust", shadeAt: [bx + 34, by - 30, 15] }),
    coloured(s, h, wing(2.35, 36, 28), "rust", { edge: "maroon", edgeWidth: 3 }),
    coloured(s, h, wing(0.79, 36, 28), "rust", { edge: "maroon", edgeWidth: 3 }),
  ];
  h.stroke([[bx, by - 14], [bx + 1, by + 4], [bx, by + 24]], "graphite", { width: 5, n: 3, secs: 0.12, weight: [1.8, 2.8] });
  h.stroke([[bx - 1, by - 13], [bx - 9, by - 32], [bx - 16, by - 36]], "graphite", { width: 2, n: 2, secs: 0.06, weight: [0.9, 1.4] });
  h.stroke([[bx + 1, by - 13], [bx + 8, by - 32], [bx + 15, by - 37]], "graphite", { width: 2, n: 2, secs: 0.06, weight: [0.9, 1.4] });
  return parts.join("\n") + "\n" + h.take();
}

// The glass: a bulb on a narrow neck, filled pale, its water line and a couple of reflections, its lip an oval.
function vase(s: Sheet, h: Hand): string {
  const glass: Pt[] = [
    [380, 600], [450, 594], [520, 600], [502, 640], [494, 668], [562, 722], [612, 800], [622, 862], [592, 922], [540, 956],
    [450, 964], [360, 956], [308, 922], [278, 862], [288, 800], [338, 722], [406, 668], [398, 640],
  ];
  // Glass is shaded along its curve, not in a patch: a few strokes inside the far side, following the bulb round.
  const body = coloured(s, h, glass, "cloud", { edge: "mist", edgeWidth: 3, angle: 72 });
  h.stroke([[566, 760], [598, 812], [604, 866], [582, 914], [548, 944]], "mist", { width: 9, n: 5, secs: 0.3, alpha: [0.25, 0.5], weight: [1.4, 2.4] });
  h.stroke([[338, WATER_Y], [400, WATER_Y - 5], [460, WATER_Y + 3], [520, WATER_Y - 4], [562, WATER_Y + 1]], "mist", { width: 4, n: 3, secs: 0.3, weight: [1.2, 2] });
  h.stroke([[318, 792], [306, 858], [318, 912]], "mist", { width: 5, n: 3, secs: 0.2, alpha: [0.4, 0.7] });
  h.stroke([[338, 772], [330, 812]], "mist", { width: 3, n: 2, secs: 0.08, alpha: [0.4, 0.7] });
  h.line(circle(450, 598, 1, 18).map(([x, y]): Pt => [450 + (x - 450) * 70, 598 + (y - 598) * 8]), "mist", { closed: true, width: 3, n: 2, secs: 0.2 });
  return body + "\n" + h.take();
}

// The opening picture: the still life, each flower, spray and creature drawn by a hand of its own. Groups are laid
// back to front, so the glass, last, lies over the stems it holds.
export function bouquet(): string {
  return drawing("sl", "0 0 900 1000", 21, [
    (h) => [lavender(h, [372, 46], 440)],
    (h) => [lavender(h, [536, 70], 458)],
    (h) => [lavender(h, [748, 196], 470)],
    (h) => [fern(h, [[430, 612], [300, 600], [170, 650], [90, 760]])],
    (h) => [fern(h, [[472, 612], [610, 590], [760, 630], [846, 730]])],
    (h) => [berries(h, 474, [788, 452])],
    (h) => [daisy(h, 288, 128, 46), vaseStem(h, [288, 150], 436, 4)],
    (h, s) => [vaseStem(h, [118, 336], 422, 4), bud(s, h, 118, 322, 26, "pink", "maroon", -0.6)],
    (h, s) => [vaseStem(h, [830, 300], 478, 4), bud(s, h, 830, 288, 24, "ochre", "maroon", 0.5)],
    (h, s) => [vaseStem(h, [214, 300], 426), poppy(s, h, 214, 300, 92, "blue", "deep", "deep", { n: 7, tilt: 0.15 })],
    (h, s) => [vaseStem(h, [606, 176], 464, 5), tulip(s, h, 606, 176, 48, "red", "maroon", "maroon")],
    (h, s) => [vaseStem(h, [690, 380], 476), poppy(s, h, 690, 380, 88, "pink", "red", "maroon", { tilt: 0.25 })],
    (h, s) => [vaseStem(h, [320, 516], 434, 5), tulip(s, h, 320, 516, 52, "ochre", "red", "deep")],
    (h, s) => [vaseStem(h, [130, 522], 420, 4), aster(s, h, 130, 522, 44, "lilac", "violet")],
    (h, s) => [vaseStem(h, [772, 560], 480, 4), aster(s, h, 772, 560, 40, "lilac", "violet")],
    (h, s) => [vaseStem(h, [560, 556], 462, 4), aster(s, h, 560, 556, 34, "pink", "maroon")],
    (h, s) => [vaseStem(h, [450, 330], 450, 8), poppy(s, h, 450, 330, 124, "red", "maroon", "maroon")],
    (h, s) => [butterfly(s, h, 792, 96)],
    (h, s) => [
      leaf(s, h, [432, 610], -2.55, 170, 48),
      leaf(s, h, [468, 612], -0.58, 160, 46, { fill: "olive", second: "green" }),
      leaf(s, h, [452, 612], -1.95, 128, 38),
    ],
    (h, s) => [vase(s, h)],
    (h, s) => {
      h.stroke([[30, 972], [300, 968], [600, 973], [870, 969]], "graphite", { width: 4, n: 3, secs: 0.4, alpha: [0.3, 0.55] });
      return [h.take(), coloured(s, h, petal(h.rng, 690, 958, -0.25, 58, 34, 0.05), "red", { edge: "maroon" })];
    },
  ]);
}

const take = (h: Hand) => h.take();

// A shape with straight sides, its corners given as points: the crayon smooths an outline through its points, so
// each side is laid as many close points, which keeps it straight and leaves the corners only softened, as wax
// leaves them.
const sides = (corners: readonly Pt[], step = 6): Pt[] =>
  corners.flatMap(([x0, y0], i) => {
    const [x1, y1] = corners[(i + 1) % corners.length];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    return Array.from({ length: n }, (_, k): Pt => [x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  });

const rect = (x: number, y: number, w: number, h: number): Pt[] =>
  sides([
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ]);

// Each work's emblem, on a 160 × 120 sheet, drawn by one hand.
export const EMBLEMS: Record<string, () => string> = {
  // Garden: a poppy on its stem, with a leaf.
  garden: () =>
    drawing("em-garden", "0 0 160 120", 3, [
      (h, s) => [stem(h, [[78, 124], [82, 92], [80, 64]], "green", 5), leaf(s, h, [80, 100], -0.6, 46, 16), poppy(s, h, 80, 48, 38, "red", "maroon", "maroon", { n: 5 })],
    ]),
  // Footers: a small world at the foot of a page: a sun over two hills and the ground line.
  footers: () =>
    drawing("em-footers", "0 0 160 120", 5, [
      (h, s) => {
        h.spiral(112, 36, 14, "ochre", { turns: 5, width: 8, n: 5, secs: 0.3, weight: [1.6, 2.6] });
        const sun = take(h);
        const far: Pt[] = [[-6, 92], [30, 64], [70, 78], [112, 58], [168, 86], [168, 124], [-6, 124]];
        const near: Pt[] = [[-6, 104], [44, 84], [96, 100], [140, 88], [168, 98], [168, 124], [-6, 124]];
        return [sun, coloured(s, h, far, "olive", { edge: "green" }), coloured(s, h, near, "green", { edge: "pine" })];
      },
    ]),
  // Portraits: a picture in planes, parted: three frames, each a step deeper.
  portraits: () =>
    drawing("em-portraits", "0 0 160 120", 7, [
      (h, s) => [
        coloured(s, h, rect(30, 22, 64, 76), "lilac", { edge: "deep" }),
        coloured(s, h, rect(50, 16, 64, 76), "pink", { edge: "maroon" }),
        coloured(s, h, circle(98, 52, 18, 12), "ochre", { edge: "maroon" }),
      ],
    ]),
  // Characters: letters that make a picture; a large A and a small a, written.
  characters: () =>
    drawing("em-characters", "0 0 160 120", 9, [
      (h) => {
        const o = { width: 8, n: 5, secs: 0.22, weight: [2, 3.2] as const };
        h.stroke([[32, 100], [56, 20], [80, 100]], "deep", o);
        h.stroke([[42, 70], [70, 70]], "deep", o);
        h.line(circle(110, 86, 14, 12), "red", { closed: true, width: 7, n: 4, secs: 0.26, weight: [2, 3.2] });
        h.stroke([[125, 68], [125, 101]], "red", o);
        return [take(h)];
      },
    ]),
  // Collage: an engraving of a head, in parallel lines, on a scrap of paper laid askew.
  collage: () =>
    drawing("em-collage", "0 0 160 120", 11, [
      (h, s) => {
        const scrap = coloured(s, h, sides([[24, 30], [128, 18], [138, 98], [34, 108]]), "wheat", { edge: "graphite", edgeWidth: 3 });
        const head = circle(80, 60, 28, 14);
        for (let y = 36; y <= 86; y += 7) {
          const half = Math.sqrt(Math.max(0, 28 * 28 - (y - 60) ** 2));
          h.stroke([[80 - half, y], [80 + half, y + 2]], "graphite", { width: 2, n: 2, secs: 0.08, weight: [1.2, 1.8] });
        }
        h.line(head, "graphite", { closed: true, width: 3, n: 2, secs: 0.25 });
        return [scrap, take(h)];
      },
    ]),
};

// Assembly's own emblem: a folded paper dart in flight, its two faces in two crayons, and the loop of its flight
// behind it, the pointer the hands work with.
EMBLEMS.assembly = () =>
  drawing("em-assembly", "0 0 160 120", 15, [
    (h, s) => {
      h.line([[10, 108], [26, 84], [22, 62], [38, 52], [60, 62]], "graphite", { width: 3, n: 2, secs: 0.3, alpha: [0.35, 0.6], weight: [1, 1.6] });
      const trail = h.take();
      const top = coloured(s, h, sides([[140, 22], [54, 52], [86, 64]]), "blue", { edge: "deep", edgeWidth: 3 });
      const under = coloured(s, h, sides([[140, 22], [86, 64], [96, 94]]), "cloud", { edge: "deep", edgeWidth: 3, angle: 40 });
      h.stroke([[140, 22], [86, 64]], "deep", { width: 3, n: 2, secs: 0.12, weight: [1.2, 2] });
      return [trail, under, top, h.take()];
    },
  ]);

// A crayon line drawn under a headline: one stroke, a little wavy, as an editor marks what matters.
export function underline(): string {
  return drawing("ul", "0 0 600 40", 13, [
    (h) => {
      h.stroke([[6, 26], [150, 20], [300, 24], [450, 16], [594, 22]], "red", { width: 10, n: 6, secs: 0.5, weight: [2.2, 3.6], alpha: [0.6, 0.95] });
      return [take(h)];
    },
  ], 'preserveAspectRatio="none"');
}
