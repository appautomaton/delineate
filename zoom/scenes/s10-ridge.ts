// S10: Great Wall Ridge, 5-Layer Atmospheric Celadon Peaks, Tiled Beacon Watchtower & Stipple Pines
// Stage-5 `5x` Micro-Craft Overhaul (`PathBatcher` + `stippleTreeCluster`, `portal: (1550, 570)`):
//   - Vast breathing warm cream-paper sky (`PAL.paper`) with gliding V-birds (`data-anim="drift"`).
//   - FIVE atmospheric depth planes of layered blue-celadon & sunlit dry-brush limestone mountain ranges,
//     plus a delicate winding eastern mountain spur Great Wall with miniature crenellations & 4 beacon towers.
//   - Individually coursed perspective stone paving slabs, stepped stairs, ashlar wall courses, capped
//     crenellations, diagonal dry-brush ochre scree & 12 tiny 2-tone human travelers casting long shadows.
//   - 5-tone `@devteamdrew` `stippleTreeCluster` olive-pine groves with peeking crooked trunks/twigs &
//     3 localized autumn terracotta-maple clusters (zero stray chips near arch sill!).
//   - Sunlit warm-limestone vs cool-slate shadowed Beacon Watchtower (`敌楼`) with 160+ individually
//     coursed ashlar stones, swept dark-slate tiled upper pavilion roof eaves (`歇山飞檐`), glowing
//     embrasures, beacon brazier & stone vaulted archway opening seamlessly onto S11's Li River gorge!

import {
  PAL,
  Painter,
  PathBatcher,
  archDoorwayHole,
  circlePath,
  closedSmooth,
  cubic,
  ellipsePath,
  f,
  lerp,
  openPoly,
  polyPath,
  quad,
  rand,
  sample,
  stippleTreeCluster,
  type Pt,
  type StippleTreeSpec,
} from "../kit.ts";
import {
  BLEED,
  requiredPortalClearBox,
  requiredPortalSealBox,
  validatePortalHole,
  type OctaveScene,
  type PortalSpec,
} from "./types.ts";

export const S10_PORTAL: PortalSpec = { cx: 1550, cy: 570, rx: 140, ry: 112 };
const S11_NEXT_PORTAL: readonly [number, number] = [860, 950];

/** Builds one ragged, outline-free dry-brush gouache streak along a curved/sloped span. */
function brushStreak(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  h0: number,
  h1: number,
  r: () => number,
): string {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const segs = 3;
  const top: Pt[] = [];
  const bot: Pt[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const bx = x0 + dx * t;
    const by = y0 + dy * t;
    const taper = i === 0 || i === segs ? 0.24 : 1;
    const hh = (h0 + (h1 - h0) * t) * taper * rand(r, 0.72, 1.24);
    top.push([bx + nx * hh, by + ny * hh]);
    bot.push([bx - nx * hh * rand(r, 0.65, 1.15), by - ny * hh * rand(r, 0.65, 1.15)]);
  }
  return polyPath([...top, ...bot.reverse()]);
}

export function buildS10Ridge(): OctaveScene {
  const p = new Painter("s10", 5910);

  // Scale-6 off-center portal geometry: poised Great Wall beacon watchtower gateway arch!
  const clearBox = requiredPortalClearBox(S10_PORTAL, S11_NEXT_PORTAL);
  const sealBox = requiredPortalSealBox(S10_PORTAL);
  const hole = archDoorwayHole(clearBox, {
    padL: 16,
    padR: 16,
    padTop: 14,
    padBot: 14,
    archRise: 48,
    pointed: false,
    sealBox,
  });
  validatePortalHole("s10-ridge", hole, S10_PORTAL, S11_NEXT_PORTAL);

  const archXL = hole[0][0]; // ~1393
  const archXR = hole[20][0]; // ~1661
  const archMidX = (archXL + archXR) * 0.5; // ~1527
  const archSpringY = hole[0][1]; // ~496
  const archApexY = hole[10][1]; // ~448
  const archBotY = hole[21][1]; // ~674
  const archHalfW = (archXR - archXL) * 0.5; // ~134
  const archRise = archSpringY - archApexY; // ~48

  // ---------- Gradients (5 atmospheric blue-celadon mountain planes + warm paper sky!) ----------
  const skyGrad = p.linearGrad("sky", 0, BLEED.y0, 0, BLEED.y1, [
    [0, PAL.paper],
    [0.54, PAL.paper],
    [0.86, PAL.paperWarm],
    [1, PAL.paperWarm],
  ]);
  const range1Grad = p.linearGrad("rng1", 0, 195, 0, 620, [
    [0, PAL.celadonLt, 0.42],
    [0.52, PAL.celadonLt, 0.18],
    [1, PAL.paper, 0],
  ]);
  const range2Grad = p.linearGrad("rng2", 0, 290, 0, 740, [
    [0, PAL.celadon, 0.36],
    [0.55, PAL.sageLt, 0.18],
    [1, PAL.paper, 0],
  ]);
  const range3Grad = p.linearGrad("rng3", 0, 240, 0, 920, [
    [0, PAL.celadonLt, 0.46],
    [0.44, PAL.paperShadow, 0.22],
    [0.82, PAL.paper, 0],
    [1, PAL.paper, 0],
  ]);
  const wallSunGrad = p.linearGrad("wallsun", 1320, 395, 1715, 710, [
    [0, PAL.ochreLt],
    [0.48, PAL.paperStone],
    [1, PAL.ochre],
  ]);
  const wallShadeGrad = p.linearGrad("wallshade", 1715, 405, 1845, 725, [
    [0, PAL.slateLt],
    [0.45, PAL.slate],
    [1, PAL.prussian],
  ]);
  const eaveRoofGrad = p.linearGrad("eaveroof", 1330, 305, 1825, 398, [
    [0, PAL.slateLt],
    [0.45, PAL.slate],
    [1, PAL.prussianDk],
  ]);
  const walkwayGrad = p.linearGrad("walk", 200, 1620, 1340, 660, [
    [0, PAL.paperWarm],
    [0.5, PAL.ochreLt],
    [1, PAL.paperStone],
  ]);
  const beaconGlow = p.radialGrad("beacon", 1356, 378, 145, [
    [0, PAL.lanternCore, 0.9],
    [0.35, PAL.lantern, 0.44],
    [0.75, PAL.lanternHalo, 0.12],
    [1, PAL.lanternHalo, 0],
  ]);

  // 1. Vast breathing warm cream-paper sky (Day) / serene midnight indigo (Night)
  p.asymmetricPortalBackdrop(hole, skyGrad, { smooth: false });

  p.clippedToBackdrop(
    hole,
    () => {
      // =========================================================================
      // LAYER A: VAST BREATHING SKY, NOCTURNAL MOON/STARS & GLIDING V-BIRDS
      // =========================================================================
      p.layer("var(--z-star-op)", () => {
        let starsD = "";
        for (let i = 0; i < 72; i++) {
          starsD += `M${f(rand(p.r, -120, 2520))} ${f(rand(p.r, -160, 440))}h0.22`;
        }
        p.burinContour(starsD, PAL.inkRim, 1.35, 0.88, 72);
        p.fillPath(circlePath(485, 185, 42), PAL.lanternCore, 0.88);
        p.fillPath(circlePath(502, 175, 38), PAL.paper, 0.98);
      });

      p.animGroup({ kind: "drift", ampX: 36, ampY: -8, freq: 0.44, phase: 0.2 }, () => {
        const birds: readonly [number, number, number][] = [
          [1140, 186, 1.05],
          [1228, 218, 0.88],
          [1086, 212, 0.72],
          [2065, 164, 0.78],
          [2122, 182, 0.62],
        ];
        let birdD = "";
        for (const [bx, by, sc] of birds) {
          birdD +=
            `M${f(bx - 16 * sc)} ${f(by + 2 * sc)}` +
            `Q${f(bx - 7 * sc)} ${f(by - 6 * sc)} ${f(bx)} ${f(by + 2 * sc)}` +
            `Q${f(bx + 8 * sc)} ${f(by - 7 * sc)} ${f(bx + 17 * sc)} ${f(by + 1 * sc)}` +
            `Q${f(bx + 8 * sc)} ${f(by - 2.5 * sc)} ${f(bx)} ${f(by + 5 * sc)}` +
            `Q${f(bx - 7 * sc)} ${f(by - 2 * sc)} ${f(bx - 16 * sc)} ${f(by + 2 * sc)}Z`;
        }
        p.fillPath(birdD, PAL.inkSepia, 0.84);
      });

      // =========================================================================
      // LAYER B: FIVE ATMOSPHERIC DEPTH PLANES OF UNDULATING CELADON & DRY-BRUSH RANGES!
      // Smooth multi-point `closedSmooth` rolling ridges (ZERO ruler-straight sawtooth triangles!)
      // =========================================================================
      // DEPTH PLANE 1 (Far pale-celadon rolling mountain horizon dissolving softly into sky)
      const range1Crest: Pt[] = [
        [BLEED.x0, 535], [-160, 492], [20, 448], [210, 466], [420, 398], [630, 412],
        [860, 342], [1090, 362], [1340, 286], [1590, 304], [1860, 236], [2130, 268],
        [2420, 232], [BLEED.x1, 295],
      ];
      p.fillPath(
        openPoly(range1Crest).replace(/^M/, "M")
          ? closedSmooth([...range1Crest, [BLEED.x1, 640], [BLEED.x0, 640]])
          : "",
        range1Grad,
        0.92,
      );

      // DEPTH PLANE 2 (Mid-far softly undulating blue-sage ridge spurs dissolving into mist)
      const range2Crest: Pt[] = [
        [BLEED.x0, 642], [-120, 594], [80, 548], [275, 562], [490, 496], [715, 512],
        [940, 438], [1180, 452], [1440, 362], [1710, 378], [1965, 308], [2235, 342],
        [2490, 314], [BLEED.x1, 385],
      ];
      p.fillPath(closedSmooth([...range2Crest, [BLEED.x1, 750], [BLEED.x0, 750]]), range2Grad, 0.92);

      // DEPTH PLANE 3 (Main sweeping dragon-back limestone mountain crest behind the watchtower!)
      const ridgeCrest = (x: number): number => {
        if (x < 1820) {
          const u = Math.max(0, (x + 280) / 2100);
          return 720 - 455 * Math.pow(Math.sin(u * Math.PI * 0.5), 1.25) - 20 * Math.sin(u * 11.5);
        }
        const u = (x - 1820) / 960;
        return 265 + 148 * Math.pow(u, 1.22) - 18 * Math.sin(u * 8.5);
      };
      const mtnPts: Pt[] = [];
      for (let x = BLEED.x0; x <= BLEED.x1; x += 64) mtnPts.push([x, ridgeCrest(x)]);
      mtnPts.push([BLEED.x1, 960], [BLEED.x0, 960]);
      p.fillPath(polyPath(mtnPts), range3Grad, 0.94);

      // Hundreds of crisp broken outline-free dry-brush limestone slope streaks (`PathBatcher`!)
      const slopeB = new PathBatcher();
      for (let i = 0; i < 165; i++) {
        const x = rand(p.r, -260, 1740);
        const crestY = ridgeCrest(x);
        const depth = Math.pow(p.r(), 0.78) * 355;
        const y = crestY + depth;
        const len = rand(p.r, 42, 170) * (0.65 + 0.55 * (1 - depth / 355));
        const slope = rand(p.r, -0.22, -0.06);
        const h = rand(p.r, 2.0, 5.8) * (1 - depth / 460);
        const d = brushStreak(x, y, x + len, y + len * slope, h, h * 0.72, p.r);
        if (depth < 52) slopeB.addPath("deep", d, { fill: PAL.sage, fillOpacity: 0.56 });
        else if (depth < 175) slopeB.addPath("mid", d, { fill: PAL.celadon, fillOpacity: 0.44 });
        else slopeB.addPath("lt", d, { fill: PAL.paperShadow, fillOpacity: 0.46 });
      }
      for (let i = 0; i < 165; i++) {
        const x = rand(p.r, 1760, 2720);
        const crestY = ridgeCrest(x);
        const depth = Math.pow(p.r(), 0.78) * 580;
        const y = crestY + depth;
        const len = rand(p.r, 44, 170);
        const slope = rand(p.r, 0.28, 0.56);
        const h = rand(p.r, 2.2, 7.2);
        const d = brushStreak(x, y, x + len, y + len * slope, h, h * 0.75, p.r);
        if (p.r() < 0.36) slopeB.addPath("deep", d, { fill: PAL.sage, fillOpacity: 0.58 });
        else if (p.r() < 0.75) slopeB.addPath("mid", d, { fill: PAL.celadon, fillOpacity: 0.46 });
        else slopeB.addPath("lt", d, { fill: PAL.paperShadow, fillOpacity: 0.48 });
      }
      slopeB.flush(p);

      // Tiny dark olive dry-brush scrub tufts dotting the mountain crest skyline
      const crestScrub: StippleTreeSpec[] = [];
      for (let x = 20; x <= 2540; x += rand(p.r, 98, 175)) {
        crestScrub.push({ cx: x, cy: ridgeCrest(x) + rand(p.r, -4, 14), rx: rand(p.r, 18, 40), ry: rand(p.r, 9, 18), density: 0.35 });
      }
      stippleTreeCluster(p, p.r, crestScrub, { dabSize: 5.0, groundShadow: false });

      // Distant thin winding eastern Great Wall spur with miniature crenellations & 4 sunlit/shadowed beacon blockhouses!
      const farSpurLow = sample(cubic([1825, 678], [1985, 705], [2145, 650], [2315, 645]), 18);
      const farSpurClimb = sample(cubic([2295, 645], [2235, 515], [2125, 415], [2178, 308]), 20);
      const spurB = new PathBatcher();
      for (const seg of [farSpurLow, farSpurClimb]) {
        const sTop = seg.map(([x, y]): Pt => [x, y - 10]);
        const sBot = seg.map(([x, y]): Pt => [x, y + 4]).reverse();
        spurB.addPath("wall", polyPath([...sTop, ...sBot]), { fill: PAL.ochreLt, fillOpacity: 0.92 });
        spurB.addPath("shade", polyPath([...seg.map(([x, y]): Pt => [x, y - 3]), ...sBot]), { fill: PAL.paperShadow, fillOpacity: 0.78 });
        // Miniature crenulated merlon teeth along the distant eastern spur!
        for (let i = 0; i < seg.length - 1; i++) {
          const [mx, my] = seg[i];
          spurB.rect("merlon", mx - 2, my - 13.5, 4, 4, { fill: PAL.paperWarm, fillOpacity: 0.92 });
        }
      }
      const farCrest = sample(quad([1955, 315], [2180, 304], [2540, 326]), 14);
      p.pressuredRibbon(farCrest, 5.8, PAL.ochreLt, 0.86, 0.2);
      for (const [tx, ty, tw, th] of [
        [1955, 652, 34, 42],
        [2045, 648, 30, 38],
        [2185, 636, 26, 32],
        [2310, 622, 24, 30],
      ] as const) {
        spurB.rect("wall", tx, ty, tw, th, { fill: PAL.ochreLt, fillOpacity: 0.96 });
        spurB.quad("side", [tx + tw, ty + 2], [tx + tw + tw * 0.45, ty + 5], [tx + tw + tw * 0.45, ty + th + 2], [tx + tw, ty + th], { fill: PAL.slate, fillOpacity: 0.94 });
        spurB.rect("door", tx + tw * 0.34, ty + th * 0.44, tw * 0.32, th * 0.56, { fill: PAL.prussianDk, fillOpacity: 0.88 });
      }
      spurB.flush(p);

      // Soft drifting valley mist weaving gently between distant ranges
      p.animGroup({ kind: "drift", ampX: 46, ampY: 4, freq: 0.32, phase: 1.1 }, () => {
        p.fillPath(closedSmooth([[-140, 748], [260, 714], [720, 744], [1040, 780], [660, 830], [200, 822], [-160, 812]]), PAL.paper, 0.36);
      });

      // =========================================================================
      // LAYER C: BEACON WATCHTOWER (`敌楼`) WITH COURSED ASHLAR MASONRY & SWEPT
      // TILED PAVILION ROOF EAVES (`歇山飞檐箭楼`) FRAMING S11!
      // =========================================================================
      const twL = 1326;
      const twFrontR = 1716;
      const twSideR = 1838;
      const twTopY = 406;
      const twBotY = 708;

      // 0. Traditional Dark-Slate Tiled Upper Watchtower Pavilion Roof (`敌楼箭楼飞檐`, `#183`!)
      // Perched cleanly behind the crenellated stone parapet (`y = 308..396`)!
      const pavWallL = 1384;
      const pavWallR = 1692;
      const pavSideR = 1782;
      const pavB = new PathBatcher();
      // Upper timber-and-brick watch chamber behind parapet
      pavB.rect("chFront", pavWallL, 356, pavWallR - pavWallL, 48, { fill: PAL.ochre, fillOpacity: 0.94 });
      pavB.quad("chSide", [pavWallR, 356], [pavSideR, 368], [pavSideR, 412], [pavWallR, 404], { fill: PAL.slate, fillOpacity: 0.96 });
      // Upper watch-chamber glowing arched embrasures & red cedar corner columns
      for (const cx of [1394, 1472, 1546, 1620, 1682]) {
        pavB.rect("col", cx - 3, 356, 6, 46, { fill: PAL.cinnabarDk, fillOpacity: 0.94 });
      }
      for (const wx of [1416, 1492, 1568, 1638]) {
        pavB.rect("win", wx, 364, 24, 22, { fill: PAL.prussianDk, fillOpacity: 0.9 });
        pavB.rect("winLit", wx + 2, 366, 20, 18, { fill: PAL.windowLit, fillOpacity: "var(--z-halo-op)" });
      }
      // Tiered wooden `dougong` eave soffit brackets under the swept roof
      pavB.rect("soffit", 1364, 350, 344, 10, { fill: PAL.umberDk, fillOpacity: 0.96 });
      for (let bx = 1378; bx <= 1696; bx += 22) {
        pavB.rect("dougong", bx, 354, 10, 6, { fill: PAL.ochreDk, fillOpacity: 0.94 });
      }
      pavB.flush(p);

      // Sweeping upturned dark-slate hip-and-gable tile roof (`歇山顶飞檐`) with individual scalloped tiles!
      const rSpanL = 1352;
      const rSpanR = 1796;
      const rRidgeY = 304;
      const rEaveY = 354;
      const roofTopL = sample(quad([1435, rRidgeY], [1388, rEaveY - 8], [rSpanL - 18, rEaveY - 14]), 8);
      const roofTopR = sample(quad([1708, rRidgeY], [1752, rEaveY - 4], [rSpanR + 18, rEaveY - 4]), 8);
      const roofBot = sample(cubic([rSpanR + 18, rEaveY + 6], [1660, rEaveY + 12], [1465, rEaveY + 10], [rSpanL - 18, rEaveY - 4]), 14);
      const roofPoly: Pt[] = [...roofTopL.slice().reverse(), [1708, rRidgeY], ...roofTopR.slice(1), ...roofBot];
      p.fillPath(polyPath(roofPoly), eaveRoofGrad, 0.99);
      p.scallopedRoofTiles(roofPoly, 16, 10, PAL.ink, 0.56);
      // Carved roof ridge beam & twin ceramic finials (`吻兽`)
      p.fillPath(polyPath([[1430, rRidgeY - 6], [1714, rRidgeY - 6], [1710, rRidgeY + 3], [1434, rRidgeY + 3]]), PAL.slateDk, 0.98);
      p.fillPath(polyPath([[1424, rRidgeY - 14], [1436, rRidgeY - 6], [1432, rRidgeY + 2], [1422, rRidgeY - 2]]), PAL.ochre, 0.94);
      p.fillPath(polyPath([[1720, rRidgeY - 14], [1708, rRidgeY - 6], [1712, rRidgeY + 2], [1722, rRidgeY - 2]]), PAL.ochre, 0.94);
      p.burinContour(openPoly(roofTopL) + openPoly(roofTopR), PAL.litEdge, 0.68, 0.76, 2);
      p.burinContour(openPoly(roofBot), PAL.ink, 0.78, 0.84, 1);

      // 1. Sunlit Front Limestone Watchtower Wall (`160+` individually coursed ashlar stones via `PathBatcher`!)
      const frontWall: Pt[] = [[twL + 8, twTopY], [twFrontR, twTopY], [twFrontR, twBotY], [twL - 6, twBotY]];
      p.fillPath(polyPath(frontWall), wallSunGrad, 0.99);

      const twB = new PathBatcher();
      for (let row = 0; row < 13; row++) {
        const y0 = twTopY + 8 + row * 23;
        const y1 = Math.min(twBotY, y0 + 21.5);
        if (y0 > twBotY - 4) break;
        twB.line("mortar", twL + 4, y0, twFrontR - 2, y0, { stroke: PAL.inkHair, strokeWidth: 0.36, strokeOpacity: 0.4, nonScaling: "hatch" });
        let bx = twL + 6 + (row % 2) * 20;
        while (bx < twFrontR - 14) {
          const bw = rand(p.r, 24, 48);
          const bx1 = Math.min(twFrontR - 2, bx + bw);
          // Populate ALL masonry courses including the lower watchtower plinth beneath archBotY (`y = 674..710`)!
          const insideArch = bx1 > archXL + 4 && bx < archXR - 4 && y1 > archApexY + 6 && y0 < archBotY - 2;
          if (!insideArch) {
            const roll = p.r();
            if (roll < 0.34) twB.rect("blkLt", bx + 0.8, y0 + 0.8, bx1 - bx - 1.6, y1 - y0 - 1.2, { fill: PAL.paperWarm, fillOpacity: 0.34 });
            else if (roll < 0.64) twB.rect("blkWarm", bx + 0.8, y0 + 0.8, bx1 - bx - 1.6, y1 - y0 - 1.2, { fill: PAL.ochre, fillOpacity: 0.22 });
            else twB.rect("blkSh", bx + 0.8, y0 + 0.8, bx1 - bx - 1.6, y1 - y0 - 1.2, { fill: PAL.paperShadow, fillOpacity: 0.24 });
            twB.line("mortar", bx, y0, bx, y1, { stroke: PAL.inkHair, strokeWidth: 0.34, strokeOpacity: 0.36, nonScaling: "hatch" });
          }
          bx = bx1;
        }
      }
      // Weathered dry-brush limestone streaks & plinth shadow band along lower watchtower base (`y = 668..710`, `#197`!)
      for (let i = 0; i < 24; i++) {
        const px = rand(p.r, twL + 8, twFrontR - 46);
        const py = rand(p.r, archBotY + 3, twBotY - 4);
        twB.addPath("plinthDab", brushStreak(px, py, px + rand(p.r, 22, 54), py + rand(p.r, -1.5, 1.5), 2.4, 1.5, p.r), {
          fill: i % 2 === 0 ? PAL.umberLt : PAL.paperShadow,
          fillOpacity: 0.32,
        });
      }

      // 2. Cool Blue-Slate Shadowed Eastern Return Flank (`x = 1716..1838`) with coursed ashlar stone shading
      twB.quad("sideWall", [twFrontR, twTopY], [twSideR - 4, twTopY + 18], [twSideR + 8, twBotY + 12], [twFrontR, twBotY], { fill: wallShadeGrad, fillOpacity: 0.99 });
      for (let row = 0; row < 12; row++) {
        const v0 = row / 12;
        const v1 = (row + 0.92) / 12;
        const pA = lerp([twFrontR, twTopY], [twFrontR, twBotY], v0);
        const pB = lerp([twSideR - 4, twTopY + 18], [twSideR + 8, twBotY + 12], v0);
        twB.line("sMortar", pA[0], pA[1], pB[0], pB[1], { stroke: PAL.prussianDk, strokeWidth: 0.36, strokeOpacity: 0.42, nonScaling: "hatch" });
        for (let k = 0; k < 3; k++) {
          if (p.r() < 0.56) {
            const u0 = k * 0.33 + 0.03;
            const u1 = u0 + 0.26;
            const q0 = lerp(pA, pB, u0);
            const q1 = lerp(pA, pB, u1);
            const pA2 = lerp([twFrontR, twTopY], [twFrontR, twBotY], v1);
            const pB2 = lerp([twSideR - 4, twTopY + 18], [twSideR + 8, twBotY + 12], v1);
            twB.quad("sBlk", q0, q1, lerp(pA2, pB2, u1), lerp(pA2, pB2, u0), { fill: PAL.prussianDk, fillOpacity: 0.26 });
          }
        }
      }
      // Cornice band molding + projecting weathered limestone merlon cap slabs
      twB.rect("cornSun", twL + 2, twTopY - 6, twFrontR - twL, 12, { fill: PAL.ochreLt, fillOpacity: 0.96 });
      twB.quad("cornSh", [twFrontR, twTopY - 6], [twSideR - 2, twTopY + 12], [twSideR - 2, twTopY + 24], [twFrontR, twTopY + 6], { fill: PAL.slateDk, fillOpacity: 0.88 });

      const mCount = 7;
      const mSpan = (twFrontR - twL - 14) / mCount;
      for (let i = 0; i < mCount; i++) {
        const mx0 = twL + 8 + i * mSpan;
        const mw = mSpan * 0.64;
        const mh = 28;
        twB.rect("merSun", mx0, twTopY - mh, mw, mh - 4, { fill: PAL.ochreLt, fillOpacity: 0.98 });
        twB.rect("merCap", mx0 - 2.5, twTopY - mh - 4, mw + 5, 5, { fill: PAL.paperWarm, fillOpacity: 0.96 });
        twB.quad("merRet", [mx0 + mw, twTopY - mh], [mx0 + mw + 6, twTopY - mh + 3], [mx0 + mw + 6, twTopY - 4], [mx0 + mw, twTopY - 4], { fill: PAL.slate, fillOpacity: 0.84 });
        twB.rect("merSlit", mx0 + mw * 0.42, twTopY - 17, mw * 0.16, 9, { fill: PAL.prussianDk, fillOpacity: 0.9 });
      }
      for (let i = 0; i < 3; i++) {
        const u0 = i / 3 + 0.05;
        const u1 = u0 + 0.2;
        const b0 = lerp([twFrontR, twTopY - 4], [twSideR - 3, twTopY + 14], u0);
        const b1 = lerp([twFrontR, twTopY - 4], [twSideR - 3, twTopY + 14], u1);
        twB.quad("merSide", [b0[0], b0[1] - 26], [b1[0], b1[1] - 26], b1, b0, { fill: PAL.slate, fillOpacity: 0.96 });
      }

      // Harmonious sunlit limestone arch voussoirs + recessed barrel-vault jamb
      const vCount = 17;
      const vDepth = 24;
      for (let i = 0; i < vCount; i++) {
        const a0 = Math.PI + (i / vCount) * Math.PI;
        const a1 = Math.PI + ((i + 1) / vCount) * Math.PI;
        const in0: Pt = [archMidX + Math.cos(a0) * archHalfW, archSpringY + Math.sin(a0) * archRise];
        const in1: Pt = [archMidX + Math.cos(a1) * archHalfW, archSpringY + Math.sin(a1) * archRise];
        const out0: Pt = [archMidX + Math.cos(a0) * (archHalfW + vDepth), archSpringY + Math.sin(a0) * (archRise + vDepth * 0.82)];
        const out1: Pt = [archMidX + Math.cos(a1) * (archHalfW + vDepth), archSpringY + Math.sin(a1) * (archRise + vDepth * 0.82)];
        if (i > vCount * 0.72) twB.quad("vSh", in0, out0, out1, in1, { fill: PAL.slate, fillOpacity: 0.8 });
        else if (i % 2 === 0) twB.quad("vLt", in0, out0, out1, in1, { fill: PAL.ochreLt, fillOpacity: 0.96 });
        else twB.quad("vMid", in0, out0, out1, in1, { fill: PAL.ochre, fillOpacity: 0.64 });
        twB.line("mortar", in0[0], in0[1], out0[0], out0[1], { stroke: PAL.umberLt, strokeWidth: 0.4, strokeOpacity: 0.44, nonScaling: "hatch" });
      }
      twB.quad("jambSh", [archXR, archSpringY], [archXR + 18, archSpringY - 5], [archXR + 18, archBotY + 12], [archXR, archBotY + 12], { fill: PAL.slate, fillOpacity: 0.56 });
      twB.rect("jambLt", archXL - 20, archSpringY, 20, archBotY + 12 - archSpringY, { fill: PAL.ochreLt, fillOpacity: 0.54 });
      twB.flush(p);

      // Flanking Watchtower Arched Embrasure Windows with Recessed Depth Reveals & Night Torchlight
      for (const [wx, wy, ww, wh, isSide] of [
        [1346, 522, 22, 42, false],
        [1682, 522, 22, 42, false],
        [1748, 528, 20, 38, true],
        [1792, 535, 19, 36, true],
      ] as const) {
        const r = ww * 0.5;
        const aw = `M${wx} ${wy + wh}V${wy + r}A${r} ${r} 0 0 1 ${wx + ww} ${wy + r}V${wy + wh}Z`;
        const awOuter = `M${wx - 3} ${wy + wh + 2}V${wy + r}A${r + 3} ${r + 3} 0 0 1 ${wx + ww + 3} ${wy + r}V${wy + wh + 2}Z`;
        p.fillPath(awOuter, isSide ? PAL.slateDk : PAL.paperShadow, 0.82);
        p.fillPath(aw, isSide ? PAL.cut : PAL.prussianDk, 0.88);
        p.fillPath(`M${wx + ww - 4.5} ${wy + wh}V${wy + r}A${r} ${r} 0 0 0 ${wx + ww - 8} ${wy + 2.5}L${wx + ww} ${wy + r}V${wy + wh}Z`, isSide ? PAL.slate : PAL.slateLt, 0.45);
        p.fillPath(polyPath([[wx - 4, wy + wh], [wx + ww + 4, wy + wh], [wx + ww + 4, wy + wh + 5], [wx - 4, wy + wh + 5]]), isSide ? PAL.slateDk : PAL.paperWarm, 0.92);
        p.layer("var(--z-halo-op)", () => {
          p.fillPath(aw, PAL.windowLit, 0.92);
          p.fillPath(ellipsePath(wx + ww * 0.5, wy + wh * 0.62, ww * 0.34, wh * 0.26), PAL.lanternCore, 0.86);
        });
      }

      // Iron Signal Beacon Brazier & Fluttering Cinnabar Banner Pennant
      p.fillPath(polyPath([[1342, 376], [1370, 376], [1364, 390], [1348, 390]]), PAL.slateDk, 0.96);
      p.layer("var(--z-halo-op)", () => {
        p.animGroup({ kind: "pulse", baseOp: 0.82, ampOp: 0.18, freq: 2.6, phase: 0.3 }, () => {
          p.fillPath(circlePath(1356, 378, 145), beaconGlow, 0.88);
          p.fillPath(closedSmooth([[1347, 376], [1353, 356], [1359, 362], [1365, 376]]), PAL.lanternCore, 0.96);
        });
      });
      p.burinContour(`M1332 404V332`, PAL.inkSepia, 0.9, 0.85, 1);
      p.animGroup({ kind: "sway", cx: 1332, cy: 342, ampDeg: 6.5, freq: 1.75, phase: 0.4 }, () => {
        p.fillPath(closedSmooth([[1332, 336], [1374, 344], [1400, 338], [1370, 358], [1332, 354]]), PAL.cinnabar, 0.92);
      });
      p.moonRim([[twL + 8, twTopY], [twFrontR, twTopY]], { closed: false, up: true, widthPx: 0.82 });
      p.flush();

      // =========================================================================
      // LAYER D: INDIVIDUALLY COURSED GREAT WALL WITH PAVING STONES, STEPS & SCREE!
      // =========================================================================
      const r1Outer = sample(cubic([840, 1720], [685, 1455], [475, 1285], [295, 1145]), 28);
      const r1Inner = sample(cubic([435, 1720], [310, 1485], [175, 1325], [122, 1185]), 28);
      const r2Outer = sample(cubic([122, 1185], [485, 1020], [875, 745], [1338, 635]), 34);
      const r2Inner = sample(cubic([295, 1145], [635, 1015], [965, 795], [1338, 682]), 34);

      const wallB = new PathBatcher();
      // 1. Unified Warm Ochre-Limestone Outer Flank (`_2_thumb.jpg` — ZERO checkerboard blocks!)
      const r2CliffBot = r2Inner.map(([x, y], i): Pt => [x, y + 115 - (i / 34) * 44]);
      wallB.addPath("r2Face", polyPath([...r2Inner, ...r2CliffBot.slice().reverse()]), { fill: PAL.ochreLt, fillOpacity: 0.92 });
      wallB.addPath("r2Shade", polyPath([...r2Inner, ...r2CliffBot.slice().reverse()]), { fill: PAL.ochre, fillOpacity: 0.34 });
      // Hairline 0.34px ashlar courses + subtle <= 0.11 weathered dry-brush stone streaks along outer wall
      for (let row = 1; row < 5; row++) {
        const v = row / 5;
        const cPts = r2Inner.map((pt, idx): Pt => lerp(pt, r2CliffBot[idx], v));
        wallB.addPath("r2Mortar", openPoly(cPts), { stroke: PAL.umberLt, strokeWidth: 0.34, strokeOpacity: 0.28, nonScaling: "hatch" });
      }
      for (let i = 0; i < 32; i++) {
        const idx = Math.floor(rand(p.r, 1, r2Inner.length - 3));
        const v = rand(p.r, 0.12, 0.85);
        const a = lerp(r2Inner[idx], r2CliffBot[idx], v);
        const c = lerp(r2Inner[idx + 2], r2CliffBot[idx + 2], v);
        wallB.addPath("r2Streak", brushStreak(a[0], a[1], c[0], c[1], 3.2, 2.0, p.r), {
          fill: i % 2 === 0 ? PAL.paperWarm : PAL.umberLt,
          fillOpacity: 0.11,
        });
      }

      // 2. Generous Diagonal Dry-Brush Scree feathering battered left wall (`r1Inner`) into cream paper (`_2_thumb.jpg`!)
      for (let i = 0; i < 165; i++) {
        const idx = Math.floor(rand(p.r, 0, r1Inner.length - 1));
        const base = r1Inner[idx];
        const depth = Math.pow(p.r(), 0.72) * 245;
        const sx = base[0] - depth * 0.94 + rand(p.r, -24, 28);
        const sy = base[1] + depth * 0.52 + rand(p.r, -12, 22);
        const len = rand(p.r, 34, 128) * (0.6 + 0.5 * (1 - depth / 260));
        const dStr = brushStreak(sx, sy, sx + len * 0.86, sy + len * 0.44, rand(p.r, 2.8, 8.2), rand(p.r, 1.8, 5.2), p.r);
        if (depth < 72 && p.r() < 0.52) wallB.addPath("screeDk", dStr, { fill: PAL.umberLt, fillOpacity: 0.52 });
        else if (p.r() < 0.56) wallB.addPath("screeWm", dStr, { fill: PAL.ochre, fillOpacity: 0.56 });
        else wallB.addPath("screeLt", dStr, { fill: PAL.paperShadow, fillOpacity: 0.5 });
      }
      wallB.flush(p);

      // 3. Broad Perspective Sunlit Stone Walkways — unified warm limestone wash with delicate <=0.12 flagstone nuance!
      p.fillPath(polyPath([...r2Outer, ...r2Inner.slice().reverse()]), walkwayGrad, 0.99);
      p.fillPath(polyPath([...r1Inner, ...r1Outer.slice().reverse()]), walkwayGrad, 0.99);

      const paveB = new PathBatcher();
      for (let i = 0; i < r2Outer.length - 1; i++) {
        const a = lerp(r2Outer[i], r2Inner[i], rand(p.r, 0.04, 0.14));
        const c = lerp(r2Outer[i], r2Inner[i], rand(p.r, 0.84, 0.96));
        paveB.line("riser", a[0], a[1], c[0], c[1], { stroke: PAL.umberLt, strokeWidth: 0.36, strokeOpacity: 0.34, nonScaling: "hatch" });
        if (i % 2 === 0) {
          const s0 = lerp(r2Outer[i], r2Inner[i], rand(p.r, 0.12, 0.45));
          const s1 = lerp(r2Outer[i], r2Inner[i], rand(p.r, 0.55, 0.88));
          paveB.addPath("paveDab", brushStreak(s0[0], s0[1], s1[0], s1[1], 2.2, 1.5, p.r), {
            fill: PAL.paperShadow,
            fillOpacity: 0.12,
          });
        }
      }
      for (let i = 0; i < r1Inner.length - 1; i++) {
        // Subtle hairline stone course ticks + painterly <= 0.12 weathered sandstone streaks (NO checkerboard!)
        const m0 = lerp(r1Inner[i], r1Outer[i], rand(p.r, 0.05, 0.18));
        const m1 = lerp(r1Inner[i], r1Outer[i], rand(p.r, 0.82, 0.95));
        paveB.line("joint", m0[0], m0[1], m1[0], m1[1], { stroke: PAL.umberLt, strokeWidth: 0.36, strokeOpacity: 0.32, nonScaling: "hatch" });
        for (let k = 0; k < 2; k++) {
          const u0 = k * 0.48 + rand(p.r, 0.04, 0.14);
          const u1 = Math.min(0.96, u0 + rand(p.r, 0.22, 0.34));
          const q0 = lerp(r1Inner[i], r1Outer[i], u0);
          const q1 = lerp(r1Inner[i], r1Outer[i], u1);
          paveB.addPath("paveDab", brushStreak(q0[0], q0[1], q1[0], q1[1], 3.0, 2.0, p.r), {
            fill: (i + k) % 2 === 0 ? PAL.paperShadow : PAL.paperWarm,
            fillOpacity: 0.12,
          });
        }
        const pt = r1Inner[i];
        paveB.addPath("rimFeath", brushStreak(pt[0] - 26, pt[1] + 9, pt[0] + 12, pt[1] - 4, 3.8, 2.4, p.r), { fill: PAL.ochreLt, fillOpacity: 0.62 });
      }

      // 4. Micro-Detailed Crenellated Parapets with Stone Cap Slabs, Embrasure Slits & Drainage Spouts!
      paveB.addPath("parapet", polyPath([...r2Outer, ...r2Outer.map(([x, y]): Pt => [x, y - 13]).reverse()]), { fill: PAL.paperStone, fillOpacity: 0.96 });
      for (let i = 0; i < r2Outer.length - 1; i++) {
        const a = r2Outer[i];
        const b = lerp(r2Outer[i], r2Outer[i + 1], 0.64);
        const h = 23 - (i / r2Outer.length) * 9;
        paveB.quad("merSun", a, b, [b[0], b[1] - h], [a[0], a[1] - h], { fill: PAL.ochreLt, fillOpacity: 0.98 });
        paveB.quad("merCap", [a[0], a[1] - h - 2.5], [b[0], b[1] - h - 2.5], [b[0], b[1] - h], [a[0], a[1] - h], { fill: PAL.paperWarm, fillOpacity: 0.94 });
        const em = lerp(r2Outer[i], r2Outer[i + 1], 0.82);
        paveB.rect("merEm", em[0] - 2.0, em[1] - h * 0.5, 4.0, h * 0.5 - 1.5, { fill: PAL.umber, fillOpacity: 0.68 });
      }
      paveB.addPath("parapet", polyPath([...r1Outer, ...r1Outer.map(([x, y]): Pt => [x, y - 18]).reverse()]), { fill: PAL.paperStone, fillOpacity: 0.96 });
      for (let i = 0; i < r1Outer.length - 1; i++) {
        const a = r1Outer[i];
        const b = lerp(r1Outer[i], r1Outer[i + 1], 0.62);
        const h = 28 - (i / r1Outer.length) * 8;
        paveB.quad("merSun", a, b, [b[0], b[1] - h], [a[0], a[1] - h], { fill: PAL.ochreLt, fillOpacity: 0.98 });
        paveB.quad("merCap", [a[0], a[1] - h - 3], [b[0], b[1] - h - 3], [b[0], b[1] - h], [a[0], a[1] - h], { fill: PAL.paperWarm, fillOpacity: 0.94 });
        const em = lerp(r1Outer[i], r1Outer[i + 1], 0.8);
        paveB.rect("merEm", em[0] - 2.2, em[1] - h * 0.45, 4.4, h * 0.45 - 1.5, { fill: PAL.umber, fillOpacity: 0.68 });
      }
      paveB.addPath("lowCurb", polyPath([...r1Inner, ...r1Inner.map(([x, y]): Pt => [x, y - 15]).reverse()]), { fill: PAL.ochreLt, fillOpacity: 0.95 });
      paveB.flush(p);

      // 5. Twelve Expressive 2-Tone Human Travelers strolling along the winding Great Wall (`scaleFigures`)!
      p.scaleFigures(
        [
          { x: 560, y: 1522, h: 48, coat: PAL.cinnabarLt, kind: "dress", dir: 1 },
          { x: 618, y: 1512, h: 50, coat: PAL.ochre, kind: "coat", dir: 1 },
          { x: 465, y: 1388, h: 42, coat: PAL.cinnabar, kind: "coat", dir: -1 },
          { x: 382, y: 1312, h: 36, coat: PAL.slateDk, kind: "coat", dir: 1 },
          { x: 268, y: 1188, h: 27, coat: PAL.prussianLt, kind: "coat", dir: 1 },
          { x: 298, y: 1180, h: 25, coat: PAL.cinnabarLt, kind: "parasol", dir: 1 },
          { x: 495, y: 1034, h: 22, coat: PAL.paperWarm, kind: "coat", dir: 1 },
          { x: 695, y: 922, h: 19, coat: PAL.ochre, kind: "coat", dir: 1 },
          { x: 718, y: 912, h: 18, coat: PAL.cinnabar, kind: "dress", dir: 1 },
          { x: 925, y: 805, h: 16, coat: PAL.prussianLt, kind: "coat", dir: 1 },
          { x: 1055, y: 746, h: 14, coat: PAL.paperWarm, kind: "coat", dir: 1 },
          { x: 1195, y: 692, h: 13, coat: PAL.cinnabarLt, kind: "dress", dir: 1 },
        ],
        { shadowDir: [1.15, 0.28], shadowOpacity: 0.24 },
      );

      // =========================================================================
      // LAYER E: CONTINUOUS BILLOWING OLIVE-PINE FOREST CARPET (`_2_thumb.jpg`!)
      // Overlapping fused canopy masses hugging the ridge (NO disconnected broccoli trees!);
      // interior clusters omit `trunkBaseY`, reserving peeking trunks for 2 lower perimeter trees!
      // Positioned cleanly below `y = 716` so ZERO green chips poke onto `day-o11.png`'s sill!
      // =========================================================================
      const centralTrees: StippleTreeSpec[] = [
        // Upper contiguous forest belt hugging the Great Wall & watchtower hillside
        { cx: 735, cy: 1058, rx: 165, ry: 98, density: 0.48 },
        { cx: 895, cy: 962, rx: 185, ry: 108, density: 0.5 },
        { cx: 1085, cy: 874, rx: 192, ry: 105, density: 0.5 },
        { cx: 1295, cy: 836, rx: 185, ry: 86, density: 0.48 },
        { cx: 1495, cy: 824, rx: 195, ry: 84, density: 0.48 },
        { cx: 1715, cy: 828, rx: 185, ry: 92, density: 0.48 },
        // Continuous overlapping middle billowing carpet fusing the whole grove together!
        { cx: 925, cy: 1112, rx: 195, ry: 105, density: 0.48 },
        { cx: 1145, cy: 1038, rx: 205, ry: 108, density: 0.5 },
        { cx: 1385, cy: 988, rx: 205, ry: 104, density: 0.48 },
        { cx: 1605, cy: 974, rx: 192, ry: 98, density: 0.48 },
        { cx: 1780, cy: 968, rx: 165, ry: 88, density: 0.46 },
        // Lower-perimeter clusters (only 2 perimeter trees show peeking crooked bark trunks!)
        { cx: 955, cy: 1235, rx: 145, ry: 78, trunkBaseY: 1322, trunkWidth: 9, density: 0.46 },
        { cx: 1245, cy: 1168, rx: 155, ry: 80, density: 0.46 },
        { cx: 1465, cy: 1138, rx: 135, ry: 68, density: 0.44 },
        // Signature detached lower-left shrub accent (`_2_thumb.jpg`)
        { cx: 885, cy: 1408, rx: 72, ry: 50, trunkBaseY: 1466, trunkWidth: 6, density: 0.48 },
      ];
      stippleTreeCluster(p, p.r, centralTrees, {
        dabSize: 14.5,
        groundShadow: false,
        palette: {
          deepCore: PAL.sageDk,
          darkBody: PAL.sageDk,
          midOlive: PAL.sage,
          litSage: PAL.sageLt,
          sunCrown: PAL.sageLt,
          trunk: PAL.umberLt,
        },
      });

      // 3 poetic localized autumn terracotta-maple clusters tucked naturally inside the olive pines
      stippleTreeCluster(
        p,
        p.r,
        [
          { cx: 1025, cy: 952, rx: 40, ry: 28, density: 0.5 },
          { cx: 1635, cy: 985, rx: 50, ry: 36, density: 0.52 },
          { cx: 1320, cy: 836, rx: 32, ry: 22, density: 0.46 },
        ],
        {
          dabSize: 10.5,
          groundShadow: false,
          palette: {
            deepCore: PAL.cinnabarDk,
            darkBody: PAL.cinnabar,
            midOlive: PAL.cinnabarLt,
            litSage: PAL.ochre,
            sunCrown: PAL.ochreLt,
          },
        },
      );

      // Towering dense 5-tone pine forest massif on the lower-right mountain foreground
      const rightForest: StippleTreeSpec[] = [
        { cx: 2055, cy: 955, rx: 185, ry: 132, density: 0.46 },
        { cx: 2305, cy: 905, rx: 215, ry: 145, density: 0.46 },
        { cx: 2545, cy: 995, rx: 220, ry: 162, density: 0.44 },
        { cx: 1985, cy: 1185, rx: 205, ry: 142, trunkBaseY: 1355, trunkWidth: 14, density: 0.46 },
        { cx: 2245, cy: 1165, rx: 235, ry: 152, density: 0.46 },
        { cx: 2505, cy: 1265, rx: 240, ry: 162, density: 0.44 },
        { cx: 2095, cy: 1435, rx: 195, ry: 132, trunkBaseY: 1595, trunkWidth: 14, density: 0.44 },
        { cx: 2355, cy: 1475, rx: 235, ry: 152, density: 0.44 },
        { cx: 2560, cy: 1595, rx: 220, ry: 148, density: 0.42 },
      ];
      stippleTreeCluster(p, p.r, rightForest, {
        dabSize: 17.5,
        groundShadow: false,
        palette: {
          deepCore: PAL.prussianDk,
          darkBody: PAL.sageDk,
          midOlive: PAL.sageDk,
          litSage: PAL.sage,
          sunCrown: PAL.sageLt,
          trunk: PAL.umber,
        },
      });

      // Lower-left cliffside olive scrub tufts framing the winding foreground wall
      stippleTreeCluster(
        p,
        p.r,
        [
          { cx: 115, cy: 1445, rx: 108, ry: 82, trunkBaseY: 1538, trunkWidth: 9, density: 0.48 },
          { cx: -65, cy: 1515, rx: 145, ry: 105, density: 0.46 },
          { cx: 285, cy: 1555, rx: 78, ry: 52, density: 0.46 },
          { cx: 52, cy: 1635, rx: 125, ry: 85, density: 0.44 },
        ],
        {
          dabSize: 13.0,
          groundShadow: false,
          palette: {
            deepCore: PAL.sageDk,
            darkBody: PAL.sageDk,
            midOlive: PAL.sage,
            litSage: PAL.sageLt,
            sunCrown: PAL.sageLt,
            trunk: PAL.umberLt,
          },
        },
      );

      // Subtle scattered dry-brush ground flecks across the breathing lower-center paper foreground
      const groundB = new PathBatcher();
      for (let i = 0; i < 42; i++) {
        const gx = rand(p.r, 560, 1840);
        const gy = rand(p.r, 1320, 1680);
        groundB.addPath("fleck", brushStreak(gx, gy, gx + rand(p.r, 22, 68), gy + rand(p.r, -2, 3), rand(p.r, 1.4, 2.8), rand(p.r, 1.0, 2.0), p.r), {
          fill: PAL.paperShadow,
          fillOpacity: 0.34,
        });
      }
      groundB.flush(p);
    },
    false,
    "watchtower-clip",
  );

  p.flush();
  return {
    index: 10,
    id: "s10-ridge",
    title: "Great Wall & Watchtower Ridge",
    subtitle: "5-plane celadon peaks, coursed rampart & tiled beacon arch",
    portal: S10_PORTAL,
    coreColorDay: [248, 244, 232],
    coreColorNight: [19, 27, 44],
    defs: p.defs.join(""),
    markup: p.out.join(""),
    hole,
    stats: {
      elements: p.elements,
      strokes: p.strokes,
      animGroups: p.animGroups,
    },
  };
}
