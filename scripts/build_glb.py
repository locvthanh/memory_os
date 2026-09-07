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
    # PortalIsland.blend: every locus is baked directly into the source .blend
    # rather than injected here, so this list is intentionally empty -- the
    # export loop below just skips empty-injection and passes the existing
    # empties through untouched. Currently Locus_01..08 (the gate ring at
    # radius ~12, z~3.41), Locus_09_piano, and Locus_10..13 on the Rosetta
    # language square out on the NW peninsula (isl_rosetta.py).
    "portal-island": [],
    # ChroniclersAthenaeum.blend: like portal-island, every locus is baked
    # directly into the source .blend (collection 09_Loci, named
    # Locus_01_great_hall .. Locus_13_herbarium), so this list is empty and
    # the export loop passes the existing empties through untouched.
    "chroniclers-athenaeum": [],
    # TheWhiteHouse.blend: a scale reconstruction of the real White House, with
    # all 47 presidencies placed in the building's actual named rooms. Every
    # locus (Locus_01..47, collection 11_Loci) is baked into the source .blend
    # and carries custom properties (president_name, term, room, zone), so this
    # list is empty and the export loop passes the existing empties through.
    # The tour climbs the house as it climbs the timeline: Ground Floor 1-5,
    # State Floor 6-16, Second Floor 17-29, Coolidge's Third Floor 30-35, and
    # the West Wing / East Wing / grounds 36-47.
    "the-white-house": [],
    "writing-room": [
        [0, 3.6, 1.2], [-2.2, 2.5, 1.4], [-0.8, 3.6, 1.1],
        [0.8, 3.6, 1.1], [2.2, 1.0, 1.0], [0, 4.0, 1.3],
    ],
    "time-machine": [
        [0, 0, 1.8], [0, -5, 1.8], [5, -3, 1.8],
        [5, 3, 1.8], [0, 5, 1.8],
    ],
}


# Objects that exist only for the Blender still renders and have no business
# in a walkthrough. Rosetta_SkyDome especially: it is ~2300 u across and the
# viewer sets castShadow on every mesh it loads, so shipping it would wrap the
# scene in an emissive shell and drop it into shadow.
RENDER_ONLY = {
    "portal-island": ("Sky_Backdrop", "Rosetta_SkyDome", "WideCam",
                      "RosettaCam"),
}


def drop_render_only(scene_id):
    dropped = []
    for name in RENDER_ONLY.get(scene_id, ()):
        ob = bpy.data.objects.get(name)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)
            dropped.append(name)
    if dropped:
        print("dropped render-only objects:", ", ".join(dropped))


# Whole collections to drop before export. The Athenaeum's 07_Lighting holds
# Blender-only lamps and still cameras; we drop those. 08_Roofs is now kept
# and tagged with ROOF_ prefix so the viewer can render them but skip castShadow,
# preventing the interior from rendering black while still showing the roof geometry.
DROP_COLLECTIONS = {
    "chroniclers-athenaeum": ("07_Lighting",),
    # the-white-house: 10_Lighting holds the Blender suns plus the still/plan
    # cameras (Cam_Overview, Cam_Plan, Cam_Cutaway and their TRACK_TO targets).
    "the-white-house": ("10_Lighting",),
}


def drop_collections(scene_id):
    for cname in DROP_COLLECTIONS.get(scene_id, ()):
        coll = bpy.data.collections.get(cname)
        if not coll:
            continue
        for ob in list(coll.all_objects):
            bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.collections.remove(coll)
        print("dropped collection:", cname)


# Scenes built from thousands of small primitives ship one glb node per object,
# which is one draw call each -- the Athenaeum alone is 2210. Merging every mesh
# that shares a material collapses that to ~25 nodes and (with the decimation
# below on the blob-shaped groups, which are all low-stakes spheres and
# discs: floor stars, candle flames, foliage, fountain water) takes the
# Athenaeum glb from ~13 MB to 3.9 MB.
# value = {material name: decimate ratio}; materials absent from the dict are
# merged but never decimated, because flat-shaded architecture does not survive
# it.
MERGE_BY_MATERIAL = {
    "chroniclers-athenaeum": {
        "Star_Glow": 0.30, "Lamp_Glow": 0.32, "Leaf_Green": 0.30,
        "Leaf_Light": 0.30, "Water": 0.5, "Marble_White": 0.6,
        "Carpet_Teal": 0.6,
    },
    # the-white-house ships ~1,380 objects (every wall segment, window panel,
    # column and pedestal is its own box). Merging by material collapses that to
    # ~34 nodes. Nothing is decimated: this scene is entirely flat-shaded
    # architecture, which decimation destroys.
    "the-white-house": {},
}

# Materials that belong to roofs/ceilings. Merged meshes with these materials
# will be prefixed with ROOF_ so the viewer can skip castShadow for them,
# preventing the interior from rendering in shadow while showing roof geometry.
ROOF_MATERIALS = {
    "Roof_Tile", "Roof_Lead", "Glass_Dome", "Ceiling_Wood",
    # the-white-house: WH_Ceiling is carried by every inter-floor slab and every
    # roof deck (see CEILING_PREFIXES in that scene's build notes). It exists as
    # a material of its own precisely so this tagging can be surgical --
    # WH_Stone_Shadow is shared with the interior partitions, which must keep
    # casting shadows or the rooms read flat.
    "WH_Ceiling", "WH_Roof_Slate",
}


def merge_by_material(scene_id):
    """Collapse every mesh in the scene into one object per material.

    Grouping is done PER FACE, not per object: a face is routed to the group
    named by its own material slot. Most of this repo's scenes are built from
    single-material objects, for which this is identical to the old
    `ob.data.materials[0]` grouping -- but the White House Library furniture
    (collection 13_Library_Washington, added 2026-09-06) is authored as a few
    large bmesh objects carrying 20-30 slots each, and grouping those by their
    first slot silently threw away every other material in the room.

    Vertices are still shared within a source object, so the split costs
    nothing except at the seams between two materials on the same mesh.
    """
    if scene_id not in MERGE_BY_MATERIAL:
        return
    import bmesh
    from collections import defaultdict

    decimate = MERGE_BY_MATERIAL[scene_id]
    bms = {}
    sources = [ob for ob in bpy.data.objects if ob.type == "MESH"]

    for ob in sources:
        mats = list(ob.data.materials)
        tmp = bmesh.new()
        tmp.from_mesh(ob.data)
        tmp.transform(ob.matrix_world)
        vmaps = defaultdict(dict)
        for f in tmp.faces:
            mat = mats[f.material_index] if f.material_index < len(mats) else None
            key = mat.name if mat else "_none"
            bm = bms.get(key)
            if bm is None:
                bm = bms[key] = bmesh.new()
            vmap = vmaps[key]
            verts = []
            for v in f.verts:
                nv = vmap.get(v)
                if nv is None:
                    nv = vmap[v] = bm.verts.new(v.co)
                verts.append(nv)
            try:
                bm.faces.new(verts)
            except Exception:
                pass  # duplicate face from coincident geometry
        tmp.free()

    merged = bpy.data.collections.new("10_Export")
    bpy.context.scene.collection.children.link(merged)

    for matname, bm in bms.items():
        bm.normal_update()
        # Tag roof meshes with ROOF_ prefix so viewer can skip castShadow for them
        prefix = "ROOF_" if matname in ROOF_MATERIALS else "MERGED_"
        me = bpy.data.meshes.new(prefix + matname)
        bm.to_mesh(me)
        bm.free()
        new = bpy.data.objects.new(prefix + matname, me)
        mat = bpy.data.materials.get(matname)
        if mat:
            me.materials.append(mat)
        if matname in decimate:
            mod = new.modifiers.new("dec", "DECIMATE")
            mod.ratio = decimate[matname]
        merged.objects.link(new)

    for ob in sources:
        bpy.data.objects.remove(ob, do_unlink=True)
    print("merged %d meshes into %d by material" % (len(sources), len(bms)))


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


# the-white-house: Blender-space direction from each pedestal toward the side the
# walkthrough camera stands on. Must stay in step with `anchorFrom` in
# src/scenes/the-white-house.js, which is generated from the same offsets.
WH_APPROACH = {
    # 1 faces SOUTH (2026-09-06): the Library's fireplace and its Mount Vernon
    # overmantel -- Washington's strongest peg in the room -- are on the north
    # wall, so the camera has to stand on the south side to see them.
    1: (0, -1), 2: (0, 1), 3: (0, 1), 4: (0, 1), 5: (0, 1),
    6: (0, 1), 7: (0, 1), 8: (0, 1), 9: (0, 1), 10: (0, 1), 11: (0, -1),
    12: (0, -1), 13: (0, -1), 14: (0, -1), 15: (1, 0), 16: (1, 0),
    17: (1, 0), 18: (0, 1), 19: (0, -1), 20: (0, 1), 21: (0, 1), 22: (-1, 0),
    23: (-1, 0), 24: (-1, 0), 25: (0, 1), 26: (0, 1), 27: (-1, 0), 28: (0, 1),
    29: (0, 1), 30: (0, 1), 31: (0, 1), 32: (0, -1), 33: (-1, 0), 34: (0, 1),
    35: (0, 1), 36: (0, 1), 37: (0, -1), 38: (-1, 0), 39: (0, -1), 40: (1, 0),
    41: (-1, 0), 42: (1, 0), 43: (-1, 0), 44: (0, 1), 45: (0, 1), 46: (0, 1),
    47: (-1, 0),
}


def fix_white_house_labels_for_export():
    """Stand each pedestal's name text up as a placard facing its camera.

    In the .blend every label lies flat on the floor, which is right for the
    orthographic floor-plan renders but wrong in the walkthrough: a flat label
    is only legible from one side, and the rig approaches most pedestals from
    the side that reads it backwards. Rotate each Name_NN upright and turn it
    to face its own approach direction, then drop the flat room labels
    (Label_*) and the numerals on the pedestal caps (Num_*) -- the viewer's UI
    panel already carries both the room name and the number for every stop.

    In-memory only; the .blend keeps its flat labels for plan renders.
    """
    import math
    for ob in list(bpy.data.objects):
        if ob.type != "FONT":
            continue
        if ob.name.startswith("Label_") or ob.name.startswith("Num_"):
            bpy.data.objects.remove(ob, do_unlink=True)
            continue
        if not ob.name.startswith("Name_"):
            continue
        n = int(ob.name.split("_")[1])
        dx, dy = WH_APPROACH.get(n, (0, 1))
        # A FONT rotated +90 deg about X stands in the XZ plane with its normal
        # facing -Y; rotating by atan2(dx, -dy) about Z swings that normal onto
        # the approach direction, so the text faces the camera head-on.
        ob.rotation_euler = (math.pi / 2, 0.0, math.atan2(dx, -dy))
        base = bpy.data.objects.get("Pedestal_%02d" % n)
        if base:
            bx, by, bz = base.location
            # 1.28 / 0.48 = the original 0.8 / 0.30 offsets x 1.6, matching the
            # 2026-09-06 rescale of the whole complex. data.size stays 0.22
            # because every Name_NN object already carries scale 1.6, so the
            # placard still renders at 0.352 in world units.
            ob.location = (bx + dx * 1.28, by + dy * 1.28, bz + 0.48)
        # 0.16 x the object's own 1.6 scale = 0.256 world units. Was 0.22 when
        # the house was at true scale; after the x1.6 rescale that read as a
        # 3.4 m banner across the room, so the placard was pulled back down.
        ob.data.size = 0.16
        ob.data.align_y = "CENTER"
    print("white-house: nameplates stood up, flat labels dropped")


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

    if scene_id == "the-white-house":
        fix_white_house_labels_for_export()

    drop_render_only(scene_id)
    drop_collections(scene_id)

    for i, (x, y, z) in enumerate(SCENES[scene_id], start=1):
        empty = bpy.data.objects.new("Locus_%02d" % i, None)
        empty.empty_display_type = "PLAIN_AXES"
        empty.empty_display_size = 0.3
        empty.location = (x, y, z)
        bpy.context.scene.collection.objects.link(empty)

    merge_by_material(scene_id)

    out = os.path.join(REPO, "models", scene_id + ".glb")
    bpy.ops.export_scene.gltf(
        filepath=out, export_format="GLB", use_selection=False,
        export_apply=True, export_yup=True,
        **export_kwargs,
    )
    print("wrote", out)


main()
