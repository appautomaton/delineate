// Plate IV — Lantern: Jeweler-Grade Superellipse Glass Carousel & Anamorphic Motion Blur.
// Two-pass WebGL2 pipeline:
//   Pass 1 (LANTERN_SCENE_FRAGMENT): Renders 6 continuous superellipses (|x/a|^4.6 + |y/b|^4.6 = 1)
//     at exact getLanternSlotRects() positions with blazing backlit Fresnel corner rims,
//     deep dark velvet cavities, OKLab harmonic grading (Spectrum / Mineral / Nocturne),
//     and all 6 jeweler-grade procedural motifs:
//       0 Tangent  — 0.9 CSS px hairline Bezier arch, tangent & diamond handles + warm caustic fan
//       1 Aperture — deep #040A24 velvet cavity + blazing sapphire rim + sharp cyan searchlight cone
//       2 Cipher   — phosphor emerald + 8 rows of 3x5 0/1 glyphs with horizontal edge DOF blur
//       3 Foci     — luminous warm ivory shell + twin amber hourglass caustics & diamond starburst
//       4 Warp     — blazing electric orchid crown over deep #060414 plum + 0.9px warped lattice
//       5 Reeded   — tangerine-vermilion lantern with 7 razor-sharp vertical cylindrical glass reeds
//   Pass 2 (LANTERN_COMPOSITE_FRAGMENT): 13-tap hardware-bilinear + IGN-jittered 1D horizontal
//     anamorphic motion blur with Y-band early-out, snapping razor-sharp on center lock.
import { COMMON_GLSL } from "./common.js";
export const LANTERN_SCENE_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResCss;
uniform float uDpr;
uniform float uTime;
uniform float uNight;
uniform vec3 uColors[5];  // OKLab harmonic grade anchors
uniform vec3 uGround;     // card surround ground (for corner mask)
uniform vec3 uBg;         // stage obsidian (#070A10) / cotton (#F3F1EA)
uniform vec2 uPointer;    // top-left normalized [0..1]
uniform float uHover;
uniform vec2 uMotion;
uniform float uCompact;
uniform float uCornerRadius;
uniform vec4 uRects[6];   // normalized top-left (cx, cy, halfW, halfH)
uniform float uDists[6];  // signed cyclic slot distance from center

${COMMON_GLSL}

// Exact gradient-normalized superellipse SDF (n = 4.6) in halfH units
float sdSuperellipse(vec2 qa, float aspect) {
  const float n = 4.6;
  float ux = max(abs(qa.x) / max(aspect, 0.1), 1e-5);
  float uy = max(abs(qa.y), 1e-5);
  float S = pow(ux, n) + pow(uy, n);
  float f = pow(S, 1.0 / n);
  float gx = (f / S) * pow(ux, n - 1.0) / max(aspect, 0.1);
  float gy = (f / S) * pow(uy, n - 1.0);
  float gLen = max(length(vec2(gx, gy)), 0.25);
  return (f - 1.0) / gLen;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

// Fine-pitch 3x5 procedural bitmap digit ('0' or '1') for Cipher lantern
float sampleBitGlyph(vec2 cellUv, int bit) {
  vec2 g = (cellUv - vec2(0.20, 0.16)) / vec2(0.60, 0.68);
  if (g.x < 0.0 || g.x > 1.0 || g.y < 0.0 || g.y > 1.0) return 0.0;
  int gx = clamp(int(floor(g.x * 3.0)), 0, 2);
  int gy = clamp(int(floor(g.y * 5.0)), 0, 4);
  int idx = gy * 3 + gx;
  int mask = (bit == 0) ? 31599 : 9879;
  return float((mask >> idx) & 1);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Smooth OKLab harmonic palette grade across all 6 distinct vessels
vec3 applyHarmonicGrade(vec3 linCol) {
  vec3 gLab = linearToOklab(srgbToLinear(uColors[2]));
  float gradeAmt = clamp((1.0 - gLab.x) * 4.2, 0.0, 1.0);
  if (gradeAmt < 0.002) return linCol;

  vec3 lab = linearToOklab(linCol);
  float chromaScale = mix(1.0, 0.80 + 0.16 * clamp(-gLab.z * 12.0, 0.0, 1.0), gradeAmt);
  lab.yz = lab.yz * chromaScale + gLab.yz * (0.48 * gradeAmt);
  float nocWeight = clamp(-gLab.z * 14.0, 0.0, 1.0);
  lab.x = mix(lab.x, pow(max(lab.x, 1e-5), 1.06), nocWeight * 0.45);
  return oklabToLinear(lab);
}

// Evaluates one glowing superellipse vessel (id 0..5).
// pxCss = 1 CSS pixel in card-local halfH units (ensures crisp 0.9 CSS px jeweler hairlines at 1x & 2x DPR).
vec3 evalVessel(int id, vec2 qa, float aspect, float sd, vec2 ptrOff, float pxUnit, float pxCss) {
  float t = uTime;
  vec2 q = vec2(qa.x / aspect, qa.y);

  // Blazing thick backlit superellipse Fresnel corner-rim profile (signature of vid4)
  float fresnelRim = pow(max(smoothstep(-0.24, 0.0, sd), 1e-5), 2.35);
  float innerWall  = smoothstep(-0.42, -0.02, sd);
  float cornerBias = pow(max(clamp(abs(q.x) * abs(q.y), 0.0, 1.0), 1e-5), 1.20);
  float rimBright  = clamp(fresnelRim * (0.80 + 0.52 * cornerBias), 0.0, 1.40);

  vec3 col = vec3(0.0);

  if (id == 0) {
    // === 0: TANGENT (1.48:1) — pearl/rose/tangerine + 0.9 CSS px jeweler Bezier & warm caustic fan ===
    vec3 cPearl = srgbToLinear(vec3(0.84, 0.89, 1.00));
    vec3 cRose  = srgbToLinear(vec3(0.95, 0.20, 0.46));
    vec3 cTang  = srgbToLinear(vec3(1.00, 0.40, 0.14));
    vec3 cPink  = srgbToLinear(vec3(0.94, 0.56, 0.84));

    vec2 apex = vec2(ptrOff.x * 0.22, 0.36 + ptrOff.y * 0.08);
    float warmCore = exp(-dot(qa - apex, qa - apex) * 2.15);
    float roseBody = exp(-dot((qa - vec2(0.0, 0.06)) * vec2(0.72, 0.95), (qa - vec2(0.0, 0.06)) * vec2(0.72, 0.95)) * 1.18);
    float lowerPearl = smoothstep(0.16, -0.92, qa.y) * 0.68 + rimBright * 0.80;

    col = mixOklabLin(cPink, cRose, clamp(roseBody * 0.96, 0.0, 1.0));
    col = mixOklabLin(col, cTang, clamp(warmCore * 0.96, 0.0, 1.0));
    col = mixOklabLin(col, cPearl, clamp(lowerPearl * 0.88, 0.0, 0.96));

    // Warm downward-radiating tangerine/rose caustic light-fan beneath the tangent vertex (vid4_03.png!)
    float archY = apex.y - 0.52 * (qa.x - apex.x) * (qa.x - apex.x);
    vec2 fromApex = qa - apex;
    float rApex = length(fromApex);
    float belowArch = smoothstep(archY + 0.03, archY - 0.04, qa.y);
    float fanWings = exp(-abs(qa.y - archY) * 5.2) * smoothstep(1.36, 0.18, abs(qa.x - apex.x));
    float fanRays = belowArch * exp(-rApex * 1.65) * (0.45 + 0.55 * pow(max(-fromApex.y / max(rApex, 0.01), 0.0), 1.4));
    col += mix(cTang, vec3(1.0, 0.84, 0.90), 0.55) * (fanWings * 0.34 + fanRays * 0.24);

    // Crisp ~0.9 CSS px jeweler hairlines: Bezier arch, tangent line, hollow circle node & diamond handles
    float hl = max(pxCss * 0.90, 0.0042);
    float dArch = abs(qa.y - archY) / sqrt(1.0 + pow(1.04 * (qa.x - apex.x), 2.0));
    float archLine = exp(-pow(dArch / hl, 2.0)) * smoothstep(1.24, 0.92, abs(qa.x));
    float archHalo = exp(-pow(dArch / (hl * 5.2), 2.0)) * 0.22 * smoothstep(1.26, 0.82, abs(qa.x));

    float hSpan = 0.88;
    float dTan = sdSegment(qa, vec2(apex.x - hSpan, apex.y), vec2(apex.x + hSpan, apex.y));
    float tanLine = exp(-pow(dTan / (hl * 0.92), 2.0));
    float rCirc = length(qa - apex);
    float circStroke = exp(-pow(abs(rCirc - 0.048) / (hl * 1.05), 2.0));
    float dDiamL = abs(abs(qa.x - (apex.x - hSpan)) + abs(qa.y - apex.y) - 0.046);
    float dDiamR = abs(abs(qa.x - (apex.x + hSpan)) + abs(qa.y - apex.y) - 0.046);
    float diamStroke = exp(-pow(min(dDiamL, dDiamR) / (hl * 0.98), 2.0));
    float insideAnchor = 1.0 - smoothstep(0.032, 0.044, rCirc);

    float motif = clamp((archLine * 0.98 + tanLine * (1.0 - insideAnchor) * 0.72 + circStroke * 1.20 + diamStroke * 0.78) + archHalo, 0.0, 1.40);
    col += vec3(1.0, 0.98, 0.99) * motif * 0.90;

  } else if (id == 1) {
    // === 1: APERTURE (0.94:1) — deep #040A24 velvet cavity, blazing sapphire rim, sharp cyan searchlight ===
    vec3 cCavity = srgbToLinear(vec3(0.0157, 0.0392, 0.141)); // deep #040A24 velvet
    vec3 cRoyal  = srgbToLinear(vec3(0.08, 0.30, 0.94));
    vec3 cSapph  = srgbToLinear(vec3(0.12, 0.78, 1.00));
    vec3 cRimIce = srgbToLinear(vec3(0.72, 0.80, 1.00));

    vec2 orbitPos = vec2(cos(t * 0.58) * 0.44 - 0.14, sin(t * 0.46) * 0.24 - 0.04);
    vec2 flarePos = mix(orbitPos, ptrOff * 0.55, 0.62 * uHover);

    vec2 fromFlare = qa - flarePos;
    float dFlare = length(fromFlare);
    vec2 beamAxis = normalize(-flarePos + vec2(0.001));
    float beamAlign = max(dot(normalize(fromFlare + vec2(1e-5)), beamAxis), 0.0);
    // Sharper volumetric cyan searchlight cone cutting across the dark velvet cavity (vid4_01/02)
    float beamCone = pow(max(beamAlign, 1e-5), 4.6) * exp(-dFlare * 1.05);
    float beamCore = pow(max(beamAlign, 1e-5), 11.0) * exp(-dFlare * 1.45);

    float cavityMask = exp(-dot((qa - vec2(-0.04, 0.02)) * vec2(1.12, 1.04), (qa - vec2(-0.04, 0.02)) * vec2(1.12, 1.04)) * 2.1);
    col = mixOklabLin(cRoyal, cCavity, clamp(cavityMask * 0.97, 0.0, 0.97));
    col = mixOklabLin(col, cSapph, clamp(beamCone * 0.94 + exp(-dFlare * 2.5) * 0.65, 0.0, 0.96));

    float pointCore = exp(-dFlare * 13.5) * 1.65 + exp(-dFlare * 4.5) * 0.52 + beamCore * 0.55;
    col += mix(cSapph, vec3(0.94, 0.99, 1.0), 0.72) * pointCore;

    col = mixOklabLin(col, cRimIce, clamp(rimBright * 0.84, 0.0, 0.94));
    col += cSapph * innerWall * 0.14;

  } else if (id == 2) {
    // === 2: CIPHER (1.62:1) — phosphor emerald glass + 8 rows of 3x5 glyphs with edge focal blur ===
    vec3 cDeep  = srgbToLinear(vec3(0.010, 0.18, 0.032));
    vec3 cEmer  = srgbToLinear(vec3(0.070, 0.76, 0.070));
    vec3 cGlow  = srgbToLinear(vec3(0.44, 0.98, 0.34));
    vec3 cRim   = srgbToLinear(vec3(0.80, 0.99, 0.76));

    vec2 glowC = vec2(-0.44 + ptrOff.x * 0.35, -0.10 + ptrOff.y * 0.2);
    float emGlow = exp(-dot((qa - glowC) * vec2(0.68, 0.95), (qa - glowC) * vec2(0.68, 0.95)) * 1.35);
    col = mixOklabLin(cDeep, cEmer, clamp(emGlow * 0.90 + 0.20, 0.0, 1.0));
    col = mixOklabLin(col, cGlow, clamp(pow(max(emGlow, 1e-5), 2.2) * 0.44, 0.0, 0.65));

    // 8 rows of 3x5 binary glyphs with true horizontal focal-blur softening toward the side bevels!
    vec2 gridP = vec2((qa.x / aspect) * 0.5 + 0.5, qa.y * 0.5 + 0.5);
    float rows = 8.0;
    float cols = 42.0;
    float rowY = (gridP.y - 0.14) / 0.72 * rows;
    float rowIdx = floor(rowY);

    if (rowIdx >= 0.0 && rowIdx < rows) {
      float drift = (mod(rowIdx, 2.0) < 0.5 ? 1.0 : -0.75) * (t * 0.55 + rowIdx * 1.7 + ptrOff.x * 1.2);
      float colX = gridP.x * cols + drift;
      float rowFrac = fract(rowY);

      // Horizontal focal blur grows smoothly toward the curved side bevels (abs(q.x) > 0.32)
      float edgeBlur = smoothstep(0.30, 0.88, abs(q.x));
      float spread = edgeBlur * 0.55;

      float gSum = 0.0;
      for (int s = -1; s <= 1; s++) {
        float sx = colX + float(s) * spread;
        float cIdx = floor(sx);
        float rnd = hash12(vec2(cIdx, rowIdx * 13.7));
        if (rnd > 0.16) {
          int bit = (rnd > 0.54) ? 1 : 0;
          float wTap = (s == 0) ? (1.0 - 0.42 * edgeBlur) : (0.21 * edgeBlur);
          gSum += sampleBitGlyph(vec2(fract(sx), rowFrac), bit) * wTap;
        }
      }

      float dofMask = smoothstep(0.03, 0.20, gridP.x) * smoothstep(0.97, 0.80, gridP.x)
                    * smoothstep(0.09, 0.26, gridP.y) * smoothstep(0.91, 0.74, gridP.y);
      float centerCalm = 1.0 - 0.40 * exp(-dot(qa * vec2(1.4, 2.8), qa * vec2(1.4, 2.8)) * 2.2);
      float rowPulse = 0.64 + 0.36 * sin(floor(colX) * 0.35 - t * 1.1 + rowIdx * 1.9);
      col += mix(cGlow, vec3(0.92, 1.0, 0.90), 0.52) * gSum * dofMask * centerCalm * rowPulse * 0.52;
    }

    col = mixOklabLin(col, cRim, clamp(rimBright * 0.78, 0.0, 0.92));

  } else if (id == 3) {
    // === 3: FOCI (1.00:1) — warm ivory shell + twin golden-amber hourglass caustics & diamond starburst ===
    vec3 cIvory = srgbToLinear(vec3(0.94, 0.90, 0.80));
    vec3 cShell = srgbToLinear(vec3(0.99, 0.98, 0.94));
    vec3 cAmber = srgbToLinear(vec3(0.99, 0.62, 0.12));
    vec3 cGold  = srgbToLinear(vec3(1.00, 0.82, 0.34));

    vec2 center = ptrOff * 0.16;
    vec2 qp = qa - center;

    float lobeTop = exp(-dot((qp - vec2(0.0,  0.40)) * vec2(1.05, 1.35), (qp - vec2(0.0,  0.40)) * vec2(1.05, 1.35)) * 2.2);
    float lobeBot = exp(-dot((qp - vec2(0.0, -0.40)) * vec2(1.05, 1.35), (qp - vec2(0.0, -0.40)) * vec2(1.05, 1.35)) * 2.2);
    float pinch = exp(-abs(abs(qp.y) - 0.14 - 0.38 * qp.x * qp.x) * 5.2);
    float lobes = clamp((lobeTop + lobeBot) * 0.94 + pinch * 0.34, 0.0, 1.0);

    col = mixOklabLin(cIvory, cAmber, lobes * 0.88);
    col = mixOklabLin(col, cGold, clamp(pinch * 0.48, 0.0, 0.72));

    float pulse = 0.92 + 0.08 * sin(t * 1.4);
    float streakH = exp(-abs(qp.y) * 20.0) * exp(-abs(qp.x) * 2.0);
    float streakV = exp(-abs(qp.x) * 18.0) * exp(-abs(qp.y) * 3.6);
    float coreHot = exp(-dot(qp, qp) * 16.0);
    col += vec3(1.0, 0.99, 0.96) * (coreHot * 1.35 + streakH * 0.96 + streakV * 0.48) * pulse;

    col = mixOklabLin(col, cShell, clamp(rimBright * 0.85, 0.0, 0.96));

  } else if (id == 4) {
    // === 4: WARP (1.66:1) — blazing electric orchid crown over deep #060414 plum + 0.9px curved lattice ===
    vec3 cPlum   = srgbToLinear(vec3(0.0235, 0.0157, 0.0784)); // deep #060414 velvet plum
    vec3 cViolet = srgbToLinear(vec3(0.54, 0.16, 0.94));
    vec3 cOrchid = srgbToLinear(vec3(0.96, 0.32, 1.00));
    vec3 cRimLav = srgbToLinear(vec3(0.86, 0.76, 1.00));

    float crown = smoothstep(-0.24, 0.86, qa.y + 0.18 * sin(qa.x * 1.1 + t * 0.35));
    float cavity = exp(-dot((qa - vec2(-0.04, -0.18)) * vec2(0.80, 1.12), (qa - vec2(-0.04, -0.18)) * vec2(0.80, 1.12)) * 1.48);
    col = mixOklabLin(cViolet, cOrchid, clamp(crown * 0.90, 0.0, 1.0));
    col = mixOklabLin(col, cPlum, clamp(cavity * 0.96, 0.0, 0.96));

    // Jeweler-fine ~0.9 CSS px curved perspective hairline lattice floating inside deep plum cavity
    vec2 wq = qa - ptrOff * 0.20;
    float r2 = dot(wq, wq);
    vec2 warped = wq * (1.0 + 0.25 * r2);
    vec2 gridCoord = warped * vec2(5.8, 5.8) + vec2(t * 0.18, 0.0);
    vec2 cellD = abs(fract(gridCoord + 0.5) - 0.5) / max(vec2(5.8) * (1.0 + 0.50 * r2), vec2(1.0));
    float hl = max(pxCss * 0.88, 0.0042);
    float lineX = exp(-pow(cellD.x / hl, 2.0));
    float lineY = exp(-pow(cellD.y / hl, 2.0));
    float lattice = max(lineX, lineY);
    float latWindow = exp(-dot((qa - vec2(0.0, -0.06)) * vec2(1.02, 1.50), (qa - vec2(0.0, -0.06)) * vec2(1.02, 1.50)) * 2.35);
    col += mix(cOrchid, vec3(0.98, 0.94, 1.0), 0.58) * lattice * latWindow * 0.44;

    col = mixOklabLin(col, cRimLav, clamp(rimBright * 0.78, 0.0, 0.92));

  } else {
    // === 5: REEDED (0.94:1) — tangerine-vermilion lantern with 7 razor-sharp vertical cylindrical reeds ===
    vec3 cVerm  = srgbToLinear(vec3(0.86, 0.25, 0.03));
    vec3 cTang  = srgbToLinear(vec3(0.99, 0.50, 0.10));
    vec3 cGold  = srgbToLinear(vec3(1.00, 0.82, 0.34));
    vec3 cRim   = srgbToLinear(vec3(1.00, 0.80, 0.60));

    // 7 crisp vertical cylindrical flutes across right half (qa.x > -0.02, matching sheet4)
    float fluteMask = smoothstep(-0.04, 0.03, qa.x);
    float fluteFreq = 7.4; // ~7 distinct vertical reeds across right half [0 .. 0.94]
    float flutePhase = fract((qa.x + 0.02) * fluteFreq);
    float cylNx = (flutePhase - 0.5) * 2.0;
    float cylNz = sqrt(max(1.0 - cylNx * cylNx, 0.02));

    vec2 sampleQa = qa;
    sampleQa.x -= cylNx * 0.26 * fluteMask;

    vec2 glowPos = vec2(0.32 + ptrOff.x * 0.25 + sin(t * 0.4) * 0.08, 0.06 + ptrOff.y * 0.18);
    float innerCore = exp(-dot((sampleQa - glowPos) * vec2(1.25, 0.85), (sampleQa - glowPos) * vec2(1.25, 0.85)) * 1.8);
    float vertSpine = exp(-pow((sampleQa.x - 0.28) * 2.4, 2.0)) * smoothstep(1.05, 0.1, abs(sampleQa.y));

    col = mixOklabLin(cVerm, cTang, clamp(0.35 + innerCore * 0.65, 0.0, 1.0));
    col = mixOklabLin(col, cGold, clamp(vertSpine * 0.76 + innerCore * 0.45, 0.0, 0.94));

    // Razor-sharp cylindrical refraction caustics, deep shadow valleys & gleaming specular ridge spines
    float vFade = smoothstep(0.94, 0.14, abs(qa.y));
    float fluteCaustic = pow(max(cylNz, 1e-5), 4.2) * (0.42 + 0.58 * vFade);
    float fluteValley  = smoothstep(0.62, 0.98, abs(cylNx));
    float fluteSpec    = pow(max(cylNx * 0.62 + cylNz * 0.78, 0.0), 36.0) * vFade;
    float fluteFadeR   = smoothstep(aspect * 0.96, aspect * 0.74, qa.x);

    vec3 flutedCol = col * (0.72 + 0.52 * fluteCaustic) * (1.0 - 0.36 * fluteValley);
    flutedCol += cGold * fluteCaustic * 0.42 + vec3(1.0, 0.97, 0.86) * fluteSpec * 0.48;
    col = mix(col, flutedCol, fluteMask * fluteFadeR);

    col = mixOklabLin(col, cRim, clamp(rimBright * 0.78, 0.0, 0.90));
  }

  col = applyHarmonicGrade(col);

  float backlit = max(uNight, uCompact);
  vec3 dayLift = mix(col, col * 0.94 + vec3(0.06, 0.055, 0.05), 0.35);
  col = mix(dayLift, col, backlit);

  float edgeGleam = exp(-pow(abs(sd) / max(pxUnit * 2.0, 0.012), 2.0));
  col += vec3(0.24, 0.25, 0.30) * edgeGleam * mix(0.45, 0.88, backlit);

  return col;
}

void main() {
  vec2 uvTL = vec2(vUv.x, 1.0 - vUv.y);
  vec2 pPx = uvTL * uResCss;
  vec3 bgLin = srgbToLinear(uBg);
  vec3 colLin = bgLin;

  // === COMPACT MODE (Landing Card Slot): Obsidian vitrine + unclipped Tangent + peeking blurred flanks ===
  if (uCompact > 0.5) {
    vec3 vitrineLin = srgbToLinear(vec3(0.035, 0.047, 0.078));
    colLin = vitrineLin;

    float cardH = min(uResCss.y * 0.52, uResCss.x * 0.46);
    float halfH = cardH * 0.5;
    float gap = cardH * 0.12;
    vec2 center = uResCss * 0.5;
    vec2 ptrOff = vec2(uPointer.x - 0.5, 0.5 - uPointer.y) * uHover;

    float heroAsp = 1.44;
    float leftAsp = 0.94;
    float rightAsp = 0.94;

    float heroHalfW = halfH * heroAsp;
    float leftHalfW = halfH * leftAsp;
    float rightHalfW = halfH * rightAsp;
    float sway = sin(uTime * 0.45) * (cardH * 0.045);

    for (int k = 0; k < 3; k++) {
      int vid = (k == 0) ? 5 : ((k == 1) ? 1 : 0);
      float asp = (k == 0) ? leftAsp : ((k == 1) ? rightAsp : heroAsp);
      float cx = center.x + sway;
      if (k == 0) cx -= heroHalfW + gap + leftHalfW;
      if (k == 1) cx += heroHalfW + gap + rightHalfW;

      vec2 qa = vec2((pPx.x - cx) / halfH, (center.y - pPx.y) / halfH);
      float sd = sdSuperellipse(qa, asp);

      if (sd > -0.04 && sd < 0.44) {
        float halo = exp(-max(sd, 0.0) * 8.5) * smoothstep(0.44, 0.0, sd);
        vec3 tint = (vid == 0) ? vec3(0.95, 0.42, 0.52) : ((vid == 1) ? vec3(0.16, 0.65, 0.98) : vec3(0.96, 0.48, 0.12));
        colLin += srgbToLinear(tint) * halo * 0.10;
      }

      float edgeAA = (k == 2) ? (1.15 / max(halfH * uDpr, 1.0)) : 0.16;
      if (sd < edgeAA * 2.5) {
        float pxU = 1.15 / max(halfH * uDpr, 1.0);
        float pxC = 1.0 / max(halfH, 1.0);
        vec3 vCol = evalVessel(vid, qa, asp, sd, (k == 2) ? ptrOff : vec2(0.0), pxU, pxC);
        if (k != 2) vCol = mix(vCol, vitrineLin, 0.24);
        float cov = 1.0 - smoothstep(-edgeAA, edgeAA, sd);
        colLin = mix(colLin, vCol, cov);
      }
    }

    vec3 outCol = linearToSrgb(colLin / (1.0 + colLin * 0.12));
    outCol = applyCornerMask(outCol, uGround, vUv, uResCss, uCornerRadius, uDpr);
    outCol = ditherTri(outCol, gl_FragCoord.xy);
    outColor = vec4(outCol, 1.0);
    return;
  }

  // === FULL STAGE MODE (Pass 1 -> FBO): Crisp superellipse carousel (vertical or horizontal) ===
  for (int i = 0; i < 6; i++) {
    vec4 r = uRects[i];
    vec2 centerPx = r.xy * uResCss;
    vec2 halfPx = r.zw * uResCss;

    float padPx = max(halfPx.x, halfPx.y) * 0.72;
    if (abs(pPx.x - centerPx.x) > halfPx.x + padPx) continue;
    if (abs(pPx.y - centerPx.y) > halfPx.y + padPx) continue;

    float halfH = max(halfPx.y, 1.0);
    float aspect = halfPx.x / halfH;
    vec2 qa = vec2((pPx.x - centerPx.x) / halfH, (centerPx.y - pPx.y) / halfH);
    float sd = sdSuperellipse(qa, aspect);

    if (sd > -0.02 && sd < 0.56) {
      if (sd < 0.42) {
        float spill = exp(-max(sd, 0.0) * 10.0) * smoothstep(0.42, 0.0, sd);
        vec3 spillTint = (i == 0) ? vec3(0.92, 0.45, 0.58)
                       : (i == 1) ? vec3(0.18, 0.58, 0.98)
                       : (i == 2) ? vec3(0.16, 0.85, 0.20)
                       : (i == 3) ? vec3(0.98, 0.76, 0.34)
                       : (i == 4) ? vec3(0.84, 0.38, 0.96)
                       :            vec3(0.95, 0.48, 0.14);
        colLin += applyHarmonicGrade(srgbToLinear(spillTint)) * spill * 0.08 * uNight;
      }

      // Skip extra sdSuperellipse drop-shadow completely in permanent obsidian darkroom (uNight >= 0.99)
      if (uNight < 0.99) {
        vec2 qaShad = vec2((pPx.x - centerPx.x) / halfH, (centerPx.y + 11.0 - pPx.y) / halfH);
        float sdShad = sdSuperellipse(qaShad, aspect);
        float aoWide = exp(-max(sdShad, 0.0) * 5.6) * smoothstep(0.56, 0.0, sdShad);
        float aoTight = exp(-max(sd, 0.0) * 18.0) * smoothstep(0.18, 0.0, sd);
        float ao = clamp(aoWide * 0.20 + aoTight * 0.08, 0.0, 0.28) * (1.0 - uNight);
        colLin *= (1.0 - ao);
      }
    }

    float pxUnit = 1.0 / max(halfH * uDpr, 1.0);
    float pxCss = 1.0 / max(halfH, 1.0);
    float aa = max(pxUnit * 1.25, 0.003);

    if (sd < aa * 2.0) {
      float focusAmt = smoothstep(0.65, 0.05, abs(uDists[i])) * uHover;
      vec2 ptrLocal = vec2((uPointer.x * uResCss.x - centerPx.x) / max(halfPx.x, 1.0),
                           (centerPx.y - uPointer.y * uResCss.y) / halfH);
      vec2 ptrOff = clamp(ptrLocal, -1.0, 1.0) * focusAmt;

      vec3 vesselLin = evalVessel(i, qa, aspect, sd, ptrOff, pxUnit, pxCss);
      float cov = 1.0 - smoothstep(-aa, aa, sd);
      colLin = mix(colLin, vesselLin, cov);
    }
  }

  vec3 outLinear = colLin / (1.0 + colLin * 0.12);
  outColor = vec4(linearToSrgb(outLinear), 1.0);
}
`;
export const LANTERN_COMPOSITE_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uSceneTex;
uniform vec2 uResCss;
uniform float uDpr;
uniform vec3 uGround;
uniform vec2 uMotion;
uniform float uVertical;   // > 0.5 = vertical Y-axis anamorphic blur; <= 0.5 = horizontal X-axis
uniform float uCenterSpan; // centered card half-span along scroll axis (normalized UV)
uniform float uCenterDist; // min |dist| from center lock (0..0.5)
uniform float uBandSpan;   // orthogonal band half-span + spill margin for early-out
uniform float uCornerRadius;

${COMMON_GLSL}

// Uncorrelated 2D spatial hash (eliminates diagonal coherent cross-hatch moire during wide glides)
float blurHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  bool vert = uVertical > 0.5;

  // Fast orthogonal-band early-out: skip 13-tap kernel in empty obsidian margins
  float orthoDist = vert ? abs(vUv.x - 0.5) : abs(vUv.y - 0.5);
  if (orthoDist > uBandSpan) {
    vec3 col = texture(uSceneTex, vUv).rgb;
    col = applyCornerMask(col, uGround, vUv, uResCss, uCornerRadius, uDpr);
    col = ditherTri(col, gl_FragCoord.xy);
    outColor = vec4(col, 1.0);
    return;
  }

  // Distance outside centered vessel along active scroll axis: center snaps 0px razor sharp at rest!
  float axisCoord = vert ? vUv.y : vUv.x;
  float edgeDist = max(0.0, abs(axisCoord - 0.5) - (uCenterSpan + 0.010));
  float flankFactor = smoothstep(0.0, 0.12, edgeDist);

  float speed = abs(uMotion.x);
  float motionFactor = clamp(speed * 0.26 + smoothstep(0.035, 0.42, uCenterDist) * 0.58, 0.0, 1.50);

  float axisRes = vert ? uResCss.y : uResCss.x;
  float maxRadiusCss = clamp(axisRes * (vert ? 0.044 : 0.038), 16.0, 48.0);
  float radiusCss = maxRadiusCss * clamp(flankFactor * 0.88 + motionFactor * (0.54 + 0.46 * flankFactor), 0.0, 1.50);

  if (radiusCss < 0.35) {
    vec3 col = texture(uSceneTex, vUv).rgb;
    col = applyCornerMask(col, uGround, vUv, uResCss, uCornerRadius, uDpr);
    col = ditherTri(col, gl_FragCoord.xy);
    outColor = vec4(col, 1.0);
    return;
  }

  // 17-tap (-8..8) uncorrelated-jitter hardware-bilinear 1D anamorphic kernel (<0.08ms on RGBA8):
  // liquid-smooth vertical & horizontal glide trails with zero diagonal IGN cross-hatch moire!
  float radiusUv = radiusCss / max(axisRes, 1.0);
  float stepUv = radiusUv / 8.0;
  float jitter = (blurHash(gl_FragCoord.xy) - 0.5) * stepUv * 0.85;

  vec3 accum = vec3(0.0);
  float weightSum = 0.0;

  for (int i = -8; i <= 8; i++) {
    float fi = float(i);
    float offset = fi * stepUv + jitter;
    vec2 sampleUv = vert
      ? vec2(vUv.x, clamp(vUv.y + offset, 0.0005, 0.9995))
      : vec2(clamp(vUv.x + offset, 0.0005, 0.9995), vUv.y);
    float x = fi / 4.4;
    float w = exp(-0.5 * x * x);
    vec3 tapLin = srgbToLinear(texture(uSceneTex, sampleUv).rgb);
    accum += tapLin * w;
    weightSum += w;
  }

  vec3 col = linearToSrgb(accum / max(weightSum, 1e-5));
  col = applyCornerMask(col, uGround, vUv, uResCss, uCornerRadius, uDpr);
  col = ditherTri(col, gl_FragCoord.xy);

  outColor = vec4(col, 1.0);
}
`;
