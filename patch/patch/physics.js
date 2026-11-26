// Closed-form damped harmonic springs shared across the Patch specimen sheet,
// studio key-light tilt, hover-to-SVG registration peel, and inspection modal.
// Analytical integration guarantees identical trajectories at 60/120/144 Hz and
// clean convergence to 0.0 fps idle sleep once every spring settles.
export const SPRINGS = {
    pointer: { omega: 11.5, zeta: 0.94 },
    peel: { omega: 24.0, zeta: 0.88 },
    fade: { omega: 17.5, zeta: 0.96 },
    pose: { omega: 13.5, zeta: 0.86 },
    ease: { omega: 10.5, zeta: 0.98 },
    loupe: { omega: 22.0, zeta: 0.90 },
};
export const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
export const lerp = (a, b, t) => a + (b - a) * t;
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
    /** Advance by `rawDt` seconds (clamped <= 50 ms). Returns true while still moving. */
    step(rawDt, epsPos = 5e-4, epsVel = 2e-3) {
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
    snap(value) {
        this.x = value;
        this.target = value;
        this.v = 0;
    }
}
