// The water's own thread. It steps the water and what floats in it on its own clock, 240 steps a second, toward
// wherever the page last said the tank is, and sends back where everything is. The page draws the latest it has,
// so a slow step slows the water and never the page.
//
// When nothing moves (the water still, the window still, no hand in it) the thread sleeps and sends nothing,
// so a page left open costs nothing.

import { Body, step as float, type Shape } from "./bodies.ts";
import { Water, type Options, type Pt } from "./sim.ts";

export type Hand = { on: boolean; x: number; y: number; vx: number; vy: number };
export type Hold = { body: number; ax: number; ay: number } | null;

export type ToWater =
  | { type: "start"; W: number; H: number; origin: Pt; options?: Partial<Options>; shapes: { shape: Shape; at: Pt; angle: number }[] }
  | { type: "tank"; origin: Pt; hand: Hand; hold: Hold }
  | { type: "return"; buffer: Float32Array };

export type FromWater = {
  type: "frame";
  water: Float32Array; // x, y, speed (a share of a brisk pace) for every particle, on the screen
  bodies: Float64Array; // x, y, angle for every body, on the screen
  N: number;
  h: number;
  steps: number;
  ms: number;
  stir: number; // mean speed of the water, px/s
  rocking: number; // the fastest numeral's speed, its turning included, px/s
};

const RATE = 240; // steps a second
const MOST = 16; // steps a tick
const TICK = 1000 / 60;
// Below these, in interaction radii a second, the water's jitter and a numeral's rocking are too small to see:
// the water's mean speed, and a numeral's speed and the speed of its far end as it turns.
const CALM = 0.8;
const STILL = 0.5;

let water: Water;
let bodies: Body[] = [];
let target: Pt, at: Pt;
let hand: Hand = { on: false, x: 0, y: 0, vx: 0, vy: 0 };
let last = 0;
let owed = 0; // seconds of water not yet stepped
let running = false;
let quiet = 0;
const spare: Float32Array[] = [];

onmessage = ({ data: m }: MessageEvent<ToWater>) => {
  if (m.type === "start") {
    water = new Water(m.W, m.H, m.origin, m.options);
    bodies = m.shapes.map(({ shape, at, angle }) => new Body(shape, at, angle));
    target = at = m.origin;
    last = performance.now();
    quiet = 0;
    if (!running) (running = true), setTimeout(tick, 0);
  } else if (m.type === "tank") {
    target = m.origin;
    hand = m.hand;
    for (const [i, b] of bodies.entries()) {
      const held = m.hold?.body === i;
      b.held = held ? { ax: m.hold!.ax, ay: m.hold!.ay, x: hand.x + target.x, y: hand.y + target.y, vx: hand.vx, vy: hand.vy } : null;
    }
  } else if (m.type === "return") spare.push(m.buffer);
};

function tick() {
  const now = performance.now();
  const elapsed = Math.min((now - last) / 1000, 1 / 20);
  last = now;
  let dx = target.x - at.x, dy = target.y - at.y;
  const holding = bodies.some((b) => b.held);

  // Asleep: nothing to do until something moves.
  if (!dx && !dy && !hand.on && !holding && quiet > 30) {
    setTimeout(tick, TICK);
    return;
  }

  // The walls may sweep only so far in a tick: what no hand could move the window by (a jump to another screen,
  // the window placed as it opens) carries everything along.
  const reach = MOST * 0.35 * water.h, d = Math.hypot(dx, dy);
  if (d > reach) {
    const k = (d - reach) / d;
    water.carry(dx * k, dy * k);
    for (const b of bodies) (b.x += dx * k), (b.y += dy * k);
    at = { x: at.x + dx * k, y: at.y + dy * k };
    dx -= dx * k;
    dy -= dy * k;
  }
  // Steps of one length, a 240th of a second, as many as the time since the last tick holds: the water reads its
  // velocities back from how far it moved, so a step of changing length would read the same push as a different
  // speed, and the water would never quite come to rest. Only when the walls must sweep further than a step
  // allows are the steps of this tick made shorter, and more.
  owed += elapsed;
  let n = Math.floor(owed * RATE), dt = 1 / RATE;
  owed -= n * dt;
  const sweeps = Math.ceil(Math.hypot(dx, dy) / (0.35 * water.h));
  if (sweeps > n) {
    const span = Math.max(n, 1) * dt;
    n = Math.min(MOST, sweeps);
    dt = span / n;
  }
  for (let k = 1; k <= n; k++) {
    const ox = at.x + (dx * k) / n, oy = at.y + (dy * k) / n;
    water.step(dt, ox, oy);
    // A hand in the water, not holding anything, stirs it.
    if (hand.on && !holding) water.drag(ox + hand.x, oy + hand.y, hand.vx, hand.vy, 3 * water.h, 0.2);
    for (const b of bodies) if (b.held) (b.held.x = ox + hand.x), (b.held.y = oy + hand.y);
    float(bodies, water, dt, ox, oy);
  }
  at = { ...target }; // exactly, or rounding would keep the tank forever a hair from where it is, and awake

  const stir = water.stir();
  const rocking = Math.max(0, ...bodies.map((b) => Math.hypot(b.vx, b.vy) + Math.abs(b.w) * b.radius));
  quiet = stir < CALM * water.h && rocking < STILL * water.h && !dx && !dy ? quiet + 1 : 0;

  const { N, X, Y, VX, VY, h } = water;
  let out = spare.pop();
  if (!out || out.length !== N * 3) out = new Float32Array(N * 3);
  const brisk = h * 30;
  for (let i = 0; i < N; i++) {
    out[3 * i] = X[i];
    out[3 * i + 1] = Y[i];
    out[3 * i + 2] = Math.min(1, Math.hypot(VX[i], VY[i]) / brisk);
  }
  const placed = new Float64Array(bodies.length * 3);
  bodies.forEach((b, i) => placed.set([b.x, b.y, b.a], i * 3));
  const ms = performance.now() - now;
  const frame: FromWater = { type: "frame", water: out, bodies: placed, N, h, steps: n, ms, stir, rocking };
  postMessage(frame, { transfer: [out.buffer] });
  setTimeout(tick, Math.max(0, TICK - ms));
}
