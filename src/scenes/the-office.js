// The Back Office — the room where the unwired scenes are kept.
//
// docs/scene-map.md audited which scenes nothing else points at: they sit on
// the hub list but nowhere in the world. This is the room that fixes that in
// one move. A small office in the same key as Room OS — cream walls, dark
// plank floor, ceiling panels, a desk, a corkboard, filing cabinets — whose
// north wall opens onto an arcade of doors, one per orphan scene.
//
// THERE IS NO GLB, AND THAT IS THE WHOLE POINT. This scene used to be baked in
// Blender from a generator that read the repo, which meant a new scene only
// grew a door when somebody remembered to re-run Blender and commit 2.9 MB of
// model. Twice it didn't get re-run, and twice a finished room had no way in.
// So the room is now assembled in the browser, like [[tuoitre-vn]] and
// [[cafef-vn]]: `build` below is the hook Viewer calls instead of loading
// `model`. It fetches every scene config as text, scans the `link:` edges,
// works out which scenes nothing points at, and measures out exactly as many
// bays as that needs — every time the page is opened. Push a scene and walk
// in: the door is there. Wire a scene up from somewhere else and its door is
// gone on the next visit. Nothing to re-run, and nothing to forget.
//
// The stops are generated the same way, so `loci` starts empty and `build`
// writes it (Viewer reads config.loci only after the build promise resolves).
// Never hand-add a locus here; add a note to NOTES in
// src/scenesjs/office/index.js instead, keyed by the scene the door opens.
//
// Reached from [[portal-island]] gate 5, which was an `xx` placeholder; the
// Register stop is the return leg, so the pair rule in docs/scene-map.md
// ("every door is a pair") holds.
//
// HOW YOU GET THROUGH A DOOR. The doors are scenery — this viewer has no
// collision and no proximity triggers, and in fly mode the locus panel is
// hidden. Each door therefore stands a tappable badge out in the corridor at
// handle height, tinted with its wing's colour and printing the DOOR's number
// rather than the tour index (the number is already painted on the wall beside
// the handle). Tap it and the panel opens with that door's `Open door NN →`.
import { build } from '../scenesjs/office/index.js';

const config = {
  background: 0xd8dee6,
  // A hemisphere light hands a downward-facing surface its GROUND colour, and
  // the viewer's ground colour is a dark olive -- which with no shadows and no
  // ceiling bounce turned every ceiling in here brown. So most of the light is
  // flat ambient (this room is lit by its own panels, not by a sun) and the
  // hemisphere is only there to keep the floor from matching the ceiling.
  lighting: {
    hemisphere: 0.55,
    ambient: 1.25,
    ambientColor: 0xfff4e8,
    sun: 0.75,
    shadowExtent: 40,
  },
  // The room comes out of the kit as two merged meshes — one for everything
  // lit, one for the transoms and strip lights. A single shadow map over a
  // merged 40 m mesh whose ceiling is part of the same object would put the
  // whole interior in the dark; the old baked version dodged that by tagging
  // its ceilings ROOF_, which a merge cannot carry.
  shadows: false,
  // Standing just inside the office looking straight up the corridor, which is
  // the first thing anyone does here.
  startView: {
    position: [0, 1.72, 7.2],
    lookAt: [0, 1.7, -6],
  },
  labels: { worldSize: 0.55, offsetY: 0.65 },
  walkthrough: {
    travelSeconds: 4,
    dwellSeconds: 9,
    eyeHeight: 0.15,
    anchorDistance: -3.3,
    loop: true,
  },
  // Filled by build(). An empty array here would switch the transport bar off
  // for good (see Viewer), but build resolves before Viewer reads it.
  loci: [],
  build: (ctx) => build(ctx, config),
};

export default config;
