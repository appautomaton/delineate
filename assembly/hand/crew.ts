// A crew of hands that makes a finished page in front of the reader. The page is written whole, as it will stand;
// the crew reads it, takes it apart into the work a design team would do, and does that work section by section
// as each one comes into view:
//
//   guides   two red column guides, pulled down the section first, that the rest is laid against;
//   blocks   anything with a fill, an edge or a shadow: a frame dragged out corner to corner, grey inside, that
//            takes the element's look when the button comes up;
//   text     a text frame dragged out, or a click in a small one, then typed key by key; a headline is typed
//            small and pulled up to its size by its corner handle;
//   slots    a row of labels typed at once by several hands, who all type the first label, see they have done
//            the same work, and put it right;
//   drawings crayon, each group of strands followed by one pen, its tip where the wax is being laid.
//
// Each free hand takes the nearest piece of work whose ground is laid, in the earliest section still open. Marks
// in the page say how to read it: data-section on each section, data-build="skip" for what the crew leaves alone,
// "type", "block" or "headline" to choose for an element, "slots" on a row of labels, "draw" on a crayon drawing.

import type { Clock } from "./clock.ts";
import { boxOf, type Hand } from "./hand.ts";
import type { Frame, Guide, Marks } from "./marks.ts";
import type { Box, Pt } from "./motion.ts";

type Section = {
  el: HTMLElement;
  index: number;
  active: boolean;
  tasks: Task[];
  guides: Guide[];
  built: Box[];
};

type Task = {
  section: Section;
  deps: Task[];
  state: "waiting" | "taken" | "done";
  where: () => Pt;
  run: (h: Hand) => Promise<void>;
};

// A text in the making: what it will say, what has been typed, the caret, and the rest held invisible so the
// line keeps its final length and nothing around it moves.
type Writing = { el: HTMLElement; full: string; typed: Text; caret: HTMLElement; rest: HTMLElement };

export type Stats = { total: number; done: number; busy: number; conflicts: number; settled: number };

const centre = (b: Box): Pt => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

function painted(el: Element): boolean {
  const s = getComputedStyle(el);
  const bg = s.backgroundColor;
  const hasBg = bg !== "transparent" && !/,\s*0\)$/.test(bg);
  const hasBorder = ["Top", "Right", "Bottom", "Left"].some(
    (side) => parseFloat(s.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 && s.getPropertyValue(`border-${side.toLowerCase()}-style`) !== "none",
  );
  return hasBg || hasBorder || s.boxShadow !== "none" || el instanceof SVGSVGElement || el instanceof HTMLImageElement;
}

const isLeaf = (el: Element) => el.children.length === 0 && (el.textContent ?? "").trim() !== "";

// The box the text itself fills, as a text frame hugs its words, in page coordinates.
function textBox(el: Element): Box {
  const range = document.createRange();
  range.selectNodeContents(el);
  const r = range.getBoundingClientRect();
  return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
}

// A row of labels set at once, and the moment all of them have been typed.
type Row = { n: number; typed: number; wrong: string; all: Promise<void>; arrive: () => void };

export class Crew {
  readonly stats: Stats = { total: 0, done: 0, busy: 0, conflicts: 0, settled: 0 };
  onchange: () => void = () => {};
  readonly finished: Promise<void>;

  readonly #hands: Hand[];
  readonly #marks: Marks;
  readonly #clock: Clock;
  readonly #sections: Section[] = [];
  readonly #writings = new Map<Element, Writing>();
  #finish!: () => void;
  #over = false;

  constructor(root: HTMLElement, hands: Hand[], marks: Marks, clock: Clock) {
    this.#hands = hands;
    this.#marks = marks;
    this.#clock = clock;
    this.finished = new Promise((done) => (this.#finish = done));
    root.querySelectorAll<HTMLElement>("[data-section]").forEach((el, index) => {
      const section: Section = { el, index, active: false, tasks: [], guides: [], built: [] };
      this.#sections.push(section);
      this.#read(section);
    });
    this.stats.total = this.#sections.reduce((n, s) => n + s.tasks.length, 0);
  }

  // Sets the crew to work: each section opens as it comes into view, and every hand looks for work.
  start() {
    const watch = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const s = this.#sections.find((s) => s.el === e.target);
          if (s) s.active = true;
        }
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    for (const s of this.#sections) watch.observe(s.el);
    for (const h of this.#hands) this.#work(h);
  }

  // Stops taking work; the hands finish what they hold.
  stop() {
    this.#over = true;
  }

  // ——— Reading the page into work ———

  #read(section: Section) {
    const guides = this.#guides(section);
    const walk = (el: Element, parent: Task[]) => {
      for (const child of el.children) {
        if (!(child instanceof HTMLElement || child instanceof SVGSVGElement)) continue;
        const build = (child as HTMLElement).dataset.build;
        if (build === "skip") continue;
        if (build === "draw") {
          child.querySelectorAll<SVGGElement>("g[data-hand]").forEach((g) => this.#add(section, [...guides, ...parent], this.#draw(g)));
          continue;
        }
        if (build === "slots") {
          const slots = [...child.children] as HTMLElement[];
          const row = this.#row(slots);
          slots.forEach((slot, i) => this.#add(section, [...guides, ...parent], this.#slot(slot, i, row)));
          continue;
        }
        const el = child as HTMLElement;
        const block = build === "block" || (build !== "type" && build !== "headline" && painted(el));
        if (block) {
          const t = this.#add(section, [...guides, ...parent], this.#block(el));
          if (isLeaf(el)) this.#add(section, [...guides, t], this.#text(el, true));
          else walk(el, [t]);
        } else if (isLeaf(el) || build === "type" || build === "headline") {
          this.#add(section, [...guides, ...parent], this.#text(el, false));
        } else walk(el, parent);
      }
    };
    walk(section.el, []);
  }

  #add(section: Section, deps: Task[], work: Pick<Task, "where" | "run">): Task {
    const task: Task = { section, deps, state: "waiting", ...work };
    section.tasks.push(task);
    return task;
  }

  // The two column guides, at the inner edges of the section's measure.
  #guides(section: Section): Task[] {
    const wrap = section.el.querySelector<HTMLElement>(".wrap") ?? section.el;
    return [0, 1].map((side) =>
      this.#add(section, [], {
        where: () => {
          const b = boxOf(wrap);
          return { x: side ? b.x + b.w : b.x, y: Math.max(b.y, scrollY + 40) };
        },
        run: async (h) => {
          const b = boxOf(wrap);
          const s = getComputedStyle(wrap);
          const x = side ? b.x + b.w - parseFloat(s.paddingRight) : b.x + parseFloat(s.paddingLeft);
          const top = boxOf(section.el).y;
          const bottom = top + section.el.offsetHeight;
          const y0 = clamp(scrollY + 60 + h.random.uniform(0, 80), top, bottom - 40);
          h.tool = "cross";
          await h.reachPoint({ x, y: y0 }, 2);
          await h.press();
          const guide = this.#marks.guide(x);
          section.guides.push(guide);
          const stop = this.#clock.each(() => guide.span(y0, h.pos.y));
          await h.reachPoint({ x, y: clamp(y0 + h.random.uniform(180, 320), top, bottom) }, 2, 1.1);
          stop();
          // Let go, and the guide runs the section's height, as a ruler guide does.
          guide.span(top, bottom);
          h.release();
          h.tool = "arrow";
        },
      }),
    );
  }

  // Drags out a frame over `box`, grey inside if `fill`, the hand pressing at one corner and letting go at the
  // other; the frame snaps to the box when the button comes up.
  async #dragFrame(h: Hand, box: Box, fill: boolean): Promise<Frame> {
    h.tool = "cross";
    await h.reachPoint({ x: box.x, y: box.y }, 3);
    const frame = this.#marks.frame().fill(fill);
    const o = { ...h.pos };
    frame.set({ x: o.x, y: o.y, w: 0, h: 0 });
    await h.press();
    const stop = this.#clock.each(() => frame.set({ x: o.x, y: o.y, w: h.pos.x - o.x, h: h.pos.y - o.y }));
    await h.reachPoint({ x: box.x + box.w, y: box.y + box.h }, 3, 1.15);
    stop();
    frame.set(box);
    h.release();
    return frame;
  }

  #block(el: HTMLElement): Pick<Task, "where" | "run"> {
    el.classList.add("is-unbuilt");
    return {
      where: () => centre(boxOf(el)),
      run: async (h) => {
        const box = boxOf(el);
        if (box.w < 32 || box.h < 24) {
          // Too small to draw out: placed with a click.
          await h.reach(box);
          await h.click();
          this.#reveal(el);
          return;
        }
        const frame = await this.#dragFrame(h, box, true);
        this.#reveal(el);
        frame.fill(false);
        this.#aligned(this.#sectionOf(el), box);
        await h.rest(0.18);
        frame.remove();
        h.tool = "arrow";
      },
    };
  }

  #reveal(el: HTMLElement) {
    el.classList.remove("is-unbuilt");
    el.classList.add("is-arriving");
    el.addEventListener("animationend", () => el.classList.remove("is-arriving"), { once: true });
  }

  #sectionOf(el: Element): Section {
    return this.#sections.find((s) => s.el.contains(el))!;
  }

  // Blue lines where the new box's left or top edge meets an edge already laid in the section.
  #aligned(section: Section, box: Box) {
    let shown = 0;
    for (const b of section.built) {
      if (shown >= 2) break;
      if (Math.abs(b.x - box.x) < 1.5) {
        this.#marks.align(box.x, Math.min(b.y, box.y), box.x, Math.max(b.y + b.h, box.y + box.h));
        shown++;
      } else if (Math.abs(b.y - box.y) < 1.5) {
        this.#marks.align(Math.min(b.x, box.x), box.y, Math.max(b.x + b.w, box.x + box.w), box.y);
        shown++;
      }
    }
    section.built.push(box);
  }

  #writing(el: HTMLElement): Writing {
    const full = el.textContent ?? "";
    const typed = document.createTextNode("");
    const caret = document.createElement("span");
    caret.className = "type-caret";
    const rest = document.createElement("span");
    rest.className = "type-rest";
    rest.textContent = full;
    el.replaceChildren(typed, caret, rest);
    const w = { el, full, typed, caret, rest };
    this.#writings.set(el, w);
    return w;
  }

  #write(w: Writing, shown: string, held = true) {
    w.typed.data = shown;
    w.rest.textContent = held ? w.full.slice(shown.length) : "";
  }

  #done(w: Writing) {
    w.el.textContent = w.full;
  }

  // Types into `w` with the caret in the hand's colour. A long passage is typed faster, so no one hand keeps the
  // page waiting while the rest stand idle.
  async #typeInto(h: Hand, w: Writing, text: string, held = true) {
    w.caret.style.background = h.colour;
    w.el.classList.add("is-typing");
    await h.type(text, (shown) => this.#write(w, shown, held), clamp(text.length / 80, 1, 2.6));
    w.el.classList.remove("is-typing");
  }

  #text(el: HTMLElement, inBlock: boolean): Pick<Task, "where" | "run"> {
    const w = this.#writing(el);
    const headline = el.dataset.build === "headline";
    return {
      where: () => centre(boxOf(el)),
      run: async (h) => {
        // A headline is set small first, its final height held so nothing below it moves.
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (headline) {
          el.style.minHeight = `${boxOf(el).h}px`;
          el.style.fontSize = `${size * 0.36}px`;
        }
        const box = textBox(el);
        let frame: Frame;
        if (box.w >= 140 && !inBlock) frame = await this.#dragFrame(h, box, false);
        else {
          await h.reach(box);
          await h.click();
          frame = this.#marks.frame().set(box).bare(true);
        }
        h.tool = "text";
        await h.reachPoint({ x: box.x + 4, y: box.y + Math.min(box.h, size * 1.2) / 2 }, 3, 0.7);
        const keep = this.#clock.each(() => frame.set(textBox(el)));
        await this.#typeInto(h, w, w.full);
        if (headline) await this.#enlarge(h, el, size);
        keep();
        this.#done(w);
        el.style.minHeight = "";
        this.#aligned(this.#sectionOf(el), textBox(el));
        await h.rest(0.12);
        frame.remove();
        h.tool = "arrow";
      },
    };
  }

  // Takes a headline's corner handle and pulls it out until the type stands at full size.
  async #enlarge(h: Hand, el: HTMLElement, size: number) {
    const small = parseFloat(el.style.fontSize);
    const start = textBox(el);
    el.style.fontSize = "";
    const end = textBox(el);
    el.style.fontSize = `${small}px`;
    const from = { x: start.x + start.w, y: start.y + start.h };
    const to = { x: end.x + end.w, y: end.y + end.h };
    const span = (to.x - from.x) ** 2 + (to.y - from.y) ** 2 || 1;
    h.tool = "resize";
    await h.reachPoint(from, 3);
    await h.press();
    const stop = this.#clock.each(() => {
      const k = clamp(((h.pos.x - from.x) * (to.x - from.x) + (h.pos.y - from.y) * (to.y - from.y)) / span, 0, 1);
      el.style.fontSize = `${small + (size - small) * k}px`;
    });
    await h.reachPoint(to, 3, 1.3);
    stop();
    el.style.fontSize = "";
    h.release();
  }

  // A row of labels set at once: each holds its final width, so a wrong label never moves its neighbours.
  #row(slots: HTMLElement[]): Row {
    const row: Row = { n: slots.length, typed: 0, wrong: (slots[0].textContent ?? "").trim(), all: Promise.resolve(), arrive: () => {} };
    row.all = new Promise((done) => (row.arrive = () => void (++row.typed === row.n && done())));
    for (const s of slots) s.style.minWidth = `${s.getBoundingClientRect().width}px`;
    return row;
  }

  #slot(el: HTMLElement, i: number, row: Row): Pick<Task, "where" | "run"> {
    const w = this.#writing(el);
    return {
      where: () => centre(boxOf(el)),
      run: async (h) => {
        const box = boxOf(el);
        await h.reach(box);
        await h.click();
        const frame = this.#marks.frame().set(box);
        h.tool = "text";
        const wrong = i > 0;
        await this.#typeInto(h, w, wrong ? row.wrong : w.full, !wrong);
        if (wrong) {
          frame.conflict(true).label("duplicate");
          this.stats.conflicts++;
          this.onchange();
        }
        row.arrive();
        await row.all;
        await h.rest(h.random.uniform(0.25, 0.9));
        if (wrong) {
          // Select the label and type the right one over it.
          el.classList.add("is-selected");
          await h.rest(0.28);
          el.classList.remove("is-selected");
          this.#write(w, "");
          frame.conflict(false).label(null);
          await this.#typeInto(h, w, w.full);
          this.stats.settled++;
        }
        this.#done(w);
        await h.rest(0.1);
        frame.remove();
        h.tool = "arrow";
      },
    };
  }

  // A crayon group, followed by one pen. Each strand carries the moment the crayon reached it (--d) and how long
  // it took (--t). The pen's tip, at any moment, is the head of the strands most lately begun; where it jumps,
  // the hand lifts the pen and carries it over, and the drawing waits for it.
  #draw(g: SVGGElement): Pick<Task, "where" | "run"> {
    type Strand = { p: SVGPathElement; d: number; t: number; len: number; shown: number };
    const strands: Strand[] = [...g.querySelectorAll("path")].map((p) => {
      const style = p.getAttribute("style") ?? "";
      const d = parseFloat(style.match(/--d:\s*([\d.]+)s/)?.[1] ?? "0");
      const t = parseFloat(style.match(/--t:\s*([\d.]+)s/)?.[1] ?? "0.1");
      return { p, d, t, len: 0, shown: 0 };
    });
    const t0 = Math.min(...strands.map((s) => s.d));
    for (const s of strands) s.d -= t0;
    const end = Math.max(...strands.map((s) => s.d + s.t));
    const show = (tau: number) => {
      for (const s of strands) {
        const k = clamp((tau - s.d) / s.t, 0, 1);
        if (k !== s.shown) {
          s.shown = k;
          s.p.style.strokeDashoffset = String(1 - k);
        }
      }
    };
    return {
      where: () => centre(boxOf(g)),
      run: async (h) => {
        for (const s of strands) s.len = s.p.getTotalLength();
        // Where the tip is at each sixtieth of a second, in page coordinates, or null while it is lifted.
        const DT = 1 / 60;
        const tips: (Pt | null)[] = [];
        for (let tau = 0; tau <= end; tau += DT) {
          const live = strands.filter((s) => s.d <= tau && tau < s.d + s.t);
          if (!live.length) {
            tips.push(null);
            continue;
          }
          const newest = Math.max(...live.map((s) => s.d));
          const lead = live.filter((s) => s.d >= newest - 0.05);
          let x = 0;
          let y = 0;
          for (const s of lead) {
            const m = s.p.getScreenCTM()!;
            const q = s.p.getPointAtLength((s.len * (tau - s.d)) / s.t).matrixTransform(m);
            x += q.x;
            y += q.y;
          }
          tips.push({ x: x / lead.length + scrollX, y: y / lead.length + scrollY });
        }
        // Runs of the tip without a lift or a jump: each is one movement of the pen.
        const runs: { from: number; points: Pt[] }[] = [];
        tips.forEach((p, i) => {
          const last = runs[runs.length - 1];
          const prev = last?.points[last.points.length - 1];
          if (!p) return;
          if (!last || tips[i - 1] === null || !prev || Math.hypot(p.x - prev.x, p.y - prev.y) > 26) runs.push({ from: i, points: [p] });
          else last.points.push(p);
        });
        let tau = 0;
        const stop = this.#clock.each(() => show(tau));
        h.tool = "pen";
        for (const run of runs) {
          await h.reachPoint(run.points[0], 2, 0.75);
          if (run.points.length < 2) continue;
          h.pointer.tagged = true;
          const begun = h.clock.now;
          const from = run.from * DT;
          const step = this.#clock.each((now) => (tau = from + Math.min(now - begun, (run.points.length - 1) * DT)));
          await h.follow(run.points, DT);
          step();
          tau = from + (run.points.length - 1) * DT;
        }
        tau = end;
        show(end);
        stop();
        h.release();
        h.tool = "arrow";
      },
    };
  }

  // ——— The hands at work ———

  async #work(h: Hand) {
    while (!this.#over) {
      const task = this.#take(h);
      if (!task) {
        await this.#idle(h);
        continue;
      }
      task.state = "taken";
      this.stats.busy++;
      this.onchange();
      await task.run(h);
      task.state = "done";
      this.stats.busy--;
      this.stats.done++;
      this.onchange();
      this.#closed(task.section);
    }
  }

  // The nearest piece of work whose ground is laid, in the earliest open section.
  #take(h: Hand): Task | null {
    let best: Task | null = null;
    let score = Infinity;
    for (const s of this.#sections) {
      if (!s.active) continue;
      for (const t of s.tasks) {
        if (t.state !== "waiting" || t.deps.some((d) => d.state !== "done")) continue;
        const p = t.where();
        const sc = s.index * 1e5 + Math.hypot(p.x - h.pos.x, p.y - h.pos.y);
        if (sc < score) {
          score = sc;
          best = t;
        }
      }
      if (best) break;
    }
    return best;
  }

  // A hand without work drifts about the screen, now and then, and keeps an eye out for work.
  async #idle(h: Hand) {
    const view = { x: scrollX + 40, y: scrollY + 60, w: innerWidth - 80, h: innerHeight - 120 };
    const off = h.pos.y < view.y - 40 || h.pos.y > view.y + view.h + 40;
    if (off || h.random.chance(0.18)) {
      const target = off
        ? { x: view.x + h.random.uniform(0, view.w), y: view.y + h.random.uniform(0, view.h) }
        : { x: clamp(h.pos.x + h.random.normal(0, 140), view.x, view.x + view.w), y: clamp(h.pos.y + h.random.normal(0, 110), view.y, view.y + view.h) };
      await h.reachPoint(target, 12, 1.4);
    }
    await h.rest(h.random.uniform(0.2, 0.6));
  }

  #closed(section: Section) {
    if (section.tasks.some((t) => t.state !== "done")) return;
    for (const g of section.guides) g.remove();
    section.guides = [];
    if (this.#sections.every((s) => s.tasks.every((t) => t.state === "done"))) {
      this.#over = true;
      this.#finish();
    }
  }
}
