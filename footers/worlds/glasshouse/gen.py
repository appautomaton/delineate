"""Glasshouse: a Victorian palm house as a copperplate engraving, hand-tinted by day, lit by night.

By day every tone is cut as line. Each form is hatched in its own direction; the lines swell in the shadows,
break into flicks in the light, and a second set crosses the deepest darks. Foliage is cut as small curled
touches, glass as fine level lines with the palms inside showing through, water as ruled lines broken by the
reflection. The colour is laid over the print by hand; each form carries its tint as --c.

By night the same drawing is lit, not filtered. There is one light that matters, the house glowing from
within: its glass warm and luminous, the palms dark inside it, its iron black across it. Its light spills onto
the terrace and the pond, where the house lies broken in the water, and catches the near side of the trees.
The moon, high on the left, only edges things: a silver rim along the tops of clouds and crowns, and a few
touches of the engraving where its light falls. Everything else is silhouette, darkest nearest, so the
couple on the terrace, the urns and the lamp stand black against the glass.
"""
import math
import random
import re
from collections import defaultdict

from common import catmull, ellipse, f, poly, resample, ribbon, spans, union_outline

# The burin's widths. A tone in [0, 1] picks the nearest; below the first, the paper is left white.
WIDTHS = (.2, .28, .38, .5, .64, .8, .98, 1.2, 1.46)
INK = "#231E1A"
PAPER = "#EFEEE8"
MOON = "#DCE1EA"      # moonlight: rims and the few touches it picks out
DARK = {              # silhouettes, a little lighter with distance
    "far": "#151B29", "back": "#10151F", "mid": "#0D121B", "ground": "#0C1018", "near": "#070A10",
}


def clamp(v, lo=0.0, hi=1.0):
    return lo if v < lo else hi if v > hi else v


def smoothstep(a, b, x):
    t = clamp((x - a) / (b - a))
    return t * t * (3 - 2 * t)


def arch(t, p=1.0):
    """A sine hump over [0, 1], never negative, raised to a power to fatten or thin it."""
    return max(0.0, math.sin(math.pi * t)) ** p


def nearest_width(w):
    return min(range(len(WIDTHS)), key=lambda i: abs(WIDTHS[i] - w))


def width_index(t):
    if t <= .045:
        return None
    return nearest_width(.16 + 1.4 * t)


def parse_poly(d):
    """Back from common.poly's relative path to absolute points."""
    nums = [float(v) for v in re.findall(r"-?\d*\.?\d+", d)]
    x, y = nums[0], nums[1]
    pts = [(x, y)]
    for k in range(2, len(nums) - 1, 2):
        x, y = x + nums[k], y + nums[k + 1]
        pts.append((x, y))
    return pts


class Mask:
    """A polygon set rasterised once, even-odd, for fast inside tests."""

    def __init__(self, polys, cell=1.2):
        xs = [x for p in polys for x, _ in p]
        ys = [y for p in polys for _, y in p]
        self.x0, self.y0, self.cell = min(xs), min(ys), cell
        self.w = int((max(xs) - self.x0) / cell) + 2
        self.h = int((max(ys) - self.y0) / cell) + 2
        self.rows = []
        for j in range(self.h):
            row = bytearray(self.w)
            hits = spans(polys, self.y0 + (j + .5) * cell)
            for a, b in zip(hits[0::2], hits[1::2]):
                for i in range(max(0, int((a - self.x0) / cell + .5)), min(self.w, int((b - self.x0) / cell + .5))):
                    row[i] = 1
            self.rows.append(row)

    def __call__(self, x, y):
        i, j = int((x - self.x0) / self.cell), int((y - self.y0) / self.cell)
        return 0 <= i < self.w and 0 <= j < self.h and self.rows[j][i] == 1


def r1(v):
    return round(v, 1) + 0.0


def join_nums(nums):
    """Numbers for a path, with the separator left out wherever the parser does not need it."""
    out = nums[0]
    for prev, cur in zip(nums, nums[1:]):
        out += ("" if cur.startswith("-") or (cur.startswith(".") and "." in prev) else " ") + cur
    return out


def pair(a, b):
    return join_nums([f(a), f(b)])


def tail_of(pts):
    """A polyline after its first point, in relative steps, and where it ends."""
    nums, (px, py) = [], pts[0]
    for x, y in pts[1:]:
        dx, dy = r1(x - px), r1(y - py)
        if dx or dy:
            nums += [f(dx), f(dy)]
            px, py = x, y
    if not nums:
        return "h.1", (r1(pts[0][0] + .1), pts[0][1])
    return "l" + join_nums(nums), (px, py)


class Plate:
    """One stratum of the print: its forms (knocked out of what lies behind, tinted, burnished at night)
    and its marks, grouped by width. Marks come in two kinds: lines, which draw a thing (its contour, its
    ribs, its veins), and cuts, which lay tone (hatching, touches, stipple). By day both are printed in
    ink; by night the lines are printed in moonlight and the cuts only whisper, the tone coming from the
    mezzotint. Marks are kept as (start, relative tail, end), so each width's path can step from one mark
    to the next with short relative moves."""

    def __init__(self, seed, knock=True):
        self.rng = random.Random(seed)
        self.cuts = defaultdict(list)
        self.lines = defaultdict(list)
        self.shapes = []
        self.knock = knock
        self.extra_tint = ""
        self.night = []             # the plate by night, in drawing order; "{SID}" stands for its own id
        self.moon_texture = None    # (opacity): moonlight picks out the engraving along each form's lit edge

    def shape(self, pts_or_d, c):
        d = pts_or_d if isinstance(pts_or_d, str) else poly(pts_or_d)
        self.shapes.append(f'<path class="gh-s" d="{d}" style="--c:{c}"/>')

    def nshape(self, pts_or_d, fill, extra=""):
        """A form by night, filled flat: a silhouette, or a light."""
        d = pts_or_d if isinstance(pts_or_d, str) else poly(pts_or_d)
        self.night.append(f'<path d="{d}" fill="{fill}"{extra}/>')

    def rim(self, outline, opacity, w=.6, colour=MOON, closed=True, up=False, light=(.42, .9), k=.18):
        """Moonlight along the edges of a form that face the moon: brighter where they face it squarely.
        `up` is for an open edge whose outside is above it, such as a crest line."""
        pts = resample(outline + ([outline[0]] if closed else []), 2.5)
        cx = sum(x for x, _ in pts) / len(pts)
        cy = sum(y for _, y in pts) / len(pts)
        runs = {0: [], 1: []}
        cur, level = [], None
        for (ax, ay), (bx, by) in zip(pts, pts[1:]):
            tx, ty = bx - ax, by - ay
            l = math.hypot(tx, ty) or 1
            nx, ny = ty / l, -tx / l
            mx, my = (ax + bx) / 2, (ay + by) / 2
            if (ny > 0) if up else (nx * (mx - cx) + ny * (my - cy) < 0):
                nx, ny = -nx, -ny
            lit = -(nx * light[0] + ny * light[1])
            band = None if lit < k else (1 if lit > .6 else 0)
            if band != level and cur:
                runs[level].append(cur)
                cur = []
            if band is not None:
                cur = cur or [(ax, ay)]
                cur.append((bx, by))
            level = band
        if cur and level is not None:
            runs[level].append(cur)
        for band, alpha, width in ((0, opacity * .55, w * .8), (1, opacity, w)):
            if runs[band]:
                d = "".join(poly(r, closed=False) for r in runs[band] if len(r) > 1)
                self.night.append(f'<path d="{d}" fill="none" stroke="{colour}" stroke-opacity="{f(alpha)}" '
                                  f'stroke-width="{f(width)}" stroke-linecap="round" stroke-linejoin="round"/>')

    def _add(self, b, pts, into=None):
        pts = [(r1(x), r1(y)) for x, y in pts]
        tail, end = tail_of(pts)
        (self.cuts if into is None else into)[b].append((pts[0], tail, end))

    def cut(self, pts, w):
        """A line that draws: a contour, a rib, a vein."""
        self._add(nearest_width(w), pts, self.lines)

    def raw(self, d, w):
        """A line written by hand as an absolute path; the next mark starts afresh after it."""
        self.lines[nearest_width(w)].append((None, d, None))

    def hatch(self, polys, angle, gap, tone, step=3.0, levels=None, flick=.18, wave=None):
        """Parallel cuts across the polygons. Each run's width follows the tone beneath it."""
        a = math.radians(angle)
        ca, sa = math.cos(a), math.sin(a)
        rot = [[(x * ca + y * sa, -x * sa + y * ca) for x, y in p] for p in polys]
        if levels is None:
            vs = [v for p in rot for _, v in p]
            v, levels = min(vs) + gap * self.rng.random(), []
            while v < max(vs):
                levels.append(v)
                v += gap
        for v in levels:
            hits = spans(rot, v)
            for u0, u1 in zip(hits[0::2], hits[1::2]):
                n = max(1, int((u1 - u0) / step + .5))
                du = (u1 - u0) / n
                marks = []
                for k in range(n):
                    um = u0 + (k + .5) * du
                    t = tone(um * ca - v * sa, um * sa + v * ca)
                    b = width_index(t)
                    if b is not None and t < flick and self.rng.random() * flick > t:
                        b = None
                    marks.append(b)
                k = 0
                while k < n:
                    j = k
                    while j < n and marks[j] == marks[k]:
                        j += 1
                    if marks[k] is not None:
                        self._run(u0 + k * du, u0 + j * du, v, ca, sa, marks[k], wave)
                    k = j

    def _run(self, ua, ub, v, ca, sa, b, wave):
        if wave is None:
            self._add(b, [(ua * ca - v * sa, ua * sa + v * ca), (ub * ca - v * sa, ub * sa + v * ca)])
            return
        m = max(1, int((ub - ua) / 7))
        pts = []
        for k in range(m + 1):
            u = ua + (ub - ua) * k / m
            vv = v + wave(u, v)
            pts.append((u * ca - vv * sa, u * sa + vv * ca))
        self._add(b, pts)

    def touches(self, polys, tone, step, size, curl=1.0, mask=None, tilt=0.0):
        """Foliage as the engraver cuts it: small curled touches, closer and heavier in the shade."""
        m = mask or Mask(polys)
        ys = [y for p in polys for _, y in p]
        xs = [x for p in polys for x, _ in p]
        row, y = 0, min(ys)
        while y < max(ys):
            x = min(xs) + (step / 2 if row % 2 else 0)
            while x < max(xs):
                px = x + self.rng.uniform(-.45, .45) * step
                py = y + self.rng.uniform(-.3, .3) * step
                if m(px, py):
                    t = tone(px, py)
                    if self.rng.random() < t * 1.7:
                        b = width_index(min(1.0, t * .85 + .06))
                        if b is not None:
                            s = size * self.rng.uniform(.7, 1.25)
                            dy = s * tilt * self.rng.uniform(.5, 1.5)
                            sx, sy = r1(px - s), r1(py - dy)
                            c1, c2, e1, e2 = r1(s), r1(s * curl + dy), r1(2 * s), r1(2 * dy)
                            self.cuts[b].append(((sx, sy), "q" + join_nums([f(c1), f(c2), f(e1), f(e2)]), (r1(sx + e1), r1(sy + e2))))
                x += step
            y += step * .6
            row += 1

    def scallops(self, outline, size, w, keep=lambda x, y: True):
        """The edge of a mass of leaves: a run of small bulges, each pushed out from the middle of the mass."""
        cx = sum(x for x, _ in outline) / len(outline)
        cy = sum(y for _, y in outline) / len(outline)
        pts = resample(outline + [outline[0]], size * 2)
        b = nearest_width(w)
        for (ax, ay), (bx, by) in zip(pts, pts[1:]):
            mx, my = (ax + bx) / 2, (ay + by) / 2
            if not keep(mx, my):
                continue
            nx, ny = mx - cx, my - cy
            l = math.hypot(nx, ny) or 1
            ax, ay, bx, by = r1(ax), r1(ay), r1(bx), r1(by)
            qx, qy = r1(mx + nx / l * size * .8 - ax), r1(my + ny / l * size * .8 - ay)
            self.lines[b].append(((ax, ay), "q" + join_nums([f(qx), f(qy), f(r1(bx - ax)), f(r1(by - ay))]), (bx, by)))

    def stipple(self, polys, tone, step, mask=None):
        """Gravel and sand: dots, pecked closer where the tone is darker."""
        m = mask or Mask(polys)
        ys = [y for p in polys for _, y in p]
        xs = [x for p in polys for x, _ in p]
        y = min(ys)
        while y < max(ys):
            x = min(xs)
            while x < max(xs):
                px, py = r1(x + self.rng.uniform(0, step)), r1(y + self.rng.uniform(0, step))
                if m(px, py) and self.rng.random() < tone(px, py) * 2.2:
                    self.cuts[self.rng.choice((1, 2, 3))].append(((px, py), "h.1", (r1(px + .1), py)))
                x += step
            y += step

    def svg_cuts(self, store=None):
        out = []
        for i, items in sorted((self.cuts if store is None else store).items()):
            d, here = [], None
            for start, tail, end in items:
                if start is None:
                    d.append(tail)
                    here = None
                    continue
                if here is None:
                    d.append("M" + pair(*start))
                else:
                    d.append("m" + pair(r1(start[0] - here[0]), r1(start[1] - here[1])))
                d.append(tail)
                here = end
            out.append(f'<path d="{"".join(d)}" stroke-width="{WIDTHS[i]}"/>')
        return "".join(out)

    def svg_shapes(self):
        return "".join(self.shapes)


# Tone fields. Light comes from the upper left and a little toward the viewer.

LIGHT = (-.52, -.62, .59)


def lambert(nx, ny):
    nz = math.sqrt(max(0.0, 1 - nx * nx - ny * ny))
    return nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]


def sphere(cx, cy, rx, ry, base, amp):
    def t(x, y):
        nx, ny = (x - cx) / rx, (y - cy) / ry
        k = math.hypot(nx, ny)
        if k > .99:
            nx, ny = nx / k * .99, ny / k * .99
        return clamp(base + amp * (.55 - lambert(nx, ny)))
    return t


def cylinder(cx, r, base, amp):
    """A vertical cylinder: lit on the left, turning into shade on the right."""
    def t(x, y):
        return clamp(base + amp * (.55 - lambert(clamp((x - cx) / r, -.99, .99), 0)))
    return t


def lobes_tone(lobes, base, amp, sink=(0, 1, 0)):
    """Masses of foliage: each point is shaded as part of the nearest lobe, and darker toward the bottom."""
    y0, y1, extra = sink

    def t(x, y):
        near = min(lobes, key=lambda c: ((x - c[0]) ** 2 + (y - c[1]) ** 2) / c[2] ** 2)
        lit = lambert(clamp((x - near[0]) / near[2], -.95, .95), clamp((y - near[1]) / near[2], -.95, .95))
        return clamp(base + amp * (.6 - lit) + extra * smoothstep(y0, y1, y))
    return t


def arc(cx, cy, rx, ry, a0, a1, n):
    """Points on an ellipse; angles in degrees, counter-clockwise as seen, with y pointing down the page."""
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * k / n)), cy - ry * math.sin(math.radians(a0 + (a1 - a0) * k / n)))
            for k in range(n + 1)]


def blob(cx, cy, rx, ry, rng, n=28, rough=.08):
    return [(cx + rx * math.cos(a) * (1 + rng.uniform(-rough, rough)), cy + ry * math.sin(a) * (1 + rng.uniform(-rough, rough)))
            for a in [k * math.tau / n for k in range(n)]]


def crown_edge(circles, x0, x1, floor, step=3):
    """The top edge of a row of round crowns."""
    edge = []
    for x in range(x0, x1 + 1, step):
        top = floor
        for cx, cy, r in circles:
            if abs(x - cx) < r:
                top = min(top, cy - math.sqrt(r * r - (x - cx) ** 2))
        edge.append((x, top))
    return edge


# ---------------------------------------------------------------------------------------------------------
# The sky and the far trees.

SKY_TOP = 150
GROUND = 482


def far_plane(cover):
    rng = random.Random(1)
    sky, trees = Plate(1, knock=False), Plate(2, knock=False)

    # The far tree line: a low band of rounded crowns with a few poplars standing out of it.
    crowns = []
    x = -100
    while x < 1720:
        r = rng.uniform(15, 28)
        crowns.append((x, 472 - r * rng.uniform(.45, .95), r))
        x += r * rng.uniform(1.0, 1.5)
    poplars = [(px, rng.uniform(384, 412)) for px in (176, 230, 1372, 1418, 1468)]

    def top(x):
        best = 472.0
        for cx, cy, r in crowns:
            if abs(x - cx) < r:
                best = min(best, cy - math.sqrt(r * r - (x - cx) ** 2))
        for px, ptop in poplars:
            if abs(x - px) < 9:
                u = abs(x - px) / 9
                best = min(best, ptop + (472 - ptop) * math.asin(min(1.0, u ** (1 / .55))) / math.pi / 1.6)
        return best

    edge = [(x, top(x)) for x in range(-100, 1721, 4)]
    band = edge + [(1720, 486), (-100, 486)]
    trees.shape(band, "#A9BCA4")
    trees.night.append(f'<rect x="-100" y="300" width="1820" height="186" fill="url(#gh-night-haze)"/>')
    trees.nshape(band, DARK["far"])
    trees.rim(edge, .3, w=.5, closed=False, up=True)
    seen = lobes_tone(crowns, .12, .16, (430, 472, .08))

    def tone(x, y):
        hidden = all(any(m(x + dx, y + dy) for m in cover) for dx, dy in ((0, 0), (-10, 0), (10, 0), (0, -6)))
        return 0 if hidden else seen(x, y)
    trees.hatch([band], -4, 2.1, tone, flick=.2)
    trees.touches([band], lambda x, y: tone(x, y) * .7, 4.2, 1.4, curl=.9)

    # The sky, ruled level and close: darkest a little above the trees, fading toward the words above.
    clouds = [
        union_outline([(300, 262, 34), (340, 248, 40), (386, 258, 32), (262, 272, 22), (420, 270, 22)], 340, 262),
        union_outline([(1150, 236, 30), (1196, 222, 40), (1246, 232, 34), (1290, 246, 24), (1110, 248, 20)], 1196, 236),
        union_outline([(520, 312, 15), (548, 302, 21), (578, 310, 15)], 548, 308),
    ]
    sky_poly = [(-100, SKY_TOP), (1720, SKY_TOP)] + edge[::-1]
    levels = [SKY_TOP + 2.5 * k for k in range(int((486 - SKY_TOP) / 2.5))]

    def sky_tone(x, y):
        edge = SKY_TOP + 34 + 30 * math.sin(x / 173 + 1.3) * math.cos(x / 89 - .4) + 14 * math.sin(x / 41)
        return .17 * smoothstep(edge, edge + 70, y) * (1 - .62 * smoothstep(270, 470, y))
    sky.hatch([sky_poly] + clouds, 0, 2.5, sky_tone, levels=levels, step=4, flick=.1)
    for c in clouds:
        ys = [p[1] for p in c]
        lo, hi = min(ys), max(ys)
        sky.hatch([c], 0, 2.5, lambda x, y, lo=lo, hi=hi: .2 * smoothstep(lo + (hi - lo) * .5, hi, y), levels=levels, step=3, flick=.2)
        sky.cut(c[len(c) // 2:] + [c[0]], .2)
    sky.extra_tint = f'<rect x="-100" y="{SKY_TOP}" width="1820" height="{486 - SKY_TOP}" fill="url(#gh-sky-tint)"/>'
    # By night the clouds are dark, and the moon above them lines their tops with silver.
    for c in clouds:
        sky.nshape(c, "url(#gh-night-cloud)")
        sky.rim(c, .7, w=.8)
    return [sky, trees]


# ---------------------------------------------------------------------------------------------------------
# The palm house: a centre block with a dome over a clerestory, and two long wings ending in apses.

C_X0, C_X1 = 640, 960
C_WALL, C_AISLE, C_CLER = 404, 364, 336
DOME_RX, DOME_RY = 122, 100
W_WALL, W_RIDGE = 424, 378
L_X0, R_X1 = 412, 1188
APSE = 40
PLINTH = 470
RIB = 8.4


def wing_outline(left):
    if left:
        return [(L_X0, PLINTH)] + arc(L_X0 + APSE, W_WALL, APSE, W_WALL - W_RIDGE, 180, 90, 12) + [(C_X0, W_RIDGE), (C_X0, PLINTH)]
    return [(C_X1, PLINTH), (C_X1, W_RIDGE)] + arc(R_X1 - APSE, W_WALL, APSE, W_WALL - W_RIDGE, 90, 0, 12) + [(R_X1, PLINTH)]


def centre_outline():
    left_end = arc(C_X0 + 32, C_WALL, 32, C_WALL - C_AISLE, 180, 90, 8)
    right_end = arc(C_X1 - 32, C_WALL, 32, C_WALL - C_AISLE, 90, 0, 8)
    dome = arc(800, C_CLER, DOME_RX, DOME_RY, 180, 0, 36)
    return [(C_X0, PLINTH)] + left_end + [(672, C_CLER), (678, C_CLER)] + dome + [(928, C_CLER)] + right_end + [(C_X1, PLINTH)]


def palms(rng):
    """Palm crowns inside the house: arching fronds round a crown, a trunk below."""
    out = []
    for cx, cy, spread, trunk_top in ((800, 286, 92, 300), (742, 352, 52, 360), (862, 356, 50, 362),
                                      (498, 404, 46, 410), (586, 398, 44, 404), (1014, 398, 44, 404), (1104, 404, 46, 410)):
        foot = 432 if cx == 800 else PLINTH
        out.append(ribbon([(cx + 1, foot), (cx - 2, (foot + trunk_top) / 2), (cx, trunk_top)], lambda u: 5 - 2 * u))
        for k in range(11):
            ang = math.radians(-178 + k * 17.6 + rng.uniform(-6, 6))
            ln = spread * rng.uniform(.6, .92)
            lift = math.sin(ang)
            mid = (cx + math.cos(ang) * ln * .5, cy + lift * ln * .62 - ln * .08)
            tip = (cx + math.cos(ang) * ln, cy + lift * ln * .55 + ln * .3 * (1 - abs(lift)) + ln * .1)
            line = resample(catmull([(cx, cy), mid, tip], 6), 3)
            out.append(ribbon(line, lambda u, s=spread: s * .11 * arch(min(1, u * 1.15), .6)))
    return [p for p in (parse_poly(d) for d in out) if len(p) > 2]


def streak(sx, sy, ln):
    """Sky caught in a pane: a white diagonal the hatching leaves alone."""
    return [(sx, sy + ln), (sx + ln * .62, sy), (sx + ln * .62 + 4, sy), (sx + 4, sy + ln)]


def house_plate():
    rng = random.Random(7)
    pl = Plate(7)
    left, right, centre = wing_outline(True), wing_outline(False), centre_outline()
    porch = [(778, PLINTH), (778, 438)] + arc(800, 438, 22, 14, 180, 0, 12) + [(822, PLINTH)]
    lantern = [(790, 238), (790, 220), (794, 214), (806, 214), (810, 220), (810, 238)]
    for o in (left, right, centre):
        pl.shape(o, "#CFE2E1")
    pl.shape(porch, "#CFE2E1")
    pl.shape(lantern, "#CFE2E1")
    palm_polys = palms(rng)
    for p in palm_polys:
        pl.shape(p, "#7FA06C")
    inside = Mask(palm_polys)
    # By night: the glass lit from within, the palms dark against it, the glazing a faint warm texture.
    pl.night.append('<g id="gh-house-glow">')
    for o in (left, right, centre, porch, lantern):
        pl.nshape(o, "url(#gh-glass-glow)")
    pl.nshape(f"M672 {C_AISLE}V{C_CLER}H928V{C_AISLE}Z", "#9A6534", ' opacity=".45"')
    pl.night.append('<use href="#{SID}-cuts" style="--gh-ink:#6B4421" opacity=".3"/>')
    pl.night.append('<g fill="#2E1E10" opacity=".82" filter="url(#gh-veil)">' + "".join(f'<path d="{poly(p)}"/>' for p in palm_polys) + "</g>")

    def glass(base):
        return lambda x, y: max(base(x, y), .4) if inside(x, y) else base(x, y)

    walls = [
        [(L_X0, PLINTH), (L_X0, W_WALL), (C_X0, W_WALL), (C_X0, PLINTH)],
        [(C_X1, PLINTH), (C_X1, W_WALL), (R_X1, W_WALL), (R_X1, PLINTH)],
        [(C_X0, PLINTH), (C_X0, C_WALL), (C_X1, C_WALL), (C_X1, PLINTH)],
    ]
    wall_streaks = [streak(*s) for s in ((470, 452, 18), (560, 440, 22), (708, 452, 18), (884, 446, 20), (1060, 446, 18), (1140, 452, 16))]
    pl.hatch(walls + wall_streaks, 0, 2.0, glass(lambda x, y: .1 + .2 * smoothstep(C_WALL, PLINTH, y) + .05 * (x > 800)), flick=.16)

    # The wing vaults, seen along their length: darker at the eaves, where the glass turns toward us.
    vaults = [
        [(L_X0 + APSE, W_WALL), (L_X0 + APSE, W_RIDGE), (C_X0, W_RIDGE), (C_X0, W_WALL)],
        [(C_X1, W_WALL), (C_X1, W_RIDGE), (R_X1 - APSE, W_RIDGE), (R_X1 - APSE, W_WALL)],
    ]
    vault_streaks = [streak(480, 410, 12), streak(1020, 408, 14)]
    pl.hatch(vaults + vault_streaks, 0, 1.7, glass(lambda x, y: .04 + .28 * smoothstep(W_RIDGE, W_WALL, y) ** 1.6 + .04 * (x > 800)), flick=.18)

    # The apses: quarter domes, lit on the west, turned into shade on the east.
    apse_l = [(L_X0, W_WALL)] + arc(L_X0 + APSE, W_WALL, APSE, W_WALL - W_RIDGE, 180, 90, 12) + [(L_X0 + APSE, W_WALL)]
    apse_r = [(R_X1 - APSE, W_WALL)] + arc(R_X1 - APSE, W_WALL, APSE, W_WALL - W_RIDGE, 90, 0, 12) + [(R_X1, W_WALL)]
    pl.hatch([apse_l], 0, 1.7, glass(sphere(L_X0 + APSE, W_WALL, APSE * 1.1, (W_WALL - W_RIDGE) * 1.1, .02, .34)), flick=.18)
    pl.hatch([apse_r], 0, 1.7, glass(sphere(R_X1 - APSE, W_WALL, APSE * 1.1, (W_WALL - W_RIDGE) * 1.1, .14, .36)), flick=.18)

    # The centre block's aisle roof and its curved ends, then the clerestory in shadow under the dome.
    aisle = [(C_X0, C_WALL)] + arc(C_X0 + 32, C_WALL, 32, C_WALL - C_AISLE, 180, 90, 8) + arc(C_X1 - 32, C_WALL, 32, C_WALL - C_AISLE, 90, 0, 8)
    aisle_streaks = [streak(676, 376, 14), streak(906, 386, 14)]
    pl.hatch([aisle] + aisle_streaks, 0, 1.7, glass(lambda x, y: .05 + .26 * smoothstep(C_AISLE, C_WALL, y) ** 1.5 + .06 * smoothstep(800, 960, x)), flick=.18)
    cler = [(672, C_AISLE), (672, C_CLER), (928, C_CLER), (928, C_AISLE)]
    pl.hatch([cler], 90, 1.9, glass(lambda x, y: .3 + .1 * smoothstep(C_CLER, C_AISLE, y)), flick=.1)

    dome = [(678, C_CLER)] + arc(800, C_CLER, DOME_RX, DOME_RY, 180, 0, 36)
    dome_streaks = [streak(722, 300, 26), streak(752, 262, 22)]
    pl.hatch([dome] + dome_streaks, 0, 1.6, glass(sphere(800, C_CLER, DOME_RX * 1.05, DOME_RY * 1.05, .02, .38)), flick=.2)
    pl.hatch([lantern], 90, 1.6, lambda x, y: .22 + .2 * (x > 800))
    for st in wall_streaks + vault_streaks + aisle_streaks + dome_streaks:
        pl.nshape(st, "#FFF7E2", ' opacity=".42"')

    # The palms again, crossed, so they sit dark behind the glass.
    for g in walls + vaults + [apse_l, apse_r, aisle, cler, dome]:
        pl.hatch([g], 52, 2.8, lambda x, y: .32 if inside(x, y) else 0, flick=0)

    iron = Plate(8, knock=False)
    # By night the iron is the darkest thing on the house: tracery drawn over the lit glass.
    iron.night.append('<use href="#{SID}-lines" style="--gh-ink:#170F08" opacity=".9"/>')
    # Ironwork: ribs on every face, purlins along the curves, a gutter at each eave, cresting on the ridges.
    def ribs(x0, x1, y_top, y_bottom, w=.42):
        n = int((x1 - x0) / RIB)
        for k in range(1, n + 1):
            x = x0 + (x1 - x0) * k / (n + 1)
            iron.cut([(x, y_bottom), (x, y_top)], .66 if k % 4 == 0 else w)

    ribs(L_X0 + APSE, C_X0, W_RIDGE, PLINTH)
    ribs(C_X1, R_X1 - APSE, W_RIDGE, PLINTH)
    ribs(L_X0, L_X0 + APSE, W_WALL, PLINTH)
    ribs(R_X1 - APSE, R_X1, W_WALL, PLINTH)
    ribs(C_X0, C_X1, C_WALL, PLINTH)
    ribs(C_X0 + 32, C_X1 - 32, C_AISLE, C_WALL)
    ribs(672, 928, C_CLER, C_AISLE, .5)
    for k in range(1, 6):
        s = math.sin(k * math.pi / 12)
        y = W_WALL - (W_WALL - W_RIDGE) * s
        reach = APSE * math.cos(k * math.pi / 12)
        iron.cut([(L_X0 + APSE - reach, y), (C_X0, y)], .26)
        iron.cut([(C_X1, y), (R_X1 - APSE + reach, y)], .26)
        y2 = C_WALL - (C_WALL - C_AISLE) * s
        r2 = 32 * math.cos(k * math.pi / 12)
        iron.cut([(C_X0 + 32 - r2, y2), (C_X1 - 32 + r2, y2)], .26)
    for cx, sign, rx, base, rise, n in ((L_X0 + APSE, -1, APSE, W_WALL, W_WALL - W_RIDGE, 5), (R_X1 - APSE, 1, APSE, W_WALL, W_WALL - W_RIDGE, 5),
                                        (C_X0 + 32, -1, 32, C_WALL, C_WALL - C_AISLE, 4), (C_X1 - 32, 1, 32, C_WALL, C_WALL - C_AISLE, 4)):
        for k in range(1, n):
            al = k * math.pi / 2 / n
            iron.cut([(cx + sign * rx * math.cos(al) * math.cos(b), base - rise * math.sin(b)) for b in [j * math.pi / 20 for j in range(11)]], .4)
    # Dome: meridians that close on the lantern, parallels that tighten toward the top.
    for k in range(1, 24):
        al = k * math.pi / 24
        pts = [(800 + DOME_RX * math.cos(al) * math.cos(b), C_CLER - DOME_RY * math.sin(b)) for b in [j * math.pi / 32 for j in range(17)]]
        iron.cut([p for p in pts if p[1] > 238], .7 if k % 4 == 0 else .4)
    for k in range(1, 8):
        b = k * math.pi / 2 / 8.6
        y = C_CLER - DOME_RY * math.sin(b)
        r = DOME_RX * math.cos(b)
        iron.cut([(800 - r, y), (800 + r, y)], .28)
    # Eaves with their gutters, and a transom across each wall.
    for x0, x1, y in ((L_X0, C_X0, W_WALL), (C_X1, R_X1, W_WALL), (C_X0, C_X1, C_WALL), (672, 928, C_AISLE), (672, 928, C_CLER)):
        iron.cut([(x0 - 2, y), (x1 + 2, y)], 1.0)
        iron.cut([(x0 - 2, y + 2.2), (x1 + 2, y + 2.2)], .3)
    for x0, x1 in ((L_X0, C_X0), (C_X1, R_X1), (C_X0, C_X1)):
        iron.cut([(x0, 447), (x1, 447)], .5)
    # Cresting along the ridges: a light iron railing of uprights under a top bar, and finials.
    for x0, x1, y in ((L_X0 + APSE, C_X0, W_RIDGE), (C_X1, R_X1 - APSE, W_RIDGE), (C_X0 + 32, C_X1 - 32, C_AISLE)):
        iron.cut([(x0, y), (x1, y)], .9)
        iron.cut([(x0, y - 3.4), (x1, y - 3.4)], .26)
        x = x0 + 2
        while x < x1:
            iron.raw(f"M{f(x)} {f(y)}v-4.6", .3)
            x += 3.2
    for fx, fy in ((L_X0 + APSE, W_RIDGE), (R_X1 - APSE, W_RIDGE), (C_X0 + 32, C_AISLE), (C_X1 - 32, C_AISLE)):
        iron.raw(f"M{f(fx)} {f(fy)}v-11", .6)
        iron.raw(ellipse(fx, fy - 6, 1.4, 1.4), .4)
    # The lantern and its finial.
    iron.cut(lantern, .7)
    for x in (795, 800, 805):
        iron.cut([(x, 236), (x, 219)], .3)
    iron.raw("M800 214v-16", .6)
    iron.raw(ellipse(800, 205, 1.8, 1.8), .4)
    for o in (left, right, centre):
        iron.cut(o, .55)
    # The porch with its door.
    pl.hatch([porch], 0, 1.8, lambda x, y: .16 + .1 * smoothstep(438, 470, y))
    door = [(788, PLINTH), (788, 452)] + arc(800, 452, 12, 12, 180, 0, 10) + [(812, PLINTH)]
    pl.hatch([door], 0, 1.3, lambda x, y: .82)
    pl.hatch([door], 60, 1.8, lambda x, y: .6)
    pl.cut(porch, .7)
    pl.cut(arc(800, 438, 22, 14, 180, 0, 12), .5)
    for x in (784, 816):
        pl.cut([(x, PLINTH), (x, 440)], .4)
    pl.nshape(door, "#FFEDC0")
    pl.night.append("</g>")

    # The plinth: dressed stone, coursed, under its coping.
    plinth = [(L_X0 - 8, PLINTH), (R_X1 + 8, PLINTH), (R_X1 + 10, GROUND), (L_X0 - 10, GROUND)]
    pl.shape(plinth, "#D8CEBB")
    pl.nshape(plinth, "#16130F")
    pl.night.append(f'<path d="M{L_X0 - 10} {PLINTH}H{R_X1 + 10}" stroke="#C99A5C" stroke-opacity=".5" stroke-width=".8"/>')
    pl.hatch([plinth], 0, 1.4, lambda x, y: .26 + .18 * smoothstep(PLINTH, GROUND, y), flick=.1)
    pl.cut([(L_X0 - 10, PLINTH), (R_X1 + 10, PLINTH)], 1.1)
    pl.cut([(L_X0 - 10, GROUND), (R_X1 + 10, GROUND)], .7)
    x = L_X0
    while x < R_X1:
        pl.raw(f"M{f(x)} {PLINTH + 1}v{GROUND - PLINTH - 1}", .3)
        x += 22 + rng.uniform(-3, 3)
    steps = [(764, GROUND), (836, GROUND), (846, GROUND + 12), (754, GROUND + 12)]
    pl.shape(steps, "#E1D8C6")
    pl.nshape(steps, "#5A4630")
    pl.hatch([steps], 0, 1.6, lambda x, y: .1 + .3 * ((y - GROUND) % 4 > 2.6))
    for k in range(1, 4):
        pl.cut([(764 - 3.3 * k, GROUND + 4 * k), (836 + 3.3 * k, GROUND + 4 * k)], .5)
    return pl, iron


def back_trees_plate(cover):
    """Trees behind the house: a band of crowns, and Lombardy poplars standing up between the roofs."""
    rng = random.Random(11)
    pl = Plate(11)
    circles = []
    x = 360
    while x < 1250:
        r = rng.uniform(26, 42)
        circles.append((x, 404 - rng.uniform(0, 16), r))
        x += r * rng.uniform(.9, 1.3)
    band = crown_edge(circles, 330, 1280, 470) + [(1280, 474), (330, 474)]
    pl.shape(band, "#93AE8B")
    pl.cover = [band]
    pl.nshape(band, DARK["back"])
    pl.rim(band[:-2], .26, w=.5, closed=False, up=True)
    masks = [Mask([wing_outline(True), wing_outline(False), centre_outline()])] + [Mask([c]) for c in cover]

    def house(x, y):
        return any(m(x, y) for m in masks)
    seen = lobes_tone(circles, .3, .3)

    def tone(x, y):
        return 0 if house(x, y) else seen(x, y)
    pl.hatch([band], 18, 2.1, tone, flick=.1)
    pl.touches([band], tone, 3.6, 1.6)
    for px, top, w in ((598, 262, 13), (622, 300, 11), (980, 276, 13), (1006, 304, 11), (372, 330, 12), (1232, 322, 12)):
        left = []
        for k in range(15):
            u = k / 14
            y = top + (474 - top) * u
            half = w * (arch(min(1, u * 1.6), .55) if u < .62 else 1 - .2 * (u - .62))
            left.append((px - half + rng.uniform(-1.4, 1.4), y))
        outline = left + [(2 * px - x + rng.uniform(-1.4, 1.4), y) for x, y in left[::-1]]
        pl.shape(outline, "#7F9C7A")
        pl.nshape(outline, DARK["back"])
        pl.rim(outline, .4, w=.55)
        lit = cylinder(px, w * 1.1, .3, .4)

        def tone(x, y, lit=lit):
            return 0 if house(x, y) else lit(x, y)
        pl.hatch([outline], 78, 1.9, tone, flick=.1)
        pl.touches([outline], tone, 3.2, 1.3, tilt=.4)
    return pl


def cedar_plate():
    """A cedar of Lebanon on the left: its trunk, then flat tiers of foliage, pale on top and dark beneath."""
    rng = random.Random(21)
    pl = Plate(21)
    trunk = parse_poly(ribbon(resample(catmull([(296, GROUND + 4), (300, 420), (292, 360), (300, 300)], 6), 3), lambda u: 18 - 12 * u))
    pl.shape(trunk, "#6A5646")
    pl.nshape(trunk, DARK["mid"])
    for bx0, by0, bx1, by1 in ((296, 432, 200, 452), (296, 432, 410, 448), (294, 396, 214, 412), (296, 394, 392, 408),
                               (294, 360, 236, 374), (296, 358, 370, 372), (298, 330, 250, 340), (298, 330, 350, 338)):
        limb = parse_poly(ribbon([(bx0, by0), ((bx0 + bx1) / 2, (by0 + by1) / 2 - 4), (bx1, by1)], lambda u: 5 - 3.5 * u))
        pl.shape(limb, "#6A5646")
        pl.nshape(limb, DARK["mid"])
        pl.cut(limb, .5)
    pl.hatch([trunk], 86, 1.5, cylinder(296, 10, .45, .5))
    pl.hatch([trunk], 30, 2.2, lambda x, y: .5 if x > 297 else 0)
    cover = [trunk]
    pl.cover = cover
    pl.moon_texture = .5
    tiers = [(300, 456, 330, 30), (292, 418, 296, 28), (304, 380, 250, 26), (296, 346, 196, 24), (304, 316, 132, 20), (300, 292, 64, 16)]
    for k, (cx, cy, w, h) in enumerate(tiers):
        pts = []
        for j in range(40):
            a = j * math.tau / 40
            s = math.sin(a)
            ry = h * (.42 if s > 0 else .58)
            bump = rng.uniform(-.1, .14) if s < 0 else rng.uniform(-.06, .06)
            pts.append((cx + w / 2 * math.cos(a) * (1 + rng.uniform(-.04, .04)), cy + s * ry * (1 + bump)))
        pl.shape(pts, "#6F8E6B")
        pl.nshape(pts, DARK["mid"])
        pl.rim(pts, .62, w=.7)
        cover.append(pts)
        pl.scallops(pts, 1.7, .4, keep=lambda x, y, cy=cy: y < cy - 1)
        top, bottom = cy - h * .58, cy + h * .42

        def tone(x, y, top=top, bottom=bottom, cx=cx, w=w):
            v = smoothstep(top + (bottom - top) * .3, bottom, y)
            return clamp(.08 + .72 * v ** 1.3 + .1 * smoothstep(cx - w * .2, cx + w * .5, x))
        m = Mask([pts])
        pl.hatch([pts], -5, 1.7, tone, flick=.16)
        pl.hatch([pts], 38, 2.2, lambda x, y, tone=tone: max(0, tone(x, y) - .5) * 1.8, flick=0)
        pl.touches([pts], lambda x, y, tone=tone: .45 if tone(x, y) < .4 else 0, 3.4, 1.8, curl=.55, mask=m)
    return pl


def beech_plate():
    """A great beech on the right: lobed masses of foliage cut as touches, its limbs showing between."""
    rng = random.Random(31)
    pl = Plate(31)
    trunk = parse_poly(ribbon(resample(catmull([(1340, GROUND + 4), (1336, 450), (1342, 400)], 6), 3), lambda u: 26 - 12 * u))
    pl.shape(trunk, "#6E6050")
    pl.nshape(trunk, DARK["mid"])
    for x0, y0, x1, y1 in ((1340, 410, 1288, 350), (1342, 408, 1396, 352), (1340, 404, 1334, 320)):
        pl.shape(parse_poly(ribbon([(x0, y0), ((x0 + x1) / 2 + 4, (y0 + y1) / 2), (x1, y1)], lambda u: 9 - 6 * u)), "#6E6050")
    pl.hatch([trunk], 88, 1.5, cylinder(1340, 12, .4, .5))
    lobes = []
    for k in range(26):
        a = rng.uniform(0, math.tau)
        d = math.sqrt(rng.random())
        lobes.append((1334 + math.cos(a) * d * 96, 350 + math.sin(a) * d * 72, rng.uniform(22, 34)))
    lobes += [(1240, 412, 30), (1428, 410, 30), (1334, 268, 30)]
    outline = union_outline(lobes, 1334, 350, 160)
    holes = [blob(1362, 392, 9, 5, rng)]
    pl.shape(outline, "#8FA868")
    pl.nshape(outline, DARK["mid"])
    pl.night.append(f'<clipPath id="gh-beech-clip"><path d="{poly(outline)}"/></clipPath>'
                    '<ellipse cx="1206" cy="420" rx="120" ry="90" fill="url(#gh-spill)" clip-path="url(#gh-beech-clip)" opacity=".5"/>')
    pl.rim(outline, .6, w=.75)
    for x, y, r in lobes:
        inner = [(x + math.cos(a) * r, y + math.sin(a) * r) for a in [math.radians(200 + 9 * j) for j in range(11)]]
        pl.night.append(f'<path d="{poly(inner, closed=False)}" fill="none" stroke="{MOON}" stroke-opacity=".14" stroke-width=".5"/>')
    pl.moon_texture = .42
    pl.cover = [outline, trunk]
    pl.scallops(outline, 2.2, .45, keep=lambda x, y: y < 420)
    crown = sphere(1334, 340, 150, 120, .1, .55)
    local = lobes_tone(lobes, .1, .3)

    def tone(x, y):
        return clamp(.62 * crown(x, y) + .38 * local(x, y) + .16 * smoothstep(360, 440, y))
    m = Mask([outline] + holes)
    pl.touches([outline], tone, 3.3, 1.9, mask=m)
    pl.hatch([outline] + holes, 28, 2.1, lambda x, y: max(0, tone(x, y) - .34) * 1.4, flick=.08)
    pl.hatch([outline] + holes, -42, 2.4, lambda x, y: max(0, tone(x, y) - .6) * 2, flick=0)
    for h in holes:
        pl.hatch([h], 88, 1.4, lambda x, y: .55)
    return pl


# ---------------------------------------------------------------------------------------------------------
# The ground: lawn, terrace, a pond with the house in it and Victoria lilies, bedding, urns, a lamp, people.

POND = (800, 513, 240, 15)
KERB = 4
LAMP = (1124, 474)


def stadium(cx, cy, hx, hy, n=14):
    return arc(cx + hx - hy, cy, hy, hy, -90, 90, n) + arc(cx - hx + hy, cy, hy, hy, 90, 270, n)


def ground_plane():
    rng = random.Random(41)
    lawn, water, things = Plate(41), Plate(42, knock=False), Plate(43)
    px, py, phx, phy = POND
    kerb_out = stadium(px, py, phx + KERB + 2, phy + KERB)
    water_poly = stadium(px, py, phx, phy)
    terrace = [(L_X0 - 20, GROUND), (R_X1 + 20, GROUND), (R_X1 + 34, py - phy - KERB), (L_X0 - 34, py - phy - KERB)]
    path = [(774, py + phy + KERB), (826, py + phy + KERB), (920, 640), (680, 640)]
    beds = [blob(340, 546, 104, 11, rng, 40, .02), blob(1262, 546, 104, 11, rng, 40, .02)]
    shadows = [blob(300, 500, 150, 9, rng, 30, .1), blob(1336, 500, 120, 8, rng, 30, .1)]
    field = [(-100, GROUND), (1720, GROUND), (1720, 640), (-100, 640)]

    lawn.shape(field, "#B8CB98")
    lawn.shape(terrace, "#E2D8C0")
    lawn.shape(path, "#E2D8C0")
    lawn.shape(kerb_out, "#DDD4C2")
    lawn.nshape(field, "url(#gh-night-lawn)")
    lawn.nshape(terrace, "#191612")
    lawn.nshape(path, "#15130F")
    for b in beds:
        lawn.nshape(b, "#0A0E13")
        lawn.rim(b, .16, w=.45)
    lawn.nshape(kerb_out, "#1F1B16")
    lawn.rim(kerb_out, .3, w=.5, light=(0, 1))
    shade = Mask(shadows)

    def grass(x, y):
        v = .14 + .16 * smoothstep(GROUND, 600, y) + .06 * math.sin(x / 90 + y / 17) * smoothstep(GROUND, 520, y)
        return clamp(v + (.42 if shade(x, y) else 0))
    levels, y = [], GROUND + 1.6
    while y < 640:
        levels.append(y)
        y += 1.45 + (y - GROUND) * .036
    lawn.hatch([field, terrace, path, kerb_out] + beds, 0, 2, grass, levels=levels, step=4, flick=.17)
    lawn.hatch(shadows, 35, 2.2, lambda x, y: .4)
    lawn.stipple([terrace], lambda x, y: .1, 2.6)
    lawn.stipple([path], lambda x, y: .06 + .05 * smoothstep(530, 640, y), 3.2)
    lawn.cut([terrace[3], terrace[2]], .4)
    lawn.cut([path[0], path[3]], .45)
    lawn.cut([path[1], path[2]], .45)

    # Carpet bedding: rings of red, gold, purple and silver, each cut its own way, a spiky dot plant at the heart.
    for (cx, cy), base in (((340, 546), beds[0]), ((1262, 546), beds[1])):
        rings = [base] + [[(cx + (x - cx) * s, cy + (y - cy) * s) for x, y in base] for s in (.8, .58, .34)]
        for k, colour in enumerate(("#C98478", "#D8C27E", "#9C90B6", "#C8CCBA")):
            ring = [rings[k]] + ([rings[k + 1]] if k + 1 < len(rings) else [])
            lawn.shape(rings[k], colour)
            if k == 0:
                lawn.stipple(ring, lambda x, y: .24, 1.7)
            elif k == 1:
                lawn.hatch(ring, 0, 1.6, lambda x, y: .3)
            elif k == 2:
                lawn.hatch(ring, 60, 1.6, lambda x, y: .36)
                lawn.hatch(ring, -60, 2.2, lambda x, y: .22)
            else:
                lawn.stipple(ring, lambda x, y: .2, 1.4)
            lawn.cut(rings[k] + [rings[k][0]], .32 if k else .55)
        for k in range(13):
            a = math.radians(-160 + k * 11.5 + rng.uniform(-4, 4))
            ln = rng.uniform(8, 14)
            lawn.cut([(cx, cy - 2), (cx + math.cos(a) * ln * .5, cy - 2 + math.sin(a) * ln * .7), (cx + math.cos(a) * ln, cy - 2 + math.sin(a) * ln)], .4)

    # The kerb: a pale coping, its near face in shade.
    lawn.hatch([kerb_out, water_poly], 0, 1.4, lambda x, y: .1 + .3 * smoothstep(py + phy - 2, py + phy + KERB, y), flick=.1)
    lawn.cut(kerb_out + [kerb_out[0]], .45)

    # The water: ruled level lines, broken where the light lies on it, over the house turned upside down.
    water.shape(water_poly, "#9EC4CE")
    water.nshape(water_poly, "#080C14")
    wl = [py - phy + 1.1 + 2.2 * k for k in range(int(2 * phy / 2.2))]
    water.hatch([water_poly], 0, 2.2, lambda x, y: .2 + .12 * smoothstep(py - phy, py + phy, y) + .05 * math.sin(x / 23),
                levels=wl, step=3.2, flick=.26)
    water.cut(water_poly + [water_poly[0]], .7)
    ripples = []
    for k in range(70):
        ripples.append(f"M{f(rng.uniform(px - phx + 8, px + phx - 30))} {f(rng.choice(wl) + 1.1)}h{f(rng.uniform(8, 34))}")

    # Victoria lilies: great round pads with turned-up rims, and one flower open.
    for cx, cy, rx, ry in ((918, 506, 15, 3.2), (952, 512, 18, 3.8), (990, 507, 13, 3), (1012, 518, 14, 3.4), (936, 521, 12, 2.8), (888, 516, 10, 2.4)):
        outer = arc(cx, cy, rx, ry, 0, 360, 30)[:-1]
        inner = arc(cx, cy - .8, rx * .88, ry * .72, 0, 360, 30)[:-1]
        things.shape(outer, "#7FA463")
        things.nshape(outer, "#0A110E")
        things.rim(outer, .35, w=.45, colour="#F0C58A", light=(0, 1))
        things.hatch([inner], 0, 1.2, lambda x, y: .36)
        things.hatch([outer, inner], 0, 1.0, lambda x, y, cy=cy: .1 if y < cy else .34)
        things.cut(outer + [outer[0]], .5)
        things.cut(inner[2:15], .3)
    things.shape(ellipse(968, 509, 5, 3), "#F2DCE2")
    things.nshape(ellipse(968, 509, 5, 3), "#E9DCD8", ' opacity=".8"')
    for k in range(8):
        a = k * math.pi / 8
        things.raw(f"M968 509.5l{f(math.cos(a) * 5)} {f(-abs(math.sin(a)) * 3.4)}", .5)

    # Urns on pedestals at the ends of the pond, spilling with trailing plants.
    for ux in (540, 1060):
        for pts, tone in (([(ux - 5, 498), (ux + 5, 498), (ux + 5, 484), (ux - 5, 484)], cylinder(ux, 6, .2, .45)),
                          ([(ux - 7, 484), (ux + 7, 484), (ux + 7, 482), (ux - 7, 482)], lambda x, y: .3),
                          ([(ux - 2.6, 482), (ux - 3.4, 479), (ux - 9, 474.5), (ux - 10, 471), (ux + 10, 471), (ux + 9, 474.5), (ux + 3.4, 479), (ux + 2.6, 482)],
                           sphere(ux, 474, 10, 6, .14, .5))):
            things.shape(pts, "#D8CEBB")
            things.nshape(pts, DARK["near"])
            things.hatch([pts], 0 if pts[0][1] < 484 else 90, 1.2, tone)
            things.cut(pts + [pts[0]], .45)
        leaves = blob(ux, 467, 11, 5, rng, 18, .25)
        things.shape(leaves, "#6E9A5E")
        things.nshape(leaves, DARK["near"])
        things.touches([leaves], lambda x, y: .55, 2.2, 1.3)
        for k in range(5):
            sx = ux + rng.uniform(-9, 9)
            things.cut([(sx, 471), (sx + rng.uniform(-3, 3), 476), (sx + rng.uniform(-4, 4), 481 + rng.uniform(0, 6))], .35)

    # A lamp on the right of the pond: a fluted post, a lantern, the ladder bar.
    lx, ly = LAMP
    for pts, c, t, gap in (([(lx - 1.6, 546), (lx - 1.2, 482), (lx + 1.2, 482), (lx + 1.6, 546)], "#3E4A48", .7, .9),
                           ([(lx - 5, 548), (lx + 5, 548), (lx + 3, 538), (lx - 3, 538)], "#3E4A48", .7, 1),
                           ([(lx - 8, ly - 6), (lx + 8, ly - 6), (lx, ly - 13)], "#3E4A48", .6, 1)):
        things.shape(pts, c)
        things.nshape(pts, DARK["near"])
        things.hatch([pts], 90 if gap < 1 else 0, gap, lambda x, y, t=t: t)
        things.cut(pts + [pts[0]], .4)
    lamp = [(lx - 5, ly + 6), (lx + 5, ly + 6), (lx + 6.5, ly - 6), (lx - 6.5, ly - 6)]
    things.shape(lamp, "#F2E2B0")
    things.nshape(lamp, "#FFE6AA")
    things.cut(lamp + [lamp[0]], .6)
    things.raw(f"M{lx} {ly + 6}v-12", .3)
    things.raw(f"M{lx} {ly - 13}v-6", .5)
    things.raw(f"M{lx - 7} {ly + 14}h14", .6)

    # People, for scale: a couple strolling on the terrace, a gardener with his barrow on the lawn.
    def figure(parts):
        for pts, c, t, ang in parts:
            things.shape(pts, c)
            things.nshape(pts, DARK["near"])
            things.hatch([pts], ang, 1.05, lambda x, y, t=t: t)
            things.cut(pts + [pts[0]], .3)

    lady = [(486, 496), (474, 496), (476, 490), (478, 484), (480, 481), (483, 480), (484, 484), (488, 488), (492, 492), (492, 496)]
    bodice = [(479.6, 481), (480, 476.5), (482.6, 476.5), (483.2, 481)]
    parasol = arc(486, 468, 8, 4.2, 180, 0, 14)
    figure([(lady, "#B9A4C9", .26, 80), (bodice, "#7E6A92", .55, 80), (arc(481.4, 474.4, 1.7, 2, 0, 360, 12)[:-1], "#F1E1CE", .14, 0),
            (parasol, "#F2E6D8", .16, 0)])
    things.raw("M486 463.8V478", .3)
    figure([([(495.6, 486), (496.2, 496), (497.4, 496), (497.6, 488), (498, 496), (499.2, 496), (499.4, 486)], "#3E3A40", .7, 90),
            ([(495, 486), (494.6, 477), (496, 475.4), (499, 475.4), (500.4, 477), (500.6, 487), (498.4, 485)], "#3E3A40", .78, 70),
            (arc(497.6, 473.4, 1.6, 1.9, 0, 360, 12)[:-1], "#F1E1CE", .14, 0),
            ([(495.6, 471.8), (499.6, 471.8), (499.4, 466.6), (495.8, 466.6)], "#2A2628", .86, 0)])
    things.raw("M494.6 471.8h6", .5)
    things.raw("M501 480l3 16", .3)

    gx, gy = 1206, 528
    figure([([(gx, gy), (gx + 1.4, gy), (gx + 2.6, gy - 9), (gx + 6, gy - 15), (gx + 9, gy - 16), (gx + 10, gy - 13), (gx + 6, gy - 11), (gx + 4, gy - 8), (gx + 3.4, gy)], "#5E6A58", .62, 70),
            (arc(gx + 10.4, gy - 18, 1.8, 1.9, 0, 360, 12)[:-1], "#F1E1CE", .14, 0),
            ([(gx + 15, gy - 12), (gx + 30, gy - 12), (gx + 27, gy - 5), (gx + 17, gy - 5)], "#8E6E58", .4, 0)])
    things.raw(f"M{gx + 7.6} {gy - 19.4}h6", .6)
    things.raw(f"M{gx + 8} {gy - 14}l9 4", .4)
    things.raw(ellipse(gx + 28, gy - 3.4, 3.4, 3.4), .45)
    things.raw(f"M{gx + 17} {gy - 5}l-1 5", .4)
    things.touches([blob(gx + 22, gy - 13.5, 7, 2.5, rng, 14, .2)], lambda x, y: .6, 1.8, 1.0)
    return [lawn, water, ("reflection", ripples), things]


# ---------------------------------------------------------------------------------------------------------
# The foreground: botanical specimens at the edges, cut as for a botanical plate, each growing on scroll.

def tree_fern(pl, x, base, top, rng):
    trunk = parse_poly(ribbon(resample(catmull([(x, base), (x + 4, (base + top) / 2), (x + 2, top)], 8), 4), lambda u: 24 - 6 * u))
    pl.shape(trunk, "#6E5A48")
    pl.hatch([trunk], 87, 1.6, cylinder(x + 3, 12, .4, .5))
    pl.touches([trunk], lambda xx, yy: .55, 3.2, 1.8, curl=1.4)
    # Dead fronds hang down the top of the trunk.
    for k in range(9):
        sx = x - 12 + k * 3 + rng.uniform(-1, 1)
        pl.cut([(sx, top + 4), (sx - 2 + rng.uniform(-2, 2), top + 18 + rng.uniform(0, 10)), (sx - 4 + rng.uniform(-3, 3), top + 30 + rng.uniform(0, 16))], .5)
    for k in range(11):
        ang = math.radians(-176 + k * 17 + rng.uniform(-5, 5))
        ln = rng.uniform(96, 136) * (.75 if 4 <= k <= 6 else 1)
        tip = (x + 2 + math.cos(ang) * ln, top + math.sin(ang) * ln * .62 + ln * .46)
        mid = (x + 2 + math.cos(ang) * ln * .5, top + math.sin(ang) * ln * .6 - ln * .06)
        rib = resample(catmull([(x + 2, top), mid, tip], 10), 3.4)
        pl.shape(ribbon(rib, lambda u: 2 + 26 * arch(min(1, u * 1.1), .8) * (1 - .5 * u)), "#6E9A5E")
        pl.cut(rib, .8)
        lit = math.cos(ang) < 0
        for i in range(2, len(rib) - 1):
            (ax, ay), (bx, by) = rib[i - 1], rib[i]
            tx, ty = bx - ax, by - ay
            l = math.hypot(tx, ty) or 1
            tx, ty = tx / l, ty / l
            u = i / len(rib)
            pinna = 14 * arch(min(1, u * 1.1), .8) * (1 - .5 * u) + 1.4
            for side in (-1, 1):
                nx, ny = -ty * side, tx * side
                ex, ey = bx + (nx * .86 + tx * .5) * pinna, by + (ny * .86 + ty * .5) * pinna + 1.6
                w = .32 if (lit and side < 0) or (not lit and side > 0) else .55
                pl.raw(f"M{f(bx)} {f(by)}q{f((ex - bx) * .5 + nx)} {f((ey - by) * .5 + ny)} {f(ex - bx)} {f(ey - by)}", w)


def banana(pl, x, base, rng):
    stem_top = base - 132
    stem = parse_poly(ribbon([(x, base), (x - 2, base - 66), (x + 1, stem_top)], lambda u: 20 - 6 * u))
    pl.shape(stem, "#7E9A62")
    pl.hatch([stem], 92, 1.5, cylinder(x, 10, .3, .5))
    for k in range(4):
        pl.cut([(x - 9 + k * 2, base - 20 - k * 22), (x + 2, base - 34 - k * 22), (x + 8, base - 44 - k * 22)], .4)
    for ang, ln, w in ((-160, 150, 46), (-128, 138, 42), (-62, 146, 44), (-28, 128, 40), (-94, 104, 34)):
        a = math.radians(ang + rng.uniform(-4, 4))
        rib = resample(catmull([(x, stem_top + 4), (x + math.cos(a) * 24, stem_top + math.sin(a) * 30),
                                (x + math.cos(a) * ln * .55, stem_top + math.sin(a) * ln * .5 - 6),
                                (x + math.cos(a) * ln, stem_top + math.sin(a) * ln * .55 + ln * .36)], 10), 2.6)
        start = int(len(rib) * .14)
        left, right = [], []
        tears = {rng.randrange(start + 4, len(rib) - 6) for _ in range(5)}
        for i in range(start, len(rib)):
            (ax, ay), (bx, by) = rib[max(0, i - 1)], rib[min(len(rib) - 1, i + 1)]
            tx, ty = bx - ax, by - ay
            l = math.hypot(tx, ty) or 1
            tx, ty = tx / l, ty / l
            nx, ny = -ty, tx
            u = (i - start) / (len(rib) - start - 1)
            half = w / 2 * arch(clamp(u * 1.05), .55)
            px, py = rib[i]
            lh = half * (.5 if i in tears else 1)
            rh = half * (.55 if (i + 3) in tears else 1)
            left.append((px + nx * lh, py + ny * lh))
            right.append((px - nx * rh, py - ny * rh))
            if u > .03:
                # Parallel veins sweep from the midrib to the margin; the half turned down is in shade.
                for side, h in ((1, lh), (-1, rh)):
                    shade = ny * side > 0
                    if not shade and rng.random() < .35:
                        continue
                    ex, ey = side * nx * h * .97 + tx * h * .35, side * ny * h * .97 + ty * h * .35
                    pl.raw(f"M{f(px)} {f(py)}l{f(ex)} {f(ey)}", .5 if shade else .24)
            if i in tears:
                pl.raw(f"M{f(px + nx * half)} {f(py + ny * half)}l{f(-nx * half * .7)} {f(-ny * half * .7)}", .45)
        blade = left + right[::-1]
        pl.shape(blade, "#83AB6A")
        pl.cut(left, .45)
        pl.cut(right, .45)
        pl.cut(rib[:start + 2], 1.0)
        pl.cut(rib[start:], .8)


def strelitzia(pl, x, base, rng):
    for ang, stalk, ln, w in ((-118, 70, 46, 16), (-100, 96, 52, 17), (-80, 84, 48, 16), (-62, 64, 42, 14), (-136, 52, 38, 13)):
        a = math.radians(ang + rng.uniform(-3, 3))
        tx, ty = math.cos(a), math.sin(a)
        nx, ny = -ty, tx
        sx, sy = x + tx * stalk, base + ty * stalk
        pl.cut([(x, base), (x + tx * stalk * .5, base + ty * stalk * .5), (sx, sy)], .7)
        rib = resample([(sx, sy), (sx + tx * ln, sy + ty * ln)], 2.4)
        left, right = [], []
        for i, (px, py) in enumerate(rib):
            half = w / 2 * arch(i / (len(rib) - 1), .7)
            left.append((px + nx * half, py + ny * half))
            right.append((px - nx * half, py - ny * half))
            if 0 < i < len(rib) - 1:
                pl.raw(f"M{f(px)} {f(py)}l{f(nx * half * .95 + tx * half * .6)} {f(ny * half * .95 + ty * half * .6)}", .5)
                if i % 2:
                    pl.raw(f"M{f(px)} {f(py)}l{f(-nx * half * .95 + tx * half * .6)} {f(-ny * half * .95 + ty * half * .6)}", .26)
        blade = left + right[::-1]
        pl.shape(blade, "#6F9A66")
        pl.cut(blade + [blade[0]], .45)
        pl.cut(rib, .6)
    for fx, fy, s in ((x + 18, base - 108, 1.0), (x - 22, base - 86, .86)):
        pl.cut([(x + (fx - x) * .2, base), (fx - 4 * s, fy + 30 * s), (fx - 6 * s, fy + 4 * s)], .8)
        spathe = [(fx - 6 * s, fy + 4 * s), (fx + 26 * s, fy - 2 * s), (fx + 28 * s, fy), (fx - 4 * s, fy + 8 * s)]
        pl.shape(spathe, "#6E7F6A")
        pl.hatch([spathe], 6, 1.2, lambda xx, yy: .45)
        pl.cut(spathe + [spathe[0]], .5)
        for k, (dx, dy) in enumerate(((8, -22), (14, -24), (19, -20))):
            petal = [(fx + 2 * s + k * 2 * s, fy + 1 * s), (fx + dx * s - 3 * s, fy + dy * s), (fx + dx * s, fy + dy * s - 2 * s),
                     (fx + dx * s + 2 * s, fy + dy * s + 3 * s), (fx + 6 * s + k * 2 * s, fy)]
            pl.shape(petal, "#E99A3C")
            pl.hatch([petal], 70, 1.3, lambda xx, yy: .18, flick=.3)
            pl.cut(petal + [petal[0]], .45)
        tongue = [(fx + 4 * s, fy - 1 * s), (fx + 12 * s, fy - 14 * s), (fx + 13 * s, fy - 12 * s), (fx + 7 * s, fy)]
        pl.shape(tongue, "#5A6EC0")
        pl.hatch([tongue], 60, 1, lambda xx, yy: .5)
        pl.cut(tongue + [tongue[0]], .4)


def foxglove(pl, x, base, h, rng, colour):
    stem = resample(catmull([(x, base), (x + 3, base - h * .5), (x + rng.uniform(-5, 5), base - h)], 8), 3)
    pl.cut(stem, .9)
    for k in range(5):
        side = -1 if k % 2 else 1
        ln = rng.uniform(28, 40)
        a = math.radians(-90 + side * rng.uniform(40, 70))
        y0 = base - 4 - k * 5
        tx, ty = math.cos(a), math.sin(a) * .7
        l = math.hypot(tx, ty)
        tx, ty = tx / l, ty / l
        nx, ny = -ty, tx
        rib = resample([(x, y0), (x + tx * ln, y0 + ty * ln)], 2.6)
        left, right = [], []
        for i, (px, py) in enumerate(rib):
            half = 6 * arch(i / (len(rib) - 1), .8)
            left.append((px + nx * half, py + ny * half))
            right.append((px - nx * half, py - ny * half))
            if 0 < i < len(rib) - 1 and i % 2:
                pl.raw(f"M{f(px)} {f(py)}l{f(nx * half * .9 + tx * 2)} {f(ny * half * .9 + ty * 2)}", .3)
                pl.raw(f"M{f(px)} {f(py)}l{f(-nx * half * .9 + tx * 2)} {f(-ny * half * .9 + ty * 2)}", .45)
        blade = left + right[::-1]
        pl.shape(blade, "#76A062")
        pl.cut(blade + [blade[0]], .4)
    n = 13
    for k in range(n):
        u = .36 + .6 * k / (n - 1)
        sx, sy = stem[min(len(stem) - 1, int(u * (len(stem) - 1)))]
        s = 1.25 - .65 * u
        side = 1 if k % 3 else -1
        bx, by = sx + side * 3 * s, sy + 2 * s
        bell = [(bx, by), (bx + side * 4 * s, by - 1.6 * s), (bx + side * 11 * s, by + 3 * s), (bx + side * 13 * s, by + 8.6 * s),
                (bx + side * 9 * s, by + 10.4 * s), (bx + side * 3.4 * s, by + 6 * s), (bx - side * .4 * s, by + 2.6 * s)]
        pl.shape(bell, colour)
        pl.hatch([bell], 40 * side, 1.3, lambda xx, yy, bx=bx, by=by, s=s, side=side: .06 + .3 * smoothstep(2 * s, 12 * s, (xx - bx) * side + (yy - by)), flick=.2)
        pl.cut(bell + [bell[0]], .42)
        for j in range(3):
            pl.raw(f"M{f(bx + side * (7 + j * 1.6) * s)} {f(by + (6 + j * 1.2) * s)}h.1", .64)


def plants():
    """Each specimen is its own plate, so it can grow on its own, and is labelled as in a botanical plate."""
    specimens = []

    def specimen(name, ox, oy, on, draw, label=None):
        pl = Plate(len(specimens) + 60)
        draw(pl)
        specimens.append((name, ox, oy, on, pl, label))

    specimen("fern", 104, 600, 4, lambda pl: tree_fern(pl, 104, 610, 452, random.Random(1)), (114, 532, 128, 548, "start", "Dicksonia antarctica"))
    specimen("musa", 252, 600, 16, lambda pl: banana(pl, 252, 612, random.Random(2)), (260, 520, 272, 536, "start", "Musa basjoo"))
    specimen("strelitzia", 1338, 600, 26, lambda pl: strelitzia(pl, 1338, 604, random.Random(3)), None)
    specimen("fox-a", 1446, 600, 12, lambda pl: foxglove(pl, 1446, 606, 178, random.Random(4), "#C66A92"), (1440, 440, 1428, 428, "end", "Digitalis purpurea"))
    specimen("fox-b", 1494, 600, 22, lambda pl: foxglove(pl, 1494, 610, 138, random.Random(5), "#DA8EAE"))
    return specimens


# ---------------------------------------------------------------------------------------------------------
# Assembly.

def marks(gid, markup):
    """A group of marks whose ink is a property, so day and night can each choose it."""
    return f'<g id="{gid}" fill="none" stroke-linecap="round" style="stroke:var(--gh-ink, {INK})">{markup}</g>'


def plane_defs(name, plates):
    """Per plate by day: its forms, knocked out of whatever lies behind, then its cuts and lines; all the
    forms again, hand-tinted over the print. A reflection is the house turned over in the water and broken
    by ripples of bare paper.

    By night each plate draws itself (silhouettes, lights, moonlit rims) in the same order, so nearer forms
    hide farther ones as the knock-outs do by day. Where a plate asks for it, the moon picks out its
    engraving along the lit edge of each form: the cuts, in moonlight, seen only through a crescent that is
    the form less itself moved away from the moon."""
    shapes, day, tint, extras, night, masks = [], [], [], [], [], []
    for k, pl in enumerate(plates):
        if isinstance(pl, tuple):
            _, ripples = pl
            day.append('<g clip-path="url(#gh-pond-clip)"><g transform="matrix(1 0 0 -1 0 968)" opacity=".42">'
                       '<use href="#gh-mid-1-cuts"/><use href="#gh-mid-1-lines"/><use href="#gh-mid-2-lines"/></g>'
                       f'<path d="{"".join(ripples)}" stroke="{PAPER}" stroke-width="1.3" stroke-linecap="round"/></g>')
            night.append('<g clip-path="url(#gh-pond-clip)"><use href="#gh-house-glow" transform="matrix(1 0 0 -1 0 968)" opacity=".62"/>'
                         '<use href="#gh-mid-2-lines" transform="matrix(1 0 0 -1 0 968)" style="--gh-ink:#140E08" opacity=".5"/>'
                         f'<path d="{"".join(ripples)}" stroke="#080C14" stroke-width="1.5" stroke-linecap="round"/></g>')
            continue
        sid = f"gh-{name}-{k}"
        if pl.shapes:
            shapes.append(f'<g id="{sid}-s">{pl.svg_shapes()}</g>')
            if pl.knock:
                day.append(f'<use href="#{sid}-s" style="--knock:1"/>')
            tint.append(f'<use href="#{sid}-s"/>')
        day.append(marks(f"{sid}-cuts", pl.svg_cuts()))
        day.append(marks(f"{sid}-lines", pl.svg_cuts(pl.lines)))
        extras.append(pl.extra_tint)
        night.append("".join(pl.night).replace("{SID}", sid))
        if pl.moon_texture:
            masks.append(f'<mask id="{sid}-moon" maskUnits="userSpaceOnUse" x="-100" y="0" width="1800" height="640">'
                         f'<use href="#{sid}-s" style="--knock:1; --paper-k:#fff"/>'
                         f'<use href="#{sid}-s" transform="translate(4 7)" style="--knock:1; --paper-k:#000" filter="url(#gh-soften)"/></mask>')
            night.append(f'<g mask="url(#{sid}-moon)" opacity="{pl.moon_texture}">'
                         f'<use href="#{sid}-cuts" style="--gh-ink:{MOON}"/><use href="#{sid}-lines" style="--gh-ink:{MOON}"/></g>')
    return (
        "".join(shapes) + "".join(masks)
        + f'<g id="gh-{name}-day">{"".join(day)}<g class="gh-handtint">{"".join(extras)}{"".join(tint)}</g></g>'
        + f'<g id="gh-{name}-night">{"".join(night)}</g>'
    )


def plant_defs(specimens):
    return "".join(f'<g id="gh-plant-{name}-s">{pl.svg_shapes()}</g>'
                   + marks(f"gh-plant-{name}-cuts", pl.svg_cuts())
                   + marks(f"gh-plant-{name}-lines", pl.svg_cuts(pl.lines))
                   for name, ox, oy, on, pl, label in specimens)


def plant_markup(specimens, mode):
    out = []
    for name, ox, oy, on, pl, label in specimens:
        if mode == "day":
            inner = (f'<use href="#gh-plant-{name}-s" style="--knock:1"/><use href="#gh-plant-{name}-cuts"/><use href="#gh-plant-{name}-lines"/>'
                     f'<g class="gh-handtint"><use href="#gh-plant-{name}-s"/></g>')
        else:
            # Nearest of all, the specimens are the darkest things in the night, their veins just catching it.
            inner = f'<use href="#gh-plant-{name}-s" class="gh-sil"/><use href="#gh-plant-{name}-lines" class="gh-veins"/>'
        out.append(f'<g class="gh-grow" style="transform-origin:{f(ox)}px {f(oy)}px; --on:{on}%">{inner}</g>')
    return "".join(out)


def labels(specimens):
    out = []
    for name, ox, oy, on, pl, label in specimens:
        if label:
            px, py, tx, ty, anchor, text = label
            ex = tx - 2 if anchor == "start" else tx + 2
            out.append(f'<path d="M{f(px)} {f(py)}L{f(ex)} {f(ty - 3.5)}"/><text x="{f(tx)}" y="{f(ty)}" text-anchor="{anchor}">{text}</text>')
    return "".join(out)


def paper():
    """Laid paper: fine laid lines close together, chain lines far apart, a little fibre."""
    from urllib.parse import quote
    lines = "".join(f"<path d='M0 {y + .5}H240' stroke='#000' stroke-opacity='.022' stroke-width='.6'/>" for y in range(0, 240, 2))
    chains = "".join(f"<path d='M{x} 0V240' stroke='#000' stroke-opacity='.035' stroke-width='1.2'/>" for x in (30, 150))
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>"
           f"<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='2' seed='3'/>"
           f"<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -.25 .14'/></filter>"
           f"<rect width='240' height='240' filter='url(#n)'/>{lines}{chains}</svg>")
    return "data:image/svg+xml," + quote(svg, safe="'/:=. ")


def stars():
    rng = random.Random(33)
    out, placed = [], []
    while len(placed) < 30:
        x, y = rng.uniform(10, 1590), rng.uniform(10, 470)
        if any(math.hypot(x - px, y - py) < 80 for px, py in placed):
            continue
        placed.append((x, y))
        out.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(rng.choice([.7, .9, 1.1]))}" opacity="{rng.uniform(.4, .9):.2f}"/>')
    return "".join(out)


def mid_plates():
    cedar, beech = cedar_plate(), beech_plate()
    back = back_trees_plate(cedar.cover + beech.cover)
    cover = [Mask([c]) for c in cedar.cover + beech.cover + back.cover] + [Mask([wing_outline(True), wing_outline(False), centre_outline()])]
    house, iron = house_plate()
    return [back, house, iron, cedar, beech], cover


def placeholders():
    specimens = plants()
    mid, cover = mid_plates()
    px, py, phx, phy = POND
    lx, ly = LAMP
    return {
        "FAR_DEFS": plane_defs("far", far_plane(cover)),
        "MID_DEFS": plane_defs("mid", mid),
        "GROUND_DEFS": plane_defs("ground", ground_plane()),
        "PLANT_DEFS": plant_defs(specimens),
        "PLANTS_DAY": plant_markup(specimens, "day"),
        "PLANTS_NIGHT": plant_markup(specimens, "night"),
        "LABELS": labels(specimens),
        "POND_CLIP": poly(stadium(px, py, phx - .6, phy - .6)),
        "LAMP_X": f(lx), "LAMP_Y": f(ly),
        "TEX_LAID": paper(),
        "STARS": stars(),
    }


# Scene picker glyph, 16 x 16: a glasshouse vault with its ribs.
GLYPH = ('<path d="M2.5 14V8.6C2.5 5.2 5 2.6 8 2.6S13.5 5.2 13.5 8.6V14Z"/><path d="M8 2.6V14M2.5 9.6h11M5.2 3.8V14M10.8 3.8V14"/>')
