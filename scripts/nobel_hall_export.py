"""Export-time preparation for the `nobel-hall` scene (the Nobel Medal Hall).

Source: blender_models/NobelHall.blend, generated through Blender MCP by the
modules in blender_models/nobel_hall_scenegen/ (nh_lib.py helpers, nh_layout.py
plan, nh_pegs.py the thirty memory pegs, nh_build.py everything else). A round
gold-and-marble plaza like a medal lying on the water: a giant Nobel medal at
the centre, six coloured paths out to the rim (Physics, Chemistry, Medicine,
Literature, Peace, Economics), and on every path five plinths on gold "tree
rings", 2021 nearest the medal and 2025 furthest out, each with a low-poly
memory peg and a tilted sign (year, surnames, what for). An empty 2026 plinth
waits at the end of every path.

Locus_01..32 are baked into the .blend (collection 09_Loci), so build_glb.py's
SCENES entry is empty. The plaza is centred on the origin, so no recentring.

What this module does, in memory only (the .blend is never saved):
  * drops the Blender-only rig: every camera (overview + one per locus) and
    the sun. The viewer lights the scene itself;
  * flattens every text object to zero extrude / resolution_u 2 before
    bake_curves_to_meshes() turns them into meshes;
  * tones down the emissive materials (EMISSION_SCALE), which are set for
    the EEVEE stills and read as flat white in the viewer.

merge() then collapses all meshes to one object per material.
"""
import bpy, bmesh
from collections import defaultdict

EMISSION_SCALE = {"NH_glow_y": 0.4, "NH_glow_c": 0.45, "NH_glow_b": 0.45, "NH_glow_g": 0.45,
                  "NH_glow_o": 0.4, "NH_glow_r": 0.45, "NH_glow_w": 0.35, "NH_glow_p": 0.45,
                  "NH_vaccine": 0.5}


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
        k = EMISSION_SCALE.get(m.name)
        if k and m.node_tree:
            b = m.node_tree.nodes.get("Principled BSDF")
            if b and "Emission Strength" in b.inputs:
                b.inputs["Emission Strength"].default_value *= k
                tuned += 1
    bpy.context.view_layer.update()
    print("nobel-hall: dropped %d rig objects, flattened %d texts, toned %d emissives"
          % (dropped, texts, tuned))


def merge():
    groups = {}
    sources = [o for o in bpy.data.objects if o.type == "MESH"]
    for ob in sources:
        roof = False
        mats = list(ob.data.materials)
        tmp = bmesh.new()
        tmp.from_mesh(ob.data)
        tmp.transform(ob.matrix_world)
        vmaps = defaultdict(dict)
        for f in tmp.faces:
            mat = mats[f.material_index] if f.material_index < len(mats) else None
            key = (("ROOF_" if roof else "MERGED_"), mat.name if mat else "_none")
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
    print("nobel-hall: merged %d meshes into %d by material" % (len(sources), len(groups)))
