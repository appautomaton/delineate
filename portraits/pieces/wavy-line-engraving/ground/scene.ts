// The ground's structure, read by eye off gridded crops of its plate at 1.6x to 2x, and drawn as
// models over the paving's lines: the horizon and the slab joints.

import type { Point } from "../../../harness/trace/polygon.ts";
import { STREET_INK } from "../sheet.ts";

// The plaza's far edge, a fine line from the railing to the wall.
export const HORIZON = 923;

// The slab joints, each from its far end to its near one, as the plate lays them: fanning loosely
// toward the horizon, some starting partway down.
export const JOINTS: [Point, Point][] = [
  [[469, 934], [105, 1254]],
  [[533, 934], [315, 1254]],
  [[591, 934], [568, 1254]],
  [[682, 1088], [742, 1254]],
  [[671, 926], [883, 1176]],
  [[734, 926], [1031, 1254]],
  [[726, 930], [1158, 1254]],
  [[900, 1004], [1254, 1224]],
];

const f = (v: number) => (Math.round(v * 10) / 10).toString();

// A stroke that thickens toward the viewer: from `far` px wide at its far end to `near` at its
// near one, its ends square (they meet the horizon or the frame).
function wedge([[ax, ay], [bx, by]]: [Point, Point], far: number, near: number): string {
  const len = Math.hypot(bx - ax, by - ay);
  const [nx, ny] = [-(by - ay) / len, (bx - ax) / len];
  const pts: Point[] = [
    [ax + (nx * far) / 2, ay + (ny * far) / 2],
    [bx + (nx * near) / 2, by + (ny * near) / 2],
    [bx - (nx * near) / 2, by - (ny * near) / 2],
    [ax - (nx * far) / 2, ay - (ny * far) / 2],
  ];
  return "M" + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L") + "Z";
}

// The joints and the horizon.
export function structures(joints: [Point, Point][]): string {
  // A joint's width follows its depth: fine at the horizon, about 2 px at the frame's foot.
  const at = (y: number) => 0.7 + 1.3 * Math.min(1, Math.max(0, (y - HORIZON) / (1254 - HORIZON)));
  const d = joints.map((j) => wedge(j, at(j[0][1]), at(j[1][1]))).join("");
  const horizon = wedge([[362, HORIZON], [957, HORIZON]], 1.2, 1.2) + wedge([[795, 875], [822, 875]], 0.9, 0.9);
  return `<path fill="${STREET_INK}" d="${d}${horizon}"/>`;
}
