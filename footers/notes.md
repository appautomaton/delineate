# Footers

A site's footer as a small illustrated world, one of seven, each drawn in its own medium, entered by scroll
in parallax planes, and shown by day or by night. It is a component: the Automaton demo page wears it, and
delineate's own page shows it as its Footers section (see `site/notes.md`). `npm run footers` writes the demo
as one self-contained file, `footers/automaton.html` (about 3.7 MB, not tracked); open it with `?world=<id>` to
choose a world. `python3 -I footers/build.py --kit <site> <out.html>` writes the footer alone for a site to
embed. The generators are Python 3 with the standard library only, run with `-I`.

## How it is built

- **The component**: `footer.html` (a four-corner grid: brand top left, sitemap top right, sign-off bottom
  left, and the view, scene picker then day/night toggle, bottom right; on mobile brand, sitemap, view,
  sign-off), `footer.css`, `footer.js` (mounting worlds, the picker, the theme, the film clock, the rest
  timer, parallax) and `early.js`, which settles `data-world` and `data-theme` on the root before the first
  paint. A host page sets `--footer-sans` and `--footer-serif` for the footer's type; the footer's measures
  live on `.site-footer`, so the host keeps its root. A host can choose a world from anywhere by dispatching
  `footer:choose` on `document` with the world's id as `detail`.
- **`sites/<site>.html`**: each site's footer content, by slot (`BRAND`, `SITEMAP`, `SIGNOFF`). `SITES` in
  `build.py` gives each site its worlds in picker order (the first opens), the key it keeps a visitor's
  choices under, and the light it opens in.
- **`page.html`**: the Automaton demo around the footer: a product's home whose one long sky deepens into
  the footer's horizon, and the scroll progress indicator (`journey`, whose marker is the `traveller`; a
  page without a journey stage simply has no traveller).
- **`build.py`**: for each world, `gen.placeholders()` fills the holes in its `art.html`, `style.css` and
  `life.js`; the CSS is scoped, the markup unfolded and pruned (see Motion), and the result goes into an
  inert `<template>`. Only the chosen world is ever in the document.
- **`crayon.py`**: wax on paper as vector: a `Hand` that lays strokes as strands, colours shapes in and
  winds spirals, keeping the time it took over each so a page can replay the drawing; and the shapes made
  with it (`poppy`, `tulip`, `bud`, `leaf`, `stem`). Colours are names (`class="k-<name>"`), so one drawing
  serves day and night. The crayon world and delineate's opening drawing both use it.
- **`common.py`**: shared geometry: `f`, `poly`, `smooth`, `catmull`, `bezier`, `resample`, `ribbon`,
  `pressure`, `ellipse`, `tile`, and the raster `spans`/`union_outline` for inside-tests and outlines.
- **`worlds/<id>/`**: `gen.py` (the procedural parts, `placeholders()`, and the picker's 16 × 16 `GLYPH`),
  `art.html` (depth planes with `data-sway`, a day pane and a night pane), `style.css`, and `life.js`, which
  registers `WORLD_BUILDERS.<id> = ({ stage, root, calm, film }) => ({ setVisible, destroy })`. A world that
  starts CSS animations after it mounts calls `film()` so the film clock gathers them in.

A world's CSS is prefixed with `.world--<id>`, after any leading `.is-ready` or `[data-theme]`. Selectors
starting `:root`, `.journey`, `html` or `body` are left alone, `&` is the world's root, and `:global` opts
out, for parts drawn through `<use>`, whose shadow tree no ancestor selector reaches.

## The worlds

| id | Medium |
|---|---|
| `desert` | Gouache poster: flat painted planes, a curled relief pressed into everything, grain on top. |
| `lijiang` | Blue-green landscape on silk: ink contours, ochre climbing into malachite and azurite, mist at the water. |
| `deep` | A reef as a papercut diorama: knife-cut sheets, lace made of holes, lit from behind at night. |
| `alfama` | Urban sketch in fineliner and watercolour, from the Portas do Sol over the roofs to the Tejo. |
| `glasshouse` | Copperplate engraving, hand-tinted by day; by night the same drawing lit from within the house. |
| `observatory` | A sheet of working drawings in technical pen on drafting film; a cyanotype by night. |
| `crayon` | Crayon on paper: ridges, a bed of flowers, grass. By night the same strands on dark paper, where wax reads as pastel. It draws itself each time it comes into view. |

Each `gen.py` opens with the reasoning behind its medium; read it before changing the world.

## Motion and its cost

Idle life must cost nothing at rest and little awake. These rules came from measuring, not taste.

- **A film clock, not the display's.** CSS animations in the footer stay paused (`--footer-play`); the
  shell steps every one's `currentTime` 24 times a second, both panes together so they never drift.
  Moving SVG repaints its layer each frame, and 24 frames instead of 120 is a fifth of the paint.
- **Rest.** Eight seconds after the last pointer, wheel, scroll, key or touch, the clock stops and each
  world's canvases pause through `setVisible`; the next input wakes them.
- **Nothing animates inside `<defs>`** (`.defs { --play: paused }`). An animated original restyles every
  `<use>` clone each frame, and a clone's animations cannot be reached from script. So the build unfolds
  any `<use>` whose drawing animates into an inline copy (`unfold_life`) and drops definitions nothing
  refers to any more (`prune_defs`). `data-still` keeps a clone frozen on purpose, as the desert's shadows are.
- **Move the outermost thing that moves whole.** The tram's bounce is on its HTML `<svg>`, a composited
  layer, not inside the scene.
- **Canvases run at 30 fps** and clear only what changed.
- **Planes wake in turn** (`--wake`, 50 ms apart), so a theme switch never repaints every plane in one frame.

Measured at 1440 × 900 @2x: at rest, 0 ms a second on the main thread and the GPU; awake, the GPU spends
about 33 ms a second on Alfama, 220 on Desert and 130 to 218 on the Deep; scrolling holds 120 fps in every world.

## What the work taught

- **Night is lighting, not a filter.** Every filtered night of the Glasshouse (mezzotint grain, tone groups)
  looked dead and dropped frames on the theme switch. What worked was choosing the one light that matters,
  the house glowing from within, and redrawing for it: luminous glass, black iron and silhouettes against
  it, rims only where the moon falls. The vector night switches with no slow frames.
- **Draw at scale.** Alfama's landmarks read only once placed at their true size and distance (`sk.place`);
  the observatory sheet reads as a drawing because every line weight and section symbol has a job.

## Checking the work

- In Chrome at `1440x900x2` and `390x844x3` (mobile, touch). Toggle the theme by clicking
  `.footer-view .theme-toggle`; writing `data-theme` directly is overwritten by the page.
- Record a performance trace, then `python3 -I footers/harness/tracebuckets.py trace.json` for busy time per
  second on each thread, and `tracestat.py` for totals and how often the page paints and rasters.
- `footers/harness/contrast.py <background.bmp> <boxes.json> <scale>` measures the WCAG contrast of footer
  text against the rendered scene.
