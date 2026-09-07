import bpy, os

BLEND = r"C:\Users\ASUS\Desktop\Loc\blender\blender_models\WisdomVillage.blend"
REPO = r"C:\Users\ASUS\Desktop\Loc\memory_os"
OUT_GLB = os.path.join(REPO, "models", "wisdom-village.glb")

bpy.ops.wm.open_mainfile(filepath=BLEND)
scene = bpy.context.scene
ROOT = scene.collection

# remove any pre-existing Loci collection (idempotent)
existing = bpy.data.collections.get("Loci")
if existing:
    for o in list(existing.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.collections.remove(existing)

loci_coll = bpy.data.collections.new("Loci")
ROOT.children.link(loci_coll)

LOCI = [
    ("Locus_01", "Gate",       (-9.5, -15.0, 3.2), "The Village of the Sages gate."),
    ("Locus_02", "Plaza",      (0.0, -5.0, 5.5),   "The stepped plaza and the sage statue."),
    ("Locus_03", "Khoa hoc",   (-12.0, 3.0, 8.5),  "Science lodge."),
    ("Locus_04", "Dao duc",    (13.0, -7.0, 6.5),  "Ethics hall."),
    ("Locus_05", "Van hoc",    (5.5, 7.0, 11.5),   "Literature manor."),
    ("Locus_06", "Nghe thuat", (17.0, 2.0, 9.0),   "Art gallery."),
    ("Locus_07", "Triet hoc",  (-2.0, 11.0, 14.5), "Philosophy temple, summit."),
]

for name, label, loc, desc in LOCI:
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 1.2
    e.location = loc
    loci_coll.objects.link(e)

bpy.ops.wm.save_as_mainfile(filepath=BLEND)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB",
                           use_selection=False, export_apply=True, export_yup=True)
print("LOCI_RESULT", [l[0] for l in LOCI], "GLB", OUT_GLB)
