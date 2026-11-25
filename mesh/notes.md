# Mesh Gradient

A pure 4-tile `8 + 4` responsive Bento Grid of physical optical mesh studies rendered in WebGL2 GLSL 300 es
with OKLab colour science, single-family Fontshare studio typography (`Cabinet Grotesk` + `IBM Plex Mono`),
autonomous vertical backlit-vessel scrolling, and nonlinear spring scroll & morph choreography — with **zero
banner, zero hero, and zero dedicated header**, fitting all four live optical media cleanly inside one
`1440 × 900` desktop viewport: **01 Frosted Halo** (anisotropic frosted morphing halo on pure porcelain /
obsidian), **02 Thin-Film Crystal** (precision-cut raymarched dispersive crystal floating directly on pure
porcelain / obsidian with zero painted sky-box), **03 Atmospheric Plumes** (wide 8-col Swiss editorial
triptych of analytical asymmetric silk-curtain plumes), and **04 Backlit Vessels** (full-height right-hand
`#070A10` Turrell obsidian vertical totem of six autonomous auto-scrolling backlit superellipse vessels with
17-tap vertical anamorphic blur), grounded by one frameless bare-ground colophon bar below.

- `types.ts`: shared geometry and frame contracts (`PLATES`, `VEIL_SHAPES`, `PLUME_SHEETS`, `PRISM_SHAPES` =
  `["spool", "dome", "diamond", "tetra", "slit"]`, `LANTERN_SPECS`, `RendererOptions`, `PlateFrame`,
  `Viewport`, `OpticalPalette`), `isVerticalLantern(w, h)` (`h > w * 1.05`), and the pure layout functions
  `getPlumeSheetRects(w, h)` and dual-axis `getLanternSlotRects(scroll, w, h)` shared identically by GLSL
  uniforms and HTML overlays.
- `palette.ts`: OKLab colour math (`lab`, `srgb`, `lerpOklab`, `lerpPalette`, `hexToSrgb`, `css`), `STAGE_TONES`
  (porcelain `#FCFCFB` Day / deep obsidian `#070913` Night), and three curated OKLab palettes per plate (`PALETTES`).
- `shaders/common.ts`: shared GLSL 300 es header with OKLab interpolation, C2 quintic simplex noise,
  rounded-box corner masking, cross-channel filmic emission, and triangular-PDF IGN anti-banding dither.
- `shaders/veil.ts`: creaseless decoupled `sigmaOuter`/`sigmaInner` analytical `erf` convolution across four
  rounded 2D SDFs (`squircle`, `circle`, `reuleaux`, `pentagon`), lower-right inner contrast pool behind the
  1.2 px specular crescent, sandblasted acrylic frost tooth in the crisp penumbra, and decoupled radial
  zero-cutoff fade into the tile ground.
- `shaders/prism.ts`: bounding-sphere early-out raymarching (`r = 0.94`, 48 steps with sub-pixel cone-coverage
  silhouette AA) + single 14-step exit trace with 2-step `d = 0` snap and analytical R/G/B Cauchy dispersion
  for ripple-free precision-cut `spool`, `dome` (dished equator planes for zero aliasing), `diamond`, and
  `tetra` crystals floating directly on pure `uGround` (`#FCFCFB` porcelain / `#070913` obsidian) with Airy
  thin-film Fresnel caustics (zero painted sky-box, zero circular Phong dots).
- `shaders/plume.ts`: 4-tap curl-warped analytical asymmetric silk-curtain folds with autonomous 3-chord
  multi-hue evolution, Night top-left `typeCalm` contrast guard across three gallery sheets (`wash`, `bloom`,
  `emission`), or one full-bleed sheet when `compact > 0.5`.
- `shaders/lantern.ts`: six superellipses (`n = 4.6`) with thick corner Fresnel rims, velvet cavities, six
  jeweler-fine procedural motifs (`Tangent`, `Aperture`, `Cipher`, `Foci`, `Warp`, `Reeded`), and a two-pass
  `RGBA8` FBO + 17-tap hash-jittered dual-axis (Y-axis vertical / X-axis horizontal) anamorphic motion blur pass.
- `renderer.ts`: `MeshRenderer(canvas, options?)` (aliased as `LumenRenderer`) supporting selective per-plate
  program & FBO compilation (1 shader per bento tile on `mesh/`; all 4 plates in 1 context on `.mesh-show`),
  top-left CSS `Viewport` scissoring, rounded-corner masking, and clean disposal.
- `physics.ts`: closed-form analytical damped harmonic oscillator (`Spring`, clamped to `dt <= 50 ms`) and
  `VelocityTracker` driving nonlinear scroll-velocity surge (`ω = 14, ζ = 0.34`), shape morph overshoot,
  autonomous/interactive carousel fling inertia, pointer steering, and smooth palette/light easing.
- `show.ts` & `main.ts`: mounts the pure 4-tile `8 + 4` Bento Grid (Desktop `12-col`, Tablet `6-col`, Mobile
  `1-col`), adaptive `24 / 60 fps` frame pacing (24 fps calm ambient film cadence ramping to 60 fps during
  interaction, morphs, or glides), per-tile optimal DPR caps (`plume: 1.0`, `lantern: 1.35`, `veil: 1.5`,
  `prism: 1.65`), autonomous `2.6 s` vertical spring auto-scrolling on Lantern yielding instantly on
  hover/drag/click and resuming `3.8 s` after leave, passive nonlinear scroll surge routing, staggered
  out-of-phase morphs (`Veil ~4.2 s`, `Prism ~5.1 s` offset `2.3 s`), strict per-tile `IntersectionObserver`
  GPU culling (`0%` off-screen draws), zero-reflow `Cabinet Grotesk` variable typography, `1 px` `.plume-rule`
  hairlines, bare-ground colophon controls synced to `delineate-theme`, and deep-link query params (`?plate=`,
  `?light=`, `?palette=`, `?shape=`, `?still`).
- `card.ts` & `card.css`: the four-window landing-page preview card (`.mesh-show`), sharing ONE WebGL2 canvas
  across a `4 × 1` desktop (`2 × 2` narrow) grid on delineate's `--paper`/`--ink` tokens (`01`–`04` tabular
  `IBM Plex Mono` numerals + `Cabinet Grotesk` names), syncing hovered slots to `mesh/?plate=<plate>`, caching
  rects strictly inside `ResizeObserver`, pacing ambient drift at `24 fps` (including during host-page scroll)
  and ramping to `60 fps` on hover or spring motion, and sleeping completely off-screen.
- `npm run mesh`: serves Mesh Gradient at http://localhost:5400/, rebuilding on save.

## Rules

1. **Zero banner, zero hero, zero header — pure 4-tile `8 + 4` gallery fitting one screen.** Every optical
   medium speaks directly without coloured navbar banners or developer jargon; global controls live on a bare
   neutral colophon line beneath the grid. Each tile compiles only its own shader via
   `new MeshRenderer(canvas, { plates })` and sleeps off-screen (`0%` GPU/CPU). The landing card shares one
   4-plate WebGL2 context using `gl.viewport` and `gl.scissor`.
2. **One disciplined Fontshare studio grotesque (`Cabinet Grotesk` + `IBM Plex Mono`).** Never clash three
   competing display voices. Set tile titles (`540`), Plume poster headlines (`560` paper / `450` obsidian),
   and Lantern vessel labels (`560 → 250` optical DOF on `contain: layout style` spans) in `Cabinet Grotesk`,
   and tabular indices `01`–`04`, Plume micro-specs, and specimen links in `IBM Plex Mono`. Keep Plume's
   2-column Swiss poster grid uncollapsed above `145 px` sheet width with real `1 px` `.plume-rule` hairlines.
3. **Unified porcelain/obsidian ground for Veil and Prism.** Never paint a separate bright blue/teal box behind
   3D crystals; float Prism solids directly on `uGround` (`#FCFCFB` Day / `#070913` Night) with crisp grazing
   thin-film Fresnel edges and zero circular Phong dots.
4. **Autonomous vertical Lantern motion with instant human priority.** In `Drift` mode, Lantern pauses `2.6 s`
   at razor center lock, launches an elastic `Spring` step vertically with anamorphic light trails, pauses
   immediately on pointer hover/drag/click, and resumes `3.8 s` after leave — keeping `touch-action: pan-y`
   unblocked on touch screens.
5. **Shader and overlay geometry share one source of truth.** `getPlumeSheetRects`, `isVerticalLantern`, and
   `getLanternSlotRects` in `types.ts` govern both shader uniforms and DOM placement so editorial typography
   locks to 0.0 px in both vertical and horizontal orientations.
