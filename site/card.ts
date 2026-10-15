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
      await page.evaluate(`document.querySelector(".headline").insertAdjacentHTML("afterend", '<p class="works">Garden · Footers · Characters · Collage · Portraits · Assembly</p>')`);
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
      // The Footers section of delineate's page, its foot at the card's foot.
      // Its links and its switch of light are for the page, not the card; the picker of seven worlds stays.
      await page.addStyleTag({ content: ".bar, .fab, .footer-show .show-take, .footer-show .theme-toggle { display: none !important; }" });
      await page.evaluate(`(() => { const s = document.querySelector(".footer-show"); scrollTo(0, s.getBoundingClientRect().bottom + scrollY - innerHeight); })()`);
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
