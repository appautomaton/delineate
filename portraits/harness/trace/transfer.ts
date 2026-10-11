// Color transfer between two renderings of the same scene. Plates painted separately from the
// reference (a background with the subject removed, a layer painted on its own) agree with it in
// shape but drift in tone and saturation. Where both show the same thing, an affine map in RGB is
// fitted by least squares, the worst-fitting share is dropped as content that truly differs, and
// the fit is repeated; the map then carries the plate's hidden parts into the reference's colors.

import type { Raster } from "./image.ts";

export type Transfer = number[][]; // 3 rows of [r, g, b, 1] coefficients

export function fitTransfer(from: Raster, to: Raster, where: ArrayLike<number>, { keep = 0.8, stride = 3 } = {}): Transfer {
  let pixels: number[] = [];
  for (let p = 0; p < where.length; p += stride) if (where[p]) pixels.push(p);
  let map: Transfer = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
  ];
  for (let round = 0; round < 3 && pixels.length >= 20; round++) {
    map = solve(from, to, pixels);
    if (round === 2) break;
    const err = pixels.map((p) => residual(map, from, to, p));
    const cut = [...err].sort((a, b) => a - b)[Math.floor(err.length * keep)];
    pixels = pixels.filter((_, i) => err[i] <= cut);
  }
  return map;
}

export function apply(map: Transfer, img: Raster, p: number): [number, number, number] {
  const [r, g, b] = [img.data[p * 4], img.data[p * 4 + 1], img.data[p * 4 + 2]];
  return map.map((m) => Math.max(0, Math.min(255, Math.round(m[0] * r + m[1] * g + m[2] * b + m[3])))) as [number, number, number];
}

function residual(map: Transfer, from: Raster, to: Raster, p: number): number {
  const c = apply(map, from, p);
  return Math.hypot(c[0] - to.data[p * 4], c[1] - to.data[p * 4 + 1], c[2] - to.data[p * 4 + 2]);
}

// Normal equations for each output channel, with a light pull toward the identity.
function solve(from: Raster, to: Raster, pixels: number[]): Transfer {
  const A = Array.from({ length: 4 }, () => new Float64Array(4));
  const B = Array.from({ length: 3 }, () => new Float64Array(4));
  for (const p of pixels) {
    const x = [from.data[p * 4], from.data[p * 4 + 1], from.data[p * 4 + 2], 255];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) A[i][j] += x[i] * x[j];
      for (let c = 0; c < 3; c++) B[c][i] += x[i] * to.data[p * 4 + c];
    }
  }
  const ridge = pixels.length * 50;
  return [0, 1, 2].map((c) => {
    const M = A.map((row, i) => Float64Array.from(row, (v, j) => v + (i === j && i < 3 ? ridge : 0)));
    const v = Float64Array.from(B[c], (val, i) => val + (i === c ? ridge : 0));
    const x = gauss(M, v);
    return [x[0], x[1], x[2], x[3] * 255];
  });
}

function gauss(A: Float64Array[], b: Float64Array): number[] {
  const n = b.length;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    [b[c], b[p]] = [b[p], b[c]];
    for (let r = c + 1; r < n; r++) {
      const f = A[r][c] / A[c][c];
      for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k];
    x[r] = s / A[r][r];
  }
  return x;
}
