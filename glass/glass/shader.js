// The glass, as one fragment shader. The page lies flat at z = 0, drawn here from its distance field, paper and
// ink laid on it, or from two fields eased into one another as one page melts into the next; the eye looks down on it
// from straight above, far enough off that the view is nearly square on, so a ray that meets no glass lands on
// the page exactly where it set out. The solid floats above the page at uCenter. Where a ray meets it, it bends
// in, crosses the solid, bends out (or, where it cannot, turns back inside and comes out dark), and reads the
// page where it lands, softer the more glass it crossed; a little of the room is reflected off the face. Where
// a ray meets the page near the solid, a ray toward the light finds the solid's soft shadow.
//
// Units are CSS pixels, y running down the page; the solid's own frame is in units of uSize.
export const SHAPES = ["ring", "tetrahedron", "octahedron", "sphere", "cube", "capsule"];
export const VERTEX = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;
export const FRAGMENT = `#version 300 es
precision highp float;

uniform sampler2D uPageFrom; // the page's distance field, in CSS pixels, negative within the ink
uniform sampler2D uPageTo;   // the next page's
uniform float uFlow;       // how far the one has melted into the other, 0 to 1
uniform vec2 uStage;       // the stage, in CSS pixels
uniform float uDpr;        // device pixels to a CSS pixel
uniform vec3 uCenter;      // the solid's centre: x and y on the page, z its height above it
uniform float uSize;       // the solid's scale, in CSS pixels
uniform mat3 uTurn;        // the page's frame into the solid's
uniform int uFrom;         // the shape it is leaving
uniform int uTo;           // the shape it is becoming
uniform float uMelt;       // how far from one to the other, 0 to 1
uniform float uNight;      // 0 by day, 1 by night, and between as the light turns
uniform vec3 uPaper;       // the paper's colour, which the room around the glass is lit like
uniform vec3 uInk;         // the ink's

out vec4 outColor;

const float IOR = 1.45;
const vec3 LIGHT = normalize(vec3(-0.32, -0.5, 1.0));    // up and to the left, and high above (show.ts FALL)

// Shapes about one unit across, centred on the origin.
float ring(vec3 q) { vec2 t = vec2(length(q.xz) - 0.6, q.y); return length(t) - 0.3; }
float tetrahedron(vec3 q) {
  float d = max(max(-q.x - q.y - q.z, q.x + q.y - q.z), max(-q.x + q.y + q.z, q.x - q.y + q.z));
  return (d - 0.52) * 0.57735 - 0.03;
}
float octahedron(vec3 q) { q = abs(q); return (q.x + q.y + q.z - 0.95) * 0.57735 - 0.03; }
float sphere(vec3 q) { return length(q) - 0.78; }
float cube(vec3 q) { vec3 d = abs(q) - vec3(0.5); return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0) - 0.12; }
float capsule(vec3 q) { q.x -= clamp(q.x, -0.5, 0.5); return length(q) - 0.36; }

float shape(int i, vec3 q) {
  if (i == 0) return ring(q);
  if (i == 1) return tetrahedron(q);
  if (i == 2) return octahedron(q);
  if (i == 3) return sphere(q);
  if (i == 4) return cube(q);
  return capsule(q);
}

// The solid at a point on the page, in CSS pixels: one shape easing into the next, and swelling a little
// rounder halfway, so it melts rather than fades.
float solid(vec3 p) {
  vec3 q = uTurn * (p - uCenter) / uSize;
  float a = shape(uFrom, q);
  float d = uMelt <= 0.0 ? a : mix(a, shape(uTo, q), uMelt) - 0.07 * sin(3.14159 * uMelt);
  return d * uSize;
}

vec3 normalAt(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  float e = 0.25;
  return normalize(k.xyy * solid(p + k.xyy * e) + k.yyx * solid(p + k.yyx * e) + k.yxy * solid(p + k.yxy * e) + k.xxx * solid(p + k.xxx * e));
}

// The room the glass looks out on: the paper's own colour, a little darker toward the floor, and a soft window
// of light up and to the left. Light from it is what a face turned away from the page shows. By night the room
// is lit by the ink's soft light, and so is the window, or the glass would be lost on the dim paper.
vec3 room(vec3 d) {
  float window = smoothstep(0.8, 0.97, dot(d, normalize(vec3(-0.35, -0.65, 0.68))));
  vec3 base = mix(uPaper, uInk, 0.16 * uNight) * mix(0.72, 1.0, smoothstep(-0.4, 0.8, d.z));
  return mix(base, mix(vec3(1.0), uInk, uNight), window * mix(0.95, 0.8, uNight));
}

// The page at a point, its edge one device pixel wide, widened by \`soft\` CSS pixels. Midway through a melt
// the ink swells a little, so the pages pool into one another rather than fade.
vec3 page(vec2 at, float soft) {
  vec2 uv = at / uStage;
  float d = mix(textureLod(uPageFrom, uv, 0.0).r, textureLod(uPageTo, uv, 0.0).r, uFlow) - 3.0 * sin(3.14159 * uFlow);
  float w = 0.5 / uDpr + soft;
  return mix(uPaper, uInk, smoothstep(w, -w, d));
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uDpr * uStage.y - gl_FragCoord.y) / uDpr;
  vec3 here = page(px, 0.0);
  float reach = uSize * 1.25;
  vec2 shadowAt = uCenter.xy + uCenter.z * vec2(-LIGHT.x, -LIGHT.y) / LIGHT.z;

  // Far from the solid and its shadow, the page as it is.
  if (distance(px, uCenter.xy) > reach && distance(px, shadowAt) > reach * 1.5) { outColor = vec4(here, 1.0); return; }

  // The eye, far above; the ray through this pixel, met first at the solid's bounding sphere.
  vec3 eye = vec3(uStage * 0.5, 4.0 * max(uStage.x, uStage.y));
  vec3 rd = normalize(vec3(px, 0.0) - eye);
  vec3 oc = eye - uCenter;
  float b = dot(oc, rd), c = dot(oc, oc) - reach * reach, h = b * b - c;
  float t = h > 0.0 ? max(-b - sqrt(h), 0.0) : -1.0;

  bool hit = false;
  vec3 p;
  if (t >= 0.0) {
    float far = -b + sqrt(h);
    for (int i = 0; i < 72; i++) {
      p = eye + rd * t;
      float d = solid(p);
      if (d < 0.2) { hit = true; break; }
      t += d;
      if (t > far) break;
    }
  }

  if (!hit) {
    // The page, under the solid's shadow: a soft-edged shadow, marched toward the light from the page.
    vec3 o = vec3(px, 0.0);
    float lit = 1.0, s = 1.0;
    for (int i = 0; i < 40; i++) {
      float d = solid(o + LIGHT * s);
      lit = min(lit, 7.0 * d / s);
      if (lit < 0.001) break;
      s += clamp(d, 1.5, uSize * 0.3);
      if (s > uCenter.z * 3.0) break;
    }
    float shade = 1.0 - clamp(lit, 0.0, 1.0);
    // where the shadow is deepest the glass gathers the light it bends, and the core comes up lighter
    float gather = pow(shade, 4.0) * 0.35;
    float dark = mix(0.12, 0.5, uNight) * (shade - gather);
    outColor = vec4(here * (1.0 - dark), 1.0);
    return;
  }

  vec3 n = normalAt(p);
  float cosi = clamp(dot(-rd, n), 0.0, 1.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - cosi, 5.0);

  // In: bend toward the normal, then cross the solid to where the ray leaves it. Where it meets the far face
  // too steeply to leave, it turns back inside and crosses again, twice at most.
  vec3 ri = refract(rd, n, 1.0 / IOR);
  vec3 q = p - n * 0.6;
  vec3 ro = ri;
  float travelled = 0.0, trapped = 1.0;
  for (int bounce = 0; bounce < 3; bounce++) {
    for (int i = 0; i < 40; i++) {
      float d = -solid(q);
      if (d < 0.2) break;
      q += ri * max(d, 0.4);
      travelled += max(d, 0.4);
    }
    vec3 m = -normalAt(q);
    ro = refract(ri, m, IOR);
    if (dot(ro, ro) > 1e-4) { trapped = 0.0; break; }
    ri = reflect(ri, m);
    q += ri * 0.8;
  }
  if (trapped > 0.5) ro = ri;

  // Out: where the ray lands on the page, softened by how much glass it crossed; a ray turned back up meets
  // only the room.
  vec3 seen;
  if (ro.z < -1e-3) {
    vec3 land = q - ro * (q.z / ro.z);
    seen = page(land.xy, clamp(travelled / uSize * 1.4, 0.0, 3.0));
  } else {
    seen = room(ro);
  }
  // light caught inside and lost: the faces it cannot leave go dark
  seen *= mix(1.0, 0.45, trapped) * exp(-travelled / uSize * 0.12);

  vec3 glint = room(reflect(rd, n));
  vec3 color = mix(seen, glint, fresnel);
  // a hard, small highlight where the window's light comes straight back
  color += pow(max(dot(reflect(rd, n), normalize(vec3(-0.35, -0.65, 0.68))), 0.0), 120.0) * 0.8;
  outColor = vec4(color, 1.0);
}
`;
