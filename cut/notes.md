# Cut

A 24 fps browser-native motion-direction film (`18.000 s`, `432` exact frames) built purely on native
web technology in **World 01 · Silver Gelatin & Cinnabar** (`Leica Darkroom × delineate Monochrome`):
multi-pass WebGL2 Leica cinema optics, 3D projective homography, creamy `f/1.4` Scheimpflug bokeh,
beveled Crown-Glass prisms, continuous `2.8px` fluted-crystal aurora, fine Swiss engraving & millimeter
drafting shaders, Canvas2D indie foundry typography (`Switzer` + `Zodiak` + `Geist Mono`), architectural
Turrell/Fontana light-blade instrumentation, gossamer Leica rangefinder CV telemetry, LUT-graded
photographic plates, `G2` superellipse studio hardware tiles, and an original 134 BPM Setloom warehouse
techno score.

## Original `delineate` Copy Arc (`134.000 BPM`)

`In 2026_` (`S01`) → `In 2027` (`S02`) → `Everyone can build a SaaS` (`S03`) → `Millions of products are built every day.` (`S04`) → `BUT` / `Most of them blur into` (`S05`) → `noise` (`S06`) → `every remembered work` (`S07`) → `starts with` / `a` (`S08`) → `Living` / `Form` (`S09`) → `and every living form` (`S10a`) → `moves when` (`S10b`) → `you do.` (`S10c`) → `R3-03` Director's Gate `d` (`S10d`).

## Module Map

- `palette.ts`: single source of truth for **World 01 · Silver Gelatin & Cinnabar** (`75%` `#08090B`
  selenium obsidian & `#F6F5F0` archival cotton rag · `18%` `#F2EFE9` bone & `#6E6D68` graphite · `5%`
  `#D6CFAF` champagne tungsten glass · `2%` `#D9412B` Swiss cinnabar) plus cached once-per-image pixel
  LUTs (`getGradedPlate` silver-gelatin/champagne split-tone and `getGradedEye` strict 3-value mineral
  eye LUT desaturating sclera capillaries while keeping the striated `#9E9580..#D6CFAF` iris luminous and
  clearly separated from the `#08090B` anatomical pupil).
- `shader.ts`: 4-pass WebGL2 ES 3.00 cinema renderer (`ShaderStage`). Uploads a `1280 × 720` background
  canvas (`uTex`) and a surgical foreground typography/HUD canvas (`uFgTex`) each 24 fps frame:
  - **Pass 1 (Leica Cinema Optics, Beveled Crown-Glass Prisms & Continuous `2.8px` Fluted Crystal)**:
    power-law radial chromatic dispersion (`pow(r, 1.85)`), organic lens breath, true 3D ray-plane
    homography + camera roll (`uPersp`, `uRoll`, `uPerspPivot`, `uZoom`), creamy `pow(defocus, 1.22)`
    24-tap Vogel Scheimpflug `f/1.4` DOF, 3 achromatic/champagne beveled Crown-Glass prisms (`uGlass`,
    `mode 0`), fine Swiss engraving 8-level ASCII + `5.8px` optical blueprint X-ray micro-mesh (`mode 1`),
    delicate `6.0px` Swiss millimeter drafting grid + curved cotton-paper corner peel (`mode 2`), stepped
    mineral Quadtree & fine silver-champagne mezzotint halftone (`mode 3`), and a silky continuous `2.8px`
    vertical fluted-crystal aurora in World-01 harmonic stops (`mode 4`).
  - **Pass 2 (Directional 180° Shutter Blur & Kinetic Persistence)**: 7-tap Hann-weighted directional
    shutter motion-blur integral (`uMotionBlur`) + consecutive-frame persistence ping-pong FBO.
  - **Pass 3 (Half-Res Anamorphic Bloom & Halation)**: bright highlight extraction and separable 9-tap
    horizontal anamorphic / vertical Gaussian blur at `640 × 360`.
  - **Pass 4 (Filmic Screen Composite)**: soft highlight rolloff, cool platinum `#C8D3E6` Panavision
    horizontal anamorphic streak (`uAnamorphic`), warm `#D95B38` photochemical halation fringe, surgical
    foreground typography (`0.16x` tamed dispersion—zero cyan/red double-vision), platinum/champagne AR
    corner glass sheen, elliptical cinema aperture vignette, dual-frequency 35mm silver grain, and flash.
- `ui-icons.ts`: standalone zero-dependency vector icon & studio hardware emblem library (`drawUiIcon`
  across 23 SF-Symbols-caliber `24 × 24` hairline glyphs, `drawStudioTile` continuous `G2` `n = 4.4`
  superellipse studio tiles harmonized to World 01, and `drawStudioGlyph` carrying `R3-03`).
- `cv.ts`: Leica rangefinder Computer Vision telemetry (`0.68px` `#D9412B` Swiss cinnabar hairlines,
  `drawTrackBox` with tangent `rot`, `drawTrackPoint`, `drawBezierLink`, `drawOrbitalScan` in `Geist Mono`).
- `mockups.ts`: World-01 LUT-graded coplanar 3D AI SaaS builder worlds (`drawBuilderBackdrop`), oblique
  editorial product windows (`drawMiniProductCard`), 6 studio profiles (`Vectra`, `Solis`, `Delineate`,
  `Kinetix`, `Monolith`, `Aperture` in `drawBrandMacroBackdrop`), and 5 motion-craft showcase cards
  (`drawLaunchPostCard`) culminating in Card #5's subpixel-locked `16:9` gate.
- `scenes.ts`: deterministic 10-scene director's shot sheet (`432` frames @ `24 fps`) locked onto the
  `134.000 BPM` beat grid (`S01 0..21`, `S02 21..43`, `S03 43..86`, `S04 86..129`, `S05 129..172`,
  `S06 172..193`, `S07 193..226`, `S08 226..269`, `S09 269..322`, `S10 322..432`) featuring `shotRamp`
  kinematics, `s07Amber` `5.8px` optical X-ray mesh (`S02`), 3-value anatomical mineral eye (`S05`),
  `158 × 76` variable-radius `Zodiak` serif `"noise"` (`S06`), serene zero-clutter topographic horizon
  & 3D plexus wave (`S08`), James Turrell vertical aperture slit & `38°` diagonal prism light-blade
  (`S09`), `2.8px` fluted crystal aurora (`S10a`), and the `R3-03` **Sheared Director's Gate (`16:9 → d`)**
  cotton-paper slam (`S10d`).
- `audio.ts`: opt-in studio soundtrack engine locked to the `24 fps` film clock across Play, Pause, Scrub,
  Frame-Step, and Loop, streaming the `18.000 s` `134.000 BPM` Original Setloom Warehouse Techno master
  (`cut/assets/audio/score.m4a`, `-11.84 LUFS`, `-1.51 dBTP`).
- `main.ts`: 24 fps frame-paced player, explicit indie webfont preloader (`Switzer`, `Zodiak`, `Geist Mono`),
  plate/photo asset loader, damped cinema-lens pointer parallax, minimalist scrubbable 10-scene HUD
  (`Play`, `‹`, `›`, `Sound`), keyboard shortcuts (`Space`, `←`/`→`, `H`, `M`), and URL params.
- `embed.ts`: zero-idle-cost lazy inline screening player for `delineate`'s landing page (`site/page.html`),
  dynamically imported only when the visitor clicks Play on `cut/assets/poster.jpg`, synchronously unlocking
  134 BPM sound on that click gesture, pausing automatically when scrolled out of view, and releasing WebGL2
  (`WEBGL_lose_context`) & Web Audio cleanly on close.
- `npm run cut`: serves Cut at http://localhost:5390/, rebuilding on save.

## Asset, Font & Audio Credits

- Typography: **Switzer** & **Zodiak** by Indian Type Foundry (Fontshare Free Font License); **Geist Mono**
  by Vercel (SIL Open Font License 1.1).
- `cut/assets/eye.jpg`: Wikimedia Commons (`File:Human eye iris 1.jpg`), **CC BY 4.0**.
- `cut/assets/rocket.jpg`: NASA Kennedy Space Center (`KSC-20250115-PH-FMX01_0004`), **Public Domain**.
- `cut/assets/plates/{s03Aurora,s03Daylight,s03Dusk,s04Dune,s04Prism,s04Horizon,s07Stage,s07Amber,s09Living,s09Form}.jpg`:
  10 original bespoke architectural & optical fine-art plates generated specifically for `delineate / cut` (**MIT**).
- `cut/assets/audio/score.m4a`: Original 18.000 s `134.000 BPM` warehouse techno score composed via Setloom.

## Rules

1. **World 01 color architecture.** Hold strictly to `palette.ts` (`#F6F5F0` archival rag, `#08090B`
   selenium obsidian, `#F2EFE9` bone ink, `#161615` dark ink, `#D6CFAF` champagne glass `< 5%`, `#D9412B`
   Swiss cinnabar `< 2%`); pass all plates through `getGradedPlate` and `eye.jpg` through `getGradedEye`.
2. **Strict 3-value anatomical eye invariant (`S05` & `S10b`).** Never paint a wide black radial smudge
   over the iris: keep desaturated alabaster sclera, luminous striated `#9E9580..#D6CFAF` iris, distinct
   `#08090B` pupil core, and crisp `10:30` corneal catchlight clearly separated across all acts.
3. **Sacred negative space & surgical typography.** Keep `S08a` (`10s`) serene (`65%` untouched `#08090B`
   sky, zero CV boxes, single delicate contour ridge); keep `COMP_FRAG` foreground chroma tamed (`0.16x`)
   so `Switzer` headlines never split into cyan/red fringes; reserve `Zodiak` serif exclusively for S06's
   `158 × 76` variable-radius micro-dot `"noise"`.
4. **Exact 24 fps determinism, zero runtime npm dependencies & opt-in audio.** Pure WebGL2, Canvas2D, and
   Web Audio; no `AudioContext` starts until user gesture.
