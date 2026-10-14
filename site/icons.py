"""The page's icons, in the same crayon as its drawings, each drawn on a 160 x 160 sheet so the wax keeps its
grain when shown at icon size. Work is the page's own flower; GitHub is its mark, coloured in; the page's light
is a sun for day and a crescent for night. Each draws itself on, and again on hover.
"""
import math
import random

from crayon import Hand, Sheet, circle, closed_d, petal, poppy

# GitHub's mark (Octicons, mark-github), on its 16 x 16 grid, scaled to the sheet.
GITHUB = ("M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49"
          "-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52"
          ".28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18"
          " 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07"
          "-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42"
          "-3.58-8-8-8z")


def work():
    """A flower, the page's own motif: five petals coloured in and finely outlined round a wound centre."""
    s, h = Sheet("ic-work-"), Hand(3, 0)
    body = poppy(s, h, 80, 80, 74, "red", "maroon", "maroon", n=5)
    return s, body


def github():
    s, h = Sheet("ic-gh-"), Hand(5, 0)
    box = [(4, 4), (156, 4), (156, 156), (4, 156)]
    h.fill(box, "deep", angle=-35, spacing=5, width=8, n=6, secs=.45, weight=(2.2, 3.6), alpha=(.75, 1))
    fill = h.take()
    clip_id = f"{s.prefix}0"
    s.clips.append(f'<clipPath id="{clip_id}"><path transform="translate(4 4) scale(9.5)" d="{GITHUB}"/></clipPath>')
    h.loops(80, 80, 73, "deep", turns=1.05, width=5, n=3, secs=.3, alpha=(.55, .85), wobble=.015)
    return s, f'<g clip-path="url(#{clip_id})">{fill}</g>{h.take()}'


def sun():
    s, h = Sheet("ic-sun-"), Hand(7, 0)
    h.spiral(80, 80, 30, "ochre", turns=6, width=10, n=6, secs=.3, weight=(1.8, 3))
    out = [h.take()]
    for k in range(8):
        a = k * math.pi / 4 + .2
        h.clock = .2 + k * .04
        h.stroke([(80 + 46 * math.cos(a), 80 + 46 * math.sin(a)), (80 + 66 * math.cos(a), 80 + 66 * math.sin(a))],
                 "ochre", width=5, n=3, secs=.08, weight=(1.8, 2.8))
    out.append(h.take())
    return s, "".join(out)


def moon():
    s, h = Sheet("ic-moon-"), Hand(9, 0)
    outer = circle(80, 80, 56, 24)
    # The crescent: the disc less a second disc set off toward the light.
    s.clips.append(f'<clipPath id="{s.prefix}0"><path clip-rule="evenodd" d="{closed_d(outer)} {closed_d(circle(104, 64, 50, 24))}"/></clipPath>')
    h.fill(outer, "deep", angle=-40, spacing=8, width=10, n=6, secs=.35, weight=(1.8, 3))
    fill = h.take()
    h.line(outer, "deep", closed=True, width=4, n=2, secs=.2, alpha=(.4, .7))
    return s, f'<g clip-path="url(#{s.prefix}0)">{fill}{h.take()}</g>'


def favicon():
    """The tab's mark: the same flower, flat, since at sixteen pixels the grain is only noise."""
    rng = random.Random(3)
    petals = "".join(f'<path d="{closed_d(petal(rng, 160, 160, -math.pi / 2 + k * 2 * math.pi / 5, 150, 96))}"/>'
                     for k in range(5))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">'
            f'<g fill="#CF3F2C" stroke="#8E2A24" stroke-width="8" stroke-linejoin="round">{petals}</g>'
            f'<circle cx="160" cy="160" r="38" fill="#3A3A38"/></svg>')


def icons():
    """Each icon's <svg>, by name."""
    return {name: f'<svg class="wax icon icon--{name}" viewBox="0 0 160 160" aria-hidden="true">'
                  f'<defs>{sheet.defs()}</defs><g>{body}</g></svg>'
            for name, (sheet, body) in {"work": work(), "github": github(), "sun": sun(), "moon": moon()}.items()}
