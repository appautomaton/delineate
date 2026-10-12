// The street's trees and furniture, as models placed by eye off gridded crops of their plate
// (wav-tree.png) at 1.9x to 3.5x. Every coordinate is in the full engraving's frame.

import type { Point } from "../../../harness/trace/polygon.ts";

// A lamp: its pole, a bar from `top` down to `foot`, `width` wide; its head, a flat saucer
// centered at `head`, `span` across, with a bright lens under it.
export type Lamp = { top: Point; foot: Point; width: number; head: Point; span: number };
// Lamps behind the wall on the right first, then the three along the left railing, front to back.
export const BACK_LAMPS: Lamp[] = [
  { top: [962, 716], foot: [962, 805], width: 4, head: [958, 712], span: 46 },
  { top: [913, 790], foot: [913, 897], width: 4, head: [901, 789], span: 36 },
];
export const FRONT_LAMPS: Lamp[] = [
  { top: [154, 372], foot: [154, 1030], width: 14, head: [203, 382], span: 86 },
  { top: [366, 624], foot: [366, 860], width: 10, head: [394, 630], span: 72 },
  { top: [479, 755], foot: [479, 925], width: 7, head: [497, 755], span: 50 },
];
// The bases of the front lamps, where they meet the ground.
export const LAMP_BASES: Point[][] = [[[133, 868], [162, 868], [162, 1032], [133, 1032]]];

// Trunks and their main limbs, each a stroke from the ground up and its width; the canopy hides
// the rest.
export const TRUNKS: { line: Point[]; width: number }[] = [
  { line: [[32, 840], [32, 720], [30, 600]], width: 15 },
  { line: [[75, 840], [76, 720], [79, 620]], width: 19 },
  { line: [[200, 845], [203, 720], [207, 655], [184, 600]], width: 14 },
  { line: [[206, 662], [232, 608]], width: 7 },
  { line: [[238, 850], [237, 735], [245, 660], [268, 602]], width: 11 },
  { line: [[237, 740], [212, 766]], width: 5 },
  { line: [[322, 862], [322, 760], [318, 715]], width: 8 },
  { line: [[322, 778], [300, 738]], width: 4 },
  { line: [[322, 768], [346, 730]], width: 4 },
  { line: [[423, 880], [423, 770], [421, 715]], width: 9 },
  { line: [[423, 785], [400, 742]], width: 4 },
  { line: [[423, 775], [450, 735]], width: 4 },
  { line: [[815, 905], [815, 862], [814, 830]], width: 5 },
  { line: [[852, 905], [852, 852], [851, 815]], width: 6 },
];

// Railings: rails (each a line, top rail first) and their posts, each from the rail down to the
// ground.
export const RAILS: Point[][] = [
  [[0, 812], [370, 857]],
  [[0, 848], [124, 862]],
  [[436, 879], [509, 882]],
];
export const POSTS: [Point, Point][] = [
  ...[48, 114, 169, 217, 256, 277, 295, 315, 332, 350, 364].map((x): [Point, Point] => {
    const top = 812 + (45 * x) / 370;
    const ground = x < 160 ? 960 : 981 + ((925 - 981) * (x - 169)) / (364 - 169);
    return [[x, top], [x, ground]];
  }),
  ...[442, 450, 458, 466, 474].map((x): [Point, Point] => [[x, 880], [x, 922]]),
];
// The handrail up the steps on the right, and its posts.
export const HANDRAIL: Point[] = [[1001, 857], [1046, 842], [1176, 755], [1254, 742]];
export const HANDRAIL_POSTS: [Point, Point][] = [
  [[1001, 857], [1001, 985]],
  [[1080, 838], [1080, 990]],
  [[1207, 752], [1207, 900]],
];

// Blocks: planters, the slatted fence behind the left railing, the wall and steps on the right;
// each a face, back to front. A face's top edge, its first two points, is lit.
export const BLOCKS: Point[][] = [
  // Behind the left railing: the slatted fence.
  [[124, 842], [368, 870], [368, 928], [240, 952], [170, 978], [124, 985]],
  // The left planters, back to front.
  [[425, 885], [436, 886], [436, 925], [425, 926]],
  [[378, 891], [425, 893], [425, 930], [378, 932]],
  [[331, 876], [378, 878], [378, 940], [331, 940]],
  [[160, 965], [186, 963], [186, 1000], [160, 1003]],
  [[185, 860], [234, 862], [234, 1000], [185, 1002]],
  [[78, 948], [140, 936], [134, 1028], [78, 1050]],
  [[0, 945], [78, 948], [78, 1050], [0, 1047]],
  // The right: the wall's dark face and its lit end, the planters before it, the steps.
  [[1032, 798], [1254, 790], [1254, 900], [1032, 905]],
  [[959, 802], [1032, 798], [1032, 940], [959, 945]],
  [[867, 918], [940, 928], [940, 975], [869, 958]],
  [[943, 940], [1000, 945], [1000, 1003], [943, 997]],
  [[1100, 893], [1254, 890], [1254, 926], [1100, 930]],
  [[1100, 930], [1254, 926], [1254, 960], [1100, 965]],
  [[1078, 960], [1254, 958], [1254, 995], [1078, 998]],
  [[995, 990], [1254, 1000], [1254, 1060], [995, 1005]],
];
