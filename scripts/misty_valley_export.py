"""Export-time preparation for the `misty-valley` scene.

Source: blender_models/LOTR_MistyValley.blend, authored live through Blender
MCP. A Tolkien-flavoured original landscape (no film locations reproduced): a
river valley under a ridged mountain range, a ruined watchtower on a bluff, a
three-arch stone bridge, a ring of standing stones, pine woods and boulders.

Locus_01..08 are baked into the .blend (collection 09_Loci, Locus_NN_<key>), so
build_glb.py's SCENES entry is empty. Blender +Y runs north up the valley,
which becomes three.js -Z.

What this module does, in memory only (the .blend is never saved):
  * drops the Blender-only rig: the two suns, the hero camera and its track-to
    target, and the two mist volume boxes (glTF cannot carry volumetrics, and
    they would ship as giant opaque cubes);
  * bakes the terrain's procedural shader into a POINT colour attribute. The
    look of this scene lives entirely in a slope/altitude-driven node tree --
    grass on the flats, rock on anything steep or high, snow above ~300 m --
    and glTF cannot carry Noise/ColorRamp nodes, so the same rules are
    evaluated per vertex here against the DISPLACED surface (the four Displace
    modifiers that carve the cliffs) and written as vertex colour. The terrain
    material then becomes a plain Principled BSDF with Color Attribute wired
    into Base Color, and build_glb exports with export_vertex_color="ACTIVE".
    Vertex order survives Displace, so colours baked onto the base mesh land on
    the right vertices after export_apply;
  * flattens every other procedural material to a flat Principled colour;
  * joins the 1,370 instanced pines (one object each, one draw call each) into
    two meshes, bark and foliage;
  * pulls the river plane in to the terrain footprint -- at author size it is
    1.4 x 2.0 km and would stick out past the mountains as a blue apron.
"""
import bpy, math

DROP_OBJECTS = ("Sun", "SkyFill", "HeroCam", "CamTarget", "ValleyMist", "AirHaze")

# material -> (sRGB hex, roughness, metallic, alpha)
FLAT = {
    "M_Stone":   ("#7b786f", 0.85, 0.0, 1.0),
    "M_Rock":    ("#575249", 0.90, 0.0, 1.0),
    "M_Bark":    ("#4a3524", 0.95, 0.0, 1.0),
    "M_Foliage": ("#33552b", 0.88, 0.0, 1.0),
    "M_Water":   ("#4d7f92", 0.12, 0.0, 1.0),
}

# terrain palette, linear (what a colour attribute wants)
GRASS_LO = (0.032, 0.072, 0.020)
GRASS_HI = (0.135, 0.180, 0.050)
DRY      = (0.185, 0.152, 0.058)
ROCK_LO  = (0.062, 0.057, 0.050)
ROCK_HI  = (0.200, 0.178, 0.142)
SNOW     = (0.760, 0.800, 0.870)


def _srgb(h):
    h = h.lstrip("#")
    f = lambda x: x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    return tuple(f(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)


def _flatten(mat, hexcol, rough, metal, alpha):
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    p = nt.nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Base Color"].default_value = _srgb(hexcol)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if alpha < 1.0:
        p.inputs["Alpha"].default_value = alpha
        mat.blend_method = "BLEND"
    nt.links.new(p.outputs["BSDF"], out.inputs["Surface"])


def _drop_rig():
    for name in DROP_OBJECTS:
        ob = bpy.data.objects.get(name)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)
            print("dropped", name)


def _clamp01(v):
    return 0.0 if v < 0.0 else (1.0 if v > 1.0 else v)


def _bake_terrain_colours():
    """Evaluate the slope/altitude shader per vertex on the displaced surface."""
    import numpy as np

    terr = bpy.data.objects.get("Terrain")
    if not terr:
        return
    dg = bpy.context.evaluated_depsgraph_get()
    ev = terr.evaluated_get(dg)
    me_ev = ev.to_mesh()
    n = len(me_ev.vertices)
    co = np.empty(n * 3, dtype=np.float64)
    nor = np.empty(n * 3, dtype=np.float64)
    me_ev.vertices.foreach_get("co", co)
    me_ev.vertices.foreach_get("normal", nor)
    co = co.reshape(-1, 3)
    nor = nor.reshape(-1, 3)
    ev.to_mesh_clear()

    base = terr.data
    if len(base.vertices) != n:
        print("WARNING: displaced vertex count differs, skipping colour bake")
        return

    x, y, z = co[:, 0], co[:, 1], co[:, 2]
    slope = np.abs(nor[:, 2])

    def wobble(fx, fy, ph):
        return 0.5 + 0.5 * np.sin(x * fx + ph) * np.sin(y * fy - ph)

    nlo = 0.45 * wobble(0.0085, 0.0071, 0.0) + 0.35 * wobble(0.031, 0.027, 1.7) \
        + 0.20 * wobble(0.11, 0.09, 3.1)

    rockf = np.maximum(
        np.clip((0.88 - slope) / 0.28, 0, 1),                 # steep -> rock
        np.clip((z - 70.0) / 100.0, 0, 1),                    # high  -> rock
    )
    rockf = np.clip(rockf + (nlo - 0.5) * 0.30, 0, 1)
    snowf = np.clip((z - 300.0) / 105.0, 0, 1) \
        * np.clip((slope - 0.48) / 0.30, 0, 1)
    snowf = np.clip(snowf - (nlo - 0.5) * 0.55, 0, 1)
    dryf = np.clip((nlo - 0.62) / 0.25, 0, 1) * (1.0 - rockf)

    def lerp(a, b, t):
        t = t[:, None]
        return np.array(a)[None, :] * (1 - t) + np.array(b)[None, :] * t

    grass = lerp(GRASS_LO, GRASS_HI, nlo)
    grass = lerp(GRASS_LO, DRY, dryf) * 0.35 + grass * 0.65
    rock = lerp(ROCK_LO, ROCK_HI, np.clip(nlo * 1.15, 0, 1))
    col = grass * (1 - rockf)[:, None] + rock * rockf[:, None]
    col = col * (1 - snowf)[:, None] + np.array(SNOW)[None, :] * snowf[:, None]

    rgba = np.concatenate([col, np.ones((n, 1))], axis=1).astype(np.float32)

    for a in list(base.color_attributes):
        base.color_attributes.remove(a)
    attr = base.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")
    attr.data.foreach_set("color", rgba.ravel())
    base.color_attributes.active_color = attr
    try:
        base.attributes.default_color_name = "Col"
        base.attributes.active_color_name = "Col"
    except Exception:
        pass

    mat = bpy.data.materials.get("M_Terrain")
    if mat:
        nt = mat.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        p = nt.nodes.new("ShaderNodeBsdfPrincipled")
        p.inputs["Roughness"].default_value = 0.92
        ca = nt.nodes.new("ShaderNodeVertexColor")
        ca.layer_name = "Col"
        nt.links.new(ca.outputs["Color"], p.inputs["Base Color"])
        nt.links.new(p.outputs["BSDF"], out.inputs["Surface"])
    print("baked terrain vertex colours for %d verts" % n)


def _join_forest():
    """1,370 pine objects -> two meshes (bark, foliage)."""
    import bmesh
    coll = bpy.data.collections.get("Forest")
    if not coll:
        return
    trees = [ob for ob in coll.objects if ob.type == "MESH"]
    if not trees:
        return
    mats = list(trees[0].data.materials)
    bms = {i: bmesh.new() for i in range(max(1, len(mats)))}
    for ob in trees:
        src = bmesh.new()
        src.from_mesh(ob.data)
        src.transform(ob.matrix_world)
        for f in src.faces:
            bm = bms.get(f.material_index, bms[0])
            vs = [bm.verts.new(v.co) for v in f.verts]
            try:
                bm.faces.new(vs)
            except Exception:
                pass
        src.free()
    for ob in trees:
        bpy.data.objects.remove(ob, do_unlink=True)
    for i, bm in bms.items():
        bm.normal_update()
        name = "MERGED_" + (mats[i].name if i < len(mats) and mats[i] else "Pine")
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        if i < len(mats) and mats[i]:
            me.materials.append(mats[i])
        new = bpy.data.objects.new(name, me)
        coll.objects.link(new)
    print("joined %d pines into %d meshes" % (len(trees), len(bms)))


def _trim_water():
    ob = bpy.data.objects.get("River")
    if not ob:
        return
    ob.scale = (0.67, 0.58, 1.0)
    ob.location = (0.0, 385.0, ob.location.z)


def _flatten_materials():
    for name, spec in FLAT.items():
        mat = bpy.data.materials.get(name)
        if mat and mat.use_nodes:
            _flatten(mat, *spec)
            print("flattened", name)


def prepare():
    _drop_rig()
    _flatten_materials()
    _bake_terrain_colours()
    _join_forest()
    _trim_water()
