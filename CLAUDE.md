# CLAUDE.md

Guidance for Claude Code when working in this repo.

## What this is

**memoryOS** — a memory-palace web app. A hub page lists 3D scenes; opening a
scene runs a **system-controlled camera walkthrough** past a fixed sequence
of **memory loci**. The user can drag to look around but never moves (camera
on rails). Method-of-loci memory training.

Ported from `C:\Users\ASUS\Desktop\Loc\blender\city-viewer` (its `CLAUDE.md`
is the original brief). 3D models are authored in Blender (via Blender MCP),
exported to `.glb`, and loaded at runtime.

## Commands

```bash
npm run dev      # start server.js on http://localhost:5173
```

- **No build, no `npm install`** — there are no dependencies. `npm run dev`
  just runs `node server.js` (a zero-dep static file server). Any static
  server pointed at the repo root works equally well.
- To preview from Claude Code use `preview_start` with the `memoryos-dev`
  config in `.claude/launch.json` (it calls `node.exe` directly because
  `npm` is not on the preview launcher's PATH).

## Why buildless (important — don't "fix" this by adding Vite)

This Windows machine's Application Control policy **blocks unsigned native
Node addons**, so `esbuild` / `rollup` fail to load (`ERR_DLOPEN_FAILED`,
"An Application Control policy has blocked this file"). That rules out Vite
and every bundler that ships a native binary. Node itself (pure JS) runs
fine. npm 11's allow-scripts gate also skips postinstall steps.

So: plain ES modules served from disk. **Three.js is vendored** in
`vendor/three/` (`build/three.module.js` plus trimmed
`examples/jsm/{loaders/GLTFLoader,controls/OrbitControls,utils/BufferGeometryUtils}.js`)
and resolved via a `<script type="importmap">` in each HTML page
(`"three"` and `"three/examples/jsm/"`). To upgrade Three: `npm i three` in a
throwaway dir elsewhere, copy those four files in, test.

## Deployment (GitHub Pages)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which uploads the
repo root as-is and deploys it to GitHub Pages — no build. Live at
`https://locvthanh.github.io/memory_os/`.

Because it's a **project** page (served under `/memory_os/`), every asset
path in HTML/JS is **relative** (`src/…`, `models/…`, `./vendor/…`,
`href="./"`) — never site-absolute (`/src/…`). Keep it that way; absolute
paths 404 on Pages. `.nojekyll` at the root disables Jekyll processing.

## Layout

```
server.js              zero-dep Node static server
index.html             hub page (scene cards)
scene.html             viewer page + import map; reads ?id=<scene>
models/<id>.glb         exported Blender models, fetched at runtime
vendor/three/           vendored Three.js
scripts/generate_city.py   reference only (Blender bpy, not run by the app)
civil-war.html         a 2D scene's own page (see “2D scenes” below)
src/
  main.js              hub: builds scene cards from the registry
  scene.js             viewer entry: reads ?id, boots Viewer, shows errors
  style.css            all CSS (linked via <link>, NOT imported in JS —
                       there is no bundler to handle CSS imports)
  scenes/index.js      SCENES registry + getScene(id) + sceneHref(id)
  scenes/<id>.js       per-scene: { walkthrough: {...}, loci: [...] }
  scenes2d/<id>.js     2D scene renderer (+ .css, + generated .data.js)
  viewer/Viewer.js     renderer/scene/lights/raf loop; loads glb; wires transport
  viewer/Walkthrough.js  camera rig (see below)
  viewer/loci.js       buildLoci(gltfScene, config)
  viewer/LocusOverlay.js  the #locus-panel DOM wrapper
  world/               the living layer: state -> runtime geometry
world/state.json       the world's state — machine-written, never hand-edited
world/chronicle.md     what the world did, one line at a time
tools/tick.mjs         the day tick; run nightly by .github/workflows/tick.yml
```

See **The living world** below before touching any of those.

## How the walkthrough works (`src/viewer/Walkthrough.js`)

Two phases per locus:
- **travel** — the rig lerps camera position + look target from the previous
  stop to the next over `travelSeconds` (smoothstep eased). User input is
  ignored (`controls.enabled = false`).
- **dwell** — camera parked at the stop for `dwellSeconds`. `OrbitControls`
  is enabled but with `enablePan`/`enableZoom` off and `target` pinned
  `lookDistance` units in front of the camera every frame, so dragging
  rotates the view in place instead of orbiting the scene.

Auto-advances after the dwell; `loop: true` wraps around. Transport buttons
(Prev / Pause-Resume / Next / Restart) in `scene.html` are wired in
`Viewer._wireTransport`.

Per-scene tuning lives in `<id>.js` `walkthrough`: `travelSeconds`,
`dwellSeconds`, `eyeHeight`, `anchorDistance`, `loop`.

Radial anchoring measures from the centroid of **all** loci, which only works
while a scene is one cluster. `portal-island` is two — the gate ring plus the
Rosetta square out on its peninsula — and their shared centroid sits in the
empty air between them, aiming the camera up to 109 deg off the gate it is
supposed to be looking at. A locus can therefore set `anchorFrom: [x, y, z]`
(three.js space; only x/z are read) to name its own cluster centre. See
`src/scenes/portal-island.js`, which defines one `PLAZA` and one `SQUARE`
constant and tags every locus with the right one.

Note the rig parks the camera `eyeHeight` **above** the locus and looks down at
it, so the locus is the aim point, not eye level. For a tall subject put the
locus at the subject's mid-height rather than at head height — otherwise the
shot is aimed at its base and the top is cropped.

## Loci authoring

`buildLoci` reads objects named `Locus_01`, `Locus_02`, … from the loaded
glb: world position + trailing number = tour order. Title and description
always come from the scene config, keyed by that number. If the glb has no
`Locus_*` objects, the config's `position: [x,y,z]` is used as a fallback.

**`city.glb` currently has no `Locus_*` empties**, so `src/scenes/city.js`
positions are hand-placed placeholders (a couple sit awkwardly close to
buildings). Fix by adding empties in Blender on the next city re-export.

The regex is `^Locus[_-]?(\d+)`, so a trailing label is fine and useful —
`portal-island` uses `Locus_09_piano`, `Locus_10_hindi` and so on. Only the
number is read. A locus present in the glb but missing from the scene config
still appears in the tour, titled `Locus N` with no description, so add a
config entry for every empty you bake.

A locus can also place and colour its own numbered badge:
`labelPosition: [x, y, z]` (three.js space) replaces `position` + `labelOffsetY`,
and `labelColor` (any CSS colour) replaces the default dark fill.
`world-war-2` uses both: each badge sits on top of a brass pole beside its
monument, where the date-order arcs start and end, and is tinted with the
event's year colour.

A locus with a cross-scene `link` can also set `linkLabel` to replace the
panel's default "Go to scene →" text. `war-museum` uses it for its portal
arches ("Enter the portal: World War II →"), and the two scenes those portals
open (`world-war-2`'s D-Day stop, `civil-war`'s Gettysburg stop) link back.

## Adding a scene

1. Build the model in Blender. Add Empties named `Locus_01..NN` where each
   locus should sit (order = tour order).
2. Export to `models/<id>.glb` (see the export snippet below).
3. Create `src/scenes/<id>.js` — `walkthrough` tuning + one `loci` entry per
   Empty id (`title`, `description`; `position` optional fallback).
4. Add an entry to `src/scenes/index.js`.

For a scene with no model at all, see **2D scenes** below — steps 1 and 2
drop away and the registry entry gains `kind: '2d'` and an `href`.

`scripts/build_glb.py` exports the whole Blender scene, so anything that
exists only for Blender's still renders has to be dropped first — see its
`RENDER_ONLY` dict. `portal-island` drops its backdrop plane, its sky dome and
its two framing cameras; the dome especially, because `Viewer` sets
`castShadow` on every mesh it loads and a 2300-unit emissive shell around the
scene would put the whole island in shadow.

## 2D scenes

Not every palace has to be a model. A scene can be **2D**: its own standalone
page built from HTML, CSS and SVG, with no Three.js, no import map and no glb.
`civil-war` is the first one — it replaced the 3D `civil-war-map` relief plate.

The registry carries the difference, and **nothing else has to know**:

```js
{ id: 'civil-war', title: '...', blurb: '...',
  kind: '2d', href: 'civil-war.html',
  config: () => import('./civil-war.js').then((m) => m.default) }
```

Everything that opens a scene goes through `sceneHref(idOrScene)` in
`src/scenes/index.js` — the hub cards in `main.js` and the cross-scene
"Go to scene →" link in `LocusOverlay`. So a locus in a **3D** scene can link to
a 2D one with the same one-line `link: 'civil-war'` it would use for any other
scene, and the White House's Lincoln locus does exactly that. The 2D page links
back the same way (Appomattox → the White House).

Conventions a 2D scene follows so it still feels like the rest of the app:

- **Live at the repo root** (`civil-war.html`), so every relative path sits at
  the same depth as `scene.html` and the `/memory_os/` Pages prefix keeps working.
- **Content stays in `src/scenes/<id>.js`**, same as a 3D scene: `walkthrough`
  timings plus a `loci` array of `{ id, title, description }`. Only the framing
  fields differ — a 2D scene has no camera, so instead of `anchorDistance` its
  loci carry whatever the renderer needs. `civil-war` uses `w`, the viewBox
  width in map units at that stop.
- **Renderer and styling in `src/scenes2d/<id>.js` / `.css`**, with the CSS
  scoped to a body class (`body.cw`) so it can never collide with
  `src/style.css`.
- **Same transport contract**: Prev / Pause / Next / Restart / Free Move, a
  locus panel that docks as a bottom sheet on a phone, and a `--*-sheet-h`
  custom property published from JS so the controls clear it.

How `civil-war` works: the whole map lives in one `#cw-world` group and the
"camera" is a translate+scale on it, tweened between stops with the same
smoothstep the 3D `Walkthrough` rig uses (zoom is interpolated in log space).
State borders, rivers, the front line and the blockade opt out of that scale
with `vector-effect="non-scaling-stroke"`; pins and labels counter-scale by
`1/k` to hold a constant on-screen size; campaign arrows deliberately do
neither, because their draw-on is a dash offset measured in user units.

Its geometry is generated, not hand-drawn. `scripts/build_civil_war_2d.py`
projects us-atlas `states-10m.json` (public domain) onto the same US Albers
conic the 3D plate used, simplifies it, and writes
`src/scenes2d/civil-war.data.js` together with the hand-authored rivers, front
lines, blockade arcs, campaign arrows and locus pins. Re-run it after editing
any of those; never hand-edit the generated file. The old
`models/civil-war-map.glb` is still on disk and `scripts/build_glb.py` can still
rebuild it, but nothing in the app loads it any more.

## The living world

Some scenes keep moving between visits. `tools/tick.mjs` advances
`world/state.json` once a day (GitHub Actions, 22:00 UTC) and `src/world/`
composites the result onto the loaded glb at runtime. Full design in
`docs/simulated-world.md`. The rule that matters:

> **Canon is hand-built and only Tony writes it. State is machine-written and is
> data only.**

- `models/*.glb` and `src/scenes/*.js` are canon. The tick must never write
  them, and an agent proposing content for them opens a **pull request** rather
  than pushing to `main`.
- `world/*` is state. Nobody hand-edits it; the tick owns it. It is JSON —
  never geometry, never prose the viewer cannot render safely.
- A scene joins by adding one `world: { id, stairX, gateZ, zTop, zBottom }` key
  to its config. A scene without it is untouched by any of this.
- Failure is silent by contract: `attachWorld` returns `null` on a missing
  file, an unknown `version`, or a parse error, and `Viewer` never awaits it. An
  evolving world must not be able to break a finished one.
- `stageOf()` exists twice on purpose — `tools/tick.mjs` and
  `src/world/stages.js`. The tick decides, the viewer draws; change one and you
  must change the other.
- Dropping a ray to find the ground does **not** mean taking the first hit: on a
  plot the first hit is the roof of the house standing there. See `groundAt` in
  `src/world/WorldLayer.js`.
- The day tick is arithmetic only and must stay that way. Anything needing
  judgement belongs in the weekly season tick, which is a human or an LLM
  opening a PR.

Run it by hand with `node tools/tick.mjs --days N` (add `--no-git` to advance
without harvesting commits, `--init` to start the world over).

## Blender / Blender-MCP workflow

Not connected by default (`localhost:9876` refused). To wire it up for Claude
Code: `claude mcp add blender -- uvx blender-mcp`, then in Blender's viewport
N-panel → BlenderMCP → "Connect to Claude". Addon lives at
`..\blender\blender_mcp\addon.py`. Re-connect after every Blender restart.

Gotchas (learned the hard way on city-viewer):
- **Never issue two Blender MCP calls concurrently** — the addon's socket
  server has a race (`WinError 10038`). One call at a time, sequentially.
- If it wedges (persistent hangs/timeouts), fully quit and reopen Blender,
  then reconnect — toggling the panel is not always enough.
- `render_thumbnail_to_path` / `render_viewport_to_path` ignore the path you
  pass and write to a Blender temp dir. To control the output path, run raw
  `bpy` via `execute_blender_code`:
  ```python
  bpy.context.scene.render.filepath = r"C:\...\out.png"
  bpy.ops.render.render(write_still=True)
  ```
- Same for export — run it inside `execute_blender_code`:
  ```python
  bpy.ops.export_scene.gltf(
      filepath=r"C:\Users\ASUS\Desktop\Loc\memory_os\models\<id>.glb",
      export_format='GLB', use_selection=False,
      export_apply=True, export_yup=True)
  ```

## Environment notes

- Shell is **Windows PowerShell 5.1** — no `&&` chaining; use `;` or separate
  commands.
- `node` / `npm` (installed via winget) need a fresh terminal, or a PATH
  refresh from Machine + User env, to be visible.
- The in-app browser's screenshot can lag a frame or two behind the live
  render — verify walkthrough state via `read_page` / a DOM check
  (`#locus-progress` text) rather than trusting a single screenshot.
