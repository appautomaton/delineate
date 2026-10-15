// Where hands and their marks are measured from. On a page of their own they work in page coordinates, so they
// stay with the page as it scrolls; set into another page, on a stage, they work in the stage's own coordinates,
// so they stay with the stage however the page around it moves it.

import type { Box, Pt } from "./motion.ts";

export type Space = {
  // An element's box, and the box its text fills, as a text frame hugs its words.
  box(el: Element): Box;
  text(el: Element): Box;
  // A point on the screen.
  point(clientX: number, clientY: number): Pt;
  // What of the space can be seen.
  view(): Box;
};

function textRect(el: Element): DOMRect {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}

const shift = (r: DOMRect, dx: number, dy: number): Box => ({ x: r.left + dx, y: r.top + dy, w: r.width, h: r.height });

// The page: the origin is the top left of the document.
export const PAGE: Space = {
  box: (el) => shift(el.getBoundingClientRect(), scrollX, scrollY),
  text: (el) => shift(textRect(el), scrollX, scrollY),
  point: (x, y) => ({ x: x + scrollX, y: y + scrollY }),
  view: () => ({ x: scrollX, y: scrollY, w: document.documentElement.clientWidth, h: innerHeight }),
};

// A stage: the origin is the stage's top left, wherever the stage is.
export function stage(el: HTMLElement): Space {
  const o = () => el.getBoundingClientRect();
  return {
    box: (e) => shift(e.getBoundingClientRect(), -o().left, -o().top),
    text: (e) => shift(textRect(e), -o().left, -o().top),
    point: (x, y) => ({ x: x - o().left, y: y - o().top }),
    view: () => ({ x: 0, y: 0, w: el.clientWidth, h: el.clientHeight }),
  };
}
