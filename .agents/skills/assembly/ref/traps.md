# Traps

Each of these cost a round once. Check them before blaming the approach.

| Symptom | Cause | Remedy |
|---|---|---|
| The page jumps to another site mid-build | A hand's click reached a real link | Clicks select; they never dispatch to the page (`Hand.click`). |
| Frames sit off their elements | Measured before the type loaded, or the layout moved after | Await `document.fonts.ready` before the crew reads the page; hold every element's final size while it is built. |
| A paragraph's frame spans the whole column | Measured the block, not the words | Text frames hug the text's own range (`space.text`). |
| One hand types while thirty stand idle | One pace for every length | Long passages rush (`#typeInto`). |
| The pen hops, lifting every few strokes | A crayon group's strokes are far apart | Keep a group's strokes together, or split the group. |
| The pen sits between two flowers | Averaged all live strands | The tip is the head of the strands most lately begun. |
| A crayon picture is cut off at its column's edge | A CSS mask clips to its box | Make the masked box reach where the picture should; fade only the edges that should fade. |
| A rectangle drawn in crayon is a blob | The crayon smooths through four corners | Lay its sides as close points (`sides()`). |
| Glass shading reads as a stain | A patch of shade, as a petal's fold | Soft strokes following the glass's curve. |
| The flock is a block of arrows all one way | Every hand seeks the same point and rests upright | Each seeks its own point circling the target and keeps its heading when slow. |
| A headline ends on one word | No balance | `text-wrap: balance` on headings. |
| A face looks bolded wrong | The browser synthesised a weight the face lacks | `font-synthesis: none`, and only the weights the face has. |
| The hands on a stage drift from their work | Page coordinates on a moving stage | A stage space (`hand/space.ts`) so the hands move with it. |
| A stage stutters on another page, smooth on its own | Every layout change restyles the whole host page (on delineate's page, a `:has()` selector over thousands of SVG elements) | Change a word on the host and time the next `getBoundingClientRect()`; anything over a millisecond is the host's to fix, so find the rule by turning stylesheets off one by one. |
| The dev server dies with EMFILE | The sandbox blocks file events | Run it outside the sandbox. |
| `drawings.ts` changes do not show | Drawings are made when the server starts | Restart `npm run assembly`. |
