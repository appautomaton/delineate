// Ordered 20-tile poster sequence (5 × 4 on desktop): arranged so adjacent silhouettes contrast
// across rows and columns while representing all five physical materials evenly.
import { magnetGrid, ripplePad, tideProgress } from "./fluid.js";
import { detentDial, dominoRow, odometer, rockerSwitch } from "./mechanical.js";
import { jellyPad, squashPlay, stretchToggle, swipeConfirm, wormDots } from "./rubber.js";
import { bellToggle, checklist, downloadRing, elasticString, menuMorph, paperPlane } from "./taut.js";
import { gooeyTabBar, mergeDrops } from "./viscous.js";
export const TILES = [
    // Row 1: pill, dock, circle, flight pill, floating cube
    stretchToggle,
    gooeyTabBar,
    detentDial,
    paperPlane,
    jellyPad,
    // Row 2: slider, metaballs, taut chord, vertical slabs, pill-to-ring
    swipeConfirm,
    mergeDrops,
    elasticString,
    dominoRow,
    downloadRing,
    // Row 3: badge tile, hardware seesaw, 3D keycap, drum counter, liquid gauge
    bellToggle,
    rockerSwitch,
    squashPlay,
    odometer,
    tideProgress,
    // Row 4: dot lattice, dot track, icon square, touch pad, stacked rows
    magnetGrid,
    wormDots,
    menuMorph,
    ripplePad,
    checklist,
];
