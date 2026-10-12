# Drawing a plant

## The kit

Every plant is drawn in its own units, base (or hanging point) at the origin, from its own seed,
into a list of SVG elements. CSS sizes it later, so draw true proportions and never think in
pixels.

- `draw/lib.ts`: points and curves (`sample`, `quad`, `line`, `closed`, `wobble`); `shape` (a wash
  glaze, an optional deep glaze, and ink light on the lit edge, heavy on the shadow side);
  `stalk` (a tapered stem); `tone` (per-shape shifts of lightness, hue, and chroma around the
  species tone, or a material via `pc`); `roundPts` (a round outline); `grow` and `part` (growth
  markup, below), and `gate` (when whatever sits at a limb's point appears).
- `draw/woody.ts`: `limb` (a barked branch with shade, light, and texture; forks drawn over their
  parent with `inkFrom`), `branch` (a limb forking from a growing one, timed to its tip),
  `spineThrough`, `angleOf`.
- `draw/mediterranean.ts`: `blade`, `palmate`, `bladeBunch` (many blades in one path), `tendril`,
  `agaveLeaf`.
- `draw/desert.ts`: ribbed columns with areoles (`saguaroColumn`), pads, joints, bipinnate leaves
  (`mesquiteLeaf`), fine twigs (`verdeTwig`), a host-drawn hanger (`mistletoe`).
- `draw/afroalpine.ts`: rosettes in space (`rosette` with a `Habit`: `GIANT`, `NARROW`, `CABBAGE`,
  `GLOSSY`, `FLAT`), dead-leaf skirts (`skirt`), cork (`corkTrunk`), hairy bract columns
  (`hairyBract`), needle plumes (`plume`), leaf clumps (`heathClump`), strand lichen (`usnea`),
  thistle leaves and heads, nodding heads, daisies, papery heads, spent panicles.
- `draw/savanna.ts`: a bottle trunk (`baobabTrunk`), palmate and pinnate leaves as single washes
  (`baobabLeaf`, `pinnateLeaf`), a light bipinnate leaf (`thornLeaf`), pendant flowers
  (`baobabFlower`), puffballs (`puffball`), coiled pods (`coiledPod`), hanging fruit (`sausage`),
  strap-leaf rosettes with umbels (`crinum`), stars (`star`). Its boughs, thorns, and grass tufts
  are private to the savanna's plants.

Copy a plant's shape of code from the closest existing plant, not its numbers.

## Growth markup

The page grows a garden by one progress value, 0 to 1: half on load, the rest with the scroll.

- `grow(out, g0, g1, fn)` wraps a limb or stem; the page clips it to a rounded shoot that reaches
  its tip at g1. `fn` must return the stem's edges (`limb`, `stalk`, and `skirt` do).
- `part(out, g, origin, fn)` wraps a leaf, flower, or fruit; it unfolds from `origin` over 0.08.
- `gate(res, g, i)` is the progress at which a grown stem reaches its point i: open parts there.
- `npm run draw` fails when a part sits on a limb (within its half width) before the limb reaches
  it. Usually a part near a fork is closer to the fork's base than to its own limb: open it a beat
  later (`+ 0.03`), or grow the structure that was already standing (a dead spike) first.
- Order in the list is paint order, so draw back to front. A trunk drawn last covers where its
  branches leave it; a branch drawn over its stem hides the seam with a hem of leaf tips in
  hairline ink.

## Traps, from the rounds they cost

- **Rosettes and whorls drawn flat** read as paper fans or succulents. Use `rosette`: leaves round
  a crown at the golden angle, raised by age, projected from a little above, drawn far to near.
  Tune a `Habit` (shares of dying and young leaves; each kind's elevation, length, width, curl; an
  `under` token for felted undersides) rather than writing a new rosette.
- **Evenly spaced heads on a spike** read as a ladder. Place them round the axis in space at uneven
  heights; draw the far ones before the axis.
- **A mass painted behind a shrub** reads as a rock or a hill. Give each stem or twig its own soft
  body, or let density carry it.
- **Needles stroked two ways** read as a fern. Project whorls round the twig, over a darker body.
- **A column of bracts** needs a soft body behind it and hairs off its edges, or it reads as a
  stack of scales.
- **Tiny flowers** vanish at garden size; enlarge the flower, not the plant. Thin stars and
  spiky shapes turn to ink; give them broad points.
- **Tiers or masses with square ends** show seams where they overlap; taper them into lenses.
- **A fork's neck** must be covered by the limbs drawn over it, starting well inside it, with no
  ink across its top.
- **Bytes.** Ten points a leaf are as smooth once the curve runs through them, and a compound
  leaf seen at a distance needs its pinnae, not its leaflets, in one wash (`bladeBunch`). Keep a
  plant near 50 KB gzipped; a drawing over that usually draws things no one sees.

## Tokens

Each garden adds two groups to both sets in `src/tokens.css`: "Materials: the <garden>" (bark,
flowers, fruit, lichen; reuse an existing material when it fits) and "Species: the <garden>" (one
`--pl-<key>` per plant; every leaf shifts around it). Write the night values out from the day ones:
materials take lightness −0.05 and chroma ×0.78; species take lightness −0.04, chroma ×0.72, hue
+8. Dim large pale areas further, so night paper still reads as night. A new pen (a stroke in a
material's color) gets a class in `src/garden/paint.css`, as `.ink.wool` and `.ink.spine` do.

## The emblem

Each garden's entry in `src/garden/gardens.ts` carries a line drawing of its signature plant on a
24-unit square: `leaves` are closed shapes washed with the garden's tone, `lines` are open strokes
(the desert and Afroalpine stand on a ground line at y 22). Keep it to three or four leaves and a
few lines; it is drawn about 22 pixels square.
