// A sphere of alternating panels that meet at a pole (a paper balloon, a beach ball), seen in
// orthographic projection, with light on it and a knot of gathered paper at the pole. The panels'
// count, width, and turn, and the two papers' colors, are fitted to the picture; the shape is exact
// geometry, so the sphere can also turn on its axis.

import { fitRing, pathData } from "../trace/bezier.ts";
import { hex, labToRgb, rgbToLab } from "../trace/color.ts";
import type { Raster } from "../trace/image.ts";

type V3 = [number, number, number];
export type Sphere = {
  center: [number, number];
  radius: number;
  pole: V3; // unit vector to the visible pole; z points at the viewer
  panels: number; // colored panels, each followed by a paper one
  width: number; // share of each panel pair taken by the colored panel
  turn: number; // longitude of the first colored panel, radians
  ink: string; // the colored paper
  paper: string;
  knot: string; // the gathered paper at the pole
  blur: number; // how soft its outline is in the picture, in pixels
};

// From a guess at the sphere's circle and at the point where its panels meet. The outline comes
// first (see outline). Then every pixel of the disc, clear of its rim and of the knot, is read back
// onto the sphere and classed by its paper: two means over the papers' colors in OKLab's a and b,
// which the light across the sphere changes little, leaving out the pixels between the two and the
// darkest (lines, deep shade). For each pole within `search` pixels of the guess, the panels' count,
// width, and turn are scored by how well they put every pixel on its own paper, summed over
// longitude so that each arc costs one subtraction. The papers take their classes' median colors,
// and the knot the color at the pole.
export function fitSphere(paint: Raster, guess: [number, number], size: number, pole: [number, number], { search = 10 } = {}): Sphere {
  const { width: w, data } = paint;
  const { center, radius, blur } = outline(paint, guess, size);
  const [cx, cy] = center;
  type Sample = { P: V3; rgb: number[]; ab: [number, number] };
  const disc: Sample[] = [];
  for (let y = Math.floor(cy - radius); y <= cy + radius; y++)
    for (let x = Math.floor(cx - radius); x <= cx + radius; x++) {
      const dx = (x + 0.5 - cx) / radius;
      const dy = (y + 0.5 - cy) / radius;
      const r2 = dx * dx + dy * dy;
      if (r2 > 0.88 || Math.hypot(x + 0.5 - pole[0], y + 0.5 - pole[1]) < 0.12 * radius) continue;
      const i = (y * w + x) * 4;
      const rgb = [data[i], data[i + 1], data[i + 2]];
      const [L, A, B] = rgbToLab(rgb[0], rgb[1], rgb[2]);
      if (L > 0.3) disc.push({ P: [dx, dy, Math.sqrt(1 - r2)], rgb, ab: [A, B] });
    }

  // The two papers' colors, from the most and the least colorful pixel; the colored paper is the ink.
  const chroma = ({ ab }: Sample) => Math.hypot(...ab);
  let ink = disc.reduce((m, s) => (chroma(s) > chroma(m) ? s : m)).ab;
  let paper = disc.reduce((m, s) => (chroma(s) < chroma(m) ? s : m)).ab;
  const along = ({ ab }: Sample) => ((ab[0] - paper[0]) * (ink[0] - paper[0]) + (ab[1] - paper[1]) * (ink[1] - paper[1])) / ((ink[0] - paper[0]) ** 2 + (ink[1] - paper[1]) ** 2);
  for (let round = 0; round < 10; round++) {
    const mean = (list: Sample[]): [number, number] => [0, 1].map((k) => list.reduce((t, s) => t + s.ab[k], 0) / list.length) as [number, number];
    [ink, paper] = [mean(disc.filter((s) => along(s) >= 0.5)), mean(disc.filter((s) => along(s) < 0.5))];
  }
  const samples = disc.flatMap((s) => {
    const t = along(s);
    return t > 0.6 ? [{ ...s, inked: true }] : t < 0.4 ? [{ ...s, inked: false }] : [];
  });

  const BINS = 720; // longitudes around the axis
  let best = { score: -Infinity, axis: [0, 0, 1] as V3, panels: 6, width: 0.5, turn: 0 };
  for (let oy = -search; oy <= search; oy++)
    for (let ox = -search; ox <= search; ox++) {
      const ax = (pole[0] + ox - cx) / radius;
      const ay = (pole[1] + oy - cy) / radius;
      const axis = normalize([ax, ay, Math.sqrt(Math.max(0.05, 1 - ax * ax - ay * ay))]);
      const [u, v] = frame(axis);
      // Ink minus paper, per longitude, summed so any arc's balance is one subtraction.
      const tally = new Float64Array(BINS);
      for (const { P, inked } of samples) {
        const phi = Math.atan2(dot(P, v), dot(P, u));
        tally[Math.floor(((phi / (2 * Math.PI) + 1) % 1) * BINS) % BINS] += inked ? 1 : -1;
      }
      const sum = new Float64Array(2 * BINS + 1);
      for (let k = 0; k < 2 * BINS; k++) sum[k + 1] = sum[k] + tally[k % BINS];
      for (let panels = 3; panels <= 9; panels++) {
        const period = BINS / panels;
        for (let width = 0.3; width <= 0.701; width += 0.02)
          for (let t = 0; t < period; t++) {
            let score = 0;
            for (let k = 0; k < panels; k++) {
              const a = Math.round(t + k * period);
              score += sum[a + Math.round(width * period)] - sum[a];
            }
            // Arcs not inked count against: each panel pair is ink, then paper.
            score = 2 * score - (sum[BINS] - sum[0]);
            if (score > best.score) best = { score, axis, panels, width, turn: (t / BINS) * 2 * Math.PI };
          }
      }
    }

  const [u, v] = frame(best.axis);
  const period = (2 * Math.PI) / best.panels;
  const papers: number[][][] = [[], []];
  for (const { P, rgb } of samples) {
    const f = ((((Math.atan2(dot(P, v), dot(P, u)) - best.turn) / period) % 1) + 1) % 1;
    papers[f < best.width ? 0 : 1].push(rgb);
  }
  const median = (list: number[][]) => hex([0, 1, 2].map((k) => list.map((c) => c[k]).sort((a, b) => a - b)[list.length >> 1]));
  const kx = Math.round(cx + radius * best.axis[0]);
  const ky = Math.round(cy + radius * best.axis[1]);
  const knot = hex([0, 1, 2].map((k) => data[(ky * w + kx) * 4 + k]));
  return { center, radius, pole: best.axis, panels: best.panels, width: best.width, turn: best.turn, ink: median(papers[0]), paper: median(papers[1]), knot, blur };
}

// The outline's true center, radius, and softness: along every ray from the center, the picture
// should fade from the sphere to what is behind it as a Gaussian edge of that width at that radius.
export function outline(paint: Raster, guess: [number, number], size: number): { center: [number, number]; radius: number; blur: number } {
  const { width: w, height: h, data } = paint;
  // Bilinear, so that sub-pixel positions read sub-pixel colors.
  const at = (x: number, y: number) => {
    const fx = Math.min(w - 1.001, Math.max(0, x - 0.5));
    const fy = Math.min(h - 1.001, Math.max(0, y - 0.5));
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    return [0, 1, 2].map((c) => {
      const p = (yy: number, xx: number) => data[(yy * w + xx) * 4 + c];
      return (p(y0, x0) * (1 - tx) + p(y0, x0 + 1) * tx) * (1 - ty) + (p(y0 + 1, x0) * (1 - tx) + p(y0 + 1, x0 + 1) * tx) * ty;
    });
  };
  const fit = (cx: number, cy: number) => {
    const rays: { r: number; a: number; weight: number }[] = [];
    for (let k = 0; k < 120; k++) {
      const t = (k / 120) * 2 * Math.PI;
      const [dx, dy] = [Math.cos(t), Math.sin(t)];
      // Close to the rim, so the panel read inside is the one that meets the edge.
      const inner = at(cx + dx * (size - 3), cy + dy * (size - 3));
      const outer = at(cx + dx * (size + 6), cy + dy * (size + 6));
      const span = inner.map((v, c) => v - outer[c]);
      const weight = span.reduce((s, v) => s + v * v, 0);
      if (weight < 1600) continue;
      for (let r = size - 2.5; r <= size + 4; r += 0.25) {
        const here = at(cx + dx * r, cy + dy * r);
        rays.push({ r, a: span.reduce((s, v, c) => s + v * (here[c] - outer[c]), 0) / weight, weight });
      }
    }
    let best = { radius: size, blur: 0.5, err: Infinity };
    for (let radius = size - 3; radius <= size + 3; radius += 0.1)
      for (let blur = 0.2; blur <= 3; blur += 0.1) {
        let err = 0;
        for (const { r, a, weight } of rays) err += weight * (Math.max(0, Math.min(1, a)) - phi((radius - r) / blur)) ** 2;
        if (err < best.err) best = { radius, blur, err };
      }
    return best;
  };
  let best = { center: guess, ...fit(...guess) };
  for (let dy = -2; dy <= 2; dy += 0.5)
    for (let dx = -2; dx <= 2; dx += 0.5) {
      const c: [number, number] = [guess[0] + dx, guess[1] + dy];
      const f = fit(...c);
      if (f.err < best.err) best = { center: c, ...f };
    }
  return { center: best.center, radius: best.radius, blur: best.blur };
}

const phi = (t: number) => 0.5 * (1 + erf(t / Math.SQRT2));
function erf(x: number): number {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  return s * (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a));
}

// The sphere as SVG: the paper disc, the colored panels, the light, and the knot.
export function sphereMarkup(b: Sphere, id: string): { defs: string; body: string } {
  const { center: C, radius: R, pole: n } = b;
  const [u, v] = frame(n);
  const project = (P: V3): [number, number] => [C[0] + R * P[0], C[1] + R * P[1]];
  const at = (theta: number, phi: number): V3 => add(scale(n, Math.cos(theta)), scale(add(scale(u, Math.cos(phi)), scale(v, Math.sin(phi))), Math.sin(theta)));
  // Where a meridian passes from the near side of the sphere to the far side.
  const rim = (phi: number) => {
    const wz = Math.cos(phi) * u[2] + Math.sin(phi) * v[2];
    return Math.atan2(n[2], -wz);
  };
  const STEPS = 24;
  const panels: string[] = [];
  for (let k = 0; k < b.panels; k++) {
    const a = b.turn + (k * 2 * Math.PI) / b.panels;
    const c = a + (b.width * 2 * Math.PI) / b.panels;
    const pts: [number, number][] = [];
    for (let i = 0; i <= STEPS; i++) pts.push(project(at((rim(a) * i) / STEPS, a)));
    for (let i = 1; i < STEPS; i++) {
      const phi = a + ((c - a) * i) / STEPS;
      pts.push(project(at(rim(phi), phi)));
    }
    for (let i = STEPS; i >= 0; i--) pts.push(project(at((rim(c) * i) / STEPS, c)));
    panels.push(pathData([fitRing(Float64Array.from(pts.flat()), { tolerance: 0.2, step: 0.75, corner: 25 })]));
  }
  const r = (x: number) => Math.round(x * 10) / 10;
  const [kx, ky] = project(n);
  // The shade toward the rim: the ink at under half its lightness and its chroma.
  const [L, A, B] = rgbToLab(...([1, 3, 5].map((i) => parseInt(b.ink.slice(i, i + 2), 16)) as [number, number, number]));
  const shade = hex(labToRgb([0.45 * L, 0.4 * A, 0.4 * B]).map((c) => Math.max(0, Math.min(255, Math.round(c)))));
  const defs = [
    `<radialGradient id="${id}-light" gradientUnits="userSpaceOnUse" cx="${r(C[0] - 0.3 * R)}" cy="${r(C[1] - 0.35 * R)}" r="${r(1.45 * R)}"><stop offset=".45" stop-color="#fff" stop-opacity=".12"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="${shade}" stop-opacity=".28"/></radialGradient>`,
    b.blur > 0.6 ? `<filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${r(b.blur)}"/></filter>` : "",
    `<radialGradient id="${id}-knot"><stop stop-color="${b.knot}"/><stop offset=".55" stop-color="${b.knot}" stop-opacity=".85"/><stop offset="1" stop-color="${b.knot}" stop-opacity="0"/></radialGradient>`,
  ].join("");
  const parts = [
    `<circle cx="${r(C[0])}" cy="${r(C[1])}" r="${r(R)}" fill="${b.paper}"/>`,
    `<path fill="${b.ink}" d="${panels.join("")}"/>`,
    `<circle cx="${r(C[0])}" cy="${r(C[1])}" r="${r(R)}" fill="url(#${id}-light)"/>`,
    `<circle cx="${r(kx)}" cy="${r(ky)}" r="${r(0.16 * R)}" fill="url(#${id}-knot)"/>`,
  ].join("");
  return { defs, body: b.blur > 0.6 ? `<g filter="url(#${id}-soft)">${parts}</g>` : parts };
}

function frame(n: V3): [V3, V3] {
  const helper: V3 = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const u = normalize(cross(n, helper));
  return [u, cross(n, u)];
}
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (a: V3): V3 => scale(a, 1 / Math.hypot(...a));
