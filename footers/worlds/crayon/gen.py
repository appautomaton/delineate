"""Crayon: the foot of a page drawn as a crayon landscape at evening, in six depths.

One place the eye is led to: a lane climbs from the viewer's feet, through a meadow and over a valley of
fields, to a hamlet on a crest, where cypresses stand and the sun (by night the moon) hangs low above it.
The hamlet sits two thirds of the way across, so a narrow screen, which keeps only the middle of the sheet,
still has it. Behind lie a far range, lilac and hardly pressed, and a haze where the sky meets it.

The hills cross one another on the diagonal rather than stacking up in bands. Their fields run in strips
along each hill's curve and are coloured along its slope, so the strands themselves say the shape of the
ground; one field in a few has its rows running down the hill instead. Detail thickens toward the viewer and
the wax presses harder: far things are pale, cool and few, near things saturated, warm and many.

The colours are names (crayon.py), so night is not a second drawing: the same strands are laid on dark
paper, where wax reads as pastel. A few names change more than their tone: the haze is warm by day and a
moonlit mist by night, and the stars and the hamlet's lit windows show only by night. Every strand keeps
the moment the hand reached it, and the world replays the drawing, far to near, whenever it comes into view.
"""
import math
import random

from crayon import TOOTH, Hand, Sheet, bud, catmull, circle, closed_d, leaf, poppy, stem, tulip

W, H = 1600, 900
rng = random.Random(7)


def at(points, x):
    """The height of a polyline at x."""
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0) if x1 != x0 else y0
    return points[0][1] if x < points[0][0] else points[-1][1]


def contour(ctrl, step=16):
    """A smooth line through control points, sampled every `step` px across."""
    dense = catmull(ctrl, 10)
    return [(x, at(dense, x)) for x in range(int(ctrl[0][0]), int(ctrl[-1][0]) + 1, step)]


def slope(line, x):
    """Which way a line runs at x, in degrees."""
    return math.degrees(math.atan2(at(line, x + 30) - at(line, x - 30), 60))


def clipped(sheet, shape, body):
    return f'<g clip-path="{sheet.clip(closed_d(shape))}">{body}</g>'


# The land's lines, far to near. The left hill crests at a third of the way across and falls away to the
# right; the hamlet's hill rises across it from the left, crests at two thirds and passes in front of it.

RANGE_BACK = [(-60, 548), (110, 512), (260, 478), (390, 462), (520, 494), (660, 528), (820, 516), (960, 530),
              (1100, 500), (1240, 482), (1380, 506), (1530, 524), (1680, 532)]
RANGE_FRONT = [(-60, 584), (180, 566), (360, 552), (560, 570), (780, 586), (980, 566), (1170, 546), (1330, 556),
               (1510, 574), (1680, 580)]
DISTANT = contour([(-60, 600), (240, 590), (520, 602), (800, 614), (1100, 600), (1400, 594), (1680, 606)])
LEFT = contour([(-60, 646), (120, 626), (330, 612), (520, 628), (720, 662), (900, 700), (1100, 740), (1680, 800)])
CREST = contour([(-60, 820), (300, 790), (560, 746), (760, 690), (900, 654), (1040, 634), (1160, 640), (1300, 664),
                 (1480, 690), (1680, 700)])
GROUND = contour([(-60, 790), (240, 800), (560, 822), (860, 836), (1160, 826), (1420, 808), (1680, 796)])
HAMLET = 1040
LANE = [(600, 930), (660, 870), (790, 826), (860, 790), (820, 758), (880, 724), (950, 690), (1000, 662), (1030, 646)]


# The sky: a haze rubbed in above the range, clouds lying long and low, birds, and by night the stars.

def cloud(sheet, h, cx, cy, w, heads):
    """A cloud seen far off: a few heads on a flat foot, coloured in along its length. Only its crown is
    outlined, where the light catches it."""
    crown = []
    for i in range(41):
        x = cx - w / 2 + w * i / 40
        y = cy
        for bx, r in heads:
            dx, rr = x - (cx + bx * w), r * w
            if abs(dx) < rr:
                y = min(y, cy - math.sqrt(rr * rr - dx * dx) * .6)
        crown.append((x, y))
    shape = crown + [(cx + w / 2, cy + w * .02), (cx - w / 2, cy + w * .02)]
    h.fill(shape, "cloud", angle=-3, spacing=7, width=9, n=4, secs=.35, alpha=(.4, .7))
    body = h.take()
    h.line([p for p in crown if p[1] < cy - 2], "mist", width=3, n=2, weight=(1, 1.6), alpha=(.3, .55), secs=.3)
    return clipped(sheet, shape, body) + h.take()


def sky():
    s = Sheet("cr-sky-")
    out = []
    # The haze, rubbed in as a hand would: rows of long strokes, each row two or three strokes of their own
    # length and lean that overlap, lighter as they rise, so it thins with no edge and no ruled line in it. (A
    # fill would turn its passes back inside the sky and leave marks there.)
    h = Hand(29, 0)
    y = 576
    while y > 262:
        a = .3 * ((y - 262) / 314) ** 1.4
        h.clock = (576 - y) * .0015
        x = rng.uniform(-500, -200)
        while x < W + 100:
            run = rng.uniform(.45, .8) * W
            lean = rng.uniform(-14, 14)
            h.stroke(catmull([(x, y + lean), (x + run / 2, y + rng.uniform(-6, 6)), (x + run, y - lean)], 12), "haze",
                     width=18, n=3, weight=(1.8, 3.4), alpha=(a * .6, a), wander=.7, secs=.3, step=16)
            x += run * rng.uniform(.6, .85)
        y -= rng.uniform(9, 17)
    out.append(h.take())
    for i, (cx, cy, w, heads) in enumerate((
            (300, 250, 380, ((-.3, .17), (-.08, .27), (.16, .22), (.34, .14))),
            (760, 150, 230, ((-.24, .2), (.04, .3), (.28, .18))),
            (1420, 270, 320, ((-.3, .15), (-.06, .24), (.2, .27), (.38, .13))))):
        out.append(cloud(s, Hand(30 + i, .1 + i * .12), cx, cy, w, heads))
    # Birds heading home toward the hamlet, a stroke each wing.
    h = Hand(41, .5)
    for x, y, sz in ((852, 318, 15), (884, 300, 12), (912, 324, 10), (936, 292, 11), (962, 310, 9)):
        for side in (-1, 1):
            h.stroke(catmull([(x, y), (x + side * sz * .45, y - sz * .32), (x + side * sz, y - sz * .05)], 6), "graphite",
                     width=2, n=2, weight=(1, 1.6), alpha=(.5, .8), secs=.12)
    out.append(h.take())
    # Stars, thicker toward the top, a few of them crossed; "star" is clear by day.
    h = Hand(43, .6)
    dots, crosses = [], []
    clear = lambda x, y: not (x < 620 and y < 160)
    while len(dots) < 50:
        x, y = rng.uniform(20, W - 20), 30 + 320 * rng.random() ** 1.5
        if clear(x, y):
            dots.append(((x, y), (x + .8, y - .5)))
    while len(crosses) < 14:
        x, y = rng.uniform(60, W - 60), 40 + 220 * rng.random()
        if clear(x, y):
            crosses += [((x - 4, y), (x + 4, y)), ((x, y - 4), (x, y + 4))]
    h.dabs(dots, "star", width=1, n=1, weight=(1.8, 3), alpha=(.55, .95), secs=.5)
    h.dabs(crosses, "star", width=1, n=1, weight=(1, 1.4), alpha=(.6, .9), secs=.3)
    out.append(h.take())
    return s, "\n".join(out)


# The far range: two ridges laid lightly, the nearer a little cooler.

def far_range():
    s = Sheet("cr-range-")
    out = []
    h = Hand(2, .1)
    # Peaks no higher than y = 455, so a host that gives the land less height than the demo, and so crops
    # more of the sheet's top, still shows the whole range.
    for ctrl, colour, alpha in ((RANGE_BACK, "lilac", (.14, .3)), (RANGE_FRONT, "mist", (.14, .28))):
        top = contour(ctrl, 20)
        shape = top + [(W + 80, 720), (-60, 720)]
        h.fill(shape, colour, angle=-14, spacing=15, width=11, n=3, secs=.5, alpha=alpha, step=10)
        body = h.take()
        h.line(top, colour, width=4, n=3, secs=.4, alpha=(.3, .55))
        out.append(clipped(s, shape, body) + h.take())
    return s, "\n".join(out)


# The hills: each cut into strips along its curve and across by hedges that run down the fall of the land.

# How hard each crop is pressed: green fields dark, wheat light, so the patchwork reads by value.
PRESS = {"green": 1.15, "olive": 1.0, "sage": .9, "wheat": .8, "mist": .8}


def fields(s, h, top, rows, cuts, crops, strands, spacing, alpha, start, hedged=(), front=()):
    """A hill's fields. `rows` are depths below the top, wider toward the viewer; `cuts` are where the hedges
    leave the top and how far they lean by the foot. No field takes the crop of the field beside or above it,
    and a field wholly behind one of the `front` hills is not drawn."""
    out = []
    hidden = lambda patch: front and all(y > min(at(line, x) for line in front) + 3 for x, y in patch)
    xs, lean = [-90] + [x for x, _ in cuts] + [W + 90], [0] + [d for _, d in cuts] + [0]
    edge = lambda c, d: xs[c] + lean[c] * d / rows[-1]

    def run(d, a, b, n=10):
        xa, xb = edge(a, d), edge(b, d)
        return [(xa + (xb - xa) * i / n, at(top, xa + (xb - xa) * i / n) + d) for i in range(n + 1)]

    grid = {}
    for r in range(len(rows) - 1):
        for k in range(len(xs) - 1):
            crop = rng.choice([c for c in crops if c not in (grid.get((r, k - 1)), grid.get((r - 1, k)))])
            grid[r, k] = crop
            patch = run(rows[r], k, k + 1) + run(rows[r + 1], k + 1, k)
            if hidden(patch):
                continue
            across = slope(top, (edge(k, rows[r]) + edge(k + 1, rows[r])) / 2)
            angle = across + 64 if r <= 2 and rng.random() < .22 else across + rng.uniform(-5, 5)
            h.clock = start + (r * len(xs) + k) * .018
            # Nearer the viewer the tip reads broader and its passes further apart, as perspective has it.
            near = 1 + .45 * rows[r] / rows[-1]
            press = PRESS[crop]
            h.fill(patch, crop, angle=angle, spacing=spacing * near * rng.uniform(.9, 1.1), width=10 * near, n=strands,
                   secs=.2, alpha=(alpha[0] * press, min(1, alpha[1] * press)), step=8 + (4 - strands) * 4)
            out.append(clipped(s, patch, h.take()))
    # Hedgerows: thin and dark along a few strips and down each cut.
    h.clock = start + .4
    for r in hedged:
        h.line(run(rows[r], 0, len(xs) - 1, 40), "pine", width=3, n=2, weight=(1, 1.7), alpha=(.25, .45), secs=.3)
    for c in range(1, len(xs) - 1):
        h.line([(edge(c, d), at(top, edge(c, d)) + d) for d in (rows[0], rows[-1] * .5, rows[-1])], "pine", width=3,
               n=2, weight=(1, 1.7), alpha=(.22, .4), secs=.2)
    out.append(h.take())
    return out


def lane(s, h):
    """The lane, from the viewer's feet up through the fields to the hamlet, narrowing as it climbs: the line
    the eye follows. Pale as dust by day; by night it holds the moonlight."""
    widths = [200, 150, 100, 70, 50, 36, 24, 14, 6]
    left = [(x - w / 2, y) for (x, y), w in zip(LANE, widths)]
    right = [(x + w / 2, y) for (x, y), w in zip(LANE, widths)]
    shape = catmull(left, 4) + catmull(right, 4)[::-1]
    h.fill(shape, "moon", angle=-70, spacing=7, width=9, n=4, secs=.4, alpha=(.45, .75))
    body = h.take()
    h.fill(shape, "wheat", angle=-20, spacing=14, width=8, n=2, secs=.25, alpha=(.15, .3))
    body += h.take()
    for side in (left, right):
        h.line(side, "rust", width=3.5, n=3, weight=(1.1, 1.9), alpha=(.45, .75), secs=.3)
    return clipped(s, shape, body) + h.take()


def hills():
    s = Sheet("cr-hills-")
    out = fields(s, Hand(5, 0), DISTANT, [0, 14, 34, 60, 130], [(330, -20), (760, 15), (1180, -10)],
                 ["sage", "wheat", "olive", "sage"], 2, 12, (.25, .5), .3, front=(LEFT, CREST))
    out += fields(s, Hand(6, 0), LEFT, [0, 18, 42, 76, 120, 176, 300], [(170, -90), (470, 50), (760, 110)],
                  ["olive", "wheat", "sage", "olive"], 3, 11, (.55, .82), .5, hedged=(2, 4), front=(CREST, GROUND))
    out += fields(s, Hand(7, 0), CREST, [0, 20, 46, 82, 128, 186, 260, 340], [(520, -60), (840, -30), (1120, 20), (1380, 60)],
                  ["green", "wheat", "olive", "green", "sage"], 3, 10, (.58, .88), .75, hedged=(1, 3, 5), front=(GROUND,))
    out += fields(s, Hand(8, 0), GROUND, [0, 34, 90, 180], [(420, -40), (1000, 30)],
                  ["green", "olive", "wheat"], 4, 8, (.55, .85), 1.1)
    h = Hand(9, 1.2)
    for top, colour in ((DISTANT, "sage"), (LEFT, "olive"), (CREST, "green"), (GROUND, "green")):
        h.line(top, colour, width=5, n=3, secs=.35, alpha=(.4, .7))
    out.append(h.take())
    out.append(lane(s, Hand(10, 1.4)))
    return s, "\n".join(out)


# Trees and the hamlet: smaller further off; cypresses like flames along the lane's last climb.

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


def umbrella(s, h, x, ground, size):
    """A stone pine: a tall bare trunk forking under a flat crown, domed above and level below."""
    h.line([(x, ground), (x + size * .04, ground - size * .45), (x + size * .1, ground - size * .72)], "rust",
           width=size * .06, n=3, weight=(1.4, 2.4), secs=.15)
    h.line([(x + size * .05, ground - size * .5), (x - size * .14, ground - size * .74)], "rust", width=size * .04, n=2,
           weight=(1.2, 2), secs=.1)
    trunk = h.take()
    cx, cy, rx, ry = x + size * .02, ground - size * .82, size * .52, size * .16
    crown = [(cx + rx * math.cos(a) * (1 + .06 * math.sin(3 * a)), cy + ry * math.sin(a) * (1.3 if math.sin(a) < 0 else .7))
             for a in (i * math.pi / 10 for i in range(20))]
    h.fill(crown, "pine", angle=-6, spacing=5.5, width=8, n=4, secs=.25)
    body = h.take()
    h.fill([(px, py - ry * .45) for px, py in crown], "olive", angle=8, spacing=8, width=7, n=3, secs=.15, alpha=(.3, .55))
    body += h.take()
    h.line(crown, "pine", closed=True, width=3, n=2, weight=(1, 1.6), alpha=(.45, .75), secs=.15)
    return trunk + clipped(s, crown, body) + h.take()


def house(s, h, x, ground, w, tall=.62, windows=1):
    """A farmhouse: limewashed walls, a pantile roof, and windows dark by day and lit by night."""
    wall, roof = w * tall, w * .36
    walls = [(x, ground + 6), (x + w, ground + 6), (x + w, ground - wall), (x, ground - wall)]
    gable = [(x - w * .08, ground - wall), (x + w * 1.08, ground - wall), (x + w * .5, ground - wall - roof)]
    h.fill(walls, "cloud", angle=-60, spacing=4.5, width=6, n=3, secs=.15, alpha=(.65, .95))
    out = clipped(s, walls, h.take())
    h.fill(gable, "rust", angle=-15, spacing=4, width=6, n=3, secs=.15, alpha=(.65, .95))
    out += clipped(s, gable, h.take())
    for i in range(windows):
        wx = x + w * (i + 1) / (windows + 1)
        pane = [(wx - 3.2, ground - wall * .66), (wx + 3.2, ground - wall * .66), (wx + 3.2, ground - wall * .36),
                (wx - 3.2, ground - wall * .36)]
        h.fill(pane, "lamp", angle=80, spacing=2.4, width=4, n=2, secs=.08, alpha=(.8, 1))
        out += clipped(s, pane, h.take())
    h.line(walls, "graphite", closed=True, width=1.6, n=2, weight=(.8, 1.3), alpha=(.3, .55), secs=.15)
    h.line(gable, "maroon", closed=True, width=1.6, n=2, weight=(.8, 1.3), alpha=(.4, .65), secs=.15)
    return out + h.take()


def trees():
    s = Sheet("cr-trees-")
    out = []
    clock = iter(1.5 + i * .03 for i in range(60))
    # Far off: small round crowns on the distant hills and along the left hill's top.
    for x, size, line in ((90, 18, DISTANT), (612, 16, DISTANT), (700, 20, DISTANT), (1260, 18, DISTANT),
                          (1500, 16, DISTANT), (60, 30, LEFT), (560, 34, LEFT), (640, 28, LEFT)):
        out.append(round_tree(s, Hand(rng.randrange(10**6), next(clock)), x, at(line, x) + 4, size,
                              crown=rng.choice(["green", "olive", "sage"])))
    # The stone pine alone on the left hill's crest, answering the hamlet across the valley.
    out.append(umbrella(s, Hand(61, next(clock)), 330, at(LEFT, 330) + 6, 150))
    out.append(cypress(s, Hand(62, next(clock)), 410, at(LEFT, 410) + 6, 70))
    # The hamlet on its crest, a bell tower among the houses.
    for i, (dx, w, tall, windows) in enumerate(((-56, 44, .6, 2), (-14, 20, 2.6, 1), (8, 38, .66, 1), (48, 50, .56, 2))):
        x = HAMLET + dx
        out.append(house(s, Hand(80 + i, next(clock)), x, at(CREST, x + w / 2) + 10, w, tall, windows))
    for x, size in ((HAMLET + 112, 128), (HAMLET + 136, 100), (HAMLET - 80, 92)):
        out.append(cypress(s, Hand(rng.randrange(10**6), next(clock)), x, at(CREST, x) + 10, size))
    # Cypresses along the lane's last climb, smaller as it goes.
    for (x, y), size in zip(LANE[4:8], (88, 72, 58, 46)):
        out.append(cypress(s, Hand(rng.randrange(10**6), next(clock)), x + 36 * size / 88, y + 4, size))
    # Nearer: a few trees on the crest's lower fields, larger.
    for x, depth, size in ((1330, 70, 64),):
        out.append(round_tree(s, Hand(rng.randrange(10**6), next(clock)), x, at(CREST, x) + depth, size,
                              crown=rng.choice(["green", "olive"])))
    return s, "\n".join(out)


# The meadow: flowers in clumps either side of the lane, the ground between them left as it is.

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
    # Clumps by x, how many, and how high their flowers stand: tallest at the page's edges.
    for c, (x0, n, high) in enumerate(((70, 4, 724), (250, 3, 756), (430, 3, 780), (1160, 2, 790), (1350, 3, 768),
                                       (1530, 4, 736))):
        for k in range(n):
            h = Hand(rng.randrange(10**6), 1.4 + c * .06 + k * .03)
            x = x0 + rng.uniform(-55, 55)
            ground, top = H + 20, rng.uniform(high, high + 50)
            kind = rng.choice(["poppy", "poppy", "tulip", "lavender", "bud"])
            if kind == "lavender":
                out.append(lavender(h, x, ground, ground - top + 20))
                continue
            out.append(stem(h, [(x, ground), (x + rng.uniform(-10, 10), (ground + top) / 2), (x + rng.uniform(-16, 16), top)], width=5))
            cx = x + rng.uniform(-14, 14)
            if kind == "poppy":
                fill, shade = rng.choice([("red", "maroon"), ("pink", "red"), ("blue", "deep")])
                out.append(poppy(s, h, cx, top, rng.uniform(28, 38), fill, shade, shade, n=5, tilt=.25))
            elif kind == "tulip":
                out.append(tulip(s, h, cx, top, rng.uniform(18, 23), rng.choice(["ochre", "red", "pink"]), "rust", "rust"))
            else:
                out.append(bud(s, h, cx, top, rng.uniform(11, 14), rng.choice(["pink", "ochre", "violet"]), "maroon",
                               ang=rng.uniform(-.3, .3)))
    return s, "\n".join(out)


# The front: tall grass all along but thin at the lane's mouth, broad leaves, and flowers the edge cuts.

def near():
    s = Sheet("cr-near-")
    out = []
    h = Hand(3, 1.8)
    for i in range(72):
        x = rng.uniform(-20, W + 20)
        if 470 < x < 760 and rng.random() < .8:
            continue
        tip = (x + rng.uniform(-50, 50), rng.uniform(790, 870))
        h.clock = 1.8 + i * .008
        h.line([(x, H + 20), ((x + tip[0]) / 2 + rng.uniform(-16, 16), (H + tip[1]) / 2), tip],
               rng.choice(["green", "olive", "sage", "green"]), width=4, n=3, weight=(1.1, 2), secs=.25)
    out.append(h.take())
    for i, (x, ang, length) in enumerate(((150, -1.25, 180), (400, -1.9, 140), (1120, -1.2, 150), (1460, -1.95, 190))):
        out.append(leaf(s, Hand(rng.randrange(10**6), 2.0 + i * .06), (x, H + 24), ang, length, length * .3,
                        rng.choice(["green", "olive"]), "pine"))
    h = Hand(99, 1.9)
    out.append(stem(h, [(44, H + 30), (34, 830), (20, 772)], width=9))
    out.append(poppy(s, h, 20, 752, 92, "red", "maroon", "maroon", n=6, tilt=.12))
    h = Hand(98, 2.1)
    out.append(stem(h, [(1580, H + 30), (1588, 852), (1596, 806)], width=8))
    out.append(poppy(s, h, 1596, 790, 74, "blue", "deep", "deep", n=6, tilt=.15))
    return s, "\n".join(out)


def orb(colour, seed):
    """The sun or the moon: a disc wound round and round. Its glow is light, not wax: the page lays it as a soft
    gradient behind the disc."""
    h = Hand(seed, .2)
    h.spiral(100, 100, 38, colour, turns=10, width=12, n=7, secs=.7, weight=(1.8, 3.2), alpha=(.6, .95))
    h.spiral(100, 100, 12, colour, turns=4, width=8, n=4, secs=.2, weight=(1.8, 3), alpha=(.7, .95))
    return h.take()


PLANES = ("RANGE", "HILLS", "TREES", "MEADOW", "NEAR")


def placeholders():
    sky_s, sky_art = sky()
    range_s, range_art = far_range()
    hills_s, hills_art = hills()
    trees_s, trees_art = trees()
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
