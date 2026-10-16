// Monoline's own page, where cards are made. The card keeps itself, as it does wherever it is shown.
//
//   ?seed=<n>   start on a given arrangement
//   ?layers     list the showing card's layers, each shown or hidden by a click or its number key, so
//               any layer can be judged alone: 0 shows them all, shift and a number that one by itself
//   ?sheet      a dozen arrangements standing side by side, each under its own roll, from the seed on,
//               to judge many at once

import { mount } from "./show.ts";
import { arrange, describe, ORDER, svg } from "./arrange.ts";
import { apply, register, roll } from "./palette.ts";

const params = new URLSearchParams(location.search);
const seed = Number(params.get("seed")) || undefined;

if (params.has("sheet")) sheet(seed ?? 1);
else card();

function card(): void {
  const host = document.querySelector<HTMLElement>("[data-monoline]")!;
  const [name, region] = document.querySelectorAll(".frame figcaption > *");
  mount(host, {
    seed,
    caption: (a, words) => {
      name.textContent = a.garden.name;
      region.textContent = a.garden.region;
      host.title = words;
    },
  });
  if (params.has("layers")) layers(host);
}

function sheet(from: number): void {
  register();
  const page = document.querySelector(".sheet")!;
  page.classList.add("is-sheet");
  page.replaceChildren();
  for (let s = from; s < from + 12; s++) {
    const a = arrange(s);
    const figure = document.createElement("figure");
    figure.innerHTML = `<div class="ml"></div><figcaption><b>${s}</b> · <span>${describe(a)}</span></figcaption>`;
    const ml = figure.querySelector<HTMLElement>(".ml")!;
    apply(ml, roll(s, a.hints));
    ml.innerHTML = svg(a);
    page.append(figure);
  }
}

function layers(host: HTMLElement): void {
  const hidden = new Set<string>();
  const panel = document.createElement("nav");
  panel.className = "layers";
  const buttons = ORDER.map((n, i) => {
    const b = document.createElement("button");
    b.textContent = `${i + 1} ${n}`;
    b.addEventListener("click", () => show(n, hidden.has(n)));
    panel.append(b);
    return b;
  });
  document.body.append(panel);

  // Hidden layers stay hidden on every card that arrives after.
  const paint = () => {
    for (const g of host.querySelectorAll<SVGGElement>("[data-layer]")) g.toggleAttribute("data-hidden", hidden.has(g.dataset.layer!));
    ORDER.forEach((n, i) => buttons[i].setAttribute("aria-pressed", String(!hidden.has(n))));
  };
  const show = (n: string, on: boolean) => {
    if (on) hidden.delete(n);
    else hidden.add(n);
    paint();
  };
  new MutationObserver(paint).observe(host, { childList: true });
  paint();

  addEventListener("keydown", (e) => {
    const digit = e.code.startsWith("Digit") ? Number(e.code.slice(5)) : NaN;
    if (Number.isNaN(digit)) return;
    if (digit === 0) return ORDER.forEach((n) => show(n, true));
    const n = ORDER[digit - 1];
    if (!n) return;
    if (e.shiftKey) ORDER.forEach((m) => show(m, m === n));
    else show(n, hidden.has(n));
  });
}
