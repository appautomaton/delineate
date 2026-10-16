# Flotsam

delineate's page for an address that leads nowhere. The page has sunk: the window is a tank of water, and the
numerals of the error float in it, cut from plywood. Move the window and the water, left behind, slops against
its walls; tip a phone and it runs downhill; fish a numeral out and throw it back, and it splashes. On the sea
floor, drawn in crayon, fronds bend with the water and fall over where it leaves them, fish swim where there is
water and fall where there is none, and a crab keeps to the sand. `npm run flotsam` builds it into the system's
temporary folder and serves it at http://localhost:5340/, every address showing the page; `npm run
flotsam:measure` measures it in a clean Chrome. The site builds it as its `404.html`.

## The bar

The reference is a 404 page whose window holds water; it is the floor, not the aim. Where it fakes buoyancy,
ours floats by the water the numerals displace; where its scenery loops, ours asks the water what to do; where
its numerals are grey solids, ours are cut wood that turns and shows its veneers. Judge it as a visitor meets
it: by mistyping an address, at whatever size their window is, with whatever they have to shake.

## How it is built

- **`water/`**, on a thread of its own (`worker.ts`), 240 steps a second:
  - `sim.ts`: the water. Particles moved by double-density relaxation (Clavet, Beaudoin and Poulin, 2005), kept
    in screen coordinates, so moving the window moves only the walls and the water's inertia is real. Velocity
    smoothing (XSPH) stills the jitter at rest. It answers probes: how much water is at a point, and how it moves.
  - `bodies.ts`: the numerals as rigid bodies sampled into points, each with its own density, weighted at the
    foot. Buoyancy, drag and the water they knock aside fall point by point; they meet the walls by their outline
    and each other through distance fields; a hand holds one by a point, softly.
  - `worker.ts`: steps both, carries the walls no faster than a step allows, sleeps when nothing can be seen to
    move, and sends back where everything is and the answers to the page's probes.
  - `view.ts`: draws the water in WebGL2: particles splatted into a density field at half resolution, mirrored
    across the walls, smoothed, and its level line drawn as a surface with a hairline, thin water, foam and
    shafts of light. Its colours are CSS variables, so day and night are the stylesheet's.
- **`numerals.ts`**: each numeral drawn once into a canvas in Hedvig Letters Serif, birch face and veneered edge,
  and its shape for the water sampled from the same pixels: points, ballast, outline and distance field.
- **`sea.ts`**: the floor's life, on the page's thread, each part asking the water about where it is.
- **`drawings.ts`**: the floor, fronds in jointed segments, fish with their tails apart and a crab with its legs
  apart, in the Footers' crayon, made when the page is built.
- **`tilt.ts`**: a phone's accelerometer turned into the way the water falls. **`sound.ts`**: the water's sound,
  made from what it does.
- **`index.html`**, **`style.css`**, **`main.ts`**: the page; **`build.ts`**, **`dev.ts`**, **`measure.ts`**.

## What the work taught

- **Measure the water's thread in a browser with no debugger on it.** A Chrome driven by devtools runs a worker
  more than ten times slower; the same water that read 40 ms a tick there runs in 5 in a visitor's browser.
  `measure.ts` opens its own.
- **A position-based method wants steps of one length.** It reads velocity back from how far a particle moved,
  so steps of changing length read the same push as different speeds, and the water never comes to rest. Step
  a fixed 240th of a second as time allows; shorten the steps only when the walls must sweep further.
- **Set the tank exactly where it is.** Adding the last move to where it was left it forever a hair off, so the
  water thought the window was moving and never slept.
- **The walls may sweep only so far in a step.** A window placed as it opens, or moved to another screen, swept
  the whole water into one point in a frame, and particles on one spot have no way apart. Carry the water along
  for what no hand could do; part particles that coincide.
- **A tall thing floats on its side.** Weight the numerals at the foot, as a buoy is, and they float upright and
  rock back when a wave tips them.
- **Outlines alone let bodies sink into each other.** Once one outline passes the other's, it is inside, where
  there is no outline to meet. Test outlines against the other's distance field, which knows the way out from
  anywhere.
- **Water over everything, but clear.** Laid over the floor at the opacity that suits its surface, the water hid
  the floor; clearer at the top and denser at the foot, it reads as water and the floor reads through it.
- **Size what stands in the water to the water.** Fronds taller than the water stood out of it, held up by the
  segments below.
