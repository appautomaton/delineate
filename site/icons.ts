// The page's icons, in the same crayon as its drawings, each drawn on a 160 x 160 sheet so the wax keeps its
// grain when shown at icon size. Work is the page's own flower; Source is code's own sign, </>, written in three
// strokes; the page's light is a sun for day and a crescent for night. Each draws itself on, and again on hover.

import { Hand } from "../footers/crayon/hand.ts";
import { Sheet, circle, closedD, petal, poppy } from "../footers/crayon/shapes.ts";
import { Random } from "../footers/lib/random.ts";

type Icon = { sheet: Sheet; body: string };

// A flower, the page's own motif: five petals coloured in and finely outlined round a wound centre.
function work(): Icon {
  const sheet = new Sheet("ic-work-");
  return { sheet, body: poppy(sheet, new Hand(3, 0), 80, 80, 74, "red", "maroon", "maroon", { n: 5 }) };
}

// The sign for code: an angle bracket, a slash, an angle bracket, each one stroke, written left to right.
function source(): Icon {
  const h = new Hand(5, 0);
  for (const pts of [[[56, 40], [16, 80], [56, 120]], [[88, 32], [72, 128]], [[104, 40], [144, 80], [104, 120]]] as [number, number][][])
    h.stroke(pts, "deep", { width: 14, n: 6, secs: 0.24, weight: [3, 4.6], alpha: [0.75, 1] });
  return { sheet: new Sheet("ic-src-"), body: h.take() };
}

function sun(): Icon {
  const h = new Hand(7, 0);
  h.spiral(80, 80, 30, "ochre", { turns: 6, width: 10, n: 6, secs: 0.3, weight: [1.8, 3] });
  const disc = h.take();
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + 0.2;
    h.clock = 0.2 + k * 0.04;
    h.stroke([[80 + 46 * Math.cos(a), 80 + 46 * Math.sin(a)], [80 + 66 * Math.cos(a), 80 + 66 * Math.sin(a)]], "ochre", { width: 5, n: 3, secs: 0.08, weight: [1.8, 2.8] });
  }
  return { sheet: new Sheet("ic-sun-"), body: disc + h.take() };
}

function moon(): Icon {
  const sheet = new Sheet("ic-moon-");
  const h = new Hand(9, 0);
  const outer = circle(80, 80, 56, 24);
  // The crescent: the disc less a second disc set off toward the light.
  sheet.clips.push(`<clipPath id="${sheet.prefix}0"><path clip-rule="evenodd" d="${closedD(outer)} ${closedD(circle(104, 64, 50, 24))}"/></clipPath>`);
  h.fill(outer, "deep", { angle: -40, spacing: 8, width: 10, n: 6, secs: 0.35, weight: [1.8, 3] });
  const fill = h.take();
  h.line(outer, "deep", { closed: true, width: 4, n: 2, secs: 0.2, alpha: [0.4, 0.7] });
  return { sheet, body: `<g clip-path="url(#${sheet.prefix}0)">${fill}${h.take()}</g>` };
}

// The tab's mark: the same flower, flat, since at sixteen pixels the grain is only noise.
export function favicon(): string {
  const rng = new Random(3);
  const petals = Array.from({ length: 5 }, (_, k) => `<path d="${closedD(petal(rng, 160, 160, -Math.PI / 2 + (k * 2 * Math.PI) / 5, 150, 96))}"/>`).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">` +
    `<g fill="#CF3F2C" stroke="#8E2A24" stroke-width="8" stroke-linejoin="round">${petals}</g>` +
    `<circle cx="160" cy="160" r="38" fill="#3A3A38"/></svg>`
  );
}

// The page's mark, made under its links with the same crayon: a line, light and fine, drawn on a sheet that is
// stretched to the word it underlines, its strands keeping their width (the page draws them with non-scaling
// strokes); it draws itself on as it comes into view, and again when the pointer comes to it.
type Pt = [number, number];

// A line under a word on a W x H sheet: drawn left to right, sagging a little, lifting at its end.
function underline(seed: number, colour: string): string {
  const [W, H] = [400, 24];
  const rng = new Random(seed), h = new Hand(seed, 0), pts: Pt[] = [];
  const sag = rng.uniform(1.5, 3.5), lift = rng.uniform(2, 5);
  for (let k = 0; k <= 40; k++) {
    const t = k / 40;
    pts.push([6 + t * (W - 12), H / 2 + sag * Math.sin(Math.PI * t) - lift * t ** 4]);
  }
  h.stroke(pts, colour, { width: 3, n: 2, secs: 0.35, weight: [0.9, 1.3], alpha: [0.4, 0.6], step: 4 });
  return `<svg class="wax mark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${h.take()}</svg>`;
}

// Lines for the page's links, four of them, so no two links in a row are underlined alike.
export function marks(): Record<string, string> {
  return { MARK_LINES: [41, 43, 47, 53].map((seed) => underline(seed, "graphite")).join("") };
}

// Each icon's <svg>, by name.
export function icons(): Record<string, string> {
  const drawn = { work: work(), source: source(), sun: sun(), moon: moon() };
  return Object.fromEntries(
    Object.entries(drawn).map(([name, { sheet, body }]) => [
      name,
      `<svg class="wax icon icon--${name}" viewBox="0 0 160 160" aria-hidden="true"><defs>${sheet.defs()}</defs><g>${body}</g></svg>`,
    ]),
  );
}
