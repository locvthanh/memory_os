# The Back Office — `the-office`

> **Save location convention.** The Blender source lives at
> `C:\Users\ASUS\Desktop\Loc\blender\blender_models\TheOffice.blend`, never the
> Desktop root. The generator is
> `blender_models/office_scenegen/build_office.py`; the stop checker is
> `blender_models/office_scenegen/verify_stops.py`; preview renders are
> `blender_models/OFF_stop*.png`.
>
> This doc belongs in the MemoryOS Claude Project as
> `claude/the-office-scene.md`. It is checked in here because the session that
> built the scene had no Projects tool — copy it across.

## Concept

`docs/scene-map.md` audited the palace and found the interesting kind of
orphan: **a scene that is registered on the hub but that no other scene points
at.** It exists on the index page and nowhere in the world. The audit proposed
six phases of hand-wiring. This room is the other move: give every orphan a
door in one place, immediately, and keep doing it forever.

It is deliberately the plainest room in MemoryOS. Every other scene is a world;
this one is a corridor with a filing cabinet in it, because it is the palace's
own back office — the place where the rooms that nobody has found a use for are
kept on a hook until they do. It is built in the same key as **Room OS**
(cream walls, dark plank floor, ceiling panels, corkboard, whiteboard, filing
cabinets, a desk with a lamp on it), which makes it read as infrastructure
rather than as a subject.

## The rule that makes it work: the room is generated, not drawn

**Nothing about the corridor is hard-coded, and no locus is hand-written.**
`build_office.py` reads this repo every time it runs:

1. `src/scenes/index.js` → the registered scenes and their titles.
2. every other `src/scenes/*.js` → every `link:` edge in the palace.
3. orphans = registered − linked-to − itself.

Its own files (`the-office.js`, `the-office.data.js`) are skipped in step 2 on
purpose: this room links to every orphan, so counting its own edges would empty
the corridor on the second run.

It then lays out exactly as many bays as the orphans need and writes:

| Output | What it is |
|---|---|
| `blender_models/TheOffice.blend` | the source |
| `models/the-office.glb` | the model |
| `src/scenes/the-office.data.js` | **generated** — every door and every locus position |
| `office_scenegen/stops.json` | camera stops, for `verify_stops.py` |

`src/scenes/the-office.js` imports the data file and adds only words. So:

- **Write a new scene** → re-run the generator → the corridor grows a bay, a
  door appears with the scene's real title on its plate, and a stop appears in
  the tour. If the scene has no hand-written peg in `NOTES`, its own hub blurb
  is used, so the door is never blank.
- **Wire a scene up from somewhere else** (a Portal Island gate, an Athenaeum
  room) → re-run → its door disappears and the register count drops.
- **Empty the register** → the room has done its job and becomes something
  else.

The same pattern the repo already uses for `scenes2d/civil-war.data.js`:
generated geometry, hand-written prose, never hand-edit the generated file.

## Scene structure (by Blender collection)

- **01_Shell** — a 11 × 9 m office (walls, cornice, baseboard, staggered plank
  floor in four tones) whose north wall is a 6 m arch; and the corridor beyond
  it, 6 m wide, as long as the doors need. Ceilings are named `ROOF_*` so
  `Viewer` skips `castShadow` on them — without that the single overhead
  directional light puts the whole interior in shadow.
- **02_Doors** — per slot: casing, a recessed leaf with two sunk panels, handle
  and two hinge plates, a coloured transom light, a name plate and a brass
  number disc. A slot with no door gets a blank recessed panel instead.
- **03_Signs** — the door plates and numbers, the wing banners, `NOT YET BUILT`
  over the empty frame, and the office lettering. All flat text, no extrude:
  extruded label text was two thirds of the glb in the body scenes.
- **04_Office** — the register desk (open book reading `ORPHANS`, *n* of *N*),
  chair, lamp; the corkboard carrying one card per registered scene with the
  orphans in amber and the wired ones joined by red string; the whiteboard
  (`EVERY DOOR IS A PAIR` / *n* `rooms with no way in`); four filing cabinets; a
  bookcase; a key cabinet with one hook per door; two windows; two plants; and
  a framed plan of the building that draws the number of bays actually built.
- **05_Light** — ceiling panels in the office, a strip over every bay in the
  corridor, and the glow behind the empty frame at the end.
- **09_Loci** — `Locus_01..NN` empties, baked by the generator.

## The wings

Doors are grouped, and door colour follows the group, so a door says what kind
of room it opens before you read its name:

| Wing | Colour | Holds |
|---|---|---|
| The Subjects | amber | things the palace is *about* |
| The Systems | teal | machines and bodies |
| Work & Worlds | indigo | places and the working life |
| The Quiet Rooms | green | empty palaces, rooms to be in |
| The New Wing | violet | **catch-all** — any scene not yet classified |

A scene is assigned by id in the `SECTIONS` table in `build_office.py`.
Anything not listed lands in The New Wing, which is the honest place for it: a
room nobody has thought about yet. Where a wing holds an odd number of doors
the spare slot is left as blank wall with `ROOM FOR ONE MORE` over it, which
both keeps the next wing starting on the west side and reads as what it is.

## Tour

`3 + n + 1` stops: **The Register** (the desk, and the return leg to Portal
Island), **The Map** (the corkboard), **The Corridor** (the arch, looking up
it), then one stop per door in corridor order, then **Not Yet Built** at the
empty frame.

Every door locus sets `hideLabel: true`. The door already carries its own
painted number; a floating tour badge reading 4, 5, 6… beside it would
contradict it — same reason `pin-factory` hides badges at its ten numbered
stations. The four room stops keep theirs.

## Camera

An interior, so every stop uses a **negative** `anchorDistance`: the rig sits
on the room-centre side of the locus and looks outward, instead of backing
through a wall. A door stop's `anchorFrom` is the corridor centreline at that
door's own y, so the camera always crosses to the opposite wall and faces the
leaf square on at 3.3 m — which frames leaf, transom and name plate together
with a 50° fov. The generator computes all of it; `verify_stops.py` re-derives
the same anchors from `stops.json` and renders exactly what the walkthrough
will see, which is the check to run before shipping a rebuild.

## Technical notes

- **Text has to clear the thing it sits on.** The name plates rendered blank on
  the first pass: the text planes are zero-thickness and sat 5 mm *inside* the
  0.04 m plate box. Everything readable is now pushed 0.085–0.115 m proud of
  its backing.
- **Don't panel the archway.** The first build put a "reveal" box across the
  whole corridor mouth, which is a wall. It is three boxes now — two jambs and
  a head.
- **Font**: `Segoe UI` (`C:/Windows/Fonts/segoeui.ttf`), loaded once by the
  generator's own `text()` helper, because scene titles can carry Vietnamese
  diacritics that Blender's default font does not have. It costs about 1 MB of
  glb over the default face — worth it.
- **Door height drives everything above it.** At `DOOR_H = 2.45` the name plate
  was pushed into the cornice and cropped out of the walkthrough frame. 2.30 m
  leaves room for transom, plate and cornice under a 3.30 m ceiling.
- Built through the Blender MCP addon, so bmesh only — no
  `bpy.ops.mesh.primitive_*`. Boxes are batched into one mesh per material
  (`Batch`), which is what keeps 16 doors, a plank floor and 27 corkboard cards
  down to ~220 objects.

## Web app export & integration

- Registered in `src/scenes/index.js` as `the-office`, "The Back Office".
- `src/scenes/the-office.js` = words only; `src/scenes/the-office.data.js` =
  generated geometry. **Never hand-edit the data file.**
- Entered from **[[portal-island]] gate 5**, which was one of the three `xx`
  placeholder gates (`docs/scene-map.md`, Phase 4). The Register locus links
  back, so the pair rule holds.
- Lighting is overridden (`hemisphere 1.15`, `ambient 0.9`, warm ambient,
  `sun 1.0`, `shadowExtent 40`) — the default constants leave a 3.3 m room
  nearly black, the same problem `the-white-house` hit.

## Possible follow-ups

- The corridor is a fast index, not a replacement for the hand-wiring in
  `docs/scene-map.md`. Every edge added there removes a door here, which is the
  point: **the room should be trying to empty itself.**
- Nothing yet links *into* the doors' destinations from the destinations' own
  side. A scene reached through this corridor has no way back except the hub —
  the pair rule is only half kept for the orphans themselves.
- The wing assignment is a hand-kept table. Anything unclassified lands in The
  New Wing, which is fine, but it wants a look every few scenes.
- The key cabinet's hooks and the corkboard's cards are counted from the repo
  but carry no labels. Tags with scene ids on them would make the office
  readable without walking the corridor.
