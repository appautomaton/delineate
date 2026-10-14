"""Crayon: the foot of a page drawn as a crayon landscape, in six depths.

A sky with clouds scribbled in and a few birds; a far range in lilac and blue, hardly pressed; rolling hills
cut into fields, each field coloured in its own crop and its own direction, wheat, olive, grass, hedged with
dabs of dark green; trees on the crests, round crowns and cypresses, smaller the further off; a meadow of
poppies, tulips, lavender and buds in clumps with ground between them; and at the front tall grass, broad
leaves, and flowers so near the page's edge cuts them. Detail thickens toward the viewer and the wax presses
harder: far things are pale and few, near things saturated and many.

The colours are names (crayon.py), so night is not a second drawing: the same strands are laid on dark
paper, where wax reads as pastel. Every strand keeps the moment the hand reached it, and the world replays
the drawing, far to near, whenever it comes into view.
"""
import math
import random

from crayon import TOOTH, Hand, Sheet, bud, catmull, circle, closed_d, leaf, poppy, stem, tulip

W, H = 1600, 900
rng = random.Random(7)


def ridge(base, amp, phase, wave=260, ripple=.35, step=24):
    return [(x, base - amp * (.55 + .45 * math.sin(x / wave + phase)) - amp * ripple * math.sin(x / (wave * .37) + phase * 2.3))
            for x in range(-60, W + 80, step)]


def below(top, depth):
    return [(x, y + depth) for x, y in reversed(top)]


def at(points, x):
    """The height of a polyline at x."""
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return points[-1][1]


def clipped(sheet, shape, body):
    return f'<g clip-path="{sheet.clip(closed_d(shape))}">{body}</g>'


# The sky: clouds coloured in and outlined in a deeper tone; birds, a stroke each wing.

def cloud(sheet, h, cx, cy, w):
    pts = [(cx - w * .5, cy)]
    for bx, r in ((-.36, .32), (-.12, .5), (.14, .42), (.36, .3)):
        for k in range(7):
            a = math.pi + k * math.pi / 6
            pts.append((cx + w * bx + w * r * .55 * math.cos(a), cy - w * r * .1 + w * r * .5 * math.sin(a)))
    pts.append((cx + w * .5, cy))
    shape = [p for p in pts if p[1] <= cy + 1] + [(cx + w * .46, cy + w * .03), (cx - w * .46, cy + w * .03)]
    h.fill(shape, "cloud", angle=-8, spacing=10, width=9, n=4, secs=.35, alpha=(.35, .65))
    body = h.take()
    h.line(shape, "mist", closed=True, width=3, n=2, weight=(1, 1.6), alpha=(.4, .7), secs=.3)
    return clipped(sheet, shape, body) + h.take()


def sky():
    s = Sheet("cr-sky-")
    out = [cloud(s, Hand(30 + i, .05 + i * .1), cx, cy, w)
           for i, (cx, cy, w) in enumerate(((220, 170, 220), (660, 96, 150), (1100, 200, 250), (1460, 120, 170)))]
    h = Hand(41, .5)
    for x, y, sz in ((820, 230, 16), (858, 212, 12), (886, 240, 10)):
        for side in (-1, 1):
            h.stroke(catmull([(x, y), (x + side * sz * .45, y - sz * .32), (x + side * sz, y - sz * .05)], 6), "graphite",
                     width=2, n=2, weight=(1, 1.6), alpha=(.5, .8), secs=.12)
    out.append(h.take())
    return s, "\n".join(out)


# The far range: two ridges laid lightly, the nearer a little darker.

def far_range():
    s = Sheet("cr-range-")
    out = []
    h = Hand(2, .1)
    # Peaks no higher than y = 455, so a host that gives the land less height than the demo, and so crops
    # more of the sheet's top, still shows the whole range.
    for base, amp, colour, phase, alpha in ((562, 72, "lilac", 0.4, (.14, .3)), (580, 52, "blue", 2.0, (.12, .26))):
        top = ridge(base, amp, phase, wave=180, ripple=.5, step=20)
        shape = top + below(top, 150)
        h.fill(shape, colour, angle=-24, spacing=16, width=11, n=3, secs=.5, alpha=alpha, step=10)
        body = h.take()
        h.line(top, colour, width=4, n=3, secs=.4, alpha=(.3, .55))
        out.append(clipped(s, shape, body) + h.take())
    return s, "\n".join(out)


# The hills: three bands rolling toward the viewer, each cut into fields that follow its curve, hedged with
# dabs. Further bands are coloured more loosely and with fewer strands: detail thickens toward the eye.

CROPS = ["wheat", "olive", "sage", "green", "wheat", "sage", "olive"]


def hill(s, h, top, depth, rows, start, strands, spacing):
    out = []
    shape = top + below(top, depth)
    step = 6 + (4 - strands) * 3
    rows = [0] + rows + [depth]
    # The hedges that split the fields slant down the hill, each its own way; a field takes its edges from the
    # hedges either side of it, so neighbours share a line and no paper shows between them.
    cuts = [-60] + sorted(rng.uniform(60, W - 60) for _ in range(5)) + [W + 80]
    slant = [0] + [rng.uniform(-60, 60) for _ in range(5)] + [0]
    edge_x = lambda c, d: cuts[c] + slant[c] * d / depth
    for r in range(len(rows) - 1):
        d0, d1 = rows[r], rows[r + 1]
        for k in range(len(cuts) - 1):
            def run(d, a, b, n=12):
                xa, xb = edge_x(a, d), edge_x(b, d)
                return [(xa + (xb - xa) * i / n, at(top, xa + (xb - xa) * i / n) + d) for i in range(n + 1)]
            patch = run(d0, k, k + 1) + run(d1, k + 1, k)
            h.clock = start + .1 + (r * 6 + k) * .025
            h.fill(patch, CROPS[(r * 3 + k + int(start * 10)) % len(CROPS)], angle=rng.choice([-30, -12, 8, 24, 40]),
                   spacing=spacing * rng.uniform(.9, 1.1), width=10, n=strands + 1, secs=.2, alpha=(.5, .8), step=step)
            out.append(clipped(s, patch, h.take()))
        if r < len(rows) - 2:
            h.clock = start + .3 + r * .05
            marks = []
            for x in range(-40, W + 60, 15 if strands > 3 else 19):
                y = at(top, x) + d1 + rng.uniform(-2.5, 2.5)
                marks.append(((x, y), (x + 5, y - 3)))
            h.dabs(marks, "pine", width=3, n=2, secs=.5, alpha=(.35, .65))
            out.append(h.take())
    h.clock = start + .35
    marks = []
    for c in range(1, len(cuts) - 1):
        for d in range(4, depth - 4, 13):
            x = edge_x(c, d)
            marks.append(((x, at(top, x) + d), (x + 2, at(top, x) + d + 5)))
    h.dabs(marks, "pine", width=3, n=2, secs=.5, alpha=(.35, .7))
    h.clock = start + .2
    h.line(top, "olive", width=5, n=3, secs=.4, alpha=(.45, .75))
    out.append(h.take())
    return out


def path(s, h):
    """A lane from the near edge up into the fields, narrowing as it goes: the plainest way to say depth."""
    spine = [(780, H + 20), (840, 830), (930, 770), (900, 720), (960, 670), (1010, 640)]
    widths = [150, 120, 80, 50, 26, 10]
    left = [(x - w / 2, y) for (x, y), w in zip(spine, widths)]
    right = [(x + w / 2, y) for (x, y), w in zip(spine, widths)]
    shape = catmull(left, 4) + catmull(right, 4)[::-1]
    h.fill(shape, "wheat", angle=-70, spacing=8, width=9, n=4, secs=.4, alpha=(.45, .8))
    body = h.take()
    for side in (left, right):
        h.line(side, "rust", width=3, n=2, weight=(1, 1.7), alpha=(.45, .75), secs=.3)
    return clipped(s, shape, body) + h.take()


def hills():
    s = Sheet("cr-hills-")
    far = ridge(596, 32, 1.2, wave=300, ripple=.3)
    mid = ridge(664, 38, 3.4, wave=340, ripple=.25)
    near_top = ridge(748, 30, .5, wave=420, ripple=.2)
    out = hill(s, Hand(5, 0), far, 110, [18, 44, 76], .3, 2, 11)
    out += hill(s, Hand(6, 0), mid, 140, [26, 64, 104], .55, 3, 9.5)
    out += hill(s, Hand(7, 0), near_top, 190, [40, 100], .8, 4, 8.5)
    out.append(path(s, Hand(8, 1.1)))
    return s, "\n".join(out), far, mid, near_top


# Trees and a hamlet: round crowns on trunks, cypresses like flames, three houses; smaller further off.

def round_tree(s, h, x, ground, size, crown="green", shade="pine"):
    h.line([(x, ground), (x + size * .04, ground - size * .5)], "rust", width=size * .1, n=3, weight=(1.4, 2.4), secs=.12)
    trunk = h.take()
    cx, cy, r = x + size * .03, ground - size * .74, size * .36
    shape = circle(cx, cy, r, 14)
    h.fill(shape, crown, angle=-40, spacing=6.5, width=8, n=4, secs=.2)
    body = h.take()
    h.fill(circle(cx + r * .3, cy + r * .3, r * .7, 10), shade, angle=30, spacing=8, width=7, n=3, secs=.12, alpha=(.35, .6))
    body += h.take()
    h.line(shape, shade, closed=True, width=3, n=2, weight=(1, 1.6), alpha=(.45, .75), secs=.15)
    return trunk + clipped(s, shape, body) + h.take()


def cypress(s, h, x, ground, size):
    shape = [(x, ground - size), (x + size * .1, ground - size * .7), (x + size * .13, ground - size * .3), (x + size * .07, ground),
             (x - size * .07, ground), (x - size * .13, ground - size * .3), (x - size * .1, ground - size * .7)]
    h.fill(shape, "pine", angle=-75, spacing=5, width=7, n=4, secs=.18)
    body = h.take()
    h.line(shape, "pine", closed=True, width=2.5, n=2, weight=(1, 1.5), alpha=(.5, .8), secs=.15)
    return clipped(s, shape, body) + h.take()


def house(s, h, x, ground, size):
    w, wall, roof = size, size * .55, size * .45
    walls = [(x, ground), (x + w, ground), (x + w, ground - wall), (x, ground - wall)]
    gable = [(x - w * .08, ground - wall), (x + w * 1.08, ground - wall), (x + w * .5, ground - wall - roof)]
    h.fill(walls, "cloud", angle=-60, spacing=6, width=6, n=3, secs=.15, alpha=(.6, .9))
    out = clipped(s, walls, h.take())
    h.fill(gable, "red", angle=-20, spacing=5, width=6, n=3, secs=.15)
    out += clipped(s, gable, h.take())
    h.line(walls, "graphite", closed=True, width=2, n=2, weight=(.9, 1.4), alpha=(.45, .75), secs=.15)
    h.line(gable, "maroon", closed=True, width=2, n=2, weight=(.9, 1.4), alpha=(.5, .8), secs=.15)
    door = [(x + w * .4, ground), (x + w * .4, ground - wall * .55), (x + w * .6, ground - wall * .55), (x + w * .6, ground)]
    h.stroke(door, "graphite", width=2, n=2, weight=(1, 1.6), secs=.08)
    return out + h.take()


def trees(far, mid, near_top):
    s = Sheet("cr-trees-")
    out = []
    plan = [(150, "round", 34, far), (196, "cypress", 44, far), (470, "round", 30, far), (760, "cypress", 40, far),
            (1500, "round", 36, far), (300, "round", 56, mid), (340, "cypress", 70, mid), (690, "round", 50, mid),
            (1420, "cypress", 74, mid), (1460, "cypress", 60, mid), (120, "round", 96, near_top), (1300, "round", 104, near_top),
            (1352, "cypress", 128, near_top)]
    for i, (x, kind, size, line) in enumerate(plan):
        h = Hand(60 + i, 1.2 + i * .04)
        ground = at(line, x) + 6
        out.append(cypress(s, h, x, ground, size) if kind == "cypress" else
                   round_tree(s, h, x, ground, size, crown=rng.choice(["green", "olive"])))
    for i, (x, size) in enumerate(((1120, 34), (1166, 28), (1204, 38))):
        out.append(house(s, Hand(80 + i, 1.5 + i * .08), x, at(mid, x) + 18, size))
    return s, "\n".join(out)


# The meadow: flowers in clumps, the ground between them left as paper.

def lavender(h, x, ground, height):
    marks = []
    for _ in range(5):
        dx = rng.uniform(-14, 14)
        top = (x + dx * 1.6, ground - height * rng.uniform(.75, 1))
        h.line([(x, ground), (x + dx, ground - height * .5), top], "sage", width=3, n=2, weight=(1, 1.6), secs=.15)
        for j in range(7):
            t = j / 7
            px, py = top[0] + (x - top[0]) * t * .35, top[1] + height * .32 * t
            marks.append(((px - 3, py), (px + 3, py - 3)))
    h.dabs(marks, "violet", width=5, n=3, weight=(1.6, 2.6), alpha=(.5, .9), secs=.3)
    return h.take()


def meadow():
    s = Sheet("cr-meadow-")
    out = []
    for c, (x0, n) in enumerate(((90, 3), (330, 2), (560, 3), (1040, 3), (1250, 2), (1500, 3))):
        for k in range(n):
            h = Hand(rng.randrange(10**6), 1.6 + c * .1 + k * .05)
            x = x0 + rng.uniform(-60, 60)
            ground, top = H + 20, rng.uniform(770, 830)
            kind = rng.choice(["poppy", "poppy", "tulip", "lavender", "bud"])
            if kind == "lavender":
                out.append(lavender(h, x, ground, ground - top + 20))
                continue
            out.append(stem(h, [(x, ground), (x + rng.uniform(-10, 10), (ground + top) / 2), (x + rng.uniform(-16, 16), top)], width=5))
            cx = x + rng.uniform(-14, 14)
            if kind == "poppy":
                fill, shade = rng.choice([("red", "maroon"), ("pink", "red"), ("blue", "deep")])
                out.append(poppy(s, h, cx, top, rng.uniform(28, 36), fill, shade, shade, n=5, tilt=.25))
            elif kind == "tulip":
                out.append(tulip(s, h, cx, top, rng.uniform(18, 22), rng.choice(["ochre", "red", "pink"]), "rust", "rust"))
            else:
                out.append(bud(s, h, cx, top, rng.uniform(11, 14), rng.choice(["pink", "ochre", "violet"]), "maroon", ang=rng.uniform(-.3, .3)))
    return s, "\n".join(out)


# The front: tall grass all along, broad leaves, and flowers so near that the edge cuts them.

def near():
    s = Sheet("cr-near-")
    out = []
    h = Hand(3, 2.1)
    for i in range(64):
        x = rng.uniform(-20, W + 20)
        if 700 < x < 900:
            continue
        tip = (x + rng.uniform(-50, 50), rng.uniform(800, 870))
        h.clock = 2.1 + i * .01
        h.line([(x, H + 20), ((x + tip[0]) / 2 + rng.uniform(-16, 16), (H + tip[1]) / 2), tip],
               rng.choice(["green", "olive", "sage", "green"]), width=4, n=3, weight=(1.1, 2), secs=.25)
    out.append(h.take())
    for i, (x, ang, length) in enumerate(((160, -1.25, 170), (430, -1.9, 140), (1130, -1.2, 150), (1470, -1.95, 180))):
        out.append(leaf(s, Hand(rng.randrange(10**6), 2.3 + i * .08), (x, H + 24), ang, length, length * .3, rng.choice(["green", "olive"]), "pine"))
    h = Hand(99, 2.4)
    out.append(stem(h, [(40, H + 30), (30, 850), (16, 800)], width=9))
    out.append(poppy(s, h, 16, 780, 84, "red", "maroon", "maroon", n=6, tilt=.12))
    h = Hand(98, 2.6)
    out.append(stem(h, [(1580, H + 30), (1588, 860), (1596, 820)], width=8))
    out.append(poppy(s, h, 1596, 806, 70, "blue", "deep", "deep", n=6, tilt=.15))
    return s, "\n".join(out)


def orb(colour, seed):
    h = Hand(seed, .2)
    h.spiral(100, 100, 30, colour, turns=8, width=11, n=7, secs=.7, weight=(1.6, 3), alpha=(.55, .95))
    return h.take()


PLANES = ("RANGE", "HILLS", "TREES", "MEADOW", "NEAR")


def placeholders():
    sky_s, sky_art = sky()
    range_s, range_art = far_range()
    hills_s, hills_art, far, mid, near_top = hills()
    trees_s, trees_art = trees(far, mid, near_top)
    meadow_s, meadow_art = meadow()
    near_s, near_art = near()
    values = {"SKY": sky_art, "SKY_DEFS": sky_s.defs(), "SUN": orb("ochre", 21), "MOON": orb("moon", 22), "TOOTH": TOOTH}
    for name, sheet, art in zip(PLANES, (range_s, hills_s, trees_s, meadow_s, near_s), (range_art, hills_art, trees_art, meadow_art, near_art)):
        values[name] = art
        values[f"{name}_DEFS"] = sheet.defs()
    return values


# A flower on its stem, for the scene picker.
GLYPH = ('<circle cx="8" cy="5.6" r="1.4"/><path d="M8 2.2c1.4 0 1.9 1.6 1 2.4 1.3-.5 2.5.7 1.8 1.8-.6 1-2 .9-2.6.2.4 1.2-.6 2.1-1.6 1.6'
         '-1-.5-1-1.8-.2-2.3-1.1.5-2.3-.4-2-1.5.3-1.2 1.7-1.4 2.4-.7-.6-1-.1-2.6 1.2-2.5z"/><path d="M8 9.2V14.4M8 12.2c-1.6-.2-2.6-1.1-3-2.4M8 11.4c1.4-.1 2.3-.9 2.6-2"/>')
