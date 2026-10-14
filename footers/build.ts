// Writes the footer.
//
//   node footers/build.ts <out.html>                the Automaton demo page, the footer under a product's home page
//   node footers/build.ts --kit <site> <out.html>   the footer alone, to embed at the end of <site>'s own page

import { writeFileSync } from "node:fs";
import { SITES, component, demo, kit, type Site } from "./component.ts";

const args = process.argv.slice(2);
const [html, out] = args[0] === "--kit" ? [kitFor(args[1]), args[2]] : [demo(), args[0]];
if (!out) throw new Error("usage: node footers/build.ts [--kit <site>] <out.html>");
writeFileSync(out, html);
console.log(`wrote ${out} (${Math.floor(Buffer.byteLength(html) / 1024)} KB)`);

function kitFor(site: string): string {
  if (!(site in SITES)) throw new Error(`no site "${site}": ${Object.keys(SITES).join(", ")}`);
  return kit(component(site as Site));
}
