---
name: embroidered-micrographic
description: >
  Make or change Patch (patch/): a six-badge (2026–2031) homologous <svg> ↔ WebGL2 (#version 300 es)
  embroidered specimen sheet rendered through ONE shared WebGL2RenderingContext and ONE compact
  3×2 baked field atlas (< 28 MB VRAM, 0.0 fps true idle sleep) with zero runtime dependencies.
  Covers six closed-form C^1 Merrow silhouettes (Rounded Rect, Mission Roundel Circle, Pointed Heritage
  Shield, Rounded Flat-Top Hexagon, Horizontal Stadium Capsule, Cathedral Arch), four physically distinct
  woven substrates (2/1 Z-twill & Cavalry Twill, isotropic Melton Wool Felt, 1/1 unbleached Natural
  Cotton Duck Canvas, and orthogonal double-thread Ripstop Nylon), multi-thread optical reflectance
  (40wt Glossy Rayon, Matte Spun Cotton, Metallic Bullion), Pointer-X hover split curtain revealing the
  0.00 px registered DOM <svg> blueprint, and a Click-to-Inspect dual-plate modal with .svg export.
  Use when authoring or editing badges, silhouettes, weaves, shaders, hover registration, or frame
  pacing, even if the user never says "skill".
---

# Embroidered Micrographic (`patch/`)

A museum specimen sheet of six annual embroidered patches (`2026`–`2031`) woven in real time on the GPU
directly from homologous standalone `<svg>` blueprints.

## The bar

- **Physical embroidery, never beveled plastic.** Every thread is an opaque bundle of cylindrical fibers
  sitting *above* its depressed woven textile substrate—never a translucent emboss filter letting twill
  or canvas bleed through letter strokes.
- **0.00 px homologous monochrome `<svg>` ↔ WebGL2 registration on a stochastic tabletop.** Every badge is
  authored once as a declarative list of SVG path operations (`data-layer="recessed|main|proud"`,
  `data-thread="0|1|2|3"`, `data-region="satin|star|tatami_a|tatami_b|proud|rail"`) in shared badge
  coordinates (`viewBox="-390 -280 780 560"`). On load (and via `Shuffle`), the six badges rest directly
  on bare `--paper` with balanced stochastic tilt angles (`±2.4°..±6.6°`) and tabletop XY scatter shared
  bit-for-bit between CSS `transform` (on `.card-svg-pose`) and GLSL `uPose` (with room-locked key lighting
  rotated into badge-local space). Sweeping the Pointer-X cinnabar split hairline (`ω = 24, ζ = 0.88`,
  outer `.card-svg-clip` + `uSplit`) across any tilted patch peels its left side cleanly back to the
  monochrome `<svg>` CAD blueprint with `0.00 px` seam registration.
- **Extreme WebGL2 efficiency contract:**
  - **ONE shared `WebGL2RenderingContext`** (`1` `<canvas>` overlay—`position: absolute; inset: 0` inside `.patch-shell` for native compositor-locked scrolling & trackpad rubber-banding at `0.0 fps`, switching to `position: fixed` only when `.is-modal` locks the viewport—rendering via `gl.scissor` + `gl.viewport` from `ResizeObserver`-cached rects with zero `getBoundingClientRect()` inside `requestAnimationFrame` or `scroll`).
  - **Compact `3×2` baked atlas (`2160×1040`, `25.71 MiB / 26.96 MB < 28 MB` VRAM):**
    - `uDistAtlas` (`RG16F`, `4 B/px`): `R = dMain`, `G = dRecessed` (full 16-bit float SDFs resolved from
      `2×` supersampled `1440×1040` JFA).
    - `uOrientAtlas` (`RGBA8`, `4 B/px`): `(halfWidth/16, Jx, Jy, dProudPacked)`.
    - `uAuxAtlas` (`RG8`, `2 B/px`): `(wTatami, aoCrowd)`.
    - `uMetaAtlas` (`RG8 NEAREST`, `2 B/px`): `(regionCode, packed 3-layer thread IDs)`.
    - All temporary `2×` JFA `RGBA16UI`/`RG16UI` textures, bake FBOs, Tier-A programs, and 9 temporary 2D
      scratch canvases (`width = height = 0`) are freed immediately after startup bake.
  - **Strict `0 / 60 fps` pacing:** Phase-locked `60 fps` (`1000/60`, `3.5 ms` VSync slack) while any
    analytical `Spring` moves; cancels `requestAnimationFrame` completely (`0.0 fps`, `0%` CPU/GPU) at rest.
- **Six exact-arclength `C^1` Merrow silhouettes (`patch/shapes.ts` ↔ `patch/shader.ts`):**
  1. `2026 APEX` — Rounded Tactical Rectangle (`683×419` outer, `R = 45`), `31.5°` Carbon `2/1` Z-Twill
  2. `2027 PELAGIC` — Circular Mission Roundel (`R = 224`), Matte Navy Melton Wool Felt + Champagne Gold Metallic Bullion
  3. `2028 FLORA` — Pointed Heritage Shield (`C^1` internally-tangent flank & tip arcs), Natural Unbleached Cotton Duck (`1/1` basket weave + matte spun cotton + sunlit warm-tan micro-moat)
  4. `2029 HELIOS` — Rounded Flat-Top Regular Hexagon (`R_outer = 252, r = 36`), `38°` Espresso Cavalry Twill
  5. `2030 KINETIC` — Horizontal Stadium Capsule (`halfStraight = 148, R = 178`), Olive-Sage Tactical Ripstop Nylon (`18 px` orthogonal double-thread cords)
  6. `2031 RELAY` — Cathedral Arch Mission Vault (`W = 200, R_arch = 200, rBot = 36`), Prussian Cobalt `2/1` Z-Twill
  - All perimeter harmonics (`phiM`, `phiGap`, inner foundation lockstitch `segPhase`, and `tailMask`)
    are strictly quantized & periodic in `sPhase = (mg.s / mg.L) * TAU` for zero `12 o'clock` seam scars.
- **Digitizing discipline & multi-thread optical physics:**
  - Minimum stitchable width `≥ 2.5 px`; morphological opening `Dilate_R(Erode_R)` at `R_tatami = 6.5 px`
    separates mitered Satin columns (`3×3` nematic complex phasor) and 5-facet mitered stars from
    uncorrelated long-short fibrous Tatami fills (`17–26 px` variable spans); `region = rail` (`240`)
    guarantees narrow accents stay 100% perpendicular Satin even on top of Tatami.
  - Shifted-tangent dual-lobe Kajiya-Kay/Marschner reflectance supports Glossy 40wt Rayon, Matte Spun
    Cotton, and conductor-tinted Metallic Bullion, with analytical Gaussian band-limiting, Toksvig
    variance-to-roughness, premultiplied-alpha linear-light drop shadows, and IGN 8-bit dither.
  - Slashed `0` is reserved for `2026 APEX`'s tactical seal numeral (`plate2.jpg` parity); all other
    numerals use a clean open geometric oval `0` so small stitch counters never clog.

## Architecture

- `patch/physics.ts` — Closed-form damped harmonic `Spring` presets (`pointer`, `peel` `ω=24 ζ=0.88`, `ease`, `loupe`).
- `patch/glyphs.ts` — Full `A–Z`, `0–9`, punctuation CNC-aligned geometric monoline alphabet emitting pure `M/L/C/Z` SVG path strings (linear, clockwise arc, and upright lower arc).
- `patch/shapes.ts` — Locked closed-form `C^1` silhouette geometry & parallel-offset SVG path generators shared bit-for-bit with GLSL `evalMerrowGeom()`.
- `patch/badges.ts` — Declarative homologous `<svg>` definitions, Day/Night blueprint & standalone `.svg` exporter, and zero-readback 2-pass Canvas2D bake rasterizer for `2026`–`2031`.
- `patch/shader.ts` — Tier-A `2×` JFA+1 / morphological opening / atlas MRT resolve shaders and Tier-B single-pass 6-shape / 4-weave / 4-thread optical render shader.
- `patch/renderer.ts` — Single-context `PatchAtlasRenderer` baking the `3×2` `25.71 MiB` atlas once and immediately deleting all JFA scratch resources & temporary 2D canvases.
- `patch/show.ts` & `patch/main.ts` — `3×2` specimen grid, Pointer-X hover split curtain, global `Stitch · Split · Blueprint` + `Shuffle` + `delineate-theme` Day/Night colophon, and Click-to-Inspect Dual-Plate Modal (`?badge=2026..2031`).
- `patch/card.ts` & `patch/card.css` — Single-badge landing card leading `delineate`'s `.lineup` row (`1×1` `720×520` `4.28 MiB` tile, synced to `data-theme="night"`, Cinnabar Pointer-X split hairline, `0.0 fps` idle sleep).
- `patch/look.ts` — Ephemeral-port (`port: 0`) real-Chrome QA capture & strict GPU/idle/DOM verifier saving 14 plates + `telemetry.json`.

## Done means

`npx tsc -p patch && npx tsc -p patch/tsconfig.node.json` pass with zero errors, `node patch/look.ts`
passes all assertions (`glContextCount === 1`, `atlasVramBytes < 28 MB`, `idleAfterLoadRafTicks === 0`,
`idleAfterHoverLeaveRafTicks === 0`, `glError === 0`, `consoleErrorCount === 0`, `docOverflowX/Y === false`),
and all 6 badges (`2026`–`2031`) read cleanly in Day, Night, Hover Split, SVG Blueprint, and Dual-Plate Modal views.
