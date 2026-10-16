// The sea floor and what lives there, in the Footers' crayon (footers/crayon/), drawn when the page is built. The
// page lays them under the water, so the water's colour lies over them as it lies over the numerals.
//
// What moves is drawn in parts the page can move: a frond in segments, one inside the next, each turned at its
// joint; a fish with its tail apart, to beat; a crab with its legs apart, to scuttle. Colours are crayon names
// (class="k-<name>"); the page says what each one is, by day and by night.

import { Hand } from "../footers/crayon/hand.ts";
import { Sheet, circle, coloured, leaf } from "../footers/crayon/shapes.ts";
import { catmull, type Pt } from "../footers/lib/geometry.ts";
import { f } from "../footers/lib/number.ts";

let sheets = 0;
const sheet = (name: string) => new Sheet(`fl-${name}-${sheets++}-`);
const svg = (s: Sheet, viewBox: string, body: string, attrs = "") =>
  `<svg class="wax" viewBox="${viewBox}" ${attrs} aria-hidden="true"><defs>${s.defs()}</defs>${body}</svg>`;

// ——— The floor ———
//
// A strip of sand 2400 wide and 200 deep, its top a slow swell, laid along the foot of the window and cut to its
// width. Sand coloured in two passes, ripples raked across it, pebbles, shells, a starfish and a sunk bottle.

export function floor(seed = 4040): string {
  const s = sheet("floor");
  const h = new Hand(seed);
  const rng = h.rng;
  const W = 2400, H = 200;
  const top = (x: number) => 64 + 14 * Math.sin(x / 260 + 0.6) + 8 * Math.sin(x / 97 + 2.1);
  const edge: Pt[] = [];
  for (let x = -20; x <= W + 20; x += 40) edge.push([x, top(x)]);
  const sand: Pt[] = [...edge, [W + 20, H + 20], [-20, H + 20]];
  const out: string[] = [];
  out.push(coloured(s, h, sand, "wheat", { edge: "", angle: -8 }));
  h.fill(sand.map(([x, y]) => [x, y + 30] as Pt), "ochre", { angle: 12, spacing: 16, alpha: [0.2, 0.4], secs: 0.4 });
  out.push(`<g clip-path="${s.clip(`M${sand.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`)}">${h.take()}</g>`);
  h.line(edge, "ochre", { width: 5, n: 3, weight: [1.4, 2.4], alpha: [0.5, 0.8], secs: 0.5 });
  out.push(h.take());

  // Ripples: short arcs raked across, in rows that follow the swell.
  for (let x = 30; x < W; x += rng.uniform(60, 120)) {
    const y = top(x) + rng.uniform(26, 120);
    const w = rng.uniform(40, 90);
    h.stroke(catmull([[x, y], [x + w * 0.5, y - rng.uniform(4, 8)], [x + w, y]], 6), rng.random() < 0.7 ? "ochre" : "rust", {
      width: 3, n: 2, weight: [1, 1.8], alpha: [0.25, 0.5], secs: 0.08,
    });
  }
  out.push(h.take());

  // Pebbles, in a few greys, outlined.
  for (let k = 0; k < 46; k++) {
    const x = rng.uniform(20, W - 20), r = rng.uniform(5, 13);
    const y = top(x) + rng.uniform(r + 6, 150);
    const pts = circle(x, y, r, 8).map(([px, py]) => [px + rng.uniform(-1.5, 1.5), py + (py - y) * -0.25] as Pt);
    out.push(coloured(s, h, pts, rng.choice(["mist", "cloud", "sage", "graphite"]), { edge: "graphite", edgeWidth: 2, edgeAlpha: [0.3, 0.6], stagger: 0.02 }));
  }

  // Shells: a few whorls, and a cockle or two.
  for (const x of [380, 1150, 1720, 2210]) {
    const y = top(x) + rng.uniform(40, 90);
    h.spiral(x, y, rng.uniform(9, 14), rng.choice(["pink", "rust"]), { turns: 3.2, width: 4, n: 3, weight: [1.2, 2], squash: 0.75, secs: 0.12 });
  }
  for (const x of [760, 1960]) {
    const y = top(x) + rng.uniform(50, 100), r = 13;
    const cockle: Pt[] = [[x - r, y + 4], [x - r * 0.8, y - r * 0.6], [x, y - r], [x + r * 0.8, y - r * 0.6], [x + r, y + 4], [x, y + 7]];
    out.push(coloured(s, h, cockle, "pink", { edge: "maroon", edgeWidth: 2, stagger: 0.02 }));
    for (let k = -2; k <= 2; k++) h.stroke([[x + k * 2, y + 6], [x + k * 5, y - r * 0.85]], "maroon", { width: 1.5, n: 1, weight: [0.8, 1.2], alpha: [0.35, 0.6], secs: 0.03 });
  }
  out.push(h.take());

  // A starfish, five arms a little curled.
  {
    const [cx, cy] = [1450, top(1450) + 70];
    const star: Pt[] = [];
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5 + 0.2;
      const r = k % 2 ? 9 : rng.uniform(22, 27);
      star.push([cx + r * Math.cos(a + (k % 2 ? 0 : 0.08)), cy + r * Math.sin(a) * 0.8]);
    }
    out.push(coloured(s, h, star, "rust", { edge: "maroon", edgeWidth: 2.5, shade: "red", shadeAt: [cx, cy, 8] }));
    for (let k = 0; k < 14; k++) {
      const a = rng.uniform(0, 6.28), r = rng.uniform(3, 16);
      h.stroke([[cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.8], [cx + r * Math.cos(a) + 1, cy + r * Math.sin(a) * 0.8 + 1]], "ochre", { width: 2, n: 1, weight: [1.6, 2.4], secs: 0.01 });
    }
    out.push(h.take());
  }

  // A bottle, sunk on its side, half in the sand: whatever this address once held.
  {
    const [bx, by] = [560, top(560) + 34];
    const body: Pt[] = [[bx - 70, by - 16], [bx + 20, by - 18], [bx + 40, by - 8], [bx + 66, by - 7], [bx + 70, by - 3], [bx + 70, by + 5], [bx + 66, by + 9], [bx + 40, by + 10], [bx + 20, by + 20], [bx - 70, by + 18], [bx - 74, by + 2]];
    out.push(coloured(s, h, body, "sage", { edge: "pine", edgeWidth: 3, shade: "green", shadeAt: [bx - 30, by + 10, 18], angle: 20 }));
    h.stroke(catmull([[bx - 60, by - 9], [bx - 10, by - 11], [bx + 16, by - 10]], 5), "#ffffff", { width: 3, n: 2, weight: [1.4, 2.2], alpha: [0.5, 0.8], secs: 0.1 });
    h.fill([[bx + 64, by - 7], [bx + 72, by - 5], [bx + 72, by + 5], [bx + 64, by + 7]], "rust", { spacing: 4, width: 4, secs: 0.05 });
    // A scrap of the page inside, rolled.
    out.push(coloured(s, h, [[bx - 50, by - 6], [bx - 4, by - 7], [bx - 2, by + 6], [bx - 50, by + 7]], "wheat", { edge: "ochre", edgeWidth: 1.5, stagger: 0.02 }));
    // And the sand over its foot.
    const drift: Pt[] = [[bx - 90, by + 22], [bx - 40, by + 8], [bx + 10, by + 14], [bx + 60, by + 12], [bx + 100, by + 24], [bx + 90, by + 40], [bx - 80, by + 40]];
    out.push(coloured(s, h, drift, "wheat", { edge: "", angle: -10 }));
  }
  return svg(s, `0 0 ${W} ${H}`, out.join("\n"), 'preserveAspectRatio="xMidYMax slice"');
}

// ——— Fronds ———
//
// A frond stands from the floor in segments, each drawn upright in its own group, the next inside it: the page
// turns each group about its joint, so the frond bends along its length as the water pushes it. The drawing's
// origin is the frond's foot; its joints lie straight up at the heights in data-joints.

export type Kind = "kelp" | "grass" | "fan";

export function frond(kind: Kind, height: number, seed: number): string {
  const s = sheet(kind);
  const h = new Hand(seed);
  const rng = h.rng;
  const n = kind === "fan" ? 2 : 4;
  const joints = Array.from({ length: n }, (_, k) => (height * k) / n);
  const parts: string[] = [];
  for (let k = 0; k < n; k++) {
    const y0 = -joints[k], y1 = -(joints[k] + height / n);
    const sway = (y: number) => 5 * Math.sin(y / 37 + seed);
    let body = "";
    if (kind === "kelp") {
      h.stroke(catmull([[sway(y0), y0], [sway((y0 + y1) / 2), (y0 + y1) / 2], [sway(y1), y1]], 6), "olive", { width: 6, n: 4, weight: [1.4, 2.4], secs: 0.2 });
      body += h.take();
      // Blades, alternating, longer low down.
      for (let b = 0; b < 2; b++) {
        const y = y0 + (y1 - y0) * (0.25 + b * 0.5);
        const side = (k * 2 + b) % 2 ? 1 : -1;
        const len = height * (0.3 - k * 0.04) * rng.uniform(0.8, 1.1);
        body += leaf(s, h, [sway(y), y], -Math.PI / 2 + side * rng.uniform(0.45, 0.75), len, len * 0.32, { fill: "green", second: "pine", bend: side * -0.12 });
      }
      if (k === n - 1) body += leaf(s, h, [sway(y1), y1], -Math.PI / 2 + rng.uniform(-0.15, 0.15), height * 0.22, height * 0.07, { fill: "olive", second: "pine" });
    } else if (kind === "grass") {
      // Three ribbons from one foot, each its own width.
      for (let r = 0; r < 3; r++) {
        const lean = (r - 1) * 9;
        const pts: Pt[] = [[lean * (k / n), y0], [lean * ((k + 0.5) / n) + sway(y0) * 0.6, (y0 + y1) / 2], [lean * ((k + 1) / n), y1]];
        h.stroke(catmull(pts, 6), r === 1 ? "green" : "sage", { width: 9 - k * 1.5, n: 4, weight: [1.4, 2.6], alpha: [0.6, 0.95], secs: 0.15 });
      }
      body += h.take();
    } else {
      // A sea fan: a stalk, then a lattice of branching twigs fanning out.
      h.stroke([[0, y0], [0, y1]], "maroon", { width: 7, n: 4, weight: [1.6, 2.6], secs: 0.15 });
      const twigs = k === 0 ? 3 : 9;
      for (let t = 0; t < twigs; t++) {
        const a = -Math.PI / 2 + ((t / Math.max(1, twigs - 1)) - 0.5) * (k === 0 ? 0.9 : 2.0);
        const len = height * (k === 0 ? 0.25 : 0.42) * rng.uniform(0.75, 1.05);
        const [ex, ey] = [Math.cos(a) * len, y1 + Math.sin(a) * len * 0.9];
        h.stroke(catmull([[0, y1 + 6], [ex * 0.5 + rng.uniform(-6, 6), (y1 + ey) / 2], [ex, ey]], 5), t % 3 ? "red" : "pink", { width: 4, n: 3, weight: [1, 2], secs: 0.08 });
        for (let c = 0; c < 2; c++) {
          const u = rng.uniform(0.4, 0.8);
          const [px, py] = [ex * u, y1 + (ey - y1) * u];
          h.stroke([[px, py], [px + rng.uniform(-14, 14), py - rng.uniform(8, 18)]], "pink", { width: 2.5, n: 2, weight: [0.8, 1.5], alpha: [0.5, 0.85], secs: 0.04 });
        }
      }
      body += h.take();
    }
    parts.push(body);
  }
  // Each segment's group holds the next, so a turn at a joint carries everything above it.
  let nested = "";
  for (let k = n - 1; k >= 0; k--) nested = `<g class="seg" data-y="${f(-joints[k])}">${parts[k]}${nested}</g>`;
  const w = height * 0.9;
  return svg(s, `${f(-w / 2)} ${f(-height * 1.15)} ${f(w)} ${f(height * 1.15 + 6)}`, nested, `data-kind="${kind}" data-height="${height}" style="overflow:visible"`);
}

// ——— Fish ———
//
// Side on, facing right, the body about its middle: a body coloured and outlined, a stripe or two, an eye, fins,
// and the tail in a group of its own, about its root, to beat.

export type Fish = "tang" | "clown" | "silver" | "puffer";

export function fish(kind: Fish, length: number, seed: number): string {
  const s = sheet(kind);
  const h = new Hand(seed);
  const L = length, T = kind === "puffer" ? 0.62 : kind === "silver" ? 0.3 : 0.42; // thickness, of length
  const body: Pt[] = [];
  for (let k = 0; k <= 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    // Blunt at the head (right), drawn in at the tail (left).
    const x = Math.cos(a) * L * 0.42 + (Math.cos(a) < 0 ? Math.cos(a) * L * 0.04 : 0);
    const y = Math.sin(a) * L * T * 0.5 * (Math.cos(a) < 0 ? 0.6 + 0.4 * (1 + Math.cos(a)) : 1);
    body.push([x, y]);
  }
  const colours: Record<Fish, [string, string, string]> = {
    tang: ["blue", "deep", "ochre"],
    clown: ["rust", "maroon", "ochre"],
    silver: ["cloud", "mist", "mist"],
    puffer: ["wheat", "ochre", "olive"],
  };
  const [fill, edge, fin] = colours[kind];
  const out: string[] = [];
  // Fins under the body: top and bottom.
  const dorsal: Pt[] = [[-L * 0.12, -L * T * 0.42], [L * 0.02, -L * T * 0.85], [L * 0.16, -L * T * 0.45]];
  const belly: Pt[] = [[-L * 0.05, L * T * 0.42], [L * 0.06, L * T * 0.75], [L * 0.14, L * T * 0.42]];
  out.push(coloured(s, h, dorsal, fin, { edge, edgeWidth: 2, stagger: 0.02 }));
  out.push(coloured(s, h, belly, fin, { edge, edgeWidth: 2, stagger: 0.02 }));
  // Over the colour: a clown's two white bands, a tang's dark sweep, a puffer's spots, a silver's bright line.
  if (kind === "clown")
    for (const x of [-0.16, 0.12]) h.fill([[L * x - 5, -L], [L * x + 5, -L], [L * x + 5, L], [L * x - 5, L]], "#ffffff", { spacing: 4, width: 6, alpha: [0.7, 1], secs: 0.08 });
  else if (kind === "tang") h.stroke(catmull([[-L * 0.3, -L * 0.04], [-L * 0.05, -L * 0.1], [L * 0.2, -L * 0.03]], 5), "deep", { width: 6, n: 4, alpha: [0.5, 0.8], secs: 0.1 });
  else if (kind === "puffer")
    for (let k = 0; k < 14; k++) {
      const [x, y] = [h.rng.uniform(-L * 0.3, L * 0.3), h.rng.uniform(-L * T * 0.35, L * T * 0.35)];
      h.stroke([[x, y], [x + 1, y + 1]], "olive", { width: 3, n: 1, weight: [2.4, 3.2], alpha: [0.5, 0.8], secs: 0.01 });
    }
  else h.stroke(catmull([[-L * 0.36, 0], [0, -L * 0.02], [L * 0.32, 0]], 5), "#ffffff", { width: 4, n: 2, alpha: [0.5, 0.8], secs: 0.1 });
  const stripes = h.take();
  out.push(coloured(s, h, body, fill, { edge, edgeWidth: 3, angle: -20, extra: stripes }));
  // The eye, and the gill's curve.
  h.spiral(L * 0.28, -L * T * 0.08, Math.max(2.5, L * 0.04), "graphite", { turns: 3, width: 3, n: 2, weight: [1.4, 2.2], secs: 0.05 });
  h.stroke(catmull([[L * 0.14, -L * T * 0.3], [L * 0.1, 0], [L * 0.14, L * T * 0.3]], 5), edge, { width: 2, n: 2, weight: [1, 1.6], alpha: [0.4, 0.7], secs: 0.05 });
  out.push(h.take());
  // The tail, about its root at the body's end.
  const root = -L * 0.44;
  const tail: Pt[] = [[root + 2, 0], [root - L * 0.2, -L * T * 0.55], [root - L * 0.16, 0], [root - L * 0.2, L * T * 0.55]];
  const tailArt = coloured(s, h, tail, fin, { edge, edgeWidth: 2 });
  const W = L * 1.3, Ht = L * Math.max(0.9, T * 1.8);
  return svg(
    s,
    `${f(-W / 2 - L * 0.1)} ${f(-Ht / 2)} ${f(W)} ${f(Ht)}`,
    `<g class="tail" data-x="${f(root)}">${tailArt}</g>${out.join("\n")}`,
    `data-kind="${kind}" data-length="${L}" style="overflow:visible"`,
  );
}

// ——— A crab ———
//
// Seen from in front, about the middle of its back: a shell, two eyes on stalks, two claws, and four legs a side,
// each side a group the page can lift in turn as it walks.

export function crab(size: number, seed: number): string {
  const s = sheet("crab");
  const h = new Hand(seed);
  const r = size / 2;
  const legs = (side: number) => {
    for (let k = 0; k < 4; k++) {
      const x0 = side * r * (0.55 + k * 0.08), y0 = r * 0.05 + k * r * 0.1;
      const knee: Pt = [side * r * (1.05 + k * 0.12), y0 - r * 0.25 + k * r * 0.05];
      const foot: Pt = [side * r * (1.2 + k * 0.14), y0 + r * 0.45];
      h.stroke(catmull([[x0, y0], knee, foot], 4), "rust", { width: 4, n: 3, weight: [1.2, 2.2], secs: 0.05 });
    }
    return h.take();
  };
  const left = legs(-1), right = legs(1);
  const out: string[] = [];
  // Claws on arms.
  for (const side of [-1, 1]) {
    h.stroke(catmull([[side * r * 0.5, -r * 0.15], [side * r * 0.85, -r * 0.55], [side * r * 0.75, -r * 0.85]], 4), "rust", { width: 5, n: 3, secs: 0.06 });
    out.push(h.take());
    const [cx, cy] = [side * r * 0.72, -r * 0.98];
    const claw: Pt[] = [[cx - r * 0.18, cy + r * 0.12], [cx - r * 0.2, cy - r * 0.12], [cx - r * 0.02, cy - r * 0.3], [cx + side * 0.0 + r * 0.04, cy - r * 0.12], [cx + r * 0.2, cy - r * 0.2], [cx + r * 0.18, cy + r * 0.1]];
    out.push(coloured(s, h, claw, "red", { edge: "maroon", edgeWidth: 2.5 }));
  }
  const shell: Pt[] = [];
  for (let k = 0; k <= 14; k++) {
    const a = Math.PI + (k / 14) * Math.PI;
    shell.push([Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.5 + r * 0.05]);
  }
  shell.push([r * 0.6, r * 0.28], [-r * 0.6, r * 0.28]);
  out.push(coloured(s, h, shell, "red", { edge: "maroon", edgeWidth: 3, shade: "maroon", shadeAt: [0, r * 0.15, r * 0.35] }));
  for (const side of [-1, 1]) {
    h.stroke([[side * r * 0.18, -r * 0.35], [side * r * 0.24, -r * 0.62]], "maroon", { width: 3, n: 2, weight: [1.2, 1.8], secs: 0.03 });
    h.spiral(side * r * 0.25, -r * 0.66, Math.max(2.5, r * 0.08), "graphite", { turns: 3, width: 3, n: 2, secs: 0.03 });
  }
  out.push(h.take());
  return svg(
    s,
    `${f(-r * 1.6)} ${f(-r * 1.4)} ${f(r * 3.2)} ${f(r * 2)}`,
    `<g class="legs" data-side="-1">${left}</g><g class="legs" data-side="1">${right}</g>${out.join("\n")}`,
    `data-size="${size}" style="overflow:visible"`,
  );
}

// Everything the page shows, by the name of its hole.
export function sea(): Record<string, string> {
  // Each frond with where it stands, as a share of the window's width: in clumps toward the sides, where the
  // numerals are not, a few nearer the middle and low.
  const fronds: [string, number][] = [
    [frond("kelp", 300, 11), 0.05],
    [frond("grass", 150, 12), 0.1],
    [frond("fan", 120, 13), 0.17],
    [frond("grass", 110, 17), 0.36],
    [frond("fan", 90, 18), 0.6],
    [frond("kelp", 230, 14), 0.8],
    [frond("grass", 190, 15), 0.87],
    [frond("kelp", 340, 16), 0.94],
  ];
  const fishes = [fish("tang", 78, 21), fish("clown", 58, 22), fish("silver", 66, 23), fish("silver", 52, 24), fish("puffer", 54, 25)];
  return {
    FLOOR: floor(),
    FRONDS: fronds.map(([d, at]) => `<div class="frond" style="--at:${at}">${d}</div>`).join("\n"),
    FISH: fishes.map((d) => `<div class="fish">${d}</div>`).join("\n"),
    CRAB: `<div class="crab">${crab(56, 31)}</div>`,
  };
}
