// The time hands keep: seconds that run at a rate of their own, so a scene can be slowed to study a movement or
// paused, and every hand waits on the same clock. A clock can also sleep: it asks for no frames at all, and wakes
// where it left off, so a scene nobody can see costs nothing.

export class Clock {
  // Seconds since the clock started, at its own rate.
  now = 0;
  rate = 1;
  paused = false;
  #waits: { at: number; done: () => void }[] = [];
  #frames = new Set<(now: number) => void>();
  #asleep = false;
  #last = performance.now();

  constructor() {
    requestAnimationFrame(this.#tick);
  }

  #tick = (ms: number) => {
    if (this.#asleep) return;
    // A frame after the tab was hidden counts as one frame, not the whole absence.
    const dt = Math.min((ms - this.#last) / 1000, 1 / 20);
    this.#last = ms;
    if (!this.paused) this.#advance(dt * this.rate);
    for (const frame of this.#frames) frame(this.now);
    requestAnimationFrame(this.#tick);
  };

  // Stops asking for frames; time stands still until the clock wakes.
  sleep(): void {
    this.#asleep = true;
  }

  wake(): void {
    if (!this.#asleep) return;
    this.#asleep = false;
    this.#last = performance.now();
    requestAnimationFrame(this.#tick);
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
