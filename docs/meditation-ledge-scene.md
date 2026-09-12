# The Ledge — `meditation-ledge`

> **Save location convention.** The Blender source lives at
> `C:\Users\ASUS\Desktop\Loc\blender\blender_models\MeditationLedge.blend`,
> never the Desktop root. The generator is
> `blender_models/meditation_scenegen/build_meditation.py`; preview renders are
> `blender_models/MedLedge_*.png`.
>
> This doc belongs in the MemoryOS Claude Project as
> `claude/meditation-ledge-scene.md`. It is checked in here because the session
> that built the scene had no Projects tool — copy it across.

## Concept

A meditation space first, a memory palace second. A timber deck cantilevered
eight metres off a granite cliff at dawn, a sea of cloud ninety-five metres
below it, and a snow range across the valley with the sun cresting a saddle.
Chosen over the other candidates (zen room and garden, cave and pool, forest
clearing) because it gives the sitter one dominant direction to face — north,
into the sunrise — and a horizon that does not move.

The ten loci are also the ten stations of a sit, in that order:

| # | Locus | Object | What it is for |
|---|-------|--------|----------------|
| 1 | The Gate | cedar posts and lintel | thresholds; what a sequence starts with |
| 2 | The Water Basin | tsukubai + bamboo spout | continuous / cyclical things |
| 3 | The Stone Lantern | one flame in a stone box | the one item that must not be lost |
| 4 | The Cairn | five stacked flat stones | an ordered set of five; a narrowing hierarchy |
| 5 | The Cushion | zafu, blanket, brass bowl, incense | the centre: thesis, invariant |
| 6 | The Wind Bell | brass bell on a slim post | a trigger or condition |
| 7 | The Edge | the far rail | a boundary, a limit case |
| 8 | The Leaning Pine | wind-bent pine over the drop | what survived by giving way |
| 9 | The Sea of Cloud | the valley, filled | the large, slow and unordered |
| 10 | The Far Peak | snow summit, sun beside it | the goal |

Every peg is still a placeholder: the `title` names the object and the
`description`'s second sentence says what it is good for holding. Both need
replacing with real content.

## Scene structure (by Blender collection)

- **01_Cliff** — a 124 x 74 m heightfield plateau, top at z = 0, boundary
  extruded to z = -430. The lip is `cliff_front(x)`, a two-sine curve with a
  Gaussian notch that pulls the edge back to y ≈ 0.6 at the deck so the
  platform has something to hang over. Plus five buttresses, four spurs, three
  crags standing out of the cloud, 26 boulders and 16 turf patches.
- **02_Deck** — ledger, five joists, two beams, two diagonal struts shoed into
  the rock face at z = -7.4, twenty planks, fascia, a 0.46 m railing on the
  front and outer sides, and two stone steps.
- **03_Seat** — zabuton, zafu, folded blanket, singing bowl and striker,
  incense tray with a five-sphere thread of smoke.
- **04_Approach** — gate, tsukubai with spout and ladle, kasuga-style stone
  lantern with an emissive flame, nine stepping stones, the cairn, the wind
  bell.
- **05_Planting** — three wind-shaped pines (three leaning trunk segments, five
  needle pads each) and 38 grass tufts.
- **06_CloudSea** — a 2.2 x 2.0 km heightfield at z = -95, 46 puffs, 22 near
  shelves and a plume climbing the cliff face.
- **07_Range** — 14 peaks off a base at z = -155, each a low-seg cone with a
  snow cap and three shoulder cones. The peak at (-380, 980) is deliberately
  short: it is the saddle the sun rises through.
- **08_Sky** — the sun disc and its halo at (-520, 1500, 380), three birds.
- **09_Loci** — `Locus_01_gate` … `Locus_10_peak`.
- **10_Rig** — two suns, `MIST_Haze`, and four still cameras (`SeatCam`,
  `ApproachCam`, `EdgeCam`, `WideCam`). Dropped whole at export.

## Materials & lighting

31 flat Principled colours plus two emissive (`E_Flame`, `E_Sun`) and a warm
halo. The two cloud materials carry a little emission (0.16 / 0.28) — without
it the cloud sea is lit only by a 13-degree sun and reads as a grey snowfield
rather than as cloud.

The sky is a hand-built gradient, not an atmosphere model: Texture Coordinate →
Separate XYZ → Map Range → an eight-stop colour ramp from `#8a4a34` below the
horizon up through `#ff9f55` to `#2d4a80` at zenith. Blender 5.2 renamed the
Sky Texture's Nishita enum to `MULTIPLE_SCATTERING`, and the physical model
gave a flat daylight blue at this elevation anyway; the ramp is both
deterministic and prettier. Key light is a 6.4-strength sun at `#ffa860` aimed
along the direction of the sun disc; fill is a 0.72 cool sun from behind the
sitter. `MIST_Haze` is a 3.6 km volume-scatter box at density 0.00013 pooled in
the gulf below the deck — at the first attempt it sat over the deck at four
times that density and whited out the whole scene.

## Technical notes

- Built headless (`blender -b -P build_meditation.py`), so `bpy.ops.mesh.*` was
  available — the script still uses bmesh only, so it can also be pasted
  through the Blender MCP addon.
- Headless Blender was launched from the *interactive* Blender's Python via
  `subprocess.run`, because this session's device shell is a Linux VM that
  cannot run `blender.exe`. `subprocess.Popen` with `shell=True` and a `&&`
  chain silently did nothing; a list-argv `subprocess.run` per invocation
  works.
- `Locus_09` and `Locus_10` were first placed at 70 m and 420 m out — angles
  that pointed the deck-bound camera at bare cloud and bare sky. They now sit
  180 m out over the valley and on the mid-flank of the big peak 1.18 km north.
- The device shell cannot delete files, so a `git commit` run there leaves
  `.git/HEAD.lock` and stray `tmp_obj_*` behind. Commit and push from the
  Windows side instead (the remote is SSH, which the device shell's
  HTTP-only proxy cannot reach either).

## Web app export & integration

- `scripts/build_glb.py`: empty `SCENES["meditation-ledge"]` (loci are baked),
  `DROP_COLLECTIONS` = `("10_Rig",)`, `MERGE_BY_MATERIAL` = `{}` — 340 objects
  collapse to 32 nodes, 1.2 MB. Cameras, lights and animations off.
- `scripts/build_glb.ps1`: `"meditation-ledge" = "MeditationLedge.blend"`.
- `src/scenes/meditation-ledge.js`: background `0xe0a877`, fog 70/1900,
  hemisphere 1.0 / ambient 0.5 warm / sun 2.1 / shadowExtent 45.
- **The rig is unusual for this repo.** Every locus names
  `anchorFrom: [0, 0, 0]` — the deck centre — rather than letting the shared
  centroid decide, because loci 9 and 10 would otherwise drag that centroid
  hundreds of metres out over the valley. With every `anchorDistance` negative,
  the camera always stands on the ledge and looks outward. Locus 5 (the
  cushion, which sits *at* the origin and so has a degenerate direction) uses
  `anchorFrom: [0, 0, 7]` instead, putting the camera just south of the zafu
  looking north past it.
- Verified live at
  <https://locvthanh.github.io/memory_os/scene.html?id=meditation-ledge> —
  10/10 loci, all framed on their subject.

## Possible follow-ups

- Fill in real memory pegs; the room is empty by design.
- A dusk variant: same geometry, the ramp reversed and the lantern doing the
  work. Cheap — it is one palette and one light direction.
- Sound. This is the first scene where an audio bed (wind, the bell, the
  spout) would do more than decorate — `audio/` already exists in the repo.
- A "just sit" mode: hold on locus 5 with the walkthrough paused and a breath
  timer in the overlay, so the scene can be used as a meditation timer rather
  than a tour.

Related: [[misty-valley]] (the other landscape-scale empty palace, and where
the ridge-and-haze approach came from), [[seaside-bungalow]] and [[sky-loft]]
(the other rooms deliberately left empty).
