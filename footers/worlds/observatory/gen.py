"""Observatory: one sheet of a set of working drawings. Section A-A through the observatory, a plan at the
observing floor, and Detail B of the dome drive, with levels, dimensions, a keyed schedule, notes and the
title block, as an architect's office would issue it.

Technical pen on gridded drafting film by day; a cyanotype by night. Every line has a weight and a job:
thick for cut edges, medium for what is seen beyond, thin for dimensions and leaders, chain for centre
lines, dashes for construction. Every material cut through carries its own section symbol: brick, block,
insulation, concrete, hardcore, earth, steel, timber.

Generated here: the geometry of dome, mount and refractor; gears with real teeth; the hatching symbols
that are drawn rather than patterned; the plan; the detail; and all the lettering's positions.
"""
import math
import random

from common import f, tile

GL = 520                    # ground level
DOME = (800, 368)           # centre of the dome's sphere, on the spring line
R_OUT, R_IN = 182, 174
FFL = 430                   # observing floor
DEC = (836, 362)            # declination axis: the telescope turns about it
PLAN = (330, 424)           # centre of the plan
DET = (1286, 330)           # centre of Detail B
DET_R = 86


def pts(points):
    return "M" + "L".join(f"{f(x)} {f(y)}" for x, y in points)


def closed(points):
    return pts(points) + "Z"


def arc(cx, cy, r, a0, a1, steps=48):
    """An arc from angle a0 to a1 in degrees, y down, as a polyline."""
    return pts([(cx + math.cos(math.radians(a0 + (a1 - a0) * k / steps)) * r, cy + math.sin(math.radians(a0 + (a1 - a0) * k / steps)) * r)
                for k in range(steps + 1)])


def circle(cx, cy, r):
    return f"M{f(cx + r)} {f(cy)}A{f(r)} {f(r)} 0 1 0 {f(cx - r)} {f(cy)}A{f(r)} {f(r)} 0 1 0 {f(cx + r)} {f(cy)}Z"


def rect(x, y, w, h):
    return f"M{f(x)} {f(y)}h{f(w)}v{f(h)}h{f(-w)}Z"


def rotated(points, cx, cy, deg):
    a = math.radians(deg)
    return [(cx + (x - cx) * math.cos(a) - (y - cy) * math.sin(a), cy + (x - cx) * math.sin(a) + (y - cy) * math.cos(a)) for x, y in points]


def gear(cx, cy, r, teeth, depth=None):
    """A spur gear: a ring of trapezoid teeth round a root circle, with a bore, spokes and pitch circle."""
    depth = depth or r * .16
    outline = []
    for k in range(teeth):
        a = math.tau * k / teeth
        step = math.tau / teeth
        for da, rr in ((-.25, r - depth), (-.12, r), (.12, r), (.25, r - depth)):
            outline.append((cx + math.cos(a + da * step) * rr, cy + math.sin(a + da * step) * rr))
    body = closed(outline)
    bore = circle(cx, cy, r * .18)
    spokes = "".join(pts([(cx + math.cos(a) * r * .22, cy + math.sin(a) * r * .22), (cx + math.cos(a) * (r - depth * 1.7), cy + math.sin(a) * (r - depth * 1.7))])
                     for a in [k * math.tau / 4 + .4 for k in range(4)])
    pitch = circle(cx, cy, r - depth / 2)
    return body, bore, spokes, pitch


# ---------------------------------------------------------------------------------------------------------
# Section A-A: the building, cut.

def shell(a0, a1):
    """One side of the dome's shell, cut through: the outer arc out, the inner arc back."""
    cx, cy = DOME
    outer = [(cx + math.cos(math.radians(a0 + (a1 - a0) * k / 40)) * R_OUT, cy + math.sin(math.radians(a0 + (a1 - a0) * k / 40)) * R_OUT) for k in range(41)]
    inner = [(cx + math.cos(math.radians(a1 - (a1 - a0) * k / 40)) * R_IN, cy + math.sin(math.radians(a1 - (a1 - a0) * k / 40)) * R_IN) for k in range(41)]
    return closed(outer + inner)


def insulation(x0, x1, y0, y1):
    """Insulation in a cavity, drawn as its section symbol: a tight zigzag."""
    w = x1 - x0
    out, y, k = [], y0, 0
    while y < y1:
        out.append((x0 if k % 2 == 0 else x1, y))
        y += w * .9
        k += 1
    return pts(out)


def timber_floor(x0, x1):
    """The observing floor: boards on joists, each joist cut and crossed, as timber is shown in section."""
    boards = rect(x0, FFL, x1 - x0, 2.6)
    joists, crosses = [], []
    x = x0 + 3
    while x + 5 < x1 - 1:
        joists.append(rect(x, FFL + 2.6, 5, 7.4))
        crosses.append(f"M{f(x)} {f(FFL + 2.6)}l5 7.4M{f(x + 5)} {f(FFL + 2.6)}l-5 7.4")
        x += 21
    return boards, "".join(joists), "".join(crosses)


def building():
    """Section A-A. Returns markup for the cut materials, what is seen beyond, and the fine detail."""
    cx, cy = DOME
    cut, see, fine, con = [], [], [], []
    fills = []

    # Walls: brick outer leaf, an insulated cavity, block inner leaf; footings below ground.
    for (o0, o1), (c0, c1), (i0, i1) in (((616, 623), (623, 627), (627, 634)), ((977, 984), (973, 977), (966, 973))):
        fills.append(("brick", rect(o0, 386, o1 - o0, 534 - 386)))
        fills.append(("block", rect(i0, 386, i1 - i0, 534 - 386)))
        cut.append(rect(o0, 386, o1 - o0, 534 - 386) + rect(i0, 386, i1 - i0, 534 - 386))
        fine.append(insulation(c0, c1, 388, 532))
    for x0 in (604, 954):
        fills.append(("concrete", rect(x0, 534, 42, 18)))
        cut.append(rect(x0, 534, 42, 18))
    # Ring beams, the rails on them, the bogies, and the dome's base ring riding on top.
    for x0 in (612, 960):
        fills.append(("concrete", rect(x0, 376, 28, 10)))
        cut.append(rect(x0, 376, 28, 10))
        see.append(rect(x0 + 10, 374.4, 10, 1.6))
    for wx in (627, 973):
        see.append(circle(wx, 371, 3.2) + circle(wx, 371, .9))
    for x0 in (614, 960):
        fills.append(("steel", rect(x0, 362, 26, 5.4)))
        cut.append(rect(x0, 362, 26, 5.4))
    # Ground slab on hardcore, the pier through it with its isolation joints, the pier's pad.
    for x0, x1 in ((634, 776), (824, 966)):
        fills.append(("concrete", rect(x0, 512, x1 - x0, 8)))
        fills.append(("hardcore", rect(x0, 520, x1 - x0, 10)))
        cut.append(rect(x0, 512, x1 - x0, 8))
        fine.append(f"M{f(x0)} 530H{f(x1)}")
    pier = [(780, 404), (820, 404), (820, 540), (832, 540), (832, 556), (768, 556), (768, 540), (780, 540)]
    fills.append(("concrete", closed(pier)))
    cut.append(closed(pier))
    fine.append("M777 512v18M823 512v18M777 430v10M823 430v10")
    see.append(rect(776, 400, 48, 4))
    fills.append(("steel", rect(776, 400, 48, 4)))
    # The observing floor in two parts, either side of the pier, open where the stair comes up.
    for x0, x1 in ((634, 650), (752, 776), (824, 966)):
        boards, joists, crosses = timber_floor(x0, x1)
        cut.append(boards + joists)
        fine.append(crosses)
    # The dome's shell, cut, with its slit; its ribs and purlins seen beyond.
    fills.append(("steel-light", shell(180, 263) + shell(277, 360)))
    cut.append(shell(180, 263) + shell(277, 360))
    for th in (22, 46, 68):
        c = math.cos(math.radians(th))
        for side in (-1, 1):
            see.append(pts([(cx + side * R_IN * math.cos(b) * c, cy - R_IN * math.sin(b)) for b in [j * math.pi / 2 / 18 for j in range(19)]]))
    for b in (28, 52, 72):
        r = R_IN * math.cos(math.radians(b))
        y = cy - R_IN * math.sin(math.radians(b))
        con.append(f"M{f(cx - r)} {f(y)}H{f(cx + r)}")
    # Stair beyond: nine risers from the ground floor up to the landing, its stringer and handrail.
    steps = [(656, 512)]
    for k in range(9):
        x, y = steps[-1]
        steps += [(x, y - 74 / 9), (x + 94 / 9, y - 74 / 9)]
    see.append(pts(steps))
    see.append("M650 520L752 444M660 494L752 420M660 494v18M752 420v18")
    for k in range(1, 9):
        x = 660 + 92 * k / 9
        fine.append(f"M{f(x)} {f(494 - 74 * k / 9)}v{f(18)}")
    # A door on the ground floor and a window on the observing floor, seen beyond; a sidereal clock on the wall.
    see.append(rect(884, 470, 30, 42) + rect(888, 474, 22, 34))
    fine.append("M899 474v34M888 491h22M904 492h3")
    see.append(rect(680, 392, 36, 24) + "M698 392v24M680 404h36")
    see.append(circle(930, 398, 9))
    fine.append("".join(f"M{f(930 + math.cos(a) * 7.4)} {f(398 + math.sin(a) * 7.4)}L{f(930 + math.cos(a) * 9)} {f(398 + math.sin(a) * 9)}"
                        for a in [k * math.tau / 12 for k in range(12)]))
    # Centre lines and the plane of the cut.
    centre = "M584 368H1016M800 186V560"
    return fills, "".join(cut), "".join(see), "".join(fine), "".join(con), centre


# ---------------------------------------------------------------------------------------------------------
# The mount and the refractor. Drawn inline, so the scroll can turn them.

def refractor():
    """Local coordinates: the declination axis at the origin, the tube along +x, 22 off the axis."""
    ty = -22
    tube = rect(-40, ty - 10, 152, 20)
    cell = rect(112, ty - 11, 5, 22)
    shield = rect(117, ty - 12, 31, 24)
    rings = rect(14, ty - 12, 6, 24) + rect(78, ty - 12, 6, 24)
    dovetail = rect(8, ty + 10, 82, 3.6)
    saddle = rect(-8, ty + 13.6, 24, 6)
    focuser = rect(-52, ty - 5.5, 12, 11)
    diagonal = closed([(-62, ty - 6), (-52, ty - 6), (-52, ty + 6), (-62, ty + 6)])
    eyepiece = rect(-60, ty + 6, 6, 12)
    finder = rect(22, ty - 26, 46, 7) + "M30 " + f(ty - 19) + "v7M60 " + f(ty - 19) + "v7"
    shaft = rect(-2, 0, 4, 46)
    weights = rect(-9, 26, 18, 8) + rect(-9, 36, 18, 8)
    fill = tube + cell + shield + rings + dovetail + saddle + focuser + diagonal + eyepiece + finder + weights
    lines = fill + shaft + f"M-40 {f(ty - 4)}H112M-40 {f(ty + 4)}H112"
    axis = f"M-70 {f(ty)}H212"
    return fill, lines, axis


def mechanism(big, small, rack_path):
    """Everything that moves: Detail B's drive, the shutter, the telescope, its observer, the clock hand."""
    fill, lines, axis = refractor()
    dx, dy = DEC
    housing = closed([(800, 404), (816, 404), (dx + 6, dy + 6), (dx - 6, dy - 8), (796, 396)])
    return (
        # Detail B: the ring gear on the dome's base ring slides as the pinion turns it.
        '<g clip-path="url(#ob-detail-clip)">'
        f'<g class="ob-rack"><path class="ob-steelfill" d="{rect(DET[0] - 120, 300, 240, 16)}"/>'
        f'<path class="ob-cut" fill="none" d="{rect(DET[0] - 120, 300, 240, 16)}"/>'
        f'<path class="ob-seefill" d="{rack_path}"/><path class="ob-see" fill="none" d="{rack_path}"/></g>'
        f'<g class="ob-gear ob-gear--big"><path class="ob-seefill" d="{big[0]}"/><path class="ob-see" fill="none" d="{big[0]}{big[1]}"/>'
        f'<path class="ob-fine" fill="none" d="{big[2]}"/><path class="ob-con" fill="none" d="{big[3]}"/></g>'
        f'<g class="ob-gear ob-gear--small"><path class="ob-seefill" d="{small[0]}"/><path class="ob-see" fill="none" d="{small[0]}{small[1]}"/>'
        f'<path class="ob-con" fill="none" d="{small[3]}"/></g>'
        '</g>'
        # The shutter, which slides down the shell to open the slit.
        f'<g class="ob-shutter"><path class="ob-shutter-plate" fill="none" d="{arc(DOME[0], DOME[1], R_OUT + 5, 258, 282, 16)}"/></g>'
        # The mount: a wedge on the pier head, the polar axis housing, the declination housing.
        f'<path class="ob-seefill" d="{housing}"/><path class="ob-see" fill="none" d="{housing}"/>'
        f'<path class="ob-center" fill="none" d="M796 412L{f(dx + 64)} {f(dy - 80)}"/>'
        f'<g class="ob-scope"><g class="ob-track"><g transform="translate({dx} {dy})">'
        f'<path class="ob-seefill" d="{fill}"/><path class="ob-see" fill="none" d="{lines}"/>'
        f'<path class="ob-center ob-sight" fill="none" d="{axis}"/></g></g></g>'
        f'<circle class="ob-seefill" cx="{dx}" cy="{dy}" r="8"/><path class="ob-see" fill="none" d="{circle(dx, dy, 8)}{circle(dx, dy, 2.6)}"/>'
        # The observer, an architect's scale figure, seated on a stool and leaning to the eyepiece.
        '<g class="ob-observer">'
        '<circle class="ob-see" fill="none" cx="850" cy="405" r="3.2"/>'
        '<path class="ob-see" fill="none" d="M851 409L856 421L866 421L866 430M856 421L850 425M852 412L845 416"/>'
        '</g>'
        '<path class="ob-see" fill="none" d="M860 421h12M862 421l-2 9M870 421l2 9"/>'
        # The sidereal clock's hand.
        '<g class="ob-hand"><path class="ob-see" fill="none" d="M930 398V391"/></g>'
    )


def detail_static():
    """Detail B, the dome drive at 1:5: the ring beam, the rail, a bogie wheel, the gearmotor, labelled."""
    x, y = DET
    beam = closed([(x - 120, 356), (x + 10, 356), (x + 10, 440), (x - 120, 440)])
    rail = rect(x - 76, 348, 44, 8)
    wheel = circle(x - 54, 335, 13) + circle(x - 54, 335, 4)
    bogie = closed([(x - 74, 340), (x - 34, 340), (x - 30, 330), (x - 78, 330)])
    motor = rect(x + 44, 380, 30, 22) + rect(x + 74, 384, 8, 14)
    bracket = closed([(x + 10, 356), (x + 44, 356), (x + 44, 404), (x + 10, 404)])
    return (
        f'<g clip-path="url(#ob-detail-clip)">'
        f'<path style="fill:var(--ob-concrete)" d="{beam}"/>'
        f'<path class="ob-steelfill" d="{rail}"/>'
        f'<path class="ob-cut" fill="none" d="{beam}{rail}"/>'
        f'<path class="ob-seefill" d="{bogie}{wheel}"/><path class="ob-see" fill="none" d="{bogie}{wheel}"/>'
        f'<path class="ob-see" fill="none" d="{bracket}{motor}"/>'
        f'<path class="ob-center" fill="none" d="M{x - 54} 314V356M{x - 72} 335H{x - 36}M{x + 32} 316V404"/>'
        f'</g>'
        f'<path class="ob-see" fill="none" d="{circle(x, y, DET_R)}"/>'
    )


def plan():
    """Plan at the observing floor, 1:100: the wall ring, the pier, the stair, the door, the line of the cut."""
    cx, cy = PLAN
    ro, ri = 92, 83

    def ring(r0, r1, a0, a1, n=60):
        o = [(cx + math.cos(math.radians(a0 + (a1 - a0) * k / n)) * r1, cy + math.sin(math.radians(a0 + (a1 - a0) * k / n)) * r1) for k in range(n + 1)]
        i = [(cx + math.cos(math.radians(a1 - (a1 - a0) * k / n)) * r0, cy + math.sin(math.radians(a1 - (a1 - a0) * k / n)) * r0) for k in range(n + 1)]
        return closed(o + i)
    walls = ring(ri, ro, 100, 440)
    cavity = arc(cx, cy, 87.5, 100, 440, 60)
    pier = rect(cx - 10, cy - 10, 20, 20)
    stair_x0, stair_x1, stair_y = cx - 70, cx - 22, cy + 14
    treads = "".join(f"M{f(stair_x0 + k * (stair_x1 - stair_x0) / 9)} {f(stair_y)}v12" for k in range(10))
    stair = rect(stair_x0, stair_y, stair_x1 - stair_x0, 12) + treads
    arrow = f"M{f(stair_x0 + 4)} {f(stair_y + 6)}H{f(stair_x1 - 6)}"
    door = f"M{f(cx - 8)} {f(cy + ro)}a16 16 0 0 1 16 -16"
    slit = f"M{f(cx - 5)} {f(cy)}V{f(cy - ri)}M{f(cx + 5)} {f(cy)}V{f(cy - ri)}"
    bogies = "".join(rect(cx + math.cos(a) * 87.5 - 2, cy + math.sin(a) * 87.5 - 2, 4, 4) for a in [k * math.tau / 8 + .2 for k in range(8)])
    scope = closed(rotated([(cx - 2, cy - 3), (cx + 34, cy - 3), (cx + 34, cy + 3), (cx - 2, cy + 3)], cx, cy, -112))
    cut_line = f"M{f(cx - 122)} {f(cy)}H{f(cx + 122)}"
    return {
        "walls": walls, "cavity": cavity, "pier": pier, "stair": stair, "arrow": arrow, "door": door,
        "slit": slit, "bogies": bogies, "scope": scope, "cut": cut_line, "dome": circle(cx, cy, 90),
        "ends": f"M{f(cx - 122)} {f(cy - 8)}v16M{f(cx + 122)} {f(cy - 8)}v16",
        "arrows": f"M{f(cx - 122)} {f(cy)}l0 -12M{f(cx + 122)} {f(cy)}l0 -12",
    }


# ---------------------------------------------------------------------------------------------------------
# The sky beyond, and the ground and its earth.

CONSTELLATIONS = [
    [(150, 196), (178, 178), (206, 198), (236, 180), (264, 196)],                                           # Cassiopeia
    [(1388, 196), (1414, 188), (1440, 192), (1464, 202), (1474, 228), (1508, 234), (1514, 206), (1464, 202)],  # The Plough
    [(1046, 178), (1066, 206), (1086, 236)],                                                                # Cygnus
    [(1040, 222), (1066, 206), (1094, 192)],
    [(772, 165), (784, 178), (792, 180), (788, 194), (796, 196), (792, 180)],                               # Lyra, with Vega
]


def constellations():
    lines, stars = [], []
    for chain in CONSTELLATIONS:
        lines.append(pts(chain))
        for k, (x, y) in enumerate(chain):
            stars.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{3 if (x, y) == (772, 165) else 1.9}"/>')
    return "".join(lines), "".join(dict.fromkeys(stars))


def sky_stars():
    rng = random.Random(44)
    out, placed = [], []
    while len(placed) < 36:
        x, y = rng.uniform(10, 1590), rng.uniform(10, 470)
        if any(math.hypot(x - px, y - py) < 80 for px, py in placed):
            continue
        placed.append((x, y))
        out.append(f'<circle class="ob-tw" cx="{f(x)}" cy="{f(y)}" r="{f(rng.choice([.7, .9, 1.1]))}" style="--d:{rng.uniform(0, 4):.1f}s"/>')
    return "".join(out)


def earth_hatch():
    """The section symbol for earth under the ground line: short diagonal strokes in little groups,
    left out under the building."""
    rng = random.Random(8)
    out = []
    x = 548
    while x < 1052:
        if not (600 < x < 1000):
            for k in range(3):
                out.append(f"M{f(x + k * 4)} 524l-8 10")
        x += rng.uniform(20, 30)
    return "".join(out)


def page_grid(colour, a_minor, a_major):
    """Drafting film's printed grid: a fine square, a heavier square every five."""
    from urllib.parse import quote
    minor = "".join(f"<path d='M{k * 12 + .5} 0V60M0 {k * 12 + .5}H60'/>" for k in range(5))
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'>"
           f"<g stroke='{colour}' stroke-opacity='{a_minor}' stroke-width='.6'>{minor}</g>"
           f"<path d='M.5 0V60M0 .5H60' stroke='{colour}' stroke-opacity='{a_major}' stroke-width='.8'/></svg>")
    return "data:image/svg+xml," + quote(svg, safe="'/:=. ")


# Cyanotype: the blue never lies flat; it gathers and thins where the sensitiser was brushed on.
TEX_CYANO = tile(
    "<feTurbulence type='fractalNoise' baseFrequency='.012' numOctaves='4' seed='9' stitchTiles='stitch' result='n'/>"
    "<feColorMatrix in='n' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 2.4 0 0 0 -1.1' result='lite'/>"
    "<feColorMatrix in='n' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.4 0 0 0 1.3' result='dark'/>"
    "<feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='1' seed='2' stitchTiles='stitch'/>"
    "<feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 4 -2.9' result='spots'/>"
    "<feMerge><feMergeNode in='lite'/><feMergeNode in='dark'/><feMergeNode in='spots'/></feMerge>", 400, 400)


def rack():
    """The ring gear's teeth along the base ring's underside, seen in Detail B."""
    x0, x1, y = DET[0] - 140, DET[0] + 240, 316
    out = [(x0, y)]
    x = x0
    while x < x1:
        out += [(x + 1.2, y), (x + 2.4, y + 5.6), (x + 4.6, y + 5.6), (x + 5.8, y)]
        x += 7
    out += [(x1, y), (x1, y - 2), (x0, y - 2)]
    return closed(out)


def placeholders():
    big = gear(DET[0] + 32, 368, 24, 22)
    small = gear(DET[0] + 32, 333, 11, 10)
    fills, cut, see, fine, con, centre = building()
    c_lines, c_stars = constellations()
    p = plan()
    fill_markup = "".join(f'<path style="fill:var(--ob-{kind})" d="{d}"/>' for kind, d in fills)
    values = {
        "MECH": mechanism(big, small, rack()),
        "FILLS": fill_markup,
        "CUT": cut, "SEE": see, "FINE": fine, "CON": con, "CENTRE": centre,
        "DETAIL": detail_static(),
        "CONST_LINES": c_lines, "CONST_STARS": c_stars,
        "STARS": sky_stars(),
        "EARTH": earth_hatch(),
        "TEX_GRID": page_grid("#5E9DBC", .14, .28),
        "TEX_GRID_NIGHT": page_grid("#E8F1F8", .05, .1),
        "TEX_CYANO": TEX_CYANO,
        "ENVELOPE": circle(DEC[0], DEC[1], 156),
    }
    for k, v in p.items():
        values["PLAN_" + k.upper()] = v
    return values


# Scene picker glyph, 16 x 16: a domed observatory with its telescope through the slit.
GLYPH = ('<path d="M2.5 14.5h11M3.6 14.5V9.6h8.8v4.9"/><path d="M3 9.6a5 5 0 0 1 10 0"/>'
         '<path d="M8.4 9.4L11.2 3.4"/><path d="M6.6 14.5v-2.6h2.8v2.6"/>')
