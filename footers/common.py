"""Helpers shared by every world's generator."""
import math
import random
from urllib.parse import quote


def f(v):
    s = f"{v:.1f}".rstrip("0").rstrip(".")
    if s.startswith("0."):
        s = s[1:]
    elif s.startswith("-0."):
        s = "-" + s[2:]
    return "0" if s in ("", "-0", "-") else s


def ellipse(x, y, rx, ry):
    return f"M{f(x - rx)} {f(y)}a{f(rx)} {f(ry)} 0 1 0 {f(2 * rx)} 0a{f(rx)} {f(ry)} 0 1 0 {f(-2 * rx)} 0z"


def bezier(p, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
    u = 1 - t
    return (
        u**3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t**3 * x3,
        u**3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t**3 * y3,
    )


def tile(inner, w, h):
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='{w}' height='{h}'>"
           f"<filter id='f' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>{inner}</filter>"
           f"<rect width='100%' height='100%' filter='url(#f)'/></svg>")
    return "data:image/svg+xml," + quote(svg, safe="'/:=. ")


# Brush geometry: smooth curves through points, and filled strokes whose width varies along their length.

def catmull(points, samples=8, closed=False):
    """Dense polyline through the points along a centripetal-ish Catmull-Rom spline."""
    pts = list(points)
    if closed:
        pts = [pts[-1]] + pts + [pts[0], pts[1]]
    else:
        pts = [pts[0]] + pts + [pts[-1]]
    out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for k in range(samples):
            t = k / samples
            t2, t3 = t * t, t * t * t
            out.append(tuple(
                0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                       + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)
                for j in (0, 1)))
    if not closed:
        out.append(pts[-2])
    return out


def poly(points, closed=True):
    """A polygon in relative coordinates, which keeps long hand-drawn strokes compact."""
    if not points:
        return ""
    x0, y0 = round(points[0][0], 1), round(points[0][1], 1)
    out = [f"M{f(x0)} {f(y0)}l"]
    px, py = x0, y0
    parts = []
    for x, y in points[1:]:
        x, y = round(x, 1), round(y, 1)
        dx, dy = round(x - px, 1), round(y - py, 1)
        if dx == 0 and dy == 0:
            continue
        parts.append(f"{f(dx)} {f(dy)}" if dy < 0 else f"{f(dx)} {f(dy)}")
        px, py = x, y
    body = " ".join(parts).replace(" -", "-")
    return out[0] + body + ("z" if closed else "")


def smooth(points, closed=False):
    """Cubic Bezier path through the points (Catmull-Rom converted to Bezier), in relative coordinates."""
    pts = [(round(x, 1), round(y, 1)) for x, y in points]
    n = len(pts)
    if n < 2:
        return ""
    get = (lambda i: pts[i % n]) if closed else (lambda i: pts[max(0, min(n - 1, i))])
    d = f"M{f(pts[0][0])} {f(pts[0][1])}c"
    parts = []
    for i in range(n if closed else n - 1):
        p0, p1, p2, p3 = get(i - 1), get(i), get(i + 1), get(i + 2)
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        nums = (c1[0] - p1[0], c1[1] - p1[1], c2[0] - p1[0], c2[1] - p1[1], p2[0] - p1[0], p2[1] - p1[1])
        parts.append(" ".join(f(v) for v in nums))
    return d + " ".join(parts).replace(" -", "-") + ("z" if closed else "")


def resample(line, step):
    """Points spaced evenly along a polyline."""
    out = [line[0]]
    acc = 0.0
    for (ax, ay), (bx, by) in zip(line, line[1:]):
        seg = math.hypot(bx - ax, by - ay)
        while acc + seg >= step and seg > 0:
            t = (step - acc) / seg
            ax, ay = ax + (bx - ax) * t, ay + (by - ay) * t
            out.append((ax, ay))
            seg = math.hypot(bx - ax, by - ay)
            acc = 0.0
        acc += seg
    if math.hypot(out[-1][0] - line[-1][0], out[-1][1] - line[-1][1]) > step * 0.3:
        out.append(line[-1])
    return out


def ribbon(line, width):
    """A filled stroke along a polyline. width(u) gives the full width at fraction u of the length."""
    n = len(line)
    if n < 2:
        return ""
    left, right = [], []
    for i, (x, y) in enumerate(line):
        ax, ay = line[max(0, i - 1)]
        bx, by = line[min(n - 1, i + 1)]
        tx, ty = bx - ax, by - ay
        ln = math.hypot(tx, ty) or 1
        nx, ny = -ty / ln, tx / ln
        w = max(0.0, width(i / (n - 1))) / 2
        left.append((x + nx * w, y + ny * w))
        right.append((x - nx * w, y - ny * w))
    return poly(left + right[::-1])


def pressure(rng, lo=0.35, hi=1.0, swell=None):
    """A brush pressure curve: pressed in, a little uneven along the way, lifted out."""
    a, b, c = rng.uniform(0, 6.3), rng.uniform(0, 6.3), rng.uniform(2.5, 5.5)
    start = rng.uniform(0.04, 0.14) if swell is None else swell[0]
    end = rng.uniform(0.12, 0.3) if swell is None else swell[1]

    def p(u):
        body = lo + (hi - lo) * (0.62 + 0.26 * math.sin(u * c + a) + 0.12 * math.sin(u * 11 + b))
        taper = min(1.0, u / start) ** 0.6 * min(1.0, (1 - u) / end) ** 0.8
        return body * taper
    return p


# Geometry for filling shapes with strokes.

def spans(polys, v):
    """Where the line at height v crosses a set of polygons (points as (u, v)), sorted, to be read even-odd."""
    out = []
    for p in polys:
        n = len(p)
        for k in range(n):
            (u1, v1), (u2, v2) = p[k], p[(k + 1) % n]
            if (v1 <= v) != (v2 <= v):
                out.append(u1 + (v - v1) * (u2 - u1) / (v2 - v1))
    out.sort()
    return out


def union_outline(circles, cx, cy, n=96):
    """The outline of overlapping circles, seen from a point inside them all: the farthest hit on every ray."""
    out = []
    for k in range(n):
        a = k * math.tau / n
        dx, dy = math.cos(a), math.sin(a)
        best = 0
        for (x, y, r) in circles:
            ox, oy = cx - x, cy - y
            b = ox * dx + oy * dy
            disc = b * b - (ox * ox + oy * oy - r * r)
            if disc >= 0:
                best = max(best, -b + math.sqrt(disc))
        out.append((cx + dx * best, cy + dy * best))
    return out
