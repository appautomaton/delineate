// The Deep: a sunlit reef as a papercut diorama.
//
// Every plane is a sheet of cut paper. Shapes are flat colour with knife-cut edges; lace is made by cutting
// holes; depth comes from the shadows one sheet throws on the next. Generated here: the reef skylines, lace sea
// fans, branching coral, kelp in jointed segments, the sand, light rays, caustics.

import { catmull, ellipse, poly, resample, ribbon, smooth, type Pt } from "../../lib/geometry.ts";
import { f, fixed } from "../../lib/number.ts";
import { Random } from "../../lib/random.ts";
import { tile } from "../../lib/svg.ts";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// A cut edge of reef or rock: rounded mounds of varied height, closed down to the floor.
function skyline(x0: number, x1: number, base: number, low: number, high: number, step: number, seed: number, floor = 640): string {
  const rng = new Random(seed);
  const pts: Pt[] = [[x0, base - rng.uniform(low, high) * 0.5]];
  let x = x0;
  while (x < x1) {
    const w = rng.uniform(step * 0.6, step * 1.4);
    const h = rng.uniform(low, high);
    pts.push([x + w * 0.3, base - h * 0.85], [x + w * 0.5, base - h], [x + w * 0.75, base - h * rng.uniform(0.55, 0.8)]);
    x += w;
  }
  pts.push([x1, base - rng.uniform(low, high) * 0.4]);
  return smooth(pts) + `L${f(x1)} ${f(floor)}L${f(x0)} ${f(floor)}Z`;
}

// A sea fan cut as lace: a fan of paper with a field of small holes, on a short stalk. Fill it even-odd.
function seaFan(cx: number, base: number, r: number, seed: number): string {
  const rng = new Random(seed);
  const outline = Array.from({ length: 25 }, (_, k): Pt => {
    const a = Math.PI * (1.08 + (0.84 * k) / 24);
    const rr = r * (0.88 + 0.12 * Math.sin(k * 1.7 + seed)) * rng.uniform(0.95, 1.04);
    return [cx + Math.cos(a) * rr, base - r * 0.18 + Math.sin(a) * rr * 1.05];
  });
  const stalk: Pt[] = [[cx + 3, base - r * 0.16], [cx + 2.5, base], [cx - 2.5, base], [cx - 3, base - r * 0.16]];
  const holes: string[] = [];
  const rings = 6;
  for (let i = 1; i <= rings; i++) {
    const rad = r * (0.2 + (0.72 * i) / rings);
    const n = Math.trunc(5 + i * 3.2);
    for (let k = 0; k < n; k++) {
      const a = Math.PI * (1.12 + (0.76 * (k + 0.5)) / n) + rng.uniform(-0.03, 0.03);
      const hx = cx + Math.cos(a) * rad;
      const hy = base - r * 0.18 + Math.sin(a) * rad * 1.05;
      const hr = r * rng.uniform(0.035, 0.06) * (0.7 + (0.3 * i) / rings);
      holes.push(ellipse(hx, hy, hr * rng.uniform(1, 1.5), hr));
    }
  }
  return smooth(outline) + stalk.map(([x, y]) => `L${f(x)} ${f(y)}`).join("") + "Z" + holes.join("");
}

// Branching coral: forks that thin as they climb, every tip rounded off.
function staghorn(x: number, base: number, size: number, seed: number): string {
  const rng = new Random(seed);
  const out: string[] = [];
  const branch = (px: number, py: number, ang: number, length: number, width: number, depth: number) => {
    const ex = px + Math.cos(ang) * length;
    const ey = py + Math.sin(ang) * length;
    const mx = (px + ex) / 2 + rng.uniform(-3, 3);
    const my = (py + ey) / 2 + rng.uniform(-2, 2);
    out.push(ribbon(resample(catmull([[px, py], [mx, my], [ex, ey]], 5), 2.5), (u) => width * (1 - 0.35 * u)));
    out.push(ellipse(ex, ey, width * 0.33, width * 0.33));
    if (depth > 0) {
      for (const da of [-rng.uniform(0.35, 0.6), rng.uniform(0.35, 0.6)]) {
        branch(ex, ey, ang + da, length * rng.uniform(0.62, 0.8), width * 0.72, depth - 1);
      }
    }
  };
  for (const a of [-Math.PI / 2 - 0.45, -Math.PI / 2, -Math.PI / 2 + 0.5]) {
    branch(x, base, a + rng.uniform(-0.1, 0.1), size * rng.uniform(0.32, 0.4), size * 0.11, 3);
  }
  return out.join("");
}

// A brain coral: a dome with meandering grooves cut right through the paper.
function brain(cx: number, base: number, rx: number, ry: number, seed: number): [string, string] {
  const rng = new Random(seed);
  const dome = smooth([[cx - rx, base], [cx - rx * 0.92, base - ry * 0.55], [cx - rx * 0.55, base - ry * 0.95],
    [cx, base - ry], [cx + rx * 0.58, base - ry * 0.93], [cx + rx * 0.94, base - ry * 0.5], [cx + rx, base]]) + "Z";
  const grooves: string[] = [];
  for (let i = 0; i < 5; i++) {
    const yy = base - ry * (0.18 + 0.15 * i);
    const half = rx * Math.sqrt(Math.max(0, 1 - ((base - yy) / ry) ** 2)) * 0.82;
    const pts: Pt[] = [];
    for (let k = 0, x = cx - half; x < cx + half; k++) {
      pts.push([x, yy + (k % 2 ? 1.6 : -1.6) * rng.uniform(0.6, 1.2)]);
      x += rng.uniform(5, 8);
    }
    if (pts.length > 2) grooves.push(ribbon(resample(catmull(pts, 4), 2), (u) => 1.5 * Math.sin(Math.PI * u) ** 0.4));
  }
  return [dome, grooves.join("")];
}

// A kelp frond in jointed segments. Each segment is a nested group that pivots where it joins the one below,
// so a small sway at the root travels up the plant like a wave.
function kelp(x: number, base: number, height: number, seed: number, segments = 4, width = 7.0): string {
  const rng = new Random(seed);
  const segH = height / segments;
  const lean = rng.uniform(-0.12, 0.12);
  const open: string[] = [];
  for (let i = 0; i < segments; i++) {
    const y0 = base - segH * i;
    const y1 = y0 - segH;
    const x0 = x + lean * segH * i;
    const x1 = x0 + lean * segH + rng.uniform(-6, 6);
    const w = width * (1 - (0.55 * i) / segments);
    const stipe = resample(catmull([[x0, y0], [(x0 + x1) / 2 + rng.uniform(-5, 5), (y0 + y1) / 2], [x1, y1]], 6), 3);
    const parts = [ribbon(stipe, (u) => w * (1 - 0.2 * u))];
    // Blades leave the stipe on alternate sides; small floats sit at their bases.
    for (let k = 0; k < 2; k++) {
      const t = 0.3 + 0.45 * k;
      const [bx, by] = [lerp(x0, x1, t), lerp(y0, y1, t)];
      const side = (i + k) % 2 ? 1 : -1;
      const bladeLen = rng.uniform(26, 40) * (1 - (0.3 * i) / segments);
      const blade = resample(catmull([[bx, by], [bx + side * bladeLen * 0.45, by - bladeLen * 0.35], [bx + side * bladeLen, by - bladeLen * 0.55]], 6), 2.5);
      parts.push(ribbon(blade, (u) => 9 * Math.sin(Math.PI * Math.min(1, u * 1.05)) ** 0.7 * (1 - (0.3 * i) / segments)));
      parts.push(ellipse(bx + side * 2.6, by - 1.5, 3, 3.6));
    }
    const delay = -rng.uniform(0, 4);
    open.push(
      `<g class="dp-sway" style="transform-origin:${f(x0)}px ${f(y0)}px; --sway-d:${fixed(delay, 2)}s; --sway-a:${fixed(1.6 + i * 0.5, 1)}deg">` +
        `<path d="${parts.join("")}"/>`,
    );
  }
  return open.join("") + "</g>".repeat(segments);
}

// The sand floor as three sheets: a back drift, the floor, and a near ridge, each with a rippled top.
function sand(): Record<string, string> {
  const edge = (base: number, amp: number, seed: number, floor = 640) => {
    const rng = new Random(seed);
    const pts: Pt[] = [[-80, base + rng.uniform(-amp, amp)]];
    for (let x = -80; x < 1680; ) {
      x += rng.uniform(80, 160);
      pts.push([x, base + rng.uniform(-amp, amp)]);
    }
    return smooth(pts) + `L1680 ${floor}L-80 ${floor}Z`;
  };
  const ripples: string[] = [];
  const rng = new Random(4);
  for (let i = 0; i < 14; i++) {
    const y = 506 + i * 7.5;
    for (let x = -60 + rng.uniform(0, 80); x < 1660; ) {
      const ln = rng.uniform(60, 180);
      const line = Array.from({ length: 9 }, (_, k): Pt => [x + (k * ln) / 8, y + 1.6 * Math.sin(k * 1.4 + i)]);
      ripples.push(ribbon(resample(catmull(line, 4), 4), (u) => 1.4 * Math.sin(Math.PI * u)));
      x += ln + rng.uniform(30, 90);
    }
  }
  return { SAND_BACK: edge(470, 10, 1), SAND_FLOOR: edge(498, 8, 2), SAND_RIPPLES: ripples.join(""), SAND_NEAR: edge(560, 14, 3) };
}

// Shafts of light as strips of vellum, wider at the bottom, hanging from the surface.
function rays(): string {
  const rng = new Random(9);
  return [180, 330, 520, 760, 930, 1120, 1330, 1480]
    .map((x) => {
      const top = rng.uniform(26, 50);
      const bottom = top * rng.uniform(2.2, 3.4);
      const lean = rng.uniform(40, 120);
      return (
        `<path class="dp-ray" style="transform-origin:${f(x)}px 0; --ray-d:${fixed(-rng.uniform(0, 9), 1)}s" ` +
        `d="M${f(x - top / 2)} -40L${f(x + top / 2)} -40L${f(x + lean + bottom / 2)} 560L${f(x + lean - bottom / 2)} 560Z"/>`
      );
    })
    .join("");
}

// The bright net that sunlight throws on the sand: a jittered honeycomb of thin, broken lines.
function caustics(): string {
  const rng = new Random(21);
  const out: string[] = [];
  const cell = 26;
  for (let row = 0; row < 10; row++) {
    for (let col = -2; col < 68; col++) {
      const cx = col * cell + ((row % 2) * cell) / 2 + rng.uniform(-6, 6);
      const cy = 500 + row * 11 + rng.uniform(-3, 3);
      const pts = Array.from({ length: 6 }, (_, k): Pt => {
        const a = (2 * Math.PI * k) / 6 + rng.uniform(-0.3, 0.3);
        const rr = cell * rng.uniform(0.42, 0.6);
        return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.36];
      });
      // Leave one side open: caustics never close their loops neatly.
      const gap = rng.randint(0, 5);
      out.push(poly([...pts.slice(gap + 1), ...pts.slice(0, gap)], false));
    }
  }
  return out.join("");
}

// Marine snow on the page above: drifting specks that thicken as the water deepens.
function snow(): string {
  const rng = new Random(14);
  return Array.from({ length: 40 }, () => {
    const [x, y] = [rng.uniform(2, 98), rng.uniform(1, 98)];
    const r = rng.choice([0.8, 1, 1.2, 1.4]);
    const a = rng.uniform(0.15, 0.45) * (0.4 + y / 100);
    return `radial-gradient(${r}px ${r}px at ${fixed(x, 1)}% ${fixed(y, 1)}%, rgb(200 240 236 / ${fixed(a, 2)}) 60%, transparent)`;
  }).join(",\n      ");
}

// The front sheet of the diorama: a cave mouth cut from dark rock, open in the middle.
function cave(): Record<string, string> {
  const rng = new Random(30);
  const side = (xs: number[], ys: number[]) => xs.map((x, i): Pt => [x + rng.uniform(-8, 8), ys[i] + rng.uniform(-6, 6)]);
  const left = side([-80, -40, 10, 54, 90, 128, 168, 200, 222, 236, 248], [190, 176, 196, 236, 276, 330, 398, 450, 500, 548, 600]);
  const right = side([1680, 1640, 1590, 1548, 1510, 1474, 1436, 1404, 1380, 1366, 1354], [180, 170, 192, 232, 278, 330, 392, 446, 498, 546, 600]);
  return {
    CAVE_L: smooth(left) + "L248 640L-80 640Z",
    CAVE_R: smooth(right) + "L1354 640L1680 640Z",
    // Lit lips along the inner edge, a second, paler sheet set just behind the first.
    CAVE_L_LIP: smooth(left.map(([x, y]): Pt => [x + 10, y + 6])) + "L258 640L-80 640Z",
    CAVE_R_LIP: smooth(right.map(([x, y]): Pt => [x - 10, y + 6])) + "L1344 640L1680 640Z",
  };
}

// Paper: a fibrous sheet, faint, laid over everything in soft light; and the same paper, faint enough to sit
// under running text on the page above.
const paper = (lite: string, dark: string) =>
  tile(
    "<feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='1' seed='4' stitchTiles='stitch' result='g'/>" +
      "<feTurbulence type='turbulence' baseFrequency='.22' numOctaves='2' seed='9' stitchTiles='stitch' result='f'/>" +
      "<feComposite in='g' in2='f' operator='arithmetic' k2='.7' k3='.3' result='m'/>" +
      `<feColorMatrix in='m' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${lite}' result='lite'/>` +
      `<feColorMatrix in='m' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${dark}' result='dark'/>` +
      "<feMerge><feMergeNode in='lite'/><feMergeNode in='dark'/></feMerge>",
    256,
    256,
  );
const TEX_PAPER = paper("2.2 0 0 0 -1.05", "-2.2 0 0 0 1.2");
const TEX_PAPER_PAGE = paper(".8 0 0 0 -.38", "-.8 0 0 0 .44");

export function placeholders(): Record<string, string> {
  const [brainA, groovesA] = brain(560, 506, 46, 34, 7);
  const [brainB, groovesB] = brain(1350, 510, 38, 28, 8);
  return {
    TEX_PAPER_PAGE,
    FAR_REEF: skyline(-80, 1680, 452, 30, 90, 110, 3),
    FAR_REEF_2: skyline(-80, 1680, 470, 20, 60, 80, 4),
    MID_ROCK_L: skyline(-80, 430, 486, 50, 150, 80, 5),
    MID_ROCK_R: skyline(1140, 1680, 490, 50, 160, 80, 6),
    BACK_ROCK_L: skyline(-80, 560, 470, 60, 190, 120, 7),
    BACK_ROCK_R: skyline(1000, 1680, 474, 60, 200, 120, 8),
    FAN_A: seaFan(250, 470, 74, 1),
    FAN_B: seaFan(1270, 476, 64, 2),
    FAN_C: seaFan(1500, 470, 52, 3),
    FAN_FAR: seaFan(700, 456, 44, 4) + seaFan(1010, 458, 38, 5),
    STAG_A: staghorn(400, 500, 120, 1),
    STAG_B: staghorn(1150, 504, 110, 2),
    STAG_C: staghorn(80, 500, 96, 3),
    RAYS: rays(),
    CAUSTICS: caustics(),
    PAGE_SNOW: snow(),
    TEX_PAPER,
    KELP_L: kelp(30, 640, 420, 1, 5, 9) + kelp(96, 640, 330, 2, 4, 7.5),
    KELP_R: kelp(1560, 640, 400, 3, 5, 9) + kelp(1490, 640, 300, 4, 4, 7.5),
    KELP_MID: kelp(520, 500, 220, 5, 4, 5.5) + kelp(1060, 500, 190, 6, 3, 5),
    BRAIN_A: brainA,
    BRAIN_A_GROOVES: groovesA,
    BRAIN_B: brainB,
    BRAIN_B_GROOVES: groovesB,
    ...sand(),
    ...cave(),
  };
}

// Scene picker glyph, 16 x 16: a fish and a rising bubble.
export const GLYPH =
  '<path d="M1.8 9.4C4.2 6.2 8.4 5.8 11.4 9.4C8.4 13 4.2 12.6 1.8 9.4Z"/><path d="M11.4 9.4L14.4 7V11.8Z"/>' +
  '<circle cx="12.6" cy="3.4" r="1.4"/>';
