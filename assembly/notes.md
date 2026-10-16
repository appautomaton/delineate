# Assembly

A page made in front of its reader by a crew of hands. Up to thirty-two pointers circle the name while the type loads,
then build each section as it scrolls into view, the way a design team works in a design tool: red column guides
pulled down first, frames dragged out corner to corner with their size badges, text typed key by key, a headline
set small and pulled up to size by its handle, crayon drawings laid stroke by stroke, and a row of labels typed
at once by several hands who clash, see it, and put it right. When the last section is done, the hands fly as one
flock after the reader's own pointer. `npm run assembly` builds the page and its studies into the system's
temporary folder and serves them at http://localhost:5310/, rebuilding as sources change; `npm run assembly:build`
writes `assembly/dist/` (not tracked), which the site builds too.

## The bar

The reference is a page built by a swarm of cursors; it is the floor, not the aim. Where it moves its cursors
like a machine, ours move like hands; where it builds plain boxes, ours draws. Judge it as a reader meets it, at
the pace they scroll: every frame of it should hold as a page, mid-build or done.

## How it is built

- **`hand/`**, the engine, in the browser:
  - `motion.ts`: how a hand carries a pointer to a target. A fast primary movement that lands near, more often
    short than long, then smaller corrections; times by Fitts's law; each movement minimum-jerk, its speed
    peaking before halfway, its path bowed.
  - `keys.ts`: how a hand types. Log-normal gaps, longer at word starts and after punctuation, a cost for
    capitals, and now and then a slip to a neighbouring key, seen a few keys later and taken back.
  - `clock.ts`: one clock every hand keeps time on, which can be slowed or paused.
  - `pointer.ts`: the pointer, made as paper things are made. The arrow is a folded paper dart, a lit face and a
    shaded one inked round in a deeper shade of the hand's colour, so a flock of them is a flock of paper planes;
    the nib, the registration mark, the lettered I-beam and the hairline darts for moving and pulling are cut the
    same way. The name tag is a paper slip, stuck on askew, each hand its own way.
  - `hand.ts`: a hand. It reaches, presses, drags, traces, follows recorded points and types, each act starting
    where the last ended on its own time line, so frame lateness never piles up.
  - `marks.ts`: what the tool lays over the page: frames with handles and badges, guides, the blue lines where
    edges align, and the rulers.
  - `crew.ts`: reads a finished page into work and deals it out. See its header for the kinds of work and the
    `data-build` marks a page uses to steer it.
  - `flock.ts`: the opening ring and the closing flock (boids, each hand seeking its own point about the target).
  - `space.ts`: where hands and marks are measured from: the page, or a stage set into another page, so the
    hands move with whatever holds the stage.
- **`drawings.ts`**: the crayon drawings, made with the Footers' crayon (`footers/crayon/`) when the server
  starts, each crayon hand's strands in a `<g data-hand>` so one pointer follows one group. The opening picture
  is a still life, a glass vase of flowers on a table, twenty-one hands at once: poppies, an anemone, tulips,
  asters, a daisy outlined white on white, lavender laid floret by floret, two fern fronds, a sprig of berries,
  buds, a butterfly and a fallen petal. The stems show through the glass, paler and set aside at the water line.
  Its shapes beyond the crayon's own (aster, daisy, lavender, fern, berries, butterfly, vase) are built here from
  the crayon's petal, stroke, line, spiral and colouring.
- **Type**: Hedvig Letters Serif for display and its sister Hedvig Letters Sans for reading, so the page speaks in
  one family; Fragment Mono for everything the tool says (tags, badges, rulers, the readout, code). Each comes in
  one weight, so the page sets `font-synthesis: none` and never asks for another.
- **`index.html`, `style.css`, `main.ts`**: the page the crew builds.
- **`show.ts`**, **`show.html`**, **`show.css`**: Assembly as delineate's page shows it, a sheet on which six
  hands build a miniature of its first screen, rest, clear it and build it again while it is in view.
- **`build.ts`**, **`dev.ts`**: the build, into any folder, and the dev server around it. The site builds
  Assembly at `assembly/` with the same `build`.
- The skill that makes pages like this one is `.agents/skills/assembly/`; what the work teaches goes here first,
  and into the skill once it holds.
- **`studies/pointers/`**: a specimen sheet of every pointer shape in the hands' colours, at four times size with
  the hot spot marked, at size on day and night paper, and tagged. Judge a change to a shape here first.

## What the work taught

- **Make the page first, then read it into work.** The page is written whole and laid out as it will stand; the
  crew measures it and works backwards. Nothing moves while it is built: untyped text is held in place,
  transparent, and a headline set small keeps its final height.
- **A hand's click is a design tool's click.** It selects; the page never hears it. A click dispatched to the
  page once followed the Source link to GitHub mid-build.
- **The pen's tip is where the newest wax goes down.** A crayon hand overlaps its shapes, so at any moment
  strands from two shapes are live. The tip is the head of the strands most lately begun; where it jumps, the
  hand lifts the pen and carries it, and the drawing waits.
- **Straight sides need many points.** The crayon smooths an outline through its points, so four corners make a
  blob. Lay each side as close points and the corners only soften.
- **A long passage is typed faster.** At one pace for all, one hand typing a paragraph keeps the page waiting
  while thirty-one stand about.
- **A flock seeking one point packs into a block.** Each hand seeks its own point circling the target, most one
  way and a few the other, and the flock swirls like a school.
- **A mask clips to its box.** The bouquet's fade cut its flowers off at the column's edge; the box runs to the
  screen's edge instead, and only its foot fades.
- **Shade glass along its curve.** A shade laid as a patch, the crayon's way for a petal's fold, reads on glass as
  a stain. A few soft strokes inside the far side, following the bulb round, read as glass.
- **A picture that is whole fits the first screen whole.** The still life is sized by the screen's height as well
  as the column's width, so its table never slips under the readout.
- **A tool's marks are hairlines.** At four times size a crosshair drawn at a pointer's weight reads as a rifle
  scope, and four darts round a point as a throwing star. A registration mark is fine lines; a move or resize
  pointer is fine lines with small heads at their ends.
- **The watcher needs file events.** Inside the sandbox, `fs.watch` fails with EMFILE; the dev server runs
  outside it.
