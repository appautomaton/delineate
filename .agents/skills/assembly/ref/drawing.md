# Crayon for hands to draw

The drawings are made with the Footers' crayon (`footers/crayon/hand.ts`, `shapes.ts`) in Node, when
the page is built (`assembly/drawings.ts`). Read the crayon's header first: a stroke is a sheaf of
strands, each carrying the moment the crayon reached it (`--d`) and how long it took (`--t`).

## One group, one pen

Wrap each crayon hand's output in a `<g data-hand>`; `drawing()` in `drawings.ts` does it. On the
page, one pointer takes one group and follows it:

- **The tip is where the newest wax goes down**: at each moment, the head of the strands most
  lately begun. A crayon hand overlaps its shapes, so strands from two shapes are often live at
  once; averaging all of them puts the pen between two flowers.
- **Where the tip jumps, the pen lifts**: the hand carries the pen to the next stroke and the
  drawing waits for it. Many tiny jumps make a hand that hops; keep a group's strokes near each
  other, or split it.
- **Groups are laid back to front**: what should lie over the rest comes last in the markup,
  whatever order the hands draw in.
- **More groups, more hands at once.** A picture of twenty groups is twenty pens working together,
  which is the spectacle. One group of everything is one patient hand.

## Shapes

The crayon's own shapes (`poppy`, `tulip`, `bud`, `leaf`, `stem`) and its means (`stroke`, `line`,
`fill`, `spiral`, `dabs`, `coloured`, `petal`) make most things. `drawings.ts` builds more from them:
`aster`, `daisy`, `lavender`, `fern`, `berries`, `butterfly`, a glass `vase`, the paper dart.

- **Straight sides need many points.** The crayon smooths an outline through its points, so four
  corners make a blob. `sides()` lays each side as close points.
- **Shade glass along its curve.** A shade laid as a patch reads as a stain on glass; a few soft
  strokes inside the far side, following the bulb round, read as glass. Stems seen through glass
  are paler and set aside at the water line.
- **White on white is drawn in line.** A daisy on paper is its outline round a yellow eye.
- **Colours are names** (`class="k-red"`), so one drawing serves day and night. Every name a drawing
  uses needs its `.k-<name>` rule and its `--c-<name>` for both lights.

## Composing

A picture is judged whole first: does it read at a glance, small, as one thing? Then each part as
it is drawn. A still life needs a ground (the table's line), a light, a few large forms that carry
it and smaller ones that answer them, and something alive (a butterfly, a fallen petal). Size the
picture so it stands whole in its column and on the first screen, table and all.
