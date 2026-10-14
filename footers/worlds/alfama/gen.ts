// Alfama: Lisbon's oldest quarter seen from the Portas do Sol, drawn as an urban sketch in pen and watercolour.
//
// The view falls over a sea of terracotta roofs to the Tejo, with São Vicente de Fora and the dome of the
// Panteão standing out of it, a pergola of bougainvillea framing the left and tram 28 climbing past below. The
// ink is a fineliner: lines run a little past every corner, some edges are left out altogether, shadows are
// hatched. The washes are laid loosely over the ink, never quite inside it, and bloom into each other. Houses are
// generated row by row down the hill, each with its walls, its roof seen from above, windows, shutters, balconies
// and chimneys; the farther the row, the fewer the marks.
//
// Two sources of chance run through the drawing: each row of houses decides with its own, and each stratum of
// the sketch lays its lines and washes with another, the slight unsteadiness of the hand.

import { poly, smooth, spans, unionOutline, type Circle, type Pt } from "../../lib/geometry.ts";
import { f, fixed, hypot, roundEven } from "../../lib/number.ts";
import { Random } from "../../lib/random.ts";
import { dataUri, tile } from "../../lib/svg.ts";

const TAU = 2 * Math.PI;
const radians = (degrees: number) => degrees * (Math.PI / 180);

const WALLS = ["ochre", "rose", "cream", "blue", "sage", "white", "ochre", "salmon", "white", "cream", "rose", "white"];
const BLOOM: Record<string, string> = { ochre: "rose", rose: "ochre", cream: "salmon", blue: "sage", sage: "blue", white: "cream", salmon: "ochre" };
const SHUTTERS = ["green", "green", "teal", "brown", "blue-dark"];

type Ink = string[];
type LineOptions = { over?: number; wobble?: number; to?: Ink };
type Window = readonly [number, number, number, number];

// One stratum of the sketch: bare paper where its buildings stand, washes by colour, ink in three weights.
class Sketch {
  readonly rng: Random;
  readonly s: number;
  readonly ink: Ink = [];
  readonly fine: Ink = [];
  readonly heavy: Ink = [];
  readonly knock: string[] = [];
  readonly washes = new Map<string, string[]>();
  readonly windows: Window[] = [];
  // Where a stratum drawn at its own origin stands in the view, and its scale.
  place?: readonly [number, number, number];
  // Whether its washes fade out at the view's edges.
  fade = true;

  constructor(seed: number, s = 1.0) {
    this.rng = new Random(seed);
    this.s = s;
  }

  // A pen line that runs a little past both ends and bows very slightly.
  line(x1: number, y1: number, x2: number, y2: number, { over = 2.2 * this.s, wobble = 0.5, to = this.ink }: LineOptions = {}): void {
    const rng = this.rng;
    const [dx, dy] = [x2 - x1, y2 - y1];
    const ln = hypot(dx, dy) || 1;
    const [ux, uy] = [dx / ln, dy / ln];
    const [a, b] = [rng.uniform(0.15, 1) * over, rng.uniform(0.15, 1) * over];
    const [sx, sy] = [x1 - ux * a, y1 - uy * a];
    const [ex, ey] = [x2 + ux * b, y2 + uy * b];
    const bow = rng.uniform(-wobble, wobble);
    const [cx, cy] = [(sx + ex) / 2 - uy * bow, (sy + ey) / 2 + ux * bow];
    to.push(`M${f(sx)} ${f(sy)}q${f(cx - sx)} ${f(cy - sy)} ${f(ex - sx)} ${f(ey - sy)}`);
  }

  dash(x: number, y: number, dx: number, dy = 0, to: Ink = this.heavy): void {
    to.push(`M${f(x)} ${f(y)}l${f(dx)} ${f(dy)}`);
  }

  // The sides of a polygon, each left out with the chance `skip`.
  outline(pts: readonly Pt[], { closed = true, over, to, skip = 0 }: { closed?: boolean; over?: number; to?: Ink; skip?: number } = {}): void {
    const n = pts.length;
    for (let k = 0; k < (closed ? n : n - 1); k++) {
      if (this.rng.random() >= skip) this.line(...pts[k], ...pts[(k + 1) % n], { over, to });
    }
  }

  rect(x: number, y: number, w: number, h: number, opts: { over?: number; to?: Ink; skip?: number } = {}): void {
    this.outline([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], opts);
  }

  // Quick parallel strokes clipped to a polygon.
  hatch(pts: readonly Pt[], gap: number, { angle = 58, keep = 0.88, to = this.fine }: { angle?: number; keep?: number; to?: Ink } = {}): void {
    const a = radians(angle);
    const [ca, sa] = [Math.cos(a), Math.sin(a)];
    const rot = pts.map(([x, y]): Pt => [x * ca + y * sa, -x * sa + y * ca]);
    const vs = rot.map(([, v]) => v);
    const top = Math.max(...vs);
    for (let v = Math.min(...vs) + gap * this.rng.random(); v < top; v += gap * this.rng.uniform(0.85, 1.15)) {
      const hits = spans([rot], v);
      for (let i = 0; i + 1 < hits.length; i += 2) {
        const [u0, u1] = [hits[i], hits[i + 1]];
        if (this.rng.random() < keep && u1 - u0 > 0.8) {
          const [x0, y0] = [u0 * ca - v * sa, u0 * sa + v * ca];
          to.push(`M${f(x0)} ${f(y0)}l${f(u1 * ca - v * sa - x0)} ${f(u1 * sa + v * ca - y0)}`);
        }
      }
    }
  }

  // A wash laid a touch off the drawn shape, as a hand would.
  wash(colour: string, pts: readonly Pt[], slip = 1.5 * this.s): void {
    const rng = this.rng;
    const [dx, dy] = [rng.uniform(-slip, slip), rng.uniform(-slip * 0.8, slip * 0.8)];
    const laid = pts.map(([x, y]): Pt => [x + dx + rng.uniform(-0.7, 0.7), y + dy + rng.uniform(-0.7, 0.7)]);
    if (!this.washes.has(colour)) this.washes.set(colour, []);
    this.washes.get(colour)!.push(poly(laid));
  }

  washRect(colour: string, x: number, y: number, w: number, h: number, slip?: number): void {
    this.wash(colour, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], slip);
  }
}

// ---------------------------------------------------------------------------------------------------------
// A house: walls, a roof seen from above, windows by floor. Detail: 0 far, 1 middle, 2 near.

type Detail = 0 | 1 | 2;
type Roof = "hip" | "gable" | "flat";

// The roof and what stands on it. Returns its silhouette for the knock-out, and the gable's apex if it has one.
function roof(sk: Sketch, x: number, top: number, w: number, kind: Roof, rng: Random, detail: Detail, tilt = 0.42): [Pt[], Pt | undefined] {
  const s = sk.s;
  const eave = 2.4 * s;
  const pd = w * rng.uniform(0.8, 1.15) * tilt;
  const fine = sk.fine;
  let sil: Pt[];
  let crown: Pt;
  let apex: Pt | undefined;
  if (kind === "hip") {
    const [back, ridge] = [top - pd, top - pd * 0.52];
    const inset = Math.min(w * 0.34, pd * 0.5);
    const [A, B]: Pt[] = [[x - eave, top + 0.4], [x + w + eave, top + 0.4]];
    const [R1, R2]: Pt[] = [[x + inset, ridge], [x + w - inset, ridge]];
    const [C, D]: Pt[] = [[x + w + eave * 0.5, back], [x - eave * 0.5, back]];
    sk.wash("roof", [A, B, R2, R1]);
    sk.wash("roof-lit", [A, R1, D]);
    sk.wash("roof-dark", [B, C, R2]);
    sk.wash("roof-lit", [R1, R2, C, D]);
    sk.line(...A, ...B);
    sk.line(...A, ...R1, { over: 1.2 * s });
    sk.line(...B, ...R2, { over: 1.2 * s });
    if (R2[0] - R1[0] > 1) sk.line(...R1, ...R2, { over: 1.2 * s });
    if (detail) {
      sk.line(...R1, ...D, { over: 0.8 * s, to: fine });
      sk.line(...R2, ...C, { over: 0.8 * s, to: fine });
      if (rng.random() < 0.6) sk.line(...D, ...C, { over: 1.5 * s, to: fine });
    }
    if (detail === 2 || (detail === 1 && rng.random() < 0.5)) {
      // Tile channels, drawn only in a stretch or two, the way a sketcher suggests them.
      let xx = x + rng.uniform(1, 4) * s;
      let run = rng.random() < 0.5;
      for (; xx < x + w - 1; xx += 2.8 * s) {
        if (rng.random() < 0.18) run = !run;
        if (!run) continue;
        const up =
          xx < R1[0] ? A[1] + ((xx - A[0]) / (R1[0] - A[0])) * (R1[1] - A[1])
          : xx > R2[0] ? B[1] + ((xx - B[0]) / (R2[0] - B[0])) * (R2[1] - B[1])
          : ridge;
        if (top - up > 3 * s) sk.dash(xx, top - 0.6 * s, rng.uniform(-0.4, 0.4) * s, up - top + 1.4 * s, fine);
      }
      for (let k = 1; k < (detail === 2 ? 3 : 2); k++) {
        const y = top - k * 2.6 * s;
        const x0 = A[0] + ((y - A[1]) / (R1[1] - A[1])) * (R1[0] - A[0]) + 1.5 * s;
        const x1 = B[0] + ((y - B[1]) / (R2[1] - B[1])) * (R2[0] - B[0]) - 1.5 * s;
        let d = "";
        for (let xs = x0; xs < x1 - 3 * s; ) {
          const step = rng.uniform(3.4, 4.4) * s;
          d += `q${f(step / 2)} ${f(1.4 * s)} ${f(step)} 0`;
          xs += step;
        }
        if (d) fine.push(`M${f(x0)} ${f(y)}` + d);
      }
    }
    sil = [A, B, C, D];
    crown = [(R1[0] + R2[0]) / 2, ridge];
  } else if (kind === "gable") {
    const pg = w * rng.uniform(0.17, 0.24);
    const cx = x + w / 2;
    const rise = pd * 0.8;
    const [A, P, B]: Pt[] = [[x - eave, top + 0.4], [cx, top - pg], [x + w + eave, top + 0.4]];
    const [A2, P2, B2]: Pt[] = [[A[0], A[1] - rise], [cx, top - pg - rise], [B[0], B[1] - rise]];
    sk.wash("roof-lit", [A, P, P2, A2]);
    sk.wash("roof-dark", [P, B, B2, P2]);
    sk.line(...A, ...P);
    sk.line(...P, ...B);
    sk.line(...P, ...P2, { over: 1.2 * s });
    if (detail) {
      sk.line(...A, ...A2, { over: 0.8 * s, to: fine });
      sk.line(...B, ...B2, { over: 0.8 * s, to: fine });
      sk.line(...A2, ...P2, { over: 1.2 * s, to: fine });
    }
    if (detail === 2 || (detail === 1 && rng.random() < 0.5)) {
      for (let k = 1; k * 2.8 * s < rise - 1; k++) {
        const o = k * 2.8 * s;
        if (rng.random() < 0.7) sk.dash(A[0] + 1, A[1] - o, P[0] - A[0] - 2, P[1] - A[1], fine);
        if (rng.random() < 0.45) sk.dash(P[0] + 1, P[1] - o, B[0] - P[0] - 2, B[1] - P[1], fine);
      }
    }
    sil = [A, B, B2, P2, A2];
    crown = [cx + w * 0.2, top - pg * 0.5 - rise * 0.5];
    apex = [cx, top - pg + 1.6 * s];
  } else {
    // A flat roof terrace behind a parapet, with washing strung across it.
    const pt = pd * 0.55;
    const par = 3 * s;
    sk.wash("terrace", [[x, top - par], [x + w, top - par], [x + w - 1, top - par - pt], [x + 1, top - par - pt]]);
    sk.line(x, top - par, x + w, top - par);
    if (detail) {
      sk.line(x + 1, top - par - pt, x + w - 1, top - par - pt, { to: fine });
      sk.line(x, top - par, x + 1, top - par - pt, { over: 0.6 * s, to: fine });
      sk.line(x + w, top - par, x + w - 1, top - par - pt, { over: 0.6 * s, to: fine });
    }
    if (detail && rng.random() < 0.7) {
      const ly = top - par - pt * 0.55;
      sk.line(x + 4 * s, ly, x + w - 4 * s, ly + 1 * s, { over: 0.4 * s, wobble: 0.8 * s, to: fine });
      for (let cx = x + 6 * s; cx < x + w - 10 * s; cx += rng.uniform(5, 9) * s) {
        if (rng.random() < 0.7) {
          const [cw, ch] = [rng.uniform(3, 6) * s, rng.uniform(4, 7) * s];
          sk.wash(rng.choice(["cloth-a", "cloth-b", "cloth-c", "cloth-d"]), [[cx, ly + 0.4 * s], [cx + cw, ly + 0.6 * s], [cx + cw, ly + ch], [cx, ly + ch]], 0.4);
          if (detail === 2) sk.rect(cx, ly + 0.4 * s, cw, ch - 0.4 * s, { over: 0.4 * s, to: fine });
        }
      }
    }
    sil = [[x, top], [x + w, top], [x + w, top - par - pt - 1], [x, top - par - pt - 1]];
    crown = [x + w * rng.uniform(0.25, 0.75), top - par - pt * 0.3];
  }
  // Chimneys, aerials and dishes.
  if (kind !== "flat" && detail && rng.random() < 0.55) {
    const [cx, cy] = [crown[0] + rng.uniform(-w * 0.2, w * 0.2), crown[1]];
    const [cw, ch] = [3.2 * s, rng.uniform(6, 9) * s];
    sk.wash("white", [[cx - cw / 2, cy], [cx + cw / 2, cy], [cx + cw / 2, cy - ch], [cx - cw / 2, cy - ch]], 0.3);
    sk.wash("shade", [[cx + cw * 0.1, cy], [cx + cw / 2, cy], [cx + cw / 2, cy - ch], [cx + cw * 0.1, cy - ch]], 0.2);
    sk.line(cx - cw / 2, cy, cx - cw / 2, cy - ch, { over: 0.3 * s, to: fine });
    sk.line(cx + cw / 2, cy, cx + cw / 2, cy - ch, { over: 0.3 * s, to: fine });
    if (rng.random() < 0.5) {
      sk.line(cx - cw * 0.8, cy - ch, cx, cy - ch - 2.6 * s, { over: 0.3 * s, to: fine });
      sk.line(cx, cy - ch - 2.6 * s, cx + cw * 0.8, cy - ch, { over: 0.3 * s, to: fine });
    } else {
      sk.line(cx - cw * 0.9, cy - ch, cx + cw * 0.9, cy - ch, { over: 0.3 * s, to: fine });
      sk.line(cx - cw * 0.6, cy - ch - 1.6 * s, cx + cw * 0.6, cy - ch - 1.6 * s, { over: 0.3 * s, to: fine });
    }
    sil.push([cx, cy - ch - 3 * s]);
  } else if (detail && rng.random() < 0.25) {
    const [ax, ay] = [crown[0] + rng.uniform(-w * 0.25, w * 0.25), crown[1]];
    const ah = rng.uniform(12, 18) * s;
    sk.line(ax, ay, ax, ay - ah, { over: 0.3 * s, to: fine });
    for (let k = 0; k < 3; k++) {
      sk.line(ax - (5 - k * 1.3) * s, ay - ah + k * 2.4 * s, ax + (5 - k * 1.3) * s, ay - ah + k * 2.4 * s, { over: 0.3 * s, to: fine });
    }
  } else if (detail && rng.random() < 0.15) {
    const [dx, dy] = [crown[0] + rng.uniform(-w * 0.2, w * 0.2), crown[1] - 2 * s];
    fine.push(`M${f(dx - 3 * s)} ${f(dy)}a${f(3 * s)} ${f(2 * s)} 0 1 0 ${f(6 * s)} 0Z`);
    sk.wash("white", [[dx - 3 * s, dy], [dx, dy - 2 * s], [dx + 3 * s, dy], [dx, dy + 2 * s]], 0.2);
  }
  return [sil, apex];
}

type House = { tiles?: boolean; door?: boolean; tilt?: number };

function house(sk: Sketch, x: number, base: number, w: number, h: number, colour: string, kind: Roof, rng: Random, detail: Detail, opts: House = {}): void {
  const { tiles = false, door = true, tilt = 0.42 } = opts;
  const s = sk.s;
  const top = base - h;
  const [sil, apex] = roof(sk, x, top, w, kind, rng, detail, tilt);
  sk.knock.push(poly(sil), poly([[x, top], [x + w, top], [x + w, base + 2], [x, base + 2]]));

  // Walls: a wash with a second colour blooming into it from below, the eaves casting a band of shadow.
  sk.washRect(colour, x, top, w, h);
  if (detail && rng.random() < 0.55) {
    const u = [0, 1, 2, 3].map(() => rng.uniform(0.18, 0.45));
    sk.wash(BLOOM[colour] ?? "cream", [[x, base - h * u[0]], [x + w * 0.35, base - h * u[1]], [x + w * 0.7, base - h * u[2]], [x + w, base - h * u[3]], [x + w, base], [x, base]]);
  }
  if (tiles) sk.washRect("azulejo", x + 1, top + 4 * s, w - 2, h - 4 * s, 0.6);
  if (apex) {
    sk.wash(colour, [[x, top], apex, [x + w, top]]);
    if (detail === 2 && rng.random() < 0.5) {
      sk.fine.push(`M${f(apex[0] - 2.4 * s)} ${f((top + apex[1]) / 2 + 1)}a${f(2.4 * s)} ${f(1.8 * s)} 0 1 0 ${f(4.8 * s)} 0a${f(2.4 * s)} ${f(1.8 * s)} 0 1 0 ${f(-4.8 * s)} 0`);
    }
  }
  sk.wash("violet", [[x - 1, top], [x + w + 1, top], [x + w + 1, top + 4.5 * s], [x - 1, top + 5.5 * s]], 0.5);
  const shaded = rng.random() < 0.5;
  if (shaded) {
    const sw = w * rng.uniform(0.14, 0.3);
    sk.wash("shade", [[x + w - sw, top + 2], [x + w, top], [x + w, base], [x + w - sw * 0.8, base]]);
    if (detail) sk.hatch([[x + w - sw * 0.7, top + 6 * s], [x + w, top + 6 * s], [x + w, base - 2 * s], [x + w - sw * 0.7, base - 2 * s]], 2.6 * s);
  }
  sk.rect(x, top, w, h, { skip: shaded ? 0.08 : 0.22 });
  if (detail) sk.line(x - 1.4 * s, top + 2.2 * s, x + w + 1.4 * s, top + 2.2 * s, { over: 0.6 * s, to: sk.fine });

  const floors = Math.max(1, roundEven((h - 8 * s) / (24 * s)));
  const fh = (h - 6 * s) / floors;
  const cols = Math.max(1, Math.trunc(w / (19 * s)));
  const plan = rng.choice(["open", "shutter", "balcony", "mixed", "mixed"]);
  const shutter = rng.choice(SHUTTERS);
  const [ww, wh] = [rng.uniform(7.2, 9) * s, rng.uniform(12, 14.5) * s];
  const doorCol = rng.randrange(cols);
  for (let fl = 0; fl < floors; fl++) {
    const fy = base - fh * fl; // this floor's line
    for (let c = 0; c < cols; c++) {
      const cx = x + (w * (c + 0.5)) / cols;
      const cy = fy - fh * 0.58;
      if (fl === 0 && door && c === doorCol && detail) {
        const [dw, dh] = [ww * 1.15, Math.min(fh - 3 * s, wh * 1.45)];
        const arched = rng.random() < 0.4;
        const shoulder = base - dh + (arched ? dw / 2 : 0);
        sk.wash("door", [[cx - dw / 2, base], [cx - dw / 2, shoulder], [cx, base - dh], [cx + dw / 2, shoulder], [cx + dw / 2, base]], 0.6);
        if (arched) sk.ink.push(`M${f(cx - dw / 2)} ${f(base)}V${f(base - dh + dw / 2)}a${f(dw / 2)} ${f(dw / 2)} 0 0 1 ${f(dw)} 0V${f(base)}`);
        else sk.rect(cx - dw / 2, base - dh, dw, dh, { over: 1 * s });
        sk.line(cx - dw / 2 - 2 * s, base, cx + dw / 2 + 2 * s, base, { over: 0.5 * s, to: sk.fine });
        continue;
      }
      if (rng.random() < 0.08) continue;
      let kindW = plan !== "mixed" ? plan : rng.choice(["open", "shutter", "balcony", "half"]);
      if (fl === 0 && kindW === "balcony") kindW = "open";
      const [wx, wy] = [cx - ww / 2, cy - wh / 2];
      const pane: Pt[] = [[wx, wy], [wx + ww, wy], [wx + ww, wy + wh], [wx, wy + wh]];
      if (detail === 0) {
        // Far off, a window is a dab of dark and nothing more.
        sk.wash("glass", pane, 0.4);
        sk.windows.push([wx, wy, ww, wh]);
        continue;
      }
      if (kindW === "shutter") {
        sk.wash(shutter, pane, 0.5);
        sk.rect(wx, wy, ww, wh, { over: 0.9 * s });
        if (detail === 2) for (let yy = wy + 1.8 * s; yy < wy + wh - 1; yy += 1.8 * s) sk.dash(wx + 0.6, yy, ww - 1.2, 0, sk.fine);
        sk.line(cx, wy, cx, wy + wh, { over: 0.3 * s, to: sk.fine });
        continue;
      }
      if (kindW === "balcony") {
        const bh = fy - 1 - (cy - wh / 2);
        sk.wash("glass", [[wx, wy], [wx + ww, wy], [wx + ww, fy - 1], [wx, fy - 1]], 0.5);
        sk.rect(wx, wy, ww, bh, { over: 0.9 * s });
        sk.line(cx, wy, cx, fy - 1, { over: 0.3 * s, to: sk.fine });
        const [bx0, bx1] = [wx - 3 * s, wx + ww + 3 * s];
        sk.line(bx0, fy - 1, bx1, fy - 1, { over: 1 * s, to: sk.heavy });
        sk.line(bx0, fy - 1 - 6 * s, bx1, fy - 1 - 6 * s, { over: 0.8 * s });
        if (detail === 2) for (let xx = bx0 + 1.6 * s; xx < bx1 - 0.5; xx += 1.7 * s) sk.dash(xx, fy - 1 - 6 * s, 0, 6 * s, sk.fine);
        else sk.hatch([[bx0, fy - 7 * s], [bx1, fy - 7 * s], [bx1, fy - 1], [bx0, fy - 1]], 1.8 * s, { angle: 90, keep: 1 });
        if (rng.random() < 0.55) {
          for (let k = rng.randint(1, 3); k > 0; k--) {
            const px = bx0 + rng.uniform(1, bx1 - bx0 - 4 * s);
            sk.wash("leaf", [[px, fy - 7 * s], [px + 4 * s, fy - 8 * s], [px + 5 * s, fy - 5 * s], [px, fy - 5 * s]], 0.4);
            sk.wash("geranium", [[px + 1 * s, fy - 9.5 * s], [px + 3.4 * s, fy - 10 * s], [px + 3.8 * s, fy - 7.6 * s], [px + 1 * s, fy - 7.4 * s]], 0.3);
          }
        }
        sk.windows.push([wx, wy, ww, bh]);
        continue;
      }
      sk.wash("glass", pane, 0.5);
      sk.rect(wx, wy, ww, wh, { over: 0.9 * s });
      sk.line(cx, wy, cx, wy + wh, { over: 0.2 * s, to: sk.fine });
      sk.line(wx, wy + wh * 0.34, wx + ww, wy + wh * 0.34, { over: 0.2 * s, to: sk.fine });
      if (detail === 2 && rng.random() < 0.5) sk.rect(wx - 1.3 * s, wy - 1.3 * s, ww + 2.6 * s, wh + 2.6 * s, { over: 0.6 * s, to: sk.fine });
      if (kindW === "half") {
        const side = rng.choice([-1, 1]);
        const sx0 = side < 0 ? wx - ww * 0.45 : wx + ww;
        sk.wash(shutter, [[sx0, wy], [sx0 + ww * 0.45, wy], [sx0 + ww * 0.45, wy + wh], [sx0, wy + wh]], 0.4);
        sk.rect(sx0, wy, ww * 0.45, wh, { over: 0.4 * s, to: sk.fine });
      }
      if (fl > 0 && rng.random() < 0.25) sk.line(wx - 1.5 * s, wy + wh + 1.2 * s, wx + ww + 1.5 * s, wy + wh + 1.2 * s, { over: 0.4 * s, to: sk.heavy });
      sk.windows.push([wx, wy, ww, wh]);
    }
  }
  // A drainpipe down one corner, its brackets every floor or so.
  if (detail === 2 && rng.random() < 0.45) {
    const px = rng.random() < 0.5 ? x + w - 2.5 * s : x + 2.5 * s;
    sk.line(px, top + 2 * s, px, base, { over: 0.3 * s, to: sk.fine });
    for (let k = 1; k < Math.trunc(h / (16 * s)); k++) sk.dash(px - 1.2 * s, top + k * 16 * s, 2.4 * s, 0, sk.fine);
  }
}

type Row = { floors?: readonly [number, number]; width?: readonly [number, number]; mix?: readonly [number, number]; tiles?: number; tilt?: number };

// A row of houses along the hill, each standing a little off the line `baseAt` and stepping its roofline.
function row(sk: Sketch, x0: number, x1: number, baseAt: (x: number) => number, rng: Random, detail: Detail, opts: Row = {}): void {
  const { floors = [2, 4], width = [42, 72], mix = [0.5, 0.22], tiles = 0.1, tilt = 0.42 } = opts;
  let prevTop: number | undefined;
  for (let x = x0; x < x1; ) {
    const w = rng.uniform(...width) * sk.s;
    const h = rng.randint(...floors) * 24 * sk.s + 8 * sk.s + rng.uniform(-3, 3) * sk.s;
    const base = baseAt(x + w / 2) + rng.uniform(-5, 5) * sk.s;
    const roll = rng.random();
    const kind: Roof = roll < mix[0] ? "hip" : roll < mix[0] + mix[1] ? "gable" : "flat";
    const colour = rng.choice(WALLS);
    const tiled = rng.random() < tiles && ["white", "blue", "cream"].includes(colour);
    house(sk, x, base, w, h, colour, kind, rng, detail, { tiles: tiled, tilt });
    const top = base - h;
    if (detail && prevTop !== undefined && top - prevTop > 10 * sk.s) {
      // The taller neighbour's shadow across this house's face.
      const d = Math.min(w * 0.7, (top - prevTop) * 1.4);
      sk.wash("violet", [[x, top], [x + d, top], [x, top + d * 1.15]], 0.6);
      if (detail === 2) sk.hatch([[x, top + 3 * sk.s], [x + d * 0.8, top + 3 * sk.s], [x, top + d]], 2.4 * sk.s, { angle: 48 });
    }
    prevTop = top;
    x += w + rng.uniform(-1.5, 0.5) * sk.s;
  }
}

// ---------------------------------------------------------------------------------------------------------
// The two churches that stand out of the roofs.

const polyline = (pts: readonly Pt[]) => "M" + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" ");

// Santa Engrácia, the National Pantheon: a white body with corner towers, a drum of pilasters, the dome.
function panteao(sk: Sketch, cx: number, base: number): void {
  const s = sk.s;
  const body: Pt[] = [[cx - 70, base - 64], [cx + 70, base - 64], [cx + 70, base], [cx - 70, base]];
  const towers = [cx - 74, cx + 52].map((tx): Pt[] => [[tx, base - 84], [tx + 22, base - 84], [tx + 22, base], [tx, base]]);
  const drum: Pt[] = [[cx - 31, base - 112], [cx + 31, base - 112], [cx + 31, base - 66], [cx - 31, base - 66]];
  const dome = Array.from({ length: 25 }, (_, k): Pt => [cx - 33 + (66 * k) / 24, base - 114 - 38 * Math.sin((Math.PI * k) / 24)]);
  const lantern: Pt[] = [[cx - 6, base - 164], [cx + 6, base - 164], [cx + 6, base - 150], [cx - 6, base - 150]];
  for (const shape of [body, ...towers, drum, dome, lantern]) sk.knock.push(poly(shape));
  sk.wash("limestone", body);
  for (const t of towers) sk.wash("limestone", t);
  sk.wash("limestone", drum);
  sk.wash("shade", [[cx + 10, base - 112], [cx + 31, base - 112], [cx + 31, base - 66], [cx + 12, base - 66]]);
  sk.wash("shade", [[cx + 62, base - 84], [cx + 74, base - 84], [cx + 74, base], [cx + 62, base]]);
  sk.wash("shade", [[cx + 30, base - 62], [cx + 52, base - 62], [cx + 52, base], [cx + 30, base]]);
  sk.wash("lead", [...dome.slice(6), [cx + 33, base - 112], [cx - 10, base - 112]]);
  sk.wash("limestone", lantern);
  sk.outline(body, { skip: 0.1 });
  for (const t of towers) {
    sk.outline(t);
    sk.line(t[0][0] - 2, t[0][1], t[1][0] + 2, t[1][1], { over: 0.6 * s, to: sk.heavy });
    for (let k = 1; k < 6; k++) sk.dash(t[0][0] + k * 3.6, t[0][1] - 4, 0, 4, sk.fine);
    sk.line(t[0][0] - 1, t[0][1] - 4, t[1][0] + 1, t[1][1] - 4, { over: 0.4 * s, to: sk.fine });
    sk.rect(t[0][0] + 7, base - 66, 8, 14, { over: 0.6 * s, to: sk.fine });
  }
  sk.outline(drum, { skip: 0.1 });
  for (let k = 1; k < 9; k++) sk.line(cx - 31 + (k * 62) / 9, base - 110, cx - 31 + (k * 62) / 9, base - 68, { over: 0.3 * s, to: sk.fine });
  for (const wx of [cx - 18, cx, cx + 18]) {
    sk.wash("glass", [[wx - 3, base - 80], [wx - 3, base - 94], [wx, base - 97], [wx + 3, base - 94], [wx + 3, base - 80]], 0.4);
  }
  sk.line(cx - 35, base - 112, cx + 35, base - 112, { over: 1 * s, to: sk.heavy });
  for (let xx = cx - 33; xx < cx + 33; xx += 3) sk.dash(xx, base - 116, 0, 4, sk.fine);
  sk.ink.push(polyline(dome.filter((_, i) => i % 2 === 0)));
  for (const k of [-0.75, -0.42, 0, 0.42, 0.75]) {
    const ribs = Array.from({ length: 7 }, (_, j): Pt => {
      const b = (j * Math.PI) / 2 / 6;
      return [cx + 33 * k * Math.cos(b), base - 114 - 38 * Math.sin(b)];
    });
    sk.fine.push(polyline(ribs));
  }
  sk.outline(lantern);
  sk.line(cx, base - 164, cx, base - 176, { over: 0.4 * s });
  sk.line(cx - 3, base - 172, cx + 3, base - 172, { over: 0.3 * s, to: sk.fine });
  sk.ink.push(`M${f(cx - 8)} ${f(base - 164)}q8 -6 16 0`);
  // The front: a portico of three arches, a cornice, a balustrade along the roof.
  sk.line(cx - 72, base - 64, cx + 72, base - 64, { over: 1.4 * s, to: sk.heavy });
  for (let xx = cx - 46; xx < cx + 46; xx += 3) sk.dash(xx, base - 70, 0, 5, sk.fine);
  sk.line(cx - 48, base - 70, cx + 48, base - 70, { over: 0.6 * s, to: sk.fine });
  for (const ax of [cx - 20, cx, cx + 20]) {
    sk.wash("glass", [[ax - 6, base], [ax - 6, base - 18], [ax, base - 25], [ax + 6, base - 18], [ax + 6, base]], 0.5);
    sk.ink.push(`M${f(ax - 6)} ${f(base)}V${f(base - 18)}a6 6 0 0 1 12 0V${f(base)}`);
  }
  sk.line(cx - 30, base - 30, cx + 30, base - 30, { over: 0.6 * s, to: sk.fine });
  for (let k = -2; k < 3; k++) sk.line(cx + k * 13, base - 64, cx + k * 13, base - 32, { over: 0.3 * s, to: sk.fine });
}

// São Vicente de Fora: a white front between two bell towers, the long monastery beside it.
function saoVicente(sk: Sketch, cx: number, base: number): void {
  const s = sk.s;
  const front: Pt[] = [[cx - 40, base - 62], [cx + 40, base - 62], [cx + 40, base], [cx - 40, base]];
  const gable: Pt[] = [[cx - 40, base - 62], [cx, base - 74], [cx + 40, base - 62]];
  const towers = [cx - 58, cx + 40].map((tx): Pt[] => [[tx, base - 96], [tx + 18, base - 96], [tx + 18, base], [tx, base]]);
  const wing: Pt[] = [[cx + 58, base - 44], [cx + 156, base - 44], [cx + 156, base], [cx + 58, base]];
  const wingRoof: Pt[] = [[cx + 56, base - 44], [cx + 158, base - 44], [cx + 150, base - 58], [cx + 64, base - 58]];
  for (const shape of [front, gable, wing, wingRoof, ...towers]) sk.knock.push(poly(shape));
  sk.wash("roof", wingRoof);
  sk.wash("cream", wing);
  sk.wash("violet", [[cx + 58, base - 44], [cx + 156, base - 44], [cx + 156, base - 41], [cx + 58, base - 40]], 0.4);
  sk.wash("limestone", front);
  sk.wash("limestone", gable);
  for (const t of towers) {
    sk.wash("limestone", t);
    sk.wash("shade", [[t[0][0] + 11, t[0][1]], [t[1][0], t[0][1]], [t[1][0], base], [t[0][0] + 11, base]]);
  }
  sk.outline(front, { skip: 0.1 });
  sk.outline(gable, { closed: false });
  sk.outline(wing, { skip: 0.2 });
  sk.outline(wingRoof.slice(0, 3), { closed: false });
  sk.line(...wingRoof[3], ...wingRoof[2], { to: sk.fine });
  for (const rowY of [base - 34, base - 18]) {
    for (let k = 0; k < 9; k++) {
      sk.wash("glass", [[cx + 64 + k * 10.5, rowY], [cx + 68 + k * 10.5, rowY], [cx + 68 + k * 10.5, rowY + 7], [cx + 64 + k * 10.5, rowY + 7]], 0.3);
    }
  }
  for (const t of towers) {
    const x0 = t[0][0];
    sk.outline(t, { skip: 0.05 });
    sk.line(x0 - 2, base - 96, x0 + 20, base - 96, { over: 0.5 * s, to: sk.heavy });
    sk.wash("glass", [[x0 + 5, base - 74], [x0 + 5, base - 86], [x0 + 9, base - 90], [x0 + 13, base - 86], [x0 + 13, base - 74]], 0.3);
    sk.ink.push(`M${f(x0 + 5)} ${f(base - 74)}V${f(base - 86)}a4 4 0 0 1 8 0V${f(base - 74)}`);
    sk.wash("lead", [[x0 + 1, base - 96], [x0 + 4, base - 103], [x0 + 9, base - 106], [x0 + 14, base - 103], [x0 + 17, base - 96]], 0.3);
    sk.ink.push(`M${f(x0 + 1)} ${f(base - 96)}q1 -10 8 -10q7 0 8 10`);
    sk.line(x0 + 9, base - 106, x0 + 9, base - 114, { over: 0.3 * s, to: sk.fine });
    sk.line(x0, base - 58, x0 + 18, base - 58, { over: 0.4 * s, to: sk.fine });
  }
  for (const ax of [cx - 22, cx, cx + 22]) {
    sk.wash("glass", [[ax - 5, base], [ax - 5, base - 14], [ax, base - 19], [ax + 5, base - 14], [ax + 5, base]], 0.4);
    sk.ink.push(`M${f(ax - 5)} ${f(base)}V${f(base - 14)}a5 5 0 0 1 10 0V${f(base)}`);
    sk.rect(ax - 3, base - 46, 6, 10, { over: 0.4 * s, to: sk.fine });
  }
  sk.line(cx - 42, base - 28, cx + 42, base - 28, { over: 0.8 * s, to: sk.fine });
  sk.line(cx - 42, base - 56, cx + 42, base - 56, { over: 0.8 * s, to: sk.fine });
  sk.ink.push(`M${f(cx - 4)} ${f(base - 64)}a4 4 0 1 0 8 0a4 4 0 1 0 -8 0`);
}

// A tree in a courtyard: a cypress's dark flame, or a round crown, scribbled round.
function tree(sk: Sketch, x: number, base: number, kind: "cypress" | "round", rng: Random): void {
  const s = sk.s;
  if (kind === "cypress") {
    const [h, w] = [rng.uniform(46, 60) * s, rng.uniform(8, 11) * s];
    const pts = Array.from({ length: 11 }, (_, k): Pt => {
      const u = k / 10;
      return [x - w * Math.sin(Math.PI * Math.min(1, u * 1.3)) ** 0.6, base - h * u];
    });
    const out = [...pts, ...pts.toReversed().map(([px, py]): Pt => [2 * x - px, py])];
    sk.knock.push(poly(out));
    sk.wash("cypress", out);
    sk.hatch([...out.slice(Math.floor(out.length / 2)), [x, base]], 2 * s, { angle: 70 });
    sk.fine.push("M" + out.filter((_, i) => i % 2 === 0).map(([px, py]) => `${f(px + rng.uniform(-1, 1))} ${f(py)}`).join(" "));
  } else {
    const r = rng.uniform(14, 20) * s;
    const cy = base - r * 1.6;
    const blob = Array.from({ length: 14 }, (_, k): Pt => {
      const a = (k * TAU) / 14;
      return [x + Math.cos(a) * r * rng.uniform(0.82, 1.12), cy + Math.sin(a) * r * 0.8 * rng.uniform(0.82, 1.12)];
    });
    sk.knock.push(poly([...blob, [x + 2 * s, base], [x - 2 * s, base]]));
    sk.wash("leaf", blob);
    sk.wash("leaf-dark", [...blob.slice(1, 7), [x, cy]]);
    sk.line(x, base, x - 1 * s, cy + r * 0.4, { over: 0.3 * s });
    const scribble = Array.from({ length: 30 }, (_, k): Pt => {
      const a = (k * TAU) / 13 + rng.uniform(-0.2, 0.2);
      const rr = r * rng.uniform(0.75, 1.05);
      return [x + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.78];
    });
    sk.fine.push(polyline(scribble));
  }
}

// ---------------------------------------------------------------------------------------------------------
// The planes.

// The far rail of tram 28's track, climbing to the right.
const rail = (x: number) => 548 - 0.05 * (x - 800);

// The far bank, the Tejo, and a sail on it.
function farScene(): Sketch[] {
  const sk = new Sketch(1, 0.5);
  const rng = sk.rng;
  const shore: Pt[] = [];
  for (let x = -60; x <= 1660; x += 20) {
    shore.push([x, 240 + 5 * Math.sin(x / 190 + 1) + 3 * Math.sin(x / 71) - 4 * Math.exp(-(((x - 1300) / 160) ** 2))]);
  }
  sk.wash("shore", [...shore, [1660, 258], [-60, 258]], 1);
  sk.wash("river", [[-60, 252], [1660, 252], [1660, 318], [-60, 318]], 0);
  sk.wash("river-deep", [[-60, 272], [400, 266], [900, 276], [1660, 268], [1660, 318], [-60, 318]], 2);
  // Below the river, the roofs too far down the hill to draw: a warm wash that the rows stand in.
  sk.wash("haze", [[-60, 312], [1660, 312], [1660, 560], [-60, 560]], 0);
  for (let k = 0; k < shore.length - 1; k += 2) if (rng.random() < 0.7) sk.line(...shore[k], ...shore[k + 1], { over: 1, to: sk.fine });
  sk.line(-60, 253, 1660, 254, { over: 0, wobble: 0.8, to: sk.fine });
  // Far buildings and port cranes along the south bank, a few marks only.
  for (let k = 0; k < 26; k++) {
    const bx = rng.uniform(820, 1500);
    sk.dash(bx, 249, 0, -rng.uniform(2, 6), sk.fine);
  }
  for (const cx of [1410, 1446]) {
    sk.line(cx, 250, cx, 228, { over: 0.2, to: sk.fine });
    sk.line(cx - 4, 230, cx + 14, 228, { over: 0.2, to: sk.fine });
  }
  // Light on the water.
  for (let k = 0; k < 60; k++) {
    const y = rng.uniform(258, 330);
    const x = rng.uniform(-40, 1640);
    sk.dash(x, y, rng.uniform(4, 16), 0, sk.fine);
  }
  sk.wash("sail", [[1206, 284], [1216, 256], [1218, 284]], 0.3);
  sk.line(1216, 254, 1216, 286, { over: 0.3, to: sk.fine });
  sk.line(1200, 286, 1224, 286, { over: 0.4, to: sk.fine });
  return [sk];
}

// Row on row of roofs going down to the river, São Vicente and the Panteão standing out of them.
function midScene(): Sketch[] {
  const rng = new Random(10);
  const rowA = new Sketch(11, 0.52);
  row(rowA, -60, 1660, (x) => 352 - 10 * Math.exp(-(((x - 420) / 280) ** 2)) + 7 * Math.sin(x / 130 + 1), rng, 0, { floors: [2, 4], width: [46, 72], tilt: 0.72 });
  const church = new Sketch(12, 0.62);
  saoVicente(church, 0, 0);
  church.place = [540, 404, 1.3];
  const pantheon = new Sketch(13, 0.7);
  pantheon.place = [760, 440, 1.36];
  church.fade = pantheon.fade = false;
  panteao(pantheon, 0, 0);
  const rowB = new Sketch(14, 0.74);
  row(rowB, -60, 1660, (x) => 428 + 10 * Math.sin(x / 170 + 2.2) - 8 * Math.exp(-(((x - 420) / 300) ** 2)), rng, 1, { floors: [2, 4], width: [44, 72], tiles: 0.12, tilt: 0.6 });
  for (const [tx, kind] of [[586, "cypress"], [1010, "round"], [1296, "cypress"]] as const) tree(rowB, tx, 428 + 0.008 * (tx - 800), kind, rng);
  return [rowA, church, pantheon, rowB];
}

// The nearest roofs, the street with its tram rails and wire, and the low wall between.
function groundScene(): Sketch[] {
  const rng = new Random(20);
  const rowC = new Sketch(21, 1.0);
  row(rowC, -60, 1660, (x) => rail(x) - 30, rng, 2, { floors: [3, 4], width: [44, 72], tiles: 0.16, tilt: 0.46 });
  const sk = new Sketch(22, 1);
  const edge = [-60, 1660].map((x): Pt => [x, rail(x) - 24]);
  sk.knock.push(poly([edge[0], edge[1], [1660, 640], [-60, 640]]));
  sk.wash("wall", [[-60, rail(-60) - 32], [1660, rail(1660) - 32], [1660, rail(1660) - 22], [-60, rail(-60) - 22]], 0.5);
  sk.wash("street", [edge[0], edge[1], [1660, 640], [-60, 640]], 0.5);
  sk.line(-60, rail(-60) - 32, 1660, rail(1660) - 32, { over: 0, wobble: 1 });
  sk.line(-60, rail(-60) - 23, 1660, rail(1660) - 23, { over: 0, wobble: 1, to: sk.fine });
  // Calçada: the cobbles' little arcs, thick by the kerb and thinning out.
  for (let k = 0; k < 260; k++) {
    const x = rng.uniform(-40, 1640);
    const y = rail(x) - 20 + rng.random() ** 1.6 * 46;
    sk.fine.push(`M${f(x)} ${f(y)}q1.6 1.4 3.2 0`);
  }
  for (const dy of [0, 7, 15, 22]) sk.line(-60, rail(-60) + dy, 1660, rail(1660) + dy, { over: 0, wobble: 0.4, to: dy === 0 || dy === 15 ? sk.heavy : sk.fine });
  // The wire, its span wires, and a pole now and then.
  const wire = (x: number) => rail(x) - 86;
  sk.line(-60, wire(-60), 1660, wire(1660), { over: 0, wobble: 1.5, to: sk.fine });
  for (const px of [180, 1040, 1560]) {
    sk.line(px, rail(px) - 24, px, wire(px) - 18, { over: 1 });
    sk.line(px, wire(px) - 12, px + 40, wire(px + 40), { over: 0.4, to: sk.fine });
  }
  // Overhead wires slung between the houses.
  for (const [x0, x1, sag] of [[120, 520, 10], [600, 980, 14], [1100, 1560, 12]]) {
    const [y0, y1] = [rail(x0) - 66, rail(x1) - 70];
    sk.fine.push(`M${f(x0)} ${f(y0)}Q${f((x0 + x1) / 2)} ${f((y0 + y1) / 2 + sag * 2)} ${f(x1)} ${f(y1)}`);
  }
  return [rowC, sk];
}

// Bougainvillea over the pergola: heavy masses of magenta along the beam, cascades falling from them, each laid
// in two wet washes, the bracts flicked in with the pen round the edges.
function bougainvillea(sk: Sketch, x0: number, x1: number, beam: number, rng: Random): void {
  for (let x = x0; x < x1; x += rng.uniform(22, 34)) {
    const drop = rng.random() ** 1.6 * 70 * (1 - Math.abs((x - (x0 + x1) / 2) / (x1 - x0)) * 0.8);
    const [cx, cy] = [x, beam + 10 + drop * 0.4];
    const circles: Circle[] = Array.from({ length: 5 }, () => [cx + rng.uniform(-16, 16), cy + rng.uniform(-10, 8), rng.uniform(8, 15)]);
    if (drop > 26) for (const t of [0.5, 1.0]) circles.push([cx + rng.uniform(-10, 10), cy + drop * t, 11 - 4 * t]);
    const outline = unionOutline(circles, cx, cy, 40);
    sk.knock.push(poly(outline));
    sk.wash("bougainvillea", outline, 1.2);
    for (let k = 0; k < 2; k++) {
      const [lx, ly] = [cx + rng.uniform(-18, 18), cy + rng.uniform(-6, 14)];
      sk.wash("leaf", [[lx - 7, ly], [lx, ly - 5], [lx + 8, ly - 1], [lx + 2, ly + 6]], 0.8);
    }
    const shade = outline.filter(([px, py]) => px > cx - 4 && py > cy - 2);
    if (shade.length > 2) sk.wash("bougainvillea-deep", [...shade, [cx, cy]], 1);
    for (let k = 0; k < 3; k++) {
      const [lx, ly] = [cx + rng.uniform(-16, 16), cy + rng.uniform(-8, 12)];
      sk.wash("leaf-dark", [[lx, ly], [lx + 6, ly - 3], [lx + 9, ly + 2], [lx + 3, ly + 5]], 0.6);
    }
    // Bracts: little three-petalled flicks of the pen, thick round the edge, sparse inside.
    for (const [px, py] of outline) {
      if (rng.random() < 0.55) {
        const a = rng.uniform(0, TAU);
        const r = rng.uniform(1.8, 3);
        sk.fine.push(`M${f(px)} ${f(py)}l${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}l${f(Math.cos(a + 2.1) * r)} ${f(Math.sin(a + 2.1) * r)}Z`);
      }
    }
    for (let k = Math.trunc(circles.length * 2.2); k > 0; k--) {
      const [px, py] = [cx + rng.uniform(-14, 14), cy + rng.uniform(-8, drop * 0.9 + 8)];
      const a = rng.uniform(0, TAU);
      sk.fine.push(`M${f(px)} ${f(py)}l${f(Math.cos(a) * 2.4)} ${f(Math.sin(a) * 2.4)}`);
    }
  }
  // Tendrils hanging from the beam.
  for (let k = 0; k < 7; k++) {
    const tx = rng.uniform(x0, x1);
    const ln = rng.uniform(30, 70);
    sk.fine.push(`M${f(tx)} ${f(beam + 6)}q${f(rng.uniform(-10, 10))} ${f(ln * 0.5)} ${f(rng.uniform(-14, 14))} ${f(ln)}`);
  }
}

// The Portas do Sol: a pergola of bougainvillea over a white parapet faced with azulejos on the left, an iron
// railing and a Lisbon lamp on the right.
function nearScene(): Sketch[] {
  const rng = new Random(30);
  const sk = new Sketch(31, 1.2);
  sk.fade = false;
  const top = 522;
  const wall: Pt[] = [[-60, top], [500, top], [500, 640], [-60, 640]];
  sk.knock.push(poly(wall));
  sk.wash("white", wall);
  sk.wash("azulejo", [[18, top + 12], [300, top + 12], [300, 640], [18, 640]], 0.6);
  sk.wash("shade", [[-60, top + 4], [500, top + 4], [500, top + 9], [-60, top + 10]], 0.4);
  sk.line(-60, top, 504, top, { over: 0 });
  sk.line(-60, top + 5, 504, top + 5, { over: 0, to: sk.fine });
  sk.line(500, top, 500, 640, { over: 0 });
  sk.rect(18, top + 12, 282, 60, { to: sk.fine });
  sk.rect(14, top + 9, 290, 66, { to: sk.fine });
  // The pergola: stone posts, a timber beam, and the bougainvillea it carries.
  const beam = 300;
  for (const px of [40, 300]) {
    const post: Pt[] = [[px - 8, top], [px + 8, top], [px + 7, beam + 6], [px - 7, beam + 6]];
    sk.knock.push(poly(post));
    sk.wash("white", post);
    sk.wash("shade", [[px + 1, top], [px + 8, top], [px + 7, beam + 6], [px + 1, beam + 6]]);
    sk.outline(post, { skip: 0.15 });
    sk.hatch([[px + 2, top - 4], [px + 7, top - 4], [px + 6.5, beam + 30], [px + 2, beam + 30]], 2.4);
  }
  const beamPts: Pt[] = [[-60, beam - 4], [390, beam], [390, beam + 9], [-60, beam + 5]];
  sk.knock.push(poly(beamPts));
  sk.wash("bark", beamPts);
  sk.outline(beamPts, { skip: 0.2 });
  for (let k = 0; k < 12; k++) sk.line(-40 + k * 36, beam - 2 + k * 0.3, -26 + k * 36, beam - 16 + k * 0.3, { over: 0.6, to: sk.fine });
  bougainvillea(sk, -50, 380, beam, rng);
  // The railing on the right: two rails, uprights, a ring in every other bay.
  const railTop = 520;
  sk.knock.push(poly([[1180, railTop - 2], [1660, railTop - 8], [1660, 640], [1180, 640]]));
  sk.wash("white", [[1180, railTop + 24], [1660, railTop + 18], [1660, 640], [1180, 640]]);
  sk.line(1180, railTop, 1660, railTop - 6, { over: 0, to: sk.heavy });
  sk.line(1180, railTop + 4, 1660, railTop - 2, { over: 0, to: sk.fine });
  sk.line(1180, railTop + 22, 1660, railTop + 16, { over: 0 });
  for (let x = 1186, bay = 0; x < 1660; x += 12, bay++) {
    const y0 = railTop - ((x - 1180) * 6) / 480;
    sk.line(x, y0 + 4, x, y0 + 22, { over: 0.3, to: sk.fine });
    if (bay % 3 === 1) sk.fine.push(`M${f(x + 1)} ${f(y0 + 13)}a5 5 0 1 0 10 0a5 5 0 1 0 -10 0`);
  }
  // The lamp.
  const lx = 1452;
  sk.heavy.push(`M${lx} 600V384`, `M${lx - 9} 600h18`, `M${lx - 5} 560h10`, `M${lx - 16} 384h32`, `M${lx - 13} 384l-3-28h32l-3 28`,
    `M${lx - 18} 356h36`, `M${lx} 356v-10`, `M${lx - 8} 346h16`, `M${lx - 12} 372h24`, `M${lx} 420q30-6 44-26`);
  sk.wash("lamp", [[lx - 13, 384], [lx - 16, 356], [lx + 16, 356], [lx + 13, 384]], 0.4);
  sk.knock.push(poly([[lx - 3, 600], [lx - 3, 384], [lx + 3, 384], [lx + 3, 600]]));
  sk.knock.push(poly([[lx - 18, 384], [lx - 18, 344], [lx + 18, 344], [lx + 18, 384]]));
  return [sk];
}

// One stratum: bare paper where it stands, its washes, then its ink in three weights.
function render(sk: Sketch): string {
  const k = sk.place ? sk.place[2] : 1;
  const [wInk, wFine, wHeavy] = [f((0.5 + 0.55 * sk.s) / k), f((0.3 + 0.3 * sk.s) / k), f((0.9 + 0.7 * sk.s) / k)];
  const washes = [...sk.washes].map(([colour, paths]) => `<path class="al-w" d="${paths.join("")}" style="fill:var(--al-${colour})"/>`).join("");
  const body =
    `<path d="${sk.knock.join("")}" style="fill:var(--al-paper)"/>` +
    `<g filter="url(#al-wash)"${sk.fade ? ' mask="url(#al-wash-edge)"' : ""}>${washes}</g>` +
    `<g filter="url(#al-ink)" fill="none" stroke-linecap="round" style="stroke:var(--al-ink)">` +
    `<path d="${sk.fine.join("")}" stroke-width="${wFine}" opacity=".8"/>` +
    `<path d="${sk.ink.join("")}" stroke-width="${wInk}"/>` +
    `<path d="${sk.heavy.join("")}" stroke-width="${wHeavy}"/></g>`;
  if (!sk.place) return body;
  const [x, y, scale] = sk.place;
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${scale})">${body}</g>`;
}

// Night: every window can glow. Most switch on one by one as the footer arrives, each at its own moment; the
// rest stay dark until someone moves through the footer's links.
function windowLights(windows: readonly Window[], seed: number, share = 1.0): string {
  const rng = new Random(seed);
  const out: string[] = [];
  for (const [wx, wy, ww, wh] of windows) {
    if (rng.random() > share) continue;
    const warm = rng.choice(["#FFD27A", "#FFC86A", "#FFE3A0", "#F9B860"]);
    const box = `x="${f(wx + 0.5)}" y="${f(wy + 0.5)}" width="${f(ww - 1)}" height="${f(wh - 1)}" fill="${warm}" stroke="${warm}"`;
    if (rng.random() < 0.3) out.push(`<rect class="al-window al-window--sleeper" ${box}/>`);
    else out.push(`<rect class="al-window" ${box} style="--on:${fixed(rng.uniform(4, 80), 0)}%"/>`);
  }
  return out.join("");
}

// Washing strung across the street from wall to wall. Each piece hangs from its own peg and swings.
function laundry(rng: Random, count = 4): string {
  const [lines, cloth]: string[][] = [[], []];
  for (let k = 0; k < count; k++) {
    const x0 = rng.uniform(140, 1440);
    const x1 = x0 + rng.uniform(50, 80);
    const y0 = rail(x0) - rng.uniform(60, 74);
    const y1 = rail(x1) - rng.uniform(60, 74);
    const sag = 6;
    lines.push(`M${f(x0)} ${f(y0)}Q${f((x0 + x1) / 2)} ${f((y0 + y1) / 2 + sag * 2)} ${f(x1)} ${f(y1)}`);
    for (let x = x0 + 6; x < x1 - 8; ) {
      const t = (x - x0) / (x1 - x0);
      const y = (1 - t) ** 2 * y0 + 2 * t * (1 - t) * ((y0 + y1) / 2 + sag * 2) + t * t * y1;
      let [w, h] = [rng.uniform(7, 13), rng.uniform(8, 15)];
      const shape = rng.choice(["shirt", "sheet", "sock"]);
      let d: string;
      if (shape === "shirt") d = `M${f(x)} ${f(y)}h${f(w)}l3 4-3 1v${f(h - 4)}h${f(-w)}v${f(-(h - 4))}l-3-1Z`;
      else if (shape === "sock") {
        d = `M${f(x)} ${f(y)}h4v${f(h * 0.6)}l3 3h-5l-2-3Z`;
        w = 5;
      } else d = `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
      const colour = rng.choice(["a", "b", "c", "d"]);
      cloth.push(
        `<g class="al-cloth" style="transform-origin:${f(x + w / 2)}px ${f(y)}px; --cloth-d:${fixed(-rng.uniform(0, 2.5), 1)}s">` +
          `<path d="${d}" style="fill:var(--al-cloth-${colour}); stroke:var(--al-ink)" stroke-width=".6"/></g>`,
      );
      x += w + rng.uniform(3, 7);
    }
  }
  return `<path d="${lines.join("")}" fill="none" stroke-width=".7" style="stroke:var(--al-ink)"/>` + cloth.join("");
}

function pageStars(): string {
  const rng = new Random(12);
  return Array.from({ length: 26 }, () => {
    const [x, y] = [rng.uniform(2, 98), rng.uniform(1, 70)];
    const r = rng.choice([0.9, 1.1, 1.4]);
    const a = rng.uniform(0.35, 0.75);
    return `radial-gradient(${r}px ${r}px at ${fixed(x, 1)}% ${fixed(y, 1)}%, rgb(255 252 240 / ${fixed(a, 2)}) 70%, transparent)`;
  }).join(",\n      ");
}

// Cold-pressed watercolour paper: a soft relief, lit from the upper left; and the same paper with half the relief,
// for the page above where the words sit.
const PAPER_GRAIN =
  "<feTurbulence type='fractalNoise' baseFrequency='.08' numOctaves='4' seed='3' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.8 0 0 0 -.4'/>";
const TEX_PAPER = tile(
  PAPER_GRAIN +
    "<feDiffuseLighting surfaceScale='2.2' diffuseConstant='.85' lighting-color='#fff'>" +
    "<feDistantLight azimuth='225' elevation='52'/></feDiffuseLighting>",
  300,
  300,
);
const TEX_PAPER_PAGE = tile(
  PAPER_GRAIN +
    "<feDiffuseLighting surfaceScale='1' diffuseConstant='.85' lighting-color='#fff'>" +
    "<feDistantLight azimuth='225' elevation='60'/></feDiffuseLighting>" +
    "<feComponentTransfer><feFuncA type='linear' slope='.45'/></feComponentTransfer>",
  300,
  300,
);

// A loose cerulean wash across the top of the page, as if the sketcher had laid in the sky first. Its lower edge
// wanders and a few clouds are left as bare paper.
function skyWash(): string {
  const rng = new Random(6);
  const edge: Pt[] = [];
  for (let x = 1680; x > -80; x -= rng.uniform(140, 240)) edge.push([x, rng.uniform(120, 190)]);
  edge.push([-80, 150]);
  const band = "M-80 -40L1680 -40L" + smooth(edge).slice(1) + "Z";
  const clouds = [[260, 70, 120, 26], [980, 50, 150, 24], [1380, 96, 110, 22], [640, 120, 80, 16]]
    .map(([cx, cy, rx, ry]) => `<ellipse cx='${f(cx)}' cy='${f(cy)}' rx='${f(rx)}' ry='${f(ry)}'/>`)
    .join("");
  return dataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 420' width='1600' height='420'>" +
      "<defs>" +
      "<filter id='w' x='-5%' y='-10%' width='110%' height='130%' color-interpolation-filters='sRGB'>" +
      "<feTurbulence type='fractalNoise' baseFrequency='.012' numOctaves='3' seed='4' result='n'/>" +
      "<feDisplacementMap in='SourceGraphic' in2='n' scale='38' xChannelSelector='R' yChannelSelector='G' result='wet'/>" +
      "<feMorphology in='wet' operator='erode' radius='2.5' result='inner'/>" +
      "<feComposite in='wet' in2='inner' operator='out' result='edge'/>" +
      "<feTurbulence type='fractalNoise' baseFrequency='.008' numOctaves='2' seed='8' result='b'/>" +
      "<feColorMatrix in='b' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.7 -.25' result='ba'/>" +
      "<feComposite in='wet' in2='ba' operator='in' result='body'/>" +
      "<feMerge><feMergeNode in='body'/><feMergeNode in='edge'/></feMerge></filter>" +
      `<mask id='m'><rect width='1600' height='420' fill='#fff'/><g fill='#000' filter='url(#w)'>${clouds}</g></mask>` +
      "</defs>" +
      `<path d='${band}' fill='rgb(118 172 220 / .5)' filter='url(#w)' mask='url(#m)'/>` +
      "</svg>",
  );
}

// White gouache dots, flicked on with a brush.
function stars(): string {
  const rng = new Random(70);
  const out: string[] = [];
  const placed: Pt[] = [];
  while (placed.length < 34) {
    const [x, y] = [rng.uniform(10, 1590), rng.uniform(10, 480)];
    if (placed.some(([px, py]) => hypot(x - px, y - py) < 80)) continue;
    placed.push([x, y]);
    const rr = rng.choice([0.8, 1, 1.2, 1.5]);
    out.push(`<circle class="al-star" cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" style="--d:${fixed(rng.uniform(0, 5), 1)}s"/>`);
  }
  return out.join("");
}

export function placeholders(): Record<string, string> {
  const [far, mid, ground, near] = [farScene(), midScene(), groundScene(), nearScene()];
  const plane = (sketches: Sketch[]) => sketches.map(render).join("");
  return {
    FAR_ART: plane(far),
    MID_ART: plane(mid),
    GROUND_ART: plane(ground),
    NEAR_ART: plane(near),
    MID_WINDOWS: windowLights(mid[0].windows, 3, 0.3) + windowLights(mid[3].windows, 4, 0.75),
    GROUND_WINDOWS: windowLights(ground[0].windows, 5),
    LAUNDRY: laundry(new Random(8)),
    PAGE_STARS: pageStars(),
    TEX_PAPER,
    TEX_PAPER_PAGE,
    STARS: stars(),
    TEX_SKYWASH: skyWash(),
    RAIL_Y: f(rail(770)),
  };
}

// Scene picker glyph, 16 x 16: tram 28 under its wire.
export const GLYPH =
  '<path d="M2 2.4h12"/><path d="M8 2.4L6.4 5.6"/><rect x="2.6" y="5.6" width="10.8" height="6.6" rx="1.6"/>' +
  '<path d="M2.6 8.6h10.8"/><circle cx="5.4" cy="13.6" r=".9"/><circle cx="10.6" cy="13.6" r=".9"/>';
