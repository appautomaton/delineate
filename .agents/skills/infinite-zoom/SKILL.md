---
name: infinite-zoom
description: >
  Make or change Zoom (zoom/): an 18-stage (s00-s17) off-center asymmetric 6x-per-stage
  (46.53 dyadic octaves = 10^14x, ~3m 10s meditative cruise) closed-loop procedural animated
  SVG infinite world built in delineate's archival copperplate non-scaling burin engraving,
  pressured calligraphic ink ribbons, shifted double-glaze mineral watercolors, @kiuzyx
  architectural density, @claudeai outline-free dry-brush foliage & broken water reflections,
  and 2 AM nocturnal lighting, with zero runtime dependencies, zero SVG filter blurs, a 4-5 slot
  O(1) front-to-back proscenium portal stack, C2 zero-overshoot off-center camera spline,
  pre-cached living SVG animations, Spring pointer parallax, and Day/Night delineate-theme sync.
  Use for authoring or refining a stage scene, tuning non-scaling burin hatching / calligraphic
  ribbons / watercolor glazes / @kiuzyx facades / @claudeai dry-brush foliage / Day-Night tokens,
  adjusting off-center portals, verifying zero-seam 0.98x-1.02x handoffs, or keeping Chrome Skia
  paint under 2.5 ms/frame, even if the user never says "skill" or names the files.
---

# Infinite Zoom (18-Stage Off-Center `6×`-Depth Animated Archival SVG)

Project paths are relative to the repository root (`zoom/`).

## The bar

An 18-stage (`s00`–`s17`) off-center infinite-zoom odyssey spanning **`46.53` dyadic octaves (`6¹⁸ ≈ 1.01 × 10¹⁴×`, `~3m 10s` default meditative cruise)** that unmistakably belongs beside `garden/` and `footers/worlds/` — generated 100% in code as **animated archival SVG** with zero raster textures, zero `<filter>` blurs, zero rectangular seams, zero concentric oval/ring framing, instant Day & Night light transitions, and `< 2.5 ms/frame` real Chrome Skia paint cost.

- **Unmistakable `delineate` + `@kiuzyx` + `@claudeai` materiality (Day & Night).**
  - **Zero thick scaling cartoon outlines**: Use `p.burin(...)` / `p.burinContour(...)` (`vector-effect="non-scaling-stroke"`, `0.35–1.35 px`) and `p.pressuredRibbon(...)` (zero-stroke filled tapered ink polygons) so lines stay hair-fine even when zoomed `6×–12×`, while smoothly attenuating at tiny nested scales (`S < 0.68`) via per-layer `--z-burin-op` / `--z-contour-op` set by `engine.ts`.
  - **Compound-path `5×` micro-craft density (`PathBatcher`)**: Use `PathBatcher` (one compound `<path>` per unique `(fill, stroke, opacity)` key — never combining `fill` + `nonScaling` on the same key) and the Stage-5 micro-craft kits (`curtainSkyscraper3D`, `brickLoftBuilding3D`, `trussBridgeSpan`, `denseBookshelf`, `denseNleMonitor`, `denseAudioRack`, `stippleTreeCluster`) alongside `archFacadeGrid`, `dryBrushFoliage`, `brokenWaterReflections`, `scaleFigures`, `doubleGlaze`, `rosette3D`, and `karstPeak`.
  - **Pure architectural off-center diegetic portals (ZERO oval/tube/ring collars)**: Every stage places its compact architectural portal (`~340–405 × 248–298 px`, `< 3.5%` of canvas) strictly off-center (`|cx - 1200| >= 220` or `|cy - 800| >= 140`) inside an authentic storefront window, studio casement, sanctuary gate, carved Mughal *Baradari* arch, clerestory casement, corbeled Mayan doorway, arched French conservatory doorway, dark-bronze atelier bay window, carved observatory archway, triple-mounted silk handscroll, stone watchtower arch, granite moon-bridge, vaulted canal arch, submerged basalt cleft, swung-open frigate stern gallery window, glazed Victorian pass-through doorway, beveled burnished copperplate, or Miesian high-rise casement window.
  - **Night is lighting, not a filter**: Deep Prussian midnight grounds (`#121828`–`#222E48`), dark structural ink (`--z-ink: #0B101D`), moonlit upper-left rims (`--z-lit-edge: #758EB0`), crisp cyanotype drafting (`--z-ink-draft: #9FB6D4`), luminous pearlescent petals/nacre (`--z-petal: #DFD9E3`), stochastic 2 AM lit windows, and smooth zero-filter `<radialGradient>` tungsten lamp pools. Switching Day <-> Night swaps CSS custom properties (`--z-*`) on `<html data-theme>` (`delineate-theme`) with **zero scene rebuild**.
- **Living SVG + Spring multi-plane parallax**: Each stage embeds declarative `<g data-anim="...">` groups (`rotate`, `sway`, `bob`, `drift`, `ripple`, `pulse`) pre-cached at boot and driven per frame with zero DOM queries, layered under a $C^\infty$ depth-curved `Spring` pointer parallax (`±1.5%`).

## The 18-Stage Off-Center Loop (`s00 -> s17 -> s00`)

| Stage | File | Portal `(cx, cy)` | Title |
| :--- | :--- | :--- | :--- |
| `01` | `s00-chicago.ts` | `(1540, 880)` | *Chicago River Canyon & Loop* |
| `02` | `s01-tokyo-studio.ts` | `(850, 540)` | *2 AM Tokyo Studio & Skyline Window* |
| `03` | `s02-alley.ts` | `(1530, 620)` | *Mid-Rise Brick Canyon & Sanctuary Gate* |
| `04` | `s03-reflecting-pool.ts` | `(870, 940)` | *Marble Sanctuary & Reflecting Pool* |
| `05` | `s04-glasshouse.ts` | `(1510, 580)` | *Victorian Copperplate Palm House* |
| `06` | `s05-pyramid.ts` | `(880, 960)` | *Stepped Limestone Pyramid & Jungle* |
| `07` | `s06-dewdrop.ts` | `(1490, 590)` | *Mediterranean Villa Botanical Terrace* |
| `08` | `s07-atelier.ts` | `(1540, 900)` | *Optician's & Clockmaker's Atelier* |
| `09` | `s08-observatory.ts` | `(860, 550)` | *Meridian Stone Observatory* |
| `10` | `s09-orrery.ts` | `(1520, 950)` | *Copernican Orrery & Cartographer's Scroll* |
| `11` | `s10-ridge.ts` | `(1550, 570)` | *Winding Mountain Wall & Watchtower* |
| `12` | `s11-teahouse.ts` | `(860, 950)` | *Li River Karst & Cliffside Teahouse* |
| `13` | `s12-cistern.ts` | `(1520, 840)` | *Piranesi Aqueduct & Waterwheel* |
| `14` | `s13-geode.ts` | `(880, 970)` | *Basalt Organ-Pipes & Amethyst Sea-Cavern* |
| `15` | `s14-abyss.ts` | `(1500, 600)` | *Abyssal Kelp Canyon & Sunken Frigate Stern* |
| `16` | `s15-cabinet.ts` | `(860, 720)` | *Naturalist's Kunstkammer Study* |
| `17` | `s16-printshop.ts` | `(1520, 920)` | *Intaglio Press & Copperplate* |
| `18` | `s17-library.ts` | `(880, 580)` | *Architect's Library & Chicago Window* |

## Engine invariants

1. **`SCENE_SCALE_RATIO = 6.0` & 4–5 slot $O(1)$ stack (`[+3, +2, +1, 0, -1]`)**:
   - Child `(k + 1) % 18` embeds at `1/6` scale (`400 × 266.7 px` core, `526.7 × 360 px` with `BLEED`) centered on `(portal_k.cx, portal_k.cy)`.
   - `Slot +3` fades in smoothly across `frac ∈ [0, 0.7]`, `Slot +2/+1/0` remain `100%` opaque, and `Slot -1` unmounts cleanly once `S_{-1} >= 12.0` (`frac >= log(2)/log(6) ≈ 0.3869`).
   - Exact $C^2$ zero-overshoot camera glide `g_k(f) = d_k * (f³(10 - 15f + 6f²) + 8f³(1-f)³)` guarantees `0.000 px` seam jumps and zero velocity/acceleration kinks.
2. **Compact `6×` portal & parallax contract (`validatePortalHole` in `scenes/index.ts`)**:
   - Outer opaque backdrop cutout spans `BLEED = [-380..2780, -280..1880]` minus `scene.hole`.
   - Every vertex of `scene.hole` lies strictly inside `requiredPortalSealBox(portal_k)` (`484 × 328 px` centered on `portal_k`).
   - All 8 perimeter probes of `requiredPortalClearBox(portal_k, portal_{k+1})` (`236 × 160 px` at `S = 12.0` unmount) lie strictly inside `scene.hole`, and no foreground motif or animated sweep may enter it.
   - Parallax displacement uses `parallaxDepth(S) = (1.24 * S) / (0.24 + S)`, strictly a function of `S` so stage crossings have zero jump.
3. **Painter flush discipline & Skia budget**:
   - Always call `p.flush()` after emitting background `p.burin(...)` / `p.burinHatch(...)` strokes before painting foreground `fillPath` objects on top.
   - `0 fps` when paused & pointer spring settled, `document.hidden`, or `?still=1`; `24 fps` default meditative cruise (`0.095` scenes/s ≈ `3m 10s`); `60 fps` during user wheel/drag/key/pointer steer.
   - Zero `<filter>` blurs anywhere in `zoom/`.

## Code map

- `zoom/style.css` — Curated Day & Night semantic CSS custom properties (`--z-*`), `.burin` / `.burin-c` non-scaling stroke classes, and minimalist translucent colophon HUD (`01 / 18`..`18 / 18`, `2⁰⁰·⁰⁰`..`2⁴⁶·⁵³`).
- `zoom/kit.ts` — `PAL` tokens, `PathBatcher`, `curtainSkyscraper3D`, `brickLoftBuilding3D`, `trussBridgeSpan`, `denseBookshelf`, `denseNleMonitor`, `denseAudioRack`, `stippleTreeCluster`, `burin` / `burinContour` / `burinHatch`, `pressuredRibbon`, `doubleGlaze`, `archFacadeGrid`, `dryBrushFoliage`, `brokenWaterReflections`, `scaleFigures`, `rosette3D`, `karstPeak`, `gnarledBough`, asymmetric portal hole/backdrop helpers (`rectWindowHole`, `archDoorwayHole`, `organicPortalHole`, `asymmetricPortalBackdrop`, `clippedToBackdrop`).
- `zoom/scenes/types.ts`, `zoom/scenes/index.ts`, `zoom/scenes/s00-chicago.ts` .. `zoom/scenes/s17-library.ts`.
- `zoom/engine.ts` — `6×` 4–5 slot compositor, $C^2$ zero-overshoot off-center trajectory, scale-continuous `--z-burin-op` / `--z-contour-op`, pre-cached `data-anim` driver, `Spring` parallax, `0 / 24 / 60 fps` scheduler.
- `zoom/main.ts` — `delineate-theme` sync, pointer parallax, inertia controls, `window.__zoom` API.
- `zoom/card.ts` & `zoom/card.css` — Compact `.lineup` landing card cruising at `24 fps` when visible, responding at `60 fps` to pointer multi-plane parallax, synced to `data-theme="night"`, and sleeping at `0.0 fps` off-screen.
- `zoom/look.ts` — Real-Chrome Day, Night, mid-glide (`t = k + 0.52`), 54-boundary seam + 36 `Slot -1` unmount continuity, animation-delta, parallax, HUD & CDP Skia paint verification harness (`stage5/`).

## Verification ("done means")

Run `tsc -p zoom --noEmit && tsc -p zoom/tsconfig.node.json --noEmit && node zoom/look.ts`:

1. Zero TypeScript errors, zero `validatePortalHole` errors, zero browser console errors, zero `<filter>` blurs.
2. Inspect all 54 rendered plates (`day-o00..o17.png`, `night-o00..o17.png`, `day-mid-o00..o17.png`) plus HUD plates (`hud-day.png`, `hud-night.png`) by eye: compact off-center architectural portals, zero ring collars, zero bloated cartoon strokes even mid-glide, and luminous 2 AM nocturnal lighting.
3. Confirm animated SVG delta proofs (`t=0.0s` vs `t=1.2s`) show crisp motion across stages.
4. Confirm all **54** integer-boundary continuity audits (`18 Day + 18 Night + 18 Corner Parallax` at `ptr=[0.95, -0.85]`) stay strictly in `0.98×–1.02×`.
5. Confirm Chrome Skia paint averages `< 2.5 ms/frame` at `1800×1200`.
