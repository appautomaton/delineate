// Front-to-Back Proscenium Portal Animated SVG Infinite-Zoom Engine (`SCENE_SCALE_RATIO = 6.0`).
//
// Architecture:
//   - 6x inter-scene magnification (`INV_SCENE_SCALE = 1/6`, `2.585` dyadic octaves/scene -> `46.53`
//     dyadic octaves = `1.01e14x` total depth across 18 worlds, meditative `~3m 10s` default cruise at `0.095` scenes/s).
//   - Only 4-5 active reusable <g> scenes mounted back-to-front (`Slot +3, +2, +1, 0`, plus `Slot -1`
//     for `frac < log(2)/log(6) ≈ 0.3869` while parent doorway expands from `S = 6` to `S = 12` past all 4 edges!).
//   - Hierarchical off-center portal embedding:
//       T_{k -> k+1}(u) = p_k + (1/6) * (u - C),  C = (1200, 800)
//   - Exact C2-continuous zero-overshoot camera trajectory `g_k(f) = d_k * cameraPanCurve(f)`:
//       g_k(0) = 0,  g_k(1) = d_k,  g_k'(0) = g_k'(1) = 0,  g_k''(0) = g_k''(1) = 0
//     guaranteeing 0.000000px position jump, 0.000000px/s velocity kink, 0.000000px/s^2 acceleration kink,
//     and strictly monotonic 0.000px-overshoot glide into compact architectural windows!
//   - Scale-continuous CSS opacity attenuation (`--z-burin-op`, `--z-contour-op`) for non-scaling copperplate
//     burin strokes so hair-fine 0.35-1.35px lines stay razor-sharp up to S=12 AND never muddy black at S=1/36..1/216!
//   - Pre-cached zero-DOM-query animated SVG driver (`data-anim`: rotate/sway/bob/drift/ripple/pulse).
//   - Smooth analytical Spring-damped multi-plane pointer parallax strictly as a function of scale S.
//   - Strict 0 / 24 / 60 fps pacing.

import {
  cameraPanCurve,
  INV_SCENE_SCALE,
  resolvePortal,
  SCENE_SCALE_RATIO,
  STAGE_CX,
  STAGE_CY,
  UNMOUNT_PARENT_FRAC,
  type OctaveScene,
  type PortalSpec,
  type RGB,
  type Theme,
} from "./scenes/types.ts";
import { smoothstep } from "./kit.ts";

const SVG_NS = "http://www.w3.org/2000/svg";
const CRUISE_FPS = 24;
const CRUISE_INTERVAL_MS = 1000 / CRUISE_FPS;
const INERTIA_LAMBDA = 6.8;
const MAX_DT = 0.05;

export const DEFAULT_CRUISE_SPEED = 0.095; // scenes/sec -> 18 / 0.095 = 189.5s (~3m 10s full loop)

// Pointer parallax Spring constants (crisp, gentle gallery lean; zero overshoot; safe inside 6x BLEED)
const SPRING_W = 10.5;
const SPRING_ZETA = 0.94;
const MAX_PARALLAX_X = 36; // 1.50% of 2400px at S=1.0
const MAX_PARALLAX_Y = 24; // 1.50% of 1600px at S=1.0

type AnimKind = "rotate" | "sway" | "bob" | "drift" | "ripple" | "pulse";

type AnimNode = {
  el: SVGGElement;
  kind: AnimKind;
  cx: number;
  cy: number;
  amp: number;
  amp2: number;
  freq: number;
  phase: number;
  base: number;
};

export type PortalSpline = {
  readonly dx: Float64Array;
  readonly dy: Float64Array;
};

/**
 * Precomputes per-scene off-center portal displacements `d_k = p_k - C` for the
 * exact C2 zero-overshoot periodic camera trajectory `g_k(f) = d_k * cameraPanCurve(f)`.
 */
export function computePortalSpline(portals: readonly PortalSpec[]): PortalSpline {
  const n = portals.length;
  const dx = new Float64Array(n);
  const dy = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    dx[i] = portals[i].cx - STAGE_CX;
    dy[i] = portals[i].cy - STAGE_CY;
  }
  return { dx, dy };
}

export type ZoomState = {
  t: number;
  base: number;
  frac: number;
  scene: OctaveScene;
  paused: boolean;
  baseSpeed: number;
  activeFps: 0 | 24 | 60;
  theme: Theme;
  animTime: number;
};

export type ZoomOptions = {
  svg: SVGSVGElement;
  defsEl: SVGDefsElement;
  backdropEl: SVGRectElement;
  stackEl: SVGGElement;
  scenes: readonly OctaveScene[];
  initialT?: number;
  initialSpeed?: number;
  initialTheme?: Theme;
  still?: boolean;
  onUpdate?: (state: ZoomState) => void;
};

function wrapT(t: number, n: number): number {
  const m = t % n;
  return m < 0 ? m + n : m;
}

function rgbStr(c: RGB): string {
  return `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
}

function lerpRgb(a: RGB, b: RGB, u: number): RGB {
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}

/**
 * C-infinity smooth parallax depth response curve as a function of scene scale S.
 * Because it depends strictly on S, Slot 0 at S=6.0 and Slot -1 at S=6.0 have IDENTICAL
 * parallax offsets across every scene boundary (0.000px jump!).
 * Relative shift between Slot 0 (S=1) and Slot +1 (S=1/6) is <= 17.7px X / 11.8px Y (safe inside 6x BLEED),
 * and at S=12.0 unmount offset/S <= 3.65px X / 2.43px Y (strictly inside `requiredPortalClearBox`!).
 */
function parallaxDepth(scale: number): number {
  return (1.24 * scale) / (0.24 + scale);
}

const INV_SCALE_2 = INV_SCENE_SCALE * INV_SCENE_SCALE; // 1/36
const INV_SCALE_3 = INV_SCALE_2 * INV_SCENE_SCALE; // 1/216

export class ZoomEngine {
  readonly scenes: readonly OctaveScene[];
  readonly portals: readonly PortalSpec[];
  readonly spline: PortalSpline;
  readonly n: number;
  private readonly svg: SVGSVGElement;
  private readonly backdropEl: SVGRectElement;
  private readonly stackEl: SVGGElement;
  private readonly groups: SVGGElement[];
  private readonly animNodes: AnimNode[][];
  private readonly burinOpCache: Float32Array;
  private readonly contourOpCache: Float32Array;
  private readonly onUpdate?: (state: ZoomState) => void;

  private t: number;
  private animTime = 0;
  private theme: Theme;
  private baseSpeed: number;
  private impulseVel = 0;
  private holdVel = 0;
  private paused: boolean;
  private dragging = false;
  private mountedBase = -1;
  private mountedHasParent = false;
  private rafId = 0;
  private lastTs = 0;
  private lastCruiseDrawTs = 0;
  private lastActiveTs = 0;
  private activeFps: 0 | 24 | 60 = 0;

  // Pointer parallax normalized target & Spring state in [-1, 1]
  private ptrTargetX = 0;
  private ptrTargetY = 0;
  private ptrX = 0;
  private ptrY = 0;
  private ptrVx = 0;
  private ptrVy = 0;

  constructor(opts: ZoomOptions) {
    this.scenes = opts.scenes;
    this.n = opts.scenes.length;
    this.portals = this.scenes.map((s) => resolvePortal(s));
    this.spline = computePortalSpline(this.portals);
    this.svg = opts.svg;
    this.backdropEl = opts.backdropEl;
    this.stackEl = opts.stackEl;
    this.onUpdate = opts.onUpdate;
    this.t = wrapT(opts.initialT ?? 0, this.n);
    this.baseSpeed = opts.initialSpeed ?? DEFAULT_CRUISE_SPEED;
    this.theme = opts.initialTheme ?? "day";
    this.paused = Boolean(opts.still);

    // Mount all scene <defs> once into shared SVG <defs>.
    opts.defsEl.innerHTML = this.scenes.map((s) => s.defs).join("");

    // Pre-build reusable <g> subtrees AND pre-cache all animated <g data-anim> refs once!
    this.groups = [];
    this.animNodes = [];
    this.burinOpCache = new Float32Array(this.n).fill(-1);
    this.contourOpCache = new Float32Array(this.n).fill(-1);

    for (let i = 0; i < this.n; i++) {
      const scene = this.scenes[i];
      const p = this.portals[i];
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "octave");
      g.setAttribute("data-octave", String(scene.index));
      g.setAttribute("data-portal", `${p.cx},${p.cy},${p.rx},${p.ry}`);
      g.innerHTML = scene.markup;
      this.groups.push(g);

      const nodes: AnimNode[] = [];
      g.querySelectorAll<SVGGElement>("[data-anim]").forEach((el) => {
        const kind = el.getAttribute("data-anim") as AnimKind;
        nodes.push({
          el,
          kind,
          cx: Number(el.getAttribute("data-cx") ?? "0"),
          cy: Number(el.getAttribute("data-cy") ?? "0"),
          amp: Number(el.getAttribute("data-amp") ?? "0"),
          amp2: Number(el.getAttribute("data-amp2") ?? "0"),
          freq: Number(el.getAttribute("data-freq") ?? "1"),
          phase: Number(el.getAttribute("data-phase") ?? "0"),
          base: Number(el.getAttribute("data-base") ?? "1"),
        });
      });
      this.animNodes.push(nodes);
    }

    this.render();
    document.addEventListener("visibilitychange", this.handleVisibility);
    if (!this.paused) this.startLoop();
  }

  private handleVisibility = (): void => {
    if (document.hidden) {
      this.stopLoop();
    } else if (!this.paused || this.needsSpringStep()) {
      this.lastTs = 0;
      this.startLoop();
    }
  };

  getT(): number {
    return this.t;
  }

  getAnimTime(): number {
    return this.animTime;
  }

  getTheme(): Theme {
    return this.theme;
  }

  getSpeed(): number {
    return this.baseSpeed;
  }

  isPaused(): boolean {
    return this.paused;
  }

  /** Evaluates the C2 zero-overshoot camera center in active base scene coordinates for current `t`. */
  getCameraPos(): { x: number; y: number } {
    const base = Math.floor(this.t) % this.n;
    const w = cameraPanCurve(this.t - Math.floor(this.t));
    return {
      x: STAGE_CX + this.spline.dx[base] * w,
      y: STAGE_CY + this.spline.dy[base] * w,
    };
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    this.render();
  }

  setT(nextT: number): void {
    this.t = wrapT(nextT, this.n);
    this.render();
  }

  /** Deterministically advances or sets internal SVG animation clock (for QA delta proofs). */
  setAnimTime(seconds: number): void {
    this.animTime = seconds;
    this.render();
  }

  /** Sets normalized pointer target [-1, 1] for Spring-damped multi-plane parallax. */
  setPointerTarget(nx: number, ny: number, immediate = false): void {
    const cx = Math.max(-1, Math.min(1, nx));
    const cy = Math.max(-1, Math.min(1, ny));
    this.ptrTargetX = cx;
    this.ptrTargetY = cy;
    if (immediate) {
      this.ptrX = cx;
      this.ptrY = cy;
      this.ptrVx = 0;
      this.ptrVy = 0;
      this.render();
      return;
    }
    this.markActive();
    if (!this.rafId && !document.hidden) this.startLoop();
  }

  setSpeed(speed: number): void {
    this.baseSpeed = Math.max(-1.5, Math.min(1.5, speed));
    this.markActive();
    if (!this.paused && !this.rafId && !document.hidden) this.startLoop();
  }

  reverse(): void {
    this.setSpeed(-this.baseSpeed || -DEFAULT_CRUISE_SPEED);
  }

  pause(): void {
    this.paused = true;
    this.impulseVel = 0;
    this.holdVel = 0;
    if (!this.needsSpringStep()) {
      this.stopLoop();
      this.activeFps = 0;
    }
    this.emitState();
  }

  play(): void {
    this.paused = false;
    this.lastTs = 0;
    if (!document.hidden) this.startLoop();
    this.emitState();
  }

  toggle(): boolean {
    if (this.paused) this.play();
    else this.pause();
    return !this.paused;
  }

  addImpulse(deltaScenesPerSec: number): void {
    this.impulseVel = Math.max(-2.0, Math.min(2.0, this.impulseVel + deltaScenesPerSec));
    this.markActive();
    if (!this.rafId && !document.hidden) this.startLoop();
  }

  scrub(deltaScenes: number): void {
    this.t = wrapT(this.t + deltaScenes, this.n);
    this.markActive();
    this.render();
  }

  setDragging(active: boolean): void {
    this.dragging = active;
    if (active) this.markActive();
  }

  setHoldVelocity(scenesPerSec: number): void {
    this.holdVel = scenesPerSec;
    if (Math.abs(scenesPerSec) > 1e-4) {
      this.markActive();
      if (!this.rafId && !document.hidden) this.startLoop();
    }
  }

  private markActive(): void {
    this.lastActiveTs = performance.now();
  }

  private needsSpringStep(): boolean {
    return (
      Math.abs(this.ptrX - this.ptrTargetX) > 4e-4 ||
      Math.abs(this.ptrY - this.ptrTargetY) > 4e-4 ||
      Math.abs(this.ptrVx) > 4e-4 ||
      Math.abs(this.ptrVy) > 4e-4
    );
  }

  private isInteractive(now: number): boolean {
    return (
      this.dragging ||
      Math.abs(this.impulseVel) > 0.004 ||
      Math.abs(this.holdVel) > 0.001 ||
      this.needsSpringStep() ||
      now - this.lastActiveTs < 420
    );
  }

  private startLoop(): void {
    if (this.rafId) return;
    this.lastTs = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  private stopLoop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.activeFps = 0;
  }

  private stepParallaxSpring(dt: number): void {
    const k = SPRING_W * SPRING_W;
    const c = 2 * SPRING_ZETA * SPRING_W;
    const h = dt * 0.5;
    for (let s = 0; s < 2; s++) {
      const ax = (this.ptrTargetX - this.ptrX) * k - this.ptrVx * c;
      const ay = (this.ptrTargetY - this.ptrY) * k - this.ptrVy * c;
      this.ptrVx += ax * h;
      this.ptrVy += ay * h;
      this.ptrX += this.ptrVx * h;
      this.ptrY += this.ptrVy * h;
    }
    if (!this.needsSpringStep()) {
      this.ptrX = this.ptrTargetX;
      this.ptrY = this.ptrTargetY;
      this.ptrVx = 0;
      this.ptrVy = 0;
    }
  }

  private tick = (ts: number): void => {
    this.rafId = 0;
    if (document.hidden) {
      this.activeFps = 0;
      return;
    }

    const interactive = this.isInteractive(ts);
    const shouldMove =
      !this.paused ||
      Math.abs(this.impulseVel) > 0.004 ||
      Math.abs(this.holdVel) > 0.001 ||
      this.needsSpringStep();

    if (!shouldMove) {
      this.activeFps = 0;
      this.emitState();
      return;
    }

    // 24 fps calm cruise gate when not actively scrubbing/steering; 60 fps when active!
    if (!interactive && this.lastCruiseDrawTs && ts - this.lastCruiseDrawTs < CRUISE_INTERVAL_MS - 1.5) {
      this.activeFps = 24;
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    const dt = this.lastTs ? Math.min(MAX_DT, Math.max(0, (ts - this.lastTs) / 1000)) : 1 / 60;
    this.lastTs = ts;
    this.activeFps = interactive ? 60 : 24;
    if (!interactive) this.lastCruiseDrawTs = ts;

    if (!this.paused) {
      this.animTime += dt;
    }

    const cruise = this.paused || this.dragging ? 0 : this.baseSpeed;
    const totalVel = cruise + this.holdVel + this.impulseVel;
    if (Math.abs(totalVel) > 1e-6) {
      this.t = wrapT(this.t + totalVel * dt, this.n);
    }

    if (Math.abs(this.impulseVel) > 1e-5) {
      this.impulseVel *= Math.exp(-INERTIA_LAMBDA * dt);
      if (Math.abs(this.impulseVel) < 0.002) this.impulseVel = 0;
    }

    if (this.needsSpringStep()) {
      this.stepParallaxSpring(dt);
    }

    this.render();
    this.rafId = requestAnimationFrame(this.tick);
  };

  /**
   * Core front-to-back 5-slot (4-slot past S=12 unmount) 6x-depth off-center C2 SVG compositor.
   */
  render(): void {
    const base = Math.floor(this.t) % this.n;
    const frac = this.t - Math.floor(this.t);
    const A = Math.pow(SCENE_SCALE_RATIO, frac);
    const sp = this.spline;

    const idxP4 = (base + 4) % this.n;
    const idxP3 = (base + 3) % this.n;
    const idxP2 = (base + 2) % this.n;
    const idxP1 = (base + 1) % this.n;
    const idx0 = base;
    const idxM1 = (base - 1 + this.n) % this.n;

    // Parent Slot -1 unmounts cleanly once S_{-1} >= 12.0 (frac >= log(2)/log(6) ≈ 0.3869),
    // at which point 100% of parent's architectural doorway has cleared all 4 viewport edges!
    const showParent = frac < UNMOUNT_PARENT_FRAC;

    if (base !== this.mountedBase || showParent !== this.mountedHasParent) {
      const prevBase = this.mountedBase;
      const prevHasParent = this.mountedHasParent;
      this.mountedBase = base;
      this.mountedHasParent = showParent;

      // Surgical zero-detach DOM updates on normal forward/unmount/reverse crossings so continuing
      // <g class="octave"> nodes NEVER leave the DOM tree mid-glide!
      if (prevBase === base && prevHasParent && !showParent) {
        this.groups[idxM1].remove();
      } else if (prevBase === base && !prevHasParent && showParent) {
        this.stackEl.append(this.groups[idxM1]);
      } else if (prevBase === (base - 1 + this.n) % this.n && !prevHasParent && showParent) {
        this.stackEl.prepend(this.groups[idxP3]);
      } else if (prevBase === (base + 1) % this.n && prevHasParent && !showParent) {
        this.groups[idxP4].remove();
      } else if (showParent) {
        this.stackEl.replaceChildren(
          this.groups[idxP3],
          this.groups[idxP2],
          this.groups[idxP1],
          this.groups[idx0],
          this.groups[idxM1],
        );
      } else {
        this.stackEl.replaceChildren(
          this.groups[idxP3],
          this.groups[idxP2],
          this.groups[idxP1],
          this.groups[idx0],
        );
      }
    }

    // C1-continuous distant vanishing mist color matching active Day/Night theme
    const mistBlend = smoothstep(0.7, 1.0, frac);
    const cA = this.theme === "night" ? this.scenes[idxP3].coreColorNight : this.scenes[idxP3].coreColorDay;
    const cB = this.theme === "night" ? this.scenes[idxP4].coreColorNight : this.scenes[idxP4].coreColorDay;
    this.backdropEl.setAttribute("fill", rgbStr(lerpRgb(cA, cB, mistBlend)));

    // Exact C2 zero-overshoot camera offset g_k(f) = d_k * cameraPanCurve(f) in scene `base` coordinates.
    const w = cameraPanCurve(frac);
    const gx = sp.dx[idx0] * w;
    const gy = sp.dy[idx0] * w;

    // Hierarchical origin-at-C offsets (P_j - C) in scene `base` coordinates (`r = 1/6`):
    //   Slot  0: (0, 0), s = 1
    //   Slot +1: d_0, s = 1/6
    //   Slot +2: d_0 + (1/6) * d_1, s = 1/36
    //   Slot +3: d_0 + (1/6) * d_1 + (1/36) * d_2, s = 1/216
    //   Slot -1: -6 * d_{-1}, s = 6
    const ox0 = 0;
    const oy0 = 0;

    const ox1 = sp.dx[idx0];
    const oy1 = sp.dy[idx0];

    const ox2 = ox1 + INV_SCENE_SCALE * sp.dx[idxP1];
    const oy2 = oy1 + INV_SCENE_SCALE * sp.dy[idxP1];

    const ox3 = ox2 + INV_SCALE_2 * sp.dx[idxP2];
    const oy3 = oy2 + INV_SCALE_2 * sp.dy[idxP2];

    // Apply off-center C2 transform + C-infinity parallax + scale-continuous burin attenuation
    this.setLayerTransform(idxP3, A * INV_SCALE_3, ox3, oy3, gx, gy, A, smoothstep(0.0, 0.7, frac));
    this.setLayerTransform(idxP2, A * INV_SCALE_2, ox2, oy2, gx, gy, A, 1);
    this.setLayerTransform(idxP1, A * INV_SCENE_SCALE, ox1, oy1, gx, gy, A, 1);
    this.setLayerTransform(idx0, A, ox0, oy0, gx, gy, A, 1);

    if (showParent) {
      const oxM1 = -SCENE_SCALE_RATIO * sp.dx[idxM1];
      const oyM1 = -SCENE_SCALE_RATIO * sp.dy[idxM1];
      this.setLayerTransform(idxM1, A * SCENE_SCALE_RATIO, oxM1, oyM1, gx, gy, A, 1);
      this.updateAnimations(idxP3, idxP2, idxP1, idx0, idxM1);
    } else {
      this.updateAnimations(idxP3, idxP2, idxP1, idx0);
    }

    this.emitState(base, frac);
  }

  private setLayerTransform(
    sceneIdx: number,
    scale: number,
    ox: number,
    oy: number,
    gx: number,
    gy: number,
    A: number,
    opacity: number,
  ): void {
    const g = this.groups[sceneIdx];
    const depth = parallaxDepth(scale);
    const px = -this.ptrX * MAX_PARALLAX_X * depth;
    const py = -this.ptrY * MAX_PARALLAX_Y * depth;

    // Screen center of slot `j`: C + A * (P_j - c_k(f)) + parallax(S_j)
    const scx = STAGE_CX + A * (ox - gx) + px;
    const scy = STAGE_CY + A * (oy - gy) + py;
    const tx = scx - scale * STAGE_CX;
    const ty = scy - scale * STAGE_CY;

    g.setAttribute(
      "transform",
      `matrix(${scale.toFixed(7)} 0 0 ${scale.toFixed(7)} ${tx.toFixed(4)} ${ty.toFixed(4)})`,
    );

    if (opacity <= 0.0001) {
      g.style.visibility = "hidden";
      if (g.hasAttribute("opacity")) g.removeAttribute("opacity");
    } else {
      if (g.style.visibility) g.style.visibility = "";
      if (opacity < 0.9999) {
        g.setAttribute("opacity", opacity.toFixed(5));
      } else if (g.hasAttribute("opacity")) {
        g.removeAttribute("opacity");
      }
    }

    // Scale-continuous aerial attenuation for non-scaling copperplate burin strokes via `stroke-opacity`
    // (ZERO `opacity` SaveLayer nodes -> zero Chromium GPU/CPU rasterizer threshold flips!).
    const burinOp = smoothstep(0.08, 0.55, scale);
    const contourOp = smoothstep(0.04, 0.25, scale);
    if (Math.abs(burinOp - this.burinOpCache[sceneIdx]) > 1e-5) {
      this.burinOpCache[sceneIdx] = burinOp;
      const off = burinOp <= 0.0001;
      g.classList.toggle("burin-off", off);
      if (off || burinOp >= 0.99999) g.style.removeProperty("--z-burin-op");
      else g.style.setProperty("--z-burin-op", burinOp.toFixed(5));
    }
    if (Math.abs(contourOp - this.contourOpCache[sceneIdx]) > 1e-5) {
      this.contourOpCache[sceneIdx] = contourOp;
      const off = contourOp <= 0.0001;
      g.classList.toggle("contour-off", off);
      if (off || contourOp >= 0.99999) g.style.removeProperty("--z-contour-op");
      else g.style.setProperty("--z-contour-op", contourOp.toFixed(5));
    }
  }

  private updateAnimations(...indices: number[]): void {
    const tm = this.animTime;
    for (let s = 0; s < indices.length; s++) {
      const list = this.animNodes[indices[s]];
      for (let i = 0; i < list.length; i++) {
        const n = list[i];
        if (n.kind === "rotate") {
          const deg = (tm * n.amp + n.phase) % 360;
          n.el.setAttribute("transform", `rotate(${deg.toFixed(2)} ${n.cx} ${n.cy})`);
        } else if (n.kind === "sway") {
          const deg = Math.sin(tm * n.freq + n.phase) * n.amp;
          n.el.setAttribute("transform", `rotate(${deg.toFixed(2)} ${n.cx} ${n.cy})`);
        } else if (n.kind === "bob") {
          const s1 = Math.sin(tm * n.freq + n.phase);
          const dy = s1 * n.amp;
          const deg = Math.cos(tm * n.freq * 0.8 + n.phase) * n.amp2;
          n.el.setAttribute("transform", `translate(0 ${dy.toFixed(2)}) rotate(${deg.toFixed(2)} ${n.cx} ${n.cy})`);
        } else if (n.kind === "drift") {
          const dx = Math.sin(tm * n.freq + n.phase) * n.amp;
          const dy = Math.cos(tm * n.freq * 0.7 + n.phase) * n.amp2;
          n.el.setAttribute("transform", `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
        } else if (n.kind === "ripple") {
          const dx = Math.sin(tm * n.freq + n.phase) * n.amp;
          const op = Math.max(0.12, Math.min(1, n.base + Math.cos(tm * n.freq * 1.3 + n.phase) * n.amp2));
          n.el.setAttribute("transform", `translate(${dx.toFixed(2)} 0)`);
          n.el.setAttribute("opacity", op.toFixed(3));
        } else if (n.kind === "pulse") {
          const op = Math.max(0.08, Math.min(1, n.base + Math.sin(tm * n.freq + n.phase) * n.amp));
          n.el.setAttribute("opacity", op.toFixed(3));
        }
      }
    }
  }

  private emitState(base = Math.floor(this.t) % this.n, frac = this.t - Math.floor(this.t)): void {
    this.onUpdate?.({
      t: this.t,
      base,
      frac,
      scene: this.scenes[base],
      paused: this.paused,
      baseSpeed: this.baseSpeed,
      activeFps: this.activeFps,
      theme: this.theme,
      animTime: this.animTime,
    });
  }

  /**
   * Benchmarks real Chrome frame cost across `frames` live animation frames advancing BOTH T and animTime!
   */
  measureFrames(frames = 90, stepPerFrame = 0.011): Promise<{
    frames: number;
    avgUpdateMs: number;
    p95UpdateMs: number;
    avgRafDeltaMs: number;
    p95RafDeltaMs: number;
    mountedNodes: number;
    totalSceneElements: number;
    totalAnimGroups: number;
  }> {
    const wasPaused = this.paused;
    this.pause();
    const startT = this.t;
    const startAnim = this.animTime;
    const updateTimes: number[] = [];
    const rafDeltas: number[] = [];
    let prevTs = 0;

    return new Promise((resolve) => {
      let i = 0;
      const step = (ts: number) => {
        if (prevTs > 0) rafDeltas.push(ts - prevTs);
        prevTs = ts;
        const t0 = performance.now();
        this.animTime = startAnim + i * (1 / 60);
        this.t = wrapT(startT + i * stepPerFrame, this.n);
        this.render();
        void this.svg.getBoundingClientRect();
        const t1 = performance.now();
        updateTimes.push(t1 - t0);
        i++;
        if (i < frames) {
          requestAnimationFrame(step);
        } else {
          this.animTime = startAnim;
          this.setT(startT);
          if (!wasPaused) this.play();
          const sortedU = [...updateTimes].sort((a, b) => a - b);
          const sortedR = [...rafDeltas].sort((a, b) => a - b);
          const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
          const p95 = (arr: number[]) => arr[Math.min(arr.length - 1, Math.floor(arr.length * 0.95))] ?? 0;
          resolve({
            frames,
            avgUpdateMs: Number(avg(updateTimes).toFixed(3)),
            p95UpdateMs: Number(p95(sortedU).toFixed(3)),
            avgRafDeltaMs: Number(avg(rafDeltas).toFixed(3)),
            p95RafDeltaMs: Number(p95(sortedR).toFixed(3)),
            mountedNodes: this.stackEl.querySelectorAll("path,circle,ellipse,rect,polygon").length,
            totalSceneElements: this.scenes.reduce((s, sc) => s + sc.stats.elements, 0),
            totalAnimGroups: this.scenes.reduce((s, sc) => s + sc.stats.animGroups, 0),
          });
        }
      };
      requestAnimationFrame(step);
    });
  }

  destroy(): void {
    this.stopLoop();
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }
}
