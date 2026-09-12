# The Glacier Deck — `glacier-deck`

> **Save location convention.** The Blender source lives at
> `C:\Users\ASUS\Desktop\Loc\blender\blender_models\GlacierDeck.blend`, never the
> Desktop root. The generator is
> `blender_models/scenegen_glacierdeck/` (`gd_*.py`, rebuilt in one call);
> preview renders are `blender_models/GlacierDeck_[A-D]_*.png`.
>
> This doc belongs in the MemoryOS Claude Project as
> `claude/glacier-deck-scene.md`. It is checked in here because the session that
> built the scene had no Projects tool — copy it across.

## Concept

Built from a reference photograph the user supplied, not from a brief: a timber
sitting platform on a cobbled promontory at sunset, a gnarled pine leaning over
it from the left, a shelf of stacked-stone cairns and bonsai along one edge, a
lit lantern on a side table by the gate, and a crevassed glacier two hundred
metres below running out to a snow range still holding the last light.

Sibling of [[meditation-ledge]] and deliberately a different room: sunset not
dawn, ice not cloud, a cobbled approach and a shelf of cairns instead of a gate
and a basin. The two are close enough in idea that they had to be kept far
apart in look, or they would blur into one memory.

## No loci, deliberately

This is the first scene in MemoryOS with **no loci at all**: no pegs, no
numbered badges, no rails. It was asked for as "just the scene" from the
start, and after seeing it wired up as a twelve-stop empty palace the call was
to take the stops out again. It is a place to be in, not a sequence to be
walked — you open it and look around.

That needed three small, general changes in the viewer rather than a
scene-specific hack:

- `Walkthrough` now sets an `empty` flag when it is handed no loci and returns
  from its constructor before parking the camera on a stop that does not
  exist; `update`, `next`, `prev`, `restart` and `setFreeMode` all no-op on it.
  Previously zero loci threw on `this.stops[0].anchor`.
- `Viewer.start` hides the whole transport bar when `loci.length === 0` —
  including the Free Move / Tour Mode toggle, since free move is then the only
  mode — along with the tour caption and the locus panel.
- `.transport` sets its own `display: flex`, which beats the UA `[hidden]`
  rule, so `style.css` restates `.transport[hidden] { display: none; }` the way
  `.tour-controls` and `.music-toggle` already do. Without it the element is
  `hidden` and still on screen.

Every other scene is untouched: they all have loci, so none of these branches
fire.

The objects are all still there if it ever wants pegs — the setts, the gate,
the lantern, the shelf of stacked cairns, the bonsai, the two cushions, the
incense tray, the pine, the far rail, and the glacier, river and peak below.
Git history has the twelve-locus version (`gd_loci.py`, and the `loci` array in
`src/scenes/glacier-deck.js`) if it is ever wanted back.

## Solving the photograph first

The whole build hangs off one decision made before any geometry existed: the
camera. Measured from the reference (474 x 1004 px) and solved as a 35 mm lens,
sensor-fit vertical, pitched 16° down at (0.35, -12.0, 7.35). With that frozen,
the deck corners, the cushions, the shelf and the lantern were **back-projected**
from their pixel positions onto the deck plane, which is what fixes the deck at
4.6 x 4.8 m, centre (-0.26, 3.25), yawed -7°. The rendered deck bbox lands at
x 27..387, y 666..818 against a reference target of x 43..376, y 647..848.

Worth recording: the reference is **not a geometrically consistent photograph**.
Its foreground is drawn as if from a drone ~30° above, its background near eye
level; no single camera satisfies both. The build favours the background and
pushes the deck as low in frame as one consistent camera allows, which is why
the paving reads slightly flatter than in the original.

## Scene structure (by module)

- **gd_world.py** — EEVEE settings, AgX, 540 x 1144 portrait, the sky (a custom
  gradient plus a dot-product sun-glow lobe up-valley), a low warm sun with a
  cool sky fill, a 9 km emissive cloud dome and a valley mist volume.
- **gd_terrain.py** — the landscape. `near_ground()` is a cartesian heightfield
  (the promontory, with a flattened pad under the deck and cobbles); `far_land()`
  is the interesting one, below; `left_spur()` is the dark flank at the left
  edge; `river()` is a narrow strip in the gorge.
- **gd_deck.py** — 28 individually jittered planks, joists, rim beams, posts and
  a step; the right-hand rail with two fixed slat panels and a gate hung a few
  degrees open; the lamp post and its arm.
- **gd_ground.py** — ~1,500 hand-laid setts on a jittered offset grid (each a
  flattened jittered icosphere, per-stone colour), boulders with chips at their
  feet, and scrub kept off the paving and off the deck.
- **gd_props.py** — the shelf and its four cairns, three potted pines, loose
  stones, two zafu, the incense tray and burner, the side table, the lantern
  (with an emissive glass box and a point light), a tea set.
- **gd_veg.py** — the hero pine (S-curved trunk, eight main limbs, needle pads
  built as flattened clusters of small tufts), background conifers along the
  cliff lip and the left spur, and shrubs.
- **gd_loci.py** — bakes `Locus_01..12` into collection `09_Loci`.

## Technical notes

Things that cost time and are worth not rediscovering:

- **The noise function was silently broken.** `vnoise` clamped its input
  coordinates to [0, 1], so every call of the form `fbm(u * 14, v * 14, ...)`
  evaluated at the same clamped corner and returned a **constant**. The symptom
  was smooth featureless blobs everywhere and mountains that refused to rise,
  which reads like a geometry bug and is not one. It is now periodic (wraps
  every 1.0). Any noise helper written for this project should wrap, not clamp.
- **Build the distant landscape in camera-polar coordinates.** A cartesian grid
  spends its vertices uniformly over a 5 km square while the lens only sees a
  26° wedge, so the visible terrain came out blurry at any affordable
  resolution. `far_land()` meshes (distance, bearing) instead — log-spaced
  rings, dense through the glacier band — which holds roughly constant pixel
  density from 55 m to 16 km.
- **An envelope makes a straight horizon.** Driving ridge tops toward
  `env = z_cam - k*d` (the line that lands them at a chosen screen height) puts
  *every* ridge on the same line. Fixed by building the relief downward from a
  crest — `Z = top - relief * (1 - R)` — with a large-scale `lift` mask deciding
  which massifs get anywhere near the envelope.
- **Frequencies are in angular units, not metres.** Because the far field is
  parametrised by (bearing, log distance), a noise scale is self-similar: the
  same number gives the same apparent detail at 600 m and at 6 km.
- `bpy.ops.mesh.primitive_*_add` fails inside Blender MCP (the known
  `'Context' object has no attribute 'active_object'`). Everything here goes
  through a small bmesh accumulator (`gd_util.Part`) instead, which also makes
  joining free — build into one `Part`, emit one object.

## Web app export & integration

`scripts/glacier_deck_export.py`, wired into `build_glb.py` under
`"glacier-deck": []` (there are no loci at all — nothing baked, nothing
injected). Export:
`blender -b ...\GlacierDeck.blend -P scripts/build_glb.py -- glacier-deck`
→ `models/glacier-deck.glb`, 14.3 MB, 29 nodes, no merge step.

Two problems specific to this scene:

- **Depth.** The landscape is authored at true scale and runs to 16 km; the
  viewer's camera far plane is 2000, so the entire mountain range would be
  clipped. Every vertex (and every locus empty) is scaled **radially about the
  hero camera's eye**: `p' = eye + (p - eye) * s`, with
  `|p'-eye| = 140 * (d/140)^0.42` beyond 140 m. A radial scale about the eye is
  exactly the transform that leaves the hero view unchanged, so the peaks keep
  their angular size and their depth order and land inside 1.1 km; anything
  nearer than 140 m keeps true scale and true parallax. The peak ends up at ~440
  units, which is what `src/scenes/glacier-deck.js` records.
- **Colour.** The scene is procedural end to end and glTF carries no Noise or
  ColorRamp nodes. The terrain already kept its colour in a POINT attribute
  (`fvar`, renamed to `Col`); every other material is reduced to one flat colour
  and written to `Col` with a per-vertex position-hash tint, so planks, bark and
  needles keep variation instead of going plastic-flat. All materials become
  Principled + Color Attribute and the export runs with
  `export_vertex_color="ACTIVE"`.

The deck is also recentred on the origin at export, so the scene's own centre
is the world's — which is what makes `startView` readable, and what a locus rig
would need if one is ever added back. `ROOF_` is prefixed onto `FarLand`,
`River` and `LeftSpur` so the viewer skips `castShadow` on them.

Lighting note: the viewer's sun is a fixed overhead **white** light, so the
sunset has to come from the ambient term — `hemisphere: 0.5`, `ambient: 0.8` at
`0xffc890`, `sun: 1.5`, background `0xdcb488`, fog 40/900. Leaving the default
blue-ish hemisphere high makes the whole valley read as an overcast noon.

Verified live at
`https://locvthanh.github.io/memory_os/scene.html?id=glacier-deck` — no badges,
no transport bar, free move only, opening on the photograph's framing.

## Possible follow-ups

- **Pegs, if it ever wants them.** It ships with none on purpose; the objects
  are there to hang them on, and git history has the twelve-stop version.
- The glacier's crevasse field is still noticeably periodic — two warped sine
  bands. A Voronoi-based fracture would read better close up.
- The far horizon above the peaks is a flat hazy band where the terrain simply
  ends at 16 km; more haze hides it but a proper far ridge layer would be
  better.
- The cobbled apron is ~1,500 separate stones and about a third of the glb's
  vertex budget. An instanced or decimated version would cut the download.
- No sound. `MusicPlayer.js` exists and `audio/` is already in the repo; wind
  would suit this room.
