// S17: Architect's 2 AM High-Rise Folio Library & Swung-Open Miesian Chicago Window (Stage-5 5x Micro-Craft!)
// Matching kiuzyx_status_2125557547205792031_0.jpg interior micro-density while seamlessly closing s17 -> s00:
//   - 6 Floor-to-Ceiling Architectural Bookcase Bays (`denseBookshelf` × 6 = 450+ ultra-crisp 3–8px vertical
//     spines, horizontal folio stacks, archival ring binders with white labels & finger holes, rolling brass
//     library ladder & ceiling studio track downlights).
//   - Left Studio Pier: Chrome slotted binder rack (`denseBookshelf` chromeRack!), red Swiss modernist geometric
//     poster, Technics-style direct-drive turntable (strobe platter dots + curved S-tonearm + counterweight +
//     glowing red strobe), `denseAudioRack` (5U anodized faceplates, dual amber VU meters, rotary knobs w/ ticks,
//     12-band EQ faders, 24-jack patch bay), and 28 upright colorful vinyl LP sleeves!
//   - Hero Swung-Open Dark-Bronze Miesian Chicago Casement Window (`403x269px` open bay at (880, 580) -> 0px
//     frame crop on day-o00.png!): upper transom & flanking sidelights rendered with `curtainSkyscraper3D` &
//     `brickLoftBuilding3D` (`3–5px` micro-windows matching Stage-5 s00 Chicago!), overhead slatted horizontal
//     blinds, 3D swung-open steel casement sashes with brass latches, deep mitered oak/limestone sill, bronze
//     radiator grille & 4 slim flat-file blueprint drawers + stacked monographs!
//   - Potted 5-tone `stippleTreeCluster` Indoor Olive Tree (`180+` velvety dabs + peeking woody trunk/forks!).
//   - Rich Foreground Architect's Drafting Table (y = 1044..1880): wood-strip parquet edge, ultra-dense Chicago
//     city masterplan & tower elevation blueprint (`160+` micro street-grid & fenestration lines via PathBatcher!),
//     wooden T-square, 30-60 triangle, brass scale ruler, 7-tower stepped Miesian massing model with micro-windows,
//     rotating brass library globe (`rotate`), 60-line 2-column open architecture monograph, coffee mug w/ drifting
//     steam (`drift`), drafting pen cup & swing-arm architect's lamp casting a volumetric tungsten cone at 2 AM!

import {
  PAL,
  Painter,
  PathBatcher,
  brickLoftBuilding3D,
  circlePath,
  curtainSkyscraper3D,
  denseAudioRack,
  denseBookshelf,
  ellipsePath,
  f,
  lerp,
  linearTone,
  polyPath,
  rad,
  rand,
  rectWindowHole,
  stippleTreeCluster,
  trussBridgeSpan,
  type Pt,
} from "../kit.ts";
import {
  BLEED,
  requiredPortalClearBox,
  validatePortalHole,
  type OctaveScene,
  type PortalSpec,
} from "./types.ts";

export const S17_PORTAL: PortalSpec = { cx: 880, cy: 580, rx: 202, ry: 135 };
const NEXT_PORTAL: readonly [number, number] = [1540, 880]; // s00-chicago

export function buildS17Library(): OctaveScene {
  const p = new Painter("s17", 17523);

  const clearBox = requiredPortalClearBox(S17_PORTAL, NEXT_PORTAL);
  // Crisp open central casement bay centered on S17_PORTAL: x=[678.8..1081.8] (403px), y=[445.4..714.4] (269px)
  // Encloses 236x160 clearBox, stays inside 484x328 sealBox, AND clears all 4 edges at S=6 (`day-o00.png` 0px crop)!
  const hole = rectWindowHole(clearBox, {
    padL: 106,
    padR: 61,
    padTop: 60,
    padBot: 49,
    chamfer: 0,
  });
  validatePortalHole("s17-library", hole, S17_PORTAL, NEXT_PORTAL);

  const holeX0 = hole[0][0]; // ~678.8
  const holeX1 = hole[1][0]; // ~1081.8
  const holeY0 = hole[0][1]; // ~445.4
  const holeY1 = hole[2][1]; // ~714.4

  // Overall monumental Miesian studio casement bay resting on a deep mitered sill at y = 724
  const winX0 = 468;
  const winX1 = 1258;
  const winY0 = 112;
  const sillY = holeY1 + 9; // ~723.4

  const wallGrad = p.linearGrad("wall", BLEED.x0, BLEED.y0, BLEED.x1, 1180, [
    [0, PAL.paperWarm],
    [0.42, PAL.paperDeep],
    [0.82, PAL.paperStone],
    [1, PAL.paperShadow],
  ]);
  const skyGrad = p.linearGrad("sky", winX0, winY0, winX0, sillY, [
    [0, PAL.glass],
    [0.54, PAL.paperMist],
    [1, PAL.paperWarm],
  ]);

  // Smooth zero-filter tungsten pools & diagonal volumetric desk-lamp beam for 2 AM studio lighting!
  const deskLampGrad = p.radialGrad("desk-lamp", 1480, 1220, 860, [
    [0, PAL.lanternCore, 0.36],
    [0.28, PAL.lantern, 0.24],
    [0.62, PAL.lanternHalo, 0.12],
    [0.86, PAL.lanternHalo, 0.04],
    [1, PAL.lanternHalo, 0],
  ]);
  const lampConeGrad = p.linearGrad("lamp-cone", 1960, 995, 1840, 1440, [
    [0, PAL.lanternCore, 0.46],
    [0.36, PAL.lantern, 0.24],
    [0.78, PAL.lanternHalo, 0.08],
    [1, PAL.lanternHalo, 0],
  ]);
  const bulbGlowGrad = p.radialGrad("bulb-glow", 1970, 1004, 155, [
    [0, PAL.lanternCore, 0.62],
    [0.34, PAL.lantern, 0.3],
    [0.7, PAL.lanternHalo, 0.1],
    [1, PAL.lanternHalo, 0],
  ]);
  const shelfGlows = [1460, 1740, 2020, 2300, 2560].map((gx, i) =>
    p.radialGrad(`sg${i}`, gx, 175, 210, [
      [0, PAL.lanternCore, 0.36],
      [0.35, PAL.lantern, 0.18],
      [0.72, PAL.lanternHalo, 0.06],
      [1, PAL.lanternHalo, 0],
    ]),
  );

  // 1. Opaque full-bleed warm studio plaster interior punched cleanly by the open central casement bay
  p.asymmetricPortalBackdrop(hole, wallGrad, { smooth: false });

  p.clippedToBackdrop(
    hole,
    () => {
      // 1a. High-Density `@kiuzyx` Continuing Chicago Skyline Behind Upper Transom & Left/Right Sidelights!
      //     Built with `curtainSkyscraper3D` & `brickLoftBuilding3D` (`3-5px` recessed micro-windows) aligned
      //     directly with Stage-5 `s00-chicago` below!
      p.fillPath(polyPath([[winX0, winY0], [winX1, winY0], [winX1, sillY], [winX0, sillY]]), skyGrad, 1);

      p.layer("var(--z-star-op)", () => {
        let stars = "";
        for (let i = 0; i < 42; i++) {
          stars += `M${f(rand(p.r, winX0 + 14, winX1 - 14))} ${f(rand(p.r, winY0 + 88, holeY0 - 16))}h0.2`;
        }
        p.burinContour(stars, PAL.inkDraft, 1.15, 0.72, 42);
      });

      // Clip exterior Chicago skyscrapers cleanly to `[winX0..winX1, winY0..sillY]` so zero tower overflows into studio!
      const skyClip = p.gradId("win-sky-clip");
      p.defs.push(`<clipPath id="${skyClip}"><rect x="${winX0}" y="${winY0}" width="${winX1 - winX0}" height="${f(sillY - winY0)}"/></clipPath>`);
      p.flush();
      p.out.push(`<g clip-path="url(#${skyClip})">`);

      // Upper Transom & Background 3D Curtain-Wall Skyscrapers (`14–22` cols × `24–38` floors!)
      curtainSkyscraper3D(p, {
        cx: 545, topY: 196, baseY: 545, wL: 82, wR: 62, colsL: 12, colsR: 9, rows: 32,
        wallL: PAL.paperWarm, wallR: PAL.paperShadow, glassL: PAL.prussian, glassR: PAL.prussianDk, litChance: 0.28, roofDetail: "penthouse",
      });
      curtainSkyscraper3D(p, {
        cx: 656, topY: 184, baseY: 535, wL: 74, wR: 68, colsL: 12, colsR: 10, rows: 34,
        wallL: PAL.slateDk, wallR: PAL.prussianDk, glassL: PAL.prussianDk, glassR: PAL.ink, litChance: 0.36, roofDetail: "spire",
      });
      curtainSkyscraper3D(p, {
        cx: 794, topY: 204, baseY: 468, wL: 86, wR: 72, colsL: 14, colsR: 11, rows: 26,
        wallL: PAL.paperStone, wallR: PAL.slate, glassL: PAL.prussian, glassR: PAL.prussianDk, litChance: 0.26, roofDetail: "watertank",
      });
      curtainSkyscraper3D(p, {
        cx: 942, topY: 188, baseY: 468, wL: 92, wR: 76, colsL: 15, colsR: 12, rows: 28,
        wallL: PAL.prussian, wallR: PAL.prussianDk, glassL: PAL.slateDk, glassR: PAL.ink, litChance: 0.34, setback: { fracH: 0.34, inset: 0.24 }, roofDetail: "hvac",
      });
      curtainSkyscraper3D(p, {
        cx: 1175, topY: 182, baseY: 560, wL: 96, wR: 88, colsL: 15, colsR: 13, rows: 36,
        wallL: PAL.slateDk, wallR: PAL.prussianDk, glassL: PAL.prussianDk, glassR: PAL.ink, litChance: 0.38, roofDetail: "penthouse",
      });

      // Left Sidelight Dense Riverfront Canyon: Skyscraper + Steel Bascule Truss Bridge + Brick Loft matching S00!
      p.fillPath(polyPath([[winX0, 520], [holeX0 + 4, 520], [holeX0 + 4, sillY], [winX0, sillY]]), PAL.waterDeep, 0.94);
      p.fillPath(polyPath([[winX0, 514], [holeX0 + 4, 514], [holeX0 + 4, 524], [winX0, 524]]), PAL.paperStone, 0.96);
      // Mid-ground Chicago curtain-wall riverfront tower rising from quay behind the bascule truss bridge
      curtainSkyscraper3D(p, {
        cx: 624, topY: 452, baseY: 572, wL: 48, wR: 42, colsL: 8, colsR: 7, rows: 14,
        wallL: PAL.paperWarm, wallR: PAL.paperShadow, glassL: PAL.prussian, glassR: PAL.prussianDk, litChance: 0.32, roofDetail: "hvac",
      });
      // Crisp broken-stroke teal/slate horizontal reflections across river channel
      const rwB = new PathBatcher();
      for (let r = 0; r < 14; r++) {
        const wy = 532 + r * 12.5;
        rwB.line("rw1", winX0 + 10 + (r % 3) * 14, wy, holeX0 - 18 - (r % 2) * 16, wy, { stroke: PAL.water, strokeWidth: 0.72, strokeOpacity: 0.62, nonScaling: "hatch" });
        rwB.line("rw2", winX0 + 28 + (r % 2) * 22, wy + 5, holeX0 - 8 - (r % 3) * 10, wy + 5, { stroke: PAL.waterShimmer, strokeWidth: 0.48, strokeOpacity: 0.56, nonScaling: "hatch" });
      }
      rwB.flush(p);
      // Lacy riveted Chicago bascule steel truss bridge spanning the river channel inside the left sidelight!
      trussBridgeSpan(p, {
        p0: [winX0 - 4, 566],
        p1: [holeX0 + 8, 558],
        depth: 22,
        bays: 9,
        kind: "warren",
        steelColor: PAL.cinnabarDk,
        highlightColor: PAL.paperWarm,
        deck: true,
        piers: 2,
        groundY: 618,
      });
      brickLoftBuilding3D(p, {
        cx: 526, topY: 544, baseY: sillY + 12, wL: 74, wR: 54, colsL: 6, colsR: 5, floors: 8,
        wallL: PAL.cinnabar, wallR: PAL.cinnabarDk, trimColor: PAL.paperStone, litChance: 0.38, groundFloor: false,
      });
      brickLoftBuilding3D(p, {
        cx: 642, topY: 618, baseY: sillY + 12, wL: 48, wR: 42, colsL: 4, colsR: 4, floors: 5,
        wallL: PAL.paperStone, wallR: PAL.slate, trimColor: PAL.paperWarm, litChance: 0.32, groundFloor: false,
      });

      // Right Sidelight Terracotta Chicago Loft matching S00's right edge!
      brickLoftBuilding3D(p, {
        cx: 1168, topY: 504, baseY: sillY + 12, wL: 86, wR: 92, colsL: 7, colsR: 7, floors: 8,
        wallL: PAL.cinnabar, wallR: PAL.cinnabarDk, trimColor: PAL.paperStone, litChance: 0.36, groundFloor: false,
      });

      // Pulled-up Slatted Horizontal Architectural Blinds across upper transom (`y = winY0..winY0 + 82`)
      const blindBot = winY0 + 82;
      const bl = new PathBatcher();
      bl.rect("blindBg", winX0, winY0, winX1 - winX0, 82, { fill: PAL.paperStone, fillOpacity: 0.96 });
      for (let sy = winY0 + 8; sy <= blindBot; sy += 8) {
        bl.line("slat", winX0, sy, winX1, sy, { stroke: PAL.inkMid, strokeWidth: 0.45, strokeOpacity: 0.65, nonScaling: "hatch" });
      }
      for (const lx of [winX0 + 84, holeX0 + 104, holeX1 - 104, winX1 - 80]) {
        bl.line("tape", lx, winY0, lx, blindBot, { stroke: PAL.inkMid, strokeWidth: 0.55, strokeOpacity: 0.65, nonScaling: "hatch" });
      }
      bl.line("botBar", winX0, blindBot, winX1, blindBot, { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.86, nonScaling: "contour" });
      bl.flush(p);

      p.out.push(`</g>`);

      // 1b. Deep Mitered Oak/Limestone Window Sill & Architectural Radiator + 4-Drawer Flat-File Credenza (`y = sillY..1044`)!
      {
        const credY0 = sillY + 22;
        const credY1 = 1044;
        const cb = new PathBatcher();
        cb.rect("carcass", winX0 - 24, credY0, winX1 - winX0 + 48, credY1 - credY0, { fill: PAL.bark, fillOpacity: 0.99 });
        cb.rect("inBack", winX0 - 12, credY0 + 12, winX1 - winX0 + 24, credY1 - credY0 - 22, { fill: PAL.umberDk, fillOpacity: 0.95 });
        cb.rect("carcassRim", winX0 - 24, credY0, winX1 - winX0 + 48, credY1 - credY0, { stroke: PAL.ink, strokeWidth: 0.82, strokeOpacity: 0.88, nonScaling: "contour" });

        // Bronze vertical-fin architectural radiator grille on left half (`x = 478..804`)
        const radX0 = winX0 + 10;
        const radX1 = holeX0 + 124;
        const radY0 = credY0 + 24;
        const radY1 = credY1 - 22;
        cb.rect("radBg", radX0, radY0, radX1 - radX0, radY1 - radY0, { fill: PAL.slateDk, fillOpacity: 0.98 });
        cb.rect("radBgRim", radX0, radY0, radX1 - radX0, radY1 - radY0, { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.88, nonScaling: "contour" });
        for (let lx = radX0 + 9; lx < radX1 - 6; lx += 8.5) {
          cb.line("fin", lx, radY0 + 7, lx, radY1 - 7, { stroke: PAL.slateLt, strokeWidth: 0.55, strokeOpacity: 0.62, nonScaling: "hatch" });
        }

        // Right half: 4 slim horizontal architectural flat-file blueprint drawers + lower folio cubby!
        const cubX0 = radX1 + 22;
        const cubX1 = winX1 - 8;
        cb.rect("cubBg", cubX0, radY0, cubX1 - cubX0, radY1 - radY0, { fill: PAL.barkDk, fillOpacity: 0.97 });
        for (let d = 0; d < 4; d++) {
          const dy0 = radY0 + 6 + d * 32;
          const dmx = (cubX0 + cubX1) * 0.5;
          cb.rect("drw", cubX0 + 7, dy0, cubX1 - cubX0 - 14, 27, { fill: PAL.umber, fillOpacity: 0.98 });
          cb.rect("drwRim", cubX0 + 7, dy0, cubX1 - cubX0 - 14, 27, { stroke: PAL.ink, strokeWidth: 0.58, strokeOpacity: 0.86, nonScaling: "contour" });
          cb.rect("pull", dmx - 24, dy0 + 8, 48, 10, { fill: PAL.brass, fillOpacity: 0.95 });
          cb.rect("lbl", dmx - 16, dy0 + 10, 32, 6, { fill: PAL.petal, fillOpacity: 0.92 });
        }
        // Lower cubby: horizontal folio stacks + upright architectural monographs
        const fCols = [PAL.prussian, PAL.cinnabar, PAL.petal, PAL.ochre, PAL.sageDk, PAL.azurite];
        for (let k = 0; k < 6; k++) {
          const fy = radY1 - 10 - k * 17;
          cb.rect(`fl-${k}`, cubX0 + 14, fy - 13, 210, 12, { fill: fCols[k], fillOpacity: 0.96 });
          cb.rect("folioRim", cubX0 + 14, fy - 13, 210, 12, { stroke: PAL.ink, strokeWidth: 0.48, strokeOpacity: 0.78, nonScaling: "hatch" });
        }
        for (let u = 0; u < 11; u++) {
          const ux = cubX0 + 236 + u * 16;
          if (ux + 14 > cubX1 - 10) break;
          const uh = 78 + (u % 4) * 9;
          cb.rect(`up-${u % 6}`, ux, radY1 - 10 - uh, 14, uh, { fill: fCols[(u + 2) % fCols.length], fillOpacity: 0.96 });
          cb.rect("folioRim", ux, radY1 - 10 - uh, 14, uh, { stroke: PAL.ink, strokeWidth: 0.42, strokeOpacity: 0.74, nonScaling: "hatch" });
        }
        cb.flush(p);
      }

      // Ceiling architectural soffit with track-lighting rail & left plaster return pier
      p.fillPath(polyPath([[BLEED.x0, BLEED.y0], [BLEED.x1, BLEED.y0], [BLEED.x1, 78], [BLEED.x0, 78]]), PAL.paperStone, 0.98);
      p.burinContour(`M${BLEED.x0} 78H${BLEED.x1}`, PAL.inkMid, 0.72, 0.65, 1);
      p.fillPath(polyPath([[414, 78], [winX0, 78], [winX0, 1044], [414, 1044]]), PAL.paperDeep, 0.96);
      p.burinContour(`M414 78V1044`, PAL.inkMid, 0.62, 0.56, 1);
      p.flush();

      // 2. Left Studio Pier (`x = -120..414`):
      //    - Slotted Chrome Studio Shelf (`denseBookshelf` chromeRack w/ binders!)
      //    - Bold Red Swiss Modernist Geometric Poster (`kiuzyx_...031_0.jpg` homage)
      //    - Technics Direct-Drive Strobe Turntable + `denseAudioRack` (5U Hi-Fi/Synth Gear) + 28 Vinyl LP Sleeves!
      denseBookshelf(p, { x: -120, y: 78, w: 328, h: 964 }, {
        shelves: 7,
        chromeRack: true,
        binders: true,
        spinePalette: [PAL.cinnabar, PAL.azurite, PAL.prussian, PAL.petal, PAL.ochre, PAL.slateDk, PAL.sageDk, PAL.copper],
      });

      // Red Swiss Modernist Geometric Poster on Warm Plaster Wall (x = 242..398, y = 216..452)
      {
        const px0 = 242;
        const px1 = 398;
        const py0 = 216;
        const py1 = 452;
        p.fillPath(polyPath([[px0 + 4, py0 + 6], [px1 + 4, py0 + 6], [px1 + 4, py1 + 6], [px0 + 4, py1 + 6]]), PAL.cut, 0.22);
        p.fillPath(polyPath([[px0, py0], [px1, py0], [px1, py1], [px0, py1]]), PAL.petal, 0.97);
        p.fillPath(polyPath([[px0 + 8, py0 + 8], [px1 - 8, py0 + 8], [px1 - 8, py1 - 8], [px0 + 8, py1 - 8]]), PAL.cinnabar, 0.97);
        p.fillPath(circlePath(px0 + 88, py0 + 76, 36), PAL.petal, 0.97);
        p.fillPath(polyPath([[px0 + 18, py0 + 68], [px0 + 74, py0 + 68], [px0 + 74, py0 + 86], [px0 + 18, py0 + 86]]), PAL.cinnabar, 0.97);
        p.fillPath(polyPath([[px0 + 18, py0 + 96], [px0 + 64, py0 + 96], [px0 + 64, py0 + 106], [px0 + 18, py0 + 106]]), PAL.petal, 0.92);
        p.fillPath(polyPath([[px0 + 22, py0 + 132], [px1 - 22, py0 + 132], [px1 - 22, py0 + 150], [px0 + 22, py0 + 150]]), PAL.azurite, 0.94);
        let pLines = "";
        for (let y = py0 + 166; y < py1 - 22; y += 9) pLines += `M${px0 + 22} ${y}H${px1 - 22 - ((y * 7) % 34)}`;
        p.burin(pLines, PAL.petal, 0.62, 0.72, 9, "hatch");
        p.burinContour(polyPath([[px0, py0], [px1, py0], [px1, py1], [px0, py1]]), PAL.ink, 0.62, 0.76, 4);
        p.flush();
      }

      // Technics Direct-Drive Turntable + `denseAudioRack` (5U Hi-Fi/Synth Gear) + 28 Vinyl LP Sleeves!
      {
        const cx0 = 224;
        const cx1 = 410;
        const cy0 = 496;
        const cy1 = 1040;
        // Technics direct-drive plinth, brushed platter w/ strobe dots, curved S-tonearm, cartridge & red strobe LED!
        const tb = new PathBatcher();
        tb.rect("plinth", cx0 + 4, cy0 + 22, cx1 - cx0 - 8, 28, { fill: PAL.paperStone, fillOpacity: 0.98 });
        tb.rect("plinthBot", cx0 + 4, cy0 + 42, cx1 - cx0 - 8, 8, { fill: PAL.slateDk, fillOpacity: 0.98 });
        tb.rect("plinthRim", cx0 + 4, cy0 + 22, cx1 - cx0 - 8, 28, { stroke: PAL.ink, strokeWidth: 0.65, strokeOpacity: 0.86, nonScaling: "contour" });
        const platterD = ellipsePath(306, cy0 + 22, 66, 15);
        tb.addPath("platter", platterD, { fill: PAL.slateLt, fillOpacity: 0.96 });
        tb.addPath("platterRim", platterD, { stroke: PAL.ink, strokeWidth: 0.6, strokeOpacity: 0.86, nonScaling: "contour" });
        tb.addPath("vinyl", ellipsePath(306, cy0 + 20, 58, 12.5), { fill: PAL.cut, fillOpacity: 0.98 });
        tb.addPath("vLabel", ellipsePath(306, cy0 + 20, 20, 4.8), { fill: PAL.cinnabar, fillOpacity: 0.96 });
        tb.circle("spindle", 306, cy0 + 20, 2.0, { fill: PAL.petal, fillOpacity: 0.95 });
        // Platter bevel strobe dots
        for (let d = 0; d < 18; d++) {
          const a = (d / 18) * Math.PI;
          tb.circle("strobe", 306 + Math.cos(a) * 63, cy0 + 22 + Math.sin(a) * 14, 1.1, { fill: PAL.ink, fillOpacity: 0.75 });
        }
        // S-shaped tonearm, gimbal base, counterweight & glowing red strobe lamp
        tb.circle("gimbal", 384, cy0 + 16, 8, { fill: PAL.slateDk, fillOpacity: 0.96 });
        tb.circle("gimbalRim", 384, cy0 + 16, 8, { stroke: PAL.brassLt, strokeWidth: 0.6, strokeOpacity: 0.9, nonScaling: "contour" });
        tb.addPath("arm", `M384 ${cy0 + 16}Q368 ${cy0 + 28} 342 ${cy0 + 22}`, { stroke: PAL.brassLt, strokeWidth: 1.25, strokeOpacity: 0.94, nonScaling: "contour" });
        tb.circle("led", 242, cy0 + 34, 2.4, { fill: PAL.cinnabarLt, fillOpacity: 0.98 });
        tb.rect("walnutBody", cx0, cy0 + 50, cx1 - cx0, cy1 - cy0 - 50, { fill: PAL.bark, fillOpacity: 0.99 });
        tb.rect("walnutRim", cx0, cy0 + 50, cx1 - cx0, cy1 - cy0 - 50, { stroke: PAL.ink, strokeWidth: 0.8, strokeOpacity: 0.88, nonScaling: "contour" });
        tb.flush(p);

        // True `@kiuzyx` 5U Modular Hi-Fi & Preamp Rack (`denseAudioRack` — VU meters, EQ faders, knobs, patch-bay!)
        denseAudioRack(p, { x: cx0 + 8, y: cy0 + 60, w: cx1 - cx0 - 16, h: 244 }, { units: 5, chassisColor: PAL.ink });

        // Lower Walnut Vinyl LP Record Library (`28` tightly packed colorful upright LP sleeves!)
        const lpB = new PathBatcher();
        const lpY0 = cy0 + 314;
        const lpY1 = cy1 - 14;
        lpB.rect("lpCav", cx0 + 8, lpY0, cx1 - cx0 - 16, lpY1 - lpY0, { fill: PAL.umberDk, fillOpacity: 0.96 });
        const lpCols = [
          PAL.cinnabar, PAL.petal, PAL.azurite, PAL.ochre, PAL.slateDk, PAL.paperWarm,
          PAL.prussian, PAL.cinnabarLt, PAL.sageDk, PAL.ochreLt, PAL.wisteriaDk, PAL.copper,
        ];
        let lx = cx0 + 13;
        for (let i = 0; lx < cx1 - 18; i++) {
          const lw = rand(p.r, 4.5, 7.5);
          const lean = lx + lw + 8 >= cx1 - 18 ? 6 : 0;
          const col = lpCols[i % lpCols.length];
          lpB.quad(`lp-${i % 12}`, [lx + lean, lpY0 + 12], [lx + lw + lean, lpY0 + 12], [lx + lw, lpY1 - 4], [lx, lpY1 - 4], { fill: col, fillOpacity: 0.95 });
          lpB.line("lpGap", lx + lean, lpY0 + 12, lx, lpY1 - 4, { stroke: PAL.ink, strokeWidth: 0.36, strokeOpacity: 0.65, nonScaling: "hatch" });
          lx += lw + 0.9;
        }
        lpB.flush(p);
      }

      // 3. Right Two-Thirds Wall: 5 Monumental Floor-to-Ceiling `denseBookshelf` Bays (`400+` Detailed Spines & Binders!)
      {
        const bayW = 266;
        for (let b = 0; b < 5; b++) {
          denseBookshelf(p, { x: 1296 + b * (bayW + 6), y: 82, w: bayW, h: 964 }, {
            shelves: 8,
            frameColor: PAL.bark,
            backColor: PAL.barkDk,
            binders: true,
            spinePalette: [
              PAL.cinnabar, PAL.azurite, PAL.prussian, PAL.petal, PAL.ochre,
              PAL.slateDk, PAL.sageDk, PAL.copper, PAL.paperWarm, PAL.wisteriaDk, PAL.cinnabarLt, PAL.celadonDk,
            ],
          });
        }
      }

      // Smooth Radial Ceiling Track Downlights washing all 5 library bays at 2 AM Night!
      const glowXs = [1460, 1740, 2020, 2300, 2560];
      for (let i = 0; i < glowXs.length; i++) {
        p.layer("var(--z-halo-op)", () => {
          p.animGroup({ kind: "pulse", baseOp: 0.9, ampOp: 0.1, freq: 1.5, phase: i * 1.1 }, () => {
            p.fillPath(circlePath(glowXs[i], 175, 210), shelfGlows[i], 1);
          });
        });
      }

      // 3a. Rolling Brass Library Ladder mounted across Bay 3 (`x = 1860..1990`)
      {
        p.burinContour(`M1296 96H2654`, PAL.brassLt, 1.5, 0.92, 1);
        p.burinContour(`M1296 99H2654`, PAL.ink, 0.6, 0.72, 1);
        const topX = 1895;
        const botX = 1968;
        let ladShadow = `M${topX - 18} 96L${botX - 18} 1046M${topX + 34} 96L${botX + 34} 1046`;
        let lad = `M${topX - 24} 96L${botX - 24} 1046M${topX + 24} 96L${botX + 24} 1046`;
        for (let r = 0; r < 12; r++) {
          const t = (r + 0.55) / 12;
          const rx = topX + (botX - topX) * t;
          const ry = 96 + 950 * t;
          lad += `M${f(rx - 24)} ${f(ry)}H${f(rx + 24)}`;
          ladShadow += `M${f(rx - 18)} ${f(ry + 4)}H${f(rx + 30)}`;
        }
        p.burinContour(ladShadow, PAL.cut, 1.4, 0.28, 14);
        p.burinContour(lad, PAL.brass, 1.6, 0.94, 14);
        p.burinContour(lad, PAL.ink, 0.58, 0.76, 14);
        p.fillPath(circlePath(topX - 24, 96, 8) + circlePath(topX + 24, 96, 8), PAL.brassLt, 0.96);
        p.flush();
      }

      // 3b. Lush 5-Tone `stippleTreeCluster` Potted Indoor Olive Tree (`180+` velvety dabs + peeking woody trunk/forks!)
      {
        const potX = 1344;
        const potY = 1046;
        // Ribbed glazed ceramic planter pot
        const pot: Pt[] = [[potX - 42, potY - 98], [potX + 42, potY - 98], [potX + 32, potY], [potX - 32, potY]];
        p.fillPath(polyPath(pot), PAL.paperStone, 0.98);
        p.fillPath(polyPath([[potX, potY - 98], [potX + 42, potY - 98], [potX + 32, potY], [potX, potY]]), PAL.paperShadow, 0.42);
        p.burinContour(polyPath(pot) + `M${potX - 42} ${potY - 82}H${potX + 42}`, PAL.ink, 0.72, 0.84, 5);
        p.animGroup({ kind: "sway", cx: potX, cy: potY - 96, ampDeg: 1.0, freq: 0.75, phase: 0.8 }, () => {
          stippleTreeCluster(
            p,
            p.r,
            [
              { cx: potX + 2, cy: potY - 266, rx: 64, ry: 78, trunkBaseY: potY - 94, trunkWidth: 10.5, density: 1.25 },
              { cx: potX - 24, cy: potY - 224, rx: 46, ry: 44, density: 1.05 },
              { cx: potX + 34, cy: potY - 220, rx: 48, ry: 46, density: 1.05 },
              { cx: potX + 6, cy: potY - 336, rx: 42, ry: 38, density: 1.0 },
            ],
            {
              palette: {
                deepCore: PAL.sageDk,
                darkBody: PAL.sageDk,
                midOlive: PAL.sage,
                litSage: PAL.celadonLt,
                sunCrown: PAL.sageLt,
                trunk: PAL.bark,
              },
              dabSize: 7.2,
              groundShadow: false,
            },
          );
        });
      }

      // 4. Foreground Architect's Drafting Desk & Wood-Strip Parquet Edge (`y = 1044..BLEED.y1`)!
      {
        const deskTop: Pt[] = [[BLEED.x0, 1044], [BLEED.x1, 1044], [BLEED.x1, 1600], [BLEED.x0, 1600]];
        p.fillPath(polyPath(deskTop), PAL.paperWarm, 0.99);
        const db = new PathBatcher();
        db.rect("backRim", BLEED.x0, 1044, BLEED.x1 - BLEED.x0, 22, { fill: PAL.bark, fillOpacity: 0.98 });
        // Fine architectural drafting-mat subtle millimeter grid across desk surface
        for (let y = 1082; y < 1585; y += 22) {
          db.line("matH", BLEED.x0, y, BLEED.x1, y, { stroke: PAL.inkHair, strokeWidth: 0.28, strokeOpacity: 0.16, nonScaling: "hatch" });
        }
        // Wood-strip herringbone / parquet floor apron visible below lower desk edge (`y = 1585..BLEED.y1`)
        db.rect("apron", BLEED.x0, 1585, BLEED.x1 - BLEED.x0, BLEED.y1 - 1585, { fill: PAL.bark, fillOpacity: 0.99 });
        for (let px = -300; px < 2700; px += 44) {
          db.line("parquet", px, 1585, px + 36, BLEED.y1, { stroke: PAL.inkSepia, strokeWidth: 0.45, strokeOpacity: 0.42, nonScaling: "hatch" });
        }
        db.line("dEdge", BLEED.x0, 1044, BLEED.x1, 1044, { stroke: PAL.litEdge, strokeWidth: 0.8, strokeOpacity: 0.76, nonScaling: "contour" });
        db.line("dEdge", BLEED.x0, 1066, BLEED.x1, 1066, { stroke: PAL.ink, strokeWidth: 0.88, strokeOpacity: 0.88, nonScaling: "contour" });
        db.line("dEdge", BLEED.x0, 1585, BLEED.x1, 1585, { stroke: PAL.ink, strokeWidth: 0.92, strokeOpacity: 0.9, nonScaling: "contour" });
        db.flush(p);
      }

      // 4a. Ultra-Dense Chicago City Masterplan & Tower Elevation Blueprint (`180+` Micro-Craft Lines via PathBatcher!)
      {
        const bp: Pt[] = [[355, 1102], [1192, 1090], [1232, 1524], [312, 1538]];
        p.fillPath(polyPath(bp.map(([x, y]): Pt => [x + 8, y + 10])), PAL.cut, 0.26);
        p.fillPath(polyPath(bp), PAL.petal, 0.95);
        const innerBp = bp.map((pt) => lerp(pt, [775, 1315], 0.06));
        p.fillPath(polyPath(innerBp), PAL.glass, 0.14);

        const mb = new PathBatcher();
        mb.addPath("bpOut", polyPath(bp), { stroke: PAL.ink, strokeWidth: 0.78, strokeOpacity: 0.86, nonScaling: "contour" });
        mb.addPath("bpIn", polyPath(innerBp), { stroke: PAL.inkMid, strokeWidth: 0.56, strokeOpacity: 0.76, nonScaling: "contour" });

        // Left half of blueprint: Stepped Chicago Miesian Skyscraper Structural Section, Diagonal X-Bracing & Elevation Datums!
        const ex0 = 398;
        const ey0 = 1138;
        const ew = 264;
        const eh = 304;
        // Central structural elevator core subtle wash + tower spire
        mb.rect("coreWash", ex0 + ew * 0.36, ey0 + 18, ew * 0.28, eh - 18, { fill: PAL.paperStone, fillOpacity: 0.38 });
        mb.line("spire", ex0 + ew * 0.5, ey0 - 22, ex0 + ew * 0.5, ey0 + 4, { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.84, nonScaling: "contour" });
        for (let col = 0; col <= 16; col++) {
          const x = ex0 + (col / 16) * ew;
          const topY = col >= 5 && col <= 11 ? ey0 : col >= 2 && col <= 14 ? ey0 + 46 : ey0 + 104;
          mb.line("elev", x, topY, x, ey0 + eh, { stroke: PAL.inkMid, strokeWidth: col % 4 === 0 ? 0.56 : 0.32, strokeOpacity: 0.76, nonScaling: "hatch" });
        }
        for (let row = 0; row <= 18; row++) {
          const y = ey0 + (row / 18) * eh;
          const xStart = row < 3 ? ex0 + (5 / 16) * ew : row < 7 ? ex0 + (2 / 16) * ew : ex0;
          const xEnd = row < 3 ? ex0 + (11 / 16) * ew : row < 7 ? ex0 + (14 / 16) * ew : ex0 + ew;
          mb.line("elev", xStart, y, xEnd, y, { stroke: PAL.inkMid, strokeWidth: row % 6 === 0 ? 0.54 : 0.32, strokeOpacity: 0.76, nonScaling: "hatch" });
          // Left margin elevation datum callout ticks every 6 floors
          if (row % 6 === 0) {
            mb.line("datum", ex0 - 26, y, ex0 - 6, y, { stroke: PAL.cinnabar, strokeWidth: 0.45, strokeOpacity: 0.78, nonScaling: "hatch" });
            mb.circle("datumDot", ex0 - 28, y, 2.2, { fill: PAL.cinnabar, fillOpacity: 0.8 });
          }
        }
        // John Hancock-style structural diagonal X-bracing bays across 3 structural tiers!
        for (let tier = 0; tier < 3; tier++) {
          const ty0 = ey0 + 104 + tier * 66;
          const ty1 = Math.min(ey0 + eh, ty0 + 66);
          mb.line("xBrace", ex0, ty0, ex0 + ew, ty1, { stroke: PAL.ink, strokeWidth: 0.54, strokeOpacity: 0.78, nonScaling: "hatch" });
          mb.line("xBrace", ex0 + ew, ty0, ex0, ty1, { stroke: PAL.ink, strokeWidth: 0.54, strokeOpacity: 0.78, nonScaling: "hatch" });
        }

        // Right half of blueprint: Curving Chicago River Confluence Masterplan, Hatched Poche Footprints & L-Loop Viaduct!
        const rBand = `M700 1136Q790 1218 758 1314L726 1446L784 1446L812 1326Q844 1236 936 1216L1154 1196L1154 1154L920 1172Q824 1190 762 1136Z`;
        mb.addPath("rivWash", rBand, { fill: PAL.water, fillOpacity: 0.28 });
        mb.addPath("rivEdge", rBand, { stroke: PAL.azurite, strokeWidth: 0.68, strokeOpacity: 0.82, nonScaling: "contour" });
        // Centerline flow & bathymetric contour dashes along the curving Chicago River bend
        mb.addPath("rivFlow", `M732 1138Q806 1216 782 1322L754 1444M796 1234Q864 1198 1150 1174`, { stroke: PAL.azurite, strokeWidth: 0.42, strokeOpacity: 0.64, dash: "6 4", nonScaling: "hatch" });
        // 3 miniature river bridges with abutment piers crossing the Y-bend!
        for (const [bx0, by0, bx1, by1] of [[744, 1218, 814, 1208], [748, 1308, 818, 1318], [946, 1168, 954, 1218]] as const) {
          mb.line("mBr", bx0, by0, bx1, by1, { stroke: PAL.ink, strokeWidth: 0.85, strokeOpacity: 0.88, nonScaling: "contour" });
          mb.line("mBr", bx0, by0 + 5, bx1, by1 + 5, { stroke: PAL.ink, strokeWidth: 0.6, strokeOpacity: 0.8, nonScaling: "contour" });
        }
        // Varied architectural poche city blocks with 45-degree diagonal hatching (Loop skyscraper footprints!)
        const loopBlocks: readonly [number, number, number, number, boolean][] = [
          [852, 1244, 62, 42, true],
          [928, 1236, 74, 48, false],
          [1016, 1228, 56, 54, true],
          [1086, 1224, 58, 44, false],
          [842, 1300, 72, 46, false],
          [928, 1298, 66, 56, true],
          [1008, 1296, 68, 46, false],
          [1090, 1284, 54, 58, true],
          [826, 1360, 84, 44, true],
          [828, 1138, 72, 26, false],
          [916, 1132, 86, 28, true],
          [1018, 1128, 68, 26, false],
        ];
        for (const [bx, by, bw, bh, hatched] of loopBlocks) {
          mb.rect("block", bx, by, bw, bh, { fill: PAL.paperStone, fillOpacity: hatched ? 0.44 : 0.24 });
          mb.rect("blockRim", bx, by, bw, bh, { stroke: PAL.inkMid, strokeWidth: 0.44, strokeOpacity: 0.78, nonScaling: "hatch" });
          mb.rect("blockIn", bx + 6, by + 6, bw - 12, bh - 12, { stroke: PAL.inkMid, strokeWidth: 0.3, strokeOpacity: 0.54, nonScaling: "hatch" });
          if (hatched) {
            for (let d = 8; d < bw + bh - 8; d += 9) {
              const x1 = bx + Math.min(d, bw);
              const y1 = by + Math.max(0, d - bw);
              const x2 = bx + Math.max(0, d - bh);
              const y2 = by + Math.min(d, bh);
              mb.line("poche", x1, y1, x2, y2, { stroke: PAL.inkMid, strokeWidth: 0.32, strokeOpacity: 0.54, nonScaling: "hatch" });
            }
          }
        }
        // Dashed cinnabar L-train elevated transit loop curving through downtown blocks!
        mb.addPath("lLoop", `M712 1356H920V1232H1148`, { stroke: PAL.cinnabar, strokeWidth: 0.65, strokeOpacity: 0.82, dash: "5 3", nonScaling: "contour" });

        // Pratt bridge truss elevation inset spanning lower-right of blueprint + formal architectural title block + compass!
        mb.addPath("truss", `M705 1412H932M718 1412A102 58 0 0 1 920 1412M728 1412A92 46 0 0 1 910 1412`, { stroke: PAL.ink, strokeWidth: 0.5, strokeOpacity: 0.82, nonScaling: "hatch" });
        for (let k = 0; k <= 8; k++) {
          const bx = 728 + k * 22.5;
          mb.line("tPost", bx, 1412, bx, 1368 + Math.abs(k - 4) * 6, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.74, nonScaling: "hatch" });
        }
        // Formal architectural title block stamp with subdivided cells & scale bar
        mb.rect("titleBox", 944, 1368, 218, 122, { stroke: PAL.ink, strokeWidth: 0.62, strokeOpacity: 0.84, nonScaling: "contour" });
        mb.line("tbRule", 944, 1396, 1162, 1396, { stroke: PAL.inkMid, strokeWidth: 0.44, strokeOpacity: 0.74, nonScaling: "hatch" });
        mb.line("tbRule", 944, 1434, 1162, 1434, { stroke: PAL.inkMid, strokeWidth: 0.44, strokeOpacity: 0.74, nonScaling: "hatch" });
        mb.line("tbRule", 944, 1462, 1162, 1462, { stroke: PAL.inkMid, strokeWidth: 0.44, strokeOpacity: 0.74, nonScaling: "hatch" });
        mb.line("tbRule", 1048, 1434, 1048, 1490, { stroke: PAL.inkMid, strokeWidth: 0.44, strokeOpacity: 0.74, nonScaling: "hatch" });
        for (let t = 0; t < 4; t++) {
          mb.line("tbTxt", 956, 1378 + t * 7, 1138 - (t % 2) * 34, 1378 + t * 7, { stroke: PAL.inkMid, strokeWidth: 0.34, strokeOpacity: 0.68, nonScaling: "hatch" });
        }
        mb.circle("north", 1126, 1152, 16, { stroke: PAL.ink, strokeWidth: 0.5, strokeOpacity: 0.78, nonScaling: "contour" });
        mb.line("north", 1126, 1128, 1126, 1176, { stroke: PAL.cinnabar, strokeWidth: 0.65, strokeOpacity: 0.86, nonScaling: "contour" });
        mb.flush(p);

        // Wooden T-Square, Brass Scale Ruler, Brass Bar Weights & Translucent 30-60 Drafting Triangle!
        const tHead: Pt[] = [[286, 1456], [326, 1454], [332, 1548], [292, 1550]];
        const tBlade: Pt[] = [[326, 1490], [1055, 1476], [1057, 1508], [328, 1522]];
        p.fillPath(polyPath(tHead), PAL.bark, 0.98);
        p.fillPath(polyPath(tBlade), PAL.ochreLt, 0.94);
        p.burinContour(polyPath(tHead) + polyPath(tBlade), PAL.ink, 0.72, 0.84, 8);

        const sRuler: Pt[] = [[1262, 1484], [1626, 1454], [1630, 1480], [1266, 1510]];
        p.fillPath(polyPath(sRuler.map(([x, y]): Pt => [x + 4, y + 6])), PAL.cut, 0.22);
        p.fillPath(polyPath(sRuler), PAL.brassLt, 0.96);
        let rTicks = "";
        for (let k = 0; k <= 30; k++) {
          const u = k / 30;
          const a = lerp(sRuler[0], sRuler[1], u);
          const b = lerp(sRuler[3], sRuler[2], u);
          rTicks += `M${f(a[0])} ${f(a[1])}L${f(lerp(a, b, k % 5 === 0 ? 0.58 : 0.3)[0])} ${f(lerp(a, b, k % 5 === 0 ? 0.58 : 0.3)[1])}`;
        }
        p.burin(rTicks, PAL.ink, 0.48, 0.78, 31, "hatch");
        p.burinContour(polyPath(sRuler), PAL.ink, 0.72, 0.86, 4);

        for (const [wx, wy] of [[382, 1126], [1160, 1114]] as const) {
          p.fillPath(polyPath([[wx - 24, wy - 7], [wx + 24, wy - 7], [wx + 24, wy + 7], [wx - 24, wy + 7]]), PAL.brass, 0.96);
          p.burinContour(polyPath([[wx - 24, wy - 7], [wx + 24, wy - 7], [wx + 24, wy + 7], [wx - 24, wy + 7]]), PAL.ink, 0.65, 0.85, 4);
        }

        const triOuter: Pt[] = [[682, 1192], [892, 1468], [682, 1468]];
        const triInner: Pt[] = [[716, 1278], [836, 1436], [716, 1436]];
        p.fillPath(polyPath(triOuter) + polyPath(triInner), PAL.glassTint, 0.52, true);
        p.burinContour(polyPath(triOuter) + polyPath(triInner), PAL.ink, 0.7, 0.82, 6);
        p.flush();
      }

      // 4b. Detailed 7-Tower Architectural Massing Scale Model on Etched Walnut Site Plinth w/ Micro-Trees (`x = 1255..1625`)!
      {
        const plinth: Pt[] = [[1256, 1280], [1578, 1246], [1626, 1388], [1300, 1424]];
        p.fillPath(polyPath(plinth.map(([x, y]): Pt => [x + 8, y + 10])), PAL.cut, 0.3);
        p.fillPath(polyPath(plinth), PAL.barkDk, 0.98);
        // Subtle etched street-grid lines + curving Chicago River channel band on the walnut model base
        const mb = new PathBatcher();
        mb.quad("mRiver", [1274, 1316], [1306, 1312], [1378, 1412], [1344, 1416], { fill: PAL.prussian, fillOpacity: 0.72 });
        for (let k = 1; k <= 7; k++) {
          const u = k / 8;
          const a = lerp(plinth[0], plinth[1], u);
          const c = lerp(plinth[3], plinth[2], u);
          mb.line("site", a[0], a[1], c[0], c[1], { stroke: PAL.brassLt, strokeWidth: 0.34, strokeOpacity: 0.42, nonScaling: "hatch" });
        }
        for (let k = 1; k <= 5; k++) {
          const u = k / 6;
          const a = lerp(plinth[0], plinth[3], u);
          const c = lerp(plinth[1], plinth[2], u);
          mb.line("site", a[0], a[1], c[0], c[1], { stroke: PAL.brassLt, strokeWidth: 0.32, strokeOpacity: 0.34, nonScaling: "hatch" });
        }
        mb.addPath("plRim", polyPath(plinth), { stroke: PAL.ink, strokeWidth: 0.78, strokeOpacity: 0.88, nonScaling: "contour" });
        mb.flush(p);

        const drawMicroModelTower = (bx: number, by: number, wL: number, wR: number, h: number) => {
          const top: Pt[] = [[bx, by - h - 16], [bx + wR, by - h - 5], [bx, by - h + 7], [bx - wL, by - h - 5]];
          const leftF: Pt[] = [[bx - wL, by - h - 5], [bx, by - h + 7], [bx, by + 7], [bx - wL, by - 5]];
          const rightF: Pt[] = [[bx, by - h + 7], [bx + wR, by - h - 5], [bx + wR, by - 5], [bx, by + 7]];
          p.fillPath(polyPath(top), PAL.petal, 0.98);
          p.fillPath(polyPath(leftF), PAL.petal, 0.92);
          p.fillPath(polyPath(rightF), PAL.paperShadow, 0.96);
          p.layer("var(--z-halo-op)", () => {
            p.fillPath(polyPath(rightF), PAL.lantern, 0.34);
          });
          // Dense `0.34px` basswood floor-plate score lines, recessed micro-window slots & rooftop mechanical penthouse!
          const tb = new PathBatcher();
          const floors = Math.max(9, Math.round(h / 8.5));
          for (let i = 1; i < floors; i++) {
            const fy = by - h + (h * i) / floors;
            tb.line("fl", bx - wL, fy - 5, bx, fy + 7, { stroke: PAL.inkMid, strokeWidth: 0.35, strokeOpacity: 0.62, nonScaling: "hatch" });
            tb.line("fl", bx, fy + 7, bx + wR, fy - 5, { stroke: PAL.ink, strokeWidth: 0.35, strokeOpacity: 0.66, nonScaling: "hatch" });
          }
          for (let c = 1; c <= 5; c++) {
            const u = c / 6;
            tb.line("mul", bx - wL * u, by - h - 5 * u + 7 * (1 - u), bx - wL * u, by - 5 * u + 7 * (1 - u), { stroke: PAL.inkMid, strokeWidth: 0.3, strokeOpacity: 0.48, nonScaling: "hatch" });
            tb.line("mul", bx + wR * u, by - h - 5 * u + 7 * (1 - u), bx + wR * u, by - 5 * u + 7 * (1 - u), { stroke: PAL.ink, strokeWidth: 0.3, strokeOpacity: 0.52, nonScaling: "hatch" });
          }
          // Tiny basswood rooftop penthouse block
          const phW = wL * 0.42;
          const phR = wR * 0.42;
          tb.quad("phT", [bx, by - h - 18], [bx + phR, by - h - 13], [bx, by - h - 8], [bx - phW, by - h - 13], { fill: PAL.paperWarm, fillOpacity: 0.95 });
          tb.quad("phR", [bx, by - h - 8], [bx + phR, by - h - 13], [bx + phR, by - h - 7], [bx, by - h - 2], { fill: PAL.paperShadow, fillOpacity: 0.95 });
          tb.addPath("rim", polyPath(top) + polyPath(leftF) + polyPath(rightF), { stroke: PAL.ink, strokeWidth: 0.56, strokeOpacity: 0.8, nonScaling: "contour" });
          tb.flush(p);
        };
        // 7 stepped basswood/white-card towers in a realistic Chicago riverfront cluster!
        drawMicroModelTower(1366, 1296, 36, 30, 144);
        drawMicroModelTower(1448, 1286, 44, 36, 206);
        drawMicroModelTower(1522, 1304, 34, 28, 158);
        drawMicroModelTower(1312, 1344, 32, 26, 94);
        drawMicroModelTower(1408, 1352, 34, 28, 112);
        drawMicroModelTower(1486, 1364, 28, 24, 82);
        drawMicroModelTower(1558, 1352, 26, 22, 102);

        // 9 Miniature Architectural Scale Trees (wire trunks + velvety olive/sage foliage crowns + cast shadows!) on the plinth!
        const mtB = new PathBatcher();
        const mtD = new PathBatcher();
        for (const [tx, ty, tr] of [
          [1296, 1378, 7.2],
          [1336, 1396, 8.2],
          [1376, 1384, 7.6],
          [1432, 1392, 8.5],
          [1462, 1396, 6.8],
          [1518, 1390, 7.8],
          [1548, 1384, 7.2],
          [1586, 1368, 8.0],
          [1578, 1318, 6.8],
        ] as const) {
          mtB.addPath("mSh", ellipsePath(tx + 4, ty + 2, tr * 1.05, tr * 0.42), { fill: PAL.cut, fillOpacity: 0.34 });
          mtD.line("mTr", tx, ty + 1, tx, ty - tr * 1.1, { stroke: PAL.bark, strokeWidth: 0.9, strokeOpacity: 0.92, nonScaling: "contour" });
          mtB.circle("mCanDk", tx + 1.2, ty - tr * 1.35, tr, { fill: PAL.sageDk, fillOpacity: 0.95 });
          mtD.circle("mCanMid", tx - 1.0, ty - tr * 1.55, tr * 0.78, { fill: PAL.sage, fillOpacity: 0.94 });
          mtD.circle("mCanLit", tx - 2.2, ty - tr * 1.75, tr * 0.46, { fill: PAL.celadonLt, fillOpacity: 0.92 });
        }
        mtB.flush(p);
        mtD.flush(p);
      }

      // 4c. Rotating Engraved Brass Terrestrial Library Globe at (1742, 1218) (`data-anim="rotate"`)!
      {
        const gx = 1742;
        const gy = 1218;
        const gr = 68;
        p.fillPath(ellipsePath(gx, gy + gr + 26, 52, 14), PAL.barkDk, 0.96);
        p.fillPath(polyPath([[gx - 12, gy + gr + 4], [gx + 12, gy + gr + 4], [gx + 22, gy + gr + 24], [gx - 22, gy + gr + 24]]), PAL.brass, 0.96);
        p.animGroup({ kind: "rotate", cx: gx, cy: gy, speedDeg: 7.2, phase: 14 }, () => {
          p.fillPath(circlePath(gx, gy, gr), PAL.celadonLt, 0.96);
          p.fillPath(ellipsePath(gx - 18, gy - 12, 26, 18), PAL.ochreLt, 0.58);
          p.fillPath(ellipsePath(gx + 22, gy + 16, 22, 15), PAL.sage, 0.54);
          p.fillPath(ellipsePath(gx + 8, gy - 26, 18, 10), PAL.ochre, 0.44);
          p.burin(
            circlePath(gx, gy, gr) + ellipsePath(gx, gy, gr, 24) + ellipsePath(gx, gy, gr, 46) + ellipsePath(gx, gy, 28, gr) + ellipsePath(gx, gy, 52, gr) + `M${gx - gr} ${gy}H${gx + gr}`,
            PAL.inkMid,
            0.52,
            0.72,
            6,
            "hatch",
          );
        });
        p.burinContour(circlePath(gx, gy, gr + 9), PAL.brass, 1.8, 0.95, 1);
        p.burinContour(circlePath(gx, gy, gr + 9), PAL.ink, 0.65, 0.85, 1);
        p.flush();
      }

      // 4d. Open 60-Line 2-Column Architecture Monograph, Drafting Pen Cup & Coffee Mug w/ Drifting Steam!
      {
        const pageL: Pt[] = [[1860, 1296], [2068, 1284], [2092, 1494], [1880, 1508]];
        const pageR: Pt[] = [[2068, 1284], [2274, 1298], [2298, 1508], [2092, 1494]];
        p.fillPath(polyPath([[1852, 1302], [2282, 1304], [2306, 1516], [1872, 1516]]), PAL.prussianDk, 0.96);
        p.fillPath(polyPath(pageL), PAL.petal, 0.95);
        p.fillPath(polyPath(pageR), PAL.petal, 0.98);
        p.layer("var(--z-halo-op)", () => {
          p.fillPath(polyPath(pageL), PAL.lantern, 0.22);
          p.fillPath(polyPath(pageR), PAL.lanternCore, 0.26);
        });

        // 44 micro-ruled two-column editorial typography lines + detailed architectural section drawing!
        const mb = new PathBatcher();
        for (let r = 0; r < 18; r++) {
          const ry = 1316 + r * 9.5;
          const sk = r * 0.8;
          mb.line("txt", 1894 + sk, ry, 1974 + sk - (r % 5 === 4 ? 14 : 0), ry, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.66, nonScaling: "hatch" });
          mb.line("txt", 1986 + sk, ry, 2056 + sk - (r % 6 === 5 ? 16 : 0), ry, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.66, nonScaling: "hatch" });
        }
        mb.rect("fig", 2106, 1320, 148, 112, { fill: PAL.paperWarm, fillOpacity: 0.55 });
        mb.rect("figRim", 2106, 1320, 148, 112, { stroke: PAL.inkMid, strokeWidth: 0.48, strokeOpacity: 0.76, nonScaling: "hatch" });
        for (let c = 0; c < 6; c++) {
          mb.line("sec", 2116 + c * 22, 1338, 2116 + c * 22, 1424, { stroke: PAL.ink, strokeWidth: 0.4, strokeOpacity: 0.72, nonScaling: "hatch" });
        }
        for (let r = 0; r < 5; r++) {
          mb.line("sec", 2116, 1344 + r * 18, 2240, 1344 + r * 18, { stroke: PAL.ink, strokeWidth: 0.4, strokeOpacity: 0.72, nonScaling: "hatch" });
        }
        for (let r = 0; r < 4; r++) {
          mb.line("cap", 2110, 1446 + r * 9, 2248 - r * 12, 1446 + r * 9, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.65, nonScaling: "hatch" });
        }
        mb.addPath("bkRim", polyPath(pageL) + polyPath(pageR), { stroke: PAL.ink, strokeWidth: 0.72, strokeOpacity: 0.86, nonScaling: "contour" });
        mb.flush(p);

        // Wooden drafting pen cup holding 6 technical pens & pencils
        const cupX = 2235;
        const cupY = 1226;
        for (const [dx, tx, ty, col] of [
          [-12, -22, -88, PAL.cinnabar],
          [-4, -8, -96, PAL.slateDk],
          [2, 4, -94, PAL.ochre],
          [9, 16, -90, PAL.azurite],
          [14, 26, -84, PAL.brassLt],
        ] as const) {
          p.calligraphicStroke([[cupX + dx, cupY - 46], [cupX + tx, cupY + ty]], 2.8, 2.6, 0.9, col, 0.96);
        }
        p.fillPath(polyPath([[cupX - 20, cupY - 52], [cupX + 20, cupY - 52], [cupX + 17, cupY], [cupX - 17, cupY]]), PAL.bark, 0.98);
        p.burinContour(polyPath([[cupX - 20, cupY - 52], [cupX + 20, cupY - 52], [cupX + 17, cupY], [cupX - 17, cupY]]), PAL.ink, 0.72, 0.86, 4);

        // Porcelain coffee mug on saucer + subtle drifting warm steam wisps (`data-anim="drift"`)!
        const mugX = 2328;
        const mugY = 1236;
        p.fillPath(ellipsePath(mugX, mugY + 2, 34, 9), PAL.paperStone, 0.96);
        p.fillPath(polyPath([[mugX - 24, mugY - 46], [mugX + 24, mugY - 46], [mugX + 21, mugY], [mugX - 21, mugY]]), PAL.petal, 0.98);
        p.fillPath(ellipsePath(mugX, mugY - 46, 24, 8), PAL.umberDk, 0.92);
        p.burinContour(`M${mugX + 24} ${mugY - 38}Q${mugX + 42} ${mugY - 26} ${mugX + 22} ${mugY - 12}`, PAL.ink, 1.15, 0.86, 1);
        p.burinContour(polyPath([[mugX - 24, mugY - 46], [mugX + 24, mugY - 46], [mugX + 21, mugY], [mugX - 21, mugY]]), PAL.ink, 0.75, 0.86, 4);
        p.animGroup({ kind: "drift", ampX: 5, ampY: -10, freq: 0.75, phase: 0.4 }, () => {
          p.burin(
            `M${mugX - 6} ${mugY - 56}Q${mugX - 12} ${mugY - 72} ${mugX - 4} ${mugY - 88}M${mugX + 6} ${mugY - 58}Q${mugX + 14} ${mugY - 74} ${mugX + 6} ${mugY - 92}`,
            PAL.inkRim,
            0.78,
            0.36,
            2,
            "hatch",
          );
        });
      }

      // 4e. Articulated Architect's Swing-Arm Desk Lamp — Volumetric Night Light Cone + Wide Tungsten Pool!
      {
        const baseX = 2160;
        const baseY = 1126;
        const elbowX = 2212;
        const elbowY = 955;
        const headX = 1978;
        const headY = 978;

        p.layer("var(--z-halo-op)", () => {
          p.animGroup({ kind: "pulse", baseOp: 0.92, ampOp: 0.08, freq: 1.7, phase: 0.5 }, () => {
            const beamCone: Pt[] = [[headX - 46, headY + 14], [headX + 18, headY + 36], [2255, 1485], [1565, 1410]];
            p.fillPath(polyPath(beamCone), lampConeGrad, 0.92);
            p.fillPath(circlePath(1480, 1220, 860), deskLampGrad, 1);
            p.fillPath(circlePath(1970, 1004, 155), bulbGlowGrad, 1);
          });
        });

        p.fillPath(ellipsePath(baseX, baseY, 34, 12), PAL.slateDk, 0.98);
        p.calligraphicStroke([[baseX, baseY - 6], [elbowX, elbowY]], 7.5, 6.5, 6.0, PAL.slateDk, 0.96);
        p.calligraphicStroke([[elbowX, elbowY], [headX + 28, headY - 16]], 6.8, 5.8, 5.2, PAL.slate, 0.96);
        p.fillPath(circlePath(elbowX, elbowY, 10), PAL.brass, 0.98);
        const hood: Pt[] = [[headX + 24, headY - 26], [headX + 46, headY - 10], [headX + 18, headY + 38], [headX - 48, headY + 14]];
        p.fillPath(polyPath(hood), PAL.slateDk, 0.98);
        p.fillPath(ellipsePath(headX - 14, headY + 26, 36, 12), PAL.lanternCore, 0.96);
        p.burinContour(polyPath(hood), PAL.ink, 0.85, 0.9, 4);
      }

      // 4f. Overhead Swaying Studio Pendant Lamp & Left Bound Sketchbook Stack
      p.hangingLantern({ cx: 1622, cy: 196, w: 46, h: 62, cordLen: 120, style: "gas", swayAmp: 1.4, freq: 0.92, phase: 1.7 });
      {
        const padPts: Pt[] = [[36, 1146], [284, 1164], [262, 1466], [14, 1448]];
        p.fillPath(polyPath(padPts.map(([x, y]): Pt => [x + 6, y + 8])), PAL.cut, 0.24);
        p.fillPath(polyPath(padPts), PAL.prussian, 0.96);
        p.fillPath(polyPath([[58, 1170], [260, 1184], [242, 1440], [40, 1426]]), PAL.petal, 0.95);
        p.burinContour(polyPath(padPts), PAL.ink, 0.76, 0.86, 4);
        const sb = new PathBatcher();
        for (let i = 0; i < 16; i++) {
          const ty = 1196 + i * 14.5;
          sb.line("sk", 74, ty, 224 - (i % 4) * 18, ty + 8, { stroke: PAL.inkMid, strokeWidth: 0.36, strokeOpacity: 0.62, nonScaling: "hatch" });
        }
        sb.flush(p);
      }
    },
    false,
    "window-clip",
  );

  // 5. Swung-Open Dark-Bronze Miesian Steel Casement Window Sashes, Deep Reveal & Mitered Sill (`0px` crop on day-o00!)
  const revealL: Pt[] = [[winX0 - 30, winY0 - 24], [winX0, winY0], [winX0, sillY], [winX0 - 30, sillY + 10]];
  const revealR: Pt[] = [[winX1, winY0], [winX1 + 28, winY0 - 24], [winX1 + 28, sillY + 10], [winX1, sillY]];
  const valance: Pt[] = [[winX0 - 30, winY0 - 38], [winX1 + 28, winY0 - 38], [winX1, winY0], [winX0, winY0]];
  const sillTop: Pt[] = [[winX0 - 34, sillY], [winX1 + 32, sillY], [winX1 + 38, sillY + 14], [winX0 - 38, sillY + 14]];
  const sillFace: Pt[] = [[winX0 - 38, sillY + 14], [winX1 + 38, sillY + 14], [winX1 + 38, sillY + 26], [winX0 - 38, sillY + 26]];

  p.fillPath(polyPath(revealL), PAL.paperStone, 0.98);
  p.fillPath(polyPath(revealR), PAL.paperShadow, 0.98);
  p.fillPath(polyPath(valance), PAL.slateDk, 0.98);
  p.fillPath(polyPath(sillTop), PAL.paperWarm, 0.99);
  p.fillPath(polyPath(sillFace), PAL.paperShadow, 0.98);

  const mW = 10;
  const outerFrame =
    polyPath([[winX0 - 10, winY0 - 10], [winX1 + 10, winY0 - 10], [winX1 + 10, sillY], [winX0 - 10, sillY]]) +
    polyPath([[winX0, winY0], [winX1, winY0], [winX1, sillY], [winX0, sillY]]);
  p.fillPath(outerFrame, PAL.slateDk, 0.99, true);

  const structuralBars =
    polyPath([[winX0, holeY0 - mW], [winX1, holeY0 - mW], [winX1, holeY0], [winX0, holeY0]]) +
    polyPath([[holeX0 - mW, winY0], [holeX0, winY0], [holeX0, sillY], [holeX0 - mW, sillY]]) +
    polyPath([[holeX1, winY0], [holeX1 + mW, winY0], [holeX1 + mW, sillY], [holeX1, sillY]]);
  p.fillPath(structuralBars, PAL.slateDk, 0.99);

  // Swung-Open 3D Perspective Translucent Steel Casement Sashes flanking `hole` on LEFT & RIGHT!
  const leftSashOuter: Pt[] = [[holeX0 - mW, holeY0], [holeX0 - 98, holeY0 + 16], [holeX0 - 98, holeY1 - 10], [holeX0 - mW, holeY1 + 4]];
  const leftSashGlass: Pt[] = [[holeX0 - mW - 8, holeY0 + 10], [holeX0 - 88, holeY0 + 24], [holeX0 - 88, holeY1 - 18], [holeX0 - mW - 8, holeY1 - 6]];
  const rightSashOuter: Pt[] = [[holeX1 + mW, holeY0], [holeX1 + 98, holeY0 + 16], [holeX1 + 98, holeY1 - 10], [holeX1 + mW, holeY1 + 4]];
  const rightSashGlass: Pt[] = [[holeX1 + mW + 8, holeY0 + 10], [holeX1 + 88, holeY0 + 24], [holeX1 + 88, holeY1 - 18], [holeX1 + mW + 8, holeY1 - 6]];
  p.fillPath(polyPath(leftSashGlass) + polyPath(rightSashGlass), PAL.glass, 0.24);
  p.fillPath(polyPath(leftSashOuter) + polyPath(leftSashGlass), PAL.slateDk, 0.98, true);
  p.fillPath(polyPath(rightSashOuter) + polyPath(rightSashGlass), PAL.slateDk, 0.98, true);
  p.burin(
    `M${f(holeX0 - 78)} ${f(holeY0 + 44)}L${f(holeX0 - 24)} ${f(holeY0 + 116)}M${f(holeX1 + 24)} ${f(holeY0 + 48)}L${f(holeX1 + 78)} ${f(holeY0 + 120)}`,
    PAL.inkRim,
    0.72,
    0.42,
    2,
    "hatch",
  );
  p.fillPath(
    polyPath([[holeX0 - 102, (holeY0 + holeY1) * 0.5 - 15], [holeX0 - 92, (holeY0 + holeY1) * 0.5 - 15], [holeX0 - 92, (holeY0 + holeY1) * 0.5 + 15], [holeX0 - 102, (holeY0 + holeY1) * 0.5 + 15]]) +
      polyPath([[holeX1 + 92, (holeY0 + holeY1) * 0.5 - 15], [holeX1 + 102, (holeY0 + holeY1) * 0.5 - 15], [holeX1 + 102, (holeY0 + holeY1) * 0.5 + 15], [holeX1 + 92, (holeY0 + holeY1) * 0.5 + 15]]),
    PAL.brassLt,
    0.96,
  );

  p.burinContour(`M${winX0} ${f(holeY0 - mW)}H${winX1}M${f(holeX0 - mW)} ${winY0}V${sillY}M${f(holeX1)} ${winY0}V${sillY}`, PAL.litEdge, 0.7, 0.66, 3);
  p.burinContour(`M${winX0 - 16} ${winY0}V${winY0 + 255}`, PAL.inkMid, 0.65, 0.78, 1, "2 3");
  p.fillPath(polyPath([[winX0 - 20, winY0 + 255], [winX0 - 12, winY0 + 255], [winX0 - 13, winY0 + 284], [winX0 - 19, winY0 + 284]]), PAL.brass, 0.95);
  p.burinContour(polyPath(revealL) + polyPath(revealR) + polyPath(valance) + polyPath(sillTop) + polyPath(sillFace), PAL.ink, 0.78, 0.84, 20);
  p.burinContour(polyPath(hole), PAL.ink, 1.1, 0.96, 4);
  p.burinContour(`M${winX0 - 34} ${f(sillY)}H${winX1 + 32}`, PAL.litEdge, 0.88, 0.8, 1);
  p.flush();

  return {
    index: 17,
    id: "s17-library",
    title: "Architect's Library & Chicago Window",
    subtitle: "6-bay library (450+ spines), Technics/hi-fi rack, city masterplan & Miesian window",
    portal: S17_PORTAL,
    coreColorDay: [220, 214, 202],
    coreColorNight: [16, 22, 38],
    defs: p.defs.join(""),
    markup: p.out.join(""),
    hole,
    stats: { elements: p.elements, strokes: p.strokes, animGroups: p.animGroups },
  };
}
