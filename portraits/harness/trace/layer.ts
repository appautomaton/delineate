// One layer of a layered picture, traced. A layer is drawn from the pixels it shows in the
// reference, extended a margin under the layers in front of it, so that parallax and motion slide
// it about without opening a hole, and extended all the way under loose pieces that will move off
// it. The hidden extension is inpainted from the layer's own pixels alone (Telea's fast marching
// method), so nothing of the things in front leaks into it. The layer then becomes a tone stack
// with a palette of its own.

import { labPlanes } from "./color.ts";
import { opencv } from "./cv.ts";
import type { Raster } from "./image.ts";
import { type Planes, paletteFor } from "./quantize.ts";
import { grow } from "./mask.ts";
import { type Bounds, type Piece, type StackOptions, blur, order, stack } from "./stack.ts";

// Pixels this close to a nearer layer carry some of its color in their anti-aliasing, so the
// hidden extension is painted from the layer's pixels farther in.
const BLEED = 2;

export type LayerSpec = {
  own: Uint8Array; // 1 where the layer shows
  under: Uint8Array; // 1 where nearer layers cover it, so it may extend there
  margin: number; // how far it extends under them, in pixels
  holes?: Uint8Array; // 1 under loose pieces that will move away: filled entirely, however far
  known?: Uint8Array; // 1 where `paint` already holds the layer's own colors under nearer layers
  error?: number; // the palette's target error; see paletteFor
  maxTones?: number;
  stack?: StackOptions;
};

export type Traced = { pieces: Piece[]; tones: number; box: Bounds };

// How finely a region is traced: the mean OKLab error its palette may leave (see paletteFor) and
// its most tones, how far curves may stray from the outlines, the blur that smooths outlines before
// fitting, the largest ramp drawn flat, the smallest shape kept, and when rings are drawn straight
// (see fitRing). Smooth skin needs fine steps; a busy, distant city hides coarse ones.
export type TraceStyle = { error?: number; maxTones?: number; tolerance?: number; soften?: number; flat?: number; minArea?: number; corner?: number; straight?: number };

// The settings traceLayer takes for a style, in a picture bled `bleed` pixels past its frame.
export function styled({ error, maxTones, tolerance, soften, flat, minArea, corner, straight }: TraceStyle, bleed: number): Pick<LayerSpec, "error" | "maxTones" | "stack"> {
  return { error, maxTones, stack: { soften, flat, minArea, fit: { tolerance, corner, straight }, origin: [bleed, bleed] } };
}

// `paint` is the reference; `flat` is the reference with its paint texture flattened.
export async function traceLayer(paint: Raster, flat: Raster, { own, under, margin, holes, known, error, maxTones, stack: options }: LayerSpec): Promise<Traced | undefined> {
  const { width: w, height: h } = paint;
  const shown: number[] = [];
  for (let p = 0; p < own.length; p++) if (own[p]) shown.push(p);
  if (!shown.length) return;

  let inside = reach(own, under, margin, w, h);
  if (holes) inside = reach(inside, holes, Math.max(w, h), w, h);
  const near = grow(under, w, h, BLEED);
  let clean: Uint8Array = Uint8Array.from(own, (v, p) => (v && !near[p] ? 1 : 0));
  if (clean.reduce((s, v) => s + v, 0) < shown.length / 2) clean = Uint8Array.from(own);
  if (known) for (let p = 0; p < clean.length; p++) clean[p] |= known[p];
  const [painted, flattened] = await inpaint([paint, flat], clean, inside);
  const box = bounds(inside, w, h, 2);
  const region = blur(Float32Array.from(inside, (v) => (v ? 1 : -1)), w, h, 0.6);

  const lab: Planes = labPlanes(flattened.data, w * h);
  const pixels = Int32Array.from(shown);
  const palette = order(lab, pixels, paletteFor(lab, pixels, { error, max: maxTones }));
  return { pieces: stack(lab, painted, region, box, palette, options), tones: palette.length, box };
}

// `from` grown into `into`, up to `margin` pixels (8-connected steps).
export function reach(from: Uint8Array, into: Uint8Array, margin: number, w: number, h: number): Uint8Array {
  const inside = Uint8Array.from(from);
  let frontier: number[] = [];
  for (let p = 0; p < inside.length; p++) if (inside[p]) frontier.push(p);
  for (let ring = 0; ring < margin && frontier.length; ring++) {
    const next: number[] = [];
    for (const p of frontier) {
      const x = p % w;
      const y = (p - x) / w;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (x + dx < 0 || y + dy < 0 || x + dx >= w || y + dy >= h) continue;
          const q = p + dy * w + dx;
          if (!inside[q] && into[q]) {
            inside[q] = 1;
            next.push(q);
          }
        }
    }
    frontier = next;
  }
  return inside;
}

// Copies of `rasters` with the pixels of `fill` outside `known` painted in from `known` alone.
export async function inpaint(rasters: Raster[], known: Uint8Array, fill: Uint8Array): Promise<Raster[]> {
  const cv = await opencv();
  const { width: w, height: h } = rasters[0];
  const todo = Uint8Array.from(fill, (v, p) => (v && !known[p] ? 1 : 0));
  if (!todo.some((v) => v)) return rasters;
  const box = bounds(Uint8Array.from(todo, (v, p) => v | known[p]), w, h, 4);
  const mask = new cv.Mat(box.height, box.width, cv.CV_8UC1);
  for (let y = 0; y < box.height; y++) for (let x = 0; x < box.width; x++) mask.data[y * box.width + x] = known[(box.y + y) * w + box.x + x] ? 0 : 255;
  const out = rasters.map((r) => {
    const src = new cv.Mat(box.height, box.width, cv.CV_8UC3);
    for (let y = 0; y < box.height; y++)
      for (let x = 0; x < box.width; x++) {
        const p = ((box.y + y) * w + box.x + x) * 4;
        src.data.set(r.data.subarray(p, p + 3), (y * box.width + x) * 3);
      }
    const dst = new cv.Mat();
    cv.inpaint(src, mask, dst, 5, cv.INPAINT_TELEA);
    const data = Uint8Array.from(r.data);
    for (let y = 0; y < box.height; y++)
      for (let x = 0; x < box.width; x++) {
        const p = (box.y + y) * w + box.x + x;
        if (todo[p]) data.set(dst.data.subarray((y * box.width + x) * 3, (y * box.width + x) * 3 + 3), p * 4);
      }
    src.delete();
    dst.delete();
    return { ...r, data };
  });
  mask.delete();
  return out;
}

function bounds(mask: Uint8Array, w: number, h: number, pad: number): Bounds {
  let x0 = w;
  let y0 = h;
  let x1 = 0;
  let y1 = 0;
  for (let p = 0; p < mask.length; p++) {
    if (!mask[p]) continue;
    const x = p % w;
    const y = (p - x) / w;
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(w - 1, x1 + pad);
  y1 = Math.min(h - 1, y1 + pad);
  return { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}
