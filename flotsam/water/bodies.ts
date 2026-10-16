// Rigid things afloat in the water: the numerals. Each is a set of points sampled over its shape, every point a
// square cell of it with a density of its own, so mass, buoyancy and drag fall where the shape has them.
//
// Each step, at every point: the water there holds it up by the share of the point that is under water, which
// floats a thing lighter than water with that share of it submerged; the water drags it toward the water's own
// motion, so a wave carries it and turns it; and as it moves it knocks aside the water it runs into, losing the
// momentum it gives, so a numeral thrown in splashes and slows. The walls and the other numerals stop it, with a
// little bounce and some friction. A hand holds it by one point, softly, so it hangs from where it is held and
// keeps the hand's speed when let go.

import type { Pt, Water } from "./sim.ts";

export type Shape = {
  points: Float64Array; // x, y pairs about the shape's centre of mass, in px
  weight: Float64Array; // each point's density, as a share of the shape's mean
  edge: Uint8Array; // 1 where a point lies on the outline: only these touch walls and each other
  cell: number; // the side of each point's square
};

const WOOD = 0.55; // density, as a share of water's
const DRAG = 5; // how fast water brings a submerged cell to its own speed, per second
const AIR = 0.08; // and air
const TURN = 3; // angular damping in water, per second
const BOUNCE = 0.25;
const FRICTION = 0.4;
const KNOCK = 0.6; // of the closing speed given to the water a point runs into

export class Body {
  x: number;
  y: number;
  a = 0;
  vx = 0;
  vy = 0;
  w = 0;
  readonly mass: number;
  readonly inertia: number;
  readonly shape: Shape;
  readonly radius: number; // of the smallest circle about the centre holding every point
  // Where a hand holds it: a point on it, and where the hand is.
  held: { ax: number; ay: number; x: number; y: number; vx: number; vy: number } | null = null;
  wet = 0; // the share of it under water, last step

  constructor(shape: Shape, at: Pt, angle = 0) {
    this.shape = shape;
    this.x = at.x;
    this.y = at.y;
    this.a = angle;
    const { points, weight, cell } = shape;
    let M = 0, I = 0, r = 0;
    for (let k = 0; k < points.length; k += 2) {
      const m = WOOD * cell * cell * weight[k / 2], d2 = points[k] ** 2 + points[k + 1] ** 2;
      M += m;
      I += m * (d2 + (cell * cell) / 6);
      r = Math.max(r, Math.sqrt(d2));
    }
    this.mass = M;
    this.inertia = I;
    this.radius = r + cell;
  }

  // A point on the body, in the world, from its place on the shape.
  world(lx: number, ly: number): Pt {
    const c = Math.cos(this.a), s = Math.sin(this.a);
    return { x: this.x + c * lx - s * ly, y: this.y + s * lx + c * ly };
  }

  // An impulse at an offset (rx, ry) from the centre.
  push(jx: number, jy: number, rx: number, ry: number): void {
    this.vx += jx / this.mass;
    this.vy += jy / this.mass;
    this.w += (rx * jy - ry * jx) / this.inertia;
  }

  // How a point at offset (rx, ry) moves.
  velocity(rx: number, ry: number): Pt {
    return { x: this.vx - this.w * ry, y: this.vy + this.w * rx };
  }

  // The impulse along a normal that stops a point closing at speed vn, with some bounce, and the friction along
  // the tangent, no more than the normal allows.
  contact(rx: number, ry: number, nx: number, ny: number, scale = 1): void {
    const v = this.velocity(rx, ry);
    const vn = v.x * nx + v.y * ny;
    if (vn >= 0) return;
    const rn = rx * ny - ry * nx;
    const j = (-(1 + BOUNCE) * vn) / (1 / this.mass + (rn * rn) / this.inertia) * scale;
    const tx = -ny, ty = nx, vt = v.x * tx + v.y * ty;
    const rt = rx * ty - ry * tx;
    const jt = Math.max(-FRICTION * j, Math.min(FRICTION * j, -vt / (1 / this.mass + (rt * rt) / this.inertia)));
    this.push(nx * j + tx * jt, ny * j + ty * jt, rx, ry);
  }
}

export function step(bodies: Body[], water: Water, dt: number, ox: number, oy: number): void {
  const g = water.P.gravity;
  for (const b of bodies) {
    const { points, cell } = b.shape;
    const area = cell * cell, c = Math.cos(b.a), s = Math.sin(b.a);
    let fx = 0, fy = b.mass * g, tau = 0, wet = 0;
    for (let k = 0; k < points.length; k += 2) {
      const rx = c * points[k] - s * points[k + 1], ry = s * points[k] + c * points[k + 1];
      const px = b.x + rx, py = b.y + ry;
      const v = b.velocity(rx, ry);
      const here = water.probe(px, py);
      const f = Math.min(1, here.full);
      wet += f;
      // Held up by the water it displaces; dragged toward the water's motion, or slowed by the air.
      let ex = 0, ey = -g * area * f;
      ex += area * (DRAG * f * (here.vx - v.x) - AIR * (1 - f) * v.x);
      ey += area * (DRAG * f * (here.vy - v.y) - AIR * (1 - f) * v.y);
      fx += ex;
      fy += ey;
      tau += rx * ey - ry * ex;
      // Running into water, it knocks the water aside and gives up the momentum.
      if (f > 0.05 && (v.x || v.y)) {
        const p = water.bump(px, py, v.x, v.y, Math.max(cell * 1.5, water.h), KNOCK / Math.max(1, (water.h / cell) ** 2 / 4));
        fx -= p.x / dt;
        fy -= p.y / dt;
        tau -= (rx * p.y - ry * p.x) / dt;
      }
    }
    b.wet = wet / (points.length / 2);
    b.vx += (fx / b.mass) * dt;
    b.vy += (fy / b.mass) * dt;
    b.w += (tau / b.inertia) * dt;
    b.w *= Math.exp(-TURN * b.wet * dt);
    if (b.held) hold(b, dt);
  }

  // The walls, then each other: only the outline touches.
  for (const b of bodies) {
    const { points, edge, cell } = b.shape;
    const r = cell * 0.5, c = Math.cos(b.a), s = Math.sin(b.a);
    const x0 = ox + r, x1 = ox + water.W - r, y0 = oy + r, y1 = oy + water.H - r;
    let mx = 0, my = 0;
    for (let k = 0; k < points.length; k += 2) {
      if (!edge[k / 2]) continue;
      const rx = c * points[k] - s * points[k + 1], ry = s * points[k] + c * points[k + 1];
      const px = b.x + rx, py = b.y + ry;
      if (px < x0) b.contact(rx, ry, 1, 0), (mx = Math.max(mx, x0 - px));
      if (px > x1) b.contact(rx, ry, -1, 0), (mx = Math.min(mx, x1 - px));
      if (py < y0) b.contact(rx, ry, 0, 1), (my = Math.max(my, y0 - py));
      if (py > y1) b.contact(rx, ry, 0, -1), (my = Math.min(my, y1 - py));
    }
    b.x += mx;
    b.y += my;
  }
  for (let i = 0; i < bodies.length; i++)
    for (let j = i + 1; j < bodies.length; j++) collide(bodies[i], bodies[j]);

  for (const b of bodies) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.a += b.w * dt;
  }
}

// A hand holds the body by one point: each step the point is given, softly, the velocity that would carry it to
// the hand within a few hundredths of a second, plus the hand's own.
function hold(b: Body, dt: number): void {
  const h = b.held!;
  const c = Math.cos(b.a), s = Math.sin(b.a);
  const rx = c * h.ax - s * h.ay, ry = s * h.ax + c * h.ay;
  const v = b.velocity(rx, ry);
  const T = 0.045;
  const dvx = (h.x - (b.x + rx)) / T + h.vx - v.x;
  const dvy = (h.y - (b.y + ry)) / T + h.vy - v.y;
  // The point's effective mass, from K = I/m + [ry², -rx·ry; -rx·ry, rx²]/I.
  const im = 1 / b.mass, iI = 1 / b.inertia;
  const k11 = im + ry * ry * iI, k12 = -rx * ry * iI, k22 = im + rx * rx * iI;
  const det = k11 * k22 - k12 * k12;
  const beta = Math.min(1, dt * 40);
  const jx = ((k22 * dvx - k12 * dvy) / det) * beta;
  const jy = ((k11 * dvy - k12 * dvx) / det) * beta;
  b.push(jx, jy, rx, ry);
  b.w *= Math.exp(-4 * dt); // held things do not spin
}

// Two bodies touch where outline points of each come within a cell of each other; each such touch pushes them
// apart along the line between the points.
function collide(A: Body, B: Body): void {
  if (Math.hypot(A.x - B.x, A.y - B.y) > A.radius + B.radius) return;
  const pa = outline(A), pb = outline(B);
  const reach = (A.shape.cell + B.shape.cell) * 0.5;
  let sx = 0, sy = 0, n = 0;
  for (let i = 0; i < pa.length; i += 4)
    for (let j = 0; j < pb.length; j += 4) {
      const dx = pb[j] - pa[i], dy = pb[j + 1] - pa[i + 1], d2 = dx * dx + dy * dy;
      if (d2 >= reach * reach || d2 < 1e-9) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
      const rax = pa[i + 2], ray = pa[i + 3], rbx = pb[j + 2], rby = pb[j + 3];
      const va = A.velocity(rax, ray), vb = B.velocity(rbx, rby);
      const vn = (vb.x - va.x) * nx + (vb.y - va.y) * ny;
      if (vn < 0) {
        const ra = rax * ny - ray * nx, rb = rbx * ny - rby * nx;
        const k = 1 / A.mass + 1 / B.mass + (ra * ra) / A.inertia + (rb * rb) / B.inertia;
        const jn = (-(1 + BOUNCE) * vn) / k / 4; // shared among the few touches a contact makes
        A.push(-nx * jn, -ny * jn, rax, ray);
        B.push(nx * jn, ny * jn, rbx, rby);
      }
      sx += nx * (reach - d);
      sy += ny * (reach - d);
      n++;
    }
  // And apart, so they never rest inside each other.
  if (n) {
    const total = A.mass + B.mass, k = 0.5 / n;
    A.x -= sx * k * (B.mass / total);
    A.y -= sy * k * (B.mass / total);
    B.x += sx * k * (A.mass / total);
    B.y += sy * k * (A.mass / total);
  }
}

// The outline's points in the world, each with its offset from the centre: x, y, rx, ry.
function outline(b: Body): Float64Array {
  const { points, edge } = b.shape;
  const c = Math.cos(b.a), s = Math.sin(b.a);
  const out = new Float64Array(edge.reduce((n, e) => n + e, 0) * 4);
  let o = 0;
  for (let k = 0; k < points.length; k += 2) {
    if (!edge[k / 2]) continue;
    const rx = c * points[k] - s * points[k + 1], ry = s * points[k] + c * points[k + 1];
    out[o++] = b.x + rx;
    out[o++] = b.y + ry;
    out[o++] = rx;
    out[o++] = ry;
  }
  return out;
}
