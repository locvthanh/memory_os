# The Bellows Cathedral — `body-lungs`

Scene 2 of the Human Body series ([[human-body-series]]). Sources in
`blender_models/lungs_scenegen/`; the .blend is
`blender_models/BellowsCathedral.blend`.

Live: <https://locvthanh.github.io/memory_os/scene.html?id=body-lungs>

## Concept

The lungs as a building walked in the direction the air goes. Deliberately the
opposite room to [[body-heart]] — that one is a dark machine hall of slabs and
doors, this one is pale, tall and full of light — because the two organs are
about different things. A heart is a pump and reads as machinery. A lung is a
*surface*, and the only reason it has the shape it has is to hold as much of
that surface open as will fit in a chest.

The walk is one-way: portico (nose) → gate (larynx) → ribbed nave (trachea)
→ fork (carina) → branching hall → bronchiole → the line where dead space ends
→ the domes. The floor of the cathedral is held up by the diaphragm, which is
the point of the last third of the tour: the vault you have been standing on
is the muscle that does the breathing.

**The "why" object** (the series rule — every scene needs one) is the tennis
court at stop 14. It is built at true size and labelled as the only unmagnified
thing in the building, because that is the area of all the alveolar wall the
tour just walked over.

Topology kept honest where the metaphor bends the material: the cartilage rings
really are C-shaped and open at the back where the oesophagus runs; the right
bronchus really is wider and straighter; alveoli share walls with their
neighbours; the barrier really is water film → alveolar cell → capillary cell
→ blood.

## Scene structure (by collection)

| Collection | Contents |
| --- | --- |
| `01_Portico` | Ground, plaza, columns, turbinate scrolls, larynx ring, epiglottis, vocal folds |
| `02_Nave` | The trachea as an open-ended tube, twelve C-rings, membranous strip, oesophagus above it, the cilia carpet and mucus |
| `03_Branching` | Carina wedge, both main bronchi with rings, the peanut, five recursive generations, the cross-section gauge bars |
| `04_Cathedral` | Mezzanine, piers, ramp, threshold arch, the two bronchioles, the zone line, respiratory bronchiole with buds, eight alveolar domes, surfactant, and the wall-section exhibit |
| `05_Vessels` | The capillary mesh over the main dome, pulmonary artery and vein, bronchial artery |
| `06_Diaphragm` | The dome at rest, its flattened position, the arrows |
| `07_Exhibit` | The tennis court at true size, with a person |
| `08_Labels`, `09_Loci`, `10_Rig` | as in every scene in the series |

## Technical notes

- `scenegen_common.py` (new, in `blender_models/`) now holds the bmesh
  primitives both body scenes share — pulled out of `build_heart.py`. Note
  that `_finish` and `_srgb` start with an underscore and therefore do **not**
  arrive through `from scenegen_common import *`; import them by name.
- Two local primitives were added here: `add_arc` (a partial torus — the C of
  a cartilage ring) and `add_dome` (an icosphere with the faces pointing one
  way deleted, so you can walk into it).
- **A capped cylinder seen end-on is a wall.** Three stops on the first pass
  were staring at the end cap of the nave, the larynx collar and the
  bronchiole cones. `add_pipe` builds them with `cap_ends=False`.
- The first pass was also blown out white — a pale palette, a bright world, an
  `exposure` of 0.9 and six-figure area lamps compound. The fix was to deepen
  eleven materials, halve the lamps and drop exposure to -0.15.
- Labels face -Y and the tour runs south to north, so a long string sitting on
  the centre line crosses the frame of every stop behind it. The cathedral
  labels are offset to x = ±19..34, and the diaphragm sign exists twice: once
  facing south and once facing west (rot `(pi/2, 0, -pi/2)`) for stop 13,
  which looks east under the mezzanine.
- `verify_stops.py` again did all the real work — four rounds of it. Copy it
  first for scene 3.

## Web app export & integration

- `build_lungs.py` bakes the `Locus_NN` empties and exports
  `models/body-lungs.glb` (15.3 MB, 714 objects) directly.
- `src/scenes/body-lungs.js`: background `0xdfe7ec`, fog 140/900, hemisphere
  1.2 / ambient 0.95 warm / sun 2.2 / shadowExtent 120, travel 7 s, dwell 12 s,
  default `anchorDistance` -24 — much larger stand-offs than the other rooms,
  because the building is 300 m long.

## Possible follow-ups

- Real memory pegs; the descriptions teach the lung but hold nothing yet.
- Animate one breath: the diaphragm has both positions modelled already.
- The glb is the largest in the repo. Most of it is extruded text; dropping
  `extrude` on the small labels would take a good slice off.
- A second exhibit for the pressure story (a bell jar with a rubber sheet),
  which is what actually makes stop 13 click for most people.

Related: [[human-body-series]], [[body-heart]] (the other half of the loop —
its stop 8 is this whole building).
