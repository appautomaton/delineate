// The pointer a hand moves, made as paper things are made. The arrow is a folded paper dart: two faces meeting at
// a crease, one catching the light and one in shade, inked round its edge in a deeper shade of the hand's own
// colour and set on a white rim so it reads on any ground; in flight, a flock of them is a flock of paper planes.
// The other tools are cut in the same way: a nib for drawing, a printer's registration mark for drawing out boxes
// and guides, a calligraphic I-beam, and small darts for carrying and pulling.
//
// Each shape is drawn about its hot spot, the point that acts, at the element's origin. The name tag is a slip of
// paper, stuck on a little askew, shown while the button is down.

export type Shape = "arrow" | "text" | "cross" | "pen" | "move" | "resize";

// The way the arrow's tip points when it stands upright, in degrees, for a flock to turn it by.
export const ARROW_AXIS = -118;

// Colours in the hand's own ink: the face in light, the face in shade, and the line round both.
const LIT = "color-mix(in oklab, var(--ink) 58%, #fff)";
const SHADE = "var(--ink)";
const LINE = "color-mix(in oklab, var(--ink) 62%, #000)";

const svg = (body: string) => `<svg viewBox="-24 -24 48 48" width="48" height="48">${body}</svg>`;

// A paper dart pointing up, its tip at the origin, `s` times its full size: two faces either side of the crease,
// each side drawn in a little, as a folded edge bows.
function dart(s = 1): string {
  const p = (x: number, y: number) => `${(x * s).toFixed(2)} ${(y * s).toFixed(2)}`;
  const outline = `M0 0Q${p(2.4, 9.4)} ${p(7, 19)}Q${p(3.1, 15.4)} ${p(0, 14.4)}Q${p(-3.1, 15.4)} ${p(-7, 19)}Q${p(-2.4, 9.4)} 0 0Z`;
  const left = `M0 0Q${p(-2.4, 9.4)} ${p(-7, 19)}Q${p(-3.1, 15.4)} ${p(0, 14.4)}Z`;
  const right = `M0 0L${p(0, 14.4)}Q${p(3.1, 15.4)} ${p(7, 19)}Q${p(2.4, 9.4)} 0 0Z`;
  return (
    `<path d="${outline}" fill="#fff" stroke="#fff" stroke-width="${(3.2 * s).toFixed(2)}" stroke-linejoin="round"/>` +
    `<path d="${left}" style="fill:${LIT}"/><path d="${right}" style="fill:${SHADE}"/>` +
    `<path d="M0 0L${p(0, 14.4)}" style="stroke:${LIT}" stroke-width="${(0.5 * s).toFixed(2)}" stroke-opacity="0.7"/>` +
    `<path d="${outline}" fill="none" style="stroke:${LINE}" stroke-width="${(0.85 * s).toFixed(2)}" stroke-linejoin="round"/>`
  );
}

// A line in the hand's ink on a white rim.
const inked = (d: string, w = 1.3, rim = 2.4) =>
  `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" stroke="#fff" stroke-width="${w + rim}"/>` +
  `<path d="${d}" style="stroke:${LINE}" stroke-width="${w}"/></g>`;

// A hairline from the hot spot out along each angle, a small dart at its end pointing on outward.
const rays = (angles: number[], reach = 12) =>
  angles.map((a) => `<g transform="rotate(${a})">${inked(`M0 -2.6V-${reach - 5}`, 0.9, 2.2)}</g>`).join("") +
  angles.map((a) => `<g transform="rotate(${a}) translate(0 -${reach})">${dart(0.4)}</g>`).join("");

const SHAPES: Record<Shape, string> = {
  // The dart, leaning as a pointer leans.
  arrow: svg(`<g transform="rotate(-28) scale(1.12)">${dart()}</g>`),
  // An I-beam with bracketed serifs, as a pen would letter it.
  text: svg(
    inked("M-4 -9.5C-1.6 -9.5 0 -8.6 0 -6.6V6.6C0 8.6 -1.6 9.5 -4 9.5M4 -9.5C1.6 -9.5 0 -8.6 0 -6.6M4 9.5C1.6 9.5 0 8.6 0 6.6M-1.8 0H1.8", 1.15, 2.2),
  ),
  // A printer's registration mark, in hairline: a small ring and a cross run through it and out past it, open at
  // the middle so the point it marks shows.
  cross: svg(
    inked("M0 -11V-1.6M0 1.6V11M-11 0H-1.6M1.6 0H11", 0.8, 2) +
      `<circle r="4.2" fill="none" stroke="#fff" stroke-width="2.6"/><circle r="4.2" fill="none" style="stroke:${LINE}" stroke-width="0.8"/>`,
  ),
  // A nib, its point the hot spot, held so the point is down and to the left: two faces, the slit, the hole.
  pen: svg(
    `<g transform="rotate(225)">` +
      `<path d="M0 0C-1.4 3.4 -6 7.4 -5.6 11.4L-4.4 18.4H4.4L5.6 11.4C6 7.4 1.4 3.4 0 0Z" fill="#fff" stroke="#fff" stroke-width="3.2" stroke-linejoin="round"/>` +
      `<path d="M0 0C-1.4 3.4 -6 7.4 -5.6 11.4L-4.4 18.4H0Z" style="fill:${LIT}"/>` +
      `<path d="M0 0C1.4 3.4 6 7.4 5.6 11.4L4.4 18.4H0Z" style="fill:${SHADE}"/>` +
      `<path d="M0 0C-1.4 3.4 -6 7.4 -5.6 11.4L-4.4 18.4H4.4L5.6 11.4C6 7.4 1.4 3.4 0 0Z" fill="none" style="stroke:${LINE}" stroke-width="0.85" stroke-linejoin="round"/>` +
      `<path d="M0 1.2V8.6" stroke="#fff" stroke-width="0.9" stroke-linecap="round"/><circle cy="10" r="1.35" fill="#fff"/>` +
      `<path d="M-4.4 15.2H4.4" style="stroke:${LINE}" stroke-width="0.6" stroke-opacity="0.6"/></g>`,
  ),
  // Four hairlines out from the point, each ending in a small dart, for carrying a thing across the page.
  move: svg(rays([0, 90, 180, 270])),
  // Two, on the diagonal, for pulling a corner out.
  resize: svg(rays([-45, 135])),
};

export class Pointer {
  readonly el: HTMLElement;
  readonly #glyph: HTMLElement;
  readonly #tag: HTMLElement;
  #shape: Shape | undefined;

  // `tilt` is how askew the tag sits, in degrees: each hand sticks its own on its own way.
  constructor(layer: HTMLElement, colour: string, name: string, tilt = 0) {
    this.el = document.createElement("div");
    this.el.className = "pointer";
    this.el.style.setProperty("--ink", colour);
    this.el.style.setProperty("--tilt", `${tilt}deg`);
    this.#glyph = document.createElement("span");
    this.#glyph.className = "pointer-glyph";
    this.#tag = document.createElement("span");
    this.#tag.className = "pointer-tag";
    this.#tag.textContent = name;
    this.el.append(this.#glyph, this.#tag);
    layer.append(this.el);
    this.shape = "arrow";
  }

  set shape(shape: Shape) {
    if (shape === this.#shape) return;
    this.#shape = shape;
    this.#glyph.innerHTML = SHAPES[shape];
    this.el.dataset.shape = shape;
  }

  set tagged(on: boolean) {
    this.el.classList.toggle("is-tagged", on);
  }

  // `turn` in degrees, about the hot spot; the tag stays upright.
  place(x: number, y: number, turn: number) {
    this.el.style.transform = `translate(${x}px, ${y}px)`;
    this.#glyph.style.transform = turn ? `rotate(${turn}deg)` : "";
  }
}
