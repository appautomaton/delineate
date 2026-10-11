// Marching squares: the closed outlines of a field's positive region, at sub-pixel precision.
//
// The field holds one value per pixel, sampled at the pixel's center, so pixel (x, y) is sampled
// at (x + 0.5, y + 0.5). Each crossing is placed where the field passes zero along the edge
// between two samples. Outside the raster the field counts as negative, so every outline closes.
// Every ring keeps the inside on the same hand, which makes holes wind against their outlines:
// all the rings of one region drawn as one path fill correctly under the nonzero rule.

export type Ring = Float64Array; // x0, y0, x1, y1, ...

// A cell's corners in order around it, and the midpoints of its edges: edge e joins corner e and
// corner e + 1, so the edges run top, right, bottom, left.
const CORNER = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
] as const;
const MIDPOINT = [
  [0.5, 0],
  [1, 0.5],
  [0.5, 1],
  [0, 0.5],
] as const;

// For each reading of a saddle's center (outside, inside) and each inside/outside case of the
// corners, the directed segments as [from edge, to edge], each turned so the inside lies on its
// right.
const SEGMENTS: [number, number][][][] = [0, 1].map((centerInside) =>
  Array.from({ length: 16 }, (_, mask) => {
    const inside = (c: number) => ((mask >> c) & 1) === 1;
    const crossed = [0, 1, 2, 3].filter((e) => inside(e) !== inside((e + 1) & 3));
    const turn = (a: number, b: number, [px, py]: readonly number[]): [number, number] => {
      // Right of the heading a -> b on screen, where y points down.
      const dx = MIDPOINT[b][0] - MIDPOINT[a][0];
      const dy = MIDPOINT[b][1] - MIDPOINT[a][1];
      return -dy * (px - MIDPOINT[a][0]) + dx * (py - MIDPOINT[a][1]) > 0 ? [a, b] : [b, a];
    };
    if (crossed.length === 0) return [];
    if (crossed.length === 2) return [turn(crossed[0], crossed[1], CORNER[[0, 1, 2, 3].find(inside)!])];
    // A saddle: two segments, each cutting one corner off. With the center inside, the inside
    // joins through it and the outside corners are cut off; otherwise the inside corners are.
    return [0, 1, 2, 3].filter((c) => inside(c) !== (centerInside === 1)).map((c) => turn((c + 3) & 3, c, inside(c) ? CORNER[c] : [0.5, 0.5]));
  }),
);

export function contours(field: Float32Array, width: number, height: number, minArea = 0): Ring[] {
  // Samples with a negative border: grid (gx, gy) holds pixel (gx - 1, gy - 1).
  const gw = width + 2;
  const gh = height + 2;
  const at = (gx: number, gy: number) => (gx < 1 || gy < 1 || gx > width || gy > height ? -1 : field[(gy - 1) * width + gx - 1]);

  // A crossing's id names its edge: horizontal edges are even, vertical edges odd.
  const edgeId = (gx: number, gy: number, e: number) => {
    if (e === 0) return 2 * (gy * gw + gx);
    if (e === 2) return 2 * ((gy + 1) * gw + gx);
    if (e === 3) return 2 * (gy * gw + gx) + 1;
    return 2 * (gy * gw + gx + 1) + 1;
  };
  const point = (id: number): [number, number] => {
    const cell = id >> 1;
    const gx = cell % gw;
    const gy = (cell - gx) / gw;
    const [x1, y1] = id & 1 ? [gx, gy + 1] : [gx + 1, gy];
    const a = at(gx, gy);
    const b = at(x1, y1);
    const t = a / (a - b);
    // Grid (gx, gy) sits at pixel center (gx - 0.5, gy - 0.5).
    return [gx + t * (x1 - gx) - 0.5, gy + t * (y1 - gy) - 0.5];
  };

  const next = new Map<number, number>();
  for (let gy = 0; gy < gh - 1; gy++)
    for (let gx = 0; gx < gw - 1; gx++) {
      const v = CORNER.map(([dx, dy]) => at(gx + dx, gy + dy));
      const mask = (v[0] > 0 ? 1 : 0) | (v[1] > 0 ? 2 : 0) | (v[2] > 0 ? 4 : 0) | (v[3] > 0 ? 8 : 0);
      if (mask === 0 || mask === 15) continue;
      const center = (v[0] + v[1] + v[2] + v[3]) / 4 > 0 ? 1 : 0;
      for (const [from, to] of SEGMENTS[center][mask]) next.set(edgeId(gx, gy, from), edgeId(gx, gy, to));
    }

  const rings: Ring[] = [];
  for (const start of next.keys()) {
    if (!next.has(start)) continue;
    const pts: number[] = [];
    let id = start;
    do {
      const [x, y] = point(id);
      pts.push(x, y);
      const to = next.get(id)!;
      next.delete(id);
      id = to;
    } while (id !== start && next.has(id));
    const ring = Float64Array.from(pts);
    if (Math.abs(signedArea(ring)) >= minArea) rings.push(ring);
  }
  return rings;
}

// Rings sorted into shapes: each outline with the holes directly inside it.
export function shapes(rings: Ring[]): Ring[][] {
  const box = rings.map((r) => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < r.length; i += 2) {
      x0 = Math.min(x0, r[i]);
      x1 = Math.max(x1, r[i]);
      y0 = Math.min(y0, r[i + 1]);
      y1 = Math.max(y1, r[i + 1]);
    }
    return [x0, y0, x1, y1];
  });
  const area = rings.map(signedArea);
  const out = rings.map((r, i) => (area[i] > 0 ? [r] : []));
  rings.forEach((hole, i) => {
    if (area[i] > 0) return;
    const [x, y] = [hole[0], hole[1]];
    let best = -1;
    rings.forEach((r, j) => {
      const [x0, y0, x1, y1] = box[j];
      if (area[j] <= 0 || x < x0 || x > x1 || y < y0 || y > y1 || (best >= 0 && area[j] >= area[best])) return;
      if (contains(r, x, y)) best = j;
    });
    if (best >= 0) out[best].push(hole);
  });
  return out.filter((s) => s.length);
}

export function contains(ring: Ring, x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const [xi, yi, xj, yj] = [ring[i], ring[i + 1], ring[j], ring[j + 1]];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

// Calls `visit` with every pixel whose center lies inside the shape, under the even-odd rule.
export function rasterize(shape: Ring[], width: number, height: number, visit: (p: number) => void) {
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const r of shape)
    for (let i = 1; i < r.length; i += 2) {
      y0 = Math.min(y0, r[i]);
      y1 = Math.max(y1, r[i]);
    }
  const xs: number[] = [];
  for (let y = Math.max(0, Math.ceil(y0 - 0.5)); y <= Math.min(height - 1, Math.floor(y1 - 0.5)); y++) {
    const cy = y + 0.5;
    xs.length = 0;
    for (const r of shape)
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2)
        if (r[i + 1] > cy !== r[j + 1] > cy) xs.push(r[i] + ((cy - r[i + 1]) * (r[j] - r[i])) / (r[j + 1] - r[i + 1]));
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(width - 1, Math.floor(xs[k + 1] - 0.5)); x++) visit(y * width + x);
  }
}

// Positive for rings that keep their inside on the right on screen: outlines. Holes are negative.
export function signedArea(ring: Ring): number {
  let s = 0;
  const n = ring.length;
  for (let i = 0; i < n; i += 2) {
    const j = (i + 2) % n;
    s += ring[i] * ring[j + 1] - ring[j] * ring[i + 1];
  }
  return s / 2;
}
