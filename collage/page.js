// The Collage page: the five motifs dealt onto a block of cards, one large and four small, each card in its own ink,
// opening on its own shot and keeping its own time. Shuffle deals again; a card opens large in a viewer.

import { SHOTS, mountCard } from "./card.js";
import { GROUNDS, MOTIFS } from "./motifs.js";

const IDS = Object.keys(MOTIFS);
const INKS = Object.keys(GROUNDS);

const shuffled = (list) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const between = (a, b) => a + Math.random() * (b - a);

// The first deal is set: The Panther Hunter large, in navy, from its first shot, and each other motif in an ink of
// its own. Every later deal is chance: which motif is large, each card's ink, opening shot, tempo, and lag.
function deal(first) {
  const ids = first ? IDS : shuffled(IDS);
  const inks = first ? ["navy", "oxblood", "plum", "forest", "navy"] : [INKS[Math.floor(Math.random() * INKS.length)], ...shuffled(INKS)];
  return ids.map((id, k) => ({
    id,
    ground: inks[k],
    start: first && k === 0 ? 0 : Math.floor(Math.random() * SHOTS.length),
    tempo: k === 0 ? 1 : between(0.85, 1.2),
    delay: k === 0 ? 0 : between(300, 2400),
    seed: Math.floor(Math.random() * 2 ** 31),
  }));
}

const block = document.querySelector(".block");
const viewer = document.querySelector(".viewer");
let mounted = [];

function lay(hands) {
  mounted.forEach((c) => c.destroy());
  block.replaceChildren();
  mounted = hands.map((hand, k) => {
    const slot = Object.assign(document.createElement("button"), { className: k === 0 ? "slot large" : "slot", type: "button" });
    slot.setAttribute("aria-label", `${MOTIFS[hand.id].title}: open it large`);
    const card = document.createElement("div");
    slot.append(card);
    slot.addEventListener("click", () => open(hand));
    block.append(slot);
    return mountCard(card, hand.id, hand);
  });
}

// The viewer shows one card large, with its credit, from the shot it opened on.
let shown = null;
function open(hand) {
  const card = viewer.querySelector(".card-host");
  shown = mountCard(card, hand.id, { ...hand, delay: 0 });
  viewer.querySelector(".credit").innerHTML = MOTIFS[hand.id].credit;
  viewer.showModal();
}
viewer.addEventListener("close", () => {
  shown?.destroy();
  shown = null;
});
viewer.addEventListener("click", (e) => {
  if (e.target === viewer || e.target.closest(".close")) viewer.close();
});

document.querySelector(".shuffle").addEventListener("click", () => lay(deal(false)));
document.querySelector(".sources").append(
  ...IDS.map((id) => Object.assign(document.createElement("li"), { innerHTML: MOTIFS[id].credit })),
);
lay(deal(true));

// Day or night, as on delineate's page, which keeps the choice under the same name.
const light = document.querySelector(".theme");
function showLight() {
  const night = document.documentElement.dataset.theme === "night";
  light.textContent = night ? "Day" : "Night";
  light.setAttribute("aria-pressed", String(night));
}
light.addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "night" ? "day" : "night";
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("delineate-theme", theme); } catch {}
  showLight();
});
showLight();
