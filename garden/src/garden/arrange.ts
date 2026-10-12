import { FIELDS } from "./fields";
import PLANTS from "./plants.json";

// Spaces the garden out. CSS places each plant where the composition wants it, and this slides
// each one along the edge it grows in from, and lets it retreat a little into that edge, so
// plants cover each other as little as possible while staying near their places. A plant
// still mostly covered after that is left out (and never fetched), least important first.
// Work happens on a coarse grid of the viewport, once per layout, and costs no painting.

// Each plant's rank in plants.json: the plants that carry the composition (rank 1 first) stay
// when space runs out.
const RANK = new Map(PLANTS.map((plant) => [plant.name, plant.rank]));
const SLIDE = 0.12; // how far a plant may slide along its edge, as a share of that edge
const RETREAT = 0.06; // how far it may sink into its edge, as a share of the shorter side
const STAY = 0.08; // the pull back to the composed place: a full slide costs this share of the plant
const OFFSCREEN = 0.6; // a cell pushed off screen costs this much against a covered cell
const CROWDED = 0.5; // a plant with more than this share of itself covered is left out

type Item = { bed: HTMLElement; cells: Int32Array; along: "x" | "y"; out: number; top: number; dx: number; dy: number; rank: number };

export function arrange(beds: HTMLElement[]) {
  for (const bed of beds) {
    delete bed.dataset.crowded;
    bed.style.removeProperty("--dx");
    bed.style.removeProperty("--dy");
    // Spaced out where it settles, not where it enters from.
    bed.style.removeProperty("transform");
  }
  const vw = innerWidth;
  const vh = innerHeight;
  const water = document.querySelector<HTMLElement>(".garden .water")?.offsetHeight ?? 0;
  const waterY = vh - water;
  const c = Math.max(8, Math.round(Math.min(vw, vh) / 64));
  const W = Math.ceil(vw / c);
  const H = Math.ceil(vh / c);
  const waterRow = water ? Math.floor(waterY / c) : H;
  const count = new Uint8Array(W * H);

  const items: Item[] = [];
  for (const bed of beds) {
    const field = FIELDS[bed.dataset.plant!];
    const style = getComputedStyle(bed);
    if (!field || style.display === "none") continue;
    const r = bed.getBoundingClientRect();
    const left = parseFloat(style.left);
    const top = parseFloat(style.top);
    const side = left <= 1 ? -1 : left >= vw - 1 ? 1 : 0;
    items.push({
      bed,
      cells: footprint(field, r, style.getPropertyValue("--flip").trim() === "-1", c),
      along: side ? "y" : "x",
      out: side || (top <= 1 ? -1 : 1),
      top,
      dx: 0,
      dy: 0,
      rank: RANK.get(bed.dataset.plant!) ?? 99,
    });
  }
  items.forEach((it) => stamp(it, 1));

  const solve = () => {
    for (let pass = 0; pass < 3; pass++)
      for (const it of items) {
        stamp(it, -1);
        const span = Math.round(SLIDE * (it.along === "y" ? H : W));
        const back = Math.round(RETREAT * Math.min(W, H));
        let best = Infinity;
        for (let s = -span; s <= span; s++)
          for (let p = 0; p <= back; p++) {
            const dx = it.along === "y" ? it.out * p : s;
            const dy = it.along === "y" ? s : it.out * p;
            if (water && (it.top >= waterY ? it.top + dy * c < waterY : it.top + dy * c > waterY)) continue;
            const n = it.cells.length / 2;
            const cost = cover(it, dx, dy) + STAY * n * ((s * s) / (span * span || 1) + (p * p) / (back * back || 1));
            if (cost < best) [best, it.dx, it.dy] = [cost, dx, dy];
          }
        stamp(it, 1);
      }
  };
  solve();
  // Leave out plants that are still mostly covered, least important first, then settle again.
  const byRank = [...items].sort((a, b) => b.rank - a.rank);
  let dropped = false;
  for (const it of byRank) {
    stamp(it, -1);
    const [covered, shown] = share(it);
    if (shown && covered / shown > CROWDED) {
      it.bed.dataset.crowded = "";
      items.splice(items.indexOf(it), 1);
      dropped = true;
    } else stamp(it, 1);
  }
  if (dropped) solve();
  for (const it of items) {
    it.bed.style.setProperty("--dx", `${it.dx * c}px`);
    it.bed.style.setProperty("--dy", `${it.dy * c}px`);
  }

  function stamp(it: Item, k: number) {
    const { cells, dx, dy } = it;
    for (let i = 0; i < cells.length; i += 2) {
      const x = cells[i] + dx;
      const y = cells[i + 1] + dy;
      if (x >= 0 && y >= 0 && x < W && y < H) count[y * W + x] += k;
    }
  }
  function cover(it: Item, dx: number, dy: number) {
    let cost = 0;
    const { cells } = it;
    for (let i = 0; i < cells.length; i += 2) {
      const x = cells[i] + dx;
      const y = cells[i + 1] + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) cost += OFFSCREEN;
      else cost += y >= waterRow ? count[y * W + x] * 0.25 : count[y * W + x];
    }
    return cost;
  }
  function share(it: Item) {
    let covered = 0;
    let shown = 0;
    for (let i = 0; i < it.cells.length; i += 2) {
      const x = it.cells[i] + it.dx;
      const y = it.cells[i + 1] + it.dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      shown++;
      if (count[y * W + x]) covered++;
    }
    return [covered, shown];
  }
}

// The viewport cells a plant paints, as x, y pairs, from its field and its on-screen box.
function footprint([cols, rows, hex]: [number, number, string], r: DOMRect, flip: boolean, c: number) {
  const seen = new Set<number>();
  const out: number[] = [];
  const cw = r.width / cols;
  const ch = r.height / rows;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      if (!((parseInt(hex[k >> 2], 16) >> (3 - (k & 3))) & 1)) continue;
      const x0 = r.left + (flip ? cols - 1 - i : i) * cw;
      const y0 = r.top + j * ch;
      for (let y = Math.floor(y0 / c); y <= Math.floor((y0 + ch - 1) / c); y++)
        for (let x = Math.floor(x0 / c); x <= Math.floor((x0 + cw - 1) / c); x++) {
          const key = (y + 2048) * 4096 + (x + 2048);
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(x, y);
        }
    }
  return Int32Array.from(out);
}
