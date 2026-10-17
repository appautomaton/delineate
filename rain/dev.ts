// Rain while it is being made: built into the system's temporary folder, served, and built again
// whenever a source changes, every open page reloading itself once the new build is in.
//
//   npm run rain [-- <port>]        (default 5360)

import { execFileSync } from "node:child_process";
import { watch } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "../tools/serve.ts";

const HERE = fileURLToPath(new URL("./", import.meta.url));
const OUT = join(tmpdir(), "d3lin3at3-rain");
// What a build writes never starts one.
const IGNORED = /^dist(\/|$)/;

// In a fresh process each time: the drawings are modules, and a module loaded once stays as it was.
const build = () => execFileSync(process.execPath, [join(HERE, "build.ts"), OUT], { stdio: "inherit" });

build();
const { url, notify } = await serve(OUT, { port: Number(process.argv[2] ?? 5360), reload: true });
console.log(`Rain at ${url}, built in ${OUT}`);

let pending: ReturnType<typeof setTimeout> | undefined;
watch(HERE, { recursive: true }, (_, file) => {
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
