# Site

delineate's own page: one sheet of paper, the work lying on it, each piece shown as itself, and each section
opening the work it shows. `npm run site` writes it to `site/dist/` (not tracked), ready to serve as it stands,
at a domain's root or under any path: `node tools/serve.ts site/dist`. It draws the garden first
(`npm run draw`), and reads Paprika Girl as `npm run paprika-girl` last wrote it; that build needs the piece's
region maps, which are media and stay local.

## How it is built

- **`page.html`**: the page, with `{{NAME}}` holes for what is drawn. In order: the opening, a headline beside a
  crayon bouquet that parts as the page scrolls; Garden, plants from six gardens round its words, each
  growing as the Garden grows it while the bed crosses the screen; Footers, the component itself, so the section
  is the world; Characters, a field of letters; Portraits, Paprika Girl's planes, parted along the section's view
  timeline and tilted by the pointer; and the page's own footer, a crayon landscape in six planes. The corner
  button switches day and night for the whole page by pressing the footer's own switch, which keeps the light.
- **`build.ts`**: fills the holes and writes `dist/`. From Footers it takes the crayon world's generator for the
  foot of the page (under ids of its own, since the Footers section may show the same world), the crayon's
  grain, and the component built as a kit for this site (`footers/sites/delineate.html`). From Garden, its tokens,
  paint and anchors, and the plants the page's `PLANTS` names. From Portraits, Paprika Girl. Beside the page it
  writes the work each section opens, each as it stands on its own: the Garden at `garden/` (built by
  `garden/build.ts`, its paths relative to the page), the Footers demo at `footers/`, and Paprika Girl's
  separation page at `portraits/paprika-girl/`. Each wears the site's tab mark, since a page with no icon of its
  own has the browser ask for a `/favicon.ico` the site does not have.
- **`hero.ts`**, **`icons.ts`**: the bouquet and the icons, drawn with the Footers' crayon (`footers/crayon/`).
  `icons.ts` also draws the tab's mark, flat, since at sixteen pixels the grain is only noise.
- **`portrait.ts`**: splits a layered portrait into one standalone SVG per plane, each keeping the frame and
  only the definitions it uses.

## What the work taught

- **Grain is a mask on the drawing itself.** A crayon drawing draws on when it comes into view; then its grain,
  `TOOTH`, comes up as a CSS mask. Never clone a drawing for its grain: the clones duplicate clip ids, and
  Chrome then drops whatever those clips hold, whole petals and centres.
- **Motion on the wrapper, drawing on the `<svg>`.** Each plane is a `<div>` that moves, parts and places, around
  an `<svg class="wax">` that draws and grains. On one element, the two animations overwrite each other.
- **A frame keeps its drawing's proportions.** Set the bouquet's width and let its height follow, so only the
  page's edges cut it. A frame sized on both axes turns narrower than the drawing where a cap bites, and
  `slice` cuts the drawing down a line inside the page.
- **Words over a drawing clear the paper.** Where the lede lies over the bouquet, a radial of the page's own
  colour fades the crayon out beneath it, so it holds by day and by night with nothing to tune. A blur would
  read as glass, not paper, and repaint with every frame the drawing moves. The headline, large and dark, needs
  no clearing.
- **The foot moves on its own timeline.** Its planes rise from the moment the landscape shows until the page
  ends, and the sun or moon sinks to rest over the hamlet as they do. On the whole foot's timeline, words
  included, the motion would be spent before the landscape shows.
- **Place things in the sheet's units.** The orb and the narrow-screen slide are worked out from the slice's
  own scale (`--s`, from container units), so the sun stays over the hamlet and the hamlet stays in view at any
  shape of screen.
- **Fade into the paper.** No piece sits in a box: every edge that meets the page is masked to transparent,
  and stems and planes run on past the frame, so parting them never shows a cut end.
- **Each plant reads by its own silhouette.** Massed and overlapping, plants pile into one another and none can
  be told apart. Each stands clear of the others, overlapping only at the feet, back to front, never core over
  core; heights and depths vary, the corners are held by the tallest, and the roots sink into a foot that fades
  into the paper, so they read as a garden and not a specimen sheet. Work the row out from each plant's width
  (its height times its aspect ratio, in `anchors.css`) at the narrowest bed it must fit, and measure it there.
  The row along the foot needs a bed 1.4 times as wide as it is high; a narrower one keeps the plants to the
  bands above and below the words.
- **Grow a plant as the Garden does.** Scaling a plant up whole from its base makes every plant grow alike and
  none as it does. The bed runs the Garden's own growth, limbs extending and parts unfolding, pared down to
  one moment of the year; a plant from a garden that shows a year stops at late spring, its fullest.

## Checking the work

- Chrome at `1440x900x2` and `390x844x3`, by day and by night, scrolling the whole page; the corner button
  switches the light.
- The Footers section is the real component: its own checks are in `footers/notes.md`.

## Not yet done

- **Checks.** The opening is checked from `375x667` to `1920x1080`, the Garden bed at `390x844`, `768x1024`,
  `1024x768`, `1440x900` and `1920x1080`, and the foot at `390x844` and `1440x900`, by day and by night; the
  rest of the page at desktop width only. Performance needs tracing again. When the
  planes part mid-scroll, the festival plane's left edge and the sky's top still show.
- **Growth.** `page.html` carries a pared-down copy of the growth in `garden/src/main.ts`; a change to how the
  Garden grows must be made in both until they share a module.
- **Weight.** `index.html` is 7.0 MB, 1.7 MB gzipped; 3.7 MB of it is the kit's seven worlds, inlined as
  templates. Fetching a world when it is chosen would take that off the first load.
