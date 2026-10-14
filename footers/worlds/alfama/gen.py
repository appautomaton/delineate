"""Alfama: Lisbon's oldest quarter seen from the Portas do Sol, drawn as an urban sketch in pen and watercolour.

The view falls over a sea of terracotta roofs to the Tejo, with São Vicente de Fora and the dome of the
Panteão standing out of it, a pergola of bougainvillea framing the left and tram 28 climbing past below.
The ink is a fineliner: lines run a little past every corner, some edges are left out altogether, shadows
are hatched. The washes are laid loosely over the ink, never quite inside it, and bloom into each other.
Houses are generated row by row down the hill, each with its walls, its roof seen from above, windows,
shutters, balconies and chimneys; the farther the row, the fewer the marks.
"""
import math
import random
from collections import defaultdict

from common import f, poly, smooth, spans, tile, union_outline

WALLS = ["ochre", "rose", "cream", "blue", "sage", "white", "ochre", "salmon", "white", "cream", "rose", "white"]
BLOOM = {"ochre": "rose", "rose": "ochre", "cream": "salmon", "blue": "sage", "sage": "blue", "white": "cream", "salmon": "ochre"}
SHUTTERS = ["green", "green", "teal", "brown", "blue-dark"]


class Sketch:
    """One stratum of the sketch: bare paper where its buildings stand, washes by colour, ink in three weights."""

    def __init__(self, seed, s=1.0):
        self.rng = random.Random(seed)
        self.s = s
        self.ink, self.fine, self.heavy, self.knock = [], [], [], []
        self.washes = defaultdict(list)
        self.windows = []
        self.place = None
        self.fade = True

    def line(self, x1, y1, x2, y2, over=None, wobble=.5, to=None):
        """A pen line that runs a little past both ends and bows very slightly."""
        rng = self.rng
        over = 2.2 * self.s if over is None else over
        dx, dy = x2 - x1, y2 - y1
        ln = math.hypot(dx, dy) or 1
        ux, uy = dx / ln, dy / ln
        a, b = rng.uniform(.15, 1) * over, rng.uniform(.15, 1) * over
        sx, sy = x1 - ux * a, y1 - uy * a
        ex, ey = x2 + ux * b, y2 + uy * b
        bow = rng.uniform(-wobble, wobble)
        cx, cy = (sx + ex) / 2 - uy * bow, (sy + ey) / 2 + ux * bow
        (self.ink if to is None else to).append(f"M{f(sx)} {f(sy)}q{f(cx - sx)} {f(cy - sy)} {f(ex - sx)} {f(ey - sy)}")

    def dash(self, x, y, dx, dy=0.0, to=None):
        (self.heavy if to is None else to).append(f"M{f(x)} {f(y)}l{f(dx)} {f(dy)}")

    def outline(self, pts, closed=True, over=None, to=None, skip=0.0):
        n = len(pts)
        for k in range(n if closed else n - 1):
            if self.rng.random() >= skip:
                self.line(*pts[k], *pts[(k + 1) % n], over=over, to=to)

    def rect(self, x, y, w, h, over=None, to=None, skip=0.0):
        self.outline([(x, y), (x + w, y), (x + w, y + h), (x, y + h)], over=over, to=to, skip=skip)

    def hatch(self, pts, gap, angle=58, keep=.88, to=None):
        """Quick parallel strokes clipped to a polygon."""
        a = math.radians(angle)
        ca, sa = math.cos(a), math.sin(a)
        rot = [(x * ca + y * sa, -x * sa + y * ca) for x, y in pts]
        vs = [v for _, v in rot]
        v = min(vs) + gap * self.rng.random()
        out = self.fine if to is None else to
        while v < max(vs):
            hits = spans([rot], v)
            for u0, u1 in zip(hits[0::2], hits[1::2]):
                if self.rng.random() < keep and u1 - u0 > .8:
                    x0, y0 = u0 * ca - v * sa, u0 * sa + v * ca
                    out.append(f"M{f(x0)} {f(y0)}l{f(u1 * ca - v * sa - x0)} {f(u1 * sa + v * ca - y0)}")
            v += gap * self.rng.uniform(.85, 1.15)

    def wash(self, colour, pts, slip=None):
        """A wash laid a touch off the drawn shape, as a hand would."""
        rng = self.rng
        slip = 1.5 * self.s if slip is None else slip
        dx, dy = rng.uniform(-slip, slip), rng.uniform(-slip * .8, slip * .8)
        self.washes[colour].append(poly([(x + dx + rng.uniform(-.7, .7), y + dy + rng.uniform(-.7, .7)) for x, y in pts]))

    def wash_rect(self, colour, x, y, w, h, slip=None):
        self.wash(colour, [(x, y), (x + w, y), (x + w, y + h), (x, y + h)], slip)


# ---------------------------------------------------------------------------------------------------------
# A house: walls, a roof seen from above, windows by floor. Detail: 0 far, 1 middle, 2 near.

def roof(sk, x, top, w, kind, rng, detail, tilt=.42):
    """The roof and what stands on it. Returns its silhouette for the knock-out, and the gable's apex if it has one."""
    s = sk.s
    eave = 2.4 * s
    pd = w * rng.uniform(.8, 1.15) * tilt
    fine = sk.fine
    if kind == "hip":
        back, ridge = top - pd, top - pd * .52
        inset = min(w * .34, pd * .5)
        A, B = (x - eave, top + .4), (x + w + eave, top + .4)
        R1, R2 = (x + inset, ridge), (x + w - inset, ridge)
        C, D = (x + w + eave * .5, back), (x - eave * .5, back)
        sk.wash("roof", [A, B, R2, R1])
        sk.wash("roof-lit", [A, R1, D])
        sk.wash("roof-dark", [B, C, R2])
        sk.wash("roof-lit", [R1, R2, C, D])
        sk.line(*A, *B)
        sk.line(*A, *R1, over=1.2 * s)
        sk.line(*B, *R2, over=1.2 * s)
        if R2[0] - R1[0] > 1:
            sk.line(*R1, *R2, over=1.2 * s)
        if detail:
            sk.line(*R1, *D, over=.8 * s, to=fine)
            sk.line(*R2, *C, over=.8 * s, to=fine)
            if rng.random() < .6:
                sk.line(*D, *C, over=1.5 * s, to=fine)
        if detail == 2 or (detail == 1 and rng.random() < .5):
            # Tile channels, drawn only in a stretch or two, the way a sketcher suggests them.
            xx = x + rng.uniform(1, 4) * s
            run = rng.random() < .5
            while xx < x + w - 1:
                if rng.random() < .18:
                    run = not run
                if run:
                    if xx < R1[0]:
                        up = A[1] + (xx - A[0]) / (R1[0] - A[0]) * (R1[1] - A[1])
                    elif xx > R2[0]:
                        up = B[1] + (xx - B[0]) / (R2[0] - B[0]) * (R2[1] - B[1])
                    else:
                        up = ridge
                    if top - up > 3 * s:
                        sk.dash(xx, top - .6 * s, rng.uniform(-.4, .4) * s, up - top + 1.4 * s, to=fine)
                xx += 2.8 * s
            for k in range(1, 3 if detail == 2 else 2):
                y = top - k * 2.6 * s
                x0 = A[0] + (y - A[1]) / (R1[1] - A[1]) * (R1[0] - A[0]) + 1.5 * s
                x1 = B[0] + (y - B[1]) / (R2[1] - B[1]) * (R2[0] - B[0]) - 1.5 * s
                d, xx = [], x0
                while xx < x1 - 3 * s:
                    step = rng.uniform(3.4, 4.4) * s
                    d.append(f"q{f(step / 2)} {f(1.4 * s)} {f(step)} 0")
                    xx += step
                if d:
                    fine.append(f"M{f(x0)} {f(y)}" + "".join(d))
        sil = [A, B, C, D]
        crown = ((R1[0] + R2[0]) / 2, ridge)
        apex = None
    elif kind == "gable":
        pg = w * rng.uniform(.17, .24)
        cx = x + w / 2
        rise = pd * .8
        A, P, B = (x - eave, top + .4), (cx, top - pg), (x + w + eave, top + .4)
        A2, P2, B2 = (A[0], A[1] - rise), (cx, top - pg - rise), (B[0], B[1] - rise)
        sk.wash("roof-lit", [A, P, P2, A2])
        sk.wash("roof-dark", [P, B, B2, P2])
        sk.line(*A, *P)
        sk.line(*P, *B)
        sk.line(*P, *P2, over=1.2 * s)
        if detail:
            sk.line(*A, *A2, over=.8 * s, to=fine)
            sk.line(*B, *B2, over=.8 * s, to=fine)
            sk.line(*A2, *P2, over=1.2 * s, to=fine)
        if detail == 2 or (detail == 1 and rng.random() < .5):
            k = 1
            while k * 2.8 * s < rise - 1:
                o = k * 2.8 * s
                if rng.random() < .7:
                    sk.dash(A[0] + 1, A[1] - o, P[0] - A[0] - 2, P[1] - A[1], to=fine)
                if rng.random() < .45:
                    sk.dash(P[0] + 1, P[1] - o, B[0] - P[0] - 2, B[1] - P[1], to=fine)
                k += 1
        sil = [A, B, B2, P2, A2]
        crown = (cx + w * .2, top - pg * .5 - rise * .5)
        apex = (cx, top - pg + 1.6 * s)
    else:
        # A flat roof terrace behind a parapet, with washing strung across it.
        pt = pd * .55
        par = 3 * s
        floor = [(x, top - par), (x + w, top - par), (x + w - 1, top - par - pt), (x + 1, top - par - pt)]
        sk.wash("terrace", floor)
        sk.line(x, top - par, x + w, top - par)
        if detail:
            sk.line(x + 1, top - par - pt, x + w - 1, top - par - pt, to=fine)
            sk.line(x, top - par, x + 1, top - par - pt, over=.6 * s, to=fine)
            sk.line(x + w, top - par, x + w - 1, top - par - pt, over=.6 * s, to=fine)
        if detail and rng.random() < .7:
            ly = top - par - pt * .55
            sk.line(x + 4 * s, ly, x + w - 4 * s, ly + 1 * s, over=.4 * s, wobble=.8 * s, to=fine)
            cx = x + 6 * s
            while cx < x + w - 10 * s:
                if rng.random() < .7:
                    cw, ch = rng.uniform(3, 6) * s, rng.uniform(4, 7) * s
                    sk.wash(rng.choice(["cloth-a", "cloth-b", "cloth-c", "cloth-d"]), [(cx, ly + .4 * s), (cx + cw, ly + .6 * s), (cx + cw, ly + ch), (cx, ly + ch)], slip=.4)
                    if detail == 2:
                        sk.rect(cx, ly + .4 * s, cw, ch - .4 * s, over=.4 * s, to=fine)
                cx += rng.uniform(5, 9) * s
        sil = [(x, top), (x + w, top), (x + w, top - par - pt - 1), (x, top - par - pt - 1)]
        crown = (x + w * rng.uniform(.25, .75), top - par - pt * .3)
        apex = None
    # Chimneys, aerials and dishes.
    if kind != "flat" and detail and rng.random() < .55:
        cx, cy = crown[0] + rng.uniform(-w * .2, w * .2), crown[1]
        cw, ch = 3.2 * s, rng.uniform(6, 9) * s
        sk.wash("white", [(cx - cw / 2, cy), (cx + cw / 2, cy), (cx + cw / 2, cy - ch), (cx - cw / 2, cy - ch)], slip=.3)
        sk.wash("shade", [(cx + cw * .1, cy), (cx + cw / 2, cy), (cx + cw / 2, cy - ch), (cx + cw * .1, cy - ch)], slip=.2)
        sk.line(cx - cw / 2, cy, cx - cw / 2, cy - ch, over=.3 * s, to=fine)
        sk.line(cx + cw / 2, cy, cx + cw / 2, cy - ch, over=.3 * s, to=fine)
        if rng.random() < .5:
            sk.line(cx - cw * .8, cy - ch, cx, cy - ch - 2.6 * s, over=.3 * s, to=fine)
            sk.line(cx, cy - ch - 2.6 * s, cx + cw * .8, cy - ch, over=.3 * s, to=fine)
        else:
            sk.line(cx - cw * .9, cy - ch, cx + cw * .9, cy - ch, over=.3 * s, to=fine)
            sk.line(cx - cw * .6, cy - ch - 1.6 * s, cx + cw * .6, cy - ch - 1.6 * s, over=.3 * s, to=fine)
        sil.append((cx, cy - ch - 3 * s))
    elif detail and rng.random() < .25:
        ax, ay = crown[0] + rng.uniform(-w * .25, w * .25), crown[1]
        ah = rng.uniform(12, 18) * s
        sk.line(ax, ay, ax, ay - ah, over=.3 * s, to=fine)
        for k in range(3):
            sk.line(ax - (5 - k * 1.3) * s, ay - ah + k * 2.4 * s, ax + (5 - k * 1.3) * s, ay - ah + k * 2.4 * s, over=.3 * s, to=fine)
    elif detail and rng.random() < .15:
        dx_, dy_ = crown[0] + rng.uniform(-w * .2, w * .2), crown[1] - 2 * s
        sk.fine.append(f"M{f(dx_ - 3 * s)} {f(dy_)}a{f(3 * s)} {f(2 * s)} 0 1 0 {f(6 * s)} 0Z")
        sk.wash("white", [(dx_ - 3 * s, dy_), (dx_, dy_ - 2 * s), (dx_ + 3 * s, dy_), (dx_, dy_ + 2 * s)], slip=.2)
    return sil, apex


def house(sk, x, base, w, h, colour, kind, rng, detail, tiles=False, door=True, tilt=.42):
    s = sk.s
    top = base - h
    sil, apex = roof(sk, x, top, w, kind, rng, detail, tilt)
    sk.knock.append(poly(sil))
    sk.knock.append(poly([(x, top), (x + w, top), (x + w, base + 2), (x, base + 2)]))

    # Walls: a wash with a second colour blooming into it from below, the eaves casting a band of shadow.
    sk.wash_rect(colour, x, top, w, h)
    if detail and rng.random() < .55:
        u = [rng.uniform(.18, .45) for _ in range(4)]
        sk.wash(BLOOM.get(colour, "cream"), [(x, base - h * u[0]), (x + w * .35, base - h * u[1]), (x + w * .7, base - h * u[2]), (x + w, base - h * u[3]), (x + w, base), (x, base)])
    if tiles:
        sk.wash_rect("azulejo", x + 1, top + 4 * s, w - 2, h - 4 * s, slip=.6)
    if apex:
        sk.wash(colour, [(x, top), apex, (x + w, top)])
        if detail == 2 and rng.random() < .5:
            sk.fine.append(f"M{f(apex[0] - 2.4 * s)} {f((top + apex[1]) / 2 + 1)}a{f(2.4 * s)} {f(1.8 * s)} 0 1 0 {f(4.8 * s)} 0a{f(2.4 * s)} {f(1.8 * s)} 0 1 0 {f(-4.8 * s)} 0")
    sk.wash("violet", [(x - 1, top), (x + w + 1, top), (x + w + 1, top + 4.5 * s), (x - 1, top + 5.5 * s)], slip=.5)
    shaded = rng.random() < .5
    if shaded:
        sw = w * rng.uniform(.14, .3)
        sk.wash("shade", [(x + w - sw, top + 2), (x + w, top), (x + w, base), (x + w - sw * .8, base)])
        if detail:
            sk.hatch([(x + w - sw * .7, top + 6 * s), (x + w, top + 6 * s), (x + w, base - 2 * s), (x + w - sw * .7, base - 2 * s)], 2.6 * s)
    sk.rect(x, top, w, h, skip=.22 if not shaded else .08)
    if detail:
        sk.line(x - 1.4 * s, top + 2.2 * s, x + w + 1.4 * s, top + 2.2 * s, over=.6 * s, to=sk.fine)

    floors = max(1, round((h - 8 * s) / (24 * s)))
    fh = (h - 6 * s) / floors
    cols = max(1, int(w / (19 * s)))
    plan = rng.choice(["open", "shutter", "balcony", "mixed", "mixed"])
    shutter = rng.choice(SHUTTERS)
    ww, wh = rng.uniform(7.2, 9) * s, rng.uniform(12, 14.5) * s
    door_col = rng.randrange(cols)
    for fl in range(floors):
        fy = base - fh * fl          # this floor's line
        for c in range(cols):
            cx = x + w * (c + .5) / cols
            cy = fy - fh * .58
            if fl == 0 and door and c == door_col and detail:
                dw, dh = ww * 1.15, min(fh - 3 * s, wh * 1.45)
                arched = rng.random() < .4
                sk.wash("door", [(cx - dw / 2, base), (cx - dw / 2, base - dh + (dw / 2 if arched else 0)), (cx, base - dh), (cx + dw / 2, base - dh + (dw / 2 if arched else 0)), (cx + dw / 2, base)], slip=.6)
                if arched:
                    sk.ink.append(f"M{f(cx - dw / 2)} {f(base)}V{f(base - dh + dw / 2)}a{f(dw / 2)} {f(dw / 2)} 0 0 1 {f(dw)} 0V{f(base)}")
                else:
                    sk.rect(cx - dw / 2, base - dh, dw, dh, over=1 * s)
                sk.line(cx - dw / 2 - 2 * s, base, cx + dw / 2 + 2 * s, base, over=.5 * s, to=sk.fine)
                continue
            if rng.random() < .08:
                continue
            kind_w = plan if plan != "mixed" else rng.choice(["open", "shutter", "balcony", "half"])
            if fl == 0 and kind_w == "balcony":
                kind_w = "open"
            wx, wy = cx - ww / 2, cy - wh / 2
            if detail == 0:
                # Far off, a window is a dab of dark and nothing more.
                sk.wash("glass", [(wx, wy), (wx + ww, wy), (wx + ww, wy + wh), (wx, wy + wh)], slip=.4)
                sk.windows.append((wx, wy, ww, wh))
                continue
            if kind_w == "shutter":
                sk.wash(shutter, [(wx, wy), (wx + ww, wy), (wx + ww, wy + wh), (wx, wy + wh)], slip=.5)
                sk.rect(wx, wy, ww, wh, over=.9 * s)
                if detail == 2:
                    yy = wy + 1.8 * s
                    while yy < wy + wh - 1:
                        sk.dash(wx + .6, yy, ww - 1.2, 0, to=sk.fine)
                        yy += 1.8 * s
                sk.line(cx, wy, cx, wy + wh, over=.3 * s, to=sk.fine)
                continue
            if kind_w == "balcony":
                bh = fy - 1 - (cy - wh / 2)
                sk.wash("glass", [(wx, wy), (wx + ww, wy), (wx + ww, fy - 1), (wx, fy - 1)], slip=.5)
                sk.rect(wx, wy, ww, bh, over=.9 * s)
                sk.line(cx, wy, cx, fy - 1, over=.3 * s, to=sk.fine)
                bx0, bx1 = wx - 3 * s, wx + ww + 3 * s
                sk.line(bx0, fy - 1, bx1, fy - 1, over=1 * s, to=sk.heavy)
                sk.line(bx0, fy - 1 - 6 * s, bx1, fy - 1 - 6 * s, over=.8 * s)
                if detail == 2:
                    xx = bx0 + 1.6 * s
                    while xx < bx1 - .5:
                        sk.dash(xx, fy - 1 - 6 * s, 0, 6 * s, to=sk.fine)
                        xx += 1.7 * s
                else:
                    sk.hatch([(bx0, fy - 7 * s), (bx1, fy - 7 * s), (bx1, fy - 1), (bx0, fy - 1)], 1.8 * s, angle=90, keep=1)
                if rng.random() < .55:
                    for k in range(rng.randint(1, 3)):
                        px = bx0 + rng.uniform(1, bx1 - bx0 - 4 * s)
                        sk.wash("leaf", [(px, fy - 7 * s), (px + 4 * s, fy - 8 * s), (px + 5 * s, fy - 5 * s), (px, fy - 5 * s)], slip=.4)
                        sk.wash("geranium", [(px + 1 * s, fy - 9.5 * s), (px + 3.4 * s, fy - 10 * s), (px + 3.8 * s, fy - 7.6 * s), (px + 1 * s, fy - 7.4 * s)], slip=.3)
                sk.windows.append((wx, wy, ww, bh))
                continue
            sk.wash("glass", [(wx, wy), (wx + ww, wy), (wx + ww, wy + wh), (wx, wy + wh)], slip=.5)
            sk.rect(wx, wy, ww, wh, over=.9 * s)
            sk.line(cx, wy, cx, wy + wh, over=.2 * s, to=sk.fine)
            sk.line(wx, wy + wh * .34, wx + ww, wy + wh * .34, over=.2 * s, to=sk.fine)
            if detail == 2 and rng.random() < .5:
                sk.rect(wx - 1.3 * s, wy - 1.3 * s, ww + 2.6 * s, wh + 2.6 * s, over=.6 * s, to=sk.fine)
            if kind_w == "half":
                side = rng.choice((-1, 1))
                sx0 = wx - ww * .45 if side < 0 else wx + ww
                sk.wash(shutter, [(sx0, wy), (sx0 + ww * .45, wy), (sx0 + ww * .45, wy + wh), (sx0, wy + wh)], slip=.4)
                sk.rect(sx0, wy, ww * .45, wh, over=.4 * s, to=sk.fine)
            if fl > 0 and rng.random() < .25:
                sk.line(wx - 1.5 * s, wy + wh + 1.2 * s, wx + ww + 1.5 * s, wy + wh + 1.2 * s, over=.4 * s, to=sk.heavy)
            sk.windows.append((wx, wy, ww, wh))
    if detail == 2 and rng.random() < .45:
        px = x + w - 2.5 * s if rng.random() < .5 else x + 2.5 * s
        sk.line(px, top + 2 * s, px, base, over=.3 * s, to=sk.fine)
        for k in range(1, int(h / (16 * s))):
            sk.dash(px - 1.2 * s, top + k * 16 * s, 2.4 * s, 0, to=sk.fine)


def row(sk, x0, x1, base_at, rng, detail, floors=(2, 4), width=(42, 72), mix=(.5, .22), tiles=.1, holes=(), tilt=.42):
    x = x0
    prev_top = None
    while x < x1:
        w = rng.uniform(*width) * sk.s
        if any(a < x + w / 2 < b for a, b in holes):
            x += w
            continue
        h = rng.randint(*floors) * 24 * sk.s + 8 * sk.s + rng.uniform(-3, 3) * sk.s
        base = base_at(x + w / 2) + rng.uniform(-5, 5) * sk.s
        roll = rng.random()
        kind = "hip" if roll < mix[0] else "gable" if roll < mix[0] + mix[1] else "flat"
        colour = rng.choice(WALLS)
        house(sk, x, base, w, h, colour, kind, rng, detail, tiles=rng.random() < tiles and colour in ("white", "blue", "cream"), tilt=tilt)
        top = base - h
        if detail and prev_top is not None and top - prev_top > 10 * sk.s:
            d = min(w * .7, (top - prev_top) * 1.4)
            sk.wash("violet", [(x, top), (x + d, top), (x, top + d * 1.15)], slip=.6)
            if detail == 2:
                sk.hatch([(x, top + 3 * sk.s), (x + d * .8, top + 3 * sk.s), (x, top + d)], 2.4 * sk.s, angle=48)
        prev_top = top
        x += w + rng.uniform(-1.5, .5) * sk.s


# ---------------------------------------------------------------------------------------------------------
# The two churches that stand out of the roofs.

def panteao(sk, cx, base):
    """Santa Engrácia, the National Pantheon: a white body with corner towers, a drum of pilasters, the dome."""
    s = sk.s
    body = [(cx - 70, base - 64), (cx + 70, base - 64), (cx + 70, base), (cx - 70, base)]
    towers = [[(tx, base - 84), (tx + 22, base - 84), (tx + 22, base), (tx, base)] for tx in (cx - 74, cx + 52)]
    drum = [(cx - 31, base - 112), (cx + 31, base - 112), (cx + 31, base - 66), (cx - 31, base - 66)]
    dome = [(cx - 33 + 66 * k / 24, base - 114 - 38 * math.sin(math.pi * k / 24)) for k in range(25)]
    lantern = [(cx - 6, base - 164), (cx + 6, base - 164), (cx + 6, base - 150), (cx - 6, base - 150)]
    for shape in [body] + towers + [drum, dome, lantern]:
        sk.knock.append(poly(shape))
    sk.wash("limestone", body)
    for t in towers:
        sk.wash("limestone", t)
    sk.wash("limestone", drum)
    sk.wash("shade", [(cx + 10, base - 112), (cx + 31, base - 112), (cx + 31, base - 66), (cx + 12, base - 66)])
    sk.wash("shade", [(cx + 62, base - 84), (cx + 74, base - 84), (cx + 74, base), (cx + 62, base)])
    sk.wash("shade", [(cx + 30, base - 62), (cx + 52, base - 62), (cx + 52, base), (cx + 30, base)])
    sk.wash("lead", dome[6:] + [(cx + 33, base - 112), (cx - 10, base - 112)])
    sk.wash("limestone", lantern)
    sk.outline(body, skip=.1)
    for t in towers:
        sk.outline(t)
        sk.line(t[0][0] - 2, t[0][1], t[1][0] + 2, t[1][1], over=.6 * s, to=sk.heavy)
        for k in range(1, 6):
            sk.dash(t[0][0] + k * 3.6, t[0][1] - 4, 0, 4, to=sk.fine)
        sk.line(t[0][0] - 1, t[0][1] - 4, t[1][0] + 1, t[1][1] - 4, over=.4 * s, to=sk.fine)
        sk.rect(t[0][0] + 7, base - 66, 8, 14, over=.6 * s, to=sk.fine)
    sk.outline(drum, skip=.1)
    for k in range(1, 9):
        sk.line(cx - 31 + k * 62 / 9, base - 110, cx - 31 + k * 62 / 9, base - 68, over=.3 * s, to=sk.fine)
    for wx in (cx - 18, cx, cx + 18):
        sk.wash("glass", [(wx - 3, base - 80), (wx - 3, base - 94), (wx, base - 97), (wx + 3, base - 94), (wx + 3, base - 80)], slip=.4)
    sk.line(cx - 35, base - 112, cx + 35, base - 112, over=1 * s, to=sk.heavy)
    xx = cx - 33
    while xx < cx + 33:
        sk.dash(xx, base - 116, 0, 4, to=sk.fine)
        xx += 3
    sk.ink.append("M" + " ".join(f"{f(x)} {f(y)}" for x, y in dome[::2]))
    for k in (-.75, -.42, 0, .42, .75):
        pts = [(cx + 33 * k * math.cos(b), base - 114 - 38 * math.sin(b)) for b in [j * math.pi / 2 / 6 for j in range(7)]]
        sk.fine.append("M" + " ".join(f"{f(x)} {f(y)}" for x, y in pts))
    sk.outline(lantern)
    sk.line(cx, base - 164, cx, base - 176, over=.4 * s)
    sk.line(cx - 3, base - 172, cx + 3, base - 172, over=.3 * s, to=sk.fine)
    sk.ink.append(f"M{f(cx - 8)} {f(base - 164)}q8 -6 16 0")
    # The front: a portico of three arches, a cornice, a balustrade along the roof.
    sk.line(cx - 72, base - 64, cx + 72, base - 64, over=1.4 * s, to=sk.heavy)
    xx = cx - 46
    while xx < cx + 46:
        sk.dash(xx, base - 70, 0, 5, to=sk.fine)
        xx += 3
    sk.line(cx - 48, base - 70, cx + 48, base - 70, over=.6 * s, to=sk.fine)
    for ax in (cx - 20, cx, cx + 20):
        sk.wash("glass", [(ax - 6, base), (ax - 6, base - 18), (ax, base - 25), (ax + 6, base - 18), (ax + 6, base)], slip=.5)
        sk.ink.append(f"M{f(ax - 6)} {f(base)}V{f(base - 18)}a6 6 0 0 1 12 0V{f(base)}")
    sk.line(cx - 30, base - 30, cx + 30, base - 30, over=.6 * s, to=sk.fine)
    for k in range(-2, 3):
        sk.line(cx + k * 13, base - 64, cx + k * 13, base - 32, over=.3 * s, to=sk.fine)


def sao_vicente(sk, cx, base):
    """São Vicente de Fora: a white front between two bell towers, the long monastery beside it."""
    s = sk.s
    front = [(cx - 40, base - 62), (cx + 40, base - 62), (cx + 40, base), (cx - 40, base)]
    gable = [(cx - 40, base - 62), (cx, base - 74), (cx + 40, base - 62)]
    towers = [[(tx, base - 96), (tx + 18, base - 96), (tx + 18, base), (tx, base)] for tx in (cx - 58, cx + 40)]
    wing = [(cx + 58, base - 44), (cx + 156, base - 44), (cx + 156, base), (cx + 58, base)]
    wing_roof = [(cx + 56, base - 44), (cx + 158, base - 44), (cx + 150, base - 58), (cx + 64, base - 58)]
    for shape in [front, gable, wing, wing_roof] + towers:
        sk.knock.append(poly(shape))
    sk.wash("roof", wing_roof)
    sk.wash("cream", wing)
    sk.wash("violet", [(cx + 58, base - 44), (cx + 156, base - 44), (cx + 156, base - 41), (cx + 58, base - 40)], slip=.4)
    sk.wash("limestone", front)
    sk.wash("limestone", gable)
    for t in towers:
        sk.wash("limestone", t)
        sk.wash("shade", [(t[0][0] + 11, t[0][1]), (t[1][0], t[0][1]), (t[1][0], base), (t[0][0] + 11, base)])
    sk.outline(front, skip=.1)
    sk.outline(gable, closed=False)
    sk.outline(wing, skip=.2)
    sk.outline(wing_roof[:3], closed=False)
    sk.line(*wing_roof[3], *wing_roof[2], to=sk.fine)
    for row_y in (base - 34, base - 18):
        for k in range(9):
            sk.wash("glass", [(cx + 64 + k * 10.5, row_y), (cx + 68 + k * 10.5, row_y), (cx + 68 + k * 10.5, row_y + 7), (cx + 64 + k * 10.5, row_y + 7)], slip=.3)
    for t in towers:
        x0 = t[0][0]
        sk.outline(t, skip=.05)
        sk.line(x0 - 2, base - 96, x0 + 20, base - 96, over=.5 * s, to=sk.heavy)
        sk.wash("glass", [(x0 + 5, base - 74), (x0 + 5, base - 86), (x0 + 9, base - 90), (x0 + 13, base - 86), (x0 + 13, base - 74)], slip=.3)
        sk.ink.append(f"M{f(x0 + 5)} {f(base - 74)}V{f(base - 86)}a4 4 0 0 1 8 0V{f(base - 74)}")
        sk.wash("lead", [(x0 + 1, base - 96), (x0 + 4, base - 103), (x0 + 9, base - 106), (x0 + 14, base - 103), (x0 + 17, base - 96)], slip=.3)
        sk.ink.append(f"M{f(x0 + 1)} {f(base - 96)}q1 -10 8 -10q7 0 8 10")
        sk.line(x0 + 9, base - 106, x0 + 9, base - 114, over=.3 * s, to=sk.fine)
        sk.line(x0, base - 58, x0 + 18, base - 58, over=.4 * s, to=sk.fine)
    for ax in (cx - 22, cx, cx + 22):
        sk.wash("glass", [(ax - 5, base), (ax - 5, base - 14), (ax, base - 19), (ax + 5, base - 14), (ax + 5, base)], slip=.4)
        sk.ink.append(f"M{f(ax - 5)} {f(base)}V{f(base - 14)}a5 5 0 0 1 10 0V{f(base)}")
        sk.rect(ax - 3, base - 46, 6, 10, over=.4 * s, to=sk.fine)
    sk.line(cx - 42, base - 28, cx + 42, base - 28, over=.8 * s, to=sk.fine)
    sk.line(cx - 42, base - 56, cx + 42, base - 56, over=.8 * s, to=sk.fine)
    sk.ink.append(f"M{f(cx - 4)} {f(base - 64)}a4 4 0 1 0 8 0a4 4 0 1 0 -8 0")


def tree(sk, x, base, kind, rng):
    """A tree in a courtyard: a cypress's dark flame, or a round crown, scribbled round."""
    s = sk.s
    if kind == "cypress":
        h, w = rng.uniform(46, 60) * s, rng.uniform(8, 11) * s
        pts = [(x - w * math.sin(math.pi * min(1, u * 1.3)) ** .6, base - h * u) for u in [k / 10 for k in range(11)]]
        out = pts + [(2 * x - px, py) for px, py in pts[::-1]]
        sk.knock.append(poly(out))
        sk.wash("cypress", out)
        sk.hatch(out[len(out) // 2:] + [(x, base)], 2 * s, angle=70)
        sk.fine.append("M" + " ".join(f"{f(px + rng.uniform(-1, 1))} {f(py)}" for px, py in out[::2]))
    else:
        r = rng.uniform(14, 20) * s
        cy = base - r * 1.6
        blob = [(x + math.cos(a) * r * rng.uniform(.82, 1.12), cy + math.sin(a) * r * .8 * rng.uniform(.82, 1.12)) for a in [k * math.tau / 14 for k in range(14)]]
        sk.knock.append(poly(blob + [(x + 2 * s, base), (x - 2 * s, base)]))
        sk.wash("leaf", blob)
        sk.wash("leaf-dark", blob[1:7] + [(x, cy)])
        sk.line(x, base, x - 1 * s, cy + r * .4, over=.3 * s)
        d = []
        for k in range(30):
            a = k * math.tau / 13 + rng.uniform(-.2, .2)
            rr = r * rng.uniform(.75, 1.05)
            d.append((x + math.cos(a) * rr, cy + math.sin(a) * rr * .78))
        sk.fine.append("M" + " ".join(f"{f(px)} {f(py)}" for px, py in d))


# ---------------------------------------------------------------------------------------------------------
# The planes.

def rail(x):
    """The far rail of tram 28's track, climbing to the right."""
    return 548 - .05 * (x - 800)


def far_scene():
    """The far bank, the Tejo, and a sail on it."""
    sk = Sketch(1, s=.5)
    rng = sk.rng
    shore = [(x, 240 + 5 * math.sin(x / 190 + 1) + 3 * math.sin(x / 71) - 4 * math.exp(-((x - 1300) / 160) ** 2)) for x in range(-60, 1661, 20)]
    sk.wash("shore", shore + [(1660, 258), (-60, 258)], slip=1)
    sk.wash("river", [(-60, 252), (1660, 252), (1660, 318), (-60, 318)], slip=0)
    sk.wash("river-deep", [(-60, 272), (400, 266), (900, 276), (1660, 268), (1660, 318), (-60, 318)], slip=2)
    # Below the river, the roofs too far down the hill to draw: a warm wash that the rows stand in.
    sk.wash("haze", [(-60, 312), (1660, 312), (1660, 560), (-60, 560)], slip=0)
    for k in range(0, len(shore) - 1, 2):
        if rng.random() < .7:
            sk.line(*shore[k], *shore[k + 1], over=1, to=sk.fine)
    sk.line(-60, 253, 1660, 254, over=0, wobble=.8, to=sk.fine)
    # Far buildings and port cranes along the south bank, a few marks only.
    for k in range(26):
        bx = rng.uniform(820, 1500)
        sk.dash(bx, 249, 0, -rng.uniform(2, 6), to=sk.fine)
    for cx in (1410, 1446):
        sk.line(cx, 250, cx, 228, over=.2, to=sk.fine)
        sk.line(cx - 4, 230, cx + 14, 228, over=.2, to=sk.fine)
    for k in range(60):
        y = rng.uniform(258, 330)
        x = rng.uniform(-40, 1640)
        sk.dash(x, y, rng.uniform(4, 16), 0, to=sk.fine)
    sk.wash("sail", [(1206, 284), (1216, 256), (1218, 284)], slip=.3)
    sk.line(1216, 254, 1216, 286, over=.3, to=sk.fine)
    sk.line(1200, 286, 1224, 286, over=.4, to=sk.fine)
    return [sk]


def mid_scene():
    """Row on row of roofs going down to the river, São Vicente and the Panteão standing out of them."""
    rng = random.Random(10)
    row_a = Sketch(11, s=.52)
    row(row_a, -60, 1660, lambda x: 352 - 10 * math.exp(-((x - 420) / 280) ** 2) + 7 * math.sin(x / 130 + 1), rng, 0, floors=(2, 4), width=(46, 72), tilt=.72)
    church = Sketch(12, s=.62)
    sao_vicente(church, 0, 0)
    church.place = (540, 404, 1.3)
    pantheon = Sketch(13, s=.7)
    pantheon.place = (760, 440, 1.36)
    church.fade = pantheon.fade = False
    panteao(pantheon, 0, 0)
    row_b = Sketch(14, s=.74)
    row(row_b, -60, 1660, lambda x: 428 + 10 * math.sin(x / 170 + 2.2) - 8 * math.exp(-((x - 420) / 300) ** 2), rng, 1, floors=(2, 4), width=(44, 72), tiles=.12, tilt=.6)
    for tx, kind in ((586, "cypress"), (1010, "round"), (1296, "cypress")):
        tree(row_b, tx, 428 + .008 * (tx - 800), kind, rng)
    return [row_a, church, pantheon, row_b]


def ground_scene():
    """The nearest roofs, the street with its tram rails and wire, and the low wall between."""
    rng = random.Random(20)
    row_c = Sketch(21, s=1.0)
    row(row_c, -60, 1660, lambda x: rail(x) - 30, rng, 2, floors=(3, 4), width=(44, 72), tiles=.16, tilt=.46)
    street = Sketch(22, s=1)
    edge = [(x, rail(x) - 24) for x in (-60, 1660)]
    sk = street
    sk.knock.append(poly([edge[0], edge[1], (1660, 640), (-60, 640)]))
    sk.wash("wall", [(-60, rail(-60) - 32), (1660, rail(1660) - 32), (1660, rail(1660) - 22), (-60, rail(-60) - 22)], slip=.5)
    sk.wash("street", [edge[0], edge[1], (1660, 640), (-60, 640)], slip=.5)
    sk.line(-60, rail(-60) - 32, 1660, rail(1660) - 32, over=0, wobble=1)
    sk.line(-60, rail(-60) - 23, 1660, rail(1660) - 23, over=0, wobble=1, to=sk.fine)
    # Calçada: the cobbles' little arcs, thick by the kerb and thinning out.
    for k in range(260):
        x = rng.uniform(-40, 1640)
        y = rail(x) - 20 + rng.random() ** 1.6 * 46
        sk.fine.append(f"M{f(x)} {f(y)}q1.6 1.4 3.2 0")
    for dy in (0, 7, 15, 22):
        sk.line(-60, rail(-60) + dy, 1660, rail(1660) + dy, over=0, wobble=.4, to=sk.heavy if dy in (0, 15) else sk.fine)
    # The wire, its span wires, and a pole now and then.
    wire = lambda x: rail(x) - 86
    sk.line(-60, wire(-60), 1660, wire(1660), over=0, wobble=1.5, to=sk.fine)
    for px in (180, 1040, 1560):
        sk.line(px, rail(px) - 24, px, wire(px) - 18, over=1)
        sk.line(px, wire(px) - 12, px + 40, wire(px + 40), over=.4, to=sk.fine)
    # Overhead wires slung between the houses.
    for x0, x1, sag in ((120, 520, 10), (600, 980, 14), (1100, 1560, 12)):
        y0, y1 = rail(x0) - 66, rail(x1) - 70
        sk.fine.append(f"M{f(x0)} {f(y0)}Q{f((x0 + x1) / 2)} {f((y0 + y1) / 2 + sag * 2)} {f(x1)} {f(y1)}")
    return [row_c, street]


def bougainvillea(sk, x0, x1, beam, rng):
    """Bougainvillea over the pergola: heavy masses of magenta along the beam, cascades falling from them,
    each laid in two wet washes, the bracts flicked in with the pen round the edges."""
    s = sk.s
    x = x0
    while x < x1:
        drop = rng.random() ** 1.6 * 70 * (1 - abs((x - (x0 + x1) / 2) / (x1 - x0)) * .8)
        cx, cy = x, beam + 10 + drop * .4
        circles = [(cx + rng.uniform(-16, 16), cy + rng.uniform(-10, 8), rng.uniform(8, 15)) for _ in range(5)]
        if drop > 26:
            circles += [(cx + rng.uniform(-10, 10), cy + drop * t, 11 - 4 * t) for t in (.5, 1.0)]
        outline = union_outline(circles, cx, cy, 40)
        sk.knock.append(poly(outline))
        sk.wash("bougainvillea", outline, slip=1.2)
        for _ in range(2):
            lx, ly = cx + rng.uniform(-18, 18), cy + rng.uniform(-6, 14)
            sk.wash("leaf", [(lx - 7, ly), (lx, ly - 5), (lx + 8, ly - 1), (lx + 2, ly + 6)], slip=.8)
        shade = [p for p in outline if p[0] > cx - 4 and p[1] > cy - 2]
        if len(shade) > 2:
            sk.wash("bougainvillea-deep", shade + [(cx, cy)], slip=1)
        for _ in range(3):
            lx, ly = cx + rng.uniform(-16, 16), cy + rng.uniform(-8, 12)
            sk.wash("leaf-dark", [(lx, ly), (lx + 6, ly - 3), (lx + 9, ly + 2), (lx + 3, ly + 5)], slip=.6)
        # Bracts: little three-petalled flicks of the pen, thick round the edge, sparse inside.
        for k, (px, py) in enumerate(outline):
            if rng.random() < .55:
                a = rng.uniform(0, math.tau)
                r = rng.uniform(1.8, 3)
                sk.fine.append(f"M{f(px)} {f(py)}l{f(math.cos(a) * r)} {f(math.sin(a) * r)}l{f(math.cos(a + 2.1) * r)} {f(math.sin(a + 2.1) * r)}Z")
        for _ in range(int(len(circles) * 2.2)):
            px, py = cx + rng.uniform(-14, 14), cy + rng.uniform(-8, drop * .9 + 8)
            a = rng.uniform(0, math.tau)
            sk.fine.append(f"M{f(px)} {f(py)}l{f(math.cos(a) * 2.4)} {f(math.sin(a) * 2.4)}")
        x += rng.uniform(22, 34)
    for _ in range(7):
        tx = rng.uniform(x0, x1)
        ln = rng.uniform(30, 70)
        sk.fine.append(f"M{f(tx)} {f(beam + 6)}q{f(rng.uniform(-10, 10))} {f(ln * .5)} {f(rng.uniform(-14, 14))} {f(ln)}")


def near_scene():
    """The Portas do Sol: a pergola of bougainvillea over a white parapet faced with azulejos on the left,
    an iron railing and a Lisbon lamp on the right."""
    rng = random.Random(30)
    sk = Sketch(31, s=1.2)
    sk.fade = False
    top = 522
    wall = [(-60, top), (500, top), (500, 640), (-60, 640)]
    sk.knock.append(poly(wall))
    sk.wash("white", wall)
    sk.wash("azulejo", [(18, top + 12), (300, top + 12), (300, 640), (18, 640)], slip=.6)
    sk.wash("shade", [(-60, top + 4), (500, top + 4), (500, top + 9), (-60, top + 10)], slip=.4)
    sk.line(-60, top, 504, top, over=0)
    sk.line(-60, top + 5, 504, top + 5, over=0, to=sk.fine)
    sk.line(500, top, 500, 640, over=0)
    sk.rect(18, top + 12, 282, 60, to=sk.fine)
    sk.rect(14, top + 9, 290, 66, to=sk.fine)
    # The pergola: stone posts, a timber beam, and the bougainvillea it carries.
    beam = 300
    for px in (40, 300):
        post = [(px - 8, top), (px + 8, top), (px + 7, beam + 6), (px - 7, beam + 6)]
        sk.knock.append(poly(post))
        sk.wash("white", post)
        sk.wash("shade", [(px + 1, top), (px + 8, top), (px + 7, beam + 6), (px + 1, beam + 6)])
        sk.outline(post, skip=.15)
        sk.hatch([(px + 2, top - 4), (px + 7, top - 4), (px + 6.5, beam + 30), (px + 2, beam + 30)], 2.4)
    beam_pts = [(-60, beam - 4), (390, beam), (390, beam + 9), (-60, beam + 5)]
    sk.knock.append(poly(beam_pts))
    sk.wash("bark", beam_pts)
    sk.outline(beam_pts, skip=.2)
    for k in range(12):
        sk.line(-40 + k * 36, beam - 2 + k * .3, -26 + k * 36, beam - 16 + k * .3, over=.6, to=sk.fine)
    bougainvillea(sk, -50, 380, beam, rng)
    # The railing on the right: two rails, uprights, a ring in every other bay.
    rail_top = 520
    sk.knock.append(poly([(1180, rail_top - 2), (1660, rail_top - 8), (1660, 640), (1180, 640)]))
    sk.wash("white", [(1180, rail_top + 24), (1660, rail_top + 18), (1660, 640), (1180, 640)])
    sk.line(1180, rail_top, 1660, rail_top - 6, over=0, to=sk.heavy)
    sk.line(1180, rail_top + 4, 1660, rail_top - 2, over=0, to=sk.fine)
    sk.line(1180, rail_top + 22, 1660, rail_top + 16, over=0)
    x, bay = 1186, 0
    while x < 1660:
        y0 = rail_top - (x - 1180) * 6 / 480
        sk.line(x, y0 + 4, x, y0 + 22, over=.3, to=sk.fine)
        if bay % 3 == 1:
            sk.fine.append(f"M{f(x + 1)} {f(y0 + 13)}a5 5 0 1 0 10 0a5 5 0 1 0 -10 0")
        x += 12
        bay += 1
    lx = 1452
    for d in (f"M{lx} 600V384", f"M{lx - 9} 600h18", f"M{lx - 5} 560h10", f"M{lx - 16} 384h32", f"M{lx - 13} 384l-3-28h32l-3 28",
              f"M{lx - 18} 356h36", f"M{lx} 356v-10", f"M{lx - 8} 346h16", f"M{lx - 12} 372h24", f"M{lx} 420q30-6 44-26"):
        sk.heavy.append(d)
    sk.wash("lamp", [(lx - 13, 384), (lx - 16, 356), (lx + 16, 356), (lx + 13, 384)], slip=.4)
    sk.knock.append(poly([(lx - 3, 600), (lx - 3, 384), (lx + 3, 384), (lx + 3, 600)]))
    sk.knock.append(poly([(lx - 18, 384), (lx - 18, 344), (lx + 18, 344), (lx + 18, 384)]))
    return [sk]


def render(sk):
    """One stratum: bare paper where it stands, its washes, then its ink in three weights."""
    k = sk.place[2] if sk.place else 1
    w_ink, w_fine, w_heavy = (f((.5 + .55 * sk.s) / k), f((.3 + .3 * sk.s) / k), f((.9 + .7 * sk.s) / k))
    washes = "".join(f'<path class="al-w" d="{"".join(paths)}" style="fill:var(--al-{colour})"/>' for colour, paths in sk.washes.items())
    body = (f'<path d="{"".join(sk.knock)}" style="fill:var(--al-paper)"/>'
            f'<g filter="url(#al-wash)"{' mask="url(#al-wash-edge)"' if sk.fade else ""}>{washes}</g>'
            f'<g filter="url(#al-ink)" fill="none" stroke-linecap="round" style="stroke:var(--al-ink)">'
            f'<path d="{"".join(sk.fine)}" stroke-width="{w_fine}" opacity=".8"/>'
            f'<path d="{"".join(sk.ink)}" stroke-width="{w_ink}"/>'
            f'<path d="{"".join(sk.heavy)}" stroke-width="{w_heavy}"/></g>')
    if sk.place:
        x, y, k = sk.place
        return f'<g transform="translate({f(x)} {f(y)}) scale({k})">{body}</g>'
    return body


def window_lights(windows, seed, share=1.0):
    """Night: every window can glow. Most switch on one by one as the footer arrives, each at its own
    moment; the rest stay dark until someone moves through the footer's links."""
    rng = random.Random(seed)
    out = []
    for wx, wy, ww, wh in windows:
        if rng.random() > share:
            continue
        warm = rng.choice(["#FFD27A", "#FFC86A", "#FFE3A0", "#F9B860"])
        box = f'x="{f(wx + .5)}" y="{f(wy + .5)}" width="{f(ww - 1)}" height="{f(wh - 1)}" fill="{warm}" stroke="{warm}"'
        if rng.random() < .3:
            out.append(f'<rect class="al-window al-window--sleeper" {box}/>')
        else:
            out.append(f'<rect class="al-window" {box} style="--on:{rng.uniform(4, 80):.0f}%"/>')
    return "".join(out)


def laundry(rng, count=4):
    """Washing strung across the street from wall to wall. Each piece hangs from its own peg and swings."""
    out_lines, out_cloth = [], []
    for k in range(count):
        x0 = rng.uniform(140, 1440)
        x1 = x0 + rng.uniform(50, 80)
        y0 = rail(x0) - rng.uniform(60, 74)
        y1 = rail(x1) - rng.uniform(60, 74)
        sag = 6
        out_lines.append(f"M{f(x0)} {f(y0)}Q{f((x0 + x1) / 2)} {f((y0 + y1) / 2 + sag * 2)} {f(x1)} {f(y1)}")
        x = x0 + 6
        while x < x1 - 8:
            t = (x - x0) / (x1 - x0)
            y = (1 - t) ** 2 * y0 + 2 * t * (1 - t) * ((y0 + y1) / 2 + sag * 2) + t * t * y1
            w, h = rng.uniform(7, 13), rng.uniform(8, 15)
            shape = rng.choice(["shirt", "sheet", "sock"])
            if shape == "shirt":
                d = f"M{f(x)} {f(y)}h{f(w)}l3 4-3 1v{f(h - 4)}h{f(-w)}v{f(-(h - 4))}l-3-1Z"
            elif shape == "sock":
                d = f"M{f(x)} {f(y)}h4v{f(h * .6)}l3 3h-5l-2-3Z"
                w = 5
            else:
                d = f"M{f(x)} {f(y)}h{f(w)}v{f(h)}h{f(-w)}Z"
            colour = rng.choice(["a", "b", "c", "d"])
            out_cloth.append(f'<g class="al-cloth" style="transform-origin:{f(x + w / 2)}px {f(y)}px; --cloth-d:{-rng.uniform(0, 2.5):.1f}s">'
                             f'<path d="{d}" style="fill:var(--al-cloth-{colour}); stroke:var(--al-ink)" stroke-width=".6"/></g>')
            x += w + rng.uniform(3, 7)
    return (f'<path d="{"".join(out_lines)}" fill="none" stroke-width=".7" style="stroke:var(--al-ink)"/>' + "".join(out_cloth))


def page_stars():
    rng = random.Random(12)
    layers = []
    for _ in range(26):
        x, y = rng.uniform(2, 98), rng.uniform(1, 70)
        r = rng.choice([0.9, 1.1, 1.4])
        a = rng.uniform(0.35, 0.75)
        layers.append(f"radial-gradient({r}px {r}px at {x:.1f}% {y:.1f}%, rgb(255 252 240 / {a:.2f}) 70%, transparent)")
    return ",\n      ".join(layers)


# Cold-pressed watercolour paper: a soft relief, lit from the upper left.
TEX_PAPER = tile(
    "<feTurbulence type='fractalNoise' baseFrequency='.08' numOctaves='4' seed='3' stitchTiles='stitch'/>"
    "<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.8 0 0 0 -.4'/>"
    "<feDiffuseLighting surfaceScale='2.2' diffuseConstant='.85' lighting-color='#fff'>"
    "<feDistantLight azimuth='225' elevation='52'/></feDiffuseLighting>", 300, 300)

# The same paper with half the relief, for the page above where the words sit.
TEX_PAPER_PAGE = tile(
    "<feTurbulence type='fractalNoise' baseFrequency='.08' numOctaves='4' seed='3' stitchTiles='stitch'/>"
    "<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.8 0 0 0 -.4'/>"
    "<feDiffuseLighting surfaceScale='1' diffuseConstant='.85' lighting-color='#fff'>"
    "<feDistantLight azimuth='225' elevation='60'/></feDiffuseLighting>"
    "<feComponentTransfer><feFuncA type='linear' slope='.45'/></feComponentTransfer>", 300, 300)


def sky_wash():
    """A loose cerulean wash across the top of the page, as if the sketcher had laid in the sky first.
    Its lower edge wanders and a few clouds are left as bare paper."""
    from urllib.parse import quote
    rng = random.Random(6)
    edge = []
    x = 1680
    while x > -80:
        edge.append((x, rng.uniform(120, 190)))
        x -= rng.uniform(140, 240)
    edge.append((-80, 150))
    band = "M-80 -40L1680 -40L" + smooth(edge)[1:] + "Z"
    clouds = "".join(
        f"<ellipse cx='{f(cx)}' cy='{f(cy)}' rx='{f(rx)}' ry='{f(ry)}'/>"
        for cx, cy, rx, ry in ((260, 70, 120, 26), (980, 50, 150, 24), (1380, 96, 110, 22), (640, 120, 80, 16))
    )
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 420' width='1600' height='420'>"
        "<defs>"
        "<filter id='w' x='-5%' y='-10%' width='110%' height='130%' color-interpolation-filters='sRGB'>"
        "<feTurbulence type='fractalNoise' baseFrequency='.012' numOctaves='3' seed='4' result='n'/>"
        "<feDisplacementMap in='SourceGraphic' in2='n' scale='38' xChannelSelector='R' yChannelSelector='G' result='wet'/>"
        "<feMorphology in='wet' operator='erode' radius='2.5' result='inner'/>"
        "<feComposite in='wet' in2='inner' operator='out' result='edge'/>"
        "<feTurbulence type='fractalNoise' baseFrequency='.008' numOctaves='2' seed='8' result='b'/>"
        "<feColorMatrix in='b' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.7 -.25' result='ba'/>"
        "<feComposite in='wet' in2='ba' operator='in' result='body'/>"
        "<feMerge><feMergeNode in='body'/><feMergeNode in='edge'/></feMerge></filter>"
        "<mask id='m'><rect width='1600' height='420' fill='#fff'/><g fill='#000' filter='url(#w)'>" + clouds + "</g></mask>"
        "</defs>"
        f"<path d='{band}' fill='rgb(118 172 220 / .5)' filter='url(#w)' mask='url(#m)'/>"
        "</svg>"
    )
    return "data:image/svg+xml," + quote(svg, safe="'/:=. ")


def stars():
    """White gouache dots, flicked on with a brush."""
    rng = random.Random(70)
    out, placed = [], []
    while len(placed) < 34:
        x, y = rng.uniform(10, 1590), rng.uniform(10, 480)
        if any(math.hypot(x - px, y - py) < 80 for px, py in placed):
            continue
        placed.append((x, y))
        rr = rng.choice([0.8, 1, 1.2, 1.5])
        out.append(f'<circle class="al-star" cx="{f(x)}" cy="{f(y)}" r="{f(rr)}" style="--d:{rng.uniform(0, 5):.1f}s"/>')
    return "".join(out)


def placeholders():
    far, mid, ground, near = far_scene(), mid_scene(), ground_scene(), near_scene()
    plane = lambda sketches: "".join(render(sk) for sk in sketches)
    return {
        "FAR_ART": plane(far),
        "MID_ART": plane(mid),
        "GROUND_ART": plane(ground),
        "NEAR_ART": plane(near),
        "MID_WINDOWS": window_lights(mid[0].windows, 3, .3) + window_lights(mid[3].windows, 4, .75),
        "GROUND_WINDOWS": window_lights(ground[0].windows, 5),
        "LAUNDRY": laundry(random.Random(8)),
        "PAGE_STARS": page_stars(),
        "TEX_PAPER": TEX_PAPER,
        "TEX_PAPER_PAGE": TEX_PAPER_PAGE,
        "STARS": stars(),
        "TEX_SKYWASH": sky_wash(),
        "RAIL_Y": f(rail(770)),
    }


# Scene picker glyph, 16 x 16: tram 28 under its wire.
GLYPH = ('<path d="M2 2.4h12"/><path d="M8 2.4L6.4 5.6"/><rect x="2.6" y="5.6" width="10.8" height="6.6" rx="1.6"/>'
         '<path d="M2.6 8.6h10.8"/><circle cx="5.4" cy="13.6" r=".9"/><circle cx="10.6" cy="13.6" r=".9"/>')
