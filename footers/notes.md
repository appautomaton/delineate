# Footers

A site's footer as a small illustrated world, one of seven, each drawn in its own medium, entered by scroll
in parallax planes, and shown by day or by night. It is a component: the Automaton demo page wears it, and
delineate's own page shows it as its Footers section (see `site/notes.md`). `npm run footers` writes the demo
as one self-contained file, `footers/automaton.html` (about 3.9 MB, not tracked); open it with `?world=<id>` to
choose a world. `node footers/build.ts --kit <site> <out.html>` writes the footer alone for a site to embed.
Everything here is TypeScript that Node runs as it stands, with no build step and no dependencies.

## The bar

Effortless to look at, exacting beneath. A visitor should meet an easy hand and never the labour behind it,
and nothing they do see may be slack: no stray mark, no seam that gives the method away, no detail without a
job. Judge a world as a visitor meets it, at their width and their pace of scroll, by day and by night.

## How it is built

- **The component**: `footer.html` (a four-corner grid: brand top left, sitemap top right, sign-off bottom
  left, and the view, scene picker then day/night toggle, bottom right; on mobile brand, sitemap, view,
  sign-off), `footer.css`, `footer.js` (mounting worlds, the picker, the theme, the film clock, the rest
  timer, parallax) and `early.js`, which settles `data-world` and `data-theme` on the root before the first
  paint. A host page sets `--footer-sans` and `--footer-serif` for the footer's type; the footer's measures
  live on `.site-footer`, so the host keeps its root. A host can choose a world from anywhere by dispatching
  `footer:choose` on `document` with the world's id as `detail`.
- **`sites/<site>.html`**: each site's footer content, by slot (`BRAND`, `SITEMAP`, `SIGNOFF`). `SITES` in
  `component.ts` gives each site its worlds in picker order (the first opens), the key it keeps a visitor's
  choices under, and the light it opens in.
- **`page.html`**: the Automaton demo around the footer: a product's home whose one long sky deepens into
  the footer's horizon, and the scroll progress indicator (`journey`, whose marker is the `traveller`; a
  page without a journey stage simply has no traveller).
- **`component.ts`**: for each world in `WORLDS`, its generator's `placeholders()` fills the holes in its
  `art.html`, `style.css` and `life.js`; the CSS is scoped (`assemble/scope.ts`), the markup unfolded and
  pruned (`assemble/unfold.ts`, see Motion), and the result goes into an inert `<template>`. Only the chosen
  world is ever in the document. **`build.ts`** writes the demo, or a site's kit.
- **`crayon/`**: wax on paper as vector. `hand.ts` is a `Hand` that lays strokes as strands, colours shapes
  in and winds spirals, keeping the time it took over each so a page can replay the drawing; `shapes.ts` holds
  the shapes made with it (`poppy`, `tulip`, `bud`, `leaf`, `stem`) and the `Sheet` that keeps their clips.
  Colours are names (`class="k-<name>"`), so one drawing serves day and night. The crayon world and delineate's
  opening drawing both use it.
- **`lib/`**: what every generator shares. `geometry.ts`: `catmull`, `poly`, `smooth`, `bezier`, `resample`,
  `ribbon`, `pressure`, `ellipse`, and `spans`/`unionOutline` for inside-tests and outlines. `svg.ts`:
  `dataUri` and `tile`. `template.ts`: `fill`. `random.ts` and `number.ts` keep every drawing as it was drawn
  (see their headers); `f` writes a coordinate.
- **`worlds/<id>/`**: `gen.ts` (the procedural parts; `placeholders()`, which draws afresh on every call; and
  the picker's 16 × 16 `GLYPH`),
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
| `crayon` | Crayon on paper: an evening valley, a lane climbing through fields to a hamlet under a low sun. By night the same strands on dark paper, where wax reads as pastel, with stars and lit windows. It draws itself each time it comes into view. |

Each `gen.ts` opens with the reasoning behind its medium; read it before changing the world.

## Motion and its cost

Idle life must cost nothing at rest and little awake. These rules came from measuring, not taste.

- **A film clock, not the display's.** CSS animations in the footer stay paused (`--footer-play`); the
  shell steps every one's `currentTime` 24 times a second, both panes together so they never drift.
  Moving SVG repaints its layer each frame, and 24 frames instead of 120 is a fifth of the paint.
- **Rest.** Eight seconds after the last pointer, wheel, scroll, key or touch, the clock stops and each
  world's canvases pause through `setVisible`; the next input wakes them.
- **Nothing animates inside `<defs>`** (`.defs { --play: paused }`). An animated original restyles every
  `<use>` clone each frame, and a clone's animations cannot be reached from script. So the build unfolds
  any `<use>` whose drawing animates into an inline copy (`unfoldLife`) and drops definitions nothing
  refers to any more (`pruneDefs`). `data-still` keeps a clone frozen on purpose, as the desert's shadows are.
- **Move the outermost thing that moves whole.** The tram's bounce is on its HTML `<svg>`, a composited
  layer, not inside the scene.
- **Canvases run at 30 fps** and clear only what changed.
- **Planes wake in turn** (`--wake`, 50 ms apart), so a theme switch never repaints every plane in one frame.

Measured at 1440 × 900 @2x: at rest, 0 ms a second on the main thread and the GPU; awake, the GPU spends
about 33 ms a second on Alfama, 220 on Desert and 130 to 218 on the Deep; scrolling holds 120 fps in every world.

## What the work taught

- **Night is lighting, not a filter.** Choose the one light that matters, as the Glasshouse glows from within,
  and redraw for it: luminous glass, black iron and silhouettes against it, rims only where the moon falls.
  Such a night switches with no slow frames; a filtered one (mezzotint grain, tone groups) looks dead and
  drops frames on the switch.
- **A component's keyframes carry its name** (`footer-rise`, `footer-reveal`). Keyframe names belong to the
  whole page: a bare `rise` would replace the host's own, and the host's animation would stop without a word.
- **A colour name can do more than tint.** The crayon world's `haze` is warm by day and a moonlit mist by night;
  `star` is clear by day and `lamp` is a dark pane by day, so the stars and the hamlet's lit windows come out
  only at night, from the one drawing.
- **Lay an open wash as long strokes, not a fill.** A fill tilts its passes a little and turns them back where
  they meet the shape's edge, and over a band of sky those turns leave small bars in the middle of it. Lay it
  as rows of long, overlapping strokes run past the sheet's edges.
- **Draw at scale.** Alfama's landmarks read only once placed at their true size and distance (`sk.place`);
  the observatory sheet reads as a drawing because every line weight and section symbol has a job.

## Checking the work

- In Chrome at `1440x900x2` and `390x844x3` (mobile, touch). Toggle the theme by clicking
  `.footer-view .theme-toggle`; writing `data-theme` directly is overwritten by the page.
- Record a performance trace, then `node footers/harness/tracebuckets.ts trace.json` for busy time per second
  on each thread, and `tracestat.ts` for totals and how often the page paints and rasters.
- `node footers/harness/contrast.ts <background.bmp> <boxes.json> <scale>` measures the WCAG contrast of footer
  text against the rendered scene.
