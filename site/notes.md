# Site

delineate's own page: one sheet of paper, the work lying on it, each piece shown as itself. `npm run site` writes
it to `site/dist/` (not tracked), ready to serve as it stands: `python3 -m http.server 5190 -d site/dist`. It
draws the garden first (`npm run draw`), and reads Paprika Girl as `npm run paprika-girl` last wrote it; that
build needs the piece's region maps, which are media and stay local.

## How it is built

- **`page.html`**: the page, with `{{NAME}}` holes for what is drawn. In order: the opening, a headline beside a
  crayon bouquet that parts as the page scrolls; Garden, a bed of plants from six gardens grown in as it crosses
  the screen; Footers, the component itself, so the section is the world; Characters, a field of letters;
  Portraits, Paprika Girl's planes, parted along the section's view timeline and tilted by the pointer; and the
  page's own footer, a crayon landscape in six planes. The corner button switches day and night for the whole
  page by pressing the footer's own switch, which keeps the light.
- **`build.py`**: fills the holes and writes `dist/`. From Footers it takes `crayon.py`, the crayon world's
  generator for the foot of the page (under ids of its own, since the Footers section may show the same world),
  and the component built as a kit for this site (`footers/sites/delineate.html`). From Garden, its tokens,
  paint and anchors, and the plants the page's `PLANTS` names. From Portraits, Paprika Girl.
- **`hero.py`**, **`icons.py`**: the bouquet and the icons, drawn with `crayon.py`. `icons.py` also draws the
  tab's mark, flat, since at sixteen pixels the grain is only noise.
- **`portrait.py`**: splits a layered portrait into one standalone SVG per plane, each keeping the frame and
  only the definitions it uses.

## What the work taught

- **Grain is a mask on the drawing itself.** A crayon drawing draws on when it comes into view; then its grain,
  `crayon.TOOTH`, comes up as a CSS mask. An earlier grain cloned each drawing, and the clones duplicated
  clip ids: Chrome then dropped whatever those clips held, whole petals and centres.
- **Motion on the wrapper, drawing on the `<svg>`.** Each plane is a `<div>` that moves, parts and places, around
  an `<svg class="wax">` that draws and grains. On one element, the two animations overwrite each other.
- **Fade into the paper.** No piece sits in a box: every edge that meets the page is masked to transparent,
  and stems and planes run on past the frame, so parting them never shows a cut end.

## Checking the work

- Chrome at `1440x900x2` and `390x844x3`, by day and by night, scrolling the whole page; the corner button
  switches the light.
- The Footers section is the real component: its own checks are in `footers/notes.md`.

## Not yet done

- **Links.** Portraits' picture links to `#`, and Garden's Open expects the Garden app at `garden/`; both wait on
  where the site is deployed. Garden fetches its plants from `/garden/…`, so it can live only at a domain's
  root until those paths follow Vite's base.
- **Checks.** Seen at desktop width only; `390x844` not yet. Performance was last traced before the grain became
  a mask. When the planes part mid-scroll, the festival plane's left edge and the sky's top still show.
- **Weight.** `index.html` is 6.5 MB, 1.6 MB gzipped; 3.7 MB of it is the kit's seven worlds, inlined as
  templates. Fetching a world when it is chosen would take that off the first load.
- **Language.** The generators are Python, as the Footers' are; the rest of the repository is TypeScript run by
  Node.
