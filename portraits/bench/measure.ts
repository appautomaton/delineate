// Tone against the plate, as the eye sees it from afar: each image blurred past its lines, compared
// in linear light, where the plate is dark (its jacket, his hair's masses) and where it is light
// (skin, shirt); within `region` ([x0, y0, x1, y1] in picture pixels) if given.

const lin = (v: number) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

async function luminance(src: string, size: number, blur: number, paper: string): Promise<Float32Array> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = new OffscreenCanvas(size, size);
  const g = canvas.getContext("2d")!;
  g.fillStyle = paper;
  g.fillRect(0, 0, size, size);
  g.filter = `blur(${blur}px)`;
  g.drawImage(img, 0, 0, size, size);
  const d = g.getImageData(0, 0, size, size).data;
  return Float32Array.from({ length: size * size }, (_, p) => 0.2126 * lin(d[p * 4]) + 0.7152 * lin(d[p * 4 + 1]) + 0.0722 * lin(d[p * 4 + 2]));
}

export type Tone = { dark: number; plateDark: number; offDark: number; light: number; plateLight: number; offLight: number };

// `reference` and each of `srcs` are URLs of images in the same frame.
export async function measure(reference: string, srcs: string[], { size = 1280, blur = 6, paper = "#f3e8cc", region = [0, 0, Infinity, Infinity] } = {}): Promise<Record<string, Tone>> {
  const plate = await luminance(reference, size, blur, paper);
  const out: Record<string, Tone> = {};
  for (const src of srcs) {
    const ours = await luminance(src, size, blur, paper);
    const sum = { dark: [0, 0, 0, 0], light: [0, 0, 0, 0] };
    const [x0, y0, x1, y1] = region;
    plate.forEach((a, p) => {
      const [x, y] = [p % size, Math.floor(p / size)];
      if (a > 0.75 || x < x0 || x >= x1 || y < y0 || y >= y1) return; // paper round him, or outside
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
export async function cells(reference: string, src: string, { size = 1280, blur = 6, paper = "#f3e8cc", cell = 96, worst = 12 } = {}): Promise<{ at: [number, number]; off: number }[]> {
  const [plate, ours] = [await luminance(reference, size, blur, paper), await luminance(src, size, blur, paper)];
  const out: { at: [number, number]; off: number }[] = [];
  for (let y0 = 0; y0 < size; y0 += cell)
    for (let x0 = 0; x0 < size; x0 += cell) {
      let [sum, n] = [0, 0];
      for (let y = y0; y < Math.min(size, y0 + cell); y++)
        for (let x = x0; x < Math.min(size, x0 + cell); x++) (sum += ours[y * size + x] - plate[y * size + x]), n++;
      out.push({ at: [x0 + cell / 2, y0 + cell / 2], off: Math.round((sum / n) * 1e3) / 1e3 });
    }
  return out.sort((a, b) => Math.abs(b.off) - Math.abs(a.off)).slice(0, worst);
}
