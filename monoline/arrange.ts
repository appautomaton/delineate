// An arrangement: a garden, a bottle, and flowers set in it as ikebana sets them, from one seed.
//
// The tallest line (shin) stands off the axis to one side, a second line (soe) answers it lower on
// the other, the hero sits low and heavy near the mouth, mostly opposite the tallest; an accent
// answers the hero across the bottle, foliage reaches out on the hero's side, and filler scatters
// where the stems part. A narrow neck takes fewer stems than a wide one.
//
// Stems leave the mouth in the order their heads stand, left to right, spread across it, and every
// stem runs on the pen's three angles: down from its head, then on the diagonal to its place in the
// mouth, then straight down through the water. Ordered so, two stems can never cross.

import { line, path, PEN, type Pt } from "./pen.ts";
import { BOTTLES, glass, vessel, type Submerged } from "./vessel.ts";
import { ground } from "./ground.ts";
import { GARDENS, type Garden, type Plant, type Role } from "./plants.ts";
import { random, type Hints, type Hue } from "./palette.ts";

export const W = 1200, H = 1600, FOOT = 1352, AXIS = 600;
const TOP = 230; // nothing stands higher than this

export type Arrangement = {
  garden: Garden;
  bottle: string;
  /** The bottle's right half and how full it is: enough to draw it empty, or to become it. */
  half: Pt[];
  water: number;
  plants: Plant[];
  layers: Record<string, string[]>;
  hints: Hints;
  pivot: Pt;
};

const GROUND = ["--ml-ground", "--ml-accent", "--ml-filler-heart"];

/** A bottle standing empty on its ground, layer by layer: what a vase is between one arrangement and the next. */
export function empty(half: Pt[], water: number, id: string): Record<string, string[]> {
  const v = vessel(AXIS, FOOT, half, water);
  return { ground: ground(v.left - PEN, v.right + PEN, v.bottom, GROUND), ...glass(v, [], id) };
}

// What each part may be drawn from, in the order a narrow neck gives them up.
const PARTS: { role: Role; name: string }[] = [
  { role: "line", name: "shin" }, { role: "hero", name: "hero" }, { role: "accent", name: "accent" },
  { role: "foliage", name: "foliage" }, { role: "line", name: "soe" }, { role: "filler", name: "filler" },
];

export function arrange(seed: number, gardenKey?: string): Arrangement {
  const r = random(seed);
  const between = (a: number, b: number) => a + (b - a) * r();
  const pick = <T,>(list: T[]) => list[Math.floor(r() * list.length)];

  const garden = GARDENS.find((g) => g.key === gardenKey) ?? pick(GARDENS);
  const bottle = pick(Object.keys(BOTTLES));
  const water = between(0.35, 0.6);
  const v = vessel(AXIS, FOOT, BOTTLES[bottle], water);
  const capacity = Math.max(3, Math.min(PARTS.length, Math.floor((v.mouth * 2) / (PEN * 1.6)) + 1));

  // Heads, by part. The tallest line leans to one side; the hero mostly sits on the other, now and
  // then under it; the accent answers the hero across the bottle, the foliage keeps the hero company.
  const side = r() < 0.5 ? -1 : 1;
  const heroSide = r() < 0.75 ? -side : side;
  const mouth = v.top, room = mouth - TOP;
  const zone: Record<string, () => Pt> = {
    shin: () => [AXIS + side * between(20, 150), TOP + between(0, 110)],
    soe: () => [AXIS - side * between(110, 210), mouth - room * between(0.45, 0.7)],
    hero: () => [AXIS + heroSide * between(20, 90), mouth - between(110, 200)],
    accent: () => [AXIS - heroSide * between(140, 220), mouth - room * between(0.3, 0.55)],
    foliage: () => [AXIS + heroSide * between(160, 240), mouth - room * between(0.38, 0.6)],
    filler: () => [AXIS - heroSide * between(180, 260), mouth - between(100, 200)],
  };

  // An accent answers the hero from another hue: one whose colours sit near the hero's is passed over
  // while another is to be had, so a vase never holds two flowers of one red.
  const middle = (h: Hue) => (h.from + h.to) / 2;
  const apart = (a: Hue, b: Hue) => Math.abs((((middle(a) - middle(b)) % 360) + 540) % 360 - 180) >= 60;
  let hero: Plant | undefined;
  const chosen = PARTS.slice(0, capacity).flatMap(({ role, name }) => {
    let kinds = garden.plants.filter((p) => p.role === role);
    const h = hero;
    if (role === "accent" && h) {
      const far = kinds.filter((p) => apart(p.hue, h.hue));
      if (far.length) kinds = far;
    }
    if (!kinds.length) return [];
    const plant = pick(kinds);
    if (role === "hero") hero = plant;
    return [{ name, plant, head: zone[name]() }];
  });

  // Places in the mouth, left to right, in the order the heads stand.
  chosen.sort((a, b) => a.head[0] - b.head[0]);
  const entry = mouth - PEN * 3.4;
  const span = Math.min(v.mouth, chosen.length * PEN * 0.9);
  const stems = chosen.map(({ name, plant, head }, i) => {
    const slot = chosen.length === 1 ? AXIS : AXIS - span + (2 * span * i) / (chosen.length - 1);
    // a head too low for its diagonal is drawn in toward its place, never under it
    let [hx, hy] = head;
    const reach = entry - hy;
    if (Math.abs(hx - slot) > reach) hx = slot + Math.sign(hx - slot) * reach;
    const dx = hx - slot, drop = entry - Math.abs(dx) - hy;
    const p = path([hx, hy], ["s", drop], [dx > 0 ? "sw" : "se", Math.abs(dx) * Math.SQRT2], ["s", FOOT - PEN * 1.6 - entry]);
    return { name, plant, path: p };
  });

  // Above the mouth, and below it.
  const split = (ps: Pt[]): [Pt[], Pt[]] => {
    const at = ps.findIndex((p) => p[1] >= mouth);
    const [ax, ay] = ps[at - 1], [bx, by] = ps[at];
    const cut: Pt = [ax + ((bx - ax) * (mouth - ay)) / (by - ay), mouth];
    return [[...ps.slice(0, at), cut], [cut, ...ps.slice(at)]];
  };
  const brokens = ["-5 .1 -12 .1 .1", "-14 .1 -6", "-3 .1 .1 -15", "-9 .1 -9", "-12 .1 .1 -4", "-6  -12"];
  const submerged: Submerged[] = stems.map((s, i) => ({
    path: split(s.path)[1],
    color: s.plant.role === "line" ? "--ml-line" : "--ml-stem",
    broken: brokens[(i + seed) % brokens.length],
  }));

  // Back to front above the mouth: lines, then foliage and filler, the accent, and the hero last.
  const order: Role[] = ["line", "foliage", "filler", "accent", "hero"];
  const back: string[] = [], front: string[] = [];
  for (const role of order) {
    for (const s of stems.filter((x) => x.plant.role === role)) {
      const above = split(s.path)[0];
      if (role !== "line") front.push(line(above, "--ml-stem", role === "hero" ? PEN * 1.2 : PEN));
      const drawn = s.plant.draw(above, r);
      back.push(...(drawn.back ?? []));
      front.push(...(drawn.front ?? []));
    }
  }

  const of = (role: Role, fallback: Hue): Hue => stems.find((s) => s.plant.role === role)?.plant.hue ?? fallback;
  const hints: Hints = {
    hero: of("hero", { from: 0, to: 30, chroma: 0.1 }),
    accent: of("accent", { from: 40, to: 80, chroma: 0.15 }),
    filler: of("filler", { from: 0, to: 0, chroma: 0 }),
    foliage: of("foliage", { from: 0, to: 0, chroma: 0 }),
    line: of("line", { from: 60, to: 80, chroma: 0.06 }),
  };

  return {
    garden, bottle, half: BOTTLES[bottle], water, plants: stems.map((s) => s.plant), hints, pivot: [AXIS, mouth],
    layers: {
      ground: ground(v.left - PEN, v.right + PEN, v.bottom, GROUND),
      ...glass(v, submerged, `ml${seed}`),
      "bouquet-back": back,
      bouquet: front,
    },
  };
}

/** Paint order of a card's layers. */
export const ORDER = ["ground", "glass-back", "submerged", "water", "surface", "inside", "glass-front", "bouquet-back", "bouquet"];

/** An arrangement as an SVG card. */
export function svg(a: Arrangement, label = describe(a)): string {
  const groups = ORDER.filter((k) => a.layers[k]?.length).map((k) => `<g data-layer="${k}">${a.layers[k].join("")}</g>`);
  return `<svg class="ml-card" data-foot="${FOOT}" data-pivot="${a.pivot.join(" ")}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">${groups.join("")}</svg>`;
}

/** Words for what a card shows, for those who cannot see it. */
export function describe(a: Arrangement): string {
  const names = [...new Set(a.plants.map((p) => p.name.toLowerCase()))];
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  return `${list[0].toUpperCase()}${list.slice(1)} in a glass ${a.bottle}, from ${a.garden.name}`;
}
