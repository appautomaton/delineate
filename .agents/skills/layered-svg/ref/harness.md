# The harness, module by module

What exists, so you can choose. None of it is a step you must take.

| Module | Does |
|---|---|
| `portraits/bench/` | the live bench (`npm run bench`): references and versions side by side over one box of the picture, synced zoom and pan, a coordinate grid; saving a piece rebuilds it into a new version and redraws every open bench |
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
| `trace/compare.ts` | renders in Chrome and scores against the reference by pixel error (meaningful for the cel grammar) |
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
