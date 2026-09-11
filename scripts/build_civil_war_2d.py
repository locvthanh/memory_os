"""Rebuild src/scenes2d/civil-war.data.js for the 2D Civil War scene.

Run from the repo root, with `package/states-10m.json` alongside it:

    npm pack us-atlas@3          # public domain, no dependency is kept
    tar xzf us-atlas-3.0.1.tgz   # -> package/states-10m.json
    python scripts/build_civil_war_2d.py

Two halves:

1. The states. us-atlas `states-10m.json` is TopoJSON in WGS84. It is decoded,
   projected onto the standard US Albers equal-area conic (standard parallels
   29.5N/45.5N, central meridian 96W, latitude of origin 37.5N — the same
   projection the 3D civil-war-map relief plate used), fitted to a 1000-unit
   viewBox, Douglas-Peucker simplified at 0.45 units (~2 km) and emitted as SVG
   path data. Alaska, Hawaii and the territories outside the contiguous 48 are
   dropped, as are islands under 3 square units.

2. Everything else, hand-authored here in lon/lat and projected with the same
   fit: rivers, the year-by-year front line, the two blockade arcs, the campaign
   movement arrows, the eighteen locus pins and the orienting cities.

The front lines are *approximations* of the limit of Union control at the close
of each year, drawn to be readable rather than survey-accurate — this is a
memory palace, and the shape of the line year over year is the peg. They are
resampled to a common 140 vertices so the page can morph one year into the next
with a straight lerp.

Note SVG's y axis points down, so the conic's northward y is negated before the
fit; north is up on screen.
"""
import json, math


SRC = "package/states-10m.json"
topo = json.load(open(SRC))
tr = topo["transform"]
SX, SY = tr["scale"]
TX, TY = tr["translate"]

# ---------- topology decode ----------
def decode(arc):
    x = y = 0
    out = []
    for dx, dy in arc:
        x += dx; y += dy
        out.append((x * SX + TX, y * SY + TY))
    return out

arcs_ll = [decode(a) for a in topo["arcs"]]

# ---------- Albers conic (standard US: 29.5 / 45.5, -96, 37.5) ----------
R = 1.0
lat1, lat2 = math.radians(29.5), math.radians(45.5)
lon0, lat0 = math.radians(-96.0), math.radians(37.5)
n = 0.5 * (math.sin(lat1) + math.sin(lat2))
C = math.cos(lat1) ** 2 + 2 * n * math.sin(lat1)
rho0 = math.sqrt(C - 2 * n * math.sin(lat0)) / n

def albers(lon, lat):
    lam, phi = math.radians(lon), math.radians(lat)
    rho = math.sqrt(max(C - 2 * n * math.sin(phi), 1e-12)) / n
    th = n * (lam - lon0)
    # SVG y grows downward, so flip the conic's northward y.
    return (rho * math.sin(th), rho * math.cos(th) - rho0)

# ---------- fit to a viewBox ----------
# Fit on the contiguous 48 only (skip AK/HI/PR by FIPS).
SKIP_FIPS = {"02", "15", "72", "78", "60", "66", "69"}

ABBR = {
 "01":"AL","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC",
 "12":"FL","13":"GA","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY",
 "22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO",
 "30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC",
 "38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD",
 "47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY",
}

CONFEDERATE = {"AL","AR","FL","GA","LA","MS","NC","SC","TN","TX","VA"}
BORDER      = {"DE","KY","MD","MO","WV"}
TERRITORY   = {"AZ","CO","ID","MT","NE","NV","NM","ND","SD","OK","UT","WA","WY"}
# everything else = union

geoms = [g for g in topo["objects"]["states"]["geometries"] if g["id"] not in SKIP_FIPS]

# bounds in projected space
minx = miny = 1e9; maxx = maxy = -1e9
used_arcs = set()
def walk(arcidx):
    for i in arcidx:
        used_arcs.add(i if i >= 0 else ~i)
for g in geoms:
    polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
    for poly in polys:
        for ring in poly:
            walk(ring)
for i in used_arcs:
    for lon, lat in arcs_ll[i]:
        x, y = albers(lon, lat)
        minx = min(minx, x); maxx = max(maxx, x)
        miny = min(miny, y); maxy = max(maxy, y)

W = 1000.0
scale = W / (maxx - minx)
H = (maxy - miny) * scale
OX, OY = minx, miny

def proj(lon, lat):
    x, y = albers(lon, lat)
    return ((x - OX) * scale, (y - OY) * scale)

# ---------- simplify (Douglas-Peucker on projected coords) ----------
def dp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        if b - a < 2:
            continue
        ax, ay = pts[a]; bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        L2 = dx * dx + dy * dy
        best = -1.0; bi = -1
        for i in range(a + 1, b):
            px, py = pts[i]
            if L2 == 0:
                d = math.hypot(px - ax, py - ay)
            else:
                t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L2))
                d = math.hypot(px - (ax + t * dx), py - (ay + t * dy))
            if d > best:
                best = d; bi = i
        if best > tol:
            keep[bi] = True
            stack.append((a, bi)); stack.append((bi, b))
    return [p for p, k in zip(pts, keep) if k]

TOL = 0.45  # in viewBox units (~2 km at this scale)
arcs_xy = {}
for i in used_arcs:
    pts = [proj(lon, lat) for lon, lat in arcs_ll[i]]
    arcs_xy[i] = dp(pts, TOL)

def num(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s

def ring_points(ring):
    pts = []
    for idx in ring:
        a = arcs_xy[idx if idx >= 0 else ~idx]
        if idx < 0:
            a = a[::-1]
        if pts:
            a = a[1:]
        pts.extend(a)
    return pts

def area(pts):
    s = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2

MIN_ISLAND = 3.0  # drop specks (viewBox units^2)

states = []
for g in geoms:
    ab = ABBR.get(g["id"])
    if not ab:
        continue
    polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
    d = []
    biggest = None; biggest_a = -1
    for poly in polys:
        outer = ring_points(poly[0])
        a = area(outer)
        if a < MIN_ISLAND:
            continue
        if a > biggest_a:
            biggest_a = a; biggest = outer
        for ring in poly:
            pts = ring_points(ring) if ring is not poly[0] else outer
            if len(pts) < 3:
                continue
            d.append("M" + "L".join(f"{num(x)} {num(y)}" for x, y in pts) + "Z")
    if not d:
        continue
    # label anchor: centroid of the biggest ring, pulled inside
    cx = sum(p[0] for p in biggest) / len(biggest)
    cy = sum(p[1] for p in biggest) / len(biggest)
    side = ("confederate" if ab in CONFEDERATE else
            "border" if ab in BORDER else
            "territory" if ab in TERRITORY else "union")
    states.append({"ab": ab, "side": side, "d": "".join(d),
                   "c": [round(cx, 1), round(cy, 1)]})

states.sort(key=lambda s: s["ab"])
out = {"viewBox": [0, 0, round(W, 1), round(H, 1)], "states": states}

print(f"states: {len(states)}  fit: W={W:.1f} H={H:.1f} scale={scale:.2f}")


# Part 2 reuses part 1's fitted projection.
def P(lon, lat):
    x, y = proj(lon, lat)
    return [round(x, 1), round(y, 1)]


def line(path):
    return [P(*p) for p in path]

# ---------------------------------------------------------------- rivers
RIVERS = {
    # Mississippi: headwaters -> the Gulf
    "mississippi": line([(-94.9,44.9),(-91.9,43.8),(-91.2,42.5),(-90.6,41.5),
                         (-90.2,39.9),(-90.1,38.8),(-89.2,37.2),(-89.5,36.0),
                         (-90.0,35.1),(-90.9,34.0),(-91.1,32.5),(-91.5,31.2),
                         (-91.2,30.5),(-90.4,30.1),(-89.4,29.2)]),
    # Ohio: Pittsburgh -> Cairo
    "ohio": line([(-80.0,40.44),(-81.7,40.1),(-82.8,38.9),(-84.5,39.1),
                  (-86.2,37.9),(-87.6,37.9),(-88.5,37.2),(-89.1,37.0)]),
    # Tennessee + Cumberland: Grant's two highways south
    "tennessee": line([(-83.9,35.96),(-85.3,35.0),(-86.5,34.75),(-87.6,35.0),
                       (-88.0,35.6),(-88.05,36.5),(-88.3,37.05),(-88.5,37.06)]),
    "cumberland": line([(-84.5,36.6),(-85.5,36.5),(-86.78,36.16),(-87.4,36.3),
                        (-87.85,36.5),(-87.9,37.1),(-88.4,37.15)]),
    # Potomac + James, for the Eastern Theatre
    "potomac": line([(-78.2,39.5),(-77.7,39.3),(-77.2,38.95),(-77.05,38.7),
                     (-76.5,38.2),(-76.3,38.0)]),
    "james": line([(-79.0,37.6),(-78.0,37.5),(-77.45,37.53),(-77.0,37.3),
                   (-76.6,37.2),(-76.3,37.0)]),
}

# ------------------------------------------------- front line, year by year
# Approximate southern/western limit of Union control at the close of each year.
FRONTS = [
    {"year": 1861, "label": "The border states hold",
     "path": line([(-95.1,37.0),(-94.6,36.5),(-91.0,36.5),(-89.5,36.5),
                   (-89.1,37.0),(-88.0,37.2),(-86.4,37.9),(-84.8,38.7),
                   (-82.6,38.4),(-80.5,39.2),(-79.4,39.3),(-77.9,39.3),
                   (-77.2,38.9),(-77.3,38.4),(-76.4,38.0)])},
    {"year": 1862, "label": "Tennessee and the lower river fall",
     "path": line([(-94.6,35.8),(-92.0,35.6),(-90.1,35.1),(-88.2,35.0),
                   (-86.6,35.2),(-85.4,35.6),(-83.5,36.4),(-81.7,37.4),
                   (-80.0,38.8),(-78.2,38.9),(-77.5,38.5),(-76.6,38.05)])},
    {"year": 1863, "label": "Vicksburg splits the Confederacy",
     "path": line([(-94.2,34.6),(-92.3,34.4),(-91.2,33.3),(-90.4,34.6),
                   (-88.6,34.9),(-86.6,34.9),(-85.3,35.05),(-83.6,35.9),
                   (-81.8,37.2),(-79.6,38.4),(-77.9,38.4),(-76.7,38.0)])},
    {"year": 1864, "label": "Atlanta, then the march to the sea",
     "path": line([(-93.8,33.8),(-92.0,33.2),(-91.3,32.4),(-89.0,33.4),
                   (-86.4,34.0),(-84.4,33.75),(-83.2,32.9),(-81.4,32.2),
                   # From Savannah the line hugs the coast the Union navy held
                   # rather than cutting inland through Confederate Carolina.
                   (-81.1,32.08),(-80.0,32.6),(-79.0,33.4),(-77.9,34.2),
                   (-76.5,34.8),(-75.9,35.6),(-76.0,36.5),(-76.9,36.9),
                   (-77.4,37.25)])},
    {"year": 1865, "label": "Petersburg breaks; Appomattox",
     "path": line([(-93.5,32.6),(-90.5,32.4),(-87.5,32.6),(-84.5,33.0),
                   (-82.0,34.2),(-80.4,35.1),(-78.6,35.7),(-77.9,36.6),
                   (-77.4,37.25),(-77.0,37.5)])},
]

# ------------------------------------------------------------ the Anaconda
BLOCKADE = [
    {"label": "Atlantic squadrons",
     "path": line([(-75.2,37.6),(-75.1,36.3),(-75.6,35.0),(-77.6,34.0),
                   (-79.4,32.8),(-80.9,31.7),(-81.2,30.2),(-80.4,28.0),
                   (-80.2,26.0),(-81.5,24.6)])},
    {"label": "Gulf squadrons",
     "path": line([(-81.9,24.7),(-83.5,26.5),(-84.5,29.0),(-87.2,30.0),
                   (-89.0,29.6),(-90.5,28.9),(-92.5,29.2),(-94.3,29.2),
                   (-96.5,28.2),(-97.3,26.6)])},
]

# ------------------------------------------------- great campaign movements
ARROWS = [
    {"id": "grant-rivers", "year": 1862, "label": "Grant up the rivers",
     "path": line([(-89.1,37.0),(-88.5,36.9),(-87.85,36.5),(-88.05,35.9),(-88.34,35.14)])},
    {"id": "farragut", "year": 1862, "label": "Farragut takes New Orleans",
     "path": line([(-89.0,28.6),(-89.4,29.2),(-90.07,29.95)])},
    {"id": "vicksburg", "year": 1863, "label": "Grant's Vicksburg march",
     # Down the west bank, across at Bruinsburg, east to Jackson, then back
     # west onto the city — the hook is the whole point of the campaign.
     "path": line([(-90.9,34.0),(-91.15,32.9),(-91.05,32.0),(-90.55,32.05),
                   (-90.18,32.30),(-90.55,32.33),(-90.88,32.35)])},
    {"id": "lee-north", "year": 1863, "label": "Lee invades the North",
     "path": line([(-77.5,38.2),(-78.2,38.9),(-77.9,39.5),(-77.23,39.83)])},
    {"id": "sherman", "year": 1864, "label": "Sherman: Chattanooga to the sea",
     "path": line([(-85.31,35.05),(-84.9,34.4),(-84.39,33.75),(-83.2,33.0),
                   (-82.0,32.5),(-81.09,32.08)])},
    {"id": "overland", "year": 1864, "label": "Grant's Overland Campaign",
     "path": line([(-77.78,38.31),(-77.6,38.2),(-77.5,37.9),(-77.4,37.23)])},
    {"id": "hood", "year": 1864, "label": "Hood's last march north",
     "path": line([(-84.39,33.75),(-86.0,34.5),(-86.87,35.92),(-86.78,36.16)])},
]

# ---------------------------------------------------------------- the loci
# lon/lat of each stop, in the tour's chronological order.
LOCI_LL = [
    (1,  -79.874, 32.752),   # Fort Sumter
    (2,  -78.20,  31.20),    # Anaconda Plan (offshore, over the blockade arc)
    (3,  -77.521, 38.813),   # First Bull Run
    (4,  -87.855, 36.487),   # Forts Henry & Donelson
    (5,  -88.343, 35.139),   # Shiloh
    (6,  -90.071, 29.951),   # New Orleans
    (7,  -77.744, 39.474),   # Antietam
    (8,  -77.460, 38.302),   # Fredericksburg
    (9,  -77.638, 38.309),   # Chancellorsville
    (10, -90.878, 32.352),   # Vicksburg
    (11, -77.231, 39.831),   # Gettysburg
    (12, -85.310, 35.045),   # Chickamauga & Chattanooga
    (13, -77.780, 38.310),   # Overland Campaign (the Wilderness)
    (14, -77.402, 37.231),   # Petersburg
    (15, -84.390, 33.749),   # Atlanta
    (16, -81.090, 32.080),   # March to the Sea (Savannah)
    (17, -86.780, 36.160),   # Franklin & Nashville
    (18, -78.796, 37.377),   # Appomattox
]

# City ticks that orient the reader without being tour stops.
CITIES = [
    ("Washington", -77.04, 38.91), ("Richmond", -77.44, 37.54),
    ("Charleston", -79.93, 32.78), ("Savannah", -81.09, 32.08),
    ("Atlanta", -84.39, 33.75), ("Nashville", -86.78, 36.16),
    ("Memphis", -90.05, 35.15), ("Vicksburg", -90.88, 32.35),
    ("New Orleans", -90.07, 29.95), ("St. Louis", -90.20, 38.63),
    ("Cairo", -89.18, 37.01), ("Chattanooga", -85.31, 35.05),
    ("Philadelphia", -75.16, 39.95), ("New York", -74.01, 40.71),
]


# ------------------------------------------------------------------- emit

# One common vertex count, so the page can morph year N into year N+1 by lerp.
N = 140

def resample(path, n):
    d = [0.0]
    for i in range(1, len(path)):
        d.append(d[-1] + math.hypot(path[i][0] - path[i-1][0], path[i][1] - path[i-1][1]))
    total = d[-1]
    out, j = [], 0
    for kk in range(n):
        t = total * kk / (n - 1)
        while j < len(d) - 2 and d[j+1] < t:
            j += 1
        seg = d[j+1] - d[j]
        fr = 0 if seg == 0 else (t - d[j]) / seg
        out.append([round(path[j][0] + (path[j+1][0] - path[j][0]) * fr, 1),
                    round(path[j][1] + (path[j+1][1] - path[j][1]) * fr, 1)])
    return out

for fr in FRONTS:
    fr["path"] = resample(fr["path"], N)

FELL = {"TN": 1862, "LA": 1862, "AR": 1863, "MS": 1863, "GA": 1864,
        "AL": 1865, "SC": 1865, "NC": 1865, "VA": 1865, "FL": 1865, "TX": 1865}
for s in states:
    if s["ab"] in FELL:
        s["fell"] = FELL[s["ab"]]

data = {
    "viewBox": [-14, -12, 1028, 658],
    "world": [0, 0, round(W, 1), round(H, 1)],
    "states": states,
    "rivers": RIVERS,
    "fronts": FRONTS,
    "blockade": BLOCKADE,
    "arrows": ARROWS,
    "pins": {str(i): P(lon, lat) for i, lon, lat in LOCI_LL},
    "cities": [{"name": nm, "p": P(lon, lat)} for nm, lon, lat in CITIES],
}

BANNER = (
    "// Generated map geometry for the 2D Civil War scene. Do not hand-edit.\n"
    "// Rebuild with: python scripts/build_civil_war_2d.py\n"
    "//\n"
    "// Source: us-atlas 3.0.1 states-10m.json (public domain), projected onto\n"
    "// the standard US Albers equal-area conic and simplified. Rivers, front\n"
    "// lines, blockade arcs, campaign arrows, locus pins and cities are hand-\n"
    "// authored in lon/lat in the build script and projected with the same fit.\n"
    "// Front lines are approximate and resampled to a common vertex count so\n"
    "// the page can morph one year into the next.\n\n"
    "export const MAP = "
)

OUT = "src/scenes2d/civil-war.data.js"
with open(OUT, "w", encoding="utf-8") as fh:
    fh.write(BANNER + json.dumps(data, separators=(",", ":")) + ";\n")
print("wrote", OUT, len(open(OUT, encoding="utf-8").read()), "bytes")
