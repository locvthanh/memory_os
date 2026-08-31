"""
Procedural low-poly city generator for Blender.

Run this INSIDE Blender via the BlenderMCP execute_blender_code tool, or
paste it into Blender's Scripting tab and run it there directly. It clears
the current scene and builds a fresh low-poly city from scratch.

Origin story: this is the exact script used to generate the first
city-viewer/models/city.glb, extracted here so it can be re-run, tweaked,
or used as a template for generating additional memory-palace scenes.
"""

import bpy, random, math, mathutils

random.seed(7)  # change the seed (or remove it) to get a different layout

# --- Clean scene ---
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)


def shade_flat(obj):
    for p in obj.data.polygons:
        p.use_smooth = False


def make_material(name, color, roughness=0.8, metallic=0.0):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = (*color, 1.0)
            bsdf.inputs["Roughness"].default_value = roughness
            if "Metallic" in bsdf.inputs:
                bsdf.inputs["Metallic"].default_value = metallic
    return mat


def add_box(name, center_xy, base_z, size_xyz, mat):
    sx, sy, sz = size_xyz
    bpy.ops.mesh.primitive_cube_add(size=1, location=(center_xy[0], center_xy[1], base_z + sz / 2))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx, sy, sz)
    shade_flat(obj)
    obj.data.materials.append(mat)
    return obj


# --- Materials ---
mat_asphalt = make_material("Asphalt", (0.05, 0.05, 0.055), roughness=0.9)
mat_concrete = make_material("Concrete", (0.55, 0.53, 0.5), roughness=0.85)
mat_grass = make_material("Grass", (0.25, 0.45, 0.18), roughness=0.9)
mat_trunk = make_material("Trunk", (0.25, 0.15, 0.08), roughness=0.9)
mat_leaves = make_material("Leaves", (0.15, 0.4, 0.15), roughness=0.8)
roof_mat = make_material("Roof", (0.15, 0.15, 0.17), roughness=0.7)

building_palette = [
    (0.85, 0.82, 0.75),
    (0.65, 0.68, 0.72),
    (0.55, 0.35, 0.30),
    (0.35, 0.45, 0.55),
    (0.75, 0.6, 0.4),
    (0.4, 0.4, 0.45),
    (0.3, 0.5, 0.55),
]
building_mats = [make_material(f"Building_{i}", c, roughness=0.5) for i, c in enumerate(building_palette)]

# --- Layout params ---
city_size = 6       # blocks per side
block_size = 6.0
road_width = 2.2
cell = block_size + road_width
half = city_size * cell / 2.0
ground_margin = 6.0

# --- Ground (asphalt) ---
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
ground = bpy.context.active_object
ground.name = "Ground_Asphalt"
ground.scale = (half * 2 + ground_margin, half * 2 + ground_margin, 1)
shade_flat(ground)
ground.data.materials.append(mat_asphalt)

park_chance = 0.15
n_parks = 0
n_buildings = 0

for i in range(city_size):
    for j in range(city_size):
        cx = -half + cell * i + cell / 2
        cy = -half + cell * j + cell / 2
        is_park = random.random() < park_chance

        bpy.ops.mesh.primitive_plane_add(size=1, location=(cx, cy, 0.03))
        pad = bpy.context.active_object
        pad.name = f"Lot_{i}_{j}"
        pad.scale = (block_size, block_size, 1)
        shade_flat(pad)
        pad.data.materials.append(mat_grass if is_park else mat_concrete)

        if is_park:
            n_parks += 1
            n_trees = random.randint(2, 5)
            for t in range(n_trees):
                tx = cx + random.uniform(-block_size / 2 + 0.6, block_size / 2 - 0.6)
                ty = cy + random.uniform(-block_size / 2 + 0.6, block_size / 2 - 0.6)
                trunk_h = random.uniform(0.6, 1.0)
                add_box(f"Trunk_{i}_{j}_{t}", (tx, ty), 0.03, (0.12, 0.12, trunk_h), mat_trunk)
                bpy.ops.mesh.primitive_cone_add(
                    vertices=6, radius1=random.uniform(0.5, 0.8),
                    depth=random.uniform(0.9, 1.4),
                    location=(tx, ty, 0.03 + trunk_h + 0.5),
                )
                leaf = bpy.context.active_object
                leaf.name = f"Leaves_{i}_{j}_{t}"
                shade_flat(leaf)
                leaf.data.materials.append(mat_leaves)
            continue

        n_bld = 1 if random.random() < 0.6 else 2
        pad_inset = 0.5
        usable = block_size - pad_inset * 2
        if n_bld == 1:
            footprints = [(usable, usable, (cx, cy))]
        else:
            if random.random() < 0.5:
                w = usable / 2 - 0.2
                footprints = [
                    (w, usable, (cx - usable / 4 - 0.1, cy)),
                    (w, usable, (cx + usable / 4 + 0.1, cy)),
                ]
            else:
                d = usable / 2 - 0.2
                footprints = [
                    (usable, d, (cx, cy - usable / 4 - 0.1)),
                    (usable, d, (cx, cy + usable / 4 + 0.1)),
                ]

        for bi, (fw, fd, (bx, by)) in enumerate(footprints):
            height = max(1.5, random.gauss(6, 4))
            height = min(height, 22)
            fw2 = fw * random.uniform(0.85, 1.0)
            fd2 = fd * random.uniform(0.85, 1.0)
            mat = random.choice(building_mats)
            add_box(f"Building_{i}_{j}_{bi}", (bx, by), 0.03, (fw2, fd2, height), mat)
            add_box(f"Roof_{i}_{j}_{bi}", (bx, by), 0.03 + height, (fw2 * 0.98, fd2 * 0.98, 0.15), roof_mat)
            n_buildings += 1

# --- Sun ---
bpy.ops.object.light_add(type='SUN', location=(0, 0, 20))
sun = bpy.context.active_object
sun.name = "Sun"
sun.data.energy = 3.0
sun.rotation_euler = (math.radians(55), 0, math.radians(35))

# --- World sky color ---
world = bpy.context.scene.world
if world is None:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.55, 0.7, 0.85, 1.0)
    bg.inputs[1].default_value = 1.0

# --- Camera ---
cam_dist = half * 1.5
bpy.ops.object.camera_add(location=(cam_dist, -cam_dist, cam_dist * 0.65))
cam = bpy.context.active_object
cam.name = "CityCamera"
loc = mathutils.Vector(cam.location)
target = mathutils.Vector((0, 0, 3))
direction_vec = target - loc
rot_quat = direction_vec.to_track_quat('-Z', 'Y')
cam.rotation_euler = rot_quat.to_euler()
bpy.context.scene.camera = cam

# --- Render engine ---
try:
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception:
    try:
        bpy.context.scene.render.engine = 'BLENDER_EEVEE'
    except Exception:
        pass
try:
    bpy.context.scene.eevee.use_gtao = True
except Exception:
    pass

bpy.context.scene.render.resolution_x = 1280
bpy.context.scene.render.resolution_y = 800

result = {
    "status": "ok",
    "grid": f"{city_size}x{city_size}",
    "parks": n_parks,
    "buildings": n_buildings,
    "total_objects": len(bpy.data.objects),
}


# --- Export to glTF (run separately, after reviewing the scene) ---
# import os
# out_dir = r"C:\Users\ASUS\Desktop\Loc\blender\city-viewer\models"
# os.makedirs(out_dir, exist_ok=True)
# path = os.path.join(out_dir, "city.glb")
# bpy.ops.export_scene.gltf(
#     filepath=path, export_format='GLB',
#     use_selection=False, export_apply=True, export_yup=True,
# )
