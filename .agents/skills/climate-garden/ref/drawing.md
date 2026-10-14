# Drawing a plant

Paths here are inside `garden/`, unless they start with it.

## The kit

Every plant is drawn in its own units, base (or hanging point) at the origin, from its own seed,
into a list of SVG elements. CSS sizes it later, so draw true proportions and never think in
pixels.

Start from the shared modules. `draw/lib.ts` holds points and curves, `shape` (a wash glaze with
ink light on the lit edge and heavy on the shadow side), `tone` (per-shape shifts around the
species tone, or a material), `stalk`, and the growth markup below. `draw/woody.ts` holds `limb`
(a barked branch) and `branch` (a limb forking from a growing one, timed to its tip).
`draw/rosette.ts` sets leaves round a crown in space, shaped by a `Habit`.

Each garden's module holds the helpers its plants needed: a ribbed column, a raceme, a bipinnate
leaf, a host for a vine. Before writing geometry, look for the same structure under any garden's
name (`grep -nE '^(export )?function' garden/draw/*.ts`) and read the comment above it. Copy a plant's
shape of code from the closest existing plant, not its numbers.

## Growth markup

The page grows a garden by one progress value, 0 to 1: up to `INTRO` on load (a garden that shows
a year stops at `BUD`, both in `src/main.ts`), the rest with the scroll, so what opens past that
point is what the first scroll shows. A garden that shows a year runs the same value through the
calendar (the seasons' boundaries are in the comment at the top of `src/main.ts`; see Seasons in
`climates.md`), so there g is a date. Map a month
to g through the garden's calendar in `climates.md`, which says the month its year starts. Open a
part when the plant opens it, and have the whole plant in leaf by `SPRING` in `gardens.ts`, the
moment the gallery and reduced motion show.

- `grow(out, g0, g1, fn, leave?)` wraps a limb or stem; the page clips it to a rounded shoot that
  reaches its tip at g1. `fn` must return the stem's edges (`limb`, `stalk`, and `skirt` do).
  Given `leave`, a herbaceous stem dies back then, bending over from its base and fading.
- `part(out, g, origin, fn, leave?, fade?)` wraps a leaf, flower, or fruit; it unfolds from
  `origin` over `UNFOLD` (in `main.ts`) and, given `leave`, falls from then over `FALL`, or with
  `fade` fades where it is (a head drying on its stem over a dry one drawn beneath it). Take a leaf's `leave` from where
  it hangs with `fallsAt`, not from `r()`, so its timing never moves the drawing. What happens
  twice in the page's year (the plum's two flowerings) is two parts at the same place.
- A species that turns in autumn gets `turn: [start, end]` in `plants.json` and a
  `--pl-<key>-autumn` token beside its summer one in both lights; its species-toned leaves mix
  toward it.
- `gate(res, g, i)` is the progress at which a grown stem reaches its point i: open parts there.
- `npm run draw` fails when a part sits on a limb before the limb reaches it, or stays after the limb has died back. Usually a part near a fork is closer to the fork's
  base than to its own limb: open it a beat later (`+ 0.03`), start it clear of the fork, or grow
  the structure that was already standing (a dead spike) first.
- A part unfolds about its one origin, so one part along a whole limb swings its far end off the
  bark as it opens. Give each node's thorns, leaves, or pod a part of its own, anchored at the node.
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
  spiky shapes turn to ink; give them broad points. A tight coil fills in to a dark coin; open it.
- **A wash behind a compound crown** shows as a plate, since every `.wash` carries a darker rim.
  Build the crown's depth from leaflets in a back rank and a front rank (`dl`) instead.
- **Grass blades of two points** stand as stiff needles; three points give them an arch.
- **A bare host bough** entering from the top reads as a cut stick. Tip it with its own leaves.
- **Tiers or masses with square ends** show seams where they overlap; taper them into lenses.
- **A fork's neck** must be covered by the limbs drawn over it, starting well inside it, with no
  ink across its top.
- **Detail no one sees** need not be drawn. Ten points a leaf are as smooth once the curve runs
  through them, and a compound leaf seen at a distance needs its pinnae, not its leaflets, in one
  wash (`bladeBunch`).

## Tokens

Each garden adds two groups to both sets in `src/tokens.css`: "Materials: the <garden>" (bark,
flowers, fruit, lichen; reuse an existing material when it fits) and "Species: the <garden>" (one
`--pl-<key>` per plant; every leaf shifts around it). A species token colors its own species
only: a color another plant borrows becomes a material, named by what it is, or retuning one
plant recolors the other. A host drawn in another plant's drawing (a spruce bough under its
lichen) is its own species, and wears its token.

Write the night values out from the day ones: materials take lightness −0.05 and chroma ×0.78;
species take lightness −0.04, chroma ×0.72, hue +8. Dim large pale areas further, so night paper
still reads as night.

A pen in a material's color sets its stroke inline (`style="stroke:var(--bark-thorn)"`); a pen
that bundles a color with its own width or opacity, and recurs, gets a class in
`src/garden/paint.css`, as `.ink.wool` does. Use an existing class before writing the same stroke
inline.

## The emblem

Each garden's entry in `src/garden/gardens.ts` carries a line drawing of its signature plant on a
24-unit square: `leaves` are closed shapes washed with the garden's tone, `lines` are open strokes
(a plant that stands on open ground stands on a line at y 22). Keep it to three or four leaves and
a few lines; it is drawn about 22 pixels square.
