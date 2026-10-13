// The jacket's hardware and its woven patch, drawn as models: where each lies is read by eye off
// gridded crops of the plate and the colored original (see scene.ts); how it is drawn is code. A
// zip is a band of paper along its line, edged in ink and crossed by its teeth, with a pull; the
// patch is a basket weave, as the colored original shows it, cut in paper out of an ink ground.

import type { Point } from "../../../harness/trace/polygon.ts";
import { pathOf } from "../../../harness/trace/polygon.ts";

export type Zip = {
  line: Point[];
  pull?: { at: Point; angle: number; length: number; width: number };
  stop?: { at: Point; width: number; height: number };
};

const BAND = 3.8; // metallic tooth spine width inside the dark leather welt channel
const WELT = 4.4; // offset of the parallel paper welt rims from the zipper centerline
const PITCH = 2.2; // tooth pitch along the spine

const f = (v: number) => (Math.round(v * 10) / 10).toString();
const polyline = (pts: Point[]) => "M" + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L");

// Points every `step` pixels along a polyline, each with its unit direction.
function walk(line: Point[], step: number): { at: Point; dir: Point }[] {
  const out: { at: Point; dir: Point }[] = [];
  let carry = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, ay] = line[i];
    const [bx, by] = line[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    const dir: Point = [(bx - ax) / len, (by - ay) / len];
    for (let s = carry; s < len; s += step) out.push({ at: [ax + dir[0] * s, ay + dir[1] * s], dir });
    carry = (carry - len) % step;
    if (carry < 0) carry += step;
  }
  return out;
}

// A polyline moved sideways by `by`, to the hand of n = (-dy, dx).
function offset(line: Point[], by: number): Point[] {
  return line.map(([x, y], i) => {
    const [ax, ay] = line[Math.max(0, i - 1)];
    const [bx, bY] = line[Math.min(line.length - 1, i + 1)];
    const len = Math.hypot(bx - ax, bY - ay) || 1;
    return [x - ((bY - ay) / len) * by, y + ((bx - ax) / len) * by];
  });
}

export function zipMarkup(zips: Zip[], ink: string, paper: string): string {
  const out: string[] = [];
  for (const { line, pull, stop } of zips) {
    // 1. Recessed dark ink welt channel flanked by fine parallel paper welt lines.
    out.push(`<path fill="none" stroke="${ink}" stroke-width="${f(WELT * 2 + 2.4)}" stroke-linecap="butt" stroke-linejoin="round" d="${polyline(line)}"/>`);
    out.push(
      `<path fill="none" stroke="${paper}" stroke-width="0.95" stroke-linecap="round" stroke-linejoin="round" d="${polyline(offset(line, -WELT))}${polyline(offset(line, WELT))}"/>`,
    );
    // 2. Central metallic tooth track: bright paper spine split by a central hairline and crossed by interlocking teeth.
    out.push(`<path fill="none" stroke="${paper}" stroke-width="${BAND}" stroke-linecap="butt" stroke-linejoin="round" d="${polyline(line)}"/>`);
    let teeth = "";
    walk(line, PITCH).forEach(({ at: [x, y], dir: [dx, dy] }, i) => {
      const [nx, ny] = [-dy, dx];
      const side = i % 2 ? 1 : -1;
      const [a, b] = [side * (BAND / 2 + 0.3), -side * 0.35];
      teeth += `M${f(x + nx * a)} ${f(y + ny * a)}L${f(x + nx * b)} ${f(y + ny * b)}`;
    });
    out.push(`<path fill="none" stroke="${ink}" stroke-width="0.85" d="${teeth}"/>`);
    out.push(`<path fill="none" stroke="${ink}" stroke-width="0.65" d="${polyline(line)}"/>`);

    if (stop) {
      const { at: [sx, sy], width: sw, height: sh } = stop;
      out.push(
        `<rect x="${f(sx - sw / 2)}" y="${f(sy - sh / 2)}" width="${f(sw)}" height="${f(sh)}" rx="1.4" fill="${paper}" stroke="${ink}" stroke-width="1.3"/>` +
          `<line x1="${f(sx - sw / 2 + 2)}" y1="${f(sy - sh / 2 + 3)}" x2="${f(sx - sw / 2 + 2)}" y2="${f(sy + sh / 2 - 3)}" stroke="${ink}" stroke-width="0.8"/>`,
      );
    }

    if (pull) {
      // Sculpted slider body (crown + central bail bridge) and tapered hanging pull tab with slot.
      const { at: [x, y], angle, length: L, width: w } = pull;
      const cw = w * 0.92;
      const ch = L * 0.28;
      const tw0 = w * 0.68;
      const tw1 = w * 0.94;
      const ty0 = L * 0.22;
      const tabPath =
        `M${f(-tw0 / 2)} ${f(ty0)}` +
        `L${f(tw0 / 2)} ${f(ty0)}` +
        `L${f(tw1 / 2)} ${f(L - tw1 * 0.32)}` +
        `Q${f(tw1 / 2)} ${f(L)} 0 ${f(L)}` +
        `Q${f(-tw1 / 2)} ${f(L)} ${f(-tw1 / 2)} ${f(L - tw1 * 0.32)}Z`;
      out.push(
        `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})">` +
          // Dark ink halo separating slider and pull tab from track and waves
          `<rect x="${f(-cw / 2 - 1.2)}" y="-2.2" width="${f(cw + 2.4)}" height="${f(ch + 2.4)}" rx="2.4" fill="${ink}"/>` +
          `<path fill="${ink}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round" d="${tabPath}"/>` +
          // Slider crown
          `<rect x="${f(-cw / 2)}" y="-1" width="${f(cw)}" height="${f(ch)}" rx="1.8" fill="${paper}" stroke="${ink}" stroke-width="1.15"/>` +
          `<rect x="${f(-cw * 0.28)}" y="${f(ch * 0.16)}" width="${f(cw * 0.56)}" height="${f(ch * 0.64)}" rx="0.9" fill="${ink}"/>` +
          `<rect x="-1.2" y="-0.5" width="2.4" height="${f(ch * 0.92)}" rx="0.8" fill="${paper}" stroke="${ink}" stroke-width="0.6"/>` +
          // Tapered pull tab
          `<path fill="${paper}" stroke="${ink}" stroke-width="1.15" stroke-linejoin="round" d="${tabPath}"/>` +
          `<rect x="-1.3" y="${f(L * 0.55)}" width="2.6" height="${f(L * 0.27)}" rx="1.2" fill="${ink}"/>` +
          `</g>`,
      );
    }
  }
  return `<g id="zips">${out.join("")}</g>`;
}

// The woven patch on his shoulder: a diamond basket-weave lattice on an ink leather ground,
// bordered along its lower edge by a curved double-welt seam.
export function weaveMarkup(outline: Point[], seam: Point[], ink: string, paper: string, { cell = 14.5, angle = 20 } = {}): string {
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  const [cx, cy] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const reach = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + cell;
  const t = (angle * Math.PI) / 180;
  const [ux, uy, vx, vy] = [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t)];
  const r = cell * 0.31;
  const open = 0.26;
  let marks = "";
  let accents = "";
  const n = Math.ceil(reach / cell);
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) {
      const [a, b] = [(i + (Math.abs(j) % 2) / 2) * cell, j * cell * 0.62];
      const at = (da: number, db: number): string => `${f(cx + (a + da) * ux + (b + db) * vx)} ${f(cy + (a + da) * uy + (b + db) * vy)}`;
      for (const s of [-1, 1]) marks += `M${at(s * r * open, -r * (1 - open))}L${at(s * r, 0)}L${at(s * r * open, r * (1 - open))}`;
      accents += `M${at(-r * 0.22, 0)}L${at(r * 0.22, 0)}`;
    }
  const seamClear = polyline(seam);
  const seamInner = polyline(offset(seam, -1.6));
  const seamOuter = polyline(offset(seam, 1.6));
  return (
    `<clipPath id="patch"><path d="${pathOf(outline)}"/></clipPath>` +
    `<path fill="${ink}" d="${pathOf(outline)}"/>` +
    `<path clip-path="url(#patch)" fill="none" stroke="${paper}" stroke-width="1.15" stroke-opacity="0.9" stroke-linecap="round" stroke-linejoin="round" d="${marks}"/>` +
    `<path clip-path="url(#patch)" fill="none" stroke="${paper}" stroke-width="0.8" stroke-opacity="0.55" stroke-linecap="round" d="${accents}"/>` +
    `<path fill="none" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round" d="${pathOf(outline)}"/>` +
    `<path fill="none" stroke="${ink}" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round" d="${seamClear}"/>` +
    `<path fill="none" stroke="${paper}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" d="${seamInner}${seamOuter}"/>`
  );
}

// Studs, 3/4-perspective snaps, and small eyelets.
export type Stud = { at: Point; size: [number, number]; angle: number; kind?: "dome" | "snap" | "eyelet" };
export function studMarkup(studs: Stud[], ink: string, paper: string): string {
  return (
    `<g id="studs">` +
    studs
      .map(({ at: [x, y], size: [w, h], angle, kind = "dome" }) => {
        const [rx, ry] = [w / 2, h / 2];
        if (kind === "eyelet") {
          return (
            `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})">` +
            `<ellipse rx="${f(rx + 1.4)}" ry="${f(ry + 1.4)}" fill="${ink}"/>` +
            `<ellipse rx="${f(rx)}" ry="${f(ry)}" fill="${paper}"/>` +
            `<ellipse rx="${f(rx * 0.48)}" ry="${f(ry * 0.52)}" fill="${ink}"/>` +
            `</g>`
          );
        }
        if (kind === "snap") {
          // 3/4-view domed snap stud on the vertical chest strap: dark base ring on the left, bright convex cap on the right.
          return (
            `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})">` +
            `<ellipse rx="${f(rx + 1.5)}" ry="${f(ry + 1.5)}" fill="${ink}"/>` +
            `<ellipse cx="-0.8" cy="0" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${paper}" stroke-width="1.1"/>` +
            `<ellipse cx="0.9" cy="0" rx="${f(rx * 0.78)}" ry="${f(ry * 0.86)}" fill="${paper}" stroke="${ink}" stroke-width="0.9"/>` +
            `<path fill="${ink}" d="M${f(0.9 - rx * 0.65)} ${f(ry * 0.2)}A${f(rx * 0.65)} ${f(ry * 0.65)} 0 0 0 ${f(0.9 + rx * 0.65)} ${f(ry * 0.2)}A${f(rx * 0.78)} ${f(ry * 0.86)} 0 0 1 ${f(0.9 - rx * 0.65)} ${f(ry * 0.2)}Z" fill-opacity="0.55"/>` +
            `</g>`
          );
        }
        return (
          `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})">` +
          `<ellipse rx="${f(rx + 1.4)}" ry="${f(ry + 1.4)}" fill="${ink}"/>` +
          `<ellipse rx="${f(rx)}" ry="${f(ry)}" fill="${paper}"/>` +
          `<ellipse rx="${f(rx * 0.78)}" ry="${f(ry * 0.78)}" fill="none" stroke="${ink}" stroke-width="0.65" stroke-opacity="0.45"/>` +
          `<path fill="${ink}" d="M${f(-rx * 0.82)} ${f(ry * 0.12)}A${f(rx * 0.82)} ${f(ry * 0.75)} 0 0 0 ${f(rx * 0.82)} ${f(ry * 0.12)}A${f(rx)} ${f(ry)} 0 0 1 ${f(-rx * 0.82)} ${f(ry * 0.12)}Z" fill-opacity="0.72"/>` +
          `</g>`
        );
      })
      .join("") +
    `</g>`
  );
}

// The adjuster tabs at his waist: each a strap of leather, a roller buckle seen edge on, and an eyelet.
export type Tab = { buckle: Point[]; eyelet: { at: Point; size: [number, number] } };
export function tabMarkup(tabs: Tab[], ink: string, paper: string): string {
  const out: string[] = [];
  const bar = (d: string, width: number) =>
    `<path fill="none" stroke="${ink}" stroke-width="${f(width + 2)}" stroke-linecap="round" d="${d}"/>` +
    `<path fill="none" stroke="${paper}" stroke-width="${f(width)}" stroke-linecap="round" d="${d}"/>`;
  for (const { buckle, eyelet } of tabs) {
    const [[ax, ay], [bx, by]] = buckle;
    const len = Math.hypot(bx - ax, by - ay);
    const [nx, ny] = [-(by - ay) / len, (bx - ax) / len];
    const across = [0, 0.5, 1]
      .map((t) => [ax + (bx - ax) * t, ay + (by - ay) * t])
      .map(([x, y]) => `M${f(x - nx * 4.5)} ${f(y - ny * 4.5)}L${f(x + nx * 4.5)} ${f(y + ny * 4.5)}`)
      .join("");
    const tip = buckle[2] ? `<path fill="${paper}" stroke="${ink}" stroke-width="1" stroke-linejoin="round" d="M${f(bx - nx * 1.6)} ${f(by - ny * 1.6)}L${f(buckle[2][0])} ${f(buckle[2][1])}L${f(bx + nx * 1.6)} ${f(by + ny * 1.6)}Z"/>` : "";
    out.push(tip + bar(`M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}`, 2.8) + bar(across, 1.8));
    const { at: [ex, ey], size: [ew, eh] } = eyelet;
    out.push(`<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="${f(ew / 2 - 1)}" ry="${f(eh / 2 - 1)}" fill="${ink}" stroke="${ink}" stroke-width="4"/>`);
    out.push(`<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="${f(ew / 2 - 1)}" ry="${f(eh / 2 - 1)}" fill="none" stroke="${paper}" stroke-width="1.8"/>`);
  }
  return `<g id="tabs">${out.join("")}</g>`;
}

// An edge of a piece of leather, as the plate engraves it: the waves stop short of it, a bright rim
// runs along the edge itself, and a row of stitches runs inside it on the piece's side (`side`:
// +1 or -1, the hand of n = (-dy, dx) the piece lies on; 0, no stitches).
export type Edge = { line: Point[]; side: -1 | 0 | 1 };

const CLEAR = 3.0; // half the band of ink cleared of waves, so rim and stitches stand apart
const RIM = 1.45;
const STITCH = 4.0; // how far inside the rim the stitches run

export function edgeMarkup(edges: Edge[], ink: string, paper: string): string {
  const round = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  // Stitched edges clear a band wide enough for rim and stitches; bare edges, only the rim's own.
  const clear = edges.filter((e) => e.side).map(({ line, side }) => polyline(offset(line, side * 1.5))).join("");
  const bare = edges.filter((e) => !e.side).map(({ line }) => polyline(line)).join("");
  const rims = edges.map(({ line }) => polyline(line)).join("");
  const stitches = edges.filter((e) => e.side).map(({ line, side }) => polyline(offset(line, side * STITCH))).join("");
  return (
    `<g id="edges">` +
    `<path ${round} stroke="${ink}" stroke-width="${2 * CLEAR + 2.8}" d="${clear}"/>` +
    `<path ${round} stroke="${ink}" stroke-width="${RIM + 2.2}" d="${bare}"/>` +
    `<path ${round} stroke="${paper}" stroke-width="${RIM}" d="${rims}"/>` +
    `<path fill="none" stroke="${paper}" stroke-width="1.25" stroke-linecap="round" stroke-dasharray="1.6 2.6" d="${stitches}"/>` +
    `</g>`
  );
}

// Subtle leather welt seams and the vertical chest strap: narrow ink grooves with a fine paper
// highlight that let the horizontal wavy engraving lines pass across the interior of the strap.
export type Welt = { line: Point[]; side?: -1 | 0 | 1; stitch?: boolean };
export function weltMarkup(welts: Welt[], ink: string, paper: string): string {
  const round = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  const grooves = welts.map(({ line }) => polyline(line)).join("");
  const rims = welts
    .filter((w) => w.side !== 0)
    .map(({ line, side = 1 }) => polyline(offset(line, side * 0.9)))
    .join("");
  const stitched = welts
    .filter((w) => w.stitch)
    .map(({ line, side = 1 }) => polyline(offset(line, side * 3.2)))
    .join("");
  return (
    `<g id="welts">` +
    `<path ${round} stroke="${ink}" stroke-width="2.8" d="${grooves}"/>` +
    `<path ${round} stroke="${paper}" stroke-width="0.95" stroke-opacity="0.9" d="${rims}"/>` +
    (stitched ? `<path fill="none" stroke="${paper}" stroke-width="1.1" stroke-linecap="round" stroke-dasharray="1.4 2.4" d="${stitched}"/>` : "") +
    `</g>`
  );
}

// A shirt's cuff: a band of paper edged in fine ink, and the fold where it turns in, a finer line.
export type Cuff = { outline: Point[]; fold: Point[] };
export function cuffMarkup(cuffs: Cuff[], ink: string, paper: string): string {
  return (
    `<g id="cuffs">` +
    cuffs
      .map(
        ({ outline, fold }) =>
          `<path fill="${paper}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round" d="${pathOf(outline)}"/>` +
          `<path fill="none" stroke="${ink}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" d="${polyline(fold)}"/>`,
      )
      .join("") +
    `</g>`
  );
}

