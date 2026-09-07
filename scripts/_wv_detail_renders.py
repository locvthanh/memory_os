import bpy, math

BLEND = r"C:\Users\ASUS\Desktop\Loc\blender\blender_models\WisdomVillage.blend"
OUT1 = r"C:\Users\ASUS\Desktop\Loc\blender\blender_models\WV_gate_detail.png"
OUT2 = r"C:\Users\ASUS\Desktop\Loc\blender\blender_models\WV_temple_detail.png"

bpy.ops.wm.open_mainfile(filepath=BLEND)
scene = bpy.context.scene
cam = scene.camera
orig_loc = tuple(cam.location)
orig_rot = tuple(cam.rotation_euler)
orig_lens = cam.data.lens

scene.render.resolution_x = 1200
scene.render.resolution_y = 900

# close on the gate signboard + banners
cam.location = (-9.5, -22.0, 8.5)
cam.rotation_euler = (math.radians(78), 0, 0)
cam.data.lens = 40
scene.render.filepath = OUT1
bpy.ops.render.render(write_still=True)

# close on the temple pediment + sign
cam.location = (-2.0, -2.0, 14.0)
cam.rotation_euler = (math.radians(70), 0, 0)
cam.data.lens = 40
scene.render.filepath = OUT2
bpy.ops.render.render(write_still=True)

# restore hero camera + resolution, do NOT overwrite the saved file
cam.location = orig_loc
cam.rotation_euler = orig_rot
cam.data.lens = orig_lens
print("DETAIL_RENDERS_DONE")
