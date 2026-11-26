// Rubber material tiles: exaggerated @yui540 nonlinear elastic motion — anticipation wind-up,
// dramatic area-preserving squash & stretch, snappy overshoot, and sculptural tactile shading.
// Tiles: 01 Stretch Toggle, 05 Jelly Pad, 06 Swipe Confirm, 13 Squash Play, 17 Worm Dots.
import { Spring, VelocityTracker, clamp, createStageSvg, easeInOutQuint, lerp, smoothstep, squash, stagePoint, svgEl, uniqueId, } from "../physics.js";
// ── 01 · Stretch Toggle ────────────────────────────────────────────────────────────────────────
// Pill switch with genuine anticipation squeeze, dramatic full-pill horizontal elongation
// (head races ahead while tail delays), mid-grey luminance bridge, and elastic snap-settle.
export const stretchToggle = {
    slug: "stretch-toggle",
    name: "Stretch Toggle",
    material: "rubber",
    hint: "Click or drag across the pill",
    mount(ctx) {
        const svg = createStageSvg();
        const W = 128;
        const H = 56;
        const X = (200 - W) / 2; // 36
        const Y = (140 - H) / 2; // 42
        const PAD = 6.5;
        const R = (H - PAD * 2) / 2; // 21.5
        const MIN_X = X + PAD + R; // 64
        const MAX_X = X + W - PAD - R; // 136
        const trackOff = svgEl("rect", {
            x: X,
            y: Y,
            width: W,
            height: H,
            rx: H / 2,
            fill: "var(--m-well)",
            stroke: "var(--m-border-strong)",
            "stroke-width": 1,
        });
        const trackOn = svgEl("rect", {
            x: X,
            y: Y,
            width: W,
            height: H,
            rx: H / 2,
            fill: "var(--m-ink)",
            opacity: 0,
        });
        const thumbLight = svgEl("rect", {
            x: MIN_X - R,
            y: Y + PAD,
            width: R * 2,
            height: R * 2,
            rx: R,
            fill: "var(--m-ink)",
        });
        const thumbDark = svgEl("rect", {
            x: MIN_X - R,
            y: Y + PAD,
            width: R * 2,
            height: R * 2,
            rx: R,
            fill: "var(--m-paper)",
            opacity: 0,
        });
        svg.append(trackOff, trackOn, thumbLight, thumbDark);
        let on = false;
        const leftEdge = new Spring(0, { omega: 20, zeta: 0.46 });
        const rightEdge = new Spring(0, { omega: 20, zeta: 0.46 });
        const pressSpring = new Spring(0, { omega: 28, zeta: 0.45 });
        let tailDelay = 0;
        let pendingTailTarget = 0;
        let dragging = false;
        let moved = false;
        let downX = 0;
        let startVal = 0;
        const vel = new VelocityTracker();
        const setState = (next, fromUser) => {
            on = next;
            const target = on ? 1 : 0;
            // Nonlinear 2-phase whip: leading edge shoots across with overshoot while trailing edge
            // holds for 75 ms so the thumb stretches across ~75% of the pill before snapping shut!
            if (on) {
                rightEdge.setParams({ omega: 26, zeta: 0.46 });
                leftEdge.setParams({ omega: 15, zeta: 0.44 });
                rightEdge.target = target;
                rightEdge.impulse(2.6);
                pendingTailTarget = target;
                tailDelay = 0.085;
            }
            else {
                leftEdge.setParams({ omega: 26, zeta: 0.46 });
                rightEdge.setParams({ omega: 15, zeta: 0.44 });
                leftEdge.target = target;
                leftEdge.impulse(-2.6);
                pendingTailTarget = target;
                tailDelay = 0.085;
            }
            if (fromUser)
                ctx.sound("thump", 0.78);
            ctx.wake();
        };
        const render = () => {
            const a = clamp(Math.min(leftEdge.x, rightEdge.x), -0.08, 1.08);
            const b = clamp(Math.max(leftEdge.x, rightEdge.x), -0.08, 1.08);
            const cx0 = lerp(MIN_X, MAX_X, a);
            const cx1 = lerp(MIN_X, MAX_X, b);
            const stretchPx = Math.max(0, cx1 - cx0) + pressSpring.x * 10;
            const strain = clamp(stretchPx / (R * 3.8), 0, 0.28);
            const { sy } = squash(strain);
            const h = R * 2 * sy;
            const w = R * 2 + stretchPx;
            const mid = (cx0 + cx1) / 2;
            const rx = Math.min(h / 2, w / 2);
            const x = clamp(mid - w / 2, X + PAD - 1.5, X + W - PAD - w + 1.5);
            const y = 70 - h / 2;
            const norm = clamp((mid - MIN_X) / (MAX_X - MIN_X), 0, 1);
            // Wide tonal crossover so the stretched mid-flight pill reads through soft mid-grey!
            const inv = smoothstep(0.12, 0.88, norm);
            trackOn.setAttribute("opacity", inv.toFixed(3));
            for (const el of [thumbLight, thumbDark]) {
                el.setAttribute("x", x.toFixed(2));
                el.setAttribute("y", y.toFixed(2));
                el.setAttribute("width", w.toFixed(2));
                el.setAttribute("height", h.toFixed(2));
                el.setAttribute("rx", rx.toFixed(2));
            }
            thumbLight.setAttribute("opacity", (1 - inv).toFixed(3));
            thumbDark.setAttribute("opacity", inv.toFixed(3));
        };
        svg.addEventListener("pointerdown", (e) => {
            ctx.interact();
            svg.setPointerCapture(e.pointerId);
            const pt = stagePoint(svg, e);
            dragging = true;
            moved = false;
            tailDelay = 0;
            downX = pt.x;
            startVal = (leftEdge.x + rightEdge.x) / 2;
            pressSpring.target = 1;
            vel.reset(pt.x, pt.y);
            ctx.wake();
        });
        svg.addEventListener("pointermove", (e) => {
            if (!dragging)
                return;
            const pt = stagePoint(svg, e);
            vel.push(pt.x, pt.y);
            if (Math.abs(pt.x - downX) > 4)
                moved = true;
            const next = clamp(startVal + (pt.x - downX) / (MAX_X - MIN_X), 0, 1);
            if (next >= startVal) {
                rightEdge.setParams({ omega: 38, zeta: 0.78 });
                leftEdge.setParams({ omega: 13, zeta: 0.62 });
            }
            else {
                leftEdge.setParams({ omega: 38, zeta: 0.78 });
                rightEdge.setParams({ omega: 13, zeta: 0.62 });
            }
            leftEdge.target = next;
            rightEdge.target = next;
            ctx.wake();
        });
        const release = (e) => {
            if (!dragging)
                return;
            dragging = false;
            pressSpring.target = 0;
            if (svg.hasPointerCapture(e.pointerId))
                svg.releasePointerCapture(e.pointerId);
            if (!moved) {
                setState(!on, true);
            }
            else {
                const { vx } = vel.velocity();
                const mid = (leftEdge.x + rightEdge.x) / 2;
                const projected = mid + vx / ((MAX_X - MIN_X) * 6);
                setState(projected >= 0.5, true);
            }
        };
        svg.addEventListener("pointerup", release);
        svg.addEventListener("pointercancel", release);
        let lastBeat = -1;
        render();
        return {
            el: svg,
            step(dt) {
                let pending = false;
                if (tailDelay > 0) {
                    tailDelay -= dt;
                    pending = true;
                    if (tailDelay <= 0) {
                        if (on)
                            leftEdge.target = pendingTailTarget;
                        else
                            rightEdge.target = pendingTailTarget;
                    }
                }
                const a = leftEdge.step(dt);
                const b = rightEdge.step(dt);
                const c = pressSpring.step(dt);
                render();
                return pending || a || b || c || dragging;
            },
            demo(cycleTime) {
                const beat = Math.floor(cycleTime / 1.25);
                if (beat !== lastBeat) {
                    lastBeat = beat;
                    setState(beat % 2 === 1, false);
                }
            },
            trigger() {
                ctx.interact();
                setState(!on, true);
            },
        };
    },
};
// ── 05 · Jelly Pad ─────────────────────────────────────────────────────────────────────────────
// Plump 3D marshmallow cube performing high @yui540 parabolic leaps across the stage with brief
// pre-jump anticipation crouch, juicy world-aligned floor impact squash, and reactive ground shadow.
export const jellyPad = {
    slug: "jelly-pad",
    name: "Jelly Pad",
    material: "rubber",
    hint: "Click to hop, or grab and toss",
    mount(ctx) {
        const svg = createStageSvg();
        const FLOOR = 108;
        const HALF = 23.5;
        const gradId = uniqueId("jelly-shade");
        const defs = svgEl("defs");
        const grad = svgEl("linearGradient", { id: gradId, x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
        grad.append(svgEl("stop", { offset: "0%", "stop-color": "var(--m-ink)", "stop-opacity": 1 }), svgEl("stop", { offset: "72%", "stop-color": "var(--m-ink)", "stop-opacity": 0.94 }), svgEl("stop", { offset: "100%", "stop-color": "var(--m-ink)", "stop-opacity": 0.78 }));
        defs.append(grad);
        const shadow = svgEl("ellipse", {
            cx: 100,
            cy: FLOOR + 6,
            rx: 27,
            ry: 5.5,
            fill: "var(--m-shadow)",
        });
        const squashG = svgEl("g");
        const rotG = svgEl("g");
        const body = svgEl("rect", {
            x: -HALF,
            y: -HALF,
            width: HALF * 2,
            height: HALF * 2,
            rx: 15,
            fill: `url(#${gradId})`,
        });
        rotG.append(body);
        squashG.append(rotG);
        svg.append(defs, shadow, squashG);
        let x = 100;
        let y = FLOOR - HALF;
        let vx = 0;
        let vy = 0;
        let angle = 0;
        let vAngle = 0;
        let grounded = true;
        let hopDir = 1;
        let userActive = false;
        const strain = new Spring(0, { omega: 25, zeta: 0.20 }); // vivid silicone jelly wobble!
        const homeX = new Spring(100, { omega: 8, zeta: 0.65 });
        const settleAngle = new Spring(0, { omega: 20, zeta: 0.48 });
        let dragging = false;
        let grabOffsetX = 0;
        let grabOffsetY = 0;
        let downX = 0;
        let downY = 0;
        let moved = false;
        const vel = new VelocityTracker();
        const hop = (dir, fromUser) => {
            userActive = fromUser;
            grounded = false;
            vx = dir * 145;
            vy = -345;
            vAngle = dir * 210;
            strain.snap(-0.28);
            strain.target = 0;
            strain.impulse(-2.6);
            if (fromUser)
                ctx.sound("thump", 0.85);
            ctx.wake();
        };
        const render = () => {
            const { sx, sy } = squash(clamp(strain.x, -0.38, 0.42));
            const alt = Math.max(0, FLOOR - HALF - y);
            const altNorm = clamp(alt / 86, 0, 1);
            shadow.setAttribute("cx", x.toFixed(1));
            shadow.setAttribute("rx", lerp(27 * sx, 9, altNorm).toFixed(1));
            shadow.setAttribute("ry", lerp(5.8, 2.2, altNorm).toFixed(1));
            shadow.setAttribute("opacity", lerp(0.58, 0.12, altNorm).toFixed(3));
            const anchorShift = (1 - sy) * HALF * (1 - altNorm);
            squashG.setAttribute("transform", `translate(${x.toFixed(2)} ${(y + anchorShift).toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);
            rotG.setAttribute("transform", `rotate(${angle.toFixed(1)})`);
        };
        svg.addEventListener("pointerdown", (e) => {
            ctx.interact();
            svg.setPointerCapture(e.pointerId);
            const pt = stagePoint(svg, e);
            userActive = true;
            dragging = true;
            grounded = false;
            moved = false;
            downX = pt.x;
            downY = pt.y;
            grabOffsetX = x - pt.x;
            grabOffsetY = y - pt.y;
            vx = 0;
            vy = 0;
            vAngle = 0;
            strain.target = 0.22; // squish under finger on grab!
            vel.reset(pt.x, pt.y);
            ctx.wake();
        });
        svg.addEventListener("pointermove", (e) => {
            if (!dragging)
                return;
            const pt = stagePoint(svg, e);
            vel.push(pt.x, pt.y);
            if (Math.hypot(pt.x - downX, pt.y - downY) > 5)
                moved = true;
            const nx = clamp(pt.x + grabOffsetX, 28, 172);
            const ny = clamp(pt.y + grabOffsetY, 22, FLOOR - HALF);
            const dx = nx - x;
            const dy = ny - y;
            x = nx;
            y = ny;
            angle = clamp(angle * 0.85 + dx * 0.9, -40, 40);
            strain.target = clamp((Math.abs(dx) - Math.abs(dy)) * 0.015, -0.26, 0.26);
            ctx.wake();
        });
        const release = (e) => {
            if (!dragging)
                return;
            dragging = false;
            strain.target = 0;
            if (svg.hasPointerCapture(e.pointerId))
                svg.releasePointerCapture(e.pointerId);
            if (!moved) {
                hopDir = x > 106 ? -1 : x < 94 ? 1 : -hopDir;
                hop(hopDir, true);
            }
            else {
                const v = vel.velocity();
                vx = clamp(v.vx * 0.62, -420, 420);
                vy = clamp(v.vy * 0.62, -440, 340);
                vAngle = clamp(vx * 1.0, -300, 300);
                ctx.wake();
            }
        };
        svg.addEventListener("pointerup", release);
        svg.addEventListener("pointercancel", release);
        let lastDemoStep = -1;
        render();
        return {
            el: svg,
            step(dt) {
                let active = false;
                if (!dragging) {
                    if (!grounded) {
                        const GRAVITY = 1040;
                        vy += GRAVITY * dt;
                        x += vx * dt;
                        y += vy * dt;
                        angle += vAngle * dt;
                        if (x < 30) {
                            x = 30;
                            vx = Math.abs(vx) * 0.58;
                            vAngle *= -0.6;
                            strain.impulse(-2.6);
                            if (userActive)
                                ctx.sound("thump", 0.55);
                        }
                        else if (x > 170) {
                            x = 170;
                            vx = -Math.abs(vx) * 0.58;
                            vAngle *= -0.6;
                            strain.impulse(-2.6);
                            if (userActive)
                                ctx.sound("thump", 0.55);
                        }
                        if (y < 22) {
                            y = 22;
                            vy = Math.abs(vy) * 0.45;
                        }
                        if (y >= FLOOR - HALF) {
                            y = FLOOR - HALF;
                            const impact = Math.abs(vy);
                            if (impact > 110) {
                                vy = -impact * 0.34;
                                vx *= 0.56;
                                vAngle *= 0.42;
                                const mag = clamp(impact / 520, 0.16, 0.42);
                                strain.impulse(mag * 24);
                                if (userActive)
                                    ctx.sound("thump", clamp(impact / 340, 0.35, 1));
                            }
                            else {
                                vy = 0;
                                grounded = true;
                                homeX.snap(x);
                                homeX.v = vx * 0.45;
                                homeX.target = clamp(x, 62, 138);
                                const nearest = Math.round(angle / 90) * 90;
                                settleAngle.snap(angle);
                                settleAngle.v = vAngle;
                                settleAngle.target = nearest;
                                vx = 0;
                                vAngle = 0;
                                if (impact > 20) {
                                    strain.impulse(4.8);
                                    if (userActive)
                                        ctx.sound("thump", 0.42);
                                }
                            }
                        }
                        active = true;
                    }
                    else {
                        const hxActive = homeX.step(dt, 0.08, 0.3);
                        const angActive = settleAngle.step(dt, 0.08, 0.3);
                        x = homeX.x;
                        angle = angActive ? settleAngle.x : settleAngle.target % 90;
                        if (hxActive || angActive)
                            active = true;
                    }
                }
                else {
                    active = true;
                }
                const sActive = strain.step(dt);
                render();
                return active || sActive;
            },
            demo(cycleTime) {
                // Explicit anticipation crouch right before each parabolic leap!
                const period = 1.45;
                const phase = cycleTime % period;
                const cycle = Math.floor(cycleTime / period);
                const key = cycle * 2 + (phase > 0.18 ? 1 : 0);
                if (key !== lastDemoStep) {
                    lastDemoStep = key;
                    if (phase <= 0.18) {
                        strain.target = 0.28;
                        ctx.wake();
                    }
                    else {
                        strain.target = 0;
                        hopDir = x > 105 ? -1 : x < 95 ? 1 : cycle % 2 === 0 ? 1 : -1;
                        hop(hopDir, false);
                    }
                }
            },
            trigger() {
                ctx.interact();
                hopDir = -hopDir;
                hop(hopDir, true);
            },
        };
    },
};
// ── 06 · Swipe Confirm ─────────────────────────────────────────────────────────────────────────
// Gesture slider with nonlinear quintic accelerating swipe choreography, stiff spring drag,
// early-release elastic recoil, and punchy threshold snap pop morphing → into a drawn ✓.
export const swipeConfirm = {
    slug: "swipe-confirm",
    name: "Swipe Confirm",
    material: "rubber",
    hint: "Drag right past 80%, or click to confirm",
    mount(ctx) {
        const svg = createStageSvg();
        const W = 152;
        const H = 40;
        const X = (200 - W) / 2;
        const Y = (140 - H) / 2;
        const R = 16;
        const MIN_X = X + 4 + R;
        const MAX_X = X + W - 4 - R;
        const SPAN = MAX_X - MIN_X;
        const clipId = uniqueId("swipe-clip");
        const defs = svgEl("defs");
        const clip = svgEl("clipPath", { id: clipId });
        clip.append(svgEl("rect", { x: X, y: Y, width: W, height: H, rx: H / 2 }));
        defs.append(clip);
        const track = svgEl("rect", {
            x: X,
            y: Y,
            width: W,
            height: H,
            rx: H / 2,
            fill: "var(--m-well)",
            stroke: "var(--m-border-strong)",
            "stroke-width": 1,
        });
        const fillBar = svgEl("rect", {
            x: X,
            y: Y,
            width: 0,
            height: H,
            rx: H / 2,
            fill: "var(--m-mid)",
            opacity: 0,
            "clip-path": `url(#${clipId})`,
        });
        const chevronsG = svgEl("g", {
            fill: "none",
            stroke: "var(--m-soft)",
            "stroke-width": 1.6,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
        });
        const chevrons = [0, 1, 2].map((i) => {
            const cx = 96 + i * 10;
            const p = svgEl("path", { d: `M${cx - 2.5} ${Y + 15.5} L${cx + 2} ${Y + 20} L${cx - 2.5} ${Y + 24.5}` });
            chevronsG.append(p);
            return p;
        });
        const handleG = svgEl("g");
        const knob = svgEl("circle", { cx: 0, cy: 0, r: R, fill: "var(--m-ink)" });
        const arrow = svgEl("path", {
            d: "M-5.5 0 H5 M1.5 -4 L5.5 0 L1.5 4",
            fill: "none",
            stroke: "var(--m-paper)",
            "stroke-width": 2,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
        });
        const check = svgEl("path", {
            d: "M-5.5 0.5 L-1.5 4.5 L6 -4",
            fill: "none",
            stroke: "var(--m-paper)",
            "stroke-width": 2.2,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-dasharray": 20,
            "stroke-dashoffset": 20,
        });
        handleG.append(knob, arrow, check);
        svg.append(defs, track, fillBar, chevronsG, handleG);
        let confirmed = false;
        const pos = new Spring(0, { omega: 22, zeta: 0.46 });
        const confirmSpring = new Spring(0, { omega: 26, zeta: 0.45 });
        const pop = new Spring(1, { omega: 28, zeta: 0.28 });
        let dragging = false;
        let moved = false;
        let downX = 0;
        let startPos = 0;
        let shimmerClock = 0;
        let resetTimer = 0;
        let demoPopped = false;
        const vel = new VelocityTracker();
        const setConfirmed = (next, fromUser) => {
            confirmed = next;
            pos.setParams({ omega: 22, zeta: 0.44 });
            pos.target = next ? 1 : 0;
            confirmSpring.target = next ? 1 : 0;
            if (next) {
                pop.snap(1);
                pop.impulse(4.4);
                resetTimer = 1.5;
                if (fromUser)
                    ctx.sound("confirm", 0.92);
            }
            else {
                resetTimer = 0;
                if (fromUser)
                    ctx.sound("click", 0.65);
            }
            ctx.wake();
        };
        svg.addEventListener("pointerdown", (e) => {
            ctx.interact();
            svg.setPointerCapture(e.pointerId);
            const pt = stagePoint(svg, e);
            dragging = true;
            moved = false;
            downX = pt.x;
            startPos = clamp(pos.x, 0, 1);
            resetTimer = 0;
            pos.setParams({ omega: 42, zeta: 0.78 });
            vel.reset(pt.x, pt.y);
            ctx.wake();
        });
        svg.addEventListener("pointermove", (e) => {
            if (!dragging)
                return;
            const pt = stagePoint(svg, e);
            vel.push(pt.x, pt.y);
            if (Math.abs(pt.x - downX) > 4)
                moved = true;
            const next = clamp(startPos + (pt.x - downX) / SPAN, 0, 1);
            pos.target = next;
            confirmSpring.target = next > 0.84 ? 1 : 0;
            ctx.wake();
        });
        const release = (e) => {
            if (!dragging)
                return;
            dragging = false;
            if (svg.hasPointerCapture(e.pointerId))
                svg.releasePointerCapture(e.pointerId);
            if (!moved) {
                setConfirmed(!confirmed, true);
                return;
            }
            const { vx } = vel.velocity();
            const projected = pos.x + vx / (SPAN * 7);
            if (projected >= 0.78) {
                setConfirmed(true, true);
            }
            else {
                confirmed = false;
                pos.setParams({ omega: 20, zeta: 0.40 });
                pos.target = 0;
                pos.impulse(clamp(vx / SPAN, -6, 6));
                confirmSpring.target = 0;
                ctx.sound("thump", 0.55);
                ctx.wake();
            }
        };
        svg.addEventListener("pointerup", release);
        svg.addEventListener("pointercancel", release);
        const render = () => {
            const p = clamp(pos.x, -0.04, 1.04);
            const c = clamp(confirmSpring.x, 0, 1);
            const cx = MIN_X + clamp(p, 0, 1) * SPAN;
            const sc = clamp(pop.x, 0.82, 1.24);
            const barVis = smoothstep(0.01, 0.1, p);
            fillBar.setAttribute("width", Math.max(0, cx - X + R).toFixed(2));
            fillBar.setAttribute("opacity", (barVis * lerp(0.32, 0.68, c)).toFixed(3));
            const chevFade = 1 - smoothstep(0.05, 0.55, p);
            for (let i = 0; i < 3; i++) {
                const wave = 0.22 + 0.78 * (0.5 + 0.5 * Math.sin(shimmerClock * 5.2 - i * 0.95));
                chevrons[i].setAttribute("opacity", (wave * chevFade).toFixed(3));
            }
            handleG.setAttribute("transform", `translate(${cx.toFixed(2)} ${Y + H / 2}) scale(${sc.toFixed(3)})`);
            arrow.setAttribute("opacity", (1 - smoothstep(0, 0.45, c)).toFixed(3));
            const checkDraw = smoothstep(0.22, 1, c);
            check.setAttribute("stroke-dashoffset", (20 * (1 - checkDraw)).toFixed(2));
            check.setAttribute("opacity", checkDraw > 0.01 ? "1" : "0");
        };
        render();
        return {
            el: svg,
            step(dt) {
                let active = false;
                const a = pos.step(dt);
                const b = confirmSpring.step(dt);
                const c = pop.step(dt);
                if (confirmed && resetTimer > 0) {
                    resetTimer -= dt;
                    active = true;
                    if (resetTimer <= 0)
                        setConfirmed(false, false);
                }
                if (a || b || c || dragging) {
                    shimmerClock += dt;
                    active = true;
                }
                render();
                return active;
            },
            demo(cycleTime, dt) {
                shimmerClock += dt;
                const t = cycleTime % 2.6;
                // Nonlinear quintic glide right (slow bite -> whip fast -> elastic snap pop!) -> snappy recoil back.
                if (t < 0.35) {
                    demoPopped = false;
                    confirmed = false;
                    pos.setParams({ omega: 24, zeta: 0.48 });
                    pos.target = 0;
                    confirmSpring.target = 0;
                    ctx.wake();
                }
                else if (t < 1.15) {
                    const u = (t - 0.35) / 0.80;
                    const q = easeInOutQuint(u);
                    pos.setParams({ omega: 40, zeta: 0.76 });
                    pos.target = q;
                    if (q > 0.88 && !demoPopped) {
                        demoPopped = true;
                        confirmSpring.target = 1;
                        pop.snap(1);
                        pop.impulse(4.2);
                    }
                    ctx.wake();
                }
                else if (t < 1.95) {
                    pos.target = 1;
                    confirmSpring.target = 1;
                }
                else {
                    confirmed = false;
                    pos.setParams({ omega: 20, zeta: 0.38 });
                    pos.target = 0;
                    confirmSpring.target = 0;
                    ctx.wake();
                }
            },
            trigger() {
                ctx.interact();
                setConfirmed(!confirmed, true);
            },
        };
    },
};
// ── 13 · Squash Play ───────────────────────────────────────────────────────────────────────────
// Chunky 3D-extruded keycap with bold @yui540 squash-to-pillow compression (sy ~ 0.68, sx ~ 1.32),
// mid-squash polygon morphing between Pause and Play, and tall elastic rebound pop.
export const squashPlay = {
    slug: "squash-play",
    name: "Squash Play",
    material: "rubber",
    hint: "Hold to depress, release to morph",
    mount(ctx) {
        const svg = createStageSvg();
        const SIZE = 66;
        const HALF = SIZE / 2;
        const CX = 100;
        const CY = 68;
        const LIP = 8.5;
        const shadow = svgEl("rect", {
            x: CX - HALF - 1,
            y: CY - HALF + LIP + 2,
            width: SIZE + 2,
            height: SIZE,
            rx: 19,
            fill: "var(--m-shadow)",
            opacity: 0.48,
        });
        const baseLip = svgEl("rect", {
            x: CX - HALF,
            y: CY - HALF + LIP,
            width: SIZE,
            height: SIZE,
            rx: 18,
            fill: "var(--m-lip)",
        });
        const capG = svgEl("g");
        const cap = svgEl("rect", {
            x: -HALF,
            y: -HALF,
            width: SIZE,
            height: SIZE,
            rx: 18,
            fill: "var(--m-ink)",
        });
        const polyL = svgEl("polygon", { fill: "var(--m-paper)" });
        const polyR = svgEl("polygon", { fill: "var(--m-paper)" });
        capG.append(cap, polyL, polyR);
        svg.append(shadow, baseLip, capG);
        const PAUSE_L = [
            [-10.5, -12],
            [-3.5, -12],
            [-3.5, 12],
            [-10.5, 12],
        ];
        const PLAY_L = [
            [-8.5, -13],
            [2.2, -6.59],
            [2.2, 6.59],
            [-8.5, 13],
        ];
        const PAUSE_R = [
            [3.5, -12],
            [10.5, -12],
            [10.5, 12],
            [3.5, 12],
        ];
        const PLAY_R = [
            [1.8, -6.83],
            [13.2, 0],
            [13.2, 0],
            [1.8, 6.83],
        ];
        const interpPoly = (a, b, t) => a.map(([ax, ay], i) => `${lerp(ax, b[i][0], t).toFixed(2)},${lerp(ay, b[i][1], t).toFixed(2)}`).join(" ");
        let playing = false;
        let holding = false;
        const morph = new Spring(0, { omega: 24, zeta: 0.44 });
        const strain = new Spring(0, { omega: 24, zeta: 0.26 }); // dramatic pillow-squash -> tall pop!
        const depth = new Spring(0, { omega: 28, zeta: 0.36 });
        const toggle = (fromUser) => {
            playing = !playing;
            morph.target = playing ? 1 : 0;
            strain.target = 0;
            depth.target = 0;
            // Bold upward rebound stretch & pop off the lip!
            strain.impulse(-5.6);
            depth.impulse(-6.2);
            if (fromUser)
                ctx.sound("thump", 0.9);
            ctx.wake();
        };
        svg.addEventListener("pointerdown", (e) => {
            ctx.interact();
            svg.setPointerCapture(e.pointerId);
            holding = true;
            depth.target = 1;
            strain.target = 0.32; // deep pillow-squash on hold!
            // Begin morphing halfway right inside the press peak (matching reference frame 2!).
            morph.target = playing ? 0.55 : 0.45;
            ctx.sound("click", 0.65);
            ctx.wake();
        });
        const release = (e) => {
            if (!holding)
                return;
            holding = false;
            if (svg.hasPointerCapture(e.pointerId))
                svg.releasePointerCapture(e.pointerId);
            toggle(true);
        };
        svg.addEventListener("pointerup", release);
        svg.addEventListener("pointercancel", () => {
            holding = false;
            depth.target = 0;
            strain.target = 0;
            morph.target = playing ? 1 : 0;
            ctx.wake();
        });
        let lastMorph = -1;
        const render = () => {
            const m = clamp(morph.x, 0, 1);
            const { sx, sy } = squash(clamp(strain.x, -0.26, 0.36));
            const sink = clamp(depth.x, -0.45, 1.05) * (LIP - 1.5);
            const capW = SIZE * sx;
            const capH = SIZE * sy;
            const bottomShift = (1 - sy) * HALF;
            const capCenterY = CY + sink + bottomShift;
            const capTop = capCenterY - capH / 2;
            const lipVis = Math.max(1.5, LIP - sink);
            const lipRx = clamp(18 * sy, 10, 22);
            baseLip.setAttribute("x", (CX - capW / 2).toFixed(2));
            baseLip.setAttribute("y", (capTop + lipVis).toFixed(2));
            baseLip.setAttribute("width", capW.toFixed(2));
            baseLip.setAttribute("height", capH.toFixed(2));
            baseLip.setAttribute("rx", lipRx.toFixed(2));
            shadow.setAttribute("x", (CX - capW / 2 - 1).toFixed(2));
            shadow.setAttribute("y", (capTop + lipVis + 2.2).toFixed(2));
            shadow.setAttribute("width", (capW + 2).toFixed(2));
            shadow.setAttribute("height", capH.toFixed(2));
            shadow.setAttribute("rx", (lipRx + 1).toFixed(2));
            shadow.setAttribute("opacity", lerp(0.48, 0.2, clamp(depth.x, 0, 1)).toFixed(3));
            capG.setAttribute("transform", `translate(${CX} ${capCenterY.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);
            if (Math.abs(m - lastMorph) > 0.0005) {
                lastMorph = m;
                polyL.setAttribute("points", interpPoly(PAUSE_L, PLAY_L, m));
                polyR.setAttribute("points", interpPoly(PAUSE_R, PLAY_R, m));
            }
        };
        let demoState = -1;
        render();
        return {
            el: svg,
            step(dt) {
                const a = morph.step(dt);
                const b = strain.step(dt);
                const c = depth.step(dt);
                render();
                return a || b || c || holding;
            },
            demo(cycleTime) {
                const phase = cycleTime % 1.35;
                const cycle = Math.floor(cycleTime / 1.35);
                const key = cycle * 2 + (phase > 0.24 ? 1 : 0);
                if (key !== demoState) {
                    demoState = key;
                    if (phase <= 0.24) {
                        depth.target = 1;
                        strain.target = 0.32;
                        morph.target = playing ? 0.55 : 0.45;
                        ctx.wake();
                    }
                    else {
                        toggle(false);
                    }
                }
            },
            trigger() {
                ctx.interact();
                depth.snap(0.92);
                strain.snap(0.30);
                toggle(true);
            },
        };
    },
};
// ── 17 · Worm Dots ─────────────────────────────────────────────────────────────────────────────
// Five-dot pagination capsule with underdamped inchworm stretch-and-snap kinematics plus two
// staggered echo beads arcing over the crawling worm as slots swap places.
export const wormDots = {
    slug: "worm-dots",
    name: "Worm Dots",
    material: "rubber",
    hint: "Click a dot or scrub the track",
    mount(ctx) {
        const svg = createStageSvg();
        const COUNT = 5;
        const xs = Array.from({ length: COUNT }, (_, i) => 52 + i * 24);
        const Y = 70;
        const track = svgEl("rect", {
            x: 28,
            y: Y - 16,
            width: 144,
            height: 32,
            rx: 16,
            fill: "var(--m-well)",
            stroke: "var(--m-border-strong)",
            "stroke-width": 1,
        });
        svg.append(track);
        const dots = xs.map((x) => {
            const c = svgEl("circle", { cx: x, cy: Y, r: 4.6, fill: "var(--m-mid)", opacity: 0.72 });
            svg.append(c);
            return c;
        });
        const swapBead1 = svgEl("circle", { cx: xs[0], cy: Y, r: 4.5, fill: "var(--m-ink)", opacity: 0 });
        const swapBead2 = svgEl("circle", { cx: xs[0], cy: Y, r: 3.6, fill: "var(--m-ink)", opacity: 0 });
        const worm = svgEl("rect", {
            x: xs[0] - 8,
            y: Y - 7.5,
            width: 16,
            height: 15,
            rx: 7.5,
            fill: "var(--m-ink)",
        });
        svg.append(swapBead2, swapBead1, worm);
        let index = 0;
        const head = new Spring(xs[0], { omega: 30, zeta: 0.46 });
        const tail = new Spring(xs[0], { omega: 13, zeta: 0.46 });
        const swapProg1 = new Spring(1, { omega: 18, zeta: 0.56 });
        const swapProg2 = new Spring(1, { omega: 14, zeta: 0.58 });
        let tailDelay = 0;
        let pendingTail = xs[0];
        let swapFromX = xs[0];
        let swapToX = xs[0];
        const goTo = (next, fromUser) => {
            const clamped = clamp(next, 0, COUNT - 1);
            if (clamped === index && Math.abs(head.x - xs[clamped]) < 0.5)
                return;
            const prev = index;
            index = clamped;
            const target = xs[index];
            head.setParams({ omega: 30, zeta: 0.46 });
            tail.setParams({ omega: 15, zeta: 0.46 });
            head.target = target;
            pendingTail = target;
            tailDelay = 0.065;
            swapFromX = target;
            swapToX = xs[prev];
            swapProg1.snap(0);
            swapProg1.target = 1;
            swapProg2.snap(-0.18);
            swapProg2.target = 1;
            if (fromUser)
                ctx.sound("tick", 0.85);
            ctx.wake();
        };
        const pickFromX = (px) => {
            let best = 0;
            let dist = Infinity;
            for (let i = 0; i < COUNT; i++) {
                const d = Math.abs(px - xs[i]);
                if (d < dist) {
                    dist = d;
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
            goTo(pickFromX(stagePoint(svg, e).x), true);
        });
        svg.addEventListener("pointermove", (e) => {
            if (!scrubbing)
                return;
            const next = pickFromX(stagePoint(svg, e).x);
            if (next !== index)
                goTo(next, true);
        });
        const endScrub = (e) => {
            if (!scrubbing)
                return;
            scrubbing = false;
            if (svg.hasPointerCapture(e.pointerId))
                svg.releasePointerCapture(e.pointerId);
        };
        svg.addEventListener("pointerup", endScrub);
        svg.addEventListener("pointercancel", endScrub);
        const render = () => {
            const lo = Math.min(head.x, tail.x);
            const hi = Math.max(head.x, tail.x);
            const span = hi - lo;
            const strain = clamp(span / 76, 0, 0.28);
            const { sy } = squash(strain);
            const h = 15.5 * sy;
            const w = 15.5 + span;
            worm.setAttribute("x", (lo - 7.75).toFixed(2));
            worm.setAttribute("y", (Y - h / 2).toFixed(2));
            worm.setAttribute("width", w.toFixed(2));
            worm.setAttribute("height", h.toFixed(2));
            worm.setAttribute("rx", (h / 2).toFixed(2));
            const drawSwap = (el, rawT, lift, maxOp) => {
                const t = clamp(rawT, 0, 1);
                const arc = Math.sin(t * Math.PI);
                el.setAttribute("cx", lerp(swapFromX, swapToX, t).toFixed(2));
                el.setAttribute("cy", (Y - arc * lift).toFixed(2));
                el.setAttribute("r", lerp(3.2, 4.7, arc).toFixed(2));
                el.setAttribute("opacity", (arc * maxOp).toFixed(3));
            };
            drawSwap(swapBead1, swapProg1.x, 15, 0.72);
            drawSwap(swapBead2, swapProg2.x, 11, 0.36);
            for (let i = 0; i < COUNT; i++) {
                const covered = xs[i] >= lo - 5 && xs[i] <= hi + 5;
                dots[i].setAttribute("opacity", covered ? "0.2" : "0.75");
            }
        };
        const seq = [0, 3, 4, 1, 2];
        let lastStep = -1;
        render();
        return {
            el: svg,
            step(dt) {
                let pending = false;
                if (tailDelay > 0) {
                    tailDelay -= dt;
                    pending = true;
                    if (tailDelay <= 0)
                        tail.target = pendingTail;
                }
                const a = head.step(dt);
                const b = tail.step(dt);
                const c = swapProg1.step(dt);
                const d = swapProg2.step(dt);
                render();
                return pending || a || b || c || d;
            },
            demo(cycleTime) {
                const s = Math.floor(cycleTime / 1.05);
                if (s !== lastStep) {
                    lastStep = s;
                    goTo(seq[s % seq.length], false);
                }
            },
            trigger() {
                ctx.interact();
                goTo((index + 1) % COUNT, true);
            },
        };
    },
};
