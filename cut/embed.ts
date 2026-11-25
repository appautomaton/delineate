// Lazy, zero-idle-cost inline screening player for delineate's landing page.
// Never imported or initialized until the visitor explicitly clicks Play on Cut's static poster.
// Unlocks 134 BPM Setloom Warehouse Techno on the opening click gesture, pauses automatically when
// scrolled out of view, and releases WebGL2 + Web Audio cleanly when closed back to the poster.

import { CutAudio } from "./audio.ts";
import {
  FPS,
  STAGE_H,
  STAGE_W,
  TOTAL_FRAMES,
  renderScene,
  type CutAssets,
  type PlateId,
  type PointerState,
} from "./scenes.ts";
import { ShaderStage } from "./shader.ts";

export type EmbedOptions = {
  assetRoot?: string;
  fullUrl?: string;
  audioCtx?: AudioContext | null;
  onClose?: () => void;
};

const PLATE_IDS: readonly PlateId[] = [
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

let fontsInjected = false;
function ensureCutFonts(onReady: () => void): void {
  if (!fontsInjected) {
    fontsInjected = true;
    const hrefs = [
      "https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&f[]=zodiak@400,500&display=swap",
      "https://cdn.jsdelivr.net/npm/@fontsource/geist-mono@5/400.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/geist-mono@5/500.css",
    ];
    for (const href of hrefs) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.append(link);
    }
  }
  if (document.fonts) {
    void Promise.all([
      document.fonts.load('500 48px "Switzer"'),
      document.fonts.load('700 48px "Switzer"'),
      document.fonts.load('400 48px "Zodiak"'),
      document.fonts.load('500 12px "Geist Mono"'),
    ])
      .then(() => document.fonts.ready)
      .then(onReady)
      .catch(() => {});
  }
}

export function mountCutEmbed(host: HTMLElement, opts: EmbedOptions = {}): () => void {
  const assetRoot = opts.assetRoot ?? "cut/cut/assets/";
  const fullUrl = opts.fullUrl ?? "cut/";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const root = document.createElement("div");
  root.className = "cut-embed";

  const glCanvas = document.createElement("canvas");
  glCanvas.className = "cut-embed-canvas";
  glCanvas.width = STAGE_W;
  glCanvas.height = STAGE_H;

  const bar = document.createElement("div");
  bar.className = "cut-embed-bar";

  const playBtn = document.createElement("button");
  playBtn.type = "button";
  playBtn.className = "cut-embed-btn";
  playBtn.textContent = "Pause";

  const soundBtn = document.createElement("button");
  soundBtn.type = "button";
  soundBtn.className = "cut-embed-btn";
  soundBtn.textContent = "Sound";

  const timeEl = document.createElement("span");
  timeEl.className = "cut-embed-time";
  timeEl.textContent = "00:00 / 00:18";

  const fullLink = document.createElement("a");
  fullLink.className = "cut-embed-btn";
  fullLink.href = fullUrl;
  fullLink.textContent = "Full ↗";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "cut-embed-btn cut-embed-close";
  closeBtn.setAttribute("aria-label", "Close screening");
  closeBtn.textContent = "×";

  const progTrack = document.createElement("div");
  progTrack.className = "cut-embed-progress";
  const progFill = document.createElement("div");
  progFill.className = "cut-embed-progress-fill";
  progTrack.append(progFill);

  const leftGrp = document.createElement("div");
  leftGrp.className = "cut-embed-grp";
  leftGrp.append(playBtn, soundBtn, timeEl);

  const rightGrp = document.createElement("div");
  rightGrp.className = "cut-embed-grp";
  rightGrp.append(fullLink, closeBtn);

  bar.append(leftGrp, rightGrp);
  root.append(glCanvas, progTrack, bar);
  host.append(root);

  const stageCanvas = document.createElement("canvas");
  stageCanvas.width = STAGE_W;
  stageCanvas.height = STAGE_H;
  const stageCtx = stageCanvas.getContext("2d")!;

  const fgCanvas = document.createElement("canvas");
  fgCanvas.width = STAGE_W;
  fgCanvas.height = STAGE_H;
  const fgCtx = fgCanvas.getContext("2d")!;

  const shader = new ShaderStage(glCanvas);
  const audio = new CutAudio(`${assetRoot}audio/score.m4a`, opts.audioCtx);

  const assets: CutAssets = {
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

  let curFrame = 0;
  let playing = !reduced;
  let userPaused = reduced;
  let inView = true;
  let soundOn = !reduced;
  let dirty = true;
  let lastRenderedFrame = -1;
  let accumSec = 0;
  let disposed = false;
  const FRAME_DT = 1 / FPS;

  const pointer: PointerState = { nx: 0.5, ny: 0.5, active: false };
  let targetNx = 0.5;
  let targetNy = 0.5;
  let lastNow = performance.now();
  let rafId = 0;

  const loadImage = (src: string, assign: (img: HTMLImageElement) => void) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (disposed) return;
      assign(img);
      dirty = true;
    };
    img.src = src;
  };
  loadImage(`${assetRoot}eye.jpg`, (img) => { assets.eye = img; });
  loadImage(`${assetRoot}rocket.jpg`, (img) => { assets.rocket = img; });
  for (const id of PLATE_IDS) {
    loadImage(`${assetRoot}plates/${id}.jpg`, (img) => { assets.plates[id] = img; });
  }
  ensureCutFonts(() => {
    if (!disposed) dirty = true;
  });

  const syncUi = () => {
    playBtn.textContent = playing ? "Pause" : "Play";
    soundBtn.setAttribute("aria-pressed", String(soundOn));
    soundBtn.textContent = soundOn ? "Sound" : "Muted";
    root.classList.toggle("is-paused", !playing);
  };

  const drawFrame = (frame: number, triggerAudio: boolean) => {
    fgCtx.clearRect(0, 0, STAGE_W, STAGE_H);
    const shaderParams = renderScene(stageCtx, fgCtx, frame, pointer, assets);
    shader.render(stageCanvas, fgCanvas, shaderParams, frame, frame / FPS, pointer.nx, pointer.ny);
    const sec = Math.floor(frame / FPS);
    timeEl.textContent = `00:${String(sec).padStart(2, "0")} / 00:18`;
    progFill.style.transform = `scaleX(${(frame / (TOTAL_FRAMES - 1)).toFixed(4)})`;
    if (triggerAudio) audio.onFrame(frame);
    lastRenderedFrame = frame;
    dirty = false;
  };

  const togglePlay = () => {
    playing = !playing;
    userPaused = !playing;
    audio.setPlaying(playing, curFrame / FPS);
    syncUi();
  };

  const toggleSound = () => {
    soundOn = !soundOn;
    audio.setEnabled(soundOn, curFrame / FPS, playing);
    syncUi();
  };

  const onMove = (e: PointerEvent) => {
    const r = glCanvas.getBoundingClientRect();
    targetNx = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
    targetNy = Math.max(0, Math.min(1, (e.clientY - r.top) / Math.max(1, r.height)));
    pointer.active = true;
  };
  const onLeave = () => {
    targetNx = 0.5;
    targetNy = 0.5;
    pointer.active = false;
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  const onVis = () => {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      audio.setPlaying(false, curFrame / FPS);
    } else if (!disposed && !rafId) {
      lastNow = performance.now();
      if (playing && inView) audio.seek(curFrame / FPS, true);
      rafId = requestAnimationFrame(loop);
    }
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) {
        if (playing) {
          playing = false;
          audio.setPlaying(false, curFrame / FPS);
          syncUi();
        }
      } else if (!userPaused && !playing) {
        playing = true;
        lastNow = performance.now();
        audio.seek(curFrame / FPS, true);
        syncUi();
      }
    },
    { threshold: 0.12 },
  );
  io.observe(host);

  playBtn.addEventListener("click", (e) => { e.stopPropagation(); togglePlay(); });
  soundBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleSound(); });
  closeBtn.addEventListener("click", (e) => { e.stopPropagation(); close(); });
  glCanvas.addEventListener("click", togglePlay);
  glCanvas.addEventListener("pointermove", onMove);
  glCanvas.addEventListener("pointerleave", onLeave);
  addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onVis);

  const loop = (now: number) => {
    rafId = 0;
    if (disposed || document.hidden) return;
    const dt = Math.min(0.1, Math.max(0, (now - lastNow) / 1000));
    lastNow = now;

    const damp = 1 - Math.exp(-dt * 8.5);
    const dx = targetNx - pointer.nx;
    const dy = targetNy - pointer.ny;
    if (Math.abs(dx) > 0.0004 || Math.abs(dy) > 0.0004) {
      pointer.nx += dx * damp;
      pointer.ny += dy * damp;
      dirty = true;
    }

    if (playing && inView) {
      accumSec += dt;
      if (accumSec >= FRAME_DT) {
        const steps = Math.min(3, Math.floor(accumSec / FRAME_DT));
        accumSec -= steps * FRAME_DT;
        curFrame = (curFrame + steps) % TOTAL_FRAMES;
        dirty = true;
      }
    }

    if (dirty || curFrame !== lastRenderedFrame) {
      drawFrame(curFrame, playing && inView);
    }

    rafId = requestAnimationFrame(loop);
  };

  function close(): void {
    if (disposed) return;
    disposed = true;
    if (rafId) cancelAnimationFrame(rafId);
    io.disconnect();
    removeEventListener("keydown", onKey);
    document.removeEventListener("visibilitychange", onVis);
    audio.dispose();
    shader.dispose();
    root.remove();
    opts.onClose?.();
  }

  syncUi();
  if (soundOn) audio.setEnabled(true, 0, playing);
  drawFrame(0, false);
  rafId = requestAnimationFrame(loop);

  return close;
}
