# The Pump House — `body-heart`

Scene 1 of the Human Body series ([[human-body-series]]). Sources live in
`blender_models/heart_scenegen/` (never the Desktop root); the .blend is
`blender_models/PumpHouse.blend`.

Live: <https://locvthanh.github.io/memory_os/scene.html?id=body-heart>

## Concept

The heart as a two-storey industrial building you walk through at about
1:130,000 — the scale at which one red blood cell is a metre across, which is
the ruler for the whole series. Right side blue, left side red, a septum wall
down the middle they never cross, atria upstairs, ventricles below.

The room is built around **one comparison**: the right ventricle's wall is
1.2 m here and the left's is 4.0 m, and the tour walks past both. Same stroke
volume, same beat — one side pushes blood ten centimetres to the lungs, the
other pushes it to your toes. Because a wall seen from inside a chamber just
looks like a wall, the comparison is also stood up in the open south of the
building as two labelled samples on a plinth (stop 12), which is the only
frankly museum-like object in the scene and the one that actually teaches.

Series rule being followed: the metaphor may change the material, never the
topology. Valves are doors, but there are three leaflets on the right and two
on the left, the semilunar cusps face backwards, the pulmonary artery carries
blue blood and the pulmonary veins carry red.

## Scene structure (by collection)

| Collection | Contents |
| --- | --- |
| `01_Shell` | Septum, four chambers as walled rooms, atrium floors pierced by the valve orifices, papillary pillars, catwalks, the wall-thickness exhibit |
| `02_Valves` | Tricuspid (3 leaflets) and mitral (2) with rings and chordae; pulmonary and aortic semilunar cusps |
| `03_Vessels` | Vena cavae, pulmonary trunk and arteries, four pulmonary veins, aorta and arch with its three branches, coronaries, one-way gates on the venous road home |
| `04_Lungs` | Two three-lobed masses, an alveolar honeycomb face, and the emissive blue-to-red swap band between them |
| `05_Conduction` | SA node with spreading pulse rings, the atrial run to the AV node, the AV delay, bundle of His down the septum, Purkinje fan across both ventricle floors |
| `06_Cells` | ~130 red cell discs (blue on the right, red on the left), white cells, platelets, and one cell on a plinth as the scale ruler |
| `07_Exchange` | The capillary bed 45 m south: arteriole in, seven one-cell-thick crossings, venule out, gold energy markers |
| `08_Labels` | Extruded text, all facing south (the building's front) |
| `09_Loci` | `Locus_01..17` |
| `10_Rig` | Lights and camera, dropped at export |

## Materials & fonts

Flat Principled colours (the `PALETTE` dict), plus four emissives: `E_Node`
and `E_Wire` (cyan — the series' signal colour), `E_Energy` (gold — the series'
energy colour), `E_O2`. Series colour rules: red/blue means oxygenated vs not
and nothing else; cyan is signal; gold is energy. Default Blender font — the
scene is English-only.

## Technical notes

- Built headless (`blender -b -P build_heart.py`), bmesh only, so the same
  script can be pasted through the Blender MCP addon. Headless Blender is
  launched from the *interactive* Blender's Python via a list-argv
  `subprocess.run`, because this session's device shell is a Linux VM that
  cannot run `blender.exe`.
- `verify_stops.py` is the useful part of this build. It reimplements
  `src/viewer/Walkthrough.js`'s anchor formula and renders exactly what the
  web camera will see at each of the 17 stops, at 480x270. Four rounds of it
  caught what no overview render shows: cameras standing inside 4 m walls,
  the ascending aorta passing straight through the left atrium and filling
  three stops with red, name-plates a metre from the lens, and a pulmonary
  valve buried in the ventricle's north wall. **Build this file first for
  every remaining scene in the series.**
- Area lights point -Z; the first pass had them all flipped with
  `rot=(pi, 0, 0)` and lit the ceilings. Interiors also need roughly ten
  times the wattage they look like they need, plus `exposure = 1.6` under AgX.
- The atrium floors are four slabs around a square well plus a round collar,
  not a disc with a hole: a disc big enough to be a floor also becomes a
  30 m saucer hanging over the whole building.
- Text faces -Y, so any stop that looks north reads it mirrored. The exchange
  labels are rotated 180 deg for that reason; the rest of the tour approaches
  from the south.

## Web app export & integration

- Procedural path: `build_heart.py` bakes the `Locus_NN` empties and exports
  `models/body-heart.glb` (3.1 MB; label text is flat, not extruded, which is
  most of that saving) itself — nothing to add to
  `scripts/build_glb.py` or `build_glb.ps1`.
- `src/scenes/body-heart.js`: background `0x140e13`, fog 90/620, hemisphere
  1.15 / ambient 0.9 warm / sun 1.5 / shadowExtent 60, travel 7 s, dwell 12 s.
- Every locus names its own `anchorFrom` with a negative `anchorDistance` —
  the [[meditation-ledge]] pattern. An interior scene whose loci sit in floors
  and walls would otherwise park the camera outside the building.
- Verified live: 17/17 loci load and the tour runs.

## Possible follow-ups

- Real memory pegs. The descriptions currently teach the heart; they are not
  yet holding anything of Tony's.
- Animate the beat: the leaflets, the Purkinje fan and the cell discs all
  exist as separate objects, so a one-second loop is mostly keyframes.
- A side door marked *what a heart attack is* — the coronary stop already
  sets it up, and the disease layer for the series has to start somewhere.
- Sound: a beat at rest vs a beat at 170.

Related: [[human-body-series]], [[meditation-ledge]] (the anchor pattern),
[[the-stack]] (the other scene built as one big walkable structure).
