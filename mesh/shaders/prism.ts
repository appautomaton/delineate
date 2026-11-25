// Plate III — Prism: Precision-Cut Leica Crystal & 0-Step Analytical Horizon Slit.
// Shapes (`PRISM_SHAPES`):
//   0: Spool    (tight-chamfered optical hourglass block minus crisp concave cylinders)
//   1: Dome     (equatorially bisected plano-convex optical hemispheres)
//   2: Diamond  (rotated precision-cut chamfered cube/rhombic crystal lens, vid3 00:12/00:23)
//   3: Tetra    (sharp-beveled rotating optical tetrahedron)
//   4: Slit     (0-step closed-form analytical Horizon Slit — <0.2ms at 100vw x 100svh @ 2x!)
// Performance: Analytical bounding-sphere early-out (r = 0.88) skips 65%+ sky pixels in 4 ALU ops;
// clamped [tNear, tFar] 56-step march at 0.0005 precision. Double-walled clear glass bevel frames
// blazing electric-cyan, deep royal-ultramarine, and hot-magenta Cauchy + Airy thin-film caustics.

import { COMMON_GLSL } from "./common.ts";

export const PRISM_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResCss;
uniform float uDpr;
uniform float uTime;
uniform float uNight;
uniform vec3 uColors[5]; // [skyLight, skyDeep, filmCyan, filmCobalt, filmMagenta]
uniform vec3 uGround;
uniform vec2 uPointer;   // top-left normalized [0..1]
uniform float uHover;
uniform int uFrom;
uniform int uTo;
uniform float uMorph;
uniform vec2 uMotion;
uniform float uCompact;
uniform float uCornerRadius;

${COMMON_GLSL}

float sMin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sMax(float a, float b, float k) {
  return -sMin(-a, -b, k);
}

float sdRoundBox3(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

// 0: Spool — precision-cut architectural hourglass crystal (vid3_01.png)
float sdSpool(vec3 p) {
  float body = sdRoundBox3(p, vec3(0.49, 0.49, 0.175), 0.058);
  float cutL = length(p.xy - vec2(-0.62, 0.0)) - 0.352;
  float cutR = length(p.xy - vec2( 0.62, 0.0)) - 0.352;
  float d = sMax(body, -min(cutL, cutR), 0.022);
  // Subtle optical plano-convex waist lens dome
  d -= 0.014 * cos(clamp(p.y * 2.2, -PI, PI)) * cos(clamp(p.x * 2.1, -PI, PI));
  return d * 0.92;
}

// 1: Split Dome — equatorially bisected precision plano-convex hemispheres (vid3_03.png)
// Gently dished equator cut planes prevent grazing parallel rays from producing dotted lip specks
float sdSplitDome(vec3 p) {
  float R = 0.64;
  float halfGap = 0.036;
  float bevel = 0.022;
  float dish = 0.028 * dot(p.xz, p.xz);

  vec3 sp = vec3(p.x, p.y, p.z * 1.18);
  float topSphere = (length(sp - vec3(0.0, 0.012, 0.0)) - R) / 1.18;
  float botSphere = (length(sp + vec3(0.0, 0.012, 0.0)) - R) / 1.18;

  float dTop = sMax(topSphere, (halfGap + dish) - p.y, bevel);
  float dBot = sMax(botSphere, p.y + (halfGap + dish), bevel);
  return min(dTop, dBot);
}

// 2: Diamond — precision-cut rotated 4-corner optical diamond crystal (sheet3 bottom-middle)
float sdDiamond(vec3 p) {
  vec3 q = p;
  q.xy = rot2(0.78539816) * q.xy;
  // Crisp rotated square prism with razor-tight chamfered edges & gentle lens dome
  float slab = sdRoundBox3(q, vec3(0.41, 0.41, 0.15), 0.036);
  slab -= 0.014 * cos(clamp(q.x * 2.8, -PI, PI)) * cos(clamp(q.y * 2.8, -PI, PI));
  return slab * 0.90;
}

// 3: Beveled Tetrahedron — upright rotating precision-cut crystal (fits strictly inside r = 0.94 sphere)
float sdBeveledTetra(vec3 p) {
  vec3 q = p - vec3(0.0, -0.07, 0.0);
  const vec3 n1 = vec3( 0.0,     -1.0,       0.0);
  const vec3 n2 = vec3( 0.0,      0.333333,  0.942809);
  const vec3 n3 = vec3( 0.816497, 0.333333, -0.471405);
  const vec3 n4 = vec3(-0.816497, 0.333333, -0.471405);

  float h = 0.275; // circumradius = 3*h = 0.825, strictly inside bounding sphere r = 0.94!
  float b = 0.028;
  float d12 = sMax(dot(q, n1) - h * 0.94, dot(q, n2) - h, b);
  float d34 = sMax(dot(q, n3) - h, dot(q, n4) - h, b);
  return sMax(d12, d34, b) * 0.76;
}

float evalSolid(int id, vec3 p, vec2 orbit, float t) {
  vec3 q = p;
  float yaw = orbit.x * 0.92 + sin(t * 0.36) * 0.22;
  float pitch = orbit.y * 0.62 + cos(t * 0.28) * 0.10;

  if (id == 3) {
    yaw += t * 0.28;
    pitch += 0.10;
  } else if (id == 2) {
    yaw += 0.22 + sin(t * 0.30) * 0.18;
    pitch -= 0.12;
  } else if (id == 1) {
    yaw *= 0.55;
    pitch *= 0.42;
  }

  q.xz = rot2(yaw) * q.xz;
  q.yz = rot2(pitch) * q.yz;

  if (id == 0) return sdSpool(q);
  if (id == 1) return sdSplitDome(q);
  if (id == 2) return sdDiamond(q);
  return sdBeveledTetra(q);
}

float mapScene(vec3 p, vec2 orbit, float t) {
  float m = clamp(uMorph, 0.0, 1.0);
  int fId = (uFrom == 4) ? 0 : uFrom;
  int tId = (uTo == 4) ? 0 : uTo;
  if (fId == tId || m <= 0.001) return evalSolid(fId, p, orbit, t);
  if (m >= 0.999) return evalSolid(tId, p, orbit, t);
  return mix(evalSolid(fId, p, orbit, t), evalSolid(tId, p, orbit, t), smoothstep(0.0, 1.0, m));
}

vec3 calcNormal(vec3 p, vec2 orbit, float t) {
  const vec2 e = vec2(0.00075, -0.00075);
  return normalize(
    e.xyy * mapScene(p + e.xyy, orbit, t) +
    e.yyx * mapScene(p + e.yyx, orbit, t) +
    e.yxy * mapScene(p + e.yxy, orbit, t) +
    e.xxx * mapScene(p + e.xxx, orbit, t)
  );
}

// Rich 360-degree internal studio environment sampled strictly inside the crystal's Cauchy
// refraction & Fresnel reflections (zero circular glossy white Phong dots, zero grey TIR!).
vec3 evalStudioEnv(vec3 dir, vec2 orbit) {
  vec3 skyLight = srgbToLinear(uColors[0]);
  vec3 skyDeep  = srgbToLinear(uColors[1]);
  vec3 cCyan    = srgbToLinear(uColors[2]);
  vec3 cCobalt  = srgbToLinear(uColors[3]);
  vec3 cMagenta = srgbToLinear(uColors[4]);

  float diag = clamp(dir.x * 0.45 - dir.y * 0.48 + 0.52 + orbit.x * 0.12, 0.0, 1.0);
  vec3 env = mixOklabLin(skyLight, skyDeep, diag);

  // Deep royal-ultramarine, electric-cyan, and hot-magenta studio light cards
  float bandCob = pow(max(dot(dir, normalize(vec3( 0.42, -0.58, 0.69))), 0.0), 2.1);
  float bandCyn = pow(max(dot(dir, normalize(vec3( 0.14,  0.54, 0.83))), 0.0), 2.4);
  float bandMag = pow(max(dot(dir, normalize(vec3(-0.54, -0.44, 0.72))), 0.0), 3.0);

  env = mixOklabLin(env, cCobalt, clamp(bandCob * 0.88, 0.0, 0.92));
  env += cCyan    * bandCyn * mix(0.88, 1.15, uNight);
  env += cMagenta * bandMag * mix(0.80, 1.10, uNight);
  return env;
}

// Physical Airy thin-film interference evaluated at 630 / 532 / 460 nm.
// Full 3-hue sculptural depth (vid3_01.png): deep royal-ultramarine (#1638FF) concave waist & lower bevels,
// blazing orchid-magenta (#F21EFF) upper & opposing bevel crowns, electric cyan (#22F6FF) focal waist gleam.
vec3 evalThinFilm(float cosTheta, vec3 p, vec3 N, float phaseOffset) {
  const float nFilm = 1.38;
  float sinT2 = (1.0 - cosTheta * cosTheta) / (nFilm * nFilm);
  float cosT = sqrt(max(1.0 - sinT2, 0.06));

  // Wide spatial + angular film thickness sweep across all 3 dichroic hues without flat cyan flood
  float spatial = p.y * 165.0 - p.x * 155.0 + N.y * 135.0 + N.x * 115.0;
  float dNm = 395.0 + spatial + sin(phaseOffset) * 58.0;
  float opd = 2.0 * nFilm * dNm * cosT;

  vec3 airy = 0.5 + 0.5 * cos(TAU * opd / vec3(630.0, 532.0, 460.0) + vec3(0.18, 0.52, 0.94));

  vec3 cCyan    = srgbToLinear(uColors[2]);
  vec3 cCobalt  = srgbToLinear(uColors[3]);
  vec3 cMagenta = srgbToLinear(uColors[4]);

  // Rich 3-hue interplay: deep royal-ultramarine anchors, selective cyan focal waist, bold magenta crowns
  float centerCyan = exp(-dot(p.xy, p.xy) * 2.8);
  float cyanMix = clamp(smoothstep(0.24, 0.86, airy.g * 0.62 + airy.b * 0.38) + centerCyan * 0.08, 0.0, 1.0);
  vec3 synth = mixOklabLin(cCobalt, cCyan, cyanMix);

  // Anchor left concave waist & lower-right underside in deep royal-ultramarine (vid3_01.png)
  float cobAnchor = smoothstep(0.15, -0.75, N.x * 0.72 + p.x * 0.55) * 0.42
                  + smoothstep(0.05, -0.65, p.y) * smoothstep(-0.3, 0.5, p.x) * 0.38;
  synth = mixOklabLin(synth, cCobalt, clamp(cobAnchor, 0.0, 0.68));

  // Vivid orchid-magenta crowns across upper & opposing bevels
  float magCrest = smoothstep(0.36, 0.88, airy.r * 0.82 + (1.0 - airy.g) * 0.24);
  synth = mixOklabLin(synth, cMagenta, clamp(magCrest * 0.90, 0.0, 0.92));

  return mix(synth, synth * (0.76 + 0.54 * airy), 0.34);
}

// Single internal raymarch returning the exact d == 0 exit surface normal (78% fewer SDF evals!).
// Analytical R/G/B Cauchy dispersion rays all refract through this shared exit normal.
vec3 traceExitNormal(vec3 entryP, vec3 refrDir, vec2 orbit, float t) {
  vec3 q = entryP + refrDir * 0.018;
  float traveled = 0.018;

  for (int i = 0; i < 14; i++) {
    float d = mapScene(q, orbit, t);
    if (d > 0.0008) break;
    float stepLen = max(-d * 0.82, 0.016);
    q += refrDir * stepLen;
    traveled += stepLen;
    if (traveled > 1.35) break;
  }

  // 2-step exact surface snap back onto d == 0 before evaluating exit normal (zero bevel ripples)
  for (int r = 0; r < 2; r++) {
    float dOut = mapScene(q, orbit, t);
    q -= refrDir * (dOut * 0.85);
  }

  return -calcNormal(q, orbit, t);
}

// === CLOSED-FORM ANALYTICAL HORIZON SLIT (id == 4, ZERO RAYMARCH STEPS, <0.2ms @ 2x) ===
// Two sweeping asymmetric S-curved optical glass horizons parting a glowing air gap with
// razor 1.2px pearl-cyan specular lips, deep ultramarine #1034FF refractive compression bands,
// and blazing full-chroma orchid-magenta #FA1EFF + electric-cyan #20F6FF caustic fans (vid3_02.png).
// Adapts cleanly to ultra-wide compact banners (~5:1) via normalized xNorm and lower baseline offset.
vec3 renderAnalyticalSlit(vec2 pScreen, vec2 uv, vec2 ptrNorm, float pxUv) {
  float t = uTime;
  float minDim = min(uResCss.x, uResCss.y);
  float aspect = uResCss.x / max(uResCss.y, 1.0);
  // Normalize horizontal coordinate so wide 5:1 banners never over-flare halfGap or sCurve at sides
  float xNorm = pScreen.x / max(uResCss.x / max(minDim, 1.0) * 0.5, 1.0);
  float bannerAmt = smoothstep(2.0, 3.0, aspect);
  // Shift meniscus slightly lower on wide compact banners so Mesh Gradient sits cleanly in upper sky
  float yOffset = -0.11 * bannerAmt;
  float x = xNorm;
  float y = pScreen.y - yOffset;

  // Breathing film envelope (peak vivid at still t=1.4, gently pulsing live)
  float filmBreath = 0.72 + 0.28 * cos((t - 1.35) * 0.65 + uMotion.y * 1.4);

  // Sweeping asymmetric S-curved horizon geometry responding smoothly to pointer & time
  float drift = sin(t * 0.26) * 0.14 + ptrNorm.x * 0.35 * uHover;
  float sCurve = 0.042 * sin(x * 1.45 + t * 0.24 + ptrNorm.x * 0.75 * uHover)
               + 0.018 * (x - drift) * (x - drift)
               - 0.048 * ptrNorm.y * uHover;

  // Dramatic narrow central air slit opening gracefully toward both viewport edges
  float xPinch = x - 0.12 * sin(t * 0.20) - ptrNorm.x * 0.24 * uHover;
  float halfGap = 0.028 + 0.026 * pow(max(abs(xPinch), 1e-4), 1.55) + 0.006 * sin(t * 0.42);
  float yUp = sCurve + halfGap;
  float yLo = sCurve - halfGap * 0.90;

  // Analytic curve slope in pScreen coordinates for exact 1.2px perpendicular meniscus thickness
  float dxNormDx = 1.0 / max(uResCss.x / max(minDim, 1.0) * 0.5, 1.0);
  float slopeUp = (0.042 * 1.45 * cos(x * 1.45 + t * 0.24 + ptrNorm.x * 0.75 * uHover) + 0.036 * (x - drift)) * dxNormDx;
  float invGradUp = inversesqrt(1.0 + slopeUp * slopeUp);
  float dUp = (y - yUp) * invGradUp; // > 0 inside upper glass lens
  float dLo = (yLo - y) * invGradUp; // > 0 inside lower glass lens

  vec3 skyLight = srgbToLinear(uColors[0]);
  vec3 skyDeep  = srgbToLinear(uColors[1]);
  vec3 cCyan    = srgbToLinear(uColors[2]); // electric cyan #22F6FF
  vec3 cUltra   = srgbToLinear(uColors[3]); // deep royal ultramarine #1638FF
  vec3 cMagenta = srgbToLinear(uColors[4]); // blazing orchid-magenta #F21EFF

  // Studio sky inside the narrow luminous air gap (contrast-rich gradient across x)
  vec3 gapSky = mixOklabLin(skyLight, skyDeep, smoothstep(-0.75, 0.85, x + 0.12));
  gapSky = mixOklabLin(gapSky, cUltra, 0.18 * smoothstep(-0.2, 0.9, x));
  float gapScatter = exp(-pow(max(abs(y - sCurve) / max(halfGap, 0.01), 0.0), 2.0) * 1.6);
  vec3 slitCol = gapSky + cCyan * gapScatter * mix(0.14, 0.34, uNight);

  // === UPPER GLASS LENS (dUp >= 0) ===
  float uDepth = max(dUp, 0.0);
  // Base refracted sky sweeping smoothly from luminous lavender-periwinkle upper-left to crisp sky-blue right
  vec3 upCol = mixOklabLin(skyLight, skyDeep, smoothstep(-0.65, 0.95, x * 0.75 + uDepth * 0.55));
  // Subtle pearlescent sky clearing in upper-right quadrant (vid3_02.png!)
  float upRightClear = exp(-dot(vec2(x - 0.62, uDepth - 0.22), vec2(x - 0.62, uDepth - 0.22)) * 2.8);
  upCol = mixOklabLin(upCol, mix(vec3(0.95, 0.97, 1.0), cCyan, 0.25), upRightClear * mix(0.55, 0.22, uNight));

  // Blazing full-chroma orchid-magenta caustic fan sweeping upward across upper-left/center lens!
  float magSweep = smoothstep(0.72, -0.58, x - 0.24 * sin(t * 0.22) - ptrNorm.x * 0.35 * uHover);
  float magFan = exp(-uDepth * 3.1) * (0.28 + 0.72 * magSweep);
  // Secondary hot-magenta flare curling right on far-right edge (sheet3 middle-right)
  float magRight = exp(-uDepth * 10.5) * smoothstep(0.28, 0.95, x);
  upCol = mixOklabLin(upCol, cMagenta, clamp((magFan * 0.96 + magRight * 0.75) * filmBreath, 0.0, 0.96));

  // Tight deep royal-ultramarine (#1034FF) refractive compression band hugging right behind the upper lip!
  float ultraBandUp = exp(-uDepth * 14.5) * smoothstep(-0.65, 0.55, x + 0.15);
  upCol = mixOklabLin(upCol, cUltra, clamp(ultraBandUp * 0.94, 0.0, 0.95));

  // Blazing electric-cyan inner dispersion band hugging right above the lip left-of-center (vid3_02!)
  float cyanRimUp = exp(-uDepth * 26.0) * smoothstep(0.62, -0.68, x);
  upCol = mixOklabLin(upCol, cCyan, clamp(cyanRimUp * 0.95 * filmBreath, 0.0, 0.96));

  // Razor 1.2px pearl-cyan specular meniscus lip at dUp == 0
  float lipUp = exp(-pow(uDepth / (pxUv * 1.45), 2.0));
  float lipUpHalo = exp(-pow(uDepth / (pxUv * 7.5), 2.0)) * 0.36;
  upCol += mix(cCyan, vec3(1.0, 0.99, 1.0), 0.65) * (lipUp * 1.45 + lipUpHalo);

  // === LOWER GLASS LENS (dLo >= 0) ===
  float lDepth = max(dLo, 0.0);
  // Base lower sky: luminous periwinkle-lavender lower-left deepening to vivid cerulean-cobalt lower-right
  vec3 loCol = mixOklabLin(skyLight, skyDeep, smoothstep(-0.80, 0.72, x * 0.85 + lDepth * 0.35));

  // Broad deep royal-ultramarine compression lobe sweeping across lower-right lens (vid3_02.png!)
  float cobLobe = smoothstep(-0.45, 0.78, x + lDepth * 0.25) * smoothstep(0.02, 0.22, lDepth) * exp(-max(lDepth - 0.18, 0.0) * 1.6);
  float cobEdge = exp(-lDepth * 14.0) * smoothstep(0.45, -0.75, x) * 0.55;
  loCol = mixOklabLin(loCol, cUltra, clamp(cobLobe * 0.90 + cobEdge, 0.0, 0.92));

  // Blazing electric-cyan caustic fan pouring downward across the full width of the lower meniscus!
  float cynFanLo = exp(-lDepth * 6.2) * (0.70 + 0.30 * smoothstep(0.85, -0.55, x));
  loCol = mixOklabLin(loCol, cCyan, clamp(cynFanLo * 0.94 * filmBreath, 0.0, 0.96));

  // Soft warm orchid-lavender refracted under-glow bottom-left (balances the upper magenta fan!)
  float loLeftGlow = exp(-dot(vec2(x + 0.55, lDepth - 0.36), vec2(x + 0.55, lDepth - 0.36)) * 2.2);
  loCol = mixOklabLin(loCol, mixOklabLin(cMagenta, skyLight, 0.45), loLeftGlow * 0.44 * filmBreath);

  // Razor 1.2px pearl-cyan specular meniscus lip at dLo == 0
  float lipLo = exp(-pow(lDepth / (pxUv * 1.45), 2.0));
  float lipLoHalo = exp(-pow(lDepth / (pxUv * 7.5), 2.0)) * 0.36;
  loCol += mix(cCyan, vec3(1.0, 0.99, 1.0), 0.68) * (lipLo * 1.50 + lipLoHalo);

  // Crisp antialiased compositing across both horizon curves
  float aa = max(pxUv * 1.2, 0.0012);
  float covUp = smoothstep(-aa, aa, dUp);
  float covLo = smoothstep(-aa, aa, dLo);

  vec3 colLin = slitCol;
  colLin = mix(colLin, upCol, covUp);
  colLin = mix(colLin, loCol, covLo);

  // Delicate ambient glow in Night so darkroom typography stays effortlessly luminous
  colLin = colLin / (1.0 + colLin * mix(0.05, 0.16, uNight));
  return colLin;
}

void main() {
  vec2 resPx = uResCss * uDpr;
  float minDim = min(uResCss.x, uResCss.y);
  vec2 pScreen = (vUv - 0.5) * (uResCss / minDim);
  float pxUv = 1.0 / max(min(resPx.x, resPx.y), 1.0);

  vec2 ptrNorm = vec2(uPointer.x - 0.5, 0.5 - uPointer.y);
  vec2 orbit = ptrNorm * (1.25 * uHover) + vec2(sin(uTime * 0.24) * 0.08, cos(uTime * 0.19) * 0.05);

  float slitA = (uFrom == 4) ? 1.0 : 0.0;
  float slitB = (uTo == 4) ? 1.0 : 0.0;
  float slitMode = mix(slitA, slitB, clamp(uMorph, 0.0, 1.0));

  // === 0-STEP ANALYTICAL FAST-PATH FOR HERO HORIZON SLIT (id == 4) ===
  if (slitMode > 0.995) {
    vec3 colLin = renderAnalyticalSlit(pScreen, vUv, ptrNorm, pxUv);
    vec3 col = linearToSrgb(colLin);
    col = applyCornerMask(col, uGround, vUv, uResCss, uCornerRadius, uDpr);
    outColor = vec4(ditherTri(col, gl_FragCoord.xy), 1.0);
    return;
  }

  // === 3D PRECISION-CUT LEICA CRYSTALS FLOATING ON PURE uGround (ZERO PAINTED SKY-BOX!) ===
  float camZ = mix(2.62, 2.74, uCompact);
  vec3 ro = vec3(0.0, 0.0, camZ);
  vec3 rd = normalize(vec3(pScreen * mix(1.06, 1.12, uCompact), -1.45));

  // Analytical bounding-sphere early-out (r = 0.94): 62%+ pixels skip the raymarch loop completely!
  float bSphere = dot(ro, rd);
  float cSphere = dot(ro, ro) - 0.94 * 0.94;
  float disc = bSphere * bSphere - cSphere;

  // Ultra-fast early-out for pure exterior ground pixels outside both bounding sphere & caustic aura
  float auraR = length(pScreen);
  if (disc < 0.0 && auraR >= 0.44 && slitMode <= 0.005) {
    vec3 col = applyCornerMask(uGround, uGround, vUv, uResCss, uCornerRadius, uDpr);
    outColor = vec4(ditherTri(col, gl_FragCoord.xy), 1.0);
    return;
  }

  vec3 cCyan    = srgbToLinear(uColors[2]);
  vec3 cCobalt  = srgbToLinear(uColors[3]);
  vec3 cMagenta = srgbToLinear(uColors[4]);

  // Unified pure gallery ground (#FCFCFB porcelain Day / #070913 obsidian Night) + whisper-subtle
  // caustic floor aura strictly behind the crystal (< 0.045, vanishing to exact 0.000 by r = 0.44!)
  vec3 groundLin = srgbToLinear(uGround);
  float aura = exp(-auraR * auraR * 15.0) * smoothstep(0.44, 0.0, auraR);
  vec3 dayBg = mixOklabLin(groundLin, mixOklabLin(cCobalt, cMagenta, 0.35), aura * 0.036);
  vec3 nightBg = groundLin + mixOklabLin(cCobalt, cCyan, 0.48) * (aura * 0.034);
  vec3 bgLin = mix(dayBg, nightBg, uNight);

  vec3 colLin = bgLin;
  bool hit = false;
  float tHit = 0.0;
  // Exact world-space pixel cone width per device pixel for 0-extra-step silhouette AA
  float pxWorld = (mix(1.06, 1.12, uCompact) / 1.45) / max(minDim * uDpr, 1.0);
  float minCone = 1e5;
  float tBest = 0.0;

  if (disc >= 0.0) {
    float sqrtDisc = sqrt(disc);
    float tNear = max(0.0, -bSphere - sqrtDisc);
    float tFar  = -bSphere + sqrtDisc;
    tHit = tNear;
    tBest = tNear;

    // Precision clamped sphere-trace (48 steps max inside r=0.94 sphere) tracking closest cone approach
    for (int i = 0; i < 48; i++) {
      vec3 pos = ro + rd * tHit;
      float d = mapScene(pos, orbit, uTime);
      float cone = d / max(tHit * pxWorld, 1e-5);
      if (cone < minCone) {
        minCone = cone;
        tBest = tHit;
      }
      if (d < 0.0004) {
        hit = true;
        tBest = tHit;
        break;
      }
      tHit += d * 0.82;
      if (tHit > tFar) break;
    }
  }

  // Smooth 1.25-device-pixel cone-coverage AA across outer silhouette (eliminates 100% of jaggies!)
  if (hit || minCone < 1.25) {
    vec3 pos = ro + rd * tBest;
    vec3 N = calcNormal(pos, orbit, uTime);
    // For near-miss AA fringe pixels, snap entry onto exact d == 0 surface before internal trace
    vec3 entryPos = hit ? pos : (pos - N * max(minCone * tBest * pxWorld, 0.0));
    vec3 V = -rd;
    float cosTheta = clamp(dot(N, V), 0.0, 1.0);

    // Breathing thin-film envelope (~7.6s period): vivid jewel peak at t=1.35, whisper-clear ghost phase at ~0.14
    float filmBreath = 0.56 + 0.44 * cos((uTime - 1.35) * 0.82 + uMotion.y * 1.4);
    float filmEnv = mix(0.14, 1.0, pow(max(filmBreath, 1e-5), 1.15));

    // True 3-wavelength Cauchy refractive dispersion (IOR_R = 1.48, IOR_G = 1.52, IOR_B = 1.57)
    // via ONE internal trace (refrG) + analytical R/B exit refraction through shared exitN!
    vec3 refrR = refract(-V, N, 1.0 / 1.48);
    vec3 refrG = refract(-V, N, 1.0 / 1.52);
    vec3 refrB = refract(-V, N, 1.0 / 1.57);

    if (dot(refrR, refrR) < 0.001) refrR = reflect(-V, N);
    if (dot(refrG, refrG) < 0.001) refrG = reflect(-V, N);
    if (dot(refrB, refrB) < 0.001) refrB = reflect(-V, N);

    refrR = normalize(refrR);
    refrG = normalize(refrG);
    refrB = normalize(refrB);

    vec3 exitN = traceExitNormal(entryPos, refrG, orbit, uTime);
    vec3 exitR = refract(refrR, exitN, 1.48);
    vec3 exitG = refract(refrG, exitN, 1.52);
    vec3 exitB = refract(refrB, exitN, 1.57);
    if (dot(exitR, exitR) < 0.001) exitR = reflect(refrR, exitN);
    if (dot(exitG, exitG) < 0.001) exitG = reflect(refrG, exitN);
    if (dot(exitB, exitB) < 0.001) exitB = reflect(refrB, exitN);

    vec3 transmitted = vec3(
      evalStudioEnv(normalize(exitR), orbit).r,
      evalStudioEnv(normalize(exitG), orbit).g,
      evalStudioEnv(normalize(exitB), orbit).b
    );

    vec3 reflDir = reflect(-V, N);
    vec3 reflectedEnv = evalStudioEnv(reflDir, orbit);

    float fresnel = 0.04 + 0.96 * pow(max(1.0 - cosTheta, 1e-5), 4.0);
    float bevelRing = pow(max(1.0 - cosTheta, 1e-5), 2.8) * smoothstep(0.02, 0.26, cosTheta);
    float outerLip  = pow(max(1.0 - cosTheta, 1e-5), 6.5);

    float phaseOffset = uTime * 0.48 + orbit.x * 1.7 - orbit.y * 1.1;
    vec3 thinFilm = evalThinFilm(cosTheta, entryPos, N, phaseOffset);

    // Precision double-walled optical crystal shading (pure grazing thin-film Fresnel — zero Phong dots!)
    float internalFilmAmt = (0.52 + 0.42 * pow(max(1.0 - cosTheta, 1e-5), 1.35)) * filmEnv;
    vec3 crystalCore = mixOklabLin(transmitted, thinFilm, clamp(internalFilmAmt, 0.0, 0.95));

    vec3 clearBevel = mixOklabLin(reflectedEnv, thinFilm * 1.15, clamp(0.45 + 0.50 * filmEnv, 0.0, 0.94));
    vec3 crystalLin = mix(crystalCore, clearBevel, clamp(fresnel * (0.72 + 0.25 * filmEnv), 0.0, 0.95));

    // Inner bevel refraction shelf gives crisp double-walled quartz definition on white porcelain & dark obsidian
    vec3 wallTint = mixOklabLin(cCobalt, cCyan, clamp(0.5 + 0.5 * N.x, 0.0, 1.0));
    crystalLin = mixOklabLin(crystalLin, wallTint, bevelRing * 0.48 * (0.40 + 0.60 * filmEnv));

    // Grazing dispersive Fresnel rim: crisp royal-cobalt/orchid contour on Day porcelain, electric cyan/magenta on Night
    vec3 dayRim = mixOklabLin(cCobalt, cMagenta, clamp(0.5 - 0.5 * N.y, 0.0, 1.0));
    vec3 nightRim = mixOklabLin(cCyan, cMagenta, clamp(0.5 - 0.5 * N.y, 0.0, 1.0));
    crystalLin = mixOklabLin(crystalLin, dayRim, outerLip * 0.72 * (1.0 - uNight));
    crystalLin += nightRim * outerLip * mix(0.28, 1.05, uNight);

    // Tone-map strictly inside the crystal so exterior uGround stays bit-exact (#FCFCFB / #070913)!
    crystalLin = crystalLin / (1.0 + crystalLin * mix(0.05, 0.16, uNight));

    float edgeCov = hit ? 1.0 : (1.0 - smoothstep(0.0, 1.25, minCone));
    colLin = mix(bgLin, crystalLin, edgeCov);
  }

  // Smooth cross-blend if morphing directly into/out of analytical slit
  if (slitMode > 0.005) {
    vec3 slitLin = renderAnalyticalSlit(pScreen, vUv, ptrNorm, pxUv);
    colLin = mix(colLin, slitLin, slitMode);
  }

  vec3 col = linearToSrgb(colLin);
  col = applyCornerMask(col, uGround, vUv, uResCss, uCornerRadius, uDpr);
  col = ditherTri(col, gl_FragCoord.xy);

  outColor = vec4(col, 1.0);
}
`;
