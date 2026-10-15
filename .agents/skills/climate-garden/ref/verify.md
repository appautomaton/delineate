# Checking the garden

Paths here are inside `garden/`, unless they start with it.

## Commands

- `npm run draw`: redraws every plant; fails on parts that open early. Run after any drawing edit.
  `node garden/draw/draw.ts --check [<garden>]` runs the same check and writes nothing; a draw
  limited to one garden skips the anchors and fields the page and the solver read, so finish with
  a full draw.
- `npm run check`: types for the garden, the drawing kit, the portraits, and the repository's other
  pieces and tools.
- `npm run build`: check, then the garden built into `garden/dist` (a generated folder), its
  scripts compiled a module to a file, to serve as it stands, at a domain's root or under any path.
- `npm run look`: every layout by day and night, below.
- `npm run dev [-- <port>]`, from the repository root, in the background: draws the plants, builds
  the garden, serves it, and builds it again whenever a source changes, every open page reloading
  itself. Where file watching is unavailable (some sandboxes), it never sees an edit: restart it
  after each one and wait for its address before loading the page. Redrawn SVGs need only a
  reload.

## Looking at every layout

`npm run look <key>` (no key: every garden) draws the plants, serves the site, and opens each
garden full (fully grown, or in full leaf at late spring for a garden that shows a year) on five
screens (phone, tablet, laptop, wide, short), by day and by night. The laptop is already past the
first wider tier, so the base landscape tier (a screen between square and 1200px wide) is seen
only in a browser. A garden
that shows a year is then shown on a laptop at summer, early autumn, late autumn, and winter
(`laptop-<season>-<light>.png`), pinned through the address; any moment opens the same way,
`/?garden=<key>&u=0.82`. It writes the screenshots to `garden/look/<key>/` and prints
what a screenshot hides: how many plants each layout shows, the ones the solver left out, and any
whose paint reaches the controls. A phone is Chrome at a phone's width: no device emulation, no
throttling. It launches the system Chrome, so it must run where Chrome can start.

Read the screenshots, not only the printout: a garden can pass every check and still look wrong.
Then judge each plant close up in the gallery, `/gallery/?garden=<key>`, which shows it by day and
by night beside its close study.

## Looking in Chrome

For what still screenshots cannot show (the growth as the page scrolls, a garden growing in after
the switcher, the tide), drive a browser on the dev server. Open `/?garden=<key>`, reload with the
cache ignored after each change, and scroll from a script. The theme toggle saves its choice in the browser; click it back afterwards.

## Performance

Read from the code, not measured. The page writes only what has changed (`renderGarden` in
`src/main.ts`): a frame whose inputs have not moved is skipped, and each limb, part, and waterline
is compared with what it last wrote. Look for the two ways to break that: a write made every frame
whether or not its value moved, and a layout read (`offsetHeight`, `getBoundingClientRect`) inside
the render loop.
