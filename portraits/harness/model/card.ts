// Cards: flat pieces of paper, each a polygon in one color, crisp or out of focus by its blur, drawn
// from authored data (confetti, tags, tickets). Fitted once, from the clearest picture of them, and
// stored in the scene.

import { type Point, pathOf } from "../trace/polygon.ts";
import { type Shape, footprint } from "./shape.ts";

export type Card = { color: string; corners: Point[]; blur?: number };

export function cardMarkup({ color, blur = 0, corners }: Card, id: string): { defs: string; body: string } {
  if (!blur) return { defs: "", body: `<path fill="${color}" d="${pathOf(corners)}"/>` };
  const defs = `<filter id="${id}-blur" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${blur}"/></filter>`;
  return { defs, body: `<path fill="${color}" filter="url(#${id}-blur)" d="${pathOf(corners)}"/>` };
}

export const cardShape = ({ color, corners, blur }: Card): Shape => ({ polygon: corners, color, blur });

// Every pixel a card touches, its blur included, or as far out as `reach`.
export const cardFootprint = (card: Card, w: number, h: number, reach = 2.5 * (card.blur ?? 0) + 1) => footprint(card.corners, w, h, reach);
