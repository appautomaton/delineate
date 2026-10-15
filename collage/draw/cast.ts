// Cast: the object itself, as the beauty render shows it (the scan in warm ivory, cut out on nothing),
// brought into the drawing's frame so it crops as the drawings do. The one hand that is a picture, not
// a drawing, so it is written as WebP, by libwebp's cwebp.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writePng } from "../../portraits/harness/trace/image.ts";
import type { Fields } from "./fields.ts";

const QUALITY = 86;
const K = 3; // samples a side in each frame pixel

export function cast({ frame: { width, height, scale, x0, y0 }, source: { beauty } }: Fields): Uint8Array {
  const { width: w, height: h, data } = beauty;
  // The render's colour, premultiplied by its opacity, at a source point, by bilinear interpolation.
  const at = (x: number, y: number, into: number[]) => {
    const fx = Math.min(w - 1, Math.max(0, x)), fy = Math.min(h - 1, Math.max(0, y));
    const xa = Math.floor(fx), ya = Math.floor(fy), xb = Math.min(w - 1, xa + 1), yb = Math.min(h - 1, ya + 1);
    const tx = fx - xa, ty = fy - ya;
    for (const [px, py, g] of [[xa, ya, (1 - tx) * (1 - ty)], [xb, ya, tx * (1 - ty)], [xa, yb, (1 - tx) * ty], [xb, yb, tx * ty]]) {
      const p = (py * w + px) * 4, a = (data[p + 3] / 255) * g;
      into[0] += data[p] * a; into[1] += data[p + 1] * a; into[2] += data[p + 2] * a; into[3] += a;
    }
  };
  const out = new Uint8Array(width * height * 4);
  const sum = [0, 0, 0, 0];
  for (let gy = 0; gy < height; gy++)
    for (let gx = 0; gx < width; gx++) {
      sum.fill(0);
      for (let sy = 0; sy < K; sy++)
        for (let sx = 0; sx < K; sx++) at(x0 + (gx + (sx + 0.5) / K) / scale - 0.5, y0 + (gy + (sy + 0.5) / K) / scale - 0.5, sum);
      const a = sum[3] / (K * K), q = (gy * width + gx) * 4;
      if (a > 0) for (let c = 0; c < 3; c++) out[q + c] = Math.round(sum[c] / sum[3]);
      out[q + 3] = Math.round(a * 255);
    }
  const dir = mkdtempSync(join(tmpdir(), "cast-"));
  try {
    writePng(join(dir, "cast.png"), { width, height, data: out });
    execFileSync("cwebp", ["-quiet", "-q", String(QUALITY), "-alpha_q", "100", "-m", "6", join(dir, "cast.png"), "-o", join(dir, "cast.webp")]);
    return readFileSync(join(dir, "cast.webp"));
  } finally {
    rmSync(dir, { recursive: true });
  }
}
