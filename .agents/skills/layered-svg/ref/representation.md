# Layers, and how each thing is drawn

## Layers are depth planes

A layer is one plane in space: facing the eye at one depth, or receding (a road, a wall). Under
parallax each point moves by `1/focus − 1/z`, so things beyond the subject follow the eye and
things before it slide against it (see `portraits/harness/stage/drawing.ts`). A thing earns a layer of its
own only by standing at a depth of its own.

Inside a layer, give a named group to each thing, and to each part that moves on its own:

| Moves on its own | Group |
|---|---|
| a figure breathing | the body |
| a head nodding | the head, nested so it rides the body |
| eyes blinking | the eyes, nested in the head |
| a streamer swaying, a balloon bobbing, a bird gliding | the thing |
| confetti or petals falling | each piece, loose over its layer |

Everything else stays in its thing's group. A face is one group with its brows, mouth, and
earrings in it; splitting them buys no motion and costs seams.

Order layers by where things stand, not by kind. A backdrop, a few middle planes, the subject on
the focus plane, and whatever lies nearer than the subject is a common shape; the worked examples
show four.

## Choosing how a thing is drawn

Pick the cheapest representation that still reads as the thing at normal size. In rough order of
preference:

| The thing | Draw it as | Cost |
|---|---|---|
| Flat geometric pieces: confetti, cards, tags, tiles | **Authored data** (`model/card.ts`): corners, a color, a blur if defocused. Fit once from the clearest source, store the numbers in the scene, draw from them. | tens of bytes each |
| Regular solids: balloons, spheres, lanterns, wheels | **A parametric model** fitted to the picture (`model/sphere.ts` for panelled spheres): center, radius, axis, panel count, colors. Add a model to `portraits/harness/model` for a new geometric family. | about a kilobyte |
| Repeated things: crowd figures, petals, windows, trees | **One `<symbol>`, many `<use>`** (`model/sprite.ts`): draw the thing once; place it with position, angle, scale; vary color with a CSS custom property on the `<use>` (it inherits into the symbol). Read placements off the picture or fit them to found copies. | one drawing plus tens of bytes per placement |
| Built structure of straight members: gates, beams, frames | **A straight-edged trace**: few tones, polygonal rings, no crumbs. | kilobytes |
| Organic and complex things: faces, hair, animals, costumes | **A tone-stack trace**, finer where the paint is smooth (skin), coarser elsewhere. | tens to hundreds of kilobytes |
| A busy backdrop: city, crowd, foliage | **A tone-stack trace** with straight-where-straight rings, a coarser palette, crumbs dropped. | the bulk of the file |
| What is seen only when layers move or part | **A coarse trace**, plus symbols for any repeated things in it. | modest |
| Hand-made details the picture does not show | **Draw them**: lash lines for a blink, a closed lid. | bytes |

Rules of thumb:

- Code where the shape has a rule (meridians, grids, repeats, falls); draw directly where the shape
  is simple and one-off; trace only what is irregular.
- A defocused thing is a sharp shape seen through a blur: a polygon with `feGaussianBlur`. Never
  trace a blur as soft tones.
- Before modeling a class of things by machine, check it on the picture. Regularizing a city into
  boxes and window grids looked wrong here: the painting's buildings are overlapping straight-edged
  patches with blotchy windows, so straight-edged tracing resembled it and a grid did not.
- Sizes at 1254 px square: a full tracing runs 5 to 11 MB (1.2 to 3 MB gzipped), the more the
  busier the paint; the subject about 1 MB; dozens of cards, spheres, and symbol placements
  together under 20 KB.
