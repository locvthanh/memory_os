"""Export-time preparation for the `pin-factory` scene (Adam Smith's pin factory).

Source: blender_models/PinFactory.blend, generated through Blender MCP by the
modules in blender_models/pin_factory_scenegen/ (pf_lib.py helpers, pf_layout.py
plan, pf_people.py figures, pf_build.py everything else). A low-poly Georgian
waterfront in Kirkcaldy, Fife, read left to right: Adam Smith's statue and The
Wealth of Nations on a lectern; the lone pin-maker's cottage (one man, all 18
steps, one pin a day); the pin manufactory -- ten workers at one long bench,
each doing one step under a numbered sign; the tally board (48,000 a day);
a yard with Smith's three reasons; the quay with a ship (the extent of the
market); and an open door on the pier (the open questions).

Locus_01..16 are baked into the .blend (collection 12_Loci), so build_glb.py's
SCENES entry is empty. The scene is authored roughly centred on the origin
(x -48..46), so unlike war-museum there is no recentring.

What this module does, in memory only (the .blend is never saved):
  * drops the Blender-only rig: every camera (overview + one per locus) and
    the sun. The viewer lights the scene itself;
  * flattens every text object to zero extrude / resolution_u 2 before
    bake_curves_to_meshes() turns them into meshes;
  * tones down the emissive materials (EMISSION_SCALE), which are set for
    the EEVEE stills and read as flat white in the viewer.

merge() then collapses all meshes to one object per material. Objects named
ROOF_* (the tiled back strip of the manufactory roof) are merged separately
under a ROOF_ prefix so Viewer skips castShadow on them, exactly as the
Blender build turns off their shadow -- otherwise the roof would shade the
station sign boards on the back wall.
"""
import bpy, bmesh
from collections import defaultdict

EMISSION_SCALE = {"PF_fire": 0.4, "PF_flame": 0.3, "PF_glow": 0.45,
                  "PF_qmark": 0.5, "PF_window": 0.6}


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
    print("pin-factory: dropped %d rig objects, flattened %d texts, toned %d emissives"
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
    print("pin-factory: merged %d meshes into %d by material" % (len(sources), len(groups)))
