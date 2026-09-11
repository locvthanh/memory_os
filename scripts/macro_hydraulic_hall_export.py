"""Export-time preparation for the `macro-hydraulic-hall` scene (macroeconomics
series, scene 0: the Hydraulic Hall, the hub of the series).

Source: blender_models/HydraulicHall.blend, generated through Blender MCP by the
modules in blender_models/hydraulic_hall_scenegen/ (hh_lib.py helpers,
hh_layout.py plan, hh_parts.py machine parts, hh_people.py the recurring cast,
hh_props.py set pieces, hh_build.py everything else). A steampunk engine hall
around a giant MONIAC laid out like the circular-flow diagram on a brass-framed
board: households and firms as two tall glass tanks, spending along the bottom
through the Main Pump, income across the top, and the three side circuits
(banks S -> I, government T -> G, rest of the world M -> X) nested between them.

Locus_01..11 are baked into the .blend (collection 11_Loci), so build_glb.py's
SCENES entry is empty. The hall is authored around the origin, so there is no
recentring.

What this module does, in memory only (the .blend is never saved):
  * drops the Blender-only rig: every camera (overview + one per locus), the
    sun and the two area fills. The viewer lights the scene itself;
  * flattens every text object to zero extrude / resolution_u 2 before
    bake_curves_to_meshes() turns them into meshes;
  * tones down the emissive materials (EMISSION_SCALE), which are set for
    the EEVEE stills and read as flat white in the viewer.

merge() then collapses all meshes to one object per material. Objects named
ROOF_* (the brick walls and the slate roof strips) and every glass material
are merged under a ROOF_ prefix so Viewer skips castShadow on them: the walls
would otherwise shade half the hall, and the glass tank shells would throw an
opaque shadow over the coloured water inside them.
"""
import bpy, bmesh
from collections import defaultdict

EMISSION_SCALE = {"HH_lamp": 0.35, "HH_fire": 0.4, "HH_qmark": 0.55, "HH_window": 0.5,
                  "HH_arrow": 0.6, "HH_text_gold": 0.8, "HH_text_cream": 0.8}
EMISSION_PREFIX_SCALE = {"HH_water_": 0.6, "HH_ink_": 0.7, "HH_fan_": 0.5}
NO_SHADOW_MATERIAL_PREFIX = ("HH_glass",)


def _scale_for(name):
    if name in EMISSION_SCALE:
        return EMISSION_SCALE[name]
    for p, k in EMISSION_PREFIX_SCALE.items():
        if name.startswith(p):
            return k
    return None


def prepare():
    dropped = 0
    for ob in list(bpy.data.objects):
        if ob.type in ("CAMERA", "LIGHT"):
            bpy.data.objects.remove(ob, do_unlink=True)
            dropped += 1
    texts = 0
    for cu in bpy.data.curves:
        if isinstance(cu, bpy.types.TextCurve):
            cu.extrude = 0.0
            cu.bevel_depth = 0.0
            cu.resolution_u = 2
            texts += 1
    tuned = 0
    for m in bpy.data.materials:
        k = _scale_for(m.name)
        if k and m.node_tree:
            b = m.node_tree.nodes.get("Principled BSDF")
            if b and "Emission Strength" in b.inputs:
                b.inputs["Emission Strength"].default_value *= k
                tuned += 1
    bpy.context.view_layer.update()
    print("macro-hydraulic-hall: dropped %d rig objects, flattened %d texts, toned %d emissives"
          % (dropped, texts, tuned))


def merge():
    groups = {}
    sources = [o for o in bpy.data.objects if o.type == "MESH"]
    for ob in sources:
        roof = ob.name.startswith("ROOF_")
        mats = list(ob.data.materials)
        tmp = bmesh.new()
        tmp.from_mesh(ob.data)
        tmp.transform(ob.matrix_world)
        vmaps = defaultdict(dict)
        for f in tmp.faces:
            mat = mats[f.material_index] if f.material_index < len(mats) else None
            mname = mat.name if mat else "_none"
            no_shadow = roof or mname.startswith(NO_SHADOW_MATERIAL_PREFIX)
            key = (("ROOF_" if no_shadow else "MERGED_"), mname)
            bm = groups.get(key)
            if bm is None:
                bm = groups[key] = bmesh.new()
            vmap = vmaps[key]
            vs = []
            for v in f.verts:
                nv = vmap.get(v)
                if nv is None:
                    nv = vmap[v] = bm.verts.new(v.co)
                vs.append(nv)
            try:
                bm.faces.new(vs)
            except Exception:
                pass
        tmp.free()
    coll = bpy.data.collections.new("20_Export")
    bpy.context.scene.collection.children.link(coll)
    for (prefix, mname), bm in groups.items():
        bm.normal_update()
        me = bpy.data.meshes.new(prefix + mname)
        bm.to_mesh(me)
        bm.free()
        m = bpy.data.materials.get(mname)
        if m:
            me.materials.append(m)
        coll.objects.link(bpy.data.objects.new(prefix + mname, me))
    for ob in sources:
        bpy.data.objects.remove(ob, do_unlink=True)
    print("macro-hydraulic-hall: merged %d meshes into %d by material" % (len(sources), len(groups)))
