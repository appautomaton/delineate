# Motion, parallax, separation

## Motion inside the SVG

- Motion is CSS in the SVG's own `<style>`, so the file animates anywhere (opened directly, in an
  `<img>`, inlined). `portraits/harness/stage/drawing.ts` writes the motion vocabulary
  (`portraits/harness/stage/motion.css`) first and the piece's `motion.css` after it, inside CDATA: SVG is
  XML, and `@property` syntax such as `"<number>"` otherwise breaks the whole file.
- A moving group carries its motion as classes, written by the build from the scene: `moving`
  plus the motion (`moving breathe`, `moving sway`). The piece's `motion.css` only sets, by id, the
  point it turns about (`transform-origin`, in drawing units) and the motion's custom properties
  (`--period`, `--dy`, `--swing`, …). Each property is registered with a default and does not
  inherit, so a nodding head takes nothing of the breathing body it rides on; `--blink`, `--lash`,
  and `--lash-width` do inherit, from a group that holds both eyes and lash lines.
- The vocabulary: `breathe`, `nod`, `bob`, `drift` (out to a pose and back), `sway` (to one side,
  back past rest, home), `glide`, `blink` with `.lid` lash lines (drawn by `lids()`, unseen without
  the styles), and for loose pieces `fall` and `hover` (set by `fallStyle()`). Add to it when a
  motion is about the medium; a subject's one-off motion stays in its piece.
- **Start from rest.** Every animation's 0% is the picture as painted; no negative delays.
- **Close every cycle.** Each periodic term of a motion runs a whole number of times per loop, or
  the frame jumps where the loop begins again. A falling piece's sideways drift follows its fall
  (`--wind`) and lets go only off the frame, when it comes round.
- `svg * { transform-box: view-box }`, so origins are drawing coordinates. Lengths are px: a drawing
  unit inside the SVG, and on the page too, where the drawing is shown at its own size and scaled
  as a whole.
- Breathing: the body shifts a pixel or two; the head nods a beat later, around the neck.
  Blinking: the eyes scale toward the lower lids (at a slant, `--slant`, for a tilted head) while
  the lash lines fade in; the head beneath the eyes must be painted.
- Pieces by the lens should hover, not fall: falling, they sweep across the subject.
- Honor `prefers-reduced-motion`.

## The page (`portraits/harness/stage/page.html`)

Every piece gets the same stage, filled from its `page.ts` (words, colors, settings such as the
eye's reach) and its drawing. It reads everything else from the drawing: the frame from the view
box, each layer's plane from `data-plane`, its name from `data-title`.

- Parallax: each plane's inverse depth is affine across the frame, `1/z = c + ax·x + ay·y`; under
  an eye shift that keeps the focus plane still, a point moves by `(1/focus − 1/z) × shift`, so a
  plane's motion is an exact affine map, flat or receding. The stage sets one transform per plane.
  **Never** set a custom property on the drawing's root for every layer to read: it restyles every
  path every frame.
- Separation: one slider value. The stack lies back and turns, planes spread along their depth,
  cel plates, tags, and peg holes fade in, and the pointer orbits the stack. Flush, nothing is in
  3D, and the orbit is written only when apart; any transform kept at zero still costs a frame.
  The spread is centered in the view by measurement, not by a tuned offset: perspective makes its
  middle no simple function of the stack's.
- Sheets: within a plane, groups go onto sheets in drawing order. Still groups share an svg; loose
  pieces share a sheet; each `moving` group gets a sheet of its own, which takes its id and motion
  classes, so the compositor carries the motion and nothing repaints. A moving group nested in
  another rides on its sheet when it is the last thing in it, and otherwise moves in place.
- A moving group's sheet covers only its box and room for its motion (`ROOM`). Full-frame sheets
  for small movers (birds, balloons) moved the bottleneck from the main thread to the compositor
  and cost 6 to 10 frames a second.
- Each plane clips to the frame (`overflow: hidden`); its content box reaches past the frame as
  far as the bleed and more (`PAD`), with `contain: paint`, and only it asks for `will-change`.
- Check parallax at the pointer's extremes for bared page background, and pause the page and the
  standalone SVG at the same moment mid-motion: lifted motion must match.
- The page opens from disk: the drawing is inlined at build time. Rewrite a page without
  rebuilding: `node portraits/harness/stage/page.ts portraits/pieces/<piece>`.

## Checks

- Frame pacing and main-thread share at device pixel ratio 2, together and apart, with the pointer
  circling: `node portraits/harness/stage/pace.ts <page.html>`. Measure with nothing else running, no other
  animating tab included; compare pages only on this one harness, and run twice before believing a
  difference of a few points.
- The page at rest, with the art sized to the reference, must score the same as the standalone SVG.
