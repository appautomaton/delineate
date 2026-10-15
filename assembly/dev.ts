// Assembly while it is being made: built into the system's temporary folder, served, and built again whenever a
// source changes, every open page reloading itself once the new build is in. The page is at the root, the studies
// under studies/. The drawings are made when this starts, so a change to drawings.ts needs a restart.
//
//   npm run assembly [-- <port>]        (default 5310)

import { watch } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "../tools/serve.ts";
import { build } from "./build.ts";

const HERE = fileURLToPath(new URL("./", import.meta.url));
const OUT = join(tmpdir(), "d3lin3at3-assembly");
// What a build writes never starts one.
const IGNORED = /^dist(\/|$)/;

build(OUT);
const { url, notify } = await serve(OUT, { port: Number(process.argv[2] ?? 5310), reload: true });
console.log(`Assembly at ${url}, the pointers at ${url}studies/pointers/, built in ${OUT}`);

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
