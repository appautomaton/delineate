// The opening drawing: a bouquet in crayon, gathered at the right and cut by the edge of the page, so the words
// have the left. A few large flowers carry it, each coloured in two passes, the second darker where the petal
// folds into the centre, and outlined in a crayon that is not its own colour: blue round ochre, deep red round
// red, graphite round green.
//
// Three planes, back to front, so the page can part them; each is its own <svg> with the clips it uses. The
// frame shows the bouquet down to y = 820, but every stem runs on to the plane's foot at 990, so when the page
// lifts the planes apart, a stem never shows its cut end. Every strand keeps the moment the hand reached it;
// each flower has its own hand and they work at once, so the whole picture is drawn in a few seconds. The
// shapes come from the Footers' crayon.

import { Hand } from "../footers/crayon/hand.ts";
import { Sheet, bud, leaf, poppy, stem, tulip } from "../footers/crayon/shapes.ts";
import { Random } from "../footers/lib/random.ts";

const FOOT = 990;
const PLANES = ["back", "mid", "front"] as const;
type Plane = (typeof PLANES)[number];

function draw(): Record<Plane, { sheet: Sheet; parts: string[] }> {
  const rng = new Random(21);
  const hand = (start: number) => new Hand(rng.randrange(10 ** 6), start);
  const planes = Object.fromEntries(PLANES.map((name) => [name, { sheet: new Sheet(`hero-${name}-`), parts: [] as string[] }])) as Record<
    Plane,
    { sheet: Sheet; parts: string[] }
  >;

  // Back: small flowers and buds high and to the left of the bouquet, as if further off.
  let { sheet: s, parts: p } = planes.back;
  let h = hand(0.1);
  p.push(stem(h, [[980, FOOT], [960, 560], [930, 330]], "green", 6));
  p.push(poppy(s, h, 930, 300, 72, "blue", "violet", "deep", { tilt: 0.15 }));
  h = hand(0.3);
  p.push(stem(h, [[1130, FOOT], [1080, 420], [1030, 170]], "green", 5));
  p.push(bud(s, h, 1030, 150, 30, "pink", "maroon", -0.25));
  h = hand(0.5);
  p.push(stem(h, [[1450, FOOT], [1440, 400], [1420, 150]], "green", 5));
  p.push(bud(s, h, 1420, 130, 28, "ochre", "maroon", 0.15));
  for (const x0 of [880, 1240, 1560]) {
    h = hand(rng.uniform(0.2, 0.9));
    for (let i = 0; i < 5; i++) {
      const x = x0 + rng.uniform(-50, 50);
      p.push(stem(h, [[x, FOOT], [x + rng.uniform(-30, 30), 760], [x + rng.uniform(-60, 60), rng.uniform(470, 600)]], "olive", 4));
    }
  }

  // Mid: the tulip and a pink poppy low down, leaves among the stems.
  ({ sheet: s, parts: p } = planes.mid);
  h = hand(0.4);
  p.push(stem(h, [[1090, FOOT], [1100, 640], [1080, 520]]));
  p.push(leaf(s, h, [1098, 700], -2.0, 170, 46));
  p.push(tulip(s, h, 1080, 470, 62, "ochre", "red", "deep"));
  h = hand(0.7);
  p.push(stem(h, [[1200, FOOT], [1190, 760], [1180, 660]]));
  p.push(poppy(s, h, 1180, 650, 108, "pink", "red", "maroon", { tilt: 0.25 }));
  // Leaves from the ground beside the poppy, clear of its face.
  h = hand(0.9);
  p.push(leaf(s, h, [1290, 900], -1.2, 210, 52, { fill: "olive", second: "green" }));
  p.push(leaf(s, h, [1400, 900], -1.75, 230, 56));

  // Front: the red poppy that carries the picture, and a blue anemone cut by the edge.
  ({ sheet: s, parts: p } = planes.front);
  h = hand(0.2);
  p.push(stem(h, [[1300, FOOT], [1320, 600], [1290, 360]], "green", 10));
  p.push(leaf(s, h, [1318, 640], -0.55, 220, 58));
  p.push(poppy(s, h, 1290, 330, 172, "red", "maroon", "maroon"));
  h = hand(0.6);
  p.push(stem(h, [[1540, FOOT], [1520, 700], [1500, 600]], "green", 9));
  p.push(poppy(s, h, 1510, 590, 150, "blue", "deep", "deep", { n: 7, tilt: 0.1 }));
  // The nearest leaf, low at the left of the bouquet, where the base fades into the paper.
  h = hand(1.0);
  p.push(leaf(s, h, [980, 900], -1.38, 280, 62, { fill: "green", second: "olive" }));
  return planes;
}

// The three planes as the page places them. The frame is cropped to the bouquet, a little past the page's edge,
// so it can be drawn large; each plane runs on below it to the stems' foot.
export function markup(): string {
  const planes = draw();
  return PLANES.map(
    (name) =>
      `<div class="hp hp--${name}"><svg class="wax" viewBox="800 90 820 ${FOOT - 90}" preserveAspectRatio="xMaxYMin slice">` +
      `<defs>${planes[name].sheet.defs()}</defs><g>${planes[name].parts.join("\n")}</g></svg></div>`,
  ).join("\n");
}
