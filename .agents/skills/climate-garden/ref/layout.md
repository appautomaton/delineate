# Placing plants

Paths here are inside `garden/`, unless they start with it.

A garden's layout file, `garden/src/garden/<garden>.css`, says which plants each screen shows and
where. Plants it leaves out are never fetched. Copy the media queries from an existing layout file.
The tiers:

- **Portrait phones:** the signature plant, one side, two or three in the bed.
- **Portrait tablets:** one or two more.
- **Landscape:** the full composition.
- **Wider landscape:** plants added into the gaps a narrower screen leaves, from a width each
  garden chooses (1200px in every garden, and a second step where the composition still has room).
- **Short landscape phones:** three to five plants.

A plant need not appear in every tier: a small filler may show only on wide screens.

Each plant gets `display: block` and four properties:

- `--x`, `--y`: where its base (from `anchors.css`) sits. Bed plants root a few units below the
  frame, `calc(100svh + var(--u) * n)`, so the ground is never drawn.
- `--h`: its height in `--u` units, about 1% of the screen's height in landscape (each layout
  sets `--u`). The tallest plant stands at about 55 to 85. Keep the order and rough proportion of
  real heights, compressed so a creeper still reads beside a tall herb; check against the
  garden's neighbors.
- `--flip: -1` mirrors a branch drawn left to right so it reaches in from the right.
- `--enter: x y` (optional) starts the plant off its place by those shares of its own width and
  height, in screen directions, and eases it in as it grows: side plants from beyond their edge
  (`0.4 0` on the right), bed plants from below (`0 0.3`). A garden that sets it opens wide and
  fills as the visitor scrolls; one that does not, grows in place. Decide per garden.

## Composition

- **Open sky, open ground.** The top stays empty except where a side branch reaches in or, in a
  garden with a canopy, a hanger enters on its host. Leave at least one stretch of bare ground
  between bed plants at laptop size; wider screens add plants into it.
- **Water in front, banks on the sides.** In a water garden, only aquatic or emergent plants root
  below the bottom edge (`calc(100svh + var(--u) * n)`), rising through the water; terrestrial
  shore plants and bamboo reach in from the left and right edges (`--x: 0%` and `100%`) above high
  water (`calc(100svh - var(--u) * <above-water>)`) so no plant base ever floats on the water.
- **Corners make sides.** A plant at `--x: 0%` or `100%`, rooted past a bottom corner, reads as
  reaching in from that edge, and the solver treats it as a side plant that may sink but never
  lift its cut base into view. A leaning young tree or a shrub branch fills a thin edge with real
  wood.
- **Keep clear of the controls** at the top right: a side branch there sits a third of the way
  down, not at the top, and on short landscape phones about half way, since its crown rises above
  its base. `npm run look` names any plant that reaches the controls and how far it must move down.
  One overlap is accepted: on portrait screens the controls span most of the top, so a plant
  hanging from the top may pass behind them, and look lists it anyway.
- **The solver** (`arrange.ts`) slides each plant a little along its edge and lets it sink a little
  into that edge to reduce overlap, then drops plants more than half covered, highest rank number
  first. Give filler plants the highest ranks. If a plant keeps disappearing, it is placed
  on top of another; move it rather than lowering its rank.
- **Paint order is `plants.json` order.** Put a plant that should stand behind others (a side
  shrub behind the signature trunk, a leaning tree behind low plants) earlier in the list.
