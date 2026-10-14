"""Li River: blue-green landscape on silk, in ink and mineral pigment.

Karst towers are drawn the way a painter builds them: an ochre underlayer that climbs into
malachite and then azurite, a contour laid in with a pressured brush, lotus-leaf texture strokes
that run down from each summit, and moss dots along the ridges. Bases dissolve into mist.
"""
import math
import random

from common import catmull, ellipse, f, poly, pressure, resample, ribbon, smooth, tile

WATER = 458  # The river's far edge, in drawing units.


def lerp(a, b, t):
    return a + (b - a) * t


class Peak:
    """A karst tower. t runs from the base (0) to the summit (1); side is -1 (left) or 1 (right)."""

    KINDS = {
        # (p range, q range): p keeps the flanks steep for longer, q rounds the summit.
        "tower": ((2.6, 3.8), (0.34, 0.46)),
        "dome": ((1.8, 2.6), (0.45, 0.6)),
        "cone": ((1.35, 1.75), (0.6, 0.72)),
    }

    def __init__(self, cx, base, w, h, seed, kind=None):
        rng = random.Random(seed)
        self.rng = rng
        self.cx, self.base, self.w, self.h = cx, base, w, h
        kind = kind or rng.choice(("tower", "tower", "dome", "dome", "cone"))
        (p0, p1), (q0, q1) = self.KINDS[kind]
        self.p = rng.uniform(p0, p1)
        self.q = rng.uniform(q0, q1)
        self.lean = rng.uniform(-0.14, 0.14)
        self.wobble = {
            side: [(rng.uniform(0, 6.3), rng.uniform(1.5, 4.5), rng.uniform(0.02, 0.07)) for _ in range(2)]
            for side in (-1, 1)
        }
        # Ledges and shoulders, where the limestone breaks away.
        self.ledges = {side: [] for side in (-1, 1)}
        for _ in range(rng.randint(1, 3)):
            self.ledges[rng.choice((-1, 1))].append((rng.uniform(0.15, 0.75), rng.uniform(0.07, 0.2), rng.uniform(0.04, 0.09)))

    def hw(self, t, side):
        t = min(max(t, 0.0), 1.0)
        shape = (1 - t ** self.p) ** self.q
        calm = (1 - t) ** 0.6
        wob = sum(a * math.sin(t * k * math.pi + ph) for ph, k, a in self.wobble[side]) * calm
        ledge = sum(a * math.exp(-((t - t0) / s) ** 2) for t0, a, s in self.ledges[side]) * calm
        return self.w / 2 * shape * (1 + wob + ledge)

    def at(self, t, side, frac=1.0):
        center = self.cx + self.lean * self.h * t * (2 - t)
        return (center + side * self.hw(t, side) * frac, self.base - self.h * t)

    def flank(self, side, frac=1.0, t0=0.0, t1=1.0, n=40):
        return [self.at(lerp(t0, t1, i / (n - 1)), side, frac) for i in range(n)]

    def outline(self):
        return self.flank(-1) + self.flank(1)[::-1][1:]

    def body(self, sink=46):
        if getattr(self, "facets", None):
            pts = self.facets
            (lx, ly), (rx, ry) = pts[0], pts[-1]
            return poly(pts + [(rx, ry + sink), (lx, ly + sink)])
        pts = self.outline()[::2] + [self.outline()[-1]]
        (lx, ly), (rx, ry) = pts[0], pts[-1]
        return smooth(pts) + f"L{f(rx)} {f(ry + sink)}L{f(lx)} {f(ly + sink)}Z"

    def facet(self, n=7, jitter=0.05):
        """Break the outline into straight facets, the way rock is cut rather than worn."""
        rng = random.Random(self.cx * 7 + self.h)
        pts = []
        for side in (-1, 1):
            ts = [i / n for i in range(n + 1)]
            flank = [self.at(t, side) for t in ts]
            flank = [(x + rng.uniform(-1, 1) * jitter * self.w, y + rng.uniform(-1, 1) * jitter * self.h * 0.5) for x, y in flank]
            pts += flank if side == -1 else flank[::-1][1:]
        self.facets = pts
        return self

    def outline_points(self):
        return self.facets if getattr(self, "facets", None) else self.outline()

    def band(self, side, frac_out, frac_in, t0=0.0, t1=0.985):
        # Blurred afterwards, so a dozen points a side is plenty.
        outer = self.flank(side, frac_out, t0, t1, 12)
        inner = self.flank(side, frac_in, t0, t1, 12)
        return poly(outer + inner[::-1])


def ink_contour(pk, s, rng):
    """The silhouette in one or two pressured strokes, heavier on the shadowed right flank."""
    out = []
    line = resample(pk.facets, 3.6) if getattr(pk, "facets", None) else resample(catmull(pk.outline()[::3], 5), 3.6)
    n = len(line)
    # Begin and end a little above the base, where the mist takes over.
    a = int(n * rng.uniform(0.04, 0.12))
    b = int(n * rng.uniform(0.88, 0.96))
    cuts = [a, b]
    if rng.random() < 0.6:
        c = int(n * rng.uniform(0.25, 0.75))
        cuts = [a, c, c + rng.randint(1, 3), b]
    for i in range(0, len(cuts), 2):
        seg = line[cuts[i]:cuts[i + 1]]
        if len(seg) < 3:
            continue
        p = pressure(rng, 0.45, 1.0)

        def width(u, seg=seg, p=p):
            x = seg[min(len(seg) - 1, int(u * (len(seg) - 1)))][0]
            heavy = 0.7 + 0.6 * ((x - pk.cx) / (pk.w / 2) + 1) / 2
            return 2.2 * s * p(u) * heavy
        out.append(ribbon(seg, width))
    return "".join(out)


def lotus_veins(pk, s, rng, count):
    """Lotus-leaf texture strokes: lines that leave the summit and run down the flanks."""
    out = []
    right = sorted(rng.uniform(0.18, 0.86) for _ in range(count))
    left = sorted(rng.uniform(0.45, 0.85) for _ in range(max(1, count // 2)))
    for side, fracs in ((1, right), (-1, left)):
        for frac in fracs:
            t1 = rng.uniform(0.8, 0.95)
            t0 = rng.uniform(0.1, 0.42) if side == 1 else rng.uniform(0.3, 0.6)
            seg = resample(catmull(pk.flank(side, frac, t0, t1, 10)[::-1], 5), 4.2)
            p = pressure(rng, 0.3, 1.0, swell=(0.08, 0.5))
            w = (1.5 if side == 1 else 1.1) * s
            out.append(ribbon(seg, lambda u, p=p, w=w: w * p(u)))
    return "".join(out)


def cun_strokes(pk, s, rng, density):
    """Short dry strokes between the veins, following the fall of the slope. Returned as centrelines,
    drawn with a round-capped stroke: at this size a taper would not show."""
    out = []
    count = int(density * pk.w * pk.h / 1900)
    for _ in range(count):
        side = 1 if rng.random() < 0.75 else -1
        t = rng.uniform(0.12, 0.8)
        frac = rng.uniform(0.4, 0.95) if side == 1 else rng.uniform(0.6, 0.94)
        length = rng.uniform(0.05, 0.12)
        (x0, y0), (x1, y1), (x2, y2) = pk.flank(side, frac, max(0.02, t - length), t, 3)[::-1]
        out.append(f"M{f(x0)} {f(y0)}q{f(x1 - x0 + rng.uniform(-0.6, 0.6))} {f(y1 - y0)} {f(x2 - x0)} {f(y2 - y0)}")
    return "".join(out)


def moss(pk, s, rng, amount):
    """Moss dots: small flattened dabs clustered on the summit and along the ridges."""
    out = []
    clusters = int(amount * (3 + pk.h / 45))
    for _ in range(clusters):
        side = rng.choice((-1, 1))
        t = rng.uniform(0.6, 0.99) if rng.random() < 0.7 else rng.uniform(0.25, 0.6)
        x, y = pk.at(t, side, rng.uniform(0.82, 0.98))
        for _ in range(rng.randint(2, 4)):
            out.append(f"M{f(x + rng.uniform(-4, 4) * s)} {f(y + rng.uniform(-2.5, 2.5) * s)}h{f(rng.uniform(0.4, 2.2) * s)}")
    return "".join(out)


def tree(x, y, s, rng, kind):
    """A small summit tree in ink: a leaning trunk and a crown of dabs."""
    out = []
    h = rng.uniform(9, 15) * s
    lean = rng.uniform(-2, 2) * s
    trunk = [(x, y + 2 * s), (x + lean * 0.4, y - h * 0.5), (x + lean, y - h)]
    out.append(ribbon(resample(catmull(trunk, 5), 1.5), lambda u: 1.3 * s * (1 - 0.6 * u)))
    if kind == "pine":
        for k in range(rng.randint(3, 4)):
            ty = y - h * (0.35 + 0.22 * k)
            span = (7 - 1.4 * k) * s
            out.append(ribbon([(x + lean * 0.5 - span, ty + 0.6 * s), (x + lean * 0.6, ty - 1.4 * s), (x + lean * 0.7 + span, ty + 0.6 * s)],
                              lambda u: 2.4 * s * math.sin(math.pi * u) + 0.3))
    else:
        for _ in range(rng.randint(7, 11)):
            a = rng.uniform(0, math.tau)
            r = rng.uniform(0, 5) * s
            out.append(ellipse(x + lean + math.cos(a) * r, y - h + math.sin(a) * r * 0.7, 1.9 * s, 1.2 * s))
    return "".join(out)


def peak_layer(name, specs, s, veins=4, density=1.0, moss_amount=1.0, trees=0, facets=0):
    """One plane of towers. Each tower is painted whole before the next, so nearer ones cover farther ones."""
    defs, art = [], []
    for i, spec in enumerate(specs):
        pk = Peak(*spec)
        if facets:
            pk.facet(facets)
        rng = random.Random(spec[4] * 31 + 7)
        pid = f"lj-{name}-{i}"
        defs.append(f'<path id="{pid}" d="{pk.body()}"/><clipPath id="{pid}-c"><use href="#{pid}"/></clipPath>')
        shade = pk.band(1, 1.02, 0.56) + pk.band(1, 1.02, 0.86, 0.0, 0.7)
        light = pk.band(-1, 0.95, 0.72, 0.1, 0.9)
        ink = ink_contour(pk, s, rng)
        texture = lotus_veins(pk, s, rng, veins) if veins else ""
        dry = cun_strokes(pk, s, rng, density) if density else ""
        dots = moss(pk, s, rng, moss_amount) if moss_amount else ""
        crown = ""
        for k in range(trees if pk.h > 150 else 0):
            t = rng.uniform(0.9, 0.99) if k == 0 else rng.uniform(0.62, 0.86)
            x, y = pk.at(t, rng.choice((-1, 1)), rng.uniform(0.3, 0.8))
            crown += tree(x, y + 1.5 * s, s, rng, rng.choice(("pine", "leaf")))
        art.append(
            f'<g><use href="#{pid}" style="fill:var(--lj-{name}-fill)"/>'
            f'<g clip-path="url(#{pid}-c)"><g filter="url(#lj-wash)">'
            f'<path d="{shade}" style="fill:var(--lj-{name}-shade)"/>'
            f'<path d="{light}" style="fill:var(--lj-{name}-glow)"/></g>'
            + (f'<path d="{texture}" style="fill:var(--lj-{name}-vein)"/>' if texture else "")
            + (f'<path d="{dry}" fill="none" style="stroke:var(--lj-{name}-vein)" stroke-width="{f(1.05 * s)}" stroke-linecap="round"/>' if dry else "")
            + f'</g><path d="{ink}{crown}" style="fill:var(--lj-{name}-ink)"/>'
            + (f'<path d="{dots}" fill="none" style="stroke:var(--lj-{name}-moss)" stroke-width="{f(2.3 * s)}" stroke-linecap="round"/>' if dots else "")
            + '</g>'
        )
    return "".join(defs), "".join(art)


# Plane by plane, back to front: (centre x, base y, width, height, seed[, kind]). Towers stand in
# overlapping clusters with open water between them, the tallest at the back of each cluster.
FAR = [(40, 430, 58, 80, 1), (96, 432, 50, 62, 2), (300, 430, 60, 110, 3), (350, 432, 46, 70, 4),
       (500, 430, 64, 128, 5), (548, 432, 50, 84, 6), (466, 433, 44, 60, 7),
       (690, 430, 56, 96, 8), (740, 432, 44, 64, 9), (850, 430, 66, 136, 10), (904, 433, 50, 80, 11),
       (812, 433, 42, 58, 12), (1060, 430, 60, 112, 13), (1112, 432, 48, 72, 14), (1180, 430, 52, 90, 15),
       (1290, 430, 58, 104, 16), (1340, 432, 46, 66, 17), (1420, 430, 52, 82, 18), (1530, 430, 60, 100, 19),
       (1590, 432, 50, 70, 20), (1660, 430, 56, 92, 51)]
MID = [(48, 454, 88, 200, 21, "tower"),
       (352, 452, 72, 206, 22, "tower"), (296, 454, 84, 150, 23, "dome"), (414, 455, 70, 128, 24, "dome"),
       (462, 456, 50, 88, 25, "cone"),
       (664, 452, 86, 176, 26, "tower"), (606, 454, 66, 112, 27, "dome"), (726, 455, 64, 128, 28, "cone"),
       (782, 456, 52, 84, 29, "dome"),
       (996, 452, 92, 196, 30, "tower"), (936, 455, 62, 104, 31, "cone"), (1060, 454, 70, 140, 32, "dome"),
       (1112, 456, 50, 92, 33, "dome"),
       (1226, 453, 78, 158, 34, "tower"), (1286, 456, 58, 100, 35, "cone"),
       (1452, 452, 86, 214, 36, "tower"), (1560, 454, 70, 150, 37, "dome")]
HILLS = [(-70, 470, 130, 236, 41, "tower"), (24, 470, 150, 272, 42, "tower"), (138, 470, 106, 206, 43, "dome"),
         (218, 470, 84, 136, 44, "cone"),
         (1322, 470, 76, 124, 45, "cone"), (1404, 470, 108, 196, 46, "dome"), (1508, 470, 150, 282, 47, "tower"),
         (1626, 470, 130, 232, 48, "tower")]


def peaks():
    far_defs, far = peak_layer("far", FAR, 0.55, veins=0, density=0, moss_amount=0.35)
    mid_defs, mid = peak_layer("mid", MID, 0.8, veins=3, density=0.6, moss_amount=0.8)
    hill_defs, hills = peak_layer("hill", HILLS, 1.15, veins=5, density=1.0, moss_amount=1.1, trees=3)
    return {
        "PEAK_DEFS": far_defs + mid_defs + hill_defs,
        "FAR_PEAKS": far,
        "MID_PEAKS": mid,
        "HILL_PEAKS": hills,
    }


def waves():
    """Net-pattern water: rows of fine sine strokes, each row half a wave out of step with the last,
    so together they knot into a mesh. Rows open up and thicken toward the viewer."""
    rng = random.Random(5)
    bands = {"far": [], "mid": [], "near": []}
    y, row = WATER + 3.5, 0
    while y < 612:
        t = (y - WATER) / (612 - WATER)
        lam = 16 + 52 * t ** 1.3          # wavelength
        amp = 0.7 + 2.3 * t ** 1.2         # height of each crest
        phase = (row % 2) * lam / 2 + rng.uniform(-1.5, 1.5)
        x = -80 - phase
        d = f"M{f(x)} {f(y)}q{f(lam / 4)} {f(-2 * amp)} {f(lam / 2)} 0"
        x += lam / 2
        drift = 0.0
        parts = []
        while x < 1700:
            # The row wanders a little, as a hand would over a long stroke.
            dy = rng.uniform(-0.25, 0.25) - drift * 0.15
            drift += dy
            parts.append(f"t{f(lam / 2)} {f(dy)}")
            x += lam / 2
        d += "".join(parts)
        bands["far" if t < 0.3 else "mid" if t < 0.62 else "near"].append(d)
        y += 3.2 + 7.5 * t ** 1.1
        row += 1
    return {key: "".join(rows) for key, rows in bands.items()}


def raft():
    """A bamboo raft seen from a little above: seven poles bound together, the bow heated and bent upward.
    Local units: the bow tip at x = 0, the stern at x = 262, the waterline at y = 0."""
    poles = 7

    def centre(x):
        rise = max(0.0, (52 - x) / 52)
        return -3.2 - 25 * rise ** 2.1 + 0.8 * math.sin(x / 40)

    def spread(x):
        return 0.35 + 0.65 * min(1.0, x / 52)

    def pole(i, x):
        return centre(x) - 8.5 + i * 2.15 * spread(x)

    xs = [0.5 + 2.5 * k for k in range(105)]
    top = [(x, pole(0, x) - 1.1) for x in xs]
    bottom = [(x, pole(poles - 1, x) + 5.2 * spread(x)) for x in xs]
    deck = poly(top + bottom[::-1])
    # The near pole shows its rounded side; the rest show as lanes across the deck.
    side = poly([(x, pole(poles - 1, x) + 0.6) for x in xs] + [(x, pole(poles - 1, x) + 5.2 * spread(x)) for x in xs][::-1])
    seams = "".join(poly([(x, pole(i, x) + 1.05) for x in xs[1:]], closed=False) for i in range(poles - 1))
    rng = random.Random(12)
    nodes = []
    for i in range(poles):
        x = rng.uniform(14, 30)
        while x < 258:
            y = pole(i, x)
            h = 2.1 * spread(x) if i < poles - 1 else 5.6 * spread(x)
            nodes.append(f"M{f(x)} {f(y + (0.1 if i < poles - 1 else 0.6))}l{f(-0.4)} {f(h)}")
            x += rng.uniform(26, 38)
    # Rattan bindings across all the poles.
    ties = "".join(
        f"M{f(x)} {f(pole(0, x) - 1)}" + "".join(f"L{f(x + 0.6 * k)} {f(pole(k, x) + (5 if k == poles - 1 else 1))}" for k in range(poles))
        for x in (60, 136, 214)
    )
    return {
        "RAFT_DECK": deck,
        "RAFT_SIDE": side,
        "RAFT_SEAMS": seams,
        "RAFT_NODES": "".join(nodes),
        "RAFT_TIES": ties,
    }


def straw_cape():
    """The fisherman's straw rain cape: a bell from neck to knee, laid in three tiers,
    each ending in a fringe of straw ends."""
    rng = random.Random(3)

    def edge(y, side):
        # The bell's outline: narrow at the neck, rounding over the shoulders, flaring to the hem.
        u = min(max((y + 67) / 44, 0.0), 1.0)
        if side < 0:
            return -5 - 16.5 * u ** 0.62
        return 4 + 13.5 * u ** 0.7

    tiers = [(-67.5, -51), (-57, -38), (-44, -23.5)]
    fills, strokes = [], []
    for top, hem in tiers:
        pts = []
        # Upper edge, slightly arched across the back.
        for k in range(7):
            u = k / 6
            x = lerp(edge(top, -1), edge(top, 1), u)
            pts.append((x, top - 1.6 * math.sin(math.pi * u)))
        # Down the back edge.
        for k in range(1, 5):
            y = lerp(top, hem, k / 4)
            pts.append((edge(y, 1) + 0.4, y))
        # The fringe: straw ends of uneven length, right to left.
        x_back, x_front = edge(hem, 1) + 0.6, edge(hem, -1) - 0.6
        m = 15
        for k in range(m + 1):
            x = lerp(x_back, x_front, k / m)
            pts.append((x, hem + (rng.uniform(2.2, 4.6) if k % 2 else rng.uniform(-0.8, 0.4))))
        # Up the front edge.
        for k in range(1, 4):
            y = lerp(hem, top, k / 4)
            pts.append((edge(y, -1) - 0.4, y))
        fills.append(poly(pts))
        # Straw lines that follow the flare.
        for _ in range(18):
            u = rng.uniform(0.04, 0.96)
            ya, yb = top + rng.uniform(1.5, 4), hem + rng.uniform(-2, 2.5)
            xa = lerp(edge(ya, -1), edge(ya, 1), u)
            xb = lerp(edge(yb, -1), edge(yb, 1), u)
            strokes.append(f"M{f(xa)} {f(ya)}Q{f((xa + xb) / 2 + rng.uniform(-0.8, 0.8))} {f((ya + yb) / 2)} {f(xb)} {f(yb)}")
    return {"CAPE_TIERS": "".join(fills), "CAPE_STRAW": "".join(strokes)}


def pine():
    """An old pine on the bank, painted the classical way: a gnarled trunk scaled with open ink rings,
    antler-like limbs, and tiers of needles laid as fans of short strokes over a soft wash."""
    rng = random.Random(8)
    trunk = resample(catmull([(70, 508), (64, 478), (78, 448), (74, 422), (96, 398), (136, 380), (186, 372), (228, 374)], 8), 3)
    p = pressure(rng, 0.9, 1.0, swell=(0.01, 0.04))
    bark_w = lambda u: (21 - 12 * u) * p(u)
    body = ribbon(trunk, bark_w)
    n = len(trunk)

    def offset(i, k):
        x, y = trunk[i]
        ax, ay = trunk[max(0, i - 1)]
        bx, by = trunk[min(n - 1, i + 1)]
        tx, ty = bx - ax, by - ay
        ln = math.hypot(tx, ty) or 1
        w = bark_w(i / (n - 1)) / 2 * k
        return (x - ty / ln * w, y + tx / ln * w)

    edges = []
    for side, weight in ((-1, 1.6), (1, 2.8)):
        line = [offset(i, side) for i in range(n)]
        q = pressure(rng, 0.45, 1.0)
        cut = rng.randint(n // 3, 2 * n // 3)
        for seg in (line[:cut], line[cut + 2:]):
            if len(seg) > 2:
                edges.append(ribbon(seg, lambda u, q=q, weight=weight: weight * q(u)))
    scales = []
    for i in range(2, n - 3, 2):
        u = i / (n - 1)
        for _ in range(2):
            x, y = offset(i, rng.uniform(-0.6, 0.6))
            r = (21 - 12 * u) * rng.uniform(0.11, 0.17)
            a0 = rng.uniform(0, math.tau)
            arc = [(x + math.cos(a0 + t) * r, y + math.sin(a0 + t) * r * 0.7) for t in [j * 0.5 for j in range(10)]]
            scales.append(ribbon(arc, lambda v: 0.9 * math.sin(math.pi * v) + 0.2))
    # Stout limbs, each ending in a tier of needles: (start, path, tier centre, tier span).
    limbs = [
        ((78, 448), [(112, 434), (140, 430)], (150, 426), 58),
        ((96, 398), [(90, 372), (100, 352)], (104, 346), 62),
        ((136, 380), [(156, 364), (166, 358)], (172, 354), 46),
        ((186, 372), [(206, 352), (232, 342)], (242, 338), 66),
        ((206, 372), [(250, 378), (298, 382)], (308, 380), 60),
    ]
    branches, fans, washes = [], [], []
    for start, rest, (tx, ty), span in limbs:
        line = resample(catmull([start] + rest, 6), 2.4)
        branches.append(ribbon(line, lambda u: 7 * (1 - 0.55 * u)))
        for _ in range(4):
            washes.append(ellipse(tx + rng.uniform(-span * 0.3, span * 0.3), ty + rng.uniform(-4, 3), span * rng.uniform(0.3, 0.45), rng.uniform(7, 10)))
        for row, dy in enumerate((2, -4)):
            count = int(span / (7 if row == 0 else 9))
            for k in range(count):
                cx = tx - span / 2 + span * (k + 0.5) / count + rng.uniform(-3, 3)
                cy = ty + dy + rng.uniform(-2, 2)
                r = rng.uniform(8, 11.5)
                tilt = rng.uniform(-0.2, 0.2)
                for j in range(12):
                    a = math.pi * (1.02 + 0.96 * j / 11) + tilt
                    fans.append(f"M{f(cx)} {f(cy)}l{f(math.cos(a) * r)} {f(math.sin(a) * r * 0.7)}")
    return {
        "PINE_TRUNK": body,
        "PINE_EDGES": "".join(edges),
        "PINE_SCALES": "".join(scales),
        "PINE_BRANCHES": "".join(branches),
        "PINE_PADS": "".join(washes),
        "PINE_NEEDLES": "".join(fans),
    }


def reeds(specs):
    """Reed clumps: long blades bending downwind, and soft plumes that nod on top."""
    out = []
    rng = random.Random(len(specs) * 5)
    for bx, by, scale, n, seed in specs:
        r = random.Random(seed)
        blades, plumes = [], []
        for i in range(n):
            th = math.radians(-26 + 52 * i / max(1, n - 1) + r.uniform(-8, 8))
            ln = scale * r.uniform(40, 76)
            bend = scale * r.uniform(6, 16)
            ex, ey = bx + ln * math.sin(th) + bend, by - ln * math.cos(th)
            line = resample(catmull([(bx + r.uniform(-3, 3), by), (bx + ln * 0.5 * math.sin(th) + bend * 0.2, by - ln * 0.5 * math.cos(th)), (ex, ey)], 5), 2.2)
            blades.append(ribbon(line, lambda u: 1.7 * scale * (1 - 0.85 * u)))
            if r.random() < 0.4:
                plume = resample(catmull([(ex, ey), (ex + 5 * scale, ey - 7 * scale), (ex + 12 * scale, ey - 6 * scale), (ex + 17 * scale, ey - 1 * scale)], 5), 1.6)
                plumes.append(ribbon(plume, lambda u: 4.2 * scale * math.sin(math.pi * min(1, u * 1.15)) ** 0.8 + 0.2))
        out.append(
            f'<g class="lj-reed" style="transform-origin:{f(bx)}px {f(by)}px; --sway-t:{rng.uniform(2.8, 4.2):.2f}s; --sway-d:{-rng.uniform(0, 3):.2f}s">'
            f'<path d="{"".join(blades)}" style="fill:var(--lj-reed)"/>'
            f'<path d="{"".join(plumes)}" style="fill:var(--lj-plume)"/></g>'
        )
    return "".join(out)


# Boulders on the near banks: low, cut into facets, and painted like the towers.
BANKS = [(-40, 640, 250, 190, 61, "dome"), (96, 646, 190, 136, 62, "dome"), (214, 650, 150, 104, 63, "dome"),
         (300, 652, 104, 66, 64, "dome"), (360, 656, 60, 30, 65, "dome"),
         (1680, 640, 250, 170, 66, "dome"), (1560, 646, 180, 126, 67, "dome"), (1460, 652, 140, 88, 68, "dome"),
         (1384, 656, 92, 50, 69, "dome")]


def banks():
    defs, art = peak_layer("bank", BANKS, 1.25, veins=3, density=0.9, moss_amount=1.2, facets=6)
    return {
        "BANK_DEFS": defs,
        "BANK_ROCKS": art,
        "REEDS": reeds([(1418, 590, 1.0, 9, 1), (1474, 566, 1.15, 11, 2), (1530, 548, 0.9, 8, 3), (1350, 600, 0.7, 6, 4),
                        (356, 602, 0.8, 7, 5), (316, 590, 0.7, 6, 6)]),
    }


def stars():
    rng = random.Random(77)
    out, placed = [], []
    while len(placed) < 40:
        x, y = rng.uniform(10, 1590), rng.uniform(10, 520)
        if any(math.hypot(x - px, y - py) < 70 for px, py in placed):
            continue
        placed.append((x, y))
        r = rng.choice([0.6, 0.7, 0.8, 0.9, 1.1])
        a = rng.uniform(0.3, 0.75)
        out.append(f'<circle class="lj-tw" cx="{f(x)}" cy="{f(y)}" r="{f(r)}" '
                   f'style="--a:{a:.2f}; --t:{rng.uniform(3, 6):.2f}s; --d:{rng.uniform(0, 4):.2f}s"/>')
    return "".join(out)


def page_stars():
    rng = random.Random(31)
    layers = []
    for _ in range(28):
        x, y = rng.uniform(2, 98), rng.uniform(1, 92)
        r = rng.choice([0.8, 1, 1, 1.2])
        a = rng.uniform(0.2, 0.6) * (1 - y / 140)
        layers.append(f"radial-gradient({r}px {r}px at {x:.1f}% {y:.1f}%, rgb(240 232 210 / {a:.2f}) 60%, transparent)")
    return ",\n      ".join(layers)


# Silk: fine warp and weft, lighter and darker threads, laid over everything in soft light.
TEX_SILK = tile(
    "<feTurbulence type='fractalNoise' baseFrequency='1.15 .035' numOctaves='1' seed='3' stitchTiles='stitch' result='v'/>"
    "<feTurbulence type='fractalNoise' baseFrequency='.035 1.15' numOctaves='1' seed='5' stitchTiles='stitch' result='h'/>"
    "<feComposite in='v' in2='h' operator='arithmetic' k2='.5' k3='.5' result='w'/>"
    "<feColorMatrix in='w' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 3.2 0 0 0 -1.35' result='lite'/>"
    "<feColorMatrix in='w' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -3.2 0 0 0 1.85' result='dark'/>"
    "<feMerge><feMergeNode in='lite'/><feMergeNode in='dark'/></feMerge>", 256, 256)
# Age: broad, faint tide marks where the silk has darkened unevenly.
TEX_AGE = tile(
    "<feTurbulence type='fractalNoise' baseFrequency='.006' numOctaves='4' seed='8' stitchTiles='stitch'/>"
    "<feColorMatrix values='0 0 0 0 .4 0 0 0 0 .3 0 0 0 0 .14 2.2 0 0 0 -.95'/>", 640, 640)


# The same silk, faint enough to lie under running text on the page above.
TEX_SILK_PAGE = tile(
    "<feTurbulence type='fractalNoise' baseFrequency='1.15 .035' numOctaves='1' seed='3' stitchTiles='stitch' result='v'/>"
    "<feTurbulence type='fractalNoise' baseFrequency='.035 1.15' numOctaves='1' seed='5' stitchTiles='stitch' result='h'/>"
    "<feComposite in='v' in2='h' operator='arithmetic' k2='.5' k3='.5' result='w'/>"
    "<feColorMatrix in='w' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1.1 0 0 0 -.47' result='lite'/>"
    "<feColorMatrix in='w' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.1 0 0 0 .64' result='dark'/>"
    "<feMerge><feMergeNode in='lite'/><feMergeNode in='dark'/></feMerge>", 256, 256)


def placeholders():
    values = peaks()
    wave = waves()
    values.update({"WAVES_FAR": wave["far"], "WAVES_MID": wave["mid"], "WAVES_NEAR": wave["near"]})
    values.update(raft())
    values.update(straw_cape())
    values.update(pine())
    values.update(banks())
    values.update({
        "STARS": stars(),
        "PAGE_STARS": page_stars(),
        "TEX_SILK": TEX_SILK,
        "TEX_AGE": TEX_AGE,
        "TEX_SILK_PAGE": TEX_SILK_PAGE,
        "WATER": str(WATER),
    })
    return values


# Scene picker glyph, 16 x 16: two karst towers over the river.
GLYPH = ('<path d="M1.5 12.5C2.6 12.5 2.8 5.5 5 5.5S7 10.5 8 10.5 8.6 3 11 3 13.4 12.5 14.5 12.5"/>'
         '<path d="M2.5 14.6h4M9 14.6h4.5"/>')
