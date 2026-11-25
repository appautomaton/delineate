// Local dev server for Patch (ports 5410-5414).
//
//   node patch/dev.ts [port]        (default 5410)

import { execFileSync } from "node:child_process";
import { watch } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "../tools/serve.ts";

const HERE = fileURLToPath(new URL("./", import.meta.url));
const OUT = join(tmpdir(), "d3lin3at3-patch");
const IGNORED = /^dist(\/|$)/;

const build = () =>
  execFileSync(process.execPath, [join(HERE, "build.ts"), OUT], { stdio: "inherit" });

build();
const { url, notify } = await serve(OUT, { port: Number(process.argv[2] ?? 5410), reload: true });
console.log(`Embroidered Micrographic at ${url}, built in ${OUT}`);

let pending: ReturnType<typeof setTimeout> | undefined;
watch(HERE, { recursive: true }, (_, file) => {
  if (!file || IGNORED.test(file)) return;
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
