// Contour: one drawn line. The silhouette and the few structural lines (where depth or the surface
// breaks), each a stroke of its own weight, tapering at both ends; no fill, no tone.
import { smoothstep } from "../../portraits/pieces/wavy-line-engraving/engrave.ts";
import type { Fields } from "./fields.ts";
import { findLines, strokes } from "./lines.ts";

const INK = "#2a2119";

export function contour(fields: Fields, title: string): string {
  const { width, height } = fields.frame;
  const lines = findLines(fields, 0.005); // no tone here, so the shallower overlaps are drawn too
  const d = strokes(lines, (facing, strength, kind) => {
    const shade = smoothstep(-1.05, 0.9, facing); // 0 toward the light, 1 away from it
    if (kind === "silhouette") return 0.7 * smoothstep(-1.02, -0.8, facing) + 2.1 * shade;
    if (kind === "occlusion") return (0.8 + 1.1 * strength) * (0.7 + 0.5 * shade);
    if (kind === "feature") return 0.35 + 0.9 * strength;
    if (kind === "form") return 0.3 + 0.6 * strength;
    return 0.7;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<title>${title}, a contour sketch</title>
<path fill="${INK}" transform="scale(.25)" d="${d}"/>
</svg>`;
}
