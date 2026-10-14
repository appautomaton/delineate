"""The Deep: a sunlit reef as a papercut diorama.

Every plane is a sheet of cut paper. Shapes are flat colour with knife-cut edges; lace is made by
cutting holes; depth comes from the shadows one sheet throws on the next. Generated here: the reef
skylines, lace sea fans, branching coral, kelp in jointed segments, the sand, light rays, caustics.
"""
import math
import random

from common import catmull, ellipse, f, poly, resample, ribbon, smooth, tile


def lerp(a, b, t):
    return a + (b - a) * t


def skyline(x0, x1, base, low, high, step, seed, floor=640):
    """A cut edge of reef or rock: rounded mounds of varied height, closed down to the floor."""
    rng = random.Random(seed)
    pts = [(x0, floor), (x0, base - rng.uniform(low, high) * 0.5)]
    x = x0
    while x < x1:
        w = rng.uniform(step * 0.6, step * 1.4)
        h = rng.uniform(low, high)
        pts.append((x + w * 0.3, base - h * 0.85))
        pts.append((x + w * 0.5, base - h))
        pts.append((x + w * 0.75, base - h * rng.uniform(0.55, 0.8)))
        x += w
    pts.append((x1, base - rng.uniform(low, high) * 0.4))
    pts.append((x1, floor))
    return smooth(pts[1:-1]) + f"L{f(x1)} {f(floor)}L{f(x0)} {f(floor)}Z"


def sea_fan(cx, base, r, seed):
    """A sea fan cut as lace: a fan of paper with a field of small holes, on a short stalk.
    Fill with fill-rule evenodd."""
    rng = random.Random(seed)
    outline = []
    for k in range(25):
        a = math.pi * (1.08 + 0.84 * k / 24)
        rr = r * (0.88 + 0.12 * math.sin(k * 1.7 + seed)) * rng.uniform(0.95, 1.04)
        outline.append((cx + math.cos(a) * rr, base - r * 0.18 + math.sin(a) * rr * 1.05))
    stalk = [(cx + 3, base - r * 0.16), (cx + 2.5, base), (cx - 2.5, base), (cx - 3, base - r * 0.16)]
    d = smooth(outline) + "".join(f"L{f(x)} {f(y)}" for x, y in stalk) + "Z"
    holes = []
    rings = 6
    for i in range(1, rings + 1):
        rad = r * (0.2 + 0.72 * i / rings)
        n = int(5 + i * 3.2)
        for k in range(n):
            a = math.pi * (1.12 + 0.76 * (k + 0.5) / n) + rng.uniform(-0.03, 0.03)
            hx = cx + math.cos(a) * rad
            hy = base - r * 0.18 + math.sin(a) * rad * 1.05
            hr = r * rng.uniform(0.035, 0.06) * (0.7 + 0.3 * i / rings)
            holes.append(ellipse(hx, hy, hr * rng.uniform(1, 1.5), hr))
    return d + "".join(holes)


def staghorn(x, base, size, seed):
    """Branching coral: forks that thin as they climb, every tip rounded off."""
    rng = random.Random(seed)
    out = []

    def branch(px, py, ang, length, width, depth):
        ex = px + math.cos(ang) * length
        ey = py + math.sin(ang) * length
        mx = (px + ex) / 2 + rng.uniform(-3, 3)
        my = (py + ey) / 2 + rng.uniform(-2, 2)
        line = resample(catmull([(px, py), (mx, my), (ex, ey)], 5), 2.5)
        out.append(ribbon(line, lambda u: width * (1 - 0.35 * u)))
        out.append(ellipse(ex, ey, width * 0.33, width * 0.33))
        if depth > 0:
            for da in (-rng.uniform(0.35, 0.6), rng.uniform(0.35, 0.6)):
                branch(ex, ey, ang + da, length * rng.uniform(0.62, 0.8), width * 0.72, depth - 1)

    for a in (-math.pi / 2 - 0.45, -math.pi / 2, -math.pi / 2 + 0.5):
        branch(x, base, a + rng.uniform(-0.1, 0.1), size * rng.uniform(0.32, 0.4), size * 0.11, 3)
    return "".join(out)


def brain(cx, base, rx, ry, seed):
    """A brain coral: a dome with meandering grooves cut right through the paper."""
    rng = random.Random(seed)
    dome = smooth([(cx - rx, base), (cx - rx * 0.92, base - ry * 0.55), (cx - rx * 0.55, base - ry * 0.95),
                   (cx, base - ry), (cx + rx * 0.58, base - ry * 0.93), (cx + rx * 0.94, base - ry * 0.5), (cx + rx, base)]) + "Z"
    grooves = []
    for i in range(5):
        yy = base - ry * (0.18 + 0.15 * i)
        half = rx * math.sqrt(max(0.0, 1 - ((base - yy) / ry) ** 2)) * 0.82
        pts = []
        k = 0
        x = cx - half
        while x < cx + half:
            pts.append((x, yy + (1.6 if k % 2 else -1.6) * rng.uniform(0.6, 1.2)))
            x += rng.uniform(5, 8)
            k += 1
        if len(pts) > 2:
            line = resample(catmull(pts, 4), 2)
            grooves.append(ribbon(line, lambda u: 1.5 * math.sin(math.pi * u) ** 0.4))
    return dome, "".join(grooves)


def kelp(x, base, height, seed, segments=4, width=7.0):
    """A kelp frond in jointed segments. Each segment is a nested group that pivots where it joins the
    one below, so a small sway at the root travels up the plant like a wave."""
    rng = random.Random(seed)
    seg_h = height / segments
    lean = rng.uniform(-0.12, 0.12)
    open_tags = []
    for i in range(segments):
        y0 = base - seg_h * i
        y1 = y0 - seg_h
        x0 = x + lean * seg_h * i
        x1 = x0 + lean * seg_h + rng.uniform(-6, 6)
        w = width * (1 - 0.55 * i / segments)
        stipe = resample(catmull([(x0, y0), ((x0 + x1) / 2 + rng.uniform(-5, 5), (y0 + y1) / 2), (x1, y1)], 6), 3)
        parts = [ribbon(stipe, lambda u, w=w: w * (1 - 0.2 * u))]
        # Blades leave the stipe on alternate sides; small floats sit at their bases.
        for k in range(2):
            t = 0.3 + 0.45 * k
            bx, by = lerp(x0, x1, t), lerp(y0, y1, t)
            side = 1 if (i + k) % 2 else -1
            blade_len = rng.uniform(26, 40) * (1 - 0.3 * i / segments)
            blade = resample(catmull([(bx, by), (bx + side * blade_len * 0.45, by - blade_len * 0.35),
                                      (bx + side * blade_len, by - blade_len * 0.55)], 6), 2.5)
            parts.append(ribbon(blade, lambda u: 9 * math.sin(math.pi * min(1, u * 1.05)) ** 0.7 * (1 - 0.3 * i / segments)))
            parts.append(ellipse(bx + side * 2.6, by - 1.5, 3, 3.6))
        delay = -rng.uniform(0, 4)
        open_tags.append(
            f'<g class="dp-sway" style="transform-origin:{f(x0)}px {f(y0)}px; --sway-d:{delay:.2f}s; --sway-a:{1.6 + i * 0.5:.1f}deg">'
            f'<path d="{"".join(parts)}"/>'
        )
    return "".join(open_tags) + "</g>" * segments


def sand():
    """The sand floor as three sheets: a back drift, the floor, and a near ridge, each with a rippled top."""
    def edge(base, amp, seed, floor=640):
        rng = random.Random(seed)
        pts = [(-80, base + rng.uniform(-amp, amp))]
        x = -80
        while x < 1680:
            x += rng.uniform(80, 160)
            pts.append((x, base + rng.uniform(-amp, amp)))
        return smooth(pts) + f"L1680 {floor}L-80 {floor}Z"
    ripples = []
    rng = random.Random(4)
    for i in range(14):
        y = 506 + i * 7.5
        x = -60 + rng.uniform(0, 80)
        while x < 1660:
            ln = rng.uniform(60, 180)
            line = [(x + k * ln / 8, y + 1.6 * math.sin(k * 1.4 + i)) for k in range(9)]
            ripples.append(ribbon(resample(catmull(line, 4), 4), lambda u: 1.4 * math.sin(math.pi * u)))
            x += ln + rng.uniform(30, 90)
    return {
        "SAND_BACK": edge(470, 10, 1),
        "SAND_FLOOR": edge(498, 8, 2),
        "SAND_RIPPLES": "".join(ripples),
        "SAND_NEAR": edge(560, 14, 3),
    }


def rays():
    """Shafts of light as strips of vellum, wider at the bottom, hanging from the surface."""
    rng = random.Random(9)
    out = []
    for x in (180, 330, 520, 760, 930, 1120, 1330, 1480):
        top = rng.uniform(26, 50)
        bottom = top * rng.uniform(2.2, 3.4)
        lean = rng.uniform(40, 120)
        out.append(
            f'<path class="dp-ray" style="transform-origin:{f(x)}px 0; --ray-d:{-rng.uniform(0, 9):.1f}s" '
            f'd="M{f(x - top / 2)} -40L{f(x + top / 2)} -40L{f(x + lean + bottom / 2)} 560L{f(x + lean - bottom / 2)} 560Z"/>'
        )
    return "".join(out)


def caustics():
    """The bright net that sunlight throws on the sand: a jittered honeycomb of thin, broken lines."""
    rng = random.Random(21)
    out = []
    cell = 26
    for row in range(10):
        for col in range(-2, 68):
            cx = col * cell + (row % 2) * cell / 2 + rng.uniform(-6, 6)
            cy = 500 + row * 11 + rng.uniform(-3, 3)
            pts = []
            for k in range(6):
                a = math.tau * k / 6 + rng.uniform(-0.3, 0.3)
                rr = cell * rng.uniform(0.42, 0.6)
                pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr * 0.36))
            # Leave one side open: caustics never close their loops neatly.
            gap = rng.randint(0, 5)
            pts = pts[gap + 1:] + pts[:gap]
            out.append(poly(pts, closed=False))
    return "".join(out)


def snow():
    """Marine snow on the page above: drifting specks that thicken as the water deepens."""
    rng = random.Random(14)
    layers = []
    for _ in range(40):
        x, y = rng.uniform(2, 98), rng.uniform(1, 98)
        r = rng.choice([0.8, 1, 1.2, 1.4])
        a = rng.uniform(0.15, 0.45) * (0.4 + y / 100)
        layers.append(f"radial-gradient({r}px {r}px at {x:.1f}% {y:.1f}%, rgb(200 240 236 / {a:.2f}) 60%, transparent)")
    return ",\n      ".join(layers)


# Paper: a fibrous sheet, faint, laid over everything in soft light.
TEX_PAPER = tile(
    "<feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='1' seed='4' stitchTiles='stitch' result='g'/>"
    "<feTurbulence type='turbulence' baseFrequency='.22' numOctaves='2' seed='9' stitchTiles='stitch' result='f'/>"
    "<feComposite in='g' in2='f' operator='arithmetic' k2='.7' k3='.3' result='m'/>"
    "<feColorMatrix in='m' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 2.2 0 0 0 -1.05' result='lite'/>"
    "<feColorMatrix in='m' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 0 0 0 1.2' result='dark'/>"
    "<feMerge><feMergeNode in='lite'/><feMergeNode in='dark'/></feMerge>", 256, 256)


def cave():
    """The front sheet of the diorama: a cave mouth cut from dark rock, open in the middle."""
    rng = random.Random(30)

    def side(xs, ys):
        return [(x + rng.uniform(-8, 8), y + rng.uniform(-6, 6)) for x, y in zip(xs, ys)]
    left = side([-80, -40, 10, 54, 90, 128, 168, 200, 222, 236, 248], [190, 176, 196, 236, 276, 330, 398, 450, 500, 548, 600])
    right = side([1680, 1640, 1590, 1548, 1510, 1474, 1436, 1404, 1380, 1366, 1354], [180, 170, 192, 232, 278, 330, 392, 446, 498, 546, 600])
    l = smooth(left) + "L248 640L-80 640Z"
    r = smooth(right) + "L1354 640L1680 640Z"
    # Lit lips along the inner edge, a second, paler sheet set just behind the first.
    l2 = smooth([(x + 10, y + 6) for x, y in left]) + "L258 640L-80 640Z"
    r2 = smooth([(x - 10, y + 6) for x, y in right]) + "L1344 640L1680 640Z"
    return {"CAVE_L": l, "CAVE_R": r, "CAVE_L_LIP": l2, "CAVE_R_LIP": r2}


# The same paper, faint enough to sit under running text on the page above.
TEX_PAPER_PAGE = tile(
    "<feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='1' seed='4' stitchTiles='stitch' result='g'/>"
    "<feTurbulence type='turbulence' baseFrequency='.22' numOctaves='2' seed='9' stitchTiles='stitch' result='f'/>"
    "<feComposite in='g' in2='f' operator='arithmetic' k2='.7' k3='.3' result='m'/>"
    "<feColorMatrix in='m' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .8 0 0 0 -.38' result='lite'/>"
    "<feColorMatrix in='m' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -.8 0 0 0 .44' result='dark'/>"
    "<feMerge><feMergeNode in='lite'/><feMergeNode in='dark'/></feMerge>", 256, 256)


def placeholders():
    values = {
        "TEX_PAPER_PAGE": TEX_PAPER_PAGE,
        "FAR_REEF": skyline(-80, 1680, 452, 30, 90, 110, 3),
        "FAR_REEF_2": skyline(-80, 1680, 470, 20, 60, 80, 4),
        "MID_ROCK_L": skyline(-80, 430, 486, 50, 150, 80, 5),
        "MID_ROCK_R": skyline(1140, 1680, 490, 50, 160, 80, 6),
        "BACK_ROCK_L": skyline(-80, 560, 470, 60, 190, 120, 7),
        "BACK_ROCK_R": skyline(1000, 1680, 474, 60, 200, 120, 8),
        "FAN_A": sea_fan(250, 470, 74, 1),
        "FAN_B": sea_fan(1270, 476, 64, 2),
        "FAN_C": sea_fan(1500, 470, 52, 3),
        "FAN_FAR": sea_fan(700, 456, 44, 4) + sea_fan(1010, 458, 38, 5),
        "STAG_A": staghorn(400, 500, 120, 1),
        "STAG_B": staghorn(1150, 504, 110, 2),
        "STAG_C": staghorn(80, 500, 96, 3),
        "RAYS": rays(),
        "CAUSTICS": caustics(),
        "PAGE_SNOW": snow(),
        "TEX_PAPER": TEX_PAPER,
        "KELP_L": kelp(30, 640, 420, 1, 5, 9) + kelp(96, 640, 330, 2, 4, 7.5),
        "KELP_R": kelp(1560, 640, 400, 3, 5, 9) + kelp(1490, 640, 300, 4, 4, 7.5),
        "KELP_MID": kelp(520, 500, 220, 5, 4, 5.5) + kelp(1060, 500, 190, 6, 3, 5),
    }
    dome, grooves = brain(560, 506, 46, 34, 7)
    values["BRAIN_A"], values["BRAIN_A_GROOVES"] = dome, grooves
    dome, grooves = brain(1350, 510, 38, 28, 8)
    values["BRAIN_B"], values["BRAIN_B_GROOVES"] = dome, grooves
    values.update(sand())
    values.update(cave())
    return values


# Scene picker glyph, 16 x 16: a fish and a rising bubble.
GLYPH = ('<path d="M1.8 9.4C4.2 6.2 8.4 5.8 11.4 9.4C8.4 13 4.2 12.6 1.8 9.4Z"/><path d="M11.4 9.4L14.4 7V11.8Z"/>'
         '<circle cx="12.6" cy="3.4" r="1.4"/>')
