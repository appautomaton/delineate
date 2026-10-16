# Writing a page for the crew

The crew (`assembly/hand/crew.ts`) reads a finished page into work. Write the page as it will
stand; mark only where the crew cannot tell what you mean.

## Marks

| Mark | On | Means |
|---|---|---|
| `data-section` | each section | One stretch of work, opened when it scrolls into view. Its column guides fall on the padding edges of its `.wrap`; its across guide on the top of its first `h1` or `h2`. |
| `data-build="skip"` | any element | Left alone, shown as it is. |
| `data-build="type"` | an element | Typed, even if it has a fill. |
| `data-build="block"` | an element | Dragged out as a frame and given its look, even if bare. |
| `data-build="headline"` | a heading | Typed small, then pulled up to size by its corner. One per section at most. |
| `data-build="slots"` | a row's parent | Its children are labels typed at once by several hands, who all type the first, flag the clash in red, and put it right. Each label holds its final width. |
| `data-build="draw"` | an `<svg>` | Crayon: each `<g data-hand>` is drawn by one pen. See `drawing.md`. |

Without marks the crew decides: an element with a fill, a border or a shadow is a **block** (its
children come after it); an element holding only text is **typed**; anything else is a container
it walks through. What the screen hides at the current width is no one's work.

## Writing it well

- **Text lives in leaves.** A typed element holds only text: no `<b>` inside a sentence, no icon
  beside a label. Split them, or the crew walks past the sentence.
- **Links stay links.** A nav of `<a>` elements can be `slots`; a footer list is `<li><a>`.
- **Nothing grows.** Typed text is held at its final length, invisible, so lines never reflow;
  a headline keeps its final height while it is small. Do not size things by their content in a
  way the crew's states would change.
- **Long code is many lines.** A code card of one `<pre>` is one hand typing for a long time; a
  `<p>` per line is many hands at once.
- **Fewer, larger sections** read better than many small ones: each section is a burst of work.

## Belonging to the site

- Use the site's tokens: paper, ink, soft, rule, crayons, and its margin (`--margin`), so guides
  fall where the site's other pages have their edges.
- Read the light before the first paint from the site's storage key, and write the same key when
  the reader switches it. Give night its own values for the paper, ink and crayons; colour the hands
  with crayon names (`var(--c-blue)`), so they turn with the light.
- Lay out for a tablet and a phone. Scale the crew to the screen (Assembly runs 10 to 32 hands);
  say the real number wherever the page states it.
- With less motion asked for, show the page finished: no crew, crayon drawn, no opening.

## A stage inside another page

`assembly/show.ts` is the pattern: a host element becomes a stage (`position: relative`), the
sheet's markup is fetched and filled in, and a crew works in `stage(el)` space (`hand/space.ts`)
with `new Marks(layer, { rulers: false })`. The stage clips the hands; container units (`cqi`)
size the sheet's type to the stage. Rebuild the sheet from fresh markup for each run.
