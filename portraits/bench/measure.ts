// Tone against a reference, as the eye sees it from afar: each image blurred past its marks and
// compared in linear light, in the picture's own frame, where the reference is dark and where it
// is light; within `region` ([x0, y0, x1, y1] in picture pixels) if given.

const lin = (v: number) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

// The options every measure shares: the picture's frame in pixels, the blur that hides the marks,
// and the paper laid under an image wherever it is transparent.
type Frame = { width?: number; height?: number; blur?: number; paper?: string };

async function luminance(src: string, { width = 1280, height = width, blur = 6, paper = "#ffffff" }: Frame): Promise<Float32Array> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = new OffscreenCanvas(width, height);
  const g = canvas.getContext("2d")!;
  g.fillStyle = paper;
  g.fillRect(0, 0, width, height);
  g.filter = `blur(${blur}px)`;
  g.drawImage(img, 0, 0, width, height);
  const d = g.getImageData(0, 0, width, height).data;
  return Float32Array.from({ length: width * height }, (_, p) => 0.2126 * lin(d[p * 4]) + 0.7152 * lin(d[p * 4 + 1]) + 0.0722 * lin(d[p * 4 + 2]));
}

export type Tone = { dark: number; plateDark: number; offDark: number; light: number; plateLight: number; offLight: number };

// `reference` and each of `srcs` are URLs of images in the same frame. Where the reference is
// lighter than `bare` (in linear light), it shows bare paper round its subject and is left out;
// by default nothing is.
export async function measure(reference: string, srcs: string[], { region = [0, 0, Infinity, Infinity], bare = Infinity, ...frame }: Frame & { region?: number[]; bare?: number } = {}): Promise<Record<string, Tone>> {
  const width = frame.width ?? 1280;
  const plate = await luminance(reference, frame);
  const out: Record<string, Tone> = {};
  for (const src of srcs) {
    const ours = await luminance(src, frame);
    const sum = { dark: [0, 0, 0, 0], light: [0, 0, 0, 0] };
    const [x0, y0, x1, y1] = region;
    plate.forEach((a, p) => {
      const [x, y] = [p % width, Math.floor(p / width)];
      if (a > bare || x < x0 || x >= x1 || y < y0 || y >= y1) return;
      const s = a < 0.2 ? sum.dark : sum.light;
      s[0]++;
      s[1] += ours[p];
      s[2] += a;
      s[3] += Math.abs(ours[p] - a);
    });
    const r = (v: number) => Math.round(v * 1e4) / 1e4;
    out[src.split("/").pop()!] = {
      dark: r(sum.dark[1] / sum.dark[0]), plateDark: r(sum.dark[2] / sum.dark[0]), offDark: r(sum.dark[3] / sum.dark[0]),
      light: r(sum.light[1] / sum.light[0]), plateLight: r(sum.light[2] / sum.light[0]), offLight: r(sum.light[3] / sum.light[0]),
    };
  }
  return out;
}

// Where an image is most off its reference: the frame cut into cells `cell` px square, each cell's
// mean signed difference in blurred linear light (ours less the reference: + too light, - too
// dark), worst first.
export async function cells(reference: string, src: string, { cell = 96, worst = 12, ...frame }: Frame & { cell?: number; worst?: number } = {}): Promise<{ at: [number, number]; off: number }[]> {
  const width = frame.width ?? 1280;
  const height = frame.height ?? width;
  const [plate, ours] = [await luminance(reference, frame), await luminance(src, frame)];
  const out: { at: [number, number]; off: number }[] = [];
  for (let y0 = 0; y0 < height; y0 += cell)
    for (let x0 = 0; x0 < width; x0 += cell) {
      let [sum, n] = [0, 0];
      for (let y = y0; y < Math.min(height, y0 + cell); y++)
        for (let x = x0; x < Math.min(width, x0 + cell); x++) (sum += ours[y * width + x] - plate[y * width + x]), n++;
      out.push({ at: [x0 + Math.min(cell, width - x0) / 2, y0 + Math.min(cell, height - y0) / 2], off: Math.round((sum / n) * 1e3) / 1e3 });
    }
  return out.sort((a, b) => Math.abs(b.off) - Math.abs(a.off)).slice(0, worst);
}
