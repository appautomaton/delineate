// Analytical spring physics and pointer inertia shared across Lumen's optical stage and landing card.
// Closed-form damped harmonic oscillators guarantee identical trajectories at 60, 120, and 144 Hz and
// stay unconditionally stable across tab switches (dt clamped to <= 50 ms).
export const SPRINGS = {
    morph: { omega: 7.4, zeta: 0.76 },
    carousel: { omega: 9.8, zeta: 0.80 },
    pointer: { omega: 13.5, zeta: 0.90 },
    ease: { omega: 10.5, zeta: 0.98 },
    impulse: { omega: 6.4, zeta: 0.56 },
};
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (e0, e1, x) => {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
};
export const easeInOutCubic = (t) => {
    const u = clamp(t, 0, 1);
    return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
};
export const mod = (n, m) => ((n % m) + m) % m;
export class Spring {
    x;
    v;
    target;
    omega;
    zeta;
    constructor(initial, spec = "ease") {
        const p = typeof spec === "string" ? SPRINGS[spec] : spec;
        this.x = initial;
        this.v = 0;
        this.target = initial;
        this.omega = p.omega;
        this.zeta = p.zeta;
    }
    /** Advance by `rawDt` seconds (clamped to <= 0.05s). Returns true while still in motion. */
    step(rawDt, epsPos = 1e-4, epsVel = 1e-3) {
        const dt = clamp(rawDt, 0, 0.05);
        const u = this.x - this.target;
        const v = this.v;
        if (Math.abs(u) <= epsPos && Math.abs(v) <= epsVel) {
            this.x = this.target;
            this.v = 0;
            return false;
        }
        const w = this.omega;
        const z = this.zeta;
        let u1;
        let v1;
        if (z < 1 - 1e-4) {
            const wd = w * Math.sqrt(1 - z * z);
            const exp = Math.exp(-z * w * dt);
            const cos = Math.cos(wd * dt);
            const sin = Math.sin(wd * dt);
            const a = u;
            const b = (v + z * w * u) / wd;
            u1 = exp * (a * cos + b * sin);
            v1 = exp * ((b * wd - a * z * w) * cos - (a * wd + b * z * w) * sin);
        }
        else if (z > 1 + 1e-4) {
            const sq = Math.sqrt(z * z - 1);
            const r1 = -w * (z - sq);
            const r2 = -w * (z + sq);
            const c2 = (v - r1 * u) / (r2 - r1);
            const c1 = u - c2;
            const e1 = Math.exp(r1 * dt);
            const e2 = Math.exp(r2 * dt);
            u1 = c1 * e1 + c2 * e2;
            v1 = c1 * r1 * e1 + c2 * r2 * e2;
        }
        else {
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
    impulse(dv) {
        this.v += dv;
    }
    snap(value) {
        this.x = value;
        this.target = value;
        this.v = 0;
    }
    setParams(spec) {
        const p = typeof spec === "string" ? SPRINGS[spec] : spec;
        this.omega = p.omega;
        this.zeta = p.zeta;
    }
}
/** Tracks recent pointer positions over ~85 ms to extract clean release velocity (units/s). */
export class VelocityTracker {
    samples = [];
    reset(x, y, t = performance.now()) {
        this.samples = [{ t, x, y }];
    }
    push(x, y, t = performance.now()) {
        this.samples.push({ t, x, y });
        const cutoff = t - 85;
        while (this.samples.length > 2 && this.samples[0].t < cutoff)
            this.samples.shift();
    }
    velocity(now = performance.now()) {
        if (this.samples.length < 2)
            return { vx: 0, vy: 0 };
        const last = this.samples[this.samples.length - 1];
        if (now - last.t > 95)
            return { vx: 0, vy: 0 };
        const first = this.samples[0];
        const dt = (last.t - first.t) / 1000;
        if (dt < 0.004)
            return { vx: 0, vy: 0 };
        return {
            vx: clamp((last.x - first.x) / dt, -2600, 2600),
            vy: clamp((last.y - first.y) / dt, -2600, 2600),
        };
    }
}
