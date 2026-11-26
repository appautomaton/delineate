// Taut & staged choreography tiles: bold high-energy nonlinear whips, exponential rocket launches,
// elastic squash/rebound morphs, and crisp row lift/slide choreography.
// Tiles: 04 Paper Plane, 08 Elastic String, 10 Download Ring, 11 Bell Toggle, 18 Menu Morph, 20 Checklist.
import { Spring, clamp, createStageSvg, easeInOutQuint, easeOutQuart, lerp, smoothstep, stagePoint, svgEl, } from "../physics.js";
// ── 04 · Paper Plane ───────────────────────────────────────────────────────────────────────────
// Anticipation pill squeeze -> exponential accelerating banked flight (u^2.2) with wake trailing
// strictly behind tail -> elastic rebound into crisp "✓ Sent" pill -> spring reopen to "Send".
export const paperPlane = {
    slug: "paper-plane",
    name: "Paper Plane",
    material: "taut",
    hint: "Click to launch",
    mount(ctx) {
        const svg = createStageSvg();
        const CX = 100;
        const CY = 74;
        const trail = svgEl("path", {
            d: "",
            fill: "none",
            stroke: "var(--m-soft)",
            "stroke-width": 1.4,
            "stroke-linecap": "round",
            "stroke-dasharray": "3.5 4.5",
            opacity: 0,
        });
        const pill = svgEl("rect", {
            x: CX - 54,
            y: CY - 19,
            width: 108,
            height: 38,
            rx: 19,
            fill: "var(--m-ink)",
            stroke: "var(--m-border-strong)",
            "stroke-width": 1,
        });
        const pillWell = svgEl("rect", {
            x: CX - 54,
            y: CY - 19,
            width: 108,
            height: 38,
            rx: 19,
            fill: "var(--m-well)",
            stroke: "var(--m-border-strong)",
            "stroke-width": 1.1,
            opacity: 0,
        });
        const sendLabel = svgEl("text", {
            x: CX,
            y: CY + 0.5,
            "text-anchor": "middle",
            "dominant-baseline": "central",
            fill: "var(--m-paper)",
            "font-family": "var(--m-sans)",
            "font-size": 13,
            "font-weight": 550,
        });
        sendLabel.textContent = "Send";
        const sentG = svgEl("g", { opacity: 0 });
        const sentCheck = svgEl("path", {
            d: `M${CX - 22} ${CY + 0.5} L${CX - 18.5} ${CY + 4} L${CX - 12} ${CY - 3}`,
            fill: "none",
            stroke: "var(--m-ink)",
            "stroke-width": 1.85,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
        });
        const sentLabel = svgEl("text", {
            x: CX + 7,
            y: CY + 0.5,
            "text-anchor": "middle",
            "dominant-baseline": "central",
            fill: "var(--m-ink)",
            "font-family": "var(--m-sans)",
            "font-size": 12.5,
            "font-weight": 520,
        });
        sentLabel.textContent = "Sent";
        sentG.append(sentCheck, sentLabel);
        const planeG = svgEl("g", { opacity: 0 });
        const planeOutline = svgEl("polygon", {
            points: "13,0 -10,-8.5 -5.5,0 -10,8.5",
            fill: "var(--m-card)",
            stroke: "var(--m-ink)",
            "stroke-width": 1.7,
            "stroke-linejoin": "round",
        });
        const planeFold = svgEl("line", {
            x1: -5.5,
            y1: 0,
            x2: 12,
            y2: 0,
            stroke: "var(--m-ink)",
            "stroke-width": 1.4,
            "stroke-linecap": "round",
        });
        planeG.append(planeOutline, planeFold);
        svg.append(trail, pill, pillWell, sendLabel, sentG, planeG);
        // Slight anticipation dip back-left before sweeping hard up-right!
        const P0 = { x: CX - 4, y: CY + 4 };
        const P1 = { x: 112, y: 74 };
        const P2 = { x: 144, y: 44 };
        const P3 = { x: 178, y: 14 };
        const bezierPos = (t) => {
            const m = 1 - t;
            return {
                x: m * m * m * P0.x + 3 * m * m * t * P1.x + 3 * m * t * t * P2.x + t * t * t * P3.x,
                y: m * m * m * P0.y + 3 * m * m * t * P1.y + 3 * m * t * t * P2.y + t * t * t * P3.y,
            };
        };
        const bezierDeriv = (t) => {
            const m = 1 - t;
            return {
                dx: 3 * m * m * (P1.x - P0.x) + 6 * m * t * (P2.x - P1.x) + 3 * t * t * (P3.x - P2.x),
                dy: 3 * m * m * (P1.y - P0.y) + 6 * m * t * (P2.y - P1.y) + 3 * t * t * (P3.y - P2.y),
            };
        };
        const pillW = new Spring(108, { omega: 24, zeta: 0.42 });
        const pillScale = new Spring(1, { omega: 28, zeta: 0.34 });
        let phase = "idle";
        let timer = 0;
        const launch = (fromUser) => {
            if (phase === "sent") {
                phase = "idle";
                timer = 0;
                pillW.target = 108;
                pillScale.impulse(2.8);
                if (fromUser)
                    ctx.sound("click", 0.65);
                ctx.wake();
                return;
            }
            phase = "flying";
            timer = 0;
            pillW.target = 70;
            pillScale.snap(0.86);
            pillScale.target = 1;
            if (fromUser)
                ctx.sound("confirm", 0.85);
            ctx.wake();
        };
        svg.addEventListener("pointerdown", () => {
            ctx.interact();
            launch(true);
        });
        const render = () => {
            const w = clamp(pillW.x, 58, 124);
            const sc = clamp(pillScale.x, 0.82, 1.18);
            for (const el of [pill, pillWell]) {
                el.setAttribute("x", (CX - w / 2).toFixed(2));
                el.setAttribute("width", w.toFixed(2));
                el.setAttribute("transform", `translate(${CX} ${CY}) scale(${sc.toFixed(3)}) translate(${-CX} ${-CY})`);
            }
            if (phase === "idle") {
                pillWell.setAttribute("opacity", "0");
                sendLabel.setAttribute("opacity", "1");
                sendLabel.setAttribute("y", (CY + 0.5).toFixed(2));
                sentG.setAttribute("opacity", "0");
                planeG.setAttribute("opacity", "0");
                trail.setAttribute("opacity", "0");
            }
            else if (phase === "flying") {
                const darkT = smoothstep(0, 0.2, timer);
                pillWell.setAttribute("opacity", darkT.toFixed(3));
                const sendFade = 1 - smoothstep(0, 0.13, timer);
                sendLabel.setAttribute("opacity", sendFade.toFixed(3));
                sendLabel.setAttribute("y", (CY + 0.5 + (1 - sendFade) * 10).toFixed(2));
                // Exponential acceleration launch (u^2.15): gathers tension inside the pill, then rockets away!
                const u = clamp((timer - 0.12) / 0.78, 0, 1);
                const ue = u ** 2.15;
                const pos = bezierPos(ue);
                const d = bezierDeriv(ue);
                const deg = (Math.atan2(d.dy, d.dx) * 180) / Math.PI;
                const planeOp = smoothstep(0, 0.14, u) * (1 - smoothstep(0.76, 1, u));
                const planeScale = lerp(0.66, 1.14, smoothstep(0, 0.4, u)) * lerp(1, 0.75, smoothstep(0.72, 1, u));
                planeG.setAttribute("transform", `translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)}) rotate(${deg.toFixed(1)}) scale(${planeScale.toFixed(3)})`);
                planeG.setAttribute("opacity", planeOp.toFixed(3));
                const tEnd = Math.max(0, ue - 0.05);
                const tStart = Math.max(0, tEnd - 0.52);
                if (tEnd > tStart + 0.02) {
                    let td = "";
                    const segs = 12;
                    for (let i = 0; i <= segs; i++) {
                        const p = bezierPos(lerp(tStart, tEnd, i / segs));
                        td += `${i === 0 ? "M" : " L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                    }
                    trail.setAttribute("d", td);
                    const trailOp = smoothstep(0.1, 0.28, u) * (1 - smoothstep(0.72, 1, u)) * 0.62;
                    trail.setAttribute("opacity", trailOp.toFixed(3));
                }
                else {
                    trail.setAttribute("opacity", "0");
                }
                const sentIn = smoothstep(0.84, 1.08, timer);
                sentG.setAttribute("opacity", sentIn.toFixed(3));
                sentG.setAttribute("transform", `translate(0 ${((1 - sentIn) * 6).toFixed(2)})`);
            }
            else {
                pillWell.setAttribute("opacity", "1");
                sendLabel.setAttribute("opacity", "0");
                planeG.setAttribute("opacity", "0");
                trail.setAttribute("opacity", "0");
                sentG.setAttribute("opacity", "1");
                sentG.setAttribute("transform", "translate(0 0)");
            }
        };
        let lastDemo = -1;
        render();
        return {
            el: svg,
            step(dt) {
                let active = false;
                if (phase === "flying") {
                    timer += dt;
                    if (timer >= 0.74 && pillW.target < 96) {
                        pillW.target = 96;
                        pillScale.impulse(2.2);
                    }
                    if (timer >= 1.12) {
                        phase = "sent";
                        timer = 0;
                    }
                    active = true;
                }
                else if (phase === "sent") {
                    timer += dt;
                    if (timer >= 1.05) {
                        phase = "idle";
                        timer = 0;
                        pillW.target = 108;
                        pillScale.impulse(2.0);
                    }
                    active = true;
                }
                const a = pillW.step(dt);
                const b = pillScale.step(dt);
                render();
                return active || a || b;
            },
            demo(cycleTime) {
                const beat = Math.floor(cycleTime / 2.65);
                if (beat !== lastDemo) {
                    lastDemo = beat;
                    if (phase === "idle")
                        launch(false);
                }
            },
            trigger() {
                ctx.interact();
                launch(true);
            },
        };
    },
};
// ── 08 · Elastic String ────────────────────────────────────────────────────────────────────────
// Bold full-amplitude tensioned chord (±36 px sweeps matching reference 18!) with low-damping
// 3-mode harmonic S-waves and cursor-tracking pull curve.
export const elasticString = {
    slug: "elastic-string",
    name: "Elastic String",
    material: "taut",
    hint: "Swipe across or pull and release",
    mount(ctx) {
        const svg = createStageSvg();
        const X0 = 22;
        const X1 = 178;
        const SPAN = X1 - X0;
        const Y0 = 70;
        const SAMPLES = 24;
        const chord = svgEl("path", {
            d: `M${X0} ${Y0} L${X1} ${Y0}`,
            fill: "none",
            stroke: "var(--m-ink)",
            "stroke-width": 2.4,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
        });
        const pinL = svgEl("circle", { cx: X0, cy: Y0, r: 3.8, fill: "var(--m-ink)" });
        const pinR = svgEl("circle", { cx: X1, cy: Y0, r: 3.8, fill: "var(--m-ink)" });
        svg.append(chord, pinL, pinR);
        const m1 = new Spring(0, { omega: 28, zeta: 0.065 });
        const m2 = new Spring(0, { omega: 54, zeta: 0.080 });
        const m3 = new Spring(0, { omega: 82, zeta: 0.095 });
        let pulling = false;
        let pullU = 0.5;
        let pullDy = 0;
        let lastPt = null;
        let lastPluckAt = 0;
        const pluck = (u, strength, fromUser) => {
            const cu = clamp(u, 0.08, 0.92);
            m1.impulse(strength * Math.sin(Math.PI * cu) * 40);
            m2.impulse(strength * Math.sin(2 * Math.PI * cu) * 58);
            m3.impulse(strength * Math.sin(3 * Math.PI * cu) * 56);
            if (fromUser)
                ctx.sound("pluck", clamp(Math.abs(strength) / 30, 0.45, 1));
            ctx.wake();
        };
        const releasePull = (fromUser) => {
            if (!pulling)
                return;
            pulling = false;
            const cu = clamp(pullU, 0.08, 0.92);
            m1.snap(pullDy * Math.sin(Math.PI * cu) * 1.0);
            m2.snap(pullDy * Math.sin(2 * Math.PI * cu) * 0.52);
            m3.snap(pullDy * Math.sin(3 * Math.PI * cu) * 0.28);
            m1.target = 0;
            m2.target = 0;
            m3.target = 0;
            if (fromUser)
                ctx.sound("pluck", clamp(Math.abs(pullDy) / 32, 0.45, 1));
            ctx.wake();
        };
        svg.addEventListener("pointerdown", (e) => {
            ctx.interact();
            svg.setPointerCapture(e.pointerId);
            const pt = stagePoint(svg, e);
            pulling = true;
            pullU = clamp((pt.x - X0) / SPAN, 0.08, 0.92);
            pullDy = clamp(pt.y - Y0, -44, 44);
            if (Math.abs(pullDy) < 8)
                pullDy = pt.y >= Y0 ? 32 : -32;
            ctx.wake();
        });
        svg.addEventListener("pointermove", (e) => {
            const pt = stagePoint(svg, e);
            if (pulling) {
                pullU = clamp((pt.x - X0) / SPAN, 0.08, 0.92);
                pullDy = clamp(pt.y - Y0, -46, 46);
                if (Math.abs(pt.y - Y0) > 50) {
                    releasePull(true);
                    if (svg.hasPointerCapture(e.pointerId))
                        svg.releasePointerCapture(e.pointerId);
                }
                ctx.wake();
                return;
            }
            if (lastPt && pt.x >= X0 + 6 && pt.x <= X1 - 6) {
                const crossed = (lastPt.y - Y0) * (pt.y - Y0) <= 0 && Math.abs(pt.y - lastPt.y) > 1.5;
                const now = performance.now();
                if (crossed && now - lastPluckAt > 110) {
                    lastPluckAt = now;
                    ctx.interact();
                    const dir = pt.y >= lastPt.y ? 1 : -1;
                    const speed = clamp(Math.abs(pt.y - lastPt.y) * 1.6, 16, 38);
                    pluck((pt.x - X0) / SPAN, dir * speed, true);
                }
            }
            lastPt = pt;
        });
        svg.addEventListener("pointerleave", () => {
            lastPt = null;
        });
        svg.addEventListener("pointerup", (e) => {
            if (svg.hasPointerCapture(e.pointerId))
                svg.releasePointerCapture(e.pointerId);
            releasePull(true);
        });
        svg.addEventListener("pointercancel", (e) => {
            if (svg.hasPointerCapture(e.pointerId))
                svg.releasePointerCapture(e.pointerId);
            releasePull(false);
        });
        const render = () => {
            let d;
            if (pulling) {
                const px = X0 + pullU * SPAN;
                const py = Y0 + pullDy * 1.85;
                d = `M${X0} ${Y0} Q${px.toFixed(2)} ${py.toFixed(2)} ${X1} ${Y0}`;
            }
            else if (Math.abs(m1.x) + Math.abs(m2.x) + Math.abs(m3.x) < 0.03) {
                d = `M${X0} ${Y0} L${X1} ${Y0}`;
            }
            else {
                d = `M${X0} ${Y0}`;
                for (let i = 1; i <= SAMPLES; i++) {
                    const u = i / SAMPLES;
                    const x = X0 + u * SPAN;
                    const y = Y0 +
                        m1.x * Math.sin(Math.PI * u) +
                        m2.x * Math.sin(2 * Math.PI * u) +
                        m3.x * Math.sin(3 * Math.PI * u);
                    d += ` L${x.toFixed(2)} ${y.toFixed(2)}`;
                }
            }
            chord.setAttribute("d", d);
        };
        const pluckPts = [0.34, 0.66, 0.5, 0.28];
        let lastDemo = -1;
        render();
        return {
            el: svg,
            step(dt) {
                const a = m1.step(dt, 0.05, 0.25);
                const b = m2.step(dt, 0.05, 0.25);
                const c = m3.step(dt, 0.05, 0.25);
                render();
                return a || b || c || pulling;
            },
            demo(cycleTime) {
                const beat = Math.floor(cycleTime / 1.55);
                if (beat !== lastDemo) {
                    lastDemo = beat;
                    const dir = beat % 2 === 0 ? -1 : 1;
                    pluck(pluckPts[beat % pluckPts.length], dir * 32, false);
                }
            },
            trigger() {
                ctx.interact();
                pluck(0.36, -36, true);
            },
        };
    },
};
// ── 10 · Download Ring ─────────────────────────────────────────────────────────────────────────
// Elastic pill collapse (zeta 0.44 bounce!) -> quintic accelerating ring progress -> inverted
// check disc pop -> elastic re-expansion back into "↓ Download" pill.
export const downloadRing = {
    slug: "download-ring",
    name: "Download Ring",
    material: "taut",
    hint: "Click to download or interrupt",
    mount(ctx) {
        const svg = createStageSvg();
        const CX = 100;
        const CY = 70;
        const R = 17.5;
        const CIRC = 2 * Math.PI * R;
        const pill = svgEl("rect", {
            x: CX - 60,
            y: CY - 19,
            width: 120,
            height: 38,
            rx: 19,
            fill: "var(--m-well)",
            stroke: "var(--m-border-strong)",
            "stroke-width": 1,
        });
        const donePill = svgEl("rect", {
            x: CX - 23,
            y: CY - 23,
            width: 46,
            height: 46,
            rx: 23,
            fill: "var(--m-ink)",
            opacity: 0,
        });
        const idleG = svgEl("g");
        const dlIcon = svgEl("path", {
            d: `M${CX - 36} ${CY - 5} V${CY + 3.5} M${CX - 39.5} ${CY + 0.5} L${CX - 36} ${CY + 4} L${CX - 32.5} ${CY + 0.5} M${CX - 40.5} ${CY + 6.5} H${CX - 31.5}`,
            fill: "none",
            stroke: "var(--m-ink)",
            "stroke-width": 1.6,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
        });
        const dlText = svgEl("text", {
            x: CX + 9,
            y: CY + 0.5,
            "text-anchor": "middle",
            "dominant-baseline": "central",
            fill: "var(--m-ink)",
            "font-family": "var(--m-sans)",
            "font-size": 12.5,
            "font-weight": 500,
        });
        dlText.textContent = "Download";
        idleG.append(dlIcon, dlText);
        const ringTrack = svgEl("circle", {
            cx: CX,
            cy: CY,
            r: R,
            fill: "none",
            stroke: "var(--m-mid)",
            "stroke-width": 2.4,
            opacity: 0,
        });
        const ringArc = svgEl("circle", {
            cx: CX,
            cy: CY,
            r: R,
            fill: "none",
            stroke: "var(--m-ink)",
            "stroke-width": 2.7,
            "stroke-linecap": "round",
            "stroke-dasharray": CIRC.toFixed(2),
            "stroke-dashoffset": CIRC.toFixed(2),
            transform: `rotate(-90 ${CX} ${CY})`,
            opacity: 0,
        });
        const check = svgEl("path", {
            d: `M${CX - 7.5} ${CY + 0.5} L${CX - 2} ${CY + 6} L${CX + 8.5} ${CY - 5}`,
            fill: "none",
            stroke: "var(--m-paper)",
            "stroke-width": 2.5,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-dasharray": 26,
            "stroke-dashoffset": 26,
            opacity: 0,
        });
        const group = svgEl("g");
        group.append(pill, donePill, idleG, ringTrack, ringArc, check);
        svg.append(group);
        // Elastic pill springs give unmistakable squeeze & bloom bounce on every state boundary!
        const pillW = new Spring(120, { omega: 24, zeta: 0.44 });
        const pillH = new Spring(38, { omega: 24, zeta: 0.44 });
        const pop = new Spring(1, { omega: 28, zeta: 0.30 });
        let state = "idle";
        let userActive = false;
        let t = 0;
        const start = (fromUser) => {
            userActive = fromUser;
            if (state === "downloading") {
                state = "idle";
                t = 0;
                pillW.target = 120;
                pillH.target = 38;
                if (fromUser)
                    ctx.sound("click", 0.6);
                ctx.wake();
                return;
            }
            state = "downloading";
            t = 0;
            pillW.target = 46;
            pillH.target = 46;
            pop.snap(0.92);
            pop.target = 1;
            if (fromUser)
                ctx.sound("click", 0.8);
            ctx.wake();
        };
        svg.addEventListener("pointerdown", () => {
            ctx.interact();
            start(true);
        });
        const render = () => {
            const w = clamp(pillW.x, 40, 134);
            const h = clamp(pillH.x, 32, 54);
            const sc = clamp(pop.x, 0.84, 1.24);
            const rx = (Math.min(w, h) / 2).toFixed(2);
            group.setAttribute("transform", `translate(${CX} ${CY}) scale(${sc.toFixed(3)}) translate(${-CX} ${-CY})`);
            for (const rect of [pill, donePill]) {
                rect.setAttribute("x", (CX - w / 2).toFixed(2));
                rect.setAttribute("y", (CY - h / 2).toFixed(2));
                rect.setAttribute("width", w.toFixed(2));
                rect.setAttribute("height", h.toFixed(2));
                rect.setAttribute("rx", rx);
            }
            const pillOpen = smoothstep(72, 114, w);
            idleG.setAttribute("opacity", state === "done" ? (pillOpen * smoothstep(0.92, 1.16, t)).toFixed(3) : pillOpen.toFixed(3));
            if (state === "idle") {
                ringTrack.setAttribute("opacity", "0");
                ringArc.setAttribute("opacity", "0");
                donePill.setAttribute("opacity", "0");
                check.setAttribute("opacity", "0");
            }
            else if (state === "downloading") {
                const ringVis = smoothstep(76, 52, w);
                const u = clamp((t - 0.14) / 1.06, 0, 1);
                // Strongly nonlinear quintic progress surge: slow initial bite -> fast sweep -> crisp lock!
                const prog = easeInOutQuint(u);
                ringTrack.setAttribute("opacity", (ringVis * 0.45).toFixed(3));
                ringArc.setAttribute("opacity", ringVis.toFixed(3));
                ringArc.setAttribute("stroke-dashoffset", (CIRC * (1 - prog)).toFixed(2));
                donePill.setAttribute("opacity", "0");
                check.setAttribute("opacity", "0");
            }
            else {
                const doneFade = 1 - smoothstep(0.84, 1.14, t);
                const checkDraw = easeOutQuart(clamp((t - 0.04) / 0.28, 0, 1));
                ringTrack.setAttribute("opacity", "0");
                ringArc.setAttribute("opacity", "0");
                donePill.setAttribute("opacity", doneFade.toFixed(3));
                check.setAttribute("opacity", (doneFade * (1 - smoothstep(0.78, 0.98, t))).toFixed(3));
                check.setAttribute("stroke-dashoffset", (26 * (1 - checkDraw)).toFixed(2));
            }
        };
        let lastDemo = -1;
        render();
        return {
            el: svg,
            step(dt) {
                let active = false;
                if (state === "downloading") {
                    t += dt;
                    if (t >= 1.22) {
                        state = "done";
                        t = 0;
                        pop.snap(1);
                        pop.impulse(4.6);
                        if (userActive)
                            ctx.sound("confirm", 0.92);
                    }
                    active = true;
                }
                else if (state === "done") {
                    t += dt;
                    if (t >= 0.80) {
                        pillW.target = 120;
                        pillH.target = 38;
                    }
                    if (t >= 1.18) {
                        state = "idle";
                        t = 0;
                    }
                    active = true;
                }
                const a = pillW.step(dt);
                const b = pillH.step(dt);
                const c = pop.step(dt);
                render();
                return active || a || b || c;
            },
            demo(cycleTime) {
                const beat = Math.floor(cycleTime / 2.95);
                if (beat !== lastDemo) {
                    lastDemo = beat;
                    if (state === "idle")
                        start(false);
                }
            },
            trigger() {
                ctx.interact();
                start(true);
            },
        };
    },
};
// ── 11 · Bell Toggle ───────────────────────────────────────────────────────────────────────────
// Sculpted notification tile: exuberant ±28° pendulum swing, lagging clapper, buoyant bouncing
// badge, and near-critical badge dismissal on mute.
export const bellToggle = {
    slug: "bell-toggle",
    name: "Bell Toggle",
    material: "taut",
    hint: "Click to ring and mute",
    mount(ctx) {
        const svg = createStageSvg();
        const CX = 100;
        const CY = 56;
        const tile = svgEl("rect", {
            x: CX - 30,
            y: CY - 30,
            width: 60,
            height: 60,
            rx: 17,
            fill: "var(--m-well)",
            stroke: "var(--m-border-strong)",
            "stroke-width": 1.1,
        });
        const bellG = svgEl("g");
        const clapper = svgEl("circle", { cx: 0, cy: 23.5, r: 2.8, fill: "var(--m-ink)" });
        const bellBody = svgEl("path", {
            d: "M0 0 C-7.5 0 -10.5 5.5 -10.5 12 C-10.5 16.5 -12.8 19 -14 20.5 H14 C12.8 19 10.5 16.5 10.5 12 C10.5 5.5 7.5 0 0 0 Z",
            fill: "none",
            stroke: "var(--m-ink)",
            "stroke-width": 2.1,
            "stroke-linejoin": "round",
        });
        const crown = svgEl("line", {
            x1: 0,
            y1: -3,
            x2: 0,
            y2: 0,
            stroke: "var(--m-ink)",
            "stroke-width": 2.1,
            "stroke-linecap": "round",
        });
        bellG.append(clapper, bellBody, crown);
        const slashBg = svgEl("line", {
            x1: CX - 16,
            y1: CY - 15,
            x2: CX + 16,
            y2: CY + 17,
            stroke: "var(--m-well)",
            "stroke-width": 5,
            "stroke-linecap": "round",
            "stroke-dasharray": 48,
            "stroke-dashoffset": 48,
        });
        const slashFg = svgEl("line", {
            x1: CX - 16,
            y1: CY - 15,
            x2: CX + 16,
            y2: CY + 17,
            stroke: "var(--m-soft)",
            "stroke-width": 2,
            "stroke-linecap": "round",
            "stroke-dasharray": 48,
            "stroke-dashoffset": 48,
        });
        const badgeG = svgEl("g");
        const badgeDot = svgEl("circle", { cx: 0, cy: 0, r: 10, fill: "var(--m-ink)" });
        const badgeNum = svgEl("text", {
            x: 0,
            y: 0.5,
            "text-anchor": "middle",
            "dominant-baseline": "central",
            fill: "var(--m-paper)",
            "font-family": "var(--m-mono)",
            "font-size": 10.8,
            "font-weight": 600,
        });
        badgeNum.textContent = "3";
        badgeG.append(badgeDot, badgeNum);
        const status = svgEl("text", {
            x: CX,
            y: 104,
            "text-anchor": "middle",
            fill: "var(--m-soft)",
            "font-family": "var(--m-sans)",
            "font-size": 10.5,
            "font-weight": 450,
        });
        status.textContent = "Notifications on";
        svg.append(tile, bellG, slashBg, slashFg, badgeG, status);
        let on = true;
        const bellAng = new Spring(0, { omega: 26, zeta: 0.11 });
        const clapperX = new Spring(0, { omega: 20, zeta: 0.16 });
        const badgeScale = new Spring(1, { omega: 26, zeta: 0.28 });
        const badgeLift = new Spring(0, { omega: 22, zeta: 0.30 });
        const muteSpring = new Spring(0, { omega: 26, zeta: 0.72 });
        const ring = (next, fromUser) => {
            on = next;
            muteSpring.target = on ? 0 : 1;
            badgeScale.setParams(on ? { omega: 26, zeta: 0.28 } : { omega: 28, zeta: 0.92 });
            badgeScale.target = on ? 1 : 0;
            status.textContent = on ? "Notifications on" : "Notifications muted";
            if (on) {
                bellAng.setParams({ omega: 26, zeta: 0.11 });
                bellAng.impulse(760);
                clapperX.impulse(-130);
                badgeLift.impulse(-120);
                badgeScale.impulse(6.2);
                if (fromUser)
                    ctx.sound("bell", 0.9);
            }
            else {
                bellAng.setParams({ omega: 24, zeta: 0.48 });
                bellAng.impulse(-220);
                if (fromUser)
                    ctx.sound("click", 0.65);
            }
            ctx.wake();
        };
        svg.addEventListener("pointerdown", () => {
            ctx.interact();
            ring(!on, true);
        });
        const render = () => {
            const a = bellAng.x;
            const m = clamp(muteSpring.x, 0, 1);
            bellG.setAttribute("transform", `translate(${CX} ${CY - 12}) rotate(${a.toFixed(2)})`);
            bellG.setAttribute("opacity", lerp(1, 0.52, m).toFixed(3));
            clapper.setAttribute("cx", clamp(clapperX.x, -6.2, 6.2).toFixed(2));
            const dash = (48 * (1 - m)).toFixed(2);
            slashBg.setAttribute("stroke-dashoffset", dash);
            slashFg.setAttribute("stroke-dashoffset", dash);
            slashBg.setAttribute("opacity", m > 0.02 ? "1" : "0");
            slashFg.setAttribute("opacity", m > 0.02 ? "1" : "0");
            const bs = clamp(badgeScale.x, 0, 1.38);
            badgeG.setAttribute("transform", `translate(${CX + 26} ${(CY - 26 + clamp(badgeLift.x, -16, 10)).toFixed(2)}) scale(${bs.toFixed(3)})`);
            badgeG.setAttribute("opacity", bs > 0.04 ? clamp(bs * 1.4, 0, 1).toFixed(3) : "0");
        };
        let lastDemo = -1;
        render();
        return {
            el: svg,
            step(dt) {
                clapperX.target = clamp(-bellAng.v * 0.012, -5.8, 5.8);
                const a = bellAng.step(dt, 0.05, 0.25);
                const b = clapperX.step(dt);
                const c = badgeScale.step(dt);
                const d = badgeLift.step(dt);
                const e = muteSpring.step(dt);
                render();
                return a || b || c || d || e;
            },
            demo(cycleTime) {
                const beat = Math.floor(cycleTime / 1.55);
                if (beat !== lastDemo) {
                    lastDemo = beat;
                    if (beat % 4 === 3)
                        ring(false, false);
                    else
                        ring(true, false);
                }
            },
            trigger() {
                ctx.interact();
                ring(!on, true);
            },
        };
    },
};
// ── 18 · Menu Morph ────────────────────────────────────────────────────────────────────────────
// Sculpted 66×66 icon tile with bold ±18° elastic swing and bright luminance pop as its three
// strokes whip across Menu (≡) -> Arrow (→) -> Close (×).
export const menuMorph = {
    slug: "menu-morph",
    name: "Menu Morph",
    material: "taut",
    hint: "Click to cycle ≡ · → · ×",
    mount(ctx) {
        const svg = createStageSvg();
        const CX = 100;
        const CY = 70;
        const cardG = svgEl("g");
        const box = svgEl("rect", {
            x: -33,
            y: -33,
            width: 66,
            height: 66,
            rx: 18,
            fill: "var(--m-well)",
            stroke: "var(--m-border-strong)",
            "stroke-width": 1.1,
        });
        const boxHighlight = svgEl("rect", {
            x: -33,
            y: -33,
            width: 66,
            height: 66,
            rx: 18,
            fill: "var(--m-ink)",
            opacity: 0,
        });
        const lines = [0, 1, 2].map(() => svgEl("line", {
            stroke: "var(--m-ink)",
            "stroke-width": 2.5,
            "stroke-linecap": "round",
        }));
        cardG.append(box, boxHighlight, ...lines);
        svg.append(cardG);
        const STATES = [
            [
                [-12.5, -8.5, 12.5, -8.5],
                [-12.5, 0, 12.5, 0],
                [-12.5, 8.5, 12.5, 8.5],
            ],
            [
                [1, -9.8, 12, 0],
                [-12, 0, 11, 0],
                [1, 9.8, 12, 0],
            ],
            [
                [-9.8, -9.8, 9.8, 9.8],
                [0, 0, 0, 0],
                [-9.8, 9.8, 9.8, -9.8],
            ],
        ];
        let state = 0;
        const springs = STATES[0].map((coords) => coords.map((v) => new Spring(v, { omega: 24, zeta: 0.42 })));
        const midOpacity = new Spring(1, { omega: 26, zeta: 0.60 });
        const tilt = new Spring(0, { omega: 20, zeta: 0.28 });
        const scale = new Spring(1, { omega: 26, zeta: 0.34 });
        const tint = new Spring(0, { omega: 18, zeta: 0.55 });
        const advance = (next, fromUser) => {
            state = next % STATES.length;
            const target = STATES[state];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 4; j++)
                    springs[i][j].target = target[i][j];
            }
            midOpacity.target = state === 2 ? 0 : 1;
            tint.target = state === 2 ? 0.24 : state === 1 ? 0.1 : 0;
            // Bold playful @yui540 swing & pop matching reference 17!
            tilt.target = state === 2 ? -6 : state === 1 ? 5 : 0;
            tilt.impulse(state === 1 ? 280 : state === 2 ? -320 : 250);
            scale.impulse(2.6);
            if (fromUser)
                ctx.sound("click", 0.85);
            ctx.wake();
        };
        svg.addEventListener("pointerdown", () => {
            ctx.interact();
            advance(state + 1, true);
        });
        const render = () => {
            const sc = clamp(scale.x, 0.86, 1.18);
            cardG.setAttribute("transform", `translate(${CX} ${CY}) rotate(${tilt.x.toFixed(2)}) scale(${sc.toFixed(3)})`);
            boxHighlight.setAttribute("opacity", clamp(tint.x, 0, 0.28).toFixed(3));
            for (let i = 0; i < 3; i++) {
                lines[i].setAttribute("x1", springs[i][0].x.toFixed(2));
                lines[i].setAttribute("y1", springs[i][1].x.toFixed(2));
                lines[i].setAttribute("x2", springs[i][2].x.toFixed(2));
                lines[i].setAttribute("y2", springs[i][3].x.toFixed(2));
            }
            lines[1].setAttribute("opacity", clamp(midOpacity.x, 0, 1).toFixed(3));
        };
        let lastDemo = -1;
        render();
        return {
            el: svg,
            step(dt) {
                let active = false;
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 4; j++) {
                        if (springs[i][j].step(dt))
                            active = true;
                    }
                }
                if (midOpacity.step(dt))
                    active = true;
                if (tilt.step(dt, 0.05, 0.25))
                    active = true;
                if (scale.step(dt))
                    active = true;
                if (tint.step(dt))
                    active = true;
                render();
                return active;
            },
            demo(cycleTime) {
                const beat = Math.floor(cycleTime / 1.15);
                if (beat !== lastDemo) {
                    lastDemo = beat;
                    advance(beat, false);
                }
            },
            trigger() {
                ctx.interact();
                advance(state + 1, true);
            },
        };
    },
};
// ── 20 · Checklist ─────────────────────────────────────────────────────────────────────────────
// Three tactile task rows matching reference 33: checking a row slides it crisply right with
// elastic overshoot, lifts its surface luminance, pops its checkbox, and whips a flush strike across.
export const checklist = {
    slug: "checklist",
    name: "Checklist",
    material: "taut",
    hint: "Click any row to check off",
    mount(ctx) {
        const svg = createStageSvg();
        const ITEMS = [
            { label: "Gather brief", fallbackW: 58 },
            { label: "Tune springs", fallbackW: 62 },
            { label: "Ship craft", fallbackW: 48 },
        ];
        const ROW_X = 22;
        const ROW_W = 152;
        const ROW_H = 27;
        const ys = [25, 57, 89];
        const rows = ITEMS.map((item, idx) => {
            const y = ys[idx];
            const rowG = svgEl("g", { cursor: "pointer" });
            const bg = svgEl("rect", {
                x: ROW_X,
                y,
                width: ROW_W,
                height: ROW_H,
                rx: 8,
                fill: "var(--m-well-deep)",
                stroke: "var(--m-border)",
                "stroke-width": 1,
            });
            const bgLift = svgEl("rect", {
                x: ROW_X,
                y,
                width: ROW_W,
                height: ROW_H,
                rx: 8,
                fill: "var(--m-well)",
                stroke: "var(--m-border-strong)",
                "stroke-width": 1,
                opacity: 0,
            });
            const bx = ROW_X + 15;
            const by = y + ROW_H / 2;
            const boxG = svgEl("g", { transform: `translate(${bx} ${by})` });
            const boxOutline = svgEl("rect", {
                x: -6.5,
                y: -6.5,
                width: 13,
                height: 13,
                rx: 3.5,
                fill: "none",
                stroke: "var(--m-soft)",
                "stroke-width": 1.35,
            });
            const boxFill = svgEl("rect", {
                x: -6.5,
                y: -6.5,
                width: 13,
                height: 13,
                rx: 3.5,
                fill: "var(--m-ink)",
                opacity: 0,
            });
            const check = svgEl("path", {
                d: "M-3.5 0.3 L-1 2.8 L3.8 -2.5",
                fill: "none",
                stroke: "var(--m-paper)",
                "stroke-width": 1.85,
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "stroke-dasharray": 14,
                "stroke-dashoffset": 14,
            });
            boxG.append(boxOutline, boxFill, check);
            const text = svgEl("text", {
                x: ROW_X + 30,
                y: by + 0.5,
                "dominant-baseline": "central",
                fill: "var(--m-ink)",
                "font-family": "var(--m-sans)",
                "font-size": 10.8,
                "font-weight": 470,
            });
            text.textContent = item.label;
            const strike = svgEl("line", {
                x1: ROW_X + 30,
                y1: by + 0.5,
                x2: ROW_X + 30,
                y2: by + 0.5,
                stroke: "var(--m-soft)",
                "stroke-width": 1.25,
                "stroke-linecap": "round",
                opacity: 0,
            });
            rowG.append(bg, bgLift, boxG, text, strike);
            svg.append(rowG);
            return {
                checked: false,
                prog: new Spring(0, { omega: 24, zeta: 0.46 }),
                slide: new Spring(0, { omega: 22, zeta: 0.38 }),
                pop: new Spring(1, { omega: 30, zeta: 0.28 }),
                rowG,
                bgLift,
                boxFill,
                boxG,
                check,
                text,
                strike,
                fallbackW: item.fallbackW,
                measuredW: 0,
            };
        });
        // Measure SVG text runs once after fonts settle (NEVER call getComputedTextLength inside RAF!).
        const measureLabels = () => {
            for (const r of rows) {
                if (r.text.isConnected) {
                    const w = r.text.getComputedTextLength();
                    if (w > 4)
                        r.measuredW = w + 1.5;
                }
            }
        };
        if (typeof document !== "undefined" && document.fonts) {
            void document.fonts.ready.then(() => {
                measureLabels();
                render();
            });
        }
        const setRow = (i, next, fromUser) => {
            const r = rows[i];
            if (r.checked === next)
                return;
            r.checked = next;
            r.prog.target = next ? 1 : 0;
            r.slide.target = next ? 5 : 0;
            r.pop.snap(1);
            r.pop.impulse(next ? 5.2 : -2.6);
            if (fromUser)
                ctx.sound(next ? "click" : "tick", next ? 0.9 : 0.6);
            ctx.wake();
        };
        svg.addEventListener("pointerdown", (e) => {
            ctx.interact();
            const pt = stagePoint(svg, e);
            let best = 0;
            let dist = Infinity;
            for (let i = 0; i < rows.length; i++) {
                const d = Math.abs(pt.y - (ys[i] + ROW_H / 2));
                if (d < dist) {
                    dist = d;
                    best = i;
                }
            }
            setRow(best, !rows[best].checked, true);
        });
        const render = () => {
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i];
                const p = clamp(r.prog.x, 0, 1);
                const sc = clamp(r.pop.x, 0.76, 1.32);
                const bx = ROW_X + 15;
                const by = ys[i] + ROW_H / 2;
                r.rowG.setAttribute("transform", `translate(${r.slide.x.toFixed(2)} 0)`);
                r.bgLift.setAttribute("opacity", p.toFixed(3));
                r.boxG.setAttribute("transform", `translate(${bx} ${by}) scale(${sc.toFixed(3)})`);
                r.boxFill.setAttribute("opacity", smoothstep(0, 0.42, p).toFixed(3));
                const chk = smoothstep(0.16, 0.92, p);
                r.check.setAttribute("stroke-dashoffset", (14 * (1 - chk)).toFixed(2));
                r.check.setAttribute("opacity", chk > 0.02 ? "1" : "0");
                r.text.setAttribute("opacity", lerp(0.95, 0.48, p).toFixed(3));
                if (!r.measuredW && r.text.isConnected) {
                    const w = r.text.getComputedTextLength();
                    if (w > 4)
                        r.measuredW = w + 1.5;
                }
                const lineW = r.measuredW || r.fallbackW;
                const lineT = easeOutQuart(p);
                r.strike.setAttribute("x2", (ROW_X + 30 + lineW * lineT).toFixed(2));
                r.strike.setAttribute("opacity", p > 0.02 ? "0.78" : "0");
            }
        };
        let lastStep = -1;
        render();
        return {
            el: svg,
            step(dt) {
                let active = false;
                for (const r of rows) {
                    if (r.prog.step(dt))
                        active = true;
                    if (r.slide.step(dt))
                        active = true;
                    if (r.pop.step(dt))
                        active = true;
                }
                render();
                return active;
            },
            demo(cycleTime) {
                const step = Math.floor(cycleTime / 0.65) % 8;
                if (step !== lastStep) {
                    lastStep = step;
                    if (step === 0)
                        setRow(0, true, false);
                    else if (step === 1)
                        setRow(1, true, false);
                    else if (step === 2)
                        setRow(2, true, false);
                    else if (step === 5)
                        setRow(2, false, false);
                    else if (step === 6)
                        setRow(1, false, false);
                    else if (step === 7)
                        setRow(0, false, false);
                }
            },
            trigger() {
                ctx.interact();
                const firstUnchecked = rows.findIndex((r) => !r.checked);
                if (firstUnchecked >= 0)
                    setRow(firstUnchecked, true, true);
                else
                    rows.forEach((_, i) => setRow(i, false, i === 0));
            },
        };
    },
};
