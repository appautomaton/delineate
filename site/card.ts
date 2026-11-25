// The cards a shared link shows: one for delineate's page and one for each work it opens, each rendered from the
// built page itself in Chrome, so a card is always its page. A card is the page's first screen where that screen
// already says what the work is; where it does not, the card is composed from the page's own pieces: the Garden
// gets its name in the clearing its plants leave, Collage a card stopped on the shot that names it, the Footers
// the section of delineate's page that shows one, and Paprika Girl her planes drawn a little apart.
//
// Every card is drawn asking for less motion, so each drawing is laid down finished and nothing drifts.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Page } from "playwright-core";
import { launch } from "../portraits/harness/browser.ts";
import { serve } from "../tools/serve.ts";

// The card's size in CSS px, as a share lays it out, drawn at twice that for sharp crayon.
export const SIZE = { width: 1200, height: 630, scale: 2 };

export type Card = {
  page: string; // the folder of the page the card is for, from the site's root ("" for delineate's own)
  render: string; // the address drawn, from the site's root
  title?: string; // where the page's own <title> will not do
  description?: string; // where the page's own description will not do
  alt: string;
  prepare(page: Page): Promise<void>;
};

const FONTS = "https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif:opsz@12..24&family=IBM+Plex+Mono:wght@500&display=block";
const settle = (page: Page, ms: number) => page.waitForTimeout(ms);

export const CARDS: Card[] = [
  {
    page: "",
    render: "",
    title: "delineate · Drawings that move when you do",
    description: "Gardens that grow as you scroll, small worlds at the foot of a page, portraits that come apart, a picture made of letters, sculptures laid among scraps of paper, and a page made in front of you. Each with its source.",
    alt: "Drawings that move when you do, lettered in crayon beside a bouquet of crayon poppies and anemones.",
    async prepare(page) {
      // A share is seen small: the headline is set larger than the page sets it, and the works named on one line.
      await page.addStyleTag({
        content: `.bar nav, .fab, .lede { display: none !important; }
          .opening-text { max-width: none; }
          .headline { font-size: 80px; }
          .opening .works { max-width: none; margin: 2rem 0 0; font: 500 .75rem/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; color: var(--soft); }`,
      });
      await page.evaluate(`document.querySelector(".headline").insertAdjacentHTML("afterend", '<p class="works">Cut · Moments · Mesh · Assembly · Patch · Characters · Collage · Portraits · Garden · Footers</p>')`);
      await page.waitForFunction("document.querySelector('.headline.is-drawn') && document.querySelector('.bouquet.is-drawn')");
      await settle(page, 1600); // the headline's wash settles under its strokes
    },
  },
  {
    page: "collage/",
    render: "collage/",
    alt: "A collage card of The Panther Hunter, drawn half as an engraving and half as a navy line screen, taped with the words One picture, many hands.",
    async prepare(page) {
      await page.addStyleTag({
        content: `body > *:not(.share) { display: none !important; }
          .share { height: 100vh; display: grid; grid-template-columns: 1fr 34rem; align-items: center; gap: 4rem; padding: 0 5.5rem 0 6.25rem; }
          .share h1 { margin: 0; font: 400 80px/1 var(--serif); letter-spacing: -.015em; }
          .share p { margin: 1.4rem 0 0; max-width: 26rem; color: var(--soft); font-size: 1.0625rem; line-height: 1.55; }
          .share .works { margin-top: 2rem; font: 500 .75rem/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; }
          .share .mark { position: fixed; top: 1.25rem; left: 6.25rem; font: 400 1.375rem/1 var(--serif); }`,
      });
      await page.evaluate(`(async () => {
        document.body.insertAdjacentHTML("beforeend", '<div class="share"><span class="mark">delineate</span><div><h1>Collage</h1><p>One picture, drawn by many hands, laid down again and again among scraps of paper.</p><p class="works">5 sculptures · 4 hands</p></div><div class="host"></div></div>');
        const { mountCard } = await import("./card.js");
        mountCard(document.querySelector(".share .host"), "panther-hunter", { start: 7 });
      })()`);
      await page.waitForFunction("document.querySelector('.share .shot:not([hidden])')");
      await settle(page, 800);
    },
  },
  {
    page: "characters/",
    render: "characters/",
    alt: "The word Characters on a field of letters that spell d3lin3at3, ring by ring, with leaves and flowers growing at its heart.",
    async prepare(page) {
      await page.addStyleTag({ content: ".light, .choose { visibility: hidden !important; }" });
      await settle(page, 2500);
    },
  },
  {
    page: "garden/",
    render: "garden/",
    title: "Garden · delineate",
    description: "Twelve gardens from around the world, drawn plant by plant in watercolour and ink, that grow in round whatever they frame.",
    alt: "The word Garden in the clearing of a tropical garden drawn in watercolour and ink: frangipani, mango, monstera and bird of paradise.",
    async prepare(page) {
      await page.addStyleTag({ url: FONTS });
      await page.addStyleTag({
        content: `.controls { display: none !important; }
          .share { position: fixed; inset: 0; z-index: 50; display: grid; place-content: center; text-align: center; pointer-events: none; color: #1B1B19; }
          .share h1 { margin: 0; font: 400 80px/1 "Hedvig Letters Serif", serif; letter-spacing: -.015em; }
          .share p { margin: 1.25rem 0 0; font: 500 .75rem/1 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; color: #62625C; }`,
      });
      await page.evaluate(`document.body.insertAdjacentHTML("beforeend", '<div class="share"><h1>Garden</h1><p>Twelve gardens · drawn plant by plant</p></div>')`);
      await page.evaluate("document.fonts.ready");
      await settle(page, 2500);
    },
  },
  {
    page: "footers/",
    render: "?world=lijiang",
    title: "Footers · delineate",
    description: "The bottom of a web page, drawn as a small world that rises as you arrive. Seven worlds, each in its own medium.",
    alt: "Footers, over the Li River at dawn drawn in ink and colour: karst peaks in mist and a fisherman's raft with cormorants.",
    async prepare(page) {
      // delineate's unified footer opened on Li River, framed at the card's foot as the Footers piece itself.
      await page.addStyleTag({
        content: `.bar, .fab, .site-footer .sitemap, .site-footer .signoff, .site-footer .theme-toggle { display: none !important; }
          .site-footer .tagline { max-width: 28rem; }`,
      });
      await page.evaluate(`(() => {
        document.querySelector(".site-footer .foot-name").textContent = "Footers";
        document.querySelector(".site-footer .tagline").textContent = "The bottom of a web page, drawn as a small world that rises as you arrive. Seven worlds, each in its own medium.";
        const s = document.querySelector(".site-footer");
        scrollTo(0, s.getBoundingClientRect().bottom + scrollY - innerHeight);
      })()`);
      await settle(page, 2500);
    },
  },
  {
    page: "portraits/paprika-girl/",
    render: "portraits/paprika-girl/",
    title: "Paprika Girl, Apart · delineate",
    alt: "Paprika Girl, a festival portrait redrawn as nine vector planes, drawn a little apart in depth.",
    async prepare(page) {
      await settle(page, 1500);
      await page.evaluate(`(() => { const s = document.querySelector("#apart"); s.value = 55; s.dispatchEvent(new Event("input", { bubbles: true })); })()`);
      await settle(page, 1500);
    },
  },
  {
    // Asking for less motion, Assembly lays its page down finished, so its first screen is the card.
    page: "assembly/",
    render: "assembly/",
    alt: "Watch the page get made, beside a crayon still life of flowers in a glass vase on a table.",
    async prepare(page) {
      await settle(page, 1500);
    },
  },
  {
    page: "moments/",
    render: "moments/?light=night&mode=play",
    alt: "Moments: twenty monochrome UI micro-interactions arranged on a dark specimen sheet.",
    async prepare(page) {
      await settle(page, 600);
    },
  },
  {
    page: "cut/",
    render: "cut/?frame=310&paused=1&hud=0",
    title: "Cut · delineate",
    description: "An eighteen-second film rendered live at 24 frames a second in WebGL2, scored to 134 BPM warehouse techno.",
    alt: "Cut: a smoked optical crystal prism pierced diagonally by a champagne light beam beside the word Form.",
    async prepare(page) {
      await settle(page, 900);
    },
  },
  {
    page: "mesh/",
    render: "mesh/?still",
    alt: "Mesh Gradient: four optical mesh studies—frosted halo, rising laminar plumes, thin-film dispersive crystal, and backlit superellipse glass vessels.",
    async prepare(page) {
      await page.addStyleTag({ url: FONTS });
      await page.addStyleTag({ url: "mesh/card.css" });
      await page.addStyleTag({
        content: `body > *:not(.share) { display: none !important; }
          body { background: #F8F7F2; color: #1B1B19; --paper: #F8F7F2; --ink: #1B1B19; --soft: #62625C; --serif: "Hedvig Letters Serif", Georgia, serif; --sans: "Cabinet Grotesk", system-ui, sans-serif; --mono: "IBM Plex Mono", ui-monospace, monospace; }
          .share { height: 100vh; display: grid; grid-template-columns: 1fr 41rem; align-items: center; gap: 3rem; padding: 0 4.25rem 0 4.75rem; }
          .share h1 { margin: 0; font: 400 72px/1.02 var(--serif); letter-spacing: -.018em; }
          .share p { margin: 1.35rem 0 0; max-width: 24rem; color: var(--soft); font: 440 1.04rem/1.55 var(--sans); font-variation-settings: "wght" 440; }
          .share .works { margin-top: 1.85rem; font: 500 .72rem/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; color: var(--soft); }
          .share .mark { position: fixed; top: 1.5rem; left: 4.75rem; font: 400 1.375rem/1 var(--serif); }
          .share .mg-foot { display: none; }`,
      });
      await page.evaluate(`(async () => {
        document.body.insertAdjacentHTML("beforeend", '<div class="share"><span class="mark">delineate</span><div><h1>Mesh<br>Gradient</h1><p>Four studies in how colour moves through a medium: frosted halo, laminar plume, thin-film crystal, and backlit glass.</p><p class="works">4 optical plates · WebGL2 · OKLab</p></div><div class="host"></div></div>');
        const { mountCard } = await import("./mesh/card.js");
        mountCard(document.querySelector(".share .host"));
      })()`);
      await page.evaluate("document.fonts.ready");
      await page.waitForFunction("document.querySelector('.share .mg-tray')");
      await settle(page, 900);
    },
  },
  {
    page: "patch/",
    render: "patch/?light=day&seed=2026&still=1",
    alt: "Patch: six annual embroidered patches—APEX, PELAGIC, FLORA, HELIOS, KINETIC, and RELAY—laid at slight angles on warm paper across twill, wool felt, cotton duck, and ripstop.",
    async prepare(page) {
      await page.addStyleTag({
        content: `.patch-foot { display: none !important; }
          .patch-shell { min-height: 100vh !important; padding: 14px 28px !important; }
          .patch-grid { grid-template-rows: repeat(2, 286px) !important; gap: 10px !important; }`,
      });
      await page.waitForFunction("Boolean(window.__PATCH_READY__)");
      await page.evaluate("window.dispatchEvent(new Event('resize'))");
      await settle(page, 500);
    },
  },
];

// The card's file, beside its page.
export const cardFile = (card: Card) => `${card.page}card.jpg`;

export async function renderCards(dist: URL): Promise<void> {
  const served = await serve(fileURLToPath(dist));
  const browser = await launch();
  try {
    for (const card of CARDS) {
      const page = await browser.newPage({ viewport: { width: SIZE.width, height: SIZE.height }, deviceScaleFactor: SIZE.scale, reducedMotion: "reduce" });
      await page.goto(served.url + card.render, { waitUntil: "load" });
      await page.evaluate("document.fonts.ready");
      await card.prepare(page);
      writeFileSync(new URL(cardFile(card), dist), await page.screenshot({ type: "jpeg", quality: 90 }));
      await page.close();
    }
  } finally {
    await browser.close();
    await served.close();
  }
}
