// Procedural parts of the desert: ripples, footprints, pebbles, fleece curls, grass, stars, texture tiles.

import { bezier, ellipse, type Pt } from "../../lib/geometry.ts";
import { f, fixed, hypot } from "../../lib/number.ts";
import { Random } from "../../lib/random.ts";
import { tile } from "../../lib/svg.ts";

const radians = (degrees: number) => degrees * (Math.PI / 180);

// Wind ripples across the sand, in rows that open out toward the viewer.
function ripples(): string {
  const rng = new Random(7);
  const out: string[] = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = 478 + 80 * t;
    const lam = 46 + 38 * t;
    const amp = 0.8 + 1.7 * t;
    const ph = rng.uniform(0, 6.28);
    const by = (x: number) => base + 3.4 * Math.sin(x / 270 + ph) + 1.5 * Math.sin(x / 93 + ph * 1.7);
    for (let x = -60 + rng.uniform(0, lam); x < 1660; ) {
      const end = Math.min(x + rng.uniform(150, 440), 1660);
      let sign = rng.random() < 0.5 ? 1 : -1;
      let d = `M${f(x)} ${f(by(x))}`;
      for (let xs = x; xs < end; ) {
        const xe = xs + lam / 2;
        const cx = (xs + xe) / 2;
        const a = amp * rng.uniform(0.55, 1.2);
        d += `Q${f(cx)} ${f(by(cx) - 2 * a * sign)} ${f(xe)} ${f(by(xe))}`;
        sign = -sign;
        xs = xe;
      }
      out.push(d);
      x = end + rng.uniform(24, 120);
    }
  }
  return out.join("");
}

// Footprints along a curve, left and right of it in turn, `step` apart.
function trail(p: readonly Pt[], step: number, rx: number, ry: number, spread: number, seed: number): string {
  const rng = new Random(seed);
  const pts = Array.from({ length: 3001 }, (_, i) => bezier(p, i / 3000));
  let acc = 0;
  let next = step * 0.5;
  let side = 1;
  const out: string[] = [];
  for (let i = 1; i < pts.length; i++) {
    const [[ax, ay], [bx, by]] = [pts[i - 1], pts[i]];
    acc += hypot(bx - ax, by - ay);
    if (acc < next) continue;
    const [tx, ty] = [bx - ax, by - ay];
    const ln = hypot(tx, ty) || 1;
    const [nx, ny] = [-ty / ln, tx / ln];
    const x = bx + nx * spread * side + rng.uniform(-0.8, 0.8);
    const y = by + ny * spread * side * 0.45 + rng.uniform(-0.4, 0.4);
    const k = rng.uniform(0.85, 1.12);
    out.push(ellipse(x, y, rx * k, ry * k));
    side = -side;
    next += step * rng.uniform(0.9, 1.1);
  }
  return out.join("");
}

// A camel's track coming in from the right, and two alpacas' from the left.
function prints(): string {
  const camel = trail([[1700, 470], [1460, 486], [1240, 496], [1040, 480]], 16, 3.4, 1.3, 3.2, 3);
  const alpacaA = trail([[-60, 458], [150, 452], [340, 494], [560, 496]], 9.5, 2.0, 0.85, 2.0, 5);
  const alpacaB = trail([[-60, 466], [170, 462], [330, 488], [470, 486]], 9.5, 1.9, 0.8, 2.0, 9);
  return camel + alpacaA + alpacaB;
}

// A tuft of grass fanning from (bx, by): dark blades, light blades, and seed heads on the upright ones.
function tuftPaths(bx: number, by: number, s: number, n: number, seed: number): [string, string, string] {
  const rng = new Random(seed);
  const [dark, light, seeds]: string[][] = [[], [], []];
  for (let i = 0; i < n; i++) {
    const th = radians(-72 + (144 * i) / (n - 1) + rng.uniform(-9, 9));
    const ln = s * (8 + 12 * Math.cos(th) ** 1.6 + rng.uniform(-2.5, 2.5));
    const [ex, ey] = [bx + ln * Math.sin(th), by - ln * Math.cos(th)];
    const [cx, cy] = [bx + ln * 0.18 * Math.sin(th), by - ln * 0.82 * Math.cos(th)];
    (i % 3 === 1 ? light : dark).push(`M${f(bx + rng.uniform(-1.5, 1.5) * s)} ${f(by)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`);
    if (Math.abs(th) < 0.75 && rng.random() < 0.5) seeds.push(ellipse(ex, ey, 1.5 * s, 0.7 * s));
  }
  return [dark.join(""), light.join(""), seeds.join("")];
}

// Each tuft is its own group so it can bend in the wind about its base.
function tufts(specs: readonly (readonly [number, number, number, number, number])[], width: number): string {
  const rng = new Random(specs.length * 17);
  return specs
    .map(([bx, by, s, n, seed]) => {
      const [dark, light, seeds] = tuftPaths(bx, by, s, n, seed);
      return (
        `<g class="tuft" style="transform-origin:${f(bx)}px ${f(by)}px; ` +
        `--sway-t:${fixed(rng.uniform(2.4, 3.6), 2)}s; --sway-d:${fixed(rng.uniform(0, 2), 2)}s">` +
        `<path d="${dark}" style="stroke:var(--grass-dark)" stroke-width="${width}"/>` +
        `<path d="${light}" style="stroke:var(--grass-light)" stroke-width="${fixed(width * 0.8, 2)}"/>` +
        `<path d="${seeds}" style="fill:var(--grass-light)" stroke="none"/></g>`
      );
    })
    .join("");
}

// Curls of fleece on the alpaca.
function curls(): string {
  const rng = new Random(13);
  const out: string[] = [];
  const regions = [[[28, 116], [204, 252], 64], [[94, 124], [158, 214], 18]] as const;
  for (const [[x0, x1], [y0, y1], n] of regions) {
    for (let i = 0; i < n; i++) {
      const [x, y] = [rng.uniform(x0, x1), rng.uniform(y0, y1)];
      const r = rng.uniform(2.0, 3.4);
      const a = rng.uniform(0, 6.28);
      out.push(`M${f(x)} ${f(y)}a${f(r)} ${f(r)} 0 0 1 ${f(r * 1.6 * Math.cos(a))} ${f(r * 1.6 * Math.sin(a))}`);
    }
  }
  return out.join("");
}

// Pebbles, each a body, a lit cap and a shadow cast to the right.
function pebbles(): [string, string, string] {
  const specs = [[664, 498, 3.0], [748, 500, 2.3], [690, 503, 1.6], [884, 488, 2.6], [430, 522, 3.6],
    [452, 528, 2.0], [1188, 502, 2.9], [1330, 534, 3.8], [1352, 538, 2.2], [980, 520, 2.4]] as const;
  const [body, light, shadow]: string[][] = [[], [], []];
  for (const [x, y, r] of specs) {
    const ry = r * 0.62;
    body.push(ellipse(x, y, r, ry));
    light.push(ellipse(x - r * 0.25, y - ry * 0.4, r * 0.55, ry * 0.45));
    shadow.push(ellipse(x + r * 1.1, y + ry * 0.5, r * 1.5, ry * 0.7));
  }
  return [body.join(""), light.join(""), shadow.join("")];
}

// The night sky: stars kept apart from each other, some twinkling, four of them glinting with a cross.
function stars(): string {
  const rng = new Random(42);
  const out: string[] = [];
  const placed: Pt[] = [];
  while (placed.length < 76) {
    const [x, y] = [rng.uniform(10, 1590), rng.uniform(10, 640)];
    if (placed.some(([px, py]) => hypot(x - px, y - py) < 50)) continue;
    placed.push([x, y]);
    const r = rng.choice([0.6, 0.7, 0.8, 0.8, 0.9, 1.0, 1.2, 1.5]);
    const a = rng.uniform(0.35, 0.9);
    if (rng.random() < 0.45) {
      out.push(
        `<circle class="tw" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" ` +
          `style="--a:${fixed(a, 2)}; --t:${fixed(rng.uniform(2.2, 5.5), 2)}s; --d:${fixed(rng.uniform(0, 4), 2)}s"/>`,
      );
    } else out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" opacity="${fixed(a, 2)}"/>`);
  }
  for (const [x, y] of placed.slice(3, 7)) {
    out.push(
      `<g class="tw" style="--a:.85; --t:${fixed(rng.uniform(3, 5), 2)}s; --d:${fixed(rng.uniform(0, 3), 2)}s">` +
        `<circle cx="${f(x)}" cy="${f(y)}" r="1.5"/>` +
        `<path d="M${f(x - 5)} ${f(y)}h10M${f(x)} ${f(y - 5)}v10" stroke="#FFF4DC" stroke-width=".5"/></g>`,
    );
  }
  return out.join("");
}

// Stars on the page above the footer, as CSS gradients, fainter toward the horizon.
function pageStars(): string {
  const rng = new Random(9);
  return Array.from({ length: 46 }, () => {
    const [x, y] = [rng.uniform(2, 98), rng.uniform(1, 92)];
    const r = rng.choice([0.8, 1, 1, 1.2, 1.5]);
    const a = rng.uniform(0.25, 0.75) * (1 - y / 140);
    return `radial-gradient(${r}px ${r}px at ${fixed(x, 1)}% ${fixed(y, 1)}%, rgb(255 244 220 / ${fixed(a, 2)}) 60%, transparent)`;
  }).join(",\n      ");
}

const TEX_RELIEF = tile(
  "<feTurbulence type='turbulence' baseFrequency='.11' numOctaves='2' seed='7' stitchTiles='stitch'/>" +
    "<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 0 0 0 1.1'/>" +
    "<feDiffuseLighting surfaceScale='1.6' diffuseConstant='.72' lighting-color='#fff'>" +
    "<feDistantLight azimuth='235' elevation='46'/></feDiffuseLighting>",
  256,
  256,
);
const TEX_CURL = tile(
  "<feTurbulence type='turbulence' baseFrequency='.15' numOctaves='1' seed='7' stitchTiles='stitch' result='t'/>" +
    "<feColorMatrix in='t' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -11 0 0 0 1.1' result='lines'/>" +
    "<feTurbulence type='fractalNoise' baseFrequency='.05' numOctaves='2' seed='2' stitchTiles='stitch'/>" +
    "<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3 0 0 0 -.9' result='keep'/>" +
    "<feComposite in='lines' in2='keep' operator='in' result='curl'/>" +
    "<feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='1' seed='9' stitchTiles='stitch'/>" +
    "<feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 14 -9.4' result='dots'/>" +
    "<feMerge><feMergeNode in='curl'/><feMergeNode in='dots'/></feMerge>",
  256,
  256,
);
// Long horizontal wisps of blown sand; used as a mask over a theme-coloured band.
const TEX_DRIFT = tile(
  "<feTurbulence type='fractalNoise' baseFrequency='.0039 .055' numOctaves='3' seed='12' stitchTiles='stitch'/>" +
    "<feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 3.4 0 0 0 -1.55'/>",
  512,
  160,
);

export function placeholders(): Record<string, string> {
  const [pebble, light, shadow] = pebbles();
  return {
    RIPPLES: ripples(),
    PRINTS: prints(),
    CURLS: curls(),
    PEBBLES: pebble,
    PEBBLE_LIGHTS: light,
    PEBBLE_SHADOWS: shadow,
    TUFTS_GROUND: tufts([[404, 464, 0.95, 9, 1], [1300, 468, 0.85, 8, 2], [1462, 480, 1.05, 10, 3], [900, 486, 0.7, 7, 6]], 1.2),
    TUFTS_NEAR: tufts([[176, 528, 1.6, 12, 4], [1508, 524, 1.4, 11, 5]], 1.8),
    STARS: stars(),
    PAGE_STARS: pageStars(),
    TEX_RELIEF,
    TEX_CURL,
    TEX_DRIFT,
  };
}

// Scene picker glyph, 16 x 16: a low sun over two dune crests.
export const GLYPH = '<circle cx="5" cy="4.6" r="1.7"/><path d="M5.6 9.4C8.2 7 11.6 6.8 14.5 8.6M1.5 13.2C4.4 9.8 8.2 9.2 11.8 11.8"/>';
