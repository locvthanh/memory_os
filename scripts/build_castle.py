"""Build models/castle.glb from scratch (no .blend needed).

    blender -b -P scripts/build_castle.py

Procedural low-poly castle: curtain wall with crenellations, four corner
towers, a south gatehouse with a raised portcullis, a central keep with
corner turrets and banners, plus a courtyard well and a couple of props.
Locus_01..07 empties are baked in (order = walkthrough order); their world
positions drive `buildLoci` (src/viewer/loci.js). Export uses export_yup, so
a Blender empty at (x, y, z) lands at three.js (x, z, -y).

This was the scene's original authoring pass; edit here and re-run to
regenerate the glb.
"""
import bpy, os, math

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "models", "castle.glb")

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

scene = bpy.context.scene
root = scene.collection


def mat(name, rgb, rough=0.9):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*rgb, 1.0)
    b.inputs["Roughness"].default_value = rough
    return m


STONE = mat("M_Stone", (0.76, 0.73, 0.65))
STONE_D = mat("M_StoneDark", (0.57, 0.54, 0.49))
ROOF = mat("M_Roof", (0.34, 0.10, 0.09))
WOOD = mat("M_Wood", (0.28, 0.18, 0.10))
GRASS = mat("M_Grass", (0.24, 0.34, 0.18))
DIRT = mat("M_Dirt", (0.35, 0.28, 0.20))
BANNER = mat("M_Banner", (0.60, 0.06, 0.06))
WATER = mat("M_Water", (0.15, 0.30, 0.40), rough=0.2)


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
    ob = bpy.data.objects.new(name, me)
    root.objects.link(ob)
    return ob


def cyl(name, x, y, z0, z1, r, m, verts=16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r,
        depth=(z1 - z0), location=(x, y, (z0 + z1) / 2))
    ob = bpy.context.active_object
    ob.name = name
    ob.data.materials.append(m)
    return ob


def cone(name, x, y, z0, z1, r, m, verts=16):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=0.0,
        depth=(z1 - z0), location=(x, y, (z0 + z1) / 2))
    ob = bpy.context.active_object
    ob.name = name
    ob.data.materials.append(m)
    return ob


# ---- ground ----
box("Ground", (-45, -45, -0.6), (45, 45, 0.0), GRASS)
box("Courtyard", (-15, -15, 0.0), (15, 15, 0.06), DIRT)
box("Road", (-3.5, -45, 0.0), (3.5, -15, 0.05), DIRT)

WALL_OUT, WALL_IN, WALL_H = 16.0, 15.0, 6.5

# ---- curtain walls (south has the gate gap x -4..4) ----
box("Wall_N", (-WALL_OUT, WALL_IN, 0), (WALL_OUT, WALL_OUT, WALL_H), STONE)
box("Wall_E", (WALL_IN, -WALL_OUT, 0), (WALL_OUT, WALL_OUT, WALL_H), STONE)
box("Wall_W", (-WALL_OUT, -WALL_OUT, 0), (-WALL_IN, WALL_OUT, WALL_H), STONE)
box("Wall_S_L", (-WALL_OUT, -WALL_OUT, 0), (-4.0, -WALL_IN, WALL_H), STONE)
box("Wall_S_R", (4.0, -WALL_OUT, 0), (WALL_OUT, -WALL_IN, WALL_H), STONE)

box("Walk_N", (-WALL_IN, WALL_IN - 1.4, WALL_H - 0.4), (WALL_IN, WALL_IN, WALL_H), STONE_D)
box("Walk_S_L", (-WALL_IN, -WALL_IN, WALL_H - 0.4), (-4.0, -WALL_IN + 1.4, WALL_H), STONE_D)
box("Walk_S_R", (4.0, -WALL_IN, WALL_H - 0.4), (WALL_IN, -WALL_IN + 1.4, WALL_H), STONE_D)
box("Walk_E", (WALL_IN - 1.4, -WALL_IN, WALL_H - 0.4), (WALL_IN, WALL_IN, WALL_H), STONE_D)
box("Walk_W", (-WALL_IN, -WALL_IN, WALL_H - 0.4), (-WALL_IN + 1.4, WALL_IN, WALL_H), STONE_D)


def merlons_along_x(y0, y1, x_start, x_end):
    x, i = x_start, 0
    while x + 1.0 <= x_end:
        box("Merlon_x_%d_%.0f" % (i, y0), (x, y0, WALL_H), (x + 1.0, y1, WALL_H + 1.1), STONE)
        x += 2.0
        i += 1


def merlons_along_y(x0, x1, y_start, y_end):
    y, i = y_start, 0
    while y + 1.0 <= y_end:
        box("Merlon_y_%d_%.0f" % (i, x0), (x0, y, WALL_H), (x1, y + 1.0, WALL_H + 1.1), STONE)
        y += 2.0
        i += 1


merlons_along_x(WALL_IN, WALL_OUT, -WALL_OUT, WALL_OUT)
merlons_along_x(-WALL_OUT, -WALL_IN, -WALL_OUT, -4.0)
merlons_along_x(-WALL_OUT, -WALL_IN, 4.0, WALL_OUT)
merlons_along_y(WALL_IN, WALL_OUT, -WALL_OUT, WALL_OUT)
merlons_along_y(-WALL_OUT, -WALL_IN, -WALL_OUT, WALL_OUT)

# ---- corner towers ----
for (tx, ty) in [(-15, -15), (15, -15), (-15, 15), (15, 15)]:
    cyl("Tower_%d_%d" % (tx, ty), tx, ty, 0, 10.5, 3.0, STONE)
    cyl("TowerCap_%d_%d" % (tx, ty), tx, ty, 10.5, 11.0, 3.4, STONE_D)
    cone("TowerRoof_%d_%d" % (tx, ty), tx, ty, 11.0, 15.0, 3.4, ROOF)

# ---- gatehouse ----
for gx in (-4.5, 4.5):
    cyl("Gate_tower_%.0f" % gx, gx, -15.5, 0, 9.5, 2.6, STONE)
    cone("Gate_roof_%.0f" % gx, gx, -15.5, 9.5, 12.5, 2.4, ROOF)
box("Gate_arch", (-4.5, -16.2, 4.6), (4.5, -14.8, 6.6), STONE)
box("Gate_arch2", (-4.5, -16.2, 6.6), (4.5, -14.8, 7.6), STONE_D)
box("Gate_portc", (-3.0, -15.65, 4.2), (3.0, -15.5, 4.7), WOOD)
for gx in [-2.4, -1.2, 0.0, 1.2, 2.4]:
    box("Gate_bar_%.1f" % gx, (gx - 0.08, -15.62, 3.4), (gx + 0.08, -15.55, 4.5), WOOD)

# ---- central keep ----
box("Keep", (-4.5, 2.5, 0), (4.5, 11.5, 12.5), STONE)
box("Keep_base", (-5.2, 1.8, 0), (5.2, 12.2, 1.2), STONE_D)
box("Keep_roof", (-5.0, 2.0, 12.5), (5.0, 12.0, 13.1), STONE_D)
for (kx, ky) in [(-4.5, 2.5), (4.5, 2.5), (-4.5, 11.5), (4.5, 11.5)]:
    cyl("Keep_turret_%.0f_%.0f" % (kx, ky), kx, ky, 0, 14.5, 1.3, STONE)
    cone("Keep_turret_roof_%.0f_%.0f" % (kx, ky), kx, ky, 14.5, 17.0, 1.6, ROOF)
box("Keep_step", (-2.0, 1.2, 0.0), (2.0, 2.5, 0.5), STONE_D)
box("Keep_door", (-1.3, 2.4, 0.5), (1.3, 2.6, 3.4), WOOD)
for wy in (5.0, 8.5):
    box("Keep_win_%.0f" % wy, (-1.0, 2.45, wy), (1.0, 2.55, wy + 1.4), STONE_D)
for bx in (-2.6, 2.6):
    box("Keep_banner_%.1f" % bx, (bx - 0.5, 2.5, 3.0), (bx + 0.5, 2.62, 7.5), BANNER)

# ---- courtyard props ----
cyl("Well_ring", -5, -5, 0, 1.2, 1.6, STONE)
cyl("Well_water", -5, -5, 0.9, 1.05, 1.2, WATER)
for px in (-6.4, -3.6):
    box("Well_post_%.1f" % px, (px - 0.15, -5.15, 1.2), (px + 0.15, -4.85, 3.6), WOOD)
box("Well_roof", (-6.9, -5.6, 3.5), (-3.1, -4.4, 4.1), ROOF)
box("Cart", (7.0, -8.0, 0.0), (10.0, -6.0, 1.2), WOOD)
cyl("Barrel_1", 6.0, 8.0, 0, 1.1, 0.6, WOOD, verts=10)
cyl("Barrel_2", 7.3, 8.3, 0, 1.1, 0.6, WOOD, verts=10)

# ---- LOCUS empties (Blender x, y, z-up; order = tour order) ----
LOCI = [
    (0.0, -13.0, 1.6),    # 1 gatehouse, entering
    (-5.0, -5.0, 1.2),    # 2 the well
    (0.0, 2.2, 1.7),      # 3 keep door
    (15.0, 15.0, 2.2),    # 4 NE corner tower
    (-15.0, 15.0, 2.2),   # 5 NW corner tower
    (-15.0, 0.0, 6.8),    # 6 west battlements / wall-walk
    (0.0, 7.0, 13.2),     # 7 keep roof, the overlook
]
for i, (x, y, z) in enumerate(LOCI, start=1):
    e = bpy.data.objects.new("Locus_%02d" % i, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.6
    e.location = (x, y, z)
    root.objects.link(e)

# ---- light + world ----
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
sun.data.energy = 3.5
sun.rotation_euler = (math.radians(55), 0, math.radians(35))
root.objects.link(sun)
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.50, 0.62, 0.78, 1.0)

bpy.context.view_layer.update()
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=False,
    export_apply=True, export_yup=True)
print("wrote", OUT)
