// Single-context WebGL2 3x2 Atlas Embroidery Renderer.
//
// Strict GPU efficiency contract:
//  - ONE single WebGL2RenderingContext shared across the entire 3x2 specimen grid AND modal!
//  - At startup, reuses ONE temporary 2x JFA scratch FBO set (1440x1040) to bake all 6 badges
//    into ONE compact 3x2 atlas (2160x1040 -> 25.71 MiB / 26.96 MB total VRAM, < 28 MB!),
//    then IMMEDIATELY frees all temporary JFA scratch textures & framebuffers.
//  - Renders visible cards via gl.scissor + gl.viewport with zero per-frame allocations.

import {
  ATLAS_TILE_H,
  ATLAS_TILE_W,
  BADGES,
  BAKE_H,
  BAKE_SCALE,
  BAKE_W,
  SHAPE_ID,
  WEAVE_ID,
  createBakeScratchCanvases,
  hexToLinearRgb,
  rasterizeBadgeIntoScratch,
  type BadgeAsset,
} from "./badges.ts";
import {
  FULLSCREEN_VERTEX,
  JFA_FRAGMENT,
  OPEN_JFA_FRAGMENT,
  OPEN_SEED_FRAGMENT,
  PACK_META_ATLAS_FRAGMENT,
  RENDER_FRAGMENT,
  RESOLVE_MAIN_ATLAS_FRAGMENT,
  RESOLVE_REC_ATLAS_FRAGMENT,
  SEED_FRAGMENT,
} from "./shader.ts";

export interface BadgePose {
  readonly dx: number;
  readonly dy: number;
  readonly angleRad: number;
  readonly fitZoom: number;
}

export const IDENTITY_POSE: BadgePose = {
  dx: 0,
  dy: 0,
  angleRad: 0,
  fitZoom: 1,
};

export type Vec3 = readonly [number, number, number];

export const DEFAULT_LIGHT_DIR: Vec3 = (() => {
  const x = -0.18;
  const y = 0.62;
  const z = 0.76;
  const inv = 1 / Math.hypot(x, y, z);
  return [x * inv, y * inv, z * inv] as const;
})();

export interface CardViewport {
  /** Viewport left in CSS pixels relative to canvas left. */
  x: number;
  /** Viewport top in CSS pixels relative to canvas top. */
  y: number;
  /** Viewport width in CSS pixels. */
  w: number;
  /** Viewport height in CSS pixels. */
  h: number;
}

const MAX_ATLAS_COLS = 3;
const TATAMI_RADIUS_PX = 6.5;

interface ProgramEntry {
  program: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null>;
}

interface BadgeGpuUniforms {
  shapeId: number;
  weaveId: number;
  col: number;
  row: number;
  substrateLin: readonly [number, number, number];
  substrateParam: readonly [number, number, number, number];
  tatamiAngles: readonly [number, number, number];
  merrowThread: number;
  threadLinFlat: Float32Array;
  threadOptFlat: Float32Array;
}

function compileProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string,
  uniformNames: readonly string[],
): ProgramEntry {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vs || !fs || !program) throw new Error("Failed to allocate WebGL2 shader objects");

  gl.shaderSource(vs, vertSrc);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(vs) ?? "vertex compile failed";
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteProgram(program);
    throw new Error(`Patch vertex shader error: ${log}`);
  }

  gl.shaderSource(fs, fragSrc);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(fs) ?? "fragment compile failed";
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteProgram(program);
    throw new Error(`Patch fragment shader error: ${log}`);
  }

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "program link failed";
    gl.deleteProgram(program);
    throw new Error(`Patch program link error: ${log}`);
  }

  const u: Record<string, WebGLUniformLocation | null> = {};
  for (const name of uniformNames) {
    u[name] = gl.getUniformLocation(program, name);
  }
  return { program, u };
}

function createTex(
  gl: WebGL2RenderingContext,
  internalFormat: number,
  width: number,
  height: number,
  format: number,
  type: number,
  filter: number,
  data: ArrayBufferView | null = null,
): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error("Failed to allocate WebGL2 texture");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return tex;
}

function tryCreateFbo(gl: WebGL2RenderingContext, attachments: WebGLTexture[]): WebGLFramebuffer | null {
  const fbo = gl.createFramebuffer();
  if (!fbo) return null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  const drawBuffers: number[] = [];
  for (let i = 0; i < attachments.length; i++) {
    const loc = gl.COLOR_ATTACHMENT0 + i;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, loc, gl.TEXTURE_2D, attachments[i], 0);
    drawBuffers.push(loc);
  }
  gl.drawBuffers(drawBuffers);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(fbo);
    return null;
  }
  return fbo;
}

function createFbo(gl: WebGL2RenderingContext, attachments: WebGLTexture[]): WebGLFramebuffer {
  const fbo = tryCreateFbo(gl, attachments);
  if (!fbo) throw new Error("Patch WebGL2 FBO incomplete");
  return fbo;
}

let activeContextCount = 0;

export function getActiveGlContextCount(): number {
  return activeContextCount;
}

export class PatchAtlasRenderer {
  readonly #gl: WebGL2RenderingContext;
  readonly #vao: WebGLVertexArrayObject;
  readonly #useFloatDist: boolean;
  readonly #progRender: ProgramEntry;

  // Compact 3x2 baked atlas textures (2160x1040, total 25.71 MiB / 26.96 MB < 28 MB!)
  readonly #texDistAtlas: WebGLTexture; // RG16F (4 B/px) or RGBA8 fallback (4 B/px)
  readonly #texOrientAtlas: WebGLTexture; // RGBA8 (4 B/px)
  readonly #texAuxAtlas: WebGLTexture; // RG8 (2 B/px)
  readonly #texMetaAtlas: WebGLTexture; // RG8 NEAREST (2 B/px)

  readonly #badgeUniforms: readonly BadgeGpuUniforms[];
  readonly #atlasCols: number;
  readonly #atlasRows: number;
  readonly #atlasVramBytes: number;
  readonly #bakeMs: number;

  #cssW = 1;
  #cssH = 1;
  #dpr = 1;
  #disposed = false;

  constructor(canvas: HTMLCanvasElement, badges: readonly BadgeAsset[] = BADGES) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 context unavailable");
    this.#gl = gl;
    activeContextCount++;

    const extFloat =
      gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float");
    void gl.getExtension("OES_texture_float_linear");

    const vao = gl.createVertexArray();
    if (!vao) throw new Error("Failed to allocate WebGL2 VAO");
    this.#vao = vao;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    const atlasCols = Math.min(MAX_ATLAS_COLS, Math.max(1, badges.length));
    const atlasRows = Math.max(1, Math.ceil(badges.length / atlasCols));
    const atlasW = ATLAS_TILE_W * atlasCols;
    const atlasH = ATLAS_TILE_H * atlasRows;
    this.#atlasCols = atlasCols;
    this.#atlasRows = atlasRows;

    // Precompute linear per-badge shader uniforms once
    const degToRad = Math.PI / 180;
    this.#badgeUniforms = badges.map((b, idx) => {
      const m = b.meta;
      const threadLinFlat = new Float32Array(12);
      const threadOptFlat = new Float32Array(12);
      for (let i = 0; i < 4; i++) {
        const th = m.threads[i];
        const rgb = hexToLinearRgb(th.hex);
        threadLinFlat[i * 3] = rgb[0];
        threadLinFlat[i * 3 + 1] = rgb[1];
        threadLinFlat[i * 3 + 2] = rgb[2];
        threadOptFlat[i * 3] = th.sheen;
        threadOptFlat[i * 3 + 1] = th.roughness;
        threadOptFlat[i * 3 + 2] = th.metallic;
      }
      return {
        shapeId: SHAPE_ID[m.shape],
        weaveId: WEAVE_ID[m.weave],
        col: idx % atlasCols,
        row: Math.floor(idx / atlasCols),
        substrateLin: hexToLinearRgb(m.substrateHex),
        substrateParam: [
          m.substrateRoughness,
          m.substrateSheen,
          m.substrateAngleDeg * degToRad,
          m.isLightSubstrate ? 1.0 : 0.0,
        ],
        tatamiAngles: [
          m.tatamiAnglesDeg[0] * degToRad,
          m.tatamiAnglesDeg[1] * degToRad,
          m.tatamiAnglesDeg[2] * degToRad,
        ],
        merrowThread: m.merrowThread,
        threadLinFlat,
        threadOptFlat,
      };
    });

    // Allocate compact baked atlas textures (2160x1040 = 25.71 MiB for 6 badges; 720x520 = 4.28 MiB for 1 badge!)
    let useFloat = Boolean(extFloat);
    let texDist = useFloat
      ? createTex(gl, gl.RG16F, atlasW, atlasH, gl.RG, gl.HALF_FLOAT, gl.LINEAR)
      : createTex(gl, gl.RGBA8, atlasW, atlasH, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);

    const texOrient = createTex(gl, gl.RGBA8, atlasW, atlasH, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
    const texAux = createTex(gl, gl.RG8, atlasW, atlasH, gl.RG, gl.UNSIGNED_BYTE, gl.LINEAR);
    const texMeta = createTex(gl, gl.RG8, atlasW, atlasH, gl.RG, gl.UNSIGNED_BYTE, gl.NEAREST);

    // Probe RG16F MRT renderability; degrade seamlessly to RGBA8 if driver rejects RG16F MRT
    let fboMainAtlas = tryCreateFbo(gl, [texDist, texOrient, texAux]);
    if (!fboMainAtlas && useFloat) {
      gl.deleteTexture(texDist);
      useFloat = false;
      texDist = createTex(gl, gl.RGBA8, atlasW, atlasH, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
      fboMainAtlas = createFbo(gl, [texDist, texOrient, texAux]);
    }
    if (!fboMainAtlas) throw new Error("Failed to initialize Patch atlas FBO");

    this.#useFloatDist = useFloat;
    this.#texDistAtlas = texDist;
    this.#texOrientAtlas = texOrient;
    this.#texAuxAtlas = texAux;
    this.#texMetaAtlas = texMeta;
    // 4 B (dist) + 4 B (orient) + 2 B (aux) + 2 B (meta) = 12 B/texel
    this.#atlasVramBytes = atlasW * atlasH * 12;

    this.#progRender = compileProgram(gl, FULLSCREEN_VERTEX, RENDER_FRAGMENT, [
      "uDistAtlas",
      "uOrientAtlas",
      "uAuxAtlas",
      "uMetaAtlas",
      "uVpOriginPx",
      "uVpSizeCss",
      "uDpr",
      "uTileGrid",
      "uAtlasGrid",
      "uLightDir",
      "uFloatDist",
      "uSplit",
      "uOpacity",
      "uPose",
      "uNight",
      "uCardLin",
      "uShapeId",
      "uWeaveId",
      "uSubstrateLin",
      "uSubstrateParam",
      "uTatamiAngles",
      "uMerrowThread",
      "uThreadLin",
      "uThreadOpt",
    ]);

    // Execute one-time Tier-A bake for all 6 badges, then IMMEDIATELY free all scratch GPU resources!
    const t0 = performance.now();
    this.#bakeAllBadgesAndFreeScratch(badges, fboMainAtlas);
    this.#bakeMs = performance.now() - t0;
  }

  get atlasVramBytes(): number {
    return this.#atlasVramBytes;
  }

  get bakeMs(): number {
    return this.#bakeMs;
  }

  get glError(): number {
    return this.#disposed ? 0 : this.#gl.getError();
  }

  resize(cssW: number, cssH: number, dpr: number): void {
    if (this.#disposed) return;
    const safeW = Math.max(1, cssW);
    const safeH = Math.max(1, cssH);
    const safeDpr = Math.max(1, Math.min(dpr, 2));
    const pw = Math.max(1, Math.round(safeW * safeDpr));
    const ph = Math.max(1, Math.round(safeH * safeDpr));

    this.#cssW = safeW;
    this.#cssH = safeH;
    this.#dpr = safeDpr;

    const canvas = this.#gl.canvas;
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  beginFrame(): void {
    if (this.#disposed) return;
    const gl = this.#gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.SCISSOR_TEST);
    gl.bindVertexArray(this.#vao);
    gl.useProgram(this.#progRender.program);

    const u = this.#progRender.u;
    this.#bindTex(0, this.#texDistAtlas);
    this.#bindTex(1, this.#texOrientAtlas);
    this.#bindTex(2, this.#texAuxAtlas);
    this.#bindTex(3, this.#texMetaAtlas);
    gl.uniform1i(u.uDistAtlas, 0);
    gl.uniform1i(u.uOrientAtlas, 1);
    gl.uniform1i(u.uAuxAtlas, 2);
    gl.uniform1i(u.uMetaAtlas, 3);
    gl.uniform1f(u.uDpr, this.#dpr);
    gl.uniform2f(u.uAtlasGrid, this.#atlasCols, this.#atlasRows);
    gl.uniform1f(u.uFloatDist, this.#useFloatDist ? 1 : 0);
  }

  drawBadgeSlot(
    badgeIndex: number,
    vp: CardViewport,
    lightDir: Vec3,
    split: number,
    night: number,
    cardLin: Vec3,
    opacity = 1.0,
    pose: BadgePose = IDENTITY_POSE,
  ): void {
    if (this.#disposed) return;
    if (vp.w <= 1 || vp.h <= 1 || split >= 0.9995 || opacity <= 0.001) return;

    const gl = this.#gl;
    const ch = gl.canvas.height;
    const cw = gl.canvas.width;
    const dpr = this.#dpr;

    // Exact floating-point bottom-left origin in WebGL Y-up device pixels (for 0.00 px SVG registration!)
    const originX = vp.x * dpr;
    const originY = ch - (vp.y + vp.h) * dpr;

    // Integer scissor box strictly clipped to canvas bounds
    const sx0 = Math.max(0, Math.floor(originX));
    const sy0 = Math.max(0, Math.floor(originY));
    const sx1 = Math.min(cw, Math.ceil(originX + vp.w * dpr));
    const sy1 = Math.min(ch, Math.ceil(originY + vp.h * dpr));
    const sw = sx1 - sx0;
    const sh = sy1 - sy0;
    if (sw <= 0 || sh <= 0) return;

    const b = this.#badgeUniforms[badgeIndex];
    if (!b) return;

    gl.viewport(sx0, sy0, sw, sh);
    gl.scissor(sx0, sy0, sw, sh);

    const u = this.#progRender.u;
    gl.uniform2f(u.uVpOriginPx, originX, originY);
    gl.uniform2f(u.uVpSizeCss, vp.w, vp.h);
    gl.uniform2f(u.uTileGrid, b.col, b.row);
    gl.uniform3f(u.uLightDir, lightDir[0], lightDir[1], lightDir[2]);
    gl.uniform1f(u.uSplit, split);
    gl.uniform1f(u.uOpacity, opacity);
    gl.uniform4f(u.uPose, pose.dx, pose.dy, pose.angleRad, pose.fitZoom);
    gl.uniform1f(u.uNight, night);
    gl.uniform3f(u.uCardLin, cardLin[0], cardLin[1], cardLin[2]);

    gl.uniform1i(u.uShapeId, b.shapeId);
    gl.uniform1i(u.uWeaveId, b.weaveId);
    gl.uniform3f(u.uSubstrateLin, b.substrateLin[0], b.substrateLin[1], b.substrateLin[2]);
    gl.uniform4f(
      u.uSubstrateParam,
      b.substrateParam[0],
      b.substrateParam[1],
      b.substrateParam[2],
      b.substrateParam[3],
    );
    gl.uniform3f(u.uTatamiAngles, b.tatamiAngles[0], b.tatamiAngles[1], b.tatamiAngles[2]);
    gl.uniform1i(u.uMerrowThread, b.merrowThread);
    gl.uniform3fv(u.uThreadLin, b.threadLinFlat);
    gl.uniform3fv(u.uThreadOpt, b.threadOptFlat);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  endFrame(): void {
    if (this.#disposed) return;
    const gl = this.#gl;
    gl.disable(gl.SCISSOR_TEST);
    gl.bindVertexArray(null);
  }

  /** Executes a synchronized GPU benchmark drawing `slots` for `frames` iterations. */
  bench(
    drawFn: () => void,
    frames = 24,
  ): number {
    if (this.#disposed) return 0;
    const gl = this.#gl;
    const px = new Uint8Array(4);
    drawFn();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const t0 = performance.now();
    for (let i = 0; i < frames; i++) drawFn();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return (performance.now() - t0) / Math.max(1, frames);
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    activeContextCount = Math.max(0, activeContextCount - 1);
    const gl = this.#gl;

    gl.deleteProgram(this.#progRender.program);
    gl.deleteTexture(this.#texDistAtlas);
    gl.deleteTexture(this.#texOrientAtlas);
    gl.deleteTexture(this.#texAuxAtlas);
    gl.deleteTexture(this.#texMetaAtlas);
    gl.deleteVertexArray(this.#vao);
  }

  #bindTex(unit: number, tex: WebGLTexture): void {
    const gl = this.#gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  }

  #bakeAllBadgesAndFreeScratch(
    badges: readonly BadgeAsset[],
    fboMainAtlas: WebGLFramebuffer,
  ): void {
    const gl = this.#gl;

    // Compile temporary Tier-A bake programs (deleted immediately after bake!)
    const progSeed = compileProgram(gl, FULLSCREEN_VERTEX, SEED_FRAGMENT, ["uArtTex", "uTexSize", "uMode"]);
    const progJfa = compileProgram(gl, FULLSCREEN_VERTEX, JFA_FRAGMENT, ["uSeedTex", "uTexSize", "uStep"]);
    const progOpenSeed = compileProgram(gl, FULLSCREEN_VERTEX, OPEN_SEED_FRAGMENT, [
      "uArtTex",
      "uMainSeedTex",
      "uFullSize",
      "uBakeScale",
      "uTatamiRadius",
    ]);
    const progOpenJfa = compileProgram(gl, FULLSCREEN_VERTEX, OPEN_JFA_FRAGMENT, [
      "uCoreTex",
      "uHalfSize",
      "uStep",
    ]);
    const progResolveMain = compileProgram(gl, FULLSCREEN_VERTEX, RESOLVE_MAIN_ATLAS_FRAGMENT, [
      "uArtTex",
      "uRegionTex",
      "uMainSeedTex",
      "uProudSeedTex",
      "uCoreTex",
      "uFullSize",
      "uTileSize",
      "uTileOffset",
      "uBakeScale",
      "uTatamiRadius",
      "uFloatDist",
    ]);
    const progResolveRec = compileProgram(gl, FULLSCREEN_VERTEX, RESOLVE_REC_ATLAS_FRAGMENT, [
      "uArtTex",
      "uRecSeedTex",
      "uFullSize",
      "uTileSize",
      "uTileOffset",
      "uBakeScale",
      "uFloatDist",
    ]);
    const progPackMeta = compileProgram(gl, FULLSCREEN_VERTEX, PACK_META_ATLAS_FRAGMENT, [
      "uRegionTex",
      "uThreadTex",
      "uTileSize",
      "uTileOffset",
    ]);

    // Allocate ONE reusable set of temporary JFA scratch textures & FBOs
    const texArt = createTex(gl, gl.RGBA8, BAKE_W, BAKE_H, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);
    const texReg = createTex(gl, gl.RGBA8, ATLAS_TILE_W, ATLAS_TILE_H, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);
    const texThr = createTex(gl, gl.RGBA8, ATLAS_TILE_W, ATLAS_TILE_H, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);

    const s0 = createTex(gl, gl.RGBA16UI, BAKE_W, BAKE_H, gl.RGBA_INTEGER, gl.UNSIGNED_SHORT, gl.NEAREST);
    const s1 = createTex(gl, gl.RGBA16UI, BAKE_W, BAKE_H, gl.RGBA_INTEGER, gl.UNSIGNED_SHORT, gl.NEAREST);
    const s2 = createTex(gl, gl.RGBA16UI, BAKE_W, BAKE_H, gl.RGBA_INTEGER, gl.UNSIGNED_SHORT, gl.NEAREST);
    const texSeed = [s0, s1, s2] as const;
    const fboSeed = [createFbo(gl, [s0]), createFbo(gl, [s1]), createFbo(gl, [s2])] as const;

    const o0 = createTex(gl, gl.RG16UI, ATLAS_TILE_W, ATLAS_TILE_H, gl.RG_INTEGER, gl.UNSIGNED_SHORT, gl.NEAREST);
    const o1 = createTex(gl, gl.RG16UI, ATLAS_TILE_W, ATLAS_TILE_H, gl.RG_INTEGER, gl.UNSIGNED_SHORT, gl.NEAREST);
    const texOpen = [o0, o1] as const;
    const fboOpen = [createFbo(gl, [o0]), createFbo(gl, [o1])] as const;

    const fboDistOnly = createFbo(gl, [this.#texDistAtlas]);
    const fboMetaAtlas = createFbo(gl, [this.#texMetaAtlas]);

    const scratch = createBakeScratchCanvases();

    const runJfa = (mode: number, steps: readonly number[], bufA: number, bufB: number): number => {
      gl.viewport(0, 0, BAKE_W, BAKE_H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboSeed[bufA]);
      gl.useProgram(progSeed.program);
      this.#bindTex(0, texArt);
      gl.uniform1i(progSeed.u.uArtTex, 0);
      gl.uniform2i(progSeed.u.uTexSize, BAKE_W, BAKE_H);
      gl.uniform1i(progSeed.u.uMode, mode);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.useProgram(progJfa.program);
      gl.uniform2i(progJfa.u.uTexSize, BAKE_W, BAKE_H);
      let src = bufA;
      let dst = bufB;
      for (const step of steps) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboSeed[dst]);
        this.#bindTex(0, texSeed[src]);
        gl.uniform1i(progJfa.u.uSeedTex, 0);
        gl.uniform1i(progJfa.u.uStep, step);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        const tmp = src;
        src = dst;
        dst = tmp;
      }
      return src;
    };

    const runOpening = (mainSeedIdx: number): number => {
      gl.viewport(0, 0, ATLAS_TILE_W, ATLAS_TILE_H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboOpen[0]);
      gl.useProgram(progOpenSeed.program);
      this.#bindTex(0, texArt);
      this.#bindTex(1, texSeed[mainSeedIdx]);
      gl.uniform1i(progOpenSeed.u.uArtTex, 0);
      gl.uniform1i(progOpenSeed.u.uMainSeedTex, 1);
      gl.uniform2i(progOpenSeed.u.uFullSize, BAKE_W, BAKE_H);
      gl.uniform1f(progOpenSeed.u.uBakeScale, BAKE_SCALE);
      gl.uniform1f(progOpenSeed.u.uTatamiRadius, TATAMI_RADIUS_PX);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.useProgram(progOpenJfa.program);
      gl.uniform2i(progOpenJfa.u.uHalfSize, ATLAS_TILE_W, ATLAS_TILE_H);
      let src = 0;
      let dst = 1;
      for (const step of [16, 8, 4, 2, 1]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboOpen[dst]);
        this.#bindTex(0, texOpen[src]);
        gl.uniform1i(progOpenJfa.u.uCoreTex, 0);
        gl.uniform1i(progOpenJfa.u.uStep, step);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        const tmp = src;
        src = dst;
        dst = tmp;
      }
      return src;
    };

    gl.bindVertexArray(this.#vao);
    gl.disable(gl.SCISSOR_TEST);

    for (let idx = 0; idx < badges.length; idx++) {
      const col = idx % this.#atlasCols;
      const row = Math.floor(idx / this.#atlasCols);
      const offX = col * ATLAS_TILE_W;
      const offY = row * ATLAS_TILE_H;

      // 1. Rasterize homologous vector ops directly onto reusable canvases (zero getImageData!)
      rasterizeBadgeIntoScratch(badges[idx], scratch);

      // Upload canvases flipped Y so Canvas top -> WebGL Y-up uv.y = 1.0
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);

      gl.bindTexture(gl.TEXTURE_2D, texArt);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, scratch.layerCanvas);

      gl.bindTexture(gl.TEXTURE_2D, texReg);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, scratch.regionCanvas);

      gl.bindTexture(gl.TEXTURE_2D, texThr);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, scratch.threadCanvas);

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

      // 2. Main Foreground JFA+1 (2x supersampled) + Half-Res Morphological Opening
      gl.disable(gl.SCISSOR_TEST);
      const mainIdx = runJfa(0, [128, 64, 32, 16, 8, 4, 2, 1, 1], 0, 1);
      const coreIdx = runOpening(mainIdx);

      // 3. Proud Layer JFA+1 using the 2 spare seed slots (keeps mainIdx intact!)
      const freeA = mainIdx === 0 ? 1 : 0;
      const proudIdx = runJfa(1, [32, 16, 8, 4, 2, 1, 1], freeA, 2);

      // 4. MRT Resolve directly into this badge's 720x520 tile inside the 3x2 atlas!
      // Scissor strictly clips fullscreen triangle to (offX, offY, 720, 520) so neighboring tiles stay untouched.
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(offX, offY, ATLAS_TILE_W, ATLAS_TILE_H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboMainAtlas);
      gl.viewport(offX, offY, ATLAS_TILE_W, ATLAS_TILE_H);
      gl.useProgram(progResolveMain.program);
      const rm = progResolveMain.u;
      this.#bindTex(0, texArt);
      this.#bindTex(1, texReg);
      this.#bindTex(2, texSeed[mainIdx]);
      this.#bindTex(3, texSeed[proudIdx]);
      this.#bindTex(4, texOpen[coreIdx]);
      gl.uniform1i(rm.uArtTex, 0);
      gl.uniform1i(rm.uRegionTex, 1);
      gl.uniform1i(rm.uMainSeedTex, 2);
      gl.uniform1i(rm.uProudSeedTex, 3);
      gl.uniform1i(rm.uCoreTex, 4);
      gl.uniform2i(rm.uFullSize, BAKE_W, BAKE_H);
      gl.uniform2i(rm.uTileSize, ATLAS_TILE_W, ATLAS_TILE_H);
      gl.uniform2i(rm.uTileOffset, offX, offY);
      gl.uniform1f(rm.uBakeScale, BAKE_SCALE);
      gl.uniform1f(rm.uTatamiRadius, TATAMI_RADIUS_PX);
      gl.uniform1f(rm.uFloatDist, this.#useFloatDist ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // 5. Recessed Layer JFA+1 + Color-Masked G-channel Resolve into uDistAtlas
      gl.disable(gl.SCISSOR_TEST);
      const recIdx = runJfa(2, [32, 16, 8, 4, 2, 1, 1], 0, 1);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(offX, offY, ATLAS_TILE_W, ATLAS_TILE_H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboDistOnly);
      gl.viewport(offX, offY, ATLAS_TILE_W, ATLAS_TILE_H);
      gl.colorMask(false, true, false, false);
      gl.useProgram(progResolveRec.program);
      const rr = progResolveRec.u;
      this.#bindTex(0, texArt);
      this.#bindTex(1, texSeed[recIdx]);
      gl.uniform1i(rr.uArtTex, 0);
      gl.uniform1i(rr.uRecSeedTex, 1);
      gl.uniform2i(rr.uFullSize, BAKE_W, BAKE_H);
      gl.uniform2i(rr.uTileSize, ATLAS_TILE_W, ATLAS_TILE_H);
      gl.uniform2i(rr.uTileOffset, offX, offY);
      gl.uniform1f(rr.uBakeScale, BAKE_SCALE);
      gl.uniform1f(rr.uFloatDist, this.#useFloatDist ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.colorMask(true, true, true, true);

      // 6. Pack discrete region + 3-layer thread indices into uMetaAtlas
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboMetaAtlas);
      gl.viewport(offX, offY, ATLAS_TILE_W, ATLAS_TILE_H);
      gl.useProgram(progPackMeta.program);
      const pm = progPackMeta.u;
      this.#bindTex(0, texReg);
      this.#bindTex(1, texThr);
      gl.uniform1i(pm.uRegionTex, 0);
      gl.uniform1i(pm.uThreadTex, 1);
      gl.uniform2i(pm.uTileSize, ATLAS_TILE_W, ATLAS_TILE_H);
      gl.uniform2i(pm.uTileOffset, offX, offY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    gl.disable(gl.SCISSOR_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    // IMMEDIATELY FREE ALL TEMPORARY JFA SCRATCH BUFFERS & BAKE PROGRAMS!
    gl.deleteProgram(progSeed.program);
    gl.deleteProgram(progJfa.program);
    gl.deleteProgram(progOpenSeed.program);
    gl.deleteProgram(progOpenJfa.program);
    gl.deleteProgram(progResolveMain.program);
    gl.deleteProgram(progResolveRec.program);
    gl.deleteProgram(progPackMeta.program);

    gl.deleteTexture(texArt);
    gl.deleteTexture(texReg);
    gl.deleteTexture(texThr);
    for (const t of texSeed) gl.deleteTexture(t);
    for (const f of fboSeed) gl.deleteFramebuffer(f);
    for (const t of texOpen) gl.deleteTexture(t);
    for (const f of fboOpen) gl.deleteFramebuffer(f);
    gl.deleteFramebuffer(fboMainAtlas);
    gl.deleteFramebuffer(fboDistOnly);
    gl.deleteFramebuffer(fboMetaAtlas);

    // Zero all 9 temporary 2D scratch canvases so Chrome immediately frees ~38 MB of 2D backing stores!
    for (const c of [
      scratch.layerCanvas,
      scratch.regionCanvas,
      scratch.threadCanvas,
      scratch.cR,
      scratch.cG,
      scratch.cB,
      scratch.cTR,
      scratch.cTG,
      scratch.cTB,
    ]) {
      c.width = 0;
      c.height = 0;
    }
  }
}
