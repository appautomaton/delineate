# The hands

## How they move (`hand/motion.ts`, `hand/hand.ts`)

- **Reaching**: a primary movement aimed near the target's middle, landing short more often than
  long and scattered by distance, then corrections until it lands inside. Time per movement by
  Fitts's law, `a + b·log2(D/W + 1)`, so a small far target takes about a second and two
  movements, a large near one under half a second and one. Speed is minimum-jerk, skewed to peak
  before halfway; the path bows a little, as a wrist turns.
- **Pressing**: a moment to be sure of the target (log-normal, about 0.1 s), then down.
- **Dragging** is slower than pointing (`tempo` 1.15 to 1.3).
- **Each hand keeps its own time line** on the shared clock, every act starting where the last
  ended, so frame lateness never piles into drift.

## How they type (`hand/keys.ts`)

Log-normal gaps about the pace; longer at a word's start and after punctuation; a capital costs the
reach for shift; about one key in eighty slips to a neighbour, is seen a few keys later, and is taken
back. A hand on show runs about 26 keys a second; a long passage runs faster still (up to 2.6
times), so one hand never keeps the page waiting while the rest stand idle.

## How many, how fast

- About one hand per 36,000 px² of screen, between 10 and 32.
- `tempo` 0.6 on a page, 0.55 on a small stage: quicker than people, moving as people move.
- Idle hands drift now and then (about one rest in five) and come back to the screen when it
  scrolls away from them. Too much drift is noise; none at all is a still life of pointers.

## Opening and closing (`hand/flock.ts`)

The hands circle the page's name while the type loads: a loose ring, each at its own radius and
pace. When the last section is done they fly as one flock after the reader's pointer. Each seeks its
own point circling the target, most one way and a few the other, so the flock swirls as a school
does; seeking one point packs them into a block. Every arrow points the way it flies.

## The pointers (`hand/pointer.ts`)

Made as paper things are made: the arrow a folded paper dart with a lit face and a shaded one,
inked in a deeper shade of the hand's colour, on a white rim; a nib for drawing; a printer's
registration mark for frames and guides; a lettered I-beam; hairline darts for moving and resizing.
The tag is a paper slip, stuck on askew, shown while the button is down. A tool's marks are
hairlines: drawn at a pointer's weight a crosshair reads as a rifle scope and four darts round a
point as a throwing star. Judge every change on `assembly/studies/pointers/` first.
