// The garden switcher, shared by the garden and the token gallery: a button showing the garden on
// show, as its emblem and name, and the list of gardens it opens (a popover, so the browser closes
// it on Escape or a click elsewhere). Its look is in switcher.css; where the button sits is the
// page's to say, and the list opens under it.

import { GARDENS, type Garden } from "./gardens.ts";

const known = (key: string | null) => (GARDENS.some((g) => g.key === key) ? key : null);

// The garden a page opens on: the one its address names, else the visitor's last choice, else
// `fallback`.
export function chosenGarden(fallback: string): string {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem("garden");
  } catch {}
  return known(new URLSearchParams(location.search).get("garden")) ?? known(saved) ?? fallback;
}

// Keeps a choice: in the address, so it can be shared, and for the next visit.
export function keepGarden(key: string) {
  try {
    localStorage.setItem("garden", key);
  } catch {}
  const url = new URL(location.href);
  url.searchParams.set("garden", key);
  history.replaceState(null, "", url);
}

// A garden's emblem, in ink: every stroke has a length of 1, so CSS can draw it in.
export function emblem({ leaves, lines }: Garden) {
  const path = (cls: string) => (d: string) => `<path class="${cls}" pathLength="1" d="${d}"/>`;
  return `<svg class="emblem" viewBox="0 0 24 24" aria-hidden="true">${leaves.map(path("leaf")).join("")}${lines.map(path("line")).join("")}</svg>`;
}

// Fills `button` and `list` and wires them: `current` says which garden is on show, and `choose`
// is called with the garden a visitor picks. Arrow keys move through the list.
export function setupSwitcher(button: HTMLButtonElement, list: HTMLElement, current: () => string, choose: (key: string) => void) {
  list.innerHTML = GARDENS.map(
    (g, i) => `<button type="button" role="menuitemradio" data-garden="${g.key}" style="--tone: var(${g.tone}); --i: ${i}">${emblem(g)}<span>${g.name}</span></button>`,
  ).join("");
  const items = [...list.querySelectorAll<HTMLButtonElement>("[data-garden]")];
  const sync = () => {
    const g = GARDENS.find((g) => g.key === current())!;
    button.style.setProperty("--tone", `var(${g.tone})`);
    button.innerHTML = `${emblem(g)}<span>${g.name}</span><svg class="chevron" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>`;
    button.setAttribute("aria-label", `${g.name} garden. Choose a garden`);
    for (const item of items) item.setAttribute("aria-checked", String(item.dataset.garden === g.key));
  };
  list.addEventListener("click", (e) => {
    const item = (e.target as Element).closest<HTMLButtonElement>("[data-garden]");
    if (!item) return;
    list.hidePopover();
    if (item.dataset.garden !== current()) choose(item.dataset.garden!);
    sync();
  });
  list.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
  });
  list.addEventListener("beforetoggle", (e) => {
    if ((e as ToggleEvent).newState !== "open") return;
    const { bottom, right } = button.getBoundingClientRect();
    list.style.setProperty("--top", `${bottom + 8}px`);
    list.style.right = `${document.documentElement.clientWidth - right}px`;
  });
  list.addEventListener("toggle", (e) => {
    const open = (e as ToggleEvent).newState === "open";
    button.dataset.open = String(open);
    if (open) items.find((item) => item.dataset.garden === current())?.focus();
  });
  sync();
}
