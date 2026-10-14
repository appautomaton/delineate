"""The opening drawing: a bouquet in crayon, gathered at the right and cut by the edge of the page, so the
words have the left. A few large flowers carry it, each coloured in two passes, the second darker where the
petal folds into the centre, and outlined in a crayon that is not its own colour: blue round ochre, deep red
round red, graphite round green.

Three planes, back to front, so the page can part them; each is its own <svg> with the clips it uses. The
frame shows the bouquet down to y = 820, but every stem runs on to the plane's foot at 990, so when the page
lifts the planes apart, a stem never shows its cut end. Every strand keeps the moment the hand reached it;
each flower has its own hand and they work at once, so the whole picture is drawn in a few seconds. The
shapes come from the footers' crayon.py.
"""
import random

from crayon import Hand, Sheet, bud, leaf, poppy, stem, tulip

rng = random.Random(21)
FOOT = 990


def hand(start):
    return Hand(rng.randrange(10**6), start)


def build():
    sheets = {name: Sheet(f"hero-{name}-") for name in ("back", "mid", "front")}
    planes = {name: [] for name in sheets}

    # Back: small flowers and buds high and to the left of the bouquet, as if further off.
    s, p = sheets["back"], planes["back"]
    h = hand(.1)
    p.append(stem(h, [(980, FOOT), (960, 560), (930, 330)], width=6))
    p.append(poppy(s, h, 930, 300, 72, "blue", "violet", "deep", tilt=.15))
    h = hand(.3)
    p.append(stem(h, [(1130, FOOT), (1080, 420), (1030, 170)], width=5))
    p.append(bud(s, h, 1030, 150, 30, "pink", "maroon", ang=-.25))
    h = hand(.5)
    p.append(stem(h, [(1450, FOOT), (1440, 400), (1420, 150)], width=5))
    p.append(bud(s, h, 1420, 130, 28, "ochre", "maroon", ang=.15))
    for x0 in (880, 1240, 1560):
        h = hand(rng.uniform(.2, .9))
        for _ in range(5):
            x = x0 + rng.uniform(-50, 50)
            p.append(stem(h, [(x, FOOT), (x + rng.uniform(-30, 30), 760), (x + rng.uniform(-60, 60), rng.uniform(470, 600))], "olive", width=4))

    # Mid: the tulip and a pink poppy low down, leaves among the stems.
    s, p = sheets["mid"], planes["mid"]
    h = hand(.4)
    p.append(stem(h, [(1090, FOOT), (1100, 640), (1080, 520)]))
    p.append(leaf(s, h, (1098, 700), -2.0, 170, 46))
    p.append(tulip(s, h, 1080, 470, 62, "ochre", "red", "deep"))
    h = hand(.7)
    p.append(stem(h, [(1200, FOOT), (1190, 760), (1180, 660)]))
    p.append(poppy(s, h, 1180, 650, 108, "pink", "red", "maroon", tilt=.25))
    # Leaves from the ground beside the poppy, clear of its face.
    h = hand(.9)
    p.append(leaf(s, h, (1290, 900), -1.2, 210, 52, "olive", "green"))
    p.append(leaf(s, h, (1400, 900), -1.75, 230, 56))

    # Front: the red poppy that carries the picture, and a blue anemone cut by the edge.
    s, p = sheets["front"], planes["front"]
    h = hand(.2)
    p.append(stem(h, [(1300, FOOT), (1320, 600), (1290, 360)], width=10))
    p.append(leaf(s, h, (1318, 640), -.55, 220, 58))
    p.append(poppy(s, h, 1290, 330, 172, "red", "maroon", "maroon"))
    h = hand(.6)
    p.append(stem(h, [(1540, FOOT), (1520, 700), (1500, 600)], width=9))
    p.append(poppy(s, h, 1510, 590, 150, "blue", "deep", "deep", n=7, tilt=.1))
    # The nearest leaf, low at the left of the bouquet, where the base fades into the paper.
    h = hand(1.0)
    p.append(leaf(s, h, (980, 900), -1.38, 280, 62, "green", "olive"))
    return sheets, {k: "\n".join(v) for k, v in planes.items()}


def markup():
    """The three planes as the page places them. The frame is cropped to the bouquet, a little past the page's
    edge, so it can be drawn large; each plane runs on below it to the stems' foot."""
    sheets, planes = build()
    return "\n".join(
        f'<div class="hp hp--{n}"><svg class="wax" viewBox="800 90 820 {FOOT - 90}" preserveAspectRatio="xMaxYMin slice">'
        f'<defs>{sheets[n].defs()}</defs><g>{planes[n]}</g></svg></div>' for n in ("back", "mid", "front"))
