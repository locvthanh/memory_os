# memoryOS

A "memory palace" web app. The home page lists scenes; opening one runs a
system-controlled walkthrough past that scene's predefined memory loci. You
can look around during the tour but you cannot move — the camera is on rails.

Most scenes are 3D models built in Blender. A scene can also be **2D** — its
own animated HTML/CSS/SVG page, no Three.js — and sits on the same hub, with
the same tour and the same cross-scene links. `The Civil War` is one.

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
server works. Pages: `index.html` (hub), `scene.html?id=<scene>` for 3D scenes,
and one page per 2D scene (`civil-war.html`).

All asset paths are **relative** (`src/…`, `models/…`, `./vendor/…`) so the
site works both locally and under the GitHub Pages project path
`/memory_os/`. Do not change them back to site-absolute (`/src/…`).

> Why no Vite: this machine's Application Control policy blocks unsigned
> native Node addons (esbuild/rollup), so bundlers can't run here.

## Structure

- `src/scenes/index.js` — registry of scenes (id, title, blurb, and either a
  model URL or, for a 2D scene, `kind: '2d'` + `href`), plus `sceneHref()`,
  the one function that knows how to open either kind.
- `src/scenes/<id>.js` — per-scene walkthrough tuning + loci (title,
  description, fallback position). Same file for 2D scenes.
- `src/viewer/` — Three.js viewer, loci extraction, camera rig, overlay.
- `src/scenes2d/<id>.js` + `.css` — a 2D scene's renderer and styles.
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

For a 2D scene, skip steps 1–2, put the page at the repo root and its renderer
in `src/scenes2d/`, and give the registry entry `kind: '2d'` and an `href`.

See `CLAUDE.md` for the 2D scene contract and the Blender / Blender-MCP
workflow with its gotchas.

## Music credits

Per-scene ambient background tracks (`audio/<id>.mp3`), Kevin MacLeod
(incompetech.com), licensed under Creative Commons: By Attribution 4.0
(https://creativecommons.org/licenses/by/4.0/):

- `chinatown-street.mp3` — "Mystery Bazaar"
- `portal-island.mp3` — "Floating Cities"
