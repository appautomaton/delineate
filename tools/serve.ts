// Serves a folder of built files, as they stand, for looking at in a browser; and, for the tools that watch work
// as it is made, routes of their own and a way to tell open pages that something changed.
//
//   node tools/serve.ts <folder> [port]

import { readFile, stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
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
const typeOf = (file: string) => TYPES[extname(file)] ?? "application/octet-stream";

// Pages served with `reload` reload themselves when told to.
const RELOAD = '<script type="module">new EventSource("/events").addEventListener("reload", () => location.reload());</script>';

export type Route = (req: IncomingMessage, res: ServerResponse, url: URL) => void | Promise<void>;
export type Options = {
  // 0 takes any free port.
  port?: number;
  // Other folders, each served under a path prefix of its own.
  mounts?: Record<string, string>;
  // Handlers by path prefix, tried before any folder.
  routes?: Record<string, Route>;
  reload?: boolean;
};
export type Served = {
  url: string;
  // Sends an event to every open page, which hears it on new EventSource("/events").
  notify(event: string, data?: unknown): void;
  close(): Promise<void>;
};

const under = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + "/");

// Serves `folder`: a path names a file under it, a folder its index.html. Nothing is cached, so a reload always
// shows the latest build.
export function serve(folder: string, { port = 0, mounts = {}, routes = {}, reload = false }: Options = {}): Promise<Served> {
  // Each folder by its prefix, the longest first, so a mount wins over the folder it lies in.
  const roots = [...Object.entries(mounts), ["", folder]]
    .map(([prefix, dir]): [string, string] => [prefix.replace(/\/$/, ""), resolve(dir)])
    .sort((a, b) => b[0].length - a[0].length);
  const listeners = new Set<ServerResponse>();
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname === "/events") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store" });
      res.write(": open\n\n");
      listeners.add(res);
      req.on("close", () => listeners.delete(res));
      return;
    }
    const route = Object.keys(routes).find((prefix) => under(url.pathname, prefix));
    if (route) return void (await routes[route](req, res, url));
    const [prefix, root] = roots.find(([p]) => under(url.pathname, p) || p === "")!;
    let file = join(root, decodeURIComponent(url.pathname.slice(prefix.length)));
    if (file !== root && !file.startsWith(root + sep)) return void res.writeHead(403).end();
    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
      let body: Buffer | string = await readFile(file);
      if (reload && extname(file) === ".html") body = body.toString().replace("</body>", `${RELOAD}</body>`);
      res.writeHead(200, { "content-type": typeOf(file), "cache-control": "no-store" }).end(body);
    } catch {
      // A path that names nothing gets the folder's 404.html, if it has one, as GitHub Pages serves it.
      try {
        let body = (await readFile(join(root, "404.html"))).toString();
        if (reload) body = body.replace("</body>", `${RELOAD}</body>`);
        res.writeHead(404, { "content-type": TYPES[".html"], "cache-control": "no-store" }).end(body);
      } catch {
        res.writeHead(404, { "content-type": "text/plain" }).end("not found");
      }
    }
  });
  return new Promise((done) =>
    server.listen(port, () =>
      done({
        url: `http://localhost:${(server.address() as AddressInfo).port}/`,
        notify: (event, data) => {
          for (const res of listeners) res.write(`event: ${event}\ndata: ${JSON.stringify(data ?? null)}\n\n`);
        },
        close: () => {
          for (const res of listeners) res.end();
          return new Promise((closed) => server.close(() => closed()));
        },
      }),
    ),
  );
}

if (import.meta.main) {
  const [folder, port = "5190"] = process.argv.slice(2);
  if (!folder) throw new Error("usage: node tools/serve.ts <folder> [port]");
  const { url } = await serve(folder, { port: Number(port) });
  console.log(`serving ${folder} at ${url}`);
}
