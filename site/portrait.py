"""Split a layered portrait into one standalone SVG per plane, for the page to stack and part in depth.

Each plane keeps the portrait's frame, so the planes stack in register, and only the definitions it refers to
(gradients and the like, followed through their own references), so nine planes do not each carry the whole
portrait's defs. Motion inside a plane is switched off: on the page the planes move, not their parts.
"""
import re

TAG = re.compile(r"<(/?)([a-zA-Z][\w:-]*)([^>]*?)(/?)>", re.S)
REF = re.compile(r'(?:url\(#|href="#)([^)"]+)')
STILL = "<style>*{animation:none!important}</style>"


def top_defs(between):
    """The top-level children of the portrait's <defs>, by id."""
    defs = {}
    if "<defs" not in between:
        return defs
    inner = between[between.index(">", between.index("<defs")) + 1:between.rindex("</defs>")]
    depth, start, ident = 0, None, None
    for m in TAG.finditer(inner):
        close, tag, attrs, selfclose = m.groups()
        if not close and depth == 0:
            start = m.start()
            ident = re.search(r'\sid="([^"]+)"', attrs)
            ident = ident.group(1) if ident else None
            if selfclose:
                if ident:
                    defs[ident] = inner[start:m.end()]
                continue
        if close:
            depth -= 1
            if depth == 0 and ident:
                defs[ident] = inner[start:m.end()]
        elif not selfclose:
            depth += 1
    return defs


def planes(src):
    """The portrait's layers, back to front, each as (name, title, standalone SVG)."""
    root = re.match(r"<svg[^>]*>", src).group(0)
    style = src[src.index("<style"):src.index("</style>") + len("</style>")]
    first = src.index('<g id="layer-')
    defs = top_defs(src[src.index("</style>") + len("</style>"):first])

    def needed(text):
        seen, todo = set(), list(REF.findall(text))
        while todo:
            ident = todo.pop()
            if ident in seen or ident not in defs:
                continue
            seen.add(ident)
            todo += REF.findall(defs[ident])
        return seen

    starts = [m.start() for m in re.finditer(r'<g id="layer-', src)]
    end = src.rindex("</svg>")
    out = []
    for k, at in enumerate(starts):
        group = src[at:starts[k + 1] if k + 1 < len(starts) else end]
        name = re.match(r'<g id="layer-([^"]+)"', group).group(1)
        title = re.search(r'data-title="([^"]*)"', group).group(1)
        own = "".join(defs[i] for i in sorted(needed(group)))
        out.append((name, title, f"{root}{style}{STILL}<defs>{own}</defs>{group}</svg>"))
    return out
