import bpy, math, subprocess, os

BLEND = r"C:\Users\ASUS\Desktop\Loc\blender\blender_models\WisdomVillage.blend"
RENDER_OUT = r"C:\Users\ASUS\Desktop\Loc\blender\blender_models\WV_hero_render.png"

bpy.ops.wm.open_mainfile(filepath=BLEND)
scene = bpy.context.scene
cam = scene.camera
cam.location = (3.0, -58.0, 33.0)
cam.rotation_euler = (math.radians(61), 0, math.radians(4))
cam.data.lens = 36

scene.render.filepath = RENDER_OUT
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
result = {"cam_loc": tuple(cam.location), "lens": cam.data.lens}
print("CAMFIX_RESULT", result)
