"""Build delineate's own page into site/dist, ready to serve as it stands.

  python3 -I site/build.py        (npm run site, which draws the garden first)

page.html is the page, with {{NAME}} holes for what is drawn: the opening bouquet (hero.py), the icons and the
tab's mark (icons.py), the foot of the page, drawn by the Footers' crayon world, and the Footers piece itself,
the real component built as a kit for this site. Beside it go what it borrows: Garden's stylesheets and the
plants its bed grows, and Paprika Girl split into planes (portrait.py).
"""
import importlib.util
import json
import re
import shutil
import sys
from pathlib import Path

SITE = Path(__file__).parent
ROOT = SITE.parent
FOOTERS = ROOT / "footers"
GARDEN = ROOT / "garden"
DIST = SITE / "dist"
sys.path[:0] = [str(SITE), str(FOOTERS)]

import hero  # noqa: E402
import icons  # noqa: E402
import portrait  # noqa: E402
from crayon import TOOTH  # noqa: E402

spec = importlib.util.spec_from_file_location("footers_build", FOOTERS / "build.py")
footers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(footers)


def made(path, by):
    """A file another build writes; if it has not been written, say which command writes it."""
    if not path.exists():
        sys.exit(f"{path.relative_to(ROOT)} is missing: run {by} first")
    return path


def drawing_time(*parts):
    """Seconds until a crayon drawing is done: when its last strand ends."""
    return max(float(d) + float(t) for p in parts for d, t in re.findall(r"--d:([\d.]+)s;--t:([\d.]+)s", p))


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


template = (SITE / "page.html").read_text()
shutil.rmtree(DIST, ignore_errors=True)

# The foot of the page is drawn by the crayon world's generator, under ids of its own: the Footers section may
# be showing the same world, and ids are shared by the whole page.
foot = {k: v.replace('id="cr-', 'id="lf-').replace("url(#cr-", "url(#lf-")
        for k, v in footers.load_gen("crayon").placeholders().items()}
bouquet = hero.markup()
values = {
    "HERO": bouquet,
    "HERO_TIME": f"{drawing_time(bouquet):.2f}",
    "FOOTER_KIT": footers.kit(footers.component("delineate")),
    "FOOT_TIME": f"{drawing_time(*foot.values()):.2f}",
    "TOOTH": TOOTH,
    **{f"FOOT_{k}": v for k, v in foot.items()},
    **{f"ICON_{k.upper()}": v for k, v in icons.icons().items()},
}
page = template
for key, value in values.items():
    page = page.replace("{{" + key + "}}", value)
assert "{{" not in page, page[page.index("{{"):page.index("{{") + 40]
write(DIST / "index.html", page)
write(DIST / "favicon.svg", icons.favicon())

# From Garden: its tokens, their dark light keyed to this page's night so the plants change with the page; its
# paint and anchors; and the plants the bed grows, as the page's PLANTS names them.
write(DIST / "assets/garden/tokens.css",
      (GARDEN / "src/tokens.css").read_text().replace(':root[data-theme="dark"]', ':root[data-theme="night"]'))
write(DIST / "assets/garden/paint.css", (GARDEN / "src/garden/paint.css").read_text())
write(DIST / "assets/garden/anchors.css", made(GARDEN / "src/garden/anchors.css", "npm run draw").read_text())
for name in re.findall(r'\{ name: "([\w-]+)"', template):
    shutil.copy(made(GARDEN / f"public/garden/{name}.svg", "npm run draw"), DIST / "assets/garden")

# From Portraits: Paprika Girl, one plane per layer, for the page to stack and part.
source = made(ROOT / "portraits/pieces/paprika-girl/paprika-girl.svg", "npm run paprika-girl")
layers = []
for name, title, svg in portrait.planes(source.read_text()):
    write(DIST / f"assets/portrait/{name}.svg", svg)
    layers.append({"name": name, "title": title})
write(DIST / "assets/portrait/layers.json", json.dumps(layers, indent=1))

print(f"wrote {DIST.relative_to(ROOT)}: index.html {len(page) // 1024} KB, the bouquet draws in {values['HERO_TIME']}s, "
      f"{len(layers)} portrait planes")
