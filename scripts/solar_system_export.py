"""Export-time preparation for the `solar-system` scene.

SolarSystem.blend shades every body with procedural node graphs -- noise,
voronoi, sine-banded latitude in normalised object space. glTF carries none of
that, so exported as-is each planet arrives in the viewer as one flat colour.

This module bakes each body's albedo to an image and swaps in a plain
Principled material pointing at it. The bake is an EMIT bake of whatever feeds
the shader's colour socket: that returns pure albedo with no lighting, behaves
identically for the Sun's Emission shader, and sidesteps the diffuse-pass
quirks. Bodies without UVs (the two belts, built from raw pydata) can't be
baked, so they get a flat colour instead -- they are sub-pixel specks anyway.

The rings are a special case twice over: their annuli have no UVs, and their
opacity pattern (Cassini Division, Uranus' separated strands) lives in an alpha
ramp that a colour bake would throw away. So they get a generated radial UV map
plus an RGBA texture computed in Python from the same ramp stops the .blend
uses.

Imported and called from build_glb.py; never touches the source .blend.
"""
import bpy
import math

# --- radial ring profiles, mirroring the ramps in SolarSystem.blend ----------
SATURN_COLOR = [(0.00, (0.42, 0.36, 0.28)), (0.22, (0.80, 0.72, 0.55)),
                (0.55, (0.95, 0.90, 0.76)), (0.70, (0.55, 0.48, 0.36)),
                (0.78, (0.92, 0.86, 0.70)), (1.00, (0.70, 0.62, 0.48))]
SATURN_ALPHA = [(0.00, 0.05), (0.12, 0.55), (0.55, 0.92), (0.66, 0.10),
                (0.72, 0.85), (0.97, 0.45), (1.00, 0.00)]
URANUS_COLOR = [(0.00, (0.22, 0.24, 0.26)), (0.50, (0.38, 0.42, 0.45)),
                (1.00, (0.25, 0.28, 0.30))]
URANUS_ALPHA = [(0.00, 0.00), (0.18, 0.55), (0.30, 0.05), (0.55, 0.60),
                (0.68, 0.05), (0.86, 0.70), (1.00, 0.00)]

# object -> baked texture resolution. Big, close-up bodies get more pixels.
BAKE_SIZES = {
    "Sun": 1024, "Jupiter": 2048, "Saturn": 1024, "Uranus": 512,
    "Neptune": 512, "Earth": 1024, "Venus": 512, "Mars": 512, "Mercury": 512,
}
DEFAULT_BAKE = 256

# no UVs (built with from_pydata) -- flat colour instead of a bake
FLAT_COLOR = {
    "Asteroid_Belt": (0.115, 0.105, 0.095),
    "Kuiper_Belt": (0.200, 0.220, 0.260),
}

# Blender-only rigging that has no business in a walkthrough.
DROP_OBJECTS = (
    "Cam_Overview", "Cam_Inner_System", "Cam_Earth", "Cam_Jupiter",
    "Cam_Saturn", "Cam_Uranus", "Overview_Target",
    "SunLight_Inner", "SunLight_Mid", "SunLight_Outer",
    # a Fresnel-driven transparent shell: meaningless once the node graph is
    # gone, and it would sit as a grey bubble over the Sun
    "Sun_Glow",
    # folded into the Earth albedo instead (see fold_clouds_into_earth)
    "Earth_Clouds",
)


def _ramp(stops, t):
    if t <= stops[0][0]:
        return stops[0][1]
    for (p0, v0), (p1, v1) in zip(stops, stops[1:]):
        if t <= p1:
            f = 0.0 if p1 == p0 else (t - p0) / (p1 - p0)
            if isinstance(v0, tuple):
                return tuple(a + (b - a) * f for a, b in zip(v0, v1))
            return v0 + (v1 - v0) * f
    return stops[-1][1]


def _striation(t, seed):
    """Deterministic fine banding across the ring, no RNG so re-exports match."""
    s = 0.0
    for k, amp in ((131.0, 0.55), (317.0, 0.28), (713.0, 0.17)):
        s += amp * math.sin(t * k + seed * k * 0.013)
    return 0.78 + 0.22 * (0.5 + 0.5 * s / 1.0)


def ring_uv(ob):
    """Radial UV for a pydata annulus: verts alternate inner, outer, inner..."""
    me = ob.data
    uv = me.uv_layers.get("UVMap") or me.uv_layers.new(name="UVMap")
    segs = len(me.vertices) // 2
    for poly in me.polygons:
        for li in poly.loop_indices:
            vi = me.loops[li].vertex_index
            u = 0.005 if vi % 2 == 0 else 0.995
            v = ((vi // 2) % segs) / float(segs)
            uv.data[li].uv = (u, v)


def ring_texture(name, color_stops, alpha_stops, width=1024, seed=3.0):
    img = bpy.data.images.new(name, width, 8, alpha=True)
    px = [0.0] * (width * 8 * 4)
    row = []
    for i in range(width):
        t = i / float(width - 1)
        r, g, b = _ramp(color_stops, t)
        a = _ramp(alpha_stops, t) * _striation(t, seed)
        row.extend((r, g, b, max(0.0, min(1.0, a))))
    for y in range(8):
        px[y * width * 4:(y + 1) * width * 4] = row
    img.pixels = px
    img.pack()
    return img


def _colour_source(mat):
    """(socket_feeding_the_colour, constant_fallback) for a body's shader."""
    nt = mat.node_tree
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    if not out.inputs["Surface"].links:
        return None, (1, 1, 1, 1)
    surf = out.inputs["Surface"].links[0].from_node
    key = {"BSDF_PRINCIPLED": "Base Color", "EMISSION": "Color"}.get(surf.type)
    if not key or key not in surf.inputs:
        return None, (1, 1, 1, 1)
    inp = surf.inputs[key]
    if inp.links:
        return inp.links[0].from_socket, tuple(inp.default_value)
    return None, tuple(inp.default_value)


def fold_clouds_into_earth():
    """Earth's clouds live on their own alpha-blended shell, which bakes badly.
    Mix an equivalent cloud layer straight into the Earth albedo instead."""
    mat = bpy.data.materials.get("MAT_Earth")
    if not mat:
        return
    nt = mat.node_tree
    N, L = nt.nodes.new, nt.links.new
    src, _ = _colour_source(mat)
    if src is None:
        return
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    # reuse the material's own normalised object coords
    scale_nodes = [n for n in nt.nodes
                   if n.type == "VECT_MATH" and n.operation == "SCALE"]
    if not scale_nodes:
        return
    co = scale_nodes[0].outputs["Vector"]
    nz = N("ShaderNodeTexNoise")
    nz.location = (-600, 700)
    nz.inputs["Scale"].default_value = 5.5
    nz.inputs["Detail"].default_value = 12.0
    L(co, nz.inputs["Vector"])
    rp = N("ShaderNodeValToRGB")
    rp.location = (-400, 700)
    rp.color_ramp.elements[0].position = 0.50
    rp.color_ramp.elements[1].position = 0.68
    L(nz.outputs["Fac"], rp.inputs["Fac"])
    mix = N("ShaderNodeMixRGB")
    mix.location = (-160, 700)
    L(rp.outputs["Color"], mix.inputs[0])
    L(src, mix.inputs[1])
    mix.inputs[2].default_value = (0.94, 0.95, 0.97, 1.0)
    L(mix.outputs["Color"], bsdf.inputs["Base Color"])


def _use_cycles():
    scn = bpy.context.scene
    scn.render.engine = "CYCLES"
    try:
        scn.cycles.device = "CPU"
        scn.cycles.samples = 1
        scn.cycles.use_denoising = False
    except Exception:
        pass
    scn.render.bake.margin = 6
    scn.render.bake.use_clear = True


def bake_albedo(ob, size):
    """EMIT-bake whatever drives the colour socket into an image texture."""
    if not ob.data.materials or ob.data.materials[0] is None:
        return None
    if not ob.data.uv_layers:
        return None
    mat = ob.data.materials[0]
    nt = mat.node_tree
    src, const = _colour_source(mat)
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    em = nt.nodes.new("ShaderNodeEmission")
    em.location = (out.location.x - 200, out.location.y - 300)
    if src is not None:
        nt.links.new(src, em.inputs["Color"])
    else:
        em.inputs["Color"].default_value = const
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])

    img = bpy.data.images.new("%s_albedo" % ob.name, size, size)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    nt.nodes.active = tex

    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.bake(type="EMIT")
    img.pack()
    return img


def _flat_material(name, rgb, roughness=0.9):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = tuple(rgb) + (1.0,)
    b.inputs["Roughness"].default_value = roughness
    return m


def _textured_material(name, img, roughness=0.85, emissive=False, alpha=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.location = (-400, 0)
    b.inputs["Roughness"].default_value = roughness
    if emissive:
        b.inputs["Base Color"].default_value = (0, 0, 0, 1)
        if "Emission Color" in b.inputs:
            nt.links.new(tex.outputs["Color"], b.inputs["Emission Color"])
            b.inputs["Emission Strength"].default_value = 1.0
        else:
            nt.links.new(tex.outputs["Color"], b.inputs["Emission"])
    else:
        nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    if alpha:
        nt.links.new(tex.outputs["Alpha"], b.inputs["Alpha"])
        for attr, val in (("blend_method", "BLEND"),
                          ("surface_render_method", "BLENDED")):
            try:
                setattr(m, attr, val)
            except Exception:
                pass
        m.use_backface_culling = False
    return m


def rebuild_orbit_materials():
    """Orbit paths are pure Emission shaders; give glTF something to carry."""
    for mat in list(bpy.data.materials):
        if not mat.name.startswith("MAT_Orbit_") or not mat.use_nodes:
            continue
        em = next((n for n in mat.node_tree.nodes if n.type == "EMISSION"), None)
        if em is None:
            continue
        col = tuple(em.inputs["Color"].default_value)[:3]
        strength = em.inputs["Strength"].default_value
        nt = mat.node_tree
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        b = nt.nodes.new("ShaderNodeBsdfPrincipled")
        b.inputs["Base Color"].default_value = tuple(c * 0.25 for c in col) + (1,)
        b.inputs["Roughness"].default_value = 1.0
        if "Emission Color" in b.inputs:
            b.inputs["Emission Color"].default_value = tuple(col) + (1,)
            b.inputs["Emission Strength"].default_value = max(1.0, strength * 2.0)
        nt.links.new(b.outputs["BSDF"], out.inputs["Surface"])


def prepare():
    for name in DROP_OBJECTS:
        ob = bpy.data.objects.get(name)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)

    fold_clouds_into_earth()
    _use_cycles()

    # rings first: generated UV + generated RGBA, no bake needed
    for obname, matname, cstops, astops, seed in (
        ("Saturn_Rings", "Saturn_Rings_Tex", SATURN_COLOR, SATURN_ALPHA, 3.0),
        ("Uranus_Rings", "Uranus_Rings_Tex", URANUS_COLOR, URANUS_ALPHA, 11.0),
    ):
        ob = bpy.data.objects.get(obname)
        if not ob:
            continue
        ring_uv(ob)
        img = ring_texture(matname, cstops, astops, seed=seed)
        ob.data.materials[0] = _textured_material(
            "MAT_%s_baked" % obname, img, roughness=0.9, alpha=True)

    for obname, rgb in FLAT_COLOR.items():
        ob = bpy.data.objects.get(obname)
        if ob and ob.data.materials:
            ob.data.materials[0] = _flat_material("MAT_%s_flat" % obname, rgb)

    baked, skipped = [], []
    for ob in [o for o in bpy.data.objects if o.type == "MESH"]:
        if ob.name in FLAT_COLOR or ob.name.endswith("_Rings"):
            continue
        size = BAKE_SIZES.get(ob.name, DEFAULT_BAKE)
        img = bake_albedo(ob, size)
        if img is None:
            skipped.append(ob.name)
            continue
        ob.data.materials[0] = _textured_material(
            "MAT_%s_baked" % ob.name, img,
            roughness=0.9 if ob.name != "Sun" else 1.0,
            emissive=(ob.name == "Sun"))
        baked.append("%s@%d" % (ob.name, size))

    rebuild_orbit_materials()
    print("solar-system: baked", len(baked), "->", ", ".join(baked))
    if skipped:
        print("solar-system: no UVs, left flat:", ", ".join(skipped))
