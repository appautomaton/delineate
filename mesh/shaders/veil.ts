// Plate I — Veil: Couture Anisotropic Frosted Morphing Halo.
// Four concentric smooth 2D SDFs (squircle, circle, reuleaux, pentagon) morphing with spring torque.
// Decoupled outer billowing erf() dispersion (sigmaOuter: 0.0072 -> 0.140) and inner-lip softness
// (sigmaInner: 0.0060 -> 0.040) keep the inner dish 100% creaseless and open while the lower-left
// dissolves widely into pure porcelain/obsidian space. An off-center lower-right periwinkle depth
// pool sits directly behind the 1.2px #FFFFFF specular crescent to triple its crystal gleam,
// paired with vivid ultramarine/rose-lilac ring chroma and sparkling 220x+IGN frost stipple.

import { COMMON_GLSL } from "./common.ts";

export const VEIL_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResCss;
uniform float uDpr;
uniform float uTime;
uniform float uNight;
uniform vec3 uColors[5];
uniform vec3 uGround;
uniform vec2 uPointer; // top-left normalized [0..1]
uniform float uHover;
uniform int uFrom;
uniform int uTo;
uniform float uMorph;
uniform vec2 uMotion;
uniform float uCompact;
uniform float uCornerRadius;

${COMMON_GLSL}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float sdEquilateralTri(vec2 p, float r) {
  const float k = 1.7320508;
  p.y += r * 0.14;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) * 0.5;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

float sdPentagon(vec2 p, float r) {
  const vec3 k = vec3(0.809016994, 0.587785252, 0.726542528);
  p.x = abs(p.x);
  p -= 2.0 * min(dot(vec2(-k.x, k.y), p), 0.0) * vec2(-k.x, k.y);
  p -= 2.0 * min(dot(vec2( k.x, k.y), p), 0.0) * vec2( k.x, k.y);
  p -= vec2(clamp(p.x, -r * k.z, r * k.z), r);
  return length(p) * sign(p.y);
}

// Generous rounding radii keep both outer silhouette and concentric inner bevel C2-smooth
float sdShape(int id, vec2 p, float R) {
  if (id == 0) {
    return sdRoundBox(p, vec2(R * 0.94), R * 0.30);
  }
  if (id == 1) {
    return length(p) - R * 1.03;
  }
  if (id == 2) {
    float tri = sdEquilateralTri(p, R * 0.56) - R * 0.58;
    float cir = length(p) - R * 1.03;
    return mix(tri, cir, 0.24);
  }
  vec2 q = rot2(0.18) * p;
  return sdPentagon(q, R * 0.62) - R * 0.40;
}

float evalField(vec2 p, float R) {
  float m = clamp(uMorph, -0.15, 1.15);
  float torque = sin(clamp(uMorph, 0.0, 1.0) * PI) * 0.34;
  float breath = sin(uTime * 0.38) * 0.055;
  vec2 q = rot2(torque + breath) * p;

  // Skip unused shape SDF whenever not actively morphing (2x faster at rest!)
  if (uFrom == uTo || m <= 0.001) return sdShape(uFrom, q, R);
  if (m >= 0.999) return sdShape(uTo, q, R);
  return mix(sdShape(uFrom, q, R), sdShape(uTo, q, R), m);
}

void main() {
  vec2 resPx = uResCss * uDpr;
  float minDim = min(uResCss.x, uResCss.y);
  vec2 p = (vUv - 0.5) * (uResCss / minDim);

  // Subtle living breath + generous hero scale
  float scale = mix(0.295, 0.348, uCompact);
  float breathScale = 1.0 + 0.014 * sin(uTime * 0.58) + 0.020 * uMotion.y;
  float R = scale * breathScale;

  // Pointer converted to centered math coords (+y up)
  vec2 ptr = vec2(uPointer.x - 0.5, 0.5 - uPointer.y) * (uResCss / minDim);
  vec2 pShift = p - ptr * (0.048 * uHover * (1.0 - 0.35 * uCompact));

  vec2 uvCentered = (vUv - 0.5) * 2.0;
  float rUv = length(uvCentered);
  float dOuter = evalField(pShift, R);

  // Continuous gentle light-angle orbit + interactive pointer defrost tilt
  float driftAngle = 0.62 + 0.14 * sin(uTime * 0.34);
  vec2 baseSharp = vec2(cos(driftAngle), sin(driftAngle));
  vec2 ptrTilt = normalize(ptr + baseSharp * 0.42);
  vec2 sharpDir = normalize(mix(baseSharp, ptrTilt, 0.55 * uHover));

  // Constant-gradient linear projection across the halo (100% creaseless through origin)
  float angAlign = clamp(dot(pShift, sharpDir) / max(1.12 * R, 0.001), -1.0, 1.0);
  vec2 unitPos = clamp(pShift / max(1.05 * R, 0.001), -1.0, 1.0);
  float defrost = pow(max(0.5 - 0.5 * angAlign, 1e-5), 1.32);

  // Fast directional early-out for pure exterior ground pixels: tight reach on crisp side, wide seamless reach on blurry flank
  float maxReach = mix(0.06, 0.62, defrost) * (R / 0.285);
  if (uCompact < 0.5 && (rUv > 0.992 || (dOuter > maxReach && uNight < 0.01))) {
    vec3 col = applyCornerMask(uGround, uGround, vUv, uResCss, uCornerRadius, uDpr);
    outColor = vec4(ditherTri(col, gl_FragCoord.xy), 1.0);
    return;
  }

  float dInnerLens = evalField(pShift, R * 0.68);

  // Decoupled outer billowing dispersion vs crisp inner-lip softness
  float sigmaOuter = mix(0.0070, 0.140, defrost) * (R / 0.285);
  float sigmaInner = mix(0.0058, 0.040, defrost) * (R / 0.285);

  // Audible sandblasted acrylic frost stipple: guard snoise2 strictly near rim penumbra (skips 75% of pixels!)
  float tooth = 0.0;
  if (abs(dOuter) < 0.14 || abs(dInnerLens) < 0.08) {
    float grainFine = snoise2(pShift * 220.0 + vec2(uTime * 0.03, -uTime * 0.025));
    float grainMicro = (ign(gl_FragCoord.xy) - 0.5) * 2.0;
    tooth = grainFine * 0.46 + grainMicro * 0.54;
  }
  float toothShift = tooth * 0.0112 * mix(1.0, 0.18, defrost);

  // Analytical Gaussian erf() CDFs
  float cdfOuter = 0.5 * (1.0 - erfApprox((dOuter + toothShift) / (1.41421356 * max(sigmaOuter, 0.002))));
  float wideOuterSig = sigmaOuter * 1.88 + 0.010;
  float cdfOuterWide = 0.5 * (1.0 - erfApprox(dOuter / (1.41421356 * wideOuterSig)));
  float cdfInner = 0.5 * (1.0 - erfApprox((dInnerLens + toothShift * 0.36) / (1.41421356 * max(sigmaInner, 0.002))));

  float ringAlpha = max(0.0, cdfOuter - cdfInner);
  float ringWide  = max(0.0, cdfOuterWide - cdfInner);
  float innerAlpha = cdfInner;

  float ringCover = clamp(ringAlpha * (1.0 + 0.60 * defrost) + ringWide * 0.38 * defrost, 0.0, 1.0);

  // Penumbra-isolated visible frost stipple (~2.5x sparkle along crisp upper-right rim; 0 on open paper!)
  float penumbra = 4.0 * ringAlpha * (1.0 - ringAlpha);
  float frostSparkle = tooth * 0.138 * penumbra * mix(1.0, 0.22, defrost);
  ringCover = clamp(ringCover + frostSparkle, 0.0, 1.0);

  // Smooth radial zero-cutoff envelopes on full stage (uCompact < 0.5):
  float rf = smoothstep(0.99, 0.28, rUv);
  float spillFade = mix(rf > 0.0 ? pow(rf, 1.6) : 0.0, 1.0, uCompact);
  float coreFade = mix(smoothstep(0.98, 0.68, rUv), 1.0, uCompact);
  ringCover *= coreFade;
  ringWide *= spillFade;
  innerAlpha *= coreFade;

  // Curated jewel palette stops in linear space
  vec3 cDeep  = srgbToLinear(uColors[0]); // vivid ultramarine left bend (#5472FF)
  vec3 cCrown = srgbToLinear(uColors[1]); // luminous rose-lilac top crown (#F2BFFF)
  vec3 cRight = srgbToLinear(uColors[2]); // cool periwinkle right bevel (#8E9BFF)
  vec3 cMist  = srgbToLinear(uColors[3]); // pale pearl mist (Day) / glowing opal (Night)
  vec3 cSpec  = srgbToLinear(uColors[4]); // pure specular #FFFFFF

  // Vivid sculptural ring color field (deep ultramarine left, blooming rose-lilac top crown, rich periwinkle right)
  float leftWeight  = smoothstep(-0.32, 0.82, -unitPos.x * 0.92 + unitPos.y * 0.14);
  float crownWeight = pow(max(clamp(dot(unitPos, normalize(vec2(0.10, 0.99))), 0.0, 1.0), 1e-5), 1.45);
  float lowerWeight = pow(max(clamp(dot(unitPos, normalize(vec2(0.32, -0.94))), 0.0, 1.0), 1e-5), 1.50);

  vec3 ringColLin = mixOklabLin(cRight, cDeep, leftWeight * 0.95);
  ringColLin = mixOklabLin(ringColLin, cCrown, crownWeight * 0.86);
  float outerDeep = smoothstep(-0.045 * R, 0.01 * R, dOuter) * (1.0 - defrost) * 0.32;
  ringColLin = mixOklabLin(ringColLin, cDeep, clamp(outerDeep + lowerWeight * 0.26, 0.0, 0.58));
  ringColLin *= (1.0 + frostSparkle * 0.55);

  // === INNER DISH CONTRAST POOL (vid1_02/03 signature) ===
  vec2 poolOrigin = vec2(0.18, -0.24) * R;
  float depthPool = exp(-dot(pShift - poolOrigin, pShift - poolOrigin) / max(0.38 * R * R, 1e-4));
  float dishSlope = smoothstep(-0.85, 0.95, dot(unitPos, normalize(vec2(0.38, -0.92))));
  float poolWeight = clamp(depthPool * 0.62 + dishSlope * 0.28, 0.0, 0.78);

  vec2 pearlOrigin = vec2(-0.18, 0.28) * R;
  float pearlLift = exp(-dot(pShift - pearlOrigin, pShift - pearlOrigin) / max(0.42 * R * R, 1e-4));

  vec3 poolHue = mixOklabLin(cDeep, cRight, 0.38);
  vec3 innerColLin = mixOklabLin(cMist, poolHue, poolWeight * mix(0.68, 0.52, uNight));
  vec3 pearlTint = mixOklabLin(mix(vec3(0.99, 0.985, 1.0), cCrown, 0.32), cCrown, uNight * 0.45);
  innerColLin = mixOklabLin(innerColLin, pearlTint, pearlLift * mix(0.54, 0.30, uNight));

  // Razor 1.2 device-px crystal specular crescent: guard 4-tap inner gradient strictly inside |dInnerLens| < 0.045 (skips 95% of pixels!)
  float crescent = 0.0;
  float topSheen = 0.0;
  float distToLip = abs(dInnerLens);
  if (distToLip < 0.045) {
    float eps = 0.0020;
    vec2 gradInner = normalize(vec2(
      evalField(pShift + vec2(eps, 0.0), R * 0.68) - evalField(pShift - vec2(eps, 0.0), R * 0.68),
      evalField(pShift + vec2(0.0, eps), R * 0.68) - evalField(pShift - vec2(0.0, eps), R * 0.68)
    ) + vec2(1e-6));

    float pxUv = 1.2 / max(min(resPx.x, resPx.y), 1.0);
    vec2 crescentDir = normalize(mix(vec2(0.76, -0.52), normalize(vec2(ptr.x + 0.55, ptr.y - 0.44)), 0.44 * uHover));
    float arcGate = smoothstep(0.06, 0.84, dot(gradInner, crescentDir));
    float sharpGate = smoothstep(0.58, 0.14, defrost);
    float razorLine = exp(-pow(distToLip / (pxUv * 1.12), 2.0));
    float softHalo  = exp(-pow(distToLip / (pxUv * 5.8), 2.0)) * 0.26;
    crescent = (razorLine + softHalo) * arcGate * sharpGate;

    float topGate = smoothstep(0.48, 0.96, dot(gradInner, normalize(vec2(0.14, 0.99)))) * smoothstep(0.55, 0.14, defrost);
    topSheen = exp(-pow(distToLip / (pxUv * 2.8), 2.0)) * topGate * 0.36;
  }

  vec3 groundLin = srgbToLinear(uGround);

  // === DAY OPTICAL TRANSFER (subtractive jewel frost over luminous #FCFCFB porcelain) ===
  vec3 dayLin = groundLin;
  dayLin = mixOklabLin(dayLin, innerColLin, innerAlpha * 0.88);
  dayLin = mixOklabLin(dayLin, ringColLin, clamp(ringCover * 0.98, 0.0, 1.0));
  dayLin = mix(dayLin, cSpec, clamp(crescent * 0.99, 0.0, 1.0));
  dayLin = mixOklabLin(dayLin, mix(cCrown, cSpec, 0.62), topSheen);

  // === NIGHT OPTICAL TRANSFER (backlit frosted opal glowing into #070913 obsidian) ===
  vec3 nightLin = groundLin;
  float spill = exp(-max(dOuter, 0.0) / (0.22 * (R / 0.285))) * (0.16 + 0.18 * defrost) * spillFade;
  nightLin += mixOklabLin(cDeep, cCrown, crownWeight * 0.68) * spill * 0.56;
  vec3 opalCore = innerColLin * (1.10 + 0.22 * pearlLift) + mixOklabLin(cDeep, cCrown, 0.40) * (0.14 * depthPool);
  nightLin = mix(nightLin, opalCore, innerAlpha * 0.90);
  vec3 opalEmit = ringColLin * (1.04 + 0.36 * (1.0 - defrost));
  nightLin = mix(nightLin, opalEmit, clamp(ringCover * 0.94, 0.0, 1.0));
  nightLin += ringColLin * ringWide * 0.30 * defrost;
  nightLin += cSpec * crescent * 1.25;
  nightLin += mix(cCrown, cSpec, 0.48) * topSheen * 0.95;
  nightLin = nightLin / (1.0 + nightLin * 0.16);

  vec3 col = linearToSrgb(mix(dayLin, nightLin, uNight));
  col = applyCornerMask(col, uGround, vUv, uResCss, uCornerRadius, uDpr);
  col = ditherTri(col, gl_FragCoord.xy);

  outColor = vec4(col, 1.0);
}
`;
