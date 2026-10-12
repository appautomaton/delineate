// The street's trees, lamps, railings, planters, and the wall and steps on the right.
//
// The grammar, read off its plate (wav-tree.png) at 1.9x to 3.5x:
// - Foliage: no lines at all. A mass of ink whose edge is made of leaf clusters, serrated lobes
//   a dozen pixels across; inside it, the light is cut out of the ink as flecks: whole star-shaped
//   leaves where the sun falls (the upper and outer side), short commas and dots in the shade.
// - Trunks and limbs: smooth ink, tapering, forking upward; no flecks.
// - Lamps: an ink pole with a lit edge; a flat saucer head on an arm, a bright lens beneath it.
// - Railings: a round top rail lit along its top, posts below it; a slatted fence behind them.
// - Planters, the wall and the steps: blocks engraved in the street's level wavy lines at their
//   own tone, each lit along its top edge, outlined in ink.
// Kept: all of it, the foliage as marks placed by the plate's tone (never its outline traced), the
// structure as models placed by eye (see scene.ts). Dropped: the crumbs of leaves inside the
// shrubs' shadows, and the bricks' joints, which read only as the blocks' wavy hatching.

import { fileURLToPath } from "node:url";
import { readPng } from "../../../harness/trace/image.ts";
import { type Point, distance, pathOf } from "../../../harness/trace/polygon.ts";
import { type Box, type Field, blur, ink, luminance, over, placed, rgb, sample, shapes, smoothstep, waves } from "../engrave.ts";
import { PAPER, REFERENCES, SPACING, STREET_INK, run } from "../sheet.ts";
import { drawn, strokeData } from "../subject/lines.ts";
import { BACK_LAMPS, BLOCKS, FRONT_LAMPS, HANDRAIL, HANDRAIL_POSTS, LAMP_BASES, type Lamp, POSTS, RAILS, TRUNKS } from "./scene.ts";

const PLATE = new URL("wav-tree.png", REFERENCES);
const BOX: Box = [0, 160, 1254, 1070];
const K = 2; // samples per pixel of the foliage field
const level = waves({ ripple: { amplitude: 1.1, wavelength: 26 }, wander: [{ amplitude: 0.6, scale: 34 }, { amplitude: 1.2, scale: 140 }], seed: 31 });

// Seeded noise, one value per (cell, salt).
const hash = (a: number, b: number, salt: number) => {
  let s = Math.imul(a * 73856093 ^ b * 19349663 ^ salt * 83492791, 0x9e3779b1);
  s = Math.imul(s ^ (s >>> 15), 0x85ebca6b);
  return ((s ^ (s >>> 13)) >>> 0) / 4294967296;
};
const f = (v: number) => (Math.round(v * 10) / 10).toString();
const line = (pts: Point[]) => "M" + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L");

// Distance from a point to a polyline.
function toLine(pts: Point[], x: number, y: number): number {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [[ax, ay], [bx, by]] = [pts[i], pts[i + 1]];
    const [ex, ey] = [bx - ax, by - ay];
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * ex, y - ay - t * ey));
  }
  return best;
}

// How far (px) a point lies inside the drawn structure: blocks, poles, rails; negative outside.
// Foliage is not placed there. Trunks are not structure: the foliage hides them.
function structure(x: number, y: number): number {
  let d = -Infinity;
  for (const b of BLOCKS) d = Math.max(d, distance(b, x, y));
  for (const b of LAMP_BASES) d = Math.max(d, distance(b, x, y));
  for (const l of [...FRONT_LAMPS, ...BACK_LAMPS]) d = Math.max(d, l.width / 2 + 2 - toLine([l.top, l.foot], x, y));
  for (const r of RAILS) d = Math.max(d, 4 - toLine(r, x, y));
  return d;
}

// The foliage, as the plate engraves it: a mass of ink wherever the canopy is (the plate's tone
// blurred past its leaves), its edge broken into star-shaped leaf clusters where that tone fades;
// and inside it, the light cut out as leaves: star-shaped leaves of paper where the sun falls,
// short curved ticks in the shade, as many as the plate's local tone asks, so the canopy reads
// mid-dark and leafy rather than black. Returns the mass (for a paper ground) and the inked mass.
const CANOPY = 0.48; // the broad tone above which the canopy is
const STAR = 3.6; // px: a fleck cell's side
// A star-shaped leaf: five pointed lobes of radius r, turned by phi; signed distance, + inside.
const star = (r: number, phi: number) => (dx: number, dy: number) => {
  const lobes = 0.42 + 0.58 * Math.abs(Math.cos(2.5 * (Math.atan2(dy, dx) - phi))) ** 2.2;
  return r * lobes - Math.hypot(dx, dy);
};
// A tick: a thin crescent, `a` long and `b` across, bent by `bend`, turned by phi.
const tick = (a: number, b: number, bend: number, phi: number) => (dx: number, dy: number) => {
  const [u, v] = [dx * Math.cos(phi) + dy * Math.sin(phi), -dx * Math.sin(phi) + dy * Math.cos(phi)];
  const w = v - (bend * (u * u)) / (a * a);
  return (1 - Math.hypot(u / a, w / b)) * b;
};
function foliage(tone: Field, broad: Field, alpha: Field, solid: Field): { mass: Field; inked: Field } {
  const [x0, y0, x1, y1] = BOX;
  const [w, h] = [(x1 - x0) * K, (y1 - y0) * K];
  const free = (x: number, y: number) => sample(alpha, x, y) > 0.5 && sample(solid, x, y) < 0.5;
  const G = new Float32Array(w * h);
  for (let gy = 0; gy < h; gy++)
    for (let gx = 0; gx < w; gx++) {
      const [x, y] = [x0 + (gx + 0.5) / K, y0 + (gy + 0.5) / K];
      G[gy * w + gx] = free(x, y) ? Math.max(-3, Math.min(3, (sample(broad, x, y) - CANOPY) * 30)) : -3;
    }
  const splat = (cx: number, cy: number, reach: number, sdf: (dx: number, dy: number) => number, carve: boolean) => {
    const [gx0, gx1] = [Math.max(0, Math.floor((cx - reach - x0) * K)), Math.min(w - 1, Math.ceil((cx + reach - x0) * K))];
    const [gy0, gy1] = [Math.max(0, Math.floor((cy - reach - y0) * K)), Math.min(h - 1, Math.ceil((cy + reach - y0) * K))];
    for (let gy = gy0; gy <= gy1; gy++)
      for (let gx = gx0; gx <= gx1; gx++) {
        const v = sdf(x0 + (gx + 0.5) / K - cx, y0 + (gy + 0.5) / K - cy);
        const i = gy * w + gx;
        G[i] = carve ? Math.min(G[i], -v) : Math.max(G[i], v);
      }
  };
  // The edge: star leaves where the broad tone fades and the plate's own is still dark.
  const CELL = 5;
  for (let j = Math.floor(y0 / CELL); j * CELL < y1; j++)
    for (let i = 0; i * CELL < x1; i++) {
      const [cx, cy] = [(i + hash(i, j, 1)) * CELL, (j + hash(i, j, 2)) * CELL];
      if (!free(cx, cy)) continue;
      const [t, b] = [sample(tone, cx, cy), sample(broad, cx, cy)];
      if (t < 0.45 || b < 0.2 || b > CANOPY + 0.15) continue;
      const r = 4 + 3 * hash(i, j, 3);
      splat(cx, cy, r + 1, star(r, hash(i, j, 4) * 2 * Math.PI), false);
    }
  const mass = Float32Array.from(G);
  // The light inside: each cell asks for the paper the plate shows there, 1 - t, and gets a leaf
  // of paper often enough to give it on average; a star where the leaves are lit (the plate's
  // tone lighter), a tick in the shade.
  for (let j = Math.floor(y0 / STAR); j * STAR < y1; j++)
    for (let i = 0; i * STAR < x1; i++) {
      const [cx, cy] = [(i + hash(i, j, 11)) * STAR, (j + hash(i, j, 12)) * STAR];
      const gi = Math.floor((cy - y0) * K) * w + Math.floor((cx - x0) * K);
      if (gi < 0 || gi >= G.length || mass[gi] < 1) continue;
      const t = sample(tone, cx, cy);
      const paper = Math.max(0, Math.min(1, 1.08 - t));
      const lit = smoothstep(0.85, 0.6, t);
      const phi = hash(i, j, 14) * 2 * Math.PI;
      if (hash(i, j, 16) < lit) {
        const r = 2.6 + 2.2 * hash(i, j, 15);
        if (hash(i, j, 13) > (paper * STAR * STAR) / (1.25 * r * r)) continue;
        splat(cx, cy, r + 1, star(r, phi), true);
      } else {
        const a = 1.8 + 1.6 * hash(i, j, 15);
        if (hash(i, j, 13) > (paper * STAR * STAR) / (Math.PI * a * 0.6)) continue;
        splat(cx, cy, a + 1, tick(a, 0.6, 0.7 * (hash(i, j, 17) - 0.5), phi), true);
      }
    }
  return { mass: { width: w, height: h, data: mass }, inked: { width: w, height: h, data: G } };
}

// A lamp: pole with a lit left edge, the arm, the saucer and its lens.
function lampMarkup({ top: [tx, ty], foot: [fx, fy], width, head: [hx, hy], span }: Lamp): string {
  const [rx, ry] = [span / 2, Math.max(2.4, span * 0.085)];
  return (
    `<path fill="none" stroke="${PAPER}" stroke-width="${f(width + 2.4)}" d="M${f(tx)} ${f(ty)}L${f(fx)} ${f(fy)}"/>` +
    `<path fill="none" stroke="${STREET_INK}" stroke-width="${f(width)}" d="M${f(tx)} ${f(ty)}L${f(fx)} ${f(fy)}"/>` +
    `<path fill="none" stroke="${PAPER}" stroke-width="${f(Math.max(0.7, width * 0.1))}" d="M${f(tx - width / 2 + 1.2)} ${f(ty + 4)}L${f(fx - width / 2 + 1.2)} ${f(fy - 2)}"/>` +
    `<path fill="none" stroke="${STREET_INK}" stroke-width="${f(Math.max(2, width * 0.45))}" stroke-linecap="round" d="M${f(tx)} ${f(ty)}Q${f(tx)} ${f(hy - ry)} ${f(hx - rx * 0.4)} ${f(hy - ry * 0.4)}"/>` +
    `<ellipse cx="${f(hx)}" cy="${f(hy)}" rx="${f(rx + 1.2)}" ry="${f(ry + 1.2)}" fill="${PAPER}"/>` +
    `<ellipse cx="${f(hx)}" cy="${f(hy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${STREET_INK}"/>` +
    `<ellipse cx="${f(hx)}" cy="${f(hy - ry * 0.25)}" rx="${f(rx - 1.4)}" ry="${f(ry * 0.45)}" fill="none" stroke="${PAPER}" stroke-width="0.9"/>` +
    `<ellipse cx="${f(hx)}" cy="${f(hy + ry * 0.35)}" rx="${f(rx * 0.42)}" ry="${f(ry * 0.5)}" fill="${PAPER}"/>`
  );
}

// A rail: an ink tube lit along its top.
const railMarkup = (pts: Point[], width: number) =>
  `<path fill="none" stroke="${PAPER}" stroke-width="${f(width + 2)}" stroke-linecap="round" d="${line(pts)}"/>` +
  `<path fill="none" stroke="${STREET_INK}" stroke-width="${f(width)}" stroke-linecap="round" d="${line(pts)}"/>` +
  `<path fill="none" stroke="${PAPER}" stroke-width="${f(width * 0.28)}" stroke-linecap="round" d="${line(pts.map(([x, y]) => [x, y - width * 0.22]))}"/>`;
const postMarkup = (posts: [Point, Point][], width: number) =>
  `<path fill="none" stroke="${PAPER}" stroke-width="${f(width + 1.6)}" d="${posts.map((p) => line(p)).join("")}"/>` +
  `<path fill="none" stroke="${STREET_INK}" stroke-width="${f(width)}" d="${posts.map((p) => line(p)).join("")}"/>`;

export async function draw(): Promise<string> {
  const plate = readPng(fileURLToPath(PLATE));
  const { width: W, height: H, data } = plate;
  const [p, i] = [luminance(...rgb(PAPER)), luminance(...rgb(STREET_INK))];
  const alphaData = Float32Array.from({ length: W * H }, (_, q) => data[q * 4 + 3] / 255);
  const share = Float32Array.from({ length: W * H }, (_, q) => (p - luminance(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])) / (p - i));
  const alpha: Field = { width: W, height: H, data: alphaData };
  const leafTone: Field = { width: W, height: H, data: blur(share, alphaData, W, H, 3) };
  const hatchTone: Field = { width: W, height: H, data: blur(share, alphaData, W, H, 0.9 * SPACING) };
  const out: string[] = [];

  // Back to front: trunks, the foliage over them, the lamps behind the wall.
  out.push(`<path fill="${STREET_INK}" d="${strokeData(TRUNKS.map((t) => drawn(t.line, t.width)))}"/>`);
  // What the structure covers, where no foliage is placed, at a pixel.
  const solid: Field = over([0, 0, W, H], 1, () => 0);
  for (let y = BOX[1]; y < BOX[3]; y++) for (let x = 0; x < W; x++) solid.data[y * W + x] = structure(x + 0.5, y + 0.5) > -1 ? 1 : 0;
  const broad: Field = { width: W, height: H, data: blur(share, alphaData, W, H, 6) };
  const { mass, inked } = foliage(leafTone, broad, alpha, solid);
  out.push(placed(BOX, shapes(mass, K, 0.3, 1), K, PAPER));
  out.push(placed(BOX, shapes(inked, K, 0.25, 0.5), K, STREET_INK));
  for (const l of BACK_LAMPS) out.push(lampMarkup(l));

  // The railing on the left, behind the planters; and the posts of the right's handrail.
  out.push(postMarkup(POSTS, 3.2));
  for (const r of RAILS) out.push(railMarkup(r, 4.6));

  // The blocks: a paper ground, the level lines at the plate's tone, an ink outline, a lit top.
  const inside: Field = over([0, 0, W, H], 1, () => 0);
  const blockBox: Box = [0, 790, 1254, 1065];
  for (let y = blockBox[1]; y < blockBox[3]; y++)
    for (let x = blockBox[0]; x < blockBox[2]; x++) {
      let d = -Infinity;
      for (const b of BLOCKS) d = Math.max(d, distance(b, x + 0.5, y + 0.5));
      inside.data[y * W + x] = Math.min(1, Math.max(0, d / 2 + 0.5));
    }
  out.push(`<path fill="${PAPER}" d="${BLOCKS.map(pathOf).join("")}"/>`);
  // The slatted fence behind the railing is light: its posts are drawn, its slats are thin.
  const width = (x: number, y: number) => {
    const most = distance(BLOCKS[0], x, y) > 0 ? 0.35 : 0.85;
    const w = Math.min(most, Math.max(0, sample(hatchTone, x, y))) * SPACING - 0.48;
    return w < 0.3 ? 0 : w;
  };
  out.push(placed(blockBox, shapes(ink(width, { level, spacing: SPACING }, inside, blockBox, 3), 3, 0.2, 0.3), 3, STREET_INK));
  out.push(`<path fill="none" stroke="${STREET_INK}" stroke-width="1.1" stroke-linejoin="round" d="${BLOCKS.map(pathOf).join("")}"/>`);
  out.push(`<path fill="none" stroke="${PAPER}" stroke-width="1.4" stroke-linecap="round" d="${BLOCKS.map((b) => line([[b[0][0] + 1, b[0][1] + 1.6], [b[1][0] - 1, b[1][1] + 1.6]])).join("")}"/>`);
  out.push(`<path fill="${STREET_INK}" d="${LAMP_BASES.map(pathOf).join("")}"/>`);

  // In front: the handrail and its posts, and the lamps along the left.
  out.push(postMarkup(HANDRAIL_POSTS, 4));
  out.push(railMarkup(HANDRAIL, 4.4));
  for (const l of FRONT_LAMPS) out.push(lampMarkup(l));
  return out.join("\n");
}

export const title = "Street trees, lamps and railings, as a wavy-line engraving";
await run(import.meta.url, { title, draw }, "tree");
