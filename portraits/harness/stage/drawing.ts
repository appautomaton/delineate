// The drawing as a document: one SVG that is the picture at rest and carries everything a page
// needs to move it. Builds write it here, so every piece keeps the same contract with the stage
// (see page.html):
//
//   <svg viewBox="0 0 W H" data-focus="2">          the focus distance, in meters
//     <style>                                         the motions (motion.css), then the piece's own
//     <defs>
//     <g class="layer" id="layer-sky" data-plane="c ax ay" data-title="Sky" data-note="…">
//       <g id="clouds" class="moving drift">…</g>     moves as a whole: the page gives it a sheet
//       <g id="petal-3" class="loose fall">…</g>       moves on its own over the layer: shares a sheet
//     </g>
//   </svg>
//
// A layer is a plane in space, given by its inverse depth across the frame, 1/z = c + ax·x + ay·y,
// with x and y in drawing units and z in meters: a flat plane facing the eye has ax = ay = 0, a
// road or a wall running into the distance does not. Under a moving eye that keeps the focus plane
// still, every point moves by (1/focus − 1/z) times the eye's shift, which across a plane is an
// affine map, so the page moves each plane exactly as the eye would see it.

import { readFileSync } from "node:fs";

export type Plane = { c: number; ax: number; ay: number };

// A plane facing the eye at depth z; one through two depths along x, or along y.
export const facing = (z: number): Plane => ({ c: 1 / z, ax: 0, ay: 0 });
export function alongX(x0: number, z0: number, x1: number, z1: number): Plane {
  const ax = (1 / z1 - 1 / z0) / (x1 - x0);
  return { c: 1 / z0 - ax * x0, ax, ay: 0 };
}
export function alongY(y0: number, z0: number, y1: number, z1: number): Plane {
  const ay = (1 / z1 - 1 / z0) / (y1 - y0);
  return { c: 1 / z0 - ay * y0, ax: 0, ay };
}

export type Layer = { name: string; title: string; note?: string; plane: Plane };

const MOTION = readFileSync(new URL("motion.css", import.meta.url), "utf8").trim();
const attr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// A named group: `classes` say how it moves (see motion.css), `style` sets its own custom properties.
export function group(id: string, content: string, { classes = "", style = "" } = {}): string {
  return `<g id="${id}"${classes ? ` class="${classes}"` : ""}${style ? ` style="${style}"` : ""}>${content}</g>`;
}

// Lash lines for a blink (see .lid in motion.css), drawn with no fill and no opacity of their own,
// so they stay unseen wherever the styles do not run.
export const lids = (paths: string[]) => paths.map((d) => `<path class="lid" fill="none" opacity="0" d="${d}"/>`).join("");

// The custom properties of a falling piece (see .fall in motion.css): its center, how far past the
// frame it must go to vanish, the frame's height plus twice that, how long a fall takes, and any of
// the fall's own, such as its sway or spin.
export function fallStyle([cx, cy]: [number, number], reach: number, height: number, dur: number, own: Record<string, string | number> = {}): string {
  const props = { cx: Math.round(cx), cy: Math.round(cy), m: reach, span: height + 2 * reach, dur: `${dur.toFixed(1)}s`, ...own };
  return Object.entries(props)
    .map(([k, v]) => `--${k}:${v}`)
    .join(";");
}

export function layerMarkup({ name, title, note = "", plane }: Layer, parts: string[]): string {
  const p = [plane.c, plane.ax, plane.ay].map((v) => +v.toPrecision(6)).join(" ");
  return `<g id="layer-${name}" class="layer" data-plane="${p}" data-title="${attr(title)}" data-note="${attr(note)}">\n${parts.join("\n")}\n</g>`;
}

export type Drawing = {
  width: number;
  height: number;
  title: string; // what the picture shows, for whoever cannot see it
  focus: number; // meters to the plane that holds still as the eye moves
  motion: string; // the piece's own styles: which group moves how (see motion.css)
  defs: string[];
  layers: string[]; // back to front, each from layerMarkup
};

export function drawingMarkup({ width, height, title, focus, motion, defs, layers }: Drawing): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" data-focus="${focus}">
<title>${attr(title)}</title>
<style><![CDATA[
${MOTION}

${motion.trim()}
]]></style>
<defs>
${defs.filter(Boolean).join("\n")}
</defs>
${layers.join("\n")}
</svg>
`;
}
