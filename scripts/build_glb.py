"""Headless exporter: <blend> -> models/<id>.glb, injecting Locus_NN empties.

Run per scene:
    blender -b <path>/<Source>.blend -P scripts/build_glb.py -- <id>

The empties are added to the in-memory scene only; the .blend is never saved.
`buildLoci` (src/viewer/loci.js) reads the empties' world positions from the
glb, so locus placement is authored here in Blender's native Z-up space.
Export uses export_yup=True, so an empty at Blender (x, y, z) ends up at
three.js (x, z, -y) -- keep that in mind when tuning against the viewer.
"""
import bpy, sys, os, mathutils

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# id -> ordered locus positions in Blender coords (x, y, z-up). z ~ eye height.
# Starting values; refine by eye in the viewer then re-export.
SCENES = {
    # chinatown_street.blend (2026-09-05 source): street runs along Blender Y
    # (camera start ~y0, paifang gate ~y44). Zigzag down the lane: gate end
    # first, alternating shopfronts, ending short of y=8 where the hanging
    # lanterns start (HangingLanterns spans y~8-26) -- "where the lamps fade
    # out". x = +-3.5 sits just off each shopfront's street-facing edge (front
    # faces are at |x|~3-4) rather than the shop's own centre (|x|~9), because
    # `position` here is the *look-at* target and the web app's sideView rig
    # anchors the camera further out on the opposite side of that offset --
    # see Walkthrough.js. Supersedes the old ChinatownStreet.blend source (see
    # git history / build_glb.ps1) which ran its street along X instead.
    "chinatown-street": [
        [3.5, 41.8, 2.4],   # ShopR8, right by the gate
        [-3.5, 39.5, 2.4],  # ShopL6
        [3.5, 26.2, 2.4],   # ShopR5
        [-3.5, 21.8, 2.4],  # ShopL3
        [3.5, 8.95, 2.4],   # ShopR1
        [-3.5, 4.32, 2.4],  # ShopL0, past where the lanterns start
    ],
    "coffee-shop": [
        [0, 3.0, 1.0], [-2.8, 4.0, 1.0], [2.8, 4.0, 1.0],
        [0, 5.5, 1.1], [0, 6.2, 2.0],
    ],
    "luan-hoi-dai": [
        [0, 0, 2], [0, -4, 2], [0, -8, 2],
        [5, -6, 2], [-5, -6, 2], [0, 6, 2],
    ],
    "writing-room": [
        [0, 3.6, 1.2], [-2.2, 2.5, 1.4], [-0.8, 3.6, 1.1],
        [0.8, 3.6, 1.1], [2.2, 1.0, 1.0], [0, 4.0, 1.3],
    ],
    "time-machine": [
        [0, 0, 1.8], [0, -5, 1.8], [5, -3, 1.8],
        [5, 3, 1.8], [0, 5, 1.8],
    ],
}


def _make_box(name, mn, mx, mat, coll):
    x0, y0, z0 = mn
    x1, y1, z1 = mx
    verts = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
             (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1),
             (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    if mat:
        me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    return ob


def _mat(name):
    return bpy.data.materials.get(name)


def _solid_mat(name, rgb):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (rgb[0], rgb[1], rgb[2], 1.0)
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = 0.9
    return m


def add_chinatown_ground():
    """Legacy fix for the old ChinatownStreet.blend source, which only had a
    short road + sidewalk strip (x within +-10) so past the middle of the
    street you saw straight through to flat blue background. Lay a large
    ground slab under everything and run the road and raised sidewalks the
    full length of the building rows. Not needed for the current
    chinatown_street.blend source, which already has a full-length ground
    plane -- only called when the legacy PaifangGate collection is present,
    see main()."""
    coll = bpy.data.collections.get("Ground") or bpy.context.scene.collection
    ground = _solid_mat("M_GroundFill", (0.20, 0.18, 0.17))
    road = _mat("M_Road") or ground
    walk = _mat("M_Sidewalk") or ground
    _make_box("GroundFill", (-80, -60, -0.40), (80, 60, -0.02), ground, coll)
    _make_box("RoadLong", (-40, -2.4, -0.02), (40, 2.4, -0.005), road, coll)
    _make_box("SidewalkLong_N", (-40, 2.0, -0.02), (40, 6.2, 0.02), walk, coll)
    _make_box("SidewalkLong_S", (-40, -6.2, -0.02), (40, -2.0, 0.02), walk, coll)


def rebuild_chinatown_gate():
    """Legacy fix (see add_chinatown_ground) -- the old .blend's paifang had
    short pillars that didn't reach the beam and a huge flat roof slab
    floating ~1.5 m above it. Replace the whole PaifangGate collection with a
    clean arch. Only called when that legacy collection is present."""
    coll = bpy.data.collections.get("PaifangGate")
    if not coll:
        return
    for o in list(coll.objects):
        bpy.data.objects.remove(o, do_unlink=True)

    red = _mat("M_GateRed") or _solid_mat("M_GateRed", (0.5, 0.03, 0.03))
    gold = _mat("M_GoldTrim") or _solid_mat("M_GoldTrim", (0.85, 0.65, 0.15))
    green = _mat("M_RoofGreen") or _solid_mat("M_RoofGreen", (0.03, 0.12, 0.08))
    gx = -19.0

    for sy in (-5.4, 5.4):
        _make_box("Gate_pillar_%+.1f" % sy,
                  (gx - 0.34, sy - 0.34, 0.0), (gx + 0.34, sy + 0.34, 5.0), red, coll)
    for sy in (-1.9, 1.9):
        _make_box("Gate_pillar_in_%+.1f" % sy,
                  (gx - 0.24, sy - 0.24, 0.0), (gx + 0.24, sy + 0.24, 4.55), red, coll)
    _make_box("Gate_lintel", (gx - 0.42, -6.1, 3.95), (gx + 0.42, 6.1, 4.35), red, coll)
    _make_box("Gate_trim", (gx - 0.5, -6.3, 4.35), (gx + 0.5, 6.3, 4.5), gold, coll)
    _make_box("Gate_beam", (gx - 0.42, -6.1, 4.5), (gx + 0.42, 6.1, 5.05), red, coll)
    _make_box("Gate_plaque", (gx - 0.5, -1.3, 5.1), (gx + 0.12, 1.3, 6.0), red, coll)
    _make_box("Gate_plaque_trim", (gx - 0.55, -1.5, 5.0), (gx + 0.16, 1.5, 6.12), gold, coll)
    # tiered roof, stacked boxes -> low-poly paifang cap
    _make_box("Gate_roof_1", (gx - 1.7, -7.6, 5.0), (gx + 1.7, 7.6, 5.55), green, coll)
    _make_box("Gate_roof_2", (gx - 1.15, -6.8, 5.55), (gx + 1.15, 6.8, 6.05), green, coll)
    _make_box("Gate_roof_3", (gx - 0.6, -6.0, 6.05), (gx + 0.6, 6.0, 6.5), green, coll)
    _make_box("Gate_ridge", (gx - 0.66, -6.1, 6.44), (gx + 0.66, 6.1, 6.62), gold, coll)


def rebuild_chinatown_props():
    """Legacy fix (see add_chinatown_ground) -- the old .blend's street lamps
    were three disjoint floating pieces and the lantern strings sagged to head
    height. Rebuild proper lamps + tidy lantern garlands. Only called when the
    legacy PaifangGate collection is present."""
    black = _mat("M_LampBlack") or _solid_mat("M_LampBlack", (0.03, 0.03, 0.03))
    glow = _mat("M_LampGlow") or _solid_mat("M_LampGlow", (1.0, 0.85, 0.5))
    red = _mat("M_LanternRed") or _solid_mat("M_LanternRed", (0.6, 0.02, 0.02))
    gold = _mat("M_LanternGold") or _solid_mat("M_LanternGold", (0.8, 0.6, 0.1))

    # keep the nice lantern sphere + cap meshes before deleting the originals
    src = bpy.data.objects.get("LanternRow_0_lantern_0")
    cap_t = bpy.data.objects.get("LanternRow_0_lantern_0_cap1")
    cap_b = bpy.data.objects.get("LanternRow_0_lantern_0_cap-1")
    body_mesh = src.data if src else None
    body_scale = src.scale.copy() if src else mathutils.Vector((1, 1, 1))
    cap_t_mesh = cap_t.data if cap_t else None
    cap_b_mesh = cap_b.data if cap_b else None
    for m in (body_mesh, cap_t_mesh, cap_b_mesh):
        if m:
            m.use_fake_user = True

    for o in [x for x in bpy.data.objects
              if x.name.startswith(("Lamp_", "LanternRow_"))]:
        bpy.data.objects.remove(o, do_unlink=True)

    lights = bpy.data.collections.get("Lights") or bpy.context.scene.collection
    props = bpy.data.collections.get("Props") or bpy.context.scene.collection

    # --- street lamps: one row just inside each sidewalk edge ---
    for side, ly, reach in (("N", 4.7, -0.6), ("S", -4.7, 0.6)):
        for i, lx in enumerate(range(-15, 16, 6)):
            _make_box("Lamp_%s_%d_pole" % (side, i),
                      (lx - 0.07, ly - 0.07, 0.0), (lx + 0.07, ly + 0.07, 3.4),
                      black, lights)
            hy = ly + reach
            _make_box("Lamp_%s_%d_arm" % (side, i),
                      (lx - 0.05, min(ly, hy), 3.2), (lx + 0.05, max(ly, hy), 3.3),
                      black, lights)
            _make_box("Lamp_%s_%d_head" % (side, i),
                      (lx - 0.17, hy - 0.17, 2.95), (lx + 0.17, hy + 0.17, 3.35),
                      glow, lights)

    # --- lantern garlands strung across the lane, high overhead ---
    def lantern(name, x, y, z):
        if body_mesh:
            b = bpy.data.objects.new(name, body_mesh)
            b.location = (x, y, z)
            b.scale = body_scale
            props.objects.link(b)
            for suffix, mesh, dz in (("capT", cap_t_mesh, 0.23), ("capB", cap_b_mesh, -0.24)):
                if mesh:
                    c = bpy.data.objects.new(name + "_" + suffix, mesh)
                    c.location = (x, y, z + dz)
                    props.objects.link(c)
        else:  # fallback if the template lanterns are missing
            _make_box(name, (x - 0.22, y - 0.22, z - 0.28), (x + 0.22, y + 0.22, z + 0.2), red, props)

    for si, sx in enumerate(range(-16, 17, 5)):
        _make_box("LanternCable_%d" % si,
                  (sx - 0.03, -5.3, 6.05), (sx + 0.03, 5.3, 6.1), black, props)
        for li in range(-3, 4):
            lantern("Lantern_%d_%d" % (si, li + 3), sx, li * 1.5, 5.55)


def _world_bounds(objs):
    mn = mathutils.Vector((1e9, 1e9, 1e9))
    mx = mathutils.Vector((-1e9, -1e9, -1e9))
    for o in objs:
        for corner in o.bound_box:
            w = o.matrix_world @ mathutils.Vector(corner)
            mn = mathutils.Vector((min(mn.x, w.x), min(mn.y, w.y), min(mn.z, w.z)))
            mx = mathutils.Vector((max(mx.x, w.x), max(mx.y, w.y), max(mx.z, w.z)))
    return mn, mx


def fill_chinatown_walls():
    """Legacy fix (see add_chinatown_ground) -- each shopfront in the old
    .blend was window/sign/awning panels floating in front of a small
    set-back body block with the roof hovering above, nothing joining them.
    For each Bldg_* collection, add one solid mass box from ground to roof
    underside. Only called when legacy Bldg_* collections are present (the
    current chinatown_street.blend source has single solid ShopL*/ShopR*
    meshes per shopfront already, so this is a no-op for it)."""
    for coll in bpy.data.collections:
        if not coll.name.startswith("Bldg_"):
            continue
        roof = [o for o in coll.objects
                if o.type == "MESH" and "roof" in o.name.lower()]
        body = [o for o in coll.objects
                if o.type == "MESH" and "roof" not in o.name.lower()]
        if not body:
            continue

        bmn, bmx = _world_bounds(body)
        # footprint + top: use the roof if there is one, else the body parts
        fmn, fmx = _world_bounds(roof) if roof else (bmn, bmx)
        top = (fmn.z + 0.15) if roof else (bmx.z + 0.3)  # meet the roof underside

        north = "_N_" in coll.name  # facade faces -y (toward the road at y=0)
        if north:
            wy0, wy1 = bmn.y + 0.05, bmx.y   # just behind the street panels
        else:
            wy0, wy1 = bmn.y, bmx.y - 0.05

        mat = body[0].data.materials[0] if body[0].data.materials else None
        _make_box(
            coll.name + "_wall",
            (fmn.x, min(wy0, wy1), 0.0),   # down to the ground
            (fmx.x, max(wy0, wy1), top),
            mat, coll,
        )


def fix_chinatown_materials_for_export():
    """The current chinatown_street.blend source uses a custom vertex-color
    driven NPR shader for its FlatVC/ToonVC materials: a per-vertex color
    attribute named "fvar" feeds an Emission node (FlatVC) or a
    Attribute -> VectorMath -> DiffuseBSDF -> ShaderToRGB -> ColorRamp ->
    Emission toon-banding chain (ToonVC). Blender's glTF exporter only
    recognizes vertex colors when they feed a Principled BSDF's Base Color,
    so as authored it silently drops them -- every shopfront would export as
    flat white. Reroute each material's Material Output through a plain
    Principled BSDF fed by the same "fvar" Attribute node's Color output
    (dropping the toon quantization for export, but keeping the actual hue),
    and bake the two solid text materials' (TXT_<hex>) Emission color into
    their own Principled Base Color the same way. This only touches the
    in-memory node graph -- the .blend is never saved, so main()'s
    revert-free "empties in memory only" convention still holds (the caller
    is expected to have opened this via `blender -b`, a fresh process that
    exits after export, so there's nothing to revert)."""
    def route(mat_name, attr_source=None, static_color=None, roughness=0.9):
        m = bpy.data.materials.get(mat_name)
        if not m:
            return
        nt = m.node_tree
        out = nt.nodes.get("Material Output")
        principled = nt.nodes.new("ShaderNodeBsdfPrincipled")
        principled.name = "ExportPrincipled"
        principled.location = (out.location.x - 200, out.location.y - 300)
        if "Roughness" in principled.inputs:
            principled.inputs["Roughness"].default_value = roughness
        if "Specular IOR Level" in principled.inputs:
            principled.inputs["Specular IOR Level"].default_value = 0.1
        elif "Specular" in principled.inputs:
            principled.inputs["Specular"].default_value = 0.1
        if attr_source is not None:
            src_name, src_socket = attr_source
            src = nt.nodes.get(src_name)
            if src:
                nt.links.new(src.outputs[src_socket], principled.inputs["Base Color"])
        elif static_color is not None:
            principled.inputs["Base Color"].default_value = static_color
        nt.links.new(principled.outputs["BSDF"], out.inputs["Surface"])

    route("FlatVC", attr_source=("Attribute", "Color"))
    route("ToonVC", attr_source=("Attribute", "Color"))
    for name in ("TXT_8e1610", "TXT_e6bb4c"):
        m = bpy.data.materials.get(name)
        if not m:
            continue
        em = m.node_tree.nodes.get("Emission")
        color = list(em.inputs["Color"].default_value) if em else (1, 1, 1, 1)
        route(name, static_color=color)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if not argv or argv[0] not in SCENES:
        raise SystemExit("usage: ... -- <%s>" % "|".join(SCENES))
    scene_id = argv[0]

    export_kwargs = {}
    if scene_id == "chinatown-street":
        if bpy.data.collections.get("PaifangGate"):
            # Legacy source (old ChinatownStreet.blend).
            add_chinatown_ground()
            rebuild_chinatown_gate()
            rebuild_chinatown_props()
            fill_chinatown_walls()
        if bpy.data.materials.get("ToonVC") or bpy.data.materials.get("FlatVC"):
            # Current source (chinatown_street.blend) -- see docstring.
            fix_chinatown_materials_for_export()
            export_kwargs["export_vertex_color"] = "ACTIVE"

    for i, (x, y, z) in enumerate(SCENES[scene_id], start=1):
        empty = bpy.data.objects.new("Locus_%02d" % i, None)
        empty.empty_display_type = "PLAIN_AXES"
        empty.empty_display_size = 0.3
        empty.location = (x, y, z)
        bpy.context.scene.collection.objects.link(empty)

    out = os.path.join(REPO, "models", scene_id + ".glb")
    bpy.ops.export_scene.gltf(
        filepath=out, export_format="GLB", use_selection=False,
        export_apply=True, export_yup=True,
        **export_kwargs,
    )
    print("wrote", out)


main()
