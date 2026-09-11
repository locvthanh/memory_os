"""Export-time preparation for the `war-museum` scene ("Hall of Sand Tables").

Source: blender_models/WarMuseum.blend, generated through Blender MCP by the
modules in blender_models/war_museum_scenegen/ (wm_lib.py helpers, wm_layout.py
table registry, wm_common.py table furniture). A grand stone gallery -- marble
checker floor, two colonnades, a segmental barrel vault with a crown skylight,
an apse -- holds seven sand tables in date order, alternating left and right
down a red carpet with a brass timeline: Cannae 216 BC, Bach Dang 1288,
Gettysburg 1863, the Somme 1916, Normandy 1944, Dien Bien Phu 1954 and the Fall
of Saigon 1975. Behind each table a glowing arch on the wall is the "portal" to
that war's own scene; opposite each table, under a window, a glass case holds
one artifact. An eternal-flame memorial fills the apse.

Locus_01..09 are baked into the .blend (entrance plinth, the seven table
centres at 1.45 m, the memorial flame), so build_glb.py's SCENES entry is empty.

What this module does, in memory only (the .blend is never saved):
  * drops the Blender-only rig: every camera (overview, hero, aerial, one per
    table) and every light (skylight areas, table spots, portal glows, the
    flame lamp). The viewer lights the hall itself;
  * flattens the ~130 text objects (plaques, portal tablets, labels on the
    tables, year medallions) to zero extrude and resolution_u 2 before
    bake_curves_to_meshes() turns them into meshes;
  * tones down the portal / ring / lamp emission (EMISSION_SCALE), which is
    set for the Blender stills and reads as flat white in the viewer;
  * recentres the hall on the origin: it is authored from the entrance at
    Blender y=0 to the apse at y~67, and Viewer's shadow box is centred on the
    origin, so OFFSET_Y is subtracted from every root object. The scene config's
    numbers already have this applied.

merge() replaces build_glb.py's merge_by_material for this scene. The ~290
batched meshes plus the baked texts collapse to one object per material, with
two differences: the seven sand-table terrains keep their own objects, because
they are coloured by a per-face colour attribute that the bmesh re-merge would
throw away; and the hall envelope (walls, vault, apse, windows, the entrance
wall and doors) is merged separately under a ROOF_ prefix so Viewer skips
castShadow on it -- the single overhead sun would otherwise put the whole
interior in the shadow of its own roof.
"""
import bpy, bmesh
from collections import defaultdict

OFFSET_Y = 33.0
ENVELOPE_PREFIXES = ("Hall_Walls", "Hall_Vault", "Hall_Apse", "Hall_Windows", "Entrance_")

# Emission strengths tuned for the Blender stills (EEVEE + AgX) blow out to flat
# white under the viewer's lights, and the portal arches lose the table colour
# that is their whole point. Scale them down for the glb only.
EMISSION_SCALE = {"Glow_": 0.3, "GlowCore_": 0.3, "Ring_": 0.3, "Lamp_": 0.35}


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
        k = next((p for p in EMISSION_SCALE if m.name.startswith(p)), None)
        if k and m.node_tree:
            b = m.node_tree.nodes.get("Principled BSDF")
            if b and "Emission Strength" in b.inputs:
                b.inputs["Emission Strength"].default_value *= EMISSION_SCALE[k]
                tuned += 1
    for ob in bpy.data.objects:
        if ob.parent is None:
            ob.location.y -= OFFSET_Y
    bpy.context.view_layer.update()
    print("war-museum: dropped %d rig objects, flattened %d texts, toned %d emissives, recentred by y-%g"
          % (dropped, texts, tuned, OFFSET_Y))


def merge():
    groups = {}
    sources = []
    kept = 0
    for ob in [o for o in bpy.data.objects if o.type == "MESH"]:
        if len(ob.data.color_attributes):
            kept += 1          # sand-table terrain: keep its colour attribute
            continue
        sources.append(ob)
        roof = ob.name.startswith(ENVELOPE_PREFIXES)
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
    coll = bpy.data.collections.new("10_Export")
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
    print("war-museum: merged %d meshes into %d by material, kept %d terrains"
          % (len(sources), len(groups), kept))
