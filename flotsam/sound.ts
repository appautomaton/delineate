// The water's sound, made rather than played, from what the water is doing. A slop is filtered noise whose
// loudness and pitch follow how stirred the water is, so still water is silent and a shaken window sloshes; a
// numeral thrown in gives a plop as loud as the momentum it knocks into the water: a burst of noise falling in
// pitch over a low bloop.
//
// Nothing sounds until the visitor first touches the page, as browsers ask. The button in the bar turns it off
// and on, and the choice is kept for delineate's other pages.

const KEY = "delineate-sound";
const SPLASH = 2500; // the splash (see water/bodies.ts) a plop starts from; a floating numeral's bob is far below

export class Sound {
  #ctx: AudioContext | null = null;
  #level: GainNode | null = null;
  #band: BiquadFilterNode | null = null;
  #master: GainNode | null = null;
  #on: boolean;
  #last = 0;
  #lastPlop = 0;

  constructor(button: HTMLButtonElement | null) {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    this.#on = saved !== "off";
    const show = () => {
      if (!button) return;
      button.setAttribute("aria-pressed", String(this.#on));
      button.textContent = this.#on ? "Sound on" : "Sound off";
    };
    show();
    button?.addEventListener("click", () => {
      this.#on = !this.#on;
      try {
        localStorage.setItem(KEY, this.#on ? "on" : "off");
      } catch {}
      show();
      if (this.#on) this.#wake();
      this.#master?.gain.setTargetAtTime(this.#on ? 1 : 0, this.#ctx!.currentTime, 0.05);
    });
    addEventListener("pointerdown", () => this.#wake(), { once: true });
    addEventListener("keydown", () => this.#wake(), { once: true });
  }

  // What the water is doing now: its mean speed (px/s), the splash of the last tick, and its interaction radius.
  hear(stir: number, splash: number, h: number): void {
    const ctx = this.#ctx;
    if (!ctx || !this.#level || !this.#band) return;
    const t = ctx.currentTime;
    // A slop as loud as the water is stirred beyond its rest, and brighter the harder.
    const level = Math.min(1, Math.max(0, (stir - h * 0.6) / (h * 14))) ** 0.7;
    this.#level.gain.setTargetAtTime(level * 0.2, t, 0.08);
    this.#band.frequency.setTargetAtTime(320 + 900 * level, t, 0.1);
    // A plop where a splash rises sharply past the threshold, no more than one in a tenth of a second.
    if (splash > SPLASH && splash > this.#last * 1.8 && t - this.#lastPlop > 0.1) {
      this.#plop(Math.min(1, Math.log10(splash / SPLASH) / 1.2 + 0.25));
      this.#lastPlop = t;
    }
    this.#last = splash;
  }

  #wake(): void {
    if (!this.#on || this.#ctx) return;
    const ctx = (this.#ctx = new AudioContext());
    this.#master = new GainNode(ctx, { gain: 1 });
    this.#master.connect(ctx.destination);
    const source = new AudioBufferSourceNode(ctx, { buffer: noise(ctx, 2, true), loop: true });
    this.#band = new BiquadFilterNode(ctx, { type: "bandpass", frequency: 400, Q: 0.7 });
    const soft = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 1800 });
    this.#level = new GainNode(ctx, { gain: 0 });
    source.connect(this.#band).connect(soft).connect(this.#level).connect(this.#master);
    source.start();
  }

  // A plop, `loud` from 0 to 1.
  #plop(loud: number): void {
    const ctx = this.#ctx!, t = ctx.currentTime;
    const burst = new AudioBufferSourceNode(ctx, { buffer: noise(ctx, 0.4, false) });
    const band = new BiquadFilterNode(ctx, { type: "bandpass", Q: 1.4, frequency: 1400 });
    band.frequency.setValueAtTime(1400, t);
    band.frequency.exponentialRampToValueAtTime(260, t + 0.32);
    const env = new GainNode(ctx, { gain: 0 });
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.5 * loud, t + 0.006);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    burst.connect(band).connect(env).connect(this.#master!);
    burst.start(t);
    const bloop = new OscillatorNode(ctx, { type: "sine", frequency: 240 });
    bloop.frequency.setValueAtTime(240, t);
    bloop.frequency.exponentialRampToValueAtTime(75, t + 0.2);
    const benv = new GainNode(ctx, { gain: 0 });
    benv.gain.setValueAtTime(0, t);
    benv.gain.linearRampToValueAtTime(0.35 * loud, t + 0.01);
    benv.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    bloop.connect(benv).connect(this.#master!);
    bloop.start(t);
    bloop.stop(t + 0.26);
  }
}

// Noise `secs` long: brown (soft, low, like moving water) or white (for a burst).
function noise(ctx: AudioContext, secs: number, brown: boolean): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * secs), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0, peak = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = brown ? (last + 0.02 * white) / 1.02 : white;
    data[i] = last;
    peak = Math.max(peak, Math.abs(last));
  }
  for (let i = 0; i < data.length; i++) data[i] /= peak || 1;
  return buffer;
}
