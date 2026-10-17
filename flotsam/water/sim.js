// The water: particles moved by double-density relaxation (Clavet, Beaudoin and Poulin, "Particle-based
// Viscoelastic Fluid Simulation", 2005), kept in screen coordinates inside a tank that is the window. Moving the
// tank moves only its walls; the water is left where it was and slops against them, so its inertia is real and
// nothing about a shake is staged.
//
// Each step: gravity, then every particle goes where its velocity takes it; pairs within reach push apart as
// they crowd (pressure) and harder still when very close (near pressure, which also holds a surface together);
// the walls hold them in; velocities are read back from how far each went; and neighbours closing on each other
// give up some of their closing speed (viscosity). The relaxation is applied pair by pair from densities taken
// first, which makes it cheap and keeps the stiffness low; the water stays incompressible enough by stepping
// often, 240 times a second.
//
// Lengths are in CSS pixels, times in seconds. The stiffnesses are per step, in interaction radii, so the water
// behaves alike at any size.
export const OPTIONS = {
    fill: 0.4,
    count: 3200,
    reach: 2.6,
    stiffness: 0.012,
    near: 0.03,
    viscosity: 0.2,
    viscosity2: 0.2,
    smoothing: 0.1,
    gravity: 2600,
};
// Pairs are found cell by cell: a cell with itself and four of its neighbours, so each pair once.
const HALF = [0, 0, 1, 0, -1, 1, 0, 1, 1, 1];
export class Water {
    P;
    W;
    H;
    N;
    s; // spacing at rest
    h; // interaction radius
    rho0;
    // Which way and how hard the water falls, px/s²: straight down at the gravity it was made with, unless a phone
    // tips it.
    down;
    X;
    Y;
    VX;
    VY;
    #PX;
    #PY;
    #rho;
    #rhoN;
    // The grid of cells an interaction radius wide, as last built, and where its corner was.
    #gw;
    #gh;
    #cell;
    #start;
    #order;
    #corner = { x: 0, y: 0 };
    // The pairs within reach: who, how near (as a share of the reach), and the unit vector from the first to the second.
    #pi;
    #pj;
    #pq;
    #pu;
    #pv;
    #pairs = 0;
    constructor(W, H, origin, options = {}) {
        const P = (this.P = { ...OPTIONS, ...options });
        this.down = { x: 0, y: P.gravity };
        this.W = W;
        this.H = H;
        // Seeded at rest: a hexagonal lattice filling the foot of the tank.
        const depth = H * P.fill;
        const s = (this.s = Math.max(6, Math.sqrt((W * depth) / P.count)));
        const h = (this.h = P.reach * s);
        const row = (s * Math.sqrt(3)) / 2;
        const pts = [];
        for (let r = 0, y = H - s * 0.5; y > H - depth; r++, y -= row)
            for (let x = s * (0.5 + (r % 2) * 0.5); x < W - s * 0.4; x += s)
                pts.push(origin.x + x, origin.y + y);
        const N = (this.N = pts.length / 2);
        const f = () => new Float64Array(N);
        [this.X, this.Y, this.VX, this.VY, this.#PX, this.#PY, this.#rho, this.#rhoN] = [f(), f(), f(), f(), f(), f(), f(), f()];
        for (let i = 0; i < N; i++)
            (this.X[i] = pts[2 * i]), (this.Y[i] = pts[2 * i + 1]);
        this.rho0 = lattice(s, h);
        this.#gw = Math.ceil(W / h) + 1;
        this.#gh = Math.ceil(H / h) + 1;
        this.#cell = new Int32Array(N);
        this.#start = new Int32Array(this.#gw * this.#gh + 1);
        this.#order = new Int32Array(N);
        const M = N * Math.ceil(P.reach * P.reach * 3);
        this.#pi = new Int32Array(M);
        this.#pj = new Int32Array(M);
        this.#pq = new Float64Array(M);
        this.#pu = new Float64Array(M);
        this.#pv = new Float64Array(M);
    }
    // Moves all the water with the tank, as when the window jumps to another screen.
    carry(dx, dy) {
        for (let i = 0; i < this.N; i++)
            (this.X[i] += dx), (this.Y[i] += dy);
    }
    // How much water is at a point, as a share of water at rest, and how it moves there.
    probe(x, y) {
        const { h, X, Y, VX, VY } = this;
        const gw = this.#gw, gh = this.#gh, start = this.#start, order = this.#order;
        const cx = Math.floor((x - this.#corner.x) / h), cy = Math.floor((y - this.#corner.y) / h);
        let rho = 0, vx = 0, vy = 0;
        for (let gy = Math.max(0, cy - 1); gy <= Math.min(gh - 1, cy + 1); gy++)
            for (let gx = Math.max(0, cx - 1); gx <= Math.min(gw - 1, cx + 1); gx++) {
                const c = gx + gy * gw;
                for (let a = start[c]; a < start[c + 1]; a++) {
                    const j = order[a], dx = X[j] - x, dy = Y[j] - y, r2 = dx * dx + dy * dy;
                    if (r2 >= h * h)
                        continue;
                    const m = 1 - Math.sqrt(r2) / h, w = m * m;
                    rho += w;
                    vx += VX[j] * w;
                    vy += VY[j] * w;
                }
            }
        return rho > 0 ? { full: rho / this.rho0, vx: vx / rho, vy: vy / rho } : { full: 0, vx: 0, vy: 0 };
    }
    // The particles within r of a point, from the grid as last built: the range of cells, then a test per particle.
    #cells(x, y, r) {
        const h = this.h, c = this.#corner;
        return [
            Math.max(0, Math.floor((x - r - c.x) / h)),
            Math.min(this.#gw - 1, Math.floor((x + r - c.x) / h)),
            Math.max(0, Math.floor((y - r - c.y) / h)),
            Math.min(this.#gh - 1, Math.floor((y + r - c.y) / h)),
        ];
    }
    // Draws the water within r of a point toward a velocity, the more the nearer: a hand stirring it.
    drag(x, y, vx, vy, r, k) {
        const { X, Y, VX, VY } = this;
        const start = this.#start, order = this.#order, gw = this.#gw;
        const [x0, x1, y0, y1] = this.#cells(x, y, r);
        for (let gy = y0; gy <= y1; gy++)
            for (let gx = x0; gx <= x1; gx++)
                for (let a = start[gx + gy * gw], e = start[gx + gy * gw + 1]; a < e; a++) {
                    const i = order[a], dx = X[i] - x, dy = Y[i] - y, d2 = dx * dx + dy * dy;
                    if (d2 > r * r)
                        continue;
                    const w = k * (1 - Math.sqrt(d2) / r);
                    VX[i] += (vx - VX[i]) * w;
                    VY[i] += (vy - VY[i]) * w;
                }
    }
    // A thing at a point, moving at a velocity, knocks aside the water it runs into within r; returns the momentum
    // it gave the water (in px²·px/s, the water's mass being its area), for the thing to lose.
    bump(x, y, vx, vy, r, k) {
        const { X, Y, VX, VY } = this;
        const start = this.#start, order = this.#order, gw = this.#gw;
        const m = this.s * this.s * 0.866;
        const [x0, x1, y0, y1] = this.#cells(x, y, r);
        let px = 0, py = 0;
        for (let gy = y0; gy <= y1; gy++)
            for (let gx = x0; gx <= x1; gx++)
                for (let a = start[gx + gy * gw], e = start[gx + gy * gw + 1]; a < e; a++) {
                    const i = order[a], dx = X[i] - x, dy = Y[i] - y, d2 = dx * dx + dy * dy;
                    if (d2 > r * r || d2 < 1e-6)
                        continue;
                    const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
                    const u = (vx - VX[i]) * nx + (vy - VY[i]) * ny; // how fast the thing closes on it
                    if (u <= 0)
                        continue;
                    const dv = u * k * (1 - d / r);
                    VX[i] += nx * dv;
                    VY[i] += ny * dv;
                    px += nx * dv * m;
                    py += ny * dv * m;
                }
        return { x: px, y: py };
    }
    // The mean speed of the water, in px/s: how stirred it is.
    stir() {
        let v = 0;
        for (let i = 0; i < this.N; i++)
            v += Math.hypot(this.VX[i], this.VY[i]);
        return v / this.N;
    }
    step(dt, ox, oy) {
        const { N, X, Y, VX, VY, P, h, s } = this;
        const PX = this.#PX, PY = this.#PY, rho = this.#rho, rhoN = this.#rhoN;
        const pi = this.#pi, pj = this.#pj, pq = this.#pq, pu = this.#pu, pv = this.#pv;
        const gx = this.down.x * dt, gy = this.down.y * dt;
        for (let i = 0; i < N; i++) {
            VX[i] += gx;
            VY[i] += gy;
            PX[i] = X[i];
            PY[i] = Y[i];
            X[i] += VX[i] * dt;
            Y[i] += VY[i] * dt;
        }
        this.#pair(ox, oy);
        const n = this.#pairs;
        // Densities first, then each pair pushed apart by the pressure of both.
        rho.fill(0);
        rhoN.fill(0);
        for (let k = 0; k < n; k++) {
            const m = 1 - pq[k], m2 = m * m, m3 = m2 * m;
            rho[pi[k]] += m2;
            rho[pj[k]] += m2;
            rhoN[pi[k]] += m3;
            rhoN[pj[k]] += m3;
        }
        const kS = P.stiffness * h, kN = P.near * h, r0 = this.rho0;
        for (let k = 0; k < n; k++) {
            const i = pi[k], j = pj[k], m = 1 - pq[k];
            const p = kS * (rho[i] + rho[j] - 2 * r0) * 0.5, pn = kN * (rhoN[i] + rhoN[j]) * 0.5;
            const D = 0.5 * (p * m + pn * m * m);
            const dx = D * pu[k], dy = D * pv[k];
            X[i] -= dx;
            Y[i] -= dy;
            X[j] += dx;
            Y[j] += dy;
        }
        // The walls; then velocities from how far each particle went, no faster than half a reach a step.
        const w = s * 0.5, x0 = ox + w, x1 = ox + this.W - w, y0 = oy + w, y1 = oy + this.H - w;
        const vmax = (0.5 * h) / dt;
        for (let i = 0; i < N; i++) {
            if (X[i] < x0)
                X[i] = x0;
            else if (X[i] > x1)
                X[i] = x1;
            if (Y[i] < y0)
                Y[i] = y0;
            else if (Y[i] > y1)
                Y[i] = y1;
            let vx = (X[i] - PX[i]) / dt, vy = (Y[i] - PY[i]) / dt;
            const v = Math.hypot(vx, vy);
            if (v > vmax)
                (vx *= vmax / v), (vy *= vmax / v);
            VX[i] = vx;
            VY[i] = vy;
        }
        const a = P.viscosity, b = P.viscosity2 * (dt / h);
        for (let k = 0; k < n; k++) {
            const i = pi[k], j = pj[k], ux = pu[k], uy = pv[k];
            const u = (VX[i] - VX[j]) * ux + (VY[i] - VY[j]) * uy;
            if (u <= 0)
                continue;
            const I = 0.5 * (1 - pq[k]) * (a * u + b * u * u);
            VX[i] -= I * ux;
            VY[i] -= I * uy;
            VX[j] += I * ux;
            VY[j] += I * uy;
        }
        // Each velocity drawn a little toward its neighbours' (XSPH, Monaghan 1989): it stills the jitter a particle
        // method has at rest, and leaves alone whatever moves together, a wave or a slop.
        const c = P.smoothing / r0;
        if (c > 0) {
            const sx = rho, sy = rhoN; // done with, for this step
            sx.fill(0);
            sy.fill(0);
            for (let k = 0; k < n; k++) {
                const i = pi[k], j = pj[k], m = 1 - pq[k], w = m * m;
                const dx = (VX[j] - VX[i]) * w, dy = (VY[j] - VY[i]) * w;
                sx[i] += dx;
                sy[i] += dy;
                sx[j] -= dx;
                sy[j] -= dy;
            }
            for (let i = 0; i < N; i++) {
                VX[i] += c * sx[i];
                VY[i] += c * sy[i];
            }
        }
    }
    #pair(ox, oy) {
        const { N, X, Y, h } = this;
        const gw = this.#gw, gh = this.#gh, cell = this.#cell, start = this.#start, order = this.#order;
        const pi = this.#pi, pj = this.#pj, pq = this.#pq, pu = this.#pu, pv = this.#pv;
        this.#corner = { x: ox, y: oy };
        start.fill(0);
        for (let i = 0; i < N; i++) {
            const cx = Math.min(gw - 1, Math.max(0, ((X[i] - ox) / h) | 0));
            const cy = Math.min(gh - 1, Math.max(0, ((Y[i] - oy) / h) | 0));
            cell[i] = cx + cy * gw;
            start[cell[i] + 1]++;
        }
        for (let c = 0; c < gw * gh; c++)
            start[c + 1] += start[c];
        const next = start.slice(0, gw * gh);
        for (let i = 0; i < N; i++)
            order[next[cell[i]]++] = i;
        const h2 = h * h, M = pi.length;
        let n = 0;
        for (let cy = 0; cy < gh; cy++)
            for (let cx = 0; cx < gw; cx++) {
                const c = cx + cy * gw;
                for (let e = 0; e < HALF.length; e += 2) {
                    const x = cx + HALF[e], y = cy + HALF[e + 1];
                    if (x < 0 || x >= gw || y >= gh)
                        continue;
                    const d = x + y * gw, same = d === c;
                    for (let a = start[c]; a < start[c + 1]; a++) {
                        const i = order[a], xi = X[i], yi = Y[i];
                        for (let b = same ? a + 1 : start[d]; b < start[d + 1]; b++) {
                            const j = order[b], dx = X[j] - xi, dy = Y[j] - yi, r2 = dx * dx + dy * dy;
                            if (r2 >= h2 || n === M)
                                continue;
                            // Two particles on one spot have no way apart: set one a hair aside.
                            if (r2 < 1e-6) {
                                X[j] += (Math.random() - 0.5) * 0.02 * h;
                                Y[j] += (Math.random() - 0.5) * 0.02 * h;
                                continue;
                            }
                            const r = Math.sqrt(r2);
                            pi[n] = i;
                            pj[n] = j;
                            pq[n] = r / h;
                            pu[n] = dx / r;
                            pv[n] = dy / r;
                            n++;
                        }
                    }
                }
            }
        this.#pairs = n;
    }
}
// The rest density is the seeded lattice's own, so the water starts at rest.
function lattice(s, h) {
    const row = (s * Math.sqrt(3)) / 2;
    let rho = 0;
    for (let r = -6; r <= 6; r++)
        for (let c = -7; c <= 7; c++) {
            if (!r && !c)
                continue;
            const q = Math.hypot((c + (r & 1) * 0.5) * s, r * row) / h;
            if (q < 1)
                rho += (1 - q) ** 2;
        }
    return rho;
}
