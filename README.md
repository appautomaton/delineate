# delineate

**d3lin3at3** · Drawings that move when you do.

[![Node.js 24+](https://img.shields.io/badge/node-24%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript 7](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Runtime dependencies: none](https://img.shields.io/badge/runtime%20dependencies-none-2ea44f)](package.json)
[![Agent skills: 2](https://img.shields.io/badge/agent%20skills-2-8957e5)](.agents/skills)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/appautomaton/delineate)](https://github.com/appautomaton/delineate/commits/main)

Portraits that come apart, gardens that grow as you scroll, and small worlds at the foot of a web
page. Everything is drawn in code as SVG, and each piece comes with its source and a skill your AI
agent can follow to make one like it.

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

[`site/`](site) builds delineate's own page, which shows all of it on one long sheet.

## Agent skills

A skill is a folder of instructions that an AI coding agent loads when a task calls for it. The two
here live in [`.agents/skills/`](.agents/skills), and `.claude/skills/` links to them for Claude Code.

- **climate-garden** researches how a set of real plants looks, draws each one, colours the garden
  for day and night, lays it out for every screen, and checks the result.
- **layered-svg** turns a picture into a layered, animated SVG in a style you choose, working from
  coarse to fine the way a painter does.

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
| `npm run site` | Builds delineate's site into `site/dist/`: its page, and the Garden, the Footers demo, Characters, Collage, and Paprika Girl's separation page that its sections open. Collage needs `npm run collage:draw` first. It also renders, in Chrome, the card a shared link shows. |
| `npm run deploy` | Builds the site and publishes it to GitHub Pages, at https://appautomaton.github.io/delineate/. |
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
site/        delineate's own page
tools/       the small static server the dev tools share
.agents/     the agent skills
```

Each part keeps notes beside its code: [`footers/notes.md`](footers/notes.md),
[`site/notes.md`](site/notes.md), and [`garden/climates.md`](garden/climates.md) for the gardens'
botany.

## License

[MIT](LICENSE). Take what you like; keep the notice.
