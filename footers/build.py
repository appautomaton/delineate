"""Assemble the footer: a component that draws the foot of a site as a small world, and the worlds it can show.

  build.py <out.html>                     the Automaton demo page, the footer under a product's home page
  build.py --kit <site> <out.html>        the footer alone, to embed at the end of <site>'s own page

The component is footer.css, footer.html, footer.js and early.js; page.html is the demo page around it, and
sites/<site>.html fills the footer's slots (brand, sitemap, sign-off) for each site that uses it.

Each world lives in worlds/<id>/ as art.html (markup), style.css, life.js and gen.py, whose
placeholders() fills the {{NAME}} holes in the other three. A world's CSS is scoped to its
own root (.world--<id>) unless a selector starts with :root or .journey, or is marked
":global" because it styles a part drawn through <use>, whose shadow tree no ancestor selector reaches.
"""
import importlib.util
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

NAMES = {
    "desert": "Desert", "lijiang": "Li River", "deep": "The Deep", "alfama": "Alfama",
    "glasshouse": "Glasshouse", "observatory": "Observatory", "crayon": "Crayon",
}
# Each site: its worlds in picker order (the first opens), where it keeps a visitor's choices, and the
# light it opens in when there is none yet (None: the system's). Each world draws its own 16 x 16 glyph.
SITES = {
    "automaton": {"worlds": ["desert", "lijiang", "deep", "alfama", "glasshouse", "observatory", "crayon"],
                  "store": "automaton", "theme": None},
    "delineate": {"worlds": ["desert", "lijiang", "deep", "alfama", "glasshouse", "observatory", "crayon"],
                  "store": "delineate", "theme": "day"},
}


def fill(text, values, where):
    for key, value in values.items():
        text = text.replace("{{" + key + "}}", value)
    assert "{{" not in text, (where, text[text.index("{{"):text.index("{{") + 40])
    return text


def scope_css(css, scope):
    """Prefix every selector with the world's root, after any leading theme or state qualifier."""
    out, i, stack = [], 0, []
    lead = re.compile(r'^((?:\.is-ready|\[data-theme="[a-z]+"\])*)\s*(.*)$', re.S)

    def scoped(selector):
        s = selector.strip()
        if s.startswith(":global "):
            return s[len(":global "):]
        if s.startswith((":root", ".journey", "html", "body")):
            return s
        if s.startswith("&"):
            return scope + s[1:]
        qualifier, rest = lead.match(s).groups()
        return f"{qualifier} {scope} {rest}".strip()

    while i < len(css):
        j, k = css.find("{", i), css.find("}", i)
        if k != -1 and (j == -1 or k < j):
            out.append(css[i:k + 1])
            stack.pop()
            i = k + 1
            continue
        if j == -1:
            out.append(css[i:])
            break
        prelude = css[i:j]
        cut = prelude.rfind("*/") + 2 if "*/" in prelude else 0
        head, selector = prelude[:cut], prelude[cut:]
        indent = selector[:len(selector) - len(selector.lstrip())]
        text = selector.strip()
        if stack and stack[-1] == "keyframes":
            kind = "frame"
        elif text.startswith("@keyframes"):
            kind = "keyframes"
        elif text.startswith("@"):
            kind = "group"
        else:
            kind = "rule"
            text = ",\n  ".join(scoped(s) for s in text.split(","))
        out.append(head + indent + text + " {")
        stack.append(kind)
        i = j + 1
    return "".join(out)


TAG = re.compile(r"<(/?)([a-zA-Z][\w:-]*)([^>]*?)(/?)>", re.S)


def element_end(markup, start):
    """The index just past the element whose start tag begins at `start`."""
    depth = 0
    for m in TAG.finditer(markup, start):
        closing, _, _, selfclose = m.groups()
        if closing:
            depth -= 1
        elif not selfclose:
            depth += 1
        if depth == 0:
            return m.end()
    raise ValueError(f"unclosed element at {start}")


def animated_classes(css):
    """Every class named in a rule that sets an animation."""
    found = set()
    for selector, body in re.findall(r"([^{};]+)\{([^{}]*)\}", css):
        if re.search(r"(^|;|\s)animation(-name)?\s*:", body) and not re.match(r"\s*(from|to|[\d.]+%)", selector):
            found.update(re.findall(r"\.([a-zA-Z][\w-]*)", selector))
    return found


def unfold_life(art, css):
    """Replace every <use> whose drawing moves with a copy of the drawing itself.

    A <use> clone is a closed shadow tree: its animations run on their own clock and no script can reach
    them. Unfolded, they become ordinary animations that the page's single life clock can step.
    Uses of still drawings are kept, so shared shapes stay shared, and so are uses of anything marked
    data-still: a shadow need not twitch its ear, and its clone, never stepped by the clock, holds its pose."""
    moving = animated_classes(css)
    ids = {}
    for m in re.finditer(r'<([a-zA-Z][\w:-]*)\b[^>]*?\sid="([^"]+)"', art):
        ids[m.group(2)] = art[m.start():element_end(art, m.start())]
    needs, unfolded = {}, {}

    def needs_unfold(ref, seen=()):
        if ref not in needs:
            body = ids.get(ref, "")
            if re.match(r"<[^>]*\sdata-still\b", body):
                needs[ref] = False
                return False
            classes = {c for attr in re.findall(r'class="([^"]+)"', body) for c in attr.split()}
            needs[ref] = bool(classes & moving) or any(
                r not in seen and needs_unfold(r, seen + (ref,)) for r in re.findall(r'<use\b[^>]*href="#([^"]+)"', body))
        return needs[ref]

    def unfold(markup):
        def swap(m):
            attrs = m.group(1)
            ref = re.search(r'href="#([^"]+)"', attrs).group(1)
            if ref not in ids or not needs_unfold(ref):
                return m.group(0)
            if ref not in unfolded:
                unfolded[ref] = unfold(re.sub(r'\sid="[^"]*"', "", ids[ref], count=1))
            rest = re.sub(r'\s*href="#[^"]*"', "", attrs)
            x = re.search(r'\sx="([^"]*)"', rest)
            y = re.search(r'\sy="([^"]*)"', rest)
            rest = re.sub(r'\s[xy]="[^"]*"', "", rest)
            if x or y:
                shift = f"translate({x.group(1) if x else 0} {y.group(1) if y else 0})"
                t = re.search(r'\stransform="([^"]*)"', rest)
                rest = re.sub(r'\stransform="[^"]*"', "", rest) + f' transform="{(t.group(1) + " ") if t else ""}{shift}"'
            return f"<g{rest}>{unfolded[ref]}</g>"
        return re.sub(r"<use\b([^>]*?)/>", swap, markup)

    # Leave the insides of still drawings alone: they are only ever seen through a <use>.
    out, last = [], 0
    for m in re.finditer(r"<[a-zA-Z][\w:-]*\b[^>]*\sdata-still\b[^>]*>", art):
        if m.start() < last:
            continue
        end = element_end(art, m.start())
        out += [unfold(art[last:m.start()]), art[m.start():end]]
        last = end
    out.append(unfold(art[last:]))
    return "".join(out)


def prune_defs(art, css):
    """Drop definitions nothing refers to any more: the originals that every <use> of was unfolded.
    Only whole children of a <defs> go, never a part of something still in use."""
    def children(start):
        i = art.index(">", start) + 1
        while True:
            i = art.index("<", i)
            if art.startswith("<!--", i):
                i = art.index("-->", i) + 3
                continue
            if art.startswith("</", i):
                return
            end = element_end(art, i)
            yield i, end
            i = end

    while True:
        refs = set(re.findall(r'href="#([^"]+)"', art)) | set(re.findall(r"url\(#([^)]+)\)", art + css))
        dead = None
        for m in re.finditer(r"<defs\b", art):
            for start, end in children(m.start()):
                own = re.match(r'<[^>]*?\sid="([^"]+)"', art[start:end])
                if own and not set(re.findall(r'\sid="([^"]+)"', art[start:end])) & refs:
                    dead = (start, end)
                    break
            if dead:
                break
        if not dead:
            return art
        art = art[:dead[0]] + art[dead[1]:]


def load_gen(world):
    path = HERE / "worlds" / world / "gen.py"
    spec = importlib.util.spec_from_file_location(f"gen_{world}", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def worlds(ids):
    css_parts, templates, scripts, glyphs = [], [], [], []
    for world in ids:
        folder = HERE / "worlds" / world
        gen = load_gen(world)
        values = gen.placeholders()
        css = fill((folder / "style.css").read_text(), values, f"{world}/style.css")
        css_parts.append(scope_css(css, f".world--{world}"))
        art = prune_defs(unfold_life(fill((folder / "art.html").read_text(), values, f"{world}/art.html"), css), css)
        templates.append(f'<template id="world-{world}" data-world="{world}" data-name="{NAMES[world]}">\n{art}</template>')
        scripts.append(fill((folder / "life.js").read_text(), values, f"{world}/life.js"))
        glyphs.append(f'    <g id="glyph-{world}">{gen.GLYPH}</g>')
    return "\n\n".join(css_parts), "\n\n".join(templates), "\n".join(scripts), "\n".join(glyphs)


def picker(ids):
    buttons = "\n".join(
        f'      <button type="button" role="radio" aria-checked="false" tabindex="-1" aria-label="{NAMES[w]}" data-world="{w}">'
        f'<svg viewBox="0 0 16 16" aria-hidden="true"><use href="#glyph-{w}"/></svg></button>'
        for w in ids
    )
    return f"""<div class="scene-picker" role="radiogroup" aria-label="Scene">
    <span class="picker-track">
      <span class="picker-knob" aria-hidden="true"></span>
{buttons}
    </span>
    <span class="picker-name" aria-hidden="true">{NAMES[ids[0]]}</span>
  </div>"""


def slots(site):
    """A site's footer content, from sites/<site>.html: each slot opens with <!-- slot: NAME -->."""
    text = (HERE / "sites" / f"{site}.html").read_text()
    parts = re.split(r"<!-- slot: (\w+) -->\n", text)[1:]
    return {name: body.rstrip("\n") for name, body in zip(parts[::2], parts[1::2])}


def component(site):
    spec = SITES[site]
    ids = spec["worlds"]
    css, templates, scripts, glyphs = worlds(ids)
    common = {"STORE": spec["store"], "WORLD_IDS": json.dumps(ids), "DEFAULT_THEME": json.dumps(spec["theme"])}
    return {
        "DEFAULT_WORLD": ids[0],
        "PICKER": picker(ids),
        "EARLY": fill((HERE / "early.js").read_text(), common, "early.js"),
        "FOOTER_CSS": (HERE / "footer.css").read_text(),
        "WORLD_CSS": css,
        "FOOTER": fill((HERE / "footer.html").read_text(), {**slots(site), "GLYPHS": glyphs, "PICKER": picker(ids)}, "footer.html"),
        "WORLD_TEMPLATES": templates,
        "FOOTER_JS": fill((HERE / "footer.js").read_text(), {**common, "WORLD_JS": scripts}, "footer.js"),
    }


def kit(parts):
    """The footer alone, to place at the end of a host page's body. The host sets its type on .site-footer."""
    return (f"<style>\n{parts['FOOTER_CSS']}\n{parts['WORLD_CSS']}\n</style>\n<script>\n{parts['EARLY']}</script>\n"
            f"{parts['FOOTER']}\n{parts['WORLD_TEMPLATES']}\n<script>\n{parts['FOOTER_JS']}</script>\n")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[0] == "--kit":
        site, out = args[1], Path(args[2])
        html = kit(component(site))
    else:
        out = Path(args[0])
        html = fill((HERE / "page.html").read_text(), component("automaton"), "page.html")
    out.write_text(html)
    print(f"wrote {out} ({len(html) // 1024} KB)")
