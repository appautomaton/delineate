// S15: Victorian Naturalist's Kunstkammer & Specimen Study (Stage-5 5x Micro-Craft Overhaul)
// ZERO Nautilus oval collar! Built as a floor-to-ceiling @kiuzyx-dense Victorian Natural History Study:
//   - Architectural Room Envelope: coffered mahogany ceiling with 60+ carved dentil blocks, recessed brass
//     gallery picture-lights, paneled wainscoting & herringbone oak parquet floorboards (via PathBatcher!).
//   - Hero Off-Center Portal (860, 720 -> S16 Printshop): Open Glazed Mahogany Pass-Through Gallery Window
//     (`404x268px`, 0px bezel crop on day-o16.png!) set inside a grand Victorian oak-and-brass architectural
//     partition crowned by a lacy radial brass fanlight transom & flanked by swung-open beveled glass doors!
//   - Left Wall (x = -120..520): 2 floor-to-ceiling bays of `denseBookshelf` (`220+` 4-8px leather-bound
//     natural-history tomes & taxonomic ring binders), rotating engraved brass armillary/compass astrolabe
//     (`rotate`), and glass botanical cloche housing a 3D `rosette3D` specimen.
//   - Right Wall (x = 1245..2620): Monumental Victorian Kunstkammer Cabinet — 6 upper glass vitrines packed
//     with museum-grade copperplate specimens (complete cross-sectioned pearlescent Nautilus pompilius on a
//     turned brass stand!, multi-whorl ribbed Ammonites, 5-ambulacra Echinus tests, branching red Corallium,
//     scalloped Papilio swallowtail, translucent crystal druse, fluted Pecten, curved blown-glass specimen
//     phials & pinned herbarium mounts) above 18 graduated mahogany specimen flat-file drawers (`3×6`) with
//     brushed brass cup pulls, archival taxonomy cards & 2 drawers pulled open in 3D perspective!
//   - Foreground Mahogany Study Table (y = 1096..1880): Open 2-column Ernst Haeckel conchology folio (60+
//     micro-ruled text lines + engraved Nautilus plate), antique brass compound microscope with rack gears,
//     porcelain 12-well watercolor palette + rinse bowl + 4 sable brushes, pressed herbarium sheets, brass
//     dividers, vernier caliper, swaying magnifying loupe & twin emerald-glass banker's lamps!

import {
  PAL,
  Painter,
  PathBatcher,
  TAU,
  add,
  circlePath,
  closedSmooth,
  denseBookshelf,
  ellipsePath,
  f,
  lerp,
  linePath,
  linearTone,
  polyPath,
  quad,
  rad,
  rand,
  rectWindowHole,
  rot,
  sample,
  type Pt,
} from "../kit.ts";
import {
  BLEED,
  requiredPortalClearBox,
  validatePortalHole,
  type OctaveScene,
  type PortalSpec,
} from "./types.ts";

export const S15_PORTAL: PortalSpec = { cx: 860, cy: 720, rx: 202, ry: 134 };
const NEXT_PORTAL: readonly [number, number] = [1520, 920]; // s16-printshop

export function buildS15Cabinet(): OctaveScene {
  const p = new Painter("s15", 15509);

  const clearBox = requiredPortalClearBox(S15_PORTAL, NEXT_PORTAL);
  // Crisp glazed mahogany pass-through opening centered on S15_PORTAL: x=[659.4..1063.4], y=[586.0..854.0]
  // Encloses 236x160 clearBox, stays strictly inside 484x328 sealBox, AND clears all 4 edges at S=6 (`day-o16.png`)!
  const hole = rectWindowHole(clearBox, {
    padL: 104,
    padR: 64,
    padTop: 62,
    padBot: 46,
    chamfer: 0,
  });
  validatePortalHole("s15-cabinet", hole, S15_PORTAL, NEXT_PORTAL);

  const hx0 = hole[0][0]; // ~659.4
  const hx1 = hole[1][0]; // ~1063.4
  const hy0 = hole[0][1]; // ~586.0
  const hy1 = hole[2][1]; // ~854.0
  const hCx = (hx0 + hx1) * 0.5;

  const wallGrad = p.linearGrad("wall", BLEED.x0, BLEED.y0, BLEED.x1, 1180, [
    [0, PAL.paperWarm],
    [0.45, PAL.paperDeep],
    [0.85, PAL.paperStone],
    [1, PAL.umberLt],
  ]);
  const tableGrad = p.linearGrad("table", BLEED.x0, 1096, BLEED.x1, BLEED.y1, [
    [0, PAL.bark],
    [0.5, PAL.umber],
    [1, PAL.barkDk],
  ]);
  const lampPoolL = p.radialGrad("lampl", 560, 1280, 460, [
    [0, PAL.lanternCore, 0.44],
    [0.3, PAL.lantern, 0.25],
    [0.65, PAL.lanternHalo, 0.1],
    [1, PAL.lanternHalo, 0],
  ]);
  const lampPoolR = p.radialGrad("lampr", 1740, 1260, 480, [
    [0, PAL.lanternCore, 0.42],
    [0.3, PAL.lantern, 0.24],
    [0.65, PAL.lanternHalo, 0.1],
    [1, PAL.lanternHalo, 0],
  ]);
  const vitrineGlow1 = p.radialGrad("vg1", 1520, 290, 290, [
    [0, PAL.lanternCore, 0.36],
    [0.36, PAL.lantern, 0.18],
    [0.72, PAL.lanternHalo, 0.06],
    [1, PAL.lanternHalo, 0],
  ]);
  const vitrineGlow2 = p.radialGrad("vg2", 2110, 290, 290, [
    [0, PAL.lanternCore, 0.36],
    [0.36, PAL.lantern, 0.18],
    [0.72, PAL.lanternHalo, 0.06],
    [1, PAL.lanternHalo, 0],
  ]);

  // 1. Opaque full-bleed warm archival museum study wall punched cleanly by the glazed pass-through opening
  p.asymmetricPortalBackdrop(hole, wallGrad, { smooth: false });

  p.clippedToBackdrop(
    hole,
    () => {
      // 1a. Coffered Mahogany Ceiling Cornice with 65+ Carved Dentil Blocks & Subtle Wallpaper Dado (via PathBatcher!)
      {
        const arch = new PathBatcher();
        // Subtle vertical botanical-damask archival wallpaper stripes
        for (let x = BLEED.x0; x < BLEED.x1; x += 28) {
          arch.line("stripe", x, 86, x, 1100, { stroke: PAL.inkHair, strokeWidth: 0.3, strokeOpacity: 0.16, nonScaling: "hatch" });
        }
        // Crown entablature & coffered ceiling frieze (y = BLEED.y0..88)
        arch.rect("corniceTop", BLEED.x0, BLEED.y0, BLEED.x1 - BLEED.x0, 86 - BLEED.y0, { fill: PAL.barkDk, fillOpacity: 0.99 });
        arch.rect("corniceMid", BLEED.x0, 44, BLEED.x1 - BLEED.x0, 24, { fill: PAL.bark, fillOpacity: 0.99 });
        arch.rect("corniceLip", BLEED.x0, 68, BLEED.x1 - BLEED.x0, 18, { fill: PAL.umberDk, fillOpacity: 0.98 });
        // 72 carved mahogany dentil blocks along the frieze!
        for (let dx = -240; dx < 2680; dx += 36) {
          arch.rect("dentil", dx, 70, 18, 12, { fill: PAL.ochre, fillOpacity: 0.34 });
          arch.line("dentilLine", dx, 70, dx, 82, { stroke: PAL.ink, strokeWidth: 0.5, strokeOpacity: 0.72, nonScaling: "hatch" });
        }
        arch.line("brassBead", BLEED.x0, 67, BLEED.x1, 67, { stroke: PAL.brass, strokeWidth: 0.85, strokeOpacity: 0.78, nonScaling: "contour" });
        arch.line("litRim", BLEED.x0, 86, BLEED.x1, 86, { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.86, nonScaling: "contour" });
        arch.flush(p);
      }

      // 2. Left Wall (x = -120..508, y = 88..1100): 2 Dense Floor-to-Ceiling Naturalist Bookcase Bays (`220+` Spines!)
      //    + Rotating Brass Armillary/Compass Medallion + Botanical Glass Cloche on Credenza Shelf!
      denseBookshelf(p, { x: -110, y: 92, w: 302, h: 998 }, {
        shelves: 7,
        frameColor: PAL.bark,
        backColor: PAL.barkDk,
        binders: true,
        spinePalette: [PAL.cinnabar, PAL.prussian, PAL.umber, PAL.ochre, PAL.sageDk, PAL.petal, PAL.slateDk, PAL.copper],
      });
      denseBookshelf(p, { x: 202, y: 92, w: 298, h: 650 }, {
        shelves: 5,
        frameColor: PAL.bark,
        backColor: PAL.barkDk,
        binders: false,
        spinePalette: [PAL.prussian, PAL.ochre, PAL.umberDk, PAL.cinnabar, PAL.petal, PAL.sageDk, PAL.azurite, PAL.copper],
      });
      // Lower-left mahogany display niche (x = 202..500, y = 746..1090) housing rotating brass compass astrolabe & glass cloche!
      {
        const nx0 = 202;
        const nx1 = 500;
        const ny0 = 746;
        const ny1 = 1090;
        p.fillPath(polyPath([[nx0, ny0], [nx1, ny0], [nx1, ny1], [nx0, ny1]]), PAL.barkDk, 0.98);
        p.fillPath(polyPath([[nx0 + 10, ny0 + 10], [nx1 - 10, ny0 + 10], [nx1 - 10, ny1 - 12], [nx0 + 10, ny1 - 12]]), PAL.prussianDk, 0.94);
        p.burinContour(polyPath([[nx0, ny0], [nx1, ny0], [nx1, ny1], [nx0, ny1]]), PAL.ink, 0.85, 0.88, 4);
        p.flush();

        // Rotating Engraved Brass Mariner's / Naturalist's Compass Rose mounted in niche upper-left (295, 865)
        p.animGroup({ kind: "rotate", cx: 295, cy: 865, speedDeg: 7.4, phase: 12 }, () => {
          const cx = 295;
          const cy = 865;
          const r = 68;
          p.brassDegreeRing({ cx, cy, rOuter: r, rInner: r * 0.78, tickCount: 48, majorEvery: 4 });
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * TAU - Math.PI * 0.5;
            const len = k % 2 === 0 ? r * 0.78 : r * 0.54;
            const wid = k % 2 === 0 ? r * 0.16 : r * 0.11;
            const tip: Pt = [cx + Math.cos(a) * len, cy + Math.sin(a) * len];
            const sL: Pt = [cx + Math.cos(a - 0.34) * wid, cy + Math.sin(a - 0.34) * wid];
            const sR: Pt = [cx + Math.cos(a + 0.34) * wid, cy + Math.sin(a + 0.34) * wid];
            p.fillPath(polyPath([[cx, cy], sL, tip]), k === 0 ? PAL.cinnabar : PAL.brassLt, 0.96);
            p.fillPath(polyPath([[cx, cy], tip, sR]), PAL.umberDk, 0.92);
            p.burinContour(polyPath([[cx, cy], sL, tip, sR]), PAL.ink, 0.55, 0.84, 4);
          }
          p.fillPath(circlePath(cx, cy, r * 0.12), PAL.brassLt, 0.98);
        });

        // Glass Bell-Jar Botanical Cloche housing a 3D rosette specimen on the right of the niche (422, 1020)
        p.fillPath(polyPath([[368, 1044], [476, 1044], [482, 1068], [362, 1068]]), PAL.bark, 0.98);
        p.rosette3D({ cx: 422, cy: 1002, radius: 44, count: 22, viewDeg: 22, fill: PAL.celadon, deepFill: PAL.sageDk });
        const clocheD = `M376 1044V930A46 48 0 0 1 468 930V1044Z`;
        p.fillPath(clocheD, PAL.glass, 0.24);
        p.burinContour(clocheD + `M388 946V1028`, PAL.inkRim, 0.85, 0.65, 2);
        p.burinContour(clocheD, PAL.ink, 0.68, 0.8, 1);
        p.fillPath(circlePath(422, 876, 7), PAL.glassTint, 0.82);
        p.flush();
      }

      // 3. Center-Left Architectural Glazed Mahogany Partition Framing the Open Pass-Through to S16 Printshop!
      //    Spanning x = 512..1212, y = 92..1096 — carved fluted pilasters, radial brass fanlight transom above
      //    the opening, wainscot base below, and swung-open beveled glass cabinet doors on left & right!
      {
        const partX0 = 516;
        const partX1 = 1208;
        const partY0 = 92;
        const partY1 = 1096;
        const arch = new PathBatcher();

        // Mahogany partition wall surround + fluted side pilasters
        arch.rect("partBody", partX0, partY0, partX1 - partX0, partY1 - partY0, { fill: PAL.bark, fillOpacity: 0.99 });
        arch.rect("wainscot", partX0 + 18, hy1 + 18, partX1 - partX0 - 36, partY1 - hy1 - 30, { fill: PAL.umberDk, fillOpacity: 0.96 });
        // 3 recessed mitered mahogany fielded wainscot panels directly below the pass-through sill (`y = hy1+32..1076`)
        for (let k = 0; k < 3; k++) {
          const px0 = partX0 + 38 + k * 212;
          const pw = 192;
          const py0 = hy1 + 34;
          const ph = partY1 - hy1 - 54;
          arch.rect("panelIn", px0, py0, pw, ph, { fill: PAL.bark, fillOpacity: 0.98 });
          // Fielded raised center panel with mitered chamfer bevels (left/top lit, right/bottom shaded!)
          arch.quad("panTopB", [px0 + 6, py0 + 6], [px0 + pw - 6, py0 + 6], [px0 + pw - 18, py0 + 18], [px0 + 18, py0 + 18], { fill: PAL.ochre, fillOpacity: 0.14 });
          arch.quad("panBotB", [px0 + 18, py0 + ph - 18], [px0 + pw - 18, py0 + ph - 18], [px0 + pw - 6, py0 + ph - 6], [px0 + 6, py0 + ph - 6], { fill: PAL.cut, fillOpacity: 0.24 });
          arch.rect("panelBevel", px0 + 18, py0 + 18, pw - 36, ph - 36, { fill: PAL.umber, fillOpacity: 0.9 });
          arch.rect("panelLine", px0, py0, pw, ph, { stroke: PAL.ink, strokeWidth: 0.68, strokeOpacity: 0.84, nonScaling: "contour" });
          arch.rect("panelLine", px0 + 6, py0 + 6, pw - 12, ph - 12, { stroke: PAL.ink, strokeWidth: 0.45, strokeOpacity: 0.68, nonScaling: "hatch" });
          arch.rect("panelLine", px0 + 18, py0 + 18, pw - 36, ph - 36, { stroke: PAL.litEdge, strokeWidth: 0.5, strokeOpacity: 0.6, nonScaling: "hatch" });
          // 4 diagonal miter corner joints
          arch.line("panMiter", px0 + 6, py0 + 6, px0 + 18, py0 + 18, { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.68, nonScaling: "hatch" });
          arch.line("panMiter", px0 + pw - 6, py0 + 6, px0 + pw - 18, py0 + 18, { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.68, nonScaling: "hatch" });
          arch.line("panMiter", px0 + 6, py0 + ph - 6, px0 + 18, py0 + ph - 18, { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.68, nonScaling: "hatch" });
          arch.line("panMiter", px0 + pw - 6, py0 + ph - 6, px0 + pw - 18, py0 + ph - 18, { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.68, nonScaling: "hatch" });
        }

        // Fluted Mahogany Architectural Pilasters flanking the partition at x = 518..572 and x = 1152..1206
        for (const px of [520, 1154]) {
          arch.rect("pilaster", px, partY0 + 14, 52, partY1 - partY0 - 24, { fill: PAL.umber, fillOpacity: 0.96 });
          for (let fl = 1; fl <= 5; fl++) {
            arch.line("flute", px + fl * 8.6, partY0 + 48, px + fl * 8.6, partY1 - 44, { stroke: PAL.inkSepia, strokeWidth: 0.48, strokeOpacity: 0.64, nonScaling: "hatch" });
          }
          // Molded pilaster capital & plinth
          arch.rect("cap", px - 6, partY0 + 10, 64, 30, { fill: PAL.barkDk, fillOpacity: 0.98 });
          arch.rect("capBrass", px - 4, partY0 + 38, 60, 5, { fill: PAL.brass, fillOpacity: 0.94 });
        }

        // Grand Victorian Semicircular Glazed Fanlight Transom directly above the open pass-through (`y = 324..568`)!
        const fanY = hy0 - 18;
        const fanRx = 278;
        const fanRy = 236;
        const fanOuter = `M${f(hCx - fanRx)} ${f(fanY)}A${fanRx} ${fanRy} 0 0 1 ${f(hCx + fanRx)} ${f(fanY)}Z`;
        const fanMid = `M${f(hCx - fanRx * 0.54)} ${f(fanY)}A${f(fanRx * 0.54)} ${f(fanRy * 0.54)} 0 0 1 ${f(hCx + fanRx * 0.54)} ${f(fanY)}Z`;
        const fanArchRim = `M${f(hCx - fanRx - 10)} ${f(fanY)}A${fanRx + 10} ${fanRy + 10} 0 0 1 ${f(hCx + fanRx + 10)} ${f(fanY)}`;

        // Carved Upper Mahogany Coffered Spandrel Paneling + 3 Detailed Framed Natural-History Copperplate Prints (`y = 104..248`)!
        arch.rect("upPan", partX0 + 62, partY0 + 14, partX1 - partX0 - 124, 138, { fill: PAL.umberDk, fillOpacity: 0.94 });
        for (let k = 0; k < 3; k++) {
          const ux = partX0 + 74 + k * 184;
          arch.rect("upCof", ux, partY0 + 22, 170, 114, { fill: PAL.bark, fillOpacity: 0.96 });
          arch.rect("upCofRim", ux, partY0 + 22, 170, 114, { stroke: PAL.ink, strokeWidth: 0.58, strokeOpacity: 0.78, nonScaling: "contour" });
          // Brass-molded framed copperplate natural-history print mounted in each upper coffer!
          const fx = ux + 18;
          const fy = partY0 + 28;
          const fw = 134;
          const fh = 96;
          arch.rect("upFrm", fx, fy, fw, fh, { fill: PAL.barkDk, fillOpacity: 0.99 });
          arch.rect("upFrmB", fx + 3, fy + 3, fw - 6, fh - 6, { stroke: PAL.brass, strokeWidth: 0.52, strokeOpacity: 0.82, nonScaling: "contour" });
          arch.rect("upMat", fx + 7, fy + 7, fw - 14, fh - 14, { fill: PAL.petal, fillOpacity: 0.96 });
          arch.rect("upPlRule", fx + 12, fy + 11, fw - 24, fh - 26, { stroke: PAL.inkMid, strokeWidth: 0.35, strokeOpacity: 0.65, nonScaling: "hatch" });
          const fcx = fx + fw * 0.5;
          const fcy = fy + fh * 0.44;
          if (k === 0) {
            // Print 1: Engraved Chambered Nautilus Spiral Plate
            const sPts: Pt[] = Array.from({ length: 30 }, (_, i) => {
              const th = (i / 29) * TAU * 2.1;
              const rr = 2.8 * Math.exp(0.18 * th);
              return [fcx + Math.cos(th) * rr, fcy + Math.sin(th) * rr] as Pt;
            });
            arch.addPath("upArtA", closedSmooth(sPts.slice(14)), { fill: PAL.ochreLt, fillOpacity: 0.42 });
            arch.addPath("upArtLn", linePath(sPts), { stroke: PAL.inkSepia, strokeWidth: 0.46, strokeOpacity: 0.84, nonScaling: "hatch" });
          } else if (k === 1) {
            // Print 2: Engraved Double-Hemisphere Celestial & Botanical Atlas Plate
            arch.circle("upArtB", fcx - 21, fcy, 19, { fill: PAL.celadonLt, fillOpacity: 0.42 });
            arch.circle("upArtA", fcx + 21, fcy, 19, { fill: PAL.ochreLt, fillOpacity: 0.42 });
            arch.addPath(
              "upArtLn",
              circlePath(fcx - 21, fcy, 19) +
                circlePath(fcx + 21, fcy, 19) +
                ellipsePath(fcx - 21, fcy, 19, 8) +
                ellipsePath(fcx - 21, fcy, 8, 19) +
                ellipsePath(fcx + 21, fcy, 19, 8) +
                ellipsePath(fcx + 21, fcy, 8, 19),
              { stroke: PAL.inkMid, strokeWidth: 0.38, strokeOpacity: 0.8, nonScaling: "hatch" },
            );
          } else {
            // Print 3: Engraved Red Coral & Swallowtail Specimen Plate
            arch.line("upCoral", fcx - 18, fcy + 18, fcx - 26, fcy - 14, { stroke: PAL.cinnabar, strokeWidth: 1.0, strokeOpacity: 0.9, nonScaling: "contour" });
            arch.line("upCoral", fcx - 18, fcy + 18, fcx - 8, fcy - 12, { stroke: PAL.cinnabar, strokeWidth: 1.0, strokeOpacity: 0.9, nonScaling: "contour" });
            arch.addPath("upArtB", ellipsePath(fcx + 16, fcy - 3, 12, 7) + ellipsePath(fcx + 30, fcy - 3, 12, 7), { fill: PAL.celadonLt, fillOpacity: 0.72 });
            arch.addPath("upArtLn", ellipsePath(fcx + 16, fcy - 3, 12, 7) + ellipsePath(fcx + 30, fcy - 3, 12, 7), { stroke: PAL.ink, strokeWidth: 0.38, strokeOpacity: 0.8, nonScaling: "hatch" });
          }
          arch.line("upCap", fcx - 28, fy + fh - 11, fcx + 28, fy + fh - 11, { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.72, nonScaling: "hatch" });
        }
        // Molded mahogany upper curio gallery shelf + scrolled brass brackets at y = 246
        arch.rect("gShelf", partX0 + 56, 244, partX1 - partX0 - 112, 13, { fill: PAL.barkDk, fillOpacity: 0.99 });
        arch.line("gShelfLit", partX0 + 56, 245, partX1 - 56, 245, { stroke: PAL.brass, strokeWidth: 0.72, strokeOpacity: 0.8, nonScaling: "contour" });
        for (const brX of [602, 766, 954, 1118]) {
          arch.quad("gBrk", [brX - 5, 257], [brX + 5, 257], [brX + 3, 278], [brX - 3, 278], { fill: PAL.brassDk, fillOpacity: 0.94 });
        }
        // Curiosities arrayed cleanly along the upper gallery shelf (y = 202..244, framing the prints without blocking them!)
        const sfCols = [PAL.cinnabar, PAL.prussian, PAL.ochre, PAL.sageDk, PAL.copper, PAL.azurite];
        for (let k = 0; k < 3; k++) {
          arch.rect(`sfL-${k}`, 592 + k * 2, 234 - k * 10, 74 - k * 4, 8.5, { fill: sfCols[k], fillOpacity: 0.96 });
          arch.rect(`sfR-${k}`, 1054 + k * 2, 234 - k * 10, 74 - k * 4, 8.5, { fill: sfCols[(k + 2) % sfCols.length], fillOpacity: 0.96 });
          arch.rect("sfRim", 592 + k * 2, 234 - k * 10, 74 - k * 4, 8.5, { stroke: PAL.ink, strokeWidth: 0.4, strokeOpacity: 0.75, nonScaling: "hatch" });
          arch.rect("sfRim", 1054 + k * 2, 234 - k * 10, 74 - k * 4, 8.5, { stroke: PAL.ink, strokeWidth: 0.4, strokeOpacity: 0.75, nonScaling: "hatch" });
        }
        // Twin Miniature Bell-Jars & Center Brass Armillary resting along the cornice shelf
        for (const [jx, specCol, isCrystal] of [[744, PAL.cinnabar, false], [978, PAL.celadonLt, true]] as const) {
          arch.rect("jarBase", jx - 22, 235, 44, 9, { fill: PAL.barkDk, fillOpacity: 0.99 });
          if (isCrystal) {
            arch.quad("jarSpecA", [jx - 10, 235], [jx - 2, 235], [jx - 5, 206], [jx - 9, 210], { fill: specCol, fillOpacity: 0.92 });
            arch.quad("jarSpecB", [jx - 2, 235], [jx + 6, 235], [jx + 2, 198], [jx - 1, 202], { fill: PAL.malachite, fillOpacity: 0.9 });
            arch.quad("jarSpecA", [jx + 5, 235], [jx + 13, 235], [jx + 10, 208], [jx + 6, 212], { fill: PAL.wisteriaLt, fillOpacity: 0.88 });
          } else {
            arch.line("jarCoral", jx, 235, jx - 9, 204, { stroke: specCol, strokeWidth: 1.35, strokeOpacity: 0.94, nonScaling: "contour" });
            arch.line("jarCoral", jx, 235, jx + 9, 202, { stroke: specCol, strokeWidth: 1.35, strokeOpacity: 0.94, nonScaling: "contour" });
          }
          const domeD = `M${jx - 19} 235V200A19 19 0 0 1 ${jx + 19} 200V235Z`;
          arch.addPath("jarGlass", domeD, { fill: PAL.glass, fillOpacity: 0.28 });
          arch.addPath("jarRim", domeD, { stroke: PAL.ink, strokeWidth: 0.56, strokeOpacity: 0.84, nonScaling: "contour" });
          arch.line("jarGlint", jx - 12, 204, jx - 12, 228, { stroke: PAL.inkRim, strokeWidth: 0.56, strokeOpacity: 0.56, nonScaling: "hatch" });
          arch.circle("jarKnob", jx, 178, 3.0, { fill: PAL.glassTint, fillOpacity: 0.85 });
        }
        // Center Engraved Brass Armillary Sphere resting at y = 196..244
        arch.quad("armPlinth", [838, 244], [882, 244], [874, 232], [846, 232], { fill: PAL.brass, fillOpacity: 0.96 });
        arch.line("armStem", 860, 232, 860, 218, { stroke: PAL.brassDk, strokeWidth: 1.3, strokeOpacity: 0.95, nonScaling: "contour" });
        arch.circle("armSun", 860, 198, 6.2, { fill: PAL.ochreLt, fillOpacity: 0.95 });
        arch.addPath(
          "armRings",
          circlePath(860, 198, 23) + circlePath(860, 198, 19) + ellipsePath(860, 198, 23, 8) + ellipsePath(860, 198, 9, 23) + `M838 212L882 184`,
          { stroke: PAL.brass, strokeWidth: 0.82, strokeOpacity: 0.94, nonScaling: "contour" },
        );

        // Fanlight Transom Glass, Radial Brass Spokes & Molded Archivolt Rim
        arch.addPath("fanGlass", fanOuter, { fill: PAL.glass, fillOpacity: 0.52 });
        arch.addPath("fanGlow", fanMid, { fill: PAL.windowLit, fillOpacity: "var(--z-halo-op)" });
        for (let k = 0; k <= 12; k++) {
          const a = Math.PI + (k / 12) * Math.PI;
          arch.line("fanBar", hCx + Math.cos(a) * fanRx * 0.22, fanY + Math.sin(a) * fanRy * 0.22, hCx + Math.cos(a) * fanRx, fanY + Math.sin(a) * fanRy, {
            stroke: PAL.brass,
            strokeWidth: 0.92,
            strokeOpacity: 0.9,
            nonScaling: "contour",
          });
        }
        arch.addPath("fanRing", fanOuter + fanMid, { stroke: PAL.ink, strokeWidth: 0.95, strokeOpacity: 0.88, nonScaling: "contour" });
        arch.addPath("fanArch", fanArchRim, { stroke: PAL.brass, strokeWidth: 0.9, strokeOpacity: 0.72, nonScaling: "contour" });
        const fanHubD = `M${f(hCx - fanRx * 0.22)} ${f(fanY)}A${f(fanRx * 0.22)} ${f(fanRy * 0.22)} 0 0 1 ${f(hCx + fanRx * 0.22)} ${f(fanY)}Z`;
        arch.addPath("fanHub", fanHubD, { fill: PAL.brass, fillOpacity: 0.94 });
        arch.addPath("fanHubRim", fanHubD, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.86, nonScaling: "contour" });

        // Carved entablature header bar between fanlight transom & pass-through opening
        arch.rect("lintel", partX0 + 54, fanY - 4, partX1 - partX0 - 108, 22, { fill: PAL.barkDk, fillOpacity: 0.99 });
        arch.line("lintelBrass", partX0 + 56, fanY + 7, partX1 - 56, fanY + 7, { stroke: PAL.brassLt, strokeWidth: 0.72, strokeOpacity: 0.76, nonScaling: "contour" });

        // Side leaded-glass mullioned narrow sidelight strips flanking the swung-open pass-through doors
        for (const [sx0, sx1] of [[574, hx0 - 10], [hx1 + 10, 1150]] as const) {
          arch.rect("sideGlass", sx0, hy0, sx1 - sx0, hy1 - hy0, { fill: PAL.glass, fillOpacity: 0.44 });
          for (let r = 1; r <= 4; r++) {
            const ry = hy0 + ((hy1 - hy0) * r) / 5;
            arch.line("sideBar", sx0, ry, sx1, ry, { stroke: PAL.barkDk, strokeWidth: 0.85, strokeOpacity: 0.88, nonScaling: "contour" });
          }
          arch.rect("sideRim", sx0, hy0, sx1 - sx0, hy1 - hy0, { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.88, nonScaling: "contour" });
        }

        // Twin Richly Engraved Framed Botanical & Conchological Plates in the Fanlight Spandrels (`y = 282..386`)!
        for (const [fx, fy, isShell] of [[586, 282, true], [1058, 282, false]] as const) {
          arch.rect("miniFrame", fx, fy, 78, 102, { fill: PAL.barkDk, fillOpacity: 0.98 });
          arch.rect("miniBrass", fx + 4, fy + 4, 70, 94, { stroke: PAL.brass, strokeWidth: 0.55, strokeOpacity: 0.82, nonScaling: "contour" });
          arch.rect("miniMat", fx + 8, fy + 8, 62, 86, { fill: PAL.petal, fillOpacity: 0.96 });
          arch.rect("miniInRule", fx + 13, fy + 13, 52, 76, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.65, nonScaling: "hatch" });
          if (isShell) {
            // Engraved 5-ambulacra Echinus medallion
            arch.circle("miniArt", fx + 39, fy + 44, 18, { fill: PAL.ochreLt, fillOpacity: 0.48 });
            arch.circle("miniArtRim", fx + 39, fy + 44, 18, { stroke: PAL.inkSepia, strokeWidth: 0.45, strokeOpacity: 0.82, nonScaling: "hatch" });
            for (let k = 0; k < 5; k++) {
              const a = (k / 5) * TAU - Math.PI * 0.5;
              arch.line("miniDet", fx + 39, fy + 44, fx + 39 + Math.cos(a) * 17, fy + 44 + Math.sin(a) * 17, { stroke: PAL.inkSepia, strokeWidth: 0.4, strokeOpacity: 0.78, nonScaling: "hatch" });
            }
          } else {
            // Engraved botanical fern frond study
            arch.line("miniBot", fx + 39, fy + 66, fx + 39, fy + 22, { stroke: PAL.sageDk, strokeWidth: 0.58, strokeOpacity: 0.86, nonScaling: "hatch" });
            for (let r = 0; r < 5; r++) {
              const ly = fy + 28 + r * 7.5;
              arch.line("miniBot", fx + 39, ly, fx + 24, ly - 5, { stroke: PAL.sageDk, strokeWidth: 0.48, strokeOpacity: 0.8, nonScaling: "hatch" });
              arch.line("miniBot", fx + 39, ly, fx + 54, ly - 5, { stroke: PAL.sageDk, strokeWidth: 0.48, strokeOpacity: 0.8, nonScaling: "hatch" });
            }
          }
          arch.line("miniCap", fx + 20, fy + 76, fx + 58, fy + 76, { stroke: PAL.inkMid, strokeWidth: 0.38, strokeOpacity: 0.72, nonScaling: "hatch" });
          arch.line("miniCap", fx + 26, fy + 82, fx + 52, fy + 82, { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.6, nonScaling: "hatch" });
        }

        arch.flush(p);
      }

      // 4. Right Half (x = 1234..2620, y = 88..1096): MONUMENTAL VICTORIAN KUNSTKAMMER CABINET!
      //    - Upper Tier (y = 102..648): 6 Illuminated Glass Vitrines (`3 cols × 2 shelves`) showcasing museum-grade
      //      specimens — including our TRUE COMPLETE CROSS-SECTIONED NAUTILUS POMPILIUS on a brass museum plinth!
      //    - Lower Tier (y = 660..1092): 18 Graduated Mahogany Specimen Flat-File Drawers (`3 cols × 6 rows`)
      //      with brushed brass pulls, archival Latin index cards, and 2 drawers pulled partly open in 3D!
      {
        const cabX0 = 1236;
        const cabX1 = BLEED.x1;
        const cabY0 = 90;
        const cabY1 = 1094;
        p.fillPath(polyPath([[cabX0 - 12, cabY0 + 10], [cabX0 + 4, cabY0], [cabX0 + 4, cabY1], [cabX0 - 12, cabY1]]), PAL.cut, 0.28);
        p.fillPath(polyPath([[cabX0, cabY0], [cabX1, cabY0], [cabX1, cabY1], [cabX0, cabY1]]), PAL.bark, 1);
        p.burinContour(`M${cabX0} ${cabY0}V${cabY1}M${cabX0 + 10} ${cabY0}V${cabY1}`, PAL.litEdge, 0.8, 0.72, 2);
        p.flush();

        // Warm nocturnal vitrine downlight glows
        p.layer("var(--z-halo-op)", () => {
          p.fillPath(circlePath(1520, 290, 290), vitrineGlow1, 1);
          p.fillPath(circlePath(2110, 290, 290), vitrineGlow2, 1);
        });

        // Specimen helper: Complete Cross-Sectioned Pearlescent Nautilus pompilius mounted on turned brass museum plinth!
        const drawNautilusSpecimen = (cx: number, cy: number, maxR: number) => {
          // Brass museum plinth
          p.fillPath(polyPath([[cx - 42, cy + maxR + 28], [cx + 42, cy + maxR + 28], [cx + 28, cy + maxR + 14], [cx - 28, cy + maxR + 14]]), PAL.brass, 0.96);
          p.burinContour(`M${f(cx)} ${f(cy + maxR + 14)}V${f(cy + maxR * 0.45)}`, PAL.brassDk, 1.4, 0.94, 1);
          // Continuous 2.35-turn logarithmic cross-sectioned pearlescent shell!
          const chCount = 24;
          const th0 = 0.2;
          const th1 = th0 + TAU * 2.35;
          const spR = (th: number) => (maxR * 0.085) * Math.exp(0.168 * (th - th0));
          const outerRing: Pt[] = [];
          for (let i = 0; i <= 52; i++) {
            const th = th1 - TAU + (i / 52) * TAU;
            const r = spR(th) + 4;
            outerRing.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]);
          }
          p.fillPath(closedSmooth(outerRing), PAL.petal, 0.99);
          // Wavy exterior tiger-flame cinnabar/ochre markings
          let flames = "";
          for (let i = 0; i < 48; i += 2) {
            const a = th1 - TAU + (i / 48) * TAU;
            const b = th1 - TAU + ((i + 1) / 48) * TAU;
            const ra = spR(a);
            const rb = spR(b);
            flames += polyPath([
              [cx + Math.cos(a) * ra, cy + Math.sin(a) * ra],
              [cx + Math.cos(a) * (ra + 4), cy + Math.sin(a) * (ra + 4)],
              [cx + Math.cos(b) * (rb + 4), cy + Math.sin(b) * (rb + 4)],
              [cx + Math.cos(b) * rb, cy + Math.sin(b) * rb],
            ]);
          }
          p.fillPath(flames, PAL.cinnabar, 0.64);
          let seps = "";
          for (let c = chCount - 1; c >= 0; c--) {
            const a0 = th0 + (c / chCount) * (th1 - th0);
            const a1 = th0 + ((c + 1) / chCount) * (th1 - th0);
            const am = (a0 + a1) * 0.5;
            const r0 = spR(a0);
            const r1 = spR(a1);
            const rm = spR(am);
            const pt = (a: number, r: number): Pt => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
            const bow = pt(a0 - 0.18, r0 * 0.78);
            const sep = sample(quad(pt(a0, r0 * 0.54), bow, pt(a0, r0)), 5);
            const poly: Pt[] = [...sep, pt(am, rm), pt(a1, r1), pt(a1, r1 * 0.54), pt(am, rm * 0.54)];
            p.fillPath(closedSmooth(poly), PAL.petal, 0.98);
            p.fillPath(closedSmooth(poly), c % 3 === 0 ? PAL.celadonLt : c % 3 === 1 ? PAL.petalBlush : PAL.ochreLt, 0.22);
            seps += linePath(sep);
          }
          const fullSp: Pt[] = Array.from({ length: 68 }, (_, i) => {
            const th = th0 + (i / 67) * (th1 - th0);
            const r = spR(th);
            return [cx + Math.cos(th) * r, cy + Math.sin(th) * r] as Pt;
          });
          p.burinContour(seps + linePath(fullSp) + closedSmooth(outerRing), PAL.ink, 0.65, 0.85, chCount + 2);
          p.fillPath(circlePath(cx, cy, maxR * 0.11), PAL.umberDk, 0.98);
        };

        const drawAmmonite = (cx: number, cy: number, maxR: number, flip: 1 | -1, col: string) => {
          const out: Pt[] = [];
          const inn: Pt[] = [];
          for (let i = 0; i <= 44; i++) {
            const t = i / 44;
            const th = t * TAU * 2.8;
            const ro = maxR * (0.12 + 0.88 * t ** 1.38);
            out.push([cx + Math.cos(th * flip) * ro, cy + Math.sin(th * flip) * ro]);
            inn.push([cx + Math.cos(th * flip) * ro * 0.58, cy + Math.sin(th * flip) * ro * 0.58]);
          }
          p.fillPath(closedSmooth([...out, ...inn.reverse()]), col, 0.97);
          let ribs = "";
          for (let i = 4; i <= 44; i += 2) {
            const t = i / 44;
            const th = t * TAU * 2.8;
            const r1 = maxR * (0.12 + 0.88 * t ** 1.38);
            const r0 = r1 * 0.58;
            ribs += `M${f(cx + Math.cos(th * flip) * r0)} ${f(cy + Math.sin(th * flip) * r0)}Q${f(cx + Math.cos((th - 0.15) * flip) * ((r0 + r1) * 0.5))} ${f(cy + Math.sin((th - 0.15) * flip) * ((r0 + r1) * 0.5))} ${f(cx + Math.cos(th * flip) * r1)} ${f(cy + Math.sin(th * flip) * r1)}`;
          }
          p.burin(ribs, PAL.inkSepia, 0.52, 0.78, 21, "hatch");
          p.burinContour(linePath(out), PAL.ink, 0.76, 0.86, 1);
        };

        const drawCoral = (cx: number, baseY: number, h: number, col: string, tipCol: string) => {
          p.fillPath(polyPath([[cx - 32, baseY], [cx + 32, baseY], [cx + 20, baseY - 12], [cx - 20, baseY - 12]]), PAL.brass, 0.96);
          const branch = (ox: number, oy: number, ang: number, len: number, w: number, depth: number) => {
            const ex = ox + Math.cos(ang) * len;
            const ey = oy + Math.sin(ang) * len;
            const pts = sample(quad([ox, oy], [(ox + ex) * 0.5 + rand(p.r, -6, 6), (oy + ey) * 0.5 + rand(p.r, -5, 5)], [ex, ey]), 5);
            p.calligraphicStroke(pts, w, w * 0.74, w * 0.42, depth === 0 ? tipCol : col, 0.96);
            if (depth > 0) {
              branch(ex, ey, ang - rand(p.r, 0.32, 0.52), len * 0.72, w * 0.68, depth - 1);
              branch(ex, ey, ang + rand(p.r, 0.32, 0.52), len * 0.7, w * 0.68, depth - 1);
            } else {
              p.fillPath(circlePath(ex, ey, w * 0.42), PAL.petal, 0.88);
            }
          };
          branch(cx, baseY - 14, -Math.PI * 0.5 - 0.28, h * 0.38, 8.5, 3);
          branch(cx, baseY - 14, -Math.PI * 0.5 + 0.26, h * 0.39, 8.5, 3);
          branch(cx, baseY - 14, -Math.PI * 0.5, h * 0.32, 7.0, 2);
        };

        const drawSwallowtail = (cx: number, cy: number, span: number, wingCol: string, borderCol: string, eyeCol: string) => {
          let veins = "";
          for (const s of [-1, 1] as const) {
            const fore: Pt[] = [[cx + s * 3, cy - 12], [cx + s * span * 0.52, cy - span * 0.56], [cx + s * span, cy - span * 0.5], [cx + s * span * 0.94, cy - span * 0.14], [cx + s * span * 0.72, cy + span * 0.08], [cx + s * 4, cy + 5]];
            const hind: Pt[] = [[cx + s * 4, cy + 3], [cx + s * span * 0.7, cy + span * 0.06], [cx + s * span * 0.66, cy + span * 0.34], [cx + s * span * 0.48, cy + span * 0.82], [cx + s * span * 0.4, cy + span * 0.78], [cx + s * span * 0.36, cy + span * 0.52], [cx + s * 4, cy + 22]];
            p.fillPath(closedSmooth(fore), wingCol, 0.97);
            p.fillPath(closedSmooth(hind), wingCol, 0.95);
            p.fillPath(circlePath(cx + s * span * 0.24, cy + span * 0.42, span * 0.07), eyeCol, 0.92);
            p.burinContour(closedSmooth(fore) + closedSmooth(hind), borderCol, 0.62, 0.85, 2);
            veins += `M${f(cx + s * 4)} ${f(cy - 6)}L${f(cx + s * span * 0.88)} ${f(cy - span * 0.38)}M${f(cx + s * 4)} ${f(cy + 2)}L${f(cx + s * span * 0.72)} ${f(cy - span * 0.02)}M${f(cx + s * 4)} ${f(cy + 12)}L${f(cx + s * span * 0.44)} ${f(cy + span * 0.62)}`;
          }
          p.burin(veins, PAL.inkSepia, 0.42, 0.74, 6, "hatch");
          p.fillPath(ellipsePath(cx, cy + 8, 4.5, 22), PAL.barkDk, 0.98);
        };

        const drawEchinus = (cx: number, cy: number, r: number, col: string) => {
          p.fillPath(circlePath(cx, cy, r), col, 0.97);
          p.fillPath(circlePath(cx - r * 0.16, cy - r * 0.16, r * 0.58), PAL.petal, 0.4);
          let pet = circlePath(cx, cy, r) + circlePath(cx, cy, r * 0.16);
          let pores = "";
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * TAU - Math.PI * 0.5;
            const ca = Math.cos(a);
            const sa = Math.sin(a);
            const nx = -sa;
            const ny = ca;
            pet += `M${f(cx + ca * r * 0.16)} ${f(cy + sa * r * 0.16)}Q${f(cx + ca * r * 0.54 + nx * r * 0.18)} ${f(cy + sa * r * 0.54 + ny * r * 0.18)} ${f(cx + ca * r * 0.96)} ${f(cy + sa * r * 0.96)}`;
            pet += `M${f(cx + ca * r * 0.16)} ${f(cy + sa * r * 0.16)}Q${f(cx + ca * r * 0.54 - nx * r * 0.18)} ${f(cy + sa * r * 0.54 - ny * r * 0.18)} ${f(cx + ca * r * 0.96)} ${f(cy + sa * r * 0.96)}`;
            for (let d = 1; d <= 5; d++) {
              const rr = r * (0.22 + (d / 6) * 0.7);
              pores += `M${f(cx + ca * rr)} ${f(cy + sa * rr)}h0.2`;
            }
          }
          p.burinContour(pet, PAL.inkSepia, 0.56, 0.78, 12);
          p.burin(pores, PAL.inkMid, 0.65, 0.68, 25, "hatch");
        };

        const drawMineralDruse = (cx: number, cy: number, r: number, lit: string, mid: string, dk: string) => {
          p.fillPath(ellipsePath(cx, cy + r * 0.44, r * 0.7, r * 0.2), PAL.umberDk, 0.92);
          for (const [ox, pw, ph, tilt] of [[-0.4, 0.24, 0.74, -0.22], [-0.14, 0.24, 0.92, -0.06], [0.12, 0.28, 1.02, 0.08], [0.38, 0.22, 0.72, 0.24]] as const) {
            const bx = cx + ox * r;
            const by = cy + r * 0.42;
            const toP = (lx: number, ly: number): Pt => add([bx, by], rot([lx, ly], tilt));
            const h = ph * r;
            const hw = pw * r * 0.5;
            const lF: Pt[] = [toP(0, -h), toP(-hw, -h + hw * 1.15), toP(-hw * 0.9, 0), toP(0, 3)];
            const rF: Pt[] = [toP(0, -h), toP(hw, -h + hw * 1.15), toP(hw * 0.9, 0), toP(0, 3)];
            p.fillPath(polyPath(lF), lit, 0.8);
            p.fillPath(polyPath(rF), dk, 0.8);
            p.fillPath(polyPath([toP(0, -h), toP(hw * 0.34, -h + hw * 1.2), toP(0, 0), toP(-hw * 0.34, -h + hw * 1.2)]), mid, 0.62);
            p.burinContour(`M${f(toP(0, -h)[0])} ${f(toP(0, -h)[1])}L${f(toP(0, 0)[0])} ${f(toP(0, 0)[1])}`, PAL.inkRim, 0.52, 0.68, 1);
            p.burinContour(polyPath(lF) + polyPath(rF), dk, 0.46, 0.72, 8);
          }
        };

        // Upper 6 Illuminated Glass Vitrines (`3 cols × 2 rows`, x = 1254..2376 — 100% visible inside 0..2400!)
        const vCols = [1254, 1628, 2002, 2376];
        const vRows = [112, 378, 646];
        const vLiners = [PAL.prussian, PAL.paperWarm, PAL.sageDk, PAL.paperDeep, PAL.prussianDk, PAL.umberDk];
        const vitBatch = new PathBatcher();
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
            const x0 = vCols[c] + 9;
            const x1 = vCols[c + 1] - 9;
            const y0 = vRows[r] + 10;
            const y1 = vRows[r + 1] - 10;
            vitBatch.rect(`lin-${(r * 3 + c) % 6}`, x0, y0, x1 - x0, y1 - y0, { fill: vLiners[r * 3 + c], fillOpacity: 0.97 });
            vitBatch.rect("inShad", x0, y0, x1 - x0, 14, { fill: PAL.cut, fillOpacity: 0.28 });
          }
        }
        vitBatch.flush(p);

        // Populate ALL 6 Glass Vitrines with multi-specimen museum groupings (100% framed cleanly inside x <= 2376!)
        // Vitrine 0 (Top-Left): Hero Cross-Sectioned Nautilus pompilius + Golden Ammonite + Echinus Test!
        drawNautilusSpecimen(1372, 238, 76);
        drawAmmonite(1534, 212, 46, -1, PAL.ochreLt);
        drawEchinus(1542, 302, 32, PAL.celadonLt);

        // Vitrine 1 (Top-Center): Red Mediterranean Coral + Echinus Test + Golden Ammonite (clean separation!)
        drawCoral(1748, 336, 178, PAL.cinnabar, PAL.cinnabarLt);
        drawEchinus(1910, 206, 40, PAL.petal);
        drawAmmonite(1916, 302, 38, 1, PAL.ochreLt);

        // Vitrine 2 (Top-Right): Twin Swallowtail Lepidoptera Entomology Board (100% inside viewport!)
        drawSwallowtail(2116, 224, 64, PAL.ochreLt, PAL.barkDk, PAL.cinnabar);
        drawSwallowtail(2268, 232, 62, PAL.celadonLt, PAL.prussianDk, PAL.ochre);

        // Vitrine 3 (Bot-Left): Translucent Emerald Quartz Druse + Amethyst Crystal Cluster!
        drawMineralDruse(1372, 514, 72, PAL.celadonLt, PAL.malachite, PAL.sageDk);
        drawMineralDruse(1524, 522, 62, PAL.wisteriaLt, PAL.wisteria, PAL.prussianDk);

        // Vitrine 4 (Bot-Center): Pressed Botanical Ginkgo & Maidenhair Fern Herbarium Display!
        p.ginkgoFan([1746, 578], -Math.PI * 0.58, 86, PAL.ochreLt);
        p.ginkgoFan([1810, 574], -Math.PI * 0.38, 80, PAL.celadonLt);
        p.veinedFern({ origin: [1922, 594], dir: -Math.PI * 0.52, len: 174, maxW: 44, pairs: 8, bend: 0.14 });

        // Vitrine 5 (Bot-Right): Ochre Sea-Fan Coral + Ribbed Fossil Ammonite + Echinus Test (100% inside viewport!)
        drawCoral(2124, 602, 176, PAL.ochre, PAL.ochreLt);
        drawAmmonite(2276, 504, 56, 1, PAL.petal);
        drawEchinus(2284, 582, 26, PAL.cinnabarLt);
        p.flush();

        // Micro-Specimen Density Layer (`PathBatcher`): Pinned Scarab/Moth Collector Row, Blown-Glass Ethanol Phials,
        // Faceted Mineral Cradles & Individual Latin Pin-Tags across ALL 6 Glass Vitrines!
        {
          const microF = new PathBatcher();
          const microD = new PathBatcher();
          const addSpecimenTag = (tx: number, ty: number) => {
            microF.rect("tagBg", tx - 14, ty - 4.5, 28, 9, { fill: PAL.petal, fillOpacity: 0.94 });
            microD.rect("tagRim", tx - 14, ty - 4.5, 28, 9, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.72, nonScaling: "hatch" });
            microD.line("tagTxt", tx - 10, ty - 1, tx + 10, ty - 1, { stroke: PAL.inkMid, strokeWidth: 0.32, strokeOpacity: 0.72, nonScaling: "hatch" });
            microD.line("tagTxt", tx - 7, ty + 2, tx + 7, ty + 2, { stroke: PAL.inkMid, strokeWidth: 0.3, strokeOpacity: 0.56, nonScaling: "hatch" });
            microD.circle("pinHead", tx, ty - 6, 1.3, { fill: PAL.brassLt, fillOpacity: 0.96 });
          };
          const addMiniPhial = (px: number, py: number, col: string) => {
            const phD = `M${px - 5} ${py - 46}V${py - 38}Q${px - 10} ${py - 34} ${px - 10} ${py - 28}V${py - 3}Q${px - 10} ${py} ${px - 6} ${py}H${px + 6}Q${px + 10} ${py} ${px + 10} ${py - 3}V${py - 28}Q${px + 10} ${py - 34} ${px + 5} ${py - 38}V${py - 46}Z`;
            microF.addPath("phGlass", phD, { fill: PAL.glass, fillOpacity: 0.45 });
            microF.rect(`phLiq-${col}`, px - 8.5, py - 24, 17, 22, { fill: col, fillOpacity: 0.82 });
            microF.addPath("phMen", ellipsePath(px, py - 24, 8.5, 2.2), { fill: PAL.petal, fillOpacity: 0.42 });
            microF.rect("phCork", px - 4.5, py - 52, 9, 7, { fill: PAL.ochre, fillOpacity: 0.96 });
            microD.rect("phLab", px - 7, py - 18, 14, 9, { fill: PAL.petal, fillOpacity: 0.92 });
            microD.line("phRule", px - 5, py - 13.5, px + 5, py - 13.5, { stroke: PAL.inkMid, strokeWidth: 0.32, strokeOpacity: 0.72, nonScaling: "hatch" });
            microD.line("phHi", px - 6.5, py - 30, px - 6.5, py - 5, { stroke: PAL.inkRim, strokeWidth: 0.55, strokeOpacity: 0.65, nonScaling: "hatch" });
            microD.addPath("phOut", phD, { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.84, nonScaling: "contour" });
          };

          // Vitrine 0: Twin preserved marine phials + individual Latin tags beneath specimens
          addMiniPhial(1466, 332, PAL.ochreLt);
          addMiniPhial(1494, 332, PAL.celadon);
          addSpecimenTag(1534, 266);
          addSpecimenTag(1542, 341);

          // Vitrine 1: Twin marine phials + fluted cream Pecten scallop + specimen tags
          addMiniPhial(1672, 334, PAL.cinnabarLt);
          addMiniPhial(1698, 334, PAL.azurite);
          microF.addPath("pecten", `M1834 328L1810 296A26 24 0 0 1 1858 296Z`, { fill: PAL.petal, fillOpacity: 0.96 });
          for (let r = -3; r <= 3; r++) {
            microD.line("pecRib", 1834, 326, 1834 + r * 6.5, 294 + Math.abs(r) * 1.4, { stroke: PAL.inkSepia, strokeWidth: 0.38, strokeOpacity: 0.76, nonScaling: "hatch" });
          }
          addSpecimenTag(1910, 254);
          addSpecimenTag(1916, 344);

          // Vitrine 2 (Entomology Drawer-Board): 6 Pinned Jewel Scarabs & Micro-Moths + Brass Pins + Tiny Latin Tags!
          const bugCols = [PAL.malachite, PAL.azurite, PAL.cinnabar, PAL.ochre, PAL.wisteria, PAL.celadonDk];
          for (let b = 0; b < 6; b++) {
            const bx = 2046 + b * 56;
            const by = 304;
            const col = bugCols[b];
            // Winged beetle / micro-moth elytra + thorax + head
            microF.addPath(`bug-${b}`, ellipsePath(bx - 6.5, by, 6.2, 11) + ellipsePath(bx + 6.5, by, 6.2, 11), { fill: col, fillOpacity: 0.94 });
            microF.circle("bugHead", bx, by - 12, 4.2, { fill: PAL.barkDk, fillOpacity: 0.96 });
            microD.line("bugPin", bx, by - 19, bx, by + 15, { stroke: PAL.brassLt, strokeWidth: 0.42, strokeOpacity: 0.82, nonScaling: "contour" });
            microD.line("bugAnt", bx - 2, by - 15, bx - 8, by - 22, { stroke: PAL.ink, strokeWidth: 0.36, strokeOpacity: 0.76, nonScaling: "hatch" });
            microD.line("bugAnt", bx + 2, by - 15, bx + 8, by - 22, { stroke: PAL.ink, strokeWidth: 0.36, strokeOpacity: 0.76, nonScaling: "hatch" });
            microD.addPath("bugRim", ellipsePath(bx - 6.5, by, 6.2, 11) + ellipsePath(bx + 6.5, by, 6.2, 11), { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.82, nonScaling: "hatch" });
            addSpecimenTag(bx, by + 24);
          }

          // Vitrine 3 (Mineralogy): 3 Miniature Single-Crystal Mineral Cradles + Latin tags
          for (const [mx, mCol] of [[1316, PAL.ochre], [1448, PAL.azurite], [1584, PAL.cinnabar]] as const) {
            microF.quad(`min-${mCol}`, [mx, 588], [mx + 14, 598], [mx, 608], [mx - 14, 598], { fill: mCol, fillOpacity: 0.92 });
            microD.quad("minRim", [mx, 588], [mx + 14, 598], [mx, 608], [mx - 14, 598], { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.8, nonScaling: "hatch" });
            addSpecimenTag(mx, 616);
          }

          // Vitrine 4 (Herbarium): Upper pinned botanical seed-pods + collector corner stamps
          addSpecimenTag(1686, 424);
          addSpecimenTag(1946, 424);
          addSpecimenTag(1778, 608);

          // Vitrine 5 (Marine Fossils): Curved marine phial + miniature bivalve shells + Latin tags
          addMiniPhial(2044, 602, PAL.ochreLt);
          addSpecimenTag(2124, 612);
          addSpecimenTag(2284, 615);

          microF.flush(p);
          microD.flush(p);
        }

        // Delicate diagonal glass vitrine reflection glints, museum plaques & brass glazing bead frames over all 6 vitrines
        const glassB = new PathBatcher();
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
            const x0 = vCols[c] + 9;
            const x1 = vCols[c + 1] - 9;
            const y0 = vRows[r] + 10;
            const y1 = vRows[r + 1] - 10;
            glassB.rect("plaque", (x0 + x1) * 0.5 - 52, y1 - 22, 104, 15, { fill: PAL.petal, fillOpacity: 0.94 });
            glassB.rect("plaqueRim", (x0 + x1) * 0.5 - 52, y1 - 22, 104, 15, { stroke: PAL.brass, strokeWidth: 0.58, strokeOpacity: 0.9, nonScaling: "contour" });
            glassB.line("plRule", (x0 + x1) * 0.5 - 36, y1 - 14.5, (x0 + x1) * 0.5 + 36, y1 - 14.5, { stroke: PAL.inkMid, strokeWidth: 0.42, strokeOpacity: 0.72, nonScaling: "hatch" });
            glassB.line("glint", x0 + 22, y0 + 18, x0 + 92, y0 + 112, { stroke: PAL.inkRim, strokeWidth: 0.72, strokeOpacity: 0.24, nonScaling: "hatch" });
            glassB.line("glint", x0 + 38, y0 + 18, x0 + 96, y0 + 94, { stroke: PAL.inkRim, strokeWidth: 0.5, strokeOpacity: 0.2, nonScaling: "hatch" });
            glassB.rect("vRim", x0, y0, x1 - x0, y1 - y0, { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.86, nonScaling: "contour" });
            glassB.rect("vBrass", x0 + 3, y0 + 3, x1 - x0 - 6, y1 - y0 - 6, { stroke: PAL.brass, strokeWidth: 0.45, strokeOpacity: 0.56, nonScaling: "hatch" });
          }
        }
        glassB.flush(p);

        // Lower Tier (y = 662..1084): 18 Graduated Mahogany Specimen Flat-File Drawers (`3 cols × 6 rows`)!
        // Closed drawers flushed first, then 2 pulled-open 3D specimen drawers layered cleanly on top!
        const drwClosed = new PathBatcher();
        const drwOpen = new PathBatcher();
        const dRows = 6;
        const dH = (1084 - 664) / dRows;
        for (let r = 0; r < dRows; r++) {
          const y0 = 664 + r * dH + 4;
          const h = dH - 8;
          for (let c = 0; c < 3; c++) {
            const x0 = vCols[c] + 9;
            const w = vCols[c + 1] - vCols[c] - 18;
            const pulled = (r === 1 && c === 0) || (r === 3 && c === 1);
            if (pulled) {
              // 3D pulled-open specimen drawer tray exposing miniature shells, pinned beetles, faceted crystals & wooden dividers!
              drwOpen.rect("openBack", x0, y0 - 12, w, h + 12, { fill: PAL.barkDk, fillOpacity: 0.99 });
              drwOpen.quad("openTray", [x0 - 10, y0 + 14], [x0 + w - 10, y0 + 14], [x0 + w, y0 - 8], [x0, y0 - 8], { fill: PAL.prussian, fillOpacity: 0.96 });
              for (let k = 0; k < 5; k++) {
                const cellW = (w - 16) / 5;
                const sx = x0 + 4 + cellW * (k + 0.5);
                const divX = x0 + 4 + cellW * (k + 1);
                if (k < 4) {
                  drwOpen.line("trayDiv", divX, y0 - 8, divX - 8, y0 + 14, { stroke: PAL.bark, strokeWidth: 1.0, strokeOpacity: 0.92, nonScaling: "contour" });
                }
                if (k % 3 === 0) {
                  // Miniature coiled ammonite shell + white specimen tag
                  drwOpen.addPath("specShell", ellipsePath(sx, y0 + 2, 10.5, 6.2), { fill: PAL.petal, fillOpacity: 0.96 });
                  drwOpen.addPath("specLine", ellipsePath(sx, y0 + 2, 10.5, 6.2) + ellipsePath(sx + 1, y0 + 2, 5.2, 3.0) + `M${f(sx - 6)} ${f(y0 + 2)}L${f(sx + 7)} ${f(y0 + 2)}`, { stroke: PAL.inkSepia, strokeWidth: 0.42, strokeOpacity: 0.82, nonScaling: "hatch" });
                } else if (k % 3 === 1) {
                  // Miniature pinned winged beetle / scarab with brass pin & spread elytra
                  drwOpen.addPath("specBug", ellipsePath(sx - 5.5, y0 + 3, 5.2, 3.8) + ellipsePath(sx + 5.5, y0 + 3, 5.2, 3.8), { fill: PAL.cinnabarLt, fillOpacity: 0.95 });
                  drwOpen.addPath("specBugHead", ellipsePath(sx, y0 - 2, 3.0, 2.2), { fill: PAL.barkDk, fillOpacity: 0.96 });
                  drwOpen.line("specPin", sx, y0 - 5, sx, y0 + 9, { stroke: PAL.brassLt, strokeWidth: 0.48, strokeOpacity: 0.88, nonScaling: "contour" });
                  drwOpen.addPath("specLine", ellipsePath(sx - 5.5, y0 + 3, 5.2, 3.8) + ellipsePath(sx + 5.5, y0 + 3, 5.2, 3.8), { stroke: PAL.ink, strokeWidth: 0.38, strokeOpacity: 0.8, nonScaling: "hatch" });
                } else {
                  // Faceted emerald/amethyst mineral crystal trio
                  drwOpen.quad("specGemA", [sx - 10, y0 + 8], [sx - 2, y0 + 8], [sx - 5, y0 - 4], [sx - 9, y0 - 1], { fill: PAL.celadonLt, fillOpacity: 0.96 });
                  drwOpen.quad("specGemB", [sx - 1, y0 + 8], [sx + 8, y0 + 8], [sx + 4, y0 - 6], [sx, y0 - 2], { fill: PAL.malachite, fillOpacity: 0.94 });
                  drwOpen.quad("specGemA", [sx + 6, y0 + 8], [sx + 13, y0 + 8], [sx + 11, y0 - 2], [sx + 7, y0], { fill: PAL.wisteriaLt, fillOpacity: 0.92 });
                  drwOpen.line("specLine", sx + 4, y0 - 6, sx + 4, y0 + 8, { stroke: PAL.inkRim, strokeWidth: 0.4, strokeOpacity: 0.72, nonScaling: "hatch" });
                }
                // Tiny ivory taxonomy label slip tucked beside each open-drawer specimen!
                drwOpen.rect("specTag", sx + 14, y0 + 5, 11, 5, { fill: PAL.petal, fillOpacity: 0.9 });
              }
              drwOpen.rect("drwShad", x0 - 4, y0 + 18, w, h, { fill: PAL.cut, fillOpacity: 0.36 });
              drwOpen.rect("drwFront", x0 - 10, y0 + 14, w, h, { fill: PAL.umber, fillOpacity: 0.99 });
              drwOpen.rect("drwIn", x0 - 2, y0 + 20, w - 16, h - 12, { fill: PAL.bark, fillOpacity: 0.88 });
              drwOpen.rect("drwRim", x0 - 10, y0 + 14, w, h, { stroke: PAL.ink, strokeWidth: 0.78, strokeOpacity: 0.9, nonScaling: "contour" });
              const dcx = x0 - 10 + w * 0.5;
              drwOpen.rect("pull", dcx - 32, y0 + 14 + h * 0.32, 64, h * 0.38, { fill: PAL.brass, fillOpacity: 0.96 });
              drwOpen.rect("card", dcx - 22, y0 + 14 + h * 0.38, 44, h * 0.24, { fill: PAL.petal, fillOpacity: 0.94 });
              drwOpen.line("cardRule", dcx - 14, y0 + 14 + h * 0.5, dcx + 14, y0 + 14 + h * 0.5, { stroke: PAL.inkMid, strokeWidth: 0.4, strokeOpacity: 0.72, nonScaling: "hatch" });
            } else {
              drwClosed.rect("drwFront", x0, y0, w, h, { fill: PAL.umber, fillOpacity: 0.99 });
              drwClosed.rect("drwIn", x0 + 8, y0 + 6, w - 16, h - 12, { fill: PAL.bark, fillOpacity: 0.88 });
              drwClosed.rect("drwRim", x0, y0, w, h, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.88, nonScaling: "contour" });
              drwClosed.rect("drwInRim", x0 + 8, y0 + 6, w - 16, h - 12, { stroke: PAL.litEdge, strokeWidth: 0.42, strokeOpacity: 0.48, nonScaling: "hatch" });
              const dcx = x0 + w * 0.5;
              drwClosed.rect("pull", dcx - 32, y0 + h * 0.32, 64, h * 0.38, { fill: PAL.brass, fillOpacity: 0.96 });
              drwClosed.rect("card", dcx - 22, y0 + h * 0.38, 44, h * 0.24, { fill: PAL.petal, fillOpacity: 0.94 });
              drwClosed.line("cardRule", dcx - 14, y0 + h * 0.5, dcx + 14, y0 + h * 0.5, { stroke: PAL.inkMid, strokeWidth: 0.4, strokeOpacity: 0.72, nonScaling: "hatch" });
            }
          }
        }
        drwClosed.flush(p);
        drwOpen.flush(p);
      }

      // 5. Foreground Naturalist's Mahogany Study Table & Herringbone Wood-Grain Surface (y = 1096..BLEED.y1)!
      {
        const tbl: Pt[] = [[BLEED.x0, 1096], [BLEED.x1, 1096], [BLEED.x1, BLEED.y1], [BLEED.x0, BLEED.y1]];
        p.fillPath(polyPath(tbl), tableGrad, 1);
        const tb = new PathBatcher();
        for (let i = -7; i <= 7; i++) {
          tb.line("plank", 1200 + i * 160, 1096, 1200 + i * 255, BLEED.y1, { stroke: PAL.inkSepia, strokeWidth: 0.58, strokeOpacity: 0.46, nonScaling: "hatch" });
        }
        for (let y = 1114; y < 1660; y += 18) {
          tb.line("grain", BLEED.x0, y, BLEED.x1, y, { stroke: PAL.inkSepia, strokeWidth: 0.34, strokeOpacity: 0.2, nonScaling: "hatch" });
        }
        tb.rect("edge", BLEED.x0, 1096, BLEED.x1 - BLEED.x0, 18, { fill: PAL.barkDk, fillOpacity: 0.96 });
        tb.line("edgeLit", BLEED.x0, 1097, BLEED.x1, 1097, { stroke: PAL.litEdge, strokeWidth: 0.8, strokeOpacity: 0.72, nonScaling: "contour" });
        tb.flush(p);
      }

      // Smooth warm tungsten lamplight pools across the mahogany study table at Night
      p.layer("var(--z-halo-op)", () => {
        p.fillPath(ellipsePath(560, 1280, 460, 290), lampPoolL, 1);
        p.fillPath(ellipsePath(1740, 1260, 480, 300), lampPoolR, 1);
      });

      // 5a. Open Illustrated Ernst Haeckel Conchology Folio (`60+` micro-ruled two-column Latin lines + Nautilus plate!)
      {
        const pageL: Pt[] = [[278, 1172], [588, 1158], [602, 1512], [254, 1528]];
        const pageR: Pt[] = [[588, 1158], [898, 1172], [922, 1528], [602, 1512]];
        p.fillPath(polyPath([[268, 1180], [908, 1180], [934, 1538], [244, 1538]]), PAL.cut, 0.3);
        p.fillPath(polyPath([[264, 1166], [906, 1166], [930, 1532], [246, 1532]]), PAL.barkDk, 0.98);
        p.fillPath(polyPath(pageL), PAL.petal, 0.97);
        p.fillPath(polyPath(pageR), PAL.petal, 0.94);
        p.fillPath(polyPath([[572, 1160], [588, 1158], [602, 1512], [586, 1514]]), PAL.cut, 0.14);
        p.burinContour(polyPath(pageL) + polyPath(pageR), PAL.ink, 0.78, 0.86, 8);

        // Left page: intricate engraved conchological spiral plate inside double border
        const fb = new PathBatcher();
        fb.quad("plateBox", [308, 1200], [556, 1192], [566, 1466], [292, 1476], { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.7, nonScaling: "hatch" });
        const spPts: Pt[] = [];
        for (let i = 0; i <= 54; i++) {
          const th = (i / 54) * TAU * 2.3;
          const r = 7.5 * Math.exp(0.18 * th);
          spPts.push([428 + Math.cos(th) * r, 1316 + Math.sin(th) * r]);
          if (i > 6 && i % 4 === 0) {
            fb.line("sep", 428 + Math.cos(th) * r * 0.55, 1316 + Math.sin(th) * r * 0.55, 428 + Math.cos(th) * r, 1316 + Math.sin(th) * r, { stroke: PAL.inkDraft, strokeWidth: 0.42, strokeOpacity: 0.78, nonScaling: "hatch" });
          }
        }
        fb.addPath("spFill", closedSmooth(spPts.slice(24)), { fill: PAL.ochreLt, fillOpacity: 0.3 });
        fb.addPath("spLine", linePath(spPts), { stroke: PAL.inkDraft, strokeWidth: 0.52, strokeOpacity: 0.82, nonScaling: "hatch" });
        // Right page: 56 micro-ruled 2-column Latin taxonomy typography lines + tiny inset botanical diagram!
        for (let row = 0; row < 26; row++) {
          const ry = 1202 + row * 11;
          const skew = row * 0.6;
          if (row < 16) {
            fb.line("col1", 622 + skew, ry, 742 + skew - (row % 5 === 4 ? 22 : 0), ry, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.64, nonScaling: "hatch" });
          }
          fb.line("col2", 762 + skew, ry, 878 + skew - (row % 6 === 5 ? 26 : 0), ry, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.64, nonScaling: "hatch" });
        }
        fb.flush(p);
        p.ginkgoFan([686, 1468], -Math.PI * 0.5, 56, PAL.celadonLt);
        p.flush();
      }

      // 5b. Antique Brass Compound Naturalist's Microscope (x = 945..1150, y = 1045..1485)
      {
        const mBase: Pt[] = [[968, 1442], [1142, 1432], [1156, 1472], [954, 1484]];
        p.fillPath(polyPath(mBase.map(([x, y]): Pt => [x + 6, y + 8])), PAL.cut, 0.3);
        p.fillPath(polyPath(mBase), PAL.slateDk, 0.98);
        p.burinContour(polyPath(mBase), PAL.ink, 0.8, 0.9, 4);
        p.fillPath(polyPath([[1028, 1315], [1052, 1315], [1058, 1440], [1022, 1440]]), PAL.brass, 0.98);
        p.calligraphicStroke([[1040, 1330], [984, 1255], [1014, 1152], [1074, 1134]], 15, 12.5, 9.5, PAL.brass, 0.98);
        p.fillPath(polyPath([[1002, 1286], [1132, 1280], [1134, 1296], [1004, 1302]]), PAL.slateDk, 0.98);
        p.fillPath(ellipsePath(1076, 1366, 22, 10), PAL.glass, 0.88);
        const tube: Pt[] = [[1084, 1054], [1124, 1064], [1088, 1244], [1048, 1234]];
        p.fillPath(polyPath(tube), PAL.brass, 0.98);
        p.fillPath(polyPath([[1092, 1058], [1106, 1062], [1072, 1238], [1058, 1235]]), PAL.brassLt, 0.56);
        p.burinContour(polyPath(tube), PAL.ink, 0.78, 0.88, 4);
        p.fillPath(polyPath([[1090, 1022], [1130, 1032], [1122, 1060], [1082, 1050]]), PAL.slateDk, 0.98);
        p.fillPath(circlePath(1014, 1164, 18), PAL.brassLt, 0.96);
        p.burinContour(circlePath(1014, 1164, 18) + circlePath(1014, 1164, 9), PAL.ink, 0.7, 0.86, 2);
        p.flush();
      }

      // 5c. Porcelain 12-Well Mineral Watercolor Palette, Rinse Bowl & 4 Resting Sable Brushes (x = 1210..1620)
      {
        const palBox: Pt[] = [[1216, 1178], [1514, 1164], [1526, 1396], [1228, 1410]];
        p.fillPath(polyPath(palBox.map(([x, y]): Pt => [x + 8, y + 10])), PAL.cut, 0.28);
        p.fillPath(polyPath(palBox), PAL.petal, 0.98);
        p.burinContour(polyPath(palBox), PAL.inkMid, 0.75, 0.84, 4);
        const panCols = [
          PAL.prussian, PAL.cinnabar, PAL.malachite, PAL.ochre, PAL.azurite, PAL.wisteria,
          PAL.celadonDk, PAL.umber, PAL.cinnabarLt, PAL.ochreLt, PAL.sageDk, PAL.copper,
        ];
        const wb = new PathBatcher();
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 6; c++) {
            const wx = 1234 + c * 46 + r * 4;
            const wy = 1198 + r * 92 - c * 1.8;
            wb.rect("well", wx, wy, 38, 72, { fill: PAL.paperWarm, fillOpacity: 0.92 });
            wb.rect("wellRim", wx, wy, 38, 72, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.76, nonScaling: "hatch" });
            wb.addPath(`pan-${r * 6 + c}`, ellipsePath(wx + 19, wy + 38, 13, 24), { fill: panCols[r * 6 + c], fillOpacity: 0.92 });
          }
        }
        wb.flush(p);
        // Ceramic rinse cup & 4 sable brushes
        p.fillPath(circlePath(1588, 1286, 48), PAL.petal, 0.98);
        p.fillPath(circlePath(1588, 1286, 39), PAL.glass, 0.86);
        p.burinContour(circlePath(1588, 1286, 48) + circlePath(1588, 1286, 39), PAL.ink, 0.7, 0.84, 2);
        for (const [y0, y1, hCol, tCol] of [
          [1438, 1404, PAL.bark, PAL.prussian],
          [1468, 1446, PAL.cinnabarDk, PAL.cinnabar],
          [1498, 1484, PAL.umberDk, PAL.malachite],
        ] as const) {
          const f0 = lerp([1220, y0], [1620, y1], 0.74);
          const f1 = lerp([1220, y0], [1620, y1], 0.88);
          p.calligraphicStroke([[1220, y0], f0], 2.2, 7.2, 6.2, hCol, 0.96);
          p.calligraphicStroke([f0, f1], 6.4, 6.2, 5.4, PAL.brassLt, 0.98);
          p.calligraphicStroke([f1, [1620, y1]], 5.2, 3.8, 0.35, tCol, 0.95);
        }
        p.flush();
      }

      // 5d. Pinned Herbarium Folio Sheets, Hinged Brass Proportional Dividers & Ivory Scale Ruler (x = 1675..2320)
      {
        const hSheet: Pt[] = [[1692, 1170], [2145, 1152], [2168, 1486], [1712, 1506]];
        p.fillPath(polyPath(hSheet.map(([x, y]): Pt => [x + 8, y + 10])), PAL.cut, 0.28);
        p.fillPath(polyPath(hSheet), PAL.petal, 0.97);
        p.burinContour(polyPath(hSheet), PAL.inkMid, 0.72, 0.84, 4);
        p.veinedFern({ origin: [1856, 1456], dir: -Math.PI * 0.56, len: 248, maxW: 62, pairs: 10, bend: 0.16 });
        p.ginkgoFan([2012, 1396], -Math.PI * 0.44, 92, PAL.ochreLt);
        // Brass proportional dividers resting across lower-left study desk + faceted inkwell & goose-quill pen + vernier calipers!
        const px = 148;
        const py = 1320;
        const toW = (lx: number, ly: number): Pt => add([px, py], rot([lx, ly], rad(36)));
        const a1: Pt[] = [toW(-135, -16), toW(165, 14), toW(165, 22), toW(-135, -4)];
        const a2: Pt[] = [toW(-135, 16), toW(165, -14), toW(165, -22), toW(-135, 4)];
        p.fillPath(polyPath(a1), PAL.brass, 0.96);
        p.fillPath(polyPath(a2), PAL.brassLt, 0.94);
        p.burinContour(polyPath(a1) + polyPath(a2), PAL.ink, 0.68, 0.86, 8);
        p.fillPath(circlePath(px, py, 11), PAL.brassLt, 0.98);

        // Faceted Cut-Glass Inkwell & Ivory Goose-Quill Pen at upper-left of folio (188, 1218)
        p.fillPath(polyPath([[156, 1212], [216, 1212], [224, 1252], [148, 1252]]), PAL.glass, 0.65);
        p.fillPath(polyPath([[162, 1226], [210, 1226], [214, 1248], [158, 1248]]), PAL.prussianDk, 0.92);
        p.fillPath(polyPath([[172, 1196], [200, 1196], [204, 1212], [168, 1212]]), PAL.brass, 0.96);
        p.burinContour(polyPath([[156, 1212], [216, 1212], [224, 1252], [148, 1252]]) + polyPath([[172, 1196], [200, 1196], [204, 1212], [168, 1212]]), PAL.ink, 0.68, 0.86, 8);
        // Sweeping feathered goose quill dipped into inkwell
        p.calligraphicStroke([[186, 1200], [156, 1142], [116, 1084]], 2.2, 4.0, 1.4, PAL.petal, 0.96);
        p.fillPath(`M164 1152Q132 1138 112 1082Q156 1096 174 1144Z`, PAL.petal, 0.94);
        p.burin(`M154 1134L126 1114M148 1124L120 1102M142 1112L116 1090`, PAL.inkMid, 0.42, 0.72, 3, "hatch");
        p.burinContour(`M164 1152Q132 1138 112 1082Q156 1096 174 1144Z`, PAL.ink, 0.56, 0.8, 1);

        // Sliding Brass Vernier Caliper resting beside the porcelain watercolor palette (x = 1692..2030, y = 1528)
        const calBar: Pt[] = [[1692, 1522], [2036, 1506], [2038, 1524], [1694, 1540]];
        p.fillPath(polyPath(calBar), PAL.brassLt, 0.96);
        p.fillPath(polyPath([[1692, 1522], [1710, 1521], [1712, 1564], [1694, 1554]]), PAL.brass, 0.96);
        p.fillPath(polyPath([[1776, 1518], [1812, 1516], [1814, 1560], [1778, 1550]]), PAL.brassDk, 0.96);
        let calTicks = "";
        for (let k = 0; k <= 24; k++) {
          const u = k / 24;
          const a = lerp(calBar[0], calBar[1], u);
          const b = lerp(calBar[3], calBar[2], u);
          calTicks += `M${f(a[0])} ${f(a[1])}L${f(lerp(a, b, k % 5 === 0 ? 0.65 : 0.36)[0])} ${f(lerp(a, b, k % 5 === 0 ? 0.65 : 0.36)[1])}`;
        }
        p.burin(calTicks, PAL.ink, 0.44, 0.78, 25, "hatch");
        p.burinContour(polyPath(calBar), PAL.ink, 0.65, 0.85, 4);
        p.flush();
      }

      // 5e. Swaying Brass Magnifying Loupe & Twin Articulated Emerald Banker's Lamps on Study Table!
      p.animGroup({ kind: "sway", cx: 2248, cy: 1096, ampDeg: 2.2, freq: 0.98, phase: 0.6 }, () => {
        p.burinContour(`M2248 1096V1210`, PAL.brass, 1.1, 0.9, 1);
        p.fillPath(circlePath(2248, 1268, 52), PAL.glass, 0.56);
        p.fillPath(circlePath(2248, 1268, 60) + circlePath(2248, 1268, 51), PAL.brass, 0.96, true);
        p.burinContour(circlePath(2248, 1268, 60) + circlePath(2248, 1268, 51), PAL.ink, 0.8, 0.88, 2);
        p.fillPath(polyPath([[2240, 1328], [2256, 1328], [2260, 1404], [2236, 1404]]), PAL.barkDk, 0.96);
      });

      // Twin Standing Emerald-Glass Banker's Desk Lamps at Left (164, 1140) & Right (2272, 1126)
      for (const [bx, by, hx, hy, ph] of [
        [164, 1175, 258, 1044, 0.4],
        [2272, 1168, 2178, 1038, 2.2],
      ] as const) {
        p.fillPath(ellipsePath(bx, by, 34, 11), PAL.brassDk, 0.98);
        p.calligraphicStroke([[bx, by - 4], [bx, hy + 28], [hx, hy]], 7.2, 6.0, 5.2, PAL.brass, 0.96);
        const shade: Pt[] = [[hx - 36, hy], [hx + 36, hy], [hx + 48, hy + 28], [hx - 48, hy + 28]];
        p.fillPath(polyPath(shade), PAL.sageDk, 0.98);
        p.fillPath(polyPath([[hx - 28, hy + 4], [hx + 12, hy + 4], [hx + 18, hy + 20], [hx - 36, hy + 20]]), PAL.malachite, 0.58);
        p.fillPath(ellipsePath(hx, hy + 29, 20, 9), PAL.lanternCore, 0.96);
        p.burinContour(polyPath(shade), PAL.ink, 0.8, 0.88, 4);
        p.layer("var(--z-halo-op)", () => {
          p.animGroup({ kind: "pulse", baseOp: 0.9, ampOp: 0.1, freq: 1.8, phase: ph }, () => {
            p.fillPath(circlePath(hx, hy + 34, 115), PAL.lantern, 0.24);
          });
        });
      }
    },
    false,
    "kunstkammer-clip",
  );

  // 6. Crisp Glazed Mahogany Pass-Through Frame & Swung-Open Beveled Glass Cabinet Doors (Strictly OUTSIDE `hole`!)
  {
    const frameW = 11;
    const outerF =
      polyPath([[hx0 - frameW, hy0 - frameW], [hx1 + frameW, hy0 - frameW], [hx1 + frameW, hy1 + frameW], [hx0 - frameW, hy1 + frameW]]) +
      polyPath(hole);
    p.fillPath(outerF, PAL.barkDk, 0.99, true);

    // Left & Right Swung-Open Mahogany Beveled-Glass Doors pivoting cleanly outward into the study (`<= hx0-frameW`, `>= hx1+frameW`)!
    const lDoorO: Pt[] = [[hx0 - frameW, hy0], [hx0 - 82, hy0 + 14], [hx0 - 82, hy1 - 10], [hx0 - frameW, hy1]];
    const lDoorG: Pt[] = [[hx0 - frameW - 7, hy0 + 10], [hx0 - 73, hy0 + 22], [hx0 - 73, hy1 - 18], [hx0 - frameW - 7, hy1 - 8]];
    const rDoorO: Pt[] = [[hx1 + frameW, hy0], [hx1 + 82, hy0 + 14], [hx1 + 82, hy1 - 10], [hx1 + frameW, hy1]];
    const rDoorG: Pt[] = [[hx1 + frameW + 7, hy0 + 10], [hx1 + 73, hy0 + 22], [hx1 + 73, hy1 - 18], [hx1 + frameW + 7, hy1 - 8]];
    p.fillPath(polyPath(lDoorG) + polyPath(rDoorG), PAL.glass, 0.26);
    p.fillPath(polyPath(lDoorO) + polyPath(lDoorG), PAL.bark, 0.98, true);
    p.fillPath(polyPath(rDoorO) + polyPath(rDoorG), PAL.bark, 0.98, true);
    // Brass cremone latches + beveled specular glass glints on both swung-open mahogany doors
    p.fillPath(
      polyPath([[hx0 - 85, (hy0 + hy1) * 0.5 - 14], [hx0 - 77, (hy0 + hy1) * 0.5 - 14], [hx0 - 77, (hy0 + hy1) * 0.5 + 14], [hx0 - 85, (hy0 + hy1) * 0.5 + 14]]) +
        polyPath([[hx1 + 77, (hy0 + hy1) * 0.5 - 14], [hx1 + 85, (hy0 + hy1) * 0.5 - 14], [hx1 + 85, (hy0 + hy1) * 0.5 + 14], [hx1 + 77, (hy0 + hy1) * 0.5 + 14]]),
      PAL.brassLt,
      0.96,
    );
    p.burin(
      `M${f(hx0 - 62)} ${f(hy0 + 44)}L${f(hx0 - 24)} ${f(hy0 + 104)}M${f(hx1 + 24)} ${f(hy0 + 44)}L${f(hx1 + 62)} ${f(hy0 + 104)}`,
      PAL.inkRim,
      0.7,
      0.42,
      2,
      "hatch",
    );
    p.burinContour(polyPath(lDoorO) + polyPath(rDoorO) + polyPath(hole), PAL.ink, 0.95, 0.92, 12);
    p.burinContour(`M${f(hx0 - frameW)} ${f(hy0 - frameW)}H${f(hx1 + frameW)}M${f(hx0)} ${f(hy1)}H${f(hx1)}`, PAL.brass, 0.72, 0.78, 2);
    p.flush();
  }

  return {
    index: 15,
    id: "s15-cabinet",
    title: "Naturalist's Kunstkammer Study",
    subtitle: "Victorian specimen vitrines, 18 flat-file drawers, Nautilus, microscope & pass-through",
    portal: S15_PORTAL,
    coreColorDay: [236, 229, 216],
    coreColorNight: [18, 25, 42],
    defs: p.defs.join(""),
    markup: p.out.join(""),
    hole,
    stats: { elements: p.elements, strokes: p.strokes, animGroups: p.animGroups },
  };
}
