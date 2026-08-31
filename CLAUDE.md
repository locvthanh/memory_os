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
src/
  main.js              hub: builds scene cards from the registry
  scene.js             viewer entry: reads ?id, boots Viewer, shows errors
  style.css            all CSS (linked via <link>, NOT imported in JS —
                       there is no bundler to handle CSS imports)
  scenes/index.js      SCENES registry + getScene(id)
  scenes/<id>.js       per-scene: { walkthrough: {...}, loci: [...] }
  viewer/Viewer.js     renderer/scene/lights/raf loop; loads glb; wires transport
  viewer/Walkthrough.js  camera rig (see below)
  viewer/loci.js       buildLoci(gltfScene, config)
  viewer/LocusOverlay.js  the #locus-panel DOM wrapper
```

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

## Loci authoring

`buildLoci` reads objects named `Locus_01`, `Locus_02`, … from the loaded
glb: world position + trailing number = tour order. Title and description
always come from the scene config, keyed by that number. If the glb has no
`Locus_*` objects, the config's `position: [x,y,z]` is used as a fallback.

**`city.glb` currently has no `Locus_*` empties**, so `src/scenes/city.js`
positions are hand-placed placeholders (a couple sit awkwardly close to
buildings). Fix by adding empties in Blender on the next city re-export.

## Adding a scene

1. Build the model in Blender. Add Empties named `Locus_01..NN` where each
   locus should sit (order = tour order).
2. Export to `models/<id>.glb` (see the export snippet below).
3. Create `src/scenes/<id>.js` — `walkthrough` tuning + one `loci` entry per
   Empty id (`title`, `description`; `position` optional fallback).
4. Add an entry to `src/scenes/index.js`.

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
