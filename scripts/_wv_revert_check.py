import bpy
BLEND = r"C:\Users\ASUS\Desktop\Loc\blender\blender_models\WisdomVillage.blend"
OUT = r"C:\Users\ASUS\Desktop\Loc\blender\blender_models\WV_revert_check.png"
bpy.ops.wm.open_mainfile(filepath=BLEND)
scene = bpy.context.scene
scene.render.resolution_x = 1200
scene.render.resolution_y = 700
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("REVERT_CHECK_DONE")
