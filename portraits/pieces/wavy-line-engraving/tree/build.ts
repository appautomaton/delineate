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
import { type Box, type Field, blur, ink, luminance, over, placed, rgb, sample, shapes, waves } from "../engrave.ts";
import { PAPER, REFERENCES, SPACING, STREET_INK, run, source } from "../sheet.ts";
import { drawn, strokeData } from "../subject/lines.ts";
import { BACK_LAMPS, BLOCKS, FRONT_LAMPS, HANDRAIL, HANDRAIL_POSTS, LAMP_BASES, type Lamp, POSTS, RAILS, TRUNKS } from "./scene.ts";

const PLATE = new URL("wav-tree.png", REFERENCES);
const BOX: Box = [0, 160, 1254, 1070];
const K = 2; // samples per pixel of the foliage field
const level = waves({ ripple: { amplitude: 1.1, wavelength: 26 }, wander: [{ amplitude: 0.6, scale: 34 }, { amplitude: 1.2, scale: 140 }], seed: 31 });

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
// Foliage is not placed there; trunks and branches come directly from the plate's ink.
function structure(x: number, y: number): number {
  let d = -Infinity;
  for (const b of BLOCKS) d = Math.max(d, distance(b, x, y));
  for (const b of LAMP_BASES) d = Math.max(d, distance(b, x, y));
  for (const l of [...FRONT_LAMPS, ...BACK_LAMPS]) d = Math.max(d, l.width / 2 + 2 - toLine([l.top, l.foot], x, y));
  for (const r of RAILS) d = Math.max(d, 4 - toLine(r, x, y));
  return d;
}

// The foliage, trunks, and branches, read directly from the tree plate and the whole:
// - Ink: wherever the tree plate is dark (leaves, limbs, trunks, and the forks between them),
//   carved open wherever either the tree plate or the whole engraving is locally lighter than its
//   surroundings (sunlit leaves, pale leaf veins, and the bright edges separating limbs from the
//   canopy) or open to the sky and buildings behind.
// - Paper backing (`ground`): only where the foliage is dense enough to hide the buildings behind,
//   while staying open in the gaps between branches and trunks so the buildings' lines show through
//   just as they do in the whole engraving, and bright inside the lit leaf cutouts.
function foliage(treeInk: Field, wholeInk: Field, around: Field, broad: Field, alpha: Field, solid: Field): { ground: Field; inked: Field } {
  const [x0, y0, x1, y1] = BOX;
  const [w, h] = [(x1 - x0) * K, (y1 - y0) * K];
  const ground = new Float32Array(w * h);
  const inked = new Float32Array(w * h);
  for (let gy = 0; gy < h; gy++)
    for (let gx = 0; gx < w; gx++) {
      const [x, y] = [x0 + (gx + 0.5) / K, y0 + (gy + 0.5) / K];
      // Inside the gaps between his arms and waist (y > 820, x in 432..474 or 788..830), the whole
      // shows the sunlit plaza and distant railing rather than the tree plate's overpainted shrub.
      const inArmGap = y > 820 && ((x > 432 && x < 474) || (x > 788 && x < 830));
      if (inArmGap || sample(alpha, x, y) < 0.5 || sample(solid, x, y) > 0.5) {
        ground[gy * w + gx] = -1;
        inked[gy * w + gx] = -1;
        continue;
      }
      const t = sample(treeInk, x, y);
      const fw = sample(wholeInk, x, y);
      const loc = sample(around, x, y);
      const b = sample(broad, x, y);
      const dark = Math.min(t, fw);
      // Carve open wherever dark < 0.46 (sunlit leaves and sky/building gaps) or where the pixel is
      // locally lighter than its 3px neighborhood by more than 0.14 (mid-tone leaf flecks and limb rims).
      const inkVal = Math.min(dark - 0.46, dark - (loc - 0.14));
      // Paper ground where the canopy is a dense cluster (b > 0.54) or where a sunlit leaf is carved
      // inside the canopy (dark < 0.44 and b > 0.42), except at the upper-left tower edge (x < 140,
      // y < 380) where the left near tower's sunlit floor lines show through the upper crown.
      const openTower = x < 140 && y < 380;
      const litLeaf = !openTower && b > 0.42 ? 0.44 - dark : -1;
      const gVal = openTower ? inkVal : Math.max(inkVal, b - 0.54, litLeaf);
      ground[gy * w + gx] = gVal;
      inked[gy * w + gx] = inkVal;
    }
  return { ground: { width: w, height: h, data: ground }, inked: { width: w, height: h, data: inked } };
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
  const rawPlate = readPng(fileURLToPath(PLATE));
  const plate = source("tree");
  const { width: W, height: H, data } = plate;
  const [p, i] = [luminance(...rgb(PAPER)), luminance(...rgb(STREET_INK))];
  const alphaData = Float32Array.from({ length: W * H }, (_, q) => rawPlate.data[q * 4 + 3] / 255);
  const rawShare = Float32Array.from({ length: W * H }, (_, q) => (p - luminance(rawPlate.data[q * 4], rawPlate.data[q * 4 + 1], rawPlate.data[q * 4 + 2])) / (p - i));
  const share = Float32Array.from({ length: W * H }, (_, q) => (p - luminance(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])) / (p - i));
  const alpha: Field = { width: W, height: H, data: alphaData };
  const treeInk: Field = { width: W, height: H, data: blur(rawShare, alphaData, W, H, 0.5) };
  const wholeInk: Field = { width: W, height: H, data: blur(share, alphaData, W, H, 0.5) };
  const around: Field = { width: W, height: H, data: blur(rawShare, alphaData, W, H, 3) };
  const hatchTone: Field = { width: W, height: H, data: blur(share, alphaData, W, H, 0.9 * SPACING) };
  const out: string[] = [];

  // What the structure covers, where no foliage is placed, at a pixel.
  const solid: Field = over([0, 0, W, H], 1, () => 0);
  for (let y = BOX[1]; y < BOX[3]; y++) for (let x = 0; x < W; x++) solid.data[y * W + x] = structure(x + 0.5, y + 0.5) > -1 ? 1 : 0;
  const broad: Field = { width: W, height: H, data: blur(rawShare, alphaData, W, H, 5) };
  const { ground, inked } = foliage(treeInk, wholeInk, around, broad, alpha, solid);
  out.push(placed(BOX, shapes(ground, K, 0.35, 2.5), K, PAPER));
  out.push(`<path fill="${STREET_INK}" d="${strokeData(TRUNKS.map((t) => drawn(t.line, t.width)))}"/>`);
  out.push(placed(BOX, shapes(inked, K, 0.3, 1.2), K, STREET_INK));
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
