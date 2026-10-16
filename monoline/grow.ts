// A card grows in front of its reader, breathes, and when its time is up, is taken back.
//
// The glass and the ground come first, and the water rises to its line. Then one front climbs from
// the vessel's foot, and every mark is made as the front reaches it: a line is drawn from its lower
// end, as a stem grows, so a broken stem lights up piece by piece, dot by dot, like a line on a
// metro map; a leaf opens from its base when the stem has reached it, on a spring. Flowers wait
// until their stem is in, then open. When all is grown, the bouquet sways about the middle of the
// mouth, the back layer a little out of step with the front. Taken back, it goes the other way: from
// the top down, every line drawn back into the stem it came from, every flower closed.
//
// Nothing here knows what a protea is. Motion is read from the marks themselves, so any card drawn
// with the pen moves the same way.

// Grown inside a second, whatever its height: the front takes the same time up a tall arrangement as
// a short one, and the last flower opens on a spring that settles in 0.4s.
const FRONT = 360;      // ms the front takes from the foot to the highest mark
const START = 150;      // ms before the front sets out: the glass is in and the water nearly up
const BLOOM = 40;       // ms a flower waits after the front has passed its foot
const SWAY = 0.55;      // degrees either way
const GROWN = ["submerged", "inside", "bouquet-back", "bouquet"];
const MARKS = "polyline, polygon, circle, ellipse, path";

export type Run = { animations: Animation[]; end: number };

/**
 * Grows a card. With `intro` false the vessel is taken as already standing (it has just become this
 * one), so nothing of it arrives and the front sets out at once.
 */
export function grow(svg: SVGSVGElement, { intro = true } = {}): Run {
  const foot = Number(svg.dataset.foot);
  const start = intro ? START : 0;
  const [px, py] = (svg.dataset.pivot ?? "0 0").split(" ").map(Number);
  const animations: Animation[] = [];
  const play = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) =>
    animations.push(el.animate(keyframes, { fill: "backwards", easing: "cubic-bezier(.3,.7,.3,1)", ...options }));
  const layer = (name: string) => svg.querySelector<SVGGElement>(`[data-layer="${name}"]`);

  if (intro) {
    // The vessel and its ground arrive.
    for (const name of ["glass-back", "glass-front"]) {
      const g = layer(name);
      if (g) play(g, [{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], { duration: 240 });
    }
    layer("ground")?.querySelectorAll("*").forEach((el, i) => play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: 60 + i * 12 }));

    // The water rises from the bottom; the light on its surface comes as it settles.
    const water = layer("water")?.querySelector("rect");
    if (water) {
      water.style.transformBox = "fill-box";
      water.style.transformOrigin = "50% 100%";
      play(water, [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 300, delay: 40, easing: "cubic-bezier(.5,0,.2,1)" });
    }
    const surface = layer("surface");
    if (surface) play(surface, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: 260 });
  }

  // The front: its speed is set by how high the arrangement stands, so every arrangement takes FRONT.
  const marks = GROWN.flatMap((name) =>
    [...(layer(name)?.querySelectorAll<SVGGraphicsElement>(MARKS) ?? [])].map((el) => ({ el, box: el.getBBox(), flower: name.startsWith("bouquet") })));
  const highest = Math.min(foot - 1, ...marks.map(({ box }) => box.y));
  const speed = (foot - highest) / FRONT; // card units a millisecond
  let end = start;
  for (const { el, box, flower } of marks) {
    const reached = start + (foot - (box.y + box.height)) / speed + jitter(box.x) * 30;
    if (el instanceof SVGPolylineElement) {
      const from = stroke(el);
      const duration = Math.max(40, Math.max(box.height, box.width * 0.6) / speed);
      play(el, [{ strokeDashoffset: from, opacity: 0 }, { opacity: 1, offset: 0.02 }, { strokeDashoffset: 0, opacity: 1 }],
        { duration, delay: reached, easing: "linear" });
      end = Math.max(end, reached + duration);
    } else {
      // A filled mark opens from its base: a leaf from where it meets the stem, a flower from its foot.
      const delay = reached + (flower ? BLOOM : 0);
      origin(el);
      play(el, [{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: OPEN.duration, delay, easing: OPEN.easing });
      play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 100, delay });
      end = Math.max(end, delay + OPEN.duration);
    }
  }

  // Then it breathes: the bouquet sways about the mouth, the back a beat behind the front.
  for (const [name, lag, amount] of [["bouquet", 0, 1], ["bouquet-back", 900, 0.7]] as const) {
    const g = layer(name);
    if (!g) continue;
    g.style.transformBox = "view-box";
    g.style.transformOrigin = `${px}px ${py}px`;
    const a = SWAY * amount;
    // A whole swing from rest and back to it, so it sets out from where the bouquet stands.
    const swing = [0, -a, 0, a, 0].map((deg) => ({ transform: `rotate(${deg}deg)`, easing: "ease-in-out" }));
    animations.push(g.animate(swing, { duration: 12800, delay: end + lag, iterations: Infinity }));
  }
  return { animations, end };
}

/** Takes the bouquet back, top first; resolves when it is gone. */
export function withdraw(svg: SVGSVGElement, run: Run, duration = 300): Promise<void> {
  // the sway stops where it is, and everything else is let go as drawn
  for (const a of run.animations) a.cancel();
  const marks: [SVGGraphicsElement, DOMRect][] = [];
  for (const name of GROWN) svg.querySelectorAll<SVGGraphicsElement>(`[data-layer="${name}"] :is(${MARKS})`).forEach((el) => marks.push([el, el.getBBox()]));
  if (!marks.length) return Promise.resolve();
  const top = Math.min(...marks.map(([, b]) => b.y)), bottom = Math.max(...marks.map(([, b]) => b.y + b.height));
  const span = Math.max(1, bottom - top), each = duration * 0.35;
  const done = marks.map(([el, box]) => {
    const delay = ((box.y - top) / span) * (duration - each);
    const options: KeyframeAnimationOptions = { duration: each, delay, fill: "forwards", easing: "cubic-bezier(.5,0,.75,0)" };
    if (el instanceof SVGPolylineElement) {
      const from = stroke(el);
      return el.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: from, opacity: 0 }], options).finished;
    }
    origin(el);
    return el.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0)", opacity: 0 }], options).finished;
  });
  return Promise.all(done).then(() => undefined);
}

/** Every animation stopped and every mark left as drawn. */
export function stop(run: Run): void {
  for (const a of run.animations) a.cancel();
}

/** Sets a line up to be drawn from its lower end, where its stem comes from; returns the offset that hides it. */
function stroke(el: SVGPolylineElement): number {
  const len = el.getTotalLength();
  const first = el.points[0], last = el.points[el.points.length - 1];
  el.style.strokeDasharray = `${len} ${len}`;
  return first.y >= last.y ? len : -len;
}

/** A filled mark scales about its foot, a dot about its middle. */
function origin(el: SVGGraphicsElement): void {
  el.style.transformBox = "fill-box";
  el.style.transformOrigin = el instanceof SVGCircleElement ? "50% 50%" : "50% 100%";
}

/**
 * A damped spring, solved and sampled into CSS's linear() easing, so a mark opening overshoots and
 * settles as a sprung thing does rather than along a drawn curve. Unit mass; the duration is how long
 * the spring takes to come within half a percent of rest.
 */
function spring(stiffness: number, damping: number): { easing: string; duration: number } {
  const w0 = Math.sqrt(stiffness), zeta = damping / (2 * w0);
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  const at = (t: number) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  let settle = 0;
  for (let t = 0; t < 4; t += 0.005) if (Math.abs(at(t) - 1) > 0.005) settle = t;
  const samples = Array.from({ length: 41 }, (_, i) => +at((settle * i) / 40).toFixed(4));
  samples[40] = 1;
  return { easing: `linear(${samples.join(", ")})`, duration: Math.round(settle * 1000) };
}

const OPEN = spring(500, 28);

/** A steady wobble in the front, so stems side by side do not rise as one. */
function jitter(x: number): number {
  const s = Math.sin(x * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}
