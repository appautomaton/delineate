// Shared WebGL2 GLSL 300 es vertex shader and optical math library for Lumen:
// OKLab perceptual color space, Abramowitz-Stegun erf() for analytical Gaussian convolution,
// C2 quintic 2D simplex noise, triangular-PDF Interleaved Gradient Noise dithering,
// cross-channel filmic emission tone-mapping, and antialiased rounded-rect card masking.

export const VERTEX_SHADER = /* glsl */ `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID & 1) << 2), float((gl_VertexID & 2) << 1)) - 1.0;
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

export const COMMON_GLSL = /* glsl */ `
const float PI = 3.14159265359;
const float TAU = 6.28318530718;

// Exact sRGB <-> Linear transfer (pow inputs strictly > 0 to avoid Metal/ANGLE pow(0, y) NaN)
vec3 srgbToLinear(vec3 c) {
  vec3 x = max(c, vec3(0.0));
  vec3 lo = x / 12.92;
  vec3 hi = pow(max((x + 0.055) / 1.055, vec3(1e-7)), vec3(2.4));
  return mix(lo, hi, step(vec3(0.04045), x));
}

vec3 linearToSrgb(vec3 c) {
  vec3 x = max(c, vec3(0.0));
  vec3 lo = 12.92 * x;
  vec3 hi = 1.055 * pow(max(x, vec3(1e-7)), vec3(1.0 / 2.4)) - 0.055;
  return clamp(mix(lo, hi, step(vec3(0.0031308), x)), 0.0, 1.0);
}

// Perceptual OKLab (Bjorn Ottosson)
vec3 linearToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  float l_ = pow(max(l, 1e-7), 1.0 / 3.0);
  float m_ = pow(max(m, 1e-7), 1.0 / 3.0);
  float s_ = pow(max(s, 1e-7), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  );
}

vec3 oklabToLinear(vec3 lab) {
  float l_ = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m_ = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s_ = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  float l = l_ * l_ * l_;
  float m = m_ * m_ * m_;
  float s = s_ * s_ * s_;
  return max(vec3(
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  ), vec3(0.0));
}

vec3 mixOklabLin(vec3 linA, vec3 linB, float t) {
  return oklabToLinear(mix(linearToOklab(linA), linearToOklab(linB), clamp(t, 0.0, 1.0)));
}

vec3 mixOklab(vec3 srgbA, vec3 srgbB, float t) {
  return linearToSrgb(mixOklabLin(srgbToLinear(srgbA), srgbToLinear(srgbB), t));
}

// High-precision Abramowitz & Stegun 7.1.26 error function (max error < 1.5e-7)
float erfApprox(float x) {
  float s = sign(x);
  float a = abs(x);
  float t = 1.0 / (1.0 + 0.3275911 * a);
  float poly = (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t) - 0.284496736) * t + 0.254829592) * t;
  return s * (1.0 - poly * exp(-a * a));
}

// C2-continuous 2D simplex gradient noise (zero grid-aligned Mach banding)
vec3 _mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 _mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 _permute(vec3 x) { return _mod289(((x * 34.0) + 1.0) * x); }

float snoise2(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,  // (3 - sqrt(3)) / 6
    0.366025403784439,  // 0.5 * (sqrt(3) - 1)
   -0.577350269189626,  // -1 + 2 * C.x
    0.024390243902439   // 1 / 41
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = _mod289(i);
  vec3 p = _permute(_permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Interleaved Gradient Noise (Jimenez 2014) + triangular-PDF anti-banding dither
float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

vec3 ditherTri(vec3 srgbCol, vec2 fragCoord) {
  float r0 = ign(fragCoord);
  float r1 = ign(fragCoord + vec2(17.0, 31.0));
  float tri = (r0 + r1) - 1.0; // exact triangular PDF in [-1, 1]
  return clamp(srgbCol + tri * (0.75 / 255.0), 0.0, 1.0);
}

// Cross-channel filmic tone-mapping for additive spectral emission:
// high-energy overlaps desaturate naturally into warm incandescent ivory (#FFFDF8)
// instead of hard-clipping saturated primaries.
vec3 filmicEmission(vec3 rad) {
  vec3 x = max(rad, vec3(0.0));
  float lum = dot(x, vec3(0.2126, 0.7152, 0.0722));
  float bleed = smoothstep(0.62, 2.55, lum);
  vec3 ivory = vec3(1.0, 0.992, 0.965);
  vec3 mixed = mix(x, ivory * max(lum, 1.0), bleed * 0.80);
  vec3 mapped = (mixed * (2.51 * mixed + 0.03)) / (mixed * (2.43 * mixed + 0.59) + 0.14);
  return linearToSrgb(clamp(mapped, 0.0, 1.0));
}

// Antialiased rounded-rect clip mask in CSS px (used on landing card slots)
vec3 applyCornerMask(vec3 col, vec3 ground, vec2 uv, vec2 resCss, float radiusCss, float dpr) {
  if (radiusCss <= 0.25) return col;
  vec2 halfSize = resCss * 0.5;
  vec2 p = abs(uv * resCss - halfSize) - (halfSize - vec2(radiusCss));
  float sd = length(max(p, 0.0)) + min(max(p.x, p.y), 0.0) - radiusCss;
  float aa = max(0.75 / max(dpr, 1.0), 0.45);
  float mask = 1.0 - smoothstep(-aa, aa, sd);
  return mix(ground, col, mask);
}

mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}
`;
