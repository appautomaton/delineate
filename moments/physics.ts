// Core physics primitives and SVG helpers shared across every Moment tile.
// All springs step via closed-form analytical solutions so 60 Hz, 120 Hz, and 144 Hz displays trace the
// exact same curve and never destabilise on a long frame.

export type Material = "mechanical" | "rubber" | "taut" | "viscous" | "fluid";

export type SpringParams = {
  readonly omega: number; // natural angular frequency (rad/s)
  readonly zeta: number; // damping ratio (<1 underdamped, 1 critical, >1 overdamped)
};

export const MATERIALS: Record<Material, SpringParams & { readonly label: string }> = {
  mechanical: { omega: 38, zeta: 0.62, label: "mechanical" },
  rubber: { omega: 18, zeta: 0.30, label: "rubber" },
  taut: { omega: 34, zeta: 0.085, label: "taut" },
  viscous: { omega: 13, zeta: 0.48, label: "viscous" },
  fluid: { omega: 11, zeta: 0.32, label: "fluid" },
};

export class Spring {
  x: number;
  v: number;
  target: number;
  omega: number;
  zeta: number;

  constructor(initial: number, spec: Material | SpringParams = "rubber") {
    const p = typeof spec === "string" ? MATERIALS[spec] : spec;
    this.x = initial;
    this.v = 0;
    this.target = initial;
    this.omega = p.omega;
    this.zeta = p.zeta;
  }

  /** Advance by `dt` seconds. Returns true while still in motion. */
  step(dt: number, epsPos = 1e-3, epsVel = 1e-2): boolean {
    const u = this.x - this.target;
    const v = this.v;
    if (Math.abs(u) <= epsPos && Math.abs(v) <= epsVel) {
      this.x = this.target;
      this.v = 0;
      return false;
    }

    const w = this.omega;
    const z = this.zeta;
    let u1: number;
    let v1: number;

    if (z < 1 - 1e-4) {
      const wd = w * Math.sqrt(1 - z * z);
      const exp = Math.exp(-z * w * dt);
      const cos = Math.cos(wd * dt);
      const sin = Math.sin(wd * dt);
      const a = u;
      const b = (v + z * w * u) / wd;
      u1 = exp * (a * cos + b * sin);
      v1 = exp * ((b * wd - a * z * w) * cos - (a * wd + b * z * w) * sin);
    } else if (z > 1 + 1e-4) {
      const sq = Math.sqrt(z * z - 1);
      const r1 = -w * (z - sq);
      const r2 = -w * (z + sq);
      const c2 = (v - r1 * u) / (r2 - r1);
      const c1 = u - c2;
      const e1 = Math.exp(r1 * dt);
      const e2 = Math.exp(r2 * dt);
      u1 = c1 * e1 + c2 * e2;
      v1 = c1 * r1 * e1 + c2 * r2 * e2;
    } else {
      const exp = Math.exp(-w * dt);
      const a = u;
      const b = v + w * u;
      u1 = exp * (a + b * dt);
      v1 = exp * (b - w * (a + b * dt));
    }

    if (Math.abs(u1) <= epsPos && Math.abs(v1) <= epsVel) {
      this.x = this.target;
      this.v = 0;
      return false;
    }

    this.x = this.target + u1;
    this.v = v1;
    return true;
  }

  impulse(dv: number): void {
    this.v += dv;
  }

  snap(value: number): void {
    this.x = value;
    this.target = value;
    this.v = 0;
  }

  setParams(spec: Material | SpringParams): void {
    const p = typeof spec === "string" ? MATERIALS[spec] : spec;
    this.omega = p.omega;
    this.zeta = p.zeta;
  }
}

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (t: number): number => 1 - (1 - clamp(t, 0, 1)) ** 3;
export const easeOutQuart = (t: number): number => 1 - (1 - clamp(t, 0, 1)) ** 4;
export const easeInOutCubic = (t: number): number => {
  const u = clamp(t, 0, 1);
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
};
export const easeInOutQuint = (t: number): number => {
  const u = clamp(t, 0, 1);
  return u < 0.5 ? 16 * u ** 5 : 1 - (-2 * u + 2) ** 5 / 2;
};
/** Exaggerated elastic overshoot curve (nonlinear wind-up & snap) for choreographed beats. */
export const easeOutBack = (t: number, s = 1.70158): number => {
  const u = clamp(t, 0, 1) - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};

/** Exact area-preserving squash & stretch: sx * sy === 1 for every strain s. */
export const squash = (strain: number): { sx: number; sy: number } => ({
  sx: Math.exp(strain),
  sy: Math.exp(-strain),
});

/** Tracks recent pointer positions over ~75 ms to extract clean release velocity (units/s). */
export class VelocityTracker {
  private samples: Array<{ t: number; x: number; y: number }> = [];

  reset(x: number, y: number, t = performance.now()): void {
    this.samples = [{ t, x, y }];
  }

  push(x: number, y: number, t = performance.now()): void {
    this.samples.push({ t, x, y });
    const cutoff = t - 85;
    while (this.samples.length > 2 && this.samples[0].t < cutoff) this.samples.shift();
  }

  velocity(now = performance.now()): { vx: number; vy: number } {
    if (this.samples.length < 2) return { vx: 0, vy: 0 };
    const last = this.samples[this.samples.length - 1];
    if (now - last.t > 90) return { vx: 0, vy: 0 };
    const first = this.samples[0];
    const dt = (last.t - first.t) / 1000;
    if (dt < 0.004) return { vx: 0, vy: 0 };
    return {
      vx: clamp((last.x - first.x) / dt, -1400, 1400),
      vy: clamp((last.y - first.y) / dt, -1400, 1400),
    };
  }
}

export const SVG_NS = "http://www.w3.org/2000/svg";
export const STAGE_W = 200;
export const STAGE_H = 140;

let idSeq = 0;
export const uniqueId = (prefix: string): string => `${prefix}-${++idSeq}`;

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  }
  return el;
}

export function createStageSvg(): SVGSVGElement {
  const svg = svgEl("svg", {
    viewBox: `0 0 ${STAGE_W} ${STAGE_H}`,
    class: "moment-svg",
    "aria-hidden": "true",
  });
  return svg;
}

/** Converts a PointerEvent into the 200×140 logical viewBox coordinate frame. */
export function stagePoint(svg: SVGSVGElement, e: PointerEvent): { x: number; y: number } {
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height) return { x: STAGE_W / 2, y: STAGE_H / 2 };
  // preserveAspectRatio defaults to xMidYMid meet; compute uniform scale cleanly.
  const scale = Math.min(r.width / STAGE_W, r.height / STAGE_H);
  const ox = r.left + (r.width - STAGE_W * scale) / 2;
  const oy = r.top + (r.height - STAGE_H * scale) / 2;
  return {
    x: (e.clientX - ox) / scale,
    y: (e.clientY - oy) / scale,
  };
}

/** Creates an isolated SVG metaball gooey filter with generous filter bounds to prevent clipping. */
export function createGooFilter(id: string, blur = 6.5, slope = 22, intercept = -9): SVGFilterElement {
  const filter = svgEl("filter", {
    id,
    x: "-30%",
    y: "-30%",
    width: "160%",
    height: "160%",
    "color-interpolation-filters": "sRGB",
  });
  filter.append(
    svgEl("feGaussianBlur", { in: "SourceGraphic", stdDeviation: blur, result: "blur" }),
    svgEl("feColorMatrix", {
      in: "blur",
      mode: "matrix",
      values: `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${slope} ${intercept}`,
      result: "goo",
    }),
    svgEl("feComposite", { in: "SourceGraphic", in2: "goo", operator: "atop" }),
  );
  return filter;
}
