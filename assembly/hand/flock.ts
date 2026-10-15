// The hands when they are not at work: circling a point while they wait to begin, and, once the work is done,
// flying as one flock after the reader's own pointer. The flock is Reynolds's boids (1987): each hand keeps clear
// of its nearest neighbours, turns to fly the way they fly, and draws toward where they are, and all of them seek
// the same target. Every arrow points the way it flies.

import type { Clock } from "./clock.ts";
import type { Hand } from "./hand.ts";
import type { Pt } from "./motion.ts";
import { ARROW_AXIS } from "./pointer.ts";

const deg = (rad: number) => (rad * 180) / Math.PI;

// Circles the hands about `centre` until `until` settles: a loose ring, each hand at its own radius and pace,
// so the ring breathes instead of turning like a wheel.
export function circle(hands: readonly Hand[], clock: Clock, centre: () => Pt, until: Promise<void>): void {
  const rings = hands.map((h, i) => ({
    phase: (i / hands.length) * Math.PI * 2 + h.random.normal(0, 0.12),
    radius: h.random.uniform(78, 138),
    pace: h.random.uniform(0.75, 1.05),
    wobble: h.random.uniform(0, Math.PI * 2),
  }));
  const t0 = clock.now;
  const stop = clock.each((now) => {
    const c = centre();
    const t = now - t0;
    hands.forEach((h, i) => {
      const r = rings[i];
      const a = r.phase + t * r.pace;
      const rad = r.radius * (1 + 0.08 * Math.sin(t * 1.7 + r.wobble));
      h.fly({ x: c.x + rad * Math.cos(a), y: c.y + rad * Math.sin(a) }, deg(a) + 90);
    });
  });
  until.then(stop);
}

// Each hand's own way about the target: how far out it keeps, how fast it goes round, and which way. Seeking these
// points instead of one, the flock swirls about the target as a school does, and never packs into a block.
type Orbit = { r: number; w: number; a: number };

export class Flock {
  // Where the flock is bound, in page coordinates.
  target: Pt;
  readonly #hands: readonly Hand[];
  readonly #v = new Map<Hand, Pt>();
  readonly #orbits = new Map<Hand, Orbit>();
  readonly #heads = new Map<Hand, number>();
  #t = 0;

  constructor(hands: readonly Hand[], clock: Clock, target: Pt) {
    this.#hands = hands;
    this.target = target;
    // Most go round one way, a few the other, so the school turns in on itself.
    for (const h of hands) {
      this.#v.set(h, { x: h.random.normal(0, 60), y: h.random.normal(0, 60) });
      const way = h.random.chance(0.8) ? 1 : -1;
      this.#orbits.set(h, { r: h.random.uniform(18, 96), w: way * h.random.uniform(1.1, 2.2), a: h.random.uniform(0, Math.PI * 2) });
    }
    let last = clock.now;
    clock.each((now) => {
      this.#step(Math.min(now - last, 1 / 30));
      last = now;
    });
  }

  #step(dt: number) {
    if (dt <= 0) return;
    this.#t += dt;
    const SEE = 60;
    const ROOM = 15;
    const FAST = 620;
    const PULL = 900;
    for (const h of this.#hands) {
      const v = this.#v.get(h)!;
      const o = this.#orbits.get(h)!;
      const aim = { x: this.target.x + o.r * Math.cos(o.a + o.w * this.#t), y: this.target.y + o.r * Math.sin(o.a + o.w * this.#t) };
      let sepX = 0, sepY = 0, alX = 0, alY = 0, coX = 0, coY = 0, n = 0;
      for (const o of this.#hands) {
        if (o === h) continue;
        const dx = o.pos.x - h.pos.x;
        const dy = o.pos.y - h.pos.y;
        const d = Math.hypot(dx, dy);
        if (d > SEE) continue;
        n++;
        const ov = this.#v.get(o)!;
        alX += ov.x;
        alY += ov.y;
        coX += dx;
        coY += dy;
        if (d < ROOM && d > 0) {
          sepX -= (dx / d) * (ROOM - d);
          sepY -= (dy / d) * (ROOM - d);
        }
      }
      // Toward its own point about the target, easing in as it nears.
      const tx = aim.x - h.pos.x;
      const ty = aim.y - h.pos.y;
      const td = Math.hypot(tx, ty) || 1;
      const want = Math.min(FAST, td * 3);
      let ax = (tx / td) * want - v.x;
      let ay = (ty / td) * want - v.y;
      ax += sepX * 26;
      ay += sepY * 26;
      if (n) {
        ax += (alX / n - v.x) * 0.9 + coX / n;
        ay += (alY / n - v.y) * 0.9 + coY / n;
      }
      const a = Math.hypot(ax, ay);
      if (a > PULL * 4) {
        ax *= (PULL * 4) / a;
        ay *= (PULL * 4) / a;
      }
      v.x += ax * dt * 1.6;
      v.y += ay * dt * 1.6;
      const s = Math.hypot(v.x, v.y);
      if (s > FAST) {
        v.x *= FAST / s;
        v.y *= FAST / s;
      }
      const p = { x: h.pos.x + v.x * dt, y: h.pos.y + v.y * dt };
      // Every arrow points the way it goes; one barely moving keeps the heading it had.
      h.fly(p, s > 4 ? deg(Math.atan2(v.y, v.x)) : (this.#heads.get(h) ?? ARROW_AXIS));
      if (s > 4) this.#heads.set(h, deg(Math.atan2(v.y, v.x)));
    }
  }
}
