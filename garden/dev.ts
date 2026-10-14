// The Garden while it is being made: built, served, and built again whenever one of its sources changes, every
// open page reloading itself once the new build is in.
//
//   npm run dev [-- <port>]        (default 5173)

import { watch } from "node:fs";
import { fileURLToPath } from "node:url";
import { serve } from "../tools/serve.ts";
import { DIST, build } from "./build.ts";

const GARDEN = fileURLToPath(new URL("./", import.meta.url));
// What a build writes, and what other tools write beside the sources, never starts one.
const IGNORED = /^(dist|look)(\/|$)/;

build();
// The plants and their close studies are served as npm run draw leaves them, so a redrawn plant needs only a reload.
const mounts = { "/garden": `${GARDEN}public/garden`, "/gallery/details": `${GARDEN}gallery/details` };
const { url, notify } = await serve(DIST, { port: Number(process.argv[2] ?? 5173), mounts, reload: true });
console.log(`the garden at ${url}, the gallery at ${url}gallery/`);

let pending: ReturnType<typeof setTimeout> | undefined;
watch(GARDEN, { recursive: true }, (_, file) => {
  if (!file || IGNORED.test(file)) return;
  // A save often writes more than one file; build once they are all down.
  clearTimeout(pending);
  pending = setTimeout(() => {
    try {
      build();
      notify("reload");
      console.log(`rebuilt for ${file}`);
    } catch {
      console.error(`the build failed for ${file}; the last good build is still served`);
    }
  }, 120);
});
