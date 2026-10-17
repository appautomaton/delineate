// A hand at a page: it reaches, presses, drags, draws and types as a person would, at the pace of a hand on show.
// What it does to the page is up to whoever directs it; the hand itself only moves and keeps time.
// Its pointer takes the shape of the tool in hand; its tag shows whose hand it is while the button is down.
//
// Positions are in the coordinates of the layer the pointer lies on: the page's, or a stage's (see space.ts). A hand keeps its own time line on
// the shared clock: each act starts where the last one ended, so the small lateness of frames never piles up.
import { typing, ORDINARY as TYPIST } from "./keys.js";
import { at, reach, span, ORDINARY as STYLE } from "./motion.js";
import { ARROW_AXIS, Pointer } from "./pointer.js";
import { Random } from "./random.js";
const minimumJerk = (u) => u * u * u * (10 - 15 * u + 6 * u * u);
export class Hand {
    name;
    colour;
    pointer;
    random;
    clock;
    pos;
    // The tool in hand, which sets the pointer's shape.
    tool = "arrow";
    #style;
    #typist;
    #t;
    #course = null;
    // While the hand flies free, the way it is heading, in degrees; null while it works.
    #heading = null;
    #turn = 0;
    #presses = 0;
    constructor(clock, layer, o) {
        this.clock = clock;
        this.name = o.name;
        this.colour = o.colour;
        this.random = new Random(o.seed);
        this.pointer = new Pointer(layer, o.colour, o.name, this.random.uniform(-3.5, 2.5));
        this.#style = o.style ?? STYLE;
        this.#typist = o.typist ?? TYPIST;
        this.pos = o.start;
        this.#t = clock.now;
        clock.each((now) => this.#frame(now));
    }
    // Where the next act starts: where the last one ended, or now if the hand has been idle since.
    #begin() {
        return (this.#t = Math.max(this.#t, this.clock.now));
    }
    #until(t) {
        return this.clock.until(t);
    }
    rest(secs) {
        return this.#until((this.#t = this.#begin() + secs));
    }
    // Brings the pointer onto `box`, given in whatever space the hand's layer lies in; `tempo` over 1 is slower, as
    // a drag is.
    reach(box, tempo = 1) {
        const style = { ...this.#style, tempo: this.#style.tempo * tempo };
        const moves = reach(this.pos, box, this.random, style);
        const start = this.#begin();
        this.#heading = null;
        this.#course = { start, end: start + span(moves), at: (t) => at(moves, t - start) };
        return this.#until((this.#t = this.#course.end));
    }
    // Brings the pointer onto a point, to within `r` px.
    reachPoint(p, r = 4, tempo = 1) {
        return this.reach({ x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r }, tempo);
    }
    // Follows `points` with the button down, as a pen draws, in a time that grows with the length.
    trace(points, secs) {
        const lengths = [0];
        for (let i = 1; i < points.length; i++) {
            lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
        }
        const total = lengths[lengths.length - 1] || 1;
        const dur = secs ?? this.#style.tempo * (0.18 + total / 1100);
        const start = this.#begin();
        this.#heading = null;
        this.#course = {
            start,
            end: start + dur,
            at: (t) => {
                const s = minimumJerk(Math.min(Math.max((t - start) / dur, 0), 1)) * total;
                let i = 1;
                while (i < lengths.length - 1 && lengths[i] < s)
                    i++;
                const u = (s - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
                return { x: points[i - 1].x + (points[i].x - points[i - 1].x) * u, y: points[i - 1].y + (points[i].y - points[i - 1].y) * u };
            },
        };
        return this.#until((this.#t = this.#course.end));
    }
    // Plays back points laid `dt` apart in time, as a recorded movement is played.
    follow(points, dt) {
        const start = this.#begin();
        const last = points.length - 1;
        this.#heading = null;
        this.#course = {
            start,
            end: start + dt * last,
            at: (t) => {
                const k = Math.min(Math.max((t - start) / dt, 0), last);
                const i = Math.min(Math.floor(k), Math.max(last - 1, 0));
                const j = Math.min(i + 1, last);
                const u = k - i;
                return { x: points[i].x + (points[j].x - points[i].x) * u, y: points[i].y + (points[j].y - points[i].y) * u };
            },
        };
        return this.#until((this.#t = this.#course.end));
    }
    // How far along the current course the hand is, from 0 to 1.
    get progress() {
        const c = this.#course;
        return c ? Math.min(Math.max((this.clock.now - c.start) / (c.end - c.start || 1), 0), 1) : 1;
    }
    // The moment it takes to be sure of the target, then the button goes down.
    async press() {
        await this.rest(this.random.lognormal(0.1, 0.35) * this.#style.tempo);
        this.#presses++;
        this.pointer.tagged = true;
    }
    // The button comes up; the tag lingers a moment, unless the hand presses again first.
    release() {
        const n = this.#presses;
        this.clock.until(this.#t + 0.6).then(() => {
            if (this.#presses === n)
                this.pointer.tagged = false;
        });
    }
    // Presses and lets go where the pointer is. The click selects, as in a design tool: the page never hears it,
    // so a hand at work never follows a link or presses a button.
    async click() {
        await this.press();
        await this.rest(this.random.lognormal(0.085, 0.2));
        this.release();
    }
    // Presses here, carries the pointer to `to`, and lets go.
    async drag(to, r = 3) {
        await this.press();
        await this.reachPoint(to, r, 1.2);
        await this.rest(this.random.lognormal(0.05, 0.3));
        this.release();
    }
    // Types `text` key by key, telling `write` what the box holds after each key; `rush` over 1 types faster.
    async type(text, write, rush = 1) {
        for (const key of typing("", text, this.random, { ...this.#typist, pace: this.#typist.pace * rush })) {
            await this.#until((this.#t = this.#begin() + key.gap));
            write(key.text);
        }
    }
    // Sets the pointer down at `p`, flying free and heading `heading` degrees, as a flock moves it.
    fly(p, heading) {
        this.#course = null;
        this.pos = p;
        this.#heading = heading;
    }
    #frame(now) {
        if (this.#course) {
            this.pos = this.#course.at(Math.min(now, this.#course.end));
            if (now >= this.#course.end)
                this.#course = null;
        }
        // Flying, the arrow turns to point the way it goes; working, it stands upright. It turns, never snaps.
        const want = this.#heading === null ? 0 : this.#heading - ARROW_AXIS;
        const d = ((want - this.#turn + 540) % 360) - 180;
        this.#turn += d * (this.#heading === null ? 0.25 : 0.35);
        if (Math.abs(this.#turn) < 0.05 && this.#heading === null)
            this.#turn = 0;
        this.pointer.shape = this.#heading === null ? this.tool : "arrow";
        this.pointer.place(this.pos.x, this.pos.y, this.#turn);
    }
}
