// Splits a layered portrait into one standalone SVG per plane, for the page to stack and part in depth.
//
// Each plane keeps the portrait's frame, so the planes stack in register, and only the definitions it refers to
// (gradients and the like, followed through their own references), so nine planes do not each carry the whole
// portrait's defs. Motion inside a plane is switched off: on the page the planes move, not their parts.

const TAG = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;
const REF = /(?:url\(#|href="#)([^)"]+)/g;
const STILL = "<style>*{animation:none!important}</style>";

const refs = (text: string) => [...text.matchAll(REF)].map(([, id]) => id);

// The top-level children of the portrait's <defs>, by id.
function topDefs(between: string): Map<string, string> {
  const defs = new Map<string, string>();
  if (!between.includes("<defs")) return defs;
  const inner = between.slice(between.indexOf(">", between.indexOf("<defs")) + 1, between.lastIndexOf("</defs>"));
  let depth = 0;
  let start = 0;
  let id: string | undefined;
  for (const m of inner.matchAll(TAG)) {
    const [whole, close, , attrs, selfClosing] = m;
    const end = m.index + whole.length;
    if (!close && depth === 0) {
      start = m.index;
      id = /\sid="([^"]+)"/.exec(attrs)?.[1];
      if (selfClosing) {
        if (id) defs.set(id, inner.slice(start, end));
        continue;
      }
    }
    if (close) {
      depth--;
      if (depth === 0 && id) defs.set(id, inner.slice(start, end));
    } else if (!selfClosing) depth++;
  }
  return defs;
}

export type Plane = { name: string; title: string; svg: string };

// The portrait's layers, back to front, each as a standalone SVG.
export function planes(src: string): Plane[] {
  const root = /^<svg[^>]*>/.exec(src)![0];
  const styleEnd = src.indexOf("</style>") + "</style>".length;
  const style = src.slice(src.indexOf("<style"), styleEnd);
  const first = src.indexOf('<g id="layer-');
  const defs = topDefs(src.slice(styleEnd, first));

  // The definitions a layer refers to, and those they refer to in turn.
  const needed = (text: string): Set<string> => {
    const seen = new Set<string>();
    const todo = refs(text);
    while (todo.length) {
      const id = todo.pop()!;
      if (seen.has(id) || !defs.has(id)) continue;
      seen.add(id);
      todo.push(...refs(defs.get(id)!));
    }
    return seen;
  };

  const starts = [...src.matchAll(/<g id="layer-/g)].map((m) => m.index);
  const end = src.lastIndexOf("</svg>");
  return starts.map((at, k) => {
    const group = src.slice(at, k + 1 < starts.length ? starts[k + 1] : end);
    const name = /^<g id="layer-([^"]+)"/.exec(group)![1];
    const title = /data-title="([^"]*)"/.exec(group)![1];
    const own = [...needed(group)].sort().map((id) => defs.get(id)).join("");
    return { name, title, svg: `${root}${style}${STILL}<defs>${own}</defs>${group}</svg>` };
  });
}
