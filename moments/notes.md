# Moments

Twenty monochrome micro-interactions drawn in code and driven by real, interruptible physics across five
materials: **rubber**, **viscous**, **mechanical**, **taut**, and **fluid**. Touch, drag, pluck, or spin
any tile directly; toggle **Loop** to watch the whole sheet breathe in staggered cadence; switch between
**Night** and **Day** to see the same geometry on obsidian or delineate's warm paper; turn on **Sound**
for subtle procedural cues synthesized per material.

- `physics.ts`: closed-form analytical damped harmonic oscillator (`Spring`), the five `MATERIALS` presets
  (`mechanical`, `rubber`, `taut`, `viscous`, `fluid`), exact area-preserving `squash()`, nonlinear easing
  curves (`easeOutQuart`, `easeInOutQuint`, `easeOutBack`), `VelocityTracker`, and SVG helpers (`svgEl`,
  `createStageSvg`, `stagePoint`, `uniqueId`, `createGooFilter`).
- `sound.ts`: zero-asset procedural Web Audio synthesis (`SoundEngine`) layering bandpass noise bursts with
  resonant oscillators through a master compressor (`click`, `tick`, `thump`, `pluck`, `bell`, `drop`,
  `confirm`), resuming suspended contexts cleanly instead of dropping the first gesture.
- `tile.ts`: the `TileSpec`, `TileInstance`, and `TileContext` contracts — shared `200 × 140` stage,
  `step(dt, elapsed)` returning whether still awake, `demo(cycleTime, dt)` synthetic choreographer for
  Loop mode, `trigger()` for keyboard activation, and `wake()` / `interact()` / `sound()` hooks.
- `tiles/rubber.ts`: *Stretch Toggle*, *Jelly Pad*, *Swipe Confirm*, *Squash Play*, *Worm Dots*.
- `tiles/viscous.ts`: *Gooey Tab Bar*, *Merge Drops*.
- `tiles/mechanical.ts`: *Detent Dial*, *Domino Row*, *Rocker Switch*, *Odometer*.
- `tiles/taut.ts`: *Paper Plane*, *Elastic String*, *Download Ring*, *Bell Toggle*, *Menu Morph*, *Checklist*.
- `tiles/fluid.ts`: *Tide Progress*, *Magnet Grid*, *Ripple Pad*.
- `tiles/index.ts`: the ordered 20-tile poster sequence, arranged so adjacent silhouettes contrast.
- `show.ts`: mounts the sheet, a curated subset (`slugs`), or a single focused `?tile=`, manages the shared
  `requestAnimationFrame` clock with automatic sleep when every tile settles, keeps per-tile Loop clocks so
  user interaction never causes a phase jump on resume, pauses out of view or when hidden, and honors
  `prefers-reduced-motion`.
- `card.ts` & `card.css`: the compact single-row (`3 × 1`) rotating preview card mounted on delineate's
  landing page (`.moments-show`), cycling slot-by-slot through all 20 controls on the host page's own
  `--paper` and `--ink` in Day and Night, opening the full interactive sheet on click.
- `main.ts`: the standalone page, syncing light with delineate's `delineate-theme` key, syncing the header
  grid dimensions across breakpoints, and supporting `?light=day|night`, `?mode=play|loop`, `?tile=<slug>`,
  and `?sound=on`.
- `npm run moments`: serves the sheet at http://localhost:5380/, rebuilding on save.

## Rules

1. **Analytical springs everywhere.** `Spring.step(dt)` uses the closed-form solution for underdamped,
   critically damped, and overdamped oscillators, so motion is identical at 60 Hz, 120 Hz, and 144 Hz and
   never explodes on a tab switch (`dt` clamped to 50 ms).
2. **One physics path for play and loop.** Loop mode feeds synthetic gestures via `demo(cycleTime, dt)`
   into the same targets and impulses as user pointer events. Calling `ctx.interact()` hands control
   immediately to the reader and pauses that tile's per-tile `demoTime` until idle; Loop-driven steps stay
   silent even when Sound is enabled.
3. **Volume is conserved under squash and stretch.** Any squashing body computes `(sx, sy) = (exp(s), exp(-s))`
   so area stays constant at every compression peak; floor squash stays world-aligned outside rotation.
4. **Polarity inversion uses real geometry clips or masks, never muddy grey.** *Tide Progress* clips dual
   white/dark numerals along the live sine waterline; *Gooey Tab Bar* masks inverted icons to the exact
   post-filter metaball silhouette; *Stretch Toggle* swaps track and thumb polarity across midpoint.
5. **Gooey filters stay isolated and generous.** Each viscous tile gets a unique filter `id` via `uniqueId`
   and a `160%` filter region (`-30%` offset) so blurred metaball necks never clip against a tight SVG bbox.
6. **Monochrome tokens only.** Tiles read semantic tokens (`--m-ink`, `--m-paper`, `--m-well`,
   `--m-well-deep`, `--m-mid`, `--m-soft`, `--m-border`, `--m-border-strong`, `--m-card`, `--m-lip`,
   `--m-ink-dim`, `--m-dial-hi/lo`, `--m-rocker-*`) and never hardcode hex colours, so Day and Night switch
   cleanly in one frame.
7. **Sleep when settled, cull off-screen per card, guard RAF re-entrancy, never force reflow in RAF.**
   In both Play and Loop modes, once a tile's `step()` returns `false`, `show.ts` and `card.ts` skip calling
   `step()`/`render()` on that tile until a pointer event or a `demo()` beat calls `ctx.wake()`. Therefore
   every `demo()` must call `ctx.wake()` whenever it triggers a move or drives continuous motion, and
   `schedule()` must guard against re-entrant `ctx.wake()` calls inside `frame()` (`inFrame`) so demo beats
   never spawn duplicate `requestAnimationFrame` loops. In Play mode, once every tile settles, the shared
   RAF cancels itself completely. Each `.moment-card` carries `contain: layout style paint` and its own
   `IntersectionObserver` visibility flag so off-screen tiles (such as on mobile 2×10) never tick or paint.
   Never call layout-reading APIs (`getComputedTextLength`, `getBoundingClientRect`) inside `step()`/`render()`,
   cache text/geometry before writing attributes, skip unchanged dot/tick/slab writes, and remove SVG blur
   filters while a gooey control sits at rest.
8. **Sound is always opt-in.** No `AudioContext` is created until the reader explicitly toggles Sound on.
