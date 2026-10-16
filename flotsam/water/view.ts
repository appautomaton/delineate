// Draws the water. Each particle adds a soft disc to a density field at half the screen's resolution, mirrored
// across the walls so water meets the glass as water and not as an edge; the field is smoothed, so the surface is
// one water and not a crowd of discs; and its level line is the surface: a body below it, a bright hairline
// along it, thin water (a droplet, a sheet, the crest of a wave) paler, foam where it runs fast, and shafts of
// light slanting down through it from the upper left, drifting slowly and fading as they go deeper.
//
// Its colours are the page's: --water-deep, --water-shallow, --water-thin, --water-foam, --water-line (the bright
// hairline) and --water-edge (a fine line outside it, against the paper), and --water-rays for how bright the
// shafts are, on the canvas, read again whenever the light changes.

import type { Pt } from "./sim.ts";

const FS = 0.5; // the field's resolution, per CSS pixel
const LEVEL = 0.55; // the field's value at the surface

const FULL = `#version 300 es
  out vec2 uv;
  void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    uv = p;
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  }`;

const SPLAT = [
  `#version 300 es
  layout(location = 0) in vec3 a;
  uniform vec2 view, origin, flip, shift;
  uniform float size;
  out float speed;
  void main() {
    vec2 q = (a.xy - origin) * flip + shift;
    vec2 p = q / view * 2.0 - 1.0;
    gl_Position = vec4(p.x, -p.y, 0.0, 1.0);
    gl_PointSize = size;
    speed = a.z;
  }`,
  `#version 300 es
  precision mediump float;
  in float speed;
  uniform float gain;
  out vec4 o;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    float w = (1.0 - r2) * (1.0 - r2) * gain;
    o = vec4(w, w * speed, 0.0, 0.0);
  }`,
];

// A Gaussian one way at a time, five taps reading nine texels.
const BLUR = `#version 300 es
  precision highp float;
  in vec2 uv;
  uniform sampler2D src;
  uniform vec2 dir;
  out vec4 o;
  void main() {
    o = texture(src, uv) * 0.2270270270
      + (texture(src, uv + dir * 1.3846153846) + texture(src, uv - dir * 1.3846153846)) * 0.3162162162
      + (texture(src, uv + dir * 3.2307692308) + texture(src, uv - dir * 3.2307692308)) * 0.0702702703;
  }`;

const SURFACE = `#version 300 es
  precision highp float;
  in vec2 uv;
  uniform sampler2D field;
  uniform float level, dpr, opacity, time, aspect, rays;
  uniform vec3 deep, shallow, thin, foam, line, edge;
  out vec4 o;
  void main() {
    vec4 f = texture(field, uv);
    float d = f.r;
    float grad = max(length(vec2(dFdx(d), dFdy(d))), 1e-6);
    float dist = (d - level) / grad; // device pixels inside the surface
    // A fine line of the water's own deep colour just outside the surface, to set it off from the paper.
    float outline = clamp(1.0 - abs(dist + 0.6 * dpr) / (0.7 * dpr), 0.0, 1.0) * 0.55;
    float body = clamp(dist + 0.5, 0.0, 1.0);
    if (body <= 0.0) { o = vec4(edge * outline, outline); return; }
    float rim = clamp(1.0 - abs(dist - 1.6 * dpr) / (0.9 * dpr), 0.0, 1.0);
    float sheet = 1.0 - smoothstep(level, level * 2.6, d);
    float speed = f.g / max(d, 1e-4);
    vec3 c = mix(deep, shallow, smoothstep(0.0, 0.75, uv.y));
    c = mix(c, thin, sheet * 0.5);
    c = mix(c, foam, clamp(speed * 1.6 - 0.35, 0.0, 1.0) * sheet * 0.6);
    // Shafts of light: soft bands slanting down to the right, a few at once, each drifting at its own pace.
    float s = uv.x * aspect + (1.0 - uv.y) * 0.42;
    float shaft = pow(0.5 + 0.5 * sin(s * 6.3 + time * 0.11), 7.0) * 0.7
      + pow(0.5 + 0.5 * sin(s * 11.7 - time * 0.07 + 1.9), 9.0) * 0.5
      + pow(0.5 + 0.5 * sin(s * 3.1 + time * 0.05 + 4.2), 5.0) * 0.4;
    c = mix(c, thin, clamp(shaft * rays * smoothstep(0.0, 0.7, uv.y), 0.0, 0.6));
    c = mix(c, line, rim);
    // Deeper water is denser to the eye: clear at the top of the tank, a good deal less so at the foot.
    float a = body * mix(min(0.96, opacity * mix(1.25, 0.9, uv.y)), 1.0, rim);
    o = vec4(c * a, a) + vec4(edge * outline, outline) * (1.0 - a);
  }`;

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer };
// The walls the field mirrors water across: none, left, right, top, bottom. flip x, flip y, shift x, shift y.
const MIRRORS = [
  [1, 1, 0, 0],
  [-1, 1, 0, 0],
  [-1, 1, 2, 0],
  [1, -1, 0, 0],
  [1, -1, 0, 2],
];

export class WaterView {
  readonly #gl: WebGL2RenderingContext;
  readonly #canvas: HTMLCanvasElement;
  readonly #float: boolean;
  readonly #splat: WebGLProgram;
  readonly #blur: WebGLProgram;
  readonly #surface: WebGLProgram;
  readonly #buffer: WebGLBuffer;
  readonly #points: WebGLVertexArrayObject;
  readonly #none: WebGLVertexArrayObject;
  #targets: Target[] = [];
  #W = 0;
  #H = 0;
  #fw = 0;
  #fh = 0;
  #dpr = 1;
  #colours: Record<string, number[]> = {};
  #opacity = 0.85;
  #rays = 0;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) throw new Error("no WebGL2");
    this.#gl = gl;
    this.#canvas = canvas;
    this.#float = !!gl.getExtension("EXT_color_buffer_float");
    this.#splat = program(gl, SPLAT[0], SPLAT[1]);
    this.#blur = program(gl, FULL, BLUR);
    this.#surface = program(gl, FULL, SURFACE);
    this.#buffer = gl.createBuffer()!;
    this.#points = gl.createVertexArray()!;
    gl.bindVertexArray(this.#points);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    this.#none = gl.createVertexArray()!;
    gl.bindVertexArray(null);
    this.palette();
  }

  // The colours, from the canvas's style as it now stands.
  palette(): void {
    const style = getComputedStyle(this.#canvas);
    const read = (name: string) => rgb(style.getPropertyValue(`--water-${name}`).trim() || "#000");
    for (const name of ["deep", "shallow", "thin", "foam", "line", "edge"]) this.#colours[name] = read(name);
    this.#opacity = parseFloat(style.getPropertyValue("--water-opacity")) || 0.85;
    this.#rays = parseFloat(style.getPropertyValue("--water-rays")) || 0;
  }

  resize(W: number, H: number): void {
    const gl = this.#gl;
    this.#W = W;
    this.#H = H;
    this.#dpr = Math.min(devicePixelRatio, 2);
    this.#canvas.width = Math.round(W * this.#dpr);
    this.#canvas.height = Math.round(H * this.#dpr);
    this.#fw = Math.ceil(W * FS);
    this.#fh = Math.ceil(H * FS);
    for (const t of this.#targets) gl.deleteTexture(t.tex), gl.deleteFramebuffer(t.fbo);
    this.#targets = [this.#target(), this.#target()];
  }

  draw(water: Float32Array, N: number, h: number, origin: Pt): void {
    const gl = this.#gl, gain = this.#float ? 1 : 0.16;
    const [a, b] = this.#targets;
    const u = (p: WebGLProgram, name: string) => gl.getUniformLocation(p, name);

    gl.bindFramebuffer(gl.FRAMEBUFFER, a.fbo);
    gl.viewport(0, 0, this.#fw, this.#fh);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(this.#splat);
    gl.uniform2f(u(this.#splat, "view"), this.#W, this.#H);
    gl.uniform2f(u(this.#splat, "origin"), origin.x, origin.y);
    gl.uniform1f(u(this.#splat, "size"), 1.25 * h * FS);
    gl.uniform1f(u(this.#splat, "gain"), gain);
    gl.bindVertexArray(this.#points);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffer);
    gl.bufferData(gl.ARRAY_BUFFER, water, gl.STREAM_DRAW);
    for (const [fx, fy, sx, sy] of MIRRORS) {
      gl.uniform2f(u(this.#splat, "flip"), fx, fy);
      gl.uniform2f(u(this.#splat, "shift"), sx * this.#W, sy * this.#H);
      gl.drawArrays(gl.POINTS, 0, N);
    }
    gl.disable(gl.BLEND);

    // Smoothed across, then down.
    const reach = (0.32 * h * FS) / 3.23;
    gl.useProgram(this.#blur);
    gl.bindVertexArray(this.#none);
    gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo);
    gl.bindTexture(gl.TEXTURE_2D, a.tex);
    gl.uniform2f(u(this.#blur, "dir"), reach / this.#fw, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, a.fbo);
    gl.bindTexture(gl.TEXTURE_2D, b.tex);
    gl.uniform2f(u(this.#blur, "dir"), 0, reach / this.#fh);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const s = this.#surface;
    gl.useProgram(s);
    gl.bindTexture(gl.TEXTURE_2D, a.tex);
    gl.uniform1f(u(s, "level"), LEVEL * gain);
    gl.uniform1f(u(s, "dpr"), this.#dpr);
    gl.uniform1f(u(s, "opacity"), this.#opacity);
    gl.uniform1f(u(s, "rays"), this.#rays);
    gl.uniform1f(u(s, "time"), performance.now() / 1000);
    gl.uniform1f(u(s, "aspect"), this.#W / this.#H);
    for (const [name, c] of Object.entries(this.#colours)) gl.uniform3fv(u(s, name), c);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  #target(): Target {
    const gl = this.#gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const [inner, type] = this.#float ? [gl.RGBA16F, gl.HALF_FLOAT] : [gl.RGBA8, gl.UNSIGNED_BYTE];
    gl.texImage2D(gl.TEXTURE_2D, 0, inner, this.#fw, this.#fh, 0, gl.RGBA, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  }
}

function program(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
    gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "program");
  return p;
}

// Any CSS colour as sRGB channels from 0 to 1: a canvas reads it for us.
const probe = document.createElement("canvas").getContext("2d")!;
function rgb(css: string): number[] {
  probe.fillStyle = "#000";
  probe.fillStyle = css;
  const v = probe.fillStyle;
  if (v.startsWith("#")) return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const m = v.match(/[\d.]+/g) ?? ["0", "0", "0"];
  return m.slice(0, 3).map((n) => Number(n) / 255);
}
