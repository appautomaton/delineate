// Multi-pass WebGL2 cinema post-processing & medium-transmutation engine (GLSL ES 3.00).
// World 01 · Silver Gelatin & Cinnabar (Leica Darkroom x delineate Monochrome)
// Four lightweight GPU passes locked to 24 fps (< 2 ms total GPU frame budget):
//   Pass 1 (Always-On Leica Cinema Optics, Crown-Glass Prisms & Fluted Crystal Aurora, 1280x720):
//     - Radial power-law chromatic dispersion pow(r, 1.85) + organic lens breath
//     - 3D projective ray-plane homography + camera roll (uPersp, uRoll, uPerspPivot, uZoom)
//     - Card-local 24-tap Vogel Scheimpflug DOF (pow(defocus, 1.22) creamy f/1.4 rolloff)
//     - mode 0: Archival cotton rag + Scheimpflug DOF + 3 beveled Crown-Glass prisms (uGlass)
//     - mode 1: Fine Swiss engraving 8-level analytical ASCII + 5.8px optical blueprint X-ray mesh
//     - mode 2: Delicate 6.0px Swiss millimeter drafting grid + curved cotton-paper corner peel
//     - mode 3: Mineral Quadtree micro-mosaic & fine silver-champagne mezzotint halftone
//     - mode 4: Silky continuous 2.8px vertical fluted-crystal aurora in World-01 harmonic stops
//   Pass 2 (Directional 180° Shutter Blur & Kinetic Persistence, 1280x720 ping-pong):
//     7-tap Hann-weighted directional motion-blur integral (uMotionBlur) + consecutive-frame shutter echo
//   Pass 3 (Separable Half-Res Anamorphic Bloom & Halation, 640x360):
//     Bright highlight extraction -> wide horizontal anamorphic blur -> vertical Gaussian blur
//   Pass 4 (Filmic Composite, 1280x720):
//     Scene + bloom + platinum Panavision anamorphic streak + warm #D95B38 photochemical halation +
//     surgical foreground typography (tamed 0.16x dispersion) + platinum/champagne AR corner sheen +
//     elliptical cinema aperture vignette + dual-frequency luminance-gated 35mm silver grain + flash
import { PALETTE } from "./palette.js";
export const DEFAULT_SHADER = {
    mode: 0,
    barrel: 0.032,
    chroma: 0.0024,
    dof: 0,
    focusY: 0.5,
    perspX: 0,
    perspY: 0,
    roll: 0,
    perspPivot: [0.5, 0.5],
    zoom: 1.0,
    cellSize: 8.0,
    paperGrain: 0.26,
    vignette: 0.28,
    flash: 0,
    invert: 0,
    tint: [1, 1, 1],
    asciiBg: 0,
    bloom: 0.22,
    halation: 0.0,
    trail: 0.0,
    motionBlur: [0, 0],
    glass: 0.0,
    anamorphic: 0.0,
    anamorphicTint: PALETTE.gl.anamorphic,
};
const VERT_SRC = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;
// ── PASS 1: Leica Cinema Optics, Beveled Crown-Glass Prisms & Continuous 2.8px Fluted Crystal ───────
const SCENE_FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uFrame;
uniform int uMode;
uniform float uBarrel;
uniform float uChroma;
uniform float uDof;
uniform float uFocusY;
uniform vec2 uPersp;
uniform float uRoll;
uniform vec2 uPerspPivot;
uniform float uZoom;
uniform float uCellSize;
uniform float uPaperGrain;
uniform vec3 uTint;
uniform float uAsciiBg;
uniform float uGlass;
uniform vec2 uPointer;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

// Smooth 2D value noise & 4-octave rotational domain-warped FBM for World-01 fluted crystal aurora
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm4(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  const mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    v += amp * vnoise(p);
    p = rot * p * 2.04 + vec2(17.1, 31.7);
    amp *= 0.5;
  }
  return v;
}

// Exact World-01 Silver Gelatin & Champagne harmonic ramp:
//   #08090B obsidian -> #1B2230 selenium slate -> #5C6B7E brushed platinum -> #D6CFAF champagne -> #F4F1EA bone
vec3 world01CrystalRamp(float val, float champagneBias) {
  const vec3 cVoid = vec3(0.031, 0.035, 0.043); // #08090B
  const vec3 c0    = vec3(0.106, 0.133, 0.188); // #1B2230
  const vec3 c1    = vec3(0.361, 0.420, 0.494); // #5C6B7E
  const vec3 c2    = vec3(0.839, 0.812, 0.686); // #D6CFAF
  const vec3 c3    = vec3(0.957, 0.945, 0.918); // #F4F1EA

  // Smooth filmic knee so midtones live in silky slate/platinum/champagne without white blowout
  float v = clamp(val / (1.0 + max(0.0, val - 0.62) * 0.55), 0.0, 0.98);
  vec3 cool = v < 0.34
    ? mix(cVoid, c0, v / 0.34)
    : v < 0.74
      ? mix(c0, c1, (v - 0.34) / 0.40)
      : v < 0.92
        ? mix(c1, c2, (v - 0.74) / 0.18)
        : mix(c2, c3, (v - 0.92) / 0.08);

  vec3 warm = v < 0.28
    ? mix(cVoid, c0, v / 0.28)
    : v < 0.68
      ? mix(c0, c2, (v - 0.28) / 0.40)
      : mix(c2, c3, (v - 0.68) / 0.30);

  return mix(cool, warm, clamp(champagneBias, 0.0, 1.0));
}

// Evaluates 3-act World-01 domain-warped silk-crystal aurora (matching Lookbook Row 1 Frame 06)
vec3 evalPlasmaField(vec2 qUv, float t, float w1, float w2, float w3, float specShift) {
  float aspect = uRes.x / uRes.y;
  vec2 p = (qUv - 0.5) * vec2(aspect, 1.0) * 2.0; // [-aspect..aspect, -1..1]

  vec2 warp = vec2(
    fbm4(p * 1.18 + vec2(t * 0.30, -t * 0.20)),
    fbm4(p * 1.18 + vec2(-t * 0.24 + 5.2, t * 0.32 + 1.3))
  );
  float silk = fbm4(p * 1.35 + warp * 1.55 - vec2(t * 0.18, t * 0.26));
  float caustics = fbm4(p * 2.05 - warp * 1.20 + vec2(0.0, -t * 0.34));
  float ribbon = 0.5 + 0.5 * sin(p.y * 2.6 + p.x * 0.85 + warp.x * 3.4 - t * 0.55);

  vec3 acc = vec3(0.0);

  // Act 1 (F 322..332): Sweeping diagonal platinum-slate silk curtains & lower-right champagne fold
  if (w1 > 0.005) {
    float curtain = (0.32 + 0.58 * ribbon) * (0.45 + 0.65 * silk);
    float lrGlow = exp(-dot((p - vec2(0.82, 0.48)) * vec2(0.75, 1.05), (p - vec2(0.82, 0.48)) * vec2(0.75, 1.05)) * 1.35);
    float ulMist = exp(-dot((p - vec2(-0.85, -0.44)) * vec2(0.70, 1.10), (p - vec2(-0.85, -0.44)) * vec2(0.70, 1.10)) * 1.45);
    float d1 = curtain * 0.72 + lrGlow * 0.54 + ulMist * 0.34 + specShift;
    acc += world01CrystalRamp(d1, clamp(lrGlow * 1.05 + ulMist * 0.25, 0.0, 1.0)) * w1;
  }

  // Act 2 (F 333..343): Lush brushed-platinum upper wave & warm champagne lower-right solar prominence
  if (w2 > 0.005) {
    float upperSilk = exp(-pow((p.y + 0.42 + (warp.y - 0.5) * 0.55) * 1.55, 2.0)) * (0.48 + 0.62 * silk);
    float diagSweep = exp(-pow((p.y - p.x * 0.28 + (warp.x - 0.5) * 0.65) * 1.45, 2.0)) * caustics * 0.58;
    float champSolar = exp(-dot((p - vec2(0.72, 0.44)) * vec2(0.72, 1.08), (p - vec2(0.72, 0.44)) * vec2(0.72, 1.08)) * 1.38);
    float d2 = upperSilk * 0.76 + diagSweep + champSolar * 0.66 + specShift;
    acc += world01CrystalRamp(d2, clamp(champSolar * 1.12, 0.0, 1.0)) * w2;
  }

  // Act 3 (F 344..354): Rising architectural platinum-champagne crystal organ converging gently inward
  if (w3 > 0.005) {
    float cols = 0.5 + 0.5 * sin(p.x * 3.8 + warp.x * 2.6 + sin(t * 0.45));
    float arch = exp(-pow((abs(p.y) - 0.44 + (warp.y - 0.5) * 0.42) * 1.75, 2.0));
    float champBase = exp(-dot((p - vec2(0.56, 0.46)) * vec2(0.78, 1.12), (p - vec2(0.56, 0.46)) * vec2(0.78, 1.12)) * 1.45);
    float d3 = (arch * (0.44 + 0.46 * cols) + silk * 0.34) * (0.55 + 0.52 * caustics) + champBase * 0.56 + specShift;
    acc += world01CrystalRamp(d3, clamp(champBase * 1.05, 0.0, 1.0)) * w3;
  }

  return acc;
}

// Radial barrel / pincushion lens warp — auto-zoomed so viewport corners NEVER pull black edges in.
vec2 barrelUv(vec2 uv, float k, vec2 center) {
  if (abs(k) < 0.0005) return uv;
  vec2 d = uv - center;
  float aspect = uRes.x / uRes.y;
  vec2 da = vec2(d.x * aspect, d.y);
  float r2 = dot(da, da);
  float cornerR2 = 0.25 * aspect * aspect + 0.25;
  float zoom = k > 0.0 ? 1.0 / (1.0 + k * cornerR2 + k * 0.25 * cornerR2 * cornerR2) : 1.0;
  return center + d * zoom * (1.0 + k * r2 + k * 0.25 * r2 * r2);
}

// True 3D ray-plane projective homography + camera roll pivoted cleanly at uPerspPivot.
vec2 projectPlane(vec2 uv, float zoomVal, out float scheimpflugDefocus, out bool hasPlane) {
  bool tilted = abs(uPersp.x) > 0.0005 || abs(uPersp.y) > 0.0005 || abs(uRoll) > 0.0005;
  hasPlane = tilted;
  if (!tilted && abs(zoomVal - 1.0) <= 0.0005) {
    scheimpflugDefocus = smoothstep(0.058, 0.38, abs(uv.y - uFocusY));
    return uv;
  }
  vec2 p = uv - uPerspPivot;
  float aspect = uRes.x / uRes.y;
  vec2 pa = vec2(p.x * aspect, p.y);
  float c = cos(uRoll);
  float s = sin(uRoll);
  vec2 pr = vec2(pa.x * c - pa.y * s, pa.x * s + pa.y * c);
  vec2 pUnrolled = vec2(pr.x / aspect, pr.y);

  float denom = max(0.32, 1.0 - dot(pUnrolled, uPersp));
  vec2 planeUv = uPerspPivot + pUnrolled / (denom * max(0.25, zoomVal));

  if (tilted) {
    scheimpflugDefocus = smoothstep(0.030, 0.148, abs(planeUv.y - uFocusY));
  } else {
    scheimpflugDefocus = smoothstep(0.058, 0.38, abs(planeUv.y - uFocusY));
  }
  return planeUv;
}

// Creamy Leica Summilux f/1.4 24-tap golden-angle Vogel disc shallow Depth-of-Field (pow(defocus, 1.22)).
vec3 sampleDof(vec2 uv, float amount, float defocus) {
  if (amount < 0.004 || defocus < 0.005) return texture(uTex, clamp(uv, 0.0, 1.0)).rgb;
  float silkyDefocus = pow(clamp(defocus, 0.0, 1.2), 1.22);
  float rad = amount * silkyDefocus * 0.027;
  if (rad < 0.0004) return texture(uTex, clamp(uv, 0.0, 1.0)).rgb;

  vec3 acc = texture(uTex, clamp(uv, 0.0, 1.0)).rgb * 0.10;
  float wSum = 0.10;
  vec2 aspect = vec2(uRes.y / uRes.x, 1.0);
  const float GOLDEN = 2.39996323;
  for (int i = 1; i <= 24; i++) {
    float fi = float(i);
    float r = sqrt(fi / 24.0) * rad;
    float a = fi * GOLDEN;
    vec2 off = vec2(cos(a), sin(a)) * r * aspect;
    vec3 s = texture(uTex, clamp(uv + off, 0.0, 1.0)).rgb;
    float w = 1.0 + smoothstep(0.56, 1.0, luma(s)) * 0.90;
    acc += s * w;
    wSum += w;
  }
  return acc / wSum;
}

// APO-Summicron apochromatic cinema glass dispersion following radial pow(r, 1.85) falloff:
// surgical dead-center sharpness with whisper-refined lateral edge dispersion (zero rainbow double-vision).
vec3 sampleOptical(vec2 uv, vec2 lensCenter, float chromaAmt, float dofAmt, float defocus) {
  vec2 cuv = clamp(uv, 0.0, 1.0);
  vec2 dv = cuv - lensCenter;
  float rNorm = length(dv * vec2(uRes.x / uRes.y, 1.0));
  float radialLaw = pow(clamp(rNorm * 1.22, 0.0, 1.55), 1.85);
  float dispMag = chromaAmt * (0.06 + radialLaw * 0.68) * rNorm;
  if (dispMag < 0.00018) return sampleDof(cuv, dofAmt, defocus);
  vec2 dir = normalize(dv + vec2(0.00001)) * dispMag;
  float r = sampleDof(cuv + dir, dofAmt, defocus).r;
  float g = sampleDof(cuv, dofAmt, defocus).g;
  float b = sampleDof(cuv - dir, dofAmt, defocus).b;
  return vec3(r, g, b);
}

float glyphMask(vec2 p, int lvl) {
  vec2 c = p - 0.5;
  float ax = abs(c.x);
  float ay = abs(c.y);
  float dBox = max(ax, ay);
  float dCirc = length(c);
  float stroke = 0.086;

  if (lvl <= 0) return 0.0;
  if (lvl == 1) return smoothstep(0.135, 0.075, dCirc);
  if (lvl == 2) {
    float dTop = length(c - vec2(0.0, -0.18));
    float dBot = length(c - vec2(0.0, 0.18));
    return smoothstep(0.125, 0.068, min(dTop, dBot));
  }
  if (lvl == 3) {
    float diag = abs(c.x + c.y) * 0.7071;
    return smoothstep(stroke, stroke * 0.42, diag) * step(dBox, 0.36);
  }
  if (lvl == 4) {
    float d1 = abs(c.x - c.y) * 0.7071;
    float d2 = abs(c.x + c.y) * 0.7071;
    return smoothstep(stroke, stroke * 0.42, min(d1, d2)) * step(dBox, 0.34);
  }
  if (lvl == 5) return smoothstep(stroke, stroke * 0.42, abs(dCirc - 0.27));
  if (lvl == 6) {
    float frame = abs(dBox - 0.39);
    float innerX = min(abs(c.x - c.y), abs(c.x + c.y)) * 0.7071 + step(0.39, dBox);
    return smoothstep(stroke * 0.88, stroke * 0.36, min(frame, innerX));
  }
  float frame = abs(dBox - 0.42);
  float bars = min(abs(ax - 0.16), abs(ay - 0.16));
  float solid = smoothstep(0.43, 0.34, dBox) * 0.56;
  return clamp(smoothstep(stroke, stroke * 0.38, min(frame, bars)) + solid, 0.0, 1.0);
}

void main() {
  vec2 screenUv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 lensCenter = vec2(0.5) + (uPointer - 0.5) * 0.055;
  float lensBreath = 1.0 + sin(uFrame * 0.078) * 0.0026 * step(0.015, abs(uBarrel));
  vec2 uv = barrelUv(screenUv, uBarrel, lensCenter);
  float defocus = 0.0;
  bool hasPlane = false;
  vec2 planeUv = projectPlane(uv, uZoom * lensBreath, defocus, hasPlane);
  vec2 px = uv * uRes;
  vec3 col = vec3(0.0);

  if (uMode == 0) {
    // ── MODE 0: Archival Rag + Creamy Leica f/1.4 DOF + 3 Beveled Crown-Glass Prisms ──
    col = sampleOptical(planeUv, lensCenter, uChroma, uDof, defocus);

    if (hasPlane) {
      float sharp = clamp(1.0 - defocus * 1.32, 0.0, 1.0);
      if (sharp > 0.02) {
        float subPhase = mod(gl_FragCoord.x, 3.0);
        vec3 triad = subPhase < 1.0 ? vec3(1.02, 0.995, 0.985) : (subPhase < 2.0 ? vec3(0.988, 1.02, 0.992) : vec3(0.992, 0.988, 1.02));
        float scanCrisp = 1.0 + sin(planeUv.y * uRes.y * 3.14159) * 0.014 * sharp;
        col *= mix(vec3(1.0), triad, 0.48 * sharp) * scanCrisp;
      }
      float reflCoord = planeUv.x * 0.76 - planeUv.y * 0.64 - 0.10 - uPersp.x * 0.62;
      float softbox = exp(-reflCoord * reflCoord * 26.0) * 0.042;
      col += vec3(0.96, 0.95, 0.92) * softbox;
    }

    if (uGlass > 0.01) {
      float drift = (uFrame - 150.0) * 0.0032;
      vec4 slabs[3] = vec4[3](
        vec4(0.415 + drift * 0.70, 0.405 - drift * 0.40, 0.068, 0.088),
        vec4(0.575 - drift * 0.60, 0.535 + drift * 0.35, 0.072, 0.080),
        vec4(0.548 + drift * 0.45, 0.365 + drift * 0.35, 0.056, 0.066)
      );
      vec2 shifts[3] = vec2[3](
        vec2(-0.016,  0.010),
        vec2( 0.015, -0.011),
        vec2( 0.012,  0.009)
      );
      for (int k = 0; k < 3; k++) {
        vec2 rel = planeUv - slabs[k].xy;
        vec2 d = abs(rel) - slabs[k].zw;
        if (max(d.x, d.y) < 0.0) {
          vec2 normRel = rel / slabs[k].zw;
          float boxDist = max(abs(normRel.x), abs(normRel.y));
          float edge = smoothstep(0.74, 1.0, boxDist);
          float rimLine = smoothstep(0.955, 0.995, boxDist);
          vec2 refrUv = slabs[k].xy + rel / 1.14 + shifts[k] * uGlass + normRel * edge * 0.012 * uGlass;
          vec2 dispVec = (normRel * (0.0022 + edge * 0.0038) + shifts[k] * 0.12) * uGlass;
          float rG = sampleDof(clamp(refrUv + dispVec, 0.0, 1.0), uDof * 0.22, 0.0).r;
          float gG = sampleDof(clamp(refrUv,           0.0, 1.0), uDof * 0.22, 0.0).g;
          float bG = sampleDof(clamp(refrUv - dispVec, 0.0, 1.0), uDof * 0.22, 0.0).b;
          vec3 glassCol = vec3(rG, gG, bG) * vec3(1.05, 1.04, 1.00);
          float topLeft = clamp((-normRel.x * 0.68 - normRel.y * 0.73) * 0.5 + 0.52, 0.12, 1.0);
          float fresnel = pow(edge, 5.0) * (0.10 + 0.24 * topLeft) + rimLine * (0.08 + 0.22 * topLeft);
          float sheen = smoothstep(0.26, 0.0, abs(normRel.x + normRel.y * 0.82 + 0.18)) * 0.045;
          vec3 bevelSpec = mix(vec3(0.839, 0.812, 0.686), vec3(0.949, 0.937, 0.914), topLeft);
          col = mix(col, glassCol + bevelSpec * (fresnel + sheen), clamp(uGlass, 0.0, 1.0));
        }
      }
    }

    if (uPaperGrain > 0.01) {
      float scan = sin(px.y * 1.65) * 0.5 + 0.5;
      float weave = sin((px.x + px.y) * 0.85) * sin((px.x - px.y) * 0.85);
      float edgeDist = length((screenUv - 0.5) * vec2(1.36, 1.04));
      float cornerWeave = smoothstep(0.32, 0.94, edgeDist);
      float fiber = hash12(floor(px * 0.65)) - 0.5;
      float grain = hash12(floor(px * 0.5) + vec2(uFrame * 13.7, uFrame * 7.3)) - 0.5;
      float lum = luma(col);
      float texMod = mix(
        grain * 0.036 + scan * 0.008,
        -(scan * 0.012 + max(0.0, weave) * 0.068 * cornerWeave) + fiber * 0.018 + grain * 0.012,
        smoothstep(0.30, 0.78, lum)
      );
      col += texMod * uPaperGrain;
    }
  } else if (uMode == 1) {
    // ── MODE 1: Fine Swiss Engraving 8-Level ASCII & 5.8px Optical Blueprint Micro-Mesh ──
    float cs = max(5.0, uCellSize);
    vec2 cellIdx = floor(px / cs);
    vec2 cellCenterUv = (cellIdx + 0.5) * cs / uRes;
    vec2 local = fract(px / cs);

    float pd = 0.0;
    bool hp = false;
    vec2 pUv = projectPlane(cellCenterUv, uZoom * lensBreath, pd, hp);
    vec3 src = sampleOptical(pUv, lensCenter, uChroma, 0.0, 0.0);
    float lum = luma(src);
    float boosted = clamp(pow(lum, 0.88) * 1.06, 0.0, 1.0);
    int lvl = int(floor(boosted * 7.99));
    float mask = glyphMask(local, lvl);

    if (uAsciiBg > 0.8) {
      float bgWhisper = glyphMask(local, 1) * 0.04;
      vec3 paper = vec3(0.965, 0.961, 0.941); // #F6F5F0
      vec3 ink = vec3(0.086, 0.086, 0.082);   // #161615
      col = mix(paper, ink, clamp(mask * 0.92 + bgWhisper * 0.42, 0.0, 1.0));
    } else if (uAsciiBg > 0.15) {
      // 5.8px Silver-Champagne on Obsidian Optical Blueprint X-Ray Micro-Mesh (S02 F35..37)
      vec3 obsidian = vec3(0.031, 0.035, 0.043);
      float gridHairline = step(0.88, max(local.x, local.y));
      float crossHair = glyphMask(local, 4) * 0.42;
      float wire = clamp(gridHairline * 0.24 + mask * 0.92 + crossHair * smoothstep(0.24, 0.78, lum), 0.0, 1.0);
      vec3 silverChampagne = mix(vec3(0.54, 0.59, 0.66), vec3(0.87, 0.84, 0.74), smoothstep(0.28, 0.80, lum));
      vec3 litMesh = mix(src * 0.52, silverChampagne, 0.72);
      float presence = smoothstep(0.04, 0.22, lum);
      col = mix(obsidian, litMesh, wire * (0.20 + 0.80 * presence));
    } else {
      vec3 obsidian = vec3(0.031, 0.035, 0.043);
      float gate = smoothstep(0.028, 0.092, lum);
      vec3 glyphCol = mix(uTint, vec3(0.949, 0.937, 0.914), smoothstep(0.46, 0.88, boosted));
      vec3 aura = src * uTint * 0.32 * smoothstep(0.12, 0.65, lum);
      col = mix(obsidian, aura + glyphCol * mask * (0.34 + boosted * 0.98), gate);
    }
  } else if (uMode == 2) {
    // ── MODE 2: Delicate 6.0px Swiss Millimeter Drafting Grid & Curved Cotton-Paper Peel ──
    float cs = max(5.5, uCellSize);
    const vec3 ragPaper = vec3(0.965, 0.961, 0.941); // #F6F5F0
    const vec3 graphite = vec3(0.431, 0.427, 0.408); // #6E6D68
    const vec3 inkDark  = vec3(0.086, 0.086, 0.082); // #161615

    if (uAsciiBg >= 1.5) {
      float peel = clamp(uAsciiBg - 2.0, 0.0, 1.0);
      float arch = sin(screenUv.x * 3.14159) * 0.065;
      float diag = screenUv.x * 0.76 + screenUv.y * 1.18 - arch;
      float peelEdge = peel * 0.50;

      if (peel > 0.02 && diag < peelEdge) {
        col = sampleOptical(planeUv, lensCenter, uChroma, 0.0, 0.0);
        float rimShadow = smoothstep(0.0, 0.042, peelEdge - diag);
        col *= mix(0.44, 1.0, rimShadow);
      } else {
        vec2 centered = screenUv - vec2(0.54, 0.54);
        float cyl = dot(centered * vec2(1.12, 0.92), centered * vec2(1.12, 0.92));
        vec2 curvedUv = barrelUv(screenUv, 0.14 + peel * 0.12, vec2(0.54, 0.54));
        vec2 mPx = curvedUv * uRes;
        vec2 cellIdx = floor(mPx / cs);
        vec2 local = fract(mPx / cs);

        // Whisper-fine 6.0px millimeter drafting hairlines (0.22 max alpha — zero black burlap!)
        float minorLine = smoothstep(0.84, 0.96, max(local.x, local.y));
        vec2 mod5 = mod(cellIdx, 5.0);
        float majorLine = (mod5.x < 0.5 ? smoothstep(0.82, 0.96, local.x) : 0.0) +
                          (mod5.y < 0.5 ? smoothstep(0.82, 0.96, local.y) : 0.0);
        float nodeDot = smoothstep(0.16, 0.05, length(local - 0.5)) * 0.18;
        float gridAlpha = clamp(minorLine * 0.14 + majorLine * 0.08 + nodeDot, 0.0, 0.22);

        float curlLip = peel > 0.02 ? exp(-(diag - peelEdge) * 26.0) * 0.045 : 0.0;
        float foldShade = peel > 0.02 ? exp(-max(0.0, diag - peelEdge - 0.032) * 14.0) * 0.085 : 0.0;
        float shade = clamp(1.0 - cyl * 0.22 - foldShade + curlLip, 0.80, 1.03);
        vec3 paper = ragPaper * shade;
        col = mix(paper, graphite * shade, gridAlpha);
      }
    } else {
      vec2 cellIdx = floor(px / cs);
      vec2 cellCenterUv = (cellIdx + 0.5) * cs / uRes;
      vec2 local = fract(px / cs);

      vec3 src = sampleOptical(cellCenterUv, lensCenter, 0.0, 0.0, 0.0);
      float lum = luma(src);

      float minorLine = smoothstep(0.85, 0.96, max(local.x, local.y));
      vec2 mod5 = mod(cellIdx, 5.0);
      float majorLine = (mod5.x < 0.5 ? smoothstep(0.82, 0.96, local.x) : 0.0) +
                        (mod5.y < 0.5 ? smoothstep(0.82, 0.96, local.y) : 0.0);
      float gridAlpha = clamp(minorLine * 0.15 + majorLine * 0.08, 0.0, 0.22);

      float typeInk = 1.0 - smoothstep(0.26, 0.62, lum);
      vec3 basePaper = mix(ragPaper, graphite, gridAlpha);
      col = mix(basePaper, inkDark, typeInk * 0.92);
    }
  } else if (uMode == 3) {
    // ── MODE 3: Mineral Quadtree Micro-Mosaic & Fine Silver-Champagne Mezzotint Halftone ──
    float fineCs = max(5.0, uCellSize);
    vec2 fineIdx = floor(px / fineCs);
    vec2 fineUv = (fineIdx + 0.5) * fineCs / uRes;
    vec2 fineLocal = fract(px / fineCs);
    const vec3 obsidian = vec3(0.031, 0.035, 0.043);

    vec3 fineCol = sampleOptical(fineUv, lensCenter, uChroma, 0.0, 0.0);
    float fLum = luma(fineCol);

    if (uAsciiBg > 1.5) {
      // Act 3 & S10b: Fine Silver-Champagne Mezzotint Halftone (preserves 3-value iris clarity!)
      int fLvl = int(clamp(floor(pow(fLum, 0.86) * 7.6), 0.0, 7.0));
      float hatch = glyphMask(fineLocal, fLvl);
      float gate = smoothstep(0.028, 0.095, fLum);
      vec3 mineralTone = mix(vec3(fLum) * vec3(0.96, 0.95, 0.91), fineCol, 0.68);
      col = mix(obsidian, mineralTone * (0.42 + hatch * 0.82), gate);
    } else {
      // Act 1: Stepped 3-Tier Mineral Quadtree (24.8px -> 12.4px -> 6.2px)
      float midCs = fineCs * 2.0;
      float coarseCs = fineCs * 4.0;
      vec2 midLocal = fract(px / midCs);
      vec2 midUv = (floor(px / midCs) + 0.5) * midCs / uRes;
      vec2 coarseIdx = floor(px / coarseCs);
      vec2 coarseUv = (coarseIdx + 0.5) * coarseCs / uRes;
      vec2 coarseLocal = fract(px / coarseCs);

      vec2 qOff = vec2(coarseCs * 0.26) / uRes;
      vec3 c00 = texture(uTex, clamp(coarseUv + vec2(-qOff.x, -qOff.y), 0.0, 1.0)).rgb;
      vec3 c10 = texture(uTex, clamp(coarseUv + vec2( qOff.x, -qOff.y), 0.0, 1.0)).rgb;
      vec3 c01 = texture(uTex, clamp(coarseUv + vec2(-qOff.x,  qOff.y), 0.0, 1.0)).rgb;
      vec3 c11 = texture(uTex, clamp(coarseUv + vec2( qOff.x,  qOff.y), 0.0, 1.0)).rgb;
      vec3 coarseMean = (c00 + c10 + c01 + c11) * 0.25;
      float variance = (length(c00 - coarseMean) + length(c10 - coarseMean) + length(c01 - coarseMean) + length(c11 - coarseMean)) * 0.25;

      int fLvl = int(clamp(floor(fLum * 7.6), 0.0, 7.0));
      float fHatch = glyphMask(fineLocal, fLvl);
      float pupilGate = smoothstep(0.026, 0.088, fLum);
      vec3 fineOut = mix(obsidian, fineCol * (0.64 + fHatch * 0.52), pupilGate);

      vec3 midCol = sampleOptical(midUv, lensCenter, uChroma, 0.0, 0.0);
      float mEdge = step(0.92, max(midLocal.x, midLocal.y));
      vec3 midOut = midCol * (1.0 - mEdge * 0.14);

      float cEdge = step(0.95, max(coarseLocal.x, coarseLocal.y));
      vec3 coarseOut = coarseMean * (1.0 - cEdge * 0.16);

      float wMid = smoothstep(0.016, 0.046, variance);
      float wFine = smoothstep(0.038, 0.088, variance + fineCs * 0.003);
      col = mix(coarseOut, midOut, wMid);
      col = mix(col, fineOut, clamp(wFine + uAsciiBg * 0.45, 0.0, 1.0));
    }
  } else {
    // ── MODE 4: Silky Continuous 2.8px Vertical Fluted-Crystal Aurora (World 01) ──
    // Exact 2.80px cylindrical crystal pitch (2 * PI / 2.8 = 2.24399 rad/px) — ZERO black grid gaps!
    float flutePhase = px.x * 2.24399;
    float fluteSin = sin(flutePhase);
    float fluteCos = cos(flutePhase);

    float actU = uAsciiBg > 0.001 ? clamp(uAsciiBg, 0.0, 1.0) : clamp((uFrame - 322.0) / 32.0, 0.0, 1.0);
    float w1 = 1.0 - smoothstep(0.24, 0.42, actU);
    float w2 = smoothstep(0.20, 0.38, actU) * (1.0 - smoothstep(0.58, 0.76, actU));
    float w3 = smoothstep(0.54, 0.74, actU);
    float t = (uFrame - 322.0) * 0.082;

    // Gentle lateral glass-flute UV displacement + subtle refined crystal dispersion
    vec2 baseUv = planeUv + vec2(fluteSin * 0.004, 0.0) - (uPointer - 0.5) * 0.032;
    float disp = 0.0036;
    vec2 prismDir = (baseUv - 0.5) * disp + vec2(fluteCos * 0.0014, 0.0);

    vec3 pR = evalPlasmaField(baseUv + prismDir, t, w1, w2, w3,  0.025);
    vec3 pG = evalPlasmaField(baseUv,            t, w1, w2, w3,  0.000);
    vec3 pB = evalPlasmaField(baseUv - prismDir, t, w1, w2, w3, -0.025);
    vec3 vol = vec3(pR.r, pG.g, pB.b);

    // Gentle center hush so "and every living form" floats over softly visible crystal silk (zero hard hole!)
    const vec3 obsidian = vec3(0.031, 0.035, 0.043);
    float pocketDist = length((planeUv - vec2(0.5, 0.50)) * vec2(0.84, 1.85));
    float pocketMask = mix(0.28, 1.0, smoothstep(0.04, 0.56, pocketDist));

    // Continuous 0.84..1.05 cylindrical optical glass sheen + delicate reeded specular ridge
    float vLum = luma(vol);
    float fluteSheen = 0.945 + 0.105 * sin(flutePhase + 0.45);
    float crownGlint = pow(max(0.0, cos(flutePhase - 0.35)), 6.0) * 0.042 * smoothstep(0.18, 0.78, vLum);
    vec3 crystal = vol * fluteSheen + vec3(0.957, 0.945, 0.918) * crownGlint;
    col = mix(obsidian, crystal, pocketMask);
  }

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
// ── PASS 2: 7-Tap Directional 180° Shutter Blur + Consecutive-Frame Persistence Echo ───────────────
const TRAIL_FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uCurr;
uniform sampler2D uPrev;
uniform float uTrailMix;
uniform vec2 uMotionBlur;

vec3 sampleShutter(vec2 uv) {
  if (dot(uMotionBlur, uMotionBlur) < 0.000001) {
    return texture(uCurr, uv).rgb;
  }
  vec2 stepVec = vec2(uMotionBlur.x, -uMotionBlur.y) / 3.0;
  const float w0 = 0.250;
  const float w1 = 0.205;
  const float w2 = 0.115;
  const float w3 = 0.055;
  vec3 acc = texture(uCurr, uv).rgb * w0;
  acc += (texture(uCurr, clamp(uv + stepVec * 1.0, 0.0, 1.0)).rgb + texture(uCurr, clamp(uv - stepVec * 1.0, 0.0, 1.0)).rgb) * w1;
  acc += (texture(uCurr, clamp(uv + stepVec * 2.0, 0.0, 1.0)).rgb + texture(uCurr, clamp(uv - stepVec * 2.0, 0.0, 1.0)).rgb) * w2;
  acc += (texture(uCurr, clamp(uv + stepVec * 3.0, 0.0, 1.0)).rgb + texture(uCurr, clamp(uv - stepVec * 3.0, 0.0, 1.0)).rgb) * w3;
  return acc;
}

void main() {
  vec3 curr = sampleShutter(vUv);
  if (uTrailMix <= 0.004) {
    outColor = vec4(clamp(curr, 0.0, 1.0), 1.0);
    return;
  }
  vec3 prev = texture(uPrev, vUv).rgb;
  vec3 decayed = prev * vec3(uTrailMix * 1.01, uTrailMix * 0.99, uTrailMix * 0.95);
  float currLum = dot(curr, vec3(0.299, 0.587, 0.114));
  vec3 blended = currLum > 0.72 ? mix(curr, prev, uTrailMix * 0.35) : max(curr, decayed);
  outColor = vec4(clamp(blended, 0.0, 1.0), 1.0);
}
`;
// ── PASS 3: Half-Res Separable Anamorphic Bloom & Halation Blur ────────────────────────────────────
const BLOOM_FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uSrc;
uniform vec2 uStep;
uniform float uExtract;

void main() {
  const float w0 = 0.204164;
  const float w1 = 0.180174;
  const float w2 = 0.123832;
  const float w3 = 0.066282;
  const float w4 = 0.027630;

  vec3 acc = vec3(0.0);
  for (int i = -4; i <= 4; i++) {
    int ai = abs(i);
    float w = ai == 0 ? w0 : (ai == 1 ? w1 : (ai == 2 ? w2 : (ai == 3 ? w3 : w4)));
    vec3 s = texture(uSrc, clamp(vUv + uStep * float(i), 0.0, 1.0)).rgb;
    if (uExtract > 0.5) {
      float lum = dot(s, vec3(0.299, 0.587, 0.114));
      float mask = smoothstep(0.46, 0.95, lum);
      s *= mask;
    }
    acc += s * w;
  }
  outColor = vec4(acc, 1.0);
}
`;
// ── PASS 4: Filmic Composite (World-01 Halation + Surgical Typography + Silver/Champagne AR Sheen) ──
const COMP_FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform sampler2D uFgTex;
uniform vec2 uRes;
uniform float uFrame;
uniform float uBarrel;
uniform float uChroma;
uniform float uVignette;
uniform float uFlash;
uniform float uInvert;
uniform float uBloomAmt;
uniform float uHalation;
uniform float uAnamorphic;
uniform vec3 uAnamorphicTint;
uniform vec2 uPointer;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 barrelUv(vec2 uv, float k, vec2 center) {
  if (abs(k) < 0.0005) return uv;
  vec2 d = uv - center;
  float aspect = uRes.x / uRes.y;
  vec2 da = vec2(d.x * aspect, d.y);
  float r2 = dot(da, da);
  float cornerR2 = 0.25 * aspect * aspect + 0.25;
  float zoom = k > 0.0 ? 1.0 / (1.0 + k * cornerR2 + k * 0.25 * cornerR2 * cornerR2) : 1.0;
  return center + d * zoom * (1.0 + k * r2 + k * 0.25 * r2 * r2);
}

vec3 softRoll(vec3 c) {
  return c / (1.0 + max(vec3(0.0), c - 0.85) * 0.45);
}

void main() {
  vec2 screenUv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 lensCenter = vec2(0.5) + (uPointer - 0.5) * 0.055;
  vec3 base = texture(uScene, vUv).rgb;
  vec3 bloom = texture(uBloom, vUv).rgb;

  vec3 col = base;
  if (uBloomAmt > 0.005) {
    col += bloom * (uBloomAmt * 0.58);
  }

  if (uAnamorphic > 0.005) {
    vec3 s1 = texture(uBloom, clamp(vUv + vec2(0.032, 0.0), 0.0, 1.0)).rgb +
              texture(uBloom, clamp(vUv - vec2(0.032, 0.0), 0.0, 1.0)).rgb;
    vec3 s2 = texture(uBloom, clamp(vUv + vec2(0.075, 0.0), 0.0, 1.0)).rgb +
              texture(uBloom, clamp(vUv - vec2(0.075, 0.0), 0.0, 1.0)).rgb;
    vec3 s3 = texture(uBloom, clamp(vUv + vec2(0.135, 0.0), 0.0, 1.0)).rgb +
              texture(uBloom, clamp(vUv - vec2(0.135, 0.0), 0.0, 1.0)).rgb;
    float streakE = dot(s1 * 0.24 + s2 * 0.14 + s3 * 0.07, vec3(0.333));
    col += uAnamorphicTint * (streakE * uAnamorphic * 0.68);
  }

  // World-01 Kodak Photochemical Halation (#D95B38)
  if (uHalation > 0.005) {
    vec2 hOff = vec2(4.0 / uRes.x, 1.5 / uRes.y);
    vec3 bWide = (texture(uBloom, clamp(vUv + hOff, 0.0, 1.0)).rgb + texture(uBloom, clamp(vUv - hOff, 0.0, 1.0)).rgb) * 0.5;
    float hEnergy = dot(bWide, vec3(0.35, 0.45, 0.20));
    col += vec3(0.851, 0.357, 0.220) * (hEnergy * uHalation * 0.48);
  }

  col = softRoll(col);

  // Surgical foreground typography & CV HUD (tamed 0.16x dispersion — zero cyan/red double-vision!)
  vec2 fgUv = clamp(barrelUv(screenUv, uBarrel, lensCenter), 0.0, 1.0);
  vec2 fgDv = fgUv - lensCenter;
  float fgRNorm = length(fgDv * vec2(uRes.x / uRes.y, 1.0));
  float fgRadialLaw = pow(clamp(fgRNorm * 1.24, 0.0, 1.60), 1.85);
  float fgDisp = uChroma * 0.16 * fgRadialLaw * fgRNorm;
  vec2 fgDir = normalize(fgDv + vec2(0.00001)) * fgDisp;

  vec4 fgC = texture(uFgTex, fgUv);
  if (fgC.a > 0.003 || fgDisp > 0.0005) {
    float fgR = texture(uFgTex, clamp(fgUv + fgDir, 0.0, 1.0)).r;
    float fgB = texture(uFgTex, clamp(fgUv - fgDir, 0.0, 1.0)).b;
    float aR = texture(uFgTex, clamp(fgUv + fgDir, 0.0, 1.0)).a;
    float aB = texture(uFgTex, clamp(fgUv - fgDir, 0.0, 1.0)).a;
    float fgA = max(fgC.a, max(aR, aB) * 0.52);
    vec3 fgCol = vec3(fgR, fgC.g, fgB);
    col = mix(col, fgCol, clamp(fgA, 0.0, 1.0));
  }

  float lum = dot(col, vec3(0.299, 0.587, 0.114));

  // Subtle platinum-silver & warm champagne AR glass corner sheen (dark scenes only)
  float darkWeight = 1.0 - smoothstep(0.52, 0.86, lum);
  vec2 edgeVec = (screenUv - lensCenter) * vec2(uRes.x / uRes.y, 1.0);
  float edgeR = length(edgeVec);
  float coatingMask = smoothstep(0.56, 0.98, edgeR) * darkWeight;
  if (coatingMask > 0.002) {
    float angTint = 0.5 + 0.5 * cos(atan(edgeVec.y, edgeVec.x) * 2.0 - 0.65);
    vec3 arCoat = mix(vec3(0.18, 0.21, 0.26), vec3(0.26, 0.24, 0.19), angTint);
    col += arCoat * (coatingMask * 0.026);
  }

  // Dual-frequency luminance-gated 35mm silver-halide film grain
  float grainGate = smoothstep(0.014, 0.075, lum) * (1.0 - smoothstep(0.84, 0.995, lum) * 0.50);
  float fineGrain = hash12(floor(gl_FragCoord.xy * 0.90) + vec2(uFrame * 19.3, uFrame * 11.7)) - 0.5;
  float softGrain = hash12(floor(gl_FragCoord.xy * 0.38) + vec2(uFrame * 7.1, uFrame * 23.9)) - 0.5;
  col += (fineGrain * 0.015 + softGrain * 0.007) * grainGate;

  // Natural elliptical anamorphic cinema aperture vignette
  float effVig = max(uVignette, 0.14 * darkWeight);
  if (effVig > 0.005) {
    vec2 vd = (screenUv - lensCenter) * vec2(1.20, 1.04);
    float vig = 1.0 - smoothstep(0.30, 0.98, dot(vd, vd) * 1.12) * effVig;
    col *= vig;
  }

  if (uInvert > 0.5) col = 1.0 - col;
  if (uFlash > 0.005) col = mix(col, vec3(0.965, 0.961, 0.941), clamp(uFlash, 0.0, 1.0));

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
export class ShaderStage {
    gl = null;
    vao = null;
    tex = null;
    fgTex = null;
    sceneP = null;
    trailP = null;
    bloomP = null;
    compP = null;
    sceneT = null;
    trailA = null;
    trailB = null;
    bloomA = null;
    bloomB = null;
    trailFlip = 0;
    prevFrame = -999;
    fallback2d = null;
    canvas;
    constructor(canvas) {
        this.canvas = canvas;
        const gl = canvas.getContext("webgl2", {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
        });
        if (!gl) {
            this.fallback2d = canvas.getContext("2d");
            return;
        }
        this.gl = gl;
        this.init(gl);
    }
    compile(gl, type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(sh) ?? "shader error";
            gl.deleteShader(sh);
            throw new Error(log);
        }
        return sh;
    }
    buildProgram(gl, fragSrc, uniformNames) {
        const vs = this.compile(gl, gl.VERTEX_SHADER, VERT_SRC);
        const fs = this.compile(gl, gl.FRAGMENT_SHADER, fragSrc);
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(prog) ?? "link error");
        }
        const u = {};
        for (const n of uniformNames)
            u[n] = gl.getUniformLocation(prog, n);
        return { prog, u };
    }
    makeTex(gl, w, h) {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (w && h) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
        return t;
    }
    makeTarget(gl, w, h) {
        const tex = this.makeTex(gl, w, h);
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return { fbo, tex, w, h };
    }
    init(gl) {
        this.sceneP = this.buildProgram(gl, SCENE_FRAG, [
            "uTex", "uRes", "uFrame", "uMode", "uBarrel", "uChroma",
            "uDof", "uFocusY", "uPersp", "uRoll", "uPerspPivot", "uZoom",
            "uCellSize", "uPaperGrain", "uTint", "uAsciiBg", "uGlass", "uPointer",
        ]);
        this.trailP = this.buildProgram(gl, TRAIL_FRAG, ["uCurr", "uPrev", "uTrailMix", "uMotionBlur"]);
        this.bloomP = this.buildProgram(gl, BLOOM_FRAG, ["uSrc", "uStep", "uExtract"]);
        this.compP = this.buildProgram(gl, COMP_FRAG, [
            "uScene", "uBloom", "uFgTex", "uRes", "uFrame", "uBarrel", "uChroma",
            "uVignette", "uFlash", "uInvert", "uBloomAmt", "uHalation",
            "uAnamorphic", "uAnamorphicTint", "uPointer",
        ]);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(this.sceneP.prog, "aPos");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        this.vao = vao;
        this.tex = this.makeTex(gl);
        this.fgTex = this.makeTex(gl);
        const w = this.canvas.width;
        const h = this.canvas.height;
        const bw = Math.max(1, Math.floor(w / 2));
        const bh = Math.max(1, Math.floor(h / 2));
        this.sceneT = this.makeTarget(gl, w, h);
        this.trailA = this.makeTarget(gl, w, h);
        this.trailB = this.makeTarget(gl, w, h);
        this.bloomA = this.makeTarget(gl, bw, bh);
        this.bloomB = this.makeTarget(gl, bw, bh);
    }
    render(source, fgSource, params, frame, _timeSec, pointerX, pointerY) {
        const gl = this.gl;
        if (!gl || !this.vao || !this.tex || !this.fgTex ||
            !this.sceneP || !this.trailP || !this.bloomP || !this.compP ||
            !this.sceneT || !this.trailA || !this.trailB || !this.bloomA || !this.bloomB) {
            if (this.fallback2d) {
                const fw = this.canvas.width;
                const fh = this.canvas.height;
                this.fallback2d.drawImage(source, 0, 0, fw, fh);
                if (params.mode === 4) {
                    const g = this.fallback2d.createRadialGradient(fw * 0.56, fh * 0.54, 48, fw * 0.5, fh * 0.5, fw * 0.42);
                    g.addColorStop(0, "rgba(8, 9, 11, 0)");
                    g.addColorStop(0.55, "rgba(92, 107, 126, 0.44)");
                    g.addColorStop(0.80, "rgba(214, 207, 175, 0.38)");
                    g.addColorStop(1, "rgba(8, 9, 11, 0)");
                    this.fallback2d.fillStyle = g;
                    this.fallback2d.fillRect(0, 0, fw, fh);
                }
                this.fallback2d.drawImage(fgSource, 0, 0, fw, fh);
            }
            return;
        }
        const w = this.canvas.width;
        const h = this.canvas.height;
        gl.bindVertexArray(this.vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.fgTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fgSource);
        // ── PASS 1: Leica Cinema Homography, Beveled Prisms & Fluted Crystal -> sceneT ──
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneT.fbo);
        gl.viewport(0, 0, this.sceneT.w, this.sceneT.h);
        gl.useProgram(this.sceneP.prog);
        const su = this.sceneP.u;
        gl.uniform1i(su.uTex, 0);
        gl.uniform2f(su.uRes, w, h);
        gl.uniform1f(su.uFrame, frame);
        gl.uniform1i(su.uMode, params.mode);
        gl.uniform1f(su.uBarrel, params.barrel);
        gl.uniform1f(su.uChroma, params.chroma);
        gl.uniform1f(su.uDof, params.dof);
        gl.uniform1f(su.uFocusY, params.focusY);
        gl.uniform2f(su.uPersp, params.perspX, params.perspY);
        gl.uniform1f(su.uRoll, params.roll);
        gl.uniform2f(su.uPerspPivot, params.perspPivot[0], params.perspPivot[1]);
        gl.uniform1f(su.uZoom, params.zoom);
        gl.uniform1f(su.uCellSize, params.cellSize);
        gl.uniform1f(su.uPaperGrain, params.paperGrain);
        gl.uniform3f(su.uTint, params.tint[0], params.tint[1], params.tint[2]);
        gl.uniform1f(su.uAsciiBg, params.asciiBg);
        gl.uniform1f(su.uGlass, params.glass);
        gl.uniform2f(su.uPointer, pointerX, pointerY);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        // ── PASS 2: 7-Tap Directional Shutter Blur + Kinetic Persistence Ping-Pong ──
        const consecutive = frame === this.prevFrame + 1;
        const trailMix = consecutive && params.trail > 0.004 ? params.trail : 0.0;
        const prevT = this.trailFlip === 0 ? this.trailA : this.trailB;
        const currT = this.trailFlip === 0 ? this.trailB : this.trailA;
        this.trailFlip = 1 - this.trailFlip;
        this.prevFrame = frame;
        gl.bindFramebuffer(gl.FRAMEBUFFER, currT.fbo);
        gl.viewport(0, 0, currT.w, currT.h);
        gl.useProgram(this.trailP.prog);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.sceneT.tex);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, prevT.tex);
        gl.uniform1i(this.trailP.u.uCurr, 2);
        gl.uniform1i(this.trailP.u.uPrev, 3);
        gl.uniform1f(this.trailP.u.uTrailMix, trailMix);
        gl.uniform2f(this.trailP.u.uMotionBlur, params.motionBlur[0], params.motionBlur[1]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        // ── PASS 3A & 3B: Half-Res Anamorphic Separable Bloom ──
        const needBloom = params.bloom > 0.005 || params.halation > 0.005 || params.anamorphic > 0.005;
        if (needBloom) {
            gl.useProgram(this.bloomP.prog);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomA.fbo);
            gl.viewport(0, 0, this.bloomA.w, this.bloomA.h);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, currT.tex);
            gl.uniform1i(this.bloomP.u.uSrc, 2);
            gl.uniform2f(this.bloomP.u.uStep, 2.8 / this.bloomA.w, 0.0);
            gl.uniform1f(this.bloomP.u.uExtract, 1.0);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomB.fbo);
            gl.viewport(0, 0, this.bloomB.w, this.bloomB.h);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.bloomA.tex);
            gl.uniform1i(this.bloomP.u.uSrc, 2);
            gl.uniform2f(this.bloomP.u.uStep, 0.0, 2.0 / this.bloomB.h);
            gl.uniform1f(this.bloomP.u.uExtract, 0.0);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        // ── PASS 4: Final Filmic Screen Composite ──
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        gl.useProgram(this.compP.prog);
        const cu = this.compP.u;
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, currT.tex);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.bloomB.tex);
        gl.uniform1i(cu.uScene, 2);
        gl.uniform1i(cu.uBloom, 3);
        gl.uniform1i(cu.uFgTex, 1);
        gl.uniform2f(cu.uRes, w, h);
        gl.uniform1f(cu.uFrame, frame);
        gl.uniform1f(cu.uBarrel, params.barrel);
        gl.uniform1f(cu.uChroma, params.chroma);
        gl.uniform1f(cu.uVignette, params.vignette);
        gl.uniform1f(cu.uFlash, params.flash);
        gl.uniform1f(cu.uInvert, params.invert);
        gl.uniform1f(cu.uBloomAmt, needBloom ? params.bloom : 0.0);
        gl.uniform1f(cu.uHalation, needBloom ? params.halation : 0.0);
        gl.uniform1f(cu.uAnamorphic, needBloom ? params.anamorphic : 0.0);
        gl.uniform3f(cu.uAnamorphicTint, params.anamorphicTint[0], params.anamorphicTint[1], params.anamorphicTint[2]);
        gl.uniform2f(cu.uPointer, pointerX, pointerY);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    /** Releases WebGL2 GPU resources cleanly when an inline embed closes back to its static poster. */
    dispose() {
        const gl = this.gl;
        if (gl) {
            gl.getExtension("WEBGL_lose_context")?.loseContext();
        }
        this.gl = null;
        this.vao = null;
        this.tex = null;
        this.fgTex = null;
        this.sceneP = null;
        this.trailP = null;
        this.bloomP = null;
        this.compP = null;
        this.sceneT = null;
        this.trailA = null;
        this.trailB = null;
        this.bloomA = null;
        this.bloomB = null;
        this.fallback2d = null;
    }
}
