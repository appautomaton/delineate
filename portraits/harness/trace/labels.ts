// Region maps: one label per pixel, naming the region the pixel belongs to. A map is kept as a PNG,
// one flat color per region, so it can be read, checked by eye, and touched up by hand like any
// other asset. A region's color comes from its name alone, so the map survives changes to the
// region list; label 0 is drawn black, so unpainted means the first region.

import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import type { Raster } from "./image.ts";
import type { Prompt, Segmenter } from "./sam.ts";

// FNV-1a over the name, spread to a color; black is kept for the first region.
export function colorOf(name: string, first = false): [number, number, number] {
  if (first) return [0, 0, 0];
  let h = 0x811c9dc5;
  for (const c of name) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  return [(h >>> 16) & 255 || 1, (h >>> 8) & 255, h & 255];
}

export function writeMap(path: string | URL, label: Int16Array, names: string[], width: number, height: number) {
  const png = new PNG({ width, height });
  const colors = names.map((n, i) => colorOf(n, i === 0));
  label.forEach((l, p) => png.data.set([...colors[l], 255], p * 4));
  writeFileSync(path, PNG.sync.write(png));
}

// The map as indices into `names`. Every color in it must name a region.
export function readMap(path: string | URL, names: string[]): { label: Int16Array; width: number; height: number } {
  const png = PNG.sync.read(readFileSync(path));
  const index = new Map(names.map((n, i) => [colorOf(n, i === 0).join(), i]));
  const label = new Int16Array(png.width * png.height);
  const unknown = new Set<string>();
  for (let p = 0; p < label.length; p++) {
    const key = `${png.data[p * 4]},${png.data[p * 4 + 1]},${png.data[p * 4 + 2]}`;
    const i = index.get(key);
    if (i === undefined) unknown.add(key);
    else label[p] = i;
  }
  if (unknown.size) throw new Error(`${path}: colors that name no region: ${[...unknown].slice(0, 8).join("; ")}`);
  return { label, width: png.width, height: png.height };
}

// A map extended `pad` pixels past every edge by copying its edge labels, to match a bled raster.
export function bleedLabels(label: Int16Array, width: number, height: number, pad: number): Int16Array {
  const w = width + 2 * pad;
  const h = height + 2 * pad;
  const out = new Int16Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) out[y * w + x] = label[Math.min(height - 1, Math.max(0, y - pad)) * width + Math.min(width - 1, Math.max(0, x - pad))];
  return out;
}

// The union of what several prompts find: the largest logit of any, per pixel.
export async function union(sam: Segmenter, prompts: Prompt[]): Promise<Float32Array> {
  const out = new Float32Array(sam.width * sam.height).fill(-Infinity);
  for (const prompt of prompts) {
    const logits = await sam.logits(prompt);
    for (let p = 0; p < out.length; p++) out[p] = Math.max(out[p], logits[p]);
  }
  return out;
}

// Islands of `of` that touch no edge, have only one label all around, and are no larger than
// `largest` pixels take that label: segmentation missed them inside the thing.
export function fillHoles(label: Int16Array, w: number, h: number, largest: number, of = 0) {
  const seen = new Uint8Array(label.length);
  for (let s = 0; s < label.length; s++) {
    if (seen[s] || label[s] !== of) continue;
    const island: number[] = [];
    const around = new Set<number>();
    let edge = false;
    const todo = [s];
    seen[s] = 1;
    while (todo.length) {
      const p = todo.pop()!;
      island.push(p);
      const x = p % w;
      const y = (p - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q < 0) continue;
        if (label[q] !== of) around.add(label[q]);
        else if (!seen[q]) {
          seen[q] = 1;
          todo.push(q);
        }
      }
    }
    if (!edge && around.size === 1 && island.length <= largest) for (const p of island) label[p] = [...around][0];
  }
}

// Islands under `speck` pixels take the label that borders them most.
export function despeckle(label: Int16Array, w: number, speck: number) {
  const seen = new Uint8Array(label.length);
  const stack: number[] = [];
  for (let s = 0; s < label.length; s++) {
    if (seen[s]) continue;
    const own = label[s];
    const island: number[] = [];
    const border = new Map<number, number>();
    stack.push(s);
    seen[s] = 1;
    while (stack.length) {
      const p = stack.pop()!;
      island.push(p);
      const x = p % w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w]) {
        if (q < 0 || q >= label.length) continue;
        if (label[q] !== own) border.set(label[q], (border.get(label[q]) ?? 0) + 1);
        else if (!seen[q]) {
          seen[q] = 1;
          stack.push(q);
        }
      }
    }
    if (island.length >= speck || !border.size) continue;
    const to = [...border].sort((a, b) => b[1] - a[1])[0][0];
    for (const p of island) label[p] = to;
  }
}

// Gives every pixel of `within` the label of the nearest pixel outside it: breadth first, one ring
// at a time, each ring reading only the rings before it, and taking the most common label among
// its finished neighbors (higher labels winning ties).
export function spread(labels: Int16Array, within: Uint8Array, w: number) {
  const done = Uint8Array.from(within, (v) => 1 - v);
  const near = (p: number) => {
    const x = p % w;
    return [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w].filter((q) => q >= 0 && q < labels.length);
  };
  let ring: number[] = [];
  for (let p = 0; p < labels.length; p++) if (within[p] && near(p).some((q) => done[q])) ring.push(p);
  while (ring.length) {
    const picks = ring.map((p) => {
      const count = new Map<number, number>();
      for (const q of near(p)) if (done[q]) count.set(labels[q], (count.get(labels[q]) ?? 0) + 1);
      return [...count].sort((x, y) => y[1] - x[1] || y[0] - x[0])[0][0];
    });
    ring.forEach((p, i) => {
      labels[p] = picks[i];
      done[p] = 1;
    });
    const next = new Set<number>();
    for (const p of ring) for (const q of near(p)) if (!done[q]) next.add(q);
    ring = [...next];
  }
}

// Each region tinted its own hue over a dimmed picture, with outlines between regions; label 0 is
// left dim.
export function preview(ref: Raster, label: Int16Array, count: number): Raster {
  const { width } = ref;
  const data = Uint8Array.from(ref.data);
  const hue = Array.from({ length: count }, (_, i) => {
    const h = (i * 137.508) % 360;
    const f = (k: number) => {
      const a = (k + h / 30) % 12;
      return 255 * (0.5 - 0.5 * Math.max(-1, Math.min(a - 3, 9 - a, 1)));
    };
    return [f(0), f(8), f(4)];
  });
  for (let p = 0; p < label.length; p++) {
    const edge = (p % width < width - 1 && label[p + 1] !== label[p]) || (p + width < label.length && label[p + width] !== label[p]);
    const c = hue[label[p]];
    for (let k = 0; k < 3; k++) data[p * 4 + k] = edge ? 255 : label[p] === 0 ? data[p * 4 + k] * 0.35 : data[p * 4 + k] * 0.45 + c[k] * 0.55;
  }
  return { width: ref.width, height: ref.height, data };
}
