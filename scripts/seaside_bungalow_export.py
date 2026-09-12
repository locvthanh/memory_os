"""Export-time preparation for the `seaside-bungalow` scene.

Source: blender_models/SeasideBungalow.blend, generated through Blender MCP by
blender_models/seaside_bungalow_scenegen/ (sb_lib.py helpers, sb_mats.py
procedural Cycles materials, sb_build.py geometry, sb_render.py background
stills). A realistic whitewashed beach-bungalow living room at midday: glass
sliding door onto a teak deck, the beach, leaning coconut palms, the sea and a
hazy island on the horizon, and one
whimsical intruder: a wizard's hat floating over the coffee table.

Locus_01..16 are baked into the .blend (collection 10_Loci, named
Locus_NN_<key>), so build_glb.py's SCENES entry is empty. Blender +Y points out
to sea, which becomes three.js -Z.

What this module does, in memory only (the .blend is never saved):
  * drops the Blender-only rig: cameras, the sun, the Cycles light portals and
    the 07_Sky cloud cards (camera-facing emissive planes 3-5 km out);
  * pulls the far ocean plane and the two horizon islands inside the viewer's
    2 km camera far plane (the islands keep their angular size);
  * replaces every procedural node tree with a flat Principled BSDF (glTF
    cannot carry Wave/Noise/Brick textures -- without this the wood, sand and
    water would all export white). Glass and sheer curtains get alpha;
  * renames the house shell (walls, ceiling, roof, beams), the glass and the
    curtains with a ROOF_ prefix so Viewer skips castShadow on them -- the
    viewer's single overhead sun would otherwise leave the room black.
Modifiers (bevels, cane wireframes, the Ocean modifier) are applied by the
exporter itself (export_apply=True). Objects are not merged: the scene is ~320
nodes, and merging would throw away the smooth/weighted normals.
"""
import bpy

# name -> (sRGB hex, roughness, metallic, alpha)
FLAT = {
    "SB_OakFloor": ("#b48659", 0.45, 0.0, 1.0),
    "SB_TeakDeck": ("#a87b52", 0.7, 0.0, 1.0),
    "SB_DarkBeam": ("#4e3524", 0.6, 0.0, 1.0),
    "SB_Teak": ("#6b462c", 0.45, 0.0, 1.0),
    "SB_TeakY": ("#6b462c", 0.45, 0.0, 1.0),
    "SB_DoorFrame": ("#46301f", 0.4, 0.0, 1.0),
    "SB_CeilingBoards": ("#ebe4d8", 0.85, 0.0, 1.0),
    "SB_Plaster": ("#f0ebe2", 0.9, 0.0, 1.0),
    "SB_Glass": ("#e6f4f2", 0.05, 0.0, 0.06),
    "SB_Sheer": ("#fbf8f2", 0.9, 0.0, 0.5),
    "SB_Linen": ("#e3dccf", 0.95, 0.0, 1.0),
    "SB_LinenBlue": ("#3f6f7c", 0.9, 0.0, 1.0),
    "SB_LinenSand": ("#c7ae88", 0.9, 0.0, 1.0),
    "SB_CushionWhite": ("#f1ede4", 0.9, 0.0, 1.0),
    "SB_Jute": ("#b39a72", 0.95, 0.0, 1.0),
    "SB_Terracotta": ("#b4694a", 0.85, 0.0, 1.0),
    "SB_PotGrey": ("#8f8a82", 0.8, 0.0, 1.0),
    "SB_Sand": ("#e2cca0", 0.95, 0.0, 1.0),
    "SB_Water": ("#1c9fb3", 0.12, 0.0, 1.0),
    "SB_PalmLeaf": ("#5b8a2e", 0.6, 0.0, 1.0),
    "SB_PalmLeafDry": ("#9c8752", 0.7, 0.0, 1.0),
    "SB_IndoorLeaf": ("#3b6a2a", 0.5, 0.0, 1.0),
    "SB_PalmBark": ("#6f5d49", 0.9, 0.0, 1.0),
    "SB_Art": ("#7fa7a6", 0.8, 0.0, 1.0),
    "SB_Stone": ("#7d746a", 0.85, 0.0, 1.0),
    "SB_Island": ("#7f9d9c", 1.0, 0.0, 1.0),
    "SB_WizardFelt": ("#262f66", 0.85, 0.0, 1.0),
}
ROOF_COLLECTIONS = ("01_Shell",)
ROOF_MATERIALS = ("SB_Glass", "SB_Sheer")
DROP_COLLECTIONS = ("07_Sky", "08_Lights", "09_Camera")
FAR = 0.45          # islands / far ocean pulled in by this factor


def _srgb(h):
    h = h.lstrip("#")
    f = lambda x: x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    return tuple(f(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)


def _flatten(m, hexcol, rough, metal, alpha):
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    p = nt.nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Base Color"].default_value = _srgb(hexcol)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    p.inputs["Alpha"].default_value = alpha
    nt.links.new(p.outputs[0], out.inputs["Surface"])
    if alpha < 1.0:
        m.surface_render_method = "BLENDED"
        try:
            m.blend_method = "BLEND"
        except Exception:
            pass


def prepare():
    dropped = 0
    for cname in DROP_COLLECTIONS:
        c = bpy.data.collections.get(cname)
        if not c:
            continue
        for ob in list(c.all_objects):
            bpy.data.objects.remove(ob, do_unlink=True)
            dropped += 1
        bpy.data.collections.remove(c)
    for ob in list(bpy.data.objects):
        if ob.type in ("CAMERA", "LIGHT"):
            bpy.data.objects.remove(ob, do_unlink=True)
            dropped += 1
    # horizon: keep inside the viewer's 2000-unit far plane
    for n in ("Island_Far", "Island_Far2"):
        ob = bpy.data.objects.get(n)
        if ob:
            ob.location = (ob.location.x * FAR, ob.location.y * FAR, ob.location.z * FAR)
            ob.scale = tuple(s * FAR for s in ob.scale)
            for md in ob.modifiers:
                if md.type == "SUBSURF":
                    md.levels = md.render_levels = 1
    far = bpy.data.objects.get("Ocean_Far")
    if far:
        far.scale = (1900.0, 900.0, 1.0)
        far.location = (0.0, 245.0 + 900.0, far.location.z)
    flat = 0
    for m in bpy.data.materials:
        if not m.node_tree:
            continue
        if m.name in FLAT:
            _flatten(m, *FLAT[m.name])
            flat += 1
    roof = 0
    for ob in list(bpy.data.objects):     # list(): renaming re-sorts bpy.data.objects
        if ob.type != "MESH" or ob.name.startswith("ROOF_"):
            continue
        in_shell = any(c.name in ROOF_COLLECTIONS for c in ob.users_collection)
        mats = [s.material.name for s in ob.material_slots if s.material]
        if in_shell or any(mn in ROOF_MATERIALS for mn in mats):
            ob.name = "ROOF_" + ob.name
            roof += 1
    bpy.context.view_layer.update()
    print("seaside-bungalow: dropped %d rig objects, flattened %d materials, %d shadowless ROOF_ meshes"
          % (dropped, flat, roof))
