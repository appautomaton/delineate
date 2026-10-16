// A phone's window cannot be moved, but the phone can. Its accelerometer says which way is down and how hard the
// phone is being shaken, both at once: the push the hand gives the phone, gravity included. Turned into the
// screen's frame, that is the way the water falls, and how hard; tip the phone and the water runs downhill,
// shake it and the water slops.
//
// The reading is the hand's push on the phone, so down is its opposite. iOS reports it the other way round, and a
// phone on its side turns the screen's frame against the phone's; both are undone here. iOS asks the visitor's
// leave the first time anything is touched.

import type { Pt } from "./water/sim.ts";

const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const EARTH = 9.81;

type Permission = { requestPermission?: () => Promise<"granted" | "denied"> };

// Calls `heard` with which way the water falls, in px/s², whenever the phone says, once it has said anything.
export function tilt(gravity: number, heard: (down: Pt) => void): void {
  let smooth: Pt | null = null;
  addEventListener("devicemotion", (e) => {
    const r = e.accelerationIncludingGravity;
    if (r?.x == null || r.y == null) return;
    const sign = IOS ? -1 : 1;
    // Down, in the phone's upright frame, x to the right and y toward its foot.
    const dx = -r.x * sign, dy = r.y * sign;
    // Into the screen's frame, however the phone is turned.
    const a = (-(screen.orientation?.angle ?? 0) * Math.PI) / 180;
    const sx = dx * Math.cos(a) - dy * Math.sin(a), sy = dx * Math.sin(a) + dy * Math.cos(a);
    // A little smoothing for the sensor's noise; a shake still comes through.
    smooth = smooth ? { x: smooth.x * 0.4 + sx * 0.6, y: smooth.y * 0.4 + sy * 0.6 } : { x: sx, y: sy };
    const g = Math.hypot(smooth.x, smooth.y) || EARTH;
    const k = (Math.max(0.3, Math.min(3, g / EARTH)) * gravity) / g;
    heard({ x: smooth.x * k, y: smooth.y * k });
  });
  const ask = (DeviceMotionEvent as unknown as Permission).requestPermission;
  if (ask) addEventListener("pointerdown", () => void ask().catch(() => {}), { once: true });
}
