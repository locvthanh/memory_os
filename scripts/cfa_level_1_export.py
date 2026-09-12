"""Export-time preparation for the `cfa-level-1` scene (The CFA Financial District).

Source: blender_models/CFAFinancialDistrict.blend, generated through Blender MCP
by blender_models/cfa_scenegen/ (cfa_lib.py helpers, cfa_layout.py the plan,
cfa_pegs.py the 25 forecourt memory pegs, cfa_build.py everything else).

An island city of the CFA Level I curriculum: a round plaza with the
Charterholder's Compass at its centre, a ring boulevard, and ten buildings on
the outside of the ring -- one per topic area, in curriculum order clockwise
from the north-north-east. EVERY BUILDING'S HEIGHT IS ITS EXAM WEIGHT
(midpoint of the published range x 1.6 m), so the skyline is the weighting:
the 28 m Ethics courthouse towers over the 10.4 m Derivatives pit.

Locus_01..27 are baked into the .blend (collection 09_Loci), so build_glb.py's
SCENES entry is empty and the city is already centred on the origin.

What this module does, in memory only (the .blend is never saved):
  * drops the Blender-only rig -- the sun and all 30 cameras (overview, gate,
    plaza and one per locus). The viewer lights the scene itself;
  * flattens every text object to zero extrude / resolution_u 2 before
    build_glb.py's bake_curves_to_meshes() turns them into meshes (the facade
    signs and 25 name plates are ~600 glyphs);
  * tones down the emissives, which are set for the EEVEE stills and read as
    flat white in the viewer.

The scene is authored as ~210 multi-material bmesh objects, so it is NOT in
build_glb.py's MERGE_BY_MATERIAL -- there is nothing to collapse.
"""
import bpy

EMISSION_SCALE = {"CFA_glow_y": 0.40, "CFA_glow_c": 0.45, "CFA_glow_g": 0.45,
                  "CFA_glow_r": 0.45, "CFA_glow_o": 0.40, "CFA_glow_w": 0.35}


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
    print("cfa-level-1: dropped %d rig objects, flattened %d texts, toned %d emissives"
          % (dropped, texts, tuned))
