// SVG as CSS images: a drawing written into a data URI, and a filter laid over a tile.

// Kept as they are: letters, digits, "_.-~", and the quote, slash, colon, equals sign and space that the
// drawings use and a data URI allows.
const KEEP = /[^A-Za-z0-9_.~'/:= -]/gu;
const bytes = new TextEncoder();

export function dataUri(svg: string): string {
  const escaped = svg.replace(KEEP, (ch) => [...bytes.encode(ch)].map((b) => `%${b.toString(16).toUpperCase().padStart(2, "0")}`).join(""));
  return `data:image/svg+xml,${escaped}`;
}

// A w x h tile whose pixels are drawn by the filter primitives `inner`.
export function tile(inner: string, w: number, h: number): string {
  return dataUri(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
      `<filter id='f' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>${inner}</filter>` +
      `<rect width='100%' height='100%' filter='url(#f)'/></svg>`,
  );
}
