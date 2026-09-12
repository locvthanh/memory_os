"""Export-time preparation for the `grab-workplace` scene (The Green Court).

Source: blender_models/GrabCourtyard.blend, generated through Blender MCP by
blender_models/grab_scenegen/ (grab_lib.py helpers, grab_layout.py the plan,
grab_props.py the office furniture, grab_pegs.py the six memory pegs,
grab_build.py everything else).

Tony's Grab workplace as a hex courtyard with six wings: Tech Infra, VN R&D,
Finapps, UCM, Temporal, Web Platforms, each with a team room, a plinth carrying
that area's peg, and its own meeting room. The court holds what changes weekly
-- the priority obelisk, the Now/Next/Waiting wall, the site lead's balcony --
so the walls of the court are the only place anything is allowed to move.

Locus_01..25 are baked into the .blend (collection 09_Loci), so build_glb.py's
SCENES entry is empty and the building is already centred on the origin.

What this module does, in memory only (the .blend is never saved):
  * drops the Blender-only rig -- the sun and the still camera. The viewer
    lights the scene itself;
  * flattens every text object to zero extrude / resolution_u 2 before
    build_glb.py's bake_curves_to_meshes() turns them into meshes (six wing
    signs, six charters, six meeting plates, six peg plates and the court
    labels, ~700 glyphs);
  * tones down the emissives, which are set for the EEVEE stills and read as
    flat white in the viewer.

The scene is ~94 multi-material bmesh objects (one per wing, one per peg), so
it is NOT in build_glb.py's MERGE_BY_MATERIAL -- there is nothing to collapse.
The ROOF_ prefix on the wing roofs and the court ring is what stops the viewer
casting shadows from them into the rooms below.
"""
import bpy

EMISSION_SCALE = {"GB_glow": 0.30, "GB_lamp": 0.28, "GB_warmglow": 0.30,
                  "GB_screen": 0.55}


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
    print("grab-workplace: dropped %d rig objects, flattened %d texts, toned %d emissives"
          % (dropped, texts, tuned))
