// Mesh Gradient v5 Pure 4-Tile 8+4 Bento Grid & Nonlinear Scroll-Morph Engine:
// Mounts 4 selective single-plate WebGL2 bento tiles (01 Veil, 02 Prism, 03 Plume, and 04 autonomous
// vertical Backlit Vessels pillar) with strict per-tile IntersectionObserver GPU culling (0% off-screen
// draws), underdamped scroll-velocity Spring (omega = 14, zeta = 0.34), autonomous 2.6s vertical spring
// auto-scrolling on Lantern yielding instantly on hover/drag/click, staggered out-of-phase morphing on
// Veil & Prism, zero-reflow Cabinet Grotesk optical DOF vessel typography, and graceful WebGL2 fallback.

import { PALETTES, STAGE_TONES, lerpOklab, lerpPalette } from "./palette.ts";
import { SPRINGS, Spring, VelocityTracker, clamp, lerp, mod } from "./physics.ts";
import { MeshRenderer } from "./renderer.ts";
import {
  LANTERN_SPECS,
  PLUME_SHEETS,
  PRISM_SHAPES,
  VEIL_SHAPES,
  getLanternSlotRects,
  getPlumeSheetRects,
  isVerticalLantern,
  type Light,
  type OpticalPalette,
  type PlateFrame,
  type PlateId,
  type V3,
} from "./types.ts";

export const TILES = ["veil", "prism", "plume", "lantern"] as const;
export type TileId = (typeof TILES)[number];

/** Four 3D floating crystal solids displayed in Tile 02 (Prism). */
export const PRISM_SOLIDS = PRISM_SHAPES.slice(0, 4);

const STILL_TIME: Record<TileId, number> = {
  veil: 2.2,
  prism: 1.35,
  plume: 3.4,
  lantern: 1.8,
};

/** Optimal per-tile WebGL backing DPR cap (native HTML typography always renders at full Retina DPI). */
const TILE_DPR_CAP: Record<TileId, number> = {
  plume: 1.0,
  prism: 1.65,
  lantern: 1.35,
  veil: 1.5,
};

const ACTIVE_FRAME_MS = 15.5; // ~60 fps during drag, hover, scroll surge, morphs, or glides
const AMBIENT_FRAME_MS = 41.0; // ~24 fps calm film cadence when all springs are settled

const springActive = (s: Spring, epsPos = 5e-4, epsVel = 5e-3): boolean =>
  Math.abs(s.x - s.target) > epsPos || Math.abs(s.v) > epsVel;

export type BentoOptions = {
  initialTile?: TileId;
  light?: Light;
  explicitLightParam?: Light | null;
  palette?: number;
  shape?: number;
  still?: boolean;
  onState?: (state: BentoState) => void;
};

export type BentoState = {
  activeTile: TileId;
  light: Light;
  forceDayLantern: boolean;
  chordIndex: number;
  chordName: string;
  chordSwatch: string;
  plumeChordIndex: number;
  still: boolean;
  specimens: {
    veil: number;
    prism: number;
    plume: number;
    lantern: number;
  };
};

export type BentoHandle = {
  setLight(light: Light): void;
  nextChord(): void;
  setPlumeChord(index: number): void;
  setStill(still: boolean): void;
  setSpecimen(tile: TileId, index: number): void;
  stepActive(delta: number): void;
  triggerActive(): void;
  focusTile(tile: TileId, behavior?: ScrollBehavior): void;
  state(): BentoState;
  destroy(): void;
};

type LabelCache = {
  el: HTMLDivElement;
  nameEl: HTMLSpanElement;
  visible: boolean;
  transform: string;
  width: string;
  height: string;
  filter: string;
  opacity: string;
  wght: number;
  track: string;
};

type TileRuntime = {
  id: TileId;
  plate: PlateId;
  tileEl: HTMLElement;
  stageEl: HTMLElement;
  canvas: HTMLCanvasElement;
  renderer: MeshRenderer | null;
  w: number;
  h: number;
  dpr: number;
  vertical: boolean;
  inView: boolean;
  dirty: boolean;
  elapsed: number;
  idleSeconds: number;
  locked: boolean;
  px: Spring;
  py: Spring;
  hover: Spring;
  morph: Spring;
  scroll: Spring;
  impulse: Spring;
  paletteBlend: Spring;
  fromPalette: OpticalPalette;
  toPalette: OpticalPalette;
  paletteIndex: number;
  morphFrom: number;
  morphTo: number;
  specimenIndex: number;
  isDragging: boolean;
  plumeSheets?: [HTMLDivElement, HTMLDivElement, HTMLDivElement];
  lanternLabels?: LabelCache[];
  cleanups: Array<() => void>;
};

function buildPlumeOverlay(): {
  el: HTMLDivElement;
  sheets: [HTMLDivElement, HTMLDivElement, HTMLDivElement];
} {
  const layer = document.createElement("div");
  layer.className = "overlay-plume";

  const s0 = document.createElement("div");
  s0.className = "plume-sheet";
  s0.dataset.sheet = "0";
  s0.innerHTML = `<p class="plume-head">Full-field wash *\nLaminar +<span class="plume-rule"></span>+ drift</p>`;

  const s1 = document.createElement("div");
  s1.className = "plume-sheet";
  s1.dataset.sheet = "1";
  s1.innerHTML =
    `<div class="plume-top-split">` +
    `<p class="plume-spec">UPWARD CONVECTION —\nCURL FIELD · TWO OCTAVES\nPAPER CLEARING 62%</p>` +
    `<p class="plume-head">Ground bloom +++\n+ Thermal rise <span class="plume-rule"></span></p>` +
    `</div>` +
    `<p class="plume-note">Warm pigment carried upward in long\ncombed ribbons, parting cleanly\nbefore the words begin. +++</p>`;

  const s2 = document.createElement("div");
  s2.className = "plume-sheet";
  s2.dataset.sheet = "2";
  s2.innerHTML =
    `<p class="plume-head">Night emission +++\nAdditive core <span class="plume-rule"></span></p>` +
    `<div class="plume-dual">` +
    `<p class="plume-spec">RADIANCE SUM —\nOVERLAPPING BANDS\nINCANDESCENT PEAK</p>` +
    `<p class="plume-note">+++ Light added to light\nclimbs past colour into\na white-hot core.</p>` +
    `</div>`;

  layer.append(s0, s1, s2);
  return { el: layer, sheets: [s0, s1, s2] };
}

function groundFor(plate: PlateId, light: Light): V3 {
  const t = STAGE_TONES[light];
  if (plate === "plume") return t.plumeMatte;
  if (plate === "lantern") return t.lanternBg;
  return t.ground;
}

export function mountBento(root: HTMLElement, options: BentoOptions = {}): BentoHandle {
  const reducedMotion =
    typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  let light: Light = options.light === "night" ? "night" : "day";
  let still = options.still ?? reducedMotion;
  let chordIndex =
    typeof options.palette === "number" && Number.isFinite(options.palette)
      ? mod(Math.round(options.palette), 3)
      : 0;
  let activeTile: TileId = options.initialTile ?? "veil";

  // Tile 04 is a universal #070A10 Turrell darkroom in both Day & Night unless explicitly testing
  // ?plate=lantern&light=day in the URL.
  const forceDayLantern = options.initialTile === "lantern" && options.explicitLightParam === "day";

  const nightSpring = new Spring(light === "night" ? 1 : 0, SPRINGS.ease);

  // Analytical underdamped scroll-velocity surge spring (omega = 14, zeta = 0.34).
  const scrollSurge = new Spring(0, { omega: 14, zeta: 0.34 });

  let lastScrollY = window.scrollY;
  let lastScrollMorphMs = 0;

  // Autonomous vertical auto-scroll state for Lantern (pauses 2.6s center-locked, yields on hover/drag/click,
  // resumes 3.8s after pointer leaves).
  let lanternHovered = false;
  let lanternHoldSeconds = 0;
  let lanternResumeDelay = 0;

  const tiles = new Map<TileId, TileRuntime>();
  const tileList: TileRuntime[] = [];

  let rafId = 0;
  let lastDrawNow = 0;
  let lastInteractionMs = -1e9;
  let destroyed = false;

  const isDocActive = () => !document.hidden && !destroyed;

  const markInteraction = () => {
    lastInteractionMs = performance.now();
  };

  const schedule = () => {
    if (!isDocActive() || rafId) return;
    rafId = requestAnimationFrame(tick);
  };

  const stopLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const wakeTile = (tile: TileRuntime) => {
    tile.dirty = true;
    schedule();
  };

  const wakeVisible = () => {
    for (const tile of tileList) {
      if (tile.inView) tile.dirty = true;
    }
    schedule();
  };

  const getState = (): BentoState => {
    const veilTile = tiles.get("veil")!;
    const prismTile = tiles.get("prism")!;
    const plumeTile = tiles.get("plume")!;
    const lanternTile = tiles.get("lantern")!;
    const activePal = PALETTES.plume[plumeTile.paletteIndex];
    return {
      activeTile,
      light,
      forceDayLantern,
      chordIndex,
      chordName: activePal.name,
      chordSwatch: activePal.swatch,
      plumeChordIndex: plumeTile.paletteIndex,
      still,
      specimens: {
        veil: veilTile.specimenIndex,
        prism: prismTile.specimenIndex,
        plume: plumeTile.specimenIndex,
        lantern: mod(Math.round(lanternTile.scroll.target), LANTERN_SPECS.length),
      },
    };
  };

  const emitState = () => {
    options.onState?.(getState());
  };

  const syncPlumeLayout = (tile: TileRuntime) => {
    if (!tile.plumeSheets) return;
    const rects = getPlumeSheetRects(tile.w, tile.h);
    for (let i = 0; i < 3; i++) {
      const r = rects[i];
      const el = tile.plumeSheets[i];
      el.style.left = `${r.x.toFixed(2)}px`;
      el.style.top = `${r.y.toFixed(2)}px`;
      el.style.width = `${r.w.toFixed(2)}px`;
      el.style.height = `${r.h.toFixed(2)}px`;
    }
  };

  const syncLanternLabels = (tile: TileRuntime, scroll: number, velocity: number) => {
    if (!tile.lanternLabels) return;
    const rects = getLanternSlotRects(scroll, tile.w, tile.h);
    const absVel = Math.abs(velocity);
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      const cache = tile.lanternLabels[i];
      const onStage =
        r.x + r.w > -48 && r.x < tile.w + 48 && r.y + r.h > -48 && r.y < tile.h + 48;
      if (!onStage) {
        if (cache.visible) {
          cache.el.style.visibility = "hidden";
          cache.visible = false;
        }
        continue;
      }
      if (!cache.visible) {
        cache.el.style.visibility = "";
        cache.visible = true;
      }

      const tx = `translate3d(${r.x.toFixed(2)}px, ${r.y.toFixed(2)}px, 0)`;
      const wStr = `${r.w.toFixed(2)}px`;
      const hStr = `${r.h.toFixed(2)}px`;

      const absDist = Math.abs(r.dist);
      const locked = absDist < 0.035 && absVel < 0.05;
      const rawBlur = locked ? 0 : Math.min(9.5, absDist * 4.3 + absVel * 2.2);
      // Quantize CSS blur to 0.5px steps to avoid Chromium compositor Gaussian surface thrash.
      const blurPx = rawBlur < 0.25 ? 0 : Math.round(rawBlur * 2) * 0.5;
      const filter = blurPx === 0 ? "none" : `blur(${blurPx.toFixed(1)}px)`;
      const opVal = locked ? 1 : clamp(1 - absDist * 0.42 - Math.min(absVel * 0.07, 0.34), 0.24, 1);
      const opacity = opVal.toFixed(3);

      // Zero-reflow Cabinet Grotesk variable weight + tracking optical DOF (quantized integer wght).
      const focus = locked ? 1 : clamp(1 - absDist * 0.85 - Math.min(absVel * 0.14, 0.55), 0, 1);
      const wght = Math.round(lerp(250, 560, focus));
      const track = `${lerp(0.02, -0.015, focus).toFixed(3)}em`;

      if (cache.transform !== tx) {
        cache.el.style.transform = tx;
        cache.transform = tx;
      }
      if (cache.width !== wStr) {
        cache.el.style.width = wStr;
        cache.width = wStr;
      }
      if (cache.height !== hStr) {
        cache.el.style.height = hStr;
        cache.height = hStr;
      }
      if (cache.filter !== filter) {
        cache.el.style.filter = filter;
        cache.filter = filter;
      }
      if (cache.opacity !== opacity) {
        cache.el.style.opacity = opacity;
        cache.opacity = opacity;
      }
      if (cache.wght !== wght) {
        cache.nameEl.style.fontVariationSettings = `"wght" ${wght}`;
        cache.wght = wght;
      }
      if (cache.track !== track) {
        cache.nameEl.style.letterSpacing = track;
        cache.track = track;
      }
    }
  };

  const renderTile = (tile: TileRuntime) => {
    const globalNight = clamp(nightSpring.x, 0, 1);
    const effectiveNight = tile.id === "lantern" && !forceDayLantern ? 1 : globalNight;
    const surge = still ? 0 : clamp(scrollSurge.x, -1.2, 1.2);
    const absSurge = Math.abs(surge);

    const palT = clamp(tile.paletteBlend.x, 0, 1);
    const fromStops = lerpPalette(tile.fromPalette.day, tile.fromPalette.night, effectiveNight);
    const toStops = lerpPalette(tile.toPalette.day, tile.toPalette.night, effectiveNight);
    const colors = palT >= 0.999 ? toStops : lerpPalette(fromStops, toStops, palT);
    const ground = lerpOklab(groundFor(tile.plate, "day"), groundFor(tile.plate, "night"), effectiveNight);

    let effPx = clamp(tile.px.x, 0, 1);
    let effPy = clamp(tile.py.x, 0, 1);
    let effHover = clamp(tile.hover.x, 0, 1);
    let motionX = tile.scroll.v;
    let motionY = Math.max(0, tile.impulse.x);

    if (absSurge > 0.002) {
      if (tile.id === "veil") {
        effPx = clamp(effPx + surge * 0.18, 0.05, 0.95);
        effPy = clamp(effPy - surge * 0.14, 0.05, 0.95);
        effHover = clamp(Math.max(effHover, absSurge * 0.65), 0, 1);
      } else if (tile.id === "prism") {
        effPx = clamp(effPx + surge * 0.18, 0.05, 0.95);
        effPy = clamp(effPy - surge * 0.16, 0.05, 0.95);
        effHover = clamp(Math.max(effHover, absSurge * 0.75), 0, 1);
        motionY = Math.max(motionY, absSurge * 0.55);
      } else if (tile.id === "plume") {
        motionY = Math.max(motionY, absSurge * 1.15);
      } else if (tile.id === "lantern") {
        motionX += surge * 0.75;
      }
    }

    const frame: PlateFrame = {
      time: tile.elapsed,
      night: effectiveNight,
      colors,
      ground,
      pointer: [effPx, effPy],
      hover: effHover,
      fromIndex: tile.morphFrom,
      toIndex: tile.morphTo,
      morph: tile.plate === "veil" ? clamp(tile.morph.x, -0.12, 1.12) : clamp(tile.morph.x, 0, 1),
      scroll: tile.scroll.x,
      motion: [motionX, motionY],
      compact: 0,
      cornerRadius: 0,
      paletteIndex: tile.paletteIndex,
    };

    if (tile.renderer && tile.w > 0 && tile.h > 0) {
      // Every plate shader writes 100% opaque pixels (alpha: false), so skip redundant gl.clear().
      tile.renderer.drawPlate(tile.plate, frame);
    }

    if (tile.id === "lantern") {
      syncLanternLabels(tile, tile.scroll.x, tile.scroll.v);
    }
    tile.dirty = false;
  };

  const setTileSpecimen = (tile: TileRuntime, nextIndex: number, lock: boolean) => {
    if (lock) tile.locked = true;
    tile.idleSeconds = 0;

    if (tile.id === "lantern") {
      const target = mod(nextIndex, LANTERN_SPECS.length);
      const curRounded = Math.round(tile.scroll.target);
      const curMod = mod(curRounded, LANTERN_SPECS.length);
      let delta = target - curMod;
      if (delta > LANTERN_SPECS.length / 2) delta -= LANTERN_SPECS.length;
      if (delta < -LANTERN_SPECS.length / 2) delta += LANTERN_SPECS.length;
      tile.specimenIndex = target;
      tile.scroll.target = curRounded + delta;
      if (still) {
        tile.scroll.snap(tile.scroll.target);
      } else if (delta !== 0) {
        tile.scroll.impulse(Math.sign(delta) * 2.8);
      }
      lanternHoldSeconds = 0;
      lanternResumeDelay = 3.8;
      emitState();
      wakeTile(tile);
      return;
    }

    if (tile.id === "plume") {
      const target = mod(nextIndex, PLUME_SHEETS.length);
      tile.specimenIndex = target;
      tile.px.target = [0.18, 0.5, 0.82][target] ?? 0.5;
      tile.py.target = 0.68;
      tile.hover.target = 0.78;
      tile.impulse.impulse(3.2);
      emitState();
      wakeTile(tile);
      return;
    }

    const count = tile.id === "veil" ? VEIL_SHAPES.length : PRISM_SOLIDS.length;
    const target = mod(nextIndex, count);
    const prev = tile.specimenIndex;
    tile.specimenIndex = target;
    tile.morphFrom = prev;
    tile.morphTo = target;
    if (still || prev === target) {
      tile.morph.snap(1);
    } else {
      tile.morph.snap(0);
      tile.morph.target = 1;
      tile.morph.impulse(tile.id === "veil" ? 1.45 : 0.75);
    }
    tile.impulse.impulse(1.8);
    emitState();
    wakeTile(tile);
  };

  const setTilePalette = (tile: TileRuntime, nextIdx: number) => {
    const list = PALETTES[tile.plate];
    const idx = mod(Math.round(nextIdx), list.length);
    if (idx === tile.paletteIndex) return;
    tile.fromPalette = tile.toPalette;
    tile.toPalette = list[idx];
    tile.paletteIndex = idx;
    if (still) {
      tile.paletteBlend.snap(1);
    } else {
      tile.paletteBlend.snap(0);
      tile.paletteBlend.target = 1;
    }
    tile.dirty = true;
  };

  const initTile = (id: TileId): TileRuntime => {
    const plate: PlateId = id;
    const tileEl = root.querySelector<HTMLElement>(`[data-tile="${id}"]`)!;
    const stageEl = tileEl.querySelector<HTMLElement>(`[data-stage="${id}"]`)!;
    stageEl.dataset.plate = plate;

    if (id === "lantern") {
      tileEl.dataset.room = forceDayLantern ? "cotton" : "obsidian";
    }
    // Reveal all 4 tiles immediately in desktop/reduced-motion/still so the 1-screen gallery opens crisply.
    if (still || reducedMotion || id === "veil" || id === "prism" || id === "lantern") {
      tileEl.classList.add("is-revealed");
    }

    const canvas = document.createElement("canvas");
    canvas.className = "mesh-canvas";

    const overlay = document.createElement("div");
    overlay.className = "mesh-overlay";

    let plumeSheets: [HTMLDivElement, HTMLDivElement, HTMLDivElement] | undefined;
    let lanternLabels: LabelCache[] | undefined;

    if (id === "plume") {
      const po = buildPlumeOverlay();
      plumeSheets = po.sheets;
      overlay.append(po.el);
    } else if (id === "lantern") {
      const lanternLayer = document.createElement("div");
      lanternLayer.className = "overlay-lantern";
      lanternLabels = LANTERN_SPECS.map((spec) => {
        const el = document.createElement("div");
        el.className = "lantern-label";
        el.dataset.slug = spec.slug;
        const nameEl = document.createElement("span");
        nameEl.className = "lantern-name";
        nameEl.textContent = spec.label;
        el.append(nameEl);
        lanternLayer.append(el);
        return {
          el,
          nameEl,
          visible: true,
          transform: "",
          width: "",
          height: "",
          filter: "",
          opacity: "",
          wght: 560,
          track: "-0.015em",
        };
      });
      overlay.append(lanternLayer);
    }

    const fallbackEl = document.createElement("div");
    fallbackEl.className = "mesh-fallback";
    fallbackEl.hidden = true;
    fallbackEl.innerHTML = `<p>WebGL2 unavailable — static preview.</p>`;

    stageEl.replaceChildren(canvas, overlay, fallbackEl);

    let renderer: MeshRenderer | null = null;
    try {
      renderer = new MeshRenderer(canvas, { plates: [plate] });
    } catch {
      renderer = null;
      canvas.hidden = true;
      fallbackEl.hidden = false;
    }

    const palList = PALETTES[plate];
    const pIdx = mod(chordIndex, palList.length);
    const initPal = palList[pIdx];

    let initialSpec = id === "plume" ? 1 : 0;
    let locked = false;
    if (
      options.initialTile === id &&
      typeof options.shape === "number" &&
      Number.isFinite(options.shape)
    ) {
      if (id === "veil") initialSpec = mod(Math.round(options.shape), VEIL_SHAPES.length);
      else if (id === "prism") initialSpec = mod(Math.round(options.shape), PRISM_SOLIDS.length);
      else if (id === "plume") initialSpec = mod(Math.round(options.shape), PLUME_SHEETS.length);
      else if (id === "lantern") initialSpec = mod(Math.round(options.shape), LANTERN_SPECS.length);
      locked = true;
    }

    const morphSpec = id === "veil" ? { omega: 7.2, zeta: 0.60 } : SPRINGS.morph;

    const tile: TileRuntime = {
      id,
      plate,
      tileEl,
      stageEl,
      canvas,
      renderer,
      w: 0,
      h: 0,
      dpr: Math.min(2, window.devicePixelRatio || 1),
      vertical: false,
      inView: false,
      dirty: true,
      elapsed: STILL_TIME[id],
      idleSeconds: id === "prism" ? 2.3 : 0,
      locked,
      px: new Spring(0.5, SPRINGS.pointer),
      py: new Spring(0.5, SPRINGS.pointer),
      hover: new Spring(0, SPRINGS.ease),
      morph: new Spring(1, morphSpec),
      scroll: new Spring(id === "lantern" ? initialSpec : 0, SPRINGS.carousel),
      impulse: new Spring(0, SPRINGS.impulse),
      paletteBlend: new Spring(1, SPRINGS.ease),
      fromPalette: initPal,
      toPalette: initPal,
      paletteIndex: pIdx,
      morphFrom: initialSpec,
      morphTo: initialSpec,
      specimenIndex: initialSpec,
      isDragging: false,
      plumeSheets,
      lanternLabels,
      cleanups: [],
    };

    const measure = () => {
      const r = stageEl.getBoundingClientRect();
      if (!r.width || !r.height) return;
      tile.w = r.width;
      tile.h = r.height;
      tile.dpr = Math.min(TILE_DPR_CAP[id], window.devicePixelRatio || 1);
      tile.vertical = id === "lantern" && isVerticalLantern(tile.w, tile.h);
      if (id === "lantern") {
        tileEl.dataset.axis = tile.vertical ? "vertical" : "horizontal";
      }
      tile.renderer?.resize(tile.w, tile.h, tile.dpr);
      if (tile.id === "plume") syncPlumeLayout(tile);
      tile.dirty = true;
      renderTile(tile);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(stageEl);
    tile.cleanups.push(() => ro.disconnect());

    const io = new IntersectionObserver(
      ([entry]) => {
        const nextInView = entry.isIntersecting;
        if (nextInView) {
          tileEl.classList.add("is-revealed");
        }
        if (nextInView === tile.inView) return;
        tile.inView = nextInView;
        if (nextInView) {
          tile.dirty = true;
          renderTile(tile);
          if (!still) schedule();
        }
      },
      { rootMargin: "80px 0px", threshold: 0.01 },
    );
    io.observe(tileEl);
    tile.cleanups.push(() => io.disconnect());

    const targetEl = id === "plume" ? stageEl : tileEl;
    const velTracker = new VelocityTracker();
    let activePointerId: number | null = null;
    let activePointerType = "mouse";
    let downX = 0;
    let downY = 0;
    let dragStartScroll = 0;
    let wheelTimer = 0;

    const localCoords = (e: PointerEvent) => {
      const r = stageEl.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      return {
        x,
        y,
        nx: clamp(r.width > 0 ? x / r.width : 0.5, 0, 1),
        ny: clamp(r.height > 0 ? y / r.height : 0.5, 0, 1),
      };
    };

    const lanternPxPerSlot = () => {
      if (tile.vertical) {
        const cardW = clamp(tile.w * 0.66, 148, 292);
        const gap = clamp(tile.h * 0.036, 16, 28);
        return cardW / 1.06 + gap;
      }
      const cardH = Math.max(96, Math.min(tile.h * 0.46, tile.w * 0.4, 312));
      return cardH * 1.4;
    };

    const onPointerEnter = () => {
      activeTile = id;
      if (id === "lantern") {
        lanternHovered = true;
        lanternHoldSeconds = 0;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      markInteraction();
      const { nx, ny } = localCoords(e);
      tile.px.target = nx;
      tile.py.target = ny;
      tile.hover.target = 1;

      if (activePointerId === e.pointerId && id === "lantern") {
        const dx = e.clientX - downX;
        const dy = e.clientY - downY;

        if (tile.vertical) {
          if (activePointerType !== "touch") {
            if (!tile.isDragging && Math.abs(dy) > 5 && Math.abs(dy) >= Math.abs(dx) * 0.75) {
              tile.isDragging = true;
              stageEl.classList.add("is-dragging");
            }
            if (tile.isDragging) {
              velTracker.push(e.clientX, e.clientY);
              const pps = lanternPxPerSlot();
              const nextScroll = dragStartScroll - dy / pps;
              const { vy } = velTracker.velocity();
              tile.scroll.x = nextScroll;
              tile.scroll.target = nextScroll;
              tile.scroll.v = clamp(-vy / pps, -16, 16);
            }
          }
        } else {
          if (!tile.isDragging && Math.abs(dx) > 5 && Math.abs(dx) >= Math.abs(dy) * 0.75) {
            tile.isDragging = true;
            stageEl.classList.add("is-dragging");
          }
          if (tile.isDragging) {
            velTracker.push(e.clientX, e.clientY);
            const pps = lanternPxPerSlot();
            const nextScroll = dragStartScroll - dx / pps;
            const { vx } = velTracker.velocity();
            tile.scroll.x = nextScroll;
            tile.scroll.target = nextScroll;
            tile.scroll.v = clamp(-vx / pps, -16, 16);
          }
        }
      }
      wakeTile(tile);
    };

    const onPointerLeave = () => {
      if (id === "lantern") {
        lanternHovered = false;
        lanternHoldSeconds = 0;
        lanternResumeDelay = 3.8;
      }
      if (activePointerId !== null) return;
      tile.hover.target = 0;
      tile.px.target = 0.5;
      tile.py.target = 0.5;
      wakeTile(tile);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("a, button")) return;

      markInteraction();
      activeTile = id;
      activePointerId = e.pointerId;
      activePointerType = e.pointerType || "mouse";
      downX = e.clientX;
      downY = e.clientY;
      tile.isDragging = false;
      dragStartScroll = tile.scroll.x;
      velTracker.reset(e.clientX, e.clientY);
      tile.idleSeconds = 0;
      if (id === "lantern") {
        lanternHoldSeconds = 0;
        lanternResumeDelay = 3.8;
      }
      if (!(id === "lantern" && tile.vertical && activePointerType === "touch")) {
        try {
          targetEl.setPointerCapture(e.pointerId);
        } catch {}
      }
      const { nx, ny } = localCoords(e);
      tile.px.target = nx;
      tile.py.target = ny;
      tile.hover.target = 1;
      wakeTile(tile);
    };

    const finishPointer = (e: PointerEvent, cancelled: boolean) => {
      if (activePointerId !== e.pointerId) return;
      activePointerId = null;
      try {
        if (targetEl.hasPointerCapture(e.pointerId)) targetEl.releasePointerCapture(e.pointerId);
      } catch {}
      stageEl.classList.remove("is-dragging");

      const wasDragging = tile.isDragging;
      tile.isDragging = false;

      if (id === "lantern") {
        lanternHoldSeconds = 0;
        lanternResumeDelay = 3.8;
        if (wasDragging) {
          const pps = lanternPxPerSlot();
          const { vx, vy } = velTracker.velocity();
          const axisVel = tile.vertical ? vy : vx;
          const slotVel = clamp(-axisVel / pps, -14, 14);
          const projected = tile.scroll.x + slotVel * 0.2;
          tile.scroll.target = Math.round(projected);
          tile.scroll.v = slotVel;
          tile.specimenIndex = mod(tile.scroll.target, LANTERN_SPECS.length);
          emitState();
          wakeTile(tile);
          return;
        }
        if (!cancelled && Math.hypot(e.clientX - downX, e.clientY - downY) < 10) {
          const { x, y } = localCoords(e);
          const rects = getLanternSlotRects(tile.scroll.x, tile.w, tile.h);
          const hit = rects.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
          if (hit && Math.abs(hit.dist) > 0.25) {
            tile.scroll.target = Math.round(tile.scroll.x) + Math.round(hit.dist);
            tile.scroll.impulse(Math.sign(hit.dist) * 2.6);
            tile.specimenIndex = mod(tile.scroll.target, LANTERN_SPECS.length);
            emitState();
          } else if (hit) {
            tile.impulse.impulse(2.4);
          } else {
            const step = tile.vertical ? (y < tile.h * 0.5 ? -1 : 1) : x < tile.w * 0.5 ? -1 : 1;
            tile.scroll.target = Math.round(tile.scroll.target) + step;
            tile.scroll.impulse(step * 2.6);
            tile.specimenIndex = mod(tile.scroll.target, LANTERN_SPECS.length);
            emitState();
          }
          wakeTile(tile);
        }
        return;
      }

      if (!cancelled && Math.hypot(e.clientX - downX, e.clientY - downY) < 8) {
        if (id === "veil") {
          setTileSpecimen(tile, (tile.specimenIndex + 1) % VEIL_SHAPES.length, false);
        } else if (id === "prism") {
          setTileSpecimen(tile, (tile.specimenIndex + 1) % PRISM_SOLIDS.length, false);
        } else if (id === "plume") {
          tile.impulse.impulse(3.6);
          wakeTile(tile);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => finishPointer(e, false);
    const onPointerCancel = (e: PointerEvent) => finishPointer(e, true);

    targetEl.addEventListener("pointerenter", onPointerEnter);
    targetEl.addEventListener("pointermove", onPointerMove);
    targetEl.addEventListener("pointerleave", onPointerLeave);
    targetEl.addEventListener("pointerdown", onPointerDown);
    targetEl.addEventListener("pointerup", onPointerUp);
    targetEl.addEventListener("pointercancel", onPointerCancel);
    tile.cleanups.push(() => {
      targetEl.removeEventListener("pointerenter", onPointerEnter);
      targetEl.removeEventListener("pointermove", onPointerMove);
      targetEl.removeEventListener("pointerleave", onPointerLeave);
      targetEl.removeEventListener("pointerdown", onPointerDown);
      targetEl.removeEventListener("pointerup", onPointerUp);
      targetEl.removeEventListener("pointercancel", onPointerCancel);
    });

    if (id === "lantern") {
      const onWheel = (e: WheelEvent) => {
        const dominantX = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        const delta = dominantX ? e.deltaX : e.shiftKey ? e.deltaY : 0;
        if (Math.abs(delta) < 0.5) return;
        e.preventDefault();
        markInteraction();
        lanternHoldSeconds = 0;
        lanternResumeDelay = 3.8;
        const pps = lanternPxPerSlot();
        const step = delta / (pps * 0.85);
        tile.scroll.x += step;
        tile.scroll.target = tile.scroll.x;
        tile.scroll.v = clamp(step * 24, -12, 12);

        window.clearTimeout(wheelTimer);
        wheelTimer = window.setTimeout(() => {
          tile.scroll.target = Math.round(tile.scroll.x);
          tile.specimenIndex = mod(tile.scroll.target, LANTERN_SPECS.length);
          emitState();
          wakeTile(tile);
        }, 115);

        wakeTile(tile);
      };
      tileEl.addEventListener("wheel", onWheel, { passive: false });
      tile.cleanups.push(() => {
        window.clearTimeout(wheelTimer);
        tileEl.removeEventListener("wheel", onWheel);
      });
    }

    measure();
    tiles.set(id, tile);
    tileList.push(tile);
    return tile;
  };

  const veilTile = initTile("veil");
  const prismTile = initTile("prism");
  const plumeTile = initTile("plume");
  const lanternTile = initTile("lantern");

  const onPassiveScroll = () => {
    const y = window.scrollY;
    const dy = y - lastScrollY;
    lastScrollY = y;

    if (still || reducedMotion || Math.abs(dy) < 0.5) return;

    markInteraction();
    const mag = Math.min(Math.abs(dy) / 42, 2.5);
    const imp = clamp(Math.sign(dy) * mag ** 1.3, -2.4, 2.4);
    scrollSurge.impulse(imp * 10.5);

    if (prismTile.inView) {
      prismTile.px.impulse(imp * 0.9);
      prismTile.py.impulse(-imp * 0.65);
    }

    const now = performance.now();
    if (Math.abs(dy) > 55 && veilTile.inView && !veilTile.locked && now - lastScrollMorphMs > 950) {
      lastScrollMorphMs = now;
      setTileSpecimen(veilTile, (veilTile.specimenIndex + 1) % VEIL_SHAPES.length, false);
    }

    wakeVisible();
  };
  window.addEventListener("scroll", onPassiveScroll, { passive: true });

  const isActiveCadence = (now: number): boolean => {
    if (now - lastInteractionMs < 400) return true;
    if (springActive(nightSpring)) return true;
    if (!still && springActive(scrollSurge)) return true;
    for (const tile of tileList) {
      if (!tile.inView) continue;
      if (
        tile.isDragging ||
        springActive(tile.px) ||
        springActive(tile.py) ||
        springActive(tile.hover) ||
        springActive(tile.morph) ||
        springActive(tile.scroll) ||
        springActive(tile.impulse, 1e-3, 1e-3) ||
        springActive(tile.paletteBlend)
      ) {
        return true;
      }
    }
    return false;
  };

  const hasDirtyVisible = (): boolean => {
    for (const tile of tileList) {
      if (tile.inView && tile.dirty) return true;
    }
    return false;
  };

  const tick = (now: number) => {
    rafId = 0;
    if (!isDocActive()) return;

    const active = isActiveCadence(now);
    const minIntervalMs = active ? ACTIVE_FRAME_MS : AMBIENT_FRAME_MS;
    const elapsedSinceDraw = lastDrawNow > 0 ? now - lastDrawNow : minIntervalMs;

    // Adaptive 24 fps calm ambient cadence / 60 fps active interaction cadence (never saturates 120 Hz).
    if (lastDrawNow > 0 && elapsedSinceDraw < minIntervalMs && !hasDirtyVisible()) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    const dt = clamp(elapsedSinceDraw / 1000, 0.001, 0.05);
    lastDrawNow = now;

    const nightMoving = nightSpring.step(dt);
    const surgeMoving = !still && scrollSurge.step(dt, 5e-4, 5e-3);
    let keepRunning = nightMoving || surgeMoving;

    for (const tile of tileList) {
      if (!tile.inView) continue;

      if (!still) {
        tile.elapsed += dt;
        tile.idleSeconds += dt;

        // Staggered out-of-phase autonomous spring morphs: Veil ~4.2s, Prism ~5.1s (2.3s offset).
        if (tile.id === "veil" && !tile.locked && tile.idleSeconds >= 4.2) {
          tile.idleSeconds = 0;
          setTileSpecimen(tile, (tile.specimenIndex + 1) % VEIL_SHAPES.length, false);
        } else if (tile.id === "prism" && !tile.locked && tile.idleSeconds >= 5.1) {
          tile.idleSeconds = 0;
          setTileSpecimen(tile, (tile.specimenIndex + 1) % PRISM_SOLIDS.length, false);
        } else if (
          tile.id === "lantern" &&
          !tile.locked &&
          !tile.isDragging &&
          !lanternHovered
        ) {
          // Autonomous vertical/horizontal self-scrolling: 2.6s crisp hold -> elastic spring glide!
          if (lanternResumeDelay > 0) {
            lanternResumeDelay = Math.max(0, lanternResumeDelay - dt);
          } else if (
            Math.abs(tile.scroll.v) < 0.08 &&
            Math.abs(tile.scroll.x - tile.scroll.target) < 0.03
          ) {
            lanternHoldSeconds += dt;
            if (lanternHoldSeconds >= 2.6) {
              lanternHoldSeconds = 0;
              tile.scroll.target = Math.round(tile.scroll.target) + 1;
              tile.scroll.impulse(3.3);
              tile.specimenIndex = mod(tile.scroll.target, LANTERN_SPECS.length);
              emitState();
            }
          }
        }
      }

      let moving = nightMoving || surgeMoving;
      if (tile.px.step(dt)) moving = true;
      if (tile.py.step(dt)) moving = true;
      if (tile.hover.step(dt)) moving = true;
      if (tile.morph.step(dt)) moving = true;
      if (!tile.isDragging && tile.scroll.step(dt, 5e-4, 5e-3)) moving = true;
      if (tile.impulse.step(dt, 1e-3, 1e-3)) moving = true;
      if (tile.paletteBlend.step(dt)) moving = true;

      if (tile.dirty || moving || !still || tile.isDragging) {
        renderTile(tile);
      }

      if (!still || moving || tile.isDragging) {
        keepRunning = true;
      }
    }

    if (keepRunning) {
      rafId = requestAnimationFrame(tick);
    }
  };

  const onVisibility = () => {
    if (isDocActive()) {
      wakeVisible();
    } else {
      stopLoop();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  // Instant deep-link jump for ?plate=veil|plume|prism|lantern (from landing-card slots or QA URLs).
  if (options.initialTile) {
    const targetTile = tiles.get(options.initialTile);
    if (targetTile) {
      targetTile.tileEl.classList.add("is-revealed");
      targetTile.tileEl.scrollIntoView({ behavior: "instant", block: "center" });
      lastScrollY = window.scrollY;
      targetTile.inView = true;
      targetTile.dirty = true;
      renderTile(targetTile);
    }
  } else {
    for (const tile of [veilTile, prismTile, plumeTile, lanternTile]) {
      tile.inView = true;
      renderTile(tile);
    }
  }

  emitState();
  if (!still) schedule();

  return {
    setLight(nextLight: Light) {
      if (nextLight === light) return;
      light = nextLight;
      nightSpring.target = light === "night" ? 1 : 0;
      if (still) nightSpring.snap(nightSpring.target);
      for (const tile of tileList) tile.dirty = true;
      emitState();
      if (still) {
        for (const tile of tileList) if (tile.inView) renderTile(tile);
      } else {
        schedule();
      }
    },

    nextChord() {
      chordIndex = (chordIndex + 1) % 3;
      for (const tile of tileList) setTilePalette(tile, chordIndex);
      emitState();
      if (still) {
        for (const tile of tileList) if (tile.inView) renderTile(tile);
      } else {
        schedule();
      }
    },

    setPlumeChord(index: number) {
      chordIndex = mod(Math.round(index), 3);
      setTilePalette(plumeTile, chordIndex);
      emitState();
      if (still) {
        if (plumeTile.inView) renderTile(plumeTile);
      } else {
        schedule();
      }
    },

    setStill(nextStill: boolean) {
      if (nextStill === still) return;
      still = nextStill;
      if (still) {
        scrollSurge.snap(0);
        lanternHoldSeconds = 0;
      }
      emitState();
      if (still) {
        for (const tile of tileList) if (tile.inView) renderTile(tile);
      } else {
        schedule();
      }
    },

    setSpecimen(tileId: TileId, index: number) {
      const tile = tiles.get(tileId);
      if (tile) {
        activeTile = tileId;
        setTileSpecimen(tile, index, true);
      }
    },

    stepActive(delta: number) {
      const tile = tiles.get(activeTile) ?? veilTile;
      if (tile.id === "lantern") {
        tile.scroll.target = Math.round(tile.scroll.target) + delta;
        if (still) tile.scroll.snap(tile.scroll.target);
        else tile.scroll.impulse(delta * 2.8);
        tile.specimenIndex = mod(tile.scroll.target, LANTERN_SPECS.length);
        lanternHoldSeconds = 0;
        lanternResumeDelay = 3.8;
        emitState();
        wakeTile(tile);
      } else {
        setTileSpecimen(tile, tile.specimenIndex + delta, true);
      }
    },

    triggerActive() {
      const tile = tiles.get(activeTile) ?? veilTile;
      if (tile.id === "veil") {
        setTileSpecimen(tile, (tile.specimenIndex + 1) % VEIL_SHAPES.length, false);
      } else if (tile.id === "prism") {
        setTileSpecimen(tile, (tile.specimenIndex + 1) % PRISM_SOLIDS.length, false);
      } else if (tile.id === "plume") {
        tile.impulse.impulse(3.6);
        wakeTile(tile);
      } else if (tile.id === "lantern") {
        tile.scroll.target = Math.round(tile.scroll.target) + 1;
        if (still) tile.scroll.snap(tile.scroll.target);
        else tile.scroll.impulse(3.2);
        tile.specimenIndex = mod(tile.scroll.target, LANTERN_SPECS.length);
        lanternHoldSeconds = 0;
        lanternResumeDelay = 3.8;
        emitState();
        wakeTile(tile);
      }
    },

    focusTile(tileId: TileId, behavior: ScrollBehavior = "smooth") {
      const tile = tiles.get(tileId);
      if (!tile) return;
      activeTile = tileId;
      tile.tileEl.scrollIntoView({ behavior, block: "center" });
      emitState();
    },

    state: getState,

    destroy() {
      destroyed = true;
      stopLoop();
      window.removeEventListener("scroll", onPassiveScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const tile of tileList) {
        for (const fn of tile.cleanups) fn();
        tile.renderer?.destroy();
      }
    },
  };
}
