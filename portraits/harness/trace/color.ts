// Color for tracing: OKLab, where straight-line distance tracks how different two colors look.
// Quantizing and comparing there keeps a palette's steps even to the eye.

export type Lab = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

// sRGB bytes to linear light, by table.
const LINEAR = Float32Array.from({ length: 256 }, (_, i) => toLinear(i / 255));

export function rgbToLab(r: number, g: number, b: number): Lab {
  const R = LINEAR[r];
  const G = LINEAR[g];
  const B = LINEAR[b];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function labToRgb([L, a, b]: Lab): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return rgb.map((c) => Math.round(255 * toGamma(Math.min(1, Math.max(0, c))))) as [number, number, number];
}

export const hex = ([r, g, b]: readonly number[]) => "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");

// A whole RGBA raster as three OKLab planes.
export function labPlanes(data: Uint8Array, count: number): [Float32Array, Float32Array, Float32Array] {
  const L = new Float32Array(count);
  const A = new Float32Array(count);
  const B = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const [l, a, b] = rgbToLab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    L[i] = l;
    A[i] = a;
    B[i] = b;
  }
  return [L, A, B];
}
