// Opt-in studio audio engine for Cut's 24 fps timeline (18.000 s loop).
// Plays Cut's bespoke 134.000 BPM Original Setloom Warehouse Techno master (cut/assets/audio/score.m4a),
// drift-locked to the quantized 24 fps film clock across Play, Pause, Scrub, and Frame-Step.
// Zero sound plays until the viewer explicitly clicks Sound or presses M.
const DEFAULT_SCORE_URL = "cut/assets/audio/score.m4a";
const FILM_DUR_SEC = 18.0;
export class CutAudio {
    scoreUrl;
    ctx = null;
    master = null;
    trackGain = null;
    buffer = null;
    loading = null;
    srcNode = null;
    srcStartCtxTime = 0;
    srcStartOffset = 0;
    enabled = false;
    playing = true;
    currentSec = 0;
    constructor(scoreUrl = DEFAULT_SCORE_URL, externalCtx) {
        this.scoreUrl = scoreUrl;
        if (externalCtx) {
            this.attachContext(externalCtx);
        }
    }
    dispose() {
        this.enabled = false;
        this.playing = false;
        this.stopSource(false);
        const ctx = this.ctx;
        this.ctx = null;
        this.master = null;
        this.trackGain = null;
        if (ctx && ctx.state !== "closed") {
            void ctx.close().catch(() => { });
        }
    }
    setEnabled(on, timeSec, isPlaying) {
        this.enabled = on;
        this.playing = isPlaying;
        this.currentSec = this.wrapSec(timeSec);
        if (!on) {
            this.stopSource(true);
            if (this.ctx && this.ctx.state === "running")
                void this.ctx.suspend();
            return;
        }
        const ctx = this.ensure();
        if (!ctx)
            return;
        const loadP = this.ensureLoaded();
        const run = async () => {
            try {
                if (ctx.state === "suspended")
                    await ctx.resume();
            }
            catch {
                return;
            }
            if (!this.enabled || this.ctx !== ctx)
                return;
            await loadP;
            if (this.enabled && this.playing && this.ctx === ctx && ctx.state === "running") {
                this.startSource(this.currentSec);
            }
        };
        void run();
    }
    setPlaying(isPlaying, timeSec) {
        this.playing = isPlaying;
        this.currentSec = this.wrapSec(timeSec);
        if (!this.enabled)
            return;
        if (!isPlaying) {
            this.stopSource(true);
        }
        else if (this.ctx) {
            if (this.ctx.state === "suspended") {
                void this.resumeAndStart();
            }
            else {
                void this.ensureLoaded().then(() => {
                    if (this.enabled && this.playing) {
                        this.startSource(this.currentSec);
                    }
                });
            }
        }
    }
    async resumeAndStart() {
        const ctx = this.ctx;
        if (!ctx)
            return;
        const loadP = this.ensureLoaded();
        try {
            await ctx.resume();
        }
        catch {
            return;
        }
        await loadP;
        if (this.enabled && this.playing && this.ctx === ctx && ctx.state === "running") {
            this.startSource(this.currentSec);
        }
    }
    /** Re-anchors audio immediately when the user scrubs, steps, or jumps on the timeline. */
    seek(timeSec, isPlaying) {
        this.currentSec = this.wrapSec(timeSec);
        this.playing = isPlaying;
        if (!this.enabled)
            return;
        if (isPlaying) {
            this.startSource(this.currentSec);
        }
        else {
            this.stopSource(true);
        }
    }
    wrapSec(t) {
        return ((t % FILM_DUR_SEC) + FILM_DUR_SEC) % FILM_DUR_SEC;
    }
    attachContext(ctx) {
        const master = ctx.createGain();
        master.gain.value = 0.88;
        master.connect(ctx.destination);
        const trackGain = ctx.createGain();
        trackGain.gain.value = 0.92;
        trackGain.connect(master);
        this.ctx = ctx;
        this.master = master;
        this.trackGain = trackGain;
        return ctx;
    }
    ensure() {
        if (this.ctx)
            return this.ctx;
        const AC = window.AudioContext ?? window.webkitAudioContext;
        if (!AC)
            return null;
        return this.attachContext(new AC());
    }
    ensureLoaded() {
        if (this.buffer)
            return Promise.resolve(this.buffer);
        if (this.loading)
            return this.loading;
        const ctx = this.ensure();
        if (!ctx)
            return Promise.resolve(null);
        const p = fetch(this.scoreUrl)
            .then((res) => {
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return res.arrayBuffer();
        })
            .then((ab) => ctx.decodeAudioData(ab))
            .then((decoded) => {
            this.buffer = decoded;
            return decoded;
        })
            .catch(() => null);
        this.loading = p;
        return p;
    }
    stopSource(smooth = false) {
        const node = this.srcNode;
        this.srcNode = null;
        if (!node)
            return;
        try {
            if (smooth && this.ctx && this.trackGain) {
                const now = this.ctx.currentTime;
                this.trackGain.gain.cancelScheduledValues(now);
                this.trackGain.gain.setValueAtTime(this.trackGain.gain.value, now);
                this.trackGain.gain.linearRampToValueAtTime(0.0001, now + 0.015);
                node.stop(now + 0.02);
            }
            else {
                node.stop();
            }
        }
        catch {
            // Source already stopped
        }
    }
    startSource(offsetSec) {
        const ctx = this.ctx;
        const gain = this.trackGain;
        const buf = this.buffer;
        if (!ctx || !gain || !buf)
            return;
        this.stopSource(false);
        const safeOffset = this.wrapSec(offsetSec) % Math.max(0.1, buf.duration);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.loopStart = 0;
        src.loopEnd = Math.min(FILM_DUR_SEC, buf.duration);
        src.connect(gain);
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.92, now + 0.018);
        src.start(now, safeOffset);
        this.srcNode = src;
        this.srcStartCtxTime = now;
        this.srcStartOffset = safeOffset;
    }
    /** Called every quantized 24 fps frame to keep the score drift-locked to the film clock. */
    onFrame(frame) {
        this.currentSec = this.wrapSec(frame / 24);
        if (!this.enabled || !this.ctx || this.ctx.state !== "running" || !this.playing)
            return;
        if (!this.srcNode) {
            if (this.buffer)
                this.startSource(this.currentSec);
        }
        else {
            const audioPos = this.wrapSec(this.srcStartOffset + (this.ctx.currentTime - this.srcStartCtxTime));
            let diff = Math.abs(audioPos - this.currentSec);
            if (diff > FILM_DUR_SEC * 0.5)
                diff = FILM_DUR_SEC - diff;
            if (diff > 0.085) {
                this.startSource(this.currentSec);
            }
        }
    }
}
