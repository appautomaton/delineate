---
name: layered-svg
description: >
  Turn a raster picture (painting, illustration, portrait, poster) into a layered, animated vector
  SVG that resembles it: depth planes for parallax and a multiplane separation view, each object
  drawn by the cheapest faithful means (authored data, parametric models, symbols reused with
  <use>, tone-stack tracing), and the first frame checked against the reference in Chrome. Use when
  vectorizing a picture into animatable SVG, adding motion or a separation view to a layered SVG,
  or reusing this project's harness in portraits/harness/ (trace, model, stage).
---

# Layered SVG

Project paths are relative to the repository root; `ref/` files are in this skill's folder. Load a
ref file when its step comes up, not before.

## The goal

An artwork that resembles its reference, not a copy of its pixels.

- **Fixed:** the composition. Every object stays where it is, as large as it is, in its colors and
  light. Never rearrange, restage, or "improve" the picture.
- **Free:** texture. Grain, noise, and mottling become clean, deliberate shapes; precision goes
  where the eye goes (faces, hands, edges between things) and thins out where it does not (busy
  backgrounds, anything hidden until layers move).
- **Never:** a raster inside the SVG. No `<image>`, no `data:` URIs, no slices of the reference.
  The reference is a guide to trace over, nothing more.

"Resembles" is judged at normal size, side by side and flipping between the two. Error numbers
guard against drift; they are not the target.

## Pieces and the harness

A **piece** is one picture made into a drawing and a page, self-contained in `portraits/pieces/<piece>/`:
its scene (`scene.ts`: layers, regions, plates, presets, authored data), its region maps,
`segment.ts`, `build.ts`, its own models and fitters, `motion.css`, `page.ts` (the page's words),
and its outputs (`<piece>.svg`, `index.html`). Pieces never import from each other, even when two
show the same scene; copy and adapt instead.

The **harness** is what any picture needs, and nothing a single subject does:

- `portraits/harness/trace/`: from picture to drawing: rasters, color, masks, segmentation, plates, tracing,
  markup, and the checks.
- `portraits/harness/model/`: parametric things fitted to a picture and drawn as exact geometry: panelled
  spheres, cards, sprites, and the shapes they share.
- `portraits/harness/stage/`: from drawing to page: the drawing's contract with the page, the motion
  vocabulary, the page itself, and its frame-pacing check.

What a new piece needs that the harness lacks, build in the piece first. Move it into the harness
only when it is about the medium (plates, depth, tracing, motion, models of a geometric family),
not the subject, and would serve a picture with none of this one's things in it. Name it by what
it is (a sphere, a sprite), not by the subject it first served (a balloon, a petal).

## Workflow

1. **Look first.** Read the picture through gridded crops (`node portraits/harness/trace/look.ts grid ...`).
   List its things, and order them by depth.
2. **Cut it into layers by depth.** A layer is a plane that moves as one under parallax; a thing
   gets a layer of its own only if it stands at a depth of its own. Whatever moves on its own (eyes
   that blink, a head that nods, a streamer that sways, confetti that falls) is a named group
   inside its layer. Six to ten layers is typical. See `ref/representation.md`.
3. **Choose how each thing is drawn** before writing tools: authored data, a model from
   `portraits/harness/model`, one symbol placed many times, a straight-edged trace, or a tone-stack trace.
   See `ref/representation.md`.
4. **Find the regions.** Segment Anything only for complex outlines; simple things by color, by
   place, or by fitting their model. Save each region map as a PNG asset; the build reads the maps
   and never reruns the model. See `ref/tracing.md`.
5. **Use plates when the picture hides things.** Plates painted per depth, or a background plate
   and a sharp plate, supply what lies behind and beneath. Ask for them when parallax or separation
   would expose hidden areas. See `ref/tracing.md`.
6. **Build:** each region traced or drawn into its layer, continuing under nearer layers and past
   the frame, so motion never bares a hole. Write the drawing with `portraits/harness/stage/drawing.ts`.
7. **Move it:** give each moving group a motion class and its parameters in the piece's
   `motion.css`; the first frame is the picture. The page comes from the stage. See `ref/motion.md`.
8. **Verify and show:** render in Chrome, score, look at crops where the eye goes and where layers
   meet, and give the user the review page (`portraits/harness/trace/review.ts`), not just numbers.
   See `ref/verify.md`.

## Working rules

- The layer list, the representations, and the tooling are yours to decide. Decide, build, show;
  the user corrects. Do not ask the user how to get there.
- Experiment small: one region or one crop (`ONLY=<regex> OUT=<file>` on a build) before a full
  build. Verify in proportion to the risk: look at the result, and keep a number only where it
  can catch a regression.
- Improve rather than preserve. An earlier output is not a specification; change it when the
  change looks better.
- Each report shows the work: open the review page or the piece, then say in a few lines what
  changed, what the numbers are, and what is still off.
- Do not over-split (a face is one group, not brows and mouth) and do not over-trace (a hidden
  crowd needs no texture). Both cost bytes and time and buy nothing the eye sees.
- When an approach fails, delete it. Keep only code the build uses.
- Chrome only, through `portraits/harness/browser.ts`.
- Before blaming the approach, read `ref/traps.md`; most stalls so far were known traps.

## Routing

| Step | Load |
|---|---|
| Deciding layers and how each thing is drawn | `ref/representation.md` |
| Segmenting, tracing, plates, inpainting, bleed | `ref/tracing.md` |
| Motion, parallax, separation view, performance | `ref/motion.md` |
| Checking the result and showing it | `ref/verify.md` |
| Something looks wrong and the cause is unclear | `ref/traps.md` |

## The harness

| Module | Does |
|---|---|
| `trace/image.ts` | PNG in and out, crop, zoom, bleed (edge-extended margin) |
| `trace/color.ts` | sRGB and OKLab |
| `trace/filter.ts` | bilateral flattening of paint texture (opencv.js) |
| `trace/quantize.ts` | k-means palette in OKLab; `paletteFor` sizes it to an error target |
| `trace/contour.ts` | sub-pixel marching squares; rings into shapes with holes; rasterize |
| `trace/bezier.ts` | rings to cubic Béziers with corners and straight runs; compact path data |
| `trace/ramp.ts` | per-piece fill: flat color or a one-direction linear gradient |
| `trace/stack.ts` | tone stacking: a region as stacked tones, light to dark, with limited reach |
| `trace/layer.ts` | one region: extend under nearer layers, inpaint the hidden part, stack it; `TraceStyle` presets |
| `trace/svg.ts` | pieces to markup with shared gradient templates |
| `trace/polygon.ts` | `Point`, `Box`; polygon paths, signed distance, Douglas-Peucker |
| `trace/mask.ts` | grow, shrink, close; connected pieces; boxes, lines, OKLab tone ranges; a hand-read line settled onto its edge |
| `trace/labels.ts` | region maps as PNG assets; union of SAM prompts; despeckle, hole filling, label spreading; previews |
| `trace/sam.ts` | Segment Anything (ViT-B, fp16) through transformers.js, local |
| `trace/plate.ts` | plates: where they have paint; affine maps fitted by features and ECC; resampling into the picture's frame |
| `trace/transfer.ts` | affine color transfer from a plate to the picture, fitted robustly where both show a region |
| `trace/fill.ts` | push-pull fill for wide hidden areas |
| `trace/compare.ts` | renders in Chrome and scores against the reference |
| `trace/review.ts` | the review page: wipe, flip, difference, zoom, layer toggles, numbers |
| `trace/look.ts` | side-by-side zoomed crops; gridded crops for reading coordinates |
| `model/shape.ts` | flat shapes, crisp or blurred: footprints, and how blurred shapes composite over what is behind |
| `model/card.ts` | flat polygon pieces from authored data (confetti, tags) |
| `model/sprite.ts` | one symbol placed many times (petals, leaves): placements, blur filters, footprints, fitting a placement to a found copy |
| `model/sphere.ts` | a sphere of alternating panels (paper balloons): outline and panels fitted, drawn as exact geometry |
| `stage/drawing.ts` | the drawing's contract with the page: layers as planes in space, moving and loose groups, the document |
| `stage/motion.css` | the motion vocabulary: pose, sway, glide, blink, fall, hover, each set by custom properties |
| `stage/page.html`, `page.ts` | the separation page, filled from a piece's `page.ts` and drawing; `node portraits/harness/stage/page.ts portraits/pieces/<piece>` rewrites it |
| `stage/pace.ts` | frame rate and main-thread share of a page at DPR 2, together and apart |
| `stage/reel.ts` | a five-second loop of the page coming apart and back, as MP4 (or WebP, GIF), frames taken on the recorder's clock |

## Worked examples

Each piece is complete in `portraits/pieces/<piece>/`; `npm run <piece>:segment`, `npm run <piece>`. Read
the one that teaches what your picture needs; copy its shape, not its numbers.

- **paprika**: one picture with a background plate and a sharp plate; things and parts found by
  Segment Anything; confetti fitted on the sharp plate and taken back out of the defocused
  reference; a symbol crowd behind the subject; balloons as spheres.
- **memories**: plates painted per depth and already in the picture's frame, cut into regions by
  claims; color transfer per region; receding planes (a road, a guardrail); petals as a sprite.
- **paprika-girl**: per-depth plates of which one is painted larger and is mapped in; loose hair
  strands drawn as strokes over the scene; a sky made whole by push-pull fill.
- **memories-girl**: plates painted in other frames, mapped by features and ECC; a ridge read by
  eye and settled onto its edge; claims run partly on the plates and partly on the picture.
