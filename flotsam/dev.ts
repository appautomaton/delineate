// Flotsam while it is being made: built into the system's temporary folder, served, and built again whenever a
// source changes, every open page reloading itself once the new build is in. Every address shows the page, as
// every address that leads nowhere does on the site.
//
//   npm run flotsam [-- <port>]        (default 5340)

import { watch } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "../tools/serve.ts";
import { build } from "./build.ts";

const HERE = fileURLToPath(new URL("./", import.meta.url));
const OUT = join(tmpdir(), "d3lin3at3-flotsam");
// What a build writes never starts one.
const IGNORED = /^dist(\/|$)/;

build(OUT);
const { url, notify } = await serve(OUT, { port: Number(process.argv[2] ?? 5340), reload: true });
console.log(`Flotsam at ${url}, built in ${OUT}`);

let pending: ReturnType<typeof setTimeout> | undefined;
watch(HERE, { recursive: true }, (_, file) => {
  if (!file || IGNORED.test(file)) return;
  // A save often writes more than one file; build once they are all down.
  clearTimeout(pending);
  pending = setTimeout(() => {
    try {
      build(OUT);
      notify("reload");
      console.log(`rebuilt for ${file}`);
    } catch {
      console.error(`the build failed for ${file}; the last good build is still served`);
    }
  }, 120);
});
