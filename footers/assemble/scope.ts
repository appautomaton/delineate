// A world's stylesheet, scoped to the world.
//
// Every selector is prefixed with the world's root, after any leading state or theme qualifier
// (".is-ready", [data-theme="..."]). Selectors starting :root, .journey, html or body style the page and are left
// alone; "&" is the world's root itself; and ":global" opts a selector out, for parts drawn through <use>, whose
// shadow tree no ancestor selector reaches. The rules inside @keyframes are frames, not selectors.

const LEAD = /^((?:\.is-ready|\[data-theme="[a-z]+"\])*)\s*(.*)$/s;
const PAGE = [":root", ".journey", "html", "body"];

function scoped(selector: string, scope: string): string {
  const s = selector.trim();
  if (s.startsWith(":global ")) return s.slice(":global ".length);
  if (PAGE.some((p) => s.startsWith(p))) return s;
  if (s.startsWith("&")) return scope + s.slice(1);
  const [, qualifier, rest] = LEAD.exec(s)!;
  return `${qualifier} ${scope} ${rest}`.trim();
}

export function scopeCss(css: string, scope: string): string {
  const out: string[] = [];
  // What each open block is: a group (@media and the like), keyframes, a frame, or a rule.
  const stack: string[] = [];
  let i = 0;
  while (i < css.length) {
    const [open, close] = [css.indexOf("{", i), css.indexOf("}", i)];
    if (close !== -1 && (open === -1 || close < open)) {
      out.push(css.slice(i, close + 1));
      stack.pop();
      i = close + 1;
      continue;
    }
    if (open === -1) {
      out.push(css.slice(i));
      break;
    }
    // The prelude: any comment before it is kept as it is.
    const prelude = css.slice(i, open);
    const cut = prelude.includes("*/") ? prelude.lastIndexOf("*/") + 2 : 0;
    const [head, selector] = [prelude.slice(0, cut), prelude.slice(cut)];
    const indent = selector.slice(0, selector.length - selector.trimStart().length);
    let text = selector.trim();
    let kind: string;
    if (stack.at(-1) === "keyframes") kind = "frame";
    else if (text.startsWith("@keyframes")) kind = "keyframes";
    else if (text.startsWith("@")) kind = "group";
    else {
      kind = "rule";
      text = text.split(",").map((s) => scoped(s, scope)).join(",\n  ");
    }
    out.push(head + indent + text + " {");
    stack.push(kind);
    i = open + 1;
  }
  return out.join("");
}
