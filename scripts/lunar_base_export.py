"""lunar-base export prep.

LunarBase.blend is authored at true scale: the regolith runs out to ~1.7 km so
the horizon is a real ridge line, and Earth sits 4 km away at radius 308 so its
angular size matches the reference photograph. The viewer's far plane is 2000,
so both have to come in before export.

  * Regolith_Far is compressed radially in XY beyond 300 m (a 1.7 km vertex
    lands at ~790), which leaves everything the hero camera sees untouched and
    keeps the ridge silhouette roughly where it was.
  * Earth is pulled from 4000 to 900 and scaled by the same factor, so its
    angular size from the lounge is unchanged.

Cameras, lights and the Loci empties are handled by build_glb.py; the empties
(Locus_01..10) are baked into the .blend by
blender_models/scenegen_lunar/build_lunar.py.
"""
import bpy, math

FAR_START = 300.0
FAR_SQUASH = 0.35
EARTH_FROM = 4000.0
EARTH_TO = 900.0


def _compress_far_terrain():
    ob = bpy.data.objects.get("Regolith_Far")
    if not ob:
        return 0
    n = 0
    for v in ob.data.vertices:
        r = math.hypot(v.co.x, v.co.y)
        if r > FAR_START:
            f = (FAR_START + (r - FAR_START) * FAR_SQUASH) / r
            v.co.x *= f
            v.co.y *= f
            n += 1
    ob.data.update()
    return n


def _pull_earth_in():
    ob = bpy.data.objects.get("Earth")
    if not ob:
        return None
    k = EARTH_TO / EARTH_FROM
    ob.location = tuple(c * k for c in ob.location)
    ob.scale = (k, k, k)
    return list(ob.location)


def prepare():
    n = _compress_far_terrain()
    loc = _pull_earth_in()
    print("lunar-base: compressed %d far-terrain verts; Earth -> %s" % (n, loc))
