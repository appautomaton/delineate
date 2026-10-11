// Sprites: one drawing placed many times (petals, leaves, feathers). The drawing lies along x in a
// 100 by 100 box centered on its origin, and fills with var(--<id>), so each copy can take its own
// color. A placement gives a copy its center, angle, length and width, color, and the blur that puts
// it out of focus; the blur is applied outside the placement, so it does not scale with the copy.

import { type Point } from "../trace/polygon.ts";
import { type Shape, footprint } from "./shape.ts";

// `outline`: the drawing's silhouette in its box, for footprints and for sizing a found copy.
export type Sprite = { id: string; outline: Point[]; paths: string };
export type Placement = { at: Point; angle: number; length: number; width: number; color: string; blur: number };

const r = (v: number, k = 10) => Math.round(v * k) / k;

export const symbolOf = ({ id, paths }: Sprite) => `<symbol id="${id}" viewBox="-50 -50 100 100" overflow="visible">\n${paths}\n</symbol>`;

// One copy as a group: blur outside, placement inside. `classes` say how it moves (by default, the
// sprite's id), `style` sets its custom properties.
export function spriteMarkup(sprite: Sprite, { at: [x, y], angle, length, width, color, blur }: Placement, id: string, { classes = sprite.id, style = "" } = {}): string {
  const use = `<use href="#${sprite.id}" width="100" height="100" x="-50" y="-50" transform="translate(${r(x)} ${r(y)}) rotate(${r(angle)}) scale(${r(length / 100, 1000)} ${r(width / 100, 1000)})" style="--${sprite.id}:${color}"/>`;
  const filter = blur >= 0.4 ? ` filter="url(#soft-${blurStep(blur)})"` : "";
  return `<g id="${id}" class="${classes}"${style ? ` style="${style}"` : ""}><g${filter}>${use}</g></g>`;
}

// Blurs come in half-pixel steps, one filter per step shared by every copy that uses it.
export const blurStep = (blur: number) => (Math.round(blur * 2) / 2).toFixed(1).replace(".", "_");

export function blurFilters(placements: Placement[]): string {
  const steps = [...new Set(placements.filter((p) => p.blur >= 0.4).map((p) => Math.round(p.blur * 2) / 2))];
  return steps.map((s) => `<filter id="soft-${blurStep(s)}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${s}"/></filter>`).join("");
}

// The copy's silhouette in picture coordinates.
export function polygon({ outline }: Sprite, { at: [x, y], angle, length, width }: Placement): Point[] {
  const a = (angle * Math.PI) / 180;
  return outline.map(([u, v]): Point => {
    const [su, sv] = [(u * length) / 100, (v * width) / 100];
    return [x + su * Math.cos(a) - sv * Math.sin(a), y + su * Math.sin(a) + sv * Math.cos(a)];
  });
}

export const spriteShape = (sprite: Sprite, p: Placement): Shape => ({ polygon: polygon(sprite, p), color: p.color, blur: p.blur });

// Every pixel a copy touches, its blur included, and `pad` pixels more.
export const spriteFootprint = (sprite: Sprite, p: Placement, w: number, h: number, pad = 0) => footprint(polygon(sprite, p), w, h, 2.5 * p.blur + pad);

// A found copy's place, angle, and size, from its pixels, each with a weight: the centroid; the long
// axis of the second moments, turned so the drawing's narrow end lies where the third moment's long
// tail does; and length and width from the second moments, against the outline's own.
export function placeByMoments(points: [number, number, number][], outline: Point[]): { at: Point; angle: number; length: number; width: number } {
  let [cx, cy, m] = [0, 0, 0];
  for (const [x, y, a] of points) {
    cx += a * x;
    cy += a * y;
    m += a;
  }
  cx /= m;
  cy /= m;
  let [xx, xy, yy] = [0, 0, 0];
  for (const [x, y, a] of points) {
    xx += a * (x - cx) * (x - cx);
    xy += a * (x - cx) * (y - cy);
    yy += a * (y - cy) * (y - cy);
  }
  [xx, xy, yy] = [xx / m, xy / m, yy / m];
  const theta = 0.5 * Math.atan2(2 * xy, xx - yy);
  const tr = xx + yy;
  const root = Math.sqrt(Math.max(0, (tr * tr) / 4 - (xx * yy - xy * xy)));
  let skew = 0;
  for (const [x, y, a] of points) skew += a * ((x - cx) * Math.cos(theta) + (y - cy) * Math.sin(theta)) ** 3;
  const angle = (theta * 180) / Math.PI + (skew > 0 ? 180 : 0);
  const own = moments(outline);
  return { at: [cx, cy], angle: ((angle % 360) + 360) % 360, length: 100 * Math.sqrt((tr / 2 + root) / own.l), width: 100 * Math.sqrt((tr / 2 - root) / own.w) };
}

// Second moments of a polygon along x and y, per unit area.
function moments(outline: Point[]): { l: number; w: number } {
  let [a, xx, yy] = [0, 0, 0];
  for (let i = 0; i < outline.length; i++) {
    const [x0, y0] = outline[i];
    const [x1, y1] = outline[(i + 1) % outline.length];
    const c = x0 * y1 - x1 * y0;
    a += c;
    xx += c * (x0 * x0 + x0 * x1 + x1 * x1);
    yy += c * (y0 * y0 + y0 * y1 + y1 * y1);
  }
  a /= 2;
  return { l: xx / 12 / a, w: yy / 12 / a };
}
