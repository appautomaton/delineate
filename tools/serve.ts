// Serves a folder of built files, as they stand, for looking at in a browser.
//
//   node tools/serve.ts <folder> [port]

import { readFile, stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { extname, join, resolve, sep } from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

// Serves `folder` on `port`: a path names a file under it, a folder its index.html. Nothing is cached, so a
// reload always shows the latest build.
export function serve(folder: string, port: number): Server {
  const root = resolve(folder);
  return createServer(async (req, res) => {
    let file = join(root, decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname));
    if (file !== root && !file.startsWith(root + sep)) return void res.writeHead(403).end();
    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" }).end(body);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" }).end("not found");
    }
  }).listen(port, () => console.log(`serving ${folder} at http://localhost:${port}/`));
}

if (import.meta.main) {
  const [folder, port = "5190"] = process.argv.slice(2);
  if (!folder) throw new Error("usage: node tools/serve.ts <folder> [port]");
  serve(folder, Number(port));
}
