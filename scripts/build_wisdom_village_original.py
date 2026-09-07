"""Build the Wisdom Village — layout pass with placeholder houses.

    blender -b -P scripts/build_wisdom_village.py

A terraced hillside village for the thinkers: a timber gate at the foot, a
plaza with the Founder's statue, a switchback stone stair climbing five
grassy terraces, and the open Rotunda of Assembly at the summit.

Twelve numbered building plots flank the stair, alternating left/right as the
tour climbs. Every plot is a PLACEHOLDER — but each has a deliberately
DIFFERENT silhouette (portico, round tower, glass cube, tiered hall, dome,
A-frame, longhouse, ziggurat, greenhouse, windmill, pavilion, lodge) so the
loci are already distinguishable by shape before any thinker is assigned.

Each plot lives in its own Blender collection `Plot_01`..`Plot_12`. To give a
plot to a real thinker: delete that collection's contents and build the real
house in the same collection at the same pad centre, then re-export. Nothing
else in the scene needs to move.

Locus_01..12 empties are baked in (order = tour order, uphill). Export uses
export_yup, so a Blender empty at (x, y, z) lands at three.js (x, z, -y).
"""
import bpy, bmesh, os, math
from mathutils import Matrix

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_GLB = os.path.join(REPO, "models", "wisdom-village.glb")
BLEND = r"C:\Users\ASUS\Desktop\Loc\blender\blender_models\WisdomVillage.blend"

# ---------------------------------------------------------------- reset ----
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    bpy.data.collections.remove(c)

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
    if _PFX[0]:
        ob.name = _PFX[0] + ob.name
    _CUR[0].objects.link(ob)
    return ob


# ------------------------------------------------------------ materials ----
def mat(name, rgb, rough=0.9, metal=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*rgb, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


def emat(name, rgb, strength=3.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*rgb, 1.0)
    for key in ("Emission Color", "Emission"):
        if key in b.inputs:
            b.inputs[key].default_value = (*rgb, 1.0)
            break
    if "Emission Strength" in b.inputs:
        b.inputs["Emission Strength"].default_value = strength
    return m


GRASS   = mat("M_Grass",      (0.19, 0.42, 0.12))
GRASS_D = mat("M_GrassDark",  (0.12, 0.29, 0.08))
ROCK    = mat("M_Rock",       (0.52, 0.51, 0.47))
ROCK_D  = mat("M_RockDark",   (0.35, 0.34, 0.32))
PAVE    = mat("M_Pave",       (0.69, 0.66, 0.58))
PAVE_D  = mat("M_PaveDark",   (0.52, 0.50, 0.44))
MARBLE  = mat("M_Marble",     (0.86, 0.84, 0.78), rough=0.45)
PLASTER = mat("M_Plaster",    (0.80, 0.75, 0.64))
PLAS_W  = mat("M_PlasterWarm",(0.72, 0.58, 0.38))
WOOD    = mat("M_Wood",       (0.34, 0.20, 0.10))
WOOD_D  = mat("M_WoodDark",   (0.18, 0.11, 0.06))
CLAY    = mat("M_ClayRoof",   (0.48, 0.18, 0.11))
SLATE   = mat("M_Slate",      (0.16, 0.19, 0.29))
COPPER  = mat("M_Copper",     (0.16, 0.46, 0.40))
GLASS   = mat("M_Glass",      (0.30, 0.52, 0.62), rough=0.12)
BRASS   = mat("M_Brass",      (0.78, 0.60, 0.24), rough=0.35, metal=0.8)
LEAF_A  = mat("M_LeafA",      (0.13, 0.33, 0.12))
LEAF_B  = mat("M_LeafB",      (0.22, 0.45, 0.16))
LEAF_C  = mat("M_LeafC",      (0.56, 0.32, 0.09))
BANNER  = mat("M_Banner",     (0.10, 0.17, 0.45))
SIGNBRD = mat("M_SignBoard",  (0.24, 0.14, 0.07))
INK     = mat("M_Ink",        (0.97, 0.95, 0.88), rough=0.6)
WATER   = mat("M_Water",      (0.20, 0.40, 0.50), rough=0.12)
LAMP    = emat("M_LampGlow",  (1.00, 0.86, 0.55), 6.0)
MTN     = mat("M_Mountain",   (0.42, 0.47, 0.58))
MTN_S   = mat("M_MountainSnow", (0.90, 0.93, 0.96), rough=0.6)


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
    """Box centred on its own origin, so it can be rotated."""
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
                          matrix=Matrix.Translation(
                              (x, y, (z0 + z1) / 2.0)))
    return _bm_obj(name, bm, m)


def cone(name, x, y, z0, z1, r, m, verts=16):
    return cyl(name, x, y, z0, z1, r, m, verts=verts, r2=0.0)


def sphere(name, x, y, z, r, m, subd=2):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subd, radius=r,
                               matrix=Matrix.Translation((x, y, z)))
    return _bm_obj(name, bm, m)


def gable(name, x0, x1, y0, y1, z0, zpk, m, ridge="y"):
    """Triangular-prism roof. ridge='y' -> ridge line runs along Y."""
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
    """Hip / pyramid roof; tip>0 gives a flat-topped truncated pyramid."""
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


def text(name, body, size, loc, rot, m, extrude=0.03, bold=False):
    cu = bpy.data.curves.new(name + "_fnt", "FONT")
    cu.body = body
    cu.size = size
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.extrude = extrude
    tmp = bpy.data.objects.new(name + "_fnt", cu)
    ROOT.objects.link(tmp)
    tmp.location = loc
    tmp.rotation_euler = rot
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    ob.rotation_euler = rot
    ob.data.materials.clear()
    ob.data.materials.append(m)
    link(ob)
    bpy.data.objects.remove(tmp, do_unlink=True)
    return ob


# ---------------------------------------------------------------- props ----
def tree(name, x, y, z, h=4.0, kind=0):
    r = h * 0.20
    cyl(name + "_trunk", x, y, z, z + h * 0.42, r * 0.30, WOOD_D, verts=7)
    if kind == 0:                                   # conifer, stacked cones
        for i, f in enumerate((0.00, 0.26, 0.50)):
            cone(name + "_c%d" % i, x, y, z + h * (0.34 + f),
                 z + h * (0.72 + f), r * (1.05 - f * 0.9),
                 LEAF_A if i % 2 == 0 else LEAF_B, verts=8)
    elif kind == 1:                                 # round broadleaf
        sphere(name + "_cap", x, y, z + h * 0.72, h * 0.32, LEAF_B, subd=1)
        sphere(name + "_cap2", x + r * 0.4, y - r * 0.3, z + h * 0.58,
               h * 0.22, LEAF_A, subd=1)
    else:                                           # autumn / cypress
        cone(name + "_cyp", x, y, z + h * 0.28, z + h * 1.05, r * 0.72,
             LEAF_C, verts=8)


def lantern(name, x, y, z, h=3.0):
    cyl(name + "_post", x, y, z, z + h, 0.11, WOOD_D, verts=8)
    box(name + "_head", (x - 0.28, y - 0.28, z + h), (x + 0.28, y + 0.28, z + h + 0.55), WOOD_D)
    box(name + "_glow", (x - 0.20, y - 0.20, z + h + 0.07), (x + 0.20, y + 0.20, z + h + 0.48), LAMP)
    pyramid(name + "_cap", x - 0.36, x + 0.36, y - 0.36, y + 0.36,
            z + h + 0.55, z + h + 0.90, SLATE)


def bench(name, x, y, z, rot=0.0):
    obox(name + "_seat", (2.2, 0.55, 0.14), (x, y, z + 0.48), (0, 0, rot), WOOD)
    for s in (-0.85, 0.85):
        dx, dy = math.cos(rot) * s, math.sin(rot) * s
        obox(name + "_leg%.0f" % s, (0.18, 0.5, 0.48),
             (x + dx, y + dy, z + 0.24), (0, 0, rot), WOOD_D)


def signpost(name, cx, cy, cz, label, sub, face):
    """Roadside signboard. face=+1 -> reads toward +X, -1 -> toward -X."""
    rot = (math.pi / 2, 0, math.pi / 2 * face)
    nx = cx + 0.10 * face
    for s in (-1.55, 1.55):
        cyl(name + "_post%.1f" % s, cx, cy + s, cz, cz + 2.5, 0.13, WOOD_D, verts=8)
    obox(name + "_board", (0.16, 3.6, 1.5), (cx, cy, cz + 2.35), (0, 0, 0), SIGNBRD)
    obox(name + "_frame", (0.10, 3.9, 0.14), (cx, cy, cz + 3.16), (0, 0, 0), WOOD)
    obox(name + "_frame2", (0.10, 3.9, 0.14), (cx, cy, cz + 1.54), (0, 0, 0), WOOD)
    text(name + "_num", label, 0.62, (nx, cy, cz + 2.62), rot, INK)
    text(name + "_sub", sub, 0.24, (nx, cy, cz + 1.98), rot, INK)


# ------------------------------------------------------------- terraces ----
# Five grassy plateaus climbing north (+Y). Grass caps overhang the rock.
TIERS = [
    # (top_z, x_half, y0, y1)
    (0.0,  30.0, -44.0, -14.0),
    (3.5,  30.0, -14.0,  -2.0),
    (7.0,  30.0,  -2.0,  10.0),
    (10.5, 27.0,  10.0,  21.0),
    (14.0, 22.0,  21.0,  40.0),
]

use(coll("Terrain"))
for i, (tz, xh, y0, y1) in enumerate(TIERS):
    base = -8.0
    box("Terrace_%d_rock" % i, (-xh + 0.9, y0 + 0.9, base), (xh - 0.9, y1, tz - 0.7), ROCK)
    box("Terrace_%d_rock_lip" % i, (-xh + 1.9, y0 + 1.9, base), (xh - 1.9, y1, tz - 0.2), ROCK_D)
    box("Terrace_%d_grass" % i, (-xh, y0, tz - 0.7), (xh, y1, tz), GRASS)
    box("Terrace_%d_rim" % i, (-xh, y0, tz - 0.02), (xh, y0 + 1.6, tz + 0.05), GRASS_D)

# skirt of land in front of the gate
box("Apron_rock", (-24, -78, -8), (24, -44, -0.7), ROCK)
box("Apron_grass", (-26, -80, -0.7), (26, -44, 0.0), GRASS)

# distant peaks (low-poly backdrop, well outside the village)
for (mx, my, mr, mh) in ((-78, 74, 26, 34), (22, 104, 34, 46), (88, 62, 24, 28),
                         (-96, 14, 22, 24), (100, -4, 20, 22)):
    cone("Peak_%d_%d" % (mx, my), mx, my, -6, mh, mr, MTN, verts=7)
    cone("PeakSnow_%d_%d" % (mx, my), mx, my, mh * 0.66, mh + 0.4, mr * 0.34, MTN_S, verts=7)


# ---------------------------------------------------- stairs + paving -----
use(coll("Paths"))
STAIRS = [(-19.5, -14.0, 0.0, 3.5), (-7.5, -2.0, 3.5, 7.0),
          (4.5, 10.0, 7.0, 10.5), (15.5, 21.0, 10.5, 14.0)]
for si, (sy0, sy1, sz0, sz1) in enumerate(STAIRS):
    n = 11
    dy, dz = (sy1 - sy0) / n, (sz1 - sz0) / n
    for k in range(n):
        box("Stair%d_step%02d" % (si, k),
            (-4.2, sy0 + k * dy, sz0 - 0.4), (4.2, sy0 + (k + 1) * dy, sz0 + (k + 1) * dz),
            PAVE if k % 2 == 0 else PAVE_D)
    for s in (-4.6, 4.6):                                   # cheek walls, stepped
        for k in range(n):
            box("Stair%d_wall%.1f_%02d" % (si, s, k),
                (s - 0.42, sy0 + k * dy, sz0 - 0.6),
                (s + 0.42, sy0 + (k + 1) * dy, sz0 + (k + 1) * dz + 0.45), ROCK_D)
        box("Stair%d_newel_lo%.1f" % (si, s), (s - 0.55, sy0 - 0.9, sz0 - 0.6),
            (s + 0.55, sy0 + 0.2, sz0 + 1.3), MARBLE)
        box("Stair%d_newel_hi%.1f" % (si, s), (s - 0.55, sy1 - 0.9, sz1 - 0.6),
            (s + 0.55, sy1 + 0.2, sz1 + 1.3), MARBLE)

# paved spine along each terrace + branch paths to the plots
SPINE = [(-76.0, -19.5, 0.0), (-14.0, -7.5, 3.5), (-2.0, 4.5, 7.0),
         (10.0, 15.5, 10.5), (21.0, 39.0, 14.0)]
for i, (py0, py1, pz) in enumerate(SPINE):
    box("Spine_%d" % i, (-4.2, py0, pz - 0.02), (4.2, py1, pz + 0.06), PAVE)
    box("Spine_%d_edge_l" % i, (-4.6, py0, pz - 0.02), (-4.2, py1, pz + 0.10), PAVE_D)
    box("Spine_%d_edge_r" % i, (4.2, py0, pz - 0.02), (4.6, py1, pz + 0.10), PAVE_D)


# ---------------------------------------------------------------- gate ----
use(coll("Gate"))
GY = -52.0
for s in (-6.0, 6.0):
    box("Gate_plinth%.1f" % s, (s - 1.3, GY - 1.3, 0.0), (s + 1.3, GY + 1.3, 0.9), ROCK_D)
    box("Gate_post%.1f" % s, (s - 0.85, GY - 0.85, 0.9), (s + 0.85, GY + 0.85, 8.4), WOOD)
    box("Gate_banner%.1f" % s, (s - 0.05, GY - 0.75, 2.0), (s + 0.05, GY + 0.75, 6.2), BANNER)
    lantern("Gate_lamp%.1f" % s, s * 1.55, GY, 0.0, 1.9)
box("Gate_lintel", (-8.2, GY - 1.1, 8.4), (8.2, GY + 1.1, 9.0), WOOD_D)
box("Gate_board", (-7.4, GY - 0.55, 9.0), (7.4, GY + 0.55, 11.4), SIGNBRD)
box("Gate_board_trim", (-7.8, GY - 0.62, 11.4), (7.8, GY + 0.62, 11.75), WOOD)
gable("Gate_roof", -8.6, 8.6, GY - 1.5, GY + 1.5, 11.75, 12.9, SLATE, ridge="x")
text("Gate_text", "VILLAGE OF THE SAGES", 1.02,
     (0.0, GY - 0.60, 10.55), (math.pi / 2, 0, 0), INK)
text("Gate_text2", "· twelve houses of thought ·", 0.46,
     (0.0, GY - 0.60, 9.55), (math.pi / 2, 0, 0), INK)


# --------------------------------------------------------------- plaza ----
use(coll("Plaza"))
SX, SY = 0.0, -27.0
for k, (rr, hh) in enumerate(((7.0, 0.28), (5.6, 0.56), (4.4, 0.84))):
    cyl("Plaza_step%d" % k, SX, SY, hh - 0.28, hh, rr, PAVE if k % 2 == 0 else PAVE_D, verts=24)
cyl("Plaza_plinth", SX, SY, 0.84, 2.35, 2.05, MARBLE, verts=12)
box("Plaza_plinth_cap", (SX - 2.3, SY - 2.3, 2.35), (SX + 2.3, SY + 2.3, 2.6), MARBLE)
text("Plaza_plinth_text", "THE FIRST SAGE", 0.34,
     (SX, SY - 2.06, 1.62), (math.pi / 2, 0, 0), INK)
# the statue: a robed figure reading, kept deliberately simple/low-poly
cyl("Statue_robe", SX, SY, 2.6, 5.3, 1.05, MARBLE, verts=14, r2=0.62)
cyl("Statue_torso", SX, SY, 5.3, 6.5, 0.66, MARBLE, verts=12, r2=0.52)
sphere("Statue_head", SX, SY, 7.0, 0.45, MARBLE, subd=2)
sphere("Statue_beard", SX, SY - 0.30, 6.72, 0.30, MARBLE, subd=1)
obox("Statue_arm_l", (0.25, 0.25, 1.15), (SX - 0.62, SY - 0.30, 5.85), (0.5, 0, 0), MARBLE)
obox("Statue_arm_r", (0.25, 0.25, 1.15), (SX + 0.62, SY - 0.30, 5.85), (0.5, 0, 0), MARBLE)
obox("Statue_book", (1.25, 0.85, 0.16), (SX, SY - 0.86, 5.42), (-0.35, 0, 0), MARBLE)
for a in range(6):                                        # plaza ring props
    ang = math.pi * 2 * a / 6 + 0.5
    bx, by = SX + math.cos(ang) * 10.5, SY + math.sin(ang) * 10.5
    if a % 2 == 0:
        bench("Plaza_bench%d" % a, bx, by, 0.0, ang + math.pi / 2)
    else:
        lantern("Plaza_lamp%d" % a, bx, by, 0.0, 3.2)
# reflecting pool off to one side of the plaza
box("Pool_kerb", (-14.5, -44.5, 0.0), (-7.5, -39.6, 0.45), PAVE_D)
box("Pool_water", (-14.0, -44.0, 0.30), (-8.0, -40.1, 0.52), WATER)


# -------------------------------------------------------------- summit ----
use(coll("Summit"))
RX, RY, RZ = 0.0, 33.0, 14.0
for k, rr in enumerate((8.2, 7.2)):
    cyl("Rotunda_step%d" % k, RX, RY, RZ + k * 0.30, RZ + (k + 1) * 0.30, rr, MARBLE, verts=24)
cyl("Rotunda_floor", RX, RY, RZ + 0.60, RZ + 0.75, 6.7, PAVE, verts=24)
for a in range(10):
    ang = math.pi * 2 * a / 10
    px, py = RX + math.cos(ang) * 5.8, RY + math.sin(ang) * 5.8
    cyl("Rotunda_col%d" % a, px, py, RZ + 0.75, RZ + 6.4, 0.42, MARBLE, verts=10)
    box("Rotunda_colcap%d" % a, (px - 0.60, py - 0.60, RZ + 6.4),
        (px + 0.60, py + 0.60, RZ + 6.9), MARBLE)
cyl("Rotunda_arch", RX, RY, RZ + 6.9, RZ + 7.5, 6.5, MARBLE, verts=24)
cone("Rotunda_dome", RX, RY, RZ + 7.5, RZ + 12.2, 6.5, COPPER, verts=24)
sphere("Rotunda_finial", RX, RY, RZ + 12.6, 0.55, BRASS, subd=2)
cyl("Rotunda_table", RX, RY, RZ + 0.75, RZ + 1.55, 2.4, WOOD, verts=16)
for a in range(6):
    ang = math.pi * 2 * a / 6
    bench("Rotunda_bench%d" % a, RX + math.cos(ang) * 3.9, RY + math.sin(ang) * 3.9,
          RZ + 0.75, ang + math.pi / 2)


# ------------------------------------------------- placeholder archetypes --
def ph_portico(x, y, z, w, d, m_wall, m_roof):
    """1 — Greek portico temple."""
    box("body", (x - w / 2, y - d / 2 + 2.4, z), (x + w / 2, y + d / 2, z + 5.4), m_wall)
    box("stylo", (x - w / 2 - 0.7, y - d / 2 - 0.9, z), (x + w / 2 + 0.7, y + d / 2, z + 0.9), MARBLE)
    box("door", (x - 1.3, y - d / 2 + 2.28, z + 0.9), (x + 1.3, y - d / 2 + 2.42, z + 4.2), WOOD_D)
    for i in range(4):
        cx = x - w / 2 + 0.9 + i * (w - 1.8) / 3
        cyl("col%d" % i, cx, y - d / 2 + 0.5, z + 0.9, z + 5.4, 0.36, MARBLE, verts=10)
    box("arch", (x - w / 2 - 0.5, y - d / 2 - 0.6, z + 5.4),
        (x + w / 2 + 0.5, y + d / 2, z + 6.0), MARBLE)
    gable("ped", x - w / 2 - 0.5, x + w / 2 + 0.5, y - d / 2 - 0.6, y + d / 2,
          z + 6.0, z + 7.9, m_roof, ridge="x")


def ph_tower(x, y, z, w, d, m_wall, m_roof):
    """2 — round stone tower."""
    r = min(w, d) / 2
    cyl("drum", x, y, z, z + 7.2, r, m_wall, verts=14)
    cyl("band", x, y, z + 3.4, z + 3.9, r + 0.16, ROCK_D, verts=14)
    cyl("eave", x, y, z + 7.2, z + 7.6, r + 0.75, WOOD_D, verts=14)
    cone("cap", x, y, z + 7.6, z + 11.4, r + 0.75, m_roof, verts=14)
    sphere("finial", x, y, z + 11.6, 0.28, BRASS, subd=1)


def ph_cube(x, y, z, w, d, m_wall, m_roof):
    """3 — modern glass cube."""
    box("slab", (x - w / 2 - 0.5, y - d / 2 - 0.5, z), (x + w / 2 + 0.5, y + d / 2 + 0.5, z + 0.4), PAVE_D)
    box("body", (x - w / 2, y - d / 2, z + 0.4), (x + w / 2, y + d / 2, z + 5.6), m_wall)
    box("glazing", (x - w / 2 - 0.06, y - d / 2 + 1.0, z + 1.2),
        (x + w / 2 + 0.06, y + d / 2 - 1.0, z + 4.6), GLASS)
    box("cantilever", (x - w / 2 - 1.4, y - d / 2 + 0.6, z + 5.6),
        (x + w / 2 + 0.4, y + d / 2 - 0.6, z + 6.5), m_roof)


def ph_tiered(x, y, z, w, d, m_wall, m_roof):
    """4 — East-Asian tiered hall."""
    box("podium", (x - w / 2 - 0.8, y - d / 2 - 0.8, z), (x + w / 2 + 0.8, y + d / 2 + 0.8, z + 0.8), ROCK_D)
    box("body", (x - w / 2, y - d / 2, z + 0.8), (x + w / 2, y + d / 2, z + 4.0), m_wall)
    for i, (o, zb, zt) in enumerate(((1.5, 4.0, 5.6), (0.9, 5.9, 7.3))):
        pyramid("roof%d" % i, x - w / 2 - o, x + w / 2 + o, y - d / 2 - o, y + d / 2 + o,
                z + zb, z + zt, m_roof, tip=(2.4 if i == 0 else 0.0))
        if i == 0:
            box("mid", (x - w / 2 + 1.1, y - d / 2 + 1.1, z + 5.4),
                (x + w / 2 - 1.1, y + d / 2 - 1.1, z + 5.9), m_wall)


def ph_dome(x, y, z, w, d, m_wall, m_roof):
    """5 — observatory drum."""
    r = min(w, d) / 2
    box("base", (x - w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z + 2.2), m_wall)
    cyl("drum", x, y, z + 2.2, z + 5.4, r, m_wall, verts=16)
    sphere("dome", x, y, z + 5.4, r + 0.2, m_roof, subd=2)
    obox("slit", (0.5, r * 2.4, 3.0), (x, y - r * 0.1, z + 6.2), (0, 0, 0), SLATE)


def ph_aframe(x, y, z, w, d, m_wall, m_roof):
    """6 — A-frame chalet."""
    box("deck", (x - w / 2 - 1.0, y - d / 2 - 1.4, z), (x + w / 2 + 1.0, y + d / 2 + 0.4, z + 0.5), WOOD)
    gable("shell", x - w / 2, x + w / 2, y - d / 2, y + d / 2, z + 0.5, z + 8.0, m_roof, ridge="y")
    box("gableend", (x - w / 2 + 0.4, y - d / 2 - 0.06, z + 0.5),
        (x + w / 2 - 0.4, y - d / 2 + 0.06, z + 4.2), m_wall)
    box("glass", (x - 1.2, y - d / 2 - 0.12, z + 0.9), (x + 1.2, y - d / 2 + 0.02, z + 3.6), GLASS)


def ph_longhouse(x, y, z, w, d, m_wall, m_roof):
    """7 — longhouse / barn with clerestory."""
    box("body", (x - w / 2, y - d / 2 - 1.5, z), (x + w / 2, y + d / 2 + 1.5, z + 3.4), m_wall)
    gable("roof", x - w / 2 - 0.9, x + w / 2 + 0.9, y - d / 2 - 2.1, y + d / 2 + 2.1,
          z + 3.4, z + 6.3, m_roof, ridge="y")
    box("clerestory", (x - 0.9, y - d / 2 - 1.0, z + 6.3), (x + 0.9, y + d / 2 + 1.0, z + 7.1), m_wall)
    gable("clerroof", x - 1.4, x + 1.4, y - d / 2 - 1.4, y + d / 2 + 1.4, z + 7.1, z + 7.9, m_roof)
    for s in (-1, 1):
        box("beam%d" % s, (x - w / 2 - 0.25, y + s * (d / 2 + 1.2) - 0.15, z),
            (x + w / 2 + 0.25, y + s * (d / 2 + 1.2) + 0.15, z + 3.6), WOOD_D)


def ph_ziggurat(x, y, z, w, d, m_wall, m_roof):
    """8 — stepped stone terrace block."""
    for i in range(4):
        o = i * 0.95
        box("step%d" % i, (x - w / 2 + o, y - d / 2 + o, z + i * 1.55),
            (x + w / 2 - o, y + d / 2 - o, z + (i + 1) * 1.55),
            m_wall if i % 2 == 0 else m_roof)
    box("shrine", (x - 1.1, y - 1.1, z + 6.2), (x + 1.1, y + 1.1, z + 7.6), MARBLE)
    pyramid("shrinecap", x - 1.5, x + 1.5, y - 1.5, y + 1.5, z + 7.6, z + 8.9, m_roof)


def ph_greenhouse(x, y, z, w, d, m_wall, m_roof):
    """9 — glass barrel-vault greenhouse."""
    box("kerb", (x - w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z + 0.9), m_wall)
    for i in range(7):                                    # faceted vault
        t0, t1 = math.pi * i / 7, math.pi * (i + 1) / 7
        r = w / 2
        x0, z0 = math.cos(t0) * r, math.sin(t0) * r
        x1, z1 = math.cos(t1) * r, math.sin(t1) * r
        me = bpy.data.meshes.new("vault%d" % i)
        v = [(x + x0, y - d / 2, z + 0.9 + z0), (x + x1, y - d / 2, z + 0.9 + z1),
             (x + x1, y + d / 2, z + 0.9 + z1), (x + x0, y + d / 2, z + 0.9 + z0)]
        me.from_pydata(v, [], [(0, 1, 2, 3)])
        me.update()
        me.materials.append(GLASS)
        link(bpy.data.objects.new("vault%d" % i, me))
    for s in (-1, 1):
        box("rib%d" % s, (x - w / 2, y + s * d / 2 - 0.09, z + 0.9),
            (x + w / 2, y + s * d / 2 + 0.09, z + 0.9 + w / 2), m_roof)
    box("ridge", (x - 0.14, y - d / 2, z + 0.9 + w / 2 - 0.1),
        (x + 0.14, y + d / 2, z + 0.9 + w / 2 + 0.18), m_roof)


def ph_windmill(x, y, z, w, d, m_wall, m_roof):
    """10 — windmill tower."""
    r = min(w, d) / 2
    cyl("tower", x, y, z, z + 6.6, r, m_wall, verts=12, r2=r * 0.62)
    cone("cap", x, y, z + 6.6, z + 8.6, r * 0.78, m_roof, verts=12)
    obox("hub", (0.7, 0.7, 0.7), (x, y - r * 0.92, z + 7.2), (0, 0, 0), BRASS)
    for k in range(4):
        ang = math.pi / 2 * k + math.pi / 8
        obox("blade%d" % k, (0.9, 0.16, 5.2),
             (x + math.sin(ang) * 2.8, y - r * 0.98, z + 7.2 + math.cos(ang) * 2.8),
             (0, ang, 0), WOOD)
    box("porch", (x - r - 1.0, y - r - 1.6, z), (x + r + 1.0, y - r + 0.2, z + 0.5), WOOD_D)


def ph_pavilion(x, y, z, w, d, m_wall, m_roof):
    """11 — open pavilion with roof garden."""
    box("plinth", (x - w / 2 - 0.6, y - d / 2 - 0.6, z), (x + w / 2 + 0.6, y + d / 2 + 0.6, z + 0.6), PAVE_D)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl("post%d%d" % (sx, sy), x + sx * (w / 2 - 0.5), y + sy * (d / 2 - 0.5),
                z + 0.6, z + 4.4, 0.30, m_wall, verts=8)
    box("core", (x - w / 4, y - d / 4, z + 0.6), (x + w / 4, y + d / 4, z + 4.4), m_wall)
    box("roof", (x - w / 2 - 1.0, y - d / 2 - 1.0, z + 4.4),
        (x + w / 2 + 1.0, y + d / 2 + 1.0, z + 5.0), m_roof)
    box("parapet", (x - w / 2 - 1.0, y - d / 2 - 1.0, z + 5.0),
        (x + w / 2 + 1.0, y + d / 2 + 1.0, z + 5.5), m_roof)
    box("garden", (x - w / 2 - 0.7, y - d / 2 - 0.7, z + 5.0),
        (x + w / 2 + 0.7, y + d / 2 + 0.7, z + 5.3), GRASS_D)


def ph_lodge(x, y, z, w, d, m_wall, m_roof):
    """12 — timber lodge with a wide gable and an outside stair."""
    box("base", (x - w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z + 1.0), ROCK_D)
    box("body", (x - w / 2, y - d / 2, z + 1.0), (x + w / 2, y + d / 2, z + 4.2), m_wall)
    for i in range(4):
        box("stud%d" % i, (x - w / 2 + 0.5 + i * (w - 1.0) / 3 - 0.13, y - d / 2 - 0.07, z + 1.0),
            (x - w / 2 + 0.5 + i * (w - 1.0) / 3 + 0.13, y - d / 2 + 0.07, z + 4.2), WOOD_D)
    gable("roof", x - w / 2 - 1.5, x + w / 2 + 1.5, y - d / 2 - 1.2, y + d / 2 + 1.2,
          z + 4.2, z + 7.0, m_roof, ridge="y")
    box("balcony", (x - w / 2 - 1.2, y - d / 2 - 1.2, z + 4.0),
        (x + w / 2 + 1.2, y - d / 2, z + 4.25), WOOD)
    box("chimney", (x + w / 2 - 1.8, y + d / 2 - 1.6, z + 4.2),
        (x + w / 2 - 0.6, y + d / 2 - 0.4, z + 8.2), ROCK_D)


# ---------------------------------------------------------------- plots ----
# (x, y, z, archetype, wall, roof, silhouette name, footprint w, d)
PLOTS = [
    (-19.0, -34.0, 0.0,  ph_portico,   MARBLE,  MARBLE,  "THE PORTICO",    9.0, 7.0),
    ( 19.0, -34.0, 0.0,  ph_lodge,     WOOD,    CLAY,    "THE LODGE",      8.0, 6.5),
    (-21.0, -22.0, 0.0,  ph_tower,     ROCK,    SLATE,   "THE ROUND TOWER",6.4, 6.4),
    ( 21.0, -22.0, 0.0,  ph_greenhouse,PLASTER, COPPER,  "THE GLASSHOUSE", 7.0, 8.5),
    (-21.0,  -8.0, 3.5,  ph_tiered,    PLAS_W,  CLAY,    "THE TIERED HALL",8.0, 7.0),
    ( 21.0,  -8.0, 3.5,  ph_cube,      PLASTER, PAVE_D,  "THE GLASS CUBE", 8.0, 7.0),
    (-21.0,   4.0, 7.0,  ph_longhouse, PLAS_W,  WOOD_D,  "THE LONGHOUSE",  7.0, 8.0),
    ( 21.0,   4.0, 7.0,  ph_dome,      MARBLE,  COPPER,  "THE OBSERVATORY",7.2, 7.2),
    (-19.0,  15.5, 10.5, ph_ziggurat,  ROCK,    ROCK_D,  "THE STEPPED HALL",9.0, 8.0),
    ( 19.0,  15.5, 10.5, ph_aframe,    PLASTER, SLATE,   "THE A-FRAME",    7.0, 8.0),
    (-15.0,  26.5, 14.0, ph_windmill,  PLASTER, CLAY,    "THE MILL",       6.0, 6.0),
    ( 15.0,  26.5, 14.0, ph_pavilion,  MARBLE,  PAVE,    "THE PAVILION",   7.0, 7.0),
]

for i, (px, py, pz, fn, mw, mr, label, fw, fd) in enumerate(PLOTS, start=1):
    c = coll("Plot_%02d" % i)
    use(c)
    _PFX[0] = "P%02d_" % i
    inward = 1 if px < 0 else -1          # which way the plot faces the stair
    # pad the plot sits on
    box("Pad_%02d" % i, (px - fw / 2 - 1.7, py - fd / 2 - 1.7, pz - 0.05),
        (px + fw / 2 + 1.7, py + fd / 2 + 1.7, pz + 0.10), ROCK_D)
    box("PadIn_%02d" % i, (px - fw / 2 - 1.2, py - fd / 2 - 1.2, pz + 0.05),
        (px + fw / 2 + 1.2, py + fd / 2 + 1.2, pz + 0.16), PAVE)
    # branch path from the spine out to the pad
    x_in = px + inward * (fw / 2 + 1.7)
    x_spine = -inward * 4.4
    box("Branch_%02d" % i, (min(x_in, x_spine), py - 1.5, pz - 0.02),
        (max(x_in, x_spine), py + 1.5, pz + 0.08), PAVE)
    # the placeholder building itself
    fn(px, py, pz + 0.16, fw, fd, mw, mr)
    # signboard on the path side, reading toward the stair
    signpost("Sign_%02d" % i, px + inward * (fw / 2 + 3.4), py + 3.6, pz,
             "%02d" % i, label, inward)
    lantern("PlotLamp_%02d" % i, px + inward * (fw / 2 + 3.4), py + 6.2, pz, 2.8)
    for j, (tx, ty, tk, th) in enumerate((
            (px - inward * (fw / 2 + 2.6), py - fd / 2 - 1.0, i % 3, 4.4),
            (px - inward * (fw / 2 + 3.2), py + fd / 2 + 1.4, (i + 1) % 3, 3.6))):
        tree("PlotTree_%02d_%d" % (i, j), tx, ty, pz, th, tk)
_PFX[0] = ""

# ---------------------------------------------------------------- nature --
use(coll("Nature"))
_seed = 7
def rnd():
    global _seed
    _seed = (_seed * 1103515245 + 12345) % 2147483648
    return _seed / 2147483648.0

for i in range(70):
    tz, xh, y0, y1 = TIERS[i % 5]
    tx = (rnd() * 2 - 1) * (xh - 2.0)
    ty = y0 + 1.5 + rnd() * (y1 - y0 - 3.0)
    if abs(tx) < 7.0:                       # keep the stair spine clear
        continue
    near_plot = any(abs(tx - p[0]) < 10.0 and abs(ty - p[1]) < 10.0 and abs(tz - p[2]) < 0.1
                    for p in PLOTS)
    if near_plot:
        continue
    tree("Wild_%02d" % i, tx, ty, tz, 3.2 + rnd() * 3.0, i % 3)
for i in range(14):                          # boulders
    tz, xh, y0, y1 = TIERS[i % 5]
    bx = (rnd() * 2 - 1) * (xh - 3.0)
    by = y0 + 2.0 + rnd() * (y1 - y0 - 4.0)
    if abs(bx) < 7.5:
        continue
    sphere("Rock_%02d" % i, bx, by, tz + 0.2, 0.5 + rnd() * 0.8, ROCK_D, subd=1)
for i in range(8):                           # lanterns lining the stair spine
    ly = -40 + i * 8.5
    tier = next((t for t in TIERS if t[2] <= ly < t[3]), TIERS[0])
    for s in (-6.2, 6.2):
        lantern("PathLamp_%d_%.0f" % (i, s), s, ly, tier[0], 3.0)


# ----------------------------------------------------------------- loci ----
use(coll("Loci"))
for i, (px, py, pz, fn, mw, mr, label, fw, fd) in enumerate(PLOTS, start=1):
    e = bpy.data.objects.new("Locus_%02d" % i, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 1.2
    e.location = (px, py, pz + 3.4)
    link(e)


# --------------------------------------------------------- light + world ---
use(ROOT)
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
sun.data.energy = 2.6
sun.data.angle = math.radians(3.0)
sun.rotation_euler = (math.radians(52), 0, math.radians(28))
ROOT.objects.link(sun)
fill = bpy.data.objects.new("Fill", bpy.data.lights.new("Fill", "SUN"))
fill.data.energy = 0.55
fill.rotation_euler = (math.radians(65), 0, math.radians(-140))
ROOT.objects.link(fill)

world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.42, 0.60, 0.82, 1.0)
    bg.inputs[1].default_value = 0.35

cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 42
cam = bpy.data.objects.new("Camera", cam_data)
cam.location = (0.0, -96.0, 44.0)
cam.rotation_euler = (math.radians(66), 0, 0)
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
    scene.view_settings.view_transform = "Standard"
except Exception:
    pass
scene.view_settings.look = "None"
scene.render.resolution_x = 1600
scene.render.resolution_y = 900
scene.render.film_transparent = False

bpy.context.view_layer.update()

# ------------------------------------------------------------ save/export --
os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB",
                          use_selection=False, export_apply=True, export_yup=True)
print("SAVED", BLEND)
print("WROTE", OUT_GLB)
print("OBJECTS", len(bpy.data.objects))
