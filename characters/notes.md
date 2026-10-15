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

`foot.js` writes the page's foot: a misty gorge, after a reference kept locally, drawn on a 16 x 9 sheet laid
as a slice. Four planes, far walls, the gorge's floor, the tall walls, the near slopes, each say for a point
what it is (rock, foliage, grass), how light, and how far the haze has washed it.

- **A cell is a pixel of a dithered picture.** Its color is one of three tones of its material, chosen by an
  ordered (Bayer) dither and laid as a soft tile on whole device pixels; on it stands a letter of the name,
  chosen by how much ink the tone asks for, or a tree where crowns gather. The tile carries the color, since a
  letter lays too little ink to; the letter carries the texture. By day the letter is a tone darker than its
  tile, by night a tone lighter, as moonlight catches it.
- **It rises a row at a time.** As the foot comes into view each plane rises into place by whole rows, the
  nearest the furthest, so the type never leaves its grid; a drift of mist moves through the gorge at twelve
  frames a second, over a still copy of the scene painted once per rise and per light.
