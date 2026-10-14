"""Procedural parts of the desert: ripples, footprints, pebbles, fleece curls, grass, stars, texture tiles."""
import math
import random

from common import bezier, ellipse, f, tile


def ripples():
    rng = random.Random(7)
    out = []
    n = 8
    for i in range(n):
        t = i / (n - 1)
        base = 478 + 80 * t
        lam = 46 + 38 * t
        amp = 0.8 + 1.7 * t
        ph = rng.uniform(0, 6.28)

        def by(x):
            return base + 3.4 * math.sin(x / 270 + ph) + 1.5 * math.sin(x / 93 + ph * 1.7)

        x = -60 + rng.uniform(0, lam)
        while x < 1660:
            end = min(x + rng.uniform(150, 440), 1660)
            sign = 1 if rng.random() < 0.5 else -1
            d = f"M{f(x)} {f(by(x))}"
            xs = x
            while xs < end:
                xe = xs + lam / 2
                cx = (xs + xe) / 2
                a = amp * rng.uniform(0.55, 1.2)
                d += f"Q{f(cx)} {f(by(cx) - 2 * a * sign)} {f(xe)} {f(by(xe))}"
                sign = -sign
                xs = xe
            out.append(d)
            x = end + rng.uniform(24, 120)
    return "".join(out)


def trail(p, step, rx, ry, spread, seed):
    rng = random.Random(seed)
    pts = [bezier(p, i / 3000) for i in range(3001)]
    acc, nxt, side, out = 0.0, step * 0.5, 1, []
    for i in range(1, len(pts)):
        (ax, ay), (bx, by) = pts[i - 1], pts[i]
        acc += math.hypot(bx - ax, by - ay)
        if acc < nxt:
            continue
        tx, ty = bx - ax, by - ay
        ln = math.hypot(tx, ty) or 1
        nx, ny = -ty / ln, tx / ln
        x = bx + nx * spread * side + rng.uniform(-0.8, 0.8)
        y = by + ny * spread * side * 0.45 + rng.uniform(-0.4, 0.4)
        k = rng.uniform(0.85, 1.12)
        out.append(ellipse(x, y, rx * k, ry * k))
        side = -side
        nxt += step * rng.uniform(0.9, 1.1)
    return "".join(out)


def prints():
    camel = trail([(1700, 470), (1460, 486), (1240, 496), (1040, 480)], 16, 3.4, 1.3, 3.2, 3)
    alpaca_a = trail([(-60, 458), (150, 452), (340, 494), (560, 496)], 9.5, 2.0, 0.85, 2.0, 5)
    alpaca_b = trail([(-60, 466), (170, 462), (330, 488), (470, 486)], 9.5, 1.9, 0.8, 2.0, 9)
    return camel + alpaca_a + alpaca_b


def tuft_paths(bx, by, s, n, seed):
    rng = random.Random(seed)
    dark, light, seeds = [], [], []
    for i in range(n):
        th = math.radians(-72 + 144 * i / (n - 1) + rng.uniform(-9, 9))
        ln = s * (8 + 12 * math.cos(th) ** 1.6 + rng.uniform(-2.5, 2.5))
        ex, ey = bx + ln * math.sin(th), by - ln * math.cos(th)
        cx, cy = bx + ln * 0.18 * math.sin(th), by - ln * 0.82 * math.cos(th)
        d = f"M{f(bx + rng.uniform(-1.5, 1.5) * s)} {f(by)}Q{f(cx)} {f(cy)} {f(ex)} {f(ey)}"
        (light if i % 3 == 1 else dark).append(d)
        if abs(th) < 0.75 and rng.random() < 0.5:
            seeds.append(ellipse(ex, ey, 1.5 * s, 0.7 * s))
    return "".join(dark), "".join(light), "".join(seeds)


def tufts(specs, width):
    """Each tuft is its own group so it can bend in the wind about its base."""
    rng = random.Random(len(specs) * 17)
    out = []
    for bx, by, s, n, seed in specs:
        dark, light, seeds = tuft_paths(bx, by, s, n, seed)
        out.append(
            f'<g class="tuft" style="transform-origin:{f(bx)}px {f(by)}px; '
            f'--sway-t:{rng.uniform(2.4, 3.6):.2f}s; --sway-d:{rng.uniform(0, 2):.2f}s">'
            f'<path d="{dark}" style="stroke:var(--grass-dark)" stroke-width="{width}"/>'
            f'<path d="{light}" style="stroke:var(--grass-light)" stroke-width="{width * 0.8:.2f}"/>'
            f'<path d="{seeds}" style="fill:var(--grass-light)" stroke="none"/></g>'
        )
    return "".join(out)


def curls():
    rng = random.Random(13)
    out = []
    regions = [((28, 116), (204, 252), 64), ((94, 124), (158, 214), 18)]
    for (x0, x1), (y0, y1), n in regions:
        for _ in range(n):
            x, y = rng.uniform(x0, x1), rng.uniform(y0, y1)
            r = rng.uniform(2.0, 3.4)
            a = rng.uniform(0, 6.28)
            out.append(f"M{f(x)} {f(y)}a{f(r)} {f(r)} 0 0 1 {f(r * 1.6 * math.cos(a))} {f(r * 1.6 * math.sin(a))}")
    return "".join(out)


def pebbles():
    specs = [(664, 498, 3.0), (748, 500, 2.3), (690, 503, 1.6), (884, 488, 2.6), (430, 522, 3.6),
             (452, 528, 2.0), (1188, 502, 2.9), (1330, 534, 3.8), (1352, 538, 2.2), (980, 520, 2.4)]
    body, light, shadow = [], [], []
    for x, y, r in specs:
        ry = r * 0.62
        body.append(ellipse(x, y, r, ry))
        light.append(ellipse(x - r * 0.25, y - ry * 0.4, r * 0.55, ry * 0.45))
        shadow.append(ellipse(x + r * 1.1, y + ry * 0.5, r * 1.5, ry * 0.7))
    return "".join(body), "".join(light), "".join(shadow)


def stars():
    rng = random.Random(42)
    out, placed = [], []
    while len(placed) < 76:
        x, y = rng.uniform(10, 1590), rng.uniform(10, 640)
        if any(math.hypot(x - px, y - py) < 50 for px, py in placed):
            continue
        placed.append((x, y))
        r = rng.choice([0.6, 0.7, 0.8, 0.8, 0.9, 1.0, 1.2, 1.5])
        a = rng.uniform(0.35, 0.9)
        if rng.random() < 0.45:
            out.append(f'<circle class="tw" cx="{f(x)}" cy="{f(y)}" r="{f(r)}" '
                       f'style="--a:{a:.2f}; --t:{rng.uniform(2.2, 5.5):.2f}s; --d:{rng.uniform(0, 4):.2f}s"/>')
        else:
            out.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" opacity="{a:.2f}"/>')
    for x, y in placed[3:7]:
        out.append(f'<g class="tw" style="--a:.85; --t:{rng.uniform(3, 5):.2f}s; --d:{rng.uniform(0, 3):.2f}s">'
                   f'<circle cx="{f(x)}" cy="{f(y)}" r="1.5"/>'
                   f'<path d="M{f(x - 5)} {f(y)}h10M{f(x)} {f(y - 5)}v10" stroke="#FFF4DC" stroke-width=".5"/></g>')
    return "".join(out)


def page_stars():
    rng = random.Random(9)
    layers = []
    for _ in range(46):
        x, y = rng.uniform(2, 98), rng.uniform(1, 92)
        r = rng.choice([0.8, 1, 1, 1.2, 1.5])
        a = rng.uniform(0.25, 0.75) * (1 - y / 140)
        layers.append(f"radial-gradient({r}px {r}px at {x:.1f}% {y:.1f}%, rgb(255 244 220 / {a:.2f}) 60%, transparent)")
    return ",\n      ".join(layers)


TEX_RELIEF = tile(
    "<feTurbulence type='turbulence' baseFrequency='.11' numOctaves='2' seed='7' stitchTiles='stitch'/>"
    "<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 0 0 0 1.1'/>"
    "<feDiffuseLighting surfaceScale='1.6' diffuseConstant='.72' lighting-color='#fff'>"
    "<feDistantLight azimuth='235' elevation='46'/></feDiffuseLighting>", 256, 256)
TEX_CURL = tile(
    "<feTurbulence type='turbulence' baseFrequency='.15' numOctaves='1' seed='7' stitchTiles='stitch' result='t'/>"
    "<feColorMatrix in='t' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -11 0 0 0 1.1' result='lines'/>"
    "<feTurbulence type='fractalNoise' baseFrequency='.05' numOctaves='2' seed='2' stitchTiles='stitch'/>"
    "<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3 0 0 0 -.9' result='keep'/>"
    "<feComposite in='lines' in2='keep' operator='in' result='curl'/>"
    "<feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='1' seed='9' stitchTiles='stitch'/>"
    "<feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 14 -9.4' result='dots'/>"
    "<feMerge><feMergeNode in='curl'/><feMergeNode in='dots'/></feMerge>", 256, 256)
# Long horizontal wisps of blown sand; used as a mask over a theme-coloured band.
TEX_DRIFT = tile(
    "<feTurbulence type='fractalNoise' baseFrequency='.0039 .055' numOctaves='3' seed='12' stitchTiles='stitch'/>"
    "<feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 3.4 0 0 0 -1.55'/>", 512, 160)


def placeholders():
    pebble, light, shadow = pebbles()
    return {
        "RIPPLES": ripples(),
        "PRINTS": prints(),
        "CURLS": curls(),
        "PEBBLES": pebble,
        "PEBBLE_LIGHTS": light,
        "PEBBLE_SHADOWS": shadow,
        "TUFTS_GROUND": tufts([(404, 464, 0.95, 9, 1), (1300, 468, 0.85, 8, 2), (1462, 480, 1.05, 10, 3), (900, 486, 0.7, 7, 6)], 1.2),
        "TUFTS_NEAR": tufts([(176, 528, 1.6, 12, 4), (1508, 524, 1.4, 11, 5)], 1.8),
        "STARS": stars(),
        "PAGE_STARS": page_stars(),
        "TEX_RELIEF": TEX_RELIEF,
        "TEX_CURL": TEX_CURL,
        "TEX_DRIFT": TEX_DRIFT,
    }


# Scene picker glyph, 16 x 16: a low sun over two dune crests.
GLYPH = '<circle cx="5" cy="4.6" r="1.7"/><path d="M5.6 9.4C8.2 7 11.6 6.8 14.5 8.6M1.5 13.2C4.4 9.8 8.2 9.2 11.8 11.8"/>'
