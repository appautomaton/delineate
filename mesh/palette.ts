// Perceptual OKLab color science and curated museum-grade palettes for Lumen.
// Every transition between stops, palettes, and Day/Night grounds travels through OKLab
// so opposing hues stay luminous without crossing muddy grey mid-tones.

import type { Light, OpticalPalette, PlateId, V3 } from "./types.ts";

const toLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const toGamma = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Converts "#rrggbb" or "#rgb" to sRGB channels in [0, 1]. */
export function hexToSrgb(hex: string): V3 {
  const clean = hex.startsWith("#") ? hex.slice(1) : hex;
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r / 255, g / 255, b / 255];
  }
  const n = parseInt(clean, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Converts sRGB [0..1] to Björn Ottosson's OKLab [L, a, b]. */
export function lab(rgb: V3): V3 {
  const r = toLinear(clamp01(rgb[0]));
  const g = toLinear(clamp01(rgb[1]));
  const b = toLinear(clamp01(rgb[2]));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Converts OKLab [L, a, b] back to clamped sRGB [0..1]. */
export function srgb(oklab: V3): V3 {
  const [L, A, B] = oklab;
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [
    clamp01(toGamma(Math.max(0, r))),
    clamp01(toGamma(Math.max(0, g))),
    clamp01(toGamma(Math.max(0, b))),
  ];
}

/** Interpolates two sRGB [0..1] colors smoothly in perceptual OKLab space. */
export function lerpOklab(a: V3, b: V3, t: number): V3 {
  const u = clamp01(t);
  if (u <= 0) return [a[0], a[1], a[2]];
  if (u >= 1) return [b[0], b[1], b[2]];
  const la = lab(a);
  const lb = lab(b);
  return srgb([
    la[0] + (lb[0] - la[0]) * u,
    la[1] + (lb[1] - la[1]) * u,
    la[2] + (lb[2] - la[2]) * u,
  ]);
}

/** Interpolates two 5-stop sRGB palettes stop-by-stop in OKLab. */
export function lerpPalette(
  a: [V3, V3, V3, V3, V3],
  b: [V3, V3, V3, V3, V3],
  t: number,
): [V3, V3, V3, V3, V3] {
  return [
    lerpOklab(a[0], b[0], t),
    lerpOklab(a[1], b[1], t),
    lerpOklab(a[2], b[2], t),
    lerpOklab(a[3], b[3], t),
    lerpOklab(a[4], b[4], t),
  ];
}

/** Formats an sRGB [0..1] triple as a CSS rgb() string. */
export function css(rgb: V3): string {
  return `rgb(${Math.round(clamp01(rgb[0]) * 255)} ${Math.round(clamp01(rgb[1]) * 255)} ${Math.round(clamp01(rgb[2]) * 255)})`;
}

const stops = (
  a: string,
  b: string,
  c: string,
  d: string,
  e: string,
): [V3, V3, V3, V3, V3] => [
  hexToSrgb(a),
  hexToSrgb(b),
  hexToSrgb(c),
  hexToSrgb(d),
  hexToSrgb(e),
];

export const STAGE_TONES: Record<
  Light,
  { bg: string; ink: string; ground: V3; plumeMatte: V3; lanternBg: V3 }
> = {
  day: {
    bg: "#fcfcfb",
    ink: "#161614",
    ground: hexToSrgb("#fcfcfb"),
    plumeMatte: hexToSrgb("#eeeff5"),
    lanternBg: hexToSrgb("#f3f1ea"),
  },
  night: {
    bg: "#070913",
    ink: "#e4e2dc",
    ground: hexToSrgb("#070913"),
    plumeMatte: hexToSrgb("#090b14"),
    lanternBg: hexToSrgb("#070a10"),
  },
};

export const PALETTES: Record<PlateId, readonly OpticalPalette[]> = {
  // Plate I: [deepLeftRim, upperCrownTint, rightBevelBand, innerLensMist, specularGleam]
  veil: [
    {
      id: "periwinkle",
      name: "Periwinkle",
      swatch: "#5472ff",
      day: stops("#5472FF", "#F2BFFF", "#8E9BFF", "#E7E6FB", "#FFFFFF"),
      night: stops("#5C7DFF", "#F2B8FF", "#96A8FF", "#4E5BB5", "#FFFFFF"),
    },
    {
      id: "celadon",
      name: "Celadon",
      swatch: "#2e8f84",
      day: stops("#2E8F84", "#D8F6EA", "#72BFB5", "#EAF6F2", "#FFFFFF"),
      night: stops("#3CCCB8", "#B4FCEB", "#62B8BC", "#2B626A", "#F0FFFA"),
    },
    {
      id: "sienna",
      name: "Sienna",
      swatch: "#d86450",
      day: stops("#D86450", "#FFD4C4", "#EA928A", "#FBF0EC", "#FFFFFF"),
      night: stops("#F27862", "#FFD6BA", "#E8869C", "#6E3F4A", "#FFF6F0"),
    },
  ],

  // Plate II: [washPrimary, washSecondary, bloomWarm, emissionAmber, emissionTeal]
  plume: [
    {
      id: "thermal",
      name: "Thermal",
      swatch: "#f4858c",
      day: stops("#F4858C", "#A4DCF6", "#FCE0A4", "#EAA838", "#2EA8C2"),
      night: stops("#F47484", "#6ACBE8", "#F8C87A", "#F4B844", "#38CED2"),
    },
    {
      id: "mineral",
      name: "Mineral",
      swatch: "#5da6b8",
      day: stops("#5DA6B8", "#B6DBC4", "#EED0AC", "#E08046", "#3AA692"),
      night: stops("#5EB8CA", "#84DBB8", "#EAC08E", "#F09454", "#40C8AE"),
    },
    {
      id: "orchid",
      name: "Orchid",
      swatch: "#ec7cb8",
      day: stops("#EC7CB8", "#B2E4FE", "#FACCAA", "#E2BC2E", "#8462EE"),
      night: stops("#F272B8", "#7CD0FE", "#F8BA8C", "#F0CE40", "#9874FF"),
    },
  ],

  // Plate III: [skyLight, skyDeep, filmCyan, filmCobalt, filmMagenta]
  prism: [
    {
      id: "dichroic",
      name: "Dichroic",
      swatch: "#1638ff",
      day: stops("#E2E6FF", "#5286E4", "#22F6FF", "#1638FF", "#F21EFF"),
      night: stops("#16285A", "#060B1E", "#28F8FF", "#2050FF", "#F62CFF"),
    },
    {
      id: "opal",
      name: "Opal",
      swatch: "#32d4c2",
      day: stops("#ECF3F0", "#7CA8B6", "#38F8CE", "#1E7BA8", "#F468A4"),
      night: stops("#122E35", "#061015", "#48FCE0", "#2EA2CC", "#FA78B4"),
    },
    {
      id: "helios",
      name: "Helios",
      swatch: "#e08e3e",
      day: stops("#F6EFE3", "#9884B8", "#FFD052", "#5A4AF6", "#F84C72"),
      night: stops("#261B3A", "#0A0714", "#FFD864", "#6E5EFF", "#FF5E84"),
    },
  ],

  // Plate IV: OKLab harmonic grade anchors across all 6 distinct vessels
  // [warmBias, coolBias, chromaControl(R=sat,G=lumBoost,B=hueShift), rimTint, ambientGlow]
  lantern: [
    {
      id: "spectrum",
      name: "Spectrum",
      swatch: "#f2605f",
      day: stops("#F2605F", "#2AC0F8", "#FFFFFF", "#DCE2FF", "#FFF6EE"),
      night: stops("#F2605F", "#2AC0F8", "#FFFFFF", "#D8E0FF", "#161E2E"),
    },
    {
      id: "mineral",
      name: "Mineral",
      swatch: "#52a89c",
      day: stops("#D88276", "#58A8B2", "#C4D0CC", "#E6EEE8", "#F5F2EA"),
      night: stops("#D98276", "#5CB2BA", "#C2D2CC", "#D2EAE2", "#111F22"),
    },
    {
      id: "nocturne",
      name: "Nocturne",
      swatch: "#8066f0",
      day: stops("#C9507A", "#4C74F2", "#B8B4E8", "#D0C6FF", "#ECEAF8"),
      night: stops("#D44E82", "#4E78FF", "#B4AEF2", "#C8BEFF", "#120F28"),
    },
  ],
};
