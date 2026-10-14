// A world's markup, made cheap to animate (see "Motion and its cost" in notes.md).
//
// A <use> clone is a closed shadow tree: its animations run on their own clock and no script can reach them. So
// every <use> whose drawing moves is replaced by a copy of the drawing itself, whose animations the page's single
// film clock can step; and the definitions nothing refers to any more are dropped.

const TAG = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;

// The index just past the element whose start tag begins at `start`.
function elementEnd(markup: string, start: number): number {
  let depth = 0;
  TAG.lastIndex = start;
  for (let m = TAG.exec(markup); m; m = TAG.exec(markup)) {
    const [, closing, , , selfClosing] = m;
    if (closing) depth--;
    else if (!selfClosing) depth++;
    if (depth === 0) return TAG.lastIndex;
  }
  throw new Error(`unclosed element at ${start}`);
}

const element = (markup: string, start: number) => markup.slice(start, elementEnd(markup, start));

// Every class named in a rule that sets an animation.
function animatedClasses(css: string): Set<string> {
  const found = new Set<string>();
  for (const [, selector, body] of css.matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
    if (/(^|;|\s)animation(-name)?\s*:/.test(body) && !/^\s*(from|to|[\d.]+%)/.test(selector)) {
      for (const [, name] of selector.matchAll(/\.([a-zA-Z][\w-]*)/g)) found.add(name);
    }
  }
  return found;
}

// Replaces every <use> whose drawing moves with a copy of the drawing itself. Uses of still drawings are kept, so
// shared shapes stay shared, and so are uses of anything marked data-still: a shadow need not twitch its ear, and
// its clone, never stepped by the clock, holds its pose.
export function unfoldLife(art: string, css: string): string {
  const moving = animatedClasses(css);
  const ids = new Map<string, string>();
  for (const m of art.matchAll(/<([a-zA-Z][\w:-]*)\b[^>]*?\sid="([^"]+)"/g)) ids.set(m[2], element(art, m.index));

  // Whether a definition moves, or uses one that does.
  const needs = new Map<string, boolean>();
  const needsUnfold = (ref: string, seen: readonly string[] = []): boolean => {
    if (!needs.has(ref)) {
      const body = ids.get(ref) ?? "";
      if (/^<[^>]*\sdata-still\b/.test(body)) {
        needs.set(ref, false);
        return false;
      }
      const classes = [...body.matchAll(/class="([^"]+)"/g)].flatMap(([, attr]) => attr.split(/\s+/).filter(Boolean));
      const uses = [...body.matchAll(/<use\b[^>]*href="#([^"]+)"/g)].map(([, r]) => r);
      needs.set(ref, classes.some((c) => moving.has(c)) || uses.some((r) => !seen.includes(r) && needsUnfold(r, [...seen, ref])));
    }
    return needs.get(ref)!;
  };

  const unfolded = new Map<string, string>();
  const unfold = (markup: string): string =>
    markup.replace(/<use\b([^>]*?)\/>/g, (use, attrs: string) => {
      const ref = /href="#([^"]+)"/.exec(attrs)![1];
      if (!ids.has(ref) || !needsUnfold(ref)) return use;
      if (!unfolded.has(ref)) unfolded.set(ref, unfold(ids.get(ref)!.replace(/\sid="[^"]*"/, "")));
      // The use's own attributes go on a group, its x and y becoming a translation.
      let rest = attrs.replace(/\s*href="#[^"]*"/g, "");
      const x = /\sx="([^"]*)"/.exec(rest);
      const y = /\sy="([^"]*)"/.exec(rest);
      rest = rest.replace(/\s[xy]="[^"]*"/g, "");
      if (x || y) {
        const shift = `translate(${x ? x[1] : 0} ${y ? y[1] : 0})`;
        const t = /\stransform="([^"]*)"/.exec(rest);
        rest = rest.replace(/\stransform="[^"]*"/g, "") + ` transform="${t ? t[1] + " " : ""}${shift}"`;
      }
      return `<g${rest}>${unfolded.get(ref)}</g>`;
    });

  // Leave the insides of still drawings alone: they are only ever seen through a <use>.
  const out: string[] = [];
  let last = 0;
  for (const m of art.matchAll(/<[a-zA-Z][\w:-]*\b[^>]*\sdata-still\b[^>]*>/g)) {
    if (m.index < last) continue;
    const end = elementEnd(art, m.index);
    out.push(unfold(art.slice(last, m.index)), art.slice(m.index, end));
    last = end;
  }
  out.push(unfold(art.slice(last)));
  return out.join("");
}

// The whole children of the <defs> whose start tag begins at `start`, as [start, end] pairs.
function* children(art: string, start: number): Generator<[number, number]> {
  let i = art.indexOf(">", start) + 1;
  for (;;) {
    i = art.indexOf("<", i);
    if (art.startsWith("<!--", i)) {
      i = art.indexOf("-->", i) + 3;
      continue;
    }
    if (art.startsWith("</", i)) return;
    const end = elementEnd(art, i);
    yield [i, end];
    i = end;
  }
}

// Drops definitions nothing refers to any more: the originals that every <use> of was unfolded. Only whole
// children of a <defs> go, never a part of something still in use.
export function pruneDefs(art: string, css: string): string {
  for (;;) {
    const refs = new Set([...art.matchAll(/href="#([^"]+)"/g), ...(art + css).matchAll(/url\(#([^)]+)\)/g)].map(([, r]) => r));
    let dead: [number, number] | undefined;
    search: for (const m of art.matchAll(/<defs\b/g)) {
      for (const [start, end] of children(art, m.index)) {
        const child = art.slice(start, end);
        const own = /^<[^>]*?\sid="([^"]+)"/.test(child);
        if (own && ![...child.matchAll(/\sid="([^"]+)"/g)].some(([, id]) => refs.has(id))) {
          dead = [start, end];
          break search;
        }
      }
    }
    if (!dead) return art;
    art = art.slice(0, dead[0]) + art.slice(dead[1]);
  }
}
