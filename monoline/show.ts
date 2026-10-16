// A card that keeps itself. The first arrangement arrives whole, the bottle first; after that the
// bottle stays: each arrangement grows, stands a while, and is taken back into it, and the bottle
// itself becomes the next one while the colours turn to a palette rolled for the next flowers, which
// then grow from it, from the other garden. A click brings the next one at once.
//
// It works only while it can be seen: off screen, or in a tab put aside, it waits where it is. A
// reader who asks for less motion gets each arrangement standing, and the next only on a click.
//
//   mount(element, { caption })      the card fills the element, at three by four

import { arrange, describe, empty, svg as draw, type Arrangement } from "./arrange.ts";
import type { Pt } from "./pen.ts";
import { grow, withdraw, type Run } from "./grow.ts";
import { GARDENS } from "./plants.ts";
import { apply, register, roll } from "./palette.ts";

const HOLD = 500;     // ms an arrangement stands, grown, before it is taken back
const MORPH = 400;    // ms the palette and the glass take to become the next

export type Options = {
  /** Called with each arrangement as it arrives: its garden and region, and words for it. */
  caption?: (a: Arrangement, words: string) => void;
  /** The first arrangement's seed; random if not given. */
  seed?: number;
};

export function mount(host: HTMLElement, { caption, seed = 1 + Math.floor(Math.random() * 1e6) }: Options = {}): void {
  register();
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  host.classList.add("ml");
  let garden = Math.floor(seed % GARDENS.length);
  let current: { el: SVGSVGElement; run: Run | null } | null = null;
  let busy = false, timer = 0, seen = false;

  const place = (a: Arrangement): SVGSVGElement => {
    host.insertAdjacentHTML("beforeend", draw(a));
    const el = host.lastElementChild as SVGSVGElement;
    caption?.(a, describe(a));
    return el;
  };

  let shown = arrange(seed, GARDENS[garden].key);
  apply(host, roll(seed, shown.hints));
  current = { el: place(shown), run: null };

  const next = async () => {
    if (busy || !current) return;
    busy = true;
    clearTimeout(timer);
    seed = (Math.imul(seed, 2654435761) >>> 0) % 1e9 || 1;
    garden = (garden + 1) % GARDENS.length;
    const a = arrange(seed, GARDENS[garden].key);
    const old = current;
    if (still) {
      apply(host, roll(seed, a.hints));
      old.el.remove();
      current = { el: place(a), run: null };
      shown = a;
      busy = false;
      return;
    }
    // Taken back into the bottle; then the bottle becomes the next one while the colours turn; then
    // the next is put in its place, its bottle already standing exactly there, and grows at once.
    if (old.run) await withdraw(old.el, old.run);
    apply(host, roll(seed, a.hints), MORPH);
    await become(old.el, shown, a, MORPH);
    old.el.remove();
    const el = place(a);
    current = { el, run: grow(el, { intro: false }) };
    shown = a;
    busy = false;
    schedule();
  };

  // The next comes HOLD after the current is grown, but only once the card is on screen and the tab in view.
  const schedule = () => {
    clearTimeout(timer);
    if (still || !current?.run) return;
    const due = () => (seen && !document.hidden ? void next() : (timer = window.setTimeout(due, 1000)));
    timer = window.setTimeout(due, current.run.end + HOLD);
  };

  host.addEventListener("click", () => void next());
  if (still) return;

  // The first grows when the card first comes into view, so a reader sees it grow. Out of view, or in a tab put
  // aside, every animation in the card holds where it is (the sway too), and goes on from there when it is back.
  const hold = () => {
    const on = seen && !document.hidden;
    for (const a of host.getAnimations({ subtree: true })) on ? a.playState === "paused" && a.play() : a.pause();
  };
  new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    if (seen && current && !current.run) {
      current.run = grow(current.el);
      schedule();
    }
    hold();
  }, { threshold: 0.35 }).observe(host);
  document.addEventListener("visibilitychange", hold);
}

/**
 * An emptied card's bottle becomes the next one: every point of its outline, and its water, eased
 * from where they are to where the next will have them, the glass and its ground drawn again each
 * frame. Every bottle has as many points as every other, so any one can become any other.
 */
function become(svg: SVGSVGElement, from: Arrangement, to: Arrangement, ms: number): Promise<void> {
  const groups = new Map([...svg.querySelectorAll<SVGGElement>("[data-layer]")].map((g) => [g.dataset.layer!, g]));
  // what the stems' layers held has been taken back
  for (const name of ["submerged", "inside", "bouquet-back", "bouquet"]) groups.get(name)?.replaceChildren();
  const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
  const t0 = performance.now();
  return new Promise((done) => {
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / ms), k = ease(t);
      const half = from.half.map(([x, y], i): Pt => [x + (to.half[i][0] - x) * k, y + (to.half[i][1] - y) * k]);
      for (const [name, marks] of Object.entries(empty(half, from.water + (to.water - from.water) * k, "become"))) {
        const g = groups.get(name);
        if (g) g.innerHTML = marks.join("");
      }
      if (t < 1) requestAnimationFrame(frame);
      else done();
    };
    requestAnimationFrame(frame);
  });
}
