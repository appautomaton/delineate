---
name: climate-garden
description: >
  Build or extend a climate garden on this project's garden site (garden/): verify a roster of
  real plants, draw each plant with the garden/draw kit as growing watercolor-and-ink SVG, give the
  garden its day and night tokens, compose its layouts, and check it in Chrome. Use whenever the
  user wants a new garden or climate (savanna, fynbos, taiga, a water garden), a new plant in an
  existing garden, a plant redrawn or refined, a garden's composition changed (sides feel empty,
  plants crowd, the sky fills up), or a garden's botany checked, even if they never say "skill"
  or name the files.
---

# Climate garden

Project paths are relative to the repository root; `ref/` files are in this skill's folder. Load a
ref file when its step comes up, not before. `garden/climates.md` is the plan: the survey of
candidate gardens, the status of each, and what every garden built so far taught. Read its Status,
The test, and the lessons sections before starting; record what you decide and learn back into it.

## The goal

A garden a visitor can tell from every other by silhouette alone, before color: about twelve real
plants of one climate, drawn as one hand would draw them, growing in as the page scrolls, by day
and by moonlight.

- **Real plants.** Every plant exists and belongs to the climate. A garden need not keep to one
  place, but every name is checked against a flora before it is drawn.
- **One moment.** The system grows a garden once; it has no seasons yet. Pick the moment the
  climate looks most itself (the desert after rain, the alpine at any hour). Four-season climates
  and water gardens wait for system work described in `climates.md`.
- **An open top.** Nothing hangs from the sky. What hangs (lichen, mistletoe, spent flowers, fruit)
  hangs from a host and is drawn inside the host's drawing. Open land leaves the top empty.
- **Sides from beyond the frame.** Side plants are branches reaching in from an edge, or plants
  rooted past a bottom corner and leaning in. A thin edge takes real wood, not filler.

## How the site is built

- `garden/src/garden/plants.json` lists every plant: key, garden, rank (who is dropped first when
  space runs out), names, and the gallery's words. Its order is paint order.
- `garden/draw/<garden>.ts` draws the plants; `garden/draw/draw.ts` registers each (seed, drawing,
  close-study detail). `npm run draw` writes `garden/public/garden/<key>.svg`, the anchors and
  fields the page uses, and the gallery details, and fails if a leaf would open before its limb
  reaches it.
- `garden/src/tokens.css` holds every color: a day set and a night set, grouped by garden.
- `garden/src/garden/<garden>.css` places the plants per screen; `garden/src/garden/arrange.ts`
  then slides them apart.
- The garden is at `/?garden=<key>`; the token gallery, every plant by day and night beside its
  close study, at `/gallery/?garden=<key>`.

A new garden touches eight places: `plants.json`; `draw/<garden>.ts` and its registry entries in
`draw/draw.ts`; a materials and a species group in both sets of `tokens.css`; an entry with an
emblem in `src/garden/gardens.ts`; its line in the garden-hiding rule of `src/garden/paint.css`;
`src/garden/<garden>.css`, imported in `src/main.ts`; and its section and status in
`climates.md`.

## Workflow

1. **Verify the roster.** Send a research agent the brief in `ref/botany.md`, in the background.
   It returns accepted names, where each plant grows, drawing facts, corrections, and gaps. Decide
   the roster from it: roles, the moment, honest hangers, about twelve plants.
2. **Record it** in the garden's section of `climates.md`: the table, the corrections, what stays
   unresolved, the sources.
3. **Scaffold the garden with its signature plant only**: the eight places above, one plant, one
   layout. See `ref/drawing.md` for tokens and the emblem.
4. **Draw the signature plant until it sets the manner,** then show it to the user before the
   rest. It takes several rounds; the others go faster once it is right. See `ref/drawing.md`.
5. **Draw the rest in one batch,** then judge each in the gallery, by day and by night, and give
   the failures a second pass. Most failures are known: check the lessons in `climates.md` and the
   traps in `ref/drawing.md` first.
6. **Compose.** Lay out each breakpoint; leave open sky and open ground; fill thin sides with
   real wood. See `ref/layout.md`.
7. **Verify.** `npm run draw`, `npm run check`, `npm run build`; look at the garden at laptop,
   wide, and portrait sizes, by day and by night; weigh the drawings. See `ref/verify.md`.
8. **Record and report.** Update the status and add "What the <garden> taught" to `climates.md`.
   Tell the user where to look, what changed, and what is still off.

## Working rules

- The roster, the drawings, and the layout are yours to decide. Decide, build, show; the user
  corrects. Ask only where the choice is theirs (which garden next, a plant they may not want).
- Judge at garden size. A drawing that reads in the gallery's close study can vanish at the size
  it is placed; a flower under about eight pixels is lost.
- Draw back to front, and build volume from parts: a mass painted behind a shrub reads as a rock.
- Improve rather than preserve. An earlier drawing is not a specification.
- When an approach fails, delete it. Keep only code the drawings use.
- Reuse the kit before writing new geometry, and when a second garden needs a helper that lives in
  one garden's module, move it into a shared module then, named by what it is, not by the plant it
  first served.

## Routing

| Step | Load |
|---|---|
| Verifying a roster, briefing the research agent | `ref/botany.md` |
| Drawing a plant, growth markup, tokens, the emblem, a drawing that looks wrong | `ref/drawing.md` |
| Placing plants, breakpoints, sides, crowding | `ref/layout.md` |
| Running the site, looking in Chrome, sizes, the build | `ref/verify.md` |
