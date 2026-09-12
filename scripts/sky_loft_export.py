"""Export-time preparation for the `sky-loft` scene.

Source: blender_models/SkyLoft.blend, built through Blender MCP. A clean
sci-fi daylight apartment high in a tower: a glazed wall onto a balcony ledge,
a hovering lounge chair, a holo panel and a console, with a futuristic
skyline outside -- tapered, twisted and portal towers, a tilted ring tower, an
hourglass, an orb on a shaft, elevated skyways and eight flying cars in the
lanes.

Locus_01..16 are baked into the .blend (collection 10_Loci, named
Locus_NN_<key>), so build_glb.py's SCENES entry is empty. Blender +Y points out
of the window toward the city, which becomes three.js -Z.

What this module does, in memory only (the .blend is never saved):
  * drops the Blender-only rig (suns, area fill, the three still cameras) and
    the `Atmos` haze decks -- camera-distance emissive cards that glTF cannot
    carry and that would read as three flat slabs across the city;
  * flattens every material to a plain Principled BSDF. The city facades are
    shaded from world-space position (window banding) and mixed with an
    emission shader keyed to camera distance for aerial haze; none of that
    survives glTF, so each becomes a flat colour. The viewer's own fog
    (`fog: { near, far }` in src/scenes/sky-loft.js) replaces the haze;
  * prefixes every material with `SL_` so the shell names (SL_Ceiling, SL_Wall,
    SL_Metal, SL_Glass) can be listed in build_glb.ROOF_MATERIALS without
    colliding with other scenes -- merge_by_material then names those meshes
    ROOF_*, and Viewer skips castShadow on them. Without it the viewer's single
    overhead sun leaves the room black.
"""
import bpy

# old name -> (new name, sRGB hex, roughness, metallic, alpha, emission strength)
FLAT = {
    "Floor":        ("SL_Floor",      "#c7cad0", 0.22, 0.0, 1.0, 0.0),
    "Wall":         ("SL_Wall",       "#e4e6ea", 0.45, 0.0, 1.0, 0.0),
    "Ceiling":      ("SL_Ceiling",    "#eef0f2", 0.60, 0.0, 1.0, 0.0),
    "Metal":        ("SL_Metal",      "#848a94", 0.28, 1.0, 1.0, 0.0),
    "DarkTrim":     ("SL_DarkTrim",   "#2c3037", 0.35, 0.4, 1.0, 0.0),
    "Fabric":       ("SL_Fabric",     "#b0b4bb", 0.80, 0.0, 1.0, 0.0),
    "Rug":          ("SL_Rug",        "#c3c7ce", 0.88, 0.0, 1.0, 0.0),
    "WindowGlass":  ("SL_Glass",      "#dcecf7", 0.05, 0.0, 0.10, 0.0),
    "LightStrip":   ("SL_LightStrip", "#dceeff", 0.40, 0.0, 1.0, 2.0),
    "Accent":       ("SL_Accent",     "#4fc3ff", 0.40, 0.0, 1.0, 3.0),
    "Holo":         ("SL_Holo",       "#59c8ff", 0.20, 0.0, 0.45, 2.0),
    "CityGlassA":   ("SL_CityGlassA", "#6d8dae", 0.16, 0.55, 1.0, 0.0),
    "CityGlassB":   ("SL_CityGlassB", "#93aec6", 0.22, 0.45, 1.0, 0.0),
    "CityConcrete": ("SL_CityConcrete", "#b6c0cb", 0.50, 0.0, 1.0, 0.0),
    "CityEdge":     ("SL_CityEdge",   "#6fd8ff", 0.40, 0.0, 1.0, 3.0),
    "CarShell":     ("SL_CarShell",   "#d3d8de", 0.25, 0.80, 1.0, 0.0),
    "CarShell2":    ("SL_CarShellR",  "#a3453c", 0.28, 0.65, 1.0, 0.0),
    "CarShell3":    ("SL_CarShellB",  "#3d6d8f", 0.28, 0.65, 1.0, 0.0),
    "CarGlass":     ("SL_CarGlass",   "#1b2530", 0.08, 0.30, 0.55, 0.0),
    "CarLamp":      ("SL_CarLamp",    "#fff3e0", 0.40, 0.0, 1.0, 6.0),
    "CarTail":      ("SL_CarTail",    "#ff5a22", 0.40, 0.0, 1.0, 5.0),
    "CarThrust":    ("SL_CarThrust",  "#78d8ff", 0.40, 0.0, 1.0, 6.0),
}
DROP_COLLECTIONS = ("Atmos",)


def _srgb(h):
    h = h.lstrip("#")
    f = lambda x: x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    return tuple(f(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)


def _flatten(m, hexcol, rough, metal, alpha, emit):
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    p = nt.nodes.new("ShaderNodeBsdfPrincipled")
    col = _srgb(hexcol)
    p.inputs["Base Color"].default_value = col
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if "Alpha" in p.inputs:
        p.inputs["Alpha"].default_value = alpha
    if emit:
        if "Emission Color" in p.inputs:          # Blender 4.x / 5.x
            p.inputs["Emission Color"].default_value = col
            p.inputs["Emission Strength"].default_value = emit
        elif "Emission" in p.inputs:              # legacy
            p.inputs["Emission"].default_value = col
    nt.links.new(p.outputs[0], out.inputs["Surface"])
    m.blend_method = "BLEND" if alpha < 1.0 else "OPAQUE"


def prepare():
    # 1. drop the Blender-only rig and the haze decks
    for ob in list(bpy.data.objects):
        if ob.type in {"LIGHT", "CAMERA"}:
            bpy.data.objects.remove(ob, do_unlink=True)
    for cname in DROP_COLLECTIONS:
        coll = bpy.data.collections.get(cname)
        if not coll:
            continue
        for ob in list(coll.all_objects):
            bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.collections.remove(coll)

    # 2. flatten + rename every material glTF has to carry
    for old, (new, hexcol, rough, metal, alpha, emit) in FLAT.items():
        m = bpy.data.materials.get(old)
        if not m:
            continue
        _flatten(m, hexcol, rough, metal, alpha, emit)
        m.name = new

    # 3. anything left unflattened (unused helpers) gets a neutral grey so it
    #    never exports as a black node tree
    for m in bpy.data.materials:
        if not m.name.startswith("SL_"):
            _flatten(m, "#b9bec5", 0.6, 0.0, 1.0, 0.0)
            m.name = "SL_" + m.name
    print("sky-loft: prepared %d materials" % len(bpy.data.materials))
