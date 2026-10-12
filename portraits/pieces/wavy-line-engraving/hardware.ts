// The jacket's hardware and its woven patch, drawn as models: where each lies is read by eye off
// gridded crops of the plate and the colored original (see scene.ts); how it is drawn is code. A
// zip is a band of paper along its line, edged in ink and crossed by its teeth, with a pull; the
// patch is a basket weave, as the colored original shows it, cut in paper out of an ink ground.

import type { Point } from "../../harness/trace/polygon.ts";
import { pathOf } from "../../harness/trace/polygon.ts";

export type Zip = { line: Point[]; pull?: { at: Point; angle: number; length: number; width: number } };

const BAND = 6.2; // the band's width, teeth included: bright, as the plate draws it
const PITCH = 2.2; // one tooth every so many pixels, alternating sides
const TOOTH = 1.7; // how far a tooth reaches in from its edge

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

export function zipMarkup(zips: Zip[], ink: string, paper: string): string {
  const out: string[] = [];
  for (const { line, pull } of zips) {
    // Edged band: ink under, paper over, so the edges are ink.
    out.push(`<path fill="none" stroke="${ink}" stroke-width="${BAND + 1.4}" stroke-linecap="round" stroke-linejoin="round" d="${polyline(line)}"/>`);
    out.push(`<path fill="none" stroke="${paper}" stroke-width="${BAND}" stroke-linecap="round" stroke-linejoin="round" d="${polyline(line)}"/>`);
    // Teeth: fine cuts in from alternate edges, leaving the band's middle bright.
    let teeth = "";
    walk(line, PITCH).forEach(({ at: [x, y], dir: [dx, dy] }, i) => {
      const [nx, ny] = [-dy, dx];
      const side = i % 2 ? 1 : -1;
      const [a, b] = [side * (BAND / 2), side * (BAND / 2 - TOOTH)];
      teeth += `M${f(x + nx * a)} ${f(y + ny * a)}L${f(x + nx * b)} ${f(y + ny * b)}`;
    });
    out.push(`<path fill="none" stroke="${ink}" stroke-width="0.6" d="${teeth}"/>`);
    if (pull) {
      // The slider and its tab, one paper shape edged in ink, with the tab's slot.
      const { at: [x, y], angle, length, width: w } = pull;
      out.push(
        `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})">` +
          `<rect x="${f(-w / 2)}" y="0" width="${f(w)}" height="${f(length * 0.32)}" rx="1.6" fill="${paper}" stroke="${ink}" stroke-width="1.1"/>` +
          `<rect x="${f(-w / 2 + 1)}" y="${f(length * 0.3)}" width="${f(w - 2)}" height="${f(length * 0.7)}" rx="${f((w - 2) / 2)}" fill="${paper}" stroke="${ink}" stroke-width="1.1"/>` +
          `<rect x="${f(-1.2)}" y="${f(length * 0.62)}" width="2.4" height="${f(length * 0.24)}" rx="1.2" fill="${ink}"/>` +
          `</g>`,
      );
    }
  }
  return `<g id="zips">${out.join("")}</g>`;
}

// The woven patch: square cells along the shoulder's slope, each with three strips of paper running
// one way, the next cell's running across them, so the strips pass over and under. Each strip
// tapers at both ends, and the cells darken toward the patch's edges as the leather turns away.
export function weaveMarkup(outline: Point[], ink: string, paper: string, { cell = 8.5, angle = 24 } = {}): string {
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  const [cx, cy] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const reach = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + cell;
  const t = (angle * Math.PI) / 180;
  const [ux, uy, vx, vy] = [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t)];
  let strips = "";
  const n = Math.ceil(reach / cell);
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) {
      const [mx, my] = [cx + (i + 0.5) * cell * ux + (j + 0.5) * cell * vx, cy + (i + 0.5) * cell * uy + (j + 0.5) * cell * vy];
      const along = (i + j) % 2 === 0;
      const [ax, ay, bx, by] = along ? [ux, uy, vx, vy] : [vx, vy, ux, uy];
      for (const k of [-1, 0, 1]) {
        const off = k * cell * 0.27;
        const half = cell * 0.36;
        const [sx, sy] = [mx + bx * off, my + by * off];
        strips += `M${f(sx - ax * half)} ${f(sy - ay * half)}L${f(sx + ax * half)} ${f(sy + ay * half)}`;
      }
    }
  return (
    `<clipPath id="patch"><path d="${pathOf(outline)}"/></clipPath>` +
    `<path fill="${ink}" d="${pathOf(outline)}"/>` +
    `<path clip-path="url(#patch)" fill="none" stroke="${paper}" stroke-width="1.15" stroke-linecap="round" d="${strips}"/>` +
    `<path fill="none" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round" d="${pathOf(outline)}"/>`
  );
}

// An edge of a piece of leather, as the plate engraves it: the waves stop short of it, a bright rim
// runs along the edge itself, and a row of stitches runs inside it on the piece's side (`side`:
// +1 or -1, the hand of n = (-dy, dx) the piece lies on; 0, no stitches).
export type Edge = { line: Point[]; side: -1 | 0 | 1 };

const CLEAR = 3.2; // half the band of ink cleared of waves, so rim and stitches stand apart
const RIM = 1.5;
const STITCH = 4.2; // how far inside the rim the stitches run

// A polyline moved sideways by `by`, to the hand of n = (-dy, dx).
function offset(line: Point[], by: number): Point[] {
  return line.map(([x, y], i) => {
    const [ax, ay] = line[Math.max(0, i - 1)];
    const [bx, bY] = line[Math.min(line.length - 1, i + 1)];
    const len = Math.hypot(bx - ax, bY - ay) || 1;
    return [x - ((bY - ay) / len) * by, y + ((bx - ax) / len) * by];
  });
}

export function edgeMarkup(edges: Edge[], ink: string, paper: string): string {
  const round = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  // Stitched edges clear a band wide enough for rim and stitches; bare edges, only the rim's own.
  const clear = edges.filter((e) => e.side).map(({ line, side }) => polyline(offset(line, side * 1.6))).join("");
  const bare = edges.filter((e) => !e.side).map(({ line }) => polyline(line)).join("");
  const rims = edges.map(({ line }) => polyline(line)).join("");
  const stitches = edges.filter((e) => e.side).map(({ line, side }) => polyline(offset(line, side * STITCH))).join("");
  return (
    `<g id="edges">` +
    `<path ${round} stroke="${ink}" stroke-width="${2 * CLEAR + 3.2}" d="${clear}"/>` +
    `<path ${round} stroke="${ink}" stroke-width="${RIM + 2.4}" d="${bare}"/>` +
    `<path ${round} stroke="${paper}" stroke-width="${RIM}" d="${rims}"/>` +
    `<path fill="none" stroke="${paper}" stroke-width="1.3" stroke-linecap="round" stroke-dasharray="1.6 2.6" d="${stitches}"/>` +
    `</g>`
  );
}
