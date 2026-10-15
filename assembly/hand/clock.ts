// The time hands keep: seconds that run at a rate of their own, so a scene can be slowed to study a movement or
// paused, and every hand waits on the same clock.

export class Clock {
  // Seconds since the clock started, at its own rate.
  now = 0;
  rate = 1;
  paused = false;
  #waits: { at: number; done: () => void }[] = [];
  #frames = new Set<(now: number) => void>();

  constructor() {
    let last = performance.now();
    const tick = (ms: number) => {
      // A frame after the tab was hidden counts as one frame, not the whole absence.
      const dt = Math.min((ms - last) / 1000, 1 / 20);
      last = ms;
      if (!this.paused) this.#advance(dt * this.rate);
      for (const frame of this.#frames) frame(this.now);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Resolves once the clock reaches `at`.
  until(at: number): Promise<void> {
    return new Promise((done) => this.#waits.push({ at, done }));
  }

  wait(secs: number): Promise<void> {
    return this.until(this.now + secs);
  }

  // Calls `frame` on every frame, after the clock has moved; returns a way to stop.
  each(frame: (now: number) => void): () => void {
    this.#frames.add(frame);
    return () => this.#frames.delete(frame);
  }

  #advance(dt: number) {
    this.now += dt;
    const due = this.#waits.filter((w) => w.at <= this.now);
    this.#waits = this.#waits.filter((w) => w.at > this.now);
    for (const w of due) w.done();
  }
}
