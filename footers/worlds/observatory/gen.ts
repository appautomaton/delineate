// Observatory: one sheet of a set of working drawings. Section A-A through the observatory, a plan at the
// observing floor, and Detail B of the dome drive, with levels, dimensions, a keyed schedule, notes and the
// title block, as an architect's office would issue it.
//
// Technical pen on gridded drafting film by day; a cyanotype by night. Every line has a weight and a job: thick
// for cut edges, medium for what is seen beyond, thin for dimensions and leaders, chain for centre lines, dashes
// for construction. Every material cut through carries its own section symbol: brick, block, insulation,
// concrete, hardcore, earth, steel, timber.
//
// Generated here: the geometry of dome, mount and refractor; gears with real teeth; the hatching symbols that
// are drawn rather than patterned; the plan; the detail; and all the lettering's positions.

import type { Pt } from "../../lib/geometry.ts";
import { f, fixed, hypot } from "../../lib/number.ts";
import { Random } from "../../lib/random.ts";
import { dataUri, tile } from "../../lib/svg.ts";

const GL = 520; // ground level
const DOME: Pt = [800, 368]; // centre of the dome's sphere, on the spring line
const [R_OUT, R_IN] = [182, 174];
const FFL = 430; // observing floor
const DEC: Pt = [836, 362]; // declination axis: the telescope turns about it
const PLAN: Pt = [330, 424]; // centre of the plan
const DET: Pt = [1286, 330]; // centre of Detail B
const DET_R = 86;
const TAU = 2 * Math.PI;

const radians = (degrees: number) => degrees * (Math.PI / 180);
const pts = (points: readonly Pt[]) => "M" + points.map(([x, y]) => `${f(x)} ${f(y)}`).join("L");
const closed = (points: readonly Pt[]) => pts(points) + "Z";
const circle = (cx: number, cy: number, r: number) =>
  `M${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}Z`;
const rect = (x: number, y: number, w: number, h: number) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;

// Points on a circle from angle a0 to a1 in degrees, y down, `steps` spans apart.
const arcPoints = (cx: number, cy: number, r: number, a0: number, a1: number, steps: number): Pt[] =>
  Array.from({ length: steps + 1 }, (_, k) => {
    const a = radians(a0 + ((a1 - a0) * k) / steps);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, steps = 48) => pts(arcPoints(cx, cy, r, a0, a1, steps));

// A ring between radii r0 and r1 from a0 to a1, cut through: the outer arc out, the inner arc back.
const band = (cx: number, cy: number, r0: number, r1: number, a0: number, a1: number, n: number) =>
  closed([...arcPoints(cx, cy, r1, a0, a1, n), ...arcPoints(cx, cy, r0, a1, a0, n)]);

function rotated(points: readonly Pt[], cx: number, cy: number, deg: number): Pt[] {
  const a = radians(deg);
  return points.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
}

// A spur gear: a ring of trapezoid teeth round a root circle, with a bore, spokes and pitch circle.
type Gear = { body: string; bore: string; spokes: string; pitch: string };
function gear(cx: number, cy: number, r: number, teeth: number, depth = r * 0.16): Gear {
  const outline: Pt[] = [];
  for (let k = 0; k < teeth; k++) {
    const a = (TAU * k) / teeth;
    const step = TAU / teeth;
    for (const [da, rr] of [[-0.25, r - depth], [-0.12, r], [0.12, r], [0.25, r - depth]]) {
      outline.push([cx + Math.cos(a + da * step) * rr, cy + Math.sin(a + da * step) * rr]);
    }
  }
  const spokes = [0, 1, 2, 3]
    .map((k) => (k * TAU) / 4 + 0.4)
    .map((a) => pts([[cx + Math.cos(a) * r * 0.22, cy + Math.sin(a) * r * 0.22], [cx + Math.cos(a) * (r - depth * 1.7), cy + Math.sin(a) * (r - depth * 1.7)]]))
    .join("");
  return { body: closed(outline), bore: circle(cx, cy, r * 0.18), spokes, pitch: circle(cx, cy, r - depth / 2) };
}

// ---------------------------------------------------------------------------------------------------------
// Section A-A: the building, cut.

// One side of the dome's shell, cut through.
const shell = (a0: number, a1: number) => band(DOME[0], DOME[1], R_IN, R_OUT, a0, a1, 40);

// Insulation in a cavity, drawn as its section symbol: a tight zigzag.
function insulation(x0: number, x1: number, y0: number, y1: number): string {
  const w = x1 - x0;
  const out: Pt[] = [];
  for (let y = y0, k = 0; y < y1; y += w * 0.9, k++) out.push([k % 2 === 0 ? x0 : x1, y]);
  return pts(out);
}

// The observing floor: boards on joists, each joist cut and crossed, as timber is shown in section.
function timberFloor(x0: number, x1: number): [string, string, string] {
  const joists: string[] = [];
  const crosses: string[] = [];
  for (let x = x0 + 3; x + 5 < x1 - 1; x += 21) {
    joists.push(rect(x, FFL + 2.6, 5, 7.4));
    crosses.push(`M${f(x)} ${f(FFL + 2.6)}l5 7.4M${f(x + 5)} ${f(FFL + 2.6)}l-5 7.4`);
  }
  return [rect(x0, FFL, x1 - x0, 2.6), joists.join(""), crosses.join("")];
}

// Section A-A: the cut materials with their section symbols, what is seen beyond, and the fine detail.
function building() {
  const [cx, cy] = DOME;
  const [cut, see, fine, con]: string[][] = [[], [], [], []];
  const fills: [string, string][] = [];

  // Walls: brick outer leaf, an insulated cavity, block inner leaf; footings below ground.
  for (const [[o0, o1], [c0, c1], [i0, i1]] of [[[616, 623], [623, 627], [627, 634]], [[977, 984], [973, 977], [966, 973]]]) {
    fills.push(["brick", rect(o0, 386, o1 - o0, 534 - 386)], ["block", rect(i0, 386, i1 - i0, 534 - 386)]);
    cut.push(rect(o0, 386, o1 - o0, 534 - 386) + rect(i0, 386, i1 - i0, 534 - 386));
    fine.push(insulation(c0, c1, 388, 532));
  }
  for (const x0 of [604, 954]) {
    fills.push(["concrete", rect(x0, 534, 42, 18)]);
    cut.push(rect(x0, 534, 42, 18));
  }
  // Ring beams, the rails on them, the bogies, and the dome's base ring riding on top.
  for (const x0 of [612, 960]) {
    fills.push(["concrete", rect(x0, 376, 28, 10)]);
    cut.push(rect(x0, 376, 28, 10));
    see.push(rect(x0 + 10, 374.4, 10, 1.6));
  }
  for (const wx of [627, 973]) see.push(circle(wx, 371, 3.2) + circle(wx, 371, 0.9));
  for (const x0 of [614, 960]) {
    fills.push(["steel", rect(x0, 362, 26, 5.4)]);
    cut.push(rect(x0, 362, 26, 5.4));
  }
  // Ground slab on hardcore, the pier through it with its isolation joints, the pier's pad.
  for (const [x0, x1] of [[634, 776], [824, 966]]) {
    fills.push(["concrete", rect(x0, 512, x1 - x0, 8)], ["hardcore", rect(x0, 520, x1 - x0, 10)]);
    cut.push(rect(x0, 512, x1 - x0, 8));
    fine.push(`M${f(x0)} 530H${f(x1)}`);
  }
  const pier = closed([[780, 404], [820, 404], [820, 540], [832, 540], [832, 556], [768, 556], [768, 540], [780, 540]]);
  fills.push(["concrete", pier]);
  cut.push(pier);
  fine.push("M777 512v18M823 512v18M777 430v10M823 430v10");
  see.push(rect(776, 400, 48, 4));
  fills.push(["steel", rect(776, 400, 48, 4)]);
  // The observing floor in two parts, either side of the pier, open where the stair comes up.
  for (const [x0, x1] of [[634, 650], [752, 776], [824, 966]]) {
    const [boards, joists, crosses] = timberFloor(x0, x1);
    cut.push(boards + joists);
    fine.push(crosses);
  }
  // The dome's shell, cut, with its slit; its ribs and purlins seen beyond.
  fills.push(["steel-light", shell(180, 263) + shell(277, 360)]);
  cut.push(shell(180, 263) + shell(277, 360));
  for (const th of [22, 46, 68]) {
    const c = Math.cos(radians(th));
    for (const side of [-1, 1]) {
      see.push(pts(Array.from({ length: 19 }, (_, j): Pt => {
        const b = (j * Math.PI) / 2 / 18;
        return [cx + side * R_IN * Math.cos(b) * c, cy - R_IN * Math.sin(b)];
      })));
    }
  }
  for (const b of [28, 52, 72]) {
    const r = R_IN * Math.cos(radians(b));
    con.push(`M${f(cx - r)} ${f(cy - R_IN * Math.sin(radians(b)))}H${f(cx + r)}`);
  }
  // Stair beyond: nine risers from the ground floor up to the landing, its stringer and handrail.
  const steps: Pt[] = [[656, 512]];
  for (let k = 0; k < 9; k++) {
    const [x, y] = steps.at(-1)!;
    steps.push([x, y - 74 / 9], [x + 94 / 9, y - 74 / 9]);
  }
  see.push(pts(steps));
  see.push("M650 520L752 444M660 494L752 420M660 494v18M752 420v18");
  for (let k = 1; k < 9; k++) fine.push(`M${f(660 + (92 * k) / 9)} ${f(494 - (74 * k) / 9)}v${f(18)}`);
  // A door on the ground floor and a window on the observing floor, seen beyond; a sidereal clock on the wall.
  see.push(rect(884, 470, 30, 42) + rect(888, 474, 22, 34));
  fine.push("M899 474v34M888 491h22M904 492h3");
  see.push(rect(680, 392, 36, 24) + "M698 392v24M680 404h36");
  see.push(circle(930, 398, 9));
  fine.push(Array.from({ length: 12 }, (_, k) => (k * TAU) / 12)
    .map((a) => `M${f(930 + Math.cos(a) * 7.4)} ${f(398 + Math.sin(a) * 7.4)}L${f(930 + Math.cos(a) * 9)} ${f(398 + Math.sin(a) * 9)}`)
    .join(""));
  // Centre lines and the plane of the cut.
  const centre = "M584 368H1016M800 186V560";
  return { fills, cut: cut.join(""), see: see.join(""), fine: fine.join(""), con: con.join(""), centre };
}

// ---------------------------------------------------------------------------------------------------------
// The mount and the refractor. Drawn inline, so the scroll can turn them.

// Local coordinates: the declination axis at the origin, the tube along +x, 22 off the axis.
function refractor() {
  const ty = -22;
  const fill = [
    rect(-40, ty - 10, 152, 20), // tube
    rect(112, ty - 11, 5, 22), // cell
    rect(117, ty - 12, 31, 24), // dew shield
    rect(14, ty - 12, 6, 24) + rect(78, ty - 12, 6, 24), // rings
    rect(8, ty + 10, 82, 3.6), // dovetail
    rect(-8, ty + 13.6, 24, 6), // saddle
    rect(-52, ty - 5.5, 12, 11), // focuser
    closed([[-62, ty - 6], [-52, ty - 6], [-52, ty + 6], [-62, ty + 6]]), // diagonal
    rect(-60, ty + 6, 6, 12), // eyepiece
    rect(22, ty - 26, 46, 7) + "M30 " + f(ty - 19) + "v7M60 " + f(ty - 19) + "v7", // finder
    rect(-9, 26, 18, 8) + rect(-9, 36, 18, 8), // counterweights
  ].join("");
  const shaft = rect(-2, 0, 4, 46);
  return { fill, lines: fill + shaft + `M-40 ${f(ty - 4)}H112M-40 ${f(ty + 4)}H112`, axis: `M-70 ${f(ty)}H212` };
}

// Everything that moves: Detail B's drive, the shutter, the telescope, its observer, the clock hand.
function mechanism(big: Gear, small: Gear, rackPath: string): string {
  const { fill, lines, axis } = refractor();
  const [dx, dy] = DEC;
  const housing = closed([[800, 404], [816, 404], [dx + 6, dy + 6], [dx - 6, dy - 8], [796, 396]]);
  return (
    // Detail B: the ring gear on the dome's base ring slides as the pinion turns it.
    '<g clip-path="url(#ob-detail-clip)">' +
    `<g class="ob-rack"><path class="ob-steelfill" d="${rect(DET[0] - 120, 300, 240, 16)}"/>` +
    `<path class="ob-cut" fill="none" d="${rect(DET[0] - 120, 300, 240, 16)}"/>` +
    `<path class="ob-seefill" d="${rackPath}"/><path class="ob-see" fill="none" d="${rackPath}"/></g>` +
    `<g class="ob-gear ob-gear--big"><path class="ob-seefill" d="${big.body}"/><path class="ob-see" fill="none" d="${big.body}${big.bore}"/>` +
    `<path class="ob-fine" fill="none" d="${big.spokes}"/><path class="ob-con" fill="none" d="${big.pitch}"/></g>` +
    `<g class="ob-gear ob-gear--small"><path class="ob-seefill" d="${small.body}"/><path class="ob-see" fill="none" d="${small.body}${small.bore}"/>` +
    `<path class="ob-con" fill="none" d="${small.pitch}"/></g>` +
    "</g>" +
    // The shutter, which slides down the shell to open the slit.
    `<g class="ob-shutter"><path class="ob-shutter-plate" fill="none" d="${arc(DOME[0], DOME[1], R_OUT + 5, 258, 282, 16)}"/></g>` +
    // The mount: a wedge on the pier head, the polar axis housing, the declination housing.
    `<path class="ob-seefill" d="${housing}"/><path class="ob-see" fill="none" d="${housing}"/>` +
    `<path class="ob-center" fill="none" d="M796 412L${f(dx + 64)} ${f(dy - 80)}"/>` +
    `<g class="ob-scope"><g class="ob-track"><g transform="translate(${dx} ${dy})">` +
    `<path class="ob-seefill" d="${fill}"/><path class="ob-see" fill="none" d="${lines}"/>` +
    `<path class="ob-center ob-sight" fill="none" d="${axis}"/></g></g></g>` +
    `<circle class="ob-seefill" cx="${dx}" cy="${dy}" r="8"/><path class="ob-see" fill="none" d="${circle(dx, dy, 8)}${circle(dx, dy, 2.6)}"/>` +
    // The observer, an architect's scale figure, seated on a stool and leaning to the eyepiece.
    '<g class="ob-observer">' +
    '<circle class="ob-see" fill="none" cx="850" cy="405" r="3.2"/>' +
    '<path class="ob-see" fill="none" d="M851 409L856 421L866 421L866 430M856 421L850 425M852 412L845 416"/>' +
    "</g>" +
    '<path class="ob-see" fill="none" d="M860 421h12M862 421l-2 9M870 421l2 9"/>' +
    // The sidereal clock's hand.
    '<g class="ob-hand"><path class="ob-see" fill="none" d="M930 398V391"/></g>'
  );
}

// Detail B, the dome drive at 1:5: the ring beam, the rail, a bogie wheel, the gearmotor, labelled.
function detailStatic(): string {
  const [x, y] = DET;
  const beam = closed([[x - 120, 356], [x + 10, 356], [x + 10, 440], [x - 120, 440]]);
  const rail = rect(x - 76, 348, 44, 8);
  const wheel = circle(x - 54, 335, 13) + circle(x - 54, 335, 4);
  const bogie = closed([[x - 74, 340], [x - 34, 340], [x - 30, 330], [x - 78, 330]]);
  const motor = rect(x + 44, 380, 30, 22) + rect(x + 74, 384, 8, 14);
  const bracket = closed([[x + 10, 356], [x + 44, 356], [x + 44, 404], [x + 10, 404]]);
  return (
    '<g clip-path="url(#ob-detail-clip)">' +
    `<path style="fill:var(--ob-concrete)" d="${beam}"/>` +
    `<path class="ob-steelfill" d="${rail}"/>` +
    `<path class="ob-cut" fill="none" d="${beam}${rail}"/>` +
    `<path class="ob-seefill" d="${bogie}${wheel}"/><path class="ob-see" fill="none" d="${bogie}${wheel}"/>` +
    `<path class="ob-see" fill="none" d="${bracket}${motor}"/>` +
    `<path class="ob-center" fill="none" d="M${x - 54} 314V356M${x - 72} 335H${x - 36}M${x + 32} 316V404"/>` +
    "</g>" +
    `<path class="ob-see" fill="none" d="${circle(x, y, DET_R)}"/>`
  );
}

// Plan at the observing floor, 1:100: the wall ring, the pier, the stair, the door, the line of the cut.
function plan(): Record<string, string> {
  const [cx, cy] = PLAN;
  const [ro, ri] = [92, 83];
  const [stairX0, stairX1, stairY] = [cx - 70, cx - 22, cy + 14];
  const treads = Array.from({ length: 10 }, (_, k) => `M${f(stairX0 + (k * (stairX1 - stairX0)) / 9)} ${f(stairY)}v12`).join("");
  const bogies = Array.from({ length: 8 }, (_, k) => (k * TAU) / 8 + 0.2)
    .map((a) => rect(cx + Math.cos(a) * 87.5 - 2, cy + Math.sin(a) * 87.5 - 2, 4, 4))
    .join("");
  return {
    walls: band(cx, cy, ri, ro, 100, 440, 60),
    cavity: arc(cx, cy, 87.5, 100, 440, 60),
    pier: rect(cx - 10, cy - 10, 20, 20),
    stair: rect(stairX0, stairY, stairX1 - stairX0, 12) + treads,
    arrow: `M${f(stairX0 + 4)} ${f(stairY + 6)}H${f(stairX1 - 6)}`,
    door: `M${f(cx - 8)} ${f(cy + ro)}a16 16 0 0 1 16 -16`,
    slit: `M${f(cx - 5)} ${f(cy)}V${f(cy - ri)}M${f(cx + 5)} ${f(cy)}V${f(cy - ri)}`,
    bogies,
    scope: closed(rotated([[cx - 2, cy - 3], [cx + 34, cy - 3], [cx + 34, cy + 3], [cx - 2, cy + 3]], cx, cy, -112)),
    cut: `M${f(cx - 122)} ${f(cy)}H${f(cx + 122)}`,
    dome: circle(cx, cy, 90),
    ends: `M${f(cx - 122)} ${f(cy - 8)}v16M${f(cx + 122)} ${f(cy - 8)}v16`,
    arrows: `M${f(cx - 122)} ${f(cy)}l0 -12M${f(cx + 122)} ${f(cy)}l0 -12`,
  };
}

// ---------------------------------------------------------------------------------------------------------
// The sky beyond, and the ground and its earth.

const CONSTELLATIONS: Pt[][] = [
  [[150, 196], [178, 178], [206, 198], [236, 180], [264, 196]], // Cassiopeia
  [[1388, 196], [1414, 188], [1440, 192], [1464, 202], [1474, 228], [1508, 234], [1514, 206], [1464, 202]], // The Plough
  [[1046, 178], [1066, 206], [1086, 236]], // Cygnus
  [[1040, 222], [1066, 206], [1094, 192]],
  [[772, 165], [784, 178], [792, 180], [788, 194], [796, 196], [792, 180]], // Lyra, with Vega
];

// The constellations' lines, and each star once, Vega larger.
function constellations(): [string, string] {
  const stars = CONSTELLATIONS.flat().map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${x === 772 && y === 165 ? 3 : 1.9}"/>`);
  return [CONSTELLATIONS.map(pts).join(""), [...new Set(stars)].join("")];
}

function skyStars(): string {
  const rng = new Random(44);
  const out: string[] = [];
  const placed: Pt[] = [];
  while (placed.length < 36) {
    const [x, y] = [rng.uniform(10, 1590), rng.uniform(10, 470)];
    if (placed.some(([px, py]) => hypot(x - px, y - py) < 80)) continue;
    placed.push([x, y]);
    out.push(`<circle class="ob-tw" cx="${f(x)}" cy="${f(y)}" r="${f(rng.choice([0.7, 0.9, 1.1]))}" style="--d:${fixed(rng.uniform(0, 4), 1)}s"/>`);
  }
  return out.join("");
}

// The section symbol for earth under the ground line: short diagonal strokes in little groups, left out under
// the building.
function earthHatch(): string {
  const rng = new Random(8);
  const out: string[] = [];
  for (let x = 548; x < 1052; x += rng.uniform(20, 30)) {
    if (!(600 < x && x < 1000)) for (let k = 0; k < 3; k++) out.push(`M${f(x + k * 4)} ${GL + 4}l-8 10`);
  }
  return out.join("");
}

// Drafting film's printed grid: a fine square, a heavier square every five.
function pageGrid(colour: string, minorAlpha: number, majorAlpha: number): string {
  const minor = [0, 1, 2, 3, 4].map((k) => `<path d='M${k * 12 + 0.5} 0V60M0 ${k * 12 + 0.5}H60'/>`).join("");
  return dataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'>" +
      `<g stroke='${colour}' stroke-opacity='${minorAlpha}' stroke-width='.6'>${minor}</g>` +
      `<path d='M.5 0V60M0 .5H60' stroke='${colour}' stroke-opacity='${majorAlpha}' stroke-width='.8'/></svg>`,
  );
}

// Cyanotype: the blue never lies flat; it gathers and thins where the sensitiser was brushed on.
const TEX_CYANO = tile(
  "<feTurbulence type='fractalNoise' baseFrequency='.012' numOctaves='4' seed='9' stitchTiles='stitch' result='n'/>" +
    "<feColorMatrix in='n' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 2.4 0 0 0 -1.1' result='lite'/>" +
    "<feColorMatrix in='n' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.4 0 0 0 1.3' result='dark'/>" +
    "<feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='1' seed='2' stitchTiles='stitch'/>" +
    "<feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 4 -2.9' result='spots'/>" +
    "<feMerge><feMergeNode in='lite'/><feMergeNode in='dark'/><feMergeNode in='spots'/></feMerge>",
  400,
  400,
);

// The ring gear's teeth along the base ring's underside, seen in Detail B.
function rack(): string {
  const [x0, x1, y] = [DET[0] - 140, DET[0] + 240, 316];
  const out: Pt[] = [[x0, y]];
  let x = x0;
  for (; x < x1; x += 7) out.push([x + 1.2, y], [x + 2.4, y + 5.6], [x + 4.6, y + 5.6], [x + 5.8, y]);
  out.push([x1, y], [x1, y - 2], [x0, y - 2]);
  return closed(out);
}

export function placeholders(): Record<string, string> {
  const big = gear(DET[0] + 32, 368, 24, 22);
  const small = gear(DET[0] + 32, 333, 11, 10);
  const { fills, cut, see, fine, con, centre } = building();
  const [constLines, constStars] = constellations();
  return {
    MECH: mechanism(big, small, rack()),
    FILLS: fills.map(([kind, d]) => `<path style="fill:var(--ob-${kind})" d="${d}"/>`).join(""),
    CUT: cut,
    SEE: see,
    FINE: fine,
    CON: con,
    CENTRE: centre,
    DETAIL: detailStatic(),
    CONST_LINES: constLines,
    CONST_STARS: constStars,
    STARS: skyStars(),
    EARTH: earthHatch(),
    TEX_GRID: pageGrid("#5E9DBC", 0.14, 0.28),
    TEX_GRID_NIGHT: pageGrid("#E8F1F8", 0.05, 0.1),
    TEX_CYANO,
    ENVELOPE: circle(DEC[0], DEC[1], 156),
    ...Object.fromEntries(Object.entries(plan()).map(([k, v]) => [`PLAN_${k.toUpperCase()}`, v])),
  };
}

// Scene picker glyph, 16 x 16: a domed observatory with its telescope through the slit.
export const GLYPH =
  '<path d="M2.5 14.5h11M3.6 14.5V9.6h8.8v4.9"/><path d="M3 9.6a5 5 0 0 1 10 0"/>' + '<path d="M8.4 9.4L11.2 3.4"/><path d="M6.6 14.5v-2.6h2.8v2.6"/>';
