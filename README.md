# delineate

**d3lin3at3** · Drawings that move when you do.

[![Node.js 24+](https://img.shields.io/badge/node-24%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript 7](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Runtime dependencies: none](https://img.shields.io/badge/runtime%20dependencies-none-2ea44f)](package.json)
[![Agent skills: 5](https://img.shields.io/badge/agent%20skills-6-8957e5)](.agents/skills)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/appautomaton/delineate)](https://github.com/appautomaton/delineate/commits/main)

Portraits that come apart, gardens that grow as you scroll, small worlds at the foot of a web page,
a page made in front of you by a crew of hands, a vase that keeps changing its flowers, and a page not
found that has sunk. Everything is
drawn in code, and each piece comes with its source, and most with a skill your AI agent can follow
to make one like it.

The name is *delineate*: to draw the outline of something. Its handle, d3lin3at3, writes each e as
a 3. On the project's page the 3s turn over as you scroll and show the e on their backs.

## The work

| | What it is | Code | Skill |
|---|---|---|---|
| **Garden** | Twelve gardens from around the world, drawn plant by plant in watercolour and ink. They grow in as you scroll, and four of them run through a whole year. | [`garden/`](garden) | [climate-garden](.agents/skills/climate-garden) |
| **Footers** | The bottom of a web page drawn as a small world that rises as you arrive. Seven worlds, each in its own medium, from gouache to crayon, by day and by night. | [`footers/`](footers) | |
| **Portraits** | Illustrated portraits redrawn in vector as planes, each at its own depth. Pull them apart and they keep moving. | [`portraits/`](portraits) | [layered-svg](.agents/skills/layered-svg) |
| **Characters** | A picture made of letters. Ring by ring from each shape's edge inward they spell the name, and at the heart leaves and flowers grow, or moons, or stars. | [`characters/`](characters) | |
| **Collage** | Five sculptures from their museums' scans, each drawn as an engraving, a line screen, flat marble and a single line, and laid among scraps of paper on a card that cuts from hand to hand. | [`collage/`](collage) | |
| **Assembly** | A page made in front of you by a crew of hands that move the way people do: guides pulled down, frames dragged out, words typed key by key, and a still life drawn in crayon, stroke by stroke, by twenty pens at once. | [`assembly/`](assembly) | [assembly](.agents/skills/assembly) |
| **Monoline** | Flowers from the Garden's climates put in glass, drawn with one pen on three angles. An arrangement grows, is taken back into its bottle, and the bottle becomes the next, under a palette rolled for its flowers. | [`monoline/`](monoline) | [monoline-geometric](.agents/skills/monoline-geometric) |
| **Flotsam** | The page for an address that leads nowhere. It has sunk: the window is a tank of water and the 404 floats in it, cut from plywood. Shake the window, or tip your phone, and the water slops; fish a numeral out and throw it back. | [`flotsam/`](flotsam) | |

And the studies, smaller pieces that delineate's page lists in its footer rather than shows:

| | What it is | Code | Skill |
|---|---|---|---|
| **Rain** | A figure seen from behind under an umbrella, in a rain of written characters that trail rings, break on the canopy and lie down where they land. She becomes him and he becomes her, and the colours turn, by day or by night. | [`rain/`](rain) | [glyph-rain](.agents/skills/glyph-rain) |
| **Glass** | A solid of clear glass that follows your pointer over lines of words and drawings from the Garden, bending them and turning them over. The glass melts from a ring into a tetrahedron, a sphere, a cube and on, and the page beneath melts from words into a plant and back. | [`glass/`](glass) | [sdf-glass](.agents/skills/sdf-glass) |

[`site/`](site) builds delineate's own page, which shows all of it on one long sheet.

## Agent skills

A skill is a folder of instructions that an AI coding agent loads when a task calls for it. The six
here live in [`.agents/skills/`](.agents/skills), and `.claude/skills/` links to them for Claude Code.

- **climate-garden** researches how a set of real plants looks, draws each one, colours the garden
  for day and night, lays it out for every screen, and checks the result.
- **layered-svg** turns a picture into a layered, animated SVG in a style you choose, working from
  coarse to fine the way a painter does.
- **assembly** makes a page that a crew of hands builds in front of its reader, from the first
  guide to the last crayon stroke, moving the way people move and working the way a design team
  works.
- **monoline-geometric** puts flowers in glass on the Monoline card: a plant, a garden or a bottle
  drawn with one pen on three angles, under a palette rolled for its flowers.
- **glyph-rain** makes Rain: a person built bone by bone, with no line drawn, under a rain of
  characters, in quiet palettes for dark and light.
- **sdf-glass** makes Glass: a solid raymarched in one shader, refracting the page beneath it and
  melting from shape to shape while the page melts from words to drawings, at the screen's own rate.

Open the repository in your agent and ask for what you want, such as "a garden for the Patagonian
steppe" or "this portrait as a line engraving". The matching skill takes it from there.

## Getting started

You need Node.js 24 or later. Node runs the TypeScript as it stands, so the tools need no build
step. The screenshot and benchmark tools also drive your installed Google Chrome.

```sh
npm install
npm run dev    # the Garden at http://localhost:5173, rebuilt whenever you save
```

| Command | What it does |
|---|---|
| `npm run dev` | Draws the plants, builds the Garden, serves it, and rebuilds when a source changes. |
| `npm run build` | Type-checks everything and builds the Garden into `garden/dist/`. |
| `npm run look` | Takes screenshots of every garden layout, by day and by night. |
| `npm run footers` | Writes the Footers demo to `footers/automaton.html`. Add `?world=crayon`, or another world, to choose one. |
| `npm run bench` | Serves the portrait bench at http://localhost:5288. |
| `npm run collage:render -- <motif>` | Renders a Collage motif's sculpture scan in Blender into the passes its drawings are made from. |
| `npm run collage:draw` | Draws every Collage motif in each of its hands into `collage/art/`. |
| `npm run assembly` | Serves Assembly at http://localhost:5310/, with the pointers' specimen sheet at `studies/pointers/`, and rebuilds when a source changes. |
| `npm run flotsam` | Serves Flotsam at http://localhost:5340/, at every address, and rebuilds when a source changes. |
| `npm run monoline` | Serves Monoline's card at http://localhost:5350/, with `?sheet` for a dozen arrangements at once and `?layers` for one layer alone, and rebuilds when a source changes. |
| `npm run rain` | Serves Rain at http://localhost:5360/, with `?rate=0` for the figure alone and `?mode=` for dark or light, and rebuilds when a source changes. |
| `npm run glass` | Serves Glass at http://localhost:5370/, with `?shape=` to start as one shape, `?still` to hold it in the middle and `?picture` to open on a drawing, and rebuilds when a source changes. |
| `npm run flotsam:measure` | Measures Flotsam in a Chrome of its own: the page's frames, the water's thread, and whether the water sleeps when still. |
| `npm run site` | Builds delineate's site into `site/dist/`: its page, and the Garden, the Footers demo, Characters, Collage, Paprika Girl's separation page and Assembly that its sections open, Rain and Glass, which its footer lists, and Flotsam as its `404.html`. Collage needs `npm run collage:draw` first. It also renders, in Chrome, the card a shared link shows. |
| `npm run deploy` | Builds the site and publishes it to GitHub Pages, at https://delineate.appautomaton.com/. Pushing `main` runs it first, and holds the push back if the site fails to build; `git push --no-verify` skips it. |
| `npm run check` | Type-checks every part of the repository. |

## What is not in the repository

Images and video stay out of git. The pictures the portraits are drawn from, and the region maps cut
from them, are kept locally. A fresh clone can read every line of the portraits' code but cannot
rebuild them, and `npm run site` needs a built portrait. Collage's sculpture scans and their renders
are kept locally too; each motif in `collage/motifs.js` names where its scan is published, and
rendering one needs Blender. The Garden and the Footers build from the repository alone.

## Layout

```
garden/      the Garden: plants drawn in code, and the site that grows them
footers/     the Footers component and its seven worlds
characters/  the field of letters and its page
collage/     the collage cards, their page, and the scripts that render and draw them
portraits/   the portrait pieces and the harness that builds them
assembly/    the crew of hands, its engine, and the page they build
flotsam/     the page not found: its water, its numerals and its sea floor
monoline/    the vase that keeps changing its flowers: pen, bottles, plants and palette
rain/        the figure in a rain of characters: bodies, umbrella, rain and palettes
glass/       the solid of glass over the page: its shader, its stage and what lies under it
site/        delineate's own page
tools/       the small static server the dev tools share
.agents/     the agent skills
.githooks/   the hook that publishes the site when main is pushed
AGENTS.md    how to work here: a worktree per piece of work, and what a push to main does
```

Assembly, Characters, Flotsam, Footers, Glass, Monoline, Rain and the site keep a `notes.md` beside their code with
the rules a change must keep; [`garden/climates.md`](garden/climates.md) holds the gardens' botany.

## License

[MIT](LICENSE). Take what you like; keep the notice.
