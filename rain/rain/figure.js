// The figure: one of two people (body.ts) under an umbrella, cut out of the sky as shape alone, with no line
// drawn anywhere, and dots of light flowing over them the way the form runs: around the arms, down the coat,
// across the storm flap and the belt, in rings about the umbrella's crown. It stands in a 1000 by 1000 page
// and is painted on the canvas behind the near rain. The umbrella turns about the hand that holds it, so it
// can sway, and so the rain can find its canopy wherever it leans; when one person becomes the other, the
// hand and the umbrella go with them.
import { BODIES, pose, REST, shape } from "./body.js";
export { bodyNamed, BODIES } from "./body.js";
export const GROUND = 888; // where the feet stand
export const TILT = -12; // degrees the umbrella leans, its left side down
const SHAFT = 250; // grip to the canopy's crown, before a person's reach lifts it
const RADIUS = 235; // the canopy's half-width
const SAG = 104; // how far below the crown its rim hangs
const RIM = -SHAFT + SAG; // the rim's height, under the hand
const SCALLOP = 12; // how far the cloth rises between two ribs
const RIBS = 6; // ribs seen along the near rim, rim to rim
/** In rings about a centre, flattened by `squash` as a ring seen from the side is. */
const ring = (c, squash = 1) => (x, y) => {
    const dx = x - c[0], dy = (y - c[1]) / squash, l = Math.hypot(dx, dy) || 1;
    return [-dy / l, (dx / l) * squash];
};
/**
 * The canopy's top as t runs from -1 (one rim) over the crown to 1 (the other), unturned: half a circle's arc
 * and half a parabola, so the crown is full and the cloth falls steeply to the rim.
 */
const top = (t) => {
    const arc = (1 - Math.sqrt(1 - 0.92 * t * t)) / (1 - Math.sqrt(0.08));
    return [RADIUS * t, -SHAFT + SAG * (0.5 * arc + 0.5 * t * t)];
};
// The canopy: its top from the left rim over the crown to the right, then the rim back from the right, seen
// nearly edge on, the ribs' tips spaced as round a circle and the cloth rising between them.
const CANOPY = {
    path: (() => {
        const p = new Path2D(), [x0, y0] = top(-1);
        p.moveTo(x0, y0);
        for (let i = 1; i <= 48; i++)
            p.lineTo(...top(-1 + i / 24));
        const tip = (j) => [RADIUS * Math.cos((j / RIBS) * Math.PI), RIM + 3];
        for (let k = 0; k < RIBS; k++) {
            const [a, b] = [tip(k), tip(k + 1)];
            p.quadraticCurveTo((a[0] + b[0]) / 2, RIM - SCALLOP, ...b);
        }
        p.closePath();
        return p;
    })(),
    flow: ring([0, RIM], 0.22),
};
const SPACING = 10; // between dots, about
const SPEED = 22; // page units a second a dot runs
const DASH = 1.8; // half a dot's length, along its run
/**
 * Parts, the dots running over them, and the shape that holds them, all in the parts' own frame. Where a dot
 * may be is read from the parts at rest, of each person it may stand for; the parts drawn, and the clip that
 * keeps the dots on them, follow the pose and the change from one person to the other.
 */
class Region {
    dots = [];
    parts = [];
    clip = new Path2D();
    #maps;
    #map = 0;
    #boxes;
    constructor(rests, boxes) {
        this.#boxes = boxes;
        this.#maps = rests.map((parts, i) => which(parts.map((p) => p.path), boxes[i]));
        this.take(rests[0]);
        const { x, y, w, h } = boxes[0];
        let inside = 0;
        for (let i = 0; i < 4000; i++)
            if (this.#at(x + Math.random() * w, y + Math.random() * h) >= 0)
                inside++;
        for (let n = Math.round(((inside / 4000) * w * h) / (SPACING * SPACING)); n > 0; n--)
            this.dots.push(this.#spawn(Math.random()));
    }
    /** Takes the parts as they now stand, and which person's places the dots keep to. */
    take(parts, map = 0) {
        this.parts = parts;
        this.#map = map;
        this.clip = new Path2D();
        for (const p of parts)
            this.clip.addPath(p.path);
    }
    step(dt, t) {
        this.dots.forEach((d, i) => {
            d.age += dt;
            const [fx, fy] = this.parts[d.part].flow(d.x, d.y);
            // a slow curl over the form's own run, so no two dots keep quite the same course
            const cx = Math.cos(d.y * 0.045 + t * 0.7), cy = Math.sin(d.x * 0.04 - t * 0.5);
            d.x += (fx + 0.45 * cx) * SPEED * dt;
            d.y += (fy + 0.45 * cy) * SPEED * dt;
            if (d.age >= d.life || this.#at(d.x, d.y) !== d.part)
                this.dots[i] = this.#spawn(0);
        });
    }
    /** The parts, as shape alone, and over them the dots as short dashes, brightest midway through their lives. */
    paint(c, colors) {
        c.fillStyle = colors.figure;
        c.fill(this.clip);
        const paths = [new Path2D(), new Path2D(), new Path2D()];
        for (const d of this.dots) {
            const [fx, fy] = this.parts[d.part].flow(d.x, d.y);
            const p = paths[Math.min(2, Math.floor(Math.sin((Math.PI * d.age) / d.life) * 3))];
            p.moveTo(d.x - fx * DASH, d.y - fy * DASH);
            p.lineTo(d.x + fx * DASH, d.y + fy * DASH);
        }
        c.save();
        c.clip(this.clip);
        c.strokeStyle = colors.stipple;
        c.lineWidth = 2.1;
        paths.forEach((p, i) => ((c.globalAlpha = 0.3 + 0.35 * i), c.stroke(p)));
        c.restore();
    }
    #at(x, y) {
        return this.#maps[this.#map](x, y);
    }
    #spawn(age) {
        const { x, y, w, h } = this.#boxes[this.#map];
        for (;;) {
            const px = x + Math.random() * w, py = y + Math.random() * h, part = this.#at(px, py);
            const life = 1.6 + Math.random() * 2.4;
            if (part >= 0)
                return { x: px, y: py, part, age: age * life, life };
        }
    }
}
/**
 * Which part covers a point, the topmost, or -1: read from a canvas the parts are painted on at half size,
 * each in a red of its own. Only a pixel wholly inside a part counts.
 */
function which(paths, box) {
    const k = 0.5, w = Math.ceil(box.w * k), h = Math.ceil(box.h * k);
    const c = Object.assign(document.createElement("canvas"), { width: w, height: h }).getContext("2d", { willReadFrequently: true });
    c.setTransform(k, 0, 0, k, -box.x * k, -box.y * k);
    paths.forEach((p, i) => ((c.fillStyle = `rgb(${(i + 1) * 10},0,0)`), c.fill(p)));
    const px = c.getImageData(0, 0, w, h).data;
    return (x, y) => {
        const i = Math.floor((x - box.x) * k), j = Math.floor((y - box.y) * k);
        if (i < 0 || j < 0 || i >= w || j >= h)
            return -1;
        const o = (j * w + i) * 4, r = px[o];
        return px[o + 3] === 255 && r > 0 && r % 10 === 0 ? r / 10 - 1 : -1;
    };
}
/**
 * A person under the umbrella, seen from behind, breathing and swaying, and becoming the other when asked;
 * the dots on both running on. They hold the umbrella out before them, so it is painted first and they stand
 * in front of it.
 */
export class Figure {
    #person = new Region(BODIES.map((b) => shape(b.build(REST), null, 0)), BODIES.map((b) => b.box));
    #canopy = new Region([[CANOPY]], [{ x: -RADIUS - 2, y: -SHAFT - 2, w: 2 * RADIUS + 4, h: SAG + 8 }]);
    #change = { from: BODIES[0], to: BODIES[0], f: 0 };
    #t = 0;
    step(dt, t, change) {
        this.#t = t;
        this.#change = change;
        const { from, to, f } = change, p = pose(t);
        this.#person.take(shape(from.build(p), f > 0 ? to.build(p) : null, f), BODIES.indexOf(f < 0.5 ? from : to));
        this.#person.step(dt, t);
        this.#canopy.step(dt, t);
    }
    /** The hand on the shaft and how far up it the canopy stands, at t seconds, through the change. */
    #hold(t, { from, to, f }) {
        const g = [from.grip[0] + (to.grip[0] - from.grip[0]) * f, from.grip[1] + (to.grip[1] - from.grip[1]) * f];
        return [pose(t).at(...g), from.reach + (to.reach - from.reach) * f];
    }
    /** The canopy's top in the page at t seconds, crown and both rims, the umbrella turned `tilt` degrees about the hand. */
    canopy(tilt, t) {
        const [[gx, gy], reach] = this.#hold(t, this.#change), a = (tilt * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
        const pts = [];
        for (let i = 0; i <= 24; i++) {
            const [x, y0] = top(-1 + i / 12), y = y0 - (reach - SHAFT);
            pts.push([gx + x * c - y * s, gy + x * s + y * c]);
        }
        return pts;
    }
    /** Paints the figure at `k` device pixels to the page's unit, the umbrella leaning `tilt` degrees. */
    draw(c, k, tilt, colors) {
        const [[gx, gy], reach] = this.#hold(this.#t, this.#change), a = (tilt * Math.PI) / 180;
        c.save();
        c.lineCap = "round";
        c.setTransform(k * Math.cos(a), k * Math.sin(a), -k * Math.sin(a), k * Math.cos(a), gx * k, gy * k);
        // the shaft, from the hidden hand up through the crown to its tip
        c.strokeStyle = colors.figure;
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -reach - 18);
        c.stroke();
        c.translate(0, -(reach - SHAFT));
        this.#canopy.paint(c, colors);
        c.setTransform(k, 0, 0, k, 0, 0);
        this.#person.paint(c, colors);
        c.restore();
    }
}
