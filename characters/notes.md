# Characters

A picture made of letters. A slow, flowing noise is cut at a level, and the shapes above it are written in
type: ring by ring from each shape's edge inward, a cell apart, the rings spell d3lin3at3, and deeper in, the
face's own glyphs grow, a ring each: leaves and flowers, or the waxing moon, or stars. `field.js` is the whole
of it, a browser module with no build step; `index.html` is its page, and delineate's page mounts the same
field in its Characters section. `npm run site` copies both to `site/dist/characters/`.

## How it is drawn

- **The face** is Victor Mono's oblique from Nerd Fonts, a true cursive, so the rings read as a hand's notes,
  and the Nerd Fonts' glyphs (Material Design and Weather icons, by the names in their `glyphnames.json`) grow
  at the heart. It loads from the jsDelivr build of `mshaugh/nerdfont-webfonts`, about 1 MB.
- **Rings by distance.** Each inside cell's ring is its exact distance from the shape's edge (Felzenszwalb and
  Huttenlocher's transform), in cells, so every ring is one cell wide and follows the contour. Rings cut from
  the field's own values run wide where it is flat and skip letters where it is steep.
- **Sized in cells.** The field's features are measured in cells, as the rings are, so a shape is deep enough
  for its heart on any screen; cells are near square, so a ring reads alike whichever way an edge runs.
- **Planted, not paved.** Past the heart's first ring, glyphs stand in every other cell, staggered, so the
  paper shows between them. Filled flowers in every cell read as a carpet.
- **Words in a clearing.** The field sinks in an ellipse about each block of words, so the rings curve round
  them; about a box they would run in straight lines.
- **Cost.** It steps twelve frames a second, from a glyph atlas drawn once per light, only while on screen and
  for twenty seconds after the last input; with less motion asked for, it holds one frame.

## The foot

`foot.js` writes the page's foot: four landscapes after references kept locally, a misty gorge, a green valley
with a winding path, sand dunes, and a rocky cove of turquoise water, taking turns. `scenes.js` draws them: planes,
far to near, that say for a point what it is (rock, foliage, sand, water...), how light, and how far the haze has
washed it; three tones for each material by day and by night; a place for the sun and one for the moon; and the
air that moves over it.

- **Composed for the frame.** The frame is always nine units high, so every feature keeps its size and the land
  its share of the height, and as wide as its aspect makes it. A scene is drawn for a frame sixteen wide, in
  sides and a middle: the sides (gorge walls, headlands, the valley's hills) hold the frame's edges and lose
  their outer parts when it is narrow; the middle (the gorge's floor, the cove's water, the valley's path) takes
  the width left, squeezed or spread to fit, never less than a share of the frame. The dunes are all middle, so
  each crest sits at its share of the width. So a phone sees a narrow inlet between headlands and a wide screen a
  broad sea, and both see a cove; nothing changes at a breakpoint. Shapes that must stay round (clumps, crowns,
  boulders) and grain that must stay fine are measured in the frame's own units, not the squeezed drawing's.
- **A cell is a pixel of a dithered picture.** Its color is one of three tones of its material, chosen by an
  ordered (Bayer) dither and laid as a soft tile on whole device pixels; on it stands a letter of the name,
  chosen by how much ink the tone asks for, or a tree in the shaded body of a crown. Cells are about 7 to 9 CSS
  pixels, small enough that the letters read as grain and the tiles carry the color. By day the letter is a tone
  darker than its tile, by night a tone lighter, as moonlight catches it.
- **Detail at the scale of a cell.** Rock stands in cracked columns crossed by ledges; trees and scrub gather in
  round clumps lit from where the sun stands; grass is tufts and blades; dunes split at their crests into a lit
  face and a slip face, the near sand combed into ripples that follow its swell, each a row or more of shadow
  and a lit crest; the sea runs deep to pale with rocks under it and a line of foam.
- **The scenes take turns.** Each holds eleven seconds, then dissolves into the next over 1.6 seconds, eased:
  each cell switches at its threshold in an eight by eight Bayer matrix, leaning upward, so the new scene settles
  from the foot as the old lifts off the top. The change is made of the same stuff as the pictures, a dither, and
  it never blends colors the inks do not hold. Only the cells that change are drawn.
- **It rises a row at a time.** As the foot comes into view each plane rises into place by whole rows, the
  nearest the furthest, so the type never leaves its grid.
- **The air moves.** Over a still copy of the scene, at twelve frames a second: mist through the gorge, cloud
  shadows over the valley, sand blown off the dunes' crests, glints on the sea along the path of the sun or the
  moon.
- **The words stay clear.** Nothing is drawn in the sky over the footer's words, not even a star, and the sun
  and the moon are placed in each scene where the words are not.
- **Cost.** Each look a cell can take is drawn once into an atlas in the light of the hour, and cells are copied
  from it. A scene's picture is composed a row at a time in slices of a few milliseconds, the next scene while
  the current one holds; drawing too is spent at a few milliseconds a frame, in the order cells turn. The foot
  moves only while on screen and for twenty seconds after the last input, finishing a turn it has begun; with
  less motion asked for, it holds one scene.
