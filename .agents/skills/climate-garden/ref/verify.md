# Checking the garden

## Commands

- `npm run draw`: redraws every plant; fails on parts that open early. Run after any drawing edit.
- `npm run check`: types for the site, the drawing kit, and the portraits.
- `npm run build`: check, then a production build into `garden/dist` (a generated folder).
- `npm run look`: every layout by day and night, below.
- Dev server, from the repository root: `npx vite garden --port 5199 --strictPort`, in the
  background. The page's plant beds are written from `plants.json` on every load. In a sandboxed
  session the server may not see edits
  at all (polling did not help either): restart it after every source edit and wait until it
  prints its address before loading the page. Redrawn SVGs need only a reload.

## Looking at every layout

`npm run look <key>` (no key: every garden) draws the plants, serves the site, and opens each
garden fully grown on five screens, one per layout tier (phone, tablet, laptop, wide, short), by
day and by night. It writes the screenshots to `garden/look/<key>/<screen>-<light>.png` and prints
what a screenshot hides: how many plants each layout shows, the ones the solver left out, and any
whose paint reaches the controls. A phone is Chrome at a phone's width: no device emulation, no
throttling. It drives the system Chrome, which a sandboxed session cannot launch: run it outside
the sandbox.

Read the screenshots, not only the printout: a garden can pass every check and still look wrong.
Then judge each plant close up in the gallery, `/gallery/?garden=<key>`, which shows it by day and
by night beside its close study.

## Looking in Chrome

For what still screenshots cannot show (the growth as the page scrolls, a garden growing in after
the switcher, the tide), use the chrome-devtools tools on the dev server. Open
`http://localhost:5199/?garden=<key>`, reload with the cache ignored after each change, and scroll
in an evaluated script. The theme toggle saves its choice in the browser; click it back afterwards.
Performance is read from the code, not measured. The page writes only what has changed
(`renderGarden` in `src/main.ts`): a frame whose inputs have not moved is skipped, and each limb,
part, and waterline is compared with what it last wrote. Look for the two ways to break that: a
write made every frame whether or not its value moved, and a layout read (`offsetHeight`,
`getBoundingClientRect`) inside the render loop.
