// Selective-compilation WebGL2 renderer for Mesh Gradient.
// Supports both lightweight per-tile single-plate canvases (`new MeshRenderer(canvas, { plates: ["prism"] })`,
// compiling only that tile's shader and skipping Lantern's FBO unless needed) and single-context
// multi-plate rendering (`new MeshRenderer(canvas)` for the 4-window landing-page card).
// Drives dual-axis (vertical Y-axis or horizontal X-axis) 13-tap anamorphic blur for Lantern.

import { lerpOklab, STAGE_TONES } from "./palette.ts";
import { VERTEX_SHADER } from "./shaders/common.ts";
import { LANTERN_COMPOSITE_FRAGMENT, LANTERN_SCENE_FRAGMENT } from "./shaders/lantern.ts";
import { PLUME_FRAGMENT } from "./shaders/plume.ts";
import { PRISM_FRAGMENT } from "./shaders/prism.ts";
import { VEIL_FRAGMENT } from "./shaders/veil.ts";
import {
  PLATES,
  getLanternSlotRects,
  getPlumeSheetRects,
  isVerticalLantern,
  type PlateFrame,
  type PlateId,
  type RendererOptions,
  type V3,
  type Viewport,
} from "./types.ts";

export type { RendererOptions };

type ProgramEntry = {
  program: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null>;
};

const COMMON_UNIFORMS = [
  "uResCss",
  "uDpr",
  "uTime",
  "uNight",
  "uColors",
  "uGround",
  "uPointer",
  "uHover",
  "uFrom",
  "uTo",
  "uMorph",
  "uMotion",
  "uCompact",
  "uCornerRadius",
  "uPaletteIndex",
] as const;

function compileProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string,
  uniformNames: readonly string[],
): ProgramEntry {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vs || !fs || !program) throw new Error("Failed to allocate WebGL2 shader resources");

  gl.shaderSource(vs, vertSrc);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(vs) ?? "vertex shader failed";
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteProgram(program);
    throw new Error(`Mesh vertex shader error: ${log}`);
  }

  gl.shaderSource(fs, fragSrc);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(fs) ?? "fragment shader failed";
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteProgram(program);
    throw new Error(`Mesh fragment shader error: ${log}`);
  }

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "program link failed";
    gl.deleteProgram(program);
    throw new Error(`Mesh link error: ${log}`);
  }

  const u: Record<string, WebGLUniformLocation | null> = {};
  for (const name of uniformNames) {
    u[name] = gl.getUniformLocation(program, name);
  }
  return { program, u };
}

export class MeshRenderer {
  readonly #gl: WebGL2RenderingContext;
  readonly #vao: WebGLVertexArrayObject;
  #veil: ProgramEntry | null = null;
  #plume: ProgramEntry | null = null;
  #prism: ProgramEntry | null = null;
  #lanternScene: ProgramEntry | null = null;
  #lanternComp: ProgramEntry | null = null;

  #fbo: WebGLFramebuffer | null = null;
  #fboTex: WebGLTexture | null = null;
  #fboW = 0;
  #fboH = 0;

  #w = 1;
  #h = 1;
  #dpr = 1;
  #destroyed = false;

  // Reusable typed arrays for zero-GC uniform uploads inside requestAnimationFrame
  readonly #colorsBuf = new Float32Array(15);
  readonly #sheetsBuf = new Float32Array(12);
  readonly #lanternRectsBuf = new Float32Array(24);
  readonly #lanternDistsBuf = new Float32Array(6);

  constructor(canvas: HTMLCanvasElement, options?: RendererOptions) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 is not available");
    this.#gl = gl;

    const vao = gl.createVertexArray();
    if (!vao) throw new Error("Failed to allocate WebGL2 VAO");
    this.#vao = vao;

    const targets = options?.plates && options.plates.length > 0 ? options.plates : PLATES;
    for (const plate of targets) {
      this.#ensureProgram(plate);
    }

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
  }

  /** Resizes the backing WebGL2 drawing buffer to CSS dimensions `w` x `h` at `dpr`. */
  resize(w: number, h: number, dpr: number): void {
    if (this.#destroyed) return;
    const safeW = Math.max(1, w);
    const safeH = Math.max(1, h);
    const safeDpr = Math.max(1, Math.min(dpr, 2));
    const pw = Math.max(1, Math.round(safeW * safeDpr));
    const ph = Math.max(1, Math.round(safeH * safeDpr));

    this.#w = safeW;
    this.#h = safeH;
    this.#dpr = safeDpr;

    const canvas = this.#gl.canvas;
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  /** Clears the entire canvas to `ground` (sRGB [0..1]). */
  clear(ground: V3): void {
    if (this.#destroyed) return;
    const gl = this.#gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(ground[0], ground[1], ground[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /**
   * Renders one optical plate into `viewport` (CSS px, top-left origin; defaults to full canvas).
   * Internally converts CSS top-left viewport coordinates to WebGL bottom-left device pixels.
   */
  drawPlate(plate: PlateId, frame: PlateFrame, viewport?: Viewport): void {
    if (this.#destroyed) return;
    const gl = this.#gl;
    const dpr = this.#dpr;
    const canvasH = gl.canvas.height;

    const vp: Viewport = viewport ?? { x: 0, y: 0, w: this.#w, h: this.#h };
    const vx0 = Math.round(vp.x * dpr);
    const vx1 = Math.round((vp.x + vp.w) * dpr);
    const vyTop = Math.round(vp.y * dpr);
    const vyBot = Math.round((vp.y + vp.h) * dpr);
    const vw = Math.max(1, vx1 - vx0);
    const vh = Math.max(1, vyBot - vyTop);
    const vy = Math.max(0, canvasH - vyBot);

    const cb = this.#colorsBuf;
    for (let i = 0; i < 5; i++) {
      const c = frame.colors[i];
      cb[i * 3] = c[0];
      cb[i * 3 + 1] = c[1];
      cb[i * 3 + 2] = c[2];
    }

    this.#ensureProgram(plate);
    gl.bindVertexArray(this.#vao);

    if (plate === "lantern") {
      this.#drawLantern(frame, vp, vx0, vy, vw, vh);
      return;
    }

    const entry =
      plate === "veil" ? this.#veil! : plate === "plume" ? this.#plume! : this.#prism!;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(vx0, vy, vw, vh);
    gl.viewport(vx0, vy, vw, vh);

    gl.useProgram(entry.program);
    this.#uploadCommon(entry.u, frame, vp);

    if (plate === "plume") {
      const matte = lerpOklab(
        STAGE_TONES.day.plumeMatte,
        STAGE_TONES.night.plumeMatte,
        frame.night,
      );
      gl.uniform3f(entry.u.uMatte, matte[0], matte[1], matte[2]);

      const sheets = getPlumeSheetRects(vp.w, vp.h);
      const sb = this.#sheetsBuf;
      const invW = 1 / Math.max(1, vp.w);
      const invH = 1 / Math.max(1, vp.h);
      for (let i = 0; i < 3; i++) {
        const s = sheets[i];
        sb[i * 4] = s.x * invW;
        sb[i * 4 + 1] = s.y * invH;
        sb[i * 4 + 2] = s.w * invW;
        sb[i * 4 + 3] = s.h * invH;
      }
      gl.uniform4fv(entry.u.uSheets, sb);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
  }

  /** Releases all compiled WebGL2 programs, optional Lantern FBO/texture, and VAO. */
  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    const gl = this.#gl;
    if (this.#veil) gl.deleteProgram(this.#veil.program);
    if (this.#plume) gl.deleteProgram(this.#plume.program);
    if (this.#prism) gl.deleteProgram(this.#prism.program);
    if (this.#lanternScene) gl.deleteProgram(this.#lanternScene.program);
    if (this.#lanternComp) gl.deleteProgram(this.#lanternComp.program);
    if (this.#fbo) gl.deleteFramebuffer(this.#fbo);
    if (this.#fboTex) gl.deleteTexture(this.#fboTex);
    gl.deleteVertexArray(this.#vao);
  }

  #ensureProgram(plate: PlateId): void {
    const gl = this.#gl;
    if (plate === "veil" && !this.#veil) {
      this.#veil = compileProgram(gl, VERTEX_SHADER, VEIL_FRAGMENT, COMMON_UNIFORMS);
    } else if (plate === "plume" && !this.#plume) {
      this.#plume = compileProgram(gl, VERTEX_SHADER, PLUME_FRAGMENT, [
        ...COMMON_UNIFORMS,
        "uMatte",
        "uSheets",
      ]);
    } else if (plate === "prism" && !this.#prism) {
      this.#prism = compileProgram(gl, VERTEX_SHADER, PRISM_FRAGMENT, COMMON_UNIFORMS);
    } else if (plate === "lantern" && !this.#lanternScene) {
      this.#lanternScene = compileProgram(gl, VERTEX_SHADER, LANTERN_SCENE_FRAGMENT, [
        ...COMMON_UNIFORMS,
        "uBg",
        "uRects",
        "uDists",
      ]);
      this.#lanternComp = compileProgram(gl, VERTEX_SHADER, LANTERN_COMPOSITE_FRAGMENT, [
        "uSceneTex",
        "uResCss",
        "uDpr",
        "uGround",
        "uMotion",
        "uVertical",
        "uCenterSpan",
        "uCenterDist",
        "uBandSpan",
        "uCornerRadius",
      ]);
      this.#initLanternFbo();
    }
  }

  #initLanternFbo(): void {
    if (this.#fbo) return;
    const gl = this.#gl;
    this.#fbo = gl.createFramebuffer();
    this.#fboTex = gl.createTexture();
    if (this.#fboTex) {
      gl.bindTexture(gl.TEXTURE_2D, this.#fboTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  #uploadCommon(
    u: Record<string, WebGLUniformLocation | null>,
    frame: PlateFrame,
    vp: Viewport,
  ): void {
    const gl = this.#gl;
    gl.uniform2f(u.uResCss, Math.max(1, vp.w), Math.max(1, vp.h));
    gl.uniform1f(u.uDpr, this.#dpr);
    gl.uniform1f(u.uTime, frame.time);
    gl.uniform1f(u.uNight, frame.night);
    gl.uniform3fv(u.uColors, this.#colorsBuf);
    gl.uniform3f(u.uGround, frame.ground[0], frame.ground[1], frame.ground[2]);
    gl.uniform2f(u.uPointer, frame.pointer[0], frame.pointer[1]);
    gl.uniform1f(u.uHover, frame.hover);
    gl.uniform1i(u.uFrom, frame.fromIndex | 0);
    gl.uniform1i(u.uTo, frame.toIndex | 0);
    gl.uniform1f(u.uMorph, frame.morph);
    gl.uniform2f(u.uMotion, frame.motion[0], frame.motion[1]);
    gl.uniform1f(u.uCompact, frame.compact);
    gl.uniform1f(u.uCornerRadius, frame.cornerRadius ?? 0);
    if (u.uPaletteIndex !== null && u.uPaletteIndex !== undefined) {
      gl.uniform1f(u.uPaletteIndex, frame.paletteIndex ?? 0);
    }
  }

  #ensureFbo(w: number, h: number): boolean {
    if (!this.#fbo || !this.#fboTex) return false;
    if (this.#fboW === w && this.#fboH === h) return true;

    const gl = this.#gl;
    gl.bindTexture(gl.TEXTURE_2D, this.#fboTex);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.#fbo);
    // Pass 1 outputs tone-mapped sRGB [0..1]; RGBA8 halves GPU memory bandwidth vs RGBA16F with zero HDR loss
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.#fboTex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    if (ok) {
      this.#fboW = w;
      this.#fboH = h;
    }
    return ok;
  }

  #drawLantern(
    frame: PlateFrame,
    vp: Viewport,
    vx0: number,
    vy: number,
    vw: number,
    vh: number,
  ): void {
    const gl = this.#gl;
    const scene = this.#lanternScene!;
    const comp = this.#lanternComp!;
    const bg = lerpOklab(STAGE_TONES.day.lanternBg, STAGE_TONES.night.lanternBg, frame.night);

    if (frame.compact >= 0.5 || !this.#ensureFbo(vw, vh)) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(vx0, vy, vw, vh);
      gl.viewport(vx0, vy, vw, vh);

      gl.useProgram(scene.program);
      this.#uploadCommon(scene.u, frame, vp);
      gl.uniform3f(scene.u.uBg, bg[0], bg[1], bg[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.SCISSOR_TEST);
      return;
    }

    const vertical = isVerticalLantern(vp.w, vp.h);
    const slots = getLanternSlotRects(frame.scroll, vp.w, vp.h);
    const invW = 1 / Math.max(1, vp.w);
    const invH = 1 / Math.max(1, vp.h);
    const rb = this.#lanternRectsBuf;
    const db = this.#lanternDistsBuf;

    let minDist = 1e9;
    let centerSpan = 0.2;
    let bandSpan = 0.35;

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const hw = s.w * 0.5;
      const hh = s.h * 0.5;
      rb[i * 4] = (s.x + hw) * invW;
      rb[i * 4 + 1] = (s.y + hh) * invH;
      rb[i * 4 + 2] = hw * invW;
      rb[i * 4 + 3] = hh * invH;
      db[i] = s.dist;

      const ad = Math.abs(s.dist);
      if (ad < minDist) {
        minDist = ad;
        centerSpan = vertical ? hh * invH : hw * invW;
      }
      bandSpan = vertical ? hw * invW + 0.085 : hh * invH + 0.048;
    }

    // Pass 1: Render crisp unblurred superellipse vessels into internal FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.#fbo);
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, vw, vh);

    gl.useProgram(scene.program);
    this.#uploadCommon(scene.u, frame, vp);
    gl.uniform3f(scene.u.uBg, bg[0], bg[1], bg[2]);
    gl.uniform4fv(scene.u.uRects, rb);
    gl.uniform1fv(scene.u.uDists, db);
    gl.uniform1f(scene.u.uCornerRadius, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 2: Composite with dual-axis 13-tap IGN-jittered 1D anamorphic motion blur (Y when vertical, X when wide)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(vx0, vy, vw, vh);
    gl.viewport(vx0, vy, vw, vh);

    gl.useProgram(comp.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.#fboTex);
    const cu = comp.u;
    gl.uniform1i(cu.uSceneTex, 0);
    gl.uniform2f(cu.uResCss, Math.max(1, vp.w), Math.max(1, vp.h));
    gl.uniform1f(cu.uDpr, this.#dpr);
    gl.uniform3f(cu.uGround, frame.ground[0], frame.ground[1], frame.ground[2]);
    gl.uniform2f(cu.uMotion, frame.motion[0], frame.motion[1]);
    gl.uniform1f(cu.uVertical, vertical ? 1 : 0);
    gl.uniform1f(cu.uCenterSpan, centerSpan);
    gl.uniform1f(cu.uCenterDist, minDist);
    gl.uniform1f(cu.uBandSpan, bandSpan);
    gl.uniform1f(cu.uCornerRadius, frame.cornerRadius ?? 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disable(gl.SCISSOR_TEST);
  }
}

export { MeshRenderer as LumenRenderer };
