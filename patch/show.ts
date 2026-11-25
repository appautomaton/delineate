// Frameless Stochastic Specimen Tabletop + Effortless Hover Monochrome <svg> Crossfade + Inspection Modal.
//
// Strict GPU & Pacing Contract:
//  - ONE shared WebGL2RenderingContext (<canvas class="patch-gl">) positioned inside .patch-shell
//    so native browser GPU compositing scrolls & rubber-bands all 6 badges at 0.0 fps!
//  - Each badge rests at a stochastic organic pose (moderate tilt +/-2.6..6.8 deg + tabletop XY scatter)
//    shared bit-for-bit between DOM <svg> and WebGL2 (`uPose`) for 0.00 px registration.
//  - Hovering any badge smoothly crossfades (`uOpacity = 1 - reveal`) from full-color 3D embroidery
//    to its pure monochrome <svg> architectural blueprint underneath, settling to 0.0 fps at rest.

import {
  BADGES,
  activeThreadIndices,
  buildBadgeSvgMarkup,
  findBadgeByYear,
  hexToLinearRgb,
  type BadgeAsset,
} from "./badges.ts";
import { SPRINGS, Spring, clamp, lerp } from "./physics.ts";
import {
  DEFAULT_LIGHT_DIR,
  IDENTITY_POSE,
  PatchAtlasRenderer,
  getActiveGlContextCount,
  type BadgePose,
  type CardViewport,
  type Vec3,
} from "./renderer.ts";

export type LightMode = "day" | "night";
export type ViewMode = "stitch" | "split" | "svg";

export interface PatchTelemetry {
  glContextCount: number;
  atlasVramBytes: number;
  bakeMs: number;
  glError: number;
  activeRaf: boolean;
  rafTicksTotal: number;
  visibleCards: number;
  viewMode: ViewMode;
  light: LightMode;
  modalYear: string | null;
  badgeIds: string[];
  posesDeg: number[];
}

export interface PatchExhibitionOptions {
  light: LightMode;
  view: ViewMode;
  initialBadgeYear: string | null;
  still: boolean;
  seed?: number | null;
  onStateChange?: (state: { light: LightMode; view: ViewMode; modalYear: string | null }) => void;
}

export interface PatchExhibition {
  setLight(next: LightMode): void;
  setView(next: ViewMode): void;
  shuffle(seed?: number): void;
  openModal(year: string): void;
  closeModal(): void;
  stepModal(delta: -1 | 1): void;
  setCardReveal(index: number, reveal: number, snap?: boolean): void;
  setModalSplit(split: number, snap?: boolean): void;
  telemetry(): PatchTelemetry;
  bench(frames?: number): number;
  destroy(): void;
}

const STEP_60_MS = 1000 / 60;
const VSYNC_SLACK_MS = 3.5;
const DEG_TO_RAD = Math.PI / 180;

const DAY_PAPER_LIN = hexToLinearRgb("#F8F7F2");
const NIGHT_PAPER_LIN = hexToLinearRgb("#0B0D14");
const DAY_MODAL_LIN = hexToLinearRgb("#F1EFE8");
const NIGHT_MODAL_LIN = hexToLinearRgb("#12151F");

interface RestingPose {
  dx: number;
  dy: number;
  angleDeg: number;
  fitZoom: number;
}

interface CardEntry {
  readonly badge: BadgeAsset;
  readonly cardEl: HTMLElement;
  readonly stageEl: HTMLElement;
  readonly svgClip: HTMLElement;
  readonly svgPose: HTMLElement;
  readonly hairlineEl: HTMLElement;
  readonly coordEl: HTMLElement;
  readonly captionEl: HTMLElement;
  readonly split: Spring; // Pointer-X vertical split [0..1]: left = monochrome <svg>, right = 3D stitch
  readonly dx: Spring;
  readonly dy: Spring;
  readonly angleDeg: Spring;
  readonly fitZoom: Spring;
  rest: RestingPose;
  stageLeft: number;
  stageTop: number;
  width: number;
  height: number;
  visible: boolean;
  hovered: boolean;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates an organic, balanced stochastic scatter for the 6 patches:
 *  - Moderate tilt angles in +/- [2.6, 6.6] deg with balanced shuffled signs (3 CW, 3 CCW)
 *  - Subtle tabletop XY offsets so rows & columns break out of a mechanical grid without colliding
 */
function generateStochasticPoses(seed: number, count: number): RestingPose[] {
  const rnd = mulberry32(seed || 0x20262031);
  // Checkerboard base polarity (+/- alternating both horizontally & vertically) with stochastic flip
  // so no row of 3 ever leans in unison while every reload/Shuffle feels genuinely spontaneous!
  const flip = rnd() < 0.5 ? 1 : -1;
  const signs = [flip, -flip, flip, -flip, flip, -flip];
  if (rnd() < 0.5) {
    // Swap one diagonal pair so polarity isn't a predictable strict checkerboard either
    const pair = rnd() < 0.5 ? [0, 4] : [1, 5];
    const tmp = signs[pair[0]];
    signs[pair[0]] = signs[pair[1]];
    signs[pair[1]] = tmp;
  }

  // Organic tabletop XY scatter breaking horizontal & vertical grid rails without overlap
  const out: RestingPose[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % 3;
    const sign = signs[i % signs.length];
    const mag = 2.4 + rnd() * 4.2; // moderate +/- 2.4..6.6 deg
    const dx = (rnd() * 2 - 1) * 20;
    const staggerY = col === 1 ? (rnd() * 14 + 4) : -(rnd() * 14 + 2);
    const dy = staggerY + (rnd() * 2 - 1) * 8;
    const fitZoom = 0.855 + rnd() * 0.045;
    out.push({
      dx,
      dy,
      angleDeg: sign * mag,
      fitZoom,
    });
  }
  return out;
}

export function mountPatchExhibition(
  root: HTMLElement,
  opts: PatchExhibitionOptions,
): PatchExhibition {
  const reducedMotion =
    opts.still ||
    (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);

  const canvas = root.querySelector<HTMLCanvasElement>("[data-gl-canvas]")!;
  const gridEl = root.querySelector<HTMLElement>("[data-grid]")!;
  const modalBackdrop = root.querySelector<HTMLElement>("[data-modal]")!;
  const modalYearEl = root.querySelector<HTMLElement>("[data-modal-year]")!;
  const modalTitleEl = root.querySelector<HTMLElement>("[data-modal-title]")!;
  const modalMetaEl = root.querySelector<HTMLElement>("[data-modal-meta]")!;
  const modalSwatchesEl = root.querySelector<HTMLElement>("[data-modal-swatches]")!;
  const modalSvgHost = root.querySelector<HTMLElement>("[data-modal-svg-host]")!;
  const modalMacroStage = root.querySelector<HTMLElement>("[data-modal-macro-stage]")!;
  const modalMacroSvgWrap = root.querySelector<HTMLElement>("[data-modal-macro-svg]")!;
  const modalHairline = root.querySelector<HTMLElement>("[data-modal-hairline]")!;
  const modalHandle = root.querySelector<HTMLElement>("[data-modal-handle]")!;
  const modalExportBtn = root.querySelector<HTMLButtonElement>("[data-action='export-svg']")!;
  const modalCopyBtn = root.querySelector<HTMLButtonElement>("[data-action='copy-svg']")!;
  const modalSplitBtns = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-modal-split]"),
  );

  // Single shared WebGL2 context baking all 6 badges into one compact 3x2 atlas
  const renderer = new PatchAtlasRenderer(canvas, BADGES);

  let light: LightMode = opts.light;
  let viewMode: ViewMode = opts.view;
  let activeModalIndex = -1;
  let destroyed = false;
  let scatterScale = 1.0;
  let shellDocLeft = 0;

  const baseSplitForMode = (m: ViewMode): number => (m === "svg" ? 1.0 : m === "split" ? 0.5 : 0.0);

  const initialSeed =
    opts.seed != null && Number.isFinite(opts.seed)
      ? opts.seed
      : ((Math.random() * 0x7fffffff) | 0) ^ 0x5f3759df;
  const initialPoses = generateStochasticPoses(initialSeed, BADGES.length);

  const nightSpring = new Spring(light === "night" ? 1 : 0, SPRINGS.ease);
  const lightX = new Spring(0, SPRINGS.pointer);
  const lightY = new Spring(0, SPRINGS.pointer);
  const modalSplit = new Spring(0, SPRINGS.loupe);

  const modalVp: CardViewport = { x: 0, y: 0, w: 0, h: 0 };

  let rafId = 0;
  let lastNow = 0;
  let nextDue = 0;
  let rafTicksTotal = 0;
  let draggingLoupe = false;

  // ---------------------------------------------------------------------------
  // 1. Mount 6 Frameless Tabletop Specimen Slots (Monochrome <svg> + Quiet Label)
  // ---------------------------------------------------------------------------
  gridEl.replaceChildren();
  const cards: CardEntry[] = BADGES.map((badge, idx) => {
    const m = badge.meta;
    const rest = initialPoses[idx];

    const cardEl = document.createElement("article");
    cardEl.className = "patch-card";
    cardEl.dataset.badge = m.year;
    cardEl.tabIndex = 0;
    cardEl.setAttribute("role", "button");
    cardEl.setAttribute("aria-label", `Inspect ${m.year} ${m.title} — ${m.subtitle}`);

    const stageEl = document.createElement("div");
    stageEl.className = "card-stage";

    // Outer unrotated wrapper receives vertical screen-space clip-path matching WebGL uSplit;
    // inner pose wrapper carries the exact stochastic translate/rotate/scale matching WebGL uPose!
    const svgClip = document.createElement("div");
    svgClip.className = "card-svg-clip";

    const svgPose = document.createElement("div");
    svgPose.className = "card-svg-pose";
    svgPose.innerHTML = buildBadgeSvgMarkup(badge, "blueprint", `card-${idx}`);
    svgClip.append(svgPose);

    const hairlineEl = document.createElement("div");
    hairlineEl.className = "card-hairline";
    hairlineEl.setAttribute("aria-hidden", "true");
    const coordEl = document.createElement("span");
    coordEl.className = "hairline-tag";
    coordEl.textContent = "<svg>";
    hairlineEl.append(coordEl);

    stageEl.append(svgClip, hairlineEl);

    const captionEl = document.createElement("div");
    captionEl.className = "card-caption";
    captionEl.innerHTML = `<span class="card-year">${m.year}</span><span class="card-title">${m.title}</span><span class="card-sep">·</span><span class="card-sub">${m.subtitle}</span>`;

    cardEl.append(stageEl, captionEl);
    gridEl.append(cardEl);

    return {
      badge,
      cardEl,
      stageEl,
      svgClip,
      svgPose,
      hairlineEl,
      coordEl,
      captionEl,
      split: new Spring(baseSplitForMode(viewMode), SPRINGS.peel),
      dx: new Spring(rest.dx, SPRINGS.pose),
      dy: new Spring(rest.dy, SPRINGS.pose),
      angleDeg: new Spring(rest.angleDeg, SPRINGS.pose),
      fitZoom: new Spring(rest.fitZoom, SPRINGS.pose),
      rest,
      stageLeft: 0,
      stageTop: 0,
      width: 0,
      height: 0,
      visible: true,
      hovered: false,
    };
  });

  const syncCardTargets = (c: CardEntry, snap = false, keepHoverSplit = false) => {
    const splitTarget = c.hovered && keepHoverSplit ? c.split.target : baseSplitForMode(viewMode);
    const tx = c.rest.dx * scatterScale;
    const ty = c.rest.dy * scatterScale + (c.hovered ? -2.5 : 0);
    const tDeg = c.hovered ? c.rest.angleDeg * 0.82 : c.rest.angleDeg;
    const tZoom = c.rest.fitZoom;

    if (snap) {
      c.split.snap(splitTarget);
      c.dx.snap(tx);
      c.dy.snap(ty);
      c.angleDeg.snap(tDeg);
      c.fitZoom.snap(tZoom);
    } else {
      if (!keepHoverSplit) c.split.target = splitTarget;
      c.dx.target = tx;
      c.dy.target = ty;
      c.angleDeg.target = tDeg;
      c.fitZoom.target = tZoom;
    }
  };

  // ---------------------------------------------------------------------------
  // 2. Geometry Cache (ResizeObserver ONLY — Zero Layout Reads Inside RAF/Scroll)
  // ---------------------------------------------------------------------------
  const measureAll = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const shellRect = root.getBoundingClientRect();
    shellDocLeft = shellRect.left + window.scrollX;
    const prevScale = scatterScale;
    scatterScale = window.innerWidth < 680 ? 0.42 : window.innerWidth < 1040 ? 0.72 : 1.0;
    if (Math.abs(scatterScale - prevScale) > 1e-3) {
      for (const c of cards) syncCardTargets(c, true);
    }

    for (const c of cards) {
      const r = c.stageEl.getBoundingClientRect();
      c.stageLeft = r.left - shellRect.left;
      c.stageTop = r.top - shellRect.top;
      c.width = r.width;
      c.height = r.height;
    }

    if (activeModalIndex >= 0) {
      renderer.resize(window.innerWidth, window.innerHeight, dpr);
      const mr = modalMacroStage.getBoundingClientRect();
      modalVp.x = mr.left;
      modalVp.y = mr.top;
      modalVp.w = mr.width;
      modalVp.h = mr.height;
    } else {
      renderer.resize(shellRect.width, shellRect.height, dpr);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Synchronized Monochrome <svg> Pose + Single-Context WebGL2 Render
  // ---------------------------------------------------------------------------
  const computeLightDir = (): Vec3 => {
    if (reducedMotion) return DEFAULT_LIGHT_DIR;
    const lx = -0.18 + lightX.x * 0.36;
    const ly = 0.62 - lightY.x * 0.24;
    const lz = Math.max(0.50, Math.sqrt(Math.max(0.25, 1.0 - lx * lx - ly * ly)));
    const inv = 1 / Math.hypot(lx, ly, lz);
    return [lx * inv, ly * inv, lz * inv];
  };

  const applySplitDom = (
    clipEl: HTMLElement,
    hairlineEl: HTMLElement,
    split: number,
    coordEl?: HTMLElement,
    handleEl?: HTMLElement,
  ) => {
    const s = clamp(split, 0, 1);
    if (s <= 0.001) {
      clipEl.style.clipPath = "inset(0 100% 0 0)";
      clipEl.style.visibility = "hidden";
    } else if (s >= 0.999) {
      clipEl.style.clipPath = "none";
      clipEl.style.visibility = "visible";
    } else {
      clipEl.style.visibility = "visible";
      clipEl.style.clipPath = `inset(0 ${((1 - s) * 100).toFixed(3)}% 0 0)`;
    }

    const showLine = s > 0.015 && s < 0.985;
    hairlineEl.style.opacity = showLine ? "1" : "0";
    hairlineEl.style.left = `${(s * 100).toFixed(3)}%`;
    if (coordEl && showLine) {
      coordEl.textContent = `<svg> ${Math.round(s * 100)}%`;
    }
    if (handleEl) {
      handleEl.style.left = `${(s * 100).toFixed(3)}%`;
      handleEl.style.display = showLine ? "" : "none";
    }
  };

  const renderFrame = () => {
    if (destroyed) return;
    const night = clamp(nightSpring.x, 0, 1);
    const lightDir = computeLightDir();

    renderer.beginFrame();

    if (activeModalIndex >= 0) {
      const modalLin: Vec3 = [
        lerp(DAY_MODAL_LIN[0], NIGHT_MODAL_LIN[0], night),
        lerp(DAY_MODAL_LIN[1], NIGHT_MODAL_LIN[1], night),
        lerp(DAY_MODAL_LIN[2], NIGHT_MODAL_LIN[2], night),
      ];
      const sp = clamp(modalSplit.x, 0, 1);
      applySplitDom(modalMacroSvgWrap, modalHairline, sp, undefined, modalHandle);
      renderer.drawBadgeSlot(activeModalIndex, modalVp, lightDir, sp, night, modalLin, 1.0, IDENTITY_POSE);
    } else {
      const paperLin: Vec3 = [
        lerp(DAY_PAPER_LIN[0], NIGHT_PAPER_LIN[0], night),
        lerp(DAY_PAPER_LIN[1], NIGHT_PAPER_LIN[1], night),
        lerp(DAY_PAPER_LIN[2], NIGHT_PAPER_LIN[2], night),
      ];

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const sp = clamp(c.split.x, 0, 1);
        const dx = c.dx.x;
        const dy = c.dy.x;
        const deg = c.angleDeg.x;
        const fz = c.fitZoom.x;

        applySplitDom(c.svgClip, c.hairlineEl, sp, c.coordEl);
        if (sp > 0.001) {
          c.svgPose.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${deg.toFixed(3)}deg) scale(${fz.toFixed(4)})`;
        }
        c.captionEl.style.transform = `translate3d(${(dx * 0.35).toFixed(1)}px, ${(Math.max(0, dy) * 0.25).toFixed(1)}px, 0)`;

        if (c.width <= 1 || c.height <= 1 || sp >= 0.9995) continue;
        const vp: CardViewport = {
          x: c.stageLeft,
          y: c.stageTop,
          w: c.width,
          h: c.height,
        };
        const pose: BadgePose = {
          dx,
          dy,
          angleRad: deg * DEG_TO_RAD,
          fitZoom: fz,
        };
        renderer.drawBadgeSlot(i, vp, lightDir, sp, night, paperLin, 1.0, pose);
      }
    }

    renderer.endFrame();
  };

  // ---------------------------------------------------------------------------
  // 4. Phase-Locked 60 fps Loop with True 0.0 fps Idle Sleep
  // ---------------------------------------------------------------------------
  const stopLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const tick = (now: number) => {
    rafId = 0;
    if (destroyed || document.hidden) return;

    if (nextDue > 0 && now + VSYNC_SLACK_MS < nextDue) {
      rafId = requestAnimationFrame(tick);
      return;
    }
    nextDue = nextDue > now - STEP_60_MS ? nextDue + STEP_60_MS : now + STEP_60_MS;
    rafTicksTotal++;

    const dt = lastNow > 0 ? clamp((now - lastNow) * 0.001, 0.001, 0.05) : 1 / 60;
    lastNow = now;

    let moving = false;
    if (nightSpring.step(dt)) moving = true;
    if (lightX.step(dt)) moving = true;
    if (lightY.step(dt)) moving = true;
    if (activeModalIndex >= 0) {
      if (modalSplit.step(dt)) moving = true;
    } else {
      for (const c of cards) {
        if (c.split.step(dt)) moving = true;
        if (c.dx.step(dt)) moving = true;
        if (c.dy.step(dt)) moving = true;
        if (c.angleDeg.step(dt)) moving = true;
        if (c.fitZoom.step(dt)) moving = true;
      }
    }

    renderFrame();

    if (moving) {
      rafId = requestAnimationFrame(tick);
    } else {
      lastNow = 0;
      nextDue = 0;
    }
  };

  const wake = () => {
    if (destroyed || document.hidden) return;
    if (reducedMotion) {
      nightSpring.snap(nightSpring.target);
      lightX.snap(lightX.target);
      lightY.snap(lightY.target);
      modalSplit.snap(modalSplit.target);
      for (const c of cards) {
        c.split.snap(c.split.target);
        c.dx.snap(c.dx.target);
        c.dy.snap(c.dy.target);
        c.angleDeg.snap(c.angleDeg.target);
        c.fitZoom.snap(c.fitZoom.target);
      }
      renderFrame();
      return;
    }
    if (!rafId) {
      lastNow = 0;
      nextDue = 0;
      rafId = requestAnimationFrame(tick);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Effortless Hover Crossfade & Studio Key Light
  // ---------------------------------------------------------------------------
  const onWindowPointerMove = (e: PointerEvent) => {
    if (destroyed) return;
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    lightX.target = clamp((e.clientX / w) * 2 - 1, -1, 1);
    lightY.target = clamp((e.clientY / h) * 2 - 1, -1, 1);
    wake();
  };

  const onWindowPointerLeave = () => {
    lightX.target = 0;
    lightY.target = 0;
    wake();
  };

  for (const c of cards) {
    const updateCardSplitFromPointer = (e: PointerEvent) => {
      if (activeModalIndex >= 0) return;
      const stageViewportLeft = shellDocLeft - window.scrollX + c.stageLeft;
      const t = clamp((e.clientX - stageViewportLeft) / Math.max(1, c.width), 0, 1);
      c.split.target = t;
      c.hovered = true;
      c.cardEl.classList.add("is-hovered");
      syncCardTargets(c, false, true);
      wake();
    };

    c.cardEl.addEventListener("pointerenter", updateCardSplitFromPointer, { passive: true });
    c.cardEl.addEventListener("pointermove", updateCardSplitFromPointer, { passive: true });

    c.cardEl.addEventListener(
      "pointerleave",
      () => {
        c.hovered = false;
        c.cardEl.classList.remove("is-hovered");
        syncCardTargets(c, false, false);
        wake();
      },
      { passive: true },
    );

    c.cardEl.addEventListener("click", () => openModalByIndex(c.badge.meta.index));
    c.cardEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModalByIndex(c.badge.meta.index);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 6. Click-to-Inspect Dual-Plate Museum Modal (?badge=2026..2031)
  // ---------------------------------------------------------------------------
  const syncModalSplitButtons = (val: number) => {
    modalSplitBtns.forEach((btn) => {
      const target = Number(btn.dataset.modalSplit ?? "0");
      btn.setAttribute("aria-pressed", Math.abs(target - val) < 0.08 ? "true" : "false");
    });
  };

  const syncUrlBadge = (year: string | null) => {
    try {
      const u = new URL(window.location.href);
      if (year) u.searchParams.set("badge", year);
      else u.searchParams.delete("badge");
      history.replaceState(null, "", u.toString());
    } catch {
      // ignore in sandboxed contexts
    }
  };

  const populateModal = (badge: BadgeAsset) => {
    const m = badge.meta;
    modalYearEl.textContent = m.year;
    modalTitleEl.textContent = `${m.title} — ${m.subtitle}`;
    modalMetaEl.textContent = `${m.shapeLabel} · ${m.weaveLabel} (${m.substrateHex.toUpperCase()})`;

    modalSwatchesEl.replaceChildren();
    for (const i of activeThreadIndices(badge)) {
      const th = m.threads[i];
      const chip = document.createElement("span");
      chip.className = "modal-swatch";
      chip.title = `${th.name} (${th.hex})`;
      chip.innerHTML = `<i style="background:${th.hex}"></i><span>${th.name}</span>`;
      modalSwatchesEl.append(chip);
    }

    modalSvgHost.innerHTML = buildBadgeSvgMarkup(badge, "blueprint", "modal-left");
    modalMacroSvgWrap.innerHTML = buildBadgeSvgMarkup(badge, "blueprint", "modal-right");
  };

  const openModalByIndex = (idx: number) => {
    if (idx < 0 || idx >= BADGES.length) return;
    activeModalIndex = idx;
    const badge = BADGES[idx];
    populateModal(badge);

    modalBackdrop.hidden = false;
    modalBackdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-modal");
    canvas.classList.add("is-modal");

    modalSplit.snap(0);
    syncModalSplitButtons(0);
    syncUrlBadge(badge.meta.year);

    measureAll();
    renderFrame();
    opts.onStateChange?.({ light, view: viewMode, modalYear: badge.meta.year });
  };

  const closeModal = () => {
    if (activeModalIndex < 0) return;
    activeModalIndex = -1;
    draggingLoupe = false;
    modalBackdrop.hidden = true;
    modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-modal");
    canvas.classList.remove("is-modal");
    syncUrlBadge(null);

    for (const c of cards) {
      c.hovered = false;
      c.cardEl.classList.remove("is-hovered");
      syncCardTargets(c, true);
    }
    measureAll();
    renderFrame();
    opts.onStateChange?.({ light, view: viewMode, modalYear: null });
  };

  const updateModalSplitFromPointer = (clientX: number) => {
    if (modalVp.w <= 1) return;
    const t = clamp((clientX - modalVp.x) / modalVp.w, 0, 1);
    modalSplit.target = t;
    syncModalSplitButtons(t);
    wake();
  };

  modalMacroStage.addEventListener("pointerdown", (e) => {
    draggingLoupe = true;
    modalMacroStage.setPointerCapture(e.pointerId);
    updateModalSplitFromPointer(e.clientX);
  });
  modalMacroStage.addEventListener("pointermove", (e) => {
    if (draggingLoupe) {
      updateModalSplitFromPointer(e.clientX);
    }
  });
  const endLoupeDrag = () => {
    draggingLoupe = false;
  };
  modalMacroStage.addEventListener("pointerup", endLoupeDrag);
  modalMacroStage.addEventListener("pointercancel", endLoupeDrag);

  for (const btn of modalSplitBtns) {
    btn.addEventListener("click", () => {
      const val = clamp(Number(btn.dataset.modalSplit ?? "0"), 0, 1);
      modalSplit.target = val;
      syncModalSplitButtons(val);
      wake();
    });
  }

  modalExportBtn.addEventListener("click", () => {
    if (activeModalIndex < 0) return;
    const badge = BADGES[activeModalIndex];
    const markup = buildBadgeSvgMarkup(badge, "export", "export");
    const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patch-${badge.meta.year}-${badge.meta.slug}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  modalCopyBtn.addEventListener("click", async () => {
    if (activeModalIndex < 0) return;
    const badge = BADGES[activeModalIndex];
    const markup = buildBadgeSvgMarkup(badge, "export", "export");
    try {
      await navigator.clipboard.writeText(markup);
      const prev = modalCopyBtn.textContent;
      modalCopyBtn.textContent = "Copied";
      setTimeout(() => {
        modalCopyBtn.textContent = prev;
      }, 1200);
    } catch {
      // Clipboard unavailable in insecure/headless contexts
    }
  });

  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  root.querySelector("[data-modal-close]")?.addEventListener("click", closeModal);
  root.querySelector("[data-modal-prev]")?.addEventListener("click", () => {
    if (activeModalIndex >= 0) openModalByIndex((activeModalIndex + BADGES.length - 1) % BADGES.length);
  });
  root.querySelector("[data-modal-next]")?.addEventListener("click", () => {
    if (activeModalIndex >= 0) openModalByIndex((activeModalIndex + 1) % BADGES.length);
  });

  // ---------------------------------------------------------------------------
  // 7. Observers & Listeners (Zero Polling, Zero Scroll Layout Reads)
  // ---------------------------------------------------------------------------
  const ro = new ResizeObserver(() => {
    measureAll();
    renderFrame();
  });
  ro.observe(root);
  ro.observe(gridEl);
  ro.observe(modalMacroStage);

  const onResize = () => {
    measureAll();
    renderFrame();
  };
  const onVisibility = () => {
    if (document.hidden) stopLoop();
    else renderFrame();
  };

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("pointermove", onWindowPointerMove, { passive: true });
  window.addEventListener("pointerleave", onWindowPointerLeave, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const card = cards.find((c) => c.cardEl === entry.target);
        if (card) card.visible = entry.isIntersecting;
      }
    },
    { threshold: 0.01 },
  );
  for (const c of cards) io.observe(c.cardEl);

  measureAll();
  for (const c of cards) syncCardTargets(c, true);

  const initialBadge = findBadgeByYear(opts.initialBadgeYear);
  if (initialBadge) {
    openModalByIndex(initialBadge.meta.index);
  } else {
    renderFrame();
  }

  return {
    setLight(next: LightMode) {
      if (next === light) return;
      light = next;
      document.body.dataset.light = next;
      nightSpring.target = next === "night" ? 1 : 0;
      wake();
      opts.onStateChange?.({
        light,
        view: viewMode,
        modalYear: activeModalIndex >= 0 ? BADGES[activeModalIndex].meta.year : null,
      });
    },

    setView(next: ViewMode) {
      viewMode = next;
      for (const c of cards) syncCardTargets(c, false);
      wake();
      opts.onStateChange?.({
        light,
        view: viewMode,
        modalYear: activeModalIndex >= 0 ? BADGES[activeModalIndex].meta.year : null,
      });
    },

    shuffle(seed?: number) {
      const s = seed ?? (((Math.random() * 0x7fffffff) | 0) ^ (Date.now() & 0xfffffff));
      const poses = generateStochasticPoses(s, cards.length);
      for (let i = 0; i < cards.length; i++) {
        cards[i].rest = poses[i];
        syncCardTargets(cards[i], false);
      }
      wake();
    },

    openModal(year: string) {
      const b = findBadgeByYear(year);
      if (b) openModalByIndex(b.meta.index);
    },

    closeModal,

    stepModal(delta: -1 | 1) {
      if (activeModalIndex < 0) return;
      openModalByIndex((activeModalIndex + delta + BADGES.length) % BADGES.length);
    },

    setCardReveal(index: number, reveal: number, snap = false) {
      const c = cards[index];
      if (!c) return;
      const v = clamp(reveal, 0, 1);
      if (snap) {
        c.split.snap(v);
        renderFrame();
      } else {
        c.split.target = v;
        wake();
      }
    },

    setModalSplit(split: number, snap = false) {
      const v = clamp(split, 0, 1);
      syncModalSplitButtons(v);
      if (snap) {
        modalSplit.snap(v);
        renderFrame();
      } else {
        modalSplit.target = v;
        wake();
      }
    },

    telemetry(): PatchTelemetry {
      return {
        glContextCount: getActiveGlContextCount(),
        atlasVramBytes: renderer.atlasVramBytes,
        bakeMs: renderer.bakeMs,
        glError: renderer.glError,
        activeRaf: rafId !== 0,
        rafTicksTotal,
        visibleCards: cards.filter((c) => c.visible).length,
        viewMode,
        light,
        modalYear: activeModalIndex >= 0 ? BADGES[activeModalIndex].meta.year : null,
        badgeIds: BADGES.map((b) => b.meta.year),
        posesDeg: cards.map((c) => Number(c.angleDeg.x.toFixed(2))),
      };
    },

    bench(frames = 24): number {
      return renderer.bench(renderFrame, frames);
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopLoop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerleave", onWindowPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.dispose();
    },
  };
}
