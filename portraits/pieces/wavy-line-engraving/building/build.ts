// The buildings, engraved (see scene.ts): each block a paper face that hides what is behind it,
// toned by the engraving's level waves read off the plate as a field, outlined in fine ink, with
// its window columns, masts and plant; the near towers' floors run to the vanishing point.

import type { Point } from "../../../harness/trace/polygon.ts";
import { type Box, GAIN, blur, ink, inked, luminance, placed, rgb, sample, shapes, waves } from "../engrave.ts";
import { PAPER, REFERENCES, SIZE, SPACING, STREET_INK, run, source } from "../sheet.ts";
import { type Block, FAR, GROUND, MASTS, NEAR, PLANT, VANISH } from "./scene.ts";

const K = 3;
// The far towers' lines run finer than the near ones', as the plate's do: distance in the line.
const FAR_SPACING = 4.6;
const far = waves({ ripple: { amplitude: 0.35, wavelength: 30 }, wander: [{ amplitude: 0.25, scale: 60 }, { amplitude: 0.8, scale: 300 }], seed: 23 });
const near = waves({ ripple: { amplitude: 1.1, wavelength: 30 }, wander: [{ amplitude: 0.6, scale: 50 }, { amplitude: 1.6, scale: 220 }], seed: 29 });
// A line covers its share of the spacing in proportion to darkness, up to FULLEST, so a face in
// shadow keeps slits of paper; lines thinner than FINEST px are not drawn.
const FULLEST = 0.9;
const FINEST = 0.25;
const FACE_BLUR = 7; // px: past a window, short of a face

const f = (v: number) => (Math.round(v * 10) / 10).toString();
const pathOf = (pts: Point[]) => "M" + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L") + "Z";

// The ground line's height at x.
function ground(x: number): number {
  for (let i = 0; i < GROUND.length - 1; i++) {
    const [[ax, ay], [bx, by]] = [GROUND[i], GROUND[i + 1]];
    if (x >= ax && x <= bx) return ay + ((by - ay) * (x - ax)) / (bx - ax || 1);
  }
  return GROUND[x < GROUND[0][0] ? 0 : GROUND.length - 1][1];
}

// A block's outline: a box standing on the ground line, its foot following it, or its own polygon.
function outline({ shape }: Block): Point[] {
  if (typeof shape[0] !== "number") return shape as Point[];
  const [x0, x1, roof] = shape as [number, number, number];
  const foot = GROUND.filter(([x]) => x > x0 && x < x1).reverse();
  return [[x0, roof], [x1, roof], [x1, ground(x1)], ...foot, [x0, ground(x0)]];
}

const inside = (pts: Point[], x: number, y: number) => {
  let odd = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [[ax, ay], [bx, by]] = [pts[i], pts[j]];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) odd = !odd;
  }
  return odd;
};

// Which block shows at each pixel (-1 none), the later in the list in front.
function visible(blocks: Block[]): Int16Array {
  const id = new Int16Array(SIZE * SIZE).fill(-1);
  blocks.map(outline).forEach((pts, i) => {
    const xs = pts.map(([x]) => x);
    const ys = pts.map(([, y]) => y);
    for (let y = Math.max(0, Math.floor(Math.min(...ys))); y < Math.min(SIZE, Math.ceil(Math.max(...ys))); y++)
      for (let x = Math.max(0, Math.floor(Math.min(...xs))); x < Math.min(SIZE, Math.ceil(Math.max(...xs))); x++) if (inside(pts, x + 0.5, y + 0.5)) id[y * SIZE + x] = i;
  });
  return id;
}

// One group of blocks: paper faces, then the waves over them all at the darkness `tone` gives,
// then each block's outline and window columns, hidden where a block in front covers them.
function group(name: string, blocks: Block[], level: (x: number, y: number) => number, spacing: number, tone: (x: number, y: number) => number, box: Box): string {
  const shapes_ = blocks.map(outline);
  const all = shapes_.map((s) => `<path d="${pathOf(s)}"/>`).join("");
  const width = (x: number, y: number) => {
    const w = Math.min(FULLEST, Math.max(0, tone(x, y))) * spacing - GAIN;
    return w < FINEST ? 0 : w;
  };
  // A face's lines run unbroken, the paper between them even, as the plate's; a lit face's
  // thin lines break into dashes, its windows.
  const lines = ink(width, { level, spacing, cut: { paper: false, ink: true } }, null, box, K);
  const out: string[] = [
    `<clipPath id="${name}">${all}</clipPath>`,
    `<g fill="${PAPER}">${all}</g>`,
    `<g clip-path="url(#${name})">${placed(box, shapes(lines, K, 0.2, 0.3), K, STREET_INK)}</g>`,
  ];
  shapes_.forEach((s, i) => {
    const front = shapes_.slice(i + 1).map(pathOf).join("");
    const mask = front ? ` mask="url(#${name}-${i})"` : "";
    if (front) out.push(`<mask id="${name}-${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="white"/><path fill="black" d="${front}"/></mask>`);
    const marks: string[] = [];
    const columns = blocks[i].columns;
    if (columns) {
      let d = "";
      for (let x = columns.x[0]; x <= columns.x[1]; x += columns.every) d += `M${f(x)} ${f(columns.from)}V${f(ground(x) + 2)}`;
      out.push(`<clipPath id="${name}-${i}-face"><path d="${pathOf(s)}"/></clipPath>`);
      marks.push(`<path clip-path="url(#${name}-${i}-face)" fill="none" stroke="${STREET_INK}" stroke-width="0.75" d="${d}"/>`);
    }
    marks.push(`<path fill="none" stroke="${PAPER}" stroke-width="2.2" stroke-linejoin="round" d="${pathOf(s)}"/>`);
    marks.push(`<path fill="none" stroke="${STREET_INK}" stroke-width="0.9" stroke-linejoin="round" d="${pathOf(s)}"/>`);
    out.push(`<g${mask}>${marks.join("")}</g>`);
  });
  return out.join("\n");
}

export async function draw(): Promise<string> {
  const plate = source("building");
  const { dark } = inked(plate, PAPER, STREET_INK, 0.8 * FAR_SPACING);
  // A far face keeps to its own tone: the plate's darkness blurred within the part of the face
  // that shows, past its windows, so a face's light and shade carry but never bleed into its
  // neighbor's.
  const [p, q] = [luminance(...rgb(PAPER)), luminance(...rgb(STREET_INK))];
  const id = visible(FAR);
  const faces = FAR.map((_, i) => {
    let [x0, y0, x1, y1] = [SIZE, SIZE, 0, 0];
    id.forEach((j, at) => {
      if (j !== i) return;
      const [x, y] = [at % SIZE, Math.floor(at / SIZE)];
      [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x + 1), Math.max(y1, y + 1)];
    });
    if (x1 <= x0) return null;
    const [w, h] = [x1 - x0, y1 - y0];
    const values = new Float32Array(w * h);
    const weight = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const at = (y + y0) * SIZE + x + x0;
        if (id[at] !== i || plate.data[at * 4 + 3] < 128) continue;
        values[y * w + x] = (p - luminance(plate.data[at * 4], plate.data[at * 4 + 1], plate.data[at * 4 + 2])) / (p - q);
        weight[y * w + x] = 1;
      }
    return { x0, y0, w, h, tone: blur(values, weight, w, h, FACE_BLUR) };
  });
  const flat = (x: number, y: number) => {
    const [cx, cy] = [Math.min(SIZE - 1, Math.floor(x)), Math.min(SIZE - 1, Math.floor(y))];
    const face = faces[id[cy * SIZE + cx]];
    if (!face) return 0;
    const [u, v] = [Math.min(face.w - 1, Math.max(0, cx - face.x0)), Math.min(face.h - 1, Math.max(0, cy - face.y0))];
    return face.tone[v * face.w + u];
  };
  const out: string[] = [];
  out.push(group("far", FAR, far, FAR_SPACING, flat, [130, 140, 1045, 706]));
  // Masts and plant on the far roofs.
  out.push(`<path fill="none" stroke="${STREET_INK}" stroke-width="1" stroke-linecap="round" d="${MASTS.map(([x, a, b]) => `M${x} ${a}V${b}`).join("")}"/>`);
  out.push(`<path fill="${PAPER}" stroke="${STREET_INK}" stroke-width="0.8" d="${PLANT.map(([a, b, top, roof]) => `M${a} ${roof}V${top}H${b}V${roof}Z`).join("")}"/>`);
  // The near towers, in front of all; their floors run to the vanishing point.
  const [vx, vy] = VANISH;
  NEAR.forEach(({ blocks, edge, floors }, t) => {
    const xs = blocks.flatMap((b) => outline(b).map(([x]) => x));
    const ys = blocks.flatMap((b) => outline(b).map(([, y]) => y));
    const [a, b] = [Math.min(...xs), Math.max(...xs)];
    const box: Box = [Math.floor(a), 0, Math.ceil(b), Math.ceil(Math.max(...ys)) + 2];
    out.push(group(`near${t}`, blocks, near, SPACING, (x, y) => sample(dark, x, y), box));
    let d = "";
    for (const y of floors) {
      const along = (x: number) => vy + ((y - vy) * (x - vx)) / (edge - vx);
      d += `M${f(a)} ${f(along(a))}L${f(b)} ${f(along(b))}`;
    }
    out.push(`<g clip-path="url(#near${t})"><path fill="none" stroke="${PAPER}" stroke-width="2.6" d="${d}"/><path fill="none" stroke="${STREET_INK}" stroke-width="1.1" d="${d}"/></g>`);
  });
  return out.join("\n");
}

export const title = "The towers of a city street, as a wavy-line engraving";
await run(import.meta.url, { title, draw }, "building");
