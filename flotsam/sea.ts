// The life of the sea floor, on the page's own thread: fronds that bend with the water and flop when it leaves
// them, fish that swim where there is water and fall when there is none, and a crab that scuttles about the sand.
// None of it is a loop played over and over: each asks the water (by probes, answered on the water's thread)
// how much water there is where it is and how it moves, and does what that water would make it do.

// A frond's segments, in radians a second², per radian of lean or per px/s of water across them.
const UPRIGHT = 40; // a submerged frond stands itself up: it is buoyant
const DROOP = 96; // out of the water it falls over the way it leans
const FLOW = 0.36; // the water across a segment turns it
const BEND = 70; // each segment keeps in line with the one below
const SWAY = 3.2; // and every turn is damped, per second
const FALL = 1600; // px/s², a fish out of water

type Segment = { g: SVGGElement; y: number; a: number; w: number };
type Frond = { el: HTMLElement; at: number; scale: number; foot: { x: number; y: number }; segments: Segment[]; length: number };
type Fish = {
  el: HTMLElement;
  tail: SVGGElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  goal: { x: number; y: number };
  face: number;
  beat: number;
  half: { w: number; h: number };
};
type Crab = { el: HTMLElement; legs: SVGGElement[]; x: number; goal: number; rest: number; step: number; half: { w: number; h: number } };

export class Sea {
  readonly #root: HTMLElement;
  readonly #floor: HTMLElement;
  #fronds: Frond[] = [];
  #fish: Fish[] = [];
  #crab: Crab | null = null;
  #W = 0;
  #H = 0;
  #floorTop = 0;
  #random = seeded(4042);

  constructor(root: HTMLElement) {
    this.#root = root;
    this.#floor = root.querySelector(".floor")!;
  }

  // Everything set out afresh for a window W by H whose water rests at `surface`.
  layout(W: number, H: number, surface: number): void {
    this.#W = W;
    this.#H = H;
    const scale = Math.max(0.55, Math.min(1, H / 900, W / 1100));
    const floor = Math.round(Math.max(70, Math.min(140, H * 0.14)));
    this.#floor.style.height = `${floor}px`;
    this.#floorTop = H - floor * 0.62;

    // No frond taller than most of the water's depth, so at rest every one stands wholly in the water.
    const svgs = [...this.#root.querySelectorAll<SVGSVGElement>(".frond svg")];
    const tallest = Math.max(...svgs.map((svg) => Number(svg.dataset.height)));
    const reach = Math.min(scale, ((this.#floorTop - surface) * 0.85) / tallest);
    this.#fronds = [...this.#root.querySelectorAll<HTMLElement>(".frond")].map((el) => {
      const svg = el.querySelector("svg")!;
      const height = Number(svg.dataset.height) * reach;
      const box = svg.viewBox.baseVal;
      const k = height / Number(svg.dataset.height);
      Object.assign(svg.style, { width: `${box.width * k}px`, height: `${box.height * k}px` });
      const at = Number(el.style.getPropertyValue("--at"));
      const foot = { x: at * W, y: this.#floorTop + 6 + this.#random() * floor * 0.25 };
      // The svg's origin is the foot; its box starts at (box.x, box.y) in its own units.
      el.style.transform = `translate(${foot.x + box.x * k}px, ${foot.y + box.y * k}px)`;
      const segments = [...svg.querySelectorAll<SVGGElement>("g.seg")].map((g) => ({ g, y: Number(g.dataset.y), a: 0, w: 0 }));
      return { el, at, scale: k, foot, segments, length: height };
    });

    this.#fish = [...this.#root.querySelectorAll<HTMLElement>(".fish")].map((el) => {
      const svg = el.querySelector("svg")!;
      const box = svg.viewBox.baseVal;
      const k = scale;
      Object.assign(svg.style, { width: `${box.width * k}px`, height: `${box.height * k}px` });
      const half = { w: (box.width * k) / 2, h: (box.height * k) / 2 };
      // The svg's origin is the fish's middle: keep its box's offset from that.
      el.style.setProperty("--ox", `${box.x * k}px`);
      el.style.setProperty("--oy", `${box.y * k}px`);
      const x = W * (0.15 + this.#random() * 0.7), y = surface + (this.#floorTop - surface) * (0.25 + this.#random() * 0.5);
      return {
        el,
        tail: svg.querySelector<SVGGElement>("g.tail")!,
        x,
        y,
        vx: 0,
        vy: 0,
        speed: (40 + this.#random() * 50) * k,
        goal: { x, y },
        face: this.#random() < 0.5 ? -1 : 1,
        beat: this.#random() * 6,
        half,
      };
    });

    const crab = this.#root.querySelector<HTMLElement>(".crab");
    if (crab) {
      const svg = crab.querySelector("svg")!;
      const box = svg.viewBox.baseVal;
      const k = scale;
      Object.assign(svg.style, { width: `${box.width * k}px`, height: `${box.height * k}px` });
      crab.style.setProperty("--ox", `${box.x * k}px`);
      crab.style.setProperty("--oy", `${box.y * k}px`);
      const x = W * 0.68;
      this.#crab = { el: crab, legs: [...svg.querySelectorAll<SVGGElement>("g.legs")], x, goal: x, rest: 2, step: 0, half: { w: 0, h: 0 } };
    }
  }

  // The points the water is asked about: the middle of every frond's segment, as it now stands, then every fish.
  probes(): Float32Array {
    const out: number[] = [];
    for (const f of this.#fronds) {
      let { x, y } = f.foot, a = 0;
      const seg = f.length / f.segments.length;
      for (const s of f.segments) {
        a = s.a;
        out.push(x + Math.sin(a) * seg * 0.5, y - Math.cos(a) * seg * 0.5);
        x += Math.sin(a) * seg;
        y -= Math.cos(a) * seg;
      }
    }
    for (const f of this.#fish) out.push(f.x, f.y);
    return new Float32Array(out);
  }

  step(dt: number, found: Float32Array | null): void {
    dt = Math.min(dt, 1 / 30);
    let k = 0;
    const at = () => {
      const r = found && found.length >= k * 3 + 3 ? [found[k * 3], found[k * 3 + 1], found[k * 3 + 2]] : [1, 0, 0];
      k++;
      return r;
    };

    // Each segment: stood up by the water it is in, felled by the air, pushed by the water across it, kept in
    // line with the one below, and damped.
    for (const f of this.#fronds) {
      let below = 0;
      for (const s of f.segments) {
        const [full, vx, vy] = at();
        const across = vx * Math.cos(s.a) + vy * Math.sin(s.a);
        const torque = -UPRIGHT * full * Math.sin(s.a) + DROOP * (1 - full) * Math.sin(s.a + 0.05) + FLOW * full * across - BEND * (s.a - below);
        s.w += (torque - SWAY * s.w) * dt;
        s.a = Math.max(-1.45, Math.min(1.45, s.a + s.w * dt));
        below = s.a;
      }
      let prev = 0;
      for (const s of f.segments) {
        s.g.setAttribute("transform", `rotate(${((s.a - prev) * 180) / Math.PI} 0 ${s.y})`);
        prev = s.a;
      }
    }

    // Each fish: in water it swims for its goal, carried a little by the water; out of it, it falls and thrashes.
    const top = this.#H * 0.2, floor = this.#floorTop - 18;
    for (const f of this.#fish) {
      const [full, wx, wy] = at();
      if (full > 0.45) {
        const dx = f.goal.x - f.x, dy = f.goal.y - f.y, d = Math.hypot(dx, dy);
        if (d < 30 || this.#random() < dt * 0.15) f.goal = { x: this.#W * (0.06 + this.#random() * 0.88), y: top + this.#random() * (floor - top) };
        const want = { x: (dx / (d || 1)) * f.speed + wx * 0.7, y: (dy / (d || 1)) * f.speed * 0.6 + wy * 0.7 };
        const k = 1 - Math.exp(-2.2 * dt);
        f.vx += (want.x - f.vx) * k;
        f.vy += (want.y - f.vy) * k;
        f.beat += dt * (6 + Math.hypot(f.vx, f.vy) * 0.08);
      } else {
        f.vy += FALL * dt;
        f.vx *= Math.exp(-0.6 * dt);
        f.beat += dt * 22;
      }
      f.x = Math.max(f.half.w, Math.min(this.#W - f.half.w, f.x + f.vx * dt));
      f.y = Math.min(floor, f.y + f.vy * dt);
      if (f.y >= floor) f.vy = Math.min(0, f.vy);
      if (Math.abs(f.vx) > 6) f.face += (Math.sign(f.vx) - f.face) * (1 - Math.exp(-8 * dt));
      const tilt = Math.atan2(f.vy, Math.abs(f.vx) + 30) * 0.6;
      f.el.style.transform = `translate(${f.x}px, ${f.y}px) scaleX(${f.face.toFixed(3)}) rotate(${(tilt * Math.sign(f.face || 1)).toFixed(3)}rad) translate(var(--ox), var(--oy))`;
      const root = Number(f.tail.dataset.x);
      f.tail.setAttribute("transform", `rotate(${(Math.sin(f.beat) * (full > 0.45 ? 14 : 30)).toFixed(2)} ${root} 0)`);
    }

    // The crab: rests, then scuttles sideways to somewhere else along the sand, legs lifting by turns.
    const c = this.#crab;
    if (c) {
      if (c.rest > 0) c.rest -= dt;
      else {
        const dx = c.goal - c.x;
        if (Math.abs(dx) < 2) {
          c.rest = 1.5 + this.#random() * 5;
          c.goal = Math.max(40, Math.min(this.#W - 40, c.x + (this.#random() - 0.5) * this.#W * 0.4));
        } else {
          c.x += Math.sign(dx) * Math.min(Math.abs(dx), 70 * dt);
          c.step += dt * 14;
        }
      }
      const walking = c.rest <= 0;
      c.legs.forEach((g, i) => g.setAttribute("transform", walking ? `translate(0 ${(-Math.max(0, Math.sin(c.step + i * Math.PI)) * 3).toFixed(2)})` : ""));
      c.el.style.transform = `translate(${c.x}px, ${this.#floorTop + 4 + (walking ? Math.abs(Math.sin(c.step)) * -1.5 : 0)}px) translate(var(--ox), var(--oy))`;
    }
  }
}

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
