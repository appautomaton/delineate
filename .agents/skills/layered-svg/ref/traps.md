# Traps already met

## Approach

- **Cutting before sketching.** Opening a piece with Segment Anything cuts the picture into the
  reference's accidents before anything is decided. Lay in by hand; segment only what earns it.
- **Finishing a corner first.** A region drawn to full precision while the rest is blank cannot be
  judged; the whole frame advances a stage at a time.
- **Copying the reference's accidents.** A generated reference breaks its own style. Follow the
  grammar where it does; drop what has no logic.
- **Tracing a grammar of marks.** Engraved lines traced from pixels are fragments, by the hundred
  thousand. Generate the marks from a tone field.
- **Reinterpreting the grammar itself.** Reinterpretation corrects the reference's accidents, never
  the style's defining trait. An engraving of level waves stays level everywhere: turning the lines
  with the form made it another style.
- **Style as an excuse.** Mimicry frees the choice of details, not the standard. Ragged line ends,
  open joins, and fragments are faults in any style.
- **Judging marks by pixel error.** It punishes a line for its phase. Compare tone at blur, and look.
- **Changing the composition** to suit a camera model or a layout idea. The picture is fixed.
- **Slicing the reference** into image layers. It is not vector work, and it is not acceptable.
- **Over-splitting**: brows, mouth, and earrings as layers, each confetto as a layer. Layers are
  depth planes; moving parts are groups inside them.
- **Over-tracing**: hidden areas and busy backdrops at full fidelity. Precision goes where the eye
  goes.
- **Machine where a hand is cheaper**: automatic confetti detection and SAM grids for building faces
  both failed; reading positions off a gridded crop and authoring the data took minutes.
- **Hand where a machine is cheaper**: the opposite also holds; meridians, repeats, and falls are
  code.
- **Asking the user how to proceed.** Decide, build, show.
- **Reporting without showing.** Numbers alone do not let the user judge; open the work.
- **Preserving instead of improving.** An earlier output is not a specification. Verifying a
  rework byte for byte against it costs hours and keeps its faults.
- **Coupling pieces.** A piece importing another's model or scene ties two unrelated pictures
  together; a subject-named module in the harness overfits it to one picture.

## Tracing

- Tone order by area: dark seams. Order light to dark.
- Unlimited tone reach: hairlines where edges coincide, and twice the bytes.
- Smearing edge colors outward to fill hidden parts: streaks. Inpaint from clean pixels.
- Filling a defocused piece's whole blur reach by inpainting: edges guessed, dark bulges. Use a sharp
  plate, or fit the shape and blur once by rendering and comparing, and store them as data.
- Background plate trusted right up to the subject's outline: a light halo. Keep a seam.
- A plate's own region map trusted alone: sharp confetti on the plate break SAM's sense of the thing
  under them, and the map tears. Merge maps and close gaps (see `tracing.md`, sharp plate).
- Wide blurs with an exact kernel are slow; three box blurs match a Gaussian (Kovesi 2010).
- A single SAM point can select the whole surrounding thing; probe points one by one.

- Thin dark lines in a plate (outlines, folds) read as black: the layer behind shows through
  them as a hairline. Close the plate's paint before cutting it.

## Platform

- opencv.js through `require` is an Emscripten thenable that resolves to itself; awaiting it hangs.
  Delete its `then` before resolving (`portraits/harness/trace/cv.ts`).
- SVG `<style>` with `<` in it (for example `@property` syntax) breaks the XML; wrap it in CDATA.
- A custom property set on the SVG root for parallax restyles every path each frame.
- An inner `<svg>` clips at its own box: lifted sheets lose their bleed unless `overflow: visible`.
- A transform animated on a group inside a large sheet repaints the whole sheet every frame.
- A full-frame sheet for every small moving group: the compositor, not the main thread, drops
  frames. Bound each sheet to its group.
- A bare custom property that every falling piece recomputes from an animated one costs styling
  each frame; registered with `@property`, a third less.
- A periodic term that runs a fractional number of times per loop (1.5 turns, 2.5 tumbles): the
  frame jumps where the loop begins again.
- Pacing measured while another tab animates, or a build runs, says nothing about the page.
- `transform-box` defaults to the element's box in CSS; set `view-box` so origins are drawing
  coordinates.
- Playwright viewports must be integers.
- In zsh, `$VAR` holding several words is not split; use arrays.
- Node runs `.ts` directly (erasable syntax only); scripts that call `page.evaluate` need DOM types
  in their tsconfig.
- Chrome only: `portraits/harness/browser.ts` launches the system Chrome through the pinned playwright-core.
