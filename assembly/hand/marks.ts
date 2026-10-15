// The marks a design tool lays over a page while it is being made, and takes away when the work is done:
// selection frames with their handles and a badge of their size, red column guides, the blue lines that flash
// where two edges align, and rulers along the top and left that light up under whatever is selected.
//
// Frames, guides and lines live on a layer in page coordinates; the rulers stay on the screen.

import type { Box } from "./motion.ts";

const px = (v: number) => `${Math.round(v * 2) / 2}px`;
const size = (b: Box) => `${Math.round(b.w)} × ${Math.round(b.h)}`;

export class Frame {
  readonly el: HTMLElement;
  box: Box = { x: 0, y: 0, w: 0, h: 0 };
  readonly #badge: HTMLElement;
  #label: string | null = null;
  readonly #marks: Marks;

  constructor(marks: Marks, layer: HTMLElement) {
    this.#marks = marks;
    this.el = document.createElement("div");
    this.el.className = "frame";
    this.el.innerHTML = '<i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i>';
    this.#badge = document.createElement("span");
    this.#badge.className = "frame-badge";
    this.el.append(this.#badge);
    layer.append(this.el);
  }

  // Lays the frame over `box`, which may be given corner to corner in either order.
  set(box: Box): this {
    const x = Math.min(box.x, box.x + box.w);
    const y = Math.min(box.y, box.y + box.h);
    this.box = { x, y, w: Math.abs(box.w), h: Math.abs(box.h) };
    Object.assign(this.el.style, { left: px(x), top: px(y), width: px(this.box.w), height: px(this.box.h) });
    this.#badge.textContent = this.#label ?? size(this.box);
    return this;
  }

  // A badge of the frame's own instead of its size; null goes back to the size.
  label(text: string | null): this {
    this.#label = text;
    this.#badge.textContent = text ?? size(this.box);
    return this;
  }

  // Red, where two hands have done the same work.
  conflict(on: boolean): this {
    this.el.classList.toggle("is-conflict", on);
    return this;
  }

  // Grey inside, as a shape stands before it is given its look.
  fill(on: boolean): this {
    this.el.classList.toggle("is-fill", on);
    return this;
  }

  // Handles and badge off: the frame as a hover outline only.
  bare(on: boolean): this {
    this.el.classList.toggle("is-bare", on);
    return this;
  }

  remove() {
    this.#marks.frames.delete(this);
    this.el.classList.add("is-leaving");
    setTimeout(() => this.el.remove(), 260);
  }
}

export class Guide {
  readonly el: HTMLElement;
  readonly x: number;

  constructor(layer: HTMLElement, x: number) {
    this.x = x;
    this.el = document.createElement("div");
    this.el.className = "guide";
    this.el.style.left = px(x);
    layer.append(this.el);
  }

  span(y0: number, y1: number) {
    Object.assign(this.el.style, { top: px(Math.min(y0, y1)), height: px(Math.abs(y1 - y0)) });
  }

  remove() {
    this.el.classList.add("is-leaving");
    setTimeout(() => this.el.remove(), 600);
  }
}

export class Marks {
  readonly layer: HTMLElement;
  readonly frames = new Set<Frame>();
  readonly #top: HTMLCanvasElement;
  readonly #left: HTMLCanvasElement;
  #shown = false;
  #font: string | undefined;

  constructor(layer: HTMLElement) {
    this.layer = layer;
    this.#top = document.createElement("canvas");
    this.#top.className = "ruler ruler-top";
    this.#left = document.createElement("canvas");
    this.#left.className = "ruler ruler-left";
    document.body.append(this.#top, this.#left);
  }

  frame(): Frame {
    const f = new Frame(this, this.layer);
    this.frames.add(f);
    return f;
  }

  guide(x: number): Guide {
    return new Guide(this.layer, x);
  }

  // A blue line from one point to another, along a shared edge, that flashes and goes.
  align(x0: number, y0: number, x1: number, y1: number) {
    const el = document.createElement("div");
    el.className = "align";
    Object.assign(el.style, {
      left: px(Math.min(x0, x1)),
      top: px(Math.min(y0, y1)),
      width: px(Math.max(Math.abs(x1 - x0), 1)),
      height: px(Math.max(Math.abs(y1 - y0), 1)),
    });
    el.addEventListener("animationend", () => el.remove());
    this.layer.append(el);
  }

  // The rulers show while anything is being made on the screen.
  set rulers(on: boolean) {
    if (on === this.#shown) return;
    this.#shown = on;
    document.documentElement.classList.toggle("is-making", on);
  }

  // Draws the rulers afresh, ticks and the reach of every frame, for the screen as it now stands.
  draw() {
    if (!this.#shown) return;
    const dpr = devicePixelRatio;
    const T = 20;
    for (const [c, w, h] of [
      [this.#top, innerWidth, T],
      [this.#left, T, innerHeight],
    ] as const) {
      if (c.width !== w * dpr || c.height !== h * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
    }
    const top = this.#top.getContext("2d")!;
    const left = this.#left.getContext("2d")!;
    for (const ctx of [top, left]) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#2a2a2c";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      // In the page's own mono, read once.
      this.#font ??= `9px ${getComputedStyle(document.documentElement).getPropertyValue("--mono") || "ui-monospace, monospace"}`;
      ctx.font = this.#font;
      ctx.textBaseline = "top";
    }
    // Under every frame on the screen, a pale band the length of its side.
    top.fillStyle = left.fillStyle = "rgb(13 153 255 / 0.38)";
    for (const f of this.frames) {
      const { x, y, w, h } = f.box;
      top.fillRect(x - scrollX, 0, w, T);
      left.fillRect(0, y - scrollY, T, h);
    }
    // Ticks every 10 px, longer every 50, numbered every 100, in page coordinates.
    top.fillStyle = left.fillStyle = "#8e8e93";
    const x0 = Math.floor(scrollX / 10) * 10;
    for (let x = x0; x - scrollX < innerWidth; x += 10) {
      const len = x % 100 === 0 ? T : x % 50 === 0 ? 7 : 4;
      top.fillRect(x - scrollX, T - len, 1, len);
      if (x % 100 === 0) top.fillText(String(x), x - scrollX + 3, 3);
    }
    const y0 = Math.floor(scrollY / 10) * 10;
    for (let y = y0; y - scrollY < innerHeight; y += 10) {
      const len = y % 100 === 0 ? T : y % 50 === 0 ? 7 : 4;
      left.fillRect(T - len, y - scrollY, len, 1);
      if (y % 100 === 0) {
        left.save();
        left.translate(3, y - scrollY - 3);
        left.rotate(-Math.PI / 2);
        left.fillText(String(y), 0, 0);
        left.restore();
      }
    }
  }
}
