// The page as a signed distance field: for every pixel, how far it is to the edge of the ink, negative inside.
// The shader draws the page from it at any scale with a clean edge, softens it through thick glass by widening
// that edge, and melts one page into the next by easing between two fields. Edge pixels start from their
// coverage, so the edge falls between pixels where the drawing put it (after Felzenszwalb and Huttenlocher's
// distance transform, seeded as Mapbox's tiny-sdf seeds it).
//
// It runs in a worker, started by show.ts, so a page is measured while the glass keeps moving:
//
//   post { id, cover: Uint8Array, w, h }    the ink's coverage, 0 to 255, row by row
//   get  { id, field: Float32Array }        distances in pixels, row by row

const INF = 1e20;

export function field(cover: Uint8Array, w: number, h: number): Float32Array {
  const n = w * h, outer = new Float64Array(n), inner = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = cover[i] / 255;
    if (a >= 1) (outer[i] = 0), (inner[i] = INF);
    else if (a <= 0) (outer[i] = INF), (inner[i] = 0);
    else {
      // partly covered: the edge lies half a pixel's worth of coverage away
      const d = 0.5 - a;
      outer[i] = d > 0 ? d * d : 0;
      inner[i] = d < 0 ? d * d : 0;
    }
  }
  const m = Math.max(w, h), f = new Float64Array(m), v = new Uint32Array(m), z = new Float64Array(m + 1);
  for (const grid of [outer, inner]) {
    for (let x = 0; x < w; x++) line(grid, x, w, h, f, v, z);
    for (let y = 0; y < h; y++) line(grid, y * w, 1, w, f, v, z);
  }
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.sqrt(outer[i]) - Math.sqrt(inner[i]);
  return out;
}

/** The squared distance transform along one line of the grid, in place: the lower envelope of parabolas. */
function line(grid: Float64Array, offset: number, stride: number, length: number, f: Float64Array, v: Uint32Array, z: Float64Array): void {
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  f[0] = grid[offset];
  for (let q = 1, k = 0, s = 0; q < length; q++) {
    f[q] = grid[offset + q * stride];
    const q2 = q * q;
    do {
      const r = v[k];
      s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2;
    } while (s <= z[k] && --k > -1);
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  for (let q = 0, k = 0; q < length; q++) {
    while (z[k + 1] < q) k++;
    const r = v[k], qr = q - r;
    grid[offset + q * stride] = f[r] + qr * qr;
  }
}

if (typeof window === "undefined") {
  self.onmessage = (e: MessageEvent<{ id: number; cover: Uint8Array; w: number; h: number }>) => {
    const { id, cover, w, h } = e.data, out = field(cover, w, h);
    self.postMessage({ id, field: out }, { transfer: [out.buffer] });
  };
}
