// delineate's social card: the page's first screen as a link to it shows, rendered from the built page itself in
// Chrome, so the card is always the page. The drawn headline and the bouquet stay, finished; the paragraph, the
// call and the icons are set aside (with the paper the page clears round them), and a line naming the five works
// is set under the headline.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { launch } from "../portraits/harness/browser.ts";
import { serve } from "../tools/serve.ts";

// The card's size in CSS px, as a share lays it out, drawn at twice that for sharp crayon.
export const CARD = { width: 1200, height: 630, scale: 2, file: "card.jpg" };

const WORKS = ["Garden", "Footers", "Characters", "Collage", "Portraits"];

export async function card(dist: URL): Promise<void> {
  const served = await serve(fileURLToPath(dist));
  const browser = await launch();
  try {
    // Asked for less motion, the page lays every drawing down finished, and nothing drifts with the scroll.
    const page = await browser.newPage({ viewport: { width: CARD.width, height: CARD.height }, deviceScaleFactor: CARD.scale, reducedMotion: "reduce" });
    await page.goto(served.url, { waitUntil: "load" });
    await page.addStyleTag({
      // A share is seen small: the headline is set larger than the page sets it, and the works on one line.
      content: `.bar nav, .fab, .lede { display: none !important; }
        .opening-text { max-width: none; }
        .headline { font-size: 80px; }
        .opening .works { max-width: none; margin: 2rem 0 0; font: 500 .75rem/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; color: var(--soft); }`,
    });
    await page.evaluate(`document.querySelector(".headline").insertAdjacentHTML("afterend", '<p class="works">${WORKS.join(" · ")}</p>')`);
    await page.evaluate("document.fonts.ready");
    await page.waitForFunction("document.querySelector('.headline.is-drawn') && document.querySelector('.bouquet.is-drawn')");
    // The headline's wash settles under its strokes.
    await page.waitForTimeout(1600);
    writeFileSync(new URL(CARD.file, dist), await page.screenshot({ type: "jpeg", quality: 90 }));
  } finally {
    await browser.close();
    await served.close();
  }
}
