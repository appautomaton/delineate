// A pinhole camera for layered scenes. The world is modeled in meters, with x to the right, y
// down, and z away from the viewer, and the camera sits at the origin. Projection alone sets
// every element's place, size, parallax, motion, and stacking, so a scene stays aligned in x, y,
// and z by construction. Two rules sit on top of projection: the air hazes what lies beyond the
// focus plane, and the pen lifts as things recede.

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];

export type Camera = {
  focal: number; // pixels per meter at a depth of one meter
  center: Vec2; // where the line of sight meets the frame: the vanishing point
  focus: number; // depth of the focus plane, the pivot of parallax
  air: number; // meters of air that carry a color most of the way to the horizon
  ink: Vec2; // depths where the pen starts to lift and where it is gone
};

export const project = (cam: Camera, [x, y, z]: Vec3): Vec2 => [cam.center[0] + (cam.focal * x) / z, cam.center[1] + (cam.focal * y) / z];

// Pixels per meter at depth z.
export const scaleAt = (cam: Camera, z: number) => cam.focal / z;

// The screen offset of depth z when the camera moves by (dx, dy) meters and turns to keep the
// focus plane still: beyond it things follow the camera, before it they slide against it.
export const parallaxAt = (cam: Camera, z: number, [dx, dy]: Vec2): Vec2 => {
  const k = cam.focal * (1 / cam.focus - 1 / z);
  return [dx * k, dy * k];
};

// How far the air has carried a color toward the horizon, from 0 at the focus plane to 1.
export const hazeAt = (cam: Camera, z: number) => (z <= cam.focus ? 0 : 1 - Math.exp(-(z - cam.focus) / cam.air));

// How much of the pen remains, from 1 up close to 0 far away.
export const inkAt = (cam: Camera, z: number) => Math.min(1, Math.max(0, (cam.ink[1] - z) / (cam.ink[1] - cam.ink[0])));

// Nearer stacks higher. One rule orders every layer, so an element moving in depth passes in
// front of or behind the others on its own.
export const stackAt = (z: number) => Math.round(1e5 / z);
