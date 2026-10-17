# Rain

A person seen from behind under an umbrella, shape alone against a quiet sky, dots of light flowing over
their form, in a rain of written characters. Each character trails rings, breaks on the canopy and runs off
its rim, lies down where it lands, and leaves rings on the ground. She stands five seconds and becomes him,
he becomes her, and the palette turns as she returns; a click brings the change at once. Dark or light
follows the system, or the page's switch.

- `body.ts`: the people, seen from behind in trench coats, each part a bone and the widths along it,
  drawn as one smooth outline; the pose that keeps them breathing and swaying; and `shape`, which eases one
  person into the other part by part.
- `figure.ts`: the umbrella, the flowing dots, and the person and umbrella painted together.
- `rain.ts`: the characters falling, running and lying, the rings on the ground, and their sprites.
- `palette.ts`: the palettes, each with a dark and a light set of the four tokens, and the OKLab easing
  between tones. `glyphs.ts`: what the rain is written in, and the font for it.
- `show.ts`: the stage, its two canvases, its clock, and the timeline of people, palettes and modes.
  `main.ts`: the page, with `?palette=`, `?figure=`, `?mode=`, `?glyphs=` and `?rate=` (0 shows the figure
  alone).
- `npm run rain`: the stage at http://localhost:5360/.

## Rules

1. **Depth decides the layer.** A drop nearer than `BEHIND` is drawn on the front canvas, over the figure;
   only a drop between `BEHIND` and `UMBRELLA` can strike the canopy.
2. **The canopy the rain meets is the one drawn.** `Figure.canopy` turns the same top the canopy is drawn
   from, at the same lean, lifted by the same reach.
3. **Dots stay on their part.** A dot that leaves the part it was born on is born again elsewhere, and dots
   are drawn clipped to the figure.
4. **Both people are the same parts in the same order**, every outline the same count of points, wound
   the same way, so one can be eased into the other and the parts painted as one path never cancel.
5. **The rain is drawn in white and tinted.** Each layer is stamped in white and filled with the ink
   `source-in`, so colours can ease every frame without redrawing a sprite.
6. **Batch what is many.** Rings and dots go into a few paths by brightness and are stroked a few times a
   frame; characters are stamped from sprites drawn once, their glow baked in.
7. **A pose moves bones, never the place a dot may be.** Where dots are born is read once from the person
   at rest; the outline and the clip follow the pose, which moves them only a few units.
8. **Out of view, nothing moves**; in view, the clock steps 24 times a second.
