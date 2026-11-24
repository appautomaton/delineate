// Fluid & field material tiles: underdamped liquid slosh with live waterline polarity inversion,
// genuine 2nd-order Spring dot lattices (never 1st-order lerp!), and quartic wave ripples.
// Tiles: 15 Tide Progress, 16 Magnet Grid, 19 Ripple Pad.

import {
  Spring,
  clamp,
  createStageSvg,
  easeOutQuart,
  lerp,
  stagePoint,
  svgEl,
  uniqueId,
} from "../physics.ts";
import type { TileSpec } from "../tile.ts";

// ── 15 · Tide Progress ─────────────────────────────────────────────────────────────────────────
// Circular vessel with lively underdamped liquid surge (zeta 0.34), expressive out-of-phase
// double sine waves, split-polarity live waterline numeral, and calm flat Play-mode rest.
export const tideProgress: TileSpec = {
  slug: "tide-progress",
  name: "Tide Progress",
  material: "fluid",
  hint: "Drag vertically to pour, or click to step",
  mount(ctx) {
    const svg = createStageSvg();
    const CX = 100;
    const CY = 70;
    const R = 46;

    const circleClipId = uniqueId("tide-circle");
    const waveClipId = uniqueId("tide-wave");
    const defs = svgEl("defs");

    const circleClip = svgEl("clipPath", { id: circleClipId });
    circleClip.append(svgEl("circle", { cx: CX, cy: CY, r: R - 0.5 }));

    const waveClip = svgEl("clipPath", { id: waveClipId });
    const waveClipPath = svgEl("path");
    waveClip.append(waveClipPath);
    defs.append(circleClip, waveClip);

    const vessel = svgEl("circle", {
      cx: CX,
      cy: CY,
      r: R,
      fill: "var(--m-well)",
      stroke: "var(--m-border-strong)",
      "stroke-width": 1.2,
    });

    const liquidG = svgEl("g", { "clip-path": `url(#${circleClipId})` });
    const backWave = svgEl("path", { fill: "var(--m-ink-dim)" });
    const frontWave = svgEl("path", { fill: "var(--m-ink)" });

    const textAbove = svgEl("text", {
      x: CX,
      y: CY + 1,
      "text-anchor": "middle",
      "dominant-baseline": "central",
      fill: "var(--m-ink)",
      "font-family": "var(--m-mono)",
      "font-size": 17.5,
      "font-weight": 600,
    });
    const textBelow = svgEl("text", {
      x: CX,
      y: CY + 1,
      "text-anchor": "middle",
      "dominant-baseline": "central",
      fill: "var(--m-paper)",
      "font-family": "var(--m-mono)",
      "font-size": 17.5,
      "font-weight": 600,
      "clip-path": `url(#${waveClipId})`,
    });

    liquidG.append(backWave, textAbove, frontWave, textBelow);
    const rim = svgEl("circle", {
      cx: CX,
      cy: CY,
      r: R,
      fill: "none",
      stroke: "var(--m-border-strong)",
      "stroke-width": 1.2,
    });
    svg.append(defs, vessel, liquidG, rim);

    const levels = [0.2, 0.52, 0.8, 0.92, 0.34];
    let levelIdx = 1;
    // Lower damping (zeta 0.34) makes the liquid surge past target & settle back organically!
    const fill = new Spring(0.52, { omega: 9.2, zeta: 0.34 });
    const slosh = new Spring(0, { omega: 13, zeta: 0.16 });

    let wavePhase = 0;
    let waveEnv = 0;
    let dragging = false;
    let moved = false;
    let downY = 0;
    let demoActive = false;

    const buildWave = (level: number, phase: number, amp: number, freq: number): string => {
      const topY = CY + R - level * (R * 2);
      const xStart = CX - R - 4;
      const xEnd = CX + R + 4;
      const steps = 16;
      let d = `M${xStart} ${(CY + R + 8).toFixed(1)} L${xStart} ${topY.toFixed(2)}`;
      const edgeDamp = Math.sin(clamp(level, 0, 1) * Math.PI);
      const a = amp * (0.25 + 0.75 * edgeDamp);
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const x = lerp(xStart, xEnd, u);
        const y = topY + Math.sin(u * Math.PI * freq + phase) * a;
        d += ` L${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      d += ` L${xEnd} ${(CY + R + 8).toFixed(1)} Z`;
      return d;
    };

    const setLevel = (next: number, fromUser: boolean) => {
      const clamped = clamp(next, 0.04, 0.98);
      const delta = clamped - fill.target;
      fill.target = clamped;
      slosh.impulse(Math.min(68, Math.abs(delta) * 110));
      waveEnv = 1;
      if (fromUser) ctx.sound("drop", clamp(0.5 + Math.abs(delta), 0.5, 1));
      ctx.wake();
    };

    svg.addEventListener("pointerdown", (e) => {
      ctx.interact();
      svg.setPointerCapture(e.pointerId);
      const pt = stagePoint(svg, e);
      dragging = true;
      moved = false;
      downY = pt.y;
      waveEnv = 1;
      ctx.wake();
    });

    svg.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const pt = stagePoint(svg, e);
      if (Math.abs(pt.y - downY) > 4) moved = true;
      const next = clamp((CY + R - pt.y) / (R * 2), 0.04, 0.98);
      const dv = Math.abs(next - fill.target);
      fill.target = next;
      waveEnv = 1;
      if (dv > 0.01) slosh.impulse(dv * 55);
      ctx.wake();
    });

    const release = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
      if (!moved) {
        levelIdx = (levelIdx + 1) % levels.length;
        setLevel(levels[levelIdx], true);
      }
    };
    svg.addEventListener("pointerup", release);
    svg.addEventListener("pointercancel", release);

    let lastPct = "";

    const render = () => {
      const lvl = clamp(fill.x, 0, 1);
      const extra = clamp(Math.abs(slosh.x) * 0.55, 0, 9.5);
      const baseAmp = 4.6 * waveEnv;
      const backD = buildWave(clamp(lvl + 0.03 * waveEnv, 0, 1), -wavePhase * 0.9 + 1.5, baseAmp * 0.9 + extra * 0.85, 2.2);
      const frontD = buildWave(lvl, wavePhase, baseAmp + extra, 2.0);
      backWave.setAttribute("d", backD);
      frontWave.setAttribute("d", frontD);
      waveClipPath.setAttribute("d", frontD);

      const pct = `${Math.round(lvl * 100)}%`;
      if (pct !== lastPct) {
        lastPct = pct;
        textAbove.textContent = pct;
        textBelow.textContent = pct;
      }
    };

    let lastBeat = -1;
    render();

    return {
      el: svg,
      step(dt) {
        const a = fill.step(dt, 0.001, 0.004);
        const b = slosh.step(dt, 0.04, 0.2);
        const driven = a || b || dragging || demoActive;
        if (driven) {
          waveEnv = Math.min(1, waveEnv + dt * 5);
        } else if (waveEnv > 0.006) {
          waveEnv *= Math.exp(-3.0 * dt);
        } else {
          waveEnv = 0;
        }
        const active = driven || waveEnv > 0;
        if (active) wavePhase += dt * (3.2 + clamp(Math.abs(slosh.x) * 0.16, 0, 4.8));
        demoActive = false;
        render();
        return active;
      },
      demo(cycleTime) {
        demoActive = true;
        ctx.wake();
        const beat = Math.floor(cycleTime / 1.75);
        if (beat !== lastBeat) {
          lastBeat = beat;
          levelIdx = beat % levels.length;
          setLevel(levels[levelIdx], false);
        }
      },
      trigger() {
        ctx.interact();
        levelIdx = (levelIdx + 1) % levels.length;
        setLevel(levels[levelIdx], true);
      },
    };
  },
};

// ── 16 · Magnet Grid ───────────────────────────────────────────────────────────────────────────
// 7×6 dot lattice where EVERY dot runs on genuine 2nd-order Spring physics (sx, sy, sr) — so
// dots whip inward with real inertia and elastic rebound instead of 1st-order exponential lerp!
export const magnetGrid: TileSpec = {
  slug: "magnet-grid",
  name: "Magnet Grid",
  material: "fluid",
  hint: "Move pointer across the field",
  mount(ctx) {
    const svg = createStageSvg();
    const COLS = 7;
    const ROWS = 6;
    const PAD_X = 34;
    const PAD_Y = 22;
    const GAP_X = (200 - PAD_X * 2) / (COLS - 1);
    const GAP_Y = (140 - PAD_Y * 2) / (ROWS - 1);
    const BASE_R = 1.55;

    type Dot = {
      bx: number;
      by: number;
      sx: Spring;
      sy: Spring;
      sr: Spring;
      lastCx: number;
      lastCy: number;
      lastR: number;
      lastOp: number;
      el: SVGCircleElement;
    };

    const dots: Dot[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const bx = PAD_X + c * GAP_X;
        const by = PAD_Y + r * GAP_Y;
        const el = svgEl("circle", {
          cx: bx.toFixed(1),
          cy: by.toFixed(1),
          r: BASE_R,
          fill: "var(--m-ink)",
          opacity: 0.24,
        });
        svg.append(el);
        dots.push({
          bx,
          by,
          sx: new Spring(bx, { omega: 19, zeta: 0.36 }),
          sy: new Spring(by, { omega: 19, zeta: 0.36 }),
          sr: new Spring(BASE_R, { omega: 22, zeta: 0.42 }),
          lastCx: Math.round(bx * 10),
          lastCy: Math.round(by * 10),
          lastR: Math.round(BASE_R * 20),
          lastOp: 24,
          el,
        });
      }
    }

    let poleActive = false;
    let poleX = 100;
    let poleY = 70;
    let pulseBoost = 0;
    let transientHold = 0;
    let demoDriving = false;

    svg.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      ctx.interact();
      const pt = stagePoint(svg, e);
      poleActive = true;
      transientHold = 0;
      poleX = pt.x;
      poleY = pt.y;
      ctx.wake();
    });
    svg.addEventListener("pointermove", (e) => {
      ctx.interact();
      const pt = stagePoint(svg, e);
      poleActive = true;
      poleX = pt.x;
      poleY = pt.y;
      ctx.wake();
    });
    svg.addEventListener("pointerdown", (e) => {
      ctx.interact();
      const pt = stagePoint(svg, e);
      poleActive = true;
      poleX = pt.x;
      poleY = pt.y;
      pulseBoost = 1;
      if (e.pointerType !== "mouse") transientHold = 0.65;
      ctx.sound("drop", 0.72);
      ctx.wake();
    });
    const endTouch = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        transientHold = 0.45;
        ctx.wake();
      }
    };
    svg.addEventListener("pointerup", endTouch);
    svg.addEventListener("pointercancel", endTouch);
    svg.addEventListener("pointerleave", () => {
      poleActive = false;
      transientHold = 0;
      ctx.wake();
    });

    const SIGMA2 = 36 * 36;

    return {
      el: svg,
      step(dt) {
        let active = false;
        if (transientHold > 0) {
          transientHold -= dt;
          active = true;
          if (transientHold <= 0) {
            transientHold = 0;
            poleActive = false;
          }
        }
        if (pulseBoost > 0.005) {
          pulseBoost *= Math.exp(-6.5 * dt);
          active = true;
        } else {
          pulseBoost = 0;
        }

        const hasPole = poleActive || demoDriving;
        for (const d of dots) {
          if (hasPole) {
            const dx = poleX - d.bx;
            const dy = poleY - d.by;
            const dist2 = dx * dx + dy * dy;
            const w = Math.exp(-dist2 / (2 * SIGMA2));
            // Bold gravitational lens cluster matching reference 32!
            const pull = w * (0.60 + pulseBoost * 0.18);
            d.sx.target = d.bx + dx * pull;
            d.sy.target = d.by + dy * pull;
            d.sr.target = BASE_R + w * (4.1 + pulseBoost * 1.4);
          } else {
            d.sx.target = d.bx;
            d.sy.target = d.by;
            d.sr.target = BASE_R;
          }

          const ax = d.sx.step(dt, 0.04, 0.15);
          const ay = d.sy.step(dt, 0.04, 0.15);
          const ar = d.sr.step(dt, 0.015, 0.06);
          if (ax || ay || ar) {
            active = true;
            const qx = Math.round(d.sx.x * 10);
            const qy = Math.round(d.sy.x * 10);
            const rVal = clamp(d.sr.x, 0.8, 7.5);
            const qr = Math.round(rVal * 20);
            const qop = Math.round((0.24 + clamp((rVal - BASE_R) / 3.8, 0, 1) * 0.76) * 100);
            if (qx !== d.lastCx) {
              d.lastCx = qx;
              d.el.setAttribute("cx", (qx / 10).toFixed(1));
            }
            if (qy !== d.lastCy) {
              d.lastCy = qy;
              d.el.setAttribute("cy", (qy / 10).toFixed(1));
            }
            if (qr !== d.lastR) {
              d.lastR = qr;
              d.el.setAttribute("r", (qr / 20).toFixed(2));
            }
            if (qop !== d.lastOp) {
              d.lastOp = qop;
              d.el.setAttribute("opacity", (qop / 100).toFixed(2));
            }
          }
        }

        const stillDriving = demoDriving;
        demoDriving = false;
        return active || stillDriving;
      },
      demo(cycleTime) {
        demoDriving = true;
        ctx.wake();
        poleX = 100 + Math.sin(cycleTime * 1.55) * 52;
        poleY = 70 + Math.sin(cycleTime * 3.1) * 30;
      },
      trigger() {
        ctx.interact();
        poleActive = true;
        transientHold = 0.7;
        poleX = 100;
        poleY = 70;
        pulseBoost = 1;
        ctx.sound("drop", 0.8);
        ctx.wake();
      },
    };
  },
};

// ── 19 · Ripple Pad ────────────────────────────────────────────────────────────────────────────
// Precision matte touch pad with subtle etched reticles, impact flash bead, and snappy quartic
// ease-out concentric wave chords that launch rapidly and dissipate gracefully.
export const ripplePad: TileSpec = {
  slug: "ripple-pad",
  name: "Ripple Pad",
  material: "fluid",
  hint: "Click or drag anywhere on the pad",
  mount(ctx) {
    const svg = createStageSvg();
    const PX = 22;
    const PY = 20;
    const PW = 156;
    const PH = 100;

    const clipId = uniqueId("ripple-clip");
    const defs = svgEl("defs");
    const clip = svgEl("clipPath", { id: clipId });
    clip.append(svgEl("rect", { x: PX, y: PY, width: PW, height: PH, rx: 14 }));
    defs.append(clip);

    const pad = svgEl("rect", {
      x: PX,
      y: PY,
      width: PW,
      height: PH,
      rx: 14,
      fill: "var(--m-well)",
      stroke: "var(--m-border-strong)",
      "stroke-width": 1,
    });
    const reticle1 = svgEl("circle", {
      cx: 100,
      cy: 70,
      r: 17,
      fill: "none",
      stroke: "var(--m-border-strong)",
      "stroke-width": 0.9,
      opacity: 0.45,
    });
    const reticle2 = svgEl("circle", {
      cx: 100,
      cy: 70,
      r: 34,
      fill: "none",
      stroke: "var(--m-border-strong)",
      "stroke-width": 0.85,
      opacity: 0.25,
    });
    const centerMark = svgEl("circle", { cx: 100, cy: 70, r: 2.1, fill: "var(--m-mid)", opacity: 0.55 });
    const flashDot = svgEl("circle", { cx: 100, cy: 70, r: 5, fill: "var(--m-ink)", opacity: 0 });
    const ringsG = svgEl("g", { "clip-path": `url(#${clipId})` });
    ringsG.append(flashDot);
    svg.append(defs, pad, reticle1, reticle2, centerMark, ringsG);

    type Ring = {
      age: number;
      dur: number;
      maxR: number;
      el: SVGCircleElement;
    };

    const rings: Ring[] = [];
    const flash = new Spring(0, { omega: 24, zeta: 0.42 });
    let flashX = 100;
    let flashY = 70;

    const emit = (x: number, y: number, count: number, fromUser: boolean) => {
      const cx = clamp(x, PX + 4, PX + PW - 4);
      const cy = clamp(y, PY + 4, PY + PH - 4);
      flashX = cx;
      flashY = cy;
      flash.snap(1);
      flash.target = 0;

      for (let i = 0; i < count; i++) {
        const el = svgEl("circle", {
          cx: cx.toFixed(1),
          cy: cy.toFixed(1),
          r: 2,
          fill: "none",
          stroke: "var(--m-ink)",
          "stroke-width": 1.8,
          opacity: 0,
        });
        ringsG.append(el);
        rings.push({
          age: -i * 0.11,
          dur: 1.15 + i * 0.08,
          maxR: 60 + i * 11,
          el,
        });
      }
      while (rings.length > 28) {
        const old = rings.shift();
        old?.el.remove();
      }
      if (fromUser) ctx.sound("drop", count > 1 ? 0.72 : 0.48);
      ctx.wake();
    };

    let dragging = false;
    let lastEmitX = 0;
    let lastEmitY = 0;

    svg.addEventListener("pointerdown", (e) => {
      ctx.interact();
      svg.setPointerCapture(e.pointerId);
      const pt = stagePoint(svg, e);
      dragging = true;
      lastEmitX = pt.x;
      lastEmitY = pt.y;
      emit(pt.x, pt.y, 3, true);
    });

    svg.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const pt = stagePoint(svg, e);
      if (Math.hypot(pt.x - lastEmitX, pt.y - lastEmitY) > 18) {
        lastEmitX = pt.x;
        lastEmitY = pt.y;
        emit(pt.x, pt.y, 1, false);
      }
    });

    const endDrag = (e: PointerEvent) => {
      dragging = false;
      if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
    };
    svg.addEventListener("pointerup", endDrag);
    svg.addEventListener("pointercancel", endDrag);

    const demoPts: Array<[number, number]> = [
      [100, 70],
      [64, 54],
      [136, 84],
      [114, 50],
    ];
    let lastBeat = -1;

    return {
      el: svg,
      step(dt) {
        const flashActive = flash.step(dt);
        const fv = clamp(flash.x, 0, 1.2);
        flashDot.setAttribute("cx", flashX.toFixed(1));
        flashDot.setAttribute("cy", flashY.toFixed(1));
        flashDot.setAttribute("r", (2.5 + fv * 4.5).toFixed(2));
        flashDot.setAttribute("opacity", (fv * 0.75).toFixed(3));

        for (let i = rings.length - 1; i >= 0; i--) {
          const r = rings[i];
          r.age += dt;
          if (r.age < 0) continue;
          const u = r.age / r.dur;
          if (u >= 1) {
            r.el.remove();
            rings.splice(i, 1);
            continue;
          }
          // Quartic ease-out creates a dramatic nonlinear initial burst -> serene deceleration!
          const e = easeOutQuart(u);
          const radius = 3 + e * r.maxR;
          const op = (1 - u) * (1 - u) * 0.82;
          const sw = lerp(2.0, 0.55, u);
          r.el.setAttribute("r", radius.toFixed(2));
          r.el.setAttribute("opacity", op.toFixed(3));
          r.el.setAttribute("stroke-width", sw.toFixed(2));
        }
        return rings.length > 0 || flashActive;
      },
      demo(cycleTime) {
        const beat = Math.floor(cycleTime / 1.35);
        if (beat !== lastBeat) {
          lastBeat = beat;
          const [px, py] = demoPts[beat % demoPts.length];
          emit(px, py, 3, false);
        }
      },
      trigger() {
        ctx.interact();
        emit(100, 70, 3, true);
      },
    };
  },
};
