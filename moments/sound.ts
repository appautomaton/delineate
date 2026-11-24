// Optional, opt-in Web Audio tactile micro-feedback synthesized procedurally per material.
// Layers short filtered noise transients with resonant body oscillators through a gentle master
// compressor so clicks, thumps, plucks, and droplets read crisply on laptop speakers without clipping.

export type SoundCue = "click" | "tick" | "thump" | "pluck" | "bell" | "drop" | "confirm";

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private enabled = false;
  private lastAt = 0;

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(on: boolean, announce = false): void {
    this.enabled = on;
    if (on) {
      this.ensure();
      if (announce) this.play("confirm", 0.85);
    }
  }

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 18;
      comp.ratio.value = 6;
      const master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(comp).connect(ctx.destination);

      // Reusable 60 ms white-noise buffer for crisp mechanical switch / ratchet transients.
      const len = Math.floor(ctx.sampleRate * 0.06);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.25));

      this.ctx = ctx;
      this.master = master;
      this.noiseBuf = buf;
    }
    return this.ctx;
  }

  play(cue: SoundCue, intensity = 1): void {
    if (!this.enabled) return;
    const nowMs = performance.now();
    if (nowMs - this.lastAt < 22) return;
    this.lastAt = nowMs;

    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const amp = Math.min(1, Math.max(0.25, intensity));

    // Never silently drop sounds while AudioContext resumes asynchronously on first user gesture!
    if (ctx.state === "suspended") {
      void ctx.resume().then(() => {
        if (this.enabled && ctx.state === "running") this.trigger(ctx, cue, amp);
      });
      return;
    }
    if (ctx.state === "running") {
      this.trigger(ctx, cue, amp);
    }
  }

  private burst(ctx: AudioContext, freq: number, q: number, dur: number, gain: number): void {
    if (!this.noiseBuf || !this.master) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(freq, t);
    bp.Q.setValueAtTime(q, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.005);
  }

  private trigger(ctx: AudioContext, cue: SoundCue, amp: number): void {
    if (!this.master) return;
    const t = ctx.currentTime;

    switch (cue) {
      case "tick": {
        this.burst(ctx, 3200, 2.2, 0.016, 0.34 * amp);
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1850, t);
        osc.frequency.exponentialRampToValueAtTime(480, t + 0.018);
        g.gain.setValueAtTime(0.18 * amp, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
        osc.connect(g).connect(this.master);
        osc.start(t);
        osc.stop(t + 0.025);
        break;
      }
      case "click": {
        this.burst(ctx, 2100, 1.5, 0.022, 0.38 * amp);
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(760, t);
        osc.frequency.exponentialRampToValueAtTime(195, t + 0.036);
        g.gain.setValueAtTime(0.24 * amp, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.042);
        osc.connect(g).connect(this.master);
        osc.start(t);
        osc.stop(t + 0.046);
        break;
      }
      case "thump": {
        this.burst(ctx, 680, 1.2, 0.024, 0.16 * amp);
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(185, t);
        osc.frequency.exponentialRampToValueAtTime(56, t + 0.095);
        g.gain.setValueAtTime(0.32 * amp, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
        osc.connect(g).connect(this.master);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      }
      case "pluck": {
        this.burst(ctx, 1600, 2.0, 0.015, 0.14 * amp);
        const base = 277.18 * (0.92 + 0.16 * amp);
        for (const [mult, weight, decay] of [
          [1, 0.22, 0.36],
          [2, 0.10, 0.22],
          [3, 0.04, 0.14],
        ] as const) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(base * mult, t);
          g.gain.setValueAtTime(weight * amp, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
          osc.connect(g).connect(this.master);
          osc.start(t);
          osc.stop(t + decay + 0.02);
        }
        break;
      }
      case "bell": {
        for (const [freq, weight, decay] of [
          [1046.5, 0.18, 0.44],
          [2637.0, 0.09, 0.26],
          [3951.0, 0.035, 0.14],
        ] as const) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(weight * amp, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
          osc.connect(g).connect(this.master);
          osc.start(t);
          osc.stop(t + decay + 0.02);
        }
        break;
      }
      case "drop": {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(310, t);
        osc.frequency.exponentialRampToValueAtTime(840, t + 0.065);
        g.gain.setValueAtTime(0.22 * amp, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
        osc.connect(g).connect(this.master);
        osc.start(t);
        osc.stop(t + 0.09);
        break;
      }
      case "confirm": {
        for (const [delay, freq] of [
          [0, 523.25],
          [0.068, 783.99],
        ] as const) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t + delay);
          g.gain.setValueAtTime(0.0001, t + delay);
          g.gain.linearRampToValueAtTime(0.18 * amp, t + delay + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.2);
          osc.connect(g).connect(this.master);
          osc.start(t + delay);
          osc.stop(t + delay + 0.22);
        }
        break;
      }
    }
  }
}
