# Patch (`patch/`) — Engineering & Craft Notes

## Architecture Overview

`patch/` presents six annual embroidered micrographic badges (`2026`–`2031`) as a homologous
`<svg>` ↔ WebGL2 specimen sheet on `delineate`'s Day (`#F8F7F2`) and Night (`#0B0D14`) paper.

### 1. Single-Context `3 × 2` Baked Field Atlas (`25.71 MiB` Total VRAM)
- **One `WebGL2RenderingContext`**: A single `position: absolute` `<canvas>` overlay inside
  `.patch-shell` scrolls and rubber-bands via native browser GPU compositing (`0.0 fps` scroll cost,
  switching to `position: fixed` only when `.is-modal` locks the viewport) and draws every visible
  badge using `gl.scissor` + `gl.viewport` from `ResizeObserver`-cached rects (`0`
  `getBoundingClientRect()` calls inside `requestAnimationFrame` or `scroll`). On `delineate`'s
  landing page (`patch/card.ts`), `PatchAtlasRenderer` allocates a compact `1 × 1` `720 × 520`
  single-badge tile (`4.28 MiB` VRAM total) leading `.lineup`.
- **One-Time `2×` Supersampled Startup Bake**: At initialization, all 6 badges are rasterized into
  reusable temporary Canvas2D layers (composited via `"lighter"` for zero premultiplied-alpha loss
  and zero `getImageData()` readback), processed through `2×` (`1440×1040`) Sobel subpixel seeding,
  dual-sided `RGBA16UI` JFA+1, and `1×` (`720×520`) `RG16UI` morphological opening (`R_tatami = 6.5 px`),
  and resolved directly into one `3 × 2` atlas (`2160 × 1040`):
  - `uDistAtlas` (`RG16F`, `4 B/px`): `R = dMain`, `G = dRecessed` (`8.57 MiB`)
  - `uOrientAtlas` (`RGBA8`, `4 B/px`): `halfWidth`, double-angle nematic tensor `J`, `dProud` (`8.57 MiB`)
  - `uAuxAtlas` (`RG8`, `2 B/px`): `wTatami`, combined Vogel-disk `aoCrowd` (`4.28 MiB`)
  - `uMetaAtlas` (`RG8 NEAREST`, `2 B/px`): discrete `regionCode` + 3-layer packed thread indices (`4.28 MiB`)
- **Immediate Scratch Reclamation**: Immediately after badge #6 finishes baking, all Tier-A programs,
  JFA ping-pong textures, bake FBOs, and temporary 2D scratch canvases (`width = height = 0`) are
  deleted, leaving exactly `25.71 MiB` (`26.96 MB < 28 MB`) of steady-state texture VRAM.

### 2. Exact `0.00 px` `<svg>` ↔ WebGL2 Registration
- Both the DOM `<svg viewBox="-390 -280 780 560" preserveAspectRatio="xMidYMid meet">` and Tier-B
  `RENDER_FRAGMENT` compute uniform fit scale `s = min(w / 780, h / 560)` centered on `.card-stage`.
- Every glyph (`patch/glyphs.ts`), emblem path (`patch/badges.ts`), and silhouette outline
  (`patch/shapes.ts`) is authored once as pure SVG path geometry, driving both live DOM vector
  blueprints (plus standalone `.svg` exports) and `Path2D(d)` GPU rasterization.
- Each badge rests on bare `--paper` at a stochastic tabletop pose (`dx`, `dy`, `±2.4°..±6.6°` tilt,
  `fitZoom`) shared bit-for-bit between CSS `transform` on `.card-svg-pose` and GLSL `uPose`, while
  fixed room-space studio key light rotates into badge-local space.
- Sweeping the vertical Cinnabar Pointer-X split hairline (`Spring` `ω = 24, ζ = 0.88`) clips the
  unrotated outer `.card-svg-clip` wrapper via `clip-path: inset(0 calc((1 - split) * 100%) 0 0)` and
  discards WebGL2 fragments left of `split`, peeling any angled badge cleanly back to its monochrome
  `<svg>` blueprint with `0.00 px` seam registration.

### 3. Six `C^1` Closed-Form Merrow Silhouettes × Four Procedural Textiles
| Year | Emblem | Silhouette | Substrate | Signature Threads |
| :--- | :--- | :--- | :--- | :--- |
| `2026` | **APEX** | Rounded Tactical Rect (`1.61:1`) | `31.5°` Carbon `2/1` Z-Twill | Optical White, Silver-Slate, Swiss Cinnabar |
| `2027` | **PELAGIC** | Circular Mission Roundel (`1:1`) | Midnight Navy Melton Wool Felt | Ice-Cyan, Bone White, Champagne Gold Bullion, Abyssal Slate |
| `2028` | **FLORA** | Pointed Heritage Shield (`C^1` arcs) | Unbleached `1/1` Cotton Duck | Forest Green, Deep Indigo, Terracotta, Alpine Ochre (Matte Cotton) |
| `2029` | **HELIOS** | Rounded Flat-Top Hexagon | `38°` Espresso Cavalry Twill | Solar Amber, Pale Parchment, Burnished Copper, Corona Gold |
| `2030` | **KINETIC** | Horizontal Stadium Capsule | Olive-Sage `18 px` Ripstop Nylon | Signal Safety Orange, Chalk White, Sage-Grey, Warm Brass |
| `2031` | **RELAY** | Cathedral Arch Mission Vault | Prussian Cobalt `2/1` Z-Twill | Starlight Silver-White, Crimson Vermilion, Pale Gold, Cobalt Mist |

### 4. Frame Pacing & Premultiplied Linear Shadows
- Phase-locked `60 fps` (`1000/60`, `3.5 ms` VSync slack) during pointer tilt, hover peel, or modal
  loupe scrub; cancels `requestAnimationFrame` (`0.0 fps`, `0%` CPU/GPU) as soon as every spring settles.
- `IntersectionObserver` skips off-screen cards completely.
- Outside the patch silhouette, linear-light drop-shadow transmittance `T_lin` is encoded as
  premultiplied sRGB `alpha = 1 - T_lin^(1/2.2)` so physical contact creases and Gaussian penumbras
  composite identically onto Day archival paper (`#F1EFE8`) and Night darkroom trays (`#12151F`).
