# The Human Body series — design doc

Eleven standalone MemoryOS scenes, one per organ system, built so that you can
understand how the body works rather than only recite its parts.

Status: **design agreed; scenes 1 and 2 built** (Sept 2026).
Related: [[macroeconomics-series]] (hub-and-spoke, the other multi-scene set),
[[software-engineering-series]] (one big city, the other approach that was
rejected here).

## The two decisions that shape everything

**1. Standalone scenes, not a hub.** Each system gets its own room with its own
door on the MemoryOS hub. A body-wide hub was considered and dropped: the
systems are already connected by the *bloodstream*, and every scene reaches the
others through that, so an extra lobby would only add a click. Cross-links go in
the locus panels instead (`Go to scene →`), which the app already supports.

**2. Walkthrough-scale metaphor.** You are shrunk. You are not looking at a
diagram of a heart; you are standing inside a four-storey pump house with doors
the size of barn gates slamming above you. Every scene is a *building or
landscape at human scale that happens to be an organ*, which is the whole reason
the method of loci works: you remember rooms you have stood in.

The rule that keeps this honest: **the metaphor may change the material, never
the topology.** Valves are doors, but they are in the right order and they open
the right way. Nephron tubules are pipework, but the counter-current loop really
does run down and back up. If a choice would make the picture prettier and the
mechanism wrong, the mechanism wins.

## Art direction

Each scene is visually distinct (house rule for MemoryOS — mixed styles are
deliberate), but the series shares three signals so the body reads as one body
across eleven rooms:

| Signal | Meaning |
| --- | --- |
| **Red / blue** | Oxygenated vs deoxygenated — used only for that, in every scene |
| **Warm gold glow** | Energy: ATP, glucose, active transport, anything that costs fuel |
| **Cyan glow** | Signal: nerve impulses, hormones, action potentials |

Scale cue in every scene: one **red blood cell disc ≈ 1 m across**. That fixes
the shrink factor at roughly 1 : 130,000 and makes a capillary a 1.5 m crawlspace,
an alveolus a 3 m dome, and a whole heart a building you can walk around in.

Flow direction is always shown by moving or repeated objects (cell discs,
chevrons on the floor, arrows cut into pipes) — never by text alone.

## The eleven scenes

Build order is the column on the left: circulation first because every other
system plugs into it, then the systems that trade with it, then the ones that
build and control the body.

| # | Scene id | Title | The metaphor | Loci |
| --- | --- | --- | --- | --- |
| 1 | `body-heart` | The Pump House | A two-storey industrial pump house split down the middle; valves are doors, the conduction system is the wiring | 17 |
| 2 | `body-lungs` | The Bellows Cathedral | A ribbed nave (trachea) branching into smaller naves, ending in domes that are alveoli; the floor of the whole cathedral is the diaphragm | 14 | *built* |
| 3 | `body-gut` | The Long Canal | A nine-metre canal ride through a food factory: grinding hall, acid vat, chemical dock, the villi forest, the drying works | 18 |
| 4 | `body-brain` | The Signal City | A domed city of lobe districts, with one neuron walked end to end as a cable tunnel and a synapse as a loading dock | 20 |
| 5 | `body-kidney` | The Filter Works | A water-treatment plant: pressure sieve, three reclaim galleries, the counter-current loop as a pair of stacked tunnels | 14 |
| 6 | `body-immune` | The Garrison | Border forts (lymph nodes) on a drainage canal, a training academy (thymus), a foundry (marrow), and an archive of memory cells | 16 |
| 7 | `body-muscle` | The Rope Engine | Inside one sarcomere: rows of myosin cranes ratcheting along actin cables, calcium as the whistle, ATP as the coin | 13 |
| 8 | `body-bone` | The Quarry Cathedral | Bone as a cathedral of trabecular struts, with a demolition-and-masonry crew endlessly rebuilding it and the marrow foundry in the crypt | 14 |
| 9 | `body-endocrine` | The Broadcast Towers | Seven radio towers beside a river (the bloodstream); each broadcasts on its own colour, and only buildings with the matching aerial respond | 15 |
| 10 | `body-skin` | The Border Wall | A cross-section fortress: shield roof, the conveyor that builds it from below, cooling wells, hair towers, oil pumps, the collagen scaffold | 14 |
| 11 | `body-repro` | The Two Workshops | Clinical and plain: gamete production lines, the halving hall (meiosis), the hormonal calendar, conception and the first week | 15 |

Total: 170 loci. Roughly a year of spaced review at one room a month.

### 1. The Pump House — `body-heart` (built)

Right side blue, left side red, split by the septum wall; atria upstairs,
ventricles downstairs; the tour descends the right side, goes out to the lungs,
comes back into the left side, descends again, and leaves by the aorta.

The teaching point the building is built around: **the left ventricle's wall is
three times the thickness of the right's**, and you can see it because you walk
past both. The right side pushes blood a few centimetres to the lungs; the left
side pushes it to your toes.

Loci, in tour order:

1. **The Intakes** — superior and inferior vena cava, two blue pipes
2. **Right Atrium** — the blue holding hall
3. **The Clock** — sinoatrial node, the pacemaker that starts every beat
4. **Tricuspid Door** — three leaflets, with the tether cables below it
5. **The Tethers** — chordae tendineae and papillary muscles: why the door cannot blow backwards
6. **Right Ventricle** — the thin-walled chamber
7. **Pulmonary Door** — three pocket cusps, one-way
8. **The Lung Loop** — where blue becomes red
9. **The Returns** — four pulmonary veins, the only veins carrying red
10. **Left Atrium** — the red holding hall
11. **Mitral Door** — two leaflets, the one that fails most often
12. **The Thick Wall** — left ventricle; the comparison shot
13. **Aortic Door** — the last door out
14. **The Arch** — aorta, and the three branches to head and arms
15. **The Crown** — coronary arteries, the heart feeding itself first
16. **The Wiring** — AV node, bundle of His, Purkinje fibres down the septum
17. **The Exchange** — a capillary bed where red turns blue, and the one-way gates on the road home

### 2. The Bellows Cathedral — `body-lungs` (built)

Pale, tall and full of light, on purpose: the opposite room to the Pump House,
because what this organ is about is *surface*. The walk is one-way and it is
the air's way, portico to alveolus, and the "why" object is the tennis court
at the end — built at true size, the only unmagnified thing in the building,
because that is the area of all the alveolar wall you just walked over.

Loci, in tour order: the Door (turbinates), the Gate (epiglottis and folds),
the Ribbed Nave (C-rings open at the back), the Escalator (cilia and mucus,
running the other way), the Fork (right bronchus wider and straighter), the
Branching Hall (cross-section explodes, air stops), the Bronchiole (at rest
vs in spasm), the Line (dead space ends), the Dome, Half a Micron (the wall
in section), the Mesh, Both Traffics, the Floor That Moves (diaphragm), the
Court.

See `docs/body-lungs-scene.md`.

### 3–11 — sketched

Each remaining scene gets its own build session and its own doc under
`docs/<id>-scene.md`. The loci lists above the fold are the contract; the
geometry is decided at build time. Three notes that apply to all of them:

- **Every scene needs one "why" object.** In the Pump House it is the wall
  thickness comparison. In the Bellows Cathedral it is the total alveolar
  surface drawn as a floor area (a tennis court's worth folded into a chest).
  In the Filter Works it is the 180 litres filtered per day against the 1.5
  litres that leave. Find it first, build the room around it.
- **Prefer one deep thing over ten shallow ones.** The Signal City walks a
  single neuron end to end rather than naming twelve brain parts.
- **Leave the pegs blank at first.** Titles name the object; descriptions say
  what the object is good for holding. Real memory content goes in later, by
  hand, the way every other MemoryOS room works.

## Pipeline notes specific to this series

- Sources in `blender_models/<system>_scenegen/build_<system>.py`, built
  headless, exporting `Locus_NN` empties baked in collection `09_Loci`.
- Scene ids are all `body-*` so the hub groups them naturally when sorted.
- Interior scenes need a **negative** `anchorDistance` and usually a per-locus
  `anchorFrom` (the chamber centre), or the camera backs through a wall —
  see `src/scenes/meditation-ledge.js` for the pattern this series copies.
- Blood-cell discs are instanced from one mesh and merged by material at export
  or the glb grows without teaching anything.

## Open questions

- Whether to add a twelfth room for **homeostasis** — the feedback loops that
  tie all eleven together (a control room with eleven gauges). Probably yes,
  built last, once the other rooms exist to link to.
- Whether the disease scenes (originally part of this idea) become their own
  series or become a second layer inside each room — e.g. a side door in the
  Pump House marked *what a heart attack is*.
