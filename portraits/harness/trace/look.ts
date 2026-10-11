// Looking closely at pictures while tracing them.
//
//   node portraits/harness/trace/look.ts crop <x> <y> <w> <h> <zoom> <out.png> <image.png>...
//       the same box from each image, enlarged with crisp pixels, side by side
//   node portraits/harness/trace/look.ts grid <x> <y> <w> <h> <zoom> <out.png> <image.png> [shapes.json]
//       the box with a coordinate grid (every 25 px, labeled every 100), for reading positions
//       off a reference; shapes.json ({ name: [[x, y], ...] }) draws named outlines over it
//
// Coordinates are always the image's own pixels.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { launch } from "../browser.ts";
import { type Raster, crop, readPng, writePng, zoom } from "./image.ts";

export function sideBySide(images: Raster[], gap = 4): Raster {
  const width = images.reduce((s, i) => s + i.width + gap, -gap);
  const height = Math.max(...images.map((i) => i.height));
  const data = new Uint8Array(width * height * 4).fill(255);
  let ox = 0;
  for (const im of images) {
    for (let y = 0; y < im.height; y++) data.set(im.data.subarray(y * im.width * 4, (y + 1) * im.width * 4), (y * width + ox) * 4);
    ox += im.width + gap;
  }
  return { width, height, data };
}

export async function grid(image: string, [x, y, w, h]: number[], k: number, shapes: Record<string, number[][]> = {}): Promise<Buffer> {
  const src = "data:image/png;base64," + readFileSync(image).toString("base64");
  const [W, H] = [Math.round(w * k), Math.round(h * k)];
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    await page.setContent(`<canvas width=${W} height=${H}></canvas><style>body{margin:0}</style>`);
    const url = await page.evaluate(
      async ({ src, x, y, w, h, k, W, H, shapes }) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const g = document.querySelector("canvas")!.getContext("2d")!;
        g.imageSmoothingEnabled = false;
        g.drawImage(img, x, y, w, h, 0, 0, W, H);
        const line = (v: number, along: "x" | "y") => {
          const major = v % 100 === 0;
          g.strokeStyle = major ? "rgba(0,255,255,.9)" : "rgba(255,255,255,.35)";
          g.lineWidth = major ? 1.5 : 1;
          g.beginPath();
          if (along === "x") (g.moveTo((v - x) * k + 0.5, 0), g.lineTo((v - x) * k + 0.5, H));
          else (g.moveTo(0, (v - y) * k + 0.5), g.lineTo(W, (v - y) * k + 0.5));
          g.stroke();
        };
        for (let v = Math.ceil(x / 25) * 25; v <= x + w; v += 25) line(v, "x");
        for (let v = Math.ceil(y / 25) * 25; v <= y + h; v += 25) line(v, "y");
        g.font = "bold 13px monospace";
        g.lineWidth = 3;
        for (let u = Math.ceil(x / 100) * 100; u <= x + w; u += 100)
          for (let v = Math.ceil(y / 100) * 100; v <= y + h; v += 100) {
            g.strokeStyle = "#000";
            g.strokeText(`${u},${v}`, (u - x) * k + 3, (v - y) * k + 14);
            g.fillStyle = "#0ff";
            g.fillText(`${u},${v}`, (u - x) * k + 3, (v - y) * k + 14);
          }
        const colors = ["#ff0", "#f0f", "#0f0", "#f80", "#08f", "#fff"];
        Object.entries(shapes).forEach(([name, pts], i) => {
          g.strokeStyle = g.fillStyle = colors[i % colors.length];
          g.lineWidth = 2;
          g.beginPath();
          pts.forEach(([px, py], j) => (j ? g.lineTo((px - x) * k, (py - y) * k) : g.moveTo((px - x) * k, (py - y) * k)));
          g.closePath();
          g.stroke();
          g.fillText(name, (pts[0][0] - x) * k + 4, (pts[0][1] - y) * k - 4);
        });
        return g.canvas.toDataURL("image/png");
      },
      { src, x, y, w, h, k, W, H, shapes },
    );
    return Buffer.from(url.split(",")[1], "base64");
  } finally {
    await browser.close();
  }
}

if (import.meta.main) {
  const [mode, ...rest] = process.argv.slice(2);
  const box = rest.slice(0, 4).map(Number);
  const k = Number(rest[4]);
  const out = rest[5];
  if (mode === "crop") writePng(out, sideBySide(rest.slice(6).map((f) => zoom(crop(readPng(f), box[0], box[1], box[2], box[3]), k))));
  else if (mode === "grid") writeFileSync(out, await grid(resolve(rest[6]), box, k, rest[7] ? JSON.parse(readFileSync(rest[7], "utf8")) : {}));
  else throw new Error("usage: look.ts crop|grid x y w h zoom out.png image.png...");
}
