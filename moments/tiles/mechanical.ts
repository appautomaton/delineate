// Mechanical material tiles: crisp over-center hardware snaps, gravity-accelerated domino
// cascades, luminous machined dial rims, and underdamped ratchet counter drums.
// Tiles: 03 Detent Dial, 09 Domino Row, 12 Rocker Switch, 14 Odometer.

import {
  Spring,
  clamp,
  createStageSvg,
  lerp,
  stagePoint,
  svgEl,
  uniqueId,
} from "../physics.ts";
import type { TileSpec } from "../tile.ts";

// ── 03 · Detent Dial ───────────────────────────────────────────────────────────────────────────
// 12-detent machined rotary dial with luminous top-left bezel sheen, crisp underdamped notch
// snap overshoot, and sequential outward tick kicks across every crossed 30° detent.
export const detentDial: TileSpec = {
  slug: "detent-dial",
  name: "Detent Dial",
  material: "mechanical",
  hint: "Drag in a circle, scroll, or click",
  mount(ctx) {
    const svg = createStageSvg();
    const CX = 100;
    const CY = 70;
    const KNOB_R = 31;
    const TICKS = 12;

    const gradId = uniqueId("dial-grad");
    const rimId = uniqueId("dial-rim");
    const defs = svgEl("defs");
    const rad = svgEl("radialGradient", { id: gradId, cx: "32%", cy: "24%", r: "80%" });
    rad.append(
      svgEl("stop", { offset: "0%", "stop-color": "var(--m-dial-hi)", "stop-opacity": 1 }),
      svgEl("stop", { offset: "100%", "stop-color": "var(--m-dial-lo)", "stop-opacity": 1 }),
    );
    // Overhead rim light catch so the dial bezel reads as sculpted turned aluminum.
    const rimGrad = svgEl("linearGradient", { id: rimId, x1: "0%", y1: "0%", x2: "100%", y2: "100%" });
    rimGrad.append(
      svgEl("stop", { offset: "0%", "stop-color": "var(--m-ink)", "stop-opacity": 0.42 }),
      svgEl("stop", { offset: "48%", "stop-color": "var(--m-ink)", "stop-opacity": 0.10 }),
      svgEl("stop", { offset: "100%", "stop-color": "var(--m-ink)", "stop-opacity": 0.24 }),
    );
    defs.append(rad, rimGrad);

    const tickEls: SVGLineElement[] = [];
    const tickKick: Spring[] = [];
    const tickCos: number[] = [];
    const tickSin: number[] = [];
    const tickLastR1: number[] = [];
    const tickLastKind: number[] = [];
    const R0 = KNOB_R + 7;
    for (let i = 0; i < TICKS; i++) {
      const a = ((i * 30 - 90) * Math.PI) / 180;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      tickCos.push(ca);
      tickSin.push(sa);
      tickLastR1.push(-1);
      tickLastKind.push(-1);
      const line = svgEl("line", {
        x1: (CX + ca * R0).toFixed(2),
        y1: (CY + sa * R0).toFixed(2),
        stroke: "var(--m-mid)",
        "stroke-width": 1.85,
        "stroke-linecap": "round",
      });
      svg.append(line);
      tickEls.push(line);
      tickKick.push(new Spring(0, { omega: 34, zeta: 0.44 }));
    }

    const knobShadow = svgEl("circle", {
      cx: CX,
      cy: CY + 3,
      r: KNOB_R,
      fill: "var(--m-shadow)",
      opacity: 0.42,
    });
    const knob = svgEl("circle", {
      cx: CX,
      cy: CY,
      r: KNOB_R,
      fill: `url(#${gradId})`,
      stroke: `url(#${rimId})`,
      "stroke-width": 1.5,
    });
    const needle = svgEl("line", {
      stroke: "var(--m-ink)",
      "stroke-width": 2.4,
      "stroke-linecap": "round",
    });
    const readout = svgEl("text", {
      x: CX,
      y: CY + 0.5,
      "text-anchor": "middle",
      "dominant-baseline": "central",
      fill: "var(--m-ink)",
      "font-family": "var(--m-mono)",
      "font-size": 14.5,
      "font-weight": 600,
    });
    readout.textContent = "0";

    svg.append(defs, knobShadow, knob, needle, readout);

    let stepIdx = 0;
    let lastCrossed = 0;
    let userActive = false;
    // Lower zeta (0.52) gives an unmistakable crisp mechanical detent overshoot & lock!
    const angle = new Spring(0, { omega: 36, zeta: 0.52 });

    let dragging = false;
    let moved = false;
    let prevPointerAng = 0;
    let accumDeg = 0;

    const setStep = (next: number, fromUser: boolean) => {
      userActive = fromUser;
      if (next === stepIdx) return;
      stepIdx = next;
      angle.target = stepIdx * 30;
      ctx.wake();
    };

    svg.addEventListener("pointerdown", (e) => {
      ctx.interact();
      svg.setPointerCapture(e.pointerId);
      const pt = stagePoint(svg, e);
      userActive = true;
      dragging = true;
      moved = false;
      prevPointerAng = Math.atan2(pt.y - CY, pt.x - CX) * (180 / Math.PI);
      accumDeg = angle.x;
      ctx.wake();
    });

    svg.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const pt = stagePoint(svg, e);
      if (Math.hypot(pt.x - CX, pt.y - CY) < 8) return;
      const cur = Math.atan2(pt.y - CY, pt.x - CX) * (180 / Math.PI);
      let delta = cur - prevPointerAng;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      prevPointerAng = cur;
      if (Math.abs(delta) > 1.2) moved = true;
      accumDeg += delta;
      const nearest = Math.round(accumDeg / 30);
      const frac = accumDeg - nearest * 30;
      angle.target = nearest * 30 + frac * 0.36;
      if (nearest !== stepIdx) setStep(nearest, true);
      ctx.wake();
    });

    const release = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
      if (!moved) {
        setStep(stepIdx + 1, true);
      } else {
        angle.target = stepIdx * 30;
      }
      ctx.wake();
    };
    svg.addEventListener("pointerup", release);
    svg.addEventListener("pointercancel", release);

    svg.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        ctx.interact();
        setStep(stepIdx + (e.deltaY > 0 ? 1 : -1), true);
      },
      { passive: false },
    );

    let lastReadout = "0";

    const render = () => {
      const deg = angle.x;
      const crossed = Math.round(deg / 30);
      if (crossed !== lastCrossed) {
        const dir = crossed > lastCrossed ? 1 : -1;
        for (let s = lastCrossed + dir; dir > 0 ? s <= crossed : s >= crossed; s += dir) {
          const mod = ((s % TICKS) + TICKS) % TICKS;
          tickKick[mod].impulse(24);
        }
        lastCrossed = crossed;
        if (userActive) ctx.sound("tick", 0.9);
      }

      const radAng = ((deg - 90) * Math.PI) / 180;
      needle.setAttribute("x1", (CX + Math.cos(radAng) * 18.5).toFixed(2));
      needle.setAttribute("y1", (CY + Math.sin(radAng) * 18.5).toFixed(2));
      needle.setAttribute("x2", (CX + Math.cos(radAng) * 27).toFixed(2));
      needle.setAttribute("y2", (CY + Math.sin(radAng) * 27).toFixed(2));

      const activeMod = ((crossed % TICKS) + TICKS) % TICKS;
      const nextReadout = String(activeMod);
      if (nextReadout !== lastReadout) {
        lastReadout = nextReadout;
        readout.textContent = nextReadout;
      }

      for (let i = 0; i < TICKS; i++) {
        const lit = i <= activeMod && activeMod > 0 ? true : i === 0 && activeMod === 0;
        const isCurrent = i === activeMod;
        const kind = isCurrent ? 2 : lit ? 1 : 0;
        const kick = clamp(tickKick[i].x, 0, 7);
        const r1 = KNOB_R + (isCurrent ? 16.5 : lit ? 14 : 11.5) + kick;
        const qr1 = Math.round(r1 * 20);
        if (qr1 !== tickLastR1[i]) {
          tickLastR1[i] = qr1;
          tickEls[i].setAttribute("x2", (CX + tickCos[i] * r1).toFixed(2));
          tickEls[i].setAttribute("y2", (CY + tickSin[i] * r1).toFixed(2));
        }
        if (kind !== tickLastKind[i]) {
          tickLastKind[i] = kind;
          tickEls[i].setAttribute("stroke", kind > 0 ? "var(--m-ink)" : "var(--m-mid)");
          tickEls[i].setAttribute("opacity", kind === 2 ? "1" : kind === 1 ? "0.8" : "0.42");
        }
      }
    };

    const demoSeq = [0, 3, 7, 10, 9, 6, 2, 0];
    let lastDemo = -1;
    render();

    return {
      el: svg,
      step(dt) {
        let active = angle.step(dt, 0.05, 0.2);
        for (let i = 0; i < TICKS; i++) {
          if (tickKick[i].step(dt)) active = true;
        }
        render();
        return active || dragging;
      },
      demo(cycleTime) {
        const idx = Math.floor(cycleTime / 0.56);
        if (idx !== lastDemo) {
          lastDemo = idx;
          setStep(demoSeq[idx % demoSeq.length], false);
        }
      },
      trigger() {
        ctx.interact();
        setStep(stepIdx + 1, true);
      },
    };
  },
};

// ── 09 · Domino Row ────────────────────────────────────────────────────────────────────────────
// Seven tightly packed ivory slabs with true gravity-like nonlinear falling acceleration (torque
// proportional to sin θ) into crisp neighbor clack & bounce, then a brisk spring stand-up wave.
export const dominoRow: TileSpec = {
  slug: "domino-row",
  name: "Domino Row",
  material: "mechanical",
  hint: "Swipe left/right or click the slabs",
  mount(ctx) {
    const svg = createStageSvg();
    const COUNT = 7;
    const BASE_Y = 98;
    const W = 8.2;
    const H = 50;
    // Tight 12 px pitch stacks fallen tiles into a sculptural fanned deck like reference 11!
    const xs = Array.from({ length: COUNT }, (_, i) => 64 + i * 12);

    const floor = svgEl("line", {
      x1: 16,
      y1: BASE_Y + 1,
      x2: 184,
      y2: BASE_Y + 1,
      stroke: "var(--m-border-strong)",
      "stroke-width": 1,
    });
    svg.append(floor);

    const slabs = xs.map((x, i) => {
      const g = svgEl("g", { transform: `translate(${x} ${BASE_Y})` });
      const opacity = lerp(1, 0.64, i / (COUNT - 1));
      const rect = svgEl("rect", {
        x: -W / 2,
        y: -H,
        width: W,
        height: H,
        rx: 2.5,
        fill: "var(--m-ink)",
        opacity: opacity.toFixed(2),
        stroke: "var(--m-card)",
        "stroke-width": 0.9,
      });
      g.append(rect);
      svg.append(g);
      return g;
    });

    // Hybrid physics: nonlinear gravity topple when falling, crisp underdamped Spring when rising!
    const ang = Array.from({ length: COUNT }, () => 0);
    const vel = Array.from({ length: COUNT }, () => 0);
    const settledFall = Array.from({ length: COUNT }, () => false);
    const riseSprings = Array.from({ length: COUNT }, () => new Spring(0, { omega: 28, zeta: 0.46 }));
    const triggered = Array.from({ length: COUNT }, () => false);
    let fallen = false;
    let fallDir = 1;
    let cascadeFromUser = false;
    let standWave = -1;
    let standClock = 0;

    const restAngle = (i: number, dir: number) => {
      const isLast = (dir === 1 && i === COUNT - 1) || (dir === -1 && i === 0);
      return dir * (isLast ? 76 : 64);
    };

    const toppleOne = (i: number, dir: number, fromUser: boolean) => {
      if (i < 0 || i >= COUNT || triggered[i]) return;
      triggered[i] = true;
      settledFall[i] = false;
      // Gentle initial tap -> nonlinear gravity torque accelerates hard into neighbor strike!
      vel[i] = dir * 135;
      if (fromUser) ctx.sound("tick", 0.6 + (i / COUNT) * 0.4);
      ctx.wake();
    };

    const startCascade = (startIdx: number, dir: number, fromUser: boolean) => {
      fallen = true;
      fallDir = dir;
      cascadeFromUser = fromUser;
      standWave = -1;
      for (let i = 0; i < COUNT; i++) {
        triggered[i] = false;
        settledFall[i] = false;
      }
      toppleOne(startIdx, dir, fromUser);
    };

    const standUp = (fromUser: boolean) => {
      fallen = false;
      cascadeFromUser = fromUser;
      standWave = 0;
      standClock = 0;
      for (let i = 0; i < COUNT; i++) {
        triggered[i] = false;
        riseSprings[i].snap(ang[i]);
        riseSprings[i].target = ang[i];
      }
      if (fromUser) ctx.sound("click", 0.72);
      ctx.wake();
    };

    let dragging = false;
    let committed = false;
    let downX = 0;
    let downIdx = 0;

    svg.addEventListener("pointerdown", (e) => {
      ctx.interact();
      svg.setPointerCapture(e.pointerId);
      const pt = stagePoint(svg, e);
      dragging = true;
      committed = false;
      downX = pt.x;
      downIdx = clamp(Math.round((pt.x - xs[0]) / 12), 0, COUNT - 1);
      if (fallen) {
        committed = true;
        standUp(true);
      }
    });

    svg.addEventListener("pointermove", (e) => {
      if (!dragging || committed) return;
      const pt = stagePoint(svg, e);
      const dx = pt.x - downX;
      if (Math.abs(dx) > 6) {
        committed = true;
        startCascade(downIdx, dx > 0 ? 1 : -1, true);
      }
    });

    const endSwipe = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
      if (!committed && !fallen) {
        const dir = downIdx >= COUNT - 2 ? -1 : 1;
        startCascade(downIdx, dir, true);
      }
    };
    svg.addEventListener("pointerup", endSwipe);
    svg.addEventListener("pointercancel", endSwipe);

    const lastRenderedAng = Array.from({ length: COUNT }, () => NaN);
    const render = () => {
      for (let i = 0; i < COUNT; i++) {
        const q = Math.round(ang[i] * 20);
        if (q === lastRenderedAng[i]) continue;
        lastRenderedAng[i] = q;
        slabs[i].setAttribute("transform", `translate(${xs[i]} ${BASE_Y}) rotate(${(q / 20).toFixed(2)})`);
      }
    };

    let lastDemo = -1;
    render();

    return {
      el: svg,
      step(dt) {
        let active = false;
        if (fallen) {
          for (let i = 0; i < COUNT; i++) {
            if (!triggered[i] || settledFall[i]) continue;
            const target = restAngle(i, fallDir);
            // Nonlinear gravity acceleration: builds speed quadratically as tilt increases!
            const sinT = Math.sin((Math.abs(ang[i]) * Math.PI) / 180);
            vel[i] += fallDir * (420 + 1850 * sinT) * dt;
            ang[i] += vel[i] * dt;

            // Strike neighbor right at contact angle (~15°)!
            const next = i + fallDir;
            if (next >= 0 && next < COUNT && !triggered[next] && Math.abs(ang[i]) >= 14.5) {
              toppleOne(next, fallDir, cascadeFromUser);
            }

            // Hard stop with crisp miniature clack-rebound against resting stack!
            if (fallDir * ang[i] >= Math.abs(target)) {
              ang[i] = target;
              if (Math.abs(vel[i]) > 95) {
                vel[i] = -vel[i] * 0.24;
              } else {
                vel[i] = 0;
                settledFall[i] = true;
              }
            }
            if (!settledFall[i]) active = true;
          }
        } else {
          if (standWave >= 0) {
            standClock += dt;
            // Peel from the top-most leaning slab first so rising slabs never cross through neighbors!
            while (standWave < COUNT && standClock >= standWave * 0.045) {
              const idx = fallDir === 1 ? standWave : COUNT - 1 - standWave;
              riseSprings[idx].setParams({ omega: 28, zeta: 0.44 });
              riseSprings[idx].target = 0;
              standWave++;
            }
            if (standWave >= COUNT) standWave = -1;
            else active = true;
          }
          for (let i = 0; i < COUNT; i++) {
            if (riseSprings[i].step(dt, 0.08, 0.3)) active = true;
            ang[i] = riseSprings[i].x;
          }
        }
        render();
        return active;
      },
      demo(cycleTime) {
        const phase = Math.floor(cycleTime / 1.35);
        if (phase !== lastDemo) {
          lastDemo = phase;
          if (phase % 2 === 0) startCascade(0, 1, false);
          else standUp(false);
        }
      },
      trigger() {
        ctx.interact();
        if (fallen) standUp(true);
        else startCascade(0, 1, true);
      },
    };
  },
};

// ── 12 · Rocker Switch ─────────────────────────────────────────────────────────────────────────
// Sculptural rounded matte-molded Braun seesaw switch (I | O) with continuous overhead tonal
// bevel gradient across a recessed center crease and crisp over-center mechanical snap.
export const rockerSwitch: TileSpec = {
  slug: "rocker-switch",
  name: "Rocker Switch",
  material: "mechanical",
  hint: "Click either side or swipe across",
  mount(ctx) {
    const svg = createStageSvg();
    const BX = 34;
    const BY = 39;
    const BW = 132;
    const BH = 62;
    const PX = BX + 7;
    const PY = BY + 7;
    const PW = BW - 14; // 118
    const PH = BH - 14; // 48

    const clipId = uniqueId("rocker-clip");
    const defs = svgEl("defs");
    const clip = svgEl("clipPath", { id: clipId });
    clip.append(svgEl("rect", { x: PX, y: PY, width: PW, height: PH, rx: 10 }));
    defs.append(clip);

    const housingShadow = svgEl("rect", {
      x: BX,
      y: BY + 3,
      width: BW,
      height: BH,
      rx: 15,
      fill: "var(--m-shadow)",
      opacity: 0.42,
    });
    const housing = svgEl("rect", {
      x: BX,
      y: BY,
      width: BW,
      height: BH,
      rx: 15,
      fill: "var(--m-well-deep)",
      stroke: "var(--m-border-strong)",
      "stroke-width": 1.2,
    });

    // Rounded molded paddle clipped inside the beveled bezel (soft industrial form, zero sharp jags!).
    const paddleG = svgEl("g", { "clip-path": `url(#${clipId})` });
    const leftBase = svgEl("rect", { x: PX, y: PY, width: PW / 2, height: PH, fill: "var(--m-rocker-dim)" });
    const leftLit = svgEl("rect", { x: PX, y: PY, width: PW / 2, height: PH, fill: "var(--m-rocker-lit)", opacity: 1 });
    const rightBase = svgEl("rect", { x: PX + PW / 2, y: PY, width: PW / 2, height: PH, fill: "var(--m-rocker-dim)" });
    const rightLit = svgEl("rect", { x: PX + PW / 2, y: PY, width: PW / 2, height: PH, fill: "var(--m-rocker-lit)", opacity: 0 });

    // Soft recessed shadow band along the depressed outer wall + fulcrum crease.
    const ridgeShadow = svgEl("rect", { x: 100, y: PY, width: 6, height: PH, fill: "var(--m-shadow)", opacity: 0.28 });
    const depressedShade = svgEl("rect", { x: PX, y: PY, width: 10, height: PH, fill: "var(--m-shadow)", opacity: 0.16 });
    const proudCatch = svgEl("rect", { x: PX, y: PY, width: 3.5, height: PH, fill: "var(--m-sheen)", opacity: 0.85 });

    const symI = svgEl("line", {
      x1: 71,
      y1: 63,
      x2: 71,
      y2: 77,
      stroke: "var(--m-rocker-ink-lit)",
      "stroke-width": 2.3,
      "stroke-linecap": "round",
    });
    const symO = svgEl("circle", {
      cx: 129,
      cy: 70,
      r: 6.3,
      fill: "none",
      stroke: "var(--m-rocker-ink-dim)",
      "stroke-width": 2.1,
    });

    paddleG.append(leftBase, leftLit, rightBase, rightLit, ridgeShadow, depressedShade, proudCatch, symI, symO);

    const paddleRim = svgEl("rect", {
      x: PX,
      y: PY,
      width: PW,
      height: PH,
      rx: 10,
      fill: "none",
      stroke: "var(--m-border-strong)",
      "stroke-width": 1.1,
    });

    svg.append(defs, housingShadow, housing, paddleG, paddleRim);

    let state = 1; // +1 = left raised, -1 = right raised
    // Underdamped crisp over-center snap gives unmistakable hardware toggle clack!
    const tilt = new Spring(1, { omega: 42, zeta: 0.50 });

    const flip = (next: number, fromUser: boolean) => {
      if (next === state) return;
      state = next;
      tilt.target = state;
      // Subtle mechanical snap kick across dead-center!
      tilt.impulse(state * 6.5);
      if (fromUser) ctx.sound("click", 0.95);
      ctx.wake();
    };

    let downX = 0;
    let dragging = false;
    let swiped = false;
    svg.addEventListener("pointerdown", (e) => {
      ctx.interact();
      svg.setPointerCapture(e.pointerId);
      const pt = stagePoint(svg, e);
      dragging = true;
      swiped = false;
      downX = pt.x;
    });
    svg.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const pt = stagePoint(svg, e);
      if (Math.abs(pt.x - downX) > 14) {
        swiped = true;
        flip(pt.x > downX ? -1 : 1, true);
      }
    });
    const release = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
      if (!swiped) {
        const pt = stagePoint(svg, e);
        if (Math.abs(pt.x - 100) < 12) flip(-state, true);
        else flip(pt.x < 100 ? -1 : 1, true);
      }
    };
    svg.addEventListener("pointerup", release);
    svg.addEventListener("pointercancel", release);

    const render = () => {
      const t = clamp(tilt.x, -1.25, 1.25);
      const u = clamp((t + 1) / 2, 0, 1);
      const splitX = 100 - t * 6.5;
      const leftW = Math.max(4, splitX - PX);
      const rightW = Math.max(4, PX + PW - splitX);

      leftBase.setAttribute("width", leftW.toFixed(2));
      leftLit.setAttribute("width", leftW.toFixed(2));
      leftLit.setAttribute("opacity", u.toFixed(3));

      rightBase.setAttribute("x", splitX.toFixed(2));
      rightBase.setAttribute("width", rightW.toFixed(2));
      rightLit.setAttribute("x", splitX.toFixed(2));
      rightLit.setAttribute("width", rightW.toFixed(2));
      rightLit.setAttribute("opacity", (1 - u).toFixed(3));

      const shW = 6 * Math.abs(t);
      ridgeShadow.setAttribute("x", (t >= 0 ? splitX : splitX - shW).toFixed(2));
      ridgeShadow.setAttribute("width", shW.toFixed(2));
      ridgeShadow.setAttribute("opacity", (Math.min(1, Math.abs(t)) * 0.28).toFixed(3));

      // Subtle inner housing shadow on the depressed outer lip & light catch on the proud outer lip.
      depressedShade.setAttribute("x", (t >= 0 ? PX + PW - 9 : PX).toFixed(2));
      depressedShade.setAttribute("opacity", (Math.min(1, Math.abs(t)) * 0.22).toFixed(3));
      proudCatch.setAttribute("x", (t >= 0 ? PX : PX + PW - 3.5).toFixed(2));
      proudCatch.setAttribute("opacity", (Math.min(1, Math.abs(t)) * 0.8).toFixed(3));

      const ix = 71 - t * 3.0;
      const ox = 129 - t * 3.0;
      symI.setAttribute("x1", ix.toFixed(2));
      symI.setAttribute("x2", ix.toFixed(2));
      symI.setAttribute("stroke", u > 0.5 ? "var(--m-rocker-ink-lit)" : "var(--m-rocker-ink-dim)");

      symO.setAttribute("cx", ox.toFixed(2));
      symO.setAttribute("stroke", u <= 0.5 ? "var(--m-rocker-ink-lit)" : "var(--m-rocker-ink-dim)");
    };

    let lastDemo = -1;
    render();

    return {
      el: svg,
      step(dt) {
        const a = tilt.step(dt);
        render();
        return a;
      },
      demo(cycleTime) {
        const beat = Math.floor(cycleTime / 1.15);
        if (beat !== lastDemo) {
          lastDemo = beat;
          flip(beat % 2 === 0 ? -1 : 1, false);
        }
      },
      trigger() {
        ctx.interact();
        flip(-state, true);
      },
    };
  },
};

// ── 14 · Odometer ──────────────────────────────────────────────────────────────────────────────
// Sculpted mechanical stepper (− 42 +) with soft drop shadow, chunky tabular numerals, carry-over
// staggered reels, and crisp underdamped ratchet overshoot on every digit step.
export const odometer: TileSpec = {
  slug: "odometer",
  name: "Odometer",
  material: "mechanical",
  hint: "Click − / +, or drag digits vertically",
  mount(ctx) {
    const svg = createStageSvg();
    const W = 152;
    const H = 48;
    const X = (200 - W) / 2;
    const Y = (140 - H) / 2;
    const ROW_H = 27;

    const clipId = uniqueId("odo-clip");
    const fadeId = uniqueId("odo-fade");
    const defs = svgEl("defs");
    const clip = svgEl("clipPath", { id: clipId });
    clip.append(svgEl("rect", { x: 74, y: Y + 6, width: 52, height: H - 12, rx: 4 }));
    const fade = svgEl("linearGradient", { id: fadeId, x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
    fade.append(
      svgEl("stop", { offset: "0%", "stop-color": "var(--m-well)", "stop-opacity": 0.94 }),
      svgEl("stop", { offset: "24%", "stop-color": "var(--m-well)", "stop-opacity": 0 }),
      svgEl("stop", { offset: "76%", "stop-color": "var(--m-well)", "stop-opacity": 0 }),
      svgEl("stop", { offset: "100%", "stop-color": "var(--m-well)", "stop-opacity": 0.94 }),
    );
    defs.append(clip, fade);

    const pillShadow = svgEl("rect", {
      x: X,
      y: Y + 3,
      width: W,
      height: H,
      rx: H / 2,
      fill: "var(--m-shadow)",
      opacity: 0.42,
    });
    const pill = svgEl("rect", {
      x: X,
      y: Y,
      width: W,
      height: H,
      rx: H / 2,
      fill: "var(--m-well)",
      stroke: "var(--m-border-strong)",
      "stroke-width": 1,
    });

    const minusBtn = svgEl("g", { transform: `translate(${X + 24} ${Y + H / 2})` });
    const minusBg = svgEl("circle", { r: 15, fill: "var(--m-mid)", opacity: 0.34 });
    const minusSym = svgEl("line", { x1: -5, y1: 0, x2: 5, y2: 0, stroke: "var(--m-ink)", "stroke-width": 1.9, "stroke-linecap": "round" });
    minusBtn.append(minusBg, minusSym);

    const plusBtn = svgEl("g", { transform: `translate(${X + W - 24} ${Y + H / 2})` });
    const plusBg = svgEl("circle", { r: 15, fill: "var(--m-mid)", opacity: 0.34 });
    const plusSym = svgEl("path", { d: "M-5 0 H5 M0 -5 V5", stroke: "var(--m-ink)", "stroke-width": 1.9, "stroke-linecap": "round" });
    plusBtn.append(plusBg, plusSym);

    const drumWindow = svgEl("g", { "clip-path": `url(#${clipId})` });
    const makeReel = (cx: number) => {
      const g = svgEl("g");
      const texts = [-1, 0, 1].map(() => {
        const t = svgEl("text", {
          x: cx,
          y: 0,
          "text-anchor": "middle",
          "dominant-baseline": "central",
          fill: "var(--m-ink)",
          "font-family": "var(--m-mono)",
          "font-size": 20.5,
          "font-weight": 600,
        });
        g.append(t);
        return t;
      });
      drumWindow.append(g);
      return texts;
    };

    const tensTexts = makeReel(93);
    const onesTexts = makeReel(107.5);
    const vignette = svgEl("rect", { x: 74, y: Y + 5, width: 52, height: H - 10, fill: `url(#${fadeId})`, "pointer-events": "none" });

    svg.append(defs, pillShadow, pill, minusBtn, plusBtn, drumWindow, vignette);

    let count = 42;
    // Snappy underdamped ratchet reels (zeta 0.50) visibly overshoot past the baseline and lock!
    const ones = new Spring(42, { omega: 28, zeta: 0.50 });
    const tens = new Spring(4, { omega: 24, zeta: 0.52 });
    const minusScale = new Spring(1, { omega: 34, zeta: 0.44 });
    const plusScale = new Spring(1, { omega: 34, zeta: 0.44 });
    let pendingTensDelay = 0;
    let pendingTensTarget = 4;

    const setCount = (next: number, fromUser: boolean) => {
      if (next === count) return;
      const oldTens = Math.floor(count / 10);
      const newTens = Math.floor(next / 10);
      const dir = next > count ? 1 : -1;
      count = next;
      ones.target = count;
      if (newTens !== oldTens) {
        pendingTensTarget = newTens;
        pendingTensDelay = 0.06;
      }
      if (dir > 0) {
        plusScale.snap(0.78);
        plusScale.target = 1;
      } else {
        minusScale.snap(0.78);
        minusScale.target = 1;
      }
      if (fromUser) ctx.sound("tick", 0.9);
      ctx.wake();
    };

    let dragging = false;
    let moved = false;
    let downY = 0;
    let startVal = 42;

    svg.addEventListener("pointerdown", (e) => {
      ctx.interact();
      svg.setPointerCapture(e.pointerId);
      const pt = stagePoint(svg, e);
      if (pt.x < 74) {
        setCount(count - 1, true);
        return;
      }
      if (pt.x > 126) {
        setCount(count + 1, true);
        return;
      }
      dragging = true;
      moved = false;
      downY = pt.y;
      startVal = count;
    });

    svg.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const pt = stagePoint(svg, e);
      if (Math.abs(pt.y - downY) > 5) moved = true;
      const next = Math.round(startVal + (downY - pt.y) / 9);
      if (next !== count) setCount(next, true);
    });

    const release = (e: PointerEvent) => {
      if (dragging && !moved) setCount(count + 1, true);
      dragging = false;
      if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
    };
    svg.addEventListener("pointerup", release);
    svg.addEventListener("pointercancel", release);

    const drawReel = (texts: SVGTextElement[], pos: number) => {
      const base = Math.floor(pos);
      const frac = pos - base;
      for (let k = -1; k <= 1; k++) {
        const digit = String((((base + k) % 10) + 10) % 10);
        const y = 70 + (k - frac) * ROW_H;
        const el = texts[k + 1];
        if (el.textContent !== digit) el.textContent = digit;
        el.setAttribute("y", y.toFixed(1));
        const dist = Math.abs(y - 70) / ROW_H;
        el.setAttribute("opacity", clamp(1 - dist * 0.72, 0.08, 1).toFixed(2));
      }
    };

    const render = () => {
      drawReel(onesTexts, ones.x);
      drawReel(tensTexts, tens.x);
      minusBtn.setAttribute("transform", `translate(${X + 24} ${Y + H / 2}) scale(${minusScale.x.toFixed(3)})`);
      plusBtn.setAttribute("transform", `translate(${X + W - 24} ${Y + H / 2}) scale(${plusScale.x.toFixed(3)})`);
    };

    const demoVals = [30, 42, 53, 42, 30, 19, 8, 19];
    let lastDemo = -1;
    render();

    return {
      el: svg,
      step(dt) {
        let active = false;
        if (pendingTensDelay > 0) {
          pendingTensDelay -= dt;
          active = true;
          if (pendingTensDelay <= 0) tens.target = pendingTensTarget;
        }
        const a = ones.step(dt, 0.002, 0.01);
        const b = tens.step(dt, 0.002, 0.01);
        const c = minusScale.step(dt);
        const d = plusScale.step(dt);
        render();
        return active || a || b || c || d;
      },
      demo(cycleTime) {
        const idx = Math.floor(cycleTime / 1.1);
        if (idx !== lastDemo) {
          lastDemo = idx;
          setCount(demoVals[idx % demoVals.length], false);
        }
      },
      trigger() {
        ctx.interact();
        setCount(count + 1, true);
      },
    };
  },
};
