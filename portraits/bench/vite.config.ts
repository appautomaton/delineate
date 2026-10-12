// The bench: where a piece is drawn, in view of whoever is watching. It shows the piece's references
// and its versions side by side, over one box of the picture, and redraws as the piece is built.
//
//   npm run bench, then http://localhost:5288/?piece=<piece>
//
// Saving any file of a piece rebuilds it (its build.ts, with OUT set) into a new version under
// .cache/bench/<piece>/, and every open bench redraws. References are the PNGs in
// portraits/references/<piece>/; anything the bench should show beside them goes there too.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type ViteDevServer, defineConfig } from "vite";

const PORTRAITS = fileURLToPath(new URL("..", import.meta.url));
const VERSIONS = fileURLToPath(new URL("../../.cache/bench/", import.meta.url));
const TYPES: Record<string, string> = { ".png": "image/png", ".svg": "image/svg+xml", ".html": "text/html" };

type Build = { piece: string; version?: string; ok: boolean; seconds: number; log: string };
const last = new Map<string, Build>();

const versionsOf = (piece: string) =>
  existsSync(join(VERSIONS, piece)) ? readdirSync(join(VERSIONS, piece)).filter((f) => f.endsWith(".svg")).sort() : [];

// Builds a piece into its next version, one build at a time per piece; a save during a build
// queues one more.
const running = new Set<string>();
const queued = new Set<string>();
function build(server: ViteDevServer, piece: string) {
  if (running.has(piece)) return void queued.add(piece);
  running.add(piece);
  mkdirSync(join(VERSIONS, piece), { recursive: true });
  const n = versionsOf(piece).length + 1;
  const version = `v${String(n).padStart(3, "0")}.svg`;
  const started = Date.now();
  let log = "";
  const child = spawn(process.execPath, [join(PORTRAITS, "pieces", piece, "build.ts")], { env: { ...process.env, OUT: join(VERSIONS, piece, version) } });
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  child.on("close", (code) => {
    const done: Build = { piece, version: code === 0 ? version : undefined, ok: code === 0, seconds: (Date.now() - started) / 1000, log: log.trim().split("\n").slice(-12).join("\n") };
    last.set(piece, done);
    server.ws.send({ type: "custom", event: "bench:built", data: done });
    running.delete(piece);
    if (queued.delete(piece)) build(server, piece);
  });
}

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  // Kept beside the versions, so the bench writes nothing into node_modules (a worktree may share it).
  cacheDir: fileURLToPath(new URL("../../.cache/vite-bench/", import.meta.url)),
  server: { port: 5288, strictPort: true },
  plugins: [
    {
      name: "bench",
      configureServer(server) {
        // What a piece has to show: its references and its versions, and how its last build went.
        server.middlewares.use("/api/piece", (req, res) => {
          const piece = new URL(req.url!, "http://bench").searchParams.get("name") ?? "";
          const refs = join(PORTRAITS, "references", piece);
          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify({
              references: existsSync(refs) ? readdirSync(refs).filter((f) => /\.(png|svg)$/.test(f)).sort() : [],
              versions: versionsOf(piece),
              build: last.get(piece) ?? null,
            }),
          );
        });
        // Files: /files/references/<piece>/<name>, /files/versions/<piece>/<name>, /files/pieces/<piece>/<name>.
        server.middlewares.use("/files", (req, res, next) => {
          const path = decodeURIComponent(new URL(req.url!, "http://bench").pathname).replace(/^\//, "");
          const [kind, ...rest] = path.split("/");
          const base = kind === "versions" ? VERSIONS : kind === "references" || kind === "pieces" ? join(PORTRAITS, kind) : undefined;
          const file = base && join(base, ...rest);
          if (!file || !file.startsWith(base) || !existsSync(file)) return next();
          res.setHeader("content-type", TYPES[extname(file)] ?? "application/octet-stream");
          res.setHeader("cache-control", "no-store");
          res.end(readFileSync(file));
        });
        // A saved file of a piece rebuilds it. Its outputs are written elsewhere, so they do not.
        // Polled: Vite's own watcher leaves alone what lies outside the bench's root, and a recursive
        // fs.watch can run out of file handles. A piece has a few files; reading their times is cheap.
        const pieces = join(PORTRAITS, "pieces");
        const seen = new Map<string, number>();
        const scan = (first: boolean) => {
          for (const piece of readdirSync(pieces)) {
            const dir = join(pieces, piece);
            if (!statSync(dir).isDirectory()) continue;
            let changed = false;
            for (const file of readdirSync(dir).filter((f) => extname(f) === ".ts")) {
              const time = statSync(join(dir, file)).mtimeMs;
              if (seen.get(join(dir, file)) !== time) (changed = !first), seen.set(join(dir, file), time);
            }
            if (changed) build(server, piece);
          }
        };
        scan(true);
        setInterval(() => scan(false), 600);
        server.middlewares.use("/api/build", (req, res) => {
          const piece = new URL(req.url!, "http://bench").searchParams.get("name") ?? "";
          if (existsSync(join(pieces, piece, "build.ts"))) build(server, piece);
          res.end();
        });
      },
    },
  ],
});
