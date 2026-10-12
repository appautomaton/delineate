// Rosettes in space: leaves set round a crown at the golden angle, raised by age, projected from
// a little above, and drawn far to near. A Habit says how a species holds its leaves; each garden
// keeps the habits of its own plants.

import { rad, add, sub, mul, norm, closed, line, tone, shape, part } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";

// The rosettes are seen from the side and a little above, so a spread leaf shows some face.
const VIEW = rad(12);
// A point in a rosette's space (x right, y up, z toward the viewer) placed on the page about the
// crown C, and how near the viewer it lies.
const onPage = (C: Pt, p: number[]): Pt => [C[0] + p[0], C[1] - (p[1] * Math.cos(VIEW) - p[2] * Math.sin(VIEW))];
const nearness = (p: number[]) => p[2] * Math.cos(VIEW) + p[1] * Math.sin(VIEW);

// One leaf of a giant rosette, in space: it leaves the crown at azimuth `az` and elevation `el`,
// its midrib bending up by `curl` toward the tip. Oblanceolate: it clasps the crown narrowly,
// widens past the middle, and tapers to a point. A leaf seen edge-on keeps some width, as a
// cupped blade does.
export function leafInSpace(C: Pt, az: number, el: number, L: number, W: number, curl: number) {
  const N = 10;
  const mid: number[][] = [[0, 0, 0]];
  for (let i = 1; i <= N; i++) {
    const e = el + curl * ((i - 0.5) / N);
    const [x, y, z] = mid[i - 1];
    mid.push([x + (L / N) * Math.cos(e) * Math.cos(az), y + (L / N) * Math.sin(e), z + (L / N) * Math.cos(e) * Math.sin(az)]);
  }
  const page = mid.map((p) => onPage(C, p));
  const face = Math.max(0.4, Math.hypot(Math.sin(az), Math.cos(az) * Math.sin(VIEW)));
  const half = (s: number) => ((W * L) / 2) * face * Math.max(0.16 * (1 - s), (s ** 0.9 * (1 - s) ** 0.6) / 0.364);
  const A: Pt[] = [];
  const B: Pt[] = [];
  page.forEach((p, i) => {
    const t = norm(sub(page[Math.min(N, i + 1)], page[Math.max(0, i - 1)]));
    const h = half(i / N);
    A.push(add(p, mul([-t[1], t[0]], h)));
    B.push(add(p, mul([t[1], -t[0]], h)));
  });
  return { outline: [...A, ...[...B].reverse()], rib: page, A, B, near: nearness(mid[N >> 1]) };
}

// How a rosette holds its leaves, oldest to youngest: the shares of dying and young leaves, and
// for each kind its elevation, length (a share of the rosette's reach), width, and curl. A
// rosette with an `under` token shows that underside wherever a leaf turns its back to the
// viewer.
type Range = [number, number];
export type Habit = {
  dying: number;
  young: number;
  el: { dying: Range; spread: Range; young: Range };
  len: { dying: number; spread: Range; young: Range };
  W: { dying: number; spread: number; young: number };
  curl: { dying: number; spread: Range; young: number };
  shine: boolean;
  under?: string;
};
const at = ([a, b]: Range, t: number) => a + (b - a) * t;

// A rosette of `count` leaves set round the crown at the golden angle, oldest outermost: the
// oldest bend down, browning; the spread leaves lie level with their tips turned up; the young
// ones stand in a yellowish cone at the heart. Leaves are drawn far to near, and each unfolds
// from the crown in order of age from g.
export function rosette(out: Out, r: Rng, C: Pt, R: number, g: number, count: number, h: Habit) {
  const leaves = Array.from({ length: count }, (_, k) => {
    const t = k / (count - 1);
    const az = k * rad(137.5) + (r() - 0.5) * 0.2;
    const kind = t < h.dying ? "dying" : t > 1 - h.young ? "young" : "spread";
    const u = kind === "dying" ? t / h.dying : kind === "young" ? (t - (1 - h.young)) / h.young : (t - h.dying) / (1 - h.dying - h.young);
    const el = at(h.el[kind], u);
    const L = R * (kind === "dying" ? h.len.dying : at(h.len[kind], u)) * (0.92 + r() * 0.16);
    const curl = kind === "spread" ? at(h.curl.spread, r()) : h.curl[kind];
    const leaf = leafInSpace(C, az, el, L, h.W[kind], curl);
    const depth = leaf.near / R;
    // The upper face looks away from the viewer when a near leaf rises toward them.
    const e = el + curl / 2;
    const back = h.under && kind !== "dying" && Math.cos(e) * Math.sin(VIEW) - Math.sin(e) * Math.sin(az) * Math.cos(VIEW) < 0;
    const v =
      kind === "dying" ? tone(r, { pc: "--skirt", dl: -0.04, dc: 1.3, spread: 0.04 })
      : back ? tone(r, { pc: h.under, spread: 0.03, hue: 6 })
      : kind === "young" ? tone(r, { dl: 0.09, dh: -16, spread: 0.04 })
      : tone(r, { dl: -0.03 + depth * 0.07, spread: 0.05, hue: 10 });
    return { k, leaf, v, shine: h.shine && !back && kind !== "dying" && depth > 0 && el < 0.7 };
  });
  leaves.sort((a, b) => a.leaf.near - b.leaf.near);
  for (const { k, leaf, v, shine } of leaves)
    part(out, g + k * 0.004, C, () => {
      shape(out, r, leaf.outline, v, { deep: 0.55, deepAbout: leaf.rib[3] });
      const rib = leaf.rib.slice(1, -1);
      if (shine) out.push(`<path class="wash shine" d="${closed([...rib.slice(2, 7).map((p, i) => add(p, [0, -2 - Math.sin((i / 4) * Math.PI) * 3])), ...rib.slice(2, 7).reverse()])}"/>`);
      out.push(`<path class="ink hair vein" d="${line(rib)}"/>`);
    });
}
