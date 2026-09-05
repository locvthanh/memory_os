# memoryOS

A "memory palace" web app. The home page lists 3D scenes; opening one runs a
system-controlled walkthrough past that scene's predefined memory loci. You
can look around during the tour but you cannot move — the camera is on rails.

**Live:** https://locvthanh.github.io/memory_os/ — auto-deployed from `main`
by `.github/workflows/deploy.yml` (GitHub Pages, no build step).

## Run

```bash
npm run dev
```

Open http://localhost:5173 . There is **no build step and no npm
dependencies** — the app is plain ES modules. Three.js is vendored into
`vendor/three/` and wired up with an import map in each HTML page. A tiny
zero-dependency Node static server (`server.js`) serves the files; any static
server works. Two pages: `index.html` (hub), `scene.html?id=<scene>`.

All asset paths are **relative** (`src/…`, `models/…`, `./vendor/…`) so the
site works both locally and under the GitHub Pages project path
`/memory_os/`. Do not change them back to site-absolute (`/src/…`).

> Why no Vite: this machine's Application Control policy blocks unsigned
> native Node addons (esbuild/rollup), so bundlers can't run here.

## Structure

- `src/scenes/index.js` — registry of scenes (id, title, blurb, model URL).
- `src/scenes/<id>.js` — per-scene walkthrough tuning + loci (title,
  description, fallback position).
- `src/viewer/` — Three.js viewer, loci extraction, camera rig, overlay.
- `models/<id>.glb` — exported Blender models, fetched at runtime.
- `vendor/three/` — vendored Three.js (build + GLTFLoader/OrbitControls/BufferGeometryUtils).

## Adding a scene

1. Build the model in Blender. Place Empties named `Locus_01`, `Locus_02`, …
   where each memory locus should sit (their order drives the tour).
2. Export to `models/<id>.glb`
   (`export_format='GLB', export_apply=True, export_yup=True`).
3. Add a `src/scenes/<id>.js` config with a `loci` entry per Empty id
   (title + description; `position` is only a fallback if the Empty is
   missing).
4. Add an entry to `src/scenes/index.js`.

See `CLAUDE.md` for the Blender / Blender-MCP workflow and its gotchas.

## Music credits

Per-scene ambient background tracks (`audio/<id>.mp3`), Kevin MacLeod
(incompetech.com), licensed under Creative Commons: By Attribution 4.0
(https://creativecommons.org/licenses/by/4.0/):

- `chinatown-street.mp3` — "Mystery Bazaar"
- `portal-island.mp3` — "Floating Cities"
