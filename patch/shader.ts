// WebGL2 (#version 300 es) procedural embroidery & multi-textile atlas shader suite.
//
// Tier A (One-time startup bake into compact 3x2 atlas, JFA scratch freed immediately after):
//   1. SEED_FRAGMENT            — 2x supersampled Sobel dual-sided boundary seed (RGBA16UI Q12.4)
//   2. JFA_FRAGMENT             — Bounded dual-sided Voronoi JFA+1 (RGBA16UI)
//   3. OPEN_SEED_FRAGMENT       — 1x half-res morphological erosion seed (d < -R_tatami -> RG16UI)
//   4. OPEN_JFA_FRAGMENT        — 1x half-res dilation JFA measuring distance to Tatami core (RG16UI)
//   5. RESOLVE_MAIN_ATLAS       — 3-target MRT into 3x2 atlas tile:
//                                   outDist (RG16F: R=dMain), outOrient (RGBA8: hw, Jx, Jy, dProud),
//                                   outAux (RG8: wTatami, aoCrowd)
//   6. RESOLVE_REC_ATLAS        — Color-masked G-channel resolve into uDistAtlas (G=dRecessed)
//   7. PACK_META_ATLAS          — Nearest-filtered RG8 tile (R=regionCode, G=packed 3-layer thread IDs)
//
// Tier B (Single-Pass Per-Card Optical Render via shared WebGL2 context + gl.scissor):
//   8. RENDER_FRAGMENT          — All 6 exact-arclength C^1 Merrow silhouettes (Rect, Circle, Shield,
//                                 Hexagon, Stadium Capsule, Cathedral Arch), 4 physical substrates
//                                 (2/1 Z-Twill, Melton Wool Felt, 1/1 Natural Cotton Duck Canvas,
//                                 Tactical Ripstop Nylon), 4-thread per-badge palette (Rayon, Matte
//                                 Spun Cotton, Metallic Bullion), nematic-invariant 3x3 complex phasor
//                                 Satin, 5-facet mitered Stars, uncorrelated long-short fibrous Tatami,
//                                 multi-plane proud/recessed relief & cast shadows, premultiplied-alpha
//                                 linear drop shadows, and exact 0.00 px Pointer-X split curtain.

export const FULLSCREEN_VERTEX = `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  vec2 pos = vec2(
    float((gl_VertexID & 1) << 2) - 1.0,
    float((gl_VertexID & 2) << 1) - 1.0
  );
  vUv = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

// ============================================================================
// TIER A — PASS A1: 2x Subpixel Dual-Sided Seed (RGBA16UI, Q12.4 fixed-point)
// ============================================================================
export const SEED_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uArtTex;
uniform ivec2 uTexSize;
uniform int uMode; // 0 = main union max(G,B), 1 = proud B, 2 = recessed R

layout(location = 0) out uvec4 outSeed;

const uint EMPTY = 65535u;
const float FP_SCALE = 16.0;

float covAt(ivec2 p) {
  vec4 t = texelFetch(uArtTex, clamp(p, ivec2(0), uTexSize - 1), 0);
  if (uMode == 1) return t.b;
  if (uMode == 2) return t.r;
  return max(t.g, t.b);
}

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float a = covAt(p);

  float gx =
    (covAt(p + ivec2( 1, -1)) + 2.0 * covAt(p + ivec2( 1, 0)) + covAt(p + ivec2( 1, 1))) -
    (covAt(p + ivec2(-1, -1)) + 2.0 * covAt(p + ivec2(-1, 0)) + covAt(p + ivec2(-1, 1)));
  float gy =
    (covAt(p + ivec2(-1,  1)) + 2.0 * covAt(p + ivec2( 0, 1)) + covAt(p + ivec2( 1, 1))) -
    (covAt(p + ivec2(-1, -1)) + 2.0 * covAt(p + ivec2( 0,-1)) + covAt(p + ivec2( 1,-1)));

  vec2 g = vec2(gx, gy);
  float gl = length(g);
  vec2 pos = vec2(p) + 0.5;

  vec2 edgePos = pos;
  if (gl > 1e-3 && a > 0.01 && a < 0.99) {
    edgePos = pos + (g / gl) * clamp(0.5 - a, -0.5, 0.5);
  }
  uvec2 qEdge = uvec2(clamp(round(edgePos * FP_SCALE), vec2(0.0), vec2(65534.0)));

  bool inside = a >= 0.5;
  bool crosses =
    (covAt(p + ivec2( 1, 0)) >= 0.5) != inside ||
    (covAt(p + ivec2(-1, 0)) >= 0.5) != inside ||
    (covAt(p + ivec2( 0, 1)) >= 0.5) != inside ||
    (covAt(p + ivec2( 0,-1)) >= 0.5) != inside;

  uvec2 outerSeed = (inside && crosses) ? qEdge : uvec2(EMPTY);
  uvec2 innerSeed = (!inside && crosses) ? qEdge : uvec2(EMPTY);

  if (a > 0.05 && a < 0.95) {
    outerSeed = qEdge;
    innerSeed = qEdge;
  }

  outSeed = uvec4(outerSeed, innerSeed);
}
`;

// ============================================================================
// TIER A — PASS A2: Bounded Dual-Sided JFA+1 (RGBA16UI Ping-Pong)
// ============================================================================
export const JFA_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform highp usampler2D uSeedTex;
uniform ivec2 uTexSize;
uniform int uStep;

layout(location = 0) out uvec4 outSeed;

const uint EMPTY = 65535u;
const float INV_FP = 1.0 / 16.0;

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec2 fp = vec2(p) + 0.5;

  uvec2 bestOut = uvec2(EMPTY);
  uvec2 bestIn  = uvec2(EMPTY);
  float d2Out = 1e20;
  float d2In  = 1e20;

  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      ivec2 q = clamp(p + ivec2(dx, dy) * uStep, ivec2(0), uTexSize - 1);
      uvec4 s = texelFetch(uSeedTex, q, 0);

      if (s.x != EMPTY) {
        vec2 dv = vec2(s.xy) * INV_FP - fp;
        float d2 = dot(dv, dv);
        if (d2 < d2Out) {
          d2Out = d2;
          bestOut = s.xy;
        }
      }
      if (s.z != EMPTY) {
        vec2 dv = vec2(s.zw) * INV_FP - fp;
        float d2 = dot(dv, dv);
        if (d2 < d2In) {
          d2In = d2;
          bestIn = s.zw;
        }
      }
    }
  }

  outSeed = uvec4(bestOut, bestIn);
}
`;

// ============================================================================
// TIER A — PASS A3a: Half-Res Morphological Opening Seed (Erode_R -> RG16UI)
// ============================================================================
export const OPEN_SEED_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uArtTex;
uniform highp usampler2D uMainSeedTex;
uniform ivec2 uFullSize;
uniform float uBakeScale;
uniform float uTatamiRadius;

layout(location = 0) out uvec2 outCore;

const uint EMPTY = 65535u;
const float FP_SCALE = 16.0;
const float INV_FP = 1.0 / 16.0;

void main() {
  ivec2 ph = ivec2(gl_FragCoord.xy);
  ivec2 pf = clamp(ph * 2 + ivec2(1), ivec2(0), uFullSize - 1);
  vec4 art = texelFetch(uArtTex, pf, 0);
  float cov = max(art.g, art.b);

  if (cov < 0.5) {
    outCore = uvec2(EMPTY);
    return;
  }

  uvec4 s = texelFetch(uMainSeedTex, pf, 0);
  if (s.z == EMPTY) {
    vec2 pos = vec2(ph) + 0.5;
    outCore = uvec2(clamp(round(pos * FP_SCALE), vec2(0.0), vec2(65534.0)));
    return;
  }

  vec2 fp = vec2(pf) + 0.5;
  float distRef = length(fp - vec2(s.zw) * INV_FP) / uBakeScale;
  if (distRef >= uTatamiRadius) {
    vec2 pos = vec2(ph) + 0.5;
    outCore = uvec2(clamp(round(pos * FP_SCALE), vec2(0.0), vec2(65534.0)));
  } else {
    outCore = uvec2(EMPTY);
  }
}
`;

// ============================================================================
// TIER A — PASS A3b: Half-Res Dilation JFA (Dilate_R -> RG16UI)
// ============================================================================
export const OPEN_JFA_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform highp usampler2D uCoreTex;
uniform ivec2 uHalfSize;
uniform int uStep;

layout(location = 0) out uvec2 outCore;

const uint EMPTY = 65535u;
const float INV_FP = 1.0 / 16.0;

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec2 fp = vec2(p) + 0.5;

  uvec2 best = uvec2(EMPTY);
  float bestD2 = 1e20;

  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      ivec2 q = clamp(p + ivec2(dx, dy) * uStep, ivec2(0), uHalfSize - 1);
      uvec2 s = texelFetch(uCoreTex, q, 0).xy;
      if (s.x != EMPTY) {
        vec2 dv = vec2(s) * INV_FP - fp;
        float d2 = dot(dv, dv);
        if (d2 < bestD2) {
          bestD2 = d2;
          best = s;
        }
      }
    }
  }

  outCore = best;
}
`;

// ============================================================================
// TIER A — PASS A4: MRT Resolve from 2x JFA directly into 1x 3x2 Atlas Tile
// ============================================================================
export const RESOLVE_MAIN_ATLAS_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uArtTex;       // 1440x1040 (R=rec, G=main, B=proud)
uniform sampler2D uRegionTex;    // 720x520 (R=regionCode)
uniform highp usampler2D uMainSeedTex;
uniform highp usampler2D uProudSeedTex;
uniform highp usampler2D uCoreTex;
uniform ivec2 uFullSize;         // 1440x1040
uniform ivec2 uTileSize;         // 720x520
uniform ivec2 uTileOffset;       // atlas viewport origin (col*720, row*520)
uniform float uBakeScale;        // 2.0
uniform float uTatamiRadius;     // 6.5 ref px
uniform float uFloatDist;        // 1.0 for RG16F, 0.0 for RGBA8 fallback

layout(location = 0) out vec4 outDist;   // R = dMainRef (G written in Pass A5)
layout(location = 1) out vec4 outOrient; // (halfW/16, Jx*0.5+0.5, Jy*0.5+0.5, dProudPacked)
layout(location = 2) out vec4 outAux;    // (wTatami, aoCrowd, 0, 1)

const uint EMPTY = 65535u;
const float INV_FP = 1.0 / 16.0;

float signedDistMain(ivec2 p) {
  ivec2 pc = clamp(p, ivec2(0), uFullSize - 1);
  vec4 art = texelFetch(uArtTex, pc, 0);
  float cov = max(art.g, art.b);
  uvec4 s = texelFetch(uMainSeedTex, pc, 0);
  vec2 fp = vec2(pc) + 0.5;
  if (cov >= 0.5) {
    float dIn = (s.z == EMPTY) ? 64.0 * uBakeScale : length(fp - vec2(s.zw) * INV_FP);
    return -dIn / uBakeScale;
  }
  float dOut = (s.x == EMPTY) ? 64.0 * uBakeScale : length(fp - vec2(s.xy) * INV_FP);
  return dOut / uBakeScale;
}

float signedDistProud(ivec2 p) {
  ivec2 pc = clamp(p, ivec2(0), uFullSize - 1);
  float cov = texelFetch(uArtTex, pc, 0).b;
  uvec4 s = texelFetch(uProudSeedTex, pc, 0);
  vec2 fp = vec2(pc) + 0.5;
  if (cov >= 0.5) {
    float dIn = (s.z == EMPTY) ? 24.0 * uBakeScale : length(fp - vec2(s.zw) * INV_FP);
    return -dIn / uBakeScale;
  }
  float dOut = (s.x == EMPTY) ? 24.0 * uBakeScale : length(fp - vec2(s.xy) * INV_FP);
  return dOut / uBakeScale;
}

void main() {
  ivec2 pTile = clamp(ivec2(gl_FragCoord.xy) - uTileOffset, ivec2(0), uTileSize - 1);
  // Sample exact center of the corresponding 2x2 block in 2x supersampled bake space
  ivec2 p00 = pTile * 2;
  vec2 fpCenter = vec2(pTile) * 2.0 + 1.0;

  // Average the 4 sub-texel signed distances inside the 2x2 supersample block for ultra-clean AA SDF
  float dRef = 0.25 * (
    signedDistMain(p00) +
    signedDistMain(p00 + ivec2(1, 0)) +
    signedDistMain(p00 + ivec2(0, 1)) +
    signedDistMain(p00 + ivec2(1, 1))
  );
  float dProudRef = 0.25 * (
    signedDistProud(p00) +
    signedDistProud(p00 + ivec2(1, 0)) +
    signedDistProud(p00 + ivec2(0, 1)) +
    signedDistProud(p00 + ivec2(1, 1))
  );

  ivec2 p = clamp(p00 + ivec2(1), ivec2(0), uFullSize - 1);
  vec4 art = texelFetch(uArtTex, p, 0);
  float cov = max(art.g, art.b);
  float regionByte = texelFetch(uRegionTex, pTile, 0).r * 255.0;
  uvec4 s = texelFetch(uMainSeedTex, p, 0);

  // Opposite-edge stroke half-width probe on 2x supersampled SDF
  float halfWidthRef = 2.2;
  if (cov >= 0.5 && s.z != EMPTY) {
    vec2 qIn = vec2(s.zw) * INV_FP;
    vec2 vIn = fpCenter - qIn;
    float vLen = length(vIn);
    if (vLen > 1e-3) {
      vec2 nIn = vIn / vLen;
      bool isStarReg = abs(regionByte - 64.0) < 12.0;
      float maxT = (isStarReg ? 12.8 : 16.0) * uBakeScale;
      float t = max(vLen + 0.8, 1.2);
      float hitT = maxT;
      for (int i = 0; i < 12; i++) {
        vec2 sp = qIn + nIn * t;
        vec2 sp0 = floor(sp - 0.5);
        vec2 fr = clamp((sp - 0.5) - sp0, vec2(0.0), vec2(1.0));
        ivec2 ip = ivec2(sp0);
        float d00 = signedDistMain(ip);
        float d10 = signedDistMain(ip + ivec2(1, 0));
        float d01 = signedDistMain(ip + ivec2(0, 1));
        float d11 = signedDistMain(ip + ivec2(1, 1));
        float dStep = mix(mix(d00, d10, fr.x), mix(d01, d11, fr.x), fr.y);
        if (dStep >= 0.0) {
          hitT = max(t - dStep * uBakeScale, 1.8 * uBakeScale);
          break;
        }
        t += max(-dStep * uBakeScale, 0.85);
        if (t >= maxT) {
          hitT = maxT;
          break;
        }
      }
      halfWidthRef = clamp(0.5 * hitT / uBakeScale, 1.1, isStarReg ? 6.4 : 14.0);
    }
  }

  // Medial-axis-safe 5x5 masked Gaussian double-angle nematic tensor J = (cos 2t, sin 2t)
  vec2 Jsum = vec2(0.0);
  float wSum = 0.0;
  for (int dy = -2; dy <= 2; dy++) {
    for (int dx = -2; dx <= 2; dx++) {
      ivec2 q = clamp(p + ivec2(dx, dy) * 2, ivec2(0), uFullSize - 1);
      vec4 qa = texelFetch(uArtTex, q, 0);
      if (max(qa.g, qa.b) < 0.5) continue;
      uvec4 qs = texelFetch(uMainSeedTex, q, 0);
      if (qs.z == EMPTY) continue;
      vec2 fv = (vec2(q) + 0.5) - vec2(qs.zw) * INV_FP;
      float fl = length(fv);
      if (fl < 0.15) continue;
      vec2 nq = fv / fl;
      vec2 Jq = vec2(nq.x * nq.x - nq.y * nq.y, 2.0 * nq.x * nq.y);
      float gw = exp(-0.22 * float(dx * dx + dy * dy));
      Jsum += Jq * gw;
      wSum += gw;
    }
  }
  vec2 J = (wSum > 1e-4) ? (Jsum / wSum) : vec2(1.0, 0.0);

  // Morphological opening w_tatami from 1x half-res dilation JFA
  uvec2 coreSeed = texelFetch(uCoreTex, pTile, 0).xy;
  vec2 fpHalf = vec2(pTile) + 0.5;
  float dCoreRef = (coreSeed.x == EMPTY) ? 64.0 : length(fpHalf - vec2(coreSeed) * INV_FP);
  float wTatami = 1.0 - smoothstep(uTatamiRadius - 1.2, uTatamiRadius + 1.2, dCoreRef);
  // Guarantee stars (64) and force-satin rails/accents (240) remain 100% Satin
  if (abs(regionByte - 64.0) < 12.0 || regionByte > 224.0) {
    wTatami = 0.0;
  }

  // Two-scale Vogel-disk stitch crowding AO combined into 1 compact channel
  float occTight = 0.0;
  float occBroad = 0.0;
  const float GOLDEN_ANGLE = 2.39996323;
  for (int i = 0; i < 12; i++) {
    float fi = float(i) + 0.5;
    float rN = sqrt(fi / 12.0);
    float ang = fi * GOLDEN_ANGLE;
    vec2 dir = vec2(cos(ang), sin(ang));

    ivec2 ptT = clamp(p + ivec2(round(dir * (rN * 3.2 * uBakeScale))), ivec2(0), uFullSize - 1);
    vec4 atT = texelFetch(uArtTex, ptT, 0);
    occTight += max(atT.g, atT.b);

    ivec2 ptB = clamp(p + ivec2(round(dir * (rN * 10.5 * uBakeScale))), ivec2(0), uFullSize - 1);
    vec4 atB = texelFetch(uArtTex, ptB, 0);
    occBroad += max(max(atB.g, atB.b), atB.r * 0.5);
  }
  float aoTight = 1.0 - (occTight / 12.0);
  float aoBroad = 1.0 - (occBroad / 12.0);
  float aoCrowd = clamp(0.55 * aoTight + 0.45 * aoBroad, 0.0, 1.0);

  if (uFloatDist > 0.5) {
    outDist = vec4(dRef, 0.0, 0.0, 1.0);
  } else {
    outDist = vec4(clamp(dRef / 32.0 * 0.5 + 0.5, 0.0, 1.0), 0.5, 0.0, 1.0);
  }
  outOrient = vec4(
    clamp(halfWidthRef / 16.0, 0.0, 1.0),
    clamp(J.x * 0.5 + 0.5, 0.0, 1.0),
    clamp(J.y * 0.5 + 0.5, 0.0, 1.0),
    clamp(dProudRef / 12.0 * 0.5 + 0.5, 0.0, 1.0)
  );
  outAux = vec4(wTatami, aoCrowd, 0.0, 1.0);
}
`;

// ============================================================================
// TIER A — PASS A5: Recessed Layer SDF Resolve (Color-Masked into uDistAtlas.G)
// ============================================================================
export const RESOLVE_REC_ATLAS_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uArtTex;
uniform highp usampler2D uRecSeedTex;
uniform ivec2 uFullSize;
uniform ivec2 uTileSize;
uniform ivec2 uTileOffset;
uniform float uBakeScale;
uniform float uFloatDist;

layout(location = 0) out vec4 outDist; // G channel only via gl.colorMask(false, true, false, false)

const uint EMPTY = 65535u;
const float INV_FP = 1.0 / 16.0;

float signedDistRec(ivec2 p) {
  ivec2 pc = clamp(p, ivec2(0), uFullSize - 1);
  float cov = texelFetch(uArtTex, pc, 0).r;
  uvec4 s = texelFetch(uRecSeedTex, pc, 0);
  vec2 fp = vec2(pc) + 0.5;
  if (cov >= 0.5) {
    float dIn = (s.z == EMPTY) ? 24.0 * uBakeScale : length(fp - vec2(s.zw) * INV_FP);
    return -dIn / uBakeScale;
  }
  float dOut = (s.x == EMPTY) ? 24.0 * uBakeScale : length(fp - vec2(s.xy) * INV_FP);
  return dOut / uBakeScale;
}

void main() {
  ivec2 pTile = clamp(ivec2(gl_FragCoord.xy) - uTileOffset, ivec2(0), uTileSize - 1);
  ivec2 p00 = pTile * 2;
  float dRec = 0.25 * (
    signedDistRec(p00) +
    signedDistRec(p00 + ivec2(1, 0)) +
    signedDistRec(p00 + ivec2(0, 1)) +
    signedDistRec(p00 + ivec2(1, 1))
  );

  if (uFloatDist > 0.5) {
    outDist = vec4(0.0, dRec, 0.0, 1.0);
  } else {
    outDist = vec4(0.5, clamp(dRec / 24.0 * 0.5 + 0.5, 0.0, 1.0), 0.0, 1.0);
  }
}
`;

// ============================================================================
// TIER A — PASS A6: Pack Discrete Region + 3-Layer Thread IDs into RG8 uMetaAtlas
// ============================================================================
export const PACK_META_ATLAS_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uRegionTex; // 720x520 R=regionCode
uniform sampler2D uThreadTex; // 720x520 R=tRec, G=tMain, B=tProud
uniform ivec2 uTileSize;
uniform ivec2 uTileOffset;

layout(location = 0) out vec4 outMeta; // R = regionCode, G = packed (tRec | tMain<<2 | tProud<<4) << 2

void main() {
  ivec2 pTile = clamp(ivec2(gl_FragCoord.xy) - uTileOffset, ivec2(0), uTileSize - 1);
  float reg = texelFetch(uRegionTex, pTile, 0).r;
  vec3 th = texelFetch(uThreadTex, pTile, 0).rgb;

  uint tRec   = uint(clamp(floor(th.r * 4.0), 0.0, 3.0));
  uint tMain  = uint(clamp(floor(th.g * 4.0), 0.0, 3.0));
  uint tProud = uint(clamp(floor(th.b * 4.0), 0.0, 3.0));
  uint packed = (tRec | (tMain << 2u) | (tProud << 4u)) << 2u;

  outMeta = vec4(reg, float(packed) / 255.0, 0.0, 1.0);
}
`;

// ============================================================================
// TIER B — PASS B1: Single-Pass Multi-Badge, Multi-Shape, Multi-Weave Optical Render
// ============================================================================
export const RENDER_FRAGMENT = `#version 300 es
precision highp float;

uniform sampler2D uDistAtlas;   // 2160x1040 RG16F: (dMain, dRecessed)
uniform sampler2D uOrientAtlas; // 2160x1040 RGBA8: (halfW/16, Jx, Jy, dProudPacked)
uniform sampler2D uAuxAtlas;    // 2160x1040 RG8:   (wTatami, aoCrowd)
uniform sampler2D uMetaAtlas;   // 2160x1040 RG8 NEAREST: (regionCode, packedThreads)

uniform vec2  uVpOriginPx;      // card stage bottom-left in canvas device pixels
uniform vec2  uVpSizeCss;       // card stage CSS width, height
uniform float uDpr;             // devicePixelRatio
uniform vec2  uTileGrid;        // atlas slot (col, row)
uniform vec2  uAtlasGrid;       // atlas grid dimensions (e.g. 3x2 sheet or 1x1 landing card)
uniform vec3  uLightDir;        // normalized studio key (Y-up, room space)
uniform float uFloatDist;       // 1.0 if RG16F, 0.0 if RGBA8 fallback
uniform float uSplit;           // Modal split loupe [0..1] (0 = full stitch)
uniform float uOpacity;         // Smooth hover crossfade opacity [0..1] (1 = stitch, 0 = monochrome <svg>)
uniform vec4  uPose;            // (dxCss, dyCss, angleRadCw, fitZoom) matching DOM <svg> to 0.00 px
uniform float uNight;           // 0 = Day paper, 1 = Night darkroom
uniform vec3  uCardLin;         // linear RGB of specimen tabletop behind patch (for Merrow bounce)

// Per-badge physical parameters
uniform int   uShapeId;         // 0=rect, 1=circle, 2=shield, 3=hexagon, 4=capsule, 5=arch
uniform int   uWeaveId;         // 0=twill, 1=felt, 2=canvas, 3=ripstop
uniform vec3  uSubstrateLin;    // linear substrate fabric albedo
uniform vec4  uSubstrateParam;  // (roughness, sheen, twillAngleRad, isLightSubstrate)
uniform vec3  uTatamiAngles;    // (angleA, angleB, angleProud) radians
uniform int   uMerrowThread;    // 0..3
uniform vec3  uThreadLin[4];    // 4-thread linear albedo palette
uniform vec3  uThreadOpt[4];    // (sheen, roughness, metallic) per thread

out vec4 fragColor;

const float PI  = 3.14159265359;
const float TAU = 6.28318530718;

const vec2  VIEW_REF_SIZE    = vec2(780.0, 560.0);
const vec2  BAKE_REF_SIZE    = vec2(720.0, 520.0);

const float MERROW_WIDTH     = 15.5;
const float MERROW_HALF_W    = 7.75;
const float MERROW_PITCH     = 3.75;

const float TWILL_PITCH      = 3.35;
const float SATIN_PITCH      = 2.10;
const float TATAMI_ROW_PITCH = 2.95;
const float TATAMI_SPAN      = 10.5;

// Locked closed-form silhouette constants (identical to patch/shapes.ts)
const vec2  RECT_HALF        = vec2(333.75, 201.75);
const float RECT_R           = 45.0;
const float CIRCLE_R         = 224.0;

const float SHIELD_W         = 200.0;
const float SHIELD_Y_TOP     = 214.0;
const float SHIELD_R_TOP     = 34.0;
const float SHIELD_Y_HIP     = 40.0;
const float SHIELD_R_BOT     = 30.0;
const float SHIELD_Y_BC      = -194.0;
const float SHIELD_R_FLANK   = 276.0470588;
const float SHIELD_X_F       = -76.0470588;
const float SHIELD_ALPHA_T   = 1.25658504; // atan(234.0, 76.0470588)

const float HEX_APOTHEM      = 218.2384018;
const float HEX_R_CORNER     = 36.0;
const float HEX_A_IN         = 182.2384018;
const float HEX_S_HALF       = 105.2153937; // HEX_A_IN / sqrt(3)

const float CAPSULE_HALF_S   = 148.0;
const float CAPSULE_R        = 178.0;

const float ARCH_W           = 200.0;
const float ARCH_Y_CENTER    = 24.0;
const float ARCH_Y_BOT       = -222.0;
const float ARCH_R_BOT       = 36.0;

// ---------------------------------------------------------------------------
// Noise, Color & Tone Helpers
// ---------------------------------------------------------------------------
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

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

float fbm2(vec2 p) {
  return 0.65 * vnoise(p) + 0.35 * vnoise(p * 2.13 + vec2(17.3, 9.1));
}

float ign(vec2 fragCoord) {
  return fract(52.9829189 * fract(dot(fragCoord, vec2(0.06711056, 0.00583715))));
}

vec3 linToSrgb(vec3 c) {
  vec3 x = max(c, vec3(0.0));
  vec3 lo = x * 12.92;
  vec3 hi = 1.055 * pow(max(x, vec3(1e-5)), vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(vec3(0.0031308), x));
}

vec3 softShoulder(vec3 c) {
  vec3 x = max(c, vec3(0.0));
  return mix(x, 0.86 + 0.14 * tanh((x - 0.86) / 0.28), step(vec3(0.86), x));
}

// ---------------------------------------------------------------------------
// Atlas Sampling (Tile-Clamped: Zero Cross-Tile Bleed)
// ---------------------------------------------------------------------------
vec2 tileUvToAtlas(vec2 localUv) {
  vec2 safeUv = clamp(localUv, vec2(0.5 / 720.0, 0.5 / 520.0), vec2(1.0 - 0.5 / 720.0, 1.0 - 0.5 / 520.0));
  return (uTileGrid + safeUv) / uAtlasGrid;
}

vec2 sampleDists(vec2 localUv) {
  vec2 d = texture(uDistAtlas, tileUvToAtlas(localUv)).rg;
  if (uFloatDist > 0.5) return d;
  return vec2((d.r - 0.5) * 64.0, (d.g - 0.5) * 48.0);
}

vec4 sampleOrient(vec2 localUv) {
  vec4 o = texture(uOrientAtlas, tileUvToAtlas(localUv));
  return vec4(o.r * 16.0, o.g * 2.0 - 1.0, o.b * 2.0 - 1.0, (o.a - 0.5) * 24.0);
}

float sampleProudDist(vec2 localUv) {
  return (texture(uOrientAtlas, tileUvToAtlas(localUv)).a - 0.5) * 24.0;
}

// ---------------------------------------------------------------------------
// Exact-Arclength C^1 Closed-Form Merrow Geometry for ALL 6 Silhouettes
// ---------------------------------------------------------------------------
struct MerrowGeom {
  float sd;         // signed distance to merrow centerline (negative inside)
  float s;          // continuous clockwise perimeter arclength [0, L)
  float L;          // total perimeter length
  vec2  N;          // unit outward normal
  float cornerAmt;  // 0 on straights, 1 on tight corners, ~0.22 on broad arcs
};

MerrowGeom evalRectGeom(vec2 p, vec2 b, float r, float cornerScale) {
  vec2 h = b - vec2(r);
  vec2 a = abs(p);
  vec2 q = a - h;
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;

  float arc = 0.5 * PI * r;
  float Q = h.x + arc + h.y;
  float sq;
  vec2 nQuad;
  if (q.x > 0.0 && q.y > 0.0) {
    sq = h.x + r * atan(q.x, q.y);
    nQuad = normalize(q);
  } else if (q.x > q.y) {
    sq = h.x + arc + (h.y - a.y);
    nQuad = vec2(1.0, 0.0);
  } else {
    sq = a.x;
    nQuad = vec2(0.0, 1.0);
  }

  float s = (p.x >= 0.0)
    ? ((p.y >= 0.0) ? sq : (2.0 * Q - sq))
    : ((p.y <  0.0) ? (2.0 * Q + sq) : (4.0 * Q - sq));

  vec2 N = nQuad * vec2(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0);
  float cornerAmt = smoothstep(-2.5, 2.5, q.x) * smoothstep(-2.5, 2.5, q.y) * cornerScale;
  return MerrowGeom(sd, s, 4.0 * Q, N, cornerAmt);
}

MerrowGeom evalCircleGeom(vec2 p, float R) {
  float rad = length(p);
  float sd = rad - R;
  vec2 N = (rad > 1e-4) ? (p / rad) : vec2(0.0, 1.0);
  float ang = atan(p.x, p.y); // clockwise from +Y in [-PI, PI]
  float cw = (ang < 0.0) ? (ang + TAU) : ang;
  return MerrowGeom(sd, cw * R, TAU * R, N, 0.20);
}

MerrowGeom evalShieldGeom(vec2 p) {
  float ax = abs(p.x);
  vec2 q = vec2(ax, p.y);

  const float X_TC = SHIELD_W - SHIELD_R_TOP; // 166
  const float Y_TC = SHIELD_Y_TOP - SHIELD_R_TOP; // 180
  const float L1 = X_TC;
  const float L2 = 0.5 * PI * SHIELD_R_TOP;
  const float L3 = Y_TC - SHIELD_Y_HIP;
  const float L4 = SHIELD_R_FLANK * SHIELD_ALPHA_T;
  const float L5 = SHIELD_R_BOT * (0.5 * PI - SHIELD_ALPHA_T);
  const float H = L1 + L2 + L3 + L4 + L5;

  float bestD2 = 1e20;
  vec2 bestCp = vec2(0.0);
  vec2 bestN = vec2(0.0, 1.0);
  float bestS = 0.0;
  float bestCorner = 0.0;

  // Piece 1: Top flat (0, Y_TOP) -> (X_TC, Y_TOP)
  {
    float tx = clamp(q.x, 0.0, X_TC);
    vec2 cp = vec2(tx, SHIELD_Y_TOP);
    vec2 dv = q - cp;
    float d2 = dot(dv, dv);
    if (d2 < bestD2) {
      bestD2 = d2; bestCp = cp; bestN = vec2(0.0, 1.0); bestS = tx; bestCorner = 0.0;
    }
  }
  // Piece 2: Top-right corner arc centered at (X_TC, Y_TC), clockwise from +Y in [0, PI/2]
  {
    vec2 v = q - vec2(X_TC, Y_TC);
    float ang = clamp(atan(v.x, v.y), 0.0, 0.5 * PI);
    vec2 n = vec2(sin(ang), cos(ang));
    vec2 cp = vec2(X_TC, Y_TC) + n * SHIELD_R_TOP;
    vec2 dv = q - cp;
    float d2 = dot(dv, dv);
    if (d2 < bestD2) {
      bestD2 = d2; bestCp = cp; bestN = n; bestS = L1 + SHIELD_R_TOP * ang;
      bestCorner = smoothstep(0.0, 0.14, ang) * smoothstep(0.5 * PI, 0.5 * PI - 0.14, ang);
    }
  }
  // Piece 3: Vertical right flank (W, Y_TC) -> (W, Y_HIP)
  {
    float ty = clamp(q.y, SHIELD_Y_HIP, Y_TC);
    vec2 cp = vec2(SHIELD_W, ty);
    vec2 dv = q - cp;
    float d2 = dot(dv, dv);
    if (d2 < bestD2) {
      bestD2 = d2; bestCp = cp; bestN = vec2(1.0, 0.0); bestS = L1 + L2 + (Y_TC - ty); bestCorner = 0.0;
    }
  }
  // Piece 4: Curved lower flank arc centered at (X_F, Y_HIP), angle clockwise below +X in [0, ALPHA_T]
  {
    vec2 v = q - vec2(SHIELD_X_F, SHIELD_Y_HIP);
    float ang = clamp(atan(-v.y, v.x), 0.0, SHIELD_ALPHA_T);
    vec2 n = vec2(cos(ang), -sin(ang));
    vec2 cp = vec2(SHIELD_X_F, SHIELD_Y_HIP) + n * SHIELD_R_FLANK;
    vec2 dv = q - cp;
    float d2 = dot(dv, dv);
    if (d2 < bestD2) {
      bestD2 = d2; bestCp = cp; bestN = n; bestS = L1 + L2 + L3 + SHIELD_R_FLANK * ang;
      bestCorner = 0.18;
    }
  }
  // Piece 5: Bottom shield point fillet centered at (0, Y_BC), angle below +X in [ALPHA_T, PI/2]
  {
    vec2 v = q - vec2(0.0, SHIELD_Y_BC);
    float ang = clamp(atan(-v.y, max(v.x, 0.0)), SHIELD_ALPHA_T, 0.5 * PI);
    vec2 n = vec2(cos(ang), -sin(ang));
    vec2 cp = vec2(0.0, SHIELD_Y_BC) + n * SHIELD_R_BOT;
    vec2 dv = q - cp;
    float d2 = dot(dv, dv);
    if (d2 < bestD2) {
      bestD2 = d2; bestCp = cp; bestN = n; bestS = L1 + L2 + L3 + L4 + SHIELD_R_BOT * (ang - SHIELD_ALPHA_T);
      bestCorner = mix(0.18, 0.85, smoothstep(SHIELD_ALPHA_T, SHIELD_ALPHA_T + 0.14, ang));
    }
  }

  float dist = sqrt(bestD2);
  float sgn = (dot(q - bestCp, bestN) >= 0.0) ? 1.0 : -1.0;
  float sd = sgn * dist;
  float s = (p.x >= 0.0) ? bestS : (2.0 * H - bestS);
  vec2 N = (p.x >= 0.0) ? bestN : vec2(-bestN.x, bestN.y);
  return MerrowGeom(sd, mod(s, 2.0 * H), 2.0 * H, N, bestCorner);
}

MerrowGeom evalHexGeom(vec2 p) {
  float ang = atan(p.x, p.y); // clockwise from +Y
  float cw = (ang < 0.0) ? (ang + TAU) : ang;
  float sector = floor(mod(cw + PI / 6.0, TAU) / (PI / 3.0));
  float angK = sector * (PI / 3.0);

  vec2 nEdge = vec2(sin(angK), cos(angK));
  vec2 tEdge = vec2(cos(angK), -sin(angK));
  float rx = dot(p, tEdge);
  float ry = dot(p, nEdge);

  vec2 q = vec2(abs(rx) - HEX_S_HALF, ry - HEX_A_IN);
  float sd;
  vec2 nLoc;
  float sOff;
  if (q.x <= 0.0) {
    sd = q.y - HEX_R_CORNER;
    nLoc = vec2(0.0, 1.0);
    sOff = rx;
  } else {
    float qLen = length(q);
    sd = qLen - HEX_R_CORNER;
    nLoc = vec2(rx < 0.0 ? -q.x : q.x, q.y) / max(qLen, 1e-5);
    float phi = atan(q.x, max(q.y, 1e-5));
    sOff = (rx < 0.0 ? -1.0 : 1.0) * (HEX_S_HALF + HEX_R_CORNER * phi);
  }

  float S_sec = 2.0 * HEX_S_HALF + (PI / 3.0) * HEX_R_CORNER;
  float L = 6.0 * S_sec;
  float s = mod(sector * S_sec + sOff, L);
  vec2 N = tEdge * nLoc.x + nEdge * nLoc.y;
  float cornerAmt = smoothstep(-2.5, 2.5, q.x) * 0.85;
  return MerrowGeom(sd, s, L, N, cornerAmt);
}

MerrowGeom evalArchGeom(vec2 p) {
  float ax = abs(p.x);
  vec2 q = vec2(ax, p.y);

  const float X_BC = ARCH_W - ARCH_R_BOT; // 164
  const float Y_BC = ARCH_Y_BOT + ARCH_R_BOT; // -186
  const float L1 = 0.5 * PI * ARCH_W;
  const float L2 = ARCH_Y_CENTER - Y_BC;
  const float L3 = 0.5 * PI * ARCH_R_BOT;
  const float L4 = X_BC;
  const float H = L1 + L2 + L3 + L4;

  float bestD2 = 1e20;
  vec2 bestCp = vec2(0.0);
  vec2 bestN = vec2(0.0, 1.0);
  float bestS = 0.0;
  float bestCorner = 0.0;

  // Piece 1: Top semicircular arch centered at (0, ARCH_Y_CENTER), clockwise from +Y in [0, PI/2]
  {
    vec2 v = q - vec2(0.0, ARCH_Y_CENTER);
    float ang = clamp(atan(max(v.x, 0.0), v.y), 0.0, 0.5 * PI);
    vec2 n = vec2(sin(ang), cos(ang));
    vec2 cp = vec2(0.0, ARCH_Y_CENTER) + n * ARCH_W;
    vec2 dv = q - cp;
    float d2 = dot(dv, dv);
    if (d2 < bestD2) {
      bestD2 = d2; bestCp = cp; bestN = n; bestS = ARCH_W * ang;
      bestCorner = 0.22 * smoothstep(0.5 * PI, 0.5 * PI - 0.14, ang);
    }
  }
  // Piece 2: Right vertical flank (W, ARCH_Y_CENTER) -> (W, Y_BC)
  {
    float ty = clamp(q.y, Y_BC, ARCH_Y_CENTER);
    vec2 cp = vec2(ARCH_W, ty);
    vec2 dv = q - cp;
    float d2 = dot(dv, dv);
    if (d2 < bestD2) {
      bestD2 = d2; bestCp = cp; bestN = vec2(1.0, 0.0); bestS = L1 + (ARCH_Y_CENTER - ty); bestCorner = 0.0;
    }
  }
  // Piece 3: Bottom-right corner arc centered at (X_BC, Y_BC), angle below +X in [0, PI/2]
  {
    vec2 v = q - vec2(X_BC, Y_BC);
    float ang = clamp(atan(-v.y, v.x), 0.0, 0.5 * PI);
    vec2 n = vec2(cos(ang), -sin(ang));
    vec2 cp = vec2(X_BC, Y_BC) + n * ARCH_R_BOT;
    vec2 dv = q - cp;
    float d2 = dot(dv, dv);
    if (d2 < bestD2) {
      bestD2 = d2; bestCp = cp; bestN = n; bestS = L1 + L2 + ARCH_R_BOT * ang;
      bestCorner = smoothstep(0.0, 0.14, ang) * smoothstep(0.5 * PI, 0.5 * PI - 0.14, ang);
    }
  }
  // Piece 4: Bottom flat edge (X_BC, Y_BOT) -> (0, Y_BOT)
  {
    float tx = clamp(q.x, 0.0, X_BC);
    vec2 cp = vec2(tx, ARCH_Y_BOT);
    vec2 dv = q - cp;
    float d2 = dot(dv, dv);
    if (d2 < bestD2) {
      bestD2 = d2; bestCp = cp; bestN = vec2(0.0, -1.0); bestS = L1 + L2 + L3 + (X_BC - tx); bestCorner = 0.0;
    }
  }

  float dist = sqrt(bestD2);
  float sgn = (dot(q - bestCp, bestN) >= 0.0) ? 1.0 : -1.0;
  float sd = sgn * dist;
  float s = (p.x >= 0.0) ? bestS : (2.0 * H - bestS);
  vec2 N = (p.x >= 0.0) ? bestN : vec2(-bestN.x, bestN.y);
  return MerrowGeom(sd, mod(s, 2.0 * H), 2.0 * H, N, bestCorner);
}

MerrowGeom evalMerrowGeom(vec2 p, int shapeId) {
  if (shapeId == 1) return evalCircleGeom(p, CIRCLE_R);
  if (shapeId == 2) return evalShieldGeom(p);
  if (shapeId == 3) return evalHexGeom(p);
  if (shapeId == 4) return evalRectGeom(p, vec2(CAPSULE_HALF_S + CAPSULE_R, CAPSULE_R), CAPSULE_R, 0.26);
  if (shapeId == 5) return evalArchGeom(p);
  return evalRectGeom(p, RECT_HALF, RECT_R, 1.0);
}

// ---------------------------------------------------------------------------
// Helical 2-Ply Z-Twist Micro-Normal Perturbation
// ---------------------------------------------------------------------------
vec3 applyPlyTwist(vec3 N, vec3 T, vec2 pPx, float pxPerTexel, float strength) {
  float kTwist = TAU / 3.4;
  float att = exp(-0.5 * pow(kTwist * pxPerTexel * 0.44, 2.0));
  vec2 t2 = normalize(T.xy + vec2(1e-5, 0.0));
  vec2 b2 = vec2(-t2.y, t2.x);
  float phase = dot(pPx, t2) * kTwist + dot(pPx, b2) * (kTwist * 0.58);
  float twist = strength * att * sin(phase);
  vec3 B = normalize(cross(N, T));
  return normalize(N + B * twist);
}

// ---------------------------------------------------------------------------
// Dual-Lobe Shifted-Tangent Kajiya-Kay / Marschner + Metallic Bullion Reflectance
// ---------------------------------------------------------------------------
vec3 shadeFiber(
  vec3 albedoLin,
  vec3 N,
  vec3 T_raw,
  vec3 V,
  vec3 L,
  float roughness,
  float sheenStrength,
  float fuzzStrength,
  float metallic,
  float ao,
  float cardBounce
) {
  vec3 T = normalize(T_raw - N * dot(T_raw, N) + vec3(1e-5, 0.0, 0.0));
  vec3 H = normalize(L + V);

  float NdotL = max(dot(N, L), 0.0);
  float NdotV = max(dot(N, V), 0.0);
  float wrapDiff = clamp((dot(N, L) + 0.14) / 1.14, 0.0, 1.0);
  float sinTL = sqrt(max(0.0, 1.0 - dot(T, L) * dot(T, L)));
  float diff = mix(wrapDiff, sinTL * clamp((dot(N, L) + 0.08) / 1.08, 0.0, 1.0), 0.36);

  vec3 T1 = normalize(T + 0.08 * N);
  vec3 T2 = normalize(T - 0.16 * N);
  float sinTH1 = sqrt(max(0.0, 1.0 - dot(T1, H) * dot(T1, H)));
  float sinTH2 = sqrt(max(0.0, 1.0 - dot(T2, H) * dot(T2, H)));

  float p1 = mix(64.0, 7.0, roughness);
  float p2 = mix(15.0, 3.0, roughness);
  float norm1 = (p1 + 2.0) / 38.0;
  float norm2 = (p2 + 2.0) / 14.0;

  float F = 0.04 + 0.96 * pow(max(1.0 - max(dot(H, V), 0.0), 1e-5), 5.0);
  float spec1 = pow(max(sinTH1, 1e-5), p1) * norm1 * (0.30 + 0.70 * F);
  float spec2 = pow(max(sinTH2, 1e-5), p2) * norm2;

  float fuzz = pow(max(1.0 - NdotV, 1e-5), 3.0) * fuzzStrength * (0.35 + 0.65 * NdotL);

  vec3 keyColor = vec3(1.01, 1.00, 0.99);
  vec3 ambSky   = mix(vec3(0.20, 0.205, 0.215), vec3(0.16, 0.175, 0.205), uNight);
  vec3 ambGnd   = mix(vec3(0.055, 0.057, 0.062), vec3(0.035, 0.040, 0.055), uNight);
  vec3 ambient  = mix(ambGnd, ambSky, 0.5 + 0.5 * N.z) * albedoLin * ao * mix(1.0, 0.72, metallic);
  vec3 bounceCol = mix(vec3(0.22), uCardLin * 0.42, 0.65);
  vec3 bounce   = bounceCol * albedoLin * cardBounce * max(-N.y, 0.0) * (0.35 + 0.65 * ao);

  // Conductor-tinted specular for Metallic Bullion thread vs dielectric white glint for Rayon/Cotton
  vec3 spec1Tint = mix(vec3(1.0), min(albedoLin * 1.55 + vec3(0.18), vec3(1.45)), metallic);
  vec3 spec2Tint = mix(albedoLin * 0.72 + vec3(0.28), albedoLin * 1.25, metallic);
  float diffAtten = mix(1.0, 0.62, metallic);

  vec3 direct = keyColor * (
    albedoLin * diff * diffAtten * (0.86 + 0.14 * ao) +
    spec1Tint * spec1 * sheenStrength * 0.52 * NdotL +
    spec2Tint * spec2 * sheenStrength * 0.34 * NdotL +
    (albedoLin * 0.55 + vec3(0.18)) * fuzz
  );

  return ambient + bounce + direct * mix(0.16, 1.0, ao);
}

// ---------------------------------------------------------------------------
// 4 Physically Distinct Procedural Substrates (Twill, Felt, Duck Canvas, Ripstop)
// ---------------------------------------------------------------------------
struct SurfaceSample {
  float height;
  vec2  grad;
  vec3  tangent;
  float roughness;
  float ao;
  float fuzz;
  vec3  albedoMod;
};

SurfaceSample evalTwill(vec2 pPx, float angleRad, float baseRough, float pxPerTexel) {
  float ca = cos(angleRad);
  float sa = sin(angleRad);
  vec2 dirAlong = vec2(ca, sa);
  vec2 dirPerp  = vec2(-sa, ca);

  float qPerp  = dot(pPx, dirPerp);
  float qAlong = dot(pPx, dirAlong);

  float drift = 0.32 * (fbm2(pPx * 0.016) - 0.5);
  float kWale = TAU / TWILL_PITCH;
  float phiW  = (qPerp + drift) * kWale;

  float kBead = TAU / (TWILL_PITCH * 1.15);
  float waleIdx = floor((qPerp + drift) / TWILL_PITCH);
  float phiB  = qAlong * kBead + 0.5 * PI * waleIdx;

  float attW  = exp(-0.5 * pow(kWale * pxPerTexel * 0.42, 2.0));
  float attW2 = attW * attW * attW * attW;
  float attB  = exp(-0.5 * pow(kBead * pxPerTexel * 0.42, 2.0));

  float waleH = 0.5 + 0.45 * attW * cos(phiW) + 0.13 * attW2 * cos(2.0 * phiW - 0.44);
  float dWale_dPerp = (-0.45 * attW * sin(phiW) - 0.26 * attW2 * sin(2.0 * phiW - 0.44)) * kWale;

  float beadH = 0.5 + 0.5 * attB * cos(phiB);
  float dBead_dAlong = -0.5 * attB * sin(phiB) * kBead;

  float clothWave = (fbm2(pPx * 0.045) - 0.5) * 0.48 + (vnoise(pPx * 0.11) - 0.5) * 0.22;
  float fiberGrain = (vnoise(pPx * 0.72) - 0.5) * 0.26 * attW;
  float yarnSlub = (hash12(vec2(waleIdx, floor(qAlong / 6.0))) - 0.5) * 0.18 * attW;

  float h = clamp(waleH * (0.72 + 0.28 * beadH) + 0.08 * clothWave + 0.06 * fiberGrain, 0.0, 1.0);
  vec2 grad = (dirPerp * (dWale_dPerp * (0.72 + 0.28 * beadH)) + dirAlong * (waleH * 0.28 * dBead_dAlong)) * 0.46;

  vec2 yarnDir = normalize(dirAlong * 0.65 + dirPerp * 0.76);
  vec3 T = normalize(vec3(yarnDir, dot(grad, yarnDir)));

  float valleyDepth = smoothstep(0.11, 0.72, waleH * (0.78 + 0.22 * beadH));
  float sheenMod = clamp(0.86 + clothWave + fiberGrain + yarnSlub, 0.34, 1.24);
  float microAo = mix(0.015, 1.0, pow(max(valleyDepth, 1e-4), 0.74)) * sheenMod;
  float lostVar = (1.0 - attW * attW) * 0.26;
  return SurfaceSample(h, grad, T, clamp(baseRough + lostVar, 0.0, 0.96), microAo, 0.004, vec3(1.0));
}

SurfaceSample evalWoolFelt(vec2 pPx, float baseRough, float pxPerTexel) {
  // Isotropic matted wool fibers: 3 rotated short-fiber domains + pressed-felt clouding (ZERO twill stripes!)
  float attF = exp(-0.5 * pow((TAU / 3.2) * pxPerTexel * 0.42, 2.0));
  vec2 warp = vec2(fbm2(pPx * 0.065), fbm2(pPx * 0.065 + vec2(11.4, 5.7))) - 0.5;
  vec2 pw = pPx + warp * 3.8;

  // 3 non-orthogonal entangled short fiber orientations (0 deg, 58 deg, 118 deg)
  float f0 = vnoise(vec2(pw.x * 0.48, pw.y * 1.45));
  vec2 r1 = vec2(0.530 * pw.x - 0.848 * pw.y, 0.848 * pw.x + 0.530 * pw.y);
  float f1 = vnoise(vec2(r1.x * 0.46, r1.y * 1.42) + vec2(7.3, 2.1));
  vec2 r2 = vec2(-0.469 * pw.x - 0.883 * pw.y, 0.883 * pw.x - 0.469 * pw.y);
  float f2 = vnoise(vec2(r2.x * 0.50, r2.y * 1.38) + vec2(19.1, 13.7));

  float microTangle = (f0 + f1 + f2) / 3.0;
  float coarseNap   = fbm2(pPx * 0.042 + vec2(3.1, 8.9));
  float medTuft     = vnoise(pPx * 0.22);

  // Finite-difference gradient of matted wool nap
  float eps = 0.75;
  float hX = vnoise(vec2((pw.x + eps) * 0.48, pw.y * 1.45)) - f0;
  float hY = vnoise(vec2(pw.x * 0.48, (pw.y + eps) * 1.45)) - f0;
  vec2 grad = vec2(hX, hY) * (1.35 * attF) + (vec2(vnoise(pPx * 0.24 + vec2(0.8, 0.0)), vnoise(pPx * 0.24 + vec2(0.0, 0.8))) - medTuft) * 0.65;

  float h = clamp(0.45 * microTangle + 0.35 * medTuft + 0.20 * coarseNap, 0.0, 1.0);
  // Random local fiber tangent -> fully isotropic wool matte look
  float tAng = microTangle * TAU;
  vec3 T = normalize(vec3(cos(tAng), sin(tAng), 0.15));

  float ao = clamp(mix(0.42, 1.12, h) * (0.86 + 0.28 * coarseNap), 0.25, 1.18);
  // Subtle heathered navy melange fiber flecks
  vec3 melange = mix(vec3(0.88, 0.91, 0.96), vec3(1.14, 1.16, 1.22), smoothstep(0.25, 0.82, microTangle));
  return SurfaceSample(h, grad, T, clamp(baseRough + (1.0 - attF * attF) * 0.10, 0.72, 0.98), ao, 0.22, melange);
}

SurfaceSample evalCottonCanvas(vec2 pPx, float baseRough, float pxPerTexel) {
  // 1/1 orthogonal plain-weave natural cotton duck canvas (warp + weft basket crossovers + slubs!)
  float pitch = 3.85;
  float k = TAU / pitch;
  float att = exp(-0.5 * pow(k * pxPerTexel * 0.42, 2.0));

  vec2 drift = vec2(fbm2(pPx * 0.018) - 0.5, fbm2(pPx * 0.018 + vec2(13.7, 4.2)) - 0.5) * 0.42;
  vec2 q = pPx + drift;

  float ix = floor(q.x / pitch);
  float iy = floor(q.y / pitch);
  float fx = fract(q.x / pitch);
  float fy = fract(q.y / pitch);

  // Per-thread natural spun-cotton slub thickness & slight hue warmth variation
  float warpSlub = (hash12(vec2(ix * 3.1, 1.7)) - 0.5) * 0.18 + (vnoise(vec2(ix, q.y * 0.05)) - 0.5) * 0.14;
  float weftSlub = (hash12(vec2(2.3, iy * 3.7)) - 0.5) * 0.18 + (vnoise(vec2(q.x * 0.05, iy)) - 0.5) * 0.14;

  // Checkerboard 1/1 over-under alternation: parity = 0 -> warp over weft, 1 -> weft over warp
  float parity = mod(ix + iy, 2.0);
  float cx = 0.5 + 0.5 * cos((fx - 0.5) * TAU); // warp yarn cylinder arch across X
  float cy = 0.5 + 0.5 * cos((fy - 0.5) * TAU); // weft yarn cylinder arch across Y

  // Arch along the yarn as it rises over the crossing yarn
  float warpOver = mix(cx * (0.45 + 0.55 * cy), cx * 0.42, parity);
  float weftOver = mix(cy * 0.42, cy * (0.45 + 0.55 * cx), parity);
  float weaveH = mix(0.5, max(warpOver, weftOver), att);

  float dWarpX = -sin((fx - 0.5) * TAU) * k * 0.30 * att;
  float dWeftY = -sin((fy - 0.5) * TAU) * k * 0.30 * att;
  vec2 grad = mix(vec2(dWarpX, dWeftY * 0.45), vec2(dWarpX * 0.45, dWeftY), parity);

  vec3 T = (parity < 0.5) ? normalize(vec3(0.0, 1.0, 0.18 * grad.y)) : normalize(vec3(1.0, 0.0, 0.18 * grad.x));

  // Soft weave crevices (natural unbleached canvas stays bright & tactile, not black holes)
  float clothWave = (fbm2(pPx * 0.035) - 0.5) * 0.12;
  float seedFleck = smoothstep(0.955, 0.992, vnoise(pPx * 0.58 + vec2(21.0, 7.0))) * att;
  float ao = mix(0.68, 1.05, weaveH) * (0.95 + 0.08 * clothWave) * (1.0 - 0.28 * seedFleck);

  vec3 slubTint = vec3(1.0) + vec3(0.03, 0.015, -0.025) * (warpSlub + weftSlub) - vec3(0.18, 0.22, 0.28) * seedFleck;
  return SurfaceSample(weaveH, grad, T, clamp(baseRough + (1.0 - att * att) * 0.14, 0.60, 0.95), ao, 0.10, slubTint);
}

SurfaceSample evalRipstop(vec2 pPx, float baseRough, float pxPerTexel) {
  // Fine matte-satin nylon base weave + raised orthogonal double-thread ripstop reinforcement ribs every 18 px!
  float basePitch = 2.4;
  float gridPitch = 18.0;
  float kBase = TAU / basePitch;
  float attBase = exp(-0.5 * pow(kBase * pxPerTexel * 0.42, 2.0));
  float attRib  = exp(-0.5 * pow((TAU / 3.2) * pxPerTexel * 0.42, 2.0));

  vec2 drift = vec2(fbm2(pPx * 0.015) - 0.5, fbm2(pPx * 0.015 + vec2(9.2, 16.4)) - 0.5) * 0.55;
  vec2 q = pPx + drift;

  // Fine 1/1 nylon base micro-texture
  float bx = 0.5 + 0.5 * cos(q.x * kBase);
  float by = 0.5 + 0.5 * cos(q.y * kBase);
  float baseH = mix(0.5, 0.5 * (bx + by), attBase);
  vec2 baseGrad = vec2(-sin(q.x * kBase), -sin(q.y * kBase)) * (0.14 * attBase);

  // Raised orthogonal ripstop reinforcement cords (double-filament 2.5 px wide every 18 px)
  vec2 gMod = abs(fract(q / gridPitch + 0.5) - 0.5) * gridPitch; // distance to nearest grid line [0..9]
  float ribX = smoothstep(1.65, 0.15, gMod.x); // vertical reinforcement cord
  float ribY = smoothstep(1.65, 0.15, gMod.y); // horizontal reinforcement cord
  float ribAny = max(ribX, ribY);
  float knot = ribX * ribY; // raised intersection knot

  // Signed slope of raised cords
  vec2 gSigned = (fract(q / gridPitch + 0.5) - 0.5) * gridPitch;
  float dRibX = -sign(gSigned.x) * smoothstep(1.75, 0.75, gMod.x) * smoothstep(0.0, 0.75, gMod.x) * 1.15 * attRib;
  float dRibY = -sign(gSigned.y) * smoothstep(1.75, 0.75, gMod.y) * smoothstep(0.0, 0.75, gMod.y) * 1.15 * attRib;
  vec2 grad = baseGrad + vec2(dRibX, dRibY);

  float clothWave = (fbm2(pPx * 0.04) - 0.5) * 0.24;
  float h = clamp(0.45 * baseH + 0.45 * ribAny + 0.15 * knot + 0.06 * clothWave, 0.0, 1.0);

  vec3 T = (ribX > ribY)
    ? normalize(vec3(0.0, 1.0, 0.2))
    : normalize(vec3(1.0, 0.0, 0.2));

  // Crisp subtle moat flanking each raised ripstop cord + glossy crest on the cord & intersection knot
  float cordShadow = 1.0 - 0.26 * (smoothstep(2.6, 1.5, gMod.x) * (1.0 - ribX) + smoothstep(2.6, 1.5, gMod.y) * (1.0 - ribY)) * attRib;
  float cordHighlight = 1.0 + (0.28 * ribAny + 0.18 * knot) * attRib;
  float ao = mix(0.62, 1.0, baseH) * cordShadow * cordHighlight * (0.92 + 0.18 * clothWave);
  float rough = clamp(mix(baseRough, 0.28, ribAny * attRib) + (1.0 - attBase * attBase) * 0.15, 0.20, 0.90);

  return SurfaceSample(h, grad, T, rough, ao, 0.02, vec3(1.0));
}

// ---------------------------------------------------------------------------
// Layer 3a: Nematic-Invariant 3x3 Complex Phasor Satin Ribs (Exact Stage-1)
// ---------------------------------------------------------------------------
vec4 phasorSatinRib(vec2 pPx, vec2 T, float pitchPx, float pxPerTexel) {
  float cell = 2.6 * pitchPx;
  float k0 = TAU / pitchPx;
  float sigma = 0.74 * cell;
  float inv2s2 = 0.5 / (sigma * sigma);

  float att = exp(-0.5 * pow(k0 * pxPerTexel * 0.42, 2.0));
  vec2 grid = floor(pPx / cell);
  vec2 Z = vec2(0.0);

  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 id = grid + vec2(float(dx), float(dy));
      vec2 h = hash22(id);
      vec2 c = (id + 0.5 + (h - 0.5) * 0.22) * cell;
      vec2 r = pPx - c;
      float w = exp(-dot(r, r) * inv2s2);
      float ph = k0 * dot(r, T);
      Z += w * vec2(cos(ph), sin(ph));
    }
  }

  float amp = length(Z);
  float conf = amp / (amp + 0.05);
  float phase = atan(Z.y, Z.x);

  float c = cos(phase);
  float ribH = 0.5 + 0.5 * att * conf * (c + 0.16 * (2.0 * c * c - 1.0));
  float dRib_dT = -0.5 * att * conf * k0 * sin(phase) * (1.0 + 0.64 * c);

  return vec4(ribH, T * dRib_dT, c * att * conf);
}

// ---------------------------------------------------------------------------
// Layer 3b: Uncorrelated Long-Short Silky Tatami Fill (Exact Stage-1)
// ---------------------------------------------------------------------------
SurfaceSample evalTatami(
  vec2 pPx,
  float dEdge,
  float rowPitchPx,
  float stitchLenPx,
  float fillAngleRad,
  float baseRough,
  float pxPerTexel
) {
  float ca = cos(fillAngleRad);
  float sa = sin(fillAngleRad);
  vec2 dirAlong = vec2(ca, sa);
  vec2 dirAcross = vec2(-sa, ca);

  float qx = dot(pPx, dirAlong);
  float qy = dot(pPx, dirAcross);

  float effPitch = rowPitchPx * 0.85;
  float rowWobble = 0.55 * (fbm2(vec2(qx * 0.03, qy * 0.07)) - 0.5);
  float rowF = (qy + rowWobble) / effPitch;
  float rowIdx = floor(rowF);
  float rowU = fract(rowF) * 2.0 - 1.0;

  float rowHashA = hash12(vec2(rowIdx * 13.7 + 3.1, 7.9));
  float rowHashB = hash12(vec2(rowIdx * 5.3 + 19.7, 3.7));
  float localSpan = mix(stitchLenPx * 1.62, stitchLenPx * 2.48, rowHashB);

  float alongF = qx / localSpan + rowHashA;
  float segIdx = floor(alongF);
  float alongU = fract(alongF);

  float kRow = TAU / effPitch;
  float kLen = TAU / localSpan;
  float attRow = exp(-0.5 * pow(kRow * pxPerTexel * 0.42, 2.0));
  float attLen = exp(-0.5 * pow(kLen * pxPerTexel * 0.42, 2.0));

  float streakMacro = fbm2(vec2(qx * 0.048, qy * 0.38));
  float streakFine  = vnoise(vec2(qx * 0.085, qy * 0.68));
  float streak = 0.62 * streakMacro + 0.38 * streakFine;

  float cylH = 0.5 + 0.5 * attRow * cos(rowU * PI);
  float dCyl_dAcross = -0.5 * attRow * sin(rowU * PI) * kRow;

  float endDistU = min(alongU, 1.0 - alongU);
  float pinMask = smoothstep(0.0, 1.8 / localSpan, endDistU);
  float sinA = max(sin(alongU * PI), 1e-4);
  float arch = pow(sinA, 0.16);
  float archH = mix(1.0, arch, attLen);
  float dArch_dAlong = attLen * 0.16 * pow(max(sinA, 1e-3), -0.84) * cos(alongU * PI) * (PI / localSpan);
  dArch_dAlong = clamp(dArch_dAlong, -0.75, 0.75);

  float stitchRnd = hash12(vec2(rowIdx * 1.7 + 11.0, segIdx * 2.3 + 5.0));
  float edgeTuck = smoothstep(0.0, 2.4, -dEdge);

  float h = edgeTuck * (0.64 + 0.36 * cylH) * (0.86 + 0.14 * archH) * (0.76 + 0.44 * streak);
  vec2 grad = dirAlong * (dArch_dAlong * 0.24) + dirAcross * (dCyl_dAcross * 0.48 + 0.34 * (streak - 0.5));

  float dipSlope = attLen * cos(alongU * PI) * 0.22 + 0.20 * (streak - 0.5) + 0.10 * (stitchRnd - 0.5);
  vec3 T = normalize(vec3(dirAlong, dipSlope));

  float pinholeAo = mix(0.82, 1.0, pinMask);
  float valleyAo  = mix(0.34, 1.0, pow(max(cylH, 1e-4), 1.05));
  float strandMod = mix(0.42, 1.14, smoothstep(0.14, 0.86, streak));
  float lostVar   = (1.0 - attRow * attRow) * 0.25;

  return SurfaceSample(
    h,
    grad,
    T,
    clamp(baseRough + 0.02 + lostVar, 0.0, 0.90),
    pinholeAo * valleyAo * strandMod * (0.90 + 0.16 * stitchRnd),
    0.04,
    vec3(1.0)
  );
}

// ---------------------------------------------------------------------------
// Satin Stitch Evaluator (Multi-Thread + Multi-Layer)
// ---------------------------------------------------------------------------
vec3 shadeSatinLayer(
  vec2 pPx,
  float dSdf,
  float halfWidth,
  vec2 J,
  vec2 nInRaw,
  bool isStar,
  float pitchPx,
  float zScale,
  float crowdAo,
  float pxPerTexel,
  vec3 V,
  vec3 L,
  vec3 threadAlbedo,
  vec3 threadOpt
) {
  float coh = length(J);
  float theta = 0.5 * atan(J.y, J.x);
  vec2 nSmooth = vec2(cos(theta), sin(theta));
  if (dot(nSmooth, nInRaw) < 0.0) nSmooth = -nSmooth;

  float rawBlend = isStar ? 1.0 : (1.0 - smoothstep(0.45, 0.85, coh));
  vec2 N_in = normalize(mix(nSmooth, nInRaw, rawBlend) + vec2(1e-5, 0.0));
  vec2 T_stroke = vec2(-N_in.y, N_in.x);

  float rEff = isStar ? min(max(halfWidth, 2.2), 6.4) : max(halfWidth, 1.35);
  float uCross = clamp(1.0 + dSdf / rEff, 0.0, 1.0);

  float archBase = max(1.0 - uCross * uCross, 1e-4);
  float archSlope = isStar
    ? mix(0.56, 0.94, uCross) * zScale
    : clamp(1.75 * uCross * pow(archBase, -0.25) / max(rEff, 1.4), 0.0, 2.4) * zScale;

  float starDimple = isStar ? (1.0 - smoothstep(0.06, 0.54, coh)) * smoothstep(0.58, 0.0, uCross) : 0.0;
  float dimpleAo = mix(1.0, 0.44, starDimple);

  vec4 rib = phasorSatinRib(pPx, T_stroke, pitchPx, pxPerTexel);
  float pairGrain = 0.95 + 0.08 * vnoise(pPx * 0.35);

  vec2 gradArch = N_in * archSlope * (1.0 - 1.55 * starDimple);
  vec2 gradRib = rib.yz * ((isStar ? 0.30 : 0.56) * zScale);
  vec2 gradTotal = gradArch + gradRib;
  vec3 N = normalize(vec3(-gradTotal.x, -gradTotal.y, 1.0));

  float archZ = -0.84 * uCross * zScale;
  vec3 T_3d = normalize(vec3(N_in * sqrt(max(1.0 - 0.65 * uCross * uCross, 0.08)), archZ));
  N = applyPlyTwist(N, T_3d, pPx, pxPerTexel, 0.20 * zScale);

  float edgeAo = isStar
    ? mix(0.76, 1.0, smoothstep(1.0, 0.16, uCross))
    : mix(0.48, 1.0, smoothstep(1.0, 0.28, uCross));
  float ribAo  = isStar ? mix(0.80, 1.0, rib.x) : mix(0.48, 1.0, rib.x);
  float crowdTerm = isStar ? 1.0 : mix(0.84, 1.0, crowdAo);
  float ao = edgeAo * ribAo * dimpleAo * crowdTerm;

  float attRib = exp(-0.5 * pow((TAU / pitchPx) * pxPerTexel * 0.42, 2.0));
  float rough = clamp(threadOpt.y + (1.0 - attRib * attRib) * 0.28, 0.0, 0.92);
  float sheen = threadOpt.x * (isStar ? 1.08 : 1.0) * zScale;
  float fuzz = mix(0.04, 0.14, smoothstep(0.24, 0.45, threadOpt.y));

  vec3 alb = threadAlbedo * pairGrain * (isStar ? 1.06 : 1.0);
  return shadeFiber(alb, N, T_3d, V, L, rough, sheen, fuzz, threadOpt.z, ao, 0.0);
}

// ---------------------------------------------------------------------------
// Main Optical Compositor (Premultiplied sRGB RGBA + Exact Pointer-X Split)
// ---------------------------------------------------------------------------
void main() {
  if (uOpacity <= 0.001) discard;
  vec2 localCss = (gl_FragCoord.xy - uVpOriginPx) / uDpr;

  // Optional modal split curtain: left of uSplit reveals raw DOM <svg> blueprint
  float splitMask = 1.0;
  if (uSplit > 0.0005) {
    float splitPx = (localCss.x - uSplit * uVpSizeCss.x) * uDpr;
    if (splitPx < -1.0) discard;
    splitMask = smoothstep(-0.6, 0.6, splitPx);
  }
  float visAlpha = splitMask * uOpacity;

  // Exact 0.00 px homologous coordinate mapping matching CSS translate3d(dx, dy, 0) rotate(deg) scale(fitZoom)
  float fitZoom = max(uPose.w, 0.25);
  float fitScale = min(uVpSizeCss.x / VIEW_REF_SIZE.x, uVpSizeCss.y / VIEW_REF_SIZE.y) * fitZoom;
  vec2 dScreen = localCss - 0.5 * uVpSizeCss - vec2(uPose.x, -uPose.y);
  float cA = cos(uPose.z);
  float sA = sin(uPose.z);
  vec2 pRot = vec2(dScreen.x * cA - dScreen.y * sA, dScreen.x * sA + dScreen.y * cA);
  vec2 pPx = pRot / max(fitScale, 1e-4);
  float pxPerTexel = 1.0 / max(fitScale * uDpr, 1e-4);

  vec3 V = vec3(0.0, 0.0, 1.0);
  // Rotate fixed room-space studio key light into badge-local space so shadows stay room-locked
  // while rotated twill wales & satin threads catch physical angle-dependent sheen!
  vec3 Lw = normalize(uLightDir);
  vec3 L = normalize(vec3(Lw.x * cA - Lw.y * sA, Lw.x * sA + Lw.y * cA, Lw.z));

  // -------------------------------------------------------------------------
  // 1. Merrow Border Geometry, Scalloped Silhouette & Premultiplied Linear Shadow
  // -------------------------------------------------------------------------
  MerrowGeom mg = evalMerrowGeom(pPx, uShapeId);

  float sPhase = (mg.s / mg.L) * TAU; // strictly periodic [0, TAU) across 12 o'clock (zero seam!)
  float N_wraps = floor(mg.L / MERROW_PITCH + 0.5);
  float wrapFreq = (N_wraps / mg.L) * TAU;
  float wrapIdx = floor(mg.s * N_wraps / mg.L);
  float wrapAngle = (wrapIdx / N_wraps) * TAU;
  vec2 perCoord = vec2(cos(wrapAngle), sin(wrapAngle)) * 22.0;
  float wrapRnd1 = hash12(floor(perCoord * 4.0) + vec2(3.1, 7.4));
  float wrapRnd2 = hash12(floor(perCoord * 4.0) + vec2(19.7, 2.3));
  float bundleRnd = vnoise(vec2(cos(wrapAngle), sin(wrapAngle)) * 42.0 + vec2(5.2, 11.8));

  float jitterPhi = (wrapRnd1 - 0.5) * 0.42 + 0.22 * (bundleRnd - 0.5);
  float phiM = sPhase * N_wraps + 0.14 * mg.sd * wrapFreq + jitterPhi;

  // Strictly periodic corner bundle parting (zero 12 o'clock discontinuity on any shape!)
  float cornerBundleN = floor(mg.L / 6.2 + 0.5);
  float phiGap = sPhase * cornerBundleN + 0.82 * sin(sPhase * 29.0) + 0.34 * cos(sPhase * 17.0) + 0.08 * mg.sd;
  float cGapWave = 0.5 + 0.5 * cos(phiGap);

  // Subtle arclength-anchored Merrow tail-tuck overlap (kept off Shield's 6 o'clock tip & gentle on Gold Bullion)
  float sTail = (uShapeId == 2) ? (0.415 * mg.L) : (0.506 * mg.L);
  float dTailS = abs(mod(mg.s - sTail + 0.5 * mg.L, mg.L) - 0.5 * mg.L);
  float tailGain = (uShapeId == 1) ? 0.24 : ((uShapeId == 2) ? 0.32 : 0.62);
  float tailMask = smoothstep(15.0, 2.5, dTailS) * tailGain;
  float tailBulge = tailMask * 0.78;

  float attM = exp(-0.5 * pow(wrapFreq * pxPerTexel * 0.42, 2.0));
  float scallop = (0.50 * cos(phiM) + 0.28 * cos(0.5 * phiM + wrapRnd2 * TAU) + 0.16 * (bundleRnd - 0.5)) * attM;
  float dOuter = mg.sd - (MERROW_HALF_W + 0.60 * scallop + tailBulge);
  float dInnerEdge = mg.sd + (MERROW_HALF_W - 0.38 * scallop);

  // Silhouette-exact dual-lobe studio drop shadow
  vec2 shadOff = vec2(-L.x * 1.5, -L.y * 6.4);
  float dShadSoft = evalMerrowGeom(pPx - shadOff, uShapeId).sd - MERROW_HALF_W;
  float dOuterClean = max(mg.sd - MERROW_HALF_W, 0.0);

  float awayLight = clamp(-dot(mg.N, normalize(L.xy + vec2(1e-5))), -1.0, 1.0);
  float bottomBias = smoothstep(-0.18, 0.78, awayLight);
  float sideBias = smoothstep(-0.72, 0.02, awayLight);

  // On Night darkroom trays, strengthen shadow contrast slightly so the silhouette stays grounded
  float shadGain = mix(0.86, 1.0, uNight);
  float contactTrans = 1.0 - (0.46 * shadGain * sideBias * exp(-dOuterClean / mix(3.4, 3.8, bottomBias)));
  float dCrev = max(dOuterClean - 0.80, 0.0);
  float underCrevice = 1.0 - (0.86 * shadGain * bottomBias * exp(-dCrev / 1.85));
  float softDropTrans = 1.0 - (0.56 * shadGain * smoothstep(-0.15, 0.72, awayLight) * exp(-0.5 * pow(max(dShadSoft, 0.0) / 5.8, 1.85)));
  float topEdgeKiss = 1.0 - 0.05 * exp(-dOuterClean / 1.4);

  float shadowTrans = clamp(contactTrans * underCrevice * softDropTrans * topEdgeKiss, 0.04, 1.0);
  float shadowAlpha = 1.0 - pow(shadowTrans, 1.0 / 2.2);

  float patchMask = smoothstep(0.65 * pxPerTexel, -0.65 * pxPerTexel, dOuter);

  // Early-out outside patch + shadow reach
  if (patchMask <= 0.001) {
    if (shadowAlpha <= 0.002) discard;
    fragColor = vec4(0.0, 0.0, 0.0, shadowAlpha * visAlpha);
    return;
  }

  // -------------------------------------------------------------------------
  // 2. Atlas Lookup: SDFs, Nematic Orientation, Tatami Mask, Region & Multi-Thread IDs
  // -------------------------------------------------------------------------
  vec2 localUv = pPx / BAKE_REF_SIZE + 0.5;
  bool inBake = all(greaterThanEqual(localUv, vec2(0.001))) && all(lessThanEqual(localUv, vec2(0.999)));

  float dMain = 64.0;
  float dRec = 32.0;
  float halfWMain = 2.2;
  vec2  JMain = vec2(1.0, 0.0);
  float dProud = 12.0;
  float wTatami = 0.0;
  float aoCrowd = 1.0;
  float regionByte = 0.0;
  int   tRecIdx = 1;
  int   tMainIdx = 0;
  int   tProudIdx = 0;

  if (inBake) {
    vec2 dists = sampleDists(localUv);
    dMain = dists.r;
    dRec  = dists.g;
    vec4 orient = sampleOrient(localUv);
    halfWMain = orient.r;
    JMain     = orient.gb;
    dProud    = orient.a;
    vec2 aux  = texture(uAuxAtlas, tileUvToAtlas(localUv)).rg;
    wTatami   = aux.r;
    aoCrowd   = aux.g;
    vec2 meta = texture(uMetaAtlas, tileUvToAtlas(localUv)).rg;
    regionByte = meta.r * 255.0;
    uint tBits = uint(floor(meta.g * 255.0 + 0.5)) >> 2u;
    tRecIdx   = int(tBits & 3u);
    tMainIdx  = int((tBits >> 2u) & 3u);
    tProudIdx = int((tBits >> 4u) & 3u);
  }

  float dAny = min(dMain, dRec);
  float dOut = max(dAny, 0.0);

  // Raw inward normal (-grad dMain) via 4-tap central difference (1 ref px)
  vec2 stepUv = vec2(1.0 / BAKE_REF_SIZE.x, 1.0 / BAKE_REF_SIZE.y);
  float dR = sampleDists(localUv + vec2(stepUv.x, 0.0)).r;
  float dL = sampleDists(localUv - vec2(stepUv.x, 0.0)).r;
  float dU = sampleDists(localUv + vec2(0.0, stepUv.y)).r;
  float dD = sampleDists(localUv - vec2(0.0, stepUv.y)).r;
  vec2 gradD = vec2(dR - dL, dU - dD);
  vec2 nInRaw = (length(gradD) > 1e-4) ? normalize(-gradD) : vec2(0.0, 1.0);

  // -------------------------------------------------------------------------
  // 3. Layer 1: Physical Woven Substrate + Needle Penetration Pucker + Contact-AO Moat
  // -------------------------------------------------------------------------
  SurfaceSample sub;
  if (uWeaveId == 1) {
    sub = evalWoolFelt(pPx, uSubstrateParam.x, pxPerTexel);
  } else if (uWeaveId == 2) {
    sub = evalCottonCanvas(pPx, uSubstrateParam.x, pxPerTexel);
  } else if (uWeaveId == 3) {
    sub = evalRipstop(pPx, uSubstrateParam.x, pxPerTexel);
  } else {
    sub = evalTwill(pPx, uSubstrateParam.z, uSubstrateParam.x, pxPerTexel);
  }

  // Deeper needle compression on wool felt; crisp fabric tension pucker around stitches
  float puckerGain = (uWeaveId == 1) ? 0.68 : (uWeaveId == 2 ? 0.42 : 0.48);
  float puckerDip = exp(-dOut / 2.3);
  float dPucker = (puckerGain / 2.3) * puckerDip * smoothstep(0.0, 0.6, dOut);
  sub.grad += (-nInRaw) * dPucker;

  float dFromMerrow = -dInnerEdge;
  float merrowPucker = exp(-max(dFromMerrow - 2.4, 0.0) / 2.4);
  sub.grad += mg.N * ((uWeaveId == 1 ? 0.48 : 0.36) * merrowPucker * smoothstep(1.8, 3.0, dFromMerrow));

  vec3 N_sub = normalize(vec3(-sub.grad.x, -sub.grad.y, 1.0));
  vec3 T_sub = normalize(sub.tangent);

  // Calibrated contact-AO moat & cast shadow:
  // Dark textiles get deep 5 px carbon moats; light cotton duck canvas gets crisp 1.7 px warm-tan
  // needle dimples so typography counters never clog with dirty grey airbrush halos!
  float isLightSub = uSubstrateParam.w;
  float moatFloor = mix(0.03, 0.72, isLightSub);
  float castFloor = mix(0.10, 0.78, isLightSub);

  float stitchAoMoat = mix(moatFloor, 1.0, smoothstep(mix(0.5, 0.15, isLightSub), mix(5.0, 1.75, isLightSub), dOut));
  vec2 shadUv = localUv + (L.xy * mix(2.8, 1.55, isLightSub)) / BAKE_REF_SIZE;
  vec2 shadDists = sampleDists(shadUv);
  float dAnyShad = min(shadDists.r, shadDists.g);
  float stitchCastShad = mix(castFloor, 1.0, smoothstep(-0.2, mix(2.2, 1.45, isLightSub), dAnyShad));

  float rimAoMoat = mix(mix(0.03, 0.64, isLightSub), 1.0, smoothstep(2.2, mix(6.8, 4.2, isLightSub), dFromMerrow));
  float rimLightBlock = max(dot(mg.N, normalize(L.xy + vec2(1e-5))), 0.0);
  float rimCastShad = mix(mix(0.08, 0.72, isLightSub), 1.0, smoothstep(2.2, mix(5.2 + 4.8 * rimLightBlock, 3.6 + 2.4 * rimLightBlock, isLightSub), dFromMerrow));

  // Calibrate dark twill/felt/ripstop albedo into physical studio response while keeping light canvas luminous
  vec3 subAlbedo = uSubstrateLin * sub.albedoMod;
  vec3 interiorCol = shadeFiber(
    subAlbedo,
    N_sub,
    T_sub,
    V,
    L,
    sub.roughness,
    uSubstrateParam.y,
    sub.fuzz,
    0.0,
    sub.ao * mix(0.84, 1.0, aoCrowd),
    0.0
  );
  if (uWeaveId == 0) {
    // Deepen inter-wale 2/1 Z-twill valleys cleanly without crushing colored twills
    interiorCol *= mix(0.16, 1.05, smoothstep(0.0, 0.55, sub.ao));
  }
  float totalSubShad = stitchAoMoat * stitchCastShad * rimAoMoat * rimCastShad;
  // Warm subtle canvas-tan tint inside cotton duck stitch creases instead of cold grey darkening
  vec3 warmShadTint = mix(vec3(1.0), mix(vec3(0.92, 0.86, 0.76), vec3(1.0), totalSubShad), isLightSub);
  interiorCol *= totalSubShad * warmShadTint;

  // -------------------------------------------------------------------------
  // 4. Layer 1.5: Recessed Micrographics (Globe / Bathymetry / Isolines / Orbits / Vernier / Sky Grid)
  // -------------------------------------------------------------------------
  if (dRec < 1.8) {
    float gR = sampleDists(localUv + vec2(stepUv.x, 0.0)).g;
    float gL = sampleDists(localUv - vec2(stepUv.x, 0.0)).g;
    float gU = sampleDists(localUv + vec2(0.0, stepUv.y)).g;
    float gD = sampleDists(localUv - vec2(0.0, stepUv.y)).g;
    vec2 gGrad = vec2(gR - gL, gU - gD);
    vec2 nRecRaw = (length(gGrad) > 1e-4) ? normalize(-gGrad) : vec2(0.0, 1.0);
    vec2 JRec = vec2(nRecRaw.x * nRecRaw.x - nRecRaw.y * nRecRaw.y, 2.0 * nRecRaw.x * nRecRaw.y);

    vec3 recCol = shadeSatinLayer(
      pPx,
      dRec,
      1.45,
      JRec,
      nRecRaw,
      false,
      2.05,
      0.66,
      aoCrowd,
      pxPerTexel,
      V,
      L,
      uThreadLin[tRecIdx] * 0.72,
      uThreadOpt[tRecIdx]
    );

    // Bold 3.5-4.5 px foreground drop-shadow moat onto recessed stitch lines
    float overAo = mix(mix(0.08, 0.35, isLightSub), 1.0, smoothstep(0.0, 4.4, dMain));
    float dMainShadOnRec = sampleDists(localUv + (L.xy * 3.4) / BAKE_REF_SIZE).r;
    float overCast = mix(mix(0.14, 0.42, isLightSub), 1.0, smoothstep(-0.3, 2.2, dMainShadOnRec));
    recCol *= overAo * overCast;

    float covRec = smoothstep(0.55 * pxPerTexel, -0.55 * pxPerTexel, dRec);
    interiorCol = mix(interiorCol, recCol, covRec);
  }

  // -------------------------------------------------------------------------
  // 5. Layer 2 & Layer 3: Main & Proud Embroidery (Satin, 5-Facet Stars & Multi-Plane Tatami)
  // -------------------------------------------------------------------------
  if (dMain < 1.8) {
    bool isStar = abs(regionByte - 64.0) < 12.0;
    bool isRail = regionByte > 224.0;
    bool isProudReg = abs(regionByte - 200.0) < 12.0;

    // Gradient of Layer 3 (proud) SDF for embankment shadows & proud satin/dome normals
    float fR = sampleProudDist(localUv + vec2(stepUv.x, 0.0));
    float fL = sampleProudDist(localUv - vec2(stepUv.x, 0.0));
    float fU = sampleProudDist(localUv + vec2(0.0, stepUv.y));
    float fD = sampleProudDist(localUv - vec2(0.0, stepUv.y));
    vec2 fGrad = vec2(fR - fL, fU - fD);
    vec2 nProudOut = (length(fGrad) > 1e-4) ? normalize(fGrad) : vec2(0.0, 1.0);

    // --- Layer 2 (Main): Satin + Tatami ---
    vec3 mainSatinCol = vec3(0.0);
    float satinEdgeCos = 0.0;
    if (wTatami < 0.995) {
      mainSatinCol = shadeSatinLayer(
        pPx,
        dMain,
        halfWMain,
        JMain,
        nInRaw,
        isStar,
        SATIN_PITCH,
        1.0,
        aoCrowd,
        pxPerTexel,
        V,
        L,
        uThreadLin[tMainIdx],
        uThreadOpt[tMainIdx]
      );
      float theta = 0.5 * atan(JMain.y, JMain.x);
      vec2 tEdge = isStar ? vec2(-nInRaw.y, nInRaw.x) : vec2(-sin(theta), cos(theta));
      satinEdgeCos = phasorSatinRib(pPx, tEdge, SATIN_PITCH, pxPerTexel).w;
    }

    vec3 mainTatamiCol = vec3(0.0);
    if (wTatami > 0.005) {
      bool isBlockA = abs(regionByte - 128.0) < 12.0;
      float blkAngle = isBlockA ? uTatamiAngles.x : uTatamiAngles.y;
      vec3 optM = uThreadOpt[tMainIdx];

      SurfaceSample blockT = evalTatami(pPx, dMain, TATAMI_ROW_PITCH, TATAMI_SPAN, blkAngle, optM.y, pxPerTexel);
      float dProudPos = max(dProud, 0.0);
      float rootCreaseAo = mix(0.22, 1.0, smoothstep(0.0, 3.8, dProudPos));
      float dProudShad = sampleProudDist(localUv + (L.xy * 3.0) / BAKE_REF_SIZE);
      float rootCastShad = mix(0.28, 1.0, smoothstep(-0.3, 2.0, dProudShad));
      vec2 blockGrad = blockT.grad + nProudOut * (0.68 * exp(-dProudPos / 2.5));
      vec3 N_blk = applyPlyTwist(
        normalize(vec3(-blockGrad.x, -blockGrad.y, 1.0)),
        blockT.tangent,
        pPx,
        pxPerTexel,
        0.20
      );
      mainTatamiCol = shadeFiber(
        uThreadLin[tMainIdx] * 0.80,
        N_blk,
        blockT.tangent,
        V,
        L,
        blockT.roughness,
        optM.x * 0.80,
        mix(0.04, 0.14, smoothstep(0.24, 0.45, optM.y)),
        optM.z,
        blockT.ao,
        0.0
      );
      mainTatamiCol *= rootCreaseAo * rootCastShad;
    }

    vec3 stitchCol = mix(mainSatinCol, mainTatamiCol, wTatami);

    // Subtle proud cast shadow onto Layer 2 Satin elements too
    if (dProud > -0.2 && dProud < 4.5 && wTatami < 0.5) {
      float pShad = sampleProudDist(localUv + (L.xy * 2.6) / BAKE_REF_SIZE);
      stitchCol *= mix(0.45, 1.0, smoothstep(0.0, 3.2, max(dProud, 0.0))) * mix(0.55, 1.0, smoothstep(-0.2, 1.8, pShad));
    }

    // --- Layer 3 (Proud): Sculpted Tatami Hero OR Proud Satin / Proud Star ---
    float covProud = smoothstep(0.55 * pxPerTexel, -0.55 * pxPerTexel, dProud);
    if (covProud > 0.005) {
      vec3 optP = uThreadOpt[tProudIdx];
      vec3 albP = uThreadLin[tProudIdx];
      bool proudUseTatami = (isProudReg || wTatami > 0.5) && !isStar && !isRail;

      vec3 proudCol;
      if (proudUseTatami) {
        SurfaceSample fuseT = evalTatami(pPx, dProud, TATAMI_ROW_PITCH, TATAMI_SPAN, uTatamiAngles.z, optP.y, pxPerTexel);
        float fuseU = clamp(1.0 + dProud / 14.0, 0.0, 1.0);
        float spineSlope = 0.80 * fuseU * smoothstep(0.0, 1.8, -dProud);
        vec2 fuseGrad = fuseT.grad - nProudOut * spineSlope;
        vec3 N_fuse = applyPlyTwist(
          normalize(vec3(-fuseGrad.x, -fuseGrad.y, 1.0)),
          fuseT.tangent,
          pPx,
          pxPerTexel,
          0.22
        );
        float fuseEdgeAo = mix(0.52, 1.0, smoothstep(0.0, 2.8, -dProud));
        proudCol = shadeFiber(
          albP * 1.06,
          N_fuse,
          fuseT.tangent,
          V,
          L,
          fuseT.roughness,
          optP.x * 1.08,
          mix(0.04, 0.14, smoothstep(0.24, 0.45, optP.y)),
          optP.z,
          fuseT.ao * fuseEdgeAo,
          0.0
        );
      } else {
        // Proud Satin cord (gold viewport ring, front Saturn ring, crimson slingshot, wave foam) OR Proud 5-Facet Star!
        vec2 nProudIn = -nProudOut;
        vec2 JProud = isStar
          ? JMain
          : vec2(nProudIn.x * nProudIn.x - nProudIn.y * nProudIn.y, 2.0 * nProudIn.x * nProudIn.y);
        float proudHW = isStar ? halfWMain : clamp(min(halfWMain, 3.8), 1.8, 3.8);
        proudCol = shadeSatinLayer(
          pPx,
          dProud,
          proudHW,
          JProud,
          nProudIn,
          isStar,
          SATIN_PITCH,
          1.08,
          1.0,
          pxPerTexel,
          V,
          L,
          albP * 1.04,
          optP
        );
      }
      stitchCol = mix(stitchCol, proudCol, covProud);
    }

    float edgeD = dMain + 0.12 * satinEdgeCos * (1.0 - wTatami);
    float covMain = smoothstep(0.55 * pxPerTexel, -0.55 * pxPerTexel, edgeD);
    interiorCol = mix(interiorCol, stitchCol, covMain);
  }

  // -------------------------------------------------------------------------
  // 6. Segmented Inner Foundation Lockstitch Cord (+2.5 px inside Merrow) & Dark Sulcus
  // -------------------------------------------------------------------------
  vec3 merrowBaseLin = uThreadLin[uMerrowThread];
  vec3 merrowOpt     = uThreadOpt[uMerrowThread];

  if (dFromMerrow > -0.8 && dFromMerrow < 3.4) {
    float sulcusMask = smoothstep(-0.3, 0.35, dFromMerrow) * (1.0 - smoothstep(0.65, 1.25, dFromMerrow));
    interiorCol *= mix(1.0, mix(0.20, 0.45, isLightSub), sulcusMask);

    float lipU = (dFromMerrow - 1.60) / 0.78;
    float lipCov = smoothstep(1.0 + 0.55 * pxPerTexel, 1.0 - 0.55 * pxPerTexel, abs(lipU));
    if (lipCov > 0.005) {
      vec2 T_border = vec2(-mg.N.y, mg.N.x);
      // Quantized integer stitch count + strictly periodic harmonic (zero 12 o'clock seam!)
      float segN = floor(mg.L / 3.5 + 0.5);
      float segPhase = sPhase * segN + 0.30 * sin(sPhase * 23.0);
      float attLip = exp(-0.5 * pow((TAU / 3.5) * pxPerTexel * 0.42, 2.0));
      float segWave = 0.5 + 0.5 * cos(segPhase);
      float segBody = mix(0.5, smoothstep(0.08, 0.42, segWave), attLip);
      vec3 N_lip = normalize(vec3(mg.N * (lipU * 0.74), sqrt(max(1.0 - 0.55 * lipU * lipU, 0.1))));
      vec3 T_lip = normalize(vec3(T_border, -0.45 * attLip * sin(segPhase)));
      float lipAo = mix(0.24, 1.0, segBody) * mix(0.55, 1.0, smoothstep(1.0, 0.25, abs(lipU)));
      vec3 lipCol = shadeFiber(
        merrowBaseLin * 0.62,
        N_lip,
        T_lip,
        V,
        L,
        max(merrowOpt.y, 0.32),
        merrowOpt.x * 0.55,
        0.05,
        merrowOpt.z,
        lipAo,
        0.0
      );
      interiorCol = mix(interiorCol, lipCol, lipCov * mix(0.55, 0.94, segBody));
    }
  }

  // -------------------------------------------------------------------------
  // 7. Primary 15.5 px Merrow Overlock Cylinder (Continuous Across All 6 Shapes!)
  // -------------------------------------------------------------------------
  float merrowMask = smoothstep(0.55 * pxPerTexel, -0.55 * pxPerTexel, -dInnerEdge);
  vec3 patchCol = interiorCol;

  if (merrowMask > 0.005) {
    float uRaw = (mg.sd - 0.15 * scallop - 0.5 * tailBulge) / (MERROW_HALF_W + 0.45 * tailBulge);
    float u = clamp(uRaw, -1.0, 1.0);

    float bundleMod = 1.0 + 0.22 * cos(0.5 * phiM + wrapRnd2 * 1.4);
    float cRib = 0.5 + 0.5 * cos(phiM);

    float outerFan = mg.cornerAmt * smoothstep(-0.18, 0.88, u);
    float ribShape = mix(pow(max(cRib, 1e-4), 0.82), pow(max(cRib, 1e-4), 2.1), outerFan * 0.78);
    float ribH = mix(0.5, ribShape, attM);

    float wedgeWidth = mix(0.08, 0.42, outerFan);
    float wedgeMask = mg.cornerAmt * smoothstep(-0.15, 0.36, u) * (1.0 - smoothstep(0.0, wedgeWidth, cGapWave));
    wedgeMask *= (0.55 + 0.45 * bundleRnd) * attM;

    vec2 T_border = vec2(-mg.N.y, mg.N.x);
    float dRib_ds = -0.5 * attM * sin(phiM) * wrapFreq * bundleMod * mix(1.0, 1.55, outerFan);

    float uSlope = u * 0.94;
    float nz = sqrt(max(1.0 - uSlope * uSlope, 0.04));
    vec3 N_macro = normalize(vec3(mg.N * uSlope, nz));

    float yarnGrain = (vnoise(pPx * 0.85) - 0.5) * 0.22 * attM;
    float tailCrease = tailMask * sin(dTailS * 0.38 + u * 2.2) * 0.26;
    vec3 N_merrow = normalize(
      N_macro +
      vec3(T_border * (-dRib_ds * 0.46 + yarnGrain), 0.0) +
      vec3(mg.N * (tailCrease + yarnGrain * 0.45), 0.0)
    );

    vec3 T_merrow = normalize(vec3(mg.N * sqrt(max(1.0 - 0.84 * u * u, 0.06)), -u * 0.90));
    N_merrow = applyPlyTwist(N_merrow, T_merrow, pPx, pxPerTexel, 0.24);

    float straightValAo = mix(0.36, 1.0, pow(max(ribH, 1e-4), 0.85));
    float bundleAo = 0.88 + 0.12 * cos(0.5 * phiM + wrapRnd2 * 1.4);
    float cornerGapAo = mix(1.0, 0.04, wedgeMask) * mix(1.0, mix(0.28, 1.0, smoothstep(0.06, 0.42, cRib)), outerFan * 0.88);
    float edgeTuckAo = mix(0.68, 1.0, smoothstep(1.0, 0.55, abs(u)));
    float tailAo = mix(1.0, 0.72, tailMask * smoothstep(0.2, 0.9, abs(sin(dTailS * 0.30))));
    float merrowAo = straightValAo * bundleAo * cornerGapAo * edgeTuckAo * tailAo;

    float threadVar = 0.90 + 0.20 * wrapRnd1 + 0.06 * yarnGrain;
    float roughM = clamp(merrowOpt.y + (1.0 - attM * attM) * 0.30, 0.0, 0.92);
    float cardBounce = smoothstep(0.20, 0.98, u) * 0.64;

    vec3 merrowCol = shadeFiber(
      merrowBaseLin * 0.84 * threadVar,
      N_merrow,
      T_merrow,
      V,
      L,
      roughM,
      merrowOpt.x * 1.62,
      mix(0.03, 0.12, smoothstep(0.24, 0.45, merrowOpt.y)),
      merrowOpt.z,
      merrowAo,
      cardBounce
    );
    merrowCol += merrowBaseLin * 0.065 * smoothstep(0.25, -0.85, u) * straightValAo * cornerGapAo;
    merrowCol = mix(merrowCol, uSubstrateLin * 0.25 + vec3(0.006), clamp(wedgeMask * 1.10, 0.0, 0.90));

    patchCol = mix(patchCol, merrowCol, merrowMask);
  }

  // Soft shoulder + linear-to-sRGB + IGN dither, composited premultiplied over linear drop shadow!
  vec3 patchSrgb = clamp(linToSrgb(softShoulder(patchCol)) + (ign(gl_FragCoord.xy) - 0.5) / 255.0, 0.0, 1.0);
  float outAlpha = patchMask + shadowAlpha * (1.0 - patchMask);
  vec3 outPremul = patchSrgb * patchMask;

  fragColor = vec4(outPremul * visAlpha, outAlpha * visAlpha);
}
`;
