// Plates: pictures painted to go with the reference, each holding part of the scene (a depth, the
// scene without its subject) over black or over transparency. Where a plate has paint, and, for
// one painted in a frame of its own (larger, shifted), an affine map from plate to picture, fitted
// once, and the plate resampled through it.
//
// A map is fitted in two steps: ORB features matched between plate and picture, and an affine map
// fitted to the matches by RANSAC; then, for a plate repainted so much that few features agree,
// refined by ECC (Evangelidis and Psarakis, 2008) over a box of the picture where the plate's scene
// shows clearly. Fit once, read the numbers, and store them in the scene.

import { opencv } from "./cv.ts";
import type { Raster } from "./image.ts";
import type { Box } from "./polygon.ts";

// 1 where a plate painted over black has paint: brighter than `ink` in any channel.
export function inked({ data }: Raster, ink = 14): Uint8Array {
  return Uint8Array.from({ length: data.length / 4 }, (_, p) => (Math.max(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]) > ink ? 1 : 0));
}

// 1 where a plate painted over transparency has paint: at least half opaque.
export function opaque({ data }: Raster): Uint8Array {
  return Uint8Array.from({ length: data.length / 4 }, (_, p) => (data[p * 4 + 3] >= 128 ? 1 : 0));
}

// Plate pixel (x, y) lands on picture pixel (a·x + b·y + c, d·x + e·y + f), pixel centers at whole
// numbers, as OpenCV counts them.
export type Affine = [number, number, number, number, number, number];

// The plate in a frame of `width` by `height`, resampled through the map, with a light blur first
// where the map shrinks it, so its fine paint does not alias. Outside the plate, nothing is
// painted: alpha 0.
export async function warp(plate: Raster, map: Affine, width: number, height: number): Promise<Raster> {
  const cv = await opencv();
  const src = cv.matFromArray(plate.height, plate.width, cv.CV_8UC4, plate.data);
  const scale = Math.sqrt(Math.abs(map[0] * map[4] - map[1] * map[3]));
  if (scale < 0.9) cv.GaussianBlur(src, src, new cv.Size(0, 0), 0.45 / scale);
  const dst = new cv.Mat();
  const M = cv.matFromArray(2, 3, cv.CV_64F, map);
  cv.warpAffine(src, dst, M, new cv.Size(width, height), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(0, 0, 0, 0));
  const data = Uint8Array.from(dst.data);
  for (const m of [src, dst, M]) m.delete();
  return { width, height, data };
}

// ORB features inside the plate's paint (its opaque pixels), matched to the picture with Lowe's
// ratio test, and the affine map from plate to picture fitted to the matches by RANSAC.
export async function fitFeatures(plate: Raster, picture: Raster): Promise<Affine> {
  const cv = await opencv();
  const [P, F] = [await gray(plate), await gray(picture)];
  const mask = new cv.Mat(plate.height, plate.width, cv.CV_8UC1);
  for (let p = 0; p < plate.width * plate.height; p++) mask.data[p] = plate.data[p * 4 + 3] > 200 ? 255 : 0;
  cv.erode(mask, mask, cv.Mat.ones(9, 9, cv.CV_8U));
  const orb = new cv.ORB(8000);
  const [k1, k2] = [new cv.KeyPointVector(), new cv.KeyPointVector()];
  const [d1, d2] = [new cv.Mat(), new cv.Mat()];
  orb.detectAndCompute(P, mask, k1, d1);
  orb.detectAndCompute(F, new cv.Mat(), k2, d2);
  const knn = new cv.DMatchVectorVector();
  new cv.BFMatcher(cv.NORM_HAMMING, false).knnMatch(d1, d2, knn, 2);
  const [from, to]: number[][] = [[], []];
  for (let i = 0; i < knn.size(); i++) {
    const m = knn.get(i);
    if (m.size() < 2 || m.get(0).distance >= 0.75 * m.get(1).distance) continue;
    const a = k1.get(m.get(0).queryIdx).pt;
    const b = k2.get(m.get(0).trainIdx).pt;
    from.push(a.x, a.y);
    to.push(b.x, b.y);
  }
  const inliers = new cv.Mat();
  const M = cv.estimateAffine2D(cv.matFromArray(from.length / 2, 1, cv.CV_32FC2, from), cv.matFromArray(to.length / 2, 1, cv.CV_32FC2, to), inliers, cv.RANSAC, 3);
  return Array.from(M.data64F as Float64Array) as Affine;
}

// The map refined by ECC over a box of the picture. ECC warps its input onto its template, so it
// runs from picture to plate, and the result is inverted back.
export async function refine(plate: Raster, picture: Raster, map: Affine, [x0, y0, x1, y1]: Box): Promise<Affine> {
  const cv = await opencv();
  const [P, F] = [await gray(plate, 1.2), await gray(picture, 1.2)];
  const inv = new cv.Mat();
  cv.invertAffineTransform(cv.matFromArray(2, 3, cv.CV_32F, map), inv);
  const mask = new cv.Mat(picture.height, picture.width, cv.CV_8UC1, new cv.Scalar(0));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) mask.data[y * picture.width + x] = 255;
  cv.findTransformECC(F, P, inv, cv.MOTION_AFFINE, new cv.TermCriteria(cv.TermCriteria_COUNT + cv.TermCriteria_EPS, 200, 1e-6), mask, 5);
  const out = new cv.Mat();
  cv.invertAffineTransform(inv, out);
  return Array.from(out.data32F as Float32Array) as Affine;
}

// Gray, as 8-bit, or blurred, as float.
async function gray(r: Raster, blur = 0): Promise<any> {
  const cv = await opencv();
  const m = cv.matFromArray(r.height, r.width, cv.CV_8UC4, r.data);
  const g = new cv.Mat();
  cv.cvtColor(m, g, cv.COLOR_RGBA2GRAY);
  m.delete();
  if (!blur) return g;
  const f = new cv.Mat();
  g.convertTo(f, cv.CV_32F);
  cv.GaussianBlur(f, f, new cv.Size(0, 0), blur);
  g.delete();
  return f;
}
