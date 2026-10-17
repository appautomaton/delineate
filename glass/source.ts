// What lies under the glass: the pages (pages.ts), each drawn here as a mask, white where the ink lies, at one
// pixel to a CSS pixel. field.ts measures it into the distance field the shader draws the page from, and the
// shader lays the paper and ink on it. Words are set in the site's serif, as large as fit across the stage in
// one line; a drawing stands in the middle, as tall as most of the stage.

/** A page as named: a line of words, or a Garden drawing by its name. */
export type Page = { kind: "words"; text: string } | { kind: "picture"; name: string };
/** A page ready to draw, its drawing loaded. */
export type Source = { kind: "words"; text: string } | { kind: "picture"; name: string; image: HTMLImageElement };

export const FONT = '"Hedvig Letters Serif", Georgia, serif';


/** The coverage of the ink, 0 to 255, on a `w` by `h` grid of CSS pixels. */
export function draw(w: number, h: number, source: Source): Uint8Array {
  const canvas = new OffscreenCanvas(w, h), c = canvas.getContext("2d", { willReadFrequently: true })!;
  c.fillStyle = "#000";
  c.fillRect(0, 0, w, h);
  if (source.kind === "words") {
    // the size at which the line spans 86% of the stage, no taller than half of it
    c.font = `400 100px ${FONT}`;
    const size = Math.min((100 * w * 0.86) / c.measureText(source.text).width, h * 0.5);
    c.font = `400 ${size}px ${FONT}`;
    c.fillStyle = "#fff";
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    const m = c.measureText(source.text);
    // set on its optical middle: halfway between the tops of the capitals and the baseline
    c.fillText(source.text, w / 2, h / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  } else {
    const { image } = source, scale = Math.min((h * 0.86) / image.naturalHeight, (w * 0.9) / image.naturalWidth);
    const iw = Math.round(image.naturalWidth * scale), ih = Math.round(image.naturalHeight * scale);
    // the drawing's shape alone, in white: its own colours are not the page's
    const shape = new OffscreenCanvas(iw, ih), s = shape.getContext("2d")!;
    s.drawImage(image, 0, 0, iw, ih);
    s.globalCompositeOperation = "source-in";
    s.fillStyle = "#fff";
    s.fillRect(0, 0, iw, ih);
    c.drawImage(shape, Math.round((w - iw) / 2), Math.round((h - ih) / 2));
  }
  const rgba = c.getImageData(0, 0, w, h).data, cover = new Uint8Array(w * h);
  for (let i = 0; i < cover.length; i++) cover[i] = rgba[i * 4];
  return cover;
}

// each drawing is fetched once, however often its page comes round
const loaded = new Map<string, Promise<Source>>();

/** The page ready to draw: its words' font loaded, or its drawing. A drawing that cannot be had rejects. */
export async function source(page: Page): Promise<Source> {
  if (page.kind === "words") {
    await document.fonts.load(`400 80px ${FONT}`, page.text).catch(() => {});
    return page;
  }
  let p = loaded.get(page.name);
  if (!p) {
    const image = new Image();
    image.src = `glass/pictures/${page.name}.svg`;
    p = image.decode().then(() => ({ kind: "picture", name: page.name, image }));
    loaded.set(page.name, p);
  }
  return p;
}
