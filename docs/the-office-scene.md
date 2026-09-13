# The Back Office — `the-office`

> **Where it lives.** All of it is in the web app: `src/scenesjs/office/`
> (plan, signs, room, index) plus `src/scenes/the-office.js`. **There is no
> Blender source and no `.glb`.** The retired generator is still in the
> blender_models repo at `office_scenegen/` with `TheOffice.blend` — kept for
> the record, run by nothing.
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
own back office — where the rooms nobody has found a use for hang on a hook
until they do. It is built in the same key as **Room OS** (cream walls, dark
plank floor, ceiling panels, corkboard, whiteboard, filing cabinets, a desk
with a lamp on it), which makes it read as infrastructure rather than subject.

## The room re-runs the audit every time it is opened

**Nothing is baked.** `build` in `src/scenesjs/office/index.js` is the hook
`Viewer` calls instead of loading a model, and on every open it:

1. reads `SCENES` from `src/scenes/index.js` — ids and titles;
2. **fetches every other `src/scenes/*.js` as text** and scans it with
   `/\blink:\s*['"]([a-z0-9-]+)['"]/g` — the same regex the Python generator
   used, run in the browser;
3. subtracts: orphans = registered − linked-to − itself;
4. lays out exactly as many bays as that needs and assembles the room;
5. writes the stops onto the config before resolving.

So: **push a scene and walk in — the door is there.** Wire a scene up from
somewhere else and its door is gone on the next visit. Nothing to re-run,
nothing to remember, nothing to commit but the scene itself.

Three details that matter:

- **Its own files are skipped in step 2.** This room links to every orphan, so
  counting its own edges would empty the corridor.
- **Sources are fetched as text, not imported.** Importing thirty configs would
  drag in every procedural scene's whole implementation — cafef alone is
  seventy kilobytes of trading floor, and its module reads the clock on import.
  Fetching text evaluates nothing and has no side effects.
- **A fetch that fails contributes no edges.** That can only make the corridor
  longer, never hide a room.

### Why it stopped being a Blender scene

It was one, for about two hours on 2026-09-13. A Python generator
(`office_scenegen/build_office.py`) read the repo and baked the corridor into a
2.9 MB glb plus a generated `the-office.data.js`. It worked — and twice in the
same afternoon a finished scene had no way in, because the generator is a thing
a person has to remember to run. A room whose whole purpose is *not forgetting
about rooms* cannot be the thing that gets forgotten. The runtime build is 40 KB
of JavaScript, four draw calls and ~17k triangles, and it cannot go stale.

## Structure

- **`plan.js`** — the audit, the `SECTIONS` table, and the layout maths.
  `M` holds the proportions (an 11 × 9 m office, a 6 m corridor, 2.3 m doors,
  bays 2.7 m apart). `plan()` returns `slots`, `wings`, `bayZ`, `end`.
- **`signs.js`** — everything with words on it, painted to canvas at load: door
  plates, brass numbers, wing banners, the whiteboard, the register, the framed
  plan. This is what buys the Vietnamese diacritics: a plate simply says
  whatever the registry calls that scene, so **SÀN BẢNG ĐIỆN** comes out right
  where the Blender build needed Segoe UI baked in at a megabyte.
- **`room.js`** — the geometry, through the kit in `src/scenesjs/kit.js`. Every
  static piece goes into one of two `Batch`es and comes out as two merged
  meshes: one lit, one unlit for the transoms and strip lights.
- **`index.js`** — `build()`, the stops, and `NOTES`, the hand-written pegs
  keyed by the scene each door opens. A door whose scene has no note falls back
  to that scene's own hub blurb, so a door that appeared by itself is never
  blank.

## The wings

Doors are grouped, and door colour follows the group, so a door says what kind
of room it opens before you read its name:

| Wing | Colour | Holds |
|---|---|---|
| The Subjects | amber | things the palace is *about* |
| The Systems | teal | machines and bodies |
| Work & Worlds | indigo | places and the working life |
| The Quiet Rooms | green | empty palaces, rooms to be in |
| The New Wing | violet | **catch-all** — anything not yet classified |

A scene is assigned by id in `SECTIONS` in `plan.js`. Anything not listed lands
in The New Wing, which is the honest place for it. Where a wing holds an odd
number of doors the spare slot is left as blank wall reading `ROOM FOR ONE
MORE`, which both keeps the next wing starting on the west side and reads as
what it is.

## Tour

`3 + n + 1` stops: **The Register** (the desk, and the return leg to Portal
Island), **The Map** (the corkboard, one card per registered scene, orphans in
amber, the wired ones joined by red string), **The Corridor** (the arch,
looking up it), one stop per door, then **Not Yet Built** at the empty frame.

`loci: []` in the config is a placeholder — `build` fills it before resolving,
which is legal because `Viewer` reads `config.loci` only after the build
promise settles. An empty array would otherwise switch the transport bar off
permanently, the way it does for `glacier-deck`.

## How you get through a door

The doors are scenery. This viewer has no collision and no proximity triggers,
and fly mode hides the locus panel, so flying up to a leaf does nothing — which
is the first thing anyone tries, because Room OS's doors *are* real and you
walk through them at 0.65 m.

So each door stands a **tappable badge** out in the corridor at handle height,
0.62 m off the wall. Tap it — `Viewer._wireLocusPicking` works in fly mode as
well as on the rails — and the panel opens with that door's `Open door NN →`.
The badge is the handle.

The badge prints the **door's** number, not the tour index, through the
`labelText` override in `loci.js` / `LocusLabels.js`: the number is already
painted on the wall beside the handle, and a badge reading 4, 5, 6… next to it
would contradict it. It is tinted with its wing's colour, so badge, leaf and
banner agree.

## Camera and light

An interior, so every stop takes a **negative** `anchorDistance`: the rig sits
on the corridor-centre side of the locus and looks outward instead of backing
through a wall. A door stop's `anchorFrom` is the corridor centreline at that
door's own z, so the camera crosses to the opposite wall and faces the leaf
square on at 3.3 m.

`shadows: false`. The room is two merged meshes, and its ceiling is part of the
same object as its floor, so there is no way to tag a ceiling the way the baked
version tagged `ROOF_`; one shadow map would put the whole interior in the
dark. Light is therefore mostly flat `ambient` — which is honest, since the
room is lit by its own ceiling panels. The hemisphere light is kept low on
purpose: it hands a downward-facing surface its *ground* colour, and the
viewer's ground colour is a dark olive, which turned every ceiling brown at the
first attempt.

## Technical notes

- **Text has to clear the thing it sits on.** Inherited from the Blender build,
  and still true: every plate's canvas plane sits proud of its backing.
- **A canvas laid flat comes out upside down.** The register needed
  `rotation.set(-π/2, 0, π)`, not `rotation.x = -π/2` — the second lays it flat
  but leaves it readable only from the wrong side of the desk.
- **Badge picking** resolves through `sprite.userData.locusIndex`, not the
  sprite's position in the label group. `buildLocusLabels` skips a `hideLabel`
  locus, so the two lists drift — this was opening the wrong stop in
  `pin-factory`, which hides ten of sixteen.
- **Don't clobber `index.js`.** Twice in one day a session wrote a copy of the
  registry it had staged before another scene was added, silently deleting that
  scene's entry — once it was `the-office` itself, and the live site answered
  "Unknown scene" for a room that was fully deployed. Re-read the file
  immediately before editing it.

## Possible follow-ups

- The corridor is a fast index, not a replacement for the hand-wiring in
  `docs/scene-map.md`. Every edge added there removes a door here, which is the
  point: **the room should be trying to empty itself.**
- Walking through a door would still beat tapping a badge. `plan()` has every
  door's position and target, so proximity entry in `FreeMove` is a small
  change whenever it is wanted.
- The wing table is hand-kept. Anything unclassified lands in The New Wing,
  which is fine, but it wants a look every few scenes.
- The key cabinet's hooks and the corkboard's cards are counted from the repo
  but carry no labels. Scene ids on them would make the office readable without
  walking the corridor.
