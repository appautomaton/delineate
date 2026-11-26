// Cut 24 fps cinema player: paces exact integer frames (41.667 ms), uploads Stage-1 Canvas2D
// layers into the Stage-2 multi-pass WebGL2 cinema shader (always-on optical lens, volumetric
// plasma, Cauchy glass refraction, ASCII, quadtree, bloom, halation, shutter blur), syncs the
// original 134 BPM Setloom techno score, and drives the director's timeline HUD.
//
//   ?frame=<0..431>               jump to exact 24 fps frame (auto-pauses unless ?paused=0)
//   ?t=<seconds>                  jump to timestamp in seconds
//   ?paused=1                     start paused
//   ?hud=0                        hide director's HUD for pure borderless screening
import { CutAudio } from "./audio.js";
import { FPS, SCENES, STAGE_H, STAGE_W, TOTAL_FRAMES, renderScene, sceneForFrame, } from "./scenes.js";
import { ShaderStage } from "./shader.js";
const params = new URLSearchParams(location.search);
if (params.get("hud") === "0")
    document.body.classList.add("hud-hidden");
const glCanvas = document.querySelector("[data-gl]");
const playBtn = document.querySelector('[data-toggle="play"]');
const soundBtn = document.querySelector('[data-toggle="sound"]');
const stepPrevBtn = document.querySelector('[data-step="-1"]');
const stepNextBtn = document.querySelector('[data-step="1"]');
const sceneLabel = document.querySelector("[data-scene-label]");
const frameLabel = document.querySelector("[data-frame-label]");
const timeLabel = document.querySelector("[data-time-label]");
const timeline = document.querySelector("[data-timeline]");
const playhead = document.querySelector("[data-playhead]");
// Offscreen Stage-1 1280x720 2D composer canvases:
//   stageCanvas (background / photography / 3D / shaders) + fgCanvas (razor-sharp hero type & CV HUD)
const stageCanvas = document.createElement("canvas");
stageCanvas.width = STAGE_W;
stageCanvas.height = STAGE_H;
const stageCtx = stageCanvas.getContext("2d");
const fgCanvas = document.createElement("canvas");
fgCanvas.width = STAGE_W;
fgCanvas.height = STAGE_H;
const fgCtx = fgCanvas.getContext("2d");
const shader = new ShaderStage(glCanvas);
const audio = new CutAudio();
// Load photographic assets + 10 bespoke editorial plates (with safe null fallback prior to decode)
const PLATE_IDS = [
    "s03Aurora",
    "s03Daylight",
    "s03Dusk",
    "s04Dune",
    "s04Prism",
    "s04Horizon",
    "s07Stage",
    "s07Amber",
    "s09Living",
    "s09Form",
];
const assets = {
    eye: null,
    rocket: null,
    plates: {
        s03Aurora: null,
        s03Daylight: null,
        s03Dusk: null,
        s04Dune: null,
        s04Prism: null,
        s04Horizon: null,
        s07Stage: null,
        s07Amber: null,
        s09Living: null,
        s09Form: null,
    },
};
const loadImage = (src, assign) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
        assign(img);
        dirty = true;
        schedule();
    };
    img.onerror = () => {
        // Graceful null fallback if optional plate asset is not present yet
    };
    img.src = src;
};
loadImage("cut/assets/eye.jpg", (img) => { assets.eye = img; });
loadImage("cut/assets/rocket.jpg", (img) => { assets.rocket = img; });
for (const id of PLATE_IDS) {
    loadImage(`cut/assets/plates/${id}.jpg`, (img) => {
        assets.plates[id] = img;
    });
}
// Build 10 segmented scene blocks inside the scrubbable timeline
const segEls = SCENES.map((sc) => {
    const seg = document.createElement("div");
    seg.className = "tl-seg";
    seg.style.flex = String(sc.end - sc.start);
    seg.title = `${sc.id} · ${sc.name} (F ${sc.start}–${sc.end - 1})`;
    const fill = document.createElement("div");
    fill.className = "tl-seg-fill";
    seg.append(fill);
    timeline.insertBefore(seg, playhead);
    return { sc, seg, fill };
});
// Playback & smooth always-on physical lens parallax state
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const frameParam = params.get("frame");
const timeParam = params.get("t");
let curFrame = 0;
let playing = !reduced;
if (frameParam !== null && !Number.isNaN(Number(frameParam))) {
    curFrame = ((Math.floor(Number(frameParam)) % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES;
    playing = params.get("paused") === "0";
}
else if (timeParam !== null && !Number.isNaN(Number(timeParam))) {
    curFrame = ((Math.floor(Number(timeParam) * FPS) % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES;
    playing = params.get("paused") !== "1";
}
else if (params.get("paused") === "1") {
    playing = false;
}
let soundOn = false;
let dirty = true;
let lastRenderedFrame = -1;
let accumSec = 0;
const FRAME_DT = 1 / FPS; // exact 41.6667 ms film cadence
const pointer = { nx: 0.5, ny: 0.5, active: false };
let targetNx = 0.5;
let targetNy = 0.5;
const syncButtons = () => {
    playBtn.setAttribute("aria-pressed", String(playing));
    playBtn.textContent = playing ? "Pause" : "Play";
    soundBtn.setAttribute("aria-pressed", String(soundOn));
};
syncButtons();
const togglePlay = () => {
    playing = !playing;
    audio.setPlaying(playing, curFrame / FPS);
    syncButtons();
    if (playing)
        schedule();
};
const toggleSound = () => {
    soundOn = !soundOn;
    audio.setEnabled(soundOn, curFrame / FPS, playing && !scrubbing);
    syncButtons();
};
const stepFrame = (delta) => {
    playing = false;
    curFrame = (curFrame + delta + TOTAL_FRAMES) % TOTAL_FRAMES;
    audio.seek(curFrame / FPS, false);
    dirty = true;
    syncButtons();
    schedule();
};
const updateHud = (frame) => {
    const sc = sceneForFrame(frame);
    sceneLabel.textContent = `${sc.id} · ${sc.name.toUpperCase()}`;
    frameLabel.textContent = `F ${String(frame).padStart(3, "0")} / ${TOTAL_FRAMES}`;
    const sec = frame / FPS;
    const whole = Math.floor(sec);
    const cs = Math.floor((sec - whole) * 100);
    timeLabel.textContent = `00:${String(whole).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
    const pct = frame / (TOTAL_FRAMES - 1);
    const tlW = timeline.clientWidth || 1;
    playhead.style.transform = `translate3d(${(pct * (tlW - 2)).toFixed(1)}px, 0, 0)`;
    for (const item of segEls) {
        if (frame >= item.sc.end) {
            item.seg.className = "tl-seg is-past";
            item.fill.style.width = "100%";
        }
        else if (frame >= item.sc.start) {
            item.seg.className = "tl-seg is-current";
            const localPct = ((frame - item.sc.start) / (item.sc.end - item.sc.start)) * 100;
            item.fill.style.width = `${localPct.toFixed(1)}%`;
        }
        else {
            item.seg.className = "tl-seg";
            item.fill.style.width = "0%";
        }
    }
};
const drawFrame = (frame, triggerAudio) => {
    fgCtx.clearRect(0, 0, STAGE_W, STAGE_H);
    const shaderParams = renderScene(stageCtx, fgCtx, frame, pointer, assets);
    shader.render(stageCanvas, fgCanvas, shaderParams, frame, frame / FPS, pointer.nx, pointer.ny);
    updateHud(frame);
    if (triggerAudio)
        audio.onFrame(frame);
    lastRenderedFrame = frame;
    dirty = false;
};
// Controls
playBtn.addEventListener("click", togglePlay);
stepPrevBtn.addEventListener("click", () => stepFrame(-1));
stepNextBtn.addEventListener("click", () => stepFrame(1));
soundBtn.addEventListener("click", toggleSound);
// Interactive 10-scene timeline scrubbing
let scrubbing = false;
const scrubFromEvent = (e) => {
    const r = timeline.getBoundingClientRect();
    const u = Math.max(0, Math.min(0.9999, (e.clientX - r.left) / Math.max(1, r.width)));
    curFrame = Math.floor(u * TOTAL_FRAMES);
    dirty = true;
    schedule();
};
timeline.addEventListener("pointerdown", (e) => {
    scrubbing = true;
    timeline.setPointerCapture(e.pointerId);
    audio.setPlaying(false, curFrame / FPS);
    scrubFromEvent(e);
});
timeline.addEventListener("pointermove", (e) => {
    if (scrubbing)
        scrubFromEvent(e);
});
const endScrub = (e) => {
    if (!scrubbing)
        return;
    scrubbing = false;
    if (timeline.hasPointerCapture(e.pointerId))
        timeline.releasePointerCapture(e.pointerId);
    audio.seek(curFrame / FPS, playing);
};
timeline.addEventListener("pointerup", endScrub);
timeline.addEventListener("pointercancel", endScrub);
// Always-on damped physical cinema lens pointer parallax (zero toggle button or red PTR box)
glCanvas.addEventListener("pointermove", (e) => {
    const r = glCanvas.getBoundingClientRect();
    targetNx = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
    targetNy = Math.max(0, Math.min(1, (e.clientY - r.top) / Math.max(1, r.height)));
    pointer.active = true;
    schedule();
});
glCanvas.addEventListener("pointerleave", () => {
    pointer.active = false;
    targetNx = 0.5;
    targetNy = 0.5;
    schedule();
});
glCanvas.addEventListener("click", togglePlay);
// Keyboard shortcuts: Space (play/pause), Left/Right (single frame), H (toggle HUD), M (sound)
addEventListener("keydown", (e) => {
    if (e.key === " " && document.activeElement?.tagName !== "BUTTON") {
        e.preventDefault();
        togglePlay();
    }
    else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepFrame(-1);
    }
    else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepFrame(1);
    }
    else if (e.key.toLowerCase() === "h") {
        document.body.classList.toggle("hud-hidden");
    }
    else if (e.key.toLowerCase() === "m") {
        toggleSound();
    }
});
// Exact 24 fps quantized film scheduler + 60 fps pointer damping + 0 fps paused sleep
const STEP_60_MS = 1000 / 60;
const VSYNC_SLACK_MS = 3.5;
let lastNow = performance.now();
let nextDue = 0;
let rafId = 0;
function schedule() {
    if (document.hidden || rafId)
        return;
    lastNow = performance.now();
    nextDue = 0;
    rafId = requestAnimationFrame(loop);
}
const loop = (now) => {
    rafId = 0;
    if (document.hidden)
        return;
    if (nextDue > 0 && now + VSYNC_SLACK_MS < nextDue) {
        rafId = requestAnimationFrame(loop);
        return;
    }
    nextDue = nextDue > now - STEP_60_MS ? nextDue + STEP_60_MS : now + STEP_60_MS;
    const dt = Math.min(0.1, Math.max(0, (now - lastNow) / 1000));
    lastNow = now;
    // Smooth exponential spring glide toward pointer target (or back to optical center (0.5, 0.5))
    let pointerMoving = false;
    if (!reduced) {
        const goalX = pointer.active ? targetNx : 0.5;
        const goalY = pointer.active ? targetNy : 0.5;
        const dx = goalX - pointer.nx;
        const dy = goalY - pointer.ny;
        if (Math.abs(dx) > 0.0004 || Math.abs(dy) > 0.0004) {
            pointerMoving = true;
            const damp = 1 - Math.exp(-dt * 8.5);
            pointer.nx += dx * damp;
            pointer.ny += dy * damp;
            if (!playing || scrubbing)
                dirty = true;
        }
        else if (pointer.nx !== goalX || pointer.ny !== goalY) {
            pointer.nx = goalX;
            pointer.ny = goalY;
        }
    }
    if (playing && !scrubbing) {
        accumSec += dt;
        if (accumSec + 0.003 >= FRAME_DT) {
            const steps = Math.max(1, Math.min(3, Math.floor((accumSec + 0.003) / FRAME_DT)));
            accumSec = Math.max(0, accumSec - steps * FRAME_DT);
            curFrame = (curFrame + steps) % TOTAL_FRAMES;
            dirty = true;
        }
    }
    if (dirty || curFrame !== lastRenderedFrame) {
        drawFrame(curFrame, playing && !scrubbing);
    }
    if (playing || scrubbing || pointerMoving || dirty) {
        rafId = requestAnimationFrame(loop);
    }
};
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
        audio.setPlaying(false, curFrame / FPS);
    }
    else {
        if (playing)
            audio.seek(curFrame / FPS, true);
        schedule();
    }
});
if (document.fonts) {
    void Promise.all([
        document.fonts.load('500 48px "Switzer"'),
        document.fonts.load('700 48px "Switzer"'),
        document.fonts.load('400 48px "Zodiak"'),
        document.fonts.load('500 12px "Geist Mono"'),
    ])
        .then(() => document.fonts.ready)
        .then(() => {
        dirty = true;
        schedule();
    });
}
drawFrame(curFrame, false);
schedule();
