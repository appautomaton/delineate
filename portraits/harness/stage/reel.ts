// A short loop of a separation page: the planes come apart, hold, and settle back together while
// the drawing goes on moving. The recorder keeps the time, not the machine:
// before each frame is taken, every animation on the page is paused at that frame's moment, so the
// loop plays the same however long Chrome takes to draw a frame. The page's own transitions are
// turned off, since the recorder eases the separation itself.
//
//   node portraits/harness/stage/reel.ts <page.html> [out.mp4|.webp|.gif ...]
//
// Writes reel.mp4 beside the page unless told otherwise; the frames are taken once for every file
// asked for. The extension picks the encoding (see encode).

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { launch } from "../browser.ts";
import { type Raster, decodePng, writePng } from "../trace/image.ts";

const VIEW = { width: 1440, height: 900 }; // a laptop's screen: room for the panel, and for the stack when apart
const SCALE = 2; // drawn at twice the size and averaged down, for edges as fine as a retina screen's
const FPS = 10;
const SECONDS = 5;
// The separation over the loop, as [seconds, apart] stops eased between: rest, come apart, hold,
// settle back, rest. The loop's seam falls in the rest, where only the drawing's own motion changes.
const SEPARATION: [number, number][] = [[0, 0], [0.6, 0], [2, 1], [3, 1], [4.4, 0], [SECONDS, 0]];
// The drawing's motion does not repeat in the loop's length, so the loop's last frames dissolve
// into the motion as it stood a loop earlier, and the first frame follows on from there.
const SEAM = 0.5; // seconds of dissolve
// A blink is a moment, not a drift, and is kept whole. The loop opens just before one, so the
// figure blinks in the painting before it comes apart, and the seam falls between blinks; and in
// the dissolve, both pictures show the eyes at the frame's own moment, so no blink leaves a ghost.
const LEAD = 0.2; // seconds into the loop that the blink begins
const MOMENTS = ["blink", "lid"]; // the motions that are moments (see motion.css)

function apartAt(t: number): number {
  const n = SEPARATION.findIndex(([s]) => s > t); // t lies in [0, SECONDS), so between two stops
  const [[t0, a0], [t1, a1]] = [SEPARATION[n - 1], SEPARATION[n]];
  const x = (t - t0) / (t1 - t0);
  return a0 + ((a1 - a0) * (1 - Math.cos(Math.PI * x))) / 2;
}

// Each k × k block of pixels averaged into one.
function reduce({ width, height, data }: Raster, k: number): Raster {
  const [w, h] = [Math.floor(width / k), Math.floor(height / k)];
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 4; c++) {
        let sum = 0;
        for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) sum += data[((y * k + j) * width + x * k + i) * 4 + c];
        out[(y * w + x) * 4 + c] = Math.round(sum / (k * k));
      }
  return { width: w, height: h, data: out };
}

function mix(a: Raster, b: Raster, w: number): Raster {
  return { ...a, data: a.data.map((v, i) => Math.round(v + (b.data[i] - v) * w)) };
}

// For the hillside's loop, from the same frames: MP4 1.7 MB and all but indistinguishable from
// them; WebP 5.7 MB; GIF 8.1 MB, dithered to 256 colors. MP4 is a video, though, and loops only
// where its player is told to (<video autoplay loop muted playsinline>); where only an image will
// do, WebP.
type FrameRun = { file: string; ms: number };

const ENCODERS: Record<string, (frames: string[], runs: FrameRun[], out: string) => [string, string[]]> = {
  ".mp4": (frames, _runs, out) => [
    "ffmpeg",
    ["-y", "-v", "error", "-framerate", `${FPS}`, "-i", join(dirname(frames[0]), "%03d.png"), "-c:v", "libx264", "-preset", "veryslow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
  ],
  // Every frame a key frame, whole in itself: a frame drawn as changes over the last keeps the
  // last's near misses, and the moving stack leaves them as smears on the dark ground. Consecutive
  // identical frames share a single key frame with their durations summed.
  ".webp": (_frames, runs, out) => [
    "img2webp",
    ["-loop", "0", "-kmax", "1", "-sharp_yuv", "-lossy", "-q", "42", "-m", "6", ...runs.flatMap(({ file, ms }) => ["-d", `${ms}`, file]), "-o", out],
  ],
  ".gif": (frames, _runs, out) => ["gifski", ["--quiet", "--fps", `${FPS}`, "--quality", "80", "--width", `${VIEW.width}`, "-o", out, ...frames]],
};

const [file, ...asked] = process.argv.slice(2);
const outs = asked.length ? asked : [join(dirname(file), "reel.mp4")];
for (const out of outs) if (!ENCODERS[extname(out)]) throw new Error(`${out}: a reel is .mp4, .webp, or .gif`);
const browser = await launch();
const dir = mkdtempSync(join(tmpdir(), "reel-"));
try {
  const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: SCALE });
  await page.goto(pathToFileURL(resolve(file)).href);
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important }" });
  await page.evaluate(() => document.fonts.ready);

  const hasMotion = await page.evaluate(() => document.getAnimations().length > 0);
  // When the drawing first blinks, and how often, in seconds: where the blink's keyframes leave rest.
  const blink = await page.evaluate(() => {
    const a = document.getAnimations().find((a) => a instanceof CSSAnimation && a.animationName === "blink");
    if (!a) return null;
    const effect = a.effect as KeyframeEffect;
    const { delay, duration } = effect.getComputedTiming();
    const inner = effect.getKeyframes().map((k) => k.computedOffset).filter((o) => o > 0 && o < 1);
    return { begin: (Number(delay) + Math.min(...inner) * Number(duration)) / 1000, period: Number(duration) / 1000 };
  });
  // The motion's clock at the first frame, late enough for the dissolve to reach back from it.
  const start = blink ? blink.begin + blink.period * Math.ceil((SEAM + LEAD - blink.begin) / blink.period) - LEAD : SEAM;

  const byStep = new Map<number, Raster>();
  // The page apart by `apart`, through its own slider, with every animation paused at `moment`
  // seconds, and the moments among them at `own`.
  const shot = async (apart: number, moment: number, own = moment): Promise<Raster> => {
    const step = Math.round(apart * 100);
    if (!hasMotion && byStep.has(step)) return byStep.get(step)!;
    await page.evaluate(
      ({ step, ms, own, moments }) => {
        const slider = document.getElementById("apart") as HTMLInputElement;
        slider.value = String(step);
        slider.dispatchEvent(new Event("input"));
        for (const a of document.getAnimations()) {
          a.pause();
          a.currentTime = a instanceof CSSAnimation && moments.includes(a.animationName) ? own : ms;
        }
        return new Promise(requestAnimationFrame);
      },
      { step, ms: moment * 1000, own: own * 1000, moments: MOMENTS },
    );
    const raster = reduce(decodePng(await page.screenshot()), SCALE);
    if (!hasMotion) byStep.set(step, raster);
    return raster;
  };

  const count = Math.round(SECONDS * FPS);
  const blend = Math.round(SEAM * FPS);
  const frameMs = Math.round(1000 / FPS);
  const frames: string[] = [];
  const runs: FrameRun[] = [];
  let prevStep = -1;
  for (let i = 0; i < count; i++) {
    const t = i / FPS;
    const apart = apartAt(t);
    const step = Math.round(apart * 100);
    let frame = await shot(apart, start + t);
    const k = i - (count - blend); // frames into the dissolve
    if (k >= 0 && hasMotion) frame = mix(frame, await shot(apart, start + t - SECONDS, start + t), (k + 1) / (blend + 1));
    const file = join(dir, `${String(i).padStart(3, "0")}.png`);
    frames.push(file);
    writePng(file, frame);
    if (!hasMotion && runs.length > 0 && step === prevStep) {
      runs[runs.length - 1].ms += frameMs;
    } else {
      runs.push({ file, ms: frameMs });
      prevStep = step;
    }
  }
  if (!hasMotion && runs.length > 1 && prevStep === Math.round(apartAt(0) * 100)) {
    runs[0].ms += runs.pop()!.ms;
  }
  for (const out of outs) {
    execFileSync(...ENCODERS[extname(out)](frames, runs, out), { stdio: "pipe" });
    console.log(`${out}: ${count} frames at ${FPS} fps, ${VIEW.width}×${VIEW.height}, ${(statSync(out).size / 1048576).toFixed(2)} MB`);
  }
} finally {
  await browser.close();
  rmSync(dir, { recursive: true, force: true });
}
