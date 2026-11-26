// The time hands keep: seconds that run at a rate of their own, so a scene can be slowed to study a movement or
// paused, and every hand waits on the same clock. A clock can also sleep: it asks for no frames at all, and wakes
// where it left off, so a scene nobody can see costs nothing.
const VSYNC_SLACK_MS = 3.5;
export class Clock {
    // Seconds since the clock started, at its own rate.
    now = 0;
    rate = 1;
    fps = 60;
    paused = false;
    #waits = [];
    #frames = new Set();
    #asleep = false;
    #raf = 0;
    #last = performance.now();
    #nextDue = 0;
    constructor() {
        this.#raf = requestAnimationFrame(this.#tick);
    }
    #tick = (ms) => {
        this.#raf = 0;
        if (this.#asleep)
            return;
        const stepMs = 1000 / this.fps;
        if (this.#nextDue > 0 && ms + VSYNC_SLACK_MS < this.#nextDue) {
            this.#raf = requestAnimationFrame(this.#tick);
            return;
        }
        this.#nextDue = this.#nextDue > ms - stepMs ? this.#nextDue + stepMs : ms + stepMs;
        // A frame after the tab was hidden counts as one frame, not the whole absence.
        const dt = Math.min((ms - this.#last) / 1000, 1 / 20);
        this.#last = ms;
        if (!this.paused)
            this.#advance(dt * this.rate);
        for (const frame of this.#frames)
            frame(this.now);
        if (!this.#asleep)
            this.#raf = requestAnimationFrame(this.#tick);
    };
    // Stops asking for frames; time stands still until the clock wakes.
    sleep() {
        this.#asleep = true;
        if (this.#raf) {
            cancelAnimationFrame(this.#raf);
            this.#raf = 0;
        }
    }
    wake() {
        if (!this.#asleep)
            return;
        this.#asleep = false;
        this.#last = performance.now();
        this.#nextDue = 0;
        if (!this.#raf)
            this.#raf = requestAnimationFrame(this.#tick);
    }
    // Resolves once the clock reaches `at`.
    until(at) {
        return new Promise((done) => this.#waits.push({ at, done }));
    }
    wait(secs) {
        return this.until(this.now + secs);
    }
    // Calls `frame` on every frame, after the clock has moved; returns a way to stop.
    each(frame) {
        this.#frames.add(frame);
        return () => this.#frames.delete(frame);
    }
    #advance(dt) {
        this.now += dt;
        const due = this.#waits.filter((w) => w.at <= this.now);
        this.#waits = this.#waits.filter((w) => w.at > this.now);
        for (const w of due)
            w.done();
    }
}
