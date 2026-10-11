# Checking the garden

## Commands

- `npm run draw`: redraws every plant; fails on parts that open early. Run after any drawing edit.
- `npm run check`: types for the site, the drawing kit, and the portraits.
- `npm run build`: check, then a production build into `garden/dist` (a generated folder).
- Dev server, from the repository root: `npx vite garden --port 5199 --strictPort`, in the
  background. The page's plant beds are written from `plants.json` when the server starts, so
  restart it after the plant list changes. In a sandboxed session the server may not see edits
  at all (polling did not help either): restart it after every source edit and wait until it
  prints its address before loading the page. Redrawn SVGs need only a reload.

## Looking in Chrome

Use the chrome-devtools tools.

1. Open `http://localhost:5199/?garden=<key>`; the address overrides any saved choice. Reload with
   the cache ignored after each change.
2. Grow it fully before judging: scroll to the bottom and wait about 4.5 seconds
   (`scrollTo(0, document.body.scrollHeight)` in an evaluated script, then a timeout).
3. Take the screenshot. Check three sizes: a laptop (about 1440 by 900; the viewport comes out a
   little smaller than the window), a wide screen (1760 by 1050 gives a viewport near 1600, where
   the wide-screen plants appear), and a phone (430 by 900).
4. Night: click `[data-theme-toggle]`, grow again, look. The toggle saves the choice in the
   browser, so click it back afterwards.
5. Per plant: `/gallery/?garden=<key>` shows each plant by day and night beside its close study.
   Scroll to its heading (`h3`) and look there before judging it in the garden.

Report which plants a layout left out (`.plant[data-crowded]`) if any; the solver drops them
silently.

## Weight

Gzip each drawing and total the garden:
`for f in garden/public/garden/<key>.svg; do gzip -c $f | wc -c; done`. Aim near 50 KB per plant;
the desert totals about 250 KB and Afroalpine about 410 KB. Name the heaviest plants in the report
when a garden runs over.
