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

import { type Point, distance, pathOf } from "../../../harness/trace/polygon.ts";
import { type Box, type Field, blur, ink, luminance, over, placed, rgb, sample, shapes, waves } from "../engrave.ts";
import { PAPER, SPACING, STREET_INK, run, source } from "../sheet.ts";
import { drawn, strokeData } from "../subject/lines.ts";
import { BACK_LAMPS, BLOCKS, FRONT_LAMPS, HANDRAIL, HANDRAIL_POSTS, LAMP_BASES, type Lamp, POSTS, RAILS, TRUNKS } from "./scene.ts";

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
// and inside it, the light cut out as whole leaves: five-lobed stars of paper, eight to fourteen
// px across as the whole's are, as many as the plate's local tone asks, so the canopy reads as
// lit leaves against shade rather than as speckle. Returns the mass (for a paper ground) and the
// inked mass.
const CANOPY = 0.48; // the broad tone above which the canopy is
const STAR = 7; // px: a lit leaf's cell
// A star-shaped leaf: five pointed lobes of radius r, turned by phi; signed distance, + inside.
const star = (r: number, phi: number) => (dx: number, dy: number) => {
  const lobes = 0.42 + 0.58 * Math.abs(Math.cos(2.5 * (Math.atan2(dy, dx) - phi))) ** 2.2;
  return r * lobes - Math.hypot(dx, dy);
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
  // of paper often enough to give it on average.
  for (let j = Math.floor(y0 / STAR); j * STAR < y1; j++)
    for (let i = 0; i * STAR < x1; i++) {
      const [cx, cy] = [(i + hash(i, j, 11)) * STAR, (j + hash(i, j, 12)) * STAR];
      const gi = Math.floor((cy - y0) * K) * w + Math.floor((cx - x0) * K);
      if (gi < 0 || gi >= G.length || mass[gi] < 1) continue;
      const t = sample(tone, cx, cy);
      const paper = Math.max(0, Math.min(1, 1 - t));
      const r = 4 + 3 * hash(i, j, 15);
      if (hash(i, j, 13) > (paper * STAR * STAR) / (1.64 * r * r)) continue; // a star's area: 1.64 r^2
      splat(cx, cy, r + 1, star(r, hash(i, j, 14) * 2 * Math.PI), true);
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
  const plate = source("tree");
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

  // The blocks, back to front: a paper ground, the level lines at the plate's tone, an ink
  // outline, a lit top; each outline hidden where a block in front covers it.
  const inside: Field = over([0, 0, W, H], 1, () => 0);
  const front = new Int8Array(W * H).fill(-1); // the block in front at each pixel
  const blockBox: Box = [0, 790, 1254, 1065];
  for (let y = blockBox[1]; y < blockBox[3]; y++)
    for (let x = blockBox[0]; x < blockBox[2]; x++) {
      let d = -Infinity;
      BLOCKS.forEach((b, k) => {
        const e = distance(b, x + 0.5, y + 0.5);
        d = Math.max(d, e);
        if (e > 0) front[y * W + x] = k;
      });
      inside.data[y * W + x] = Math.min(1, Math.max(0, d / 2 + 0.5));
    }
  out.push(`<path fill="${PAPER}" d="${BLOCKS.map(pathOf).join("")}"/>`);
  // The slatted fence behind the railing is light, where nothing stands in front of it.
  const width = (x: number, y: number) => {
    const most = front[Math.floor(y) * W + Math.floor(x)] === 0 ? 0.35 : 0.85;
    const w = Math.min(most, Math.max(0, sample(hatchTone, x, y))) * SPACING - 0.48;
    return w < 0.3 ? 0 : w;
  };
  out.push(placed(blockBox, shapes(ink(width, { level, spacing: SPACING }, inside, blockBox, 3), 3, 0.2, 0.3), 3, STREET_INK));
  BLOCKS.forEach((b, k) => {
    const ahead = BLOCKS.slice(k + 1).map(pathOf).join("");
    const mask = ahead ? ` mask="url(#block-${k})"` : "";
    if (ahead) out.push(`<mask id="block-${k}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="white"/><path fill="black" d="${ahead}"/></mask>`);
    out.push(
      `<g${mask}><path fill="none" stroke="${STREET_INK}" stroke-width="1.1" stroke-linejoin="round" d="${pathOf(b)}"/>` +
        `<path fill="none" stroke="${PAPER}" stroke-width="1.4" stroke-linecap="round" d="${line([[b[0][0] + 1, b[0][1] + 1.6], [b[1][0] - 1, b[1][1] + 1.6]])}"/></g>`,
    );
  });

  // The railing on the left, in front of the fence and behind the planters.
  const planters = BLOCKS.slice(1, 8).map(pathOf).join("");
  out.push(`<mask id="railing" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="white"/><path fill="black" d="${planters}"/></mask>`);
  out.push(`<g mask="url(#railing)">${postMarkup(POSTS, 5)}${RAILS.map((r) => railMarkup(r, 4.6)).join("")}</g>`);

  // In front: the handrail and its posts, and the lamps along the left.
  out.push(postMarkup(HANDRAIL_POSTS, 4));
  out.push(railMarkup(HANDRAIL, 4.4));
  for (const l of FRONT_LAMPS) out.push(lampMarkup(l));
  // The pillar the nearest lamp stands on, over its pole's foot.
  out.push(`<path fill="${STREET_INK}" d="${LAMP_BASES.map(pathOf).join("")}"/>`);
  return out.join("\n");
}

export const title = "Street trees, lamps and railings, as a wavy-line engraving";
await run(import.meta.url, { title, draw }, "tree");
