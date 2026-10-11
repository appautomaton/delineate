// Flattening paint texture before tracing. A bilateral filter averages each pixel with neighbors
// of similar color only, so grain and brush noise settle while painted edges stay sharp. Repeating
// it flattens further without widening edges.

import { opencv } from "./cv.ts";
import type { Raster } from "./image.ts";

export async function bilateral(img: Raster, { diameter = 7, color = 18, space = 4, passes = 2 } = {}): Promise<Raster> {
  const cv = await opencv();
  const rgba = cv.matFromArray(img.height, img.width, cv.CV_8UC4, img.data);
  let src = new cv.Mat();
  cv.cvtColor(rgba, src, cv.COLOR_RGBA2RGB);
  rgba.delete();
  for (let i = 0; i < passes; i++) {
    const dst = new cv.Mat();
    cv.bilateralFilter(src, dst, diameter, color, space, cv.BORDER_REPLICATE);
    src.delete();
    src = dst;
  }
  const out = new cv.Mat();
  cv.cvtColor(src, out, cv.COLOR_RGB2RGBA);
  src.delete();
  const data = Uint8Array.from(out.data);
  out.delete();
  return { width: img.width, height: img.height, data };
}
