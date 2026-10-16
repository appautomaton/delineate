# Checking it and showing it

Run `npm run assembly`, open http://localhost:5310/ in Chrome, and watch it as a reader would. The
dev server runs outside the sandbox: its watcher needs file events.

## Every change

1. **Type-check**: `tsc -p assembly` and `tsc -p assembly/tsconfig.node.json` (part of `npm run check`).
2. **The first screen**: the opening ring, then the build. Stop it at three random moments; each
   frame must hold as a page.
3. **Scroll it through** at a reader's pace, a section at a time, to the flock at the end. Move the
   pointer and watch the flock follow.
4. **Night**: switch the light mid-build. Paper, ink, crayons, hands and marks all follow.
5. **Widths**: emulate a tablet (about 820 × 1180) and a phone (390 × 844); reload at each, since
   the number of hands is set at load.
6. **Less motion**: the page is there, finished and drawn, with no crew and no opening.

To see how the work goes rather than how it looks, read `crew.stats` (total, done, busy, clashes)
from the page, or the readout at the foot of the screen.

## On the site

`npm run site` builds Assembly into `site/dist/assembly/` and draws its share card from its first
screen with less motion asked for. Serve `site/dist` and check the landing page's Assembly section:
the sheet builds, rests, clears and builds again while in view, by day and by night.

## Showing the user

Open it in Chrome for them, at the moment worth seeing, and say what to look at. Say plainly what
was checked, at which widths and lights, and what was not.
