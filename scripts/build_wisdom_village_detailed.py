"""Build the Wisdom Village — detailed pass, recreating the reference image.

    blender -b -P scripts/build_wisdom_village.py

Five "houses of knowledge" (Triet hoc / Khoa hoc / Van hoc / Nghe thuat /
Dao duc) arranged around a stepped hilltop plaza with the sage statue,
entered through a large timber paifang gate. Terraced low-poly diorama,
flat-shaded, saturated colour, mid-day sun. This supersedes the earlier
12-plot placeholder layout pass (see project doc history) — the real,
image-accurate buildings replace the abstract archetypes.

Fully procedural + idempotent: wipes the file, rebuilds everything from
scratch in one pass. Never hand-edit the .blend and expect it to survive
a re-run — edit this script instead.
"""
import bpy, bmesh, os, math, random
from mathutils import Matrix

BLEND = r"C:\Users\ASUS\Desktop\Loc\blender\blender_models\WisdomVillage.blend"
RENDER_OUT = r"C:\Users\ASUS\Desktop\Loc\blender\blender_models\WV_hero_render.png"
REPO = r"C:\Users\ASUS\Desktop\Loc\memory_os"
OUT_GLB = os.path.join(REPO, "models", "wisdom-village.glb")
FONT_PATH = "C:/Windows/Fonts/segoeui.ttf"
FONT_PATH_B = "C:/Windows/Fonts/segoeuib.ttf"

# ---------------------------------------------------------------- reset ----
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    bpy.data.collections.remove(c)
for datablock_coll in (bpy.data.meshes, bpy.data.curves, bpy.data.materials,
                        bpy.data.lights, bpy.data.cameras):
    for db in list(datablock_coll):
        if db.users == 0:
            datablock_coll.remove(db)

scene = bpy.context.scene
ROOT = scene.collection
_CUR = [ROOT]
_PFX = [""]


def coll(name):
    c = bpy.data.collections.new(name)
    ROOT.children.link(c)
    return c


def use(c):
    _CUR[0] = c


def link(ob):
    nm = _PFX[0] + ob.name
    ob.name = nm
    _CUR[0].objects.link(ob)
    return ob


# ------------------------------------------------------------- colour -----
def _s2l(v):
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def hexcol(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    return (_s2l(r), _s2l(g), _s2l(b))


_MATCACHE = {}


def mat(name, hexstr, rough=0.75, metal=0.0):
    if name in _MATCACHE:
        return _MATCACHE[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*hexcol(hexstr), 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    try:
        m.blend_method = "OPAQUE"
    except Exception:
        pass
    _MATCACHE[name] = m
    return m


def gmat(name, hexstr, rough=0.15):
    """Glass-ish: some transmission-free specular via low roughness + tint."""
    m = mat(name, hexstr, rough=rough, metal=0.0)
    return m


def emat(name, hexstr, strength=3.0):
    if name in _MATCACHE:
        return _MATCACHE[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*hexcol(hexstr), 1.0)
    for key in ("Emission Color", "Emission"):
        if key in b.inputs:
            b.inputs[key].default_value = (*hexcol(hexstr), 1.0)
            break
    if "Emission Strength" in b.inputs:
        b.inputs["Emission Strength"].default_value = strength
    _MATCACHE[name] = m
    return m


# palette -------------------------------------------------------------------
SKY_TOP, SKY_HOR, CLOUD = "#6FAAE2", "#B4D6F2", "#FFFFFF"
GRASS_L = mat("M_GrassLight", "#8ACB55", rough=0.85)
GRASS_M = mat("M_GrassMid", "#6FB544", rough=0.85)
GRASS_D = mat("M_GrassDark", "#4E8B36", rough=0.85)
ROCK_L = mat("M_RockLight", "#D3D7DA", rough=0.9)
ROCK_M = mat("M_RockMid", "#B3B9BE", rough=0.9)
ROCK_D = mat("M_RockDark", "#8F969C", rough=0.9)
PAVE = mat("M_Paving", "#E2DFD4", rough=0.55)
STEP = mat("M_Step", "#CFCBBD", rough=0.55)
STONE_D = mat("M_StoneDark", "#A9A599", rough=0.6)
MARBLE = mat("M_Marble", "#F3F1E7", rough=0.4)
MARBLE_S = mat("M_MarbleShade", "#DCD9CC", rough=0.45)
TIMBER_L = mat("M_TimberLight", "#9A6B3C", rough=0.85)
TIMBER_M = mat("M_TimberMid", "#7A5230", rough=0.85)
TIMBER_D = mat("M_TimberDark", "#4C3420", rough=0.85)
THATCH = mat("M_Thatch", "#C9A44C", rough=0.9)
SHINGLE = mat("M_Shingle", "#B08B45", rough=0.85)
ROOF_NAVY = mat("M_RoofNavy", "#2F3F6B", rough=0.55)
ROOF_SLATE = mat("M_RoofSlate", "#495468", rough=0.55)
ROOF_SLATE_DK = mat("M_RoofSlateDk", "#39424F", rough=0.55)
STUCCO = mat("M_Stucco", "#F0E8D3", rough=0.7)
TRIM_GOLD = mat("M_TrimGold", "#D8A93C", rough=0.4, metal=0.15)
LANTERN_RED = emat("M_LanternRed", "#C8402E", 2.5)
TEMPLE_RED = mat("M_TempleRed", "#A6412C", rough=0.6)
GLASS_DARK = gmat("M_GlassDark", "#2C3A42", rough=0.15)
GLASS_TEAL = gmat("M_GlassTeal", "#3E5560", rough=0.15)
WINDOW_WARM = emat("M_WindowWarm", "#F6CB7E", 4.0)
TREE_A = mat("M_TreeA", "#4E9A46", rough=0.85)
TREE_B = mat("M_TreeB", "#3E8038", rough=0.85)
CONIFER = mat("M_Conifer", "#2F5D3A", rough=0.85)
MAPLE_R = mat("M_MapleRed", "#C1502E", rough=0.85)
MAPLE_O = mat("M_MapleOrange", "#D9743A", rough=0.85)
BANNER_NAVY = mat("M_BannerNavy", "#2B3A6B", rough=0.7)
GOLD_EMBLEM = mat("M_GoldEmblem", "#D9B84A", rough=0.35, metal=0.4)
BRASS = mat("M_Brass", "#D9B84A", rough=0.3, metal=0.7)
INK = mat("M_Ink", "#3B2A18", rough=0.6)
MTN_NEAR = mat("M_MtnNear", "#9AA6B8", rough=0.9)
MTN_FAR = mat("M_MtnFar", "#B9C6D8", rough=0.9)
SNOW = mat("M_Snow", "#F4F7FA", rough=0.6)
CLOUD_M = mat("M_Cloud", "#FFFFFF", rough=0.9)
CLOUD_M.use_nodes = True
_b = CLOUD_M.node_tree.nodes.get("Principled BSDF")
if "Alpha" in _b.inputs:
    _b.inputs["Alpha"].default_value = 0.85
try:
    CLOUD_M.blend_method = "BLEND"
except Exception:
    pass
GRAVEL = mat("M_Gravel", "#CFCBBD", rough=0.95)
SCULPT_METAL = mat("M_SculptMetal", "#DCD9CC", rough=0.25, metal=0.5)


# ------------------------------------------------------------- geometry ----
def box(name, mn, mx, m):
    x0, y0, z0 = mn
    x1, y1, z1 = mx
    v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
         (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    f = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1),
         (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    me.update()
    me.materials.append(m)
    return link(bpy.data.objects.new(name, me))


def obox(name, size, loc, rot, m):
    sx, sy, sz = (s / 2.0 for s in size)
    ob = box(name, (-sx, -sy, -sz), (sx, sy, sz), m)
    ob.location = loc
    ob.rotation_euler = rot
    return ob


def _bm_obj(name, bm, m):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m)
    return link(bpy.data.objects.new(name, me))


def cyl(name, x, y, z0, z1, r, m, verts=16, r2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts,
                           radius1=r, radius2=(r if r2 is None else r2),
                           depth=(z1 - z0),
                           matrix=Matrix.Translation((x, y, (z0 + z1) / 2.0)))
    return _bm_obj(name, bm, m)


def cyl_axisY(name, x, y0, y1, z, r, m, verts=16, r2=None):
    """Cylinder whose axis runs along Y (for wheels, ring emblems, discs)."""
    bm = bmesh.new()
    mat4 = Matrix.Translation((x, (y0 + y1) / 2.0, z)) @ Matrix.Rotation(math.radians(90), 4, 'X')
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts,
                           radius1=r, radius2=(r if r2 is None else r2),
                           depth=(y1 - y0), matrix=mat4)
    return _bm_obj(name, bm, m)


def cone(name, x, y, z0, z1, r, m, verts=16):
    return cyl(name, x, y, z0, z1, r, m, verts=verts, r2=0.0)


def sphere(name, x, y, z, r, m, subd=2, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subd, radius=r,
                                matrix=Matrix.Translation((x, y, z)))
    ob = _bm_obj(name, bm, m)
    ob.scale = scale
    return ob


def gable(name, x0, x1, y0, y1, z0, zpk, m, ridge="y"):
    if ridge == "y":
        xm = (x0 + x1) / 2.0
        v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
             (xm, y0, zpk), (xm, y1, zpk)]
        f = [(0, 3, 2, 1), (0, 1, 4), (3, 5, 2), (0, 4, 5, 3), (1, 2, 5, 4)]
    else:
        ym = (y0 + y1) / 2.0
        v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
             (x0, ym, zpk), (x1, ym, zpk)]
        f = [(0, 3, 2, 1), (0, 4, 3), (1, 2, 5), (0, 1, 5, 4), (3, 4, 5, 2)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    me.update()
    me.materials.append(m)
    return link(bpy.data.objects.new(name, me))


def pyramid(name, x0, x1, y0, y1, z0, zpk, m, tip=0.0):
    xm, ym = (x0 + x1) / 2.0, (y0 + y1) / 2.0
    if tip <= 0:
        v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (xm, ym, zpk)]
        f = [(0, 3, 2, 1), (0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)]
    else:
        t = tip / 2.0
        v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
             (xm - t, ym - t, zpk), (xm + t, ym - t, zpk),
             (xm + t, ym + t, zpk), (xm - t, ym + t, zpk)]
        f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
             (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    me.update()
    me.materials.append(m)
    return link(bpy.data.objects.new(name, me))


def hip_swept(name, x0, x1, y0, y1, z0, zpk, m, lift=0.45, tip=0.0):
    """Hip roof with upswept corners: corners raised above edge-midpoints."""
    xm, ym = (x0 + x1) / 2.0, (y0 + y1) / 2.0
    corners = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    mids = [(xm, y0), (x1, ym), (xm, y1), (x0, ym)]
    v = []
    idx_c, idx_m = [], []
    for (cx, cy) in corners:
        idx_c.append(len(v)); v.append((cx, cy, z0 + lift))
    for (mx, my) in mids:
        idx_m.append(len(v)); v.append((mx, my, z0))
    order = [idx_c[0], idx_m[0], idx_c[1], idx_m[1], idx_c[2], idx_m[2], idx_c[3], idx_m[3]]
    f = []
    if tip <= 0:
        apex = len(v); v.append((xm, ym, zpk))
        for i in range(8):
            f.append((order[i], order[(i + 1) % 8], apex))
        f.append(tuple(reversed(order)))
    else:
        t = tip / 2.0
        top = [(xm - t, ym - t, zpk), (xm + t, ym - t, zpk),
               (xm + t, ym + t, zpk), (xm - t, ym + t, zpk)]
        top_idx = []
        for tv in top:
            top_idx.append(len(v)); v.append(tv)
        f.append(tuple(reversed(order)))
        pairing = [top_idx[0], top_idx[0], top_idx[1], top_idx[1],
                   top_idx[2], top_idx[2], top_idx[3], top_idx[3]]
        for i in range(8):
            f.append((order[i], order[(i + 1) % 8], pairing[i]))
        f.append(tuple(top_idx))
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    me.update()
    me.materials.append(m)
    return link(bpy.data.objects.new(name, me))


def bipyramid(name, x, y, z0, z1, r, m, verts=4):
    """Elongated diamond / prism standing on one point — abstract sculpture."""
    zm0, zm1 = z0 + (z1 - z0) * 0.15, z0 + (z1 - z0) * 0.55
    bm = bmesh.new()
    ring = []
    for i in range(verts):
        a = 2 * math.pi * i / verts
        ring.append(bm.verts.new((x + math.cos(a) * r, y + math.sin(a) * r, zm1)))
    ring2 = []
    for i in range(verts):
        a = 2 * math.pi * i / verts
        ring2.append(bm.verts.new((x + math.cos(a) * r * 0.55, y + math.sin(a) * r * 0.55, zm0)))
    tip_bot = bm.verts.new((x, y, z0))
    tip_top = bm.verts.new((x, y, z1))
    for i in range(verts):
        bm.faces.new((tip_bot, ring2[i], ring2[(i + 1) % verts]))
        bm.faces.new((ring2[i], ring[i], ring[(i + 1) % verts], ring2[(i + 1) % verts]))
        bm.faces.new((ring[i], tip_top, ring[(i + 1) % verts]))
    return _bm_obj(name, bm, m)


_FONT_CACHE = {}


def _font(bold=False):
    p = FONT_PATH_B if bold else FONT_PATH
    if p in _FONT_CACHE:
        return _FONT_CACHE[p]
    try:
        f = bpy.data.fonts.load(p)
    except Exception:
        f = None
    _FONT_CACHE[p] = f
    return f


def text(name, body, size, loc, rot, m, extrude=0.03, bold=False, align="CENTER"):
    cu = bpy.data.curves.new(name + "_fnt", "FONT")
    cu.body = body
    cu.size = size
    cu.align_x = align
    cu.align_y = "CENTER"
    cu.extrude = extrude
    f = _font(bold)
    if f is not None:
        cu.font = f
    tmp = bpy.data.objects.new(name + "_fnt", cu)
    ROOT.objects.link(tmp)
    tmp.location = loc
    tmp.rotation_euler = rot
    dg = bpy.context.evaluated_depsgraph_get()
    try:
        me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    except Exception:
        me = bpy.data.meshes.new_from_object(tmp)
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    ob.rotation_euler = rot
    ob.data.materials.clear()
    ob.data.materials.append(m)
    link(ob)
    bpy.data.objects.remove(tmp, do_unlink=True)
    return ob


# ---------------------------------------------------------------- props ----
def tree(name, x, y, z, h=4.0, kind=0, mA=None, mB=None):
    mA = mA or TREE_A
    mB = mB or TREE_B
    r = h * 0.20
    cyl(name + "_trunk", x, y, z, z + h * 0.42, r * 0.30, TIMBER_D, verts=7)
    if kind == 0:
        sphere(name + "_c0", x, y, z + h * 0.70, h * 0.34, mB, subd=1)
        sphere(name + "_c1", x + r * 0.35, y - r * 0.25, z + h * 0.55, h * 0.24, mA, subd=1)
        sphere(name + "_c2", x - r * 0.30, y + r * 0.20, z + h * 0.90, h * 0.20, mB, subd=1)
    elif kind == 1:
        for i, f in enumerate((0.0, 0.24, 0.46)):
            cone(name + "_c%d" % i, x, y, z + h * (0.32 + f), z + h * (0.68 + f),
                 r * (1.0 - f * 0.85), CONIFER if i % 2 == 0 else mB, verts=8)
    else:
        sphere(name + "_c0", x, y, z + h * 0.72, h * 0.32, MAPLE_R, subd=1)
        sphere(name + "_c1", x + r * 0.3, y - r * 0.2, z + h * 0.58, h * 0.22, MAPLE_O, subd=1)


def bush(name, x, y, z, r=0.6, m=None):
    sphere(name, x, y, z + r * 0.6, r, m or GRASS_D, subd=1, scale=(1, 1, 0.6))


def rock(name, x, y, z, r=0.6, m=None):
    sphere(name, x, y, z + r * 0.35, r, m or ROCK_M, subd=1,
           scale=(1.0 + random.random() * 0.3, 1.0 + random.random() * 0.3, 0.6))


def stone_lantern(name, x, y, z, h=1.3):
    box(name + "_base", (x - 0.25, y - 0.25, z), (x + 0.25, y + 0.25, z + 0.2), STONE_D)
    cyl(name + "_shaft", x, y, z + 0.2, z + h * 0.55, 0.11, STONE_D, verts=8)
    box(name + "_head", (x - 0.24, y - 0.24, z + h * 0.55), (x + 0.24, y + 0.24, z + h * 0.85), STONE_D)
    for s, ax in ((-1, 0), (1, 0), (-1, 1), (1, 1)):
        pass
    box(name + "_glow", (x - 0.16, y - 0.16, z + h * 0.60), (x + 0.16, y + 0.16, z + h * 0.80), emat("M_LampGlow", "#F6CB7E", 5.0))
    pyramid(name + "_cap", x - 0.32, x + 0.32, y - 0.32, y + 0.32, z + h * 0.85, z + h * 1.1, STONE_D)


def bench(name, x, y, z, rot=0.0):
    obox(name + "_seat", (1.9, 0.5, 0.12), (x, y, z + 0.42), (0, 0, rot), STEP)
    for s in (-0.7, 0.7):
        dx, dy = math.cos(rot) * 0 + s * -math.sin(rot), s * math.cos(rot)
        obox(name + "_leg%d" % int(s * 10), (0.16, 0.45, 0.42), (x + dx, y + dy, z + 0.21), (0, 0, rot), STONE_D)


def paper_lantern(name, x, y, z, r=0.2):
    sphere(name + "_body", x, y, z, r, LANTERN_RED, subd=1, scale=(1, 1, 1.25))
    box(name + "_cap", (x - r * 0.5, y - r * 0.5, z + r * 1.1), (x + r * 0.5, y + r * 0.5, z + r * 1.3), TIMBER_D)
    cyl(name + "_tassel", x, y, z - r * 1.4, z - r * 1.05, 0.02, TIMBER_D, verts=5)


def signboard(name, x, y, z, w, h, lines, rot_z=0.0, font_size=0.34, bold=False):
    rot = (math.pi / 2, 0, rot_z)
    nvec = (math.sin(rot_z), -math.cos(rot_z))
    ox, oy = x + nvec[0] * 0.10, y + nvec[1] * 0.10
    obox(name + "_board", (0.10, w, h), (x, y, z), (0, 0, rot_z), TIMBER_L)
    obox(name + "_frame", (0.06, w + 0.22, h + 0.22), (x - nvec[0] * 0.03, y - nvec[1] * 0.03, z), (0, 0, rot_z), TIMBER_D)
    n = len(lines)
    for i, line in enumerate(lines):
        dz = (n - 1) / 2.0 * font_size * 1.35 - i * font_size * 1.35
        text(name + "_t%d" % i, line, font_size, (ox, oy, z + dz), rot, INK, bold=bold)


def fence_run(name, x0, y0, x1, y1, z, n=6, h=0.9):
    dx, dy = (x1 - x0) / n, (y1 - y0) / n
    for i in range(n + 1):
        px, py = x0 + dx * i, y0 + dy * i
        cyl(name + "_post%d" % i, px, py, z, z + h, 0.06, TIMBER_M, verts=6)
    for k, fz in enumerate((h * 0.4, h * 0.85)):
        obox(name + "_rail%d" % k, (abs(x1 - x0) + 0.1 if x1 != x0 else 0.12,
                                     abs(y1 - y0) + 0.1 if y1 != y0 else 0.12, 0.06),
             ((x0 + x1) / 2, (y0 + y1) / 2, z + fz), (0, 0, math.atan2(y1 - y0, x1 - x0)), TIMBER_M)


# ============================================================ TERRAIN =====
use(coll("Terrain"))
LEVELS = {
    "L0": dict(z=0.0, xh=20.0, y0=-16.0, y1=-11.0),
    "L1": dict(z=2.5, xh=22.0, y0=-11.0, y1=-2.0),
    "L2": dict(z=5.5, xh=25.0, y0=-2.0, y1=6.0),
    "L3": dict(z=9.0, xh=10.0, xc=-2.0, y0=6.0, y1=13.0),
}
BASE_Z = -9.0
random.seed(11)
for i, key in enumerate(("L0", "L1", "L2", "L3")):
    L = LEVELS[key]
    xc = L.get("xc", 0.0)
    xh, y0, y1, tz = L["xh"], L["y0"], L["y1"], L["z"]
    box("%s_rock" % key, (xc - xh + 1.0, y0 + 1.0, BASE_Z), (xc + xh - 1.0, y1, tz - 0.6), ROCK_M)
    box("%s_rock_band" % key, (xc - xh + 2.0, y0 + 2.0, BASE_Z), (xc + xh - 2.0, y1, tz - 0.15), ROCK_D)
    box("%s_grass" % key, (xc - xh, y0, tz - 0.6), (xc + xh, y1, tz), GRASS_M)
    box("%s_rim" % key, (xc - xh, y0, tz - 0.02), (xc + xh, y0 + 1.4, tz + 0.05), GRASS_D)
    # a few jittered rock chunks along the front cliff edge for an irregular look
    for k in range(10):
        rx = xc - xh + 2.5 + k * (2 * xh - 5.0) / 9.0 + random.uniform(-0.6, 0.6)
        rz = tz - 0.6 - random.uniform(0.0, 0.8)
        box("%s_chip%d" % (key, k), (rx - 0.7, y0 + 0.6, rz - 0.5), (rx + 0.7, y0 + 1.4, rz + 0.3),
            ROCK_D if k % 2 == 0 else ROCK_M)

# entry apron in front of the gate
box("Apron_rock", (-20, -22, BASE_Z), (20, -16, -0.6), ROCK_M)
box("Apron_grass", (-20, -22, -0.6), (20, -16, 0.0), GRASS_L)


# =========================================================== STAIRS ========
use(coll("Terrain"))


def stairs(name, xc, w, y0, y1, z0, z1, n=10):
    dy, dz = (y1 - y0) / n, (z1 - z0) / n
    for k in range(n):
        box("%s_step%02d" % (name, k),
            (xc - w / 2, y0 + k * dy, z0 - 0.35), (xc + w / 2, y0 + (k + 1) * dy, z0 + (k + 1) * dz),
            STEP if k % 2 == 0 else PAVE)
    for s in (-1, 1):
        sx = xc + s * (w / 2 + 0.35)
        box("%s_cheek%d" % (name, s), (sx - 0.35, y0 - 0.4, z0 - 0.5), (sx + 0.35, y1 + 0.4, z1 + 0.35), ROCK_D)


stairs("StairL0L1", 1.0, 4.0, -13.4, -11.0, 0.0, 2.5, n=9)
stairs("StairSpineLo", -2.0, 3.5, -4.2, -2.0, 2.5, 5.5, n=9)
stairs("StairSpineHi", -2.0, 3.5, 3.8, 6.0, 5.5, 9.0, n=9)
stairs("StairVanHoc", 4.5, 4.0, -4.2, -2.0, 2.5, 5.5, n=9)
stairs("StairVanHocPad", 5.5, 3.2, 4.4, 6.0, 5.5, 7.5, n=6)
stairs("StairDaoDuc", 11.0, 3.0, -9.4, -7.4, 2.5, 4.0, n=6)
stairs("StairKhoaHoc", -9.0, 2.5, -4.2, -2.0, 2.5, 5.5, n=9)

# spine paving landing across L2 between the two stair flights
box("SpineLanding", (-3.75, -2.0, 5.5 - 0.02), (-0.25, 3.8, 5.5 + 0.06), PAVE)

# flagstone paths
PATHS = [
    (-16.5, -2.0, 1.5, -2.0, 0.06),   # gate apron -> plaza area (L1 level approx, drawn on ground)
    (1.0, -11.0, 1.0, -9.4, 2.51),    # foot of central stair on plaza floor
    (-2.0, -2.0, -2.0, -1.0, 5.51),
]
for i, (x0, y0, x1, y1, z) in enumerate(PATHS):
    lo_x, hi_x = min(x0, x1) - 1.4, max(x0, x1) + 1.4
    lo_y, hi_y = min(y0, y1) - 1.4, max(y0, y1) + 1.4
    box("Path_%d" % i, (lo_x, lo_y, z - 0.02), (hi_x, hi_y, z + 0.04), PAVE)


# =============================================================== GATE ======
use(coll("Gate"))
GX, GY = -9.5, -15.0
for s in (-3.25, 3.25):
    px = GX + s
    box("Gate_base1_%d" % int(s * 10), (px - 0.9, GY - 0.9, 0.0), (px + 0.9, GY + 0.9, 0.5), STONE_D)
    box("Gate_base2_%d" % int(s * 10), (px - 0.7, GY - 0.7, 0.5), (px + 0.7, GY + 0.7, 0.9), PAVE)
    box("Gate_post_%d" % int(s * 10), (px - 0.35, GY - 0.35, 0.9), (px + 0.35, GY + 0.35, 6.5), TIMBER_M)
    for cz in (2.2, 4.4):
        box("Gate_chamfer_%d_%d" % (int(s * 10), int(cz)), (px - 0.36, GY - 0.36, cz - 0.06),
            (px + 0.36, GY + 0.36, cz + 0.06), TIMBER_D)
    # banner + gold ring emblem, inner face
    ny = GY - 0.36 * (1 if s < 0 else -1) * 0 + GY  # unused, keep simple
    bx = px
    obox("Gate_banner_%d" % int(s * 10), (0.06, 0.55, 2.6), (bx, GY, 6.0), (0, 0, 0), BANNER_NAVY)
    cyl_axisY("Gate_ring_out_%d" % int(s * 10), bx, GY - 0.10, GY + 0.02, 5.15, 0.22, GOLD_EMBLEM, verts=14)
    cyl_axisY("Gate_ring_in_%d" % int(s * 10), bx, GY - 0.13, GY - 0.03, 5.15, 0.12, BANNER_NAVY, verts=12)
    stone_lantern("Gate_lamp_%d" % int(s * 10), px + (1.6 if s < 0 else -1.6), GY + 1.6, 0.0, 1.3)

box("Gate_lintel", (GX - 4.1, GY - 0.55, 6.5), (GX + 4.1, GY + 0.55, 7.1), TIMBER_D)
box("Gate_board", (GX - 2.8, GY - 0.5, 7.35), (GX + 2.8, GY + 0.5, 9.25), TIMBER_L)
box("Gate_board_frame", (GX - 3.0, GY - 0.58, 7.2), (GX + 3.0, GY + 0.58, 9.4), TIMBER_D)
text("Gate_text1", "Làng của", 0.44, (GX - 0.62, GY - 0.60, 8.62), (math.pi / 2, 0, 0), INK, bold=True)
text("Gate_text2", "những nhà hiền triết", 0.40, (GX - 0.62, GY - 0.60, 8.05), (math.pi / 2, 0, 0), INK, bold=True)
hip_swept("Gate_roof", GX - 4.25, GX + 4.25, GY - 1.1, GY + 1.1, 9.4, 10.8, ROOF_SLATE, lift=0.55)
box("Gate_ridge", (GX - 0.9, GY - 0.18, 10.65), (GX + 0.9, GY + 0.18, 10.95), ROOF_SLATE_DK)
box("Gate_apron", (GX - 6.5, GY - 3.0, -0.03), (GX + 6.5, GY + 3.0, 0.02), PAVE)


# ========================================================== TRIET HOC ======
use(coll("Philosophy"))
TX, TY, TZ = -2.0, 11.0, 9.0
tw, td = 9.0, 6.5
for k, (o, hh) in enumerate(((0.9, 0.35), (0.55, 0.70), (0.2, 1.05))):
    box("Ph_step%d" % k, (TX - tw / 2 - o, TY - td / 2 - o, TZ), (TX + tw / 2 + o, TY + td / 2 + o, TZ + hh), MARBLE if k % 2 == 0 else MARBLE_S)
STYLO_Z = TZ + 1.05
n_front = 6
for i in range(n_front):
    cx = TX - tw / 2 + 0.7 + i * (tw - 1.4) / (n_front - 1)
    cyl("Ph_col_f%d" % i, cx, TY - td / 2 + 0.5, STYLO_Z, STYLO_Z + 4.2, 0.30, MARBLE, verts=12)
    box("Ph_colcap_f%d" % i, (cx - 0.4, TY - td / 2 + 0.1, STYLO_Z + 4.2), (cx + 0.4, TY - td / 2 + 0.9, STYLO_Z + 4.4), MARBLE)
for i in range(2):
    cy = TY - td / 2 + 2.0 + i * (td - 4.0)
    for s in (-1, 1):
        cx = TX + s * (tw / 2 - 0.5)
        cyl("Ph_col_s%d_%d" % (i, s), cx, cy, STYLO_Z, STYLO_Z + 4.2, 0.30, MARBLE, verts=12)
box("Ph_architrave", (TX - tw / 2 - 0.3, TY - td / 2, STYLO_Z + 4.4), (TX + tw / 2 + 0.3, TY + td / 2, STYLO_Z + 4.75), MARBLE)
box("Ph_frieze", (TX - tw / 2 - 0.3, TY - td / 2, STYLO_Z + 4.75), (TX + tw / 2 + 0.3, TY + td / 2, STYLO_Z + 5.1), MARBLE_S)
gable("Ph_pediment", TX - tw / 2 - 0.55, TX + tw / 2 + 0.55, TY - td / 2 - 0.4, TY + td / 2 + 0.4,
      STYLO_Z + 5.1, STYLO_Z + 7.1, ROCK_L, ridge="x")
box("Ph_door", (TX - 0.8, TY - td / 2 + 0.4, STYLO_Z), (TX + 0.8, TY - td / 2 + 0.62, STYLO_Z + 3.0), TIMBER_D)
signboard("Ph_sign", TX, TY - td / 2 + 0.7, STYLO_Z + 2.6, 2.6, 0.7, ["Triết học"], rot_z=0.0, font_size=0.36, bold=True)
cyl("Ph_brazier_stem", TX + tw / 2 + 1.6, TY - td / 2, STYLO_Z, STYLO_Z + 0.8, 0.14, TRIM_GOLD, verts=10)
cyl("Ph_brazier_bowl", TX + tw / 2 + 1.6, TY - td / 2, STYLO_Z + 0.75, STYLO_Z + 1.05, 0.34, TRIM_GOLD, verts=10, r2=0.24)
cone("Ph_flame", TX + tw / 2 + 1.6, TY - td / 2, STYLO_Z + 1.05, STYLO_Z + 1.5, 0.14, emat("M_Flame", "#FFB347", 5.0), verts=8)
for i, (fx, fy) in enumerate(((-6.5, -3.0), (6.5, -3.0), (-6.0, 3.5), (6.0, 3.5), (-5.0, 5.5), (5.0, 5.5))):
    tree("Ph_cypress_%d" % i, TX + fx, TY + fy, TZ, 5.5 + (i % 3) * 0.6, kind=1)


# ========================================================== KHOA HOC =======
use(coll("Science"))
KX, KY, KZ = -12.0, 3.0, 5.5
kw, kd, kh = 7.0, 5.0, 3.2
box("Kh_body", (KX - kw / 2, KY - kd / 2, KZ), (KX + kw / 2, KY + kd / 2, KZ + kh), TIMBER_L)
for cx in (KX - kw / 2, KX + kw / 2):
    for cy in (KY - kd / 2, KY + kd / 2):
        box("Kh_post_%d_%d" % (int(cx), int(cy)), (cx - 0.14, cy - 0.14, KZ), (cx + 0.14, cy + 0.14, KZ + kh), TIMBER_D)
gable("Kh_roof", KX - kw / 2 - 0.9, KX + kw / 2 + 0.9, KY - kd / 2 - 0.9, KY + kd / 2 + 0.9, KZ + kh, KZ + kh + 2.6, THATCH, ridge="y")
box("Kh_leanto", (KX + kw / 2, KY - kd / 2 - 1.6, KZ), (KX + kw / 2 + 1.8, KY + kd / 2, KZ + 1.8), TIMBER_D)
gable("Kh_leanroof", KX + kw / 2 - 0.2, KX + kw / 2 + 2.2, KY - kd / 2 - 1.9, KY + kd / 2 + 0.3, KZ + 1.8, KZ + 2.4, SHINGLE, ridge="x")
box("Kh_upper_gable", (KX - 1.4, KY - kd / 2 - 0.05, KZ + kh + 0.1), (KX + 1.4, KY - kd / 2 + 0.10, KZ + kh + 1.6), TIMBER_M)
for i, wy in enumerate((KY - kd / 2 - 0.02, KY + kd / 2 + 0.02)):
    for wx in (KX - 2.0, KX - 0.6, KX + 0.9, KX + 2.2):
        m = WINDOW_WARM if (i + int(wx)) % 3 == 0 else GLASS_TEAL
        box("Kh_window_%d_%d" % (i, int(wx)), (wx - 0.32, wy - 0.05, KZ + 1.2), (wx + 0.32, wy + 0.05, KZ + 1.9), m)
        box("Kh_mullion_%d_%d" % (i, int(wx)), (wx - 0.05, wy - 0.07, KZ + 1.2), (wx + 0.05, wy + 0.07, KZ + 1.9), TIMBER_D)
# waterwheel on the left flank
WWX, WWY, WWZ = KX - kw / 2 - 1.0, KY, KZ + 1.1
cyl_axisY("Kh_wheel_rim_o", WWX, WWY - 0.10, WWY + 0.10, WWZ, 1.4, TIMBER_M, verts=16)
cyl_axisY("Kh_wheel_rim_i", WWX, WWY - 0.14, WWY - 0.02, WWZ, 1.1, TIMBER_D, verts=16)
for k in range(10):
    ang = 2 * math.pi * k / 10
    cx, cz = WWX, WWZ
    obox("Kh_spoke_%d" % k, (0.08, 0.14, 1.3), (cx, WWY, cz), (0, ang, 0), TIMBER_D)
box("Kh_trough", (WWX - 0.4, WWY - 1.8, 0.0), (WWX + 0.4, WWY - 0.6, 0.5), STONE_D)
fence_run("Kh_fence_front", KX - kw / 2 - 2.0, KY - kd / 2 - 2.4, KX + kw / 2 + 2.0, KY - kd / 2 - 2.4, KZ, n=8)
fence_run("Kh_fence_side", KX + kw / 2 + 2.0, KY - kd / 2 - 2.4, KX + kw / 2 + 2.0, KY + kd / 2, KZ, n=4)
box("Kh_barrel", (KX - kw / 2 - 1.5, KY + kd / 2 - 0.4, KZ), (KX - kw / 2 - 1.1, KY + kd / 2, KZ + 0.7), TIMBER_M)
box("Kh_crate1", (KX + kw / 2 - 2.6, KY - kd / 2 - 1.0, KZ), (KX + kw / 2 - 2.1, KY - kd / 2 - 0.5, KZ + 0.5), TIMBER_D)
signboard("Kh_sign", KX, KY - kd / 2 - 0.3, KZ + kh + 0.2, 2.4, 0.7, ["Khoa học"], rot_z=0.0, font_size=0.34, bold=True)


# ========================================================== VAN HOC ========
use(coll("Literature"))
VX, VY, VPADZ = 5.5, 7.0, 7.5
box("Vh_pad", (VX - 4.6, VY - 3.8, 5.5), (VX + 4.6, VY + 3.8, VPADZ), STONE_D)
box("Vh_pad_top", (VX - 4.4, VY - 3.6, VPADZ), (VX + 4.4, VY + 3.6, VPADZ + 0.1), PAVE)
vw, vd, vh = 7.5, 6.0, 6.0
VBASE = VPADZ + 0.1
box("Vh_body", (VX - vw / 2, VY - vd / 2, VBASE), (VX + vw / 2, VY + vd / 2, VBASE + vh), STUCCO)
for i in range(5):
    fx = VX - vw / 2 + i * vw / 4
    box("Vh_trim_v%d" % i, (fx - 0.06, VY - vd / 2 - 0.02, VBASE), (fx + 0.06, VY - vd / 2 + 0.10, VBASE + vh), TRIM_GOLD)
box("Vh_string", (VX - vw / 2 - 0.05, VY - vd / 2 - 0.02, VBASE + vh * 0.5), (VX + vw / 2 + 0.05, VY - vd / 2 + 0.10, VBASE + vh * 0.5 + 0.14), TRIM_GOLD)
gable("Vh_roof", VX - vw / 2 - 0.7, VX + vw / 2 + 0.7, VY - vd / 2 - 0.7, VY + vd / 2 + 0.7, VBASE + vh, VBASE + vh + 4.4, ROOF_NAVY, ridge="y")
for i, dx in enumerate((-1.6, 1.6)):
    dz0 = VBASE + vh + 0.6 + abs(dx) * 0.05
    box("Vh_dormer_%d" % i, (VX + dx - 0.6, VY - vd / 2 - 0.6, dz0), (VX + dx + 0.6, VY - vd / 2 + 0.05, dz0 + 1.2), STUCCO)
    gable("Vh_dormer_roof_%d" % i, VX + dx - 0.7, VX + dx + 0.7, VY - vd / 2 - 0.75, VY - vd / 2 + 0.1, dz0 + 1.2, dz0 + 1.9, ROOF_NAVY, ridge="x")
    box("Vh_dormer_glass_%d" % i, (VX + dx - 0.3, VY - vd / 2 - 0.55, dz0 + 0.2), (VX + dx + 0.3, VY - vd / 2 - 0.45, dz0 + 0.9), GLASS_TEAL)
# spire tower, left shoulder
SPX, SPY = VX - vw / 2 - 1.1, VY - vd / 2 + 0.5
cyl("Vh_spire_shaft", SPX, SPY, VBASE, VBASE + 7.0, 1.0, STUCCO, verts=8)
for cz in range(1, 3):
    box("Vh_spire_quoin%d" % cz, (SPX - 1.02, SPY - 0.15, VBASE + cz * 2.2), (SPX + 1.02, SPY + 0.15, VBASE + cz * 2.2 + 0.25), TRIM_GOLD)
cone("Vh_spire_cap", SPX, SPY, VBASE + 7.0, VBASE + 11.5, 1.15, ROOF_NAVY, verts=8)
cyl("Vh_spire_finial_pole", SPX, SPY, VBASE + 11.5, VBASE + 12.2, 0.05, TRIM_GOLD, verts=6)
sphere("Vh_spire_finial", SPX, SPY, VBASE + 12.25, 0.12, TRIM_GOLD, subd=1)
# shorter turret, right corner
TUX, TUY = VX + vw / 2 + 0.3, VY + vd / 2 - 0.6
cyl("Vh_turret_shaft", TUX, TUY, VBASE, VBASE + vh - 1.0, 0.75, STUCCO, verts=8)
cone("Vh_turret_cap", TUX, TUY, VBASE + vh - 1.0, VBASE + vh + 2.0, 0.9, ROOF_NAVY, verts=8)
# gothic arched windows on the ground floor
for i, wx in enumerate((VX - 2.2, VX, VX + 2.2)):
    m = WINDOW_WARM if i == 1 else GLASS_TEAL
    box("Vh_window_%d" % i, (wx - 0.5, VY - vd / 2 - 0.02, VBASE + 0.6), (wx + 0.5, VY - vd / 2 + 0.08, VBASE + 2.6), m)
    gable("Vh_window_arch_%d" % i, wx - 0.55, wx + 0.55, VY - vd / 2 - 0.06, VY - vd / 2 + 0.10, VBASE + 2.6, VBASE + 3.1, TRIM_GOLD, ridge="x")
box("Vh_door", (VX - 0.9, VY - vd / 2 + 0.1, VBASE), (VX + 0.9, VY - vd / 2 + 0.32, VBASE + 2.3), TIMBER_D)
gable("Vh_door_arch", VX - 0.95, VX + 0.95, VY - vd / 2 + 0.05, VY - vd / 2 + 0.36, VBASE + 2.3, VBASE + 2.9, TRIM_GOLD, ridge="x")
signboard("Vh_sign", VX, VY - vd / 2 - 0.12, VBASE + 3.6, 2.6, 0.7, ["Văn học"], rot_z=0.0, font_size=0.34, bold=True)
tree("Vh_tree0", VX - vw / 2 - 1.6, VY + vd / 2 + 0.8, VPADZ, 3.4, kind=0)


# ========================================================== NGHE THUAT =====
use(coll("Art"))
NX, NY, NZ = 17.0, 2.0, 5.5
nw, nd, nh = 7.0, 5.5, 3.4
box("Ng_body", (NX - nw / 2, NY - nd / 2, NZ), (NX + nw / 2, NY + nd / 2, NZ + nh), STEP)
for i in range(4):
    yy = NY - nd / 2 + i * nd / 3
    box("Ng_course%d" % i, (NX - nw / 2 - 0.01, yy - 0.02, NZ), (NX - nw / 2 + 0.03, yy + 0.02, NZ + nh), PAVE)
box("Ng_glass", (NX - nw / 2 - 0.08, NY - nd / 2 + 0.6, NZ + 0.3), (NX - nw / 2 + 0.02, NY + nd / 2 - 0.6, NZ + nh - 0.3), GLASS_DARK)
for i in range(4):
    gy = NY - nd / 2 + 1.0 + i * (nd - 2.0) / 3
    m = WINDOW_WARM if i in (1, 3) else GLASS_DARK
    box("Ng_glasspanel%d" % i, (NX - nw / 2 - 0.10, gy - 0.35, NZ + 0.5), (NX - nw / 2 + 0.04, gy + 0.35, NZ + nh - 0.5), m)
    box("Ng_mullion%d" % i, (NX - nw / 2 - 0.12, gy - 0.42, NZ + 0.3), (NX - nw / 2 + 0.05, gy - 0.36, NZ + nh - 0.3), STONE_D)
box("Ng_upper", (NX - nw / 2 - 1.5, NY - nd / 2 - 1.0, NZ + nh), (NX + nw / 2 - 1.5, NY + nd / 2 - 1.0, NZ + nh + 2.2), STEP)
box("Ng_upper_parapet", (NX - nw / 2 - 1.6, NY - nd / 2 - 1.1, NZ + nh + 2.2), (NX + nw / 2 - 1.4, NY + nd / 2 - 0.9, NZ + nh + 2.5), STONE_D)
signboard("Ng_sign", NX + nw / 2 + 0.15, NY, NZ + nh * 0.6, 2.2, 0.7, ["Nghệ thuật"], rot_z=math.pi / 2, font_size=0.32, bold=True)
bipyramid("Ng_sculpture", NX - nw / 2 - 3.0, NY - nd / 2 - 1.5, 5.5, 5.5 + 2.6, 0.55, SCULPT_METAL, verts=5)
box("Ng_sculpture_plinth", (NX - nw / 2 - 3.5, NY - nd / 2 - 2.0, 5.35), (NX - nw / 2 - 2.5, NY - nd / 2 - 1.0, 5.5), STONE_D)
box("Ng_hedge", (NX + nw / 2 + 0.5, NY - 1.0, NZ), (NX + nw / 2 + 1.6, NY + 1.0, NZ + 0.5), GRASS_D)
box("Ng_gravel", (NX - nw / 2 - 2.0, NY - nd / 2 - 2.5, NZ - 0.02), (NX + nw / 2 + 2.0, NY + nd / 2 + 1.0, NZ + 0.01), GRAVEL)
tree("Ng_tree0", NX + nw / 2 + 2.5, NY + nd / 2, NZ, 3.4, kind=0)


# ========================================================== DAO DUC ========
use(coll("Ethics"))
DX, DY, DPADZ = 13.0, -7.0, 4.0
box("Dd_podium", (DX - 4.0, DY - 2.75, 2.5), (DX + 4.0, DY + 2.75, DPADZ), STONE_D)
box("Dd_podium_top", (DX - 3.8, DY - 2.55, DPADZ), (DX + 3.8, DY + 2.55, DPADZ + 0.1), PAVE)
stairs("StairDdPodium", DX - 5.6, 2.0, DY - 1.4, DY + 0.6, 2.5, DPADZ, n=5)
dw, dd, dh = 6.5, 4.5, 3.0
DBASE = DPADZ + 0.1
box("Dd_wall", (DX - dw / 2 + 0.6, DY - dd / 2 + 0.6, DBASE), (DX + dw / 2 - 0.6, DY + dd / 2 - 0.6, DBASE + dh), STUCCO)
n_cols = 6
for i in range(n_cols):
    cx = DX - dw / 2 + 0.5 + i * (dw - 1.0) / (n_cols - 1)
    cyl("Dd_col_%d" % i, cx, DY - dd / 2, DBASE, DBASE + dh, 0.26, TEMPLE_RED, verts=10)
hip_swept("Dd_roof", DX - dw / 2 - 1.2, DX + dw / 2 + 1.2, DY - dd / 2 - 1.2, DY + dd / 2 + 1.2, DBASE + dh, DBASE + dh + 2.4, ROOF_SLATE, lift=0.6)
box("Dd_ridge", (DX - 0.9, DY - 0.16, DBASE + dh + 2.25), (DX + 0.9, DY + 0.16, DBASE + dh + 2.55), ROOF_SLATE_DK)
for i, lx in enumerate((-1.6, -0.5, 0.5, 1.6)):
    paper_lantern("Dd_lantern_%d" % i, DX + lx, DY - dd / 2 - 0.5, DBASE + dh - 0.3, r=0.22)
signboard("Dd_sign", DX, DY - dd / 2 - 0.6, DBASE + dh - 0.5, 2.2, 0.7, ["Đạo đức"], rot_z=0.0, font_size=0.34, bold=True)
fence_run("Dd_fence_front", DX - dw / 2 - 1.5, DY + dd / 2 + 1.5, DX + dw / 2 + 1.5, DY + dd / 2 + 1.5, DPADZ, n=8)
fence_run("Dd_fence_right", DX + dw / 2 + 1.5, DY - dd / 2 - 1.5, DX + dw / 2 + 1.5, DY + dd / 2 + 1.5, DPADZ, n=5)
tree("Dd_maple", DX + dw / 2 + 2.2, DY - 1.0, DPADZ, 3.6, kind=2)
stone_lantern("Dd_lantern_stone", DX - dw / 2 - 1.6, DY + 1.0, DPADZ, 1.2)
for i in range(3):
    rock("Dd_rock_%d" % i, DX - dw / 2 - 2.0 + i * 0.5, DY + 1.8 + i * 0.3, DPADZ, 0.3 + i * 0.05)
box("Dd_gravel", (DX - dw / 2 - 2.4, DY + 1.2, DPADZ - 0.02), (DX - dw / 2 - 1.0, DY + 2.4, DPADZ + 0.01), GRAVEL)


# =========================================================== PLAZA =========
use(coll("Plaza"))
SX, SY, SZ = 0.0, -5.0, 2.5
for k, (rr, hh) in enumerate(((2.6, 0.35), (2.0, 0.70), (1.5, 1.05))):
    cyl("Pl_step%d" % k, SX, SY, SZ + hh - 0.35, SZ + hh, rr, MARBLE if k % 2 == 0 else MARBLE_S, verts=20)
cyl("Statue_robe", SX, SY, SZ + 1.05, SZ + 2.9, 0.62, MARBLE, verts=14, r2=1.05)
cyl("Statue_torso", SX, SY, SZ + 2.9, SZ + 3.7, 0.52, MARBLE, verts=12, r2=0.66)
sphere("Statue_head", SX, SY, SZ + 4.15, 0.42, MARBLE, subd=2)
sphere("Statue_topknot", SX, SY, SZ + 4.55, 0.16, MARBLE, subd=1)
sphere("Statue_beard", SX, SY - 0.28, SZ + 3.9, 0.26, MARBLE, subd=1)
obox("Statue_arm", (0.24, 0.24, 1.0), (SX - 0.55, SY - 0.24, SZ + 3.35), (0.5, 0, 0), MARBLE)
obox("Statue_book", (1.1, 0.75, 0.14), (SX - 0.2, SY - 0.72, SZ + 3.05), (-0.3, 0, 0), MARBLE)
for a in range(5):
    ang = math.pi * 2 * a / 5 + 0.4
    bx, by = SX + math.cos(ang) * 6.4, SY + math.sin(ang) * 6.4
    if a % 2 == 0:
        bench("Pl_bench_%d" % a, bx, by, SZ, ang + math.pi / 2)
    else:
        stone_lantern("Pl_lamp_%d" % a, bx, by, SZ, 1.3)
for k, rr in enumerate((9.0, 7.5, 6.0)):
    cyl("Pl_ring%d" % k, SX, SY, SZ + 0.005 * k, SZ + 0.02 + 0.005 * k, rr, PAVE if k % 2 == 0 else STEP, verts=28)
for i in range(5):
    rock("Pl_rubble_%d" % i, SX + random.uniform(-9, 9), SY + random.uniform(-6, 4), SZ, 0.35)


# ========================================================= VEGETATION ======
use(coll("Vegetation"))
random.seed(42)
BUILD_ZONES = [
    (GX, GY, 6, 5), (TX, TY, 6, 5), (KX, KY, 5, 4), (VX, VY, 6, 5),
    (NX, NY, 6, 5), (DX, DY, 5, 4), (SX, SY, 8, 7),
]


def near_building(x, y):
    for (bx, by, rx, ry) in BUILD_ZONES:
        if abs(x - bx) < rx and abs(y - by) < ry:
            return True
    return False


placed = 0
tries = 0
while placed < 30 and tries < 400:
    tries += 1
    key = random.choice(list(LEVELS.keys()))
    L = LEVELS[key]
    xc = L.get("xc", 0.0)
    x = xc + random.uniform(-L["xh"] + 2.0, L["xh"] - 2.0)
    y = random.uniform(L["y0"] + 1.5, L["y1"] - 1.0)
    if abs(x - (-2.0)) < 3.0:   # keep the stair spine clear
        continue
    if near_building(x, y):
        continue
    kind = placed % 3
    tree("Wild_%d" % placed, x, y, L["z"], 2.6 + random.uniform(0, 2.2), kind)
    placed += 1

for i in range(10):
    key = ("L2", "L3", "L2", "L3")[i % 4]
    L = LEVELS[key]
    xc = L.get("xc", 0.0)
    x = xc + random.uniform(-L["xh"] + 3.0, L["xh"] - 3.0)
    y = random.uniform(L["y0"] + 1.0, L["y1"] - 1.0)
    if near_building(x, y) or abs(x - (-2.0)) < 3.0:
        continue
    tree("Cypress_%d" % i, x, y, L["z"], 3.5 + random.uniform(0, 3.0), kind=1)

for i in range(16):
    key = random.choice(list(LEVELS.keys()))
    L = LEVELS[key]
    xc = L.get("xc", 0.0)
    x = xc + random.uniform(-L["xh"] + 1.5, L["xh"] - 1.5)
    y = random.uniform(L["y0"] + 0.8, L["y1"] - 0.5)
    bush("Bush_%d" % i, x, y, L["z"], 0.4 + random.uniform(0, 0.3))

for i in range(14):
    key = random.choice(list(LEVELS.keys()))
    L = LEVELS[key]
    xc = L.get("xc", 0.0)
    x = xc + random.uniform(-L["xh"] + 1.5, L["xh"] - 1.5)
    y = random.uniform(L["y0"] + 0.8, L["y1"] - 0.5)
    if near_building(x, y):
        continue
    rock("Rock_%d" % i, x, y, L["z"], 0.35 + random.uniform(0, 0.4))


# ========================================================= BACKGROUND ======
use(coll("Background"))
PEAKS = [(-46, 40, 22, 34, True), (10, 55, 26, 44, True), (44, 36, 20, 26, False),
         (-58, 60, 18, 24, False), (58, 60, 18, 22, False), (0, 70, 22, 32, False),
         (-20, 44, 16, 20, False)]
for i, (mx, my, mr, mh, snow) in enumerate(PEAKS):
    far = my > 55
    cone("Peak_%d" % i, mx, my, -6, mh, mr, MTN_FAR if far else MTN_NEAR, verts=7)
    if snow:
        cone("PeakSnow_%d" % i, mx, my, mh * 0.62, mh + 0.3, mr * 0.32, SNOW, verts=7)

random.seed(5)
for i in range(5):
    cx = random.uniform(-30, 30)
    cy = 40
    cz = random.uniform(35, 50)
    for j in range(4):
        sphere("Cloud_%d_%d" % (i, j), cx + random.uniform(-3, 3), cy, cz + random.uniform(-0.5, 0.5),
               1.2 + random.uniform(0, 0.8), CLOUD_M, subd=1, scale=(1.4, 0.9, 0.7))


# ====================================================== LIGHT / CAMERA =====
use(coll("Lighting"))
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
sun.data.energy = 3.5
sun.data.angle = math.radians(3.0)
try:
    sun.data.color = hexcol("#FFF6E5")
except Exception:
    pass
sun.rotation_euler = (math.radians(50), 0, math.radians(35))
ROOT.objects.link(sun)

fill = bpy.data.objects.new("Fill", bpy.data.lights.new("Fill", "AREA"))
fill.data.energy = 40.0
fill.data.size = 20.0
try:
    fill.data.color = hexcol("#DCEBFF")
except Exception:
    pass
try:
    fill.data.use_shadow = False
except Exception:
    pass
fill.location = (18, -30, 22)
fill.rotation_euler = (math.radians(55), 0, math.radians(-50))
ROOT.objects.link(fill)

world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
wn = world.node_tree.nodes
wl = world.node_tree.links
bgnode = wn.get("Background")
try:
    sky = wn.new("ShaderNodeTexSky")
    sky.sky_type = 'NISHITA'
    sky.sun_elevation = math.radians(55)
    sky.sun_rotation = math.radians(35)
    wl.new(sky.outputs["Color"], bgnode.inputs["Color"])
    bgnode.inputs["Strength"].default_value = 1.0
except Exception:
    bgnode.inputs[0].default_value = (*hexcol(SKY_HOR), 1.0)
    bgnode.inputs[1].default_value = 1.0

cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 58
cam = bpy.data.objects.new("Camera", cam_data)
cam.location = (2.0, -38.0, 24.0)
cam.rotation_euler = (math.radians(58), 0, math.radians(3))
ROOT.objects.link(cam)
scene.camera = cam

try:
    scene.render.engine = "BLENDER_EEVEE_NEXT"
except TypeError:
    try:
        scene.render.engine = "BLENDER_EEVEE"
    except TypeError:
        pass
try:
    scene.eevee.taa_render_samples = 128
except Exception:
    pass
try:
    scene.eevee.use_gtao = True
    scene.eevee.gtao_distance = 0.6
    scene.eevee.gtao_factor = 0.5
except Exception:
    pass
try:
    scene.view_settings.view_transform = "Standard"
except Exception:
    pass
scene.view_settings.look = "None"
scene.render.resolution_x = 1536
scene.render.resolution_y = 1024
scene.render.film_transparent = False
try:
    scene.view_settings.exposure = 0.0
except Exception:
    pass

bpy.context.view_layer.update()

# ------------------------------------------------------------ save/export --
os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)

scene.render.filepath = RENDER_OUT
bpy.ops.render.render(write_still=True)

try:
    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB",
                               use_selection=False, export_apply=True, export_yup=True)
    glb_ok = True
except Exception as e:
    glb_ok = False
    print("GLB EXPORT FAILED:", e)

result = {
    "saved_blend": BLEND,
    "render": RENDER_OUT,
    "glb": OUT_GLB if glb_ok else None,
    "objects": len(bpy.data.objects),
    "materials": len(bpy.data.materials),
}
print("RESULT", result)
