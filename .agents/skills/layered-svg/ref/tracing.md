# Regions, plates, and the cel grammar

## Regions

A region is the backdrop, a thing, or a part of a thing; each becomes one group. Its outline is
needed only as precisely as the current stage needs it: the lay-in wants blocks and silhouettes,
read off gridded crops and authored; only the subject's edge and what is nearest earn precision
later.

The region map is a PNG with one flat color per region (color derived from the region's name,
black for the backdrop), so it can be checked by eye and touched up by hand
(`portraits/harness/trace/labels.ts`). The build reads maps; it never reruns a model. A piece's
`segment.ts` writes them, composing what `portraits/harness/trace/mask.ts` offers: polygons and
boxes authored by hand, lines across the frame (below a rail, above a ridge read by eye and settled
onto its edge), tone ranges in OKLab, and Segment Anything masks.

Segment Anything (`portraits/harness/trace/sam.ts`), for an intricate outline that a hand outline
would cost more than it is worth:

- Run it in **fp16**. The 8-bit build loses whole parts on the same prompts; fp16 matches full
  precision at half the size.
- Prompt with **single points and take the union** of their masks. One prompt with many points
  often returns a different, larger thing.
- Some single points select the whole surrounding thing (a point on a lip returned the face). Probe
  candidate points one by one and keep the ones whose masks are the right size.
- Small parts get **clip boxes** so a wrong mask cannot spread.
- After cutting: small islands join their surroundings; backdrop holes enclosed by one
  thing join that thing.
- Use SAM only where outlines are complex and colors close to their neighbors. A flat piece is
  found by its color; a regular solid by fitting its model.

## The cel grammar: tracing a region (`portraits/harness/trace/layer.ts`, `stack.ts`)

How a region in flat color is made into tone shapes. It executes the cel grammar; it is not how a
grammar of marks is drawn (see `grammar.md`).


1. Flatten paint texture with a light bilateral filter (`trace/filter.ts`), only enough to quiet
   the brushwork.
2. Palette in OKLab, sized per region to a mean error target (`paletteFor`).
3. **Tones go down light to dark**, like glazes. Where two tones meet, the anti-aliased edge lets
   the tones stacked between them show; in lightness order those read as the edge's own blend.
   Ordering by area instead left dark seams.
4. Each tone **reaches only about 3 px under the tones above it**. A full stack redraws every
   boundary once per tone and, where its edge coincides with others, leaks hairlines.
5. Outlines by sub-pixel marching squares on a softened margin field; Béziers by Schneider's
   fitting, with corners kept sharp and straight runs drawn as lines. A ring that long straight
   edges hold is drawn as a polygon (`straight`).
6. Each separate piece is filled with a flat color or a one-direction gradient fitted to its own
   pixels; near-flat ramps are drawn flat.

Start from the presets in `trace/layer.ts` (`TraceStyle`: things in view, smooth skin, busy
distance, straight-membered structures, what only shows when layers move) and tune them per
picture.

## Making layers whole

- Each region **continues under nearer regions** by a margin, and fully under loose pieces
  that will move away (falling confetti).
- The hidden part is **inpainted from the region's own clean pixels** (OpenCV Telea), never smeared
  outward ring by ring (that drew streaks), and never from pixels within a couple of pixels of a nearer region
  (they carry its color in their anti-aliasing).
- **Bleed**: trace from the reference extended past every edge (edges copied), further than parallax will move it, in the
  reference's own coordinates, so layers reach beyond the frame and parallax never bares it.

## Depth plates

Some pictures come with plates painted per depth (distance, middle ground, near ground, subject),
each over black or over transparency. They agree with the picture in shape, not in tone or detail.
See `portraits/harness/trace/plate.ts`.

- Register first: plates may be painted larger or shifted. Fit an affine map by features (`fitFeatures`), refine it by ECC over a box where the
  plate's scene shows clearly (`refine`), store the numbers in the scene, and resample (`warp`). A
  plate that only roughly matches serves for outlines, not paint.
- Measure: which plate best explains each pixel of the picture, and how far each plate's
  paint is from the picture where it has paint. Expect a few percent that no plate explains, and
  plates repainted in different tones.
- A plate's paint is what is brighter than black; close thin dark lines (outlines, folds) into it
  (grow then shrink by a few pixels), or they become holes that show the layers behind.
- Cut each plate into regions by claims, in order: the first region is the plate's paint; later
  claims take pixels by Segment Anything points, clip boxes, polygons (for things with a straight
  boundary, such as everything below a guardrail's top rail), and tone ranges in OKLab (clouds in
  the sky, eyes within a face); a solid claim keeps one filled piece per box. The picture's map is
  the plates composited, nearest in front; what no plate paints takes the region around it.
- Wide hidden areas that no plate paints are filled by push-pull over a pyramid
  (`portraits/harness/trace/fill.ts`): a quiet gradient from the colors around. Telea inpainting, right for
  a band of a few pixels, draws streaks over hundreds.
- Draw each region's hidden part from the plates, through a color transfer fitted where the
  picture and the plate both show the region (`portraits/harness/trace/transfer.ts`), trusted only a seam
  inside the nearer region's outline.
- Loose things painted on a plate (petals) are fitted once as data and left out of its regions.

## Busy texture

A detailed middle distance (a town, foliage, a street of shops) costs the most bytes and holds the
most error. Looser curves with a finer palette, small crumbs dropped, and near-flat ramps drawn
flat hold it better than tighter tracing, in fewer bytes; past a point, tightening buys little for
much.

## Extra plates

Ask for them when the picture hides what motion or separation would show. Both must be aligned
with the reference; check the alignment per region before relying on one (generated plates often
repaint textures elsewhere).

- **Background plate**, the subject removed and the scene behind painted in. Cut it into its own
  region map. Regions behind the subject are then traced in two passes: a coarse pass of what the
  plate shows where the subject stands, and on top the fine pass of what the reference shows. Trust
  the plate only a seam inside the subject's outline: what shows through the subject's soft
  edge is the reference's own scene, and a narrower seam left a light halo around the subject.
- **Sharp plate**, nothing out of focus. Defocused pieces are drawn as shapes with their blur on
  top, so what lies behind their smear must be drawn under them:
  - Fit each piece's corners on the sharp plate, edge by edge (search along each edge's normal for
    where its paper color gives way; keep edges hidden under nearer pieces as they were).
  - Where the smear is thin, recover what is behind it from the reference itself: render the
    pieces' coverage (shape blurred by its sigma, composited back to front) and solve
    `picture = behind × through + added` for `behind`. This keeps the reference's own content.
  - Where the smear is thick (less than about 30% of the background seen), take the sharp plate;
    blend between.
  - Regions in the smear: merge the reference's map and the sharp plate's by taking the nearer
    region (segmentation drops parts next to confetti more often than it adds them), close gaps
    narrower than the smear, give backdrop pixels the region around the smear, and give pixels
    under each piece, and sharp-plate pixels of its own paper color, the region that surrounds
    them.
  - Tracing through the smear, or swapping the sharp plate's map in wholesale, left dark bulges
    and torn edges.
- Fit authored data (corners of flat pieces) on the clearest plate available.
