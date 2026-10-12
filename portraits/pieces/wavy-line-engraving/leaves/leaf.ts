// A leaf as the plate engraves it: a solid leaflet of ink, pointed at its tip and narrowing to a
// short stalk, its edge finely toothed toward the tip; on it, in paper, a midrib and a herringbone
// of side veins running out toward the tip. Leaflets gather into compound leaves: pairs along a
// stalk with one at its end, the stalk short enough at times that they spread as a star.

export type P = [number, number];

const f = (v: number) => (Math.round(v * 10) / 10).toString();
const ring = (pts: P[]) => "M" + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L") + "Z";

// A seeded random source (mulberry32), so every build lays the same leaves.
export function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One leaflet from its base along `angle` (radians, screen axes), `length` px long. Returns its
// outline and its veins, each a closed path; `light` (0 to 1) is how much of its veining shows.
export function leaflet(base: P, angle: number, length: number, random: () => number, light = 1): { blade: string; veins: string } {
  const [ux, uy] = [Math.cos(angle), Math.sin(angle)];
  const [nx, ny] = [-uy, ux];
  const width = length * (0.36 + 0.08 * random());
  const bend = (random() - 0.5) * 0.12 * length; // the leaflet curves a little off its axis
  const at = (t: number, s: number): P => {
    const off = s + bend * 4 * t * (1 - t);
    return [base[0] + ux * t * length + nx * off, base[1] + uy * t * length + ny * off];
  };
  // Half-width along the leaflet: a stalk for the first tenth, the blade widest a little below
  // its middle, coming to a point; teeth on the outer two thirds.
  const teeth = 5 + Math.floor(random() * 4);
  const half = (t: number) => {
    if (t < 0.08) return width * 0.04;
    const u = (t - 0.08) / 0.92;
    const blade = (width / 2) * Math.sin(Math.PI * u ** 0.75) ** 0.9;
    const tooth = u > 0.3 ? 1 + 0.05 * (1 - Math.abs(((u * teeth) % 1) * 2 - 1)) : 1;
    return blade * tooth;
  };
  const steps = 18;
  const left: P[] = [];
  const right: P[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    left.push(at(t, half(t)));
    right.push(at(t, -half(t)));
  }
  const blade = ring([...left, ...right.reverse()]);

  // Veins: a midrib tapering toward the tip, and side veins out from it, slanting to the tip,
  // each a thin lens of paper. Fewer show on a leaflet in shade.
  let veins = "";
  const lens = (a: P, b: P, w: number) => {
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const len = Math.hypot(dx, dy) || 1;
    const [px, py] = [(-dy / len) * (w / 2), (dx / len) * (w / 2)];
    const mid: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return `M${f(a[0])} ${f(a[1])}Q${f(mid[0] + px * 2)} ${f(mid[1] + py * 2)} ${f(b[0])} ${f(b[1])}Q${f(mid[0] - px * 2)} ${f(mid[1] - py * 2)} ${f(a[0])} ${f(a[1])}Z`;
  };
  if (light > 0.15) veins += lens(at(0.1, 0), at(0.86, 0), 0.9 + 0.3 * light);
  const pairs = Math.round(3 + 3 * light);
  for (let k = 0; k < pairs; k++) {
    const t = 0.22 + (0.56 * k) / Math.max(1, pairs - 1) + (random() - 0.5) * 0.05;
    for (const side of [1, -1]) {
      if (random() > 0.35 + 0.65 * light) continue;
      const reach = half(t + 0.08) * (0.55 + 0.25 * random());
      const from = at(t + 0.01, side * 0.8);
      const to = at(t + 0.1 + 0.04 * random(), side * reach);
      veins += lens(from, to, 0.75 + 0.35 * light);
    }
  }
  return { blade, veins };
}

// A compound leaf: from `base` toward `tip` (where its end leaflet ends), a stalk bowed by `bend`
// px, a leaflet at its end and `pairs` pairs along it, opening at `spread` radians from the stalk,
// smaller toward the base.
export type Compound = { base: P; tip: P; pairs: number; size: number; bend?: number; spread?: number; light?: number };
export function compound({ base, tip, pairs, size, bend = 0, spread = 0.85, light = 1 }: Compound, random: () => number): { blades: string[]; veins: string[]; stalk: P[] } {
  const reach = Math.hypot(tip[0] - base[0], tip[1] - base[1]) || 1;
  const len = Math.max(0.15 * reach, reach - size);
  const [ux, uy] = [(tip[0] - base[0]) / reach, (tip[1] - base[1]) / reach];
  const [dx, dy] = [ux * len, uy * len];
  const along = (t: number): P => [base[0] + dx * t - uy * bend * 4 * t * (1 - t), base[1] + dy * t + ux * bend * 4 * t * (1 - t)];
  const heading = (t: number) => {
    const [a, b] = [along(Math.max(0, t - 0.02)), along(Math.min(1, t + 0.02))];
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  };
  const blades: string[] = [];
  const veins: string[] = [];
  const add = (from: P, angle: number, length: number) => {
    const { blade, veins: v } = leaflet(from, angle, length, random, light * (0.7 + 0.3 * random()));
    blades.push(blade);
    if (v) veins.push(v);
  };
  // Pairs from the base up, so the leaflets nearer the tip lie over those below.
  for (let i = pairs; i >= 1; i--) {
    const t = 1 - (i / (pairs + 0.6)) * (len > size * 0.6 ? 1 : 0.15);
    const h = heading(t);
    const scale = 0.95 - 0.12 * (i - 1);
    for (const side of [1, -1]) add(along(t), h + side * (spread + (random() - 0.5) * 0.3), size * scale * (0.9 + 0.2 * random()));
  }
  add(along(1), heading(1) + (random() - 0.5) * 0.2, size * (1 + 0.1 * random()));
  const stalk = Array.from({ length: 9 }, (_, i) => along(i / 8));
  return { blades, veins, stalk };
}
