// Viscous material tiles: SVG metaball cohesion with nonlinear sticky pull-and-snap kinematics
// (never constant-speed linear orbits!) and pixel-exact SVG <mask> polarity inversion.
// Tiles: 02 Gooey Tab Bar, 07 Merge Drops.

import {
  Spring,
  VelocityTracker,
  clamp,
  createGooFilter,
  createStageSvg,
  lerp,
  stagePoint,
  svgEl,
  uniqueId,
} from "../physics.ts";
import type { TileSpec } from "../tile.ts";

// ── 02 · Gooey Tab Bar ─────────────────────────────────────────────────────────────────────────
// Four-icon dock whose active pill whips across as a plump 5-circle liquid metaball with
// underdamped overshoot and staggered trailing tail, inverting icons pixel-for-pixel via <mask>.
export const gooeyTabBar: TileSpec = {
  slug: "gooey-tab-bar",
  name: "Gooey Tab Bar",
  material: "viscous",
  hint: "Click or scrub across tabs",
  mount(ctx) {
    const svg = createStageSvg();
    const xs = [46, 82, 118, 154];
    const Y = 70;
    const R = 16.5;

    const gooId = uniqueId("goo-tab");
    const maskId = uniqueId("tab-mask");
    const defs = svgEl("defs");
    defs.append(createGooFilter(gooId, 6.4, 22, -9));

    const makeChain = (fill: string) => {
      const g = svgEl("g", { filter: `url(#${gooId})` });
      const circles = Array.from({ length: 5 }, () => svgEl("circle", { cx: xs[0], cy: Y, r: R, fill }));
      g.append(...circles);
      return { g, circles };
    };

    const mask = svgEl("mask", { id: maskId, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 200, height: 140 });
    mask.append(svgEl("rect", { x: 0, y: 0, width: 200, height: 140, fill: "#000000" }));
    const maskChain = makeChain("#ffffff");
    mask.append(maskChain.g);
    defs.append(mask);

    const dockShadow = svgEl("rect", {
      x: 20,
      y: Y - 21,
      width: 160,
      height: 48,
      rx: 24,
      fill: "var(--m-shadow)",
      opacity: 0.42,
    });
    const dock = svgEl("rect", {
      x: 20,
      y: Y - 24,
      width: 160,
      height: 48,
      rx: 24,
      fill: "var(--m-well)",
      stroke: "var(--m-border-strong)",
      "stroke-width": 1,
    });

    const iconPaths = [
      "M-6.5 1 L0 -5.5 L6.5 1 M-4.5 -0.5 V5.8 H4.5 V-0.5",
      "M-1.5 -5 A4.2 4.2 0 1 0 -1.5 3.4 A4.2 4.2 0 1 0 -1.5 -5 M2.2 2.2 L6 6",
      "M0 5.6 C-3.2 3 -6.5 0.6 -6.5 -2.2 A3.3 3.3 0 0 1 0 -4.1 A3.3 3.3 0 0 1 6.5 -2.2 C6.5 0.6 3.2 3 0 5.6 Z",
      "M0 -5.5 A2.9 2.9 0 1 0 0 0.3 A2.9 2.9 0 1 0 0 -5.5 M-5.5 6 C-5.5 2.7 -3 1.5 0 1.5 C3 1.5 5.5 2.7 5.5 6",
    ];

    const makeIconLayer = (stroke: string) => {
      const g = svgEl("g", {
        fill: "none",
        stroke,
        "stroke-width": 1.65,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
      xs.forEach((x, i) => {
        const item = svgEl("g", { transform: `translate(${x} ${Y})` });
        item.append(svgEl("path", { d: iconPaths[i] }));
        g.append(item);
      });
      return g;
    };

    const baseIcons = makeIconLayer("var(--m-soft)");
    const visChain = makeChain("var(--m-ink)");
    const activeIcons = makeIconLayer("var(--m-paper)");
    activeIcons.setAttribute("mask", `url(#${maskId})`);

    svg.append(defs, dockShadow, dock, baseIcons, visChain.g, activeIcons);

    let index = 0;
    const head = new Spring(xs[0], { omega: 24, zeta: 0.54 });
    const tail = new Spring(xs[0], { omega: 13.5, zeta: 0.52 });
    let tailDelay = 0;
    let pendingTail = xs[0];

    const select = (next: number, fromUser: boolean) => {
      const i = clamp(next, 0, xs.length - 1);
      if (i === index && Math.abs(head.x - xs[i]) < 0.5) return;
      const dir = i > index ? 1 : -1;
      index = i;
      head.target = xs[i];
      // Crisp viscous impulse + delayed tail while keeping overshoot neatly inside the capsule rim!
      head.impulse(dir * 32);
      pendingTail = xs[i];
      tailDelay = 0.065;
      if (fromUser) ctx.sound("drop", 0.8);
      ctx.wake();
    };

    const nearest = (px: number) => {
      let best = 0;
      let dBest = Infinity;
      for (let i = 0; i < xs.length; i++) {
        const d = Math.abs(px - xs[i]);
        if (d < dBest) {
          dBest = d;
          best = i;
        }
      }
      return best;
    };

    let scrubbing = false;
    svg.addEventListener("pointerdown", (e) => {
      ctx.interact();
      svg.setPointerCapture(e.pointerId);
      scrubbing = true;
      select(nearest(stagePoint(svg, e).x), true);
    });
    svg.addEventListener("pointermove", (e) => {
      if (!scrubbing) return;
      const i = nearest(stagePoint(svg, e).x);
      if (i !== index) select(i, true);
    });
    const endScrub = (e: PointerEvent) => {
      if (!scrubbing) return;
      scrubbing = false;
      if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
    };
    svg.addEventListener("pointerup", endScrub);
    svg.addEventListener("pointercancel", endScrub);

    let lastHx = -1;
    let lastTx = -1;
    let filterOn = true;

    const render = () => {
      // Softly bound metaball inside the recessed capsule walls (dock x = 20..180, R = 16.5).
      const hx = clamp(head.x, 40.5, 159.5);
      const tx = clamp(tail.x, 40.5, 159.5);
      if (Math.abs(hx - lastHx) < 0.04 && Math.abs(tx - lastTx) < 0.04) return;
      lastHx = hx;
      lastTx = tx;

      const gap = Math.abs(hx - tx);
      // Bypass expensive Gaussian blur filter passes whenever the liquid pill sits at rest!
      const needFilter = gap > 0.25;
      if (needFilter !== filterOn) {
        filterOn = needFilter;
        if (filterOn) {
          visChain.g.setAttribute("filter", `url(#${gooId})`);
          maskChain.g.setAttribute("filter", `url(#${gooId})`);
        } else {
          visChain.g.removeAttribute("filter");
          maskChain.g.removeAttribute("filter");
        }
      }

      const waist = clamp(R - gap * 0.064, 9.6, R);
      const radii = [R - 1.2, lerp(R - 1.2, waist, 0.72), waist, lerp(R, waist, 0.68), R];
      const fracs = [0, 0.25, 0.5, 0.75, 1];

      for (let i = 0; i < 5; i++) {
        const cx = lerp(tx, hx, fracs[i]).toFixed(2);
        const r = radii[i].toFixed(2);
        visChain.circles[i].setAttribute("cx", cx);
        visChain.circles[i].setAttribute("r", r);
        maskChain.circles[i].setAttribute("cx", cx);
        maskChain.circles[i].setAttribute("r", r);
      }
    };

    const order = [0, 3, 1, 2];
    let lastBeat = -1;
    render();

    return {
      el: svg,
      step(dt) {
        let pending = false;
        if (tailDelay > 0) {
          tailDelay -= dt;
          pending = true;
          if (tailDelay <= 0) tail.target = pendingTail;
        }
        const a = head.step(dt);
        const b = tail.step(dt);
        render();
        return pending || a || b;
      },
      demo(cycleTime) {
        const beat = Math.floor(cycleTime / 1.15);
        if (beat !== lastBeat) {
          lastBeat = beat;
          select(order[beat % order.length], false);
        }
      },
      trigger() {
        ctx.interact();
        select((index + 1) % xs.length, true);
      },
    };
  },
};

// ── 07 · Merge Drops ───────────────────────────────────────────────────────────────────────────
// Core and satellite liquid droplets with nonlinear sticky tension -> sudden pinch-off snap ->
// elastic recoil -> magnetic coalescence (never a flat constant-speed circle orbit!).
export const mergeDrops: TileSpec = {
  slug: "merge-drops",
  name: "Merge Drops",
  material: "viscous",
  hint: "Drag the droplet apart, or click to split",
  mount(ctx) {
    const svg = createStageSvg();
    const CX = 100;
    const CY = 70;
    const CORE_R = 23.5;
    const SAT_R = 14.5;

    const gooId = uniqueId("goo-drop");
    const defs = svgEl("defs");
    defs.append(createGooFilter(gooId, 7.6, 24, -10));

    const gooG = svgEl("g", { filter: `url(#${gooId})` });
    const core = svgEl("circle", { cx: CX, cy: CY, r: CORE_R, fill: "var(--m-ink)" });
    const sat = svgEl("circle", { cx: CX + 34, cy: CY + 14, r: SAT_R, fill: "var(--m-ink)" });
    gooG.append(core, sat);
    svg.append(defs, gooG);

    const coreX = new Spring(CX, { omega: 16, zeta: 0.32 });
    const coreY = new Spring(CY, { omega: 16, zeta: 0.32 });
    const coreR = new Spring(CORE_R, { omega: 22, zeta: 0.28 });
    const satX = new Spring(CX + 28, { omega: 14, zeta: 0.36 });
    const satY = new Spring(CY + 14, { omega: 14, zeta: 0.36 });

    let split = true;
    let merged = false;
    let userActive = false;
    let dragging = false;
    let moved = false;
    let downX = 0;
    let downY = 0;
    let orbitAngle = 0.42;
    const vel = new VelocityTracker();

    const toggleSplit = (fromUser: boolean) => {
      userActive = fromUser;
      split = !split;
      if (split) {
        orbitAngle += 1.65;
        const dx = Math.cos(orbitAngle);
        const dy = Math.sin(orbitAngle);
        satX.setParams({ omega: 16, zeta: 0.36 });
        satY.setParams({ omega: 16, zeta: 0.36 });
        satX.target = CX + dx * 48;
        satY.target = CY + dy * 36;
        satX.impulse(dx * 110);
        satY.impulse(dy * 90);
        coreX.impulse(-dx * 85);
        coreY.impulse(-dy * 70);
      } else {
        satX.setParams({ omega: 18, zeta: 0.34 });
        satY.setParams({ omega: 18, zeta: 0.34 });
        satX.target = CX;
        satY.target = CY;
      }
      if (fromUser) ctx.sound("drop", split ? 0.78 : 0.95);
      ctx.wake();
    };

    svg.addEventListener("pointerdown", (e) => {
      ctx.interact();
      svg.setPointerCapture(e.pointerId);
      const pt = stagePoint(svg, e);
      userActive = true;
      dragging = true;
      moved = false;
      downX = pt.x;
      downY = pt.y;
      satX.setParams({ omega: 28, zeta: 0.65 });
      satY.setParams({ omega: 28, zeta: 0.65 });
      vel.reset(pt.x, pt.y);
      ctx.wake();
    });

    svg.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const pt = stagePoint(svg, e);
      vel.push(pt.x, pt.y);
      if (Math.hypot(pt.x - downX, pt.y - downY) > 4) moved = true;
      const tx = clamp(pt.x, 30, 170);
      const ty = clamp(pt.y, 24, 116);
      satX.target = tx;
      satY.target = ty;
      const dx = tx - CX;
      const dy = ty - CY;
      const d = Math.hypot(dx, dy);
      if (d < 52 && d > 1) {
        const pull = (1 - Math.abs(d - 28) / 28) * 11;
        coreX.target = CX + (dx / d) * Math.max(0, pull);
        coreY.target = CY + (dy / d) * Math.max(0, pull);
      } else {
        coreX.target = CX;
        coreY.target = CY;
      }
      ctx.wake();
    });

    const release = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      coreX.target = CX;
      coreY.target = CY;
      if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
      if (!moved) {
        toggleSplit(true);
        return;
      }
      const { vx, vy } = vel.velocity();
      const d = Math.hypot(satX.x - CX, satY.x - CY);
      satX.setParams({ omega: 15, zeta: 0.36 });
      satY.setParams({ omega: 15, zeta: 0.36 });
      if (d < 34) {
        split = false;
        satX.target = CX;
        satY.target = CY;
      } else {
        split = true;
        const ang = Math.atan2(satY.x - CY + vy * 0.08, satX.x - CX + vx * 0.08);
        orbitAngle = ang;
        satX.target = CX + Math.cos(ang) * 46;
        satY.target = CY + Math.sin(ang) * 35;
        satX.impulse(vx * 0.3);
        satY.impulse(vy * 0.3);
      }
      ctx.wake();
    };

    svg.addEventListener("pointerup", release);
    svg.addEventListener("pointercancel", release);

    const render = () => {
      const d = Math.hypot(satX.x - coreX.x, satY.x - coreY.x);
      const nowMerged = d < 27;
      if (nowMerged !== merged) {
        merged = nowMerged;
        coreR.target = merged ? CORE_R + 4.8 : CORE_R;
        coreR.impulse(merged ? 44 : -48);
        if (userActive) ctx.sound("drop", merged ? 0.92 : 0.72);
      }
      core.setAttribute("cx", coreX.x.toFixed(2));
      core.setAttribute("cy", coreY.x.toFixed(2));
      core.setAttribute("r", clamp(coreR.x, 16, 32).toFixed(2));
      sat.setAttribute("cx", satX.x.toFixed(2));
      sat.setAttribute("cy", satY.x.toFixed(2));
    };

    // Staged nonlinear pull -> pinch-off snap -> linger -> magnetic re-coalesce cycle!
    const demoDirs = [0.45, 2.25, -1.15, 3.65];
    let lastDemoPhase = -1;
    render();

    return {
      el: svg,
      step(dt) {
        const a = coreX.step(dt);
        const b = coreY.step(dt);
        const c = coreR.step(dt);
        const d = satX.step(dt);
        const e = satY.step(dt);
        render();
        return a || b || c || d || e || dragging;
      },
      demo(cycleTime) {
        userActive = false;
        const period = 2.1;
        const cycle = Math.floor(cycleTime / period);
        const t = cycleTime % period;
        const ang = demoDirs[cycle % demoDirs.length];
        const dx = Math.cos(ang);
        const dy = Math.sin(ang);
        // 0: slow tense neck stretch -> 1: snap free with recoil -> 2: snap back into coalescence
        const stage = t < 0.45 ? 0 : t < 1.15 ? 1 : 2;
        const key = cycle * 3 + stage;
        if (key !== lastDemoPhase) {
          lastDemoPhase = key;
          ctx.wake();
          if (stage === 0) {
            // Sticky pull: satellite strains outward while tugging core along with it!
            satX.setParams({ omega: 8, zeta: 0.72 });
            satY.setParams({ omega: 8, zeta: 0.72 });
            satX.target = CX + dx * 31;
            satY.target = CY + dy * 24;
            coreX.target = CX + dx * 7;
            coreY.target = CY + dy * 5;
          } else if (stage === 1) {
            // Sudden pinch-off snap & mutual elastic recoil!
            satX.setParams({ omega: 18, zeta: 0.34 });
            satY.setParams({ omega: 18, zeta: 0.34 });
            satX.target = CX + dx * 49;
            satY.target = CY + dy * 37;
            satX.impulse(dx * 115);
            satY.impulse(dy * 90);
            coreX.target = CX;
            coreY.target = CY;
            coreX.impulse(-dx * 110);
            coreY.impulse(-dy * 85);
          } else {
            // Magnetic acceleration back into juicy coalescence!
            satX.setParams({ omega: 16, zeta: 0.36 });
            satY.setParams({ omega: 16, zeta: 0.36 });
            satX.target = CX + dx * 8;
            satY.target = CY + dy * 6;
            coreX.target = CX;
            coreY.target = CY;
          }
        }
      },
      trigger() {
        ctx.interact();
        toggleSplit(true);
      },
    };
  },
};
