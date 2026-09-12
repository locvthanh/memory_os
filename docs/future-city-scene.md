# Future City — "the terrace above the river"

> Save-location convention: the Blender source lives at
> `C:\Users\ASUS\Desktop\Loc\blender\blender_models\FutureCity.blend`, never the
> Desktop root. Its generator lives beside it in
> `blender_models\futurecity_scenegen\`. The web app is the separate
> `memory_os` repo.

Scene id `future-city`, title **Future City**, 12 loci, pegs still blank.
Live at <https://locvthanh.github.io/memory_os/scene.html?id=future-city>.

## Concept

A recreation of a supplied illustration: a solarpunk river capital at the end of
a bright afternoon, seen from a planted terrace ninety metres above the water,
with one figure at the glass rail. Everything the picture contains is in the
scene — the pledge sign on the neighbouring tower's soffit, the civic screen on
the block opposite, the river and its boats, the wide near bridge, the elevated
monorail, the glass dome, the two ring roads, the halo ring threaded around a
cluster of five-hundred-metre shards, airships, a saucer sky-garden, a low sun
and a big pale moon.

Tony asked for two things that pull against each other: *match the reference
framing* and *make it walkable*. The scene resolves that by solving the camera
first and then building a real city out past the frame, rather than building a
stage set that only works from one seat.

## Solving the camera

The illustration is 1536x1024. Two horizontal circles are visible in plan — the
halo ring around the towers and the elevated ring road — and the minor/major
ratio of their projected ellipses gives the focal length directly. Both landed
on **f = 1050 px**, i.e. 24.61 mm on a 36 mm sensor (72.4 deg horizontal).

From there:

| quantity | value | how |
| --- | --- | --- |
| horizon row | py 435 | where sea meets sky on the open right-hand water |
| camera pitch | 4.2 deg down | `atan((512 - 435) / 1050)` |
| camera height | 90 m above the water | the figure is 236 px tall at 7.4 m, and his feet and the boats sit at the same screen height while being 7 m and 215 m away |
| sun | 0.526, 0.848, 0.069 | back-projected from px (1425, 348) |
| moon | 0.457, 0.852, 0.256 | back-projected from px (1345, 110) |

Every landmark was then back-projected from its pixel box: the spire tip on row
8, the halo ring spanning px 672-1090 on row 352, the dome 187 px wide on row
565, the near bridge deck on row 790, the train at px 1100, the figure's feet at
(175, 888). `city_core.py` carries the projection helpers (`proj`, `from_px`,
`at_z`, `scale_at`) and `verify.py` back-projects the finished geometry to diff
it against the measured pixel table. The hero render matches the reference to
within a couple of pixels on the spire, the ring, the dome and the figure.

Two corrections mattered more than expected:

* **Height changes depth.** Solving the dome's distance as if its base were at
  water level put it at 724 m; at its real plinth height of 25 m it is at 523 m.
  Anything raised has to be solved with its own z or it lands 40% too far away.
* **The skyline can eat the sun.** With a 4 deg sun the light ray is only 184 m
  up at the tower line, which is exactly how tall the mid-rise was. The skyline
  profile in `block_height()` therefore falls off in the wedge the sun sits in
  — which is also what the reference does.

## Scene structure (by collection)

| collection | what |
| --- | --- |
| `Camera`, `Lights` | the solved camera; a warm key raised to 25 deg for shading plus a cool fill |
| `Terrain` | `Water` (river, bay, sun-glitter baked into the vertex colours, plus a 30 km disc underneath) and `Land` (46 m heightfield over the core, 230 m apron beyond) |
| `City` | `CityBlocks` (procedural blocks with setbacks), `CityGreen` (roof gardens, parks), `CityGlow`, and `Downtown` — the podium, the eight-shard hero cluster, the halo ring, the two ring roads and the glass dome |
| `Infra` | four river crossings, the riverside roads, the monorail viaduct and its three-car train |
| `Sky` | `Backdrop` (three mountain bands, the far shore, the moon), `SkyHalo` (the sun's graded halo), airships, sky-taxis, the saucer garden |
| `Foreground` | the five stepped terraces, the glass rail, the figure, the chart kiosk, the pledge-sign block and the screen block |
| `Signage` | the two text objects |
| `Props` | boats and the riverside tree lines |
| `Loci` | `Locus_01` .. `Locus_12` |

## Materials & fonts

One white base material per surface family, with the actual colour carried
**per face** in a `fvar` FLOAT_COLOR CORNER attribute multiplied into Base Color
by a `ShaderNodeVectorMath` MULTIPLY. That keeps the whole city on ~8 materials
while every face can carry its own aerial-perspective haze, sun-facing warmth
and random variation. `MB.poly(pts, col, corners=[...])` also takes *per-corner*
colours, which is what draws the sun's radial halo and the soft cloud edges.

* A mesh that misses the `fvar` attribute renders **black** — the text objects
  are curves, not meshes, so they get plain emission materials of their own.
  (This bit the first render: white-on-navy signage came out black-on-navy.)
* `view_transform = 'Standard'`. AgX turns flat illustration colour to mud.
* Aerial perspective is baked into vertex colour (`hz()`), not fogged, so it
  survives glTF export.

## Technical notes

* **Blender 5.2 compositing.** `scene.node_tree` is gone; it is
  `scene.compositing_node_group` and wiring it wrong renders the frame **pure
  black at full speed** — 0.11 s "renders" with a 310 KB black PNG. Compositing
  is off in this scene and the sun's bloom is geometry instead.
* **The world's `Generated` vector is unreliable** for placing a sun glow, so
  the halo is three camera-facing vertex-graded fans plus a disc, at 29.9-30.6 km.
* The moon sat exactly on the old 60,000-unit far clip and was invisible until
  `clip_end` went to 250,000.
* `render_viewport_to_path` renders the *viewport*: switch the workspace to the
  Image Editor and it returns black. Render with `bpy.ops.render.render` to an
  explicit filepath instead.
* The city is generated inside a view frustum **or** a 2 km ellipse round the
  core, so it still holds up from the aerial and terrace cameras rather than
  ending in a void two metres outside the hero frame.

## Web app export & integration

`scripts/future_city_export.py` does three things before `build_glb.py` exports:

1. **Radial depth compression about the hero eye.**
   `r' = 700 + 1200 * tanh((r - 700) / 1600)` folds 30 km into a 1.9 km disc
   with everything inside 700 m untouched. The vertical scale uses the same
   factor but is anchored on the **water plane, not the eye**: eye-anchored
   compression puts the horizon exactly where the hero camera had it, but it
   lifts the far sea into a bowl rising to eye height, which is fine in a still
   and absurd in a scene you can fly around.
2. **Drops `SkyHalo` and the moon's four faces.** Both are billboards aimed at
   the hero eye; they are the picture's sun and moon, not objects.
3. **Flattens every `fvar` material** to attribute-straight-into-Base-Color and
   makes `fvar` the active colour layer, so
   `export_vertex_color='ACTIVE'` carries the whole palette as COLOR_0.

Result: 8.5 MB, 23 meshes, 21 of them carrying COLOR_0, bbox +-1900 x 0-748 —
inside the viewer's 2000-unit far plane.

`src/scenes/future-city.js` ships `startView` at the illustration's own frame
and twelve loci. Because the pegs span three orders of distance — the terrace
rail at 15 units, the spire at 1030 — none of them can share one stand-off, so
every locus names its own `anchorFrom` with a negative `anchorDistance`, which
keeps the camera on the viewer's side of the peg and looking the way the
picture looks.

Three stops needed their line of sight checked rather than guessed, by
raycasting anchor -> peg in the live viewer:

* **The Line** — the screen block stands between the terrace and the train, so
  its anchor comes in over the river from `[-40, 0, -120]`.
* **The River** — the near bridge stands between the terrace and the boats, so
  this is the one stop that goes past and turns back (`anchorFrom [0, 0, -400]`).
* **The Ring Road** and **The Halo** — both pegs were originally at the
  geometric centre of their ring, i.e. inside the towers. They now sit on the
  arcs themselves.

## Possible follow-ups

* The pegs are blank. This room is built for something with a **scale
  structure** — twelve items that run from one you can touch to one on the
  horizon — rather than a flat list.
* A dusk variant: the emissive slots, the screens and the train windows are
  already separate objects, so a night version is a lighting change, not a
  rebuild.
* The figure at the rail is a placeholder low-poly; if this scene ever wants a
  person in it properly, that is the object to replace.
* Cross-links: [[the-stack]] is the other whole-city room (night, abstract);
  [[lunar-base]], [[sky-loft]], [[seaside-bungalow]] and [[glacier-deck]] are
  the other camera-solved-from-a-picture rooms.
