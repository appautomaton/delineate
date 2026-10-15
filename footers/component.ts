// The footer as a component: footer.html, footer.css, footer.js and early.js, around the worlds a site chooses.
//
// Each world lives in worlds/<id>/ as art.html (markup), style.css, life.js and gen.ts, whose placeholders() fills
// the {{NAME}} holes in the other three. sites/<site>.html fills the footer's own slots for each site that uses it.

import { readFileSync } from "node:fs";
import { scopeCss } from "./assemble/scope.ts";
import { pruneDefs, unfoldLife } from "./assemble/unfold.ts";
import { fill } from "./lib/template.ts";
import * as alfama from "./worlds/alfama/gen.ts";
import * as crayon from "./worlds/crayon/gen.ts";
import * as deep from "./worlds/deep/gen.ts";
import * as desert from "./worlds/desert/gen.ts";
import * as glasshouse from "./worlds/glasshouse/gen.ts";
import * as lijiang from "./worlds/lijiang/gen.ts";
import * as observatory from "./worlds/observatory/gen.ts";

// A world's generator: the values for its holes, drawn afresh on each call, and its 16 x 16 picker glyph.
export type Generator = { placeholders(): Record<string, string>; GLYPH: string };

export const WORLDS = {
  desert: { name: "Desert", gen: desert },
  lijiang: { name: "Li River", gen: lijiang },
  deep: { name: "The Deep", gen: deep },
  alfama: { name: "Alfama", gen: alfama },
  glasshouse: { name: "Glasshouse", gen: glasshouse },
  observatory: { name: "Observatory", gen: observatory },
  crayon: { name: "Crayon", gen: crayon },
} satisfies Record<string, { name: string; gen: Generator }>;
export type World = keyof typeof WORLDS;

// Each site: its worlds in picker order (the first opens), the key it keeps a visitor's choices under, and the
// light it opens in when there is none yet (null: the system's).
export const SITES = {
  automaton: { worlds: ["desert", "lijiang", "deep", "alfama", "glasshouse", "observatory", "crayon"], store: "automaton", theme: null },
  delineate: { worlds: ["desert", "lijiang", "deep", "alfama", "glasshouse", "observatory", "crayon"], store: "delineate", theme: "day" },
} satisfies Record<string, { worlds: World[]; store: string; theme: "day" | "night" | null }>;
export type Site = keyof typeof SITES;

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

// The worlds' scoped stylesheets, their markup as inert templates, their scripts, and their picker glyphs. A world
// named in `apart` keeps its markup in a file of its own, returned in `files`, and its template only names it,
// so a page carries the scene it opens on and fetches another only when it is first chosen.
function worlds(ids: readonly World[], apart: { worlds: readonly World[]; at: string } = { worlds: [], at: "" }) {
  const [css, templates, scripts, glyphs]: string[][] = [[], [], [], []];
  const files: Record<string, string> = {};
  for (const id of ids) {
    const { name, gen } = WORLDS[id];
    const values = gen.placeholders();
    const style = fill(read(`worlds/${id}/style.css`), values, `${id}/style.css`);
    css.push(scopeCss(style, `.world--${id}`));
    const art = pruneDefs(unfoldLife(fill(read(`worlds/${id}/art.html`), values, `${id}/art.html`), style), style);
    if (apart.worlds.includes(id)) {
      files[`${id}.html`] = art;
      templates.push(`<template id="world-${id}" data-world="${id}" data-name="${name}" data-src="${apart.at}${id}.html"></template>`);
    } else templates.push(`<template id="world-${id}" data-world="${id}" data-name="${name}">\n${art}</template>`);
    scripts.push(fill(read(`worlds/${id}/life.js`), values, `${id}/life.js`));
    glyphs.push(`    <g id="glyph-${id}">${gen.GLYPH}</g>`);
  }
  return { css: css.join("\n\n"), templates: templates.join("\n\n"), scripts: scripts.join("\n"), glyphs: glyphs.join("\n"), files };
}

function picker(ids: readonly World[]): string {
  const buttons = ids
    .map(
      (id) =>
        `      <button type="button" role="radio" aria-checked="false" tabindex="-1" aria-label="${WORLDS[id].name}" data-world="${id}">` +
        `<svg viewBox="0 0 16 16" aria-hidden="true"><use href="#glyph-${id}"/></svg></button>`,
    )
    .join("\n");
  return `<div class="scene-picker" role="radiogroup" aria-label="Scene">
    <span class="picker-track">
      <span class="picker-knob" aria-hidden="true"></span>
${buttons}
    </span>
    <span class="picker-name" aria-hidden="true">${WORLDS[ids[0]].name}</span>
  </div>`;
}

// A site's footer content, from sites/<site>.html: each slot opens with <!-- slot: NAME -->.
function slots(site: Site): Record<string, string> {
  const parts = read(`sites/${site}.html`).split(/<!-- slot: (\w+) -->\n/).slice(1);
  const out: Record<string, string> = {};
  for (let i = 0; i + 1 < parts.length; i += 2) out[parts[i]] = parts[i + 1].replace(/\n+$/, "");
  return out;
}

// The component's parts for a site, by the hole each fills in a page.
export function component(site: Site): Record<string, string> {
  return parts(site).parts;
}

// The same, with every world but the first kept apart in files to be served from `at` (a path from the page), so
// the page carries only the scene it opens on.
export function componentApart(site: Site, at: string): { parts: Record<string, string>; files: Record<string, string> } {
  return parts(site, { worlds: SITES[site].worlds.slice(1), at });
}

function parts(site: Site, apart?: { worlds: readonly World[]; at: string }): { parts: Record<string, string>; files: Record<string, string> } {
  const { worlds: ids, store, theme } = SITES[site];
  const { css, templates, scripts, glyphs, files } = worlds(ids, apart);
  const common = { STORE: store, WORLD_IDS: `[${ids.map((id) => JSON.stringify(id)).join(", ")}]`, DEFAULT_THEME: JSON.stringify(theme) };
  const out = {
    DEFAULT_WORLD: ids[0],
    PICKER: picker(ids),
    EARLY: fill(read("early.js"), common, "early.js"),
    FOOTER_CSS: read("footer.css"),
    WORLD_CSS: css,
    FOOTER: fill(read("footer.html"), { ...slots(site), GLYPHS: glyphs, PICKER: picker(ids) }, "footer.html"),
    WORLD_TEMPLATES: templates,
    FOOTER_JS: fill(read("footer.js"), { ...common, WORLD_JS: scripts }, "footer.js"),
  };
  return { parts: out, files };
}

// The footer alone, to place at the end of a host page's body. The host sets its type on .site-footer.
export function kit(parts: Record<string, string>): string {
  return (
    `<style>\n${parts.FOOTER_CSS}\n${parts.WORLD_CSS}\n</style>\n<script>\n${parts.EARLY}</script>\n` +
    `${parts.FOOTER}\n${parts.WORLD_TEMPLATES}\n<script>\n${parts.FOOTER_JS}</script>\n`
  );
}

// The Automaton demo page: the footer under a product's home page.
export const demo = () => fill(read("page.html"), component("automaton"), "page.html");
