# Verifying, and showing the work

## Tools

| Command | Gives |
|---|---|
| `node portraits/harness/trace/compare.ts <drawing> <reference.png> [dir]` | render in Chrome at the reference's size; mean error per channel, share of pixels off by more than 12, PSNR; with a dir, the render, a side-by-side, and a difference map |
| `node portraits/harness/trace/review.ts <drawing.svg> <reference.png> <dir> [regions.png]` | the review page: wipe, flip with Space, difference, region map, zoom 1:1 and 2:1, layer toggles with sizes, the numbers |
| `node portraits/harness/trace/look.ts crop x y w h zoom out.png a.png b.png ...` | the same box from several images, enlarged, side by side |
| `node portraits/harness/trace/look.ts grid x y w h zoom out.png image.png [shapes.json]` | a gridded crop for reading coordinates, with outlines drawn over it |
| `ONLY=<regex> OUT=<file.svg> node portraits/pieces/<piece>/build.ts` | build only some regions, for quick trials, in a piece whose build reads `ONLY` |
| the bench with `&tone=<px>` (T toggles it) | every pane blurred until the marks vanish, so only tone is compared |
| `bench.measure(reference, panes, region?)`, `bench.cells(reference, pane)` in the bench's console | tone against a reference per pane, and the cells most off, worst first |
| `node portraits/harness/stage/pace.ts <page.html>` | frame rate and main-thread share of the page, together and apart |
| `node portraits/harness/stage/reel.ts <page.html> [out.mp4\|.webp\|.gif ...]` | the page coming apart and back as a five-second loop (`reel.mp4` beside the page): the piece shown to someone who will not open it |

## What to check

- At the end of every stage, the whole frame beside the reference: small, for whether it reads, and
  at size, for whether it holds. Do not start the next stage on a frame that does not hold.
- Then crops where the eye goes (eyes, mouth, hands) and where layers meet (the subject's outline,
  where defocused pieces overlap things), render and reference side by side. Ask whether each
  reads as the style, not whether it matches the pixels.
- Each layer alone, and each layer with the layers in front of it turned off: hidden parts must be
  continuous, with no streaks, holes, or stray pieces left in the wrong layer.
- The standalone SVG and the page at rest. A screenshot of a page with a side panel, taken at the
  page's corner, scores nonsense; size the art to the reference and clip to it.
- After any change, which tiles got better or worse (a per-tile difference of two renders against
  the reference finds regressions fast).
- No raster in the file: no `<image>`, no `data:`.

## What the numbers mean

Pixel error (`compare.ts`) is fair only to the cel grammar. For a grammar of marks, blur render and
reference until the marks vanish and compare tone (the bench's tone view and `bench.measure`); a line shifted half a period scores as a gross
error and is not one.

Pixel error has no pass mark of its own: use it to compare builds of one piece, and to find the
tiles that got worse. Numbers rise when traced texture is replaced by clean models; that is
expected, and the eye decides.

## Reporting

Open the piece or the review page for the user, then say in a few lines what changed, the numbers,
and what is still off. Pictures first; numbers support them.
