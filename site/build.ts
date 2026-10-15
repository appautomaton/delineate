// Builds delineate's own page into site/dist, ready to serve as it stands.
//
//   node site/build.ts        (npm run site, which draws the garden first)
//
// page.html is the page, with {{NAME}} holes for what is drawn: the opening bouquet (hero.ts), the icons and the
// tab's mark (icons.ts), the foot of the page, drawn by the Footers' crayon world, and the Footers piece itself,
// the real component built as a kit for this site. Beside it go what it borrows: Garden's stylesheets and the
// plants its bed grows, and Paprika Girl split into planes (portrait.ts). Beside that goes the work each section
// opens: the Garden at garden/, the Footers' demo at footers/, Characters at characters/, Collage at collage/ (its
// card, which this page also shows, and the drawings npm run collage:draw makes), Paprika Girl's separation page at
// portraits/paprika-girl/, and Assembly at assembly/ (its sheet, show.js, is what this page shows of it).

import { execFileSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build as buildAssembly } from "../assembly/build.ts";
import { DIST as GARDEN, build as buildGarden } from "../garden/build.ts";
import { WORLDS, componentApart, kit } from "../footers/component.ts";
import { TOOTH } from "../footers/crayon/hand.ts";
import { fixed } from "../footers/lib/number.ts";
import { fill } from "../footers/lib/template.ts";
import { markup } from "./hero.ts";
import { CARDS, SIZE, cardFile, renderCards, type Card } from "./card.ts";
import { headline } from "./headline.ts";
import { favicon, icons, marks } from "./icons.ts";
import { planes } from "./portrait.ts";

const ROOT = new URL("../", import.meta.url);
// Where the site is served: links shared elsewhere, and the card they show, name it in full.
const SITE = "https://delineate.appautomaton.com/";
const DIST = new URL("site/dist/", ROOT);

const read = (path: string) => readFileSync(new URL(path, ROOT), "utf8");

// A file another build writes; if it has not been written, say which command writes it.
function made(path: string, by: string): URL {
  const url = new URL(path, ROOT);
  if (!existsSync(url)) {
    console.error(`${path} is missing: run ${by} first`);
    process.exit(1);
  }
  return url;
}

function write(path: string, text: string): void {
  const url = new URL(path, DIST);
  mkdirSync(new URL("./", url), { recursive: true });
  writeFileSync(url, text);
}

// Seconds until a crayon drawing is done: when its last strand ends.
const drawingTime = (...parts: string[]) =>
  Math.max(...parts.flatMap((p) => [...p.matchAll(/--d:([\d.]+)s;--t:([\d.]+)s/g)].map(([, d, t]) => Number(d) + Number(t))));

const template = read("site/page.html");
rmSync(DIST, { recursive: true, force: true });

// The foot of the page is drawn by the crayon world's generator, under ids of its own: the Footers section may be
// showing the same world, and ids are shared by the whole page.
const foot = Object.fromEntries(
  Object.entries(WORLDS.crayon.gen.placeholders()).map(([k, v]) => [k, v.replaceAll('id="cr-', 'id="lf-').replaceAll("url(#cr-", "url(#lf-")]),
);
// The Footers piece carries the world it opens on; the others wait in assets/footers/ until they are chosen.
const footer = componentApart("delineate", "assets/footers/");
const bouquet = markup();
const heroTime = fixed(drawingTime(bouquet), 2);
const page = fill(
  template,
  {
    HERO: bouquet,
    HERO_TIME: heroTime,
    FOOTER_KIT: kit(footer.parts),
    FOOT_TIME: fixed(drawingTime(...Object.values(foot)), 2),
    TOOTH,
    ...Object.fromEntries(Object.entries(icons()).map(([k, v]) => [`ICON_${k.toUpperCase()}`, v])),
    ...marks(),
    ...(({ lines, time }) => ({ HEADLINE_TIME: String(time), ...Object.fromEntries(lines.map((svg, k) => [`HEADLINE_${k}`, svg])) }))(headline()),
  },
  "site/page.html",
);
write("index.html", page);
for (const [name, html] of Object.entries(footer.files)) write(`assets/footers/${name}`, html);
write("assets/foot.html", fill(read("site/foot.html"), Object.fromEntries(Object.entries(foot).map(([k, v]) => [`FOOT_${k}`, v])), "site/foot.html"));
write("favicon.svg", favicon());

// From Garden: its tokens, their dark light keyed to this page's night so the plants change with the page; its
// paint and anchors; and the plants the bed grows, as the page's PLANTS names them.
write("assets/garden/tokens.css", read("garden/src/tokens.css").replaceAll(':root[data-theme="dark"]', ':root[data-theme="night"]'));
write("assets/garden/paint.css", read("garden/src/garden/paint.css"));
write("assets/garden/anchors.css", readFileSync(made("garden/src/garden/anchors.css", "npm run draw"), "utf8"));
for (const [, name] of template.matchAll(/\{ name: "([\w-]+)"/g)) {
  copyFileSync(made(`garden/public/garden/${name}.svg`, "npm run draw"), new URL(`assets/garden/${name}.svg`, DIST));
}

// From Portraits: Paprika Girl, one plane per layer, for the page to stack and part.
const layers = planes(readFileSync(made("portraits/pieces/paprika-girl/paprika-girl.svg", "npm run paprika-girl"), "utf8"));
for (const { name, svg } of layers) write(`assets/portrait/${name}.svg`, svg);
write("assets/portrait/layers.json", JSON.stringify(layers.map(({ name, title }) => ({ name, title })), null, 1));

// The work each section opens, each as it stands on its own, but wearing this site's tab mark: a page with no
// icon of its own has the browser ask for /favicon.ico, which is not here.
buildGarden();
cpSync(GARDEN, new URL("garden/", DIST), { recursive: true });
mkdirSync(new URL("footers/", DIST), { recursive: true });
execFileSync(process.execPath, [fileURLToPath(new URL("footers/build.ts", ROOT)), fileURLToPath(new URL("footers/index.html", DIST))]);
for (const file of ["index.html", "field.js", "foot.js", "scenes.js"]) write(`characters/${file}`, read(`characters/${file}`));
for (const file of ["index.html", "page.js", "card.js", "card.css", "motifs.js"]) write(`collage/${file}`, read(`collage/${file}`));
cpSync(made("collage/art/", "npm run collage:draw"), new URL("collage/art/", DIST), { recursive: true });
write("portraits/paprika-girl/index.html", readFileSync(made("portraits/pieces/paprika-girl/index.html", "npm run paprika-girl"), "utf8"));
buildAssembly(fileURLToPath(new URL("assembly/", DIST)));
for (const path of ["garden/index.html", "garden/gallery/index.html", "footers/index.html", "portraits/paprika-girl/index.html"]) {
  const html = readFileSync(new URL(path, DIST), "utf8"), up = "../".repeat(path.split("/").length - 1);
  write(path, html.replace("</head>", `<link rel="icon" href="${up}favicon.svg" type="image/svg+xml">\n</head>`));
}

// Each page names the card a shared link to it shows, with its title, description and address in full; the
// cards are drawn from the pages as built.
const attr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
function share(card: Card): void {
  const path = `${card.page}index.html`, html = readFileSync(new URL(path, DIST), "utf8");
  // A page's own title and description are written as markup already; a card's own are plain text.
  const title = card.title ? attr(card.title) : (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "delineate");
  const description = card.description ? attr(card.description) : (html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
  const tags = [
    `<link rel="canonical" href="${SITE}${card.page}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="delineate">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${SITE}${card.page}">`,
    `<meta property="og:image" content="${SITE}${cardFile(card)}">`,
    `<meta property="og:image:width" content="${SIZE.width * SIZE.scale}">`,
    `<meta property="og:image:height" content="${SIZE.height * SIZE.scale}">`,
    `<meta property="og:image:alt" content="${attr(card.alt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ];
  write(path, html.replace("</head>", `${tags.join("\n")}\n</head>`));
}
CARDS.forEach(share);
await renderCards(DIST);

console.log(`wrote site/dist: index.html ${Math.floor(Buffer.byteLength(page) / 1024)} KB, the bouquet draws in ${heroTime}s, ${layers.length} portrait planes, and ${CARDS.length} cards`);
