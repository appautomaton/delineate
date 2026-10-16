// The numerals, cut from plywood. Each is drawn once into a canvas, in the page's display face: a face of pale
// birch with its grain, and an edge of veneers, light and dark in turn. Its shape for the water is sampled from
// the same pixels, so what is seen and what floats are one shape.
//
// On the page each numeral is a stack of images: the edge's veneers, each a hair further along the light's way,
// and the face on top. The stack's offset stays fixed on the screen however the numeral turns, so it reads as a
// thick cut piece lit from the upper left.

import type { Shape } from "./water/bodies.ts";
import type { Pt } from "./water/sim.ts";

const FACE = "Hedvig Letters Serif";
const VENEERS = 8; // layers of the edge
const SIDE = { x: 0.5, y: 0.9 }; // px each veneer lies along the light's way
const BALLAST = 5; // how much heavier the foot is than the head, less one

export type Numeral = {
  el: HTMLElement;
  layers: HTMLElement[]; // the veneers, deepest first, then the face
  centre: Pt; // the centre of mass, within the drawing's box
  shape: Shape;
};

// A seeded random, so the grain is the same on every visit.
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function cut(text: string, size: number, seed: number, into: HTMLElement): Promise<Numeral> {
  const font = `400 ${size}px "${FACE}"`;
  await document.fonts.load(font, text);
  const dpr = Math.min(devicePixelRatio, 2);
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font;
  const m = measure.measureText(text);
  const pad = Math.ceil(size * 0.04);
  const w = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2;
  const h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2;
  const at = { x: pad + m.actualBoundingBoxLeft, y: pad + m.actualBoundingBoxAscent };

  const canvas = () => {
    const c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr);
    c.height = Math.ceil(h * dpr);
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    g.font = font;
    return [c, g] as const;
  };

  // The glyph alone, as a mask.
  const [mask, mg] = canvas();
  mg.fillText(text, at.x, at.y);

  // Its shape: a point at the middle of every cell the glyph mostly covers; on the outline where a neighbour does not.
  const cell = Math.max(5, size / 20);
  const cols = Math.floor(w / cell), rows = Math.floor(h / cell);
  const alpha = mg.getImageData(0, 0, mask.width, mask.height).data;
  const inside = (cx: number, cy: number) => {
    if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return false;
    const x = Math.floor((cx + 0.5) * cell * dpr), y = Math.floor((cy + 0.5) * cell * dpr);
    return alpha[(y * mask.width + x) * 4 + 3] > 127;
  };
  const pts: number[] = [], edge: number[] = [];
  for (let cy = 0; cy < rows; cy++)
    for (let cx = 0; cx < cols; cx++) {
      if (!inside(cx, cy)) continue;
      pts.push((cx + 0.5) * cell, (cy + 0.5) * cell);
      edge.push(inside(cx - 1, cy) && inside(cx + 1, cy) && inside(cx, cy - 1) && inside(cx, cy + 1) ? 0 : 1);
    }
  // Weighted at the foot, as a buoy is: the lowest wood several times as heavy as the highest, the whole no heavier
  // for it, so the numeral's centre of mass lies below the water that holds it up and it floats upright, rocking
  // back when a wave tips it.
  let top = Infinity, foot = -Infinity;
  for (let k = 1; k < pts.length; k += 2) (top = Math.min(top, pts[k])), (foot = Math.max(foot, pts[k]));
  const weight = new Float64Array(pts.length / 2);
  for (let k = 0; k < weight.length; k++) weight[k] = 1 + BALLAST * ((pts[2 * k + 1] - top) / (foot - top || 1)) ** 3;
  const mean = weight.reduce((a, b) => a + b, 0) / weight.length;
  let sx = 0, sy = 0;
  for (let k = 0; k < weight.length; k++) (weight[k] /= mean), (sx += pts[2 * k] * weight[k]), (sy += pts[2 * k + 1] * weight[k]);
  const centre = { x: sx / weight.length, y: sy / weight.length };
  const points = new Float64Array(pts.length);
  for (let k = 0; k < pts.length; k += 2) (points[k] = pts[k] - centre.x), (points[k + 1] = pts[k + 1] - centre.y);

  // The face: birch, its grain running across in long, slow waves, a darker figure here and there, the cut's
  // edge caught by the light along the upper left.
  const rand = random(seed);
  const [face, fg] = canvas();
  fg.fillStyle = "#e2c79c";
  fg.fillRect(0, 0, w, h);
  for (let y = -10; y < h + 10; y += 1.6 + rand() * 2.4) {
    const tone = rand();
    fg.strokeStyle = tone < 0.12 ? "rgba(140, 92, 48, 0.35)" : tone < 0.5 ? "rgba(176, 128, 76, 0.18)" : "rgba(255, 240, 210, 0.22)";
    fg.lineWidth = 0.6 + rand() * (tone < 0.12 ? 2.2 : 1.2);
    const a = 2 + rand() * 6, f = 0.004 + rand() * 0.01, p = rand() * 6.28;
    fg.beginPath();
    for (let x = -4; x <= w + 4; x += 6) fg.lineTo(x, y + a * Math.sin(x * f + p) + 3 * Math.sin(x * f * 3.1 + p * 2));
    fg.stroke();
  }
  fg.globalCompositeOperation = "destination-in";
  fg.drawImage(mask, 0, 0, w, h);
  fg.globalCompositeOperation = "source-atop";
  fg.lineJoin = "round";
  fg.strokeStyle = "rgba(255, 248, 232, 0.55)";
  fg.lineWidth = Math.max(1.5, size / 140);
  fg.strokeText(text, at.x + 0.6, at.y + 0.6);
  fg.strokeStyle = "rgba(120, 78, 40, 0.35)";
  fg.strokeText(text, at.x - 0.6, at.y - 0.6);

  // The veneers of the edge, light and dark.
  const veneer = (colour: string) => {
    const [c, g] = canvas();
    g.drawImage(mask, 0, 0, w, h);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = colour;
    g.fillRect(0, 0, w, h);
    return c;
  };
  const light = veneer("#c99d63"), dark = veneer("#8f6236");

  const el = document.createElement("div");
  el.className = "numeral";
  el.hidden = true; // until it is first set in place
  el.setAttribute("aria-hidden", "true");
  const layers: HTMLElement[] = [];
  for (let k = VENEERS; k >= 0; k--) {
    const src = k === 0 ? face : k % 2 ? dark : light;
    const c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    c.getContext("2d")!.drawImage(src, 0, 0);
    Object.assign(c.style, { width: `${w}px`, height: `${h}px`, transformOrigin: `${centre.x}px ${centre.y}px` });
    c.dataset.depth = String(k);
    el.append(c);
    layers.push(c);
  }
  into.append(el);
  return { el, layers, centre, shape: { points, weight, edge: Uint8Array.from(edge), cell } };
}

// Sets a numeral where its body is: x, y and angle, on the screen, the tank's corner at origin.
export function place(n: Numeral, x: number, y: number, a: number, origin: Pt): void {
  const bx = x - origin.x - n.centre.x, by = y - origin.y - n.centre.y;
  const deepest = n.layers.length - 1;
  n.el.hidden = false;
  n.layers.forEach((layer, i) => {
    const k = deepest - i;
    layer.style.transform = `translate(${bx + k * SIDE.x}px, ${by + k * SIDE.y}px) rotate(${a}rad)`;
  });
}

// Where on a numeral a point on the screen falls, in the numeral's own frame, if it falls on the numeral at all.
export function hit(n: Numeral, x: number, y: number, bx: number, by: number, a: number): Pt | null {
  const dx = x - bx, dy = y - by, c = Math.cos(-a), s = Math.sin(-a);
  const lx = c * dx - s * dy, ly = s * dx + c * dy;
  const { points, cell } = n.shape;
  const r2 = (cell * 0.9) ** 2;
  for (let k = 0; k < points.length; k += 2) if ((points[k] - lx) ** 2 + (points[k + 1] - ly) ** 2 < r2) return { x: lx, y: ly };
  return null;
}
