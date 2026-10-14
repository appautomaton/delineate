// The bench: where a piece is drawn, in view of whoever is watching. It shows the piece's references and its
// versions side by side, over one box of the picture, and redraws as the piece is built.
//
//   npm run bench, then http://localhost:5288/?piece=<piece>
//
// Saving any file of a piece rebuilds it (its build.ts, with OUT set) into a new version under .cache/bench/<piece>/,
// and every open bench redraws. References are the PNGs in portraits/references/<piece>/; anything the bench should
// show beside them goes there too.
//
// A piece drawn in layers keeps each layer in a folder of its own with its own build.ts, a piece named
// <piece>/<layer> on the bench that shares the piece's references. Saving a layer's file rebuilds that layer;
// saving a file of the piece itself rebuilds the piece and every layer.

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "../../tools/serve.ts";

const BENCH = fileURLToPath(new URL(".", import.meta.url));
const PORTRAITS = fileURLToPath(new URL("..", import.meta.url));
const VERSIONS = fileURLToPath(new URL("../../.cache/bench/", import.meta.url));
// The bench page, compiled; kept beside the versions, so the bench writes nothing into the sources.
const PAGE = fileURLToPath(new URL("../../.cache/bench-page/", import.meta.url));
const TSC = fileURLToPath(new URL("../../node_modules/.bin/tsc", import.meta.url));

type Build = { piece: string; version?: string; ok: boolean; seconds: number; log: string };
const last = new Map<string, Build>();

// A layer shares its piece's references: the first part of its name.
const referencesOf = (piece: string) => join(PORTRAITS, "references", piece.split("/")[0]);
const versionsOf = (piece: string) =>
  existsSync(join(VERSIONS, piece)) ? readdirSync(join(VERSIONS, piece)).filter((f) => f.endsWith(".svg")).sort() : [];

// The page: its scripts compiled, its markup pointing at them.
execFileSync(TSC, ["-p", BENCH], { stdio: "inherit" });
writeFileSync(join(PAGE, "index.html"), readFileSync(join(BENCH, "index.html"), "utf8").replace('src="./main.ts"', 'src="./main.js"'));

const pieces = join(PORTRAITS, "pieces");
const bench = await serve(PAGE, {
  port: 5288,
  // A piece's files, its references and its versions.
  mounts: { "/files/pieces": pieces, "/files/references": join(PORTRAITS, "references"), "/files/versions": VERSIONS },
  routes: {
    // What a piece has to show: its references and its versions, and how its last build went.
    "/api/piece": (_, res, url) => {
      const piece = url.searchParams.get("name") ?? "";
      const refs = referencesOf(piece);
      res.writeHead(200, { "content-type": "application/json" }).end(
        JSON.stringify({
          references: existsSync(refs) ? readdirSync(refs).filter((f) => /\.(png|svg)$/.test(f)).sort() : [],
          referencesFrom: piece.split("/")[0],
          versions: versionsOf(piece),
          build: last.get(piece) ?? null,
        }),
      );
    },
    "/api/build": (_, res, url) => {
      const piece = url.searchParams.get("name") ?? "";
      if (existsSync(join(pieces, piece, "build.ts"))) build(piece);
      res.end();
    },
  },
});
console.log(`the bench at ${bench.url}?piece=<piece>`);

// Builds a piece into its next version, one build at a time per piece; a save during a build queues one more.
const running = new Set<string>();
const queued = new Set<string>();
function build(piece: string) {
  if (running.has(piece)) return void queued.add(piece);
  running.add(piece);
  mkdirSync(join(VERSIONS, piece), { recursive: true });
  const version = `v${String(versionsOf(piece).length + 1).padStart(3, "0")}.svg`;
  const started = Date.now();
  let log = "";
  const child = spawn(process.execPath, [join(pieces, piece, "build.ts")], { env: { ...process.env, OUT: join(VERSIONS, piece, version) } });
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  child.on("close", (code) => {
    const done: Build = { piece, version: code === 0 ? version : undefined, ok: code === 0, seconds: (Date.now() - started) / 1000, log: log.trim().split("\n").slice(-12).join("\n") };
    last.set(piece, done);
    bench.notify("built", done);
    running.delete(piece);
    if (queued.delete(piece)) build(piece);
  });
}

// A saved file of a piece rebuilds it. Its outputs are written elsewhere, so they do not. Polled, as file events
// do not always reach a sandboxed process, and a recursive watch can run out of file handles; a piece has a few
// files, and reading their times is cheap.
const seen = new Map<string, number>();
const changed = (dir: string, first: boolean) => {
  let any = false;
  for (const file of readdirSync(dir).filter((f) => extname(f) === ".ts")) {
    const time = statSync(join(dir, file)).mtimeMs;
    if (seen.get(join(dir, file)) !== time) (any = !first), seen.set(join(dir, file), time);
  }
  return any;
};
const scan = (first: boolean) => {
  for (const piece of readdirSync(pieces)) {
    const dir = join(pieces, piece);
    if (!statSync(dir).isDirectory()) continue;
    const layers = readdirSync(dir).filter((d) => existsSync(join(dir, d, "build.ts")));
    const own = changed(dir, first);
    if (own && existsSync(join(dir, "build.ts"))) build(piece);
    for (const layer of layers) if (changed(join(dir, layer), first) || own) build(`${piece}/${layer}`);
  }
};
scan(true);
setInterval(() => scan(false), 600);
