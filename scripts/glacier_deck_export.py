"""Export-time preparation for the `glacier-deck` scene.

Source: blender_models/GlacierDeck.blend, authored live through Blender MCP by
blender_models/scenegen_glacierdeck/ (gd_*.py). A timber meditation deck on a
cobbled promontory at sunset, a gnarled pine leaning over it, and a crevassed
glacier 200 m below running out to a snow range. Recreated from a reference
photograph: the camera projection was solved first and the deck corners,
cushions and lantern back-projected from the photo, so the hero framing matches
the source image.

This scene has no loci: it is a place to be in rather than a sequence to be
walked, so nothing is baked into the .blend and nothing is injected by
build_glb.py. src/scenes/glacier-deck.js ships `loci: []` and the viewer drops
its transport bar. Blender +Y runs out over the glacier, which becomes
three.js -Z.

The recentring below is kept even without loci: it puts the deck on the origin,
which is what makes `startView` and any future locus rig readable.

Sibling scene: [[meditation-ledge]] is the same idea at dawn above a cloud sea.
This one is deliberately a different room -- sunset instead of dawn, ice
instead of cloud, a cobbled approach and a shelf of cairns instead of a gate
and a basin.

What this module does, in memory only (the .blend is never saved):

  * drops the Blender-only rig: the two suns, the lantern point light, the hero
    camera, the 9 km emissive cloud dome and the ValleyMist volume box (glTF
    cannot carry volumetrics -- it would ship as a 6 km opaque cube);

  * COMPRESSES DEPTH. The landscape is authored at true scale and runs to 16 km;
    the viewer's camera far plane is 2000, so the whole mountain range would be
    clipped away. Every vertex is scaled radially about the hero camera's eye
    point -- p' = eye + (p - eye) * s, with |p'-eye| = A*(d/A)^0.42 beyond
    A = 140 m. A radial scale about the eye is exactly the transform that leaves
    the hero view unchanged, so the peaks keep their angular size and their
    depth order while landing inside 1.1 km. Anything nearer than A is untouched,
    so the deck and its props keep true scale and true parallax;

  * recentres the deck on the origin (it is authored at Blender x -0.26, y 3.25),
    so the scene's own centre is the world's;

  * bakes colour into vertices. The whole scene is procedural: terrain colour
    already lives in a POINT attribute named `fvar`, and everything else is
    Noise/ColorRamp node trees that glTF cannot carry. `fvar` is renamed to
    `Col`; every other material is reduced to one flat colour and written to a
    `Col` attribute with a per-vertex tint from a position hash, so planks,
    bark and needles keep some variation instead of going plastic-flat. Every
    material then becomes Principled + Color Attribute, and build_glb exports
    with export_vertex_color="ACTIVE";

  * prefixes the distant landscape meshes with ROOF_ so the viewer skips
    castShadow on them -- a 1 km mesh in the shadow pass buys nothing and costs
    the whole shadow map's resolution.
"""
import bpy, math

EYE = (0.35, -12.0, 7.35)      # the hero camera's eye, the centre of compression
DECK_CX, DECK_CY = -0.26, 3.25  # deck centre in the .blend, moved to the origin
NEAR = 140.0                    # everything closer than this keeps true scale
POW = 0.42                      # d' = NEAR * (d/NEAR) ** POW beyond that

DROP_OBJECTS = ("CloudDome", "ValleyMist", "SceneCam", "SunsetSun", "SkyFill",
                "LanternLight")
NO_SHADOW = ("FarLand", "River", "LeftSpur")

# material -> (sRGB hex, roughness, metallic, emission strength)
FLAT = {
    "WoodDeck":    ("#7a6a52", 0.70, 0.0, 0.0),
    "WoodRail":    ("#5c4f3c", 0.72, 0.0, 0.0),
    "WoodBeam":    ("#453a2b", 0.80, 0.0, 0.0),
    "WoodShelf":   ("#5d4c37", 0.70, 0.0, 0.0),
    "WoodTray":    ("#4c3f2c", 0.72, 0.0, 0.0),
    "BarkPine":    ("#392e21", 0.90, 0.0, 0.0),
    "NeedlesHero": ("#3b5026", 0.82, 0.0, 0.0),
    "NeedlesBg":   ("#2c3c20", 0.86, 0.0, 0.0),
    "ShrubLeaf":   ("#35451f", 0.88, 0.0, 0.0),
    "PropStone":   ("#5f5d57", 0.84, 0.0, 0.0),
    "PropStone2":  ("#5f5c55", 0.86, 0.0, 0.0),
    "Terracotta":  ("#7a4a33", 0.78, 0.0, 0.0),
    "PotGlaze":    ("#3c4046", 0.45, 0.0, 0.0),
    "Foliage":     ("#2c3a22", 0.74, 0.0, 0.0),
    "Bark":        ("#3a2e22", 0.90, 0.0, 0.0),
    "Cushion":     ("#b9a888", 0.94, 0.0, 0.0),
    "Cushion2":    ("#9a8b6e", 0.94, 0.0, 0.0),
    "LampMetal":   ("#2a2521", 0.42, 0.85, 0.0),
    "Brass":       ("#8a6a34", 0.32, 0.90, 0.0),
    "MatRiver":    ("#8496a6", 0.16, 0.0, 0.0),
    "LanternGlow": ("#ffb14a", 0.40, 0.0, 6.0),
}


def _srgb(h):
    h = h.lstrip("#")
    f = lambda x: x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    return tuple(f(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4))


def _drop_rig():
    n = 0
    for name in DROP_OBJECTS:
        ob = bpy.data.objects.get(name)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)
            n += 1
    for ob in list(bpy.data.objects):
        if ob.type in ("CAMERA", "LIGHT"):
            bpy.data.objects.remove(ob, do_unlink=True)
            n += 1
    print("glacier-deck: dropped %d rig objects" % n)


def _bake_transforms():
    """Fold each object's matrix_world into its mesh so later maths is world-space."""
    import numpy as np
    from mathutils import Matrix
    for ob in [o for o in bpy.data.objects if o.type == "MESH"]:
        mw = ob.matrix_world.copy()
        if mw == Matrix.Identity(4):
            continue
        ob.data.transform(mw)
        ob.matrix_world = Matrix.Identity(4)


def _compress_and_recentre():
    """Radial depth compression about the eye, then move the deck to the origin."""
    import numpy as np

    ex, ey, ez = EYE

    def squash(co):
        d = np.sqrt(((co - np.array(EYE)) ** 2).sum(axis=1))
        s = np.ones_like(d)
        far = d > NEAR
        s[far] = NEAR * (d[far] / NEAR) ** POW / d[far]
        return np.array(EYE)[None, :] + (co - np.array(EYE)[None, :]) * s[:, None]

    for ob in [o for o in bpy.data.objects if o.type == "MESH"]:
        me = ob.data
        n = len(me.vertices)
        co = np.empty(n * 3, dtype=np.float64)
        me.vertices.foreach_get("co", co)
        co = squash(co.reshape(n, 3))
        co[:, 0] -= DECK_CX
        co[:, 1] -= DECK_CY
        me.vertices.foreach_set("co", co.ravel())
        me.update()

    for ob in [o for o in bpy.data.objects if o.type == "EMPTY"]:
        p = np.array([[ob.location.x, ob.location.y, ob.location.z]], dtype=np.float64)
        p = squash(p)[0]
        ob.location = (p[0] - DECK_CX, p[1] - DECK_CY, p[2])

    print("glacier-deck: depth compressed about the eye, deck recentred")


def _hash_tint(co):
    """Cheap deterministic per-vertex variation from position."""
    import numpy as np
    s = (np.sin(co[:, 0] * 12.9898 + co[:, 1] * 78.233 + co[:, 2] * 37.719) * 43758.5453)
    return s - np.floor(s)


def _vertex_colours():
    """Every mesh ends up with a POINT colour attribute named `Col`."""
    import numpy as np

    for ob in [o for o in bpy.data.objects if o.type == "MESH"]:
        me = ob.data
        n = len(me.vertices)
        if n == 0:
            continue
        existing = me.color_attributes.get("fvar")
        if existing is not None:
            rgba = np.empty(n * 4, dtype=np.float32)
            existing.data.foreach_get("color", rgba)
        else:
            mat = me.materials[0] if me.materials else None
            key = mat.name if mat else ""
            hexc, _r, _m, _e = FLAT.get(key, ("#8a8a8a", 0.8, 0.0, 0.0))
            base = np.array(_srgb(hexc), dtype=np.float32)
            co = np.empty(n * 3, dtype=np.float64)
            me.vertices.foreach_get("co", co)
            tint = (0.84 + 0.32 * _hash_tint(co.reshape(n, 3))).astype(np.float32)
            rgb = np.clip(base[None, :] * tint[:, None], 0.0, 1.0)
            rgba = np.concatenate([rgb, np.ones((n, 1), dtype=np.float32)], axis=1).ravel()

        for a in list(me.color_attributes):
            me.color_attributes.remove(a)
        attr = me.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")
        attr.data.foreach_set("color", rgba)
        me.color_attributes.active_color = attr
        try:
            me.attributes.default_color_name = "Col"
            me.attributes.active_color_name = "Col"
        except Exception:
            pass


def _flatten_materials():
    for m in list(bpy.data.materials):
        if not m.use_nodes:
            m.use_nodes = True
        hexc, rough, metal, emit = FLAT.get(m.name, (None, 0.80, 0.0, 0.0))
        nt = m.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        p = nt.nodes.new("ShaderNodeBsdfPrincipled")
        p.inputs["Roughness"].default_value = rough
        p.inputs["Metallic"].default_value = metal
        ca = nt.nodes.new("ShaderNodeVertexColor")
        ca.layer_name = "Col"
        nt.links.new(ca.outputs["Color"], p.inputs["Base Color"])
        if emit > 0:
            try:
                p.inputs["Emission Color"].default_value = _srgb(hexc) + (1.0,)
                p.inputs["Emission Strength"].default_value = emit
            except KeyError:
                p.inputs["Emission"].default_value = _srgb(hexc) + (1.0,)
        nt.links.new(p.outputs["BSDF"], out.inputs["Surface"])
    print("glacier-deck: %d materials flattened to Principled + Color Attribute"
          % len(bpy.data.materials))


def _tag_no_shadow():
    for name in NO_SHADOW:
        ob = bpy.data.objects.get(name)
        if ob and not ob.name.startswith("ROOF_"):
            ob.name = "ROOF_" + name


def report_loci():
    """Print the final locus positions in three.js space, for src/scenes/glacier-deck.js."""
    rows = []
    for ob in sorted([o for o in bpy.data.objects if o.name.startswith("Locus_")],
                     key=lambda o: o.name):
        x, y, z = ob.location
        rows.append((ob.name, round(x, 2), round(z, 2), round(-y, 2)))
    for name, tx, ty, tz in rows:
        d = math.hypot(tx, tz)
        print("%-22s three=[%8.2f,%8.2f,%9.2f]  dist=%8.2f" % (name, tx, ty, tz, d))
    return rows


def prepare():
    _drop_rig()
    _bake_transforms()
    _compress_and_recentre()
    _vertex_colours()
    _flatten_materials()
    _tag_no_shadow()
    report_loci()
