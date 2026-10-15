// The light the line drawings are matched to: the key-light render (its cast shadows and raking
// light), raised so its lit side meets the paper, plus a soft fill from the front, on the side away
// from the key, computed from the normals, so the shadow side keeps its modelling instead of
// closing to black: a white marble figure, lit as a print would light it. `v` runs 0 (no light) to
// 1 (full light).
import type { Raster } from "../../portraits/harness/trace/image.ts";
import type { Fields } from "./fields.ts";

const KEY = 1.1;
const FILL = 0.3;
export const toLinear = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const toSrgb = (v: number) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055);
export const unit = (v: number[]) => {
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
};

export function light({ source: { tone, normal }, side }: Fields): Float32Array {
  const fillDir = unit([-side * 0.55, 0.1, 0.83]);
  const out = new Float32Array(tone.width * tone.height);
  for (let p = 0; p < out.length; p++) {
    const key = toLinear(tone.data[p * 4]) / 0.83; // the render's 99th-percentile light, 0.92 sRGB
    const fill = Math.max(0, normal[0].data[p] * fillDir[0] + normal[1].data[p] * fillDir[1] + normal[2].data[p] * fillDir[2]);
    out[p] = Math.min(1, KEY * key + FILL * fill * (1 - 0.6 * Math.min(1, key)));
  }
  return out;
}

// A grey raster (with the render's opacity) whose linear luminance is `lum(v)` for each light v.
export function asRaster(source: Fields["source"], v: Float32Array, lum: (v: number) => number): Raster {
  const data = Uint8Array.from(source.tone.data);
  v.forEach((x, p) => (data[p * 4] = data[p * 4 + 1] = data[p * 4 + 2] = Math.round(toSrgb(lum(x)))));
  return { width: source.tone.width, height: source.tone.height, data };
}

// How much of each point's surroundings stands in front of it, 0..1: where a form passes behind
// another, the farther one darkens toward the edge, as an engraver deepens the tone there so the
// overlap reads. Sampled on rings around each point, out to `radius` source pixels.
export function occlusion({ alpha, depth }: Fields["source"], radius = 9): Float32Array {
  const { width: w, height: h } = alpha;
  const out = new Float32Array(w * h);
  const z = depth.data;
  const taps: [number, number, number][] = [];
  for (let k = 0; k < 24; k++) {
    const a = (k * 2 * Math.PI) / 24 + 0.37 * k;
    const r = radius * (0.3 + 0.7 * ((k * 7) % 24) / 23);
    taps.push([Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r), 1 - r / (radius * 1.15)]);
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (alpha.data[p] < 0.5) continue;
      let [s, n] = [0, 0];
      for (const [dx, dy, g] of taps) {
        const [qx, qy] = [x + dx, y + dy];
        n += g;
        if (qx < 0 || qy < 0 || qx >= w || qy >= h || alpha.data[qy * w + qx] < 0.5) continue;
        const d = z[p] - z[qy * w + qx];
        const t = Math.min(1, Math.max(0, (d - 0.012) / 0.05));
        s += g * t * t * (3 - 2 * t);
      }
      out[p] = Math.min(1, (2 * s) / n);
    }
  return out;
}
