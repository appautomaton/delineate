// Crayon: the foot of a page drawn as a crayon landscape at evening, in six depths.
//
// One place the eye is led to: a lane climbs from the viewer's feet, through a meadow and over a valley of
// fields, to a hamlet on a crest, where cypresses stand and the sun (by night the moon) hangs low above it. The
// hamlet sits two thirds of the way across, so a narrow screen, which keeps only the middle of the sheet, still
// has it. Behind lie a far range, lilac and hardly pressed, and a haze where the sky meets it.
//
// The hills cross one another on the diagonal rather than stacking up in bands. Their fields run in strips along
// each hill's curve and are coloured along its slope, so the strands themselves say the shape of the ground; one
// field in a few has its rows running down the hill instead. Detail thickens toward the viewer and the wax
// presses harder: far things are pale, cool and few, near things saturated, warm and many.
//
// The colours are names (crayon/hand.ts), so night is not a second drawing: the same strands are laid on dark
// paper, where wax reads as pastel. A few names change more than their tone: the haze is warm by day and a
// moonlit mist by night, and the stars and the hamlet's lit windows show only by night. Every strand keeps the
// moment the hand reached it, and the world replays the drawing, far to near, whenever it comes into view.
//
// One sequence of random numbers runs through the whole drawing, sky to front, so each part draws from it in turn.

import { Hand, TOOTH, type Range } from "../../crayon/hand.ts";
import { Sheet, bud, circle, closedD, leaf, poppy, stem, tulip } from "../../crayon/shapes.ts";
import { catmull, type Pt } from "../../lib/geometry.ts";
import { Random } from "../../lib/random.ts";

const [W, H] = [1600, 900];
const degrees = (radians: number) => radians * (180 / Math.PI);

// The height of a polyline at x.
function at(points: readonly Pt[], x: number): number {
  for (let i = 0; i + 1 < points.length; i++) {
    const [[x0, y0], [x1, y1]] = [points[i], points[i + 1]];
    if (x0 <= x && x <= x1) return x1 !== x0 ? y0 + ((y1 - y0) * (x - x0)) / (x1 - x0) : y0;
  }
  return x < points[0][0] ? points[0][1] : points.at(-1)![1];
}

// A smooth line through control points, sampled every `step` px across.
function contour(ctrl: readonly Pt[], step = 16): Pt[] {
  const dense = catmull(ctrl, 10);
  const out: Pt[] = [];
  for (let x = Math.trunc(ctrl[0][0]); x <= Math.trunc(ctrl.at(-1)![0]); x += step) out.push([x, at(dense, x)]);
  return out;
}

// Which way a line runs at x, in degrees.
const slope = (line: readonly Pt[], x: number) => degrees(Math.atan2(at(line, x + 30) - at(line, x - 30), 60));

const clipped = (sheet: Sheet, shape: readonly Pt[], body: string) => `<g clip-path="${sheet.clip(closedD(shape))}">${body}</g>`;

// A drawing plane: the clips it uses and its strands.
type Plane = { sheet: Sheet; art: string };

// The land's lines, far to near. The left hill crests at a third of the way across and falls away to the right;
// the hamlet's hill rises across it from the left, crests at two thirds and passes in front of it.

const RANGE_BACK: Pt[] = [[-60, 548], [110, 512], [260, 478], [390, 462], [520, 494], [660, 528], [820, 516], [960, 530],
  [1100, 500], [1240, 482], [1380, 506], [1530, 524], [1680, 532]];
const RANGE_FRONT: Pt[] = [[-60, 584], [180, 566], [360, 552], [560, 570], [780, 586], [980, 566], [1170, 546], [1330, 556],
  [1510, 574], [1680, 580]];
const DISTANT = contour([[-60, 600], [240, 590], [520, 602], [800, 614], [1100, 600], [1400, 594], [1680, 606]]);
const LEFT = contour([[-60, 646], [120, 626], [330, 612], [520, 628], [720, 662], [900, 700], [1100, 740], [1680, 800]]);
const CREST = contour([[-60, 820], [300, 790], [560, 746], [760, 690], [900, 654], [1040, 634], [1160, 640], [1300, 664],
  [1480, 690], [1680, 700]]);
const GROUND = contour([[-60, 790], [240, 800], [560, 822], [860, 836], [1160, 826], [1420, 808], [1680, 796]]);
const HAMLET = 1040;
const LANE: Pt[] = [[600, 930], [660, 870], [790, 826], [860, 790], [820, 758], [880, 724], [950, 690], [1000, 662], [1030, 646]];

// The sky: a haze rubbed in above the range, clouds lying long and low, birds, and by night the stars.

// A cloud seen far off: a few heads on a flat foot, coloured in along its length. Only its crown is outlined,
// where the light catches it.
function cloud(sheet: Sheet, h: Hand, cx: number, cy: number, w: number, heads: readonly (readonly [number, number])[]): string {
  const crown = Array.from({ length: 41 }, (_, i): Pt => {
    const x = cx - w / 2 + (w * i) / 40;
    let y = cy;
    for (const [bx, r] of heads) {
      const [dx, rr] = [x - (cx + bx * w), r * w];
      if (Math.abs(dx) < rr) y = Math.min(y, cy - Math.sqrt(rr * rr - dx * dx) * 0.6);
    }
    return [x, y];
  });
  const shape: Pt[] = [...crown, [cx + w / 2, cy + w * 0.02], [cx - w / 2, cy + w * 0.02]];
  h.fill(shape, "cloud", { angle: -3, spacing: 7, width: 9, n: 4, secs: 0.35, alpha: [0.4, 0.7] });
  const body = h.take();
  h.line(crown.filter(([, y]) => y < cy - 2), "mist", { width: 3, n: 2, weight: [1, 1.6], alpha: [0.3, 0.55], secs: 0.3 });
  return clipped(sheet, shape, body) + h.take();
}

function sky(rng: Random): Plane {
  const sheet = new Sheet("cr-sky-");
  const out: string[] = [];
  // The haze, rubbed in as a hand would: rows of long strokes, each row two or three strokes of their own length
  // and lean that overlap, lighter as they rise, so it thins with no edge and no ruled line in it. (A fill would
  // turn its passes back inside the sky and leave marks there.)
  let h = new Hand(29, 0);
  for (let y = 576; y > 262; y -= rng.uniform(9, 17)) {
    const a = 0.3 * ((y - 262) / 314) ** 1.4;
    h.clock = (576 - y) * 0.0015;
    for (let x = rng.uniform(-500, -200); x < W + 100; ) {
      const run = rng.uniform(0.45, 0.8) * W;
      const lean = rng.uniform(-14, 14);
      h.stroke(catmull([[x, y + lean], [x + run / 2, y + rng.uniform(-6, 6)], [x + run, y - lean]], 12), "haze", {
        width: 18, n: 3, weight: [1.8, 3.4], alpha: [a * 0.6, a], wander: 0.7, secs: 0.3, step: 16,
      });
      x += run * rng.uniform(0.6, 0.85);
    }
  }
  out.push(h.take());
  const clouds = [
    [300, 250, 380, [[-0.3, 0.17], [-0.08, 0.27], [0.16, 0.22], [0.34, 0.14]]],
    [760, 150, 230, [[-0.24, 0.2], [0.04, 0.3], [0.28, 0.18]]],
    [1420, 270, 320, [[-0.3, 0.15], [-0.06, 0.24], [0.2, 0.27], [0.38, 0.13]]],
  ] as const;
  clouds.forEach(([cx, cy, w, heads], i) => out.push(cloud(sheet, new Hand(30 + i, 0.1 + i * 0.12), cx, cy, w, heads)));
  // Birds heading home toward the hamlet, a stroke each wing.
  h = new Hand(41, 0.5);
  for (const [x, y, sz] of [[852, 318, 15], [884, 300, 12], [912, 324, 10], [936, 292, 11], [962, 310, 9]]) {
    for (const side of [-1, 1]) {
      h.stroke(catmull([[x, y], [x + side * sz * 0.45, y - sz * 0.32], [x + side * sz, y - sz * 0.05]], 6), "graphite", {
        width: 2, n: 2, weight: [1, 1.6], alpha: [0.5, 0.8], secs: 0.12,
      });
    }
  }
  out.push(h.take());
  // Stars, thicker toward the top, a few of them crossed; "star" is clear by day.
  h = new Hand(43, 0.6);
  const dots: [Pt, Pt][] = [];
  const crosses: [Pt, Pt][] = [];
  const clear = (x: number, y: number) => !(x < 620 && y < 160);
  while (dots.length < 50) {
    const [x, y] = [rng.uniform(20, W - 20), 30 + 320 * rng.random() ** 1.5];
    if (clear(x, y)) dots.push([[x, y], [x + 0.8, y - 0.5]]);
  }
  while (crosses.length < 14) {
    const [x, y] = [rng.uniform(60, W - 60), 40 + 220 * rng.random()];
    if (clear(x, y)) crosses.push([[x - 4, y], [x + 4, y]], [[x, y - 4], [x, y + 4]]);
  }
  h.dabs(dots, "star", { width: 1, n: 1, weight: [1.8, 3], alpha: [0.55, 0.95], secs: 0.5 });
  h.dabs(crosses, "star", { width: 1, n: 1, weight: [1, 1.4], alpha: [0.6, 0.9], secs: 0.3 });
  out.push(h.take());
  return { sheet, art: out.join("\n") };
}

// The far range: two ridges laid lightly, the nearer a little cooler.
function farRange(): Plane {
  const sheet = new Sheet("cr-range-");
  const h = new Hand(2, 0.1);
  // Peaks no higher than y = 455, so a host that gives the land less height than the demo, and so crops more of
  // the sheet's top, still shows the whole range.
  const ridges = [[RANGE_BACK, "lilac", [0.14, 0.3]], [RANGE_FRONT, "mist", [0.14, 0.28]]] as const;
  const art = ridges.map(([ctrl, colour, alpha]) => {
    const top = contour(ctrl, 20);
    const shape: Pt[] = [...top, [W + 80, 720], [-60, 720]];
    h.fill(shape, colour, { angle: -14, spacing: 15, width: 11, n: 3, secs: 0.5, alpha, step: 10 });
    const body = h.take();
    h.line(top, colour, { width: 4, n: 3, secs: 0.4, alpha: [0.3, 0.55] });
    return clipped(sheet, shape, body) + h.take();
  });
  return { sheet, art: art.join("\n") };
}

// The hills: each cut into strips along its curve and across by hedges that run down the fall of the land.

// How hard each crop is pressed: green fields dark, wheat light, so the patchwork reads by value.
const PRESS: Record<string, number> = { green: 1.15, olive: 1.0, sage: 0.9, wheat: 0.8, mist: 0.8 };

type Fields = {
  // Depths below the hill's top, wider toward the viewer, where the strips divide.
  rows: number[];
  // Where the hedges leave the top, and how far they lean by the foot.
  cuts: [number, number][];
  crops: string[];
  // How many strands, how far apart the passes, and how hard the wax is pressed.
  strands: number;
  spacing: number;
  alpha: Range;
  // When the hand reaches the hill.
  start: number;
  // The strips with a hedge along them, and the nearer hills that hide what lies wholly behind them.
  hedged?: number[];
  front?: (readonly Pt[])[];
};

// A hill's fields. No field takes the crop of the field beside or above it, and a field wholly behind one of the
// `front` hills is not drawn.
function fields(rng: Random, s: Sheet, h: Hand, top: readonly Pt[], opts: Fields): string[] {
  const { rows, cuts, crops, strands, spacing, alpha, start, hedged = [], front = [] } = opts;
  const out: string[] = [];
  const hidden = (patch: readonly Pt[]) => front.length > 0 && patch.every(([x, y]) => y > Math.min(...front.map((line) => at(line, x))) + 3);
  const xs = [-90, ...cuts.map(([x]) => x), W + 90];
  const lean = [0, ...cuts.map(([, d]) => d), 0];
  const edge = (c: number, d: number) => xs[c] + (lean[c] * d) / rows.at(-1)!;
  const run = (d: number, a: number, b: number, n = 10) => {
    const [xa, xb] = [edge(a, d), edge(b, d)];
    return Array.from({ length: n + 1 }, (_, i): Pt => [xa + ((xb - xa) * i) / n, at(top, xa + ((xb - xa) * i) / n) + d]);
  };
  const grid = new Map<string, string>();
  for (let r = 0; r < rows.length - 1; r++) {
    for (let k = 0; k < xs.length - 1; k++) {
      const [beside, above] = [grid.get(`${r},${k - 1}`), grid.get(`${r - 1},${k}`)];
      const crop = rng.choice(crops.filter((c) => c !== beside && c !== above));
      grid.set(`${r},${k}`, crop);
      const patch = [...run(rows[r], k, k + 1), ...run(rows[r + 1], k + 1, k)];
      if (hidden(patch)) continue;
      const across = slope(top, (edge(k, rows[r]) + edge(k + 1, rows[r])) / 2);
      // One field in a few near the top has its rows running down the hill.
      const angle = r <= 2 && rng.random() < 0.22 ? across + 64 : across + rng.uniform(-5, 5);
      h.clock = start + (r * xs.length + k) * 0.018;
      // Nearer the viewer the tip reads broader and its passes further apart, as perspective has it.
      const near = 1 + (0.45 * rows[r]) / rows.at(-1)!;
      const press = PRESS[crop];
      h.fill(patch, crop, {
        angle, spacing: spacing * near * rng.uniform(0.9, 1.1), width: 10 * near, n: strands, secs: 0.2,
        alpha: [alpha[0] * press, Math.min(1, alpha[1] * press)], step: 8 + (4 - strands) * 4,
      });
      out.push(clipped(s, patch, h.take()));
    }
  }
  // Hedgerows: thin and dark along a few strips and down each cut.
  h.clock = start + 0.4;
  for (const r of hedged) h.line(run(rows[r], 0, xs.length - 1, 40), "pine", { width: 3, n: 2, weight: [1, 1.7], alpha: [0.25, 0.45], secs: 0.3 });
  for (let c = 1; c < xs.length - 1; c++) {
    const down = [rows[0], rows.at(-1)! * 0.5, rows.at(-1)!].map((d): Pt => [edge(c, d), at(top, edge(c, d)) + d]);
    h.line(down, "pine", { width: 3, n: 2, weight: [1, 1.7], alpha: [0.22, 0.4], secs: 0.2 });
  }
  out.push(h.take());
  return out;
}

// The lane, from the viewer's feet up through the fields to the hamlet, narrowing as it climbs: the line the eye
// follows. Pale as dust by day; by night it holds the moonlight.
function lane(s: Sheet, h: Hand): string {
  const widths = [200, 150, 100, 70, 50, 36, 24, 14, 6];
  const left = LANE.map(([x, y], i): Pt => [x - widths[i] / 2, y]);
  const right = LANE.map(([x, y], i): Pt => [x + widths[i] / 2, y]);
  const shape = [...catmull(left, 4), ...catmull(right, 4).reverse()];
  h.fill(shape, "moon", { angle: -70, spacing: 7, width: 9, n: 4, secs: 0.4, alpha: [0.45, 0.75] });
  let body = h.take();
  h.fill(shape, "wheat", { angle: -20, spacing: 14, width: 8, n: 2, secs: 0.25, alpha: [0.15, 0.3] });
  body += h.take();
  for (const side of [left, right]) h.line(side, "rust", { width: 3.5, n: 3, weight: [1.1, 1.9], alpha: [0.45, 0.75], secs: 0.3 });
  return clipped(s, shape, body) + h.take();
}

function hills(rng: Random): Plane {
  const sheet = new Sheet("cr-hills-");
  const out = [
    ...fields(rng, sheet, new Hand(5, 0), DISTANT, {
      rows: [0, 14, 34, 60, 130], cuts: [[330, -20], [760, 15], [1180, -10]], crops: ["sage", "wheat", "olive", "sage"],
      strands: 2, spacing: 12, alpha: [0.25, 0.5], start: 0.3, front: [LEFT, CREST],
    }),
    ...fields(rng, sheet, new Hand(6, 0), LEFT, {
      rows: [0, 18, 42, 76, 120, 176, 300], cuts: [[170, -90], [470, 50], [760, 110]], crops: ["olive", "wheat", "sage", "olive"],
      strands: 3, spacing: 11, alpha: [0.55, 0.82], start: 0.5, hedged: [2, 4], front: [CREST, GROUND],
    }),
    ...fields(rng, sheet, new Hand(7, 0), CREST, {
      rows: [0, 20, 46, 82, 128, 186, 260, 340], cuts: [[520, -60], [840, -30], [1120, 20], [1380, 60]],
      crops: ["green", "wheat", "olive", "green", "sage"], strands: 3, spacing: 10, alpha: [0.58, 0.88], start: 0.75, hedged: [1, 3, 5], front: [GROUND],
    }),
    ...fields(rng, sheet, new Hand(8, 0), GROUND, {
      rows: [0, 34, 90, 180], cuts: [[420, -40], [1000, 30]], crops: ["green", "olive", "wheat"], strands: 4, spacing: 8, alpha: [0.55, 0.85], start: 1.1,
    }),
  ];
  const h = new Hand(9, 1.2);
  for (const [top, colour] of [[DISTANT, "sage"], [LEFT, "olive"], [CREST, "green"], [GROUND, "green"]] as const) {
    h.line(top, colour, { width: 5, n: 3, secs: 0.35, alpha: [0.4, 0.7] });
  }
  out.push(h.take(), lane(sheet, new Hand(10, 1.4)));
  return { sheet, art: out.join("\n") };
}

// Trees and the hamlet: smaller further off; cypresses like flames along the lane's last climb.

function roundTree(s: Sheet, h: Hand, x: number, ground: number, size: number, crown = "green", shade = "pine"): string {
  h.line([[x, ground], [x + size * 0.04, ground - size * 0.5]], "rust", { width: size * 0.1, n: 3, weight: [1.4, 2.4], secs: 0.12 });
  const trunk = h.take();
  const [cx, cy, r] = [x + size * 0.03, ground - size * 0.74, size * 0.36];
  const shape = circle(cx, cy, r, 14);
  h.fill(shape, crown, { angle: -40, spacing: 6.5, width: 8, n: 4, secs: 0.2 });
  let body = h.take();
  h.fill(circle(cx + r * 0.3, cy + r * 0.3, r * 0.7, 10), shade, { angle: 30, spacing: 8, width: 7, n: 3, secs: 0.12, alpha: [0.35, 0.6] });
  body += h.take();
  h.line(shape, shade, { closed: true, width: 3, n: 2, weight: [1, 1.6], alpha: [0.45, 0.75], secs: 0.15 });
  return trunk + clipped(s, shape, body) + h.take();
}

function cypress(s: Sheet, h: Hand, x: number, ground: number, size: number): string {
  const shape: Pt[] = [[x, ground - size], [x + size * 0.1, ground - size * 0.7], [x + size * 0.13, ground - size * 0.3], [x + size * 0.07, ground],
    [x - size * 0.07, ground], [x - size * 0.13, ground - size * 0.3], [x - size * 0.1, ground - size * 0.7]];
  h.fill(shape, "pine", { angle: -75, spacing: 5, width: 7, n: 4, secs: 0.18 });
  const body = h.take();
  h.line(shape, "pine", { closed: true, width: 2.5, n: 2, weight: [1, 1.5], alpha: [0.5, 0.8], secs: 0.15 });
  return clipped(s, shape, body) + h.take();
}

// A stone pine: a tall bare trunk forking under a flat crown, domed above and level below.
function umbrella(s: Sheet, h: Hand, x: number, ground: number, size: number): string {
  h.line([[x, ground], [x + size * 0.04, ground - size * 0.45], [x + size * 0.1, ground - size * 0.72]], "rust", {
    width: size * 0.06, n: 3, weight: [1.4, 2.4], secs: 0.15,
  });
  h.line([[x + size * 0.05, ground - size * 0.5], [x - size * 0.14, ground - size * 0.74]], "rust", { width: size * 0.04, n: 2, weight: [1.2, 2], secs: 0.1 });
  const trunk = h.take();
  const [cx, cy, rx, ry] = [x + size * 0.02, ground - size * 0.82, size * 0.52, size * 0.16];
  const crown = Array.from({ length: 20 }, (_, i): Pt => {
    const a = (i * Math.PI) / 10;
    return [cx + rx * Math.cos(a) * (1 + 0.06 * Math.sin(3 * a)), cy + ry * Math.sin(a) * (Math.sin(a) < 0 ? 1.3 : 0.7)];
  });
  h.fill(crown, "pine", { angle: -6, spacing: 5.5, width: 8, n: 4, secs: 0.25 });
  let body = h.take();
  h.fill(crown.map(([px, py]): Pt => [px, py - ry * 0.45]), "olive", { angle: 8, spacing: 8, width: 7, n: 3, secs: 0.15, alpha: [0.3, 0.55] });
  body += h.take();
  h.line(crown, "pine", { closed: true, width: 3, n: 2, weight: [1, 1.6], alpha: [0.45, 0.75], secs: 0.15 });
  return trunk + clipped(s, crown, body) + h.take();
}

// A farmhouse: limewashed walls, a pantile roof, and windows dark by day and lit by night.
function house(s: Sheet, h: Hand, x: number, ground: number, w: number, tall = 0.62, windows = 1): string {
  const [wall, roof] = [w * tall, w * 0.36];
  const walls: Pt[] = [[x, ground + 6], [x + w, ground + 6], [x + w, ground - wall], [x, ground - wall]];
  const gable: Pt[] = [[x - w * 0.08, ground - wall], [x + w * 1.08, ground - wall], [x + w * 0.5, ground - wall - roof]];
  h.fill(walls, "cloud", { angle: -60, spacing: 4.5, width: 6, n: 3, secs: 0.15, alpha: [0.65, 0.95] });
  let out = clipped(s, walls, h.take());
  h.fill(gable, "rust", { angle: -15, spacing: 4, width: 6, n: 3, secs: 0.15, alpha: [0.65, 0.95] });
  out += clipped(s, gable, h.take());
  for (let i = 0; i < windows; i++) {
    const wx = x + (w * (i + 1)) / (windows + 1);
    const pane: Pt[] = [[wx - 3.2, ground - wall * 0.66], [wx + 3.2, ground - wall * 0.66], [wx + 3.2, ground - wall * 0.36], [wx - 3.2, ground - wall * 0.36]];
    h.fill(pane, "lamp", { angle: 80, spacing: 2.4, width: 4, n: 2, secs: 0.08, alpha: [0.8, 1] });
    out += clipped(s, pane, h.take());
  }
  h.line(walls, "graphite", { closed: true, width: 1.6, n: 2, weight: [0.8, 1.3], alpha: [0.3, 0.55], secs: 0.15 });
  h.line(gable, "maroon", { closed: true, width: 1.6, n: 2, weight: [0.8, 1.3], alpha: [0.4, 0.65], secs: 0.15 });
  return out + h.take();
}

function trees(rng: Random): Plane {
  const sheet = new Sheet("cr-trees-");
  const out: string[] = [];
  // Each tree in turn, 30 ms after the last.
  let turn = 0;
  const next = () => 1.5 + turn++ * 0.03;
  const hand = () => new Hand(rng.randrange(10 ** 6), next());
  // Far off: small round crowns on the distant hills and along the left hill's top.
  const far = [[90, 18, DISTANT], [612, 16, DISTANT], [700, 20, DISTANT], [1260, 18, DISTANT], [1500, 16, DISTANT],
    [60, 30, LEFT], [560, 34, LEFT], [640, 28, LEFT]] as const;
  for (const [x, size, line] of far) out.push(roundTree(sheet, hand(), x, at(line, x) + 4, size, rng.choice(["green", "olive", "sage"])));
  // The stone pine alone on the left hill's crest, answering the hamlet across the valley.
  out.push(umbrella(sheet, new Hand(61, next()), 330, at(LEFT, 330) + 6, 150));
  out.push(cypress(sheet, new Hand(62, next()), 410, at(LEFT, 410) + 6, 70));
  // The hamlet on its crest, a bell tower among the houses.
  const houses = [[-56, 44, 0.6, 2], [-14, 20, 2.6, 1], [8, 38, 0.66, 1], [48, 50, 0.56, 2]] as const;
  houses.forEach(([dx, w, tall, windows], i) => {
    const x = HAMLET + dx;
    out.push(house(sheet, new Hand(80 + i, next()), x, at(CREST, x + w / 2) + 10, w, tall, windows));
  });
  for (const [x, size] of [[HAMLET + 112, 128], [HAMLET + 136, 100], [HAMLET - 80, 92]]) out.push(cypress(sheet, hand(), x, at(CREST, x) + 10, size));
  // Cypresses along the lane's last climb, smaller as it goes.
  [88, 72, 58, 46].forEach((size, i) => {
    const [x, y] = LANE[4 + i];
    out.push(cypress(sheet, hand(), x + (36 * size) / 88, y + 4, size));
  });
  // Nearer: a tree on the crest's lower fields, larger.
  out.push(roundTree(sheet, hand(), 1330, at(CREST, 1330) + 70, 64, rng.choice(["green", "olive"])));
  return { sheet, art: out.join("\n") };
}

// The meadow: flowers in clumps either side of the lane, the ground between them left as it is.

function lavender(rng: Random, h: Hand, x: number, ground: number, height: number): string {
  const marks: [Pt, Pt][] = [];
  for (let i = 0; i < 5; i++) {
    const dx = rng.uniform(-14, 14);
    const top: Pt = [x + dx * 1.6, ground - height * rng.uniform(0.75, 1)];
    h.line([[x, ground], [x + dx, ground - height * 0.5], top], "sage", { width: 3, n: 2, weight: [1, 1.6], secs: 0.15 });
    for (let j = 0; j < 7; j++) {
      const t = j / 7;
      const [px, py] = [top[0] + (x - top[0]) * t * 0.35, top[1] + height * 0.32 * t];
      marks.push([[px - 3, py], [px + 3, py - 3]]);
    }
  }
  h.dabs(marks, "violet", { width: 5, n: 3, weight: [1.6, 2.6], alpha: [0.5, 0.9], secs: 0.3 });
  return h.take();
}

function meadow(rng: Random): Plane {
  const sheet = new Sheet("cr-meadow-");
  const out: string[] = [];
  // Clumps by x, how many, and how high their flowers stand: tallest at the page's edges.
  const clumps = [[70, 4, 724], [250, 3, 756], [430, 3, 780], [1160, 2, 790], [1350, 3, 768], [1530, 4, 736]] as const;
  clumps.forEach(([x0, n, high], c) => {
    for (let k = 0; k < n; k++) {
      const h = new Hand(rng.randrange(10 ** 6), 1.4 + c * 0.06 + k * 0.03);
      const x = x0 + rng.uniform(-55, 55);
      const [ground, top] = [H + 20, rng.uniform(high, high + 50)];
      const kind = rng.choice(["poppy", "poppy", "tulip", "lavender", "bud"]);
      if (kind === "lavender") {
        out.push(lavender(rng, h, x, ground, ground - top + 20));
        continue;
      }
      out.push(stem(h, [[x, ground], [x + rng.uniform(-10, 10), (ground + top) / 2], [x + rng.uniform(-16, 16), top]], "green", 5));
      const cx = x + rng.uniform(-14, 14);
      if (kind === "poppy") {
        const [fill, shade] = rng.choice([["red", "maroon"], ["pink", "red"], ["blue", "deep"]]);
        out.push(poppy(sheet, h, cx, top, rng.uniform(28, 38), fill, shade, shade, { n: 5, tilt: 0.25 }));
      } else if (kind === "tulip") {
        out.push(tulip(sheet, h, cx, top, rng.uniform(18, 23), rng.choice(["ochre", "red", "pink"]), "rust", "rust"));
      } else {
        out.push(bud(sheet, h, cx, top, rng.uniform(11, 14), rng.choice(["pink", "ochre", "violet"]), "maroon", rng.uniform(-0.3, 0.3)));
      }
    }
  });
  return { sheet, art: out.join("\n") };
}

// The front: tall grass all along but thin at the lane's mouth, broad leaves, and flowers the edge cuts.
function near(rng: Random): Plane {
  const sheet = new Sheet("cr-near-");
  const out: string[] = [];
  let h = new Hand(3, 1.8);
  for (let i = 0; i < 72; i++) {
    const x = rng.uniform(-20, W + 20);
    if (470 < x && x < 760 && rng.random() < 0.8) continue;
    const tip: Pt = [x + rng.uniform(-50, 50), rng.uniform(790, 870)];
    h.clock = 1.8 + i * 0.008;
    h.line([[x, H + 20], [(x + tip[0]) / 2 + rng.uniform(-16, 16), (H + tip[1]) / 2], tip], rng.choice(["green", "olive", "sage", "green"]), {
      width: 4, n: 3, weight: [1.1, 2], secs: 0.25,
    });
  }
  out.push(h.take());
  const leaves = [[150, -1.25, 180], [400, -1.9, 140], [1120, -1.2, 150], [1460, -1.95, 190]] as const;
  leaves.forEach(([x, ang, length], i) => {
    const hand = new Hand(rng.randrange(10 ** 6), 2.0 + i * 0.06);
    out.push(leaf(sheet, hand, [x, H + 24], ang, length, length * 0.3, { fill: rng.choice(["green", "olive"]), second: "pine" }));
  });
  h = new Hand(99, 1.9);
  out.push(stem(h, [[44, H + 30], [34, 830], [20, 772]], "green", 9));
  out.push(poppy(sheet, h, 20, 752, 92, "red", "maroon", "maroon", { n: 6, tilt: 0.12 }));
  h = new Hand(98, 2.1);
  out.push(stem(h, [[1580, H + 30], [1588, 852], [1596, 806]], "green", 8));
  out.push(poppy(sheet, h, 1596, 790, 74, "blue", "deep", "deep", { n: 6, tilt: 0.15 }));
  return { sheet, art: out.join("\n") };
}

// The sun or the moon: a disc wound round and round. Its glow is light, not wax: the page lays it as a soft
// gradient behind the disc.
function orb(colour: string, seed: number): string {
  const h = new Hand(seed, 0.2);
  h.spiral(100, 100, 38, colour, { turns: 10, width: 12, n: 7, secs: 0.7, weight: [1.8, 3.2], alpha: [0.6, 0.95] });
  h.spiral(100, 100, 12, colour, { turns: 4, width: 8, n: 4, secs: 0.2, weight: [1.8, 3], alpha: [0.7, 0.95] });
  return h.take();
}

export function placeholders(): Record<string, string> {
  const rng = new Random(7);
  const { SKY, ...land } = { SKY: sky(rng), RANGE: farRange(), HILLS: hills(rng), TREES: trees(rng), MEADOW: meadow(rng), NEAR: near(rng) };
  return {
    SKY: SKY.art,
    SKY_DEFS: SKY.sheet.defs(),
    SUN: orb("ochre", 21),
    MOON: orb("moon", 22),
    TOOTH,
    ...Object.fromEntries(Object.entries(land).flatMap(([name, { sheet, art }]) => [[name, art], [`${name}_DEFS`, sheet.defs()]])),
  };
}

// A flower on its stem, for the scene picker.
export const GLYPH =
  '<circle cx="8" cy="5.6" r="1.4"/><path d="M8 2.2c1.4 0 1.9 1.6 1 2.4 1.3-.5 2.5.7 1.8 1.8-.6 1-2 .9-2.6.2.4 1.2-.6 2.1-1.6 1.6' +
  '-1-.5-1-1.8-.2-2.3-1.1.5-2.3-.4-2-1.5.3-1.2 1.7-1.4 2.4-.7-.6-1-.1-2.6 1.2-2.5z"/><path d="M8 9.2V14.4M8 12.2c-1.6-.2-2.6-1.1-3-2.4M8 11.4c1.4-.1 2.3-.9 2.6-2"/>';
