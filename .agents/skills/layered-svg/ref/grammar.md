# A style's grammar

Two pictures in one style share a grammar, not their pixels. Write the grammar down before drawing
anything; it is what the code executes and what every render is judged against.

## The four questions

| Question | Cel | Wavy-line engraving |
|---|---|---|
| **Marks:** what is the drawing made of? | flat shapes, some with a gentle ramp | lines, one family of waves across the frame |
| **Tone:** how do marks carry light and dark? | a few stacked tones per thing | line width: lines swell in shadow, thin to breaking in light; never gray |
| **Form:** what holds the shapes? | edges between tones | clean contour lines laid over the waves (seams, zips, building edges, features); hair as strokes of its own |
| **Omitted:** what does the style leave out? | grain, mottling, soft noise | color within an ink; anything smaller than the line spacing |

Add what the style needs beyond these: inks (the engraving uses one per depth: green-black for the
city, indigo for the figure, on cream), how marks change with depth, special textures (a woven
patch drawn as crossing lines).

## Reading it from the reference

Crop the style at 2× in four places: the subject's face, a large dark mass, the far background,
and an open area such as sky or ground (`look.ts crop`). Then sort what you see:

- **The same in every crop** is the grammar.
- **Different from region to region** is a parameter of the grammar: the sky's waves rise higher
  than a wall's; the face's lines are finer and sparser than the jacket's.
- **Inconsistent within a region** is the generator's accident.

Then decide, region by region, and write it into the piece's notes:

| Seen | Decision |
|---|---|
| The grammar | keep, executed by code from the picture's fields |
| An accident the style's own logic corrects (waves cutting flat across a face where an engraver would turn them with the cheek) | reinterpret, by the grammar |
| An accident with no logic (lines melting into noise in deep shadow) | drop |
| Detail below what reads at normal size | drop |

## When the style is not in the reference

Often the user names a style the reference does not show: a painting to be cut as a woodcut. The
reference then gives the composition, the light, and the depth, and the grammar comes from the
medium: examples of it (ask the user for some, or study well-known ones), read with the same four
questions. Decide too how the medium maps the reference's tones: an engraving follows them
smoothly; a woodcut gathers them into black, white, and a cut middle.

## Where pixels enter

As fields your marks respond to: tone (the picture blurred to the scale of the marks), direction
(the flow a stroke should follow), depth, the edges worth a contour. Not as the marks themselves.
A grammar of marks is generated, never traced: tracing an engraving yields hundreds of thousands
of fragments and keeps every accident it should have dropped. `marks.md` says how to generate one.

The cel grammar is the one case where tracing executes the style: its marks are tone shapes, so
tracing tone (`tracing.md`) draws them. Even there, how far to simplify the shapes is yours to
decide.
