"""Crayon: wax on toothy paper, drawn as vector.

A crayon mark is not one line. The tip is a few millimetres wide and lays wax only where the paper's
tooth stands up, so a stroke is a sheaf of fine streaks running together, darker where they cross.
Here a stroke is a few strands that follow one path, each offset across the tip and wandering a little,
each with its own weight and pressure. Outlines are laid in short lengths of differing pressure, so the
colour swells and thins along them; colouring in is the same strands driven back and forth inside a
shape, in the shape's own frame, swinging round in a loop at each end the way a hand scribbles.

Every strand carries pathLength="1", a delay and a duration, so the page can draw it on in the order a
hand made it. A shape takes the same short time whatever its size, as a quick hand does. The paper's
tooth is not part of the strands: it is TOOTH, a tile the page lays over a finished drawing as a mask.

Colours are names, not values: a strand carries class="k-<name>" and the page says what each name is, so
one drawing can be laid on white paper by day and on dark paper by night. A hex value still works where a
drawing has only one light. Below the hand are the shapes the drawings are made of: petals, flowers, buds,
leaves and stems, each coloured in and outlined the way an illustrator works with wax.
"""
import math
import random

from common import catmull, f

# The paper's tooth, as a CSS image: a 256 px tile of fine noise, opaque where the wax takes and clear where
# the paper stands up through it. A page masks a finished drawing with it, under a solid layer it fades out,
# so the grain comes up through the wax: mask: linear-gradient(rgb(0 0 0 / var(--bare)) 0 0), TOOTH 0 0 / 256px.
TOOTH = ("url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E"
         "%3Cfilter id='t' x='0' y='0' width='1' height='1' color-interpolation-filters='sRGB'%3E"
         "%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' seed='4' stitchTiles='stitch'/%3E"
         "%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -6.5 4.75'/%3E%3C/filter%3E"
         "%3Crect width='256' height='256' filter='url(%23t)'/%3E%3C/svg%3E\")")


def resample(pts, step):
    out = [pts[0]]
    carry = 0.0
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        seg = math.hypot(x1 - x0, y1 - y0)
        if seg == 0:
            continue
        d = step - carry
        while d <= seg:
            t = d / seg
            out.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
            d += step
        carry = seg - (d - step)
    if out[-1] != pts[-1]:
        out.append(pts[-1])
    return out


def normals(pts):
    out = []
    for i in range(len(pts)):
        a, b = pts[max(0, i - 1)], pts[min(len(pts) - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy) or 1
        out.append((-dy / d, dx / d))
    return out


def path_d(pts):
    x, y = pts[0]
    d = [f"M{f(x)} {f(y)}"]
    for (px, py), (qx, qy) in zip(pts, pts[1:]):
        d.append(f"l{f(qx - px)} {f(qy - py)}")
    return "".join(d)


class Hand:
    """Lays strokes and keeps time, so the page can replay them as a hand made them."""

    def __init__(self, seed, start=0.0):
        self.rng = random.Random(seed)
        self.clock = start
        self.out = []

    def stroke(self, pts, colour, width=10.0, n=6, weight=(1.3, 2.6), alpha=(.5, .9), wander=.8, secs=.35,
               chunk=None, step=5.0):
        """`n` strands across a tip `width` wide along `pts`, drawn in `secs`. With `chunk` (a range of
        lengths in px) each strand is laid in lengths of their own pressure."""
        rng = self.rng
        pts = resample(pts, step)
        if len(pts) < 2:
            return
        nm = normals(pts)
        start = self.clock
        for k in range(n):
            o = (k / max(1, n - 1) - .5) * width * rng.uniform(.7, 1.0)
            ph, fr = rng.uniform(0, 6.3), rng.uniform(.04, .1)
            edge = abs(o) / (width / 2 + 1e-6)
            lo = int(len(pts) * rng.uniform(0, .12) * edge)
            hi = len(pts) - int(len(pts) * rng.uniform(0, .12) * edge)
            line = []
            for i in range(lo, max(lo + 2, hi)):
                (x, y), (nx, ny) = pts[i], nm[i]
                w = o + wander * width * .14 * math.sin(i * fr + ph)
                line.append((x + nx * w + rng.uniform(-.3, .3), y + ny * w + rng.uniform(-.3, .3)))
            sw = rng.uniform(*weight)
            base = rng.uniform(*alpha) * (1 - .35 * edge)
            spans = [(0, len(line) - 1)]
            if chunk:
                spans, i = [], 0
                while i < len(line) - 1:
                    j = min(len(line) - 1, i + max(2, int(rng.uniform(*chunk) / step)))
                    spans.append((i, j))
                    i = j
            for i, j in spans:
                if chunk and rng.random() < .05 * edge:
                    continue
                a = max(.08, min(1.0, base * (rng.uniform(.6, 1.15) if chunk else 1)))
                t0 = start + secs * i / len(line) + rng.uniform(0, .04)
                td = max(.03, secs * (j - i) / len(line))
                self.out.append(
                    f'<path d="{path_d(line[i:j + 1])}" pathLength="1" {self._paint(colour)} stroke-width="{f(sw)}" '
                    f'stroke-opacity="{a:.2f}" style="--d:{t0:.2f}s;--t:{td:.2f}s"/>')
        self.clock = start + secs * .9

    def dabs(self, marks, colour, width=4.0, n=2, weight=(1.4, 2.4), alpha=(.45, .8), secs=.4):
        """Many short marks laid as one gesture, a hedge of dabs or a spike of florets: each strand is one path
        of many pieces, so a row of a hundred dabs costs `n` elements, not a hundred times `n`."""
        rng = self.rng
        start = self.clock
        for k in range(n):
            o = (k / max(1, n - 1) - .5) * width
            d = []
            for (x0, y0), (x1, y1) in marks:
                dx, dy = x1 - x0, y1 - y0
                ln = math.hypot(dx, dy) or 1
                nx, ny = -dy / ln * o, dx / ln * o
                j = lambda: rng.uniform(-.4, .4)
                d.append(f"M{f(x0 + nx + j())} {f(y0 + ny + j())}l{f(dx + j())} {f(dy + j())}")
            self.out.append(f'<path d="{"".join(d)}" pathLength="1" {self._paint(colour)} stroke-width="{f(rng.uniform(*weight))}" '
                            f'stroke-opacity="{rng.uniform(*alpha):.2f}" style="--d:{start:.2f}s;--t:{secs:.2f}s"/>')
        self.clock = start + secs * .9

    def _paint(self, colour):
        return f'stroke="{colour}"' if colour.startswith("#") else f'class="k-{colour}"'

    def line(self, points, colour, samples=8, closed=False, **kw):
        """An outline or a stem through control points, smoothed, in lengths of differing pressure."""
        kw.setdefault("chunk", (40, 110))
        self.stroke(catmull(points, samples, closed=closed), colour, **kw)

    def fill(self, outline, colour, angle=0.0, spacing=10.0, loop=1.0, width=12.0, n=6, secs=.5, weight=(1.8, 3.4), step=6.0, **kw):
        """Colour a shape in: the tip driven back and forth across it at `angle` degrees, in the shape's
        own frame so no stroke is wasted outside it, swinging round at each end and running a little past
        the edge. The caller clips it to the shape."""
        rng = self.rng
        a = math.radians(angle + rng.uniform(-6, 6))
        ux, uy = math.cos(a), math.sin(a)
        vx, vy = -uy, ux
        us = [x * ux + y * uy for x, y in outline]
        vs = [x * vx + y * vy for x, y in outline]
        u0, u1, v0, v1 = min(us), max(us), min(vs), max(vs)
        pts, v, side = [], v0 - spacing * .3, 1
        while v < v1 + spacing * .3:
            # How far the shape reaches at this v: where its edges cross the line.
            hits = []
            for (xa, ya), (xb, yb) in zip(outline, outline[1:] + outline[:1]):
                va, vb = xa * vx + ya * vy, xb * vx + yb * vy
                if (va - v) * (vb - v) <= 0 and va != vb:
                    t = (v - va) / (vb - va)
                    hits.append((xa + (xb - xa) * t) * ux + (ya + (yb - ya) * t) * uy)
            lo, hi = (min(hits), max(hits)) if hits else ((u0 + u1) / 2, (u0 + u1) / 2)
            over = spacing * .6
            ends = (lo - over, hi + over) if side > 0 else (hi + over, lo - over)
            for u in ends:
                pts.append((u * ux + v * vx, u * uy + v * vy))
            step = spacing * rng.uniform(.75, 1.2)
            # The turn: out past the end and round to the next pass.
            u = ends[1] + side * spacing * .45 * loop
            pts.append((u * ux + (v + step * .5) * vx, u * uy + (v + step * .5) * vy))
            v += step
            side = -side
        self.stroke(catmull(pts, 3), colour, width=width, n=n, wander=.5, secs=secs, step=step, weight=weight, **kw)

    def spiral(self, cx, cy, r, colour, turns=5, squash=1.0, secs=.4, **kw):
        """A centre wound in from the edge."""
        rng = self.rng
        pts = []
        steps = int(turns * 36)
        start = rng.uniform(0, 6.3)
        for i in range(steps + 1):
            t = i / steps
            rr = r * (1 - .85 * t) * (1 + rng.uniform(-.04, .04))
            ang = start + t * turns * 2 * math.pi
            pts.append((cx + rr * math.cos(ang), cy + rr * squash * math.sin(ang)))
        self.stroke(pts, colour, wander=.4, secs=secs, **kw)

    def loops(self, cx, cy, r, colour, turns=6, wobble=.1, squash=1.0, drift=(0.0, 0.0), secs=.6, **kw):
        """A loop scribble: the tip wound round a centre that wanders as the hand moves, each turn its own
        size and tilt, never on the same track twice."""
        rng = self.rng
        n_t = int(turns) + 2
        radii = [r * rng.uniform(.86, 1.1) for _ in range(n_t)]
        tilts = [rng.uniform(-.25, .25) for _ in range(n_t)]
        sqs = [squash * rng.uniform(.88, 1.08) for _ in range(n_t)]
        offs = [(rng.uniform(-.09, .09) * r, rng.uniform(-.09, .09) * r) for _ in range(n_t)]
        per, start, pts = 36, rng.uniform(0, 6.3), []
        for i in range(int(turns * per) + 1):
            t = i / per
            k, u = int(t), t - int(t)
            e = .5 - .5 * math.cos(math.pi * u)
            lerp = lambda a, b: a + (b - a) * e
            rr = lerp(radii[k], radii[k + 1]) * (1 + wobble * math.sin(t * 5.1 + start))
            tilt, sq = lerp(tilts[k], tilts[k + 1]), lerp(sqs[k], sqs[k + 1])
            ox, oy = lerp(offs[k][0], offs[k + 1][0]), lerp(offs[k][1], offs[k + 1][1])
            ang = start + t * 2 * math.pi
            ex, ey = rr * math.cos(ang), rr * sq * math.sin(ang)
            g = t / max(1, turns)
            pts.append((cx + ex * math.cos(tilt) - ey * math.sin(tilt) + ox + drift[0] * g,
                        cy + ex * math.sin(tilt) + ey * math.cos(tilt) + oy + drift[1] * g))
        self.stroke(pts, colour, wander=.5, secs=secs, **kw)

    def take(self):
        out, self.out = self.out, []
        return "\n".join(out)


# The shapes. Each takes the hand that draws it and the sheet it is drawn on.

class Sheet:
    """A drawing's clip paths, under an id prefix of its own, since ids are shared by the whole page."""

    def __init__(self, prefix):
        self.prefix = prefix
        self.clips = []

    def clip(self, d):
        cid = f"{self.prefix}{len(self.clips)}"
        self.clips.append(f'<clipPath id="{cid}"><path d="{d}"/></clipPath>')
        return f"url(#{cid})"

    def defs(self):
        return "".join(self.clips)


def closed_d(pts):
    return "M" + " ".join(f"{f(x)} {f(y)}" for x, y in catmull(pts, 5, closed=True)) + "Z"


def circle(cx, cy, r, n=10):
    return [(cx + r * math.cos(k * 2 * math.pi / n), cy + r * math.sin(k * 2 * math.pi / n)) for k in range(n)]


def coloured(sheet, h, outline, fill, shade=None, edge="graphite", angle=-35, shade_at=None, edge_w=4, stagger=.22,
             edge_weight=(1.4, 2.6), edge_alpha=(.65, .95), extra=""):
    """A shape coloured in and outlined: a fill pass, a darker pass toward `shade_at`, then the outline in
    another crayon. The next shape starts `stagger` seconds after this one, while this one is still drawn."""
    t0 = h.clock
    h.fill(outline, fill, angle=angle, secs=.3)
    parts = h.take()
    if shade:
        h.fill(circle(*shade_at), shade, angle=angle + 70, spacing=12, secs=.2, alpha=(.35, .7))
        parts += "\n" + h.take()
    parts += extra
    if edge:
        h.line(outline, edge, closed=True, width=edge_w, n=3, weight=edge_weight, alpha=edge_alpha, secs=.25)
    h.clock = t0 + stagger
    return f'<g clip-path="{sheet.clip(closed_d(outline))}">{parts}</g>\n{h.take()}'


def petal(rng, cx, cy, ang, length, width, inner=.18):
    """A broad petal from the centre out, its tip rounded and a little waved."""
    ux, uy = math.cos(ang), math.sin(ang)
    vx, vy = -uy, ux
    at = lambda t, s: (cx + ux * length * t + vx * width * s, cy + uy * length * t + vy * width * s)
    return [at(inner, -.12), at(.45, -.42), at(.82, -.5), at(1.0, -.22), at(.97, .02 + rng.uniform(-.06, .06)),
            at(1.0, .24), at(.82, .5), at(.45, .42), at(inner, .12)]


def poppy(sheet, h, cx, cy, R, fill, shade, edge, centre="graphite", n=6, tilt=0.0):
    """An open flower seen from the front, a little tipped back by `tilt`: broad petals, a wound centre,
    stamens flicked out round it."""
    rng, out = h.rng, []
    start = rng.uniform(0, 6.3)
    order = list(range(n))
    rng.shuffle(order)
    for k in order:
        a = start + k * 2 * math.pi / n + rng.uniform(-.12, .12)
        length = R * rng.uniform(.9, 1.06)
        pts = [(x, cy + (y - cy) * (1 - tilt)) for x, y in petal(rng, cx, cy, a, length, R * .62)]
        t0 = h.clock
        for k2 in range(3):
            va = a + (k2 - 1) * .32 + rng.uniform(-.06, .06)
            r0, r1 = R * .26, length * rng.uniform(.62, .8)
            h.stroke(catmull([(cx + r0 * math.cos(va), cy + r0 * (1 - tilt) * math.sin(va)),
                              (cx + (r0 + r1) / 2 * math.cos(va + .05), cy + (r0 + r1) / 2 * (1 - tilt) * math.sin(va + .05)),
                              (cx + r1 * math.cos(va + .02), cy + r1 * (1 - tilt) * math.sin(va + .02))], 6),
                     shade, width=2.5, n=2, weight=(.9, 1.5), alpha=(.35, .6), secs=.15)
        veins = h.take()
        h.clock = t0
        out.append(coloured(sheet, h, pts, fill, shade, edge, angle=math.degrees(a) + 90, shade_at=(cx, cy, R * .5),
                            edge_w=3, edge_weight=(1, 1.9), edge_alpha=(.5, .85), extra="\n" + veins))
    spiral = []
    for i in range(160):
        t = i / 160
        r = R * .2 * (1 - t * .85)
        a = t * 6 * 2 * math.pi
        spiral.append((cx + r * math.cos(a), cy + r * (1 - tilt) * math.sin(a)))
    h.stroke(spiral, centre, width=10, n=6, weight=(1.4, 2.6), alpha=(.6, .95), secs=.35)
    for k in range(22):
        a = k * 2 * math.pi / 22 + rng.uniform(-.1, .1)
        r0, r1 = R * .2, R * rng.uniform(.3, .38)
        h.stroke([(cx + r0 * math.cos(a), cy + r0 * (1 - tilt) * math.sin(a)),
                  (cx + r1 * math.cos(a), cy + r1 * (1 - tilt) * math.sin(a))], centre, width=2.5, n=2, weight=(1.2, 2), alpha=(.6, .9), secs=.05)
    out.append(h.take())
    return "\n".join(out)


def tulip(sheet, h, cx, cy, r, fill, shade, edge):
    """A tulip from the side: two outer petals and the one in front, darker toward the cup's foot."""
    out = []
    for side in (-1, 1, 0):
        if side == 0:
            pts = [(cx - r * .45, cy + r * .9), (cx - r * .55, cy), (cx - r * .3, cy - r * .85), (cx, cy - r * 1.15),
                   (cx + r * .3, cy - r * .85), (cx + r * .55, cy), (cx + r * .45, cy + r * .9), (cx, cy + r * 1.05)]
        else:
            pts = [(cx, cy + r * 1.05), (cx + side * r * .2, cy + r * .2), (cx + side * r * .55, cy - r * .55),
                   (cx + side * r * .95, cy - r * .95), (cx + side * r * 1.0, cy - r * .2), (cx + side * r * .85, cy + r * .6)]
        out.append(coloured(sheet, h, pts, fill, shade, edge, angle=-80 + side * 25, shade_at=(cx, cy + r * .8, r * .7)))
    return "\n".join(out)


def bud(sheet, h, cx, cy, r, fill, edge, ang=0.0):
    """A closed bud in its two sepals, leaning by `ang`."""
    ux, uy = math.sin(ang), -math.cos(ang)
    vx, vy = -uy, ux
    at = lambda t, s: (cx + ux * r * t + vx * r * s, cy + uy * r * t + vy * r * s)
    pts = [at(-.9, 0), at(-.5, .55), at(.3, .5), at(1.0, 0), at(.3, -.5), at(-.5, -.55)]
    out = coloured(sheet, h, pts, fill, None, edge, angle=math.degrees(ang) - 60)
    for s in (-1, 1):
        h.line([at(-.95, 0), at(-.6, s * .5), at(-.1, s * .62)], "green", width=6, n=4, secs=.15)
    return out + "\n" + h.take()


def leaf(sheet, h, base, ang, length, width, fill="green", second="pine", bend=None, veins=True):
    """A leaf from `base` at `ang`: its midrib curves by `bend` (a fraction of its length), it is widest a third
    of the way up and narrows to a turned tip. Each half is coloured along its veins, so the halves meet at the
    rib in a herringbone; the rib and the veins are drawn in `second`, and so is a fine outline."""
    rng = h.rng
    bx, by = base
    bend = rng.uniform(-.16, .16) if bend is None else bend
    ux, uy = math.cos(ang), math.sin(ang)
    vx, vy = -uy, ux

    def rib(t):
        off = bend * length * 4 * t * (1 - t)
        return (bx + ux * length * t + vx * off, by + uy * length * t + vy * off)

    def edge(t, side):
        x, y = rib(t)
        w = width * .5 * (math.sin(math.pi * min(1, t) ** .72) ** .9) * (1 + .12 * side * bend)
        return (x + vx * w * side, y + vy * w * side)

    ts = [i / 12 for i in range(13)]
    left = [edge(t, 1) for t in ts]
    right = [edge(t, -1) for t in ts]
    midrib = [rib(t) for t in ts]
    outline = left + right[::-1][1:-1]
    t0, out = h.clock, []
    for side, half in ((1, left), (-1, right)):
        shape = midrib + half[::-1]
        h.fill(shape, fill, angle=math.degrees(ang) + side * 52, spacing=7.5, width=9, secs=.25)
        body = h.take()
        band = [rib(t) for t in ts] + [edge(t, side * .42) for t in ts[::-1]]
        h.fill(band, second, angle=math.degrees(ang) + side * 40, spacing=10, width=7, secs=.15, alpha=(.25, .5))
        out.append(f'<g clip-path="{sheet.clip(closed_d(shape))}">{body}\n{h.take()}</g>')
    h.clock = t0 + .1
    h.stroke(catmull(midrib, 4), second, width=2.5, n=2, weight=(1, 1.8), alpha=(.55, .85), secs=.2)
    if veins:
        for t in (.22, .38, .54, .7):
            for side in (1, -1):
                p0, p1 = rib(t), edge(min(1, t + .14), side * .85)
                h.stroke([p0, ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2), p1], second, width=1.6, n=1, weight=(.8, 1.2), alpha=(.3, .5), secs=.06)
    h.line(outline, second, closed=True, width=2.5, n=2, weight=(1, 1.6), alpha=(.45, .75), secs=.25)
    h.stroke([rib(0), (bx - ux * length * .08, by - uy * length * .08)], second, width=3, n=2, weight=(1.4, 2.2), secs=.08)
    out.append(h.take())
    h.clock = t0 + .22
    return "\n".join(out)


def stem(h, pts, colour="green", width=8):
    h.line(pts, colour, width=width, n=5, weight=(1.3, 2.4), secs=.35)
    return h.take()
