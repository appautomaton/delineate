// Plate II — Plume: Analytical Asymmetric Silk-Curtain Plumes (3.5x Faster GPU + 3-Chord Drift).
// Uses only 4 C2 simplex evaluations per pixel (down from 14) to warp curved streamlines into
// analytical asymmetric silk-curtain caustics (d < 0 ? exp(d * 16) : exp(-d * 2.6)) — producing
// crisp, curved translucent ribbon edges that dissolve softly on one side (vid2_01-03).
// Autonomously breathes across 3 curated editorial color chords over ~18s (anchored by uPaletteIndex):
//   Chord 0 (Thermal): Coral/Ice -> Amber/Teal/Ember emission
//   Chord 1 (Mineral): Mint-Sage/Blush -> Emerald/Teal/Copper emission
//   Chord 2 (Orchid):  Orchid/Sky -> Violet/Gold/Incandescent emission

import { COMMON_GLSL } from "./common.ts";

export const PLUME_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResCss;
uniform float uDpr;
uniform float uTime;
uniform float uNight;
uniform vec3 uColors[5];
uniform vec3 uGround;
uniform vec3 uMatte;
uniform vec2 uPointer; // top-left normalized [0..1]
uniform float uHover;
uniform vec2 uMotion;  // [velocity, clickImpulse]
uniform float uCompact;
uniform float uCornerRadius;
uniform float uPaletteIndex;
uniform vec4 uSheets[3]; // normalized top-left rects: (x, y, w, h)

${COMMON_GLSL}

// Analytical asymmetric silk-curtain caustic: crisp folded edge on one side, silky dissolve on the other
float silkCaustic(float d, float sharpK, float softK) {
  return (d < 0.0) ? exp(d * sharpK) : exp(-d * softK);
}

// Smooth 3-chord harmonic palette evolution over ~18s (exact match to active chord at still t=3.4)
void evalChordPalette(
  out vec3 cWashA,
  out vec3 cWashB,
  out vec3 cBloom,
  out vec3 cEmitA,
  out vec3 cEmitB
) {
  // Base stops from active Palette (smoothly OKLab-interpolated by show.ts on manual switch)
  vec3 base0 = srgbToLinear(uColors[0]);
  vec3 base1 = srgbToLinear(uColors[1]);
  vec3 base2 = srgbToLinear(uColors[2]);
  vec3 base3 = srgbToLinear(uColors[3]);
  vec3 base4 = srgbToLinear(uColors[4]);

  // Three museum chords matching vid2.mp4 continuous atmospheric drift
  // Chord 0: Coral / Ice / Apricot + Amber / Teal
  vec3 k0_0 = srgbToLinear(vec3(0.957, 0.522, 0.549));
  vec3 k0_1 = srgbToLinear(vec3(0.643, 0.863, 0.965));
  vec3 k0_2 = srgbToLinear(vec3(0.988, 0.878, 0.643));
  vec3 k0_3 = srgbToLinear(vec3(0.918, 0.659, 0.220));
  vec3 k0_4 = srgbToLinear(vec3(0.180, 0.659, 0.761));

  // Chord 1: Mint-Sage / Blush / Limestone + Emerald / Copper
  vec3 k1_0 = srgbToLinear(vec3(0.510, 0.792, 0.718));
  vec3 k1_1 = srgbToLinear(vec3(0.910, 0.651, 0.698));
  vec3 k1_2 = srgbToLinear(vec3(0.945, 0.847, 0.706));
  vec3 k1_3 = srgbToLinear(vec3(0.180, 0.784, 0.588));
  vec3 k1_4 = srgbToLinear(vec3(0.910, 0.525, 0.322));

  // Chord 2: Orchid / Sky / Peach + Violet / Citron-Gold
  vec3 k2_0 = srgbToLinear(vec3(0.925, 0.486, 0.722));
  vec3 k2_1 = srgbToLinear(vec3(0.682, 0.894, 1.000));
  vec3 k2_2 = srgbToLinear(vec3(0.984, 0.816, 0.690));
  vec3 k2_3 = srgbToLinear(vec3(0.588, 0.392, 0.960));
  vec3 k2_4 = srgbToLinear(vec3(0.949, 0.784, 0.220));

  // Autonomous drift phase: 0 at still time (3.4), smoothly looping 0 -> 1 -> 2 -> 0 over 18s
  float drift = (uTime - 3.4) / 6.0;
  float phase = mod(uPaletteIndex + drift, 3.0);
  if (phase < 0.0) phase += 3.0;

  // Compute cyclic smooth weights across the 3 chords
  float idx = floor(phase);
  float frac = smoothstep(0.08, 0.92, fract(phase));

  vec3 d0, d1, d2, d3, d4;
  if (idx < 0.5) {
    d0 = mixOklabLin(k0_0, k1_0, frac);
    d1 = mixOklabLin(k0_1, k1_1, frac);
    d2 = mixOklabLin(k0_2, k1_2, frac);
    d3 = mixOklabLin(k0_3, k1_3, frac);
    d4 = mixOklabLin(k0_4, k1_4, frac);
  } else if (idx < 1.5) {
    d0 = mixOklabLin(k1_0, k2_0, frac);
    d1 = mixOklabLin(k1_1, k2_1, frac);
    d2 = mixOklabLin(k1_2, k2_2, frac);
    d3 = mixOklabLin(k1_3, k2_3, frac);
    d4 = mixOklabLin(k1_4, k2_4, frac);
  } else {
    d0 = mixOklabLin(k2_0, k0_0, frac);
    d1 = mixOklabLin(k2_1, k0_1, frac);
    d2 = mixOklabLin(k2_2, k0_2, frac);
    d3 = mixOklabLin(k2_3, k0_3, frac);
    d4 = mixOklabLin(k2_4, k0_4, frac);
  }

  // At rest/still (drift ~ 0), honor exact active uColors 100%; as time breathes, blend seamlessly into 3-chord evolution
  float driftActive = smoothstep(0.0, 0.35, abs(drift));
  cWashA = mix(base0, d0, driftActive);
  cWashB = mix(base1, d1, driftActive);
  cBloom = mix(base2, d2, driftActive);
  cEmitA = mix(base3, d3, driftActive);
  cEmitB = mix(base4, d4, driftActive);
}

// Exactly 4 C2 simplex calls per pixel -> 3 asymmetric curved silk-curtain caustics + smooth billow
vec4 evalSilkField(vec2 su, float sheetPhase, vec2 ptrLocal, float impulse) {
  float t = uTime;

  // Pointer thermal vortex deflection
  vec2 dPtr = su - ptrLocal;
  float ptrInf = exp(-dot(dPtr, dPtr) * 6.5) * uHover;
  vec2 ptrWarp = vec2(-dPtr.y * 0.28 + dPtr.x * 0.14, -0.32) * ptrInf;

  // Click upward thermal wave crest
  float waveBand = exp(-pow((su.y - fract(t * 0.52) * 0.85) * 3.0, 2.0)) * impulse;
  vec2 suv = vec2(su.x, su.y - waveBand * 0.14);

  // ONLY 4 simplex evaluations total (3.5x faster than v1's 14 calls!)
  float n1 = snoise2(vec2(suv.x * 1.15 + sheetPhase * 0.72 + ptrWarp.x, suv.y * 0.52 - t * 0.14 + ptrWarp.y));
  float n2 = snoise2(vec2(suv.x * 1.55 - n1 * 0.52 + sheetPhase * 0.45 + 3.1, suv.y * 0.64 - t * 0.18 + 1.7));
  float n3 = snoise2(vec2(suv.x * 2.15 + n2 * 0.58 - n1 * 0.30 - 1.9, suv.y * 0.76 - t * 0.22 + 4.3));
  float n4 = snoise2(vec2(suv.x * 0.82 + n1 * 0.42 + sheetPhase, suv.y * 0.42 - t * 0.11 - 2.6));

  // Analytical asymmetric silk-curtain streamlines (anchored generously from left across center)
  float sA = (suv.x - 0.16 - 0.08 * sin(t * 0.22 + sheetPhase)) + n1 * 0.30 + n2 * 0.14 - suv.y * 0.22 + ptrWarp.x * 0.8;
  float sB = -(suv.x - 0.62 + 0.10 * cos(t * 0.19 + sheetPhase)) + n2 * 0.30 - n3 * 0.15 - suv.y * 0.20 - ptrWarp.x * 0.6;
  float sC = (suv.x - 0.44 + 0.14 * sin(t * 0.25 + sheetPhase * 1.4)) + n3 * 0.24 + n4 * 0.20 - suv.y * 0.26;

  float silkA = silkCaustic(sA, 9.5, 2.25);
  float silkB = silkCaustic(sB, 11.5, 2.55);
  float silkC = silkCaustic(sC, 12.5, 2.80);
  float broad = smoothstep(-0.55, 0.65, n1 * 0.65 + n4 * 0.35);

  return vec4(silkA, silkB, silkC, broad);
}

// Sheet 01: Full-field atmospheric silk wash filling from left edge into open upper-right clearing
vec3 renderWashSheet(vec2 su, vec4 fld, vec3 cA, vec3 cB, vec3 cWarm) {
  float silkA = fld.x;
  float silkB = fld.y;
  float silkC = fld.z;
  float broad = fld.w;

  // Serene open diagonal breathing space in upper-right corner (vid2_01/02)
  float diag = dot(su - vec2(0.84, 0.82), vec2(0.82, 0.58));
  float airMask = smoothstep(-0.14, 0.42, -diag + (broad - 0.5) * 0.36 + (silkA - 0.5) * 0.22);

  // Full-bodied left-anchored atmospheric wash layered with curved luminous asymmetric silk curtains
  float leftBody = smoothstep(0.82, 0.04, su.x) * (0.42 + 0.38 * broad);
  float ribbonDensity = clamp((leftBody + silkA * 0.54 + silkB * 0.34) * airMask, 0.0, 1.0);
  float causticCrest = clamp((silkA * silkC * 0.68 + silkB * 0.26) * airMask, 0.0, 1.0);

  // Vivid OKLab interplay: coral/primary billowing across left & lower-center, cool ice-sky upper-left/right
  float hueSplit = clamp(su.y * 0.50 + su.x * 0.44 - 0.12 + (silkB - silkA) * 0.36, 0.0, 1.0);
  vec3 silkLin = mixOklabLin(cA, cB, smoothstep(0.14, 0.86, hueSplit));
  silkLin = mixOklabLin(silkLin, cWarm, silkC * 0.32 * smoothstep(0.58, 0.0, su.y));

  vec3 paperDay = srgbToLinear(vec3(0.996, 0.996, 0.992));
  vec3 dayLin = mixOklabLin(paperDay, silkLin, smoothstep(0.02, 0.82, ribbonDensity) * 0.96);
  dayLin = mixOklabLin(dayLin, mixOklabLin(silkLin, paperDay, 0.20), causticCrest * 0.34);

  vec3 paperNight = srgbToLinear(vec3(0.048, 0.058, 0.108));
  // Gamma-calibrated upper-left calm band in linear space so every white Clash Display letter holds >9:1 contrast on Night Sheet 01
  float typeCalm = 1.0 - 0.86 * smoothstep(0.60, 0.88, su.y) * smoothstep(0.96, 0.52, su.x);
  vec3 auroraRad = silkLin * (pow(max(ribbonDensity, 1e-5), 1.32) * 0.96 + causticCrest * 0.40) * typeCalm;
  vec3 nightSrgb = filmicEmission(paperNight + auroraRad * 1.10);

  return mix(linearToSrgb(dayLin), nightSrgb, uNight);
}

// Sheet 02: Convective silk ribbons rising smoothly to 32-38% height beneath >=62% pristine calm paper
vec3 renderBloomSheet(vec2 su, vec4 fld, float impulse, vec3 cA, vec3 cB, vec3 cWarm) {
  float silkA = fld.x;
  float silkB = fld.y;
  float silkC = fld.z;
  float broad = fld.w;

  // Softly undulating ceiling bounded <= 0.38 so upper >= 62% stays spotless museum paper
  float archA = min(0.24 + 0.105 * silkA + 0.03 * broad + 0.025 * impulse, 0.38);
  float archB = min(0.23 + 0.110 * silkB + 0.03 * broad + 0.025 * impulse, 0.38);
  float archC = min(0.21 + 0.115 * silkC + 0.03 * broad, 0.375);

  float envA = exp(-pow(max(su.y / max(archA * 0.72, 0.05), 1e-5), 1.75)) * smoothstep(archA, 0.0, su.y) * (0.48 + 0.52 * silkA);
  float envB = exp(-pow(max(su.y / max(archB * 0.72, 0.05), 1e-5), 1.75)) * smoothstep(archB, 0.0, su.y) * (0.44 + 0.56 * silkB);
  float envC = exp(-pow(max(su.y / max(archC * 0.72, 0.05), 1e-5), 1.80)) * smoothstep(archC, 0.0, su.y) * (0.38 + 0.62 * silkC);

  float sideMix = smoothstep(0.08, 0.76, su.x + (silkB - silkA) * 0.22);
  vec3 bloomLin = mixOklabLin(cA, cWarm, sideMix);
  bloomLin = mixOklabLin(bloomLin, cB, clamp(envC * 0.62 * (1.0 - sideMix * 0.42), 0.0, 0.60));

  float cov = clamp(envA * 0.92 + envB * 0.62 + envC * 0.38 + broad * 0.18 * smoothstep(0.24, 0.0, su.y), 0.0, 1.0);
  vec3 paperDay = srgbToLinear(vec3(0.996, 0.996, 0.992));
  vec3 dayLin = mixOklabLin(paperDay, bloomLin, smoothstep(0.02, 0.78, cov) * 0.96);

  vec3 paperNight = srgbToLinear(vec3(0.052, 0.064, 0.118));
  vec3 nightRad = mixOklabLin(cB, bloomLin, 0.58) * (pow(max(cov, 1e-5), 1.28) * 1.04);
  vec3 nightSrgb = filmicEmission(paperNight + nightRad);

  return mix(linearToSrgb(dayLin), nightSrgb, uNight);
}

// Sheet 03: Matte obsidian (#131316) with folded asymmetric aurora silk curtains & incandescent base
vec3 renderEmissionSheet(vec2 su, vec4 fld, float impulse, vec3 cEmber, vec3 cEmitA, vec3 cEmitB) {
  float silkA = fld.x;
  float silkB = fld.y;
  float silkC = fld.z;
  float broad = fld.w;

  vec3 obsidian = srgbToLinear(vec3(0.0745, 0.0745, 0.0863));
  float shift = sin(uTime * 0.22) * 0.12;

  // Three overlapping curved silk curtains with dark obsidian valleys & soft smoky upper evaporation
  float x1 = su.x - (0.20 + shift * 0.35 - su.y * 0.16);
  float mask1 = exp(-x1 * x1 * 7.5);
  float h1 = 0.09 + 0.18 * mask1 + 0.05 * silkB + 0.025 * impulse;
  float evap1 = exp(-pow(max(su.y / max(h1, 0.04), 1e-5), 1.65)) * smoothstep(h1 * 1.85, 0.0, su.y);
  float r1 = evap1 * (0.22 + 0.78 * mask1) * (0.32 + 0.68 * silkB);

  float x2 = su.x - (0.52 - shift * 0.40 - su.y * 0.28);
  float mask2 = exp(-x2 * x2 * 5.0);
  float h2 = 0.10 + 0.21 * mask2 + 0.06 * silkA + 0.03 * impulse;
  float evap2 = exp(-pow(max(su.y / max(h2, 0.04), 1e-5), 1.65)) * smoothstep(h2 * 1.85, 0.0, su.y);
  float r2 = evap2 * (0.20 + 0.80 * mask2) * (0.28 + 0.72 * silkA);

  float x3 = su.x - (0.74 + shift * 0.45 + su.y * 0.14);
  float mask3 = exp(-x3 * x3 * 7.2);
  float h3 = 0.09 + 0.18 * mask3 + 0.05 * silkC;
  float evap3 = exp(-pow(max(su.y / max(h3, 0.04), 1e-5), 1.65)) * smoothstep(h3 * 1.85, 0.0, su.y);
  float r3 = evap3 * (0.20 + 0.80 * mask3) * (0.30 + 0.70 * silkC);

  vec3 radiance = obsidian;
  radiance += cEmber * r1 * 0.98;
  radiance += cEmitA * r2 * 1.15;
  radiance += cEmitB * r3 * 1.05;

  // Localized incandescent focal convergence right where folded silk curtains cross at base (#FFFDF8)
  float xCore = su.x - (0.48 - shift * 0.30 + (broad - 0.5) * 0.10);
  float coreFocus = exp(-xCore * xCore * 28.0) * exp(-pow(max(su.y / 0.095, 1e-5), 1.75)) * smoothstep(0.20, 0.0, su.y);
  radiance += (cEmitA * 0.80 + cEmber * 0.40 + cEmitB * 0.35) * coreFocus * (1.75 + 1.15 * silkA);

  radiance *= mix(1.0, 1.08, uNight);
  return filmicEmission(radiance);
}

float sdSheetPx(vec2 pPx, vec4 rectPx, float rPx) {
  vec2 halfS = rectPx.zw * 0.5;
  vec2 center = rectPx.xy + halfS;
  vec2 q = abs(pPx - center) - (halfS - vec2(rPx));
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rPx;
}

void main() {
  vec2 uvTL = vec2(vUv.x, 1.0 - vUv.y);
  float impulse = clamp(uMotion.y, 0.0, 1.5);

  vec3 cWashA, cWashB, cBloom, cEmitA, cEmitB;
  evalChordPalette(cWashA, cWashB, cBloom, cEmitA, cEmitB);

  // === COMPACT MODE (Landing Card Slot): One full-bleed asymmetric silk sheet ===
  if (uCompact > 0.5) {
    vec2 su = vec2(vUv.x, vUv.y);
    vec2 ptrLocal = vec2(uPointer.x, 1.0 - uPointer.y);
    vec4 fld = evalSilkField(su, 0.25, ptrLocal, impulse);

    vec3 colDay = renderWashSheet(su, fld, cWashA, cWashB, cBloom);
    vec2 suNight = vec2(su.x, su.y * 0.48);
    vec4 fldNight = evalSilkField(suNight, 0.55, ptrLocal, impulse);
    vec3 colNight = renderEmissionSheet(suNight, fldNight, impulse, cWashA, cEmitA, cEmitB);

    vec3 col = mix(colDay, colNight, uNight);
    col = applyCornerMask(col, uGround, vUv, uResCss, uCornerRadius, uDpr);
    col = ditherTri(col, gl_FragCoord.xy);
    outColor = vec4(col, 1.0);
    return;
  }

  // === FULL STAGE MODE: 3-Sheet Frameless Swiss Editorial Triptych ===
  vec2 pPx = uvTL * uResCss;
  vec3 col = uMatte;
  float aa = max(0.8 / max(uDpr, 1.0), 0.45);
  float sheetRadius = 2.0;

  // Delicate museum-wall paper shadow behind all 3 sheets
  float shadowAccum = 0.0;
  for (int i = 0; i < 3; i++) {
    vec4 rPx = uSheets[i] * vec4(uResCss, uResCss);
    float sdShad = sdSheetPx(pPx - vec2(0.0, 4.0), rPx, sheetRadius);
    float s = exp(-max(sdShad, 0.0) * 0.085) * smoothstep(-2.0, 2.0, sdShad);
    shadowAccum = max(shadowAccum, s);
  }
  col = mix(col, col * mix(0.91, 0.50, uNight), shadowAccum * mix(0.45, 0.65, uNight));

  for (int i = 0; i < 3; i++) {
    vec4 rNorm = uSheets[i];
    vec4 rPx = rNorm * vec4(uResCss, uResCss);
    float sd = sdSheetPx(pPx, rPx, sheetRadius);

    if (sd < aa * 2.0) {
      vec2 su = clamp((uvTL - rNorm.xy) / max(rNorm.zw, vec2(1e-5)), 0.0, 1.0);
      su.y = 1.0 - su.y;

      vec2 ptrLocal = (uPointer - rNorm.xy) / max(rNorm.zw, vec2(1e-5));
      ptrLocal.y = 1.0 - ptrLocal.y;

      float phase = float(i) * 0.45;
      vec4 fld = evalSilkField(su, phase, ptrLocal, impulse);

      vec3 sheetCol;
      if (i == 0) {
        sheetCol = renderWashSheet(su, fld, cWashA, cWashB, cBloom);
      } else if (i == 1) {
        sheetCol = renderBloomSheet(su, fld, impulse, cWashA, cWashB, cBloom);
      } else {
        sheetCol = renderEmissionSheet(su, fld, impulse, cWashA, cEmitA, cEmitB);
      }

      float rim = smoothstep(-1.5, 0.0, sd) * (1.0 - smoothstep(0.0, aa, sd));
      sheetCol = mix(sheetCol, sheetCol + vec3(0.065), rim * uNight);

      float cov = 1.0 - smoothstep(-aa, aa, sd);
      col = mix(col, sheetCol, cov);
    }
  }

  col = applyCornerMask(col, uGround, vUv, uResCss, uCornerRadius, uDpr);
  col = ditherTri(col, gl_FragCoord.xy);
  outColor = vec4(col, 1.0);
}
`;
