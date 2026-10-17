// The rain: characters falling, each trailing a string of rings that narrows behind it; breaking on the
// umbrella and running off its rim; lying down where they land and fading, rings spreading on the ground
// where they struck. It is worked out in the figure's 1000 by 1000 page, a step at a time, and drawn in two
// layers: the rain beyond the figure, drawn before it, and the rain before it, drawn after.

import { GROUND, type Pt } from "./figure.ts";

const FAR = 0.55, NEAR = 1.35;   // depth, as a drop's scale; the figure stands at 0.92
const BEHIND = 0.86;             // nearer than this a drop is drawn before the figure
const UMBRELLA = 1.12;           // between BEHIND and this it can strike the canopy
const GLYPH = 26;                // a character's size at depth 1
const GRAVITY = 900;             // for what runs off the canopy and what splashes
const LIE = 1.6;                 // seconds a character lies on the ground
const SPREAD = 1.3;              // seconds a ring takes to spread and go
const SPARK = 0.45;              // seconds a splash flies

const Mode = { Fall: 0, Run: 1, Lie: 2, Spark: 3 } as const;
type Mode = (typeof Mode)[keyof typeof Mode];

type Drop = {
  x: number; y: number; z: number;
  vx: number; vy: number;
  ay: number;                    // its fall's acceleration: none for rain, GRAVITY for what drips
  glyph: number; turn: number;
  mode: Mode; age: number;
  s: number; dir: number; speed: number;   // while it runs: along the canopy, which way, how fast
  wet: boolean;                  // has met the canopy once, and will not again
};
type Ring = { x: number; y: number; z: number; age: number };

export type Options = {
  /** How many characters there are to fall. */
  glyphs: number;
  /** Characters begun each second. */
  rate: number;
  /** The canopy's top in the page at a time in seconds, wherever the umbrella then leans. */
  canopy: (t: number) => Pt[];
};

export class Rain {
  t = 0;
  #drops: Drop[] = [];
  #rings: Ring[] = [];
  #owed = 0;
  #top: Pt[] = [];
  #lengths: number[] = [];

  readonly o: Options;

  constructor(o: Options) {
    this.o = o;
    this.#canopy();
  }

  /** Runs the rain on for `seconds` without drawing, so it can open already falling. */
  warm(seconds: number, dt: number): void {
    for (let s = 0; s < seconds; s += dt) this.step(dt);
  }

  step(dt: number): void {
    this.t += dt;
    this.#canopy();
    for (this.#owed += this.o.rate * dt; this.#owed >= 1; this.#owed--) this.#begin();
    const keep: Drop[] = [];
    for (const d of this.#drops) if (this.#move(d, dt)) keep.push(d);
    this.#drops = keep;
    this.#rings = this.#rings.filter((r) => (r.age += dt) < SPREAD);
  }

  /**
   * Draws one layer of the rain, `near` or not, at `k` device pixels to the page's unit: the rings of every
   * trail gathered into a few paths by how bright they are, then the ripples, then each character from its
   * sprite. All in white: the stage tints the layer with the ink after.
   */
  draw(c: CanvasRenderingContext2D, near: boolean, k: number, sprites: Sprites): void {
    const mine = (z: number) => z >= BEHIND === near;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.strokeStyle = "#fff";
    c.lineWidth = Math.max(1, 1.05 * k);
    const trails = new Trails();
    for (const d of this.#drops) if (mine(d.z)) trail(d, trails, k);
    trails.stroke(c);

    for (const r of this.#rings) {
      if (!mine(r.z)) continue;
      const a = r.age / SPREAD;
      for (const [lag, alpha] of [[0, 0.75], [0.16, 0.45]]) {
        const b = a - lag / SPREAD;
        if (b <= 0) continue;
        const rx = (4 + 46 * (1 - (1 - b) ** 3)) * r.z * k;
        c.globalAlpha = alpha * (1 - b);
        c.beginPath();
        c.ellipse(r.x * k, r.y * k, rx, rx * 0.17, 0, 0, 2 * Math.PI);
        c.stroke();
      }
    }

    for (const d of this.#drops) {
      if (!mine(d.z)) continue;
      let size = GLYPH * d.z, squash = 1, alpha = 1;
      if (d.mode === Mode.Spark) (size *= 0.42), (alpha = 1 - d.age / SPARK);
      if (d.mode === Mode.Lie) (squash = 0.38), (alpha = (1 - d.age / LIE) ** 1.5);
      const sprite = sprites.at[d.glyph];
      const sc = (size * k) / sprites.em, cos = Math.cos(d.turn) * sc, sin = Math.sin(d.turn) * sc;
      c.globalAlpha = alpha;
      c.setTransform(cos, squash * sin, -sin, squash * cos, d.x * k, d.y * k);
      c.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    }
    c.restore();
  }

  // The canopy's top where it now leans, and the length along it to each of its points.
  #canopy(): void {
    this.#top = this.o.canopy(this.t);
    this.#lengths = [0];
    for (let i = 1; i < this.#top.length; i++) this.#lengths.push(this.#lengths[i - 1] + dist(this.#top[i - 1], this.#top[i]));
  }

  #begin(): void {
    const z = FAR + (NEAR - FAR) * Math.random() ** 1.3;
    const x = 500 + 760 * (Math.random() + Math.random() - 1);
    const vy = (520 + 160 * Math.random()) * z ** 0.7;
    this.#drops.push({
      x, y: -40 - 260 * Math.random(), z,
      // the rain opens out a little as it comes, as if seen from under it
      vx: (x - 500) * 0.16, vy, ay: 0,
      glyph: Math.floor(Math.random() * this.o.glyphs), turn: (Math.random() - 0.5) * 0.5,
      mode: Mode.Fall, age: 0, s: 0, dir: 0, speed: 0, wet: false,
    });
  }

  /** Moves a drop on by `dt`; false once it is gone. */
  #move(d: Drop, dt: number): boolean {
    d.age += dt;
    switch (d.mode) {
      case Mode.Fall: {
        const py = d.y;
        d.vy += d.ay * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (!d.wet && d.z >= BEHIND && d.z < UMBRELLA) {
          const hit = this.#strike(d.x, py, d.y);
          if (hit !== null) this.#run(d, hit);
        }
        const ground = groundAt(d.z);
        if (d.mode === Mode.Fall && d.y >= ground) {
          Object.assign(d, { y: ground, mode: Mode.Lie, age: 0 });
          if (Math.random() < 0.4) this.#rings.push({ x: d.x, y: ground, z: d.z, age: 0 });
        }
        return d.x > -200 && d.x < 1200;
      }
      case Mode.Run: {
        // down the canopy, faster the steeper it falls away, and off the rim
        const end = this.#lengths[this.#lengths.length - 1];
        const [p, tangent] = this.#along(d.s);
        d.speed += 420 * Math.max(0.15, tangent[1] * d.dir) * dt;
        d.s += d.dir * d.speed * dt;
        if (d.s <= 0 || d.s >= end) {
          const [q, u] = this.#along(Math.min(end, Math.max(0, d.s)));
          Object.assign(d, { x: q[0], y: q[1], vx: u[0] * d.dir * d.speed, vy: Math.max(40, u[1] * d.dir * d.speed), ay: GRAVITY, mode: Mode.Fall });
          return true;
        }
        [d.x, d.y] = [p[0], p[1] - 5 * d.z];
        d.vx = tangent[0] * d.dir * d.speed;
        d.vy = tangent[1] * d.dir * d.speed;
        return true;
      }
      case Mode.Lie:
        return d.age < LIE;
      case Mode.Spark:
        d.vy += GRAVITY * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        return d.age < SPARK && d.y < groundAt(d.z);
    }
  }

  /** Where along the canopy a drop falling at x from y0 to y1 meets it, or null if it does not. */
  #strike(x: number, y0: number, y1: number): number | null {
    const top = this.#top;
    for (let i = 1; i < top.length; i++) {
      const [a, b] = [top[i - 1], top[i]];
      if (x < a[0] || x > b[0]) continue;
      const f = (x - a[0]) / (b[0] - a[0]), y = a[1] + f * (b[1] - a[1]);
      return y0 <= y && y1 >= y ? this.#lengths[i - 1] + f * (this.#lengths[i] - this.#lengths[i - 1]) : null;
    }
    return null;
  }

  // Struck: the drop runs the way the canopy falls away, and a few pieces of it splash up.
  #run(d: Drop, s: number): void {
    const [p, u] = this.#along(s);
    Object.assign(d, { mode: Mode.Run, s, dir: u[1] >= 0 ? 1 : -1, speed: 30 + 50 * Math.random(), wet: true, age: 0 });
    for (let n = Math.floor(Math.random() * 4); n > 0; n--)
      this.#drops.push({
        x: p[0], y: p[1], z: d.z,
        vx: (Math.random() - 0.5) * 300 + u[0] * d.dir * 60, vy: -120 - 200 * Math.random(), ay: GRAVITY,
        glyph: Math.floor(Math.random() * this.o.glyphs), turn: (Math.random() - 0.5) * 2,
        mode: Mode.Spark, age: 0, s: 0, dir: 0, speed: 0, wet: true,
      });
  }

  /** The point at length s along the canopy's top, and the unit tangent there. */
  #along(s: number): [Pt, Pt] {
    const top = this.#top, len = this.#lengths;
    let i = 1;
    while (i < len.length - 1 && len[i] < s) i++;
    const [a, b] = [top[i - 1], top[i]], l = len[i] - len[i - 1];
    const f = (s - len[i - 1]) / l;
    return [[a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])], [(b[0] - a[0]) / l, (b[1] - a[1]) / l]];
  }
}

/** Where on the page the ground lies for a drop at depth z: nearer drops land lower. */
const groundAt = (z: number) => GROUND + (z - 0.92) * 140;

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Each trail's rings, gathered into four paths by brightness, so a canvas strokes four times, not thousands. */
class Trails {
  paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
  ring(x: number, y: number, r: number, bright: number): void {
    const p = this.paths[Math.min(3, Math.floor(bright * 4))];
    p.moveTo(x + r, y);
    p.arc(x, y, r, 0, 2 * Math.PI);
  }
  stroke(c: CanvasRenderingContext2D): void {
    this.paths.forEach((p, i) => ((c.globalAlpha = 0.25 + 0.25 * i), c.stroke(p)));
  }
}

/**
 * A drop's trail: rings strung back along its path, largest at its head, each a little further from the
 * last, and the string longer the faster it goes. What has landed draws its trail in after it.
 */
function trail(d: Drop, out: Trails, k: number): void {
  let n: number;
  if (d.mode === Mode.Fall) n = d.wet ? 9 : Math.round(18 + 10 * d.z);
  else if (d.mode === Mode.Run) n = 6;
  else if (d.mode === Mode.Spark) n = 4;
  else n = Math.round((18 + 10 * d.z) * Math.max(0, 1 - d.age / 0.16));
  if (n < 2) return;
  const v = Math.hypot(d.vx, d.vy) || 1;
  const ux = d.mode === Mode.Lie ? 0 : -d.vx / v, uy = d.mode === Mode.Lie ? -1 : -d.vy / v;
  const reach = Math.min(1.4, Math.max(0.35, (d.mode === Mode.Lie ? 600 : v) / 620));
  let s = GLYPH * d.z * 0.3;
  const scale = d.mode === Mode.Spark ? 0.45 : 1;
  for (let i = 0; i < n; i++) {
    const f = 1 - i / (n - 1);
    const r = (0.45 + 3.4 * f ** 1.7) * d.z * scale;
    out.ring((d.x + ux * s) * k, (d.y + uy * s) * k, r * k, 0.15 + 0.85 * f);
    s += (Math.max(r * 1.5, 3.2 * d.z) + 1.2) * reach * scale;
  }
}

/**
 * Each character drawn once, in white, at about the size it is shown, for the rain to stamp: glowing by
 * `glow` of its size, which suits light on a dark sky and is kept low for ink on a pale one.
 */
export type Sprites = { at: HTMLCanvasElement[]; em: number };

export function sprites(chars: string[], font: string, k: number, glow: number): Sprites {
  const em = Math.max(16, Math.min(120, Math.ceil(GLYPH * NEAR * k)));
  const size = Math.ceil(em * 1.6);
  const at = chars.map((ch) => {
    const canvas = Object.assign(document.createElement("canvas"), { width: size, height: size });
    const c = canvas.getContext("2d")!;
    c.font = `${em}px ${font}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = c.shadowColor = "#fff";
    c.shadowBlur = em * glow;
    c.fillText(ch, size / 2, size / 2);
    c.shadowBlur = 0;
    c.fillText(ch, size / 2, size / 2);
    return canvas;
  });
  return { at, em };
}
