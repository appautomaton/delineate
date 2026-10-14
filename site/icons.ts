// The page's icons, in the same crayon as its drawings, each drawn on a 160 x 160 sheet so the wax keeps its
// grain when shown at icon size. Work is the page's own flower; GitHub is its mark, coloured in; the page's light
// is a sun for day and a crescent for night. Each draws itself on, and again on hover.

import { Hand } from "../footers/crayon/hand.ts";
import { Sheet, circle, closedD, petal, poppy } from "../footers/crayon/shapes.ts";
import { Random } from "../footers/lib/random.ts";

// GitHub's mark (Octicons, mark-github), on its 16 x 16 grid, scaled to the sheet.
const GITHUB =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49" +
  "-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52" +
  ".28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18" +
  " 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07" +
  "-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42" +
  "-3.58-8-8-8z";

type Icon = { sheet: Sheet; body: string };

// A flower, the page's own motif: five petals coloured in and finely outlined round a wound centre.
function work(): Icon {
  const sheet = new Sheet("ic-work-");
  return { sheet, body: poppy(sheet, new Hand(3, 0), 80, 80, 74, "red", "maroon", "maroon", { n: 5 }) };
}

function github(): Icon {
  const sheet = new Sheet("ic-gh-");
  const h = new Hand(5, 0);
  h.fill([[4, 4], [156, 4], [156, 156], [4, 156]], "deep", { angle: -35, spacing: 5, width: 8, n: 6, secs: 0.45, weight: [2.2, 3.6], alpha: [0.75, 1] });
  const fill = h.take();
  const id = `${sheet.prefix}0`;
  sheet.clips.push(`<clipPath id="${id}"><path transform="translate(4 4) scale(9.5)" d="${GITHUB}"/></clipPath>`);
  h.loops(80, 80, 73, "deep", { turns: 1.05, width: 5, n: 3, secs: 0.3, alpha: [0.55, 0.85], wobble: 0.015 });
  return { sheet, body: `<g clip-path="url(#${id})">${fill}</g>${h.take()}` };
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

// Each icon's <svg>, by name.
export function icons(): Record<string, string> {
  const drawn = { work: work(), github: github(), sun: sun(), moon: moon() };
  return Object.fromEntries(
    Object.entries(drawn).map(([name, { sheet, body }]) => [
      name,
      `<svg class="wax icon icon--${name}" viewBox="0 0 160 160" aria-hidden="true"><defs>${sheet.defs()}</defs><g>${body}</g></svg>`,
    ]),
  );
}
