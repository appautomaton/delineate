# Glass

A solid of clear glass held over a page: a line of words, then a drawing from the Garden, in turn, each page
melting into the next. It follows the pointer
on a spring, tipping into its own motion, and wanders about the middle when no pointer is there. Through it
the words are bent, magnified and turned over; under it lies its shadow, soft at the rim and lighter at the
core. It stands a few seconds as each shape (ring, tetrahedron, octahedron, sphere, rounded cube, capsule)
and melts into the next; a click brings the next at once. Day or night is the site's choice; each turn of
the light eases into that light's next pair of paper and ink, Glass's own.

- `shader.ts`: the glass as one fragment shader: the shapes as distance functions, the melt between two of
  them, the march in, through and out of the solid, the room it reflects, and its shadow on the page.
- `glass.ts`: the WebGL2 canvas, two slots of half-float texture for the pages' fields, and one `Frame` drawn.
- `pages.ts`: the lines and the drawings. `source.ts`: a page drawn as a mask, words in the site's serif or a drawing's
  outline. `field.ts`: the mask measured into a signed distance field, in a worker.
- `palette.ts`: the pairs of paper and ink, by day and by night, and the OKLab they are eased through.
- `show.ts`: the stage: the spring, the wander, the spin and tilt, the shapes' and the pages' timelines, the
  worker, and sleep. `main.ts`: the page, with `?words=` (one line for every page of words), `?picture` (open
  on a drawing), `?shape=`, `?light=`, `?tones=` and `?still` (held in the middle, the next shape on a click,
  the next page when asked).
- `npm run glass`: the stage at http://localhost:5370/. `build.ts` copies the drawings beside it from the
  Garden, which needs drawing first; a page whose drawing is missing is passed over.

## Rules

1. **Only near the solid is anything marched.** A pixel farther than `reach` from the solid and from its
   shadow is the page as it is; every shape must lie within `reach`, 1.25 sizes, as it turns and swells.
2. **The page lies past a sphere's focus.** At `LIFT` the words under a sphere show turned over and whole.
   Lower, the page nears the focus and the glass shows one letter blown up to a blur.
3. **The shadow falls by the light's slant.** `FALL` in `show.ts` is `LIGHT`'s in `shader.ts`, and the
   glass is kept far enough in that its shadow is never cut by the stage's edge.
4. **The room is the paper's.** What a face reflects, or shows where a ray leaves upward, is the paper's
   colour and a soft window; by night both are lit by the ink, or the glass is lost on the dim paper. It
   changes with the colours, so the glass is never a grey of its own.
5. **The page is a distance field; colour is laid in the shader.** A field holds only how far each point is
   from the ink, a cell to a CSS pixel, so the edge is drawn one device pixel wide at any scale, a change of
   colours is two uniforms a frame, and one page melts into the next by easing between two fields. The page
   around the stage takes its colours from `onWear`, the same eased values, so the two never part mid-turn.
6. **The next page is measured before it is needed.** Once a page stands, the next is drawn and sent to
   the worker, and lands in the spare slot; a melt starts only when it is there. Measuring on the main
   thread would cost the glass its frames.
7. **Blur is for thickness only.** The page is read sharp outside the glass and softened within it by
   widening the edge with the glass the ray crossed, a few pixels at most, so letters stay legible through it.
8. **Shapes melt as fields.** Two distance functions are eased into each other, swelling a little at
   the middle; no shape is faded over another.
9. **`turn` is the inverse.** `show.ts` builds the solid's rotation row by row and hands it to WebGL as
   columns, which is its transpose and so its inverse: the page's frame into the solid's.
10. **Out of view, nothing is drawn**; in view, a frame for each the screen shows. At 2200 by 1100 device
   pixels on a 144 Hz screen, it keeps every frame, through a melt and while the next page is measured.
