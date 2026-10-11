// A piece's page: the stage (page.html) with the piece's own words and settings, and its drawing
// inlined, so the page opens from disk and needs nothing beside it.
//
//   node portraits/harness/stage/page.ts portraits/pieces/<piece>   rewrites the piece's page from its drawing
//
// A piece keeps its words in page.ts, as PAGE, and its drawing as <piece>.svg.

import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type Page = {
  title: string; // the document's
  description: string;
  eyebrow: string;
  heading: string; // markup
  intro: string; // markup
  label: string; // markup: the wall label beneath the list of planes
  alt: string; // what the picture shows, for whoever cannot see it
  theme?: Partial<Record<"ground" | "ink" | "mid" | "dim" | "accent", string>>; // colors, as CSS
  settings?: Partial<{ reach: number; gap: number; lie: number; turn: number; shrink: number; orbit: [number, number]; settle: number }>; // see page.html
};

const TEMPLATE = readFileSync(new URL("page.html", import.meta.url), "utf8");
const text = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function pageMarkup(page: Page, drawing: string): string {
  const slots: Record<string, string> = {
    title: text(page.title),
    description: text(page.description),
    eyebrow: text(page.eyebrow),
    heading: page.heading,
    intro: page.intro,
    label: page.label,
    alt: text(page.alt),
    theme: Object.entries(page.theme ?? {})
      .map(([k, v]) => `--${k}: ${v};`)
      .join(" "),
    settings: JSON.stringify(page.settings ?? {}),
  };
  const [before, after] = TEMPLATE.split("{{drawing}}");
  const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => slots[k]);
  return fill(before) + drawing.trim() + fill(after);
}

// Writes `dir`/index.html.
export function writePage(dir: URL, page: Page, drawing: string) {
  writeFileSync(new URL("index.html", dir), pageMarkup(page, drawing));
}

if (import.meta.main) {
  const dir = pathToFileURL(resolve(process.argv[2]) + "/");
  const { PAGE } = (await import(new URL("page.ts", dir).href)) as { PAGE: Page };
  writePage(dir, PAGE, readFileSync(new URL(`${basename(dir.pathname)}.svg`, dir), "utf8"));
}
