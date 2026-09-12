"""future-city export prep.

FutureCity.blend is authored at true scale from a solved camera: 1 unit = 1 m,
the lens is 24.6 mm on a 36 mm sensor, the eye is 90 m above the water with
4.2 deg of down-pitch, and every landmark in the reference illustration was
back-projected from its pixel position into world coordinates. That leaves a
scene ~30 km across (the ocean disc, the mountain bands at 6-11 km, the moon at
90 km) against a viewer far plane of 2000.

So the whole scene is compressed RADIALLY ABOUT THE HERO EYE, not scaled:

    r' = R0 + (RMAX - R0) * tanh((r - R0) / K)      (r = horizontal radius)

with the vertical offset from the eye scaled by the same factor. Angular size
from the opening viewpoint is therefore preserved exactly - the hero frame is
untouched - while 30 km of world folds into a 1.9 km disc. Everything inside
R0 = 700 m (the terrace, the river, the bridges, the monorail, the dome) is
left alone entirely; the tower cluster at 1.15 km moves in by about 10%.

Two other things have to happen before glTF can carry this scene:

  * SkyHalo is dropped. It is the sun's glow - camera-facing billboards at
    30 km carrying emission values up to 26x, which are meaningless once you
    can walk around them and would clamp to white discs anyway.
  * Every material here paints per-face colour through a 'fvar' CORNER colour
    attribute multiplied into Base Color by a VectorMath node. glTF cannot
    carry that graph, so each material is rewritten to feed the attribute
    straight into Base Color and the attribute is made the active colour layer;
    build_glb.py exports with export_vertex_color='ACTIVE'.

The Locus_01..12 empties (collection Loci) are baked into the source .blend by
blender_models/futurecity_scenegen/build_city.py and are moved by the same
compression, so src/scenes/future-city.js's fallback positions match the glb.
"""
import bpy, math, mathutils

R0 = 700.0
RMAX = 1900.0
K = 1600.0
EYE_Z = 90.0

DROP_OBJECTS = ("SkyHalo",)
GLOW_MATERIALS = {"M_Emit", "M_EmitSoft", "M_Holo"}
# The moon is a camera-facing billboard 90 km out, sized for the hero frame.
# In a still it is the picture's moon; in a scene you can fly around it is a
# grey coin hanging in the sky, so its faces come out of Backdrop here.
MOON_MIN_RADIUS = 40000.0


def _factor(x, y):
    r = math.hypot(x, y)
    if r <= R0:
        return 1.0
    return (R0 + (RMAX - R0) * math.tanh((r - R0) / K)) / r


def _squeeze(v):
    """Scale the whole vector by the horizontal factor, height included.

    Anchoring the vertical scale on the EYE instead (z' = eye + (z-eye)*f) puts
    the horizon of the compressed world exactly where the hero camera had it,
    which is tempting - but it lifts the far sea into a bowl rising to eye
    height, and this scene is walkable, so from any other viewpoint you are
    looking at a wall of water. Scaling about the water plane keeps the sea
    dead flat and costs only that the shoreline sits a little lower in the
    opening frame than it did in the Blender render.
    """
    f = _factor(v.x, v.y)
    if f == 1.0:
        return v
    return mathutils.Vector((v.x * f, v.y * f, v.z * f))


def _drop():
    n = 0
    for name in DROP_OBJECTS:
        ob = bpy.data.objects.get(name)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)
            n += 1
    return n


def _drop_moon():
    import bmesh
    ob = bpy.data.objects.get("Backdrop")
    if not ob:
        return 0
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    doomed = [f for f in bm.faces
              if math.hypot(f.calc_center_median().x, f.calc_center_median().y)
              > MOON_MIN_RADIUS]
    n = len(doomed)
    bmesh.ops.delete(bm, geom=doomed, context='FACES')
    bm.to_mesh(ob.data)
    bm.free()
    ob.data.update()
    return n


def _compress():
    meshes, empties = 0, 0
    for ob in list(bpy.data.objects):
        if ob.type == 'MESH' and ob.data:
            mw = ob.matrix_world.copy()
            for v in ob.data.vertices:
                v.co = _squeeze(mw @ v.co)
            ob.matrix_world = mathutils.Matrix.Identity(4)
            ob.data.update()
            meshes += 1
        elif ob.type == 'EMPTY':
            ob.location = _squeeze(ob.matrix_world.translation)
            empties += 1
    return meshes, empties


def _flatten_materials():
    """fvar attribute -> Base Color, straight, with no maths in between."""
    done = 0
    for mat in list(bpy.data.materials):
        if not mat.use_nodes:
            continue
        nt = mat.node_tree
        if not any(n.type == 'ATTRIBUTE' and n.attribute_name == 'fvar'
                   for n in nt.nodes):
            continue
        rough = 0.62
        for n in nt.nodes:
            if n.type == 'BSDF_PRINCIPLED' and 'Roughness' in n.inputs:
                rough = n.inputs['Roughness'].default_value
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        out = nt.nodes.new('ShaderNodeOutputMaterial'); out.location = (400, 0)
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled'); bsdf.location = (140, 0)
        attr = nt.nodes.new('ShaderNodeAttribute'); attr.location = (-200, 0)
        attr.attribute_name = 'fvar'
        nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
        if 'Roughness' in bsdf.inputs:
            bsdf.inputs['Roughness'].default_value = rough
        if 'Metallic' in bsdf.inputs:
            bsdf.inputs['Metallic'].default_value = 0.0
        if mat.name in GLOW_MATERIALS:
            for key in ('Emission Color', 'Emission'):
                if key in bsdf.inputs:
                    bsdf.inputs[key].default_value = (0.36, 0.78, 0.92, 1.0)
                    break
            if 'Emission Strength' in bsdf.inputs:
                bsdf.inputs['Emission Strength'].default_value = 0.55
        nt.links.new(bsdf.outputs[0], out.inputs[0])
        for setter in (lambda: setattr(mat, 'blend_method', 'OPAQUE'),
                       lambda: setattr(mat, 'surface_render_method', 'DITHERED')):
            try:
                setter()
            except Exception:
                pass
        done += 1
    return done


def _activate_colours():
    """Make 'fvar' the active/render colour layer and clamp it to 0..1."""
    n = 0
    for me in bpy.data.meshes:
        ca = me.color_attributes.get('fvar')
        if ca is None:
            continue
        for d in ca.data:
            c = d.color
            d.color = (min(1.0, max(0.0, c[0])), min(1.0, max(0.0, c[1])),
                       min(1.0, max(0.0, c[2])), min(1.0, max(0.0, c[3])))
        idx = list(me.color_attributes).index(ca)
        for attr in ('active_color_index', 'render_color_index'):
            try:
                setattr(me.color_attributes, attr, idx)
            except Exception:
                pass
        try:
            me.attributes.active_color_index = me.attributes.find('fvar')
        except Exception:
            pass
        n += 1
    return n


def prepare():
    dropped = _drop()
    moon = _drop_moon()
    mats = _flatten_materials()
    cols = _activate_colours()
    meshes, empties = _compress()
    print("future-city: dropped %d objects + %d moon faces, flattened %d "
          "materials, %d colour layers, compressed %d meshes / %d empties "
          "(R0=%g RMAX=%g K=%g)"
          % (dropped, moon, mats, cols, meshes, empties, R0, RMAX, K))
